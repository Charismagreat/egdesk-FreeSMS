"use client";

import React from "react";

// 리팩토링된 신규 컴포넌트 및 훅 수입
import { useEcountErp } from "./hooks/useEcountErp";
import EcountHeader from "./components/EcountHeader";
import EcountFilterBar from "./components/EcountFilterBar";
import EcountScriptList from "./components/EcountScriptList";
import EcountScheduleFeed from "./components/EcountScheduleFeed";
import AutopilotController from "./components/AutopilotController";

export default function EcountErpAiPage() {
  const {
    loading,
    selectedScript,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    quickRange,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isExecuting,
    executionStep,
    executionLog,
    executionSuccess,
    isSimulation,
    schedules,
    schedulesLoading,
    periodPreset,
    setPeriodPreset,
    runTime,
    setRunTime,
    creatingTable,
    selectedWeekDays,
    setSelectedWeekDays,
    selectedMonthDay,
    setSelectedMonthDay,
    syncDaysRange,
    setSyncDaysRange,
    categories,
    filteredScripts,
    fetchScripts,
    applyQuickRange,
    handleSelectScript,
    handleExecuteRpa,
    handleCreateTable,
    fetchSchedules,
    handleCreateSchedule,
    handleToggleSchedule,
    handleDeleteSchedule,
  } = useEcountErp();

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 font-sans text-slate-800">
      
      {/* 1. 상단 헤더 영역 */}
      <EcountHeader fetchScripts={fetchScripts} />

      {/* 2. 대시보드 본문 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 좌측 2개 컬럼: 스크립트 라이브러리 및 스케줄 피드 */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 검색 및 필터 바 */}
          <EcountFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          {/* 스크립트 리스트 카드 그리드 */}
          <EcountScriptList
            loading={loading}
            filteredScripts={filteredScripts}
            selectedScript={selectedScript}
            handleSelectScript={handleSelectScript}
            creatingTable={creatingTable}
            handleCreateTable={handleCreateTable}
          />

          {/* 실시간 자동화 스케줄 감시 피드 */}
          <EcountScheduleFeed
            schedules={schedules}
            schedulesLoading={schedulesLoading}
            fetchSchedules={fetchSchedules}
            handleToggleSchedule={handleToggleSchedule}
            handleDeleteSchedule={handleDeleteSchedule}
          />

        </div>

        {/* 우측 1개 컬럼: Autopilot Play Console & Parameter Panel */}
        <AutopilotController
          selectedScript={selectedScript}
          quickRange={quickRange}
          applyQuickRange={applyQuickRange}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          isExecuting={isExecuting}
          handleExecuteRpa={handleExecuteRpa}
          creatingTable={creatingTable}
          handleCreateTable={handleCreateTable}
          executionStep={executionStep}
          executionLog={executionLog}
          executionSuccess={executionSuccess}
          isSimulation={isSimulation}
          periodPreset={periodPreset}
          setPeriodPreset={setPeriodPreset}
          runTime={runTime}
          setRunTime={setRunTime}
          selectedWeekDays={selectedWeekDays}
          setSelectedWeekDays={setSelectedWeekDays}
          selectedMonthDay={selectedMonthDay}
          setSelectedMonthDay={setSelectedMonthDay}
          syncDaysRange={syncDaysRange}
          setSyncDaysRange={setSyncDaysRange}
          handleCreateSchedule={handleCreateSchedule}
        />

      </div>
    </div>
  );
}
