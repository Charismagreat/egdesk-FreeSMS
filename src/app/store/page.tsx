"use client";
import { useState, useEffect } from "react";
import { ShoppingBag, ChevronRight, X, Truck, Package, Store, MapPin, Mic, Bot, CheckCircle } from "lucide-react";
import Image from "next/image";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function StorefrontPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    quantity: 1,
    deliveryMethod: '배송',
    shippingAddress: '',
    customerMemo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  // Voice Wizard State
  const [voiceStep, setVoiceStep] = useState<'IDLE' | 'LISTENING_PRODUCT' | 'CONFIRMING_PRODUCT' | 'LISTENING_DETAILS'>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'ko-KR';
        
        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onerror = (e: any) => { console.error(e); setIsListening(false); };
        
        setRecognition(rec);
      }
    }
  }, []);

  const startListening = (onResult: (text: string) => void) => {
    if (!recognition) return alert("이 브라우저에서는 음성 인식을 지원하지 않습니다.");
    recognition.onresult = (e: any) => {
      let current = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        current += e.results[i][0].transcript;
      }
      setTranscript(current);
      if (e.results[e.results.length - 1].isFinal) {
        onResult(current);
      }
    };
    recognition.start();
  };

  const stopListening = () => {
    if (recognition) recognition.stop();
  };

  const handleVoiceOrderStart = () => {
    setVoiceStep('LISTENING_PRODUCT');
    setTranscript('');
    startListening((text) => {
      // Find matching product
      let matched = null;
      for (const p of products) {
        if (text.includes(p.name) || p.name.includes(text.replace(/\s/g, ''))) {
          matched = p;
          break;
        }
      }
      if (!matched && products.length > 0) matched = products[0]; // fallback to first
      
      if (matched) {
        setSelectedProduct(matched);
        setVoiceStep('CONFIRMING_PRODUCT');
      } else {
        alert("일치하는 상품을 찾지 못했습니다.");
        setVoiceStep('IDLE');
      }
    });
  };

  const handleConfirmProduct = (confirmed: boolean) => {
    if (confirmed) {
      setVoiceStep('LISTENING_DETAILS');
      setTranscript('');
      const allowed = selectedProduct.available_methods ? selectedProduct.available_methods.split(',') : ['매장에서', '가져가기', '배달', '배송'];
      setForm({...form, deliveryMethod: allowed[0]});
      
      startListening((text) => {
        // Parse details
        const parsedForm = { ...form };
        
        // Extract phone
        const phoneMatch = text.match(/(010|02|031|032|033|041|042|043|044|051|052|053|054|055|061|062|063|064)[\s-]*\d{3,4}[\s-]*\d{4}/);
        if (phoneMatch) parsedForm.customerPhone = phoneMatch[0].replace(/\s/g, '');
        
        // Extract delivery method
        if (text.includes("배달") && allowed.includes("배달")) parsedForm.deliveryMethod = "배달";
        else if ((text.includes("택배") || text.includes("배송")) && allowed.includes("배송")) parsedForm.deliveryMethod = "배송";
        else if ((text.includes("포장") || text.includes("가져가") || text.includes("픽업")) && allowed.includes("가져가기")) parsedForm.deliveryMethod = "가져가기";
        else if (text.includes("매장") && allowed.includes("매장에서")) parsedForm.deliveryMethod = "매장에서";
        
        // Extract quantity
        const quantityMatch = text.match(/([0-9]+)\s*(개|박스|병)/) || text.match(/(한|두|세|네|다섯)\s*(개|박스|병)/);
        if (quantityMatch) {
          const qMap: any = { '한':1, '두':2, '세':3, '네':4, '다섯':5 };
          parsedForm.quantity = parseInt(quantityMatch[1]) || qMap[quantityMatch[1]] || 1;
        }
        
        // Simple name/address logic
        if (!parsedForm.customerName) {
           const words = text.split(/\s+/);
           parsedForm.customerName = words[0].replace('입니다', '').replace('이구요', '');
        }
        if (['배달', '배송'].includes(parsedForm.deliveryMethod)) {
           // Rest of text as address roughly
           parsedForm.shippingAddress = text.replace(phoneMatch?.[0] || '', '').replace(parsedForm.customerName, '').substring(0, 50).trim();
        }
        
        // Save raw transcript
        parsedForm.customerMemo = `[음성 주문 원본]: ${text}`;
        
        setForm(parsedForm);
        setVoiceStep('IDLE'); // End wizard, show form
      });
    } else {
      setVoiceStep('IDLE');
      setSelectedProduct(null);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (json.success) {
        const storeProducts = json.products.filter((p: any) => p.category === '스토어용' || !p.category || p.category === '일반상품');
        setProducts(storeProducts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product: any) => {
    setSelectedProduct(product);
    setForm({
      customerName: '',
      customerPhone: '',
      quantity: 1,
      deliveryMethod: product.available_methods ? product.available_methods.split(',')[0] : '배송',
      shippingAddress: '',
      customerMemo: ''
    });
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
    setOrderSuccess(false);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const getNumericPrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const num = Number(priceStr.replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone) {
      alert("이름과 연락처를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    const unitPrice = getNumericPrice(selectedProduct.price);
    const isTbd = selectedProduct.price === '상담후결정';
    const originalPrice = unitPrice * form.quantity;
    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    const totalPrice = isTbd ? '상담후결정' : finalPrice.toString();
    const status = isTbd ? '견적요청' : '결제대기';
    
    // Add coupon info to memo
    let memo = form.customerMemo || '';
    if (appliedCoupon && !isTbd) {
      memo += `\n[쿠폰사용: ${appliedCoupon.code} (-${discountAmount.toLocaleString()}원 할인)]`;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          productName: selectedProduct.name,
          quantity: form.quantity.toString(),
          totalPrice,
          deliveryMethod: form.deliveryMethod,
          shippingAddress: form.shippingAddress,
          customerMemo: memo.trim(),
          status,
        })
      });
      const json = await res.json();
      if (json.success) {
        setOrderSuccess(true);
      } else {
        alert("주문 접수 중 오류가 발생했습니다.");
      }
    } catch (e) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    const unitPrice = getNumericPrice(selectedProduct?.price || '');
    if (unitPrice === 0) {
      setCouponError('가격이 정해지지 않은 상품에는 쿠폰을 쓸 수 없습니다.');
      return;
    }
    
    const orderAmount = unitPrice * form.quantity;
    const cartItems = [
      {
        product_id: selectedProduct.id,
        category: selectedProduct.category || '',
        menu_category: selectedProduct.menu_category || '',
        quantity: form.quantity,
        unit_price: unitPrice
      }
    ];
    
    try {
      const res = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderAmount, cart_items: cartItems })
      });
      const json = await res.json();
      
      if (json.success) {
        setAppliedCoupon(json.coupon);
      } else {
        setAppliedCoupon(null);
        setCouponError(json.error);
      }
    } catch(e) {
      setCouponError('쿠폰 조회 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white pb-12 pt-24 sm:pt-32 lg:pt-40">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-gradient-to-bl from-blue-500/30 to-purple-600/40 blur-3xl opacity-60 animate-pulse mix-blend-screen" style={{ animationDuration: '8s' }}></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-cyan-400/20 to-blue-600/30 blur-3xl opacity-50 mix-blend-screen"></div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center sm:text-left">
          <div className="max-w-3xl">
            <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-slate-300 tracking-tight mb-8 leading-[1.1]">
              가장 완벽한 상품을<br />가장 빠르게.
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-10 font-medium max-w-2xl leading-relaxed">
              최고의 품질을 자랑하는 다양한 상품들이 준비되어 있습니다.<br className="hidden sm:block" />지금 바로 확인하시고 간편하게 주문하세요.
            </p>
          </div>
        </div>
      </div>

      {/* Product List Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 flex items-center tracking-tight">
            <ShoppingBag className="w-8 h-8 mr-3 text-blue-600" />
            전체 상품
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl h-80 shadow-sm animate-pulse border border-slate-100"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl shadow-sm text-center border border-slate-100">
            <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">등록된 상품이 없습니다</h3>
            <p className="text-slate-500">현재 판매 중인 상품이 없습니다. 나중에 다시 방문해주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group flex flex-col h-full cursor-pointer" onClick={() => openModal(product)}>
                <div className="relative w-full h-56 bg-slate-100 overflow-hidden">
                  {(!product.available_methods?.includes('배달') && !product.available_methods?.includes('배송')) && (
                    <span className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm border border-red-400">
                      매장/포장 전용
                    </span>
                  )}
                  {product.main_image_url ? (
                    <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}

                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-grow whitespace-pre-line">{product.description || '상세 설명이 없습니다.'}</p>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-50">
                    <span className="text-2xl font-black text-slate-900">{product.price === '상담후결정' ? '상담 후 결정' : (getNumericPrice(product.price) > 0 ? `${getNumericPrice(product.price).toLocaleString()}원` : '가격 문의')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">상품 상세 및 주문하기</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body - 2 Columns on Desktop */}
            <div className="flex flex-col md:flex-row overflow-y-auto md:overflow-hidden flex-1">
              {/* Left Column: Product Info & Detail Image */}
              <div className="md:w-1/2 p-6 md:p-8 md:overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border border-slate-100">
                  {selectedProduct.detail_image_url ? (
                    <img src={selectedProduct.detail_image_url} alt={selectedProduct.name} className="w-full object-cover" />
                  ) : selectedProduct.main_image_url ? (
                    <img src={selectedProduct.main_image_url} alt={selectedProduct.name} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center text-slate-200 bg-slate-50"><ShoppingBag className="w-16 h-16" /></div>
                  )}
                </div>
                <h4 className="font-extrabold text-slate-800 text-2xl md:text-3xl mb-3">{selectedProduct.name}</h4>
                <p className="text-blue-600 font-black text-2xl mb-6">
                  {selectedProduct.price === '상담후결정' ? '상담 후 결정' : (getNumericPrice(selectedProduct.price) > 0 ? `${getNumericPrice(selectedProduct.price).toLocaleString()}원` : '가격 문의')}
                </p>
                <div className="text-slate-600 leading-relaxed whitespace-pre-line bg-white p-6 rounded-2xl border border-slate-100">
                  {selectedProduct.description || '상세 설명이 등록되지 않았습니다.'}
                </div>
              </div>

              {/* Right Column: Order Form */}
              <div className="md:w-1/2 p-6 md:p-8 md:overflow-y-auto">
                {orderSuccess ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">주문이 완료되었습니다!</h3>
                    <p className="text-slate-500 mb-6">주문 내역과 결제 안내 문자가 곧 발송됩니다.</p>
                    
                    <div className="bg-slate-50 rounded-2xl p-5 text-left w-full mb-6 border border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 mb-2">무통장 입금 안내 (송금 결제)</h4>
                      <p className="text-xs text-slate-500 mb-3">현재 결제는 계좌 송금 방식으로만 진행됩니다. 아래 계좌로 입금해 주세요.</p>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="font-mono text-sm font-bold text-slate-800">
                          국민은행 123456-12-123456
                          <span className="block text-xs text-slate-500 mt-1">예금주: 주식회사 이지데스크</span>
                        </div>
                      </div>
                    </div>

                    <button onClick={closeModal} className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-800 transition-colors w-full">
                      확인
                    </button>
                  </div>
                ) : (

                  <form onSubmit={submitOrder} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">주문자 이름 *</label>
                      <input 
                        type="text" 
                        required 
                        value={form.customerName}
                        onChange={(e) => setForm({...form, customerName: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="홍길동"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">연락처 *</label>
                      <input 
                        type="tel" 
                        required 
                        value={form.customerPhone}
                        onChange={(e) => setForm({...form, customerPhone: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="010-1234-5678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">수량</label>
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden w-32">
                        <button type="button" onClick={() => setForm({...form, quantity: Math.max(1, form.quantity - 1)})} className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold">-</button>
                        <input 
                          type="number" 
                          min="1" 
                          value={form.quantity}
                          onChange={(e) => setForm({...form, quantity: parseInt(e.target.value) || 1})}
                          className="w-full text-center py-3 outline-none appearance-none"
                        />
                        <button type="button" onClick={() => setForm({...form, quantity: form.quantity + 1})} className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold">+</button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <label className="block text-sm font-bold text-slate-700 mb-3">수령 방식</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {(() => {
                          let allowed = ['매장에서', '가져가기', '배달', '배송'];
                          if (selectedProduct.available_methods) {
                            if (Array.isArray(selectedProduct.available_methods)) {
                              allowed = selectedProduct.available_methods;
                            } else if (typeof selectedProduct.available_methods === 'string') {
                              allowed = selectedProduct.available_methods.split(',');
                            }
                          }
                          const renderMethod = (methodName: string, Icon: any) => {
                            const isAllowed = allowed.includes(methodName);
                            const isSelected = form.deliveryMethod === methodName;
                            return (
                              <label key={methodName} className={`flex flex-col items-center justify-center p-3 sm:p-4 border rounded-xl transition-all ${!isAllowed ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100' : isSelected ? 'border-blue-500 bg-blue-50 text-blue-700 cursor-pointer shadow-sm' : 'border-slate-200 hover:border-blue-300 cursor-pointer'}`}>
                                <input type="radio" name="deliveryMethod" value={methodName} disabled={!isAllowed} checked={isSelected} onChange={(e) => setForm({...form, deliveryMethod: e.target.value})} className="sr-only" />
                                <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
                                <span className="font-bold text-sm">{methodName}</span>
                              </label>
                            );
                          };
                          return (
                            <>
                              {renderMethod('매장에서', Store)}
                              {renderMethod('가져가기', Package)}
                              {renderMethod('배달', MapPin)}
                              {renderMethod('배송', Truck)}
                            </>
                          );
                        })()}
                      </div>
                      {/* Radio buttons replaced */}

                      {['배달', '배송'].includes(form.deliveryMethod) && (
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center"><MapPin className="w-4 h-4 mr-1 text-slate-400"/> 배송지 주소 *</label>
                          <input 
                            type="text" 
                            required 
                            value={form.shippingAddress}
                            onChange={(e) => setForm({...form, shippingAddress: e.target.value})}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="주소를 상세히 입력해주세요"
                          />
                        </div>
                      )}
                    </div>

                    {/* Coupon Section */}
                    {selectedProduct.price !== '상담후결정' && (
                      <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-bold text-slate-700 mb-2">할인 쿠폰</label>
                        {!appliedCoupon ? (
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={couponCode}
                              onChange={e => setCouponCode(e.target.value)}
                              placeholder="쿠폰 코드를 입력하세요" 
                              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                            />
                            <button type="button" onClick={handleApplyCoupon} className="px-6 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 whitespace-nowrap">
                              적용
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-xl">
                            <div>
                              <span className="font-bold text-green-700 block">{appliedCoupon.name}</span>
                              <span className="text-xs text-green-600 font-mono mt-1">{appliedCoupon.code}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-green-700">-{appliedCoupon.discountAmount.toLocaleString()}원</span>
                              <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-green-600 hover:bg-green-100 p-2 rounded-lg">
                                <X className="w-4 h-4"/>
                              </button>
                            </div>
                          </div>
                        )}
                        {couponError && <p className="text-red-500 text-xs mt-2 font-bold">{couponError}</p>}
                      </div>
                    )}

                    <div className="pt-6 mt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">총 결제금액</span>
                      <div className="text-right">
                        {appliedCoupon && selectedProduct.price !== '상담후결정' && (
                          <div className="text-slate-400 line-through text-sm mb-1">
                            {(getNumericPrice(selectedProduct.price) * form.quantity).toLocaleString()}원
                          </div>
                        )}
                        <span className="text-2xl sm:text-3xl font-black text-slate-900">
                          {selectedProduct.price === '상담후결정' 
                            ? '안내원 상담 후 결정' 
                            : (getNumericPrice(selectedProduct.price) > 0 
                                ? `${Math.max(0, (getNumericPrice(selectedProduct.price) * form.quantity) - (appliedCoupon ? appliedCoupon.discountAmount : 0)).toLocaleString()}원` 
                                : '안내원 상담 후 결정')}
                        </span>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className={`w-full py-4 font-bold text-lg text-white transition-all duration-300 flex justify-center items-center rounded-xl shadow-lg border border-transparent ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/50 active:scale-[0.98]'}`}
                    >
                      {isSubmitting ? '처리 중...' : (selectedProduct.price === '상담후결정' ? '상담/견적 요청하기' : '주문 접수하기')}
                    </button>
                  </form>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Voice Wizard Modal */}
      {voiceStep !== 'IDLE' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => { setVoiceStep('IDLE'); stopListening(); }}></div>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative z-10 overflow-hidden flex flex-col items-center text-center p-8">
            <button onClick={() => { setVoiceStep('IDLE'); stopListening(); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
            
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${isListening ? 'bg-blue-100 shadow-[0_0_40px_rgba(59,130,246,0.5)] animate-pulse' : 'bg-slate-100'}`}>
              <Mic className={`w-12 h-12 ${isListening ? 'text-blue-500' : 'text-slate-400'}`} />
            </div>

            {voiceStep === 'LISTENING_PRODUCT' && (
              <>
                <h3 className="text-xl font-bold text-slate-800 mb-2">어떤 상품을 찾으시나요?</h3>
                <p className="text-slate-500 mb-6">예: "프리미엄 세트 찾아줘"</p>
                <div className="min-h-[3rem] w-full bg-slate-50 rounded-xl p-3 flex items-center justify-center text-slate-700 italic">
                  {transcript || "듣고 있습니다..."}
                </div>
              </>
            )}

            {voiceStep === 'CONFIRMING_PRODUCT' && selectedProduct && (
              <>
                <h3 className="text-xl font-bold text-slate-800 mb-4">이 상품이 맞으신가요?</h3>
                <div className="w-full bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white rounded-lg shadow-sm mb-3 overflow-hidden">
                     {selectedProduct.main_image_url ? (
                       <img src={selectedProduct.main_image_url} className="w-full h-full object-cover" />
                     ) : <ShoppingBag className="w-full h-full p-4 text-slate-300"/>}
                  </div>
                  <h4 className="font-bold text-slate-800">{selectedProduct.name}</h4>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => handleConfirmProduct(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">아니오</button>
                  <button onClick={() => handleConfirmProduct(true)} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700">네, 맞아요</button>
                </div>
              </>
            )}

            {voiceStep === 'LISTENING_DETAILS' && (
              <>
                <h3 className="text-xl font-bold text-slate-800 mb-2">상세 정보를 말씀해 주세요</h3>
                <p className="text-slate-500 text-sm mb-6">이름, 연락처, 주소, 수령 방식을 이어서 말씀해 주세요.</p>
                <div className="min-h-[4rem] w-full bg-slate-50 rounded-xl p-3 flex items-center justify-center text-slate-700 italic text-sm">
                  {transcript || "듣고 있습니다..."}
                </div>
                {!isListening && transcript && (
                  <button onClick={() => stopListening()} className="mt-4 px-6 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-bold animate-pulse">입력 완료 (자동 처리중)</button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Voice Button */}
      {voiceStep === 'IDLE' && !selectedProduct && (
        <button 
          onClick={handleVoiceOrderStart}
          className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_10px_40px_rgba(37,99,235,0.4)] hover:bg-blue-700 hover:scale-105 hover:shadow-[0_10px_50px_rgba(37,99,235,0.6)] transition-all duration-300 flex items-center justify-center z-50 group"
        >
          <Bot className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <div className="absolute right-20 bg-white text-slate-800 text-sm font-bold px-4 py-2 rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-100">
            💬 말로 주문하기
          </div>
        </button>
      )}
    </div>
  );
}
