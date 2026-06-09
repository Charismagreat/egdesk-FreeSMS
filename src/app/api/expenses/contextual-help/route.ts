import { NextResponse } from 'next/server';
import { queryTable, insertRows } from '../../../../../egdesk-helpers';

export async function POST(req: Request) {
  try {
    const { hintKey, hintText } = await req.json();

    if (!hintKey || !hintText) {
      return NextResponse.json({ success: false, error: 'hintKey and hintText are required' }, { status: 400 });
    }

    // 1. DB 캐시 조회
    console.log(`[AI 도움말] DB 조회 시도: ${hintKey}`);
    const cacheRes = await queryTable('ai_contextual_help', { filters: { hint_key: hintKey } });
    const cachedRow = cacheRes.rows && cacheRes.rows.length > 0 ? cacheRes.rows[0] : null;

    if (cachedRow) {
      console.log(`[AI 도움말] 캐시 발견! 바로 재사용합니다.`);
      return NextResponse.json({
        success: true,
        explanation: cachedRow.ai_explanation,
        cached: true
      });
    }

    // 2. 캐시가 없으면 Gemini API 호출을 위해 DB에서 API 키 조회
    const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    const apiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: '대시보드(시스템 설정)에서 구글 AI API 키를 먼저 등록해주세요.' 
      }, { status: 400 });
    }

    // 3. Gemini API 호출용 프롬프트 구성 (단일 콤보로 구성하여 지시 준수 극대화)
    const promptText = `
당신은 중소기업의 지출 및 회계 관리를 돕는 아주 친절하고 품격 있는 전문 AI 경리 어시스턴트입니다.
사용자가 화면의 입력 필드나 기능 영역 위에 마우스를 올렸을 때 노출할 상세한 한국어 도움말을 작성해 주세요.

대상 기능 항목: ${hintKey}
항목 기본 설명: ${hintText}

[출력 및 작성 규칙 - 절대 엄수]
1. 반드시 친절하고 정중한 한국어 경어체(~입니다, ~하세요, ~해 드립니다 등)를 사용하여 설명하십시오.
2. 이 기능이 비즈니스(지출 관리) 측면에서 왜 필요한지(목적)와 어떻게 조작해야 하는지(방법/주의사항)를 3~4줄 내외(공백 포함 200~250자)로 조리 있게 설명하십시오.
3. 기계적인 서론("네, 설명하겠습니다", "아래는 도움말입니다" 등)은 전면 생략하고 바로 본론의 도움말 첫 단어부터 즉시 시작하여 출력해야 합니다.
4. "3-4 lines: Yes", "Constraint satisfied", "characters count" 등 프롬프트 지시 준수 여부를 확인하거나 요약하는 문장 및 기호는 절대 출력물에 포함하지 마십시오. 오직 사용자에게 보여줄 '도움말 설명 본문'만 한글로 완결하여 반환해야 합니다.
`;

    console.log(`[AI 도움말] 캐시 없음. Gemini API 호출 시작: ${hintKey}`);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: promptText }] }
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 500
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Google Gemini API Error');
    }

    const data = await response.json();
    const aiExplanation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!aiExplanation) {
      throw new Error('AI 설명 생성 실패');
    }

    // 4. AI 토큰 감사록 기록
    try {
      const promptTokens = data.usageMetadata?.promptTokenCount || 0;
      const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = data.usageMetadata?.totalTokenCount || 0;
      
      if (totalTokens > 0) {
        await insertRows('ai_token_usage_logs', [{
          model: 'gemini-3.5-flash',
          purpose: `contextual-help-${hintKey.substring(0, 15)}`,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens
        }]);
      }
    } catch (e: any) {
      console.error('⚠️ AI 토큰 감사 로깅 실패:', e.message);
    }

    // 5. DB 캐시 테이블에 저장 (1회성 생성)
    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    await insertRows('ai_contextual_help', [{
      hint_key: hintKey,
      hint_text: hintText,
      ai_explanation: aiExplanation,
      created_at: nowStr
    }]);

    console.log(`[AI 도움말] 새로운 설명 생성 및 DB 캐시 저장 완료: ${hintKey}`);

    return NextResponse.json({
      success: true,
      explanation: aiExplanation,
      cached: false
    });

  } catch (error: any) {
    console.error('Contextual Help API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
