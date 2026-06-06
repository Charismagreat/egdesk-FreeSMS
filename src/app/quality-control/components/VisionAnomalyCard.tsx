import React from "react";
import { VisionLog, VisionModelStatus } from "../types";
import { Shield, Eye, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

interface VisionAnomalyCardProps {
  modelStatus: VisionModelStatus | null;
  logs: VisionLog[];
  isRetraining: boolean;
  onRetrain: (count: number) => void;
}

export default function VisionAnomalyCard({
  modelStatus,
  logs,
  isRetraining,
  onRetrain
}: VisionAnomalyCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Vision AI 실시간 불량 검출</h3>
            <p className="text-[10px] text-slate-400 font-bold">정상 이미지 기반 비지도학습 Anomaly Detection</p>
          </div>
        </div>
        
        {modelStatus && (
          <div className="flex gap-2">
            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-md">
              {modelStatus.activeModel}
            </span>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-md">
              Golden Samples: {modelStatus.goldenSamplesCount}장
            </span>
          </div>
        )}
      </div>

      {/* 비전 모니터 메인 검출 이력 리스트 */}
      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
        {logs.map((log) => {
          const isFail = log.status === "FAIL";
          const anomalyPercent = log.anomalyScore;
          
          return (
            <div 
              key={log.id} 
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                isFail 
                  ? "bg-rose-50/50 border-rose-150" 
                  : "bg-emerald-50/30 border-emerald-100"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Grad-CAM 모의 히트맵 박스 */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 relative shrink-0 border border-slate-300">
                  <img src={log.imageUrl} alt={log.itemName} className="w-full h-full object-cover" />
                  {isFail && (
                    <div className="absolute inset-0 bg-red-500/30 backdrop-blur-3xs flex items-center justify-center">
                      <span className="text-[9px] font-black text-white bg-red-600 px-1 py-0.5 rounded shadow-sm">XAI</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-slate-850 truncate">{log.itemName}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                      isFail ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{log.timestamp} | {log.id}</p>
                  {isFail ? (
                    <p className="text-[10px] text-rose-600 font-extrabold mt-1">결함: {log.defectType}</p>
                  ) : (
                    <p className="text-[10px] text-emerald-600 font-extrabold mt-1">이상 없음 (정상 판정)</p>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-[9px] text-slate-400 font-black">이상 치수 (Anomaly Score)</p>
                <p className={`text-base font-black ${isFail ? "text-rose-600" : "text-emerald-600"}`}>
                  {anomalyPercent.toFixed(1)}%
                </p>
                <div className="w-16 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isFail ? "bg-rose-500" : "bg-emerald-500"}`} 
                    style={{ width: `${anomalyPercent}%` }} 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 노코드 재학습 트리거 박스 */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4.5 h-4.5 text-indigo-500" />
          <span className="text-[11px] font-bold text-slate-500">신규 정상 샘플 이미지로 재학습을 진행할 수 있습니다.</span>
        </div>
        <button
          onClick={() => onRetrain(5)}
          disabled={isRetraining}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-[10px] font-extrabold transition-all"
        >
          {isRetraining ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              재학습 진행 중...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              정상 샘플 5장 추가 후 원클릭 재학습
            </>
          )}
        </button>
      </div>
    </div>
  );
}
