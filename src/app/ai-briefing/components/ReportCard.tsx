import React from "react";
import { 
  ArrowUp, ArrowDown, Edit, Check, X, MoreVertical, FileText, 
  Maximize2, Minimize2, Eye, EyeOff, Link, Clock, Download, 
  RefreshCw, Database, Trash2, Activity 
} from "lucide-react";
import { Report } from "../types";
import DBChartRenderer from "@/components/DBChartRenderer";
import { SafeBriefingMarkdown } from "./SafeBriefingMarkdown";

interface ReportCardProps {
  board: Report;
  index: number;
  reportsLength: number;
  isEditing: boolean;
  isUpdating: boolean;
  cardSpan: 1 | 2;
  openMenuId: string | null;
  hiddenBriefing: boolean;
  tempTitle: string;
  setTempTitle: (val: string) => void;
  setEditingReportId: (id: string | null) => void;
  setOpenMenuId: (id: string | null) => void;
  handleMoveOrder: (index: number, direction: 'UP' | 'DOWN') => Promise<void>;
  handleSaveTitle: (shareId: string) => Promise<void>;
  handleToggleBriefingVisibility: (shareId: string) => void;
  handleToggleCardSpan: (shareId: string) => void;
  handleToggleShareActive: (shareId: string, currentStatus: number) => Promise<void>;
  handleCycleInterval: (shareId: string, currentInterval: string) => void;
  handleDownloadExcel: (rows: any[], title: string) => Promise<void>;
  handleDownloadPng: (shareId: string, title: string) => void;
  handleRefreshReport: (shareId: string) => Promise<void>;
  handleGoToEditQuery: (sql: string, tableName: string) => void;
  handleDeleteReport: (shareId: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'warn') => void;
}

export function ReportCard({
  board,
  index,
  reportsLength,
  isEditing,
  isUpdating,
  cardSpan,
  openMenuId,
  hiddenBriefing,
  tempTitle,
  setTempTitle,
  setEditingReportId,
  setOpenMenuId,
  handleMoveOrder,
  handleSaveTitle,
  handleToggleBriefingVisibility,
  handleToggleCardSpan,
  handleToggleShareActive,
  handleCycleInterval,
  handleDownloadExcel,
  handleDownloadPng,
  handleRefreshReport,
  handleGoToEditQuery,
  handleDeleteReport,
  showToast
}: ReportCardProps) {
  // 차트 스펙 디코딩
  let specObj: any = null;
  let sampleRows: any[] = [];
  try {
    specObj = typeof board.chart_spec_json === 'string'
      ? JSON.parse(board.chart_spec_json)
      : board.chart_spec_json;
    
    if (specObj && specObj.sampleRows) {
      sampleRows = specObj.sampleRows;
    }
  } catch (e) {
    console.error("차트 스펙 해독 실패:", e);
  }

  return (
    <div 
      className={`bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden transition-all duration-200 animate-fade-in hover:shadow-md relative ${
        cardSpan === 2 
          ? 'xl:col-span-1' 
          : 'xl:col-span-2'
      }`}
    >
      
      {/* 1. 리포트 헤더 컨트롤러막대 */}
      <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* 좌측: 순서 버튼, 타이틀/인라인 편집기, 최종갱신일시 */}
        <div className="flex flex-wrap items-center gap-3.5 min-w-0 flex-1">
          
          <div className="flex items-center gap-3">
            {/* 순서 이동 물리 컨트롤 단추 */}
            <div className="flex flex-col gap-1.5 shrink-0 select-none">
              <button
                type="button"
                onClick={() => handleMoveOrder(index, 'UP')}
                disabled={index === 0}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded cursor-pointer border-none bg-transparent"
                title="이 보고서를 한 칸 위로 올림"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveOrder(index, 'DOWN')}
                disabled={index === reportsLength - 1}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded cursor-pointer border-none bg-transparent"
                title="이 보고서를 한 칸 아래로 내림"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(board.share_id)}
                  className="text-sm font-bold bg-white border border-indigo-300 rounded-xl px-3 py-1.5 text-slate-800 outline-none w-full max-w-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="보고서 타이틀 입력..."
                />
                <button
                  type="button"
                  onClick={() => handleSaveTitle(board.share_id)}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border-none cursor-pointer flex items-center justify-center shrink-0 shadow-3xs"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingReportId(null)}
                  className="p-2 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-pointer flex items-center justify-center shrink-0 shadow-3xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <h2 className="text-sm font-black text-slate-850 truncate flex items-center gap-1.5">
                {board.custom_title || board.title}
                <button
                  type="button"
                  onClick={() => {
                    setTempTitle(board.custom_title || board.title);
                    setEditingReportId(board.share_id);
                  }}
                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded cursor-pointer border-none bg-transparent"
                  title="제목 인라인 수정"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </h2>
            )}
          </div>

          {/* 최종 갱신 일시 배지 */}
          <span className="text-[10px] text-indigo-550 font-bold font-mono bg-indigo-50/50 px-2.5 py-1 rounded-lg select-none shrink-0">
            최종 갱신: {(board.last_refreshed_at || board.created_at)?.slice(0, 16)}
          </span>

        </div>

        {/* 우측: 9대 제어 아이콘 툴바 (2열인 경우 드롭다운 압축) */}
        <div className="flex items-center shrink-0 select-none relative">
          {cardSpan === 2 ? (
            // 🌟 2열 그리드인 경우: [...] MoreVertical 버튼 하나로 압축
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === board.share_id ? null : board.share_id);
                }}
                className="p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-650 cursor-pointer flex items-center justify-center"
                title="더보기 메뉴"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* 플로팅 미니 제어 툴바 */}
              {openMenuId === board.share_id && (
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  className="absolute right-0 top-10 bg-white/95 backdrop-blur-md border border-slate-150 rounded-2xl shadow-xl px-3 py-1.5 z-40 flex items-center gap-0.5 animate-fade-in min-w-[320px] justify-end"
                >
                  {/* 0. AI 분석 텍스트 보이기/숨기기 토글 단추 */}
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleBriefingVisibility(board.share_id);
                      setOpenMenuId(null);
                    }}
                    className={`p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                      hiddenBriefing ? "text-slate-400" : "text-indigo-600 font-bold"
                    }`}
                    title={hiddenBriefing ? "AI 데이터 분석 정보 보기" : "AI 데이터 분석 정보 접기"}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  {/* 1. 와이드 보기로 키우는 버튼 */}
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleCardSpan(board.share_id);
                      setOpenMenuId(null);
                    }}
                    className="p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer text-indigo-650"
                    title="와이드 보기로 확대 (1열 전체 채우기)"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* 2. 공유 활성 토글 */}
                  <button
                    type="button"
                    onClick={() => handleToggleShareActive(board.share_id, board.is_active)}
                    className={`p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                      Number(board.is_active) === 1 ? "text-emerald-600" : "text-slate-400"
                    }`}
                    title={Number(board.is_active) === 1 ? "외부 공개 중 (클릭 시 비공개 잠금)" : "비공개 상태 (클릭 시 외부 공개 활성화)"}
                  >
                    {Number(board.is_active) === 1 ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                  </button>

                  {/* 3. 공유 링크 복사 */}
                  <button
                    type="button"
                    onClick={() => {
                      if (Number(board.is_active) !== 1) return;
                      const url = `${window.location.origin}/public/share/${board.share_id}`;
                      navigator.clipboard.writeText(url);
                      showToast("🔗 퍼블릭 공유 URL이 클립보드에 복사되었습니다!", "success");
                    }}
                    disabled={Number(board.is_active) !== 1}
                    className={`p-2 bg-transparent rounded-xl transition-all active:scale-95 flex items-center justify-center ${
                      Number(board.is_active) === 1
                        ? "text-indigo-500 hover:bg-slate-100 cursor-pointer"
                        : "text-slate-350 cursor-not-allowed"
                    }`}
                    title={Number(board.is_active) === 1 ? "퍼블릭 공유 링크 클립보드 복사" : "공개 활성화 시 링크 복사 가능"}
                  >
                    <Link className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  {/* 4. 자동 갱신 주기 순환 토글 */}
                  <button
                    type="button"
                    onClick={() => handleCycleInterval(board.share_id, board.refresh_interval)}
                    className={`p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                      board.refresh_interval === "HOURLY" ? "text-amber-500" : 
                      board.refresh_interval === "DAILY" ? "text-blue-500" : 
                      board.refresh_interval === "WEEKLY" ? "text-purple-500" : "text-slate-400"
                    }`}
                    title={`자동 갱신 주기 변경 (현재: ${
                      board.refresh_interval === "NONE" || !board.refresh_interval ? "자동갱신 없음" : 
                      board.refresh_interval === "HOURLY" ? "매시간 자동갱신" : 
                      board.refresh_interval === "DAILY" ? "매일 자동갱신" : "매주 자동갱신"
                    } / 클릭 시 순환 전환)`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  <div className="w-px h-4 bg-slate-200 mx-1" />

                  {/* 5. Excel 다운 */}
                  <button
                    type="button"
                    onClick={() => handleDownloadExcel(sampleRows, board.custom_title || board.title)}
                    disabled={sampleRows.length === 0}
                    className="p-2 bg-transparent hover:bg-slate-100 text-emerald-600 rounded-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    title="원본 데이터 Excel 다운로드"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  {/* 6. 차트 이미지 저장 (PNG) */}
                  <button
                    type="button"
                    onClick={() => handleDownloadPng(board.share_id, board.custom_title || board.title)}
                    className="p-2 bg-transparent hover:bg-slate-100 text-indigo-500 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                    title="반응형 차트 이미지 다운로드 (PNG)"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  <div className="w-px h-4 bg-slate-200 mx-1" />

                  {/* 7. 실시간 갱신 */}
                  <button
                    type="button"
                    onClick={() => handleRefreshReport(board.share_id)}
                    disabled={isUpdating}
                    className="p-2 bg-transparent hover:bg-slate-100 text-slate-500 rounded-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    title="실시간 갱신 (SQL 데이터 재조회 및 AI 브리핑 재스캔)"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin text-indigo-650" : "text-slate-500"}`} />
                  </button>

                  {/* 8. 원본 수정 */}
                  <button
                    type="button"
                    onClick={() => handleGoToEditQuery(board.sql_query, board.table_name)}
                    className="p-2 bg-transparent hover:bg-slate-100 text-indigo-550 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                    title="원본 SQL 플레이그라운드 이동하여 쿼리 정밀 편집"
                  >
                    <Database className="w-3.5 h-3.5 text-indigo-555" />
                  </button>

                  {/* 9. 게시 철회 */}
                  <button
                    type="button"
                    onClick={() => handleDeleteReport(board.share_id)}
                    className="p-2 bg-transparent hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                    title="이 대시보드 게시 철회 및 영구 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            // 🌟 1열 와이드인 경우: 기존처럼 평면적인 툴바 바로 노출
            <>
              {/* ↕️ 개별 와이드/콤팩트 크기 조율 */}
              <button
                type="button"
                onClick={() => handleToggleCardSpan(board.share_id)}
                className="p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600"
                title="콤팩트 보기로 축소 (2열 바둑판 배치)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>

              {/* 💬 AI 분석 텍스트 보이기/숨기기 토글 단추 */}
              <button
                type="button"
                onClick={() => handleToggleBriefingVisibility(board.share_id)}
                className={`p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                  hiddenBriefing ? "text-slate-400" : "text-indigo-600 font-bold"
                }`}
                title={hiddenBriefing ? "AI 데이터 분석 정보 보기" : "AI 데이터 분석 정보 접기"}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
              </button>

              {/* 👁️ 공유 활성 토글 */}
              <button
                type="button"
                onClick={() => handleToggleShareActive(board.share_id, board.is_active)}
                className={`p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                  Number(board.is_active) === 1 ? "text-emerald-600" : "text-slate-400"
                }`}
                title={Number(board.is_active) === 1 ? "외부 공개 중 (클릭 시 비공개 잠금)" : "비공개 상태 (클릭 시 외부 공개 활성화)"}
              >
                {Number(board.is_active) === 1 ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
              </button>

              {/* 🔗 공유 링크 복사 */}
              <button
                type="button"
                onClick={() => {
                  if (Number(board.is_active) !== 1) return;
                  const url = `${window.location.origin}/public/share/${board.share_id}`;
                  navigator.clipboard.writeText(url);
                  showToast("🔗 퍼블릭 공유 URL이 클립보드에 복사되었습니다!", "success");
                }}
                disabled={Number(board.is_active) !== 1}
                className={`p-2 bg-transparent rounded-xl transition-all active:scale-95 flex items-center justify-center ${
                  Number(board.is_active) === 1
                    ? "text-indigo-500 hover:bg-slate-100 cursor-pointer"
                    : "text-slate-350 cursor-not-allowed"
                }`}
                title={Number(board.is_active) === 1 ? "퍼블릭 공유 링크 클립보드 복사" : "공개 활성화 시 링크 복사 가능"}
              >
                <Link className="w-3.5 h-3.5 shrink-0" />
              </button>

              {/* ⏰ 자동 갱신 주기 순환 토글 */}
              <button
                type="button"
                onClick={() => handleCycleInterval(board.share_id, board.refresh_interval)}
                className={`p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                  board.refresh_interval === "HOURLY" ? "text-amber-500" : 
                  board.refresh_interval === "DAILY" ? "text-blue-500" : 
                  board.refresh_interval === "WEEKLY" ? "text-purple-500" : "text-slate-400"
                }`}
                title={`자동 갱신 주기 변경 (현재: ${
                  board.refresh_interval === "NONE" || !board.refresh_interval ? "자동갱신 없음" : 
                  board.refresh_interval === "HOURLY" ? "매시간 자동갱신" : 
                  board.refresh_interval === "DAILY" ? "매일 자동갱신" : "매주 자동갱신"
                } / 클릭 시 순환 전환)`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
              </button>

              <div className="w-px h-4 bg-slate-200 mx-1.5" />

              {/* 5. Excel 다운 */}
              <button
                type="button"
                onClick={() => handleDownloadExcel(sampleRows, board.custom_title || board.title)}
                disabled={sampleRows.length === 0}
                className="p-2 bg-transparent hover:bg-slate-100 text-emerald-600 rounded-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                title="원본 데이터 Excel 다운로드"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
              </button>

              {/* 6. 차트 이미지 저장 (PNG) */}
              <button
                type="button"
                onClick={() => handleDownloadPng(board.share_id, board.custom_title || board.title)}
                className="p-2 bg-transparent hover:bg-slate-100 text-indigo-500 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                title="반응형 차트 이미지 다운로드 (PNG)"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
              </button>

              <div className="w-px h-4 bg-slate-200 mx-1.5" />

              {/* 7. 실시간 갱신 */}
              <button
                type="button"
                onClick={() => handleRefreshReport(board.share_id)}
                disabled={isUpdating}
                className="p-2 bg-transparent hover:bg-slate-100 text-slate-500 rounded-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                title="실시간 갱신 (SQL 데이터 재조회 및 AI 브리핑 재스캔)"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin text-indigo-600" : "text-slate-500"}`} />
              </button>

              {/* 8. 원본 수정 */}
              <button
                type="button"
                onClick={() => handleGoToEditQuery(board.sql_query, board.table_name)}
                className="p-2 bg-transparent hover:bg-slate-100 text-indigo-600 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                title="원본 SQL 플레이그라운드 이동하여 쿼리 정밀 편집"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
              </button>

              {/* 9. 게시 철회 */}
              <button
                type="button"
                onClick={() => handleDeleteReport(board.share_id)}
                className="p-2 bg-transparent hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                title="이 대시보드 게시 철회 및 영구 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

      </div>

      {/* 2. 리포트 본문 일체형 영역 */}
      <div className="p-6 space-y-6">
        {isUpdating ? (
          <div className="p-16 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse flex flex-col items-center justify-center text-center space-y-4 select-none">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-black text-slate-700">AI 지능형 엔진이 데이터 실시간 최신 분석 및 브리핑을 융합 집필 중입니다...</p>
              <p className="text-[10px] text-slate-400 font-bold">LME/SQLite 가격 마스킹 및 요점 해석 중 (약 2초 소요)</p>
            </div>
          </div>
        ) : (
          <>
            {/* 📊 1. 지능형 SVG 차트 렌더러 영역 */}
            <div className="space-y-3">
              
              <div id={`chart-container-${board.share_id}`} className="w-full overflow-hidden">
                {specObj ? (
                  <DBChartRenderer spec={specObj} rows={sampleRows} />
                ) : (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2 select-none">
                    <Activity className="w-6 h-6 text-slate-350 animate-pulse" />
                    <span className="text-[11px] font-bold">시각화 차트 스펙이 올바르지 않습니다.</span>
                  </div>
                )}
              </div>
            </div>

            {/* 📝 2. AI 비즈니스 통찰 브리핑 요약 영역 */}
            <div className="space-y-3">
              
              {hiddenBriefing ? (
                <div 
                  onClick={() => handleToggleBriefingVisibility(board.share_id)}
                  className="p-3.5 border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-2xl cursor-pointer text-center text-indigo-650 transition-all select-none animate-fade-in flex items-center justify-center gap-2"
                  title="AI 데이터 분석 텍스트 펼치기"
                >
                  <FileText className="w-4 h-4 text-indigo-550 shrink-0" />
                  <span className="text-xs font-bold">AI 분석 텍스트 정보가 접혀 있습니다. (클릭 시 펼치기 💡)</span>
                </div>
              ) : board.briefing_markdown ? (
                <div className="bg-emerald-50/30 border border-emerald-100/60 rounded-2xl p-5 shadow-3xs animate-fade-in">
                  <SafeBriefingMarkdown content={board.briefing_markdown} />
                </div>
              ) : (
                <div className="p-8 bg-slate-50/40 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center text-center text-slate-400 select-none">
                  <Activity className="w-6 h-6 text-slate-350 mb-1.5 animate-pulse" />
                  <p className="text-xs font-bold">비즈니스 브리핑 리포트를 불러오지 못했습니다.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
