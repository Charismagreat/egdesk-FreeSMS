"use client";

import React from "react";
import { Play, Info, Calendar, AlertCircle, Loader2, Sparkles, Lock, Database } from "lucide-react";
import { EcountScript } from "../types";

interface AutopilotControllerProps {
  selectedScript: EcountScript | null;
  quickRange: string;
  applyQuickRange: (days: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  isExecuting: boolean;
  handleExecuteRpa: () => Promise<void>;
  creatingTable: string | null;
  handleCreateTable: (table: string, cols: string[]) => Promise<void>;
  executionStep: number;
  executionLog: string[];
  executionSuccess: boolean;
  isSimulation: boolean;
  periodPreset: string;
  setPeriodPreset: (preset: string) => void;
  runTime: string;
  setRunTime: (time: string) => void;
  selectedWeekDays: number[];
  setSelectedWeekDays: (days: number[]) => void;
  selectedMonthDay: number;
  setSelectedMonthDay: (day: number) => void;
  syncDaysRange: number;
  setSyncDaysRange: (range: number) => void;
  handleCreateSchedule: () => Promise<void>;
}

export default function AutopilotController({
  selectedScript,
  quickRange,
  applyQuickRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isExecuting,
  handleExecuteRpa,
  creatingTable,
  handleCreateTable,
  executionStep,
  executionLog,
  executionSuccess,
  isSimulation,
  periodPreset,
  setPeriodPreset,
  runTime,
  setRunTime,
  selectedWeekDays,
  setSelectedWeekDays,
  selectedMonthDay,
  setSelectedMonthDay,
  syncDaysRange,
  setSyncDaysRange,
  handleCreateSchedule
}: AutopilotControllerProps) {
  if (!selectedScript) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-8 text-left">
        
        {/* 타이틀 및 메타 */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 mb-1">
            <Play className="w-3.5 h-3.5 fill-blue-600" />
            <span>AUTOPILOT CONTROLLER</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">{selectedScript.title}</h2>
          <p className="text-xs text-slate-500 mt-1">{selectedScript.fileName}</p>
        </div>

        {/* 매핑 구조 정보 아코디언 */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
          <div className="flex items-center text-xs font-bold text-slate-700">
            <Info className="w-4 h-4 mr-1.5 text-blue-500" />
            <span>DB 테이블 적재 스키마 매핑 정보</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedScript.columns.map((col) => (
              <span
                key={col}
                className="px-2 py-1 bg-white rounded-lg text-[10px] border border-slate-200 text-slate-650 font-semibold font-mono"
              >
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* 📅 날짜 파라미터 조작기 */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-750">RPA 동기화 기간 선택</label>

          {/* 빠른 조회 기간 프리셋 */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "실시간", value: "0" },
              { label: "7일간", value: "7" },
              { label: "30일간", value: "30" },
              { label: "90일간", value: "90" }
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => applyQuickRange(preset.value)}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  quickRange === preset.value
                    ? "bg-blue-50 text-blue-600 border-blue-200 font-bold"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* 수동 Date Input */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  applyQuickRange("custom");
                }}
                className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-700"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  applyQuickRange("custom");
                }}
                className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* 물리 테이블 미생성 상태 시 강제 신설 경고 카드 */}
        {!selectedScript.isTableCreated && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4.5 space-y-3">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-950">물리 테이블 미생성 상태</h4>
                <p className="text-[10px] text-rose-700/80 leading-relaxed mt-0.5">
                  RPA가 수집할 데이터를 영구 보관할 SQLite 데이터베이스의 물리 테이블이 구축되지 않았습니다.
                  동기화를 진행하기 전에 테이블 스키마를 신설하십시오.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCreateTable(selectedScript.targetTable, selectedScript.columns)}
              disabled={creatingTable === selectedScript.targetTable}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm border-none cursor-pointer"
            >
              {creatingTable === selectedScript.targetTable ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>테이블 스키마 빌드 중...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>SQLite 물리 테이블 즉시 신설</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ⚡ 기동 버튼 */}
        <button
          onClick={handleExecuteRpa}
          disabled={isExecuting}
          className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none transition-all border-none cursor-pointer"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>RPA 기동 명령 처리 중...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-white" />
              <span>이카운트 동기화 실행 (Run RPA)</span>
            </>
          )}
        </button>

        {/* ⏰ 백그라운드 자동 동기화 예약 카드 (상세 설정) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>백그라운드 자동 동기화 예약 (상세 설정)</span>
          </div>

          <div className="space-y-3">
            {/* 주기 Preset */}
            <div>
              <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                실행 주기 Preset
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: "매시간", value: "hour" },
                  { label: "매일", value: "daily" },
                  { label: "매주", value: "weekly" },
                  { label: "매월", value: "monthly" }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPeriodPreset(item.value)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      periodPreset === item.value
                        ? "bg-blue-50 border-blue-200 text-blue-600 font-extrabold"
                        : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. 매주일 때 요일 선택 */}
            {periodPreset === "weekly" && (
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  동기화 요일 선택 (중복가능)
                </label>
                <div className="flex gap-1 justify-between">
                  {[
                    { label: "월", val: 1 },
                    { label: "화", val: 2 },
                    { label: "수", val: 3 },
                    { label: "목", val: 4 },
                    { label: "금", val: 5 },
                    { label: "토", val: 6 },
                    { label: "일", val: 7 }
                  ].map((day) => {
                    const isSelected = selectedWeekDays.includes(day.val);
                    return (
                      <button
                        key={day.val}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedWeekDays(selectedWeekDays.filter((d) => d !== day.val));
                          } else {
                            setSelectedWeekDays([...selectedWeekDays, day.val].sort());
                          }
                        }}
                        className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${
                          isSelected
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. 매월일 때 일자 선택 */}
            {periodPreset === "monthly" && (
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  동기화 지정 일자 (매월)
                </label>
                <select
                  value={selectedMonthDay}
                  onChange={(e) => setSelectedMonthDay(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-semibold text-slate-700"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      매월 {day}일
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 주기별 시간 조절 input */}
            {periodPreset !== "hour" && (
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  동기화 기동 시간 설정
                </label>
                <input
                  type="time"
                  value={runTime}
                  onChange={(e) => setRunTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-mono font-semibold text-slate-700"
                />
              </div>
            )}

            {/* 동기화 조회 범위 범위 설정 */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                동기화 데이터 수집 범위 (최근 일수)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={syncDaysRange}
                  onChange={(e) => setSyncDaysRange(parseInt(e.target.value, 10) || 30)}
                  className="w-full pl-3 pr-9 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold text-slate-700"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                  일간
                </span>
              </div>
            </div>

            {/* 스케줄 생성 등록 단추 */}
            <button
              onClick={handleCreateSchedule}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs border-none cursor-pointer mt-1"
            >
              백그라운드 자동화 일정 등록
            </button>
          </div>
        </div>

        {/* RPA 실행 모니터링 로그 콘솔 */}
        {(isExecuting || executionLog.length > 0) && (
          <div className="bg-slate-900 rounded-2xl p-5 text-left border border-slate-950 shadow-inner space-y-4">
            
            {/* 상단 뱃지 및 로더 */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                {isExecuting ? (
                  <Loader2 className="w-4 h-4 text-cyan-40 animate-spin" />
                ) : executionSuccess ? (
                  <Sparkles className="w-4 h-4 text-emerald-450 animate-pulse" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                )}
                <span className="text-xs font-black text-slate-200 tracking-wider">
                  {isExecuting
                    ? "RPA AGENT EXECUTION ACTIVE"
                    : executionSuccess
                    ? "RPA EXECUTION SUCCESS"
                    : "RPA EXECUTION TERMINATED"}
                </span>
              </div>
              
              <span className="px-2 py-0.5 rounded text-[8px] bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                {isSimulation ? "SIMULATION" : "REAL"}
              </span>
            </div>

            {/* 단계별 프로세스 게이지 바 */}
            {isExecuting && (
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>PROCESS STEP:</span>
                  <span className="font-bold text-cyan-40">{executionStep}/5</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${(executionStep / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* 터미널 로그 콘솔 */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/60 max-h-[220px] overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-350 space-y-1 no-scrollbar shadow-inner">
              {executionLog.map((log, idx) => {
                const isSystem = log.startsWith("[시스템]");
                const isRpa = log.startsWith("[RPA]");
                const isSuccess = log.startsWith("[성공]");
                const isError = log.startsWith("[오류]");

                return (
                  <div
                    key={idx}
                    className={`${
                      isSystem
                        ? "text-blue-400 font-bold"
                        : isRpa
                        ? "text-slate-300"
                        : isSuccess
                        ? "text-emerald-450 font-bold"
                        : isError
                        ? "text-rose-450 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
            </div>
            
            {/* 권한 잠금 장치 시뮬레이션 예방 문구 */}
            {isSimulation && (
              <p className="text-[9px] font-bold text-amber-500/80 leading-normal flex items-start gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  [시뮬레이션 작동 알림] 보안 검증을 위해 가상의 데이터 동기화 동작이 작동되었습니다.
                  실제 데이터 적재는 로컬 에이전트 구동 포트 연결 완료 후 이루어집니다.
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
