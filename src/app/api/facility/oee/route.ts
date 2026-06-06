import { NextResponse } from "next/server";

// 모의 OEE 및 비가동 원인 통계 데이터
const MOCK_OEE_DATA = {
  overallOee: 78.4, // 설비종합효율 %
  availability: 88.5, // 시간가동률 %
  performance: 92.0,  // 성능효율 %
  quality: 96.2,      // 양품률 %
  operatingHours: {
    totalLoaded: 480, // 부하 시간 (분)
    actualRun: 425,   // 실제 가동 시간 (분)
    plannedStop: 30,  // 계획 정지 시간 (분)
    breakdownStop: 25 // 돌발 정지 시간 (분)
  },
  financialLoss: {
    opportunityLossKrw: 4800000, // 기회 손실 비용 (원)
    preventedLossKrw: 12500000,  // AI 예지보전으로 예방한 손실 비용 (원)
  },
  downtimeReasons: [
    { reason: "기종 교체 및 금형 세팅", minutes: 90, rate: 45 },
    { reason: "원재료 Lot 입고 지연 대기", minutes: 50, rate: 25 },
    { reason: "모터 하우징 진동 과부하 정지", minutes: 30, rate: 15 },
    { reason: "일상 보전 급유 및 스케일 청소", minutes: 20, rate: 10 },
    { reason: "기타 안전 센서 오작동 등", minutes: 10, rate: 5 }
  ],
  factoryLayout: [
    { id: "M-500", name: "사출 1호기", status: "WARNING", oee: 72.5, x: 20, y: 30 },
    { id: "M-300", name: "사출 2호기", status: "RUNNING", oee: 84.1, x: 50, y: 30 },
    { id: "M-200", name: "사출 3호기", status: "STOPPED", oee: 0.0, x: 80, y: 30 },
    { id: "A-100", name: "조립 라인 A", status: "RUNNING", oee: 92.5, x: 35, y: 70 },
    { id: "P-100", name: "포장 기기 P", status: "RUNNING", oee: 88.0, x: 65, y: 70 }
  ]
};

export async function GET() {
  return NextResponse.json({
    success: true,
    oeeData: MOCK_OEE_DATA
  });
}
