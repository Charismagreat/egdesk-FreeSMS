import React, { useState } from "react";
import { GrantAnnouncement, CompanyProfile } from "../types";
import { Award, Bookmark, BookmarkCheck, FileText, Sparkles, Building2, HelpCircle, AlertCircle } from "lucide-react";

interface GrantMatchCardProps {
  announcements: GrantAnnouncement[];
  companyProfile: CompanyProfile | null;
  onToggleBookmark: (id: string) => Promise<void>;
  onGenerateRndPlan: (id: string) => Promise<void>;
  selectedAnnId: string | null;
  isGenerating: boolean;
}

/**
 * 정부 지원 사업 공고 리스트 및 기업 매칭 스코어보드 카드
 */
export default function GrantMatchCard({
  announcements,
  companyProfile,
  onToggleBookmark,
  onGenerateRndPlan,
  selectedAnnId,
  isGenerating,
}: GrantMatchCardProps) {
  const [expandedAnnId, setExpandedAnnId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedAnnId(expandedAnnId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left space-y-6">
      
      {/* 1. 기업 매칭 기본 매트릭스 */}
      {companyProfile && (
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Building2 className="w-4.5 h-4.5 text-slate-500" />
            <span className="text-xs font-black text-slate-700">당사 AI 매칭 프로필 정보</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[9.5px] font-bold text-slate-500">
            <div>
              <span className="block text-[8px] text-slate-400 font-black">업태 및 분야</span>
              <span className="text-slate-800 text-[10.5px] font-black">{companyProfile.sector}</span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-400 font-black">설립 연도 (업력)</span>
              <span className="text-slate-800 text-[10.5px] font-mono font-black">
                {companyProfile.establishmentYear}년 (창업 4년차)
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-400 font-black">보유 특허</span>
              <span className="text-indigo-600 text-[10.5px] font-mono font-black">
                {companyProfile.patentsCount}건
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-400 font-black">근로자 비율 (청년/여성)</span>
              <span className="text-slate-800 text-[10.5px] font-mono font-black">
                청년 {companyProfile.youthEmployeeRatio}% / 여성 {companyProfile.femaleEmployeeRatio}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. 공고 목록 대장 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Award className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">실시간 정부 지원금 공고 매칭 보드</h4>
              <p className="text-[9px] text-slate-400 font-bold">인공지능이 자사 프로필을 분석하여 실시간 적합 자격을 대조합니다.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {announcements.map((ann) => {
            const isExpanded = expandedAnnId === ann.id;
            const isSelected = selectedAnnId === ann.id;
            
            // 점수 색상 배정
            const scoreColor =
              ann.matchScore >= 90
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : ann.matchScore >= 80
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-slate-50 text-slate-500 border-slate-200";

            return (
              <div
                key={ann.id}
                className={`border rounded-2xl transition-all ${
                  isExpanded ? "border-indigo-600 bg-indigo-50/5" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* 상단 기본 헤더 */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[8.5px] font-black text-slate-400 font-mono">{ann.id}</span>
                      <span className="text-[8.5px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {ann.agency}
                      </span>
                      <span className="text-[8.5px] font-bold text-slate-550 border border-slate-200 px-1.5 py-0.5 rounded">
                        {ann.category === "RND" ? "기술 R&D" : ann.category === "GRANT" ? "무상 보조금" : "정책 융자"}
                      </span>
                    </div>
                    
                    <h5 
                      onClick={() => toggleExpand(ann.id)}
                      className="text-xs font-black text-slate-800 cursor-pointer hover:text-indigo-600 transition-colors"
                    >
                      {ann.title}
                    </h5>

                    <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400">
                      <span>규모: <b className="text-slate-700">{ann.budget}</b></span>
                      <span>마감: <b className="text-slate-700">{ann.deadline}</b></span>
                    </div>
                  </div>

                  {/* 스코어 및 액션 버튼들 */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`border rounded-xl px-3 py-1.5 text-center ${scoreColor}`}>
                      <span className="block text-[7.5px] font-black uppercase tracking-wider">AI 적합도</span>
                      <span className="text-xs font-black font-mono">{ann.matchScore}%</span>
                    </div>

                    {/* 북마크 */}
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(ann.id)}
                      className={`p-2 rounded-xl border transition-colors ${
                        ann.isBookmarked
                          ? "bg-amber-50 border-amber-200 text-amber-500"
                          : "bg-white border-slate-250 text-slate-400 hover:text-slate-650"
                      }`}
                    >
                      {ann.isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 fill-amber-500" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>

                    {/* R&D 생성 가동 */}
                    {ann.category === "RND" ? (
                      <button
                        type="button"
                        disabled={isGenerating && !isSelected}
                        onClick={() => onGenerateRndPlan(ann.id)}
                        className={`px-3 py-2 text-white font-extrabold text-[9.5px] rounded-xl shadow-2xs transition-all flex items-center gap-1.5 ${
                          isSelected && isGenerating
                            ? "bg-slate-400 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isSelected && isGenerating ? "AI 빌딩 중..." : "AI 계획서 빌드"}
                      </button>
                    ) : (
                      <a
                        href="https://www.bizinfo.go.kr"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 border border-slate-250 hover:bg-slate-50 text-slate-650 font-bold text-[9.5px] rounded-xl flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        상세 공고
                      </a>
                    )}
                  </div>
                </div>

                {/* 아코디언 확장 영역 (AI 추천 가이드 및 세부 조언) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl text-left space-y-2.5">
                    <div className="flex items-center gap-1 text-[8.5px] text-slate-450 font-black">
                      <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
                      <span>AI 매칭 진단 & 보완 제언 리포트</span>
                    </div>
                    <ul className="space-y-1.5 text-[9px] font-bold text-slate-600 pl-1">
                      {ann.matchGuide.map((guide, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {guide}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
