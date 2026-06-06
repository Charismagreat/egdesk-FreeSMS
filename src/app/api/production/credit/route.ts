import { NextResponse } from "next/server";

// 1. 모의 거래처 신용 위험 및 채권 분석 대장
let MOCK_STATS = [
  {
    id: "PT-001",
    companyName: "(주)대선기공",
    managerName: "박민우",
    managerPhone: "010-1234-5678",
    totalSales: 150000000, // 총 거래액 (매출)
    overdueAmount: 42000000, // 미수금 총액
    overdueDays: 85, // 연체 일수 (D+)
    creditRating: "E", // 신용 등급 (A ~ F)
    defaultProbability: 78.5, // 부도 위험 확률 (%)
    riskLevel: "CRITICAL" as const, // 리스크 레벨 (CRITICAL, WARNING, SAFE)
    lastAction: "1차 독촉장 발송완료", // 수금 관리 최근 조치
    actionDate: "2026-06-01",
    virtualAccount: "기업은행 987-654-321012" // 가상계좌번호
  },
  {
    id: "PT-002",
    companyName: "에스제이 트레이딩",
    managerName: "최성준",
    managerPhone: "010-8765-4321",
    totalSales: 85000000,
    overdueAmount: 15500000,
    overdueDays: 42,
    creditRating: "D",
    defaultProbability: 45.0,
    riskLevel: "WARNING" as const,
    lastAction: "수금 유선 상담 완료",
    actionDate: "2026-06-03",
    virtualAccount: "신한은행 110-220-330440"
  },
  {
    id: "PT-003",
    companyName: "한성테크",
    managerName: "정지훈",
    managerPhone: "010-1111-2222",
    totalSales: 45000000,
    overdueAmount: 3200000,
    overdueDays: 12,
    creditRating: "B",
    defaultProbability: 15.0,
    riskLevel: "SAFE" as const,
    lastAction: "전자세금계산서 발행",
    actionDate: "2026-05-25",
    virtualAccount: "국민은행 4567-89-101112"
  },
  {
    id: "PT-004",
    companyName: "(주)광명네트웍스",
    managerName: "강동우",
    managerPhone: "010-3333-4444",
    totalSales: 98000000,
    overdueAmount: 0,
    overdueDays: 0,
    creditRating: "A",
    defaultProbability: 3.2,
    riskLevel: "SAFE" as const,
    lastAction: "수금 완료 (정상)",
    actionDate: "2026-05-30",
    virtualAccount: "우리은행 1002-123-456789"
  }
];

// 2. 모의 전사 채권 분석 요약 정보
let MOCK_SUMMARY = {
  averageDso: 48.2, // 평균 수금 소요일 (Days Sales Outstanding)
  overdueTotal: 57500000, // 부실 채권 총액 (연체 30일 이상)
  averageCreditScore: 74, // 평균 신용 점수 (100점 만점 기준)
  riskFactors: [
    "⚠️ (주)대선기공의 미수금 연체 기간이 80일을 초과하여 대손상각(부도 처리) 리스크군으로 진단되었습니다.",
    "⚠️ 에스제이 트레이딩의 최근 3개월 원자재 수급 부진 영향으로 매출액 대비 연체 전환 확률이 12% 급증했습니다.",
    "💡 한성테크의 결제 지연 일수가 최근 5일간 점진적으로 상승하여 단기 모니터링이 요구됩니다."
  ]
};

// 3. 모의 연체 기간별 에이징(Aging) 현황
let MOCK_AGING = {
  categories: ["1~30일", "31~60일", "61~90일", "90일 초과"],
  amounts: [3200000, 15500000, 42000000, 0] // 순서대로 매칭
};

/**
 * GET: 거래처별 채권 리스크 목록 및 요약 통계 조회
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      stats: MOCK_STATS,
      summary: MOCK_SUMMARY,
      aging: MOCK_AGING
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: 실시간 채권 위험도 분석 및 독촉 SMS 모의 발송
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. 실시간 채권/신용 위험 분석 재연산
    if (action === "recalculate") {
      // 0.5초 대기 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500));

      // 일부 거래처의 연체 일수 증가 및 그에 따른 부도 위험 지표 갱신
      MOCK_STATS = MOCK_STATS.map(s => {
        if (s.id === "PT-002") {
          return {
            ...s,
            overdueDays: 45,
            defaultProbability: 51.2,
            riskLevel: "CRITICAL" as const // 경고에서 위험군으로 격상
          };
        }
        return s;
      });

      MOCK_SUMMARY = {
        ...MOCK_SUMMARY,
        averageDso: 49.8,
        averageCreditScore: 71, // 신용 악화 반영
        riskFactors: [
          "⚠️ (주)대선기공의 미수금 연체 기간이 80일을 초과하여 대손상각(부도 처리) 리스크군으로 진단되었습니다.",
          "⚠️ 에스제이 트레이딩의 연체 일수가 45일에 도달하여 리스크가 '위험(CRITICAL)' 상태로 격상되었습니다.",
          "💡 한성테크의 결제 지연 일수가 최근 5일간 점진적으로 상승하여 단기 모니터링이 요구됩니다."
        ]
      };

      MOCK_AGING = {
        ...MOCK_AGING,
        amounts: [3200000, 15500000, 42000000, 0] // 30~60일 영역 업데이트 반영
      };

      return NextResponse.json({
        success: true,
        message: "전사 매출채권 연체 현황 및 거래처 신용 위험 재진단이 완료되었습니다.",
        stats: MOCK_STATS,
        summary: MOCK_SUMMARY,
        aging: MOCK_AGING
      });
    }

    // 2. 미수금 수금 독촉 알림 SMS 발송 시뮬레이션
    if (action === "send_sms") {
      const { partnerId, message, senderPhone = "02-1588-0000" } = body;
      const partner = MOCK_STATS.find(s => s.id === partnerId);

      if (!partner) {
        return NextResponse.json({ success: false, error: "해당 거래처 정보를 찾을 수 없습니다." }, { status: 400 });
      }

      if (!message || message.trim().length === 0) {
        return NextResponse.json({ success: false, error: "전송할 독촉 문자 메시지 내용을 입력해 주세요." }, { status: 400 });
      }

      // 조치 이력 실시간 업데이트
      const nowStr = new Date().toISOString().substring(0, 10);
      MOCK_STATS = MOCK_STATS.map(s => {
        if (s.id === partnerId) {
          return {
            ...s,
            lastAction: "AI 법률준수 독촉SMS 발송",
            actionDate: nowStr,
            // 수금을 소폭 독려하여 리스크가 안정되는 연출을 위해 부도 위험 소폭 차감
            defaultProbability: Math.max(0, s.defaultProbability - 5)
          };
        }
        return s;
      });

      // 요약 지표 리스크 텍스트 보완
      MOCK_SUMMARY.riskFactors = MOCK_SUMMARY.riskFactors.map(f => {
        if (f.includes(partner.companyName) && partnerId === "PT-001") {
          return `💡 (주)대선기공에 수금 안내 및 계좌 정보 SMS가 발송되었습니다. (회수 유도 중)`;
        }
        return f;
      });

      return NextResponse.json({
        success: true,
        message: `[${partner.companyName}] 담당자(${partner.managerName})에게 독촉 메시지가 정상 발송되었습니다.`,
        stats: MOCK_STATS,
        summary: MOCK_SUMMARY,
        aging: MOCK_AGING
      });
    }

    return NextResponse.json({ success: false, error: "유효하지 않은 요청 액션입니다." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
