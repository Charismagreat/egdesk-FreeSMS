import { NextResponse } from 'next/server';
import { queryTable, insertRows } from '../../../../egdesk-helpers';

export async function POST(req: Request) {
  try {
    const { prompt, customers } = await req.json();

    // DB에서 API 키 조회
    const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    const apiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: '대시보드에서 구글 AI API 키를 먼저 등록해주세요.' }, { status: 400 });
    }
    
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is missing' }, { status: 400 });
    }

    // 구글 Gemini에 전송할 시스템 프롬프트 구성
    const systemPrompt = `
You are an expert CRM marketing assistant for a small business.
Your goal is to parse the user's request and automatically do two things:
1. Identify the target customers based on the user's prompt by looking at the provided JSON list of customers (matching tags, names, etc.).
2. Write a highly engaging, professional marketing message based on the user's intent. Do not include placeholders like [고객명] unless the system supports {고객명} dynamic variables. You should use {이름} or similar if you want dynamic replacement, but prefer generic if unsure. In this system, you can use {고객명} to automatically replace the customer's name.
CRITICAL CONSTRAINT FOR MESSAGE LENGTH:
- SMS (Short Message Service / 단문) is strictly limited to 80 Bytes. In Korean characters, this is exactly 40 Korean characters (each Korean char is 2 Bytes, English/Spaces/Numbers are 1 Byte).
- Unless the user explicitly requests a long message (LMS / 장문), you MUST make the message extremely concise, strictly UNDER 80 Bytes (i.e. under 40 Korean characters).
- If the user explicitly asks for a long/detailed message, or if it is absolutely necessary to convey essential terms, you may write a longer message but it must strictly stay under 2000 Bytes (1000 Korean characters).
- Default to producing a short SMS (under 40 Korean characters) to minimize sending costs for the business owner.

Here is the customer database (JSON):
${JSON.stringify(customers.map((c: any) => ({ id: c.id, tags: c.tags, memo: c.memo, name: c.name })))}

You MUST output your response in valid JSON format ONLY, exactly like this:
{
  "targetIds": [123, 456],
  "messageContent": "여름맞이 20% 특별 세일! {고객명}님을 위한 특별한 혜택..."
}
`;

    // Fetch call to Google Gemini API
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
          { parts: [{ text: prompt }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Google Gemini API Error');
    }

    const data = await response.json();
    
    // 💡 실시간 AI 호출 토큰 감사록 로깅 연동
    try {
      const promptTokens = data.usageMetadata?.promptTokenCount || 0;
      const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = data.usageMetadata?.totalTokenCount || 0;
      
      if (totalTokens > 0) {
        await insertRows('ai_token_usage_logs', [{
          model: 'gemini-3.5-flash',
          purpose: 'marketing-content-pack',
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens
        }]);
      }
    } catch (e: any) {
      console.error('⚠️ AI 토큰 소모량 감사 로깅 실패:', e.message);
    }

    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const resultJson = JSON.parse(responseText);

    return NextResponse.json({ 
      success: true, 
      targetIds: resultJson.targetIds || [],
      messageContent: resultJson.messageContent || ""
    });

  } catch (error) {
    console.error('AI Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }

}
