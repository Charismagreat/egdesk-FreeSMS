import React from "react";
import { CreditRiskStats } from "../../../credit-risk/types";
import { Phone, MessageSquare, AlertTriangle, Share2, Coins } from "lucide-react";

interface MobileCreditTrackerCardProps {
  stats: CreditRiskStats[];
  getDialLink: (phone: string) => string;
  getSmsLink: (partner: CreditRiskStats) => string;
}

export default function MobileCreditTrackerCard({
  stats,
  getDialLink,
  getSmsLink
}: MobileCreditTrackerCardProps) {
  
  // 사내 채권관리 전담 직원 또는 사장님 공유용 SMS 링크 생성
  const getAdminShareSmsLink = (partner: CreditRiskStats) => {
    const adminPhone = "010-0000-0000"; // 대표 관리자 연락처 (가상)
    const shareMessage = `[채권관리 관리 보고]
거래처 [${partner.companyName}]에 대해 신용등급 하락 및 부도 위험률이 ${partner.defaultProbability.toFixed(1)}%로 포착되었습니다.
현재 연체 D+${partner.overdueDays}일, 미수금 ₩${partner.overdueAmount.toLocaleString()}원입니다.
변제 최고장 우편 발부 및 법적 지급명령 절차 검토를 건의합니다.`;

    return `sms:${adminPhone}?body=${encodeURIComponent(shareMessage)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black text-slate-400">거래처 위험 모니터링 리스트</span>
        <span className="text-[9px] font-black text-rose-500 flex items-center gap-0.5">
          <AlertTriangle className="w-3 h-3" /> 연체 리스크 집중 관리 대상
        </span>
      </div>

      <div className="space-y-3">
        {stats.map((partner) => {
          const isCritical = partner.riskLevel === "CRITICAL";
          const isWarning = partner.riskLevel === "WARNING";
          const hasOverdue = partner.overdueAmount > 0;

          return (
            <div
              key={partner.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-3 shadow-lg"
            >
              {/* 상단 파트너 정보 & 상태 뱃지 */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                      isCritical
                        ? "bg-rose-500 text-white"
                        : isWarning
                        ? "bg-amber-500 text-white"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}>
                      {partner.riskLevel}
                    </span>

                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300">
                      신용 {partner.creditRating}등급
                    </span>

                    <span className="text-[8px] font-bold text-slate-400 font-mono">
                      확률: {partner.defaultProbability.toFixed(1)}%
                    </span>
                  </div>

                  <h3 className="text-xs font-black text-white tracking-tight mt-1.5">
                    {partner.companyName}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-medium">
                    담당: {partner.managerName} ({partner.managerPhone})
                  </p>
                </div>

                {/* 미수금 액수 및 연체 일수 */}
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400">누적 미수금</span>
                  <span className="text-xs font-black font-mono text-white block mt-0.5">
                    ₩ {partner.overdueAmount.toLocaleString()}원
                  </span>
                  {hasOverdue ? (
                    <span className="inline-block text-[8px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md mt-1">
                      D+{partner.overdueDays} 연체 중
                    </span>
                  ) : (
                    <span className="inline-block text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md mt-1">
                      정상 수금 완료
                    </span>
                  )}
                </div>
              </div>

              {/* 최근 조치 내용 정보 제공 */}
              <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-[9px] font-bold text-slate-300 flex items-center justify-between">
                <span>최근 이력: {partner.lastAction}</span>
                <span className="text-[8px] font-medium font-mono text-slate-400">{partner.actionDate}</span>
              </div>

              {/* 하단 모바일 단축 실행 액션 링크 버튼들 */}
              {hasOverdue && (
                <div className="grid grid-cols-3 gap-2 pt-1.5">
                  {/* 유선 통화 */}
                  <a
                    href={getDialLink(partner.managerPhone)}
                    className="flex items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black transition border border-white/15"
                  >
                    <Phone className="w-3 h-3 text-slate-300" />
                    전화 통화
                  </a>

                  {/* 독촉 SMS (sms: 핫링크) */}
                  <a
                    href={getSmsLink(partner)}
                    className="flex items-center justify-center gap-1 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[9px] font-black transition"
                  >
                    <MessageSquare className="w-3 h-3 text-indigo-200" />
                    독촉 SMS
                  </a>

                  {/* 사내 공유용 보고 문자 */}
                  <a
                    href={getAdminShareSmsLink(partner)}
                    className="flex items-center justify-center gap-1 py-2 bg-rose-950/40 hover:bg-rose-900/30 text-rose-200 rounded-xl text-[9px] font-black transition border border-rose-500/20"
                  >
                    <Share2 className="w-3 h-3 text-rose-350" />
                    최고서 보고
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
