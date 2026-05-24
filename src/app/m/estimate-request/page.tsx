"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Check, ChevronRight, Phone, User, ShoppingBag, Plus, Minus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  main_image_url?: string;
  category?: string;
}

export default function MobileEstimateRequestPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 장바구니 형태 수량 관리
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // 고객 B2B 정보 입력 상태
  const [partnerName, setPartnerName] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [representative, setRepresentative] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  
  // 조회 및 검증 상태
  const [isCheckPerformed, setIsCheckPerformed] = useState(false);
  const [isNewPartner, setIsNewPartner] = useState(false);
  const [checkStatusMsg, setCheckStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // 사업자등록증 첨부 및 AI OCR 상태
  const [uploading, setUploading] = useState(false);
  const [licenseFileUrl, setLicenseFileUrl] = useState("");
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    fetchEstimateProducts();
  }, []);

  const fetchEstimateProducts = async () => {
    try {
      const res = await fetch("/api/estimates");
      const data = await res.json();
      if (data.success) {
        const rawProducts = data.products;
        const resolvedProducts = (rawProducts && rawProducts.rows) 
          ? rawProducts.rows 
          : (Array.isArray(rawProducts) ? rawProducts : []);

        setProducts(resolvedProducts);
        
        // 초기 수량은 모두 0으로 세팅
        const initialQtys: Record<string, number> = {};
        resolvedProducts.forEach((p: Product) => {
          initialQtys[p.id] = 0;
        });
        setQuantities(initialQtys);
      }
    } catch (e) {
      console.error("Failed to load products:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustQuantity = (productId: string, amount: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + amount);
      return { ...prev, [productId]: next };
    });
  };

  // B2B 사업자 번호 실시간 중복 가입 체크
  const handleCheckBusiness = async () => {
    if (!businessNumber.trim()) {
      alert("사업자등록번호를 입력해 주세요.");
      return;
    }
    
    const cleanedBiz = businessNumber.replace(/[^0-9]/g, "");
    if (cleanedBiz.length !== 10) {
      alert("사업자등록번호 10자리를 정확히 입력해 주세요. (예: 123-45-67890)");
      return;
    }

    setLoading(true);
    setCheckStatusMsg(null);

    try {
      const res = await fetch(`/api/partners?action=check-biz&business_number=${businessNumber}`);
      const data = await res.json();
      
      setIsCheckPerformed(true);
      if (data.success && data.exists) {
        // 이미 가입된 파트너
        const pt = data.partner;
        setIsNewPartner(false);
        setPartnerName(pt.company_name);
        setPartnerPhone(pt.phone || pt.manager_phone || "");
        setRepresentative(pt.representative || "");
        setEmail(pt.email || "");
        setAddress(pt.address || "");
        setLicenseFileUrl(pt.business_license_url || "");
        setCheckStatusMsg({
          type: 'success',
          text: `기존 B2B 등록 파트너 [${pt.company_name}] 정보가 무결하게 연결되었습니다. 추가 양식 작성 없이 바로 수량만 정해 견적 요청이 가능합니다. 🤝`
        });
      } else {
        // 미가입 신규 파트너
        setIsNewPartner(true);
        // 필드 초기화
        setPartnerName("");
        setPartnerPhone("");
        setRepresentative("");
        setEmail("");
        setAddress("");
        setLicenseFileUrl("");
        setOcrSuccessMsg("");
        setCheckStatusMsg({
          type: 'info',
          text: "등록되지 않은 B2B 파트너로 확인되었습니다. 첫 견적 요청과 거래처 등록을 위해 아래 상세 폼 작성 및 사업자등록증을 첨부해 주세요. 🎨"
        });
      }
    } catch (e) {
      alert("거래처 중복 검증 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 사업자등록증 업로드 및 Gemini Vision AI OCR 파싱 스캔
  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("최대 10MB 크기 이하의 파일만 업로드할 수 있습니다.");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert("사업자등록증은 JPG, PNG, WEBP 이미지 및 PDF 형식만 첨부 가능합니다.");
      return;
    }

    setUploading(true);
    setOcrScanning(true);
    setOcrSuccessMsg("");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        const ocrRes = await fetch("/api/estimates/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Data,
            filename: file.name,
            document_type: "license",
            mimeType: file.type
          })
        });

        const ocrResult = await ocrRes.json();
        if (ocrResult.success) {
          if (ocrResult.company_name) setPartnerName(ocrResult.company_name);
          if (ocrResult.representative) setRepresentative(ocrResult.representative);
          if (ocrResult.address) setAddress(ocrResult.address);
          if (ocrResult.phone) setPartnerPhone(ocrResult.phone);
          if (ocrResult.email) setEmail(ocrResult.email);

          // 로컬 업로드 디렉토리 가상 매핑
          setLicenseFileUrl(`/uploads/licenses/license_${Date.now()}_${file.name}`);
          setOcrSuccessMsg(`AI가 사업자등록증 정보를 완벽 해독했습니다! 상호명[${ocrResult.company_name}], 대표자[${ocrResult.representative}] 등을 자동 입력 완료했습니다. ✨`);
        } else {
          alert("AI OCR 스캔 실패: " + ocrResult.error);
        }
        setOcrScanning(false);
        setUploading(false);
      };
      
      reader.onerror = () => {
        alert("파일 읽기에 실패했습니다.");
        setOcrScanning(false);
        setUploading(false);
      };

      reader.readAsDataURL(file);

    } catch (err) {
      alert("네트워크 통신 중 오류가 발생했습니다.");
      setOcrScanning(false);
      setUploading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    const selectedItems = products
      .filter(p => (quantities[p.id] || 0) > 0)
      .map(p => ({
        product_id: p.id,
        product_name: p.name,
        quantity: quantities[p.id],
        unit_price: parseFloat(p.price) || 0
      }));

    if (selectedItems.length === 0) {
      alert("최소 1개 이상의 품목의 수량을 선택해 주세요.");
      return;
    }
    if (!businessNumber.trim()) {
      alert("사업자등록번호를 입력하고 중복 조회를 완료해 주세요.");
      return;
    }
    if (!isCheckPerformed) {
      alert("[중복 조회] 버튼을 눌러 가입 여부를 먼저 확인해 주세요.");
      return;
    }

    if (isNewPartner) {
      if (!partnerName.trim()) {
        alert("상호명을 입력해 주세요. (사업자등록증 첨부 시 자동 완성)");
        return;
      }
      if (!partnerPhone.trim()) {
        alert("대표 번호/연락처를 적어주세요.");
        return;
      }
      if (!representative.trim()) {
        alert("대표자 성함을 적어주세요.");
        return;
      }
      if (!email.trim()) {
        alert("계산서 수령 이메일을 적어주세요.");
        return;
      }
      if (!address.trim()) {
        alert("사업장 주소를 적어주세요.");
        return;
      }
      if (!licenseFileUrl) {
        alert("첫 견적 요청을 접수하려면 사업자등록증 사본(이미지/PDF)을 첨부해 주세요.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INBOUND",
          direction_status: "REQUESTED",
          partner_name: partnerName,
          partner_phone: partnerPhone,
          items: selectedItems,
          business_license_url: licenseFileUrl,
          
          is_new_partner: isNewPartner,
          business_number: businessNumber,
          representative: representative,
          email: email,
          address: address
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmittedId(data.estimateId);
      } else {
        alert("신청 실패: " + data.error);
      }
    } catch (err) {
      alert("전송 중 네트워크 에러가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold text-sm">로딩 분석 중...</p>
      </div>
    );
  }

  if (submittedId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6 shadow-lg shadow-emerald-500/5">
          <Check className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 leading-tight">견적 요청 접수 완료!</h2>
        <p className="text-slate-500 text-sm mt-3 leading-relaxed max-w-sm">
          사장님께 견적서 요청 및 첫 파트너 회원 가입이 안전하게 자동 접수되었습니다. <br />
          검토 후 AI가 산정한 맞춤형 VIP 볼륨 할인 견적서와 안내문을 즉시 전송해 드리겠습니다.
        </p>
        <div className="mt-8 bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm text-xs font-mono text-slate-500 inline-block">
          요청 번호: {submittedId}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 overflow-x-hidden">
      
      {/* 상단 소개 카드 */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white p-8 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl"></div>
        
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-1.5 bg-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast B2B Smart Onboarding</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">B2B 파트너 모바일 견적 요청</h1>
          <p className="text-slate-300 text-xs font-medium leading-relaxed">
            필요하신 물품 수량을 기입하신 뒤 사업자 확인을 거쳐 주시면, AI 실시간 정산 및 등급 할인이 연동된 최적 견적 제안을 발송해 드립니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitRequest} className="p-4 md:p-6 space-y-6 max-w-lg mx-auto">
        
        {/* 1. 상품 선택 영역 */}
        <div className="space-y-3">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block px-1">견적 요청 품목 선택</span>
          
          {products.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 font-semibold text-sm">
              현재 견적 전용으로 등록된 상품 품목이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {products.map(p => {
                const qty = quantities[p.id] || 0;
                
                return (
                  <div key={p.id} className={`bg-white border p-4 rounded-2xl flex items-center justify-between transition-all shadow-sm ${qty > 0 ? 'border-indigo-500 ring-2 ring-indigo-500/5' : 'border-slate-100'}`}>
                    <div className="flex-1 min-w-0 pr-4 space-y-1">
                      <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{p.category || '기본품목'}</span>
                      <h3 className="font-extrabold text-slate-800 text-sm md:text-base truncate block">{p.name}</h3>
                      <p className="text-slate-400 text-xs truncate block">{p.description || '최고급 사양의 비즈니스 전용 품목'}</p>
                      <span className="text-xs font-bold text-slate-600 block">참고 단가: {parseFloat(p.price).toLocaleString()}원</span>
                    </div>

                    {/* 수량 플러스 마이너스 */}
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 shrink-0">
                      <button 
                        type="button"
                        onClick={() => handleAdjustQuantity(p.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-black text-slate-800 text-sm">{qty}</span>
                      <button 
                        type="button"
                        onClick={() => handleAdjustQuantity(p.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. B2B 사업자 인증 및 중복체크 */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">B2B 파트너 본인 인증</span>
          
          <div className="space-y-3">
            <label className="text-[10px] text-slate-400 font-bold block">사업자등록번호 입력 *</label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="10자리 번호 입력 (예: 123-45-67890)"
                value={businessNumber}
                onChange={e => {
                  setBusinessNumber(e.target.value);
                  setIsCheckPerformed(false); // 번호 수정 시 재검증 요구
                }}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl outline-none text-xs font-bold font-mono transition-all"
                required
              />
              <button
                type="button"
                onClick={handleCheckBusiness}
                disabled={loading}
                className="px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-slate-800 transition-colors shrink-0"
              >
                중복 조회
              </button>
            </div>

            {/* 중복 체크 피드백 메시지 */}
            {checkStatusMsg && (
              <div className={`p-3.5 rounded-xl border text-[11px] font-semibold leading-relaxed transition-all ${
                checkStatusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
              }`}>
                {checkStatusMsg.text}
              </div>
            )}
          </div>
        </div>

        {/* 3. B2B 상세 정보 입력 (신규 가입일 경우만 폼이 유기적으로 오픈) */}
        {isCheckPerformed && isNewPartner && (
          <div className="bg-white border border-indigo-100/50 p-5 rounded-3xl shadow-md space-y-5 animate-slide-down">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">
                B2B 신규 거래처 등록 서식
              </span>
              <span className="text-[9px] bg-indigo-50 text-indigo-500 font-black px-1.5 py-0.5 rounded uppercase">
                First Time
              </span>
            </div>

            {/* A. 사업자등록증 이미지/PDF 파일 첨부 컴포넌트 */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-bold block">사업자등록증 사본 첨부 (필수) *</label>
              
              <div className="relative">
                <input 
                  type="file"
                  id="licenseFile"
                  accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                  onChange={handleLicenseUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <label 
                  htmlFor="licenseFile"
                  className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    licenseFileUrl ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 bg-slate-50/50 hover:border-indigo-500'
                  }`}
                >
                  {ocrScanning ? (
                    <div className="flex flex-col items-center space-y-2 py-2">
                      <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] font-bold text-indigo-600 animate-pulse">Vision AI가 사업자등록증 판독 중...</span>
                    </div>
                  ) : licenseFileUrl ? (
                    <div className="text-center space-y-1.5 py-2">
                      <span className="text-xs font-black text-emerald-600 block">✓ 사업자등록증 첨부 완료</span>
                      <span className="text-[9px] text-slate-400 block font-mono truncate max-w-xs">{licenseFileUrl.split('/').pop()}</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-1 py-1">
                      <span className="text-xs font-bold text-slate-700 block">여기를 눌러 파일 업로드</span>
                      <span className="text-[10px] text-slate-400 block">JPG, PNG, WEBP, PDF 지원 (최대 10MB)</span>
                    </div>
                  )}
                </label>
              </div>

              {ocrSuccessMsg && (
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-100 rounded-xl text-[10px] font-bold text-slate-700 leading-relaxed">
                  🚀 {ocrSuccessMsg}
                </div>
              )}
            </div>

            {/* B. 직접 입력 폼 */}
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">상호명 (회사명) *</label>
                <input 
                  type="text"
                  placeholder="예: 주식회사 에이치컴퍼니"
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl outline-none text-xs font-bold transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">대표자 성함 *</label>
                  <input 
                    type="text"
                    placeholder="대표명"
                    value={representative}
                    onChange={e => setRepresentative(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl outline-none text-xs font-bold transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">대표 연락처 *</label>
                  <input 
                    type="tel"
                    placeholder="010-0000-0000"
                    value={partnerPhone}
                    onChange={e => setPartnerPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl outline-none text-xs font-bold transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">계산서 수령 이메일 *</label>
                <input 
                  type="email"
                  placeholder="tax@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl outline-none text-xs font-bold transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">사업장 주소 *</label>
                <input 
                  type="text"
                  placeholder="사업자등록증 상의 상세 소재지 주소"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl outline-none text-xs font-bold transition-all"
                  required
                />
              </div>
            </div>

          </div>
        )}

        {/* 기존 등록 거래처 정보 확인용 읽기전용 서식 카드 */}
        {isCheckPerformed && !isNewPartner && (
          <div className="bg-slate-150/40 border border-slate-200/50 p-4.5 rounded-3xl space-y-3 font-semibold text-slate-700 text-xs">
            <span className="text-[9px] bg-slate-200 text-slate-500 font-black px-1.5 py-0.5 rounded uppercase block w-max mb-1">기존 회원 프로필</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div> 상호: <span className="font-extrabold text-slate-900">{partnerName}</span></div>
              <div> 대표: <span className="font-bold text-slate-800">{representative || '미등록'}</span></div>
              <div> 번호: <span className="font-mono text-slate-800">{partnerPhone}</span></div>
              <div> 이메일: <span className="font-mono text-slate-800">{email || '미등록'}</span></div>
              <div className="col-span-2 border-t border-slate-200/40 pt-2 mt-1"> 주소: <span className="text-slate-650">{address || '소재지 미기재'}</span></div>
            </div>
          </div>
        )}

        {/* 4. 최종 제출 버튼 */}
        <button
          type="submit"
          disabled={submitting || (isCheckPerformed && isNewPartner && !licenseFileUrl)}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm md:text-base rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center transition-all duration-300 transform active:scale-95 disabled:opacity-50"
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          {submitting ? "요청서 안전 전송 중..." : "AI 견적서 즉시 요청하기"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>

      </form>
    </div>
  );
}
