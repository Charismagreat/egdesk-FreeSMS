"use client";

import { useState, useEffect } from "react";
import { 
  HelpCircle, Search, ChevronDown, MessageSquare, 
  Bot, Sparkles, BookOpen, Ticket, Coins, Zap, CalendarDays 
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
  { id: "all", label: "전체 FAQ", icon: BookOpen, color: "text-slate-500" },
  { id: "sms", label: "문자발송 & 자동화 💬", icon: MessageSquare, color: "text-purple-500" },
  { id: "rpa", label: "마케팅 & RPA 🤖", icon: Bot, color: "text-emerald-500" },
  { id: "point", label: "단골적립 & 보안 🪙", icon: Coins, color: "text-amber-500" },
  { id: "coupon", label: "쿠폰 & 주문/예약 📦", icon: Ticket, color: "text-rose-500" }
];

// 전반적인 플랫폼 핵심 FAQ 데이터셋
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
  // 2. 마케팅 & RPA
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
    answer: "대시보드 최상단에 마운트된 Glassmorphism 카드를 통해 이용하실 수 있습니다. AI가 매일 아침 매장의 실시간 CRM 데이터를 분석하여 이탈 우려 단골, VIP 고객, 신규 가입 고객 통계를 냅니다. 여기에 오늘의 날씨를 클릭 시뮬레이션하시면, 날씨와 매장의 인기 메뉴 정보를 조합하여 초개인화된 맞춤 감성 문자 시나리오와 옴니채널 마케팅 원고를 즉석에서 자동 설계해 냅니다."
  },
  {
    id: "rpa-4",
    category: "rpa",
    question: "원클릭 승인 시 고객 발송 및 SNS 예약은 실제로 연동되어 처리되나요?",
    answer: "네, 맞습니다! AI가 제안한 오늘의 성장 플랜 카드를 확인하신 후 [AI 성장 플랜 승인 및 가동] 버튼을 누르시면, 타겟 고객군에 맞춘 초개인화된 문자가 이지데스크의 0원 문자 발송 엔진(message_logs 적재)을 통해 즉시 발송되며, 동시에 네이버 블로그 원고 및 인스타그램 포스팅 예약 데이터가 SCHEDULED 상태로 실시간 자동 연동 적재되어 배포 대기 상태로 들어갑니다."
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
      // 1. 카테고리 필터
      if (activeCategory !== "all" && faq.category !== activeCategory) {
        return false;
      }
      
      // 2. 검색어 필터
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase().trim();
      const question = faq.question.toLowerCase();
      const answer = faq.answer.toLowerCase();

      // 초성 변환 매칭 간소화 제공 (자음 검색 대응)
      const matchesConsonants = (str: string, q: string) => {
        // 간단한 핵심 자음 자가 매칭
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

  // 이지봇 인공지능 오버레이 강제 기동용 커스텀 이벤트 디스패치
  const triggerEasyBot = () => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("open-easybot");
      window.dispatchEvent(event);
    }
  };

  const filteredFaqs = getFilteredFAQ();

  return (
    <div className="p-8 w-full max-w-none">
      {/* 헤더 섹션 */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
            <HelpCircle className="w-8 h-8 text-amber-500 mr-3 shrink-0" />
            Q&A 통합 헬프센터 💡
          </h1>
          <p className="text-slate-500 mt-2">이지데스크 무료 문자, 자동화, 마케팅, 포인트 등 19대 핵심 기능 사용 요령을 한눈에 찾아보세요.</p>
        </div>
        
        {/* 실시간 검색창 */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="자주 묻는 질문 실시간 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm shadow-sm transition-all"
          />
        </div>
      </div>

      {/* 2단 메인 레이아웃 (Split layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* 좌측 카테고리 탭 내비게이션 */}
        <div className="lg:col-span-1 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">카테고리 분류</h4>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); }}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-xs font-bold transition-all text-left border-slate-200/50 ${
                  isSelected 
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-[1.02] border-slate-900" 
                    : "bg-white text-slate-600 hover:bg-slate-50 hover:scale-[1.01]"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-amber-400" : cat.color}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 우측 본문 FAQ 아코디언 리스트 */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-2 mb-2">
            <span className="text-xs font-bold text-slate-400">
              검색 결과: 총 {filteredFaqs.length}건의 자주 묻는 질문
            </span>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center py-20">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
              <h3 className="text-base font-bold text-slate-800 mb-1">일치하는 Q&A 정보를 찾을 수 없습니다.</h3>
              <p className="text-xs text-slate-400">검색어를 간결하게 변경하거나 다른 검색어로 다시 입력해 주세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map(faq => {
                const isOpen = openIds.has(faq.id);
                
                return (
                  <div 
                    key={faq.id} 
                    className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 shadow-sm ${
                      isOpen ? "border-amber-400/70 ring-1 ring-amber-100/50" : "border-slate-200/60 hover:border-slate-300"
                    }`}
                  >
                    {/* 질문 영역 */}
                    <button
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 text-sm gap-4 transition-colors cursor-pointer select-none bg-slate-50/20 hover:bg-slate-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-sm shadow-amber-400/20"></span>
                        <span>{faq.question}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-amber-500" : ""}`} />
                    </button>

                    {/* 답변 영역 */}
                    {isOpen && (
                      <div className="p-5 border-t border-slate-100 bg-slate-50/10 text-xs text-slate-600 leading-relaxed font-medium animate-slide-down">
                        <div className="bg-white p-4.5 rounded-xl border border-slate-100/50 text-slate-700 shadow-inner">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 이지봇 AI 헬프 배너 브릿지 (Glassmorphism & Subtle pulse) */}
          <div className="bg-gradient-to-r from-amber-400/10 via-orange-400/10 to-blue-500/10 border border-slate-200 p-6 rounded-3xl mt-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-900 shadow-lg shadow-orange-500/10 shrink-0 animate-bounce">
                <Bot className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 mb-1 flex items-center gap-1.5">
                  원하는 답변을 찾기 어려우신가요?
                  <span className="bg-amber-400 text-slate-900 font-extrabold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5"/>AI</span>
                </h4>
                <p className="text-xs text-slate-500 font-medium">이지봇 인공지능 매장 비서에게 목소리나 채팅으로 필요한 질문을 던져 즉시 해답을 얻으세요!</p>
              </div>
            </div>
            
            <button
              onClick={triggerEasyBot}
              className="px-5 py-3 bg-slate-950 text-white font-bold rounded-xl text-xs hover:bg-slate-800 active:scale-95 transition-all border-0 shadow-md shadow-slate-950/20 shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              이지봇 AI 비서 호출하기
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
