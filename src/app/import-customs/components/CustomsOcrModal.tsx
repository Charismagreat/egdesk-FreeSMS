"use client";

import React, { useState } from "react";
import { Upload, X, FileText, CheckCircle2, RefreshCw, AlertCircle, Trash2, Plus, Eye } from "lucide-react";

interface CustomsOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomsOcrModal({
  isOpen,
  onClose,
  onSuccess
}: CustomsOcrModalProps) {
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrFilename, setOcrFilename] = useState("");
  const [originalFileUrl, setOriginalFileUrl] = useState("");

  // 수입 통관 구조화 폼 데이터
  const [ocrForm, setOcrForm] = useState({
    master: {
      so_number: "",
      po_number: "",
      invoice_number: "",
      order_date: "",
      ship_date: "",
      invoice_date: "",
      air_waybill_nbr: "",
      ship_via: "",
      terms_of_sale: "EXW",
      payment_terms: "NET60",
      exporter_name: ""
    },
    items: [] as Array<{
      part_number: string;
      description: string;
      quantity: number;
      unit_price: number;
      amount: number;
      currency: string;
      hs_code: string;
      country_of_origin: string;
      lot_number: string;
      mfg_date: string;
    }>,
    finance: {
      total_invoice_value: 0,
      payment_due_date: "",
      is_paid: 0,
      paid_date: "",
      bank_name: "",
      account_number: "",
      swift_code: ""
    },
    originalTotalAmount: 0,
    originalTotalQuantity: 0
  });

  if (!isOpen) return null;

  const resetOcrState = () => {
    setOcrScanning(false);
    setOcrSuccess(false);
    setOcrFilename("");
    if (originalFileUrl) {
      URL.revokeObjectURL(originalFileUrl);
      setOriginalFileUrl("");
    }
    setOcrForm({
      master: {
        so_number: "",
        po_number: "",
        invoice_number: "",
        order_date: "",
        ship_date: "",
        invoice_date: "",
        air_waybill_nbr: "",
        ship_via: "",
        terms_of_sale: "EXW",
        payment_terms: "NET60",
        exporter_name: ""
      },
      items: [],
      finance: {
        total_invoice_value: 0,
        payment_due_date: "",
        is_paid: 0,
        paid_date: "",
        bank_name: "",
        account_number: "",
        swift_code: ""
      },
      originalTotalAmount: 0,
      originalTotalQuantity: 0
    });
  };

  const handleClose = () => {
    resetOcrState();
    onClose();
  };

  // 이미지/PDF 파일 업로드 후 OCR API 가동
  const handleOcrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 기존 객체 URL 메모리 해제
    if (originalFileUrl) {
      URL.revokeObjectURL(originalFileUrl);
    }

    const fileUrl = URL.createObjectURL(file);
    setOriginalFileUrl(fileUrl);

    setOcrScanning(true);
    setOcrSuccess(false);
    setOcrFilename(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch("/api/import-customs/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Data,
            filename: file.name,
            mimeType: file.type
          })
        });
        const data = await res.json();
        if (data.success) {
          setOcrScanning(false);
          setOcrSuccess(true);
          setOcrForm({
            master: data.master || {},
            items: data.items || [],
            finance: data.finance || {},
            originalTotalAmount: data.originalTotalAmount || 0,
            originalTotalQuantity: data.originalTotalQuantity || 0
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

  // 품목 수량/단가 변경 시 개별 금액 자동 계산 함수
  const handleItemChange = (index: number, key: string, value: any) => {
    const newItems = [...ocrForm.items];
    const parsedValue = (key === 'quantity' || key === 'unit_price' || key === 'amount') ? parseFloat(value) || 0 : value;
    
    newItems[index] = {
      ...newItems[index],
      [key]: parsedValue
    };

    // quantity 또는 unit_price가 바뀌면 amount 자동 계산
    if (key === 'quantity' || key === 'unit_price') {
      const qty = key === 'quantity' ? parsedValue : newItems[index].quantity;
      const price = key === 'unit_price' ? parsedValue : newItems[index].unit_price;
      newItems[index].amount = qty * price;
    }

    setOcrForm(prev => ({
      ...prev,
      items: newItems
    }));
  };

  // 품목 추가/삭제
  const handleAddItem = () => {
    setOcrForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          part_number: "",
          description: "",
          quantity: 1,
          unit_price: 0,
          amount: 0,
          currency: "USD",
          hs_code: "",
          country_of_origin: "US",
          lot_number: "",
          mfg_date: ""
        }
      ]
    }));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = ocrForm.items.filter((_, idx) => idx !== index);
    setOcrForm(prev => ({
      ...prev,
      items: newItems
    }));
  };

  // 실시간 계산된 합산 금액 및 수량
  const calculatedTotal = ocrForm.items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);
  const calculatedTotalQuantity = ocrForm.items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);

  const isAmountMatching = ocrForm.originalTotalAmount === calculatedTotal;
  const isQuantityMatching = ocrForm.originalTotalQuantity === calculatedTotalQuantity;

  // DB 데이터 저장 실행
  const handleSaveCustoms = async () => {
    if (!ocrForm.master.so_number || !ocrForm.master.po_number) {
      alert("주문번호(SO#)와 구매발주번호(PO#)는 필수 입력 사항입니다.");
      return;
    }

    if (ocrForm.items.length === 0) {
      alert("최소 한 개 이상의 품목을 등록해야 합니다.");
      return;
    }

    // 금액 및 수량 불일치 이중 가드 컨펌 작동
    const hasAmountMismatch = ocrForm.originalTotalAmount > 0 && calculatedTotal !== ocrForm.originalTotalAmount;
    const hasQuantityMismatch = ocrForm.originalTotalQuantity > 0 && calculatedTotalQuantity !== ocrForm.originalTotalQuantity;

    if (hasAmountMismatch || hasQuantityMismatch) {
      let warningMsg = '[실물 수치 불일치 경고]\n\n';
      if (hasAmountMismatch) {
        warningMsg += `- 인보이스 원본 총액(${ocrForm.originalTotalAmount.toLocaleString()} USD)과 품목 합계금액(${calculatedTotal.toLocaleString()} USD)이 일치하지 않습니다.\n`;
      }
      if (hasQuantityMismatch) {
        warningMsg += `- 인보이스 원본 수량(${ocrForm.originalTotalQuantity.toLocaleString()}개)과 품목 합계수량(${calculatedTotalQuantity.toLocaleString()}개)이 일치하지 않습니다.\n`;
      }
      warningMsg += '\n이대로 저장을 강제 진행하시겠습니까?';
      const confirmForce = window.confirm(warningMsg);
      if (!confirmForce) return;
    }

    try {
      // 인보이스 총액을 계산된 총액으로 채워주거나, 기존 값 보정
      const finalFinance = {
        ...ocrForm.finance,
        so_number: ocrForm.master.so_number,
        total_invoice_value: calculatedTotal
      };

      const res = await fetch("/api/import-customs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          master: ocrForm.master,
          items: ocrForm.items,
          finance: finalFinance
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("수입 통관 데이터가 성공적으로 ERP 대장에 적재되었습니다.");
        handleClose();
        onSuccess();
      } else {
        alert(data.error || "적재 실패");
      }
    } catch (err) {
      alert("데이터 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] border border-slate-100 max-w-4xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {(ocrForm.master.file_path || originalFileUrl) && (
          <button
            type="button"
            onClick={() => window.open(ocrForm.master.file_path || originalFileUrl, "_blank")}
            className="absolute top-5 right-16 px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-full shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
            title="스캔에 사용된 원본 파일(이미지/PDF) 보기"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>원본 파일 보기</span>
          </button>
        )}

        <button onClick={handleClose} className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-5">
          <Upload className="w-6 h-6 text-indigo-600" />
          <span>수입 통관 서류 스캔 적재 (AI OCR)</span>
        </h3>

        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
          {/* 가상 드롭존 */}
          <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center bg-slate-50 relative min-h-[140px] overflow-hidden">
            {ocrScanning && (
              <div className="absolute inset-x-0 h-1 bg-indigo-600 animate-bounce z-20"></div>
            )}

            {ocrScanning ? (
              <div className="flex flex-col items-center space-y-2 text-center">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs text-indigo-700 font-extrabold animate-pulse">Gemini Vision AI가 수입 통관 인보이스를 스캔 및 파싱하고 있습니다...</span>
              </div>
            ) : ocrSuccess ? (
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <div>
                  <span className="text-sm font-bold text-slate-700 block">{ocrFilename} 스캔 완료!</span>
                  <span className="text-xs text-slate-400 block mt-0.5">수출자, 주문 정보 및 {ocrForm.items.length}개 품목의 단가/수량/원산지 데이터 매핑 완료</span>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-500">통관서류 인보이스/패킹리스트 파일(PDF/이미지)을 업로드하면 관계형 데이터로 자동 파싱합니다.</div>
                <label className="inline-block px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-xs rounded-2xl border border-indigo-100 cursor-pointer shadow-sm transition-colors">
                  수입통관 서류 선택
                  <input type="file" accept="image/*,application/pdf" onChange={handleOcrFileChange} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* 파싱 결과 에디터 폼 */}
          {ocrSuccess && (
            <div className="space-y-6">
              {/* 실물 대조 가드 컨펌 뱃지 */}
              <div className="flex flex-wrap gap-3 items-center p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-xs font-bold text-slate-600">실물 수치 대조 현황:</span>
                
                {/* 금액 대조 */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                  isAmountMatching 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                }`}>
                  {isAmountMatching ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>총금액 대조: 실물 {ocrForm.originalTotalAmount.toLocaleString()} USD | 계산 {calculatedTotal.toLocaleString()} USD ({isAmountMatching ? "일치" : "불일치"})</span>
                </div>

                {/* 수량 대조 */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                  isQuantityMatching 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                }`}>
                  {isQuantityMatching ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>총수량 대조: 실물 {ocrForm.originalTotalQuantity}개 | 계산 {calculatedTotalQuantity}개 ({isQuantityMatching ? "일치" : "불일치"})</span>
                </div>
              </div>

              {/* 1. 마스터 정보 편집 */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-800 border-b pb-2">A. 선적/발주 마스터 정보</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">주문 번호 (SO#) *</label>
                    <input type="text" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.master.so_number} onChange={e => setOcrForm(p => ({ ...p, master: { ...p.master, so_number: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">구매 발주 번호 (PO#) *</label>
                    <input type="text" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.master.po_number} onChange={e => setOcrForm(p => ({ ...p, master: { ...p.master, po_number: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">인보이스 번호</label>
                    <input type="text" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.master.invoice_number} onChange={e => setOcrForm(p => ({ ...p, master: { ...p.master, invoice_number: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">발주일</label>
                    <input type="date" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.master.order_date} onChange={e => setOcrForm(p => ({ ...p, master: { ...p.master, order_date: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">인보이스 발행일 / 선적일</label>
                    <input type="date" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.master.invoice_date} onChange={e => setOcrForm(p => ({ ...p, master: { ...p.master, invoice_date: e.target.value, ship_date: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">화물 운송장 번호 (AWB)</label>
                    <input type="text" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.master.air_waybill_nbr} onChange={e => setOcrForm(p => ({ ...p, master: { ...p.master, air_waybill_nbr: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">선적 택배사</label>
                    <input type="text" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.master.ship_via} onChange={e => setOcrForm(p => ({ ...p, master: { ...p.master, ship_via: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">인도 조건 (Terms of Sale)</label>
                    <input type="text" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.master.terms_of_sale} onChange={e => setOcrForm(p => ({ ...p, master: { ...p.master, terms_of_sale: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">결제 조건 (Payment Terms)</label>
                    <input type="text" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.master.payment_terms} onChange={e => setOcrForm(p => ({ ...p, master: { ...p.master, payment_terms: e.target.value } }))} />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1">수출자 상호 (Exporter)</label>
                    <input type="text" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.master.exporter_name} onChange={e => setOcrForm(p => ({ ...p, master: { ...p.master, exporter_name: e.target.value } }))} />
                  </div>
                </div>
              </div>

              {/* 2. 회계 및 송금 정보 편집 */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-800 border-b pb-2">B. 정산 및 송금 정보</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">청구 총액 (USD)</label>
                    <input type="text" disabled className="w-full bg-slate-100 border rounded-xl px-3 py-2 text-xs font-bold text-slate-600" value={`${calculatedTotal.toLocaleString()} USD`} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">결제 마감 예정일</label>
                    <input type="date" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.finance.payment_due_date} onChange={e => setOcrForm(p => ({ ...p, finance: { ...p.finance, payment_due_date: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">송금 대상 은행</label>
                    <input type="text" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.finance.bank_name} onChange={e => setOcrForm(p => ({ ...p, finance: { ...p.finance, bank_name: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">송금 계좌 번호</label>
                    <input type="text" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.finance.account_number} onChange={e => setOcrForm(p => ({ ...p, finance: { ...p.finance, account_number: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">스위프트 코드 (SWIFT)</label>
                    <input type="text" className="w-full border rounded-xl px-3 py-2 text-xs font-semibold" value={ocrForm.finance.swift_code} onChange={e => setOcrForm(p => ({ ...p, finance: { ...p.finance, swift_code: e.target.value } }))} />
                  </div>
                </div>
              </div>

              {/* 3. 품목 디테일 목록 편집 */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-sm font-black text-slate-800">C. 수입 품목 상세 내역 ({ocrForm.items.length})</h4>
                  <button type="button" onClick={handleAddItem} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-black rounded-xl border border-indigo-100 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    <span>품목 추가</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-left font-bold">
                        <th className="py-2.5 px-2">규격 / 파트번호 *</th>
                        <th className="py-2.5 px-2">품명</th>
                        <th className="py-2.5 px-2 w-[80px]">수량 *</th>
                        <th className="py-2.5 px-2 w-[100px]">단가 *</th>
                        <th className="py-2.5 px-2 w-[100px]">금액 (자동)</th>
                        <th className="py-2.5 px-2 w-[90px]">HS코드</th>
                        <th className="py-2.5 px-2 w-[80px]">원산지</th>
                        <th className="py-2.5 px-2">로트번호</th>
                        <th className="py-2.5 px-2 w-[50px] text-center">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ocrForm.items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="py-2 px-1">
                            <input type="text" className="w-full border rounded-lg px-2 py-1.5 text-xs font-semibold" value={item.part_number} onChange={e => handleItemChange(index, 'part_number', e.target.value)} />
                          </td>
                          <td className="py-2 px-1">
                            <input type="text" className="w-full border rounded-lg px-2 py-1.5 text-xs font-semibold" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} />
                          </td>
                          <td className="py-2 px-1">
                            <input type="number" min="0" step="any" className="w-full border rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                          </td>
                          <td className="py-2 px-1">
                            <input type="number" min="0" step="any" className="w-full border rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', e.target.value)} />
                          </td>
                          <td className="py-2 px-1">
                            <input type="text" disabled className="w-full bg-slate-100 border rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500" value={(item.quantity * item.unit_price).toLocaleString()} />
                          </td>
                          <td className="py-2 px-1">
                            <input type="text" className="w-full border rounded-lg px-2 py-1.5 text-xs font-semibold" value={item.hs_code} onChange={e => handleItemChange(index, 'hs_code', e.target.value)} />
                          </td>
                          <td className="py-2 px-1">
                            <input type="text" className="w-full border rounded-lg px-2 py-1.5 text-xs font-semibold uppercase" value={item.country_of_origin} onChange={e => handleItemChange(index, 'country_of_origin', e.target.value)} />
                          </td>
                          <td className="py-2 px-1">
                            <input type="text" className="w-full border rounded-lg px-2 py-1.5 text-xs font-semibold" value={item.lot_number} onChange={e => handleItemChange(index, 'lot_number', e.target.value)} />
                          </td>
                          <td className="py-2 px-1 text-center">
                            <button type="button" onClick={() => handleRemoveItem(index)} className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 푸터 버튼 */}
        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
          <button type="button" onClick={handleClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors">
            취소
          </button>
          {ocrSuccess && (
            <button type="button" onClick={handleSaveCustoms} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md transition-colors flex items-center gap-1">
              <span>수입 정보 최종 적재</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
