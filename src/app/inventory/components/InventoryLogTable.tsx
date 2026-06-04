import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { InventoryLog } from '../types';

interface InventoryLogTableProps {
  logs: InventoryLog[];
}

export const InventoryLogTable: React.FC<InventoryLogTableProps> = ({ logs }) => {
  const safeLogs = Array.isArray(logs) ? logs : [];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
            <span>실시간 시계열 입출고 변동 로그</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            재고 수량 보정, 구매 입고, 주문 출고 등 모든 재고의 흐름이 영구 기록된 데이터 피드입니다.
          </p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
          총 {safeLogs.length}개 로그 기록됨
        </span>
      </div>

      <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
        {safeLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            현재고 변동 내역이 아직 존재하지 않습니다.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 sticky top-0">
                <th className="py-3 px-4">일시</th>
                <th className="py-3 px-4">품목명</th>
                <th className="py-3 px-4">품목 구분</th>
                <th className="py-3 px-4 text-center">변동 종류</th>
                <th className="py-3 px-4 text-right">수량</th>
                <th className="py-3 px-4 text-right">단가</th>
                <th className="py-3 px-4">담당자</th>
                <th className="py-3 px-4">변동 메모 및 AI 분석 사유</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {safeLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(log.createdAt).toLocaleString('ko-KR', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{log.itemName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      log.itemType === 'material' 
                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {log.itemType === 'material' ? '자재' : '제품'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                      log.changeType === 'in'
                        ? 'bg-blue-100 text-blue-700'
                        : log.changeType === 'out'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {log.changeType === 'in' ? '입고' : log.changeType === 'out' ? '출고' : '실사조정'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span className={
                      log.changeType === 'in' 
                        ? 'text-blue-600' 
                        : log.changeType === 'out' 
                        ? 'text-rose-600' 
                        : 'text-purple-600'
                    }>
                      {log.changeType === 'in' ? '+' : log.changeType === 'out' ? '-' : ''}
                      {Math.abs(log.quantity).toLocaleString()} 개
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600">
                    ₩ {log.price.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{log.operator}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-[250px] truncate" title={log.note}>
                    {log.note || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};
