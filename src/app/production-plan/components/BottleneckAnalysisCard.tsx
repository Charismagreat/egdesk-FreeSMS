import React from "react";
import { BottleneckInfo, DueRiskAnalysis } from "../types";
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, Landmark } from "lucide-react";

interface BottleneckAnalysisCardProps {
  bottlenecks: BottleneckInfo[];
  dueRisk: DueRiskAnalysis[];
}

/**
 * 설비 가동 부하 병목지수 및 납기 위협 요소 AI 분석 패널
 */
export default function BottleneckAnalysisCard({ bottlenecks, dueRisk }: BottleneckAnalysisCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* 1. 실시간 공장 설비 가동 부하(Load Rate) 및 병목 지수 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">설비 부하 & 병목 지수 모니터</h4>
            <p className="text-[9px] text-slate-400 font-bold">대기 작업 큐 및 누적 부하 매핑</p>
          </div>
        </div>

        <div className="space-y-3">
          {bottlenecks.map((item) => {
            const isCritical = item.status === "CRITICAL";
            const isWarn = item.status === "WARNING";
            
            return (
              <div key={item.id} className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 text-[9.5px] font-bold text-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="truncate pr-2">{item.name}</span>
                  <span className={`font-black shrink-0 ${isCritical ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-slate-500'}`}>
                    부하율 {item.loadRate}% (대기 {item.queueTasks}건)
                  </span>
                </div>

                <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isCritical ? 'bg-rose-500 animate-pulse' : isWarn ? 'bg-amber-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${item.loadRate}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. AI 납기 준수 달성률 예측 및 리스크 진단 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <ShieldAlert className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">AI 납기 준수 예측 보고 (Prophet RAG)</h4>
            <p className="text-[9px] text-slate-400 font-bold">15일 이내 기한 초과 리스크 자동 모니터링</p>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[175px] overflow-y-auto pr-1">
          {dueRisk.map((item) => {
            const isWarn = item.status === "WARNING" || item.status === "CRITICAL";
            return (
              <div 
                key={item.orderId}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-4 text-[10px] ${
                  isWarn 
                    ? "bg-rose-50/50 border-rose-150" 
                    : "bg-slate-50 border-slate-150"
                }`}
              >
                <div className="min-w-0">
                  <h5 className="font-extrabold text-slate-850 truncate">{item.productName}</h5>
                  <p className="text-[8.5px] text-slate-400 font-bold mt-0.5">주문코드: {item.orderId}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[8px] text-slate-400 font-black">납기 준수 확률</p>
                  <p className={`text-xs font-black mt-0.5 ${isWarn ? 'text-rose-600' : 'text-slate-800'}`}>
                    {item.probability}%
                  </p>
                  {isWarn && (
                    <span className="text-[8px] font-black text-rose-600 flex items-center gap-0.5 justify-end mt-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      일정 긴급 우회 요망
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
