import { NextResponse } from "next/server";
import { queryTable, insertRows, deleteRows } from "../../../../../egdesk-helpers";

// 모의 회사 기본 프로필
const MOCK_COMPANY_PROFILE = {
  establishmentYear: 2022, // 4년차 스타트업
  employeeCount: 12,
  patentsCount: 2,
  femaleEmployeeRatio: 35,
  youthEmployeeRatio: 65, // 청년 친화 기업
  sector: "도소매 및 물류 소프트웨어"
};

// 백업용 R&D 기본 텍스트 템플릿
const DEFAULT_RND_TEXTS: Record<string, Record<string, string>> = {
  "GR-501": {
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
 * GET: 지원금 공고 리스트, 기업 프로필 조회 (물리 DB 연동)
 */
export async function GET() {
  try {
    // 1. DB에서 공고 전체 조회
    const annRes = await queryTable("crm_grant_announcements", {});
    const dbAnnouncements = annRes.rows || [];

    // 2. DB에서 관심 북마크 목록 조회
    const bookmarkRes = await queryTable("crm_grant_bookmarks", {});
    const dbBookmarks = bookmarkRes.rows || [];
    const bookmarkedIds = new Set(dbBookmarks.map((b: any) => b.announcement_id));

    // 3. 북마크 데이터 바인딩 조립
    const announcements = dbAnnouncements.map((ann: any) => {
      // 프론트엔드 모듈에 필요한 시뮬레이션 매칭 가이드 연동
      let matchGuide = [
        "✅ 현재 기술 요건 및 매출액 요건 충족으로 기본 지원 자격 확보",
        "✅ 기업 임직원 중 청년 근로자 비율이 60% 이상으로 가점 항목(+2점) 확보 가능",
        "💡 보유 특허 2건이 핵심 기술과 직접 연계될 경우 우위 예상",
        "⚠️ 연구노트 관리 규정 및 사내 R&D 조직 지정 사전 점검 필요"
      ];
      if (ann.id === "GR-502") {
        matchGuide = [
          "✅ 이지데스크의 스마트오더 연계 도입 시 즉시 신청 적합",
          "✅ F&B 및 도소매 소프트웨어 활성 도메인과 완전 일치",
          "💡 청년 고용 우대 혜택 적용 가능"
        ];
      }

      return {
        id: ann.id,
        agency: ann.agency,
        title: ann.title,
        budget: ann.budget >= 100000000 
          ? `최대 ${(ann.budget / 100000000).toFixed(1)}억원` 
          : `최대 ${(ann.budget / 10000).toLocaleString()}만원`,
        target: "창업 7년 이하이면서 매출액 요건을 만족하는 중소기업/소상공인",
        deadline: ann.end_date,
        category: ann.id === "GR-501" ? "RND" as const : ann.id === "GR-502" ? "GRANT" as const : "LOAN" as const,
        matchScore: ann.match_score,
        matchGuide,
        isBookmarked: bookmarkedIds.has(ann.id)
      };
    });

    return NextResponse.json({
      success: true,
      announcements,
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

    // 1. 북마크 상태 변경 (toggle_bookmark)
    if (action === "toggle_bookmark") {
      const { id } = body;

      // 이미 북마크 등록되어 있는지 조회
      const checkRes = await queryTable("crm_grant_bookmarks", { filters: { announcement_id: id } });
      const exists = checkRes.rows && checkRes.rows.length > 0;

      if (exists) {
        // 존재하면 북마크 제거
        await deleteRows("crm_grant_bookmarks", { filters: { announcement_id: id } });
      } else {
        // 존재하지 않으면 북마크 삽입
        await insertRows("crm_grant_bookmarks", [{
          id: `BM-${Date.now()}`,
          announcement_id: id
        }]);
      }

      // 갱신된 전체 리스트 획득
      const annRes = await queryTable("crm_grant_announcements", {});
      const dbAnnouncements = annRes.rows || [];
      const bookmarkRes = await queryTable("crm_grant_bookmarks", {});
      const dbBookmarks = bookmarkRes.rows || [];
      const bookmarkedIds = new Set(dbBookmarks.map((b: any) => b.announcement_id));

      const announcements = dbAnnouncements.map((ann: any) => ({
        id: ann.id,
        agency: ann.agency,
        title: ann.title,
        budget: ann.budget >= 100000000 
          ? `최대 ${(ann.budget / 100000000).toFixed(1)}억원` 
          : `최대 ${(ann.budget / 10000).toLocaleString()}만원`,
        target: "창업 7년 이하 중소기업/소상공인",
        deadline: ann.end_date,
        category: ann.id === "GR-501" ? "RND" as const : "GRANT" as const,
        matchScore: ann.match_score,
        matchGuide: ["✅ 자격 요건 충족"],
        isBookmarked: bookmarkedIds.has(ann.id)
      }));

      return NextResponse.json({
        success: true,
        message: "북마크 상태가 DB에 정상 변경되었습니다.",
        announcements
      });
    }

    // 2. R&D 계획서 AI 생성 (generate_plan)
    if (action === "generate_plan") {
      const { id } = body;

      // 2-1. 기존 DB에 적재된 계획서가 있는지 조회
      const planRes = await queryTable("crm_grant_rnd_plans", { filters: { announcement_id: id } });
      let plan;

      if (planRes.rows && planRes.rows.length > 0) {
        // 이미 DB에 저장된 내용 반환
        plan = JSON.parse(planRes.rows[0].plan_data);
      } else {
        // DB에 없을 시 기본 템플릿 생성 후 DB 저장
        plan = DEFAULT_RND_TEXTS[id] || {
          necessity: `[연구개발의 필요성 및 시급성]
선택하신 사업공고(${id})에 대응하는 기술 개발 시나리오입니다. 중소기업 혁신성장을 위한 맞춤형 R&D 테마를 수립하고 관련 연구의 시급성을 세부 설명합니다.`,
          differentiation: `[국내외 기술 트렌드 및 차별성]
국내외 시장 분석 및 특허 데이터베이스 대조를 바탕으로 한 고유한 차별화 방안 및 특허 확보 전략을 기술합니다.`,
          objectives: `[연구개발 최종 목표 및 상세 내용]
구체적인 정량 성능 평가 기준(목표치)과 함께 핵심 과제 상세 내용을 수립합니다.`,
          businessPlan: `[사업화 방안 및 향후 시장 진출 계획]
국내 대리점 및 글로벌 판로 개척 방안, 양산화 코스트 최적화 계획 및 신규 인재 확보 일정을 도출합니다.`
        };

        // DB에 최초 적재
        await insertRows("crm_grant_rnd_plans", [{
          id: `PLAN-${Date.now()}`,
          announcement_id: id,
          plan_data: JSON.stringify(plan)
        }]);
      }

      // AI 지연 연산 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 300));

      return NextResponse.json({
        success: true,
        message: "Gemini AI가 R&D 사업계획서 표준 4대 초안을 성공적으로 완필하여 DB에 저장했습니다.",
        plan
      });
    }

    return NextResponse.json({ success: false, error: "유효하지 않은 요청 액션입니다." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
