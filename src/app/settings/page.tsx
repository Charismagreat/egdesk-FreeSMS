"use client";

export const dynamic = "force-dynamic";

import { SettingsHeader } from "./components/SettingsHeader";
import { SettingsContainer } from "./components/SettingsContainer";

// 시스템 설정 메인 페이지 오케스트레이터 컴포넌트
export default function SettingsPage() {
  return (
    <div className="p-8 w-full max-w-none">
      {/* 설정 페이지 상단 헤더 영역 */}
      <SettingsHeader />

      {/* 설정 항목 카드 리스트 영역 */}
      <SettingsContainer />
    </div>
  );
}

