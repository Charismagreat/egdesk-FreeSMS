import React from "react";
import { X, Sparkles } from "lucide-react";
import { Partner, DetailHistory } from "../types";

interface PartnerDetailModalProps {
  isDetailOpen: boolean;
  setIsDetailOpen: (open: boolean) => void;
  selectedPartner: Partner | null;
  detailHistory: DetailHistory;
  detailLoading: boolean;
}

export function PartnerDetailModal({
  isDetailOpen,
  setIsDetailOpen,
  selectedPartner,
  detailHistory,
  detailLoading
}: PartnerDetailModalProps) {
  if (!isDetailOpen || !selectedPartner) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 md:p-8 shadow-2xl relative z-10 flex flex-col max-h-[85vh] animate-scale-up border border-slate-100/50">
        <button 
          onClick={() => setIsDetailOpen(false)} 
          className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors border-none bg-transparent cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1 mb-5">
          <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-black tracking-wider uppercase inline-block">
            Partner Profile
          </span>
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-1.5">
            <span>{selectedPartner.company_name}</span>
            <span className="text-xs font-bold text-slate-400">({selectedPartner.representative || '대표자 미기입'} 대표)</span>
          </h3>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
          
          {/* 상세 스펙 명세 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4.5 rounded-2xl border border-slate-100 text-xs font-semibold">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">사업자 번호</span>
              <span className="text-slate-700 font-bold block">{selectedPartner.business_number || '미기입'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">회사 번호</span>
              <span className="text-slate-700 font-bold block">{selectedPartner.phone || '미기입'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">우대 등급</span>
              <span className="text-indigo-600 font-black block">{selectedPartner.vip_level} Grade</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">실무 담당자</span>
              <span className="text-slate-700 font-bold block">{selectedPartner.manager_name || '미지정'} ({selectedPartner.manager_phone || '연락처 없음'})</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-400 block mb-0.5">계산서 이메일</span>
              <span className="text-slate-700 block truncate">{selectedPartner.email || '미기입'}</span>
            </div>
            <div className="col-span-3 border-t border-slate-200/50 pt-2 mt-1">
              <span className="text-[10px] text-slate-400 block mb-0.5">사업장 주소</span>
              <span className="text-slate-700 block">{selectedPartner.address || '소재지 미등록'}</span>
            </div>
          </div>

          {/* 과거 수/발주 실시간 타임라인 */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>실시간 B2B 거래 히스토리 타임라인</span>
            </h4>

            {detailLoading ? (
              <p className="text-center py-8 text-xs text-slate-400">거래 이력 마이닝 중...</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {selectedPartner.type === 'VENDOR' ? (
                  // 공급사 발주 목록
                  detailHistory.purchaseOrders.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-xs font-semibold">발주 거래 이력이 존재하지 않습니다.</p>
                  ) : (
                    detailHistory.purchaseOrders.map((po: any) => (
                      <div key={po.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-semibold">
                        <div>
                          <span className="font-mono text-slate-400 text-[10px] block">{po.id}</span>
                          <span className="text-slate-800 mt-0.5 block">발주일: {po.created_at.substring(0, 10)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-indigo-600 block">{parseInt(po.total_amount).toLocaleString()}원</span>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase mt-1 ${po.status === 'PENDING_INBOUND' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {po.status === 'PENDING_INBOUND' ? '입고대기' : '입고완료'}
                          </span>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  // 바이어 수주 목록
                  detailHistory.salesOrders.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-xs font-semibold">수주 거래 이력이 존재하지 않습니다.</p>
                  ) : (
                    detailHistory.salesOrders.map((so: any) => (
                      <div key={so.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-semibold">
                        <div>
                          <span className="font-mono text-slate-400 text-[10px] block">{so.id}</span>
                          <span className="text-slate-800 mt-0.5 block">수주일: {so.created_at.substring(0, 10)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-600 block">{parseInt(so.total_amount).toLocaleString()}원</span>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase mt-1 ${so.status === 'REGISTERED' ? 'bg-amber-150 text-amber-655' : 'bg-emerald-600 text-white'}`}>
                            {so.status === 'REGISTERED' ? '수주대기' : '확정완료'}
                          </span>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            )}
          </div>

        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 flex">
          <button 
            onClick={() => setIsDetailOpen(false)} 
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md border-none cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
