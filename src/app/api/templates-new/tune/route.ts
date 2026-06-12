export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { queryTable, insertRows } from '../../../../../egdesk-helpers';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';

// 한국 시간 기준 YYYY-MM-DD HH:MM:SS 타임스탬프 획득 헬퍼
function getKoreanTimestamp() {
  const date = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

// 최고 관리자(SUPER_ADMIN) 권한 검증 및 사용자 정보 반환 헬퍼
async function verifySuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return { isAuthorized: false, username: null };
  try {
    const payload = decodeJwt(token);
    const role = (payload.role as string || '').toUpperCase();
    return {
      isAuthorized: role === 'SUPER_ADMIN',
      username: (payload.username || 'admin') as string
    };
  } catch {
    return { isAuthorized: false, username: null };
  }
}

/**
 * POST: 최고관리자가 입력한 자연어 수정 요구사항(feedback)과 기존 HTML 코드를 받아서 Gemini를 통해 수정된 최종 HTML 코드를 반환합니다.
 */
export async function POST(req: Request) {
  const { isAuthorized, username } = await verifySuperAdmin();
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: '최고관리자 권한이 필요합니다.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { html, webHtml, feedback, target = 'all' } = body;

    if (!html || !feedback) {
      return NextResponse.json({ success: false, error: '기존 HTML 코드와 수정 요청 사항(feedback)은 필수입니다.' }, { status: 400 });
    }

    // DB에서 API 키 및 모델 설정 가져오기
    let apiKey: string | null = null;
    let selectedModel = 'gemini-2.5-pro'; // 텍스트 수정 및 세밀한 코드 리팩토링에는 Pro 계열이 유리하므로 기본 Pro 모델로 설정
    try {
      const settingsKeyRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
      apiKey = settingsKeyRes.rows && settingsKeyRes.rows.length > 0 ? settingsKeyRes.rows[0].value : null;

      const settingsModelRes = await queryTable('system_settings', { filters: { key: 'google_ai_model' } });
      if (settingsModelRes.rows && settingsModelRes.rows.length > 0 && settingsModelRes.rows[0].value) {
        selectedModel = settingsModelRes.rows[0].value;
      }
    } catch (dbErr) {
      console.error('API 설정 로드 오류:', dbErr);
    }

    if (!apiKey) {
      apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
    }

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Google Gemini API Key가 설정되지 않았습니다. 시스템 설정을 확인하십시오.' }, { status: 500 });
    }

    const systemPrompt = `
You are an expert web designer and frontend engineer.
Your task is to take the provided HTML codes (printHtml and/or webHtml) and apply modifications based on the user's natural language feedback.

The user can choose to update:
- "printHtml": A classic, print-friendly A4 portrait HTML layout (210mm x 297mm).
- "webHtml": A modern, responsive, and visually stunning web page representation of the same form.

Strict Constraints:
- Output MUST be a single valid JSON object. Do not wrap the JSON in markdown code blocks like \`\`\`json.
- The JSON object must have exactly two keys:
  - "printHtml" (string): The modified (or original) print-friendly HTML.
  - "webHtml" (string): The modified (or original) web page HTML.
- If target is "print", apply feedback ONLY to printHtml, and return webHtml exactly as provided.
- If target is "web", apply feedback ONLY to webHtml, and return printHtml exactly as provided.
- If target is "all", apply feedback to both printHtml and webHtml.
- Ensure you PRESERVE all existing Mustache placeholders (like {{staff_name}}, {{joined_date}}, etc.) unless explicitly asked to modify them.
`;

    const userContent = JSON.stringify({
      target: target,
      feedback: feedback,
      printHtml: html,
      webHtml: webHtml || ''
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: userContent }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errMsg = await response.text();
      throw new Error(`Gemini API 호출 실패: ${response.status} - ${errMsg}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // JSON 파싱 시도
    let updatedPrintHtml = '';
    let updatedWebHtml = '';

    try {
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```')) {
        const lines = cleanedText.split('\n');
        if (lines[0].startsWith('```')) lines.shift();
        if (lines[lines.length - 1].startsWith('```')) lines.pop();
        cleanedText = lines.join('\n').trim();
      }
      const parsedJson = JSON.parse(cleanedText);
      updatedPrintHtml = parsedJson.printHtml || '';
      updatedWebHtml = parsedJson.webHtml || '';
    } catch (parseErr) {
      console.error('Gemini JSON 파싱 오류. Raw text:', text, parseErr);
      throw new Error('AI의 JSON 응답을 파싱하는 데 실패했습니다. 다시 시도해 주세요.');
    }

    // HTML 내의 모든 {{placeholder}} 감지 및 추출 (정합성 확인 목적)
    const detectedFields: string[] = [];
    const fieldRegex = /\{\{([^}]+)\}\}/g;
    let match;
    while ((match = fieldRegex.exec(updatedPrintHtml)) !== null) {
      const fieldKey = match[1].trim();
      if (fieldKey && !detectedFields.includes(fieldKey)) {
        detectedFields.push(fieldKey);
      }
    }

    // AI 토큰 사용 로그 기록
    if (data.usageMetadata) {
      try {
        const u = data.usageMetadata;
        const nowStr = getKoreanTimestamp();
        await insertRows('ai_token_usage_logs', [{
          id: `TKN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          model: selectedModel,
          purpose: `template-natural-language-tuning-${target}`,
          prompt_tokens: u.promptTokenCount || 0,
          completion_tokens: u.candidatesTokenCount || 0,
          total_tokens: u.totalTokenCount || 0,
          user_name: username || 'admin',
          menu_path: '/form-management-new/tune',
          created_at: nowStr
        }]);
      } catch (logErr) {
        console.error('AI 토큰 사용량 기록 오류:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      html: updatedPrintHtml,
      webHtml: updatedWebHtml,
      detectedFields: detectedFields
    });

  } catch (error: any) {
    console.error('POST /api/templates-new/tune error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
