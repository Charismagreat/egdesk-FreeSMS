import { NextResponse } from "next/server";

// 모의 월간 정비 일정 목록
const MOCK_MAINTENANCE_EVENTS = [
  { id: "EVT-001", date: "2026-06-08", title: "사출 1호기 축 롤러 베어링 교체", type: "PREVENTIVE", assignee: "김철수" },
  { id: "EVT-002", date: "2026-06-12", title: "사출 2호기 유압 유량 센서 캘리브레이션", type: "CALIBRATION", assignee: "이영희" },
  { id: "EVT-003", date: "2026-06-15", title: "공장 전력 분전반 안전 점검", type: "ROUTINE", assignee: "박민수" },
  { id: "EVT-004", date: "2026-06-22", title: "사출 3호기 모터 서보 앰프 점검", type: "PREVENTIVE", assignee: "김철수" },
  { id: "EVT-005", date: "2026-06-28", title: "조립 라인 컨베이어 벨트 장력 조절", type: "ROUTINE", assignee: "이영희" }
];

// 소모성 부품 재고 관리
const MOCK_PART_INVENTORIES = [
  { id: "PT-022", name: "롤러 베어링 (6204-ZZ)", safetyStock: 10, currentStock: 2, unit: "EA", leadTimeDays: 5, risk: "CRITICAL" },
  { id: "PT-085", name: "고온 히터 카트리지 (300W)", safetyStock: 5, currentStock: 6, unit: "EA", leadTimeDays: 3, risk: "SAFE" },
  { id: "PT-112", name: "유압 서보 솔레노이드 밸브", safetyStock: 2, currentStock: 1, unit: "EA", leadTimeDays: 10, risk: "WARNING" }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    events: MOCK_MAINTENANCE_EVENTS,
    partInventories: MOCK_PART_INVENTORIES
  });
}
