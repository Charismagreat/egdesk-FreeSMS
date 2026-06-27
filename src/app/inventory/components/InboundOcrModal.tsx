'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, RefreshCw, CheckCircle2, AlertCircle, Play } from 'lucide-react';

interface InboundOcrItem {
  itemName: string;
  spec: string;
  barcode: string;
  quantity: number;
  price: number;
  matchedItemId: number | string;
  note: string;
}

interface InboundOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InboundOcrModal: React.FC<InboundOcrModalProps> = ({
  isOpen,
  onClose,
  onSuccess
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

  // 파일 선택 및 이미지 분석 트리거 (Gemini Vision OCR API 호출)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

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
          setOcrForm({
            partnerName: data.partnerName || '',
            inboundDate: data.inboundDate || new Date().toISOString().slice(0, 10),
            items: data.items || [],
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

      // 받은 발주서 저장 로직에 준하여 품목 정보의 프로퍼티 키 형식을 맞춤
      const requestItems = ocrForm.items.map(it => ({
        itemName: it.itemName,
        spec: it.spec || '',
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
        barcode: it.barcode || '',
        matchedItemId: it.matchedItemId,
        location: '자율입고창고',
        itemType: '자재',
        category: '기타',
        unitType: '개',
        boxContains: 1,
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

  return typeof window !== 'undefined' ? createPortal(
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] border border-slate-100 max-w-4xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
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
          <span>명세서 실물 분석 입고 (AI Vision OCR)</span>
        </h3>

        {/* 메인 스크롤 영역 */}
        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
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
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider">📋 AI 판독 데이터 검증 및 보정</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 block mb-1">공급처명(거래처)*</label>
                  <input
                    type="text"
                    value={ocrForm.partnerName}
                    onChange={(e) => setOcrForm({ ...ocrForm, partnerName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    placeholder="공급처(상호명) 입력"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 block mb-1">입고일자</label>
                  <input
                    type="date"
                    value={ocrForm.inboundDate}
                    onChange={(e) => setOcrForm({ ...ocrForm, inboundDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 파싱된 품목들 테이블 */}
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-left text-[10px] table-fixed">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[9px]">
                      <th className="p-2.5 w-[5%] text-center">No.</th>
                      <th className="p-2.5 w-[30%]">품목명</th>
                      <th className="p-2.5 w-[15%]">규격</th>
                      <th className="p-2.5 w-[15%]">바코드</th>
                      <th className="p-2.5 w-[10%] text-right">수량</th>
                      <th className="p-2.5 w-[10%] text-right">단가</th>
                      <th className="p-2.5 w-[15%]">비고(미매핑 메타)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ocrForm.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => {
                              const newItems = [...ocrForm.items];
                              newItems[idx].itemName = e.target.value;
                              setOcrForm({ ...ocrForm, items: newItems });
                            }}
                            className="w-full px-1 py-0.5 border border-transparent hover:border-slate-200 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.spec}
                            onChange={(e) => {
                              const newItems = [...ocrForm.items];
                              newItems[idx].spec = e.target.value;
                              setOcrForm({ ...ocrForm, items: newItems });
                            }}
                            className="w-full px-1 py-0.5 border border-transparent hover:border-slate-200 rounded text-xs text-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.barcode}
                            onChange={(e) => {
                              const newItems = [...ocrForm.items];
                              newItems[idx].barcode = e.target.value;
                              setOcrForm({ ...ocrForm, items: newItems });
                            }}
                            className="w-full px-1 py-0.5 border border-transparent hover:border-slate-200 rounded text-xs text-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...ocrForm.items];
                              newItems[idx].quantity = Number(e.target.value) || 0;
                              setOcrForm({ ...ocrForm, items: newItems });
                            }}
                            className="w-full px-1 py-0.5 border border-transparent hover:border-slate-200 rounded text-xs font-bold text-indigo-600 text-right focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => {
                              const newItems = [...ocrForm.items];
                              newItems[idx].price = Number(e.target.value) || 0;
                              setOcrForm({ ...ocrForm, items: newItems });
                            }}
                            className="w-full px-1 py-0.5 border border-transparent hover:border-slate-200 rounded text-xs text-slate-700 text-right focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.note}
                            onChange={(e) => {
                              const newItems = [...ocrForm.items];
                              newItems[idx].note = e.target.value;
                              setOcrForm({ ...ocrForm, items: newItems });
                            }}
                            className="w-full px-1 py-0.5 border border-transparent hover:border-slate-200 rounded text-xs text-slate-400 truncate focus:outline-none focus:border-indigo-500"
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
