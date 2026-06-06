import { NextResponse } from "next/server";

// 모의 NCR 대장 데이터
const MOCK_NCR_ITEMS = [
  {
    id: "NCR-2026-004",
    date: "2026-06-06 23:45",
    itemName: "사출 성형 커버 A형",
    defectCode: "DEF-022",
    defectType: "표면 수축 및 함몰",
    quantity: 120,
    reporter: "김철수 (공정검사원)",
    status: "UNDER_REVIEW", // UNDER_REVIEW, CONTAINED, CAPA_ISSUED, COMPLETED
    description: "사출 성형 후 냉각 불량으로 인해 전면부 표면에 수축 함몰(Sink Mark)이 발생하여 규격 한계 초과함.",
    actionPlan: "",
  },
  {
    id: "NCR-2026-003",
    date: "2026-06-05 10:15",
    itemName: "커넥터 하우징 B형",
    defectCode: "DEF-008",
    defectType: "미성형 결함",
    quantity: 45,
    reporter: "이영희 (출하검사원)",
    status: "CAPA_ISSUED",
    description: "원자재 공급 불균형으로 인해 하단 결속 핀 성형부에 미성형 결함이 관찰되어 출하 대기 격리함.",
    actionPlan: "노즐 온도 5도 상향 조정 및 원자재 공급 압력 조절 피드 메커니즘 튜닝 완료.",
  },
  {
    id: "NCR-2026-002",
    date: "2026-06-02 16:30",
    itemName: "사출 성형 커버 A형",
    defectCode: "DEF-015",
    defectType: "이물 혼입",
    quantity: 15,
    reporter: "박민수 (수입검사원)",
    status: "COMPLETED",
    description: "원재료 피딩 호퍼 세척 관리 소홀로 인한 흑점 이물 혼입 발견.",
    actionPlan: "호퍼 청소 스케줄 강화(주 1회 -> 매일 작업 전) 및 집진 쉴드 커버 장착 완료.",
  }
];

// LLM RAG 기반 과거 유사 결합 조치 이력 추천 데이터
const MOCK_SIMILAR_CASES = [
  {
    id: "NCR-2024-118",
    title: "2024년 11월 사출 커버 표면 수축 불량 발생 건",
    similarity: 95.8, // 유사도 %
    rootCause: "냉각 순환 밸브 스케일(침전물) 누적으로 인한 냉각 열교환 효율 저하.",
    actionTaken: "냉각 배관 세척액 플러싱 실시 및 냉각 타이머 2.5초 연장 설정. 조치 후 Cpk 1.45로 복귀.",
  },
  {
    id: "NCR-2025-042",
    title: "2025년 4월 금형 온도 편차로 인한 Sink Mark 발생 건",
    similarity: 88.2,
    rootCause: "금형 가열 히터 카트리지 3번 단선으로 인한 국부적 온도 저하.",
    actionTaken: "단선된 가열 카트리지 교체 및 금형 온도 상한 경보 센서 이중화 튜닝.",
  }
];

// GET: NCR 목록 조회 및 유사 사례 추천 데이터 조회
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const searchKeyword = searchParams.get("query") || "";
  
  // 간단한 필터
  let filtered = MOCK_NCR_ITEMS;
  if (searchKeyword) {
    filtered = MOCK_NCR_ITEMS.filter(item => 
      item.itemName.includes(searchKeyword) || 
      item.defectType.includes(searchKeyword) || 
      item.description.includes(searchKeyword)
    );
  }

  return NextResponse.json({
    success: true,
    ncrList: filtered,
    similarCases: MOCK_SIMILAR_CASES
  });
}

// PUT: NCR 조치 완료 및 상태 갱신
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, actionPlan } = body;

    // 모의 업데이트 성공 반환
    return NextResponse.json({
      success: true,
      message: `부적합 보고서 [${id}]에 대한 조치 사항이 등록되어 상태가 변경되었습니다.`,
      updatedItem: {
        id,
        status: status || "COMPLETED",
        actionPlan: actionPlan || "지정된 대책 처리 완료",
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
