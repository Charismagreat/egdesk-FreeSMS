"use client";

import React from "react";
import { Calendar, RefreshCw, Loader2 } from "lucide-react";
import { EcountSchedule } from "../types";

interface EcountScheduleFeedProps {
  schedules: EcountSchedule[];
  schedulesLoading: boolean;
  fetchSchedules: () => Promise<void>;
  handleToggleSchedule: (id: string, currentActive: number) => Promise<void>;
  handleDeleteSchedule: (id: string) => Promise<void>;
}

export default function EcountScheduleFeed({
  schedules,
  schedulesLoading,
  fetchSchedules,
  handleToggleSchedule,
  handleDeleteSchedule
}: EcountScheduleFeedProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600 animate-pulse" />
          <h3 className="text-base font-bold text-slate-800">
            실시간 자동화 스케줄 감시 피드 (Autopilot Watch Feed)
          </h3>
        </div>
        <button
          onClick={fetchSchedules}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-800 flex items-center gap-1"
          title="스케줄 새로고침"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${schedulesLoading ? "animate-spin" : ""}`} />
          <span className="text-[10px] font-bold text-slate-500">새로고침</span>
        </button>
      </div>

      {schedulesLoading && schedules.length === 0 ? (
        <div className="flex justify-center items-center py-10 bg-slate-50 rounded-xl">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
          <p className="text-xs text-slate-400 font-medium">
            등록된 백그라운드 자동 동기화 스케줄이 없습니다.
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
            우측 Autopilot 설정 패널에서 첫 번째 주기 스케줄을 추가해 보세요.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse bg-white">
            <thead>
              <tr className="border-b border-slate-250 text-slate-500 font-bold bg-slate-50">
                <th className="py-2.5 px-3">RPA 동기화 시나리오</th>
                <th className="py-2.5 px-3">SQLite 적재지 물리명</th>
                <th className="py-2.5 px-3">동기화 주기</th>
                <th className="py-2.5 px-3">차기 예정 시각</th>
                <th className="py-2.5 px-3">최종 구동시각</th>
                <th className="py-2.5 px-3 text-center">활성 스위치</th>
                <th className="py-2.5 px-3 text-right">제어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {schedules.map((sched) => (
                <tr
                  key={sched.id}
                  className="hover:bg-slate-50/50 transition-all font-medium text-slate-700 font-mono text-[11px]"
                >
                  <td className="py-3 px-3 font-bold text-slate-800 font-sans">{sched.script_title}</td>
                  <td className="py-3 px-3 text-[10px] text-slate-500">{sched.target_table}</td>
                  <td className="py-3 px-3 font-sans">
                    <div className="flex flex-col space-y-0.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 w-fit">
                        {sched.period_preset === "hour"
                          ? "매시간"
                          : sched.period_preset === "daily"
                          ? `매일 [${sched.run_time}]`
                          : sched.period_preset === "weekly"
                          ? `매주 [${
                              sched.week_days
                                ? sched.week_days
                                    .split(",")
                                    .map(
                                      (d: string) =>
                                        ["월", "화", "수", "목", "금", "토", "일"][
                                          parseInt(d, 10) - 1
                                        ]
                                    )
                                    .join(",")
                                : "평일"
                            }] [${sched.run_time}]`
                          : `매월 [${sched.month_day || 1}일] [${sched.run_time}]`}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold pl-0.5">
                        동기화 범위: 최근 {sched.sync_days_range || 30}일간
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[10px] font-bold text-slate-655 font-sans">
                    {sched.is_active === 1 && sched.next_run_at ? (
                      new Date(sched.next_run_at).toLocaleString("ko-KR", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    ) : (
                      <span className="text-slate-400 font-normal font-sans">대기 일시중단</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-[10px] text-slate-400 font-sans">
                    {sched.last_run_at ? new Date(sched.last_run_at).toLocaleString() : "미실행"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleToggleSchedule(sched.id, sched.is_active)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        sched.is_active === 1 ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          sched.is_active === 1 ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right font-sans">
                    <button
                      onClick={() => handleDeleteSchedule(sched.id)}
                      className="px-2.5 py-1 rounded bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 hover:text-rose-700 transition-all text-[10px] font-bold"
                    >
                      일정 삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
