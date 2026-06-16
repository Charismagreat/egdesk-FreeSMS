import React, { useState } from "react";
import { WebTemplate, OperatorInfo } from "../types";
import { FileText, ArrowLeft, Sparkles, Printer, User, Send, Mail } from "lucide-react";

interface MobileFormIssuerProps {
  template: WebTemplate;
  operator: OperatorInfo | null;
  manualData: Record<string, string>;
  onBack: () => void;
  onFieldChange: (key: string, value: string) => void;
  onSubmit: () => void;
  onSendEmail: (email: string) => void;
  isLoading: boolean;
}

export default function MobileFormIssuer({
  template,
  operator,
  manualData,
  onBack,
  onFieldChange,
  onSubmit,
  onSendEmail,
  isLoading
}: MobileFormIssuerProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const handleOpenEmailModal = () => {
    setEmailInput(operator?.email || "");
    setShowEmailModal(true);
  };

  const handleSendEmailSubmit = () => {
    if (!emailInput.trim()) {
      alert("이메일 주소를 입력해 주세요.");
      return;
    }
    onSendEmail(emailInput);
    setShowEmailModal(false);
  };

  // 수기용 필드 렌더러 헬퍼 (라벨 옆에 주황색 [수기 입력] 뱃지 및 점선 테두리 디자인 적용) 🎨
  const renderManualInput = (key: string, label: string, placeholder: string, type: string = "text") => {
    return (
      <div className="space-y-1 text-left">
        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
          {label}
          <span className="text-[7.5px] font-black text-amber-600 bg-amber-50 px-1 py-0.2 rounded-sm border border-amber-200 uppercase tracking-wider shrink-0 select-none">
            [수기 입력]
          </span>
        </label>
        <input
          type={type}
          value={manualData[key] || ""}
          onChange={(e) => onFieldChange(key, e.target.value)}
          placeholder={placeholder}
          className="w-full text-xs font-semibold text-slate-700 bg-amber-50/10 border-2 border-dashed border-amber-300 rounded-xl px-3 py-2 outline-hidden focus:border-amber-400 focus:bg-amber-50/25 transition-all"
        />
      </div>
    );
  };

  // 일반 조회(사원 데이터에서 연계된 읽기 전용) 필드 렌더러
  const renderReadOnlyField = (label: string, value: string, icon: any) => {
    const Icon = icon;
    return (
      <div className="space-y-1 text-left">
        <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
          {label}
        </label>
        <div className="relative">
          <input
            type="text"
            value={value || "미입력"}
            readOnly
            className="w-full text-xs font-bold text-slate-500 bg-slate-100/60 border border-slate-200 rounded-xl pl-8.5 pr-3 py-2 outline-hidden select-all"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-12">
      
      {/* 1. 상단 타이틀 영역 */}
      <div className="bg-white border border-slate-150 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3 text-left min-w-0">
          <button
            onClick={onBack}
            type="button"
            className="p-2 -ml-1 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
            title="목록으로 이동"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-xs font-black text-slate-800 truncate">
              {template.template_name}
            </h2>
            <p className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">
              Form Printing Config
            </p>
          </div>
        </div>
      </div>
 
      {/* 2. 발급 정보 설정 카드 */}
      <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-2xs space-y-4">
        
        <div className="border-b border-slate-100 pb-3 flex items-center gap-1.5 text-left">
          <User className="w-4 h-4 text-indigo-500" />
          <h3 className="text-[11px] font-extrabold text-slate-800">발급 대상자(본인) 연계 정보</h3>
        </div>

        {/* 사원 정보 및 세션 연계 (Read-only 영역) */}
        <div className="grid grid-cols-2 gap-3">
          {renderReadOnlyField("성명", operator?.name || "", User)}
          {renderReadOnlyField("소속 부서", operator?.department || "", FileText)}
          {renderReadOnlyField("직급/직무", operator?.position || "", FileText)}
          {renderReadOnlyField("입사일자", operator?.joined_date || "", FileText)}
        </div>

        <div className="border-b border-slate-100 pt-3 pb-3 flex items-center gap-1.5 text-left">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-[11px] font-extrabold text-slate-800">서류 수기 보완 항목</h3>
        </div>

        {/* 수기 오버라이드 기입 영역 */}
        <div className="space-y-3">
          {renderManualInput("resident_id", "주민등록번호", "예: 900101-1****** (필요시 기재)")}
          {renderManualInput("address", "주소", "예: 서울시 마포구 독막로 123")}
          {renderManualInput("usage", "제출 용도", "예: 금융기관 제출용")}
          
          <div className="grid grid-cols-3 gap-2">
            {renderManualInput("issue_year", "발급 년도", "YYYY")}
            {renderManualInput("issue_month", "발급 월", "MM")}
            {renderManualInput("issue_day", "발급 일", "DD")}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {renderManualInput("issue_dept", "발급 부서", "예: 관리부")}
            {renderManualInput("issue_phone", "발급 부서 전화", "예: 02-1234-5678")}
          </div>
        </div>

        {/* 3. 모바일 인쇄 및 발송 버튼 영역 */}
        <div className="pt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onSubmit}
            type="button"
            disabled={isLoading}
            className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all select-none"
          >
            {isLoading ? (
              <div className="w-4.5 h-4.5 border-2 border-slate-450 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Printer className="w-4.5 h-4.5" />
            )}
            <span>인쇄 / PDF</span>
          </button>
          
          <button
            onClick={handleOpenEmailModal}
            type="button"
            disabled={isLoading}
            className="w-full text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all select-none hover:opacity-90"
            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
          >
            <Send className="w-4.5 h-4.5" style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff' }}>이메일 발송</span>
          </button>
        </div>

      </div>

      {/* 가이드 메시지 (모바일 전용) */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 text-[8px] font-bold text-slate-500 text-left space-y-1.5 select-none leading-relaxed">
        <span className="block text-slate-700 font-black">💡 모바일 증명서 발급 안내</span>
        <p>
          • [인쇄 / PDF] 클릭 시, 표준 규격의 A4 크기 출력 미리보기 창이 새 탭(팝업)으로 호출됩니다.
        </p>
        <p>
          • [이메일 발송] 클릭 시, 사원 본인 또는 기관 제출처 메일 주소로 정인 날인 완료된 증명서 메일이 즉시 발송됩니다.
        </p>
        <p>
          • 모든 서류의 발급 이력은 사내 규정에 의거하여 <b>재직증명서 발급대장</b>에 감사 보존 기록됩니다.
        </p>
      </div>

      {/* 이메일 발송 입력 모달 */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scale-up text-left">
            <div className="flex items-center gap-2 text-indigo-600">
              <Mail className="w-5 h-5" />
              <h4 className="text-xs font-black">증명서 이메일 발송 설정</h4>
            </div>
            <p className="text-[10px] text-slate-450 leading-relaxed font-bold">
              입력하신 이메일 주소로 정식 직인이 날인된 증명서 본문이 전송되며, 발급 이력이 시스템 발급 대장에 기록됩니다.
            </p>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500">수신 이메일 주소</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="예: employee@company.com"
                className="w-full text-xs font-bold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-extrabold text-xs py-2 rounded-xl"
              >
                취소
              </button>
              <button
                onClick={handleSendEmailSubmit}
                disabled={isLoading}
                className="flex-1 text-white font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" style={{ color: '#ffffff' }} />
                )}
                <span style={{ color: '#ffffff' }}>전송하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
