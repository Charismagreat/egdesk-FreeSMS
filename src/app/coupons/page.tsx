"use client";
import { useState, useEffect } from "react";
import { Ticket, Plus, Trash2, Percent, DollarSign } from "lucide-react";

export default function CouponsPage() {
  const [data, setData] = useState<any[]>([]);
  const [form, setForm] = useState({ 
    code: '', 
    name: '', 
    discount_type: 'amount', 
    discount_value: '', 
    min_order_amount: '' 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    const res = await fetch('/api/coupons');
    const json = await res.json();
    if (json.success) setData(json.coupons);
  };

  const addData = async (e: any) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.discount_value) {
      return alert('쿠폰 코드, 쿠폰명, 할인값은 필수입니다.');
    }
    
    setLoading(true);
    const res = await fetch('/api/coupons', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form) 
    });
    
    const json = await res.json();
    if (json.success) { 
      setForm({ code: '', name: '', discount_type: 'amount', discount_value: '', min_order_amount: '' }); 
      fetchData(); 
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
        할인 쿠폰 관리
      </h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold mb-4 text-slate-700">새 쿠폰 발행</h2>
        <form onSubmit={addData} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
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
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition flex items-center justify-center mt-2 disabled:bg-slate-400">
            <Plus className="w-4 h-4 mr-1"/> {loading ? '발행 중...' : '쿠폰 발행하기'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm">
              <th className="p-4 font-semibold text-slate-600">상태</th>
              <th className="p-4 font-semibold text-slate-600">쿠폰 코드</th>
              <th className="p-4 font-semibold text-slate-600">쿠폰명</th>
              <th className="p-4 font-semibold text-slate-600">혜택 내역</th>
              <th className="p-4 font-semibold text-slate-600">최소주문금액</th>
              <th className="p-4 font-semibold text-slate-600">발행일시</th>
              <th className="p-4 font-semibold text-slate-600 text-center w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">발행된 쿠폰이 없습니다.</td>
              </tr>
            ) : (
              data.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {t.status === 'active' ? '사용가능' : '종료됨'}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-700">{t.code}</td>
                  <td className="p-4 font-medium text-slate-800">{t.name}</td>
                  <td className="p-4 text-red-600 font-bold whitespace-nowrap">
                    {formatDiscount(t.discount_type, Number(t.discount_value))}
                  </td>
                  <td className="p-4 text-slate-500 text-sm">
                    {Number(t.min_order_amount) > 0 ? `${Number(t.min_order_amount).toLocaleString()}원 이상` : '제한없음'}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
