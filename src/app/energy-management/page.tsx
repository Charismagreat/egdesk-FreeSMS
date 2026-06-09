"use client";

import React from "react";
import { useEnergyManagement } from "./hooks/useEnergyManagement";
import PowerLoadForecastCard from "./components/PowerLoadForecastCard";
import EquipmentPowerCard from "./components/EquipmentPowerCard";
import EnergySavingGuideCard from "./components/EnergySavingGuideCard";
import { Zap, RefreshCw, CheckCircle, AlertOctagon, AlertTriangle } from "lucide-react";

/**
 * 에너지 관리 AI 관제 대시보드 메인 페이지
 */
export default function EnergyManagementPage() {
  const {
    isLoading,
    toast,
    powerPoints,
    equipments,
    recommendations,
    contractPower,
    currentPeak,
    handleApplySaving,
    handleToggleShutdown,
    fetchEnergyData,
  } = useEnergyManagement();

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 font-sans text-slate-800 animate-fade-in text-left" data-easybot-hint="에너지 관리 AI: 한전 최대 부하(피크) 요금 회피를 위한 전력 사용량 분석 및 공장 절감 가이드입니다.">
      
      {/* 🛎️ 알림 토스트 */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
          toast.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-250' :
          'bg-amber-50 text-amber-700 border-amber-250'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
          {toast.type === 'error' && <AlertOctagon className="w-5 h-5 text-rose-600" />}
          {toast.type === 'warn' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* 헤더 및 타이틀 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center tracking-tight">
            <Zap className="w-8 h-8 text-amber-500 mr-3 animate-pulse fill-amber-400" />
            에너지 관리 AI
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            공장 전력 부하 실시간 예측, 한국전력공사 차등 요금제 기준 피크 회피 및 설비 요금 최적화 시스템
          </p>
        </div>

        {/* 새로고침 수동 버튼 */}
        <button 
          onClick={fetchEnergyData}
          className="flex items-center gap-1.5 px-4.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold shadow-2xs transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          실시간 계측 갱신
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="font-extrabold text-slate-500 text-sm">에너지 예측 및 가동 효율 시뮬레이션 데이터를 산출 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 1. 전력 실제 소모량 및 AI 예측 시계열 곡선 차트 */}
          <PowerLoadForecastCard
            powerPoints={powerPoints}
            contractPower={contractPower}
            currentPeak={currentPeak}
          />

          {/* 2. 설비별 소비 전력 및 예상 요금 대장 */}
          <EquipmentPowerCard
            equipments={equipments}
            onToggleShutdown={handleToggleShutdown}
          />

          {/* 3. AI 기반 전력 피크 회피 및 에너지 비용 절감 추천 리스트 */}
          <EnergySavingGuideCard
            recommendations={recommendations}
            onApplySaving={handleApplySaving}
          />

        </div>
      )}
    </div>
  );
}
