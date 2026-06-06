"use client";

import React, { useState } from "react";
import { useMobileLabor } from "./hooks/useMobileLabor";
import MobileLaborTrackerCard from "./components/MobileLaborTrackerCard";
import { ShieldAlert, CheckCircle2, ChevronLeft, Scale, RefreshCw } from "lucide-react";
import Link from "next/link";

/**
 * 모바일 노무 관리 AI 리스크 관제 메인 페이지
 */
export default function MobileLaborManagementPage() {
  const {
    isLoading,
    toast,
    stats,
    getWarningSmsText,
    fetchLaborData,
  } = useMobileLabor();

  const [filterType, setFilterType] = useState<"all" | "warnings">("all");

  const displayedStats = stats.filter((s) => {
    if (filterType === "warnings") return s.riskLevel !== "SAFE";
    return true;
  });

  const criticalCount = stats.filter(s => s.riskLevel === "CRITICAL").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      
      {/* 1. 모바일 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-150 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/m"
            className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="text-left">
            <h1 className="text-xs font-black text-slate-800">노무 관리 AI</h1>
            <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">Mobile Labor Tracker</p>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={fetchLaborData}
          className="p-1.5 rounded-lg text-slate-450 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 2. 콘텐츠 영역 */}
      <div className="flex-1 p-4 space-y-4 max-w-md mx-auto w-full">
        
        {/* 요약 비상 경고 배너 */}
        <div className={`rounded-2xl p-4 text-left border flex items-center gap-3 ${
          criticalCount > 0
            ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/10"
            : "bg-indigo-900 text-white border-indigo-950 shadow-md shadow-indigo-950/10"
        }`}>
          <div className="p-2 rounded-xl bg-white/10 shrink-0">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-[11px] font-black">
              {criticalCount > 0 ? "근로시간 위반 위험 감지!" : "전사 노무 리스크 안정 상태"}
            </h3>
            <p className="text-[8.5px] opacity-80 font-bold">
              {criticalCount > 0
                ? `현재 주 52시간 한도를 초과할 위험이 있는 근무자가 ${criticalCount}명 발견되었습니다.`
                : "실시간 모니터링 중인 근로 시간 중 법적 제한 이탈 위험이 발견되지 않았습니다."}
            </p>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-100/50">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`flex-1 py-1.5 text-[9.5px] font-black rounded-lg transition-colors ${
              filterType === "all" ? "bg-white text-slate-850 shadow-2xs" : "text-slate-500"
            }`}
          >
            전체 근무자 ({stats.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("warnings")}
            className={`flex-1 py-1.5 text-[9.5px] font-black rounded-lg transition-colors ${
              filterType === "warnings" ? "bg-white text-slate-850 shadow-2xs" : "text-slate-500"
            }`}
          >
            근태 관리 위험군 ({stats.filter(s => s.riskLevel !== "SAFE").length})
          </button>
        </div>

        {/* 근태 대장 목록 */}
        <div className="space-y-3.5">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-650 border-t-transparent rounded-full animate-spin" />
              <p className="text-[9.5px] text-slate-400 font-bold">모바일 근태 진단 데이터를 가져오고 있습니다...</p>
            </div>
          ) : displayedStats.length === 0 ? (
            <div className="py-16 text-center text-[10px] font-bold text-slate-400 bg-white rounded-2xl border border-slate-200">
              현재 필터링 조건에 부합하는 근무자가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {displayedStats.map((emp) => (
                <MobileLaborTrackerCard
                  key={emp.id}
                  empStat={emp}
                  getSmsText={getWarningSmsText}
                />
              ))}
            </div>
          )}
        </div>

        {/* 가이드 메시지 */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 text-[8.5px] font-bold text-slate-500 text-left space-y-1">
          <span className="block text-slate-700 font-black">💡 모바일 노무 경고 대응 안내</span>
          <p>
            • 본 화면은 출퇴근 타임스탬프를 실시간 스캔하여 연장근로 한도를 갱신합니다.
          </p>
          <p>
            • 주 52시간 한도를 초과할 경우 근로기준법상 즉각적인 처벌 대상이 되므로, 위반 위험 감지 시 원클릭 SMS로 근무자에게 즉시 시정 조치를 하달하십시오.
          </p>
        </div>

      </div>

      {/* 토스트 알림 팝업 */}
      {toast && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-fade-in">
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-lg text-left border ${
            toast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-rose-600 text-white border-rose-700"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            )}
            <p className="text-[9.5px] font-black">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}
