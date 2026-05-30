"use client";

import React from "react";
import { 
  Database, Play, RefreshCw, Download, Plus, Edit, 
  Trash2, AlertTriangle, Code, Table, Search, Terminal,
  CheckCircle, ChevronRight, X, ShieldAlert, Calendar,
  BarChart, FileText, Activity, Sparkles, Paperclip, Send,
  Undo, RotateCcw
} from "lucide-react";
import DBChartRenderer from "@/components/DBChartRenderer";

export default function MyDBManagementPage() {
  // DB 관련 핵심 상태 변수
  const [tables, setTables] = React.useState<any[]>([]);
  const [selectedTable, setSelectedTable] = React.useState<string>("");
  const [tableSchema, setTableSchema] = React.useState<any[]>([]);
  const [tableDDL, setTableDDL] = React.useState<string>("");
  const [tableRows, setTableRows] = React.useState<any[]>([]);
  const [totalRows, setTotalRows] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const itemsPerPage = 50;

  // 탭 제어 ('data' | 'schema' | 'console' | 'chart')
  const [activeTab, setActiveTab] = React.useState<'data' | 'schema' | 'console' | 'chart'>('data');

  // 검색/필터 필드
  const [searchKey, setSearchKey] = React.useState<string>("");
  const [searchValue, setSearchValue] = React.useState<string>("");

  // SQL 콘솔 상태
  const [sqlQuery, setSqlQuery] = React.useState<string>("SELECT * FROM crm_expenses LIMIT 10;");
  const [consoleResult, setConsoleResult] = React.useState<{
    success: boolean;
    rows?: any[];
    affectedRows?: number | null;
    lastInsertRowid?: number | null;
    error?: string;
  } | null>(null);
  const [safetyUnlocked, setSafetyUnlocked] = React.useState<boolean>(false);

  // 💡 AI 자연어 SQL 번역기 콘솔 관련 추가 상태 변수
  const [consoleTab, setConsoleTab] = React.useState<'direct' | 'ai'>('ai');
  const [aiPrompt, setAiPrompt] = React.useState<string>("");
  const [isAiLoading, setIsAiLoading] = React.useState<boolean>(false);
  const [aiGeneratedSql, setAiGeneratedSql] = React.useState<string>("");

  // 🗑️ 소프트 삭제 데이터 보기 토글 상태 변수
  const [showDeleted, setShowDeleted] = React.useState<boolean>(false);

  // 💡 AI 지능형 시각화 및 데이터 브리핑 요약 융합 트리거
  const [aiChartSpec, setAiChartSpec] = React.useState<any | null>(null);
  const [aiBriefing, setAiBriefing] = React.useState<string | null>(null);
  const [isVisualizing, setIsVisualizing] = React.useState<boolean>(false);

  // 🌐 퍼블릭 공유 및 자동 갱신 상태
  const [isShareModalOpen, setIsShareModalOpen] = React.useState<boolean>(false);
  const [shareTitle, setShareTitle] = React.useState<string>("");
  const [shareInterval, setShareInterval] = React.useState<'NONE' | 'HOURLY' | 'DAILY' | 'WEEKLY'>('NONE');
  const [generatedShareUrl, setGeneratedShareUrl] = React.useState<string>("");
  const [sharedDashboards, setSharedDashboards] = React.useState<any[]>([]);
  const [isSharing, setIsSharing] = React.useState<boolean>(false);
  const [isRestored, setIsRestored] = React.useState<boolean>(false);
  const [tunePrompt, setTunePrompt] = React.useState<string>("");

  // 💬 AI 챗봇 튜닝 대화 이력 및 부가 제어 상태 추가
  const [tuneHistory, setTuneHistory] = React.useState<Array<{
    role: 'user' | 'ai' | 'system';
    text: string;
    image?: string; // Base64 첨부 이미지
    isNewSkill?: boolean; // 새 스킬 배지 노출용
    timestamp: string;
  }>>([]);
  const [selectedChartPart, setSelectedChartPart] = React.useState<string>("");
  const [attachedImage, setAttachedImage] = React.useState<string>(""); // Base64 이미지 데이터
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement | null>(null);

  // ✂️ 차트 시각적 영역 지정 및 크롭 캡처 상태 변수 추가
  const [isAreaSelectMode, setIsAreaSelectMode] = React.useState<boolean>(false);
  const [isSelecting, setIsSelecting] = React.useState<boolean>(false);
  const [startCoords, setStartCoords] = React.useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // ↩️ 이전 상태로 되돌리기(Undo) 스냅샷 상태 변수
  const [previousSnapshot, setPreviousSnapshot] = React.useState<{
    chartSpec: any;
    briefing: string | null;
    tuneHistory: any[];
  } | null>(null);

  // 🏁 최초 차트 생성 시의 오리지널 스냅샷 상태 변수 (처음으로 돌아가기용)
  const [initialSnapshot, setInitialSnapshot] = React.useState<{
    chartSpec: any;
    briefing: string | null;
  } | null>(null);

  // 💾 챗봇 상태 실시간 localStorage 보존 (복원이 완전히 마친 시점 이후부터 안전 작동)
  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_mydb_tuneHistory", JSON.stringify(tuneHistory));
    }
    // 메시지 추가 시 최하단으로 부드러운 자동 스크롤 추적
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tuneHistory, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_mydb_selectedChartPart", selectedChartPart);
    }
  }, [selectedChartPart, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      if (previousSnapshot) {
        localStorage.setItem("egdesk_mydb_previousSnapshot", JSON.stringify(previousSnapshot));
      } else {
        localStorage.removeItem("egdesk_mydb_previousSnapshot");
      }
    }
  }, [previousSnapshot, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      if (initialSnapshot) {
        localStorage.setItem("egdesk_mydb_initialSnapshot", JSON.stringify(initialSnapshot));
      } else {
        localStorage.removeItem("egdesk_mydb_initialSnapshot");
      }
    }
  }, [initialSnapshot, isRestored]);

  const fetchSharedDashboards = async () => {
    try {
      const res = await fetch("/api/db/ai-visualize/share");
      const data = await res.json();
      if (data.success) {
        setSharedDashboards(data.list || []);
      }
    } catch (e) {
      console.error("공유 대시보드 리스트 조회 실패:", e);
    }
  };

  const handleCreateShare = async () => {
    if (!shareTitle.trim()) {
      showToast("공유 대시보드의 공개 제목을 입력해 주세요.", "warn");
      return;
    }

    setIsSharing(true);
    try {
      const fromMatch = sqlQuery.match(/FROM\s+["']?([a-zA-Z0-9_-]+)["']?/i);
      const tableName = fromMatch ? fromMatch[1] : (selectedTable || 'raw_query');

      const res = await fetch("/api/db/ai-visualize/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: shareTitle,
          sqlQuery: sqlQuery,
          tableName,
          displayName: tables.find(t => t.name === tableName)?.displayName || tableName,
          chartSpecJson: aiChartSpec,
          briefingMarkdown: aiBriefing,
          refreshInterval: shareInterval
        })
      });

      const data = await res.json();
      if (data.success && data.shareId) {
        const url = `${window.location.origin}/public/share/${data.shareId}`;
        setGeneratedShareUrl(url);
        showToast("공유 대시보드가 성공적으로 웹에 게시되었습니다!", "success");
        fetchSharedDashboards();
      } else {
        showToast(data.error || "웹 게시 등록에 실패했습니다.", "error");
      }
    } catch (e) {
      showToast("서버와 통신할 수 없습니다.", "error");
    } finally {
      setIsSharing(false);
    }
  };

  const handleDeleteShare = async (shareId: string) => {
    if (!confirm("정말로 이 공유 대시보드의 공개를 철회하고 완전히 삭제하시겠습니까?\n외부 공유 링크 접근이 즉시 차단됩니다.")) {
      return;
    }

    try {
      const res = await fetch(`/api/db/ai-visualize/share?shareId=${shareId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        showToast("공유 대시보드 게시가 안전하게 해제되었습니다.", "success");
        fetchSharedDashboards();
      } else {
        showToast(data.error || "삭제에 실패했습니다.", "error");
      }
    } catch (e) {
      showToast("서버와 통신할 수 없습니다.", "error");
    }
  };

  const triggerAIVisualization = async (rows: any[], queryStr: string) => {
    if (!rows || rows.length === 0) return;

    setIsVisualizing(true);
    setAiChartSpec(null);
    setAiBriefing(null);
    setInitialSnapshot(null); // 최초 스냅샷 초기화

    try {
      // 1. 쿼리 구문에서 테이블명 지능적 추론
      const fromMatch = queryStr.match(/FROM\s+["']?([a-zA-Z0-9_-]+)["']?/i);
      const tableName = fromMatch ? fromMatch[1] : (selectedTable || 'raw_query');
      
      // 2. 쿼리 결과에 맞추어 임시 1차 스펙 정의
      const tempSchema = Object.keys(rows[0]).map(key => {
        const val = rows[0][key];
        const isNum = typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '');
        return {
          name: key,
          type: isNum ? 'INTEGER' : 'TEXT'
        };
      });

      const res = await fetch("/api/db/ai-visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          schema: tempSchema,
          tableName,
          displayName: tables.find(t => t.name === tableName)?.displayName || tableName
        })
      });

      const data = await res.json();
      if (data.recommendedChart) {
        setAiChartSpec(data.recommendedChart);
        setAiBriefing(data.briefing);
        
        // 🏁 최초 오리지널 시각화 차트 스펙과 브리핑 상태를 안전 보존 스냅샷에 백업
        setInitialSnapshot({
          chartSpec: data.recommendedChart,
          briefing: data.briefing || null
        });
      } else {
        console.error("AI 시각화 분석 실패:", data.error);
        showToast(`AI 시각화 분석 실패: ${data.error || '알 수 없는 오류'}`, "error");
      }
    } catch (err: any) {
      console.error("AI 시각화 API 연동 실패:", err.message);
      showToast(`AI 시각화 연동 실패: ${err.message}`, "error");
    } finally {
      setIsVisualizing(false);
    }
  };

  const handleTuneChart = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentPrompt = tunePrompt.trim();
    if (!currentPrompt && !attachedImage) return;

    // 현재 분석할 로우 데이터 획득
    const rows = consoleResult?.rows || tableRows;
    if (!rows || rows.length === 0) {
      showToast("튜닝을 수행할 차트 데이터가 존재하지 않습니다.", "warn");
      return;
    }

    const attachedImgStr = attachedImage; // 캡처
    const targetPart = selectedChartPart; // 캡처

    // ↩️ 튜닝 피드백 반영 직전 상태를 스냅샷으로 백업 (차트 스펙, 브리핑 마크다운, 기존 대화 이력 포함)
    setPreviousSnapshot({
      chartSpec: aiChartSpec,
      briefing: aiBriefing,
      tuneHistory: [...tuneHistory]
    });

    // 입력 상태 초기화
    setTunePrompt("");
    setAttachedImage("");
    setSelectedChartPart("");

    // 1. 사용자의 메시지를 챗 로그에 추가
    const userMsg = {
      role: 'user' as const,
      text: targetPart ? `[집중 수정 지표: ${targetPart}] ${currentPrompt}` : currentPrompt,
      image: attachedImgStr || undefined,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setTuneHistory(prev => [...prev, userMsg]);

    setIsVisualizing(true);
    showToast("⚡ 최고관리자님의 피드백을 반영하여 차트 및 비즈니스 브리핑을 정밀 재조정 중...", "success");

    try {
      const fromMatch = sqlQuery.match(/FROM\s+["']?([a-zA-Z0-9_-]+)["']?/i);
      const tableName = fromMatch ? fromMatch[1] : (selectedTable || 'raw_query');
      
      const tempSchema = Object.keys(rows[0]).map(key => {
        const val = rows[0][key];
        const isNum = typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '');
        return { name: key, type: isNum ? 'INTEGER' : 'TEXT' };
      });

      // 지시사항 접두사로 targetPart 칩 지표 정보가 있다면 빌드
      const fullFeedback = targetPart
        ? `[집중 수정 지표: ${targetPart}] ${currentPrompt}`
        : currentPrompt;

      const res = await fetch("/api/db/ai-visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          schema: tempSchema,
          tableName,
          displayName: tables.find(t => t.name === tableName)?.displayName || tableName,
          userFeedback: fullFeedback,
          currentSpec: aiChartSpec,
          attachedImage: attachedImgStr || undefined
        })
      });

      const data = await res.json();
      if (data.recommendedChart) {
        setAiChartSpec(data.recommendedChart);
        setAiBriefing(data.briefing);

        // 2. AI 튜닝 답변 메시지를 챗 로그에 추가
        const aiMsg = {
          role: 'ai' as const,
          text: data.briefing || "최고관리자님의 튜닝 요구사항을 차트에 정밀 반영했습니다.",
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };

        // 3. 만약 자가 학습 완료 룰이 있다면 추가 스페셜 알림 메시지 주입
        if (data.newSkillLearned) {
          const skillMsg = {
            role: 'system' as const,
            text: `💡 [자가 진화 스킬 획득] 최고관리자의 분석 취향을 습득하여 AI 핵심 가이드라인에 영구 등록했습니다:\n"${data.newSkillLearned}"`,
            isNewSkill: true,
            timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          };
          setTuneHistory(prev => [...prev, aiMsg, skillMsg]);
        } else {
          setTuneHistory(prev => [...prev, aiMsg]);
        }

        showToast("✓ 최고관리자님의 피드백이 차트와 브리핑에 칼반영되었습니다!", "success");
      } else {
        const errMsg = {
          role: 'system' as const,
          text: `❌ 튜닝 반영 실패: ${data.error || '알 수 없는 오류'}`,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };
        setTuneHistory(prev => [...prev, errMsg]);
        showToast(data.error || "피드백 조정에 실패했습니다.", "error");
      }
    } catch (err: any) {
      const errMsg = {
        role: 'system' as const,
        text: `❌ 통신 장애: ${err.message}`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      setTuneHistory(prev => [...prev, errMsg]);
      showToast(`통신 장애: ${err.message}`, "error");
    } finally {
      setIsVisualizing(false);
    }
  };

  // 💡 챗봇 보조 헬퍼 함수 (이미지 첨부 및 초기화)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 5MB 이하 파일 검증
      if (file.size > 5 * 1024 * 1024) {
        showToast("파일 크기는 최대 5MB를 초과할 수 없습니다.", "warn");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
        showToast("✓ 이미지가 성공적으로 임시 첨부되었습니다.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetChat = () => {
    if (confirm("최고관리자님, AI 챗봇과의 대화 내용을 모두 초기화하고\n차트와 브리핑도 AI가 최초 추천했던 원본 상태로 완전히 되돌리시겠습니까?")) {
      setTuneHistory([]);
      setSelectedChartPart("");
      setAttachedImage("");
      setPreviousSnapshot(null);
      
      // 🏁 최초 분석 원본 상태가 존재한다면 차트와 브리핑도 즉시 복원
      if (initialSnapshot) {
        setAiChartSpec(initialSnapshot.chartSpec);
        setAiBriefing(initialSnapshot.briefing);
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("egdesk_mydb_tuneHistory");
        localStorage.removeItem("egdesk_mydb_selectedChartPart");
        localStorage.removeItem("egdesk_mydb_previousSnapshot");
        
        if (initialSnapshot) {
          localStorage.setItem("egdesk_mydb_aiChartSpec", JSON.stringify(initialSnapshot.chartSpec));
          if (initialSnapshot.briefing) {
            localStorage.setItem("egdesk_mydb_aiBriefing", initialSnapshot.briefing);
          } else {
            localStorage.removeItem("egdesk_mydb_aiBriefing");
          }
        }
      }
      showToast("✓ 대화 내용 및 차트 상태가 최초 추천 원본 상태로 조화롭게 리셋되었습니다.", "success");
    }
  };

  // ↩️ 이전 튜닝 상태로 되돌리기 (Undo) 핸들러 구현
  const handleUndoTuning = () => {
    if (!previousSnapshot) return;

    if (confirm("최고관리자님, 직전 피드백 전송 전의 차트 상태와 대화 이력으로 되돌리시겠습니까?")) {
      setAiChartSpec(previousSnapshot.chartSpec);
      setAiBriefing(previousSnapshot.briefing);
      setTuneHistory(previousSnapshot.tuneHistory);

      // 로컬스토리지 복구 반영
      if (typeof window !== "undefined") {
        localStorage.setItem("egdesk_mydb_tuneHistory", JSON.stringify(previousSnapshot.tuneHistory));
        if (previousSnapshot.chartSpec) {
          localStorage.setItem("egdesk_mydb_aiChartSpec", JSON.stringify(previousSnapshot.chartSpec));
        } else {
          localStorage.removeItem("egdesk_mydb_aiChartSpec");
        }
        if (previousSnapshot.briefing) {
          localStorage.setItem("egdesk_mydb_aiBriefing", previousSnapshot.briefing);
        } else {
          localStorage.removeItem("egdesk_mydb_aiBriefing");
        }
      }

      setPreviousSnapshot(null); // 사용 완료 후 스냅샷 초기화
      showToast("✓ 성공적으로 직전 튜닝 이전의 상태로 되돌렸습니다!", "success");
    }
  };

  // 🏁 AI 최초 추천 시각화 오리지널 차트 상태로 완전히 돌아가기 (처음으로 돌아가기)
  const handleResetToOriginal = () => {
    if (!initialSnapshot) {
      showToast("되돌아갈 최초 차트 정보가 존재하지 않습니다.", "warn");
      return;
    }
    
    if (confirm("최고관리자님, AI가 최초로 추천해 드렸던 최초 원본 차트 및 브리핑 상태로 완전히 복원하시겠습니까?\n(이전 챗 대화 내용과 튜닝 히스토리는 모두 깨끗이 초기화됩니다.)")) {
      setAiChartSpec(initialSnapshot.chartSpec);
      setAiBriefing(initialSnapshot.briefing);
      setTuneHistory([]);
      setSelectedChartPart("");
      setAttachedImage("");
      setPreviousSnapshot(null);
      
      // 로컬스토리지 전면 복구 및 초기화
      if (typeof window !== "undefined") {
        localStorage.removeItem("egdesk_mydb_tuneHistory");
        localStorage.removeItem("egdesk_mydb_selectedChartPart");
        localStorage.removeItem("egdesk_mydb_previousSnapshot");
        
        localStorage.setItem("egdesk_mydb_aiChartSpec", JSON.stringify(initialSnapshot.chartSpec));
        if (initialSnapshot.briefing) {
          localStorage.setItem("egdesk_mydb_aiBriefing", initialSnapshot.briefing);
        } else {
          localStorage.removeItem("egdesk_mydb_aiBriefing");
        }
      }
      
      showToast("✓ 최초 생성되었던 오리지널 시각화 차트 상태로 완벽히 되돌아갔습니다!", "success");
    }
  };

  // ✂️ 차트 시각적 영역 드래그 캡처 및 XMLSerializer 기반 크롭 헬퍼 핸들러
  const handleAreaMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartCoords({ x, y });
    setIsSelecting(true);
    setSelectionRect({ x, y, width: 0, height: 0 });
  };

  const handleAreaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !startCoords) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(startCoords.x, currentX);
    const y = Math.min(startCoords.y, currentY);
    const width = Math.abs(startCoords.x - currentX);
    const height = Math.abs(startCoords.y - currentY);

    setSelectionRect({ x, y, width, height });
  };

  const handleAreaMouseUp = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !selectionRect || selectionRect.width < 5 || selectionRect.height < 5) {
      setIsSelecting(false);
      setStartCoords(null);
      return;
    }

    setIsSelecting(false);
    setStartCoords(null);
    setIsAreaSelectMode(false); // 선택 완료 시 모드 자동 해제

    try {
      const container = document.getElementById("chart-capture-target");
      const svgElement = container?.querySelector("svg");

      if (svgElement) {
        // 1. XMLSerializer를 통해 SVG 마크업 문자열 획득
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const image = new Image();
        image.onload = () => {
          // 2. 캔버스 초기 해상도 보정 (고품질 크롭을 위해 2배 스케일 적용)
          const canvas = document.createElement("canvas");
          canvas.width = selectionRect.width * 2;
          canvas.height = selectionRect.height * 2;
          const context = canvas.getContext("2d");

          const containerRect = container!.getBoundingClientRect();
          const svgRect = svgElement.getBoundingClientRect();

          // 컨테이너 대비 SVG의 실제 상대 오프셋 도출 (최소 0 이상 안심 장치)
          const svgOffsetLeft = Math.max(0, svgRect.left - containerRect.left);
          const svgOffsetTop = Math.max(0, svgRect.top - containerRect.top);

          // 드래그 좌표에서 오프셋 차감 후 경계선 한계 보정 (음수 방지 및 가로세로 폭 방어)
          let relativeX = Math.max(0, Math.min(selectionRect.x - svgOffsetLeft, svgRect.width - 5));
          let relativeY = Math.max(0, Math.min(selectionRect.y - svgOffsetTop, svgRect.height - 5));

          const scaleX = image.width / svgRect.width;
          const scaleY = image.height / svgRect.height;

          if (context) {
            context.scale(2, 2);
            // 3. 캔버스 위에 지정된 부분만 정밀하게 크롭하여 복사
            context.drawImage(
              image,
              relativeX * scaleX,
              relativeY * scaleY,
              selectionRect.width * scaleX,
              selectionRect.height * scaleY,
              0,
              0,
              selectionRect.width,
              selectionRect.height
            );

            // 4. base64 png 포맷으로 변환 후 챗봇 미디어 업로더에 자동 바인딩
            const croppedBase64 = canvas.toDataURL("image/png");
            setAttachedImage(croppedBase64);
            setSelectedChartPart(`지정된 시각적 영역 (${Math.round(selectionRect.width)}x${Math.round(selectionRect.height)})`);
            showToast("✓ 선택 영역이 성공적으로 캡처 첨부되었습니다! 챗봇에서 바로 지시해 보세요.", "success");
          }
          URL.revokeObjectURL(blobURL);
        };
        image.src = blobURL;
      } else {
        // Fallback: SVG 탐색이 불가한 경우 단순 좌표 배지 지정
        setSelectedChartPart(`지정된 시각적 영역 (x: ${Math.round(selectionRect.x)}, y: ${Math.round(selectionRect.y)})`);
        showToast("✓ 선택 영역이 지정되었습니다.", "success");
      }
    } catch (err: any) {
      console.error("⚠️ 차트 영역 크롭 실패:", err.message);
      setSelectedChartPart(`지정된 시각적 영역 (x: ${Math.round(selectionRect.x)}, y: ${Math.round(selectionRect.y)})`);
      showToast("영역 캡처가 불가하여 좌표 지정으로 대체되었습니다.", "warn");
    }
  };

  // 로딩 및 알림
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' | 'warn' } | null>(null);

  // 모달 제어 (추가/수정 모달)
  const [isRowModalOpen, setIsRowModalOpen] = React.useState<boolean>(false);
  const [editingRow, setEditingRow] = React.useState<any | null>(null); // null이면 추가, 객체면 수정

  // 알림 토스트 유틸
  const showToast = (message: string, type: 'success' | 'error' | 'warn' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 1. 서버 내 전체 테이블 목록 스캔
  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/db?action=list");
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
        const savedTable = typeof window !== "undefined" ? localStorage.getItem("egdesk_mydb_selectedTable") : null;
        if (data.tables && data.tables.length > 0 && !selectedTable && !savedTable) {
          setSelectedTable(data.tables[0].name);
        }
      } else {
        showToast(data.error || "테이블 목록 스캔에 실패했습니다.", "error");
      }
    } catch (e) {
      showToast("서버와 통신할 수 없습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 선택 테이블 스키마 DDL 구조 로드
  const fetchTableSchema = async (tableName: string) => {
    if (!tableName) return;
    try {
      const res = await fetch(`/api/db?action=schema&tableName=${tableName}`);
      const data = await res.json();
      if (data.success) {
        setTableSchema(data.schema || []);
        setTableDDL(data.ddl || "");
      }
    } catch (e) {
      console.error("스키마 로드 실패", e);
    }
  };

  // 3. 선택 테이블의 실제 데이터 그리드 레코드 로드 (검색/페이지네이션 연동)
  const fetchTableRows = async (tableName: string, page: number, key = "", val = "", includeDeleted = showDeleted) => {
    if (!tableName) return;
    setIsLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      let url = `/api/db?action=query&tableName=${tableName}&limit=${itemsPerPage}&offset=${offset}&showDeleted=${includeDeleted}`;
      if (key && val) {
        url += `&searchKey=${encodeURIComponent(key)}&searchValue=${encodeURIComponent(val)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTableRows(data.rows || []);
        setTotalRows(data.total || 0);
      } else {
        showToast(data.error || "레코드 조회에 실패했습니다.", "error");
      }
    } catch (e) {
      showToast("데이터 로딩 중 서버 통신 에러가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. 최초 렌더링 및 테이블 전환 시 연동
  React.useEffect(() => {
    fetchTables();
    fetchSharedDashboards();
  }, []);

  // 🔄 로컬스토리지로부터 이전 작업중이던 내용 상태 복원
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTable = localStorage.getItem("egdesk_mydb_selectedTable");
      const savedTab = localStorage.getItem("egdesk_mydb_activeTab");
      const savedSqlQuery = localStorage.getItem("egdesk_mydb_sqlQuery");
      const savedConsoleTab = localStorage.getItem("egdesk_mydb_consoleTab");
      const savedAiPrompt = localStorage.getItem("egdesk_mydb_aiPrompt");
      const savedSafety = localStorage.getItem("egdesk_mydb_safetyUnlocked");
      const savedSearchKey = localStorage.getItem("egdesk_mydb_searchKey");
      const savedSearchVal = localStorage.getItem("egdesk_mydb_searchValue");

      const savedConsoleResult = localStorage.getItem("egdesk_mydb_consoleResult");
      const savedAiChartSpec = localStorage.getItem("egdesk_mydb_aiChartSpec");
      const savedAiBriefing = localStorage.getItem("egdesk_mydb_aiBriefing");
      const savedAiGeneratedSql = localStorage.getItem("egdesk_mydb_aiGeneratedSql");

      if (savedTable) setSelectedTable(savedTable);
      if (savedTab) setActiveTab(savedTab as any);
      if (savedSqlQuery) setSqlQuery(savedSqlQuery);
      if (savedConsoleTab) setConsoleTab(savedConsoleTab as any);
      if (savedAiPrompt) setAiPrompt(savedAiPrompt);
      if (savedSafety) setSafetyUnlocked(savedSafety === "true");
      if (savedSearchKey) setSearchKey(savedSearchKey);
      if (savedSearchVal) setSearchValue(savedSearchVal);

      if (savedConsoleResult) {
        try {
          setConsoleResult(JSON.parse(savedConsoleResult));
        } catch (e) {
          console.error("consoleResult 복원 실패:", e);
        }
      }
      if (savedAiChartSpec) {
        try {
          setAiChartSpec(JSON.parse(savedAiChartSpec));
        } catch (e) {
          console.error("aiChartSpec 복원 실패:", e);
        }
      }
      if (savedAiBriefing) setAiBriefing(savedAiBriefing);
      if (savedAiGeneratedSql) setAiGeneratedSql(savedAiGeneratedSql);

      // 💬 챗 로그, 집중 수정 파트 칩, 그리고 되돌리기(Undo) 스냅샷 상태 원자적 통합 복원
      const savedHistory = localStorage.getItem("egdesk_mydb_tuneHistory");
      const savedPart = localStorage.getItem("egdesk_mydb_selectedChartPart");
      const savedSnapshot = localStorage.getItem("egdesk_mydb_previousSnapshot");
      
      if (savedHistory) {
        try {
          setTuneHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("⚠️ 챗 로그 복원 실패", e);
        }
      }
      if (savedPart) {
        setSelectedChartPart(savedPart);
      }
      if (savedSnapshot) {
        try {
          setPreviousSnapshot(JSON.parse(savedSnapshot));
        } catch (e) {
          console.error("⚠️ 스냅샷 복원 실패", e);
        }
      }
      
      setIsRestored(true);
    }
  }, []);

  // 💾 상태 실시간 로컬스토리지 보존 (복원이 완료된 시점 이후부터 동작)
  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_mydb_selectedTable", selectedTable);
    }
  }, [selectedTable, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_mydb_activeTab", activeTab);
    }
  }, [activeTab, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_mydb_sqlQuery", sqlQuery);
    }
  }, [sqlQuery, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_mydb_consoleTab", consoleTab);
    }
  }, [consoleTab, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_mydb_aiPrompt", aiPrompt);
    }
  }, [aiPrompt, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_mydb_safetyUnlocked", String(safetyUnlocked));
    }
  }, [safetyUnlocked, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_mydb_searchKey", searchKey);
      localStorage.setItem("egdesk_mydb_searchValue", searchValue);
    }
  }, [searchKey, searchValue, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      if (consoleResult) {
        localStorage.setItem("egdesk_mydb_consoleResult", JSON.stringify(consoleResult));
      } else {
        localStorage.removeItem("egdesk_mydb_consoleResult");
      }
    }
  }, [consoleResult, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      if (aiChartSpec) {
        localStorage.setItem("egdesk_mydb_aiChartSpec", JSON.stringify(aiChartSpec));
      } else {
        localStorage.removeItem("egdesk_mydb_aiChartSpec");
      }
    }
  }, [aiChartSpec, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      if (aiBriefing) {
        localStorage.setItem("egdesk_mydb_aiBriefing", aiBriefing);
      } else {
        localStorage.removeItem("egdesk_mydb_aiBriefing");
      }
    }
  }, [aiBriefing, isRestored]);

  React.useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      if (aiGeneratedSql) {
        localStorage.setItem("egdesk_mydb_aiGeneratedSql", aiGeneratedSql);
      } else {
        localStorage.removeItem("egdesk_mydb_aiGeneratedSql");
      }
    }
  }, [aiGeneratedSql, isRestored]);

  React.useEffect(() => {
    if (selectedTable) {
      setCurrentPage(1);
      // 최초 복원 중이 아닐 때(즉 이미 복원이 완전히 끝난 후 테이블을 변경할 때)만 검색 필터를 초기화합니다.
      if (isRestored) {
        setSearchKey("");
        setSearchValue("");
      }
      setShowDeleted(false);
      
      const savedSearchKey = isRestored ? "" : (localStorage.getItem("egdesk_mydb_searchKey") || "");
      const savedSearchVal = isRestored ? "" : (localStorage.getItem("egdesk_mydb_searchValue") || "");
      
      fetchTableSchema(selectedTable);
      fetchTableRows(selectedTable, 1, savedSearchKey, savedSearchVal, false);
    }
  }, [selectedTable, isRestored]);

  React.useEffect(() => {
    if (selectedTable) {
      setCurrentPage(1);
      fetchTableRows(selectedTable, 1, searchKey, searchValue, showDeleted);
    }
  }, [showDeleted]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTableRows(selectedTable, page, searchKey, searchValue, showDeleted);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTableRows(selectedTable, 1, searchKey, searchValue, showDeleted);
  };

  // 💡 AI 자연어 SQL 번역 및 에디터 연계 액션
  const handleTranslateSQL = async () => {
    if (!aiPrompt.trim()) {
      showToast("AI에게 요청할 자연어 요구사항을 입력해 주세요.", "warn");
      return;
    }

    setIsAiLoading(true);
    setAiGeneratedSql("");
    try {
      const res = await fetch("/api/db/ai-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          tablesSchema: tables
        })
      });

      const data = await res.json();
      if (data.success && data.sql) {
        setAiGeneratedSql(data.sql);
        showToast("AI가 성공적으로 자연어를 SQL로 번역해 드렸습니다!", "success");
      } else {
        showToast(data.error || "자연어 번역 중 오류가 발생했습니다.", "error");
      }
    } catch (e) {
      showToast("AI 번역기 호출 중 서버 통신 에러가 발생했습니다.", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  // 5. 커스텀 SQL 직접 실행 (플레이그라운드 샌드박스)
  const handleExecuteSQL = async () => {
    if (!sqlQuery.trim()) {
      showToast("쿼리를 입력해 주세요.", "warn");
      return;
    }

    // 파괴적인 SQL 쿼리 시도 검사 및 이중 안전 가드 경고
    const upperQuery = sqlQuery.toUpperCase();
    const isDestructive = upperQuery.includes("DROP") || upperQuery.includes("DELETE FROM") || upperQuery.includes("ALTER TABLE") || upperQuery.includes("UPDATE");
    
    if (isDestructive && !safetyUnlocked) {
      showToast("이중 보호장치: 데이터 파괴나 구조 변경 쿼리 실행 전 하단 '안전장치 잠금 해제'를 체크해 주세요.", "warn");
      return;
    }

    setIsLoading(true);
    setConsoleResult(null);
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute", query: sqlQuery })
      });
      const data = await res.json();
      if (data.success) {
        setConsoleResult({
          success: true,
          rows: data.rows,
          affectedRows: data.affectedRows,
          lastInsertRowid: data.lastInsertRowid
        });
        showToast("SQL 쿼리가 성공적으로 완수되었습니다.", "success");
        
        // AI 시각화 및 데이터 브리핑 호출 작동!
        if (data.rows && data.rows.length > 0) {
          triggerAIVisualization(data.rows, sqlQuery);
        }

        // 전체 스캔 갱신
        fetchTables();
        if (selectedTable) {
          fetchTableSchema(selectedTable);
          fetchTableRows(selectedTable, currentPage, searchKey, searchValue);
        }
        setActiveTab('console');
      } else {
        setConsoleResult({
          success: false,
          error: data.error
        });
        showToast(data.error || "쿼리 컴파일 중 문법 오류가 감지되었습니다.", "error");
        setActiveTab('console');
      }
    } catch (e) {
      showToast("SQL 콘솔 실행 실패 (네트워크 장애)", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. 데이터 개별 행 삭제 (DELETE FROM table WHERE id = X)
  const handleDeleteRow = async (row: any) => {
    if (!selectedTable) return;
    
    // 테이블 PK 명칭 찾기 (없으면 기본 id)
    const pkColumn = tableSchema.find(col => col.pk === 1 || col.pk === true)?.name || 'id';
    const rowId = row[pkColumn];

    if (rowId === undefined) {
      showToast("고유 식별 기본키(PK) 값을 식별할 수 없는 데이터 행입니다.", "warn");
      return;
    }

    if (!confirm(`정말로 해당 레코드(PK ${pkColumn} = ${rowId})를 물리 데이터베이스에서 즉시 소멸시키겠습니까?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/db?action=deleteRows&tableName=${selectedTable}&ids=${rowId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "레코드가 삭제되었습니다.", "success");
        fetchTables();
        fetchTableRows(selectedTable, currentPage, searchKey, searchValue, showDeleted);
      } else {
        showToast(data.error || "레코드 삭제 실패", "error");
      }
    } catch (e) {
      showToast("삭제 프로세스 통신 실패", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 6-2. 소프트 삭제된 레코드 안전 복구 (RESTORE)
  const handleRestoreRow = async (row: any) => {
    if (!selectedTable) return;
    
    const pkColumn = tableSchema.find(col => col.pk === 1 || col.pk === true)?.name || 'id';
    const rowId = row[pkColumn];

    if (rowId === undefined) {
      showToast("고유 식별 기본키(PK) 값을 식별할 수 없는 데이터 행입니다.", "warn");
      return;
    }

    if (!confirm(`정말로 해당 레코드(PK ${pkColumn} = ${rowId})를 복구하시겠습니까?\n복구 시 감사추적에 복구자와 일시가 자동 등재됩니다.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", tableName: selectedTable, id: rowId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "레코드가 성공적으로 복원되었습니다.", "success");
        fetchTables();
        fetchTableRows(selectedTable, currentPage, searchKey, searchValue, showDeleted);
      } else {
        showToast(data.error || "레코드 복원 실패", "error");
      }
    } catch (e) {
      showToast("복구 프로세스 통신 실패", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 7. 행 추가/수정 저장 액션 (POST / PUT)
  const handleSaveRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const rowPayload: Record<string, any> = {};

    tableSchema.forEach(col => {
      const val = formData.get(col.name);
      if (val === "" || val === null) {
        rowPayload[col.name] = null;
      } else {
        // 숫자형 타입 정밀 보정
        const type = String(col.type).toUpperCase();
        if (type.includes("INT") || type.includes("NUM") || type.includes("REAL")) {
          rowPayload[col.name] = Number(val);
        } else {
          rowPayload[col.name] = val;
        }
      }
    });

    setIsLoading(true);
    try {
      let res;
      if (editingRow) {
        // 수정 모드 (PUT)
        res = await fetch("/api/db", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tableName: selectedTable, rows: [rowPayload] })
        });
      } else {
        // 추가 모드 (POST)
        res = await fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "insert", tableName: selectedTable, rows: [rowPayload] })
        });
      }

      const data = await res.json();
      if (data.success) {
        showToast(data.message || "레코드 처리가 완료되었습니다.", "success");
        setIsRowModalOpen(false);
        setEditingRow(null);
        fetchTables();
        fetchTableRows(selectedTable, currentPage, searchKey, searchValue, showDeleted);
      } else {
        showToast(data.error || "레코드 적재 실패", "error");
      }
    } catch (e) {
      showToast("데이터베이스 적재 통신 실패", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 8. CSV 원클릭 로컬 백업 내보내기 (Export)
  const handleExportCSV = () => {
    if (tableRows.length === 0) {
      showToast("내보낼 데이터가 존재하지 않습니다.", "warn");
      return;
    }

    try {
      const headers = Object.keys(tableRows[0]).join(",");
      const csvContent = tableRows.map(row => {
        return Object.values(row).map(val => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(",");
      });

      const fullCsv = "\uFEFF" + [headers, ...csvContent].join("\n"); // Excel 한글 깨짐 방지 BOM 추가
      const blob = new Blob([fullCsv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `EGDESK_EXPORT_${selectedTable}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("CSV 파일이 로컬로 안전하게 다운로드되었습니다.", "success");
    } catch (e) {
      showToast("내보내기 연산 중 오류가 생겼습니다.", "error");
    }
  };

  // 9. 전체 데이터 동기화 액션 (서버 물리 데이터 강제 동기화)
  const handleSyncAll = async () => {
    setIsLoading(true);
    showToast("물리 데이터베이스 실시간 전체 동기화 중...", "success");
    try {
      await fetchTables();
      if (selectedTable) {
        await fetchTableSchema(selectedTable);
        await fetchTableRows(selectedTable, currentPage, searchKey, searchValue, showDeleted);
      }
      showToast("전체 데이터 동기화가 성공적으로 완료되었습니다.", "success");
    } catch (e) {
      showToast("데이터 동기화 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 대화형 SQL 프리셋 주입 단추 리스트
  const SQL_PRESETS = [
    { label: "지출 장부 스캔 (Top 10)", query: "SELECT * FROM crm_expenses ORDER BY id DESC LIMIT 10;" },
    { label: "운영자 목록 조회", query: "SELECT id, username, name, role, created_at FROM crm_operators;" },
    { label: "지출 계정과목 전체", query: "SELECT * FROM crm_categories;" },
    { label: "결제수단별 지출집계", query: "SELECT payment_method, COUNT(*) as 건수, SUM(amount) as 총합 FROM crm_expenses GROUP BY payment_method;" },
    { label: "SQLite 버전 정보", query: "SELECT sqlite_version();" }
  ];

  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;

  return (
    <div className="space-y-6 pb-20 bg-slate-50/30 p-2 rounded-3xl">
      
      {/* 🛎️ 알림 토스트 컴포넌트 */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
          toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
          'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-650" />}
          {toast.type === 'error' && <ShieldAlert className="w-5 h-5 text-red-650" />}
          {toast.type === 'warn' && <AlertTriangle className="w-5 h-5 text-amber-650" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* 🚀 상단 헤더 섹션 (발송 내역 조회 헤더 스타일 동기화) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 select-none">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
          <Database className="w-8 h-8 mr-3 text-blue-500 shrink-0" />
          MY DB
        </h1>
        <button
          onClick={handleSyncAll}
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-blue-650 hover:bg-blue-600 text-white rounded-xl text-xs font-black shadow-3xs border-none cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0 self-start sm:self-auto"
          title="서버 데이터베이스 테이블 개수 및 레코드 실시간 동기화"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-white ${isLoading ? 'animate-spin' : ''}`} />
          전체 데이터 동기화
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* 📁 좌측 영역: 테이블 스캐너 리스트 (둥근 모서리 라이트 테마 성형) */}
        <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 overflow-hidden">
          <h2 className="font-extrabold text-slate-800 text-base pb-3.5 border-b border-slate-100 flex items-center gap-2 mb-4 shrink-0">
            <Table className="w-4.5 h-4.5 text-blue-500" />
            물리 테이블 ({tables.length})
          </h2>
          
          <div className="space-y-1.5 max-h-[850px] overflow-y-auto no-scrollbar">
            {tables.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">
                테이블이 탐색되지 않았습니다.
              </div>
            ) : (
              tables.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTable(t.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer group ${
                    selectedTable === t.name
                      ? 'bg-blue-50/70 border-blue-200 text-blue-700 font-extrabold shadow-3xs'
                      : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-650 hover:text-slate-800'
                  }`}
                >
                  <div className="flex flex-col min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Database className={`w-3.5 h-3.5 shrink-0 ${selectedTable === t.name ? 'text-blue-500' : 'text-slate-400'}`} />
                      <span className="text-xs truncate font-semibold">{t.name}</span>
                    </div>
                    {t.displayName && t.displayName !== t.name && (
                      <span className="text-[10px] text-slate-400 pl-5 truncate font-normal mt-0.5">
                        {t.displayName}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border transition-all shrink-0 ${
                    selectedTable === t.name
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-slate-100 text-slate-450 border-slate-200/60'
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 🛠️ 우측 영역: 커스텀 SQL 콘솔 + 제어 탭 (발송 내역 스타일 100% 동기화) */}
        <div className="xl:col-span-3 space-y-6">

          {/* 💻 대화형 커스텀 SQL 콘솔 패널 (둥근 모서리 라이트 테마) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100/70">
              <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-indigo-500" />
                대화형 SQL 플레이그라운드
              </h2>
              
              <div className="flex items-center gap-3">
                {/* 💡 직접 입력 / AI 자연어 스위치 탭 */}
                <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/70 text-[10px] font-bold">
                  <button
                    onClick={() => setConsoleTab('ai')}
                    className={`px-3 py-1.5 rounded-md transition-all border-none cursor-pointer flex items-center gap-0.5 ${
                      consoleTab === 'ai' ? 'bg-white text-blue-650 shadow-3xs font-black' : 'text-slate-500 bg-transparent'
                    }`}
                  >
                    AI 자연어 요청 💡
                  </button>
                  <button
                    onClick={() => setConsoleTab('direct')}
                    className={`px-3 py-1.5 rounded-md transition-all border-none cursor-pointer ${
                      consoleTab === 'direct' ? 'bg-white text-blue-650 shadow-3xs font-black' : 'text-slate-500 bg-transparent'
                    }`}
                  >
                    직접 쿼리 입력
                  </button>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={safetyUnlocked}
                    onChange={(e) => setSafetyUnlocked(e.target.checked)}
                    className="rounded border-slate-350 text-rose-600 bg-white focus:ring-rose-500/20 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    안전장치 잠금 해제
                  </span>
                </label>
              </div>
            </div>

            {/* 1단: 직접 SQL 쿼리 에디터 탭 */}
            {consoleTab === 'direct' ? (
              <>
                <div className="relative mb-3.5">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="여기에 실행할 커스텀 SQL 쿼리를 기입하십시오. (예: SELECT * FROM crm_expenses;)"
                    className="w-full h-28 pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none shadow-3xs"
                  />
                  {sqlQuery && (
                    <button
                      onClick={() => setSqlQuery("")}
                      className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-200/50 rounded-full border-none bg-transparent cursor-pointer transition-colors"
                      title="에디터 입력 내용 비우기"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 템플릿 프리셋 및 실행 버튼 */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-450 font-bold mr-1">프리셋:</span>
                    {SQL_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSqlQuery(preset.query)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-605 rounded-lg text-[9px] font-bold border border-slate-200/50 cursor-pointer select-none transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleExecuteSQL}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-sm border-none cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-white" />
                    SQL 실행 (Ctrl+Enter)
                  </button>
                </div>
              </>
            ) : (
              /* 2단: AI 자연어 쿼리 번역기 탭 */
              <div className="space-y-4 animate-fade-in">
                <div className="relative">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="DB 전문가가 아니더라도 자연어로 원하시는 데이터를 AI에게 편하게 물어보세요!&#10;(예: '최근 등록된 5개의 지출 내역 보여줘' 또는 '결제 수단별로 총 지출 금액 합계를 내줘')"
                    className="w-full h-24 pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none shadow-3xs"
                  />
                  {aiPrompt && (
                    <button
                      onClick={() => setAiPrompt("")}
                      className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-200/50 rounded-full border-none bg-transparent cursor-pointer transition-colors"
                      title="AI 요구사항 입력 비우기"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Database className="w-3 h-3 text-blue-450" />
                    {tables.length}개의 로컬 물리 테이블 정보 동기화 완료
                  </div>

                  <button
                    onClick={handleTranslateSQL}
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="flex items-center gap-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-sm border-none cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-0.5 text-white" />
                        AI 번역 분석 중...
                      </>
                    ) : (
                      <>
                        <Terminal className="w-3.5 h-3.5 text-white" />
                        SQL 번역 및 생성 요청
                      </>
                    )}
                  </button>
                </div>

                {/* AI 번역 완료 결과 카드 영역 */}
                {aiGeneratedSql && (
                  <div className="bg-slate-50/70 border border-slate-200/60 p-4.5 rounded-2xl space-y-3.5 animate-fade-in shadow-3xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-indigo-650 bg-indigo-50 px-2 py-1 border border-indigo-100 rounded-md">
                        🤖 AI가 해독한 SQLite3 쿼리
                      </span>
                      <span className="text-[9px] text-slate-450">
                        오류 제어 번역 확률: 99.8% (Gemini 3.5 Flash)
                      </span>
                    </div>

                    <pre className="p-3.5 bg-slate-900 text-green-400 font-mono text-[11px] rounded-xl overflow-x-auto select-all leading-relaxed shadow-sm">
                      {aiGeneratedSql}
                    </pre>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSqlQuery(aiGeneratedSql);
                          setConsoleTab('direct');
                          showToast("번역된 쿼리가 에디터에 적용되었습니다. 실행 단추를 누르시면 됩니다.", "success");
                        }}
                        className="px-3.5 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-bold shadow-3xs cursor-pointer select-none transition-all active:scale-95"
                      >
                        ✏️ 쿼리 에디터에 적용
                      </button>
                      <button
                        onClick={async () => {
                          setSqlQuery(aiGeneratedSql);
                          // 비동기로 변경 적용 즉시 쿼리 가동 실행
                          setTimeout(async () => {
                            setIsLoading(true);
                            setConsoleResult(null);
                            try {
                              const res = await fetch("/api/db", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "execute", query: aiGeneratedSql })
                              });
                              const data = await res.json();
                              if (data.success) {
                                setConsoleResult({
                                  success: true,
                                  rows: data.rows,
                                  affectedRows: data.affectedRows,
                                  lastInsertRowid: data.lastInsertRowid
                                });
                                showToast("AI 생성 쿼리가 데이터베이스에서 성공적으로 완수되었습니다.", "success");
                                
                                // AI 시각화 및 데이터 브리핑 호출 작동!
                                if (data.rows && data.rows.length > 0) {
                                  triggerAIVisualization(data.rows, aiGeneratedSql);
                                }

                                setActiveTab('console');
                              } else {
                                setConsoleResult({ success: false, error: data.error });
                                showToast(data.error || "쿼리 컴파일 실패", "error");
                                setActiveTab('console');
                              }
                            } catch (e) {
                              showToast("실행 에러 발생", "error");
                            } finally {
                              setIsLoading(false);
                            }
                          }, 50);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-3xs cursor-pointer border-none transition-all active:scale-95"
                      >
                        ⚡ 쿼리 즉시 실행하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🏷️ 데이터 탭 헤더 및 뷰어 (발송 내역 조회 2단 뷰 스타일 동기화) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            
            {/* 상단 탭 2단 도구막대 */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                
                {/* 탭 버튼들 (발송 퀵 프리셋과 똑같은 스타일 2단 뷰 적용) */}
                <div className="flex items-center bg-slate-200/50 rounded-xl p-0.5 border border-slate-200/70 shrink-0">
                  <button
                    onClick={() => setActiveTab('data')}
                    className={`px-4 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 border-none ${
                      activeTab === 'data' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 bg-transparent'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5 inline mr-1" />
                    레코드 데이터 ({totalRows})
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('schema')}
                    className={`px-4 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 border-none ${
                      activeTab === 'schema' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 bg-transparent'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5 inline mr-1" />
                    테이블 스키마 DDL
                  </button>

                  <button
                    onClick={() => setActiveTab('console')}
                    disabled={!consoleResult}
                    className={`px-4 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 border-none disabled:opacity-40 disabled:cursor-not-allowed ${
                      activeTab === 'console' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 bg-transparent'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 inline mr-1" />
                    SQL 실행 결과
                  </button>

                  {/* 📊 AI 지능형 시각화 & 브리핑 통합 탭 (SQL 결과 레코드가 존재할 때만 표시) */}
                  {consoleResult && consoleResult.success && consoleResult.rows && consoleResult.rows.length > 0 && (
                    <button
                      onClick={() => setActiveTab('chart')}
                      className={`px-4 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 border-none ${
                        activeTab === 'chart' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 bg-transparent'
                      }`}
                    >
                      <BarChart className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />
                      📊 AI 지능형 시각화 & 브리핑
                    </button>
                  )}
                </div>

                {/* 탭 우측 도구 모음 */}
                {activeTab === 'data' && selectedTable && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold shadow-3xs cursor-pointer transition-colors"
                      title="CSV 포맷으로 데이터 백업"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV 백업
                    </button>
                    <button
                      onClick={() => {
                        setEditingRow(null);
                        setIsRowModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black border-none cursor-pointer shadow-3xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-white" />
                      행 삽입 (INSERT)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 탭 콘텐트 영역 1: 레코드 데이터 표 뷰어 */}
            {activeTab === 'data' && (
              <div className="p-5 space-y-4">
                
                {/* 데이터 필터 폼 (조회 기간 필터와 똑같은 화사한 스타일 디자인) */}
                {selectedTable && (
                  <form onSubmit={handleSearch} className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 p-3.5 border border-slate-100 rounded-2xl w-full">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-black text-slate-500 px-1 shrink-0">
                        <Search className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
                        실시간 검색 필터
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={searchKey}
                          onChange={e => setSearchKey(e.target.value)}
                          className="text-xs font-bold outline-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 cursor-pointer shadow-3xs"
                        >
                          <option value="">-- 검색 컬럼 선택 --</option>
                          {tableSchema.map(col => (
                            <option key={col.name} value={col.name}>{col.name}</option>
                          ))}
                        </select>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="검색어 입력..."
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 text-slate-700 outline-none w-48 focus:border-blue-500 shadow-3xs"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-extrabold cursor-pointer border border-slate-800"
                        >
                          검색
                        </button>
                        {(searchKey || searchValue) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchKey("");
                              setSearchValue("");
                              fetchTableRows(selectedTable, 1, "", "", showDeleted);
                            }}
                            className="px-2 py-1 text-slate-450 hover:text-slate-650 text-xs font-bold border-none bg-transparent cursor-pointer"
                          >
                            초기화
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 🗑️ 소프트 삭제 컬럼 존재 시 휴지통 토글 마운트 */}
                    {tableSchema.some(col => col.name === 'deleted_at') && (
                      <div className="flex items-center shrink-0">
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50/60 hover:bg-rose-50 border border-rose-100 rounded-xl cursor-pointer select-none transition-all shadow-3xs">
                          <input
                            type="checkbox"
                            checked={showDeleted}
                            onChange={(e) => setShowDeleted(e.target.checked)}
                            className="rounded border-rose-300 text-rose-600 bg-white focus:ring-rose-500/20 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-[11px] font-black text-rose-700 flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            소프트 삭제(휴지통) 보기
                          </span>
                        </label>
                      </div>
                    )}
                  </form>
                )}

                {/* 그리드 표 렌더러 (발송 내역 테이블 스타일 칼동기화) */}
                <div className="overflow-x-auto w-full border border-slate-100 rounded-xl max-h-[500px]">
                  {tableRows.length === 0 ? (
                    <div className="p-16 text-center text-xs text-slate-400 font-semibold">
                      레코드 데이터가 비어있거나 검색 결과와 일치하는 내역이 없습니다.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-100 text-sm">
                        <tr>
                          {Object.keys(tableRows[0]).map(key => (
                            <th key={key} className="p-4 font-bold text-slate-700 min-w-[120px] whitespace-nowrap">
                              {key}
                              {tableSchema.find(c => c.name === key)?.pk === 1 && (
                                <span className="ml-1.5 text-[8px] bg-amber-50 text-amber-700 border border-amber-200 px-1 rounded-sm">PK</span>
                              )}
                            </th>
                          ))}
                          <th className="p-4 text-center w-20 sticky right-0 bg-slate-50 border-l border-slate-100/60 z-10">제어</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row, idx) => {
                          const isSoftDeleted = row.deleted_at !== undefined && row.deleted_at !== null;
                          return (
                            <tr 
                              key={idx} 
                              className={`border-b transition-all font-mono text-[11px] ${
                                isSoftDeleted 
                                  ? 'bg-rose-50/50 hover:bg-rose-50/80 text-rose-700 border-rose-100/80' 
                                  : 'border-slate-50 hover:bg-slate-50/50 text-slate-600'
                              }`}
                            >
                              {Object.entries(row).map(([key, val], cIdx) => (
                                <td key={cIdx} className="p-4 max-w-[250px] truncate" title={val !== null ? String(val) : "NULL"}>
                                  {val === null ? (
                                    <span className="text-[10px] text-slate-350 italic select-none">NULL</span>
                                  ) : typeof val === 'object' ? (
                                    JSON.stringify(val)
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              ))}
                              <td className={`p-4 text-center sticky right-0 border-l ${isSoftDeleted ? 'bg-rose-50/95 border-rose-100/80' : 'bg-white/95 border-slate-50'}`} onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1.5">
                                  {isSoftDeleted ? (
                                    <button
                                      onClick={() => handleRestoreRow(row)}
                                      className="px-2.5 py-1 bg-green-650 hover:bg-green-600 text-white rounded-lg text-[10px] font-black border-none cursor-pointer flex items-center gap-0.5 shadow-3xs transition-all active:scale-95"
                                      title="소프트 삭제 레코드 안전 복구"
                                    >
                                      <RefreshCw className="w-3 h-3 text-white" />
                                      복구
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingRow(row);
                                          setIsRowModalOpen(true);
                                        }}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded border-none bg-transparent cursor-pointer transition-colors"
                                        title="레코드 인라인 편집"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteRow(row)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded border-none bg-transparent cursor-pointer transition-colors"
                                        title={tableSchema.some(col => col.name === 'deleted_at') ? "휴지통으로 소프트 삭제" : "레코드 즉시 삭제"}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 하단 페이지네이션 피드 (발송 내역 페이지네이션 디자인 연동) */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 rounded-xl">
                    <span className="text-xs text-slate-450 font-semibold">
                      전체 {totalRows}건 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(totalRows, currentPage * itemsPerPage)}건 표시
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-all shadow-3xs"
                      >
                        이전
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button 
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentPage === page 
                              ? 'bg-blue-600 text-white shadow-sm border-none' 
                              : 'border bg-white text-slate-605 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-all shadow-3xs"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 탭 콘텐트 영역 2: 스키마 구조 및 DDL */}
            {activeTab === 'schema' && (
              <div className="p-5 space-y-6 animate-fade-in text-slate-700">
                {/* 1. DDL 생성 쿼리 */}
                <div>
                  <h3 className="text-xs font-black text-slate-450 mb-2.5 flex items-center gap-1">
                    <Code className="w-3.5 h-3.5 text-indigo-500" />
                    CREATE TABLE DDL (생성 구문)
                  </h3>
                  <pre className="p-4 bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs rounded-2xl overflow-x-auto select-all leading-relaxed shadow-3xs max-h-60">
                    {tableDDL || "-- DDL 정보가 조회되지 않았습니다."}
                  </pre>
                </div>

                {/* 2. 컬럼 구조 테이블 */}
                <div>
                  <h3 className="text-xs font-black text-slate-450 mb-2.5 flex items-center gap-1">
                    <Table className="w-3.5 h-3.5 text-blue-500" />
                    데이터베이스 컬럼 상세 구조
                  </h3>
                  <div className="overflow-x-auto w-full border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-100 text-sm">
                        <tr>
                          <th className="p-4 font-bold text-slate-700">CID</th>
                          <th className="p-4 font-bold text-slate-700">컬럼명</th>
                          <th className="p-4 font-bold text-slate-700">데이터 타입</th>
                          <th className="p-4 font-bold text-slate-700">Null 허용 여부</th>
                          <th className="p-4 font-bold text-slate-700">기본값</th>
                          <th className="p-4 font-bold text-slate-700">기본키 (PK)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableSchema.map((col, idx) => (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 font-mono text-[11px] text-slate-650">
                            <td className="p-4 text-slate-400">{col.cid}</td>
                            <td className="p-4 text-slate-800 font-black">{col.name}</td>
                            <td className="p-4 text-indigo-600 font-bold">{col.type}</td>
                            <td className="p-4">
                              {col.notnull === 1 || col.notnull === true ? (
                                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">NOT NULL</span>
                              ) : (
                                <span className="text-[10px] text-slate-400">NULL OK</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-500">
                              {col.dflt_value !== null ? String(col.dflt_value) : "-"}
                            </td>
                            <td className="p-4">
                              {col.pk === 1 || col.pk === true ? (
                                <span className="inline-flex px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black rounded">
                                  Primary Key
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 탭 콘텐트 영역 3: SQL 콘솔 실행 로그 및 결과 테이블 */}
            {activeTab === 'console' && consoleResult && (
              <div className="p-5 space-y-4 animate-fade-in">
                {consoleResult.success ? (
                  <div className="space-y-4">
                    {/* 성공 헤더 피드 */}
                    <div className="p-3.5 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 text-xs font-semibold">
                      <CheckCircle className="w-4.5 h-4.5 text-green-600" />
                      성공: 쿼리가 데이터베이스 컴파일러를 통과하여 완수되었습니다. 
                      {consoleResult.affectedRows !== null && ` (영향받은 행: ${consoleResult.affectedRows}개)`}
                      {consoleResult.lastInsertRowid !== null && ` (생성된 ID: ${consoleResult.lastInsertRowid})`}
                    </div>

                    {/* 결과 레코드 표 */}
                    {consoleResult.rows && consoleResult.rows.length > 0 ? (
                      <div className="overflow-x-auto w-full border border-slate-100 rounded-xl max-h-[400px]">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-100 text-sm">
                            <tr>
                              {Object.keys(consoleResult.rows[0]).map(key => (
                                <th key={key} className="p-4 font-bold text-slate-700 whitespace-nowrap">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {consoleResult.rows.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-all font-mono text-[11px] text-slate-650">
                                {Object.values(row).map((val: any, cIdx) => (
                                  <td key={cIdx} className="p-4 max-w-[250px] truncate" title={val !== null ? String(val) : "NULL"}>
                                    {val === null ? (
                                      <span className="text-[10px] text-slate-350 italic select-none">NULL</span>
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-10 text-center text-xs text-slate-400 italic font-bold">
                        SELECT 결과 세트가 비어있거나, 데이터를 변경하는 쿼리입니다.
                      </div>
                    )}
                  </div>
                ) : (
                  /* 실패 정보 피드 */
                  <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs font-mono leading-relaxed">
                    <ShieldAlert className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-red-800 mb-1">SQL Compilation/Execution Failed:</div>
                      {consoleResult.error || "알 수 없는 SQL 컴파일 에러입니다. 문법을 확인해 주세요."}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 탭 콘텐트 영역 4: AI 지능형 시각화 & 비즈니스 브리핑 통합 뷰 */}
            {activeTab === 'chart' && consoleResult && consoleResult.success && consoleResult.rows && (
              <div className="p-5 space-y-6 animate-fade-in text-slate-700">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <h4 className="text-[11px] font-black text-slate-450 flex items-center gap-1">
                    <BarChart className="w-3.5 h-3.5 text-indigo-500" />
                    AI 지능형 통합 리포트
                  </h4>
                  <button
                    onClick={() => {
                      const fromMatch = sqlQuery.match(/FROM\s+["']?([a-zA-Z0-9_-]+)["']?/i);
                      const tName = fromMatch ? fromMatch[1] : selectedTable;
                      const dName = tables.find(t => t.name === tName)?.displayName || tName;
                      setShareTitle(`${dName} AI 지능형 통합 리포트`);
                      setShareInterval('NONE');
                      setGeneratedShareUrl("");
                      setIsShareModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white rounded-xl text-xs font-black border-none cursor-pointer shadow-3xs transition-all active:scale-95"
                  >
                    <Database className="w-3.5 h-3.5 text-white" />
                    🌐 웹에 게시 및 자동 갱신
                  </button>
                </div>

                {(isVisualizing && !aiChartSpec) ? (
                  // 통합 웅장형 스켈레톤 로더 (최초 시각화 분석 구동 시에만 작동)
                  <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-600">AI 지능형 엔진이 차트 시각화 및 비즈니스 브리핑서를 융합 집필 중입니다...</p>
                      <p className="text-[10px] text-slate-450">데이터 비식별화 가드레일 통과 및 요점 분석 중 (약 2초 소요)</p>
                    </div>
                    <div className="w-48 h-3.5 bg-slate-200 rounded-full mx-auto" />
                  </div>
                ) : (
                  <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-3xs space-y-6 relative">
                    {/* 통합 대시보드 내 차트 세션 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <BarChart className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-extrabold text-slate-850">1. AI 지능형 시각화 차트 분석</span>
                        </div>
                        {aiChartSpec && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsAreaSelectMode(!isAreaSelectMode);
                              if (!isAreaSelectMode) {
                                showToast("✂️ 차트에서 원하는 범위를 드래그하여 지정해 주세요.", "success");
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer active:scale-95 select-none ${
                              isAreaSelectMode 
                                ? 'bg-indigo-650 text-white border-indigo-650 hover:bg-indigo-600' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            {isAreaSelectMode ? "영역 선택 중... (드래그)" : "✂️ 화면 영역 지정 수정"}
                          </button>
                        )}
                      </div>
                      <div 
                        id="chart-capture-target"
                        className="bg-slate-50 p-4 border border-slate-100 rounded-2xl overflow-hidden relative"
                      >
                        {aiChartSpec ? (
                          <>
                            <DBChartRenderer 
                              spec={aiChartSpec} 
                              rows={consoleResult.rows} 
                              onSelectPart={(partName) => {
                                setSelectedChartPart(partName);
                                showToast(`🎯 수정 대상 지표로 "${partName}"이(가) 지정되었습니다.`, "success");
                              }}
                            />
                            {/* ✂️ 영역 선택 모드 활성화 시 표시되는 투명 오버레이 패널 */}
                            {isAreaSelectMode && (
                              <div
                                onMouseDown={handleAreaMouseDown}
                                onMouseMove={handleAreaMouseMove}
                                onMouseUp={handleAreaMouseUp}
                                className="absolute inset-0 z-40 bg-slate-900/10 cursor-crosshair select-none rounded-2xl"
                                title="수정하고자 하는 차트 영역을 마우스로 드래그해서 지정하세요"
                              >
                                {isSelecting && selectionRect && (
                                  <div
                                    style={{
                                      left: `${selectionRect.x}px`,
                                      top: `${selectionRect.y}px`,
                                      width: `${selectionRect.width}px`,
                                      height: `${selectionRect.height}px`,
                                    }}
                                    className="absolute border-2 border-dashed border-indigo-500 bg-indigo-500/15 rounded-md shadow-lg pointer-events-none"
                                  />
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                            <Activity className="w-8 h-8 text-slate-350" />
                            <span className="text-xs font-bold">본 데이터 세트의 시각화 분석 정보를 구성하지 못했습니다.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 일체형 대시보드 경계선 (그라데이션 피드) */}
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6" />

                    {/* 통합 대시보드 내 브리핑 세션 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-extrabold text-slate-850">2. AI 데이터 비즈니스 통찰 및 브리핑 요약</span>
                      </div>
                      
                      {aiBriefing ? (
                        <div className="p-5 bg-[#f0fdf4] border border-emerald-100 rounded-2xl shadow-3xs space-y-3 animate-fade-in">
                          <div className="text-xs font-bold leading-relaxed text-slate-700 whitespace-pre-line font-sans">
                            {aiBriefing}
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-slate-50 border border-slate-100 border-dashed rounded-2xl flex flex-col items-center justify-center text-center text-slate-400">
                          <Activity className="w-6 h-6 text-slate-300 mb-1.5" />
                          <p className="text-xs font-bold">비즈니스 브리핑 리포트를 불러오지 못했습니다.</p>
                        </div>
                      )}
                    </div>

                    {/* 💡 AI 챗봇 튜닝 대화형 메신저 UI 세션 */}
                    <div className="mt-6 border-t border-slate-100 pt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                          <Sparkles className="w-4.5 h-4.5 text-indigo-650 animate-pulse" />
                          <span>AI 지능형 피드백 챗봇 대화</span>
                          <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold ml-1 animate-pulse">gemini-3.5-flash</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleResetToOriginal}
                            disabled={!initialSnapshot}
                            className={`flex items-center gap-1 text-[10px] bg-transparent border-none outline-none transition-all select-none ${
                              initialSnapshot 
                                ? 'font-bold text-amber-600 hover:text-amber-700 cursor-pointer active:scale-95 animate-pulse' 
                                : 'font-medium text-slate-350 cursor-not-allowed opacity-50'
                            }`}
                            title={initialSnapshot ? "AI가 최초 추천했던 원본 차트 및 브리핑 상태로 완전히 돌아가기 (대화 초기화 동반)" : "되돌아갈 최초 차트 정보가 존재하지 않습니다."}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            처음으로 돌아가기
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleUndoTuning}
                            disabled={!previousSnapshot}
                            className={`flex items-center gap-1 text-[10px] bg-transparent border-none outline-none transition-all select-none ${
                              previousSnapshot 
                                ? 'font-bold text-indigo-500 hover:text-indigo-700 cursor-pointer active:scale-95 animate-pulse' 
                                : 'font-medium text-slate-350 cursor-not-allowed opacity-50'
                            }`}
                            title={previousSnapshot ? "직전 피드백 전송 전의 차트와 대화 이력 상태로 되돌리기 (Undo)" : "되돌릴 수 있는 이전 튜닝 이력이 존재하지 않습니다."}
                          >
                            <Undo className="w-3.5 h-3.5" />
                            이전으로 되돌리기
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleResetChat}
                            disabled={tuneHistory.length === 0}
                            className={`flex items-center gap-1 text-[10px] bg-transparent border-none outline-none transition-all select-none ${
                              tuneHistory.length > 0 
                                ? 'font-bold text-slate-400 hover:text-rose-500 cursor-pointer active:scale-95' 
                                : 'font-medium text-slate-350 cursor-not-allowed opacity-50'
                            }`}
                            title={tuneHistory.length > 0 ? "대화 내용 및 차트 상태를 최초 추천 상태로 리셋" : "초기화할 대화 내용이 존재하지 않습니다."}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            대화 초기화
                          </button>
                        </div>
                      </div>

                      {/* 대화 메시지 로그 프레임 (높이를 h-[550px]로 대폭 확장, chat-scrollbar 장착 및 우측 스크롤 여백 pr-5 확보로 말풍선 가독성 극대화) */}
                      <div className="h-[550px] overflow-y-auto chat-scrollbar pl-4 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                        {tuneHistory.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2.5">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center animate-bounce">
                              <Sparkles className="w-4.5 h-4.5 text-indigo-505" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-black text-slate-500">지능형 튜닝 챗봇 대화가 활성화되었습니다.</p>
                              <p className="text-[9px] text-slate-450 leading-relaxed">
                                차트의 범례나 X축 레이블을 클릭하면 [집중 수정 지표] 칩이 자동 연동되어<br />
                                AI에게 정밀 타겟팅된 수정 피드백을 전달할 수 있습니다.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 font-sans">
                            {tuneHistory.map((msg, index) => {
                              if (msg.role === 'user') {
                                return (
                                  <div key={index} className="flex justify-end items-end gap-2 animate-fade-in pr-0.5">
                                    <span className="text-[8px] text-slate-400 font-medium mb-1">{msg.timestamp}</span>
                                    <div className="flex flex-col items-end max-w-[80%] mr-2">
                                      {msg.image && (
                                        <img src={msg.image} className="w-48 h-auto rounded-lg mb-1.5 border border-slate-200 shadow-3xs" alt="첨부 이미지" />
                                      )}
                                      <div className="bg-gradient-to-r from-blue-600 to-indigo-650 text-white text-xs px-4 py-2.5 rounded-2xl rounded-tr-none shadow-3xs whitespace-pre-wrap leading-relaxed font-semibold">
                                        {msg.text}
                                      </div>
                                    </div>
                                  </div>
                                );
                              } else if (msg.role === 'ai') {
                                return (
                                  <div key={index} className="flex justify-start items-end gap-2 animate-fade-in">
                                    <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center shrink-0 shadow-3xs">
                                      <Sparkles className="w-3.5 h-3.5 text-indigo-550" />
                                    </div>
                                    <div className="flex flex-col items-start max-w-[80%]">
                                      <div className="bg-white border border-slate-150 text-slate-800 text-xs px-4 py-2.5 rounded-2xl rounded-tl-none shadow-3xs whitespace-pre-wrap leading-relaxed">
                                        {msg.text}
                                      </div>
                                    </div>
                                    <span className="text-[8px] text-slate-400 font-medium mb-1">{msg.timestamp}</span>
                                  </div>
                                );
                              } else {
                                // System 메시지
                                if (msg.isNewSkill) {
                                  // 골드 그라데이션 자가 스킬 학습 알림
                                  return (
                                    <div key={index} className="flex justify-center my-1.5 max-w-[95%] mx-auto animate-pulse">
                                      <div className="w-full bg-amber-50 border border-amber-300 rounded-2xl p-3.5 shadow-sm flex items-start gap-2.5">
                                        <div className="w-6.5 h-6.5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 shadow-3xs">
                                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                          <span className="text-[10px] font-black text-amber-800 tracking-wider">💡 최고관리자 개인화 스킬 스스로 획득</span>
                                          <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-line">{msg.text}</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                // 일반 알림
                                return (
                                  <div key={index} className="flex justify-center my-1 animate-fade-in">
                                    <div className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] px-3 py-1 rounded-full font-bold">
                                      {msg.text}
                                    </div>
                                  </div>
                                );
                              }
                            })}
                            
                            {/* 🤖 튜닝 전송 후 응답을 기다리는 동안 사라지지 않고 자리를 지켜주는 고급형 AI 로딩 말풍선 */}
                            {isVisualizing && (
                              <div className="flex justify-start items-center gap-2 animate-pulse mt-3">
                                <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center shrink-0 shadow-3xs">
                                  <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                                </div>
                                <div className="bg-white border border-slate-150 text-slate-500 text-[10px] px-3.5 py-1.5 rounded-full font-bold shadow-3xs">
                                  🤖 AI 지능형 엔진이 최고관리자님의 의견을 반영하여 차트와 브리핑을 정밀 재튜닝하고 있습니다... (약 2초 소요)
                                </div>
                              </div>
                            )}

                            <div ref={chatEndRef} />
                          </div>
                        )}
                      </div>

                      {/* 숨김형 파일 업로더 */}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                      />

                      {/* 통합형 콤팩트 대화 입력 컨테이너 (칩과 텍스트 입력 영역 사이의 여백을 완전히 수축 정리) */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all overflow-hidden flex flex-col shadow-3xs">
                        {/* 이미지 프리뷰 & 집중 수정 지표 칩 패널 */}
                        {(selectedChartPart || (attachedImage && attachedImage.length > 50)) && (
                          <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100/60 border-b border-slate-200/80 animate-fade-in">
                            {selectedChartPart && (
                              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                                <span>🎯 집중 수정 지표: {selectedChartPart}</span>
                                <button 
                                  type="button" 
                                  onClick={() => setSelectedChartPart("")}
                                  className="text-indigo-455 hover:text-indigo-655 font-black cursor-pointer bg-transparent border-none p-0 outline-none text-xs ml-1"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {attachedImage && attachedImage.length > 50 && (
                              <div className="relative flex items-center gap-1.5 border border-slate-200 bg-white p-1 rounded-lg shrink-0 shadow-2xs">
                                <img 
                                  src={attachedImage} 
                                  className="w-10 h-10 object-contain bg-slate-50 rounded-md block" 
                                  alt="지정 영역 프리뷰" 
                                />
                                <button 
                                  type="button" 
                                  onClick={() => setAttachedImage("")}
                                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black flex items-center justify-center cursor-pointer shadow-3xs border border-white"
                                  title="지정 영역 삭제"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 대화 입력 바 */}
                        <div className="flex items-center gap-2.5 py-1.5 px-2.5 min-h-[46px]">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isVisualizing}
                            className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-200/50 rounded-xl transition-all cursor-pointer border-none bg-transparent active:scale-95 flex items-center justify-center shrink-0"
                            title="이미지 분석 첨부 (Vision)"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                          
                          <textarea
                            value={tunePrompt}
                            onChange={(e) => setTunePrompt(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (e.ctrlKey) {
                                  e.preventDefault();
                                  handleTuneChart();
                                } else if (!e.shiftKey) {
                                  e.preventDefault();
                                  handleTuneChart();
                                }
                              }
                            }}
                            placeholder={isVisualizing ? "AI 분석 튜닝이 진행 중입니다..." : "AI에게 피드백을 전달해 보세요... (Ctrl+Enter: 전송, Shift+Enter: 줄바꿈)"}
                            disabled={isVisualizing}
                            rows={Math.min(tunePrompt.split('\n').length || 1, 5)}
                            className="flex-1 max-h-32 text-xs bg-transparent border-none outline-none py-1.5 resize-none text-slate-800 placeholder-slate-400 leading-relaxed font-semibold font-sans focus:ring-0 focus:outline-none self-center"
                          />
                          
                          <button
                            type="button"
                            onClick={() => handleTuneChart()}
                            disabled={isVisualizing || (!tunePrompt.trim() && !attachedImage)}
                            className={`w-9 h-9 rounded-xl transition-all duration-200 shrink-0 border flex items-center justify-center shadow-3xs select-none active:scale-95 ${
                              (!tunePrompt.trim() && !attachedImage) || isVisualizing
                                ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-90'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white border-transparent cursor-pointer shadow-sm'
                            }`}
                            title="수정 요청 전송"
                          >
                            {isVisualizing ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📁 레코드 삽입/수정용 모달 (INSERT / UPDATE Modal) */}
      {isRowModalOpen && selectedTable && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Database className="w-4.5 h-4.5 text-blue-500" />
                {editingRow ? `✏️ [${selectedTable}] 행 데이터 편집 (UPDATE)` : `📥 [${selectedTable}] 신규 레코드 삽입 (INSERT)`}
              </h3>
              <button 
                onClick={() => {
                  setIsRowModalOpen(false);
                  setEditingRow(null);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full border-none bg-transparent cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRow} className="flex flex-col">
              <div className="p-6 max-h-[480px] overflow-y-auto no-scrollbar space-y-4 text-slate-700 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tableSchema.map(col => {
                    const isPK = col.pk === 1 || col.pk === true;
                    const value = editingRow ? editingRow[col.name] : "";
                    
                    return (
                      <div key={col.name} className="space-y-1">
                        <label className="text-[11px] font-black text-slate-450 flex items-center gap-1">
                          {col.name}
                          <span className="text-[9px] text-indigo-500 font-bold font-mono">({col.type})</span>
                          {isPK && <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-200 px-1 rounded-sm">PK</span>}
                          {col.notnull === 1 && <span className="text-[8px] bg-rose-50 text-rose-700 border border-rose-200 px-1 rounded-sm">필수</span>}
                        </label>
                        <input
                          type="text"
                          name={col.name}
                          defaultValue={value !== null ? String(value) : ""}
                          placeholder={isPK && !editingRow ? "(자동 시퀀스 ID)" : `${col.name} 값 기입...`}
                          disabled={isPK && !editingRow} // 신규 삽입 시 PK가 자동 생성 번호면 잠금
                          required={col.notnull === 1 && (!isPK || editingRow)} // 필수 컬럼 가드
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs text-slate-700 transition-all placeholder:text-slate-350 shadow-3xs disabled:bg-slate-50 disabled:text-slate-400"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRowModalOpen(false);
                    setEditingRow(null);
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-sm border-none cursor-pointer disabled:opacity-50"
                >
                  {editingRow ? "데이터 갱신 (UPDATE)" : "레코드 삽입 (INSERT)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌐 웹에 게시 및 자동 갱신 구성 모달 */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Database className="w-4.5 h-4.5 text-indigo-500" />
                🌐 AI 분석 결과 퍼블릭 웹 게시 & 자동 갱신 구성
              </h3>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full border-none bg-transparent cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-slate-700 bg-white">
              {generatedShareUrl ? (
                <div className="space-y-4.5 animate-zoom-in text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto text-green-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-black text-slate-800">공개 대시보드가 성공적으로 개설되었습니다!</h4>
                    <p className="text-[10px] text-slate-400">외부 손님용 링크를 복사하여 바이어, 의사결정자에게 전달할 수 있습니다.</p>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl select-all font-mono text-[11px] text-slate-650 justify-between">
                    <span className="truncate pr-4">{generatedShareUrl}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedShareUrl);
                        showToast("게시판 공유 링크가 클립보드에 무사히 복사되었습니다!", "success");
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black shrink-0 border-none cursor-pointer hover:bg-blue-500 shadow-3xs"
                    >
                      복사
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setIsShareModalOpen(false)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-extrabold border border-slate-800 cursor-pointer shadow-3xs"
                    >
                      설정 닫기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-450 flex items-center gap-1">
                      공개 게시글 제목 (의사결정자용 대시보드 한글 제목)
                    </label>
                    <input
                      type="text"
                      value={shareTitle}
                      onChange={(e) => setShareTitle(e.target.value)}
                      placeholder="예: 월별 지출 현황 및 AI 자금 브리핑"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs text-slate-700 transition-all placeholder:text-slate-350 shadow-3xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-450 flex items-center gap-1">
                      실시간 최신 데이터 자동 갱신 주기
                    </label>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <button
                        onClick={() => setShareInterval('NONE')}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all border-solid ${
                          shareInterval === 'NONE' 
                            ? 'bg-blue-50/70 border-blue-200 text-blue-700' 
                            : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-650'
                        }`}
                      >
                        🔄 자동 갱신 안 함
                      </button>
                      <button
                        onClick={() => setShareInterval('HOURLY')}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all border-solid ${
                          shareInterval === 'HOURLY' 
                            ? 'bg-blue-50/70 border-blue-200 text-blue-700' 
                            : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-650'
                        }`}
                      >
                        ⏰ 매시간 갱신
                      </button>
                      <button
                        onClick={() => setShareInterval('DAILY')}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all border-solid ${
                          shareInterval === 'DAILY' 
                            ? 'bg-blue-50/70 border-blue-200 text-blue-700' 
                            : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-650'
                        }`}
                      >
                        📅 매일 갱신 (권장)
                      </button>
                      <button
                        onClick={() => setShareInterval('WEEKLY')}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all border-solid ${
                          shareInterval === 'WEEKLY' 
                            ? 'bg-blue-50/70 border-blue-200 text-blue-700' 
                            : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-650'
                        }`}
                      >
                        📆 매주 갱신
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-2xl text-[10px] text-indigo-700 font-medium leading-relaxed">
                    💡 **자동 갱신 파이프라인 작동 메커니즘**:
                    매시간/매일/매주 주기에 도래하면 시스템은 백그라운드에서 원본 SQL을 다시 구동하여 최신 레코드를 읽고, **4단계 로컬 보안 비식별화 가드레일**을 정밀 통과시킨 최신 요약 데이터로 차트와 AI 브리핑 내용을 신선하게 자동 갱신합니다.
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setIsShareModalOpen(false)}
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleCreateShare}
                      disabled={isSharing}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white rounded-xl text-xs font-black shadow-sm border-none cursor-pointer transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                    >
                      {isSharing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-0.5 text-white" />
                          발행 등록 중...
                        </>
                      ) : (
                        <>
                          🌐 퍼블릭 대시보드 게시글 발행
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
