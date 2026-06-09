"use client";

import React from "react";
import { useSafetyDetection } from "./hooks/useSafetyDetection";
import CctvMatrixCard from "./components/CctvMatrixCard";
import DangerAlertLogCard from "./components/DangerAlertLogCard";
import FactoryHotspotCard from "./components/FactoryHotspotCard";
import { ShieldAlert, RefreshCw, CheckCircle, AlertOctagon, AlertTriangle } from "lucide-react";

/**
 * 위험 감지 AI 관제 대시보드 메인 페이지
 */
export default function SafetyDetectionPage() {
  const {
    isLoading,
    toast,
    cctvs,
    dangerLogs,
    hotspots,
    handleTriggerSiren,
    handleEmergencyStop,
    fetchSafetyData,
  } = useSafetyDetection();

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 font-sans text-slate-800 animate-fade-in text-left" data-easybot-hint="위험 감지 AI: 비전 AI 기반 위험 현장 실시간 침범 모니터링 및 즉시 비상 SMS 경보 발생 내역을 관제합니다.">
      
      {/* 🛎️ 알림 토스트 */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
          toast.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-250' :
          'bg-amber-50 text-amber-700 border-amber-250'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-650" />}
          {toast.type === 'error' && <AlertOctagon className="w-5 h-5 text-rose-650" />}
          {toast.type === 'warn' && <AlertTriangle className="w-5 h-5 text-amber-650" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* 헤더 및 타이틀 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center tracking-tight">
            <ShieldAlert className="w-8 h-8 text-rose-600 mr-3 animate-pulse" />
            위험 감지 AI
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            작업장 CCTV 실시간 Vision AI 해독, 안전보호구 미착용/쓰러짐 감지 및 비상 셧다운 안전 관제 센터
          </p>
        </div>

        {/* 새로고침 수동 버튼 */}
        <button 
          onClick={fetchSafetyData}
          className="flex items-center gap-1.5 px-4.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold shadow-2xs transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          실시간 관제 갱신
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-rose-500 animate-spin" />
          <p className="font-extrabold text-slate-500 text-sm">작업장 안전 CCTV 분석 스트리밍 및 로그를 분석하는 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 1. 실시간 IP CCTV 멀티뷰어 컴포넌트 */}
          <CctvMatrixCard cctvs={cctvs} />

          {/* 2. 누적 안전 핫스팟 및 평면도 */}
          <FactoryHotspotCard 
            hotspots={hotspots} 
            onEmergencyStop={handleEmergencyStop} 
          />

          {/* 3. 위험 알림 이벤트 로그 감사 대장 */}
          <DangerAlertLogCard
            logs={dangerLogs}
            onTriggerSiren={handleTriggerSiren}
            onEmergencyStop={handleEmergencyStop}
          />

        </div>
      )}
    </div>
  );
}
