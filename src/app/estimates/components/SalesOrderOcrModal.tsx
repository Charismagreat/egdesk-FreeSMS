"use client";

import React, { useState } from "react";
import { Upload, X, FileText, CheckCircle2, RefreshCw } from "lucide-react";
import { createPortal } from "react-dom";

interface SalesOrderOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SalesOrderOcrModal({
  isOpen,
  onClose,
  onSuccess
}: SalesOrderOcrModalProps) {
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrFilename, setOcrFilename] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [receiverMatched, setReceiverMatched] = useState<boolean>(true);
  const [myCompanyName, setMyCompanyName] = useState<string>("주식회사 쿠스");
  const [userRole, setUserRole] = useState<string>("SUB_OPERATOR");
  const [userName, setUserName] = useState<string>("");
  const [forceBypass, setForceBypass] = useState<boolean>(false);
  const [bypassReason, setBypassReason] = useState<string>("");
  const [ocrForm, setOcrForm] = useState({
    partner_name: "",
    partner_phone: "",
    partner_manager: "",
    items: [] as Array<{ item_code?: string; product_name: string; spec?: string; quantity: number; unit_price: number; delivery_date?: string }>,
    file_url: "",
    business_number: "",
    representative: "",
    address: "",
    document_number: "",
    document_date: "",
    delivery_date: "",
    document_memo: ""
  });

  React.useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUserRole(data.role || "SUB_OPERATOR");
          setUserName(data.username || "");
        }
      } catch (e) {
        console.error("세션 조회 실패:", e);
      }
    }
    if (isOpen) {
      fetchUserRole();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetOcrState = () => {
    setOcrScanning(false);
    setOcrSuccess(false);
    setOcrFilename("");
    setSuccessMessage("");
    setReceiverMatched(true);
    setMyCompanyName("주식회사 쿠스");
    setForceBypass(false);
    setBypassReason("");
    setOcrForm({
      partner_name: "",
      partner_phone: "",
      partner_manager: "",
      items: [],
      file_url: "",
      business_number: "",
      representative: "",
      address: "",
      document_number: "",
      document_date: "",
      delivery_date: "",
      document_memo: ""
    });
  };

  const handleClose = () => {
    resetOcrState();
    onClose();
  };

  // 실제 이미지/PDF 파일 업로드 후 AI OCR 가동 (분석 전용 action=analyze 호출)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrScanning(true);
    setOcrSuccess(false);
    setOcrFilename(file.name);

    const formData = new FormData();
    formData.append("file", file);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch("/api/estimates/ocr-sales-order?action=analyze", {
          method: "POST",
          body: formData,
        });
        
        const data = await res.json();
        
        if (data.success) {
          setOcrScanning(false);
          setOcrSuccess(true);
          setSuccessMessage(`바이어, 연락처 및 ${data.items?.length || 0}개 품목의 단가/수량 파싱 완료`);
          setOcrForm({
            partner_name: data.partner_name || "",
            partner_phone: data.partner_phone || "",
            partner_manager: data.partner_manager || "",
            items: data.items || [],
            file_url: base64Data,
            business_number: data.business_number || "",
            representative: data.representative || "",
            address: data.address || "",
            document_number: data.document_number || "",
            document_date: data.document_date || "",
            delivery_date: data.delivery_date || "",
            document_memo: data.document_memo || ""
          });
          setReceiverMatched(data.receiver_matched !== false);
          setMyCompanyName(data.my_company_name || "주식회사 쿠스");
        } else {
          setOcrScanning(false);
          alert("업로드 실패: " + (data.error || "알 수 없는 오류"));
          resetOcrState();
        }
      } catch (error) {
        console.error(error);
        setOcrScanning(false);
        alert("오류가 발생했습니다.");
        resetOcrState();
      }
    };
    reader.onerror = () => {
      setOcrScanning(false);
      alert("파일을 읽는 도중 오류가 발생했습니다.");
    };
    reader.readAsDataURL(file);
  };

  // OCR 완료된 바이어 발주서 접수 실행 (action=save 호출)
  const handleSaveOcrSalesOrder = async () => {
    if (!ocrForm.partner_name || ocrForm.items.length === 0) {
      alert("바이어명 및 품목 정보는 필수 항목입니다.");
      return;
    }
    try {
      const res = await fetch("/api/estimates/ocr-sales-order?action=save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ocrForm,
          force_bypass: forceBypass,
          bypass_reason: bypassReason
        })
      });
      const data = await res.json();
      if (data.success) {
        handleClose();
        onSuccess();
        alert("AI OCR 분석 발주서가 성공적으로 접수 대장에 적재되었습니다.");
      } else {
        alert(data.error || "저장 실패");
      }
    } catch (e) {
      alert("저장 중 오류 발생");
    }
  };

  return typeof window !== "undefined" ? createPortal(
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] border border-slate-100 max-w-xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        {/* 우상단 닫기 버튼 */}
        <button 
          onClick={handleClose} 
          disabled={ocrScanning}
          className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors disabled:opacity-55"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 모달 제목 */}
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-indigo-500" />
          <span>바이어 발주서 스캔 등록 (AI OCR)</span>
        </h3>

        {/* 메인 영역 */}
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
                  Gemini Vision AI로 발주서 이미지 고해상도 OCR 스캔 중...
                </span>
              </div>
            ) : ocrSuccess ? (
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-scale-up" />
                <div>
                  <span className="text-xs font-bold text-slate-700 block">{ocrFilename} 스캔 성공!</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{successMessage}</span>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-500">발주서 사진/PDF 이미지 등록 시 AI가 수주 자동 적재</div>
                <label 
                  className="inline-block px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[11px] rounded-xl border border-indigo-100 cursor-pointer shadow-sm"
                >
                  발주서 파일 선택 (이미지 / PDF)
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

          {/* 스캔 결과 프리뷰 폼 */}
          {ocrSuccess && (
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 space-y-4 animate-scale-up">
              {!receiverMatched && (
                <div className="space-y-3">
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-xs font-bold leading-normal flex items-start gap-2 text-left">
                    <span className="text-base shrink-0 mt-0.5">⚠️</span>
                    <div>
                      <span className="font-extrabold block text-rose-900 mb-1">수신인 불일치 (접수 거절)</span>
                      스캔 결과 해당 문서의 수신인이 본사({myCompanyName})와 일치하지 않습니다. 잘못된 외부 문서는 법정/재무적 리스크 방지를 위해 등록이 원천 차단됩니다.
                    </div>
                  </div>
                  
                  {(userRole === 'SUPER_ADMIN' || userRole === 'PRESIDENT') && (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl space-y-3 text-xs font-semibold text-left">
                      <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">🛡️ 최고관리자 강제 승인 제어</span>
                      <label className="flex items-center gap-2 cursor-pointer text-amber-900 font-bold select-none">
                        <input 
                          type="checkbox" 
                          checked={forceBypass}
                          onChange={(e) => {
                            setForceBypass(e.target.checked);
                            if (!e.target.checked) setBypassReason("");
                          }}
                          className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        불일치 경고를 무시하고 강제로 수주 등록 승인
                      </label>
                      
                      {forceBypass && (
                        <div className="space-y-1.5 animate-scale-up">
                          <label className="block text-[10px] text-amber-700 font-bold">강제 승인 사유 입력 (5자 이상 필수) *</label>
                          <textarea
                            value={bypassReason}
                            onChange={(e) => setBypassReason(e.target.value)}
                            placeholder="예: 계열사 위탁 수주 대리 납품 건으로 임원 확인 완료"
                            className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-semibold outline-none focus:border-amber-500 text-slate-800"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">AI 스캔 분석 결과 자동입력 대기</span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">바이어명 *</label>
                  <input 
                    type="text" 
                    value={ocrForm.partner_name}
                    onChange={e => setOcrForm(prev => ({ ...prev, partner_name: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">연락처</label>
                  <input 
                    type="text" 
                    value={ocrForm.partner_phone}
                    onChange={e => setOcrForm(prev => ({ ...prev, partner_phone: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">사업자번호</label>
                  <input 
                    type="text" 
                    value={ocrForm.business_number}
                    onChange={e => setOcrForm(prev => ({ ...prev, business_number: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">대표자명</label>
                  <input 
                    type="text" 
                    value={ocrForm.representative}
                    onChange={e => setOcrForm(prev => ({ ...prev, representative: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">담당자명</label>
                  <input 
                    type="text" 
                    value={ocrForm.partner_manager}
                    onChange={e => setOcrForm(prev => ({ ...prev, partner_manager: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">문서 발주번호</label>
                  <input 
                    type="text" 
                    value={ocrForm.document_number}
                    onChange={e => setOcrForm(prev => ({ ...prev, document_number: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">문서 발주일자</label>
                  <input 
                    type="text" 
                    value={ocrForm.document_date}
                    onChange={e => setOcrForm(prev => ({ ...prev, document_date: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">납기일</label>
                  <input 
                    type="text" 
                    value={ocrForm.delivery_date}
                    onChange={e => setOcrForm(prev => ({ ...prev, delivery_date: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">소재지 주소</label>
                <input 
                  type="text" 
                  value={ocrForm.address}
                  onChange={e => setOcrForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">기타 비고</label>
                <textarea 
                  value={ocrForm.document_memo}
                  onChange={e => setOcrForm(prev => ({ ...prev, document_memo: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold resize-none outline-none focus:border-indigo-500"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold block">상세 품목 리스트</label>
                {ocrForm.items.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-1 text-xs font-semibold">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 truncate pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-800">{item.product_name}</span>
                          {item.item_code && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded">
                              {item.item_code}
                            </span>
                          )}
                        </div>
                        {item.spec && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            규격: {item.spec}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-0.5">단가: {item.unit_price.toLocaleString()}원</span>
                      </div>
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded shrink-0">{item.quantity}개</span>
                    </div>
                    {item.delivery_date && (
                      <div className="text-[9px] text-indigo-500 font-black">
                        📅 납기일: {item.delivery_date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 하단 컨트롤 영역 */}
        <div className="mt-6 border-t border-slate-100 pt-4 flex gap-3 shrink-0">
          <button 
            onClick={handleClose} 
            disabled={ocrScanning}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs disabled:opacity-50"
          >
            취소
          </button>
          <button 
            onClick={handleSaveOcrSalesOrder}
            disabled={!ocrSuccess || (!receiverMatched && !forceBypass) || (forceBypass && bypassReason.trim().length < 5)}
            className={`flex-1 py-3 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-colors ${
              forceBypass 
                ? "bg-amber-600 hover:bg-amber-700" 
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {forceBypass ? "⚠️ 관리자 강제 승인 및 등록" : "바이어 발주서 등록 승인"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
}
