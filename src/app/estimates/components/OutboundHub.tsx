"use client";

import React, { useState } from "react";
import { Plus, Eye, CheckCircle2, ChevronRight } from "lucide-react";
import { Estimate, SalesOrder, Partner } from "../types";

interface OutboundHubProps {
  estimates: Estimate[];
  salesOrders: SalesOrder[];
  partners: Partner[];
  onOpenDetailModal: (id: string) => void;
  onOpenWriteModal: () => void;
  onConvertToSo: (est: Estimate) => Promise<void>;
  onConfirmSalesOrder: (so: SalesOrder) => Promise<void>;
  onBulkConfirmSalesOrder: (ids: string[]) => Promise<void>;
  onBulkExportExcel: (
    type: "outbound_est" | "outbound_so",
    selectedIds: Set<string>
  ) => void;
}

export default function OutboundHub({
  estimates,
  salesOrders,
  partners,
  onOpenDetailModal,
  onOpenWriteModal,
  onConvertToSo,
  onConfirmSalesOrder,
  onBulkConfirmSalesOrder,
  onBulkExportExcel,
}: OutboundHubProps) {
  // 서브 탭 및 필터 로컬 상태
  const [outboundSubTab, setOutboundSubTab] = useState<"estimates" | "sos">("estimates");
  const [outboundSearch, setOutboundSearch] = useState("");
  const [outboundStatusFilter, setOutboundStatusFilter] = useState("ALL");
  const [outboundSortKey, setOutboundSortKey] = useState("created_at");
  const [outboundSortDir, setOutboundSortDir] = useState<"asc" | "desc">("desc");

  // 다중 선택 로컬 상태
  const [selectedOutboundIds, setSelectedOutboundIds] = useState<Set<string>>(new Set());

  // 필터링 및 정렬 파이프라인
  const filteredOutboundEstimates = estimates
    .filter((e) => e.type === "OUTBOUND")
    .filter((e) => {
      if (!outboundSearch.trim()) return true;
      const term = outboundSearch.toLowerCase();
      return (
        e.partner_name.toLowerCase().includes(term) ||
        e.id.toLowerCase().includes(term)
      );
    })
    .filter((e) => {
      if (outboundStatusFilter === "ALL") return true;
      return e.direction_status === outboundStatusFilter;
    })
    .sort((a, b) => {
      const valA = a[outboundSortKey as keyof Estimate] ?? "";
      const valB = b[outboundSortKey as keyof Estimate] ?? "";
      if (typeof valA === "string" && typeof valB === "string") {
        return outboundSortDir === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return outboundSortDir === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

  const filteredOutboundSOs = salesOrders
    .filter((so) => {
      if (!outboundSearch.trim()) return true;
      const term = outboundSearch.toLowerCase();
      return (
        so.customer_name.toLowerCase().includes(term) ||
        so.id.toLowerCase().includes(term)
      );
    })
    .filter((so) => {
      if (outboundStatusFilter === "ALL") return true;
      return so.status === outboundStatusFilter;
    })
    .sort((a, b) => {
      const valA = a[outboundSortKey as keyof SalesOrder] ?? "";
      const valB = b[outboundSortKey as keyof SalesOrder] ?? "";
      if (typeof valA === "string" && typeof valB === "string") {
        return outboundSortDir === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return outboundSortDir === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

  // 정렬 핸들러
  const handleSort = (key: string) => {
    if (outboundSortKey === key) {
      setOutboundSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOutboundSortKey(key);
      setOutboundSortDir("desc");
    }
  };

  // 선택 취소 핸들러
  const handleClearSelection = () => {
    setSelectedOutboundIds(new Set());
  };

  // 일괄 수주확인서 발송 로컬 핸들러
  const handleLocalBulkConfirmSalesOrder = async () => {
    const ids = Array.from(selectedOutboundIds);
    await onBulkConfirmSalesOrder(ids);
    handleClearSelection();
  };

  // 일괄 엑셀 출력 로컬 핸들러
  const handleLocalBulkExportExcel = () => {
    onBulkExportExcel(
      outboundSubTab === "estimates" ? "outbound_est" : "outbound_so",
      selectedOutboundIds
    );
  };

  return (
    <div className="space-y-6 animate-scale-up">
      {/* 서브 탭 헤더 */}
      <div className="flex border-b border-slate-100 gap-6 pb-2">
        <button
          onClick={() => {
            setOutboundSubTab("estimates");
            setSelectedOutboundIds(new Set());
          }}
          className={`pb-3 font-extrabold text-sm border-b-2 transition-all ${
            outboundSubTab === "estimates"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          🏷️ 보낸 견적서 관리 대장
        </button>
        <button
          onClick={() => {
            setOutboundSubTab("sos");
            setSelectedOutboundIds(new Set());
          }}
          className={`pb-3 font-extrabold text-sm border-b-2 transition-all ${
            outboundSubTab === "sos"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          💼 수주 및 바이어 계약 대장
        </button>
      </div>

      {/* 상단 컨트롤 바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <input
            type="text"
            placeholder={
              outboundSubTab === "estimates"
                ? "바이어명 또는 견적 번호 검색..."
                : "바이어명 또는 수주 번호 검색..."
            }
            value={outboundSearch}
            onChange={(e) => setOutboundSearch(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={outboundStatusFilter}
            onChange={(e) => setOutboundStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm"
          >
            <option value="ALL">모든 상태</option>
            {outboundSubTab === "estimates" ? (
              <>
                <option value="SENT">견적발송</option>
                <option value="RECEIVED">수주수락</option>
              </>
            ) : (
              <>
                <option value="REGISTERED">수주등록</option>
                <option value="CONFIRMED">확인완료</option>
              </>
            )}
          </select>

          {outboundSubTab === "estimates" && (
            <button
              onClick={onOpenWriteModal}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-amber-450" />
              AI 최적 가격 견적서 작성
            </button>
          )}
        </div>
      </div>

      {/* 대장 테이블 영역 */}
      {outboundSubTab === "estimates" ? (
        <div className="overflow-x-auto bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="py-3 px-2 w-[40px]">
                  <input
                    type="checkbox"
                    checked={
                      filteredOutboundEstimates.length > 0 &&
                      filteredOutboundEstimates.every((e) =>
                        selectedOutboundIds.has(e.id)
                      )
                    }
                    onChange={(e) => {
                      const newSelected = new Set(selectedOutboundIds);
                      if (e.target.checked) {
                        filteredOutboundEstimates.forEach((x) =>
                          newSelected.add(x.id)
                        );
                      } else {
                        filteredOutboundEstimates.forEach((x) =>
                          newSelected.delete(x.id)
                        );
                      }
                      setSelectedOutboundIds(newSelected);
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th
                  className="py-3 px-2 cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort("id")}
                >
                  견적 번호 {outboundSortKey === "id" && (outboundSortDir === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-3 px-2">수신 바이어명</th>
                <th
                  className="py-3 px-2 cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort("total_amount")}
                >
                  총 견적액 {outboundSortKey === "total_amount" && (outboundSortDir === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-3 px-2">상태</th>
                <th className="py-3 px-2">제안서</th>
                <th className="py-3 px-2 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredOutboundEstimates.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-slate-400 font-semibold"
                  >
                    조건에 맞는 견적 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredOutboundEstimates.map((est) => (
                  <tr key={est.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3.5 px-2">
                      <input
                          type="checkbox"
                          checked={selectedOutboundIds.has(est.id)}
                          onChange={() => {
                            const newSelected = new Set(selectedOutboundIds);
                            if (newSelected.has(est.id)) {
                              newSelected.delete(est.id);
                            } else {
                              newSelected.add(est.id);
                            }
                            setSelectedOutboundIds(newSelected);
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="py-3.5 px-2 font-mono text-slate-700">
                      <button
                        onClick={() => onOpenDetailModal(est.id)}
                        className="text-indigo-600 hover:underline cursor-pointer font-bold text-left"
                      >
                        {est.id}
                      </button>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="font-bold text-slate-800 block">
                        {est.partner_name}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {est.partner_phone}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-indigo-605 font-bold">
                      {est.total_amount.toLocaleString()}원
                    </td>
                    <td className="py-3.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          est.direction_status === "SENT"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {est.direction_status === "SENT" ? "견적발송" : "수주수락"}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-slate-500 font-medium max-w-[150px] truncate">
                      {est.file_url || "AI 맞춤 레터 포함"}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenDetailModal(est.id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> 상세
                        </button>
                        {est.direction_status === "SENT" ? (
                          <button
                            onClick={() => onConvertToSo(est)}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-black flex items-center gap-0.5"
                          >
                            수주 전환 <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px]">수주완료</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="py-3 px-2 w-[40px]">
                  <input
                    type="checkbox"
                    checked={
                      filteredOutboundSOs.length > 0 &&
                      filteredOutboundSOs.every((s) => selectedOutboundIds.has(s.id))
                    }
                    onChange={(e) => {
                      const newSelected = new Set(selectedOutboundIds);
                      if (e.target.checked) {
                        filteredOutboundSOs.forEach((x) => newSelected.add(x.id));
                      } else {
                        filteredOutboundSOs.forEach((x) => newSelected.delete(x.id));
                      }
                      setSelectedOutboundIds(newSelected);
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th
                  className="py-3 px-2 cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort("id")}
                >
                  수주 번호 {outboundSortKey === "id" && (outboundSortDir === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-3 px-2">바이어명</th>
                <th
                  className="py-3 px-2 cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort("total_amount")}
                >
                  총 수주액 {outboundSortKey === "total_amount" && (outboundSortDir === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-3 px-2">상태</th>
                <th
                  className="py-3 px-2 cursor-pointer hover:text-slate-805"
                  onClick={() => handleSort("created_at")}
                >
                  수주일시 {outboundSortKey === "created_at" && (outboundSortDir === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-3 px-2 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredOutboundSOs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-slate-400 font-semibold"
                  >
                    조건에 맞는 수주 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredOutboundSOs.map((so) => (
                  <tr key={so.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3.5 px-2">
                      <input
                        type="checkbox"
                        checked={selectedOutboundIds.has(so.id)}
                        onChange={() => {
                          const newSelected = new Set(selectedOutboundIds);
                          if (newSelected.has(so.id)) {
                            newSelected.delete(so.id);
                          } else {
                            newSelected.add(so.id);
                          }
                          setSelectedOutboundIds(newSelected);
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="font-mono text-slate-700 block">{so.id}</span>
                      <button
                        onClick={() => onOpenDetailModal(so.estimate_id)}
                        className="text-indigo-500 hover:underline text-[9px] font-bold block mt-0.5 text-left"
                      >
                        견적: {so.estimate_id} 🔗
                      </button>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="font-bold text-slate-800 block">
                        {so.customer_name}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {so.customer_phone}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-indigo-600 font-bold">
                      {so.total_amount.toLocaleString()}원
                    </td>
                    <td className="py-3.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${
                          so.status === "REGISTERED"
                            ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        }`}
                      >
                        {so.status === "REGISTERED" ? "수주등록" : "확인완료"}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-slate-505 font-medium">
                      {so.created_at.substring(0, 16)}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenDetailModal(so.estimate_id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> 견적상세
                        </button>
                        {so.status === "REGISTERED" ? (
                          <button
                            onClick={() => onConfirmSalesOrder(so)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-md"
                          >
                            수주확인서 발송
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 수주 확인 메일 완료
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 일괄 작업 플로팅 바 */}
      {selectedOutboundIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl flex items-center gap-6 shadow-2xl border border-slate-800 z-40 animate-scale-up">
          <span className="text-xs font-bold text-indigo-350">
            📦 {selectedOutboundIds.size}건의 항목 선택됨
          </span>
          <div className="h-4 w-px bg-slate-800"></div>
          <div className="flex gap-2">
            {outboundSubTab === "sos" && (
              <button
                onClick={handleLocalBulkConfirmSalesOrder}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md transition-all"
              >
                선택 일괄 수주확인서 발송
              </button>
            )}
            <button
              onClick={handleLocalBulkExportExcel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl shadow-md border border-slate-700 transition-all"
            >
              선택 일괄 엑셀 출력
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all"
            >
              선택 취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
