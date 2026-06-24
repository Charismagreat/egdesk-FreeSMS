"use client";

import React, { useState, useEffect, useMemo } from "react";

export default function WebViewPage() {
  const [data, setData] = useState<{
    title: string;
    headers: string[];
    rows: any[][];
  } | null>(null);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // 1. sessionStorage에서 데이터 로드
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("egdesk_webview_data");
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch (e) {
          console.error("데이터 복원 실패:", e);
        }
      }
    }
  }, []);

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

  // CSV 다운로드 폴백
  const handleExportCsv = () => {
    if (!data) return;
    const csvContent =
      "\ufeff" +
      [
        data.headers.join(","),
        ...data.rows.map((r) =>
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

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 font-sans p-6">
        <div className="w-16 h-16 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-black tracking-wide text-indigo-400">데이터를 로드하는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-slate-100 font-sans p-4 md:p-8">
      {/* 럭셔리 네온 광원 */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* 상단 헤더 패널 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
          <div>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
              B2B Realtime WebView
            </span>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-300 mt-2">
              {data.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              총 <span className="text-indigo-400 font-bold">{sortedRows.length}</span>개의 평탄화(Flattened) 품목 상세 정보가 적재되었습니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              📊 CSV 다운로드
            </button>
            <button
              onClick={() => window.close()}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-350 hover:text-white text-xs font-bold rounded-2xl border border-white/10 transition-all cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>

        {/* 필터 및 검색 패널 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-xl">
          <div className="flex flex-1 items-center max-w-md w-full">
            <input
              type="text"
              placeholder="검색어를 입력해 주세요 (바이어명, 견적번호, 품목명 등 전체 조회)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-xs font-bold shadow-inner outline-none focus:border-indigo-500/80 transition-all text-white placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-3 justify-end">
            <span className="text-xs text-slate-400 font-bold">페이지당 보기:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-900/50 border border-white/10 rounded-2xl text-xs font-bold shadow-sm outline-none text-slate-300"
            >
              <option value={10}>10개씩</option>
              <option value={15}>15개씩</option>
              <option value={30}>30개씩</option>
              <option value={50}>50개씩</option>
            </select>
          </div>
        </div>

        {/* 데이터 테이블 카드 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/30 text-slate-400">
                  {data.headers.map((header, idx) => (
                    <th
                      key={idx}
                      onClick={() => handleSort(idx)}
                      className="py-4 px-4 cursor-pointer hover:text-white select-none transition-colors group whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        {header}
                        <span className="text-indigo-400 font-bold group-hover:scale-110 transition-transform">
                          {sortKey === idx ? (sortDir === "asc" ? " ▲" : " ▼") : " ↕"}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={data.headers.length}
                      className="text-center py-20 text-slate-400 font-semibold"
                    >
                      검색 조건에 맞는 내역이 존재하지 않습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {row.map((val, cIdx) => {
                        const strVal = String(val);
                        // 파일 링크/URL 형식일 경우 스마트 뱃지로 렌더링
                        const isUrl = strVal.startsWith("http://") || strVal.startsWith("https://") || strVal.includes("/uploads/");
                        
                        return (
                          <td key={cIdx} className="py-3.5 px-4 text-slate-300 font-medium whitespace-nowrap max-w-[200px] truncate">
                            {isUrl ? (
                              <a
                                href={strVal}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-[10px] font-black border border-indigo-500/20 transition-all inline-block"
                                title={strVal}
                              >
                                🔗 파일확인
                              </a>
                            ) : strVal === "-" ? (
                              <span className="text-slate-600">-</span>
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
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl shadow-xl">
            <span className="text-xs text-slate-400 font-bold">
              페이지 <span className="text-indigo-400 font-black">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-2 bg-slate-900/50 hover:bg-slate-900 border border-white/5 rounded-xl text-xs font-bold text-slate-350 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                이전
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                // 현재 페이지 주변 몇 개만 노출
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
                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-900/30 hover:bg-white/5 text-slate-400 border border-white/5"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-2 bg-slate-900/50 hover:bg-slate-900 border border-white/5 rounded-xl text-xs font-bold text-slate-350 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
