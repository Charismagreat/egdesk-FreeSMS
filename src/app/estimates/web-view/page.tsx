"use client";

import React, { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Sun, Moon, Eye, RefreshCw, X, Download } from "lucide-react";
import { createPortal } from "react-dom";

// B2B 대장 정보 타입 설정 및 디폴트 노출 컬럼 정의
const typeConfig = {
  inbound_est: {
    title: "받은 B2B 견적 및 요청 대장 내역",
    headers: [
      "견적번호", "공급/요청처", "연락처", "담당자명", "총 견적액", "상태", "AI스캔여부", "작성일",
      "첨부파일", "사업자등록증", "연계발주번호", "품목코드", "품목명", "규격", "수량", "단가", "금액", "품목납기일", "상세비고"
    ],
    defaultVisible: [
      "견적번호", "공급/요청처", "연락처", "총 견적액", "상태", "작성일", "품목명", "수량", "단가", "금액", "상세비고"
    ]
  },
  inbound_po: {
    title: "발주 및 실물 검수 대장 내역",
    headers: [
      "발주등록번호/발주번호", "견적번호", "공급처명", "연락처", "총 발주액", "상태", "발주일시",
      "입고완료일시", "원본 파일", "품목코드", "품목명", "규격", "수량", "단가", "금액", "품목납기일", "상세비고"
    ],
    defaultVisible: [
      "발주등록번호/발주번호", "견적번호", "공급처명", "연락처", "총 발주액", "상태", "발주일시", "원본 파일", "품목명", "수량", "단가", "금액", "상세비고"
    ]
  },
  outbound_est: {
    title: "보낸 견적서 관리 대장 내역",
    headers: [
      "견적번호", "수신바이어", "연락처", "담당자명", "총 견적액", "상태", "작성일",
      "첨부파일", "연계수주번호", "품목코드", "품목명", "규격", "수량", "단가", "금액", "품목납기일", "상세비고"
    ],
    defaultVisible: [
      "견적번호", "수신바이어", "연락처", "총 견적액", "상태", "작성일", "품목명", "수량", "단가", "금액", "상세비고"
    ]
  },
  outbound_so: {
    title: "수주 및 바이어 계약 대장 내역",
    headers: [
      "수주번호", "견적번호", "고객발주번호", "바이어명", "연락처", "바이어담당자", "총 수주액", "상태", "수주일시",
      "마스터납기일", "원본 파일", "품목코드", "품목명", "규격", "수량", "단가", "금액", "품목납기일", "상세비고"
    ],
    defaultVisible: [
      "수주번호", "견적번호", "바이어명", "연락처", "총 수주액", "상태", "수주일시", "원본 파일", "품목명", "수량", "단가", "금액", "상세비고"
    ]
  }
};

function WebViewContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") || "inbound_est";
  const type: "inbound_est" | "inbound_po" | "outbound_est" | "outbound_so" = 
    ["inbound_est", "inbound_po", "outbound_est", "outbound_so"].includes(typeParam) 
      ? (typeParam as any) 
      : "inbound_est";

  const [data, setData] = useState<{
    title: string;
    headers: string[];
    rows: any[][];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [isColSelectorOpen, setIsColSelectorOpen] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // 1. 실시간 API 연동 및 데이터 패치
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = typeConfig[type].headers;
      const rows: any[] = [];
      const title = typeConfig[type].title;

      if (type === "inbound_est" || type === "outbound_est") {
        const res = await fetch("/api/estimates?action=list");
        const json = await res.json();
        if (json.success && json.estimates) {
          const estimatesList = json.estimates;
          const filtered = estimatesList.filter((e: any) => 
            type === "inbound_est" ? e.type === "INBOUND" : e.type === "OUTBOUND"
          );

          filtered.forEach((e: any) => {
            const estItems = e.items && e.items.length > 0 ? e.items : [{}];
            estItems.forEach((item: any) => {
              if (type === "inbound_est") {
                rows.push([
                  e.id,
                  e.partner_name,
                  e.partner_phone,
                  e.partner_manager || "-",
                  e.total_amount,
                  e.direction_status === "REQUESTED" ? "견적접수" : "발주완료",
                  e.ai_parsed ? "AI OCR" : "수동",
                  e.created_at,
                  e.file_url || "-",
                  e.business_license_url || "-",
                  e.purchase_order_number || "-",
                  item.item_code || "-",
                  item.product_name || "-",
                  item.spec || "-",
                  item.quantity !== undefined ? item.quantity : "",
                  item.unit_price !== undefined ? item.unit_price : "",
                  item.amount !== undefined ? item.amount : "",
                  item.delivery_date || "-",
                  e.document_memo_search || "-"
                ]);
              } else {
                rows.push([
                  e.id,
                  e.partner_name,
                  e.partner_phone,
                  e.partner_manager || "-",
                  e.total_amount,
                  e.direction_status === "SENT" ? "견적발송" : "수주수락",
                  e.created_at,
                  e.file_url || "-",
                  e.sales_order_number || "-",
                  item.item_code || "-",
                  item.product_name || "-",
                  item.spec || "-",
                  item.quantity !== undefined ? item.quantity : "",
                  item.unit_price !== undefined ? item.unit_price : "",
                  item.amount !== undefined ? item.amount : "",
                  item.delivery_date || "-",
                  e.document_memo_search || "-"
                ]);
              }
            });
          });
        }
      } else if (type === "inbound_po") {
        const res = await fetch("/api/estimates/process?action=po_list");
        const json = await res.json();
        if (json.success && json.purchaseOrders) {
          const purchaseOrders = json.purchaseOrders;
          purchaseOrders.forEach((p: any) => {
            const poItems = p.items && p.items.length > 0 ? p.items : [{}];
            poItems.forEach((item: any) => {
              rows.push([
                p.id,
                p.estimate_id,
                p.vendor_name,
                p.vendor_phone,
                p.total_amount,
                p.status === "PENDING_INBOUND" ? "발주완료" : "입고완료",
                p.created_at,
                p.completed_at || "-",
                p.file_url || "-",
                item.item_code || "-",
                item.product_name || "-",
                item.spec || "-",
                item.quantity !== undefined ? item.quantity : "",
                item.unit_price !== undefined ? item.unit_price : "",
                item.amount !== undefined ? item.amount : "",
                item.delivery_date || "-",
                p.document_memo_search || "-"
              ]);
            });
          });
        }
      } else if (type === "outbound_so") {
        const res = await fetch("/api/estimates/process?action=so_list");
        const json = await res.json();
        if (json.success && json.salesOrders) {
          const salesOrders = json.salesOrders;
          salesOrders.forEach((s: any) => {
            const soItems = s.items && s.items.length > 0 ? s.items : [{}];
            soItems.forEach((item: any) => {
              rows.push([
                s.id,
                s.estimate_id,
                s.client_order_no || "-",
                s.customer_name,
                s.customer_phone,
                s.customer_manager || "-",
                s.total_amount,
                s.status === "REGISTERED" ? "수주등록" : "확인완료",
                s.created_at,
                s.delivery_date || "-",
                s.file_url || "-",
                item.item_code || "-",
                item.product_name || "-",
                item.spec || "-",
                item.quantity !== undefined ? item.quantity : "",
                item.unit_price !== undefined ? item.unit_price : "",
                item.amount !== undefined ? item.amount : "",
                item.delivery_date || "-",
                s.document_memo_search || "-"
              ]);
            });
          });
        }
      }

      setData({ title, headers, rows });
      
      // 초기 컬럼 기본 노출 세팅 적용
      if (visibleColumns.length === 0) {
        setVisibleColumns(typeConfig[type].defaultVisible);
      }
    } catch (e) {
      console.error("데이터 실시간 fetch 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  // 2. 검색 및 필터링
  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data.rows;
    
    const term = search.toLowerCase();
    return data.rows.filter((row) =>
      row.some((val) => String(val).toLowerCase().includes(term))
    );
  }, [data, search]);

  // 3. 정렬 파이프라인
  const sortedRows = useMemo(() => {
    if (sortKey === null) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      // 숫자 변환 가능 시 숫자로 정렬
      const numA = Number(String(valA).replace(/[,원개]/g, ""));
      const numB = Number(String(valB).replace(/[,원개]/g, ""));
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === "asc" ? numA - numB : numB - numA;
      }

      // 문자열 정렬
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      return sortDir === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [filteredRows, sortKey, sortDir]);

  // 4. 페이지네이션 파이프라인
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;

  // 정렬 트리거
  const handleSort = (index: number) => {
    if (sortKey === index) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(index);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  // CSV 다운로드 (현재 표시된 컬럼과 데이터만 똑똑하게 추출하여 다운로드)
  const handleExportCsv = () => {
    if (!data) return;

    // visibleColumns 인덱스 매칭
    const headerIndices = data.headers
      .map((h, idx) => (visibleColumns.includes(h) ? idx : -1))
      .filter((idx) => idx !== -1);

    const activeHeaders = headerIndices.map((idx) => data.headers[idx]);
    const activeRows = data.rows.map((row) =>
      headerIndices.map((idx) => row[idx])
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

  // 컬럼 노출 개별 토글
  const toggleColumn = (colName: string) => {
    setVisibleColumns((prev) =>
      prev.includes(colName)
        ? prev.filter((c) => c !== colName)
        : [...prev, colName]
    );
  };

  // 컬럼 전체 선택 / 해제
  const toggleAllColumns = () => {
    if (!data) return;
    if (visibleColumns.length === data.headers.length) {
      // 전부 켜져 있으면 모두 해제 (단, 첫 번째 열인 ID는 보존)
      setVisibleColumns([data.headers[0]]);
    } else {
      // 모두 선택
      setVisibleColumns(data.headers);
    }
  };

  // 이미지/문서 원본 뷰어 뱃지 감지 헬퍼
  const detectFile = (str: string) => {
    const isUrl = str.startsWith("http://") || str.startsWith("https://") || str.includes("/uploads/");
    const isBase64 = str.startsWith("data:image/") || str.startsWith("data:application/pdf");
    return isUrl || isBase64;
  };

  if (loading || !data) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-350' : 'bg-slate-50 text-slate-600'} flex flex-col items-center justify-center font-sans p-6 transition-colors duration-300`}>
        <div className="w-16 h-16 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-black tracking-wide text-indigo-500 animate-pulse">실시간 데이터베이스를 조회 중입니다...</p>
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

      {/* 가로 공간 최대화를 위해 max-w-full 처리 */}
      <div className="w-full space-y-4">
        
        {/* 상단 헤더 패널 */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDarkMode 
            ? "bg-slate-900/90 border-white/10 shadow-2xl shadow-slate-950/50" 
            : "bg-white border-slate-200 shadow-xl shadow-slate-100/50"
        } border p-5 rounded-3xl transition-all duration-300`}>
          <div>
            <span className={`${
              isDarkMode 
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" 
                : "bg-indigo-50/80 text-indigo-650 border-indigo-200"
            } border text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase`}>
              B2B Realtime WebView
            </span>
            <h1 className={`text-xl font-black ${
              isDarkMode 
                ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-300" 
                : "text-slate-800"
            } mt-1.5`}>
              {data.title}
            </h1>
            <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-0.5 font-medium`}>
              실시간 DB 연계 조회 중 ➔ 총 <span className="text-indigo-600 font-bold">{sortedRows.length}</span>개의 상세 내역이 적재되어 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 실시간 패치 새로고침 단추 */}
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

            {/* 다크/라이트모드 토글 단추 */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isDarkMode 
                  ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white" 
                  : "bg-white border-slate-200 text-slate-705 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
              }`}
              title={isDarkMode ? "라이트모드로 전환" : "다크모드로 전환"}
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

            {/* CSV 내보내기 */}
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>CSV 내보내기</span>
            </button>
          </div>
        </div>

        {/* 필터, 검색 및 컬럼 표시설정 제어 영역 */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isDarkMode 
            ? "bg-slate-900/90 border-white/10 shadow-2xl shadow-slate-950/50" 
            : "bg-white border-slate-200 shadow-xl shadow-slate-100/50"
        } border p-4 rounded-3xl transition-all duration-300 relative z-30`}>
          <div className="flex flex-1 items-center max-w-md w-full">
            <input
              type="text"
              placeholder="검색어를 입력해 주세요 (전체 대장 실시간 검색)..."
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
            
            {/* 컬럼 숨기기/보이기 제어기 */}
            <div className="relative z-40">
              <button
                ref={buttonRef}
                onClick={() => setIsColSelectorOpen(!isColSelectorOpen)}
                className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isColSelectorOpen
                    ? "bg-indigo-600 border-indigo-650 text-white shadow-md"
                    : isDarkMode
                    ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                }`}
              >
                <Eye size={13} />
                <span>⚙️ 컬럼 표시 설정</span>
              </button>
              
              {/* 컬럼 선택 팝업 드롭다운 (React Portal 이식으로 쌓임 맥락 및 가려짐 완벽 차단) */}
              {mounted && isColSelectorOpen && typeof document !== 'undefined' && createPortal(
                <div 
                  className={`fixed rounded-2xl border shadow-2xl p-4 w-64 transition-all ${
                    isDarkMode
                      ? "border-slate-800 text-slate-100 shadow-black/90"
                      : "border-slate-200 text-slate-800 shadow-slate-200/60"
                  }`}
                  style={{
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                    zIndex: 99999,
                    backgroundColor: isDarkMode ? "#090d16" : "#ffffff",
                    transform: "translate3d(0, 0, 9999px)",
                    isolation: "isolate",
                  }}
                >
                  <div className="flex items-center justify-between border-b border-solid border-slate-700/20 pb-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider">표시 컬럼 선택</span>
                    <button
                      onClick={toggleAllColumns}
                      className="text-[9px] font-black text-indigo-500 hover:underline border-none bg-transparent cursor-pointer"
                    >
                      {visibleColumns.length === data.headers.length ? "전체해제" : "전체선택"}
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar text-left">
                    {data.headers.map((h, idx) => {
                      const isChecked = visibleColumns.includes(h);
                      return (
                        <label
                          key={idx}
                          className="flex items-center gap-2 px-1.5 py-1 hover:bg-white/5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleColumn(h)}
                            className="rounded border-slate-400 text-indigo-600 focus:ring-indigo-550 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className={isChecked ? "opacity-100" : "opacity-50"}>{h}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="border-t border-solid border-slate-700/20 pt-2 mt-2 flex justify-end">
                    <button
                      onClick={() => setIsColSelectorOpen(false)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-755 text-white rounded-lg text-[10px] font-black cursor-pointer border-none"
                    >
                      확인
                    </button>
                  </div>
                </div>,
                document.body
              )}
            </div>

            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-bold`}>보기:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`px-3 py-2 border rounded-2xl text-xs font-bold shadow-sm outline-none transition-all ${
                isDarkMode 
                  ? "bg-slate-900/50 border-white/10 text-slate-300" 
                  : "bg-slate-50 border-slate-200 text-slate-705"
              }`}
            >
              <option value={10}>10개씩</option>
              <option value={15}>15개씩</option>
              <option value={30}>30개씩</option>
              <option value={50}>50개씩</option>
            </select>
          </div>
        </div>

        {/* 데이터 테이블 카드 (좌우 최대 폭 확장 및 가로 스크롤 방지 래핑 패턴) */}
        <div className={`relative z-10 ${
          isDarkMode 
            ? "bg-slate-900/95 border-white/10 shadow-2xl shadow-slate-950/50" 
            : "bg-white border-slate-200 shadow-xl shadow-slate-100/50"
        } border rounded-3xl overflow-hidden transition-all duration-300 w-full`}>
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-[11px] font-semibold border-collapse table-auto">
              <thead>
                <tr className={`border-b ${
                  isDarkMode 
                    ? "border-white/10 bg-slate-900/30 text-slate-400" 
                    : "border-slate-200 bg-slate-50 text-slate-600"
                } transition-colors duration-300`}>
                  {data.headers.map((header, idx) => {
                    if (!visibleColumns.includes(header)) return null;
                    return (
                      <th
                        key={idx}
                        onClick={() => handleSort(idx)}
                        className={`py-3.5 px-3.5 cursor-pointer ${
                          isDarkMode ? "hover:text-white" : "hover:text-slate-900"
                        } select-none transition-colors group whitespace-nowrap`}
                      >
                        <div className="flex items-center gap-1">
                          {header}
                          <span className="text-indigo-500 font-bold group-hover:scale-110 transition-transform">
                            {sortKey === idx ? (sortDir === "asc" ? " ▲" : " ▼") : " ↕"}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length}
                      className={`text-center py-20 ${isDarkMode ? 'text-slate-400' : 'text-slate-505'} font-semibold`}
                    >
                      검색 조건에 맞는 내역이 존재하지 않습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={`border-b ${
                        isDarkMode 
                          ? "border-white/5 hover:bg-white/5" 
                          : "border-slate-100 hover:bg-slate-50/60"
                      } transition-colors duration-300`}
                    >
                      {row.map((val, cIdx) => {
                        const headerName = data.headers[cIdx];
                        if (!visibleColumns.includes(headerName)) return null;

                        const strVal = String(val);
                        const isAttachedFile = detectFile(strVal);
                        
                        return (
                          <td key={cIdx} className={`py-3 px-3.5 ${
                            isDarkMode ? "text-slate-350" : "text-slate-700"
                          } font-medium whitespace-normal break-all max-w-[240px]`}>
                            {isAttachedFile ? (
                              <button
                                onClick={() => setActiveImageUrl(strVal)}
                                className="px-2.5 py-1 bg-indigo-500/10 text-indigo-650 hover:bg-indigo-500/20 rounded-lg text-[10px] font-black border border-indigo-500/20 transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="원본 파일 전체보기"
                              >
                                🔗 원본보기
                              </button>
                            ) : strVal === "-" ? (
                              <span className={isDarkMode ? "text-slate-700" : "text-slate-400"}>-</span>
                            ) : (
                              strVal
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

        {/* 하단 페이지네이션 패널 */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between ${
            isDarkMode 
              ? "bg-white/5 border-white/10" 
              : "bg-white/80 border-slate-200 shadow-xl shadow-slate-100/50"
          } backdrop-blur-xl border px-5 py-3 rounded-3xl transition-all duration-300`}>
            <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-bold`}>
              페이지 <span className="text-indigo-600 font-black">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 ${
                  isDarkMode 
                    ? "bg-slate-900/50 hover:bg-slate-900 border-white/5 text-slate-350" 
                    : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
                } border rounded-xl text-[11px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer`}
              >
                이전
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                if (Math.abs(currentPage - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={idx} className="text-slate-500 px-1 text-xs">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7.5 h-7.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : isDarkMode
                        ? "bg-slate-900/30 hover:bg-white/5 text-slate-450 border border-white/5"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 ${
                  isDarkMode 
                    ? "bg-slate-900/50 hover:bg-slate-900 border-white/5 text-slate-350" 
                    : "bg-slate-100 hover:bg-slate-250 border-slate-200 text-slate-600"
                } border rounded-xl text-[11px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer`}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🖼️ 프리미엄 Glassmorphism 원본 파일 이미지 뷰어 모달 */}
      {activeImageUrl && (
        <div 
          onClick={() => setActiveImageUrl(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-slate-900/40 border border-white/10 p-2.5 rounded-3xl shadow-2xl flex flex-col items-center cursor-default"
          >
            {/* 상단 닫기 단추 */}
            <button
              onClick={() => setActiveImageUrl(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-black/60 border border-white/10 hover:bg-black/80 rounded-full text-white cursor-pointer transition-all hover:scale-105"
            >
              <X size={18} />
            </button>
            
            <div className="w-full max-h-[82vh] overflow-auto custom-scrollbar flex justify-center items-center rounded-2xl bg-black/20 p-2">
              {activeImageUrl.startsWith("data:application/pdf") ? (
                <iframe 
                  src={activeImageUrl} 
                  className="w-full h-[75vh] rounded-xl border-none"
                  title="PDF Document Viewer"
                />
              ) : (
                <img
                  src={activeImageUrl}
                  alt="수발주 원본 증빙문서 파일"
                  className="max-w-full h-auto object-contain rounded-xl shadow-lg border border-white/5"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function WebViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 font-sans p-6">
        <div className="w-16 h-16 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-black tracking-wide text-indigo-400">페이지를 불러오는 중입니다...</p>
      </div>
    }>
      <WebViewContent />
    </Suspense>
  );
}
