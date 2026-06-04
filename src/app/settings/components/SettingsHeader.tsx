"use client";

import React from "react";
import { Settings } from "lucide-react";

// 시스템 설정 페이지의 상단 헤더 컴포넌트
export function SettingsHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center">
        <Settings className="w-8 h-8 text-slate-500 mr-3" />
        시스템 설정
      </h1>
      <p className="text-slate-500 mt-2">EGDESK SMS 시스템의 전반적인 환경과 연동 API를 관리합니다.</p>
    </div>
  );
}
