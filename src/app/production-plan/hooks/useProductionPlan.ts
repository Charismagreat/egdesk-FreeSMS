import { useState, useEffect, useCallback } from "react";
import { GanttTask, UnscheduledOrder, BottleneckInfo, DueRiskAnalysis } from "../types";

export function useProductionPlan() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  // 생산 계획 데이터 상태
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [unscheduledOrders, setUnscheduledOrders] = useState<UnscheduledOrder[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckInfo[]>([]);
  const [dueRiskAnalysis, setDueRiskAnalysis] = useState<DueRiskAnalysis[]>([]);

  // 신규 배정을 위한 폼 상태
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedEqId, setSelectedEqId] = useState("M-500");
  const [startHour, setStartHour] = useState(9);
  const [duration, setDuration] = useState(4);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 1. 기초 생산 계획 데이터 로드 (GET)
  const fetchPlanData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/production/plan");
      const data = await res.json();
      if (data.success) {
        setGanttTasks(data.ganttTasks);
        setUnscheduledOrders(data.unscheduledOrders);
        setBottlenecks(data.bottlenecks);
        setDueRiskAnalysis(data.dueRiskAnalysis);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("생산 데이터 로딩 실패:", e);
      showToast("생산 계획 데이터를 수신하는 데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPlanData();
  }, [fetchPlanData]);

  // 2. 수동 스케줄 조정 요청 (POST - reschedule)
  const handleReschedule = async (taskId: string, startHour: number, endHour: number, equipmentId: string) => {
    try {
      const res = await fetch("/api/production/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          taskId,
          startHour,
          endHour,
          equipmentId
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGanttTasks(data.ganttTasks);
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`일정 조정 실패: ${e.message}`, "error");
    }
  };

  // 3. 신규 수주 주문 스케줄 자동 배정 요청 (POST - schedule_order)
  const handleScheduleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      showToast("배정할 수주 주문을 선택해 주세요.", "warn");
      return;
    }

    try {
      const res = await fetch("/api/production/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule_order",
          orderId: selectedOrderId,
          equipmentId: selectedEqId,
          startHour,
          duration,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGanttTasks(data.ganttTasks);
        setUnscheduledOrders(data.unscheduledOrders);
        setIsFormOpen(false);
        setSelectedOrderId("");
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`주문 배정 실패: ${e.message}`, "error");
    }
  };

  // 4. 모바일 모의 작업 진행 처리 (update_status)
  const handleUpdateStatus = async (taskId: string, status: "WAITING" | "RUNNING" | "COMPLETED", progress: number) => {
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
        setGanttTasks(data.ganttTasks);
        showToast("공정 진행 상태가 수동 업데이트되었습니다.", "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`상태 업데이트 실패: ${e.message}`, "error");
    }
  };

  return {
    isLoading,
    toast,
    ganttTasks,
    unscheduledOrders,
    bottlenecks,
    dueRiskAnalysis,
    selectedOrderId,
    setSelectedOrderId,
    selectedEqId,
    setSelectedEqId,
    startHour,
    setStartHour,
    duration,
    setDuration,
    isFormOpen,
    setIsFormOpen,
    handleReschedule,
    handleScheduleOrder,
    handleUpdateStatus,
    fetchPlanData,
  };
}
