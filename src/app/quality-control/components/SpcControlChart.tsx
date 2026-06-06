import React, { useState } from "react";
import { SpcSample, SpcPrediction, SpcConfig, FeatureImportance } from "../types";
import { TrendingUp, AlertTriangle, Info, HelpCircle } from "lucide-react";

interface SpcControlChartProps {
  config: SpcConfig | null;
  samples: SpcSample[];
  predictions: SpcPrediction[];
  currentCpk: number;
  cpkStatus: string;
  futureRisk: number;
  featureImportance: FeatureImportance[];
}

export default function SpcControlChart({
  config,
  samples,
  predictions,
  currentCpk,
  cpkStatus,
  futureRisk,
  featureImportance
}: SpcControlChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  if (!config) return null;

  // 전체 데이터 통합 (샘플 + 예측)
  const allData = [
    ...samples.map(s => ({ ...s, isPrediction: false })),
    ...predictions.map(p => ({ ...p, isPrediction: true }))
  ];

  // SVG 차트 좌표 매핑을 위한 설정
  const chartWidth = 500;
  const chartHeight = 200;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const widthScale = (chartWidth - paddingLeft - paddingRight) / (allData.length - 1);
  
  // Y축 값 매핑 범위 설정 (LSL ~ USL 범위보다 조금 더 여유롭게)
  const yMin = config.lsl - 1;
  const yMax = config.usl + 1;
  
  const getPointY = (val: number) => {
    const ratio = (val - yMin) / (yMax - yMin);
    return chartHeight - paddingBottom - ratio * (chartHeight - paddingTop - paddingBottom);
  };

  const getPointX = (index: number) => {
    return paddingLeft + index * widthScale;
  };

  // 라인 경로 데이터 생성
  let samplePath = "";
  let predPath = "";

  // 실제 데이터 경로
  samples.forEach((sample, idx) => {
    const x = getPointX(idx);
    const y = getPointY(sample.value);
    if (idx === 0) {
      samplePath = `M ${x} ${y}`;
    } else {
      samplePath += ` L ${x} ${y}`;
    }
  });

  // 예측 데이터 경로 (마지막 실제 점부터 이어서 그림)
  const lastRealIdx = samples.length - 1;
  if (lastRealIdx >= 0 && predictions.length > 0) {
    const startX = getPointX(lastRealIdx);
    const startY = getPointY(samples[lastRealIdx].value);
    predPath = `M ${startX} ${startY}`;
    
    predictions.forEach((pred, idx) => {
      const x = getPointX(lastRealIdx + 1 + idx);
      const y = getPointY(pred.value);
      predPath += ` L ${x} ${y}`;
    });
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. SPC 차트 영역 */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">통계적 공정 관리 (SPC) 관리도</h3>
              <p className="text-[10px] text-slate-400 font-bold">사출 온도 실시간 관리 및 LSTM 시계열 예측</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[9px] text-slate-400 font-black">실제 가동</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-[9px] text-slate-400 font-black">AI 예측</span>
            </div>
          </div>
        </div>

        {/* 렌더링할 SVG 그래픽스 관리도 */}
        <div className="relative bg-slate-50 rounded-2xl border border-slate-150 p-2 overflow-hidden">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
            {/* 가로 보조선 (UCL, LCL, Target) */}
            {/* USL / LSL 선 */}
            <line x1={paddingLeft} y1={getPointY(config.usl)} x2={chartWidth - paddingRight} y2={getPointY(config.usl)} stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
            <text x={paddingLeft - 8} y={getPointY(config.usl) + 3} fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="end">USL</text>

            <line x1={paddingLeft} y1={getPointY(config.lsl)} x2={chartWidth - paddingRight} y2={getPointY(config.lsl)} stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
            <text x={paddingLeft - 8} y={getPointY(config.lsl) + 3} fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="end">LSL</text>

            {/* UCL / LCL 선 */}
            <line x1={paddingLeft} y1={getPointY(config.ucl)} x2={chartWidth - paddingRight} y2={getPointY(config.ucl)} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
            <text x={paddingLeft - 8} y={getPointY(config.ucl) + 3} fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="end">UCL</text>

            <line x1={paddingLeft} y1={getPointY(config.lcl)} x2={chartWidth - paddingRight} y2={getPointY(config.lcl)} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
            <text x={paddingLeft - 8} y={getPointY(config.lcl) + 3} fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="end">LCL</text>

            {/* Target 기준선 */}
            <line x1={paddingLeft} y1={getPointY(config.targetValue)} x2={chartWidth - paddingRight} y2={getPointY(config.targetValue)} stroke="#3b82f6" strokeWidth="1" />
            <text x={paddingLeft - 8} y={getPointY(config.targetValue) + 3} fill="#3b82f6" fontSize="8" fontWeight="bold" textAnchor="end">Target</text>

            {/* 실제 수치 경로 꺾은선 그리기 */}
            <path d={samplePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
            {/* 예측 수치 경로 꺾은선 그리기 */}
            <path d={predPath} fill="none" stroke="#fb7185" strokeWidth="2.5" strokeDasharray="4,4" strokeLinecap="round" />

            {/* 데이터 포인트 원형 그리기 및 이벤트 매핑 */}
            {allData.map((data, idx) => {
              const x = getPointX(idx);
              const y = getPointY(data.value);
              const isPred = data.isPrediction;
              const isOut = data.value > config.ucl || data.value < config.lcl;

              return (
                <g key={idx}>
                  <circle
                    cx={x}
                    cy={y}
                    r={hoveredPoint?.batch === data.batch ? "6" : "4.5"}
                    fill={isPred ? "#f43f5e" : isOut ? "#f59e0b" : "#3b82f6"}
                    stroke="white"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredPoint(data)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* X축 레이블 */}
                  {(idx % 2 === 0 || idx === allData.length - 1) && (
                    <text 
                      x={x} 
                      y={chartHeight - 10} 
                      fill="#94a3b8" 
                      fontSize="8" 
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {data.timestamp.replace(" (예측)", "")}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* 마우스 호버 시 상세 정보 툴팁 */}
          {hoveredPoint && (
            <div className="absolute bg-slate-900/90 text-white text-[10px] p-2.5 rounded-xl border border-slate-700 shadow-xl pointer-events-none"
                 style={{
                   left: `${Math.min(getPointX(allData.findIndex(d => d.batch === hoveredPoint.batch)) + 10, chartWidth - 140)}px`,
                   top: `${Math.max(getPointY(hoveredPoint.value) - 70, 10)}px`
                 }}>
              <p className="font-black border-b border-slate-700 pb-1 mb-1 text-amber-400">
                {hoveredPoint.batch} {hoveredPoint.isPrediction ? "🤖 AI 예측" : ""}
              </p>
              <p className="font-bold">계측 수치: <span className="font-black text-slate-100">{hoveredPoint.value.toFixed(1)} ℃</span></p>
              <p className="font-bold">공정능력지수 Cpk: <span className="font-black text-slate-100">{hoveredPoint.cpk.toFixed(2)}</span></p>
              {hoveredPoint.isPrediction && (
                <p className="font-bold text-rose-350">규격 이탈 리스크: {hoveredPoint.risk}%</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Cpk 및 AI 예측 결과 지표 영역 */}
      <div className="space-y-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-5 lg:pt-0">
        
        {/* 공정 능력 지수 요약 */}
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400">실시간 공정능력지수</span>
            <h4 className="text-xl font-black text-slate-800 mt-1">
              Cpk {currentCpk.toFixed(2)}
            </h4>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full mt-1.5 inline-block ${
              cpkStatus === "WARNING" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {cpkStatus === "WARNING" ? "주의: 개선 조치 권고" : "양호: 공정 통제 우수"}
            </span>
          </div>
          
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-3xs">
            <span className="text-xs font-black text-amber-600">Cpk</span>
          </div>
        </div>

        {/* AI 예방 경보 (LSTM 시계열 예측 결과) */}
        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="text-[10px] font-black text-rose-800">AI 품질 이상 조기 감지</span>
              <p className="text-xs font-black text-slate-850 mt-1 leading-normal">
                향후 4시간 이내 규격 상한 초과 및 Cpk 저하 확률이 <span className="text-rose-600 font-extrabold">{futureRisk}%</span>입니다.
              </p>
              <p className="text-[9.5px] text-slate-500 font-medium mt-1 leading-snug">
                사출 히터 과열 가능성 감지. 모터 진동 궤적과 결부하여 예방 보전 대기 조치가 필요합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Importance 공정 기여 영향도 */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 block mb-1">Cpk 저하 요인 영향도 (SHAP Value)</span>
          <div className="space-y-1.5">
            {featureImportance.map((feat, idx) => (
              <div key={idx} className="text-[10px] font-bold text-slate-700">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="truncate pr-2">{feat.name}</span>
                  <span className="shrink-0">{feat.value}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${feat.color}`} style={{ width: `${feat.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
