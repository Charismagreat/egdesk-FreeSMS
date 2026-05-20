"use client";

import { useState, useEffect } from "react";
import { Search, Plus, MoreVertical, Filter, X } from "lucide-react";

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
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              필터
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-4 w-12"><input type="checkbox" className="rounded text-blue-600" /></th>
                <th className="p-4">이름</th>
                <th className="p-4">연락처</th>
                <th className="p-4">주소</th>
                <th className="p-4">배송지 정보</th>
                <th className="p-4">그룹/태그</th>
                <th className="p-4">등록일</th>
                <th className="p-4">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    로딩 중...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    등록된 고객이 없습니다. 우측 상단의 '신규 등록' 버튼을 눌러 고객을 추가하세요.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-4"><input type="checkbox" className="rounded text-blue-600" /></td>
                    <td className="p-4 font-medium text-slate-800 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                        {c.name.charAt(0)}
                      </div>
                      {c.name}
                    </td>
                    <td className="p-4 text-slate-500">{c.phone}</td>
                    <td className="p-4 text-slate-500 truncate max-w-[150px]">{c.address || '-'}</td>
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
                      {c.tags && <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium border border-slate-200">{c.tags}</span>}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && customers.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-sm text-slate-500">
            <span>총 {customers.length}명</span>
            <div className="flex space-x-1">
              <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">이전</button>
              <button className="px-3 py-1 border border-blue-600 bg-blue-600 text-white rounded">1</button>
              <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">다음</button>
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
    </div>
  );
}
