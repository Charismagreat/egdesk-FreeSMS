// 설비관리 관련 핵심 데이터 타입 정의

export interface VibrationPoint {
  time: string;
  value: number;
}

export interface FftPoint {
  frequency: number;
  amplitude: number;
  label: string;
}

export interface PartLifetime {
  partName: string;
  rulDays: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
  percent: number;
}

export interface PredictiveStatus {
  equipmentId: string;
  equipmentName: string;
  healthScore: number;
  vibrationRms: number;
  vibrationTrend: VibrationPoint[];
  fftAnalysis: FftPoint[];
  partLifetimes: PartLifetime[];
}

export interface OperatingHours {
  totalLoaded: number;
  actualRun: number;
  plannedStop: number;
  breakdownStop: number;
}

export interface FinancialLoss {
  opportunityLossKrw: number;
  preventedLossKrw: number;
}

export interface DowntimeReason {
  reason: string;
  minutes: number;
  rate: number;
}

export interface FactoryLayoutItem {
  id: string;
  name: string;
  status: "RUNNING" | "WARNING" | "STOPPED";
  oee: number;
  x: number;
  y: number;
}

export interface OeeData {
  overallOee: number;
  availability: number;
  performance: number;
  quality: number;
  operatingHours: OperatingHours;
  financialLoss: FinancialLoss;
  downtimeReasons: DowntimeReason[];
  factoryLayout: FactoryLayoutItem[];
}

export interface MaintenanceEvent {
  id: string;
  date: string;
  title: string;
  type: "PREVENTIVE" | "CALIBRATION" | "ROUTINE";
  assignee: string;
}

export interface PartInventory {
  id: string;
  name: string;
  safetyStock: number;
  currentStock: number;
  unit: string;
  leadTimeDays: number;
  risk: "SAFE" | "WARNING" | "CRITICAL";
}

export interface RepairLog {
  id: string;
  date: string;
  equipmentId: string;
  equipmentName: string;
  errorCode: string;
  symptom: string;
  repairDesc: string;
  mechanic: string;
  cost: number;
}

export interface RagSolution {
  rootCause: string;
  actions: string[];
  similarHistory: string;
  warehouse: string;
}
