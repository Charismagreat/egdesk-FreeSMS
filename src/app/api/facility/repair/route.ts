import { NextResponse } from "next/server";

// 모의 수리 대장 데이터
const MOCK_REPAIR_LOGS = [
  {
    id: "REP-2026-004",
    date: "2026-06-06 23:30",
    equipmentId: "M-500",
    equipmentName: "사출 1호기",
    errorCode: "E-03",
    symptom: "사출 노즐 히터 과열 오류 발생 및 히터 차단",
    repairDesc: "히터 카트리지 3번 단선 확인 후 신품 자재로 교체하고 온도 제어 릴레이 접점 접촉 청소 완료함.",
    mechanic: "김철수 (설비정비원)",
    cost: 120000,
  },
  {
    id: "REP-2026-003",
    date: "2026-06-02 11:20",
    equipmentId: "M-300",
    equipmentName: "사출 2호기",
    errorCode: "E-15",
    symptom: "유압 서보 모터 과부하 정지 및 기어 진동 가중",
    repairDesc: "서보 모터 고정 커플링 마모로 인한 유격 감지되어 솔레노이드 밸브 실링 교체 및 커플링 록타이트 보강 체결 완료.",
    mechanic: "이영희 (설비정비원)",
    cost: 450000,
  },
  {
    id: "REP-2026-002",
    date: "2026-05-28 09:15",
    equipmentId: "A-100",
    equipmentName: "조립 라인 A",
    errorCode: "W-08",
    symptom: "컨베이어 기어 벨트 미끄러짐 및 펄스 카운트 에러",
    repairDesc: "기어 드라이브 구동 벨트 마모 및 인장 저하. 벨트 장력 실린더 압력 리셋 및 신품 타이밍 벨트(3GT) 교체.",
    mechanic: "김철수 (설비정비원)",
    cost: 85000,
  }
];

// AI 고장 진단 대책 가이드 DB (RAG용 지식 매칭)
const MOCK_RAG_SOLUTIONS: Record<string, { rootCause: string; actions: string[]; similarHistory: string; warehouse: string }> = {
  "E-03": {
    rootCause: "히터 전원 케이블 커넥터 접촉 불량 또는 히터 카트리지 국부 소손",
    actions: [
      "1. 제어반 전원을 차단하고 히터 3상 단자의 저항치(정상 범위: 20~40옴)를 측정합니다.",
      "2. 저항치가 무한대일 경우 히터 카트리지를 교체하십시오.",
      "3. 릴레이 단자대의 전선 조임 상태 및 오염 물질을 클리너로 청소하십시오."
    ],
    similarHistory: "2024년 5월 김 반장님이 히터 블록 접촉 단자를 청소해 해결한 이력이 있습니다.",
    warehouse: "자재창고 A동 3번 선반 (고온 히터 300W - 코드 PT-085)"
  },
  "E-15": {
    rootCause: "유압 오일 냉각 필터 막힘에 따른 점도 상승 및 서보 모터 피드 과부하",
    actions: [
      "1. 유압 오일 필터 압력 게이지를 체크하여 막힘 상태를 검진합니다.",
      "2. 바이패스 밸브를 열어 필터 엘리먼트를 교체 세척합니다.",
      "3. 오일 탱크 온도를 측정하여 55도 이하인지 확인하십시오."
    ],
    similarHistory: "2025년 2월 유압 펌프 필터 교체로 과부하 트립 문제를 해결한 사례가 있습니다.",
    warehouse: "기계부품실 B구역 2번 캐비닛 (유압 오일 필터)"
  }
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("query") || "";
  const errCodeQuery = searchParams.get("errorCode") || "";

  // 1. RAG 챗봇 질의 처리
  if (errCodeQuery) {
    const solution = MOCK_RAG_SOLUTIONS[errCodeQuery.toUpperCase()] || {
      rootCause: "알 수 없는 에러 코드이거나 비정형 결함입니다. 과거 데이터베이스에서 매칭되지 않았습니다.",
      actions: [
        "1. 설비 매뉴얼의 긴급 정지 및 고장 배선도를 확인하십시오.",
        "2. 센서 실시간 피드의 Anomaly Score 기여도 랭킹을 참고하십시오."
      ],
      similarHistory: "과거 유사 사례가 존재하지 않습니다.",
      warehouse: "확인 불가"
    };

    return NextResponse.json({
      success: true,
      query: errCodeQuery,
      solution
    });
  }

  // 2. 수리 대장 필터링
  let filtered = MOCK_REPAIR_LOGS;
  if (keyword) {
    filtered = MOCK_REPAIR_LOGS.filter(log => 
      log.equipmentName.includes(keyword) || 
      log.symptom.includes(keyword) || 
      log.repairDesc.includes(keyword) || 
      log.errorCode.includes(keyword)
    );
  }

  return NextResponse.json({
    success: true,
    logs: filtered
  });
}

// POST: 신규 수리 이력 등록 및 음성 STT 텍스트 보정 모킹
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, rawSpeechText, equipmentId, errorCode, symptom, mechanic } = body;

    // 음성(STT) 입력에 의한 보고서 자동 변환 모킹
    if (action === "voice_stt") {
      let correctedText = rawSpeechText;
      if (rawSpeechText.includes("3번 사출기 모터 베어링 마모")) {
        correctedText = "사출 1호기(M-500) 구동축 롤러 베어링 마모 점검 후 구리스 주입 및 고정 볼트 토크 조임 완료함.";
      }
      return NextResponse.json({
        success: true,
        originalText: rawSpeechText,
        correctedText,
      });
    }

    // 신규 수리 이력 생성
    const newLog = {
      id: `REP-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleString(),
      equipmentId: equipmentId || "M-500",
      equipmentName: "사출 1호기",
      errorCode: errorCode || "정기보전",
      symptom: symptom || "정기 예방 정비 실시",
      repairDesc: body.repairDesc || "점검 완료",
      mechanic: mechanic || "관리자",
      cost: body.cost || 0
    };

    MOCK_REPAIR_LOGS.unshift(newLog);

    return NextResponse.json({
      success: true,
      message: "설비 수리 보고서가 데이터베이스에 성공적으로 저장되었습니다.",
      log: newLog
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
