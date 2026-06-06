"use client";

import React from "react";
import { useFacilityManagement } from "./hooks/useFacilityManagement";
import PredictiveMaintenanceCard from "./components/PredictiveMaintenanceCard";
import OeeMetricsCard from "./components/OeeMetricsCard";
import MaintenanceCalendarCard from "./components/MaintenanceCalendarCard";
import RepairLogCard from "./components/RepairLogCard";
import { Wrench, RefreshCw, CheckCircle, AlertOctagon, AlertTriangle } from "lucide-react";

/**
 * 중소 제조업을 위한 설비 관리 AI (Predictive Maintenance & CMMS) PC용 관제 메인 페이지
 */
export default function FacilityManagementPage() {
  const {
    isLoading,
    toast,
    predictiveStatus,
    oeeData,
    events,
    partInventories,
    repairLogs,
    searchQuery,
    setSearchQuery,
    chatInput,
    setChatInput,
    chatAnswer,
    setChatAnswer,
    isChatLoading,
    isFormOpen,
    setIsFormOpen,
    selectedEqId,
    setSelectedEqId,
    errorCode,
    setErrorCode,
    symptom,
    setSymptom,
    repairDesc,
    setRepairDesc,
    cost,
    setCost,
    isSavingLog,
    isRecording,
    handleChatSearch,
    handleVoiceSttTrigger,
    handleSaveRepairLog,
    fetchAllData,
  } = useFacilityManagement();

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 font-sans text-slate-800 animate-fade-in text-left">
      
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
            <Wrench className="w-8 h-8 text-indigo-500 mr-3 animate-pulse" />
            설비 관리 AI
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            진동 센서 기반 예지 보전(PdM) 및 실시간 가동 효율(OEE), CMMS 통합 자산 관리 시스템
          </p>
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
          <p className="font-extrabold text-slate-500 text-sm">설비 및 센서 데이터를 가져오고 분석 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 1. 예지 보전 카드 (진동 RMS, FFT 주파수 스펙트럼, LSTM 수명 예측) */}
          <PredictiveMaintenanceCard status={predictiveStatus} />

          {/* 2. OEE 효율 지표 및 가동 현황 레이아웃 카드 */}
          <OeeMetricsCard data={oeeData} />

          {/* 3. 예방 정비 스케줄 및 부품 재고 관리 */}
          <MaintenanceCalendarCard events={events} partInventories={partInventories} />

          {/* 4. 설비 수리 대장 및 RAG 지능형 해결사 챗봇 */}
          <RepairLogCard
            logs={repairLogs}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            chatAnswer={chatAnswer}
            onChatAnswerChange={setChatAnswer}
            isChatLoading={isChatLoading}
            isFormOpen={isFormOpen}
            onFormOpenChange={setIsFormOpen}
            selectedEqId={selectedEqId}
            onSelectedEqIdChange={setSelectedEqId}
            errorCode={errorCode}
            onErrorCodeChange={setErrorCode}
            symptom={symptom}
            onSymptomChange={setSymptom}
            repairDesc={repairDesc}
            onRepairDescChange={setRepairDesc}
            cost={cost}
            onCostChange={setCost}
            isSavingLog={isSavingLog}
            isRecording={isRecording}
            onChatSearch={handleChatSearch}
            onVoiceSttTrigger={handleVoiceSttTrigger}
            onSaveRepairLog={handleSaveRepairLog}
          />

        </div>
      )}
    </div>
  );
}
