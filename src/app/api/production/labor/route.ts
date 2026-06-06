import { NextResponse } from "next/server";

// 1. 모의 임직원 근태 통계 대장
let MOCK_STATS = [
  { id: "EMP-201", name: "김태호", department: "생산 조립 1라인", weeklyHours: 51.5, overtimeHours: 11.5, latenessCount: 3, earlyLeaveCount: 1, riskLevel: "CRITICAL" as const }, // 주 52시간 한도 육박
  { id: "EMP-202", name: "이소연", department: "물류 자재창고", weeklyHours: 42.0, overtimeHours: 2.0, latenessCount: 0, earlyLeaveCount: 0, riskLevel: "SAFE" as const },
  { id: "EMP-203", name: "박준서", department: "도장 마감부", weeklyHours: 48.0, overtimeHours: 8.0, latenessCount: 1, earlyLeaveCount: 2, riskLevel: "WARNING" as const },
  { id: "EMP-204", name: "최유리", department: "품질 보증실", weeklyHours: 40.0, overtimeHours: 0.0, latenessCount: 0, earlyLeaveCount: 0, riskLevel: "SAFE" as const }
];

// 2. 모의 전사 노무 진단 요약 정보
let MOCK_SUMMARY = {
  auditScore: 72, // 100점 만점 기준 (위법 계약 조항 및 근태 초과자 반영)
  criticalCount: 2, // 법적 대응 조치 필요 직원 수
  unpaidAllowance: 1850000, // 미지급 추정 수당
  riskFactors: [
    "⚠️ 연장근로 한도(주 52시간) 위반 우려 대상자 1명 감지 (김태호 대리)",
    "⚠️ 포괄임금제 계약 조항 내 연장근로 대가 무단 미명시로 인한 임금체불 소지 1건",
    "💡 주 15시간 미만 초단기 근로자가 아님에도 주휴수당 지급 조건 계약서 명시 누락 1건"
  ]
};

// 3. 모의 근로계약서 조항 분석 데이터
let MOCK_CONTRACTS: Record<string, any> = {
  "EMP-201": {
    employeeId: "EMP-201",
    employeeName: "김태호",
    clauses: [
      {
        id: "CL-01",
        title: "연장 및 야간 근로 한도 설정",
        isIllegal: true,
        currentText: "을(근로자)은 업무 필요 시 사전 합의 없이 주 12시간 이상의 연장 근로를 무제한 제공하며, 이에 동의한다.",
        recommendedText: "을(근로자)의 연장 근로는 1주 12시간을 한도로 노사 상호 합의 하에 실시하며, 연장 근로에 대한 적격 수당을 법정 요율(150%)에 맞추어 지급한다.",
        reason: "근로기준법 제53조 제1항 위배. 당사자 간에 합의하더라도 1주간 12시간을 초과하여 연장근로를 시킬 수 없으며, 위반 시 형사처벌 대상입니다."
      },
      {
        id: "CL-02",
        title: "포괄 임금 고정 연장 수당 매칭",
        isIllegal: true,
        currentText: "을의 기본급에는 월간 발생하는 모든 연장, 야간 및 휴일근로에 대한 수당이 전액 포함된 것으로 간주하며, 추가 청구할 수 없다.",
        recommendedText: "기본급 2,500,000원 외에 포괄 연장근로수당(월 20시간분) 350,000원을 명확히 분리 표기하며, 이를 초과하여 근무한 시간에 대해서는 근로기준법에 의거 가산수당을 추가 정산 지급한다.",
        reason: "대법원 포괄임금제 유효성 판단 기준 위배. 수당의 세부 항목과 연장 시간이 명확히 구분되어 계약서에 명시되지 않은 포괄임금 합의는 법적 무효이며, 임금체불 소송 원인이 됩니다."
      }
    ]
  },
  "EMP-203": {
    employeeId: "EMP-203",
    employeeName: "박준서",
    clauses: [
      {
        id: "CL-03",
        title: "주휴수당 지급 규정 명시",
        isIllegal: true,
        currentText: "을은 소정 근로일에 개근하더라도 주휴일에 대해 유급으로 처리하지 않으며, 단가에 주휴수당은 미포함한다.",
        recommendedText: "1주간 소정 근로일을 개근한 경우 근로기준법 제55조에 의거하여 1일의 유급 주휴일을 부여하며, 관계 법령에 의거한 주휴수당을 기본급에 가산하여 지급한다.",
        reason: "근로기준법 제55조 위배. 주 15시간 이상 근무하고 소정근로일을 개근한 모든 근로자에게는 유급 주휴일을 의무 부여해야 합니다. (위반 시 2년 이하 징역 또는 2천만원 이하 벌금)"
      }
    ]
  }
};

/**
 * GET: 직원 근태 진단 정보 및 계약서 조항 조회
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      stats: MOCK_STATS,
      summary: MOCK_SUMMARY,
      contracts: MOCK_CONTRACTS
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: 노무 진단 재연산 및 계약 조항 보정
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. 실시간 근태 정밀 재진단
    if (action === "generate_audit") {
      // 0.5초 진단 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500));

      // 약간의 지각 수치 변화 등으로 동적 보정
      MOCK_STATS = MOCK_STATS.map(s => {
        if (s.id === "EMP-201") {
          return { ...s, weeklyHours: 49.8, overtimeHours: 9.8, riskLevel: "WARNING" as const }; // 조치 후 근로시간 완화 시뮬레이션
        }
        return s;
      });

      MOCK_SUMMARY = {
        ...MOCK_SUMMARY,
        auditScore: 88, // 72점에서 88점으로 점수 상향
        criticalCount: 1, // 크리티컬 1명 감소
        riskFactors: [
          "⚠️ 포괄임금제 계약 조항 내 연장근로 대가 무단 미명시로 인한 임금체불 소지 1건",
          "💡 주 15시간 미만 초단기 근로자가 아님에도 주휴수당 지급 조건 계약서 명시 누락 1건"
        ]
      };

      return NextResponse.json({
        success: true,
        message: "실시간 출퇴근 데이터 스캔 및 노무 리스크 재진단이 완료되었습니다.",
        stats: MOCK_STATS,
        summary: MOCK_SUMMARY,
        contracts: MOCK_CONTRACTS
      });
    }

    // 2. 근로계약서 독소 조항 보정 (remediate_clause)
    if (action === "remediate_clause") {
      const { employeeId, clauseId } = body;
      const contract = MOCK_CONTRACTS[employeeId];

      if (!contract) {
        return NextResponse.json({ success: false, error: "해당 임직원의 근로계약서를 찾을 수 없습니다." }, { status: 400 });
      }

      // 조항 내용 교정
      contract.clauses = contract.clauses.map((cl: any) => {
        if (cl.id === clauseId) {
          return {
            ...cl,
            isIllegal: false,
            currentText: cl.recommendedText // 추천 문구로 덮어쓰기
          };
        }
        return cl;
      });

      // 전체 전사 리스크 수치 보정 연산
      let totalIllegalCount = 0;
      Object.values(MOCK_CONTRACTS).forEach((con: any) => {
        totalIllegalCount += con.clauses.filter((c: any) => c.isIllegal).length;
      });

      MOCK_SUMMARY.auditScore = Math.min(100, 85 + (5 - totalIllegalCount) * 3);
      if (totalIllegalCount === 0) {
        MOCK_SUMMARY.unpaidAllowance = 0;
        MOCK_SUMMARY.riskFactors = MOCK_SUMMARY.riskFactors.filter(f => !f.includes("계약"));
      }

      return NextResponse.json({
        success: true,
        message: "AI 추천 표준 근로조항으로 성공적으로 보정되어 법적 안전성이 수호되었습니다.",
        stats: MOCK_STATS,
        summary: MOCK_SUMMARY,
        contracts: MOCK_CONTRACTS
      });
    }

    return NextResponse.json({ success: false, error: "유효하지 않은 요청 액션입니다." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
