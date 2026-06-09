"use client";

import React from "react";
import { RefreshCw, Database, ArrowRightLeft } from "lucide-react";
import Link from "next/link";

interface EcountHeaderProps {
  fetchScripts: () => Promise<void>;
}

export default function EcountHeader({ fetchScripts }: EcountHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center tracking-tight">
        <ArrowRightLeft className="w-8 h-8 text-sky-500 mr-3" />
        이카운트 ERP AI
      </h1>

      {/* 우측 퀵 액션 */}
      <div className="flex items-center space-x-2">
        <button
          onClick={fetchScripts}
          className="flex items-center space-x-1 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>새로고침</span>
        </button>
        <Link
          href="/my-db"
          className="flex items-center space-x-1 px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/10"
        >
          <Database className="w-3.5 h-3.5" />
          <span>MY DB 바로가기</span>
        </Link>
      </div>
    </div>
  );
}
