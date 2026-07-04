import { apiFetch } from '@/lib/api';
import { useState, useEffect, useCallback } from "react";
import { PowerPoint, EquipmentEnergy, SavingRecommendation } from "../types";

export function useEnergyManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  const [powerPoints, setPowerPoints] = useState<PowerPoint[]>([]);
  const [equipments, setEquipments] = useState<EquipmentEnergy[]>([]);
  const [recommendations, setRecommendations] = useState<SavingRecommendation[]>([]);
  const [contractPower, setContractPower] = useState(100);
  const [currentPeak, setCurrentPeak] = useState(0);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 1. 기초 실시간 에너지 관제 데이터 로드 (GET)
  const fetchEnergyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/production/energy");
      const data = await res.json();
      if (data.success) {
        setPowerPoints(data.powerPoints);
        setEquipments(data.equipments);
        setRecommendations(data.recommendations);
        setContractPower(data.contractPower);
        setCurrentPeak(data.currentPeak);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("에너지 관제 데이터 로딩 실패:", e);
      showToast("에너지 관제 데이터를 수신하는 데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEnergyData();
  }, [fetchEnergyData]);

  // 2. 에너지 절감형 스케줄 추천 일정 적용 (POST)
  const handleApplySaving = async (recId: string) => {
    try {
      const res = await apiFetch("/api/production/energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_saving",
          recId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPowerPoints(data.powerPoints);
        setEquipments(data.equipments);
        setRecommendations(data.recommendations);
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`에너지 절감 적용 실패: ${e.message}`, "error");
    }
  };

  // 3. 설비 O&M 가동 상태 수동 토글 셧다운 (POST)
  const handleToggleShutdown = async (eqId: string) => {
    try {
      const res = await apiFetch("/api/production/energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_shutdown",
          eqId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPowerPoints(data.powerPoints);
        setEquipments(data.equipments);
        setRecommendations(data.recommendations);
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`설비 제어 실패: ${e.message}`, "error");
    }
  };

  return {
    isLoading,
    toast,
    powerPoints,
    equipments,
    recommendations,
    contractPower,
    currentPeak,
    handleApplySaving,
    handleToggleShutdown,
    fetchEnergyData,
  };
}
