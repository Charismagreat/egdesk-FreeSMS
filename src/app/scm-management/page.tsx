"use client";

import React from "react";
import { useScmManagement } from "./hooks/useScmManagement";
import ScmTrafficMapCard from "./components/ScmTrafficMapCard";
import SupplierScorecardCard from "./components/SupplierScorecardCard";
import AlternativeSupplierModal from "./components/AlternativeSupplierModal";
import { AlertCircle, CheckCircle2, ShieldAlert, Sparkles, Truck } from "lucide-react";

/**
 * 공급망 관리 AI (SCM Delivery Predictor) 메인 대시보드
 */
export default function ScmManagementPage() {
  const {
    isLoading,
    toast,
    shipments,
    suppliers,
    alternatives,
    selectedShipmentId,
    isModalOpen,
    setIsModalOpen,
    handleSwitchSupplier,
    setOpenModalForShipment,
  } = useScmManagement();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* --- 상단 헤더 섹션 (Wow 디자인) --- */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* 장식용 그라디언트 구체 */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide">
                <Sparkles className="w-3 h-3 text-indigo-400" /> SCM Predictor Engine
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">공급망 관리 AI</h1>
            <p className="text-xs text-indigo-200/80 font-bold max-w-xl">
              글로벌 이송 경로 실시간 지연 리스크를 사전에 예측하여, 병목이 예상되는 원자재의 신속한 국내/외 대체 조달처 우회 전환을 실시간으로 제안합니다.
            </p>
          </div>

          {/* 주요 통계 요약 (Dashboard Hero Stats) */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 text-left">
            <div>
              <span className="block text-[8px] text-indigo-300 font-black">모니터링 화물</span>
              <span className="text-sm md:text-base font-black font-mono text-white">
                {shipments.length} <span className="text-[10px] text-indigo-200">건</span>
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-rose-300 font-black">지연 위험 경보</span>
              <span className="text-sm md:text-base font-black font-mono text-rose-400">
                {shipments.filter(s => s.risk === "CRITICAL").length} <span className="text-[10px] text-rose-300">건</span>
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-emerald-300 font-black">조달 안전도</span>
              <span className="text-sm md:text-base font-black font-mono text-emerald-400">
                {Math.round((shipments.filter(s => s.risk === "SAFE").length / (shipments.length || 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 로딩 표시 */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold">실시간 글로벌 물류 체인 데이터를 수집 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 실시간 물류 관제 지도 */}
          <ScmTrafficMapCard shipments={shipments} />

          {/* 협력사 신뢰성 평점 및 조달 분석 대장 */}
          <SupplierScorecardCard
            shipments={shipments}
            suppliers={suppliers}
            onOpenAlternativeModal={setOpenModalForShipment}
          />
        </div>
      )}

      {/* 대체 우회 처 모달 */}
      <AlternativeSupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shipmentId={selectedShipmentId}
        shipments={shipments}
        alternatives={alternatives}
        onSwitchSupplier={handleSwitchSupplier}
      />

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
