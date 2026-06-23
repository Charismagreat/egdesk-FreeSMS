/**
 * 구글 Gemini AI API 호출 장애(503, 429) 극복용 자동 폴백 fetch 래퍼 함수
 * 주석 및 설명: 한국어 작성 원칙 준수
 */
export async function fetchGeminiWithFallback(url: string, init?: RequestInit): Promise<Response> {
  const maxRetries = 2; // 동일 모델 최대 재시도 횟수
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, init);
      
      // 일시적 서버 오류(503, 500) 및 할당량 제한(429) 감지 시 재시도 진행
      if (!res.ok && (res.status === 503 || res.status === 429 || res.status === 500)) {
        attempt++;
        if (attempt < maxRetries) {
          const delay = attempt * 500;
          console.warn(`[AI Warning] API 호출 실패 (Status: ${res.status}). ${delay}ms 후 재시도합니다... (시도: ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // 성공했거나 재시도 한계에 도달한 경우 응답 반환
      return res;
      
    } catch (err: any) {
      attempt++;
      if (attempt < maxRetries) {
        const delay = attempt * 500;
        console.warn(`[AI Warning] 네트워크 장애 발생: ${err.message}. ${delay}ms 후 재시도합니다... (시도: ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }

  // 상위 모델 최종 실패 시, 모델명을 하위 모델인 'gemini-2.5-flash' (또는 상황에 맞는 플래시 모델)로 치환하여 폴백 호출
  console.error(`[AI Emergency] 기본 모델 호출 실패. 하위 플래시 모델로 자동 폴백을 수행합니다.`);
  
  // 구글 API URL 형식: models/{modelName}:generateContent
  // 정규식을 사용해 기존 모델명을 gemini-1.5-flash로 자동 치환
  const fallbackModel = 'gemini-1.5-flash';
  const fallbackUrl = url.replace(/\/models\/[^:]+:/, `/models/${fallbackModel}:`);
  
  try {
    console.log(`[AI Fallback] 폴백 API 요청 전송: ${fallbackUrl}`);
    return await fetch(fallbackUrl, init);
  } catch (fallbackErr: any) {
    console.error(`[AI Critical] 폴백 모델 호출 마저 실패하였습니다: ${fallbackErr.message}`);
    throw fallbackErr;
  }
}
