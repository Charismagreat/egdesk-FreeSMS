"use client";

import { useState, useEffect } from "react";

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  attachment_url?: string;
  ai_analysis?: string;
  memo?: string;
  created_at: string;
}

export interface ExpenseSettings {
  monthly_budget: number;
  is_alert_enabled: number;
  alert_threshold_percent: number;
  alert_sms_template: string;
  alert_phone: string;
}

export interface ExpenseStats {
  currentMonth: string;
  currentMonthTotal: number;
  monthlyBudget: number;
  budgetConsumptionRate: number;
  categoryStats: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [settings, setSettings] = useState<ExpenseSettings>({
    monthly_budget: 3000000,
    is_alert_enabled: 1,
    alert_threshold_percent: 90,
    alert_sms_template: "",
    alert_phone: ""
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);

  // 필터 및 검색
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // ⚡ 다중 선택 상태 추가 (거래 관리 AI 연동 스펙)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 신규 등록 폼 (사장님의 지출결의서 실물 양식 필드 탑재)
  const [newExpense, setNewExpense] = useState({
    title: "",
    category: "소모품비",
    amount: "",
    expense_date: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10),
    payment_method: "법인카드",
    memo: "",
    attachment_url: "",
    ai_analysis: "",
    payee: "", // ✍️ 영수자 (최창숙 인)
    requisition_date: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10), // ✍️ 발의 일자
    approval_date: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10), // ✍️ 결재 일자
  });

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/expenses");
      const json = await res.json();
      if (json.success) {
        setExpenses(json.expenses);
        setStats(json.stats);
        if (json.settings) {
          setSettings(json.settings);
        }
      }
    } catch (e) {
      console.error("지출 내역 로드 오류:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // 검색/필터 변경 시 페이지 및 선택 상태 초기화
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, activeCategoryFilter]);

  // 설정 저장
  const handleSaveSettings = async (updatedSettings: ExpenseSettings) => {
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/expenses/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings)
      });
      const json = await res.json();
      if (json.success) {
        setSettings(updatedSettings);
        alert("예산 및 알림 설정이 안전하게 업데이트되었습니다.");
        fetchExpenses(); // 집계 갱신
      } else {
        alert("설정 저장 실패: " + json.error);
      }
    } catch (err) {
      alert("설정 저장 중 통신 에러가 발생했습니다.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 지출 등록
  const handleRegisterExpense = async () => {
    if (!newExpense.title || !newExpense.amount || !newExpense.expense_date || !newExpense.payment_method) {
      alert("필수 항목(적요, 금액, 지출일자, 처리사항)을 모두 입력해 주세요.");
      return;
    }

    setIsSubmittingExpense(true);
    try {
      // 실물 지출결의서 추가 메타 정보 (영수자, 발의/결재 일자)를 ai_analysis에 안전하게 백필 병합
      const payee = newExpense.payee || "";
      const requisition_date = newExpense.requisition_date || newExpense.expense_date;
      const approval_date = newExpense.approval_date || newExpense.expense_date;

      let parsedAiAnalysis = {};
      try {
        parsedAiAnalysis = JSON.parse(newExpense.ai_analysis || "{}");
      } catch (e) {
        parsedAiAnalysis = {};
      }

      const payload = {
        ...newExpense,
        ai_analysis: JSON.stringify({
          ...parsedAiAnalysis,
          payee,
          requisition_date,
          approval_date
        })
      };

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        alert("지출결의서 양식의 장부 내역이 정상적으로 등록되었습니다.");
        resetExpenseForm();
        fetchExpenses(); // 데이터 및 예산 추이 즉시 갱신
      } else {
        alert("지출 등록 실패: " + json.error);
      }
    } catch (err) {
      alert("지출 등록 요청 중 통신 에러가 발생했습니다.");
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // 지출 삭제
  const handleDeleteExpense = async (id: string) => {
    if (!confirm("선택하신 지출 내역을 장부에서 영구적으로 제외(삭제)하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        const newSet = new Set(selectedIds);
        newSet.delete(id);
        setSelectedIds(newSet);
        fetchExpenses();
      } else {
        alert("지출 내역 삭제 실패: " + json.error);
      }
    } catch (err) {
      alert("지출 삭제 요청 중 통신 에러가 발생했습니다.");
    }
  };

  // ⚡ 다중 선택 관리 함수 마운트 (거래 관리 AI 매핑)
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredExpenses.map(exp => exp.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // ⚡ 일괄 선택 삭제 핸들러 신설
  const handleDeleteSelectedExpenses = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택하신 ${selectedIds.size}건의 지출 내역을 장부에서 일괄 삭제하시겠습니까?`)) return;

    try {
      const idsArray = Array.from(selectedIds).join(",");
      const res = await fetch(`/api/expenses?ids=${idsArray}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        alert("선택한 지출 내역이 성공적으로 일괄 삭제되었습니다.");
        setSelectedIds(new Set());
        fetchExpenses();
      } else {
        alert("일괄 삭제 실패: " + json.error);
      }
    } catch (err) {
      alert("일괄 삭제 처리 중 네트워크 통신 오류가 발생했습니다.");
    }
  };

  // 영수증 이미지/PDF 파일 업로드 & OCR API 연동
  const handleFileUpload = (file: File) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("지원하지 않는 파일 형식입니다. 영수증 이미지(png, jpg, webp) 또는 전자영수증 PDF 파일을 올려주세요.");
      return;
    }

    setIsAnalyzingReceipt(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      if (!base64) {
        setIsAnalyzingReceipt(false);
        return;
      }

      try {
        const res = await fetch("/api/expenses/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            filename: file.name,
            mimeType: file.type
          })
        });
        const json = await res.json();
        
        if (json.success) {
          // AI OCR 분석 결과 폼 자동 채우기
          setNewExpense({
            title: json.title || "",
            category: json.category || "소모품비",
            amount: String(json.amount) || "",
            expense_date: json.expense_date || new Date().toISOString().slice(0, 10),
            payment_method: json.payment_method || "법인카드",
            memo: json.memo || "",
            attachment_url: base64.slice(0, 100), // 프론트 데모용으로 축약 저장
            ai_analysis: JSON.stringify({ ocrParsed: true, filename: file.name, method: json.method }),
            payee: json.payee || "", // AI가 영수자 인식할 경우 자동 맵핑
            requisition_date: json.expense_date || new Date().toISOString().slice(0, 10),
            approval_date: json.expense_date || new Date().toISOString().slice(0, 10)
          });
          
          alert("✨ AI 영수증 자율 스캔 및 분석이 완료되었습니다! 검수 후 [지출 등록하기]를 눌러 장부에 적재하세요.");
        } else {
          alert("AI 영수증 분석 오류: " + json.error);
        }
      } catch (err) {
        alert("AI OCR 연동 중 네트워크 오류가 발생했습니다.");
      } finally {
        setIsAnalyzingReceipt(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetExpenseForm = () => {
    setNewExpense({
      title: "",
      category: "소모품비",
      amount: "",
      expense_date: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10),
      payment_method: "법인카드",
      memo: "",
      attachment_url: "",
      ai_analysis: "",
      payee: "",
      requisition_date: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10),
      approval_date: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });
  };

  // 검색 및 필터링 적용 목록
  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = activeCategoryFilter === "ALL" || exp.category === activeCategoryFilter;
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = exp.title.toLowerCase().includes(lowerQuery) || 
      (exp.memo && exp.memo.toLowerCase().includes(lowerQuery));
    return matchesCategory && matchesSearch;
  });

  // 장부 페이지네이션 연산
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  return {
    expenses,
    stats,
    settings,
    isLoading,
    isSavingSettings,
    isSubmittingExpense,
    isAnalyzingReceipt,
    activeCategoryFilter,
    setActiveCategoryFilter,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    newExpense,
    setNewExpense,
    fetchExpenses,
    handleSaveSettings,
    handleRegisterExpense,
    handleDeleteExpense,
    handleFileUpload,
    resetExpenseForm,
    filteredExpenses,
    totalPages,
    startIndex,
    endIndex,
    paginatedExpenses,
    selectedIds,
    setSelectedIds,
    toggleSelectAll,
    toggleSelect,
    handleDeleteSelectedExpenses
  };
}
