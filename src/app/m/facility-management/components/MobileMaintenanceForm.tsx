import React, { useRef } from "react";
import { MobileCheckItem } from "../hooks/useMobileMaintenance";
import { Shield, Wrench, Check, X, Edit3, Mic } from "lucide-react";

interface MobileMaintenanceFormProps {
  equipmentId: string;
  onEquipmentIdChange: (val: string) => void;
  inspector: string;
  onInspectorChange: (val: string) => void;
  checkItems: MobileCheckItem[];
  signature: string | null;
  onSignatureChange: (val: string | null) => void;
  audioNote: string;
  onAudioNoteChange: (val: string) => void;
  status: "PASS" | "FAIL";
  onStatusChange: (val: "PASS" | "FAIL") => void;
  isSubmitting: boolean;
  isRecording: boolean;
  onVoiceSttTrigger: () => void;
  onToggleItem: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * 모바일 설비 예방 점검을 입력하는 전용 폼 컴포넌트
 */
export default function MobileMaintenanceForm({
  equipmentId,
  onEquipmentIdChange,
  inspector,
  onInspectorChange,
  checkItems,
  signature,
  onSignatureChange,
  audioNote,
  onAudioNoteChange,
  status,
  onStatusChange,
  isSubmitting,
  isRecording,
  onVoiceSttTrigger,
  onToggleItem,
  onSubmit
}: MobileMaintenanceFormProps) {

  // 수기 서명 시뮬레이션
  const handleSignSimulate = () => {
    const dummySignature = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='50'><path d='M15,35 C30,15 45,15 60,35 C75,45 80,20 95,20' stroke='black' stroke-width='2' fill='none'/></svg>";
    onSignatureChange(dummySignature);
  };

  const handleClearSignature = () => {
    onSignatureChange(null);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 text-slate-800 text-left">
      
      {/* 1. 기본 정보 입력 (설비코드 & 정비원) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-indigo-500" />
          점검 설비 및 점검원 정보
        </h3>

        <div>
          <label className="text-[10px] font-black text-slate-500 block mb-1">대상 설비 선택</label>
          <select 
            value={equipmentId} 
            onChange={(e) => onEquipmentIdChange(e.target.value)}
            className="w-full text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="M-500">사출 1호기 (M-500)</option>
            <option value="M-300">사출 2호기 (M-300)</option>
            <option value="M-200">사출 3호기 (M-200)</option>
            <option value="A-100">조립 라인 A</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 block mb-1">정비원 성명 (서명자)</label>
          <input
            type="text"
            placeholder="점검원 이름을 입력하세요"
            value={inspector}
            onChange={(e) => onInspectorChange(e.target.value)}
            className="w-full text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      {/* 2. 5대 설비 예방 점검 항목 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-indigo-500" />
          5대 예방 점검 항목
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

      {/* 3. 현장 특이사항 음성 메모 받아쓰기 (STT) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>현장 정비 특이사항 메모</span>
          <button
            type="button"
            onClick={onVoiceSttTrigger}
            disabled={isRecording}
            className="flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-650 hover:bg-indigo-100 rounded text-[8.5px] font-black transition-colors"
          >
            <Mic className="w-3 h-3 text-indigo-600 animate-pulse" />
            {isRecording ? "녹음 중..." : "음성 받아쓰기"}
          </button>
        </h3>

        <textarea
          rows={3}
          placeholder="특이사항이나 보강 정비 내역이 있는 경우 입력해 주세요..."
          value={audioNote}
          onChange={(e) => onAudioNoteChange(e.target.value)}
          className="w-full text-xs font-bold border border-slate-300 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* 4. 터치 수기 전자 서명 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>현장 정비원 수기 서명</span>
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
            <img src={signature} alt="정비사 수기 서명" className="w-24 h-12 object-contain" />
            <span className="absolute bottom-1 right-2 text-[8px] font-black text-slate-450">모바일 서명 승인</span>
          </div>
        ) : (
          <div 
            onClick={handleSignSimulate}
            className="h-24 border-2 border-dashed border-slate-350 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer bg-slate-50/50"
          >
            <Edit3 className="w-5 h-5" />
            <span className="text-[9.5px] font-black">이곳을 터치하여 모바일 서명 기입 완료</span>
          </div>
        )}
      </div>

      {/* 5. 최종 설비 가동 가부 판정 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">
          최종 종합 설비 판정
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
            이상 없음 (PASS)
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
            조치 필요 (FAIL)
          </button>
        </div>
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-650 to-indigo-700 disabled:bg-slate-350 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-99"
      >
        {isSubmitting ? "모바일 점검 내역 송신 중..." : "점검 내역 전송 및 전사 기록 적재"}
      </button>

    </form>
  );
}
