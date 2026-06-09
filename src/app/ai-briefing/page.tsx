"use client";

import React from "react";
import { Sparkles, ShieldAlert, RefreshCw, Database } from "lucide-react";
import { useAIBriefing } from "./hooks/useAIBriefing";
import { Header } from "./components/Header";
import { ReportCard } from "./components/ReportCard";

export default function AIBriefingDashboardPage() {
  const {
    reports,
    isLoading,
    updatingReportId,
    cardSpans,
    openMenuId,
    setOpenMenuId,
    hiddenBriefingIds,
    editingReportId,
    setEditingReportId,
    tempTitle,
    setTempTitle,
    toast,
    handleToggleCardSpan,
    handleToggleBriefingVisibility,
    fetchReports,
    handleSaveTitle,
    handleDeleteReport,
    handleMoveOrder,
    handleRefreshReport,
    handleDownloadPng,
    handleDownloadExcel,
    handleToggleShareActive,
    handleCycleInterval,
    handleGoToEditQuery,
    isSuperAdmin,
    showToast
  } = useAIBriefing();

  if (!isLoading && !isSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4 select-none" data-easybot-hint="AI 브리핑: 사내 핵심 비즈니스 지표와 핀 고정 보고서들을 기반으로 한 종합 경영 관제 대시보드입니다.">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm animate-bounce">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-base font-black text-rose-700">대시보드 권한 격리망 작동</h2>
          <p className="text-xs text-slate-450 leading-relaxed font-bold">
            본 'AI 브리핑' 관제 플랫폼은 기밀 비즈니스 지표가 포함되어 있어, 오직 **최고관리자 (SUPER_ADMIN)** 등급 계정으로만 접근 및 제어가 허용됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 bg-slate-50/30 p-2 rounded-3xl min-w-0">
      
      {/* 🛎️ 알림 토스트 컴포넌트 */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[120] p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
          toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
          'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <Sparkles className="w-5 h-5 text-indigo-550 shrink-0" />
          <span className="text-xs font-black">{toast.message}</span>
        </div>
      )}

      <Header
        isLoading={isLoading}
        onRefresh={fetchReports}
      />

      {isLoading ? (
        <div className="py-28 text-center flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-indigo-650 animate-spin" />
          <p className="font-extrabold text-slate-500 text-sm">최고관리자 지능형 관제 데이터 로딩 중...</p>
        </div>
      ) : reports.length === 0 ? (
        // 웰컴 가이드 (Empty State)
        <div className="p-16 bg-white border border-slate-100 rounded-3xl text-center space-y-5 max-w-xl mx-auto shadow-sm select-none animate-zoom-in">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto">
            <Database className="w-6 h-6 text-indigo-650" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-black text-slate-850">AI 브리핑 종합 대시보드에 보고서를 채워주세요</h3>
            <p className="text-xs text-slate-450 leading-relaxed font-bold">
              현재 최고관리자님께서 핀 고정 수집해두신 AI 보고서가 없습니다.<br />
              **[MY DB]** SQL 플레이그라운드 콘솔에서 데이터 분석 쿼리를 돌린 뒤, 생성되는 통합 보고서 상단의 **`📌 핀 고정`** 단추를 누르시면 이 공간이 격조 높은 지능형 기업 보고서들로 화사하게 채워집니다!
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.href = "/my-db"}
            className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-black border-none shadow-3xs cursor-pointer active:scale-95 transition-all"
          >
            🚀 MY DB 분석 실행하러 가기
          </button>
        </div>
      ) : (
        // 웅장한 종합 BI 보고서 목록 렌더링
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full px-4 sm:px-6">
          {reports.map((board, index) => (
            <ReportCard
              key={board.share_id}
              board={board}
              index={index}
              reportsLength={reports.length}
              isEditing={editingReportId === board.share_id}
              isUpdating={updatingReportId === board.share_id}
              cardSpan={cardSpans[board.share_id] || 2}
              openMenuId={openMenuId}
              hiddenBriefing={!!hiddenBriefingIds[board.share_id]}
              tempTitle={tempTitle}
              setTempTitle={setTempTitle}
              setEditingReportId={setEditingReportId}
              setOpenMenuId={setOpenMenuId}
              handleMoveOrder={handleMoveOrder}
              handleSaveTitle={handleSaveTitle}
              handleToggleBriefingVisibility={handleToggleBriefingVisibility}
              handleToggleCardSpan={handleToggleCardSpan}
              handleToggleShareActive={handleToggleShareActive}
              handleCycleInterval={handleCycleInterval}
              handleDownloadExcel={handleDownloadExcel}
              handleDownloadPng={handleDownloadPng}
              handleRefreshReport={handleRefreshReport}
              handleGoToEditQuery={handleGoToEditQuery}
              handleDeleteReport={handleDeleteReport}
              showToast={showToast}
            />
          ))}
        </div>
      )}

    </div>
  );
}
