"use client";

import { apiFetch } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { EcountScript, EcountSchedule } from "../types";

export function useEcountErp() {
  const [scripts, setScripts] = useState<EcountScript[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedScript, setSelectedScript] = useState<EcountScript | null>(null);

  // 날짜 설정 상태
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [quickRange, setQuickRange] = useState<string>("30"); // 기본 30일

  // 검색 및 필터링 상태
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");

  // RPA 실행 모니터링 상태
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionStep, setExecutionStep] = useState<number>(0);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [executionSuccess, setExecutionSuccess] = useState<boolean>(false);
  const [isSimulation, setIsSimulation] = useState<boolean>(false);

  // 스케줄러 및 테이블 생성 상태 ⏰
  const [schedules, setSchedules] = useState<EcountSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState<boolean>(false);
  const [periodPreset, setPeriodPreset] = useState<string>("daily");
  const [runTime, setRunTime] = useState<string>("09:00");
  const [creatingTable, setCreatingTable] = useState<string | null>(null);

  // 스케줄 세부 예약 옵션 상태
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([1, 2, 3, 4, 5]); // 평일 기본
  const [selectedMonthDay, setSelectedMonthDay] = useState<number>(1);
  const [syncDaysRange, setSyncDaysRange] = useState<number>(30); // 기본 30일

  // 1. API 데이터 패치 (이카운트 스크립트 목록 조회)
  const fetchScripts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/ecount-erp");
      const data = await res.json();
      if (data.success && Array.isArray(data.scripts)) {
        setScripts(data.scripts);
        // 기존에 선택된 스크립트가 있다면 상태 유지, 없다면 첫 번째 선택
        if (data.scripts.length > 0) {
          const currentSelected = selectedScript
            ? data.scripts.find((s: EcountScript) => s.fileName === selectedScript.fileName)
            : null;
          if (currentSelected) {
            setSelectedScript(currentSelected);
          } else {
            setSelectedScript(data.scripts[0]);
            applyQuickRange(data.scripts[0].defaultDaysRange.toString());
          }
        }
      }
    } catch (error) {
      console.error("이카운트 스크립트 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
    fetchSchedules();
  }, []);

  // 2. 빠른 날짜 선택기 적용
  const applyQuickRange = (daysStr: string) => {
    setQuickRange(daysStr);
    const end = new Date();
    const start = new Date();

    const days = parseInt(daysStr, 10);
    if (days > 0) {
      start.setDate(end.getDate() - days);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    } else {
      // 당일 실시간
      setStartDate(end.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    }
  };

  // 스크립트 카드 선택 핸들러
  const handleSelectScript = (script: EcountScript) => {
    setSelectedScript(script);
    applyQuickRange(script.defaultDaysRange.toString());
  };

  // 3. ⚡ RPA 실행 신호 트리거 (POST 전송)
  const handleExecuteRpa = async () => {
    if (!selectedScript) return;

    setIsExecuting(true);
    setExecutionSuccess(false);
    setExecutionStep(1);
    setExecutionLog(["[시스템] 이지데스크 RPA 연동 에이전트 구동 신호를 활성화합니다."]);

    // 단계별 진행 시뮬레이션 타이머
    const steps = [
      { step: 1, text: "RPA 에이전트 기동 중... ⚙️ (로컬 PC 포트 바인딩 완료)", delay: 800 },
      { step: 2, text: "이카운트 ERP 시큐리티 로그인 관문 진입 중... 🔑", delay: 1000 },
      { step: 3, text: `이카운트 데이터 원장 메뉴 탐색 중... 🧭 (${selectedScript.menuPath})`, delay: 1200 },
      { step: 4, text: "필터링 날짜 파라미터 주입 및 원장 엑셀 무결성 다운로드 중... 📁", delay: 1500 },
      { step: 5, text: `다운로드 완료. SQLite 물리 테이블 [${selectedScript.targetTable}] 생성 및 파싱 적재 중... 💾`, delay: 1000 },
    ];

    let currentLog = ["[시스템] 이지데스크 RPA 연동 에이전트 구동 신호를 활성화합니다."];

    // 비동기 API 실제 요청
    try {
      const res = await apiFetch("/api/ecount-erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedScript.fileName,
          startDate,
          endDate,
        }),
      });
      const data = await res.json();
      setIsSimulation(!!data.isMock);

      // 시뮬레이션 또는 실제 실행 스텝 단계 애니메이션 시작
      for (const item of steps) {
        setExecutionStep(item.step);
        currentLog = [...currentLog, `[RPA] ${item.text}`];
        setExecutionLog(currentLog);
        await new Promise((resolve) => setTimeout(resolve, item.delay));
      }

      if (data.success) {
        setExecutionStep(6);
        setExecutionSuccess(true);
        setExecutionLog((prev) => [
          ...prev,
          `[성공] 이카운트 동기화 완수! 물리 테이블 [${selectedScript.targetTable}]에 데이터가 안전하게 빌드되었습니다. 🎉`,
        ]);
        // DB 테이블 변경 이벤트를 대시보드 및 메뉴에 갱신 알림
        window.dispatchEvent(new CustomEvent("menu-settings-updated"));
      } else {
        throw new Error(data.error || "RPA 스크립트 실행 중 에러가 반환되었습니다.");
      }
    } catch (err: any) {
      setExecutionStep(-1);
      setExecutionLog((prev) => [
        ...prev,
        `[오류] 동기화 중단: ${
          err.message || "이지데스크서버와의 세션 연결 상태를 다시 점검해 주십시오."
        } ❌`,
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  // 4. SQLite 물리 테이블 원클릭 강제 신설 함수
  const handleCreateTable = async (targetTable: string, columns: string[]) => {
    setCreatingTable(targetTable);
    try {
      const res = await apiFetch("/api/ecount-erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_TABLE",
          targetTable,
          columns,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`물리 테이블 [${targetTable}]이 SQLite 데이터베이스에 성공적으로 신설되었습니다.`);
        await fetchScripts();
        window.dispatchEvent(new CustomEvent("menu-settings-updated"));
      } else {
        alert(`테이블 생성 실패: ${data.error}`);
      }
    } catch (error: any) {
      alert(`테이블 생성 중 오류 발생: ${error.message}`);
    } finally {
      setCreatingTable(null);
    }
  };

  // 5. 스케줄 관련 비동기 함수 대장
  const fetchSchedules = async () => {
    setSchedulesLoading(true);
    try {
      const res = await apiFetch("/api/ecount-erp/schedule");
      const data = await res.json();
      if (data.success && Array.isArray(data.schedules)) {
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error("스케줄 목록 로드 실패:", error);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!selectedScript) return;
    try {
      const res = await apiFetch("/api/ecount-erp/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          scriptFile: selectedScript.fileName,
          scriptTitle: selectedScript.title,
          targetTable: selectedScript.targetTable,
          periodPreset,
          runTime,
          weekDays: selectedWeekDays.join(","),
          monthDay: selectedMonthDay,
          syncDaysRange,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("자동화 동기화 스케줄이 성공적으로 등록되었습니다.");
        fetchSchedules();
      } else {
        alert(`스케줄 등록 실패: ${data.error}`);
      }
    } catch (error: any) {
      alert(`스케줄 등록 중 오류 발생: ${error.message}`);
    }
  };

  const handleToggleSchedule = async (id: string, currentActive: number) => {
    try {
      const res = await apiFetch("/api/ecount-erp/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE",
          id,
          isActive: currentActive === 1 ? 0 : 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSchedules();
      } else {
        alert(`스케줄 활성화 전환 실패: ${data.error}`);
      }
    } catch (error: any) {
      alert(`스케줄 토글 중 오류 발생: ${error.message}`);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("정말로 이 스케줄을 삭제하시겠습니까?")) return;
    try {
      const res = await apiFetch("/api/ecount-erp/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE",
          id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSchedules();
      } else {
        alert(`스케줄 삭제 실패: ${data.error}`);
      }
    } catch (error: any) {
      alert(`스케줄 삭제 중 오류 발생: ${error.message}`);
    }
  };

  // 카테고리 추출
  const categories = ["전체", ...Array.from(new Set(scripts.map((s) => s.category)))];

  // 필터링 적용된 스크립트
  const filteredScripts = scripts.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.targetTable.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "전체" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return {
    scripts,
    loading,
    selectedScript,
    setSelectedScript,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    quickRange,
    setQuickRange,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isExecuting,
    executionStep,
    executionLog,
    executionSuccess,
    isSimulation,
    schedules,
    schedulesLoading,
    periodPreset,
    setPeriodPreset,
    runTime,
    setRunTime,
    creatingTable,
    selectedWeekDays,
    setSelectedWeekDays,
    selectedMonthDay,
    setSelectedMonthDay,
    syncDaysRange,
    setSyncDaysRange,
    categories,
    filteredScripts,
    fetchScripts,
    applyQuickRange,
    handleSelectScript,
    handleExecuteRpa,
    handleCreateTable,
    fetchSchedules,
    handleCreateSchedule,
    handleToggleSchedule,
    handleDeleteSchedule,
  };
}
