import { NextResponse } from "next/server";

// 모의 시계열 X-bar 공정 계측 이력 (사출 가열 온도 측정치)
const MOCK_SPC_SAMPLES = [
  { batch: "B-201", value: 210.2, cpk: 1.54, timestamp: "18:00" },
  { batch: "B-202", value: 211.5, cpk: 1.48, timestamp: "19:00" },
  { batch: "B-203", value: 209.8, cpk: 1.59, timestamp: "20:00" },
  { batch: "B-204", value: 213.1, cpk: 1.35, timestamp: "21:00" },
  { batch: "B-205", value: 214.8, cpk: 1.22, timestamp: "22:00" }, // 저하 시작
  { batch: "B-206", value: 215.2, cpk: 1.15, timestamp: "23:00" }, // 관리 한계 돌파
];

// 미래 4시간 예측 데이터 (LSTM 하이브리드)
const MOCK_SPC_PREDICTIONS = [
  { batch: "B-207 (예측)", value: 216.0, cpk: 1.08, timestamp: "00:00 (예측)", risk: 78 },
  { batch: "B-208 (예측)", value: 216.5, cpk: 0.98, timestamp: "01:00 (예측)", risk: 89 },
  { batch: "B-209 (예측)", value: 217.1, cpk: 0.89, timestamp: "02:00 (예측)", risk: 94 },
  { batch: "B-210 (예측)", value: 217.3, cpk: 0.85, timestamp: "03:00 (예측)", risk: 97 },
];

// GET: SPC 차트 데이터 및 LSTM 예측 결과 조회
export async function GET() {
  return NextResponse.json({
    success: true,
    spcConfig: {
      targetValue: 210.0, // 목표 가열 온도
      ucl: 215.0,        // 관리 상한선 (Upper Control Limit)
      lcl: 205.0,        // 관리 하한선 (Lower Control Limit)
      usl: 218.0,        // 규격 상한선 (Upper Spec Limit)
      lsl: 202.0,        // 규격 하한선 (Lower Spec Limit)
    },
    currentCpk: 1.15,
    cpkStatus: "WARNING", // Cpk < 1.33 위험 경고 상태
    futureRiskProbability: 89, // 향후 4시간 내 규격 상한 이탈(Cpk < 1.0) 확률
    samples: MOCK_SPC_SAMPLES,
    predictions: MOCK_SPC_PREDICTIONS,
    featureImportance: [
      { name: "가열 실린더 압력", value: 42, color: "bg-rose-500" },
      { name: "냉각수 밸브 유량", value: 28, color: "bg-amber-500" },
      { name: "환경 외부 온도", value: 18, color: "bg-blue-500" },
      { name: "원자재 용융 지수", value: 12, color: "bg-indigo-500" }
    ]
  });
}
