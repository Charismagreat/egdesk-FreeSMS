import { NextResponse } from "next/server";

// 1. 모의 공장 IP CCTV 비전 피드 정보
// 바운딩 박스(Bounding Box) 좌표 오버레이 데이터 포함
let MOCK_CCTVS = [
  {
    id: "CCTV-01",
    name: "프레스 1호기 구역 (CCTV-01)",
    status: "WARNING", // NORMAL, WARNING, EMERGENCY_STOP
    boundingBoxes: [
      { x: 120, y: 80, w: 90, h: 160, label: "작업자: 홍길동", color: "#10b981" }, // 정상 작업자 (안전모 착용)
      { x: 320, y: 110, w: 80, h: 140, label: "⚠️ 안전모 미착용 감지", color: "#f43f5e" }, // 경고 대상
      { x: 450, y: 40, w: 200, h: 180, label: "Virtual Fence: 위험 구역 경계선", color: "#f59e0b", isArea: true },
    ]
  },
  {
    id: "CCTV-02",
    name: "사출 성형 2호동 (CCTV-02)",
    status: "NORMAL",
    boundingBoxes: [
      { x: 220, y: 90, w: 85, h: 150, label: "작업자: 김철수", color: "#10b981" },
      { x: 400, y: 100, w: 90, h: 150, label: "작업자: 이영희", color: "#10b981" }
    ]
  },
  {
    id: "CCTV-03",
    name: "B2 입출고 로딩독 (CCTV-03)",
    status: "NORMAL",
    boundingBoxes: [
      { x: 150, y: 120, w: 180, h: 110, label: "지게차 운행 차선", color: "#10b981", isArea: true },
      { x: 480, y: 130, w: 80, h: 120, label: "작업자: 박민수", color: "#10b981" }
    ]
  }
];

// 2. 모의 실시간 위험 감지 이벤트 감사록 (Logs)
let MOCK_DANGER_LOGS = [
  {
    id: "LOG-501",
    time: "14:32:15",
    location: "프레스 1호기 구역",
    title: "작업자 안전 보호구(안전모) 미착용 감지",
    level: "WARNING", // WARNING, CRITICAL
    status: "DETECTED", // DETECTED, SIREN_PLAYED, RESOLVED
    operator: "홍길동 (사원)"
  },
  {
    id: "LOG-502",
    time: "12:15:44",
    location: "B2 입출고 로딩독",
    title: "제한구역(지게차 전용선) 보행자 무단 침범",
    level: "CRITICAL",
    status: "RESOLVED",
    operator: "박민수 (기사)"
  },
  {
    id: "LOG-503",
    time: "09:44:02",
    location: "사출 성형 2호동",
    title: "설비 주변 3초 이상 움직임 없음 (낙상/쓰러짐 의심)",
    level: "CRITICAL",
    status: "RESOLVED",
    operator: "이영희 (사원)"
  }
];

// 3. 공장 구역별 누적 위험 핫스팟 지표 (Hotspots)
let MOCK_HOTSPOTS = [
  { zoneId: "ZONE-A", zoneName: "프레스 성형 가공실", dangerScore: 82 }, // 누적 위험도 높음
  { zoneId: "ZONE-B", zoneName: "사출 성형 작업동", dangerScore: 45 },
  { zoneId: "ZONE-C", zoneName: "B2 자재 로딩 야드", dangerScore: 60 },
  { zoneId: "ZONE-D", zoneName: "조립 및 포장 라인", dangerScore: 20 }
];

/**
 * GET: CCTV 피드 오버레이 좌표, 위험 로그 히스토리, 핫스팟 분석 데이터 반환
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      cctvs: MOCK_CCTVS,
      dangerLogs: MOCK_DANGER_LOGS,
      hotspots: MOCK_HOTSPOTS
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: 현장 경고 사이렌 방송 및 특정 설비/공정 원격 비상 정지(STOP)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. 경고 사이렌 방송 송출 (trigger_siren)
    if (action === "trigger_siren") {
      const { logId } = body;
      const log = MOCK_DANGER_LOGS.find(l => l.id === logId);

      if (!log) {
        return NextResponse.json({ success: false, error: "위험 로그를 찾을 수 없습니다." }, { status: 400 });
      }

      // 로그 상태 업데이트
      MOCK_DANGER_LOGS = MOCK_DANGER_LOGS.map((l) => {
        if (l.id === logId) {
          return { ...l, status: "SIREN_PLAYED" as const };
        }
        return l;
      });

      // CCTV 카메라 구역 경보 유도
      MOCK_CCTVS = MOCK_CCTVS.map((c) => {
        if (c.name.includes(log.location)) {
          return { ...c, status: "WARNING" as const };
        }
        return c;
      });

      return NextResponse.json({
        success: true,
        message: "현장 스피커로 경고 안내 방송 및 LED 경광등이 긴급 가동되었습니다.",
        cctvs: MOCK_CCTVS,
        dangerLogs: MOCK_DANGER_LOGS,
        hotspots: MOCK_HOTSPOTS
      });
    }

    // 2. 특정 구역 공정 비상 셧다운 정지 (emergency_stop)
    if (action === "emergency_stop") {
      const { zoneId } = body;
      const zone = MOCK_HOTSPOTS.find(h => h.zoneId === zoneId);

      if (!zone) {
        return NextResponse.json({ success: false, error: "공장 구역 정보를 찾을 수 없습니다." }, { status: 400 });
      }

      // CCTV를 EMERGENCY_STOP 상태로 락
      MOCK_CCTVS = MOCK_CCTVS.map((c) => {
        if (c.name.includes(zone.zoneName) || (zoneId === "ZONE-A" && c.id === "CCTV-01")) {
          return { 
            ...c, 
            status: "EMERGENCY_STOP" as const,
            boundingBoxes: [
              { x: 50, y: 120, w: 700, h: 80, label: "🛑 EMERGENCY SHUTDOWN: 원격 공정 가동 정지됨", color: "#f43f5e", isArea: true }
            ]
          };
        }
        return c;
      });

      // 관련 로그가 감지 상태이면 RESOLVED로 마무리
      MOCK_DANGER_LOGS = MOCK_DANGER_LOGS.map((l) => {
        if (l.location.includes(zone.zoneName) || (zoneId === "ZONE-A" && l.location.includes("프레스"))) {
          return { ...l, status: "RESOLVED" as const };
        }
        return l;
      });

      // 핫스팟 누적 사고 기록 증가 시뮬레이션
      MOCK_HOTSPOTS = MOCK_HOTSPOTS.map((h) => {
        if (h.zoneId === zoneId) {
          return { ...h, dangerScore: Math.min(100, h.dangerScore + 5) };
        }
        return h;
      });

      return NextResponse.json({
        success: true,
        message: `${zone.zoneName} 설비 전원이 즉각 차단되었으며 안전 셧다운 감사 대장에 기록되었습니다.`,
        cctvs: MOCK_CCTVS,
        dangerLogs: MOCK_DANGER_LOGS,
        hotspots: MOCK_HOTSPOTS
      });
    }

    return NextResponse.json({ success: false, error: "올바른 액션이 정의되지 않았습니다." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
