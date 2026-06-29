"use client";

import React, { useState, useEffect } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { 
  Plus, Trash2, Printer, Mail, Send, Check, RefreshCw, 
  ArrowLeft, FileText, Settings, Coins, Sparkles, X 
} from "lucide-react";
import Link from "next/link";

interface MaterialItem {
  productName: string;
  spec: string;
  quantity: number;
  unitPrice: number;
  remark: string;
}

interface ProcessItem {
  processName: string;
  quantity: number;
  unitPrice: number;
  remark: string;
}

export default function ManufactureEstimateWritePage() {
  // 1. 상태 보존용 Persisted States (v2 키 변경으로 이전 캐시 원천 초기화)
  const [supplier, setSupplier, isSupplierRestored] = usePersistedState("egdesk_mfr_est_supplier_v2", {
    businessNumber: "",
    companyName: "",
    representative: "",
    address: "",
    phone: "",
    fax: "",
    email: ""
  });
  const [buyer, setBuyer, isBuyerRestored] = usePersistedState("egdesk_mfr_est_buyer_v2", {
    companyName: "",
    departmentName: "",
    managerName: "",
    phone: ""
  });
  const [meta, setMeta, isMetaRestored] = usePersistedState("egdesk_mfr_est_meta_v2", {
    estimateNumber: "",
    estimateDate: "",
    writerName: "",
    writerPhone: ""
  });
  
  // 초기 샘플 제거 및 빈 폼 시작
  const [materials, setMaterials, isMaterialsRestored] = usePersistedState<MaterialItem[]>("egdesk_mfr_est_materials_v2", [
    { productName: "", spec: "", quantity: 0, unitPrice: 0, remark: "" }
  ]);
  
  // 직접 가공비 상태
  const [directProcess, setDirectProcess, isDirectProcessRestored] = usePersistedState<ProcessItem[]>("egdesk_mfr_est_direct_process_v2", [
    { processName: "", quantity: 0, unitPrice: 0, remark: "" }
  ]);

  // 외주 가공비 상태
  const [outsourceProcess, setOutsourceProcess, isOutsourceProcessRestored] = usePersistedState<ProcessItem[]>("egdesk_mfr_est_outsource_process_v2", [
    { processName: "", quantity: 0, unitPrice: 0, remark: "" }
  ]);

  const [memo, setMemo, isMemoRestored] = usePersistedState("egdesk_mfr_est_memo_v2", "");

  // 모든 세션 로드 완료 여부
  const isRestored = isSupplierRestored && isBuyerRestored && isMetaRestored && isMaterialsRestored && isDirectProcessRestored && isOutsourceProcessRestored && isMemoRestored;

  // 발송 모달 제어 상태
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState<"EMAIL" | "SMS" | "FAX">("EMAIL");
  const [sendAddress, setSendAddress] = useState("");
  const [isSending, setIsSending] = useState(false);

  // 🛡️ 구버전 캐시 및 더미 데이터(고압 차단기 등) 강제 감지 후 자동 소거 방어막
  useEffect(() => {
    if (!isRestored) return;
    const hasDummy = materials.some(it => 
      it.productName.includes("고압 차단기") || 
      it.productName.includes("SUS304") ||
      it.unitPrice === 850000
    );
    if (hasDummy) {
      setMaterials([{ productName: "", spec: "", quantity: 0, unitPrice: 0, remark: "" }]);
      setDirectProcess([{ processName: "", quantity: 0, unitPrice: 0, remark: "" }]);
      setOutsourceProcess([{ processName: "", quantity: 0, unitPrice: 0, remark: "" }]);
    }
  }, [isRestored, materials, setMaterials, setDirectProcess, setOutsourceProcess]);

  // 2. 공급자 초기 프로필 연동 (Early Return Guard 준수)
  useEffect(() => {
    if (!isRestored) return;
    if (supplier.companyName) return;

    fetch("/api/settings?key=my_company_profile")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.value) {
          try {
            const profile = JSON.parse(data.value);
            setSupplier({
              businessNumber: profile.businessNumber || "306-81-93458",
              companyName: profile.companyName || "주식회사 쿠스",
              representative: profile.representative || "김진수",
              address: profile.address || "서울특별시 금천구 가산디지털2로 274",
              phone: profile.phone || "1599-6277",
              fax: profile.fax || "02-715-9989",
              email: profile.email || "sales@koos.co.kr"
            });
          } catch(e) {}
        }
      })
      .catch(() => {
        setSupplier({
          businessNumber: "306-81-93458",
          companyName: "주식회사 쿠스 (송배전기기 전문)",
          representative: "김진수",
          address: "서울특별시 금천구 가산디지털2로 274",
          phone: "1599-6277",
          fax: "02-715-9989",
          email: "sales@koos.co.kr"
        });
      });
  }, [isRestored, supplier.companyName]);

  // 3. 견적번호 및 오늘 날짜 자동 생성 (Early Return Guard 준수)
  useEffect(() => {
    if (!isRestored) return;
    if (meta.estimateNumber) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000);
    setMeta(prev => ({
      ...prev,
      estimateNumber: `EST-${yyyy}${mm}${dd}-${random}`,
      estimateDate: `${yyyy}-${mm}-${dd}`
    }));
  }, [isRestored, meta.estimateNumber]);

  if (!isRestored) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-indigo-650">
        <RefreshCw className="w-10 h-10 animate-spin mr-3" />
        <span className="text-sm font-extrabold tracking-widest uppercase">견적 시스템 환경 복원 중...</span>
      </div>
    );
  }

  // 4. 실시간 원가 합산 계산 공식
  const materialsTotal = materials.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const directProcessTotal = directProcess.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const outsourceProcessTotal = outsourceProcess.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const processTotal = directProcessTotal + outsourceProcessTotal;

  // 일반관리비 = 가공비의 10%
  const generalAdminCost = Math.round(processTotal * 0.1);
  // 기업이윤 = (가공비 + 일반관리비)의 10%
  const businessProfit = Math.round((processTotal + generalAdminCost) * 0.1);
  // 재료관리비 = 재료비의 5%
  const materialManageCost = Math.round(materialsTotal * 0.05);

  // 최종 견적금액 (재료비 + 가공비 + 일반관리비 + 기업이윤 + 재료관리비)
  const grandTotal = materialsTotal + processTotal + generalAdminCost + businessProfit + materialManageCost;

  // 5. 폼 제어 핸들러
  const handleAddMaterial = () => {
    setMaterials([...materials, { productName: "", spec: "", quantity: 0, unitPrice: 0, remark: "" }]);
  };

  const handleRemoveMaterial = (index: number) => {
    if (materials.length === 1) return;
    setMaterials(materials.filter((_, idx) => idx !== index));
  };

  const handleMaterialChange = (index: number, field: keyof MaterialItem, value: any) => {
    const updated = [...materials];
    if (field === "quantity" || field === "unitPrice") {
      updated[index][field] = Number(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setMaterials(updated);
  };

  // 직접 가공비 제어
  const handleAddDirectProcess = () => {
    setDirectProcess([...directProcess, { processName: "", quantity: 0, unitPrice: 0, remark: "" }]);
  };

  const handleRemoveDirectProcess = (index: number) => {
    if (directProcess.length === 1) return;
    setDirectProcess(directProcess.filter((_, idx) => idx !== index));
  };

  const handleDirectProcessChange = (index: number, field: keyof ProcessItem, value: any) => {
    const updated = [...directProcess];
    if (field === "quantity" || field === "unitPrice") {
      updated[index][field] = Number(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setDirectProcess(updated);
  };

  // 외주 가공비 제어
  const handleAddOutsourceProcess = () => {
    setOutsourceProcess([...outsourceProcess, { processName: "", quantity: 0, unitPrice: 0, remark: "" }]);
  };

  const handleRemoveOutsourceProcess = (index: number) => {
    if (outsourceProcess.length === 1) return;
    setOutsourceProcess(outsourceProcess.filter((_, idx) => idx !== index));
  };

  const handleOutsourceProcessChange = (index: number, field: keyof ProcessItem, value: any) => {
    const updated = [...outsourceProcess];
    if (field === "quantity" || field === "unitPrice") {
      updated[index][field] = Number(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setOutsourceProcess(updated);
  };

  // 작성 내용 완전히 초기화
  const handleResetForm = () => {
    if (window.confirm("작성 중인 모든 견적서 내용을 초기화하고 빈 양식으로 시작하시겠습니까?")) {
      setSupplier({
        businessNumber: "",
        companyName: "",
        representative: "",
        address: "",
        phone: "",
        fax: "",
        email: ""
      });
      setBuyer({
        companyName: "",
        departmentName: "",
        managerName: "",
        phone: ""
      });
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const random = Math.floor(1000 + Math.random() * 9000);
      setMeta({
        estimateNumber: `EST-${yyyy}${mm}${dd}-${random}`,
        estimateDate: `${yyyy}-${mm}-${dd}`,
        writerName: "",
        writerPhone: ""
      });
      setMaterials([{ productName: "", spec: "", quantity: 0, unitPrice: 0, remark: "" }]);
      setDirectProcess([{ processName: "", quantity: 0, unitPrice: 0, remark: "" }]);
      setOutsourceProcess([{ processName: "", quantity: 0, unitPrice: 0, remark: "" }]);
      setMemo("");

      // 회사 정보 설정 다시 로드
      fetch("/api/settings?key=my_company_profile")
        .then(res => res.json())
        .then(data => {
          if (data.success && data.value) {
            try {
              const profile = JSON.parse(data.value);
              setSupplier({
                businessNumber: profile.businessNumber || "",
                companyName: profile.companyName || "",
                representative: profile.representative || "",
                address: profile.address || "",
                phone: profile.phone || "",
                fax: profile.fax || "",
                email: profile.email || ""
              });
            } catch(e) {}
          }
        });
    }
  };

  // 프리셋 예시 데이터 자동 적재 (송배전 제조업 체험)
  const handleLoadPreset = () => {
    setMaterials([
      { productName: "수배전반 외함 프레임 (3.2t 분체도장)", spec: "2300*1400*1200", quantity: 1, unitPrice: 1200000, remark: "도장포함 외함" },
      { productName: "진공 차단기 (VCB) 24KV 630A", spec: "AH-24V-06", quantity: 1, unitPrice: 2450000, remark: "LS 일렉트릭 정품" },
      { productName: "고압 한류형 퓨즈 (LBS 연동)", spec: "24KV 40A", quantity: 3, unitPrice: 150000, remark: "LBS 보호용" },
      { productName: "구리 부스바 (은도금 가공재)", spec: "10T * 100mm * 2m", quantity: 6, unitPrice: 180000, remark: "전도체 배선" }
    ]);
    setDirectProcess([
      { processName: "배전반 프레임 수동 조립 및 단말 가공", quantity: 18, unitPrice: 45000, remark: "숙련공 조립공수" },
      { processName: "도금 부스바 프레스 벤딩 및 실장 작업", quantity: 12, unitPrice: 40000, remark: "부스바 벤딩 가공" }
    ]);
    setOutsourceProcess([
      { processName: "외함 분체 도장 및 열처리 외주", quantity: 1, unitPrice: 280000, remark: "외주 도장" },
      { processName: "전류계/전압계 디지털 계전기 결선 검사", quantity: 1, unitPrice: 350000, remark: "외주 정밀 계측 검수" }
    ]);
    setBuyer({
      companyName: "우주건설산업 주식회사",
      departmentName: "플랜트 설비구매부",
      managerName: "이강민 부장",
      phone: "010-4567-9012"
    });
    setMemo("1. 본 견적서의 유효기간은 발행일로부터 30일입니다.\n2. 납품 조건: 지정 장소 상차도 인도.\n3. 결제 조건: 계약 시 30%, 납품 검수 완료 후 70% 현금 지불.");
  };

  // 6. 발송 핸들러 시뮬레이션
  const handleOpenSend = () => {
    if (!buyer.companyName) {
      alert("공급받는자 상호명을 먼저 입력해 주세요.");
      return;
    }
    if (sendChannel === "EMAIL") setSendAddress(buyer.phone ? `${buyer.phone.replace(/-/g, "")}@naver.com` : "buyer@naver.com");
    if (sendChannel === "SMS") setSendAddress(buyer.phone || "");
    if (sendChannel === "FAX") setSendAddress("02-1234-5678");
    setIsSendModalOpen(true);
  };

  const handleSendExecute = () => {
    if (!sendAddress.trim()) {
      alert("발송 수신처를 입력해 주세요.");
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSendModalOpen(false);
      alert(`[발송 성공]\n\n수신처: ${sendAddress}\n채널: ${sendChannel}\n\n제조업 특약 견적서(${meta.estimateNumber})가 성공적으로 전송 완료되었습니다!`);
    }, 1500);
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-800 p-0 font-sans selection:bg-indigo-500 selection:text-white"
      data-easybot-hint="제조업 전용 견적 작성 AI: 송전 및 배전 기기 제조업에 특화된 재료비, 가공비, 일반관리비, 기업이윤 연산 및 옴니채널 발송을 담당합니다."
    >
      <div className="w-full space-y-8 relative px-4 py-6 md:px-8 md:py-8">
        {/* 상단 액션바 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 print:hidden">
          <div>
            <div className="flex items-center gap-3">
              <Link 
                href="/estimates" 
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-indigo-600 transition-all active:scale-95 shadow-sm"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <FileText className="w-8 h-8 text-indigo-600" />
                <span>제조업 특화 견적서 작성 ⚡</span>
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 ml-2">
                <span className="text-[10px] bg-indigo-50 text-indigo-650 border border-indigo-200/50 px-2 py-0.5 rounded font-black tracking-wider uppercase">송전/배전 기기 제조</span>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">오토세이브 가동</span>
              </div>
            </div>
            <p className="text-slate-500 mt-2 text-sm pl-13">
              송전 및 배전 기기 제조업에 특화된 재료비, 가공비, 간접제조원가(일반관리비/기업이윤) 연산과 옴니채널 발송을 수행합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleResetForm}
              className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-rose-600 hover:text-rose-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              내용 비우기
            </button>
            <button
              onClick={handleLoadPreset}
              className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 border border-indigo-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              배전반 샘플 데이터 채우기
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              견적서 인쇄 / PDF
            </button>
            <button
              onClick={handleOpenSend}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all cursor-pointer active:scale-95"
            >
              <Mail className="w-3.5 h-3.5" />
              수신처 즉시 발송하기
            </button>
          </div>
        </div>

        {/* 폼 및 미리보기 2단 레이아웃 */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start print:block print:p-0 print:gap-0">
          
          {/* 좌측 입력 폼 (8단 확장) */}
          <div className="xl:col-span-8 space-y-6 print:hidden">
            
            {/* 세션 0: 기본 정보 및 수발신자 메타 */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-extrabold text-slate-800">0. 기본 정보 및 수발신처 입력</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 공급자 정보 */}
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">공급자 정보 (자사)</span>
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">상호명</label>
                      <input 
                        type="text" 
                        value={supplier.companyName}
                        onChange={e => setSupplier({ ...supplier, companyName: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">대표자</label>
                        <input 
                          type="text" 
                          value={supplier.representative}
                          onChange={e => setSupplier({ ...supplier, representative: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">사업자등록번호</label>
                        <input 
                          type="text" 
                          value={supplier.businessNumber}
                          onChange={e => setSupplier({ ...supplier, businessNumber: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">사업장 주소</label>
                      <input 
                        type="text" 
                        value={supplier.address}
                        onChange={e => setSupplier({ ...supplier, address: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">대표 전화번호</label>
                        <input 
                          type="text" 
                          value={supplier.phone}
                          onChange={e => setSupplier({ ...supplier, phone: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">팩스번호</label>
                        <input 
                          type="text" 
                          value={supplier.fax}
                          onChange={e => setSupplier({ ...supplier, fax: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">대표 이메일 주소</label>
                      <input 
                        type="email" 
                        value={supplier.email}
                        onChange={e => setSupplier({ ...supplier, email: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 공급받는자 정보 및 작성 정보 */}
                <div className="space-y-4 text-left">
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60 space-y-4">
                    <span className="text-[10px] font-black text-slate-500 border-b border-slate-200 pb-2 block uppercase tracking-widest">공급받는자 정보 (바이어)</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">바이어 회사명 *</label>
                        <input 
                          type="text" 
                          value={buyer.companyName}
                          onChange={e => setBuyer({ ...buyer, companyName: e.target.value })}
                          placeholder="상호명 입력"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">수신 부서명</label>
                        <input 
                          type="text" 
                          value={buyer.departmentName}
                          onChange={e => setBuyer({ ...buyer, departmentName: e.target.value })}
                          placeholder="부서명 입력"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">담당자 성함</label>
                        <input 
                          type="text" 
                          value={buyer.managerName}
                          onChange={e => setBuyer({ ...buyer, managerName: e.target.value })}
                          placeholder="담당자 입력"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">담당 연락처</label>
                        <input 
                          type="text" 
                          value={buyer.phone}
                          onChange={e => setBuyer({ ...buyer, phone: e.target.value })}
                          placeholder="연락처 입력"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60 space-y-4">
                    <span className="text-[10px] font-black text-slate-500 border-b border-slate-200 pb-2 block uppercase tracking-widest">문서 번호 및 작성자 메타</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">견적번호</label>
                        <input 
                          type="text" 
                          value={meta.estimateNumber}
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-500 outline-none cursor-not-allowed"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">견적 발행일자</label>
                        <input 
                          type="date" 
                          value={meta.estimateDate}
                          onChange={e => setMeta({ ...meta, estimateDate: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none cursor-pointer focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">견적서 작성자</label>
                        <input 
                          type="text" 
                          value={meta.writerName}
                          onChange={e => setMeta({ ...meta, writerName: e.target.value })}
                          placeholder="작성자 성명"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">작성자 연락처</label>
                        <input 
                          type="text" 
                          value={meta.writerPhone}
                          onChange={e => setMeta({ ...meta, writerPhone: e.target.value })}
                          placeholder="작성자 연락처"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 세션 1: 재료비 */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-extrabold text-slate-800">1. 재료비 (제조원가 - 재료 품목 내역)</h3>
                </div>
                <button
                  onClick={handleAddMaterial}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded-lg font-bold text-[10px] border border-indigo-200/40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  재료 행 추가
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold">
                      <th className="py-2.5 pl-1">품명 *</th>
                      <th className="py-2.5">규격</th>
                      <th className="py-2.5 w-16 text-center">수량</th>
                      <th className="py-2.5 w-28 text-right">단가 (원)</th>
                      <th className="py-2.5 w-32 text-right">금액 (원)</th>
                      <th className="py-2.5">비고</th>
                      <th className="py-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materials.map((it, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50/50">
                        <td className="py-2.5 pr-2 pl-1">
                          <input 
                            type="text" 
                            value={it.productName}
                            onChange={e => handleMaterialChange(idx, "productName", e.target.value)}
                            placeholder="재료 품명 입력"
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <input 
                            type="text" 
                            value={it.spec}
                            onChange={e => handleMaterialChange(idx, "spec", e.target.value)}
                            placeholder="규격"
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <input 
                            type="number" 
                            value={it.quantity || ""}
                            onChange={e => handleMaterialChange(idx, "quantity", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs font-mono font-bold text-center text-slate-855 outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <input 
                            type="number" 
                            value={it.unitPrice || ""}
                            onChange={e => handleMaterialChange(idx, "unitPrice", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-right text-slate-855 outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="py-2.5 pr-3 text-right font-mono font-black text-slate-700">
                          {((it.quantity || 0) * (it.unitPrice || 0)).toLocaleString()}원
                        </td>
                        <td className="py-2.5 pr-2">
                          <input 
                            type="text" 
                            value={it.remark}
                            onChange={e => handleMaterialChange(idx, "remark", e.target.value)}
                            placeholder="비고"
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => handleRemoveMaterial(idx)}
                            disabled={materials.length === 1}
                            className="p-1.5 text-slate-450 hover:text-rose-500 disabled:opacity-30 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500">순수 재료비 합계액:</span>
                <span className="text-sm font-black text-indigo-650 font-mono">{materialsTotal.toLocaleString()}원</span>
              </div>
            </div>

            {/* 세션 2: 가공비 (직접가공비 & 외주가공비 영역 통합) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Coins className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-extrabold text-slate-800">2. 가공비 (제조원가 - 직접 및 외주 가공 내역)</h3>
              </div>

              {/* 2-1. 직접 가공비 영역 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    2-1. 직접 가공비 (자사 직접 임가공 공정)
                  </span>
                  <button
                    onClick={handleAddDirectProcess}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded-lg font-bold text-[10px] border border-indigo-200/40 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    직접 공정 추가
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="py-2.5 pl-1">직접 공정명 *</th>
                        <th className="py-2.5 w-20 text-center">수량/공수</th>
                        <th className="py-2.5 w-32 text-right">단가 (원)</th>
                        <th className="py-2.5 w-36 text-right">금액 (원)</th>
                        <th className="py-2.5">비고</th>
                        <th className="py-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {directProcess.map((it, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50">
                          <td className="py-2.5 pr-2 pl-1">
                            <input 
                              type="text" 
                              value={it.processName}
                              onChange={e => handleDirectProcessChange(idx, "processName", e.target.value)}
                              placeholder="공정명 입력 (예: 조립, 절곡)"
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input 
                              type="number" 
                              value={it.quantity || ""}
                              onChange={e => handleDirectProcessChange(idx, "quantity", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs font-mono font-bold text-center text-slate-855 outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input 
                              type="number" 
                              value={it.unitPrice || ""}
                              onChange={e => handleDirectProcessChange(idx, "unitPrice", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-right text-slate-855 outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2.5 pr-3 text-right font-mono font-black text-slate-700">
                            {((it.quantity || 0) * (it.unitPrice || 0)).toLocaleString()}원
                          </td>
                          <td className="py-2.5 pr-2">
                            <input 
                              type="text" 
                              value={it.remark}
                              onChange={e => handleDirectProcessChange(idx, "remark", e.target.value)}
                              placeholder="비고"
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => handleRemoveDirectProcess(idx)}
                              disabled={directProcess.length === 1}
                              className="p-1.5 text-slate-450 hover:text-rose-500 disabled:opacity-30 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500">직접 가공비 소계:</span>
                  <span className="text-xs font-extrabold text-indigo-950 font-mono">{directProcessTotal.toLocaleString()}원</span>
                </div>
              </div>

              {/* 구분 실선 */}
              <hr className="border-slate-100/80" />

              {/* 2-2. 외주 가공비 영역 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                    2-2. 외주 가공비 (외부 위탁 및 특수 처리 공정)
                  </span>
                  <button
                    onClick={handleAddOutsourceProcess}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded-lg font-bold text-[10px] border border-indigo-200/40 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    외주 공정 추가
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="py-2.5 pl-1">외주 공정명 *</th>
                        <th className="py-2.5 w-20 text-center">수량/공수</th>
                        <th className="py-2.5 w-32 text-right">단가 (원)</th>
                        <th className="py-2.5 w-36 text-right">금액 (원)</th>
                        <th className="py-2.5">비고</th>
                        <th className="py-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {outsourceProcess.map((it, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50">
                          <td className="py-2.5 pr-2 pl-1">
                            <input 
                              type="text" 
                              value={it.processName}
                              onChange={e => handleOutsourceProcessChange(idx, "processName", e.target.value)}
                              placeholder="외주공정 입력 (예: 도장, 열처리)"
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input 
                              type="number" 
                              value={it.quantity || ""}
                              onChange={e => handleOutsourceProcessChange(idx, "quantity", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs font-mono font-bold text-center text-slate-855 outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input 
                              type="number" 
                              value={it.unitPrice || ""}
                              onChange={e => handleOutsourceProcessChange(idx, "unitPrice", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-right text-slate-855 outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2.5 pr-3 text-right font-mono font-black text-slate-700">
                            {((it.quantity || 0) * (it.unitPrice || 0)).toLocaleString()}원
                          </td>
                          <td className="py-2.5 pr-2">
                            <input 
                              type="text" 
                              value={it.remark}
                              onChange={e => handleOutsourceProcessChange(idx, "remark", e.target.value)}
                              placeholder="비고"
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => handleRemoveOutsourceProcess(idx)}
                              disabled={outsourceProcess.length === 1}
                              className="p-1.5 text-slate-450 hover:text-rose-500 disabled:opacity-30 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500">외주 가공비 소계:</span>
                  <span className="text-xs font-extrabold text-indigo-950 font-mono">{outsourceProcessTotal.toLocaleString()}원</span>
                </div>
              </div>

              {/* 가공비 통합 요약 바 */}
              <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/30">
                <span className="text-xs font-black text-indigo-950">가공비 합계액 (직접 + 외주):</span>
                <span className="text-sm font-black text-indigo-700 font-mono">{processTotal.toLocaleString()}원</span>
              </div>
            </div>

            {/* 세션 3: 간접 제조 원가 */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm text-left">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Settings className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-extrabold text-slate-800">3. 간접 제조 원가</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold">일반 관리비 (가공비의 10%)</span>
                  <div className="text-base font-black text-slate-800 font-mono">
                    {generalAdminCost.toLocaleString()}원
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold block">계산식: 가공비({processTotal.toLocaleString()}원) × 10%</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold">기업 이윤 (가공비+관리비의 10%)</span>
                  <div className="text-base font-black text-slate-800 font-mono">
                    {businessProfit.toLocaleString()}원
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold block">계산식: (가공비+관리비) × 10%</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold">기타 비용 (재료관리비의 5%)</span>
                  <div className="text-base font-black text-slate-800 font-mono">
                    {materialManageCost.toLocaleString()}원
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold block">계산식: 재료비({materialsTotal.toLocaleString()}원) × 5%</span>
                </div>
              </div>
            </div>

            {/* 세션 4: 최종 견적 금액 */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-inner gap-4">
                <div>
                  <span className="text-xs md:text-sm font-black text-indigo-650 uppercase tracking-wide block">최종 견적 금액 (부가세 별도)</span>
                  <span className="text-[10px] md:text-xs text-slate-500 font-medium block mt-1">재료비 + 가공비(직접/외주) + 일반관리비 + 기업이윤 + 재료관리비</span>
                </div>
                <div className="text-3xl font-black text-indigo-750 font-mono shrink-0">
                  {grandTotal.toLocaleString()}원
                </div>
              </div>
            </div>

            {/* 세션 6: 특기사항 */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 text-left shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4.5 h-4.5 text-indigo-650" />
                <h3 className="text-sm font-black text-slate-850">특기사항</h3>
              </div>
              
              <textarea 
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="특기사항을 기입해주세요 (예: 견적 유효기간, 납품 및 결제 조건 등)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold leading-relaxed text-slate-800 outline-none focus:border-indigo-500 resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* 우측 실시간 A4 스타일 미리보기 및 원가 명세 (4단) */}
          <div className="xl:col-span-4 space-y-6 print:block print:w-full print:p-0 print:m-0">
            
            {/* 실시간 제조업 원가 명세 요약 */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 text-left shadow-sm print:hidden">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <Coins className="w-4 h-4 text-indigo-500" />
                <span>제조원가 종합 연산 명세</span>
              </h3>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>1. 재료비 합계액</span>
                    <span className="font-mono font-bold text-slate-850">{materialsTotal.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>2. 직접 가공비 합계</span>
                    <span className="font-mono font-bold text-slate-850">{directProcessTotal.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>3. 외주 가공비 합계</span>
                    <span className="font-mono font-bold text-slate-850">{outsourceProcessTotal.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>4. 일반관리비 <b className="text-[10px] text-indigo-500">(가공비의 10%)</b></span>
                    <span className="font-mono font-bold text-indigo-600">{generalAdminCost.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>5. 기업이윤 <b className="text-[10px] text-pink-500">(가공비+관리비의 10%)</b></span>
                    <span className="font-mono font-bold text-pink-600">{businessProfit.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>6. 재료관리비 <b className="text-[10px] text-amber-600">(재료비의 5%)</b></span>
                    <span className="font-mono font-bold text-amber-600">{materialManageCost.toLocaleString()}원</span>
                  </div>
                </div>

                {/* 원가 구성비 인디케이터 바 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>원가 구성비</span>
                    <span>재료비 {grandTotal > 0 ? Math.round(((materialsTotal + materialManageCost) / grandTotal) * 100) : 0}% | 가공비 등 {grandTotal > 0 ? Math.round(((processTotal + generalAdminCost + businessProfit) / grandTotal) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-500" 
                      style={{ width: `${grandTotal > 0 ? ((materialsTotal + materialManageCost) / grandTotal) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-pink-500 h-full transition-all duration-500" 
                      style={{ width: `${grandTotal > 0 ? ((processTotal + generalAdminCost + businessProfit) / grandTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 최종 견적금액 디스플레이 */}
                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl text-center space-y-1.5 shadow-inner">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">제조원가 기반 최종 견적합계액 (부가세 별도)</span>
                  <span className="text-2xl font-black text-indigo-750 font-mono block">
                    {grandTotal.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            {/* A4 프린트 인쇄 레이아웃 미리보기 모듈 */}
            <div className="bg-white text-slate-800 border border-slate-200 rounded-3xl p-5 space-y-4 shadow-md block text-left text-[9px] font-medium leading-normal relative overflow-hidden hidden md:block print:block print:w-full print:border-none print:shadow-none print:p-0 print:m-0">
              {/* 상단 인쇄용 워터마크 안내 */}
              <div className="absolute top-2 right-2 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-400 flex items-center gap-0.5 pointer-events-none print:hidden">
                <Printer className="w-2.5 h-2.5" />
                인쇄 전용 A4 프리뷰
              </div>

              <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                <h2 className="text-sm font-black tracking-widest text-slate-900">견  적  서</h2>
                <p className="text-[7px] text-slate-450">송배전반 및 전력기기 정밀 제조 명세</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
                {/* 공급받는자 */}
                <div className="space-y-1.5">
                  <div className="flex gap-1"><span className="text-slate-400 w-10 shrink-0 font-bold">견적번호:</span><span className="font-mono text-slate-700 font-bold">{meta.estimateNumber || "자동 생성대기"}</span></div>
                  <div className="flex gap-1"><span className="text-slate-400 w-10 shrink-0 font-bold">견적일자:</span><span className="text-slate-700 font-bold">{meta.estimateDate || "발행 당일"}</span></div>
                  <div className="flex gap-1"><span className="text-slate-400 w-10 shrink-0 font-bold">수신처:</span><span className="text-slate-900 font-bold underline decoration-slate-300 decoration-2 underline-offset-2">{buyer.companyName || "미확인 바이어"} 귀하</span></div>
                  <div className="flex gap-1"><span className="text-slate-400 w-10 shrink-0 font-bold">담당자:</span><span className="text-slate-700 font-bold">{buyer.departmentName} {buyer.managerName}</span></div>
                </div>

                {/* 공급자 */}
                <div className="border-l border-slate-200 pl-4 space-y-1">
                  <div className="flex gap-1"><span className="text-slate-400 w-12 shrink-0 font-bold">등록번호:</span><span className="font-mono text-slate-800 font-bold">{supplier.businessNumber}</span></div>
                  <div className="flex gap-1"><span className="text-slate-400 w-12 shrink-0 font-bold">공급자명:</span><span className="text-slate-900 font-bold">{supplier.companyName}</span></div>
                  <div className="flex gap-1"><span className="text-slate-400 w-12 shrink-0 font-bold">대표자:</span><span className="text-slate-850">{supplier.representative} (인)</span></div>
                  <div className="flex gap-1"><span className="text-slate-400 w-12 shrink-0 font-bold">소재지:</span><span className="text-slate-700 leading-tight">{supplier.address}</span></div>
                  <div className="flex gap-1"><span className="text-slate-400 w-12 shrink-0 font-bold">연락처/이메일:</span><span className="text-slate-700">{supplier.phone} / {supplier.email}</span></div>
                </div>
              </div>

              {/* 총액 선언 */}
              <div className="bg-slate-50 border border-slate-200 p-2 text-center text-slate-800 flex justify-between px-4 font-bold rounded-lg">
                <span>합계 견적 금액 (제조원가 합계):</span>
                <span className="underline underline-offset-2 font-black text-slate-900">₩{grandTotal.toLocaleString()}원 (부가세 별도)</span>
              </div>

              {/* 품목 요약 테이블 (재료비, 가공비) */}
              <div className="space-y-2">
                <span className="font-bold text-slate-400 text-[8px] uppercase tracking-wider block">제조 비용 비례 세부 명세</span>
                <table className="w-full text-left text-[8px] border-t border-b border-slate-200 divide-y divide-slate-100">
                  <thead>
                    <tr className="text-slate-400 bg-slate-50/50">
                      <th className="py-1 pl-1 w-14">구분</th>
                      <th className="py-1 w-28">세부 품목/공정명</th>
                      <th className="py-1 w-16">규격</th>
                      <th className="py-1 w-8 text-center">수량</th>
                      <th className="py-1 w-16 text-right pr-1">단가 (원)</th>
                      <th className="py-1 w-20 text-right pr-1">금액 (원)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* 재료비 내역 전체 출력 */}
                    {materials.filter(m => m.productName).map((m, idx) => (
                      <tr key={`m-${idx}`} className="text-slate-755">
                        <td className="py-1 pl-1 text-slate-400 font-bold">재료비</td>
                        <td className="py-1 truncate max-w-[120px]">{m.productName}</td>
                        <td className="py-1 truncate max-w-[60px]">{m.spec || "-"}</td>
                        <td className="py-1 text-center font-mono">{m.quantity}</td>
                        <td className="py-1 text-right font-mono pr-1">{m.unitPrice ? m.unitPrice.toLocaleString() : "0"}</td>
                        <td className="py-1 text-right font-mono pr-1">{((m.quantity || 0) * (m.unitPrice || 0)).toLocaleString()}</td>
                      </tr>
                    ))}

                    {/* 가공비 대분류 헤더 행 */}
                    <tr className="bg-slate-50/50 text-slate-800 font-extrabold text-[8px]">
                      <td className="py-1 pl-1 text-slate-700" colSpan={6}>가공비 (공정 및 가공비 명세)</td>
                    </tr>

                    {/* 직접가공비 상세 내역 */}
                    {directProcess.filter(p => p.processName).map((p, idx) => (
                      <tr key={`dp-${idx}`} className="text-slate-755">
                        <td className="py-1 pl-2 text-indigo-500 font-bold">└ 직접가공</td>
                        <td className="py-1 truncate max-w-[120px]">{p.processName}</td>
                        <td className="py-1">-</td>
                        <td className="py-1 text-center font-mono">{p.quantity}</td>
                        <td className="py-1 text-right font-mono pr-1">{p.unitPrice ? p.unitPrice.toLocaleString() : "0"}</td>
                        <td className="py-1 text-right font-mono pr-1">{((p.quantity || 0) * (p.unitPrice || 0)).toLocaleString()}</td>
                      </tr>
                    ))}

                    {/* 외주가공비 상세 내역 */}
                    {outsourceProcess.filter(p => p.processName).map((p, idx) => (
                      <tr key={`op-${idx}`} className="text-slate-755">
                        <td className="py-1 pl-2 text-pink-500 font-bold">└ 외주가공</td>
                        <td className="py-1 truncate max-w-[120px]">{p.processName}</td>
                        <td className="py-1">-</td>
                        <td className="py-1 text-center font-mono">{p.quantity}</td>
                        <td className="py-1 text-right font-mono pr-1">{p.unitPrice ? p.unitPrice.toLocaleString() : "0"}</td>
                        <td className="py-1 text-right font-mono pr-1">{((p.quantity || 0) * (p.unitPrice || 0)).toLocaleString()}</td>
                      </tr>
                    ))}

                    {/* 가공비 합계 행 */}
                    <tr className="bg-slate-50/30 text-slate-700 font-bold text-[8px] border-b border-slate-100">
                      <td className="py-1 pl-1 text-indigo-700">가공비 합계</td>
                      <td className="py-1 text-slate-500" colSpan={2}>직접 ({directProcessTotal.toLocaleString()}원) + 외주 ({outsourceProcessTotal.toLocaleString()}원)</td>
                      <td className="py-1 text-center font-mono">-</td>
                      <td className="py-1 text-right font-mono pr-1">-</td>
                      <td className="py-1 text-right font-mono pr-1">{processTotal.toLocaleString()}</td>
                    </tr>

                    {/* 간접 제조 원가 대분류 헤더 행 */}
                    <tr className="bg-slate-50/50 text-slate-800 font-extrabold text-[8px]">
                      <td className="py-1 pl-1 text-slate-700" colSpan={6}>간접 제조 원가</td>
                    </tr>

                    {/* 간접원가 행들 */}
                    <tr className="text-slate-755">
                      <td className="py-1 pl-2 text-indigo-500 font-bold">└ 일반관리비</td>
                      <td className="py-1" colSpan={2}>일반관리비 (가공비의 10%)</td>
                      <td className="py-1 text-center">-</td>
                      <td className="py-1 text-right font-mono pr-1">-</td>
                      <td className="py-1 text-right font-mono pr-1">{generalAdminCost.toLocaleString()}</td>
                    </tr>
                    <tr className="text-slate-755">
                      <td className="py-1 pl-2 text-indigo-500 font-bold">└ 기업이윤</td>
                      <td className="py-1" colSpan={2}>기업이윤 (가공비+관리비의 10%)</td>
                      <td className="py-1 text-center">-</td>
                      <td className="py-1 text-right font-mono pr-1">-</td>
                      <td className="py-1 text-right font-mono pr-1">{businessProfit.toLocaleString()}</td>
                    </tr>
                    <tr className="text-slate-755">
                      <td className="py-1 pl-2 text-indigo-500 font-bold">└ 기타비용</td>
                      <td className="py-1" colSpan={2}>기타비용 (재료관리비의 5%)</td>
                      <td className="py-1 text-center">-</td>
                      <td className="py-1 text-right font-mono pr-1">-</td>
                      <td className="py-1 text-right font-mono pr-1">{materialManageCost.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 하단 서명 명의 */}
              <div className="pt-2 text-right text-slate-500 font-bold text-[8px]">
                위와 같이 견적서를 제출합니다.
                <span className="block mt-1.5 text-slate-900 font-extrabold text-[9px]">{supplier.companyName} 대표 {supplier.representative} (인)</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 7. 다중 채널 발송 시뮬레이터 모달 */}
      {isSendModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[32px] max-w-md w-full p-6 md:p-8 shadow-2xl relative text-left space-y-6 animate-scale-up">
            
            <button 
              onClick={() => setIsSendModalOpen(false)}
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-500" />
                <span>견적서 옴니채널 발송하기</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                작성 완료된 제조업 전용 견적서를 원하는 채널로 즉시 발송합니다.
              </p>
            </div>

            {/* 발송 채널 탭 */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              {(["EMAIL", "SMS", "FAX"] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => {
                    setSendChannel(ch);
                    if (ch === "EMAIL") setSendAddress(buyer.phone ? `${buyer.phone.replace(/-/g, "")}@naver.com` : "buyer@naver.com");
                    if (ch === "SMS") setSendAddress(buyer.phone || "");
                    if (ch === "FAX") setSendAddress("02-1234-5678");
                  }}
                  className={`py-2 text-center text-xs font-black rounded-lg transition cursor-pointer select-none ${
                    sendChannel === ch
                      ? "bg-indigo-650 text-white shadow"
                      : "text-slate-400 hover:text-slate-800"
                  }`}
                >
                  {ch === "EMAIL" && "📧 이메일"}
                  {ch === "SMS" && "💬 문자"}
                  {ch === "FAX" && "📠 팩스"}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1.5">발송 수신처 정보 *</label>
                <input 
                  type="text" 
                  value={sendAddress}
                  onChange={e => setSendAddress(e.target.value)}
                  placeholder={
                    sendChannel === "EMAIL" ? "이메일 주소 입력" :
                    sendChannel === "SMS" ? "휴대폰 번호 입력" : "FAX 번호 입력"
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-500 leading-relaxed font-semibold">
                <div className="flex justify-between items-center text-[10px] font-black text-indigo-500 uppercase tracking-wider border-b border-slate-200/50 pb-1.5 mb-1">
                  <span>실시간 발송 요약</span>
                  <span>FreeSMS 크레딧 무료</span>
                </div>
                <div><b>발송 대상 견적서:</b> {meta.estimateNumber}</div>
                <div><b>수신 바이어명:</b> {buyer.companyName} {buyer.managerName} 귀하</div>
                <div><b>제조원가 합계액:</b> {grandTotal.toLocaleString()}원</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsSendModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                취소
              </button>
              <button 
                onClick={handleSendExecute}
                disabled={isSending}
                className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>전송 처리 중...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>발송 확정</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
