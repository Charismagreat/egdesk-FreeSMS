"use client";

import React from "react";
import { Loader2, AlertCircle, CheckCircle2, Database } from "lucide-react";
import { EcountScript } from "../types";

interface EcountScriptListProps {
  loading: boolean;
  filteredScripts: EcountScript[];
  selectedScript: EcountScript | null;
  handleSelectScript: (script: EcountScript) => void;
  creatingTable: string | null;
  handleCreateTable: (targetTable: string, columns: string[]) => Promise<void>;
}

export default function EcountScriptList({
  loading,
  filteredScripts,
  selectedScript,
  handleSelectScript,
  creatingTable,
  handleCreateTable
}: EcountScriptListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-500 text-sm mt-4">
          이지데스크서버로부터 내장 RPA 스크립트를 동적으로 수집하고 있습니다...
        </p>
      </div>
    );
  }

  if (filteredScripts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm text-center px-6">
        <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-bold text-slate-800">해당하는 RPA 스크립트가 없습니다</h3>
        <p className="text-slate-500 text-sm mt-1 max-w-md">
          검색어나 카테고리 필터를 변경하여 다시 시도해 주십시오.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {filteredScripts.map((script) => {
        const isSelected = selectedScript?.fileName === script.fileName;
        return (
          <div
            key={script.fileName}
            onClick={() => handleSelectScript(script)}
            className={`group cursor-pointer rounded-2xl border transition-all duration-200 p-4.5 flex flex-col justify-between relative overflow-hidden ${
              isSelected
                ? "border-blue-500 bg-blue-50/20 shadow-md shadow-blue-500/5 ring-1 ring-blue-500"
                : "border-slate-200 bg-white hover:border-slate-350 hover:shadow-md"
            }`}
          >
            {/* 카테고리 뱃지 및 상태 LED */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center space-x-1.5 min-w-0">
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold tracking-wider uppercase shrink-0 ${
                    script.category === "매출"
                      ? "bg-emerald-100 text-emerald-700"
                      : script.category === "매입"
                      ? "bg-rose-100 text-rose-700"
                      : script.category === "재고"
                      ? "bg-cyan-100 text-cyan-700"
                      : script.category === "거래처"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {script.category}
                </span>

                {!script.isTableCreated && (
                  <span
                    className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200 shrink-0 flex items-center gap-0.5"
                    title="데이터베이스에 이 테이블이 존재하지 않습니다. RPA 동기화를 구동하세요."
                  >
                    <span>⚠️</span>
                    <span>테이블 미생성</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    script.isRealFileAvailable ? "bg-green-500 animate-pulse" : "bg-blue-400"
                  }`}
                ></span>
                <span className="text-[9px] font-semibold text-slate-500">
                  {script.isRealFileAvailable ? "연동됨" : "시뮬"}
                </span>
              </div>
            </div>

            {/* 카드 텍스트 정보 */}
            <div className="space-y-1.5 flex-1">
              <h3 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors text-sm leading-snug">
                {script.title}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                {script.description}
              </p>
            </div>

            {/* ERP 메뉴 주소 및 적재 테이블 */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center text-slate-500">
                <span>ERP 경로:</span>
                <span
                  className="font-semibold text-slate-700 truncate max-w-[100px] text-right"
                  title={script.menuPath}
                >
                  {script.menuPath.split(" > ").pop()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">DB 테이블:</span>
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      script.isTableCreated ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  ></span>
                  <code
                    className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold border transition-all ${
                      script.isTableCreated
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50/50 border-rose-200 text-rose-700/80 line-through opacity-70"
                    }`}
                    title={
                      script.isTableCreated
                        ? `물리 테이블 연동 완료: ${script.targetTable}`
                        : `테이블 미생성 (RPA 구동 필요): ${script.targetTable}`
                    }
                  >
                    {script.targetTable}
                  </code>
                </div>
              </div>
            </div>

            {/* 테이블 미생성 시, 원클릭 테이블 강제 생성 버튼 마운트 */}
            {!script.isTableCreated && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateTable(script.targetTable, script.columns);
                }}
                disabled={creatingTable === script.targetTable}
                className="w-full mt-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-350 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs flex items-center justify-center space-x-1"
              >
                {creatingTable === script.targetTable ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>생성 중...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>물리 테이블 강제 생성</span>
                  </>
                )}
              </button>
            )}

            {/* 선택 표시 우측 상단 선명 아이콘 */}
            {isSelected && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white p-1 rounded-bl-xl">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
