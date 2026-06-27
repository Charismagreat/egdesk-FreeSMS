'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, RefreshCw, CheckCircle2, AlertCircle, Play, ExternalLink } from 'lucide-react';

interface InboundOcrItem {
  itemType?: string;      // 1. 구분
  category?: string;      // 2. 카테고리
  itemName: string;       // 3. 품목명
  itemCode?: string;      // 4. 품목코드
  barcode: string;        // 5. 바코드
  spec: string;           // 6. 규격
  unitType?: string;      // 7. 단위
  boxContains?: number;   // 8. 박스당 입수량
  quantity: number;       // 9. 입고 수량
  price: number;          // 10. 입고 단가
  location?: string;      // 13. 적재위치
  note: string;           // 14. 비고 (매핑 안 된 기타 정보)
  matchedItemId: number | string;
}

interface InboundOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialFile?: File | null;
}

export const InboundOcrModal: React.FC<InboundOcrModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialFile
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [ocrScanning, setOcrScanning] = useState<boolean>(false);
  const [ocrSuccess, setOcrSuccess] = useState<boolean>(false);
  const [ocrFilename, setOcrFilename] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // 입고 OCR 폼 상태
  const [ocrForm, setOcrForm] = useState<{
    partnerName: string;
    inboundDate: string;
    items: InboundOcrItem[];
    fileUrl: string;
  }>({
    partnerName: '',
    inboundDate: '',
    items: [],
    fileUrl: ''
  });

  // 파일 분석 공통 처리 로직
  const processOcrFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setOcrScanning(true);
    setOcrSuccess(false);
    setOcrFilename(selectedFile.name);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch('/api/inventory/inbounds/ocr', {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        
        if (data.success) {
          setOcrScanning(false);
          setOcrSuccess(true);
          setSuccessMessage(`공급처 및 ${data.items?.length || 0}개 품목의 단가/수량 파싱 완료`);
          
          // 받은 발주서 OCR 연동 로직 수준으로 품목 초기화 매핑 진행
          const enrichedItems = (data.items || []).map((it: any) => ({
            itemType: it.itemType || '자재',
            category: it.category || '기타',
            itemName: it.itemName || '',
            itemCode: it.itemCode || (it.matchedItemId && it.matchedItemId !== 'NEW' ? `ITEM-${it.matchedItemId}` : 'NEW'),
            barcode: it.barcode || '',
            spec: it.spec || '',
            unitType: it.unitType || '개',
            boxContains: Number(it.boxContains) || 1,
            quantity: Number(it.quantity) || 1,
            price: Number(it.price) || 0,
            location: it.location || '자율입고창고',
            note: it.note || '',
            matchedItemId: it.matchedItemId || 'NEW',
            partnerName: data.partnerName || '',
            inboundDate: data.inboundDate || new Date().toISOString().slice(0, 10)
          }));

          setOcrForm({
            partnerName: data.partnerName || '',
            inboundDate: data.inboundDate || new Date().toISOString().slice(0, 10),
            items: enrichedItems,
            fileUrl: base64Data
          });
        } else {
          setOcrScanning(false);
          alert('OCR 분석 실패: ' + (data.error || '알 수 없는 오류'));
          resetOcrState();
        }
      } catch (error: any) {
        console.error(error);
        setOcrScanning(false);
        alert('분석 통신 중 오류가 발생했습니다: ' + error.message);
        resetOcrState();
      }
    };
    reader.onerror = () => {
      setOcrScanning(false);
      alert('파일을 읽는 도중 오류가 발생했습니다.');
    };
    reader.readAsDataURL(selectedFile);
  };

  // 마운트 하이드레이션 가드용 이펙트
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 모달이 열리고 initialFile이 들어오면 자동으로 OCR 분석 기동
  React.useEffect(() => {
    if (isOpen && initialFile) {
      processOcrFile(initialFile);
    }
  }, [isOpen, initialFile]);

  if (!mounted) return null;
  if (!isOpen) return null;

  const resetOcrState = () => {
    setFile(null);
    setOcrScanning(false);
    setOcrSuccess(false);
    setOcrFilename('');
    setSuccessMessage('');
    setOcrForm({
      partnerName: '',
      inboundDate: '',
      items: [],
      fileUrl: ''
    });
  };

  const handleClose = () => {
    resetOcrState();
    onClose();
  };

  // 수동 파일 선택 시 분석 트리거
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processOcrFile(selectedFile);
    }
  };

  // 전체 구분을 일괄 변경하는 헬퍼
  const handleBulkItemTypeChange = (type: '자재' | '제품') => {
    if (!ocrForm.items.length) return;
    const newItems = ocrForm.items.map(it => ({ ...it, itemType: type }));
    setOcrForm({ ...ocrForm, items: newItems });
  };


  // 최종 입고 승인 실행 (confirm/route.ts 혹은 handleInventoryInbound 호출)
  const handleConfirmInbound = async () => {
    if (ocrForm.items.length === 0) {
      alert('입고할 품목 정보가 없습니다.');
      return;
    }
    const missingPartner = ocrForm.items.some(it => !it.partnerName);
    if (missingPartner) {
      alert('공급처 상호명은 필수 입력 항목입니다.');
      return;
    }

    try {
      setIsProcessing(true);

      const requestItems = ocrForm.items.map(it => ({
        itemName: it.itemName,
        spec: it.spec || '',
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
        barcode: it.barcode || '',
        matchedItemId: it.matchedItemId,
        location: it.location || '자율입고창고',
        itemType: it.itemType || '자재',
        category: it.category || '기타',
        unitType: it.unitType || '개',
        boxContains: Number(it.boxContains) || 1,
        note: it.note || ''
      }));

      const res = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionName: 'ocr_confirm_inventory_inbound',
          partnerName: ocrForm.items[0]?.partnerName || ocrForm.partnerName,
          inboundDate: ocrForm.items[0]?.inboundDate || ocrForm.inboundDate,
          items: requestItems,
          pdfFilePath: file?.name || 'AI 비전 OCR 입고',
          operator: '최고 관리자'
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('AI OCR 입고 등록이 성공적으로 승인되어 재고 대장에 반영되었습니다.');
        handleClose();
        onSuccess();
      } else {
        alert('입고 저장 실패: ' + (data.error || '서버 오류'));
      }
    } catch (e: any) {
      alert('저장 중 통신 오류 발생: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const modalWidthClass = ocrSuccess ? 'w-[98vw] max-w-[98vw]' : 'w-full max-w-2xl';

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2">
      <div className={`bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col h-[83vh] max-h-[83vh] animate-in fade-in zoom-in-95 duration-300 transition-all ${modalWidthClass}`}>
        
        {/* 우상단 닫기 버튼 */}
        <button 
          onClick={handleClose} 
          disabled={ocrScanning || isProcessing}
          className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors disabled:opacity-55 cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {ocrSuccess ? (
          /* 분석 성공 시: 좌우 완전 2분할 (좌측은 천장부터 꽉 참, 우측은 타이틀+컨트롤+테이블+푸터 포함) */
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-10 gap-6 h-full">
            
            {/* 좌측: 업로드된 원본 문서 뷰어 (30% 점유, 천장부터 바닥까지 꽉 채우는 h-[70vh] 및 여백 최소화) */}
            <div className="lg:col-span-3 border border-slate-150 rounded-2xl bg-slate-50 p-1 flex flex-col items-center justify-center h-[75vh] lg:h-[75vh] relative overflow-hidden shadow-inner">
              <span className="text-[9px] font-black text-slate-400 absolute top-2 left-2 bg-white/80 px-2 py-0.5 rounded border border-slate-100 z-10 shadow-sm">📄 명세서 원본 문서</span>
              {ocrForm.fileUrl && (
                <button
                  type="button"
                  onClick={() => window.open(ocrForm.fileUrl, '_blank')}
                  className="absolute top-3 right-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0 z-20 cursor-pointer"
                  title="새 창에서 원본 파일 열람 및 인쇄"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>새 창 열람/인쇄</span>
                </button>
              )}
              {ocrForm.fileUrl ? (
                ocrForm.fileUrl.startsWith('data:application/pdf') ? (
                  <embed src={`${ocrForm.fileUrl}#toolbar=0&navpanes=0`} type="application/pdf" className="w-full h-full rounded-xl" />
                ) : (
                  <div className="w-full h-full overflow-auto flex items-center justify-center p-1">
                    <img src={ocrForm.fileUrl} className="max-w-full max-h-[71vh] object-contain rounded-xl shadow-sm animate-fade-in" alt="명세서 원본" />
                  </div>
                )
              ) : (
                <div className="text-slate-400 text-xs font-bold">원본 문서 이미지가 없습니다.</div>
              )}
            </div>

            {/* 우측: 70% 점유, 타이틀 + 입고정보 + 15컬럼 테이블 + 하단 버튼들 */}
            <div className="lg:col-span-7 flex flex-col h-[75vh] lg:h-[75vh] min-h-0">
              
              {/* 타이틀 및 메인 폼 */}
              <div className="flex flex-col min-h-0 flex-1 space-y-2">
                {/* 헤더: 타이틀 + 조작 버튼 그룹 */}
                <div className="flex items-center justify-between shrink-0 pt-2 mb-4">
                  {/* 모달 제목 */}
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-500" />
                    <span>AI 분석 입고</span>
                  </h3>

                  {/* 버튼 그룹 (상단으로 이동) */}
                  <div className="flex items-center space-x-2 pr-12">
                    {/* 일괄 구분 제어 토글 바 */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-2 space-x-0.5 shrink-0">
                      <button
                        onClick={() => handleBulkItemTypeChange('자재')}
                        type="button"
                        className="px-2 py-1 bg-white hover:bg-slate-50 text-[9px] font-black text-indigo-600 rounded-md shadow-sm border border-slate-150 transition active:scale-95 cursor-pointer"
                        title="모든 품목의 구분을 '자재'로 일괄 변경"
                      >
                        전체 자재로
                      </button>
                      <button
                        onClick={() => handleBulkItemTypeChange('제품')}
                        type="button"
                        className="px-2 py-1 bg-white hover:bg-slate-50 text-[9px] font-black text-emerald-600 rounded-md shadow-sm border border-slate-150 transition active:scale-95 cursor-pointer"
                        title="모든 품목의 구분을 '제품'로 일괄 변경"
                      >
                        전체 제품으로
                      </button>
                    </div>

                    <button
                      onClick={handleClose}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleConfirmInbound}
                      disabled={isProcessing}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>적재 반영 중...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>입고 승인</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>


                {/* 14개 전체 컬럼 컴팩트 테이블 (세로 공간 꽉 채우기 위해 66vh 고정) */}
                <div className="h-[70vh] lg:h-[70vh] border border-slate-100 rounded-2xl overflow-y-auto bg-white shadow-sm">
                  <table className="w-full border-collapse text-left text-[10px] table-fixed">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 font-black text-slate-500 text-[9px] sticky top-0 z-10 backdrop-blur-sm">
                        <th className="py-2 px-1 w-[3%] text-center">No.</th>
                        <th className="py-2 px-1 w-[4%] text-center">구분</th>
                        <th className="py-2 px-1 w-[6%]">카테고리</th>
                        <th className="py-2 px-1 w-[15%]">품목명</th>
                        <th className="py-2 px-1 w-[8%]">품목코드</th>
                        <th className="py-2 px-1 w-[7%]">바코드</th>
                        <th className="py-2 px-1 w-[7%]">규격</th>
                        <th className="py-2 px-1 w-[3%] text-center">단위</th>
                        <th className="py-2 px-1 w-[4%] text-right">입수량</th>
                        <th className="py-2 px-1 w-[5%] text-right">입고수량</th>
                        <th className="py-2 px-1 w-[6%] text-right">입고단가</th>
                        <th className="py-2 px-1 w-[7%] text-right">총액</th>
                        <th className="py-2 px-1 w-[9%]">공급처명</th>
                        <th className="py-2 px-1 w-[7%] text-center">입고일자</th>
                        <th className="py-2 px-1 w-[5%] text-center">적재위치</th>
                        <th className="py-2 px-1 w-[9%]">비고</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {ocrForm.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors odd:bg-white even:bg-slate-50/10">
                          {/* 0. No. */}
                          <td className="py-2 px-1 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                          {/* 1. 구분 */}
                          <td className="py-2 px-1 text-center">
                            <select
                              value={item.itemType || '자재'}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].itemType = e.target.value;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="bg-transparent text-[9px] font-black text-slate-800 border-none focus:outline-none focus:ring-0 cursor-pointer"
                            >
                              <option value="자재">자재</option>
                              <option value="제품">제품</option>
                            </select>
                          </td>
                          {/* 2. 카테고리 */}
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              value={item.category || ''}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].category = e.target.value;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="w-full px-0.5 py-0.5 border border-transparent hover:border-slate-200 rounded text-[10px] font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          {/* 3. 품목명 */}
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].itemName = e.target.value;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="w-full px-0.5 py-0.5 border border-transparent hover:border-slate-200 rounded text-[10px] font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          {/* 4. 품목코드 */}
                          <td className="py-2 px-1 text-slate-400 font-mono truncate" title={item.itemCode || 'NEW'}>
                            {item.itemCode || 'NEW'}
                          </td>
                          {/* 5. 바코드 */}
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              value={item.barcode}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].barcode = e.target.value;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="w-full px-0.5 py-0.5 border border-transparent hover:border-slate-200 rounded text-[10px] text-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          {/* 6. 규격 */}
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              value={item.spec}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].spec = e.target.value;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="w-full px-0.5 py-0.5 border border-transparent hover:border-slate-200 rounded text-[10px] text-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          {/* 7. 단위 */}
                          <td className="py-2 px-1 text-center">
                            <input
                              type="text"
                              value={item.unitType || '개'}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].unitType = e.target.value;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="w-full px-0.5 py-0.5 border border-transparent hover:border-slate-200 rounded text-[10px] text-center text-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          {/* 8. 입수량 */}
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              value={item.boxContains || 1}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].boxContains = Number(e.target.value) || 1;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="w-full px-0.5 py-0.5 border border-transparent hover:border-slate-200 rounded text-[10px] text-right text-slate-600 font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          {/* 9. 입고수량 */}
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].quantity = Number(e.target.value) || 0;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="w-full px-0.5 py-0.5 border border-transparent hover:border-slate-200 rounded text-[10px] font-black text-indigo-650 text-right font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          {/* 10. 입고단가 */}
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].price = Number(e.target.value) || 0;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="w-full px-0.5 py-0.5 border border-transparent hover:border-slate-200 rounded text-[10px] text-slate-700 text-right font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          {/* 11. 총액 (실시간 계산) */}
                          <td className="py-2 px-1 text-right text-slate-900 font-black font-mono">
                            {((item.quantity || 0) * (item.price || 0)).toLocaleString()} 원
                          </td>
                          {/* 12. 공급처명 (행별 보정) */}
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              value={item.partnerName || ''}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].partnerName = e.target.value;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="w-full px-0.5 py-0.5 border border-transparent hover:border-slate-200 rounded text-[10px] text-slate-700 font-bold focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          {/* 13. 입고일자 (행별 보정) */}
                          <td className="py-2 px-1">
                            <input
                              type="date"
                              value={item.inboundDate || ''}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].inboundDate = e.target.value;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="w-full px-0.5 py-0.5 border border-transparent hover:border-slate-200 rounded text-[10px] text-slate-600 font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          {/* 14. 적재위치 */}
                          <td className="py-2 px-1 text-center">
                            <input
                              type="text"
                              value={item.location || '자율입고창고'}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].location = e.target.value;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="w-full px-0.5 py-0.5 border border-transparent hover:border-slate-200 rounded text-[10px] text-center text-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          {/* 15. 비고 (미매핑 메타) */}
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              value={item.note}
                              onChange={(e) => {
                                const newItems = [...ocrForm.items];
                                newItems[idx].note = e.target.value;
                                setOcrForm({ ...ocrForm, items: newItems });
                              }}
                              className="w-full px-0.5 py-0.5 border border-transparent hover:border-slate-200 rounded text-[10px] text-slate-400 truncate focus:outline-none focus:border-indigo-500"
                              title={item.note}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>


            </div>
          </div>
        ) : (
          /* 분석 대기 중 혹은 업로드 전: 원래의 슬림 드롭존 형태 그대로 렌더링 */
          <>
            {/* 모달 제목 */}
            <h3 className="text-lg font-black text-slate-800 flex items-center justify-center gap-2 mb-4 shrink-0">
              <Upload className="w-5 h-5 text-indigo-500" />
              <span>AI 분석 입고</span>
            </h3>

            {/* 메인 스크롤 영역 */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 min-h-0 flex flex-col">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 relative min-h-[140px] overflow-hidden shrink-0">
                {ocrScanning && (
                  <div className="absolute inset-x-0 h-1 bg-indigo-500 animate-bounce z-20"></div>
                )}

                {ocrScanning ? (
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-xs text-indigo-600 font-extrabold animate-pulse">
                      Gemini Vision AI로 명세서(영수증/PDF) 이미지 고해상도 OCR 분석 중...
                    </span>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <FileTextIcon className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-xs text-slate-500">명세서 실물 사진/PDF 이미지 등록 시 AI가 입고 대장 자동 적재</div>
                    <label 
                      className="inline-block px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[11px] rounded-xl border border-indigo-100 cursor-pointer shadow-sm active:scale-95 transition-transform"
                    >
                      명세서 파일 선택 (이미지 / PDF)
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end space-x-2 shrink-0">
              <button
                onClick={handleClose}
                disabled={ocrScanning || isProcessing}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
              >
                취소
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

// 미니 컴포넌트용 헬퍼 아이콘
const FileTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
