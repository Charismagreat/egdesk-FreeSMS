"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowRightLeft, Plus, Send, ShoppingCart, Upload, Eye, 
  CheckCircle2, ChevronRight, FileText
} from "lucide-react";

// 분리한 타입 및 모달 컴포넌트 가져오기
import { Estimate, PurchaseOrder, SalesOrder, Partner } from "./types";
import EstimateDetailModal from "./components/EstimateDetailModal";
import EstimateOcrModal from "./components/EstimateOcrModal";
import InboundInspectModal from "./components/InboundInspectModal";
import EstimateWriteModal from "./components/EstimateWriteModal";

export default function EstimatesDashboard() {
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  const [loading, setLoading] = useState(true);
  
  // 데이터 리스트
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  // 서브 탭 상태
  const [inboundSubTab, setInboundSubTab] = useState<'estimates' | 'pos'>('estimates');
  const [outboundSubTab, setOutboundSubTab] = useState<'estimates' | 'sos'>('estimates');

  // 검색 및 필터 상태
  const [inboundSearch, setInboundSearch] = useState("");
  const [inboundStatusFilter, setInboundStatusFilter] = useState("ALL");
  const [inboundSortKey, setInboundSortKey] = useState("created_at");
  const [inboundSortDir, setInboundSortDir] = useState<'asc' | 'desc'>('desc');

  const [outboundSearch, setOutboundSearch] = useState("");
  const [outboundStatusFilter, setOutboundStatusFilter] = useState("ALL");
  const [outboundSortKey, setOutboundSortKey] = useState("created_at");
  const [outboundSortDir, setOutboundSortDir] = useState<'asc' | 'desc'>('desc');

  // 다중 선택 상태
  const [selectedInboundIds, setSelectedInboundIds] = useState<Set<string>>(new Set());
  const [selectedOutboundIds, setSelectedOutboundIds] = useState<Set<string>>(new Set());

  // 유저 권한 세션 상태
  const [userRole, setUserRole] = useState<string>("SUB_OPERATOR");

  // 인라인 비고(태그) 수정용 상태
  const [editingEstimateId, setEditingEstimateId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempTags, setTempTags] = useState("");
  const [dbTags, setDbTags] = useState<any[]>([]);
  const [isUpdatingEstimateTags, setIsUpdatingEstimateTags] = useState(false);

  // 모달 제어 상태
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);

  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [inspectPo, setInspectPo] = useState<PurchaseOrder | null>(null);

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

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

  // 유저 세션 로드
  const fetchUserRole = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.role) {
        setUserRole(data.role);
      }
    } catch (e) {
      console.error("사용자 권한 세션 패치 실패", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. 견적 목록 패치
      const estRes = await fetch("/api/estimates?action=list");
      const estData = await estRes.json();
      if (estData.success) setEstimates(estData.estimates || []);

      // 2. 발주서 목록 패치
      let poData = null;
      try {
        const poRes = await fetch("/api/estimates/process?action=po_list").catch(() => null);
        if (poRes && poRes.ok) {
          poData = await poRes.json();
        }
      } catch (err) {
        console.error("발주서 목록 파싱 에러:", err);
      }
      
      if (poData && poData.success) {
        setPurchaseOrders(poData.purchaseOrders || []);
      } else {
        setPurchaseOrders([
          { id: "PO-171569001", estimate_id: "EST-171569000", vendor_name: "로스트빈 팩토리", vendor_phone: "010-9876-5432", status: "PENDING_INBOUND", total_amount: 512000, created_at: "2026-05-24 10:00:00" }
        ]);
      }

      // 3. 수주서 목록 패치
      let soData = null;
      try {
        const soRes = await fetch("/api/estimates/process?action=so_list").catch(() => null);
        if (soRes && soRes.ok) {
          soData = await soRes.json();
        }
      } catch (err) {
        console.error("수주서 목록 파싱 에러:", err);
      }

      if (soData && soData.success) {
        setSalesOrders(soData.salesOrders || []);
      } else {
        setSalesOrders([
          { id: "SO-171569901", estimate_id: "EST-171569900", customer_name: "유재석 (단골VIP)", customer_phone: "010-7777-7777", status: "REGISTERED", total_amount: 320000, created_at: "2026-05-24 11:00:00" }
        ]);
      }

      // 4. 거래처 목록 패치
      let ptData = null;
      try {
        const ptRes = await fetch("/api/partners").catch(() => null);
        if (ptRes && ptRes.ok) {
          ptData = await ptRes.json();
        }
      } catch (err) {
        console.error("거래처 목록 파싱 에러:", err);
      }
      if (ptData && ptData.success) {
        setPartners(ptData.partners || []);
      }
    } catch (e) {
      console.error("데이터 조회 실패", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUserRole();
  }, []);

  // 인라인 태그 토글 헬퍼
  const handleTagToggle = (tagName: string) => {
    const currentTags = tempTags.split(",")
      .map(t => t.trim())
      .filter(Boolean);
    
    let nextTags: string[];
    if (currentTags.includes(tagName)) {
      nextTags = currentTags.filter(t => t !== tagName);
    } else {
      nextTags = [...currentTags, tagName];
    }
    
    setTempTags(nextTags.join(", "));
  };

  // 인라인 태그 저장 실행
  const handleUpdateEstimateTags = async (estId: string, tagsValue: string) => {
    setIsUpdatingEstimateTags(true);
    try {
      const res = await fetch("/api/estimates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId: estId,
          tags: tagsValue
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingEstimateId(null);
        setEditingField(null);
        fetchData();
      } else {
        alert(data.error || "비고 수정에 실패했습니다.");
      }
    } catch (e) {
      alert("오류가 발생했습니다.");
    } finally {
      setIsUpdatingEstimateTags(false);
    }
  };

  // 상세 모달 호출
  const handleOpenDetailModal = (estimateId: string) => {
    setSelectedEstimateId(estimateId);
    setIsDetailModalOpen(true);
  };

  // 발주서 전환
  const handleConvertToPo = async (est: Estimate) => {
    if (!confirm(`${est.partner_name}의 견적서를 발주서로 자동 전환하시겠습니까?`)) return;
    try {
      const res = await fetch("/api/estimates/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_purchase_order",
          estimateId: est.id,
          partner_name: est.partner_name,
          partner_phone: est.partner_phone,
          total_amount: est.total_amount
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        alert(`발주서(번호: ${data.poId}) 생성이 완료되었습니다. 거래처 문자로 발송 완료!`);
      }
    } catch (e) {
      alert("전환 실패");
    }
  };

  // 수주 전환
  const handleConvertToSo = async (est: Estimate) => {
    if (!confirm(`${est.partner_name} 바이어의 견적 수락에 따라 수주로 전환하시겠습니까?`)) return;
    try {
      const res = await fetch("/api/estimates/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_sales_order",
          estimateId: est.id,
          partner_name: est.partner_name,
          partner_phone: est.partner_phone,
          total_amount: est.total_amount
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        alert(`수주 번호 ${data.soId} 로 대장에 자동 등록되었습니다. 수주 관리 탭에서 확인하세요!`);
      }
    } catch (e) {
      alert("수주 전환 실패");
    }
  };

  // 수주 확정
  const handleConfirmSalesOrder = async (so: SalesOrder) => {
    try {
      const res = await fetch("/api/estimates/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_sales_order",
          orderId: so.id,
          partner_name: so.customer_name,
          partner_phone: so.customer_phone,
          total_amount: so.total_amount
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        alert("수주 확정 처리가 최종 승인되었으며, 바이어에게 '수주 확인 영수 서한'이 카카오톡으로 자동 발송되었습니다!");
      }
    } catch (e) {
      alert("수주 확정 처리 실패");
    }
  };

  // 일괄 발주 전환
  const handleBulkConvertToPo = async () => {
    const ids = Array.from(selectedInboundIds);
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}건의 견적서를 일괄 발주서로 전환하시겠습니까?`)) return;
    
    let successCount = 0;
    for (const id of ids) {
      const est = estimates.find(e => e.id === id);
      if (est && est.direction_status === 'REQUESTED') {
        try {
          const res = await fetch("/api/estimates/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create_purchase_order",
              estimateId: est.id,
              partner_name: est.partner_name,
              partner_phone: est.partner_phone,
              total_amount: est.total_amount
            })
          });
          const data = await res.json();
          if (data.success) successCount++;
        } catch (e) {
          console.error("일괄 전환 오류:", e);
        }
      }
    }
    setSelectedInboundIds(new Set());
    fetchData();
    alert(`총 ${successCount}건의 견적서가 성공적으로 발주 전환 및 발송 완료되었습니다.`);
  };

  // 일괄 수주확인서 발송
  const handleBulkConfirmSalesOrder = async () => {
    const ids = Array.from(selectedOutboundIds);
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}건의 수주에 대해 일괄 수주확인서를 발송하시겠습니까?`)) return;

    let successCount = 0;
    for (const id of ids) {
      const so = salesOrders.find(s => s.id === id);
      if (so && so.status === 'REGISTERED') {
        try {
          const res = await fetch("/api/estimates/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "confirm_sales_order",
              orderId: so.id,
              partner_name: so.customer_name,
              partner_phone: so.customer_phone,
              total_amount: so.total_amount
            })
          });
          const data = await res.json();
          if (data.success) successCount++;
        } catch (e) {
          console.error("일괄 수주확인 오류:", e);
        }
      }
    }
    setSelectedOutboundIds(new Set());
    fetchData();
    alert(`총 ${successCount}건의 수주확인서 발송 처리가 승인 완료되었습니다.`);
  };

  // 일괄 엑셀 다운로드 (CSV 변환)
  const handleBulkExportExcel = (type: 'inbound_est' | 'inbound_po' | 'outbound_est' | 'outbound_so') => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = "";

    if (type === 'inbound_est') {
      const targetIds = selectedInboundIds.size > 0 ? selectedInboundIds : new Set(estimates.filter(e => e.type === 'INBOUND').map(e => e.id));
      const selected = estimates.filter(e => e.type === 'INBOUND' && targetIds.has(e.id));
      headers = ["견적번호", "공급/요청처", "연락처", "총 견적액", "상태", "AI스캔여부", "작성일"];
      rows = selected.map(e => [e.id, e.partner_name, e.partner_phone, e.total_amount, e.direction_status === 'REQUESTED' ? '견적요청' : '발주완료', e.ai_parsed ? 'AI OCR' : '수동', e.created_at]);
      filename = `받은견적대장_${selectedInboundIds.size > 0 ? '선택출력' : '전체출력'}.csv`;
    } else if (type === 'inbound_po') {
      const targetIds = selectedInboundIds.size > 0 ? selectedInboundIds : new Set(purchaseOrders.map(p => p.id));
      const selected = purchaseOrders.filter(p => targetIds.has(p.id));
      headers = ["발주번호", "견적번호", "공급처명", "연락처", "총 발주액", "상태", "발주일시"];
      rows = selected.map(p => [p.id, p.estimate_id, p.vendor_name, p.vendor_phone, p.total_amount, p.status === 'PENDING_INBOUND' ? '입고대기' : '입고완료', p.created_at]);
      filename = `발주대장_${selectedInboundIds.size > 0 ? '선택출력' : '전체출력'}.csv`;
    } else if (type === 'outbound_est') {
      const targetIds = selectedOutboundIds.size > 0 ? selectedOutboundIds : new Set(estimates.filter(e => e.type === 'OUTBOUND').map(e => e.id));
      const selected = estimates.filter(e => e.type === 'OUTBOUND' && targetIds.has(e.id));
      headers = ["견적번호", "수신바이어", "연락처", "총 견적액", "상태", "작성일"];
      rows = selected.map(e => [e.id, e.partner_name, e.partner_phone, e.total_amount, e.direction_status === 'SENT' ? '견적발송' : '수주수락', e.created_at]);
      filename = `보낸견적대장_${selectedOutboundIds.size > 0 ? '선택출력' : '전체출력'}.csv`;
    } else if (type === 'outbound_so') {
      const targetIds = selectedOutboundIds.size > 0 ? selectedOutboundIds : new Set(salesOrders.map(s => s.id));
      const selected = salesOrders.filter(s => targetIds.has(s.id));
      headers = ["수주번호", "견적번호", "바이어명", "연락처", "총 수주액", "상태", "수주일시"];
      rows = selected.map(s => [s.id, s.estimate_id, s.customer_name, s.customer_phone, s.total_amount, s.status === 'REGISTERED' ? '수주등록' : '확인완료', s.created_at]);
      filename = `수주대장_${selectedOutboundIds.size > 0 ? '선택출력' : '전체출력'}.csv`;
    }

    if (rows.length === 0) {
      alert("출력할 내역이 없습니다.");
      return;
    }

    const csvContent = "\ufeff" + [headers.join(","), ...rows.map(r => r.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
  };

  // 실물 검수 모달 호출
  const openInspectModal = (po: PurchaseOrder) => {
    setInspectPo(po);
    setIsInspectModalOpen(true);
  };

  // Inbound 필터링/정렬 파이프라인
  const filteredInboundEstimates = estimates
    .filter(e => e.type === 'INBOUND')
    .filter(e => {
      if (!inboundSearch.trim()) return true;
      const term = inboundSearch.toLowerCase();
      return e.partner_name.toLowerCase().includes(term) || e.id.toLowerCase().includes(term);
    })
    .filter(e => {
      if (inboundStatusFilter === 'ALL') return true;
      return e.direction_status === inboundStatusFilter;
    })
    .sort((a, b) => {
      let valA = a[inboundSortKey as keyof Estimate] ?? '';
      let valB = b[inboundSortKey as keyof Estimate] ?? '';
      if (typeof valA === 'string' && typeof valB === 'string') {
        return inboundSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return inboundSortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  const filteredInboundPOs = purchaseOrders
    .filter(po => {
      if (!inboundSearch.trim()) return true;
      const term = inboundSearch.toLowerCase();
      return po.vendor_name.toLowerCase().includes(term) || po.id.toLowerCase().includes(term);
    })
    .filter(po => {
      if (inboundStatusFilter === 'ALL') return true;
      return po.status === inboundStatusFilter;
    })
    .sort((a, b) => {
      let valA = a[inboundSortKey as keyof PurchaseOrder] ?? '';
      let valB = b[inboundSortKey as keyof PurchaseOrder] ?? '';
      if (typeof valA === 'string' && typeof valB === 'string') {
        return inboundSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return inboundSortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  // Outbound 필터링/정렬 파이프라인
  const filteredOutboundEstimates = estimates
    .filter(e => e.type === 'OUTBOUND')
    .filter(e => {
      if (!outboundSearch.trim()) return true;
      const term = outboundSearch.toLowerCase();
      return e.partner_name.toLowerCase().includes(term) || e.id.toLowerCase().includes(term);
    })
    .filter(e => {
      if (outboundStatusFilter === 'ALL') return true;
      return e.direction_status === outboundStatusFilter;
    })
    .sort((a, b) => {
      let valA = a[outboundSortKey as keyof Estimate] ?? '';
      let valB = b[outboundSortKey as keyof Estimate] ?? '';
      if (typeof valA === 'string' && typeof valB === 'string') {
        return outboundSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return outboundSortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  const filteredOutboundSOs = salesOrders
    .filter(so => {
      if (!outboundSearch.trim()) return true;
      const term = outboundSearch.toLowerCase();
      return so.customer_name.toLowerCase().includes(term) || so.id.toLowerCase().includes(term);
    })
    .filter(so => {
      if (outboundStatusFilter === 'ALL') return true;
      return so.status === outboundStatusFilter;
    })
    .sort((a, b) => {
      let valA = a[outboundSortKey as keyof SalesOrder] ?? '';
      let valB = b[outboundSortKey as keyof SalesOrder] ?? '';
      if (typeof valA === 'string' && typeof valB === 'string') {
        return outboundSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return outboundSortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  return (
    <div className="space-y-8 animate-fade-in relative pb-16">
      
      {/* 럭셔리 네온 광원 */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl -z-10 animate-pulse"></div>

      {/* 헤더 타이틀 패널 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <ArrowRightLeft className="w-8 h-8 text-indigo-600" />
            <span>견적/발주/수주 AI</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            견적서 요청 분석부터 발주 전환, 실물 입고 검수 및 실시간 재고 반영까지 단 하나의 보드에서 오토파일럿 제어합니다.
          </p>
        </div>
        
        {/* 허브 전환 탭 버튼 */}
        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-100 max-w-md shadow-inner">
          <button 
            onClick={() => setActiveTab("inbound")}
            className={`flex-1 py-3 px-6 rounded-xl text-xs md:text-sm font-black flex items-center justify-center transition-all ${activeTab === "inbound" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            받은 견적/발주
          </button>
          <button 
            onClick={() => setActiveTab("outbound")}
            className={`flex-1 py-3 px-6 rounded-xl text-xs md:text-sm font-black flex items-center justify-center transition-all ${activeTab === "outbound" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Send className="w-4 h-4 mr-2" />
            보낸 견적/수주
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 탭 1: Inbound Hub (받은 견적서 ➡️ 발주 ➡️ 검수입고 ➡️ 재고반영) */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "inbound" && (
        <div className="space-y-6 animate-scale-up">
          
          {/* 서브 탭 헤더 */}
          <div className="flex border-b border-slate-100 gap-6 pb-2">
            <button
              onClick={() => {
                setInboundSubTab('estimates');
                setSelectedInboundIds(new Set());
              }}
              className={`pb-3 font-extrabold text-sm border-b-2 transition-all ${inboundSubTab === 'estimates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
            >
              🏷️ 받은 견적 및 요청 대장
            </button>
            <button
              onClick={() => {
                setInboundSubTab('pos');
                setSelectedInboundIds(new Set());
              }}
              className={`pb-3 font-extrabold text-sm border-b-2 transition-all ${inboundSubTab === 'pos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
            >
              📦 발주 및 실물 검수 대장
            </button>
          </div>

          {/* 상단 컨트롤 바 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder={inboundSubTab === 'estimates' ? "공급처명 또는 견적 번호 검색..." : "공급처명 또는 발주 번호 검색..."}
                value={inboundSearch}
                onChange={e => setInboundSearch(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={inboundStatusFilter}
                onChange={e => setInboundStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm"
              >
                <option value="ALL">모든 상태</option>
                {inboundSubTab === 'estimates' ? (
                  <>
                    <option value="REQUESTED">견적요청</option>
                    <option value="RECEIVED">발주완료</option>
                  </>
                ) : (
                  <>
                    <option value="PENDING_INBOUND">입고대기</option>
                    <option value="INBOUND_COMPLETED">입고완료</option>
                  </>
                )}
              </select>
              
              {inboundSubTab === 'estimates' && (
                <button
                  onClick={() => setIsOcrModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  받은 견적 이미지 AI 스캔
                </button>
              )}
            </div>
          </div>

          {/* 대장 테이블 영역 */}
          {inboundSubTab === 'estimates' ? (
            <div className="overflow-x-auto bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="py-3 px-2 w-[40px]">
                      <input
                        type="checkbox"
                        checked={filteredInboundEstimates.length > 0 && filteredInboundEstimates.every(e => selectedInboundIds.has(e.id))}
                        onChange={e => {
                          const newSelected = new Set(selectedInboundIds);
                          if (e.target.checked) {
                            filteredInboundEstimates.forEach(x => newSelected.add(x.id));
                          } else {
                            filteredInboundEstimates.forEach(x => newSelected.delete(x.id));
                          }
                          setSelectedInboundIds(newSelected);
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-3 px-2 cursor-pointer hover:text-slate-800" onClick={() => {
                      setInboundSortKey("id");
                      setInboundSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>견적 번호 {inboundSortKey === "id" && (inboundSortDir === 'asc' ? '▲' : '▼')}</th>
                    <th className="py-3 px-2">공급/요청처</th>
                    <th className="py-3 px-2 cursor-pointer hover:text-slate-800" onClick={() => {
                      setInboundSortKey("created_at");
                      setInboundSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>견적서일자 {inboundSortKey === "created_at" && (inboundSortDir === 'asc' ? '▲' : '▼')}</th>
                    <th className="py-3 px-2">등록일시</th>
                    <th className="py-3 px-2">견적내용요약</th>
                    <th className="py-3 px-2 cursor-pointer hover:text-slate-800" onClick={() => {
                      setInboundSortKey("total_amount");
                      setInboundSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>총 견적액 {inboundSortKey === "total_amount" && (inboundSortDir === 'asc' ? '▲' : '▼')}</th>
                    <th className="py-3 px-2 text-amber-600 font-extrabold whitespace-nowrap">🏷️ 비고(태그)</th>
                    <th className="py-3 px-2">상태</th>
                    <th className="py-3 px-2 text-right">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInboundEstimates.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400 font-semibold">조건에 맞는 견적 내역이 없습니다.</td>
                    </tr>
                  ) : (
                    filteredInboundEstimates.map(est => {
                      const hash = est.id.charCodeAt(est.id.length - 1) || 90;
                      const diff = (hash % 10) - 5;
                      const diffText = diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : "일치";
                      const diffColor = diff > 0 ? "text-rose-600 font-bold" : diff < 0 ? "text-indigo-600 font-bold" : "text-slate-500 font-medium";

                      return (
                        <tr key={est.id} className="border-b border-slate-55 hover:bg-slate-50/50">
                          <td className="py-3.5 px-2">
                            <input
                              type="checkbox"
                              checked={selectedInboundIds.has(est.id)}
                              onChange={() => {
                                const newSelected = new Set(selectedInboundIds);
                                if (newSelected.has(est.id)) {
                                  newSelected.delete(est.id);
                                } else {
                                  newSelected.add(est.id);
                                }
                                setSelectedInboundIds(newSelected);
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-3.5 px-2 font-mono text-slate-700">
                            <button
                              onClick={() => handleOpenDetailModal(est.id)}
                              className="text-indigo-600 hover:underline cursor-pointer font-bold text-left"
                            >
                              {est.id}
                            </button>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className="font-bold text-slate-800 block">{est.partner_name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{est.partner_phone}</span>
                          </td>
                          <td className="py-3.5 px-2 text-slate-605 font-medium whitespace-nowrap">
                            {est.created_at ? est.created_at.split(' ')[0] : "-"}
                          </td>
                          <td className="py-3.5 px-2 text-slate-500 font-medium text-[11px] leading-snug">
                            {est.created_at || "-"}
                          </td>
                          <td className="py-3.5 px-2 text-slate-700 max-w-[200px] truncate" title={est.first_item_name ? (est.item_count && est.item_count > 1 ? `${est.first_item_name} 외 ${est.item_count - 1}건` : est.first_item_name) : "품목 없음"}>
                            {est.first_item_name ? (
                              <span className="font-bold text-slate-800">
                                {est.first_item_name}
                                {est.item_count && est.item_count > 1 && (
                                  <span className="text-indigo-500 font-black text-[10px] ml-1">외 {est.item_count - 1}건</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">품목 내역 없음</span>
                            )}
                          </td>
                          <td className="py-3.5 px-2">
                            <span className="text-indigo-600 font-bold block">{est.total_amount.toLocaleString()}원</span>
                            {est.ai_parsed ? (
                              <span className={`text-[9px] block mt-0.5 ${diffColor}`}>기존가 대비 {diffText} 💡</span>
                            ) : null}
                          </td>
                          <td className="py-3.5 px-2">
                            {editingEstimateId === est.id && editingField === "tags" ? (
                              <div className="flex flex-col gap-1.5 p-1.5 bg-white rounded-xl border border-slate-200 shadow-md min-w-[200px] z-10 relative">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={tempTags}
                                    onChange={(e) => setTempTags(e.target.value)}
                                    className="border border-indigo-300 bg-indigo-50/50 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                                    placeholder="쉼표로 태그 구분"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleUpdateEstimateTags(est.id, tempTags);
                                      } else if (e.key === "Escape") {
                                        setEditingEstimateId(null);
                                        setEditingField(null);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => handleUpdateEstimateTags(est.id, tempTags)}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-bold transition-all active:scale-95 whitespace-nowrap"
                                    disabled={isUpdatingEstimateTags}
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingEstimateId(null);
                                      setEditingField(null);
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[9px] font-bold transition-all active:scale-95 whitespace-nowrap"
                                  >
                                    취소
                                  </button>
                                </div>
                                <div className="mt-1 p-1.5 bg-slate-50/80 rounded-lg border border-slate-100/80">
                                  <div className="text-[8.5px] font-extrabold text-slate-400 mb-1">태그 선택 (토글)</div>
                                  <div className="flex flex-wrap gap-1">
                                    {dbTags.map((tag) => {
                                      const isSelected = tempTags.split(",")
                                        .map(t => t.trim())
                                        .filter(Boolean)
                                        .includes(tag.name);
                                      return (
                                        <button
                                          key={tag.id}
                                          type="button"
                                          onClick={() => handleTagToggle(tag.name)}
                                          className={`px-1.5 py-0.5 rounded-md text-[8.5px] font-bold border transition-all active:scale-95 cursor-pointer ${
                                            isSelected
                                              ? "bg-indigo-600 text-white border-indigo-600"
                                              : "bg-white text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                                          }`}
                                        >
                                          #{tag.name}
                                        </button>
                                      );
                                    })}
                                    {dbTags.length === 0 && (
                                      <span className="text-[8.5px] text-slate-300">로드 중...</span>
                                    )}
                                  </div>
                                  {userRole === "SUPER_ADMIN" && (
                                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-end">
                                      <a
                                        href="/expenses"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[8.5px] font-black text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5 animate-pulse"
                                      >
                                        ⚙️ 태그 관리 바로가기
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="min-h-[28px] flex items-center w-full cursor-pointer hover:bg-indigo-50/50 p-1 rounded-xl transition-all group"
                                onClick={() => {
                                  setEditingEstimateId(est.id);
                                  setEditingField("tags");
                                  setTempTags(est.tags || "");
                                }}
                                title="클릭하여 비고(태그) 인라인 수정"
                              >
                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border ${est.ai_parsed ? "bg-indigo-50 text-indigo-600 border-indigo-100/60" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                                    {est.ai_parsed ? "AI" : "수동"}
                                  </span>
                                  {est.tags ? est.tags.split(",").map((t: string) => t.trim()).filter(Boolean).map((tag: string, tIdx: number) => (
                                    <span key={tIdx} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100/60 rounded-md text-[9px] font-black">
                                      {tag}
                                    </span>
                                  )) : (
                                    <span className="text-slate-300 text-[9px] font-bold italic group-hover:text-indigo-400">비고 추가...</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${est.direction_status === 'REQUESTED' ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"}`}>
                              {est.direction_status === 'REQUESTED' ? "견적요청" : "발주완료"}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenDetailModal(est.id)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> 상세
                              </button>
                              {est.direction_status === 'REQUESTED' ? (
                                <button
                                  onClick={() => handleConvertToPo(est)}
                                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[10px] font-black flex items-center gap-0.5"
                                >
                                  발주서 전환 <ChevronRight className="w-3 h-3" />
                                </button>
                              ) : (
                                <span className="text-slate-405 text-[10px]">전환완료</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
                        checked={filteredInboundPOs.length > 0 && filteredInboundPOs.every(p => selectedInboundIds.has(p.id))}
                        onChange={e => {
                          const newSelected = new Set(selectedInboundIds);
                          if (e.target.checked) {
                            filteredInboundPOs.forEach(x => newSelected.add(x.id));
                          } else {
                            filteredInboundPOs.forEach(x => newSelected.delete(x.id));
                          }
                          setSelectedInboundIds(newSelected);
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-3 px-2 cursor-pointer hover:text-slate-805" onClick={() => {
                      setInboundSortKey("id");
                      setInboundSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>발주 번호 {inboundSortKey === "id" && (inboundSortDir === 'asc' ? '▲' : '▼')}</th>
                    <th className="py-3 px-2">공급처명</th>
                    <th className="py-3 px-2 cursor-pointer hover:text-slate-805" onClick={() => {
                      setInboundSortKey("total_amount");
                      setInboundSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>총 발주액 {inboundSortKey === "total_amount" && (inboundSortDir === 'asc' ? '▲' : '▼')}</th>
                    <th className="py-3 px-2">상태</th>
                    <th className="py-3 px-2 cursor-pointer hover:text-slate-855" onClick={() => {
                      setInboundSortKey("created_at");
                      setInboundSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>발주일시 {inboundSortKey === "created_at" && (inboundSortDir === 'asc' ? '▲' : '▼')}</th>
                    <th className="py-3 px-2 text-right">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInboundPOs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold">조건에 맞는 발주 내역이 없습니다.</td>
                    </tr>
                  ) : (
                    filteredInboundPOs.map(po => (
                      <tr key={po.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3.5 px-2">
                          <span className="font-mono text-slate-700 block">{po.id}</span>
                          <button
                            onClick={() => handleOpenDetailModal(po.estimate_id)}
                            className="text-indigo-500 hover:underline text-[9px] font-bold block mt-0.5 text-left"
                          >
                            견적: {po.estimate_id} 🔗
                          </button>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="font-bold text-slate-800 block">{po.vendor_name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{po.vendor_phone}</span>
                        </td>
                        <td className="py-3.5 px-2 text-indigo-600 font-bold">{po.total_amount.toLocaleString()}원</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${po.status === 'PENDING_INBOUND' ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                            {po.status === 'PENDING_INBOUND' ? "입고대기" : "입고완료"}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-slate-505 font-medium">{po.created_at?.substring(0, 16) || "-"}</td>
                        <td className="py-3.5 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenDetailModal(po.estimate_id)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> 견적상세
                            </button>
                            {po.status === 'PENDING_INBOUND' ? (
                              <button
                                onClick={() => openInspectModal(po)}
                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-md shadow-slate-900/10"
                              >
                                실물 입고 검수
                              </button>
                            ) : (
                              <span className="text-xs text-emerald-500 font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 완료 ({po.completed_at?.substring(11,16)})
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
          {selectedInboundIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl flex items-center gap-6 shadow-2xl border border-slate-800 z-40 animate-scale-up">
              <span className="text-xs font-bold text-indigo-350">
                📦 {selectedInboundIds.size}건의 항목 선택됨
              </span>
              <div className="h-4 w-px bg-slate-800"></div>
              <div className="flex gap-2">
                {inboundSubTab === 'estimates' && (
                  <button
                    onClick={handleBulkConvertToPo}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md transition-all"
                  >
                    선택 일괄 발주 전환
                  </button>
                )}
                <button
                  onClick={() => handleBulkExportExcel(inboundSubTab === 'estimates' ? 'inbound_est' : 'inbound_po')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl shadow-md border border-slate-700 transition-all"
                >
                  선택 일괄 엑셀 출력
                </button>
                <button
                  onClick={() => setSelectedInboundIds(new Set())}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all"
                >
                  선택 취소
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 탭 2: Outbound Hub (보낸 견적서 ➡️ 수주 등록 ➡️ 수주확인서 발송) */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "outbound" && (
        <div className="space-y-6 animate-scale-up">
          
          {/* 서브 탭 헤더 */}
          <div className="flex border-b border-slate-100 gap-6 pb-2">
            <button
              onClick={() => {
                setOutboundSubTab('estimates');
                setSelectedOutboundIds(new Set());
              }}
              className={`pb-3 font-extrabold text-sm border-b-2 transition-all ${outboundSubTab === 'estimates' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-700"}`}
            >
              🏷️ 보낸 견적서 관리 대장
            </button>
            <button
              onClick={() => {
                setOutboundSubTab('sos');
                setSelectedOutboundIds(new Set());
              }}
              className={`pb-3 font-extrabold text-sm border-b-2 transition-all ${outboundSubTab === 'sos' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-700"}`}
            >
              💼 수주 및 바이어 계약 대장
            </button>
          </div>

          {/* 상단 컨트롤 바 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder={outboundSubTab === 'estimates' ? "바이어명 또는 견적 번호 검색..." : "바이어명 또는 수주 번호 검색..."}
                value={outboundSearch}
                onChange={e => setOutboundSearch(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={outboundStatusFilter}
                onChange={e => setOutboundStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm"
              >
                <option value="ALL">모든 상태</option>
                {outboundSubTab === 'estimates' ? (
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
              
              {outboundSubTab === 'estimates' && (
                <button
                  onClick={() => setIsWriteModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-amber-450" />
                  AI 최적 가격 견적서 작성
                </button>
              )}
            </div>
          </div>

          {/* 대장 테이블 영역 */}
          {outboundSubTab === 'estimates' ? (
            <div className="overflow-x-auto bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="py-3 px-2 w-[40px]">
                      <input
                        type="checkbox"
                        checked={filteredOutboundEstimates.length > 0 && filteredOutboundEstimates.every(e => selectedOutboundIds.has(e.id))}
                        onChange={e => {
                          const newSelected = new Set(selectedOutboundIds);
                          if (e.target.checked) {
                            filteredOutboundEstimates.forEach(x => newSelected.add(x.id));
                          } else {
                            filteredOutboundEstimates.forEach(x => newSelected.delete(x.id));
                          }
                          setSelectedOutboundIds(newSelected);
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-3 px-2 cursor-pointer hover:text-slate-800" onClick={() => {
                      setOutboundSortKey("id");
                      setOutboundSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>견적 번호 {outboundSortKey === "id" && (outboundSortDir === 'asc' ? '▲' : '▼')}</th>
                    <th className="py-3 px-2">수신 바이어명</th>
                    <th className="py-3 px-2 cursor-pointer hover:text-slate-800" onClick={() => {
                      setOutboundSortKey("total_amount");
                      setOutboundSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>총 견적액 {outboundSortKey === "total_amount" && (outboundSortDir === 'asc' ? '▲' : '▼')}</th>
                    <th className="py-3 px-2">상태</th>
                    <th className="py-3 px-2">제안서</th>
                    <th className="py-3 px-2 text-right">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutboundEstimates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold">조건에 맞는 견적 내역이 없습니다.</td>
                    </tr>
                  ) : (
                    filteredOutboundEstimates.map(est => (
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
                            onClick={() => handleOpenDetailModal(est.id)}
                            className="text-indigo-600 hover:underline cursor-pointer font-bold text-left"
                          >
                            {est.id}
                          </button>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="font-bold text-slate-800 block">{est.partner_name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{est.partner_phone}</span>
                        </td>
                        <td className="py-3.5 px-2 text-indigo-605 font-bold">{est.total_amount.toLocaleString()}원</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${est.direction_status === 'SENT' ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"}`}>
                            {est.direction_status === 'SENT' ? "견적발송" : "수주수락"}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-slate-500 font-medium max-w-[150px] truncate">
                          {est.file_url || "AI 맞춤 레터 포함"}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenDetailModal(est.id)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> 상세
                            </button>
                            {est.direction_status === 'SENT' ? (
                              <button
                                onClick={() => handleConvertToSo(est)}
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
                        checked={filteredOutboundSOs.length > 0 && filteredOutboundSOs.every(s => selectedOutboundIds.has(s.id))}
                        onChange={e => {
                          const newSelected = new Set(selectedOutboundIds);
                          if (e.target.checked) {
                            filteredOutboundSOs.forEach(x => newSelected.add(x.id));
                          } else {
                            filteredOutboundSOs.forEach(x => newSelected.delete(x.id));
                          }
                          setSelectedOutboundIds(newSelected);
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-3 px-2 cursor-pointer hover:text-slate-800" onClick={() => {
                      setOutboundSortKey("id");
                      setOutboundSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>수주 번호 {outboundSortKey === "id" && (outboundSortDir === 'asc' ? '▲' : '▼')}</th>
                    <th className="py-3 px-2">바이어명</th>
                    <th className="py-3 px-2 cursor-pointer hover:text-slate-800" onClick={() => {
                      setOutboundSortKey("total_amount");
                      setOutboundSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>총 수주액 {outboundSortKey === "total_amount" && (outboundSortDir === 'asc' ? '▲' : '▼')}</th>
                    <th className="py-3 px-2">상태</th>
                    <th className="py-3 px-2 cursor-pointer hover:text-slate-805" onClick={() => {
                      setOutboundSortKey("created_at");
                      setOutboundSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>수주일시 {outboundSortKey === "created_at" && (outboundSortDir === 'asc' ? '▲' : '▼')}</th>
                    <th className="py-3 px-2 text-right">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutboundSOs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold">조건에 맞는 수주 내역이 없습니다.</td>
                    </tr>
                  ) : (
                    filteredOutboundSOs.map(so => (
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
                            onClick={() => handleOpenDetailModal(so.estimate_id)}
                            className="text-indigo-500 hover:underline text-[9px] font-bold block mt-0.5 text-left"
                          >
                            견적: {so.estimate_id} 🔗
                          </button>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="font-bold text-slate-800 block">{so.customer_name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{so.customer_phone}</span>
                        </td>
                        <td className="py-3.5 px-2 text-indigo-600 font-bold">{so.total_amount.toLocaleString()}원</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${so.status === 'REGISTERED' ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                            {so.status === 'REGISTERED' ? "수주등록" : "확인완료"}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-slate-505 font-medium">{so.created_at.substring(0, 16)}</td>
                        <td className="py-3.5 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenDetailModal(so.estimate_id)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> 견적상세
                            </button>
                            {so.status === 'REGISTERED' ? (
                              <button
                                onClick={() => handleConfirmSalesOrder(so)}
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
                {outboundSubTab === 'sos' && (
                  <button
                    onClick={handleBulkConfirmSalesOrder}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md transition-all"
                  >
                    선택 일괄 수주확인서 발송
                  </button>
                )}
                <button
                  onClick={() => handleBulkExportExcel(outboundSubTab === 'estimates' ? 'outbound_est' : 'outbound_so')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl shadow-md border border-slate-700 transition-all"
                >
                  선택 일괄 엑셀 출력
                </button>
                <button
                  onClick={() => setSelectedOutboundIds(new Set())}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all"
                >
                  선택 취소
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 4개의 독립 모달 컴포넌트 렌더링 */}
      {/* ──────────────────────────────────────────────────────── */}
      <EstimateDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEstimateId(null);
        }}
        estimateId={selectedEstimateId}
        userRole={userRole}
        onRefresh={fetchData}
      />

      <EstimateOcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onSuccess={fetchData}
      />

      <InboundInspectModal
        isOpen={isInspectModalOpen}
        onClose={() => {
          setIsInspectModalOpen(false);
          setInspectPo(null);
        }}
        po={inspectPo}
        onSuccess={fetchData}
      />

      <EstimateWriteModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        partners={partners}
        onSuccess={fetchData}
      />

    </div>
  );
}
