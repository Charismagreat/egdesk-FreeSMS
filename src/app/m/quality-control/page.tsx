"use client";

import React from "react";
import { useMobileChecklist } from "./hooks/useMobileChecklist";
import MobileChecklistForm from "./components/MobileChecklistForm";
import { Shield, CheckCircle, AlertOctagon, AlertTriangle } from "lucide-react";

export default function MobileQualityControlPage() {
  const {
    lotNo,
    setLotNo,
    inspector,
    setInspector,
    checkItems,
    photoUrl,
    signature,
    setSignature,
    status,
    setStatus,
    isSubmitting,
    toast,
    handleBarcodeScan,
    handleAttachPhoto,
    handleToggleItem,
    handleSubmit,
  } = useMobileChecklist();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-start w-full relative">
      
      {/* 🛎️ 모바일 전용 토스트 알림 */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-55 p-3.5 rounded-2xl shadow-xl border flex items-center gap-2.5 animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
          'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <AlertOctagon className="w-4.5 h-4.5 text-rose-600 shrink-0" />}
          {toast.type === 'warn' && <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />}
          <span className="text-[10px] font-black leading-snug">{toast.message}</span>
        </div>
      )}

      {/* 모바일 상단 헤더 바 */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4.5 flex items-center gap-2.5 sticky top-0 z-40 text-left">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-black text-white">현장 품질 검사 모바일 센터</h1>
          <p className="text-[9px] text-slate-500 font-extrabold mt-0.5">EGDESK Smart QA Mobile Checklist</p>
        </div>
      </div>

      {/* 모바일 폼 메인 바디 */}
      <div className="flex-1 p-4 overflow-y-auto max-w-lg mx-auto w-full pb-16">
        <MobileChecklistForm
          lotNo={lotNo}
          onLotNoChange={setLotNo}
          inspector={inspector}
          onInspectorChange={setInspector}
          checkItems={checkItems}
          photoUrl={photoUrl}
          signature={signature}
          onSignatureChange={setSignature}
          status={status}
          onStatusChange={setStatus}
          isSubmitting={isSubmitting}
          onBarcodeScan={handleBarcodeScan}
          onAttachPhoto={handleAttachPhoto}
          onToggleItem={handleToggleItem}
          onSubmit={handleSubmit}
        />
      </div>

      {/* 모바일 하단 카피라이트 */}
      <div className="py-4 text-center border-t border-slate-800 bg-slate-900 text-slate-600 text-[8px] font-black">
        © 2026 EGDESK SMS. ALL RIGHTS RESERVED.
      </div>
      
    </div>
  );
}
