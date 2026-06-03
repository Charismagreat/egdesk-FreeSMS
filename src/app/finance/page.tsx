"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  CreditCard,
  Receipt,
  RefreshCw,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  Edit
} from "lucide-react";

import { 
  getFormattedDate,
  getStartDateForBank,
  getStartDateForHometax,
  getCategoryHierarchy,
  getCategoryBadgeStyle,
  downloadPreviewExcel,
  downloadAccountsExcel,
  downloadCardsExcel,
  downloadHometaxInvoiceExcel,
  downloadHometaxCashExcel
} from "./utils";

import {
  Account,
  Transaction,
  CardTransaction,
  HometaxInvoice,
  HometaxCash,
  DbExpenseCategory,
  DbExpenseTag,
  SyncLog
} from "./types";

import UploadExcelModal from "./components/UploadExcelModal";
import UploadHometaxModal from "./components/UploadHometaxModal";
import UploadCardModal from "./components/UploadCardModal";
import ReceiptViewerModal from "./components/ReceiptViewerModal";
import RulePreviewPanel from "./components/RulePreviewPanel";const cardCompanyMap: Record<string, string> = {
  "신한카드": "shinhan-card",
  "KB국민카드": "kb-card",
  "NH농협카드": "nh-card",
  "BC카드": "bc-card",
  "hana카드": "hana-card",
  "하나카드": "hana-card"
};

export default function FinancePage() {
  // 메인 탭 상태: accounts (은행 계좌 & 거래), cards (신용카드), hometax (국세청 자료), sync (동기화 역사)
  const [activeTab, setActiveTab] = useState<"accounts" | "cards" | "hometax" | "sync">("accounts");
  
  // 엑셀 수동 업로드 모달 관련 상태
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // 홈택스 엑셀 수동 업로드 모달 관련 상태
  const [isHometaxModalOpen, setIsHometaxModalOpen] = useState(false);

  // 카드 엑셀 수동 업로드 모달 관련 상태
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // 🔑 최고관리자 권한 및 신용카드 거래내역 인라인 편집 상태 선언
  const [userRole, setUserRole] = useState<string>("SUB_OPERATOR");
  const [editingCardTxId, setEditingCardTxId] = useState<string | null>(null);
  const [editingBankTxId, setEditingBankTxId] = useState<string | null>(null);
  const [editingHometaxTxId, setEditingHometaxTxId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"category" | "memo" | null>(null);
  const [tempCategory, setTempCategory] = useState<string>("");
  const [tempMemo, setTempMemo] = useState<string>("");
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>("");
  const [rulesList, setRulesList] = useState<any[]>([]);
  const [newRuleText, setNewRuleText] = useState<string>("");
  const [isAddingRule, setIsAddingRule] = useState<boolean>(false);
  const [isUpdatingCardTx, setIsUpdatingCardTx] = useState<boolean>(false);
  const [isUpdatingBankTx, setIsUpdatingBankTx] = useState<boolean>(false);
  const [isUpdatingHometaxTx, setIsUpdatingHometaxTx] = useState<boolean>(false);
  const [dbTags, setDbTags] = useState<DbExpenseTag[]>([]);
  
  // ⚡ [경합/충돌 예방] 자연어 규칙 영향 건 실시간 미리보기 및 로딩 상태 변수
  const [previewList, setPreviewList] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // 국세청 서브 탭: invoice (세금계산서), exempt (계산서/면세), cash (현금영수증)
  const [hometaxSubTab, setHometaxSubTab] = useState<"invoice" | "exempt" | "cash">("invoice");

  // 데이터 로딩 상태들
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 로드된 실제 데이터들
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<any>({ totalBalance: 0, activeAccounts: 0 });
  
  // 통계 요약 데이터 추가 (금월, 전월, 전전월 및 금년 누적 통계)
  const [summaryData, setSummaryData] = useState<any>({
    months: ["", "", ""],
    cardSummary: [],
    hometaxSummary: {
      sales: { m0: 0, m1: 0, m2: 0, yTotal: 0 },
      purchase: { m0: 0, m1: 0, m2: 0, yTotal: 0 }
    }
  });

  const [transactionList, setTransactionList] = useState<Transaction[]>([]);
  const [cardTxList, setCardTxList] = useState<CardTransaction[]>([]);
  const [taxInvoiceList, setTaxInvoiceList] = useState<HometaxInvoice[]>([]);
  const [taxExemptList, setTaxExemptList] = useState<HometaxInvoice[]>([]);
  const [cashReceiptList, setCashReceiptList] = useState<HometaxCash[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncLog[]>([]);
  const [hometaxSync, setHometaxSync] = useState<any[]>([]);
  const [hometaxConnections, setHometaxConnections] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<DbExpenseCategory[]>([]);


  // 페이징 & 필터 상태
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [invoiceType, setInvoiceType] = useState<"all" | "sales" | "purchase">("all");
  const [selectedCardCompanyId, setSelectedCardCompanyId] = useState<string>("all");
  const [selectedCardNumber, setSelectedCardNumber] = useState<string>("all");
  const [selectedCashPurpose, setSelectedCashPurpose] = useState<string>("all");
  const [selectedBankId, setSelectedBankId] = useState<string>("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");

  // 카드 영수증 연동 및 뷰어 관련 상태
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptSelectedTxId, setReceiptSelectedTxId] = useState<string>("");
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);




  const [startDate, setStartDate] = useState(getStartDateForBank());
  const [endDate, setEndDate] = useState(getFormattedDate(new Date()));

  // 사용자가 수동으로 선택한 날짜 기록이 있는지 추적
  const [isDateManuallySet, setIsDateManuallySet] = useState(false);

  // 탭 전환 시 기획된 기본 조회 기간 스위칭 정책 적용
  useEffect(() => {
    if (!isDateManuallySet) {
      if (activeTab === "hometax") {
        setStartDate(getStartDateForHometax());
      } else {
        setStartDate(getStartDateForBank());
      }
      setEndDate(getFormattedDate(new Date()));
    }
  }, [activeTab, isDateManuallySet]);

  // 페이지 및 검색 텍스트 초기화 방지용 디바운싱 효과
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, hometaxSubTab, searchText, invoiceType, startDate, endDate, pageSize, selectedCardCompanyId, selectedCardNumber, selectedCashPurpose, selectedBankId, selectedAccountId]);

  // 🔑 자연어 규칙 목록 조회 API 연동
  const fetchRulesList = useCallback(async () => {
    try {
      const res = await fetch("/api/finance/rules");
      const data = await res.json();
      if (data.success) {
        setRulesList(data.rules || []);
      }
    } catch (e) {
      console.error("Rules fetch failed:", e);
    }
  }, []);

  useEffect(() => {
    fetchRulesList();
  }, [fetchRulesList]);

  // 🔑 자연어 규칙 등록 API 연동
  const handleAddRule = async (text: string, force: boolean = false) => {
    if (!text || !text.trim()) return;
    setIsAddingRule(true);
    try {
      const res = await fetch("/api/finance/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naturalText: text, force })
      });
      const data = await res.json();
      if (data.success) {
        if (data.conflict) {
          // ⚡ 충돌 경고 감지 시 Confirm 대화상자로 분기
          const confirmForce = confirm(data.error);
          if (confirmForce) {
            // 관리자가 동의한 경우 force: true 플래그와 함께 강제 재요청 기동
            await handleAddRule(text, true);
          }
        } else {
          alert(data.message);
          setNewRuleText("");
          fetchRulesList();
          fetchFinanceData(); // 자동 분류 결과를 신속히 로컬 리스트에 반영
        }
      } else {
        alert(data.error || "규칙 등록에 실패했습니다.");
      }
    } catch (e: any) {
      alert("오류가 발생했습니다: " + e.message);
    } finally {
      setIsAddingRule(false);
    }
  };

  // 🔑 자연어 규칙 영향 건 실시간 미리보기 API 연동
  const handlePreviewRule = async (text: string) => {
    if (!text || !text.trim()) return;
    setIsPreviewLoading(true);
    setPreviewList([]);
    try {
      const res = await fetch("/api/finance/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naturalText: text, previewOnly: true })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewList(data.previewList || []);
        setIsPreviewOpen(true);
      } else {
        alert(data.error || "영향을 받는 건 분석에 실패했습니다.");
      }
    } catch (e: any) {
      alert("오류가 발생했습니다: " + e.message);
    } finally {
      setIsPreviewLoading(false);
    }
  };



  // 🔑 자연어 규칙 활성화 여부 토글 API 연동
  const handleToggleRule = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/finance/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive })
      });
      const data = await res.json();
      if (data.success) {
        fetchRulesList();
        fetchFinanceData(); // 자동 분류 결과를 실시간 목록에 동기화
      } else {
        alert(data.error || "규칙 상태 변경 실패");
      }
    } catch (e: any) {
      alert("오류: " + e.message);
    }
  };

  // 🔑 자연어 규칙 삭제 API 연동
  const handleDeleteRule = async (id: string) => {
    if (!confirm("이 자연어 규칙을 삭제하시겠습니까? 관련하여 자동 정산된 미확정 내역들도 초기화됩니다.")) return;
    try {
      const res = await fetch(`/api/finance/rules?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        fetchRulesList();
        fetchFinanceData(); // 동기화 초기화 결과를 로컬에 반영
      } else {
        alert(data.error || "규칙 삭제 실패");
      }
    } catch (e: any) {
      alert("오류: " + e.message);
    }
  };


  // 통합 데이터 패치 함수
  const fetchFinanceData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 공통 정보 (계좌 정보 & 통계 데이터) 및 통합 요약 통계는 최초 및 전환 시 항상 최신화 유지
      const [accountsRes, summaryRes] = await Promise.all([
        fetch("/api/finance?tab=accounts").then((res) => res.json()),
        fetch("/api/finance?tab=summary").then((res) => res.json())
      ]);

      if (accountsRes.success) {
        setAccounts(accountsRes.data.accounts || []);
        setStats(accountsRes.data.stats || { totalBalance: 0, activeAccounts: 0 });
      }
      if (summaryRes.success) {
        setSummaryData(summaryRes.data);
      }

      const offset = (currentPage - 1) * pageSize;
      const dateParams = `&startDate=${startDate}&endDate=${endDate}`;
      const searchParam = searchText ? `&searchText=${encodeURIComponent(searchText)}` : "";
      const invTypeParam = invoiceType !== "all" ? `&invoiceType=${invoiceType}` : "";
      const cardParams = `&cardCompanyId=${selectedCardCompanyId}&cardNumber=${selectedCardNumber}`;
      const bankParams = `&bankId=${selectedBankId}&accountId=${selectedAccountId}`;
      const cashParams = `&cashPurpose=${selectedCashPurpose}`;
      const paginationParams = `&limit=${pageSize}&offset=${offset}`;

      // 2. 활성화된 메인 탭에 따라 각각 최적의 엔드포인트 패치
      if (activeTab === "accounts") {
        const txRes = await fetch(`/api/finance?tab=transactions${dateParams}${searchParam}${bankParams}${paginationParams}`).then((res) => res.json());
        if (txRes.success) {
          setTransactionList(txRes.data.list || []);
          setTotalCount(txRes.data.total || 0);
        }
      } else if (activeTab === "cards") {
        const cardRes = await fetch(`/api/finance?tab=cards${dateParams}${searchParam}${cardParams}${paginationParams}`).then((res) => res.json());
        if (cardRes.success) {
          setCardTxList(cardRes.data.list || []);
          setTotalCount(cardRes.data.total || 0);
        }
      } else if (activeTab === "hometax") {
        if (hometaxSubTab === "invoice") {
          const invRes = await fetch(`/api/finance?tab=hometax-invoice${dateParams}${searchParam}${invTypeParam}${paginationParams}`).then((res) => res.json());
          if (invRes.success) {
            setTaxInvoiceList(invRes.data.list || []);
            setTotalCount(invRes.data.total || 0);
          }
        } else if (hometaxSubTab === "exempt") {
          const exemptRes = await fetch(`/api/finance?tab=hometax-exempt${dateParams}${searchParam}${invTypeParam}${paginationParams}`).then((res) => res.json());
          if (exemptRes.success) {
            setTaxExemptList(exemptRes.data.list || []);
            setTotalCount(exemptRes.data.total || 0);
          }
        } else if (hometaxSubTab === "cash") {
          const cashRes = await fetch(`/api/finance?tab=hometax-cash${dateParams}${searchParam}${cashParams}${paginationParams}`).then((res) => res.json());
          if (cashRes.success) {
            setCashReceiptList(cashRes.data.list || []);
            setTotalCount(cashRes.data.total || 0);
          }
        }
      } else if (activeTab === "sync") {
        const syncRes = await fetch("/api/finance?tab=sync").then((res) => res.json());
        if (syncRes.success) {
          setSyncHistory(syncRes.data.syncHistory || []);
          setHometaxSync(syncRes.data.hometaxSync || []);
          setHometaxConnections(syncRes.data.hometaxConnections || []);
        }
      }
    } catch (e) {
      console.error("데이터 패칭 실패:", e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, hometaxSubTab, currentPage, pageSize, startDate, endDate, searchText, invoiceType, selectedCardCompanyId, selectedCardNumber, selectedCashPurpose, selectedBankId, selectedAccountId]);



  // 실시간 동기화 강제 새로고침 시 트리거
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFinanceData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // 📂 지출 계정과목(대/중/소 체계) 실시간 로드
  useEffect(() => {
    fetch("/api/expenses/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setDbCategories(json.categories || []);
        }
      })
      .catch((e) => console.error("계정과목 로드 에러:", e));
  }, []);

  // 📂 태그 프리셋 실시간 로드
  useEffect(() => {
    fetch("/api/expenses/tags")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setDbTags(json.tags || []);
        }
      })
      .catch((e) => console.error("태그 로드 에러:", e));
  }, []);

  // 🔑 태그 토글(인라인 조합) 헬퍼 핸들러
  const handleTagToggle = (tagName: string) => {
    const currentTags = tempMemo.split(",")
      .map(t => t.trim())
      .filter(Boolean);
    
    let nextTags: string[];
    if (currentTags.includes(tagName)) {
      nextTags = currentTags.filter(t => t !== tagName);
    } else {
      nextTags = [...currentTags, tagName];
    }
    
    setTempMemo(nextTags.join(", "));
  };

  // 🔑 최고관리자(SUPER_ADMIN) 또는 대표자(PRESIDENT) 권한이 있는지 확인하는 헬퍼 변수
  const hasAdminAccess = useMemo(() => {
    if (!userRole) return false;
    const role = userRole.toUpperCase();
    return role === "SUPER_ADMIN" || role === "PRESIDENT";
  }, [userRole]);

  // 🔑 최고관리자 권한 조회
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.role) {
          setUserRole(data.role);
        }
      } catch (e) {
        console.error("Failed to fetch user session on client", e);
      }
    };
    fetchUserRole();
  }, []);

  interface RecommendedOption {
    category: string;     // 소분류 계정과목
    tags: string[];       // 쉼표로 쪼갠 태그 목록
    percentage: number;   // 확률 %
    count: number;        // 빈도수
  }

  // 🧠 가맹점명 + 태그(비고)의 다차원 결합 확률 사전 실시간 빌드
  const jointProbabilityMap = useMemo(() => {
    const map: Record<string, Record<string, { count: number; category: string; tags: string[] }>> = {};
    
    // 확정된 카드 거래 내역 필터링
    const confirmedTxs = cardTxList.filter(tx => tx.category && tx.category.trim() !== "");
    
    confirmedTxs.forEach((tx) => {
      const merchant = tx.merchantName?.trim() || "";
      if (!merchant) return;
      
      const cat = tx.category.trim();
      const rawMemo = tx.memo || "";
      const tags = rawMemo.split(",").map(t => t.trim()).filter(Boolean);
      
      // 태그 리스트를 소팅하여 고유한 키값으로 사용 (예: "SCM팀,복지지원")
      const tagKey = [...tags].sort().join(",");
      
      if (!map[merchant]) {
        map[merchant] = {};
      }
      
      const patternKey = `${cat}|||${tagKey}`;
      if (!map[merchant][patternKey]) {
        map[merchant][patternKey] = {
          count: 0,
          category: cat,
          tags: tags
        };
      }
      map[merchant][patternKey].count += 1;
    });
    
    return map;
  }, [cardTxList]);

  // 🧠 실시간 동적 베이지안 확률 추론 엔진 (하이브리드 교차 추천 알고리즘)
  const getDynamicRecommendations = useCallback((merchantName: string, currentMemo: string): RecommendedOption[] => {
    // 💡 개행 및 탭 문자를 확실하게 거르고 정제하여 문자열 비교 신뢰도 극대화
    const merchant = merchantName?.replace(/[\r\n\t]/g, "").trim() || "";
    if (!merchant) return [];
    
    const currentTags = currentMemo.split(",").map(t => t.trim()).filter(Boolean);
    const lowerMerchant = merchant.toLowerCase();
    
    // 1. 모든 후보군 풀(Candidate Pool)을 생성
    const candidates: { category: string; tags: string[]; baseWeight: number; isFallback: boolean }[] = [];
    
    // (A) 과거 학습 이력 패턴 추가
    const merchantPatterns = jointProbabilityMap[merchant];
    if (merchantPatterns && Object.keys(merchantPatterns).length > 0) {
      Object.values(merchantPatterns).forEach((p) => {
        candidates.push({
          category: p.category,
          tags: p.tags,
          baseWeight: p.count * 10, // 과거 확정 이력은 기본적으로 높은 우선순위 가중치를 부여
          isFallback: false
        });
      });
    }
    
    // (B) NLP 맥락 기반 정적 룰 폴백 패턴 추가
    const fallbacks: { category: string; tags: string[]; percentage: number }[] = [];
    if (["식당", "횟집", "고기", "푸드", "한식", "일식", "중식", "커피", "다과", "스타벅스", "카페", "투썸", "바다사남", "어시장"].some(k => lowerMerchant.includes(k))) {
      fallbacks.push({ category: "직원식대", tags: ["복지지원", "소액결제"], percentage: 80 });
      fallbacks.push({ category: "거래처식사비", tags: ["거래처접대"], percentage: 20 });
    } else if (["택시", "ktx", "철도", "항공", "주차", "톨게이트", "카카오t", "교통", "요금"].some(k => lowerMerchant.includes(k))) {
      fallbacks.push({ category: "시내교통비", tags: ["긴급비용", "복지지원"], percentage: 90 });
    } else if (["마트", "문구", "인쇄", "다이소", "알파문구"].some(k => lowerMerchant.includes(k))) {
      fallbacks.push({ category: "사무용품비", tags: ["비품구매", "소액결제"], percentage: 95 });
    } else if (["aws", "google cloud", "클라우드", "호스팅", "cafe24", "github", "hosting"].some(k => lowerMerchant.includes(k))) {
      fallbacks.push({ category: "전산소모품비", tags: ["인프라유지", "정기지출"], percentage: 100 });
    }
    
    // 만약 과거 이력과 정적 룰 모두 해당하지 않는 경우 최종 기본 폴백 탑재
    if (candidates.length === 0 && fallbacks.length === 0) {
      fallbacks.push({
        category: "기타소분류",
        tags: ["소액결제"],
        percentage: 100
      });
    }
    
    // 폴백 항목들을 후보군 풀에 교차 병합 (중복 카테고리는 과거 이력 우대)
    fallbacks.forEach((f) => {
      if (!candidates.some(c => c.category === f.category)) {
        candidates.push({
          category: f.category,
          tags: f.tags,
          baseWeight: f.percentage,
          isFallback: true
        });
      }
    });
    
    // 2. 동적 베이지안 확률 연산 기동 (Bayesian Intersect Update)
    const scoredCandidates = candidates.map((c) => {
      let finalWeight = c.baseWeight;
      
      // 현재 입력된 태그 맥락과의 정밀 교차 검증
      if (currentTags.length > 0 && c.tags.length > 0) {
        const intersection = c.tags.filter(t => currentTags.includes(t));
        if (intersection.length > 0) {
          // 태그 매칭 성공 시 폭발적 보너스 가중치 부여 (가중치 1000배로 최우선 역전 추천 보장)
          finalWeight += intersection.length * 1000;
        }
      }
      
      return {
        category: c.category,
        tags: c.tags,
        weight: finalWeight,
        isFallback: c.isFallback
      };
    });
    
    const totalWeight = scoredCandidates.reduce((sum, c) => sum + c.weight, 0);
    
    // 3. 최종 백분율(%) 계산 및 정렬 (상위 최대 3개 추천 노출)
    return scoredCandidates
      .map((c) => ({
        category: c.category,
        tags: c.tags,
        percentage: totalWeight > 0 ? Math.round((c.weight / totalWeight) * 100) : 0,
        count: c.isFallback ? 1 : Math.round(c.weight / 10)
      }))
      .sort((a, b) => b.percentage - a.percentage || b.count - a.count)
      .slice(0, 3);
  }, [jointProbabilityMap]);

  // 🔑 신용카드 거래 내역(계정과목, 비고) 수정 핸들러
  const handleUpdateCardTransaction = async (txId: string, updates: { category?: string; memo?: string }) => {
    setIsUpdatingCardTx(true);
    try {
      const res = await fetch("/api/finance/card-transaction", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: txId,
          ...updates
        })
      });
      const data = await res.json();
      if (data.success) {
        // 로컬 상태의 리스트 업데이트
        setCardTxList((prev) =>
          prev.map((tx) => {
            if (tx.id === txId) {
              return {
                ...tx,
                ...updates
              };
            }
            return tx;
          })
        );
        setEditingCardTxId(null);
        setEditingField(null);
      } else {
        alert(data.error || "수정에 실패했습니다.");
      }
    } catch (e: any) {
      console.error("Card transaction update failed", e);
      alert("오류가 발생했습니다: " + e.message);
    } finally {
      setIsUpdatingCardTx(false);
    }
  };

  // 🔑 은행 거래 내역(계정과목, 비고) 수정 핸들러
  const handleUpdateBankTransaction = async (txId: string, updates: { category?: string; memo?: string }) => {
    setIsUpdatingBankTx(true);
    try {
      const res = await fetch("/api/finance/bank-transaction", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: txId,
          ...updates
        })
      });
      const data = await res.json();
      if (data.success) {
        // 로컬 상태의 리스트 업데이트
        setTransactionList((prev) =>
          prev.map((tx) => {
            if (tx.id === txId) {
              return {
                ...tx,
                ...updates
              };
            }
            return tx;
          })
        );
        setEditingBankTxId(null);
        setEditingField(null);
      } else {
        alert(data.error || "수정에 실패했습니다.");
      }
    } catch (e: any) {
      console.error("Bank transaction update failed", e);
      alert("오류가 발생했습니다: " + e.message);
    } finally {
      setIsUpdatingBankTx(false);
    }
  };

  // 🔑 국세청 거래 내역(비고/태그) 수정 핸들러
  const handleUpdateHometaxTransaction = async (txId: string, type: "invoice" | "exempt" | "cash", updates: { memo?: string }) => {
    setIsUpdatingHometaxTx(true);
    try {
      const res = await fetch("/api/finance/hometax-transaction", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: txId,
          type,
          ...updates
        })
      });
      const data = await res.json();
      if (data.success) {
        // 로컬 상태의 리스트 업데이트
        if (type === "invoice") {
          setTaxInvoiceList((prev) =>
            prev.map((tx) => (tx.id === txId ? { ...tx, ...updates } : tx))
          );
        } else if (type === "exempt") {
          setTaxExemptList((prev) =>
            prev.map((tx) => (tx.id === txId ? { ...tx, ...updates } : tx))
          );
        } else if (type === "cash") {
          setCashReceiptList((prev) =>
            prev.map((tx) => (tx.id === txId ? { ...tx, ...updates } : tx))
          );
        }
        setEditingHometaxTxId(null);
        setEditingField(null);
      } else {
        alert(data.error || "수정에 실패했습니다.");
      }
    } catch (e: any) {
      console.error("Hometax transaction update failed", e);
      alert("오류가 발생했습니다: " + e.message);
    } finally {
      setIsUpdatingHometaxTx(false);
    }
  };

  // 💡 비고란의 태그가 '#거래처접대'인 경우 계정과목 자동 적용 리액티브 트리거
  useEffect(() => {
    if (!editingCardTxId || editingField !== "memo") return;
    
    // tempMemo에 '거래처접대'가 포함되어 있는지 실시간 확인
    const tags = tempMemo.split(",")
      .map(t => t.trim())
      .filter(Boolean);
      
    if (tags.includes("거래처접대")) {
      const tx = cardTxList.find(t => t.id === editingCardTxId);
      if (tx) {
        // 💡 중요: 사용자가 수정 창을 방금 열어서 기존 값과 동일한 상태일 때는 자동 적용을 트리거하지 않고,
        // 실제로 태그 내용에 변화가 일어났을 때(수정 중일 때)에만 자동 적용하도록 가드합니다.
        const isMemoChanged = (tx.memo || "") !== tempMemo;
        if (!isMemoChanged) return;

        // 동적 베이지안 확률 추천 후보 목록을 가져옴
        const recs = getDynamicRecommendations(tx.merchantName, tempMemo);
        if (recs && recs.length > 0) {
          const bestRec = recs[0];
          // 이미 해당 카테고리가 지정되어 있거나 업데이트 중이 아니라면 기동
          if (!isUpdatingCardTx) {
            handleUpdateCardTransaction(tx.id, {
              category: bestRec.category,
              memo: tempMemo
            });
          }
        }
      }
    }
  }, [tempMemo, editingCardTxId, editingField, cardTxList, getDynamicRecommendations, isUpdatingCardTx]);


  // 빠른 기간 설정 헬퍼
  const handleQuickPeriod = (days: number | "year") => {
    setIsDateManuallySet(true);
    const end = new Date();
    const start = new Date();
    if (days === "year") {
      start.setMonth(0);
      start.setDate(1); // 1월 1일
    } else {
      start.setDate(end.getDate() - days);
    }
    setStartDate(getFormattedDate(start));
    setEndDate(getFormattedDate(end));
  };

  const handleResetPeriod = () => {
    setIsDateManuallySet(false); // 자동 스위칭 모드로 변경
    if (activeTab === "hometax") {
      setStartDate(getStartDateForHometax());
    } else {
      setStartDate(getStartDateForBank());
    }
    setEndDate(getFormattedDate(new Date()));
  };

  // 총 페이지 계산
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // 통계 계산 가상 연산 (실제 데이터에 비례하여 부드럽게 차오르는 게이지 제작용)
  const calculateHometaxStats = () => {
    const invoiceTotal = taxInvoiceList.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const exemptTotal = taxExemptList.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const cashTotal = cashReceiptList.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const salesTotal = 
      taxInvoiceList.filter(i => i.invoiceType === "sales" || i.invoiceType === "매출").reduce((acc, curr) => acc + curr.totalAmount, 0) +
      taxExemptList.filter(i => i.invoiceType === "sales" || i.invoiceType === "매출").reduce((acc, curr) => acc + curr.totalAmount, 0) +
      cashTotal; // 현금영수증은 발행(매출)로 취급

    const purchaseTotal =
      taxInvoiceList.filter(i => i.invoiceType === "purchase" || i.invoiceType === "매입").reduce((acc, curr) => acc + curr.totalAmount, 0) +
      taxExemptList.filter(i => i.invoiceType === "purchase" || i.invoiceType === "매입").reduce((acc, curr) => acc + curr.totalAmount, 0);

    return { invoiceTotal, exemptTotal, cashTotal, salesTotal, purchaseTotal };
  };

  const hometaxStats = calculateHometaxStats();
  
  // 당월 카드 총액 합산
  const totalCardAmount = cardTxList
    .filter(tx => tx.status !== "취소")
    .reduce((acc, curr) => acc + curr.amount, 0);

  // 렌더링을 위해 카드사별로 카드 요약 정보 그룹화 (BC카드 등 개별 번호 카드를 하나의 요약 카드로 병합)
  const groupedCards = (summaryData.cardSummary || []).reduce((acc: any[], curr: any) => {
    const existing = acc.find(item => item.cardCompanyName === curr.cardCompanyName);
    if (existing) {
      existing.m0 += curr.m0 || 0;
      existing.m1 += curr.m1 || 0;
      existing.m2 += curr.m2 || 0;
      existing.yTotal += curr.yTotal || 0;
      existing.cardCount += 1;
      
      const existingDateTime = existing.lastTxDate ? `${existing.lastTxDate} ${existing.lastTxTime}` : "";
      const currDateTime = curr.lastTxDate ? `${curr.lastTxDate} ${curr.lastTxTime}` : "";
      if (currDateTime > existingDateTime) {
        existing.lastTxDate = curr.lastTxDate;
        existing.lastTxTime = curr.lastTxTime;
      }
    } else {
      acc.push({
        cardCompanyName: curr.cardCompanyName,
        cardCount: 1,
        m0: curr.m0 || 0,
        m1: curr.m1 || 0,
        m2: curr.m2 || 0,
        yTotal: curr.yTotal || 0,
        lastTxDate: curr.lastTxDate || "",
        lastTxTime: curr.lastTxTime || ""
      });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6 pb-24 max-w-[1600px] mx-auto px-4 md:px-8">
      {/* 1. 상단 웰컴 및 실시간 동기화 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Landmark className="w-8 h-8 text-blue-600" />
            금융 정보 AI
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 border border-transparent rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            인터넷뱅킹 엑셀 가져오기
          </button>

          <button
            onClick={() => {
              setIsCardModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 border border-transparent rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            신용카드 엑셀 가져오기
          </button>

          <button
            onClick={() => {
              setIsHometaxModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 border border-transparent rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            국세청 홈택스 가져오기
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "동기화 중..." : "금융자료 실시간 동기화"}
          </button>
        </div>
      </div>

      {/* 2. 감성적인 Framer Motion 통계 카드 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 카드 1: 보유 계좌별 잔액 및 총합계 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between min-h-[440px]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-blue-400" />
                보유 계좌별 잔액 및 총합계
              </span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-medium">
                {accounts.filter(
                  (acc) =>
                    !acc.id.includes("CARD") &&
                    !acc.bankId.includes("card") &&
                    !acc.accountName.includes("카드")
                ).length}개 계좌 연동
              </span>
            </div>

            {/* 은행 계좌 잔액 리스트 */}
            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1.5 custom-scrollbar scrollbar-thin scrollbar-thumb-slate-700">
              {accounts
                .filter(
                  (acc) =>
                    !acc.id.includes("CARD") &&
                    !acc.bankId.includes("card") &&
                    !acc.accountName.includes("카드")
                )
                .map((acc) => (
                  <div 
                    key={acc.id} 
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-600/30 text-blue-200 rounded border border-blue-500/20">
                          {acc.bankName}
                        </span>
                        <span className="text-white text-xs font-bold">
                          {acc.accountName && !acc.accountName.includes("자동 임포트") && !acc.accountName.includes("자동등록") ? acc.accountName : ""}
                        </span>
                        {acc.lastTxDate && (
                          <span className="text-[9px] text-slate-400/80 font-medium">
                            최종: {acc.lastTxDate} {acc.lastTxTime}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wider">{acc.accountNumber}</p>
                    </div>
                    <span className="text-xs font-extrabold text-blue-300 font-mono">
                      ₩ {acc.balance?.toLocaleString()}
                    </span>
                  </div>
                ))}
              {accounts.filter(
                (acc) =>
                  !acc.id.includes("CARD") &&
                  !acc.bankId.includes("card") &&
                  !acc.accountName.includes("카드")
              ).length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  연동된 은행 계좌가 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-end">
              <span className="text-xs text-slate-400 font-bold">보유 계좌 합계금액</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                <TrendingUp className="w-3 h-3" />
                정상 연동 중
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1 font-mono">
              ₩ {stats.totalBalance?.toLocaleString() || "0"}
            </h3>
          </div>
        </motion.div>

        {/* 카드 2: 카드사별 3개월 지출 규모 & 금년도 누적 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[440px] relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
          
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-500" />
                카드사별 3개월 지출 현황
              </span>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                승인 기준 (취소 제외)
              </span>
            </div>

            {/* 카드사별 월별 사용액 컴팩트 테이블 */}
            <div className="max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="pb-1.5 font-bold bg-white">카드명/번호</th>
                    <th className="pb-1.5 text-right font-bold bg-white">금월({summaryData.months[0]?.split("-")[1] || "5"}월)</th>
                    <th className="pb-1.5 text-right font-bold bg-white">전월({summaryData.months[1]?.split("-")[1] || "4"}월)</th>
                    <th className="pb-1.5 text-right font-bold bg-white">전전월({summaryData.months[2]?.split("-")[1] || "3"}월)</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.cardSummary.map((card: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 text-slate-700 font-medium">
                      <td className="py-2 pr-1">
                        <div className="font-extrabold text-slate-800 truncate max-w-[80px]">
                          {card.cardCompanyName}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">{card.cardNumber}</div>
                      </td>
                      <td className="py-2 text-right font-bold text-slate-800">₩{card.m0?.toLocaleString()}</td>
                      <td className="py-2 text-right text-slate-500">₩{card.m1?.toLocaleString()}</td>
                      <td className="py-2 text-right text-slate-500">₩{card.m2?.toLocaleString()}</td>
                    </tr>
                  ))}
                  {summaryData.cardSummary.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-400 font-semibold">
                        조회된 신용카드 거래가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">금년도 사용액</span>
              <span className="text-xl font-black text-slate-800 font-mono block">
                ₩ {summaryData.cardSummary.reduce((acc: number, curr: any) => acc + (curr.yTotal || 0), 0)?.toLocaleString()}
              </span>
            </div>
            
            <div className="text-right space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">이번 달 사용액</span>
              <span className="text-xs font-bold text-slate-600 font-mono block">
                ₩ {summaryData.cardSummary.reduce((acc: number, curr: any) => acc + (curr.m0 || 0), 0)?.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 카드 3: 홈택스 매출/매입 3개월 추이 & 누적 대비표 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[440px] relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-500" />
                홈택스 매출·매입 3개월 비교
              </span>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                세무 매칭액
              </span>
            </div>

            {/* 매출 대 매입 대칭 레이아웃 */}
            <div className="grid grid-cols-1 gap-3">
              {/* 매출액 파트 */}
              <div className="space-y-3 p-4 py-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100/50">
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  매출액 (Sales)
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-medium">금월({summaryData.months[0]?.split("-")[1] || "5"}월)</span>
                    <span className="font-extrabold text-emerald-600 font-mono">₩{summaryData.hometaxSummary?.sales?.m0?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-medium">전월({summaryData.months[1]?.split("-")[1] || "4"}월)</span>
                    <span className="font-bold text-slate-600 font-mono">₩{summaryData.hometaxSummary?.sales?.m1?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-medium">전전월({summaryData.months[2]?.split("-")[1] || "3"}월)</span>
                    <span className="font-bold text-slate-600 font-mono">₩{summaryData.hometaxSummary?.sales?.m2?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 매입액 파트 */}
              <div className="space-y-3 p-4 py-3.5 rounded-2xl bg-rose-50/30 border border-rose-100/50">
                <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  매입액 (Purchase)
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-medium">금월({summaryData.months[0]?.split("-")[1] || "5"}월)</span>
                    <span className="font-extrabold text-rose-500 font-mono">₩{summaryData.hometaxSummary?.purchase?.m0?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-medium">전월({summaryData.months[1]?.split("-")[1] || "4"}월)</span>
                    <span className="font-bold text-slate-600 font-mono">₩{summaryData.hometaxSummary?.purchase?.m1?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-medium">전전월({summaryData.months[2]?.split("-")[1] || "3"}월)</span>
                    <span className="font-bold text-slate-600 font-mono">₩{summaryData.hometaxSummary?.purchase?.m2?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">금년도 매출액</span>
              <span className="text-lg font-black text-emerald-600 font-mono block">
                ₩ {summaryData.hometaxSummary?.sales?.yTotal?.toLocaleString()}
              </span>
            </div>
            
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-slate-400 font-bold block">금년도 매입액</span>
              <span className="text-lg font-black text-rose-500 font-mono block">
                ₩ {summaryData.hometaxSummary?.purchase?.yTotal?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 슬라이딩 매출입 밸런스 비율 바 */}
          <div className="mt-3 space-y-1">
            <div className="w-full bg-rose-200 h-2.5 rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    (summaryData.hometaxSummary?.sales?.yTotal || 0) + (summaryData.hometaxSummary?.purchase?.yTotal || 0) > 0
                      ? ((summaryData.hometaxSummary?.sales?.yTotal || 0) / ((summaryData.hometaxSummary?.sales?.yTotal || 0) + (summaryData.hometaxSummary?.purchase?.yTotal || 0))) * 100
                      : 50
                  }%`
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-emerald-500 h-full rounded-l-full"
              ></motion.div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-bold">
              <span className="text-emerald-600">
                매출 {(summaryData.hometaxSummary?.sales?.yTotal || 0) + (summaryData.hometaxSummary?.purchase?.yTotal || 0) > 0 
                  ? Math.round(((summaryData.hometaxSummary?.sales?.yTotal || 0) / ((summaryData.hometaxSummary?.sales?.yTotal || 0) + (summaryData.hometaxSummary?.purchase?.yTotal || 0))) * 100) 
                  : 50}%
              </span>
              <span className="text-rose-500">
                매입 {(summaryData.hometaxSummary?.sales?.yTotal || 0) + (summaryData.hometaxSummary?.purchase?.yTotal || 0) > 0 
                  ? Math.round(((summaryData.hometaxSummary?.purchase?.yTotal || 0) / ((summaryData.hometaxSummary?.sales?.yTotal || 0) + (summaryData.hometaxSummary?.purchase?.yTotal || 0))) * 100) 
                  : 50}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. 통합 금융 검색 및 날짜 필터 영역 */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* 기간 필터 컨트롤러 */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="font-semibold flex items-center gap-1 mr-2 text-slate-700">
              <Calendar className="w-4 h-4 text-blue-500" />
              조회 기간
            </span>
            <div className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-xl">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setIsDateManuallySet(true);
                  setStartDate(e.target.value);
                }}
                className="outline-none bg-transparent font-medium text-xs text-slate-700 cursor-pointer"
              />
              <span className="text-slate-400">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setIsDateManuallySet(true);
                  setEndDate(e.target.value);
                }}
                className="outline-none bg-transparent font-medium text-xs text-slate-700 cursor-pointer"
              />
            </div>

            {/* 빠른 기간 단축 버튼 */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => handleQuickPeriod(7)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  startDate === getStartDateForBank() && !isDateManuallySet
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                1주일
              </button>
              <button
                onClick={() => handleQuickPeriod(30)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                1개월
              </button>
              <button
                onClick={() => handleQuickPeriod(90)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                3개월
              </button>
              <button
                onClick={() => handleQuickPeriod("year")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  startDate === getStartDateForHometax() && !isDateManuallySet
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                금년도
              </button>
            </div>

            {/* 필터 초기화 버튼 */}
            {isDateManuallySet && (
              <button
                onClick={handleResetPeriod}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
              >
                기본 조건 복원
              </button>
            )}
          </div>

          {/* 통합 검색어 바 */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {activeTab === "hometax" && hometaxSubTab !== "cash" && (
              <select
                value={invoiceType}
                onChange={(e: any) => setInvoiceType(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50 text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">매출/매입 전체</option>
                <option value="sales">매출 내역만</option>
                <option value="purchase">매입 내역만</option>
              </select>
            )}
            
            <div className="relative flex-1 lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  activeTab === "accounts"
                    ? "거래처, 적요 검색..."
                    : activeTab === "cards"
                    ? "가맹점명 검색..."
                    : "공급자, 공급받는자, 품목명 검색..."
                }
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. 메인 탭 네비게이션 스위치 */}
      <div className="border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${
              activeTab === "accounts" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Landmark className="w-4.5 h-4.5" />
            은행 계좌 & 거래 내역
            {activeTab === "accounts" && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("cards")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${
              activeTab === "cards" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <CreditCard className="w-4.5 h-4.5" />
            신용 카드 사용 내역
            {activeTab === "cards" && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("hometax")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${
              activeTab === "hometax" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Receipt className="w-4.5 h-4.5" />
            국세청 홈택스 자료
            {activeTab === "hometax" && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("sync")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${
              activeTab === "sync" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <RefreshCw className="w-4.5 h-4.5" />
            금융 동기화 이력
            {activeTab === "sync" && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* 5. 탭별 상세 데이터 테이블 및 보드 렌더링 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${hometaxSubTab}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* TAB 1: 은행 계좌 & 거래 내역 */}
          {activeTab === "accounts" && (
            <div className="space-y-6">
              {/* 계좌 리스트 슬라이드 카드형 레이아웃 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {accounts
                  .filter(
                    (acc) =>
                      !acc.id.includes("CARD") &&
                      !acc.bankId.includes("card") &&
                      !acc.accountName.includes("카드")
                  )
                  .map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => {
                        if (selectedAccountId === acc.id) {
                          setSelectedAccountId("all");
                          setSelectedBankId("all");
                        } else {
                          setSelectedAccountId(acc.id);
                          setSelectedBankId(acc.bankId || "all");
                        }
                      }}
                      className={`p-5 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden cursor-pointer ${
                        selectedAccountId === acc.id
                          ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/5"
                          : "border-slate-100"
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-lg"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
                          {acc.bankName}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">{acc.accountNumber}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 tracking-tight">
                          {acc.accountName && !acc.accountName.includes("자동 임포트") && !acc.accountName.includes("자동등록") ? acc.accountName : ""}
                        </h4>
                        <p className="text-xl font-extrabold text-slate-800 mt-1">
                          ₩ {acc.balance?.toLocaleString()}
                        </p>
                        {acc.lastTxDate && (
                          <p className="text-[10px] text-slate-400 font-semibold mt-1.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            최종 거래: {acc.lastTxDate} {acc.lastTxTime}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                {accounts.filter(
                  (acc) =>
                    !acc.id.includes("CARD") &&
                    !acc.bankId.includes("card") &&
                    !acc.accountName.includes("카드")
                ).length === 0 && (
                  <div className="col-span-full bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-400 text-xs font-medium">
                    조회된 등록 계좌가 없습니다.
                  </div>
                )}
              </div>

              {/* 은행 거래 목록 명세서 */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-500" />
                    <h3 className="font-bold text-slate-800 text-sm">
                      은행 통합 계좌 입출금 명세서
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold ml-2">총 {totalCount}건의 거래</span>
                  </div>

                  {/* 은행/계좌 교차 필터 드롭다운 UI */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadAccountsExcel(transactionList)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer mr-2"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      엑셀 다운로드
                    </button>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400">은행사:</span>
                      <select
                        value={selectedBankId}
                        onChange={(e) => setSelectedBankId(e.target.value)}
                        className="border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="all">전체 은행사</option>
                        <option value="shinhan">신한은행</option>
                        <option value="woori">우리은행</option>
                        <option value="kookmin">KB국민은행</option>
                        <option value="hana">하나은행</option>
                        <option value="ibk">IBK기업은행</option>
                        <option value="nh">NH농협은행</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400">계좌번호:</span>
                      <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="all">전체 번호</option>
                        {accounts
                          .filter(
                            (acc) =>
                              !acc.id.includes("CARD") &&
                              !acc.bankId.includes("card") &&
                              !acc.accountName.includes("카드")
                          )
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.accountNumber} ({acc.bankName})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400">
                        <th className="p-4 w-32">거래일자</th>
                        <th className="p-4 w-28">은행명</th>
                        <th className="p-4 w-36">계좌번호</th>
                        <th className="p-4">적요 / 거래구분</th>
                        <th className="p-4">구분</th>
                        <th className="p-4 min-w-[120px] text-amber-600 font-extrabold">🏷️ 태그</th>
                        <th className="p-4 text-right">입금액</th>
                        <th className="p-4 text-right">출금액</th>
                        <th className="p-4 text-right">잔액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <TableSkeleton cols={9} rows={5} />
                      ) : (
                        transactionList.map((tx) => {
                          const isDeposit = tx.type === "deposit" || tx.type === "입금";
                          return (
                            <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/40 text-xs text-slate-700">
                              <td className="p-4 font-mono font-medium text-slate-400">
                                <div>{tx.date}</div>
                                {tx.time && (
                                  <div className="text-[10px] text-slate-400/80 mt-0.5">{tx.time}</div>
                                )}
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-slate-800">{tx.bankName || "기타은행"}</span>
                              </td>
                              <td className="p-4 font-mono text-slate-500">
                                {tx.accountNumber || "-"}
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-slate-800">{tx.description}</span>
                                {tx.category && (
                                  <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md">
                                    {tx.category}
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 w-max ${
                                    isDeposit
                                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                      : "bg-rose-50 text-rose-500 border border-rose-100"
                                  }`}
                                >
                                  {isDeposit ? (
                                    <>
                                      <ArrowDownLeft className="w-3 h-3" />
                                      입금
                                    </>
                                  ) : (
                                    <>
                                      <ArrowUpRight className="w-3 h-3" />
                                      출금
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="p-4 max-w-[150px]">
                                {hasAdminAccess && editingBankTxId === tx.id && editingField === "memo" ? (
                                  <div className="flex flex-col gap-1.5 p-1 bg-white rounded-2xl border border-slate-100 shadow-lg min-w-[220px]">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        value={tempMemo}
                                        onChange={(e) => setTempMemo(e.target.value)}
                                        className="border border-amber-300 bg-amber-50 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                        placeholder="쉼표로 태그 구분"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handleUpdateBankTransaction(tx.id, { memo: tempMemo });
                                          } else if (e.key === "Escape") {
                                            setEditingBankTxId(null);
                                            setEditingField(null);
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() => handleUpdateBankTransaction(tx.id, { memo: tempMemo })}
                                        className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 whitespace-nowrap"
                                        disabled={isUpdatingBankTx}
                                      >
                                        저장
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingBankTxId(null);
                                          setEditingField(null);
                                        }}
                                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-bold transition-all active:scale-95 whitespace-nowrap"
                                      >
                                        취소
                                      </button>
                                    </div>
                                    
                                    {/* 💡 태그 프리셋 가이드 칩 UI */}
                                    <div className="mt-1 p-2 bg-slate-50/50 rounded-xl border border-slate-100/60">
                                      <div className="text-[9px] font-extrabold text-slate-400 mb-1.5">사용할 수 있는 태그 목록 (클릭 토글)</div>
                                      <div className="flex flex-wrap gap-1">
                                        {dbTags.map((tag) => {
                                          const isSelected = tempMemo.split(",")
                                            .map(t => t.trim())
                                            .filter(Boolean)
                                            .includes(tag.name);
                                          return (
                                            <button
                                              key={tag.id}
                                              type="button"
                                              onClick={() => handleTagToggle(tag.name)}
                                              className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border transition-all active:scale-95 cursor-pointer ${
                                                isSelected
                                                  ? "bg-amber-500 text-white border-amber-500 shadow-3xs"
                                                  : "bg-white text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                                              }`}
                                            >
                                              #{tag.name}
                                            </button>
                                          );
                                        })}
                                        {dbTags.length === 0 && (
                                          <span className="text-[9px] text-slate-300 font-light">프리셋 태그를 로드할 수 없습니다.</span>
                                        )}
                                      </div>
                                      {hasAdminAccess && (
                                        <div className="mt-2 pt-1.5 border-t border-slate-100/60 flex justify-end">
                                          <a
                                            href="/expenses"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] font-black text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-0.5 animate-pulse"
                                          >
                                            ⚙️ 태그 관리 바로가기
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div 
                                    className={`min-h-[28px] flex items-center w-full ${hasAdminAccess ? "cursor-pointer hover:bg-amber-50/50 p-1.5 rounded-xl transition-all group" : ""}`}
                                    onClick={() => {
                                      if (hasAdminAccess) {
                                        setEditingBankTxId(tx.id);
                                        setEditingField("memo");
                                        setTempMemo(tx.memo || "");
                                      }
                                    }}
                                    title={hasAdminAccess ? "클릭하여 비고(태그) 수정" : undefined}
                                  >
                                    {tx.memo ? (
                                      <div className="flex flex-wrap gap-1 items-center w-full">
                                        {tx.memo.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                                          <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-100/60 shadow-3xs">
                                            #{tag}
                                          </span>
                                        ))}
                                        {hasAdminAccess && (
                                          <span className="ml-auto opacity-0 group-hover:opacity-100 text-amber-500 transition-opacity">
                                            <Edit className="w-3 h-3" />
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-300 font-bold select-none group-hover:text-amber-500 transition-colors">
                                        -
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className={`p-4 text-right font-extrabold ${isDeposit ? "text-emerald-600" : "text-slate-400"}`}>
                                {isDeposit ? `+ ₩ ${tx.amount?.toLocaleString()}` : "-"}
                              </td>
                              <td className={`p-4 text-right font-extrabold ${!isDeposit ? "text-rose-500" : "text-slate-400"}`}>
                                {!isDeposit ? `₩ ${tx.amount?.toLocaleString()}` : "-"}
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-slate-600">
                                ₩ {tx.balance?.toLocaleString() || "-"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                      {!loading && transactionList.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-12 text-center text-slate-400 text-xs font-semibold">
                            해당 조회 조건에 맞는 은행 거래 내역이 존재하지 않습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* 하단 페이지네이션 컴포넌트 */}
                {!loading && totalCount > 0 && (
                  <PaginationBar
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                    setCurrentPage={setCurrentPage}
                    totalCount={totalCount}
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 신용 카드 사용 내역 */}
          {activeTab === "cards" && (
            <div className="space-y-6">
              {/* 신용카드 리스트 슬라이드 카드형 레이아웃 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {groupedCards.map((card: any, idx: number) => {
                  const companyId = cardCompanyMap[card.cardCompanyName] || "all";
                  const isSelected = selectedCardCompanyId === companyId;
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (selectedCardCompanyId === companyId) {
                          setSelectedCardCompanyId("all");
                        } else {
                          setSelectedCardCompanyId(companyId);
                          setSelectedCardNumber("all");
                        }
                      }}
                      className={`p-5 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden cursor-pointer ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-500/10 bg-amber-50/5"
                          : "border-slate-100"
                      }`}
                    >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-lg"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-md">
                          {card.cardCompanyName}
                        </span>
                        {card.lastTxDate && (
                          <span className="text-[9px] text-slate-400/90 font-bold flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            최종 승인: {card.lastTxDate}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-xs font-mono">{card.cardCount}개 카드 통합</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-slate-50">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 tracking-tight">
                          이번달 사용액
                        </h4>
                        <p className="text-sm font-extrabold text-slate-800 mt-1 font-mono">
                          ₩ {card.m0?.toLocaleString()}
                        </p>
                      </div>
                      <div className="border-l border-slate-100 pl-4 text-right">
                        <h4 className="text-[10px] font-bold text-slate-400 tracking-tight">
                          금년도 사용액
                        </h4>
                        <p className="text-sm font-extrabold text-slate-800 mt-1 font-mono">
                          ₩ {card.yTotal?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    </div>
                  )
                })}
                {groupedCards.length === 0 && (
                  <div className="col-span-full bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-400 text-xs font-medium">
                    조회된 등록 신용카드가 없습니다.
                  </div>
                )}
              </div>

              {/* ⚡ 계정과목 AI Rule Builder - 최고 관리자 전용 */}
              {hasAdminAccess && (
                <div className="bg-linear-to-br from-indigo-50/40 via-purple-50/20 to-amber-50/30 rounded-3xl border border-indigo-100/50 p-5 shadow-2xs mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center p-1 shadow-indigo-100 shadow-sm animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                        계정과목 <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md font-bold ml-1">AI Rule Builder</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">관리자가 자연어로 설정한 지능형 조건에 매핑되는 승인 건을 영구 자동 분류합니다.</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 flex flex-col gap-2 bg-white/70 p-3 rounded-2xl border border-indigo-100/30">
                      <div className="text-[9.5px] font-extrabold text-indigo-500">✨ 새로운 자연어 규칙 기술하기</div>
                      <textarea
                        value={newRuleText}
                        onChange={(e) => setNewRuleText(e.target.value)}
                        placeholder='예: "BC카드이고 카드번호 뒤 4자리 숫자가 6975이며 사용일이 휴일이 아니고 오전 6시부터 오후 6시 사이에 승인된 20만원이하의 금액으로 차량번호 뒤 4자리 숫자가 1234인 경우에는 차량유지비로 분류해야합니다."'
                        className="border border-indigo-200 bg-slate-50/50 rounded-xl p-3 text-[11px] font-medium text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-full min-h-[75px] resize-none leading-relaxed placeholder:text-slate-400/80"
                        disabled={isAddingRule}
                      />
                      <div className="flex justify-end gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => setNewRuleText('BC카드이고 카드번호 뒤 4자리 숫자가 6975이며 사용일이 휴일이 아니고 오전 6시부터 오후 6시 사이에 승인된 20만원이하의 금액으로 차량번호 뒤 4자리 숫자가 1234인 경우에는 차량유지비로 분류해야합니다.')}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9.5px] font-bold transition-all active:scale-95 cursor-pointer"
                        >
                          💡 차량유지비 룰 예시 입력
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePreviewRule(newRuleText)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-lg text-[9.5px] font-bold transition-all active:scale-95 cursor-pointer disabled:bg-indigo-100/50"
                          disabled={isPreviewLoading || !newRuleText.trim()}
                        >
                          {isPreviewLoading ? "분석 중..." : "🔍 영향 건 미리보기"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddRule(newRuleText)}
                          className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10.5px] font-extrabold transition-all active:scale-95 shadow-md shadow-indigo-100 cursor-pointer disabled:bg-indigo-300"
                          disabled={isAddingRule || !newRuleText.trim()}
                        >
                          {isAddingRule ? "분석 및 실행 중..." : "🚀 규칙 등록 및 즉시 실행"}
                        </button>
                      </div>

                      {/* ⚡ [경합/충돌 예방] 자연어 규칙 영향 건 실시간 미리보기 패널 */}
                      <RulePreviewPanel
                        isOpen={isPreviewOpen}
                        previewList={previewList}
                        onClose={() => setIsPreviewOpen(false)}
                        onDownloadExcel={() => downloadPreviewExcel(previewList)}
                      />
                    </div>

                    {/* 등록된 규칙 목록 대시보드 */}
                    <div className="w-full md:w-[320px] bg-white/70 p-3 rounded-2xl border border-indigo-100/30 flex flex-col gap-2">
                      <div className="text-[9.5px] font-extrabold text-slate-400">📋 현재 작동 중인 자연어 규칙 ({rulesList.length}개)</div>
                      <div className="flex flex-col gap-1.5 max-h-[110px] overflow-y-auto pr-1 scrollbar-thin">
                        {rulesList.map((rule) => (
                          <div key={rule.id} className="p-2 bg-white rounded-xl border border-slate-100 shadow-3xs flex flex-col gap-1 text-[9.5px]">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-700 leading-tight line-clamp-2" title={rule.natural_text}>
                                {rule.natural_text}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-slate-400 hover:text-red-500 font-bold px-1 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                삭제
                              </button>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-50 pt-1 mt-1 text-[8.5px]">
                              <span className="font-extrabold text-indigo-600 bg-indigo-50 px-1 rounded">
                                👉 {rule.target_category}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={rule.is_active ? "text-emerald-600 font-bold" : "text-slate-400"}>
                                  {rule.is_active ? "활성" : "정지"}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={rule.is_active}
                                  onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        {rulesList.length === 0 && (
                          <span className="text-[9.5px] text-slate-300 font-light py-6 text-center">등록된 자연어 정산 규칙이 없습니다.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 법인 신용 카드 승인 내역 명세서 테이블 */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    법인 신용 카드 승인 내역 명세서
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold ml-2">총 {totalCount}건</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptSelectedTxId("");
                      setIsReceiptModalOpen(true);
                    }}
                    className="ml-3 flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-[10.5px] font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-600" />
                    카드 영수증 일괄 등록
                  </button>
                </div>

                {/* 교차 필터 드롭다운 UI */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadCardsExcel(cardTxList)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer mr-2"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    엑셀 다운로드
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400">카드사:</span>
                    <select
                      value={selectedCardCompanyId}
                      onChange={(e) => setSelectedCardCompanyId(e.target.value)}
                      className="border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-amber-500 transition-all cursor-pointer"
                    >
                      <option value="all">전체 카드사</option>
                      <option value="shinhan-card">신한카드</option>
                      <option value="kb-card">KB국민카드</option>
                      <option value="nh-card">NH농협카드</option>
                      <option value="bc-card">BC카드</option>
                      <option value="hana-card">하나카드</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400">카드번호:</span>
                    <select
                      value={selectedCardNumber}
                      onChange={(e) => setSelectedCardNumber(e.target.value)}
                      className="border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-amber-500 transition-all cursor-pointer"
                    >
                      <option value="all">전체 번호</option>
                      {/* 고유 카드번호 추출 및 렌더링 */}
                      {Array.from(new Set(cardTxList.map(tx => tx.cardNumber).filter(Boolean))).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400">
                      <th className="p-4 w-28">사용일시</th>
                      <th className="p-4 w-28">승인번호</th>
                      <th className="p-4 w-44">카드사 / 카드번호</th>
                      <th className="p-4 min-w-[180px]">계정과목 (대 〉 중 〉 소)</th>
                      <th className="p-4">가맹점명</th>
                      <th className="p-4 min-w-[120px] text-amber-600 font-extrabold">🏷️ 태그</th>
                      <th className="p-4 text-right w-28">사용금액</th>
                      <th className="p-4 w-20">승인상태</th>
                      <th className="p-4 text-center w-24">영수증</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableSkeleton cols={9} rows={5} />
                    ) : (
                      cardTxList.map((tx) => {
                        const isCancelled = tx.status === "취소";
                        const catHier = getCategoryHierarchy(tx.category, dbCategories);
                        const badgeStyle = getCategoryBadgeStyle(catHier.main);

                        return (
                          <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/40 text-xs text-slate-700">
                            <td className="p-4 font-mono font-medium text-slate-400">
                              <div>{tx.date}</div>
                              {tx.time && (
                                <div className="text-[10px] text-slate-400/80 mt-0.5">{tx.time}</div>
                              )}
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-500 font-semibold tracking-wider">
                              {tx.approvalNumber || "-"}
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-800">{tx.cardCompanyName}</span>
                              <span className="ml-2 font-mono text-[10px] text-slate-400 tracking-wider">({tx.cardNumber})</span>
                            </td>
                            <td className="p-4">
                              {hasAdminAccess && editingCardTxId === tx.id && editingField === "category" ? (
                                (() => {
                                  // 💡 동적 베이지안 확률 추천에 근거해 높은 확률 순서대로 정렬 & 검색어 필터링 병행 기동
                                  const recommendations = getDynamicRecommendations(tx.merchantName, tx.memo || "");
                                  
                                  let filteredList = [...dbCategories];
                                  
                                  // 검색어가 입력되어 있다면 매칭 검증
                                  if (categorySearchTerm.trim() !== "") {
                                    const term = categorySearchTerm.toLowerCase().trim();
                                    filteredList = filteredList.filter((c) => {
                                      const fullPath = `${c.main_category} ${c.mid_category} ${c.sub_category}`.toLowerCase();
                                      return fullPath.includes(term);
                                    });
                                  }
                                  
                                  // 추천 항목이 최상단에 먼저 노출되도록 정렬
                                  const sortedCategories = filteredList.sort((a, b) => {
                                    const indexA = recommendations.findIndex(r => r.category === a.sub_category);
                                    const indexB = recommendations.findIndex(r => r.category === b.sub_category);
                                    
                                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                    if (indexA !== -1) return -1;
                                    if (indexB !== -1) return 1;
                                    return 0;
                                  });

                                  return (
                                    <div className="relative flex items-center gap-1.5 min-w-[290px]">
                                      <div className="relative flex-1">
                                        <input
                                          type="text"
                                          value={categorySearchTerm}
                                          onChange={(e) => setCategorySearchTerm(e.target.value)}
                                          className="border border-amber-300 bg-amber-50 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-amber-500 w-full pr-6"
                                          placeholder="계정과목 검색 또는 직접 입력"
                                          autoFocus
                                        />
                                        {categorySearchTerm && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCategorySearchTerm("");
                                              setTempCategory("");
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold cursor-pointer"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                      
                                      {/* 절대 위치 프리미엄 자동완성 드롭다운 판넬 */}
                                      <div className="absolute left-0 top-full mt-1.5 w-full max-h-[220px] overflow-y-auto bg-white border border-slate-100/80 shadow-2xl rounded-xl z-50 p-1.5 flex flex-col gap-0.5 scrollbar-thin">
                                        {sortedCategories.map((c) => {
                                          const recItem = recommendations.find(r => r.category === c.sub_category);
                                          const isSelected = tempCategory === c.sub_category;
                                          
                                          return (
                                            <button
                                              key={c.id}
                                              type="button"
                                              onClick={() => {
                                                setTempCategory(c.sub_category);
                                                setCategorySearchTerm(c.sub_category); // 선택된 소분류를 검색창 텍스트로 연동
                                              }}
                                              className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] transition-all flex flex-col leading-tight cursor-pointer ${
                                                isSelected
                                                  ? "bg-amber-500 text-white font-extrabold shadow-sm"
                                                  : "hover:bg-slate-50 text-slate-700"
                                              }`}
                                            >
                                              <div className="flex items-center justify-between w-full">
                                                <span className={isSelected ? "text-white" : "text-slate-700 font-bold"}>
                                                  {c.mid_category} 〉 {c.sub_category}
                                                </span>
                                                {recItem && (
                                                  <span className={`text-[8.5px] font-extrabold px-1 rounded ${isSelected ? "bg-white/20 text-white" : "bg-amber-50 text-amber-600"}`}>
                                                    ⭐ {recItem.percentage}%
                                                  </span>
                                                )}
                                              </div>
                                              <span className={`text-[8px] mt-0.5 ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                                                {c.main_category}
                                              </span>
                                            </button>
                                          );
                                        })}
                                        {sortedCategories.length === 0 && (
                                          <span className="text-[10px] text-slate-400 p-4 text-center font-medium">매칭되는 계정과목이 없습니다.</span>
                                        )}
                                      </div>
                                      
                                      <button
                                        onClick={() => handleUpdateCardTransaction(tx.id, { category: tempCategory })}
                                        className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-all whitespace-nowrap active:scale-95 shadow-xs cursor-pointer"
                                        disabled={isUpdatingCardTx || !tempCategory}
                                      >
                                        저장
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingCardTxId(null);
                                          setEditingField(null);
                                        }}
                                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="flex flex-col gap-1.5 w-full">
                                  {/* 원래의 계정과목 배지 표시 */}
                                  <div 
                                    className={`flex items-center gap-1.5 flex-wrap ${hasAdminAccess ? "cursor-pointer hover:bg-amber-50/50 p-1.5 rounded-xl transition-all group" : ""}`}
                                    onClick={() => {
                                      if (hasAdminAccess) {
                                        setEditingCardTxId(tx.id);
                                        setEditingField("category");
                                        setTempCategory(tx.category || "");
                                        setCategorySearchTerm(tx.category || "");
                                      }
                                    }}
                                    title={
                                      tx.applied_rule_id 
                                        ? `[자동 분류 규칙] ${tx.applied_rule_text}` 
                                        : (hasAdminAccess ? "클릭하여 계정과목 수정" : undefined)
                                    }
                                  >
                                    {tx.applied_rule_id && (
                                      <span 
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[8.5px] font-extrabold shadow-sm animate-pulse"
                                        title={`[자동 분류 규칙] ${tx.applied_rule_text}`}
                                      >
                                        <Sparkles className="w-2.5 h-2.5 text-white" />
                                        자연어 자동분류
                                      </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${badgeStyle}`}>
                                      {catHier.main}
                                    </span>
                                    <span className="text-[9px] text-slate-300 font-bold">〉</span>
                                    <span className="text-[11px] font-extrabold text-slate-700">{catHier.mid}</span>
                                    <span className="text-[9px] text-slate-300 font-bold">〉</span>
                                    <span className="text-[11px] font-bold text-slate-400">{catHier.sub}</span>
                                    {hasAdminAccess && (
                                      <span className="ml-auto opacity-0 group-hover:opacity-100 text-amber-500 transition-opacity">
                                        <Edit className="w-3 h-3" />
                                      </span>
                                    )}
                                  </div>

                                  {/* 🤖 최고관리자 전용: 미지출/미분류 건에 대한 실시간 자율 학습형 AI 확률 추천 후보군 가이드 칩 */}
                                  {hasAdminAccess && (!tx.category || tx.category.trim() === "" || tx.category === "기타") && (
                                    <div className="flex flex-col gap-1 mt-1 p-2 bg-slate-50 border border-slate-100 rounded-xl max-w-[280px]">
                                      <div className="text-[8.5px] font-extrabold text-slate-400/90 flex items-center gap-1">
                                        <span>🤖 AI 자율 정산 추천 후보군</span>
                                      </div>
                                      <div className="flex flex-col gap-1 mt-1">
                                        {getDynamicRecommendations(
                                          tx.merchantName, 
                                          editingCardTxId === tx.id && editingField === "memo" ? tempMemo : (tx.memo || "")
                                        ).slice(0, 3).map((rec, index) => {
                                          const recHier = getCategoryHierarchy(rec.category, dbCategories);
                                          const recTags = rec.tags.map(t => `#${t}`).join(" ");
                                          return (
                                            <div 
                                              key={index} 
                                              className="flex items-center justify-between gap-2 p-1 hover:bg-white rounded-lg border border-transparent hover:border-slate-200/60 transition-all text-[10px] group"
                                            >
                                              <span className="font-mono text-[9px] text-amber-600 font-bold bg-amber-50 px-1 rounded">
                                                {rec.percentage}%
                                              </span>
                                              <div className="flex flex-col text-slate-500 truncate flex-1 leading-tight">
                                                <span className="font-semibold text-slate-700 text-[10px]">
                                                  {recHier.mid} 〉 {recHier.sub}
                                                </span>
                                                {recTags && (
                                                  <span className="text-[8.5px] text-slate-400 truncate mt-0.5">
                                                    {recTags}
                                                  </span>
                                                )}
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  // 추천 카테고리와 태그를 한 번에 일괄 동시 적용 및 저장 기동!
                                                  handleUpdateCardTransaction(tx.id, {
                                                    category: rec.category,
                                                    memo: rec.tags.join(", ")
                                                  });
                                                }}
                                                className="px-1.5 py-0.5 bg-slate-200 hover:bg-amber-500 hover:text-white text-slate-600 rounded-md text-[9px] font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95"
                                              >
                                                적용
                                              </button>
                                            </div>
                                          );
                                        })}
                                        {getDynamicRecommendations(
                                          tx.merchantName, 
                                          editingCardTxId === tx.id && editingField === "memo" ? tempMemo : (tx.memo || "")
                                        ).length === 0 && (
                                          <span className="text-[9px] text-slate-300 font-light">추천 후보를 구성하는 중...</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="font-extrabold text-slate-800">{tx.merchantName}</span>
                            </td>
                            <td className="p-4 max-w-[150px]">
                              {hasAdminAccess && editingCardTxId === tx.id && editingField === "memo" ? (
                                <div className="flex flex-col gap-1.5 p-1 bg-white rounded-2xl border border-slate-100 shadow-lg min-w-[220px]">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={tempMemo}
                                      onChange={(e) => setTempMemo(e.target.value)}
                                      className="border border-amber-300 bg-amber-50 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                      placeholder="쉼표로 태그 구분"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleUpdateCardTransaction(tx.id, { memo: tempMemo });
                                        } else if (e.key === "Escape") {
                                          setEditingCardTxId(null);
                                          setEditingField(null);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => handleUpdateCardTransaction(tx.id, { memo: tempMemo })}
                                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 whitespace-nowrap"
                                      disabled={isUpdatingCardTx}
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingCardTxId(null);
                                        setEditingField(null);
                                      }}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-bold transition-all active:scale-95 whitespace-nowrap"
                                    >
                                      취소
                                    </button>
                                  </div>
                                  
                                  {/* 💡 태그 프리셋 가이드 칩 UI */}
                                  <div className="mt-1 p-2 bg-slate-50/50 rounded-xl border border-slate-100/60">
                                    <div className="text-[9px] font-extrabold text-slate-400 mb-1.5">사용할 수 있는 태그 목록 (클릭 토글)</div>
                                    <div className="flex flex-wrap gap-1">
                                      {dbTags.map((tag) => {
                                        const isSelected = tempMemo.split(",")
                                          .map(t => t.trim())
                                          .filter(Boolean)
                                          .includes(tag.name);
                                        return (
                                          <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => handleTagToggle(tag.name)}
                                            className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border transition-all active:scale-95 cursor-pointer ${
                                              isSelected
                                                ? "bg-amber-500 text-white border-amber-500 shadow-3xs"
                                                : "bg-white text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                                            }`}
                                          >
                                            #{tag.name}
                                          </button>
                                        );
                                      })}
                                      {dbTags.length === 0 && (
                                        <span className="text-[9px] text-slate-300 font-light">프리셋 태그를 로드할 수 없습니다.</span>
                                      )}
                                    </div>
                                    {hasAdminAccess && (
                                      <div className="mt-2 pt-1.5 border-t border-slate-100/60 flex justify-end">
                                        <a
                                          href="/expenses"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[9px] font-black text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-0.5 animate-pulse"
                                        >
                                          ⚙️ 태그 관리 바로가기
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className={`min-h-[28px] flex items-center w-full ${hasAdminAccess ? "cursor-pointer hover:bg-amber-50/50 p-1.5 rounded-xl transition-all group" : ""}`}
                                  onClick={() => {
                                    if (hasAdminAccess) {
                                      setEditingCardTxId(tx.id);
                                      setEditingField("memo");
                                      setTempMemo(tx.memo || "");
                                    }
                                  }}
                                  title={hasAdminAccess ? "클릭하여 비고(태그) 수정" : undefined}
                                >
                                  {tx.memo ? (
                                    <div className="flex flex-wrap gap-1 items-center w-full">
                                      {tx.memo.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                                        <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-100/60 shadow-3xs">
                                          #{tag}
                                        </span>
                                      ))}
                                      {hasAdminAccess && (
                                        <span className="ml-auto opacity-0 group-hover:opacity-100 text-amber-500 transition-opacity">
                                          <Edit className="w-3 h-3" />
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between w-full">
                                      <span className="text-[10px] text-slate-300 font-light">-</span>
                                      {hasAdminAccess && (
                                        <span className="opacity-0 group-hover:opacity-100 text-amber-500 transition-opacity">
                                          <Edit className="w-3 h-3" />
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className={`p-4 text-right font-extrabold ${isCancelled ? "text-slate-400 line-through" : "text-slate-800"}`}>
                              ₩ {tx.amount?.toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                                  isCancelled
                                    ? "bg-red-50 text-red-500 border border-red-100"
                                    : "bg-blue-50 text-blue-600 border border-blue-100"
                                }`}
                              >
                                {tx.status || "승인"}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {tx.receiptUrl ? (
                                <button
                                  onClick={() => {
                                    setViewingReceiptUrl(tx.receiptUrl);
                                  }}
                                  className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold border border-amber-100"
                                  title="등록된 영수증 보기"
                                >
                                  <Search className="w-3.5 h-3.5" />
                                  보기
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setReceiptSelectedTxId(tx.id);
                                    setIsReceiptModalOpen(true);
                                  }}
                                  className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold border border-slate-200"
                                  title="실물 영수증 사진 등록"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  등록
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                    {!loading && cardTxList.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-slate-400 text-xs font-semibold">
                          해당 조회 조건에 맞는 법인카드 사용 내역이 존재하지 않습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>


              {/* 하단 페이지네이션 컴포넌트 */}
              {!loading && totalCount > 0 && (
                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  setCurrentPage={setCurrentPage}
                  totalCount={totalCount}
                />
              )}
            </div>
          </div>
        )}

          {/* TAB 3: 국세청 홈택스 자료 */}
          {activeTab === "hometax" && (
            <div className="space-y-6">
              {/* 국세청 전용 서브 탭 스위처 */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <button
                  onClick={() => setHometaxSubTab("invoice")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    hometaxSubTab === "invoice"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  매출·매입 전자세금계산서
                </button>
                <button
                  onClick={() => setHometaxSubTab("exempt")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    hometaxSubTab === "exempt"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  면세 전자계산서
                </button>
                <button
                  onClick={() => setHometaxSubTab("cash")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    hometaxSubTab === "cash"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  현금영수증 발행 내역
                </button>
              </div>

              {/* 국세청 데이터 보드 테이블 */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-bold text-slate-800 text-sm">
                      국세청 홈택스 {hometaxSubTab === "invoice" ? "전자세금계산서" : hometaxSubTab === "exempt" ? "전자계산서" : "현금영수증"} 명세서
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold ml-2">총 {totalCount}건</span>
                  </div>

                  {/* 세무 교차 필터 드롭다운 UI */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (hometaxSubTab === "cash") {
                          downloadHometaxCashExcel(cashReceiptList);
                        } else {
                          downloadHometaxInvoiceExcel(
                            hometaxSubTab === "exempt" ? taxExemptList : taxInvoiceList,
                            hometaxSubTab === "exempt"
                          );
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer mr-2"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      엑셀 다운로드
                    </button>
                    {(hometaxSubTab === "invoice" || hometaxSubTab === "exempt") && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400">구분:</span>
                        <select
                          value={invoiceType}
                          onChange={(e) => setInvoiceType(e.target.value as any)}
                          className="border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                        >
                          <option value="all">전체 내역</option>
                          <option value="sales">매출 (발행)</option>
                          <option value="purchase">매입 (수취)</option>
                        </select>
                      </div>
                    )}

                    {hometaxSubTab === "cash" && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400">용도:</span>
                        <select
                          value={selectedCashPurpose}
                          onChange={(e) => setSelectedCashPurpose(e.target.value)}
                          className="border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                        >
                          <option value="all">전체 용도</option>
                          <option value="소득공제">소득공제</option>
                          <option value="지출증빙">지출증빙</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    {/* 세금계산서 / 면세계산서 명세 */}
                    {(hometaxSubTab === "invoice" || hometaxSubTab === "exempt") && (
                      <>
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400">
                            <th className="p-4 w-32">발행일자</th>
                            <th className="p-4">구분</th>
                            <th className="p-4">공급받는자 / 공급자</th>
                            <th className="p-4">품목명</th>
                            <th className="p-4 min-w-[120px] text-amber-600 font-extrabold">🏷️ 태그</th>
                            <th className="p-4 text-right">공급가액</th>
                            <th className="p-4 text-right">부가세</th>
                            <th className="p-4 text-right">합계금액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <TableSkeleton cols={8} rows={5} />
                          ) : (
                            (hometaxSubTab === "invoice" ? taxInvoiceList : taxExemptList).map((inv) => {
                              const isSales = inv.invoiceType === "sales" || inv.invoiceType === "매출";
                              return (
                                <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/40 text-xs text-slate-700">
                                  <td className="p-4 font-mono font-medium text-slate-400">{inv.issueDate}</td>
                                  <td className="p-4">
                                    <span
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                                        isSales
                                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                          : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                      }`}
                                    >
                                      {isSales ? "매출" : "매입"}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="font-extrabold text-slate-800">
                                      {isSales ? inv.buyerName : inv.supplierName}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      사업자등록번호: {inv.id.split("-")[0] || "-"}
                                    </div>
                                  </td>
                                  <td className="p-4 font-semibold text-slate-600">{inv.itemName || "종합 광고 수수료"}</td>
                                  <td className="p-4 max-w-[150px]">
                                    {hasAdminAccess && editingHometaxTxId === inv.id && editingField === "memo" ? (
                                      <div className="flex flex-col gap-1.5 p-1 bg-white rounded-2xl border border-slate-100 shadow-lg min-w-[220px]">
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={tempMemo}
                                            onChange={(e) => setTempMemo(e.target.value)}
                                            className="border border-amber-300 bg-amber-50 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                            placeholder="쉼표로 태그 구분"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                handleUpdateHometaxTransaction(inv.id, hometaxSubTab === "invoice" ? "invoice" : "exempt", { memo: tempMemo });
                                              } else if (e.key === "Escape") {
                                                setEditingHometaxTxId(null);
                                                setEditingField(null);
                                              }
                                            }}
                                          />
                                          <button
                                            onClick={() => handleUpdateHometaxTransaction(inv.id, hometaxSubTab === "invoice" ? "invoice" : "exempt", { memo: tempMemo })}
                                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 whitespace-nowrap"
                                            disabled={isUpdatingHometaxTx}
                                          >
                                            저장
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingHometaxTxId(null);
                                              setEditingField(null);
                                            }}
                                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-bold transition-all active:scale-95 whitespace-nowrap"
                                          >
                                            취소
                                          </button>
                                        </div>
                                        
                                        {/* 💡 태그 프리셋 가이드 칩 UI */}
                                        <div className="mt-1 p-2 bg-slate-50/50 rounded-xl border border-slate-100/60">
                                          <div className="text-[9px] font-extrabold text-slate-400 mb-1.5">사용할 수 있는 태그 목록 (클릭 토글)</div>
                                          <div className="flex flex-wrap gap-1">
                                            {dbTags.map((tag) => {
                                              const isSelected = tempMemo.split(",")
                                                .map(t => t.trim())
                                                .filter(Boolean)
                                                .includes(tag.name);
                                              return (
                                                <button
                                                  key={tag.id}
                                                  type="button"
                                                  onClick={() => handleTagToggle(tag.name)}
                                                  className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border transition-all active:scale-95 cursor-pointer ${
                                                    isSelected
                                                      ? "bg-amber-500 text-white border-amber-500 shadow-3xs"
                                                      : "bg-white text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                                                  }`}
                                                >
                                                  #{tag.name}
                                                </button>
                                              );
                                            })}
                                            {dbTags.length === 0 && (
                                              <span className="text-[9px] text-slate-300 font-light">프리셋 태그를 로드할 수 없습니다.</span>
                                            )}
                                          </div>
                                          {hasAdminAccess && (
                                            <div className="mt-2 pt-1.5 border-t border-slate-100/60 flex justify-end">
                                              <a
                                                href="/expenses"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[9px] font-black text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-0.5 animate-pulse"
                                              >
                                                ⚙️ 태그 관리 바로가기
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div 
                                        className={`min-h-[28px] flex items-center w-full ${hasAdminAccess ? "cursor-pointer hover:bg-amber-50/50 p-1.5 rounded-xl transition-all group" : ""}`}
                                        onClick={() => {
                                          if (hasAdminAccess) {
                                            setEditingHometaxTxId(inv.id);
                                            setEditingField("memo");
                                            setTempMemo(inv.memo || "");
                                          }
                                        }}
                                        title={hasAdminAccess ? "클릭하여 비고(태그) 수정" : undefined}
                                      >
                                        {inv.memo ? (
                                          <div className="flex flex-wrap gap-1 items-center w-full">
                                            {inv.memo.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                                              <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-100/60 shadow-3xs">
                                                #{tag}
                                              </span>
                                            ))}
                                            {hasAdminAccess && (
                                              <span className="ml-auto opacity-0 group-hover:opacity-100 text-amber-500 transition-opacity">
                                                <Edit className="w-3 h-3" />
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-slate-300 font-bold select-none group-hover:text-amber-500 transition-colors">
                                            -
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-4 text-right font-bold text-slate-700">
                                    ₩ {inv.supplyAmount?.toLocaleString()}
                                  </td>
                                  <td className="p-4 text-right font-semibold text-slate-400">
                                    ₩ {inv.taxAmount?.toLocaleString()}
                                  </td>
                                  <td className="p-4 text-right font-extrabold text-slate-800">
                                    ₩ {inv.totalAmount?.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                          {!loading && (hometaxSubTab === "invoice" ? taxInvoiceList : taxExemptList).length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-12 text-center text-slate-400 text-xs font-semibold">
                                해당 조회 조건에 맞는 홈택스 전자(세금)계산서 자료가 존재하지 않습니다.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </>
                    )}

                    {/* 현금영수증 명세 */}
                    {hometaxSubTab === "cash" && (
                      <>
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400">
                            <th className="p-4 w-32">거래일자</th>
                            <th className="p-4">가맹점 / 승인번호</th>
                            <th className="p-4">용도구분</th>
                            <th className="p-4 min-w-[120px] text-amber-600 font-extrabold">🏷️ 태그</th>
                            <th className="p-4 text-right">공급가액</th>
                            <th className="p-4 text-right">부가세</th>
                            <th className="p-4 text-right">합계금액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <TableSkeleton cols={7} rows={5} />
                          ) : (
                            cashReceiptList.map((rcpt) => (
                              <tr key={rcpt.id} className="border-b border-slate-50 hover:bg-slate-50/40 text-xs text-slate-700">
                                <td className="p-4 font-mono font-medium text-slate-400">{rcpt.transactionDate}</td>
                                <td className="p-4">
                                  <div className="font-extrabold text-slate-800">{rcpt.franchiseName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">승인: {rcpt.approvalNumber}</div>
                                </td>
                                <td className="p-4">
                                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    {rcpt.purpose || "지출증빙용"}
                                  </span>
                                </td>
                                <td className="p-4 max-w-[150px]">
                                  {hasAdminAccess && editingHometaxTxId === rcpt.id && editingField === "memo" ? (
                                    <div className="flex flex-col gap-1.5 p-1 bg-white rounded-2xl border border-slate-100 shadow-lg min-w-[220px]">
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="text"
                                          value={tempMemo}
                                          onChange={(e) => setTempMemo(e.target.value)}
                                          className="border border-amber-300 bg-amber-50 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-amber-500 w-full"
                                          placeholder="쉼표로 태그 구분"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              handleUpdateHometaxTransaction(rcpt.id, "cash", { memo: tempMemo });
                                            } else if (e.key === "Escape") {
                                              setEditingHometaxTxId(null);
                                              setEditingField(null);
                                            }
                                          }}
                                        />
                                        <button
                                          onClick={() => handleUpdateHometaxTransaction(rcpt.id, "cash", { memo: tempMemo })}
                                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 whitespace-nowrap"
                                          disabled={isUpdatingHometaxTx}
                                        >
                                          저장
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingHometaxTxId(null);
                                            setEditingField(null);
                                          }}
                                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-bold transition-all active:scale-95 whitespace-nowrap"
                                        >
                                          취소
                                        </button>
                                      </div>
                                      
                                      {/* 💡 태그 프리셋 가이드 칩 UI */}
                                      <div className="mt-1 p-2 bg-slate-50/50 rounded-xl border border-slate-100/60">
                                        <div className="text-[9px] font-extrabold text-slate-400 mb-1.5">사용할 수 있는 태그 목록 (클릭 토글)</div>
                                        <div className="flex flex-wrap gap-1">
                                          {dbTags.map((tag) => {
                                            const isSelected = tempMemo.split(",")
                                              .map(t => t.trim())
                                              .filter(Boolean)
                                              .includes(tag.name);
                                            return (
                                              <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => handleTagToggle(tag.name)}
                                                className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border transition-all active:scale-95 cursor-pointer ${
                                                  isSelected
                                                    ? "bg-amber-500 text-white border-amber-500 shadow-3xs"
                                                    : "bg-white text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                                                }`}
                                              >
                                                #{tag.name}
                                              </button>
                                            );
                                          })}
                                          {dbTags.length === 0 && (
                                            <span className="text-[9px] text-slate-300 font-light">프리셋 태그를 로드할 수 없습니다.</span>
                                          )}
                                        </div>
                                        {hasAdminAccess && (
                                          <div className="mt-2 pt-1.5 border-t border-slate-100/60 flex justify-end">
                                            <a
                                              href="/expenses"
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-[9px] font-black text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-0.5 animate-pulse"
                                            >
                                              ⚙️ 태그 관리 바로가기
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div 
                                      className={`min-h-[28px] flex items-center w-full ${hasAdminAccess ? "cursor-pointer hover:bg-amber-50/50 p-1.5 rounded-xl transition-all group" : ""}`}
                                      onClick={() => {
                                        if (hasAdminAccess) {
                                          setEditingHometaxTxId(rcpt.id);
                                          setEditingField("memo");
                                          setTempMemo(rcpt.memo || "");
                                        }
                                      }}
                                      title={hasAdminAccess ? "클릭하여 비고(태그) 수정" : undefined}
                                    >
                                      {rcpt.memo ? (
                                        <div className="flex flex-wrap gap-1 items-center w-full">
                                          {rcpt.memo.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                                            <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-100/60 shadow-3xs">
                                              #{tag}
                                            </span>
                                          ))}
                                          {hasAdminAccess && (
                                            <span className="ml-auto opacity-0 group-hover:opacity-100 text-amber-500 transition-opacity">
                                              <Edit className="w-3 h-3" />
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-slate-300 font-bold select-none group-hover:text-amber-500 transition-colors">
                                          -
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-right font-bold text-slate-700">
                                  ₩ {rcpt.supplyAmount?.toLocaleString()}
                                </td>
                                <td className="p-4 text-right font-semibold text-slate-400">
                                  ₩ {rcpt.taxAmount?.toLocaleString()}
                                </td>
                                <td className="p-4 text-right font-extrabold text-slate-800">
                                  ₩ {rcpt.totalAmount?.toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                          {!loading && cashReceiptList.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-12 text-center text-slate-400 text-xs font-semibold">
                                해당 조회 조건에 맞는 국세청 현금영수증 내역이 존재하지 않습니다.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </>
                    )}
                  </table>
                </div>
                {/* 하단 페이지네이션 컴포넌트 */}
                {!loading && totalCount > 0 && (
                  <PaginationBar
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                    setCurrentPage={setCurrentPage}
                    totalCount={totalCount}
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 4: 금융 동기화 역사 */}
          {activeTab === "sync" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. 은행/카드 뱅킹 동기화 로그 */}
              <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
                  <RefreshCw className="w-4 h-4 text-blue-500" />
                  뱅킹 & 카드 데이터 스크래핑 동기화 로그
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {syncHistory.map((log) => (
                    <div key={log.id} className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-start gap-3">
                      {log.status === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-slate-800">{log.operationType}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{log.startedAt?.replace("T", " ")}</span>
                        </div>
                        {log.recordsCount !== undefined && (
                          <p className="text-[11px] font-medium text-slate-500">
                            동기화 결과: <strong className="text-blue-600">{log.recordsCount}건</strong>의 거래 레코드 갱신 완료
                          </p>
                        )}
                        {log.errorMessage && (
                          <p className="text-[11px] text-rose-500 font-medium">{log.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {syncHistory.length === 0 && (
                    <div className="text-center text-slate-400 py-12 text-xs font-semibold">
                      기록된 은행/카드 스크래핑 동기화 이력이 없습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* 2. 국세청 홈택스 동기화 역사 */}
              <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  국세청 홈택스 엑셀 임포트 & 스크래핑 로그
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {hometaxSync.map((log, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-slate-800">{log.fileName || "홈택스 데이터 자동 스크래핑"}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{log.importedAt || "-"}</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500">
                          임포트 세부: 세금계산서 <strong className="text-emerald-600">{log.invoiceCount || 0}건</strong>, 현금영수증 <strong className="text-emerald-600">{log.receiptCount || 0}건</strong> 성공적 갱신
                        </p>
                      </div>
                    </div>
                  ))}
                  {hometaxSync.length === 0 && (
                    <div className="text-center text-slate-400 py-12 text-xs font-semibold">
                      기록된 국세청 증빙 스크래핑/동기화 이력이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 6. 인터넷뱅킹 거래 내역 엑셀 수동 가져오기 UI */}
      <UploadExcelModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        accounts={accounts}
        onSuccess={handleRefresh}
      />

      {/* 7. 국세청 홈택스 엑셀 수동 가져오기 UI */}
      <UploadHometaxModal
        isOpen={isHometaxModalOpen}
        onClose={() => setIsHometaxModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* 8. 신용카드 수동 엑셀 업로드 모달 UI */}
      <UploadCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* 9. 카드 영수증 사진 다중 등록 및 뷰어 모달 */}
      <ReceiptViewerModal
        isOpen={isReceiptModalOpen || !!viewingReceiptUrl}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setViewingReceiptUrl(null);
        }}
        txId={receiptSelectedTxId}
        receiptUrl={viewingReceiptUrl}
        cardTxList={cardTxList}
        onSuccess={handleRefresh}
      />
    </div>
  );
}




// 펄싱(Pulsing) 스켈레톤 UI 컴포넌트
function TableSkeleton({ cols, rows }: { cols: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-slate-50">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="p-4">
              <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-full"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// 페이지네이션 바 하단 컴포넌트
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  setCurrentPage: (page: number) => void;
  totalCount: number;
}

function PaginationBar({
  currentPage,
  totalPages,
  pageSize,
  setPageSize,
  setCurrentPage,
  totalCount
}: PaginationProps) {
  return (
    <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* 10/30/50개 단위 조절 셀렉터 */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
        <span>페이지당 줄 수:</span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="border border-slate-200 bg-white rounded-lg px-2.5 py-1 text-slate-700 font-bold outline-none cursor-pointer"
        >
          <option value={10}>10개씩 보기</option>
          <option value={30}>30개씩 보기</option>
          <option value={50}>50개씩 보기</option>
        </select>
        <span className="text-slate-400">| 총 {totalCount}개 중 {(currentPage - 1) * pageSize + 1}~{Math.min(totalCount, currentPage * pageSize)} 표시</span>
      </div>

      {/* 페이지 번호 네비게이터 */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNum = idx + 1;
          const isCurrent = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isCurrent
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
