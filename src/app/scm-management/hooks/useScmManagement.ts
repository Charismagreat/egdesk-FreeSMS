import { useState, useEffect, useCallback } from "react";
import { ScmShipment, ScmSupplier, ScmAlternative } from "../types";

export function useScmManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  const [shipments, setShipments] = useState<ScmShipment[]>([]);
  const [suppliers, setSuppliers] = useState<ScmSupplier[]>([]);
  const [alternatives, setAlternatives] = useState<Record<string, ScmAlternative[]>>({});

  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 1. 기초 SCM 정보 조회 (GET)
  const fetchScmData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/production/scm");
      const data = await res.json();
      if (data.success) {
        setShipments(data.shipments);
        setSuppliers(data.suppliers);
        setAlternatives(data.alternatives);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("SCM 정보 로딩 실패:", e);
      showToast("공급망 리스크 관제 데이터를 수신하는 데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchScmData();
  }, [fetchScmData]);

  // 2. 발주처 대체 우회 전환 적용 (POST)
  const handleSwitchSupplier = async (shipmentId: string, alternativeSupplierId: string) => {
    try {
      const res = await fetch("/api/production/scm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "switch_supplier",
          shipmentId,
          alternativeSupplierId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShipments(data.shipments);
        setSuppliers(data.suppliers);
        setAlternatives(data.alternatives);
        setIsModalOpen(false);
        setSelectedShipmentId(null);
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`발주처 전환 실패: ${e.message}`, "error");
    }
  };

  const setOpenModalForShipment = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    setIsModalOpen(true);
  };

  return {
    isLoading,
    toast,
    shipments,
    suppliers,
    alternatives,
    selectedShipmentId,
    isModalOpen,
    setIsModalOpen,
    handleSwitchSupplier,
    setOpenModalForShipment,
    fetchScmData,
  };
}
