import React from "react";
import { EmployeeLaborStat, LaborAuditSummary } from "../types";
import { ShieldAlert, RefreshCw, AlertTriangle, FileCheck, CheckCircle2 } from "lucide-react";

interface LaborAuditCardProps {
  stats: EmployeeLaborStat[];
  summary: LaborAuditSummary | null;
  onGenerateAudit: () => Promise<void>;
  isAuditing: boolean;
}

/**
 * 전사 근로기준법 준수 진단 및 수당 오차 분석 컴포넌트
 */
export default function LaborAuditCard({
  stats,
  summary,
  onGenerateAudit,
  isAuditing,
}: LaborAuditCardProps) {
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 80) return "text-indigo-650 bg-indigo-50 border-indigo-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left space-y-6">
      
      {/* 1. 상단 점수 및 리스크 요인 2열 구성 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* 감사 점수 */}
          <div className="md:col-span-4 flex flex-col justify-between border border-slate-150 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden">
            <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider">전사 노무 감사 점수</span>
            <div className={`border rounded-2xl py-4 flex flex-col items-center justify-center ${getScoreColor(summary.auditScore)}`}>
              <span className="text-2xl font-black font-mono leading-none">{summary.auditScore}</span>
              <span className="text-[8.5px] font-black mt-1">/ 100 점</span>
            </div>
            <span className="text-[7.5px] text-slate-400 font-bold">근태 스캔 및 계약서 법적 분석 가산점 반영</span>
          </div>

          {/* 위반 경보 요인 */}
          <div className="md:col-span-8 border border-slate-150 rounded-2xl p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-slate-700">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span className="text-[10px] font-black">실시간 3대 위법 리스크 요약</span>
            </div>
            <ul className="space-y-1.5 text-[9px] font-bold text-slate-600 pl-0.5">
              {summary.riskFactors.map((factor, idx) => (
                <li key={idx} className="leading-relaxed flex items-start gap-1">
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 2. 임직원 실시간 근태 및 주 52시간 감사 리스트 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FileCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">임직원 실시간 주 52시간 근태 감사 대장</h4>
              <p className="text-[9px] text-slate-400 font-bold">출퇴근 타임스탬프 스캔 기반 주간 누적 연장 근로시간 모니터링</p>
            </div>
          </div>

          <button
            type="button"
            disabled={isAuditing}
            onClick={onGenerateAudit}
            className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-[9px] rounded-xl shadow-2xs transition-colors flex items-center gap-1 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />
            {isAuditing ? "노무 데이터 재분석 중..." : "실시간 근태 스캔"}
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-150 rounded-2xl">
          <table className="w-full min-w-[600px] border-collapse text-[10px] font-bold text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[8.5px] font-black uppercase text-left">
                <th className="p-3">사원번호</th>
                <th className="p-3">성명</th>
                <th className="p-3">소속 부서/공정</th>
                <th className="p-3 text-right">금주 누적근로</th>
                <th className="p-3 text-right">법정 연장근로</th>
                <th className="p-3 text-center">지각/조퇴 (월)</th>
                <th className="p-3 text-center">노무 리스크</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.map((emp) => {
                const isCritical = emp.riskLevel === "CRITICAL";
                const isWarn = emp.riskLevel === "WARNING";

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-mono font-black">{emp.id}</td>
                    <td className="p-3 font-black text-slate-800">{emp.name}</td>
                    <td className="p-3">{emp.department}</td>
                    <td className="p-3 text-right font-mono font-black">{emp.weeklyHours.toFixed(1)}H</td>
                    <td className="p-3 text-right font-mono font-black text-slate-500">
                      {emp.overtimeHours > 0 ? `+${emp.overtimeHours.toFixed(1)}H` : "0.0H"}
                    </td>
                    <td className="p-3 text-center text-slate-500 font-mono">
                      지각 {emp.latenessCount}회 / 조퇴 {emp.earlyLeaveCount}회
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                        isCritical ? "bg-rose-100 text-rose-700 animate-pulse" :
                        isWarn ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                        {isCritical ? "한도 초과 (🚨)" : isWarn ? "주의 (⚠️)" : "양호 (✅)"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
