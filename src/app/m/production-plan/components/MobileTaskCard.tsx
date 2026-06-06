import React from "react";
import { GanttTask } from "../../../production-plan/types";
import { Play, Check, AlertCircle, Wrench, Clock } from "lucide-react";

interface MobileTaskCardProps {
  task: GanttTask;
  isCheckedIn: boolean;
  onUpdateStatus: (taskId: string, status: "WAITING" | "RUNNING" | "COMPLETED", progress: number) => void;
}

/**
 * 현장 작업자용 작업지시서 카드 컴포넌트
 */
export default function MobileTaskCard({ task, isCheckedIn, onUpdateStatus }: MobileTaskCardProps) {
  // 상태에 따른 배지 및 테두리 스타일 설정
  const isCompleted = task.status === "COMPLETED";
  const isRunning = task.status === "RUNNING";
  const isWaiting = task.status === "WAITING";

  return (
    <div 
      className={`bg-white rounded-2xl border p-4.5 shadow-2xs text-left transition-all ${
        isRunning 
          ? "border-indigo-400 bg-indigo-50/20" 
          : isCompleted 
            ? "border-emerald-300 bg-emerald-50/10" 
            : "border-slate-200"
      }`}
    >
      {/* 상단: 상태 배지 및 정보 */}
      <div className="flex justify-between items-start gap-2">
        <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full ${
          isCompleted 
            ? "bg-emerald-100 text-emerald-700" 
            : isRunning 
              ? "bg-indigo-100 text-indigo-700 animate-pulse" 
              : "bg-slate-100 text-slate-500"
        }`}>
          {isCompleted ? "완료됨" : isRunning ? "작업 중" : "대기 중"}
        </span>
        <span className="text-[8.5px] font-black text-slate-400">
          작업코드: {task.id}
        </span>
      </div>

      {/* 중단: 작업 및 공정 정보 */}
      <div className="mt-3 space-y-1.5">
        <h4 className="text-xs font-black text-slate-800 leading-tight">
          {task.title}
        </h4>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[8.5px] font-bold text-slate-500">
          <span className="flex items-center gap-0.5">
            <Wrench className="w-3 h-3 text-indigo-500" />
            {task.equipmentName}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3 text-indigo-500" />
            {task.startHour.toString().padStart(2, "0")}:00 ~ {task.endHour.toString().padStart(2, "0")}:00 ({task.endHour - task.startHour}시간)
          </span>
        </div>
      </div>

      {/* 진행률 바 및 슬라이더 */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center text-[9px] font-black">
          <span className="text-slate-450">공정 진행율</span>
          <span className={isRunning ? "text-indigo-600 font-extrabold" : isCompleted ? "text-emerald-600" : "text-slate-500"}>
            {task.progress}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              isCompleted ? "bg-emerald-500" : isRunning ? "bg-indigo-600" : "bg-slate-350"
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>

        {/* 진행률 미세 조정 슬라이더 (작업 중일 때만 노출) */}
        {isRunning && isCheckedIn && (
          <div className="pt-1">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={task.progress}
              onChange={(e) => onUpdateStatus(task.id, "RUNNING", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[7.5px] text-slate-400 font-black text-right mt-1">슬라이더를 밀어 실시간 진행율 조정 가능</p>
          </div>
        )}
      </div>

      {/* 하단: 제어 버튼 */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
        {!isCheckedIn ? (
          <div className="w-full flex items-center justify-center gap-1 text-[8.5px] font-black text-rose-500 bg-rose-50/50 py-2.5 rounded-xl border border-rose-100">
            <AlertCircle className="w-3.5 h-3.5" />
            상단 [출근 완료] 등록 후 작업 제어가 가능합니다.
          </div>
        ) : isWaiting ? (
          <button
            type="button"
            onClick={() => onUpdateStatus(task.id, "RUNNING", 10)}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black flex items-center justify-center gap-1 shadow-2xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-white fill-white" />
            작업 시작 지시 등록
          </button>
        ) : isRunning ? (
          <button
            type="button"
            onClick={() => onUpdateStatus(task.id, "COMPLETED", 100)}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black flex items-center justify-center gap-1 shadow-2xs transition-colors"
          >
            <Check className="w-3.5 h-3.5 text-white" />
            최종 공정 완료 보고
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onUpdateStatus(task.id, "RUNNING", 90)}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black flex items-center justify-center gap-1 border border-slate-300 transition-colors"
          >
            재개하기 (작업 상태 복구)
          </button>
        )}
      </div>
    </div>
  );
}
