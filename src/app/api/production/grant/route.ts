import { NextResponse } from "next/server";

// 1. 모의 회사 기본 프로필
const MOCK_COMPANY_PROFILE = {
  establishmentYear: 2022, // 4년차 스타트업
  employeeCount: 12,
  patentsCount: 2,
  femaleEmployeeRatio: 35,
  youthEmployeeRatio: 65, // 청년 친화 기업
  sector: "도소매 및 물류 소프트웨어"
};

// 2. 모의 정부 지원금 공고 목록
let MOCK_ANNOUNCEMENTS = [
  {
    id: "GR-2026-01",
    agency: "중소벤처기업부",
    title: "2026년 창업성장기술개발사업 (디딤돌 과제 1차)",
    budget: "최대 1억 2,000만원 (1년)",
    target: "창업 7년 이하이면서 매출액 20억원 미만 중소기업",
    deadline: "2026-06-25",
    category: "RND" as const,
    matchScore: 95,
    matchGuide: [
      "✅ 창업 4년차(7년 이하) 및 매출액 요건 충족으로 기본 지원 자격 확보",
      "✅ 기업 임직원 중 청년 근로자 비율이 60% 이상으로 가점 항목(+2점) 확보 가능",
      "💡 보유 특허 2건이 핵심 기술과 직접 연계될 경우 기술성 평가에서 우위 예상",
      "⚠️ 연구노트 관리 규정 및 사내 R&D 조직 지정(기업부설연구소 또는 연구전담부서) 여부 사전 점검 필요"
    ],
    isBookmarked: false
  },
  {
    id: "GR-2026-02",
    agency: "소상공인시장진흥공단",
    title: "2026년 소상공인 스마트상점 기술보급사업",
    budget: "최대 700만원 (공급가액의 70% 지원)",
    target: "전국 F&B, 도소매 등 소상공인 사업주",
    deadline: "2026-06-18",
    category: "GRANT" as const,
    matchScore: 80,
    matchGuide: [
      "✅ 현재 이지데스크의 스마트 키오스크 및 태블릿오더 연계 도입 시 즉시 신청 적합",
      "✅ F&B 및 도소매 소프트웨어 활성 도메인과 완전 일치",
      "💡 청년 고용 우대 혜택 적용 가능",
      "⚠️ 일반 중소기업 법인격의 경우 소상공인 상시근로자 요건(5인 미만)을 초과하는지 별도 검증 필요"
    ],
    isBookmarked: false
  },
  {
    id: "GR-2026-03",
    agency: "신용보증기금",
    title: "2026년 혁신스타트업 성장지원 보증 (퍼스트펭귄)",
    budget: "최대 30억원 보증 한도 (최장 5년)",
    target: "신산업 분야 창업 5년 이하의 우수 혁신 스타트업",
    deadline: "2026-06-30",
    category: "LOAN" as const,
    matchScore: 88,
    matchGuide: [
      "✅ 업력 5년 이하 요건에 완전 부합",
      "✅ 당사의 AI 수요 예측 기술 및 물류 솔루션은 '신산업 혁신성장동력' 테마에 매치",
      "💡 벤처기업인증 취득 시 심사 프로세스 대폭 단축 가능",
      "⚠️ 재무제표 상 자본잠식 여부 검토 필수 및 3개년 매출 추이 보완 설명 필요"
    ],
    isBookmarked: false
  },
  {
    id: "GR-2026-04",
    agency: "정보통신산업진흥원",
    title: "2026년 중소기업 AI 솔루션 도입 바우처 지원사업",
    budget: "최대 5,000만원",
    target: "AI 솔루션을 도입하여 디지털 전환을 희망하는 중소/소상공인",
    deadline: "2026-06-15",
    category: "GRANT" as const,
    matchScore: 92,
    matchGuide: [
      "✅ 당사 솔루션의 공급기업 등록 시 타 수요업체와의 매칭 연동 즉시 가능",
      "✅ 세무/경리, 자금 예측 및 SCM AI 도입 의사를 지닌 신규 거래처 바이어 유치용 최적",
      "💡 비대면 도입 프로세스 구축 가점 부여",
      "⚠️ AI 활용에 따른 내부 개인정보보호 조치 계획안 작성 가이드 필요"
    ],
    isBookmarked: false
  }
];

// 3. 모의 AI 생성 사업계획서 템플릿 원고
const MOCK_RND_TEXTS: Record<string, Record<string, string>> = {
  "GR-2026-01": {
    necessity: `[연구개발의 필요성 및 시급성]
본 연구개발은 중소 유통/도소매 기업의 생존과 직결된 '공급망 리스크 대응 및 지능형 물류/자금 통합 예측 시스템' 개발을 목적으로 합니다. 최근 글로벌 기상 이변 및 항만 정체로 인해 자재 조달 리드타임 편차가 급증하고 있으며, 이는 대기업에 비해 완충 재고 및 자금 여력이 부족한 중소기업에 직격탄이 되고 있습니다.
당사는 본 디딤돌 과제를 통해 실시간 SCM 물류 센서 데이터와 기업 손익 계정을 다차원으로 통합 분석하는 경량 예측 엔진을 개발하고자 합니다. 지연 리스크를 최소 7일 전에 감지하고 우회 조달처를 매칭하여 연간 약 3,500만원 이상의 불필요한 폐기 및 대손 손실을 사전에 차단하는 기술 혁신이 매우 시급한 상황입니다.`,
    differentiation: `[국내외 기술 트렌드 및 차별성]
현재 시장의 물류 예측 솔루션들은 거대 ERP 기반으로 고가의 구축 비용이 발생하여 연 매출 50억 미만의 중소 유통업체들은 도입이 거의 불가능합니다.
본 과제를 통해 개발될 솔루션은 SQLite 및 가벼운 시계열 예측 모델(Prophet/TFT)을 활용하여 초경량 패키징 형태로 제공됩니다. 또한 단순한 운송 상태 트랙킹에 그치지 않고, 지연 리스크 발생 시 동적으로 세무/회계 장부의 지출 예정 금액 및 자금 고갈 D-Day를 실시간 리클러스터링하여 대안 시나리오를 제시합니다. 이는 기존의 물류 전용 시스템이나 세무 전용 장부들과 차별화되는 세계 최초의 '물류-금융 통합 지능형 의사결정 파이프라인'입니다.`,
    objectives: `[연구개발 최종 목표 및 상세 내용]
1. 정량적 개발 목표:
  - 글로벌 조달 화물 리스크 예측 정확도(MAP, Mean Absolute Percentage Error) 92% 이상 달성
  - AI 우회 공급처 자동 전환 응답 속도 2.5초 이내 실현
  - 중소기업용 모바일 물류 관제 노선 무선 동기화 딜레이 1초 미만 보장
2. 주요 연구개발 내용:
  - 1차년도: Prophet 모델 기반 이송 지연 지수 시계열 예측 신경망 학습 및 SQLite 분산 원장 연동 모듈 개발
  - 2차년도: 모바일 세관 통관 바 트래커 동기화 시스템 및 비상 긴급 SMS/전화 핫링크 연동 최적화`,
    businessPlan: `[사업화 방안 및 향후 시장 진출 계획]
1. 타겟 시장 진입 전략:
  - 1단계: 기존 이지데스크 [FreeSMS] 플랫폼을 이용 중인 전국 5,000여 소상공인 및 소규모 유통 파트너사 대상 무료 베타 서비스 출시로 사용성 검증 및 피드백 축적
  - 2단계: 스마트공장 공급기업 연계 및 세무/회계사 사무소와의 B2B 전략적 제휴를 통한 단체 가입 유도
2. 예상 매출 및 일자리 창출:
  - 서비스 상용화 후 3년 내 유료 구독 고객사 450곳 확보, 연 매출 12억 원 달성 목표
  - 연구개발 완료 및 사업화 가동에 따라 신규 청년 개발자 및 CS 인력 총 8명 추가 고용 예정`
  }
};

/**
 * GET: 지원금 공고 리스트, 기업 프로필 조회
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      announcements: MOCK_ANNOUNCEMENTS,
      companyProfile: MOCK_COMPANY_PROFILE
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: R&D 계획서 초안 생성 및 북마크 토글
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. 북마크 상태 변경
    if (action === "toggle_bookmark") {
      const { id } = body;
      MOCK_ANNOUNCEMENTS = MOCK_ANNOUNCEMENTS.map((ann) => {
        if (ann.id === id) {
          return { ...ann, isBookmarked: !ann.isBookmarked };
        }
        return ann;
      });

      return NextResponse.json({
        success: true,
        message: "북마크 상태가 정상 변경되었습니다.",
        announcements: MOCK_ANNOUNCEMENTS
      });
    }

    // 2. R&D 계획서 AI 생성 시뮬레이션
    if (action === "generate_plan") {
      const { id } = body;
      const targetPlan = MOCK_RND_TEXTS[id] || {
        necessity: `[연구개발의 필요성 및 시급성]
선택하신 사업공고(${id})에 대응하는 기술 개발 시나리오입니다. 중소기업 혁신성장을 위한 맞춤형 R&D 테마를 수립하고 관련 연구의 시급성을 세부 설명합니다.`,
        differentiation: `[국내외 기술 트렌드 및 차별성]
국내외 시장 분석 및 특허 데이터베이스 대조를 바탕으로 한 고유한 차별화 방안 및 특허 확보 전략을 기술합니다.`,
        objectives: `[연구개발 최종 목표 및 상세 내용]
구체적인 정량 성능 평가 기준(목표치)과 함께 월별/마일스톤별 핵심 과제 상세 내용을 수립합니다.`,
        businessPlan: `[사업화 방안 및 향후 시장 진출 계획]
국내 대리점 및 글로벌 판로 개척 방안, 양산화 코스트 최적화 계획 및 신규 인재 확보 일정을 도출합니다.`
      };

      // 실시간 인공지능 지연 연산 시뮬레이션 (500ms 대기)
      await new Promise((resolve) => setTimeout(resolve, 500));

      return NextResponse.json({
        success: true,
        message: "Gemini AI가 R&D 사업계획서 표준 4대 초안을 성공적으로 완필하였습니다.",
        plan: targetPlan
      });
    }

    return NextResponse.json({ success: false, error: "유효하지 않은 요청 액션입니다." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
