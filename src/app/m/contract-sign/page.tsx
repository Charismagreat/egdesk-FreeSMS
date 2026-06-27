"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, CheckCircle2, ShieldCheck, PenTool, RefreshCw, AlertCircle, Calendar, MapPin, Briefcase, DollarSign, Clock, Check, Loader2 } from "lucide-react";

interface Operator {
  id: number;
  username: string;
  name: string;
  role: string;
  employee_number?: string;
  phone?: string;
  created_at: string;
}

interface Contract {
  operator_id: string;
  hourly_wage: number;
  weekly_hours: number;
  allow_weekly_holiday_paid: number;
  work_days: string;
  contract_memo: string;
  start_date?: string;
  end_date?: string;
  work_place?: string;
  job_description?: string;
  contract_type?: string;
  paper_contract_file?: string | null;
  status: string;
  signature_image?: string | null;
  signed_at?: string | null;
}

export default function MobileContractSignPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <MobileContractSignContent />
    </React.Suspense>
  );
}

function MobileContractSignContent() {
  const searchParams = useSearchParams();
  const operatorId = searchParams.get("id");

  const [operator, setOperator] = useState<Operator | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Canvas 서명 상태
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // 데이터 로드
  useEffect(() => {
    if (!operatorId) {
      setError("올바르지 않은 접근입니다. 계약 서명 링크의 직원 ID가 누락되었습니다.");
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        // 1. 직원 정보 로드
        const opRes = await fetch("/api/operators");
        const opData = await opRes.json();
        
        if (!opData.success) {
          setError(opData.error || "직원 정보를 조회하는 중 오류가 발생했습니다.");
          return;
        }
        
        const targetOp = (opData.operators || []).find((op: Operator) => op.id === Number(operatorId));
        if (!targetOp) {
          setError("해당 임직원 계정을 찾을 수 없습니다.");
          return;
        }
        setOperator(targetOp);

        // 2. 근로계약 설정 로드
        const contractRes = await fetch("/api/hr/contracts");
        const contractData = await contractRes.json();
        
        if (!contractData.success) {
          setError(contractData.error || "계약 정보 조회 실패");
          return;
        }

        const targetContract = (contractData.contracts || []).find((c: Contract) => c.operator_id === String(operatorId));
        if (!targetContract) {
          setError("대기 중인 근로 계약이 없습니다. 최고운영자가 먼저 계약을 기안해야 합니다.");
          return;
        }

        if (targetContract.status === "SIGNED") {
          setSuccess(true); // 이미 서명이 완료된 계약
        }

        setContract(targetContract);
      } catch (err) {
        setError("데이터를 로드하는 도중 통신 장애가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [operatorId]);

  // 서명 드로잉 핸들러
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e1b4b"; // Indigo-950

    const rect = canvas.getBoundingClientRect();
    let x = 0;
    let y = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x = 0;
    let y = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return;
      // 터치 스크롤 방지
      if (e.cancelable) e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const submitSignature = async () => {
    if (!canvasRef.current || !hasSigned || !operatorId) return;

    setSubmitting(true);
    try {
      // 캔버스 드로잉 데이터를 Base64 이미지 스트링으로 추출
      const signatureImage = canvasRef.current.toDataURL("image/png");

      const response = await fetch("/api/hr/contracts/submit-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator_id: operatorId,
          signature_image: signatureImage
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
      } else {
        alert(data.error || "서명 제출 중 에러가 발생했습니다.");
      }
    } catch (err) {
      alert("서버 전송 중 에러가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">근로계약 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h4 className="text-base font-bold text-slate-800 mb-2">접속 실패</h4>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer border-0 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 체결 완료 성공 화면
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-4 animate-bounce">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">전자 근로계약 체결 완료</h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
          {operator?.name}님과 (주)이지데스크 간의 표준근로계약이 법적으로 안전하게 체결되었습니다. 서명 완료본은 사내 인사 시스템에 자동 적재되어 보관됩니다.
        </p>
        <div className="w-full max-w-xs bg-white rounded-2xl border border-slate-100 p-4 shadow-sm text-left text-xs space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-400">계약서 명칭</span>
            <span className="font-semibold text-slate-700">
              {contract?.contract_type === "PAPER_SIGN_ONLY"
                ? "서면 근로계약서 (서명 전용)"
                : contract?.contract_type === "STANDARD_UNLIMITED" 
                  ? "표준근로계약서 (무기계약)" 
                  : "표준근로계약서 (기간제)"}
            </span>
          </div>
          <div className="flex justify-between"><span className="text-slate-400">근로자 성명</span><span className="font-semibold text-slate-700">{operator?.name}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">체결 일시</span><span className="font-semibold text-slate-700 font-mono">{contract?.signed_at || new Date().toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">계약 상태</span><span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">합의 체결 완료</span></div>
        </div>
        <p className="text-[10px] text-slate-400">본 페이지는 모바일 전용 보관증이며 브라우저 창을 닫으셔도 무방합니다.</p>
      </div>
    );
  }

  // 4.345주 환산
  const holidayHours = contract?.allow_weekly_holiday_paid === 1 ? (contract.weekly_hours / 40) * 8 : 0;
  const monthlyHours = (contract!.weekly_hours + holidayHours) * 4.3455;
  const estimatedMonthlyWage = Math.round(monthlyHours * contract!.hourly_wage);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-800 text-left">
      {/* 프리미엄 모바일 헤더 */}
      <div className="bg-indigo-900 text-white px-5 py-6 rounded-b-[32px] shadow-lg">
        <div className="flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-indigo-200" />
          <h2 className="text-base font-bold tracking-tight">
            {contract?.contract_type === "PAPER_SIGN_ONLY" 
              ? "서면 작성 완료 근로계약서 확인"
              : contract?.contract_type === "STANDARD_UNLIMITED" 
                ? "표준근로계약서 (기간의 정함이 없는 경우)" 
                : "표준근로계약서 (기간의 정함이 있는 경우)"}
          </h2>
        </div>
        <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed">
          {contract?.contract_type === "PAPER_SIGN_ONLY"
            ? `(주)이지데스크와 ${operator?.name}님 간에 오프라인(서면)으로 작성이 완료된 근로계약서입니다. 내용을 검토하신 후 하단에 서명해 주세요.`
            : `(주)이지데스크(이하 "사업주")와 ${operator?.name}님(이하 "근로자")은 서로 합의 하에 근로기준법을 성실히 준수하며 아래와 같이 근로계약을 체결합니다.`}
        </p>
      </div>

      {/* 모바일 최적화 컨테이너 */}
      <div className="px-4 -mt-4 space-y-5">
        
        {contract?.contract_type === "PAPER_SIGN_ONLY" ? (
          /* 서면 근로계약서 이미지 렌더링 */
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-indigo-600" /> 업로드된 서면 근로계약서 원본
            </h3>
            {contract.paper_contract_file ? (
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  src={contract.paper_contract_file}
                  alt="서면 근로계약서 원본"
                  className="w-full h-auto object-contain max-h-[80vh]"
                />
              </div>
            ) : (
              <p className="text-xs text-red-500 py-4 text-center">업로드된 계약서 이미지가 존재하지 않습니다.</p>
            )}
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              ※ 손가락으로 두드려 확대하거나 이미지를 길게 누르면 크게 보실 수 있습니다.
            </p>
          </div>
        ) : (
          <>
            {/* 1. 계약 기본 조항 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Calendar className="w-4 h-4" /> 제1조 ~ 제3조. 근로 기간 및 직무
              </h3>
              <div className="space-y-3.5 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">
                    {contract?.contract_type === "STANDARD_UNLIMITED" ? "제1조. 근로개시일" : "제1조. 근로계약기간"}
                  </p>
                  <p className="text-slate-800 font-bold mt-0.5">
                    {contract?.contract_type === "STANDARD_UNLIMITED" 
                      ? `${contract?.start_date || "채용일"}부터 (기간의 정함이 없는 근로계약)`
                      : `${contract?.start_date || "채용일"}부터 ${contract?.end_date || "기간 정함 없음"}까지`}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">제2조. 근무 장소</p>
                  <p className="text-slate-800 font-bold mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    {contract?.work_place || "본사 사무실 및 지정 장소"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">제3조. 업무의 내용</p>
                  <p className="text-slate-800 font-bold mt-0.5 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    {contract?.job_description || "사무행정 및 개발 지원 업무"}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. 근무 시간 및 주휴수당 조건 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Clock className="w-4 h-4" /> 제4조 ~ 제5조. 근로 시간 및 요일
              </h3>
              <div className="space-y-4 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">제4조. 소정근로시간</p>
                  <p className="text-slate-800 font-bold mt-0.5">
                    주당 소정근로 <span className="text-indigo-600 font-extrabold font-mono">{contract?.weekly_hours}시간</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    (기본 근무 시간: 09:00 ~ 18:00 / 휴게시간: 12:00 ~ 13:00 적용)
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">제5조. 근무일 및 주휴일</p>
                  <p className="text-slate-800 font-bold mt-0.5">
                    매주 <span className="font-mono text-indigo-600">{contract?.work_days}</span> 근무
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 bg-slate-50 p-2 rounded-lg">
                    <Check className="w-3 h-3 text-indigo-600" />
                    주휴일은 매주 일요일(혹은 주휴 유급 휴일)을 적용합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. 급여 조건 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <DollarSign className="w-4 h-4" /> 제6조. 임금 및 지급 방법
              </h3>
              <div className="space-y-4 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">통상 시급</p>
                  <p className="text-lg font-bold text-slate-800 font-mono mt-0.5">
                    {contract?.hourly_wage.toLocaleString()}원
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-3">
                  <div>
                    <p className="text-slate-400 font-medium">상여금 여부</p>
                    <p className="text-slate-700 font-semibold mt-0.5">없음 (또는 기본급에 산입)</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">기타 제수당</p>
                    <p className="text-slate-700 font-semibold mt-0.5">없음 (실비 변상 별도)</p>
                  </div>
                </div>
                <div className="border-t border-slate-50 pt-3 space-y-2">
                  <div>
                    <p className="text-slate-400 font-medium">임금 지급일</p>
                    <p className="text-slate-700 font-semibold mt-0.5">
                      매월 10일 (지급일이 토요일/휴일인 경우 전일 지급)
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">지급 방법</p>
                    <p className="text-slate-700 font-semibold mt-0.5">
                      근로자 본인 명의 예금통장에 직접 계좌이체 입금
                    </p>
                  </div>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                  <p className="text-[10px] text-indigo-500">예상 월 환산급여 (주휴 포함)</p>
                  <p className="text-base font-extrabold text-indigo-800 font-mono mt-0.5">
                    {estimatedMonthlyWage.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>

            {/* 4. 법정 약관 및 약정 (제7조 ~ 제11조) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <CheckCircle2 className="w-4 h-4" /> 
                {contract?.contract_type === "STANDARD_UNLIMITED" 
                  ? "제7조 ~ 제10조. 근로 권리 및 의무 약정" 
                  : "제7조 ~ 제11조. 근로 권리 및 의무 약정"}
              </h3>
              <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                <p>
                  <strong className="text-slate-800 font-semibold block">제7조. 연차유급휴가</strong>
                  연차유급휴가는 근로기준법에서 정하는 바(1개월 개근 시 1일 유급휴가 등)에 따라 성실히 부여하고 사용합니다.
                </p>
                <p>
                  <strong className="text-slate-800 font-semibold block">제8조. 사회보험 적용여부</strong>
                  본 계약 체결 시 아래 관계 법령에 의거하여 4대 사회보험에 의무 가입됩니다.
                </p>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">고용보험 가입</span>
                  <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">산재보험 가입</span>
                  <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">국민연금 가입</span>
                  <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">건강보험 가입</span>
                </div>
                <p className="border-t border-slate-100 pt-3">
                  <strong className="text-slate-800 font-semibold block">제9조. 근로계약서 교부</strong>
                  사업주는 근로계약을 체결함과 동시에 본 계약서를 복사 또는 디지털 서본하여 근로자의 별도 교부요구 없이 근로자에게 즉시 메신저/이메일 등으로 교부합니다. (근로기준법 제17조 준수)
                </p>
                {contract?.contract_type !== "STANDARD_UNLIMITED" && (
                  <p>
                    <strong className="text-slate-800 font-semibold block">제10조. 성실 이행 의무</strong>
                    사업주와 근로자는 각자가 근로계약, 취업규칙, 단체협약을 성실히 준수하고 신의칙에 의거하여 이행할 것을 서약합니다.
                  </p>
                )}
                <p>
                  <strong className="text-slate-800 font-semibold block">
                    {contract?.contract_type === "STANDARD_UNLIMITED" ? "제10조. 기타 조항" : "제11조. 기타 조항"}
                  </strong>
                  본 계약에 정하지 않은 근무 조건 및 해석 분쟁은 대한민국 근로기준법령 및 노동 관련 관례에 따릅니다.
                </p>
              </div>
            </div>
          </>
        )}

        {/* 5. 당사자 서명 영역 */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-md space-y-4">
          <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 border-b border-indigo-50 pb-2">
            <PenTool className="w-4 h-4 text-indigo-600" /> 근로계약 체결 및 전자 서명
          </h3>

          <div className="text-xs space-y-2.5 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">사업주 (갑)</span>
              <span className="font-bold text-slate-800">(주)이지데스크 대표자 (인)</span>
            </div>
            {contract?.contract_type === "STANDARD_UNLIMITED" && (
              <div className="flex justify-between">
                <span className="text-slate-400">사업주 연락처</span>
                <span className="font-bold text-slate-800">02-1234-5678</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">근로자 (을) 성명</span>
              <span className="font-bold text-slate-800">{operator?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">근로자 주소</span>
              <span className="font-medium text-slate-800 text-right">사내 등록된 주민등록상 주소지</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">근로자 연락처</span>
              <span className="font-medium text-slate-800 font-mono">{operator?.phone || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">계약 체결일</span>
              <span className="font-semibold text-indigo-600 font-mono">
                {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>

          {/* 서명 그리기 캔버스 */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-[11px] font-bold text-indigo-900">
              아래 흰색 서명란에 정성껏 서명해 주세요:
            </label>
            <div className="relative border-2 border-indigo-100 rounded-2xl overflow-hidden bg-white shadow-inner">
              <canvas
                ref={canvasRef}
                width={330}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full block bg-transparent touch-none cursor-crosshair"
                style={{ touchAction: "none" }}
              />
              {!hasSigned && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs">
                  여기에 터치 또는 마우스로 서명을 그려주세요
                </div>
              )}
            </div>
          </div>

          {/* 서명 조작 버튼 */}
          <div className="flex gap-2.5">
            <button
              onClick={clearCanvas}
              disabled={!hasSigned || submitting}
              className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              다시 그리기
            </button>
            <button
              onClick={submitSignature}
              disabled={!hasSigned || submitting}
              className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white border-0 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  서약 체결 중...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  계약서 서명 및 제출
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
