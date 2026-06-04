"use client";

import React from "react";
import { Search } from "lucide-react";

interface EcountFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export default function EcountFilterBar({
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory
}: EcountFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="RPA 스크립트명, 기능설명, 적재 테이블 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
