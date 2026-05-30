"use client";

import React from "react";
import { 
  Database, Play, RefreshCw, Download, Plus, Edit, 
  Trash2, AlertTriangle, Code, Table, Search, Terminal,
  CheckCircle, ChevronRight, X, ShieldAlert
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 font-sans">
      
      {/* 🛎️ 알림 토스트 컴포넌트 */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-950/90 text-emerald-350 border-emerald-500/20' :
          toast.type === 'error' ? 'bg-rose-950/90 text-rose-350 border-rose-500/20' :
          'bg-amber-950/90 text-amber-350 border-amber-500/20'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
          {toast.type === 'error' && <ShieldAlert className="w-5 h-5 text-rose-400" />}
          {toast.type === 'warn' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* 🚀 상단 헤더 섹션 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-indigo-300">
                EGDESK 물리 DB 실시간 관제 센터
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">최고관리자(SUPER_ADMIN) 물리 데이터베이스 샌드박스 엔진</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchTables} 
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl text-xs font-black cursor-pointer select-none transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            DB 테이블 스캔
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* 📁 좌측 영역: 테이블 스캐너 리스트 */}
        <div className="xl:col-span-1 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
          <h2 className="text-sm font-black text-slate-300 mb-4 flex items-center gap-2 pb-3 border-b border-slate-850">
            <Table className="w-4 h-4 text-blue-400" />
            물리 테이블 목록 ({tables.length}개)
          </h2>
          
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto no-scrollbar">
            {tables.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-600 font-bold">
                테이블이 탐색되지 않았습니다.
              </div>
            ) : (
              tables.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTable(t.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer group ${
                    selectedTable === t.name
                      ? 'bg-blue-600/10 border-blue-500 text-blue-200'
                      : 'bg-slate-900/30 border-slate-800/80 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Database className={`w-3.5 h-3.5 shrink-0 ${selectedTable === t.name ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-black truncate">{t.name}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border group-hover:scale-105 transition-all ${
                    selectedTable === t.name
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700/60'
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
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-black text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                대화형 SQL 플레이그라운드
              </h2>
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={safetyUnlocked}
                    onChange={(e) => setSafetyUnlocked(e.target.checked)}
                    className="rounded border-slate-700 text-rose-600 bg-slate-950 focus:ring-rose-500/20 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-rose-400/90 flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" />
                    안전장치 잠금 해제
                  </span>
                </label>
              </div>
            </div>

            {/* SQL 에디터 영역 */}
            <div className="relative mb-3.5">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="여기에 실행할 커스텀 SQL 쿼리를 기입하십시오. (예: SELECT * FROM crm_expenses;)"
                className="w-full h-32 pl-4 pr-4 py-3 bg-slate-950/80 border border-slate-800 text-slate-200 font-mono text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
              />
            </div>

            {/* 템플릿 프리셋 및 실행 버튼 */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-bold mr-1">프리셋:</span>
                {SQL_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSqlQuery(preset.query)}
                    className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-[9px] font-bold border border-slate-800 cursor-pointer select-none transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExecuteSQL}
                disabled={isLoading}
                className="flex items-center gap-1 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/10 border-none cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                SQL 실행 (Ctrl+Enter)
              </button>
            </div>
          </div>

          {/* 🏷️ 데이터 탭 헤더 */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4 mb-5">
              
              {/* 탭 버튼들 */}
              <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-850 w-fit shrink-0">
                <button
                  onClick={() => setActiveTab('data')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'data'
                      ? 'bg-slate-850 text-blue-400 shadow-md border-none'
                      : 'text-slate-500 hover:text-slate-350 border-none bg-transparent'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  원시 레코드 데이터 ({totalRows}개)
                </button>
                
                <button
                  onClick={() => setActiveTab('schema')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'schema'
                      ? 'bg-slate-850 text-indigo-400 shadow-md border-none'
                      : 'text-slate-500 hover:text-slate-350 border-none bg-transparent'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  테이블 스키마 DDL
                </button>

                <button
                  onClick={() => setActiveTab('console')}
                  disabled={!consoleResult}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    activeTab === 'console'
                      ? 'bg-slate-850 text-emerald-400 shadow-md border-none'
                      : 'text-slate-500 hover:text-slate-350 border-none bg-transparent'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  SQL 실행 로그
                </button>
              </div>

              {/* 탭 우측 도구 모음 (현재 선택된 탭이 data인 경우만) */}
              {activeTab === 'data' && selectedTable && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                    title="CSV 포맷으로 데이터 백업"
                  >
                    <Download className="w-3 h-3" />
                    CSV 백업
                  </button>
                  <button
                    onClick={() => {
                      setEditingRow(null);
                      setIsRowModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black border-none cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    행 삽입 (INSERT)
                  </button>
                </div>
              )}
            </div>

            {/* 탭 콘텐트 영역 1: 레코드 데이터 표 뷰어 */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                
                {/* 데이터 필터 폼 */}
                {selectedTable && (
                  <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-500 px-1 shrink-0">
                      <Search className="w-3 h-3 text-slate-500" />
                      실시간 검색 필터:
                    </div>
                    <select
                      value={searchKey}
                      onChange={e => setSearchKey(e.target.value)}
                      className="text-[10px] font-bold outline-none bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300"
                    >
                      <option value="">-- 검색 컬럼 선택 --</option>
                      {tableSchema.map(col => (
                        <option key={col.name} value={col.name}>{col.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="검색어 입력..."
                      value={searchValue}
                      onChange={e => setSearchValue(e.target.value)}
                      className="text-[10px] bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 outline-none w-48 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-black text-slate-300 cursor-pointer"
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
                        className="px-2 py-1 text-slate-500 hover:text-slate-350 text-[10px] font-bold border-none bg-transparent cursor-pointer"
                      >
                        초기화
                      </button>
                    )}
                  </form>
                )}

                {/* 그리드 표 렌더러 */}
                <div className="overflow-x-auto w-full border border-slate-850 rounded-xl bg-slate-950/20 max-h-[500px]">
                  {tableRows.length === 0 ? (
                    <div className="p-16 text-center text-xs text-slate-650 font-semibold">
                      레코드 데이터가 비어있거나 조건에 매칭되는 결과가 없습니다.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-850">
                        <tr>
                          {Object.keys(tableRows[0]).map(key => (
                            <th key={key} className="p-3 border-r border-slate-900 font-bold min-w-[120px] whitespace-nowrap">
                              {key}
                              {tableSchema.find(c => c.name === key)?.pk === 1 && (
                                <span className="ml-1 text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 rounded">PK</span>
                              )}
                            </th>
                          ))}
                          <th className="p-3 text-center w-20 sticky right-0 bg-slate-900">제어</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-900/50 hover:bg-slate-900/20 transition-all font-mono text-[11px] text-slate-300">
                            {Object.entries(row).map(([key, val], cIdx) => (
                              <td key={cIdx} className="p-3 border-r border-slate-950 max-w-[250px] truncate" title={val !== null ? String(val) : "NULL"}>
                                {val === null ? (
                                  <span className="text-[10px] text-slate-700 italic select-none">NULL</span>
                                ) : typeof val === 'object' ? (
                                  JSON.stringify(val)
                                ) : (
                                  String(val)
                                )}
                              </td>
                            ))}
                            <td className="p-3 text-center sticky right-0 bg-slate-900/90 backdrop-blur-xs" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingRow(row);
                                    setIsRowModalOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-850 rounded border-none bg-transparent cursor-pointer"
                                  title="레코드 인라인 편집"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRow(row)}
                                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-850 rounded border-none bg-transparent cursor-pointer"
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

                {/* 하단 페이지네이션 피드 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-slate-950 p-4 border border-slate-850 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500">
                      총 {totalRows}행 중 {Math.min(totalRows, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(totalRows, currentPage * itemsPerPage)} 표시
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 disabled:opacity-40 text-slate-300 text-[10px] font-bold rounded border border-slate-800 cursor-pointer"
                      >
                        이전
                      </button>
                      <span className="text-[10px] font-bold text-slate-400 px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 disabled:opacity-40 text-slate-300 text-[10px] font-bold rounded border border-slate-800 cursor-pointer"
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
              <div className="space-y-6 animate-fade-in">
                {/* 1. DDL 생성 쿼리 */}
                <div>
                  <h3 className="text-xs font-black text-slate-400 mb-2 flex items-center gap-1">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    CREATE TABLE DDL (생성 구문)
                  </h3>
                  <pre className="p-4 bg-slate-950 border border-slate-850 text-indigo-300 font-mono text-xs rounded-xl overflow-x-auto select-all leading-relaxed shadow-inner max-h-60">
                    {tableDDL || "-- DDL 정보가 조회되지 않았습니다."}
                  </pre>
                </div>

                {/* 2. 컬럼 구조 테이블 */}
                <div>
                  <h3 className="text-xs font-black text-slate-400 mb-2 flex items-center gap-1">
                    <Table className="w-3.5 h-3.5 text-blue-400" />
                    데이터베이스 컬럼 상세 구조
                  </h3>
                  <div className="overflow-x-auto w-full border border-slate-850 rounded-xl bg-slate-950/40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-850">
                        <tr>
                          <th className="p-3 border-r border-slate-900">CID</th>
                          <th className="p-3 border-r border-slate-900">컬럼명 (Name)</th>
                          <th className="p-3 border-r border-slate-900">데이터 타입 (Type)</th>
                          <th className="p-3 border-r border-slate-900">Null 허용 여부</th>
                          <th className="p-3 border-r border-slate-900">기본값 (Default)</th>
                          <th className="p-3">기본키 (PK)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableSchema.map((col, idx) => (
                          <tr key={idx} className="border-b border-slate-900/50 hover:bg-slate-900/10 font-mono text-[11px] text-slate-350">
                            <td className="p-3 border-r border-slate-950 text-slate-500">{col.cid}</td>
                            <td className="p-3 border-r border-slate-950 text-slate-200 font-black">{col.name}</td>
                            <td className="p-3 border-r border-slate-950 text-indigo-400">{col.type}</td>
                            <td className="p-3 border-r border-slate-950">
                              {col.notnull === 1 || col.notnull === true ? (
                                <span className="text-[10px] text-rose-400 font-bold">NOT NULL</span>
                              ) : (
                                <span className="text-[10px] text-slate-600">NULL OK</span>
                              )}
                            </td>
                            <td className="p-3 border-r border-slate-950 text-slate-500">
                              {col.dflt_value !== null ? String(col.dflt_value) : "-"}
                            </td>
                            <td className="p-3">
                              {col.pk === 1 || col.pk === true ? (
                                <span className="inline-flex px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black rounded">
                                  Primary Key
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
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
              <div className="space-y-4 animate-fade-in">
                {consoleResult.success ? (
                  <div className="space-y-4">
                    {/* 성공 헤더 피드 */}
                    <div className="p-3.5 bg-emerald-950/20 text-emerald-400 border border-emerald-500/10 rounded-xl flex items-center gap-2 text-xs font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      성공: 쿼리가 데이터베이스 컴파일러를 통과하여 완수되었습니다. 
                      {consoleResult.affectedRows !== null && ` (영향받은 행: ${consoleResult.affectedRows}개)`}
                      {consoleResult.lastInsertRowid !== null && ` (생성된 ID: ${consoleResult.lastInsertRowid})`}
                    </div>

                    {/* 결과 레코드 표 */}
                    {consoleResult.rows && consoleResult.rows.length > 0 ? (
                      <div className="overflow-x-auto w-full border border-slate-850 rounded-xl bg-slate-950/40 max-h-[400px]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-900 text-slate-450 font-bold border-b border-slate-850">
                            <tr>
                              {Object.keys(consoleResult.rows[0]).map(key => (
                                <th key={key} className="p-3 border-r border-slate-900 font-bold whitespace-nowrap">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {consoleResult.rows.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-900/50 hover:bg-slate-900/20 transition-all font-mono text-[11px] text-slate-350">
                                {Object.values(row).map((val: any, cIdx) => (
                                  <td key={cIdx} className="p-3 border-r border-slate-950 max-w-[250px] truncate" title={val !== null ? String(val) : "NULL"}>
                                    {val === null ? (
                                      <span className="text-[10px] text-slate-700 italic select-none">NULL</span>
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
                      <div className="p-10 text-center text-xs text-slate-500 italic font-bold">
                        SELECT 결과 세트가 비어있거나, 데이터를 변경하는 쿼리입니다.
                      </div>
                    )}
                  </div>
                ) : (
                  /* 실패 정보 피드 */
                  <div className="p-4 bg-rose-950/20 text-rose-400 border border-rose-500/10 rounded-xl flex items-start gap-2.5 text-xs font-mono leading-relaxed">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-300 mb-1">SQL Compilation/Execution Failed:</div>
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <h3 className="text-sm font-black text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-400" />
                {editingRow ? `✏️ [${selectedTable}] 행 데이터 편집(UPDATE)` : `📥 [${selectedTable}] 신규 레코드 삽입(INSERT)`}
              </h3>
              <button 
                onClick={() => {
                  setIsRowModalOpen(false);
                  setEditingRow(null);
                }}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRow} className="flex flex-col">
              <div className="p-6 max-h-[500px] overflow-y-auto no-scrollbar space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tableSchema.map(col => {
                    const isPK = col.pk === 1 || col.pk === true;
                    const value = editingRow ? editingRow[col.name] : "";
                    
                    return (
                      <div key={col.name} className="space-y-1">
                        <label className="text-[11px] font-black text-slate-400 flex items-center gap-1">
                          {col.name}
                          <span className="text-[9px] text-indigo-400 font-bold font-mono">({col.type})</span>
                          {isPK && <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1 border border-amber-500/20 rounded">PK</span>}
                          {col.notnull === 1 && <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1 border border-rose-500/20 rounded">필수</span>}
                        </label>
                        <input
                          type="text"
                          name={col.name}
                          defaultValue={value !== null ? String(value) : ""}
                          placeholder={isPK && !editingRow ? "(자동 시퀀스 ID)" : `${col.name} 값 기입...`}
                          disabled={isPK && !editingRow} // 신규 삽입 시 PK가 자동 생성 번호면 잠금
                          required={col.notnull === 1 && (!isPK || editingRow)} // 필수 컬럼 가드
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs text-slate-200 transition-all placeholder:text-slate-650"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRowModalOpen(false);
                    setEditingRow(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 border border-slate-700 rounded-xl text-xs font-black cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/10 border-none cursor-pointer disabled:opacity-50"
                >
                  {editingRow ? "데이터 갱신(UPDATE)" : "레코드 삽입(INSERT)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
