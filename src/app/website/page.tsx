"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Globe, Bot, Send, Sparkles, Layout, Smartphone, 
  RotateCcw, Save, Trash2, QrCode, Download, Copy, 
  ExternalLink, Check, Phone, MapPin, Calendar, 
  ShoppingBag, Star, ShieldCheck, Heart, ArrowRight,
  Info, Compass, Scissors, Dumbbell, Coffee, Flame, AlertCircle,
  Plus, History, Image
} from "lucide-react";

// 대화 세션 인터페이스 정의
interface ChatSession {
  id: string;
  title: string;
  messages: Array<{ sender: "ai" | "user"; text: string; timestamp: string; image?: string }>;
  config: WebsiteConfig;
  timestamp: string;
}

// 홈페이지 설정 인터페이스
interface WebsiteConfig {
  mode: "store" | "cms" | "landing"; // 미니쇼핑몰, 서비스 홍보, 쿠폰 랜딩
  title: string;
  subtitle: string;
  theme: "gradient" | "minimal" | "dark" | "glass";
  primaryColor: "indigo" | "emerald" | "rose" | "amber" | "violet" | "cyan" | "slate";
  sections: {
    hero: boolean;
    about: boolean;
    products: boolean;
    booking: boolean;
    map: boolean;
    contact: boolean;
  };
  aboutText: string;
  contactPhone: string;
  address: string;
  products: Array<{
    id: string;
    name: string;
    price: string;
    description: string;
    imageUrl?: string;
  }>;
  customDomain: string;
}

// 템플릿 데이터 프리셋
const TEMPLATES: Record<string, WebsiteConfig> = {
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
      { id: "f1", name: "1:1 프라이빗 개인 레슨 (10회)", price: "770,000원", description: "오직 나만을 위한 맞춤 기구 필라테스 프로그램. 정밀 체형 분석 및 매회 맞춤형 차트 관리" },
      { id: "f2", name: "2:1 듀엣 프렌즈 레슨 (10회)", price: "450,000원", description: "가족, 친구, 연인과 함께 오붓하게 진행하는 듀엣 필라테스 수업. 합리적인 가격과 확실한 밀착 관리" },
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
      { id: "c1", name: "에티오피아 예가체프 싱글 오리진 드립 커피", price: "6,500원", description: "풍부한 과일 꽃 향과 부드럽고 깔끔한 산미가 일품인 명품 핸드 드립 스페셜티 커피" },
      { id: "c2", name: "시그니처 블랙 세사미 슈페너", price: "7,000원", description: "고소한 흑임자 아인슈페너 크림에 에스프레소와 귀리 우유가 조화롭게 어우러진 시그니처 꿀조합 커피" },
      { id: "c3", name: "프랑스 이즈니 버터 크루아상", price: "4,800원", description: "최고급 이즈니 버터를 가득 품어 겉은 바삭하고 속은 촉촉하게 결이 살아있는 매일 구운 시그니처 크루아상" }
    ]
  }
};

// 메인 페이지 컴포넌트
export default function WebsiteBuilderPage() {
  const [config, setConfig] = useState<WebsiteConfig>(TEMPLATES.dining);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ai" | "user"; text: string; timestamp: Date; image?: string }>>([
    {
      sender: "ai",
      text: "안녕하세요! EGDESK AI 홈페이지 코파일럿 '이지봇'입니다. 🤖\n\n자연어로 말씀해 주시면 원하는 테마와 레이아웃을 반영하여 모바일 최적화 홈페이지를 실시간으로 빌드해 드립니다.\n\n예: \"딥블루 테마로 세련된 필라테스 홈페이지 만들어주고 예약 기능 활성화해줘.\"",
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "manual" | "settings">("chat");
  const [livePreviewTab, setLivePreviewTab] = useState<"home" | "products" | "booking" | "map">("home");

  // 대화 기록 및 새 대화 관련 상태
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // 모바일 기기 시뮬레이터 인터랙션 상태
  const [mobileBookings, setMobileBookings] = useState<Array<any>>([]);
  const [bookingForm, setBookingForm] = useState({ name: "", phone: "", date: "", time: "", guests: "2" });
  const [couponDownloaded, setCouponDownloaded] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "info" | "error"; text: string } | null>(null);

  // QR 코드 Canvas Ref
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
      }).catch(err => {
        console.error("클립보드 복사 실패", err);
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
        console.error("클립보드 대체 복사 실패", err);
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
      // 최소 높이 52px 정도로 잡고 최대 150px까지 늘림
      textarea.style.height = `${Math.min(Math.max(scrollHeight, 52), 150)}px`;
    }
  }, [chatInput]);

  // 엔터키 입력 처리 (Shift + Enter는 줄바꿈, Enter는 전송)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // 가짜 Form Submit 이벤트 객체를 생성해서 전송
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

  // Canvas 기반 QR 코드 생성 헬퍼
  const generateQRCode = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 간단하고 세련된 QR 코드 더미 매트릭스 그리기 (이지데스크 스타일)
    ctx.clearRect(0, 0, 150, 150);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 150, 150);

    // QR 코드 테두리 사각형들 (3개의 모서리 포지션 모듈)
    ctx.fillStyle = config.primaryColor === "slate" ? "#1e293b" : 
                    config.primaryColor === "indigo" ? "#4f46e5" :
                    config.primaryColor === "emerald" ? "#059669" :
                    config.primaryColor === "rose" ? "#e11d48" :
                    config.primaryColor === "amber" ? "#d97706" :
                    config.primaryColor === "violet" ? "#7c3aed" : "#0891b2";

    // 좌상단
    ctx.fillRect(10, 10, 35, 35);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(15, 15, 25, 25);
    ctx.fillStyle = ctx.fillStyle = ctx.fillStyle; // restore color
    ctx.fillRect(20, 20, 15, 15);

    // 우상단
    ctx.fillStyle = ctx.fillStyle;
    ctx.fillRect(105, 10, 35, 35);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(110, 15, 25, 25);
    ctx.fillStyle = ctx.fillStyle;
    ctx.fillRect(115, 20, 15, 15);

    // 좌하단
    ctx.fillStyle = ctx.fillStyle;
    ctx.fillRect(10, 105, 35, 35);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(15, 110, 25, 25);
    ctx.fillStyle = ctx.fillStyle;
    ctx.fillRect(20, 115, 15, 15);

    // 중앙 및 미세 도트 채우기 (무작위적인 것 같지만 고정된 매트릭스 느낌으로 생성)
    ctx.fillStyle = "#1e293b";
    const dotPattern = [
      [5, 5], [7, 6], [8, 9], [6, 12], [12, 5], [13, 8], [9, 13], [14, 14],
      [6, 7], [10, 6], [11, 10], [5, 13], [13, 6], [7, 14], [14, 11], [9, 9]
    ];
    dotPattern.forEach(([x, y]) => {
      ctx.fillRect(x * 8 + 15, y * 8 + 15, 6, 6);
    });

    // EG 로고 중앙 미니 장식
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(60, 60, 30, 30);
    ctx.fillStyle = config.primaryColor === "slate" ? "#1e293b" : "#4f46e5";
    ctx.fillRect(64, 64, 22, 22);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("EG", 68, 80);

    setQrCodeDataUrl(canvas.toDataURL("image/png"));
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
        timestamp: new Date()
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
        messages: chatMessages.map(m => ({
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp.toISOString()
        })),
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
        timestamp: new Date()
      }
    ]);
    showMobileAlert("success", "✨ 새로운 대화창이 열렸습니다!");
  };

  // 대화 기록 복원
  const handleLoadSession = (session: ChatSession) => {
    setChatMessages(session.messages.map(m => ({
      sender: m.sender as "ai" | "user",
      text: m.text,
      timestamp: new Date(m.timestamp)
    })));
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

  // 자연어 처리 NLP 시뮬레이터 핵심 로직
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !attachedImage) return;

    const userText = chatInput.trim();
    const currentAttachedImage = attachedImage; // 비동기 setTimeout 안에서 참조하기 위해 보관

    const newUserMsg = { 
      sender: "user" as const, 
      text: userText || "🖼️ 이미지를 첨부하여 비주얼 무드 분석을 요청했습니다.", 
      timestamp: new Date(),
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
      // NLP 키워드 기반 분석 엔진
      let responseText = "";
      const lowerText = userText.toLowerCase();
      let updatedConfig = { ...config };
      let changes: string[] = [];

      // 1. 모드/비즈니스 테마 파싱
      if (lowerText.includes("레스토랑") || lowerText.includes("식당") || lowerText.includes("파인다이닝") || lowerText.includes("디저트") || lowerText.includes("맛집") || lowerText.includes("음식")) {
        updatedConfig.mode = "store";
        updatedConfig.title = "더 그랑 퀴진";
        updatedConfig.subtitle = "셰프의 특별한 감각이 돋보이는 최고급 정통 파인 다이닝 레스토랑";
        updatedConfig.aboutText = "더 그랑 퀴진은 청정 지역의 유기농 제철 식재료만을 고집하여 감동적인 미식 여정을 선사합니다. 와인 소믈리에가 엄선한 빈티지 와인 페어링과 함께 영원히 잊지 못할 저녁 식사를 만끽하세요.";
        updatedConfig.products = [
          { id: "ai_d1", name: "시그니처 안심 스테이크", price: "79,000원", description: "국내산 무항생제 1++ 한우 안심과 특제 레드와인 소스 소테" },
          { id: "ai_d2", name: "트러플 크림 파스타", price: "28,000원", description: "이탈리아산 생 트러플을 듬뿍 갈아 넣은 진하고 풍부한 유기농 크림 파스타" }
        ];
        updatedConfig.sections.products = true;
        updatedConfig.sections.booking = true;
        changes.push("🍔 **'미니 샵/파인다이닝 레스토랑' 모드**로 변경하고 관련 상품(스테이크, 파스타)을 주입했습니다.");
      } else if (lowerText.includes("필라테스") || lowerText.includes("요가") || lowerText.includes("헬스") || lowerText.includes("피트니스") || lowerText.includes("PT") || lowerText.includes("운동")) {
        updatedConfig.mode = "cms";
        updatedConfig.title = "아우라 기구 필라테스";
        updatedConfig.subtitle = "자세를 바르게, 마음을 맑게. 프라이빗 체형 교정 전문 센터";
        updatedConfig.aboutText = "아우라 필라테스는 체계적인 자세 측정 데이터를 바탕으로 코어 근육을 강화하고 신체 밸런스를 되찾아 드리는 맞춤형 운동 요람입니다. 쾌적한 1:1 전용 룸에서 건강한 변화를 직접 체험해 보세요.";
        updatedConfig.products = [
          { id: "ai_f1", name: "1:1 프라이빗 개인 레슨권 (8회)", price: "580,000원", description: "정밀 체형 진단기 기반 개인 최적화 맞춤 기구 동작 코칭" },
          { id: "ai_f2", name: "6:1 소그룹 필라테스 회원권 (월 12회)", price: "220,000원", description: "리포머와 체어를 활용한 활기차고 에너지 넘치는 소수 정예 그룹 클래스" }
        ];
        updatedConfig.sections.booking = true;
        changes.push("🧘 **'전문 센터 홍보 CMS' 모드**로 변경하고 기구 필라테스 레슨 상품을 적용했습니다.");
      } else if (lowerText.includes("이벤트") || lowerText.includes("쿠폰") || lowerText.includes("랜딩") || lowerText.includes("마케팅") || lowerText.includes("세일") || lowerText.includes("할인")) {
        updatedConfig.mode = "landing";
        updatedConfig.title = "오픈 기념 40% 웰컴 쿠폰 이벤트";
        updatedConfig.subtitle = "방문 전 클릭 한 번으로 즉시 발급받는 특급 할인 찬스! 지금 받으세요.";
        updatedConfig.aboutText = "신규 오픈을 진심으로 축하해 주시는 고객님들을 위해 선착순 100분께만 드리는 프리미엄 40% 할인 웰컴 쿠폰입니다. 쿠폰 받기 단추를 누르고 간편하게 예약해 보세요!";
        updatedConfig.sections.products = false;
        updatedConfig.sections.booking = true;
        changes.push("🎟️ **'이벤트 쿠폰 모바일 랜딩' 모드**로 전환하고, 웰컴 쿠폰 발급창과 즉시 예약 폼을 세팅했습니다.");
      } else if (lowerText.includes("카페") || lowerText.includes("커피") || lowerText.includes("베이커리") || lowerText.includes("빵")) {
        updatedConfig.mode = "store";
        updatedConfig.title = "베이커리 카페 라온";
        updatedConfig.subtitle = "매일 아침 유기농 밀가루로 직접 굽는 명품 빵과 풍부한 아로마 커피";
        updatedConfig.aboutText = "라온은 정성이 담긴 건강한 빵문화를 지향합니다. 천연 효모종을 활용한 천천히 숙성되는 슬로우 브레드와 프리미엄 드립 커피의 환상적인 케미를 야외 테라스에서 여유롭게 즐겨보세요.";
        updatedConfig.products = [
          { id: "ai_c1", name: "소금 버터볼 크루아상", price: "4,500원", description: "겉바속촉 고소함의 대명사! 천일염을 솔솔 뿌린 프랑스 고메 버터 소금 크루아상" },
          { id: "ai_c2", name: "스페셜 콜드브루 커피", price: "5,500원", description: "12시간 동안 한 방울 한 방울 정성껏 추출하여 깔끔하고 초콜릿 풍미가 짙은 차가운 더치 커피" }
        ];
        updatedConfig.sections.products = true;
        changes.push("☕ **'베이커리/디저트 스토어' 모드**로 변경하고 향긋한 카페 빵과 커피 리스트를 구성했습니다.");
      }

      // 2. 색상 테마 파싱
      if (lowerText.includes("파랑") || lowerText.includes("블루") || lowerText.includes("네이비") || lowerText.includes("인디고")) {
        updatedConfig.primaryColor = "indigo";
        changes.push("🎨 메인 테마 색상을 신뢰감을 주는 **'인디고 블루(Indigo Blue)'**로 변경했습니다.");
      } else if (lowerText.includes("초록") || lowerText.includes("그린") || lowerText.includes("에메랄드") || lowerText.includes("자연")) {
        updatedConfig.primaryColor = "emerald";
        changes.push("🎨 메인 테마 색상을 싱그럽고 친환경적인 **'에메랄드 그린(Emerald Green)'**으로 바꿨습니다.");
      } else if (lowerText.includes("빨강") || lowerText.includes("레드") || lowerText.includes("로즈") || lowerText.includes("핑크") || lowerText.includes("버건디")) {
        updatedConfig.primaryColor = "rose";
        changes.push("🎨 메인 테마 색상을 강렬하고 매혹적인 **'로즈 버건디(Rose Burgundy)'**로 변경했습니다.");
      }

      // 3. AI 답변 빌딩 및 상태 갱신
      if (changes.length > 0) {
        responseText = `🤖 **알림: 인공지능이 요청을 해석하여 홈페이지를 새단장했습니다!**\n\n${changes.map(c => `• ${c}`).join("\n")}\n\n우측 모바일 미리보기에서 실시간으로 반영된 명품 디자인을 감상해 보세요. 마음에 들지 않으시면 언제든지 다른 변경이나 복구를 명령하실 수 있습니다!`;
      } else if (currentAttachedImage) {
        // 첨부된 이미지가 있는 경우 AI의 비주얼 이미지 분석 시뮬레이션 반응
        updatedConfig.theme = "glass"; // 이미지 매칭 럭셔리 글래스 테마
        updatedConfig.primaryColor = "violet"; // 매칭 색상 보라색
        updatedConfig.title = "비주얼 갤러리 앤 비스트로";
        updatedConfig.subtitle = "첨부해주신 디자인 시안의 무드와 아름다운 대비를 녹여낸 하이엔드 레이아웃";
        updatedConfig.aboutText = "보내주신 비주얼 자료의 톤앤매너를 본떠 완성된 AI 테마 공간입니다. 투명하게 빛나는 글래스 섀시 스킨 위에 고메 감성의 디테일들을 섬세하게 배치했습니다. 매장의 격조와 가치가 모바일 안에서 생생하게 되살아납니다.";
        
        responseText = `🤖 **이지봇의 이미지 비주얼 분석 보고서:**\n\n보내주신 시안/컨셉 이미지의 주조색 분포와 레이아웃 대비를 AI 엔진이 정밀 추출했습니다! 📸🎨\n\n• **디자인 무드**: 현대적이고 품격 있는 **'하이엔드 갤러리'** 톤앤매너 감지\n• **추천 시그니처 컬러**: 이미지와 가장 우아하게 조화를 이루는 **'바이올렛(Violet)'** 테마 강제 매칭\n• **레이아웃 스킨**: 빛의 산란과 모던한 매력이 돋보이는 **'글래스모피즘(Glassmorphism)'** 레이어 적용\n\n우측 모바일 미리보기 디바이스에서 첨부해주신 이미지의 영감이 세련되게 반영된 홈페이지 실시간 레이아웃을 확인해 보세요!`;
      } else {
        responseText = `🧐 "${userText}" 라고 말씀해 주셨군요!\n\n현재 가동 중인 AI 홈페이지 빌더는 '카페', '레스토랑', '필라테스', '이벤트 쿠폰 랜딩' 모드와 함께 '파랑/초록/빨강/다크/글래스/미니멀' 등 다양한 디자인 테마 및 스킨 변경을 지원합니다.\n\n예: *"분위기 있는 스테이크 레스토랑 테마로 바꾸고 핑크색 포인트 컬러로 해줘"* 처럼 구체적으로 말씀해 주시면 인공지능 비서가 즉각 반영해 드립니다!`;
      }

      const newAiMsg = {
        sender: "ai" as const,
        text: responseText,
        timestamp: new Date()
      };

      setConfig(updatedConfig);
      setChatMessages(prev => [...prev, newAiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-pink-500 selection:text-white relative overflow-hidden min-w-0">
      
      {/* 백그라운드 럭셔리 핑크 & 퍼플 오로라 광채 효과 */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[50%] rounded-full bg-purple-100/40 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[50%] rounded-full bg-pink-100/40 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full bg-blue-50/30 blur-[120px] pointer-events-none" />

      {/* 보이지 않는 QR 코드 드로잉용 캔버스 */}
      <canvas ref={qrCanvasRef} width="150" height="150" className="hidden" />

      {/* 상단 타이틀 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-200 relative z-10 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* 럭셔리 핑크-퍼플 그라디언트 엠블럼 */}
          <div className="p-3 bg-gradient-to-tr from-[#ff007f] to-[#7928ca] rounded-2xl shadow-[0_8px_30px_rgba(255,0,127,0.2)] animate-pulse shrink-0 self-start sm:self-auto">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-pink-50 text-pink-600 text-[10.5px] font-extrabold px-3 py-0.5 rounded-full border border-pink-200/60 shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-pink-500 animate-spin" style={{ animationDuration: "4s" }} /> AI BUILDER ENGINE
              </span>
              <span className="text-slate-600 border border-slate-200/80 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100/80">v2.5 PRO</span>
              <span className="text-pink-600 border border-pink-200 bg-pink-50/80 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Premium Autopilot</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-pink-600 bg-clip-text text-transparent">
              홈페이지 빌더 AI
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              인공지능 비서와의 대화와 고품격 테마를 통해 예약·주문 폼이 결합된 하이브리드 홈페이지를 1분 만에 완성하세요.
            </p>
          </div>
        </div>

        {/* 템플릿 퀵 셀렉터 - 화사한 글래스모피즘 박스 */}
        <div className="flex flex-wrap items-center gap-2 bg-white/80 p-3 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-md">
          <span className="text-xs text-slate-500 font-bold ml-1 flex items-center gap-1"><Layout className="w-3.5 h-3.5 text-slate-400" /> 프리셋:</span>
          <button onClick={() => applyPresetTemplate("dining")} className="text-xs bg-rose-50/60 text-rose-700 hover:bg-rose-100 px-3.5 py-1.5 rounded-xl font-bold transition-all border border-rose-200/50 flex items-center gap-1 cursor-pointer border-0">
            <Coffee className="w-3.5 h-3.5 text-rose-500" /> 레스토랑
          </button>
          <button onClick={() => applyPresetTemplate("fitness")} className="text-xs bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl font-bold transition-all border border-emerald-200/50 flex items-center gap-1 cursor-pointer border-0">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-500" /> 필라테스
          </button>
          <button onClick={() => applyPresetTemplate("coupon")} className="text-xs bg-violet-50/60 text-violet-700 hover:bg-violet-100 px-3.5 py-1.5 rounded-xl font-bold transition-all border border-violet-200/50 flex items-center gap-1 cursor-pointer border-0">
            <Flame className="w-3.5 h-3.5 text-violet-500" /> 헤어세일
          </button>
          <button onClick={() => applyPresetTemplate("minimalCafe")} className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl font-bold transition-all border border-slate-200/50 flex items-center gap-1 cursor-pointer border-0">
            <Compass className="w-3.5 h-3.5 text-slate-500" /> 미니멀카페
          </button>
        </div>
      </div>


      {/* 메인 2분할 레이아웃 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 flex-1 overflow-hidden min-h-0">
        
        {/* ==================================================== */}
        {/* 좌측 영역 (Col 7) : AI 대화형 창 및 수동 디테일 튜너 탭 */}
        {/* ==================================================== */}
        <div className="lg:col-span-7 bg-white/90 border border-slate-100 rounded-3xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all backdrop-blur-md" style={{ height: "880px" }}>
          
          {/* 탭 헤더 컨트롤 */}
          <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5">
            <button 
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-extrabold rounded-2xl transition-all cursor-pointer border-0 ${
                activeTab === "chat" 
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/50 font-black" 
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              <Bot className={`w-4.5 h-4.5 ${activeTab === "chat" ? "text-pink-500" : "text-slate-400"}`} />
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
              <Layout className={`w-4.5 h-4.5 ${activeTab === "manual" ? "text-pink-500" : "text-slate-400"}`} />
              마우스 정밀 수동 튜닝
            </button>
          </div>

          {/* 탭 내용 분기 */}
          {activeTab === "chat" ? (
            // ================== AI 채팅 탭 ==================
            <div className="flex-1 flex flex-col overflow-hidden relative">
              
              {/* 채팅창 상단 유광 컨트롤 바 (새 대화 / 기록) */}
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0 relative z-20">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 font-sans">
                  <Bot className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                  이지봇 실시간 어시스턴트
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={handleNewChat}
                    className="text-xs bg-white text-slate-700 hover:text-pink-600 hover:border-pink-200 border border-slate-200 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer border-0"
                    title="현재 대화를 저장하고 새 대화를 시작합니다"
                  >
                    <Plus className="w-3.5 h-3.5 text-pink-500" />
                    새 대화창
                  </button>
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className={`text-xs border px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer border-0 ${
                      showHistory 
                        ? "bg-pink-50 border-pink-200 text-pink-600 font-extrabold" 
                        : "bg-white border-slate-200 text-slate-700 hover:text-pink-600"
                    }`}
                  >
                    <History className={`w-3.5 h-3.5 ${showHistory ? "text-pink-600" : "text-slate-500"}`} />
                    대화 기록 ({sessions.length})
                  </button>
                </div>
              </div>

              {/* 대화 기록 오버레이 모달 */}
              {showHistory && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-40 p-6 flex flex-col animate-fade-in overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-pink-500" />
                      이전 대화 기록 보관함
                    </h3>
                    <button 
                      onClick={() => setShowHistory(false)}
                      className="text-xs text-slate-400 hover:text-slate-700 font-extrabold border-0 bg-transparent cursor-pointer"
                    >
                      닫기 ✕
                    </button>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Bot className="w-12 h-12 text-slate-300 animate-bounce" />
                      <p className="text-xs font-bold">보관된 이전 대화 기록이 존재하지 않습니다.</p>
                      <p className="text-[10px] text-slate-400 font-medium">대화를 진행한 뒤 '새 대화창'을 누르시면 기록이 보관됩니다.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 no-scrollbar">
                      {sessions.map((sess) => (
                        <div 
                          key={sess.id}
                          onClick={() => handleLoadSession(sess)}
                          className="p-4 bg-slate-50 hover:bg-pink-50/30 border border-slate-200/60 hover:border-pink-200/50 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-4 shadow-sm hover:shadow-md relative group"
                        >
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="text-xs font-bold text-slate-800 truncate mb-1 flex items-center gap-1.5 group-hover:text-pink-600">
                              💬 {sess.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
                              <span>{sess.timestamp}</span>
                              <span>•</span>
                              <span>대화 메시지 {sess.messages.length}개</span>
                              <span>•</span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-500">
                                테마: {sess.config.title}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSession(sess.id, e)}
                            className="p-1.5 rounded-lg bg-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors border-0 cursor-pointer shadow-sm active:scale-95"
                            title="기록 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* 채팅 메시지 리스트 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex items-start gap-3.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    
                    {/* AI 프로필 사진 */}
                    {msg.sender === "ai" && (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {/* 메시지 말풍선 */}
                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed border transition-all ${
                      msg.sender === "user" 
                        ? "bg-gradient-to-tr from-[#ff007f] to-[#7928ca] text-white border-transparent shadow-md shadow-pink-600/10 rounded-tr-none font-medium" 
                        : "bg-slate-100 text-slate-800 border-slate-200/50 rounded-tl-none whitespace-pre-line shadow-sm font-medium"
                    }`}>
                      {/* 첨부된 이미지가 있는 경우 렌더링 */}
                      {msg.image && (
                        <div className="mb-2.5 rounded-xl overflow-hidden border border-white/20 shadow-sm max-w-[240px]">
                          <img src={msg.image} alt="Attached Visual Content" className="w-full h-auto object-cover max-h-[160px]" />
                        </div>
                      )}
                      {msg.text}
                      <span className={`block text-[10px] mt-2 text-right ${msg.sender === "user" ? "text-pink-100" : "text-slate-400"}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                  </div>
                ))}

                {/* AI 타이핑 지연 인디케이터 */}
                {isTyping && (
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-md animate-pulse shrink-0">
                      <Bot className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="bg-slate-100 border border-slate-200/50 text-slate-500 rounded-2xl rounded-tl-none px-5 py-3.5 text-xs flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      이지봇이 내역 분석 및 홈페이지를 실시간 빌드 중입니다...
                    </div>
                  </div>
                )}
              </div>

              {/* 이미지 첨부 미리보기 썸네일 바 */}
              {attachedImage && (
                <div className="px-6 py-2 border-t border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0 animate-fade-in">
                  <div className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shadow-sm shrink-0">
                    <img src={attachedImage} alt="Attached Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white text-[9px] font-black flex items-center justify-center border-0 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[10px] font-bold text-slate-600">📸 시각적 디자인 컨셉 분석 대기 중</div>
                    <div className="text-[9px] text-slate-400 truncate">이지봇 AI가 이미지 무드 및 주조색을 추출해 빌더에 녹여냅니다.</div>
                  </div>
                </div>
              )}

              {/* 채팅 입력 전송 폼 */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2 items-end">
                {/* 이미지 파일 첨부 숨겨진 input */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {/* 이미지 첨부 버튼 */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border border-slate-200 hover:border-pink-200 hover:bg-pink-50/30 text-slate-400 hover:text-pink-500 p-3.5 rounded-2xl transition-all shadow-inner shrink-0 cursor-pointer active:scale-95 flex items-center justify-center"
                  style={{ width: "52px", height: "52px" }}
                  title="컨셉 이미지/로고 첨부"
                >
                  <Image className="w-5 h-5" />
                </button>

                <textarea 
                  ref={textareaRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="예: '블랙 골드 테마로 레스토랑 홈페이지를 만들어주고 지도 섹션은 빼줘.'"
                  className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-medium shadow-inner resize-none overflow-y-auto no-scrollbar"
                  style={{ minHeight: "52px", maxHeight: "150px" }}
                />
                <button 
                  type="submit"
                  disabled={(!chatInput.trim() && !attachedImage) || isTyping}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white font-bold px-6 rounded-2xl transition-all shadow-md active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:scale-100 flex items-center justify-center gap-1.5 cursor-pointer border-0 shrink-0"
                  style={{ height: "52px" }}
                >
                  <Send className="w-4.5 h-4.5" />
                  <span>전송</span>
                </button>
              </form>

            </div>
          ) : (
            // ================== 수동 정밀 조작 탭 ==================
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              
              {/* 기본 핵심 정보 편집 */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-pink-600 tracking-wider uppercase border-b border-slate-100 pb-2">1. 대표 브랜드 타이틀 및 메인 소개</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">상호/사이트 타이틀 *</label>
                    <input 
                      type="text" 
                      value={config.title}
                      onChange={(e) => setConfig({...config, title: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-pink-500 transition-all font-bold shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">한줄 서브타이틀 *</label>
                    <input 
                      type="text" 
                      value={config.subtitle}
                      onChange={(e) => setConfig({...config, subtitle: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-pink-500 transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">자세한 서비스/비즈니스 설명 *</label>
                  <textarea 
                    value={config.aboutText}
                    onChange={(e) => setConfig({...config, aboutText: e.target.value})}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-pink-500 transition-all leading-relaxed whitespace-pre-line shadow-inner"
                  />
                </div>
              </div>

              {/* 디자인 스킨 및 테마 색상 선택 */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-pink-600 tracking-wider uppercase border-b border-slate-100 pb-2">2. 비주얼 테마 & 스킨 스타일</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: "gradient", name: "비비드 그라디언트" },
                    { id: "minimal", name: "미니멀리즘 화이트" },
                    { id: "dark", name: "네온 다크모드" },
                    { id: "glass", name: "글래스모피즘 아크릴" }
                  ].map((skin) => (
                    <button
                      key={skin.id}
                      onClick={() => setConfig({...config, theme: skin.id as any})}
                      className={`py-3 px-4 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        config.theme === skin.id 
                          ? "bg-gradient-to-r from-pink-500 to-purple-600 border-transparent text-white shadow-md font-black" 
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      {skin.name}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">시그니처 포인트 컬러 테마</label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { id: "indigo", bg: "bg-indigo-600", text: "로얄블루" },
                      { id: "emerald", bg: "bg-emerald-600", text: "에메랄드" },
                      { id: "rose", bg: "bg-rose-600", text: "로즈레드" },
                      { id: "amber", bg: "bg-amber-500", text: "골드옐로우" },
                      { id: "violet", bg: "bg-violet-600", text: "바이올렛" },
                      { id: "cyan", bg: "bg-cyan-500", text: "아쿠아시안" },
                      { id: "slate", bg: "bg-slate-600", text: "차콜그레이" }
                    ].map((col) => (
                      <button
                        key={col.id}
                        onClick={() => setConfig({...config, primaryColor: col.id as any})}
                        className={`flex items-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          config.primaryColor === col.id 
                            ? "border-pink-500 bg-pink-50 text-pink-700 font-extrabold shadow-sm" 
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:border-slate-300"
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${col.bg}`} />
                        {col.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 디바이스 내부 노출 섹션 온오프 토글 */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-pink-600 tracking-wider uppercase border-b border-slate-100 pb-2">3. 홈페이지 구성 섹션 노출 토글</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: "hero", label: "메인 인트로 배너" },
                    { key: "about", label: "상세 소개글" },
                    { key: "products", label: "상품/메뉴 쇼케이스" },
                    { key: "booking", label: "간편 실시간 예약 폼" },
                    { key: "map", label: "오시는길 지도 (네이버)" },
                    { key: "contact", label: "푸터 연락처 정보" }
                  ].map((sec) => (
                    <label 
                      key={sec.key} 
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        config.sections[sec.key as keyof typeof config.sections] 
                          ? "bg-pink-50/40 border-pink-500/50 text-pink-700 font-extrabold shadow-sm" 
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-xs">{sec.label}</span>
                      <input 
                        type="checkbox"
                        checked={config.sections[sec.key as keyof typeof config.sections]}
                        onChange={(e) => {
                          const secs = { ...config.sections, [sec.key]: e.target.checked };
                          setConfig({ ...config, sections: secs });
                        }}
                        className="rounded bg-white border-slate-300 text-pink-600 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 매장/상호 연락처 및 지도 주소 */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-pink-600 tracking-wider uppercase border-b border-slate-100 pb-2">4. 오프라인 위치 및 연락처 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">문의처 대표번호 *</label>
                    <input 
                      type="text" 
                      value={config.contactPhone}
                      onChange={(e) => setConfig({...config, contactPhone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-pink-500 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">오시는 길 주소지 *</label>
                    <input 
                      type="text" 
                      value={config.address}
                      onChange={(e) => setConfig({...config, address: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-pink-500 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* 퀵 셋팅 저장 알림 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2.5">
                  <Info className="w-5 h-5 text-pink-500 shrink-0" />
                  <span className="text-xs text-slate-500 font-medium">수동으로 폼의 항목을 수정하는 즉시 모바일 라이브 폰 화면에 레이아웃이 주입됩니다.</span>
                </div>
                <button 
                  onClick={() => {
                    localStorage.setItem("egdesk_website_config", JSON.stringify(config));
                    showMobileAlert("success", "💾 변경된 홈페이지 설정이 브라우저 로컬 저장소에 완벽히 동기화 및 저장되었습니다!");
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white text-xs font-extrabold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1 shadow-md active:scale-95 shrink-0 border-0 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> 저장하기
                </button>
              </div>

            </div>
          )}

        </div>

        {/* ==================================================== */}
        {/* 우측 영역 (Col 5) : 스마트폰 디바이스 프레임 (Live Preview) */}
        {/* ==================================================== */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative z-10">
          
          {/* 럭셔리 스마트폰 베젤 실버/크롬 리모델링 */}
          <div className="relative flex flex-col shrink-0 animate-scale-up" style={{ 
            width: "416px", 
            height: "840px", 
            backgroundColor: "#0f172a", 
            border: "12px solid #1e293b", 
            borderRadius: "56px",
            padding: "12px",
            boxShadow: "0 35px 80px -15px rgba(0,0,0,0.3), inset 0 0 0 2px rgba(255,255,255,0.15), 0 0 30px rgba(0,0,0,0.1)",
          }}>
            
            {/* 좌측 볼륨 조절 버튼 모형 */}
            <div className="absolute w-[4px] h-[40px] bg-slate-700 rounded-l-md" style={{ left: "-16px", top: "144px", border: "1px solid #1e293b", borderRight: "none" }} />
            <div className="absolute w-[4px] h-[40px] bg-slate-700 rounded-l-md" style={{ left: "-16px", top: "192px", border: "1px solid #1e293b", borderRight: "none" }} />
            
            {/* 우측 전원 버튼 모형 */}
            <div className="absolute w-[4px] h-[60px] bg-slate-700 rounded-r-md" style={{ right: "-16px", top: "168px", border: "1px solid #1e293b", borderLeft: "none" }} />

            {/* 폰 상단 가상 다이내믹 아일랜드 펀치홀 */}
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-center shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-950/80 border border-slate-800/20 mr-2 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-blue-900/60" />
              </div>
              <div className="w-12 h-1 bg-slate-950/80 rounded-full" />
            </div>

            {/* 폰 액정 내부 영역 */}
            <div className="flex-1 bg-white overflow-hidden flex flex-col relative select-none text-slate-800 text-left font-sans shadow-2xl" style={{ borderRadius: "42px" }}>
              
              {/* 모바일 최상단 가상 네비게이션 헤더 */}
              <div className="bg-slate-950 text-white pt-7 pb-3.5 px-6 flex items-center justify-between shrink-0 select-none">
                <span className="text-[11px] font-bold tracking-tight text-slate-200">EGDESK Live Preview</span>
                <span className="text-[9px] font-extrabold tracking-wide uppercase px-2.5 py-0.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full">
                  {config.mode === "store" ? "미니 스토어" : config.mode === "cms" ? "브랜드 홍보" : "웰컴 랜딩"}
                </span>
              </div>

              {/* ==================== 폰 내부 실제 뷰포트 스크롤 바디 ==================== */}
              <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 relative flex flex-col">
                
                {/* 가상 알럿 노출 */}
                {alertMessage && (
                  <div className={`absolute top-4 left-4 right-4 z-[999] p-3 rounded-2xl shadow-xl flex items-center gap-2 border text-xs font-bold animate-slide-in backdrop-blur-md ${
                    alertMessage.type === "success" 
                      ? "bg-emerald-500/90 text-white border-emerald-400" 
                      : alertMessage.type === "error" 
                        ? "bg-rose-500/90 text-white border-rose-400" 
                        : "bg-[#7928ca]/95 text-white border-purple-400"
                  }`}>
                    {alertMessage.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{alertMessage.text}</span>
                  </div>
                )}

                {/* 테마 배경 및 가독성 대비 강화 패치 */}
                <div className={`flex-1 flex flex-col relative transition-all ${
                  config.theme === "dark" 
                    ? "bg-slate-900 text-slate-100" 
                    : config.theme === "gradient"
                      ? `bg-gradient-to-b from-slate-900 via-${config.primaryColor === "indigo" ? "indigo" : config.primaryColor}-950 to-slate-950 text-slate-100`
                      : config.theme === "glass"
                        ? "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800"
                        : "bg-white text-slate-900"
                }`}>

                  {/* 1. Hero 인트로 배너 섹션 */}
                  {config.sections.hero && (
                    <div className={`relative px-5 pt-8 pb-10 text-center border-b ${
                      config.theme === "dark" ? "border-slate-800 bg-slate-950/40" : 
                      config.theme === "gradient" ? "border-slate-800/40 bg-black/20" : 
                      config.theme === "glass" ? "border-slate-200 bg-white/50 backdrop-blur-sm shadow-inner" : "border-slate-100 bg-slate-50"
                    }`}>
                      {/* 장식용 아이콘 원 */}
                      <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transition-transform ${
                        config.primaryColor === "indigo" ? "bg-indigo-600 text-white" :
                        config.primaryColor === "emerald" ? "bg-emerald-600 text-white" :
                        config.primaryColor === "rose" ? "bg-rose-600 text-white" :
                        config.primaryColor === "amber" ? "bg-amber-500 text-slate-900" :
                        config.primaryColor === "violet" ? "bg-violet-600 text-white" :
                        config.primaryColor === "cyan" ? "bg-cyan-500 text-slate-900" : "bg-slate-800 text-white"
                      }`}>
                        {config.mode === "store" ? <ShoppingBag className="w-7 h-7" /> : 
                         config.mode === "cms" ? <Star className="w-7 h-7" /> : <Flame className="w-7 h-7" />}
                      </div>

                      <h2 className={`text-xl font-extrabold tracking-tight mb-2.5 ${
                        config.theme === "dark" || config.theme === "gradient" ? "text-white" : "text-slate-900"
                      }`}>{config.title}</h2>
                      <p className={`text-xs leading-relaxed max-w-[240px] mx-auto font-medium ${
                        config.theme === "dark" || config.theme === "gradient" ? "text-slate-300" : "text-slate-600"
                      }`}>{config.subtitle}</p>
                    </div>
                  )}

                  {/* 2. 회사/비즈니스 소개 섹션 */}
                  {config.sections.about && (
                    <div className="px-5 py-6">
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className={`w-1 h-3.5 rounded ${
                          config.primaryColor === "indigo" ? "bg-indigo-600" :
                          config.primaryColor === "emerald" ? "bg-emerald-600" :
                          config.primaryColor === "rose" ? "bg-rose-600" :
                          config.primaryColor === "amber" ? "bg-amber-500" :
                          config.primaryColor === "violet" ? "bg-violet-600" :
                          config.primaryColor === "cyan" ? "bg-cyan-500" : "bg-slate-600"
                        }`} />
                        <h3 className={`text-xs font-black tracking-wider uppercase ${
                          config.theme === "dark" || config.theme === "gradient" ? "text-slate-300" : "text-slate-700"
                        }`}>비즈니스 소개</h3>
                      </div>
                      <p className={`text-[11px] leading-relaxed whitespace-pre-line text-justify ${
                        config.theme === "dark" || config.theme === "gradient" ? "text-slate-300" : "text-slate-600 font-medium"
                      }`}>{config.aboutText}</p>
                    </div>
                  )}

                  {/* 3-A. 모바일 랜딩 전용 쿠폰 받기 섹션 (Landing 모드 전용) */}
                  {config.mode === "landing" && (
                    <div className="px-5 py-4">
                      <div className={`p-4 rounded-3xl border-2 border-dashed relative overflow-hidden transition-all text-center ${
                        couponDownloaded 
                          ? "bg-slate-900/50 border-slate-800 text-slate-500" 
                          : config.primaryColor === "indigo" ? "bg-indigo-950/20 border-indigo-500/50 text-indigo-300" :
                            config.primaryColor === "emerald" ? "bg-emerald-950/20 border-emerald-500/50 text-emerald-300" :
                            config.primaryColor === "rose" ? "bg-rose-950/20 border-rose-500/50 text-rose-300" :
                            config.primaryColor === "amber" ? "bg-amber-950/20 border-amber-500/50 text-amber-300" :
                            config.primaryColor === "violet" ? "bg-violet-950/20 border-violet-500/50 text-violet-300" :
                            config.primaryColor === "cyan" ? "bg-cyan-950/20 border-cyan-500/50 text-cyan-300" : "bg-slate-900/40 border-slate-700 text-slate-300"
                      }`}>
                        
                        <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-slate-900/20" />
                        <h4 className="text-xs font-black tracking-wider uppercase opacity-80 mb-1.5">★ OPEN WELCOME COUPON ★</h4>
                        <div className={`text-2xl font-black mb-3 tracking-tight ${
                          couponDownloaded ? "text-slate-600 line-through" : "text-slate-900 dark:text-white"
                        }`}>전 품목 40% 즉시할인</div>
                        
                        <p className="text-[10px] opacity-70 mb-4 font-bold">오픈 축하 감사 기념 선착순 발급 중</p>
                        
                        <button
                          onClick={handleDownloadCoupon}
                          className={`w-full py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shadow-md border-0 cursor-pointer ${
                            couponDownloaded 
                              ? "bg-slate-800 text-slate-600 cursor-not-allowed shadow-none border border-slate-900"
                              : config.primaryColor === "indigo" ? "bg-indigo-600 hover:bg-indigo-500 text-white" :
                                config.primaryColor === "emerald" ? "bg-emerald-600 hover:bg-emerald-500 text-white" :
                                config.primaryColor === "rose" ? "bg-rose-600 hover:bg-rose-500 text-white" :
                                config.primaryColor === "amber" ? "bg-amber-500 hover:bg-amber-400 text-slate-950" :
                                config.primaryColor === "violet" ? "bg-violet-600 hover:bg-violet-500 text-white" :
                                config.primaryColor === "cyan" ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950" : "bg-slate-800 hover:bg-slate-700 text-white"
                          }`}
                        >
                          {couponDownloaded ? "🎟️ 발급 보관 완료" : "⚡ 40% 웰컴 쿠폰 발급받기"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3-B. 상품 쇼케이스 리스트 섹션 (Store/CMS 모드용) */}
                  {config.sections.products && config.products.length > 0 && (
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className={`w-1 h-3.5 rounded ${
                          config.primaryColor === "indigo" ? "bg-indigo-600" :
                          config.primaryColor === "emerald" ? "bg-emerald-600" :
                          config.primaryColor === "rose" ? "bg-rose-600" :
                          config.primaryColor === "amber" ? "bg-amber-500" :
                          config.primaryColor === "violet" ? "bg-violet-600" :
                          config.primaryColor === "cyan" ? "bg-cyan-500" : "bg-slate-600"
                        }`} />
                        <h3 className={`text-xs font-black tracking-wider uppercase ${
                          config.theme === "dark" || config.theme === "gradient" ? "text-slate-300" : "text-slate-700"
                        }`}>대표 상품 & 추천 메뉴</h3>
                      </div>

                      <div className="space-y-3">
                        {config.products.map((prod) => (
                          <div 
                            key={prod.id} 
                            onClick={() => showMobileAlert("info", `🛒 '${prod.name}' 상품 상세 내역 조회가 활성화되었습니다.`)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                              config.theme === "dark" || config.theme === "gradient" 
                                ? "bg-slate-900/60 border-slate-800 hover:bg-slate-900" 
                                : config.theme === "glass" ? "bg-white/70 border-white/80 hover:bg-white/90 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
                            }`}
                          >
                            <div className="w-12 h-12 rounded-xl bg-slate-200/40 shrink-0 flex items-center justify-center text-slate-400">
                              <ShoppingBag className="w-5 h-5 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <h4 className={`text-[11px] font-bold truncate ${
                                  config.theme === "dark" || config.theme === "gradient" ? "text-slate-100" : "text-slate-800"
                                }`}>{prod.name}</h4>
                                <span className={`text-[10px] font-black shrink-0 ${
                                  config.primaryColor === "indigo" ? "text-indigo-600 dark:text-indigo-400" :
                                  config.primaryColor === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
                                  config.primaryColor === "rose" ? "text-rose-600 dark:text-rose-400" :
                                  config.primaryColor === "amber" ? "text-amber-600 dark:text-amber-500" :
                                  config.primaryColor === "violet" ? "text-violet-600 dark:text-violet-400" :
                                  config.primaryColor === "cyan" ? "text-cyan-600 dark:text-cyan-400" : "text-slate-700"
                                }`}>{prod.price}</span>
                              </div>
                              <p className={`text-[9.5px] truncate ${
                                config.theme === "dark" || config.theme === "gradient" ? "text-slate-400" : "text-slate-500 font-medium"
                              }`}>{prod.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. 실시간 예약 폼 섹션 (예약 접수 기능 탑재) */}
                  {config.sections.booking && (
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className={`w-1 h-3.5 rounded ${
                          config.primaryColor === "indigo" ? "bg-indigo-600" :
                          config.primaryColor === "emerald" ? "bg-emerald-600" :
                          config.primaryColor === "rose" ? "bg-rose-600" :
                          config.primaryColor === "amber" ? "bg-amber-500" :
                          config.primaryColor === "violet" ? "bg-violet-600" :
                          config.primaryColor === "cyan" ? "bg-cyan-500" : "bg-slate-600"
                        }`} />
                        <h3 className={`text-xs font-black tracking-wider uppercase ${
                          config.theme === "dark" || config.theme === "gradient" ? "text-slate-300" : "text-slate-700"
                        }`}>간편 실시간 예약 신청</h3>
                      </div>

                      <form onSubmit={handleBookingSubmit} className={`p-4 rounded-2xl border space-y-2.5 ${
                        config.theme === "dark" || config.theme === "gradient" ? "bg-slate-950/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                      }`}>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8.5px] font-bold text-slate-500 mb-0.5">성함</label>
                            <input 
                              type="text" 
                              required
                              value={bookingForm.name}
                              onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                              placeholder="홍길동"
                              className="w-full bg-slate-900/10 border border-slate-300/40 rounded-lg px-2.5 py-1.5 text-[10px] outline-none focus:border-pink-500 text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] font-bold text-slate-500 mb-0.5">연락처</label>
                            <input 
                              type="tel" 
                              required
                              value={bookingForm.phone}
                              onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                              placeholder="010-0000-0000"
                              className="w-full bg-slate-900/10 border border-slate-300/40 rounded-lg px-2.5 py-1.5 text-[10px] outline-none focus:border-pink-500 text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8.5px] font-bold text-slate-500 mb-0.5">예약 날짜</label>
                            <input 
                              type="date" 
                              required
                              value={bookingForm.date}
                              onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                              className="w-full bg-slate-900/10 border border-slate-300/40 rounded-lg px-2.5 py-1.5 text-[10px] outline-none focus:border-pink-500 text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] font-bold text-slate-500 mb-0.5">인원 (선택)</label>
                            <select 
                              value={bookingForm.guests}
                              onChange={(e) => setBookingForm({...bookingForm, guests: e.target.value})}
                              className="w-full bg-slate-900/10 border border-slate-300/40 rounded-lg px-2.5 py-1.5 text-[10px] outline-none focus:border-pink-500 text-slate-800"
                            >
                              <option value="1">1명</option>
                              <option value="2">2명</option>
                              <option value="3">3명</option>
                              <option value="4">4명 이상</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <label className="block text-[8.5px] font-bold text-slate-500 mb-0.5">희망 시간</label>
                            <input 
                              type="time" 
                              required
                              value={bookingForm.time}
                              onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                              className="w-full bg-slate-900/10 border border-slate-300/40 rounded-lg px-2.5 py-1.5 text-[10px] outline-none focus:border-pink-500 text-slate-800"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className={`w-full py-2.5 rounded-xl text-[10.5px] font-extrabold transition-all text-white shadow-md border-0 cursor-pointer ${
                            config.primaryColor === "indigo" ? "bg-indigo-600 hover:bg-indigo-500" :
                            config.primaryColor === "emerald" ? "bg-emerald-600 hover:bg-emerald-500" :
                            config.primaryColor === "rose" ? "bg-rose-600 hover:bg-rose-500" :
                            config.primaryColor === "amber" ? "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black" :
                            config.primaryColor === "violet" ? "bg-violet-600 hover:bg-violet-500" :
                            config.primaryColor === "cyan" ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black" : "bg-slate-800 hover:bg-slate-700"
                          }`}
                        >
                          📅 예약 정보 기입 완료 및 신청
                        </button>
                      </form>
                    </div>
                  )}

                  {/* 5. 오시는 길 네이버 지도 섹션 */}
                  {config.sections.map && (
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className={`w-1 h-3.5 rounded ${
                          config.primaryColor === "indigo" ? "bg-indigo-600" :
                          config.primaryColor === "emerald" ? "bg-emerald-600" :
                          config.primaryColor === "rose" ? "bg-rose-600" :
                          config.primaryColor === "amber" ? "bg-amber-500" :
                          config.primaryColor === "violet" ? "bg-violet-600" :
                          config.primaryColor === "cyan" ? "bg-cyan-500" : "bg-slate-600"
                        }`} />
                        <h3 className={`text-xs font-black tracking-wider uppercase ${
                          config.theme === "dark" || config.theme === "gradient" ? "text-slate-300" : "text-slate-700"
                        }`}>오시는 길 (약도)</h3>
                      </div>

                      <div className={`rounded-2xl border overflow-hidden relative shadow-sm h-36 ${
                        config.theme === "dark" || config.theme === "gradient" ? "bg-slate-950/40 border-slate-800" : "bg-white border-slate-100"
                      }`}>
                        
                        <div className="absolute inset-0 bg-slate-200/50 flex flex-col justify-between p-3 select-none bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:16px_16px]">
                          
                          <div className="absolute top-[40%] left-[45%] flex flex-col items-center animate-bounce">
                            <MapPin className={`w-6 h-6 ${
                              config.primaryColor === "rose" ? "text-rose-600" : "text-indigo-600"
                            }`} />
                            <span className="bg-slate-900/90 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow whitespace-nowrap block mt-0.5">
                              {config.title}
                            </span>
                          </div>

                          <div className="mt-auto flex items-end justify-between w-full relative z-10">
                            <span className="text-[7.5px] text-slate-400 font-extrabold tracking-tight">NAVER Map API</span>
                            <button 
                              onClick={() => showMobileAlert("info", "🗺️ 네이버지도 앱과 연동되어 실제 길찾기 내비게이션으로 진입합니다.")}
                              className="bg-slate-900 text-white text-[8px] px-2 py-1 rounded font-bold hover:bg-slate-800 border-0 cursor-pointer"
                            >
                              네이버 지도열기
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* 6. 회사 하단 정보 (푸터 연락처) */}
                  {config.sections.contact && (
                    <div className={`mt-auto px-5 py-6 text-center text-[10px] border-t ${
                      config.theme === "dark" || config.theme === "gradient" 
                        ? "border-slate-800 text-slate-500 bg-slate-950/20" 
                        : "border-slate-100 text-slate-400 bg-slate-50"
                    }`}>
                      <div className="font-extrabold mb-1.5">{config.title}</div>
                      <div className="flex justify-center items-center gap-1.5 mb-1 text-[9px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{config.contactPhone}</span>
                      </div>
                      <div className="flex justify-center items-center gap-1.5 text-[9px]">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{config.address}</span>
                      </div>
                      <div className="mt-4 text-[8px] opacity-60">
                        © {new Date().getFullYear()} {config.title}. Powered by EGDESK AI Builder
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* 폰 액정 하단 가상 홈 버튼 바 */}
              <div className="h-10 bg-slate-950 flex items-center justify-center shrink-0">
                <div className="w-28 h-1 bg-slate-800 rounded-full" />
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ==================================================== */}
      {/* 하단 퍼블리싱 & 어드민 컨트롤 센터 (단축 URL & QR) */}
      {/* ==================================================== */}
      <div className="mt-8 bg-white border border-slate-100 rounded-3xl p-6 relative z-10 shadow-sm hover:shadow-md transition-all backdrop-blur-md shrink-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 가상 URL 및 QR 코드 제어 패널 */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 border border-slate-200/60 p-5 rounded-3xl shadow-inner w-full">
            
            {/* 좌측 QR 코드 프리뷰 카드 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shrink-0 text-center relative group shadow-sm">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="EGDESK QR Code" 
                  className="w-[100px] h-[100px] rounded-lg transition-transform group-hover:scale-105" 
                />
              ) : (
                <div className="w-[100px] h-[100px] bg-slate-200 rounded-lg flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-slate-400 animate-pulse" />
                </div>
              )}
              <a 
                href={qrCodeDataUrl}
                download={`${config.title}_QR.png`}
                className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-pink-600 hover:text-pink-500 tracking-wider uppercase transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> 다운로드
              </a>
            </div>

            {/* 중간 텍스트 및 단축 URL 정보 */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-200 shadow-sm inline-flex items-center gap-1.5 mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5" /> 제작 및 배포 서버 실시간 활성화됨
              </span>
              <h2 className="text-xl font-extrabold text-slate-800 mb-1.5">
                모바일 단축 URL 및 매장 QR 코드 발급
              </h2>
              <p className="text-slate-500 text-xs leading-relaxed mb-3 font-medium">
                이지데스크가 발급한 가상 주소지입니다. 해당 링크를 QR 코드로 매장 테이블이나 리플렛에 인쇄해 배치하면, 손님이 폰으로 스캔하여 예약을 즉시 등록할 수 있습니다.
              </p>

              {/* 주소 복사란 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-2 overflow-hidden shadow-inner font-medium">
                  <span className="text-xs text-slate-600 font-mono select-all truncate font-medium">
                    {`http://${config.customDomain}`}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-pointer hover:text-slate-600" onClick={() => window.open(`http://${config.customDomain}`, "_blank")} />
                </div>
                <button
                  onClick={() => copyToClipboard(`http://${config.customDomain}`, "link")}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-1 shadow shrink-0 active:scale-95 border-0 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "복사완료" : "주소 복사"}</span>
                </button>
              </div>
            </div>

          </div>

          {/* 우측 웰컴 홍보문자 SMS 마케팅 연동 모듈 */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl w-full flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-bounce" />
                <h3 className="text-xs font-black tracking-wider text-pink-600 uppercase">무료 홍보 문자 연동 키트</h3>
              </div>
              <p className="text-slate-500 text-[10.5px] leading-relaxed mb-3 font-medium">
                방금 빌드한 모바일 홈페이지의 URL과 소개 텍스트를 담아 고객들에게 발송할 수 있는 **마케팅 문자 서식**을 자동 세팅했습니다.
              </p>

              {/* 가상 SMS 텍스트 프리뷰 */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 font-mono text-[9.5px] text-slate-700 leading-relaxed max-h-[85px] overflow-y-auto no-scrollbar mb-4 select-all whitespace-pre-line shadow-sm">
                {`[${config.title}] 웰컴 홈페이지 오픈!🎉
 
안녕하십니까! 저희 ${config.title}의 공식 모바일 사이트가 오픈되어 소식을 전합니다.
 
예약 및 주문 혜택을 손쉽게 만나보세요.
 
▶ 공식 홈페이지 접속하기:
http://${config.customDomain}
 
무료거부 080-8765-4321`}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(`[${config.title}] 웰컴 홈페이지 오픈!🎉\n\n안녕하십니까! 저희 ${config.title}의 공식 모바일 사이트가 오픈되어 소식을 전합니다.\n\n예약 및 주문 혜택을 손쉽게 만나보세요.\n\n▶ 공식 홈페이지 접속하기:\nhttp://${config.customDomain}\n\n무료거부 080-8765-4321`, "sms")}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
              >
                {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSms ? "복사 완료!" : "서식 복사하기"}</span>
              </button>
              <button
                onClick={() => {
                  showMobileAlert("success", "📣 무료 문자 발송 센터로 텍스트를 연동하여 화면을 이동합니다!");
                  setTimeout(() => window.location.href = "/sms", 1000);
                }}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-pink-500/10 cursor-pointer border-0"
              >
                <span>발송하기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
