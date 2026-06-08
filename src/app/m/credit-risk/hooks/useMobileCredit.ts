import { useState, useEffect, useCallback } from "react";
import { CreditRiskStats, CreditSummary } from "../../../credit-risk/types";

export function useMobileCredit() {
  const [stats, setStats] = useState<CreditRiskStats[]>([]);
  const [summary, setSummary] = useState<CreditSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // 모바일 데이터 로드
  const fetchMobileData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/production/credit");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setSummary(data.summary);
      } else {
        setError(data.error || "데이터 로드 실패");
      }
    } catch (err: any) {
      setError(err.message || "서버 통신 오류");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMobileData();
  }, [fetchMobileData]);

  // 전화 걸기 링크 생성
  const getDialLink = (phone: string) => {
    return `tel:${phone.replace(/[^0-9]/g, "")}`;
  };

  // 모바일 SMS 연동 링크 생성 (공정추심법 준수 표준 고지)
  const getSmsLink = (partner: CreditRiskStats) => {
    const message = `[수금 안내]
안녕하세요. 이지데스크입니다.
귀사(${partner.companyName})의 연체 미수금(₩${partner.overdueAmount.toLocaleString()}원, D+${partner.overdueDays}일)이 발생하였습니다.
안전한 거래 유지를 위해 아래 계좌로 신속한 입금 조치 부탁드립니다.
입금 계좌: ${partner.virtualAccount}`;
    
    return `sms:${partner.managerPhone}?body=${encodeURIComponent(message)}`;
  };

  return {
    isLoading,
    error,
    stats,
    summary,
    getDialLink,
    getSmsLink,
    refetch: fetchMobileData
  };
}
