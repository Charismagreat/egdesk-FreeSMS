'use client';

import React, { useEffect, useState } from 'react';
import { X, ClipboardList, Loader2, Sparkles } from 'lucide-react';

interface InboundDetailItem {
  id: string;
  inbound_id: string;
  type: string;
  category: string;
  item_name: string;
  item_code: string;
  barcode: string;
  spec: string;
  unit: string;
  box_qty: number;
  quantity: number;
  price: number;
  partner_name: string;
  inbound_date: string;
  location: string;
  note: string;
}

interface InboundDetailModalProps {
  inboundId: string;
  onClose: () => void;
}

export const InboundDetailModal: React.FC<InboundDetailModalProps> = ({ inboundId, onClose }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<InboundDetailItem[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchInboundDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/inventory/inbounds?inbound_id=${inboundId}`);
        const resData = await res.json();
        if (resData.success) {
          setItems(resData.data || []);
        } else {
          setError(resData.error || '상세 입고 내역을 불러오지 못했습니다.');
        }
      } catch (err: any) {
        setError('데이터 통신 중 오류가 발생했습니다: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (inboundId) {
      fetchInboundDetail();
    }
  }, [inboundId]);

  const totalQuantity = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const totalAmount = items.reduce((acc, it) => acc + ((it.quantity || 0) * (it.price || 0)), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-[95vw] lg:max-w-7xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* 모달 헤더 */}
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-indigo-100/30">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500 text-white rounded-2xl shadow-md shadow-indigo-200">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>일괄 입고 등록 상세 내역 (14대 전체 항목 매핑 조회)</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono">
                  {inboundId}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                해당 일괄 입고 등록 절차를 통해 마스터 품목 대장에 연동 적재된 전체 상세 속성 목록입니다.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400 font-bold">상세 목록 데이터를 로딩 중...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-150 text-red-700 text-xs rounded-2xl">
              ⚠️ {error}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-450 font-semibold">
              조회된 세부 품목 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-slate-100 rounded-2xl overflow-x-auto w-full">
                <table className="w-full border-collapse text-left text-[11px] min-w-[2140px] table-fixed">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-black text-slate-500">
                      <th className="p-3 w-[80px]">구분</th>
                      <th className="p-3 w-[120px]">카테고리</th>
                      <th className="p-3 w-[260px]">품목명</th>
                      <th className="p-3 w-[150px]">품목코드</th>
                      <th className="p-3 w-[150px]">바코드</th>
                      <th className="p-3 w-[160px]">규격</th>
                      <th className="p-3 w-[80px]">단위</th>
                      <th className="p-3 w-[110px] text-right">박스당 입수량</th>
                      <th className="p-3 w-[110px] text-right">입고 수량</th>
                      <th className="p-3 w-[130px] text-right">입고 단가</th>
                      <th className="p-3 w-[150px] text-right">총액</th>
                      <th className="p-3 w-[180px]">공급처명(거래처)</th>
                      <th className="p-3 w-[140px]">입고일자</th>
                      <th className="p-3 w-[120px]">적재위치</th>
                      <th className="p-3 w-[200px]">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            item.type === 'material' || item.type === '자재'
                              ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {item.type === 'material' || item.type === '자재' ? '자재' : '제품'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 font-semibold">{item.category}</td>
                        <td className="p-3 font-semibold text-slate-800">{item.item_name}</td>
                        <td className="p-3 text-slate-450 font-mono">{item.item_code}</td>
                        <td className="p-3 text-slate-450 font-mono">{item.barcode}</td>
                        <td className="p-3 text-slate-400 font-medium">{item.spec}</td>
                        <td className="p-3 text-slate-500">{item.unit}</td>
                        <td className="p-3 text-right text-slate-600 font-mono">{(item.box_qty || 1).toLocaleString()}</td>
                        <td className="p-3 text-right font-black text-indigo-600 font-mono">{item.quantity.toLocaleString()} 개</td>
                        <td className="p-3 text-right text-slate-650 font-mono">{item.price.toLocaleString()} 원</td>
                        <td className="p-3 text-right text-slate-900 font-bold font-mono">
                          {((item.quantity || 0) * (item.price || 0)).toLocaleString()} 원
                        </td>
                        <td className="p-3 text-slate-600 font-semibold">{item.partner_name}</td>
                        <td className="p-3 text-slate-450 font-mono">{item.inbound_date}</td>
                        <td className="p-3 text-slate-500">{item.location}</td>
                        <td className="p-3 text-slate-400 truncate max-w-[150px]" title={item.note}>{item.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 하단 요약 카드 */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex justify-between items-center text-xs font-black text-slate-700">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span>총 합계 수량: <strong className="text-indigo-600">{totalQuantity.toLocaleString()}</strong> 개</span>
                </div>
                <div>
                  <span>총 자산 가치액: <strong className="text-emerald-600">{totalAmount.toLocaleString()}</strong> 원</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="p-5 border-t border-slate-50 bg-slate-50/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl active:scale-95 transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
