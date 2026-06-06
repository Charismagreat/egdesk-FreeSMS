import React, { useState } from "react";
import { GanttTask } from "../types";
import { Calendar, User, Settings, ArrowLeftRight, ChevronLeft, ChevronRight, Wrench } from "lucide-react";

interface GanttChartCardProps {
  tasks: GanttTask[];
  onReschedule: (taskId: string, startHour: number, endHour: number, equipmentId: string) => void;
}

/**
 * 드래그/클릭 제어 지원하는 SVG 기반 생산 계획 간트 차트 (Gantt Chart)
 */
export default function GanttChartCard({ tasks, onReschedule }: GanttChartCardProps) {
  // 제어할 타스크 선택 상태
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // 설비 목록정의
  const EQUIPMENTS = [
    { id: "M-500", name: "사출 1호기 (M-500)" },
    { id: "M-300", name: "사출 2호기 (M-300)" },
    { id: "M-200", name: "사출 3호기 (M-200)" },
    { id: "A-100", name: "조립 라인 A (A-100)" }
  ];

  // SVG 좌표 및 차원 정의
  const width = 800;
  const rowHeight = 60;
  const headerHeight = 35;
  const paddingLeft = 160; // 설비명 출력 영역 너비
  const paddingRight = 20;
  const height = headerHeight + EQUIPMENTS.length * rowHeight;

  // 시간축 매핑 (09:00 ~ 21:00시, 총 12시간 범위)
  const START_HOUR_LIMIT = 9;
  const END_HOUR_LIMIT = 21;
  const TOTAL_HOURS = END_HOUR_LIMIT - START_HOUR_LIMIT;
  const activeWidth = width - paddingLeft - paddingRight;

  // X 좌표 구하기
  const getX = (hour: number) => {
    const ratio = (hour - START_HOUR_LIMIT) / TOTAL_HOURS;
    return paddingLeft + ratio * activeWidth;
  };

  // 너비 구하기
  const getWidth = (start: number, end: number) => {
    const duration = end - start;
    return (duration / TOTAL_HOURS) * activeWidth;
  };

  // 세로 Y 좌표 구하기
  const getY = (eqId: string) => {
    const idx = EQUIPMENTS.findIndex((e) => e.id === eqId);
    return headerHeight + idx * rowHeight;
  };

  // 시간 조정 컨트롤러
  const handleShiftTime = (task: GanttTask, offset: number) => {
    const newStart = Math.max(START_HOUR_LIMIT, Math.min(END_HOUR_LIMIT - 1, task.startHour + offset));
    const duration = task.endHour - task.startHour;
    const newEnd = Math.min(END_HOUR_LIMIT, newStart + duration);
    onReschedule(task.id, newStart, newEnd, task.equipmentId);
  };

  // 설비 변경 컨트롤러
  const handleChangeEquipment = (task: GanttTask, targetEqId: string) => {
    onReschedule(task.id, task.startHour, task.endHour, targetEqId);
  };

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left space-y-4">
      
      {/* 상단 타이틀 */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">실시간 AI 생산 간트 차트 (Gantt Chart)</h3>
            <p className="text-[9px] text-slate-400 font-bold">원클릭 드래그/시프트 일정 자동 최적화 제어</p>
          </div>
        </div>
        <span className="text-[8.5px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
          💡 공정 블록 클릭 시 일정/설비 조절 패널이 노출됩니다.
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* 좌측/중앙: SVG 간트 차트 */}
        <div className="xl:col-span-3 bg-slate-50 border border-slate-150 rounded-2xl p-2.5 overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[700px] h-auto">
            {/* 시간 눈금 그리드 (09시 ~ 21시) */}
            {Array.from({ length: TOTAL_HOURS + 1 }).map((_, idx) => {
              const hour = START_HOUR_LIMIT + idx;
              const x = getX(hour);
              return (
                <g key={hour}>
                  <line x1={x} y1={headerHeight} x2={x} y2={height} stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="3,3" />
                  <text x={x} y={headerHeight - 10} textAnchor="middle" fontSize="8.5" fill="#94a3b8" fontWeight="bold">
                    {hour.toString().padStart(2, "0")}:00
                  </text>
                </g>
              );
            })}

            {/* 설비 구분 수평 라인 및 명칭 텍스트 */}
            {EQUIPMENTS.map((eq, idx) => {
              const y = getY(eq.id);
              return (
                <g key={eq.id}>
                  {/* 행 배경 */}
                  <rect x="0" y={y} width={width} height={rowHeight} fill={idx % 2 === 0 ? "transparent" : "#f8fafc/40"} />
                  {/* 구분선 */}
                  <line x1="0" y1={y + rowHeight} x2={width} y2={y + rowHeight} stroke="#e2e8f0" strokeWidth="1" />
                  {/* 설비명 */}
                  <text x="15" y={y + rowHeight / 2 + 4} fontSize="10.5" fill="#334155" fontWeight="black">
                    {eq.name}
                  </text>
                </g>
              );
            })}

            {/* 간트 작업 노드 (Tasks) 렌더링 */}
            {tasks.map((task) => {
              const x = getX(task.startHour);
              const y = getY(task.equipmentId);
              const blockWidth = getWidth(task.startHour, task.endHour);
              const isSelected = task.id === activeTaskId;

              // 상태에 따른 색상 분기
              const baseColor = task.status === "COMPLETED" ? "#10b981" : task.status === "RUNNING" ? "#6366f1" : "#94a3b8";

              return (
                <g 
                  key={task.id} 
                  className="cursor-pointer group"
                  onClick={() => setActiveTaskId(isSelected ? null : task.id)}
                >
                  {/* 메인 작업 블록 백그라운드 */}
                  <rect 
                    x={x + 3} 
                    y={y + 8} 
                    width={blockWidth - 6} 
                    height={rowHeight - 16} 
                    rx="8" 
                    fill="white" 
                    stroke={isSelected ? "#312e81" : "#e2e8f0"} 
                    strokeWidth={isSelected ? "2" : "1"} 
                    className="shadow-2xs transition-all group-hover:stroke-indigo-400"
                  />
                  {/* 진행율 컬러 바 채우기 */}
                  <rect 
                    x={x + 3} 
                    y={y + 8} 
                    width={(blockWidth - 6) * (task.progress / 100)} 
                    height={rowHeight - 16} 
                    rx="8" 
                    fill={baseColor}
                    fillOpacity="0.15"
                  />
                  <line 
                    x1={x + 3} 
                    y1={y + rowHeight - 9} 
                    x2={x + 3 + (blockWidth - 6) * (task.progress / 100)} 
                    y2={y + rowHeight - 9} 
                    stroke={baseColor} 
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* 텍스트 정보 */}
                  <text x={x + 12} y={y + 25} fontSize="9.5" fontWeight="black" fill="#1e293b">
                    {task.title}
                  </text>
                  <text x={x + 12} y={y + 39} fontSize="7.5" fontWeight="bold" fill="#64748b">
                    👤 {task.operatorName} | 진행: {task.progress}% ({task.status})
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 우측: 선택 작업 세부 일정 조정 리포트 및 제어 패널 */}
        <div className="xl:col-span-1 bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-4 flex flex-col justify-between">
          {activeTask ? (
            <div className="space-y-4 text-left">
              <div className="border-b border-slate-200 pb-2">
                <span className="text-[8.5px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">선택된 공정</span>
                <h4 className="text-xs font-black text-slate-800 mt-1">{activeTask.title}</h4>
                <p className="text-[8.5px] text-slate-400 font-bold mt-0.5">현재 배치: {activeTask.equipmentName}</p>
              </div>

              {/* 시간 시프트 조절 단추 */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 flex items-center gap-0.5">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  시작 시간 수동 시프트 (1시간 단위)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleShiftTime(activeTask, -1)}
                    disabled={activeTask.startHour <= START_HOUR_LIMIT}
                    className="flex-1 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-[10px] font-black flex items-center justify-center gap-0.5 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    1H 앞당김
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShiftTime(activeTask, 1)}
                    disabled={activeTask.endHour >= END_HOUR_LIMIT}
                    className="flex-1 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-[10px] font-black flex items-center justify-center gap-0.5 disabled:opacity-40"
                  >
                    미룸
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 설비 이동 셀렉트 */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 flex items-center gap-0.5">
                  <Wrench className="w-3.5 h-3.5" />
                  가동 설비 라인 재배치
                </span>
                <select
                  value={activeTask.equipmentId}
                  onChange={(e) => handleChangeEquipment(activeTask, e.target.value)}
                  className="w-full text-[10px] font-bold border border-slate-300 rounded-xl p-2 bg-white"
                >
                  {EQUIPMENTS.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-2.5 text-[8.5px] font-bold text-indigo-700 leading-normal">
                💡 시작 시간을 당기거나 미룰 시, 공정 선후 관계 제약 조건에 부합하는 범위 내에서만 일정이 이동됩니다.
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12 gap-2">
              <Settings className="w-8 h-8 text-slate-350 animate-spin" style={{ animationDuration: '6s' }} />
              <p className="text-[9.5px] font-black leading-normal max-w-[160px]">
                일정을 미루거나 가동 설비를 변경하려면 간트 차트의 공정 블록을 터치/클릭하세요.
              </p>
            </div>
          )}

          {activeTask && (
            <button
              type="button"
              onClick={() => setActiveTaskId(null)}
              className="w-full py-2 bg-slate-200 hover:bg-slate-350 rounded-xl text-[9px] font-black text-slate-600 transition-colors"
            >
              조정 완료
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
