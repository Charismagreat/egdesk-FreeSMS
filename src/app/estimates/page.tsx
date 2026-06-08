"use client";

import React, { useState, useEffect } from "react";

// 분리한 타입 및 모달 컴포넌트 가져오기
import { Estimate, PurchaseOrder, SalesOrder, Partner } from "./types";
import EstimateDetailModal from "./components/EstimateDetailModal";
import EstimateOcrModal from "./components/EstimateOcrModal";
import InboundInspectModal from "./components/InboundInspectModal";
import EstimateWriteModal from "./components/EstimateWriteModal";

// 신설한 격리 하위 컴포넌트 가져오기
import EstimatesHeader from "./components/EstimatesHeader";
import InboundHub from "./components/InboundHub";
import OutboundHub from "./components/OutboundHub";

export default function EstimatesDashboard() {
  const [activeTab, setActiveTab] = useState<"inbound" | "outbound">("inbound");
  const [loading, setLoading] = useState(true);

  // 데이터 리스트 상태
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  // 유저 권한 세션 상태
  const [userRole, setUserRole] = useState<string>("SUB_OPERATOR");
  const [dbTags, setDbTags] = useState<any[]>([]);

  // 모달 제어 상태
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);

  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrInitialData, setOcrInitialData] = useState<any | null>(null);

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
          {
            id: "PO-171569001",
            estimate_id: "EST-171569000",
            vendor_name: "로스트빈 팩토리",
            vendor_phone: "010-9876-5432",
            status: "PENDING_INBOUND",
            total_amount: 512000,
            created_at: "2026-05-24 10:00:00",
          },
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
          {
            id: "SO-171569901",
            estimate_id: "EST-171569900",
            customer_name: "유재석 (단골VIP)",
            customer_phone: "010-7777-7777",
            status: "REGISTERED",
            total_amount: 320000,
            created_at: "2026-05-24 11:00:00",
          },
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

    // 이지봇 연동 자동 OCR 팝업 트리거 감지
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("ocr_import") === "true") {
        try {
          const pendingStr = sessionStorage.getItem("pending_estimate_ocr");
          if (pendingStr) {
            const parsed = JSON.parse(pendingStr);
            setOcrInitialData(parsed);
            setIsOcrModalOpen(true);
            
            // 중복 실행 및 리로드 방지를 위해 클린업
            sessionStorage.removeItem("pending_estimate_ocr");
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
          }
        } catch (e) {
          console.error("이지봇 OCR 데이터 로드 실패:", e);
        }
      }
    }
  }, []);

  // 인라인 태그 저장 실행
  const handleUpdateEstimateTags = async (estId: string, tagsValue: string) => {
    try {
      const res = await fetch("/api/estimates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId: estId,
          tags: tagsValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "비고 수정에 실패했습니다.");
      }
    } catch (e) {
      alert("오류가 발생했습니다.");
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
          total_amount: est.total_amount,
        }),
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
          total_amount: est.total_amount,
        }),
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
          total_amount: so.total_amount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        alert(
          "수주 확정 처리가 최종 승인되었으며, 바이어에게 '수주 확인 영수 서한'이 카카오톡으로 자동 발송되었습니다!"
        );
      }
    } catch (e) {
      alert("수주 확정 처리 실패");
    }
  };

  // 일괄 발주 전환
  const handleBulkConvertToPo = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}건의 견적서를 일괄 발주서로 전환하시겠습니까?`)) return;

    let successCount = 0;
    for (const id of ids) {
      const est = estimates.find((e) => e.id === id);
      if (est && est.direction_status === "REQUESTED") {
        try {
          const res = await fetch("/api/estimates/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create_purchase_order",
              estimateId: est.id,
              partner_name: est.partner_name,
              partner_phone: est.partner_phone,
              total_amount: est.total_amount,
            }),
          });
          const data = await res.json();
          if (data.success) successCount++;
        } catch (e) {
          console.error("일괄 전환 오류:", e);
        }
      }
    }
    fetchData();
    alert(`총 ${successCount}건의 견적서가 성공적으로 발주 전환 및 발송 완료되었습니다.`);
  };

  // 일괄 수주확인서 발송
  const handleBulkConfirmSalesOrder = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}건의 수주에 대해 일괄 수주확인서를 발송하시겠습니까?`)) return;

    let successCount = 0;
    for (const id of ids) {
      const so = salesOrders.find((s) => s.id === id);
      if (so && so.status === "REGISTERED") {
        try {
          const res = await fetch("/api/estimates/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "confirm_sales_order",
              orderId: so.id,
              partner_name: so.customer_name,
              partner_phone: so.customer_phone,
              total_amount: so.total_amount,
            }),
          });
          const data = await res.json();
          if (data.success) successCount++;
        } catch (e) {
          console.error("일괄 수주확인 오류:", e);
        }
      }
    }
    fetchData();
    alert(`총 ${successCount}건의 수주확인서 발송 처리가 승인 완료되었습니다.`);
  };

  // 일괄 엑셀 다운로드 (CSV 변환)
  const handleBulkExportExcel = (
    type: "inbound_est" | "inbound_po" | "outbound_est" | "outbound_so",
    selectedIds: Set<string>
  ) => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = "";

    if (type === "inbound_est") {
      const targetIds =
        selectedIds.size > 0
          ? selectedIds
          : new Set(estimates.filter((e) => e.type === "INBOUND").map((e) => e.id));
      const selected = estimates.filter(
        (e) => e.type === "INBOUND" && targetIds.has(e.id)
      );
      headers = ["견적번호", "공급/요청처", "연락처", "총 견적액", "상태", "AI스캔여부", "작성일"];
      rows = selected.map((e) => [
        e.id,
        e.partner_name,
        e.partner_phone,
        e.total_amount,
        e.direction_status === "REQUESTED" ? "견적요청" : "발주완료",
        e.ai_parsed ? "AI OCR" : "수동",
        e.created_at,
      ]);
      filename = `받은견적대장_${selectedIds.size > 0 ? "선택출력" : "전체출력"}.csv`;
    } else if (type === "inbound_po") {
      const targetIds =
        selectedIds.size > 0 ? selectedIds : new Set(purchaseOrders.map((p) => p.id));
      const selected = purchaseOrders.filter((p) => targetIds.has(p.id));
      headers = ["발주번호", "견적번호", "공급처명", "연락처", "총 발주액", "상태", "발주일시"];
      rows = selected.map((p) => [
        p.id,
        p.estimate_id,
        p.vendor_name,
        p.vendor_phone,
        p.total_amount,
        p.status === "PENDING_INBOUND" ? "입고대기" : "입고완료",
        p.created_at,
      ]);
      filename = `발주대장_${selectedIds.size > 0 ? "선택출력" : "전체출력"}.csv`;
    } else if (type === "outbound_est") {
      const targetIds =
        selectedIds.size > 0
          ? selectedIds
          : new Set(estimates.filter((e) => e.type === "OUTBOUND").map((e) => e.id));
      const selected = estimates.filter(
        (e) => e.type === "OUTBOUND" && targetIds.has(e.id)
      );
      headers = ["견적번호", "수신바이어", "연락처", "총 견적액", "상태", "작성일"];
      rows = selected.map((e) => [
        e.id,
        e.partner_name,
        e.partner_phone,
        e.total_amount,
        e.direction_status === "SENT" ? "견적발송" : "수주수락",
        e.created_at,
      ]);
      filename = `보낸견적대장_${selectedIds.size > 0 ? "선택출력" : "전체출력"}.csv`;
    } else if (type === "outbound_so") {
      const targetIds =
        selectedIds.size > 0 ? selectedIds : new Set(salesOrders.map((s) => s.id));
      const selected = salesOrders.filter((s) => targetIds.has(s.id));
      headers = ["수주번호", "견적번호", "바이어명", "연락처", "총 수주액", "상태", "수주일시"];
      rows = selected.map((s) => [
        s.id,
        s.estimate_id,
        s.customer_name,
        s.customer_phone,
        s.total_amount,
        s.status === "REGISTERED" ? "수주등록" : "확인완료",
        s.created_at,
      ]);
      filename = `수주대장_${selectedIds.size > 0 ? "선택출력" : "전체출력"}.csv`;
    }

    if (rows.length === 0) {
      alert("출력할 내역이 없습니다.");
      return;
    }

    const csvContent =
      "\ufeff" +
      [
        headers.join(","),
        ...rows.map((r) =>
          r.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 실물 검수 모달 호출
  const openInspectModal = (po: PurchaseOrder) => {
    setInspectPo(po);
    setIsInspectModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-16">
      {/* 럭셔리 네온 광원 */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl -z-10 animate-pulse"></div>

      {/* 헤더 타이틀 패널 */}
      <EstimatesHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {loading ? (
        <div className="text-center py-24 text-slate-400 font-semibold">데이터를 로드하는 중입니다...</div>
      ) : (
        <>
          {/* 탭 1: Inbound Hub (받은 견적서 ➡️ 발주 ➡️ 검수입고 ➡️ 재고반영) */}
          {activeTab === "inbound" && (
            <InboundHub
              estimates={estimates}
              purchaseOrders={purchaseOrders}
              userRole={userRole}
              dbTags={dbTags}
              onOpenDetailModal={handleOpenDetailModal}
              onOpenOcrModal={() => setIsOcrModalOpen(true)}
              onOpenInspectModal={openInspectModal}
              onConvertToPo={handleConvertToPo}
              onBulkConvertToPo={handleBulkConvertToPo}
              onUpdateTags={handleUpdateEstimateTags}
              onBulkExportExcel={handleBulkExportExcel}
            />
          )}

          {/* 탭 2: Outbound Hub (보낸 견적서 ➡️ 수주 등록 ➡️ 수주확인서 발송) */}
          {activeTab === "outbound" && (
            <OutboundHub
              estimates={estimates}
              salesOrders={salesOrders}
              partners={partners}
              onOpenDetailModal={handleOpenDetailModal}
              onOpenWriteModal={() => setIsWriteModalOpen(true)}
              onConvertToSo={handleConvertToSo}
              onConfirmSalesOrder={handleConfirmSalesOrder}
              onBulkConfirmSalesOrder={handleBulkConfirmSalesOrder}
              onBulkExportExcel={handleBulkExportExcel}
            />
          )}
        </>
      )}

      {/* 4개의 독립 모달 컴포넌트 렌더링 */}
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
        onClose={() => {
          setIsOcrModalOpen(false);
          setOcrInitialData(null);
        }}
        onSuccess={() => {
          fetchData();
          setOcrInitialData(null);
        }}
        initialData={ocrInitialData}
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
