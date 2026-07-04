/**
 * 구글 Gemini AI API 호출 장애(503, 429) 극복용 자동 폴백 fetch 래퍼 함수
 * 주석 및 설명: 한국어 작성 원칙 준수
 *
 * EGDesk AI Caller 서비스 도입으로 물리 키 직접 제어 및 수동 fetch를 제거하고,
 * callAiCaller API 호출 및 Response 구조 모킹 방식으로 전면 고도화 리팩토링되었습니다.
 */
import { callAiCaller } from '@/../egdesk-helpers';

/**
 * 텍스트 글자 수를 기반으로 토큰 수를 예측합니다. (폴백용 계산기)
 */
function estimateTokens(text: string): number {
  if (!text) return 0;
  let tokens = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const code = text.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      tokens += 1.5; // 한글 음절
    } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122) || (code >= 48 && code <= 57)) {
      tokens += 0.35; // 영문, 숫자
    } else {
      tokens += 0.2; // 공백, 기호 등
    }
  }
  return Math.ceil(tokens);
}

export async function fetchGeminiWithFallback(url: string, init?: RequestInit): Promise<Response> {
  let prompt = '';
  let systemPrompt: string | undefined = undefined;
  let responseMimeType: 'application/json' | 'text/plain' | undefined = undefined;
  let temperature: number | undefined = undefined;
  let imageInput: string | undefined = undefined;

  // 1. 전달받은 RequestInit body 파라미터 구조 분석 및 추출
  if (init && init.body && typeof init.body === 'string') {
    try {
      const bodyObj = JSON.parse(init.body);
      const parts = bodyObj.contents?.[0]?.parts || [];
      
      // 텍스트 프롬프트 추출
      const textPart = parts.find((p: any) => 'text' in p);
      prompt = textPart ? textPart.text : '';

      // 멀티모달 base64 이미지 추출
      const imagePart = parts.find((p: any) => 'inlineData' in p);
      if (imagePart && imagePart.inlineData?.data) {
        imageInput = imagePart.inlineData.data; // Raw Base64 data
      }

      // 시스템 지침(systemInstruction) 추출
      if (bodyObj.systemInstruction?.parts?.[0]?.text) {
        systemPrompt = bodyObj.systemInstruction.parts[0].text;
      }

      // JSON 출력 강제 사양 및 온도 추출
      if (bodyObj.generationConfig?.responseMimeType) {
        responseMimeType = bodyObj.generationConfig.responseMimeType;
      }
      if (bodyObj.generationConfig?.temperature != null) {
        temperature = bodyObj.generationConfig.temperature;
      }
    } catch (e) {
      console.warn('[AI Warning] Request body parsing failed in fallback wrapper:', e);
    }
  }

  // 2. URL에서 타겟 모델 정보 추출
  const modelMatch = url.match(/\/models\/([^?:]+)/);
  const modelName = modelMatch ? modelMatch[1] : 'gemini-1.5-flash';

  console.log(`🤖 [AI Caller 래퍼] 공통 AI Caller 기동. Model: ${modelName}, Key: wonconduct`);

  // 3. callAiCaller 호출 실행
  const callerRes = await callAiCaller(prompt, {
    systemPrompt,
    model: modelName,
    temperature: temperature ?? 0.7,
    caller: 'egdesk-fallback-wrapper',
    keyName: 'wonconduct',
    ...(imageInput ? { imageInput } : {})
  } as any);

  let text = '';
  if (callerRes && typeof callerRes === 'object') {
    if ('text' in callerRes) {
      text = String(callerRes.text);
    } else {
      text = JSON.stringify(callerRes);
    }
  } else if (typeof callerRes === 'string') {
    text = callerRes;
  }
  const usage = callerRes?.usage || {};
  const promptTokens = usage.promptTokens || callerRes?.promptTokens || estimateTokens(prompt + (systemPrompt || '')) + (imageInput ? 258 : 0);
  const completionTokens = usage.completionTokens || callerRes?.completionTokens || estimateTokens(text);
  const totalTokens = promptTokens + completionTokens;

  // 4. 원래의 수동 API 파싱 코드와의 100% 호환성을 보장하는 모킹된 Response 생성
  const mockGeminiData = {
    candidates: [
      {
        content: {
          parts: [
            { text }
          ]
        }
      }
    ],
    usageMetadata: {
      promptTokenCount: promptTokens,
      candidatesTokenCount: completionTokens,
      totalTokenCount: totalTokens
    }
  };

  const mockResponse = new Response(JSON.stringify(mockGeminiData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  return mockResponse;
}

