import React from "react";
import { EquipmentEnergy } from "../types";
import { Wrench, CheckCircle2, Play, Square, AlertOctagon } from "lucide-react";

interface EquipmentPowerCardProps {
  equipments: EquipmentEnergy[];
  onToggleShutdown: (eqId: string) => void;
}

/**
 * 설비별 실시간 소비 전력 및 누적 에너지 비용 모니터링 카드
 */
export default function EquipmentPowerCard({
  equipments,
  onToggleShutdown,
}: EquipmentPowerCardProps) {
  
  // 전체 설비의 누적 전력량 총합 구하기
  const totalEnergy = equipments.reduce((sum, eq) => sum + eq.accumulatedEnergy, 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left space-y-4">
      
      {/* 타이틀 헤더 */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Wrench className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">공장 가동 설비별 에너지 부하 및 누적 전기요금</h3>
            <p className="text-[9px] text-slate-400 font-bold">주요 전력 부하 설비별 실시간 전력 상태 및 O&M 제어</p>
          </div>
        </div>
        
        <span className="text-[8.5px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
          💡 개별 설비의 ON/OFF 버튼으로 실시간 제어가 가능합니다.
        </span>
      </div>

      {/* 설비 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {equipments.map((eq) => {
          const ratio = totalEnergy > 0 ? (eq.accumulatedEnergy / totalEnergy) * 100 : 0;
          
          return (
            <div 
              key={eq.id}
              className={`rounded-2xl border p-4.5 flex flex-col justify-between gap-4 transition-all ${
                eq.isOnline 
                  ? "bg-slate-50 border-slate-150" 
                  : "bg-slate-100 border-slate-200 opacity-60"
              }`}
            >
              <div className="space-y-2.5">
                {/* 상단: 상태 라이트 및 장치명 */}
                <div className="flex justify-between items-center">
                  <h4 className="text-[10.5px] font-extrabold text-slate-800 truncate pr-2">{eq.name}</h4>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${eq.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                </div>

                {/* 전력 메트릭 수치 */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div>
                    <span className="text-[8px] font-black text-slate-400 block uppercase">실시간 부하</span>
                    <span className="text-[10.5px] font-extrabold text-slate-700">
                      {eq.isOnline ? `${eq.currentPower} kW` : "0 kW (OFF)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-400 block uppercase">누적 사용량</span>
                    <span className="text-[10.5px] font-extrabold text-slate-700">{eq.accumulatedEnergy.toLocaleString()} kWh</span>
                  </div>
                </div>

                {/* 누적 요금 계산 */}
                <div className="bg-white/80 border border-slate-200/50 rounded-xl p-2 text-left">
                  <span className="text-[7.5px] font-black text-slate-400 block uppercase">금월 누적 예상 요금</span>
                  <span className={`text-[10px] font-black ${eq.isOnline ? 'text-indigo-650' : 'text-slate-500'}`}>
                    ₩ {eq.estimatedCost.toLocaleString()}
                  </span>
                </div>

                {/* 점유 비율 바 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[7.5px] font-black text-slate-400">
                    <span>에너지 기여율</span>
                    <span>{ratio.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${eq.isOnline ? 'bg-indigo-500' : 'bg-slate-400'}`} 
                      style={{ width: `${ratio}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* 제어 버튼 */}
              <button
                type="button"
                onClick={() => onToggleShutdown(eq.id)}
                className={`w-full py-1.5 rounded-xl text-[9px] font-black transition-colors flex items-center justify-center gap-1 ${
                  eq.isOnline 
                    ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200" 
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                }`}
              >
                {eq.isOnline ? (
                  <>
                    <Square className="w-3 h-3 fill-rose-600 text-rose-600" />
                    가동 비상 정지
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-white text-white" />
                    가동 전원 투입
                  </>
                )}
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
}
