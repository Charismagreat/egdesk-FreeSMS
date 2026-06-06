import React from "react";
import { MaintenanceEvent, PartInventory } from "../types";
import { Calendar, Package, AlertTriangle, User } from "lucide-react";

interface MaintenanceCalendarCardProps {
  events: MaintenanceEvent[];
  partInventories: PartInventory[];
}

export default function MaintenanceCalendarCard({
  events,
  partInventories
}: MaintenanceCalendarCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* 1. 예방 정비 일정 캘린더 요약 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">예방 정비 스케줄 (CMMS)</h4>
            <p className="text-[9px] text-slate-400 font-bold">이번 달 예정된 점검 및 교체 일정</p>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
          {events.map((evt) => {
            const isCalibration = evt.type === "CALIBRATION";
            return (
              <div 
                key={evt.id} 
                className="p-3 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between gap-3 text-[10px]"
              >
                <div className="flex items-start gap-2.5">
                  <div className="text-center bg-white border border-slate-200 rounded-xl p-1.5 shrink-0 min-w-[36px]">
                    <p className="text-[7px] text-slate-400 font-black">JUNE</p>
                    <p className="text-xs font-black text-slate-800 leading-none mt-0.5">{evt.date.slice(8)}</p>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-850">{evt.title}</h5>
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full mt-1.5 inline-block ${
                      isCalibration ? 'bg-cyan-100 text-cyan-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {evt.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-slate-500 font-bold">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{evt.assignee}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 소모성 부품 재고 관리 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Package className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">예비 보전 부품 재고 현황</h4>
            <p className="text-[9px] text-slate-400 font-bold">안전 재고 하한선 미달 품목 실시간 모니터링</p>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
          {partInventories.map((part) => {
            const isCritical = part.risk === "CRITICAL";
            const isWarn = part.risk === "WARNING";
            
            return (
              <div 
                key={part.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isCritical 
                    ? "bg-rose-50/50 border-rose-150" 
                    : isWarn 
                      ? "bg-amber-50/50 border-amber-150" 
                      : "bg-slate-50 border-slate-150"
                }`}
              >
                <div className="min-w-0">
                  <h5 className="font-extrabold text-slate-850 truncate">{part.name}</h5>
                  <p className="text-[8.5px] text-slate-400 font-bold mt-0.5">코드: {part.id} | 안전재고: {part.safetyStock} {part.unit}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[8.5px] text-slate-400 font-black">현재고 / 리드타임</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5">
                    <span className={isCritical ? 'text-rose-600 font-black' : isWarn ? 'text-amber-600 font-black' : 'text-slate-700'}>
                      {part.currentStock} {part.unit}
                    </span>
                    <span className="text-slate-400 font-bold text-[9px] ml-1">({part.leadTimeDays}일)</span>
                  </p>
                  {isCritical && (
                    <span className="text-[8px] font-black text-rose-600 flex items-center gap-0.5 justify-end mt-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      긴급 발주 필요
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
