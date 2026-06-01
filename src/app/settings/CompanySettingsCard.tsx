'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Save, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

interface CompanyProfile {
  companyName: string;
  representative: string;
  businessNumber: string;
  address: string;
  phone: string;
  email: string;
}

export default function CompanySettingsCard() {
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: '',
    representative: '',
    businessNumber: '',
    address: '',
    phone: '',
    email: '',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // AI OCR 및 드래그 앤 드롭 업로드 상태
  const [isOcrAnalyzing, setIsOcrAnalyzing] = useState<boolean>(false);
  const [fileDragOver, setFileDragOver] = useState<boolean>(false);

  // 1. 회사 정보 로드
  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const res = await fetch('/api/settings?key=my_company_profile');
        const data = await res.json();
        if (data.success && data.value) {
          try {
            const parsed = JSON.parse(data.value);
            setProfile({
              companyName: parsed.companyName || '',
              representative: parsed.representative || '',
              businessNumber: parsed.businessNumber || '',
              address: parsed.address || '',
              phone: parsed.phone || '',
              email: parsed.email || '',
            });
          } catch (e) {
            console.error('회사 프로필 JSON 파싱 에러:', e);
          }
        }
      } catch (err) {
        console.error('회사 정보 로드 실패:', err);
        setMessage({ type: 'error', text: '우리 회사 설정을 로드하지 못했습니다.' });
      } finally {
        setLoading(false);
      }
    }
    fetchCompanyProfile();
  }, []);

  // 2. 사업자등록증 파일 업로드 및 AI 스캔 연동
  const handleFileUpload = async (fileObj: File) => {
    if (!fileObj) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(fileObj.type)) {
      alert('⚠️ 지원되지 않는 파일 포맷입니다. 사업자등록증 사진(JPG, PNG) 또는 PDF 문서만 업로드해 주세요.');
      return;
    }

    setIsOcrAnalyzing(true);
    setMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        // 백엔드 AI OCR API 호출 (crm_partners OCR과 동일 엔드포인트 공용 활용)
        const res = await fetch('/api/partners/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64Data, mimeType: fileObj.type })
        });

        const resData = await res.json();
        
        if (!resData.success) {
          throw new Error(resData.error || '사업자등록증 분석에 실패했습니다.');
        }

        const ocrData = resData.data;

        // 폼 필드 자동 입력 (기존 입력 유지하며 덮어쓰기 보완)
        setProfile(prev => ({
          companyName: ocrData.companyName || prev.companyName,
          representative: ocrData.representative || prev.representative,
          businessNumber: (ocrData.businessNumber || '').replace(/\D/g, '') || prev.businessNumber,
          address: ocrData.address || prev.address,
          phone: ocrData.phone || prev.phone,
          email: prev.email, // 이메일은 보통 스캔 데이터가 미흡하므로 보존
        }));

        setMessage({ type: 'success', text: 'AI가 사업자등록증을 분석하여 본사 정보를 양식에 자동 입력했습니다! ⚡' });
        setTimeout(() => setMessage(null), 5000);
      };

      reader.readAsDataURL(fileObj);

    } catch (err: any) {
      console.error('본사 OCR 에러:', err);
      setMessage({ type: 'error', text: err.message || '파일 처리 중 오류가 발생했습니다.' });
    } finally {
      setIsOcrAnalyzing(false);
    }
  };

  // 3. 회사 정보 저장
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // 사업자등록번호 형식 유효성 체크
    const bizNoClean = profile.businessNumber.replace(/[^0-9]/g, '');
    if (profile.businessNumber && bizNoClean.length !== 10) {
      setMessage({ type: 'error', text: '사업자등록번호는 하이픈 제외 10자리 숫자여야 합니다.' });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'my_company_profile',
          value: JSON.stringify(profile),
        }),
      });

      const data = await res.json();
      if (data.success) {
        // AI RAG 검색 시 활용되도록 개별 Key로도 보관 (하위 호환 및 RAG 쿼리 정교화 목적)
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'company_name', value: profile.companyName }),
        });
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'company_business_number', value: profile.businessNumber }),
        });

        setMessage({ type: 'success', text: '우리 회사(본사) 정보가 안전하게 영속 저장되었습니다. 🟢' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || '저장에 실패했습니다.' });
      }
    } catch (err: any) {
      console.error('회사 정보 저장 에러:', err);
      setMessage({ type: 'error', text: '서버 연동 중 네트워크 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CompanyProfile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 사업자번호 하이픈 자동 포맷팅 헬퍼
  const formatBusinessNumber = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (clean.length <= 3) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5, 10)}`;
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mr-2" />
        <span className="text-slate-500 font-semibold text-sm">우리 회사(본사) 설정 정보를 동기화하는 중...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      
      {/* 카드 헤더 */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              우리 회사 (본사) 정보 설정
              <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                보안 식별 가드
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">시스템을 사용하는 관리자님의 본사 정보를 등록하여 외부 바이어/고객 식별 및 AI 분석 시 활용합니다.</p>
          </div>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full border border-slate-250/30">
          시스템 연동
        </span>
      </div>

      {/* 설정 폼 */}
      <form onSubmit={handleSave} className="p-6 space-y-6">

        {/* 🛠️ AI 본사 사업자등록증 자동 완성 업로더 드롭존 */}
        <div className="bg-slate-50/50 border border-slate-100 p-4.5 rounded-2xl space-y-3 shrink-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            우리 회사 사업자등록증 자동 스냅 채우기 (AI OCR)
          </span>

          {isOcrAnalyzing ? (
            <div className="border border-indigo-200 bg-indigo-50/20 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 animate-pulse relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-indigo-500 to-cyan-400 animate-shimmer"></div>
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <div>
                <span className="text-xs font-black text-slate-700 block">AI 엔진이 본사 사업자등록증 문서를 스캔 중입니다...</span>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">상호, 대표자명, 주소, 번호를 고해상도로 판독하여 폼에 자동 입력합니다.</span>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setFileDragOver(true); }}
              onDragLeave={() => setFileDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setFileDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => document.getElementById('company-license-uploader')?.click()}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                fileDragOver
                  ? 'border-indigo-500 bg-indigo-50/30'
                  : 'border-slate-200 hover:border-indigo-350 hover:bg-slate-50/50'
              }`}
            >
              <Building2 className="w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black text-slate-700 block">이곳에 본사 사업자등록증 파일(이미지/PDF) 드롭 또는 클릭 업로드</span>
              <span className="text-[9px] text-slate-400 font-semibold block mt-1.5">
                지원 포맷: JPG, PNG, PDF (Gemini AI 자동 필드 주입)
              </span>
              <input
                type="file"
                id="company-license-uploader"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          
          {/* 1. 회사명 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold text-slate-700">우리 회사명 (상호)</label>
            <input
              type="text"
              placeholder="예: (주)이지데스크"
              value={profile.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800 placeholder-slate-400 transition-all font-semibold"
              required
            />
          </div>

          {/* 2. 대표자명 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold text-slate-700">대표자 성함</label>
            <input
              type="text"
              placeholder="예: 홍길동"
              value={profile.representative}
              onChange={(e) => handleInputChange('representative', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800 placeholder-slate-400 transition-all font-semibold"
            />
          </div>

          {/* 3. 사업자등록번호 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold text-slate-700">사업자등록번호</label>
            <input
              type="text"
              placeholder="000-00-00000"
              value={profile.businessNumber}
              onChange={(e) => handleInputChange('businessNumber', formatBusinessNumber(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800 placeholder-slate-400 transition-all font-mono font-bold"
            />
          </div>

          {/* 4. 대표 전화번호 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold text-slate-700">대표 전화번호</label>
            <input
              type="text"
              placeholder="예: 02-1234-5678"
              value={profile.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800 placeholder-slate-400 transition-all font-semibold"
            />
          </div>

          {/* 5. 대표 이메일 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold text-slate-700">대표 이메일 주소</label>
            <input
              type="email"
              placeholder="예: contact@egdesk.cloud"
              value={profile.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800 placeholder-slate-400 transition-all font-semibold"
            />
          </div>

          {/* 6. 본점 소재지 주소 */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-[11px] font-extrabold text-slate-700">본점 소재지 주소</label>
            <input
              type="text"
              placeholder="예: 서울특별시 마포구 백범로 31"
              value={profile.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800 placeholder-slate-400 transition-all font-semibold"
            />
          </div>

        </div>

        {/* 저장 알림 메시지 */}
        {message && (
          <div
            className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 저장 버튼 */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all border-0 shadow-md ${
              saving
                ? 'bg-slate-350 text-slate-500 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 cursor-pointer shadow-slate-900/10'
            }`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>본사 정보 저장하기</span>
          </button>
        </div>

      </form>
    </div>
  );
}
