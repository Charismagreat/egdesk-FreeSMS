"use client";

import React from "react";
import { 
  Table, Download, Search, RefreshCw, AlertTriangle, 
  ArrowUpDown, ArrowUp, ArrowDown, Database, CheckCircle
} from "lucide-react";

interface ShareViewPageProps {
  params: Promise<{ hash: string }>;
}

export default function ShareViewPage({ params }: ShareViewPageProps) {
  // Next.js 15의 비동기 params 획득 대응
  const resolvedParams = React.use(params);
  const hash = resolvedParams.hash;

  // 상태 변수 정의
  const [data, setData] = React.useState<{
    friendlyTableName: string;
    allowCsvDownload: boolean;
    columnMappings: { physical: string; friendly: string }[];
    rows: any[];
    total: number;
  } | null>(null);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // 클라이언트 단의 실시간 전체 텍스트 검색 필터
  const [filterQuery, setFilterQuery] = React.useState<string>("");
  
  // 정렬 상태
  const [sortColumn, setSortColumn] = React.useState<string>("");
  const [sortDirection, setSortDirection] = React.useState<'ASC' | 'DESC'>('DESC');

  // 데이터 패치
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shared-views?hash=${hash}`);
      const result = await res.json();
      
      if (result.success) {
        setData({
          friendlyTableName: result.friendlyTableName,
          allowCsvDownload: result.allowCsvDownload,
          columnMappings: result.columnMappings,
          rows: result.rows,
          total: result.total
        });
        
        // 정렬 정보의 기본 초기값은 스키마 맵핑의 첫 번째 물리적 컬럼
        if (result.columnMappings && result.columnMappings.length > 0) {
          setSortColumn(result.columnMappings[0].physical);
        }
      } else {
        setError(result.error || "데이터를 불러오는 데 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      setError("서버와의 연결이 매끄럽지 않거나, 유효하지 않은 공유 해시입니다.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (hash) {
      fetchData();
    }
  }, [hash]);

  // 👥 클라이언트 사이드 부드러운 메모리 정렬 (Sorting)
  const sortedRows = React.useMemo(() => {
    if (!data || !data.rows) return [];
    if (!sortColumn) return data.rows;
    
    const sorted = [...data.rows];
    sorted.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      // 숫자 타입과 일반 텍스트 타입 비교 분기
      const isNumA = typeof aVal === 'number';
      const isNumB = typeof bVal === 'number';
      
      if (isNumA && isNumB) {
        return sortDirection === 'ASC' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      }
      
      const compare = String(aVal).localeCompare(String(bVal), 'ko');
      return sortDirection === 'ASC' ? compare : -compare;
    });
    return sorted;
  }, [data, sortColumn, sortDirection]);

  // 👥 실시간 로컬 전체 검색 필터링 (부드러운 스캔 효과)
  const filteredRows = React.useMemo(() => {
    if (!filterQuery.trim()) return sortedRows;
    const query = filterQuery.toLowerCase();
    
    return sortedRows.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(query)
      );
    });
  }, [sortedRows, filterQuery]);

  // 🔄 정렬 방향/컬럼 변경 핸들러
  const handleSort = (physicalCol: string) => {
    if (sortColumn === physicalCol) {
      setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortColumn(physicalCol);
      setSortDirection('DESC');
    }
  };

  // 💾 엑셀/CSV 한글 로컬 안전 다운로드 유틸 (UTF-8 BOM 추가 깨짐 원천 방지)
  const handleDownloadCSV = () => {
    if (!data) return;
    const headers = data.columnMappings.map(col => col.friendly);
    const physicals = data.columnMappings.map(col => col.physical);
    
    let csvContent = "\uFEFF"; // UTF-8 BOM 추가
    csvContent += headers.join(",") + "\n";
    
    filteredRows.forEach(row => {
      const line = physicals.map(colName => {
        let val = row[colName];
        if (val === null || val === undefined) val = "";
        // 값 내부에 큰따옴표나 쉼표가 있을 시 이스케이프 래핑
        const valStr = String(val).replace(/"/g, '""');
        return valStr.includes(",") || valStr.includes("\n") || valStr.includes('"') ? `"${valStr}"` : valStr;
      });
      csvContent += line.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${data.friendlyTableName}_공유_장부.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-12">
      {/* 🌌 최상단 은은한 프리미엄 그라데이션 장식 라인 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      
      {/* 🚀 메인 본문 컨테이너 */}
      <div className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* 1. 상단 정보 카드 영역 (Glassmorphism & Neon Shadow) */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-50 text-indigo-650 border border-indigo-200 px-2 py-0.5 rounded-full font-black select-none">
                데이터 공유 뷰
              </span>
              <span className="text-[10px] text-slate-400 font-bold font-mono">
                {hash.substring(0, 8)}...
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
              {isLoading ? "공유 테이블 불러오는 중..." : (data?.friendlyTableName || "안전한 공유 뷰어")}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              이 테이블은 사내 공유용으로 실시간 갱신 및 데이터 보안 마스킹 처리가 완료된 상태입니다.
            </p>
          </div>

          {/* 우측 유틸 도구 모음 */}
          {!isLoading && data && (
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              <button
                onClick={fetchData}
                className="flex items-center justify-center p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 rounded-xl cursor-pointer hover:text-slate-700 transition-colors shadow-3xs"
                title="데이터 새로고침"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              {data.allowCsvDownload && (
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-3xs cursor-pointer border-none transition-colors"
                  title="정제된 내역을 엑셀로 백업"
                >
                  <Download className="w-4 h-4 text-white" />
                  엑셀/CSV 다운로드
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. 에러 또는 로딩 처리 */}
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <div className="text-center">
              <p className="text-xs font-black text-slate-700">보안 가드레일을 통과하여 안전 테이블을 로드 중입니다...</p>
              <p className="text-[10px] text-slate-400">잠시만 기다려 주십시오.</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-800">공유 뷰어를 구동할 수 없습니다</h3>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border-none rounded-xl text-xs font-extrabold cursor-pointer"
            >
              다시 시도하기
            </button>
          </div>
        ) : data && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {/* 검색 도구막대 */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 px-1 text-left">
                <Database className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
                정제 데이터 ({filteredRows.length}개 / 총 {data.total}개 레코드)
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="테이블 실시간 즉석 검색..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-700 font-semibold outline-none focus:border-indigo-500 shadow-3xs"
                />
              </div>
            </div>

            {/* 메인 데이터 그리드 (반응형 모바일 스크롤 & 최상급 스크롤 디자인) */}
            <div className="overflow-x-auto w-full min-w-0">
              <table className="min-w-max w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-150">
                    {data.columnMappings.map((col) => {
                      const isSortingThis = sortColumn === col.physical;
                      return (
                        <th
                          key={col.physical}
                          onClick={() => handleSort(col.physical)}
                          className="px-6 py-4.5 text-xs font-black text-slate-500 select-none cursor-pointer hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="flex items-center gap-1 text-[11px] font-black">
                            {col.friendly}
                            {isSortingThis ? (
                              sortDirection === 'ASC' ? (
                                <ArrowUp className="w-3 h-3 text-indigo-500" />
                              ) : (
                                <ArrowDown className="w-3 h-3 text-indigo-500" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-350 hover:text-slate-400" />
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={data.columnMappings.length} 
                        className="px-6 py-16 text-center text-xs font-extrabold text-slate-450 bg-slate-50/20"
                      >
                        검색 조건에 부합하거나 노출 승인된 데이터가 비어있습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, rowIdx) => (
                      <tr 
                        key={rowIdx} 
                        className="hover:bg-slate-50/40 transition-colors"
                      >
                        {data.columnMappings.map((col) => {
                          const val = row[col.physical];
                          return (
                            <td 
                              key={col.physical} 
                              className="px-6 py-3.5 text-xs font-semibold text-slate-650"
                            >
                              {val === null || val === undefined ? (
                                <span className="text-[10px] text-slate-300 font-bold font-mono">(NULL)</span>
                              ) : typeof val === 'number' ? (
                                <span className="font-mono">{val.toLocaleString()}</span>
                              ) : (
                                String(val)
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

            {/* 푸터 마감 정보 */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                보안 비식별 마스킹 엔진이 완벽 가동 중입니다.
              </div>
              <div>
                EZDesk Enterprise Database Security Grid v1.0
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
