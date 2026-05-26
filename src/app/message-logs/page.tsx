"use client";
import { useState, useEffect } from "react";
import { Send, CheckCircle, AlertTriangle, Search, Calendar } from "lucide-react";

export default function MessageLogsPage() {
  const [data, setData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { 
    setIsMounted(true);
    fetchData(); 
  }, []);
  
  // 검색어 또는 날짜 필터 입력 시 페이지 번호 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  const fetchData = async () => {
    const res = await fetch('/api/message-logs');
    const json = await res.json();
    if (json.success) setData(json.logs);
  };

  // 날짜 필터 퀵 프리셋 설정 헬퍼
  const setPreset = (preset: 'all' | 'today' | '7d' | '30d') => {
    setActivePreset(preset);
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }
    const end = new Date();
    const start = new Date();
    
    if (preset === 'today') {
      // 오늘
    } else if (preset === '7d') {
      start.setDate(end.getDate() - 7);
    } else if (preset === '30d') {
      start.setDate(end.getDate() - 30);
    }
    
    const toDateString = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    setStartDate(toDateString(start));
    setEndDate(toDateString(end));
  };

  const filteredData = data.filter(t => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      (t.phone && t.phone.toLowerCase().includes(query)) ||
      (t.message && t.message.toLowerCase().includes(query))
    );

    if (!matchesSearch) return false;
    if (!t.created_at) return true;

    try {
      const logDate = new Date(t.created_at);
      if (isNaN(logDate.getTime())) return true; // 안전장치

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (logDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }
    } catch (e) {
      console.error(e);
    }
    return true;
  });

  // 페이지네이션 슬라이싱 로직
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // 발신 기기 메타데이터 파싱 헬퍼
  const parseSenderDevice = (msg: string) => {
    if (!msg) return { cleanMessage: '', deviceId: '기본 기기' };
    const match = msg.match(/\[sender_device:\s*([^\]]+)\]/);
    if (match) {
      const deviceId = match[1];
      const cleanMessage = msg.replace(/\n?\[sender_device:\s*[^\]]+\]/, '');
      return { cleanMessage, deviceId };
    }
    return { cleanMessage: msg, deviceId: '기본 기기' };
  };

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center">
        <Send className="w-8 h-8 mr-3 text-purple-500" /> 발송 내역 조회
      </h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* 🌟 프리미엄 2단 구조 레이아웃 성형 개편 */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
          
          {/* 1층: 타이틀 & 검색바 (완벽한 좌우 대칭) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="font-extrabold text-slate-800 text-base">발송 목록 ({filteredData.length}건)</h2>
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="수신번호, 발송내용 검색"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-xs bg-white font-semibold transition-all shadow-sm"
              />
            </div>
          </div>

          {/* 2층: 조회 기간 상세 필터링 영역 (구분선과 정렬 보강) */}
          {isMounted && (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 pt-3.5 border-t border-slate-100/70">
              <span className="text-xs font-bold text-slate-500 shrink-0">조회 기간</span>
              <div className="flex flex-wrap items-center gap-3">
                {/* 프리셋 버튼 */}
                <div className="flex items-center bg-slate-200/50 rounded-xl p-0.5 border border-slate-200/70 shrink-0">
                  <button 
                    onClick={() => setPreset('all')} 
                    className={`px-3 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 ${activePreset === 'all' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    전체
                  </button>
                  <button 
                    onClick={() => setPreset('today')} 
                    className={`px-3 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 ${activePreset === 'today' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    오늘
                  </button>
                  <button 
                    onClick={() => setPreset('7d')} 
                    className={`px-3 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 ${activePreset === '7d' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    7일
                  </button>
                  <button 
                    onClick={() => setPreset('30d')} 
                    className={`px-3 py-1.5 rounded-lg transition-all text-[11px] font-extrabold shrink-0 ${activePreset === '30d' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    30일
                  </button>
                </div>

                {/* 달력 입력 바 */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => {
                      setStartDate(e.target.value);
                      setActivePreset('custom');
                    }} 
                    className="outline-none border-none text-slate-700 text-xs bg-transparent cursor-pointer font-bold w-[115px]"
                  />
                  <span className="text-slate-300 font-bold">~</span>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => {
                      setEndDate(e.target.value);
                      setActivePreset('custom');
                    }} 
                    className="outline-none border-none text-slate-700 text-xs bg-transparent cursor-pointer font-bold w-[115px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm">
              <th className="p-4">발송일시</th>
              <th className="p-4">발신번호</th>
              <th className="p-4">수신번호</th>
              <th className="p-4 w-1/2">발송내용</th>
              <th className="p-4 text-center">상태</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(t => {
              const { cleanMessage, deviceId } = parseSenderDevice(t.message);
              const displaySender = deviceId === 'default' ? '기본 기기' : deviceId;
              return (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-4 text-sm text-slate-500">{t.created_at}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                      deviceId === 'default' 
                        ? 'bg-slate-50 text-slate-600 border-slate-200' 
                        : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                      {displaySender}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-700">{t.phone}</td>
                  <td className="p-4 text-xs text-slate-600 whitespace-pre-wrap">{cleanMessage}</td>
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
              );
            })}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
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
