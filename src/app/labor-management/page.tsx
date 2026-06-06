"use client";

import React from "react";
import { useLaborManagement } from "./hooks/useLaborManagement";
import LaborAuditCard from "./components/LaborAuditCard";
import ContractReviewCard from "./components/ContractReviewCard";
import { AlertCircle, CheckCircle2, ShieldAlert, Sparkles, Scale } from "lucide-react";

/**
 * 노무 관리 AI (AI Labor Guard) 메인 대시보드
 */
export default function LaborManagementPage() {
  const {
    isLoading,
    isAuditing,
    toast,
    stats,
    summary,
    contracts,
    selectedEmployeeId,
    handleGenerateAudit,
    handleRemediateClause,
    handlePrintContract,
    setSelectedEmployeeId,
  } = useLaborManagement();

  const totalEmployees = stats.length;
  const criticalCount = stats.filter(s => s.riskLevel === "CRITICAL").length;
  const warningCount = stats.filter(s => s.riskLevel === "WARNING").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* --- 상단 헤더 섹션 (Wow 디자인) --- */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* 장식용 오로라 구체 */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide">
                <Sparkles className="w-3 h-3 text-indigo-400" /> AI Labor Guard Engine
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">노무 관리 AI</h1>
            <p className="text-xs text-indigo-200/80 font-bold max-w-xl">
              실시간 출퇴근 데이터를 상시 스캔하여 근로기준법(주 52시간제 등) 위반 리스크를 자동 진단하고, 위법 우려가 있는 근로계약 조항을 AI 추천 표준 문구로 즉시 자동 보정합니다.
            </p>
          </div>

          {/* 주요 통계 요약 (Dashboard Hero Stats) */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 text-left">
            <div>
              <span className="block text-[8px] text-indigo-300 font-black">모니터링 대상</span>
              <span className="text-sm md:text-base font-black font-mono text-white">
                {totalEmployees} <span className="text-[10px] text-indigo-200">명</span>
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-rose-300 font-black">위법 한도 초과</span>
              <span className="text-sm md:text-base font-black font-mono text-rose-450">
                {criticalCount} <span className="text-[10px] text-rose-300">명</span>
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-amber-300 font-black">근태 이탈 주의</span>
              <span className="text-sm md:text-base font-black font-mono text-amber-400">
                {warningCount} <span className="text-[10px] text-amber-300">명</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 로딩 표시 */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold">임직원 근태 기록 및 계약서 스캔본을 스캔하고 있습니다...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 좌측: 근태 진단 */}
          <div className="lg:col-span-6">
            <LaborAuditCard
              stats={stats}
              summary={summary}
              onGenerateAudit={handleGenerateAudit}
              isAuditing={isAuditing}
            />
          </div>

          {/* 우측: 계약서 스캔 및 교정 */}
          <div className="lg:col-span-6">
            <ContractReviewCard
              contracts={contracts}
              selectedEmployeeId={selectedEmployeeId}
              onSelectEmployee={setSelectedEmployeeId}
              onRemediateClause={handleRemediateClause}
              onPrintContract={handlePrintContract}
            />
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
