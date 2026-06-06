"use client";

import { useState, useEffect } from "react";
import { 
  Key, ShieldAlert, FileText, CheckCircle2, AlertTriangle, 
  Plus, Eye, EyeOff, Check, X, Shield, Lock, RotateCcw,
  Users, Trash2, Edit, HelpCircle, LockKeyhole, Send, ArrowRight
} from "lucide-react";

interface CredentialItem {
  id: number;
  category: "PHYSICAL_SPACE" | "DEVICE_INFRA" | "WEB_SOFTWARE" | "OTHER";
  asset_name: string;
  login_id: string | null;
  remarks: string | null;
  owner_operator_id: number;
  owner_name: string;
  status: "ACTIVE" | "TRANSFERRED" | "INHERIT_PENDING";
  created_at: string;
  updated_at: string;
  canRevealDirectly: boolean;
  hasEmergencyAccess: boolean;
}

interface EmergencyRequest {
  id: number;
  credential_id: number;
  requester_id: number;
  requester_name: string;
  asset_name: string;
  category: string;
  login_id: string | null;
  request_reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  approved_by: string | null;
  approved_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface AuditLog {
  id: number;
  asset_name: string;
  operator_name: string;
  action_type: "CREATE" | "VIEW_ENCRYPTED" | "DECRYPT_APPROVE" | "DECRYPT_VIEW" | "EDIT" | "DELETE";
  access_reason: string | null;
  created_at: string;
}

interface Operator {
  id: number;
  name: string;
  role: string;
}

export default function PasswordAiPage() {
  const [currentUser, setCurrentUser] = useState<{ id: number | null; role: string; name: string } | null>(null);
  const [list, setList] = useState<CredentialItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, string>>({});
  const [revealingId, setRevealingId] = useState<number | null>(null);
  const [revealReason, setRevealReason] = useState("");
  const [showReasonModal, setShowReasonModal] = useState(false);

  // 등록/수정 모달 관련 상태
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<CredentialItem> | null>(null);
  const [formCategory, setFormCategory] = useState<"PHYSICAL_SPACE" | "DEVICE_INFRA" | "WEB_SOFTWARE" | "OTHER">("PHYSICAL_SPACE");
  const [formAssetName, setFormAssetName] = useState("");
  const [formLoginId, setFormLoginId] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [formOwnerId, setFormOwnerId] = useState<number>(0);

  // 비상 복구 요청 모달 관련 상태
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedAssetForRequest, setSelectedAssetForRequest] = useState<CredentialItem | null>(null);
  const [requestReason, setRequestReason] = useState("");

  // 인수인계 마이그레이션 모달 관련 상태
  const [showInheritModal, setShowInheritModal] = useState(false);
  const [selectedInheritAsset, setSelectedInheritAsset] = useState<CredentialItem | null>(null);
  const [newOwnerId, setNewOwnerId] = useState<number>(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. 세션 확인
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.success) {
        setCurrentUser({ id: meData.id, role: meData.role, name: meData.name });
      }

      // 2. 자산 리스트 및 감사로그 로드
      const listRes = await fetch("/api/password-ai");
      const listData = await listRes.json();
      if (listData.success) {
        setList(listData.list);
        if (listData.auditLogs) {
          setAuditLogs(listData.auditLogs);
        }
      }

      // 3. 비상 결재 요청 이력 로드
      const reqRes = await fetch("/api/password-ai/emergency");
      const reqData = await reqRes.json();
      if (reqData.success) {
        setEmergencyRequests(reqData.requests);
      }

      // 4. 운영자 정보 로드 (드롭다운 바인딩용)
      const opRes = await fetch("/api/operators");
      const opData = await opRes.json();
      if (opData.success && opData.operators) {
        setOperators(opData.operators);
      }
    } catch (e) {
      console.error("데이터 로딩 실패:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔒 비밀번호 복호화 조회 요청
  const handleRevealPassword = async (item: CredentialItem) => {
    // A. 바로 조회가 가능할 때 (본인 소유 또는 최고관리자)
    if (item.canRevealDirectly) {
      if (revealedPasswords[item.id]) {
        // 토글 닫기
        const updated = { ...revealedPasswords };
        delete updated[item.id];
        setRevealedPasswords(updated);
        return;
      }

      // 최고관리자 혹은 소유자가 직접 열 때도 조회 사유가 필요하도록 감사 제어(보안 강화)
      setRevealingId(item.id);
      setRevealReason("");
      setShowReasonModal(true);
    } else if (item.hasEmergencyAccess) {
      // B. 비상 복구 승인 상태
      if (revealedPasswords[item.id]) {
        const updated = { ...revealedPasswords };
        delete updated[item.id];
        setRevealedPasswords(updated);
        return;
      }
      setRevealingId(item.id);
      setRevealReason("");
      setShowReasonModal(true);
    } else {
      // C. 권한이 없어 비상 조회를 신청해야 하는 경우
      setSelectedAssetForRequest(item);
      setRequestReason("");
      setShowRequestModal(true);
    }
  };

  // 🔒 복호화 조회 감사 사유 최종 전송
  const submitRevealReason = async () => {
    if (!revealingId) return;
    try {
      const res = await fetch(`/api/password-ai?action=reveal&id=${revealingId}&reason=${encodeURIComponent(revealReason)}`);
      const data = await res.json();
      if (data.success) {
        setRevealedPasswords({ ...revealedPasswords, [revealingId]: data.password });
        setShowReasonModal(false);
        // 감사로그 갱신
        loadInitialData();
      } else {
        alert(data.error || "복호화 실패");
      }
    } catch (e) {
      alert("서버 연결 실패");
    }
  };

  // 📝 신규 및 수정 자산 저장
  const handleSaveForm = async () => {
    if (!formAssetName || !formCategory) {
      alert("카테고리와 자산명을 정확히 기입해 주세요.");
      return;
    }
    if (!editingItem && !formPassword) {
      alert("초기 비밀번호를 입력해 주세요.");
      return;
    }

    try {
      const body = {
        id: editingItem?.id,
        category: formCategory,
        asset_name: formAssetName,
        login_id: formLoginId || null,
        password: formPassword || null,
        remarks: formRemarks || null,
        owner_operator_id: formOwnerId || null,
        status: editingItem?.status
      };

      const method = editingItem ? "PUT" : "POST";
      const res = await fetch("/api/password-ai", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setShowFormModal(false);
        loadInitialData();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("네트워크 연동 에러");
    }
  };

  // ✏️ 수정 폼 초기화 열기
  const openEditModal = (item: CredentialItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormAssetName(item.asset_name);
    setFormLoginId(item.login_id || "");
    setFormPassword(""); // 보안을 위해 수정 시 비번 필드는 비움 (입력 시에만 변경)
    setFormRemarks(item.remarks || "");
    setFormOwnerId(item.owner_operator_id);
    setShowFormModal(true);
  };

  // ➕ 등록 폼 열기
  const openCreateModal = () => {
    setEditingItem(null);
    setFormCategory("PHYSICAL_SPACE");
    setFormAssetName("");
    setFormLoginId("");
    setFormPassword("");
    setFormRemarks("");
    setFormOwnerId(currentUser?.id || 0);
    setShowFormModal(true);
  };

  // 🗑️ 자산 삭제
  const handleDeleteAsset = async (id: number) => {
    if (!confirm("해당 기밀 자산 정보를 금고에서 영구 삭제하시겠습니까?\n삭제 이력은 감사 대장에 영구 박제됩니다.")) return;
    try {
      const res = await fetch(`/api/password-ai?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        loadInitialData();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("삭제 실패");
    }
  };

  // 🔔 비상 복구 요청 전송
  const submitEmergencyRequest = async () => {
    if (!selectedAssetForRequest || !requestReason.trim()) {
      alert("조회 사유를 입력해 주세요.");
      return;
    }
    try {
      const res = await fetch("/api/password-ai/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          credentialId: selectedAssetForRequest.id,
          requestReason
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowRequestModal(false);
        loadInitialData();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("요청 전송 에러");
    }
  };

  // 👑 최고관리자 결재 처리 (승인/반려)
  const handleApproveRequest = async (requestId: number, action: "approve" | "reject") => {
    if (!confirm(action === "approve" ? "해당 비상 복구 요청을 승인하시겠습니까?\n동료 직원이 24시간 동안 비밀번호를 볼 수 있게 됩니다." : "해당 결재를 반려하시겠습니까?")) return;
    try {
      const res = await fetch("/api/password-ai/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          requestId
        })
      });
      const data = await res.json();
      if (data.success) {
        loadInitialData();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("결재 실패");
    }
  };

  // 👔 인수인계 강제 이관 신청
  const submitInheritOwner = async () => {
    if (!selectedInheritAsset || !newOwnerId) {
      alert("새 인계 담당 직원을 선택해 주세요.");
      return;
    }
    try {
      const res = await fetch("/api/password-ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedInheritAsset.id,
          category: selectedInheritAsset.category,
          asset_name: selectedInheritAsset.asset_name,
          login_id: selectedInheritAsset.login_id,
          remarks: selectedInheritAsset.remarks,
          owner_operator_id: newOwnerId,
          status: "TRANSFERRED" // 인수인계 완료
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("기밀 자산 소유주가 변경되어 인수인계가 최종 완료되었습니다.");
        setShowInheritModal(false);
        loadInitialData();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("인계 처리 실패");
    }
  };

  // AI 보안성 지수 연산 (간단한 클라이언트 계산)
  const calculateSecurityMetrics = () => {
    if (list.length === 0) return { score: 100, weakCount: 0, pendingInherit: 0 };
    let weakCount = 0;
    let pendingInherit = 0;

    list.forEach(item => {
      // 퇴사 대기 자산 감지
      if (item.status === "INHERIT_PENDING") {
        pendingInherit++;
      }
      // 간단한 비고 란 힌트 분석이나 임시 조건
      if (item.remarks && (item.remarks.includes("1234") || item.remarks.includes("0000"))) {
        weakCount++;
      }
    });

    // 기본 점수 100점에서 취약 비번당 15점 차감, 퇴사 미인계 건당 20점 차감
    let score = 100 - (weakCount * 15) - (pendingInherit * 20);
    if (score < 10) score = 10;

    return { score, weakCount, pendingInherit };
  };

  const metrics = calculateSecurityMetrics();

  // 카테고리 매핑 레이블
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "PHYSICAL_SPACE":
        return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">물리적 공간/금고</span>;
      case "DEVICE_INFRA":
        return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">기기/인프라 NAS</span>;
      case "WEB_SOFTWARE":
        return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">관리자 계정/웹</span>;
      default:
        return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-100">기타 자산</span>;
    }
  };

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* 🚀 상단 헤더 영역 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-650 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3">
              <Lock className="w-8 h-8 text-yellow-300 animate-pulse" />
              비밀번호관리 AI
            </h1>
            <p className="text-xs md:text-sm text-blue-100 font-medium max-w-2xl leading-relaxed">
              사내 중요 기기, 문서 금고, 웹 서비스 관리자 계정을 중앙에서 암호화 보관합니다.
              담당 직원의 갑작스러운 휴가나 퇴사 시 최고관리자 이중 통제(Dual-Auth) 결재 프로세스를 통해 업무 마비를 방지합니다.
            </p>
          </div>
          <button 
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black rounded-2xl text-sm transition-all transform hover:scale-[1.03] active:scale-95 shadow-md shrink-0 self-start md:self-center"
          >
            <Plus className="w-4.5 h-4.5" />
            신규 기밀 자산 등록
          </button>
        </div>
      </div>

      {/* 📊 메인 지표 & AI 리스크 보드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI 보안 건전도 스코어 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-extrabold block">AI 보안 건전도 지수</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{metrics.score}</span>
              <span className="text-xs text-slate-400 font-bold">/ 100점</span>
            </div>
            <span className={`text-[10px] font-bold block ${metrics.score >= 80 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {metrics.score >= 80 ? '보안 상태 우수' : '취약 위험 자산 식별됨'}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50/50">
            <Shield className={`w-10 h-10 ${metrics.score >= 80 ? 'text-blue-500' : 'text-rose-500'}`} />
          </div>
        </div>

        {/* 취약 패스워드 경보 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-extrabold block">AI 분석 취약 비번 개수</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-500">{metrics.weakCount}</span>
              <span className="text-xs text-slate-400 font-bold">건</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">
              '0000' 등 위험 패턴 실시간 탐지 결과
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50/50">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
        </div>

        {/* 인수인계 필요 비상 대기 건 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-extrabold block">퇴사/부재 인수인계 대기</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-yellow-600">{metrics.pendingInherit}</span>
              <span className="text-xs text-slate-400 font-bold">건</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">
              퇴사자의 독점 소유 자산 백필 필요
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50/50">
            <Users className="w-10 h-10 text-amber-500" />
          </div>
        </div>
      </div>

      {/* 👑 최고관리자 결재 대기 패널 */}
      {currentUser?.role === "SUPER_ADMIN" && emergencyRequests.filter(r => r.status === "PENDING").length > 0 && (
        <div className="bg-amber-50/50 rounded-2xl border border-amber-200/60 p-5 space-y-4">
          <h2 className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-amber-600" />
            승인 대기 중인 비상 복구 요청 ({emergencyRequests.filter(r => r.status === "PENDING").length}건)
          </h2>
          <div className="space-y-2.5">
            {emergencyRequests.filter(r => r.status === "PENDING").map(req => (
              <div key={req.id} className="bg-white p-4 rounded-xl border border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-3xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">{req.requester_name}</span>
                    <span className="text-[10px] text-slate-400 font-bold">요청자</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-xs font-extrabold text-blue-600">{req.asset_name}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">요청 사유: <strong className="text-slate-700">{req.request_reason}</strong></p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => handleApproveRequest(req.id, "approve")}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold border-none cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    결재 승인
                  </button>
                  <button 
                    onClick={() => handleApproveRequest(req.id, "reject")}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold border-none cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    반려
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 💼 비밀번호 관리 금고 메인 리스트 */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
          <LockKeyhole className="w-5 h-5 text-blue-500" />
          기밀 비밀번호 안전 대장 ({list.length}건)
        </h2>

        {isLoading ? (
          <div className="text-center py-12 text-xs text-slate-400 font-bold">로딩 중입니다...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400 font-bold">등록된 기밀 비밀번호 자산이 없습니다.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map(item => {
              const isRevealed = revealedPasswords[item.id] !== undefined;
              const isPendingInherit = item.status === "INHERIT_PENDING";

              return (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    isPendingInherit 
                      ? "border-yellow-200 bg-yellow-50/20" 
                      : "border-slate-100 bg-white hover:shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getCategoryBadge(item.category)}
                        {isPendingInherit && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
                            인수인계 대기 (퇴사자 자산)
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-slate-800 truncate">{item.asset_name}</h3>
                      
                      <div className="space-y-1 text-xs text-slate-400">
                        {item.login_id && (
                          <div>계정 ID: <span className="font-extrabold text-slate-700">{item.login_id}</span></div>
                        )}
                        <div>소유 임직원: <span className="font-bold text-slate-600">{item.owner_name}</span></div>
                        {item.remarks && (
                          <div className="text-[10px] text-slate-400 italic">설명: {item.remarks}</div>
                        )}
                      </div>

                      {/* 🔑 실시간 복호화 패널 */}
                      <div className="pt-2 flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono font-bold text-slate-700 select-all min-w-[140px] text-center">
                          {isRevealed ? revealedPasswords[item.id] : "••••••••••••"}
                        </div>
                        <button
                          onClick={() => handleRevealPassword(item)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isRevealed
                              ? "bg-slate-100 text-slate-500 border-slate-200"
                              : item.canRevealDirectly || item.hasEmergencyAccess
                                ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                                : "bg-yellow-50 text-yellow-600 border-yellow-100 hover:bg-yellow-100"
                          }`}
                          title={isRevealed ? "암호 가리기" : item.canRevealDirectly ? "비밀번호 직접 조회" : "비상 복구 요청 신청"}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* 조작 액션 */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isPendingInherit && (
                        <button
                          onClick={() => {
                            setSelectedInheritAsset(item);
                            setNewOwnerId(0);
                            setShowInheritModal(true);
                          }}
                          className="p-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-lg border-none cursor-pointer"
                          title="새 담당자에게 인수인계 실행"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(item.canRevealDirectly || currentUser?.role === "SUPER_ADMIN") && (
                        <>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg cursor-pointer"
                            title="수정"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(item.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-lg cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🧾 최고관리자용 보안 감사 대장 타임라인 */}
      {currentUser?.role === "SUPER_ADMIN" && auditLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            보안 감사 추적 로그 (실시간 타임라인)
          </h2>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs leading-normal">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-700">{log.operator_name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">
                      {log.action_type}
                    </span>
                    {log.asset_name && (
                      <span className="font-extrabold text-blue-600">[{log.asset_name}]</span>
                    )}
                  </div>
                  {log.access_reason && (
                    <p className="text-slate-500 font-medium">조회/수행 사유: <strong className="text-slate-700">{log.access_reason}</strong></p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-bold shrink-0">{log.created_at}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. 조회 사유 입력 모달 */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-lg border border-slate-100">
            <div className="flex items-center gap-2 text-indigo-650">
              <Shield className="w-5.5 h-5.5 text-blue-500" />
              <h3 className="font-extrabold text-base text-slate-800">조회 감사 사유 기입</h3>
            </div>
            <p className="text-xs text-slate-400 leading-normal font-semibold">
              비밀번호 복호화 조회 기록은 감사 대장에 영구 박제됩니다. 조회 사유를 상세하게 기재해 주세요.
            </p>
            <input 
              type="text" 
              placeholder="예: R&D 서버 백업 확인, 금고 법인감사 문서 열람"
              value={revealReason}
              onChange={e => setRevealReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => {
                  setShowReasonModal(false);
                  setRevealingId(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold border-none"
              >
                취소
              </button>
              <button 
                onClick={submitRevealReason}
                disabled={!revealReason.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold border-none cursor-pointer"
              >
                비밀번호 확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 비상 복구 요청 신청 모달 */}
      {showRequestModal && selectedAssetForRequest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-lg border border-slate-100">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5.5 h-5.5 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-800">비상 복구 및 열람 신청</h3>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] text-slate-400 font-extrabold">조회 대상 자산</span>
              <h4 className="text-xs font-black text-slate-800">{selectedAssetForRequest.asset_name}</h4>
              <span className="text-[10px] text-slate-400 font-bold block">소유자: {selectedAssetForRequest.owner_name}</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal font-semibold">
              현재 해당 기밀 정보는 동료 직원이 독점 소유하고 있어 마스킹 처리되어 있습니다.
              부재중이거나 퇴사하여 부득이 조회해야 한다면, 최고관리자의 승인을 받기 위해 구체적인 사유를 작성하십시오.
            </p>
            <input 
              type="text" 
              placeholder="예: 홍길동 대리 휴가로 인한 본관 도어락 해제 필요"
              value={requestReason}
              onChange={e => setRequestReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold border-none"
              >
                취소
              </button>
              <button 
                onClick={submitEmergencyRequest}
                disabled={!requestReason.trim()}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-slate-900 rounded-lg text-xs font-black border-none cursor-pointer"
              >
                비상 복구 요청 전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 자산 등록 및 수정 모달 */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-lg border border-slate-100 overflow-y-auto max-h-[90vh]">
            <h3 className="font-extrabold text-base text-slate-800 pb-2 border-b border-slate-100">
              {editingItem ? "기밀 자산 정보 및 비밀번호 수정" : "신규 기밀 비밀번호 등록"}
            </h3>

            <div className="space-y-3.5">
              {/* 카테고리 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-extrabold">카테고리</label>
                <select 
                  value={formCategory} 
                  onChange={e => setFormCategory(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white"
                >
                  <option value="PHYSICAL_SPACE">물리적 공간 / 도어락 / 금고</option>
                  <option value="DEVICE_INFRA">기기 / 서버 / 인프라 NAS</option>
                  <option value="WEB_SOFTWARE">웹서비스 / ERP / 관리자 계정</option>
                  <option value="OTHER">기타 자산</option>
                </select>
              </div>

              {/* 자산명 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-extrabold">기밀 자산명</label>
                <input 
                  type="text" 
                  placeholder="예: 본사 3층 자금 보관용 메인 금고"
                  value={formAssetName}
                  onChange={e => setFormAssetName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>

              {/* 로그인 ID */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-extrabold">로그인 ID (선택)</label>
                <input 
                  type="text" 
                  placeholder="계정 아이디가 존재하는 경우 기재"
                  value={formLoginId}
                  onChange={e => setFormLoginId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>

              {/* 비밀번호 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-extrabold">
                  {editingItem ? "비밀번호 재설정 (입력 시에만 변경)" : "초기 비밀번호"}
                </label>
                <input 
                  type="text" 
                  placeholder={editingItem ? "기존 비밀번호 유지하려면 공란" : "안전한 대칭 암호 입력"}
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>

              {/* 소유 담당자 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-extrabold">기밀 자산 소유 임직원</label>
                <select 
                  value={formOwnerId} 
                  onChange={e => setFormOwnerId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white"
                >
                  <option value={0}>담당자 선택</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>{op.name} ({op.role})</option>
                  ))}
                </select>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-extrabold">설명 및 비고</label>
                <input 
                  type="text" 
                  placeholder="위치 힌트, 계정 사용 목적 등 추가 기재"
                  value={formRemarks}
                  onChange={e => setFormRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold border-none"
              >
                취소
              </button>
              <button 
                onClick={handleSaveForm}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold border-none cursor-pointer"
              >
                보안 금고에 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 인수인계 강제 이관 모달 */}
      {showInheritModal && selectedInheritAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-lg border border-slate-100">
            <div className="flex items-center gap-2 text-yellow-600">
              <RotateCcw className="w-5.5 h-5.5 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-800">퇴사자 자산 인수인계</h3>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] text-slate-400 font-extrabold">인계할 자산명</span>
              <h4 className="text-xs font-black text-slate-800">{selectedInheritAsset.asset_name}</h4>
              <span className="text-[10px] text-rose-500 font-bold block">기존 소유주: {selectedInheritAsset.owner_name} (퇴사)</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal font-semibold">
              퇴사한 직원이 관리하던 기밀 비밀번호를 새롭게 담당할 직원에게 안전하게 인계합니다. 
              담당자를 변경하면 자산 상태가 ACTIVE로 전환됩니다.
            </p>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-extrabold">새 인수 담당자</label>
              <select 
                value={newOwnerId} 
                onChange={e => setNewOwnerId(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white"
              >
                <option value={0}>새 인수 직원 선택</option>
                {operators.filter(op => op.name !== selectedInheritAsset.owner_name).map(op => (
                  <option key={op.id} value={op.id}>{op.name} ({op.role})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowInheritModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold border-none"
              >
                취소
              </button>
              <button 
                onClick={submitInheritOwner}
                disabled={!newOwnerId}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold border-none cursor-pointer"
              >
                인수인계 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
