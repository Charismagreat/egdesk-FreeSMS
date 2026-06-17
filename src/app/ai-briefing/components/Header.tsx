import React from "react";
import { Sparkles, RefreshCw } from "lucide-react";

interface HeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function Header({ isLoading, onRefresh }: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 select-none">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center tracking-tight">
          <Sparkles className="w-8 h-8 mr-3 text-indigo-650 animate-pulse shrink-0" />
          AI 브리핑
        </h1>
        <p className="text-xs text-slate-400 font-semibold pl-11 leading-tight">
          최고관리자 데이터 통찰 BI 종합 관제 대시보드
        </p>
      </div>
      
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-xs font-black shadow-sm border border-indigo-700/20 cursor-pointer transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto hover:bg-indigo-700"
        style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
        title="수집된 보고서 목록 최신 동기화"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-white ${isLoading ? 'animate-spin' : ''}`} />
        새로 고침
      </button>
    </div>
  );
}
