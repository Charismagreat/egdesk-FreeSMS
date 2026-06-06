// 품질관리 관련 핵심 데이터 타입 인터페이스 정의

export interface VisionLog {
  id: string;
  timestamp: string;
  itemName: string;
  anomalyScore: number;
  status: "PASS" | "FAIL";
  defectType: string;
  imageUrl: string;
  isReviewed: boolean;
}

export interface VisionModelStatus {
  activeModel: string;
  goldenSamplesCount: number;
  lastTrainedAt: string;
  anomalyThreshold: number;
}

export interface SpcSample {
  batch: string;
  value: number;
  cpk: number;
  timestamp: string;
}

export interface SpcPrediction {
  batch: string;
  value: number;
  cpk: number;
  timestamp: string;
  risk: number;
}

export interface SpcConfig {
  targetValue: number;
  ucl: number;
  lcl: number;
  usl: number;
  lsl: number;
}

export interface FeatureImportance {
  name: string;
  value: number;
  color: string;
}

export interface SensorStatus {
  equipmentName: string;
  operationalStatus: "NORMAL" | "WARNING" | "CRITICAL";
  vibrationRms: number;
  motorCurrent: number;
  bearingTemp: number;
  anomalyScore: number;
  threshold: number;
}

export interface SensorContribution {
  name: string;
  rate: number;
}

export interface SensorTimelineItem {
  time: string;
  vibration: number;
  current: number;
  temperature: number;
  anomalyScore: number;
}

export interface NcrItem {
  id: string;
  date: string;
  itemName: string;
  defectCode: string;
  defectType: string;
  quantity: number;
  reporter: string;
  status: "UNDER_REVIEW" | "CONTAINED" | "CAPA_ISSUED" | "COMPLETED";
  description: string;
  actionPlan: string;
}

export interface SimilarCase {
  id: string;
  title: string;
  similarity: number;
  rootCause: string;
  actionTaken: string;
}
