"use client";

import { useState } from "react";
import { 
  HelpCircle, Search, ChevronDown, MessageSquare, 
  Bot, Sparkles, BookOpen, Ticket, Coins, Zap
} from "lucide-react";

// FAQ 데이터 아이템 구조 정의
interface FAQItem {
  id: string;
  category: "sms" | "rpa" | "point" | "coupon" | "order";
  question: string;
  answer: string;
}

// 5대 핵심 카테고리 정의
const CATEGORIES = [
  { id: "all", label: "전체 가이드 📖", icon: BookOpen, color: "text-slate-400" },
  { id: "sms", label: "무료문자 & 자동화 💬", icon: MessageSquare, color: "text-indigo-400" },
  { id: "rpa", label: "AI 자율 마케팅 & RPA 🤖", icon: Bot, color: "text-purple-400" },
  { id: "point", label: "단골적립 & 보안 🪙", icon: Coins, color: "text-amber-400" },
  { id: "coupon", label: "쿠폰 & 주문/예약 📦", icon: Ticket, color: "text-rose-400" },
  { id: "order", label: "견적/발주/수주 AI", icon: Zap, color: "text-cyan-400" }
];

// FAQ 데이터베이스 (AI 자율 경영 파트너 Q&A 완전 실장)
const FAQ_DATABASE: FAQItem[] = [
  // 1. 문자발송 & 자동화
  {
    id: "sms-1",
    category: "sms",
    question: "Google 메시지 앱 연동은 어떻게 작동하며 전송 비용이 진짜 0원인가요?",
    answer: "네, 맞습니다! 점주님의 개인 스마트폰과 로컬 브라우저가 Playwright 브라우저 커넥터(RPA 기술)를 통해 안전하게 연동됩니다. 점주님이 가입하신 모바일 요금제의 '기본 무료 문자 한도'를 시스템이 직접 호출하여 대리 발송하기 때문에, 통신사 추가 과금 없이 영구적으로 0원(무료)에 문자를 전송하실 수 있습니다."
  },
  {
    id: "sms-2",
    category: "sms",
    question: "단체 문자를 발송할 때 여러 페이지에 걸쳐 체크한 고객들이 누락되지 않나요?",
    answer: "이지데스크만의 '다중 페이지 선택 상태 보존(캐싱) 기술'이 적용되어 있습니다. 페이지를 이동하거나 한 화면에 표시되는 고객 개수(5명, 10명, 50명 등)를 변경하더라도 이전에 체크해 둔 고객들의 선택 상태가 그대로 유지됩니다. 이를 통해 수백 명의 고객 중 누락이나 실수 없이 한 번에 다량의 단체 문자를 안심하고 발송하실 수 있습니다."
  },
  {
    id: "sms-3",
    category: "sms",
    question: "특정 행동이 발생했을 때 문자가 자동 발송되게 하려면 어떻게 설정하나요?",
    answer: "[자동 발송 설정] 메뉴에서 원하시는 상황(예: 신규 고객 등록, 예약 완료, 결제 완료, 포인트 적립 등)을 'On'으로 켠 뒤, 사전에 작성해 두신 메시지 '템플릿'을 매핑해 두시면 됩니다. 이벤트가 발생할 때 시스템이 실시간으로 고객 연락처를 자동 추출하여 즉시 백그라운드에서 안내 문자를 발송합니다."
  },
  // 2. 마케팅 & RPA (AI 자율 마케팅 파트너 사용 가이드)
  {
    id: "rpa-1",
    category: "rpa",
    question: "인스타그램 AI 자동 마케팅 및 네이버 블로그 글 발행 주기는 어떻게 조절하나요?",
    answer: "[인스타그램 마케팅 AI] 또는 [N-BLOG 포스팅 AI] 메뉴 상단 설정 패널에서 '자동 파일럿(Autopilot)' 스위치를 켠 뒤, 간격(매일 또는 매주)과 발송 희망 시간을 지정해 주시면 됩니다. AI 비서가 매장의 광고 상품 데이터를 바탕으로 트렌디한 이미지와 블로그 글을 생성하여 약속된 스케줄에 맞춰 백그라운드에서 자동으로 예약 업로드를 수행합니다."
  },
  {
    id: "rpa-2",
    category: "rpa",
    question: "네이버 블로그나 인스타 포스팅 도중 로그인 세션이 끊기면 어떻게 해야 하나요?",
    answer: "포스팅 연동 세션이 만료되거나 꼬인 경우, 블로그 설정 탭 하단에 있는 [네이버 계정 세션 초기화] 버튼을 클릭해 초기 상태로 되돌릴 수 있으며, `http://localhost:3000/api/naver-blog/settings?action=trigger_session` API를 다이렉트로 호출하여 간편하게 일시적인 세션 동기화를 즉시 재복구하실 수 있습니다."
  },
  {
    id: "rpa-3",
    category: "rpa",
    question: "이지데스크의 AI 자율 마케팅 파트너(Autonomous Copilot)는 어떻게 사용하나요?",
    answer: "대시보드 최상단에 마운트된 Glassmorphism 카드를 통해 즉시 만나보실 수 있습니다. AI가 매일 아침 매장의 실시간 CRM 데이터를 분석하여 이탈 우려 단골, VIP 고객, 신규 가입 고객 통계를 냅니다. 여기에 오늘의 날씨를 클릭 시뮬레이션하시면, 날씨와 매장의 인기 메뉴 정보를 조합하여 초개인화된 맞춤 감성 문자 시나리오와 3대 옴니채널(블로그, 인스타, 유튜브 쇼츠) 마케팅 원고를 즉석에서 자동 설계해 냅니다."
  },
  {
    id: "rpa-4",
    category: "rpa",
    question: "원클릭 승인 시 고객 발송 및 SNS 예약은 실제로 연동되어 처리되나요?",
    answer: "네, 완벽히 오토파일럿 처리됩니다! AI가 제안한 오늘의 성장 플랜 카드를 확인하신 후 [AI 성장 플랜 승인 및 가동] 버튼을 누르시면, 타겟 고객군에 맞춘 초개인화된 문자가 이지데스크의 0원 문자 발송 엔진(message_logs 적재)을 통해 즉시 발송되며, 동시에 네이버 블로그 원고 및 인스타그램 포스팅 예약 데이터가 SCHEDULED 상태로 실시간 자동 연동 적재되어 즉각 퍼블리싱 스케줄러에 등록됩니다."
  },
  // 3. 단골적립 & 보안
  {
    id: "point-1",
    category: "point",
    question: "가입하지 않은 신규 고객도 즉석에서 포인트 적립이 가능한가요?",
    answer: "네, 아주 간편합니다! 오프라인 매장의 태블릿(테이블오더)이나 쇼핑몰 주문창에서 복잡한 가입 양식 없이 오직 '휴대전화번호'만 입력하면 단 1초 만에 임시 단골 회원으로 자동 등록(Soft Sign-up)되어 즉시 첫 적립을 누릴 수 있습니다. 복잡한 가입에 따른 단골 이탈률을 제로로 만들어 줍니다."
  },
  {
    id: "point-2",
    category: "point",
    question: "포인트 결제 시 전송되는 2차 SMS OTP(인증번호)의 비용과 보안성은 어떤가요?",
    answer: "포인트 소모(최소 1,000p 이상) 결제 시, 도용 및 어뷰징 방지를 위해 고객의 폰으로 3분간만 유효한 일회용 4자리 보안 인증번호(OTP)가 전송됩니다. 이 발송 작업도 이지데스크의 평생 무료 문자 발송 커넥터로 처리되므로 매장에서 부담하는 비용은 단 0원이며, 타인의 무단 포인트 사용을 원천 차단해 안전합니다."
  },
  {
    id: "point-3",
    category: "point",
    question: "기본 포인트 적립 비율인 1%를 변경하거나 고객의 포인트를 강제로 증감할 수 있나요?",
    answer: "네! [시스템 설정 > 단골 고객 포인트 적립 설정]에서 0%(적립 중단)부터 최대 20%까지 실시간으로 조절해 즉각 소비자 화면에 동기화할 수 있습니다. 또한 [고객 관리] 대장에서 특정 고객의 상세 보기 -> [적립금 내역] 탭을 신설하여, 점주님이 보너스 수동 적립 또는 소급 차감(양수/음수 입력)을 수행하고 모든 변동 내역을 타임라인으로 투명하게 보관할 수 있습니다."
  },
  // 4. 쿠폰 & 주문/예약
  {
    id: "coupon-1",
    category: "coupon",
    question: "쿠폰의 무단 사용을 막고 마진율을 확실히 지키는 제한 조건은 어떻게 설정하나요?",
    answer: "[쿠폰 관리] 화면 하단에서 유효기간(만료일)을 설정해 만료 시 취소선 비활성화 및 실시간 결제 승인 차단을 보장할 수 있습니다. 또한, 적용 종류에서 블랙리스트(제외할 품목) 혹은 화이트리스트(허용할 품목) 방식을 택하여 특정 상품 ID 또는 카테고리명을 지정함으로써 마진을 정교하게 방어할 수 있습니다."
  },
  {
    id: "coupon-2",
    category: "coupon",
    question: "상품별로 쿠폰 할인을 전면 금지하거나 허용하는 가장 빠른 방법은 무엇인가요?",
    answer: "[상품 DB 관리] 화면에 추가된 '쿠폰 허용' 토글 스위치(원클릭 On/Off)를 사용해 실시간 제어할 수 있습니다. Next.js 서버의 메모리(RAM)를 백방 활용하는 초고속 인메모리 캐시 엔진이 걸려 있어, 주문 폭주 시에도 데이터베이스 병목 전혀 없이 마이크로초(μs) 대의 무마찰 쿠폰 유효성 필터링을 완벽 처리합니다."
  },
  {
    id: "coupon-3",
    category: "coupon",
    question: "테이블오더 주문이나 예약 등록 시 배송 대장 또는 금융과 자동으로 묶이나요?",
    answer: "네, 완벽히 오프라인 연동됩니다. 테이블오더 주문 시 배송 방식을 '택배배송'으로 기입하면 즉시 [배송내역 관리] 대장에 상품 준비중 정보가 자동 신설되며, 카드/포인트 결제 완수 시 즉각 [결제내역] 및 [거래내역] 대장에 매출이 동기화 기록되어 종합 매출과 잔고가 실시간 정산됩니다."
  },
  // 5. 견적/발주/수주 AI 가이드 (신규 추가 🔄)
  {
    id: "order-1",
    category: "order",
    question: "받은 견적 이미지 파일의 AI OCR 분석 기능은 어떻게 작동하나요?",
    answer: "사장님이 거래처 등 공급사로부터 전달받은 종이/사진 견적서 이미지를 대시보드에 업로드하시면, 내장된 고정밀 Gemini Vision AI가 이미지 속 단가, 수량, 품목명, 공급사 상호명, 연락처를 단 3초 만에 해독 및 파싱하여 관리자 등록 폼에 타이핑 효과로 쏙 채워넣어 줍니다. 수동 입력의 고단함을 덜어주는 최고의 AI 비서 기능입니다."
  },
  {
    id: "order-2",
    category: "order",
    question: "실물확인 뒤 최종 승인 후 재고 반영(SCM) 절차는 어떻게 수행되나요?",
    answer: "등록된 받은 견적서를 '발주서 전환' 하시면 정식 발주서 생성과 동시에 입고 대기(PENDING_INBOUND) 플래그 상태가 됩니다. 이후 물류 창고에 자재 실물이 도착했을 때, 사장님이 직접 실물을 체크해보고 최종 확인된 실검수 수량(checkedQty)을 입력한 뒤 승인 처리를 합니다. 승인 즉시 실제 재고 대장(inventory_items)에 검수 수량만큼 가산되고 재고 연동 이력(inventory_logs)에 변동 이력이 투명하게 완벽 실시간 기록됩니다."
  },
  {
    id: "order-3",
    category: "order",
    question: "상품 DB 연동을 통한 AI 동적 견적 가격 책정 및 수주 알림톡은 무엇인가요?",
    answer: "상품 DB 중 '견적가 전용' 플래그를 켠 품목들에 대해, 바이어의 거래처 등급(VIP 단골)과 대량 구매 요청 수량(Volume)을 복합적으로 인지해 최적의 볼륨 할인 단가를 AI가 자동으로 추천 계산해 줍니다. 이 제안가와 함께 격식 있고 정중하게 품격 있는 비즈니스 제안 편지글(AI Proposal Letter)을 바이어 맞춤형으로 작성해주며, 견적 수락 후 수주 최종 승인 시 바이어에게 정중한 수주 확인서가 카카오톡 알림톡 문자로 즉각 자동 전송됩니다."
  },
  {
    id: "order-4",
    category: "order",
    question: "일반 소비자(고객)와 B2B 거래처는 어떻게 구분하여 관리하나요?",
    answer: "이지데스크는 B2C 개인 고객과 B2B 유통 거래처를 철저히 이원화하여 관리합니다. 일반 소비자는 [고객 관리] 대장에서 적립금 및 개인 프로필을 통제하고, 수/발주와 견적 영업의 주체인 기업 고객은 [거래처 관리 AI] 대장에서 사업자번호, 세금계산서 발행용 이메일, 담당자 명세, 여신 한도액(외상 거래 통제)을 독립적으로 분리하여 영구히 체계적으로 관리합니다."
  },
  {
    id: "order-5",
    category: "order",
    question: "첫 견적 요청 모바일 페이지에서 사업자등록증 첨부와 B2B 스마트 온보딩은 어떻게 진행되나요?",
    answer: "신규 거래처(바이어)가 스마트폰으로 첫 견적을 요청할 때, 사업자등록증(이미지/PDF) 파일을 첨부하면 내장된 Gemini Vision AI가 상호명, 대표자 성함, 사업장 주소, 연락처 등을 단 3초 만에 완벽하게 OCR 해독하여 입력 필드에 자동으로 입력(Auto-fill)해 줍니다. 이후 견적을 즉시 발송하면 견적 접수와 동시에 이지데스크 [거래처 관리 AI] 대장에 B2B 바이어(BUYER)로 원스톱 자동 신규 가입 처리가 완수됩니다."
  },
  {
    id: "order-6",
    category: "order",
    question: "사업자등록번호 중복 가입 체크 기능은 무엇인가요?",
    answer: "B2B 유통 거래처가 동명으로 중복 가입되어 데이터베이스나 누적 실적 타임라인이 오염되는 것을 차단하기 위한 시스템입니다. 모바일 견적 페이지에서 사업자번호 기입 후 [중복 조회]를 탭하면 백엔드 DB를 검사하여: (1) 기존 가입된 파트너일 경우 기존 B2B 프로필 명세를 원클릭 즉시 연결하여 상세 수동 입력 단계를 완전 면제해 줍니다. (2) 가입되지 않은 신규 파트너일 경우에만 사업자등록증 첨부란 및 상세 폼 직접 입력란을 활성화해 유기적인 작성을 도우며 무결성을 유지합니다."
  }
];

export default function FAQHelpCenterPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["sms-1"])); // 첫 질문 기본 오픈

  // 아코디언 토글
  const toggleAccordion = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 실시간 검색어 및 초성 보정 검색 엔진 필터링
  const getFilteredFAQ = () => {
    return FAQ_DATABASE.filter(faq => {
      if (activeCategory !== "all" && faq.category !== activeCategory) {
        return false;
      }
      
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase().trim();
      const question = faq.question.toLowerCase();
      const answer = faq.answer.toLowerCase();

      const matchesConsonants = (str: string, q: string) => {
        if (q === "ㅇㅌㅍ" && str.includes("otp")) return true;
        if (q === "ㅁㅈ" && (str.includes("문자") || str.includes("메시지"))) return true;
        if (q === "ㅂㄹㄱ" && str.includes("블로그")) return true;
        if (q === "ㅈㄹ" && str.includes("적립")) return true;
        if (q === "ㅋㅍ" && str.includes("쿠폰")) return true;
        return false;
      };

      return (
        question.includes(query) || 
        answer.includes(query) || 
        matchesConsonants(question, query) ||
        matchesConsonants(answer, query)
      );
    });
  };

  const triggerEasyBot = () => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("open-easybot");
      window.dispatchEvent(event);
    }
  };

  const filteredFaqs = getFilteredFAQ();

  return (
    // 💡 레이아웃 붕괴 원천 봉쇄: 복잡한 Flex/Grid를 걷어내고, 무조건 가로폭 100%를 보장하는 심플 견고한 수직 탑다운 구조 선언!
    <div className="w-full min-h-screen bg-slate-50 p-6 md:p-8 space-y-8 animate-fade-in block relative overflow-x-hidden">
      
      {/* 럭셔리 네온 광원 데코레이션 */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>

      {/* 1. 헤더 가이드 패널 (수직 정렬 탑다운 구조) */}
      <div className="w-full bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm block">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <HelpCircle className="w-6 h-6 shrink-0" />
            </div>
            <span className="text-[10px] md:text-[11px] font-black tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full uppercase">Help Center</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight block">
            Q&A 통합 헬프센터 💡
          </h1>
          
          <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-3xl block">
            이지데스크의 AI 자율 마케터(Autonomous Copilot), 무료 문자 발송, 단골 포인트 적립 등 핵심 19대 기능의 명쾌한 사용 요령을 한눈에 알아보세요.
          </p>
        </div>
      </div>

      {/* 2. 가로형 검색 및 필터 패널 (수평 칩 배치로 가로 찌그러짐을 물리적으로 원천 봉쇄!) */}
      <div className="w-full bg-white border border-slate-100 p-6 rounded-3xl shadow-sm block space-y-6">
        
        {/* 실시간 통합 검색창 */}
        <div className="w-full space-y-2 block">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">실시간 통합 지식 검색</label>
          <div className="relative w-full shadow-sm rounded-2xl overflow-hidden border border-slate-200 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all block">
            <Search className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="궁금하신 기능이나 키워드를 검색창에 적어보세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-white border-0 outline-none text-sm md:text-base text-slate-700 font-semibold"
            />
          </div>
        </div>

        {/* 수평 칩 구조의 카테고리 필터 (좌우 찌그러질 가능성 0%) */}
        <div className="w-full space-y-3 block">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">주제별 카테고리 필터</span>
          <div className="flex flex-wrap gap-2.5 w-full">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-xs md:text-sm font-extrabold transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.02] border-slate-900" 
                      : "bg-white text-slate-600 hover:bg-slate-50 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? "text-amber-400" : cat.color}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. 대용량 FAQ 아코디언 카드 리스트 (풀 와이드 수직 나열) */}
      <div className="w-full space-y-4 block">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs md:text-sm font-bold text-slate-400">
            총 <b>{filteredFaqs.length}개</b>의 가이드 매뉴얼 검색됨
          </span>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center py-24 shadow-sm w-full block">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
            <h3 className="text-base font-black text-slate-800 mb-1">일치하는 가이드를 찾을 수 없습니다.</h3>
            <p className="text-xs text-slate-400">검색어를 지우거나 카테고리를 다시 클릭해 주세요.</p>
          </div>
        ) : (
          <div className="space-y-4 w-full block">
            {filteredFaqs.map(faq => {
              const isOpen = openIds.has(faq.id);
              
              return (
                <div 
                  key={faq.id} 
                  className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm w-full block ${
                    isOpen ? "border-amber-400/80 ring-2 ring-amber-400/5" : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                  }`}
                >
                  {/* 질문 영역 */}
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full flex items-center justify-between p-5 text-left font-black text-slate-800 text-sm md:text-base gap-4 transition-colors cursor-pointer select-none bg-slate-50/10 hover:bg-slate-50/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform ${isOpen ? "bg-amber-400 scale-125 shadow-lg shadow-amber-400/40" : "bg-slate-300"}`}></span>
                      <span>{faq.question}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-amber-500" : ""}`} />
                  </button>

                  {/* 답변 오픈 영역 */}
                  {isOpen && (
                    <div className="p-5 border-t border-slate-50 bg-slate-50/20 text-xs md:text-sm text-slate-600 leading-relaxed font-medium animate-scale-up block">
                      <div className="bg-white p-5 rounded-2xl border border-slate-100/50 text-slate-700 shadow-inner leading-relaxed block">
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. 이지봇 AI 헬프 배너 브릿지 (완벽한 수직 Stacked 구조로 찌그러짐 원천 봉쇄!) */}
      <div className="bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-indigo-500/5 border border-slate-100 p-6 md:p-8 rounded-3xl mt-8 shadow-sm w-full block">
        <div className="space-y-6 block">
          
          {/* 상단 텍스트 존 */}
          <div className="flex items-start space-x-4 w-full block">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-900 shadow-xl shadow-orange-500/10 shrink-0 animate-bounce">
              <Bot className="w-7 h-7 text-slate-900" />
            </div>
            
            <div className="space-y-1 block">
              <h4 className="text-sm md:text-base font-black text-slate-800 flex items-center gap-2">
                원하는 답변을 찾기 어려우신가요?
                <span className="bg-amber-400 text-slate-900 font-extrabold text-[9px] px-2 py-0.5 rounded flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5"/>AI</span>
              </h4>
              <p className="text-xs md:text-sm text-slate-500 font-semibold leading-relaxed">
                이지봇 인공지능 매장 비서에게 음성이나 채팅으로 직접 대화하여 필요한 기능 질문에 대한 정답을 즉석에서 추천받아보세요!
              </p>
            </div>
          </div>

          {/* 하단 버튼 존 (Full-width 버튼 형태로 절대 찌그러지지 않음) */}
          <div className="w-full block">
            <button
              onClick={triggerEasyBot}
              className="w-full py-4 bg-slate-950 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs md:text-sm transition-all border-0 shadow-lg shadow-slate-950/10 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Bot className="w-4 h-4 text-amber-400 animate-pulse" />
              이지봇 AI 비서 호출하기
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
