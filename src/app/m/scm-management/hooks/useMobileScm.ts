import { apiFetch } from '@/lib/api';
import { useState, useEffect, useCallback } from "react";
import { ScmShipment, ScmSupplier } from "../../../scm-management/types";

export function useMobileScm() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [shipments, setShipments] = useState<ScmShipment[]>([]);
  const [suppliers, setSuppliers] = useState<ScmSupplier[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 1. SCM 정보 조회 (GET)
  const fetchScmData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/production/scm");
      const data = await res.json();
      if (data.success) {
        setShipments(data.shipments);
        setSuppliers(data.suppliers);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("모바일 SCM 정보 로딩 실패:", e);
      showToast("공급망 리스크 관제 데이터를 수신하는 데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchScmData();
  }, [fetchScmData]);

  // 2. 모바일 운송 상태 단계별 강제 업데이트 (POST)
  const handleUpdateTracking = async (shipmentId: string, status: ScmShipment["status"]) => {
    try {
      const res = await apiFetch("/api/production/scm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_tracking",
          shipmentId,
          status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShipments(data.shipments);
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`상태 업데이트 실패: ${e.message}`, "error");
    }
  };

  // 3. 독촉용 SMS 템플릿 생성
  const getUrgentSmsText = (shipment: ScmShipment) => {
    return `[이지데스크 SCM 독촉] 긴급 자재 조달 확인 요청\n- 화물코드: ${shipment.id}\n- 품목: ${shipment.item}\n- 현재상태: ${
      shipment.status === "SHIPPED"
        ? "선적 완료"
        : shipment.status === "CUSTOMS"
        ? "통관 진행 중"
        : shipment.status === "DOMESTIC"
        ? "국내 운송 중"
        : "입고 완료"
    }\n- AI 예측 지연율: ${shipment.delayProbability}%\n\n공장 생산 스케줄 차질 예방을 위해 조속한 납기 확보 및 이송 협조 부탁드립니다.`;
  };

  return {
    isLoading,
    toast,
    shipments,
    suppliers,
    handleUpdateTracking,
    getUrgentSmsText,
    fetchScmData,
  };
}
