"use client";
import { useState, useEffect } from "react";
import { Truck, Plus, Trash2, Search } from "lucide-react";
import OrderDetailModal from "@/components/OrderDetailModal";

export default function DeliveriesPage() {
  const [data, setData] = useState<any[]>([]);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', address: '', courier: '대한통운', trackingNumber: '' });
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);

  // 검색어 입력 시 페이지 번호 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    const res = await fetch('/api/deliveries');
    const json = await res.json();
    if (json.success) setData(json.deliveries);
  };

  // 🕒 엑셀 일괄 업로드 처리 핸들러 (지능형 퍼지 매핑 탑재)
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingExcel(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataVal = event.target?.result;
        if (!dataVal) return;

        try {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(dataVal, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (rawRows.length === 0) {
            alert('엑셀 시트에 데이터가 존재하지 않습니다.');
            setIsUploadingExcel(false);
            return;
          }

          const mappedDeliveries = rawRows.map((row: any) => {
            const customerNameVal = row['고객명'] || row['고객'] || row['이름'] || row['수령인'] || row['customerName'] || row['name'] || '';
            const customerPhoneVal = row['연락처'] || row['전화번호'] || row['휴대폰'] || row['전화'] || row['phone'] || row['customerPhone'] || '';
            const addressVal = row['배송지 주소'] || row['배송지'] || row['주소'] || row['address'] || '';
            const courierVal = row['택배사'] || row['택배'] || row['courier'] || '대한통운';
            const trackingNumberVal = row['운송장번호'] || row['운송장'] || row['송장번호'] || row['송장'] || row['trackingNumber'] || '';
            const statusVal = row['상태'] || row['배송상태'] || row['status'] || '상품준비중';

            return {
              customerName: customerNameVal,
              customerPhone: customerPhoneVal,
              address: addressVal,
              courier: courierVal,
              trackingNumber: trackingNumberVal,
              status: statusVal
            };
          }).filter(d => d.customerName && d.customerPhone && d.address);

          if (mappedDeliveries.length === 0) {
            alert('필수 정보인 [고객명], [연락처], [배송지 주소]가 모두 기재된 유효한 행을 찾을 수 없습니다.');
            setIsUploadingExcel(false);
            return;
          }

          const resUpload = await fetch('/api/deliveries/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deliveries: mappedDeliveries })
          });
          const jsonUpload = await resUpload.json();

          if (jsonUpload.success) {
            alert(`🎉 엑셀 일괄 등록 완료!\n수신 데이터: ${jsonUpload.totalReceived}개 중 ${jsonUpload.count}개의 배송 내역이 성공적으로 등록되었습니다.`);
            fetchData();
          } else {
            alert('일괄 등록 실패: ' + (jsonUpload.error || '알 수 없는 오류'));
          }
        } catch (err: any) {
          console.error(err);
          alert('엑셀 파일 파싱 중 오류가 발생했습니다. 서식을 확인해 주세요.');
        } finally {
          setIsUploadingExcel(false);
          e.target.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (eErr) {
      console.error(eErr);
      alert('파일 읽기 오류');
      setIsUploadingExcel(false);
    }
  };

  // 📄 표준 샘플 양식 다운로드 핸들러
  const handleDownloadSample = async () => {
    try {
      const XLSX = await import('xlsx');

      const headers = ['고객명', '연락처', '배송지 주소', '택배사', '운송장번호'];
      const mockRows = [
        {
          '고객명': '홍길동',
          '연락처': '010-1234-5678',
          '배송지 주소': '서울특별시 강남구 테헤란로 123 이지빌딩 5층',
          '택배사': '우체국',
          '운송장번호': '6543210987654'
        },
        {
          '고객명': '이순신',
          '연락처': '010-9876-5432',
          '배송지 주소': '부산광역시 해운대구 우동 456 센텀아파트 101동 202호',
          '택배사': '대한통운',
          '운송장번호': '123456789012'
        }
      ];

      const aoaData = [headers];
      mockRows.forEach((row) => {
        const rowData = headers.map((header) => row[header as keyof typeof row] ?? '');
        aoaData.push(rowData);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '배송일괄등록_샘플서식');

      XLSX.writeFile(workbook, '이지데스크_배송일괄등록_샘플양식.xlsx');
    } catch (err) {
      console.error('샘플 양식 다운로드 에러:', err);
      alert('템플릿 파일 생성에 실패했습니다.');
    }
  };

  const filteredData = data.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      (t.customer_name && t.customer_name.toLowerCase().includes(query)) ||
      (t.customer_phone && t.customer_phone.toLowerCase().includes(query)) ||
      (t.address && t.address.toLowerCase().includes(query)) ||
      (t.tracking_number && t.tracking_number.toLowerCase().includes(query))
    );
  });

  // 페이지네이션 슬라이싱 로직
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const addData = async (e: any) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.address) return alert('필수 입력 누락');
    const res = await fetch('/api/deliveries', { method: 'POST', body: JSON.stringify(form) });
    if ((await res.json()).success) { setForm({customerName:'',customerPhone:'',address:'',courier:'대한통운',trackingNumber:''}); fetchData(); }
  };
  const deleteData = async (id: string) => {
    if(!confirm('삭제하시겠습니까?')) return;
    const res = await fetch('/api/deliveries?id=' + id, { method: 'DELETE' });
    if ((await res.json()).success) fetchData();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center"><Truck className="w-8 h-8 mr-3 text-amber-500" /> 배송 관리 AI</h1>
        <div className="flex items-center gap-2">
          {/* 📄 표준 양식 다운로드 버튼 */}
          <button 
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-650 hover:text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer active:scale-95 shrink-0"
            title="표준 엑셀 샘플 서식 (.xlsx) 다운로드"
          >
            샘플 서식 다운로드
          </button>
          
          {/* 📥 엑셀 일괄 등록 버튼 */}
          <label 
            className={`flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer active:scale-95 shrink-0 ${isUploadingExcel ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{isUploadingExcel ? '일괄 등록 중...' : '엑셀 파일 일괄 등록'}</span>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleExcelUpload} 
              disabled={isUploadingExcel}
              className="hidden" 
            />
          </label>
        </div>
      </div>
      
      {/* 새 배송 등록 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold mb-4">새 배송 등록</h2>
        <form onSubmit={addData} className="flex flex-col space-y-3">
          <div className="flex space-x-3">
            <input type="text" placeholder="고객명" value={form.customerName} onChange={e=>setForm({...form, customerName: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 outline-none" required />
            <input type="text" placeholder="연락처" value={form.customerPhone} onChange={e=>setForm({...form, customerPhone: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 outline-none" required />
            <select value={form.courier} onChange={e=>setForm({...form, courier: e.target.value})} className="border rounded-lg px-3 py-2 outline-none text-slate-700">
              <option>대한통운</option><option>우체국</option><option>로젠택배</option><option>한진택배</option>
            </select>
            <input type="text" placeholder="운송장번호" value={form.trackingNumber} onChange={e=>setForm({...form, trackingNumber: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 outline-none" />
          </div>
          <div className="flex space-x-3">
            <input type="text" placeholder="배송지 주소" value={form.address} onChange={e=>setForm({...form, address: e.target.value})} className="flex-[3] border rounded-lg px-3 py-2 outline-none" required />
            <button className="flex-1 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 flex items-center justify-center font-bold"><Plus className="w-4 h-4 mr-1"/> 배송 등록</button>
          </div>
        </form>
      </div>

      {/* 배송 목록 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-slate-800 shrink-0">배송 목록 ({filteredData.length}건)</h2>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="고객명, 연락처, 주소, 송장 검색"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full focus:ring-2 focus:ring-amber-500 outline-none text-xs bg-white font-semibold"
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm">
              <th className="p-4">고객명</th>
              <th className="p-4">연관 주문</th>
              <th className="p-4">연락처</th>
              <th className="p-4">주소</th>
              <th className="p-4">택배사</th>
              <th className="p-4">운송장번호</th>
              <th className="p-4">상태</th>
              <th className="p-4">관리</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(t => (
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{t.customer_name}</td>
                <td className="p-4">
                  {t.order_id ? (
                    <button 
                      onClick={() => setActiveOrderId(t.order_id || null)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-mono font-bold tracking-tight transition-all active:scale-95"
                    >
                      ORD-{t.order_id.slice(-6).toUpperCase()}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-light">-</span>
                  )}
                </td>
                <td className="p-4">{t.customer_phone}</td>
                <td className="p-4 text-xs text-slate-600">{t.address}</td>
                <td className="p-4">{t.courier}</td>
                <td className="p-4 font-mono text-amber-600">{t.tracking_number || '-'}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    t.status === '배송완료' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={()=>deleteData(t.id)} className="text-red-400 hover:text-red-650 p-2 rounded-lg hover:bg-red-50 transition-colors" title="삭제">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </td>
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400">
                  {data.length === 0 ? "배송 내역이 존재하지 않습니다." : "검색 결과와 일치하는 배송 내역이 존재하지 않습니다."}
                </td>
              </tr>
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
            className="border rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 focus:border-amber-500"
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
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-sm disabled:opacity-50 cursor-not-allowed"
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
                    ? 'bg-amber-500 text-white shadow-sm' 
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

      {activeOrderId && (
        <OrderDetailModal 
          orderId={activeOrderId} 
          onClose={() => setActiveOrderId(null)} 
        />
      )}
    </div>
  );
}
