"use client";
import { useState, useEffect } from "react";
import { PackageSearch, Plus, Trash2, ExternalLink, Pencil, X, Search } from "lucide-react";

export default function ProductsPage() {
  const [data, setData] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', price: '', url: '', description: '', main_image_url: '', detail_image_url: '', category: '스토어용', menu_category: '', isPriceTbd: false, available_methods: ['매장에서', '가져가기', '배달', '배송'] });
  const [editTargetId, setEditTargetId] = useState<string|null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hoverImage, setHoverImage] = useState<{url: string, x: number, y: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 검색어 입력 시 페이지 번호 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    const res = await fetch('/api/products');
    const json = await res.json();
    if (json.success) setData(json.products);
  };

  const filteredData = data.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      (t.name && t.name.toLowerCase().includes(query)) ||
      (t.menu_category && t.menu_category.toLowerCase().includes(query)) ||
      (t.description && t.description.toLowerCase().includes(query))
    );
  });

  // 페이지네이션 슬라이싱 로직
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

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

  const toggleCouponExclude = async (productId: string, currentValue: number) => {
    const newValue = currentValue === 1 ? 0 : 1;
    
    // Optimistic UI update
    setData(prev => prev.map(p => p.id === productId ? { ...p, is_coupon_excludable: newValue } : p));
    
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, is_coupon_excludable: newValue })
      });
      const json = await res.json();
      if (!json.success) {
        alert('쿠폰 적용 여부 변경에 실패했습니다: ' + json.error);
        fetchData();
      }
    } catch (e) {
      alert('네트워크 오류가 발생했습니다.');
      fetchData();
    }
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
      <h1 className="text-3xl font-bold text-slate-800 flex items-center">
        <PackageSearch className="w-8 h-8 mr-3 text-blue-650" /> 
        상품 DB 관리
      </h1>
      
      <div className="pt-2 pb-4">
        <div className={`bg-white p-6 rounded-2xl shadow-md border ${editTargetId ? 'border-blue-300 ring-4 ring-blue-50' : 'border-slate-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-700">{editTargetId ? '상품 수정' : '새 상품 등록'}</h2>
            {editTargetId && (
              <button onClick={cancelEdit} className="text-sm text-slate-500 hover:text-slate-800 flex items-center bg-slate-100 px-3 py-1 rounded-lg">
                <X className="w-4 h-4 mr-1"/> 취소
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
                className="flex-[2] border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500" 
                required
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
              <select 
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-32 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500 bg-white"
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
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500" 
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
                className="w-full border rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-pink-500 min-h-[100px] resize-y" 
              />
            </div>
            <div className="flex flex-col md:flex-row gap-3 w-full">
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <input 
                  type="text" 
                  placeholder="쇼핑몰 URL (선택)" 
                  value={form.url} 
                  onChange={e => setForm({...form, url: e.target.value})} 
                  className="w-full h-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500 min-h-[58px]" 
                />
              </div>
              <label className="flex-1 border rounded-lg px-3 py-2 flex flex-col bg-white relative justify-center min-h-[58px] min-w-0 cursor-pointer hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700">대표이미지 <span className="text-[10px] font-normal text-slate-400 ml-0.5 hidden 2xl:inline">(600x600)</span></span>
                  {form.main_image_url && <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">등록됨</span>}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => handleFileUpload(e, 'main_image_url')}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:font-semibold file:bg-pink-50 file:text-pink-700 group-hover:file:bg-pink-100 cursor-pointer" 
                />
              </label>
              <label className="flex-1 border rounded-lg px-3 py-2 flex flex-col bg-white relative justify-center min-h-[58px] min-w-0 cursor-pointer hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700">상세이미지 <span className="text-[10px] font-normal text-slate-400 ml-0.5 hidden 2xl:inline">(가로 800px↑)</span></span>
                  {form.detail_image_url && <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">등록됨</span>}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => handleFileUpload(e, 'detail_image_url')}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 group-hover:file:bg-blue-100 cursor-pointer" 
                />
              </label>
              <div className="flex-[1.2] border rounded-lg px-3 py-2 flex flex-col bg-white justify-center min-h-[58px] min-w-0">
                <span className="text-sm font-semibold text-slate-700 mb-1">수령 방식</span>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
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
                        className="rounded text-pink-500 focus:ring-pink-500 w-3 h-3"
                      />
                      <span className="text-xs text-slate-600 whitespace-nowrap">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" disabled={isUploading} className={`w-full text-white font-bold py-3 rounded-lg transition flex items-center justify-center ${isUploading ? 'bg-slate-400 cursor-not-allowed' : editTargetId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-slate-700'}`}>
              {isUploading ? '이미지 업로드 중...' : editTargetId ? <><Pencil className="w-4 h-4 mr-1"/> 수정 완료</> : <><Plus className="w-4 h-4 mr-1"/> 등록</>}
            </button>
          </form>
        </div>
      </div>

      {/* 등록된 상품 목록 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-slate-800 shrink-0">등록된 상품 목록 ({filteredData.length}건)</h2>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="상품명, 카테고리, 상세 설명 검색"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-white font-semibold"
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm">
              <th className="p-4 font-semibold text-slate-600">ID</th>
              <th className="p-4 font-semibold text-slate-600">분류</th>
              <th className="p-4 font-semibold text-slate-600">카테고리</th>
              <th className="p-4 font-semibold text-slate-600 w-[20%]">상품정보</th>
              <th className="p-4 font-semibold text-slate-600 text-right">가격</th>
              <th className="p-4 font-semibold text-slate-600">쿠폰 적용</th>
              <th className="p-4 font-semibold text-slate-600">상세 설명</th>
              <th className="p-4 font-semibold text-slate-600 text-center w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  {data.length === 0 ? "등록된 상품이 없습니다." : "검색 결과와 일치하는 상품이 없습니다."}
                </td>
              </tr>
            ) : (
              paginatedData.map(t => (
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
                  <td className="p-4 text-pink-600 font-semibold whitespace-nowrap text-right">{t.price ? Number(String(t.price).replace(/[^0-9]/g, '')).toLocaleString() : '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        type="button"
                        onClick={() => toggleCouponExclude(t.id, t.is_coupon_excludable || 0)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                          (t.is_coupon_excludable || 0) === 1 ? 'bg-slate-200' : 'bg-green-500 shadow-sm shadow-green-500/20'
                        }`}
                      >
                        <span className="sr-only">쿠폰 허용 토글</span>
                        <span 
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            (t.is_coupon_excludable || 0) === 1 ? 'translate-x-0' : 'translate-x-4'
                          }`}
                        />
                      </button>
                      <span className={`text-xs font-bold ${
                        (t.is_coupon_excludable || 0) === 1 ? 'text-slate-450' : 'text-green-600'
                      }`}>
                        {(t.is_coupon_excludable || 0) === 1 ? '제외' : '허용'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 text-xs">
                    <p className="truncate max-w-[200px]" title={t.description}>{t.description || '-'}</p>
                    {t.url && <a href={t.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline mt-1 block">링크</a>}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button onClick={() => handleEditClick(t)} className="text-slate-400 hover:text-pink-600 transition-colors p-2 rounded-lg hover:bg-pink-50" title="수정">
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
            className="border rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 focus:border-blue-650"
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
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-650 text-white shadow-sm disabled:opacity-50 cursor-not-allowed"
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
                    ? 'bg-blue-650 text-white shadow-sm' 
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
            className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all"
          >
            다음
          </button>
        </div>
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
