import React, { useState, useEffect, useRef } from "react";
import {
  Home, HelpCircle, Handshake, Sparkles, Zap, Plus, Trash2, Camera, Mic, Info, Save
} from "lucide-react";

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

      </main>
    </div>
  );
}
