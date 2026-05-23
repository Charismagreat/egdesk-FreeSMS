"use client";

import { useState, useEffect } from "react";
import { Search, Plus, MoreVertical, Filter, X, Calendar, DollarSign, Package, RefreshCw, Truck, AlertCircle, MapPin, User, Phone, Clipboard, ArrowRight, ShoppingBag, Coins } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  phone: string;
  tags: string;
  created_at: string;
  address?: string;
  shipping_address?: string;
  recipient_name?: string;
  recipient_phone?: string;
  point_balance?: number; // 적립금 컬럼 추가
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 검색어 입력 시 페이지 번호 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  
  // History Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerHistory, setCustomerHistory] = useState<{
    orders: any[];
    transactions: any[];
    deliveries: any[];
    stats: {
      totalOrders: number;
      cancelledOrders: number;
      returnedOrders: number;
      totalAmount: number;
    };
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'orders' | 'cancelled' | 'transactions' | 'deliveries' | 'points'>('orders');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 포인트 시스템 전용 추가 상태
  const [pointBalance, setPointBalance] = useState<number>(0);
  const [pointHistory, setPointHistory] = useState<any[]>([]);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', tags: '', memo: '', address: '', shipping_address: '', recipient_name: '', recipient_phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/customers');
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data.rows || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomerHistory = async (customer: Customer) => {
    setIsLoadingHistory(true);
    try {
      // 1. 기존 거래 이력 조회
      const res = await fetch(`/api/customers/history?phone=${encodeURIComponent(customer.phone)}`);
      const json = await res.json();
      if (json.success) {
        setCustomerHistory(json.data);
      } else {
        alert("이력 조회 실패: " + json.error);
      }

      // 2. 포인트 잔액 및 이력 조회
      const pointRes = await fetch(`/api/points?customerId=${customer.id}`);
      const pointJson = await pointRes.json();
      if (pointJson.success) {
        setPointBalance(pointJson.balance);
        setPointHistory(pointJson.history || []);
      }
    } catch (e) {
      console.error("이력 조회 에러:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerHistory(null);
    setPointHistory([]);
    setPointBalance(0);
    setAdjustAmount('');
    setAdjustReason('');
    setActiveHistoryTab('orders');
    setShowHistoryModal(true);
    fetchCustomerHistory(customer);
  };

  // 점주 포인트 수동 증감 핸들러
  const handleAdjustPoints = async () => {
    if (!selectedCustomer) return;
    const amountNum = Number(adjustAmount);
    
    if (isNaN(amountNum) || amountNum === 0) {
      alert("올바른 조정 금액을 입력해 주세요. (지급은 양수, 차감은 음수 입력)");
      return;
    }
    
    if (!adjustReason.trim()) {
      alert("조정 사유를 입력해 주세요.");
      return;
    }
    
    setIsAdjusting(true);
    try {
      const res = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          amount: amountNum,
          reason: adjustReason.trim()
        })
      });
      const json = await res.json();
      if (json.success) {
        alert("포인트가 성공적으로 조정되었습니다.");
        setAdjustAmount('');
        setAdjustReason('');
        setPointBalance(json.newBalance);
        
        // 이력 재조회
        const pointRes = await fetch(`/api/points?customerId=${selectedCustomer.id}`);
        const pointJson = await pointRes.json();
        if (pointJson.success) {
          setPointHistory(pointJson.history || []);
        }
        
        // 전체 리스트 갱신
        fetchCustomers();
      } else {
        alert("포인트 조정 실패: " + json.error);
      }
    } catch (err) {
      alert("포인트 조정 요청 중 오류가 발생했습니다.");
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert("이름과 연락처는 필수 입력값입니다.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setNewCustomer({ name: '', phone: '', tags: '', memo: '', address: '', shipping_address: '', recipient_name: '', recipient_phone: '' });
        fetchCustomers();
      } else {
        alert("등록 실패: " + json.error);
      }
    } catch (e) {
      alert("요청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        try {
          const res = await fetch('/api/customers/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ csvText: text })
          });
          const json = await res.json();
          if (json.success) {
            alert(`CSV 업로드 완료: ${json.count}개의 새로운 연락처를 가져왔습니다.`);
            fetchCustomers();
          } else {
            alert("업로드 실패: " + json.error);
          }
        } catch (err) {
          alert("요청 중 오류가 발생했습니다.");
        } finally {
          setIsUploading(false);
          e.target.value = '';
        }
      };
      reader.readAsText(file, 'utf-8');
    } catch (e) {
      alert("파일 읽기 오류가 발생했습니다.");
      setIsUploading(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query) ||
      (c.tags && c.tags.toLowerCase().includes(query))
    );
  });

  // 페이지네이션 슬라이싱 로직
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">고객 관리</h1>
        <div className="flex space-x-2">
          <label className={`bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm ${isUploading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
            {isUploading ? "업로드 중..." : "CSV/엑셀 일괄 등록"}
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleCsvUpload}
              disabled={isUploading}
            />
          </label>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            신규 등록
          </button>
        </div>
      </div>

      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center justify-between mb-6 shadow-sm">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <div>
              <p className="font-bold">연락처를 업로드하는 중입니다...</p>
              <p className="text-sm mt-1">파일의 연락처를 분석하고 데이터베이스에 저장하고 있습니다.</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="이름, 연락처, 태그로 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-xs"
            />
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center text-xs font-semibold">
              <Filter className="w-4 h-4 mr-2" />
              필터
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="p-4 w-12"><input type="checkbox" className="rounded text-blue-600" /></th>
                <th className="p-4">이름</th>
                <th className="p-4">연락처</th>
                <th className="p-4">주소</th>
                <th className="p-4">배송지 정보</th>
                <th className="p-4">그룹/태그</th>
                <th className="p-4">적립금</th>
                <th className="p-4">등록일</th>
                <th className="p-4">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    로딩 중...
                  </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    {customers.length === 0 ? "등록된 고객이 없습니다. 우측 상단의 '신규 등록' 버튼을 눌러 고객을 추가하세요." : "검색 조건과 일치하는 고객이 없습니다."}
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c) => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(c)}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded text-blue-600" />
                    </td>
                    <td className="p-4 font-medium text-slate-800 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold mr-3 shadow-sm text-xs">
                        {c.name.charAt(0)}
                      </div>
                      {c.name}
                    </td>
                    <td className="p-4 text-slate-500 font-mono">{c.phone}</td>
                    <td className="p-4 text-slate-500 truncate max-w-[150px]" title={c.address}>{c.address || '-'}</td>
                    <td className="p-4 text-slate-500 text-xs">
                      {c.shipping_address ? (
                        <div>
                          <p className="font-semibold text-slate-700">{c.recipient_name} <span className="font-normal text-slate-400">({c.recipient_phone})</span></p>
                          <p className="truncate max-w-[150px]" title={c.shipping_address}>{c.shipping_address}</p>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4">
                      {c.tags && (
                        <span className="bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-2xs">
                          {c.tags}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-indigo-650 font-mono">
                      {(c.point_balance || 0).toLocaleString()}p
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleRowClick(c)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg text-[10px] font-bold transition-all shadow-2xs"
                      >
                        이력 조회
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">페이지당 표시:</span>
              <select 
                value={itemsPerPage} 
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }} 
                className="border rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 focus:border-blue-500"
              >
                <option value={10}>10명씩 보기</option>
                <option value={20}>20명씩 보기</option>
                <option value={50}>50명씩 보기</option>
                <option value={100}>100명씩 보기</option>
              </select>
              <span className="text-xs text-slate-400 font-semibold ml-2">
                {filteredCustomers.length === 0 
                  ? "전체 0명 표시" 
                  : `전체 ${filteredCustomers.length}명 중 ${startIndex + 1}-${Math.min(endIndex, filteredCustomers.length)}명 표시`}
              </span>
            </div>
            
            <div className="flex space-x-1">
              <button 
                disabled={currentPage === 1 || totalPages <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all animate-none"
              >
                이전
              </button>
              {totalPages <= 1 ? (
                <button 
                  disabled
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm border border-blue-600 disabled:opacity-50 cursor-not-allowed"
                >
                  1
                </button>
              ) : (
                Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentPage === page 
                        ? 'bg-blue-600 text-white shadow-sm border border-blue-600' 
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    {page}
                  </button>
                ))
              )}
              <button 
                disabled={currentPage === totalPages || totalPages <= 1}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all animate-none"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[500px] shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">신규 고객 등록</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">이름 *</label>
                <input 
                  type="text" 
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  placeholder="예: 홍길동"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">연락처 *</label>
                <input 
                  type="text" 
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="예: 010-1234-5678"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex space-x-2">
                <div className="flex-[2]">
                  <label className="block text-sm font-medium text-slate-700 mb-1">고객 주소</label>
                  <input 
                    type="text" 
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                    placeholder="예: 서울특별시 강남구..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex-[3]">
                  <label className="block text-sm font-medium text-slate-700 mb-1">그룹/태그</label>
                  <input 
                    type="text" 
                    value={newCustomer.tags}
                    onChange={e => setNewCustomer({...newCustomer, tags: e.target.value})}
                    placeholder="예: VVIP, 신규회원"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 mt-2 mb-2">
                <h4 className="text-sm font-bold text-slate-800 mb-3 text-blue-600">배송지 정보 (선택)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">배송지 주소</label>
                    <input 
                      type="text" 
                      value={newCustomer.shipping_address}
                      onChange={e => setNewCustomer({...newCustomer, shipping_address: e.target.value})}
                      placeholder="예: 경기도 성남시 분당구..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">수령인명</label>
                      <input 
                        type="text" 
                        value={newCustomer.recipient_name}
                        onChange={e => setNewCustomer({...newCustomer, recipient_name: e.target.value})}
                        placeholder="예: 김배송"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">수령인 연락처</label>
                      <input 
                        type="text" 
                        value={newCustomer.recipient_phone}
                        onChange={e => setNewCustomer({...newCustomer, recipient_phone: e.target.value})}
                        placeholder="예: 010-9999-8888"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button 
                onClick={() => setShowAddModal(false)} 
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
              >
                취소
              </button>
              <button 
                onClick={handleAddCustomer} 
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 font-medium"
              >
                {isSubmitting ? "등록 중..." : "등록하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 고객 상세 종합 이력 모달 (History Modal) */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200/50 animate-scale-up">
            
            {/* 모달 헤더 (고객 카드 프로필) */}
            <div className="relative p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="absolute top-0 right-0 left-0 h-full overflow-hidden pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400 via-transparent to-transparent"></div>
              
              <div className="relative z-10 flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center font-extrabold text-2xl text-white shadow-lg shadow-indigo-500/25">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-2xl font-bold tracking-tight">{selectedCustomer.name}</h3>
                    {selectedCustomer.tags && (
                      <span className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {selectedCustomer.tags}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-300">
                    <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> {selectedCustomer.phone}</span>
                    {selectedCustomer.address && (
                      <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {selectedCustomer.address}</span>
                    )}
                    <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> 가입일: {new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedCustomer(null);
                  setCustomerHistory(null);
                }} 
                className="relative z-10 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white p-2 rounded-xl transition-all border border-white/10 shadow-2xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {isLoadingHistory ? (
                /* 로딩 스켈레톤 */
                <div className="space-y-6 animate-pulse">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-24 bg-slate-100 rounded-2xl border border-slate-200/60"></div>
                    ))}
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl w-80"></div>
                  <div className="space-y-3">
                    <div className="h-12 bg-slate-100 rounded-xl"></div>
                    <div className="h-20 bg-slate-100 rounded-xl"></div>
                    <div className="h-20 bg-slate-100 rounded-xl"></div>
                  </div>
                </div>
              ) : customerHistory ? (
                <>
                  {/* 요약 통계 카드 그리드 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-100 rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all hover:scale-[1.02]">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">전체 주문 수</p>
                        <h4 className="text-2xl font-black text-slate-800 mt-1">{customerHistory.stats.totalOrders} <span className="text-sm font-normal text-slate-500">건</span></h4>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-rose-50/50 to-orange-50/30 border border-rose-100 rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all hover:scale-[1.02]">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">주문 취소</p>
                        <h4 className="text-2xl font-black text-slate-800 mt-1">{customerHistory.stats.cancelledOrders} <span className="text-sm font-normal text-slate-500">건</span></h4>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50/50 to-yellow-50/30 border border-amber-100 rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all hover:scale-[1.02]">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">반품 수</p>
                        <h4 className="text-2xl font-black text-slate-800 mt-1">{customerHistory.stats.returnedOrders} <span className="text-sm font-normal text-slate-500">건</span></h4>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all hover:scale-[1.02]">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">누적 결제액</p>
                        <h4 className="text-2xl font-black text-slate-800 mt-1">{customerHistory.stats.totalAmount.toLocaleString()} <span className="text-sm font-normal text-slate-500">원</span></h4>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* 탭 내비게이션 */}
                  <div className="border-b border-slate-200/80 flex space-x-6 overflow-x-auto scrollbar-none py-1">
                    {[
                      { id: 'orders', label: '주문 이력', icon: Package, count: customerHistory.orders.length },
                      { id: 'cancelled', label: '취소/반품 내역', icon: RefreshCw, count: customerHistory.stats.cancelledOrders + customerHistory.stats.returnedOrders },
                      { id: 'transactions', label: '거래 내역', icon: DollarSign, count: customerHistory.transactions.length },
                      { id: 'deliveries', label: '배송 정보', icon: Truck, count: customerHistory.deliveries.length },
                      { id: 'points', label: '적립금 내역', icon: Coins, count: pointHistory.length },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeHistoryTab === tab.id;
                      return (
                        <button
                           key={tab.id}
                           onClick={() => setActiveHistoryTab(tab.id as any)}
                           className={`flex items-center space-x-2 pb-3.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap outline-none ${
                             isActive
                               ? 'border-indigo-600 text-indigo-600 scale-[1.02]'
                               : 'border-transparent text-slate-500 hover:text-slate-800'
                           }`}
                        >
                           <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                           <span>{tab.label}</span>
                           <span className={`text-xs px-2 py-0.5 rounded-full font-bold transition-all ${
                             isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                           }`}>
                             {tab.count}
                           </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 탭 콘텐츠 패널 */}
                  <div className="flex-1">
                    
                    {/* 1. 주문 이력 탭 */}
                    {activeHistoryTab === 'orders' && (
                      <div className="space-y-4">
                        {customerHistory.orders.length === 0 ? (
                          <div className="py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
                            <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="font-semibold text-slate-500">주문 내역이 없습니다.</p>
                          </div>
                        ) : (
                          <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                            <table className="w-full text-left text-sm border-collapse">
                              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
                                <tr>
                                  <th className="p-4">주문번호</th>
                                  <th className="p-4">주문일시</th>
                                  <th className="p-4">상품명</th>
                                  <th className="p-4">수량</th>
                                  <th className="p-4 text-right">주문금액</th>
                                  <th className="p-4 text-center">주문상태</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {customerHistory.orders.map((order: any) => {
                                  const isCancelled = order.status === '주문취소' || order.status === '취소완료' || order.status === '취소';
                                  const isReturned = order.status === '반품신청' || order.status === '반품완료' || order.status === '반품';
                                  return (
                                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                                      <td className="p-4 font-mono font-bold text-slate-800 text-xs">{order.id}</td>
                                      <td className="p-4 text-slate-500 text-xs">
                                        {new Date(order.order_date).toLocaleString()}
                                      </td>
                                      <td className="p-4 font-medium text-slate-800">{order.product_name}</td>
                                      <td className="p-4 text-slate-600">{order.quantity || 1}개</td>
                                      <td className="p-4 text-right font-bold text-slate-800">
                                        {Number(order.total_price || 0).toLocaleString()}원
                                      </td>
                                      <td className="p-4 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                          isCancelled 
                                            ? 'bg-rose-50 border-rose-100 text-rose-700' 
                                            : isReturned 
                                            ? 'bg-amber-50 border-amber-100 text-amber-700'
                                            : order.status === '배송완료' 
                                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                            : order.status === '배송중'
                                            ? 'bg-blue-50 border-blue-100 text-blue-700'
                                            : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                        }`}>
                                          {order.status}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. 취소/반품 내역 탭 */}
                    {activeHistoryTab === 'cancelled' && (
                      <div className="space-y-4">
                        {customerHistory.orders.filter((o: any) => 
                          o.status === '주문취소' || o.status === '취소완료' || o.status === '취소' ||
                          o.status === '반품신청' || o.status === '반품완료' || o.status === '반품'
                        ).length === 0 ? (
                          <div className="py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
                            <RefreshCw className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="font-semibold text-slate-500">취소 또는 반품 처리된 이력이 없습니다.</p>
                          </div>
                        ) : (
                          <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                            <table className="w-full text-left text-sm border-collapse">
                              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
                                <tr>
                                  <th className="p-4">주문번호</th>
                                  <th className="p-4">주문일시</th>
                                  <th className="p-4">상품명</th>
                                  <th className="p-4 text-right">환불/정산 예정금액</th>
                                  <th className="p-4 text-center">구분</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {customerHistory.orders
                                  .filter((o: any) => 
                                    o.status === '주문취소' || o.status === '취소완료' || o.status === '취소' ||
                                    o.status === '반품신청' || o.status === '반품완료' || o.status === '반품'
                                  )
                                  .map((order: any) => {
                                    const isCancelled = order.status === '주문취소' || order.status === '취소완료' || order.status === '취소';
                                    return (
                                      <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="p-4 font-mono font-bold text-slate-800 text-xs">{order.id}</td>
                                        <td className="p-4 text-slate-500 text-xs">
                                          {new Date(order.order_date).toLocaleString()}
                                        </td>
                                        <td className="p-4 font-medium text-slate-800">{order.product_name}</td>
                                        <td className="p-4 text-right font-bold text-rose-600">
                                          {Number(order.total_price || 0).toLocaleString()}원
                                        </td>
                                        <td className="p-4 text-center">
                                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                            isCancelled 
                                              ? 'bg-rose-50 border-rose-100 text-rose-700' 
                                              : 'bg-amber-50 border-amber-100 text-amber-700'
                                          }`}>
                                            {isCancelled ? '주문취소' : '반품처리'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. 거래 내역 탭 */}
                    {activeHistoryTab === 'transactions' && (
                      <div className="space-y-4">
                        {customerHistory.transactions.length === 0 ? (
                          <div className="py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
                            <DollarSign className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="font-semibold text-slate-500">거래(결제) 내역이 존재하지 않습니다.</p>
                          </div>
                        ) : (
                          <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                            <table className="w-full text-left text-sm border-collapse">
                              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
                                <tr>
                                  <th className="p-4">거래 ID</th>
                                  <th className="p-4">거래일시</th>
                                  <th className="p-4">결제유형</th>
                                  <th className="p-4 text-right">거래금액</th>
                                  <th className="p-4 text-center">상태</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {customerHistory.transactions.map((tx: any) => {
                                  return (
                                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                                      <td className="p-4 font-mono font-bold text-slate-800 text-xs">{tx.id}</td>
                                      <td className="p-4 text-slate-500 text-xs">
                                        {new Date(tx.order_date).toLocaleString()}
                                      </td>
                                      <td className="p-4 text-slate-700 font-medium">
                                        {tx.payment_method || '신용카드'}
                                      </td>
                                      <td className="p-4 text-right font-black text-indigo-600">
                                        {Number(String(tx.amount || '0').replace(/[^0-9]/g, '')).toLocaleString()}원
                                      </td>
                                      <td className="p-4 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                          tx.status === '결제완료' || tx.status === '배송완료'
                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                            : 'bg-rose-50 border-rose-100 text-rose-700'
                                        }`}>
                                          {tx.status}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. 배송 정보 탭 */}
                    {activeHistoryTab === 'deliveries' && (
                      <div className="space-y-6">
                        {customerHistory.deliveries.length === 0 ? (
                          <div className="py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
                            <Truck className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="font-semibold text-slate-500">등록된 배송 정보가 존재하지 않습니다.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {customerHistory.deliveries.map((delivery: any) => {
                              return (
                                <div key={delivery.id} className="bg-slate-50/40 border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4 hover:border-indigo-200 transition-all">
                                  <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-bold text-slate-800 text-sm">배송 ID: {delivery.id}</span>
                                      <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold border ${
                                        delivery.status === '배송완료' 
                                          ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                                          : 'bg-blue-50 border-blue-100 text-blue-700'
                                      }`}>
                                        {delivery.status}
                                      </span>
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono">운송장: {delivery.tracking_number || '-'}</span>
                                  </div>

                                  <div className="space-y-2 text-xs text-slate-600">
                                    <div className="flex items-start">
                                      <span className="w-20 font-semibold text-slate-400 shrink-0">수령인</span>
                                      <span className="font-bold text-slate-800">{delivery.recipient_name || selectedCustomer.name}</span>
                                    </div>
                                    <div className="flex items-start">
                                      <span className="w-20 font-semibold text-slate-400 shrink-0">연락처</span>
                                      <span className="font-mono">{delivery.recipient_phone || selectedCustomer.phone}</span>
                                    </div>
                                    {delivery.carrier && (
                                      <div className="flex items-start">
                                        <span className="w-20 font-semibold text-slate-400 shrink-0">택배사</span>
                                        <span>{delivery.carrier}</span>
                                      </div>
                                    )}
                                    <div className="flex items-start">
                                      <span className="w-20 font-semibold text-slate-400 shrink-0">배송지 주소</span>
                                      <span className="text-slate-700 font-medium break-all">{delivery.address || selectedCustomer.shipping_address || selectedCustomer.address || '-'}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. 적립금(포인트) 내역 탭 */}
                    {activeHistoryTab === 'points' && (
                      <div className="space-y-6">
                        
                        {/* 적립금 대시보드 요약 및 수동 충전 폼 */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
                          
                          {/* 적립금 잔액 카드 */}
                          <div className="md:col-span-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white rounded-3xl p-6 shadow-md border border-indigo-600/30 flex flex-col justify-between relative overflow-hidden h-44">
                            <div className="absolute top-0 right-0 p-3 opacity-15">
                              <Coins className="w-28 h-28 text-white" />
                            </div>
                            <div className="relative z-10">
                              <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">보유 적립 포인트</p>
                              <h3 className="text-3xl font-black mt-2 font-mono">{pointBalance.toLocaleString()} <span className="text-lg font-bold">p</span></h3>
                            </div>
                            <div className="relative z-10 text-[10px] text-indigo-200 font-medium">
                              이지데스크 무료 SMS 연계 포인트 실시간 연동 중
                            </div>
                          </div>

                          {/* 포인트 수동 조정 폼 */}
                          <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-inner space-y-4">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center">
                              <Coins className="w-4 h-4 mr-1.5 text-indigo-600 animate-bounce" />
                              점주 전용 적립금 수동 지급 / 차감
                            </h4>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1">
                                <input 
                                  type="number"
                                  value={adjustAmount}
                                  onChange={e => setAdjustAmount(e.target.value)}
                                  placeholder="금액 입력 (예: 5000 또는 -2000)"
                                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                />
                              </div>
                              <div className="flex-[2]">
                                <input 
                                  type="text"
                                  value={adjustReason}
                                  onChange={e => setAdjustReason(e.target.value)}
                                  placeholder="조정 사유를 상세하게 기록하세요..."
                                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-semibold text-xs bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                />
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                                * 지급 시 **양수(5000)**, 차감 시 **음수(-2000)**를 입력해 주세요. 모든 내역은 추적 보관됩니다.
                              </p>
                              <button
                                onClick={handleAdjustPoints}
                                disabled={isAdjusting}
                                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/10 hover:opacity-95 disabled:bg-slate-400 disabled:shadow-none transition-all cursor-pointer border-0"
                              >
                                {isAdjusting ? '적용 중...' : '적용하기'}
                              </button>
                            </div>
                          </div>

                        </div>

                        {/* 적립금 상세 타임라인 */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-slate-800 tracking-wider">포인트 적립 및 사용 이력 타임라인</h4>
                          
                          {pointHistory.length === 0 ? (
                            <div className="py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
                              <Coins className="w-12 h-12 text-slate-300 mb-3" />
                              <p className="font-semibold text-slate-500">포인트 이용 내역이 아직 존재하지 않습니다.</p>
                            </div>
                          ) : (
                            <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                              <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
                                  <tr>
                                    <th className="p-4">일시</th>
                                    <th className="p-4">유형</th>
                                    <th className="p-4">변동 포인트</th>
                                    <th className="p-4">변동 후 잔액</th>
                                    <th className="p-4">내용/사유</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white text-xs">
                                  {pointHistory.map((history: any) => {
                                    const isEarn = history.transaction_type === 'EARN';
                                    const isUse = history.transaction_type === 'USE';
                                    const isAmtPositive = history.amount > 0;
                                    
                                    return (
                                      <tr key={history.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="p-4 text-slate-500 font-mono">
                                          {new Date(history.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                            isEarn
                                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                              : isUse
                                              ? 'bg-rose-50 border-rose-100 text-rose-700'
                                              : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                          }`}>
                                            {isEarn ? '구매적립' : isUse ? '결제사용' : '점주조정'}
                                          </span>
                                        </td>
                                        <td className={`p-4 font-bold font-mono ${isAmtPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {isAmtPositive ? `+${history.amount.toLocaleString()}` : `${history.amount.toLocaleString()}`} p
                                        </td>
                                        <td className="p-4 font-semibold text-slate-700 font-mono">
                                          {Number(history.balance_after || 0).toLocaleString()} p
                                        </td>
                                        <td className="p-4 text-slate-600 font-medium">{history.description || '-'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                  </div>
                </>
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-500">데이터를 로드하는 중 오류가 발생했습니다.</p>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex justify-end">
              <button 
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedCustomer(null);
                  setCustomerHistory(null);
                }} 
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all shadow-xs"
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
