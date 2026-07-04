import { apiFetch } from '@/lib/api';
import { useState, useEffect, useCallback } from "react";
import { CctvInfo, DangerLog, HotspotInfo } from "../types";

export function useSafetyDetection() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  const [cctvs, setCctvs] = useState<CctvInfo[]>([]);
  const [dangerLogs, setDangerLogs] = useState<DangerLog[]>([]);
  const [hotspots, setHotspots] = useState<HotspotInfo[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 1. 기초 위험 감지 데이터 로드 (GET)
  const fetchSafetyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/production/safety");
      const data = await res.json();
      if (data.success) {
        setCctvs(data.cctvs);
        setDangerLogs(data.dangerLogs);
        setHotspots(data.hotspots);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("위험 감지 데이터 로딩 실패:", e);
      showToast("관제 데이터를 수신하는 데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSafetyData();
  }, [fetchSafetyData]);

  // 2. 현장 경고 사이렌 방송 송출 (POST)
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
        showToast(data.message, "success");
        // 상태 갱신을 위해 데이터 재로드
        await fetchSafetyData();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`사이렌 가동 실패: ${e.message}`, "error");
    }
  };

  // 3. 비상 공정 셧다운 정지 (POST)
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
        showToast(data.message, "success");
        // 상태 갱신을 위해 데이터 재로드
        await fetchSafetyData();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`비상 정지 실패: ${e.message}`, "error");
    }
  };

  return {
    isLoading,
    toast,
    cctvs,
    dangerLogs,
    hotspots,
    handleTriggerSiren,
    handleEmergencyStop,
    fetchSafetyData,
  };
}
