import { NextResponse } from "next/server";

// 모의 생산 계획 인메모리 데이터베이스
let MOCK_GANTT_TASKS = [
  { id: "T-01", title: "자동차 범퍼 사출 가공", equipmentId: "M-500", equipmentName: "사출 1호기 (M-500)", operatorName: "강성욱 (기사)", startHour: 9, endHour: 12, progress: 100, status: "COMPLETED" },
  { id: "T-02", title: "가전 외장 케이스 압출", equipmentId: "M-300", equipmentName: "사출 2호기 (M-300)", operatorName: "이민우 (조장)", startHour: 9, endHour: 13, progress: 75, status: "RUNNING" },
  { id: "T-03", title: "내부 정밀 기어 사출", equipmentId: "M-200", equipmentName: "사출 3호기 (M-200)", operatorName: "박준영 (사원)", startHour: 10, endHour: 15, progress: 20, status: "RUNNING" },
  { id: "T-04", title: "범퍼 후가공 및 마감", equipmentId: "A-100", equipmentName: "조립 라인 A (A-100)", operatorName: "최현우 (조장)", startHour: 13, endHour: 17, progress: 0, status: "WAITING" },
  { id: "T-05", title: "외장 케이스 도장 건조", equipmentId: "A-100", equipmentName: "조립 라인 A (A-100)", operatorName: "김태호 (사원)", startHour: 17, endHour: 21, progress: 0, status: "WAITING" },
];

// 모의 신규 미배정 주문 목록
let MOCK_UNSCHEDULED_ORDERS = [
  { orderId: "ORD-9954", productName: "냉장고 도어 힌지 몰딩", qty: 2500, dueDate: "2026-06-12", status: "UNSCHEDULED" },
  { orderId: "ORD-9955", productName: "자동차 헤드램프 가이드", qty: 1200, dueDate: "2026-06-14", status: "UNSCHEDULED" },
  { orderId: "ORD-9956", productName: "스마트TV 후면 프레임", qty: 3000, dueDate: "2026-06-18", status: "UNSCHEDULED" },
];

/**
 * GET: 생산 계획 정보, 미배정 주문 리스트 및 설비 병목지수 조회
 */
export async function GET() {
  try {
    // 가동률 기반 설비별 병목지수 연산 (모의)
    const bottlenecks = [
      { id: "M-500", name: "사출 1호기 (M-500)", loadRate: 98, status: "CRITICAL", queueTasks: 4 },
      { id: "M-300", name: "사출 2호기 (M-300)", loadRate: 85, status: "WARNING", queueTasks: 2 },
      { id: "M-200", name: "사출 3호기 (M-200)", loadRate: 60, status: "NORMAL", queueTasks: 1 },
      { id: "A-100", name: "조립 라인 A (A-100)", loadRate: 45, status: "NORMAL", queueTasks: 1 },
    ];

    // 수주별 예정된 납기 준수 확률 예측 (모의)
    const dueRiskAnalysis = [
      { orderId: "ORD-9951", productName: "현대차 도어 가니쉬", probability: 98, status: "SAFE" },
      { orderId: "ORD-9952", productName: "삼성 에어컨 그릴", probability: 89, status: "SAFE" },
      { orderId: "ORD-9953", productName: "LG 노트북 쉘", probability: 64, status: "WARNING" }, // 사출 1호기 병목으로 인한 지연 우려
    ];

    return NextResponse.json({
      success: true,
      ganttTasks: MOCK_GANTT_TASKS,
      unscheduledOrders: MOCK_UNSCHEDULED_ORDERS,
      bottlenecks,
      dueRiskAnalysis,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: 일정 재배치 최적화(reschedule) 및 모바일 진행상태 업데이트 처리
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. 공정 스케줄링 재배치 (reschedule)
    if (action === "reschedule") {
      const { taskId, startHour, endHour, equipmentId } = body;
      
      // 대상 작업 정보 수정
      MOCK_GANTT_TASKS = MOCK_GANTT_TASKS.map((task) => {
        if (task.id === taskId) {
          const eqNames: Record<string, string> = {
            "M-500": "사출 1호기 (M-500)",
            "M-300": "사출 2호기 (M-300)",
            "M-200": "사출 3호기 (M-200)",
            "A-100": "조립 라인 A (A-100)"
          };
          return {
            ...task,
            startHour,
            endHour,
            equipmentId,
            equipmentName: eqNames[equipmentId] || task.equipmentName,
          };
        }
        return task;
      });

      return NextResponse.json({
        success: true,
        message: "AI 스케줄러가 제약 조건을 준수하며 일정을 실시간 재정렬했습니다.",
        ganttTasks: MOCK_GANTT_TASKS,
      });
    }

    // 2. 신규 주문 공정 자동 배정 (schedule_order)
    if (action === "schedule_order") {
      const { orderId, equipmentId, startHour, duration } = body;
      const orderToSchedule = MOCK_UNSCHEDULED_ORDERS.find(o => o.orderId === orderId);

      if (!orderToSchedule) {
        return NextResponse.json({ success: false, error: "주문 정보를 찾을 수 없습니다." }, { status: 400 });
      }

      // 미배정 리스트에서 제거
      MOCK_UNSCHEDULED_ORDERS = MOCK_UNSCHEDULED_ORDERS.filter(o => o.orderId !== orderId);

      // 간트 태스크에 신규 추가
      const newTaskId = `T-${Date.now()}`;
      const eqNames: Record<string, string> = {
        "M-500": "사출 1호기 (M-500)",
        "M-300": "사출 2호기 (M-300)",
        "M-200": "사출 3호기 (M-200)",
        "A-100": "조립 라인 A (A-100)"
      };

      const newGanttTask = {
        id: newTaskId,
        title: `[신규] ${orderToSchedule.productName}`,
        equipmentId,
        equipmentName: eqNames[equipmentId] || "미정",
        operatorName: "자동 매칭(예비)",
        startHour,
        endHour: startHour + duration,
        progress: 0,
        status: "WAITING" as const,
      };

      MOCK_GANTT_TASKS.push(newGanttTask);

      return NextResponse.json({
        success: true,
        message: `주문 ${orderId}가 설비 스케줄에 자동으로 최적 배정 완료되었습니다.`,
        ganttTasks: MOCK_GANTT_TASKS,
        unscheduledOrders: MOCK_UNSCHEDULED_ORDERS,
      });
    }

    // 3. 모바일 상태 업데이트 (update_status)
    if (action === "update_status") {
      const { taskId, status, progress } = body;

      MOCK_GANTT_TASKS = MOCK_GANTT_TASKS.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            status,
            progress: progress !== undefined ? progress : task.progress,
          };
        }
        return task;
      });

      return NextResponse.json({
        success: true,
        message: "공정 상태가 변경되어 PC ERP 대장에 실시간 반영되었습니다.",
        ganttTasks: MOCK_GANTT_TASKS,
      });
    }

    return NextResponse.json({ success: false, error: "올바른 액션이 정의되지 않았습니다." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
