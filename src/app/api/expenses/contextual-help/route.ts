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

    // 3. Gemini API 호출용 시스템 프롬프트 및 페이로드 구성
    const systemPrompt = `
당신은 중소기업의 회계 및 지출 관리를 돕는 친절한 AI 경리 어시스턴트입니다.
사용자가 지출관리 AI 페이지 내 특정 설정이나 입력 영역 위에 마우스를 올렸을 때 보여줄 상세 도움말을 생성해야 합니다.

주어진 힌트 항목 명칭과 기본 설명을 바탕으로,
1. 이 항목이 지출관리 비즈니스에서 왜 필요한지(목적),
2. 어떻게 사용해야 하는지(방법 및 주의사항),
3. 관련된 유용한 팁이나 예시를 포함하여 아주 친절하고 품격 있는 어조의 한국어로 설명해 주세요.

[제약 조건]
- 분량은 줄바꿈을 적절히 포함하여 3~4줄 내외(공백 포함 250자 전후)로 조리 있게 설명해 주세요.
- 반드시 한국어 존댓말(~입니다, ~하세요 등)을 사용하세요.
- 불필요한 서론("네, 설명해 드리겠습니다" 등)은 생략하고 바로 본론(도움말 내용)부터 시작하세요.
`;

    const userPrompt = `
도움말 대상 항목: ${hintKey}
항목 기본 설명: ${hintText}
`;

    console.log(`[AI 도움말] 캐시 없음. Gemini API 호출 시작: ${hintKey}`);
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
          { parts: [{ text: userPrompt }] }
        ],
        generationConfig: {
          temperature: 0.5,
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
