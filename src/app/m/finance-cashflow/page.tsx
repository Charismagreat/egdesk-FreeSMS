"use client";

import React, { useState } from "react";
import { useMobileCashflow } from "./hooks/useMobileCashflow";
import MobileCashflowCard from "./components/MobileCashflowCard";
import { Coins, CheckCircle, AlertOctagon, AlertTriangle, RefreshCw, Eye, EyeOff } from "lucide-react";

/**
 * 자금/원가 AI 시뮬레이터 모바일 페이지
 */
export default function MobileCashflowPage() {
  const {
    isLoading,
    toast,
    currentBalance,
    forecastList,
    overdueList,
    handleSendRemindSms,
    fetchMobileData,
  } = useMobileCashflow();

  // 하단 전체 타임라인 펼침 상태
  const [showTimeline, setShowTimeline] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-start w-full relative">
      
      {/* 🛎️ 모바일 전용 토스트 알림 */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-55 p-3.5 rounded-2xl shadow-xl border flex items-center gap-2.5 animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
          'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <AlertOctagon className="w-4.5 h-4.5 text-rose-600 shrink-0" />}
          {toast.type === 'warn' && <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />}
          <span className="text-[10px] font-black leading-snug">{toast.message}</span>
        </div>
      )}

      {/* 모바일 상단 헤더 바 */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4.5 flex items-center justify-between sticky top-0 z-40 text-left">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">자금 모바일 분석 센터</h1>
            <p className="text-[9px] text-slate-500 font-extrabold mt-0.5">EGDESK Cashflow Mobile Analyzer</p>
          </div>
        </div>

        {/* 수동 새로고침 */}
        <button
          onClick={fetchMobileData}
          disabled={isLoading}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl border border-slate-750 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-450 font-bold">자금 분석 데이터를 로드하고 있습니다...</span>
        </div>
      ) : (
        /* 모바일 폼 메인 바디 */
        <div className="flex-1 p-4 overflow-y-auto max-w-lg mx-auto w-full pb-16 space-y-5">
          
          {/* 1. 모닝 자금 브리핑 및 연체 리스트 */}
          <MobileCashflowCard
            currentBalance={currentBalance}
            overdueList={overdueList}
            onSendSms={handleSendRemindSms}
          />

          {/* 2. 하단 아코디언 식 90일 전체 수금/지출 예정 목록 */}
          <div className="bg-slate-850 rounded-2xl border border-slate-800 p-4 space-y-3.5">
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="w-full flex justify-between items-center text-xs font-black text-white focus:outline-none"
            >
              <span>90일 전체 예상 입출금 타임라인 ({forecastList.length}건)</span>
              {showTimeline ? <EyeOff className="w-4 h-4 text-indigo-400" /> : <Eye className="w-4 h-4 text-indigo-400" />}
            </button>

            {showTimeline && (
              <div className="space-y-2.5 pt-2 border-t border-slate-800 max-h-[300px] overflow-y-auto pr-1">
                {forecastList.map((item) => {
                  const isIn = item.type === "IN";
                  return (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between text-left ${
                        item.isOverdue 
                          ? 'bg-rose-950/20 border-rose-900/40' 
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[7px] font-black px-1.5 py-0.2 rounded ${
                            isIn ? 'bg-emerald-500/20 text-emerald-450' : 'bg-purple-500/20 text-purple-450'
                          }`}>
                            {isIn ? '수금' : '지출'}
                          </span>
                          <span className="text-[7.5px] text-slate-500 font-bold">{item.date.slice(5)}</span>
                        </div>
                        <h4 className="text-[9.5px] font-extrabold text-slate-200 truncate mt-1">{item.title}</h4>
                        <p className="text-[8px] text-slate-500 font-bold mt-0.5">{item.partnerName}</p>
                      </div>

                      <span className="text-[10px] font-black text-slate-100 shrink-0">
                        {item.amount.toLocaleString()}원
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 모바일 하단 카피라이트 */}
      <div className="py-4 text-center border-t border-slate-800 bg-slate-900 text-slate-600 text-[8px] font-black mt-auto">
        © 2026 EGDESK SMS. ALL RIGHTS RESERVED.
      </div>
      
    </div>
  );
}
