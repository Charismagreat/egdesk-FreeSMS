import { useState, useEffect, useCallback } from "react";
import { GrantAnnouncement, CompanyProfile, RndPlan } from "../types";

export function useGrantManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  const [announcements, setAnnouncements] = useState<GrantAnnouncement[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [rndPlan, setRndPlan] = useState<RndPlan | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 1. 수동 지원금 매칭 검색 수행 (POST)
  const handleSearchGrants = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/production/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search_grants" })
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
        setCompanyProfile(data.companyProfile);
        setHasSearched(true);
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("지원금 검색 실패:", e);
      showToast(`지원금 매칭 검색에 실패했습니다: ${e.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 1-1. 기초 데이터 조회 (초기 진입 시 빈 상태 세팅)
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // 2. 관심 공고 즐겨찾기 토글 (POST)
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
            ? "관심 공고 보관함에 등록되었습니다."
            : "관심 공고 보관함에서 해제되었습니다.",
          "success"
        );
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`즐겨찾기 토글 실패: ${e.message}`, "error");
    }
  };

  // 3. AI R&D 사업계획서 자동 빌딩 (POST)
  const handleGenerateRndPlan = async (id: string) => {
    setIsGenerating(true);
    setSelectedAnnId(id);
    try {
      const res = await fetch("/api/production/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_plan",
          id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRndPlan({
          announcementId: id,
          sections: data.plan,
        });
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`계획서 생성 실패: ${e.message}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. 작성 중인 사업계획서 텍스트 로컬 수정
  const handleUpdateSection = (sectionId: string, content: string) => {
    if (!rndPlan) return;
    setRndPlan({
      ...rndPlan,
      sections: {
        ...rndPlan.sections,
        [sectionId]: content,
      },
    });
  };

  // 5. 사업계획서 엑셀(CSV) 내보내기 다운로드
  const handleExportCsv = () => {
    if (!rndPlan) {
      showToast("내보낼 사업계획서 원고가 존재하지 않습니다.", "warn");
      return;
    }
    const targetAnn = announcements.find((a) => a.id === rndPlan.announcementId);
    if (!targetAnn) return;

    let csvContent = "\ufeff"; // 한글 깨짐 방지 BOM 추가
    csvContent += `과제명,${targetAnn.title}\n`;
    csvContent += `공고번호,${targetAnn.id}\n`;
    csvContent += `지원기관,${targetAnn.agency}\n\n`;
    csvContent += "장표 섹션,작성 내용\n";

    Object.entries(rndPlan.sections).forEach(([key, val]) => {
      const title =
        key === "necessity"
          ? "1. 연구개발의 필요성 및 시급성"
          : key === "differentiation"
          ? "2. 국내외 기술 트렌드 및 차별성"
          : key === "objectives"
          ? "3. 연구개발 최종 목표 및 상세 내용"
          : "4. 사업화 방안 및 향후 시장 진출 계획";
      // 줄바꿈 및 큰따옴표 이스케이프 처리
      const escapedVal = `"${val.replace(/"/g, '""')}"`;
      csvContent += `"${title}",${escapedVal}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RND_사업계획서_${targetAnn.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("사업계획서 원고가 CSV 엑셀 파일로 다운로드되었습니다.", "success");
  };

  return {
    isLoading,
    isGenerating,
    toast,
    announcements,
    companyProfile,
    selectedAnnId,
    rndPlan,
    hasSearched,
    handleSearchGrants,
    handleToggleBookmark,
    handleGenerateRndPlan,
    handleUpdateSection,
    handleExportCsv,
    setSelectedAnnId,
    setRndPlan,
  };
}
