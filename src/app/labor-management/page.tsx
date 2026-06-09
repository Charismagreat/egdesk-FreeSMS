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
    <div className="space-y-6 pb-20 w-full min-w-0 font-sans text-slate-800 animate-fade-in text-left" data-easybot-hint="노무 관리 AI: 근로시간 초과 직원 실시간 알림 경보 및 사외 근로 예외 설정을 제공합니다.">
      
      {/* 헤더 및 타이틀 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 flex items-center tracking-tight">
            <Scale className="w-8 h-8 text-indigo-650 mr-3" />
            노무 관리 AI
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            실시간 출퇴근 데이터를 상시 스캔하여 근로기준법(주 52시간제 등) 위반 리스크를 자동 진단하고, 위법 우려가 있는 근로계약 조항을 AI 추천 표준 문구로 즉시 자동 보정합니다.
          </p>
        </div>
      </div>

      {/* 주요 통계 요약 스코어카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4 text-left">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-extrabold block">모니터링 대상</span>
            <span className="text-2xl font-black text-slate-800 font-mono">
              {totalEmployees} <span className="text-xs text-slate-400 font-bold">명</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50/50">
            <Scale className="w-8 h-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4 text-left">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-extrabold block">위법 한도 초과</span>
            <span className="text-2xl font-black text-rose-550 font-mono">
              {criticalCount} <span className="text-xs text-rose-350 font-bold">명</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50/50">
            <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4 text-left">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-extrabold block">근태 이탈 주의</span>
            <span className="text-2xl font-black text-amber-550 font-mono">
              {warningCount} <span className="text-xs text-amber-300 font-bold">명</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/50">
            <AlertCircle className="w-8 h-8 text-amber-500" />
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
