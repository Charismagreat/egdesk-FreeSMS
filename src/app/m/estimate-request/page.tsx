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
  
  // 고객 개인 정보 입력
  const [partnerName, setPartnerName] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  
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
        setProducts(data.products || []);
        
        // 초기 수량은 모두 0으로 세팅
        const initialQtys: Record<string, number> = {};
        (data.products || []).forEach((p: Product) => {
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

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    const selectedItems = products
      .filter(p => (quantities[p.id] || 0) > 0)
      .map(p => ({
        product_id: p.id,
        product_name: p.name,
        quantity: quantities[p.id],
        unit_price: parseFloat(p.price) || 0 // 기본 DB 단가
      }));

    if (selectedItems.length === 0) {
      alert("최소 1개 이상의 품목의 수량을 선택해 주세요.");
      return;
    }
    if (!partnerName.trim()) {
      alert("성함 혹은 상호명을 적어주세요.");
      return;
    }
    if (!partnerPhone.trim()) {
      alert("연락처를 적어주세요.");
      return;
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
          items: selectedItems
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold text-sm">견적 상품 로딩 중...</p>
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
          사장님께 견적서 요청 건이 안전하게 접수되었습니다. <br />
          검토 후 AI가 디자인한 맞춤 초개인화 견적서와 안내문을 문자/알림톡으로 빠르게 전송해 드릴 예정입니다.
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
            <span>Fast AI Estimate</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">실시간 모바일 견적 요청</h1>
          <p className="text-slate-300 text-xs font-medium leading-relaxed">
            원하시는 품목과 필요하신 수량을 담아 제출해주시면, AI 최적 단가와 맞춤형 할인 혜택이 적용된 정교한 견적서를 즉시 보내드립니다.
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

        {/* 2. 고객 신청 정보 입력 */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">견적 수령처 정보</span>
          
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="성함 혹은 회사 상호명 기입"
                value={partnerName}
                onChange={e => setPartnerName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl outline-none text-sm font-semibold transition-all"
                required
              />
            </div>
            
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                type="tel"
                placeholder="견적서 수신처 (연락처 휴대폰 번호)"
                value={partnerPhone}
                onChange={e => setPartnerPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl outline-none text-sm font-semibold transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* 3. 최종 제출 버튼 */}
        <button
          type="submit"
          disabled={submitting}
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
