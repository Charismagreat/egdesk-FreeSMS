import React, { useRef } from "react";
import { MobileCheckItem } from "../hooks/useMobileChecklist";
import { QrCode, Camera, Check, X, Shield, Award, Edit3 } from "lucide-react";

interface MobileChecklistFormProps {
  lotNo: string;
  onLotNoChange: (val: string) => void;
  inspector: string;
  onInspectorChange: (val: string) => void;
  checkItems: MobileCheckItem[];
  photoUrl: string | null;
  signature: string | null;
  onSignatureChange: (val: string | null) => void;
  status: "PASS" | "FAIL";
  onStatusChange: (val: "PASS" | "FAIL") => void;
  isSubmitting: boolean;
  onBarcodeScan: () => void;
  onAttachPhoto: () => void;
  onToggleItem: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function MobileChecklistForm({
  lotNo,
  onLotNoChange,
  inspector,
  onInspectorChange,
  checkItems,
  photoUrl,
  signature,
  onSignatureChange,
  status,
  onStatusChange,
  isSubmitting,
  onBarcodeScan,
  onAttachPhoto,
  onToggleItem,
  onSubmit
}: MobileChecklistFormProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 간단한 수기 전자 서명 패드 시뮬레이터 (마우스/터치 드로잉 기능 모킹)
  const handleSignSimulate = () => {
    const dummySignature = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='50'><path d='M10,25 Q30,10 50,25 T90,25' stroke='blue' stroke-width='2' fill='none'/></svg>";
    onSignatureChange(dummySignature);
  };

  const handleClearSignature = () => {
    onSignatureChange(null);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 text-slate-800">
      
      {/* 1. 기본 정보 입력 (바코드 & 검사원) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-indigo-500" />
          검사 대상 기본 정보
        </h3>

        <div>
          <label className="text-[10px] font-black text-slate-500 block mb-1">원자재 / 제품 LOT 번호</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="예: LOT-2026-8854"
              value={lotNo}
              onChange={(e) => onLotNoChange(e.target.value)}
              className="flex-1 text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
            <button
              type="button"
              onClick={onBarcodeScan}
              className="flex items-center gap-1 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black shadow-xs transition-colors shrink-0"
            >
              <QrCode className="w-3.5 h-3.5" />
              바코드 스캔
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 block mb-1">품질 검사원 성명</label>
          <input
            type="text"
            placeholder="검사원 이름을 입력하세요"
            value={inspector}
            onChange={(e) => onInspectorChange(e.target.value)}
            className="w-full text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      {/* 2. 품질 체크리스트 항목 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">
          5대 품질 체크리스트 문항
        </h3>
        
        <div className="divide-y divide-slate-100">
          {checkItems.map((item) => (
            <label 
              key={item.id} 
              className="flex items-start gap-3 py-3 cursor-pointer first:pt-1 last:pb-1"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => onToggleItem(item.id)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
              />
              <span className="text-xs font-bold text-slate-700 leading-normal">
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 3. 현장 사진 증적 및 Vision AI 검수 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>현장 실물 사진 증적</span>
          <span className="text-[8.5px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Vision AI 분석 연동</span>
        </h3>

        {photoUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-50">
            <img src={photoUrl} alt="현장 증적 사진" className="w-full h-40 object-cover" />
            <button
              type="button"
              onClick={() => onLotNoChange("")}
              className="absolute top-2 right-2 bg-slate-900/75 text-white p-1.5 rounded-full hover:bg-slate-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="p-2 bg-rose-50 border-t border-rose-100 text-rose-700 text-[10px] font-black leading-normal flex items-start gap-1">
              <span>🚨 AI 불량 의심 감지:</span>
              <span>표면 마모 또는 Sink Mark(수축) 패턴이 관찰되었습니다.</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAttachPhoto}
            className="w-full h-28 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <Camera className="w-7 h-7" />
            <span className="text-[10px] font-black">카메라 촬영 / 사진 첨부 및 AI 스캔</span>
          </button>
        )}
      </div>

      {/* 4. 전자 서명 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>검사원 전자 서명</span>
          {signature && (
            <button 
              type="button" 
              onClick={handleClearSignature} 
              className="text-[9px] font-black text-rose-500 hover:underline"
            >
              지우기
            </button>
          )}
        </h3>

        {signature ? (
          <div className="h-24 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden">
            <img src={signature} alt="수기 서명" className="w-24 h-12 object-contain" />
            <span className="absolute bottom-1 right-2 text-[8px] font-black text-slate-400">전자서명 인증 완료</span>
          </div>
        ) : (
          <div 
            onClick={handleSignSimulate}
            className="h-24 border-2 border-dashed border-slate-350 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer bg-slate-50/50"
          >
            <Edit3 className="w-5 h-5" />
            <span className="text-[9.5px] font-black">이곳을 터치하여 전자 서명란 기입 완료</span>
          </div>
        )}
      </div>

      {/* 5. 최종 종합 판정 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1">
          <Award className="w-4 h-4 text-slate-650" />
          최종 종합 판정 결과
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onStatusChange("PASS")}
            className={`py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border transition-all ${
              status === "PASS"
                ? "bg-emerald-550 border-emerald-600 text-white shadow-md shadow-emerald-500/10"
                : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
            }`}
          >
            <Check className="w-4 h-4" />
            최종 합격 (PASS)
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("FAIL")}
            className={`py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border transition-all ${
              status === "FAIL"
                ? "bg-rose-550 border-rose-600 text-white shadow-md shadow-rose-500/10"
                : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
            }`}
          >
            <X className="w-4 h-4" />
            최종 불량 (FAIL)
          </button>
        </div>
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-650 to-blue-600 hover:from-indigo-750 hover:to-blue-700 disabled:bg-slate-350 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-99"
      >
        {isSubmitting ? "품질 검사서 접수 중..." : "품질 검사서 최종 등록"}
      </button>

    </form>
  );
}
