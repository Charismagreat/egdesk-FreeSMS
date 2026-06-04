import { useState, useEffect } from "react";
import { Report, ToastState } from "../types";

export function useAIBriefing() {
  const [userRole, setUserRole] = useState<string>("SUB_OPERATOR");
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [cardSpans, setCardSpans] = useState<Record<string, 1 | 2>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // AI 분석 텍스트 숨김 리스트 상태
  const [hiddenBriefingIds, setHiddenBriefingIds] = useState<Record<string, boolean>>({});

  // 편집 중인 리포트의 타이틀 상태
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState<string>("");

  // 토스트 상태
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warn' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleToggleCardSpan = (shareId: string) => {
    setCardSpans(prev => ({
      ...prev,
      [shareId]: prev[shareId] === 2 ? 1 : 2
    }));
  };

  const handleToggleBriefingVisibility = (shareId: string) => {
    setHiddenBriefingIds(prev => {
      const updated = { ...prev, [shareId]: !prev[shareId] };
      localStorage.setItem('egdesk_hidden_briefing_ids', JSON.stringify(updated));
      return updated;
    });
  };

  // 최고관리자 권한 조회
  const fetchUserRole = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.role) {
        setUserRole(data.role);
      }
    } catch (e) {
      console.error("세션 조회 실패:", e);
    }
  };

  // 수집된 AI 브리핑 리포트 목록 로드
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/db/ai-visualize/share");
      const data = await res.json();
      if (data.success) {
        setReports(data.list || []);
      } else {
        showToast(data.error || "브리핑 보고서 목록을 로드하지 못했습니다.", "error");
      }
    } catch (e) {
      showToast("서버와 통신할 수 없습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 인라인 제목 수정 처리 (UPDATE_INFO)
  const handleSaveTitle = async (shareId: string) => {
    if (!tempTitle.trim()) {
      showToast("보고서 제목을 입력해 주세요.", "warn");
      return;
    }

    try {
      const res = await fetch("/api/db/ai-visualize/share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_INFO",
          shareId,
          customTitle: tempTitle.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("✓ 보고서 제목이 즉시 변경 및 자동 반영되었습니다.", "success");
        setEditingReportId(null);
        fetchReports();
      } else {
        showToast(data.error || "제목 변경 실패", "error");
      }
    } catch (e) {
      showToast("통신 에러가 발생했습니다.", "error");
    }
  };

  // 공유 대시보드 게시 철회 (데이터베이스 행 물리 삭제)
  const handleDeleteReport = async (shareId: string) => {
    if (!confirm("정말로 이 보고서의 외부 게시를 철회하고 대시보드에서 완전히 삭제하시겠습니까?\n(공유 링크가 영구 비활성화되며 복구할 수 없습니다.)")) {
      return;
    }

    try {
      const res = await fetch(`/api/db/ai-visualize/share?shareId=${shareId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        showToast("✓ 공유 보고서 게시가 정상적으로 철회 및 삭제되었습니다.", "success");
        fetchReports();
      } else {
        showToast(data.error || "게시 철회 실패", "error");
      }
    } catch (e) {
      showToast("통신 에러가 발생했습니다.", "error");
    }
  };

  // 순서 정렬 조율 (sort_order 변경 및 일괄 API PATCH)
  const handleMoveOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reports.length) return;

    const newReports = [...reports];
    const temp = newReports[index];
    newReports[index] = newReports[targetIndex];
    newReports[targetIndex] = temp;

    // sort_order 가중치 재계산 (0, 10, 20 ...)
    const ordersPayload = newReports.map((r, idx) => ({
      shareId: r.share_id,
      sortOrder: idx * 10
    }));

    // 즉석 로컬 화면 갱신
    setReports(newReports);

    try {
      const res = await fetch("/api/db/ai-visualize/share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REORDER",
          orders: ordersPayload
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("✓ 보고서들의 순서가 칼각 조율 및 저장되었습니다.", "success");
      } else {
        showToast(data.error || "순서 저장 실패", "error");
        fetchReports(); // 롤백
      }
    } catch (e) {
      showToast("통신 에러로 인해 정렬 갱신을 지연합니다.", "error");
      fetchReports(); // 롤백
    }
  };

  // 개별 실시간 최신 리프레시 업데이트
  const handleRefreshReport = async (shareId: string) => {
    setUpdatingReportId(shareId);
    showToast("⚡ 최신 SQL 데이터 재스캔 및 AI 비즈니스 통찰 재집필 중...", "success");
    
    try {
      // 강제 갱신 API 호출 (force=true 백도어 사용)
      const res = await fetch(`/api/db/ai-visualize/share/refresh?force=true&shareId=${shareId}`);
      const data = await res.json();
      if (data.success) {
        showToast("✓ 실시간 AI 분석 및 브리핑이 성공적으로 갱신되었습니다!", "success");
        fetchReports();
      } else {
        showToast(data.error || "실시간 분석 업데이트에 실패했습니다.", "error");
      }
    } catch (e) {
      showToast("서버 통신 장애로 업데이트할 수 없습니다.", "error");
    } finally {
      setUpdatingReportId(null);
    }
  };

  // 차트 고해상도 PNG 파일 다운로드 헬퍼
  const handleDownloadPng = (reportId: string, customTitle: string) => {
    try {
      // 해당 리포트 카드 내부의 SVG 요소 탐색
      const container = document.getElementById(`chart-container-${reportId}`);
      const svgElement = container?.querySelector("svg");
      if (!svgElement) {
        showToast("SVG 차트 요소를 발견하지 못했습니다.", "warn");
        return;
      }

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const DOMURL = window.URL || window.webkitURL || window;
      const blobURL = DOMURL.createObjectURL(svgBlob);
      
      const image = new window.Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = svgElement.clientWidth || 600;
        canvas.height = svgElement.clientHeight || 300;
        const context = canvas.getContext("2d");
        if (context) {
          context.fillStyle = "#ffffff"; // 흰색 배경 채우기
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          
          const pngURL = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngURL;
          downloadLink.download = `${customTitle.replace(/\s+/g, "_")}_시각화차트.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          DOMURL.revokeObjectURL(blobURL);
          showToast("✓ 시각화 차트가 고해상도 PNG 이미지로 저장되었습니다.", "success");
        }
      };
      image.src = blobURL;
    } catch (e) {
      showToast("이미지 변환 중 오류가 발생했습니다.", "error");
    }
  };

  // 데이터 Excel 다운로드
  const handleDownloadExcel = async (rows: any[], title: string) => {
    if (!rows || rows.length === 0) {
      showToast("내보낼 차트 데이터가 존재하지 않습니다.", "warn");
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const headers = Object.keys(rows[0]);
      const aoaData = [headers];

      rows.forEach(row => {
        const rowData = headers.map(key => {
          const val = row[key];
          if (val === null || val === undefined) return "";
          
          const valStr = String(val);
          const keyLower = key.toLowerCase();
          
          // 계좌번호, 카드번호, 승인번호, 전화번호 등 식별성 성격의 컬럼 또는 9자리 이상의 숫자로만 구성된 긴 문자열의 경우 지수 표현식 방지를 위해 접두사 `'` 추가
          const isIdentifierKey = keyLower.includes("number") || 
                                  keyLower.includes("card") || 
                                  keyLower.includes("account") || 
                                  keyLower.includes("phone") || 
                                  keyLower.includes("tel") || 
                                  keyLower.includes("appr") || 
                                  keyLower.includes("serial") ||
                                  keyLower.includes("id");

          if ((isIdentifierKey && /^\d+$/.test(valStr) && valStr.length > 5) || (/^\d+$/.test(valStr) && valStr.length >= 9)) {
            return `'${valStr}`;
          }
          return val;
        });
        aoaData.push(rowData);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ChartData');
      XLSX.writeFile(workbook, `${title.replace(/\s+/g, "_")}_비식별데이터_${new Date().toISOString().slice(0,10)}.xlsx`);

      showToast("✓ 차트 연동 원본 데이터가 엑셀 파일로 다운로드되었습니다.", "success");
    } catch (e: any) {
      showToast("엑셀 생성 실패: " + e.message, "error");
    }
  };

  // 외부 웹 게시 및 주기 공유 제어
  const handleToggleShareActive = async (shareId: string, currentStatus: number) => {
    try {
      const nextStatus = currentStatus === 1 ? 0 : 1;
      const res = await fetch("/api/db/ai-visualize/share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_INFO",
          shareId,
          isActive: nextStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(nextStatus === 1 ? "✓ 퍼블릭 공유 링크가 외부 공개 상태로 전환되었습니다!" : "✓ 공유 링크 접근이 안전하게 일시 차단되었습니다.", "success");
        fetchReports();
      } else {
        showToast(data.error || "공유 토글 실패", "error");
      }
    } catch (e) {
      showToast("통신 에러", "error");
    }
  };

  const handleChangeInterval = async (shareId: string, interval: string) => {
    try {
      const res = await fetch("/api/db/ai-visualize/share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_INFO",
          shareId,
          refreshInterval: interval
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ 자동 갱신 스케줄러가 [${interval === 'NONE' ? '사용 안함' : interval}] 주기로 재배치되었습니다.`, "success");
        fetchReports();
      } else {
        showToast(data.error || "주기 변경 실패", "error");
      }
    } catch (e) {
      showToast("통신 에러", "error");
    }
  };

  const handleCycleInterval = (shareId: string, currentInterval: string) => {
    const intervals = ['NONE', 'HOURLY', 'DAILY', 'WEEKLY'];
    const currentIndex = intervals.indexOf(currentInterval || 'NONE');
    const nextIndex = (currentIndex + 1) % intervals.length;
    const nextInterval = intervals[nextIndex];
    handleChangeInterval(shareId, nextInterval);
  };

  // 원본 쿼리 수정 (MY DB Deep Link 연동 화면 이동)
  const handleGoToEditQuery = (sql: string, tableName: string) => {
    if (!sql) return;
    
    // SQL 구문과 테이블명을 쿼리 스트링에 패키징하여 MY DB 라우트로 이동
    const editUrl = `/my-db?action=edit&edit_sql=${encodeURIComponent(sql)}&target_table=${encodeURIComponent(tableName || "")}`;
    showToast("✏️ 원래 질의를 복원하여 [MY DB] SQL 플레이그라운드로 고속 이동합니다...", "success");
    
    setTimeout(() => {
      window.location.href = editUrl;
    }, 1000);
  };

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener("click", closeMenu);

    // 로컬스토리지로부터 숨김 텍스트 브리핑 이력 로딩
    const saved = localStorage.getItem('egdesk_hidden_briefing_ids');
    if (saved) {
      try {
        setHiddenBriefingIds(JSON.parse(saved));
      } catch (e) {
        console.error('숨김 브리핑 데이터 파싱 실패:', e);
      }
    }

    fetchUserRole();
    fetchReports();

    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const isSuperAdmin = userRole.toUpperCase() === "SUPER_ADMIN";

  return {
    userRole,
    reports,
    setReports,
    isLoading,
    updatingReportId,
    cardSpans,
    openMenuId,
    setOpenMenuId,
    hiddenBriefingIds,
    editingReportId,
    setEditingReportId,
    tempTitle,
    setTempTitle,
    toast,
    showToast,
    handleToggleCardSpan,
    handleToggleBriefingVisibility,
    fetchReports,
    handleSaveTitle,
    handleDeleteReport,
    handleMoveOrder,
    handleRefreshReport,
    handleDownloadPng,
    handleDownloadExcel,
    handleToggleShareActive,
    handleCycleInterval,
    handleGoToEditQuery,
    isSuperAdmin
  };
}
