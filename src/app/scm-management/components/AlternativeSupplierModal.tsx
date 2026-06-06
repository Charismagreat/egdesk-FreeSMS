import React, { useState } from "react";
import { ScmShipment, ScmAlternative } from "../types";
import { X, CheckCircle, HelpCircle, Star, Calendar, DollarSign, RefreshCw } from "lucide-react";

interface AlternativeSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string | null;
  shipments: ScmShipment[];
  alternatives: Record<string, ScmAlternative[]>;
  onSwitchSupplier: (shipmentId: string, alternativeSupplierId: string) => Promise<void>;
}

/**
 * AI 추천 대체 공급처 비교 및 원클릭 발주처 우회 전환 모달
 */
export default function AlternativeSupplierModal({
  isOpen,
  onClose,
  shipmentId,
  shipments,
  alternatives,
  onSwitchSupplier,
}: AlternativeSupplierModalProps) {
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !shipmentId) return null;

  const currentShipment = shipments.find((s) => s.id === shipmentId);
  const alternativeList = alternatives[shipmentId] || [];

  if (!currentShipment) return null;

  const handleSwitch = async () => {
    if (!selectedAlternativeId) return;
    setIsSubmitting(true);
    try {
      await onSwitchSupplier(shipmentId, selectedAlternativeId);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
      setSelectedAlternativeId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      {/* 모달 카드 컨테이너 */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col text-left">
        
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md uppercase">
              AI Risk Mitigation
            </span>
            <h3 className="text-sm font-black text-slate-800 mt-1">대체 공급사 전환 및 납기 우회</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 현재 위기 상황 요약 */}
        <div className="p-6 bg-rose-50/50 border-b border-rose-100/30 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
          <div>
            <span className="block text-[8.5px] text-slate-400 font-black">위험 발생 발주건</span>
            <span className="text-[11px] text-slate-800 font-mono font-black">{currentShipment.id}</span>
          </div>
          <div>
            <span className="block text-[8.5px] text-slate-400 font-black">자재명</span>
            <span className="text-[11px] text-slate-800">{currentShipment.item}</span>
          </div>
          <div>
            <span className="block text-[8.5px] text-slate-400 font-black">기존 협력업체 / 지연 위험도</span>
            <span className="text-[11px] text-rose-650 flex items-center gap-1 font-black">
              {currentShipment.supplierName} ({currentShipment.delayProbability}%)
            </span>
          </div>
        </div>

        {/* 대체 공급사 리스트 영역 */}
        <div className="p-6 flex-1 space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            AI 추천 우회 조달처 후보군 ({alternativeList.length}개)
          </h4>

          {alternativeList.length === 0 ? (
            <div className="py-12 text-center text-[10px] font-bold text-slate-400">
              현재 해당 자재에 대한 추천 대체 공급사가 존재하지 않습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {alternativeList.map((alt) => {
                const isSelected = selectedAlternativeId === alt.id;
                return (
                  <div
                    key={alt.id}
                    onClick={() => setSelectedAlternativeId(alt.id)}
                    className={`border rounded-2xl p-4 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isSelected
                        ? "border-indigo-650 bg-indigo-50/30 ring-2 ring-indigo-600/15"
                        : "border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50"
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      {/* 업체명 및 평점 */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">{alt.name}</span>
                        <div className="flex items-center gap-0.5 text-amber-500 text-[9px] font-black">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{alt.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* 단가 및 리드타임 */}
                      <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          예상 단가: <b className="text-slate-700">{alt.price.toLocaleString("ko-KR")}원</b>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          예상 리드타임: <b className="text-indigo-650">{alt.leadTime}일 이내</b>
                        </span>
                      </div>

                      {/* AI 우회 사유 */}
                      <div className="bg-white/80 border border-slate-200/50 rounded-xl p-3 text-[9px] font-bold text-indigo-800 bg-indigo-50/20 border-indigo-100/50">
                        <span className="block text-[8px] text-indigo-500 font-black mb-0.5">AI 추천 & 우회 분석 사유</span>
                        {alt.reason}
                      </div>
                    </div>

                    {/* 라디오 선택자 */}
                    <div className="shrink-0 flex items-center justify-end">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-indigo-650 bg-indigo-650 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 하단 푸터 (버튼 영역) */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <p className="text-[9px] text-slate-400 font-bold max-w-sm">
            ※ 대체 전환 시 기존 발주는 즉각 취소되며, 신규 파트너사에 AI 우회 발주 주문이 실시간으로 발송됩니다.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-250 hover:bg-slate-100 text-slate-650 font-bold text-[10px] rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              disabled={!selectedAlternativeId || isSubmitting}
              onClick={handleSwitch}
              className={`px-4 py-2 text-white font-extrabold text-[10px] rounded-xl shadow-2xs transition-colors flex items-center gap-1 ${
                selectedAlternativeId && !isSubmitting
                  ? "bg-indigo-650 hover:bg-indigo-700"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  전환 처리 중...
                </>
              ) : (
                "우회 발주 승인 및 전환"
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
