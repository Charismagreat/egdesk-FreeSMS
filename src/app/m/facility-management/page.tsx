"use client";

import React, { useState } from "react";
import { useMobileMaintenance } from "./hooks/useMobileMaintenance";
import MobileMaintenanceForm from "./components/MobileMaintenanceForm";
import { Wrench, CheckCircle, AlertOctagon, AlertTriangle, ListFilter, ClipboardList, Mic } from "lucide-react";

/**
 * 모바일 설비 예방 점검 채널 메인 페이지
 */
export default function MobileFacilityManagementPage() {
  const {
    equipmentId,
    setEquipmentId,
    inspector,
    setInspector,
    checkItems,
    signature,
    setSignature,
    audioNote,
    setAudioNote,
    status,
    setStatus,
    isSubmitting,
    isRecording,
    toast,
    history,
    isHistoryLoading,
    handleToggleItem,
    handleVoiceSttTrigger,
    handleSubmit,
  } = useMobileMaintenance();

  // 탭 상태: 'form' (점검 작성) | 'history' (점검 이력)
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

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
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4.5 flex items-center justify-between sticky top-0 z-40 text-left">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">현장 설비 점검 모바일 채널</h1>
            <p className="text-[9px] text-slate-500 font-extrabold mt-0.5">EGDESK Smart Maintenance Mobile Channel</p>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-slate-850 border-b border-slate-800 grid grid-cols-2 text-center text-xs font-black">
        <button
          onClick={() => setActiveTab('form')}
          className={`py-3 transition-colors ${
            activeTab === 'form' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-900/50' : 'text-slate-400 hover:text-white'
          }`}
        >
          📝 예방 점검 작성
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'history' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-900/50' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          점검 이력 ({history.length})
        </button>
      </div>

      {/* 모바일 메인 바디 */}
      <div className="flex-1 p-4 overflow-y-auto max-w-lg mx-auto w-full pb-16">
        {activeTab === 'form' ? (
          <MobileMaintenanceForm
            equipmentId={equipmentId}
            onEquipmentIdChange={setEquipmentId}
            inspector={inspector}
            onInspectorChange={setInspector}
            checkItems={checkItems}
            signature={signature}
            onSignatureChange={setSignature}
            audioNote={audioNote}
            onAudioNoteChange={setAudioNote}
            status={status}
            onStatusChange={setStatus}
            isSubmitting={isSubmitting}
            isRecording={isRecording}
            onVoiceSttTrigger={handleVoiceSttTrigger}
            onToggleItem={handleToggleItem}
            onSubmit={handleSubmit}
          />
        ) : (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-450 flex items-center gap-1.5 px-1 pb-1">
              <ListFilter className="w-3.5 h-3.5" />
              최근 현장 점검 송신 이력
            </h3>

            {isHistoryLoading ? (
              <div className="text-center py-12 text-slate-500 font-bold text-xs">
                이력을 로드하는 중입니다...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-bold text-xs bg-slate-800 rounded-2xl border border-slate-750">
                아직 제출된 모바일 점검 기록이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => {
                  const isFail = item.status === "FAIL";
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-2xl border text-left space-y-2.5 transition-all bg-slate-850 ${
                        isFail ? 'border-rose-950/60 shadow-inner' : 'border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {item.equipmentId}
                          </span>
                          <span className="text-[8px] text-slate-500 font-black ml-2">{item.checkedAt}</span>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          isFail ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isFail ? '조치필요 (FAIL)' : '양호 (PASS)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-400 bg-slate-900/40 p-2 rounded-xl">
                        <div>점검자: <span className="text-slate-200 font-black">{item.inspector}</span></div>
                        <div>점검 ID: <span className="text-slate-400 font-medium">{item.id}</span></div>
                      </div>

                      {item.audioUrl && (
                        <div className="bg-slate-900/60 p-2.5 rounded-xl text-[9px] font-bold text-slate-300 flex items-start gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[8px] text-indigo-400 font-black block">음성 메모 내역:</span>
                            <p className="mt-0.5 text-slate-200 leading-normal">{item.audioUrl}</p>
                          </div>
                        </div>
                      )}

                      {item.signatureData && (
                        <div className="flex justify-between items-center text-[8.5px] font-black text-slate-500 pt-1 border-t border-slate-800">
                          <span>수기 서명 첨부됨</span>
                          <img src={item.signatureData} alt="서명" className="h-6 w-12 object-contain bg-white/10 rounded px-1" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 모바일 하단 카피라이트 */}
      <div className="py-4 text-center border-t border-slate-800 bg-slate-900 text-slate-600 text-[8px] font-black mt-auto">
        © 2026 EGDESK SMS. ALL RIGHTS RESERVED.
      </div>
      
    </div>
  );
}
