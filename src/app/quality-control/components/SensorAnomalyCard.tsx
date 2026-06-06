import React from "react";
import { SensorStatus, SensorContribution, SensorTimelineItem } from "../types";
import { Cpu, AlertCircle, PlayCircle, ShieldAlert } from "lucide-react";

interface SensorAnomalyCardProps {
  status: SensorStatus | null;
  contributions: SensorContribution[];
  timeline: SensorTimelineItem[];
}

export default function SensorAnomalyCard({
  status,
  contributions,
  timeline
}: SensorAnomalyCardProps) {
  if (!status) return null;

  const isWarning = status.operationalStatus === "WARNING" || status.operationalStatus === "CRITICAL";

  // SVG 차트 매핑 설정
  const chartWidth = 400;
  const chartHeight = 120;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 20;

  const widthScale = (chartWidth - paddingLeft - paddingRight) / (timeline.length - 1);
  const getPointX = (index: number) => paddingLeft + index * widthScale;
  const getPointY = (val: number) => {
    const ratio = val / 100; // Anomaly Score는 0~100 범위
    return chartHeight - paddingBottom - ratio * (chartHeight - paddingTop - paddingBottom);
  };

  // 라인 경로 생성
  let pathD = "";
  timeline.forEach((item, idx) => {
    const x = getPointX(idx);
    const y = getPointY(item.anomalyScore);
    if (idx === 0) {
      pathD = `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">설비 데이터 이상 징후 조기 감지</h3>
            <p className="text-[10px] text-slate-400 font-bold">오토인코더 다변량 Anomaly Detection</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${isWarning ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
          <span className="text-[10px] font-black text-slate-600">
            {status.equipmentName} : {isWarning ? "주의/이상감지" : "정상 운전"}
          </span>
        </div>
      </div>

      {/* 3대 실시간 물리 센서 계측치 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3">
          <p className="text-[9px] font-black text-slate-400">모터 하우징 진동</p>
          <p className="text-base font-black text-slate-800 mt-1">{status.vibrationRms.toFixed(1)} <span className="text-xs text-slate-400">mm/s</span></p>
          <span className="text-[9px] font-black text-slate-500 mt-1 block">정상범위: 0.5~3.0</span>
        </div>

        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3">
          <p className="text-[9px] font-black text-slate-400">구동축 베어링 온도</p>
          <p className="text-base font-black text-slate-800 mt-1">{status.bearingTemp.toFixed(1)} <span className="text-xs text-slate-400">℃</span></p>
          <span className="text-[9px] font-black text-slate-500 mt-1 block">정상범위: 20~50</span>
        </div>

        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3">
          <p className="text-[9px] font-black text-slate-400">3상 공급 전류</p>
          <p className="text-base font-black text-slate-800 mt-1">{status.motorCurrent.toFixed(1)} <span className="text-xs text-slate-400">A</span></p>
          <span className="text-[9px] font-black text-slate-500 mt-1 block">정상범위: 5~15</span>
        </div>
      </div>

      {/* 실시간 Anomaly Score 추이 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        <div className="md:col-span-2 space-y-2">
          <span className="text-[10px] font-black text-slate-450 block">AI 다변량 종합 이상 점수 추이 (Anomaly Score)</span>
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-2 relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
              {/* 임계치 점선 */}
              <line 
                x1={paddingLeft} 
                y1={getPointY(status.threshold)} 
                x2={chartWidth - paddingRight} 
                y2={getPointY(status.threshold)} 
                stroke="#f43f5e" 
                strokeWidth="1" 
                strokeDasharray="3,3" 
              />
              <text x={paddingLeft - 5} y={getPointY(status.threshold) + 3} fill="#f43f5e" fontSize="7" fontWeight="black" textAnchor="end">ALARM</text>

              {/* 꺾은선 */}
              <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />

              {/* 데이터 포인트 */}
              {timeline.map((item, idx) => {
                const x = getPointX(idx);
                const y = getPointY(item.anomalyScore);
                const isOut = item.anomalyScore > status.threshold;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="3.5"
                    fill={isOut ? "#ef4444" : "#22d3ee"}
                    stroke="white"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* 센서 기여도 비율 (이상 검출 원인 비율) */}
        <div className="space-y-3">
          <span className="text-[10px] font-black text-slate-400 block">이상 발생 센서 기여도 (정비 타겟)</span>
          <div className="space-y-2">
            {contributions.map((contrib, idx) => (
              <div key={idx} className="text-[10px] font-bold text-slate-700">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="truncate pr-2">{contrib.name.split(" ")[0]}</span>
                  <span>{contrib.rate}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 rounded-full" 
                    style={{ width: `${contrib.rate}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}
