import React, { useState } from "react";
import { GrantAnnouncement } from "../../../grant-management/types";
import { Bookmark, BookmarkCheck, Share2, Award, Calendar, DollarSign, MessageSquare, AlertCircle } from "lucide-react";

interface MobileGrantTrackerCardProps {
  announcement: GrantAnnouncement;
  onToggleBookmark: (id: string) => Promise<void>;
  getSmsText: (ann: GrantAnnouncement) => string;
}

/**
 * 모바일 전용 매칭 공고 카드 및 SMS 전달 공유 위젯
 */
export default function MobileGrantTrackerCard({
  announcement,
  onToggleBookmark,
  getSmsText,
}: MobileGrantTrackerCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  const smsText = getSmsText(announcement);
  const isIOS = typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const smsHref = `sms:?${isIOS ? "&" : ""}body=${encodeURIComponent(smsText)}`;

  const isHighMatch = announcement.matchScore >= 90;

  return (
    <div className={`bg-white rounded-2xl border text-left p-4 space-y-3 transition-all shadow-xs ${
      isHighMatch ? "border-indigo-400 bg-indigo-50/10" : "border-slate-200"
    }`}>
      
      {/* 1. 상단 타이틀 및 기본 정보 */}
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[8.5px] font-black text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded">
              {announcement.agency}
            </span>
            <span className="text-[8.5px] font-bold text-slate-450 border border-slate-200 px-1.5 py-0.5 rounded">
              {announcement.category === "RND" ? "기술 R&D" : announcement.category === "GRANT" ? "무상보조금" : "정책융자"}
            </span>
          </div>
          <h4 className="text-xs font-black text-slate-800 leading-snug break-all">
            {announcement.title}
          </h4>
        </div>

        {/* AI 적합도 뱃지 */}
        <div className="text-right shrink-0">
          <span className="block text-[8px] text-slate-400 font-black">AI 적합도</span>
          <span className={`text-[12px] font-black font-mono ${isHighMatch ? "text-indigo-600" : "text-slate-500"}`}>
            {announcement.matchScore}%
          </span>
        </div>
      </div>

      {/* 2. 핵심 요약 메트릭 */}
      <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-500 bg-slate-50/50 p-2 rounded-xl">
        <span className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          규모: <b className="text-slate-700">{announcement.budget}</b>
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          마감: <b className="text-slate-700">{announcement.deadline}</b>
        </span>
      </div>

      {/* 3. AI 제언 1줄 요약 */}
      <div className="text-[8.5px] font-bold text-slate-650 flex gap-1 items-start pl-1">
        <AlertCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
        <p className="leading-normal">{announcement.matchGuide[0]}</p>
      </div>

      {/* 4. 액션 버튼 */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onToggleBookmark(announcement.id)}
          className={`flex items-center justify-center gap-1.5 py-2.5 font-extrabold text-[9.5px] rounded-xl border transition-colors ${
            announcement.isBookmarked
              ? "bg-amber-50 border-amber-200 text-amber-600"
              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
          }`}
        >
          {announcement.isBookmarked ? (
            <>
              <BookmarkCheck className="w-3.5 h-3.5 fill-amber-500" />
              보관 해제
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5" />
              관심공고 보관
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-650 hover:bg-indigo-700 border border-indigo-650 text-white font-extrabold text-[9.5px] rounded-xl shadow-2xs transition-colors"
        >
          <Share2 className="w-3.5 h-3.5 text-white" />
          담당 직원 공유
        </button>
      </div>

      {/* SMS 공유 모달 */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-slate-100 shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h5 className="text-[11px] font-black text-slate-800">지원 사업 공고 SMS 전송</h5>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-650 font-bold text-xs"
              >
                닫기
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[7.5px] text-indigo-500 font-black">전달될 알림 문자 템플릿</span>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[9px] font-bold text-slate-650 whitespace-pre-wrap">
                {smsText}
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold">
              <span>수신인: 사내 R&D/정부과제 담당자</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="py-2 border border-slate-250 hover:bg-slate-50 text-slate-650 font-bold text-[9.5px] rounded-xl transition-colors"
              >
                취소
              </button>
              <a
                href={smsHref}
                onClick={() => setShowShareModal(false)}
                className="py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-[9.5px] rounded-xl text-center shadow-2xs block transition-colors"
              >
                SMS 앱 실행
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
