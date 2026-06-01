'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

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

  // 2. 회사 정보 저장
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

        {/* 안내 팁 박스 */}
        <div className="flex gap-2.5 bg-indigo-50/30 border border-indigo-100 p-3.5 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-700 leading-relaxed font-medium">
            <p className="font-bold mb-0.5">💡 본사 정보 등록의 장점</p>
            <p>1. **자동 거래처 가드**: 모바일 견적 요청서 등에서 본사 사업자등록번호가 접수될 경우, 외부 파트너로 잘못 오인 가입되는 중복 데이터 누수를 차단합니다.</p>
            <p className="mt-1">2. **AI 자율 비서 학습**: AI RAG가 문서 분석 및 명함 인식을 수행할 때 본사의 회사명을 대조 인지하여, 회사 내/외부 이해관계자를 고도로 정밀하게 분류해 줍니다.</p>
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
