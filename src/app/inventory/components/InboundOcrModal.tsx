'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, RefreshCw, CheckCircle2, AlertCircle, Play } from 'lucide-react';

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
            matchedItemId: it.matchedItemId || 'NEW'
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

  // 모달이 열리고 initialFile이 들어오면 자동으로 OCR 분석 기동
  React.useEffect(() => {
    if (isOpen && initialFile) {
      processOcrFile(initialFile);
    }
  }, [isOpen, initialFile]);

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

  // 최종 입고 승인 실행 (confirm/route.ts 혹은 handleInventoryInbound 호출)
  const handleConfirmInbound = async () => {
    if (!ocrForm.partnerName) {
      alert('공급처 상호명은 필수 입력 항목입니다.');
      return;
    }
    if (ocrForm.items.length === 0) {
      alert('입고할 품목 정보가 없습니다.');
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
          partnerName: ocrForm.partnerName,
          inboundDate: ocrForm.inboundDate,
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

  return typeof window !== 'undefined' ? createPortal(
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2">
      <div className={`bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-300 transition-all ${modalWidthClass}`}>
        
        {/* 우상단 닫기 버튼 */}
        <button 
          onClick={handleClose} 
          disabled={ocrScanning || isProcessing}
          className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors disabled:opacity-55 cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 모달 제목 */}
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4 shrink-0">
          <Upload className="w-5 h-5 text-indigo-500" />
          <span>명세서 실물 분석 입고 (14대 전체 항목 매핑 검증)</span>
        </h3>

        {/* 메인 스크롤 영역 */}
        <div className="space-y-6 flex-1 overflow-y-auto pr-1 min-h-0 flex flex-col">
          {/* 이미지 가상 드롭존 */}
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
            ) : ocrSuccess ? (
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-scale-up" />
                <div>
                  <span className="text-xs font-bold text-slate-700 block">{ocrFilename} 분석 성공!</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{successMessage}</span>
                </div>
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

          {/* 파싱된 폼 검증/수정 영역 */}
          {ocrSuccess && (
            <div className="flex-1 min-h-0 flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider shrink-0">📋 AI 판독 데이터 검증 및 보정 (14개 전체 컬럼 매핑)</h4>
              
              <div className="grid grid-cols-2 gap-4 shrink-0">
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">공급처명(거래처)*</label>
                  <input
                    type="text"
                    value={ocrForm.partnerName}
                    onChange={(e) => setOcrForm({ ...ocrForm, partnerName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    placeholder="공급처(상호명) 입력"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">입고일자</label>
                  <input
                    type="date"
                    value={ocrForm.inboundDate}
                    onChange={(e) => setOcrForm({ ...ocrForm, inboundDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 14개 전체 컬럼을 가로 스크롤 없이 보여주는 컴팩트 테이블 */}
              <div className="flex-1 min-h-0 border border-slate-100 rounded-2xl overflow-y-auto bg-white shadow-sm">
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
                        {/* 12. 공급처명 (부모 값 바인딩) */}
                        <td className="py-2 px-1 text-slate-500 truncate" title={ocrForm.partnerName}>
                          {ocrForm.partnerName || '-'}
                        </td>
                        {/* 13. 입고일자 (부모 값 바인딩) */}
                        <td className="py-2 px-1 text-center text-slate-500 font-mono">
                          {ocrForm.inboundDate || '-'}
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
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end space-x-2 shrink-0">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
          >
            취소
          </button>
          {ocrSuccess && (
            <button
              onClick={handleConfirmInbound}
              disabled={isProcessing}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-150 flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>적재 반영 중...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>최종 입고 승인 및 적재</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;
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
