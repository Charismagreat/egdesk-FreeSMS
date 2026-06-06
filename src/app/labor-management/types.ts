export interface EmployeeLaborStat {
  id: string;
  name: string;
  department: string;
  weeklyHours: number; // 금주 누적 근로시간 (시간)
  overtimeHours: number; // 연장 근로시간 (시간)
  latenessCount: number; // 월 지각 횟수
  earlyLeaveCount: number; // 월 조퇴 횟수
  riskLevel: "SAFE" | "WARNING" | "CRITICAL"; // 근태 위험 레벨
}

export interface LaborAuditSummary {
  auditScore: number; // 노무 진단 점수 (100점 만점)
  criticalCount: number; // 위법 리스크 발생 직원 수
  unpaidAllowance: number; // 과소/누락 지급 추정 수당 총액 (원)
  riskFactors: string[]; // 3대 리스크 요인 코멘트
}

export interface ContractClause {
  id: string;
  title: string;
  isIllegal: boolean; // 위법 조항 여부
  currentText: string; // 현재 근로계약서 문구
  recommendedText: string; // AI 추천 교정 표준 문구
  reason: string; // 법적 근거 및 사유
}

export interface EmployeeContract {
  employeeId: string;
  employeeName: string;
  clauses: ContractClause[];
}

export interface LaborData {
  stats: EmployeeLaborStat[];
  summary: LaborAuditSummary;
  contracts: Record<string, EmployeeContract>;
}
