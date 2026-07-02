"use client";

import React from "react";
import { ArrowRightLeft, ShoppingCart, Send, Sparkles } from "lucide-react";
import Link from "next/link";

interface EstimatesHeaderProps {
  activeTab: "inbound" | "outbound";
  setActiveTab: (tab: "inbound" | "outbound") => void;
}

export default function EstimatesHeader({
  activeTab,
  setActiveTab,
}: EstimatesHeaderProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
          <ArrowRightLeft className="w-8 h-8 text-indigo-600" />
          <span>견적/발주/수주 AI</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          견적서 요청 분석부터 발주 전환, 실물 입고 검수 및 실시간 재고 반영까지 단 하나의 보드에서 오토파일럿 제어합니다.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* 일반 특화 견적서 작성 신설 페이지 링크 */}
        <Link
          href="/estimates/general-write"
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black flex items-center justify-center transition-all shadow-md shadow-indigo-600/10 active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300 animate-pulse" />
          (일반)견적서 작성
        </Link>

        {/* 제조업 특화 견적서 작성 신설 페이지 링크 */}
        <Link
          href="/estimates/manufacture-write"
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black flex items-center justify-center transition-all shadow-md shadow-indigo-600/10 active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300 animate-pulse" />
          (제조)견적서 작성
        </Link>

        {/* 제조업 특화 보낸 견적서 상세 대장 링크 */}
        <Link
          href="/estimates/manufacture-webview"
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-black flex items-center justify-center transition-all shadow-md shadow-slate-800/10 active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
          (제조)보낸 견적 대장
        </Link>

        {/* 허브 전환 탭 버튼 */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-100 max-w-md shadow-inner">
          <button
            onClick={() => setActiveTab("inbound")}
            className={`flex-1 py-2 px-4 rounded-lg text-[11px] font-black flex items-center justify-center transition-all cursor-pointer ${
              activeTab === "inbound"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            받은 견적/발주
          </button>
          <button
            onClick={() => setActiveTab("outbound")}
            className={`flex-1 py-2 px-4 rounded-lg text-[11px] font-black flex items-center justify-center transition-all cursor-pointer ${
              activeTab === "outbound"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            보낸 견적/수주
          </button>
        </div>
      </div>
    </div>
  );
}

