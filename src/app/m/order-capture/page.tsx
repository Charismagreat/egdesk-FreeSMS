"use client";
import { useState, useEffect, useRef } from "react";
import { Camera, Image as ImageIcon, Send, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
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
        <button onClick={() => router.push('/')} className="mr-3 p-1 rounded-full hover:bg-slate-100">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
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
                <label className="block text-sm font-bold text-slate-700 mb-1">고객명 *</label>
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
    </div>
  );
}
