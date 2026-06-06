"use client";

import React from "react";
import { useMobileSafety } from "./hooks/useMobileSafety";
import MobileDangerAlertCard from "./components/MobileDangerAlertCard";
import { ShieldAlert, CheckCircle, AlertOctagon, AlertTriangle, RefreshCw } from "lucide-react";

/**
 * 모바일 위험 감지 관제 메인 페이지
 */
export default function MobileSafetyDetectionPage() {
  const {
    isLoading,
    toast,
    cctvs,
    dangerLogs,
    activeDanger,
    isEmergency,
    handleTriggerSiren,
    handleEmergencyStop,
    fetchSafetyData,
  } = useMobileSafety();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-start w-full relative">
      
      {/* 🛎️ 모바일 전용 토스트 알림 */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-55 p-3.5 rounded-2xl shadow-xl border flex items-center gap-2.5 animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' :
          toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-250' :
          'bg-amber-50 text-amber-800 border-amber-250'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <AlertOctagon className="w-4.5 h-4.5 text-rose-600 shrink-0" />}
          {toast.type === 'warn' && <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />}
          <span className="text-[10px] font-black leading-snug">{toast.message}</span>
        </div>
      )}

      {/* 모바일 상단 헤더 바 */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 flex items-center justify-between sticky top-0 z-40 text-left">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">위험 감지 AI 모바일 관제</h1>
            <p className="text-[8px] text-slate-500 font-extrabold mt-0.5">EGDESK Smart Vision Safety Mobile</p>
          </div>
        </div>

        {/* 실시간 리로드 버튼 */}
        <button 
          onClick={fetchSafetyData}
          className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 모바일 메인 바디 */}
      <div className="flex-1 p-4 overflow-y-auto max-w-lg mx-auto w-full pb-16 space-y-5">
        
        {isLoading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
            <p className="font-bold text-slate-500 text-[10px]">실시간 안전 관제 정보를 가져오는 중...</p>
          </div>
        ) : (
          <MobileDangerAlertCard
            cctvs={cctvs}
            dangerLogs={dangerLogs}
            activeDanger={activeDanger}
            isEmergency={isEmergency}
            onTriggerSiren={handleTriggerSiren}
            onEmergencyStop={handleEmergencyStop}
          />
        )}

      </div>

      {/* 모바일 하단 카피라이트 */}
      <div className="py-4.5 text-center border-t border-slate-800 bg-slate-900 text-slate-600 text-[8px] font-black">
        © 2026 EGDESK VISION SAFETY. ALL RIGHTS RESERVED.
      </div>
      
    </div>
  );
}
