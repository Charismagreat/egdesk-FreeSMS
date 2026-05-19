"use client";
import { useState } from "react";
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle, ChevronRight, Activity, Scissors, Coffee, Camera } from "lucide-react";

export default function ReservePage() {
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    serviceName: '기본 상담',
    reservationDate: '',
    reservationTime: '10:00'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Example Services
  const services = [
    { name: "기본 상담", icon: <User className="w-6 h-6" />, desc: "1:1 맞춤형 기본 상담" },
    { name: "프리미엄 케어", icon: <Activity className="w-6 h-6" />, desc: "최고급 재료를 사용한 프라이빗 케어" },
    { name: "스타일링/디자인", icon: <Scissors className="w-6 h-6" />, desc: "전문가의 손길로 완성되는 스타일" },
    { name: "스튜디오 촬영", icon: <Camera className="w-6 h-6" />, desc: "인생샷을 남겨드리는 스튜디오 예약" },
  ];

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 10; i <= 20; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
      if (i !== 20) slots.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const submitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.reservationDate || !form.reservationTime) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
      } else {
        alert("예약 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setForm({
      ...form,
      customerName: '',
      customerPhone: '',
      reservationDate: '',
      reservationTime: '10:00'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Banner */}
      <div className="bg-white border-b border-slate-200 pt-16 pb-12 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">예약 서비스</h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          원하시는 날짜와 시간에 서비스를 예약해보세요.<br/>전문가가 최고의 경험을 선사합니다.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {success ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-slate-100">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">예약이 확정되었습니다!</h2>
            <p className="text-slate-500 text-lg mb-8">
              {form.reservationDate} {form.reservationTime}에 뵙겠습니다.<br/>
              예약 확인 안내 문자가 발송되었습니다.
            </p>
            <button 
              onClick={resetForm}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
            >
              새로운 예약하기
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">
            
            {/* Left Column: Service Selection */}
            <div className="w-full md:w-5/12 bg-slate-50 p-5 sm:p-8 border-b md:border-b-0 md:border-r border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                서비스 선택
              </h3>
              
              <div className="space-y-4">
                {services.map((svc) => (
                  <label 
                    key={svc.name}
                    className={`flex items-start p-4 border rounded-2xl cursor-pointer transition-all ${form.serviceName === svc.name ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10' : 'border-slate-200 hover:border-blue-300 bg-white'}`}
                  >
                    <input 
                      type="radio" 
                      name="service" 
                      value={svc.name} 
                      checked={form.serviceName === svc.name}
                      onChange={(e) => setForm({...form, serviceName: e.target.value})}
                      className="sr-only"
                    />
                    <div className={`mt-1 mr-4 flex-shrink-0 ${form.serviceName === svc.name ? 'text-blue-600' : 'text-slate-400'}`}>
                      {svc.icon}
                    </div>
                    <div>
                      <div className={`font-bold ${form.serviceName === svc.name ? 'text-blue-900' : 'text-slate-800'}`}>{svc.name}</div>
                      <div className="text-sm text-slate-500 mt-1">{svc.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Right Column: Date, Time & Info */}
            <div className="w-full md:w-7/12 p-5 sm:p-8">
              <form onSubmit={submitReservation}>
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                  일정 및 정보 입력
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center"><CalendarIcon className="w-4 h-4 mr-2 text-slate-400"/> 예약 날짜 *</label>
                    <input 
                      type="date" 
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={form.reservationDate}
                      onChange={(e) => setForm({...form, reservationDate: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center"><Clock className="w-4 h-4 mr-2 text-slate-400"/> 예약 시간 *</label>
                    <div className="relative">
                      <select 
                        required
                        value={form.reservationTime}
                        onChange={(e) => setForm({...form, reservationTime: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-white"
                      >
                        {generateTimeSlots().map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 mb-10">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center"><User className="w-4 h-4 mr-2 text-slate-400"/> 예약자 성함 *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="홍길동"
                      value={form.customerName}
                      onChange={(e) => setForm({...form, customerName: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center"><Phone className="w-4 h-4 mr-2 text-slate-400"/> 연락처 *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="010-1234-5678"
                      value={form.customerPhone}
                      onChange={(e) => setForm({...form, customerPhone: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm text-slate-500">
                    선택한 서비스:<br/>
                    <strong className="text-blue-600 text-base">{form.serviceName}</strong>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center shadow-lg ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30 hover:-translate-y-0.5'}`}
                  >
                    {isSubmitting ? '예약 중...' : '예약 완료하기'} <ChevronRight className="w-5 h-5 ml-1" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
