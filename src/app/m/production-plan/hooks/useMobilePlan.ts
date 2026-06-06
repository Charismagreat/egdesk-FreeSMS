import { useState, useEffect, useCallback } from "react";
import { GanttTask } from "../../../production-plan/types";

export function useMobilePlan() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  // 모바일 사용 환경용 작업자 설정 (시뮬레이션 기본값: "이민우 (조장)")
  const [currentOperator, setCurrentOperator] = useState("이민우 (조장)");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [tasks, setTasks] = useState<GanttTask[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 모바일 작업 목록 로드
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/production/plan");
      const data = await res.json();
      if (data.success) {
        setTasks(data.ganttTasks || []);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("모바일 작업 지시 로딩 실패:", e);
      showToast("작업 목록을 로드하지 못했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 출근 등록/퇴근 등록 처리
  const handleCheckInToggle = () => {
    if (!isCheckedIn) {
      setIsCheckedIn(true);
      showToast(`${currentOperator}님, 오늘 출근 등록이 완료되었습니다. 작업 진행이 가능합니다.`, "success");
    } else {
      setIsCheckedIn(false);
      showToast("퇴근 처리가 완료되었습니다. 고생하셨습니다.", "success");
    }
  };

  // 작업 상태 및 진행률 백엔드 연동 업데이트
  const updateTaskStatus = async (
    taskId: string,
    status: "WAITING" | "RUNNING" | "COMPLETED",
    progress: number
  ) => {
    try {
      const res = await fetch("/api/production/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          taskId,
          status,
          progress,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // 내부 상태 즉시 동기화
        setTasks(data.ganttTasks || []);
        showToast("작업 정보가 실시간 무선 연동 및 대장에 업데이트되었습니다.", "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`작업 상태 변경 실패: ${e.message}`, "error");
    }
  };

  // 특정 작업자가 담당하는 태스크만 필터링
  const operatorTasks = tasks.filter((t) => t.operatorName === currentOperator);

  return {
    isLoading,
    toast,
    currentOperator,
    setCurrentOperator,
    isCheckedIn,
    tasks,
    operatorTasks,
    handleCheckInToggle,
    updateTaskStatus,
    fetchTasks,
  };
}
