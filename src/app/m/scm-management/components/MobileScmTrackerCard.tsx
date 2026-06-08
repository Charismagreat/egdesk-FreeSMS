import React, { useState } from "react";
import { ScmShipment } from "../../../scm-management/types";
import { Phone, MessageSquare, AlertTriangle, Check, RefreshCcw, Landmark, Ship, Truck, CheckSquare } from "lucide-react";

interface MobileScmTrackerCardProps {
  shipment: ScmShipment;
  onUpdateStatus: (shipmentId: string, status: ScmShipment["status"]) => Promise<void>;
  getSmsText: (shipment: ScmShipment) => string;
}

/**
 * 모바일 전용 수입 통관 바 트래커 및 현장 긴급 독촉 SMS/전화 연동 모듈 카드
 */
export default function MobileScmTrackerCard({
  shipment,
  onUpdateStatus,
  getSmsText,
}: MobileScmTrackerCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);

  const statuses: { key: ScmShipment["status"]; label: string; icon: React.ReactNode }[] = [
    { key: "SHIPPED", label: "선적완료", icon: <Ship className="w-3.5 h-3.5" /> },
    { key: "CUSTOMS", label: "통관중", icon: <Landmark className="w-3.5 h-3.5" /> },
    { key: "DOMESTIC", label: "국내운송", icon: <Truck className="w-3.5 h-3.5" /> },
    { key: "ARRIVED", label: "입고완료", icon: <CheckSquare className="w-3.5 h-3.5" /> },
  ];

  const currentIndex = statuses.findIndex((s) => s.key === shipment.status);

  const handleStepClick = async (statusKey: ScmShipment["status"]) => {
    if (statusKey === shipment.status) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(shipment.id, statusKey);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const smsText = getSmsText(shipment);
  // 모바일 SMS 링크 생성 (iOS/Android 호환성 처리)
  const isIOS = typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const smsHref = `sms:01012345678${isIOS ? "&" : "?"}body=${encodeURIComponent(smsText)}`;
  const telHref = "tel:01012345678";

  const isCritical = shipment.risk === "CRITICAL";
  const isWarning = shipment.risk === "WARNING";

  return (
    <div className={`bg-white rounded-2xl border text-left p-4 space-y-4 transition-all shadow-xs ${
      isCritical
        ? "border-rose-400 bg-rose-50/10"
        : isWarning
        ? "border-amber-300 bg-amber-50/10"
        : "border-slate-200"
    }`}>
      
      {/* 1. 상단 정보 */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
              {shipment.id}
            </span>
            <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded ${
              isCritical ? "bg-rose-100 text-rose-700 animate-pulse" :
              isWarning ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {isCritical ? "지연 심각" : isWarning ? "지연 주의" : "양호"}
            </span>
          </div>
          <h4 className="text-xs font-black text-slate-800">{shipment.item}</h4>
          <p className="text-[9px] text-slate-400 font-bold">협력사: {shipment.supplierName}</p>
        </div>

        <div className="text-right">
          <span className="block text-[8px] text-slate-400 font-black">AI 지연 확률</span>
          <span className={`text-[12px] font-black ${
            isCritical ? "text-rose-600" : isWarning ? "text-amber-600" : "text-slate-500"
          }`}>
            {shipment.delayProbability}%
          </span>
          <span className="block text-[8px] text-slate-400 font-bold mt-0.5">ETA: {shipment.eta}</span>
        </div>
      </div>

      {/* 2. 바 형태의 수입 통관 단계 트래커 */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between text-[8.5px] text-slate-450 font-black px-1">
          <span>물류 트래킹 실시간 제어</span>
          <span className="text-[7.5px] text-indigo-600 font-bold">● 단계를 탭하여 갱신</span>
        </div>
        
        {/* 진행 바 */}
        <div className="relative flex items-center justify-between">
          {/* 뒷배경 비진행 라인 */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0" />
          {/* 활성화된 진행 라인 */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-650 rounded-full z-0 transition-all duration-350"
            style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
          />

          {/* 각 단계별 버튼 노드 */}
          {statuses.map((status, idx) => {
            const isActive = idx <= currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={status.key}
                disabled={isUpdating}
                onClick={() => handleStepClick(status.key)}
                className={`relative z-10 flex flex-col items-center group focus:outline-none`}
              >
                {/* 원형 노드 */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCurrent
                    ? "bg-indigo-650 border-indigo-650 text-white shadow-xs ring-4 ring-indigo-650/15"
                    : isActive
                    ? "bg-indigo-50 border-indigo-600 text-indigo-650"
                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-350"
                }`}>
                  {isCurrent && isUpdating ? (
                    <RefreshCcw className="w-3 h-3 animate-spin" />
                  ) : (
                    status.icon
                  )}
                </div>
                {/* 단계 라벨 */}
                <span className={`text-[8px] font-black mt-1.5 transition-colors ${
                  isCurrent ? "text-indigo-650" : isActive ? "text-slate-700" : "text-slate-400"
                }`}>
                  {status.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 모바일 핫링크 독촉 모듈 */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <a
          href={telHref}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[9.5px] rounded-xl border border-slate-200 transition-colors"
        >
          <Phone className="w-3.5 h-3.5 text-slate-500" />
          담당기사 전화연결
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
          긴급 독촉 SMS 발송
        </button>
      </div>

      {/* 독촉 메시지 템플릿 모달 */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h5 className="text-[11px] font-black text-slate-800">긴급 독촉 메시지 템플릿</h5>
              <button
                type="button"
                onClick={() => setShowSmsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                닫기
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[7.5px] text-indigo-500 font-black">전송될 메시지 내용</span>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[9px] font-bold text-slate-650 whitespace-pre-wrap">
                {smsText}
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold">
              <span>수신인: 협력사 물류 담당자</span>
              <span>번호: 010-1234-5678</span>
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
                SMS 앱 실행 및 전송
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
