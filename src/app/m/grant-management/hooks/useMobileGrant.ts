import { useState, useEffect, useCallback } from "react";
import { GrantAnnouncement } from "../../../grant-management/types";

export function useMobileGrant() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [announcements, setAnnouncements] = useState<GrantAnnouncement[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 1. 공고 정보 가져오기 (GET)
  const fetchGrantData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/production/grant");
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("모바일 지원금 로드 실패:", e);
      showToast("관제 데이터를 수신하는 데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchGrantData();
  }, [fetchGrantData]);

  // 2. 관심 공고 보관함 토글 (POST)
  const handleToggleBookmark = async (id: string) => {
    try {
      const res = await fetch("/api/production/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_bookmark",
          id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
        const ann = data.announcements.find((a: any) => a.id === id);
        showToast(
          ann?.isBookmarked
            ? "관심 공고 보관함에 추가되었습니다."
            : "관심 보관함에서 해제되었습니다.",
          "success"
        );
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`북마크 처리 실패: ${e.message}`, "error");
    }
  };

  // 3. 담당자/임직원용 SMS 전달 템플릿 생성
  const getShareSmsText = (ann: GrantAnnouncement) => {
    return `[이지데스크 지원금 알림] 자사 매칭 정부 지원 사업 안내\n- 공고명: ${ann.title}\n- 주관기관: ${ann.agency}\n- 지원규모: ${ann.budget}\n- AI 적합도: ${ann.matchScore}%\n- 신청마감일: ${ann.deadline}\n\n당사 프로필 맞춤형 분석 결과, 적합도가 매우 높아 알려드립니다. 세부 매칭 가이드를 확인하여 기한 내 신청을 검토해 주세요.`;
  };

  return {
    isLoading,
    toast,
    announcements,
    handleToggleBookmark,
    getShareSmsText,
    fetchGrantData,
  };
}
