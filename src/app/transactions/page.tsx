"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Send, Plus, Trash2 } from "lucide-react";

interface Transaction {
  id: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  amount: string;
  orderDate: string;
  status: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // New Transaction States
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newAmount, setNewAmount] = useState("");
  
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const json = await res.json();
      if (json.success) {
        setTransactions(json.transactions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone || !newProduct) {
      alert("이름, 연락처, 상품명은 필수입니다.");
      return;
    }
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newName,
          customerPhone: newPhone,
          productName: newProduct,
          amount: newAmount,
          orderDate: new Date().toISOString().split('T')[0],
          status: '결제완료'
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewName("");
        setNewPhone("");
        setNewProduct("");
        setNewAmount("");
        fetchTransactions();
      } else {
        alert("등록 실패: " + json.error);
      }
    } catch (e) {
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setTransactions(transactions.filter(t => t.id !== id));
        const newSet = new Set(selectedIds);
        newSet.delete(id);
        setSelectedIds(newSet);
      }
    } catch (e) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(transactions.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const sendOrderSms = async () => {
    if (selectedIds.size === 0) {
      alert("발송할 거래내역을 선택해주세요.");
      return;
    }

    const selectedTransactions = transactions.filter(t => selectedIds.has(t.id));
    setIsSending(true);

    for (let i = 0; i < selectedTransactions.length; i++) {
      const t = selectedTransactions[i];
      // 3번 방식: 거래내역 자체를 기준으로 감사 문자 템플릿 발송
      const message = `[EGDesk] ${t.customerName}님, 주문하신 [${t.productName}]의 결제가 완료되었습니다. 감사합니다!`;
      
      try {
        await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: t.customerPhone,
            message: message,
            customerId: null
          })
        });
      } catch (e) {
        console.error("발송 실패", t.customerName);
      }

      if (i < selectedTransactions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    setIsSending(false);
    alert("선택된 고객에게 주문 감사 문자가 발송되었습니다.");
  };

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center">
        <ShoppingCart className="w-8 h-8 mr-3 text-orange-500" />
        거래내역 관리
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4">새 거래 등록</h2>
        <form onSubmit={addTransaction} className="flex space-x-3">
          <input type="text" placeholder="고객명" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 outline-none focus:border-orange-500" />
          <input type="text" placeholder="연락처 (010...)" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 outline-none focus:border-orange-500" />
          <input type="text" placeholder="상품명" value={newProduct} onChange={e => setNewProduct(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 outline-none focus:border-orange-500" />
          <input type="text" placeholder="금액" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="w-32 border rounded-lg px-3 py-2 outline-none focus:border-orange-500" />
          <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 flex items-center">
            <Plus className="w-4 h-4 mr-1" /> 등록
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">거래 목록 ({transactions.length}건)</h2>
          <button 
            onClick={sendOrderSms}
            disabled={isSending}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center text-white ${isSending ? 'bg-slate-400' : 'bg-orange-600 hover:bg-orange-700'}`}
          >
            <Send className="w-4 h-4 mr-2" />
            {isSending ? '발송 중...' : '선택 주문 자동 안내문자 발송'}
          </button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-sm text-slate-500 bg-slate-50">
              <th className="p-4 w-12 text-center">
                <input type="checkbox" onChange={toggleSelectAll} checked={transactions.length > 0 && selectedIds.size === transactions.length} className="rounded" />
              </th>
              <th className="p-4">주문일자</th>
              <th className="p-4">고객명</th>
              <th className="p-4">연락처</th>
              <th className="p-4">주문상품</th>
              <th className="p-4 text-right">결제금액</th>
              <th className="p-4">관리</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-4 text-center">
                  <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} className="rounded" />
                </td>
                <td className="p-4 text-sm">{t.orderDate}</td>
                <td className="p-4 font-medium text-slate-800">{t.customerName}</td>
                <td className="p-4 text-slate-600">{t.customerPhone}</td>
                <td className="p-4 text-slate-800">{t.productName}</td>
                <td className="p-4 text-slate-600 text-right">{t.amount ? Number(String(t.amount).replace(/[^0-9]/g, '')).toLocaleString() : '-'}</td>
                <td className="p-4">
                  <button onClick={() => deleteTransaction(t.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  등록된 거래 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
