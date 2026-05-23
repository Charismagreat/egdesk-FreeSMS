"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Check, ChevronLeft, Minus, Plus, X, Coins } from "lucide-react";

export default function TableOrderMenuPage() {
  const { tableId } = useParams();
  const router = useRouter();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  // 포인트 적립/사용 관련 추가 상태
  const [phoneForPoints, setPhoneForPoints] = useState('');
  const [pointBalance, setPointBalance] = useState<number | null>(null);
  const [pointCustomerId, setPointCustomerId] = useState<number | null>(null);
  const [usePointsInput, setUsePointsInput] = useState('');
  const [appliedPoints, setAppliedPoints] = useState<number>(0);
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [pointError, setPointError] = useState('');
  const [pointInfo, setPointInfo] = useState('');
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [showPointGuide, setShowPointGuide] = useState(false); // 포인트 안내 팝업 상태 추가
  const [pointEarningRate, setPointEarningRate] = useState<number>(1); // 포인트 적립 비율 상태 추가 (기본값 1%)


  useEffect(() => {
    fetchProducts();
    fetchPointEarningRate();
  }, []);

  const fetchPointEarningRate = async () => {
    try {
      const res = await fetch('/api/settings?key=point_earning_rate');
      const data = await res.json();
      if (data.success && data.value !== null) {
        const rateVal = Number(data.value);
        if (!isNaN(rateVal)) {
          setPointEarningRate(rateVal);
        }
      }
    } catch (e) {
      console.error('Failed to fetch point earning rate:', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (json.success) {
        const tableOrderProducts = json.products.filter((p: any) => 
          p.category === '테이블용'
        );
        setProducts(tableOrderProducts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getNumericPrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const num = Number(priceStr.replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const updateCart = (productId: string, delta: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      const newCart = { ...prev };
      if (next === 0) delete newCart[productId];
      else newCart[productId] = next;
      return newCart;
    });
  };

  const categories = ['전체', ...Array.from(new Set(products.map(p => p.menu_category).filter(Boolean)))];

  const filteredProducts = activeCategory === "전체" 
    ? products 
    : products.filter(p => p.menu_category === activeCategory);

  const cartItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotalAmount = Object.entries(cart).reduce((total, [id, qty]) => {
    const p = products.find(prod => prod.id === id);
    if (!p) return total;
    return total + (getNumericPrice(p.price) * qty);
  }, 0);

  // 실결제 최종 예정금액 및 예상 적립 포인트 실시간 계산 (동적 적립률 적용)
  const finalEarningBasis = Math.max(0, cartTotalAmount - (appliedCoupon ? appliedCoupon.discountAmount : 0) - appliedPoints);
  const expectedPoints = Math.floor(finalEarningBasis * (pointEarningRate / 100));

  // 포인트 조회 핸들러
  const handleLookupPoints = async () => {
    if (!phoneForPoints) return;
    setPointError('');
    setPointInfo('');
    setAppliedPoints(0);
    setIsOtpVerified(false);
    setIsOtpSent(false);

    try {
      const res = await fetch(`/api/points?phone=${encodeURIComponent(phoneForPoints)}`);
      const json = await res.json();
      if (json.success) {
        setPointBalance(json.balance);
        setPointCustomerId(json.customerId);
        setPointInfo(`조정/확인 완료: 현재 보유 포인트 ${json.balance.toLocaleString()}p`);
      } else {
        // 고객 정보가 없는 경우 즉시 Soft Sign-up 가상 생성 처리 연동
        const registerRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `단골_${phoneForPoints.slice(-4)}`,
            phone: phoneForPoints,
            tags: '테이블적립,임시'
          })
        });
        const registerJson = await registerRes.json();
        if (registerJson.success) {
          setPointBalance(0);
          setPointCustomerId(registerJson.id);
          setPointInfo(`단골 등록 성공! 웰컴 0p 적립되었습니다.`);
        } else {
          setPointError('적립 회원 조회 중 오류가 발생했습니다.');
        }
      }
    } catch (e) {
      setPointError('서버 연결 중 오류가 발생했습니다.');
    }
  };

  // 포인트 적용 및 OTP 발송
  const handleRequestOtp = async () => {
    if (!phoneForPoints || !usePointsInput) return;
    setPointError('');
    setPointInfo('');
    
    const pointsToUse = Number(usePointsInput);
    if (isNaN(pointsToUse) || pointsToUse <= 0) {
      setPointError('올바른 포인트를 입력하세요.');
      return;
    }

    if (pointBalance === null || pointsToUse > pointBalance) {
      setPointError(`잔액이 부족합니다. (보유: ${pointBalance || 0}p)`);
      return;
    }

    if (pointsToUse < 1000) {
      setPointError('적립금은 최소 1,000p 이상부터 사용 가능합니다.');
      return;
    }

    setIsOtpSending(true);
    try {
      const res = await fetch('/api/points/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phone: phoneForPoints })
      });
      const json = await res.json();
      if (json.success) {
        setIsOtpSent(true);
        setPointInfo('인증번호(4자리)가 SMS로 정상 발급되었습니다.');
      } else {
        setPointError(json.error);
      }
    } catch (e) {
      setPointError('OTP 전송 중 오류가 발생했습니다.');
    } finally {
      setIsOtpSending(false);
    }
  };

  // OTP 인증코드 검증 및 실제 차감 할인 적용
  const handleVerifyOtp = async () => {
    if (!phoneForPoints || !otpCode) return;
    setPointError('');
    setPointInfo('');

    setIsOtpVerifying(true);
    try {
      const res = await fetch('/api/points/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', phone: phoneForPoints, code: otpCode })
      });
      const json = await res.json();
      if (json.success) {
        setIsOtpVerified(true);
        setAppliedPoints(Number(usePointsInput));
        setPointInfo(`본인인증 완료! -${Number(usePointsInput).toLocaleString()}원 할인이 최종 적용됩니다.`);
      } else {
        setPointError(json.error);
      }
    } catch (e) {
      setPointError('OTP 검증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsOtpVerifying(false);
    }
  };

  const submitOrder = async () => {
    if (cartItemsCount === 0) return;
    
    // 포인트 사용 금액이 적용되었으나 인증되지 않은 상태 차단
    if (Number(usePointsInput) > 0 && !isOtpVerified) {
      alert("포인트 차감 결제를 위해 SMS OTP 인증을 먼저 진행해 주세요.");
      return;
    }

    setIsSubmitting(true);

    const orderedItems = Object.entries(cart).map(([id, qty]) => {
      const p = products.find(prod => prod.id === id);
      return { product: p, qty };
    }).filter(i => i.product);

    if (orderedItems.length === 0) {
      setIsSubmitting(false);
      return;
    }

    // Prepare data for the existing CRM schema
    const firstItemName = orderedItems[0].product.name;
    const productName = orderedItems.length > 1 ? `${firstItemName} 외 ${orderedItems.length - 1}건` : firstItemName;
    let customerMemo = orderedItems.map(i => `${i.product.name} ${i.qty}개`).join('\n');
    
    const originalPrice = cartTotalAmount;
    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const finalPrice = Math.max(0, originalPrice - discountAmount - appliedPoints);

    if (appliedCoupon) {
      customerMemo += `\n[쿠폰사용: ${appliedCoupon.code} (-${discountAmount.toLocaleString()}원 할인)]`;
    }
    if (appliedPoints > 0) {
      customerMemo += `\n[포인트차감: -${appliedPoints.toLocaleString()}원 사용]`;
    }
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `테이블 ${tableId}번`,
          customerPhone: phoneForPoints || '010-0000-0000', // 실제 휴대폰 번호 동봉 연동
          productName,
          quantity: cartItemsCount.toString(),
          totalPrice: finalPrice.toString(),
          deliveryMethod: '매장에서',
          shippingAddress: '',
          customerMemo,
          status: '결제대기'
        })
      });
      const json = await res.json();
      if (json.success) {
        // 실제 결제 및 차감에 연계된 포인트 소모 API 호출
        if (appliedPoints > 0 && pointCustomerId) {
          await fetch('/api/points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: pointCustomerId,
              amount: -appliedPoints, // 차감은 음수
              reason: `테이블오더 [T-${tableId}] 결제 포인트 차감 사용`
            })
          }).catch(err => console.error('주문 성공 후 포인트 실차감 요청 실패:', err));
        }

        setOrderSuccess(true);
        setCart({});
        setCouponCode('');
        setAppliedCoupon(null);
        setCouponError('');
        setPhoneForPoints('');
        setPointBalance(null);
        setPointCustomerId(null);
        setUsePointsInput('');
        setAppliedPoints(0);
        setOtpCode('');
        setIsOtpSent(false);
        setIsOtpVerified(false);
        setPointError('');
        setPointInfo('');
        
        setTimeout(() => {
          setOrderSuccess(false);
        }, 3000);
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
    if (cartTotalAmount === 0) return;
    
    const cartItems = Object.entries(cart).map(([id, qty]) => {
      const p = products.find(prod => prod.id === id);
      return {
        product_id: id,
        category: p?.category || '',
        menu_category: p?.menu_category || '',
        quantity: qty,
        unit_price: p ? getNumericPrice(p.price) : 0
      };
    }).filter(item => item.unit_price > 0);

    try {
      const res = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderAmount: cartTotalAmount, cart_items: cartItems })
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

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <Check className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">주문이 들어갔습니다!</h1>
        <p className="text-slate-400 mb-6 font-medium text-lg">테이블 {tableId}번 주문이 주방으로 전달되었습니다.</p>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-left w-full max-w-sm mx-auto mb-8 border border-white/5">
          <h4 className="text-sm font-bold text-orange-400 mb-3 border-b border-white/10 pb-2">계좌 이체 결제 안내</h4>
          <p className="text-sm text-slate-300 mb-1">카운터 방문이 어려우신 경우 아래 계좌로 송금해 주세요.</p>
          <div className="bg-black/20 p-3 rounded-xl border border-white/5 mt-3">
            <div className="font-mono text-sm font-bold text-white">
              국민은행 123456-12-123456
              <span className="block text-xs text-slate-400 mt-1">예금주: 주식회사 이지데스크</span>
            </div>
          </div>
        </div>

        <button onClick={() => setOrderSuccess(false)} className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-700 transition-colors">
          메뉴 더 보기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => router.push('/table-order')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black text-slate-800">테이블 {tableId}번</h1>
          <div className="w-10"></div>
        </div>
        {/* Dynamic Categories */}
        <div className="flex overflow-x-auto px-4 py-2 space-x-2 scrollbar-hide">
          {categories.map((cat: any) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeCategory === cat 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Product List */}
      <div className="flex-1 px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-2xl" />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            해당 분류의 상품이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map(product => {
              const qty = cart[product.id] || 0;
              return (
                <div key={product.id} className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-slate-100">
                  <div className="w-24 h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                    {product.main_image_url ? (
                      <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 font-medium text-xs">No Img</div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 justify-between py-1">
                    <div>
                      <h3 className="font-bold text-slate-800 leading-tight mb-1">{product.name}</h3>
                      <div className="text-orange-600 font-black tracking-tight text-lg">
                        {product.price === '상담후결정' ? '직원 문의' : `${getNumericPrice(product.price).toLocaleString()}원`}
                      </div>
                    </div>
                    <div className="flex justify-end items-center mt-2">
                      {qty > 0 ? (
                        <div className="flex items-center bg-orange-50 border border-orange-200 rounded-lg overflow-hidden h-10 w-28">
                          <button onClick={() => updateCart(product.id, -1)} className="flex-1 flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-colors h-full">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="flex-1 text-center font-bold text-orange-700">{qty}</span>
                          <button onClick={() => updateCart(product.id, 1)} className="flex-1 flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-colors h-full">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => updateCart(product.id, 1)} className="bg-slate-900 text-white font-bold text-sm px-5 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                          담기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-auto sm:w-[400px] sm:mx-auto z-50">
          
          {/* 할인 & 적립금 적용 래퍼 패널 */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 mb-2 border border-slate-100 flex flex-col gap-3">
            
            {/* 1. 쿠폰 영역 */}
            <div className="border-b border-slate-100 pb-2">
              <p className="text-[10px] font-bold text-slate-400 mb-1">사용 가능한 쿠폰 코드</p>
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="쿠폰 번호를 입력하세요" 
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 uppercase font-mono text-xs"
                  />
                  <button type="button" onClick={handleApplyCoupon} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 whitespace-nowrap text-xs">
                    적용
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-2 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-green-700 block">{appliedCoupon.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-green-700">-{appliedCoupon.discountAmount.toLocaleString()}원</span>
                    <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-green-600 hover:bg-green-100 p-1 rounded-lg">
                      <X className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              )}
              {couponError && <p className="text-red-500 text-[10px] font-bold px-1 mt-1">{couponError}</p>}
            </div>

            {/* 2. 포인트 적립 및 사용 영역 (OTP 보안 탑재) */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-1 flex items-center">
                <Coins className="w-3.5 h-3.5 mr-1 text-orange-500 animate-spin" />
                단골 적립금 (휴대전화번호 입력)
              </p>
              
              {/* 번호 조회 입력부 */}
              {pointBalance === null ? (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={phoneForPoints}
                    onChange={e => setPhoneForPoints(e.target.value)}
                    placeholder="예: 010-1234-5678" 
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-xs"
                  />
                  <button type="button" onClick={handleLookupPoints} className="px-4 py-2 bg-orange-550 text-white font-bold rounded-xl hover:opacity-90 whitespace-nowrap text-xs">
                    단골 조회
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 포인트 금액 입력 및 OTP 발송 */}
                  {!isOtpVerified ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          value={usePointsInput}
                          onChange={e => setUsePointsInput(e.target.value)}
                          placeholder={`사용할 포인트 입력 (최대 ${pointBalance}p)`} 
                          disabled={isOtpSent}
                          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-xs font-bold disabled:bg-slate-50"
                        />
                        {!isOtpSent ? (
                          <button 
                            type="button" 
                            onClick={handleRequestOtp} 
                            disabled={isOtpSending}
                            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 whitespace-nowrap text-xs"
                          >
                            {isOtpSending ? '발송 중..' : '인증번호 발송'}
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => { setIsOtpSent(false); setOtpCode(''); }}
                            className="px-3 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-350"
                          >
                            번호 재입력
                          </button>
                        )}
                      </div>
                      
                      {/* OTP 입력 및 검증 */}
                      {isOtpSent && (
                        <div className="flex gap-2 animate-scale-up">
                          <input 
                            type="text" 
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value)}
                            placeholder="문자로 수신된 4자리 입력" 
                            className="flex-1 border-2 border-orange-400 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-center text-xs font-black"
                          />
                          <button 
                            type="button" 
                            onClick={handleVerifyOtp} 
                            disabled={isOtpVerifying}
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:opacity-95 whitespace-nowrap text-xs border-0"
                          >
                            {isOtpVerifying ? '확인 중..' : '인증 승인'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 인증 성공 시 표출 */
                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-indigo-700 block">단골 적립금 포인트 할인</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-indigo-700">-{appliedPoints.toLocaleString()}원</span>
                        <button 
                          type="button" 
                          onClick={() => { 
                            setAppliedPoints(0); 
                            setUsePointsInput(''); 
                            setIsOtpVerified(false); 
                            setIsOtpSent(false); 
                            setOtpCode(''); 
                          }} 
                          className="text-indigo-600 hover:bg-indigo-100 p-1 rounded-lg border-0 bg-transparent cursor-pointer"
                        >
                          <X className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* 정보 리셋 버튼 */}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold px-1">
                    <span>* 1,000p 이상부터 10원 단위로 사용 가능</span>
                    <button 
                      type="button" 
                      onClick={() => { 
                        setPointBalance(null); 
                        setPhoneForPoints('');
                        setPointCustomerId(null);
                        setUsePointsInput('');
                        setAppliedPoints(0);
                        setIsOtpSent(false);
                        setIsOtpVerified(false);
                        setOtpCode('');
                        setPointError('');
                        setPointInfo('');
                      }}
                      className="text-slate-450 hover:underline border-0 bg-transparent cursor-pointer"
                    >
                      다른 휴대폰 번호로 변경
                    </button>
                  </div>

                </div>
              )}
              {pointError && <p className="text-red-500 text-[10px] font-bold px-1 mt-1">{pointError}</p>}
              {pointInfo && <p className="text-indigo-600 text-[10px] font-bold px-1 mt-1">{pointInfo}</p>}
            </div>

          </div>

          <button 
            onClick={submitOrder}
            disabled={isSubmitting}
            className="w-full bg-orange-600 text-white rounded-2xl shadow-xl shadow-orange-600/30 p-4 flex items-center justify-between hover:bg-orange-700 transition-colors group disabled:bg-slate-400 disabled:shadow-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-orange-100 text-sm font-medium">총 {cartItemsCount}개 담음</div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {(appliedCoupon || appliedPoints > 0) && (
                    <span className="text-white/60 line-through text-sm">
                      {cartTotalAmount.toLocaleString()}
                    </span>
                  )}
                  <span className="text-white font-black text-xl">
                    {finalEarningBasis.toLocaleString()}원
                  </span>
                  
                  {/* 동적 예상 적립금 뱃지 아이콘 탑재 */}
                  {expectedPoints > 0 && (
                    <span 
                      onClick={(e) => { e.stopPropagation(); setShowPointGuide(true); }}
                      className="bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md ml-1.5 animate-pulse select-none"
                      title="적립 혜택 자세히 보기"
                    >
                      <Coins className="w-3 h-3 text-slate-900 shrink-0" />
                      +{expectedPoints.toLocaleString()}p 적립 예정 💡
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="font-bold text-lg flex items-center bg-white/10 px-5 py-3 rounded-xl group-hover:bg-white/20 transition-colors">
              주문하기
            </div>
          </button>
        </div>
      )}

      {/* 3초 단골 적립 안내 가이드 팝업 모달 */}
      {showPointGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowPointGuide(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden flex flex-col p-6 sm:p-8 animate-scale-up border border-slate-100/50">
            <button onClick={() => setShowPointGuide(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors border-0 bg-transparent cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-6">
                <Coins className="w-8 h-8 text-slate-900 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">3초 단골 적립 서비스 안내</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                이지데스크 평생 무료 SMS와 연계되어 점주님의 마진을 지키고 고객님께는 보상을 드리는 프리미엄 적립 시스템입니다.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50 text-left">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0 text-orange-600 font-bold text-xs">01</div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 mb-1">번호 입력으로 즉석 자동 가입</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">복잡한 회원 가입 없이 휴대전화번호만 적으면 1초 만에 임시 단골회원으로 등록되어 즉시 적립됩니다.</p>
                </div>
              </div>
              
              <div className="flex gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50 text-left">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 text-amber-600 font-bold text-xs">02</div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 mb-1">
                    {pointEarningRate > 0 ? `결제액의 ${pointEarningRate}% 실시간 적립` : '포인트 적립 일시 정지'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    {pointEarningRate > 0 
                      ? '이번 결제가 완료되는 즉시 예상 적립금 포인트가 휴대폰 번호에 영구적으로 안전하게 누적됩니다.' 
                      : '현재 단골 포인트 적립 서비스가 제공되지 않고 있습니다. 점주에게 문의해 주세요.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50 text-left">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 text-blue-600 font-bold text-xs">03</div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 mb-1">무료 SMS 2차 OTP 보안 사용</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">쌓인 적립금(1,000p 이상) 사용 시 본인 폰으로 전송되는 4자리 일회용 승인번호를 입력하여 도용 없이 안전하게 차감 결제합니다.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowPointGuide(false)} 
              className="mt-6 w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-all border-0 shadow-md shadow-slate-900/10 cursor-pointer"
            >
              확인 및 닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
