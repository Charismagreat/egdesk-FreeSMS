"use client";

import React from "react";
import { useProductionPlan } from "./hooks/useProductionPlan";
import GanttChartCard from "./components/GanttChartCard";
import BottleneckAnalysisCard from "./components/BottleneckAnalysisCard";
import OrderMatchCard from "./components/OrderMatchCard";
import { CalendarDays, RefreshCw, CheckCircle, AlertOctagon, AlertTriangle } from "lucide-react";

/**
 * 생산 계획 AI (APS) 관제 대시보드 메인 페이지
 */
export default function ProductionPlanPage() {
  const {
    isLoading,
    toast,
    ganttTasks,
    unscheduledOrders,
    bottlenecks,
    dueRiskAnalysis,
    selectedOrderId,
    setSelectedOrderId,
    selectedEqId,
    setSelectedEqId,
    startHour,
    setStartHour,
    duration,
    setDuration,
    isFormOpen,
    setIsFormOpen,
    handleReschedule,
    handleScheduleOrder,
    fetchPlanData,
  } = useProductionPlan();

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
            <CalendarDays className="w-8 h-8 text-indigo-500 mr-3 animate-pulse" />
            생산 계획 AI
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            수주 주문, 설비 가동 상태 및 작업자 일정을 연동한 최적 생산 스케줄링(APS) 관제 대시보드
          </p>
        </div>

        {/* 새로고침 수동 버튼 */}
        <button 
          onClick={fetchPlanData}
          className="flex items-center gap-1.5 px-4.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold shadow-2xs transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          실시간 계측 갱신
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="font-extrabold text-slate-500 text-sm">최적 생산 계획 스케줄링 연산을 처리하는 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* SVG 생산 간트 차트 컴포넌트 */}
          <GanttChartCard 
            tasks={ganttTasks} 
            onReschedule={handleReschedule} 
          />

          {/* 설비 부하 및 납기 리스크 예측 보고 컴포넌트 */}
          <BottleneckAnalysisCard 
            bottlenecks={bottlenecks} 
            dueRisk={dueRiskAnalysis} 
          />

          {/* 미배정 수주 주문 배정 컴포넌트 */}
          <OrderMatchCard
            orders={unscheduledOrders}
            isFormOpen={isFormOpen}
            onFormOpenChange={setIsFormOpen}
            selectedOrderId={selectedOrderId}
            onSelectedOrderIdChange={setSelectedOrderId}
            selectedEqId={selectedEqId}
            onSelectedEqIdChange={setSelectedEqId}
            startHour={startHour}
            onStartHourChange={setStartHour}
            duration={duration}
            onDurationChange={setDuration}
            onSubmit={handleScheduleOrder}
          />

        </div>
      )}
    </div>
  );
}
