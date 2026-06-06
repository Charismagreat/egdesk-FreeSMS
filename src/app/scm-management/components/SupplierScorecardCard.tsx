import React from "react";
import { ScmShipment, ScmSupplier } from "../types";
import { ListFilter, ShieldAlert, Award, Star, AlertTriangle } from "lucide-react";

interface SupplierScorecardCardProps {
  shipments: ScmShipment[];
  suppliers: ScmSupplier[];
  onOpenAlternativeModal: (shipmentId: string) => void;
}

/**
 * 조달 원자재 납기 지연 예측 현황판 및 협력사 종합 신뢰성 지수 평가 테이블
 */
export default function SupplierScorecardCard({
  shipments,
  suppliers,
  onOpenAlternativeModal,
}: SupplierScorecardCardProps) {
  
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left space-y-6">
      
      {/* --- 1. 실시간 조달 원자재 납기 지연 분석 대장 --- */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <div className="p-1.5 rounded-lg bg-red-50 text-red-650">
            <ShieldAlert className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">실시간 조달 화물 납기 지연 분석 대장</h4>
            <p className="text-[9px] text-slate-400 font-bold">글로벌 물류 및 기상 변수를 종합한 AI 조기 지연 경보</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-150 rounded-2xl">
          <table className="w-full min-w-[700px] border-collapse text-[10px] font-bold text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[8.5px] font-black uppercase text-left">
                <th className="p-3">화물코드</th>
                <th className="p-3">협력사명</th>
                <th className="p-3">조달 품목</th>
                <th className="p-3">배송 단계</th>
                <th className="p-3">예정 납기일</th>
                <th className="p-3 text-right">AI 지연 확률</th>
                <th className="p-3 text-center">조치 단추</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shipments.map((ship) => {
                const isCritical = ship.risk === "CRITICAL";
                const isWarn = ship.risk === "WARNING";
                
                return (
                  <tr key={ship.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-mono font-black">{ship.id}</td>
                    <td className="p-3 truncate max-w-[150px]">{ship.supplierName}</td>
                    <td className="p-3">{ship.item}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                        ship.status === "ARRIVED" ? "bg-emerald-100 text-emerald-700" :
                        ship.status === "DOMESTIC" ? "bg-blue-100 text-blue-700" :
                        ship.status === "CUSTOMS" ? "bg-amber-100 text-amber-700 animate-pulse" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {ship.status === "ARRIVED" ? "입고완료" :
                         ship.status === "DOMESTIC" ? "국내운송" :
                         ship.status === "CUSTOMS" ? "통관중" : "선적완료"}
                      </span>
                    </td>
                    <td className="p-3">{ship.eta}</td>
                    <td className={`p-3 text-right font-black ${
                      isCritical ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-slate-500'
                    }`}>
                      {ship.delayProbability}%
                    </td>
                    <td className="p-3 text-center">
                      {isCritical ? (
                        <button
                          type="button"
                          onClick={() => onOpenAlternativeModal(ship.id)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[8.5px] rounded-lg shadow-2xs transition-colors flex items-center gap-0.5 mx-auto"
                        >
                          <AlertTriangle className="w-3 h-3 text-white" />
                          대체 공급처 매칭
                        </button>
                      ) : (
                        <span className="text-[8px] font-black text-slate-400">조치 불필요 (양호)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 2. 협력사 종합 신뢰성 지수 스코어카드 --- */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-650">
            <Award className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">원자재 협력사 신뢰성 지수 (Scorecard)</h4>
            <p className="text-[9px] text-slate-400 font-bold">최근 3년간 품질 합격률, 납기 준수율 및 가격 변동 추이 누적 메트릭스</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.id} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-left space-y-2.5">
              <div className="flex justify-between items-start">
                <h5 className="text-[10px] font-extrabold text-slate-850 truncate pr-2">{sup.name}</h5>
                <span className="text-[7.5px] font-mono text-slate-400 shrink-0">{sup.id}</span>
              </div>

              {/* 평점 별점 표시 */}
              <div className="flex items-center gap-0.5 text-amber-500 text-[9px] font-black">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{sup.rating.toFixed(1)} / 5.0</span>
              </div>

              {/* 실적 상세 지표 */}
              <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2 text-[8.5px] font-bold text-slate-500">
                <div>
                  <span className="block text-[7.5px] text-slate-400 font-black">납기 준수율</span>
                  <span className={`text-[9.5px] font-black ${sup.deliveryRate >= 90 ? 'text-indigo-600' : 'text-rose-600'}`}>
                    {sup.deliveryRate}%
                  </span>
                </div>
                <div>
                  <span className="block text-[7.5px] text-slate-400 font-black">품질 불량률</span>
                  <span className="text-[9.5px] font-black text-slate-700">{sup.defectRate}%</span>
                </div>
              </div>

              <div className="bg-white/80 border border-slate-200/50 rounded-lg p-2 text-left flex justify-between items-center text-[8.5px] font-black">
                <span className="text-slate-400 text-[7.5px] uppercase">최근 원가 변동</span>
                <span className={sup.priceDiff > 0 ? "text-rose-600" : sup.priceDiff < 0 ? "text-emerald-600" : "text-slate-650"}>
                  {sup.priceDiff > 0 ? `+${sup.priceDiff}% 📈` : sup.priceDiff < 0 ? `${sup.priceDiff}% 📉` : "변동 없음"}
                </span>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
