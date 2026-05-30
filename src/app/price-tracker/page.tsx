"use client";

import React from "react";
import { 
  Cpu, RefreshCw, Activity, Play, Copy, Check, Info, Calendar, 
  BarChart3, Globe, Search, Plus, Bell, Edit3, Trash2, ArrowUpRight, 
  Zap, ShieldAlert, AlertTriangle, CheckCircle2, ChevronRight, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 커스텀 훅 및 모달 컴포넌트 임포트
import { usePriceTracker, detectCurrency, getCurrencySymbol } from "@/hooks/usePriceTracker";
import ItemRegisterModal from "@/components/price-tracker/ItemRegisterModal";
import CollectorMappingModal from "@/components/price-tracker/CollectorMappingModal";
import CollectorGuideModal from "@/components/price-tracker/CollectorGuideModal";
import SmsAlertSettingModal from "@/components/price-tracker/SmsAlertSettingModal";

const CURRENCIES = ["USD", "EUR", "JPY", "CNY"];
const CURRENCY_NAMES: Record<string, string> = {
  USD: "미국 달러",
  EUR: "유럽 유로",
  JPY: "일본 엔화 (100)",
  CNY: "중국 위안"
};

export default function PriceTrackerAIPage() {
  const {
    items,
    activeItem,
    urls,
    alerts,
    alertLogs,
    exchangeRates,
    exchangeRateHistories,
    daemonInfo,
    activeRateTab,
    setActiveRateTab,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    isItemModalOpen,
    setIsItemModalOpen,
    isCollectorModalOpen,
    setIsCollectorModalOpen,
    isEditMode,
    setIsEditMode,
    editingItemId,
    miningItemIds,
    isAlertModalOpen,
    setIsAlertModalOpen,
    isCronHelpOpen,
    setIsCronHelpOpen,
    isDaemonHelpOpen,
    setIsDaemonHelpOpen,
    copiedUrlId,
    miningLoading,
    miningLoadStep,
    searchChannels,
    setSearchChannels,
    newChannelName,
    setNewChannelName,
    itemForm,
    setItemForm,
    urlForm,
    setUrlForm,
    alertForm,
    setAlertForm,
    loading,
    refreshing,
    crawlerTesting,
    updatingRates,
    startingDaemon,
    copiedText,
    selectorAnalyzing,
    backfillStartDate,
    setBackfillStartDate,
    backfillEndDate,
    setBackfillEndDate,
    isBackfilling,
    rateHoverInfo,
    setRateHoverInfo,
    itemHoverInfo,
    setItemHoverInfo,
    rateScrollRef,
    itemScrollRef,
    explainCron,
    fetchItemDetails,
    handleRefresh,
    handleSyncExchangeRates,
    handleStartDaemon,
    handleCopyCommand,
    handleBulkBackfill,
    handleItemSelect,
    handleSaveItem,
    handleDeleteItem,
    handleCopyUrl,
    handleEditItemClick,
    handleAnalyzeSelector,
    handleAddUrl,
    handleDeleteUrl,
    handleAddAlertRule,
    handleAutoDeploy,
    handleAddChannel,
    handleToggleChannel,
    handleRemoveChannel,
    getSvgPathData,
    getRateSvgPathData,
    filteredItems,
    marginWarningCount,
    isDaemonRunning
  } = usePriceTracker();

  const { path: svgPath, points: svgPoints, width: svgChartWidth } = getSvgPathData();
  const { path: rateSvgPath, points: rateSvgPoints, fillPath: rateFillPath, width: rateChartWidth } = getRateSvgPathData();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-pink-600 animate-spin" />
        <span className="text-sm font-bold text-slate-500">SCM 가격 관제 시스템 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 text-slate-800 font-sans">
      
      {/* 1. 상단 타이틀 주변 영역 (PC용 고정 수평 레이아웃) */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            <Cpu className="w-8 h-8 text-pink-600 mr-3" />
            가격 추적 AI
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncExchangeRates}
            disabled={updatingRates}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-white hover:from-slate-800 hover:to-indigo-900 border border-slate-800 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${updatingRates ? "animate-spin" : ""}`} />
            실시간 환율 강제 갱신
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-505 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "시세 갱신 중..." : "전광판 즉시 동기화"}
          </button>
        </div>
      </div>

      {/* 2. 🤖 SCM 가격 및 환율 수집 자율 데몬 통합 관제 센터 (PC용 최적화) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl border ${
              isDaemonRunning 
                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                : "bg-rose-50 border-rose-100 text-rose-600"
            }`}>
              <Activity className={`w-6 h-6 ${isDaemonRunning ? "animate-pulse" : ""}`} />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Background Daemon</span>
                <span className={`w-2 h-2 rounded-full ${isDaemonRunning ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`}></span>
              </div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                SCM 시황 및 환율 자율 수집 데몬 관제 센터
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  isDaemonRunning ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}>
                  {isDaemonRunning ? "ACTIVE 자율 구동 중" : "STOPPED 대기 상태"}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartDaemon}
              disabled={startingDaemon}
              className="flex items-center gap-1.5 px-3 py-2 bg-pink-650 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {startingDaemon ? "데몬 실행 중..." : "⚡ 자율 데몬 백그라운드 가동"}
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopyCommand("npm run price:daemon")}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-655 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {copiedText === "npm run price:daemon" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>터미널 수동 기동 복사</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsDaemonHelpOpen(true)}
                className="p-2 bg-slate-100 hover:bg-pink-50 hover:text-pink-500 border border-slate-200 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center"
                title="터미널 수동 기동 명령어 설명 보기"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 데몬 가동 상세 정보 패널 (PC용 4열 그리드 고정) */}
        <div className="grid grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">데몬 가동 프로세스 PID</span>
            <span className="font-mono font-black text-slate-700">{daemonInfo.pid}</span>
          </div>
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">최종 백그라운드 구동 시각</span>
            <span className="font-mono font-black text-slate-700">{daemonInfo.last_run}</span>
          </div>
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">자가 회복 백필(Backfill) 엔진</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              무중단 복원 대기
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">백그라운드 수집 주기</span>
            <span className="font-bold text-slate-700 font-mono">1분 (실시간 시뮬레이션 가동)</span>
          </div>
        </div>

        {/* 과거 환율 지정 기간 자율 소급 패널 (PC 고정 정렬) */}
        <div className="border-t border-slate-100 pt-4 mt-2 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-pink-650" />
                과거 누락 환율 지정 기간 소급 가져오기
              </h4>
              <p className="text-[9.5px] text-slate-400 font-semibold">데이터베이스에 수집되지 않은 과거 환율 공백을 원하는 기간만큼 일괄 자동 계산하여 복원합니다.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-705 gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">시작</span>
                  <input
                    type="date"
                    value={backfillStartDate}
                    onChange={(e) => setBackfillStartDate(e.target.value)}
                    className="bg-transparent border-none outline-none font-bold text-slate-700 text-xs"
                  />
                </div>
                <span className="text-slate-400 text-xs font-bold">~</span>
                <div className="flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-705 gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">종료</span>
                  <input
                    type="date"
                    value={backfillEndDate}
                    onChange={(e) => setBackfillEndDate(e.target.value)}
                    className="bg-transparent border-none outline-none font-bold text-slate-700 text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleBulkBackfill}
                disabled={isBackfilling}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-650 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isBackfilling ? "animate-spin" : ""}`} />
                {isBackfilling ? "소급 분석 및 적재 중..." : "환율 소급 가져오기 실행"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 🎛️ 최상단 실시간 주식시장 환율 & 원자재 Ticker 전광판 */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white rounded-2xl p-3.5 shadow-md border border-slate-850 overflow-hidden relative">
        <div className="absolute top-0 left-0 bg-pink-650 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-br-lg tracking-wider flex items-center gap-1 z-10 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          Live Exchange Rates
        </div>
        
        <div className="flex items-center justify-between gap-4 pt-3.5 px-2.5">
          <div className="flex items-center gap-3">
            {exchangeRates.map((rate: any) => {
              const isUp = rate.change_direction === "UP";
              const isDown = rate.change_direction === "DOWN";
              return (
                <div key={rate.rate_id} className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors">
                  <span className="text-[10px] font-black text-slate-300">{rate.currency_code}/KRW</span>
                  <span className="text-xs font-black font-mono text-white">
                    {rate.current_rate.toLocaleString()} 원
                  </span>
                  <span className={`text-[9px] font-bold font-mono flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                    isUp ? "bg-rose-500/20 text-rose-350" : isDown ? "bg-sky-500/20 text-sky-350" : "bg-slate-500/20 text-slate-300"
                  }`}>
                    {isUp ? "▲" : isDown ? "▼" : "•"} {Math.abs(rate.change_rate)}%
                  </span>
                </div>
              );
            })}
            {exchangeRates.length === 0 && (
              <span className="text-xs font-bold text-slate-500">환율 서버로부터 실시간 변동 테이블을 대기 중입니다.</span>
            )}
          </div>
          
          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 self-end">
            <Calendar className="w-3.5 h-3.5 text-pink-400" />
            최종 동기화 시점: {exchangeRates[0]?.last_updated_at || "N/A"}
          </div>
        </div>
      </div>

      {/* 4. 🌐 글로벌 4대 외환의 올해 전체 가격 변동 추이 선형 차트 (PC 고정 4열 그리드) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-pink-650" />
              글로벌 4대 외환 시세 추이 분석 (올해 전체 누적 이력)
            </h3>
            <p className="text-[9.5px] text-slate-400 font-semibold">서버 중단 기간 동안 누락되었던 공백 시세를 자가 회복하여 연속성 보증</p>
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {CURRENCIES.map(code => (
              <button
                key={code}
                type="button"
                onClick={() => setActiveRateTab(code)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer ${
                  activeRateTab === code
                    ? "bg-white text-pink-600 shadow-sm"
                    : "text-slate-450 hover:text-slate-700"
                }`}
              >
                {CURRENCY_NAMES[code as keyof typeof CURRENCY_NAMES].split(' ')[0]} ({code})
              </button>
            ))}
          </div>
        </div>

        {/* 환율 선형 SVG 꺾은선 차트 렌더링 */}
        {rateSvgPoints.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2">
            <Globe className="w-8 h-8 text-slate-355 animate-spin-slow" />
            환율 누적 변동 데이터가 없습니다. 상단 [실시간 환율 강제 갱신]을 눌러주세요.
          </div>
        ) : (
          <div className="w-full grid grid-cols-4 gap-6 items-center">
            
            {/* 차트 영역 (가로 스크롤 컨테이너 바인딩) */}
            <div 
              ref={rateScrollRef} 
              className="col-span-3 py-1 overflow-x-auto scrollbar-thin scrollbar-thumb-pink-650 scrollbar-track-slate-100 rounded-2xl w-full min-w-0"
            >
              <svg 
                viewBox={`0 0 ${rateChartWidth} 150`} 
                className="overflow-visible"
                style={{ width: rateChartWidth, minWidth: rateChartWidth, height: 150, display: "block" }}
                onMouseLeave={() => setRateHoverInfo(null)}
              >
                <defs>
                  <linearGradient id="rateAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#db2777" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#db2777" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* 가이드라인 */}
                <line x1="50" y1="15" x2={rateChartWidth - 30} y2="15" stroke="#f8fafc" strokeWidth="1" />
                <line x1="50" y1="75" x2={rateChartWidth - 30} y2="75" stroke="#f1f5f9" strokeWidth="0.8" strokeDasharray="3" />
                <line x1="50" y1="130" x2={rateChartWidth - 30} y2="130" stroke="#f1f5f9" strokeWidth="1" />

                {/* 면적 그라데이션 필 */}
                <path d={rateFillPath} fill="url(#rateAreaGradient)" />

                {/* 꺾은선 */}
                <path d={rateSvgPath} fill="none" stroke="#db2777" strokeWidth="2.5" strokeLinecap="round" />

                {/* 포인트 */}
                {rateSvgPoints.map((pt: any, idx: number) => {
                  const isLast = idx === rateSvgPoints.length - 1;
                  const shouldRenderPoint = rateSvgPoints.length <= 15 || isLast;
                  if (!shouldRenderPoint) return null;

                  return (
                    <g key={idx}>
                      <circle cx={pt.x} cy={pt.y} r={isLast ? 5.5 : 3.5} fill={isLast ? "#db2777" : "#be185d"} stroke="#ffffff" strokeWidth="1.5" />
                      {isLast && (
                        <circle cx={pt.x} cy={pt.y} r="11" fill="none" stroke="#db2777" strokeWidth="1" className="animate-ping" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }} />
                      )}
                    </g>
                  );
                })}

                {/* 날짜 라벨 (겹침 현상 영구 해소 및 한글 친화 캘린더 포맷팅) */}
                {(() => {
                  const labelStep = Math.max(1, Math.ceil(rateSvgPoints.length / 8));
                  
                  return rateSvgPoints.map((pt: any, idx: number) => {
                    const isLast = idx === rateSvgPoints.length - 1;
                    const isFirst = idx === 0;
                    
                    const shouldRenderLabel = isFirst || isLast || (idx % labelStep === 0 && idx < rateSvgPoints.length - labelStep * 0.7);
                    if (!shouldRenderLabel) return null;

                    let formattedDate = pt.date;
                    if (pt.date.includes("-")) {
                      const parts = pt.date.split("-");
                      const month = parseInt(parts[0], 10);
                      const day = parseInt(parts[1], 10);
                      formattedDate = `${month}월 ${day}일`;
                    }

                    return (
                      <text key={idx} x={pt.x} y="145" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontWeight="bold">
                        {formattedDate}
                      </text>
                    );
                  });
                })()}

                {/* 럭셔리 마우스 오버 툴팁 가이드선 & 카드 박스 */}
                {rateHoverInfo && (
                  <g>
                    <line
                      x1={rateHoverInfo.x}
                      y1={15}
                      x2={rateHoverInfo.x}
                      y2={130}
                      stroke="#db2777"
                      strokeWidth="1.2"
                      strokeDasharray="3,3"
                    />
                    
                    <circle
                      cx={rateHoverInfo.x}
                      cy={rateHoverInfo.y}
                      r="6.5"
                      fill="#db2777"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="shadow-md"
                    />

                    {/* 카드 박스 렌더링 */}
                    {(() => {
                      const tooltipWidth = 110;
                      const tooltipHeight = 42;
                      let tooltipX = rateHoverInfo.x - tooltipWidth / 2;
                      
                      if (tooltipX < 50) tooltipX = 50;
                      if (tooltipX + tooltipWidth > rateChartWidth - 30) {
                        tooltipX = rateChartWidth - 30 - tooltipWidth;
                      }

                      const tooltipY = Math.max(5, rateHoverInfo.y - 52);

                      return (
                        <g className="select-none pointer-events-none">
                          <rect
                            x={tooltipX}
                            y={tooltipY}
                            width={tooltipWidth}
                            height={tooltipHeight}
                            rx="8"
                            fill="#0f172a"
                            fillOpacity="0.92"
                            stroke="#db2777"
                            strokeWidth="1.5"
                            className="shadow-2xl"
                          />
                          <text
                            x={tooltipX + tooltipWidth / 2}
                            y={tooltipY + 14}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="8.5"
                            fontWeight="bold"
                          >
                            {rateHoverInfo.date}
                          </text>
                          <text
                            x={tooltipX + tooltipWidth / 2}
                            y={tooltipY + 31}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="900"
                            fontFamily="monospace"
                          >
                            {rateHoverInfo.val.toLocaleString()} 원
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* 툴팁 반응용 투명 센서 오버레이 */}
                {rateSvgPoints.map((pt: any, idx: number) => {
                  let formattedDate = pt.date;
                  if (pt.date.includes("-")) {
                    const parts = pt.date.split("-");
                    const month = parseInt(parts[0], 10);
                    const day = parseInt(parts[1], 10);
                    formattedDate = `${month}월 ${day}일`;
                  }

                  const rectWidth = (rateChartWidth - 90) / rateSvgPoints.length;
                  const rectX = pt.x - rectWidth / 2;

                  return (
                    <rect
                      key={`rate-sensor-${idx}`}
                      x={rectX}
                      y={0}
                      width={rectWidth}
                      height={130}
                      fill="transparent"
                      className="cursor-crosshair opacity-0"
                      onMouseEnter={() => setRateHoverInfo({
                        x: pt.x,
                        y: pt.y,
                        val: pt.val,
                        date: formattedDate,
                        index: idx
                      })}
                      onMouseMove={() => setRateHoverInfo({
                        x: pt.x,
                        y: pt.y,
                        val: pt.val,
                        date: formattedDate,
                        index: idx
                      })}
                    />
                  );
                })}
              </svg>
            </div>

            {/* 수치 요약 패널 */}
            <div className="col-span-1 bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col justify-between min-h-[130px]">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                  {CURRENCY_NAMES[activeRateTab as keyof typeof CURRENCY_NAMES]}
                </span>
                <h4 className="text-xl font-black text-slate-855 font-mono">
                  {rateSvgPoints[rateSvgPoints.length - 1]?.val.toLocaleString()} 원
                </h4>
              </div>

              <div className="border-t border-slate-200/80 pt-3 mt-3 space-y-1.5 text-[10.5px]">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">올해 최고가</span>
                  <span className="text-slate-700 font-mono">
                    {Math.max(...exchangeRateHistories.filter(x => x.currency_code === activeRateTab).map(x => x.rate_value)).toLocaleString()} 원
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">올해 최저가</span>
                  <span className="text-slate-700 font-mono">
                    {Math.min(...exchangeRateHistories.filter(x => x.currency_code === activeRateTab).map(x => x.rate_value)).toLocaleString()} 원
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 5. SCM 리스크 미니 위젯 및 검색 필터링 (PC 고정 수평 레이아웃) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-5">
        <div className="flex items-center gap-3.5 w-auto">
          <div className={`p-3.5 rounded-2xl border ${
            marginWarningCount > 0 
              ? "bg-rose-50 border-rose-100 text-rose-600 animate-pulse" 
              : "bg-emerald-50 border-emerald-100 text-emerald-600"
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold block">SCM 마진 위험 관제</span>
            <h3 className="text-lg font-black text-slate-800">
              추적 {items.length}개 품목 중 <span className={marginWarningCount > 0 ? "text-rose-500" : "text-emerald-600"}>{marginWarningCount}개 위험 등급</span> 감지
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-auto justify-end">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="품목명, 코드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-700 placeholder-slate-400"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-pink-500 cursor-pointer"
          >
            <option value="ALL">전체 카테고리</option>
            <option value="RAW_MATERIAL">원자재/부자재</option>
            <option value="COMPETITOR_PRODUCT">경쟁사 완제품</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-pink-500 cursor-pointer"
          >
            <option value="ALL">전체 마진 상태</option>
            <option value="WARNING">🚨 마진 붕괴 경보</option>
            <option value="SAFE">✓ 안정 마진</option>
          </select>
        </div>
      </div>

      {/* 6. 📈 주식거래소 스타일 SCM 실시간 통합 전광 대장 테이블 */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-visible w-full">
        <div className="p-5 border-b border-slate-155 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-4.5 bg-pink-650 rounded-md"></span>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              📊 실시간 원가 & 마진 스프레드 관제 전광판
            </h3>
            <span className="text-[10px] text-slate-400 font-bold bg-white px-2 py-0.5 border border-slate-200 rounded-md">
              Filtered {filteredItems.length} / {items.length} 품목
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditMode(false);
                setItemForm({ 
                  item_code: "", 
                  item_name: "", 
                  category: "RAW_MATERIAL", 
                  spec: "", 
                  base_price: "", 
                  target_margin_rate: "12.5",
                  currency_code: "USD" 
                });
                setIsItemModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-650 hover:bg-pink-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer border-none"
            >
              <Plus className="w-3.5 h-3.5" />
              신규 품목 등록
            </button>
          </div>
        </div>

        <div className="overflow-visible w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-550 font-bold uppercase tracking-wider">
                <th className="p-4 font-bold text-[10px]">품목 코드 / 명칭</th>
                <th className="p-4 font-bold text-[10px] text-center">수집 통화</th>
                <th className="p-4 font-bold text-[10px] text-right">자사 기준 원가</th>
                <th className="p-4 font-bold text-[10px] text-right">실시간 수집가 (외화/원화)</th>
                <th className="p-4 font-bold text-[10px] text-center">실시간 연동 환율</th>
                <th className="p-4 font-bold text-[10px] text-right">변동폭 / 변동률</th>
                <th className="p-4 font-bold text-[10px] text-right">실시간 마진율 (목표)</th>
                <th className="p-4 font-bold text-[10px] text-center">수집망 (노드)</th>
                <th className="p-4 font-bold text-[10px] text-center">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredItems.map((item) => {
                const isActive = activeItem?.item_id === item.item_id;
                const isWarning = item.current_margin_rate < item.target_margin_rate;
                const itemCurrency = item.currency_code || 'KRW';
                
                const changeAmount = item.latest_price - item.base_price;
                const changeRate = item.base_price > 0 ? (changeAmount / item.base_price) * 100 : 0;
                
                const isUp = changeAmount > 0;
                const isDown = changeAmount < 0;

                return (
                  <React.Fragment key={item.item_id}>
                    <tr 
                      onClick={() => handleItemSelect(item)}
                      className={`hover:bg-slate-50/70 transition-all cursor-pointer ${
                        isActive ? "bg-pink-50/30 border-l-4 border-l-pink-650" : ""
                      }`}
                    >
                      {/* 품목 명칭 */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              item.category === "RAW_MATERIAL" 
                                ? "bg-slate-900 text-slate-100 border-slate-800" 
                                : "bg-indigo-50 text-indigo-750 border-indigo-100"
                            }`}>
                              {item.category === "RAW_MATERIAL" ? "자재" : "경쟁완제품"}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-450">{item.item_code}</span>
                          </div>
                          <h4 className="text-xs font-black text-slate-850 truncate max-w-[200px] flex items-center gap-1.5">
                            {item.item_name}
                            {item.spec && (
                              <span className="text-[10px] text-pink-650 bg-pink-50/50 border border-pink-100 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                {item.spec}
                              </span>
                            )}
                          </h4>
                        </div>
                      </td>

                      {/* 수집 통화 */}
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-extrabold rounded-md border border-slate-200">
                          {itemCurrency}
                        </span>
                      </td>

                      {/* 기준가 */}
                      <td className="p-4 text-right">
                        <div className="space-y-0.5">
                          <span className="text-xs font-extrabold font-mono text-slate-805 block">
                            {itemCurrency === 'KRW' ? '₩ ' : '$ '}{item.base_price.toLocaleString()}
                          </span>
                          {itemCurrency !== 'KRW' && (
                            <span className="text-[9px] text-slate-400 font-bold block">
                              (₩ {(item.base_price_krw ?? 0).toLocaleString()})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 실시간 수집가 */}
                      <td className="p-4 text-right relative group">
                        {miningItemIds.includes(item.item_id) ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-pink-500 to-indigo-650 text-white font-extrabold text-[9px] rounded-lg shadow-sm animate-pulse">
                            <Sparkles className="w-2.5 h-2.5 animate-spin shrink-0" />
                            <span>⚡ AI 로봇 수집중...</span>
                          </div>
                        ) : item.latest_price > 0 ? (
                          <div className="space-y-0.5 inline-flex flex-col items-end">
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.latest_site_url && item.latest_site_url !== '#') {
                                  window.open(item.latest_site_url, '_blank');
                                }
                              }}
                              className="text-xs font-black font-mono text-slate-850 cursor-pointer hover:text-pink-600 hover:underline transition-colors flex items-center gap-0.5"
                              title={`클릭 시 최저가 마켓 [${item.latest_site_name}] 상세 상품 페이지로 새 창에서 즉시 이동`}
                            >
                              {itemCurrency === 'KRW' ? '₩ ' : '$ '}{item.latest_price.toLocaleString()}
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            </span>
                            {itemCurrency !== 'KRW' && (
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.latest_site_url && item.latest_site_url !== '#') {
                                    window.open(item.latest_site_url, '_blank');
                                  }
                                }}
                                className="text-[9px] text-slate-500 font-extrabold cursor-pointer hover:text-pink-600 hover:underline transition-colors block"
                                title={`클릭 시 최저가 마켓 [${item.latest_site_name}] 상세 상품 페이지로 새 창에서 즉시 이동`}
                              >
                                (₩ {(item.latest_krw_price ?? 0).toLocaleString()})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-bold">수집 대기 중</span>
                        )}

                        {/* 노드별 실시간 가격 즉석 브리핑 툴팁 카드 */}
                        {item.collectors_prices && item.collectors_prices.length > 0 && !miningItemIds.includes(item.item_id) && (
                          <div className="hidden group-hover:block absolute z-30 right-4 top-12 w-64 bg-slate-900/95 backdrop-blur-md text-slate-100 p-3.5 rounded-2xl border border-slate-800 shadow-2xl transition-all duration-200 text-left">
                            <div className="border-b border-slate-800 pb-2 mb-2 flex items-center justify-between">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">노드별 실시간 수집 가격</span>
                              <span className="text-[8px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded font-extrabold">LIVE</span>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {item.collectors_prices.map((cp: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] gap-2">
                                  <span className="text-slate-300 truncate max-w-[130px] font-medium" title={cp.siteName}>
                                    📍 {cp.siteName}
                                  </span>
                                  <div className="text-right shrink-0">
                                    <span className="font-bold font-mono text-pink-400">
                                      {cp.currency === 'KRW' ? '₩ ' : '$ '}{cp.price.toLocaleString()}
                                    </span>
                                    {cp.currency !== 'KRW' && (
                                      <span className="block text-[8px] text-slate-400 font-mono">
                                        (₩ {cp.krwPrice.toLocaleString()})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 실시간 연동 환율 */}
                      <td className="p-4 text-center">
                        {itemCurrency !== 'KRW' ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold font-mono text-slate-700 block">
                              {item.exchange_rate.toLocaleString()} 원
                            </span>
                            <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                              item.rate_change_direction === 'UP' 
                                ? 'bg-rose-50 text-rose-505' 
                                : item.rate_change_direction === 'DOWN'
                                ? 'bg-sky-50 text-sky-505'
                                : 'bg-slate-50 text-slate-505'
                            }`}>
                              {item.rate_change_direction === 'UP' ? '▲' : item.rate_change_direction === 'DOWN' ? '▼' : '•'} {item.rate_change_percent}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-semibold text-[10px]">-</span>
                        )}
                      </td>

                      {/* 변동폭 / 변동률 */}
                      <td className="p-4 text-right">
                        {item.latest_price > 0 ? (
                          <div className="space-y-0.5">
                            <span className={`text-xs font-black font-mono flex items-center justify-end gap-0.5 ${
                              isUp ? "text-rose-600" : isDown ? "text-sky-500" : "text-slate-500"
                            }`}>
                              {isUp ? "▲" : isDown ? "▼" : ""} 
                              {itemCurrency === 'KRW' ? '₩ ' : '$ '}{Math.abs(changeAmount).toLocaleString()}
                            </span>
                            <span className={`text-[9px] font-bold font-mono block ${
                              isUp ? "text-rose-500" : isDown ? "text-sky-400" : "text-slate-400"
                            }`}>
                              ({isUp ? "+" : ""}{changeRate.toFixed(2)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-bold">-</span>
                        )}
                      </td>

                      {/* 실시간 마진율 */}
                      <td className="p-4 text-right">
                        <div className="space-y-1 inline-flex flex-col items-end">
                          <span className={`text-xs font-black font-mono block ${
                            isWarning ? "text-rose-600" : "text-emerald-600"
                          }`}>
                            {item.latest_price > 0 ? `${item.current_margin_rate}%` : "N/A"}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {isWarning && item.latest_price > 0 && (
                              <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-1 rounded animate-pulse border border-rose-100">
                                🚨 마진 붕괴
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">
                              (목표 {item.target_margin_rate}%)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 수집망 노드 개수 (클릭 시 수집 로봇 매핑 센터 모달 띄우도록 바인딩) */}
                      <td className="p-4 text-center">
                        {miningItemIds.includes(item.item_id) ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-pink-500 to-indigo-650 text-white font-extrabold text-[9px] rounded-lg shadow-sm animate-pulse justify-center">
                            <Zap className="w-3 h-3 shrink-0" />
                            <span>⚡ AI 로봇 수집중...</span>
                          </div>
                        ) : (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemSelect(item);
                              setIsCollectorModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-50 text-slate-655 hover:text-pink-650 hover:bg-pink-50/50 hover:border-pink-200 transition-all font-bold font-mono rounded-lg border border-slate-200 inline-block text-[11px] cursor-pointer"
                            title="클릭하여 수집 로봇 매핑 및 검수 센터 모달 열기"
                          >
                            {Number(item.collectors_count ?? 0)} 개 노드 ⚙️
                          </span>
                        )}
                      </td>

                      {/* 퀵 액션 */}
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="relative group">
                            <button
                              onClick={() => {
                                handleItemSelect(item);
                                setIsAlertModalOpen(true);
                              }}
                              className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                                alerts.filter((r: any) => r.item_id === item.item_id && r.is_enabled === 1).length > 0
                                  ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600 hover:text-white"
                                  : "bg-white text-slate-450 border-slate-200 hover:bg-rose-50 hover:text-rose-600"
                              }`}
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>

                            {/* 프리미엄 가격 감시 설정 툴팁 말풍선 */}
                            <div className="absolute right-full mr-3 -top-2.5 hidden group-hover:block z-40 w-72 bg-slate-900/95 backdrop-blur-md text-white text-[10px] p-4 rounded-2xl shadow-2xl border border-slate-700/50 text-left transition-all duration-200 pointer-events-none">
                              <div className="absolute left-full top-3.5 border-[6px] border-transparent border-l-slate-900/95"></div>
                              
                              {alerts.filter((r: any) => r.item_id === item.item_id).length === 0 ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 font-black text-rose-450 text-[11px]">
                                    <Bell className="w-3.5 h-3.5" />
                                    <span>설정된 알림이 없습니다</span>
                                  </div>
                                  <p className="text-slate-400 font-bold leading-relaxed">
                                    클릭하여 실시간 마진 스프레드 붕괴 및 시황 한계 돌파 긴급 경보 규칙을 가동해 보세요.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                                    <div className="flex items-center gap-1 font-black text-rose-455 text-[11px]">
                                      <Bell className="w-3.5 h-3.5 animate-bounce" />
                                      <span>FreeSMS 경보망 ({alerts.filter((r: any) => r.item_id === item.item_id).length}개 작동)</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2 pointer-events-auto">
                                    {alerts.filter((r: any) => r.item_id === item.item_id).map((rule: any, rIdx: number) => (
                                      <div key={rule.rule_id || rIdx} className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/30 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-extrabold text-slate-200 text-xs truncate max-w-[150px]">{rule.rule_name}</span>
                                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                            rule.is_enabled === 1 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-700 text-slate-400"
                                          }`}>
                                            {rule.is_enabled === 1 ? "ON" : "OFF"}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 text-[9px] font-bold text-slate-400 border-t border-slate-700/40 pt-1 mt-1 font-sans">
                                          <div>
                                            <span className="text-slate-500">조건: </span>
                                            <span className="text-rose-350">
                                              {rule.condition_type === "MARGIN_BREAKDOWN" && "📉 마진 붕괴"}
                                              {rule.condition_type === "BELOW_LIMIT" && "📉 시세 하락"}
                                              {rule.condition_type === "ABOVE_LIMIT" && "📈 시세 폭등"}
                                            </span>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-slate-500">기준: </span>
                                            <span className="text-white font-mono">
                                              {rule.condition_type === "MARGIN_BREAKDOWN" 
                                                ? `${rule.threshold_value}%` 
                                                : `${rule.threshold_value.toLocaleString()}${item.currency_code || 'KRW'}`
                                              }
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-[8px] text-slate-505 font-mono pt-0.5">
                                          📞 수신: {rule.phone_number}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleEditItemClick(item)}
                            className="p-1.5 hover:bg-indigo-50 hover:text-indigo-650 text-slate-450 border border-slate-200 bg-white rounded-lg transition-colors cursor-pointer"
                            title="품목 정보 수정"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item.item_id, item.item_name)}
                            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-455 border border-slate-200 bg-white rounded-lg transition-colors cursor-pointer"
                            title="품목 영구 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* 활성화된 품목의 상세 분석 꺾은선 차트 Drawer 패널 (PC 고정 3열 그리드) */}
                    {isActive && (
                      <tr className="bg-slate-50/30">
                        <td colSpan={9} className="p-6 border-b border-slate-200">
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-3 gap-6 items-start animate-fade-in"
                          >
                            {/* 와이드 SVG 선형 가격 변동 차트 */}
                            <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between min-h-[260px]">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                                <div className="space-y-0.5">
                                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                    <BarChart3 className="w-4 h-4 text-pink-650" />
                                    시세 변동 선형 추이 분석 ({item.item_name})
                                  </h3>
                                  <p className="text-[9px] text-slate-400 font-semibold">최근 파이프라인 수집 누적 히스토리</p>
                                </div>
                                <span 
                                  onClick={() => {
                                    if (item.latest_site_url && item.latest_site_url !== '#') {
                                      window.open(item.latest_site_url, '_blank');
                                    }
                                  }}
                                  className="text-[9px] font-black text-pink-650 font-mono bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100 flex items-center gap-1 cursor-pointer hover:bg-pink-100 hover:text-pink-700 transition-all shadow-sm"
                                  title={`클릭 시 최저가를 공급하고 있는 [${item.latest_site_name}] 상세 상품 페이지로 새 창에서 즉시 연결`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  최저가 출처: {item.latest_site_name || '수집기 매핑 없음'}
                                  <ArrowUpRight className="w-3 h-3 text-pink-500 shrink-0" />
                                </span>
                              </div>

                              {svgPoints.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-xs text-slate-455 font-bold gap-2">
                                  <Globe className="w-8 h-8 text-slate-300 animate-spin-slow" />
                                  수집 완료된 단가 이력이 없습니다. 수집 로봇 탭에서 크롤링 URL을 먼저 매핑해 주세요!
                                </div>
                              ) : (
                                /* 품목 상세 차트 영역 (가로 스크롤 컨테이너 바인딩) */
                                <div 
                                  ref={itemScrollRef} 
                                  className="w-full py-1 overflow-x-auto scrollbar-thin scrollbar-thumb-pink-650 scrollbar-track-slate-100 rounded-2xl min-w-0"
                                >
                                  <svg 
                                    viewBox={`0 0 ${svgChartWidth} 180`} 
                                    className="overflow-visible"
                                    style={{ width: svgChartWidth, minWidth: svgChartWidth, height: 180, display: "block" }}
                                    onMouseLeave={() => setItemHoverInfo(null)}
                                  >
                                    <line x1="50" y1="20" x2={svgChartWidth - 30} y2="20" stroke="#f1f5f9" strokeWidth="1" />
                                    <line x1="50" y1="90" x2={svgChartWidth - 30} y2="90" stroke="#fecdd3" strokeDasharray="3" strokeWidth="0.8" />
                                    <line x1="50" y1="160" x2={svgChartWidth - 30} y2="160" stroke="#f1f5f9" strokeWidth="1" />

                                    <path d={svgPath} fill="none" stroke="#db2777" strokeWidth="2.5" strokeLinecap="round" />

                                    {svgPoints.map((pt: any, idx: number) => {
                                      const isLast = idx === svgPoints.length - 1;
                                      const shouldRenderPoint = svgPoints.length <= 15 || isLast;
                                      if (!shouldRenderPoint) return null;

                                      return (
                                        <g key={idx}>
                                          <circle cx={pt.x} cy={pt.y} r={isLast ? 6 : 4} fill={isLast ? "#db2777" : "#be185d"} stroke="#ffffff" strokeWidth="1.5" />
                                          {isLast && (
                                            <circle cx={pt.x} cy={pt.y} r="12" fill="none" stroke="#db2777" strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }} />
                                          )}
                                        </g>
                                      );
                                    })}

                                    {(() => {
                                      const labelStep = Math.max(1, Math.ceil(svgPoints.length / 8));
                                      
                                      return svgPoints.map((pt: any, idx: number) => {
                                        const isLast = idx === svgPoints.length - 1;
                                        const isFirst = idx === 0;
                                        
                                        const shouldRenderLabel = isFirst || isLast || (idx % labelStep === 0 && idx < svgPoints.length - labelStep * 0.7);
                                        if (!shouldRenderLabel) return null;

                                        let formattedDate = pt.date;
                                        if (pt.date.includes("-")) {
                                          const parts = pt.date.split("-");
                                          const month = parseInt(parts[0], 10);
                                          const day = parseInt(parts[1], 10);
                                          formattedDate = `${month}월 ${day}일`;
                                        }

                                        return (
                                          <text key={idx} x={pt.x} y="176" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontWeight="bold">
                                            {formattedDate}
                                          </text>
                                        );
                                      });
                                    })()}

                                    {/* 품목 상세 마우스 오버 툴팁 카드 */}
                                    {itemHoverInfo && (
                                      <g>
                                        <line
                                          x1={itemHoverInfo.x}
                                          y1={20}
                                          x2={itemHoverInfo.x}
                                          y2={160}
                                          stroke="#db2777"
                                          strokeWidth="1.2"
                                          strokeDasharray="3,3"
                                        />
                                        
                                        <circle
                                          cx={itemHoverInfo.x}
                                          cy={itemHoverInfo.y}
                                          r="7"
                                          fill="#db2777"
                                          stroke="#ffffff"
                                          strokeWidth="2"
                                          className="shadow-md"
                                        />

                                        {/* 이동 보정 툴팁 카드 */}
                                        {(() => {
                                          const tooltipWidth = 140;
                                          const tooltipHeight = 54;
                                          let tooltipX = itemHoverInfo.x - tooltipWidth / 2;
                                          
                                          if (tooltipX < 50) tooltipX = 50;
                                          if (tooltipX + tooltipWidth > svgChartWidth - 30) {
                                            tooltipX = svgChartWidth - 30 - tooltipWidth;
                                          }

                                          const tooltipY = Math.max(5, itemHoverInfo.y - 64);
                                          const curCode = activeItem?.currency_code || "KRW";

                                          const krwVal = itemHoverInfo.converted_krw 
                                            ? `(₩${Math.floor(itemHoverInfo.converted_krw).toLocaleString()})`
                                            : "";

                                          return (
                                            <g className="select-none pointer-events-none">
                                              <rect
                                                x={tooltipX}
                                                y={tooltipY}
                                                width={tooltipWidth}
                                                height={tooltipHeight}
                                                rx="8"
                                                fill="#0f172a"
                                                fillOpacity="0.94"
                                                stroke="#db2777"
                                                strokeWidth="1.5"
                                                className="shadow-2xl"
                                              />
                                              <text
                                                x={tooltipX + tooltipWidth / 2}
                                                y={tooltipY + 14}
                                                textAnchor="middle"
                                                fill="#94a3b8"
                                                fontSize="8"
                                                fontWeight="bold"
                                              >
                                                {itemHoverInfo.date}
                                              </text>
                                              <text
                                                x={tooltipX + tooltipWidth / 2}
                                                y={tooltipY + 30}
                                                textAnchor="middle"
                                                fill="#ffffff"
                                                fontSize="11.5"
                                                fontWeight="955"
                                                fontFamily="monospace"
                                              >
                                                {itemHoverInfo.price.toLocaleString()} {curCode}
                                              </text>
                                              {krwVal && (
                                                <text
                                                  x={tooltipX + tooltipWidth / 2}
                                                  y={tooltipY + 44}
                                                  textAnchor="middle"
                                                  fill="#fb7185"
                                                  fontSize="8.5"
                                                  fontWeight="bold"
                                                >
                                                  {krwVal}
                                                </text>
                                              )}
                                            </g>
                                          );
                                        })()}
                                      </g>
                                    )}

                                    {/* 투명 툴팁 센서바 영역 */}
                                    {svgPoints.map((pt: any, idx: number) => {
                                      let formattedDate = pt.date;
                                      if (pt.date.includes("-")) {
                                        const parts = pt.date.split("-");
                                        const month = parseInt(parts[0], 10);
                                        const day = parseInt(parts[1], 10);
                                        formattedDate = `${month}월 ${day}일`;
                                      }

                                      const rectWidth = (svgChartWidth - 90) / svgPoints.length;
                                      const rectX = pt.x - rectWidth / 2;

                                      const matchedHist = urls[0]?.history?.[idx];
                                      const krwPrice = matchedHist?.converted_krw_price || 0;

                                      return (
                                        <rect
                                          key={`item-sensor-${idx}`}
                                          x={rectX}
                                          y={0}
                                          width={rectWidth}
                                          height={160}
                                          fill="transparent"
                                          className="cursor-crosshair opacity-0"
                                          onMouseEnter={() => setItemHoverInfo({
                                            x: pt.x,
                                            y: pt.y,
                                            price: pt.price,
                                            date: formattedDate,
                                            index: idx,
                                            converted_krw: krwPrice
                                          })}
                                          onMouseMove={() => setItemHoverInfo({
                                            x: pt.x,
                                            y: pt.y,
                                            price: pt.price,
                                            date: formattedDate,
                                            index: idx,
                                            converted_krw: krwPrice
                                          })}
                                        />
                                      );
                                    })}
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* 실시간 마진 스프레드 서클 게이지 */}
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between min-h-[260px]">
                              <div>
                                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                  <span className="w-1.5 h-3.5 bg-pink-655 rounded-full animate-pulse"></span>
                                  실시간 마진 진단
                                </h3>
                                <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed font-semibold">자사 원가 대비 마진 보존 수준 계기판</p>
                              </div>

                              <div className="flex flex-col items-center py-2 space-y-3">
                                <div className="relative flex items-center justify-center w-24 h-24">
                                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="9" />
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="42"
                                      fill="none"
                                      stroke={isWarning ? "#ef4444" : "#10b981"}
                                      strokeWidth="9"
                                      strokeDasharray="264"
                                      strokeDashoffset={264 - (264 * Math.max(0, Math.min(100, item.current_margin_rate))) / 100}
                                      strokeLinecap="round"
                                      className="transition-all duration-1000"
                                    />
                                  </svg>
                                  <div className="absolute text-center">
                                    <span className="text-sm font-black font-mono text-slate-850 block">
                                      {item.latest_price > 0 ? `${item.current_margin_rate}%` : "N/A"}
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Margin</span>
                                  </div>
                                </div>

                                <div className="text-center space-y-0.5">
                                  <span className={`text-[10px] font-black tracking-wide ${isWarning ? "text-rose-500 animate-pulse" : "text-emerald-500"}`}>
                                    {item.latest_price > 0 
                                      ? (isWarning ? "⚠️ 마진 경고선 붕괴 위험" : "✓ 적정 마진 안전 보존")
                                      : "시세 대기 중"
                                    }
                                  </span>
                                  {item.latest_price > 0 && (
                                    <span className="text-[8.5px] text-slate-400 block font-semibold leading-relaxed">
                                      목표 {item.target_margin_rate}% 대비 {Math.abs(item.current_margin_rate - item.target_margin_rate).toFixed(2)}%p {isWarning ? "미달" : "초과 달성"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-slate-405 font-bold bg-white font-sans">
                    <ShieldAlert className="w-8 h-8 mx-auto text-slate-350 mb-2 animate-bounce" />
                    조건에 일치하는 SCM 관제 품목이 검색되지 않습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. 🔔 최근 발송 경보 로그 명세서 (주식시장 공시처럼) */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden w-full">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="text-xs font-black text-slate-800">FreeSMS 가격 임계값 돌파 긴급 문자 발송 이력</span>
          </div>
          <span className="text-[9px] font-bold text-slate-450 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
            LOGS ({alertLogs.length}건)
          </span>
        </div>
        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 font-mono">
          {alertLogs.map((log: any) => (
            <div key={log.log_id} className="p-3.5 bg-white hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4 text-[10px]">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-rose-600 font-sans text-xs">{log.rule_name}</span>
                  <span className="text-[9px] text-slate-400 font-normal">{log.sent_at || log.fired_at}</span>
                </div>
                <p className="text-slate-655 font-semibold font-sans leading-relaxed">{log.sent_message || log.message_sent}</p>
              </div>
              <span className="shrink-0 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md font-sans font-bold flex items-center gap-1 self-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
                SMS 발송 완료
              </span>
            </div>
          ))}
          {alertLogs.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-white font-sans">
              현재까지 긴급 경보로 발송된 FreeSMS 내역이 존재하지 않습니다.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4대 분리된 모달 컴포넌트 렌더링 영역 */}
      {/* ============================================================ */}
      
      {/* MODAL 1: 신규/수정 품목 등록 모달 */}
      <ItemRegisterModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        isEditMode={isEditMode}
        itemForm={itemForm}
        setItemForm={setItemForm}
        handleSaveItem={handleSaveItem}
      />

      {/* MODAL 2: 수집 로봇 매핑 및 검수 모달 */}
      <CollectorMappingModal
        isOpen={isCollectorModalOpen}
        onClose={() => setIsCollectorModalOpen(false)}
        activeItem={activeItem}
        urls={urls}
        copiedUrlId={copiedUrlId}
        miningLoading={miningLoading}
        miningLoadStep={miningLoadStep}
        searchChannels={searchChannels}
        newChannelName={newChannelName}
        urlForm={urlForm}
        crawlerTesting={crawlerTesting}
        selectorAnalyzing={selectorAnalyzing}
        setSearchChannels={setSearchChannels}
        setNewChannelName={setNewChannelName}
        setUrlForm={setUrlForm}
        setIsCronHelpOpen={setIsCronHelpOpen}
        handleCopyUrl={handleCopyUrl}
        handleDeleteUrl={handleDeleteUrl}
        handleToggleChannel={handleToggleChannel}
        handleRemoveChannel={handleRemoveChannel}
        handleAddChannel={handleAddChannel}
        handleAutoDeploy={handleAutoDeploy}
        handleAnalyzeSelector={handleAnalyzeSelector}
        handleAddUrl={handleAddUrl}
        explainCron={explainCron}
      />

      {/* MODAL 2-B: 수집 주기 (Cron) 설정 안내 팝업 */}
      <CollectorGuideModal
        isOpen={isCronHelpOpen}
        onClose={() => setIsCronHelpOpen(false)}
        setUrlForm={setUrlForm}
      />

      {/* MODAL 3: FreeSMS 경보 조건 설정 모달 */}
      <SmsAlertSettingModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        activeItem={activeItem}
        alertForm={alertForm}
        setAlertForm={setAlertForm}
        handleAddAlertRule={handleAddAlertRule}
      />

      {/* MODAL 2-C: 터미널 수동 기동 가이드 팝업 */}
      <AnimatePresence>
        {isDaemonHelpOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-[500px] rounded-3xl p-6 shadow-2xl space-y-6 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <X className="w-4 h-4 text-pink-650" />
                    터미널 수동 기동 명령어 안내
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">서버 콘솔(CLI) 독립 구동 명령어 사용법</p>
                </div>
                <button onClick={() => setIsDaemonHelpOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                  <X className="w-4 h-4 text-slate-505" />
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-500">기동 명령어</h4>
                <div className="flex items-center justify-between bg-slate-900 text-slate-100 p-3.5 rounded-2xl font-mono text-xs border border-slate-850 select-all relative group">
                  <span>npm run price:daemon</span>
                  <button
                    onClick={() => {
                      handleCopyCommand("npm run price:daemon");
                    }}
                    className="p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors text-slate-400 hover:text-white"
                    title="복사하기"
                  >
                    {copiedText === "npm run price:daemon" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="p-1.5 bg-pink-50 text-pink-600 rounded-lg h-max shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-[11px] font-black text-slate-700">1. 웹 서버 독립 구동 (24시간 연속 수집)</h5>
                    <p className="text-[9.5px] text-slate-450 leading-relaxed font-semibold">
                      웹 브라우저 창을 꺼두어도 서버 운영체제(OS) 백그라운드 상에서 가격 수집 로봇이 24시간 독자적으로 감시 및 SMS 경보망을 작동하게 할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="p-1.5 bg-pink-50 text-pink-600 rounded-lg h-max shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-[11px] font-black text-slate-700">2. 장애 시 강제 재시동 및 디버깅</h5>
                    <p className="text-[9.5px] text-slate-450 leading-relaxed font-semibold">
                      서버 컴퓨터 오류 등으로 수집기가 정지했을 때, 서버 콘솔창에 입력하여 수집기를 **즉각 수동 강제 재시작**시키고 수집 로그 및 에러 내역을 추적할 때 유용합니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl flex items-start gap-2">
                <Info className="w-4 h-4 text-pink-650 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h5 className="text-[10px] font-bold text-slate-700">작동 방식 참고</h5>
                  <p className="text-[9px] text-slate-450 leading-relaxed font-semibold">
                    이 명령어를 실행하면 <code className="font-mono text-pink-650 font-bold">scripts/price_tracker_daemon.js</code> 스크립트가 로컬 SQLite 데이터베이스와 연동되어 직접 크롤러 및 실시간 환율 수집 프로세스를 기동시킵니다.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDaemonHelpOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center cursor-pointer transition-all duration-200"
              >
                닫기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
