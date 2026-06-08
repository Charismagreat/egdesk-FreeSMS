import React, { useState, useEffect } from "react";
import { X, Sparkles, RefreshCw, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
  // 재무 분석 관리를 위한 탭 및 데이터 상태 선언
  const [activeSubTab, setActiveSubTab] = useState<"info" | "financial">("info");
  const [financials, setFinancials] = useState<any[]>([]);
  const [loadingFin, setLoadingFin] = useState<boolean>(false);
  const [isFinParsing, setIsFinParsing] = useState<boolean>(false);
  const [finDragOver, setFinDragOver] = useState<boolean>(false);
  const [tempFinData, setTempFinData] = useState<any | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchFinancials = async (partnerId: string) => {
    setLoadingFin(true);
    try {
      const res = await fetch(`/api/financials?company_id=${partnerId}`);
      const data = await res.json();
      if (data.success) {
        setFinancials(data.list);
      }
    } catch (err) {
      console.error('거래처 재무정보 로드 실패:', err);
    } finally {
      setLoadingFin(false);
    }
  };

  useEffect(() => {
    if (selectedPartner && activeSubTab === "financial") {
      fetchFinancials(selectedPartner.id);
    } else {
      setTempFinData(null);
      setMessage(null);
    }
  }, [selectedPartner, activeSubTab]);

  // 거래처 재무제표 PDF 업로드 및 OCR 파싱
  const handleFinPdfUpload = async (fileObj: File) => {
    if (!fileObj || !selectedPartner) return;
    if (fileObj.type !== 'application/pdf') {
      alert('⚠️ 재무제표는 국세청 PDF 파일만 지원됩니다.');
      return;
    }
    
    setIsFinParsing(true);
    setMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('file', fileObj);

      const res = await fetch('/api/financials/upload', {
        method: 'POST',
        body: formData
      });

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || '재무제표 파싱에 실패했습니다.');
      }

      setTempFinData({
        company_id: selectedPartner.id,
        company_type: 'PARTNER',
        fiscal_year: resData.data.fiscalYear || new Date().getFullYear() - 1,
        fiscal_quarter: resData.data.fiscalQuarter || 'YR',
        total_assets: resData.data.totalAssets || 0,
        total_liabilities: resData.data.totalLiabilities || 0,
        total_equity: resData.data.totalEquity || 0,
        revenue: resData.data.revenue || 0,
        operating_income: resData.data.operatingIncome || 0,
        net_income: resData.data.netIncome || 0,
        pdf_file_path: resData.filePath,
        parsed_raw_json: resData.data
      });
      
      setMessage({ type: 'success', text: 'AI가 재무제표 분석을 성공적으로 마쳤습니다! 하단 수치 검증 후 저장해 주세요.' });
    } catch (err: any) {
      console.error('거래처 재무 PDF 파싱 에러:', err);
      setMessage({ type: 'error', text: err.message || '재무제표 판독 중 오류가 발생했습니다.' });
    } finally {
      setIsFinParsing(false);
    }
  };

  const handleTempFinDataChange = (field: string, value: number) => {
    if (!tempFinData) return;
    setTempFinData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // 재무정보 최종 승인 저장
  const handleSaveFinancials = async () => {
    if (!tempFinData || !selectedPartner) return;
    try {
      const res = await fetch('/api/financials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempFinData)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setTempFinData(null);
        fetchFinancials(selectedPartner.id);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert(err.message || '저장 중 오류가 발생했습니다.');
    }
  };

  // 재무제표 삭제
  const handleDeleteFinancials = async (id: string) => {
    if (!confirm('정말로 해당 연도 재무제표를 삭제하시겠습니까? 관련 첨부 파일도 함께 삭제됩니다.')) return;
    try {
      const res = await fetch(`/api/financials?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '재무제표 정보가 정상 파괴되었습니다.' });
        if (selectedPartner) fetchFinancials(selectedPartner.id);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  // 팝업 닫힐 때 탭 인덱스도 함께 초기화되도록 감싸기
  const handleClose = () => {
    setActiveSubTab("info");
    setIsDetailOpen(false);
  };

  if (!isDetailOpen || !selectedPartner) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 md:p-8 shadow-2xl relative z-10 flex flex-col max-h-[85vh] animate-scale-up border border-slate-100/50">
        <button 
          onClick={handleClose} 
          className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors border-none bg-transparent cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1 mb-4">
          <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-black tracking-wider uppercase inline-block">
            Partner Profile
          </span>
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-1.5">
            <span>{selectedPartner.company_name}</span>
            <span className="text-xs font-bold text-slate-400">({selectedPartner.representative || '대표자 미기입'} 대표)</span>
          </h3>
        </div>

        {/* 📊 서브 탭 스위처 */}
        <div className="flex border-b border-slate-100 mb-5 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab("info")}
            className={`pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${
              activeSubTab === "info"
                ? "border-indigo-600 text-indigo-650"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            기본 거래 정보
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("financial")}
            className={`pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${
              activeSubTab === "financial"
                ? "border-indigo-600 text-indigo-650"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            재무 / 신용 분석 AI 📊
          </button>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
          
          {activeSubTab === "info" ? (
            <>
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
            </>
          ) : (
            // 📊 재무 / 신용 분석 AI 탭
            <div className="space-y-5">
              
              {/* 메시지 피드백 */}
              {message && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl border text-[11px] font-semibold ${
                    message.type === 'success'
                      ? 'bg-purple-50 border-purple-100 text-purple-700'
                      : 'bg-rose-50 border-rose-100 text-rose-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{message.text}</span>
                </div>
              )}

              {/* PDF 드롭존 */}
              {isFinParsing ? (
                <div className="border border-purple-200 bg-purple-50/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
                  <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
                  <div>
                    <span className="text-xs font-black text-slate-700 block">AI가 국세청 결산 보고서 PDF를 정밀 분석 중입니다...</span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">이 작업은 약 2~4초 소요됩니다.</span>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setFinDragOver(true); }}
                  onDragLeave={() => setFinDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setFinDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFinPdfUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('partner-fin-uploader')?.click()}
                  className={`border-2 border-dashed rounded-xl p-4.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    finDragOver
                      ? 'border-purple-500 bg-purple-50/30'
                      : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50/30'
                  }`}
                >
                  <span className="text-[11px] font-black text-slate-700 block">이 거래처의 국세청 재무제표 PDF 파일 업로드</span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-1">
                    드래그 앤 드롭 또는 클릭하여 업로드 (AI 자동 수치 기입)
                  </span>
                  <input
                    type="file"
                    id="partner-fin-uploader"
                    accept="application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFinPdfUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              )}

              {/* 파싱 결과 검증 폼 */}
              {tempFinData && (
                <div className="bg-purple-50/10 border border-purple-100 p-4 rounded-xl space-y-3 animate-fade-in text-[10px] font-bold">
                  <span className="text-purple-600 block flex items-center gap-1 font-black">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                    AI 판독 결과 검토 (필요 시 수정 가능)
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400">회계 연도</label>
                      <input
                        type="number"
                        value={tempFinData.fiscal_year}
                        onChange={(e) => handleTempFinDataChange('fiscal_year', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-200 rounded font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400">매출액 (원)</label>
                      <input
                        type="number"
                        value={tempFinData.revenue}
                        onChange={(e) => handleTempFinDataChange('revenue', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-200 rounded font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400">영업이익 (원)</label>
                      <input
                        type="number"
                        value={tempFinData.operating_income}
                        onChange={(e) => handleTempFinDataChange('operating_income', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-200 rounded font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400">당기순이익 (원)</label>
                      <input
                        type="number"
                        value={tempFinData.net_income}
                        onChange={(e) => handleTempFinDataChange('net_income', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-200 rounded font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400">자산 총계 (원)</label>
                      <input
                        type="number"
                        value={tempFinData.total_assets}
                        onChange={(e) => handleTempFinDataChange('total_assets', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-200 rounded font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400">부채 총계 (원)</label>
                      <input
                        type="number"
                        value={tempFinData.total_liabilities}
                        onChange={(e) => handleTempFinDataChange('total_liabilities', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-200 rounded font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400">자본 총계 (원)</label>
                      <input
                        type="number"
                        value={tempFinData.total_equity}
                        onChange={(e) => handleTempFinDataChange('total_equity', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-200 rounded font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1.5 border-t border-purple-100/50">
                    <button
                      type="button"
                      onClick={() => setTempFinData(null)}
                      className="px-2.5 py-1.5 border border-slate-200 rounded text-slate-500 hover:bg-slate-100 cursor-pointer font-bold"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveFinancials}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded cursor-pointer font-bold"
                    >
                      최종 저장
                    </button>
                  </div>
                </div>
              )}

              {/* 📊 미니 실적 트렌드 차트 */}
              {financials.length > 0 && (
                <div className="bg-purple-50/10 border border-purple-100/30 p-4 rounded-2xl space-y-3 shrink-0">
                  <span className="text-[10px] font-black text-slate-450 tracking-wider block">📊 AI 재무 실적 트렌드 (최근 3개년 매출 및 영업이익)</span>
                  <div className="h-28 w-full flex items-end justify-around pt-4 pb-2 border-b border-slate-100 bg-white/50 rounded-xl px-2">
                    {financials.slice(0, 3).reverse().map((fin, idx) => {
                      const maxVal = Math.max(...financials.map(f => Math.max(f.revenue, Math.abs(f.operating_income))));
                      const revHeight = maxVal > 0 ? (fin.revenue / maxVal) * 70 : 0;
                      const opHeight = maxVal > 0 ? (Math.abs(fin.operating_income) / maxVal) * 70 : 0;
                      const isOpNegative = fin.operating_income < 0;

                      return (
                        <div key={idx} className="flex flex-col items-center space-y-1.5 w-1/4">
                          <div className="flex items-end justify-center gap-1 w-full h-16 relative">
                            {/* 매출액 막대 */}
                            <div 
                              style={{ height: `${Math.max(4, revHeight)}px` }} 
                              className="w-2.5 bg-purple-400 rounded-t-sm hover:bg-purple-500 transition-all cursor-help"
                              title={`매출액: ${(fin.revenue).toLocaleString()}원`}
                            ></div>
                            {/* 영업이익 막대 */}
                            <div 
                              style={{ height: `${Math.max(4, opHeight)}px` }} 
                              className={`w-2.5 rounded-t-sm hover:opacity-85 transition-all cursor-help ${
                                isOpNegative ? 'bg-rose-400' : 'bg-indigo-400'
                              }`}
                              title={`영업이익: ${(fin.operating_income).toLocaleString()}원`}
                            ></div>
                          </div>
                          <span className="text-[9px] font-extrabold text-slate-500">{fin.fiscal_year}년</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-[9px] text-slate-400 font-extrabold">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-400 rounded-full"></div>매출액</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-400 rounded-full"></div>영업이익</div>
                  </div>
                </div>
              )}

              {/* 재무제표 이력 리스트 테이블 */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block">연도별 재무 내역 리스트</span>
                {loadingFin ? (
                  <p className="text-center py-6 text-xs text-slate-400">데이터 로드 중...</p>
                ) : financials.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400 border border-slate-100 border-dashed rounded-xl bg-slate-50/30">
                    등록된 재무제표 정보가 없습니다. 국세청 결산 보고서를 업로드해 주세요.
                  </p>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm shrink-0 max-h-[200px] overflow-y-auto pr-0.5">
                    <table className="w-full text-[10px] font-semibold text-slate-700 text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="p-2.5">연도</th>
                          <th className="p-2.5">매출 / 이익률</th>
                          <th className="p-2.5">영업이익</th>
                          <th className="p-2.5">부채비율</th>
                          <th className="p-2.5">원본</th>
                          <th className="p-2.5 text-center">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {financials.map((fin) => {
                          const opMargin = fin.revenue ? ((fin.operating_income / fin.revenue) * 100).toFixed(1) : '0.0';
                          const debtRatio = fin.total_equity ? ((fin.total_liabilities / fin.total_equity) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={fin.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="p-2.5 font-bold text-slate-900">{fin.fiscal_year}년</td>
                              <td className="p-2.5">
                                <div>{(fin.revenue).toLocaleString()}원</div>
                                <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-1 py-0.2 rounded border border-emerald-100 mt-0.5 inline-block">
                                  이익률 {opMargin}%
                                </span>
                              </td>
                              <td className="p-2.5">
                                <span className={fin.operating_income < 0 ? 'text-rose-500 font-bold' : 'text-slate-700'}>
                                  {(fin.operating_income).toLocaleString()}원
                                </span>
                              </td>
                              <td className="p-2.5">
                                <span className={`text-[8px] font-black px-1 py-0.2 rounded border inline-block ${
                                  Number(debtRatio) > 200 
                                    ? 'bg-rose-50 border-rose-100 text-rose-500'
                                    : 'bg-indigo-50 border-indigo-100 text-indigo-500'
                                }`}>
                                  {debtRatio}%
                                </span>
                              </td>
                              <td className="p-2.5">
                                {fin.pdf_file_path ? (
                                  <a href={fin.pdf_file_path} target="_blank" rel="noreferrer" className="text-purple-600 font-bold hover:underline">
                                    PDF 📄
                                  </a>
                                ) : '-'}
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFinancials(fin.id)}
                                  className="text-rose-500 hover:text-rose-700 p-0.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 flex">
          <button 
            onClick={handleClose} 
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md border-none cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
