/**
 * 구글 Gemini AI API 호출 장애(503, 429) 극복용 자동 폴백 fetch 래퍼 함수
 * 주석 및 설명: 한국어 작성 원칙 준수
 */
export async function fetchGeminiWithFallback(url: string, init?: RequestInit): Promise<Response> {
  const maxRetries = 3; // 동일 모델 최대 재시도 횟수 상향

  // 재시도와 백오프 대기가 적용된 단일 API 호출 헬퍼
  async function fetchWithRetry(targetUrl: string, modelLabel: string): Promise<Response> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const res = await fetch(targetUrl, init);
        
        // 일시적 서버 오류(503, 500) 및 할당량 제한(429) 감지 시 재시도 진행
        if (!res.ok && (res.status === 503 || res.status === 429 || res.status === 500)) {
          attempt++;
          if (attempt < maxRetries) {
            const delay = attempt * 1000; // 대기 시간 상향 (1s, 2s...)
            console.warn(`[AI Warning] ${modelLabel} API 호출 실패 (Status: ${res.status}). ${delay}ms 후 재시도합니다... (시도: ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        return res;
      } catch (err: any) {
        attempt++;
        if (attempt < maxRetries) {
          const delay = attempt * 1000;
          console.warn(`[AI Warning] ${modelLabel} 네트워크 장애 발생: ${err.message}. ${delay}ms 후 재시도합니다... (시도: ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
    throw new Error(`${modelLabel} API call failed after ${maxRetries} attempts`);
  }

  try {
    // 1. 기본 설정된 주 모델 (예: gemini-3.5-flash) 호출 시도
    const primaryRes = await fetchWithRetry(url, '기본 모델');
    if (primaryRes.ok) {
      return primaryRes;
    }
    console.error(`[AI Emergency] 기본 모델 호출 실패 (Status: ${primaryRes.status}). 하위 플래시 모델로 자동 폴백을 수행합니다.`);
  } catch (primaryErr: any) {
    console.error(`[AI Emergency] 기본 모델 호출 오류 발생: ${primaryErr.message}. 하위 플래시 모델로 자동 폴백을 수행합니다.`);
  }

  // 2. 주 모델 실패 시, 모델명을 하위 모델인 'gemini-1.5-flash'로 치환하여 폴백 호출
  const fallbackModel = 'gemini-1.5-flash';
  const fallbackUrl = url.replace(/\/models\/[^:]+:/, `/models/${fallbackModel}:`);
  
  try {
    console.log(`[AI Fallback] 폴백 API 요청 전송: ${fallbackUrl}`);
    // 폴백 모델 호출 시에도 재시도 및 백오프 로직을 적용하여 안정성 보장!
    return await fetchWithRetry(fallbackUrl, '폴백 모델');
  } catch (fallbackErr: any) {
    console.error(`[AI Critical] 폴백 모델 호출 마저 실패하였습니다: ${fallbackErr.message}`);
    throw fallbackErr;
  }
}

