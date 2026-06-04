import React from 'react';
import { Sparkles, FileText, Loader2, CheckCircle } from 'lucide-react';

interface AiVisionTerminalProps {
  aiVisionLoading: boolean;
  selectedVisionPreset: number | null;
  scanningLine: boolean;
  onPresetClick: (presetId: number) => void;
  onOpenItemModal: () => void;
}

export const visionPresets = [
  {
    id: 1,
    title: '한성정밀 자재 매입 명세서',
    filename: 'invoice_hansung_2026.png',
    data: {
      name: '초경량 모터',
      category: '전동부품',
      price: '12500',
      partner: '한성정밀(주)',
      stock: '50',
      safeStock: '15',
      location: 'A홀 3번 선반',
      description: '고효율 초경량 BLDC 모터'
    }
  },
  {
    id: 2,
    title: '글로벌 트레이딩 완제품 인보이스',
    filename: 'invoice_global_trading.jpg',
    data: {
      name: '써모글로우 텀블러',
      category: '리빙웨어',
      price: '8700',
      partner: '글로벌 트레이딩',
      stock: '120',
      safeStock: '30',
      location: 'B홀 12번 적재함',
      description: '보온보냉 고진공 텀블러 500ml'
    }
  },
  {
    id: 3,
    title: '대성부자재 매입 영수증',
    filename: 'receipt_daesung.png',
    data: {
      name: '에어제트 모터',
      category: '전동부품',
      price: '4800',
      partner: '대성부자재상사',
      stock: '80',
      safeStock: '20',
      location: 'A홀 5번 선반',
      description: '소형 고압 에어분사식 모터 세트'
    }
  }
];

export const AiVisionTerminal: React.FC<AiVisionTerminalProps> = ({
  aiVisionLoading,
  selectedVisionPreset,
  scanningLine,
  onPresetClick,
  onOpenItemModal
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 bg-indigo-50 text-indigo-600 rounded-bl-2xl font-bold text-[10px] uppercase flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 animate-spin" /> Vision OCR AI Engine
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          <span>AI 비전 명세서 분석 입고</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          매입 영수증이나 인보이스 사진을 드래그해 넣으면 AI가 분석하여 품목, 단가, 거래처 등을 파싱해 입력폼에 채웁니다.
        </p>
      </div>

      {/* 명세서 샘플 프리셋 선택 */}
      <div className="mb-4">
        <span className="text-xs font-bold text-slate-500 block mb-2">실시간 분석용 명세서 이미지 프리셋:</span>
        <div className="flex flex-col space-y-1.5">
          {visionPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onPresetClick(preset.id)}
              disabled={aiVisionLoading}
              className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                selectedVisionPreset === preset.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-medium'
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span className="truncate">{preset.title}</span>
              <span className="text-[10px] text-slate-400 font-mono">{preset.filename}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 영수증/인보이스 드롭존 & 스캔 비주얼 효과 레이어 */}
      <div 
        onClick={() => {
          if (!aiVisionLoading) {
            onPresetClick(1);
          }
        }}
        className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 min-h-[140px] overflow-hidden group cursor-pointer hover:bg-indigo-50/20 hover:border-indigo-300/60 transition-all"
      >
        {scanningLine && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-bounce z-20"></div>
        )}
        {aiVisionLoading ? (
          <div className="flex flex-col items-center space-y-2 z-10">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-indigo-600 font-semibold animate-pulse">명세서 이미지 픽셀 스캔 및 분석 중...</span>
          </div>
        ) : selectedVisionPreset ? (
          <div className="flex flex-col items-center text-center space-y-2 z-10">
            <FileText className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-xs font-bold text-slate-700 block">
                {visionPresets.find(p => p.id === selectedVisionPreset)?.filename}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-1 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" /> 스캔 완료! 품목 등록 창에 정보 주입 중...
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-400" />
            <div className="text-xs text-slate-500">
              <span className="text-indigo-500 font-bold hover:underline cursor-pointer">이미지 파일 찾아보기</span> 또는 드래그 앤 드롭
            </div>
            <div className="text-[10px] text-slate-400">PNG, JPG, PDF (가상 시뮬레이터 지원)</div>
          </div>
        )}
      </div>

      {/* 신규 품목 등록으로 바로 연동하는 원클릭 액션 */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          * 실제 명세서 사진 파싱 후 정보가 등록 폼에 <strong className="text-indigo-500">타이핑 효과</strong>로 자동 매핑됩니다.
        </span>
        <button
          onClick={() => {
            if (!selectedVisionPreset) {
              alert('먼저 명세서 샘플을 선택하여 AI 스캔을 수행해 주세요.');
              return;
            }
            onOpenItemModal();
          }}
          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs px-4 py-2.5 rounded-xl border border-indigo-100 transition-colors"
        >
          품목 폼에서 확인하기 &rarr;
        </button>
      </div>
    </div>
  );
};
