// FAQ 카테고리 타입 정의 (새로 확장된 카테고리 목록 추가)
export type FAQCategory = 
  | "sms" 
  | "rpa" 
  | "point" 
  | "coupon" 
  | "order" 
  | "price" 
  | "hr"
  | "safety"
  | "quality"
  | "facility"
  | "production"
  | "energy"
  | "safety-detect"
  | "scm"
  | "grant"
  | "labor"
  | "credit"
  | "security";

// FAQ 데이터 아이템 구조 인터페이스 정의
export interface FAQItem {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
}

// 주제별 카테고리 구성 인터페이스 정의
export interface CategoryConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}
