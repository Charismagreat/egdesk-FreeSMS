"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, Sparkles, ArrowRightLeft, Plus, Check, Send, Phone, Clipboard, 
  ShoppingCart, Upload, Eye, CheckCircle2, ChevronRight, RefreshCw, X, Box, Info
} from "lucide-react";

// 타입 선언
interface Estimate {
  id: string;
  type: 'INBOUND' | 'OUTBOUND';
  direction_status: 'REQUESTED' | 'DRAFT' | 'SENT' | 'RECEIVED';
  partner_name: string;
  partner_phone: string;
  total_amount: number;
  file_url?: string;
  ai_parsed: number;
  created_at: string;
}

interface PurchaseOrder {
  id: string;
  estimate_id: string;
  vendor_name: string;
  vendor_phone: string;
  status: 'PENDING_INBOUND' | 'INBOUND_COMPLETED';
  total_amount: number;
  created_at: string;
  completed_at?: string;
}

interface SalesOrder {
  id: string;
  estimate_id: string;
  customer_name: string;
  customer_phone: string;
  status: 'REGISTERED' | 'CONFIRMED';
  total_amount: number;
  created_at: string;
}

export default function EstimatesDashboard() {
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  const [loading, setLoading] = useState(true);
  
  // 데이터 리스트
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);

  // 거래처 파트너 리스트 상태
  interface Partner {
    id: string;
    type: 'VENDOR' | 'BUYER';
    company_name: string;
    vip_level: string;
    phone: string;
  }
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState("direct");

  // 신규 수동/OCR 입력 모달 상태 (받은 견적서 등록)
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrFilename, setOcrFilename] = useState("");
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  
  // OCR 파싱 결과 바인딩용 폼
  const [ocrForm, setOcrForm] = useState({
    partner_name: "",
    partner_phone: "",
    items: [] as Array<{ product_name: string; quantity: number; unit_price: number }>
  });

  // 실물 입고 검수 수량 입력 모달 상태
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [inspectPo, setInspectPo] = useState<PurchaseOrder | null>(null);
  const [inspectItems, setInspectItems] = useState<Array<{ product_name: string; quantity: number; checkedQty: number; unit_price: number }>>([]);
  const [inspectSubmitting, setInspectSubmitting] = useState(false);

  // 보낼 견적 자동 작성 모달 상태
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [writePartner, setWritePartner] = useState("");
  const [writePhone, setWritePhone] = useState("");
  const [writeItems, setWriteItems] = useState<Array<{ product_name: string; quantity: number; unit_price: number }>>([
    { product_name: "에티오피아 예가체프 G1 워시드 원두 1kg", quantity: 15, unit_price: 18500 }
  ]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingResult, setPricingResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

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
      
      // 발주서 목록이 없을 경우 모의 데이터로 안정 맵핑
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

  // 1. 모의 이미지 파일 업로드 후 AI OCR 가동
  const handleOcrUpload = () => {
    setOcrScanning(true);
    setOcrSuccess(false);
    setOcrFilename("invoice_roasted_bean_524.png");

    setTimeout(async () => {
      // OCR 파싱 API POST 호출 (filename 힌트로 에티오피아 원두 모사)
      try {
        const res = await fetch("/api/estimates/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: "dummyData", filename: "bean" })
        });
        const data = await res.json();
        if (data.success) {
          setOcrScanning(false);
          setOcrSuccess(true);
          setOcrForm({
            partner_name: data.partner_name,
            partner_phone: data.partner_phone,
            items: data.items
          });
        }
      } catch (err) {
        setOcrScanning(false);
        alert("OCR 파싱 실패");
      }
    }, 2000);
  };

  // 2. OCR 완료된 받은 견적 접수 실행
  const handleSaveOcrEstimate = async () => {
    if (!ocrForm.partner_name || ocrForm.items.length === 0) return;
    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INBOUND",
          direction_status: "REQUESTED",
          partner_name: ocrForm.partner_name,
          partner_phone: ocrForm.partner_phone,
          items: ocrForm.items,
          ai_parsed: 1
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsOcrModalOpen(false);
        setOcrSuccess(false);
        fetchData();
        alert("AI OCR 분석 견적이 성공적으로 접수 대장에 적재되었습니다.");
      }
    } catch (e) {
      alert("접수 중 실패");
    }
  };

  // 3. 발주서로 원클릭 전환
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
        // 모의 발주 품목 세팅 (실물 검수용 프리셋 연동)
        const mockPo: PurchaseOrder = {
          id: data.poId,
          estimate_id: est.id,
          vendor_name: est.partner_name,
          vendor_phone: est.partner_phone,
          status: "PENDING_INBOUND",
          total_amount: est.total_amount,
          created_at: new Date().toISOString()
        };
        setPurchaseOrders(prev => [mockPo, ...prev]);
        fetchData();
        alert(`발주서(번호: ${data.poId}) 생성이 완료되었습니다. 거래처 문자로 발송 완료!`);
      }
    } catch (e) {
      alert("전환 실패");
    }
  };

  // 4. 실물 입고 검수 모달 열기
  const openInspectModal = (po: PurchaseOrder) => {
    setInspectPo(po);
    
    // 모의 발주 상세 품목 세팅 (원래 발주 수량)
    setInspectItems([
      { product_name: "에티오피아 예가체프 G1 워시드 원두 1kg", quantity: 20, checkedQty: 20, unit_price: 18500 },
      { product_name: "콜롬비아 수프리모 후일라 원두 1kg", quantity: 30, checkedQty: 30, unit_price: 16000 }
    ]);
    setIsInspectModalOpen(true);
  };

  const handleAdjustInspectQty = (idx: number, amt: number) => {
    setInspectItems(prev => {
      const next = [...prev];
      next[idx].checkedQty = Math.max(0, next[idx].checkedQty + amt);
      return next;
    });
  };

  // 5. 검수 완료 후 최종 승인 및 실재고 반영 (SCM 루프 완수!)
  const handleConfirmInspectInbound = async () => {
    if (!inspectPo) return;
    setInspectSubmitting(true);
    try {
      const res = await fetch("/api/estimates/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_inbound",
          orderId: inspectPo.id,
          partner_name: inspectPo.vendor_name,
          checkedItems: inspectItems
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsInspectModalOpen(false);
        fetchData();
        alert("🎉 실물 입고 검수가 최종 승인되었습니다! 실제 검수 수량이 이지데스크 재고 대장에 가산되어 실시간 동기화 완료되었습니다.");
      }
    } catch (err) {
      alert("입고 승인 처리 중 에러 발생");
    } finally {
      setInspectSubmitting(false);
    }
  };

  // 6. AI 동적 견적 가격 연산 요청 (보낼 견적)
  const handleCalculatePricing = async () => {
    if (!writePartner.trim()) {
      alert("바이어 성함/상호명을 적어주세요.");
      return;
    }
    setPricingLoading(true);
    try {
        const res = await fetch("/api/estimates/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partner_name: writePartner,
            partner_id: selectedPartnerId === "direct" ? "" : selectedPartnerId,
            items: writeItems
          })
        });
      const data = await res.json();
      if (data.success) {
        setPricingResult(data);
      }
    } catch (e) {
      alert("가격 제안 실패");
    } finally {
      setPricingLoading(false);
    }
  };

  // 7. 가격 제안서 전송 (보낸 견적 등록)
  const handleSendProposal = async () => {
    if (!pricingResult) return;
    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "OUTBOUND",
          direction_status: "SENT",
          partner_name: writePartner,
          partner_phone: writePhone,
          partner_id: selectedPartnerId === "direct" ? "" : selectedPartnerId,
          items: pricingResult.calculatedItems,
          memo: pricingResult.aiLetter
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsWriteModalOpen(false);
        setPricingResult(null);
        setWritePartner("");
        setWritePhone("");
        fetchData();
        alert("바이어 맞춤형 AI 추천 단가 및 견적 서한이 문자로 정상 자동 발송되었습니다!");
      }
    } catch (e) {
      alert("발송 실패");
    }
  };

  // 8. 보낸 견적서 ➡️ 수주서 자동 전환
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
        const mockSo: SalesOrder = {
          id: data.soId,
          estimate_id: est.id,
          customer_name: est.partner_name,
          customer_phone: est.partner_phone,
          status: "REGISTERED",
          total_amount: est.total_amount,
          created_at: new Date().toISOString()
        };
        setSalesOrders(prev => [mockSo, ...prev]);
        fetchData();
        alert(`수주 번호 ${data.soId} 로 대장에 자동 등록되었습니다. 수주 관리 탭에서 확인하세요!`);
      }
    } catch (e) {
      alert("수주 전환 실패");
    }
  };

  // 9. 수주 확정 ➡️ 수주확인서 발송 처리
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
        <div className="space-y-8 animate-scale-up">
          
          {/* 자재 입수 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 좌측: 받은 견적 및 요청 대장 */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
                  <Clipboard className="w-5 h-5 text-indigo-500" />
                  <span>받은 견적 및 모바일 요청 대장</span>
                </h3>
                <button
                  onClick={() => setIsOcrModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  받은 견적 이미지 AI 스캔
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="py-3 px-2">견적 번호</th>
                      <th className="py-3 px-2">공급/요청처</th>
                      <th className="py-3 px-2">총 견적액</th>
                      <th className="py-3 px-2">상태</th>
                      <th className="py-3 px-2">AI 스캔</th>
                      <th className="py-3 px-2 text-right">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimates.filter(e => e.type === "INBOUND").length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400 font-semibold">접수된 받은 견적 요청이 없습니다.</td>
                      </tr>
                    ) : (
                      estimates.filter(e => e.type === "INBOUND").map(est => (
                        <tr key={est.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-3.5 px-2 font-mono text-slate-700">{est.id}</td>
                          <td className="py-3.5 px-2">
                            <span className="font-bold text-slate-800 block">{est.partner_name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{est.partner_phone}</span>
                          </td>
                          <td className="py-3.5 px-2 text-indigo-600 font-bold">{est.total_amount.toLocaleString()}원</td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${est.direction_status === 'REQUESTED' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                              {est.direction_status === 'REQUESTED' ? '견적요청' : '발주완료'}
                            </span>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${est.ai_parsed ? 'bg-indigo-50 text-indigo-500 border border-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                              {est.ai_parsed ? 'AI OCR' : '수동접수'}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            {est.direction_status === 'REQUESTED' ? (
                              <button
                                onClick={() => handleConvertToPo(est)}
                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[10px] font-black flex items-center gap-0.5 ml-auto"
                              >
                                발주서 전환 <ChevronRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">전환완료</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 우측: 발주서 관리 & 입고대기 현황 */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
                <Box className="w-5 h-5 text-indigo-500" />
                <span>발주 및 실물 검수 연동 대장</span>
              </h3>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {purchaseOrders.length === 0 ? (
                  <p className="text-center py-12 text-slate-400 text-xs font-semibold">발주 내역이 없습니다.</p>
                ) : (
                  purchaseOrders.map(po => (
                    <div key={po.id} className={`p-4.5 rounded-2xl border transition-all ${po.status === 'PENDING_INBOUND' ? 'bg-indigo-50/20 border-indigo-200' : 'bg-slate-50/30 border-slate-100'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 block">{po.id}</span>
                          <span className="font-bold text-slate-800 text-sm block mt-0.5">{po.vendor_name}</span>
                          <span className="text-xs font-black text-indigo-600 mt-1 block">{po.total_amount.toLocaleString()}원</span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${po.status === 'PENDING_INBOUND' ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                          {po.status === 'PENDING_INBOUND' ? '입고대기' : '입고완료'}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[10px] text-slate-400 font-semibold">발주일시: {po.created_at.substring(0,10)}</span>
                        
                        {po.status === 'PENDING_INBOUND' ? (
                          <button
                            onClick={() => openInspectModal(po)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-md shadow-slate-900/10"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            실물 입고 검수
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-500 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 완료 ({po.completed_at?.substring(11,16)})
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 탭 2: Outbound Hub (보낸 견적서 ➡️ 수주 등록 ➡️ 수주확인서 발송) */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "outbound" && (
        <div className="space-y-8 animate-scale-up">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 좌측: 보낸 견적 대장 */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
                  <Clipboard className="w-5 h-5 text-indigo-500" />
                  <span>보낸 견적서 관리 대장</span>
                </h3>
                <button
                  onClick={() => setIsWriteModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  AI 최적 가격 견적서 작성
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="py-3 px-2">견적 번호</th>
                      <th className="py-3 px-2">수신 바이어명</th>
                      <th className="py-3 px-2">총 견적액</th>
                      <th className="py-3 px-2">상태</th>
                      <th className="py-3 px-2">제안서</th>
                      <th className="py-3 px-2 text-right">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimates.filter(e => e.type === "OUTBOUND").length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400 font-semibold">발송된 보낸 견적서가 없습니다.</td>
                      </tr>
                    ) : (
                      estimates.filter(e => e.type === "OUTBOUND").map(est => (
                        <tr key={est.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-3.5 px-2 font-mono text-slate-700">{est.id}</td>
                          <td className="py-3.5 px-2">
                            <span className="font-bold text-slate-800 block">{est.partner_name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{est.partner_phone}</span>
                          </td>
                          <td className="py-3.5 px-2 text-indigo-600 font-bold">{est.total_amount.toLocaleString()}원</td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${est.direction_status === 'SENT' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {est.direction_status === 'SENT' ? '견적발송' : '수주수락'}
                            </span>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className="text-[10px] text-slate-500 font-bold block max-w-[120px] truncate">{est.file_url || 'AI 맞춤 레터 포함'}</span>
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            {est.direction_status === 'SENT' ? (
                              <button
                                onClick={() => handleConvertToSo(est)}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-black flex items-center gap-0.5 ml-auto"
                              >
                                수주 전환 <ChevronRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">수주완료</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 우측: 수주 대장 목록 */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
                <ShoppingCart className="w-5 h-5 text-indigo-500" />
                <span>수주(바이어 계약) 관리 대장</span>
              </h3>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {salesOrders.length === 0 ? (
                  <p className="text-center py-12 text-slate-400 text-xs font-semibold">수주 완료 이력이 없습니다.</p>
                ) : (
                  salesOrders.map(so => (
                    <div key={so.id} className={`p-4.5 rounded-2xl border transition-all ${so.status === 'REGISTERED' ? 'bg-emerald-50/20 border-emerald-250' : 'bg-slate-50/30 border-slate-100'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 block">{so.id}</span>
                          <span className="font-bold text-slate-800 text-sm block mt-0.5">{so.customer_name}</span>
                          <span className="text-xs font-black text-indigo-600 mt-1 block">{so.total_amount.toLocaleString()}원</span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${so.status === 'REGISTERED' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                          {so.status === 'REGISTERED' ? '수주등록' : '확인완료'}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[10px] text-slate-400 font-semibold">수주일시: {so.created_at.substring(0,10)}</span>
                        
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
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 모달 1: 받은 견적서 등록 (AI OCR 기능 내장) */}
      {/* ──────────────────────────────────────────────────────── */}
      {isOcrModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-slate-100 max-w-xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            <button onClick={() => setIsOcrModalOpen(false)} className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-indigo-500" />
              <span>받은 견적서 스캔 등록 (AI OCR)</span>
            </h3>

            <div className="space-y-6 flex-1 overflow-y-auto pr-1">
              
              {/* 이미지 가상 드롭존 및 시뮬레이션 버튼 */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 relative min-h-[140px] overflow-hidden">
                {ocrScanning && (
                  <div className="absolute inset-x-0 h-1 bg-indigo-500 animate-bounce z-20"></div>
                )}

                {ocrScanning ? (
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-xs text-indigo-600 font-extrabold animate-pulse">Gemini Vision AI로 견적 이미지 고해상도 OCR 스캔 중...</span>
                  </div>
                ) : ocrSuccess ? (
                  <div className="text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{ocrFilename} 스캔 성공!</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">공급사, 연락처 및 {ocrForm.items.length}개 품목의 단가/수량 파싱 완료</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-xs text-slate-500">견적서 사진/PDF 이미지 등록 시 AI가 데이터 자동 파싱</div>
                    <button 
                      onClick={handleOcrUpload}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 font-black text-[11px] rounded-xl border border-indigo-100"
                    >
                      모의 견적 명세서 이미지 업로드 시뮬레이션
                    </button>
                  </div>
                )}
              </div>

              {/* 스캔 결과 폼 */}
              {ocrSuccess && (
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 space-y-4 animate-scale-up">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">AI 스캔 분석 결과 자동입력 대기</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">공급처명</label>
                      <input 
                        type="text" 
                        value={ocrForm.partner_name}
                        onChange={e => setOcrForm(prev => ({ ...prev, partner_name: e.target.value }))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">연락처</label>
                      <input 
                        type="text" 
                        value={ocrForm.partner_phone}
                        onChange={e => setOcrForm(prev => ({ ...prev, partner_phone: e.target.value }))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-bold block">상세 품목 리스트</label>
                    {ocrForm.items.map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                        <div className="flex-1 truncate pr-2">
                          <span className="font-bold text-slate-800">{item.product_name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">단가: {item.unit_price.toLocaleString()}원</span>
                        </div>
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded shrink-0">{item.quantity}개</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 flex gap-3">
              <button onClick={() => setIsOcrModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs">
                취소
              </button>
              <button 
                onClick={handleSaveOcrEstimate}
                disabled={!ocrSuccess}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl disabled:opacity-50"
              >
                받은 견적서 등록 승인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 모달 2: 실물 입고 검수 완료 승인 모달 (SCM 루프 ⭐️) */}
      {/* ──────────────────────────────────────────────────────── */}
      {isInspectModalOpen && inspectPo && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col animate-scale-up">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>실물 입고 검수 및 재고 반영</span>
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              <b>발주처: {inspectPo.vendor_name}</b> 으로부터 자재 실물이 도착하였습니다. <br />
              실물과 맞닥뜨려 수량을 꼼꼼히 확인하고 **실제 확인한 수량만큼** 검수 승인해 주세요. <br />
              [승인] 클릭 시 해당 검수 수량만큼 **재고 대장 자재 수량이 실시간 가산 누적**됩니다.
            </p>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              <div className="bg-slate-50 p-3.5 rounded-2xl text-[10px] text-slate-500 font-bold flex items-center gap-2 border border-slate-100">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>실물 누락 및 훼손 시 실제 검수 통과 수량을 하단에서 마이너스 조절해 기입해 주십시오.</span>
              </div>

              {inspectItems.map((item, idx) => (
                <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex-1 min-w-0 pr-3">
                    <span className="font-bold text-slate-800 text-xs md:text-sm truncate block">{item.product_name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">발주 수량: <b>{item.quantity}개</b></span>
                  </div>

                  {/* 수량 조절 필드 */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 shrink-0">
                    <button 
                      onClick={() => handleAdjustInspectQty(idx, -1)}
                      className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-600 shadow-sm"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-black text-slate-800 text-xs md:text-sm">{item.checkedQty}</span>
                    <button 
                      onClick={() => handleAdjustInspectQty(idx, 1)}
                      className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-600 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-slate-100 pt-4 flex gap-3">
              <button 
                onClick={() => setIsInspectModalOpen(false)} 
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-xs"
              >
                취소
              </button>
              <button 
                onClick={handleConfirmInspectInbound}
                disabled={inspectSubmitting}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-emerald-600/20"
              >
                {inspectSubmitting ? "실재고 수량 가산 중..." : "실물 입고 검수 완료 및 재고 반영 승인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 모달 3: AI 최적 단가 가격 연산 및 보낼 견적서 작성 */}
      {/* ──────────────────────────────────────────────────────── */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            <button onClick={() => setIsWriteModalOpen(false)} className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
              <span>AI 최적 가격 제안 및 보낼 견적서 기획</span>
            </h3>

            <div className="space-y-5 flex-1 overflow-y-auto pr-1">
              
              {/* B2B 바이어 선택 및 정보 입력 */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">B2B 거래처 바이어 선택 🤝</label>
                  <select
                    value={selectedPartnerId}
                    onChange={e => {
                      const ptId = e.target.value;
                      setSelectedPartnerId(ptId);
                      if (ptId === "direct") {
                        setWritePartner("");
                        setWritePhone("");
                      } else {
                        const target = partners.find(p => p.id === ptId);
                        if (target) {
                          setWritePartner(target.company_name);
                          setWritePhone(target.phone || "");
                        }
                      }
                    }}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="direct">직접 입력 (신규 바이어)</option>
                    {partners.filter(p => p.type === 'BUYER').map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.company_name} ({pt.vip_level})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">바이어 성함/상호명 *</label>
                    <input 
                      type="text" 
                      placeholder="예: 유재석 (단골VIP)"
                      value={writePartner}
                      onChange={e => setWritePartner(e.target.value)}
                      disabled={selectedPartnerId !== "direct"}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:bg-slate-100/70 disabled:text-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">수신처 연락처 *</label>
                    <input 
                      type="text" 
                      placeholder="010-7777-7777"
                      value={writePhone}
                      onChange={e => setWritePhone(e.target.value)}
                      disabled={selectedPartnerId !== "direct"}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:bg-slate-100/70 disabled:text-slate-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 품목 입력란 */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">제안 품목 및 수량</span>
                {writeItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 items-center">
                    <div className="col-span-2 text-xs font-bold bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 truncate">
                      {item.product_name}
                    </div>
                    <div>
                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={e => {
                          const next = [...writeItems];
                          next[idx].quantity = parseInt(e.target.value) || 0;
                          setWriteItems(next);
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center"
                      />
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleCalculatePricing}
                  disabled={pricingLoading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {pricingLoading ? "AI가 우수고객 이력 및 볼륨 디스카운트 단가 연산 중..." : "AI 볼륨 할인 및 단가 계산 실행"}
                </button>
              </div>

              {/* 동적 가격 결과 및 비즈니스 서한 초안 */}
              {pricingResult && (
                <div className="space-y-4 bg-indigo-50/20 p-5 rounded-2xl border border-indigo-100 animate-scale-up">
                  <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> AI 최적 동적 단가 산정 성공!
                    </span>
                    <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md">
                      {pricingResult.isVip ? "우수고객 우대 적용됨 (+5% 추가)" : "볼륨 할인 반영"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-semibold">
                    {pricingResult.calculatedItems.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between">
                        <div>
                          <span className="font-bold text-slate-800">{item.product_name} ({item.quantity}개)</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">기존 단가 대비 {item.discount_applied} 할인</span>
                        </div>
                        <span className="font-bold text-indigo-600 text-right">{item.amount.toLocaleString()}원 <br /><span className="text-[9px] text-slate-400 font-semibold block mt-0.5">개당 {item.unit_price.toLocaleString()}원</span></span>
                      </div>
                    ))}
                    
                    <div className="flex justify-between items-center text-sm font-black text-slate-800 border-t border-indigo-100 pt-3 px-1">
                      <span>최종 제안 합계 견적액</span>
                      <span className="text-indigo-600 text-base font-extrabold">{pricingResult.totalProposedAmount.toLocaleString()}원</span>
                    </div>
                  </div>

                  {/* AI 레터 초안 */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest block">AI 품격 있는 맞춤 비즈니스 서한 편지글</span>
                    <textarea
                      value={pricingResult.aiLetter}
                      onChange={e => setPricingResult((prev: any) => ({ ...prev, aiLetter: e.target.value }))}
                      className="w-full h-36 p-4 bg-white border border-indigo-100 rounded-2xl text-xs text-slate-700 leading-relaxed outline-none"
                    />
                  </div>
                </div>
              )}

            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 flex gap-3">
              <button onClick={() => setIsWriteModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs">
                닫기
              </button>
              <button 
                onClick={handleSendProposal}
                disabled={!pricingResult}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl disabled:opacity-50"
              >
                AI 맞춤 견적서 발송 승인
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
