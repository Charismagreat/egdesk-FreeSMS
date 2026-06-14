"use client";

import React, { useState } from "react";
import { useMobileGrant } from "./hooks/useMobileGrant";
import MobileGrantTrackerCard from "./components/MobileGrantTrackerCard";
import { ShieldAlert, CheckCircle2, ChevronLeft, Award, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * 모바일 지원금 알림 및 공유 채널 메인 페이지
 */
export default function MobileGrantManagementPage() {
  const {
    isLoading,
    toast,
    announcements,
    handleToggleBookmark,
    getShareSmsText,
    fetchGrantData,
  } = useMobileGrant();

  const [filterType, setFilterType] = useState<"all" | "bookmarked">("all");

  const displayedAnnouncements = announcements.filter((ann) => {
    if (filterType === "bookmarked") return ann.isBookmarked;
    return true;
  });

  const highMatchCount = announcements.filter((a) => a.matchScore >= 90).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      
      {/* 1. 모바일 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-150 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/m"
            className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="text-left">
            <h1 className="text-xs font-black text-slate-800">지원금 신청 AI</h1>
            <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">Mobile Grant Tracker</p>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={fetchGrantData}
          className="p-1.5 rounded-lg text-slate-450 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 2. 콘텐츠 영역 */}
      <div className="flex-1 p-4 space-y-4 max-w-md mx-auto w-full">
        
        {/* 요약 배너 */}
        <div className="bg-slate-900 border border-slate-950 text-white rounded-2xl p-4 text-left flex items-center gap-3 shadow-md shadow-indigo-950/10">
          <div className="p-2 rounded-xl bg-white/10 shrink-0">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-[11px] font-black">
              {highMatchCount > 0 ? "고적합 지원 혜택이 감지되었습니다!" : "맞춤 지원금 모니터링 가동 중"}
            </h3>
            <p className="text-[8.5px] opacity-80 font-bold">
              {highMatchCount > 0
                ? `현재 적합도 90% 이상인 특화 R&D/보조금 사업이 ${highMatchCount}건 매칭되었습니다.`
                : "매일 수백 건의 지원금 공고를 모니터링하여 가이드라인을 수립합니다."}
            </p>
          </div>
        </div>

        {/* 탭 필터 */}
        <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-100/50">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`flex-1 py-1.5 text-[9.5px] font-black rounded-lg transition-colors ${
              filterType === "all" ? "bg-white text-slate-850 shadow-2xs" : "text-slate-500"
            }`}
          >
            전체 공고 ({announcements.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("bookmarked")}
            className={`flex-1 py-1.5 text-[9.5px] font-black rounded-lg transition-colors ${
              filterType === "bookmarked" ? "bg-white text-slate-850 shadow-2xs" : "text-slate-500"
            }`}
          >
            관심 보관함 ({announcements.filter(a => a.isBookmarked).length})
          </button>
        </div>

        {/* 공고 카드 목록 */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-650 border-t-transparent rounded-full animate-spin" />
              <p className="text-[9.5px] text-slate-400 font-bold">모바일 지원금 매칭 데이터를 로드 중입니다...</p>
            </div>
          ) : displayedAnnouncements.length === 0 ? (
            <div className="py-16 text-center text-[10px] font-bold text-slate-400 bg-white rounded-2xl border border-slate-200">
              {filterType === "bookmarked"
                ? "보관함에 보관된 관심 지원 공고가 없습니다."
                : "매칭 조건에 맞는 정부 지원 공고가 존재하지 않습니다."}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedAnnouncements.map((ann) => (
                <MobileGrantTrackerCard
                  key={ann.id}
                  announcement={ann}
                  onToggleBookmark={handleToggleBookmark}
                  getSmsText={getShareSmsText}
                />
              ))}
            </div>
          )}
        </div>

        {/* 안내 가이드 */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 text-[8.5px] font-bold text-slate-500 text-left space-y-1">
          <span className="block text-slate-700 font-black">💡 모바일 지원금 활용 안내</span>
          <p>
            • 본 페이지는 현장에서 빠른 지원금 기획을 돕는 모바일 관제 화면으로 관심 공고 북마크 및 사내 공유가 가능합니다.
          </p>
          <p>
            • R&D 계획서 원고 자동 작성 및 엑셀(CSV) 다운로드 기능은 PC 어드민 화면에서 기동하시기 바랍니다.
          </p>
        </div>

      </div>

      {/* 토스트 알림 팝업 */}
      {toast && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-fade-in">
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-lg text-left border ${
            toast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-rose-600 text-white border-rose-700"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            )}
            <p className="text-[9.5px] font-black">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}
