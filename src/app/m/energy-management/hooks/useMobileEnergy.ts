import { useState, useEffect, useCallback } from "react";
import { PowerPoint, EquipmentEnergy } from "../../../energy-management/types";

export function useMobileEnergy() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  const [powerPoints, setPowerPoints] = useState<PowerPoint[]>([]);
  const [equipments, setEquipments] = useState<EquipmentEnergy[]>([]);
  const [contractPower, setContractPower] = useState(100);
  const [currentPeak, setCurrentPeak] = useState(0);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 모바일 데이터 로드
  const fetchEnergyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/production/energy");
      const data = await res.json();
      if (data.success) {
        setPowerPoints(data.powerPoints || []);
        setEquipments(data.equipments || []);
        setContractPower(data.contractPower);
        setCurrentPeak(data.currentPeak);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("모바일 에너지 정보 로드 실패:", e);
      showToast("데이터를 수신하지 못했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEnergyData();
  }, [fetchEnergyData]);

  // 설비 원격 셧다운 상태 토글 제어
  const handleToggleShutdown = async (eqId: string) => {
    try {
      const res = await fetch("/api/production/energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_shutdown",
          eqId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPowerPoints(data.powerPoints || []);
        setEquipments(data.equipments || []);
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`설비 원격 제어 실패: ${e.message}`, "error");
    }
  };

  // 피크 부하 위험률 연산
  // 예측 데이터(forecast) 중 최대치가 계약 전력 대비 얼마인지 계산
  const forecasts = powerPoints.map(p => p.forecast);
  const maxForecast = forecasts.length > 0 ? Math.max(...forecasts) : 82;
  const loadPercentage = Math.round((maxForecast / contractPower) * 100);
  const isPeakRisk = loadPercentage >= 90;

  return {
    isLoading,
    toast,
    powerPoints,
    equipments,
    contractPower,
    currentPeak,
    loadPercentage,
    isPeakRisk,
    maxForecast,
    handleToggleShutdown,
    fetchEnergyData,
  };
}
