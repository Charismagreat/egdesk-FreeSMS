"use client";

import { Settings } from "lucide-react";
import AiSettingsCard from "../AiSettingsCard";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
          <Settings className="w-8 h-8 text-slate-500 mr-3" />
          시스템 설정
        </h1>
        <p className="text-slate-500 mt-2">EGDESK SMS 시스템의 전반적인 환경과 연동 API를 관리합니다.</p>
      </div>

      <div className="space-y-6">
        <AiSettingsCard />
        
        {/* 추가적인 시스템 설정 UI가 필요한 경우 여기에 배치 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-4 mb-4">일반 설정</h3>
          <p className="text-slate-500 text-sm">현재 설정 가능한 추가 항목이 없습니다. (준비 중)</p>
        </div>
      </div>
    </div>
  );
}
