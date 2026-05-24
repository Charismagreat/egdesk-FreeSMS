"use client";

import React, { useState, useEffect } from "react";
import { 
  Handshake, Plus, Search, Check, X, ShieldAlert, 
  ChevronRight, Building2, Phone, Mail, MapPin, 
  Coins, Sparkles, Eye, Info, Trash2, Edit2
} from "lucide-react";

interface Partner {
  id: string;
  type: 'VENDOR' | 'BUYER';
  company_name: string;
  business_number: string;
  representative: string;
  phone: string;
  manager_name: string;
  manager_phone: string;
  email: string;
  address: string;
  vip_level: 'NORMAL' | 'VIP';
  credit_limit: number;
  memo: string;
  created_at: string;
  total_performance?: number; // 실시간 집계된 누적 거래액
  pending_count?: number;     // 실시간 집계된 미결 수/발주 건수
}

export default function PartnersDashboard() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'VENDOR' | 'BUYER'>('VENDOR');
  const [searchQuery, setSearchQuery] = useState("");

  // 등록/수정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 입력 폼 바인딩
  const [form, setForm] = useState({
    type: 'VENDOR' as 'VENDOR' | 'BUYER',
    company_name: "",
    business_number: "",
    representative: "",
    phone: "",
    manager_name: "",
    manager_phone: "",
    email: "",
    address: "",
    vip_level: 'NORMAL' as 'NORMAL' | 'VIP',
    credit_limit: 0,
    memo: ""
  });

  // 상세 거래 타임라인 팝업 상태
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [detailHistory, setDetailHistory] = useState<{
    purchaseOrders: any[];
    salesOrders: any[];
  }>({ purchaseOrders: [], salesOrders: [] });
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/partners");
      const data = await res.json();
      if (data.success) {
        setPartners(data.partners || []);
      }
    } catch (e) {
      console.error("거래처 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  // 상세 정보 및 과거 거래 이력 마이닝 팝업 열기
  const openDetailPopup = async (pt: Partner) => {
    setSelectedPartner(pt);
    setIsDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/partners?action=detail&id=${pt.id}`);
      const data = await res.json();
      if (data.success) {
        setDetailHistory({
          purchaseOrders: data.purchaseOrders || [],
          salesOrders: data.salesOrders || []
        });
      }
    } catch (e) {
      console.error("이력 마이닝 에러:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  // 등록/수정 저장
  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim()) {
      alert("상호명을 입력해 주세요.");
      return;
    }

    try {
      let res;
      if (modalMode === 'create') {
        res = await fetch("/api/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
      } else {
        res = await fetch("/api/partners", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, id: editingId })
        });
      }

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchPartners();
        alert(data.message || "정상적으로 보존되었습니다.");
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    }
  };

  // 수정 모드 세팅
  const handleEditClick = (pt: Partner, e: React.MouseEvent) => {
    e.stopPropagation(); // 클릭 전파 차단
    setModalMode('edit');
    setEditingId(pt.id);
    setForm({
      type: pt.type,
      company_name: pt.company_name,
      business_number: pt.business_number || "",
      representative: pt.representative || "",
      phone: pt.phone || "",
      manager_name: pt.manager_name || "",
      manager_phone: pt.manager_phone || "",
      email: pt.email || "",
      address: pt.address || "",
      vip_level: pt.vip_level || 'NORMAL',
      credit_limit: pt.credit_limit || 0,
      memo: pt.memo || ""
    });
    setIsModalOpen(true);
  };

  // 신규 등록용 세팅
  const handleCreateClick = () => {
    setModalMode('create');
    setEditingId(null);
    setForm({
      type: activeTab,
      company_name: "",
      business_number: "",
      representative: "",
      phone: "",
      manager_name: "",
      manager_phone: "",
      email: "",
      address: "",
      vip_level: 'NORMAL',
      credit_limit: 0,
      memo: ""
    });
    setIsModalOpen(true);
  };

  // 삭제
  const handleDeletePartner = async (pt: Partner, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`[경고] 거래처 '${pt.company_name}' 정보를 영구히 데이터베이스에서 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const res = await fetch(`/api/partners?id=${pt.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchPartners();
        alert("거래처 정보가 안전하게 영구 삭제되었습니다.");
      }
    } catch (err) {
      alert("삭제 중 에러가 발생했습니다.");
    }
  };

  // 검색 필터링
  const filteredPartners = partners.filter(pt => {
    if (pt.type !== activeTab) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    return (
      pt.company_name.toLowerCase().includes(query) ||
      (pt.representative && pt.representative.toLowerCase().includes(query)) ||
      (pt.manager_name && pt.manager_name.toLowerCase().includes(query)) ||
      (pt.phone && pt.phone.includes(query)) ||
      (pt.manager_phone && pt.manager_phone.includes(query))
    );
  });

  // 집계 수치 산출
  const totalVendors = partners.filter(p => p.type === 'VENDOR').length;
  const totalBuyers = partners.filter(p => p.type === 'BUYER').length;
  const totalPurchases = partners.filter(p => p.type === 'VENDOR').reduce((sum, p) => sum + (p.total_performance || 0), 0);
  const totalSales = partners.filter(p => p.type === 'BUYER').reduce((sum, p) => sum + (p.total_performance || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in relative pb-16">
      
      {/* 백그라운드 퍼플 광채 */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl -z-10 animate-pulse"></div>

      {/* 헤더 패널 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Handshake className="w-8 h-8 text-emerald-500" />
            <span>거래처 관리 AI</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            B2B 거래의 주체인 공급처(Vendor) 및 도소매 구매처(Buyer)를 체계적으로 관리하고 거래 누적 실적을 AI 마이닝합니다.
          </p>
        </div>

        {/* 탭 버튼 */}
        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-100 max-w-xs shadow-inner">
          <button 
            onClick={() => setActiveTab("VENDOR")}
            className={`flex-1 py-2.5 px-5 rounded-xl text-xs md:text-sm font-black flex items-center justify-center transition-all ${activeTab === "VENDOR" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}
          >
            자재 공급처 (Vendor)
          </button>
          <button 
            onClick={() => setActiveTab("BUYER")}
            className={`flex-1 py-2.5 px-5 rounded-xl text-xs md:text-sm font-black flex items-center justify-center transition-all ${activeTab === "BUYER" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}
          >
            B2B 바이어 (Buyer)
          </button>
        </div>
      </div>

      {/* 실시간 거래 지표 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">등록된 총 거래처</span>
          <span className="text-2xl font-black text-slate-800 block">{partners.length}개사</span>
          <span className="text-[10px] text-slate-400 block mt-1">공급사 {totalVendors} / 바이어 {totalBuyers}</span>
        </div>

        <div className="bg-gradient-to-br from-indigo-50/40 to-indigo-100/10 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-indigo-500 uppercase block">누적 자재 매입액 (발주)</span>
          <span className="text-2xl font-black text-indigo-600 block">{totalPurchases.toLocaleString()}원</span>
          <span className="text-[10px] text-indigo-400 block mt-1">총 공급처 수: {totalVendors}개사</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/40 to-emerald-100/10 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase block">누적 영업 매출액 (수주)</span>
          <span className="text-2xl font-black text-emerald-600 block">{totalSales.toLocaleString()}원</span>
          <span className="text-[10px] text-emerald-400 block mt-1">총 B2B 바이어 수: {totalBuyers}개사</span>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-rose-500 uppercase block flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> 미결 외상 거래 통제
          </span>
          <span className="text-2xl font-black text-slate-800 block">
            {partners.filter(p => p.pending_count! > 0).length}건 경보
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">외상 미결제 한도 실시간 모니터링 중</span>
        </div>

      </div>

      {/* 리스트 패널 */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
        
        {/* 검색 및 추가 버튼 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="거래처명, 대표명, 담당자명, 번호로 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 focus:border-emerald-500 rounded-xl outline-none text-xs font-semibold"
            />
          </div>

          <button
            onClick={handleCreateClick}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-slate-900/10"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            신규 {activeTab === 'VENDOR' ? '공급사' : '바이어'} 등록
          </button>
        </div>

        {/* 메인 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="py-3 px-3">코드</th>
                <th className="py-3 px-3">상호명 / 대표자</th>
                <th className="py-3 px-3">B2B 담당자</th>
                <th className="py-3 px-3">계산서 이메일</th>
                <th className="py-3 px-3">우대 등급</th>
                <th className="py-3 px-3">누적 거래액</th>
                <th className="py-3 px-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">거래처 목록 분석 중...</td>
                </tr>
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">등록된 {activeTab === 'VENDOR' ? '공급처가' : '바이어가'} 없습니다.</td>
                </tr>
              ) : (
                filteredPartners.map(pt => (
                  <tr 
                    key={pt.id} 
                    onClick={() => openDetailPopup(pt)}
                    className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-3 font-mono text-slate-500">{pt.id}</td>
                    <td className="py-4 px-3">
                      <span className="font-extrabold text-slate-800 block">{pt.company_name}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">대표: {pt.representative || '미기입'} | {pt.business_number || '사업자 없음'}</span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-bold text-slate-700 block">{pt.manager_name || '미지정'}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{pt.manager_phone || pt.phone}</span>
                    </td>
                    <td className="py-4 px-3 text-slate-500 font-mono">{pt.email || '계산서 미발행'}</td>
                    <td className="py-4 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${pt.vip_level === 'VIP' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500'}`}>
                        {pt.vip_level}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-extrabold text-indigo-600">{(pt.total_performance || 0).toLocaleString()}원</span>
                      {pt.pending_count! > 0 && (
                        <span className="text-[9px] bg-rose-50 text-rose-500 border border-rose-100 px-1.5 py-0.2 rounded ml-1.5 font-bold">
                          외상 {pt.pending_count}건
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={(e) => handleEditClick(pt, e)}
                          className="p-1.5 bg-slate-100 text-slate-650 hover:bg-slate-200 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => handleDeletePartner(pt, e)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 모달 1: 거래처 등록/수정 팝업 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSavePartner}
            className="bg-white rounded-[32px] max-w-xl w-full p-6 md:p-8 shadow-2xl relative flex flex-col max-h-[90vh] animate-scale-up"
          >
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-emerald-500" />
              <span>B2B 거래처 회원 {modalMode === 'create' ? '신규 등록' : '정보 수정'}</span>
            </h3>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              
              {/* 구분 필드 */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">거래처 구분</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, type: 'VENDOR' }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${form.type === 'VENDOR' ? 'bg-slate-950 text-white' : 'bg-slate-50 border border-slate-200 text-slate-500'}`}
                  >
                    공급처 (Vendor - 매입)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, type: 'BUYER' }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${form.type === 'BUYER' ? 'bg-slate-950 text-white' : 'bg-slate-50 border border-slate-200 text-slate-500'}`}
                  >
                    바이어 (Buyer - 매출)
                  </button>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">상호명 (회사명) *</label>
                  <input 
                    type="text" 
                    value={form.company_name}
                    onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="상호명 입력"
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">사업자등록번호</label>
                  <input 
                    type="text" 
                    value={form.business_number}
                    onChange={e => setForm(p => ({ ...p, business_number: e.target.value }))}
                    placeholder="123-45-67890"
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">대표자 성함</label>
                  <input 
                    type="text" 
                    value={form.representative}
                    onChange={e => setForm(p => ({ ...p, representative: e.target.value }))}
                    placeholder="대표자 이름"
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">대표 연락처</label>
                  <input 
                    type="text" 
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="02-123-4567"
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* B2B 담당자 정보 */}
              <div className="bg-slate-50/50 p-4.5 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">실무 담당자 명세</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">담당자 성함</label>
                    <input 
                      type="text" 
                      value={form.manager_name}
                      onChange={e => setForm(p => ({ ...p, manager_name: e.target.value }))}
                      placeholder="실무자 이름"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">담당자 연락처 (휴대폰)</label>
                    <input 
                      type="text" 
                      value={form.manager_phone}
                      onChange={e => setForm(p => ({ ...p, manager_phone: e.target.value }))}
                      placeholder="010-0000-0000"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">계산서 수령 이메일</label>
                  <input 
                    type="email" 
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="tax@partner.com"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* 여신 및 우대 등급 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">거래 우대 등급</label>
                  <select
                    value={form.vip_level}
                    onChange={e => setForm(p => ({ ...p, vip_level: e.target.value as 'NORMAL' | 'VIP' }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                  >
                    <option value="NORMAL">NORMAL (일반 거래처)</option>
                    <option value="VIP">VIP (단골 우대 등급 - 견적 추가 5% 할인 자동반영)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">B2B 여신(외상) 한도액</label>
                  <input 
                    type="number" 
                    value={form.credit_limit}
                    onChange={e => setForm(p => ({ ...p, credit_limit: parseInt(e.target.value) || 0 }))}
                    placeholder="외상 한도 금액"
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">회사 주소</label>
                <input 
                  type="text" 
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="사업장 소재지 주소"
                  className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">거래 특이 사항 / 메모</label>
                <textarea 
                  value={form.memo}
                  onChange={e => setForm(p => ({ ...p, memo: e.target.value }))}
                  placeholder="예: 월말 일괄 정산 조건, 전속 계약 공급사 등 기입"
                  className="w-full h-16 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none resize-none"
                />
              </div>

            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 py-3 bg-slate-150 hover:bg-slate-200 rounded-xl font-bold text-xs"
              >
                닫기
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                {modalMode === 'create' ? '거래처 등록 승인' : '정보 수정 완수'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 모달 2: 거래처 개별 상세 거래 타임라인 팝업 */}
      {isDetailOpen && selectedPartner && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 md:p-8 shadow-2xl relative flex flex-col max-h-[85vh] animate-scale-up">
            <button 
              onClick={() => setIsDetailOpen(false)} 
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 mb-5">
              <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-black tracking-wider uppercase inline-block">
                Partner Profile
              </span>
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-1.5">
                <span>{selectedPartner.company_name}</span>
                <span className="text-xs font-bold text-slate-400">({selectedPartner.representative || '대표자 미기입'} 대표)</span>
              </h3>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-1">
              
              {/* 상세 스펙 명세 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4.5 rounded-2xl border border-slate-100 text-xs font-semibold">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">사업자 번호</span>
                  <span className="text-slate-700 font-bold block">{selectedPartner.business_number || '미기입'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">회사 번호</span>
                  <span className="text-slate-700 font-bold block">{selectedPartner.phone || '미기입'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">우대 등급</span>
                  <span className="text-indigo-600 font-black block">{selectedPartner.vip_level} Grade</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">실무 담당자</span>
                  <span className="text-slate-700 font-bold block">{selectedPartner.manager_name || '미지정'} ({selectedPartner.manager_phone || '연락처 없음'})</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 block mb-0.5">계산서 이메일</span>
                  <span className="text-slate-700 block truncate">{selectedPartner.email || '미기입'}</span>
                </div>
                <div className="col-span-3 border-t border-slate-200/50 pt-2 mt-1">
                  <span className="text-[10px] text-slate-400 block mb-0.5">사업장 주소</span>
                  <span className="text-slate-700 block">{selectedPartner.address || '소재지 미등록'}</span>
                </div>
              </div>

              {/* 과거 수/발주 실시간 타임라인 */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>실시간 B2B 거래 히스토리 타임라인</span>
                </h4>

                {detailLoading ? (
                  <p className="text-center py-8 text-xs text-slate-400">거래 이력 마이닝 중...</p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {selectedPartner.type === 'VENDOR' ? (
                      // 공급사 발주 목록
                      detailHistory.purchaseOrders.length === 0 ? (
                        <p className="text-center py-6 text-slate-400 text-xs font-semibold">발주 거래 이력이 존재하지 않습니다.</p>
                      ) : (
                        detailHistory.purchaseOrders.map((po: any) => (
                          <div key={po.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-semibold">
                            <div>
                              <span className="font-mono text-slate-400 text-[10px] block">{po.id}</span>
                              <span className="text-slate-800 mt-0.5 block">발주일: {po.created_at.substring(0, 10)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-indigo-600 block">{parseInt(po.total_amount).toLocaleString()}원</span>
                              <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase mt-1 ${po.status === 'PENDING_INBOUND' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {po.status === 'PENDING_INBOUND' ? '입고대기' : '입고완료'}
                              </span>
                            </div>
                          </div>
                        ))
                      )
                    ) : (
                      // 바이어 수주 목록
                      detailHistory.salesOrders.length === 0 ? (
                        <p className="text-center py-6 text-slate-400 text-xs font-semibold">수주 거래 이력이 존재하지 않습니다.</p>
                      ) : (
                        detailHistory.salesOrders.map((so: any) => (
                          <div key={so.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-semibold">
                            <div>
                              <span className="font-mono text-slate-400 text-[10px] block">{so.id}</span>
                              <span className="text-slate-800 mt-0.5 block">수주일: {so.created_at.substring(0, 10)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-emerald-600 block">{parseInt(so.total_amount).toLocaleString()}원</span>
                              <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase mt-1 ${so.status === 'REGISTERED' ? 'bg-amber-150 text-amber-650' : 'bg-emerald-600 text-white'}`}>
                                {so.status === 'REGISTERED' ? '수주대기' : '확정완료'}
                              </span>
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </div>
                )}
              </div>

            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 flex">
              <button 
                onClick={() => setIsDetailOpen(false)} 
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
