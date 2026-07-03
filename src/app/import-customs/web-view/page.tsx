"use client";

import React, { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sun, Moon, RefreshCw, X, Download, ArrowUp, ArrowDown, ChevronUp, ChevronDown, Check, Eye } from "lucide-react";
import { createPortal } from "react-dom";

// 수입 통관 대장 컬럼 및 디폴트 노출 정의
const HEADERS = [
  "등록일시", "주문번호(SO#)", "PO번호(PO#)", "인보이스번호", "발주일자", "선적일자", "인보이스일자",
  "송장번호(AWB)", "배송사", "인도조건", "결제조건", "수출자",
  "품목코드", "품명", "수량", "단가", "금액", "통화", "HS코드", "원산지", "LOT번호", "제조일자",
  "정산총액", "결제마감일", "결제상태", "결제일자", "송금은행", "송금계좌", "SWIFT코드"
];

const DEFAULT_VISIBLE = [
  "등록일시", "주문번호(SO#)", "PO번호(PO#)", "인보이스번호", "수출자",
  "품목코드", "품명", "수량", "단가", "금액", "통화", "정산총액", "결제마감일", "결제상태"
];

function CustomsWebViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const so_number_filter = searchParams.get("so_number");

  const [data, setData] = useState<{
    title: string;
    headers: string[];
    rows: any[][];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isColSelectorOpen, setIsColSelectorOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 컬럼 선택 드롭다운용 React Portal 팝업 좌표 상태
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 256 + window.scrollX
      });
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isColSelectorOpen) {
      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
    }
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [isColSelectorOpen]);

  // 실시간 API 데이터 로드 및 플랫 행 변환
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. 목록 조회 API 호출 (전체 조회를 위해 충분히 큰 리밋)
      const res = await fetch(`/api/import-customs?limit=100000&_t=${Date.now()}`);
      const json = await res.json();
      
      if (json.success && json.rows) {
        let rawRows = json.rows;

        // 특정 so_number 필터가 쿼리 파라미터로 존재 시 걸러줌 (콤마 다중 필터 지원)
        if (so_number_filter) {
          const filterIds = so_number_filter.split(",").map(id => id.trim()).filter(Boolean);
          if (filterIds.length > 0) {
            rawRows = rawRows.filter((r: any) => filterIds.includes(r.so_number));
          }
        }

        // 삼중 조인된 개별 레코드를 웹뷰 규격 2차원 배열 행으로 가공
        const processedRows = rawRows.map((r: any) => [
          r.created_at || "-",                            // 등록일시
          r.so_number || "-",                              // 주문번호(SO#)
          r.po_number || "-",                              // PO번호(PO#)
          r.invoice_number || "-",                       // 인보이스번호
          r.order_date || "-",                           // 발주일자
          r.ship_date || "-",                            // 선적일자
          r.invoice_date || "-",                         // 인보이스일자
          r.air_waybill_nbr || "-",                      // 송장번호(AWB)
          r.ship_via || "-",                             // 배송사
          r.terms_of_sale || "-",                        // 인도조건
          r.payment_terms || "-",                        // 결제조건
          r.exporter_name || "-",                        // 수출자
          r.part_number || "-",                          // 품목코드
          r.description || "-",                          // 품명
          r.quantity !== undefined ? r.quantity : "",    // 수량
          r.unit_price !== undefined ? r.unit_price : "", // 단가
          r.amount !== undefined ? r.amount : "",        // 금액
          r.currency || "USD",                           // 통화
          r.hs_code || "-",                              // HS코드
          r.country_of_origin || "-",                    // 원산지
          r.lot_number || "-",                           // LOT번호
          r.mfg_date || "-",                             // 제조일자
          r.total_invoice_value !== undefined ? r.total_invoice_value : "", // 정산총액
          r.payment_due_date || "-",                     // 결제마감일
          Number(r.is_paid) === 1 ? "지급완료" : "미송금", // 결제상태
          r.paid_date || "-",                            // 결제일자
          r.bank_name || "-",                            // 송금은행
          r.account_number || "-",                       // 송금계좌
          r.swift_code || "-"                            // SWIFT코드
        ]);

        setData({
          title: "수입 통관 상세 내역",
          headers: HEADERS,
          rows: processedRows
        });

        // 로컬스토리지에서 컬럼 순서 및 숨김 설정 확인
        if (typeof window !== "undefined") {
          const savedColumns = localStorage.getItem("egdesk_customs_webview_cols");
          const savedVisible = localStorage.getItem("egdesk_customs_webview_visible");

          if (savedColumns && savedVisible) {
            try {
              const parsedCols = JSON.parse(savedColumns) as string[];
              const parsedVisible = JSON.parse(savedVisible) as string[];
              const filteredCols = parsedCols.filter(c => HEADERS.includes(c));
              const missingCols = HEADERS.filter(c => !filteredCols.includes(c));
              setColumns([...filteredCols, ...missingCols]);
              setVisibleColumns(parsedVisible.filter(c => HEADERS.includes(c)));
            } catch {
              setColumns(HEADERS);
              setVisibleColumns(DEFAULT_VISIBLE);
            }
          } else {
            setColumns(HEADERS);
            setVisibleColumns(DEFAULT_VISIBLE);
          }
        } else {
          setColumns(HEADERS);
          setVisibleColumns(DEFAULT_VISIBLE);
        }
      } else {
        setError(json.error || "수입 통관 데이터를 정상적으로 수신하지 못했습니다.");
      }
    } catch (e: any) {
      console.error("수입 통관 대장 fetch 실패:", e);
      setError(e.message || "서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const regDateIdx = HEADERS.indexOf("등록일시");
    if (regDateIdx !== -1) {
      setSortKey(regDateIdx);
      setSortDir("desc");
    }
    fetchData();
  }, [so_number_filter]);

  // 검색 필터링
  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data.rows;
    
    const term = search.toLowerCase();
    return data.rows.filter((row) =>
      row.some((val) => String(val).toLowerCase().includes(term))
    );
  }, [data, search]);

  // 정렬 필터링
  const sortedRows = useMemo(() => {
    if (sortKey === null) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      // 숫자 변환 가능 여부에 따라 정렬
      const numA = Number(String(valA).replace(/[,원개$]/g, ""));
      const numB = Number(String(valB).replace(/[,원개$]/g, ""));
      
      if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {
        return sortDir === "asc" ? numA - numB : numB - numA;
      }

      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [filteredRows, sortKey, sortDir]);

  // 페이징
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;

  const handleSort = (index: number) => {
    if (sortKey === index) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(index);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  // CSV 다운로드 (현재 표시 상태에 맞추어 다운로드)
  const handleExportCsv = () => {
    if (!data) return;

    const activeHeaders = columns.filter((h) => visibleColumns.includes(h));
    const headerIndices = activeHeaders.map((h) => data.headers.indexOf(h));

    const activeRows = data.rows.map((row) =>
      headerIndices.map((idx) => (idx !== -1 ? row[idx] : ""))
    );

    const csvContent =
      "\ufeff" +
      [
        activeHeaders.join(","),
        ...activeRows.map((r) =>
          r.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${data.title}_웹뷰내보내기.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveColumnSettings = (newCols: string[], newVisible: string[]) => {
    setColumns(newCols);
    setVisibleColumns(newVisible);
    if (typeof window !== "undefined") {
      localStorage.setItem("egdesk_customs_webview_cols", JSON.stringify(newCols));
      localStorage.setItem("egdesk_customs_webview_visible", JSON.stringify(newVisible));
    }
  };

  const toggleColumn = (colName: string) => {
    const nextVisible = visibleColumns.includes(colName)
      ? visibleColumns.filter((c) => c !== colName)
      : [...visibleColumns, colName];
    saveColumnSettings(columns, nextVisible);
  };

  const toggleAllColumns = () => {
    if (!data) return;
    const nextVisible = visibleColumns.length === data.headers.length
      ? [data.headers[0]]
      : [...data.headers];
    saveColumnSettings(columns, nextVisible);
  };

  const moveColumn = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === columns.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newColumns = [...columns];
    const temp = newColumns[index];
    newColumns[index] = newColumns[targetIndex];
    newColumns[targetIndex] = temp;
    saveColumnSettings(newColumns, visibleColumns);
  };

  const resetToDefaultColumns = () => {
    saveColumnSettings(HEADERS, DEFAULT_VISIBLE);
    const regDateIdx = HEADERS.indexOf("등록일시");
    if (regDateIdx !== -1) {
      setSortKey(regDateIdx);
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir("desc");
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-350' : 'bg-slate-50 text-slate-655'} flex flex-col items-center justify-center font-sans p-6 transition-colors duration-300`}>
        <div className="w-16 h-16 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-black tracking-wide text-indigo-555 animate-pulse">실시간 수입 통관 대장을 조회 중입니다...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-rose-400' : 'bg-slate-50 text-rose-650'} flex flex-col items-center justify-center font-sans p-6 text-center transition-colors duration-300`}>
        <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" style={{ animationPlayState: 'paused' }}></div>
        <h3 className="text-sm font-black text-slate-800 mb-2">데이터 조회 실패</h3>
        <p className="text-xs text-slate-500 max-w-sm mb-6">{error || "불러온 수입 통관 데이터가 유효하지 않습니다."}</p>
        <button
          onClick={fetchData}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-2xl shadow-lg transition-all cursor-pointer"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? "bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-slate-100" 
        : "bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/30 text-slate-800"
    } font-sans p-3 md:p-5 transition-colors duration-300 relative overflow-x-hidden w-full`}>
      
      {/* 럭셔리 네온 광원 */}
      <div className={`absolute top-10 left-10 w-80 h-80 ${isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-400/5'} rounded-full blur-3xl -z-10 animate-pulse`}></div>
      <div className={`absolute bottom-10 right-10 w-96 h-96 ${isDarkMode ? 'bg-purple-600/5' : 'bg-purple-400/5'} rounded-full blur-3xl -z-10`}></div>

      <div className="w-full space-y-4">
        
        {/* 1. 상단 타이틀 및 기능 제어 바 */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDarkMode 
            ? "bg-slate-900/90 border-white/10 shadow-2xl shadow-slate-950/50" 
            : "bg-white border-slate-200 shadow-xl shadow-slate-100/50"
        } border p-5 rounded-3xl transition-all duration-300`}>
          <div>
            <span className={`${
              isDarkMode 
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" 
                : "bg-indigo-50/80 text-indigo-655 border-indigo-200"
            } border text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase`}>
              ERP Customs Realtime WebView
            </span>
            <h1 className={`text-xl font-black ${
              isDarkMode 
                ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-300" 
                : "text-slate-800"
            } mt-1.5`}>
              {data.title}
            </h1>
            <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-0.5 font-medium`}>
              실시간 DB 연계 조회 중 ➔ 총 <span className="text-indigo-650 font-bold">{sortedRows.length}</span>개의 품목별 내역이 적재되어 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 새로고침 */}
            <button
              onClick={fetchData}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                isDarkMode 
                  ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
              }`}
              title="데이터 새로고침"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>

            {/* 다크/라이트모드 */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isDarkMode 
                  ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
              }`}
            >
              {isDarkMode ? (
                <>
                  <Sun size={14} className="text-amber-400 animate-pulse" />
                  <span>라이트모드</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-indigo-600" />
                  <span>다크모드</span>
                </>
              )}
            </button>

            {/* CSV 다운로드 */}
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>CSV 내보내기</span>
            </button>
          </div>
        </div>

        {/* 2. 실시간 검색 및 칼럼 표시 필터 */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isDarkMode 
            ? "bg-slate-900/90 border-white/10 shadow-2xl shadow-slate-950/50" 
            : "bg-white border-slate-200 shadow-xl shadow-slate-100/50"
        } border p-4 rounded-3xl transition-all duration-300 relative z-30`}>
          <div className="flex flex-1 items-center max-w-md w-full">
            <input
              type="text"
              placeholder="검색어를 입력해 주세요 (주문번호, 수출자, 품명 등 대장 실시간 검색)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full px-3.5 py-2.5 border rounded-2xl text-[11px] font-bold shadow-inner outline-none transition-all ${
                isDarkMode 
                  ? "bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500/80" 
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500/70"
              }`}
            />
          </div>

          <div className="flex items-center gap-3 justify-end relative">
            {/* 컬럼 숨기기/보이기 */}
            <div className="relative z-40">
              <button
                ref={buttonRef}
                onClick={() => setIsColSelectorOpen(!isColSelectorOpen)}
                className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isColSelectorOpen
                    ? "bg-indigo-650 border-indigo-700 text-white shadow-md"
                    : isDarkMode
                    ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                }`}
              >
                <span>칼럼 표시 설정</span>
                <ChevronDown size={14} className={`transform transition-transform ${isColSelectorOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Portal을 통한 컬럼 선택 팝오버 렌더링 */}
              {isColSelectorOpen && mounted && createPortal(
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-[9998]" onClick={() => setIsColSelectorOpen(false)} />
                  <div
                    style={{
                      position: "absolute",
                      top: coords.top,
                      left: Math.max(10, coords.left),
                      width: "256px"
                    }}
                    className={`max-h-[380px] overflow-y-auto ${
                      isDarkMode 
                        ? "bg-slate-900 border-white/10 text-slate-200 shadow-slate-950/80 shadow-2xl" 
                        : "bg-white border-slate-200 text-slate-750 shadow-slate-250/50 shadow-2xl"
                    } border rounded-3xl p-4 z-[9999] scrollbar-thin flex flex-col font-sans`}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">칼럼 편집</span>
                      <button onClick={resetToDefaultColumns} className="text-[10px] font-bold text-slate-500 hover:text-indigo-400">기본값 복원</button>
                    </div>

                    <label className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 cursor-pointer text-xs font-bold mb-2">
                      <input
                        type="checkbox"
                        checked={visibleColumns.length === data.headers.length}
                        onChange={toggleAllColumns}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>전체 선택 / 해제</span>
                    </label>

                    <div className="space-y-1 overflow-y-auto pr-1 flex-1">
                      {columns.map((colName, index) => {
                        const isVisible = visibleColumns.includes(colName);
                        return (
                          <div
                            key={colName}
                            className={`flex items-center justify-between p-1.5 rounded-xl transition-all ${
                              isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-50"
                            }`}
                          >
                            <label className="flex items-center gap-2 cursor-pointer flex-1 text-[11px] font-bold">
                              <input
                                type="checkbox"
                                checked={isVisible}
                                onChange={() => toggleColumn(colName)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className={isVisible ? "font-black" : "text-slate-500 font-medium"}>{colName}</span>
                            </label>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveColumn(index, "up")}
                                disabled={index === 0}
                                className="p-0.5 hover:bg-white/10 rounded disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <ChevronUp size={11} />
                              </button>
                              <button
                                onClick={() => moveColumn(index, "down")}
                                disabled={index === columns.length - 1}
                                className="p-0.5 hover:bg-white/10 rounded disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <ChevronDown size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>
        </div>

        {/* 3. 대장 메인 표 테이블 */}
        <div className={`overflow-x-auto border ${
          isDarkMode 
            ? "bg-slate-900/40 border-white/5 shadow-2xl rounded-3xl" 
            : "bg-white border-slate-200/80 shadow-lg rounded-3xl"
        } transition-all duration-300 relative z-10 w-full`}>
          <div className="min-w-full inline-block align-middle overflow-hidden">
            <table className="min-w-full divide-y divide-white/5 border-collapse text-left">
              <thead>
                <tr className={isDarkMode ? "bg-white/5" : "bg-slate-50/80"}>
                  {columns.map((colName) => {
                    const isVisible = visibleColumns.includes(colName);
                    if (!isVisible) return null;
                    const colIndex = data.headers.indexOf(colName);
                    const isSorted = sortKey === colIndex;

                    return (
                      <th
                        key={colName}
                        onClick={() => handleSort(colIndex)}
                        className={`px-4 py-3.5 text-[10px] font-black tracking-wider uppercase cursor-pointer select-none transition-all ${
                          isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{colName}</span>
                          <span className="opacity-70">
                            {isSorted ? (sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : "⇅"}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-white/5" : "divide-slate-100"}`}>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length} className="text-center py-12 text-xs font-bold text-slate-500">
                      검색 조건에 부합하는 수입 통관 내역이 존재하지 않습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`transition-colors duration-150 ${
                        isDarkMode 
                          ? "hover:bg-indigo-900/10 hover:text-white" 
                          : "hover:bg-indigo-50/20"
                      }`}
                    >
                      {columns.map((colName) => {
                        const isVisible = visibleColumns.includes(colName);
                        if (!isVisible) return null;
                        const colIndex = data.headers.indexOf(colName);
                        const rawVal = row[colIndex];

                        // 특정 컬럼 데이터의 미려한 시각화 포맷팅
                        let renderedVal = String(rawVal);
                        let badgeStyle = "";

                        if (colName === "결제상태") {
                          badgeStyle = rawVal === "지급완료" 
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" 
                            : "bg-rose-500/15 text-rose-400 border-rose-500/25";
                        } else if (colName === "결제조건" || colName === "인도조건") {
                          badgeStyle = isDarkMode
                            ? "bg-slate-800/80 text-slate-300 border-slate-700"
                            : "bg-slate-100 text-slate-655 border-slate-200";
                        }

                        // 수량 및 가격 천단위 쉼표 포맷팅
                        if ((colName === "수량" || colName === "단가" || colName === "금액" || colName === "정산총액") && !isNaN(Number(rawVal))) {
                          renderedVal = Number(rawVal).toLocaleString();
                        }

                        return (
                          <td
                            key={colName}
                            className={`px-4 py-3 text-xs font-bold border-l border-white/5 first:border-l-0 ${
                              isDarkMode ? "text-slate-300" : "text-slate-650"
                            }`}
                          >
                            {badgeStyle ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-black leading-4 ${badgeStyle}`}>
                                {renderedVal}
                              </span>
                            ) : (
                              <span>{renderedVal}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. 하단 페이지네이션 컨트롤 바 */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDarkMode 
            ? "bg-slate-900/90 border-white/10 shadow-2xl shadow-slate-950/50" 
            : "bg-white border-slate-200 shadow-xl shadow-slate-100/50"
        } border p-4 rounded-3xl transition-all duration-300 text-xs font-bold relative z-10 w-full`}>
          <div className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-1.5`}>
            <span>총 {sortedRows.length}개의 행 중</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded-xl border outline-none font-bold text-xs ${
                isDarkMode ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              {[15, 30, 50, 100].map((size) => (
                <option key={size} value={size}>{size}개씩 보기</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all ${
                isDarkMode 
                  ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
              }`}
            >
              이전
            </button>
            <span className={isDarkMode ? "text-slate-400 font-black" : "text-slate-550 font-black"}>
              {currentPage} / {totalPages} 페이지
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all ${
                isDarkMode 
                  ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
              }`}
            >
              다음
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CustomsWebViewPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-650 mb-3" />
        <span className="text-xs font-black">수입 통관 상세 내역 불러오는 중...</span>
      </div>
    }>
      <CustomsWebViewContent />
    </Suspense>
  );
}
