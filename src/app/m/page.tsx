"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  User, RefreshCw, Layers, Calendar, Scale, Shield, 
  MessageSquare, FileText, CheckCircle2, ChevronRight, 
  AlertTriangle, Play, Check, Send, Upload, X, LogOut, Loader2, ArrowRight
} from "lucide-react";
import Link from "next/link";

interface Operator {
  username: string;
  name: string;
}

interface Stats {
  pendingTasksCount: number;
  pendingExpensesCount: number;
  todaySafetyTbmCount: number;
  todayQualityNcrCount: number;
  myEasybotActionCount: number;
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
  const [currentUser, setCurrentUser] = useState<Operator | null>(null);
  const [stats, setStats] = useState<Stats>({
    pendingTasksCount: 0,
    pendingExpensesCount: 0,
    todaySafetyTbmCount: 0,
    todayQualityNcrCount: 0,
    myEasybotActionCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 출퇴근 시뮬레이터 상태
  const [workStatus, setWorkStatus] = useState<"READY" | "WORKING" | "OUT">("READY");
  const [workTime, setWorkTime] = useState<string>("");

  // 이지봇 플로팅 모달 상태
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [botLoading, setBotLoading] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [uploadedBase64, setUploadedBase64] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/m/dashboard");
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.currentUser);
        setStats(data.stats);
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
        content: "반갑습니다! 이지데스크 스마트 비서 이지봇입니다. 🤖\n현장의 사진, 영수증, 명함 또는 PDF 서류를 보내주시면 처리 가능한 업무 목록을 추천해 드리겠습니다. 파일을 업로드해 주세요! ✨",
        timestamp: getFormattedTime()
      }
    ]);
  }, []);

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

  // 출근 기록 시뮬레이션
  const handlePunchIn = () => {
    setWorkStatus("WORKING");
    setWorkTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  // 퇴근 기록 시뮬레이션
  const handlePunchOut = () => {
    setWorkStatus("OUT");
    setWorkTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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
      // 1. 사용자 업로드 메시지 추가
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
        // 2. 백엔드 OCR 1차 액션 감지 API 호출
        const response = await fetch("/api/easybot/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Str, action: "detect_actions" })
        });

        const result = await response.json();

        if (result.success && result.suggestedTypes && result.suggestedTypes.length > 0) {
          // 3. 봇 추천 목록 메시지 추가
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

  // 추천 액션 토글
  const toggleActionSelection = (type: string) => {
    setSelectedActions(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // 선택한 추천 액션 실행 (2차 정밀 파싱)
  const submitSelectedActions = async () => {
    if (selectedActions.length === 0 || !uploadedBase64) return;

    setBotLoading(true);
    const timeStr = getFormattedTime();

    // 사용자 응답 메시지 추가
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
      const response = await fetch("/api/easybot/ocr", {
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
        // 결과들을 미리보기 카드로 매핑하여 봇 메시지로 추가
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

  // 개별 미리보기 카드 내용 업데이트
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

  // 개별 미리보기 최종 승인 처리
  const approvePreviewItem = async (msgId: string, itemIdx: number) => {
    let targetItem: any = null;

    // 대화 히스토리에서 해당 아이템 찾기 및 로딩 활성화
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
      // 확정 API 호출
      const confirmRes = await fetch("/api/easybot/ocr/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileType: targetItem.itemType,
          ...targetItem.data
        })
      });

      const confirmData = await confirmRes.json();

      if (confirmData.success) {
        // 성공 시 상태 업데이트 및 봇 완료 답변 추가
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

        // 대시보드 통계 실시간 갱신
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
      
      {/* 1. 모바일 앱 스타일 헤더 */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            EGDesk Smart Portal
          </h1>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Employee Workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* 2. 메인 콘텐츠 대시보드 */}
      <main className="flex-1 p-4 space-y-5 max-w-md mx-auto w-full pb-20">
        
        {/* 로딩 표시 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400 font-bold">실시간 포털 데이터를 불러오고 있습니다...</p>
          </div>
        ) : (
          <>
            {/* 프로필 및 출퇴근 관제 카드 */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 p-4 shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-black text-slate-200">
                      {currentUser?.name || "임직원"}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-bold">
                      {currentUser?.username || ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
                  <span className={`w-1.5 h-1.5 rounded-full ${workStatus === "WORKING" ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-[8px] font-black text-slate-350">
                    {workStatus === "WORKING" ? "근무 중" : workStatus === "OUT" ? "퇴근 완료" : "근무 대기"}
                  </span>
                </div>
              </div>

              {/* 출퇴근 시뮬레이터 */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-left space-y-0.5">
                  <p className="text-[8px] text-slate-500 font-bold">오늘의 출퇴근 시간</p>
                  <p className="text-[10px] font-black text-slate-300">
                    {workTime ? `${workStatus === "WORKING" ? "출근" : "퇴근"} 등록: ${workTime}` : "등록된 기록이 없습니다."}
                  </p>
                </div>

                <div className="flex gap-2">
                  {workStatus === "READY" && (
                    <button
                      onClick={handlePunchIn}
                      className="px-3 py-1.5 text-[10px] font-black text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 active:scale-95 transition-all"
                    >
                      출근 등록
                    </button>
                  )}
                  {workStatus === "WORKING" && (
                    <button
                      onClick={handlePunchOut}
                      className="px-3 py-1.5 text-[10px] font-black text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:scale-95 transition-all"
                    >
                      퇴근 등록
                    </button>
                  )}
                  {workStatus === "OUT" && (
                    <span className="px-3 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-800 rounded-lg">
                      금일 마감
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 실시간 주요 알림 및 스코어 그리드 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-left hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="p-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    할 일
                  </span>
                </div>
                <h4 className="text-[20px] font-black text-slate-100 mt-2">
                  {stats.pendingTasksCount}
                </h4>
                <p className="text-[8.5px] text-slate-500 font-bold">미완료 스냅태스크</p>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-left hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                    결재 대기
                  </span>
                </div>
                <h4 className="text-[20px] font-black text-slate-100 mt-2">
                  {stats.pendingExpensesCount}
                </h4>
                <p className="text-[8.5px] text-slate-500 font-bold">본인 결재 대기 지출</p>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-left hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="p-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  </span>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-sans">
                    TBM
                  </span>
                </div>
                <h4 className="text-[20px] font-black text-slate-100 mt-2">
                  {stats.todaySafetyTbmCount}
                </h4>
                <p className="text-[8.5px] text-slate-500 font-bold">금일 수립 안전 TBM</p>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-left hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="p-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  </span>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-sans">
                    NCR
                  </span>
                </div>
                <h4 className="text-[20px] font-black text-slate-100 mt-2">
                  {stats.todayQualityNcrCount}
                </h4>
                <p className="text-[8.5px] text-slate-500 font-bold">금일 검사 부적합 건</p>
              </div>
            </div>

            {/* 5대 핵심 카테고리 퀵링크 목록 */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider text-left pl-1">
                주요 업무 서비스 퀵링크
              </h3>

              <div className="space-y-2">
                {/* 1. 인사 및 노무 */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-left">
                  <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">인사 / 노무</span>
                  <div className="grid grid-cols-2 gap-2.5 mt-3">
                    <Link href="/m/form-management-new" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>증명서 발급 신청</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                    <Link href="/m/labor-management" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>노무 리스크 AI</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                  </div>
                </div>

                {/* 2. 현장 및 안전 */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-left">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">현장 / 안전 / 품질</span>
                  <div className="grid grid-cols-2 gap-2.5 mt-3">
                    <Link href="/m/safety-detection" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>위험 비전 AI</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                    <Link href="/m/safety/tbm" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>안전 TBM 수립</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                    <Link href="/m/facility-management" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>설비 예지보전</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                    <Link href="/m/quality-control" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>품질 관리 SPC</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                  </div>
                </div>

                {/* 3. 재무 및 영업 */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-left">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">재무 / 영업 / SCM</span>
                  <div className="grid grid-cols-2 gap-2.5 mt-3">
                    <Link href="/m/finance-cashflow" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>지출 내역 품의</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                    <Link href="/m/order-capture" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>모바일 주문수주</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                    <Link href="/m/estimate-request" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>스마트 견적요청</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                    <Link href="/m/grant-management" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>정책자금 추천 AI</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                  </div>
                </div>

                {/* 4. 협업 및 도구 */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-left">
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">협업 / 스냅태스크</span>
                  <div className="grid grid-cols-2 gap-2.5 mt-3">
                    <Link href="/m/snaptasks" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>모바일 작업지시</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                    <Link href="/employee/business-card" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>명함 비서 홈</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                    <Link href="/m/lawyer-ai" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>AI 법률 상담</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                    <Link href="/m/credit-risk" className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all">
                      <span>채권 신용 관리</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* 3. 모바일 이지봇 플로팅 비서 버튼 */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsBotOpen(true)}
          className="relative group p-3.5 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:scale-110 active:scale-95 transition-all"
        >
          <MessageSquare className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </button>
      </div>

      {/* 4. 이지봇 대화형 파일 처리 모달 */}
      {isBotOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end md:justify-center md:items-center">
          <div className="w-full md:max-w-md bg-slate-900 border-t md:border border-slate-800 rounded-t-2xl md:rounded-2xl flex flex-col h-[85vh] md:h-[75vh] shadow-2xl overflow-hidden">
            
            {/* 모달 헤더 */}
            <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <div className="text-left">
                  <h3 className="text-xs font-black text-slate-200">이지봇 (EasyBot) 비서</h3>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Interactive File Assistant</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setIsBotOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 채팅 메시지 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
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
                        : "bg-slate-800 text-slate-100 border border-slate-700/50 rounded-tl-none"
                    }`}
                  >
                    {msg.content}

                    {/* 1차 추천 모드: 작업 다중 선택 목록 */}
                    {msg.suggestedTypes && msg.suggestedTypes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                        <p className="text-[10px] font-black text-cyan-400 mb-2">⚡ 분석 수행할 작업을 선택해 주세요:</p>
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
                                    ? "bg-slate-750 border-cyan-500/50 shadow-sm shadow-cyan-500/5"
                                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                                }`}
                              >
                                <div className={`p-1 rounded-md mt-0.5 text-white ${config.color}`}>
                                  <IconComponent className="w-3 h-3" />
                                </div>
                                <div className="flex-1 space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10.5px] font-black text-slate-200">{config.label}</span>
                                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                                      isSelected ? "bg-cyan-500 border-cyan-500 text-white" : "border-slate-700"
                                    }`}>
                                      {isSelected && <Check className="w-2.5 h-2.5" />}
                                    </span>
                                  </div>
                                  <p className="text-[8.5px] text-slate-400 font-medium leading-tight">{config.desc}</p>
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
                      <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-4">
                        {msg.previewItems.map((item, idx) => {
                          const config = ACTION_LABELS[item.itemType] || { label: item.itemType, icon: FileText, color: "bg-slate-600" };
                          const itemTitle = config.label;

                          return (
                            <div
                              key={`${item.itemType}-${idx}`}
                              className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-left space-y-3 relative overflow-hidden"
                            >
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                                <span className="text-[10px] font-black text-slate-200 flex items-center gap-1.5">
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
                                      <span className="text-slate-400 font-bold">지출명</span>
                                      <input
                                        type="text"
                                        value={item.data.title || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "title", e.target.value)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden"
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className="text-slate-400 font-bold">지출 금액</span>
                                      <input
                                        type="number"
                                        value={item.data.amount || 0}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "amount", parseInt(e.target.value) || 0)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden font-mono"
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className="text-slate-400 font-bold">비목 카테고리</span>
                                      <select
                                        value={item.data.category || "기타"}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "category", e.target.value)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden"
                                      >
                                        {["복리후생비", "여비교통비", "소모품비", "접대비", "임차료", "세금공과금", "기타"].map(cat => (
                                          <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className="text-slate-400 font-bold">지출 일자</span>
                                      <input
                                        type="text"
                                        value={item.data.expense_date || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "expense_date", e.target.value)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden"
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className="text-slate-400 font-bold">결제 수단</span>
                                      <input
                                        type="text"
                                        value={item.data.payment_method || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "payment_method", e.target.value)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden"
                                      />
                                    </div>
                                  </>
                                )}

                                {item.itemType === "BUSINESS_CARD" && (
                                  <>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className="text-slate-400 font-bold">성명</span>
                                      <input
                                        type="text"
                                        value={item.data.name || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "name", e.target.value)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden"
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className="text-slate-400 font-bold">회사명</span>
                                      <input
                                        type="text"
                                        value={item.data.companyName || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "companyName", e.target.value)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden"
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className="text-slate-400 font-bold">연락처</span>
                                      <input
                                        type="text"
                                        value={item.data.phone || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "phone", e.target.value)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden"
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className="text-slate-400 font-bold">이메일</span>
                                      <input
                                        type="text"
                                        value={item.data.email || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "email", e.target.value)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden"
                                      />
                                    </div>
                                  </>
                                )}

                                {item.itemType === "LEGAL_DOCUMENT" && (
                                  <>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className="text-slate-400 font-bold">사건 번호</span>
                                      <input
                                        type="text"
                                        value={item.data.caseNumber || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "caseNumber", e.target.value)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden"
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className="text-slate-400 font-bold">서류 구분</span>
                                      <input
                                        type="text"
                                        value={item.data.documentType || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "documentType", e.target.value)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden"
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-2">
                                      <span className="text-slate-400 font-bold">답변 기한</span>
                                      <input
                                        type="text"
                                        value={item.data.deadline || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "deadline", e.target.value)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden"
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 items-start gap-2">
                                      <span className="text-slate-400 font-bold mt-1">핵심 요약</span>
                                      <textarea
                                        value={item.data.summary || ""}
                                        disabled={item.isApproved}
                                        onChange={(e) => updatePreviewField(msg.id, idx, "summary", e.target.value)}
                                        className="col-span-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden h-12 resize-none"
                                      />
                                    </div>
                                  </>
                                )}

                                {/* 기타 템플릿용 간단 필드 */}
                                {item.itemType !== "RECEIPT" && item.itemType !== "BUSINESS_CARD" && item.itemType !== "LEGAL_DOCUMENT" && (
                                  <div className="space-y-1 bg-slate-800/50 p-2 rounded border border-slate-800">
                                    <p className="text-[9px] text-slate-400">데이터 수집 상세:</p>
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
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/50 text-slate-100">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold self-center">AI 비서가 실시간 검토 중입니다...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* 대화 입력 창 (파일 업로드 전용) */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
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
                className="flex-1 py-2.5 px-4 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 text-[10px] font-black flex items-center justify-center gap-2 bg-slate-900 active:scale-[0.99] transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>스마트폰 사진 또는 PDF 문서 보내기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
