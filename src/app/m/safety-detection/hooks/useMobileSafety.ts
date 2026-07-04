import { apiFetch } from '@/lib/api';
import { useState, useEffect, useCallback } from "react";
import { DangerLog, CctvInfo } from "../../../safety-detection/types";

export function useMobileSafety() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  const [cctvs, setCctvs] = useState<CctvInfo[]>([]);
  const [dangerLogs, setDangerLogs] = useState<DangerLog[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 모바일 데이터 로드
  const fetchSafetyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/production/safety");
      const data = await res.json();
      if (data.success) {
        setCctvs(data.cctvs || []);
        setDangerLogs(data.dangerLogs || []);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("모바일 위험 감지 데이터 수신 실패:", e);
      showToast("데이터를 수신하지 못했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSafetyData();
  }, [fetchSafetyData]);

  // 원격 사이렌 경고 작동
  const handleTriggerSiren = async (logId: string) => {
    try {
      const res = await apiFetch("/api/production/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger_siren",
          logId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCctvs(data.cctvs || []);
        setDangerLogs(data.dangerLogs || []);
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`사이렌 작동 실패: ${e.message}`, "error");
    }
  };

  // 특정 구역 비상 정지 작동
  const handleEmergencyStop = async (zoneId: string) => {
    try {
      const res = await apiFetch("/api/production/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "emergency_stop",
          zoneId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCctvs(data.cctvs || []);
        setDangerLogs(data.dangerLogs || []);
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`비상 공정 정지 실패: ${e.message}`, "error");
    }
  };

  // 실시간 비상 상태(CRITICAL 등급 미조치 로그 발생 여부) 판정
  const activeDanger = dangerLogs.find(l => l.status === "DETECTED" && l.level === "CRITICAL");
  const isEmergency = !!activeDanger;

  return {
    isLoading,
    toast,
    cctvs,
    dangerLogs,
    activeDanger,
    isEmergency,
    handleTriggerSiren,
    handleEmergencyStop,
    fetchSafetyData,
  };
}
