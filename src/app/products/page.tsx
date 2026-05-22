"use client";
import { useState, useEffect } from "react";
import { PackageSearch, Plus, Trash2, ExternalLink, Pencil, X } from "lucide-react";

export default function ProductsPage() {
  const [data, setData] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', price: '', url: '', description: '', main_image_url: '', detail_image_url: '', category: '스토어용', menu_category: '', isPriceTbd: false, available_methods: ['매장에서', '가져가기', '배달', '배송'] });
  const [editTargetId, setEditTargetId] = useState<string|null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hoverImage, setHoverImage] = useState<{url: string, x: number, y: number} | null>(null);

  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    const res = await fetch('/api/products');
    const json = await res.json();
    if (json.success) setData(json.products);
  };

  const addData = async (e: any) => {
    e.preventDefault();
    if (!form.name) return alert('상품명은 필수입니다.');
    
    const isEditing = !!editTargetId;
    const res = await fetch('/api/products', { 
      method: isEditing ? 'PUT' : 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editTargetId,
        ...form,
        price: form.isPriceTbd ? '상담후결정' : form.price,
        available_methods: form.available_methods.join(',')
      }) 
    });
    
    const json = await res.json();
    if (json.success) { 
      setForm({ name: '', price: '', url: '', description: '', main_image_url: '', detail_image_url: '', category: '스토어용', menu_category: '', isPriceTbd: false, available_methods: ['매장에서', '가져가기', '배달', '배송'] }); 
      setEditTargetId(null);
      fetchData(); 
    } else {
      alert("저장 실패: " + json.error);
    }
  };

  const handleEditClick = (product: any) => {
    const isPriceTbd = product.price === '상담후결정';
    setForm({
      name: product.name || '',
      price: isPriceTbd ? '' : (product.price || ''),
      url: product.url || '',
      description: product.description || '',
      main_image_url: product.main_image_url || '',
      detail_image_url: product.detail_image_url || '',
      category: product.category || '스토어용',
      menu_category: product.menu_category || '',
      isPriceTbd,
      available_methods: product.available_methods ? product.available_methods.split(',') : ['매장에서', '가져가기', '배달', '배송']
    });
    setEditTargetId(product.id);
  };

  const cancelEdit = () => {
    setForm({ name: '', price: '', url: '', description: '', main_image_url: '', detail_image_url: '', category: '스토어용', menu_category: '', isPriceTbd: false, available_methods: ['매장에서', '가져가기', '배달', '배송'] });
    setEditTargetId(null);
  };

  const deleteData = async (id: string) => {
    if(!confirm('정말 삭제하시겠습니까?')) return;
    const res = await fetch('/api/products?id=' + id, { method: 'DELETE' });
    if ((await res.json()).success) fetchData();
  };
  const existingCategories = Array.from(new Set(data.map(p => p.menu_category).filter(Boolean)));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'main_image_url' | 'detail_image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setForm({ ...form, [field]: json.url });
      } else {
        alert('업로드 실패: ' + json.error);
      }
    } catch (err) {
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 프리미엄 글래스모피즘 스티키 헤더 (타이틀 + 등록 폼의 유기적 통합) */}
      <div className="sticky top-0 z-20 pt-6 pb-5 -mt-8 -mx-8 px-8 bg-slate-50/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm transition-all duration-300">
        
        {/* 사이드바 메뉴명과 100% 매칭되는 프리미엄 타이틀 영역 */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold flex items-center bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 bg-clip-text text-transparent">
            <PackageSearch className="w-7 h-7 mr-2.5 text-blue-600 drop-shadow-[0_2px_8px_rgba(37,99,235,0.2)] animate-pulse" /> 
            상품 DB 관리
          </h1>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase">EGDESK Product Hub</span>
          </div>
        </div>

        {/* 새 상품 등록 / 수정 글래스 폼 카드 */}
        <div className={`bg-white/90 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border backdrop-blur-sm transition-all duration-300 ${editTargetId ? 'border-blue-400 ring-4 ring-blue-500/5 shadow-blue-500/5' : 'border-slate-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className={`w-1.5 h-3.5 rounded ${editTargetId ? 'bg-blue-500' : 'bg-slate-700'}`}></span>
              {editTargetId ? '상품 정보 수정' : '새 상품 등록'}
            </h2>
            {editTargetId && (
              <button onClick={cancelEdit} className="text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 flex items-center bg-slate-100 px-2.5 py-1 rounded-lg transition-all">
                <X className="w-3.5 h-3.5 mr-1"/> 변경 취소
              </button>
            )}
          </div>
          
          <form onSubmit={addData} className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <input 
                type="text" 
                placeholder="상품명 (예: 24년형 스마트 TV)" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                className="flex-[2] border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium" 
              />
              <div className="flex-[1] flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <input 
                  type="text" 
                  placeholder="가격 (예: 850,000원)" 
                  value={form.price} 
                  onChange={e => setForm({...form, price: e.target.value})} 
                  disabled={form.isPriceTbd}
                  className="w-full outline-none disabled:bg-slate-50 disabled:text-slate-400 text-sm font-medium" 
                />
                <label className="flex items-center space-x-1 whitespace-nowrap text-xs text-slate-600 font-semibold cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.isPriceTbd} 
                    onChange={e => setForm({...form, isPriceTbd: e.target.checked, price: e.target.checked ? '' : form.price})} 
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 border-slate-300" 
                  />
                  <span>상담후결정</span>
                </label>
              </div>
              <select 
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-32 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-sm font-medium"
              >
                <option value="스토어용">스토어용</option>
                <option value="테이블용">테이블용</option>
                <option value="예약용">예약용</option>
              </select>
              <div className="flex-1">
                <input 
                  type="text" 
                  list="category-options"
                  placeholder="카테고리 (예: 가전)" 
                  value={form.menu_category} 
                  onChange={e => setForm({...form, menu_category: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium" 
                />
                <datalist id="category-options">
                  {existingCategories.map((cat, idx) => (
                    <option key={idx} value={cat as string} />
                  ))}
                </datalist>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <textarea 
                placeholder="상세 설명 문구를 입력하세요 (엔터를 치면 줄바꿈이 됩니다)" 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm min-h-[70px] max-h-[150px] resize-y font-medium" 
              />
            </div>
            
            <div className="flex flex-row gap-3 w-full">
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <input 
                  type="text" 
                  placeholder="쇼핑몰 URL (선택)" 
                  value={form.url} 
                  onChange={e => setForm({...form, url: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm min-h-[52px] font-medium" 
                />
              </div>
              <label className="flex-1 border border-slate-200 rounded-lg px-3 py-2 flex flex-col bg-white relative justify-center min-h-[52px] min-w-0 cursor-pointer hover:bg-slate-50 hover:border-slate-350 transition-colors group">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-slate-700">대표이미지 <span className="text-[9px] font-normal text-slate-400 ml-0.5 hidden 2xl:inline">(600x600)</span></span>
                  {form.main_image_url && <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded">등록완료</span>}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => handleFileUpload(e, 'main_image_url')}
                  className="w-full text-[11px] text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded-full file:border-0 file:font-bold file:bg-blue-50 file:text-blue-700 group-hover:file:bg-blue-100 cursor-pointer" 
                />
              </label>
              <label className="flex-1 border border-slate-200 rounded-lg px-3 py-2 flex flex-col bg-white relative justify-center min-h-[52px] min-w-0 cursor-pointer hover:bg-slate-50 hover:border-slate-350 transition-colors group">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-slate-700">상세이미지 <span className="text-[9px] font-normal text-slate-400 ml-0.5 hidden 2xl:inline">(가로 800px↑)</span></span>
                  {form.detail_image_url && <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded">등록완료</span>}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => handleFileUpload(e, 'detail_image_url')}
                  className="w-full text-[11px] text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded-full file:border-0 file:font-bold file:bg-blue-50 file:text-blue-700 group-hover:file:bg-blue-100 cursor-pointer" 
                />
              </label>
              <div className="flex-[1.2] border border-slate-200 rounded-lg px-3 py-1 flex flex-col bg-white justify-center min-h-[52px] min-w-0">
                <span className="text-xs font-bold text-slate-700 mb-0.5">수령 방식</span>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
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
                        className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3 border-slate-300"
                      />
                      <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isUploading} 
              className={`w-full text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center shadow-md active:scale-[0.99] ${
                isUploading 
                  ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                  : editTargetId 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-orange-500/10' 
                    : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 shadow-blue-500/10'
              }`}
            >
              {isUploading ? '이미지 업로드 진행 중...' : editTargetId ? <><Pencil className="w-4 h-4 mr-1"/> 상품 정보 수정 완료</> : <><Plus className="w-4 h-4 mr-1"/> 새로운 상품 등록</>}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm">
              <th className="p-4 font-semibold text-slate-600">ID</th>
              <th className="p-4 font-semibold text-slate-600">분류</th>
              <th className="p-4 font-semibold text-slate-600">카테고리</th>
              <th className="p-4 font-semibold text-slate-600 w-[20%]">상품정보</th>
              <th className="p-4 font-semibold text-slate-600 text-right">가격</th>
              <th className="p-4 font-semibold text-slate-600">상세 설명</th>
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
                  <td className="p-4 text-xs font-mono text-slate-400">{(t.id as string).slice(-6)}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg">{t.category || '스토어용'}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-medium">{t.menu_category || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      {t.main_image_url ? (
                        <img 
                          src={t.main_image_url} 
                          alt={t.name} 
                          className="w-10 h-10 object-cover rounded shadow-sm cursor-pointer" 
                          onMouseEnter={(e) => setHoverImage({url: t.main_image_url, x: e.clientX, y: e.clientY})}
                          onMouseMove={(e) => setHoverImage({url: t.main_image_url, x: e.clientX, y: e.clientY})}
                          onMouseLeave={() => setHoverImage(null)}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400">No Img</div>
                      )}
                      <div>
                        <div className="font-bold text-slate-800">{t.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex gap-1">
                          {t.available_methods ? t.available_methods.split(',').map((method: string, i: number) => (
                            <span key={i} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{method}</span>
                          )) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-blue-600 font-semibold whitespace-nowrap text-right">{t.price ? Number(String(t.price).replace(/[^0-9]/g, '')).toLocaleString() : '-'}</td>
                  <td className="p-4 text-slate-500 text-xs">
                    <p className="truncate max-w-[200px]" title={t.description}>{t.description || '-'}</p>
                    {t.url && <a href={t.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline mt-1 block">링크</a>}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button onClick={() => handleEditClick(t)} className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50" title="수정">
                        <Pencil className="w-4 h-4"/>
                      </button>
                      <button onClick={() => deleteData(t.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50" title="삭제">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Image Hover Preview Portal */}
      {hoverImage && (
        <div 
          className="fixed z-[100] pointer-events-none bg-white p-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200"
          style={{ 
            left: hoverImage.x + 20, 
            top: Math.max(20, hoverImage.y - 125), // Center vertically relative to cursor, keep in view
            width: '250px',
            height: '250px'
          }}
        >
          <img src={hoverImage.url} alt="Preview" className="w-full h-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}
