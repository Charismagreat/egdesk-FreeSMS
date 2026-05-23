"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Briefcase, Bot, Send, Sparkles, Smartphone, Check, 
  DollarSign, Clock, MapPin, User, FileText, ShieldCheck, Heart, Award,
  Camera, Image, Paperclip, MoreHorizontal, Settings, X, RotateCcw, MessageCircle
} from "lucide-react";

// 공고 인터페이스
interface JobPosting {
  id: string;
  title: string;
  category: string;
  salary: string;
  timeRange: string;
  location: string;
  description: string;
  requirements: string[];
  createdAt: string;
}

// 면접 대화록 인터페이스
interface ChatLog {
  sender: "ai" | "candidate";
  text: string;
  timestamp: string;
}

export default function CandidateMobilePage() {
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  
  // 구직자 정보
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("");
  const [motivation, setMotivation] = useState("");
  
  // 지원 단계 상태: 'posting' (공고보기/지원서작성) -> 'waiting_interview' (면접대기) -> 'interviewing' (면접중) -> 'waiting_approve' (승인대기) -> 'contracting' (근로계약) -> 'done' (채용완료)
  const [step, setStep] = useState<"posting" | "waiting_interview" | "interviewing" | "waiting_approve" | "contracting" | "done">("posting");
  
  // AI 면접 상태
  const [chatInput, setChatInput] = useState("");
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [candidateId, setCandidateId] = useState("");
  
  // Canvas 근로계약서 서명 관련
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // 1. 공고 로드 및 실시간 동기화 리스너
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedJob = localStorage.getItem("egdesk_recruitment_job");
      if (savedJob) {
        setJobPosting(JSON.parse(savedJob));
      } else {
        // 프리셋 더미 공고 주입 (공고가 아직 사장님 화면에서 개시 안 된 경우 대비)
        const defaultJob: JobPosting = {
          id: "JOB_DEMO",
          title: "강남역 핫플레이스 베이커리 카페 크루 및 바리스타 파트타임 채용",
          category: "스페셜티 바리스타",
          salary: "시급 12,000원",
          timeRange: "토, 일요일 09:30 ~ 17:30 (조율 가능)",
          location: "서울시 강남구 신분당선 강남역 부근",
          description: "달콤한 빵 향기와 스페셜티 커피의 깊은 조화를 전하며, 인스타그래머블한 감성 매장에서 함께 호흡을 맞출 긍정적이고 힙한 바리스타 크루를 환영합니다.",
          requirements: ["미소가 밝고 고객과의 따뜻한 커뮤니케이션을 소중히 여기시는 분", "바리스타 또는 관련 요식업 F&B 서비스 경력자 우대", "주말 근무 시간 엄수 및 약속이 신뢰할 수 있는 분"],
          createdAt: new Date().toLocaleDateString()
        };
        setJobPosting(defaultJob);
      }

      // 사장님 탭의 이벤트 수신용 리스너
      const handleEmployerSync = (e: StorageEvent) => {
        if (e.key === "egdesk_recruitment_sync" && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            
            // 공고 새로고침 수신
            if (data.action === "job_posted" && data.job) {
              setJobPosting(data.job);
            }
            
            // 사장님이 AI 면접을 승인한 경우
            if (data.action === "interview_start" && data.applicantId) {
              const currentId = localStorage.getItem("egdesk_recruitment_candidate_id") || "";
              if (data.applicantId === currentId || currentId === "") {
                setCandidateId(data.applicantId || currentId);
                setStep("interviewing");
                
                // 첫 면접 질문 로드
                const firstQuestion = getFirstQuestion(jobPosting?.category || "스페셜티 바리스타");
                const initialLogs = [
                  { sender: "ai" as const, text: firstQuestion, timestamp: new Date().toLocaleTimeString() }
                ];
                setChatLogs(initialLogs);
                
                // 사장님 화면에 초기 상태 중계
                localStorage.setItem("egdesk_recruitment_sync", JSON.stringify({
                  action: "interview_msg",
                  applicantId: data.applicantId || currentId,
                  logs: initialLogs,
                  isDone: false,
                  timestamp: Date.now()
                }));
              }
            }

            // 사장님이 합격을 최종 승인하여 근로계약서 개방
            if (data.action === "contract_open" && data.applicantId) {
              const currentId = localStorage.getItem("egdesk_recruitment_candidate_id") || "";
              if (data.applicantId === currentId || currentId === "") {
                setStep("contracting");
              }
            }
          } catch (err) {
            console.error("구직자 동기화 처리 실패", err);
          }
        }
      };

      window.addEventListener("storage", handleEmployerSync);
      return () => window.removeEventListener("storage", handleEmployerSync);
    }
  }, [jobPosting]);

  // 대화록 스크롤 하단 고정
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatLogs]);

  // 직종별 첫 면접 질문 매핑
  const getFirstQuestion = (cat: string) => {
    if (cat.includes("바리스타") || cat.includes("카페")) {
      return "반갑습니다! 비대면 AI 면접관입니다. ☕️✨ 저희 브랜드 스페셜티 바리스타 직무에 매력적인 프로필로 지원해주셔서 기뻐요. 과거 카페나 식음료 매장, 혹은 유사한 소통 중심 서비스직에서 일해 본 경험이나 당시 느낀 소중한 원칙이 있다면 편하게 말씀해 주세요!";
    } else if (cat.includes("서빙") || cat.includes("알바")) {
      return "안녕하세요! 비대면 AI 면접관입니다. 🍽️ 매장 홀 서비스 파트타임 직무에 지원해주셨네요. 피크 시간이나 매장이 매우 혼잡할 때 여러 고객의 각기 다른 요구를 유연하면서도 침착하게 조율하는 본인만의 따뜻한 비결이나 마인드가 있을까요?";
    } else if (cat.includes("영업") || cat.includes("판매") || cat.includes("마케팅")) {
      return "반갑습니다! AI 면접관입니다. 📈 매장 라이프스타일 큐레이팅 및 홍보 크루 직무에 지원해 주셔서 감사해요. 처음 오시는 낯선 고객께도 저희 브랜드 스토리를 자연스럽게 설득력 있게 풀어내기 위해 중요시하는 대화 철학이 있다면 듣고 싶습니다.";
    } else {
      return "안녕하세요! AI 면접관입니다. 🙌 저희 팀 브랜드 구인 피드에 유입 지원해 주셔서 환영해요. 과거 다양한 사회 활동 또는 프로젝트 과정에서 본인의 성실함이나 긍정적 끈기를 멋지게 발휘해 냈던 경험을 편하게 던져주세요!";
    }
  };

  // 구직자 간편 지원 신청 제출
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !experience || !motivation) {
      alert("모든 필수 항목을 입력해주세요!");
      return;
    }

    const uniqueId = `APP_${Date.now()}`;
    setCandidateId(uniqueId);
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_recruitment_candidate_id", uniqueId);
    }

    // AI 직무 매칭 점수 계산 (75~98% 사이)
    const matchingScore = Math.floor(Math.random() * 24) + 75;

    const applicantData = {
      id: uniqueId,
      name,
      age: age || "24",
      phone,
      experience,
      motivation,
      matchingScore,
      status: "applied" as const,
      interviewLogs: []
    };

    // 사장님 탭으로 실시간 지원서 제출 알림 브로드캐스트
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_recruitment_sync", JSON.stringify({
        action: "applied",
        applicant: applicantData,
        timestamp: Date.now()
      }));
    }

    setStep("waiting_interview");
  };

  // AI 면접 답변 전송 및 동적 NLP 다음 질문 처리
  const handleSendInterviewMessage = () => {
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const nextLogs = [
      ...chatLogs,
      { sender: "candidate" as const, text: userText, timestamp: new Date().toLocaleTimeString() }
    ];
    setChatLogs(nextLogs);
    setChatInput("");

    // 사장님 화면에 구직자의 실시간 대화 전송 중계
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_recruitment_sync", JSON.stringify({
        action: "interview_msg",
        applicantId: candidateId,
        logs: nextLogs,
        isDone: false,
        timestamp: Date.now()
      }));
    }

    // AI 면접관의 동적 피드백 및 다음 질문 (총 3단계 질답 진행)
    setTimeout(() => {
      let aiResponseText = "";
      const lowerUserText = userText.toLowerCase();
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      if (nextIndex === 1) {
        let trait = "소통 에너지가 풍부하고 따뜻한";
        if (lowerUserText.includes("경력") || lowerUserText.includes("일해") || lowerUserText.includes("년") || lowerUserText.includes("개월")) {
          trait = "든든한 현장 실전 핏을 지니신";
        } else if (lowerUserText.includes("성실") || lowerUserText.includes("책임") || lowerUserText.includes("꾸준")) {
          trait = "책임감이 두터워 깊은 신뢰가 가는";
        }
        
        aiResponseText = `답변을 정독해보니 정말 ${trait} 분이라는 확신이 듭니다! 👍✨\n\n두 번째 질문을 드릴게요. 저희 매장은 서로 도우며 활기차게 시너지를 내는 '팀 크루 간의 유기적 시너지'를 매우 아낍니다. 과거에 동료나 친구와 긍정적으로 융화되어 무언가를 성취해 보셨던 따스한 추억이나 요령이 있다면 알려주시겠어요?`;
      } else if (nextIndex === 2) {
        aiResponseText = `팀워크를 다루는 따뜻한 배려심이 돋보입니다. 😊\n\n마지막 세 번째 질문입니다! 혹시 뜻하지 않은 트러블이나, 혹은 본인의 실수로 현장 업무에 예기치 못한 이슈가 생겼을 때, 가장 먼저 취하실 신속하고 책임감 있는 보고 및 대처 태도에 대해 최종 의견을 들려주세요.`;
      } else {
        const strengths = [
          "친근하고 설득력 있는 어조로 크루 및 고객과의 높은 소통 지능 보임",
          "예기치 못한 문제 상황에서 책임감 있는 즉각 보고와 대처 자세가 돋보임"
        ];
        if (motivation.includes("열심히") || userText.includes("열심")) {
          strengths.push("매우 풍부하고 적극적인 실천 에너지를 표명함");
        } else {
          strengths.push("매너 있고 품격 있는 서비스 애티튜드를 갖춤");
        }

        const evaluation = {
          strengths,
          weaknesses: ["피크 시간대 초반 동선 적응을 위한 짧은 코칭 요망"],
          finalVerdict: `${name} 지원자는 저희 매장의 인스타그래머블한 매력을 직접 현장에서 꽃피워 낼 특급 케미 크루입니다. 사장님께 적극적인 합격 패스를 추천해 드립니다.`
        };

        aiResponseText = `🎉 정말 수고하셨습니다! 이로써 1:1 비대면 AI 챗 면접이 조화롭게 완료되었습니다.\n\n지원자님의 멋진 면접 요약본이 실시간 추천 리포트가 되어 사장님 피드 결재함에 즉각 도달하였습니다.\n\n사장님께서 최종 채용 결재를 조율하고 계시니, 이 창을 열어둔 채 잠시만 설레는 마음으로 대기해 주세요!`;
        
        const finalLogs = [
          ...nextLogs,
          { sender: "ai" as const, text: aiResponseText, timestamp: new Date().toLocaleTimeString() }
        ];
        setChatLogs(finalLogs);

        // 사장님 탭으로 최종 면접 완료 신호 및 AI 보고서 전송
        if (typeof window !== "undefined") {
          localStorage.setItem("egdesk_recruitment_sync", JSON.stringify({
            action: "interview_msg",
            applicantId: candidateId,
            candidateName: name,
            logs: finalLogs,
            isDone: true,
            evaluation,
            timestamp: Date.now()
          }));
        }

        setStep("waiting_approve");
        return;
      }

      const updatedLogs = [
        ...nextLogs,
        { sender: "ai" as const, text: aiResponseText, timestamp: new Date().toLocaleTimeString() }
      ];
      setChatLogs(updatedLogs);

      // 사장님 탭 동기화 전송
      if (typeof window !== "undefined") {
        localStorage.setItem("egdesk_recruitment_sync", JSON.stringify({
          action: "interview_msg",
          applicantId: candidateId,
          logs: updatedLogs,
          isDone: false,
          timestamp: Date.now()
        }));
      }
    }, 1800);
  };

  // PC/모바일 서명 그리기 캔버스 스크립트
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000"; // 디지털 블랙 서명
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  // 친필 서명 제출 및 계약 체결 최종 등록
  const handleSubmitContract = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSigned) {
      alert("스케치 서명 패드에 친필 사인을 작성해 주세요!");
      return;
    }

    const signatureUrl = canvas.toDataURL("image/png");

    // 사장님 탭으로 서명 완료 데이터 브로드캐스트
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_recruitment_sync", JSON.stringify({
        action: "contract_signed",
        applicantId: candidateId,
        signatureUrl,
        timestamp: Date.now()
      }));
    }

    setStep("done");
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-3 sm:p-6 font-sans relative overflow-hidden selection:bg-[#f91f7f] selection:text-white">
      
      {/* 백그라운드 인스타 무지개 네온 오로라 광채 */}
      <div className="absolute top-[-20%] left-[-15%] w-[130%] h-[60%] rounded-full bg-gradient-to-tr from-[#f91f7f]/5 via-[#e84e27]/5 to-[#9b2bb4]/5 blur-[120px] pointer-events-none" />

      {/* 스마트폰 섀시 레이아웃 (모바일 타이트 프레임) */}
      <div className="w-full max-w-[400px] bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-[40px] p-5 relative z-10 flex flex-col justify-between flex-1 min-h-[660px]" style={{ height: "690px" }}>
        
        {/* 인스타 스토리 스타일 상단 진행바 (Progress Bars) */}
        <div className="flex gap-1 mb-4 shrink-0">
          {[
            step === "posting" || step === "waiting_interview" || step === "interviewing" || step === "waiting_approve" || step === "contracting" || step === "done",
            step === "waiting_interview" || step === "interviewing" || step === "waiting_approve" || step === "contracting" || step === "done",
            step === "interviewing" || step === "waiting_approve" || step === "contracting" || step === "done",
            step === "waiting_approve" || step === "contracting" || step === "done",
            step === "contracting" || step === "done",
            step === "done"
          ].map((active, idx) => (
            <div 
              key={idx} 
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                active 
                  ? "bg-gradient-to-r from-[#f91f7f] via-[#e84e27] to-[#9b2bb4]" 
                  : "bg-slate-200"
              }`} 
            />
          ))}
        </div>

        {/* 상단바 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f91f7f] via-[#e84e27] to-[#9b2bb4] p-[1.5px] flex items-center justify-center shadow-sm">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#f91f7f]" />
              </div>
            </div>
            <div className="text-left">
              <h2 className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                EGDESK 모바일 <Check className="w-2.5 h-2.5 text-[#f91f7f] fill-[#f91f7f]" />
              </h2>
              <p className="text-[8px] text-[#f91f7f] font-black tracking-wider">Sponsored Ad Direct</p>
            </div>
          </div>
          <span className="text-[9px] bg-slate-100 text-slate-600 font-extrabold px-2.5 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider">
            {step === "posting" ? "Ad Feed" :
             step === "waiting_interview" ? "Screening" :
             step === "interviewing" ? "1:1 DM Chat" :
             step === "waiting_approve" ? "Review" :
             step === "contracting" ? "E-Sign" : "Matched 🎉"}
          </span>
        </div>

        {/* 바디 영역 - 각 단계별 마크업 전환 */}
        <div className="flex-1 overflow-y-auto pr-0.5 no-scrollbar flex flex-col justify-start">
          
          {/* 단계 1: 공고 및 간편 지원서 작성 (인스타 피드 광고 스폰서드 레이아웃) */}
          {step === "posting" && jobPosting && (
            <div className="space-y-4 animate-fade-in text-left">
              
              {/* 인스타그램 스폰서 포스트 비주얼 카드 */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-gradient-to-tr from-[#f91f7f] via-[#e84e27] to-[#9b2bb4] relative py-7 text-center">
                  <div className="absolute inset-0 bg-black/10" />
                  <span className="relative z-10 bg-black/30 text-[#ffd016] text-[8px] font-black px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-widest">Sponsored</span>
                  <h3 className="relative z-10 text-sm font-black text-white mt-2 leading-snug">{jobPosting.title}</h3>
                  <p className="relative z-10 text-[10px] text-rose-100 font-bold mt-0.5">{jobPosting.category}</p>
                </div>

                <div className="p-3 flex items-center justify-between border-b border-slate-100 bg-white">
                  <div className="flex gap-3">
                    <Heart className="w-4 h-4 text-[#f91f7f] fill-[#f91f7f] animate-pulse" />
                    <MessageCircle className="w-4 h-4 text-slate-700" />
                  </div>
                  <div className="text-[9px] font-bold text-slate-600">
                    매칭률 99.8% 매칭 추천
                  </div>
                </div>

                {/* 매장 근로 조건 */}
                <div className="p-4 space-y-2 text-xs border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <DollarSign className="w-4 h-4 text-[#f91f7f] shrink-0" />
                    <p>보상 조건: <span className="text-slate-900 font-black">{jobPosting.salary}</span></p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Clock className="w-4 h-4 text-[#f91f7f] shrink-0" />
                    <p>근무 시간: <span className="text-slate-800 font-bold">{jobPosting.timeRange}</span></p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <MapPin className="w-4 h-4 text-[#f91f7f] shrink-0" />
                    <p>근무 위치: <span className="text-slate-800 font-bold">{jobPosting.location}</span></p>
                  </div>
                </div>

                {/* 캡션 요약 */}
                <div className="p-4 pt-3 text-xs leading-relaxed text-slate-600 bg-white">
                  <span className="font-black text-slate-900 mr-1.5">store_crew</span>
                  {jobPosting.description}
                </div>
              </div>

              {/* 구직자 간편 지원 폼 */}
              <form onSubmit={handleApplySubmit} className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">간편 프로필 제출</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 font-bold">성명 (필수)</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="홍길동"
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#f91f7f]/50 focus:ring-1 focus:ring-[#f91f7f]/20 text-slate-800 placeholder-slate-400 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 font-bold">나이 (선택)</label>
                    <input 
                      type="number" 
                      value={age} 
                      onChange={(e) => setAge(e.target.value)} 
                      placeholder="24"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#f91f7f]/50 focus:ring-1 focus:ring-[#f91f7f]/20 text-slate-800 placeholder-slate-400 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-600 font-bold">휴대폰 번호 (필수)</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="010-1234-5678"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#f91f7f]/50 focus:ring-1 focus:ring-[#f91f7f]/20 text-slate-800 placeholder-slate-400 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-600 font-bold">경력사항 요약 (필수)</label>
                  <input 
                    type="text" 
                    value={experience} 
                    onChange={(e) => setExperience(e.target.value)} 
                    placeholder="카페 바리스타 6개월, 매장 판매 1년 등"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#f91f7f]/50 focus:ring-1 focus:ring-[#f91f7f]/20 text-slate-800 placeholder-slate-400 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-600 font-bold">지원동기 및 다짐 (필수)</label>
                  <textarea 
                    value={motivation} 
                    onChange={(e) => setMotivation(e.target.value)} 
                    placeholder="인센티브와 시너지를 내며 즐겁고 성실하게 일할 자신이 있습니다!"
                    required
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#f91f7f]/50 focus:ring-1 focus:ring-[#f91f7f]/20 text-slate-800 placeholder-slate-400 font-bold resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#f91f7f] via-[#e84e27] to-[#9b2bb4] text-white font-black text-xs py-3.5 rounded-xl border-0 shadow-lg cursor-pointer active:scale-95 transition-all mt-2"
                >
                  📥 1초 프로필 제출 및 면접 대기
                </button>
              </form>
            </div>
          )}

          {/* 단계 2: 지원 완료 및 사장님 승인 대기 */}
          {step === "waiting_interview" && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-5 animate-fade-in">
              <div className="p-4 bg-gradient-to-tr from-[#f91f7f] via-[#e84e27] to-[#9b2bb4] rounded-full text-white shrink-0 shadow-xl animate-pulse">
                <User className="w-8 h-8" />
              </div>
              <div className="space-y-3 px-2">
                <h3 className="text-sm font-extrabold text-slate-800">구직 프로필 피딩 완료!</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  사장님 스마트 채용 대시보드에 **'{name}'** 님의 프로필이 0.1초 만에 배달 완료되었습니다.
                </p>
                <div className="inline-block bg-[#f91f7f]/5 border border-[#f91f7f]/20 px-4 py-3 rounded-2xl text-[10px] text-[#f91f7f] font-black animate-pulse leading-relaxed">
                  ⚡️ 사장님이 실시간 지원서를 확인하고 AI 1:1 DM 면접방을 개방할 때까지 잠시만 이 창을 켜둔 채 대기해 주세요.
                </div>
              </div>
            </div>
          )}

          {/* 단계 3: AI 면접관과의 1:1 비대면 실시간 인스타 DM 면접 */}
          {step === "interviewing" && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden h-full min-h-[460px] animate-fade-in text-left text-slate-800">
              {/* 인스타 DM 헤더 */}
              <div className="px-3.5 py-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shrink-0 mb-3.5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#f91f7f] to-[#e84e27] p-[1.5px] shrink-0">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-[#f91f7f]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800">이지봇 (AI 면접관)</p>
                    <p className="text-[7px] text-emerald-600 font-extrabold tracking-wider">Active Now</p>
                  </div>
                </div>
                <Settings className="w-4 h-4 text-slate-500" />
              </div>

              {/* 실시간 면접 채팅창 */}
              <div ref={chatScrollRef} className="flex-grow overflow-y-auto space-y-3 pr-0.5 no-scrollbar pb-3">
                {chatLogs.map((log, idx) => (
                  <div key={idx} className={`flex items-start gap-2.5 ${log.sender === "candidate" ? "justify-end" : "justify-start"}`}>
                    {log.sender === "ai" && (
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2.5 text-xs leading-relaxed border transition-all ${
                      log.sender === "candidate"
                        ? "bg-gradient-to-r from-[#f91f7f] via-[#e84e27] to-[#9b2bb4] text-white border-transparent rounded-tr-none font-bold"
                        : "bg-white text-slate-800 border-slate-200 rounded-tl-none whitespace-pre-line font-semibold shadow-sm"
                    }`}>
                      {log.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* DM 입력창 */}
              <div className="pt-2 border-t border-slate-200 shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-3xl p-1.5 focus-within:border-[#f91f7f]/50 focus-within:ring-1 focus-within:ring-[#f91f7f]/20 transition-all">
                  <div className="flex gap-2 text-slate-400 px-1 shrink-0">
                    <Camera className="w-4 h-4 cursor-pointer hover:text-slate-600" />
                    <Image className="w-4 h-4 cursor-pointer hover:text-slate-600" />
                  </div>
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendInterviewMessage()}
                    placeholder="메세지 보내기..."
                    className="flex-1 bg-transparent text-xs text-slate-800 font-bold outline-none px-1 py-2 border-0 placeholder-slate-400"
                  />
                  <button 
                    onClick={handleSendInterviewMessage}
                    disabled={!chatInput.trim()}
                    className={`p-2.5 rounded-full flex items-center justify-center border-0 cursor-pointer shadow-md shrink-0 ${
                      chatInput.trim() 
                        ? "bg-gradient-to-r from-[#f91f7f] to-[#e84e27] text-white active:scale-95 transition-all" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 단계 4: 면접 완료 및 사장님 최종 승인 대기 */}
          {step === "waiting_approve" && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-5 animate-fade-in">
              <div className="p-4 bg-gradient-to-tr from-[#e84e27] to-[#9b2bb4] rounded-full text-white shrink-0 shadow-xl">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-3 px-2">
                <h3 className="text-sm font-extrabold text-slate-800">AI DM 면접 종료!</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  작성해주신 훌륭한 답변들이 실시간 인재 핏 분석서로 파싱되어 사장님 결재함에 정상적으로 도달했습니다.
                </p>
                <div className="inline-block bg-[#9b2bb4]/5 border border-[#9b2bb4]/20 px-4 py-3 rounded-2xl text-[10px] text-[#9b2bb4] font-black animate-pulse leading-relaxed">
                  ⏳ 사장님이 분석서를 검토하신 뒤 최종 합격 승인 및 전자 근로계약을 요청하실 때까지 그대로 대기해 주세요!
                </div>
              </div>
            </div>
          )}

          {/* 단계 5: 표준근로계약서 및 디지털 서명 작성 */}
          {step === "contracting" && (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
                <p className="text-[10px] font-black text-emerald-600">축하합니다! 모바일 근로계약서 성사 단계</p>
              </div>

              {/* 표준근로계약서 문서화 렌더 */}
              <div className="bg-white text-slate-900 p-4.5 rounded-2xl shadow-md border border-slate-200 space-y-3 font-sans text-[10px] leading-relaxed">
                <h2 className="text-xs font-black text-center border-b-2 border-slate-800 pb-2 text-slate-900">표준근로계약서</h2>
                <div className="text-slate-600">
                  <p><strong>갑 (매장대표)</strong>: EGDESK 제휴 매장</p>
                  <p><strong>을 (근로자)</strong>: {name}</p>
                </div>
                <div className="text-slate-850 space-y-1 border-t border-slate-100 pt-2 font-semibold">
                  <p>• <strong>직무</strong>: {jobPosting?.category}</p>
                  <p>• <strong>급여</strong>: {jobPosting?.salary}</p>
                  <p>• <strong>시간</strong>: {jobPosting?.timeRange}</p>
                  <p>• <strong>위치</strong>: {jobPosting?.location}</p>
                </div>
                <p className="text-[8px] text-slate-400 border-t border-slate-100 pt-2 leading-normal font-bold">※ 아래 스케치 패드에 마우스 또는 손가락으로 정식 실명 사인을 친필로 그리고 완료를 탭해 주세요.</p>
              </div>

              {/* 친필 서명 캔버스 그리기 보드 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-600 font-bold">을(근로자) 친필 서명</label>
                  <button 
                    onClick={clearCanvas} 
                    className="text-[9px] bg-slate-150 hover:bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-300 cursor-pointer font-bold"
                  >
                    새로 그리기
                  </button>
                </div>
                <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-300 shadow-inner h-28 relative">
                  <canvas 
                    ref={canvasRef}
                    width={360}
                    height={112}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair touch-none"
                  />
                  {!hasSigned && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-[10px] font-bold pointer-events-none">
                       여기에 손가락이나 마우스로 사인을 하세요
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleSubmitContract}
                disabled={!hasSigned}
                className={`w-full font-black text-xs py-3.5 rounded-xl border-0 shadow-lg transition-all cursor-pointer ${
                  hasSigned 
                    ? "bg-gradient-to-r from-[#f91f7f] to-[#e84e27] text-white active:scale-95" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                ✍️ 디지털 서명 제출 및 채용 확정
              </button>
            </div>
          )}

          {/* 단계 6: 최종 계약 체결 완료 (인스타 스토리 축하 스티커 카드 디자인) */}
          {step === "done" && (
            <div className="flex-grow flex flex-col items-center justify-center py-16 text-center space-y-5 animate-fade-in">
              {/* 스토리 축하 배지 */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#f91f7f] via-[#e84e27] to-[#9b2bb4] text-white flex items-center justify-center shadow-2xl animate-bounce">
                <ShieldCheck className="w-9 h-9" />
              </div>
              
              <div className="space-y-3 px-2">
                <h3 className="text-sm font-black text-transparent bg-gradient-to-r from-[#f91f7f] via-[#e84e27] to-[#9b2bb4] bg-clip-text">
                  E-Contract Signed Match!
                </h3>
                <p className="text-xs text-slate-800 leading-relaxed font-bold">
                  축하합니다! **'{name}'** 크루님과 **'EGDESK 매장'**의 모바일 근로계약 매칭이 최종 체결 완료되었습니다! 🎉
                </p>
                
                {/* 인스타 스토리 캡션 스타일 가이드보드 */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2.5 text-left text-[10px] text-slate-600 leading-relaxed font-bold shadow-sm">
                  <div className="flex items-center gap-1.5 text-[#f91f7f] font-black border-b border-slate-100 pb-1.5">
                    <Award className="w-3.5 h-3.5" /> 첫 출근 준비 서류 목록
                  </div>
                  <p>1. **신분증 & 급여 통장 사본** 1부</p>
                  <p>2. **보건증** (식음 F&B 업장의 경우 필수 구비)</p>
                  <p>3. **프로 정신**: 밝고 신뢰받는 크루원으로서의 마인드셋!</p>
                </div>
                
                <p className="text-[9px] text-slate-500 font-semibold">본 브라우저 창은 닫으셔도 좋으며, 사장님 관리 대시보드에 모든 데이터가 안전하게 보존되었습니다.</p>
              </div>
            </div>
          )}

        </div>

        {/* 푸터 워터마크 */}
        <div className="text-center text-[8px] text-slate-400 font-black border-t border-slate-100 pt-3.5 shrink-0 flex items-center justify-center gap-1 uppercase tracking-widest">
          <Smartphone className="w-3 h-3 text-slate-400" /> Instagram Style Recruits
        </div>

      </div>

    </div>
  );
}
