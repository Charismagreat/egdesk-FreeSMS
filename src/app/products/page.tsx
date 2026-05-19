"use client";
import { useState, useEffect } from "react";
import { PackageSearch, Plus, Trash2, ExternalLink } from "lucide-react";

export default function ProductsPage() {
  const [data, setData] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', price: '', url: '', description: '', main_image_url: '', detail_image_url: '', category: '식사류', isPriceTbd: false, available_methods: ['매장에서', '가져가기', '배달', '배송'] });

  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    const res = await fetch('/api/products');
    const json = await res.json();
    if (json.success) setData(json.products);
  };

  const addData = async (e: any) => {
    e.preventDefault();
    if (!form.name) return alert('상품명은 필수입니다.');
    
    const res = await fetch('/api/products', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price: form.isPriceTbd ? '상담후결정' : form.price,
        available_methods: form.available_methods.join(',')
      }) 
    });
    
    const json = await res.json();
    if (json.success) { 
      setForm({ name: '', price: '', url: '', description: '', main_image_url: '', detail_image_url: '', category: '식사류', isPriceTbd: false, available_methods: ['매장에서', '가져가기', '배달', '배송'] }); 
      fetchData(); 
    } else {
      alert("등록 실패: " + json.error);
    }
  };

  const deleteData = async (id: string) => {
    if(!confirm('정말 삭제하시겠습니까?')) return;
    const res = await fetch('/api/products?id=' + id, { method: 'DELETE' });
    if ((await res.json()).success) fetchData();
  };

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center">
        <PackageSearch className="w-8 h-8 mr-3 text-pink-500" /> 
        쇼핑몰 연동 상품 DB
      </h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold mb-4 text-slate-700">새 상품 등록</h2>
        <form onSubmit={addData} className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              placeholder="상품명 (예: 24년형 스마트 TV)" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              className="flex-[2] border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500" 
            />
            <div className="flex-[1] flex items-center gap-2 border rounded-lg px-3 py-2">
              <input 
                type="text" 
                placeholder="가격 (예: 850,000원)" 
                value={form.price} 
                onChange={e => setForm({...form, price: e.target.value})} 
                disabled={form.isPriceTbd}
                className="w-full outline-none disabled:bg-slate-50 disabled:text-slate-400" 
              />
              <label className="flex items-center space-x-1 whitespace-nowrap text-xs text-slate-600 font-medium cursor-pointer">
                <input type="checkbox" checked={form.isPriceTbd} onChange={e => setForm({...form, isPriceTbd: e.target.checked, price: e.target.checked ? '' : form.price})} className="rounded text-pink-500 focus:ring-pink-500" />
                <span>상담후결정</span>
              </label>
            </div>
            <input 
              type="text" 
              placeholder="쇼핑몰 URL (선택)" 
              value={form.url} 
              onChange={e => setForm({...form, url: e.target.value})} 
              className="flex-[2] border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500" 
            />
            <select 
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
              className="flex-[1] border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500 bg-white"
            >
              <option value="일반상품">일반상품</option>
              <option value="식사류">식사류</option>
              <option value="안주류">안주류</option>
              <option value="주류">주류</option>
              <option value="음료">음료</option>
              <option value="예약상품">예약상품</option>
            </select>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              placeholder="상세 설명 문구 (간략히)" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
              className="flex-[2] border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500" 
            />
            <input 
              type="text" 
              placeholder="대표 이미지 URL" 
              value={form.main_image_url} 
              onChange={e => setForm({...form, main_image_url: e.target.value})} 
              className="flex-[1] border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500 text-sm" 
            />
            <input 
              type="text" 
              placeholder="상세 이미지 URL" 
              value={form.detail_image_url} 
              onChange={e => setForm({...form, detail_image_url: e.target.value})} 
              className="flex-[1] border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500 text-sm" 
            />
          </div>
          
          <div className="flex items-center gap-4 py-2">
            <span className="text-sm font-bold text-slate-700">허용 수령 방식:</span>
            {['매장에서', '가져가기', '배달', '배송'].map(method => (
              <label key={method} className="flex items-center space-x-1 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.available_methods.includes(method)}
                  onChange={(e) => {
                    const newMethods = e.target.checked 
                      ? [...form.available_methods, method] 
                      : form.available_methods.filter(m => m !== method);
                    setForm({...form, available_methods: newMethods});
                  }}
                  className="rounded text-pink-500 focus:ring-pink-500"
                />
                <span className="text-sm text-slate-600">{method}</span>
              </label>
            ))}
          </div>

          <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition flex items-center justify-center">
            <Plus className="w-4 h-4 mr-1"/> 등록
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm">
              <th className="p-4 font-semibold text-slate-600">대표 이미지</th>
              <th className="p-4 font-semibold text-slate-600">분류</th>
              <th className="p-4 font-semibold text-slate-600 w-[20%]">상품정보</th>
              <th className="p-4 font-semibold text-slate-600 text-right">가격</th>
              <th className="p-4 font-semibold text-slate-600">상세 설명 문구</th>
              <th className="p-4 font-semibold text-slate-600">상세설명 이미지</th>
              <th className="p-4 font-semibold text-slate-600">쇼핑몰 링크</th>
              <th className="p-4 font-semibold text-slate-600 text-center w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">등록된 상품이 없습니다.</td>
              </tr>
            ) : (
              data.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    {t.main_image_url ? (
                      <img src={t.main_image_url} alt={t.name} className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">No Img</div>
                    )}
                  </td>
                  <td className="p-4 text-sm font-semibold text-blue-600 bg-blue-50/50 rounded-lg text-center">{t.category || '일반상품'}</td>
                  <td className="p-4 font-medium text-slate-800">{t.name}</td>
                  <td className="p-4 text-pink-600 font-semibold whitespace-nowrap text-right">{t.price ? Number(String(t.price).replace(/[^0-9]/g, '')).toLocaleString() : '-'}</td>
                  <td className="p-4 text-slate-500 text-xs">
                    <p className="truncate max-w-[150px]" title={t.description}>{t.description || '-'}</p>
                  </td>
                  <td className="p-4 text-slate-500 text-xs">
                    {t.detail_image_url ? (
                      <a href={t.detail_image_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center">
                        <ExternalLink className="w-3 h-3 mr-1 shrink-0" /> 보기
                      </a>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-slate-500 text-sm max-w-[150px] truncate">
                    {t.url ? (
                      <a href={t.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center">
                        {t.url} <ExternalLink className="w-3 h-3 ml-1 shrink-0" />
                      </a>
                    ) : (
                      '-'
                    )}
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
