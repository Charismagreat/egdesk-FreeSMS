"use client";

import React from "react";
import { useMobileScm } from "./hooks/useMobileScm";
import MobileScmTrackerCard from "./components/MobileScmTrackerCard";
import { ShieldAlert, CheckCircle2, ChevronLeft, Globe, RefreshCw } from "lucide-react";
import Link from "next/link";

/**
 * 모바일 조달 채널 SCM 리스크 모니터링 메인 페이지
 */
export default function MobileScmManagementPage() {
  const {
    isLoading,
    toast,
    shipments,
    handleUpdateTracking,
    getUrgentSmsText,
    fetchScmData,
  } = useMobileScm();

  const criticalCount = shipments.filter((s) => s.risk === "CRITICAL").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      
      {/* 1. 모바일 앱 스타일 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-150 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/m"
            className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="text-left">
            <h1 className="text-xs font-black text-slate-800">공급망 관리 AI</h1>
            <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">Mobile Logistics Tracker</p>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={fetchScmData}
          className="p-1.5 rounded-lg text-slate-450 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 2. 메인 컨텐츠 영역 */}
      <div className="flex-1 p-4 space-y-4 max-w-md mx-auto w-full">
        
        {/* 실시간 위험 경고 배너 */}
        <div className={`rounded-2xl p-4 text-left border flex items-center gap-3 ${
          criticalCount > 0
            ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/10"
            : "bg-indigo-900 text-white border-indigo-950 shadow-md shadow-indigo-950/10"
        }`}>
          <div className="p-2 rounded-xl bg-white/10 shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-[11px] font-black">
              {criticalCount > 0 ? "조달 지연 위험이 감지되었습니다!" : "현재 원자재 조달 정상 작동 중"}
            </h3>
            <p className="text-[8.5px] opacity-80 font-bold">
              {criticalCount > 0
                ? `현재 ${criticalCount}건의 원자재 이송에 지연 리스크가 있습니다. 긴급 조치를 취하십시오.`
                : "실시간 모니터링 중인 모든 조달 화물의 배송 흐름이 원활합니다."}
            </p>
          </div>
        </div>

        {/* 화물 리스트 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[9px] font-black text-slate-450 uppercase px-1">
            <span>실시간 모니터링 대장 ({shipments.length}건)</span>
            <span>지연 주의: {shipments.filter(s => s.risk === "WARNING").length}건</span>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-650 border-t-transparent rounded-full animate-spin" />
              <p className="text-[9.5px] text-slate-400 font-bold">모바일 관제 데이터를 가져오고 있습니다...</p>
            </div>
          ) : shipments.length === 0 ? (
            <div className="py-16 text-center text-[10px] font-bold text-slate-400 bg-white rounded-2xl border border-slate-200">
              조니터링 중인 조달 원자재가 없습니다.
            </div>
          ) : (
            <div className="space-y-3.5">
              {shipments.map((ship) => (
                <MobileScmTrackerCard
                  key={ship.id}
                  shipment={ship}
                  onUpdateStatus={handleUpdateTracking}
                  getSmsText={getUrgentSmsText}
                />
              ))}
            </div>
          )}
        </div>

        {/* 알림 가이드 */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 text-[8.5px] font-bold text-slate-500 text-left space-y-1">
          <span className="block text-slate-700 font-black">💡 모바일 물류 관제 노선 가이드</span>
          <p>
            • 본 페이지는 현장 모바일 최적화 화면으로 세관 통관 및 입고 단계를 터치 한 번으로 즉시 변경할 수 있습니다.
          </p>
          <p>
            • 지연 확률이 80%를 상회할 시 PC 대시보드에서 대체 공급업체 우회 매칭 기능을 활성화하시길 권장합니다.
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
