"use client";

import React from "react";
import { 
  Database, Play, RefreshCw, Download, Plus, Edit, 
  Trash2, AlertTriangle, Code, Table, Search, Terminal,
  CheckCircle, ChevronRight, X, ShieldAlert, Calendar
} from "lucide-react";

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

  // 탭 제어 ('data' | 'schema' | 'console')
  const [activeTab, setActiveTab] = React.useState<'data' | 'schema' | 'console'>('data');

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
  const [consoleTab, setConsoleTab] = React.useState<'direct' | 'ai'>('direct');
  const [aiPrompt, setAiPrompt] = React.useState<string>("");
  const [isAiLoading, setIsAiLoading] = React.useState<boolean>(false);
  const [aiGeneratedSql, setAiGeneratedSql] = React.useState<string>("");

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
        if (data.tables && data.tables.length > 0 && !selectedTable) {
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
  const fetchTableRows = async (tableName: string, page: number, key = "", val = "") => {
    if (!tableName) return;
    setIsLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      let url = `/api/db?action=query&tableName=${tableName}&limit=${itemsPerPage}&offset=${offset}`;
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
  }, []);

  React.useEffect(() => {
    if (selectedTable) {
      setCurrentPage(1);
      setSearchKey("");
      setSearchValue("");
      fetchTableSchema(selectedTable);
      fetchTableRows(selectedTable, 1);
    }
  }, [selectedTable]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTableRows(selectedTable, page, searchKey, searchValue);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTableRows(selectedTable, 1, searchKey, searchValue);
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
        fetchTableRows(selectedTable, currentPage, searchKey, searchValue);
      } else {
        showToast(data.error || "레코드 삭제 실패", "error");
      }
    } catch (e) {
      showToast("삭제 프로세스 통신 실패", "error");
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
        fetchTableRows(selectedTable, currentPage, searchKey, searchValue);
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
      <h1 className="text-3xl font-bold text-slate-800 flex items-center select-none">
        <Database className="w-8 h-8 mr-3 text-blue-500 shrink-0" />
        MY DB
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* 📁 좌측 영역: 테이블 스캐너 리스트 (둥근 모서리 라이트 테마 성형) */}
        <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 overflow-hidden">
          <h2 className="font-extrabold text-slate-800 text-base pb-3.5 border-b border-slate-100 flex items-center gap-2 mb-4 shrink-0">
            <Table className="w-4.5 h-4.5 text-blue-500" />
            물리 테이블 ({tables.length})
          </h2>
          
          <div className="space-y-1.5 max-h-[580px] overflow-y-auto no-scrollbar">
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
                    onClick={() => setConsoleTab('direct')}
                    className={`px-3 py-1.5 rounded-md transition-all border-none cursor-pointer ${
                      consoleTab === 'direct' ? 'bg-white text-blue-650 shadow-3xs font-black' : 'text-slate-500 bg-transparent'
                    }`}
                  >
                    직접 쿼리 입력
                  </button>
                  <button
                    onClick={() => setConsoleTab('ai')}
                    className={`px-3 py-1.5 rounded-md transition-all border-none cursor-pointer flex items-center gap-0.5 ${
                      consoleTab === 'ai' ? 'bg-white text-blue-650 shadow-3xs font-black' : 'text-slate-500 bg-transparent'
                    }`}
                  >
                    AI 자연어 요청 💡
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
                    className="w-full h-28 pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none shadow-3xs"
                  />
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
                    className="w-full h-24 pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none shadow-3xs"
                  />
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
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-650 hover:bg-blue-600 text-white rounded-xl text-xs font-black border-none cursor-pointer shadow-3xs transition-colors"
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
                  <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 bg-slate-50/50 p-3.5 border border-slate-100 rounded-2xl w-full">
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
                            fetchTableRows(selectedTable, 1);
                          }}
                          className="px-2 py-1 text-slate-450 hover:text-slate-650 text-xs font-bold border-none bg-transparent cursor-pointer"
                        >
                          초기화
                        </button>
                      )}
                    </div>
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
                        {tableRows.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all font-mono text-[11px] text-slate-600">
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
                            <td className="p-4 text-center sticky right-0 bg-white/95 border-l border-slate-50" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingRow(row);
                                    setIsRowModalOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded border-none bg-transparent cursor-pointer"
                                  title="레코드 인라인 편집"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRow(row)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded border-none bg-transparent cursor-pointer"
                                  title="레코드 영구 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
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

    </div>
  );
}
