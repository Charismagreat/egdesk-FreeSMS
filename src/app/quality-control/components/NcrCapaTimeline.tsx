import React from "react";
import { NcrItem, SimilarCase } from "../types";
import { ClipboardList, CheckCircle, Search, AlertCircle, FileText, Send, Sparkles } from "lucide-react";

interface NcrCapaTimelineProps {
  ncrList: NcrItem[];
  similarCases: SimilarCase[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedNcr: NcrItem | null;
  onSelectNcr: (ncr: NcrItem | null) => void;
  actionDescription: string;
  onActionDescriptionChange: (desc: string) => void;
  isSaving: boolean;
  onSaveAction: (e: React.FormEvent) => void;
}

export default function NcrCapaTimeline({
  ncrList,
  similarCases,
  searchQuery,
  onSearchChange,
  selectedNcr,
  onSelectNcr,
  actionDescription,
  onActionDescriptionChange,
  isSaving,
  onSaveAction
}: NcrCapaTimelineProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 좌측/중앙: NCR 부적합 대장 리스트 */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">부적합 보고서 (NCR) & CAPA 대장</h3>
              <p className="text-[10px] text-slate-400 font-bold">중대재해처벌법 및 ISO9001 대응 추적 관리</p>
            </div>
          </div>

          {/* 통합 검색바 */}
          <div className="relative w-48 shrink-0">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="부적합품 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8.5 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold w-full focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
            />
          </div>
        </div>

        {/* NCR 리스트 테이블 */}
        <div className="overflow-x-auto bg-slate-50 border border-slate-150 rounded-2xl max-h-[360px] overflow-y-auto">
          <table className="min-w-full text-[10px] font-bold text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left">발행 코드</th>
                <th className="px-4 py-3 text-left">일시</th>
                <th className="px-4 py-3 text-left">품목/부적합 유형</th>
                <th className="px-4 py-3 text-left">수량</th>
                <th className="px-4 py-3 text-left">검사원</th>
                <th className="px-4 py-3 text-left">조치상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {ncrList.map((ncr) => {
                const isSelected = selectedNcr?.id === ncr.id;
                return (
                  <tr 
                    key={ncr.id}
                    onClick={() => onSelectNcr(ncr)}
                    className={`cursor-pointer transition-all hover:bg-rose-50/20 ${
                      isSelected ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-black text-slate-900">{ncr.id}</td>
                    <td className="px-4 py-3 text-slate-400 font-medium">{ncr.date.slice(5)}</td>
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-slate-850">{ncr.itemName}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">{ncr.defectType}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-850 font-black">{ncr.quantity}개</td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{ncr.reporter.split(" ")[0]}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black ${
                        ncr.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                        ncr.status === "CAPA_ISSUED" ? "bg-amber-100 text-amber-800" :
                        "bg-rose-100 text-rose-800"
                      }`}>
                        {ncr.status === "COMPLETED" ? "조치완료" :
                         ncr.status === "CAPA_ISSUED" ? "대책수립" : "검토중"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 우측: 시정 조치 계획 수립(CAPA) 및 AI 과거 유사 사례 피드 */}
      <div className="bg-slate-50 border border-slate-150 rounded-3xl p-5 space-y-4">
        {selectedNcr ? (
          <form onSubmit={onSaveAction} className="space-y-4">
            <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black text-slate-800">시정 조치 및 CAPA 수립</h4>
                <p className="text-[9px] text-slate-400 font-bold">대상: {selectedNcr.id}</p>
              </div>
              <button 
                type="button" 
                onClick={() => onSelectNcr(null)} 
                className="text-slate-400 hover:text-slate-600 text-xs font-black"
              >
                닫기
              </button>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-1">
              <span className="text-[8.5px] font-black text-rose-500 uppercase flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                부적합품 발생 세부 사항
              </span>
              <p className="text-[9.5px] font-black text-slate-800 mt-1">{selectedNcr.itemName} ({selectedNcr.defectType})</p>
              <p className="text-[9px] text-slate-500 font-bold leading-normal mt-1">{selectedNcr.description}</p>
            </div>

            {/* AI 과거 유사 조치 이력 추천 (RAG 피드) */}
            <div className="space-y-2">
              <span className="text-[9px] font-black text-indigo-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Gemini AI RAG: 과거 유사 결합 조치 추천
              </span>
              
              <div className="space-y-2 max-h-[140px] overflow-y-auto">
                {similarCases.map((sc) => (
                  <div key={sc.id} className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-2.5 text-[9.5px]">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-indigo-950">{sc.id} ({sc.similarity.toFixed(1)}% 일치)</span>
                    </div>
                    <p className="font-extrabold text-slate-700 mt-1">원인: {sc.rootCause}</p>
                    <p className="font-bold text-slate-650 mt-0.5">조치: {sc.actionTaken}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 시정 조치 입력 */}
            <div>
              <label className="text-[9px] font-black text-slate-450 block mb-1">시정 조치 및 CAPA 영구대책 기입</label>
              <textarea
                rows={3}
                placeholder="예: 사출 냉각 타이머 연장 및 스케일 세척 주기 단축..."
                value={actionDescription}
                onChange={(e) => onActionDescriptionChange(e.target.value)}
                className="text-[10px] font-bold w-full border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 text-white font-extrabold text-[10px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              CAPA 대책 등록 및 공식 조치 완료
            </button>
          </form>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-12 text-center text-slate-400 gap-3">
            <FileText className="w-10 h-10 text-slate-300" />
            <div>
              <p className="text-xs font-black">시정 조치 계획(CAPA)</p>
              <p className="text-[9.5px] text-slate-400 mt-1 leading-normal max-w-[180px] mx-auto">
                좌측 부적합 대장 목록에서 특정 보고서를 선택하시면, CAPA 계획 수립 및 AI 유사 불량 대책 검색 피드가 열립니다.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
