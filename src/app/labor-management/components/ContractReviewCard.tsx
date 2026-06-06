import React from "react";
import { EmployeeContract } from "../types";
import { Scale, ShieldCheck, Printer, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

interface ContractReviewCardProps {
  contracts: Record<string, EmployeeContract>;
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string | null) => void;
  onRemediateClause: (employeeId: string, clauseId: string) => Promise<void>;
  onPrintContract: () => void;
}

/**
 * 위법 계약 조항 스캔 및 AI 교정/인쇄 카드
 */
export default function ContractReviewCard({
  contracts,
  selectedEmployeeId,
  onSelectEmployee,
  onRemediateClause,
  onPrintContract,
}: ContractReviewCardProps) {
  
  const currentContract = selectedEmployeeId ? contracts[selectedEmployeeId] : null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left flex flex-col min-h-[500px] space-y-4">
      
      {/* 상단 직원 셀렉터 및 제어 영역 */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Scale className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">근로계약서 AI 독소조항 스캔 & 보정</h4>
            <p className="text-[9px] text-slate-400 font-bold">임금체불 및 노동법 분쟁을 야기하는 계약상 불법 요소를 보정합니다.</p>
          </div>
        </div>

        {/* 직원 선택 드롭다운 */}
        <select
          value={selectedEmployeeId || ""}
          onChange={(e) => onSelectEmployee(e.target.value || null)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[9.5px] font-black text-slate-700 focus:outline-none focus:border-indigo-600 transition-colors"
        >
          <option value="">-- 대상 사원 선택 --</option>
          {Object.values(contracts).map((con) => (
            <option key={con.employeeId} value={con.employeeId}>
              {con.employeeName} ({con.employeeId})
            </option>
          ))}
        </select>
      </div>

      {/* 1. 대기 상태 (선택된 직원이 없는 경우) */}
      {!currentContract ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="p-4 rounded-full bg-slate-50 text-slate-400 border border-slate-200 animate-pulse">
            <FileText className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-black text-slate-750">계약서 진단 대기 중</h5>
            <p className="text-[9.5px] text-slate-400 font-bold max-w-xs leading-relaxed">
              상단의 **대상 사원 선택** 드롭다운에서 임직원을 지정하시면 인공지능이 근로계약서 상의 위법 독소조항을 정밀 스캔하여 합법적 교정 대책을 제안합니다.
            </p>
          </div>
        </div>
      ) : (
        /* 2. 계약서 심사 중인 상태 */
        <div className="flex-1 flex flex-col justify-between space-y-4">
          
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {currentContract.clauses.map((cl) => {
              return (
                <div
                  key={cl.id}
                  className={`border rounded-2xl p-4 text-[9px] font-bold space-y-3 transition-colors ${
                    cl.isIllegal
                      ? "border-rose-250 bg-rose-50/10"
                      : "border-slate-200 bg-slate-50/20"
                  }`}
                >
                  {/* 조항 헤더 */}
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-black text-slate-800">
                      📄 {cl.title}
                    </span>
                    {cl.isIllegal ? (
                      <button
                        type="button"
                        onClick={() => onRemediateClause(currentContract.employeeId, cl.id)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[8.5px] rounded-lg shadow-2xs transition-colors flex items-center gap-0.5"
                      >
                        AI 합법 조항 적용
                      </button>
                    ) : (
                      <span className="text-[8px] font-black text-emerald-650 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        법적 적합 (보정 완료)
                      </span>
                    )}
                  </div>

                  {/* 조항 세부 비교 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-rose-50/30 border border-rose-100/40 rounded-xl p-2.5 text-rose-850">
                      <span className="block text-[7.5px] text-rose-450 font-black mb-1">
                        [위법 조항 감지 문구]
                      </span>
                      {cl.currentText}
                    </div>
                    <div className="bg-emerald-50/30 border border-emerald-100/40 rounded-xl p-2.5 text-emerald-850">
                      <span className="block text-[7.5px] text-emerald-450 font-black mb-1">
                        [AI 추천 표준 근로 문구]
                      </span>
                      {cl.recommendedText}
                    </div>
                  </div>

                  {/* 위법 사유 정보 */}
                  {cl.isIllegal && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-1.5 text-slate-500 font-bold leading-normal">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[7.5px] text-slate-400 font-black mb-0.5">법률 위반 근거 및 제언</span>
                        {cl.reason}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* 하단 계약서 출력 */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
            <p className="text-[8.5px] text-slate-400 font-bold leading-normal">
              ※ 보정 완료 시 위법 조항은 소급 소거되며, 표준 근로 양식으로 새 탭에서 즉시 실물 인쇄 및 PDF 내보내기가 가능합니다.
            </p>
            <button
              type="button"
              onClick={onPrintContract}
              className="px-3.5 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold text-[9.5px] rounded-xl shadow-2xs transition-colors flex items-center gap-1 shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              계약서 새 탭 인쇄
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
