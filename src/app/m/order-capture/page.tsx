"use client";
import { useState, useEffect, useRef } from "react";
import { Camera, Image as ImageIcon, Send, ArrowLeft, Loader2, CheckCircle, Search, User, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MobileOrderCapture() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // CRM 단골 고객 실시간 매핑 상태
  const [customers, setCustomers] = useState<any[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    productName: '', // used for notes/memo
    status: '접수완료'
  });

  // Verify auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/operators');
        if (res.status === 401 || res.status === 403) {
          router.replace('/login');
        } else {
          setIsAuthenticated(true);
        }
      } catch (e) {
        router.replace('/login');
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (e) {
      console.error("고객 목록 조회 실패:", e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("캡처 이미지를 첨부해주세요!");
      return;
    }
    if (!form.customerName || !form.customerPhone) {
      alert("고객명과 연락처를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload File
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      setIsUploading(false);

      if (!uploadData.success) {
        alert("이미지 업로드에 실패했습니다.");
        setIsSubmitting(false);
        return;
      }

      const attachmentUrl = uploadData.url;

      // 2. Submit Order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          productName: form.productName || '캡처 접수건',
          quantity: '1',
          totalPrice: '0',
          deliveryMethod: '상담/캡처',
          status: form.status,
          attachmentUrl: attachmentUrl
        })
      });

      const orderData = await orderRes.json();
      if (orderData.success) {
        setSuccess(true);
      } else {
        alert("접수 처리 중 오류가 발생했습니다.");
      }
    } catch (e) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setFile(null);
    setPreview(null);
    setForm({
      customerName: '',
      customerPhone: '',
      productName: '',
      status: '접수완료'
    });
  };

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Mobile Header */}
      <div className="bg-white px-4 py-4 border-b border-slate-200 sticky top-0 z-50 flex items-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">간편 캡처 접수</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {success ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100 mt-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">접수 완료!</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              성공적으로 접수되었습니다.<br/>PC 관리자 화면에서 확인 가능합니다.
            </p>
            <button 
              onClick={resetForm}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              새로 접수하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Image Uploader */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                <ImageIcon className="w-4 h-4 mr-1 text-blue-500" /> 증빙 캡처 첨부 (필수)
              </h3>
              
              {!preview ? (
                <div 
                  className="border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                    <Camera className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="text-slate-500 font-medium">여기를 눌러 캡처/사진 선택</span>
                  <span className="text-xs text-slate-400 mt-1">카카오톡, 문자, 통화녹음 내역</span>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img src={preview} alt="미리보기" className="w-full h-auto max-h-64 object-contain bg-slate-900" />
                  <button 
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm"
                  >
                    삭제
                  </button>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Input Form */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-bold text-slate-700">고객명 *</label>
                  <button
                    type="button"
                    onClick={() => { setIsCustomerModalOpen(true); setCustomerSearchTerm(""); }}
                    className="text-[11px] bg-blue-50 text-blue-600 hover:bg-blue-100 font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-blue-200/60 transition-colors"
                  >
                    <Search className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>단골 검색</span>
                  </button>
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="예: 홍길동"
                  value={form.customerName}
                  onChange={e => setForm({...form, customerName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">연락처 *</label>
                <input 
                  type="tel" 
                  required
                  placeholder="예: 010-1234-5678"
                  value={form.customerPhone}
                  onChange={e => setForm({...form, customerPhone: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">상담 메모 (상품/내용)</label>
                <textarea 
                  placeholder="간단한 메모를 남겨주세요."
                  rows={2}
                  value={form.productName}
                  onChange={e => setForm({...form, productName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-2">접수 상태 처리</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <label className={`flex-1 text-center py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors ${form.status === '접수완료' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                    <input type="radio" name="status" value="접수완료" checked={form.status === '접수완료'} onChange={e => setForm({...form, status: e.target.value})} className="sr-only" />
                    바로 접수
                  </label>
                  <label className={`flex-1 text-center py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors ${form.status === '견적요청' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-slate-500'}`}>
                    <input type="radio" name="status" value="견적요청" checked={form.status === '견적요청'} onChange={e => setForm({...form, status: e.target.value})} className="sr-only" />
                    견적 요청
                  </label>
                </div>
              </div>
            </div>

            {/* Sticky Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full max-w-lg mx-auto flex items-center justify-center py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}`}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> {isUploading ? '업로드 중...' : '접수 중...'}</>
                ) : (
                  <><Send className="w-5 h-5 mr-2" /> 증빙과 함께 접수하기</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* CRM 단골 고객 실시간 조회 모달 */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh] border border-slate-100 animate-scale-up">
            
            {/* 모달 헤더 */}
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-500" />
                <span>단골 고객 실시간 매핑</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 border-0 bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 모달 검색바 */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 flex-row focus-within:border-blue-500 transition-colors">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input 
                  type="text"
                  placeholder="고객 이름 또는 휴대폰 번호 검색..."
                  value={customerSearchTerm}
                  onChange={e => setCustomerSearchTerm(e.target.value)}
                  className="w-full bg-transparent outline-none text-xs font-semibold text-slate-800 placeholder-slate-400"
                />
                {customerSearchTerm && (
                  <button 
                    type="button"
                    onClick={() => setCustomerSearchTerm("")}
                    className="p-0.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 shrink-0 ml-1 transition-colors border-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 고객 리스트 바디 */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {(() => {
                const filteredCustomers = customers.filter((c: any) => 
                  c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                  c.phone.replace(/[^0-9]/g, '').includes(customerSearchTerm.replace(/[^0-9]/g, ''))
                );
                
                if (filteredCustomers.length === 0) {
                  return (
                    <div className="text-center py-10 text-xs text-slate-400 font-bold">
                      일치하는 단골 고객이 없습니다.
                    </div>
                  );
                }
                
                return filteredCustomers.map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setForm({
                        ...form,
                        customerName: c.name,
                        customerPhone: c.phone
                      });
                      setIsCustomerModalOpen(false);
                    }}
                    className="w-full text-left p-3.5 hover:bg-blue-50/50 rounded-xl flex items-center justify-between border-0 bg-transparent cursor-pointer transition-colors group"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{c.phone}</span>
                    </div>
                    {c.tags && (
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                        {c.tags.split(',')[0]}
                      </span>
                    )}
                  </button>
                ));
              })()}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
