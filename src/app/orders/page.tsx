"use client";
import { useState, useEffect } from "react";
import { ClipboardList, Plus, Trash2, Search, Truck, MapPin, DollarSign, Store, Send, Image as ImageIcon, X } from "lucide-react";

export default function OrdersPage() {
  const [data, setData] = useState<any[]>([]);
  const [form, setForm] = useState({ 
    customerName: '', 
    customerPhone: '', 
    productName: '', 
    quantity: '1',
    totalPrice: '',
    deliveryMethod: '택배배송',
    shippingAddress: '',
  });

  const [activeTab, setActiveTab] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);

  // For inline tracking number updates
  const [trackingEdits, setTrackingEdits] = useState<Record<string, string>>({});

  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const TABS = ['전체', '견적요청', '결제대기', '결제완료', '상품준비중', '배송시작', '배송중', '배송완료', '수령완료', '주문취소'];
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    const res = await fetch('/api/orders');
    const json = await res.json();
    if (json.success) setData(json.orders);
  };
  
  const addData = async (e: any) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.productName) return alert('필수 입력 누락');
    const res = await fetch('/api/orders', { method: 'POST', body: JSON.stringify(form) });
    if ((await res.json()).success) { 
      setForm({
        customerName: '', customerPhone: '', productName: '', quantity: '1', 
        totalPrice: '', deliveryMethod: '택배배송', shippingAddress: ''
      }); 
      fetchData(); 
    }
  };
  
  const deleteData = async (id: string) => {
    if(!confirm('삭제하시겠습니까?')) return;
    const res = await fetch('/api/orders?id=' + id, { method: 'DELETE' });
    if ((await res.json()).success) fetchData();
  };

  const updateOrder = async (id: string, updates: any) => {
    setIsUpdating(true);
    const res = await fetch('/api/orders', { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id], updates })
    });
    if ((await res.json()).success) fetchData();
    setIsUpdating(false);
  };

  const bulkUpdateStatus = async (status: string) => {
    if(selectedIds.size === 0) return alert('선택된 주문이 없습니다.');
    if(!confirm(`선택한 ${selectedIds.size}건의 상태를 '${status}'(으)로 변경하시겠습니까?`)) return;
    
    setIsUpdating(true);
    const res = await fetch('/api/orders', { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds), updates: { status } })
    });
    if ((await res.json()).success) {
      setSelectedIds(new Set());
      fetchData();
    }
    setIsUpdating(false);
  };

  const saveTrackingNumber = (id: string) => {
    const tracking = trackingEdits[id];
    if (tracking !== undefined) {
      updateOrder(id, { tracking_number: tracking });
    }
  };

  const filteredData = data.filter(t => {
    const matchesTab = activeTab === '전체' || t.status === activeTab;
    const matchesSearch = t.customer_name?.includes(searchQuery) || t.customer_phone?.includes(searchQuery) || t.product_name?.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredData.map(t => t.id)));
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

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center"><ClipboardList className="w-8 h-8 mr-3 text-blue-500" /> 주문내역 관리</h1>
      
      {/* New Order Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold mb-4">새 주문 등록</h2>
        <form onSubmit={addData} className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input type="text" placeholder="고객명" value={form.customerName} onChange={e=>setForm({...form, customerName: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 outline-none" required />
            <input type="text" placeholder="연락처 (010...)" value={form.customerPhone} onChange={e=>setForm({...form, customerPhone: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 outline-none" required />
            <input type="text" placeholder="상품명" value={form.productName} onChange={e=>setForm({...form, productName: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 outline-none" required />
            <input type="number" placeholder="수량" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} className="w-20 border rounded-lg px-3 py-2 outline-none text-right" />
            <input type="text" placeholder="결제금액 (예: 50000)" value={form.totalPrice} onChange={e=>setForm({...form, totalPrice: e.target.value})} className="w-32 border rounded-lg px-3 py-2 outline-none text-right" />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <select value={form.deliveryMethod} onChange={e=>setForm({...form, deliveryMethod: e.target.value})} className="border rounded-lg px-3 py-2 outline-none w-40 text-slate-700">
              <option value="택배배송">택배배송</option>
              <option value="자체배달">자체배달</option>
              <option value="방문픽업">방문픽업</option>
              <option value="현장판매">현장판매</option>
            </select>
            {(form.deliveryMethod === '택배배송' || form.deliveryMethod === '자체배달') && (
              <input type="text" placeholder="배송지 주소" value={form.shippingAddress} onChange={e=>setForm({...form, shippingAddress: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 outline-none" />
            )}
            <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center font-bold"><Plus className="w-4 h-4 mr-1"/> 등록하기</button>
          </div>
        </form>
      </div>

      {/* Management Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-100 text-blue-700 border-blue-200 border' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="고객명, 연락처, 상품 검색"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>
        
        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="p-3 bg-blue-50/50 border-b border-blue-100 flex items-center gap-3">
            <span className="text-sm font-medium text-blue-800 ml-2">{selectedIds.size}개 선택됨</span>
            <select 
              className="border border-blue-200 rounded-lg px-3 py-1.5 text-sm outline-none bg-white text-blue-800"
              onChange={(e) => {
                if(e.target.value) bulkUpdateStatus(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">일괄 상태 변경...</option>
              {TABS.filter(t => t !== '전체').map(t => (
                <option key={t} value={t}>{t} (으)로 변경</option>
              ))}
            </select>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-sm text-slate-600">
                <th className="p-4 w-12 text-center">
                  <input type="checkbox" onChange={toggleSelectAll} checked={filteredData.length > 0 && selectedIds.size === filteredData.length} className="rounded" />
                </th>
                <th className="p-4">주문일자</th>
                <th className="p-4">주문정보</th>
                <th className="p-4">수령방식/배송정보</th>
                <th className="p-4 text-right">수량</th>
                <th className="p-4 text-right">총 금액</th>
                <th className="p-4 w-32">상태</th>
                <th className="p-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(t => (
                <tr key={t.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${isUpdating ? 'opacity-50' : ''}`}>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} className="rounded" />
                  </td>
                  <td className="p-4 text-sm text-slate-500">{t.order_date}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800 flex items-center">
                      {t.product_name}
                      {t.attachment_url && (
                        <button onClick={() => setViewerUrl(t.attachment_url)} className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs hover:bg-blue-200 flex items-center shadow-sm">
                          <ImageIcon className="w-3 h-3 mr-1" /> 첨부 확인
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">{t.customer_name} <span className="text-slate-400">({t.customer_phone})</span></div>
                    {t.customer_memo && (
                      <div className="mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                        🗣️ {t.customer_memo}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      {t.delivery_method === '배송' && <Truck className="w-4 h-4 mr-1 text-blue-500"/>}
                      {t.delivery_method === '배달' && <Send className="w-4 h-4 mr-1 text-orange-500"/>}
                      {t.delivery_method === '가져가기' && <Package className="w-4 h-4 mr-1 text-green-500"/>}
                      {t.delivery_method === '매장에서' && <Store className="w-4 h-4 mr-1 text-purple-500"/>}
                      
                      {t.delivery_method === '택배배송' && <Truck className="w-4 h-4 mr-1 text-blue-500"/>}
                      {t.delivery_method === '자체배달' && <Send className="w-4 h-4 mr-1 text-orange-500"/>}
                      {t.delivery_method === '방문픽업' && <Package className="w-4 h-4 mr-1 text-green-500"/>}
                      {t.delivery_method === '현장판매' && <DollarSign className="w-4 h-4 mr-1 text-purple-500"/>}
                      
                      {t.delivery_method || '배송'}
                    </div>
                    {['배송', '배달', '택배배송', '자체배달'].includes(t.delivery_method) && (
                      <div className="text-xs text-slate-500 flex items-center mt-1 truncate max-w-[200px]" title={t.shipping_address}>
                        <MapPin className="w-3 h-3 mr-1 shrink-0" /> {t.shipping_address || '주소 미입력'}
                      </div>
                    )}
                    {['배송', '택배배송'].includes(t.delivery_method) && (
                      <div className="mt-2 flex items-center space-x-1">
                        <input 
                          type="text" 
                          placeholder="송장번호 입력"
                          className="border rounded px-2 py-1 text-xs w-32 outline-none focus:border-blue-500"
                          value={trackingEdits[t.id] !== undefined ? trackingEdits[t.id] : (t.tracking_number || '')}
                          onChange={(e) => setTrackingEdits({...trackingEdits, [t.id]: e.target.value})}
                        />
                        {(trackingEdits[t.id] !== undefined && trackingEdits[t.id] !== (t.tracking_number || '')) && (
                          <button onClick={() => saveTrackingNumber(t.id)} className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-200">저장</button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right font-medium text-slate-700">{t.quantity ? Number(String(t.quantity).replace(/[^0-9]/g, '')).toLocaleString() : '-'}</td>
                  <td className="p-4 text-right font-bold text-red-500">{t.total_price ? Number(String(t.total_price).replace(/[^0-9]/g, '')).toLocaleString() : '-'}</td>
                  <td className="p-4">
                    <select 
                      value={t.status || '결제대기'}
                      onChange={(e) => updateOrder(t.id, { status: e.target.value })}
                      className={`border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-500 w-full ${t.status === '견적요청' ? 'bg-amber-50 text-amber-700 font-bold' : 'bg-white'}`}
                    >
                      {TABS.filter(t => t !== '전체').map(tab => (
                        <option key={tab} value={tab}>{tab}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={()=>deleteData(t.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors" title="삭제">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    조건에 맞는 주문 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attachment Viewer Modal */}
      {viewerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setViewerUrl(null)}></div>
          <div className="bg-white rounded-2xl shadow-2xl relative z-10 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center"><ImageIcon className="w-5 h-5 mr-2 text-blue-500"/> 첨부된 캡처/증빙 이미지</h3>
              <button onClick={() => setViewerUrl(null)} className="p-1 rounded-full hover:bg-slate-200 text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto bg-slate-900 flex justify-center items-center min-h-[300px]">
              <img src={viewerUrl} alt="첨부 이미지" className="max-w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
