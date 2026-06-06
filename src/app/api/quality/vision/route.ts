import { NextResponse } from "next/server";

// 모의 비전 불량 판정 이력 데이터
const MOCK_VISION_LOGS = [
  {
    id: "VIS-001",
    timestamp: "2026-06-06 23:15:30",
    itemName: "사출 성형 커버 A형",
    anomalyScore: 92.5,
    status: "FAIL",
    defectType: "표면 크랙 (Surface Crack)",
    imageUrl: "https://api.placeholder.com/400/300", // 플레이스홀더 대체용 이미지
    isReviewed: false,
  },
  {
    id: "VIS-002",
    timestamp: "2026-06-06 23:02:12",
    itemName: "사출 성형 커버 A형",
    anomalyScore: 12.4,
    status: "PASS",
    defectType: "없음 (정상)",
    imageUrl: "https://api.placeholder.com/400/300",
    isReviewed: true,
  },
  {
    id: "VIS-003",
    timestamp: "2026-06-06 22:45:18",
    itemName: "커넥터 하우징 B형",
    anomalyScore: 88.1,
    status: "FAIL",
    defectType: "미성형 (Under-fill)",
    imageUrl: "https://api.placeholder.com/400/300",
    isReviewed: true,
  },
  {
    id: "VIS-004",
    timestamp: "2026-06-06 22:30:05",
    itemName: "커넥터 하우징 B형",
    anomalyScore: 15.0,
    status: "PASS",
    defectType: "없음 (정상)",
    imageUrl: "https://api.placeholder.com/400/300",
    isReviewed: true,
  },
  {
    id: "VIS-005",
    timestamp: "2026-06-06 22:12:44",
    itemName: "사출 성형 커버 A형",
    anomalyScore: 95.4,
    status: "FAIL",
    defectType: "이물 혼입 (Contamination)",
    imageUrl: "https://api.placeholder.com/400/300",
    isReviewed: false,
  }
];

// GET: 비전 모델 상태 및 검출 이력 리스트 조회
export async function GET() {
  return NextResponse.json({
    success: true,
    modelStatus: {
      activeModel: "Unsupervised PatchCore v2.1",
      goldenSamplesCount: 85,
      lastTrainedAt: "2026-06-05 14:30:22",
      anomalyThreshold: 75.0, // 이상 점수(Anomaly Score) 임계값
    },
    logs: MOCK_VISION_LOGS,
  });
}

// POST: 노코드 모델 재학습 및 임계치 업데이트
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, threshold, newGoldenSamples } = body;

    if (action === "retrain") {
      // 모델 재학습 모킹
      return NextResponse.json({
        success: true,
        message: "Golden Sample 기반 Vision AI 모델 재학습이 성공적으로 시작되었습니다. 완료 후 대시보드에 적용됩니다.",
        modelStatus: {
          activeModel: "Unsupervised PatchCore v2.1 (훈련 중)",
          goldenSamplesCount: 85 + (newGoldenSamples || 0),
          lastTrainedAt: new Date().toLocaleString(),
          anomalyThreshold: threshold || 75.0,
        }
      });
    }

    if (action === "update_threshold") {
      return NextResponse.json({
        success: true,
        message: `이상 검출 임계치가 ${threshold}%로 변경되었습니다.`,
        threshold,
      });
    }

    return NextResponse.json({ success: false, error: "알 수 없는 요청입니다." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
