/**
 * Base64 문자열을 Blob 객체로 변환하는 헬퍼 함수
 * (PDF 브라우저 보안 CSP 우회용)
 */
export const base64ToBlob = (base64: string, mimeType = "application/pdf"): Blob => {
  const base64WithoutHeader = base64.split(",")[1] || base64;
  const byteCharacters = atob(base64WithoutHeader);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

export interface EstimateMetadata {
  tags: string;
  business_number: string;
  address: string;
  representative: string;
  document_number: string;
  document_date: string;
  document_memo: string;
  delivery_date?: string;
}

/**
 * 하이브리드 JSON 메타데이터 파서
 */
export const parseEstimateMetadata = (tagsString: string): EstimateMetadata => {
  const defaultMeta: EstimateMetadata = {
    tags: "",
    business_number: "",
    address: "",
    representative: "",
    document_number: "",
    document_date: "",
    document_memo: "",
    delivery_date: ""
  };
  
  if (!tagsString) return defaultMeta;
  
  const trimmed = tagsString.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        tags: parsed.tags || "",
        business_number: parsed.business_number || "",
        address: parsed.address || "",
        representative: parsed.representative || "",
        document_number: parsed.document_number || "",
        document_date: parsed.document_date || "",
        document_memo: parsed.document_memo || "",
        delivery_date: parsed.delivery_date || ""
      };
    } catch (e) {
      // 파싱 실패 시 예외 처리 없음
    }
  }
  
  return {
    ...defaultMeta,
    tags: tagsString
  };
};
