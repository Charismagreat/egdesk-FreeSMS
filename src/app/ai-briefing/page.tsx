"use client";

import React from "react";
import { 
  Sparkles, RefreshCw, BarChart, FileText, ArrowUp, ArrowDown, 
  Edit, Check, X, Download, Share2, ShieldAlert, Activity, 
  ExternalLink, Calendar, Database, Eye, EyeOff, Play, Info, Trash2, Clock, Link,
  Maximize2, Minimize2, MoreVertical
} from "lucide-react";
import DBChartRenderer from "@/components/DBChartRenderer";

export default function AIBriefingDashboardPage() {
  const [userRole, setUserRole] = React.useState<string>("SUB_OPERATOR");
  const [reports, setReports] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [updatingReportId, setUpdatingReportId] = React.useState<string | null>(null);
  const [cardSpans, setCardSpans] = React.useState<Record<string, 1 | 2>>({});
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  
  const handleToggleCardSpan = (shareId: string) => {
    setCardSpans(prev => ({
      ...prev,
      [shareId]: prev[shareId] === 2 ? 1 : 2
    }));
  };
  
  React.useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);
  
  // 편집 중인 리포트의 타이틀 상태
  const [editingReportId, setEditingReportId] = React.useState<string | null>(null);
  const [tempTitle, setTempTitle] = React.useState<string>("");

  // 토스트 상태
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' | 'warn' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warn' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // 🔑 1. 최고관리자 권한 조회
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

  // 📊 2. 수집된 AI 브리핑 리포트 목록 로드 (공개 관리국의 모든 공유 대시보드 로드)
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

  React.useEffect(() => {
    fetchUserRole();
    fetchReports();
  }, []);

  // 📝 3. 인라인 제목 수정 처리 (UPDATE_INFO)
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

  // 🌐 4. 공유 대시보드 게시 철회 (데이터베이스 행 물리 삭제)
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

  // ↕️ 5. 순서 정렬 조율 (sort_order 변경 및 일괄 API PATCH)
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

  // 🔄 6. 개별 실시간 최신 리프레시 업데이트
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

  // 💾 7. 차트 고해상도 PNG 파일 다운로드 헬퍼
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

  // 💾 8. 데이터 CSV 다운로드
  const handleDownloadCsv = (rows: any[], title: string) => {
    if (!rows || rows.length === 0) {
      showToast("내보낼 차트 데이터가 존재하지 않습니다.", "warn");
      return;
    }

    try {
      const headers = Object.keys(rows[0]).join(",");
      const csvContent = rows.map(row => {
        return Object.values(row).map(val => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(",");
      });

      const fullCsv = "\uFEFF" + [headers, ...csvContent].join("\n"); // BOM 주입
      const blob = new Blob([fullCsv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${title.replace(/\s+/g, "_")}_비식별데이터.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("✓ 차트 연동 원본 데이터가 CSV 파일로 다운로드되었습니다.", "success");
    } catch (e) {
      showToast("CSV 생성 실패", "error");
    }
  };

  // 🌐 9. 외부 웹 게시 및 주기 공유 제어
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

  // ✏️ 10. 원본 쿼리 수정 (MY DB Deep Link 연동 화면 이동)
  const handleGoToEditQuery = (sql: string, tableName: string) => {
    if (!sql) return;
    
    // SQL 구문과 테이블명을 쿼리 스트링에 패키징하여 MY DB 라우트로 이동
    const editUrl = `/my-db?action=edit&edit_sql=${encodeURIComponent(sql)}&target_table=${encodeURIComponent(tableName || "")}`;
    showToast("✏️ 원래 질의를 복원하여 [MY DB] SQL 플레이그라운드로 고속 이동합니다...", "success");
    
    setTimeout(() => {
      window.location.href = editUrl;
    }, 1000);
  };

  // 최고관리자 등급 권한 차단
  const isSuperAdmin = userRole.toUpperCase() === "SUPER_ADMIN";

  if (!isLoading && !isSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4 select-none">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm animate-bounce">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-base font-black text-rose-700">대시보드 권한 격리망 작동</h2>
          <p className="text-xs text-slate-450 leading-relaxed font-bold">
            본 'AI 브리핑' 관제 플랫폼은 기밀 비즈니스 지표가 포함되어 있어, 오직 **최고관리자 (SUPER_ADMIN)** 등급 계정으로만 접근 및 제어가 허용됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 bg-slate-50/30 p-2 rounded-3xl min-w-0">
      
      {/* 🛎️ 알림 토스트 컴포넌트 */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[120] p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
          toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
          'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <Sparkles className="w-5 h-5 text-indigo-550 shrink-0" />
          <span className="text-xs font-black">{toast.message}</span>
        </div>
      )}

      {/* 🚀 상단 타이틀 섹션 (좌우 패딩 px-4 sm:px-6 추가로 그리드 라인 정합 맞춤) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 px-4 sm:px-6 select-none">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center tracking-tight">
            <Sparkles className="w-8 h-8 mr-3 text-indigo-650 animate-pulse shrink-0" />
            AI 브리핑
          </h1>
          <p className="text-xs text-slate-400 font-semibold pl-11 leading-tight">최고관리자 데이터 통찰 BI 종합 관제 대시보드</p>
        </div>
        
        <button
          onClick={fetchReports}
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-xs font-black shadow-sm border border-indigo-700/20 cursor-pointer transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto hover:bg-indigo-700"
          style={{ backgroundColor: '#4f46e5', color: '#ffffff' }} // 명시적 인라인 고정으로 100% 완벽한 시인성 확보 🎨
          title="수집된 보고서 목록 최신 동기화"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-white ${isLoading ? 'animate-spin' : ''}`} />
          새로 고침
        </button>
      </div>

      {isLoading ? (
        <div className="py-28 text-center flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-indigo-650 animate-spin" />
          <p className="font-extrabold text-slate-500 text-sm">최고관리자 지능형 관제 데이터 로딩 중...</p>
        </div>
      ) : reports.length === 0 ? (
        // 웰컴 가이드 (Empty State)
        <div className="p-16 bg-white border border-slate-100 rounded-3xl text-center space-y-5 max-w-xl mx-auto shadow-sm select-none animate-zoom-in">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto">
            <Database className="w-6 h-6 text-indigo-650" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-black text-slate-850">AI 브리핑 종합 대시보드에 보고서를 채워주세요</h3>
            <p className="text-xs text-slate-450 leading-relaxed font-bold">
              현재 최고관리자님께서 핀 고정 수집해두신 AI 보고서가 없습니다.<br />
              **[MY DB]** SQL 플레이그라운드 콘솔에서 데이터 분석 쿼리를 돌린 뒤, 생성되는 통합 보고서 상단의 **`📌 핀 고정`** 단추를 누르시면 이 공간이 격조 높은 지능형 기업 보고서들로 화사하게 채워집니다!
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/my-db"}
            className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-black border-none shadow-3xs cursor-pointer active:scale-95 transition-all"
          >
            🚀 MY DB 분석 실행하러 가기
          </button>
        </div>
      ) : (
        // 웅장한 종합 BI 보고서 목록 렌더링
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full px-4 sm:px-6">
          {reports.map((board, index) => {
            // 차트 스펙 디코딩
            let specObj: any = null;
            let sampleRows: any[] = [];
            try {
              specObj = typeof board.chart_spec_json === 'string'
                ? JSON.parse(board.chart_spec_json)
                : board.chart_spec_json;
              
              if (specObj && specObj.sampleRows) {
                sampleRows = specObj.sampleRows;
              }
            } catch (e) {
              console.error("차트 스펙 디해독 실패:", e);
            }

            const isEditing = editingReportId === board.share_id;
            const isUpdating = updatingReportId === board.share_id;

            return (
              <div 
                key={board.share_id}
                className={`bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden transition-all duration-200 animate-fade-in hover:shadow-md relative ${
                  cardSpans[board.share_id] === 2 
                    ? 'xl:col-span-1' 
                    : 'xl:col-span-2'
                }`}
              >
                
                {/* 1. 리포트 헤더 컨트롤러막대 */}
                <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  
                  {/* 좌측: 순서 버튼, 타이틀/인라인 편집기, 최종갱신일시 */}
                  <div className="flex flex-wrap items-center gap-3.5 min-w-0 flex-1">
                    
                    <div className="flex items-center gap-3">
                      {/* 순서 이동 물리 컨트롤 단추 */}
                      <div className="flex flex-col gap-1.5 shrink-0 select-none">
                        <button
                          onClick={() => handleMoveOrder(index, 'UP')}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded cursor-pointer border-none bg-transparent"
                          title="이 보고서를 한 칸 위로 올림"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(index, 'DOWN')}
                          disabled={index === reports.length - 1}
                          className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded cursor-pointer border-none bg-transparent"
                          title="이 보고서를 한 칸 아래로 내림"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(board.share_id)}
                            className="text-sm font-bold bg-white border border-indigo-300 rounded-xl px-3 py-1.5 text-slate-800 outline-none w-full max-w-sm focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="보고서 타이틀 입력..."
                          />
                          <button
                            onClick={() => handleSaveTitle(board.share_id)}
                            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border-none cursor-pointer flex items-center justify-center shrink-0 shadow-3xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingReportId(null)}
                            className="p-2 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-pointer flex items-center justify-center shrink-0 shadow-3xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h2 className="text-sm font-black text-slate-850 truncate flex items-center gap-1.5">
                          {board.custom_title || board.title}
                          <button
                            onClick={() => {
                              setTempTitle(board.custom_title || board.title);
                              setEditingReportId(board.share_id);
                            }}
                            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded cursor-pointer border-none bg-transparent"
                            title="제목 인라인 수정"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </h2>
                      )}
                    </div>

                    {/* 최종 갱신 일시 배지 */}
                    <span className="text-[10px] text-indigo-550 font-bold font-mono bg-indigo-50/50 px-2.5 py-1 rounded-lg select-none shrink-0">
                      최종 갱신: {(board.last_refreshed_at || board.created_at)?.slice(0, 16)}
                    </span>
 
                  </div>

                  {/* 우측: 9대 제어 아이콘 툴바 (2열인 경우 드롭다운 압축) */}
                  <div className="flex items-center shrink-0 select-none relative">
                    {cardSpans[board.share_id] === 2 ? (
                      // 🌟 2열 그리드인 경우: [...] MoreVertical 버튼 하나로 압축
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === board.share_id ? null : board.share_id);
                          }}
                          className="p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-650 cursor-pointer flex items-center justify-center"
                          title="더보기 메뉴"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* 플로팅 미니 제어 툴바 */}
                        {openMenuId === board.share_id && (
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="absolute right-0 top-10 bg-white/95 backdrop-blur-md border border-slate-150 rounded-2xl shadow-xl px-3 py-1.5 z-40 flex items-center gap-0.5 animate-fade-in min-w-[320px] justify-end"
                          >
                            {/* 1. 와이드 보기로 키우는 버튼 */}
                            <button
                              onClick={() => {
                                handleToggleCardSpan(board.share_id);
                                setOpenMenuId(null);
                              }}
                              className="p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer text-indigo-650"
                              title="와이드 보기로 확대 (1열 전체 채우기)"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>

                            {/* 2. 공유 활성 토글 */}
                            <button
                              onClick={() => handleToggleShareActive(board.share_id, board.is_active)}
                              className={`p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                                Number(board.is_active) === 1 ? "text-emerald-600" : "text-slate-400"
                              }`}
                              title={Number(board.is_active) === 1 ? "외부 공개 중 (클릭 시 비공개 잠금)" : "비공개 상태 (클릭 시 외부 공개 활성화)"}
                            >
                              {Number(board.is_active) === 1 ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                            </button>

                            {/* 3. 공유 링크 복사 */}
                            <button
                              onClick={() => {
                                if (Number(board.is_active) !== 1) return;
                                const url = `${window.location.origin}/public/share/${board.share_id}`;
                                navigator.clipboard.writeText(url);
                                showToast("🔗 퍼블릭 공유 URL이 클립보드에 복사되었습니다!", "success");
                              }}
                              disabled={Number(board.is_active) !== 1}
                              className={`p-2 bg-transparent rounded-xl transition-all active:scale-95 flex items-center justify-center ${
                                Number(board.is_active) === 1
                                  ? "text-indigo-500 hover:bg-slate-100 cursor-pointer"
                                  : "text-slate-350 cursor-not-allowed"
                              }`}
                              title={Number(board.is_active) === 1 ? "퍼블릭 공유 링크 클립보드 복사" : "공개 활성화 시 링크 복사 가능"}
                            >
                              <Link className="w-3.5 h-3.5 shrink-0" />
                            </button>

                            {/* 4. 자동 갱신 주기 순환 토글 */}
                            <button
                              onClick={() => handleCycleInterval(board.share_id, board.refresh_interval)}
                              className={`p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                                board.refresh_interval === "HOURLY" ? "text-amber-500" : 
                                board.refresh_interval === "DAILY" ? "text-blue-500" : 
                                board.refresh_interval === "WEEKLY" ? "text-purple-500" : "text-slate-400"
                              }`}
                              title={`자동 갱신 주기 변경 (현재: ${
                                board.refresh_interval === "NONE" || !board.refresh_interval ? "자동갱신 없음" : 
                                board.refresh_interval === "HOURLY" ? "매시간 자동갱신" : 
                                board.refresh_interval === "DAILY" ? "매일 자동갱신" : "매주 자동갱신"
                              } / 클릭 시 순환 전환)`}
                            >
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                            </button>

                            <div className="w-px h-4 bg-slate-200 mx-1" />

                            {/* 5. CSV 다운 */}
                            <button
                              onClick={() => handleDownloadCsv(sampleRows, board.custom_title || board.title)}
                              disabled={sampleRows.length === 0}
                              className="p-2 bg-transparent hover:bg-slate-100 text-emerald-600 rounded-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                              title="원본 데이터 CSV 다운로드"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                            </button>

                            {/* 6. 차트 이미지 저장 (PNG) */}
                            <button
                              onClick={() => handleDownloadPng(board.share_id, board.custom_title || board.title)}
                              className="p-2 bg-transparent hover:bg-slate-100 text-indigo-500 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                              title="반응형 차트 이미지 다운로드 (PNG)"
                            >
                              <Download className="w-3.5 h-3.5 shrink-0" />
                            </button>

                            <div className="w-px h-4 bg-slate-200 mx-1" />

                            {/* 7. 실시간 갱신 */}
                            <button
                              onClick={() => handleRefreshReport(board.share_id)}
                              disabled={isUpdating}
                              className="p-2 bg-transparent hover:bg-slate-100 text-slate-500 rounded-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                              title="실시간 갱신 (SQL 데이터 재조회 및 AI 브리핑 재스캔)"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin text-indigo-650" : "text-slate-500"}`} />
                            </button>

                            {/* 8. 원본 수정 */}
                            <button
                              onClick={() => handleGoToEditQuery(board.sql_query, board.table_name)}
                              className="p-2 bg-transparent hover:bg-slate-100 text-indigo-550 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                              title="원본 SQL 플레이그라운드 이동하여 쿼리 정밀 편집"
                            >
                              <Database className="w-3.5 h-3.5 text-indigo-555" />
                            </button>

                            {/* 9. 게시 철회 */}
                            <button
                              onClick={() => handleDeleteReport(board.share_id)}
                              className="p-2 bg-transparent hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                              title="이 대시보드 게시 철회 및 영구 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // 🌟 1열 와이드인 경우: 기존처럼 평면적인 툴바 바로 노출
                      <>
                        {/* ↕️ 개별 와이드/콤팩트 크기 조율 */}
                        <button
                          onClick={() => handleToggleCardSpan(board.share_id)}
                          className="p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600"
                          title="콤팩트 보기로 축소 (2열 바둑판 배치)"
                        >
                          <Minimize2 className="w-3.5 h-3.5" />
                        </button>

                        {/* 👁️ 공유 활성 토글 */}
                        <button
                          onClick={() => handleToggleShareActive(board.share_id, board.is_active)}
                          className={`p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                            Number(board.is_active) === 1 ? "text-emerald-600" : "text-slate-400"
                          }`}
                          title={Number(board.is_active) === 1 ? "외부 공개 중 (클릭 시 비공개 잠금)" : "비공개 상태 (클릭 시 외부 공개 활성화)"}
                        >
                          {Number(board.is_active) === 1 ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                        </button>

                        {/* 🔗 공유 링크 복사 */}
                        <button
                          onClick={() => {
                            if (Number(board.is_active) !== 1) return;
                            const url = `${window.location.origin}/public/share/${board.share_id}`;
                            navigator.clipboard.writeText(url);
                            showToast("🔗 퍼블릭 공유 URL이 클립보드에 복사되었습니다!", "success");
                          }}
                          disabled={Number(board.is_active) !== 1}
                          className={`p-2 bg-transparent rounded-xl transition-all active:scale-95 flex items-center justify-center ${
                            Number(board.is_active) === 1
                              ? "text-indigo-500 hover:bg-slate-100 cursor-pointer"
                              : "text-slate-350 cursor-not-allowed"
                          }`}
                          title={Number(board.is_active) === 1 ? "퍼블릭 공유 링크 클립보드 복사" : "공개 활성화 시 링크 복사 가능"}
                        >
                          <Link className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        {/* ⏰ 자동 갱신 주기 순환 토글 */}
                        <button
                          onClick={() => handleCycleInterval(board.share_id, board.refresh_interval)}
                          className={`p-2 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                            board.refresh_interval === "HOURLY" ? "text-amber-500" : 
                            board.refresh_interval === "DAILY" ? "text-blue-500" : 
                            board.refresh_interval === "WEEKLY" ? "text-purple-500" : "text-slate-400"
                          }`}
                          title={`자동 갱신 주기 변경 (현재: ${
                            board.refresh_interval === "NONE" || !board.refresh_interval ? "자동갱신 없음" : 
                            board.refresh_interval === "HOURLY" ? "매시간 자동갱신" : 
                            board.refresh_interval === "DAILY" ? "매일 자동갱신" : "매주 자동갱신"
                          } / 클릭 시 순환 전환)`}
                        >
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        <div className="w-px h-4 bg-slate-200 mx-1.5" />

                        {/* 5. CSV 다운 */}
                        <button
                          onClick={() => handleDownloadCsv(sampleRows, board.custom_title || board.title)}
                          disabled={sampleRows.length === 0}
                          className="p-2 bg-transparent hover:bg-slate-100 text-emerald-600 rounded-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                          title="원본 데이터 CSV 다운로드"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        {/* 6. 차트 이미지 저장 (PNG) */}
                        <button
                          onClick={() => handleDownloadPng(board.share_id, board.custom_title || board.title)}
                          className="p-2 bg-transparent hover:bg-slate-100 text-indigo-500 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                          title="반응형 차트 이미지 다운로드 (PNG)"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        <div className="w-px h-4 bg-slate-200 mx-1.5" />

                        {/* 7. 실시간 갱신 */}
                        <button
                          onClick={() => handleRefreshReport(board.share_id)}
                          disabled={isUpdating}
                          className="p-2 bg-transparent hover:bg-slate-100 text-slate-500 rounded-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                          title="실시간 갱신 (SQL 데이터 재조회 및 AI 브리핑 재스캔)"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin text-indigo-600" : "text-slate-500"}`} />
                        </button>

                        {/* 8. 원본 수정 */}
                        <button
                          onClick={() => handleGoToEditQuery(board.sql_query, board.table_name)}
                          className="p-2 bg-transparent hover:bg-slate-100 text-indigo-600 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                          title="원본 SQL 플레이그라운드 이동하여 쿼리 정밀 편집"
                        >
                          <Database className="w-3.5 h-3.5 text-indigo-600" />
                        </button>

                        {/* 9. 게시 철회 */}
                        <button
                          onClick={() => handleDeleteReport(board.share_id)}
                          className="p-2 bg-transparent hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                          title="이 대시보드 게시 철회 및 영구 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                </div>

                {/* 2. 리포트 본문 일체형 영역 */}
                <div className="p-6 space-y-6">
                  {isUpdating ? (
                    <div className="p-16 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse flex flex-col items-center justify-center text-center space-y-4 select-none">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-black text-slate-700">AI 지능형 엔진이 데이터 실시간 최신 분석 및 브리핑을 융합 집필 중입니다...</p>
                        <p className="text-[10px] text-slate-400 font-bold">LME/SQLite 가격 마스킹 및 요점 해석 중 (약 2초 소요)</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 📊 1. 지능형 SVG 차트 렌더러 영역 */}
                      <div className="space-y-3">
                        
                        <div id={`chart-container-${board.share_id}`} className="w-full overflow-hidden">
                          {specObj ? (
                            <DBChartRenderer spec={specObj} rows={sampleRows} />
                          ) : (
                            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2 select-none">
                              <Activity className="w-6 h-6 text-slate-350 animate-pulse" />
                              <span className="text-[11px] font-bold">시각화 차트 스펙이 올바르지 않습니다.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 📝 2. AI 비즈니스 통찰 브리핑 요약 영역 */}
                      <div className="space-y-3">
                        
                        {board.briefing_markdown ? (
                          <div className="bg-emerald-50/30 border border-emerald-100/60 rounded-2xl p-5 shadow-3xs animate-fade-in">
                            <div className="text-xs md:text-sm font-semibold leading-relaxed text-slate-700 whitespace-pre-line font-sans">
                              {board.briefing_markdown}
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 bg-slate-50/40 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center text-center text-slate-400 select-none">
                            <Activity className="w-6 h-6 text-slate-350 mb-1.5 animate-pulse" />
                            <p className="text-xs font-bold">비즈니스 브리핑 리포트를 불러오지 못했습니다.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
