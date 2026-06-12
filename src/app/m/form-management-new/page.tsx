"use client";

import React from "react";
import { useMobileForm } from "./hooks/useMobileForm";
import MobileFormSelector from "./components/MobileFormSelector";
import MobileFormIssuer from "./components/MobileFormIssuer";
import { ChevronLeft, ClipboardList, CheckCircle2, ShieldAlert, Activity } from "lucide-react";
import Link from "next/link";

export default function MobileFormManagementPage() {
  const {
    templates,
    operator,
    loading,
    issuerLoading,
    error,
    selectedTemplate,
    setSelectedTemplate,
    manualData,
    handleFieldChange,
    handleExecutePrint,
    toast
  } = useMobileForm();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans">
      
      {/* 1. 모바일 공통 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-150 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/m"
            className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="text-left">
            <h1 className="text-xs font-black text-slate-800">모바일 양식 발급 AI</h1>
            <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">Mobile Form Issuer</p>
          </div>
        </div>
        
        <div className="p-1.5 rounded-lg text-slate-400">
          <ClipboardList className="w-4 h-4" />
        </div>
      </div>

      {/* 2. 콘텐츠 컨테이너 */}
      <div className="flex-1 p-4 space-y-4 max-w-md mx-auto w-full">
        
        {/* 임직원 매핑 환영 비상 배너 */}
        {operator && !selectedTemplate && (
          <div className="rounded-2xl p-4 text-left border bg-indigo-900 text-white border-indigo-950 shadow-md shadow-indigo-950/10 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 shrink-0">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-[11px] font-black">
                {operator.name} {operator.position}님 환영합니다.
              </h3>
              <p className="text-[8px] opacity-80 font-bold">
                본인 전용 증명서 발급 채널입니다. 발급을 원하는 서류를 아래 목록에서 탭하십시오.
              </p>
            </div>
          </div>
        )}

        {/* 메인 로딩 및 에러 스크린 */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Activity className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-[9.5px] text-slate-400 font-bold">임직원 서류 발급 데이터를 불러오고 있습니다...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl flex flex-col items-center gap-2 text-center">
            <ShieldAlert className="w-8 h-8 shrink-0 text-red-500 mb-1" />
            <span className="text-xs font-black">데이터 로드 실패</span>
            <p className="text-[9px] font-bold text-slate-450 leading-relaxed">{error}</p>
            <Link
              href="/m"
              className="mt-3 bg-red-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold"
            >
              홈으로 가기
            </Link>
          </div>
        ) : (
          <div className="animate-fade-in">
            {selectedTemplate ? (
              <MobileFormIssuer
                template={selectedTemplate}
                operator={operator}
                manualData={manualData}
                onBack={() => setSelectedTemplate(null)}
                onFieldChange={handleFieldChange}
                onSubmit={handleExecutePrint}
                isLoading={issuerLoading}
              />
            ) : (
              <MobileFormSelector
                templates={templates}
                onSelect={setSelectedTemplate}
              />
            )}
          </div>
        )}

      </div>

      {/* 3. 플로팅 토스트 피드백 */}
      {toast && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-fade-in select-none">
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
            <span className="text-[9.5px] font-extrabold text-white leading-tight">
              {toast.message}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
