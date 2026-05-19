"use client";
import { useState, useEffect } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";

export default function PaymentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [form, setForm] = useState({ customerName: '', amount: '', paymentMethod: '카드결제' });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    const res = await fetch('/api/payments');
    const json = await res.json();
    if (json.success) setData(json.payments);
  };
  const addData = async (e: any) => {
    e.preventDefault();
    if (!form.customerName || !form.amount) return alert('필수 입력 누락');
    const res = await fetch('/api/payments', { method: 'POST', body: JSON.stringify(form) });
    if ((await res.json()).success) { setForm({customerName:'',amount:'',paymentMethod:'카드결제'}); fetchData(); }
  };
  const deleteData = async (id: string) => {
    if(!confirm('삭제하시겠습니까?')) return;
    const res = await fetch('/api/payments?id=' + id, { method: 'DELETE' });
    if ((await res.json()).success) fetchData();
  };

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center"><CreditCard className="w-8 h-8 mr-3 text-emerald-500" /> 결제내역 관리</h1>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold mb-4">새 결제 등록</h2>
        <form onSubmit={addData} className="flex space-x-3">
          <input type="text" placeholder="고객명" value={form.customerName} onChange={e=>setForm({...form, customerName: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 outline-none" />
          <select value={form.paymentMethod} onChange={e=>setForm({...form, paymentMethod: e.target.value})} className="border rounded-lg px-3 py-2 outline-none">
            <option>카드결제</option><option>무통장입금</option><option>현금</option>
          </select>
          <input type="text" placeholder="결제금액 (예: 50,000원)" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 outline-none" />
          <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 flex items-center"><Plus className="w-4 h-4 mr-1"/> 등록</button>
        </form>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 border-b border-slate-100 text-sm"><th className="p-4">결제일시</th><th className="p-4">고객명</th><th className="p-4">결제수단</th><th className="p-4 text-right">결제금액</th><th className="p-4">상태</th><th className="p-4">관리</th></tr></thead>
          <tbody>
            {data.map(t => (
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="p-4">{t.payment_date}</td><td className="p-4">{t.customer_name}</td><td className="p-4">{t.payment_method}</td><td className="p-4 font-bold text-emerald-600 text-right">{t.amount ? Number(String(t.amount).replace(/[^0-9]/g, '')).toLocaleString() : '-'}</td><td className="p-4">{t.status}</td>
                <td className="p-4"><button onClick={()=>deleteData(t.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
