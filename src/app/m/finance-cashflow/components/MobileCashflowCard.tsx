import React from "react";
import { ForecastTransaction } from "../../../finance-cashflow/types";
import { Coins, AlertOctagon, MessageSquare, Info, CheckCircle2 } from "lucide-react";

interface MobileCashflowCardProps {
  currentBalance: number;
  overdueList: ForecastTransaction[];
  onSendSms: (item: ForecastTransaction) => void;
}

/**
 * 모바일용 모닝 자금 브리핑 및 독촉 발송 컴포넌트
 */
export default function MobileCashflowCard({
  currentBalance,
  overdueList,
  onSendSms
}: MobileCashflowCardProps) {
  
  // 총 미수 연체액
  const totalOverdue = overdueList.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-5 text-slate-800 text-left">
      
      {/* 1. 모닝 자금 브리핑 카드 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4.5 space-y-4 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-indigo-500 animate-pulse" />
          오늘 아침 자금 종합 보고
        </h3>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3">
            <span className="text-[8.5px] font-black text-slate-400 block">가용 현금 잔고</span>
            <p className="text-sm font-black text-slate-850 mt-1">{currentBalance.toLocaleString()}원</p>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
            <span className="text-[8.5px] font-black text-rose-800 block">회수 지연 미수금</span>
            <p className="text-sm font-black text-rose-700 mt-1">{totalOverdue.toLocaleString()}원</p>
          </div>
        </div>

        <div className="flex gap-1 bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5 text-[8.5px] font-bold text-indigo-700">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            금주 중 지출이 많은 날은 급여일(15일)로 총 **32,000,000원**의 인건비가 출금될 예정입니다. 연체 미수 대금 회수가 시급합니다.
          </p>
        </div>
      </div>

      {/* 2. 연체 미수금 수금 독촉 채널 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4.5 space-y-3.5 shadow-2xs">
        <h3 className="text-xs font-black text-slate-850 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>미수금 연체 거래처 ({overdueList.length}건)</span>
          <span className="text-[8.5px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">FreeSMS 연동</span>
        </h3>

        {overdueList.length === 0 ? (
          <div className="text-center py-8 text-slate-450 text-[10px] font-bold flex flex-col items-center justify-center gap-1.5">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            <p>현재 연체 중인 미수 거래처가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overdueList.map((item) => (
              <div 
                key={item.id} 
                className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex justify-between items-center gap-3"
              >
                <div className="min-w-0">
                  <span className="text-[7.5px] font-black bg-rose-100 text-rose-850 border border-rose-200 px-1.5 py-0.2 rounded">
                    기일 초과
                  </span>
                  <h4 className="text-[10.5px] font-extrabold text-slate-850 truncate mt-1">{item.partnerName}</h4>
                  <p className="text-[8.5px] text-slate-400 font-medium mt-0.5">
                    예정일: {item.date.slice(5)} | 연체: {item.amount.toLocaleString()}원
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSendSms(item)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black transition-all shrink-0 shadow-3xs active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                  독촉 발송
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
