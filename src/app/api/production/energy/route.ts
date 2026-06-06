import { NextResponse } from "next/server";

// 1. 모의 실시간 공장 전력 소비량 시계열 (09:00 ~ 21:00)
// actual: 실제 계측 (15시 이전까지만 존재), forecast: AI 예측 (13시 ~ 21시)
let MOCK_POWER_POINTS = [
  { time: "09:00", actual: 45, forecast: 45 },
  { time: "10:00", actual: 62, forecast: 60 },
  { time: "11:00", actual: 78, forecast: 75 },
  { time: "12:00", actual: 40, forecast: 42 }, // 점심시간 가동 감소
  { time: "13:00", actual: 82, forecast: 85 },
  { time: "14:00", actual: 95, forecast: 98 },
  { time: "15:00", actual: null, forecast: 108 }, // 피크 위계 감지 시간대 (계약전력 100kW 초과)
  { time: "16:00", actual: null, forecast: 92 },
  { time: "17:00", actual: null, forecast: 85 },
  { time: "18:00", actual: null, forecast: 55 },
  { time: "19:00", actual: null, forecast: 50 },
  { time: "20:00", actual: null, forecast: 45 },
  { time: "21:00", actual: null, forecast: 38 },
];

// 2. 모의 설비별 소비 전력 통계
let MOCK_EQUIPMENTS = [
  { id: "M-500", name: "사출 1호기 (M-500)", currentPower: 42, accumulatedEnergy: 380, estimatedCost: 45600, isOnline: true },
  { id: "M-300", name: "사출 2호기 (M-300)", currentPower: 28, accumulatedEnergy: 250, estimatedCost: 30000, isOnline: true },
  { id: "M-200", name: "사출 3호기 (M-200)", currentPower: 15, accumulatedEnergy: 140, estimatedCost: 16800, isOnline: true },
  { id: "A-100", name: "조립 라인 A (A-100)", currentPower: 8, accumulatedEnergy: 75, estimatedCost: 9000, isOnline: true },
];

// 3. AI 에너지 비용 절감형 설비 가동 추천 리스트
let MOCK_RECOMMENDATIONS = [
  {
    id: "REC-01",
    title: "사출 1호기(M-500) 15시 공정 우회",
    effect: 245000,
    reason: "한전 최대 중부하 요금 시간대(15시) 회피하여 요금이 저렴한 17시로 가동 시간 재조정",
    targetEqId: "M-500",
    shiftHours: 2,
    applied: false
  },
  {
    id: "REC-02",
    title: "조립 라인 A 비필수 냉방 부하 셧다운",
    effect: 48000,
    reason: "실시간 전력량이 계약전력의 90% 이상 도달 시, 조립동의 비필수 예비 공조기를 원격 오프 제어",
    targetEqId: "A-100",
    shiftHours: 1,
    applied: false
  }
];

const CONTRACT_POWER = 100; // 계약 전력 임계치 (kW)

/**
 * GET: 실시간 전력 부하 데이터, 설비별 누적 사용량, 절감 추천 리스트 조회
 */
export async function GET() {
  try {
    // 실제 계측된 데이터 중의 최대값 구하기
    const actualValues = MOCK_POWER_POINTS.filter(p => p.actual !== null).map(p => p.actual as number);
    const currentPeak = actualValues.length > 0 ? Math.max(...actualValues) : 82;

    return NextResponse.json({
      success: true,
      powerPoints: MOCK_POWER_POINTS,
      equipments: MOCK_EQUIPMENTS,
      recommendations: MOCK_RECOMMENDATIONS,
      contractPower: CONTRACT_POWER,
      currentPeak,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: 추천 가이드 적용 및 모바일 원격 셧다운 제어
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. 추천 절감 적용 (apply_saving)
    if (action === "apply_saving") {
      const { recId } = body;
      const rec = MOCK_RECOMMENDATIONS.find(r => r.id === recId);

      if (!rec) {
        return NextResponse.json({ success: false, error: "추천 정보가 유효하지 않습니다." }, { status: 400 });
      }

      // 상태 변경
      MOCK_RECOMMENDATIONS = MOCK_RECOMMENDATIONS.map((r) => {
        if (r.id === recId) {
          return { ...r, applied: true };
        }
        return r;
      });

      // 피크 전력량 감소 모의 시뮬레이션 연출
      // 15시의 과부하 예측(108kW)을 90kW 이하로 낮추어 피크 임계치 이탈 위기를 해결함
      MOCK_POWER_POINTS = MOCK_POWER_POINTS.map((point) => {
        if (point.time === "15:00") {
          return { ...point, forecast: 88 }; // 20kW 가량의 부하 감축
        }
        if (point.time === "17:00") {
          return { ...point, forecast: point.forecast! + 12 }; // 우회 적용으로 17시로 부하가 약간 이전됨
        }
        return point;
      });

      // 설비 누적 전기요금 할인 혜택 반영 시뮬레이션
      MOCK_EQUIPMENTS = MOCK_EQUIPMENTS.map((eq) => {
        if (eq.id === rec.targetEqId) {
          return {
            ...eq,
            estimatedCost: Math.max(0, eq.estimatedCost - rec.effect), // 절감액 차감 적용
          };
        }
        return eq;
      });

      return NextResponse.json({
        success: true,
        message: "AI 에너지 절감 일정이 최종 승인되어, 15시 전력 피크 위험 요소를 완전히 해결했습니다.",
        powerPoints: MOCK_POWER_POINTS,
        equipments: MOCK_EQUIPMENTS,
        recommendations: MOCK_RECOMMENDATIONS,
      });
    }

    // 2. 모바일 설비 원격 셧다운 제어 (toggle_shutdown)
    if (action === "toggle_shutdown") {
      const { eqId } = body;
      let targetEq = MOCK_EQUIPMENTS.find(e => e.id === eqId);

      if (!targetEq) {
        return NextResponse.json({ success: false, error: "설비 정보를 찾을 수 없습니다." }, { status: 400 });
      }

      const newOnlineStatus = !targetEq.isOnline;
      const powerDiff = targetEq.currentPower;

      // 설비 상태 갱신
      MOCK_EQUIPMENTS = MOCK_EQUIPMENTS.map((eq) => {
        if (eq.id === eqId) {
          return {
            ...eq,
            isOnline: newOnlineStatus,
            currentPower: newOnlineStatus ? (eqId === "M-500" ? 42 : eqId === "M-300" ? 28 : eqId === "M-200" ? 15 : 8) : 0,
          };
        }
        return eq;
      });

      // 실시간 시계열 전력 소모량(actual 및 forecast) 동적 감축 반영
      // 비필수 설비 차단 시 현재 시간대(14시/15시 부근)의 전력이 줄어드는 모의 연산
      MOCK_POWER_POINTS = MOCK_POWER_POINTS.map((point) => {
        // 실제 계측 14:00 셧다운 시
        if (point.time === "14:00" && point.actual !== null) {
          return {
            ...point,
            actual: newOnlineStatus ? point.actual : Math.max(0, point.actual - powerDiff),
          };
        }
        // 미래 예측 15:00 셧다운 시
        if (point.time === "15:00") {
          return {
            ...point,
            forecast: newOnlineStatus ? point.forecast! : Math.max(0, point.forecast! - powerDiff),
          };
        }
        return point;
      });

      return NextResponse.json({
        success: true,
        message: `설비 가동 상태가 ${newOnlineStatus ? "ON" : "OFF"}으로 원격 전환되어 전하 부하가 보정되었습니다.`,
        powerPoints: MOCK_POWER_POINTS,
        equipments: MOCK_EQUIPMENTS,
        recommendations: MOCK_RECOMMENDATIONS,
      });
    }

    return NextResponse.json({ success: false, error: "올바른 액션이 정의되지 않았습니다." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
