"use client";

import React from "react";
import { useQualityControl } from "./hooks/useQualityControl";
import VisionAnomalyCard from "./components/VisionAnomalyCard";
import SpcControlChart from "./components/SpcControlChart";
import SensorAnomalyCard from "./components/SensorAnomalyCard";
import NcrCapaTimeline from "./components/NcrCapaTimeline";
import QualitySettingsCard from "./components/QualitySettingsCard";
import { Shield, RefreshCw, CheckCircle, AlertOctagon, AlertTriangle } from "lucide-react";

export default function QualityControlPage() {
  const {
    isLoading,
    toast,
    visionModel,
    visionLogs,
    isRetraining,
    spcConfig,
    spcSamples,
    spcPredictions,
    currentCpk,
    cpkStatus,
    futureRisk,
    featureImportance,
    sensorStatus,
    sensorContributions,
    sensorTimeline,
    ncrList,
    similarCases,
    searchQuery,
    setSearchQuery,
    selectedNcr,
    setSelectedNcr,
    actionDescription,
    setActionDescription,
    isNcrSaving,
    handleRetrainModel,
    handleUpdateThreshold,
    handleSaveCapaAction,
    fetchAllData,
  } = useQualityControl();

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 font-sans text-slate-800 animate-fade-in text-left" data-easybot-hint="품질 관리 AI: 공정별 불량 통계, 공정 능력 지수(Cp/Cpk) 모니터링 및 NCR 불량 조치 현황을 기록합니다.">
      
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
            <Shield className="w-8 h-8 text-indigo-500 mr-3 animate-pulse" />
            품질 관리 AI
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">지능형 비전 불량 검출 및 통계 공정 제어(SPC) 통합 관제 시스템</p>
        </div>

        {/* 새로고침 수동 버튼 */}
        <button 
          onClick={fetchAllData}
          className="flex items-center gap-1.5 px-4.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold shadow-2xs transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          실시간 계측 갱신
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="font-extrabold text-slate-500 text-sm">스마트 품질 관제 데이터를 분석하는 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* SPC 공정 능력 지수 관리도 & 예측 */}
          <SpcControlChart
            config={spcConfig}
            samples={spcSamples}
            predictions={spcPredictions}
            currentCpk={currentCpk}
            cpkStatus={cpkStatus}
            futureRisk={futureRisk}
            featureImportance={featureImportance}
          />

          {/* 비전 검사 & 설비 센서 이상 탐지 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VisionAnomalyCard
              modelStatus={visionModel}
              logs={visionLogs}
              isRetraining={isRetraining}
              onRetrain={handleRetrainModel}
            />

            <div className="space-y-6">
              <SensorAnomalyCard
                status={sensorStatus}
                contributions={sensorContributions}
                timeline={sensorTimeline}
              />
              
              <QualitySettingsCard
                modelStatus={visionModel}
                onUpdateThreshold={handleUpdateThreshold}
              />
            </div>
          </div>

          {/* 부적합 보고서 NCR & CAPA 수립 관리 */}
          <NcrCapaTimeline
            ncrList={ncrList}
            similarCases={similarCases}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedNcr={selectedNcr}
            onSelectNcr={setSelectedNcr}
            actionDescription={actionDescription}
            onActionDescriptionChange={setActionDescription}
            isSaving={isNcrSaving}
            onSaveAction={handleSaveCapaAction}
          />

        </div>
      )}
    </div>
  );
}
