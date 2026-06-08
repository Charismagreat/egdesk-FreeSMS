"use client";

import React, { useState } from "react";
import { Upload, X, FileText, CheckCircle2, RefreshCw } from "lucide-react";

interface EstimateOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EstimateOcrModal({
  isOpen,
  onClose,
  onSuccess
}: EstimateOcrModalProps) {
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrFilename, setOcrFilename] = useState("");
  const [ocrForm, setOcrForm] = useState({
    partner_name: "",
    partner_phone: "",
    items: [] as Array<{ product_name: string; quantity: number; unit_price: number }>,
    file_url: ""
  });

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
            items: data.items,
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
          items: ocrForm.items,
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

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] border border-slate-100 max-w-xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        <button onClick={handleClose} className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-indigo-500" />
          <span>받은 견적서 스캔 등록 (AI OCR)</span>
        </h3>

        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
          {/* 이미지 가상 드롭존 */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 relative min-h-[140px] overflow-hidden">
            {ocrScanning && (
              <div className="absolute inset-x-0 h-1 bg-indigo-500 animate-bounce z-20"></div>
            )}

            {ocrScanning ? (
              <div className="flex flex-col items-center space-y-2 text-center">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-indigo-600 font-extrabold animate-pulse">Gemini Vision AI로 견적 이미지 고해상도 OCR 스캔 중...</span>
              </div>
            ) : ocrSuccess ? (
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <div>
                  <span className="text-xs font-bold text-slate-700 block">{ocrFilename} 스캔 성공!</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">공급사, 연락처 및 {ocrForm.items.length}개 품목의 단가/수량 파싱 완료</span>
                </div>
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

          {/* 스캔 결과 폼 */}
          {ocrSuccess && (
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 space-y-4 animate-scale-up">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">AI 스캔 분석 결과 자동입력 대기</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">공급처명</label>
                  <input 
                    type="text" 
                    value={ocrForm.partner_name}
                    onChange={e => setOcrForm(prev => ({ ...prev, partner_name: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
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

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold block">상세 품목 리스트</label>
                {ocrForm.items.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <div className="flex-1 truncate pr-2">
                      <span className="font-bold text-slate-800">{item.product_name}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">단가: {item.unit_price.toLocaleString()}원</span>
                    </div>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded shrink-0">{item.quantity}개</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 flex gap-3">
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
