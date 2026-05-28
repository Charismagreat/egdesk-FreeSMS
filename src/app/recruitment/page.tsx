"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Briefcase, Bot, Send, Sparkles, Layout, Smartphone, 
  RotateCcw, Save, Trash2, Copy, ExternalLink, Check, 
  Phone, Calendar, UserCheck, ShieldCheck, FileText, ArrowRight,
  TrendingUp, Award, Clock, DollarSign, Plus, User, Info, MessageSquare,
  Heart, Settings, Share2, MoreHorizontal, MessageCircle, Navigation, Paperclip, MapPin
} from "lucide-react";

// 채용 공고 인터페이스
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

// 지원자 인터페이스
interface Applicant {
  id: string;
  name: string;
  age: string;
  phone: string;
  experience: string;
  motivation: string;
  matchingScore: number;
  status: "applied" | "interviewing" | "interview_done" | "approved" | "rejected";
  interviewLogs: Array<{ sender: "ai" | "candidate"; text: string; timestamp: string }>;
  aiEvaluation?: {
    strengths: string[];
    weaknesses: string[];
    finalVerdict: string;
  };
  signatureUrl?: string; // 디지털 서명 이미지 (Base64)
  signedAt?: string;
}

export default function RecruitmentDashboardPage() {
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ai" | "user"; text: string; timestamp: Date }>>([
    {
      sender: "ai",
      text: "안녕하세요! EGDESK AI 인텔리전트 채용 매니저 '이지봇'입니다. 💖✨\n\n인스타그램 스폰서드 마케팅처럼 힙하고 트렌디하게 인재를 끌어들이는 AI 채용 솔루션입니다. 구인공고 작성부터 DM 스타일 AI 면접, 그리고 모바일 모던 근로계약까지 단숨에 완성해 드릴게요!\n\n어떤 매장의 어떤 힙한 직원을 채용하시려나요? 원하시는 직종, 급여, 매장 위치를 편하게 던져주세요!\n\n예: \"성수동 힙한 브런치 카페 주말 바리스타 구함. 시급 12,000원!\"",
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [activeMobileView, setActiveMobileView] = useState<"posting" | "interview" | "contract">("posting");
  
  // 실시간 동기화 상태 및 링크 복사 상태
  const [liveSyncLog, setLiveSyncLog] = useState<string>("🔄 실시간 구직자 연동 채널 대기 중...");
  const [copiedLink, setCopiedLink] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 입력창 자동 크기 조절
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(Math.max(scrollHeight, 52), 150)}px`;
    }
  }, [chatInput]);

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  // 로컬스토리지 복원 및 실시간 동기화 이벤트 리스너 탑재
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedJob = localStorage.getItem("egdesk_recruitment_job");
      if (savedJob) setJobPosting(JSON.parse(savedJob));

      const savedApplicants = localStorage.getItem("egdesk_recruitment_applicants");
      if (savedApplicants) setApplicants(JSON.parse(savedApplicants));

      // 실시간 양방향 LocalStorage Sync 리스너
      const handleStorageSync = (e: StorageEvent) => {
        if (e.key === "egdesk_recruitment_sync" && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            
            // 1. 지원자 신규 지원 등록 이벤트
            if (data.action === "applied" && data.applicant) {
              const newApplicant: Applicant = data.applicant;
              setApplicants(prev => {
                const filtered = prev.filter(a => a.id !== newApplicant.id);
                const updated = [newApplicant, ...filtered];
                localStorage.setItem("egdesk_recruitment_applicants", JSON.stringify(updated));
                return updated;
              });
              setLiveSyncLog(`💖 [New Apply] 방금 힙한 구직자 '${newApplicant.name}' 님이 간편 지원서를 던졌습니다!`);
              
              setChatMessages(prev => [
                ...prev,
                {
                  sender: "ai",
                  text: `🔔 **알림: 새로운 인재 지원 완료!**\n\n방금 모바일 채용 링크를 타고 **'${newApplicant.name}(${newApplicant.age}세)'** 님이 매력적인 프로필을 제출했습니다.\n\n• **경력**: ${newApplicant.experience}\n• **지원 동기**: "${newApplicant.motivation}"\n• **AI 매칭도 분석**: 직무 핏 **${newApplicant.matchingScore}%**\n\n구직자 목록에서 프로필을 탭하신 후 **[실시간 AI 면접 개시]**를 눌러 다이렉트 메시지(DM) 스타일의 비대면 실시간 면접을 시작해 보세요!`,
                  timestamp: new Date()
                }
              ]);
            }
            
            // 2. 실시간 AI 면접 대화 업데이트 중계
            if (data.action === "interview_msg" && data.applicantId) {
              setApplicants(prev => {
                const updated = prev.map(a => {
                  if (a.id === data.applicantId) {
                    const nextStatus = data.isDone ? "interview_done" as const : "interviewing" as const;
                    const updatedApp = { 
                      ...a, 
                      interviewLogs: data.logs,
                      status: nextStatus,
                      aiEvaluation: data.isDone ? data.evaluation : a.aiEvaluation
                    };
                    
                    if (selectedApplicant?.id === data.applicantId) {
                      setSelectedApplicant(updatedApp);
                    }
                    return updatedApp;
                  }
                  return a;
                });
                localStorage.setItem("egdesk_recruitment_applicants", JSON.stringify(updated));
                return updated;
              });

              const lastMsg = data.logs[data.logs.length - 1];
              const senderLabel = lastMsg.sender === "ai" ? "🤖 AI면접관" : "👤 지원자";
              setLiveSyncLog(`💬 [Live DM] ${senderLabel}: "${lastMsg.text.substring(0, 18)}..."`);

              // 만약 면접이 최종 완료된 경우 AI 비서가 보고서를 브리핑
              if (data.isDone && data.evaluation) {
                const candidateName = data.candidateName || "구직자";
                setChatMessages(prev => [
                  ...prev,
                  {
                    sender: "ai",
                    text: `📝 **인스타그램 AI 마케터 분석 리포트 도착**\n\n지원자 **'${candidateName}'** 님의 비대면 AI DM 면접이 종료되었습니다.\n\n• **최종 매칭 코멘트**: ${data.evaluation.finalVerdict}\n• **핵심 시너지 요소**:\n${data.evaluation.strengths.map((s: string) => `  - ${s}`).join("\n")}\n• **주의할 스타일**:\n${data.evaluation.weaknesses.map((w: string) => `  - ${w}`).join("\n")}\n\n분석 리포트 피드를 확인하시고, **[최종 합격 & 모바일 근로계약 요청]** 버튼을 탭해 주세요!`,
                    timestamp: new Date()
                  }
                ]);
                setActiveMobileView("contract");
              }
            }

            // 3. 근로계약서 모바일 서명 완료 동기화
            if (data.action === "contract_signed" && data.applicantId) {
              setApplicants(prev => {
                const updated = prev.map(a => {
                  if (a.id === data.applicantId) {
                    const updatedApp = { 
                      ...a, 
                      status: "approved" as const,
                      signatureUrl: data.signatureUrl,
                      signedAt: new Date().toLocaleDateString("ko-KR")
                    };
                    if (selectedApplicant?.id === data.applicantId) {
                      setSelectedApplicant(updatedApp);
                    }
                    return updatedApp;
                  }
                  return a;
                });
                localStorage.setItem("egdesk_recruitment_applicants", JSON.stringify(updated));
                return updated;
              });

              setLiveSyncLog(`✍️ [계약 성립] 구직자가 폰으로 모바일 근로계약서에 디지털 사인을 완료했습니다!`);
              setChatMessages(prev => [
                ...prev,
                {
                  sender: "ai",
                  text: `🎉 **근로계약 매치 완료! 대성공!**\n\n지원자께서 모바일 스마트폰 화면을 통해 친필 전자서명을 무사히 마쳤습니다!\n\n인스타그램 스토리에 자랑하고 싶은 힙한 채용 성사가 이루어졌습니다. 근로계약서가 매장 DB에 안전하게 영구 저장되었습니다.`,
                  timestamp: new Date()
                }
              ]);
            }
          } catch (err) {
            console.error("실시간 동기화 파싱 에러", err);
          }
        }
      };

      window.addEventListener("storage", handleStorageSync);
      return () => window.removeEventListener("storage", handleStorageSync);
    }
  }, [selectedApplicant]);

  // 엔터 키 입력 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 사장님의 AI 메시지 전송 및 NLP 처리 시뮬레이션
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newUserMsg = { sender: "user" as const, text: userText, timestamp: new Date() };
    setChatMessages(prev => [...prev, newUserMsg]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      let responseText = "";
      const lowerText = userText.toLowerCase();

      // 채용 직군 파싱 분석 엔진
      if (lowerText.includes("서빙") || lowerText.includes("알바") || lowerText.includes("카페") || lowerText.includes("바리스타") || lowerText.includes("영업") || lowerText.includes("주방") || lowerText.includes("구함") || lowerText.includes("모집")) {
        let category = "서빙 / 아르바이트";
        let defaultTitle = "매장 홀 서비스 및 고객 소통 파트타임 파트너 구인";
        let salary = "시급 12,000원 (주휴수당 별도)";
        let timeRange = "주말 (토, 일) 11:30 ~ 20:30 (휴게시간 포함)";
        let location = "매장 핫플레이스 내";
        let requirements = ["인스타그램 피드처럼 밝고 생기발랄한 에너지를 가지신 분", "고객과의 소통 및 피드백을 즐기시는 분 우대", "약속과 성실을 1순위로 여기는 프로페셔널"];

        if (lowerText.includes("카페") || lowerText.includes("바리스타")) {
          category = "스페셜티 바리스타";
          defaultTitle = "감성 카페 스페셜티 음료 브루잉 및 고객 응대 크루 채용";
          salary = "시급 11,500원";
        } else if (lowerText.includes("영업") || lowerText.includes("판매") || lowerText.includes("마케팅")) {
          category = "브랜드 영업/홍보 크루";
          defaultTitle = "트렌디 매장 라이프스타일 큐레이팅 및 매장 홍보 정규 직원 채용";
          salary = "월급 2,700,000원 (성과 인센티브 뿜뿜)";
          timeRange = "주 5일 (화~토) 10:00 ~ 19:00";
        } else if (lowerText.includes("주방") || lowerText.includes("조리") || lowerText.includes("쉐프")) {
          category = "키친 조리/플레이팅 크루";
          defaultTitle = "매장 푸드 키친 조리 및 감성 플레이팅 주방 크루 채용";
          salary = "시급 12,500원";
        }

        const newJob: JobPosting = {
          id: `JOB_${Date.now()}`,
          title: defaultTitle,
          category,
          salary,
          timeRange,
          location,
          description: `저희 힙한 매장 브랜드와 함께 즐거운 에너지를 공유하며 일할 멋진 인재를 기다립니다. 긍정적인 애티튜드를 지니신 분이라면 누구나 환영합니다.`,
          requirements,
          createdAt: new Date().toLocaleDateString("ko-KR")
        };

        setJobPosting(newJob);
        localStorage.setItem("egdesk_recruitment_job", JSON.stringify(newJob));
        
        // 동적 연동용 동기화 객체 갱신
        localStorage.setItem("egdesk_recruitment_sync", JSON.stringify({
          action: "job_posted",
          job: newJob,
          timestamp: Date.now()
        }));

        responseText = `✨ **사장님, 채용 정보를 트렌디하게 분석해 초특급 인스타 감성 구인공고를 피딩했습니다!**\n\n• **공고 제목**: ${newJob.title}\n• **채용 분야**: ${newJob.category}\n• **보상 급여**: ${newJob.salary}\n• **스케줄**: ${newJob.timeRange}\n\n우측 모바일 섀시 시뮬레이터에 **인스타그램 광고 스타일의 구인 피드**가 활성화되었습니다! 하단의 **[구인 링크 복사]** 또는 **[지원자 탭 오픈]**으로 실시간 유입을 유도하세요!`;
        setActiveMobileView("posting");
      } else if (lowerText.includes("삭제") || lowerText.includes("초기화")) {
        setJobPosting(null);
        setApplicants([]);
        setSelectedApplicant(null);
        localStorage.removeItem("egdesk_recruitment_job");
        localStorage.removeItem("egdesk_recruitment_applicants");
        localStorage.removeItem("egdesk_recruitment_sync");
        responseText = "🧹 모든 채용 데이터베이스 피드가 깔끔하게 초기화되었습니다. 새로운 채용 직종 키워드를 알려주시면 다시 근사하게 피딩해 드릴게요!";
      } else {
        responseText = `🧐 "${userText}" 라고 메세지를 주셨네요!\n\n현재 이지봇 AI 솔루션은 감성 카페 바리스타, 주방 알바, 힙한 레스토랑 서빙, 매장 브랜드 홍보사원 구인공고 작성 및 DM 스타일 실시간 AI 면접실 구축을 정밀 지원합니다.\n\n구인하시고자 하는 브랜드 성격이나 급여를 가볍게 던져주시면 0.1초 만에 셋업해 드립니다!\n\n*(예: "성수동 카페 주말 야간 알바 구함 시급 1.1만")*`;
      }

      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: responseText,
          timestamp: new Date()
        }
      ]);
      setIsTyping(false);
    }, 1200);
  };

  // 채용 공고 링크 복사
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const link = `${window.location.origin}/m/recruitment?jobId=${jobPosting?.id || "DEMO"}`;
      navigator.clipboard.writeText(link).then(() => {
        setCopiedLink(true);
        setLiveSyncLog("🔗 인스타 스타일 모바일 지원 링크가 클립보드에 카피되었습니다!");
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  // 채용 공고 링크 즉시 열기
  const handleOpenLink = () => {
    if (typeof window !== "undefined") {
      const link = `${window.location.origin}/m/recruitment?jobId=${jobPosting?.id || "DEMO"}`;
      window.open(link, "_blank");
    }
  };

  // 사장님이 지원자 면접 개시 승인
  const handleApproveInterview = (app: Applicant) => {
    const updatedApplicants = applicants.map(a => {
      if (a.id === app.id) {
        return { ...a, status: "interviewing" as const };
      }
      return a;
    });
    setApplicants(updatedApplicants);
    localStorage.setItem("egdesk_recruitment_applicants", JSON.stringify(updatedApplicants));
    
    const target = updatedApplicants.find(a => a.id === app.id);
    if (target) setSelectedApplicant(target);

    // 구직자 모바일 화면을 AI 면접실로 전환시키는 이벤트 브로드캐스트
    localStorage.setItem("egdesk_recruitment_sync", JSON.stringify({
      action: "interview_start",
      applicantId: app.id,
      timestamp: Date.now()
    }));

    setLiveSyncLog(`🚀 '${app.name}' 지원자와의 실시간 AI 1:1 DM 면접방이 개방되었습니다!`);
    setActiveMobileView("interview");
  };

  // 최종 합격 처리 승인 (전자 근로계약서 개방)
  const handleApproveHiring = (app: Applicant) => {
    const updatedApplicants = applicants.map(a => {
      if (a.id === app.id) {
        return { ...a, status: "approved" as const };
      }
      return a;
    });
    setApplicants(updatedApplicants);
    localStorage.setItem("egdesk_recruitment_applicants", JSON.stringify(updatedApplicants));
    
    const target = updatedApplicants.find(a => a.id === app.id);
    if (target) setSelectedApplicant(target);

    // 구직자 화면을 근로계약서 서명창으로 전환시키는 이벤트 브로드캐스트
    localStorage.setItem("egdesk_recruitment_sync", JSON.stringify({
      action: "contract_open",
      applicantId: app.id,
      timestamp: Date.now()
    }));

    setLiveSyncLog(`📜 '${app.name}' 님 최종 합격 확정! 폰으로 디지털 계약서 서명을 요청했습니다.`);
    setActiveMobileView("contract");
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-[#f91f7f] selection:text-white relative overflow-hidden min-w-0">
      
      {/* 인스타그램 감성의 세련된 네온 글로우 오로라 백그라운드 효과 */}
      <div className="absolute top-[-35%] left-[-20%] w-[80%] h-[70%] rounded-full bg-gradient-to-tr from-[#f91f7f]/5 via-[#e84e27]/5 to-[#9b2bb4]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[60%] rounded-full bg-gradient-to-br from-[#9b2bb4]/5 via-[#4f5bd5]/5 to-[#f91f7f]/5 blur-[120px] pointer-events-none" />
      
      {/* 상단 헤더 영역 - 고대비 다크 텍스트 & 아이콘 매칭 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-200 relative z-10 shrink-0">
        <div className="flex items-center gap-4">
          {/* 럭셔리 핑크-퍼플 그라디언트 엠블럼 */}
          <div 
            className="p-3.5 rounded-2xl shadow-[0_8px_30px_rgba(249,31,127,0.15)] animate-pulse shrink-0 self-start sm:self-auto"
            style={{ background: 'linear-gradient(135deg, #f91f7f 0%, #e84e27 50%, #9b2bb4 100%)' }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-pink-50 text-pink-600 text-[10.5px] font-extrabold px-3 py-0.5 rounded-full border border-pink-200/60 shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-pink-500 animate-spin" style={{ animationDuration: "4s" }} /> RECRUITMENT AI ENGINE
              </span>
              <span className="text-slate-600 border border-slate-200/80 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100/80">v2.0 PRO</span>
            </div>
            <h1 
              className="text-3xl font-extrabold tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #0f172a 0%, #e11d48 50%, #6d28d9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              채용 매니저 AI
            </h1>
            <p className="text-slate-800 text-xs mt-1.5 font-bold leading-relaxed">
              인스타그램 마케팅의 감각적 비주얼과 직관적인 소통 구조를 녹여낸 스마트 채용 대시보드입니다. 사장님 탭과 구직자 모바일 탭이 실시간 티키타카로 동기화됩니다.
            </p>
          </div>
        </div>

        {/* 라이브 동기화 로그 모니터 정보 패널 - 고대비 다크보더 카드 */}
        <div className="bg-white border-2 border-slate-350 p-3.5 rounded-2xl flex items-center gap-3 shadow-md max-w-md w-full sm:w-auto">
          <div 
            className="w-3 h-3 rounded-full animate-ping shrink-0"
            style={{ background: 'linear-gradient(135deg, #f91f7f 0%, #e84e27 100%)' }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Live Feed Tunnel Status</p>
            <p className="text-xs font-black text-[#d91b5c] truncate">{liveSyncLog}</p>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 그리드 (2분할) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 flex-1 overflow-hidden min-h-0">
        
        {/* ==================== 좌측: 사장님 AI 비서 대화 및 지원자 관리 (라이브 모드 고대비) ==================== */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-lg" style={{ height: "840px" }}>
          
          {/* 채용 관리 대시보드 인스타 감성 탭 헤더 */}
          <div className="flex border-b border-slate-300 bg-slate-100 px-6 py-4 items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sm font-black text-slate-950">
              <Bot className="w-5 h-5 text-[#f91f7f]" />
              <span>이지봇 AI 채용 매니저 피드</span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* 1. 채용 공고 링크 배포 배너 (공고 활성화 시 노출) */}
            {jobPosting && (
              <div className="px-6 py-4 bg-slate-100 border-b border-slate-300 flex items-center justify-between shrink-0 animate-fade-in gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-gradient-to-r from-[#f91f7f] to-[#e84e27] text-white text-[9px] font-black px-2.5 py-0.5 rounded border border-transparent uppercase tracking-wider">Live Ad</span>
                    <h3 className="text-xs font-black text-slate-950 truncate">{jobPosting.title}</h3>
                  </div>
                  <p className="text-[10px] text-slate-700 font-extrabold truncate">스폰서드 모바일 채용 링크: <span className="text-[#d91b5c] font-black underline cursor-pointer" onClick={handleOpenLink}>{window.location.origin}/m/recruitment</span></p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button 
                    onClick={handleCopyLink}
                    className={`text-xs px-3 py-2 rounded-xl font-black transition-all border flex items-center gap-1 cursor-pointer ${
                      copiedLink 
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm" 
                        : "bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-sm"
                    }`}
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? "카피완료" : "구인링크 카피"}
                  </button>
                  <button 
                    onClick={handleOpenLink}
                    className="text-xs bg-gradient-to-tr from-[#f91f7f] to-[#e84e27] hover:opacity-90 text-white px-3.5 py-2 rounded-xl font-black transition-all flex items-center gap-1 cursor-pointer border border-[#f91f7f]/30 shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> 지원자 탭 오픈
                  </button>
                </div>
              </div>
            )}

            {/* 2. 지원자 실시간 접수 현황 리스트 (스토리 서클 스타일 고대비) */}
            {applicants.length > 0 && (
              <div className="px-6 py-4 border-b border-slate-300 bg-slate-100/60 flex flex-col gap-2 shrink-0">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">실시간 유입 구직자 스토리 ({applicants.length}명)</span>
                <div className="flex gap-4 overflow-x-auto py-1 no-scrollbar">
                  {applicants.map(app => {
                    const isSelected = selectedApplicant?.id === app.id;
                    return (
                      <div 
                        key={app.id}
                        onClick={() => {
                          setSelectedApplicant(app);
                          if (app.status === "applied") {
                            setActiveMobileView("posting");
                          } else if (app.status === "interviewing" || app.status === "interview_done") {
                            setActiveMobileView("interview");
                          } else {
                            setActiveMobileView("contract");
                          }
                        }}
                        className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group transition-all"
                      >
                        {/* 인스타 스토리 링 스타일 아바타 (화이트 배경 대비 뚜렷하게) */}
                        <div className={`p-[2px] rounded-full transition-all ${
                          app.status === "approved" ? "bg-emerald-600 scale-105" :
                          isSelected 
                            ? "bg-gradient-to-tr from-[#ffd016] via-[#f91f7f] to-[#9b2bb4] scale-105" 
                            : "bg-slate-300 group-hover:bg-gradient-to-tr group-hover:from-[#f91f7f] group-hover:to-[#9b2bb4]"
                        }`}>
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-white overflow-hidden">
                            <span className="text-xs font-black text-slate-900">
                              {app.name.substring(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className={`text-[10px] font-black truncate max-w-[65px] ${isSelected ? "text-[#d91b5c]" : "text-slate-900"}`}>
                            {app.name}
                          </p>
                          <span className="text-[8px] font-black text-slate-800 bg-slate-200 border border-slate-300 px-1.5 py-0.5 rounded shadow-sm">
                            {app.matchingScore}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. AI 비서 대화 로그 영역 (가독성 200% 극대화 차콜 텍스트 말풍선) */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex items-start gap-3.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.sender === "ai" && (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f91f7f] via-[#e84e27] to-[#9b2bb4] flex items-center justify-center shadow-md shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed border transition-all ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-[#f91f7f] to-[#9b2bb4] text-white border-transparent shadow-md rounded-tr-none font-bold"
                      : "bg-white text-slate-950 border-slate-300 rounded-tl-none whitespace-pre-line shadow-sm font-extrabold"
                  }`}>
                    {msg.text}
                    <span className={`block text-[8px] mt-1.5 text-right ${msg.sender === "user" ? "text-rose-100" : "text-slate-650 font-black"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start gap-3.5 justify-start">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f91f7f] via-[#e84e27] to-[#9b2bb4] flex items-center justify-center shadow-md shrink-0 animate-pulse">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white border-2 border-slate-300 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f91f7f] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e84e27] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9b2bb4] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* 4. 선택된 지원자 실시간 액션 패널 (선명한 인스타 팝업 스토리) */}
            {selectedApplicant && (
              <div className="p-4 bg-slate-100 border-t-2 border-slate-300 flex items-center justify-between gap-4 shrink-0 animate-slide-up shadow-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f91f7f] to-[#e84e27] p-[1.5px] shrink-0">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-300">
                      <User className="w-5 h-5 text-slate-800 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-black text-slate-950 truncate">{selectedApplicant.name} • {selectedApplicant.phone}</p>
                    <p className="text-[10px] text-slate-700 font-extrabold truncate">단계: <span className={`font-black uppercase tracking-wider ${
                      selectedApplicant.status === "approved" ? "text-emerald-700" :
                      selectedApplicant.status === "interviewing" ? "text-[#d91b5c]" :
                      selectedApplicant.status === "interview_done" ? "text-purple-800" : "text-[#4f5bd5]"
                    }`}>{
                      selectedApplicant.status === "approved" ? "채용 및 계약 체결 완료" :
                      selectedApplicant.status === "interviewing" ? "실시간 AI DM 면접 진행 중" :
                      selectedApplicant.status === "interview_done" ? "AI 면접 완료 (결재 대기)" : "지원 접수 완료"
                    }</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedApplicant.status === "applied" && (
                    <button
                      onClick={() => handleApproveInterview(selectedApplicant)}
                      className="bg-gradient-to-r from-[#f91f7f] to-[#e84e27] hover:opacity-90 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all border border-[#f91f7f]/30 shadow-md cursor-pointer"
                    >
                      🚀 실시간 AI 면접 승인
                    </button>
                  )}
                  {selectedApplicant.status === "interview_done" && (
                    <button
                      onClick={() => handleApproveHiring(selectedApplicant)}
                      className="bg-gradient-to-r from-[#e84e27] to-[#9b2bb4] hover:opacity-90 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all border border-[#9b2bb4]/30 shadow-md cursor-pointer"
                    >
                      📜 최종합격 & 근로계약 요청
                    </button>
                  )}
                  {selectedApplicant.status === "approved" && (
                    <span className="text-xs bg-emerald-100 border-2 border-emerald-300 text-emerald-800 font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                      <UserCheck className="w-4 h-4" /> 채용 성사 완료됨
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 5. 사장님 입력창 메커니즘 (가독성 높은 백그라운드 & 검은색 텍스트) */}
            <div className="p-4 bg-slate-100 border-t-2 border-slate-300 shrink-0">
              <div className="flex items-end gap-2 bg-white border-2 border-slate-400 rounded-3xl p-2.5 focus-within:border-[#f91f7f] focus-within:ring-2 focus-within:ring-[#f91f7f]/10 transition-all">
                <textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="구인 매장의 특징이나 조건을 던져서 공고를 피딩해 보세요..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-slate-950 font-extrabold outline-none resize-none px-3 py-3.5 font-sans leading-relaxed no-scrollbar border-0 max-h-[150px] min-h-[52px] placeholder-slate-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className={`p-3.5 rounded-full flex items-center justify-center transition-all cursor-pointer border-0 shadow-md shrink-0 ${
                    chatInput.trim()
                      ? "bg-gradient-to-r from-[#f91f7f] to-[#e84e27] text-white hover:opacity-95"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ==================== 우측: 3D 모바일 섀시 시뮬레이터 (구직자 라이브 화면 미러링 고대비) ==================== */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative shrink-0">
          
          {/* 모바일 화면 뷰 모드 수동 토글 탭 */}
          <div className="flex bg-slate-300 border-2 border-slate-400 rounded-2xl p-1 mb-4 relative z-10 w-full max-w-[340px] shadow-sm">
            <button 
              onClick={() => setActiveMobileView("posting")} 
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all cursor-pointer border-0 ${
                activeMobileView === "posting" ? "text-white shadow-md" : "text-slate-900 hover:text-black font-extrabold bg-transparent"
              }`}
              style={activeMobileView === "posting" ? { background: 'linear-gradient(90deg, #f91f7f 0%, #e84e27 100%)' } : {}}
            >
              스폰서드 피드
            </button>
            <button 
              onClick={() => setActiveMobileView("interview")} 
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all cursor-pointer border-0 ${
                activeMobileView === "interview" ? "text-white shadow-md" : "text-slate-900 hover:text-black font-extrabold bg-transparent"
              }`}
              style={activeMobileView === "interview" ? { background: 'linear-gradient(90deg, #f91f7f 0%, #e84e27 100%)' } : {}}
            >
              1:1 DM 면접
            </button>
            <button 
              onClick={() => setActiveMobileView("contract")} 
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all cursor-pointer border-0 ${
                activeMobileView === "contract" ? "text-white shadow-md" : "text-slate-900 hover:text-black font-extrabold bg-transparent"
              }`}
              style={activeMobileView === "contract" ? { background: 'linear-gradient(90deg, #f91f7f 0%, #e84e27 100%)' } : {}}
            >
              전자 근로계약
            </button>
          </div>

          {/* 3D 스마트폰 모형 (아이폰 섀시 - 고대비 실버/그레이 프레임) */}
          <div 
            className="relative bg-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden transition-all flex flex-col justify-start items-center border"
            style={{
              width: "360px",
              height: "720px",
              borderRadius: "48px",
              borderWidth: "10px",
              borderColor: "#94a3b8", // 더욱 뚜렷하고 고급스러운 다크 실버 프레임
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.15), 0 25px 50px -12px rgba(0,0,0,0.25)"
            }}
          >
            {/* 아일랜드형 노치 (Dynamic Island) */}
            <div 
              className="absolute top-2.5 left-1/2 transform -translate-x-1/2 bg-slate-900 z-50 flex items-center justify-end px-3.5 gap-1.5"
              style={{
                width: "90px",
                height: "22px",
                borderRadius: "14px"
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <div className="w-1 h-1 rounded-full bg-blue-900" />
              </div>
            </div>

            {/* 스마트폰 화면 내부 (라이트 모드 고대비 적용) */}
            <div className="w-full h-full bg-slate-50 flex flex-col overflow-hidden relative p-4 pt-10">
              
              {/* 모바일 화면 분기 */}
              {activeMobileView === "posting" && (
                <div className="w-full h-full flex flex-col justify-between overflow-y-auto no-scrollbar animate-fade-in text-left">
                  {jobPosting ? (
                    <div className="space-y-4 flex-1 pb-4">
                      {/* 인스타그램 브랜드 피드 카드 스타일 */}
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        {/* 피드 헤더 */}
                        <div className="p-3 flex items-center justify-between border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f91f7f] via-[#e84e27] to-[#9b2bb4] p-[1.5px]">
                              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-[#f91f7f]" />
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                                (주)EGDESK 매장 <Check className="w-3 h-3 text-[#f91f7f] fill-[#f91f7f]" />
                              </p>
                              <p className="text-[8px] text-slate-500 font-bold">Sponsored Ad</p>
                            </div>
                          </div>
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </div>
                        
                        {/* 피드 비주얼 영역 */}
                        <div className="p-5 bg-gradient-to-tr from-[#f91f7f] via-[#e84e27] to-[#9b2bb4] relative overflow-hidden flex flex-col justify-center items-center text-center py-9">
                          <div className="absolute inset-0 bg-black/10" />
                          <div className="relative z-10">
                            <span className="bg-black/30 text-[#ffd016] text-[8px] font-black px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-widest">We Are Hiring!</span>
                            <h2 className="text-sm font-black text-white mt-2.5 leading-snug">{jobPosting.title}</h2>
                            <p className="text-[9px] text-rose-100 font-black mt-0.5">{jobPosting.category}</p>
                          </div>
                        </div>

                        {/* 피드 라이크/소통 바 */}
                        <div className="p-3 flex items-center justify-between border-b border-slate-100">
                          <div className="flex gap-3">
                            <Heart className="w-4 h-4 text-[#f91f7f] fill-[#f91f7f]" />
                            <MessageCircle className="w-4 h-4 text-slate-700" />
                            <Share2 className="w-4 h-4 text-slate-700" />
                          </div>
                          <div className="text-[9px] font-black text-slate-900">
                            987 likes
                          </div>
                        </div>

                        {/* 조건 세부 - 다크 텍스트 가독성 확보 */}
                        <div className="p-4 space-y-2 text-xs">
                          <p className="leading-relaxed text-slate-700 font-semibold">
                            <span className="font-black text-slate-900 mr-1.5">egdesk_recruits</span>
                            {jobPosting.description}
                          </p>
                          
                          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-750 font-bold">
                            <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-[#e11d48]" /> 급여: {jobPosting.salary}</div>
                            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#e11d48]" /> 스케줄: {jobPosting.timeRange}</div>
                            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#e11d48]" /> 위치: {jobPosting.location}</div>
                          </div>
                        </div>
                      </div>

                      {/* 모바일 화면 전용 스와이프 업 / 지원 단추 */}
                      <div className="pt-2">
                        <button className="w-full bg-gradient-to-r from-[#f91f7f] via-[#e84e27] to-[#9b2bb4] text-white font-black py-3 rounded-2xl shadow-lg border-0 cursor-pointer text-xs flex items-center justify-center gap-1.5 hover:opacity-95 transition-all">
                          <span>간편 모바일 지원하기</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-slate-700 gap-3 p-6 text-center bg-slate-100/50 border border-slate-200 rounded-3xl shadow-inner">
                      <Briefcase className="w-14 h-14 text-slate-350 animate-pulse" />
                      <p className="text-xs font-black text-slate-950">활성화된 구인공고가 없습니다</p>
                      <p className="text-[10px] text-slate-800 font-extrabold leading-relaxed">왼쪽의 AI 매니저를 통해 구인 공고를 먼저 든든하게 생성해 주세요!</p>
                    </div>
                  )}
                </div>
              )}

              {activeMobileView === "interview" && (
                <div className="w-full h-full flex flex-col justify-between overflow-y-auto no-scrollbar animate-fade-in text-left">
                  {selectedApplicant ? (
                    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                      {/* 인스타 DM 헤더 */}
                      <div className="p-3 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f91f7f] to-[#e84e27] p-[1.5px] flex items-center justify-center">
                          <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-black text-xs text-slate-900">
                            {selectedApplicant.name.substring(0, 2)}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-950 flex items-center gap-1">
                            {selectedApplicant.name} <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          </p>
                          <p className="text-[8px] text-slate-500 font-bold">EGDESK AI 실시간 인터뷰 중</p>
                        </div>
                      </div>

                      {/* DM 대화 내역 */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 text-[10px]">
                        {selectedApplicant.interviewLogs && selectedApplicant.interviewLogs.length > 0 ? (
                          selectedApplicant.interviewLogs.map((log, idx) => (
                            <div key={idx} className={`flex ${log.sender === "ai" ? "justify-start" : "justify-end"}`}>
                              <div className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                                log.sender === "ai"
                                  ? "bg-slate-200 text-slate-950 rounded-tl-none font-bold"
                                  : "bg-gradient-to-r from-[#f91f7f] to-[#9b2bb4] text-white rounded-tr-none font-extrabold"
                              }`}>
                                {log.text}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 text-center p-4">
                            <Bot className="w-10 h-10 text-slate-350 animate-bounce" />
                            <p className="text-[10px] font-black text-slate-700">AI 면접 연결 완료</p>
                            <p className="text-[8px] text-slate-500">지원자에게 첫 번째 AI 질문을 던지는 중입니다...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-slate-700 gap-3 p-6 text-center bg-slate-100/50 border border-slate-200 rounded-3xl shadow-inner h-full">
                      <Bot className="w-12 h-12 text-[#f91f7f] animate-bounce" />
                      <p className="text-xs font-black text-slate-950">진행 중인 1:1 DM 면접이 없습니다.</p>
                      <p className="text-[10px] text-slate-800 font-extrabold leading-relaxed">구직자 프로필을 선택하고 좌측 관리바의 **[AI 면접 승인]**을 누르시면 실시간 DM 면접이 생중계됩니다.</p>
                    </div>
                  )}
                </div>
              )}

              {activeMobileView === "contract" && (
                <div className="w-full h-full flex flex-col justify-between overflow-y-auto no-scrollbar animate-fade-in text-left">
                  {selectedApplicant && jobPosting ? (
                    <div className="space-y-4 pb-4">
                      {/* 표준근로계약서 마크업 (고대비 화이트 페이퍼) */}
                      <div className="bg-white text-slate-900 p-4.5 rounded-2xl shadow-sm border border-slate-250 space-y-4 font-sans text-[10px]">
                        <h2 className="text-xs font-black text-center border-b-2 border-slate-800 pb-2 text-[#f91f7f] uppercase tracking-wider">전자 근로 계약서</h2>
                        
                        <div className="space-y-1.5 leading-relaxed text-slate-750 font-semibold">
                          <p><strong>갑 (대표자)</strong>: EGDESK 파트너스 매장</p>
                          <p><strong>을 (근로자)</strong>: {selectedApplicant.name}</p>
                          <p className="text-[9px] text-slate-500 font-medium">본 서류는 EGDESK 모바일 전자계약 보안채널을 통해 실시간 생성되었습니다.</p>
                        </div>

                        <div className="space-y-2 border-t border-slate-100 pt-2.5 text-slate-900 font-black">
                          <p>• <strong>담당 직무</strong>: {jobPosting.category}</p>
                          <p>• <strong>근무 위치</strong>: {jobPosting.location}</p>
                          <p>• <strong>소정 시간</strong>: {jobPosting.timeRange}</p>
                          <p>• <strong>보상 임금</strong>: {jobPosting.salary}</p>
                        </div>

                        {/* 서명 완료 여부 시각화 */}
                        {selectedApplicant.signatureUrl ? (
                          <div className="border border-emerald-250 bg-emerald-50 p-2.5 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-widest">E-Contract Signed</p>
                              <p className="text-[10px] font-black text-slate-950">을 서명: {selectedApplicant.name}</p>
                              <p className="text-[8px] text-slate-500">일자: {selectedApplicant.signedAt}</p>
                            </div>
                            <div className="w-16 h-10 border border-slate-200 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                              <img src={selectedApplicant.signatureUrl} alt="Signature" className="w-full h-auto max-h-[36px] object-contain" />
                            </div>
                          </div>
                        ) : (
                          <div className="border border-slate-200 bg-slate-100 p-3 rounded-xl text-center space-y-1">
                            <p className="text-[9px] font-black text-slate-705 animate-pulse">⏳ 모바일 서명 작성 대기 중...</p>
                            <p className="text-[8px] text-slate-500 font-bold">구직자가 폰 스케치 패드로 전자 서명을 그리는 중입니다.</p>
                          </div>
                        )}
                      </div>

                      {/* 근로계약 체결 상태 바 */}
                      {selectedApplicant.signatureUrl ? (
                        <div className="bg-emerald-50 border border-emerald-250 p-3.5 rounded-2xl flex items-center gap-2.5 shadow-sm">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div className="text-left">
                            <p className="text-xs font-black text-slate-800">전자근로계약 체결 완료!</p>
                            <p className="text-[8px] text-slate-500 font-semibold">법적 효력을 갖는 정식 매칭 계약이 체결되었습니다.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-250 p-3.5 rounded-2xl flex items-center gap-2.5">
                          <FileText className="w-5 h-5 text-[#f91f7f] shrink-0" />
                          <div className="text-left">
                            <p className="text-xs font-black text-slate-755">합격 서명 대기 상태</p>
                            <p className="text-[8px] text-slate-550 font-semibold">사장님이 합격 승인을 누르시면 서명 폼이 열립니다.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-slate-700 gap-3 p-6 text-center bg-slate-100/50 border border-slate-200 rounded-3xl shadow-inner">
                      <FileText className="w-14 h-14 text-[#9b2bb4] opacity-80 animate-pulse" />
                      <p className="text-xs font-black text-slate-950">미발행 근로 계약서</p>
                      <p className="text-[10px] text-slate-800 font-extrabold leading-relaxed">AI 면접이 완료된 우수 인재에게 합격 승인을 내리시면 자동으로 전자계약 조회가 시작됩니다.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}