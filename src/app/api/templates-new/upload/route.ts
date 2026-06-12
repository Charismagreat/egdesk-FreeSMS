export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { queryTable, insertRows } from '../../../../../egdesk-helpers';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import crypto from 'crypto';

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
 * POST: 최고관리자가 이미지나 PDF 양식 파일을 업로드하면, Gemini Flash가 이를 분석하여 Mustache 플레이스홀더를 동반한 A4 HTML 코드로 변환해줍니다.
 */
export async function POST(req: Request) {
  const { isAuthorized, username } = await verifySuperAdmin();
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: '최고관리자 권한이 필요합니다.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { imageBase64, filename, mimeType = 'image/jpeg' } = body;

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: '분석할 양식 파일 데이터(Base64)가 누락되었습니다.' }, { status: 400 });
    }

    // DB에서 API 키 및 모델 설정 가져오기
    let apiKey: string | null = null;
    let selectedModel = 'gemini-2.5-flash';
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

    // Base64 프리픽스 제거
    const cleanedBase64 = imageBase64.replace(/^data:(image\/(png|jpeg|jpg|webp|heic|heif)|application\/pdf);base64,/, "");

    // 템플릿 기본 예시/가이드라인이 포함된 프롬프트 작성
    const systemPrompt = `
You are a top-tier frontend developer and AI document transformation expert.
Your job is to look at the provided document (an image or a PDF page of a form/certificate) and recreate it into a single, fully responsive, print-friendly A4 HTML document.

Follow these strict constraints:
1. Output format MUST be a raw, valid HTML document starting with <!DOCTYPE html> and ending with </html>. Do not wrap the HTML code inside a JSON object or markdown code block like \`\`\`html.
2. The HTML MUST represent an A4 page layout (210mm x 297mm) with proper print-friendly margins (e.g., 20mm padding) and look clean, premium, and professional. Use beautiful, neutral fonts, light borders, and elegant layout structures. Do not make it look like a low-fidelity draft.
3. You must replace variable content areas (e.g., Names, Dates, Certificate Numbers, Departments) with Mustache placeholders like {{placeholder_key}}.
4. You should detect if the document looks like a:
   - Certificate of Employment / 재직증명서 / 경력증명서
   - Purchase Invoice / 거래명세서 / 영수증
   - Business License / 사업자등록증
   - Medical Certificate / 진단서 / 병가원
   Based on the context, place appropriate placeholders. For a Certificate of Employment (재직증명서), try to match variables like:
   - {{staff_name}} (성명)
   - {{joined_date}} (입사일/지정일)
   - {{degree_level}} (학위)
   - {{major_name}} (전공)
   - {{address}} (주소)
   - {{usage}} (용도)
   - {{issue_date}} (발급일자)
   - {{issue_dept}} (발급부서)
   - {{issue_by}} (발급자/대표)
   For other documents, create reasonable and descriptive placeholder keys.
5. All CSS styles must be embedded in a <style> block within the <head> of the generated HTML. Ensure that margins, heights, and padding are designed for A4 screen previews and physical A4 printing (using CSS page-break properties if needed, but normally constraint within a single page container).
6. Output only the raw HTML text without any introductory text, explanation, or markdown backticks.
`;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Google Gemini API Key가 설정되지 않았습니다. 시스템 설정을 확인하십시오.' }, { status: 500 });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: cleanedBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const errMsg = await response.text();
      throw new Error(`Gemini API 호출 실패: ${response.status} - ${errMsg}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // 마크다운 블록 및 불필요한 감싸기 문자 가드 제거
    let htmlCode = text.trim();
    if (htmlCode.startsWith('```')) {
      const lines = htmlCode.split('\n');
      if (lines[0].startsWith('```')) lines.shift();
      if (lines[lines.length - 1].startsWith('```')) lines.pop();
      htmlCode = lines.join('\n').trim();
    }

    // HTML 내의 모든 {{placeholder}} 감지 및 추출
    const fieldRegex = /\{\{([^}]+)\}\}/g;
    const detectedFields: string[] = [];
    let match;
    while ((match = fieldRegex.exec(htmlCode)) !== null) {
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
          purpose: 'new-template-ocr-generation',
          prompt_tokens: u.promptTokenCount || 0,
          completion_tokens: u.candidatesTokenCount || 0,
          total_tokens: u.totalTokenCount || 0,
          user_name: username || 'admin',
          menu_path: '/form-management-new/upload',
          created_at: nowStr
        }]);
      } catch (logErr) {
        console.error('AI 토큰 사용량 기록 오류:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      html: htmlCode,
      detectedFields: detectedFields
    });

  } catch (error: any) {
    console.error('POST /api/templates-new/upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
