"use client";

export const dynamic = "force-dynamic";

import { Settings } from "lucide-react";
import AiSettingsCard from "../AiSettingsCard";
import PointSettingsCard from "../PointSettingsCard";
import AiUsageMonitor from "../AiUsageMonitor";
import MenuSettingsCard from "./MenuSettingsCard";
import FeedbackManagementCard from "./FeedbackManagementCard";

export default function SettingsPage() {
  return (
    <div className="p-8 w-full max-w-none">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
          <Settings className="w-8 h-8 text-slate-500 mr-3" />
          시스템 설정
        </h1>
        <p className="text-slate-500 mt-2">EGDESK SMS 시스템의 전반적인 환경과 연동 API를 관리합니다.</p>
      </div>

      <div className="space-y-6">
        <AiSettingsCard />
        <AiUsageMonitor />
        <PointSettingsCard />
        <MenuSettingsCard />
        <FeedbackManagementCard />
      </div>
    </div>
  );
}
