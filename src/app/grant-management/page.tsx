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
    <div className="space-y-6 pb-20 w-full min-w-0 font-sans text-slate-800 animate-fade-in text-left" data-easybot-hint="지원금 관리 AI: 정부 정책 무상 출연금 및 R&D 지원 정책의 자격 요건 판별과 매칭을 가이드합니다.">
      
      {/* 헤더 및 타이틀 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 flex items-center tracking-tight">
            <Award className="w-8 h-8 text-indigo-650 mr-3" />
            지원금 관리 AI
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            정부 지원 사업(보조금, R&D 과제) 공고를 실시간 스캔하여 당사 프로필과 매칭하고, 혁신성장 R&D 과제 계획서의 핵심 원고 초안을 인공지능이 즉석에서 설계해 줍니다.
          </p>
        </div>
      </div>

      {/* 주요 통계 요약 스코어카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4 text-left">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-extrabold block">매칭 대상 공고</span>
            <span className="text-2xl font-black text-slate-800 font-mono">
              {announcements.length} <span className="text-xs text-slate-400 font-bold">건</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50/50">
            <Award className="w-8 h-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4 text-left">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-extrabold block">관심 보관함</span>
            <span className="text-2xl font-black text-amber-550 font-mono">
              {bookmarkedCount} <span className="text-xs text-amber-300 font-bold">건</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/50">
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4 text-left">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-extrabold block">평균 매칭 적합도</span>
            <span className="text-2xl font-black text-emerald-650 font-mono">
              {averageMatch}%
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/50">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
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
