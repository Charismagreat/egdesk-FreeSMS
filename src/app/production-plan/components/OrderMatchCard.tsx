import React from "react";
import { UnscheduledOrder } from "../types";
import { ClipboardList, Plus, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";

interface OrderMatchCardProps {
  orders: UnscheduledOrder[];
  isFormOpen: boolean;
  onFormOpenChange: (val: boolean) => void;
  selectedOrderId: string;
  onSelectedOrderIdChange: (val: string) => void;
  selectedEqId: string;
  onSelectedEqIdChange: (val: string) => void;
  startHour: number;
  onStartHourChange: (val: number) => void;
  duration: number;
  onDurationChange: (val: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * 신규 수주 주문의 공정/설비 자동 추천 및 스케줄 배정 카드
 */
export default function OrderMatchCard({
  orders,
  isFormOpen,
  onFormOpenChange,
  selectedOrderId,
  onSelectedOrderIdChange,
  selectedEqId,
  onSelectedEqIdChange,
  startHour,
  onStartHourChange,
  duration,
  onDurationChange,
  onSubmit
}: OrderMatchCardProps) {

  // AI 추천 최적 슬롯 자동 채움 시뮬레이터
  const handleAiAutoMatch = (order: UnscheduledOrder) => {
    onSelectedOrderIdChange(order.orderId);
    
    // 모의 AI 추천 알고리즘:
    // 가동 부하가 상대적으로 낮은 'M-200 (사출 3호기)'이나 조립라인을 동적 할당
    if (order.productName.includes("힌지") || order.qty > 2000) {
      onSelectedEqIdChange("M-300"); // 부하 2순위 설비 추천
      onStartHourChange(14); // 비어있는 시간대 추천
      onDurationChange(4);
    } else {
      onSelectedEqIdChange("M-200"); // 부하 3순위 설비 추천
      onStartHourChange(15);
      onDurationChange(3);
    }

    onFormOpenChange(true);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left space-y-4">
      
      {/* 타이틀 및 헤더 */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <ClipboardList className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">미배정 신규 수주 대기 대장</h4>
            <p className="text-[9px] text-slate-400 font-bold">생산 일정이 수립되지 않은 실시간 주문 목록</p>
          </div>
        </div>
      </div>

      {/* 미배정 수주 카드 리스트 */}
      {orders.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-[10px] font-bold flex flex-col items-center justify-center gap-1">
          <p>🎉 모든 수주 주문이 생산 계획에 완벽히 배정되었습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((item) => (
            <div 
              key={item.orderId} 
              className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between gap-3 text-left"
            >
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-[8.5px] font-black text-slate-400">주문코드: {item.orderId}</span>
                  <span className="text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                    납기일: {item.dueDate.slice(5)}
                  </span>
                </div>
                <h5 className="text-[10px] font-extrabold text-slate-800 mt-1.5">{item.productName}</h5>
                <p className="text-[8.5px] text-slate-450 font-bold mt-0.5">요청 수량: {item.qty.toLocaleString()}개</p>
              </div>

              {/* 배정 버튼 */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectedOrderIdChange(item.orderId);
                    onFormOpenChange(true);
                  }}
                  className="flex-1 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-[9px] font-black transition-colors"
                >
                  수동 계획 수립
                </button>
                <button
                  type="button"
                  onClick={() => handleAiAutoMatch(item)}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black flex items-center justify-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-white" />
                  AI 최적 추천 슬롯
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- 수주 일정 배정 모달창 --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="text-sm font-black text-slate-800">공정 생산 계획 수립</h4>
              <button 
                onClick={() => onFormOpenChange(false)} 
                className="text-slate-400 hover:text-slate-600 text-base font-black px-1.5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 text-[10px] font-bold text-slate-700">
              <div>
                <label className="block mb-1 text-[9px] text-slate-450">대상 수주 주문코드</label>
                <input
                  type="text"
                  value={selectedOrderId}
                  className="w-full border border-slate-350 bg-slate-50 text-slate-500 rounded-xl p-2.5 text-[10px]"
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[9px] text-slate-450">가동 투입 설비</label>
                  <select 
                    value={selectedEqId} 
                    onChange={(e) => onSelectedEqIdChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white text-[10px]"
                  >
                    <option value="M-500">사출 1호기 (M-500)</option>
                    <option value="M-300">사출 2호기 (M-300)</option>
                    <option value="M-200">사출 3호기 (M-200)</option>
                    <option value="A-100">조립 라인 A</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-[9px] text-slate-450">시작 시간 (시)</label>
                  <input
                    type="number"
                    min="9"
                    max="20"
                    value={startHour}
                    onChange={(e) => onStartHourChange(parseInt(e.target.value) || 9)}
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white text-[10px]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[9px] text-slate-450">예상 공정 소요 시간 (H)</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={duration}
                  onChange={(e) => onDurationChange(parseInt(e.target.value) || 4)}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white text-[10px]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center shadow-xs transition-colors"
              >
                생산 계획 최종 확정 및 간트 차트 적재
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
