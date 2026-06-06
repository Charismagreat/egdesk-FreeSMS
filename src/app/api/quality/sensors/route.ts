import { NextResponse } from "next/server";

// 실시간 센서 데이터 및 이상 점수 추이
const MOCK_SENSOR_TIMELINE = [
  { time: "23:00", vibration: 1.2, current: 12.4, temperature: 45.2, anomalyScore: 15 },
  { time: "23:10", vibration: 1.3, current: 12.5, temperature: 45.8, anomalyScore: 18 },
  { time: "23:20", vibration: 1.5, current: 13.0, temperature: 46.5, anomalyScore: 28 },
  { time: "23:30", vibration: 2.1, current: 14.2, temperature: 48.0, anomalyScore: 45 },
  { time: "23:40", vibration: 3.4, current: 16.5, temperature: 52.3, anomalyScore: 78 }, // 이상 검출 임계치 70 돌파
  { time: "23:50", vibration: 4.8, current: 18.2, temperature: 56.4, anomalyScore: 88 },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    sensorStatus: {
      equipmentName: "주력 사출 프레스 M-500",
      operationalStatus: "WARNING", // NORMAL, WARNING, CRITICAL
      vibrationRms: 4.8, // mm/s
      motorCurrent: 18.2, // Ampere
      bearingTemp: 56.4, // Celsius
      anomalyScore: 88, // 오토인코더 Anomaly Score (0~100)
      threshold: 70,    // 이상 탐지 경보 임계값
    },
    sensorContributions: [
      { name: "모터 하우징 진동 (Vibration)", rate: 62 },
      { name: "가동 구동 축 내부 온도 (Temperature)", rate: 23 },
      { name: "3상 공급 전력 전류 (Current)", rate: 15 },
    ],
    timeline: MOCK_SENSOR_TIMELINE,
  });
}
