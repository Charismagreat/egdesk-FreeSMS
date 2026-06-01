"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, Shield, UploadCloud, Lock, 
  Send, Bot, Mic, Compass, Cpu, CheckCircle2, AlertCircle, 
  X, Layers, Play, UserCheck, RefreshCw, Settings, Trash2, Plus,
  GitBranch, HelpCircle, ArrowRight
} from "lucide-react";

// 타입 정의
interface DocumentApproval {
  document_id: string;
  approver_id: string;
  step_number: number;
  step_type: string;
  status: string;
  comments: string;
  processed_at: string | null;
}

interface KnowledgeDocument {
  document_id: string;
  title: string;
  doc_type: string;
  file_path: string | null;
  thumbnail_path: string | null;
  creator_id: string;
  dept_code: string;
  security_level: "A" | "B" | "C";
  content: string;
  metadata_json: string;
  status: "DRAFT" | "PENDING" | "APPROVED_AUTO" | "APPROVED_MANUAL" | "REJECTED";
  autopilot_score: number;
  created_at: string;
  updated_at: string;
  metadata?: any;
  approvals?: DocumentApproval[];
}

interface AssetType {
  id: string;
  type_name: string;
  created_at: string;
  created_by: string;
}

export default function KnowledgeAiDashboard() {
  // 상태 변수
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  
  // 동적 자산 종류 목록 상태
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [isAssetTypesLoading, setIsAssetTypesLoading] = useState(true);
  const [isTypeVaultOpen, setIsTypeVaultOpen] = useState(false);
  const [newAssetTypeName, setNewAssetTypeName] = useState("");
  const [vaultError, setVaultError] = useState<string | null>(null);

  // 모의 세션 권한 (Zero-Trust 데모용 토글 지원)
  const [currentUser, setCurrentUser] = useState("ceo_park");
  const [currentRole, setCurrentRole] = useState<"SUPER_ADMIN" | "PRESIDENT" | "SUB_OPERATOR">("SUPER_ADMIN");
  const [currentDept, setCurrentDept] = useState("STRATEGY");
  
  // 업로드 관련 상태
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState(""); // 동적 바인딩을 위해 공백으로 초기화
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [autopilotAnimScore, setAutopilotAnimScore] = useState(0);
  const [showAutopilotModal, setShowAutopilotModal] = useState(false);
  const [autopilotResult, setAutopilotResult] = useState<any>(null);

  // RAG 챗봇 관련 상태
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string; tableData?: any[]; docLink?: string }>>([
    { 
      sender: "bot", 
      text: "안녕하세요! EGDESK 전사 지식 RAG 비서 이지봇입니다. 제로 트러스트 규정에 따라 승인 및 보안 심사가 완료된 사내 문서 기반의 안전한 의사결정을 실시간 지원합니다. 무엇이든 물어보세요!🎙️"
    }
  ]);
  const [isRecording, setIsRecording] = useState(false);

  // CAD 줌 상태
  const [cadZoom, setCadZoom] = useState(1);
  const [cadPan, setCadPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // 오디오 플레이어 시뮬레이션
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // 1. 자산 종류(Category) 리스트 가져오기
  const fetchAssetTypes = async () => {
    setIsAssetTypesLoading(true);
    try {
      const res = await fetch("/api/knowledge-ai/types");
      const data = await res.json();
      if (data.success && data.assetTypes) {
        setAssetTypes(data.assetTypes);
        // 기본 기안 상신용 자산 종류 디폴트값 설정
        if (data.assetTypes.length > 0 && !uploadType) {
          setUploadType(data.assetTypes[0].type_name);
        }
      }
    } catch (err) {
      console.error("Failed to load asset types:", err);
    } finally {
      setIsAssetTypesLoading(false);
    }
  };

  // 2. 신규 자산 종류 등록 (최고관리자 권한 필요)
  const handleCreateAssetType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetTypeName.trim()) return;
    setVaultError(null);

    try {
      const res = await fetch("/api/knowledge-ai/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          type_name: newAssetTypeName,
          user_role: currentRole,
          user_id: currentUser
        })
      });
      const data = await res.json();
      if (data.success) {
        setAssetTypes(data.assetTypes);
        setNewAssetTypeName("");
      } else {
        setVaultError(data.error);
      }
    } catch (err) {
      console.error(err);
      setVaultError("네트워크 오류가 발생했습니다.");
    }
  };

  // 3. 자산 종류 삭제 (최고관리자 권한 & 사용량 무결성 락 작동)
  const handleDeleteAssetType = async (id: string) => {
    setVaultError(null);
    try {
      const res = await fetch("/api/knowledge-ai/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE",
          id,
          user_role: currentRole,
          user_id: currentUser
        })
      });
      const data = await res.json();
      if (data.success) {
        setAssetTypes(data.assetTypes);
        // 혹시 업로드 선택된 상태였으면 첫번째로 재조정
        if (data.assetTypes.length > 0) {
          setUploadType(data.assetTypes[0].type_name);
        }
      } else {
        setVaultError(data.error);
      }
    } catch (err) {
      console.error(err);
      setVaultError("네트워크 오류가 발생했습니다.");
    }
  };

  // 지식 문서 데이터 로드
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/knowledge-ai?userId=${currentUser}&role=${currentRole}&dept=${currentDept}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
        // 기본 첫 번째 문서를 디테일로 선택
        if (data.documents.length > 0 && !selectedDoc) {
          setSelectedDoc(data.documents[0]);
        } else if (selectedDoc) {
          const updated = data.documents.find((d: any) => d.document_id === selectedDoc.document_id);
          if (updated) setSelectedDoc(updated);
        }
      }
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetTypes();
    fetchDocuments();
  }, [currentUser, currentRole, currentDept]);

  // 권한 등급 하향 조정 (Zero-Trust A -> B/C)
  const handleDowngradeSecurity = async (docId: string, newLevel: "B" | "C") => {
    try {
      const res = await fetch("/api/knowledge-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DOWNGRADE",
          document_id: docId,
          new_level: newLevel,
          user_role: currentRole
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchDocuments();
      } else {
        alert(`보안 에러: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 수동 결재 승인 / 반려
  const handleApproveDocument = async (docId: string, status: "APPROVED" | "REJECTED", comments: string) => {
    try {
      const res = await fetch("/api/knowledge-ai/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: docId,
          approver_id: currentUser,
          status,
          comments
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchDocuments();
      } else {
        alert(`결재 처리 에러: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 비정형 파일 시뮬레이션 업로드
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return alert("기안 문서 제목을 입력하십시오.");
    if (!uploadType) return alert("자산 종류를 지정하십시오.");

    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 150);

    setTimeout(async () => {
      try {
        const dummyFileName = 
          uploadType.includes("도면") ? "engine_casing_v4.dwg" :
          uploadType.includes("녹음") || uploadType.includes("영상") ? "board_meeting_0601.mp3" :
          uploadType.includes("명함") ? "partner_ceo_card.jpg" :
          "office_supplies_request.xlsx";

        // 파서용 매핑 명칭
        const internalDocType = 
          uploadType.includes("도면") ? "CAD_BLUEPRINT" :
          uploadType.includes("명함") ? "B_CARD" :
          uploadType.includes("녹음") || uploadType.includes("영상") ? "AUDIO_RECORDING" :
          uploadType.includes("회의록") ? "MINUTES" : "PROPOSAL";

        const res = await fetch("/api/knowledge-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "UPLOAD",
            title: uploadTitle,
            doc_type: uploadType, // 최고관리자가 정의한 한글 분류명 그대로 적재
            creator_id: currentUser,
            dept_code: currentDept,
            file_name: dummyFileName,
            file_size: "4.2 MB"
          })
        });

        const data = await res.json();
        if (data.success) {
          setUploadProgress(100);
          setAutopilotResult(data.document);
          setShowAutopilotModal(true);
          
          let currentScore = 0;
          const target = data.document.autopilot_score;
          const scoreInterval = setInterval(() => {
            currentScore += 3;
            if (currentScore >= target) {
              setAutopilotAnimScore(target);
              clearInterval(scoreInterval);
            } else {
              setAutopilotAnimScore(currentScore);
            }
          }, 30);

          setUploadTitle("");
          setUploadFile(null);
          fetchDocuments();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }, 1000);
  };

  // RAG 질문 발송
  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");

    setTimeout(() => {
      let responseText = "";
      let responseTable: any[] | undefined = undefined;
      let docLink: string | undefined = undefined;

      const lower = userText.toLowerCase();

      if (lower.includes("배터리") || lower.includes("cad") || lower.includes("도면")) {
        if (currentRole === "SUPER_ADMIN" || currentRole === "PRESIDENT") {
          responseText = "차세대 초경량 배터리팩 3D 설계도(doc-cad-001)에 따르면, 에너지 밀도 개선을 위해 핵심 다이캐스팅 압착 프레임 설계와 냉각 통로가 탑재되어 있습니다. 분석된 핵심 자재 BOM 리스트는 다음과 같습니다.";
          responseTable = [
            { "품목명": "알루미늄 프레임 AL-6061", "수량": "4개", "공정": "CNC가공" },
            { "품목명": "전력 동박 버스바 (Copper)", "수량": "2개", "공정": "특수압착" },
            { "품목명": "수랭식 냉각 플레이트 V2", "수량": "1개", "공정": "레이저밀봉" }
          ];
          docLink = "doc-cad-001";
        } else {
          responseText = "⚠️ 접근이 거부되었습니다. [차세대 초경량 배터리팩 3D 설계도]는 최고 기밀(A 등급) 자산으로 규정되어 있어 현재 질문자님의 보안 등급 세션에서는 내용 열람 및 RAG 컨텍스트 접근이 원천 봉쇄됩니다.";
        }
      } 
      else if (lower.includes("회의록") || lower.includes("녹취") || lower.includes("m&a")) {
        if (currentRole === "SUPER_ADMIN" || currentRole === "PRESIDENT") {
          responseText = "글로벌 M&A 전략 회의록(doc-audio-001) 분석 결과, 북미 현지 벤처 인수를 위한 제안 예산 한도는 45억 원으로 의결되었으며 핵심 액션 아이템은 다음과 같습니다.";
          responseTable = [
            { "담당자": "최윤석 부사장", "업무": "투자사 LOI(의향서) 법률 자문", "기한": "2026-07-15" },
            { "담당자": "강수진 전략본부장", "업무": "베타 서비스 인프라 RAG 관제 및 PV 테스트", "기한": "2026-08-01" }
          ];
          docLink = "doc-audio-001";
        } else {
          responseText = "⚠️ 접근이 거부되었습니다. 해당 회의 녹취 정보는 A등급 최고 기밀 자산입니다. 최고관리자의 공식 심사 하향 처리가 완료되기 전까지는 검색 및 요약이 차단됩니다.";
        }
      } 
      else if (lower.includes("실적") || lower.includes("영업") || lower.includes("마진")) {
        if (currentRole === "SUPER_ADMIN" || currentRole === "PRESIDENT" || currentDept === "SALES") {
          responseText = "2026년 2분기 영업본부 실적 보고서(doc-report-001)에 따르면, 핵심 B2B 파트너사의 오더량이 15% 가량 증가하여 총 영업 이익이 전분기 대비 8.5% 가량 큰 폭으로 개선되었습니다. 요약 지표는 다음과 같습니다.";
          responseTable = [
            { "구분": "총 영업 매출액", "지표": "4억 8천만원", "성장률": "+12.4%" },
            { "구분": "최종 영업 이익", "지표": "5,200만원", "성장률": "+8.5%" },
            { "구분": "공헌 마진율", "지표": "10.8%", "성장률": "+1.1%p" }
          ];
          docLink = "doc-report-001";
        } else {
          responseText = "⚠️ 접근이 거부되었습니다. [영업본부 실적 및 마진 보고서]는 B등급 부서 대외비 자산입니다. 질문자님의 소속 부서(STRATEGY)가 기안 부서(SALES)와 다르며 부서 권한이 부여되지 않았습니다.";
        }
      } 
      else if (lower.includes("주유비") || lower.includes("청구") || lower.includes("유류")) {
        responseText = "영업본부 외근용 차량 주유비 지급 청구서(doc-draft-001) 분석 결과, 김도현 주임이 상신한 6월분 주유비(78,000원)는 10만 원 이하의 소액 정형 지출 건에 해당하여 AI 파일럿(Autopilot)에 의해 전결 자동 승인 완료된 지식 문서입니다.";
        docLink = "doc-draft-001";
      } 
      else if (lower.includes("명함") || lower.includes("한울테크") || lower.includes("김진수")) {
        responseText = "한울테크 바이어 명함 연동 데이터(doc-card-001)에 근거한 김진수 상무님의 인적 명세 정보입니다.";
        responseTable = [
          { "항목": "소속 및 회사", "값": "한울테크 (Hanul Tech)" },
          { "항목": "이름 및 직급", "값": "김진수 상무" },
          { "항목": "휴대폰 연락처", "값": "010-3456-7890" },
          { "항목": "이메일 주소", "값": "jskim@hanultech.com" }
        ];
        docLink = "doc-card-001";
      } 
      else {
        responseText = "질문하신 내용과 연관된 사내 지식 문서를 RAG 검색망에서 탐색하지 못했거나, 보안 필터링 규정에 따라 격리되었습니다. 질문 키워드를 구체적으로 입력하시거나 (예: '배터리 도면', '영업 실적', '회의록'), 최고관리자 계정을 통해 보안 등급 심사를 진행해 주십시오.";
      }

      setChatMessages(prev => [...prev, { 
        sender: "bot", 
        text: responseText,
        tableData: responseTable,
        docLink
      }]);
    }, 800);
  };

  // 음성 질문 시뮬레이션
  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      setChatInput("2분기 영업본부 마진 및 실적 요약해줘");
    } else {
      setIsRecording(true);
      setChatInput("🎙️ 목소리 녹취 분석 중...");
      setTimeout(() => {
        setIsRecording(false);
        setChatInput("차세대 초경량 배터리팩 도면의 BOM 리스트 알려줘");
      }, 2000);
    }
  };

  // CAD 드래그 및 팬 시뮬레이션
  const handleCadMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - cadPan.x, y: e.clientY - cadPan.y };
  };

  const handleCadMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setCadPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleCadMouseUp = () => {
    isDragging.current = false;
  };

  // 오디오 재생 시뮬레이션
  useEffect(() => {
    let timer: any;
    if (isPlayingAudio) {
      timer = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 2.5;
        });
      }, 200);
    }
    return () => clearInterval(timer);
  }, [isPlayingAudio]);

  return (
    <div className="p-8 w-full max-w-none bg-slate-50 min-h-screen text-slate-800">
      
      {/* 1. 상단 타이틀 영역 (여백 및 스타일 통일) */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
            <Compass className="w-8 h-8 text-slate-500 mr-3 animate-spin-slow" />
            지식 관리 AI
          </h1>
          <p className="text-slate-500 mt-2">비정형 문서의 결재 이력 감사 및 Zero-Trust 사내 지식 RAG 분석을 관제합니다.</p>
        </div>

        {/* 데모용 세션 계정 모의 조작 패널 - 디자인 조화롭게 밝게 */}
        <div className="flex flex-wrap items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-sm self-start">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> 권한:
          </span>
          <button 
            onClick={() => { setCurrentUser("ceo_park"); setCurrentRole("SUPER_ADMIN"); setCurrentDept("STRATEGY"); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${currentRole === "SUPER_ADMIN" ? "bg-rose-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            최고관리자 (대표)
          </button>
          <button 
            onClick={() => { setCurrentUser("sales_manager"); setCurrentRole("SUB_OPERATOR"); setCurrentDept("SALES"); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${currentRole === "SUB_OPERATOR" && currentDept === "SALES" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            영업부서장
          </button>
          <button 
            onClick={() => { setCurrentUser("rnd_engineer"); setCurrentRole("SUB_OPERATOR"); setCurrentDept("RND"); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${currentRole === "SUB_OPERATOR" && currentDept === "RND" ? "bg-cyan-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            일반사원
          </button>
        </div>
      </div>

      {/* 2. 최고관리자 전용 Zero-Trust 보안 심사 피드 (Confidential Review Console) - 라이트 테마 */}
      {(currentRole === "SUPER_ADMIN" || currentRole === "PRESIDENT") && (
        <section className="bg-gradient-to-r from-rose-50 to-slate-50 border border-rose-200 p-5 rounded-2xl mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
            <h2 className="text-md font-bold text-rose-700">Zero-Trust 기밀 문서 등급 심사 피드 (최고관리자 전용)</h2>
            <span className="text-xs text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200 font-semibold">
              최초 등록 시 A등급 강제 격리 상태
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.filter(d => d.security_level === "A").map(doc => (
              <div 
                key={doc.document_id} 
                className="bg-white border border-rose-100 hover:border-rose-300 p-4 rounded-xl flex flex-col justify-between shadow-sm transition-all group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded border border-rose-200 font-bold font-mono">
                      {doc.doc_type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{doc.created_at}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2 truncate group-hover:text-rose-600 transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 bg-slate-50 p-2 rounded border border-slate-100 font-mono">
                    {doc.content.replace(/[#*`]/g, "")}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-xs text-rose-600 flex items-center gap-1 font-bold">
                    <Lock className="w-3.5 h-3.5" /> 최고기밀(A)
                  </span>
                  
                  {/* 등급 하향 심사 셀렉터 */}
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleDowngradeSecurity(doc.document_id, "B")}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-bold transition-all"
                    >
                      B (대외비)
                    </button>
                    <button 
                      onClick={() => handleDowngradeSecurity(doc.document_id, "C")}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold transition-all"
                    >
                      C (공개)
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {documents.filter(d => d.security_level === "A").length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                🎉 심사 대기 중인 A등급 기밀 문서가 없습니다. 모든 지식 자산이 안전하게 정산/분류되었습니다.
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. 대시보드 3단 격자 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* [좌측 4열]: 문서 리스트 및 비정형 업로드 폼 */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI 비정형 기안 등록 (Ingest Hub) - 라이트 테마 */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
              <UploadCloud className="w-4.5 h-4.5 text-blue-500" />
              AI 비정형 기안 등록 (Ingest Hub)
            </h2>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">기안 및 문서 제목</label>
                <input 
                  type="text" 
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="예: 3차 소형 섀시 도면 승인 상신"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8">
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">자산 종류</label>
                  <div className="flex gap-1.5">
                    {/* 동적 자산 분류 리스트 연동 */}
                    <select 
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-700"
                    >
                      {isAssetTypesLoading ? (
                        <option>분류 로딩 중...</option>
                      ) : assetTypes.map(item => (
                        <option key={item.id} value={item.type_name}>
                          {item.type_name}
                        </option>
                      ))}
                    </select>

                    {/* 최고관리자/대표자용 자산 종류 동적 관리 톱니바퀴 이식 */}
                    {(currentRole === "SUPER_ADMIN" || currentRole === "PRESIDENT") && (
                      <button
                        type="button"
                        onClick={() => { setVaultError(null); setIsTypeVaultOpen(true); }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 text-slate-500 transition-colors flex items-center justify-center"
                        title="자산 종류 동적 편집 및 무결성 락 관리"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="col-span-4">
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">기안자 및 소속</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 font-mono select-none truncate">
                    {currentUser}
                  </div>
                </div>
              </div>

              {/* 드래그 앤 드롭 업로드 카드 */}
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-500/60 hover:bg-blue-50/20 transition-all rounded-xl p-6 text-center cursor-pointer relative group">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                <Cpu className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors mx-auto mb-2 animate-bounce-slow" />
                <span className="block text-xs font-semibold text-slate-600">
                  {uploadFile ? uploadFile.name : "여기에 파일 드래그 또는 클릭"}
                </span>
                <span className="block text-[10px] text-slate-400 mt-1">
                  DWG, DXF, PNG, JPG, MP3, WAV, XLSX (최대 50MB)
                </span>
              </div>

              <button 
                type="submit"
                disabled={isUploading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs hover:from-blue-700 hover:to-indigo-700 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    AI OCR 및 비정형 구문 파싱 중... ({uploadProgress}%)
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    AI 기안 상신 (자동 A등급 강제 격리 🔒)
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 사내 지식 자산 리스트 */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col max-h-[480px]">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
              <Layers className="w-4.5 h-4.5 text-blue-500" />
              사내 지식 자산 리스트
            </h2>
            
            <div className="overflow-y-auto space-y-3 flex-1 pr-1 scrollbar-thin">
              {isLoading ? (
                <div className="text-center py-8 text-slate-400 text-xs">데이터 로딩 중...</div>
              ) : documents.map(doc => (
                <div 
                  key={doc.document_id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`border p-3.5 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 ${selectedDoc?.document_id === doc.document_id ? "bg-blue-50/40 border-blue-500 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"}`}
                >
                  <div className="min-w-0 flex-1 font-mono">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border ${doc.security_level === "A" ? "bg-rose-50 text-rose-600 border-rose-200" : doc.security_level === "B" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                        {doc.security_level === "A" ? "🔒 A기밀" : doc.security_level === "B" ? "🔑 B대외비" : "🌐 C공개"}
                      </span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[80px]">
                        {doc.doc_type}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 truncate font-sans">{doc.title}</h3>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span>{doc.creator_id}</span>
                      <span>{doc.created_at.substring(5, 16)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch font-mono">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-sans ${doc.status === "APPROVED_AUTO" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : doc.status === "APPROVED_MANUAL" ? "bg-cyan-50 text-cyan-600 border border-cyan-200" : doc.status === "REJECTED" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-yellow-50 text-yellow-600 border border-yellow-200"}`}>
                      {doc.status === "APPROVED_AUTO" ? "자동전결" : doc.status === "APPROVED_MANUAL" ? "수동승인" : doc.status === "REJECTED" ? "반려됨" : "결재중"}
                    </span>
                    {doc.autopilot_score > 0 && (
                      <span className="text-[10px] text-blue-600 font-bold">
                        {doc.autopilot_score}p
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* [중앙 5열]: 비정형 데이터 특화 프리뷰어 및 본문 */}
        <div className="lg:col-span-5 space-y-6">
          {selectedDoc ? (
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col min-h-[500px]">
              
              {/* 문서 헤더 */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 font-mono">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${selectedDoc.security_level === "A" ? "bg-rose-50 text-rose-600 border-rose-200" : selectedDoc.security_level === "B" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                      {selectedDoc.security_level === "A" ? "🔒 최고 기밀 (A)" : selectedDoc.security_level === "B" ? "🔑 부서 대외비 (B)" : "🌐 사내 공개 (C)"}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold">Autopilot Score: {selectedDoc.autopilot_score}p</span>
                  </div>
                  <h2 className="text-md font-bold text-slate-800 tracking-tight">{selectedDoc.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                    <span>기안자: {selectedDoc.creator_id}</span>
                    <span>부서: {selectedDoc.dept_code}</span>
                    <span>일시: {selectedDoc.created_at}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedDoc.status === "APPROVED_AUTO" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : selectedDoc.status === "APPROVED_MANUAL" ? "bg-cyan-50 text-cyan-600 border border-cyan-200" : selectedDoc.status === "REJECTED" ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-yellow-50 text-yellow-600 border border-yellow-200"}`}>
                    {selectedDoc.status === "APPROVED_AUTO" ? "자동 전결 완료" : selectedDoc.status === "APPROVED_MANUAL" ? "수동 승인" : selectedDoc.status === "REJECTED" ? "기안 반려" : "심사 대기"}
                  </span>
                </div>
              </div>

              {/* 비정형 유형별 시각적 프리뷰 영역 */}
              <div className="mb-4">
                {(selectedDoc.doc_type.includes("도면") || selectedDoc.doc_type === "CAD_BLUEPRINT") && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative select-none">
                    <div className="flex justify-between items-center bg-slate-950 px-3 py-1.5 text-[10px] text-slate-400 font-mono border-b border-slate-800">
                      <span>2D/3D Vector Engine CAD Viewer ({cadZoom.toFixed(1)}x)</span>
                      <span>BOM List Auto-Linked</span>
                    </div>
                    <div 
                      onMouseDown={handleCadMouseDown}
                      onMouseMove={handleCadMouseMove}
                      onMouseUp={handleCadMouseUp}
                      onMouseLeave={handleCadMouseUp}
                      style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
                      className="h-44 flex items-center justify-center relative overflow-hidden bg-slate-950"
                    >
                      <svg 
                        width="100%" 
                        height="100%" 
                        className="absolute transition-transform duration-75"
                        style={{ 
                          transform: `translate(${cadPan.x}px, ${cadPan.y}px) scale(${cadZoom})`
                        }}
                      >
                        <rect x="30" y="20" width="140" height="90" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3" />
                        <circle cx="100" cy="65" r="30" fill="none" stroke="#06b6d4" strokeWidth="2" />
                        <line x1="100" y1="10" x2="100" y2="120" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="5" />
                        <line x1="20" y1="65" x2="180" y2="65" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="5" />
                        <circle cx="45" cy="35" r="4" fill="#a855f7" />
                        <circle cx="155" cy="35" r="4" fill="#a855f7" />
                        <circle cx="45" cy="95" r="4" fill="#a855f7" />
                        <circle cx="155" cy="95" r="4" fill="#a855f7" />
                        
                        <text x="35" y="125" fill="#22c55e" fontSize="7" fontFamily="monospace">FRAME MODEL V4.0 (AL-6061)</text>
                      </svg>
                      <div className="absolute right-3 bottom-3 flex flex-col gap-1 z-10">
                        <button 
                          onClick={() => setCadZoom(z => Math.min(z + 0.2, 3))}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-blue-600 hover:text-white rounded border border-slate-700 text-white font-bold text-xs"
                        >
                          +
                        </button>
                        <button 
                          onClick={() => setCadZoom(z => Math.max(z - 0.2, 0.5))}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-blue-600 hover:text-white rounded border border-slate-700 text-white font-bold text-xs"
                        >
                          -
                        </button>
                        <button 
                          onClick={() => { setCadZoom(1); setCadPan({ x: 0, y: 0 }); }}
                          className="px-1 py-0.5 bg-slate-900 hover:bg-blue-600 hover:text-white rounded border border-slate-700 text-white text-[8px] font-bold"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {(selectedDoc.doc_type.includes("명함") || selectedDoc.doc_type === "B_CARD") && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 text-[10px] text-slate-500 font-mono border-b border-slate-200">
                      B2B 명함 실물 이미지 & AI OCR 정밀 해독 매핑
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-4">
                      <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg flex flex-col justify-between h-32 text-slate-200 shadow-md select-none">
                        <div>
                          <div className="text-[9px] tracking-widest text-slate-400 font-semibold mb-2">M M I N N O V A T I O N</div>
                          <div className="text-xs font-bold text-white tracking-wider font-sans">박 태 준 <span className="text-[10px] font-normal text-slate-400 ml-1">본부장</span></div>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono space-y-0.5 pt-2 border-t border-slate-700/50">
                          <div>Tel: 010-9876-5432</div>
                          <div>Email: tjpark@mirae-inno.co.kr</div>
                        </div>
                      </div>
                      
                      <div className="text-xs flex flex-col justify-center space-y-2 border-l border-slate-200 pl-4 font-mono">
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="text-slate-400">회사명:</span>
                          <span className="font-semibold text-slate-700 font-sans">{selectedDoc.metadata?.company || "미래이노베이션"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="text-slate-400">대표성명:</span>
                          <span className="font-semibold text-slate-700 font-sans">{selectedDoc.metadata?.name || "박태준"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="text-slate-400">직급부서:</span>
                          <span className="font-semibold text-slate-700 font-sans">{selectedDoc.metadata?.position || "본부장"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="text-slate-400">휴대번호:</span>
                          <span className="font-semibold text-slate-700">{selectedDoc.metadata?.phone || "010-9876-5432"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(selectedDoc.doc_type.includes("녹음") || selectedDoc.doc_type.includes("영상") || selectedDoc.doc_type === "AUDIO_RECORDING") && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 text-[10px] text-slate-500 font-mono border-b border-slate-200">
                      AI 화자분할 회의 오디오 비주얼라이저
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                          className={`p-2.5 rounded-full transition-all flex items-center justify-center ${isPlayingAudio ? "bg-rose-100 text-rose-600 border border-rose-200" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                        >
                          <Play className="w-4 h-4 fill-white" />
                        </button>
                        
                        <div className="flex items-end gap-1.5 flex-1 h-9 select-none">
                          {[15, 30, 20, 45, 10, 25, 40, 50, 15, 35, 20, 48, 10, 30, 45, 15, 25, 40, 20].map((h, i) => (
                            <div 
                              key={i} 
                              style={{ 
                                height: `${h}%`,
                                transform: isPlayingAudio ? `scaleY(${1 + Math.sin(audioProgress + i) * 0.3})` : "none" 
                              }}
                              className={`w-full rounded-t transition-all ${isPlayingAudio ? "bg-blue-500 shadow-sm" : "bg-slate-200"}`}
                            />
                          ))}
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {isPlayingAudio ? "재생중" : "정지"}
                        </span>
                      </div>
                      
                      <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-xs font-mono max-h-16 overflow-y-auto scrollbar-thin select-none text-slate-300">
                        <div className={`transition-all duration-300 ${audioProgress < 40 ? "text-cyan-400 font-bold" : "text-slate-400"}`}>
                          <span className="text-slate-500">[00:02 최윤석 부사장]:</span> 북미 시장 벤처 기업 M&A를 적극 타진하겠습니다.
                        </div>
                        <div className={`transition-all duration-300 mt-1 ${audioProgress >= 40 ? "text-cyan-400 font-bold" : "text-slate-400"}`}>
                          <span className="text-slate-500">[00:15 박현우 대표]:</span> 제안 가격 한도는 최대 45억으로 제한해 진행하도록 합의합니다.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 문서 상세 마크다운 텍스트 본문 */}
              <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono space-y-3 leading-relaxed max-h-[360px] scrollbar-thin text-slate-700">
                <div className="whitespace-pre-wrap">
                  {selectedDoc.content}
                </div>

                {/* JSON 메타데이터 렌더링 */}
                {selectedDoc.metadata && (
                  <div className="border-t border-slate-200 pt-3 mt-4 space-y-2">
                    <span className="text-blue-600 font-bold flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> AI 추출 정형 메타데이터</span>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      {Object.entries(selectedDoc.metadata).map(([k, v]: any) => {
                        if (typeof v === "object") return null;
                        return (
                          <div key={k} className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="text-slate-400 font-semibold">{k}:</span>
                            <span className="text-slate-700 font-bold">{String(v)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 결재 심사 대기 및 의견 코멘트 감사 보드 */}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-700">결재 감사 로그 및 피드백</h3>
                </div>

                {/* approvals 리스트 */}
                <div className="space-y-2 mb-4">
                  {selectedDoc.approvals?.map((app, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-start gap-2.5 text-xs font-mono text-slate-700">
                      <div className={`p-1.5 rounded-full border ${app.status === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : app.status === "REJECTED" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-yellow-50 text-yellow-600 border border-yellow-200"}`}>
                        {app.status === "APPROVED" ? <CheckCircle2 className="w-3.5 h-3.5" /> : app.status === "REJECTED" ? <X className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-slate-450 font-semibold mb-1">
                          <span>결재권자: {app.approver_id} ({app.step_type})</span>
                          <span>{app.processed_at || "결재대기"}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {app.comments}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 수동 결재 대기 중 결재 폼 */}
                {selectedDoc.status === "PENDING" && (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl gap-2.5 flex flex-col">
                    <label className="text-[11px] text-slate-500 font-medium">기안서 결재 처리 의견 작성</label>
                    <textarea 
                      placeholder="결재 심사 또는 기안 반려 시 의견을 적어주십시오."
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800 font-mono resize-none h-14"
                      id={`comment-input-${selectedDoc.document_id}`}
                    />
                    <div className="flex justify-end gap-2 text-xs">
                      <button 
                        onClick={() => {
                          const input = document.getElementById(`comment-input-${selectedDoc.document_id}`) as HTMLTextAreaElement;
                          handleApproveDocument(selectedDoc.document_id, "REJECTED", input?.value);
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded-lg transition-all"
                      >
                        🔴 기안 반려
                      </button>
                      <button 
                        onClick={() => {
                          const input = document.getElementById(`comment-input-${selectedDoc.document_id}`) as HTMLTextAreaElement;
                          handleApproveDocument(selectedDoc.document_id, "APPROVED", input?.value);
                        }}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold rounded-lg transition-all flex items-center gap-1"
                      >
                        🟢 최종 결재 승인
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-center min-h-[500px] text-slate-400 text-xs">
              왼쪽 리스트에서 사내 지식 문서를 선택하시면 정밀 관제 및 본문 해독이 진행됩니다.
            </div>
          )}
        </div>

        {/* [우측 3열]: AI 지식 비서 RAG 챗봇 및 비즈니스 은하수 노드 맵 */}
        <div className="lg:col-span-3 space-y-6 font-mono">
          
          {/* Zero-Trust RAG 지식 비서 (EasyBot) - 밝은 테마 */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col h-[320px]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <h2 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-500" />
                지식 비서 EasyBot
              </h2>
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${currentRole === "SUPER_ADMIN" ? "bg-rose-500" : "bg-emerald-500"}`} />
                <span className="text-[9px] text-slate-500 font-semibold">{currentRole}</span>
              </div>
            </div>

            {/* 채팅 메시지 영역 */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3 scrollbar-thin select-text">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-2.5 rounded-xl max-w-[90%] leading-relaxed ${msg.sender === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-50 border border-slate-250 text-slate-700 rounded-tl-none font-sans"}`}>
                    {msg.text}
                    
                    {msg.tableData && (
                      <div className="mt-2.5 overflow-x-auto border-t border-slate-200 pt-2 font-sans select-none">
                        <table className="w-full text-[10px] text-left border-collapse text-slate-750">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                              {Object.keys(msg.tableData[0]).map(k => (
                                <th key={k} className="pb-1 pr-2">{k}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.tableData.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-100 text-slate-600 last:border-b-0 hover:bg-slate-100/50">
                                {Object.values(row).map((val: any, vIdx) => (
                                  <td key={vIdx} className="py-1.5 pr-2">{val}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {msg.docLink && (
                    <button 
                      onClick={() => {
                        const doc = documents.find(d => d.document_id === msg.docLink);
                        if (doc) setSelectedDoc(doc);
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-500 underline font-semibold mt-1 flex items-center gap-0.5 select-none"
                    >
                      출처: {msg.docLink} 바로가기 <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 입력 폼 */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="지식 RAG 검색어..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
              />
              <button 
                type="button" 
                onClick={handleMicClick}
                className={`p-2 rounded-xl transition-all ${isRecording ? "bg-rose-100 text-rose-600 border border-rose-200" : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500"}`}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button 
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-white transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Semantic Knowledge Map (비즈니스 지식 은하수) - 밝은 테마 */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col h-[280px]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <h2 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-500" />
                비즈니스 지식 은하수 맵
              </h2>
            </div>
            
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex items-center justify-center select-none">
              <svg width="100%" height="100%" className="absolute">
                <circle cx="100" cy="90" r="70" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                <circle cx="100" cy="90" r="45" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                
                <line x1="100" y1="90" x2="60" y2="50" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="100" y1="90" x2="140" y2="50" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="100" y1="90" x2="50" y2="120" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="100" y1="90" x2="150" y2="125" stroke="#cbd5e1" strokeWidth="1" />

                <circle cx="100" cy="90" r="8" fill="#3b82f6" className="animate-ping" style={{ transformOrigin: "100px 90px" }} />
                <circle cx="100" cy="90" r="6" fill="#2563eb" />
                
                <circle cx="60" cy="50" r="5" fill="#f43f5e" className="cursor-pointer" onClick={() => {
                  const d = documents.find(doc => doc.doc_type.includes("도면") || doc.doc_type === "CAD_BLUEPRINT");
                  if (d) setSelectedDoc(d);
                }} />
                <text x="35" y="42" fill="#e11d48" fontSize="6" fontFamily="monospace" fontWeight="bold">BATTERY_CAD(A)</text>
                
                <circle cx="140" cy="50" r="5" fill="#f43f5e" className="cursor-pointer" onClick={() => {
                  const d = documents.find(doc => doc.doc_type.includes("녹음") || doc.doc_type.includes("영상") || doc.doc_type === "AUDIO_RECORDING");
                  if (d) setSelectedDoc(d);
                }} />
                <text x="125" y="42" fill="#e11d48" fontSize="6" fontFamily="monospace" fontWeight="bold">M&A_STRATEGY(A)</text>

                <circle cx="50" cy="120" r="5" fill="#d97706" className="cursor-pointer" onClick={() => {
                  const d = documents.find(doc => doc.doc_type.includes("보고서") || doc.doc_type === "REPORT");
                  if (d) setSelectedDoc(d);
                }} />
                <text x="20" y="132" fill="#b45309" fontSize="6" fontFamily="monospace" fontWeight="bold">SALES_Q2(B)</text>

                <circle cx="150" cy="125" r="5" fill="#059669" className="cursor-pointer" onClick={() => {
                  const d = documents.find(doc => doc.doc_type.includes("품의서") || doc.doc_type === "PROPOSAL");
                  if (d) setSelectedDoc(d);
                }} />
                <text x="135" y="137" fill="#047857" fontSize="6" fontFamily="monospace" fontWeight="bold">GAS_BILL(C)</text>
              </svg>
              <div className="absolute bottom-2 left-2 text-[8px] text-slate-400 font-mono">
                * 각 노드 클릭 시 관제 및 분석 연동
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. AI Autopilot 자동 결재 채점 게이지 팝업 모달 */}
      {showAutopilotModal && autopilotResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in select-none">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-sm w-full shadow-xl relative">
            <button 
              onClick={() => { setShowAutopilotModal(false); setAutopilotAnimScore(0); }}
              className="absolute right-4 top-4 text-slate-450 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Cpu className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-md font-bold text-slate-850">AI Autopilot 자동 결재 분석</h3>
              <p className="text-xs text-slate-400 mt-1">상신 문서를 정밀 채점하여 전결 적합도를 계산합니다.</p>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-450">결재 적합성 점수:</span>
                <span className={`font-bold ${autopilotAnimScore >= 95.0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {autopilotAnimScore.toFixed(1)}점
                </span>
              </div>
              
              <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden border border-slate-300 relative">
                <div 
                  className={`h-full rounded-full transition-all duration-75 ${autopilotAnimScore >= 95.0 ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-amber-500 to-yellow-400"}`}
                  style={{ width: `${autopilotAnimScore}%` }}
                />
              </div>
              
              <div className="text-[10px] text-slate-400 font-mono text-center">
                * 95.0점 이상 획득 시 AI 자동 무인 전결 자격 부여
              </div>
            </div>

            <div className="mt-4 text-xs font-mono leading-relaxed space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {autopilotResult.status === "APPROVED_AUTO" ? (
                <>
                  <div className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> AI 자동 파일럿 전결 승인 완료!
                  </div>
                  <p className="text-slate-650 text-[11px] font-sans">
                    소액 품의 금액 기준 만족 및 서식 일치성 98.7%로 전결 요건을 완수하여 즉시 최종 승인되었습니다.
                  </p>
                  <div className="text-[10px] bg-rose-50 text-rose-600 p-2.5 rounded border border-rose-200 font-semibold font-sans mt-2 flex items-start gap-1.5">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>[보안 잠금 고지] 승인이 완료된 후에도 제로 트러스트 보안 규정에 따라 <strong>A등급 최고 기밀</strong>로 강제 잠금 적재되었습니다. 최고관리자 등급 심사를 거치십시오.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-amber-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> 리스크 감지: 수동 결재선 이송
                  </div>
                  <p className="text-slate-650 text-[11px] font-sans">
                    해당 자산은 대외비 등급이거나 고액 기안, 혹은 비정형 오디오로 판별되어 AI 파일럿 승인 대상에서 제외되었습니다. 추천 부서장 수동 결재선으로 안전하게 이송되었습니다. (최초 A등급 격리)
                  </p>
                </>
              )}
            </div>

            <button 
              onClick={() => { setShowAutopilotModal(false); setAutopilotAnimScore(0); }}
              className="w-full mt-5 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-98"
            >
              닫기 및 관제판 확인
            </button>
          </div>
        </div>
      )}

      {/* [신규 추가 ⚙️] 자산 종류 동적 Vault 모달 (최고관리자용) */}
      {isTypeVaultOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in select-none">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => { setIsTypeVaultOpen(false); setVaultError(null); }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-md font-bold text-slate-850 flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-indigo-500 animate-spin-slow" />
                동적 자산 분류 Vault (최고관리자 전용)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                사내 지식 자산의 분류 카테고리를 실시간 신설/제거합니다.
              </p>
            </div>

            {/* 에러 경고 배너 피드백 */}
            {vaultError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs flex items-start gap-1.5 font-sans animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{vaultError}</span>
              </div>
            )}

            {/* 신규 자산 추가 폼 */}
            <form onSubmit={handleCreateAssetType} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newAssetTypeName}
                onChange={(e) => setNewAssetTypeName(e.target.value)}
                placeholder="신규 자산 분류명 기입... (예: 기밀특허)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 font-mono"
              />
              <button 
                type="submit"
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> 추가
              </button>
            </form>

            {/* 저장된 분류 리스트 (삭제 버튼 및 무결성 락 작동) */}
            <div className="max-h-56 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2 scrollbar-thin">
              {assetTypes.map(item => (
                <div 
                  key={item.id}
                  className="bg-white border border-slate-200 px-3 py-2 rounded-lg flex items-center justify-between text-xs font-mono hover:bg-slate-50 transition-all group"
                >
                  <span className="text-slate-800 font-bold font-sans">{item.type_name}</span>
                  
                  {/* 삭제 버튼 (기본 유형 보호가 아닌, 사용량 락 기반 자동 통제) */}
                  <button
                    type="button"
                    onClick={() => handleDeleteAssetType(item.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-all"
                    title="해당 자산 분류 영구 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={() => { setIsTypeVaultOpen(false); setVaultError(null); }}
              className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-98"
            >
              닫기 및 변경 사항 반영
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
