import { apiFetch } from '@/lib/api';
import { useState, useEffect, useCallback } from "react";
import { EmployeeLaborStat } from "../../../labor-management/types";

export function useMobileLabor() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [stats, setStats] = useState<EmployeeLaborStat[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 1. 노무 통계 데이터 조회 (GET)
  const fetchLaborData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/production/labor");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("모바일 노무 정보 수집 실패:", e);
      showToast("관제 데이터를 수신하는 데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLaborData();
  }, [fetchLaborData]);

  // 2. 근로시간 지연 시정 권고 SMS 템플릿 생성
  const getWarningSmsText = (emp: EmployeeLaborStat) => {
    return `[이지데스크 노무 관리] 근로 한도 위반 우려 시정 권고\n- 대상사원: ${emp.name} (${emp.id})\n- 소속부서: ${emp.department}\n- 금주 근로시간: ${emp.weeklyHours}시간 (연장 ${emp.overtimeHours}시간)\n- 현황단계: 주 52시간 한도 초과 위험 상태\n\n근로기준법 제53조 준수를 위해 즉각 추가 연장 근로를 중단하고, 잔여 업무는 타 근무자와 시프트 조정 혹은 대체 휴가를 가동해 주시길 권고합니다.`;
  };

  return {
    isLoading,
    toast,
    stats,
    getWarningSmsText,
    fetchLaborData,
  };
}
