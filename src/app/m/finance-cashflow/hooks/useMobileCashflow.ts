import { useState, useEffect, useCallback } from "react";
import { ForecastTransaction } from "../../../finance-cashflow/types";

export function useMobileCashflow() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  // 현금 잔고 및 거래처 이력
  const [currentBalance, setCurrentBalance] = useState(0);
  const [forecastList, setForecastList] = useState<ForecastTransaction[]>([]);
  const [overdueList, setOverdueList] = useState<ForecastTransaction[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 모바일 전용 데이터 조회
  const fetchMobileData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/finance/cashflow");
      const data = await res.json();
      if (data.success) {
        setCurrentBalance(data.currentBalance);
        setForecastList(data.forecastList);
        // 연체된 수금 건만 별도 필터링
        setOverdueList(data.forecastList.filter((item: ForecastTransaction) => item.isOverdue && item.type === "IN"));
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast("모바일 데이터를 가져오는 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMobileData();
  }, [fetchMobileData]);

  // 미수 거래처로 독촉 SMS 발송 (FreeSMS 연동)
  const handleSendRemindSms = async (item: ForecastTransaction) => {
    const mobileLink = `${window.location.origin}/m/estimate-request`;
    const smsMessage = `[이지데스크] ${item.partnerName} 담당자님 안녕하십니까. 거래 미수금 ${item.amount.toLocaleString()}원의 정산 수금일이 경과되어 확인 연락드렸습니다. 아래 링크에서 상세 명세 확인 협조를 부탁드립니다. ${mobileLink}`;

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: item.contact,
          message: smsMessage,
          sender: "02-1588-0000"
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`📬 ${item.partnerName}에 미수금 독촉 문자를 무료 발송했습니다.`, "success");
        // 리스트 즉시 업데이트를 위해 재조회
        fetchMobileData();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`독촉 발송 실패: ${e.message}`, "error");
    }
  };

  return {
    isLoading,
    toast,
    currentBalance,
    forecastList,
    overdueList,
    handleSendRemindSms,
    fetchMobileData,
  };
}
