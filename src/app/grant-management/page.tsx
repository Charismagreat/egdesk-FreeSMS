"use client";

import React from "react";
import { useGrantManagement } from "./hooks/useGrantManagement";
import GrantMatchCard from "./components/GrantMatchCard";
import RndPlanBuilderCard from "./components/RndPlanBuilderCard";
import { AlertCircle, CheckCircle2, ShieldAlert, Sparkles, Award } from "lucide-react";

/**
 * 지원금 관리 AI (AI Grant Hunter) 메인 대시보드
 */
export default function GrantManagementPage() {
  const {
    isLoading,
    isGenerating,
    toast,
    announcements,
    companyProfile,
    selectedAnnId,
    rndPlan,
    handleToggleBookmark,
    handleGenerateRndPlan,
    handleUpdateSection,
    handleExportCsv,
  } = useGrantManagement();

  const bookmarkedCount = announcements.filter((a) => a.isBookmarked).length;
  const averageMatch = Math.round(
    announcements.reduce((acc, curr) => acc + curr.matchScore, 0) / (announcements.length || 1)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* --- 상단 헤더 섹션 (Wow 디자인) --- */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* 장식용 오로라 구체 */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide">
                <Sparkles className="w-3 h-3 text-indigo-400" /> AI Grant Hunter Engine
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">지원금 관리 AI</h1>
            <p className="text-xs text-indigo-200/80 font-bold max-w-xl">
              정부 지원 사업(보조금, R&D 과제) 공고를 실시간 스캔하여 당사 프로필과 매칭하고, 혁신성장 R&D 과제 계획서의 핵심 원고 초안을 인공지능이 즉석에서 설계해 줍니다.
            </p>
          </div>

          {/* 주요 통계 요약 (Dashboard Hero Stats) */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 text-left">
            <div>
              <span className="block text-[8px] text-indigo-300 font-black">매칭 대상 공고</span>
              <span className="text-sm md:text-base font-black font-mono text-white">
                {announcements.length} <span className="text-[10px] text-indigo-200">건</span>
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-amber-300 font-black">관심 보관함</span>
              <span className="text-sm md:text-base font-black font-mono text-amber-400">
                {bookmarkedCount} <span className="text-[10px] text-amber-300">건</span>
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-emerald-300 font-black">평균 매칭 적합도</span>
              <span className="text-sm md:text-base font-black font-mono text-emerald-400">
                {averageMatch}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 로딩 표시 */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold">정부 혜택 및 지원 사업 공고를 동기화 중입니다...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 좌측: 공고 목록 */}
          <div className="lg:col-span-6">
            <GrantMatchCard
              announcements={announcements}
              companyProfile={companyProfile}
              onToggleBookmark={handleToggleBookmark}
              onGenerateRndPlan={handleGenerateRndPlan}
              selectedAnnId={selectedAnnId}
              isGenerating={isGenerating}
            />
          </div>

          {/* 우측: R&D 사업계획서 빌더 */}
          <div className="lg:col-span-6">
            <RndPlanBuilderCard
              announcements={announcements}
              rndPlan={rndPlan}
              isGenerating={isGenerating}
              onUpdateSection={handleUpdateSection}
              onExportCsv={handleExportCsv}
            />
          </div>
        </div>
      )}

      {/* 토스트 알림 팝업 */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-left border ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-650 shrink-0" />
            ) : toast.type === "error" ? (
              <ShieldAlert className="w-5 h-5 text-rose-650 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-650 shrink-0" />
            )}
            <div>
              <span className="block text-[10px] font-bold">
                {toast.type === "success" ? "작업 성공" : toast.type === "error" ? "오류 발생" : "알림 경고"}
              </span>
              <p className="text-[10px] font-black mt-0.5">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
