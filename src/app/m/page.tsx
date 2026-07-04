"use client";

import { apiFetch } from '@/lib/api';
import React, { useState, useEffect, useRef } from "react";
import { 
  User, RefreshCw, Layers, Calendar, Scale, Shield, 
  MessageSquare, FileText, CheckCircle2, ChevronRight, 
  AlertTriangle, Play, Check, Send, Upload, X, LogOut, Loader2, ArrowRight,
  Camera, Mic, Trash2, Paperclip, Zap, Sun, Moon
} from "lucide-react";
import Link from "next/link";

interface Operator {
  username: string;
  name: string;
  role?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: string;
  suggestedTypes?: string[]; // 1차 감지 후 선택 가능한 작업들
  previewItems?: any[];      // 2차 파싱된 미리보기 데이터들
  isProcessing?: boolean;
}

const ACTION_LABELS: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  RECEIPT: { label: "영수증 지출 품의", icon: FileText, color: "bg-emerald-500", desc: "영수증 금액, 가맹점, 일자 자동 정산" },
  BUSINESS_CARD: { label: "거래처 명함 등록", icon: User, color: "bg-blue-500", desc: "명함의 인적 정보를 OCR 파싱하여 명함첩 등록" },
  BUSINESS_LICENSE: { label: "사업자등록증 등록", icon: Shield, color: "bg-purple-500", desc: "거래처 등록을 위한 정보 추출 및 국세청 검증" },
  LEGAL_DOCUMENT: { label: "소송/법률 문서 분석", icon: Scale, color: "bg-rose-500", desc: "법원 소장/송달장 요약 및 기한 자동 등록" },
  FINANCIAL_STATEMENT: { label: "재무제표 등록", icon: Layers, color: "bg-amber-500", desc: "회사 자산, 부채, 매출 구조를 정형화 적재" },
  INBOUND_ESTIMATE: { label: "받은 견적서/발주서 연동", icon: ChevronRight, color: "bg-cyan-500", desc: "바이어 발주서 품목을 파싱하여 견적 등록" },
  INVENTORY_INBOUND: { label: "거래명세서 입고", icon: Calendar, color: "bg-indigo-500", desc: "입고 품목과 수량을 바코드/명세서로 자동 처리" },
  RESUME: { label: "이력서 분석", icon: User, color: "bg-teal-500", desc: "지원자 학력, 경력, 매칭 점수 산출" },
  MEDICAL_CERTIFICATE: { label: "병원 진단서(병가)", icon: AlertTriangle, color: "bg-pink-500", desc: "병가 사유 및 마감일 산정" }
};

export default function IntegratedMobilePortal() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>({
    attendance: { clockIn: null, clockOut: null, monthlyDays: 0, monthlyHours: 0 },
    leave: { remainingDays: 15 },
    todo: [],
    done: [],
    approval: { approvedCount: 0, rejectedCount: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 무한 스크롤 및 로딩 개수
  const [visibleTodoCount, setVisibleTodoCount] = useState(10);
  const [visibleDoneCount, setVisibleDoneCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 하단 중앙 '+' FAB 토글
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  // 녹음 모달 상태 및 미디어 스트림
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const recordingTimer = useRef<any>(null);

  // 임시저장 파일 목록
  interface TempFile {
    id: string;
    name: string;
    type: "image" | "video" | "audio" | "file";
    base64: string;
    fileObject: File;
  }
  const [tempFiles, setTempFiles] = useState<TempFile[]>([]);
  const [showTempFilesDrawer, setShowTempFilesDrawer] = useState(false);

  const [activeTab, setActiveTab] = useState<"todo" | "done">("todo");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isDark = theme === "dark";
  const [showHeaderDashboard, setShowHeaderDashboard] = useState(true);
  const lastScrollTop = useRef(0);

  // 이지봇 플로팅 모달 상태
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [botLoading, setBotLoading] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [uploadedBase64, setUploadedBase64] = useState<string>("");
  const [inputText, setInputText] = useState("");
  
  // Ref 변수 선언
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileSearchInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 대시보드 통계 데이터 구조 분해 및 계산
  const attendance = dashboard?.attendance || { clockIn: null, clockOut: null, monthlyDays: 0, monthlyHours: 0 };
  const leave = dashboard?.leave || { remainingDays: 15 };
  const approval = dashboard?.approval || { approvedCount: 0, rejectedCount: 0 };

  const workStatus = attendance.clockOut ? "OUT" : attendance.clockIn ? "WORKING" : "READY";
  const workTime = attendance.clockOut || attendance.clockIn;

  // 날짜 필터링을 제거하고 검색어만 적용하며 최신순 정렬
  const filteredTodo = (dashboard.todo || [])
    .filter((t: any) => {
      const matchesSearch = taskSearchQuery.trim()
        ? (t.title || "").toLowerCase().includes(taskSearchQuery.toLowerCase())
        : true;
      return matchesSearch;
    })
    .sort((a: any, b: any) => {
      const dateA = a.created_at || "";
      const dateB = b.created_at || "";
      return dateB.localeCompare(dateA);
    });

  const filteredDone = (dashboard.done || [])
    .filter((t: any) => {
      const matchesSearch = taskSearchQuery.trim()
        ? (t.title || "").toLowerCase().includes(taskSearchQuery.toLowerCase())
        : true;
      return matchesSearch;
    })
    .sort((a: any, b: any) => {
      const dateA = a.completed_at || a.updated_at || "";
      const dateB = b.completed_at || b.updated_at || "";
      return dateB.localeCompare(dateA);
    });

  const displayedTodo = filteredTodo.slice(0, visibleTodoCount);
  const displayedDone = filteredDone.slice(0, visibleDoneCount);

  // 태스크 완료 상태 토글 처리
  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "ACTIVE" ? "COMPLETED" : "ACTIVE";
      const res = await apiFetch("/api/snaptasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      } else {
        alert(data.error || "작업 상태 변경 실패");
      }
    } catch (err: any) {
      alert(`작업 업데이트 에러: ${err.message}`);
    }
  };

  // 상위 레이아웃 스크롤 이벤트 바인딩 (이중 스크롤 제거 대응)
  useEffect(() => {
    const layoutMain = document.querySelector("body > main");
    if (!layoutMain) return;

    const handleLayoutScroll = () => {
      const scrollTop = layoutMain.scrollTop;
      const scrollHeight = layoutMain.scrollHeight;
      const clientHeight = layoutMain.clientHeight;

      // 1. 대시보드 토글
      if (scrollTop > lastScrollTop.current && scrollTop > 40) {
        setShowHeaderDashboard(false);
      } else if (scrollTop < lastScrollTop.current) {
        setShowHeaderDashboard(true);
      }
      if (scrollTop <= 5) {
        setShowHeaderDashboard(true);
      }
      lastScrollTop.current = scrollTop;

      // 2. 무한 스크롤 바닥 감지 (바닥 근처 150px)
      const isBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (isBottom && !isLoadingMore) {
        const currentFilteredCount = activeTab === "todo" ? filteredTodo.length : filteredDone.length;
        const currentVisibleCount = activeTab === "todo" ? visibleTodoCount : visibleDoneCount;

        if (currentVisibleCount < currentFilteredCount) {
          setIsLoadingMore(true);
          setTimeout(() => {
            if (activeTab === "todo") {
              setVisibleTodoCount(prev => prev + 10);
            } else {
              setVisibleDoneCount(prev => prev + 10);
            }
            setIsLoadingMore(false);
          }, 600);
        }
      }
    };

    layoutMain.addEventListener("scroll", handleLayoutScroll);
    return () => {
      layoutMain.removeEventListener("scroll", handleLayoutScroll);
    };
  }, [activeTab, filteredTodo.length, filteredDone.length, visibleTodoCount, visibleDoneCount, isLoadingMore]);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const res = await apiFetch("/api/m/dashboard");
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.currentUser);
        
        // 🧪 UI 검증용 가짜 데이터 주입 (UI 확인 완료 후 이 block 전체를 삭제하고 setDashboard(data.dashboard)로 원복하세요)
        const fakeDoneTasks = Array.from({ length: 20 }, (_, i) => ({
          id: `fake-done-${i}`,
          title: `[UI 테스트용] 완료된 가짜 업무 피드 #${20 - i} (무한 스크롤 검증)`,
          status: "COMPLETED",
          created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - i * 30 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - i * 30 * 60 * 1000).toISOString()
        }));

        setDashboard({
          ...data.dashboard,
          done: [...(data.dashboard.done || []), ...fakeDoneTasks]
        });
      }
    } catch (err) {
      console.error("Dashboard data load fail:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // 초기 이지봇 메시지 구성
    setChatMessages([
      {
        id: "welcome",
        role: "bot",
        content: "반갑습니다! 이지데스크 스마트 비서 이지봇입니다. 🤖\n현장의 사진, 영수증, 명함 또는 PDF 서류를 보내주시거나 '메뉴'라고 말씀해 주시면 처리 가능한 업무 목록을 추천해 드리겠습니다. 💬✨",
        timestamp: getFormattedTime()
      }
    ]);
  }, []);

  useEffect(() => {
    // 탭 변경 시 표시 개수 초기화
    setVisibleTodoCount(10);
    setVisibleDoneCount(10);
  }, [activeTab]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, botLoading]);

  const getFormattedTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "오후" : "오전";
    const formattedHours = hours % 12 || 12;
    return `${ampm} ${formattedHours}:${minutes}`;
  };

  // 임시저장소 파일 추가 헬퍼
  const handleAddTempFile = (file: File, type: "image" | "video" | "audio" | "file") => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newTemp: TempFile = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type,
        base64,
        fileObject: file
      };
      setTempFiles(prev => [...prev, newTemp]);
      setShowTempFilesDrawer(true); // 수집 후 임시저장 드로워 오픈
    };
    reader.readAsDataURL(file);
  };

  // 다중 미디어 수집용 핸들러들
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith("video/");
      handleAddTempFile(file, isVideo ? "video" : "image");
    }
  };

  const handleFileSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let type: "image" | "video" | "audio" | "file" = "file";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";
      else if (file.type.startsWith("audio/")) type = "audio";
      handleAddTempFile(file, type);
    }
  };

  // 음성 녹음 제어 함수
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `voice-record-${Date.now()}.webm`, { type: blob.type });
        handleAddTempFile(file, "audio");
        
        // 스트림 해제
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert(`마이크 권한을 획득하지 못했습니다: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }
  };

  // 임시저장 파일 이지봇으로 최종 전달(전송)
  const sendTempFilesToBot = async () => {
    if (tempFiles.length === 0) return;

    setIsBotOpen(true);
    setBotLoading(true);
    setShowTempFilesDrawer(false);

    for (const tempFile of tempFiles) {
      const timeStr = getFormattedTime();

      setChatMessages(prev => [
        ...prev,
        {
          id: `user-temp-${Date.now()}-${tempFile.id}`,
          role: "user",
          content: `📁 [임시저장 전송] ${tempFile.name} (${tempFile.type})`,
          timestamp: timeStr
        }
      ]);

      if (tempFile.type === "image") {
        try {
          const response = await apiFetch("/api/easybot/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: tempFile.base64, action: "detect_actions" })
          });
          const result = await response.json();
          if (result.success && result.suggestedTypes && result.suggestedTypes.length > 0) {
            setUploadedBase64(tempFile.base64);
            setChatMessages(prev => [
              ...prev,
              {
                id: `bot-actions-${Date.now()}-${tempFile.id}`,
                role: "bot",
                content: `[${tempFile.name}] 판독 결과, 수행할 수 있는 작업 목록입니다.`,
                timestamp: getFormattedTime(),
                suggestedTypes: result.suggestedTypes
              }
            ]);
          } else {
            setChatMessages(prev => [
              ...prev,
              {
                id: `bot-msg-${Date.now()}`,
                role: "bot",
                content: `🤖 [${tempFile.name}] 파일 분석을 완료하였으나, 특정 서류 형식을 식별하지 못했습니다. 명함, 영수증, 사업자등록증 등을 명확히 촬영해 주세요.`,
                timestamp: getFormattedTime()
              }
            ]);
          }
        } catch (e: any) {
          console.error(e);
        }
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-msg-${Date.now()}`,
            role: "bot",
            content: `🤖 [${tempFile.name}] (${tempFile.type}) 파일을 정상적으로 수신했습니다. 해당 자료를 기반으로 하실 업무를 지시해 주시기 바랍니다.`,
            timestamp: getFormattedTime()
          }
        ]);
      }
    }

    setTempFiles([]);
    setBotLoading(false);
  };

  const handlePunchIn = async () => {
    try {
      const res = await apiFetch("/api/hr/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLOCK_IN", memo: "모바일 포털 간편 출근 등록" })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchDashboardData();
      } else {
        alert(data.error || "출근 등록에 실패했습니다.");
      }
    } catch (err: any) {
      alert(`출근 등록 에러: ${err.message}`);
    }
  };

  const handlePunchOut = async () => {
    try {
      const res = await apiFetch("/api/hr/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLOCK_OUT", memo: "모바일 포털 간편 퇴근 등록" })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchDashboardData();
      } else {
        alert(data.error || "퇴근 등록에 실패했습니다.");
      }
    } catch (err: any) {
      alert(`퇴근 등록 에러: ${err.message}`);
    }
  };

  const handleQuickLink = (taskType: string) => {
    setIsBotOpen(true);
    let textPrompt = "";
    if (taskType === "cert") textPrompt = "📄 재직증명서 발급 신청해줘";
    else if (taskType === "labor") textPrompt = "⚖️ 노무 리스크 AI 상담 시작";
    else if (taskType === "tbm") textPrompt = "👷 안전 TBM 수립 기록해줘";
    else if (taskType === "ncr") textPrompt = "⚠️ 품질 부적합(NCR) 등록해줘";
    else if (taskType === "facility") textPrompt = "🔧 설비 예지보전 AI 분석 요청";
    else if (taskType === "safety-detect") textPrompt = "👁️ 위험 비전 감지 AI 작동";
    else if (taskType === "expense") textPrompt = "💸 영수증 지출 결재 신청할게";
    else if (taskType === "estimate") textPrompt = "📦 스마트 견적/발주서 연동해줘";
    else if (taskType === "order") textPrompt = "🛍️ 모바일 주문 수주 등록";
    else if (taskType === "grant") textPrompt = "📊 정책자금 추천 AI 실행";
    else if (taskType === "snaptask") textPrompt = "📝 모바일 작업지시 생성";
    else if (taskType === "business-card") textPrompt = "💳 거래처 명함 등록해줘";
    else if (taskType === "lawyer") textPrompt = "⚖️ AI 법률 상담 시작해줘";
    else if (taskType === "credit-risk") textPrompt = "🪙 채권 신용 관리 조회";
    else if (taskType === "menu") textPrompt = "메뉴";
    else textPrompt = `${taskType} 업무 시작`;

    handleSendTextMessage(textPrompt);
  };

  const handleSendTextMessage = async (customText?: string) => {
    const text = (customText || inputText).trim();
    if (!text) return;

    if (!customText) {
      setInputText("");
    }

    const timeStr = getFormattedTime();

    setChatMessages(prev => [
      ...prev,
      {
        id: `user-text-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: timeStr
      }
    ]);

    // 예약어 가로채기
    const lowerText = text.toLowerCase();
    if (lowerText === "메뉴" || lowerText === "전체 메뉴" || lowerText === "업무" || lowerText === "전체 업무 메뉴") {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-menu-${Date.now()}`,
            role: "bot",
            content: "이지봇이 지원하는 핵심 업무 목록입니다. 원하시는 업무 카드를 터치하여 사진이나 관련 문서를 업로드해 주세요! 🤖✨",
            timestamp: getFormattedTime(),
            suggestedTypes: ["RECEIPT", "BUSINESS_CARD", "LEGAL_DOCUMENT", "BUSINESS_LICENSE", "FINANCIAL_STATEMENT", "MEDICAL_CERTIFICATE"]
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("재직증명서") || text.includes("증명서")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-cert-${Date.now()}`,
            role: "bot",
            content: "📄 **재직증명서 AI 발급 업무**를 시작합니다.\n증명서로 가공할 사원 정보 문서나 관련 메모 사진을 업로드해 주세요! AI가 스캔하여 발급 양식을 띄워드립니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("지출 결재") || text.includes("영수증") || text.includes("지출 품의") || text.includes("지출 내역")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-exp-${Date.now()}`,
            role: "bot",
            content: "💸 **영수증 지출 결재 신청 업무**를 시작합니다.\n경비 정산할 실물 영수증 사진을 올려주시면, AI OCR이 가맹점명, 일자, 금액을 자동 판독하여 품의서를 작성합니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("안전 TBM") || text.includes("TBM")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-tbm-${Date.now()}`,
            role: "bot",
            content: "👷 **안전 TBM 수립 기록 업무**를 시작합니다.\n오늘 실시한 현장 미팅 사진이나 자율 TBM 기록 문서를 보내주시면, AI가 회의 내용과 참석인원을 분석하여 일지에 적재합니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("품질") || text.includes("NCR")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-ncr-${Date.now()}`,
            role: "bot",
            content: "⚠️ **품질 부적합(NCR) 등록 업무**를 시작합니다.\n문제가 발생한 부품 사진 또는 품질 성적서 사진을 업로드해 주십시오. AI가 불량 원인을 진단하여 SPC 장부에 기입합니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("노무")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-labor-${Date.now()}`,
            role: "bot",
            content: "⚖️ **노무 리스크 AI 상담 업무**를 시작합니다.\n검토를 원하시는 근로 계약서나 노무 관련 서류 PDF를 올려주시면 AI가 법적 취약점을 분석해 드립니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("설비") || text.includes("예지보전")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-facility-${Date.now()}`,
            role: "bot",
            content: "🔧 **설비 예지보전 AI 분석 업무**를 시작합니다.\n대상 장비(예: CP-500 프레스)의 진동 주파수 스펙트럼 데이터 또는 모니터 사진을 보내주시면 결함 상태를 감지합니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("위험") || text.includes("비전")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-safety-${Date.now()}`,
            role: "bot",
            content: "👁️ **위험 비전 감지 AI 업무**를 시작합니다.\n공장 전경이나 특정 작업 구역 CCTV 스냅샷 사진을 올려주시면, 안전모 미착용이나 위험 구역 침범 상태를 자동 식별합니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("견적") || text.includes("발주")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-est-${Date.now()}`,
            role: "bot",
            content: "📦 **받은 견적서/발주서 연동 업무**를 시작합니다.\n바이어로부터 전송받은 실물 견적서/발주서 PDF 파일이나 캡처 사진을 전송해 주세요. 품목을 OCR 스캔하여 견적 시스템에 자동 연동합니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("주문") || text.includes("수주")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-order-${Date.now()}`,
            role: "bot",
            content: "🛍️ **모바일 주문 수주 등록 업무**를 시작합니다.\n주문이 발생한 발주 요청 문서나 텍스트 발주 메시지 캡처본을 업로드해주시면, AI가 고객 정보와 상품 수량을 매핑하여 주문을 등록합니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("지원금") || text.includes("정책자금")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-grant-${Date.now()}`,
            role: "bot",
            content: "📊 **정책자금 추천 AI 서비스**를 시작합니다.\n회사 소개서나 R&D 계획 초안 PDF 파일을 보내주시면, AI가 정부 공고 DB를 스캔하여 매칭 가능한 지원금 사업을 제안합니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("작업지시") || text.includes("스냅태스크")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-task-${Date.now()}`,
            role: "bot",
            content: "📝 **모바일 작업지시 생성 업무**를 시작합니다.\n지시 내용이 담긴 문서 사진이나 지시서 텍스트 메모를 전송해 주십시오. AI가 스냅태스크를 자동으로 생성하여 담당자에게 배정합니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("명함")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-card-${Date.now()}`,
            role: "bot",
            content: "💳 **거래처 명함 등록 업무**를 시작합니다.\n전송받은 명함 사진을 카메라로 찍어 보내주시면, AI OCR이 성명, 연락처, 이메일 주소를 분석하여 거래처 명함첩에 등록합니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("법률") || text.includes("소송")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-law-${Date.now()}`,
            role: "bot",
            content: "⚖️ **AI 법률 상담 서비스**를 시작합니다.\n법률 검토가 필요하신 계약서 문서나 소장 사진을 보내주시면, AI가 독소 조항 유무 및 대응 방향을 알려드립니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    if (text.includes("채권") || text.includes("신용")) {
      setBotLoading(true);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-scenario-risk-${Date.now()}`,
            role: "bot",
            content: "🪙 **채권 신용 관리 분석 업무**를 시작합니다.\n거래처의 최근 재무제표나 기업 개요 자료를 보내주시면, 부도 위험 및 여신 한도 추천액을 보고해 드립니다.",
            timestamp: getFormattedTime()
          }
        ]);
        setBotLoading(false);
      }, 550);
      return;
    }

    setBotLoading(true);
    try {
      const response = await apiFetch("/api/easybot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          chatHistory: chatMessages.map(m => ({ role: m.role, content: m.content })),
          currentUrl: "/m"
        })
      });

      const data = await response.json();
      if (data.success && data.reply) {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-reply-${Date.now()}`,
            role: "bot",
            content: data.reply,
            timestamp: getFormattedTime()
          }
        ]);
      } else {
        throw new Error(data.error || "답변 획득 실패");
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `bot-reply-err-${Date.now()}`,
          role: "bot",
          content: `⚠️ 비서 처리 중 오류가 발생했습니다: ${err.message}`,
          timestamp: getFormattedTime()
        }
      ]);
    } finally {
      setBotLoading(false);
    }
  };

  // 이지봇 파일 업로드
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBotLoading(true);
    setSelectedActions([]);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;
      setUploadedBase64(base64Str);

      const timeStr = getFormattedTime();
      setChatMessages(prev => [
        ...prev,
        {
          id: `user-upload-${Date.now()}`,
          role: "user",
          content: `📁 파일을 업로드했습니다: ${file.name}`,
          timestamp: timeStr
        }
      ]);

      try {
        const response = await apiFetch("/api/easybot/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Str, action: "detect_actions" })
        });

        const result = await response.json();

        if (result.success && result.suggestedTypes && result.suggestedTypes.length > 0) {
          setChatMessages(prev => [
            ...prev,
            {
              id: `bot-actions-${Date.now()}`,
              role: "bot",
              content: "업로드하신 문서를 판독한 결과, 다음 작업들을 수행할 수 있습니다. 처리하고 싶으신 작업을 모두 선택해 주세요! (복수 선택 가능)",
              timestamp: getFormattedTime(),
              suggestedTypes: result.suggestedTypes
            }
          ]);
        } else {
          setChatMessages(prev => [
            ...prev,
            {
              id: `bot-error-${Date.now()}`,
              role: "bot",
              content: "⚠️ 업로드하신 문서의 형식을 파악하지 못했습니다. 명함, 영수증, 사업자등록증 등을 다시 깨끗하게 촬영해서 보내주세요.",
              timestamp: getFormattedTime()
            }
          ]);
        }
      } catch (err: any) {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-error-${Date.now()}`,
            role: "bot",
            content: `❌ 분석 중 오류가 발생했습니다: ${err.message}`,
            timestamp: getFormattedTime()
          }
        ]);
      } finally {
        setBotLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleActionSelection = (type: string) => {
    setSelectedActions(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const submitSelectedActions = async () => {
    if (selectedActions.length === 0 || !uploadedBase64) return;

    setBotLoading(true);
    const timeStr = getFormattedTime();

    setChatMessages(prev => [
      ...prev,
      {
        id: `user-confirm-${Date.now()}`,
        role: "user",
        content: `선택한 작업 (${selectedActions.map(t => ACTION_LABELS[t]?.label || t).join(", ")}) 처리를 시작합니다.`,
        timestamp: timeStr
      }
    ]);

    try {
      const response = await apiFetch("/api/easybot/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: uploadedBase64, 
          action: "parse_items", 
          selectedTypes: selectedActions 
        })
      });

      const result = await response.json();

      if (result.success && result.detectedItems && result.detectedItems.length > 0) {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-preview-${Date.now()}`,
            role: "bot",
            content: "AI 정밀 파싱 결과가 산출되었습니다. 아래 미리보기 정보를 확인하고 [최종 등록 승인]을 완료해 주세요.",
            timestamp: getFormattedTime(),
            previewItems: result.detectedItems.map((item: any) => ({
              ...item,
              isApproved: false,
              isApproving: false
            }))
          }
        ]);
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot-fail-${Date.now()}`,
            role: "bot",
            content: "정밀 분석 결과를 추출하지 못했습니다. 다시 시도해 주세요.",
            timestamp: getFormattedTime()
          }
        ]);
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `bot-fail-${Date.now()}`,
          role: "bot",
          content: `❌ 정밀 파싱 에러: ${err.message}`,
          timestamp: getFormattedTime()
        }
      ]);
    } finally {
      setBotLoading(false);
    }
  };

  const updatePreviewField = (msgId: string, itemIdx: number, fieldName: string, value: any) => {
    setChatMessages(prev => 
      prev.map(msg => {
        if (msg.id === msgId && msg.previewItems) {
          const updatedItems = [...msg.previewItems];
          updatedItems[itemIdx] = {
            ...updatedItems[itemIdx],
            data: {
              ...updatedItems[itemIdx].data,
              [fieldName]: value
            }
          };
          return { ...msg, previewItems: updatedItems };
        }
        return msg;
      })
    );
  };

  const approvePreviewItem = async (msgId: string, itemIdx: number) => {
    let targetItem: any = null;

    setChatMessages(prev => 
      prev.map(msg => {
        if (msg.id === msgId && msg.previewItems) {
          const updatedItems = [...msg.previewItems];
          targetItem = updatedItems[itemIdx];
          updatedItems[itemIdx] = { ...targetItem, isApproving: true };
          return { ...msg, previewItems: updatedItems };
        }
        return msg;
      })
    );

    if (!targetItem) return;

    try {
      const confirmRes = await apiFetch("/api/easybot/ocr/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileType: targetItem.itemType,
          ...targetItem.data
        })
      });

      const confirmData = await confirmRes.json();

      if (confirmData.success) {
        setChatMessages(prev => 
          prev.map(msg => {
            if (msg.id === msgId && msg.previewItems) {
              const updatedItems = [...msg.previewItems];
              updatedItems[itemIdx] = { ...targetItem, isApproved: true, isApproving: false };
              return { ...msg, previewItems: updatedItems };
            }
            return msg;
          })
        );

        setChatMessages(prev => [
          ...prev,
          {
            id: `approved-notify-${Date.now()}`,
            role: "bot",
            content: `✅ [${ACTION_LABELS[targetItem.itemType]?.label || targetItem.itemType}] 처리가 무사히 완료되어 안전하게 DB에 적재되었습니다! 🎉`,
            timestamp: getFormattedTime()
          }
        ]);

        fetchDashboardData();
      } else {
        throw new Error(confirmData.error || "등록 확정에 실패했습니다.");
      }
    } catch (err: any) {
      setChatMessages(prev => 
        prev.map(msg => {
          if (msg.id === msgId && msg.previewItems) {
            const updatedItems = [...msg.previewItems];
            updatedItems[itemIdx] = { ...targetItem, isApproving: false };
            return { ...msg, previewItems: updatedItems };
          }
          return msg;
        })
      );

      alert(`처리에 실패했습니다: ${err.message}`);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"} flex flex-col antialiased transition-colors duration-300`}>
      
      {/* 1. 모바일 앱 스타일 헤더 (인라인 스타일로 높이 56px 고정) */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 flex items-center justify-between transition-colors duration-300 ${isDark ? "bg-slate-950/80 border-slate-800 text-slate-100" : "bg-white/80 border-slate-200 text-slate-850"}`} style={{ height: '56px' }}>
        <div className="text-left">
          <h1 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            EGDesk Smart Portal
          </h1>
          <p className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Employee Workspace
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 테마 토글 버튼 */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark 
                ? "text-amber-400 hover:bg-slate-800 hover:text-amber-300" 
                : "text-indigo-650 hover:bg-slate-100 hover:text-indigo-700"
            }`}
            title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark 
                ? "text-slate-400 hover:bg-slate-800 hover:text-white" 
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* 2. 메인 콘텐츠 대시보드 (자체 스크롤을 제거하고 단일 레이아웃 스크롤에 맞춤) */}
      <div className="flex-1 w-full max-w-md mx-auto pb-20">
        
        {/* 로딩 표시 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400 font-bold">실시간 포털 데이터를 불러오고 있습니다...</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 컴팩트 대시보드 영역 (스크롤 감지에 의해 위로 슬라이딩되며 숨김/노출) */}
            <div className={`transition-all duration-300 ease-in-out transform origin-top overflow-hidden ${
              showHeaderDashboard 
                ? "max-h-[300px] opacity-100 scale-y-100 mb-2 px-4 pt-4" 
                : "max-h-0 opacity-0 scale-y-0 overflow-hidden pointer-events-none mb-0 px-0 pt-0"
            }`}>
              {/* 컴팩트 요약 대시보드 카드 */}
              <div className={`relative overflow-hidden rounded-2xl border p-3 shadow-xl space-y-3 transition-colors duration-300 ${isDark ? "bg-gradient-to-b from-slate-950 to-slate-900 border-slate-800" : "bg-gradient-to-b from-white to-slate-50 border-slate-200"}`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <User className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <h3 className={`text-xs font-black flex items-center gap-1.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                        {currentUser?.name || "임직원"}
                        {currentUser?.role === "SUPER_ADMIN" && (
                          <span className="text-[7px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded uppercase">
                            최고
                          </span>
                        )}
                      </h3>
                      <p className={`text-[8px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>{currentUser?.username || ""}</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 items-center">
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
                      <span className={`w-1 h-1 rounded-full ${workStatus === "WORKING" ? "bg-green-500" : "bg-red-500"}`} />
                      <span className={`text-[7.5px] font-black ${isDark ? "text-slate-300" : "text-slate-650"}`}>
                        {workStatus === "WORKING" ? "근무중" : "대기"}
                      </span>
                    </div>
                    
                    {/* 출퇴근 미니 토글 단추 */}
                    {workStatus === "READY" && (
                      <button
                        onClick={handlePunchIn}
                        className="px-2 py-0.5 text-[8.5px] font-black text-white bg-cyan-600 rounded hover:bg-cyan-500 active:scale-95 transition-all"
                      >
                        출근
                      </button>
                    )}
                    {workStatus === "WORKING" && (
                      <button
                        onClick={handlePunchOut}
                        className="px-2 py-0.5 text-[8.5px] font-black text-white bg-indigo-600 rounded hover:bg-indigo-500 active:scale-95 transition-all"
                      >
                        퇴근
                      </button>
                    )}
                    {workStatus === "OUT" && (
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded ${isDark ? "text-slate-500 bg-slate-800" : "text-slate-400 bg-slate-100"}`}>
                        마감
                      </span>
                    )}
                  </div>
                </div>

                {/* 3열 콤팩트 요약 그리드 */}
                <div className={`grid grid-cols-3 gap-2 pt-2 border-t text-[8.5px] ${isDark ? "border-slate-800/80" : "border-slate-200"}`}>
                  <div className={`p-1.5 rounded-lg border text-center transition-colors duration-300 ${isDark ? "bg-slate-900/50 border-slate-800/60" : "bg-slate-100/60 border-slate-200"}`}>
                    <span className={`font-bold block mb-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>근무 (당월)</span>
                    <span className="font-black text-emerald-500">{attendance.monthlyDays}일 / {attendance.monthlyHours}시간</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border text-center transition-colors duration-300 ${isDark ? "bg-slate-900/50 border-slate-800/60" : "bg-slate-100/60 border-slate-200"}`}>
                    <span className={`font-bold block mb-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>연차 잔여</span>
                    <span className="font-black text-purple-500">{leave.remainingDays.toFixed(1)}일</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border text-center transition-colors duration-300 ${isDark ? "bg-slate-900/50 border-slate-800/60" : "bg-slate-100/60 border-slate-200"}`}>
                    <span className={`font-bold block mb-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>결재 (오늘)</span>
                    <span className="font-black text-indigo-500">승 {approval.approvedCount} / 반 {approval.rejectedCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 할 일 / 한 일 일자별 리스트 탭 위젯 */}
            <div className={`transition-colors duration-300 ${isDark ? "bg-slate-950/60 border-t border-b border-slate-800" : "bg-slate-100/60 border-t border-b border-slate-200"}`}>
              
              {/* Sticky 탭바 & 검색창 (헤더 높이 56px 아래에 딱 고정되도록 인라인 스타일로 top: 56px 지정) */}
              <div className={`sticky z-30 backdrop-blur-md border-b transition-colors duration-300 ${isDark ? "bg-slate-950/90 border-slate-800" : "bg-white/95 border-slate-200"}`} style={{ top: '56px' }}>
                {/* 트위터 스타일 탭바 */}
                <div className={`flex border-b ${isDark ? "border-slate-800/40" : "border-slate-200"}`}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("todo")}
                    className="flex-1 py-3 text-center relative font-bold text-xs transition-colors focus:outline-hidden"
                  >
                    <span className={activeTab === "todo" ? (isDark ? "text-cyan-400" : "text-cyan-600") : (isDark ? "text-slate-400" : "text-slate-500")}>
                      해야할 일 ({filteredTodo.length})
                    </span>
                    {activeTab === "todo" && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-cyan-500 rounded-full" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("done")}
                    className="flex-1 py-3 text-center relative font-bold text-xs transition-colors focus:outline-hidden"
                  >
                    <span className={activeTab === "done" ? (isDark ? "text-indigo-400" : "text-indigo-650") : (isDark ? "text-slate-400" : "text-slate-500")}>
                      한 일 ({filteredDone.length})
                    </span>
                    {activeTab === "done" && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-indigo-500 rounded-full" />
                    )}
                  </button>
                </div>
                
                {/* 검색창 */}
                <div className={`px-4 py-2 transition-colors duration-300 ${isDark ? "bg-slate-950/40" : "bg-slate-50/80"}`}>
                  <input
                    type="text"
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    placeholder={activeTab === "todo" ? "해야할 일 제목 검색..." : "한 일 제목 검색..."}
                    className={`w-full rounded-xl px-3 py-1.5 text-[10px] transition-colors focus:outline-hidden ${isDark ? "bg-slate-900 border-slate-800 text-slate-300 placeholder-slate-500 focus:border-cyan-500" : "bg-white border-slate-200 text-slate-850 placeholder-slate-400 focus:border-cyan-650 shadow-inner"}`}
                  />
                </div>
              </div>

              {/* 목록 렌더링 (트위터/SNS형 세로 무한 스크롤 지원) */}
              <div className="px-4 py-4">
                {activeTab === "todo" ? (
                  <div className="flex flex-col gap-2.5 w-full">
                    {displayedTodo.length === 0 ? (
                      <div className={`text-center py-10 border border-dashed rounded-xl w-full ${isDark ? "border-slate-850 bg-slate-900/20" : "border-slate-300 bg-slate-100/40"}`}>
                        <CheckCircle2 className="w-6 h-6 text-slate-750 mx-auto mb-1.5" />
                        <p className={`text-[9px] font-bold ${isDark ? "text-slate-500" : "text-slate-450"}`}>해야할 일이 없습니다.</p>
                      </div>
                    ) : (
                      displayedTodo.map((task: any) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-3 border rounded-xl transition-all duration-300 w-full shadow-sm ${isDark ? "bg-slate-900 border-slate-800 hover:border-slate-750 text-slate-100" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-850"}`}
                        >
                          <div className="flex items-start gap-2.5 text-left">
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(task.id, task.status)}
                              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isDark ? "border-slate-700 hover:border-cyan-500" : "border-slate-350 hover:border-cyan-600"}`}
                            >
                              <span className="w-2 h-2 rounded-sm bg-transparent" />
                            </button>
                            <div>
                              <h5 className={`text-[10px] font-black ${isDark ? "text-slate-200" : "text-slate-800"}`}>{task.title}</h5>
                              <p className={`text-[8px] font-medium mt-0.5 ${isDark ? "text-slate-500" : "text-slate-450"}`}>
                                기한: {task.due_date || "없음"} | 생성: {task.created_at?.slice(0, 16)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleQuickLink(`📝 스냅태스크 ${task.title} 분석`)}
                            className="text-[8px] font-black text-cyan-400 hover:text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 px-1.5 py-0.5 rounded animate-pulse"
                          >
                            AI 연동
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 w-full">
                    {displayedDone.length === 0 ? (
                      <div className={`text-center py-10 border border-dashed rounded-xl w-full ${isDark ? "border-slate-850 bg-slate-900/20" : "border-slate-300 bg-slate-100/40"}`}>
                        <Layers className="w-6 h-6 text-slate-755 mx-auto mb-1.5" />
                        <p className={`text-[9px] font-bold ${isDark ? "text-slate-500" : "text-slate-450"}`}>완료된 일이 없습니다.</p>
                      </div>
                    ) : (
                      displayedDone.map((task: any) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-3 border rounded-xl opacity-75 w-full shadow-xs transition-colors duration-300 ${isDark ? "bg-slate-900/40 border-slate-850 text-slate-300" : "bg-slate-100/60 border-slate-200 text-slate-700"}`}
                        >
                          <div className="flex items-start gap-2.5 text-left">
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(task.id, task.status)}
                              className="mt-0.5 w-4 h-4 rounded border border-cyan-500 bg-cyan-600/10 flex items-center justify-center text-cyan-400"
                            >
                              <Check className="w-2.5 h-2.5" />
                            </button>
                            <div>
                              <h5 className={`text-[10px] font-black line-through ${isDark ? "text-slate-400" : "text-slate-450"}`}>{task.title}</h5>
                              <p className={`text-[8px] font-medium mt-0.5 ${isDark ? "text-slate-500" : "text-slate-450"}`}>
                                완료: {task.updated_at?.slice(0, 16)}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[7.5px] font-black px-1.5 py-0.5 rounded border ${isDark ? "text-slate-500 bg-slate-800 border-slate-700" : "text-slate-500 bg-slate-100 border-slate-200"}`}>
                            완료됨
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 무한 스크롤 추가 로드 스피너 */}
                {isLoadingMore && (
                  <div className="flex items-center justify-center py-4 space-x-2">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-[8.5px] text-slate-500 font-bold">과거 목록을 불러오고 있습니다...</span>
                  </div>
                )}

                {/* 모든 데이터를 확인했을 때의 메시지 */}
                {!isLoadingMore && (
                  (() => {
                    const currentFilteredCount = activeTab === "todo" ? filteredTodo.length : filteredDone.length;
                    const currentVisibleCount = activeTab === "todo" ? visibleTodoCount : visibleDoneCount;
                    if (currentFilteredCount > 0 && currentVisibleCount >= currentFilteredCount) {
                      return (
                        <div className="text-center py-4 text-slate-600 text-[8.5px] font-bold">
                          ✨ 모든 업무 피드를 확인했습니다.
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. 모바일 이지봇 및 다중 미디어 수집 플로팅 버튼 */}
      
      {/* 숨겨진 미디어 input 모음 */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleCameraCapture}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleCameraCapture}
        accept="video/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={fileSearchInputRef}
        onChange={handleFileSearch}
        accept="*/*"
        className="hidden"
      />

      {/* 3-1. 하단 중앙 다중 미디어 FAB (+) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        {/* 서브 FAB 메뉴 (메뉴 오픈 시 나타남) */}
        <div className={`flex flex-col gap-3 mb-4 items-center transition-all duration-300 transform origin-bottom ${
          isFabMenuOpen 
            ? "translate-y-0 opacity-100 scale-100 pointer-events-auto" 
            : "translate-y-8 opacity-0 scale-75 pointer-events-none"
        }`}>
          {/* 카메라 촬영 */}
          <button
            type="button"
            onClick={() => {
              setIsFabMenuOpen(false);
              cameraInputRef.current?.click();
            }}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20 active:scale-90 transition-transform relative group"
            title="카메라 촬영"
          >
            <span className="text-[9px] font-black absolute -left-18 bg-slate-950/90 text-slate-100 border border-slate-800 px-2 py-0.5 rounded shadow-md whitespace-nowrap">📸 사진 촬영</span>
            <Camera className="w-4 h-4" />
          </button>
          
          {/* 동영상 촬영 */}
          <button
            type="button"
            onClick={() => {
              setIsFabMenuOpen(false);
              videoInputRef.current?.click();
            }}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/20 active:scale-90 transition-transform relative group"
            title="동영상 촬영"
          >
            <span className="text-[9px] font-black absolute -left-18 bg-slate-950/90 text-slate-100 border border-slate-800 px-2 py-0.5 rounded shadow-md whitespace-nowrap">🎥 동영상 촬영</span>
            <Play className="w-4 h-4" />
          </button>

          {/* 파일 찾기 */}
          <button
            type="button"
            onClick={() => {
              setIsFabMenuOpen(false);
              fileSearchInputRef.current?.click();
            }}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 active:scale-90 transition-transform relative group"
            title="파일 선택"
          >
            <span className="text-[9px] font-black absolute -left-18 bg-slate-950/90 text-slate-100 border border-slate-800 px-2 py-0.5 rounded shadow-md whitespace-nowrap">📁 파일 찾기</span>
            <Paperclip className="w-4 h-4" />
          </button>

          {/* 음성 녹음 */}
          <button
            type="button"
            onClick={() => {
              setIsFabMenuOpen(false);
              setIsRecordingModalOpen(true);
              startRecording();
            }}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform relative group"
            title="음성 녹음"
          >
            <span className="text-[9px] font-black absolute -left-18 bg-slate-950/90 text-slate-100 border border-slate-800 px-2 py-0.5 rounded shadow-md whitespace-nowrap">🎤 음성 녹음</span>
            <Mic className="w-4 h-4" />
          </button>
        </div>

        {/* 주 플러스 FAB 버튼 */}
        <button
          type="button"
          onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
          className={`flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-xl shadow-cyan-600/30 active:scale-95 transition-all duration-300 ${
            isFabMenuOpen ? "rotate-45" : "rotate-0"
          }`}
        >
          <span className="text-2xl font-light">+</span>
        </button>
      </div>

      {/* 퀵링크 슬라이딩 드로워 백드롭 */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${
          isQuickLinksOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsQuickLinksOpen(false)}
      />

      {/* 퀵링크 슬라이딩 드로워 바디 */}
      <div 
        className={`fixed inset-y-0 left-0 h-full w-[50vw] max-w-[280px] border-r z-50 transition-all duration-300 ease-in-out flex flex-col shadow-2xl ${
          isQuickLinksOpen ? "translate-x-0" : "-translate-x-full"
        } ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        {/* 드로워 헤더 */}
        <div className={`flex items-center justify-between border-b p-4 shrink-0 transition-colors duration-300 ${isDark ? "border-slate-850 bg-slate-950" : "border-slate-200 bg-slate-100"}`}>
          <span className="text-[10px] font-black text-amber-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            업무 퀵링크
          </span>
          <button
            type="button"
            onClick={() => setIsQuickLinksOpen(false)}
            className={`p-0.5 rounded transition-colors ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 드로워 콘텐츠 (1열 배열) */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none text-left transition-colors duration-300 ${isDark ? "bg-slate-950/40" : "bg-slate-50/40"}`}>
          {/* 1. 인사 / 근태 / 노무 */}
          <div className="space-y-1.5">
            <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/5 px-1.5 py-0.5 rounded border border-cyan-500/10">인사 / 근태 / 노무</span>
            <div className="flex flex-col gap-1.5">
              <Link href="/m/form-management-new" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">증명서 신청</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
              <Link href="/m/labor-management" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">노무 리스크</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
            </div>
          </div>

          {/* 2. 현장 / 안전 / 품질 */}
          <div className="space-y-1.5">
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">현장 / 안전 / 품질</span>
            <div className="flex flex-col gap-1.5">
              <Link href="/m/safety-detection" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">위험 비전 AI</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
              <Link href="/m/safety" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">안전 TBM</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
              <Link href="/m/facility-management" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">설비 예방보전</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
              <Link href="/m/quality-control" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">품질 SPC</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
            </div>
          </div>

          {/* 3. 업무 / 영업 / SCM */}
          <div className="space-y-1.5">
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">업무 / 영업 / SCM</span>
            <div className="flex flex-col gap-1.5">
              <Link href="/m/finance-cashflow" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">지출 품의</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
              <Link href="/m/order-capture" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">모바일 수주</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
              <Link href="/m/estimate-request" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">견적 요청</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
              <Link href="/m/grant-management" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">지원금 AI</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
            </div>
          </div>

          {/* 4. 협업 / 업무지원 */}
          <div className="space-y-1.5">
            <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">협업 / 업무지원</span>
            <div className="flex flex-col gap-1.5">
              <Link href="/m/snaptasks" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">모바일 협업</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
              <Link href="/employee/business-card" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">명함 비서</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
              <Link href="/m/lawyer-ai" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">AI 법률</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
              <Link href="/m/credit-risk" className={`flex items-center justify-between p-2 border rounded-lg text-[9px] font-bold transition-all w-full ${isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"}`}>
                <span className="truncate pr-1">채권 신용</span>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3-2. 하단 우측 더블 FAB (퀵링크 및 이지봇) */}
      <div className="fixed bottom-6 right-6 z-45 flex items-center gap-3">
        {/* 퀵링크 FAB (번개 ⚡) */}
        <button
          type="button"
          onClick={() => {
            setIsQuickLinksOpen(!isQuickLinksOpen);
          }}
          className={`p-3.5 rounded-full text-white shadow-lg active:scale-95 transition-all ${
            isQuickLinksOpen 
              ? "bg-slate-800 border border-slate-700 text-cyan-400 scale-105" 
              : "bg-gradient-to-tr from-amber-500 to-orange-500 shadow-orange-500/20 hover:scale-105"
          }`}
          title="업무 퀵링크"
        >
          <Zap className="w-5 h-5" />
        </button>

        {/* 이지봇 플로팅 버튼 */}
        <button
          type="button"
          onClick={() => setIsBotOpen(true)}
          className="relative p-3.5 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
          title="이지봇 비서"
        >
          <MessageSquare className="w-5 h-5 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
        </button>
      </div>

      {/* 3-3. 미디어 임시저장 배너 및 관리 드로워 */}
      {tempFiles.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-35 flex flex-col items-center">
          {/* 드로워가 닫혀있을 때 플로팅 배너 */}
          {!showTempFilesDrawer ? (
            <button
              type="button"
              onClick={() => setShowTempFilesDrawer(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black shadow-lg active:scale-95 transition-all animate-bounce ${isDark ? "bg-slate-900 border-cyan-500/40 text-cyan-400 shadow-cyan-500/10 hover:border-cyan-400 hover:bg-slate-850" : "bg-white border-cyan-500 text-cyan-600 shadow-cyan-600/5 hover:bg-cyan-50/50"}`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>임시 저장된 파일 {tempFiles.length}개 보기</span>
            </button>
          ) : (
            /* 드로워(관리 팝업) 레이아웃 */
            <div className={`w-72 border rounded-2xl p-3 shadow-2xl space-y-3 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className={`flex items-center justify-between border-b pb-2 ${isDark ? "border-slate-800/80" : "border-slate-200"}`}>
                <span className="text-[10px] font-black text-cyan-400 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  임시저장 파일함 ({tempFiles.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowTempFilesDrawer(false)}
                  className={`p-0.5 rounded transition-colors ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 임시파일 리스트 */}
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {tempFiles.map((file) => (
                  <div key={file.id} className={`flex items-center justify-between p-1.5 rounded-lg border text-left transition-colors duration-300 ${isDark ? "bg-slate-950/60 border-slate-850 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                    <div className="flex items-center gap-2 overflow-hidden flex-1 pr-2">
                      {/* 미니 썸네일 */}
                      {file.type === "image" ? (
                        <img src={file.base64} className={`w-8 h-8 rounded object-cover border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} alt="" />
                      ) : (
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] border ${isDark ? "bg-slate-850 border-slate-800" : "bg-slate-100 border-slate-250"}`}>
                          {file.type === "video" ? "🎥" : file.type === "audio" ? "🎤" : "📄"}
                        </div>
                      )}
                      <div className="overflow-hidden flex-1">
                        <p className={`text-[8.5px] font-black truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{file.name}</p>
                        <p className="text-[7px] text-slate-500 font-bold uppercase">{file.type}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTempFiles(prev => prev.filter(f => f.id !== file.id))}
                      className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 하단 제어 */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTempFiles([])}
                  className={`flex-1 py-1.5 border rounded-lg text-[9px] font-bold transition-colors ${isDark ? "bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-850" : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border-slate-250"}`}
                >
                  전체 삭제
                </button>
                <button
                  type="button"
                  onClick={sendTempFilesToBot}
                  className="flex-2 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-[9px] font-black flex items-center justify-center gap-1 shadow-sm transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>이지봇에 전송</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3-4. 실시간 음성 녹음 모달 UI */}
      {isRecordingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-72 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow-2xl space-y-4">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest">음성 녹음 중</h3>
            
            {/* 녹음 중 모션 효과 */}
            <div className="py-6 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                {isRecording && (
                  <>
                    <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-red-500 opacity-20"></span>
                    <span className="animate-pulse absolute inline-flex h-12 w-12 rounded-full bg-red-500 opacity-40"></span>
                  </>
                )}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${
                  isRecording ? "bg-red-500" : "bg-slate-800"
                }`}>
                  <Mic className={`w-5 h-5 ${isRecording ? "animate-bounce" : ""}`} />
                </div>
              </div>
            </div>

            {/* 타이머 */}
            <div className="space-y-1">
              <p className="text-xl font-mono font-black text-slate-100">
                {Math.floor(recordingDuration / 60).toString().padStart(2, "0")}
                :
                {(recordingDuration % 60).toString().padStart(2, "0")}
              </p>
              <p className="text-[8px] text-slate-500 font-bold">마이크에 대고 지시할 내용을 말씀하세요.</p>
            </div>

            {/* 컨트롤 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (mediaRecorder && mediaRecorder.state !== "inactive") {
                    mediaRecorder.onstop = () => {
                      mediaRecorder.stream.getTracks().forEach(track => track.stop());
                    };
                    mediaRecorder.stop();
                  }
                  setIsRecording(false);
                  if (recordingTimer.current) clearInterval(recordingTimer.current);
                  setIsRecordingModalOpen(false);
                }}
                className="flex-1 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850 rounded-xl text-[10px] font-bold transition-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  stopRecording();
                  setIsRecordingModalOpen(false);
                }}
                className="flex-1 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-[10px] font-black transition-all"
              >
                녹음 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 이지봇 대화형 파일 처리 모달 */}
      {isBotOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end md:justify-center md:items-center">
          <div className={`w-full md:max-w-md border-t md:border rounded-t-2xl md:rounded-2xl flex flex-col h-[85vh] md:h-[75vh] shadow-2xl overflow-hidden transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            
            {/* 모달 헤더 */}
            <div className={`px-4 py-3 flex items-center justify-between border-b transition-colors duration-300 ${isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-100 border-slate-200 text-slate-850"}`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <div className="text-left">
                  <h3 className={`text-xs font-black ${isDark ? "text-slate-200" : "text-slate-850"}`}>이지봇 (EasyBot) 비서</h3>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Interactive File Assistant</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setIsBotOpen(false)}
                className={`p-1 rounded-lg transition-all ${isDark ? "text-slate-500 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 채팅 메시지 스크롤 영역 */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors duration-300 ${isDark ? "bg-slate-900/50" : "bg-slate-50"}`}>
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} space-y-1`}
                >
                  <span className="text-[7.5px] text-slate-500 font-bold px-1">{msg.timestamp}</span>
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-left text-[11px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-tr-none"
                        : (isDark ? "bg-slate-800 text-slate-100 border border-slate-700/50 rounded-tl-none" : "bg-white text-slate-800 border border-slate-200 rounded-tl-none")
                    }`}
                  >
                    {msg.content}

                    {/* 1차 추천 모드: 작업 다중 선택 목록 */}
                    {msg.suggestedTypes && msg.suggestedTypes.length > 0 && (
                      <div className={`mt-3 pt-3 border-t space-y-2 ${isDark ? "border-slate-700/50" : "border-slate-200"}`}>
                        <p className="text-[10px] font-black text-cyan-500 mb-2">⚡ 분석 수행할 작업을 선택해 주세요:</p>
                        <div className="space-y-1.5">
                          {msg.suggestedTypes.map((type) => {
                            const config = ACTION_LABELS[type] || { label: type, icon: FileText, color: "bg-slate-600", desc: "분석을 실행합니다." };
                            const IconComponent = config.icon;
                            const isSelected = selectedActions.includes(type);

                            return (
                              <button
                                key={type}
                                onClick={() => toggleActionSelection(type)}
                                className={`w-full flex items-start gap-2.5 p-2 rounded-lg border text-left active:scale-[0.99] transition-all ${
                                  isSelected
                                    ? (isDark ? "bg-slate-750 border-cyan-500/50 shadow-sm shadow-cyan-500/5" : "bg-cyan-50/30 border-cyan-500/50 shadow-xs")
                                    : (isDark ? "bg-slate-900/50 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-350")
                                }`}
                              >
                                <div className={`p-1 rounded-md mt-0.5 text-white ${config.color}`}>
                                  <IconComponent className="w-3 h-3" />
                                </div>
                                <div className="flex-1 space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[10.5px] font-black ${isDark ? "text-slate-200" : "text-slate-800"}`}>{config.label}</span>
                                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                                      isSelected ? "bg-cyan-500 border-cyan-500 text-white" : "border-slate-300"
                                    }`}>
                                      {isSelected && <Check className="w-2.5 h-2.5" />}
                                    </span>
                                  </div>
                                  <p className={`text-[8.5px] font-medium leading-tight ${isDark ? "text-slate-400" : "text-slate-500"}`}>{config.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={submitSelectedActions}
                          disabled={selectedActions.length === 0}
                          className="w-full mt-3 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 font-black rounded-lg text-[10px] flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                        >
                          <span>선택한 작업 분석 개시 ({selectedActions.length}건)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* 2차 파싱 결과: 개별 결과 검증 미리보기 카드 목록 */}
                    {msg.previewItems && msg.previewItems.length > 0 && (
                      <div className={`mt-3 pt-3 border-t space-y-4 ${isDark ? "border-slate-700/50" : "border-slate-200"}`}>
                        {msg.previewItems.map((item, idx) => {
                          const config = ACTION_LABELS[item.itemType] || { label: item.itemType, icon: FileText, color: "bg-slate-600" };
                          const itemTitle = config.label;

                          return (
                            <div
                              key={`${item.itemType}-${idx}`}
                              className={`rounded-xl p-3 text-left space-y-3 relative overflow-hidden border transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
                            >
                              <div className={`flex items-center justify-between pb-1.5 border-b ${isDark ? "border-slate-800/80" : "border-slate-250"}`}>
                                <span className={`text-[10px] font-black flex items-center gap-1.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                  <span className={`w-2 h-2 rounded-full ${config.color}`} />
                                  {itemTitle}
                                </span>
                                {item.isApproved ? (
                                  <span className="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded">
                                    등록 완료
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded animate-pulse">
                                    승인 대기
                                  </span>
                                )}
                              </div>

                              {/* 타입별 동적 인풋 폼 */}
                              <div className="space-y-2 text-[10px]">
                                {item.itemType === "RECEIPT" && (
                                  <>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>지출명</span>
                                      <input
                                        type="text"
                                        value={item.data.title || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "title", e.target.value)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>지출 금액</span>
                                      <input
                                        type="number"
                                        value={item.data.amount || 0}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "amount", parseInt(e.target.value) || 0)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden font-mono transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>비목 카테고리</span>
                                      <select
                                        value={item.data.category || "기타"}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "category", e.target.value)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      >
                                        {["복리후생비", "여비교통비", "소모품비", "접대비", "임차료", "세금공과금", "기타"].map(cat => (
                                          <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>지출 일자</span>
                                      <input
                                        type="text"
                                        value={item.data.expense_date || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "expense_date", e.target.value)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>결제 수단</span>
                                      <input
                                        type="text"
                                        value={item.data.payment_method || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "payment_method", e.target.value)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      />
                                    </div>
                                  </>
                                )}

                                {item.itemType === "BUSINESS_CARD" && (
                                  <>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>성명</span>
                                      <input
                                        type="text"
                                        value={item.data.name || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "name", e.target.value)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>회사명</span>
                                      <input
                                        type="text"
                                        value={item.data.companyName || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "companyName", e.target.value)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>연락처</span>
                                      <input
                                        type="text"
                                        value={item.data.phone || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "phone", e.target.value)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>이메일</span>
                                      <input
                                        type="text"
                                        value={item.data.email || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "email", e.target.value)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      />
                                    </div>
                                  </>
                                )}

                                {item.itemType === "LEGAL_DOCUMENT" && (
                                  <>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>사건 번호</span>
                                      <input
                                        type="text"
                                        value={item.data.caseNumber || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "caseNumber", e.target.value)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>서류 구분</span>
                                      <input
                                        type="text"
                                        value={item.data.documentType || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "documentType", e.target.value)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>답변 기한</span>
                                      <input
                                        type="text"
                                        value={item.data.deadline || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "deadline", e.target.value)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-start gap-2">
                                      <span className="text-slate-400 font-bold mt-1">핵심 요약</span>
                                      <textarea
                                        value={item.data.summary || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "summary", e.target.value)}
                                        className={`col-span-2 px-2 py-1 border rounded outline-hidden h-12 resize-none transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-250 text-slate-800 focus:border-cyan-600"}`}
                                      />
                                    </div>
                                  </>
                                )}

                                {/* 기타 템플릿용 간단 필드 */}
                                {item.itemType !== "RECEIPT" && item.itemType !== "BUSINESS_CARD" && item.itemType !== "LEGAL_DOCUMENT" && (
                                  <div className={`space-y-1 p-2 rounded border transition-colors ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-slate-100/50 border-slate-200"}`}>
                                    <p className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>데이터 수집 상세:</p>
                                    <pre className="text-[7.5px] font-mono text-cyan-300 max-h-24 overflow-y-auto whitespace-pre-wrap">
                                      {JSON.stringify(item.data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>

                              {/* 승인 동작 단추 */}
                              {!item.isApproved && (
                                <button
                                  onClick={() => approvePreviewItem(msg.id, idx)}
                                  disabled={item.isApproving}
                                  className="w-full mt-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-850 disabled:text-slate-600 font-black rounded-lg text-[9.5px] flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
                                >
                                  {item.isApproving ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>DB 적재 중...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>내용 확인 및 최종 등록 승인</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 로딩 표시 */}
              {botLoading && (
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-xl border transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700/50 text-slate-100" : "bg-white border-slate-200 text-slate-850"}`}>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  </div>
                  <span className={`text-[9px] font-bold self-center transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-550"}`}>AI 비서가 실시간 검토 중입니다...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* 대화 입력 창 (하이브리드: 텍스트 입력 + 파일 업로드 + 전송) */}
            <div className={`p-3 border-t flex items-center gap-2 transition-colors duration-300 ${isDark ? "bg-slate-950 border-slate-880" : "bg-slate-100 border-slate-200"}`}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,application/pdf"
                className="hidden"
              />
              
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={botLoading}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center shrink-0 active:scale-[0.97] ${isDark ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "bg-white border-slate-250 text-slate-500 hover:text-slate-850 hover:bg-slate-50"}`}
                title="파일 업로드"
              >
                <Upload className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    handleSendTextMessage();
                  }
                }}
                placeholder="비서에게 지시할 내용을 입력하세요..."
                disabled={botLoading}
                className={`flex-1 px-3 py-2 border rounded-xl text-[11px] transition-colors focus:outline-hidden ${isDark ? "bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500" : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-cyan-600 shadow-inner"}`}
              />

              <button
                type="button"
                onClick={() => handleSendTextMessage()}
                disabled={botLoading || !inputText.trim()}
                className={`p-2.5 rounded-xl text-white active:scale-[0.97] transition-all flex items-center justify-center shrink-0 ${isDark ? "bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-900 disabled:text-slate-650" : "bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-200 disabled:text-slate-400"}`}
                title="전송"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
