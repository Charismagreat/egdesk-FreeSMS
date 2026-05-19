"use client";
import { useState, useEffect } from "react";
import { CalendarDays, Clock, MapPin, X, Check } from "lucide-react";
import Image from "next/image";

export default function BookingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    reservationDate: '',
    reservationTime: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (json.success) {
        // Filter only '예약상품'
        const bookingProducts = json.products.filter((p: any) => p.category === '예약상품');
        setProducts(bookingProducts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (service: any) => {
    setSelectedService(service);
    setForm({
      customerName: '',
      customerPhone: '',
      reservationDate: '',
      reservationTime: ''
    });
    setOrderSuccess(false);
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
  };

  const closeModal = () => {
    setSelectedService(null);
  };

  const submitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.reservationDate || !form.reservationTime) {
      alert("모든 정보를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    
    // 쿠폰을 사용했다면 예약정보에 합쳐서 전송 (reservation의 경우 customerMemo 필드가 없으므로, serviceName에 병합하거나 
    // 사실 crm_reservations 구조상 메모가 없으므로 service_name 뒤에 덧붙여 기록)
    let finalServiceName = selectedService.name;
    if (appliedCoupon) {
      finalServiceName += ` [쿠폰사용: ${appliedCoupon.code} (-${appliedCoupon.discountAmount.toLocaleString()}원)]`;
    }
    
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          serviceName: finalServiceName,
          reservationDate: form.reservationDate,
          reservationTime: form.reservationTime,
          status: '예약접수'
        })
      });
      const json = await res.json();
      if (json.success) {
        setOrderSuccess(true);
      } else {
        alert("예약 접수 중 오류가 발생했습니다.");
      }
    } catch (e) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNumericPrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const num = Number(priceStr.replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    const unitPrice = getNumericPrice(selectedService?.price || '');
    if (unitPrice === 0) {
      setCouponError('금액이 정해지지 않은 예약에는 쿠폰을 쓸 수 없습니다.');
      return;
    }
    
    try {
      const res = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderAmount: unitPrice })
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
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-white pt-24 pb-20 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-serif text-slate-800 tracking-tight mb-4">
            특별한 하루를 위한 예약
          </h1>
          <p className="text-lg text-slate-500 font-light">
            원하시는 날짜와 시간에 최상의 서비스를 경험해 보세요.
          </p>
        </div>
      </div>

      {/* Service List Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-80 shadow-sm animate-pulse"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl shadow-sm text-center border border-gray-100">
            <CalendarDays className="w-16 h-16 mx-auto text-slate-200 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">등록된 예약 서비스가 없습니다.</h3>
            <p className="text-slate-400">관리자 페이지에서 예약상품을 등록해주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col h-full cursor-pointer" onClick={() => openModal(product)}>
                <div className="relative w-full h-64 bg-gray-50 overflow-hidden">
                  {product.main_image_url ? (
                    <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <CalendarDays className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-slate-900 font-bold px-8 py-3 rounded-full shadow-lg">
                      예약하기
                    </div>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow text-center">
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">{product.name}</h3>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 font-light">{product.description || '상세 설명이 없습니다.'}</p>
                  <div className="mt-auto">
                    <span className="text-lg font-medium text-slate-900">
                      {product.price === '상담후결정' ? '상담 후 결정' : (getNumericPrice(product.price) > 0 ? `${getNumericPrice(product.price).toLocaleString()}원` : '가격 문의')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header Image */}
            <div className="relative h-48 bg-gray-100">
              {selectedService.main_image_url ? (
                <img src={selectedService.main_image_url} alt={selectedService.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300"><CalendarDays className="w-8 h-8" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <button onClick={closeModal} className="absolute top-4 right-4 text-white hover:text-gray-200 p-2 bg-black/20 rounded-full backdrop-blur-md transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <h3 className="text-2xl font-bold text-white">{selectedService.name}</h3>
                <p className="text-white/80 text-sm">{selectedService.price === '상담후결정' ? '상담 후 결정' : (getNumericPrice(selectedService.price) > 0 ? `${getNumericPrice(selectedService.price).toLocaleString()}원` : '가격 문의')}</p>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              {orderSuccess ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-[#F4F4F5] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-slate-800" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">예약 접수 완료</h3>
                  <p className="text-slate-500 mb-6 font-light">입력하신 연락처로 예약 확정 문자가 발송됩니다.</p>
                  
                  <div className="bg-slate-50 rounded-2xl p-5 text-left w-full mb-6 border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 mb-2">무통장 입금 안내 (예약금)</h4>
                    <p className="text-xs text-slate-500 mb-3">예약 확정을 위해 아래 계좌로 금액을 송금해 주세요.</p>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="font-mono text-sm font-bold text-slate-800">
                        국민은행 123456-12-123456
                        <span className="block text-xs text-slate-500 mt-1">예금주: 주식회사 이지데스크</span>
                      </div>
                    </div>
                  </div>

                  <button onClick={closeModal} className="bg-slate-900 text-white font-bold py-4 px-8 rounded-2xl hover:bg-slate-800 transition-colors w-full">
                    닫기
                  </button>
                </div>
              ) : (
                <form onSubmit={submitReservation} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"><CalendarDays className="w-4 h-4 mr-1 text-slate-400"/> 예약 날짜</label>
                      <input 
                        type="date" 
                        required 
                        value={form.reservationDate}
                        onChange={(e) => setForm({...form, reservationDate: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"><Clock className="w-4 h-4 mr-1 text-slate-400"/> 예약 시간</label>
                      <input 
                        type="time" 
                        required 
                        value={form.reservationTime}
                        onChange={(e) => setForm({...form, reservationTime: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">예약자 성함</label>
                    <input 
                      type="text" 
                      required 
                      value={form.customerName}
                      onChange={(e) => setForm({...form, customerName: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-gray-50"
                      placeholder="홍길동"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">연락처</label>
                    <input 
                      type="tel" 
                      required 
                      value={form.customerPhone}
                      onChange={(e) => setForm({...form, customerPhone: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-gray-50"
                      placeholder="010-1234-5678"
                    />
                  </div>

                  {/* Coupon Section */}
                  {selectedService.price !== '상담후결정' && getNumericPrice(selectedService.price) > 0 && (
                    <div className="pt-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">할인 쿠폰</label>
                      {!appliedCoupon ? (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value)}
                            placeholder="쿠폰 코드" 
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 uppercase font-mono bg-gray-50 text-sm"
                          />
                          <button type="button" onClick={handleApplyCoupon} className="px-5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 whitespace-nowrap text-sm transition-colors">
                            적용
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-xl">
                          <div>
                            <span className="font-bold text-green-700 block text-sm">{appliedCoupon.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-green-700 text-sm">-{appliedCoupon.discountAmount.toLocaleString()}원</span>
                            <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-green-600 hover:bg-green-100 p-1.5 rounded-lg">
                              <X className="w-4 h-4"/>
                            </button>
                          </div>
                        </div>
                      )}
                      {couponError && <p className="text-red-500 text-xs mt-2 font-bold">{couponError}</p>}
                      
                      {appliedCoupon && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-slate-500 font-medium text-sm">최종 결제 예정 금액</span>
                          <span className="text-xl font-black text-slate-900">
                            {Math.max(0, getNumericPrice(selectedService.price) - appliedCoupon.discountAmount).toLocaleString()}원
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-2xl font-bold text-lg text-white transition-all mt-4 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20'}`}
                  >
                    {isSubmitting ? '처리 중...' : '예약 접수하기'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
