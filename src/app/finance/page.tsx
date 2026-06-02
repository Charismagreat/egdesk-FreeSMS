"use client";

import { useState, useEffect, useCallback } from "react";
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
  Sparkles
} from "lucide-react";

// 타입 정의
interface Account {
  id: string;
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  updatedAt?: string;
}

interface Transaction {
  id: string;
  date: string;
  time?: string;
  amount: number;
  balance?: number;
  type: "deposit" | "withdrawal" | "입금" | "출금";
  description: string;
  category?: string;
  bankName?: string;
  accountNumber?: string;
}

interface CardTransaction {
  id: string;
  date: string;
  time?: string;
  amount: number;
  merchantName: string;
  cardNumber: string;
  cardCompanyName: string;
  status: string; // 승인, 취소 등
  category?: string;
  receiptUrl?: string;
}

interface HometaxInvoice {
  id: string;
  issueDate: string;
  supplierName: string;
  buyerName: string;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  itemName?: string;
  invoiceType: "sales" | "purchase" | "매출" | "매입";
  taxType?: string;
}

interface HometaxCash {
  id: string;
  transactionDate: string;
  franchiseName: string;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  approvalNumber: string;
  purpose?: string; // 소득공제, 지출증빙
}

interface SyncLog {
  id: string;
  operationType: string;
  status: "success" | "failed" | string;
  startedAt: string;
  completedAt?: string;
  recordsCount?: number;
  errorMessage?: string;
}

export default function FinancePage() {
  // 메인 탭 상태: accounts (은행 계좌 & 거래), cards (신용카드), hometax (국세청 자료), sync (동기화 역사)
  const [activeTab, setActiveTab] = useState<"accounts" | "cards" | "hometax" | "sync">("accounts");
  
  // 엑셀 수동 업로드 모달 관련 상태
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadBankId, setUploadBankId] = useState("shinhan");
  const [uploadAccountId, setUploadAccountId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 홈택스 엑셀 수동 업로드 모달 관련 상태
  const [isHometaxModalOpen, setIsHometaxModalOpen] = useState(false);
  const [hometaxKind, setHometaxKind] = useState("sales");
  const [hometaxBusinessNumber, setHometaxBusinessNumber] = useState("");
  const [hometaxFile, setHometaxFile] = useState<File | null>(null);
  const [isHometaxUploading, setIsHometaxUploading] = useState(false);
  const [hometaxUploadMessage, setHometaxUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 카드 엑셀 수동 업로드 모달 관련 상태
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardCompanyId, setCardCompanyId] = useState("shinhan-card");
  const [cardAccountId, setCardAccountId] = useState("CARD-IMPORT");
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [isCardUploading, setIsCardUploading] = useState(false);
  const [cardUploadMessage, setCardUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);


  
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

  // 페이징 & 필터 상태
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [invoiceType, setInvoiceType] = useState<"all" | "sales" | "purchase">("all");
  const [selectedCardCompanyId, setSelectedCardCompanyId] = useState<string>("all");
  const [selectedCardNumber, setSelectedCardNumber] = useState<string>("all");
  const [selectedCashPurpose, setSelectedCashPurpose] = useState<string>("all");

  // 카드 영수증 연동 및 뷰어 관련 상태
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptUploadFiles, setReceiptUploadFiles] = useState<File[]>([]);
  const [receiptSelectedTxId, setReceiptSelectedTxId] = useState<string>("");
  const [isReceiptUploading, setIsReceiptUploading] = useState(false);
  const [receiptUploadMessage, setReceiptUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [viewingReceiptIndex, setViewingReceiptIndex] = useState<number>(0);

  // 날짜 필터 (기본 헬퍼 함수 활용)
  const getFormattedDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getStartDateForBank = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // 최근 1주일
    return getFormattedDate(d);
  };

  const getStartDateForHometax = () => {
    const d = new Date();
    return `${d.getFullYear()}-01-01`; // 금년도 1월 1일
  };

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
  }, [activeTab, hometaxSubTab, searchText, invoiceType, startDate, endDate, pageSize, selectedCardCompanyId, selectedCardNumber, selectedCashPurpose]);

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
      const cashParams = `&cashPurpose=${selectedCashPurpose}`;
      const paginationParams = `&limit=${pageSize}&offset=${offset}`;

      // 2. 활성화된 메인 탭에 따라 각각 최적의 엔드포인트 패치
      if (activeTab === "accounts") {
        const txRes = await fetch(`/api/finance?tab=transactions${dateParams}${searchParam}${paginationParams}`).then((res) => res.json());
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
  }, [activeTab, hometaxSubTab, currentPage, pageSize, startDate, endDate, searchText, invoiceType, selectedCardCompanyId, selectedCardNumber, selectedCashPurpose]);

  // 은행 선택 변경 시 해당 은행의 계좌 자동 매칭 및 첫 번째 계좌 선택
  useEffect(() => {
    if (uploadBankId === "serp") {
      setUploadAccountId("");
    } else {
      const filtered = accounts.filter((acc) => acc.bankId === uploadBankId);
      if (filtered.length > 0) {
        setUploadAccountId(filtered[0].id);
      } else {
        setUploadAccountId("");
      }
    }
  }, [uploadBankId, accounts]);

  // 엑셀 업로드 요청 핸들러
  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadMessage({ type: "error", text: "업로드할 엑셀 파일을 선택해 주세요." });
      return;
    }
    if (uploadBankId !== "serp" && !uploadAccountId) {
      setUploadMessage({ type: "error", text: "해당 엑셀 거래 내역을 저장할 계좌를 선택해 주세요." });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("bankId", uploadBankId);
      fd.append("accountId", uploadAccountId);

      const res = await fetch("/api/finance/upload", {
        method: "POST",
        body: fd
      });
      
      if (!res.ok) {
        const errResult = await res.json().catch(() => ({}));
        throw new Error(errResult.error || `HTTP 에러 ${res.status}`);
      }

      const result = await res.json();

      if (result.success) {
        setUploadMessage({
          type: "success",
          text: `성공! 총 ${result.data?.parsedCount}건의 거래 내역이 이지데스크 금융 데이터베이스에 매핑 및 저장되었습니다.`
        });
        setUploadFile(null);
        // 성공 시 잠시 대기 후 모달을 닫고 데이터 리프레시 진행
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadMessage(null);
          handleRefresh();
        }, 2000);
      } else {
        setUploadMessage({ type: "error", text: result.error || "파일 가공 중 에러가 발생했습니다." });
      }
    } catch (err: any) {
      setUploadMessage({ type: "error", text: err.message || "서버 통신 중 시스템 에러가 발생했습니다." });
    } finally {
      setIsUploading(false);
    }
  };

  // 홈택스 엑셀 업로드 요청 핸들러
  const handleHometaxUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hometaxFile) {
      setHometaxUploadMessage({ type: "error", text: "업로드할 국세청 엑셀 파일을 선택해 주세요." });
      return;
    }
    if (hometaxKind === "cash-receipt" && !hometaxBusinessNumber) {
      setHometaxUploadMessage({ type: "error", text: "현금영수증 적재를 위해 사업자등록번호를 기입해 주세요." });
      return;
    }

    setIsHometaxUploading(true);
    setHometaxUploadMessage(null);

    try {
      const fd = new FormData();
      fd.append("file", hometaxFile);
      fd.append("kind", hometaxKind);
      fd.append("businessNumber", hometaxBusinessNumber);

      const res = await fetch("/api/finance/hometax-upload", {
        method: "POST",
        body: fd
      });
      
      if (!res.ok) {
        const errResult = await res.json().catch(() => ({}));
        throw new Error(errResult.error || `HTTP 에러 ${res.status}`);
      }

      const result = await res.json();

      if (result.success) {
        const { insertedCount, duplicateCount, totalCount } = result.data || {};
        setHometaxUploadMessage({
          type: "success",
          text: `성공! 총 ${totalCount}건의 자료 중 신규 ${insertedCount}건 적재 완료 (중복 ${duplicateCount}건 제외).`
        });
        setHometaxFile(null);
        // 성공 시 대기 후 새로고침 및 모달 닫기
        setTimeout(() => {
          setIsHometaxModalOpen(false);
          setHometaxUploadMessage(null);
          handleRefresh();
        }, 2200);
      } else {
        setHometaxUploadMessage({ type: "error", text: result.error || "파일 가공 중 에러가 발생했습니다." });
      }
    } catch (err: any) {
      setHometaxUploadMessage({ type: "error", text: err.message || "서버 통신 중 에러가 발생했습니다." });
    } finally {
      setIsHometaxUploading(false);
    }
  };

  // 카드 엑셀 업로드 요청 핸들러
  const handleCardUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardFile) {
      setCardUploadMessage({ type: "error", text: "업로드할 신용카드 엑셀 파일을 선택해 주세요." });
      return;
    }

    setIsCardUploading(true);
    setCardUploadMessage(null);

    try {
      const fd = new FormData();
      fd.append("file", cardFile);
      fd.append("cardCompanyId", cardCompanyId);
      fd.append("accountId", cardAccountId);

      const res = await fetch("/api/finance/card-upload", {
        method: "POST",
        body: fd
      });
      
      if (!res.ok) {
        const errResult = await res.json().catch(() => ({}));
        throw new Error(errResult.error || `HTTP 에러 ${res.status}`);
      }

      const result = await res.json();

      if (result.success) {
        setCardUploadMessage({
          type: "success",
          text: `성공! 총 ${result.data?.insertedCount}건의 카드 거래 내역이 이지데스크 금융 데이터베이스에 등록되었습니다.`
        });
        setCardFile(null);
        // 성공 시 대기 후 새로고침 및 모달 닫기
        setTimeout(() => {
          setIsCardModalOpen(false);
          setCardUploadMessage(null);
          handleRefresh();
        }, 2200);
      } else {
        setCardUploadMessage({ type: "error", text: result.error || "파일 가공 중 에러가 발생했습니다." });
      }
    } catch (err: any) {
      setCardUploadMessage({ type: "error", text: err.message || "오류가 발생했습니다." });
    } finally {
      setIsCardUploading(false);
    }
  };

  // AI OCR 분석을 통한 거래 건 자동 식별 및 매칭 함수
  const analyzeReceiptWithAI = async (file: File) => {
    setReceiptUploadMessage({ type: "success", text: "AI가 영수증 이미지를 정밀 분석하여 적합한 결제 거래 건을 지능형 자동 식별 중입니다..." });
    setIsReceiptUploading(true);
    
    try {
      // 1. 파일을 Base64로 인코딩
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;
      
      // 2. OCR API 호출
      const res = await fetch("/api/expenses/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          filename: file.name,
          mimeType: file.type
        })
      });
      
      if (!res.ok) throw new Error("OCR API 서버 응답 실패");
      
      const ocrResult = await res.json();
      if (ocrResult.success) {
        const { amount, expense_date, title } = ocrResult;
        
        // 3. 지능형 자동 식별 매칭 알고리즘 가동
        let matchedTx = null;
        
        // 우선순위 1: 금액이 정확히 일치하고 날짜도 일치하는 건
        matchedTx = cardTxList.find(tx => 
          Math.floor(tx.amount || 0) === Math.floor(amount) && 
          tx.date === expense_date
        );
        
        // 우선순위 2: 금액만 정확히 일치하는 건
        if (!matchedTx) {
          matchedTx = cardTxList.find(tx => 
            Math.floor(tx.amount || 0) === Math.floor(amount)
          );
        }
        
        // 우선순위 3: 가맹점명이 유사한 건
        if (!matchedTx) {
          const cleanTitle = (title || "").replace(/\s/g, "").toLowerCase();
          matchedTx = cardTxList.find(tx => {
            const cleanMerchant = (tx.merchantName || "").replace(/\s/g, "").toLowerCase();
            return cleanTitle.includes(cleanMerchant) || cleanMerchant.includes(cleanTitle);
          });
        }
        
        // 우선순위 4: 오차가 적은 결제 내역 매칭 (오차 1만원 이하)
        if (!matchedTx && cardTxList.length > 0) {
          const sortedByDiff = [...cardTxList].sort((a, b) => 
            Math.abs(a.amount - amount) - Math.abs(b.amount - amount)
          );
          if (Math.abs(sortedByDiff[0].amount - amount) <= 10000) {
            matchedTx = sortedByDiff[0];
          }
        }
        
        if (matchedTx) {
          setReceiptSelectedTxId(matchedTx.id);
          setReceiptUploadMessage({
            type: "success",
            text: `[지능형 자동 식별 성공] AI가 영수증에서 ₩${Number(amount).toLocaleString()} 지출을 감지하여 '${matchedTx.merchantName}' 거래 건에 완벽하게 자동 선택 매칭하였습니다.`
          });
        } else {
          setReceiptUploadMessage({
            type: "success",
            text: `[AI 영수증 분석 완료] ₩${Number(amount).toLocaleString()} 지출을 식별하였으나, 목록 내에 일치하는 금액의 결제 내역이 보이지 않습니다. 연결할 거래를 드롭다운에서 수동으로 선택해 주세요.`
          });
        }
      } else {
        throw new Error(ocrResult.error || "분석 실패");
      }
    } catch (err: any) {
      console.error("AI OCR 매칭 에러:", err);
      setReceiptUploadMessage({
        type: "error",
        text: `지능형 OCR 분석 중 통신 오류가 발생했으나 파일은 정상 수동 등록 가능합니다.`
      });
    } finally {
      setIsReceiptUploading(false);
    }
  };

  // 카드 영수증 다중 업로드 핸들러
  const handleReceiptUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptUploadFiles || receiptUploadFiles.length === 0) {
      setReceiptUploadMessage({ type: "error", text: "업로드할 영수증 사진을 선택해 주세요." });
      return;
    }
    if (!receiptSelectedTxId) {
      setReceiptUploadMessage({ type: "error", text: "연결할 카드 거래 승인 내역을 지정해 주세요." });
      return;
    }

    setIsReceiptUploading(true);
    setReceiptUploadMessage(null);

    try {
      const fd = new FormData();
      receiptUploadFiles.forEach((file) => {
        fd.append("file", file);
      });
      fd.append("id", receiptSelectedTxId);

      const res = await fetch("/api/finance/receipt", {
        method: "POST",
        body: fd
      });

      if (!res.ok) {
        throw new Error(`HTTP 에러 ${res.status}`);
      }

      const result = await res.json();
      if (result.success) {
        setReceiptUploadMessage({
          type: "success",
          text: `성공! 총 ${receiptUploadFiles.length}장의 카드 영수증 사진이 해당 카드 승인 내역에 매핑 및 저장되었습니다.`
        });
        setReceiptUploadFiles([]);
        setTimeout(() => {
          setIsReceiptModalOpen(false);
          setReceiptUploadMessage(null);
          handleRefresh(); // 데이터 리프레시
        }, 1500);
      } else {
        setReceiptUploadMessage({ type: "error", text: result.error || "파일 가공 중 에러가 발생했습니다." });
      }
    } catch (err: any) {
      setReceiptUploadMessage({ type: "error", text: err.message || "서버 통신 중 에러가 발생했습니다." });
    } finally {
      setIsReceiptUploading(false);
    }
  };




  // 실시간 동기화 강제 새로고침 시 트리거
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFinanceData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

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

  return (
    <div className="space-y-6 pb-24 max-w-[1600px] mx-auto px-4 md:px-8">
      {/* 1. 상단 웰컴 및 실시간 동기화 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Landmark className="w-8 h-8 text-blue-600" />
            금융 정보 AI
            <span className="text-sm font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              실시간 DB 연동
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsUploadModalOpen(true);
              setUploadFile(null);
              setUploadMessage(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 border border-transparent rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            인터넷뱅킹 엑셀 가져오기
          </button>

          <button
            onClick={() => {
              setIsCardModalOpen(true);
              setCardFile(null);
              setCardUploadMessage(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 border border-transparent rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            신용카드 엑셀 가져오기
          </button>

          <button
            onClick={() => {
              setIsHometaxModalOpen(true);
              setHometaxFile(null);
              setHometaxUploadMessage(null);
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-600/30 text-blue-200 rounded border border-blue-500/20">
                          {acc.bankName}
                        </span>
                        <span className="text-white text-xs font-bold">{acc.accountName}</span>
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
              <span className="text-[10px] text-slate-400 font-bold block">금년도 신용카드 지출총액</span>
              <span className="text-xl font-black text-slate-800 font-mono block">
                ₩ {summaryData.cardSummary.reduce((acc: number, curr: any) => acc + (curr.yTotal || 0), 0)?.toLocaleString()}
              </span>
            </div>
            
            <div className="text-right space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">이번 달 전체지출</span>
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
              <div className="space-y-2 p-2.5 rounded-2xl bg-emerald-50/40 border border-emerald-100/50">
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  매출액 (Sales)
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-medium">금월({summaryData.months[0]?.split("-")[1] || "5"}월)</span>
                    <span className="font-extrabold text-emerald-600 font-mono">₩{summaryData.hometaxSummary?.sales?.m0?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-medium">전월({summaryData.months[1]?.split("-")[1] || "4"}월)</span>
                    <span className="font-bold text-slate-600 font-mono">₩{summaryData.hometaxSummary?.sales?.m1?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-medium">전전월({summaryData.months[2]?.split("-")[1] || "3"}월)</span>
                    <span className="font-bold text-slate-600 font-mono">₩{summaryData.hometaxSummary?.sales?.m2?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 매입액 파트 */}
              <div className="space-y-2 p-2.5 rounded-2xl bg-rose-50/30 border border-rose-100/50">
                <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  매입액 (Purchase)
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-medium">금월({summaryData.months[0]?.split("-")[1] || "5"}월)</span>
                    <span className="font-extrabold text-rose-500 font-mono">₩{summaryData.hometaxSummary?.purchase?.m0?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-medium">전월({summaryData.months[1]?.split("-")[1] || "4"}월)</span>
                    <span className="font-bold text-slate-600 font-mono">₩{summaryData.hometaxSummary?.purchase?.m1?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-medium">전전월({summaryData.months[2]?.split("-")[1] || "3"}월)</span>
                    <span className="font-bold text-slate-600 font-mono">₩{summaryData.hometaxSummary?.purchase?.m2?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">올해 매출액 누계</span>
              <span className="text-lg font-black text-emerald-600 font-mono block">
                ₩ {summaryData.hometaxSummary?.sales?.yTotal?.toLocaleString()}
              </span>
            </div>
            
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">올해 매입액 누계</span>
              <span className="text-lg font-black text-rose-500 font-mono block">
                ₩ {summaryData.hometaxSummary?.purchase?.yTotal?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 슬라이딩 매출입 밸런스 비율 바 */}
          <div className="mt-4 space-y-1">
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
                      className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-lg"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
                          {acc.bankName}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">{acc.accountNumber}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 tracking-tight">{acc.accountName}</h4>
                        <p className="text-xl font-extrabold text-slate-800 mt-1">
                          ₩ {acc.balance?.toLocaleString()}
                        </p>
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
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-500" />
                    은행 통합 계좌 입출금 명세서
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">총 {totalCount}건의 거래</span>
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
                        <th className="p-4 text-right">입금액</th>
                        <th className="p-4 text-right">출금액</th>
                        <th className="p-4 text-right">잔액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <TableSkeleton cols={8} rows={5} />
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
                              <td className={`p-4 text-right font-extrabold ${isDeposit ? "text-emerald-600" : "text-slate-400"}`}>
                                {isDeposit ? `+ ₩ ${tx.amount?.toLocaleString()}` : "-"}
                              </td>
                              <td className={`p-4 text-right font-extrabold ${!isDeposit ? "text-rose-500" : "text-slate-400"}`}>
                                {!isDeposit ? `- ₩ ${tx.amount?.toLocaleString()}` : "-"}
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
                          <td colSpan={8} className="p-12 text-center text-slate-400 text-xs font-semibold">
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
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    법인 신용 카드 승인 내역 명세서
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold ml-2">총 {totalCount}건</span>
                </div>

                {/* 교차 필터 드롭다운 UI */}
                <div className="flex flex-wrap items-center gap-2">
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
                      <th className="p-4 w-32">사용일시</th>
                      <th className="p-4">카드사 / 카드번호</th>
                      <th className="p-4">가맹점명</th>
                      <th className="p-4 text-right">사용금액</th>
                      <th className="p-4">승인상태</th>
                      <th className="p-4 text-center w-24">영수증</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableSkeleton cols={6} rows={5} />
                    ) : (
                      cardTxList.map((tx) => {
                        const isCancelled = tx.status === "취소";
                        return (
                          <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/40 text-xs text-slate-700">
                            <td className="p-4 font-mono font-medium text-slate-400">
                              <div>{tx.date}</div>
                              {tx.time && (
                                <div className="text-[10px] text-slate-400/80 mt-0.5">{tx.time}</div>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-800">{tx.cardCompanyName}</span>
                              <span className="ml-2 font-mono text-[10px] text-slate-400 tracking-wider">({tx.cardNumber})</span>
                            </td>
                            <td className="p-4">
                              <span className="font-extrabold text-slate-800">{tx.merchantName}</span>
                              {tx.category && (
                                <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md">
                                  {tx.category}
                                </span>
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
                                    setViewingReceiptIndex(0);
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
                                    setReceiptUploadFiles([]);
                                    setReceiptUploadMessage(null);
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
                        <td colSpan={6} className="p-12 text-center text-slate-400 text-xs font-semibold">
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
                            <th className="p-4 text-right">공급가액</th>
                            <th className="p-4 text-right">부가세</th>
                            <th className="p-4 text-right">합계금액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <TableSkeleton cols={7} rows={5} />
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
                              <td colSpan={7} className="p-12 text-center text-slate-400 text-xs font-semibold">
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
                            <th className="p-4 text-right">공급가액</th>
                            <th className="p-4 text-right">부가세</th>
                            <th className="p-4 text-right">합계금액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <TableSkeleton cols={6} rows={5} />
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
                              <td colSpan={6} className="p-12 text-center text-slate-400 text-xs font-semibold">
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
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative overflow-hidden"
            >
              <div className="absolute -top-10 -left-10 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    인터넷뱅킹 엑셀 가져오기
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    인터넷뱅킹에서 다운로드한 엑셀 파일을 업로드하여 잔액을 대조합니다.
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleExcelUpload} className="mt-5 space-y-5">
                {/* 지능형 자동 감지 안내 팁 */}
                <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">지능형 다중 계좌 파이프라인</h4>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      올바른 적재 대상 은행과 계좌번호를 드롭다운에서 매칭해 주세요.
                      엑셀 내부의 거래 데이터를 파싱하여 로컬 계좌의 거래 역사와 잔액을 실시간 결합합니다.
                    </p>
                  </div>
                </div>

                {/* 1. 적재 은행사 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">적재 은행사</label>
                  <select
                    value={uploadBankId}
                    onChange={(e) => setUploadBankId(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="shinhan">신한은행 (Shinhan)</option>
                    <option value="hana">하나은행 (Hana)</option>
                    <option value="kookmin">KB국민은행 (Kookmin)</option>
                    <option value="ibk">IBK기업은행 (IBK)</option>
                    <option value="woori">우리은행 (Woori)</option>
                    <option value="nh">NH농협은행 (NH)</option>
                    <option value="serp">SERP 통합 연동 (자동 계정 분류)</option>
                  </select>
                </div>

                {/* 2. 적재 대상 은행 계좌 */}
                {uploadBankId !== "serp" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">적재 대상 은행 계좌</label>
                    <select
                      value={uploadAccountId}
                      onChange={(e) => setUploadAccountId(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      {accounts.filter(acc => acc.bankId === uploadBankId).length === 0 ? (
                        <option value="">-- 해당 은행에 등록된 활성 계좌가 없습니다 --</option>
                      ) : (
                        accounts
                          .filter((acc) => acc.bankId === uploadBankId)
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.accountName} | {acc.accountNumber} (잔액: ₩ {acc.balance?.toLocaleString()})
                            </option>
                          ))
                      )}
                    </select>
                  </div>
                )}

                {/* 3. 파일 업로드 드롭존 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">엑셀 파일 등록 (.xls, .xlsx)</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setUploadFile(e.target.files[0]);
                          setUploadMessage(null);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    />
                    <div className="border-dashed border-2 border-slate-200 group-hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 group-hover:bg-blue-50/20 transition-all flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-blue-500 transition-all" />
                      
                      {uploadFile ? (
                        <div className="space-y-1">
                          <p className="text-xs font-extrabold text-blue-600 truncate max-w-[280px]">
                            {uploadFile.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {(uploadFile.size / 1024).toFixed(1)} KB | 가져올 준비 완료
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            여기에 뱅킹 엑셀 파일을 끌어다 놓거나 클릭해 주세요.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. 성공/에러 피드백 알림 메시지 영역 */}
                {uploadMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-2xl text-xs font-bold border flex items-start gap-2 ${
                      uploadMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    }`}
                  >
                    {uploadMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{uploadMessage.text}</span>
                  </motion.div>
                )}

                {/* 5. 하단 버튼들 */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    disabled={isUploading}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50 cursor-pointer text-center"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || (!uploadFile) || (uploadBankId !== "serp" && !uploadAccountId)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 text-xs font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:pointer-events-none cursor-pointer"
                  >
                    {isUploading ? "데이터 분석 및 전송 중..." : "매핑 데이터 전송"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. 국세청 홈택스 엑셀 수동 가져오기 UI */}
      <AnimatePresence>
        {isHometaxModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative overflow-hidden"
            >
              <div className="absolute -top-10 -left-10 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    국세청 홈택스 세무 자료 등록
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    홈택스에서 내려받은 부가가치세 세금계산서/현금영수증 내역을 동기화합니다.
                  </p>
                </div>
                <button
                  onClick={() => setIsHometaxModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

               <form onSubmit={handleHometaxUpload} className="mt-5 space-y-5">
                {/* 지능형 자동 감지 안내 팁 */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">지능형 세무 대조 파이프라인</h4>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed font-sans">
                      홈택스에서 다운로드한 엑셀 원본(세금계산서, 면세계산서, 현금영수증)을 자동으로 분석합니다.
                      엑셀 내부의 거래 데이터를 파싱하여 로컬 지출/매출 대장과 연동합니다.
                    </p>
                  </div>
                </div>

                {/* 1. 세무 자료 구분 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">세무 자료 구분</label>
                  <select
                    value={hometaxKind}
                    onChange={(e) => setHometaxKind(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="sales">전자세금계산서 (매출)</option>
                    <option value="purchase">전자세금계산서 (매입)</option>
                    <option value="tax-exempt-sales">면세 계산서 (매출)</option>
                    <option value="tax-exempt-purchase">면세 계산서 (매입)</option>
                    <option value="cash-receipt">현금영수증 (매입)</option>
                  </select>
                </div>

                {/* 2. 사업자번호 입력 (현금 필수, 그외 옵션) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">
                    사업자등록번호
                    {hometaxKind === "cash-receipt" ? (
                      <span className="text-rose-500 ml-1 font-bold">(현금영수증 필수)</span>
                    ) : (
                      <span className="text-slate-400 ml-1 font-medium">(공백 시 엑셀에서 자동 추출)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="예: 123-45-67890 (숫자만 입력)"
                    value={hometaxBusinessNumber}
                    onChange={(e) => setHometaxBusinessNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 3. 파일 드롭존 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">홈택스 엑셀 파일 업로드 (.xls, .xlsx)</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setHometaxFile(e.target.files[0]);
                          setHometaxUploadMessage(null);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    />
                    <div className="border-dashed border-2 border-slate-200 group-hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 group-hover:bg-emerald-50/10 transition-all flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 transition-all" />
                      
                      {hometaxFile ? (
                        <div className="space-y-1">
                          <p className="text-xs font-extrabold text-emerald-600 truncate max-w-[280px]">
                            {hometaxFile.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {(hometaxFile.size / 1024).toFixed(1)} KB | 가져올 준비 완료
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            여기에 국세청 엑셀 파일을 끌어다 놓거나 클릭해 주세요.
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                            변형하지 않은 홈택스 원본 그대로 업로드하셔야 분석이 가능합니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. 성공/에러 메시지 토스트 영역 */}
                {hometaxUploadMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-2xl text-xs font-bold border flex items-start gap-2 ${
                      hometaxUploadMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    }`}
                  >
                    {hometaxUploadMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{hometaxUploadMessage.text}</span>
                  </motion.div>
                )}

                {/* 5. 하단 버튼군 */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsHometaxModalOpen(false)}
                    disabled={isHometaxUploading}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50 cursor-pointer text-center"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isHometaxUploading || (!hometaxFile) || (hometaxKind === "cash-receipt" && !hometaxBusinessNumber)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 text-xs font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:pointer-events-none cursor-pointer"
                  >
                    {isHometaxUploading ? "증빙 대조 및 저장 중..." : "매핑 데이터 전송"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. 신용카드 수동 엑셀 업로드 모달 UI */}
      <AnimatePresence>
        {isCardModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative overflow-hidden"
            >
              {/* 모달 내부 장식용 블러 구체 */}
              <div className="absolute -top-10 -left-10 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-500" />
                    법인 신용카드 승인 내역 가져오기
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    신용카드사 비즈니스 포털에서 내려받은 정식 엑셀 원본 파일을 연동합니다.
                  </p>
                </div>
                <button
                  onClick={() => setIsCardModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

               <form onSubmit={handleCardUpload} className="mt-5 space-y-5">
                {/* 지능형 자동 감지 안내 팁 */}
                <div className="p-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">지능형 카드 승인 파이프라인</h4>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed font-sans">
                      카드사에서 다운로드한 엑셀 원본 파일을 자동으로 인식합니다.
                      결제 승인 일자, 가맹점 정보, 공급 가액 및 세액을 분석하여 실시간 대조 및 저장합니다.
                    </p>
                  </div>
                </div>

                {/* 1. 카드사 선택 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">카드 발급사</label>
                  <select
                    value={cardCompanyId}
                    onChange={(e) => setCardCompanyId(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="shinhan-card">신한카드 (Shinhan Card)</option>
                    <option value="kb-card">KB국민카드 (KB Card)</option>
                    <option value="nh-card">NH농협카드 (NH Card)</option>
                    <option value="bc-card">BC카드 (BC Card)</option>
                    <option value="hana-card">하나카드 (Hana Card)</option>
                  </select>
                </div>

                {/* 2. 대상 결제 계좌(프로필) 연결 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">적재 대상 결제 계정</label>
                  <select
                    value={cardAccountId}
                    onChange={(e) => setCardAccountId(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="CARD-IMPORT">수동 임포트 카드사 대장 (기본)</option>
                    {accounts
                      .filter(acc => acc.accountType === "card" || acc.accountName.includes("카드"))
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bankName} | {acc.accountName} (번호: {acc.accountNumber})
                        </option>
                      ))}
                  </select>
                </div>

                {/* 3. 파일 드롭존 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">카드 승인 엑셀 파일 업로드 (.xls, .xlsx)</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setCardFile(e.target.files[0]);
                          setCardUploadMessage(null);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    />
                    <div className="border-dashed border-2 border-slate-200 group-hover:border-amber-500 rounded-2xl p-6 text-center bg-slate-50/50 group-hover:bg-amber-50/10 transition-all flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-amber-500 transition-all" />
                      
                      {cardFile ? (
                        <div className="space-y-1">
                          <p className="text-xs font-extrabold text-amber-600 truncate max-w-[280px]">
                            {cardFile.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {(cardFile.size / 1024).toFixed(1)} KB | 가져올 준비 완료
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            여기에 카드사 엑셀 파일을 드롭하거나 클릭해 주세요.
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                            암호가 해제된 깨끗한 원본 엑셀 형식만 가공이 가능합니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. 성공/에러 메시지 알림 영역 */}
                {cardUploadMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-2xl text-xs font-bold border flex items-start gap-2 ${
                      cardUploadMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    }`}
                  >
                    {cardUploadMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{cardUploadMessage.text}</span>
                  </motion.div>
                )}

                {/* 5. 하단 버튼군 */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCardModalOpen(false)}
                    disabled={isCardUploading}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50 cursor-pointer text-center"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isCardUploading || (!cardFile)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 text-xs font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:pointer-events-none cursor-pointer"
                  >
                    {isCardUploading ? "신용카드 데이터 대조 중..." : "매핑 데이터 전송"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9. 신용카드 영수증 사진 다중 등록 모달 UI */}
      <AnimatePresence>
        {isReceiptModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative overflow-hidden"
            >
              <div className="absolute -top-10 -left-10 w-28 h-28 bg-slate-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-slate-800" />
                    카드 승인 영수증 등록
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    신용카드 승인 내역에 실물 영수증 사진을 매핑합니다. (여러 장 등록 가능)
                  </p>
                </div>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleReceiptUpload} className="mt-5 space-y-5">
                {/* AI 자동 식별 안내 팁 */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">AI 영수증 자동 식별 매칭</h4>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed font-sans">
                      영수증 사진을 등록하면 AI OCR이 금액, 가맹점, 일자를 정밀 분석하여 목록 내에서 매치되는 카드 승인 건을 찾아 자동으로 매핑합니다.
                    </p>
                  </div>
                </div>

                {/* 1. 대상 카드 거래 선택 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">연결할 카드 거래 승인 내역</label>
                  <select
                    value={receiptSelectedTxId}
                    onChange={(e) => setReceiptSelectedTxId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold bg-slate-50 text-slate-700 outline-none focus:border-blue-500 cursor-pointer transition-all"
                  >
                    <option value="">-- 거래 내역을 수동으로 연결하거나 선택하세요 --</option>
                    {cardTxList.map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        [{tx.date}] {tx.merchantName} | ₩ {Math.floor(tx.amount || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. 사진 파일 업로드 드롭존 (multiple) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">영수증 이미지 등록 (.jpg, .png, .jpeg)</label>
                  <div className="relative group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const filesArray = Array.from(e.target.files);
                          setReceiptUploadFiles(filesArray);
                          setReceiptUploadMessage(null);
                          analyzeReceiptWithAI(filesArray[0]); // 첫 번째 파일로 AI OCR 분석 트리거
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    />
                    <div className="border-dashed border-2 border-slate-200 group-hover:border-slate-800 rounded-2xl p-6 text-center bg-slate-50/50 group-hover:bg-slate-100/30 transition-all flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-10 h-10 text-slate-400 group-hover:text-slate-700 transition-all" />
                      
                      {receiptUploadFiles.length > 0 ? (
                        <div className="space-y-2 w-full flex flex-col items-center">
                          <p className="text-xs font-extrabold text-slate-800">
                            총 {receiptUploadFiles.length}장의 사진이 선택되었습니다.
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            클릭하여 파일을 추가하거나 개별 제외할 수 있습니다.
                          </p>
                          
                          {/* 3열 썸네일 그리드와 X 버튼 */}
                          <div className="mt-3 grid grid-cols-3 gap-2 w-full max-h-[160px] overflow-y-auto p-1">
                            {receiptUploadFiles.map((file, idx) => (
                              <div key={idx} className="relative group/thumb aspect-square border border-slate-100 rounded-lg overflow-hidden bg-slate-50">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt="영수증"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReceiptUploadFiles((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="absolute top-1 right-1 w-5 h-5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-md active:scale-90"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            여기에 카드 영수증 사진들을 끌어다 놓거나 클릭해 주세요.
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                            여러 장의 실물 영수증을 한꺼번에 선택하여 등록할 수 있습니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. 로딩 및 성공/실패 피드백 */}
                {receiptUploadMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-2xl text-xs font-bold border flex items-start gap-2 ${
                      receiptUploadMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    }`}
                  >
                    {receiptUploadMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{receiptUploadMessage.text}</span>
                  </motion.div>
                )}

                {/* 4. 하단 동작 제어 버튼 */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReceiptModalOpen(false)}
                    disabled={isReceiptUploading}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50 cursor-pointer text-center"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isReceiptUploading || receiptUploadFiles.length === 0 || !receiptSelectedTxId}
                    className="flex-1 py-2.5 bg-gradient-to-r from-slate-800 to-slate-950 text-white hover:from-slate-900 hover:to-black text-xs font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:pointer-events-none cursor-pointer"
                  >
                    {isReceiptUploading ? "영수증 이미지 분석/적재 중..." : "매핑 및 등록 완료"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10. 카드 영수증 다중 뷰어(캐러셀) 모달 UI */}
      <AnimatePresence>
        {viewingReceiptUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-slate-800" />
                    등록된 카드 영수증 보기
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {viewingReceiptUrl.split(",").length > 1 
                      ? `총 ${viewingReceiptUrl.split(",").length}장의 영수증이 등록되어 있습니다.`
                      : "실물 영수증 증빙 자료입니다."}
                  </p>
                </div>
                <button
                  onClick={() => setViewingReceiptUrl(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {/* 이미지 슬라이더 영역 */}
              <div className="relative mt-5 flex flex-col items-center bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden min-h-[350px] justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingReceiptUrl.split(",")[viewingReceiptIndex] || viewingReceiptUrl}
                  alt="등록 영수증"
                  className="max-w-full max-h-[400px] object-contain transition-all duration-300"
                />

                {/* 다중 이미지인 경우 좌우 제어 내비게이터 탑재 */}
                {viewingReceiptUrl.split(",").length > 1 && (
                  <>
                    <button
                      onClick={() => setViewingReceiptIndex((prev) => (prev > 0 ? prev - 1 : viewingReceiptUrl.split(",").length - 1))}
                      className="absolute left-3 p-2 bg-white/80 hover:bg-white text-slate-800 rounded-full shadow-md active:scale-90 hover:scale-105 transition-all cursor-pointer border border-slate-100"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewingReceiptIndex((prev) => (prev < viewingReceiptUrl.split(",").length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 p-2 bg-white/80 hover:bg-white text-slate-800 rounded-full shadow-md active:scale-90 hover:scale-105 transition-all cursor-pointer border border-slate-100"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* 슬라이드 도트(인덱스 표시) */}
                    <div className="absolute bottom-4 flex gap-1.5 bg-black/60 px-3 py-1.5 rounded-full">
                      {viewingReceiptUrl.split(",").map((_, idx) => (
                        <div
                          key={idx}
                          onClick={() => setViewingReceiptIndex(idx)}
                          className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
                            idx === viewingReceiptIndex ? "bg-white scale-125" : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 뷰어 하단 닫기 단독 버튼 */}
              <button
                onClick={() => setViewingReceiptUrl(null)}
                className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer text-center"
              >
                조회 닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
