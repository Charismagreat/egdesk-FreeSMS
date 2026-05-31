'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, Sparkles, CheckCircle2, Eye, EyeOff, Search, RefreshCw, ChevronRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface FeedbackItem {
  id: string;
  user_prompt: string;
  detected_type: 'bug' | 'feature_request' | 'complaint' | 'other';
  current_url: string;
  resolved_status: 'pending' | 'in_progress' | 'resolved' | 'ignored';
  created_at: string;
}

export default function FeedbackManagementCard() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 필터 상태
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings/feedback');
      const data = await response.json();
      if (data.success) {
        setFeedbacks(data.feedbacks);
      } else {
        setError(data.error || '피드백 목록을 가져오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '네트워크 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/settings/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, resolved_status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        // 상태값 로컬 즉시 갱신 (Optimistic Update)
        setFeedbacks(prev =>
          prev.map(item => (item.id === id ? { ...item, resolved_status: newStatus as any } : item))
        );
      } else {
        alert(data.error || '피드백 상태 수정 실패');
      }
    } catch (err: any) {
      alert('상태 갱신 실패: ' + err.message);
    }
  };

  // URL별 친근한 메뉴 한글명 매핑 헬퍼
  const getPageName = (url: string) => {
    const pageNames: Record<string, string> = {
      "/": "대시보드",
      "/sms": "무료 문자 발송 AI",
      "/message-logs": "발송 내역 조회",
      "/automation": "자동 발송 설정",
      "/customers": "고객 관리 AI",
      "/partners": "거래처 관리 AI",
      "/transactions": "거래 관리 AI",
      "/orders": "주문 관리 AI",
      "/payments": "결제 관리 AI",
      "/finance": "금융 정보 AI",
      "/coupons": "쿠폰 관리 AI",
      "/reservations": "예약 관리 AI",
      "/deliveries": "배송 관리 AI",
      "/products": "상품 관리 AI",
      "/estimates": "견적/발주/수주 AI",
      "/snaptasks": "AI 스냅태스크",
      "/inventory": "재고 관리 AI",
      "/expenses": "지출 관리 AI",
      "/price-tracker": "가격 추적 AI",
      "/website": "홈페이지 빌더 AI",
      "/recruitment": "채용 매니저 AI",
      "/instagram": "인스타그램 마케팅 AI",
      "/naver-blog": "N-BLOG 포스팅 AI",
      "/youtube-shorts": "YOUTUBE 쇼츠 AI",
      "/ai-briefing": "AI 브리핑",
      "/operators": "운영자 관리",
      "/my-db": "MY DB",
      "/help": "Q&A 헬프센터",
      "/settings": "시스템 설정"
    };
    return pageNames[url] || url;
  };

  // 검색 및 필터칩 필터링 연산
  const filteredFeedbacks = feedbacks.filter(item => {
    const matchesSearch = item.user_prompt.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          getPageName(item.current_url).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || item.detected_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.resolved_status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-300">
      {/* 카드 헤더 (Harmonic Indigo 그라데이션) */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-50 to-indigo-50/20">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm shrink-0">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              이지봇 실시간 피드백 보드
              <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-650 px-2 py-0.5 rounded-full border border-indigo-100">
                수집 자동화
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">사용자들이 이지봇을 통해 제보한 실시간 버그 및 기능 건의 사항을 파악하고 처리 상태를 관리합니다.</p>
          </div>
        </div>

        {/* 새로고침 버튼 */}
        <button
          onClick={fetchFeedbacks}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {/* 내부 컨트롤 필터바 */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/40 flex flex-col gap-4">
        {/* 검색창 */}
        <div className="relative w-full md:max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" />
          <input
            type="text"
            placeholder="제보 내용 또는 접수 메뉴 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white placeholder-slate-400 text-slate-700 transition-all"
          />
        </div>

        {/* 유형 및 상태 필터 칩 */}
        <div className="flex flex-wrap items-center gap-6 text-xs">
          {/* 유형 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-450 font-bold shrink-0">제보 유형</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { key: 'all', label: '전체' },
                { key: 'bug', label: '🐛 버그 제보' },
                { key: 'feature_request', label: '💡 기능 건의' },
                { key: 'complaint', label: '🔥 불만 사항' },
                { key: 'other', label: '기타' }
              ].map(chip => (
                <button
                  key={chip.key}
                  onClick={() => setTypeFilter(chip.key)}
                  className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-all text-[11px] shrink-0 ${
                    typeFilter === chip.key
                      ? 'bg-indigo-550 border-indigo-550 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* 상태 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-450 font-bold shrink-0">처리 상태</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { key: 'all', label: '전체' },
                { key: 'pending', label: '대기 중' },
                { key: 'in_progress', label: '처리 중' },
                { key: 'resolved', label: '해결 완료' },
                { key: 'ignored', label: '보류/기타' }
              ].map(chip => (
                <button
                  key={chip.key}
                  onClick={() => setStatusFilter(chip.key)}
                  className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-all text-[11px] shrink-0 ${
                    statusFilter === chip.key
                      ? 'bg-slate-750 border-slate-750 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 피드백 본문 리스트 영역 */}
      <div className="p-6">
        {loading ? (
          <div className="py-16 text-center text-slate-450 flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-indigo-500" />
            <span className="text-xs font-semibold">피드백 데이터를 동기화하는 중...</span>
          </div>
        ) : error ? (
          <div className="py-12 border border-rose-100 rounded-2xl bg-rose-50/20 text-center flex flex-col items-center justify-center gap-2">
            <ShieldAlert className="text-rose-500 w-8 h-8" />
            <p className="text-xs font-bold text-rose-600">피드백 데이터를 로드하지 못했습니다.</p>
            <p className="text-[11px] text-rose-450">{error}</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
            <AlertCircle size={28} className="text-slate-350 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">접수된 피드백이 존재하지 않습니다.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">필터 또는 검색어를 변경해 보세요.</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-150 rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-55 border-b border-slate-150 text-slate-700 font-bold text-[11px]">
                    <th className="p-4 w-28">제보 유형</th>
                    <th className="p-4">제보 요약 및 내용</th>
                    <th className="p-4 w-36">접수 메뉴</th>
                    <th className="p-4 w-32">접수 일시</th>
                    <th className="p-4 w-36 text-center">처리 상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filteredFeedbacks.map((item) => {
                    const isResolved = item.resolved_status === 'resolved';
                    
                    // 유형 뱃지 스타일 정의
                    const badgeStyles = {
                      bug: 'bg-rose-50 text-rose-600 border border-rose-100',
                      feature_request: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
                      complaint: 'bg-amber-50 text-amber-600 border border-amber-100',
                      other: 'bg-slate-50 text-slate-600 border border-slate-100'
                    };

                    const typeLabels = {
                      bug: '🐛 버그 제보',
                      feature_request: '💡 기능 건의',
                      complaint: '🔥 불만 사항',
                      other: '기타'
                    };

                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-slate-50/50 transition-colors ${
                          isResolved ? 'bg-slate-50/30 text-slate-400' : 'text-slate-700'
                        }`}
                      >
                        {/* 1. 제보 유형 */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${badgeStyles[item.detected_type] || badgeStyles.other}`}>
                            {typeLabels[item.detected_type] || item.detected_type}
                          </span>
                        </td>

                        {/* 2. 제보 요약 및 내용 */}
                        <td className="p-4 font-normal max-w-md">
                          <p className={`font-semibold leading-relaxed ${isResolved ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {item.user_prompt}
                          </p>
                        </td>

                        {/* 3. 접수 메뉴 바로가기 */}
                        <td className="p-4 whitespace-nowrap font-semibold">
                          <Link 
                            href={item.current_url}
                            className="inline-flex items-center gap-1 text-indigo-550 hover:underline hover:text-indigo-650"
                          >
                            {getPageName(item.current_url)}
                            <ChevronRight size={11} />
                          </Link>
                        </td>

                        {/* 4. 접수 일시 */}
                        <td className="p-4 whitespace-nowrap text-slate-450 text-[11px] font-medium">
                          {item.created_at}
                        </td>

                        {/* 5. 처리 상태 변경 드롭다운/버튼 */}
                        <td className="p-4 whitespace-nowrap text-center">
                          <select
                            value={item.resolved_status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`px-2 py-1 text-[11px] font-bold rounded-lg border focus:outline-none transition-all ${
                              item.resolved_status === 'resolved'
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                : item.resolved_status === 'in_progress'
                                ? 'bg-blue-50 border-blue-100 text-blue-600'
                                : item.resolved_status === 'ignored'
                                ? 'bg-slate-100 border-slate-200 text-slate-500'
                                : 'bg-rose-50 border-rose-100 text-rose-500 animate-pulse'
                            }`}
                          >
                            <option value="pending">⏳ 대기 중</option>
                            <option value="in_progress">⚙️ 처리 중</option>
                            <option value="resolved">✅ 해결 완료</option>
                            <option value="ignored">⏸️ 보류/기타</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
