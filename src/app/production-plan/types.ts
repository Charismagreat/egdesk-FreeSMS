// 생산 계획 및 공정 스케줄링(APS) 관련 데이터 타입 정의

export interface GanttTask {
  id: string;
  title: string;
  equipmentId: string;
  equipmentName: string;
  operatorName: string;
  startHour: number;
  endHour: number;
  progress: number;
  status: "WAITING" | "RUNNING" | "COMPLETED";
}

export interface UnscheduledOrder {
  orderId: string;
  productName: string;
  qty: number;
  dueDate: string;
  status: string;
}

export interface BottleneckInfo {
  id: string;
  name: string;
  loadRate: number;
  status: "CRITICAL" | "WARNING" | "NORMAL";
  queueTasks: number;
}

export interface DueRiskAnalysis {
  orderId: string;
  productName: string;
  probability: number;
  status: "SAFE" | "WARNING" | "CRITICAL";
}

export interface ProductionPlanData {
  ganttTasks: GanttTask[];
  unscheduledOrders: UnscheduledOrder[];
  bottlenecks: BottleneckInfo[];
  dueRiskAnalysis: DueRiskAnalysis[];
}
