"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, ArrowRight } from "lucide-react";

export default function TableOrderEntryPage() {
  const [tableNumber, setTableNumber] = useState("");
  const router = useRouter();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) return alert("테이블 번호를 입력해주세요.");
    router.push(`/table-order/${tableNumber}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <UtensilsCrossed className="w-10 h-10 text-orange-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">테이블 오더</h1>
        <p className="text-slate-500 mb-8 font-medium">현재 앉아계신 테이블 번호를 입력해주세요.</p>
        
        <form onSubmit={handleStart}>
          <div className="mb-6 relative">
            <input 
              type="number" 
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full text-center text-4xl font-black py-4 border-b-2 border-slate-200 outline-none focus:border-orange-500 transition-colors"
              placeholder="0"
              min="1"
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">번</span>
          </div>

          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg py-4 rounded-2xl transition-all flex items-center justify-center group shadow-lg shadow-orange-600/30">
            메뉴 보기 
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
