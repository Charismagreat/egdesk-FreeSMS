import React, { useState, useEffect, useRef } from "react";
import {
  Home, HelpCircle, Handshake, Sparkles, Zap, Plus, Trash2, Camera, Mic, Info, Save,
  Phone, Smartphone, Search, X, Star
} from "lucide-react";

// Mock B2C 스마트 스토어용 상품 데이터
const MOCK_STORE_PRODUCTS = [
  { id: "sp-1", name: "이지 시그니처 블렌드 원두 200g", price: 18000, description: "브라질 스페셜티와 콜롬비아 수프리모를 최적 비율로 혼합하여 다크 초콜릿의 묵직한 바디감과 고소함이 조화로운 대표 원두입니다.", available_methods: "배송,가져가기", main_image_url: "" },
  { id: "sp-2", name: "콜드브루 산뜻 블렌드 500ml", price: 12000, description: "12시간 동안 한 방울씩 정성껏 저온 추출하여 떫은 맛이 전혀 없고 꽃 향기와 산뜻한 아로마가 가득한 시그니처 커피 원액입니다.", available_methods: "배송,가져가기", main_image_url: "" },
  { id: "sp-3", name: "프랑스 고메 버터 수제 스콘", price: 4500, description: "프랑스 AOP 천연 고메 버터를 활용하여 매일 아침 오븐에서 갓 구워낸, 겉은 바삭하고 속은 촉촉함의 정석인 프리미엄 스콘입니다.", available_methods: "가져가기,매장에서", main_image_url: "" },
  { id: "sp-4", name: "이지데스크 3중 진공 텀블러", price: 24000, description: "3중 진공 스테인리스 단열 기술로 최대 24시간 보냉, 12시간 보온 효과를 발휘하는 한정판 프리미엄 이지 텀블러입니다.", available_methods: "배송,가져가기", main_image_url: "" }
];

// Mock 테이블 오더용 메뉴 데이터
const MOCK_TABLE_MENU = [
  { id: "tm-1", name: "아이스 아메리카노", price: 4500, category: "커피", description: "에티오피아 예가체프 싱글 오리진 에스프레소에 시원한 얼음을 더해 산뜻한 산미가 일품인 커피." },
  { id: "tm-2", name: "따뜻한 카페라떼", price: 5000, category: "커피", description: "풍부한 크레마의 에스프레소와 매일우유의 신선한 스팀 밀크가 만나 부드럽고 달콤한 클래식 라떼." },
  { id: "tm-3", name: "바스크 치즈 케이크", price: 6500, category: "디저트", description: "고온에서 그을리듯 구워내어 스모키한 향과 크림치즈의 깊은 풍미가 부드럽게 사르르 녹는 스페인 전통 치즈케이크." },
  { id: "tm-4", name: "벨기에 초코 크루아상", price: 4500, category: "디저트", description: "프랑스 고메 버터 크루아상에 진한 벨기에 다크 초콜릿을 가득 입혀 바삭하고 달콤한 페이스트리." },
  { id: "tm-5", name: "제주 유기농 말차 에이드", price: 5500, category: "논커피", description: "제주 다원에서 재배한 최고급 유기농 말차 가루와 달콤한 천연 탄산수가 만나 청량하고 깔끔한 에이드." },
  { id: "tm-6", name: "자몽 허니 블랙티", price: 5800, category: "논커피", description: "세계 3대 홍차인 실론 티베이스에 상큼하고 달콤한 100% 생자몽 과육 슬라이스와 꿀을 믹스한 고급 블렌드 티." }
];

// Mock 실시간 모바일 예약 서비스 코스 데이터
const MOCK_BOOKING_SERVICES = [
  { id: "bs-1", name: "[R&D 스페셜] 프리미엄 커피 시음 테이스팅 코스", price: 35000, description: "이지데스크 수석 로스터와 바리스타가 엄선한 4종 파인 스페셜티 싱글오리진을 원두별 추출 가이드와 함께 즐기는 60분 프라이빗 코스." },
  { id: "bs-2", name: "[원데이 클래스] 라떼아트 베이직 마스터 클래스", price: 50000, description: "벨벳 밀크 폼 형성 원리부터 하트, 튤립 패턴 디자인까지 바리스타 실무 스킬을 1:1로 밀착 마스터하는 90분 체험 교육 과정." },
  { id: "bs-3", name: "본사 프라이빗 미팅 룸 2시간 대여 (최대 6인)", price: 20000, description: "방음 시설 완비, 대형 4K UHD 모니터 및 빔프로젝터, 화이트보드가 완비되어 모임 및 세미나에 최적화된 아늑한 대관 룸." }
];

// Mock B2B 스마트 견적 자재 품목
const MOCK_ESTIMATE_PRODUCTS = [
  { id: "ep-1", name: "과테말라 안티구아 원두 10kg (B2B)", price: 180000, description: "B2B 도매용 스페셜티 벌크 생두 로스팅 포장 원두로 일정한 풍미와 가성비가 훌륭한 카페 납품 전용 품목입니다." },
  { id: "ep-2", name: "친환경 생분해 종이컵 13온스 (1000개입)", price: 45000, description: "옥수수 전분에서 추출한 친환경 PLA 코팅을 사용하여 180일 내 자연 생분해되는 테이크아웃 친환경 컵." },
  { id: "ep-3", name: "크라프트 4구 종이 캐리어 (500개입)", price: 35000, description: "도톰한 수입 크라프트 재질로 제작되어 내구성이 뛰어난 B2B 카페 포장 필수 자재 캐리어입니다." },
  { id: "ep-4", name: "그룹헤드 오일 세척 파우더 클리너 1kg", price: 28000, description: "에스프레소 커피 머신 전용 무독성 세척 분말로 찌든 에스프레소 오일과 찌꺼기를 원스톱으로 깨끗하게 용해하는 정품 파우더." }
];

// Mock CRM 일반 단골 고객 초기 시드 데이터
const INITIAL_CUSTOMERS = [
  { id: "cust-1", name: "김태희", phone: "010-1234-5678", visits: 12, lastVisit: "2일 전", status: "VIP단골", points: 8500 },
  { id: "cust-2", name: "이병헌", phone: "010-9876-5432", visits: 1, lastVisit: "5일 전", status: "최근가입", points: 1000 },
  { id: "cust-3", name: "전지현", phone: "010-5555-1234", visits: 4, lastVisit: "31일 전", status: "이탈우려", points: 3400 },
  { id: "cust-4", name: "송강호", phone: "010-4444-8888", visits: 24, lastVisit: "오늘", status: "VIP단골", points: 21000 },
  { id: "cust-5", name: "유재석", phone: "010-3333-7777", visits: 2, lastVisit: "4일 전", status: "최근가입", points: 1500 }
];

// Mock B2B 거래처 초기 시드 데이터
const INITIAL_PARTNERS = [
  { id: "partner-1", name: "동양상사", bizNo: "120-81-12345", email: "dy@dongyang.com", type: "VENDOR", performance: 12500000, credit: 50000000 },
  { id: "partner-2", name: "민우푸드", bizNo: "214-86-54321", email: "mw@minwoofood.co.kr", type: "BUYER", performance: 8400000, credit: 30000000 },
  { id: "partner-3", name: "서림물류", bizNo: "105-02-98765", email: "sl@seorim.co.kr", type: "VENDOR", performance: 18900000, credit: 70000000 },
  { id: "partner-4", name: "골든커피", bizNo: "302-15-45678", email: "contact@goldencoffee.com", type: "BUYER", performance: 4500000, credit: 15000000 }
];

// Mock 다중 연락처 명함첩 초기 시드 데이터
const INITIAL_CONTACTS = [
  { id: "contact-1", partnerId: "partner-1", name: "정태우", rank: "대표이사", phone: "010-1111-2222", email: "ceo@dongyang.com", isPrimary: true },
  { id: "contact-2", partnerId: "partner-1", name: "김민재", rank: "구매부 과장", phone: "010-2222-3333", email: "mj.kim@dongyang.com", isPrimary: false },
  { id: "contact-3", partnerId: "partner-2", name: "한민우", rank: "대표이사", phone: "010-4444-5555", email: "mw.han@minwoofood.co.kr", isPrimary: true },
  { id: "contact-4", partnerId: "partner-3", name: "이서림", rank: "대표이사", phone: "010-7777-8888", email: "ceo@seorim.co.kr", isPrimary: true },
  { id: "contact-5", partnerId: "partner-4", name: "최아름", rank: "점장", phone: "010-9999-0000", email: "ar.choi@goldencoffee.com", isPrimary: true }
];

// Mock FAQ 리스트
const FAQ_DATABASE = [
  { id: "faq-1", question: "데모 버전의 데이터는 안전하게 보관되나요?", answer: "본 데모 페이지는 어떠한 외부 데이터베이스 서버와도 물리적으로 차단되어 있으며, 사장님이 수정한 모든 모의 데이터는 오직 사용 중인 웹 브라우저 임시 스토리지(localStorage)에만 안전하게 고립 보존됩니다. 브라우저를 지우거나 초기화하시면 다시 깨끗한 시드 상태로 복구됩니다." },
  { id: "faq-2", question: "AI OCR 스캔 및 1:N 이중 명함첩 트랜잭션이 무엇인가요?", answer: "영업 현장 혹은 모바일에서 명함 사진을 스냅했을 때, 백엔드 AI가 기업 존재 여부를 스캔합니다. 데이터베이스에 없는 기업이면 B2B 거래처를 즉시 신설하고 대표 담당자로 자동 가입시키며, 이미 존재하는 기업이면 기존 기업 하위의 명함 담당자로 다중(1:N) 자동 적재하여 인맥을 유기적으로 누적 보관하는 최신 정규화 기술입니다." },
  { id: "faq-3", question: "PC 관제 탑 즉석 AI 스냅 입력 위젯은 어떻게 사용하나요?", answer: "본사 대시보드 PC 화면에서 활성 영업 태스크의 상세 팝업을 열면, 우측 하단에서 컴퓨터 내부의 문서 파일(사진, PDF, 미디어 오디오)을 즉석 드래그 앤 드롭으로 첨부하고 텍스트와 함께 Ctrl + Enter 로 기안하여 즉각적인 가상 AI 스냅을 분석 및 기안하는 강력한 모듈입니다." },
  { id: "faq-4", question: "B2B 신규 거래처 등록이나 수주 확정 시 바이어에게 안내 문자를 자동으로 보낼 수 있나요?", answer: "[자동 발송 설정] 메뉴에서 새로 추가된 B2B & SCM 자동 발송 이벤트 3종(B2B 신규 거래처 온보딩 시, B2B 견적 요청 접수 시, B2B 수주 확정 시)을 켜고 전송할 템플릿을 연결해 두시면 됩니다. 템플릿 작성 시 B2B 특화 변수인 {상호명}, {담당자명}, {금액}, {수주번호} 등을 활용하시면, 각 이벤트 발생 순간에 바이어의 실시간 거래 정보가 자동으로 매핑되어 세련되고 품격 있는 안내 문자가 즉시 백그라운드에서 발송됩니다." }
];

// Mock 날씨 연동 자율 마케팅 기획 원고 데이터
const WEATHER_MARKETING: Record<string, any> = {
  rain: {
    title: "비 오는 날, 따뜻한 위로의 감성 패키지",
    target: "이탈 위험 단골 고객 (최근 30일 미방문자)",
    sms: "[이지데스크] 창밖의 빗소리가 감성을 더하는 오늘, {이름}님께 따뜻한 안부를 전합니다. 마음까지 녹여줄 감성 음료와 10% 특별 할인 쿠폰을 선물로 준비했습니다. 빗길 조심하시고 편안한 하루 되세요! ☔",
    blog: "제목: 비 오는 오후, 빗소리와 함께 머물고 싶은 나만의 힐링 성지 ☕\n\n본문: 촉촉하게 내리는 봄비와 어울리는 분위기 맛집 매장을 소개합니다. 빗소리를 배경음악 삼아 정성껏 내린 따뜻한 시그니처 블렌딩 에스프레소를 즐겨보세요. 오늘은 비 오는 날 전용 한정 할인 혜택도 제공 중입니다...",
    insta: "구도: 창가에 흘러내리는 빗방울을 아웃포커싱하고, 김이 모락모락 나는 따뜻한 컵을 전면에 배치하여 아늑하고 은은한 감성을 강조합니다. 📸\n캡션: 촉촉한 오늘 같은 날, 마음을 데워줄 따뜻한 라떼 한 잔 어떠세요? 비 오는 날만의 특별한 10% 혜택도 놓치지 마세요. #비오는날 #감성라떼 #매장이야기"
  },
  sunny: {
    title: "맑고 푸른 주말, 시원하고 활기찬 주말 패키지",
    target: "VIP 단골 고객 (방문 5회 이상 충성고객)",
    sms: "[이지데스크] 햇살이 눈부시게 맑은 주말, 늘 감사한 {이름} VIP 고객님을 위해 상큼하고 시원한 시그니처 쿨 에이드를 0원에 즐길 수 있는 무료 교환권을 준비했습니다. 기분 좋은 주말 매장에서 만나요! ☀️",
    blog: "제목: 주말 나들이 명소! 햇살 가득한 오후, 입안 가득 퍼지는 상큼함 가이드 🍹\n\n본문: 눈부신 햇살이 마음을 설레게 하는 이번 주말, 소중한 사람들과 함께 방문하기 딱 좋은 매장 메뉴를 엄선해 소개합니다. 100% 생과일을 착즙하여 머리끝까지 시원해지는 아이스 프레시 칵테일 에이드는 오늘의 필수 코스입니다...",
    insta: "구도: 밝은 자연광 아래 화사한 색감의 시원한 음료 and 디저트를 하이앵글로 촬영하여 청량함과 활기를 극대화합니다. ☀️\n캡션: 맑고 투명한 오늘 날씨에 딱 어울리는 시원한 에이드 한 잔! 사장님이 VIP 단골분들을 위해 무료 쿠폰 쏜대요! 어서 오세요! #주말나들이 #청량음료 #단골혜택"
  },
  cloudy: {
    title: "나른하고 흐린 날, 에너지를 가득 채울 활력 충전",
    target: "신규 가입 고객 (최근 7일 내 가입자)",
    sms: "[이지데스크] 나른하고 흐린 오후, {이름}님의 첫 걸음을 축하합니다! 흐린 하늘을 환하게 밝혀줄 신규 회원 웰컴 쿠폰이 발행되었습니다. 첫 적립과 함께 기분 좋은 에너지를 충전해가세요! ⛅",
    blog: "제목: 나른한 오후를 깨우는 마법! 첫 걸음 신규 단골들을 위한 웰컴 시크릿 노트 🌟\n\n본문: 하늘이 흐려 나른해지기 쉬운 오늘, 매장을 처음 찾아주신 신규 단골분들을 위해 준비한 특급 가이드를 오픈합니다. 찌뿌둥한 하루를 즉각 깨워줄 강렬한 단맛의 프리미엄 쇼콜라 와플과 시원한 콜드브루 콜라보 조합을 느껴보세요...",
    insta: "구도: 은은하고 묵직한 조명 아래서 쇼콜라 디저트를 근접 촬영하여 초콜릿의 부드럽고 진한 질감을 극대화해 감성을 자극합니다. 📸\n캡션: 나른한 오후를 깨워줄 달콤한 마법! 신규 단골분들을 위한 웰컴 혜택과 함께 오늘을 달콤하게 충전해보세요. #나른한오후 #달콤한충전 #첫걸음환영"
  }
};

export default function App() {
  // 활성 탭 및 상태 관리
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [partners, setPartners] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [automationRules, setAutomationRules] = useState<Record<string, any>>({});
  const [customers, setCustomers] = useState<any[]>([]);

  // 가상 모바일 채널 시뮬레이션 상태
  const [mobileActiveView, setMobileActiveView] = useState<string>("store");
  const [mobileSearchTerms, setMobileSearchTerms] = useState<Record<string, string>>({
    store: "",
    table: "",
    booking: "",
    capture: "",
    estimate: ""
  });
  const [tableActiveCategory, setTableActiveCategory] = useState<string>("전체");

  // 모바일 주문/예약/캡처 폼 제어 상태
  const [selectedStoreProduct, setSelectedStoreProduct] = useState<any>(null);
  const [storeOrderForm, setStoreOrderForm] = useState({ name: "", phone: "", quantity: 1, method: "배송", address: "", memo: "" });
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState<boolean>(false);
  const [captureForm, setCaptureForm] = useState({ name: "", phone: "", product: "이지 시그니처 블렌드 원두 200g", quantity: 1, memo: "" });
  const [selectedBookingService, setSelectedBookingService] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({ name: "", phone: "", date: "2026-05-25", time: "14:00" });
  const [estimateQuantities, setEstimateQuantities] = useState<Record<string, number>>({ "ep-1": 1, "ep-2": 0, "ep-3": 0, "ep-4": 0 });
  const [estimateForm, setEstimateForm] = useState({ company: "골든커피", name: "최아름", email: "ar.choi@goldencoffee.com" });

  // 가상 AI 트리거 및 로딩 상태
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [selectedWeather, setSelectedWeather] = useState<string>("sunny");
  const [isWeatherPlanning, setIsWeatherPlanning] = useState<boolean>(false);
  const [weatherPlan, setWeatherPlan] = useState<any>(WEATHER_MARKETING.sunny);

  // 가상 타임라인 / 감사록 상태
  const [auditLogs, setAuditLogs] = useState<any[]>([
    { id: 1, type: "system", text: "SQLite 가상 DB 커넥터 및 로컬스토리지 동기화 완수.", time: "방금 전" },
    { id: 2, type: "collab", text: "R&D부서: '신제품 에스프레소 배합 비율 도출' 태스크 활성화.", time: "10분 전" }
  ]);

  // PC 즉석 스냅 위젯 입력창 상태
  const [pcSnapText, setPcSnapText] = useState<string>("");
  const [pcSnapFile, setPcSnapFile] = useState<string>("");
  const [pcSnapFileType, setPcSnapFileType] = useState<string>("none");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 컴포넌트 마운트 시 localStorage 데이터 Seeding 및 로딩
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPartners = localStorage.getItem("easydesk_demo_partners");
      const storedContacts = localStorage.getItem("easydesk_demo_contacts");
      const storedRules = localStorage.getItem("easydesk_demo_rules");
      const storedTasks = localStorage.getItem("easydesk_demo_tasks");
      const storedCustomers = localStorage.getItem("easydesk_demo_customers");

      if (storedPartners) {
        setPartners(JSON.parse(storedPartners));
      } else {
        localStorage.setItem("easydesk_demo_partners", JSON.stringify(INITIAL_PARTNERS));
        setPartners(INITIAL_PARTNERS);
      }

      if (storedContacts) {
        setContacts(JSON.parse(storedContacts));
      } else {
        localStorage.setItem("easydesk_demo_contacts", JSON.stringify(INITIAL_CONTACTS));
        setContacts(INITIAL_CONTACTS);
      }

      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers));
      } else {
        localStorage.setItem("easydesk_demo_customers", JSON.stringify(INITIAL_CUSTOMERS));
        setCustomers(INITIAL_CUSTOMERS);
      }

      if (storedRules) {
        setAutomationRules(JSON.parse(storedRules));
      } else {
        const defaultRules = {
          customer_registered: { enabled: true, templateId: 1 },
          sales_order_confirmed: { enabled: true, templateId: 2 },
          b2b_partner_registered: { enabled: false, templateId: null },
          estimate_received: { enabled: false, templateId: null }
        };
        localStorage.setItem("easydesk_demo_rules", JSON.stringify(defaultRules));
        setAutomationRules(defaultRules);
      }

      const defaultTasks = [
        { id: "task-a", title: "민우푸드 여름 시즌 원두 공급 계약", dept: "영업", partnerId: "partner-2", status: "ACTIVE", desc: "민우푸드 2026 하절기 브라질 스페셜티 원두 200kg 납품 건에 대한 단가 매칭 협의 중" },
        { id: "task-b", title: "차세대 골드 브루 에센스 배합 도출", dept: "연구개발", partnerId: "partner-4", status: "ACTIVE", desc: "AI 스냅 오디오를 바탕으로 신규 로스팅 추출 수율 24.5% 기준 감사록 배합 수립 예정" },
        { id: "task-c", title: "동양상사 정기 설비 부품 입고 검수", dept: "품질관리", partnerId: "partner-1", status: "COMPLETED", desc: "자재 실물 50세트 완벽 입고 및 inventory_items 재고 자동 가산 반영 완료" }
      ];
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        localStorage.setItem("easydesk_demo_tasks", JSON.stringify(defaultTasks));
        setTasks(defaultTasks);
      }
    }
  }, []);

  // 2. 가상 데이터 갱신 헬퍼
  const savePartners = (newPartners: any[]) => {
    setPartners(newPartners);
    localStorage.setItem("easydesk_demo_partners", JSON.stringify(newPartners));
  };

  const saveContacts = (newContacts: any[]) => {
    setContacts(newContacts);
    localStorage.setItem("easydesk_demo_contacts", JSON.stringify(newContacts));
  };

  const saveCustomers = (newCustomers: any[]) => {
    setCustomers(newCustomers);
    localStorage.setItem("easydesk_demo_customers", JSON.stringify(newCustomers));
  };

  const saveRules = (newRules: Record<string, any>) => {
    setAutomationRules(newRules);
    localStorage.setItem("easydesk_demo_rules", JSON.stringify(newRules));
  };

  // 3. 신규 거래처 & 명함 등록 1:N 이중 분기 모의 시뮬레이터 (AI OCR 수신)
  const triggerAiOcrOnboarding = () => {
    setIsAiScanning(true);
    
    // 3초 가상 AI 파싱 딜레이 구동
    setTimeout(() => {
      setIsAiScanning(false);
      
      // 모의 파싱 결과물
      const sampleBizNo = "504-82-" + Math.floor(10000 + Math.random() * 90000);
      const isExist = partners.some(p => p.name === "골든타임 컴퍼니");
      
      if (!isExist) {
        // [분기 1]: 동일 상호명 없을 때 -> crm_partners 신설 + 대표담당자 매핑
        const newPartnerId = "partner-" + Date.now();
        const newPartner = {
          id: newPartnerId,
          name: "골든타임 컴퍼니",
          bizNo: sampleBizNo,
          email: "gt@goldentime.co.kr",
          type: "BUYER",
          performance: 0,
          credit: 20000000
        };
        const newContact = {
          id: "contact-" + Date.now(),
          partnerId: newPartnerId,
          name: "박준우",
          rank: "대표이사",
          phone: "010-8585-9696",
          email: "ceo@goldentime.co.kr",
          isPrimary: true
        };
        
        const updatedPartners = [...partners, newPartner];
        const updatedContacts = [...contacts, newContact];
        
        savePartners(updatedPartners);
        saveContacts(updatedContacts);
        
        setAuditLogs(prev => [
          { id: Date.now(), type: "system", text: `[B2B 온보딩] 신규 거래처 '골든타임 컴퍼니' 개설 및 대표담당자 '박준우 대표' 1:N 동시 적재 완수.`, time: "방금 전" },
          ...prev
        ]);
        alert("🎉 [AI OCR 판독 성공]\n신규 거래처 '골든타임 컴퍼니' 가입 및 대표담당자(박준우 대표이사) 자동 매핑이 1:N 트랜잭션으로 완벽히 적재되었습니다!");
      } else {
        // [분기 2]: 상호명 이미 존재할 때 -> 일반 담당자 추가 적재 (isPrimary = false)
        const targetPartner = partners.find(p => p.name === "골든타임 컴퍼니");
        const newContact = {
          id: "contact-" + Date.now(),
          partnerId: targetPartner.id,
          name: "이지현",
          rank: "구매총괄 팀장",
          phone: "010-3636-4747",
          email: "jh.lee@goldentime.co.kr",
          isPrimary: false
        };
        
        const updatedContacts = [...contacts, newContact];
        saveContacts(updatedContacts);
        
        setAuditLogs(prev => [
          { id: Date.now(), type: "system", text: `[B2B 담당자 추가] '골든타임 컴퍼니' 하위에 새로운 일반 실무자 '이지현 팀장' 다중 명함 매핑 완료.`, time: "방금 전" },
          ...prev
        ]);
        alert("🤝 [AI OCR 판독 성공 - 기존 거래처 식별]\n이미 존재하는 B2B 파트너 '골든타임 컴퍼니'를 파싱하여, 새로운 담당자(이지현 팀장)를 일반 실무진으로 명함첩에 1:N 추가 적재했습니다!");
      }
    }, 2500);
  };

  // 4. 날씨 연동 자율 마케팅 기획 시뮬레이터
  const handleWeatherChange = (weather: string) => {
    setSelectedWeather(weather);
    setIsWeatherPlanning(true);
    
    setTimeout(() => {
      setIsWeatherPlanning(false);
      setWeatherPlan(WEATHER_MARKETING[weather]);
      setAuditLogs(prev => [
        { id: Date.now(), type: "system", text: `AI 오토파일럿: '${weather === 'rain' ? '비' : weather === 'sunny' ? '맑음' : '흐림'}' 날씨 분석 맞춤 전략 기획 완료.`, time: "방금 전" },
        ...prev
      ]);
    }, 1200);
  };

  // 5. 모의 신규 거래처 수동 등록
  const [newPartnerForm, setNewPartnerForm] = useState({ name: "", bizNo: "", email: "", type: "BUYER", credit: 20000000 });
  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerForm.name || !newPartnerForm.bizNo) return alert("상호명과 사업자번호는 필수입니다.");
    
    const newPartner = {
      id: "partner-" + Date.now(),
      name: newPartnerForm.name,
      bizNo: newPartnerForm.bizNo,
      email: newPartnerForm.email || "info@business.com",
      type: newPartnerForm.type,
      performance: 0,
      credit: Number(newPartnerForm.credit)
    };
    
    const updated = [...partners, newPartner];
    savePartners(updated);
    setNewPartnerForm({ name: "", bizNo: "", email: "", type: "BUYER", credit: 20000000 });
    
    setAuditLogs(prev => [
      { id: Date.now(), type: "system", text: `행정: 새로운 거래처 '${newPartner.name}' 수동 등재 완료.`, time: "방금 전" },
      ...prev
    ]);
  };

  // 6. 거래처 삭제
  const handleDeletePartner = (id: string, name: string) => {
    if (!confirm(`'${name}' 거래처를 삭제하시겠습니까? 관련 담당자 명함도 모두 삭제됩니다.`)) return;
    const updatedP = partners.filter(p => p.id !== id);
    const updatedC = contacts.filter(c => c.partnerId !== id);
    savePartners(updatedP);
    saveContacts(updatedC);
  };

  // 7. 자동화 토글
  const handleToggleRule = (key: string) => {
    const updated = {
      ...automationRules,
      [key]: { ...automationRules[key], enabled: !automationRules[key]?.enabled }
    };
    saveRules(updated);
  };

  // 8. PC 즉석 AI 스냅 업로드 위젯 파일 첨부 시뮬레이션
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPcSnapFileType(file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "pdf");
      setPcSnapFile(file.name);
    }
  };

  const handleSendPcSnap = () => {
    if (!pcSnapText.trim() && !pcSnapFile) return alert("스냅 전송할 메모나 파일을 첨부해 주세요.");
    
    const newLogText = `[PC 스마트 스냅 접수완료] ${pcSnapFile ? `📎 ${pcSnapFile} (${pcSnapFileType}) 첨부 | ` : ""}"${pcSnapText.substring(0, 30)}..." ➔ AI 자율 ERP 의사결정 실행 중...`;
    
    setAuditLogs(prev => [
      { id: Date.now(), type: "collab", text: newLogText, time: "방금 전" },
      ...prev
    ]);

    setPcSnapText("");
    setPcSnapFile("");
    setPcSnapFileType("none");
    if (fileInputRef.current) fileInputRef.current.value = "";

    // 가상 AI 비서 피드백
    setTimeout(() => {
      setAuditLogs(prev => [
        { id: Date.now(), type: "system", text: `💡 AI 자율 엔진 피드백: 비정형 데이터 분석 완료 ➔ B2B 파트너 실적 데이터 갱신 및 ERP 감사록 누적 완료.`, time: "방금 전" },
        ...prev
      ]);
    }, 2000);
  };

  // ==================== [NEW] 가상 모바일 뷰 5종 렌더링 헬퍼 함수 ====================
  
  // 1. Store 모바일 뷰 렌더링
  const renderStoreView = () => {
    const storeSearch = mobileSearchTerms.store || "";
    const filteredStore = MOCK_STORE_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(storeSearch.toLowerCase()) || 
      p.description.toLowerCase().includes(storeSearch.toLowerCase())
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "1rem", color: "white" }}>
        {/* 스토어 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.25rem" }}>🛒 이지 스토어</h4>
          <span style={{ fontSize: "0.6rem", color: "var(--primary)" }}>B2C 주문 채널</span>
        </div>

        {/* 상품 검색창 */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "0.4rem 0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="상품명 또는 설명 검색..." 
            value={mobileSearchTerms.store}
            onChange={e => setMobileSearchTerms({...mobileSearchTerms, store: e.target.value})}
            style={{ background: "none", border: "none", color: "white", fontSize: "0.7rem", outline: "none", flex: 1 }}
          />
          {mobileSearchTerms.store && (
            <button onClick={() => setMobileSearchTerms({...mobileSearchTerms, store: ""})} style={{ background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 상품 리스트 */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "2px" }}>
          {filteredStore.map(p => (
            <div key={p.id} onClick={() => { setSelectedStoreProduct(p); setStoreOrderForm({ name: "", phone: "", quantity: 1, method: "배송", address: "", memo: "" }); }} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem", cursor: "pointer" }} className="hover:bg-slate-800/40">
              <h5 style={{ fontSize: "0.8rem", fontWeight: 800 }}>{p.name}</h5>
              <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", lineClamp: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.4 }}>{p.description}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.2rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--primary)" }}>₩ {p.price.toLocaleString()}</span>
                <span style={{ fontSize: "0.55rem", color: "var(--text-sub)" }}>{p.available_methods}</span>
              </div>
            </div>
          ))}
          {filteredStore.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-sub)", fontSize: "0.7rem" }}>
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-bounce" />
              일치하는 상품이 없습니다.<br />다른 키워드로 검색해 보세요.
            </div>
          )}
        </div>

        {/* 스토어 모의 주문 모달 (기기 화면 내부 오버레이) */}
        {selectedStoreProduct && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(10,15,30,0.98)", zIndex: 100, padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)" }}>주문 및 적립 신청</span>
              <button onClick={() => setSelectedStoreProduct(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X className="w-4 h-4" /></button>
            </div>
            <div style={{ fontSize: "0.75rem", fontWeight: 800 }}>{selectedStoreProduct.name}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>단가: ₩ {selectedStoreProduct.price.toLocaleString()}</div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!storeOrderForm.name || !storeOrderForm.phone) return alert("주문자 이름과 연락처는 필수입니다.");
              const total = selectedStoreProduct.price * storeOrderForm.quantity;
              
              setAuditLogs(prev => [
                { id: Date.now(), type: "system", text: `[가상 B2C 주문] 손님 '${storeOrderForm.name}'님이 '${selectedStoreProduct.name}' ${storeOrderForm.quantity}개 주문 완료 (총액: ₩${total.toLocaleString()}). 결제대기 적재 완료.`, time: "방금 전" },
                ...prev
              ]);
              alert(`🎉 [가상 주문 접수 성공]\n데모용 주문이 접수되었습니다! PC 대시보드 감사 실행록에 실시간 반영되었습니다.`);
              setSelectedStoreProduct(null);
            }} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <input type="text" placeholder="주문자 이름" value={storeOrderForm.name} onChange={e=>setStoreOrderForm({...storeOrderForm, name:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem" }} required />
              <input type="text" placeholder="휴대폰 연락처" value={storeOrderForm.phone} onChange={e=>setStoreOrderForm({...storeOrderForm, phone:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem" }} required />
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.7rem" }}>
                <span>수량</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button type="button" onClick={()=>setStoreOrderForm({...storeOrderForm, quantity: Math.max(1, storeOrderForm.quantity-1)})} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>-</button>
                  <span>{storeOrderForm.quantity}</span>
                  <button type="button" onClick={()=>setStoreOrderForm({...storeOrderForm, quantity: storeOrderForm.quantity+1})} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>+</button>
                </div>
              </div>

              <select value={storeOrderForm.method} onChange={e=>setStoreOrderForm({...storeOrderForm, method:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem", background: "#0b0f19" }}>
                <option value="배송">택배 배송 수령</option>
                <option value="가져가기">매장 테이크아웃</option>
                <option value="매장에서">매장 테이블 시식</option>
              </select>

              {storeOrderForm.method === "배송" && (
                <input type="text" placeholder="배송지 상세 주소" value={storeOrderForm.address} onChange={e=>setStoreOrderForm({...storeOrderForm, address:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem" }} required />
              )}

              <input type="text" placeholder="요청 사항 메모" value={storeOrderForm.memo} onChange={e=>setStoreOrderForm({...storeOrderForm, memo:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem" }} />

              <button type="submit" className="btn-neon" style={{ fontSize: "0.75rem", padding: "0.6rem", marginTop: "0.4rem" }}>가상 주문 제출하기</button>
            </form>
          </div>
        )}
      </div>
    );
  };

  // 2. Table Order 모바일 뷰 렌더링
  const renderTableView = () => {
    const tableSearch = mobileSearchTerms.table || "";
    const filteredTable = MOCK_TABLE_MENU.filter(p => {
      const matchesCategory = tableActiveCategory === "전체" || p.category === tableActiveCategory;
      const matchesSearch = p.name.toLowerCase().includes(tableSearch.toLowerCase()) || p.description.toLowerCase().includes(tableSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0.75rem", color: "white" }}>
        {/* 테이블 오더 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.25rem" }}>🍽️ [테이블 3번] 오더</h4>
          <span style={{ fontSize: "0.6rem", color: "var(--emerald)" }}>매장 스마트 오더</span>
        </div>

        {/* 메뉴 검색창 */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "0.4rem 0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="메뉴명 검색..." 
            value={mobileSearchTerms.table}
            onChange={e => setMobileSearchTerms({...mobileSearchTerms, table: e.target.value})}
            style={{ background: "none", border: "none", color: "white", fontSize: "0.7rem", outline: "none", flex: 1 }}
          />
          {mobileSearchTerms.table && (
            <button onClick={() => setMobileSearchTerms({...mobileSearchTerms, table: ""})} style={{ background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 카테고리 수평 탭 */}
        <div style={{ display: "flex", gap: "0.3rem", overflowX: "auto", paddingBottom: "0.2rem", flexShrink: 0 }}>
          {["전체", "커피", "디저트", "논커피"].map(cat => (
            <button 
              key={cat} 
              onClick={() => setTableActiveCategory(cat)}
              style={{ 
                padding: "0.3rem 0.6rem", 
                borderRadius: "8px", 
                border: "none", 
                background: tableActiveCategory === cat ? "var(--primary)" : "rgba(255,255,255,0.05)", 
                color: "white", 
                fontSize: "0.65rem", 
                fontWeight: 700, 
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 메뉴 리스트 */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {filteredTable.map(m => (
            <div key={m.id} onClick={() => {
              if (confirm(`'${m.name}' 메뉴를 즉시 가상 주문 신청하시겠습니까?`)) {
                setAuditLogs(prev => [
                  { id: Date.now(), type: "system", text: `[매장 오더] 3번 테이블에서 '${m.name}' 1개 비대면 주문 완료. 주방 관제에 즉각 전송됨.`, time: "방금 전" },
                  ...prev
                ]);
                alert("🛎️ [테이블 오더 전송 완료]\n주방 어드민 관제판으로 가상 오더가 즉각 전송되었습니다!");
              }
            }} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "0.6rem", display: "flex", flexDirection: "column", gap: "0.25rem", cursor: "pointer" }} className="hover:bg-slate-800/40">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800 }}>{m.name}</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 900, color: "var(--emerald)" }}>₩ {m.price.toLocaleString()}</span>
              </div>
              <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", lineHeight: 1.3 }}>{m.description}</p>
            </div>
          ))}
          {filteredTable.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-sub)", fontSize: "0.7rem" }}>
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-bounce" />
              일치하는 메뉴가 없습니다.
            </div>
          )}
        </div>
      </div>
    );
  };

  // 3. Booking 모바일 뷰 렌더링
  const renderBookingView = () => {
    const bookingSearch = mobileSearchTerms.booking || "";
    const filteredBooking = MOCK_BOOKING_SERVICES.filter(p => 
      p.name.toLowerCase().includes(bookingSearch.toLowerCase()) || 
      p.description.toLowerCase().includes(bookingSearch.toLowerCase())
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0.75rem", color: "white" }}>
        {/* 예약 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.25rem" }}>📅 이지 모바일 예약</h4>
          <span style={{ fontSize: "0.6rem", color: "var(--amber)" }}>B2C 실시간 예약</span>
        </div>

        {/* 예약 서비스 검색창 */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "0.4rem 0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="예약 품목/코스 검색..." 
            value={mobileSearchTerms.booking}
            onChange={e => setMobileSearchTerms({...mobileSearchTerms, booking: e.target.value})}
            style={{ background: "none", border: "none", color: "white", fontSize: "0.7rem", outline: "none", flex: 1 }}
          />
          {mobileSearchTerms.booking && (
            <button onClick={() => setMobileSearchTerms({...mobileSearchTerms, booking: ""})} style={{ background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 예약 서비스 목록 */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {filteredBooking.map(b => (
            <div key={b.id} onClick={() => { setSelectedBookingService(b); setBookingForm({ name: "", phone: "", date: "2026-05-25", time: "14:00" }); }} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "0.65rem", display: "flex", flexDirection: "column", gap: "0.3rem", cursor: "pointer" }} className="hover:bg-slate-800/40">
              <h5 style={{ fontSize: "0.75rem", fontWeight: 800 }}>{b.name}</h5>
              <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", lineClamp: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 }}>{b.description}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.1rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 900, color: "var(--amber)" }}>₩ {b.price.toLocaleString()}</span>
                <span style={{ fontSize: "0.55rem", background: "rgba(255,255,255,0.05)", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>예약하기</span>
              </div>
            </div>
          ))}
          {filteredBooking.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-sub)", fontSize: "0.7rem" }}>
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-bounce" />
              일치하는 예약 품목이 없습니다.
            </div>
          )}
        </div>

        {/* 예약 신청 내부 오버레이 모달 */}
        {selectedBookingService && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(10,15,30,0.98)", zIndex: 100, padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--amber)" }}>실시간 모바일 예약 신청</span>
              <button onClick={() => setSelectedBookingService(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X className="w-4 h-4" /></button>
            </div>
            <div style={{ fontSize: "0.75rem", fontWeight: 800 }}>{selectedBookingService.name}</div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!bookingForm.name || !bookingForm.phone) return alert("예약자명과 연락처를 작성해 주세요.");
              
              setAuditLogs(prev => [
                { id: Date.now(), type: "system", text: `[가상 예약 접수] 예약자 '${bookingForm.name}'님이 '${selectedBookingService.name}'를 ${bookingForm.date} ${bookingForm.time}에 모의 예약 신청했습니다.`, time: "방금 전" },
                ...prev
              ]);
              alert("🗓️ [가상 예약 신청 성공]\n가상 예약이 무사히 접수되었습니다! PC 대시보드 감사 실행록에 반영되었습니다.");
              setSelectedBookingService(null);
            }} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <input type="text" placeholder="예약자 성함" value={bookingForm.name} onChange={e=>setBookingForm({...bookingForm, name:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem" }} required />
              <input type="text" placeholder="연락처 번호" value={bookingForm.phone} onChange={e=>setBookingForm({...bookingForm, phone:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem" }} required />
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>예약 희망 날짜</label>
                <input type="date" value={bookingForm.date} onChange={e=>setBookingForm({...bookingForm, date:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem", color: "white" }} required />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>예약 희망 시간</label>
                <input type="time" value={bookingForm.time} onChange={e=>setBookingForm({...bookingForm, time:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem", color: "white" }} required />
              </div>

              <button type="submit" className="btn-neon btn-emerald" style={{ fontSize: "0.75rem", padding: "0.6rem", marginTop: "0.4rem" }}>가상 예약 제출</button>
            </form>
          </div>
        )}
      </div>
    );
  };

  // 4. Order Capture 모바일 뷰 렌더링 (단골 검색 및 Auto-fill 연동)
  const renderCaptureView = () => {
    const custSearch = mobileSearchTerms.capture || "";
    const filteredCusts = customers.filter(c => 
      c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
      c.phone.replace(/[^0-9]/g, "").includes(custSearch.replace(/[^0-9]/g, ""))
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0.75rem", color: "white" }}>
        {/* 현장 캡처 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.25rem" }}>📸 현장 주문 캡처</h4>
          <span style={{ fontSize: "0.6rem", color: "var(--primary)" }}>CRM 연계 주문 캡처</span>
        </div>

        {/* 수동 주문 작성 폼 */}
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!captureForm.name || !captureForm.phone) return alert("고객 이름과 연락처는 필수입니다.");
          
          setAuditLogs(prev => [
            { id: Date.now(), type: "system", text: `[현장 주문 캡처] 사장님: 단골 손님 '${captureForm.name}'님의 현장 현금/포인트 주문 ('${captureForm.product}' ${captureForm.quantity}개) 즉석 기안 완수.`, time: "방금 전" },
            ...prev
          ]);

          // 가상 포인트 적립 및 방문 횟수 증가 연동
          const matchedCust = customers.find(c => c.name === captureForm.name || c.phone.replace(/[^0-9]/g, "") === captureForm.phone.replace(/[^0-9]/g, ""));
          if (matchedCust) {
            const updated = customers.map(c => {
              if (c.id === matchedCust.id) {
                return { ...c, visits: c.visits + 1, points: c.points + 500 }; // 500p 가상 적립
              }
              return c;
            });
            saveCustomers(updated);
          }

          alert("🎉 [가상 주문 캡처 완료]\n현장 주문이 CRM 단골 관리 데이터와 링킹 적재 완료되었습니다! (해당 단골 고객에게 500p가 가상 적립되었습니다.)");
          setCaptureForm({ name: "", phone: "", product: "이지 시그니처 블렌드 원두 200g", quantity: 1, memo: "" });
        }} style={{ display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1, overflowY: "auto" }}>
          
          {/* 고객명 + 단골검색 돋보기 버튼 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <label style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700 }}>고객명 *</label>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <input type="text" placeholder="홍길동" value={captureForm.name} onChange={e=>setCaptureForm({...captureForm, name:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem", flex: 1 }} required />
              <button 
                type="button" 
                onClick={() => { setIsCaptureModalOpen(true); setMobileSearchTerms({...mobileSearchTerms, capture: ""}); }} 
                style={{ background: "var(--primary)", border: "none", color: "white", padding: "0.5rem", borderRadius: "10px", display: "flex", alignItems: "center", justifyItems: "center", cursor: "pointer" }}
                title="단골고객 검색"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <label style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700 }}>연락처 *</label>
            <input type="text" placeholder="010-1234-5678" value={captureForm.phone} onChange={e=>setCaptureForm({...captureForm, phone:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem" }} required />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <label style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700 }}>현장 접수 상품</label>
            <select value={captureForm.product} onChange={e=>setCaptureForm({...captureForm, product:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem", background: "#0b0f19" }}>
              <option value="이지 시그니처 블렌드 원두 200g">이지 시그니처 블렌드 원두 200g</option>
              <option value="콜드브루 산뜻 블렌드 500ml">콜드브루 산뜻 블렌드 500ml</option>
              <option value="프랑스 고메 버터 수제 스콘">프랑스 고메 버터 수제 스콘</option>
              <option value="이지데스크 3중 진공 텀블러">이지데스크 3중 진공 텀블러</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <label style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>주문 수량</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100px" }}>
              <button type="button" onClick={()=>setCaptureForm({...captureForm, quantity: Math.max(1, captureForm.quantity-1)})} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>-</button>
              <span style={{ fontSize: "0.7rem" }}>{captureForm.quantity}</span>
              <button type="button" onClick={()=>setCaptureForm({...captureForm, quantity: captureForm.quantity+1})} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>+</button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <label style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>주문 비고 메모</label>
            <textarea placeholder="사장님 수동 비고란" value={captureForm.memo} onChange={e=>setCaptureForm({...captureForm, memo:e.target.value})} className="input-field" style={{ fontSize: "0.7rem", padding: "0.5rem", resize: "none", height: "45px" }} />
          </div>

          <button type="submit" className="btn-neon" style={{ fontSize: "0.75rem", padding: "0.6rem", marginTop: "0.25rem", width: "100%" }}>현장 주문 캡처 제출</button>
        </form>

        {/* 단골 고객 조회 팝업 모달 (기기 오버레이) */}
        {isCaptureModalOpen && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(10,15,30,0.98)", zIndex: 100, padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "white" }}>👥 CRM 단골 고객 조회</span>
              <button onClick={() => setIsCaptureModalOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X className="w-4 h-4" /></button>
            </div>

            {/* 실시간 단골 고객 검색창 */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "0.4rem 0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="이름 또는 연락처 검색..." 
                value={mobileSearchTerms.capture}
                onChange={e => setMobileSearchTerms({...mobileSearchTerms, capture: e.target.value})}
                style={{ background: "none", border: "none", color: "white", fontSize: "0.68rem", outline: "none", flex: 1 }}
              />
              {mobileSearchTerms.capture && (
                <button onClick={() => setMobileSearchTerms({...mobileSearchTerms, capture: ""})} style={{ background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer" }}>✕</button>
              )}
            </div>

            {/* 필터링된 단골 고객 리스트 */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {filteredCusts.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => {
                    setCaptureForm({ ...captureForm, name: c.name, phone: c.phone });
                    setIsCaptureModalOpen(false);
                  }}
                  style={{ 
                    background: "rgba(255,255,255,0.02)", 
                    border: "1px solid rgba(255,255,255,0.05)", 
                    borderRadius: "10px", 
                    padding: "0.5rem 0.75rem", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    cursor: "pointer" 
                  }}
                  className="hover:bg-indigo-600/10 hover:border-indigo-500/30"
                >
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800 }}>{c.name}</span>
                    <p style={{ fontSize: "0.6rem", color: "var(--text-sub)", fontFamily: "monospace", marginTop: "0.1rem" }}>{c.phone}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.15rem" }}>
                    <span className="badge badge-emerald" style={{ fontSize: "0.5rem", padding: "0.05rem 0.25rem" }}>{c.status}</span>
                    <span style={{ fontSize: "0.55rem", color: "var(--amber)" }}>{c.points.toLocaleString()}p</span>
                  </div>
                </div>
              ))}
              {filteredCusts.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-sub)", fontSize: "0.65rem" }}>
                  검색된 단골 고객이 없습니다.
                </div>
              )}
            </div>
            
            <div style={{ fontSize: "0.58rem", color: "var(--text-sub)", background: "rgba(255,255,255,0.01)", padding: "0.4rem", borderRadius: "6px" }}>
              💡 <b>테스트 팁:</b> 검색창에 '김' 또는 '송', 혹은 '5678' 등을 타이핑해 보세요. 터치 즉시 폼 필드에 100% <b>자동완성(Auto-fill)</b> 됩니다!
            </div>
          </div>
        )}
      </div>
    );
  };

  // 5. B2B 스마트 견적 요청 모바일 뷰 렌더링
  const renderEstimateView = () => {
    const estimateSearch = mobileSearchTerms.estimate || "";
    const filteredEstimate = MOCK_ESTIMATE_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(estimateSearch.toLowerCase()) || 
      p.description.toLowerCase().includes(estimateSearch.toLowerCase())
    );

    // 견적 예상 합계 연산
    let estimatedTotal = 0;
    MOCK_ESTIMATE_PRODUCTS.forEach(p => {
      const qty = estimateQuantities[p.id] || 0;
      estimatedTotal += p.price * qty;
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0.6rem", color: "white" }}>
        {/* 견적 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.4rem" }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.25rem" }}>📄 B2B 스마트 견적</h4>
          <span style={{ fontSize: "0.6rem", color: "var(--primary)" }}>SCM 바이어 채널</span>
        </div>

        {/* 바이어 폼 필드 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", background: "rgba(0,0,0,0.2)", padding: "0.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem" }}>
            <input type="text" placeholder="회사명 (예: 골든커피)" value={estimateForm.company} onChange={e=>setEstimateForm({...estimateForm, company:e.target.value})} className="input-field" style={{ fontSize: "0.65rem", padding: "0.4rem" }} />
            <input type="text" placeholder="담당자 성함" value={estimateForm.name} onChange={e=>setEstimateForm({...estimateForm, name:e.target.value})} className="input-field" style={{ fontSize: "0.65rem", padding: "0.4rem" }} />
          </div>
          <input type="email" placeholder="세금계산서 수령 이메일" value={estimateForm.email} onChange={e=>setEstimateForm({...estimateForm, email:e.target.value})} className="input-field" style={{ fontSize: "0.65rem", padding: "0.4rem" }} />
        </div>

        {/* B2B 상품 검색창 */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "0.35rem 0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="자재/품명 검색..." 
            value={mobileSearchTerms.estimate}
            onChange={e => setMobileSearchTerms({...mobileSearchTerms, estimate: e.target.value})}
            style={{ background: "none", border: "none", color: "white", fontSize: "0.68rem", outline: "none", flex: 1 }}
          />
          {mobileSearchTerms.estimate && (
            <button onClick={() => setMobileSearchTerms({...mobileSearchTerms, estimate: ""})} style={{ background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer" }}>✕</button>
          )}
        </div>

        {/* B2B 자재 상품 대장 리스트 */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {filteredEstimate.map(ep => {
            const qty = estimateQuantities[ep.id] || 0;
            return (
              <div key={ep.id} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1, paddingRight: "0.5rem" }}>
                  <h6 style={{ fontSize: "0.7rem", fontWeight: 800 }}>{ep.name}</h6>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--primary)", display: "block", marginTop: "0.15rem" }}>₩ {ep.price.toLocaleString()} <span style={{ fontSize: "0.55rem", color: "var(--text-sub)", fontWeight: 500 }}>(도매단가)</span></span>
                </div>
                {/* 수량 조절기 */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <button type="button" onClick={() => setEstimateQuantities({...estimateQuantities, [ep.id]: Math.max(0, qty - 1)})} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", width: "18px", height: "18px", borderRadius: "4px", fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>-</button>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, width: "14px", textAlign: "center" }}>{qty}</span>
                  <button type="button" onClick={() => setEstimateQuantities({...estimateQuantities, [ep.id]: qty + 1})} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", width: "18px", height: "18px", borderRadius: "4px", fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>+</button>
                </div>
              </div>
            );
          })}
          {filteredEstimate.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-sub)", fontSize: "0.65rem" }}>
              일치하는 품목이 없습니다.
            </div>
          )}
        </div>

        {/* 하단 예상 총액 및 제출 */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", fontWeight: 800, marginBottom: "0.4rem" }}>
            <span>예상 견적가 총액</span>
            <span style={{ color: "var(--amber)", fontSize: "0.78rem" }}>₩ {estimatedTotal.toLocaleString()}</span>
          </div>
          <button 
            type="button"
            onClick={() => {
              if (!estimateForm.company || !estimateForm.name) return alert("바이어 회사명과 담당자명을 입력해 주세요.");
              if (estimatedTotal === 0) return alert("최소 1개 이상의 자재 수량을 선택해 주세요.");

              setAuditLogs(prev => [
                { id: Date.now(), type: "system", text: `[B2B SCM 견적접수] 바이어 '${estimateForm.company}' (${estimateForm.name} 담당) ➔ ₩${estimatedTotal.toLocaleString()} 상당의 스마트 견적 요청 접수 완료. 자동 알림 대기 중.`, time: "방금 전" },
                ...prev
              ]);
              alert("🎉 [가상 견적 요청 전송 성공]\n바이어 전용 스마트 견적이 전사 SCM ERP 파이프라인에 안전하게 임시 적재 완료되었습니다!");
              setEstimateQuantities({ "ep-1": 1, "ep-2": 0, "ep-3": 0, "ep-4": 0 });
            }}
            className="btn-neon" 
            style={{ width: "100%", fontSize: "0.7rem", padding: "0.5rem" }}
          >
            모바일 견적 제안 요청
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* 럭셔리 네온 광원 데코 */}
      <div className="aurora-blur-1"></div>
      <div className="aurora-blur-2"></div>

      {/* 1. 사이드바 네비게이션 */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          EGDESK FreeSMS <span>DEMO PORTAL</span>
        </div>
        
        <div className="sidebar-menu">
          <div className={`menu-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
            <Home className="w-4.5 h-4.5" /> 대시보드
          </div>
          <div className={`menu-item ${activeTab === "partners" ? "active" : ""}`} onClick={() => setActiveTab("partners")}>
            <Handshake className="w-4.5 h-4.5" /> 거래처 관리 AI
          </div>
          <div className={`menu-item ${activeTab === "snaptasks" ? "active" : ""}`} onClick={() => setActiveTab("snaptasks")}>
            <Sparkles className="w-4.5 h-4.5" /> AI 스냅태스크
          </div>
          <div className={`menu-item ${activeTab === "automation" ? "active" : ""}`} onClick={() => setActiveTab("automation")}>
            <Zap className="w-4.5 h-4.5" /> 자동 발송 설정
          </div>
          <div className={`menu-item ${activeTab === "mobile" ? "active" : ""}`} onClick={() => setActiveTab("mobile")}>
            <Smartphone className="w-4.5 h-4.5" /> 스마트 모바일 채널
          </div>
          <div className={`menu-item ${activeTab === "help" ? "active" : ""}`} onClick={() => setActiveTab("help")}>
            <HelpCircle className="w-4.5 h-4.5" /> Q&A 헬프센터
          </div>
        </div>

        <div style={{ marginTop: "auto", padding: "1rem 0", borderTop: "1px solid var(--border-color)", fontSize: "0.75rem", color: "var(--text-sub)", fontWeight: 700 }}>
          <p>● DEMO MODE ACTIVE</p>
          <p style={{ marginTop: "0.25rem" }}>SQLite DB 및 SMS 통신 차단</p>
        </div>
      </aside>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="main-content">
        
        {/* ==================== TAB 1: 대시보드 ==================== */}
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className="header-wrapper">
              <h1 className="header-title">
                <Home className="w-7 h-7 text-indigo-500" />
                대시보드
              </h1>
              <p className="header-desc">
                이지데스크 [FreeSMS] 서버 비연결형 정적 시뮬레이터입니다. AI 비서와 가상 B2B 파이프라인의 모든 감성을 무료로 직접 체험해 보세요.
              </p>
            </div>

            {/* AI 오토파일럿 날씨 기획 시뮬레이터 */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    AI 자율 오토파일럿 마케터 (오늘의 날씨 시뮬레이션)
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    오늘의 임의 날씨를 누르면 매장의 실제 SQLite 데이터베이스를 분석하듯 AI 맞춤형 옴니채널 전략이 1초 만에 기획됩니다.
                  </p>
                </div>
                
                {/* 날씨 버튼 */}
                <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
                  <button className={`btn-neon btn-secondary ${selectedWeather === "sunny" ? "btn-emerald" : ""}`} onClick={() => handleWeatherChange("sunny")} style={{ fontSize: "0.75rem", padding: "0.5rem 1rem" }}>
                    ☀️ 맑음
                  </button>
                  <button className={`btn-neon btn-secondary ${selectedWeather === "rain" ? "btn-emerald" : ""}`} onClick={() => handleWeatherChange("rain")} style={{ fontSize: "0.75rem", padding: "0.5rem 1rem" }}>
                    ☔ 비
                  </button>
                  <button className={`btn-neon btn-secondary ${selectedWeather === "cloudy" ? "btn-emerald" : ""}`} onClick={() => handleWeatherChange("cloudy")} style={{ fontSize: "0.75rem", padding: "0.5rem 1rem" }}>
                    ☁️ 흐림
                  </button>
                </div>
              </div>

              {isWeatherPlanning ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem", flexDirection: "column", gap: "1rem" }}>
                  <div className="spinner"></div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>Gemini 2.0 Flash AI 마케터가 옴니채널 전략 및 카피를 작문하는 중...</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
                      <span className="badge badge-primary" style={{ marginBottom: "0.5rem" }}>기획 방향 및 대상 타겟</span>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800 }}>{weatherPlan.title}</h4>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>타겟: {weatherPlan.target}</p>
                    </div>

                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--border-color)", flex: 1 }}>
                      <span className="badge badge-amber" style={{ marginBottom: "0.5rem" }}>초개인화 SMS 문자 발송 카피</span>
                      <p style={{ fontSize: "0.8rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{weatherPlan.sms}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--border-color)", flex: 1 }}>
                      <span className="badge badge-emerald" style={{ marginBottom: "0.5rem" }}>네이버 블로그 SEO 최적화 원고</span>
                      <p style={{ fontSize: "0.8rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{weatherPlan.blog}</p>
                    </div>
                    
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
                      <span className="badge badge-primary" style={{ marginBottom: "0.5rem" }}>인스타그램 촬영 구도 & 해시태그</span>
                      <p style={{ fontSize: "0.8rem", lineHeight: 1.5 }}><strong>{weatherPlan.insta.title}</strong><br/>{weatherPlan.insta.target}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 가상 어드민 실시간 감사 로그 피드 */}
            <div className="glass-card">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem" }}>🪐 AI 자율 감사 실행록 (실시간 피드백)</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "250px", overflowY: "auto" }}>
                {auditLogs.map((log) => (
                  <div key={log.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid var(--border-color)", fontSize: "0.8rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span className={`badge ${log.type === 'system' ? 'badge-primary' : 'badge-emerald'}`}>{log.type}</span>
                      <span style={{ fontWeight: 600 }}>{log.text}</span>
                    </div>
                    <span style={{ marginLeft: "auto", color: "var(--text-sub)", fontSize: "0.7rem" }}>{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: 거래처 관리 AI ==================== */}
        {activeTab === "partners" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className="header-wrapper">
              <h1 className="header-title">
                <Handshake className="w-7 h-7 text-emerald-500" />
                거래처 관리 AI
              </h1>
              <p className="header-desc">
                B2C 개인 고객과 철저히 이원화하여 B2B 기업 파트너(공급처 및 구매처)를 정교하게 1:N으로 누적 보존 관리합니다.
              </p>
            </div>

            {/* B2B 스마트 온보딩 스캔 데모 모듈 */}
            <div className="glass-card" style={{ border: "1px solid var(--emerald-glow)", background: "linear-gradient(to right, rgba(16,185,129,0.02), rgba(0,0,0,0))" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--emerald)" }}>⚡ B2B 명함 스냅 & AI 스마트 온보딩 가상 체험</h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    [AI 이미지 OCR 판독 가동]을 누르면, Gemini가 명함 속 상호명을 조회하여 최초 가입(대표지정 is_primary=1)과 기존 기업 실무자 추가(is_primary=0) 분기 적재를 자동 모의 수행합니다.
                  </p>
                </div>
                
                <button className="btn-neon btn-emerald" onClick={triggerAiOcrOnboarding} disabled={isAiScanning} style={{ marginLeft: "auto" }}>
                  {isAiScanning ? (
                    <>
                      <div className="spinner" style={{ width: "14px", height: "14px" }}></div>
                      <span>명함 이미지 스캔 판독 중...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>모의 명함 AI 스캔 판독 실행</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem" }}>
              {/* 거래처 목록 테이블 */}
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 800 }}>B2B 거래처 마스터 리스트 ({partners.length}개사)</h3>
                
                <div style={{ overflowX: "auto" }}>
                  <table className="demo-table">
                    <thead>
                      <tr>
                        <th>종류</th>
                        <th>상호명</th>
                        <th>사업자번호</th>
                        <th>외상 여신 한도</th>
                        <th>누적 실적</th>
                        <th style={{ textAlign: "center" }}>제어</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partners.map(p => (
                        <tr key={p.id}>
                          <td>
                            <span className={`badge ${p.type === 'VENDOR' ? 'badge-primary' : 'badge-emerald'}`}>
                              {p.type === 'VENDOR' ? '공급' : '구매'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 800, color: "white" }}>{p.name}</td>
                          <td style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{p.bizNo}</td>
                          <td style={{ color: "var(--amber)", fontWeight: 700 }}>₩ {p.credit?.toLocaleString()}</td>
                          <td style={{ fontWeight: 700 }}>₩ {p.performance?.toLocaleString()}</td>
                          <td style={{ textAlign: "center" }}>
                            <button onClick={() => handleDeletePartner(p.id, p.name)} style={{ background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer" }} className="hover:text-rose-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 다중 담당자 연락처 명함첩 (1:N 릴레이션 뷰) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* 신규 등록 폼 */}
                <div className="glass-card">
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1rem" }}>수동 거래처 추가</h3>
                  <form onSubmit={handleAddPartner} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input type="text" placeholder="상호명 (예: 동양상사)" value={newPartnerForm.name} onChange={e=>setNewPartnerForm({...newPartnerForm, name:e.target.value})} className="input-field" required />
                    <input type="text" placeholder="사업자등록번호 (예: 120-81-12345)" value={newPartnerForm.bizNo} onChange={e=>setNewPartnerForm({...newPartnerForm, bizNo:e.target.value})} className="input-field" required />
                    <input type="email" placeholder="이메일 주소" value={newPartnerForm.email} onChange={e=>setNewPartnerForm({...newPartnerForm, email:e.target.value})} className="input-field" />
                    
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <select value={newPartnerForm.type} onChange={e=>setNewPartnerForm({...newPartnerForm, type:e.target.value})} className="input-field" style={{ flex: 1, background: "#0b0f19" }}>
                        <option value="BUYER">구매 바이어 (Buyer)</option>
                        <option value="VENDOR">원부자재 공급처 (Vendor)</option>
                      </select>
                      <input type="number" placeholder="여신한도액" value={newPartnerForm.credit} onChange={e=>setNewPartnerForm({...newPartnerForm, credit:Number(e.target.value)})} className="input-field" style={{ flex: 1 }} />
                    </div>

                    <button type="submit" className="btn-neon" style={{ marginTop: "0.5rem" }}>
                      <Plus className="w-4 h-4" /> 거래처 수동 등록
                    </button>
                  </form>
                </div>

                {/* 다중 명함 리스트 */}
                <div className="glass-card" style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1rem" }}>📇 거래처별 다중 담당자 명함첩 (1:N 연결 상태)</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "350px", overflowY: "auto", paddingRight: "0.25rem" }}>
                    {partners.map(p => {
                      const pContacts = contacts.filter(c => c.partnerId === p.id);
                      return (
                        <div key={p.id} style={{ background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
                          <h4 style={{ fontSize: "0.85rem", fontWeight: 900, color: "var(--text-main)", display: "flex", justifyContent: "space-between" }}>
                            <span>🏢 {p.name}</span>
                            <span style={{ fontSize: "0.65rem", color: "var(--text-sub)", fontWeight: 700 }}>담당자 {pContacts.length}명</span>
                          </h4>
                          
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                            {pContacts.map(c => (
                              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)", fontSize: "0.75rem" }}>
                                <div>
                                  <strong>{c.name}</strong> <span style={{ color: "var(--text-muted)" }}>{c.rank}</span>
                                  <p style={{ fontSize: "0.65rem", color: "var(--text-sub)", marginTop: "0.15rem", fontFamily: "monospace" }}>📞 {c.phone} | ✉️ {c.email}</p>
                                </div>
                                {c.isPrimary && <span className="badge badge-primary" style={{ fontSize: "0.55rem" }}>대표</span>}
                              </div>
                            ))}
                            {pContacts.length === 0 && (
                              <p style={{ fontSize: "0.7rem", color: "var(--text-sub)", fontStyle: "italic" }}>등록된 명함 담당자가 없습니다.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: AI 스냅태스크 ==================== */}
        {activeTab === "snaptasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className="header-wrapper">
              <h1 className="header-title">
                <Sparkles className="w-7 h-7 text-indigo-500" />
                AI 스냅태스크
              </h1>
              <p className="header-desc">
                연구개발(R&D), 품질, 영업 등 현장의 비정형 데이터(사진, 녹취 오디오, PDF)를 PC 대시보드 상세 팝업 하단 위젯으로 즉석 스냅해 분석하는 모듈입니다.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem" }}>
              {/* 활성 태스크 목록 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div className="glass-card">
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1rem" }}>🪐 전사적 협업 태스크 리스트 (영업/R&D/품질/마케팅)</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {tasks.map(t => {
                      const partner = partners.find(p => p.id === t.partnerId);
                      return (
                        <div key={t.id} style={{ background: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: "20px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span className="badge badge-primary">{t.dept}</span>
                              <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "white" }}>{t.title}</h4>
                            </div>
                            <span className={`badge ${t.status === 'COMPLETED' ? 'badge-emerald' : 'badge-amber'}`}>
                              {t.status}
                            </span>
                          </div>
                          
                          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{t.desc}</p>
                          
                          {partner && (
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-sub)", display: "flex", justifyContent: "space-between" }}>
                              <span>🏢 연계사: <b>{partner.name}</b></span>
                              <span>사업자번호: {partner.bizNo}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* PC 즉석 AI 스냅 입력 위젯 (본사 양방향 이식) */}
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", border: "1px solid var(--primary-glow)" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    PC 즉석 AI 스냅 입력 위젯
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    본사 PC 모니터 속 회의 오디오, 상품 스냅 사진, 도면 PDF 파일을 즉시 기입 전송하여 AI 자율 조치를 모의 트리거하세요.
                  </p>
                </div>

                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "1rem", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <textarea 
                    placeholder="이곳에 AI 분석 의뢰할 텍스트 메모나 가짜 분석 지시를 남겨주세요..." 
                    value={pcSnapText}
                    onChange={e=>setPcSnapText(e.target.value)}
                    className="input-field" 
                    style={{ minHeight: "100px", resize: "none", background: "none", border: "none", padding: 0 }}
                  />

                  {pcSnapFile && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "0.5rem 0.75rem", borderRadius: "10px", border: "1px solid var(--border-color)", fontSize: "0.75rem" }}>
                      <span>📎 {pcSnapFile} ({pcSnapFileType})</span>
                      <button onClick={() => { setPcSnapFile(""); setPcSnapFileType("none"); }} style={{ background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer" }}>✕</button>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
                      <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "0.5rem", borderRadius: "8px", cursor: "pointer" }}>
                        <Camera className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "0.5rem", borderRadius: "8px", cursor: "pointer" }}>
                        <Mic className="w-4 h-4 text-indigo-400" />
                      </button>
                    </div>

                    <button onClick={handleSendPcSnap} className="btn-neon" style={{ padding: "0.45rem 1.25rem", fontSize: "0.78rem" }}>
                      <span>AI 스냅 발송</span>
                    </button>
                  </div>
                </div>

                <div style={{ background: "rgba(79, 70, 229, 0.05)", border: "1px dashed var(--primary-glow)", padding: "0.75rem 1rem", borderRadius: "16px", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  💡 <b>체험 꿀팁:</b> 위 입력창에 텍스트를 기입하거나 컴퓨터 내부의 모의 명함/영수증 파일을 첨부해 발송하면, 하단의 'AI 자율 감사 실행록'에 AI의 모의 의사결정이 실시간 피드로 등재됩니다! (단축키 Ctrl + Enter 전송 호환)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: 자동 발송 설정 ==================== */}
        {activeTab === "automation" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className="header-wrapper">
              <h1 className="header-title">
                <Zap className="w-7 h-7 text-yellow-500" />
                자동 발송 설정
              </h1>
              <p className="header-desc">
                특정 이벤트가 발생할 때 백그라운드에서 지정된 템플릿 문자를 바이어와 단골 고객에게 오토파일럿으로 자동 발송하는 규칙을 정의합니다.
              </p>
            </div>

            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "start", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                <Info className="w-6 h-6 text-indigo-400 shrink-0" />
                <div style={{ fontSize: "0.85rem", lineHeight: 1.5, color: "var(--text-muted)" }}>
                  <strong>작동 시나리오:</strong> 아래 목록에서 각 B2B / SCM 상황별 알림 스위치를 'On'으로 활성화해 두면, 스마트 온보딩이나 견적/수주 확정 시 해당 바이어 정보(상호, 담당자, 금액 등)를 치환하여 자동으로 즉시 알림 문자를 쏘게 됩니다.
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {Object.keys(automationRules).map((key) => {
                  const rule = automationRules[key];
                  let label = "";
                  let desc = "";
                  
                  if (key === "customer_registered") {
                    label = "신규 일반고객 가입 시";
                    desc = "새로운 오프라인 일반 소비자가 가입(Soft Sign-up)했을 때 웰컴 감사 혜택 문자를 발송합니다.";
                  } else if (key === "sales_order_confirmed") {
                    label = "B2B 수주 최종 확정 시 📦";
                    desc = "바이어가 보낸 견적을 수락하여 사장님이 최종 수주 승인(CONFIRMED)을 클릭했을 때 배송 스케줄이 담긴 수주확인서를 자동 발송합니다.";
                  } else if (key === "b2b_partner_registered") {
                    label = "B2B 신규 거래처 온보딩 시 🤝";
                    desc = "모바일 스마트 견적요청이나 명함 스냅 OCR을 통해 신규 B2B 파트너로 자동 가입이 완료되었을 때 파트너 안내장을 전송합니다.";
                  } else if (key === "estimate_received") {
                    label = "B2B 견적 요청 접수 시 🪐";
                    desc = "신규 바이어가 모바일 견적 요청 서식을 통해 견적 제안을 요청 접수하였을 때 즉시 모의 접수 확인장을 자동 발송합니다.";
                  }

                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", background: rule.enabled ? "rgba(79, 70, 229, 0.05)" : "rgba(255,255,255,0.01)", border: rule.enabled ? "1px solid var(--primary-glow)" : "1px solid var(--border-color)", borderRadius: "20px", gap: "2rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <label className="toggle-switch">
                          <input type="checkbox" checked={rule.enabled} onChange={() => handleToggleRule(key)} />
                          <span className="toggle-slider"></span>
                        </label>
                        <div>
                          <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: rule.enabled ? "white" : "var(--text-muted)" }}>{label}</h4>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-sub)", marginTop: "0.2rem" }}>{desc}</p>
                        </div>
                      </div>

                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem", width: "250px" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-sub)", whiteSpace: "nowrap" }}>연결 템플릿:</span>
                        <select disabled={!rule.enabled} className="input-field" style={{ fontSize: "0.75rem", padding: "0.4rem" }}>
                          <option value="1">{rule.templateId === 1 ? "웰컴 신규 고객 감사 쿠폰" : rule.templateId === 2 ? "B2B 수주 최종 확정 안내" : "기본 안내장 템플릿"}</option>
                          <option value="2">B2B 수주 최종 확정 안내</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button className="btn-neon" onClick={() => alert("💾 [규칙 저장 성공]\n가상 데모용 자동화 발송 템플릿과 온/오프 매핑 데이터가 브라우저 스토리지에 무사히 저장되었습니다.")}>
                  <Save className="w-4 h-4" /> 가상 설정 저장하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: Q&A 헬프센터 ==================== */}
        {activeTab === "help" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className="header-wrapper">
              <h1 className="header-title">
                <HelpCircle className="w-7 h-7 text-amber-500" />
                Q&A 헬프센터
              </h1>
              <p className="header-desc">
                이지데스크 [FreeSMS] 플랫폼의 24대 핵심 비즈니스 및 AI 자율 오토파일럿 작동에 관한 정교한 사용 안내 지식입니다.
              </p>
            </div>

            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>🪐 AI 자율 경영 파트너 핵심 FAQ</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {FAQ_DATABASE.map(faq => (
                  <div key={faq.id} style={{ background: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: "18px", border: "1px solid var(--border-color)" }}>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "white", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: "var(--amber)" }}>Q.</span> {faq.question}
                    </h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.75rem", lineHeight: 1.5, background: "rgba(0,0,0,0.15)", padding: "0.75rem 1rem", borderRadius: "12px", borderLeft: "3px solid var(--amber)" }}>
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 6: 스마트 모바일 채널 ==================== */}
        {activeTab === "mobile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className="header-wrapper">
              <h1 className="header-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Phone className="w-7 h-7 text-indigo-500 animate-pulse" />
                스마트 모바일 채널
              </h1>
              <p className="header-desc">
                이지데스크가 제공하는 5대 모바일 비즈니스 채널을 가상 스마트폰 시뮬레이터로 완벽 체험해 보세요. 모든 실시간 검색 및 단골 매핑 기능은 100% 동일 정합성으로 동작합니다.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem", alignItems: "start" }}>
              {/* 좌측: 모바일 채널 제어 패널 */}
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Star className="w-5 h-5 text-indigo-400" />
                  모바일 채널 선택 및 시나리오 가이드
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  사장님이 Next.js 본체에 적용하신 최신 검색 바 디자인과 현장 주문 캡처의 CRM 단골 자동완성(Auto-fill) 기능을 우측 스마트폰 디바이스에서 직접 타이핑하고 터치하여 시뮬레이션할 수 있습니다.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[
                    { id: "store", title: "📱 1. B2C 스마트 주문 스토어", desc: "B2C 일반 소비자가 링크를 타고 들어와 상품을 검색하고 무통장/적립금 결제 주문을 신청하는 스토어 화면입니다. (상품 검색 테스트 가능)", target: "B2C 일반 손님" },
                    { id: "table", title: "🍽️ 2. 매장 테이블 오더", desc: "매장 내 테이블 QR을 스캔하여 앉은 자리에서 직접 메뉴를 검색하고 비대면 주문하는 현장 오더 채널입니다. (카테고리 탭 + 메뉴 검색 교차 필터링)", target: "매장 내 방문 손님" },
                    { id: "booking", title: "📅 3. 실시간 모바일 예약", desc: "미용실, 스파, 카페 체험 코스 등 예약을 기반으로 작동하는 샵 전용 스마트 실시간 모바일 예약 창입니다. (예약 시술/품목 검색)", target: "방문 예약 손님" },
                    { id: "capture", title: "📸 5. 현장 주문 캡처 (CRM)", desc: "영업 현장이나 카운터에서 사장님이 주문을 즉석 캡처할 때, 단골 고객 데이터베이스에서 돋보기 검색을 통해 클릭 한 번으로 인적 사항을 오토필하는 모듈입니다.", target: "매장 카운터 / 영업 현장" },
                    { id: "estimate", title: "📄 6. B2B 스마트 견적 요청", desc: "B2B 신규/기존 바이어가 모바일 화면에서 상품 대장을 검색하고 필요한 도매 수량을 지정해 대규모 견적 협의를 요청하는 SCM 서식입니다.", target: "B2B 도소매 바이어" }
                  ].map((ch) => (
                    <div 
                      key={ch.id} 
                      onClick={() => setMobileActiveView(ch.id)}
                      style={{ 
                        padding: "1rem 1.25rem", 
                        background: mobileActiveView === ch.id ? "rgba(79, 70, 229, 0.08)" : "rgba(255,255,255,0.01)", 
                        border: mobileActiveView === ch.id ? "1px solid var(--primary-glow)" : "1px solid var(--border-color)", 
                        borderRadius: "18px", 
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      className="hover:scale-[1.01]"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: mobileActiveView === ch.id ? "white" : "var(--text-muted)" }}>{ch.title}</h4>
                        <span className="badge badge-primary" style={{ fontSize: "0.6rem" }}>{ch.target}</span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-sub)", marginTop: "0.4rem", lineHeight: 1.4 }}>{ch.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 우측: 럭셔리 스마트폰 디바이스 프레임 */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div 
                  className="phone-simulator" 
                  style={{ 
                    width: "340px", 
                    height: "640px", 
                    border: "8px solid #1e293b", 
                    borderRadius: "44px", 
                    backgroundColor: "#080c14", 
                    boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 30px rgba(79, 70, 229, 0.15)",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  {/* 상단 스피커 및 카메라 노치 */}
                  <div style={{ width: "110px", height: "18px", backgroundColor: "#1e293b", borderRadius: "0 0 12px 12px", position: "absolute", top: "0", left: "50%", transform: "translateX(-50%)", zIndex: "50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "35px", height: "3px", backgroundColor: "#475569", borderRadius: "2px", marginRight: "6px" }}></div>
                    <div style={{ width: "6px", height: "6px", backgroundColor: "#000", borderRadius: "50%" }}></div>
                  </div>

                  {/* 모바일 화면 바디 */}
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", padding: "1.5rem 1rem 1rem 1rem", marginTop: "10px" }}>
                    {mobileActiveView === "store" && renderStoreView()}
                    {mobileActiveView === "table" && renderTableView()}
                    {mobileActiveView === "booking" && renderBookingView()}
                    {mobileActiveView === "capture" && renderCaptureView()}
                    {mobileActiveView === "estimate" && renderEstimateView()}
                  </div>

                  {/* 하단 홈 바 */}
                  <div style={{ height: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: "50", background: "#080c14" }}>
                    <div style={{ width: "100px", height: "4px", backgroundColor: "#475569", borderRadius: "2px" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
