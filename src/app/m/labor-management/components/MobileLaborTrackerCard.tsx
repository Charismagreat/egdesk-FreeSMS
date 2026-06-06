import React, { useState } from "react";
import { EmployeeLaborStat } from "../../../labor-management/types";
import { AlertTriangle, ShieldAlert, MessageSquare, Phone, Clock, FileWarning } from "lucide-react";

interface MobileLaborTrackerCardProps {
  empStat: EmployeeLaborStat;
  getSmsText: (emp: EmployeeLaborStat) => string;
}

/**
 * 모바일 전용 근태 한도 경고 카드 및 시정 SMS 발송 공유 모듈
 */
export default function MobileLaborTrackerCard({
  empStat,
  getSmsText,
}: MobileLaborTrackerCardProps) {
  const [showSmsModal, setShowSmsModal] = useState(false);

  const isCritical = empStat.riskLevel === "CRITICAL";
  const isWarning = empStat.riskLevel === "WARNING";

  const smsText = getSmsText(empStat);
  const isIOS = typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const smsHref = `sms:01012345678${isIOS ? "&" : "?"}body=${encodeURIComponent(smsText)}`;
  const telHref = "tel:01012345678";

  return (
    <div className={`bg-white rounded-2xl border text-left p-4 space-y-3 transition-all shadow-xs ${
      isCritical ? "border-rose-400 bg-rose-50/10" : isWarning ? "border-amber-300 bg-amber-50/10" : "border-slate-200"
    }`}>
      
      {/* 1. 상단 타이틀 */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
              {empStat.id}
            </span>
            <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded ${
              isCritical ? "bg-rose-100 text-rose-700 animate-pulse" :
              isWarning ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {isCritical ? "위반 초과" : isWarning ? "주의 필요" : "정상"}
            </span>
          </div>
          <h4 className="text-xs font-black text-slate-800">{empStat.name}</h4>
          <p className="text-[9px] text-slate-400 font-bold">소속: {empStat.department}</p>
        </div>

        <div className="text-right">
          <span className="block text-[8px] text-slate-400 font-black">누적 근로시간</span>
          <span className={`text-[12px] font-black font-mono ${isCritical ? "text-rose-600" : "text-slate-700"}`}>
            {empStat.weeklyHours.toFixed(1)} H
          </span>
          <span className="block text-[8px] text-slate-400 font-bold mt-0.5">
            연장: {empStat.overtimeHours > 0 ? `+${empStat.overtimeHours.toFixed(1)}H` : "0.0H"}
          </span>
        </div>
      </div>

      {/* 2. 경고 텍스트 (위험자 전용) */}
      {(isCritical || isWarning) && (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-1.5 text-[8.5px] font-bold text-slate-500 leading-normal">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p>
            {isCritical
              ? "경고: 근로기준법상 주 52시간 한도를 초과할 위기에 임박했습니다. 즉각 조치가 시급합니다."
              : "주의: 연장 근로시간 누적으로 한도 도달 우려가 있습니다. 유연시프트 조정을 검토하세요."}
          </p>
        </div>
      )}

      {/* 3. 모바일 간편 소통 제어 */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <a
          href={telHref}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[9.5px] rounded-xl border border-slate-200 transition-colors"
        >
          <Phone className="w-3.5 h-3.5 text-slate-500" />
          유선 전화 통화
        </a>
        <button
          type="button"
          onClick={() => setShowSmsModal(true)}
          className={`flex items-center justify-center gap-1.5 py-2.5 font-extrabold text-[9.5px] rounded-xl border transition-colors ${
            isCritical
              ? "bg-rose-600 hover:bg-rose-700 border-rose-600 text-white"
              : "bg-indigo-650 hover:bg-indigo-700 border-indigo-650 text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-white" />
          시정 권고 SMS 발송
        </button>
      </div>

      {/* SMS 공유 템플릿 모달 */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-slate-100 shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h5 className="text-[11px] font-black text-slate-800">노무 시정 조치 알림톡</h5>
              <button
                type="button"
                onClick={() => setShowSmsModal(false)}
                className="text-slate-400 hover:text-slate-650 font-bold text-xs"
              >
                닫기
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[7.5px] text-indigo-500 font-black">전달할 문자 원고 미리보기</span>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[9px] font-bold text-slate-650 whitespace-pre-wrap">
                {smsText}
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold">
              <span>수신인: {empStat.name} 사원</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowSmsModal(false)}
                className="py-2 border border-slate-250 hover:bg-slate-50 text-slate-650 font-bold text-[9.5px] rounded-xl transition-colors"
              >
                취소
              </button>
              <a
                href={smsHref}
                onClick={() => setShowSmsModal(false)}
                className="py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-[9.5px] rounded-xl text-center shadow-2xs block transition-colors"
              >
                SMS 앱 연결
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
