"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Check, ChevronLeft, Minus, Plus, X } from "lucide-react";

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

  const categories = ["전체", "식사류", "안주류", "주류", "음료", "일반상품"];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (json.success) setProducts(json.products);
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

  const filteredProducts = activeCategory === "전체" 
    ? products 
    : products.filter(p => (p.category || '일반상품') === activeCategory);

  const cartItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotalAmount = Object.entries(cart).reduce((total, [id, qty]) => {
    const p = products.find(prod => prod.id === id);
    if (!p) return total;
    return total + (getNumericPrice(p.price) * qty);
  }, 0);

  const submitOrder = async () => {
    if (cartItemsCount === 0) return;
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
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    if (appliedCoupon) {
      customerMemo += `\n[쿠폰사용: ${appliedCoupon.code} (-${discountAmount.toLocaleString()}원 할인)]`;
    }
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `테이블 ${tableId}번`,
          customerPhone: '000-0000-0000', // Mock phone for table order
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
        setOrderSuccess(true);
        setCart({});
        setCouponCode('');
        setAppliedCoupon(null);
        setCouponError('');
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
    
    try {
      const res = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderAmount: cartTotalAmount })
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
        
        {/* Categories */}
        <div className="flex overflow-x-auto hide-scrollbar px-4 pb-4 gap-2 border-b border-slate-100">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
          <div className="bg-white rounded-2xl shadow-2xl p-4 mb-2 border border-slate-100 flex flex-col gap-2">
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="쿠폰 번호를 입력하세요" 
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 uppercase font-mono text-sm"
                />
                <button type="button" onClick={handleApplyCoupon} className="px-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 whitespace-nowrap text-sm">
                  적용
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-2 rounded-xl text-sm">
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
            {couponError && <p className="text-red-500 text-xs font-bold px-1">{couponError}</p>}
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
                <div className="flex items-center gap-2">
                  {appliedCoupon && (
                    <span className="text-white/60 line-through text-sm">
                      {cartTotalAmount.toLocaleString()}
                    </span>
                  )}
                  <span className="text-white font-black text-xl">
                    {Math.max(0, cartTotalAmount - (appliedCoupon ? appliedCoupon.discountAmount : 0)).toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
            <div className="font-bold text-lg flex items-center bg-white/10 px-5 py-3 rounded-xl group-hover:bg-white/20 transition-colors">
              주문하기
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
