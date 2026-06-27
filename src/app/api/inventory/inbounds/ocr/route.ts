import { NextResponse } from 'next/server';
import { fetchGeminiWithFallback } from '../../../../../lib/gemini-fallback';
import { queryTable } from '@/../egdesk-helpers';

export const maxDuration = 60; // 60초 타임아웃
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, error: '파일이 없습니다.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // 1. DB에서 구글 AI 설정 정보 로드
    const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    const apiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: '구글 AI API 키가 시스템에 등록되지 않았습니다. [시스템 설정 > AI 설정]에서 API 키를 먼저 등록해 주세요.'
      }, { status: 400 });
    }

    const modelRes = await queryTable('system_settings', { filters: { key: 'google_ai_model' } });
    const selectedModel = modelRes.rows && modelRes.rows.length > 0 && modelRes.rows[0].value
      ? modelRes.rows[0].value
      : 'gemini-3.5-flash';

    // 2. 사내 품목 대장 사전 정보를 로딩하여 Fuzzy 매칭 정확도 향상 유도
    const itemsRes = await queryTable('inventory_items', {});
    const masterItems = (itemsRes && itemsRes.rows) ? itemsRes.rows : [];
    const itemReferenceText = masterItems.map((it: any) => 
      `- ID: ${it.id}, 품목명: ${it.name}, 규격: ${it.spec || ''}, 바코드: ${it.barcode || ''}`
    ).join('\n');

    // 3. Gemini Vision OCR 프롬프트 작성
    const prompt = `
제시된 거래명세서, 영수증, 또는 인보이스 이미지(PDF)에서 입고 처리용 명세 정보를 정확하게 추출하십시오.
최종 결과물은 반드시 아래 명시된 **순수 JSON 포맷**으로만 반환되어야 하며, 마크다운 코드 블록(\`\`\`json 등)이나 다른 텍스트는 절대 포함하지 마십시오.

### 📌 사내 등록 품목 대장 레퍼런스:
아래는 현재 시스템에 등록되어 있는 실제 품목들의 목록입니다. 이미지 속 품명과 가장 일치하거나 유사한 품목이 있으면 해당 품목의 ID(matchedItemId)를 매핑해 주십시오.
${itemReferenceText}

### 📌 추출 대상 및 JSON 구조 지침:
1. **partnerName**: 공급자(매출처, 납품자)의 상호명/업체명입니다. (문서 내에 기재가 없는 경우 빈 문자열 ""을 주입하십시오.)
2. **inboundDate**: 입고일자(거래일자)를 표준 "YYYY-MM-DD" 형태로 출력하십시오. (문서 내에 기재가 없으면 오늘 날짜를 지정하십시오.)
3. **items**: 입고된 품목들의 배열입니다.
   - **itemName**: 품목의 이름
   - **spec**: 규격
   - **barcode**: 바코드 (있을 시 추출, 없으면 "")
   - **quantity**: 입고 수량 (숫자 정수)
   - **price**: 입고 단가 (숫자 정수)
   - **matchedItemId**: 위 '사내 등록 품목 대장 레퍼런스' 중 가장 일치하는 품목의 ID(숫자)를 적어주십시오. 신규 등록 품목인 경우 "NEW"를 기입하십시오.
   - **note**: 매핑에 사용되지 않은 다른 열들의 이름과 셀 데이터 전체를 기재해 주십시오. (예: "포장단위: 10개입, 제조사: 삼성")

최종 반환 JSON 형식:
{
  "partnerName": "공급사 상호명",
  "inboundDate": "YYYY-MM-DD",
  "items": [
    {
      "itemName": "품목명",
      "spec": "규격",
      "barcode": "바코드 번호",
      "quantity": 10,
      "price": 25000,
      "matchedItemId": 12,
      "note": "비고 및 미매핑 필드 정보"
    }
  ]
}
Do NOT output anything other than this JSON string. No markdown block wrapper.
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

    const response = await fetchGeminiWithFallback(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini OCR API 통신 실패: HTTP ${response.status}`);
    }

    const aiData = await response.json();
    let responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // JSON 응답 정제 (혹시 있을 수 있는 마크다운 블록 래퍼 제거)
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsedOcr = JSON.parse(responseText);
      return NextResponse.json({
        success: true,
        partnerName: parsedOcr.partnerName || '',
        inboundDate: parsedOcr.inboundDate || new Date(Date.now() + 9*60*60*1000).toISOString().slice(0, 10),
        items: parsedOcr.items || []
      });
    } catch (parseError) {
      console.error('AI 응답 파싱 실패. 원본 응답:', responseText);
      return NextResponse.json({
        success: false,
        error: 'AI 분석 결과가 올바른 JSON 형식이 아닙니다.',
        rawResponse: responseText
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('자율 입고 AI OCR 처리 중 오류 발생:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '이미지 분석 도중 서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
