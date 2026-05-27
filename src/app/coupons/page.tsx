"use client";
import { useState, useEffect } from "react";
import { Ticket, Plus, Trash2, Percent, DollarSign, Search } from "lucide-react";

export default function CouponsPage() {
  const [data, setData] = useState<any[]>([]);
  const [issueType, setIssueType] = useState<'single' | 'bulk'>('single');
  const [form, setForm] = useState({ 
    code: '', 
    prefix: '',
    count: '100',
    name: '', 
    discount_type: 'amount', 
    discount_value: '', 
    min_order_amount: '',
    expires_at: ''
  });
  const [loading, setLoading] = useState(false);
  const [restrictions, setRestrictions] = useState<any[]>([]);
  const [currentRestriction, setCurrentRestriction] = useState({
    restriction_type: 'EXCLUDE',
    target_type: 'PRODUCT',
    target_value: ''
  });

  const addRestriction = () => {
    if (!currentRestriction.target_value.trim()) {
      return alert('제한 대상 식별 값을 입력해 주세요. (예: 상품 ID 또는 카테고리명)');
    }
    
    const isDup = restrictions.some(
      r => r.restriction_type === currentRestriction.restriction_type &&
           r.target_type === currentRestriction.target_type &&
           r.target_value.trim().toUpperCase() === currentRestriction.target_value.trim().toUpperCase()
    );
    if (isDup) return alert('이미 추가된 제한 조건입니다.');
    
    setRestrictions([...restrictions, { 
      restriction_type: currentRestriction.restriction_type,
      target_type: currentRestriction.target_type,
      target_value: currentRestriction.target_value.trim()
    }]);
    setCurrentRestriction({ ...currentRestriction, target_value: '' });
  };

  const removeRestriction = (index: number) => {
    setRestrictions(restrictions.filter((_, i) => i !== index));
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 검색어 입력 시 페이지 번호 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    const res = await fetch('/api/coupons');
    const json = await res.json();
    if (json.success) setData(json.coupons);
  };

  const filteredData = data.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      (t.code && t.code.toLowerCase().includes(query)) ||
      (t.name && t.name.toLowerCase().includes(query))
    );
  });

  // 페이지네이션 슬라이싱 로직
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const addData = async (e: any) => {
    e.preventDefault();
    if (issueType === 'single' && !form.code) {
      return alert('쿠폰 코드를 입력해주세요.');
    }
    if (issueType === 'bulk' && (!form.count || Number(form.count) < 2)) {
      return alert('발행할 수량을 2개 이상 입력해주세요.');
    }
    if (!form.name || !form.discount_value) {
      return alert('쿠폰명과 할인값은 필수입니다.');
    }
    
    setLoading(true);
    const payload = {
      ...form,
      count: issueType === 'bulk' ? Number(form.count) : 1,
      restrictions
    };

    const res = await fetch('/api/coupons', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload) 
    });
    
    const json = await res.json();
    if (json.success) { 
      setForm({ ...form, code: '', prefix: '', expires_at: '' }); 
      setRestrictions([]);
      fetchData(); 
      if (issueType === 'bulk') alert(`${json.count}개의 쿠폰이 성공적으로 발행되었습니다!`);
    } else {
      alert("등록 실패: " + json.error);
    }
    setLoading(false);
  };

  const deleteData = async (id: string) => {
    if(!confirm('정말 삭제하시겠습니까? (이미 발행된 쿠폰이 비활성화됩니다)')) return;
    const res = await fetch('/api/coupons?id=' + id, { method: 'DELETE' });
    if ((await res.json()).success) fetchData();
  };

  const formatDiscount = (type: string, value: number) => {
    return type === 'percent' ? `${value}% 할인` : `${value.toLocaleString()}원 할인`;
  };

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center">
        <Ticket className="w-8 h-8 mr-3 text-red-500" /> 
        쿠폰 관리 AI
      </h1>
      
      {/* 새 쿠폰 발행 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-700">새 쿠폰 발행</h2>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              type="button"
              onClick={() => setIssueType('single')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${issueType === 'single' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              단건 지정 발행
            </button>
            <button 
              type="button"
              onClick={() => setIssueType('bulk')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${issueType === 'bulk' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
            >
              대량 난수 발행
            </button>
          </div>
        </div>
        
        <form onSubmit={addData} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {issueType === 'single' ? (
              <div className="flex-[1]">
                <label className="block text-xs font-bold text-slate-500 mb-1">쿠폰 코드 (영문/숫자)</label>
                <input 
                  type="text" 
                  placeholder="예: WELCOME2026" 
                  value={form.code} 
                  onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} 
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500 font-mono uppercase" 
                />
              </div>
            ) : (
              <div className="flex-[1] flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">접두사 (선택)</label>
                  <input 
                    type="text" 
                    placeholder="예: SUM" 
                    value={form.prefix} 
                    onChange={e => setForm({...form, prefix: e.target.value.toUpperCase()})} 
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500 font-mono uppercase" 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">발행 수량 (개)</label>
                  <input 
                    type="number" 
                    placeholder="100" 
                    value={form.count} 
                    onChange={e => setForm({...form, count: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500" 
                  />
                </div>
              </div>
            )}
            <div className="flex-[2]">
              <label className="block text-xs font-bold text-slate-500 mb-1">고객에게 보일 쿠폰명</label>
              <input 
                type="text" 
                placeholder="예: 신규회원 가입 축하 5천원 쿠폰" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500" 
              />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-[1]">
              <label className="block text-xs font-bold text-slate-500 mb-1">할인 방식</label>
              <select 
                value={form.discount_type}
                onChange={e => setForm({...form, discount_type: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="amount">정액 할인 (원)</option>
                <option value="percent">정률 할인 (%)</option>
              </select>
            </div>
            <div className="flex-[1]">
              <label className="block text-xs font-bold text-slate-500 mb-1">할인 값</label>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder={form.discount_type === 'percent' ? '예: 10' : '예: 5000'} 
                  value={form.discount_value} 
                  onChange={e => setForm({...form, discount_value: e.target.value})} 
                  className="w-full border rounded-lg pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-red-500" 
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {form.discount_type === 'percent' ? <Percent className="w-4 h-4"/> : <DollarSign className="w-4 h-4"/>}
                </div>
              </div>
            </div>
            <div className="flex-[1]">
              <label className="block text-xs font-bold text-slate-500 mb-1">최소 주문 금액 (0=제한없음)</label>
              <input 
                type="number" 
                placeholder="예: 30000" 
                value={form.min_order_amount} 
                onChange={e => setForm({...form, min_order_amount: e.target.value})} 
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500" 
              />
            </div>
            <div className="flex-[1]">
              <label className="block text-xs font-bold text-slate-500 mb-1">유효기간 (지정하지 않을 시 무제한)</label>
              <input 
                type="date" 
                value={form.expires_at} 
                onChange={e => setForm({...form, expires_at: e.target.value})} 
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500 text-slate-700 bg-white" 
              />
            </div>
          </div>
          
          {/* 쿠폰 적용 및 제한 대상 설정 (선택) */}
          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
              <span>🛡️ 쿠폰 적용 및 제한 대상 설정 (선택)</span>
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:w-1/4">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">적용 방식</label>
                <select 
                  value={currentRestriction.restriction_type}
                  onChange={e => setCurrentRestriction({...currentRestriction, restriction_type: e.target.value})}
                  className="w-full border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-red-500 bg-white font-semibold cursor-pointer text-slate-700"
                >
                  <option value="EXCLUDE">할인 대상에서 제외 (Blacklist)</option>
                  <option value="INCLUDE">할인 대상에만 허용 (Whitelist)</option>
                </select>
              </div>
              <div className="w-full sm:w-1/4">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">제한 종류</label>
                <select 
                  value={currentRestriction.target_type}
                  onChange={e => setCurrentRestriction({...currentRestriction, target_type: e.target.value})}
                  className="w-full border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-red-500 bg-white font-semibold cursor-pointer text-slate-700"
                >
                  <option value="PRODUCT">개별 상품 ID</option>
                  <option value="CATEGORY">상품 카테고리명</option>
                </select>
              </div>
              <div className="w-full sm:flex-1">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">대상 식별 값 (상품 ID 또는 카테고리명)</label>
                <input 
                  type="text"
                  placeholder={currentRestriction.target_type === 'PRODUCT' ? "예: prod-123" : "예: 테이블용"}
                  value={currentRestriction.target_value}
                  onChange={e => setCurrentRestriction({...currentRestriction, target_value: e.target.value})}
                  className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>
              <button 
                type="button"
                onClick={addRestriction}
                className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-2 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap h-8"
              >
                조건 추가
              </button>
            </div>
            
            {/* 추가된 제한 리스트 뱃지 */}
            {restrictions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {restrictions.map((res, index) => (
                  <span 
                    key={index} 
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                      res.restriction_type === 'EXCLUDE' 
                        ? 'bg-red-50 text-red-700 border-red-100' 
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}
                  >
                    <span>{res.restriction_type === 'EXCLUDE' ? '제외' : '허용'}</span>
                    <span className="opacity-40">|</span>
                    <span>{res.target_type === 'PRODUCT' ? '상품ID' : '카테고리'}: {res.target_value}</span>
                    <button 
                      type="button" 
                      onClick={() => removeRestriction(index)}
                      className="ml-1 text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition flex items-center justify-center mt-2 disabled:bg-slate-400">
            <Plus className="w-4 h-4 mr-1"/> {loading ? '발행 중...' : '쿠폰 발행하기'}
          </button>
        </form>
      </div>

      {/* 발행된 쿠폰 목록 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-slate-800 shrink-0">발행된 쿠폰 목록 ({filteredData.length}건)</h2>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="쿠폰 코드, 쿠폰명 검색"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full focus:ring-2 focus:ring-red-500 outline-none text-xs bg-white font-semibold"
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm">
              <th className="p-4 font-semibold text-slate-600">상태</th>
              <th className="p-4 font-semibold text-slate-600">쿠폰 코드</th>
              <th className="p-4 font-semibold text-slate-600">쿠폰명</th>
              <th className="p-4 font-semibold text-slate-600">혜택 내역</th>
              <th className="p-4 font-semibold text-slate-600">최소주문금액</th>
              <th className="p-4 font-semibold text-slate-600">유효기간</th>
              <th className="p-4 font-semibold text-slate-600">제한 조건</th>
              <th className="p-4 font-semibold text-slate-600">발행일시</th>
              <th className="p-4 font-semibold text-slate-600 text-center w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  {data.length === 0 ? "발행된 쿠폰이 없습니다." : "검색 결과와 일치하는 쿠폰이 없습니다."}
                </td>
              </tr>
            ) : (
              (() => {
                const todayStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
                return paginatedData.map(t => {
                  const isExpired = t.expires_at && todayStr > t.expires_at;
                  const isInactive = isExpired || t.status !== 'active';

                  return (
                    <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${isInactive ? 'opacity-60 bg-slate-50/50' : ''}`}>
                      <td className="p-4">
                        {isExpired ? (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                            만료됨
                          </span>
                        ) : t.status === 'active' ? (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">
                            사용가능
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-500">
                            종료됨
                          </span>
                        )}
                      </td>
                      <td className={`p-4 font-mono font-bold text-slate-700 ${isInactive ? 'line-through text-slate-400' : ''}`}>{t.code}</td>
                      <td className={`p-4 font-medium text-slate-800 ${isInactive ? 'line-through text-slate-400' : ''}`}>{t.name}</td>
                      <td className={`p-4 text-red-600 font-bold whitespace-nowrap ${isInactive ? 'text-slate-400 line-through' : ''}`}>
                        {formatDiscount(t.discount_type, Number(t.discount_value))}
                      </td>
                      <td className="p-4 text-slate-500 text-sm">
                        {Number(t.min_order_amount) > 0 ? `${Number(t.min_order_amount).toLocaleString()}원 이상` : '제한없음'}
                      </td>
                      <td className="p-4 text-slate-500 text-sm">
                        {t.expires_at ? (
                          <span className={isExpired ? 'text-red-500 font-semibold' : ''}>
                            {t.expires_at}
                          </span>
                        ) : '무제한'}
                      </td>
                      <td className="p-4 text-slate-500 text-xs">
                        {t.restrictions && t.restrictions.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {t.restrictions.map((r: any, idx: number) => (
                              <span 
                                key={idx}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  r.restriction_type === 'EXCLUDE'
                                    ? 'bg-red-50 text-red-650 border border-red-100'
                                    : 'bg-indigo-50 text-indigo-650 border border-indigo-100'
                                }`}
                              >
                                {r.restriction_type === 'EXCLUDE' ? '제외' : '허용'}:{r.target_type === 'PRODUCT' ? '상품' : '카테고리'}({r.target_value})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">제한없음</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 text-sm">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => deleteData(t.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </td>
                    </tr>
                  );
                });
              })()
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 하단 컨트롤바 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-4 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">페이지당 표시:</span>
          <select 
            value={itemsPerPage} 
            onChange={e => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }} 
            className="border rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 focus:border-red-500"
          >
            <option value={10}>10개씩 보기</option>
            <option value={20}>20개씩 보기</option>
            <option value={50}>50개씩 보기</option>
            <option value={100}>100개씩 보기</option>
          </select>
          <span className="text-xs text-slate-400 font-semibold ml-2">
            {filteredData.length === 0 
              ? "전체 0건 표시" 
              : `전체 ${filteredData.length}건 중 ${startIndex + 1}-${Math.min(endIndex, filteredData.length)}건 표시`}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            disabled={currentPage === 1 || totalPages <= 1} 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-650 cursor-pointer disabled:cursor-not-allowed transition-all"
          >
            이전
          </button>
          {totalPages <= 1 ? (
            <button 
              disabled 
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white shadow-sm disabled:opacity-50 cursor-not-allowed"
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
                    ? 'bg-red-500 text-white shadow-sm' 
                    : 'border bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                {page}
              </button>
            ))
          )}
          <button 
            disabled={currentPage === totalPages || totalPages <= 1} 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-650 cursor-pointer disabled:cursor-not-allowed transition-all"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
