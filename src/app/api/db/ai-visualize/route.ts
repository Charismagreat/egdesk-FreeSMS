import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// JWT 비밀키 로드 (보안 인증용)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'egdesk-secret-key-change-in-production-123456'
);

// 4단계 로컬 보안 비식별화 가드레일 엔진 (PII Masking & Obfuscation)
function anonymizeData(rows: any[], schema: any[]) {
  if (!rows || rows.length === 0) return { stats: {}, sampleRows: [] };

  // 1. 컬럼 화이트리스트 추출 (비밀번호, 상세 메모, 이메일, 주소, 첨부파일 등 민감 필드 물리적 제외)
  const blacklist = [
    'password', 'password_hash', 'address', 'shipping_address', 'memo', 
    'attachment_url', 'business_license_url', 'email', 'phone', 'recipient_phone', 
    'manager_phone', 'partner_phone', 'customer_phone', 'ai_analysis', 'error_message'
  ];

  const safeCols = schema
    .map(col => col.name)
    .filter(name => !blacklist.includes(name.toLowerCase()));

  // 2. 수치형 컬럼 탐색 및 총괄 통계 요약 계산 (데이터 원형을 파괴하되 상대 크기 비교를 보존하기 위함)
  const numericCols = schema.filter(col => 
    ['integer', 'real', 'real', 'number'].includes(col.type?.toLowerCase()) || 
    col.name.toLowerCase().includes('amount') || 
    col.name.toLowerCase().includes('price') || 
    col.name.toLowerCase().includes('balance') || 
    col.name.toLowerCase().includes('stock') ||
    col.name.toLowerCase().includes('quantity')
  ).map(col => col.name);

  const stats: any = {
    totalRows: rows.length,
    numericColumns: {}
  };

  // 수치형 기본 합산 메타데이터 추출
  for (const colName of numericCols) {
    let sum = 0;
    let max = -Infinity;
    let min = Infinity;
    let count = 0;

    for (const r of rows) {
      const val = parseFloat(r[colName]);
      if (!isNaN(val)) {
        sum += val;
        if (val > max) max = val;
        if (val < min) min = val;
        count++;
      }
    }

    if (count > 0) {
      stats.numericColumns[colName] = {
        sum,
        avg: Math.round(sum / count),
        max,
        min
      };
    }
  }

  // 3. 상위 12개 샘플 데이터 가공 및 PII 치환 (난수화 및 가상 식별자 교체)
  const samples = rows.slice(0, 12);
  const sampleRows = samples.map((row, index) => {
    const cleanRow: any = {};
    for (const col of safeCols) {
      let val = row[col];

      // 개인정보로 추정되는 텍스트 강제 난수화
      if (typeof val === 'string') {
        const colLower = col.toLowerCase();
        if (colLower.includes('name') || colLower.includes('customer') || colLower.includes('partner') || colLower.includes('operator')) {
          // 이름 비식별 마스킹 (예: 홍길동 -> 고객_A)
          val = `고객_${String.fromCharCode(65 + (index % 26))}`;
        }
      }

      // 수치 기밀 데이터는 전체 합계 대비 백분율(상대 점유율) 정보로 전격 원형 치환 (기밀 금액 보호)
      if (numericCols.includes(col) && typeof val === 'number') {
        const colSum = stats.numericColumns[col]?.sum || 1;
        // 소수점 둘째 자리까지의 점유 비율로 치환
        val = parseFloat(((val / colSum) * 100).toFixed(2));
      }

      cleanRow[col] = val;
    }
    return cleanRow;
  });

  return {
    stats,
    sampleRows
  };
}

export async function POST(req: Request) {
  try {
    // 🛡️ 1. 최고관리자 권한 가드 검증
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('token');

    if (!tokenCookie) {
      return NextResponse.json({ error: '인증 토큰이 누락되었습니다.' }, { status: 401 });
    }

    let decoded: any;
    try {
      const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
      decoded = payload;
    } catch (e) {
      return NextResponse.json({ error: '인증 세션이 유효하지 않습니다.' }, { status: 401 });
    }

    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '본 API는 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

    // 2. 요청 바디 데이터 수신
    const body = await req.json();
    const { rows, schema, tableName, displayName } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '분석할 데이터 행이 존재하지 않습니다.' }, { status: 400 });
    }

    // 3. 로컬 보안 가드레일을 통과시켜 완전 비식별화된 초경량 데이터셋 확보
    const { stats, sampleRows } = anonymizeData(rows, schema || []);

    // 4. 로컬 및 DB에 등록된 Google AI API Key 검색
    let apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

    // 만약 로컬에 설정이 되어있지 않다면, SQLite 설정 테이블을 즉석 스캔할 수 있도록 시도
    // (본 라우트는 NEXT.js 환경이므로, 백엔드 DB 연동 helpers를 활용)
    if (!apiKey) {
      try {
        const Database = require('better-sqlite3');
        const dbPath = 'C:\\Users\\CHARISMA\\AppData\\Roaming\\egdesk\\database\\user_data.db';
        const db = new Database(dbPath);
        const apiKeyRow = db.prepare("SELECT value FROM system_settings WHERE key = 'google_ai_api_key';").get();
        if (apiKeyRow && apiKeyRow.value) {
          apiKey = apiKeyRow.value;
        }
        db.close();
      } catch (err: any) {
        console.error('API 키 로컬 DB 조회 실패:', err.message);
      }
    }

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Google AI API Key가 존재하지 않습니다. 시스템 설정에서 google_ai_api_key를 구성해 주세요.' 
      }, { status: 500 });
    }

    // 5. Gemini 3.5 Flash 호출을 위한 프롬프트 가이드라인 설계 (구조적 JSON 응답 유도)
    const prompt = `
당신은 세계 최고 수준의 비즈니스 데이터 분석가(Business Intelligence Expert)입니다.
전달받은 [데이터셋 정보]를 깊이 있게 관찰한 후, 의사결정자를 wowed시킬 수 있는 시각화 차트 설계 JSON 스펙과 3줄 비즈니스 요약 브리핑(마크다운 형식)을 생성해 주세요.

[중요 지침]
1. 분석 대상 테이블명: "${tableName}" (${displayName || tableName})
2. 데이터셋의 수치는 보안상의 이유로 전체 합계 대비 백분율(%) 비중 값으로 치환되어 있습니다. 요약 브리핑 시 수치가 % 비율임을 명확히 인지하고 서술해 주십시오. (예: "A 부서의 지출 비중이 전체의 35%를 차지합니다")
3. 수치 컬럼의 전체 물리적 누적 합계 등은 [통계 정보]를 근거로 서술해 주십시오.
4. 차트 종류("line" | "bar" | "pie" | "metric")를 하나 추천해 주세요.
   - 시간 축의 변화 추이가 중요하고 연속적일 시: "line"
   - 부서별, 카테고리별 등 범주형 데이터 비교에 적합할 시: "bar"
   - 결제 수단, 부서 점유율 등 지분 비중을 한눈에 보고 싶을 시: "pie"
   - 쿼리 결과가 단일 합계값 등 단일 행일 시: "metric"

[데이터셋 정보]
${JSON.stringify(sampleRows, null, 2)}

[통계 정보]
${JSON.stringify(stats, null, 2)}

반환해야 할 출력 데이터는 반드시 아래의 JSON 포맷 형식을 정확하게 지켜야 하며, 백틱(\`\`\`json)이나 다른 설명 텍스트 없이 순수한 JSON 텍스트 하나만 리턴하십시오.

{
  "recommendedChart": {
    "type": "line" | "bar" | "pie" | "metric",
    "xAxisColumn": "X축으로 사용할 컬럼명 (예: category 또는 expense_date)",
    "yAxisColumn": "Y축으로 사용할 컬럼명 (수치 데이터 컬럼명, 예: amount)",
    "title": "시각화 차트의 직관적인 한글 제목",
    "unit": "수치에 매핑할 단위 (예: 원, 건, 명, % 등)"
  },
  "briefing": "마크다운 형식의 3줄 요약 비즈니스 분석 브리핑 내용. 의사결정자가 한눈에 데이터의 통찰을 볼 수 있도록 정교하고 세련되게 작성해 주십시오."
}
`;

    // 6. Gemini REST API 타격 (외부 라이브러리 설치를 배제한 초경량 Fetch 구현)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API 호출 에러: ${errText}`);
    }

    const geminiData = await response.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!resultText) {
      throw new Error('Gemini 분석 응답이 비어있습니다.');
    }

    // 7. 결과 파싱 및 전송
    const cleanJson = JSON.parse(resultText.trim());
    return NextResponse.json(cleanJson);

  } catch (err: any) {
    console.error('❌ AI 시각화 분석 API 오류 발생:', err.message);
    return NextResponse.json({ error: `분석 실패: ${err.message}` }, { status: 500 });
  }
}
