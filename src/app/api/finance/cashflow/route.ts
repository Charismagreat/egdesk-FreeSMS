import { NextResponse } from "next/server";

// 모의 제품 기초 데이터
const INITIAL_PRODUCTS = [
  { productId: "P-101", productName: "사출 성형 부품 A (자동차 향)", rawMaterialCost: 4500, laborCost: 2000, expenseCost: 1500, sellingPrice: 10000 },
  { productId: "P-102", productName: "압출 정밀 가이드 B (기계 향)", rawMaterialCost: 8000, laborCost: 3500, expenseCost: 2500, sellingPrice: 18000 },
  { productId: "P-103", productName: "가전 외장 다이캐스팅 C", rawMaterialCost: 12000, laborCost: 5000, expenseCost: 4000, sellingPrice: 28000 },
  { productId: "P-104", productName: "소형 플라스틱 캡 D", rawMaterialCost: 800, laborCost: 400, expenseCost: 300, sellingPrice: 2000 }
];

// 모의 거래처 및 예상 수금/지출 대장
const MOCK_FORECAST_LIST = [
  { id: "FC-01", date: "2026-06-08", type: "IN", title: "(주)현대모비스 매출채권 수금 예정", partnerName: "(주)현대모비스", amount: 45000000, isOverdue: false, contact: "010-1234-5678" },
  { id: "FC-02", date: "2026-06-10", type: "OUT", title: "한일스틸 원자재(코일) 대금 결제", partnerName: "한일스틸", amount: 25000000, isOverdue: false, contact: "010-8888-9999" },
  { id: "FC-03", date: "2026-06-15", type: "OUT", title: "6월 전직원 급여 및 상여금 지급", partnerName: "임직원 일동", amount: 32000000, isOverdue: false, contact: "내부 급여계" },
  { id: "FC-04", date: "2026-06-18", type: "IN", title: "삼성전자 가전사업부 수주잔고 수금", partnerName: "삼성전자(주)", amount: 55000000, isOverdue: false, contact: "010-2222-3333" },
  { id: "FC-05", date: "2026-06-20", type: "IN", title: "LG전자 디스플레이 부품 미수금 수금 (연체)", partnerName: "LG전자", amount: 18000000, isOverdue: true, contact: "010-5555-6666" },
  { id: "FC-06", date: "2026-06-25", type: "OUT", title: "한전 전기요금 및 공장 관리비 자동이체", partnerName: "한국전력공사", amount: 12500000, isOverdue: false, contact: "02-123-4567" },
  { id: "FC-07", date: "2026-07-02", type: "OUT", title: "대성케미칼 특수 수지 발주 대금 선입금", partnerName: "대성케미칼", amount: 22000000, isOverdue: false, contact: "010-7777-8888" },
  { id: "FC-08", date: "2026-07-10", type: "IN", title: "기아자동차 2차 벤더 납품 수금 예정", partnerName: "세원정밀", amount: 38000000, isOverdue: false, contact: "010-9999-0000" },
  { id: "FC-09", date: "2026-07-15", type: "OUT", title: "7월 임직원 정기 급여 지급", partnerName: "임직원 일동", amount: 30000000, isOverdue: false, contact: "내부 급여계" },
  { id: "FC-10", date: "2026-07-28", type: "IN", title: "협력사 삼우정밀 미수 대금 수금 (연체)", partnerName: "삼우정밀", amount: 15000000, isOverdue: true, contact: "010-4444-5555" },
];

/**
 * GET: 기본 자금 흐름 예측 시계열 데이터 및 제품 원가 정보 제공
 */
export async function GET() {
  try {
    // 1. 기초 현금 잔액 (예: 62,500,000원)
    let baseBalance = 62500000;
    const today = new Date("2026-06-07");
    
    const cashflowForecast = [];

    // 향후 90일간의 흐름 시뮬레이션 생성
    for (let i = 0; i <= 90; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateStr = currentDate.toISOString().split("T")[0];

      let expectedIn = 0;
      let expectedOut = 0;

      // 예상 트랜잭션 매핑
      MOCK_FORECAST_LIST.forEach((item) => {
        if (item.date === dateStr) {
          if (item.type === "IN") {
            expectedIn += item.amount;
          } else {
            expectedOut += item.amount;
          }
        }
      });

      // 현금 흐름 가감
      baseBalance = baseBalance + expectedIn - expectedOut;

      // 시나리오 오차 범위 시뮬레이션 (낙관/비관)
      // 비관 시나리오는 수금이 늦어지고 자재비가 추가 인상되는 상황
      const pessimisticOffset = i * -150000; 
      // 낙관 시나리오는 조기 수금 및 절감 발생 상황
      const optimisticOffset = i * 120000;

      cashflowForecast.push({
        date: dateStr,
        expectedIn,
        expectedOut,
        balanceNormal: baseBalance,
        balanceOptimistic: Math.max(0, baseBalance + optimisticOffset),
        balancePessimistic: Math.max(0, baseBalance + pessimisticOffset),
      });
    }

    // 초기 마진 계산
    const productMargins = INITIAL_PRODUCTS.map((prod) => {
      const costTotal = prod.rawMaterialCost + prod.laborCost + prod.expenseCost;
      const profit = prod.sellingPrice - costTotal;
      const marginRate = (profit / prod.sellingPrice) * 100;
      return {
        ...prod,
        costTotal,
        profit,
        marginRate,
      };
    });

    return NextResponse.json({
      success: true,
      currentBalance: 62500000,
      cashflowForecast,
      productMargins,
      forecastList: MOCK_FORECAST_LIST,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: 사용자가 입력한 시뮬레이션 조건에 따라 원가와 자금 흐름 재연산
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { exchangeRate, materialRate, laborRate } = body;

    // 1. 기준치 정의
    const baseExchangeRate = 1300; // 기준 환율
    const exchangeFactor = exchangeRate ? exchangeRate / baseExchangeRate : 1.0; // 환율 변동비율
    const matFactor = materialRate ? 1 + materialRate / 100 : 1.0; // 자재가 인상비율
    const laborFactor = laborRate ? 1 + laborRate / 100 : 1.0; // 인건비 인상비율

    // 2. 제품별 원가 구조 재연산
    const updatedMargins = INITIAL_PRODUCTS.map((prod) => {
      // 수입 원자재인 경우 환율과 자재가 변동이 결합되어 원자재비 상승에 반영됨
      const newRawMaterial = Math.round(prod.rawMaterialCost * exchangeFactor * matFactor);
      const newLabor = Math.round(prod.laborCost * laborFactor);
      const newExpense = prod.expenseCost; // 경비는 고정
      const costTotal = newRawMaterial + newLabor + newExpense;
      const profit = prod.sellingPrice - costTotal;
      const marginRate = (profit / prod.sellingPrice) * 100;

      return {
        ...prod,
        rawMaterialCost: newRawMaterial,
        laborCost: newLabor,
        expenseCost: newExpense,
        costTotal,
        profit,
        marginRate,
      };
    });

    // 3. 자금 흐름 변동 재시뮬레이션
    let baseBalance = 62500000;
    const today = new Date("2026-06-07");
    const cashflowForecast = [];

    // 유출입 항목 중 지출액(원자재 결제액, 급여액)에 비율 가중치 동적 결합
    for (let i = 0; i <= 90; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateStr = currentDate.toISOString().split("T")[0];

      let expectedIn = 0;
      let expectedOut = 0;

      MOCK_FORECAST_LIST.forEach((item) => {
        if (item.date === dateStr) {
          if (item.type === "IN") {
            expectedIn += item.amount;
          } else {
            // 거래 내용에 '원자재'가 들어가면 원자재 가중치 반영
            if (item.title.includes("원자재") || item.title.includes("발주")) {
              expectedOut += Math.round(item.amount * matFactor * exchangeFactor);
            } 
            // '급여'가 들어가면 인건비 가중치 반영
            else if (item.title.includes("급여") || item.title.includes("인건비")) {
              expectedOut += Math.round(item.amount * laborFactor);
            } else {
              expectedOut += item.amount;
            }
          }
        }
      });

      baseBalance = baseBalance + expectedIn - expectedOut;

      const pessimisticOffset = i * -180000; 
      const optimisticOffset = i * 100000;

      cashflowForecast.push({
        date: dateStr,
        expectedIn,
        expectedOut,
        balanceNormal: baseBalance,
        balanceOptimistic: Math.max(0, baseBalance + optimisticOffset),
        balancePessimistic: Math.max(0, baseBalance + pessimisticOffset),
      });
    }

    return NextResponse.json({
      success: true,
      productMargins: updatedMargins,
      cashflowForecast,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
