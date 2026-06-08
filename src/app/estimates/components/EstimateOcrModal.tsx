"use client";

import React, { useState, useEffect } from "react";
import { Upload, X, FileText, CheckCircle2, RefreshCw, Plus, Trash2 } from "lucide-react";

interface EstimateOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    partnerId: string | null;
    data: {
      partnerName: string;
      partnerPhone: string;
      estimateDate: string;
      pdfFilePath: string;
      items: Array<{
        productName: string;
        spec: string;
        quantity: number;
        unitPrice: number;
        amount: number;
        matched_item_id: string | null;
        matched_item_name: string;
      }>;
    };
    trackedItemsList: Array<{ id: number; name: string }>;
    partnersList: Array<{ id: string; name: string }>;
  } | null;
}

export default function EstimateOcrModal({
  isOpen,
  onClose,
  onSuccess,
  initialData
}: EstimateOcrModalProps) {
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrFilename, setOcrFilename] = useState("");
  const [ocrForm, setOcrForm] = useState({
    partner_name: "",
    partner_phone: "",
    items: [] as Array<{ product_name: string; quantity: number; unit_price: number; spec?: string; matched_item_id?: string }>,
    file_url: ""
  });

  const [trackedItemsList, setTrackedItemsList] = useState<any[]>([]);
  const [partnersList, setPartnersList] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");

  useEffect(() => {
    if (initialData) {
      setOcrSuccess(true);
      const ocrData = initialData.data;
      setOcrFilename(ocrData.pdfFilePath ? ocrData.pdfFilePath.split('/').pop() || "scan_result.pdf" : "scan_result.pdf");
      
      setOcrForm({
        partner_name: ocrData.partnerName || "",
        partner_phone: ocrData.partnerPhone || "",
        items: (ocrData.items || []).map((item: any) => ({
          product_name: item.productName || item.product_name || "",
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unitPrice || item.unit_price) || 0,
          spec: item.spec || "",
          matched_item_id: item.matched_item_id ? String(item.matched_item_id) : ""
        })),
        file_url: ocrData.pdfFilePath || ""
      });

      setTrackedItemsList(initialData.trackedItemsList || []);
      setPartnersList(initialData.partnersList || []);
      setSelectedPartnerId(initialData.partnerId || "");
    }
  }, [initialData]);

  if (!isOpen) return null;

  const resetOcrState = () => {
    setOcrScanning(false);
    setOcrSuccess(false);
    setOcrFilename("");
    setOcrForm({
      partner_name: "",
      partner_phone: "",
      items: [],
      file_url: ""
    });
    setTrackedItemsList([]);
    setPartnersList([]);
    setSelectedPartnerId("");
  };

  const handleClose = () => {
    resetOcrState();
    onClose();
  };

  // 실제 이미지/PDF 파일 업로드 후 AI OCR 가동
  const handleOcrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrScanning(true);
    setOcrSuccess(false);
    setOcrFilename(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch("/api/estimates/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Data,
            filename: file.name,
            mimeType: file.type,
            document_type: "estimate"
          })
        });
        const data = await res.json();
        if (data.success) {
          setOcrScanning(false);
          setOcrSuccess(true);
          setOcrForm({
            partner_name: data.partner_name,
            partner_phone: data.partner_phone || "",
            items: (data.items || []).map((it: any) => ({
              product_name: it.product_name || it.productName || "",
              quantity: Number(it.quantity) || 1,
              unit_price: Number(it.unit_price || it.unitPrice) || 0,
              spec: it.spec || "",
              matched_item_id: ""
            })),
            file_url: base64Data
          });
        } else {
          setOcrScanning(false);
          alert(data.error || "OCR 파싱 실패");
        }
      } catch (err) {
        setOcrScanning(false);
        alert("OCR 파싱 실패");
      }
    };
    reader.onerror = () => {
      setOcrScanning(false);
      alert("파일을 읽는 도중 오류가 발생했습니다.");
    };
    reader.readAsDataURL(file);
  };

  const handlePartnerChange = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    const matched = partnersList.find(p => String(p.id) === String(partnerId));
    if (matched) {
      setOcrForm(prev => ({ ...prev, partner_name: matched.companyName || matched.name }));
    }
  };

  const handleItemFieldChange = (index: number, field: string, value: any) => {
    setOcrForm(prev => {
      const nextItems = [...prev.items];
      nextItems[index] = {
        ...nextItems[index],
        [field]: value
      };
      return { ...prev, items: nextItems };
    });
  };

  const handleRemoveItem = (index: number) => {
    setOcrForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleAddItem = () => {
    setOcrForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_name: "",
          quantity: 1,
          unit_price: 0,
          spec: "",
          matched_item_id: ""
        }
      ]
    }));
  };

  // OCR 완료된 받은 견적 접수 실행
  const handleSaveOcrEstimate = async () => {
    if (!ocrForm.partner_name || ocrForm.items.length === 0) return;
    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INBOUND",
          direction_status: "REQUESTED",
          partner_name: ocrForm.partner_name,
          partner_phone: ocrForm.partner_phone,
          items: ocrForm.items.map(item => ({
            product_id: item.matched_item_id || "",
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            spec: item.spec || ""
          })),
          ai_parsed: 1,
          file_url: ocrForm.file_url
        })
      });
      const data = await res.json();
      if (data.success) {
        handleClose();
        onSuccess();
        alert("AI OCR 분석 견적이 성공적으로 접수 대장에 적재되었습니다.");
      } else {
        alert(data.error || "접수 실패");
      }
    } catch (e) {
      alert("접수 중 오류 발생");
    }
  };

  const totalAmount = ocrForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const showSplitLayout = ocrForm.file_url && ocrForm.file_url.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-[32px] border border-slate-100 ${showSplitLayout ? "max-w-5xl" : "max-w-xl"} w-full p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] animate-scale-up`}>
        <button onClick={handleClose} className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4 shrink-0">
          <Upload className="w-5 h-5 text-indigo-500" />
          <span>{initialData ? "받은 견적서 상세 내역 검토 및 연동" : "받은 견적서 스캔 등록 (AI OCR)"}</span>
        </h3>

        {/* 메인 레이아웃 분기 */}
        <div className={`flex-1 overflow-y-auto pr-1 ${showSplitLayout ? "grid grid-cols-1 lg:grid-cols-12 gap-6" : "space-y-6"}`}>
          
          {/* 좌측 패널 (양식 및 품목 리스트) */}
          <div className={`${showSplitLayout ? "lg:col-span-7 flex flex-col space-y-4" : "space-y-6"}`}>
            {/* 이미지 가상 드롭존 (수동 등록 모드일 때만 노출) */}
            {!initialData && !ocrSuccess && (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 relative min-h-[140px] overflow-hidden">
                {ocrScanning && (
                  <div className="absolute inset-x-0 h-1 bg-indigo-500 animate-bounce z-20"></div>
                )}

                {ocrScanning ? (
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-xs text-indigo-600 font-extrabold animate-pulse">Gemini Vision AI로 견적 이미지 고해상도 OCR 스캔 중...</span>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-xs text-slate-500">견적서 사진/PDF 이미지 등록 시 AI가 데이터 자동 파싱</div>
                    <label 
                      className="inline-block px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[11px] rounded-xl border border-indigo-100 cursor-pointer shadow-sm"
                    >
                      견적서 파일 선택 (이미지 / PDF)
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={handleOcrFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* 스캔 결과 폼 */}
            {ocrSuccess && (
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 space-y-4 flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">AI 스캔 분석 결과 상세 편집</span>
                  {initialData && (
                    <span className="px-2 py-0.5 bg-sky-50 border border-sky-100 rounded-lg text-sky-600 font-extrabold text-[9px]">이지봇 연동모드</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  {partnersList.length > 0 ? (
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">공급처(거래처) 매칭</label>
                      <select
                        value={selectedPartnerId}
                        onChange={e => handlePartnerChange(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- 거래처 선택 --</option>
                        {partnersList.map(p => (
                          <option key={p.id} value={p.id}>{p.companyName || p.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">공급처명</label>
                      <input 
                        type="text" 
                        value={ocrForm.partner_name}
                        onChange={e => setOcrForm(prev => ({ ...prev, partner_name: e.target.value }))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">연락처</label>
                    <input 
                      type="text" 
                      value={ocrForm.partner_phone}
                      onChange={e => setOcrForm(prev => ({ ...prev, partner_phone: e.target.value }))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                {/* 총액 요약 */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 flex justify-between items-center text-xs shrink-0">
                  <span className="font-bold text-slate-500">최종 견적 합계액</span>
                  <span className="font-black text-indigo-600 text-sm">{totalAmount.toLocaleString()}원</span>
                </div>

                {/* 품목 리스트 */}
                <div className="space-y-2 flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex justify-between items-center shrink-0">
                    <label className="text-[10px] text-slate-400 font-bold block">견적 상세 품목 ({ocrForm.items.length}건)</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[9px] font-black rounded border border-indigo-100 flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" /> 행 추가
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[300px]">
                    {ocrForm.items.map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 space-y-2">
                        {/* 품목명 및 삭제 */}
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={item.product_name}
                            placeholder="품목명"
                            onChange={e => handleItemFieldChange(idx, "product_name", e.target.value)}
                            className="flex-1 p-1.5 bg-slate-50 rounded border border-slate-200 text-[11px] font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-50 rounded border border-slate-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        {/* 수량 / 단가 / 매핑 */}
                        <div className="grid grid-cols-12 gap-1.5 items-center">
                          <div className="col-span-3">
                            <label className="text-[8.5px] text-slate-400 font-bold block mb-0.5">수량</label>
                            <input 
                              type="number" 
                              value={item.quantity}
                              onChange={e => handleItemFieldChange(idx, "quantity", Number(e.target.value))}
                              className="w-full p-1.5 bg-slate-50 rounded border border-slate-200 text-[10px] font-bold text-center"
                            />
                          </div>
                          <div className="col-span-4">
                            <label className="text-[8.5px] text-slate-400 font-bold block mb-0.5">단가</label>
                            <input 
                              type="number" 
                              value={item.unit_price}
                              onChange={e => handleItemFieldChange(idx, "unit_price", Number(e.target.value))}
                              className="w-full p-1.5 bg-slate-50 rounded border border-slate-200 text-[10px] font-bold text-right"
                            />
                          </div>
                          <div className="col-span-5">
                            <label className="text-[8.5px] text-slate-400 font-bold block mb-0.5">매핑할 자사 품목</label>
                            <select
                              value={item.matched_item_id}
                              onChange={e => handleItemFieldChange(idx, "matched_item_id", e.target.value)}
                              className="w-full p-1.5 bg-slate-50 rounded border border-slate-200 text-[10px] font-bold"
                            >
                              <option value="">-- 자율 신규 등록 --</option>
                              {trackedItemsList.map(it => (
                                <option key={it.id} value={it.id}>{it.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 우측 패널 (PDF 미리보기 뷰어) */}
          {showSplitLayout && (
            <div className="lg:col-span-5 flex flex-col border border-slate-150 rounded-2xl bg-slate-50 overflow-hidden h-[450px] lg:h-full min-h-[400px]">
              <div className="bg-slate-100/60 px-4 py-2 text-[10px] font-bold text-slate-500 border-b border-slate-150 flex justify-between items-center shrink-0">
                <span>첨부 원본 견적서 파일</span>
                <a 
                  href={ocrForm.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-indigo-600 hover:underline font-black flex items-center gap-0.5"
                >
                  새창 열기 ↗
                </a>
              </div>
              <div className="flex-1 bg-white relative">
                {ocrForm.file_url.startsWith("data:application/pdf") || ocrForm.file_url.toLowerCase().endsWith(".pdf") ? (
                  <iframe 
                    src={`${ocrForm.file_url}#view=FitH`} 
                    className="w-full h-full border-none bg-transparent"
                    title="견적서 PDF 미리보기"
                  />
                ) : (
                  <img 
                    src={ocrForm.file_url} 
                    alt="견적서 이미지 원본" 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          )}

        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 flex gap-3 shrink-0">
          <button onClick={handleClose} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs">
            취소
          </button>
          <button 
            onClick={handleSaveOcrEstimate}
            disabled={!ocrSuccess}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl disabled:opacity-50"
          >
            받은 견적서 등록 승인
          </button>
        </div>
      </div>
    </div>
  );
}

