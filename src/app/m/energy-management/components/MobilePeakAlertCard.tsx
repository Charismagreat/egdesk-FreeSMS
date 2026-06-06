import React from "react";
import { EquipmentEnergy } from "../../../energy-management/types";
import { AlertOctagon, Power, ShieldAlert, Sparkles } from "lucide-react";

interface MobilePeakAlertCardProps {
  equipments: EquipmentEnergy[];
  loadPercentage: number;
  isPeakRisk: boolean;
  maxForecast: number;
  contractPower: number;
  onToggleShutdown: (eqId: string) => void;
}

/**
 * 모바일용 실시간 전력 피크 위기 경보 및 원격 셧다운 제어 패널
 */
export default function MobilePeakAlertCard({
  equipments,
  loadPercentage,
  isPeakRisk,
  maxForecast,
  contractPower,
  onToggleShutdown,
}: MobilePeakAlertCardProps) {
  
  return (
    <div className="space-y-4">
      
      {/* 🚨 피크 부하 상태 알림 */}
      <div className={`rounded-3xl p-5 border text-left space-y-3 shadow-md ${
        isPeakRisk 
          ? "bg-rose-950/40 border-rose-800 text-rose-250 animate-pulse" 
          : "bg-slate-850 border-slate-800 text-slate-300"
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isPeakRisk ? (
              <AlertOctagon className="w-5 h-5 text-rose-500 animate-bounce" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            )}
            <span className="text-[10px] font-black tracking-wider uppercase">
              {isPeakRisk ? "실시간 전력 피크 경보 발동" : "전력 사용 상태 안정"}
            </span>
          </div>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
            isPeakRisk ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            부하율 {loadPercentage}%
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-black">
            {isPeakRisk 
              ? `예측 피크 부하가 계약 전력(${contractPower}kW)을 초과했습니다.`
              : "공장의 전력 가동이 계약 범위 내에서 안전하게 유지 중입니다."}
          </p>
          <p className="text-[8.5px] text-slate-500 font-bold leading-normal">
            {isPeakRisk
              ? `금일 예상 최대 전력: ${maxForecast} kW (임계치 100kW 대비 8kW 초과 우려). 아래 고부하 설비를 일시 원격 차단하거나 조치를 취해 기본료 인상을 방어하세요.`
              : `금일 예상 최대 전력: ${maxForecast} kW. 피크 위기 없이 안정적으로 셋업되어 있습니다.`}
          </p>
        </div>
      </div>

      {/* 🔌 원격 셧다운 원터치 제어판 */}
      <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 text-left space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-[10px] font-black text-slate-400">설비 전원 실시간 원격 제어 (CMMS)</span>
          <span className="text-[7.5px] font-black text-slate-600 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            WIRELESS IOT INTERACTION
          </span>
        </div>

        <div className="space-y-3">
          {equipments.map((eq) => (
            <div 
              key={eq.id}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                eq.isOnline 
                  ? "bg-slate-900 border-slate-800" 
                  : "bg-slate-900/40 border-slate-800/50 opacity-40"
              }`}
            >
              <div>
                <h5 className="text-[10px] font-extrabold text-white">{eq.name}</h5>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${eq.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  <span className="text-[8px] text-slate-500 font-bold">
                    {eq.isOnline ? `가동 중 · 실시간 ${eq.currentPower} kW` : "가동 차단됨"}
                  </span>
                </div>
              </div>

              {/* 셧다운 버튼 */}
              <button
                type="button"
                onClick={() => onToggleShutdown(eq.id)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  eq.isOnline 
                    ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20" 
                    : "bg-indigo-650 text-white shadow-md"
                }`}
              >
                <Power className="w-4.5 h-4.5 text-current" />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
