import React from "react";
import { PredictiveStatus } from "../types";
import { Activity, ShieldAlert, Heart, Calendar } from "lucide-react";

interface PredictiveMaintenanceCardProps {
  status: PredictiveStatus | null;
}

export default function PredictiveMaintenanceCard({ status }: PredictiveMaintenanceCardProps) {
  if (!status) return null;

  // 진동 추이 SVG 맵 설정
  const chartWidth = 320;
  const chartHeight = 80;
  const paddingLeft = 10;
  const paddingRight = 10;
  const paddingTop = 5;
  const paddingBottom = 15;

  const getPointX = (index: number) => {
    const step = (chartWidth - paddingLeft - paddingRight) / (status.vibrationTrend.length - 1);
    return paddingLeft + index * step;
  };

  const getPointY = (val: number) => {
    // 진동은 0~5 mm/s 범위 매핑
    const ratio = val / 5;
    return chartHeight - paddingBottom - ratio * (chartHeight - paddingTop - paddingBottom);
  };

  let pathD = "";
  status.vibrationTrend.forEach((pt, idx) => {
    const x = getPointX(idx);
    const y = getPointY(pt.value);
    if (idx === 0) {
      pathD = `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. 설비 건강도 및 진동 모니터링 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Heart className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">설비 건전도 & 진동 RMS</h4>
            <p className="text-[9px] text-slate-400 font-bold">실시간 진동 파형 분석</p>
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-50 border border-slate-150 rounded-2xl p-4">
          <div>
            <span className="text-[9px] font-black text-slate-400">설비 건강 지수 (Health Score)</span>
            <h5 className="text-xl font-black text-slate-850 mt-1">{status.healthScore.toFixed(1)}%</h5>
            <span className="text-[8.5px] font-black text-amber-600 block mt-1">⚠️ 베어링 열화로 15% 감쇠</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-3xs text-rose-500 font-black text-base">
            ♥
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[8.5px] font-black text-slate-450">
            <span>실시간 진동 추이 (6시간)</span>
            <span className="text-indigo-600 font-extrabold">현재: {status.vibrationRms.toFixed(1)} mm/s</span>
          </div>
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-1.5">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
              <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
              {status.vibrationTrend.map((pt, idx) => (
                <circle key={idx} cx={getPointX(idx)} cy={getPointY(pt.value)} r="2.5" fill="#6366f1" stroke="white" strokeWidth="0.5" />
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* 2. FFT 주파수 스펙트럼 분석 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">주파수 분석 (FFT Spectrum)</h4>
            <p className="text-[9px] text-slate-400 font-bold">특이 주파수 이상 피크 스캔</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 h-[165px] flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[8.5px] font-black text-slate-400 block">진동 성분 분석 결과</span>
            <p className="text-[10px] font-black text-slate-700 leading-snug">
              모터 구동 회전수(1x RPM) 대비 **33Hz 대역**에서 기준 규격을 크게 초과하는 이상 amplitude 감지.
            </p>
          </div>

          {/* 간이 주파수 차트 */}
          <div className="flex items-end gap-1 h-20 border-b border-slate-350 pb-0.5 justify-around">
            {status.fftAnalysis.map((fft, idx) => (
              <div 
                key={idx} 
                className="flex flex-col items-center flex-1"
                title={`${fft.label}: ${fft.amplitude}`}
              >
                <div 
                  className={`w-full rounded-t-md ${fft.amplitude > 0.5 ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} 
                  style={{ height: `${fft.amplitude * 60}px` }} 
                />
                <span className="text-[7.5px] text-slate-450 mt-1 font-bold">{fft.frequency}Hz</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1 text-[8.5px] font-black text-rose-600">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>경고: 베어링 궤도 결함 주파수 일치</span>
          </div>
        </div>
      </div>

      {/* 3. 예지보전 잔여수명 (RUL) 분석 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">AI 잔여 수명 예측 (RUL)</h4>
            <p className="text-[9px] text-slate-400 font-bold">LSTM 기반 시계열 고장 D-Day 계산</p>
          </div>
        </div>

        <div className="space-y-3">
          {status.partLifetimes.map((part, idx) => {
            const isWarn = part.status === "WARNING" || part.status === "CRITICAL";
            return (
              <div key={idx} className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 text-[9.5px] font-bold text-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="truncate pr-2">{part.partName}</span>
                  <span className={`font-black shrink-0 ${isWarn ? 'text-rose-600 font-extrabold' : 'text-slate-500'}`}>
                    D-{part.rulDays}일 ({part.percent}%)
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isWarn ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${part.percent}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
