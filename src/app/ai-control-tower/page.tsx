"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, Search, RefreshCw, ChevronLeft, ChevronRight, 
  MessageSquare, Users, Coins, HelpCircle, ShieldAlert, CheckCircle2, XCircle, FileText, Send, X, Settings2,
  Clock
} from "lucide-react";

interface AuditLog {
  id: string;
  operator_username: string;
  original_prompt: string;
  action_name: string;
  arguments_json: string;
  status: string;
  execution_result: string;
  error_message: string;
  created_at: string;
}

interface Capability {
  key: string;
  name: string;
  actionName: string;
  description: string;
  example: string;
  icon: any;
  iconColor: string;
  enabled: boolean;
}

export default function AIControlTowerPage() {
  // 0. 활성화 탭 상태 관리
  const [activeTab, setActiveTab] = useState<"logs" | "settings" | "request" | "governance">("logs");

  // 1. 에이전트 기능 통제 상태
  const [capabilities, setCapabilities] = useState<Capability[]>([
    {
      key: "easybot_action_send_sms_enabled",
      name: "무료 문자 발송 AI",
      actionName: "send_sms (발송)",
      description: "지정한 수신자 번호로 알림 문자(SMS)를 구글 메시지 스마트폰 기기 허브와 연동하여 자동으로 발송 대행합니다.",
      example: "이철수 사장님에게 문자 보내줘",
      icon: MessageSquare,
      iconColor: "text-purple-600 bg-purple-50 border border-purple-100",
      enabled: true
    },
    {
      key: "easybot_action_register_customer_enabled",
      name: "고객 관리 AI",
      actionName: "register_customer (등록)",
      description: "사용자가 알려준 신규 고객의 성명과 연락처 정보를 정확히 분석하여 CRM 데이터베이스에 즉시 등록합니다.",
      example: "김영희 010-1111-2222 신규 고객으로 등록해줘",
      icon: Users,
      iconColor: "text-emerald-600 bg-emerald-50 border border-emerald-100",
      enabled: true
    },
    {
      key: "easybot_action_approve_expense_approved_enabled",
      name: "지출 관리 AI (승인 대행)",
      actionName: "approve_expense (승인)",
      description: "지출 결의서의 결재 고유 ID를 분석하여 품의 상태를 승인(APPROVED)으로 즉시 결재 처리합니다.",
      example: "지출 결의서 EXP-1004건 승인해줘",
      icon: Coins,
      iconColor: "text-rose-600 bg-rose-50 border border-rose-100",
      enabled: true
    },
    {
      key: "easybot_action_approve_expense_rejected_enabled",
      name: "지출 관리 AI (반려 대행)",
      actionName: "approve_expense (반려)",
      description: "요건 불충분이나 영수증 미비 등의 지출 품의 요청을 즉시 반려(REJECTED)하고 반려 사유 의견을 기입합니다.",
      example: "지출 결의서 EXP-1004건 반려해줘",
      icon: Coins,
      iconColor: "text-amber-600 bg-amber-50 border border-amber-100",
      enabled: true
    },
    {
      key: "easybot_action_ocr_confirm_enabled",
      name: "이미지 OCR 자율 대행 (등록 확정)",
      actionName: "ocr_confirm (확정)",
      description: "사용자가 업로드한 실물 이미지(재무제표, 이력서, 사업자등록증, 영수증 등)의 AI OCR 추출 내용을 데이터베이스에 최종 등록 및 자율 갱신 대행합니다.",
      example: "OCR 카드 뷰에서 [등록 확정] 단추 클릭 시 최종 DB 적재 및 갱신 대행",
      icon: CheckCircle2,
      iconColor: "text-blue-600 bg-blue-50 border border-blue-100",
      enabled: true
    }
  ]);

  // 2. 감사 로그 리스트 상태
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // 3. 모달 상태
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // 4. 새 기능 건의 & 이력 리스트 상태
  const [feedbackType, setFeedbackType] = useState<string>("기능 제안");
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [senderName, setSenderName] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState<boolean>(false);
  
  const [feedbackSearch, setFeedbackSearch] = useState<string>("");
  const [feedbackPage, setFeedbackPage] = useState<number>(1);
  const [feedbackLimit] = useState<number>(5);

  // 거버넌스 관제 관련 상태
  const [govLogs, setGovLogs] = useState<any[]>([]);
  const [deletedItems, setDeletedItems] = useState<any[]>([]);
  const [loadingGov, setLoadingGov] = useState<boolean>(false);
  const [govError, setGovError] = useState<string | null>(null);

  // 거버넌스 데이터(RAG 감사 로그 및 소프트 삭제 대장) 로드
  const loadGovernanceData = async () => {
    setLoadingGov(true);
    setGovError(null);
    try {
      const logsRes = await fetch("/api/governance?action=logs");
      const logsData = await logsRes.json();
      if (!logsData.success) {
        throw new Error(logsData.error || "거버넌스 감사 로그 조회 실패");
      }

      const deletedRes = await fetch("/api/governance?action=deleted_items");
      const deletedData = await deletedRes.json();
      if (!deletedData.success) {
        throw new Error(deletedData.error || "소프트 삭제 대장 데이터 조회 실패");
      }

      setGovLogs(logsData.logs || []);
      setDeletedItems(deletedData.deletedItems || []);
    } catch (err: any) {
      console.error("Governance data load error:", err);
      setGovError(err.message || "데이터 로드 실패");
    } finally {
      setLoadingGov(false);
    }
  };

  // 보류 건 강제 삭제 승인 처리
  const handleForceDelete = async (logId: string | null, docType: string, docId: string) => {
    if (!confirm(`⚠️ 해당 문서(${docId})를 정말 강제 삭제 승인하시겠습니까?\n이 작업은 사내 규정 RAG 검사를 우회하여 해당 문서를 강제 소프트 삭제 처리합니다.`)) {
      return;
    }
    try {
      const res = await fetch("/api/governance?action=force_delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, docType, docId })
      });
      const data = await res.json();
      if (data.success) {
        alert("⚡ 강제 삭제 승인이 완료되었습니다.");
        loadGovernanceData();
      } else {
        alert(`승인 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`서버 통신 오류: ${err.message}`);
    }
  };

  // 소프트 삭제된 데이터 복원 처리
  const handleRestore = async (docType: string, docId: string) => {
    if (!confirm(`🔄 해당 문서(${docId})를 정말 복원하시겠습니까?\n이 작업은 소프트 삭제된 데이터를 원상태로 복원시킵니다.`)) {
      return;
    }
    try {
      const res = await fetch("/api/governance?action=restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType, docId })
      });
      const data = await res.json();
      if (data.success) {
        alert("🔄 대장 데이터가 성공적으로 복원되었습니다.");
        loadGovernanceData();
      } else {
        alert(`복원 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`서버 통신 오류: ${err.message}`);
    }
  };

  // 5. 초기 마운트 및 데이터 조회
  useEffect(() => {
    loadCapabilities();
    loadAuditLogs();
    loadFeedbacks();
    if (activeTab === "governance") {
      loadGovernanceData();
    }
  }, [page, search, activeTab]);

  // 기능 토글 설정 로드
  const loadCapabilities = async () => {
    const updated = [...capabilities];
    for (let i = 0; i < updated.length; i++) {
      try {
        const res = await fetch(`/api/settings?key=${updated[i].key}`);
        const data = await res.json();
        if (data.success && data.value !== null) {
          updated[i].enabled = data.value !== '0' && data.value !== 'false' && data.value !== false;
        } else {
          updated[i].enabled = true; // 기본값 활성
        }
      } catch (err) {
        console.error(`Failed to load ${updated[i].key} state:`, err);
      }
    }
    setCapabilities([...updated]);
  };

  // 감사 로그 페이징 조회
  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/easybot/audit-logs?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // 피드백/건의서 기안 이력 조회
  const loadFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const res = await fetch("/api/support/feedback");
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load feedbacks:", err);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  // 기능 ON/OFF 토글 처리
  const handleToggleCapability = async (index: number) => {
    const cap = capabilities[index];
    const nextVal = !cap.enabled;
    
    // UI 즉시 반영
    const updated = [...capabilities];
    updated[index].enabled = nextVal;
    setCapabilities(updated);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: cap.key,
          value: nextVal ? "1" : "0"
        })
      });
      const data = await res.json();
      if (!data.success) {
        // 원래 상태로 롤백
        updated[index].enabled = !nextVal;
        setCapabilities([...updated]);
        alert("기능 상태 변경 저장에 실패했습니다: " + data.error);
      }
    } catch (err) {
      updated[index].enabled = !nextVal;
      setCapabilities([...updated]);
      console.error("Toggle save error:", err);
    }
  };

  // 건의사항 제출
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setSubmittingFeedback(true);
    setFeedbackStatus(null);

    try {
      const formData = new FormData();
      formData.append("companyName", "본사 관리자");
      formData.append("senderName", senderName || "최고관리자");
      formData.append("contact", contact || "미기입");
      formData.append("feedbackType", feedbackType);
      formData.append("feedbackText", feedbackText);
      formData.append("currentUrl", "/ai-control-tower");

      const res = await fetch("/api/support/feedback", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setFeedbackStatus({ success: true, message: "제안해 주신 신규 기능 추가 요청이 개발팀 보드에 정상 접수되었습니다! 🟢" });
        setFeedbackText("");
        loadFeedbacks(); // 이력 리스트 즉시 리로드
      } else {
        setFeedbackStatus({ success: false, message: `제출 실패: ${data.error}` });
      }
    } catch (err: any) {
      setFeedbackStatus({ success: false, message: `서버 통신 오류: ${err.message}` });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // 툴 이름 한글 변환
  const getToolDisplayName = (name: string) => {
    if (name === "send_sms") return "무료 문자 발송 AI";
    if (name === "register_customer") return "고객 관리 AI";
    if (name === "approve_expense") return "지출 관리 AI";
    if (name.startsWith("ocr_confirm_")) return "이미지 OCR 자율 대행";
    return name;
  };

  // 피드백 문자열 포맷터 헬퍼 (메타데이터 뒤의 본문만 파싱)
  const parseFeedbackText = (prompt: string) => {
    if (!prompt) return "";
    const match = prompt.match(/\]\n([\s\S]*)/);
    if (match) {
      // 첨부파일 링크 텍스트 제거하고 깔끔히 본문만 반환
      return match[1].split("\n\n📸 [스크린샷")[0].split("\n🎥 [화면녹화")[0].trim();
    }
    const bracketIndex = prompt.lastIndexOf(']');
    if (bracketIndex > -1) {
      return prompt.substring(bracketIndex + 1).split("\n\n📸 [스크린샷")[0].split("\n🎥 [화면녹화")[0].trim();
    }
    return prompt;
  };

  // 피드백/기안서의 메타데이터와 본문, 첨부파일을 세부 파싱하는 헬퍼
  const parseFeedbackDetails = (prompt: string) => {
    if (!prompt) return { company: "본사 관리자", sender: "최고관리자", contact: "미기입", type: "기능 제안", body: "", screenshot: "", recording: "" };
    
    // 메타데이터 대괄호 패턴 매칭: [고객사: X / 제보자: Y (Z) / 유형: W]
    const metaMatch = prompt.match(/^\[고객사:\s*([^/\]]+)\s*\/\s*제보자:\s*([^(]+)\s*\(([^)]+)\)\s*\/\s*유형:\s*([^\]]+)\]/);
    
    let company = "본사 관리자";
    let sender = "최고관리자";
    let contact = "미기입";
    let type = "기능 제안";
    let body = prompt;
    
    if (metaMatch) {
      company = metaMatch[1].trim();
      sender = metaMatch[2].trim();
      contact = metaMatch[3].trim();
      type = metaMatch[4].trim();
      body = prompt.substring(prompt.indexOf(']') + 1).trim();
    }
    
    // 파일 다운로드 정적 링크 파싱
    const screenshotMatch = prompt.match(/📸\s*\[스크린샷[^\]]*\]:\s*([^\s\n]+)/);
    const recordingMatch = prompt.match(/🎥\s*\[화면녹화[^\]]*\]:\s*([^\s\n]+)/);
    
    const screenshot = screenshotMatch ? screenshotMatch[1].trim() : "";
    const recording = recordingMatch ? recordingMatch[1].trim() : "";
    
    // 본문에서 첨부파일 링크 텍스트 정리
    body = body.split("\n\n📸 [스크린샷")[0].split("\n🎥 [화면녹화")[0].trim();
    
    return { company, sender, contact, type, body, screenshot, recording };
  };

  // JSON 파싱 프리티 렌더러
  const renderJson = (jsonStr: string) => {
    if (!jsonStr) return <span className="text-slate-455">데이터 없음</span>;
    try {
      const parsed = JSON.parse(jsonStr);
      return (
        <pre className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-indigo-900 font-mono max-h-60 overflow-y-auto overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch (e) {
      return <span className="text-slate-600 break-all text-xs font-mono">{jsonStr}</span>;
    }
  };

  // 기안서 이력 클라이언트 사이드 검색 및 페이징
  const filteredFeedbacks = React.useMemo(() => {
    return feedbacks.filter((fb) => {
      if (!feedbackSearch) return true;
      const q = feedbackSearch.toLowerCase();
      const prompt = (fb.user_prompt || "").toLowerCase();
      const type = (fb.detected_type || "").toLowerCase();
      const id = (fb.id || "").toLowerCase();
      return prompt.includes(q) || type.includes(q) || id.includes(q);
    });
  }, [feedbacks, feedbackSearch]);

  const paginatedFeedbacks = React.useMemo(() => {
    const start = (feedbackPage - 1) * feedbackLimit;
    return filteredFeedbacks.slice(start, start + feedbackLimit);
  }, [filteredFeedbacks, feedbackPage, feedbackLimit]);

  const totalFeedbackPages = Math.ceil(filteredFeedbacks.length / feedbackLimit);

  return (
    <div className="w-full space-y-6 pb-20 min-w-0 font-sans text-slate-800 animate-fade-in text-left">
      
      {/* 1. 상단 헤더 영역 */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
            <Activity className="w-8 h-8 text-indigo-600 mr-3 animate-[pulse_2s_infinite]" />
            AI 컨트롤타워
          </h1>
          <p className="text-slate-500 mt-2">
            이지봇 자율 액션 에이전트의 작동 권한을 통제하고, 모든 비즈니스 대행 이력을 정밀하게 모니터링합니다.
          </p>
        </div>
        <div>
          <button 
            onClick={() => {
              if (activeTab === "logs") loadAuditLogs();
              else if (activeTab === "settings") loadCapabilities();
              else if (activeTab === "request") loadFeedbacks();
              else if (activeTab === "governance") loadGovernanceData();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || loadingFeedbacks || loadingGov ? "animate-spin" : ""}`} />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* 2. 탭 스위치 컴포넌트 */}
      <div className="flex flex-wrap border-b border-slate-200 bg-slate-50/40 p-1 rounded-xl gap-1 shrink-0 max-w-max">
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer border-0 ${
            activeTab === "logs"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
              : "bg-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>실시간 자율 대행 감사 로그 대장</span>
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer border-0 ${
            activeTab === "settings"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
              : "bg-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>에이전트 자율 대행 기능 활성화 설정</span>
        </button>
        <button
          onClick={() => setActiveTab("request")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer border-0 ${
            activeTab === "request"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
              : "bg-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>이지봇 업무 대행 요청 및 기안서 제출</span>
        </button>
        <button
          onClick={() => setActiveTab("governance")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer border-0 ${
            activeTab === "governance"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
              : "bg-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>🛡️ 데이터 거버넌스 및 AI 결재 관제 센터</span>
        </button>
      </div>

      {/* 3. 탭별 조건부 콘텐츠 렌더링 */}
      
      {/* 탭 A: 실시간 자율 대행 감사 로그 대장 */}
      {activeTab === "logs" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-indigo-600 rounded-full" />
              <h2 className="text-sm font-black text-slate-800">전체 대행 처리 트랜잭션 내역</h2>
            </div>
            
            {/* 검색 창 */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="명령어, 에러, 작업자 검색..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full px-3.5 py-2 pl-9.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800 text-xs placeholder-slate-400 transition-all font-medium"
              />
            </div>
          </div>

          {/* 로그 테이블 패널 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">발생 일시</th>
                    <th className="py-3 px-5">대행 액션</th>
                    <th className="py-3 px-5">최고관리자 명령 원본</th>
                    <th className="py-3 px-5">작업 처리자</th>
                    <th className="py-3 px-5">상태</th>
                    <th className="py-3 px-5 text-center">동작</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                          <span>감사 로그를 로드하는 중...</span>
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-455">
                        기록된 이지봇 자율 액션 감사 이력이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-5 text-slate-500 font-mono whitespace-nowrap">
                          {log.created_at}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="font-bold text-slate-800 block text-xs">
                            {getToolDisplayName(log.action_name)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.action_name}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 max-w-xs md:max-w-md truncate text-slate-650" title={log.original_prompt}>
                          {log.original_prompt}
                        </td>
                        <td className="py-3.5 px-5 text-slate-500 font-mono whitespace-nowrap">
                          {log.operator_username}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          {log.status === "SUCCESS" ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>완료</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border-rose-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold" title={log.error_message}>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>실패</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-455" />
                            <span>상세 분석</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 하단 페이징 영역 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-slate-50/30">
                <div className="text-xs text-slate-500">
                  총 <span className="font-bold text-slate-700">{total}</span>개의 로그 중 <span className="font-bold text-slate-700">{page}</span> / {totalPages} 페이지
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-400 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-400 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 탭 B: 에이전트 자율 대행 기능 활성화 설정 */}
      {activeTab === "settings" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-indigo-600 rounded-full" />
            <h2 className="text-sm font-black text-slate-800">기능별 ON/OFF 권한 실시간 통제</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div 
                  key={cap.key} 
                  className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                    cap.enabled 
                      ? "bg-white border-slate-200 shadow-sm shadow-slate-100/50 hover:border-indigo-300 hover:shadow-md" 
                      : "bg-slate-50/50 border-slate-150 opacity-65"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${cap.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* 슬라이딩 토글 스위치 */}
                    <button
                      onClick={() => handleToggleCapability(idx)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        cap.enabled ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          cap.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <span>{cap.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                      {cap.actionName}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed min-h-[40px] mb-3">
                    {cap.description}
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <span className="text-[9px] uppercase font-extrabold text-indigo-600 tracking-wider block mb-1">자연어 작동 명령 예시</span>
                    <p className="text-xs text-slate-700 font-semibold italic">
                      &ldquo;{cap.example}&rdquo;
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 탭 C: 이지봇 업무 대행 요청 및 기안서 제출 & 처리과정과 이력 */}
      {activeTab === "request" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 좌측: 기안서 작성 폼 (5칸 배정) */}
            <div className="lg:col-span-5 bg-slate-50/50 border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden h-fit">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start gap-3 mb-5">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
                  <HelpCircle className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    신규 자율 대행 액션 건의
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    이지봇이 추가적으로 대행해 주었으면 하는 비즈니스 업무 아이디어나 개선 의견을 자유롭게 적어 제출해 주세요.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5">제안 유형</label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-850 cursor-pointer"
                  >
                    <option value="기능 제안">기능 제안 (신규 액션 건의)</option>
                    <option value="기타 문의">기타 문의 / 버그 제보</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">기안 서명자</label>
                    <input
                      type="text"
                      placeholder="예: 최 대표"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">회신 연락처/이메일</label>
                    <input
                      type="text"
                      placeholder="예: 010-0000-0000"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-850"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5">대행 요청 상세 내용 *</label>
                  <textarea
                    rows={4}
                    placeholder="예: 이지봇이 거래처별 월별 거래 명세서를 취합해서 이메일로 자동 전송하는 '명세서 일괄 발송' 도구를 신규 추가해 주면 좋겠습니다."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-850 resize-none leading-relaxed"
                  />
                </div>

                {feedbackStatus && (
                  <div className={`p-3.5 rounded-xl text-xs font-semibold border ${feedbackStatus.success ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    {feedbackStatus.message}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={submittingFeedback || !feedbackText.trim()}
                    className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-white font-bold transition-all border-0 shadow-md w-full justify-center ${
                      submittingFeedback || !feedbackText.trim()
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        : "bg-indigo-600 hover:bg-indigo-500 active:scale-95 cursor-pointer shadow-indigo-600/10"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingFeedback ? "요청하는 중..." : "제안 기안서 제출"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 우측: 처리 과정 및 기안 이력 조회 테이블 (7칸 배정) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-indigo-600 rounded-full" />
                  <h3 className="text-sm font-black text-slate-800">기안서 처리 과정 및 심사 이력</h3>
                </div>
                
                {/* 기안서 검색 창 */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="기안 서명자, 내용 검색..." 
                    value={feedbackSearch}
                    onChange={(e) => { setFeedbackSearch(e.target.value); setFeedbackPage(1); }}
                    className="w-full px-3 py-1.5 pl-8 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800 text-[11px] placeholder-slate-400 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">제출 시각</th>
                        <th className="py-3 px-4">구분</th>
                        <th className="py-3 px-4">기안 및 제안 내용 요약</th>
                        <th className="py-3 px-4 text-center">심사 상태</th>
                        <th className="py-3 px-4 text-center">동작</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {loadingFeedbacks ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                              <span>처리 이력을 가져오는 중...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredFeedbacks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-455">
                            검색 조건에 일치하거나 제출된 기안서 이력이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        paginatedFeedbacks.map((fb) => (
                          <tr 
                            key={fb.id} 
                            onClick={() => setSelectedFeedback(fb)}
                            className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                              {fb.created_at ? fb.created_at.split(' ')[0] : '미기입'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                fb.detected_type === 'bug'
                                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                                  : fb.detected_type === 'feature_request'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                    : 'bg-slate-50 text-slate-750 border-slate-200'
                              }`}>
                                {fb.detected_type === 'bug' ? '버그' : fb.detected_type === 'feature_request' ? '기능제안' : '기타'}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-xs md:max-w-xs truncate text-slate-655 font-medium" title={fb.user_prompt}>
                              {parseFeedbackText(fb.user_prompt)}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {fb.resolved_status === 'resolved' ? (
                                <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                                  <span>조치 완료</span>
                                </span>
                              ) : fb.resolved_status === 'ignored' ? (
                                <span className="inline-flex items-center bg-slate-50 text-slate-555 border border-slate-200 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                                  <span>보류</span>
                                </span>
                              ) : fb.resolved_status === 'in_progress' ? (
                                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  <span>반영 중</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                  <span>검토 대기</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFeedback(fb);
                                }}
                                className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-350 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3 text-slate-500" />
                                <span>이력 조회</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 기안서 이력 하단 페이지네이션 */}
                {totalFeedbackPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 bg-slate-50/30">
                    <div className="text-[10px] text-slate-500">
                      총 <span className="font-bold text-slate-700">{filteredFeedbacks.length}</span>개 중 <span className="font-bold text-slate-700">{feedbackPage}</span> / {totalFeedbackPages} 페이지
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={feedbackPage <= 1}
                        onClick={() => setFeedbackPage(feedbackPage - 1)}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-450 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-450 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={feedbackPage >= totalFeedbackPages}
                        onClick={() => setFeedbackPage(feedbackPage + 1)}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-450 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-450 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 탭 D: 데이터 거버넌스 및 AI 결재 관제 센터 */}
      {activeTab === "governance" && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* 1. 거버넌스 요약 스탯 카드 영역 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* 카드 1: 전체 심사 수 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">총 AI 결재 심사</span>
                <span className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                  <Activity className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-800">{govLogs.length}</span>
                <span className="text-[10px] text-slate-500 font-medium">건</span>
              </div>
            </div>

            {/* 카드 2: 결재 보류 중 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">현재 결재 보류</span>
                <span className="p-1.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-600">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-600">
                  {govLogs.filter((l: any) => l.status === "PENDING_APPROVAL").length}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">건</span>
              </div>
            </div>

            {/* 카드 3: 강제 승인 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">최고관리자 강제승인</span>
                <span className="p-1.5 bg-purple-50 border border-purple-100 rounded-lg text-purple-600">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-purple-600">
                  {govLogs.filter((l: any) => l.status === "FORCE_APPROVED").length}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">건</span>
              </div>
            </div>

            {/* 카드 4: 소프트 삭제 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">임시 소프트 삭제</span>
                <span className="p-1.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
                  <XCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-rose-600">{deletedItems.length}</span>
                <span className="text-[10px] text-slate-500 font-medium">건</span>
              </div>
            </div>

          </div>

          {govError && (
            <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{govError}</span>
            </div>
          )}

          {loadingGov ? (
            <div className="py-20 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="text-xs font-bold">거버넌스 관제 데이터를 로드하는 중...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* 섹션 1: 실시간 AI 결재 판정 및 보류 현황 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-indigo-600 rounded-full" />
                  <h3 className="text-sm font-black text-slate-800">🛡️ 실시간 AI 삭제 결재 심사 기록</h3>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">발생 일시</th>
                          <th className="py-3 px-4">구분</th>
                          <th className="py-3 px-4">문서 ID / 요약명</th>
                          <th className="py-3 px-4">AI 판정 상태</th>
                          <th className="py-3 px-4 max-w-sm">판정 근거 및 사유</th>
                          <th className="py-3 px-4">요청자</th>
                          <th className="py-3 px-4 text-center">동작</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {govLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              기록된 AI 삭제 결재 심사 이력이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          govLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                                {log.created_at}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                  log.doc_type === 'estimate'
                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : log.doc_type === 'purchase_order'
                                      ? 'bg-purple-50 text-purple-700 border-purple-100'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                }`}>
                                  {log.doc_type === 'estimate' ? '견적' : log.doc_type === 'purchase_order' ? '발주' : '수주'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                                <span className="block text-xs" title={log.doc_title}>{log.doc_title}</span>
                                <span className="text-[10px] text-slate-400 font-mono block">ID: {log.doc_id}</span>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {log.status === "APPROVED_AUTO" ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>자동 승인</span>
                                  </span>
                                ) : log.status === "FORCE_APPROVED" ? (
                                  <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    <ShieldAlert className="w-3 h-3 text-purple-600" />
                                    <span>강제 승인</span>
                                  </span>
                                ) : log.status === "RESTORED" ? (
                                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    <RefreshCw className="w-3 h-3 text-blue-600" />
                                    <span>복원 완료</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                                    <span>결재 보류</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 max-w-sm text-slate-650 leading-relaxed break-all font-medium">
                                {log.reason}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                                {log.operator}
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                {log.status === "PENDING_APPROVAL" ? (
                                  <button
                                    onClick={() => handleForceDelete(log.id, log.doc_type, log.doc_id)}
                                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm shadow-purple-600/10 active:scale-95 inline-flex items-center gap-1 border-0"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <span>강제 삭제 승인</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium">-</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 섹션 2: 소프트 삭제된 전체 대장 내역 */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-indigo-600 rounded-full" />
                  <h3 className="text-sm font-black text-slate-800">🗑️ 소프트 삭제된 전체 대장 내역 (통합 관제)</h3>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">삭제 일시</th>
                          <th className="py-3 px-4">대장 구분</th>
                          <th className="py-3 px-4">문서 번호 (ID)</th>
                          <th className="py-3 px-4">파트너 / 거래처</th>
                          <th className="py-3 px-4 text-right">총 금액</th>
                          <th className="py-3 px-4">삭제 작업자</th>
                          <th className="py-3 px-4 text-center">동작</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {deletedItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              소프트 삭제 임시 보관함에 데이터가 없습니다.
                            </td>
                          </tr>
                        ) : (
                          deletedItems.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                                {item.deleted_at}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                  item.doc_type === 'estimate'
                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : item.doc_type === 'purchase_order'
                                      ? 'bg-purple-50 text-purple-700 border-purple-100'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                }`}>
                                  {item.doc_type === 'estimate' ? '견적' : item.doc_type === 'purchase_order' ? '발주' : '수주'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                                {item.id}
                              </td>
                              <td className="py-3.5 px-4 font-medium whitespace-nowrap">
                                {item.partner_name || item.vendor_name || item.customer_name || '-'}
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold text-slate-800 whitespace-nowrap font-mono">
                                {(item.total_amount || 0).toLocaleString()}원
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                                {item.deleted_by || 'system'}
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <button
                                  onClick={() => handleRestore(item.doc_type, item.id)}
                                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-95 inline-flex items-center gap-1"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>대장 복원</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* 5. 감사 상세 보고서 보기 모달 팝업 */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[88vh]">
            
            {/* 모달 헤더 */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm shrink-0">
                  <Activity className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-855 flex items-center gap-2">
                    <span>자율 액션 상세 감사 리포트</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedLog.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                    }`}>
                      {selectedLog.status === "SUCCESS" ? "성공" : "실패"}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">UUID ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-650 transition-all border-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              
              {/* 기본 요약 카드 */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">호출 대행 기능</span>
                  <span className="font-extrabold text-slate-800">
                    {getToolDisplayName(selectedLog.action_name)} ({selectedLog.action_name})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">대행 실행 시간 (KST)</span>
                  <span className="font-semibold text-slate-600 font-mono">{selectedLog.created_at}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">명령 권한 서명인</span>
                  <span className="font-semibold text-slate-600 font-mono">{selectedLog.operator_username}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">트랜잭션 고유 키</span>
                  <span className="font-mono text-slate-500 text-[10px] break-all">{selectedLog.id}</span>
                </div>
              </div>

              {/* 자연어 프롬프트 */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-455 font-bold block">사용자 원본 자연어 프롬프트</span>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 text-slate-700 leading-relaxed font-semibold italic">
                  &ldquo;{selectedLog.original_prompt}&rdquo;
                </div>
              </div>

              {/* Arguments JSON */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-455 font-bold block">AI 모델 파싱 매개변수 (Arguments)</span>
                {renderJson(selectedLog.arguments_json)}
              </div>

              {/* Execution Result */}
              {selectedLog.status === "SUCCESS" && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-455 font-bold block">비즈니스 API 처리 성공 응답</span>
                  {renderJson(selectedLog.execution_result)}
                </div>
              )}

              {/* Error Message */}
              {selectedLog.status !== "SUCCESS" && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>실패 에러 로그 상세</span>
                  </div>
                  <pre className="text-xs text-rose-800 font-mono whitespace-pre-wrap leading-relaxed break-all p-1">
                    {selectedLog.error_message || "알 수 없는 비즈니스 가드 차단 또는 런타임 예외"}
                  </pre>
                </div>
              )}

            </div>

            {/* 모달 푸터 */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-50 active:scale-95 transition-all font-bold cursor-pointer bg-white text-xs"
              >
                확인 완료
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. 이지봇 업무 대행 기안서 상세 및 실시간 처리 이력 모달 */}
      {selectedFeedback && (() => {
        const details = parseFeedbackDetails(selectedFeedback.user_prompt);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in text-left">
            <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[88vh]">
              
              {/* 모달 헤더 */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm shrink-0">
                    <FileText className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-855 flex items-center gap-2">
                      <span>대행 기안서 상세 및 실시간 처리 이력</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedFeedback.resolved_status === "resolved" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : selectedFeedback.resolved_status === "ignored"
                            ? "bg-slate-50 text-slate-500 border-slate-200"
                            : selectedFeedback.resolved_status === "in_progress"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                        {selectedFeedback.resolved_status === "resolved" ? "조치 완료" : selectedFeedback.resolved_status === "ignored" ? "보류" : selectedFeedback.resolved_status === "in_progress" ? "반영 진행 중" : "검토 대기"}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">기안 ID: {selectedFeedback.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-all border-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 모달 바디 */}
              <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
                
                {/* 1. 기안 기본 정보 카드 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">기안 서명자</span>
                      <span className="font-bold text-slate-800">{details.sender}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">회신 연락처</span>
                      <span className="font-semibold text-slate-650 font-mono">{details.contact}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">소속 고객사</span>
                      <span className="font-semibold text-slate-650">{details.company}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">제안 구분</span>
                      <span className="font-semibold text-indigo-700 font-bold">{details.type}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>최초 기안 시각: {selectedFeedback.created_at || "미기입"}</span>
                    {selectedFeedback.updated_at && (
                      <span>최종 갱신 시각: {selectedFeedback.updated_at}</span>
                    )}
                  </div>
                </div>

                {/* 2. 대행 요청 원문 */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold block">기안서 원본 내용</span>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-medium whitespace-pre-wrap text-[11px]">
                    {details.body || "작성된 상세 기안 내용이 없습니다."}
                  </div>
                </div>

                {/* 첨부파일 다운로드 */}
                {(details.screenshot || details.recording) && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold block">첨부 파일 및 증빙 자료</span>
                    <div className="flex gap-2 flex-wrap">
                      {details.screenshot && (
                        <a 
                          href={details.screenshot} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl font-bold transition-all text-[11px]"
                        >
                          📸 <span>스크린샷 다운로드</span>
                        </a>
                      )}
                      {details.recording && (
                        <a 
                          href={details.recording} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl font-bold transition-all text-[11px]"
                        >
                          🎥 <span>화면녹화 다운로드</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. 처리과정 및 심사 이력 타임라인 (핵심 요구사항) */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] text-slate-500 font-bold block">업무 대행 처리과정 타임라인</span>
                  
                  <div className="relative border-l-2 border-slate-150 pl-6 ml-3 space-y-6">
                    
                    {/* 1단계: 기안 접수 */}
                    <div className="relative">
                      {/* 타임라인 점 */}
                      <span className="absolute -left-[31px] top-0 bg-emerald-50 border-2 border-emerald-500 rounded-full p-1 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-[11px]">1단계. 기안 제출 및 시스템 접수 완료</span>
                          <span className="text-[9px] text-slate-400 font-mono">{selectedFeedback.created_at}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          최고관리자가 이지봇 자율 액션 연동 및 비즈니스 대행을 정식 기안하여, 감사 추적 고유키와 함께 이지데스크 DB에 안전하게 보존되었습니다.
                        </p>
                      </div>
                    </div>

                    {/* 2단계: 기술 검토 */}
                    <div className="relative">
                      {/* 타임라인 점 */}
                      {selectedFeedback.resolved_status === 'pending' ? (
                        <span className="absolute -left-[31px] top-0 bg-blue-50 border-2 border-blue-500 rounded-full p-1 text-blue-600 animate-spin">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="absolute -left-[31px] top-0 bg-emerald-50 border-2 border-emerald-500 rounded-full p-1 text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-[11px]">2단계. AI 기술 검토 및 액션 시나리오 분석</span>
                          {selectedFeedback.resolved_status !== 'pending' && (
                            <span className="text-[9px] text-slate-400 font-mono">
                              {/* 10분 가상 가산 */}
                              {(() => {
                                try {
                                  const d = new Date(selectedFeedback.created_at);
                                  d.setMinutes(d.getMinutes() + 10);
                                  return d.toISOString().replace('T', ' ').slice(0, 19);
                                } catch(e) { return "완료"; }
                              })()}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {selectedFeedback.resolved_status === 'pending' ? (
                            <span className="text-blue-600 font-semibold">이지데스크 AI 에이전트 랩에서 본 요청 기안에 따른 실행 API 적합성과 프로세스 타당성을 정밀 분석 중입니다.</span>
                          ) : (
                            <span>기안 내용에 대한 기술 적합성 검증과 이지봇 자율 액션 시나리오 설계가 완료되었습니다.</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 3단계: 최종 처리 결과 */}
                    <div className="relative">
                      {/* 타임라인 점 */}
                      {selectedFeedback.resolved_status === 'resolved' ? (
                        <span className="absolute -left-[31px] top-0 bg-emerald-50 border-2 border-emerald-500 rounded-full p-1 text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      ) : selectedFeedback.resolved_status === 'ignored' ? (
                        <span className="absolute -left-[31px] top-0 bg-slate-50 border-2 border-slate-400 rounded-full p-1 text-slate-500">
                          <XCircle className="w-3.5 h-3.5" />
                        </span>
                      ) : selectedFeedback.resolved_status === 'in_progress' ? (
                        <span className="absolute -left-[31px] top-0 bg-blue-50 border-2 border-blue-500 rounded-full p-1 text-blue-600">
                          <Clock className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="absolute -left-[31px] top-0 bg-slate-50 border-2 border-slate-350 rounded-full p-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                        </span>
                      )}
                      
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-[11px]">3단계. 최종 심사 결과 및 플랫폼 반영</span>
                          {(selectedFeedback.resolved_status === 'resolved' || selectedFeedback.resolved_status === 'ignored') && (
                            <span className="text-[9px] text-slate-400 font-mono">
                              {/* 1시간 가상 가산 */}
                              {(() => {
                                try {
                                  const d = new Date(selectedFeedback.created_at);
                                  d.setHours(d.getHours() + 1);
                                  return d.toISOString().replace('T', ' ').slice(0, 19);
                                } catch(e) { return "완료"; }
                              })()}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-[11px] text-slate-500 leading-relaxed">
                          {selectedFeedback.resolved_status === 'resolved' ? (
                            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1 text-slate-700">
                              <p className="font-bold text-emerald-800 flex items-center gap-1">
                                <span>🟢 조치 완료</span>
                              </p>
                              <p className="leading-relaxed text-[10.5px]">
                                본 기안에 따른 기능 보완 또는 버그 수정이 완료되어 이지데스크 플랫폼 및 이지봇 시스템에 정식 릴리즈 완료되었습니다. 이제 이지봇에게 해당 업무 대행을 명령하실 수 있습니다!
                              </p>
                            </div>
                          ) : selectedFeedback.resolved_status === 'ignored' ? (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-655">
                              <p className="font-bold text-slate-700 flex items-center gap-1">
                                <span>🟡 보류 처리</span>
                              </p>
                              <p className="leading-relaxed text-[10.5px]">
                                심사결과 현행 지원 범위 외의 작업이거나 타사 연동 API의 제약 사항으로 인해 우선순위가 보류되었습니다. 추후 플랫폼 연동 고도화 로드맵에 따라 재검토 예정입니다.
                              </p>
                            </div>
                          ) : selectedFeedback.resolved_status === 'in_progress' ? (
                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1 text-slate-700">
                              <p className="font-bold text-blue-800 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span>🔵 반영 진행 중</span>
                              </p>
                              <p className="leading-relaxed text-[10.5px]">
                                최고관리자의 승인을 통과하여 개발팀에서 연동 스크립트 작성 및 예외 처리를 개발하고 있습니다. 반영이 완료되면 시스템 알림을 통해 안내해 드립니다.
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1 text-slate-700">
                              <p className="font-bold text-amber-800 flex items-center gap-1">
                                <span>⚪ 심사 대기 중</span>
                              </p>
                              <p className="leading-relaxed text-[10.5px]">
                                기안서의 기술 타당성 검토 완료 후, 최종 심사 및 반영 진행 승인을 대기하고 있는 상태입니다. 24시간 이내에 조치가 접수됩니다.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* 모달 푸터 */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-655 hover:bg-slate-50 active:scale-95 transition-all font-bold cursor-pointer bg-white text-xs"
                >
                  확인 완료
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
