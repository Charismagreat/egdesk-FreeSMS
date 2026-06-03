"use client";

import React from "react";
import { 
  Database, RefreshCw, Download, Plus, Edit, 
  Trash2, AlertTriangle, Code, Table, Search, Terminal,
  CheckCircle, X, ShieldAlert, BarChart, ExternalLink, Copy, RotateCcw, Link
} from "lucide-react";

import FriendlyShareModal from "./components/FriendlyShareModal";
import PublicShareModal from "./components/PublicShareModal";
import SharedDashboardsTab from "./components/SharedDashboardsTab";
import StandaloneView from "./components/StandaloneView";
import { SqlConsolePlayground, SqlConsoleResult } from "./components/SqlConsoleTab";
import SchemaTab from "./components/SchemaTab";
import DataBriefingTab from "./components/DataBriefingTab";
import { ColumnSchema, ConsoleResult, TuneMessage, FriendlyMapping } from "./types";

export default function MyDBManagementPage() {
  // 🖥️ 새 탭 독립 작업 모드(Standalone) 감지 상태 변수
  const [isStandalone, setIsStandalone] = React.useState<boolean>(false);
  
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsStandalone(params.get("standalone") === "true");
    }
  }, []);

  // DB 관련 핵심 상태 변수
  const [tables, setTables] = React.useState<any[]>([]);
  const [selectedTable, setSelectedTable] = React.useState<string>("");
  const [tableSchema, setTableSchema] = React.useState<ColumnSchema[]>([]);
  const [tableDDL, setTableDDL] = React.useState<string>("");
  const [tableRows, setTableRows] = React.useState<any[]>([]);
  const [totalRows, setTotalRows] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const itemsPerPage = 50;

  // 탭 제어 ('data' | 'schema' | 'console' | 'chart' | 'shared')
  const [activeTab, setActiveTab] = React.useState<'data' | 'schema' | 'console' | 'chart' | 'shared'>('data');

  // 검색/필터 필드
  const [searchKey, setSearchKey] = React.useState<string>("");
  const [searchValue, setSearchValue] = React.useState<string>("");
  const [debouncedSearchValue, setDebouncedSearchValue] = React.useState<string>("");
  
  // 테이블명 검색 필터 상태
  const [tableSearchQuery, setTableSearchQuery] = React.useState<string>("");

  // SQL 콘솔 상태
  const [sqlQuery, setSqlQuery] = React.useState<string>("SELECT * FROM crm_expenses LIMIT 10;");
  const [consoleResult, setConsoleResult] = React.useState<ConsoleResult | null>(null);
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
  const [tuneHistory, setTuneHistory] = React.useState<TuneMessage[]>([]);
  const [selectedChartPart, setSelectedChartPart] = React.useState<string>("");
  const [attachedImage, setAttachedImage] = React.useState<string>(""); // Base64 이미지 데이터

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

  const triggerAIVisualization = async (rows: any[], queryStr: string) => {
    if (!rows || rows.length === 0) return;

    setIsVisualizing(true);
    setAiChartSpec(null);
    setAiBriefing(null);
    setInitialSnapshot(null); // 최초 스냅샷 초기화

    try {
      const fromMatch = queryStr.match(/FROM\s+["']?([a-zA-Z0-9_-]+)["']?/i);
      const tableName = fromMatch ? fromMatch[1] : (selectedTable || 'raw_query');
      
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

    const rows = consoleResult?.rows || tableRows;
    if (!rows || rows.length === 0) {
      showToast("튜닝을 수행할 차트 데이터가 존재하지 않습니다.", "warn");
      return;
    }

    const attachedImgStr = attachedImage;
    const targetPart = selectedChartPart;

    setPreviousSnapshot({
      chartSpec: aiChartSpec,
      briefing: aiBriefing,
      tuneHistory: [...tuneHistory]
    });

    setTunePrompt("");
    setAttachedImage("");
    setSelectedChartPart("");

    const userMsg: TuneMessage = {
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

        const aiMsg: TuneMessage = {
          role: 'ai' as const,
          text: data.briefing || "최고관리자님의 튜닝 요구사항을 차트에 정밀 반영했습니다.",
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };

        if (data.newSkillLearned) {
          const skillMsg: TuneMessage = {
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
        const errMsg: TuneMessage = {
          role: 'system' as const,
          text: `❌ 튜닝 반영 실패: ${data.error || '알 수 없는 오류'}`,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };
        setTuneHistory(prev => [...prev, errMsg]);
        showToast(data.error || "피드백 조정에 실패했습니다.", "error");
      }
    } catch (err: any) {
      const errMsg: TuneMessage = {
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

  const handleResetChat = () => {
    if (confirm("최고관리자님, AI 챗봇과의 대화 내용을 모두 초기화하고\n차트와 브리핑도 AI가 최초 추천했던 원본 상태로 완전히 되돌리시겠습니까?")) {
      setTuneHistory([]);
      setSelectedChartPart("");
      setAttachedImage("");
      setPreviousSnapshot(null);
      
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

  const handleResetAllPlayground = () => {
    if (confirm("최고관리자님, 대화형 SQL 플레이그라운드 입력값, SQL 실행 결과, AI 지능형 시각화 차트 및 챗봇 대화 등 모든 작업을 최초 대기 상태로 초기화하시겠습니까?")) {
      setSqlQuery("SELECT * FROM crm_expenses LIMIT 10;");
      setConsoleResult(null);
      setSafetyUnlocked(false);
      setConsoleTab('ai');
      setAiPrompt("");
      setAiGeneratedSql("");
      
      setAiChartSpec(null);
      setAiBriefing(null);
      setIsVisualizing(false);
      setTunePrompt("");
      setTuneHistory([]);
      setSelectedChartPart("");
      setAttachedImage("");
      setPreviousSnapshot(null);
      setInitialSnapshot(null);
      
      setSearchKey("");
      setSearchValue("");
      setActiveTab('data');

      if (typeof window !== "undefined") {
        localStorage.removeItem("egdesk_mydb_sqlQuery");
        localStorage.removeItem("egdesk_mydb_consoleResult");
        localStorage.removeItem("egdesk_mydb_safetyUnlocked");
        localStorage.removeItem("egdesk_mydb_consoleTab");
        localStorage.removeItem("egdesk_mydb_aiPrompt");
        localStorage.removeItem("egdesk_mydb_aiGeneratedSql");
        localStorage.removeItem("egdesk_mydb_aiChartSpec");
        localStorage.removeItem("egdesk_mydb_aiBriefing");
        localStorage.removeItem("egdesk_mydb_tuneHistory");
        localStorage.removeItem("egdesk_mydb_selectedChartPart");
        localStorage.removeItem("egdesk_mydb_previousSnapshot");
        localStorage.removeItem("egdesk_mydb_initialSnapshot");
        localStorage.removeItem("egdesk_mydb_activeTab");
        localStorage.removeItem("egdesk_mydb_searchKey");
        localStorage.removeItem("egdesk_mydb_searchValue");
      }

      showToast("✓ 대화형 SQL 플레이그라운드, 실행 결과, AI 시각화 등 모든 데이터가 완벽히 초기화되었습니다.", "success");
    }
  };

  const handleUndoTuning = () => {
    if (!previousSnapshot) return;

    if (confirm("최고관리자님, 직전 피드백 전송 전의 차트 상태와 대화 이력으로 되돌리시겠습니까?")) {
      setAiChartSpec(previousSnapshot.chartSpec);
      setAiBriefing(previousSnapshot.briefing);
      setTuneHistory(previousSnapshot.tuneHistory);

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

      setPreviousSnapshot(null);
      showToast("✓ 성공적으로 직전 튜닝 이전의 상태로 되돌렸습니다!", "success");
    }
  };

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

  // 👥 데이터 공유 테이블 뷰 관련 상태 변수
  const [isFriendlyShareModalOpen, setIsFriendlyShareModalOpen] = React.useState<boolean>(false);
  const [friendlyShareTableName, setFriendlyShareTableName] = React.useState<string>("");
  const [friendlyColumnMappings, setFriendlyColumnMappings] = React.useState<FriendlyMapping[]>([]);
  const [friendlySortColumn, setFriendlySortColumn] = React.useState<string>("");
  const [friendlySortDirection, setFriendlySortDirection] = React.useState<string>("DESC");
  const [friendlyAllowCsv, setFriendlyAllowCsv] = React.useState<boolean>(true);
  const [generatedFriendlyShareUrl, setGeneratedFriendlyShareUrl] = React.useState<string>("");
  const [isFriendlySharing, setIsFriendlySharing] = React.useState<boolean>(false);
  const [isFriendlyRecommendLoading, setIsFriendlyRecommendLoading] = React.useState<boolean>(false);

  // 👥 임직원 친화형 공유 테이블 뷰 모달 오픈 핸들러
  const handleOpenFriendlyShareModal = () => {
    if (!selectedTable) return;
    
    // 테이블의 기본 표시 한글명 힌트 결정
    let displayName = selectedTable;
    if (selectedTable === 'crm_expenses') displayName = '지출 장부 관리';
    else if (selectedTable === 'crm_operators') displayName = '운영자 권한 관리';
    else if (selectedTable === 'crm_customers') displayName = '고객 명단 관리';
    else if (selectedTable === 'crm_partners') displayName = '거래처 정보 관리';
    else if (selectedTable === 'crm_estimates') displayName = '견적서 관리';
    else if (selectedTable === 'crm_orders') displayName = '주문 내역 관리';
    else if (selectedTable === 'products') displayName = '광고 상품 관리';
    else if (selectedTable === 'expense_projects') displayName = '지출 프로젝트 관리';
    else if (selectedTable === 'crm_instagram_posts') displayName = '인스타그램 포스트 관리';
    else if (selectedTable === 'crm_naver_blog_posts') displayName = '네이버 블로그 포스트 관리';
    else if (selectedTable === 'crm_partner_contacts') displayName = '거래처 담당자 명함첩';
    else if (selectedTable === 'crm_payments') displayName = '결제 내역 관리';
    else if (selectedTable === 'crm_point_history') displayName = '포인트 이용 내역';
    else if (selectedTable === 'crm_purchase_orders') displayName = '구매 발주서 관리';
    else if (selectedTable === 'crm_reservations') displayName = '예약 현황 관리';

    setFriendlyShareTableName(displayName);
    
    // 테이블 스키마로부터 컬럼 맵핑 초기화
    const initialMappings: FriendlyMapping[] = tableSchema.map(col => {
      let friendly = col.name;
      if (col.name === 'id') friendly = '일련번호';
      else if (col.name === 'created_at') friendly = '생성일시';
      else if (col.name === 'updated_at') friendly = '수정일시';
      else if (col.name === 'deleted_at') friendly = '삭제일시';
      else if (col.name === 'created_by') friendly = '생성자';
      else if (col.name === 'updated_by') friendly = '수정자';
      else if (col.name === 'deleted_by') friendly = '삭제자';
      else if (col.name === 'amount') friendly = '금액';
      else if (col.name === 'name') friendly = '이름';
      else if (col.name === 'phone') friendly = '연락처';
      else if (col.name === 'email') friendly = '이메일';
      else if (col.name === 'status') friendly = '상태';

      const isSensitive = ['password', 'pwd', 'token', 'deleted_at', 'deleted_by', 'secret', 'key'].includes(col.name.toLowerCase());

      return {
        physical: col.name,
        friendly,
        visible: !isSensitive,
        sortOrder: 0,
        sortDirection: 'NONE' as const
      };
    });

    setFriendlyColumnMappings(initialMappings);
    
    if (tableSchema.length > 0) {
      setFriendlySortColumn(tableSchema[0].name);
    } else {
      setFriendlySortColumn("");
    }
    setFriendlySortDirection("DESC");
    setFriendlyAllowCsv(true);
    setGeneratedFriendlyShareUrl("");
    setFriendlyShareTableName(displayName);
    setIsFriendlyShareModalOpen(true);
    fetchAIRecommendations(selectedTable, tableSchema);
  };

  // 👥 AI 기반 데이터 공유 뷰 설정 자동 추천 및 동기화 기동
  const fetchAIRecommendations = async (tableName: string, schema: ColumnSchema[]) => {
    if (!tableName || !schema || schema.length === 0) return;
    setIsFriendlyRecommendLoading(true);
    try {
      const res = await fetch('/api/shared-views/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tableName, tableSchema: schema })
      });
      const data = await res.json();
      if (data.success) {
        if (data.friendlyTableName) {
          setFriendlyShareTableName(data.friendlyTableName);
        }
        if (data.columnMappings && Array.isArray(data.columnMappings)) {
          setFriendlyColumnMappings(data.columnMappings);
        }
        showToast("🤖 AI 지능형 엔진이 최적의 공유 뷰 명세와 보안 마스킹 가이드를 자동 완성해 드렸습니다!", "success");
      } else {
        showToast(data.error || "AI 자동 추천 도중 에러가 발생하여 기본 설정으로 대체합니다.", "warn");
      }
    } catch (e) {
      console.error(e);
      showToast("네트워크 장애로 AI 자동 완성을 완료하지 못했습니다.", "warn");
    } finally {
      setIsFriendlyRecommendLoading(false);
    }
  };

  // 👥 데이터 공유 뷰 등록 API 호출 핸들러
  const handleCreateFriendlyShare = async () => {
    if (!selectedTable || !friendlyShareTableName) {
      showToast("테이블 명칭이 올바르지 않습니다.", "error");
      return;
    }

    setIsFriendlySharing(true);
    try {
      const response = await fetch('/api/shared-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceTable: selectedTable,
          friendlyTableName: friendlyShareTableName,
          columnMappings: friendlyColumnMappings,
          defaultSortColumn: friendlySortColumn,
          defaultSortDirection: friendlySortDirection,
          allowCsvDownload: friendlyAllowCsv
        })
      });

      const data = await response.json();
      if (data.success) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const shareUrl = `${origin}/shared/view/${data.shareHash}`;
        setGeneratedFriendlyShareUrl(shareUrl);
        showToast("공유 뷰가 성공적으로 발행되었습니다!", "success");
        fetchSharedViews(); // 🌐 공유 뷰 목록 새로고침
      } else {
        showToast(data.error || "공유 뷰 생성에 실패했습니다.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setIsFriendlySharing(false);
    }
  };

  // 🌐 데이터 공유 뷰 목록 관리 상태
  const [sharedViewsList, setSharedViewsList] = React.useState<any[]>([]);
  const [isSharedViewsLoading, setIsSharedViewsLoading] = React.useState<boolean>(false);

  // 🌐 데이터 공유 뷰 목록 로드
  const fetchSharedViews = async () => {
    setIsSharedViewsLoading(true);
    try {
      const res = await fetch('/api/shared-views');
      const data = await res.json();
      if (data.success) {
        setSharedViewsList(data.sharedViews || []);
      } else {
        showToast(data.error || "공유 뷰 목록 조회에 실패했습니다.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("네트워크 장애로 공유 뷰 목록을 가져오지 못했습니다.", "warn");
    } finally {
      setIsSharedViewsLoading(false);
    }
  };

  // 🌐 특정 데이터 공유 뷰 폐쇄(삭제)
  const handleDeleteSharedView = async (viewId: string, friendlyName: string) => {
    if (!confirm(`정말로 데이터 공유 뷰 '${friendlyName}' (ID: ${viewId})를 폐쇄하시겠습니까?\n폐쇄 시 기존 공유 링크를 통한 데이터 접근이 즉시 차단됩니다.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/shared-views?viewId=${viewId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "공유 뷰가 폐쇄되었습니다.", "success");
        fetchSharedViews(); // 목록 새로고침
      } else {
        showToast(data.error || "공유 뷰 폐쇄에 실패했습니다.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("네트워크 장애로 공유 뷰를 폐쇄하지 못했습니다.", "error");
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
      if (val) {
        url += `&searchValue=${encodeURIComponent(val)}`;
        if (key) {
          url += `&searchKey=${encodeURIComponent(key)}`;
        }
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

  // 💾 상태 실시간 로컬스토리지 보존
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

  // 🔍 실시간 검색 디바운스 제어 (300ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchValue]);

  // 🗑️ 소프트 삭제 토글, 검색 컬럼, 디바운스된 검색어 변경 시 자동 조회
  React.useEffect(() => {
    if (selectedTable) {
      setCurrentPage(1);
      fetchTableRows(selectedTable, 1, searchKey, debouncedSearchValue, showDeleted);
    }
  }, [showDeleted, searchKey, debouncedSearchValue]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTableRows(selectedTable, page, searchKey, debouncedSearchValue, showDeleted);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setDebouncedSearchValue(searchValue);
  };

  // 💡 AI 자연어 SQL 번역기 기동
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
        
        if (data.rows && data.rows.length > 0) {
          triggerAIVisualization(data.rows, sqlQuery);
        }

        fetchTables();
        if (selectedTable) {
          fetchTableSchema(selectedTable);
          fetchTableRows(selectedTable, currentPage, searchKey, debouncedSearchValue);
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

  // 6. 데이터 개별 행 물리 삭제
  const handleDeleteRow = async (row: any) => {
    if (!selectedTable) return;
    
    const pkColumn = tableSchema.find(col => col.pk === 1)?.name || 'id';
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
        fetchTableRows(selectedTable, currentPage, searchKey, debouncedSearchValue, showDeleted);
      } else {
        showToast(data.error || "레코드 삭제 실패", "error");
      }
    } catch (e) {
      showToast("삭제 프로세스 통신 실패", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 6-2. 소프트 삭제된 레코드 안전 복구
  const handleRestoreRow = async (row: any) => {
    if (!selectedTable) return;
    
    const pkColumn = tableSchema.find(col => col.pk === 1)?.name || 'id';
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
        fetchTableRows(selectedTable, currentPage, searchKey, debouncedSearchValue, showDeleted);
      } else {
        showToast(data.error || "레코드 복원 실패", "error");
      }
    } catch (e) {
      showToast("복구 프로세스 통신 실패", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 7. 행 추가/수정 저장 액션
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
        res = await fetch("/api/db", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tableName: selectedTable, rows: [rowPayload] })
        });
      } else {
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
        fetchTableRows(selectedTable, currentPage, searchKey, debouncedSearchValue, showDeleted);
      } else {
        showToast(data.error || "레코드 적재 실패", "error");
      }
    } catch (e) {
      showToast("데이터베이스 적재 통신 실패", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 8. 엑셀 원클릭 로컬 백업 내보내기 (Excel Export)
  const handleExportExcel = async () => {
    if (tableRows.length === 0) {
      showToast("내보낼 데이터가 존재하지 않습니다.", "warn");
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const headers = Object.keys(tableRows[0]);
      const aoaData = [headers];

      tableRows.forEach(row => {
        const rowData = headers.map(key => {
          const val = row[key];
          if (val === null || val === undefined) return "";
          
          const valStr = String(val);
          const keyLower = key.toLowerCase();
          
          const isIdentifierKey = keyLower.includes("number") || 
                                  keyLower.includes("card") || 
                                  keyLower.includes("account") || 
                                  keyLower.includes("phone") || 
                                  keyLower.includes("tel") || 
                                  keyLower.includes("appr") || 
                                  keyLower.includes("serial") ||
                                  keyLower.includes("id");

          if ((isIdentifierKey && /^\d+$/.test(valStr) && valStr.length > 5) || (/^\d+$/.test(valStr) && valStr.length >= 9)) {
            return `'${valStr}`;
          }
          return val;
        });
        aoaData.push(rowData);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, selectedTable ? selectedTable.substring(0, 31) : 'DB_Export');
      XLSX.writeFile(workbook, `EGDESK_EXPORT_${selectedTable || 'data'}_${new Date().toISOString().slice(0,10)}.xlsx`);
      
      showToast("엑셀 파일이 로컬로 안전하게 다운로드되었습니다.", "success");
    } catch (e: any) {
      showToast("내보내기 연산 중 오류가 생겼습니다: " + e.message, "error");
    }
  };

  // 9. 전체 데이터 동기화 액션
  const handleSyncAll = async () => {
    setIsLoading(true);
    showToast("물리 데이터베이스 실시간 전체 동기화 중...", "success");
    try {
      await fetchTables();
      if (selectedTable) {
        await fetchTableSchema(selectedTable);
        await fetchTableRows(selectedTable, currentPage, searchKey, debouncedSearchValue, showDeleted);
      }
      showToast("전체 데이터 동기화가 성공적으로 완료되었습니다.", "success");
    } catch (e) {
      showToast("데이터 동기화 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;

  // 🖥️ 독립 화면 모드 감지 시, StandaloneView 컴포넌트 렌더링
  if (isStandalone) {
    return (
      <StandaloneView
        tables={tables}
        selectedTable={selectedTable}
        sqlQuery={sqlQuery}
        tableRows={tableRows}
        consoleResult={consoleResult}
        aiChartSpec={aiChartSpec}
        setAiChartSpec={setAiChartSpec}
        aiBriefing={aiBriefing}
        setAiBriefing={setAiBriefing}
        tunePrompt={tunePrompt}
        setTunePrompt={setTunePrompt}
        tuneHistory={tuneHistory}
        setTuneHistory={setTuneHistory}
        selectedChartPart={selectedChartPart}
        setSelectedChartPart={setSelectedChartPart}
        attachedImage={attachedImage}
        setAttachedImage={setAttachedImage}
        isVisualizing={isVisualizing}
        setIsVisualizing={setIsVisualizing}
        initialSnapshot={initialSnapshot}
        previousSnapshot={previousSnapshot}
        toast={toast}
        showToast={showToast}
        setIsShareModalOpen={setIsShareModalOpen}
        setShareTitle={setShareTitle}
        setShareInterval={setShareInterval}
        setGeneratedShareUrl={setGeneratedShareUrl}
        handleTuneChart={handleTuneChart}
        handleResetToOriginal={handleResetToOriginal}
        handleUndoTuning={handleUndoTuning}
        handleResetChat={handleResetChat}
      />
    );
  }

  return (
    <div className="space-y-6 pb-20 bg-slate-50/30 p-2 rounded-3xl text-left">
      
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

      {/* 🚀 상단 헤더 섹션 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 select-none">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
          <Database className="w-8 h-8 mr-3 text-blue-500 shrink-0" />
          MY DB
        </h1>
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleResetAllPlayground}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-650 hover:text-rose-700 rounded-xl text-xs font-black shadow-3xs border border-rose-200 cursor-pointer transition-all active:scale-95 shrink-0"
            title="대화형 SQL 플레이그라운드, 결과 및 차트 등 모든 작업 상태를 최초 대기 상태로 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            전체 작업 초기화
          </button>

          <button
            onClick={handleSyncAll}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-blue-655 hover:bg-blue-600 text-white rounded-xl text-xs font-black shadow-3xs border-none cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
            title="서버 데이터베이스 테이블 개수 및 레코드 실시간 동기화"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${isLoading ? 'animate-spin' : ''}`} />
            전체 데이터 동기화
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* 📁 좌측 영역: 테이블 스캐너 리스트 */}
        <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 overflow-hidden flex flex-col">
          <h2 className="font-extrabold text-slate-800 text-base pb-3.5 border-b border-slate-100 flex items-center gap-2 mb-3 shrink-0">
            <Table className="w-4.5 h-4.5 text-blue-500" />
            물리 테이블 ({
              tables.filter(t => {
                const query = tableSearchQuery.toLowerCase();
                return t.name.toLowerCase().includes(query) || (t.displayName && t.displayName.toLowerCase().includes(query));
              }).length
            }/{tables.length})
          </h2>

          {/* 🔍 테이블 검색바 */}
          <div className="relative mb-3.5 shrink-0">
            <input
              type="text"
              placeholder="테이블명 또는 한글명 검색..."
              value={tableSearchQuery}
              onChange={(e) => setTableSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-705 placeholder-slate-400 border border-slate-250 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 rounded-xl outline-none transition-all font-semibold"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            {tableSearchQuery && (
              <button
                onClick={() => setTableSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-655 rounded-full border-none bg-transparent cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="space-y-1.5 max-h-[850px] overflow-y-auto no-scrollbar">
            {tables.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">
                테이블이 탐색되지 않았습니다.
              </div>
            ) : tables.filter(t => {
              const query = tableSearchQuery.toLowerCase();
              return t.name.toLowerCase().includes(query) || (t.displayName && t.displayName.toLowerCase().includes(query));
            }).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">
                검색 결과가 없습니다.
              </div>
            ) : (
              tables
                .filter(t => {
                  const query = tableSearchQuery.toLowerCase();
                  return t.name.toLowerCase().includes(query) || (t.displayName && t.displayName.toLowerCase().includes(query));
                })
                .map(t => (
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
                        : 'bg-slate-100 text-slate-400 border-slate-200/60'
                    }`}>
                      {t.count}
                    </span>
                  </button>
                ))
            )}
          </div>
        </div>

        {/* 🛠️ 우측 영역: 커스텀 SQL 콘솔 + 제어 탭 */}
        <div className="xl:col-span-3 space-y-6">

          {/* 💻 대화형 커스텀 SQL 콘솔 패널 */}
          <SqlConsolePlayground
            tables={tables}
            selectedTable={selectedTable}
            sqlQuery={sqlQuery}
            setSqlQuery={setSqlQuery}
            consoleTab={consoleTab}
            setConsoleTab={setConsoleTab}
            safetyUnlocked={safetyUnlocked}
            setSafetyUnlocked={setSafetyUnlocked}
            aiPrompt={aiPrompt}
            setAiPrompt={setAiPrompt}
            isAiLoading={isAiLoading}
            setIsAiLoading={setIsAiLoading}
            aiGeneratedSql={aiGeneratedSql}
            setAiGeneratedSql={setAiGeneratedSql}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setConsoleResult={setConsoleResult}
            setActiveTab={setActiveTab}
            triggerAIVisualization={triggerAIVisualization}
            handleExecuteSQL={handleExecuteSQL}
            handleTranslateSQL={handleTranslateSQL}
            showToast={showToast}
          />

          {/* 🏷️ 데이터 탭 헤더 및 뷰어 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            
            {/* 상단 탭 2단 도구막대 */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                
                <div className="flex items-center bg-slate-200/50 rounded-xl p-0.5 border border-slate-200/70 shrink-0">
                  <button
                    onClick={() => setActiveTab('data')}
                    className={`px-4 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 border-none cursor-pointer ${
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
                    className={`px-4 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 border-none cursor-pointer ${
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
                    className={`px-4 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      activeTab === 'console' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 bg-transparent'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 inline mr-1" />
                    SQL 실행 결과
                  </button>

                  {consoleResult && consoleResult.success && consoleResult.rows && consoleResult.rows.length > 0 && (
                    <button
                      onClick={() => setActiveTab('chart')}
                      className={`px-4 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 border-none cursor-pointer ${
                        activeTab === 'chart' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 bg-transparent'
                      }`}
                    >
                      <BarChart className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />
                      📊 AI 지능형 시각화 & 브리핑
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveTab('shared');
                      fetchSharedViews();
                    }}
                    className={`px-4 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 border-none cursor-pointer ${
                      activeTab === 'shared' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 bg-transparent'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5 inline mr-1 text-teal-505" />
                    🌐 공유 뷰 관리
                  </button>
                </div>

                {activeTab === 'data' && selectedTable && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleExportExcel}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold shadow-3xs cursor-pointer transition-colors"
                      title="엑셀 포맷으로 데이터 백업"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Excel 백업
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
                            className="text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 text-slate-705 outline-none w-48 focus:border-blue-500 shadow-3xs"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold cursor-pointer border border-slate-800"
                        >
                          검색
                        </button>
                        {(searchKey || searchValue) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchKey("");
                              setSearchValue("");
                              setDebouncedSearchValue("");
                            }}
                            className="px-2 py-1 text-slate-400 hover:text-slate-655 text-xs font-bold border-none bg-transparent cursor-pointer"
                          >
                            초기화
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleOpenFriendlyShareModal}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100/50 hover:from-indigo-100 hover:to-indigo-150 border border-indigo-200/80 text-indigo-650 rounded-xl text-xs font-black shadow-3xs cursor-pointer transition-all active:scale-95"
                        title="데이터 공유 테이블 뷰 생성"
                      >
                        <Link className="w-3.5 h-3.5 text-indigo-550" />
                        데이터 공유 뷰 생성
                      </button>

                      {tableSchema.some(col => col.name === 'deleted_at') && (
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
                      )}
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto w-full border border-slate-100 rounded-xl max-h-[500px]">
                  {tableRows.length === 0 ? (
                    <div className="p-16 text-center text-xs text-slate-400 font-semibold">
                      레코드 데이터가 비어있거나 검색 결과와 일치하는 내역이 없습니다.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse bg-white">
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
                                  : 'border-slate-50 hover:bg-slate-50/50 text-slate-650'
                              }`}
                            >
                              {Object.entries(row).map(([key, val], cIdx) => (
                                <td key={cIdx} className="p-4 max-w-[250px] truncate" title={val !== null ? String(val) : "NULL"}>
                                  {val === null ? (
                                    <span className="text-[10px] text-slate-300 italic select-none">NULL</span>
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
                                      className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-black border-none cursor-pointer flex items-center gap-0.5 shadow-3xs transition-all active:scale-95"
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
                                        className="p-1 text-slate-450 hover:text-blue-655 hover:bg-slate-50 rounded border-none bg-transparent cursor-pointer transition-colors"
                                        title="레코드 인라인 편집"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteRow(row)}
                                        className="p-1 text-slate-455 hover:text-rose-655 hover:bg-slate-50 rounded border-none bg-transparent cursor-pointer transition-colors"
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

                {/* 하단 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 rounded-xl">
                    <span className="text-xs text-slate-400 font-semibold">
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
                              : 'border bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
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
              <SchemaTab tableDDL={tableDDL} tableSchema={tableSchema} />
            )}

            {/* 탭 콘텐트 영역 3: SQL 콘솔 실행 로그 및 결과 테이블 */}
            {activeTab === 'console' && consoleResult && (
              <SqlConsoleResult consoleResult={consoleResult} />
            )}

            {/* 탭 콘텐트 영역 4: AI 지능형 시각화 & 비즈니스 브리핑 통합 뷰 */}
            {activeTab === 'chart' && consoleResult && consoleResult.success && consoleResult.rows && (
              <DataBriefingTab
                sqlQuery={sqlQuery}
                selectedTable={selectedTable}
                tables={tables}
                tableRows={tableRows}
                consoleResult={consoleResult}
                aiChartSpec={aiChartSpec}
                setAiChartSpec={setAiChartSpec}
                aiBriefing={aiBriefing}
                setAiBriefing={setAiBriefing}
                tunePrompt={tunePrompt}
                setTunePrompt={setTunePrompt}
                tuneHistory={tuneHistory}
                setTuneHistory={setTuneHistory}
                selectedChartPart={selectedChartPart}
                setSelectedChartPart={setSelectedChartPart}
                attachedImage={attachedImage}
                setAttachedImage={setAttachedImage}
                isVisualizing={isVisualizing}
                setIsVisualizing={setIsVisualizing}
                initialSnapshot={initialSnapshot}
                previousSnapshot={previousSnapshot}
                showToast={showToast}
                setIsShareModalOpen={setIsShareModalOpen}
                setShareTitle={setShareTitle}
                setShareInterval={setShareInterval}
                setGeneratedShareUrl={setGeneratedShareUrl}
                handleTuneChart={handleTuneChart}
                handleResetToOriginal={handleResetToOriginal}
                handleUndoTuning={handleUndoTuning}
                handleResetChat={handleResetChat}
              />
            )}

            {/* 탭 콘텐트 영역 5: 데이터 공유 뷰 목록 관리 그리드 */}
            {activeTab === 'shared' && (
              <SharedDashboardsTab
                sharedViewsList={sharedViewsList}
                isSharedViewsLoading={isSharedViewsLoading}
                fetchSharedViews={fetchSharedViews}
                handleDeleteSharedView={handleDeleteSharedView}
                showToast={showToast}
              />
            )}
          </div>
        </div>
      </div>

      {/* 📁 레코드 삽입/수정용 모달 (INSERT / UPDATE Modal) */}
      {isRowModalOpen && selectedTable && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-zoom-in text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-850 text-sm flex items-center gap-1.5">
                <Database className="w-4.5 h-4.5 text-blue-500" />
                {editingRow ? `✏️ [${selectedTable}] 행 데이터 편집 (UPDATE)` : `📥 [${selectedTable}] 신규 레코드 삽입 (INSERT)`}
              </h3>
              <button 
                onClick={() => {
                  setIsRowModalOpen(false);
                  setEditingRow(null);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-655 rounded-full border-none bg-transparent cursor-pointer transition-colors animate-fade-in"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRow} className="flex flex-col">
              <div className="p-6 max-h-[480px] overflow-y-auto no-scrollbar space-y-4 text-slate-700 bg-white text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tableSchema.map(col => {
                    const isPK = col.pk === 1;
                    const value = editingRow ? editingRow[col.name] : "";
                    
                    return (
                      <div key={col.name} className="space-y-1">
                        <label className="text-[11px] font-black text-slate-400 flex items-center gap-1">
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
                          disabled={isPK && !editingRow}
                          required={col.notnull === 1 && (!isPK || editingRow)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs text-slate-705 transition-all placeholder:text-slate-350 shadow-3xs disabled:bg-slate-50 disabled:text-slate-400 font-semibold"
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-505 text-white rounded-xl text-xs font-black shadow-sm border-none cursor-pointer disabled:opacity-50"
                >
                  {editingRow ? "데이터 갱신 (UPDATE)" : "레코드 삽입 (INSERT)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌐 퍼블릭 웹 게시 및 자동 실시간 갱신용 모달 */}
      <PublicShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        generatedShareUrl={generatedShareUrl}
        setGeneratedShareUrl={setGeneratedShareUrl}
        shareTitle={shareTitle}
        setShareTitle={setShareTitle}
        shareInterval={shareInterval}
        setShareInterval={setShareInterval}
        isSharing={isSharing}
        handleCreateShare={handleCreateShare}
        showToast={showToast}
      />

      {/* 👥 임직원 친화형 공유 테이블 뷰 생성 모달 */}
      <FriendlyShareModal
        isOpen={isFriendlyShareModalOpen}
        onClose={() => setIsFriendlyShareModalOpen(false)}
        selectedTable={selectedTable}
        tableSchema={tableSchema}
        tableRows={tableRows}
        generatedFriendlyShareUrl={generatedFriendlyShareUrl}
        setGeneratedFriendlyShareUrl={setGeneratedFriendlyShareUrl}
        friendlyShareTableName={friendlyShareTableName}
        setFriendlyShareTableName={setFriendlyShareTableName}
        friendlyAllowCsv={friendlyAllowCsv}
        setFriendlyAllowCsv={setFriendlyAllowCsv}
        friendlyColumnMappings={friendlyColumnMappings}
        setFriendlyColumnMappings={setFriendlyColumnMappings}
        friendlySortColumn={friendlySortColumn}
        setFriendlySortColumn={setFriendlySortColumn}
        friendlySortDirection={friendlySortDirection}
        setFriendlySortDirection={setFriendlySortDirection}
        isFriendlyRecommendLoading={isFriendlyRecommendLoading}
        isFriendlySharing={isFriendlySharing}
        fetchAIRecommendations={fetchAIRecommendations}
        handleCreateFriendlyShare={handleCreateFriendlyShare}
        showToast={showToast}
      />

    </div>
  );
}
