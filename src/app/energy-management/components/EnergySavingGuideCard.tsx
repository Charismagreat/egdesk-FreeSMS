import React from "react";
import { SavingRecommendation } from "../types";
import { Sparkles, Check, AlertCircle, Coins } from "lucide-react";

interface EnergySavingGuideCardProps {
  recommendations: SavingRecommendation[];
  onApplySaving: (recId: string) => void;
}

/**
 * AI 에너지 비용 최적화 추천 가이드 및 실시간 적용 카드
 */
export default function EnergySavingGuideCard({
  recommendations,
  onApplySaving,
}: EnergySavingGuideCardProps) {
  
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left space-y-4">
      
      {/* 상단 타이틀 */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles className="w-4.5 h-4.5 text-indigo-500 fill-indigo-100" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">AI 에너지 비용 최적화 추천 가이드</h3>
            <p className="text-[9px] text-slate-400 font-bold">생산 계획 및 한전 피크 요금 시뮬레이션 기반 대안 스케줄링</p>
          </div>
        </div>
      </div>

      {/* 리스트 본문 */}
      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-[10px] font-bold">
          🎉 에너지 절감 추천 일정 제안이 현재 비어있습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((item) => (
            <div 
              key={item.id}
              className={`rounded-2xl border p-4.5 flex flex-col justify-between gap-4 text-left transition-all ${
                item.applied 
                  ? "bg-emerald-50/30 border-emerald-200" 
                  : "bg-slate-50 border-slate-150"
              }`}
            >
              <div className="space-y-2">
                {/* 상단: ID 및 절감액 칩 */}
                <div className="flex justify-between items-center">
                  <span className="text-[8.5px] font-black text-slate-400">추천코드: {item.id}</span>
                  <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                    item.applied 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-indigo-150/70 text-indigo-700"
                  }`}>
                    <Coins className="w-3 h-3 text-current" />
                    예상 절감: ₩ {item.effect.toLocaleString()}
                  </span>
                </div>

                {/* 제목 및 사유 */}
                <h4 className="text-[10.5px] font-extrabold text-slate-850 leading-tight">
                  {item.title}
                </h4>
                <p className="text-[9px] text-slate-500 font-bold leading-normal">
                  {item.reason}
                </p>
              </div>

              {/* 하단 제어부 */}
              <div className="pt-2 border-t border-slate-150 flex items-center justify-between gap-4">
                {item.applied ? (
                  <div className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black flex items-center justify-center gap-0.5 border border-emerald-100">
                    <Check className="w-3.5 h-3.5" />
                    절감 스케줄 적용 완료 (한전 피크 우회)
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onApplySaving(item.id)}
                    className="w-full py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-[9px] font-black shadow-2xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-white fill-white" />
                    절감 대안 일정 수락 적용
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
