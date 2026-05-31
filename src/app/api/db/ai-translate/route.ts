import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { queryTable, insertRows } from '../../../../../egdesk-helpers';

export const dynamic = 'force-dynamic';

// 🔑 최고관리자 권한 검증 헬퍼
async function verifySuperAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return false;
    
    const payload = decodeJwt(token);
    const role = (payload.role as string || '').toUpperCase();
    return role === 'SUPER_ADMIN';
  } catch (e) {
    return false;
  }
}

// 📂 [POST] 자연어 질문을 정교한 SQLite SQL 쿼리로 실시간 번역 (Gemini 3.5 Flash)
export async function POST(request: Request) {
  try {
    const isAuthorized = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

    const { prompt, tablesSchema } = await request.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: '번역할 자연어 요청(prompt)이 누락되었습니다.' }, { status: 400 });
    }

    // 1. Google AI API 키 2중 탐지 연동 (DB 우선 -> env Fallback)
    const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    let apiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;
    
    if (!apiKey) {
      apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || null;
    }

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: '⚠️ 구글 AI API 키가 설정되지 않았습니다. [시스템 설정] 대시보드에서 등록하시거나, 서버 환경 변수(GOOGLE_GENERATIVE_AI_API_KEY)를 활성화해 주십시오.' 
      }, { status: 400 });
    }

    // 2. 데이터베이스 스키마 요약 문자열 조립 (AI 전송 컨텍스트)
    const schemaSummary = Array.isArray(tablesSchema) 
      ? tablesSchema.map((t: any) => `- 테이블명: "${t.name}" (실시간 레코드: ${t.count}개)`).join('\n')
      : '테이블 정보가 존재하지 않습니다.';

    // 3. Gemini 전용 시스템 지침 (System Instruction) 구성
    const systemPrompt = `
너는 최고의 SQLite3 데이터베이스 전문가이자, 이지데스크(EGDesk) 서버의 비즈니스 데이터 어시스턴트야.
사용자가 한글 자연어로 요청한 비즈니스 데이터 요구사항을 분석하여, 데이터베이스에 바로 날릴 수 있는 **오류 없는 단 하나의 SQLite3 SQL 쿼리**로 번역하는 것이 너의 의무야.

[중요 제약 조건]
1. 반드시 아래에 나열된 실제 테이블명만을 기반으로 쿼리를 작성해야 해. 임의로 가상의 테이블이나 존재하지 않는 테이블을 유추해내서는 절대 안 돼!
2. 모든 문자열 비교나 컬럼 매핑 시, 제공된 스키마에 부합하는 형태로 쿼리를 가공해. (예: 대소문자나 컬럼명 정확히 매치)
3. SQLite3에 최적화된 SQL 구문이어야 해. MySQL이나 PostgreSQL 전용 구문을 쓰면 컴파일 에러가 나니 주의해. (예: 데이터 형식, 내장 함수 등)
4. 응답은 반드시 유효한 JSON 형식으로만 응답해야 하며, 그 외의 주석, 설명, 백틱(\`\`\`) 마크다운 등은 일체 포함되어서는 안 돼.

[실시간 가동 가능한 데이터베이스 테이블 목록]
${schemaSummary}

[출력 형식 예시 - 오직 이 포맷으로만 응답]
{
  "sql": "SELECT * FROM crm_expenses ORDER BY id DESC LIMIT 5;"
}
`;

    // 4. Google Gemini 3.5 Flash API 호출
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          { parts: [{ text: `사용자 자연어 요청: "${prompt}"` }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2 // 정확도 극대화를 위해 온도를 매우 낮춤
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Google Gemini API 통신 오류가 발생했습니다.');
    }

    const resData = await response.json();
    
    // 💡 실시간 AI 호출 토큰 감사록 로깅 연동
    try {
      const promptTokens = resData.usageMetadata?.promptTokenCount || 0;
      const completionTokens = resData.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = resData.usageMetadata?.totalTokenCount || 0;
      
      if (totalTokens > 0) {
        await insertRows('ai_token_usage_logs', [{
          model: 'gemini-3.5-flash',
          purpose: 'easybot-sql-generation',
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens
        }]);
      }
    } catch (e: any) {
      console.error('⚠️ AI 토큰 소모량 감사 로깅 실패:', e.message);
    }

    const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // JSON 안전 분석
    let resultSql = "";
    try {
      const parsed = JSON.parse(rawText.trim());
      resultSql = parsed.sql || "";
    } catch (e) {
      // JSON 파싱 실패 대비 폴백 구문 추출 (정규식 기반)
      const match = rawText.match(/"sql"\s*:\s*"([^"]+)"/);
      if (match) {
        resultSql = match[1];
      } else {
        resultSql = rawText;
      }
    }

    return NextResponse.json({ 
      success: true, 
      sql: resultSql 
    });

  } catch (error: any) {
    console.error('AI SQL Translate Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
