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
    <div className="space-y-6 pb-20 w-full min-w-0 font-sans text-slate-800 animate-fade-in text-left">
      
      {/* 헤더 및 타이틀 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 flex items-center tracking-tight">
            <Truck className="w-8 h-8 text-indigo-650 mr-3" />
            공급망 관리 AI
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            글로벌 이송 경로 실시간 지연 리스크를 사전에 예측하여, 병목이 예상되는 원자재의 신속한 국내/외 대체 조달처 우회 전환을 실시간으로 제안합니다.
          </p>
        </div>
      </div>

      {/* 주요 통계 요약 스코어카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4 text-left">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-extrabold block">모니터링 화물</span>
            <span className="text-2xl font-black text-slate-800 font-mono">
              {shipments.length} <span className="text-xs text-slate-400 font-bold">건</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50/50">
            <Truck className="w-8 h-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4 text-left">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-extrabold block">지연 위험 경보</span>
            <span className="text-2xl font-black text-rose-550 font-mono">
              {shipments.filter(s => s.risk === "CRITICAL").length} <span className="text-xs text-rose-350 font-bold">건</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50/50">
            <AlertCircle className="w-8 h-8 text-rose-500 animate-pulse" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4 text-left">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-extrabold block">조달 안전도</span>
            <span className="text-2xl font-black text-emerald-650 font-mono">
              {Math.round((shipments.filter(s => s.risk === "SAFE").length / (shipments.length || 1)) * 100)}%
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
