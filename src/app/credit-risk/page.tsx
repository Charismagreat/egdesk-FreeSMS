"use client";

import React from "react";
import { useCreditRisk } from "./hooks/useCreditRisk";
import CreditRiskCard from "./components/CreditRiskCard";
import CollectionCard from "./components/CollectionCard";
import { Sparkles, CheckCircle2, ShieldAlert, AlertCircle, Coins, ShieldCheck } from "lucide-react";

/**
 * 채권 관리 AI (AI Credit Risk Advisor) 메인 대시보드
 */
export default function CreditRiskPage() {
  const {
    isLoading,
    isRecalculating,
    isSending,
    toast,
    stats,
    summary,
    aging,
    selectedPartnerId,
    recalculateCreditRisk,
    sendOverdueSms,
    handlePrintNotice,
    setSelectedPartnerId
  } = useCreditRisk();

  const totalPartners = stats.length;
  const criticalCount = stats.filter(s => s.riskLevel === "CRITICAL").length;
  const warningCount = stats.filter(s => s.riskLevel === "WARNING").length;

  const selectedPartner = stats.find(s => s.id === selectedPartnerId) || null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* --- 상단 헤더 섹션 (Wow 디자인) --- */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* 장식용 오로라 구체 */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide">
                <Sparkles className="w-3 h-3 text-indigo-450" /> AI Credit Risk Advisor
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              <Coins className="w-6 h-6 text-indigo-400" /> 채권 관리 AI
            </h1>
            <p className="text-xs text-indigo-200/80 font-bold max-w-xl">
              B2B 매출채권의 지연 및 부도 리스크를 머신러닝 기반 신용점수로 진단하고, 공정채권추심법 가이드라인을 통과한 SMS 자동 독촉 및 최고장 인쇄 솔루션을 제공합니다.
            </p>
          </div>

          {/* 주요 통계 요약 (Dashboard Hero Stats) */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 text-left">
            <div>
              <span className="block text-[8px] text-indigo-300 font-black">관리 거래처</span>
              <span className="text-sm md:text-base font-black font-mono text-white">
                {totalPartners} <span className="text-[10px] text-indigo-200">개사</span>
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-rose-350 font-black">부도 고위험군</span>
              <span className="text-sm md:text-base font-black font-mono text-rose-450">
                {criticalCount} <span className="text-[10px] text-rose-350">개사</span>
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-amber-300 font-black">수금 경고/주의</span>
              <span className="text-sm md:text-base font-black font-mono text-amber-400">
                {warningCount} <span className="text-[10px] text-amber-300">개사</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 로딩 표시 */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold">거래처 거래 원장 및 미수금 연체 기간을 AI 분석기로 분석하고 있습니다...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 전사 리스크 요인 요약 배너 */}
          {summary && summary.riskFactors.length > 0 && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-2">
              <span className="block text-[9px] text-slate-400 font-black">AI 채권 관리 통합 진단 리포트</span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {summary.riskFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[9px] font-bold text-slate-650 bg-white border border-slate-100 p-2.5 rounded-xl">
                    <span className="shrink-0">{factor.startsWith("⚠️") ? "⚠️" : factor.startsWith("💡") ? "💡" : "ℹ️"}</span>
                    <p className="leading-relaxed">{factor.replace(/^[⚠️💡ℹ️]\s*/, "")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 메인 관제 콘텐츠 2컬럼 레이아웃 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* 좌측: 거래처 신용 위험 대장 */}
            <div className="lg:col-span-7 h-[680px]">
              <CreditRiskCard
                stats={stats}
                aging={aging}
                selectedPartnerId={selectedPartnerId}
                onSelectPartner={setSelectedPartnerId}
                onRecalculate={recalculateCreditRisk}
                isRecalculating={isRecalculating}
              />
            </div>

            {/* 우측: 수금 관리 및 독촉 제어 솔루션 */}
            <div className="lg:col-span-5 h-[680px]">
              <CollectionCard
                partner={selectedPartner}
                onSendSms={sendOverdueSms}
                onPrintNotice={handlePrintNotice}
                isSending={isSending}
              />
            </div>
          </div>

        </div>
      )}

      {/* 토스트 알림 팝업 */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-left border ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-650 shrink-0" />
            ) : toast.type === "error" ? (
              <ShieldAlert className="w-5 h-5 text-rose-650 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-650 shrink-0" />
            )}
            <div>
              <span className="block text-[10px] font-bold">
                {toast.type === "success" ? "작업 성공" : toast.type === "error" ? "오류 발생" : "알림 경고"}
              </span>
              <p className="text-[10px] font-black mt-0.5">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
