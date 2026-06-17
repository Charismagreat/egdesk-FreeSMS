"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, StopCircle, Mail, Play, CheckCircle2, Clock, 
  ArrowLeft, Calendar, Users, Lightbulb, Sparkles, Plus, X, 
  ChevronRight, RefreshCw, FileText, CheckSquare, Square, Trash2, ArrowUpRight
} from "lucide-react";

// 가상 회의 시뮬레이션 시나리오 정의
const SCENARIOS = [
  {
    id: "marketing",
    name: "🚀 신규 MRO 자재 할인 마케팅 캠페인 수립 회의",
    scripts: [
      { speaker: "홍길동 대표", text: "여러분 안녕하세요. 오늘 회의는 다음 달 개시할 신규 MRO 자재 할인 마케팅 캠페인 계획을 수립하기 위한 자리입니다." },
      { speaker: "김철수 과장", text: "네, 대표님. 현재 저희 재고 대장에 불용자재와 장기 적재 자재가 늘어나고 있습니다. 이를 털어내기 위한 타겟 마케팅이 필요합니다." },
      { speaker: "이영희 대리", text: "맞습니다. 특히 안전재고 기준 2배를 초과한 기계부품과 90일간 출고가 없었던 소모성 자재들을 위주로 할인 제안서를 발송하는 것이 좋겠습니다." },
      { speaker: "홍길동 대표", text: "좋은 생각이네요. 김철수 과장은 이번 주 금요일까지 불용자재 리스트 중 매칭율이 높은 바이어 업체를 10군데 정도 선별해 주시겠어요?" },
      { speaker: "김철수 과장", text: "네, 알겠습니다. AI 관제 탭을 통해 매입 후보 업체를 발굴하여 6월 20일까지 리스트업하겠습니다." },
      { speaker: "이영희 대리", text: "제안 메일을 보낼 때 사용할 표준 HTML 메일 템플릿 and 할인율 안내 서식은 제가 6월 19일까지 기안해 보겠습니다." },
      { speaker: "홍길동 대표", text: "좋습니다. 이영희 대리가 템플릿을 완성하면, 사내 SMTP 메일 연동 모듈을 사용해서 일괄 발송하는 시스템 테스트도 함께 진행해 주세요." },
      { speaker: "이영희 대리", text: "네, 메일 발송 서버 설정 상태를 확인하고 실제 발송 테스트까지 이번 주 내에 완료하겠습니다." },
      { speaker: "홍길동 대표", text: "바이어 회신 시뮬레이션도 잊지 말고 실행해서, 회신이 왔을 때 제 메일로 알림이 정상적으로 포워딩되는지 체크해 주시기 바랍니다." },
      { speaker: "김철수 과장", text: "알겠습니다. 시뮬레이션 콜백 API 연동 상태까지 모두 점검하고 다음 주 월요일에 최종 보고드리겠습니다." }
    ]
  },
  {
    id: "supply_chain",
    name: "🌐 글로벌 원자재 조달 지연 비상 대책 회의",
    scripts: [
      { speaker: "홍길동 대표", text: "인도네시아발 원자재 세관 통관 행정 지연으로 인해 다음 주 생산 계획에 차질이 생겼습니다. 비상 대책을 논의합시다." },
      { speaker: "김철수 과장", text: "네, AI 공급망 관제상 지연 확률이 85% 이상으로 치솟았습니다. 임시 대체 조달처를 발굴해야 합니다." },
      { speaker: "이영희 대리", text: "대체 국내 공급사 중에서 한성정밀기공과 삼우화학 쪽이 즉시 납품이 가능한 재고를 보유하고 있는 것으로 확인되었습니다." },
      { speaker: "홍길동 대표", text: "김철수 과장은 즉시 한성정밀기공 담당자에게 전화를 걸어 단가와 다음 주 월요일까지 납기 가능 여부를 조율해 주세요." },
      { speaker: "김철수 과장", text: "알겠습니다. 바로 유선 통화 조율 후 견적서를 요청하여 6월 18일 오전까지 품의서를 기안하겠습니다." },
      { speaker: "이영희 대리", text: "그럼 저는 삼우화학 쪽에 단가 비교용 예비 견적 및 긴급 독촉 SMS 템플릿을 발송하여 6월 18일 퇴근 전까지 회신을 받아 두겠습니다." },
      { speaker: "홍길동 대표", text: "좋습니다. 원자재가 입고되는 즉시 이지봇(EasyBot) 자율 입고 처리를 가동할 수 있도록 바코드 매핑 테이블도 미리 준비해 두세요." },
      { speaker: "이영희 대리", text: "네, 신규 품목 자동 등록 및 입출고 로그 적재 시나리오를 6월 19일까지 개발 테스트 완료하겠습니다." },
      { speaker: "홍길동 대표", text: "수고하셨습니다. 이번 세관 지연 건을 교훈 삼아 상시 예비 대체처 풀을 DB화하는 것이 급선무입니다. 회의를 마치겠습니다." }
    ]
  }
];

export default function MeetingMinutesPage() {
  // 상태 관리
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "active" | "detail">("list");
  
  // 새 회의 작성 폼
  const [newTitle, setNewTitle] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [tempAttendees, setTempAttendees] = useState<{ name: string; email: string }[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 실시간 회의 중 상태
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<{ speaker: string; text: string; time: string }[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [speechSpeaker, setSpeechSpeaker] = useState("나 (회의 참여자)");
  const [recommendedMeetings, setRecommendedMeetings] = useState<any[]>([]);
  const [interimAdvice, setInterimAdvice] = useState<string>("");
  const [showInterimModal, setShowInterimModal] = useState(false);
  const [isAnalyzingInterim, setIsAnalyzingInterim] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // 시뮬레이터 상태
  const [selectedScenarioId, setSelectedScenarioId] = useState("marketing");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIndex, setSimIndex] = useState(0);

  // 과거 회의 요약 뷰어 모달
  const [viewPastSummary, setViewPastSummary] = useState<any | null>(null);

  // 이메일 발송 관련
  const [sendRecipients, setSendRecipients] = useState<{ name: string; email: string }[]>([]);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [mailResult, setMailResult] = useState<string | null>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const simTimerRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const lastRecommendLengthRef = useRef<number>(0);

  // 1. 초기 로딩: 회의록 목록 획득
  useEffect(() => {
    fetchMeetings();
  }, []);

  // 대화록 추가 시 하단 스크롤 자동 이동
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // 회의 진행 중, 대화량이 3문장 추가될 때마다 과거 회의 시맨틱 추천 트리거
    if (viewMode === "active" && transcript.length > 0 && transcript.length % 3 === 0 && transcript.length !== lastRecommendLengthRef.current) {
      lastRecommendLengthRef.current = transcript.length;
      triggerSemanticRecommendation();
    }
  }, [transcript, viewMode]);

  const fetchMeetings = async () => {
    try {
      const res = await fetch("/api/meeting-minutes");
      const data = await res.json();
      if (data.success) {
        setMeetings(data.meetings);
      }
    } catch (e) {
      console.error("회의 목록 조회 실패:", e);
    }
  };

  const fetchTasks = async (meetingId: number) => {
    try {
      const res = await fetch(`/api/meeting-minutes/tasks?meetingId=${meetingId}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (e) {
      console.error("할 일 조회 실패:", e);
    }
  };

  // 2. 새 회의 만들기
  const handleStartMeeting = async () => {
    if (!newTitle.trim()) {
      alert("회의 제목을 입력해 주세요.");
      return;
    }

    try {
      const res = await fetch("/api/meeting-minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          title: newTitle,
          attendees: tempAttendees
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedMeeting(data.meeting);
        setTranscript([]);
        setRecommendedMeetings([]);
        setInterimAdvice("");
        setViewMode("active");
        setShowCreateModal(false);
        setNewTitle("");
        setTempAttendees([]);
        lastRecommendLengthRef.current = 0;
      } else {
        alert(data.error || "회의 개시에 실패했습니다.");
      }
    } catch (e) {
      console.error("회의 개시 오류:", e);
    }
  };

  const addAttendee = () => {
    if (!attendeeName.trim() || !attendeeEmail.trim()) {
      alert("참석자 이름과 이메일을 모두 기입해 주세요.");
      return;
    }
    if (!attendeeEmail.includes("@")) {
      alert("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    setTempAttendees([...tempAttendees, { name: attendeeName.trim(), email: attendeeEmail.trim() }]);
    setAttendeeName("");
    setAttendeeEmail("");
  };

  const removeAttendee = (idx: number) => {
    setTempAttendees(tempAttendees.filter((_, i) => i !== idx));
  };

  // 3. 실시간 음성인식 (STT) 제어
  const startSTT = () => {
    if (isSimulating) {
      alert("현재 시뮬레이터가 작동 중입니다. 시뮬레이터를 먼저 중지해 주세요.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("현재 브라우저는 음성 인식을 지원하지 않습니다. 크롬이나 에지 브라우저를 사용하시거나 [AI 시뮬레이션] 기능을 이용해 주세요.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "ko-KR";

    rec.onstart = () => {
      setIsRecording(true);
    };

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (interim) {
        setCurrentSpeech(interim);
      }

      if (final) {
        const timeStr = new Date().toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setTranscript(prev => [...prev, {
          speaker: speechSpeaker,
          text: final.trim(),
          time: timeStr
        }]);
        setCurrentSpeech("");
      }
    };

    rec.onerror = (e: any) => {
      console.error("음성인식 에러:", e);
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopSTT = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setCurrentSpeech("");
  };

  // 4. 가상 회의 시뮬레이터 구동
  const startSimulation = () => {
    if (isRecording) {
      alert("현재 음성 인식이 켜져 있습니다. 음성 인식을 먼저 꺼 주세요.");
      return;
    }

    const scenario = SCENARIOS.find(s => s.id === selectedScenarioId);
    if (!scenario) return;

    setIsSimulating(true);
    setSimIndex(0);
    
    // 타이머 가동 (4~6초마다 대사 1건씩 누적)
    let idx = 0;
    const runSim = () => {
      if (idx >= scenario.scripts.length) {
        stopSimulation();
        return;
      }

      const script = scenario.scripts[idx];
      const timeStr = new Date().toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      
      setTranscript(prev => [...prev, {
        speaker: script.speaker,
        text: script.text,
        time: timeStr
      }]);

      idx++;
      setSimIndex(idx);
      simTimerRef.current = setTimeout(runSim, 5000);
    };

    runSim();
  };

  const stopSimulation = () => {
    if (simTimerRef.current) {
      clearTimeout(simTimerRef.current);
      simTimerRef.current = null;
    }
    setIsSimulating(false);
  };

  // 5. 과거 회의 실시간 시맨틱 추천 연계
  const triggerSemanticRecommendation = async () => {
    if (transcript.length === 0) return;
    
    const lastThree = transcript.slice(-3).map(t => `${t.speaker}: ${t.text}`).join("\n");

    try {
      const res = await fetch("/api/meeting-minutes/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentText: lastThree })
      });
      const data = await res.json();
      if (data.success && data.recommendations) {
        setRecommendedMeetings(data.recommendations);
      }
    } catch (e) {
      console.error("시맨틱 추천 연동 실패:", e);
    }
  };

  // 6. 회의 중 AI 실시간 중간 요약/제언
  const handleGetInterimAdvice = async () => {
    if (transcript.length === 0) {
      alert("회의록에 기록된 대화 내용이 없습니다. 먼저 음성 입력이나 시뮬레이터를 구동해 주세요.");
      return;
    }

    setIsAnalyzingInterim(true);
    setShowInterimModal(true);

    try {
      const res = await fetch("/api/meeting-minutes/interim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript })
      });
      const data = await res.json();
      if (data.success) {
        setInterimAdvice(data.analysis);
      } else {
        setInterimAdvice("AI의 피드백 분석을 가져오는 도중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error("중간 제언 요청 실패:", e);
      setInterimAdvice("네트워크 연결 실패로 인해 중간 요약을 제공할 수 없습니다.");
    } finally {
      setIsAnalyzingInterim(false);
    }
  };

  // 7. 회의 종료 및 AI 종합 분석
  const handleCompleteMeeting = async () => {
    if (transcript.length === 0) {
      alert("대화록이 비어있어 회의를 완료할 수 없습니다.");
      return;
    }

    if (!confirm("회의를 종료하고 AI 종합 요약 및 할 일을 추출하시겠습니까?")) {
      return;
    }

    // 시뮬레이터 및 녹음 자동 중단
    stopSimulation();
    stopSTT();

    setIsCompleting(true);

    try {
      const res = await fetch("/api/meeting-minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          meetingId: selectedMeeting.id,
          transcript: transcript
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedMeeting(data.meeting);
        setTasks(data.tasks || []);
        
        // 이메일 수신자 초기값: 회의 생성 시 입력했던 참석자 목록 바인딩
        let attendeesArr = [];
        try {
          attendeesArr = JSON.parse(data.meeting.attendees || "[]");
        } catch (e) {
          attendeesArr = [];
        }
        setSendRecipients(attendeesArr);
        setMailResult(null);

        setViewMode("detail");
        fetchMeetings(); // 목록 갱신
      } else {
        alert(data.error || "회의 분석 처리에 실패했습니다.");
      }
    } catch (e) {
      console.error("회의 종료 오류:", e);
    } finally {
      setIsCompleting(false);
    }
  };

  // 8. 할 일 체크 상태 변경
  const handleToggleTask = async (taskId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "PENDING" ? "COMPLETED" : "PENDING";
    try {
      const res = await fetch("/api/meeting-minutes/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        // 할 일 상태 로컬 업데이트
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      }
    } catch (e) {
      console.error("할 일 상태 토글 실패:", e);
    }
  };

  // 9. 회의록 및 할 일 메일 발송
  const handleSendEmails = async () => {
    if (sendRecipients.length === 0) {
      alert("메일을 전송할 수신인이 지정되지 않았습니다.");
      return;
    }

    setIsSendingMail(true);
    setMailResult("이메일 발송 서버(SMTP)를 가동하여 배포 중입니다...");

    try {
      const res = await fetch("/api/meeting-minutes/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: selectedMeeting.id,
          recipients: sendRecipients
        })
      });
      const data = await res.json();
      if (data.success) {
        setMailResult(`🎉 이메일 배포 완료! ${data.message}`);
      } else {
        setMailResult(`⚠️ 일부 발송 에러: ${data.error}`);
      }
    } catch (e: any) {
      console.error("메일 발송 에러:", e);
      setMailResult("❌ SMTP 발송 서버 연결 중 타임아웃 오류가 발생했습니다. 시스템 설정의 SMTP 계정을 확인해 주세요.");
    } finally {
      setIsSendingMail(false);
    }
  };

  // 과거 회의록 보기 클릭 시
  const handleViewPastMeeting = async (pastId: number) => {
    try {
      const res = await fetch("/api/meeting-minutes");
      const data = await res.json();
      if (data.success) {
        const past = data.meetings.find((m: any) => m.id === pastId);
        if (past) {
          setViewPastSummary(past);
        }
      }
    } catch (e) {
      console.error("과거 회의 조회 에러:", e);
    }
  };

  // 리스트 모드에서 완료된 회의 카드 클릭 시 상세로 이동
  const handleSelectMeetingCard = (meeting: any) => {
    setSelectedMeeting(meeting);
    fetchTasks(meeting.id);
    
    let attendeesArr = [];
    try {
      attendeesArr = JSON.parse(meeting.attendees || "[]");
    } catch (e) {
      attendeesArr = [];
    }
    setSendRecipients(attendeesArr);
    setMailResult(null);

    // 대화록 복구
    try {
      const parsedTrans = JSON.parse(meeting.transcript || "[]");
      setTranscript(parsedTrans);
    } catch (e) {
      setTranscript([]);
    }

    setViewMode("detail");
  };

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 text-slate-800 animate-fade-in"
      data-easybot-hint="회의 기록 AI: 마이크 STT 및 가상 시뮬레이션을 통해 실시간 대화록을 작성하고, 과거 회의 시맨틱 추천, 종료 후 AI 자동 회의록 기안 및 할일 이메일 발송 기능을 통합 제공합니다.">
      
      {/* 상단 타이틀 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-200 relative z-10 shrink-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            <Mic className="w-8 h-8 text-indigo-600 mr-3" />
            회의 기록 AI
          </h1>
        </div>
        
        {viewMode !== "list" && (
          <button 
            onClick={() => {
              stopSTT();
              stopSimulation();
              setViewMode("list");
              fetchMeetings();
            }}
            className="flex items-center space-x-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-semibold border border-slate-200 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
            <span>회의 목록으로</span>
          </button>
        )}
      </div>

      {/* 1. 회의록 목록 뷰 (List Mode) */}
      {viewMode === "list" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>진행된 회의 대장 ({meetings.length}건)</span>
            </h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-950/10 active:scale-95 transition-all border border-indigo-400/20"
            >
              <Plus className="w-4 h-4" />
              <span>신규 회의 개시</span>
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-16 text-center">
              <Mic className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 font-semibold">아직 기록된 회의록이 없습니다.</p>
              <p className="text-slate-500 text-xs mt-1">우측 상단의 [신규 회의 개시] 버튼을 눌러 첫 번째 회의를 실시간 기록해 보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.map((meeting) => {
                let attCount = 0;
                try {
                  const arr = JSON.parse(meeting.attendees || "[]");
                  attCount = arr.length;
                } catch(e) {}

                return (
                  <div 
                    key={meeting.id}
                    onClick={() => handleSelectMeetingCard(meeting)}
                    className="group bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-indigo-200 rounded-2xl p-5 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${meeting.status === 'ONGOING' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                        {meeting.status === 'ONGOING' ? '🔴 진행 중' : '✅ 완료됨'}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{meeting.date.slice(0, 10)}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition mb-2 truncate">
                      {meeting.title}
                    </h3>
                    
                    <div className="flex items-center space-x-4 text-xs text-slate-500 mt-4 border-t border-slate-100 pt-3">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>참석자 {attCount}명</span>
                      </span>
                      {meeting.summary && (
                        <span className="text-emerald-600 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>AI 요약 완료</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. 회의 진행 중 모드 (Active Recording Mode) */}
      {viewMode === "active" && selectedMeeting && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 대화록 및 관제실 (2단 그리드) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-[650px] relative overflow-hidden shadow-sm">
            {/* 회의 상태 바 */}
            <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                <h2 className="text-base font-bold text-slate-800">{selectedMeeting.title}</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleGetInterimAdvice}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl text-xs font-bold border border-purple-200 transition active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🤖 AI 실시간 제언</span>
                </button>
                <button 
                  onClick={handleCompleteMeeting}
                  disabled={isCompleting}
                  className="flex items-center space-x-1 px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950/10 transition disabled:opacity-50 active:scale-95"
                >
                  {isCompleting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <StopCircle className="w-3.5 h-3.5" />
                  )}
                  <span>회의 종료 및 AI 요약</span>
                </button>
              </div>
            </div>

            {/* 대화 피드 */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
                  <Mic className="w-10 h-10 mb-3 animate-bounce text-slate-300" />
                  <p className="text-sm">마이크를 활성화하거나 AI 시뮬레이션을 시작하여 회의록 기록을 개시하십시오.</p>
                </div>
              ) : (
                transcript.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col ${item.speaker.includes("대표") || item.speaker.includes("나") ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[11px] font-bold text-slate-500">{item.speaker}</span>
                      <span className="text-[9px] text-slate-400">{item.time}</span>
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${item.speaker.includes("대표") || item.speaker.includes("나") ? "bg-indigo-600 text-white rounded-tr-none shadow-sm" : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60"}`}>
                      {item.text}
                    </div>
                  </div>
                ))
              )}
              {currentSpeech && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center space-x-1 mb-1 text-slate-500">
                    <span className="text-[11px] font-bold">{speechSpeaker} (말하는 중)</span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                  </div>
                  <div className="bg-indigo-50 text-indigo-600 italic rounded-2xl rounded-tl-none px-4 py-2.5 text-sm border border-indigo-200/60 max-w-[80%] animate-pulse">
                    {currentSpeech}...
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* STT/시뮬레이터 하단 컨트롤러 */}
            <div className="border-t border-slate-250 pt-4 mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
              {/* 마이크 STT 제어 */}
              <div className="flex flex-col justify-center space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>실시간 마이크 음성 인식 (STT)</span>
                  <select 
                    value={speechSpeaker}
                    onChange={(e) => setSpeechSpeaker(e.target.value)}
                    disabled={isRecording}
                    className="bg-white border border-slate-200 text-slate-700 text-[11px] rounded px-1.5 py-0.5 focus:outline-none shadow-sm cursor-pointer"
                  >
                    <option value="나 (회의 참여자)">나 (회의 참여자)</option>
                    <option value="홍길동 대표">홍길동 대표</option>
                    <option value="김철수 과장">김철수 과장</option>
                    <option value="이영희 대리">이영희 대리</option>
                  </select>
                </div>
                {isRecording ? (
                  <button 
                    onClick={stopSTT}
                    className="flex items-center justify-center space-x-2 w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 text-xs font-bold transition active:scale-95"
                  >
                    <MicOff className="w-4 h-4 animate-pulse" />
                    <span>음성 인식 중지</span>
                  </button>
                ) : (
                  <button 
                    onClick={startSTT}
                    className="flex items-center justify-center space-x-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-950/10 transition active:scale-95"
                  >
                    <Mic className="w-4 h-4" />
                    <span>음성 인식 시작</span>
                  </button>
                )}
              </div>

              {/* 시뮬레이터 제어 */}
              <div className="flex flex-col justify-center space-y-2 border-t md:border-t-0 md:border-l border-slate-200 md:pl-4">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>🧪 AI 실시간 회의 시뮬레이터</span>
                  <select 
                    value={selectedScenarioId}
                    onChange={(e) => setSelectedScenarioId(e.target.value)}
                    disabled={isSimulating}
                    className="bg-white border border-slate-200 text-slate-700 text-[11px] rounded px-1.5 py-0.5 max-w-[120px] truncate focus:outline-none shadow-sm cursor-pointer"
                  >
                    <option value="marketing">마케팅 캠페인 수립</option>
                    <option value="supply_chain">공급망 비상 대책</option>
                  </select>
                </div>
                {isSimulating ? (
                  <button 
                    onClick={stopSimulation}
                    className="flex items-center justify-center space-x-2 w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl border border-amber-200 text-xs font-bold transition active:scale-95"
                  >
                    <StopCircle className="w-4 h-4 animate-spin" />
                    <span>시뮬레이터 중지 ({simIndex}대사)</span>
                  </button>
                ) : (
                  <button 
                    onClick={startSimulation}
                    className="flex items-center justify-center space-x-2 w-full py-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-250 transition active:scale-95 shadow-sm"
                  >
                    <Play className="w-4 h-4 text-purple-600" />
                    <span>시뮬레이터 구동</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 실시간 과거 회의 시맨틱 매칭 추천 사이드바 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-[650px] shadow-sm">
            <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-150 pb-3 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-500 animate-bounce" />
              <span>실시간 과거 회의 매칭 ({recommendedMeetings.length}건)</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {recommendedMeetings.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                  <Sparkles className="w-8 h-8 mb-2 text-indigo-400" />
                  <p className="text-xs">대화 내용이 누적되면 AI가 자동으로 과거 관련 회의록을 실시간 매칭 추천합니다.</p>
                </div>
              ) : (
                recommendedMeetings.map((rec, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleViewPastMeeting(rec.id)}
                    className="group bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl p-4 cursor-pointer transition-all duration-300 shadow-sm relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-200">
                        유사도 {rec.matchRate}%
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-650 transition" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition mb-1">
                      {rec.title}
                    </h4>
                    <p className="text-[11px] text-slate-655 line-clamp-2 leading-relaxed">
                      {rec.reason}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-3">
              <p className="text-[10px] text-slate-500 leading-normal">
                💡 **시맨틱 추천 시스템**: Gemini AI가 현재 대화의 맥락(Context)을 백그라운드로 분석하여 기존 완료된 회의록의 DB 요약을 스캔해 매칭합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. 회의 종료 후 상세/리포트 모드 (Detail View Mode) */}
      {viewMode === "detail" && selectedMeeting && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: AI 종합 회의록 뷰어 & 할일 보드 (2단 그리드) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 회의록 메인 카드 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 text-indigo-600 font-semibold mb-2 text-xs">
                <Clock className="w-4 h-4" />
                <span>{selectedMeeting.date}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">{selectedMeeting.title}</h2>
              
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2 mb-3">
                  <FileText className="w-4.5 h-4.5 text-purple-600" />
                  <span>AI 자동 기안 회의 요약 리포트</span>
                </h3>
                <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  {selectedMeeting.summary || '회의록 요약이 작성되지 않았습니다.'}
                </div>
              </div>
            </div>

            {/* 참석자별 할일(Action Items) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-150 pb-3 mb-4">
                <CheckSquare className="w-4.5 h-4.5 text-emerald-600" />
                <span>추출된 담당자별 할 일 및 일정 ({tasks.length}건)</span>
              </h3>

              {tasks.length === 0 ? (
                <p className="text-xs text-slate-555 text-center py-6">회의 대화록에서 추출된 할 일 항목이 없습니다.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className={`border p-4 rounded-xl cursor-pointer transition-all flex items-start space-x-3 ${task.status === 'COMPLETED' ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-70' : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:border-indigo-200'}`}
                    >
                      <div className="mt-1">
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-400 hover:border-indigo-400 bg-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <span className={`text-xs font-bold truncate ${task.status === 'COMPLETED' ? 'text-slate-400' : 'text-indigo-600'}`}>
                            {task.assignee_name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 text-slate-500 rounded-full font-semibold flex items-center space-x-1 shrink-0">
                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
                            <span>{task.due_date}까지</span>
                          </span>
                        </div>
                        <p className={`text-xs leading-normal ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                          {task.task_desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 회의록 배포 및 참석자 메일 전송 패널 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-fit space-y-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-150 pb-3 mb-1">
              <Mail className="w-5 h-5 text-indigo-650" />
              <span>회의록 메일 배포 관제</span>
            </h3>

            {/* 참석자 이메일 목록 */}
            <div className="space-y-3">
              <label className="text-xs text-slate-500 font-bold block">이메일 발송 대상 임직원</label>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {sendRecipients.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-4">등록된 이메일 대상이 없습니다.</p>
                ) : (
                  sendRecipients.map((rec, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate">{rec.name}</span>
                        <span className="text-[10px] text-slate-500 truncate">{rec.email}</span>
                      </div>
                      <button 
                        onClick={() => setSendRecipients(sendRecipients.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500 p-1 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* 추가 입력 폼 */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <input 
                  type="text" 
                  placeholder="이름"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500 w-full shadow-sm"
                />
                <input 
                  type="text" 
                  placeholder="이메일"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500 w-full shadow-sm"
                />
              </div>
              <button 
                onClick={addAttendee}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition shadow-sm active:scale-95"
              >
                + 참석 대상 수동 추가
              </button>
            </div>

            {/* 발송 실행 */}
            <div className="pt-2 border-t border-slate-150">
              <button 
                onClick={handleSendEmails}
                disabled={isSendingMail}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-650 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-950/10 transition active:scale-95 flex items-center justify-center space-x-2 border border-indigo-400/20"
              >
                {isSendingMail ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 text-indigo-100" />
                )}
                <span>회의록 및 할일 메일 발송 ✉️</span>
              </button>

              {mailResult && (
                <div className={`mt-3 p-3 rounded-lg text-xs font-semibold leading-normal ${mailResult.startsWith("❌") || mailResult.startsWith("⚠️") ? "bg-red-50 border border-red-200 text-red-600" : "bg-green-50 border border-green-200 text-green-600"}`}>
                  {mailResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. 모달: 새 회의 만들기 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                  <Mic className="w-5 h-5 text-indigo-650" />
                  <span>신규 회의 개시 설정</span>
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 회의 제목 */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold block">회의 제목</label>
                <input 
                  type="text" 
                  placeholder="예: 6월 3주차 주간 전사 피드백 회의"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-slate-50 focus:bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-indigo-500 w-full shadow-sm transition-all"
                />
              </div>

              {/* 참석자 정보 */}
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-bold block">참석자 등록 (메일 발송용)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="이름"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    className="bg-slate-50 focus:bg-white border border-slate-200 text-slate-850 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 w-1/3 shadow-sm transition-all"
                  />
                  <input 
                    type="text" 
                    placeholder="이메일"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    className="bg-slate-50 focus:bg-white border border-slate-200 text-slate-850 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 flex-1 shadow-sm transition-all"
                  />
                  <button 
                    onClick={addAttendee}
                    className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition active:scale-95"
                  >
                    추가
                  </button>
                </div>

                {/* 등록된 가참석자 리스트 */}
                {tempAttendees.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-[120px] overflow-y-auto space-y-2">
                    {tempAttendees.map((att, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 font-semibold">{att.name} <span className="text-slate-400 font-normal">({att.email})</span></span>
                        <button onClick={() => removeAttendee(idx)} className="text-red-500 hover:text-red-655 font-semibold">삭제</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 실행 버튼 */}
              <div className="pt-3 border-t border-slate-150 flex justify-end space-x-2">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition"
                >
                  취소
                </button>
                <button 
                  onClick={handleStartMeeting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-950/10 transition active:scale-95"
                >
                  회의 시작 🎙️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. 모달: 과거 회의 요약 뷰어 모달 */}
      {viewPastSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-200 font-bold">참조 과거 회의</span>
                  <h3 className="text-base font-extrabold text-slate-800">{viewPastSummary.title}</h3>
                </div>
                <button onClick={() => setViewPastSummary(null)} className="text-slate-400 hover:text-slate-600 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-3 prose prose-slate max-w-none text-slate-700 text-xs leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                {viewPastSummary.summary || "과거 회의 요약 내용이 존재하지 않습니다."}
              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end">
                <button 
                  onClick={() => setViewPastSummary(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. 모달: AI 실시간 중간 요약/제언 모달 */}
      {showInterimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-purple-500"></div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-600 animate-spin" />
                  <span>🤖 AI 실시간 회의 제언 및 흐름 요약</span>
                </h3>
                <button onClick={() => setShowInterimModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isAnalyzingInterim ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                  <p className="text-xs text-slate-400">현재까지의 대화록을 바탕으로 AI가 실시간 분석 중입니다...</p>
                </div>
              ) : (
                <div className="max-h-[350px] overflow-y-auto space-y-3 prose prose-slate max-w-none text-slate-700 text-xs leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {interimAdvice}
                </div>
              )}

              <div className="pt-3 border-t border-slate-150 flex justify-end">
                <button 
                  onClick={() => setShowInterimModal(false)}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-950/10 transition active:scale-95"
                >
                  이해했습니다
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
