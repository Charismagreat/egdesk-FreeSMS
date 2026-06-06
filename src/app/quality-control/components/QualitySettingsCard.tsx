import React, { useState } from "react";
import { VisionModelStatus } from "../types";
import { Settings, Shield, Save, Sliders } from "lucide-react";

interface QualitySettingsCardProps {
  modelStatus: VisionModelStatus | null;
  onUpdateThreshold: (threshold: number) => void;
}

export default function QualitySettingsCard({
  modelStatus,
  onUpdateThreshold
}: QualitySettingsCardProps) {
  const [sliderVal, setSliderVal] = useState(modelStatus?.anomalyThreshold || 75.0);

  if (!modelStatus) return null;

  const handleSave = () => {
    onUpdateThreshold(sliderVal);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left">
      <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
        <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800">품질관리 AI 제어 설정</h3>
          <p className="text-[10px] text-slate-400 font-bold">비전 검사 이상 감도 및 품질 경보 기준 튜닝</p>
        </div>
      </div>

      <div className="space-y-5">
        
        {/* 임계치 조절 슬라이더 */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              Vision AI Anomaly 임계값 (Threshold)
            </span>
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {sliderVal.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="range" 
              min="30.0" 
              max="95.0" 
              step="0.5"
              value={sliderVal}
              onChange={(e) => setSliderVal(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
            />
          </div>

          <p className="text-[9px] text-slate-450 leading-relaxed font-bold">
            💡 임계치를 낮추면 미세 결함 검출력이 상승하지만 과검률(정상을 불량으로 판정)이 높아질 수 있습니다. 75.0% 설정을 권장합니다.
          </p>
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-[10px] font-extrabold transition-all shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          품질 제어 설정 저장
        </button>

      </div>
    </div>
  );
}
