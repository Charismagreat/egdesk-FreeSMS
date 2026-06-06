import { NextResponse } from "next/server";

// 모의 예지보전 센서 분석 데이터
const MOCK_PREDICTIVE_DATA = {
  equipmentId: "EQ-PRESS-01",
  equipmentName: "주력 사출 프레스 M-500",
  healthScore: 84.5, // 설비 건전도 점수 (0~100)
  vibrationRms: 2.8,  // 실시간 진동 mm/s
  vibrationTrend: [
    { time: "18:00", value: 1.2 },
    { time: "19:00", value: 1.3 },
    { time: "20:00", value: 1.5 },
    { time: "21:00", value: 2.1 },
    { time: "22:00", value: 2.6 },
    { time: "23:00", value: 2.8 }
  ],
  fftAnalysis: [
    { frequency: 10, amplitude: 0.1, label: "불균형 요인" },
    { frequency: 33, amplitude: 0.8, label: "베어링 아우터 레이스 마모 결함" }, // 특정 피크 주파수
    { frequency: 50, amplitude: 0.2, label: "전원 노이즈" },
    { frequency: 80, amplitude: 0.05, label: "기어 이빨 기어링" }
  ],
  partLifetimes: [
    { partName: "구동 축 롤러 베어링", rulDays: 14, status: "WARNING", percent: 12 },
    { partName: "유압 서보 벨브 실링", rulDays: 45, status: "NORMAL", percent: 48 },
    { partName: "고압 가열 코일 블록", rulDays: 120, status: "NORMAL", percent: 85 }
  ]
};

export async function GET() {
  return NextResponse.json({
    success: true,
    predictiveStatus: MOCK_PREDICTIVE_DATA
  });
}
