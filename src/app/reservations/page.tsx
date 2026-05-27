"use client";
import { useState, useEffect } from "react";
import { CalendarDays, Plus, Trash2, Search, Download, FileSpreadsheet } from "lucide-react";
import OrderDetailModal from "@/components/OrderDetailModal";

export default function ReservationsPage() {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', serviceName: '', reservationDate: '', reservationTime: '' });
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
    const res = await fetch('/api/reservations');
    const json = await res.json();
    if (json.success) setData(json.reservations);
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

          const mappedReservations = rawRows.map((row: any) => {
            const customerNameVal = row['고객명'] || row['고객'] || row['이름'] || row['customerName'] || row['name'] || '';
            const customerPhoneVal = row['연락처'] || row['전화번호'] || row['휴대폰'] || row['전화'] || row['phone'] || row['customerPhone'] || '';
            const serviceNameVal = row['예약서비스'] || row['예약 서비스'] || row['서비스'] || row['서비스명'] || row['serviceName'] || '';
            const reservationDateVal = row['예약일자'] || row['예약일'] || row['날짜'] || row['reservationDate'] || row['date'] || '';
            const reservationTimeVal = row['예약시간'] || row['예약 시간'] || row['시간'] || row['reservationTime'] || row['time'] || '';
            const amountVal = row['금액'] || row['예약금'] || row['가격'] || row['amount'] || row['price'] || '';

            return {
              customerName: customerNameVal,
              customerPhone: customerPhoneVal,
              serviceName: serviceNameVal,
              reservationDate: reservationDateVal,
              reservationTime: reservationTimeVal,
              amount: amountVal
            };
          }).filter(r => r.customerName && r.customerPhone && r.serviceName);

          if (mappedReservations.length === 0) {
            alert('필수 정보인 [고객명, 연락처, 예약서비스]가 모두 기재된 유효한 행을 찾을 수 없습니다.');
            setIsUploadingExcel(false);
            return;
          }

          const resUpload = await fetch('/api/reservations/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservations: mappedReservations })
          });
          const jsonUpload = await resUpload.json();

          if (jsonUpload.success) {
            alert(`🎉 엑셀 일괄 등록 완료!\n수신 데이터: ${jsonUpload.totalReceived}개 중 ${jsonUpload.count}개의 예약이 성공적으로 등록되었습니다.\n(예약 내역 생성, 결제대기 거래처 연동, 알림톡 스케줄링이 자동 완료되었습니다.)`);
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

      const headers = ['고객명', '연락처', '예약서비스', '예약일자', '예약시간', '금액'];
      const mockRows = [
        {
          '고객명': '홍길동',
          '연락처': '010-1234-5678',
          '예약서비스': '프리미엄 1:1 퍼스널 트레이닝 10회',
          '예약일자': '2026-06-01',
          '예약시간': '14:00',
          '금액': '550000'
        },
        {
          '고객명': '김영희',
          '연락처': '010-9876-5432',
          '예약서비스': '모발 두피 케어 스페셜 코스',
          '예약일자': '2026-06-02',
          '예약시간': '10:30',
          '금액': '98000'
        }
      ];

      const aoaData = [headers];
      mockRows.forEach((row) => {
        const rowData = headers.map((header) => row[header as keyof typeof row] ?? '');
        aoaData.push(rowData);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '예약일괄등록_샘플서식');

      XLSX.writeFile(workbook, '이지데스크_예약일괄등록_샘플양식.xlsx');
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
      (t.service_name && t.service_name.toLowerCase().includes(query))
    );
  });

  // 페이지네이션 슬라이싱 로직
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const addData = async (e: any) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.serviceName) return alert('필수 입력 누락');
    const res = await fetch('/api/reservations', { method: 'POST', body: JSON.stringify(form) });
    if ((await res.json()).success) { setForm({customerName:'',customerPhone:'',serviceName:'',reservationDate:'',reservationTime:''}); fetchData(); }
  };
  const deleteData = async (id: string) => {
    if(!confirm('삭제하시겠습니까?')) return;
    const res = await fetch('/api/reservations?id=' + id, { method: 'DELETE' });
    if ((await res.json()).success) fetchData();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
          <CalendarDays className="w-8 h-8 mr-3 text-indigo-500" /> 예약 관리 AI
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
            title="엑셀 표준 샘플 서식 파일 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            샘플 서식 다운로드
          </button>
          <label className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer transition-all">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {isUploadingExcel ? '업로드 중...' : '엑셀 파일 일괄 등록'}
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              disabled={isUploadingExcel}
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      {/* 새 예약 등록 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold mb-4">새 예약 등록</h2>
        <form onSubmit={addData} className="flex space-x-3">
          <input type="text" placeholder="고객명" value={form.customerName} onChange={e=>setForm({...form, customerName: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 outline-none" required />
          <input type="text" placeholder="연락처" value={form.customerPhone} onChange={e=>setForm({...form, customerPhone: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 outline-none" required />
          <input type="text" placeholder="예약서비스" value={form.serviceName} onChange={e=>setForm({...form, serviceName: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 outline-none" required />
          <input type="date" value={form.reservationDate} onChange={e=>setForm({...form, reservationDate: e.target.value})} className="border rounded-lg px-3 py-2 outline-none" />
          <input type="time" value={form.reservationTime} onChange={e=>setForm({...form, reservationTime: e.target.value})} className="border rounded-lg px-3 py-2 outline-none" />
          <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center font-bold"><Plus className="w-4 h-4 mr-1"/> 등록</button>
        </form>
      </div>

      {/* 예약 목록 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-slate-800 shrink-0">예약 목록 ({filteredData.length}건)</h2>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="고객명, 연락처, 서비스 검색"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white font-semibold"
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm text-slate-600">
              <th className="p-4">예약일자</th>
              <th className="p-4">예약시간</th>
              <th className="p-4">예약번호</th>
              <th className="p-4">고객명</th>
              <th className="p-4">연락처</th>
              <th className="p-4">예약내용</th>
              <th className="p-4">상태</th>
              <th className="p-4">관리</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(t => (
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-indigo-600">{t.reservation_date}</td>
                <td className="p-4">{t.reservation_time}</td>
                <td className="p-4">
                  <button 
                    onClick={() => setActiveOrderId(t.id)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-mono font-bold tracking-tight transition-all active:scale-95"
                  >
                    RES-{t.id.slice(-6).toUpperCase()}
                  </button>
                </td>
                <td className="p-4">{t.customer_name}</td>
                <td className="p-4">{t.customer_phone}</td>
                <td className="p-4">{t.service_name}</td>
                <td className="p-4">{t.status}</td>
                <td className="p-4">
                  <button onClick={()=>deleteData(t.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors" title="삭제">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </td>
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400">
                  {data.length === 0 ? "등록된 예약 내역이 없습니다." : "검색 결과와 일치하는 예약 내역이 없습니다."}
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
            className="border rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 focus:border-indigo-500"
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
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 text-white shadow-sm disabled:opacity-50 cursor-not-allowed"
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
                    ? 'bg-indigo-500 text-white shadow-sm' 
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
