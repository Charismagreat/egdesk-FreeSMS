"use client";

import { useState, useEffect, useRef } from "react";
import { Globe } from "lucide-react";

// 공통 타입 및 유틸리티 임포트
import { ChatMessage, ChatSession, WebsiteConfig } from "./types";
import { processNaturalLanguageRequest } from "./utils/nlpProcessor";
import { generateQRCodeCanvas } from "./utils/qrHelper";

// 분리된 서브 컴포넌트 임포트
import { TemplateSelector } from "./components/TemplateSelector";
import { HistoryOverlay } from "./components/HistoryOverlay";
import { AiChatPanel } from "./components/AiChatPanel";
import { ManualTunerPanel } from "./components/ManualTunerPanel";
import { LiveSimulator } from "./components/LiveSimulator";
import { MarketingKitCenter } from "./components/MarketingKitCenter";

// 템플릿 데이터 프리셋 정의 (NLP와의 정합성을 위해 유지)
export const TEMPLATES: Record<string, WebsiteConfig> = {
  dining: {
    mode: "store",
    title: "라 프렌치 다이닝",
    subtitle: "강남에서 만나는 최고급 프렌치 요리와 파인 다이닝의 정수",
    theme: "gradient",
    primaryColor: "rose",
    sections: { hero: true, about: true, products: true, booking: true, map: true, contact: true },
    aboutText: "저희 라 프렌치 다이닝은 20년 경력의 미쉐린 스타 셰프가 선사하는 고품격 정통 프랑스 요리 전문점입니다. 매일 아침 신선하게 공급되는 엄선된 제철 식재료만을 사용하여 깊고 풍부한 프랑스의 맛을 구현해 냅니다. 격조 높은 서비스와 세련된 공간에서 특별한 순간을 소중한 분들과 함께 완성해 보세요.",
    contactPhone: "02-555-9876",
    address: "서울시 강남구 테헤란로 123, 1층",
    customDomain: "lafrench.egdesk.co",
    products: [
      { id: "d1", name: "시그니처 디너 크루 코스", price: "150,000원", description: "아뮤즈 부쉬, 에스카르고, 최고급 한우 안심 스테이크, 디저트로 구성된 고품격 풀코스 요리" },
      { id: "d2", name: "바닷가재 타르타르와 캐비어", price: "65,000원", description: "신선한 로브스터 살에 레몬 비네그레트 드레싱을 얹고 벨루가 캐비어를 곁들인 프리미엄 전채" },
      { id: "d3", name: "수비드 양갈비 프렌치 랙", price: "85,000원", description: "어린 양갈비를 진공 저온 공법으로 조리하여 입안에서 녹아내리는 극상의 부드러움을 선사하는 메인 디시" }
    ]
  },
  fitness: {
    mode: "cms",
    title: "바디핏 필라테스 & 요가",
    subtitle: "과학적인 체형 분석과 1:1 맞춤 기구 필라테스로 완성하는 아름다운 라인",
    theme: "glass",
    primaryColor: "emerald",
    sections: { hero: true, about: true, products: true, booking: true, map: true, contact: true },
    aboutText: "바디핏 필라테스는 개개인의 체형과 근육 불균형 상태를 첨단 장비로 정밀 측정하여, 전문 강사진이 가장 적합한 자세 교정 및 근력 향상 프로그램을 맞춤 설계해 드립니다. 깨끗하고 프라이빗한 최고급 시설에서 온전한 나 자신만의 건강한 호흡과 움직임에 집중하며 삶의 활력을 채워보세요.",
    contactPhone: "010-8765-4321",
    address: "서울시 서초구 서초대로 456, 3층",
    customDomain: "bodyfit.egdesk.co",
    products: [
      { id: "f1", name: "1:1 프라이빗 개인 레슨권 (10회)", price: "770,000원", description: "오직 나만을 위한 맞춤 기구 필라테스 프로그램. 정밀 체형 분석 및 매회 맞춤형 차트 관리" },
      { id: "f2", name: "2:1 듀엣 프렌즈 레슨권 (10회)", price: "450,000원", description: "가족, 친구, 연인과 함께 오붓하게 진행하는 듀엣 필라테스 수업. 합리적인 가격과 확실한 밀착 관리" },
      { id: "f3", name: "4:1 소그룹 기구 필라테스 (월 8회)", price: "240,000원", description: "최대 4인 정원으로 진행되는 리포머/스프링보드 그룹 클래스. 소수 정예로 디테일한 동작 피드백 보장" }
    ]
  },
  coupon: {
    mode: "landing",
    title: "루나 헤어살롱 오프닝 메가 세일",
    subtitle: "첫 방문 고객 한정! 전 품목 40% 초특급 할인 웰컴 쿠폰 즉시 다운로드",
    theme: "dark",
    primaryColor: "violet",
    sections: { hero: true, about: true, products: false, booking: true, map: true, contact: true },
    aboutText: "트렌디한 감각과 독보적인 기술을 겸비한 헤어 아티스트 그룹 '루나 헤어'가 강남점을 새롭게 오픈했습니다! 오픈을 기념하여 방문하시는 모든 고객님께 감사의 마음을 담아 첫 방문 전 시술 40% 즉시 할인 쿠폰을 한정 수량 제공합니다. 루나 헤어에서 인생 머리를 찾고 완벽한 이미지 변화를 경험해 보세요.",
    contactPhone: "02-1234-5678",
    address: "서울시 마포구 독막로 88, 2층",
    customDomain: "lunahair.egdesk.co",
    products: []
  },
  minimalCafe: {
    mode: "store",
    title: "카페 모노(MONO)",
    subtitle: "미니멀리즘 인테리어와 스페셜티 드립 커피가 선사하는 평온한 쉼표",
    theme: "minimal",
    primaryColor: "slate",
    sections: { hero: true, about: true, products: true, booking: false, map: true, contact: true },
    aboutText: "시끄럽고 복잡한 도심 한가운데에서 진정한 미니멀리즘과 스페셜티 에스프레소의 품격을 만나보세요. 카페 모노는 매주 전 세계 유수 농장에서 소량 직수입한 스페셜티 원두를 전문 로스터가 직접 세밀하게 볶아 최상의 커피 아로마를 추출합니다. 잔잔한 재즈 음악과 향긋한 커피 한 잔의 고요함을 누려보세요.",
    contactPhone: "070-9999-8888",
    address: "서울시 성동구 연무장길 77, 1층",
    customDomain: "mono.egdesk.co",
    products: [
      { id: "c1", name: "에티오피아 예가체프 싱글 드립 커피", price: "6,500원", description: "풍부한 과일 꽃 향과 부드럽고 깔끔한 산미가 일품인 명품 핸드 드립 스페셜티 커피" },
      { id: "c2", name: "시그니처 블랙 세사미 슈페너", price: "7,000원", description: "고소한 흑임자 아인슈페너 크림에 에스프레소와 귀리 우유가 조화롭게 어우러진 시그니처 꿀조합 커피" },
      { id: "c3", name: "프랑스 이즈니 버터 크루아상", price: "4,800원", description: "최고급 이즈니 버터를 가득 품어 겉은 바삭하고 속은 촉촉하게 결이 살아있는 매일 구운 시그니처 크루아상" }
    ]
  }
};

export default function WebsiteBuilderPage() {
  const [config, setConfig] = useState<WebsiteConfig>(TEMPLATES.dining);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "안녕하세요! EGDESK AI 홈페이지 코파일럿 '이지봇'입니다. 🤖\n\n자연어로 말씀해 주시면 원하는 테마와 레이아웃을 반영하여 모바일 최적화 홈페이지를 실시간으로 빌드해 드립니다.\n\n예: \"딥블루 테마로 세련된 필라테스 홈페이지 만들어주고 예약 기능 활성화해줘.\"",
      timestamp: new Date().toISOString()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "manual">("chat");

  // 대화 기록 및 새 대화 관련 상태
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 모바일 기기 시뮬레이터 인터랙션 상태
  const [mobileBookings, setMobileBookings] = useState<any[]>([]);
  const [bookingForm, setBookingForm] = useState({ name: "", phone: "", date: "", time: "", guests: "2" });
  const [couponDownloaded, setCouponDownloaded] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "info" | "error"; text: string } | null>(null);

  // QR 코드 Canvas Ref 및 상태
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);

  // 클립보드 복사 헬퍼 함수
  const copyToClipboard = (text: string, type: "link" | "sms") => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        if (type === "link") {
          setCopiedLink(true);
          showMobileAlert("success", "🔗 모바일 단축 URL이 클립보드에 복사되었습니다!");
          setTimeout(() => setCopiedLink(false), 2000);
        } else {
          setCopiedSms(true);
          showMobileAlert("success", "📣 마케팅 SMS 홍보 서식이 클립보드에 복사되었습니다!");
          setTimeout(() => setCopiedSms(false), 2000);
        }
      }).catch(() => {
        showMobileAlert("error", "클립보드 복사에 실패했습니다.");
      });
    } else {
      // 대체 복사 방식 (클립보드 API 미지원 환경 대비)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        if (type === "link") {
          setCopiedLink(true);
          showMobileAlert("success", "🔗 모바일 단축 URL이 클립보드에 복사되었습니다!");
          setTimeout(() => setCopiedLink(false), 2000);
        } else {
          setCopiedSms(true);
          showMobileAlert("success", "📣 마케팅 SMS 홍보 서식이 클립보드에 복사되었습니다!");
          setTimeout(() => setCopiedSms(false), 2000);
        }
      } catch (err) {
        showMobileAlert("error", "클립보드 복사에 실패했습니다.");
      }
      document.body.removeChild(textArea);
    }
  };

  // 입력창 자동 크기 조절
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(Math.max(scrollHeight, 52), 150)}px`;
    }
  }, [chatInput]);

  // 엔터키 입력 처리 (Shift + Enter는 줄바꿈, Enter는 전송)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const fakeEvent = {
        preventDefault: () => {}
      } as React.FormEvent;
      handleSendMessage(fakeEvent);
    }
  };

  // 이미지 파일 첨부 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMobileAlert("error", "⚠️ 이미지는 최대 5MB까지만 첨부할 수 있습니다.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
        showMobileAlert("success", `📸 이미지 '${file.name}' 첨부가 완료되었습니다.`);
      };
      reader.readAsDataURL(file);
    }
  };

  // 첨부 이미지 삭제
  const handleRemoveImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 로컬스토리지 복원
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("egdesk_website_config");
      if (saved) {
        try {
          setConfig(JSON.parse(saved));
        } catch (e) {
          console.error("로컬 스토리지 데이터 로드 실패", e);
        }
      }

      const savedSessions = localStorage.getItem("egdesk_chat_sessions");
      if (savedSessions) {
        try {
          setSessions(JSON.parse(savedSessions));
        } catch (e) {
          console.error("채팅 세션 로컬 스토리지 로드 실패", e);
        }
      }
    }
  }, []);

  // 설정이 변경될 때마다 로컬스토리지 저장 및 QR 코드 재생성
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_website_config", JSON.stringify(config));
    }
    generateQRCode();
  }, [config]);

  // Canvas 기반 QR 코드 생성 연동
  const generateQRCode = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const url = generateQRCodeCanvas(canvas, config.primaryColor);
    setQrCodeDataUrl(url);
  };

  // 모바일 디바이스 가상 알림 생성
  const showMobileAlert = (type: "success" | "info" | "error", text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 3500);
  };

  // 가상 쿠폰 다운로드
  const handleDownloadCoupon = () => {
    if (couponDownloaded) {
      showMobileAlert("info", "이미 쿠폰을 보관함에 다운로드 하셨습니다.");
      return;
    }
    setCouponDownloaded(true);
    showMobileAlert("success", "🎟️ 웰컴 40% 특별 할인 쿠폰이 모바일 지갑에 보관되었습니다!");
  };

  // 가상 예약 신청
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.phone || !bookingForm.date || !bookingForm.time) {
      showMobileAlert("error", "모든 예약 정보를 빠짐없이 입력해 주세요.");
      return;
    }
    const newBooking = {
      id: Date.now().toString(),
      ...bookingForm,
      createdAt: new Date().toLocaleDateString()
    };
    setMobileBookings([newBooking, ...mobileBookings]);
    showMobileAlert("success", `🎉 ${bookingForm.name} 고객님의 예약 신청이 완료되었습니다! 안내 문자가 곧 발송됩니다.`);
    setBookingForm({ name: "", phone: "", date: "", time: "", guests: "2" });
  };

  // 템플릿 강제 교체 헬퍼
  const applyPresetTemplate = (key: string) => {
    const tpl = TEMPLATES[key];
    if (tpl) {
      setConfig(tpl);
      showMobileAlert("success", `⚡ '${tpl.title}' 템플릿으로 빠른 세팅이 완료되었습니다!`);

      const newMsg = {
        sender: "ai" as const,
        text: `💡 **'${tpl.title}'** 프리미엄 템플릿으로 빠르게 초기화를 완료했습니다.\n\n오른쪽 스마트폰 화면에서 라이브 모습을 확인하시고, 대화나 수동 탭을 통해 언제든 입맛에 맞춰 상세 수정해 보세요!`,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, newMsg]);
    }
  };

  // 새 대화 시작 (현재 대화가 있으면 세션으로 자동 저장)
  const handleNewChat = () => {
    if (chatMessages.length > 1) {
      const firstUserMsg = chatMessages.find(m => m.sender === "user")?.text || "새로운 홈페이지 디자인 대화";
      const sessionTitle = firstUserMsg.length > 20 ? firstUserMsg.slice(0, 20) + "..." : firstUserMsg;

      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: sessionTitle,
        messages: chatMessages,
        config: config,
        timestamp: new Date().toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
      };

      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      if (typeof window !== "undefined") {
        localStorage.setItem("egdesk_chat_sessions", JSON.stringify(updatedSessions));
      }
      showMobileAlert("success", "📁 현재 대화가 기록 보관함에 안전하게 저장되었습니다.");
    }

    setChatMessages([
      {
        sender: "ai",
        text: "안녕하세요! EGDESK AI 홈페이지 코파일럿 '이지봇'입니다. 🤖\n\n자연어로 말씀해 주시면 원하는 테마와 레이아웃을 반영하여 모바일 최적화 홈페이지를 실시간으로 빌드해 드립니다.\n\n예: \"딥블루 테마로 세련된 필라테스 홈페이지 만들어주고 예약 기능 활성화해줘.\"",
        timestamp: new Date().toISOString()
      }
    ]);
    showMobileAlert("success", "✨ 새로운 대화창이 열렸습니다!");
  };

  // 대화 기록 복원
  const handleLoadSession = (session: ChatSession) => {
    setChatMessages(session.messages);
    setConfig(session.config);
    setShowHistory(false);
    showMobileAlert("success", `📂 '${session.title}' 대화 세션과 테마 설정을 성공적으로 복원했습니다.`);
  };

  // 대화 기록 삭제
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_chat_sessions", JSON.stringify(updatedSessions));
    }
    showMobileAlert("success", "🗑️ 대화 기록이 삭제되었습니다.");
  };

  // 자연어 처리 NLP 유틸리티 연동 핸들러
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !attachedImage) return;

    const userText = chatInput.trim();
    const currentAttachedImage = attachedImage;

    const newUserMsg: ChatMessage = {
      sender: "user",
      text: userText || "🖼️ 이미지를 첨부하여 비주얼 무드 분석을 요청했습니다.",
      timestamp: new Date().toISOString(),
      image: currentAttachedImage || undefined
    };
    setChatMessages(prev => [...prev, newUserMsg]);
    setChatInput("");
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsTyping(true);

    setTimeout(() => {
      const { updatedConfig, responseText } = processNaturalLanguageRequest(
        userText,
        config,
        !!currentAttachedImage
      );

      const newAiMsg: ChatMessage = {
        sender: "ai",
        text: responseText,
        timestamp: new Date().toISOString()
      };

      setConfig(updatedConfig);
      setChatMessages(prev => [...prev, newAiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 text-slate-800">
      {/* 보이지 않는 QR 코드 드로잉용 캔버스 */}
      <canvas ref={qrCanvasRef} width="150" height="150" className="hidden" />

      {/* 상단 타이틀 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-200 relative z-10 shrink-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            <Globe className="w-8 h-8 text-pink-600 mr-3" />
            홈페이지 빌더 AI
          </h1>
        </div>

        {/* 템플릿 프리셋 퀵 셀렉터 */}
        <TemplateSelector applyPresetTemplate={applyPresetTemplate} />
      </div>

      {/* 메인 2분할 레이아웃 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 flex-1 overflow-hidden min-h-0">
        
        {/* 좌측 패널 (대화 생성기 및 수동 튜너 탭) */}
        <div
          className="lg:col-span-7 bg-white/90 border border-slate-100 rounded-3xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all backdrop-blur-md"
          style={{ height: "880px" }}
        >
          {/* 탭 컨트롤 헤더 */}
          <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-extrabold rounded-2xl transition-all cursor-pointer border-0 ${
                activeTab === "chat"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/50 font-black"
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              AI 대화형 홈페이지 생성기
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-extrabold rounded-2xl transition-all cursor-pointer border-0 ${
                activeTab === "manual"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/50 font-black"
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              마우스 정밀 수동 튜닝
            </button>
          </div>

          {/* 탭 컨텐츠 렌더링 분기 */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {activeTab === "chat" ? (
              <AiChatPanel
                chatMessages={chatMessages}
                isTyping={isTyping}
                chatInput={chatInput}
                setChatInput={setChatInput}
                handleSendMessage={handleSendMessage}
                handleNewChat={handleNewChat}
                sessionsCount={sessions.length}
                showHistory={showHistory}
                setShowHistory={setShowHistory}
                handleImageChange={handleImageChange}
                handleRemoveImage={handleRemoveImage}
                attachedImage={attachedImage}
                textareaRef={textareaRef}
                fileInputRef={fileInputRef}
                handleKeyDown={handleKeyDown}
              />
            ) : (
              <ManualTunerPanel
                config={config}
                setConfig={setConfig}
                onSave={() => {
                  localStorage.setItem("egdesk_website_config", JSON.stringify(config));
                  showMobileAlert("success", "💾 변경된 홈페이지 설정이 브라우저 로컬 저장소에 완벽히 동기화 및 저장되었습니다!");
                }}
              />
            )}

            {/* 대화 기록 모달 (AI 대화창 활성화 및 대화기록 활성화 시에만 렌더링) */}
            <HistoryOverlay
              isOpen={activeTab === "chat" && showHistory}
              onClose={() => setShowHistory(false)}
              sessions={sessions}
              onLoadSession={handleLoadSession}
              onDeleteSession={handleDeleteSession}
            />
          </div>
        </div>

        {/* 우측 패널 (스마트폰 가상 프리뷰 시뮬레이터) */}
        <LiveSimulator
          config={config}
          alertMessage={alertMessage}
          couponDownloaded={couponDownloaded}
          handleDownloadCoupon={handleDownloadCoupon}
          bookingForm={bookingForm}
          setBookingForm={setBookingForm}
          handleBookingSubmit={handleBookingSubmit}
          showMobileAlert={showMobileAlert}
        />
      </div>

      {/* 하단 마케팅 배포 키트 연동 카드 */}
      <MarketingKitCenter
        config={config}
        qrCodeDataUrl={qrCodeDataUrl}
        copiedLink={copiedLink}
        copiedSms={copiedSms}
        copyToClipboard={copyToClipboard}
      />
    </div>
  );
}
