"use client";

import React from "react";
import { useMobilePlan } from "./hooks/useMobilePlan";
import MobileTaskCard from "./components/MobileTaskCard";
import { CalendarDays, CheckCircle, AlertOctagon, AlertTriangle, RefreshCw, UserCheck } from "lucide-react";

/**
 * 모바일 작업지시서 메인 페이지
 */
export default function MobileProductionPlanPage() {
  const {
    isLoading,
    toast,
    currentOperator,
    setCurrentOperator,
    isCheckedIn,
    operatorTasks,
    handleCheckInToggle,
    updateTaskStatus,
    fetchTasks,
  } = useMobilePlan();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-start w-full relative">
      
      {/* 🛎️ 모바일 전용 토스트 알림 */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-55 p-3.5 rounded-2xl shadow-xl border flex items-center gap-2.5 animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' :
          toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-250' :
          'bg-amber-50 text-amber-800 border-amber-250'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <AlertOctagon className="w-4.5 h-4.5 text-rose-600 shrink-0" />}
          {toast.type === 'warn' && <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />}
          <span className="text-[10px] font-black leading-snug">{toast.message}</span>
        </div>
      )}

      {/* 모바일 상단 헤더 바 */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 flex items-center justify-between sticky top-0 z-40 text-left">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">생산 계획 AI 모바일 지시서</h1>
            <p className="text-[8px] text-slate-500 font-extrabold mt-0.5">EGDESK Smart Production Scheduling Mobile</p>
          </div>
        </div>

        {/* 실시간 리로드 버튼 */}
        <button 
          onClick={fetchTasks}
          className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 모바일 메인 바디 */}
      <div className="flex-1 p-4 overflow-y-auto max-w-lg mx-auto w-full pb-16 space-y-5">
        
        {/* 작업자 설정 및 출퇴근 등록 섹션 */}
        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 text-left space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-400">
            <UserCheck className="w-4.5 h-4.5" />
            <span className="text-[10.5px] font-black tracking-wide uppercase">현장 근로자 인증 및 출근 정보</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block mb-1 text-[9px] text-slate-500 font-extrabold">근무자 계정 선택 (시뮬레이터)</label>
              <select
                value={currentOperator}
                onChange={(e) => {
                  setCurrentOperator(e.target.value);
                  fetchTasks();
                }}
                className="w-full text-[11px] font-black border border-slate-700 rounded-xl p-3 bg-slate-900 text-white focus:outline-hidden"
              >
                <option value="이민우 (조장)">이민우 (조장) - 사출 2호기</option>
                <option value="강성욱 (기사)">강성욱 (기사) - 사출 1호기</option>
                <option value="박준영 (사원)">박준영 (사원) - 사출 3호기</option>
                <option value="최현우 (조장)">최현우 (조장) - 조립 라인 A</option>
                <option value="김태호 (사원)">김태호 (사원) - 조립 라인 A</option>
              </select>
            </div>

            {/* 출근/퇴근 토글 버튼 */}
            <button
              type="button"
              onClick={handleCheckInToggle}
              className={`w-full py-3 rounded-xl text-[10px] font-black text-center transition-all ${
                isCheckedIn 
                  ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30"
                  : "bg-indigo-600 hover:bg-indigo-750 text-white shadow-md"
              }`}
            >
              {isCheckedIn ? "일일 근무 종료 (퇴근 처리)" : "일일 근무 시작 (출근 완료 등록)"}
            </button>
          </div>
        </div>

        {/* 지시서 목록 헤더 */}
        <div className="flex justify-between items-center text-left px-1">
          <span className="text-[10px] font-black text-slate-400">
            오늘 할당된 생산 공정 지시 ({operatorTasks.length}건)
          </span>
          {isCheckedIn && (
            <span className="text-[8.5px] font-black text-emerald-400 flex items-center gap-1">
              🟢 현장 수신 대기 중
            </span>
          )}
        </div>

        {/* 작업지시 카드 목록 */}
        {isLoading ? (
          <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="font-bold text-slate-500 text-[10px]">오늘의 실시간 공정 지시서를 가져오는 중...</p>
          </div>
        ) : operatorTasks.length === 0 ? (
          <div className="bg-slate-850 border border-slate-800 rounded-3xl p-10 text-center space-y-2">
            <p className="text-slate-400 text-[10px] font-black">📅 배정된 공정 계획이 존재하지 않습니다.</p>
            <p className="text-slate-600 text-[8.5px] font-bold">PC 대시보드 관리자에게 일정을 문의해 주세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {operatorTasks.map((task) => (
              <MobileTaskCard
                key={task.id}
                task={task}
                isCheckedIn={isCheckedIn}
                onUpdateStatus={updateTaskStatus}
              />
            ))}
          </div>
        )}

      </div>

      {/* 모바일 하단 카피라이트 */}
      <div className="py-4.5 text-center border-t border-slate-800 bg-slate-900 text-slate-600 text-[8px] font-black">
        © 2026 EGDESK APS MOBILE. ALL RIGHTS RESERVED.
      </div>
      
    </div>
  );
}
