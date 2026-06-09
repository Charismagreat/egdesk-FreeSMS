"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Coins, Sparkles, RefreshCw, CheckCircle, ShieldAlert, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";

// 커스텀 훅 임포트
import { useExpenses } from "@/hooks/useExpenses";

// 서브 컴포넌트 임포트
import ReceiptScanCard from "./components/ReceiptScanCard";
import ExpenseConfigCenter from "./components/ExpenseConfigCenter";
import ExpenseLedgerTable from "./components/ExpenseLedgerTable";
import ExpenseEditModal from "./components/ExpenseEditModal";

export default function ExpenseManagementAiPage() {
  const {
    expenses,
    stats,
    settings,
    isLoading,
    isSavingSettings,
    isSubmittingExpense,
    isAnalyzingReceipt,
    activeCategoryFilter,
    setActiveCategoryFilter,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    newExpense,
    setNewExpense,
    fetchExpenses,
    handleSaveSettings,
    handleRegisterExpense,
    handleDeleteExpense,
    handleFileUpload,
    resetExpenseForm,
    filteredExpenses,
    paginatedExpenses,
    selectedIds,
    toggleSelectAll,
    toggleSelect,
    handleDeleteSelectedExpenses,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    setQuickRange,
    dbCategories,
    dbTags,
    handleAddCategory,
    handleBulkAddCategories,
    handleDeleteCategory,
    handleAddTag,
    handleDeleteTag,
    autocompleteData,
    dbDepartments,
    dbEmployees,
    dbProjects,
    handleAddDepartment,
    handleDeleteDepartment,
    handleAddEmployee,
    handleDeleteEmployee,
    handleAddProject,
    handleDeleteProject,
    handleUpdateExpense,
    handleApproveExpense,
  } = useExpenses();

  // 🔑 최고관리자 권한 상태 선언
  const [userRole, setUserRole] = useState<string>("SUB_OPERATOR");
  const [editExpense, setEditExpense] = useState<any | null>(null); // 수정 모달 제어용
  
  // 🛎️ 토스트 알림 상태 선언
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  // 💡 AI 마우스 커서 도움말 인디케이터 상태
  const [cursorIndicator, setCursorIndicator] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({
    visible: false,
    x: 0,
    y: 0
  });

  // 💡 AI Contextual 도움말 상태 선언
  const [helpInfo, setHelpInfo] = useState<{
    isOpen: boolean;
    hintKey: string;
    hintText: string;
    explanation: string;
    isLoading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    hintKey: "",
    hintText: "",
    explanation: "",
    isLoading: false,
    error: null
  });

  // useRef를 활용한 타이머 및 상태 레퍼런스 영속화 (리렌더링에 의한 리셋 방지)
  const helpInfoRef = useRef(helpInfo);
  const hoverTimerRef = useRef<any>(null);
  const leaveTimerRef = useRef<any>(null);

  useEffect(() => {
    helpInfoRef.current = helpInfo;
  }, [helpInfo]);

  // 도움말 마우스 진입시 해제 방지
  const handlePopupMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handlePopupMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setHelpInfo(prev => ({ ...prev, isOpen: false }));
    }, 800);
  };

  // 마우스 오버 힌트 실시간 리스너 훅 (디펜던시 []로 최초 마운트 시 1회만 등록)
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const hintElement = target.closest("[data-easybot-hint]");
      if (!hintElement) return;

      const hintText = hintElement.getAttribute("data-easybot-hint") || "";
      if (!hintText) return;

      const colonIdx = hintText.indexOf(":");
      const hintKey = colonIdx !== -1 ? hintText.substring(0, colonIdx).trim() : hintText.trim();
      const hintVal = colonIdx !== -1 ? hintText.substring(colonIdx + 1).trim() : hintText;

      // 즉시 도움말 배지 활성화 및 위치 지정
      setCursorIndicator({
        visible: true,
        x: e.clientX,
        y: e.clientY
      });

      // 1. 이미 동일한 도움말이 열려 있는 경우라면 닫기 타이머만 취소하고 유지
      if (helpInfoRef.current.isOpen && helpInfoRef.current.hintKey === hintKey) {
        if (leaveTimerRef.current) {
          clearTimeout(leaveTimerRef.current);
          leaveTimerRef.current = null;
        }
        return;
      }

      // 2. 다른 요소를 호버한 경우 기존 닫기 타이머 및 대기 타이머 클리어
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }

      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }

      // 1초 호버 딜레이 개시
      hoverTimerRef.current = setTimeout(async () => {
        setHelpInfo({
          isOpen: true,
          hintKey,
          hintText: hintVal,
          explanation: "",
          isLoading: true,
          error: null
        });

        try {
          const res = await fetch("/api/expenses/contextual-help", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hintKey, hintText: hintVal })
          });
          const data = await res.json();
          if (data.success) {
            setHelpInfo(prev => ({
              ...prev,
              explanation: data.explanation,
              isLoading: false
            }));
          } else {
            throw new Error(data.error || "도움말 데이터를 불러오지 못했습니다.");
          }
        } catch (err: any) {
          setHelpInfo(prev => ({
            ...prev,
            isLoading: false,
            error: err.message
          }));
        }
      }, 1000);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const hintElement = target.closest("[data-easybot-hint]");
      if (hintElement) {
        setCursorIndicator({
          visible: true,
          x: e.clientX,
          y: e.clientY
        });
      } else {
        setCursorIndicator(prev => prev.visible ? { ...prev, visible: false } : prev);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const hintElement = target.closest("[data-easybot-hint]");
      if (hintElement) {
        // 호버 중 영역을 나가면 로딩 대기 타이머 클리어
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }

        // 즉시 마우스 배지 숨김
        setCursorIndicator(prev => prev.visible ? { ...prev, visible: false } : prev);

        // 0.8초 뒤 닫기 타이머 예약
        if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = setTimeout(() => {
          setHelpInfo(prev => ({ ...prev, isOpen: false }));
        }, 800);
      }
    };

    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseOut);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const showToast = (message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // 🔄 AI 도움말 재생성 및 캐시 갱신 핸들러 (최고 관리자 전용)
  const handleRefreshExplanation = async () => {
    if (helpInfo.isLoading || !helpInfo.hintKey) return;

    setHelpInfo(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const res = await fetch("/api/expenses/contextual-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hintKey: helpInfo.hintKey,
          hintText: helpInfo.hintText,
          forceRefresh: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setHelpInfo(prev => ({
          ...prev,
          explanation: data.explanation,
          isLoading: false
        }));
        showToast("AI 도움말 설명이 성공적으로 갱신되었습니다.", "success");
      } else {
        throw new Error(data.error || "도움말 재생성을 실패했습니다.");
      }
    } catch (err: any) {
      setHelpInfo(prev => ({
        ...prev,
        isLoading: false,
        error: err.message
      }));
      showToast(err.message, "error");
    }
  };

  // 🔑 최고관리자(SUPER_ADMIN) 또는 대표자(PRESIDENT) 권한이 있는지 확인하는 헬퍼 변수
  const hasAdminAccess = useMemo(() => {
    if (!userRole) return false;
    const role = userRole.toUpperCase();
    return role === 'SUPER_ADMIN' || role === 'PRESIDENT';
  }, [userRole]);
  
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.role) {
          setUserRole(data.role);
        }
      } catch (e) {
        console.error("Failed to fetch user session on client", e);
      }
    };
    fetchUserRole();
  }, []);

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 font-sans text-slate-800 animate-fade-in text-left">
      
      {/* 🛎️ 알림 토스트 컴포넌트 */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
          toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
          'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-650" />}
          {toast.type === 'error' && <ShieldAlert className="w-5 h-5 text-red-655" />}
          {toast.type === 'warn' && <AlertTriangle className="w-5 h-5 text-amber-650" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* 타이틀 및 헤더 영역 (PC용 1행 통일 스타일) */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center tracking-tight">
          <Coins className="w-8 h-8 text-rose-500 mr-3 animate-pulse" />
          지출 관리 AI
        </h1>
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-xs font-black flex items-center shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-rose-500 animate-bounce" />
          AI 경리 자율 자동화 구동 중
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-rose-500 animate-spin" />
          <p className="font-extrabold text-slate-500 text-sm">지출 대장 및 AI 통계 정보를 계산하는 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 상단 2열 배치 (AI 스캔 영역 & 설정 및 누적 예산 현황) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* 좌측 열: AI 영수증 자율 스캔 및 검수 */}
            <ReceiptScanCard
              isAnalyzingReceipt={isAnalyzingReceipt}
              isSubmittingExpense={isSubmittingExpense}
              newExpense={newExpense}
              setNewExpense={setNewExpense}
              handleFileUpload={handleFileUpload}
              handleRegisterExpense={handleRegisterExpense}
              resetExpenseForm={resetExpenseForm}
              dbCategories={dbCategories}
              dbTags={dbTags}
              autocompleteData={autocompleteData}
            />

            {/* 우측 열: 누적 예산 & 지출 환경 설정 */}
            <div className="space-y-6">
              
              {/* 월간 예산 소모 현황 전광판 */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden border border-slate-800 text-left">
                <div className="relative z-10 flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">이달의 누적 지출 현황 ({stats?.currentMonth}월)</p>
                    <h3 className="text-3xl font-black mt-1 font-mono tracking-tight text-white">
                      {stats?.currentMonthTotal.toLocaleString()} <span className="text-sm font-bold text-slate-350">원</span>
                    </h3>
                  </div>
                  
                  <div className={`px-3.5 py-1.5 rounded-full font-black text-xs shadow-md ${
                    (stats?.budgetConsumptionRate || 0) >= 90 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                      : (stats?.budgetConsumptionRate || 0) >= 70
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    소모율 {stats?.budgetConsumptionRate}%
                  </div>
                </div>

                <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner mb-3">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      (stats?.budgetConsumptionRate || 0) >= 90
                        ? 'bg-gradient-to-r from-rose-500 to-orange-500'
                        : (stats?.budgetConsumptionRate || 0) >= 70
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${Math.min(stats?.budgetConsumptionRate || 0, 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
                  <span>예산 한도: {stats?.monthlyBudget.toLocaleString()}원</span>
                  <span>잔여 가능 예산: {Math.max((stats?.monthlyBudget || 0) - (stats?.currentMonthTotal || 0), 0).toLocaleString()}원</span>
                </div>
              </div>

              {/* 지출 환경 설정 센터 */}
              <ExpenseConfigCenter
                settings={settings}
                handleSaveSettings={handleSaveSettings}
                isSavingSettings={isSavingSettings}
                dbCategories={dbCategories}
                handleAddCategory={handleAddCategory}
                handleBulkAddCategories={handleBulkAddCategories}
                handleDeleteCategory={handleDeleteCategory}
                dbTags={dbTags}
                handleAddTag={handleAddTag}
                handleDeleteTag={handleDeleteTag}
                dbDepartments={dbDepartments}
                dbEmployees={dbEmployees}
                dbProjects={dbProjects}
                handleAddDepartment={handleAddDepartment}
                handleDeleteDepartment={handleDeleteDepartment}
                handleAddEmployee={handleAddEmployee}
                handleDeleteEmployee={handleDeleteEmployee}
                handleAddProject={handleAddProject}
                handleDeleteProject={handleDeleteProject}
              />
            </div>
          </div>

          {/* 하단 영역: 통합 지출 결의서 대장 */}
          <ExpenseLedgerTable
            filteredExpenses={filteredExpenses}
            paginatedExpenses={paginatedExpenses}
            activeCategoryFilter={activeCategoryFilter}
            setActiveCategoryFilter={setActiveCategoryFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            selectedIds={selectedIds}
            toggleSelectAll={toggleSelectAll}
            toggleSelect={toggleSelect}
            handleDeleteSelectedExpenses={handleDeleteSelectedExpenses}
            handleDeleteExpense={handleDeleteExpense}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            setQuickRange={setQuickRange}
            userRole={userRole}
            hasAdminAccess={hasAdminAccess}
            setEditExpense={setEditExpense}
          />
        </div>
      )}

      {/* 지출 내역 인라인 상세 수정 모달 */}
      <ExpenseEditModal
        editExpense={editExpense}
        setEditExpense={setEditExpense}
        handleUpdateExpense={handleUpdateExpense}
        handleApproveExpense={handleApproveExpense}
        userRole={userRole}
        hasAdminAccess={hasAdminAccess}
        fetchExpenses={fetchExpenses}
        showToast={showToast}
      />

      {/* 💡 AI 마우스 커서 도움말 인디케이터 (즉시 반응 툴팁 배지) - React Portal 사용으로 쌓임 맥락(Stacking Context) 해결 */}
      {cursorIndicator.visible && !helpInfo.isOpen && typeof window !== "undefined" && createPortal(
        <div
          className="fixed pointer-events-none z-[10000] flex items-center justify-center bg-gradient-to-tr from-rose-500 to-amber-500 text-white rounded-full w-8 h-8 shadow-2xl animate-pulse"
          style={{
            left: `${cursorIndicator.x + 12}px`,
            top: `${cursorIndicator.y + 12}px`,
            transition: "left 0.04s ease-out, top 0.04s ease-out"
          }}
        >
          <Sparkles className="w-4 h-4 text-white animate-bounce" />
        </div>,
        document.body
      )}

      {/* AI 도움말 플로팅 팝업창 - React Portal 사용으로 타 컴포넌트 스크롤 영역과의 마우스 이벤트 겹침(z-index 간섭) 완벽 해결 */}
      {helpInfo.isOpen && typeof window !== "undefined" && createPortal(
        <div
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
          className="fixed bottom-24 right-6 w-96 bg-slate-900/90 hover:bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md z-[9999] text-left animate-fade-in text-white transition-all"
        >
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5 mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <span className="text-xs font-black tracking-tight text-slate-100">AI 도움말</span>
            </div>
            <button
              onClick={() => setHelpInfo(prev => ({ ...prev, isOpen: false }))}
              className="text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer p-1 text-[10px]"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-200">📌 {helpInfo.hintKey}</h4>
            
            {helpInfo.isLoading ? (
              <div className="flex items-center space-x-2 py-3">
                <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] text-slate-400 font-medium">설명을 생성하고 있습니다...</span>
              </div>
            ) : helpInfo.error ? (
              <p className="text-xs text-rose-350 leading-relaxed font-semibold">
                {helpInfo.error}
              </p>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                {helpInfo.explanation}
              </p>
            )}
          </div>

          <div className="border-t border-slate-800/80 pt-2.5 mt-3 flex justify-between items-center text-[9px] text-slate-500 font-bold">
            <span>EGDesk AI 경리 서비스</span>
            {hasAdminAccess ? (
              <button
                onClick={handleRefreshExplanation}
                disabled={helpInfo.isLoading}
                className="flex items-center space-x-1 text-rose-400 hover:text-rose-350 transition-colors border-none bg-transparent cursor-pointer font-bold disabled:text-slate-600 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${helpInfo.isLoading ? 'animate-spin' : ''}`} />
                <span>재설명 요청</span>
              </button>
            ) : (
              <span>설명 자동 저장됨</span>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
