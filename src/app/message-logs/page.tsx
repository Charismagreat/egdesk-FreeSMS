"use client";
import { useState, useEffect } from "react";
import { Send, CheckCircle, AlertTriangle, Search } from "lucide-react";

export default function MessageLogsPage() {
  const [data, setData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => { fetchData(); }, []);
  
  // 검색어 입력 시 페이지 번호 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchData = async () => {
    const res = await fetch('/api/message-logs');
    const json = await res.json();
    if (json.success) setData(json.logs);
  };

  const filteredData = data.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      (t.phone && t.phone.toLowerCase().includes(query)) ||
      (t.message && t.message.toLowerCase().includes(query))
    );
  });

  // 페이지네이션 슬라이싱 로직
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center">
        <Send className="w-8 h-8 mr-3 text-purple-500" /> 전체 발송 내역 모니터링
      </h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-slate-800 shrink-0">발송 목록 ({filteredData.length}건)</h2>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="수신번호, 발송내용 검색"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-xs bg-white font-semibold"
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm">
              <th className="p-4">발송일시</th>
              <th className="p-4">수신번호</th>
              <th className="p-4 w-1/2">발송내용</th>
              <th className="p-4 text-center">상태</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(t => (
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="p-4 text-sm text-slate-500">{t.created_at}</td>
                <td className="p-4 font-medium text-slate-700">{t.phone}</td>
                <td className="p-4 text-xs text-slate-600 whitespace-pre-wrap">{t.message}</td>
                <td className="p-4 text-center">
                  {t.status === 'SUCCESS' ? (
                    <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1"/>성공
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full">
                      <AlertTriangle className="w-3 h-3 mr-1"/>실패
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  {data.length === 0 ? "발송 내역이 없습니다." : "검색 결과와 일치하는 내역이 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 페이지네이션 하단 컨트롤바 */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">페이지당 표시:</span>
            <select 
              value={itemsPerPage} 
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }} 
              className="border rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 focus:border-purple-500"
            >
              <option value={10}>10개씩 보기</option>
              <option value={20}>20개씩 보기</option>
              <option value={50}>50개씩 보기</option>
              <option value={100}>100개씩 보기</option>
            </select>
            <span className="text-xs text-slate-400 font-semibold ml-2">
              {filteredData.length === 0 
                ? "전체 0건 표시" 
                : `전체 ${filteredData.length}건 중 ${startIndex + 1}-${Math.min(endIndex, filteredData.length)}건 표시`}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1 || totalPages <= 1} 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-all"
            >
              이전
            </button>
            {totalPages <= 1 ? (
              <button 
                disabled
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500 text-white shadow-sm disabled:opacity-50 cursor-not-allowed"
              >
                1
              </button>
            ) : (
              Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentPage === page 
                      ? 'bg-purple-500 text-white shadow-sm' 
                      : 'border bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  {page}
                </button>
              ))
            )}
            <button 
              disabled={currentPage === totalPages || totalPages <= 1} 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-all"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
