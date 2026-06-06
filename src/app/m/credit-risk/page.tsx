"use client";

import React from "react";
import { useMobileCredit } from "./hooks/useMobileCredit";
import MobileCreditTrackerCard from "./components/MobileCreditTrackerCard";
import { Coins, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

/**
 * 채권 관리 AI (AI Credit Risk Advisor) 모바일 관제 화면
 */
export default function MobileCreditPage() {
  const {
    isLoading,
    error,
    stats,
    summary,
    getDialLink,
    getSmsLink,
    refetch
  } = useMobileCredit();

  const totalPartners = stats.length;
  const criticalCount = stats.filter(s => s.riskLevel === "CRITICAL").length;
  const warningCount = stats.filter(s => s.riskLevel === "WARNING").length;

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-12 space-y-5">
      
      {/* --- 상단 모바일 헤더 --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-left">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <Coins className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight">채권 관리 AI</h1>
            <p className="text-[8px] text-slate-400 font-bold">Mobile Credit Risk Guard</p>
          </div>
        </div>

        <button
          onClick={refetch}
          className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition active:scale-95"
          title="새로고침"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </div>

      {/* 로딩 및 에러 처리 */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-550 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] text-slate-400 font-bold">채권 분석기 동기화 중...</span>
        </div>
      ) : error ? (
        <div className="py-16 text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-450 font-bold">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-xl text-[10px] font-bold"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          
          {/* 전사 수금 리스크 요약 통계 */}
          {summary && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[8px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 uppercase tracking-wide">
                <Sparkles className="w-2.5 h-2.5" /> AI Risk Summary
              </span>

              <div className="grid grid-cols-2 gap-4 mt-4 border-b border-white/5 pb-4">
                <div>
                  <span className="text-[8px] text-slate-400 font-bold block">평균 수금 일수 (DSO)</span>
                  <span className="text-lg font-black font-mono text-white tracking-tight mt-0.5 block">
                    {summary.averageDso.toFixed(1)} <span className="text-[10px] text-slate-350">일</span>
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 font-bold block">부실채권 총 잔액</span>
                  <span className="text-lg font-black font-mono text-rose-450 tracking-tight mt-0.5 block">
                    ₩ {(summary.overdueTotal / 10000).toLocaleString()}<span className="text-[10px] text-rose-350"> 만원</span>
                  </span>
                </div>
              </div>

              {/* 관리 현황판 */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-[8px] text-slate-400 block font-bold">감시 대상</span>
                  <span className="text-xs font-black font-mono text-white mt-1 block">{totalPartners}</span>
                </div>
                <div className="bg-rose-500/10 p-2 rounded-xl border border-rose-500/10">
                  <span className="text-[8px] text-rose-400 block font-bold">위험 등급</span>
                  <span className="text-xs font-black font-mono text-rose-400 mt-1 block">{criticalCount}</span>
                </div>
                <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/10">
                  <span className="text-[8px] text-amber-400 block font-bold">주의 등급</span>
                  <span className="text-xs font-black font-mono text-amber-400 mt-1 block">{warningCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* 모바일 대장 및 핫링크 카드 리스트 */}
          <MobileCreditTrackerCard
            stats={stats}
            getDialLink={getDialLink}
            getSmsLink={getSmsLink}
          />

        </div>
      )}

    </div>
  );
}
