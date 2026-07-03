"use client";

import React, { useState, useEffect } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { Truck, Search, Upload, Trash2, Eye, Calendar, DollarSign, FileText, ArrowRight, RefreshCw, X, Link, Copy, Printer } from "lucide-react";
import CustomsOcrModal from "./components/CustomsOcrModal";
import InlineTagEditor from "../estimates/components/InlineTagEditor";

export default function ImportCustomsDashboard() {
  // 1. usePersistedState를 활용한 탭, 검색어, 페이징 상태 보존
  const [searchQuery, setSearchQuery, isSearchQueryRestored] = usePersistedState<string>("egdesk_customs_searchQuery", "");
  const [statusFilter, setStatusFilter, isStatusFilterRestored] = usePersistedState<string>("egdesk_customs_statusFilter", "ALL");
  const [currentPage, setCurrentPage, isCurrentPageRestored] = usePersistedState<number>("egdesk_customs_currentPage", 1);
  const [selectedSoNbr, setSelectedSoNbr, isSelectedSoNbrRestored] = usePersistedState<string | null>("egdesk_customs_selectedSoNbr", null);

  // 모든 세션 상태 복원이 완료되었는지 감시하는 플래그 (Hydration 및 중복 쿼리 방어)
  const isRestored = isSearchQueryRestored && isStatusFilterRestored && isCurrentPageRestored && isSelectedSoNbrRestored;

  // 일반 상태 정의
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 다중 체크박스 선택 및 태그/권한 상태 추가
  const [selectedSoNumbers, setSelectedSoNumbers] = useState<Set<string>>(new Set());
  const [dbTags, setDbTags] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("SUB_OPERATOR");

  const limit = 10;
  const offset = (currentPage - 1) * limit;

  // 데이터 목록 로드
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/import-customs?searchQuery=${encodeURIComponent(searchQuery)}&status=${statusFilter}&limit=${limit}&offset=${offset}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error("수입 통관 목록 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  // 상세 단일 건 로드
  const fetchDetail = async (so_number: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/import-customs/detail?so_number=${so_number}`);
      const data = await res.json();
      if (data.success) {
        setDetailData(data);
      } else {
        alert(data.error || "상세 정보 로드 실패");
        setSelectedSoNbr(null);
      }
    } catch (e) {
      console.error("상세 정보 조회 에러:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  // 📂 태그 프리셋 로드
  useEffect(() => {
    fetch("/api/expenses/tags")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setDbTags(json.tags || []);
        }
      })
      .catch((e) => console.error("태그 로드 에러:", e));
  }, []);

  // 유저 권한 세션 로드
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.role) {
          setUserRole(data.role);
        }
      })
      .catch((e) => console.error("사용자 권한 세션 패치 실패", e));
  }, []);

  // 체크박스 단일 선택 토글
  const handleToggleSelect = (so_number: string) => {
    setSelectedSoNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(so_number)) {
        next.delete(so_number);
      } else {
        next.add(so_number);
      }
      return next;
    });
  };

  // 체크박스 전체 선택 토글
  const handleToggleSelectAll = () => {
    setSelectedSoNumbers((prev) => {
      if (prev.size === rows.length) {
        return new Set();
      } else {
        return new Set(rows.map((r) => r.so_number));
      }
    });
  };

  // 인라인 태그 저장 실행
  const handleUpdateTags = async (soNumber: string, tagsValue: string) => {
    try {
      const res = await fetch("/api/import-customs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          so_number: soNumber,
          tags: tagsValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "비고(태그) 수정에 실패했습니다.");
      }
    } catch (e) {
      alert("오류가 발생했습니다.");
    }
  };

  // 2. Return Guard를 탑재하여 중복 데이터 패칭 방지
  useEffect(() => {
    if (isRestored) {
      fetchData();
    }
  }, [isRestored, searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    if (isRestored && selectedSoNbr) {
      fetchDetail(selectedSoNbr);
    } else {
      setDetailData(null);
    }
  }, [isRestored, selectedSoNbr]);

  // 수입 건 삭제 (소프트 삭제)
  const handleDelete = async (so_number: string) => {
    if (!window.confirm(`주문번호 ${so_number}의 모든 수입 통관 명세와 정산 정보를 완전히 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/import-customs?so_number=${so_number}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        alert("성공적으로 삭제되었습니다.");
        fetchData();
        if (selectedSoNbr === so_number) {
          setSelectedSoNbr(null);
        }
      } else {
        alert(data.error || "삭제 실패");
      }
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 모바일 웹뷰 링크 복사
  const handleCopyLink = (so_number: string) => {
    const link = `${window.location.origin}/import-customs/web-view?so_number=${so_number}`;
    navigator.clipboard.writeText(link).then(() => {
      alert("상세 웹뷰 링크가 클립보드에 복사되었습니다.\n\n" + link);
    }).catch(() => {
      alert("링크 복사 실패");
    });
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="w-full px-4 md:px-8 py-8 bg-slate-50 min-h-screen">
      {/* A. 정규화된 대장 타이틀 영역 */}
      <div className="mb-8 text-left">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Truck className="w-8 h-8 text-indigo-600 shrink-0" />
          <span>수입 통관 AI</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm pl-10 md:pl-10">
          수입 통관 PDF 인보이스를 스캔하여 마스터-품목-정산 데이터를 ERP에 적재하고 이력을 통합 관리합니다.
        </p>
      </div>

      {/* B. 필터 및 액션 영역 */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 검색 및 필터 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              className="w-full border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="PO번호, SO번호, 수출자명 검색"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex rounded-2xl border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={() => { setStatusFilter("ALL"); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                statusFilter === "ALL" 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => { setStatusFilter("UNPAID"); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                statusFilter === "UNPAID" 
                  ? "bg-white text-rose-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              미송금
            </button>
            <button
              onClick={() => { setStatusFilter("PAID"); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                statusFilter === "PAID" 
                  ? "bg-white text-emerald-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              지급완료
            </button>
          </div>
        </div>

        {/* 업로드 및 인쇄 액션 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedSoNumbers.size > 0) {
                const ids = Array.from(selectedSoNumbers).join(",");
                window.open(`/import-customs/web-view?so_number=${ids}`, "_blank");
              } else {
                window.open(`/import-customs/web-view`, "_blank");
              }
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>수입 통관 대장</span>
          </button>
          
          <button
            onClick={() => setIsOcrOpen(true)}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            <span>통관 인보이스 스캔 등록</span>
          </button>
        </div>
      </div>

      {/* 선택 해제 배너 */}
      {selectedSoNumbers.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3.5 mb-4 flex items-center justify-between animate-fade-in text-left">
          <span className="text-xs font-bold text-indigo-700">
            선택된 주문건: <strong className="text-indigo-900">{selectedSoNumbers.size}</strong>건
          </span>
          <button
            onClick={() => setSelectedSoNumbers(new Set())}
            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            선택 해제
          </button>
        </div>
      )}

      {/* C. 목록 대장 그리드 */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/85 text-slate-500 font-bold">
                <th className="py-4 px-5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedSoNumbers.size === rows.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-5">주문 번호 (SO#)</th>
                <th className="py-4 px-5">발주 번호 (PO#)</th>
                <th className="py-4 px-5">수출자 상호</th>
                <th className="py-4 px-5">발주일 / 인보이스일</th>
                <th className="py-4 px-5">비고(태그)</th>
                <th className="py-4 px-5 text-right">인보이스 총액</th>
                <th className="py-4 px-5">결제 마감일</th>
                <th className="py-4 px-5 text-center">송금 상태</th>
                <th className="py-4 px-5 text-center">동작</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center font-bold text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    데이터 로딩 중...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center font-bold text-slate-400">
                    등록된 수입 통관 문서 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.so_number} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedSoNumbers.has(row.so_number)}
                        onChange={() => handleToggleSelect(row.so_number)}
                        className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-800">{row.so_number}</td>
                    <td className="py-4 px-5 font-semibold text-slate-600">{row.po_number}</td>
                    <td className="py-4 px-5 text-slate-700 font-medium">{row.exporter_name || "-"}</td>
                    <td className="py-4 px-5 text-slate-500">
                      <div className="font-semibold">{row.order_date}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{row.invoice_date} (송장일)</div>
                    </td>
                    <td className="py-4 px-5">
                      <InlineTagEditor
                        estimateId={row.so_number}
                        initialTags={row.tags || ""}
                        aiParsed={false}
                        userRole={userRole}
                        dbTags={dbTags}
                        onUpdateTags={handleUpdateTags}
                      />
                    </td>
                    <td className="py-4 px-5 text-right font-black text-slate-800">
                      {(row.total_invoice_value || 0).toLocaleString()} USD
                    </td>
                    <td className="py-4 px-5 text-slate-500 font-semibold">{row.payment_due_date || "-"}</td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        row.is_paid === 1 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {row.is_paid === 1 ? "지급완료" : "미송금"}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedSoNbr(row.so_number)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                          title="상세 조회"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyLink(row.so_number)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-indigo-500 transition-colors"
                          title="모바일 웹뷰 링크 복사"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(row.so_number)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* D. 페이지네이션 */}
        {!loading && totalPages > 1 && (
          <div className="bg-slate-50/70 border-t border-slate-200 px-5 py-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              전체 {total}개 내역 중 {offset + 1}-{Math.min(offset + limit, total)} 표시
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1.5 border rounded-lg text-xs font-bold bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                이전
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                    currentPage === i + 1 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1.5 border rounded-lg text-xs font-bold bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* E. 상세 모달 뷰어 */}
      {selectedSoNbr && detailData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-slate-100 max-w-4xl w-full p-6 md:p-8 shadow-2xl relative flex flex-col max-h-[90vh] animate-scale-up">
            <button
              onClick={() => setSelectedSoNbr(null)}
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>주문번호 {detailData.master.so_number} 상세 내역</span>
            </h3>

            <div className="space-y-6 flex-1 overflow-y-auto pr-1 text-left">
              {/* 마스터 카드 */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">A. 발주 / 선적 정보</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-400 font-medium">구매발주번호 (PO#)</span>
                    <span className="font-bold text-slate-700">{detailData.master.po_number}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">인보이스 번호</span>
                    <span className="font-bold text-slate-700">{detailData.master.invoice_number || "-"}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">수출자 상호</span>
                    <span className="font-bold text-slate-700">{detailData.master.exporter_name || "-"}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">발주일자</span>
                    <span className="font-bold text-slate-700">{detailData.master.order_date}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">인보이스 발행일 / 선적일</span>
                    <span className="font-bold text-slate-700">{detailData.master.invoice_date}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">인도 조건 / 결제 조건</span>
                    <span className="font-bold text-slate-700">{detailData.master.terms_of_sale || "-"} / {detailData.master.payment_terms || "-"}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">배송 택배사 / 화물 운송장번호</span>
                    <span className="font-bold text-slate-700">{detailData.master.ship_via || "-"} ({detailData.master.air_waybill_nbr || "-"})</span>
                  </div>
                </div>
              </div>

              {/* 정산 카드 */}
              {detailData.finance && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">B. 송금 및 정산 상태</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="block text-slate-400 font-medium">인보이스 청구 총액</span>
                      <span className="font-bold text-slate-800 text-sm">{(detailData.finance.total_invoice_value || 0).toLocaleString()} USD</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium">결제 마감 예정일</span>
                      <span className="font-bold text-slate-700">{detailData.finance.payment_due_date}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium">송금 상태</span>
                      <span className={`inline-block px-2 py-0.5 rounded font-bold border mt-0.5 ${
                        detailData.finance.is_paid === 1 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>
                        {detailData.finance.is_paid === 1 ? "지급 완료" : "미송금"}
                      </span>
                    </div>
                    {detailData.finance.bank_name && (
                      <>
                        <div>
                          <span className="block text-slate-400 font-medium">송금 은행</span>
                          <span className="font-bold text-slate-700">{detailData.finance.bank_name}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-medium">계좌번호</span>
                          <span className="font-bold text-slate-700">{detailData.finance.account_number}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-medium">SWIFT 코드</span>
                          <span className="font-bold text-slate-700">{detailData.finance.swift_code}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 품목 상세 테이블 */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="py-2.5 px-3">규격 / 파트번호</th>
                      <th className="py-2.5 px-3">품명 상세</th>
                      <th className="py-2.5 px-3 text-right">수량</th>
                      <th className="py-2.5 px-3 text-right">단가 (USD)</th>
                      <th className="py-2.5 px-3 text-right">금액 (USD)</th>
                      <th className="py-2.5 px-3">HS코드</th>
                      <th className="py-2.5 px-3 text-center">원산지</th>
                      <th className="py-2.5 px-3">품질 로트번호</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailData.items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-semibold text-slate-700">{item.part_number}</td>
                        <td className="py-3 px-3 text-slate-500">{item.description || "-"}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-700">{item.quantity.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-slate-600">{item.unit_price.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">{item.amount.toLocaleString()}</td>
                        <td className="py-3 px-3 text-slate-500 font-semibold">{item.hs_code || "-"}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-600">{item.country_of_origin}</td>
                        <td className="py-3 px-3 text-slate-400">{item.lot_number || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
              <button
                onClick={() => {
                  window.open(`/import-customs/web-view?so_number=${detailData.master.so_number}`, '_blank');
                }}
                className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-xs rounded-xl border border-indigo-100 transition-colors flex items-center gap-1.5"
              >
                <span>모바일 웹뷰 새창 열기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedSoNbr(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F. AI OCR 스캔 모달 */}
      <CustomsOcrModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
