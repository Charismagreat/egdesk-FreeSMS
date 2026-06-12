import React from "react";
import { WebTemplate, OperatorInfo } from "../types";
import { FileText, ArrowLeft, Sparkles, Printer, User } from "lucide-react";

interface MobileFormIssuerProps {
  template: WebTemplate;
  operator: OperatorInfo | null;
  manualData: Record<string, string>;
  onBack: () => void;
  onFieldChange: (key: string, value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function MobileFormIssuer({
  template,
  operator,
  manualData,
  onBack,
  onFieldChange,
  onSubmit,
  isLoading
}: MobileFormIssuerProps) {

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

        {/* 3. 모바일 인쇄 실행 버튼 */}
        <div className="pt-4">
          <button
            onClick={onSubmit}
            type="button"
            disabled={isLoading}
            className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 disabled:opacity-50 transition-all select-none"
          >
            {isLoading ? (
              <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Printer className="w-4.5 h-4.5" />
            )}
            <span>증명서 발급 및 인쇄하기</span>
          </button>
        </div>

      </div>

      {/* 가이드 메시지 (모바일 전용) */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 text-[8px] font-bold text-slate-500 text-left space-y-1.5 select-none leading-relaxed">
        <span className="block text-slate-700 font-black">💡 모바일 증명서 발급 안내</span>
        <p>
          • [증명서 발급 및 인쇄하기] 클릭 시, 표준 규격의 A4 크기 출력 미리보기 창이 새 탭(팝업)으로 호출됩니다.
        </p>
        <p>
          • 브라우저의 팝업 차단 기능이 켜져 있을 경우 새 탭이 열리지 않을 수 있으므로, 팝업 허용을 활성화해주십시오.
        </p>
        <p>
          • 발급 이력(발급대장) 및 원시 쿼리 조회는 임직원 개인정보 보호 정책에 따라 모바일에서 노출되지 않습니다.
        </p>
      </div>

    </div>
  );
}
