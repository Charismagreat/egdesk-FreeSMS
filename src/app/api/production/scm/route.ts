import { NextResponse } from "next/server";

// 1. 모의 실시간 조달 화물 리스트 (Shipments)
// 국내외에서 공장으로 이송 중인 자재 트래킹 정보
let MOCK_SHIPMENTS = [
  {
    id: "SH-8821",
    supplierId: "SUP-101",
    supplierName: "글로벌 화학 테크 (SUP-101)",
    item: "사출용 ABS 레진 (30톤)",
    status: "CUSTOMS", // SHIPPED(선적), CUSTOMS(통관중), DOMESTIC(국내운송), ARRIVED(입고완료)
    eta: "2026-06-12",
    delayProbability: 82, // AI 지연 위험 예측 확률 (%)
    risk: "CRITICAL", // SAFE, WARNING, CRITICAL
    route: {
      fromName: "중국 상해항",
      toName: "인천항 / 평택 공장",
      from: { x: 120, y: 190 },
      current: { x: 310, y: 130 },
      to: { x: 550, y: 110 }
    }
  },
  {
    id: "SH-8822",
    supplierId: "SUP-102",
    supplierName: "코리아 메탈웍스 (SUP-102)",
    item: "도어 힌지 정밀 금형 프레임 (500세트)",
    status: "DOMESTIC",
    eta: "2026-06-09",
    delayProbability: 18,
    risk: "SAFE",
    route: {
      fromName: "부산항",
      toName: "평택 공장",
      from: { x: 680, y: 220 },
      current: { x: 610, y: 150 },
      to: { x: 550, y: 110 }
    }
  },
  {
    id: "SH-8823",
    supplierId: "SUP-103",
    supplierName: "아시아 하이테크 (SUP-103)",
    item: "도장 마감용 특수 솔벤트 (100드럼)",
    status: "SHIPPED",
    eta: "2026-06-16",
    delayProbability: 55,
    risk: "WARNING",
    route: {
      fromName: "베트남 다낭항",
      toName: "평택 공장",
      from: { x: 160, y: 250 },
      current: { x: 280, y: 210 },
      to: { x: 550, y: 110 }
    }
  }
];

// 2. 모의 협력사 신뢰성 지수 스코어카드 (Suppliers Card)
let MOCK_SUPPLIERS = [
  { id: "SUP-101", name: "글로벌 화학 테크", rating: 3.8, deliveryRate: 75, defectRate: 2.1, priceDiff: 15 }, // 납기율 하락세
  { id: "SUP-102", name: "코리아 메탈웍스", rating: 4.8, deliveryRate: 98, defectRate: 0.2, priceDiff: -3 },
  { id: "SUP-103", name: "아시아 하이테크", rating: 4.2, deliveryRate: 85, defectRate: 1.1, priceDiff: 5 },
  { id: "SUP-104", name: "동양 케미컬 (대체처 후보)", rating: 4.6, deliveryRate: 95, defectRate: 0.5, priceDiff: 2 }
];

// 3. 모의 AI 대체 가능 공급처 추천 리스트 (Alternatives)
let MOCK_ALTERNATIVES: Record<string, any[]> = {
  "SH-8821": [
    { id: "SUP-104", name: "동양 케미컬 (국내 조달 가능)", price: 42000000, leadTime: 3, rating: 4.6, reason: "상해항 기상 악화 우회, 국내 재고 확보로 즉시 배송 가능" },
    { id: "SUP-105", name: "태평양 신소재 (예비처)", price: 45000000, leadTime: 4, rating: 4.3, reason: "단가는 약간 높으나 즉시 안전 재고 물량 20톤 인도 가능" }
  ]
};

/**
 * GET: 조달 화물 리스트, 협력사 평점, AI 대체공급처 후보군 조회
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      shipments: MOCK_SHIPMENTS,
      suppliers: MOCK_SUPPLIERS,
      alternatives: MOCK_ALTERNATIVES
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: AI 추천 대체 공급처로 즉시 우회 전환 및 모바일 운송 상태 갱신
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. 발주처 대체 전환 실행 (switch_supplier)
    if (action === "switch_supplier") {
      const { shipmentId, alternativeSupplierId } = body;
      const shipment = MOCK_SHIPMENTS.find(s => s.id === shipmentId);
      const alternative = MOCK_SUPPLIERS.find(s => s.id === alternativeSupplierId);

      if (!shipment || !alternative) {
        return NextResponse.json({ success: false, error: "조달 화물 및 대체 협력사 정보가 올바르지 않습니다." }, { status: 400 });
      }

      // 발주처 교체 및 상태 갱신 (지연 리스크 제거 시뮬레이션)
      MOCK_SHIPMENTS = MOCK_SHIPMENTS.map((s) => {
        if (s.id === shipmentId) {
          return {
            ...s,
            supplierId: alternative.id,
            supplierName: `${alternative.name} (대체 우회)`,
            status: "DOMESTIC" as const, // 국내 유통망 운송으로 빠른 보정
            eta: "2026-06-10", // 납기일 당겨짐
            delayProbability: 5, // 지연 확률 5%로 격하
            risk: "SAFE" as const,
            route: {
              ...s.route,
              fromName: "동양 케미컬 여수 공장",
              from: { x: 500, y: 230 },
              current: { x: 520, y: 160 },
            }
          };
        }
        return s;
      });

      return NextResponse.json({
        success: true,
        message: `발주처가 ${alternative.name}(으)로 성공적으로 우회 전환되어 리스크가 완전히 해소되었습니다.`,
        shipments: MOCK_SHIPMENTS,
        suppliers: MOCK_SUPPLIERS,
        alternatives: MOCK_ALTERNATIVES
      });
    }

    // 2. 모바일 운송 세관 상태 단계별 강제 업데이트 (update_tracking)
    if (action === "update_tracking") {
      const { shipmentId, status } = body;
      let targetShipment = MOCK_SHIPMENTS.find(s => s.id === shipmentId);

      if (!targetShipment) {
        return NextResponse.json({ success: false, error: "운송 화물을 찾을 수 없습니다." }, { status: 400 });
      }

      // 상태 변경
      MOCK_SHIPMENTS = MOCK_SHIPMENTS.map((s) => {
        if (s.id === shipmentId) {
          // 상태 전진 시 AI 지연 예측치도 동적으로 리셋
          let delay = s.delayProbability;
          let r = s.risk;
          if (status === "DOMESTIC") { delay = 10; r = "SAFE"; }
          if (status === "ARRIVED") { delay = 0; r = "SAFE"; }

          return {
            ...s,
            status,
            delayProbability: delay,
            risk: r,
          };
        }
        return s;
      });

      return NextResponse.json({
        success: true,
        message: "원자재 통관 단계가 실시간 업데이트되어 PC 관리 대장에 반영되었습니다.",
        shipments: MOCK_SHIPMENTS,
        suppliers: MOCK_SUPPLIERS,
        alternatives: MOCK_ALTERNATIVES
      });
    }

    return NextResponse.json({ success: false, error: "올바른 액션이 정의되지 않았습니다." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
