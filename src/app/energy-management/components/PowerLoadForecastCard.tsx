import React from "react";
import { PowerPoint } from "../types";
import { Zap, AlertTriangle, TrendingUp } from "lucide-react";

interface PowerLoadForecastCardProps {
  powerPoints: PowerPoint[];
  contractPower: number;
  currentPeak: number;
}

/**
 * 실시간 전력 부하 실제 사용량 및 AI LSTM 예측 시계열 SVG 선형 차트
 */
export default function PowerLoadForecastCard({
  powerPoints,
  contractPower,
  currentPeak,
}: PowerLoadForecastCardProps) {
  
  // SVG 크기 정의
  const width = 800;
  const height = 320;
  const paddingTop = 40;
  const paddingBottom = 40;
  const paddingLeft = 60;
  const paddingRight = 30;

  const activeWidth = width - paddingLeft - paddingRight;
  const activeHeight = height - paddingTop - paddingBottom;

  // Y축 최대 스케일 (kW)
  const Y_MAX_SCALE = 120;

  // X, Y 좌표 연산 함수
  const getX = (idx: number) => {
    return paddingLeft + (idx / (powerPoints.length - 1)) * activeWidth;
  };

  const getY = (val: number) => {
    const ratio = val / Y_MAX_SCALE;
    return height - paddingBottom - ratio * activeHeight;
  };

  // SVG Path Generator (Line & Area)
  const buildPath = (type: "actual" | "forecast") => {
    const points = powerPoints
      .map((p, idx) => {
        const val = type === "actual" ? p.actual : p.forecast;
        if (val === null) return null;
        return { x: getX(idx), y: getY(val) };
      })
      .filter((p) => p !== null) as { x: number; y: number }[];

    if (points.length === 0) return "";

    return points.reduce((acc, curr, idx) => {
      return acc + `${idx === 0 ? "M" : "L"} ${curr.x} ${curr.y} `;
    }, "");
  };

  // 영역 채우기용 Path
  const buildAreaPath = (type: "actual" | "forecast") => {
    const points = powerPoints
      .map((p, idx) => {
        const val = type === "actual" ? p.actual : p.forecast;
        if (val === null) return null;
        return { x: getX(idx), y: getY(val) };
      })
      .filter((p) => p !== null) as { x: number; y: number }[];

    if (points.length === 0) return "";

    const linePath = points.reduce((acc, curr, idx) => {
      return acc + `${idx === 0 ? "M" : "L"} ${curr.x} ${curr.y} `;
    }, "");

    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const baseY = getY(0);

    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  // 피크 위험 예측 시간 감지 (forecast가 contractPower 100kW를 초과하는 시점)
  const peakRiskPoints = powerPoints
    .map((p, idx) => ({ ...p, idx }))
    .filter((p) => p.forecast > contractPower);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left space-y-4">
      
      {/* 상단 헤더 */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <Zap className="w-4.5 h-4.5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">실시간 공장 전력 부하 및 AI 피크 예측 곡선</h3>
            <p className="text-[9px] text-slate-400 font-bold">시간대별 한전 차등 요금제 기준 실시간 전력 로드맵</p>
          </div>
        </div>
        
        {/* KPI 스코어카드 */}
        <div className="flex gap-4">
          <div className="text-right">
            <span className="text-[8px] font-black text-slate-400 block uppercase">계약 전력 임계치</span>
            <span className="text-xs font-black text-slate-700">{contractPower} kW</span>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-black text-slate-400 block uppercase">금일 계측 피크</span>
            <span className={`text-xs font-black ${currentPeak >= contractPower * 0.9 ? 'text-rose-600' : 'text-indigo-650'}`}>
              {currentPeak} kW
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* 차트 영역 */}
        <div className="lg:col-span-3 bg-slate-50 border border-slate-150 rounded-2xl p-2.5 overflow-x-auto relative">
          
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[650px] h-auto">
            {/* 배경 수평 보조선 가이드 */}
            {[0, 30, 60, 90, 120].map((level) => {
              const y = getY(level);
              return (
                <g key={level}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray={level === 0 ? "" : "3,3"} />
                  <text x={paddingLeft - 10} y={y + 4} textAnchor="end" fontSize="8.5" fill="#94a3b8" fontWeight="bold">
                    {level}kW
                  </text>
                </g>
              );
            })}

            {/* X축 시간 라벨 */}
            {powerPoints.map((p, idx) => {
              const x = getX(idx);
              return (
                <g key={p.time}>
                  <line x1={x} y1={paddingTop} x2={x} y2={height - paddingBottom} stroke="#f1f5f9" strokeWidth="0.5" />
                  <text x={x} y={height - paddingBottom + 16} textAnchor="middle" fontSize="8.5" fill="#94a3b8" fontWeight="bold">
                    {p.time}
                  </text>
                </g>
              );
            })}

            {/* 계약 전력 100kW 적색 가이드 라인 */}
            <g>
              <line 
                x1={paddingLeft} 
                y1={getY(contractPower)} 
                x2={width - paddingRight} 
                y2={getY(contractPower)} 
                stroke="#f43f5e" 
                strokeWidth="1.5" 
                strokeDasharray="4,4" 
              />
              <text x={width - paddingRight - 10} y={getY(contractPower) - 6} textAnchor="end" fontSize="8" fill="#f43f5e" fontWeight="black">
                ⚠️ 계약 전력 제한 임계치 (100 kW)
              </text>
            </g>

            {/* AI 예측 영역 (Area) 채우기 */}
            <path d={buildAreaPath("forecast")} fill="#818cf8" fillOpacity="0.08" />
            {/* 실제 사용 영역 (Area) 채우기 */}
            <path d={buildAreaPath("actual")} fill="#f59e0b" fillOpacity="0.1" />

            {/* AI 예측 곡선 라인 */}
            <path d={buildPath("forecast")} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5,3" />

            {/* 실제 사용 곡선 라인 */}
            <path d={buildPath("actual")} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

            {/* 실제 사용 데이터 포인트 도트 그리기 */}
            {powerPoints.map((p, idx) => {
              if (p.actual === null) return null;
              const x = getX(idx);
              const y = getY(p.actual);
              return (
                <circle 
                  key={`act-dot-${p.time}`} 
                  cx={x} 
                  cy={y} 
                  r="4.5" 
                  fill="white" 
                  stroke="#f59e0b" 
                  strokeWidth="2.5" 
                  className="transition-all hover:r-6 hover:stroke-amber-600 cursor-pointer"
                />
              );
            })}

            {/* 예측 데이터 포인트 도트 그리기 */}
            {powerPoints.map((p, idx) => {
              if (p.forecast === null || p.actual !== null) return null; // 실제값이 있으면 그리지 않음
              const x = getX(idx);
              const y = getY(p.forecast);
              const isOver = p.forecast > contractPower;
              return (
                <circle 
                  key={`fore-dot-${p.time}`} 
                  cx={x} 
                  cy={y} 
                  r="4" 
                  fill="white" 
                  stroke={isOver ? "#f43f5e" : "#818cf8"} 
                  strokeWidth="2.5" 
                  className="transition-all hover:r-6 cursor-pointer"
                />
              );
            })}

            {/* 피크 임계치 이탈 경고 핀 표식 */}
            {peakRiskPoints.map((p) => {
              const x = getX(p.idx);
              const y = getY(p.forecast);
              return (
                <g key={`alert-pin-${p.time}`}>
                  {/* 경고등 깜빡임 서클 */}
                  <circle cx={x} cy={y} r="12" fill="#ef4444" fillOpacity="0.2" className="animate-ping" style={{ transformOrigin: `${x}px ${y}px` }} />
                  {/* 핀 라인 */}
                  <line x1={x} y1={y} x2={x} y2={y - 25} stroke="#ef4444" strokeWidth="1.5" />
                  {/* 경고 보드 */}
                  <rect x={x - 35} y={y - 42} width={70} height={18} rx="4" fill="#ef4444" />
                  <text x={x} y={y - 30} textAnchor="middle" fontSize="7.5" fill="white" fontWeight="black">
                    AI 피크 위험
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 안내 패널 */}
        <div className="lg:col-span-1 bg-slate-50 border border-slate-150 rounded-2xl p-4.5 flex flex-col justify-between text-left space-y-4">
          <div className="space-y-3">
            <span className="text-[8.5px] font-black text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
              AI 부하 진단 결과
            </span>
            
            {peakRiskPoints.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-rose-600 font-extrabold text-[10.5px]">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 animate-bounce" />
                  피크 전력 경보 감지
                </div>
                <p className="text-[9.5px] text-slate-500 font-bold leading-normal">
                  오늘 오후 <span className="text-rose-600 font-black">{peakRiskPoints.map(p => p.time).join(", ")}</span> 시간대에 가동 계획이 밀집되어 전력 피크 임계치를 초과할 위험이 높습니다.
                </p>
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[8px] font-extrabold p-2.5 rounded-xl leading-normal">
                  💡 아래 절감 일정을 적용하거나 모바일 셧다운을 통해 고전력 부하를 우회/해결할 수 있습니다.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-emerald-600 font-extrabold text-[10.5px]">
                  <TrendingUp className="w-4 h-4 shrink-0 text-emerald-500" />
                  에너지 안정 상태
                </div>
                <p className="text-[9.5px] text-slate-500 font-bold leading-normal">
                  모든 설비의 사용 전력이 계약 전력 범위 이내로 최적화되었습니다. 안정적으로 에너지 기본 요금을 보존하고 있습니다.
                </p>
                <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[8px] font-extrabold p-2.5 rounded-xl leading-normal">
                  💡 한전 요금제의 계절 및 시간별 단가를 모니터링하여 지속적인 최적 가동을 유지하세요.
                </div>
              </div>
            )}
          </div>

          {/* 범례 */}
          <div className="pt-3 border-t border-slate-200 space-y-1.5 text-[8px] font-black text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.75 bg-amber-500 rounded" />
              <span>실시간 계측 전력량 (kW)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.75 bg-indigo-400 rounded-sm" style={{ borderTop: "2px dashed #818cf8" }} />
              <span>AI 시계열 예측 전력 곡선 (kW)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
