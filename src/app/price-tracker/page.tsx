"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Plus, Trash2, Globe, Sparkles, Send, Bell, 
  HelpCircle, Settings, ShieldAlert, Cpu, CheckCircle2, ChevronRight, Play,
  Layers, Calendar, Search, RefreshCw, AlertTriangle, ArrowUpRight, ArrowDownLeft,
  X, DollarSign, Eye, EyeOff, BarChart3, Info, Terminal, Activity, Copy, Check
} from "lucide-react";

const CURRENCIES = ["USD", "EUR", "JPY", "CNY"];
const CURRENCY_NAMES: Record<string, string> = {
  USD: "미국 달러",
  EUR: "유럽 유로",
  JPY: "일본 엔화 (100)",
  CNY: "중국 위안"
};

export default function PriceTrackerAIPage() {
  // 1. 상태 정의
  const [items, setItems] = useState<any[]>([]);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [urls, setUrls] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertLogs, setAlertLogs] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [exchangeRateHistories, setExchangeRateHistories] = useState<any[]>([]);

  // 백그라운드 데몬 상태
  const [daemonInfo, setDaemonInfo] = useState({
    status: "STOPPED",
    last_run: "기록 없음",
    pid: "N/A"
  });

  // 환율 분석 차트 활성 탭
  const [activeRateTab, setActiveRateTab] = useState("USD");

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // 모달 제어 상태
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCollectorModalOpen, setIsCollectorModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // 폼 입력 상태
  const [itemForm, setItemForm] = useState({ 
    item_code: "", 
    item_name: "", 
    category: "RAW_MATERIAL", 
    base_price: "", 
    target_margin_rate: "12.5",
    currency_code: "USD" 
  });
  const [urlForm, setUrlForm] = useState({ 
    site_name: "", 
    target_url: "", 
    css_selector: "", 
    cron_interval: "0 9 * * *" 
  });
  const [aiForm, setAiForm] = useState({ 
    industry: "정밀 기계 및 금속가공업", 
    keyword: "구리 전기동 원자재 LME" 
  });
  const [alertForm, setAlertForm] = useState({ 
    rule_name: "", 
    condition_type: "MARGIN_BREAKDOWN", 
    threshold_value: "5.0", 
    phone_number: "010-1234-5678", 
    sms_template: "",
    threshold_unit: "PERCENT", 
    threshold_currency: "USD", 
    condition_operator: "MARGIN_BREAKDOWN" 
  });

  // 로딩/액션 상태
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [crawlerTesting, setCrawlerTesting] = useState(false);
  const [updatingRates, setUpdatingRates] = useState(false);
  const [startingDaemon, setStartingDaemon] = useState(false);
  const [copiedText, setCopiedText] = useState("");

  // 지정 기간 환율 백필 상태 (기본 오늘 기준 1월 1일 지정)
  const todayDateStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [backfillStartDate, setBackfillStartDate] = useState("2026-01-01");
  const [backfillEndDate, setBackfillEndDate] = useState(todayDateStr);
  const [isBackfilling, setIsBackfilling] = useState(false);

  // 차트 마우스 오버 툴팁 상태
  const [rateHoverInfo, setRateHoverInfo] = useState<{ x: number; y: number; val: number; date: string; index: number } | null>(null);
  const [itemHoverInfo, setItemHoverInfo] = useState<{ x: number; y: number; price: number; date: string; index: number; converted_krw?: number } | null>(null);

  // 차트 가로 스크롤바 제어용 Ref
  const rateScrollRef = React.useRef<HTMLDivElement>(null);
  const itemScrollRef = React.useRef<HTMLDivElement>(null);

  // 스크롤을 맨 우측으로 밀착시키는 안전 헬퍼 함수
  const scrollToRight = useCallback((elem: HTMLDivElement | null) => {
    if (!elem) return;
    elem.scrollLeft = elem.scrollWidth;
    // 브라우저 렌더링 프레임 보정을 위한 듀얼 틱 구동
    requestAnimationFrame(() => {
      if (elem) elem.scrollLeft = elem.scrollWidth;
    });
  }, []);

  // 1. 환율 차트 데이터 로드 및 탭 변경 시 ResizeObserver를 결합하여 확실하게 오늘 날짜(우측 끝)로 스크롤 정렬합니다.
  useEffect(() => {
    const scrollElem = rateScrollRef.current;
    if (!scrollElem) return;

    // 즉시 정렬 시도
    scrollToRight(scrollElem);

    // 내부 컨텐츠 크기 팽창 실시간 옵저빙
    const observer = new ResizeObserver(() => {
      scrollToRight(scrollElem);
    });
    observer.observe(scrollElem);

    // 백업 타이머 구동
    const timer = setTimeout(() => scrollToRight(scrollElem), 150);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [exchangeRateHistories, activeRateTab, scrollToRight]);

  // 2. 품목 상세 차트 열림 혹은 수집 이력 갱신 시 ResizeObserver를 결합하여 확실하게 오늘 날짜(우측 끝)로 스크롤 정렬합니다.
  useEffect(() => {
    const scrollElem = itemScrollRef.current;
    if (!scrollElem) return;

    // 즉시 정렬 시도
    scrollToRight(scrollElem);

    // 내부 컨텐츠 크기 팽창 실시간 옵저빙
    const observer = new ResizeObserver(() => {
      scrollToRight(scrollElem);
    });
    observer.observe(scrollElem);

    // 백업 타이머 구동
    const timer = setTimeout(() => scrollToRight(scrollElem), 150);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [urls, activeItem, scrollToRight]);

  // 2. 마운트 시 통합 데이터 로드
  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    setLoading(true);
    try {
      // 2.1. 품목 조회
      const itemsRes = await fetch("/api/price-tracker/items");
      const itemsJson = await itemsRes.json();
      if (itemsJson.success) {
        setItems(itemsJson.items);
        if (itemsJson.items.length > 0 && !activeItem) {
          const defaultItem = itemsJson.items[0];
          setActiveItem(defaultItem);
          fetchItemDetails(defaultItem.item_id);
        } else if (activeItem) {
          // 활성 아이템 리로드 보정
          const matched = itemsJson.items.find((x: any) => x.item_id === activeItem.item_id);
          if (matched) setActiveItem(matched);
        }
      }

      // 2.2. 알림 규칙 및 발송 이력 로그 조회
      const alertsRes = await fetch("/api/price-tracker/alerts");
      const alertsJson = await alertsRes.json();
      if (alertsJson.success) {
        setAlerts(alertsJson.rules);
        setAlertLogs(alertsJson.logs);
      }

      // 2.3. 환율 및 데몬 상태 조회
      const ratesRes = await fetch("/api/price-tracker/exchange-rates");
      const ratesJson = await ratesRes.json();
      if (ratesJson.success) {
        setExchangeRates(ratesJson.rates);
        setExchangeRateHistories(ratesJson.histories || []);
        if (ratesJson.daemon) {
          setDaemonInfo(ratesJson.daemon);
        }
      }
    } catch (e) {
      console.error("초기 SCM 관제 데이터 로딩 에러:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemDetails = async (itemId: number) => {
    try {
      const res = await fetch(`/api/price-tracker/urls?item_id=${itemId}`);
      const json = await res.json();
      if (json.success) {
        setUrls(json.urls);
      }
    } catch (e) {
      console.error("수집 사이트 상세 정보 조회 실패:", e);
    }
  };

  // 시세 및 환율 즉각 동기화
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInitData();
    if (activeItem) {
      await fetchItemDetails(activeItem.item_id);
    }
    setRefreshing(false);
  };

  // 실시간 외환 환율 즉각 갱신
  const handleSyncExchangeRates = async () => {
    setUpdatingRates(true);
    try {
      const res = await fetch("/api/price-tracker/exchange-rates", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        alert("⚡ 외환시장 환율 데이터 동기화 완료! 공백이 있던 경우 오늘의 이력도 정상 누적 적재되었습니다.");
        fetchInitData();
      } else {
        alert("환율 갱신 실패: " + json.error);
      }
    } catch (e: any) {
      console.error(e);
      alert("에러 발생: " + e.message);
    } finally {
      setUpdatingRates(false);
    }
  };

  // 백그라운드 수집 데몬 강제 가동 브릿지 실행
  const handleStartDaemon = async () => {
    setStartingDaemon(true);
    try {
      const res = await fetch("/api/price-tracker/exchange-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START_DAEMON" })
      });
      const json = await res.json();
      if (json.success) {
        alert("🤖 [Daemon] 백그라운드 가격/환율 수집 데몬 기동 명령 송출 완료!\n서버 내부에서 자율 가동을 시작하며, 누락된 공백 환율도 자동으로 소급 복원(Backfill)합니다.");
        fetchInitData();
      } else {
        alert("데몬 기동 실패: " + json.error);
      }
    } catch (e: any) {
      console.error(e);
      alert("에러 발생: " + e.message);
    } finally {
      setStartingDaemon(false);
    }
  };

  // NPM 명령어 복사
  const handleCopyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // 지정 기간 환율 자율 백필 소급 가져오기 실행
  const handleBulkBackfill = async () => {
    if (!backfillStartDate || !backfillEndDate) {
      alert("시작일과 종료일을 정확히 지정해 주세요.");
      return;
    }
    setIsBackfilling(true);
    try {
      const res = await fetch("/api/price-tracker/exchange-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_BACKFILL",
          startDate: backfillStartDate,
          endDate: backfillEndDate
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(`🎉 [소급 완료] ${backfillStartDate} ~ ${backfillEndDate} 기간 환율 복원 완료!\n- 신규 적재: ${json.inserted} 건\n- 중복 제외: ${json.ignored} 건\n\n대시보드와 환율 추이 분석 그래프가 즉시 실시간 갱신되었습니다.`);
        fetchInitData();
      } else {
        alert("소급 실패: " + json.error);
      }
    } catch (e: any) {
      console.error(e);
      alert("에러 발생: " + e.message);
    } finally {
      setIsBackfilling(false);
    }
  };

  // 품목 선택 시 상세 로드
  const handleItemSelect = (item: any) => {
    setActiveItem(item);
    fetchItemDetails(item.item_id);
    
    setAlertForm(prev => ({
      ...prev,
      rule_name: `${item.item_name} 급변동 긴급 경고`,
      phone_number: "010-1234-5678",
      threshold_currency: item.currency_code || "KRW",
      sms_template: `[🚨 가격추적AI - 마진경보]\n품목: ${item.item_name} ({item_code})\n수집가: {captured_price} ${item.currency_code} (₩{converted_krw_price})\n경고: 설정하신 최저 한계 조건 [{threshold_value} {threshold_unit}]이 감지되어, 긴급 SMS 발송합니다. 판가 마진 검토 바랍니다.`
    }));
  };

  // 3. 비즈니스 액션
  // 3.1. 품목 추가
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.item_code || !itemForm.item_name || !itemForm.base_price) return alert("필수 정보를 채워주세요.");
    
    try {
      const res = await fetch("/api/price-tracker/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemForm)
      });
      const json = await res.json();
      if (json.success) {
        alert("🎉 신규 시황 추적 품목이 전광판에 등록되었습니다!");
        setItemForm({ 
          item_code: "", 
          item_name: "", 
          category: "RAW_MATERIAL", 
          base_price: "", 
          target_margin_rate: "12.5",
          currency_code: "USD" 
        });
        setIsItemModalOpen(false);
        fetchInitData();
      } else {
        alert("등록 실패: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3.2. 수집 URL 등록
  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return alert("매핑할 품목을 선택해 주세요.");
    if (!urlForm.site_name || !urlForm.target_url || !urlForm.css_selector) return alert("크롤링 옵션을 입력해 주세요.");

    setCrawlerTesting(true);
    try {
      const res = await fetch("/api/price-tracker/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: activeItem.item_id, ...urlForm, run_test: true })
      });
      const json = await res.json();
      if (json.success) {
        const detailMsg = json.test_price 
          ? `[${json.test_price.toLocaleString()} ${json.currency} / ₩${json.test_price_krw.toLocaleString()}]`
          : "단가 수집 대기";
        alert(`⚡ 크롤링 로봇 즉시 검수 완료!\n${detailMsg}가 감지되어 DB에 가동 매핑되었습니다.`);
        setUrlForm({ site_name: "", target_url: "", css_selector: "", cron_interval: "0 9 * * *" });
        fetchItemDetails(activeItem.item_id);
        fetchInitData();
      } else {
        alert("수집 매핑 실패: " + json.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCrawlerTesting(false);
    }
  };

  // 수집 URL 삭제
  const handleDeleteUrl = async (urlId: number) => {
    if (!confirm("해당 수집 엔진 노드를 전광판에서 제외하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/price-tracker/urls?url_id=${urlId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        alert("수집 로봇이 안전하게 제외되었습니다.");
        if (activeItem) fetchItemDetails(activeItem.item_id);
        fetchInitData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3.3. 알림 규칙 활성화
  const handleAddAlertRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return alert("알림을 설정할 타겟 품목을 지정해 주세요.");
    if (!alertForm.rule_name || !alertForm.threshold_value || !alertForm.sms_template) return alert("입력란을 완성해 주세요.");

    try {
      const res = await fetch("/api/price-tracker/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          item_id: activeItem.item_id, 
          ...alertForm,
          condition_type: alertForm.threshold_unit === "PERCENT" ? "MARGIN_BREAKDOWN" : alertForm.condition_operator
        })
      });
      const json = await res.json();
      if (json.success) {
        alert("💬 FreeSMS 가격 경보 자동화 규칙이 성공적으로 가동되었습니다!");
        setIsAlertModalOpen(false);
        fetchInitData();
      } else {
        alert("알림 설정 실패: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3.4. Gemini AI 추천 룰 적용
  const handleAiRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecommendLoading(true);
    try {
      const res = await fetch("/api/price-tracker/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiForm)
      });
      const json = await res.json();
      if (json.success) {
        setRecommendations(json.recommendations);
      } else {
        alert("AI 분석 실패: " + json.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecommendLoading(false);
    }
  };

  const applyRecommendation = (rec: any) => {
    setUrlForm({
      site_name: rec.site_name,
      target_url: rec.url,
      css_selector: rec.recommended_selector,
      cron_interval: "0 9 * * *"
    });
    setIsAiModalOpen(false);
    setIsCollectorModalOpen(true);
    alert(`💡 AI 추천 룰 [${rec.site_name}]이 크롤러 등록 폼에 주입되었습니다! [즉시 모의 가동]을 눌러 검수해 보세요.`);
  };

  // 4. SVG 차트 계산 정보 수집
  const getSvgPathData = () => {
    if (urls.length === 0 || !urls[0].history || urls[0].history.length === 0) {
      return { path: "", points: [], width: 600 };
    }
    const history = urls[0].history;
    const maxVal = Math.max(...history.map((h: any) => Number(h.captured_price))) * 1.03;
    const minVal = Math.min(...history.map((h: any) => Number(h.captured_price))) * 0.97;
    const valRange = maxVal - minVal || 1;

    // 동적 품목 차트 너비 계산: 데이터 1건당 가로폭 32px 할당 (최소 600px 확보)
    const width = Math.max(600, history.length * 32 + 80);
    const height = 180;
    const paddingLeft = 55;
    const paddingRight = 35;
    const paddingTop = 20;
    const paddingBottom = 20;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const points = history.map((h: any, idx: number) => {
      const x = paddingLeft + (idx / (history.length - 1)) * plotWidth;
      const y = paddingTop + plotHeight - ((h.captured_price - minVal) / valRange) * plotHeight;
      return { x, y, price: h.captured_price, date: h.captured_at.slice(5, 10) };
    });

    const path = points.map((p: any, idx: number) => `${idx === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
    return { path, points, width };
  };

  const { path: svgPath, points: svgPoints, width: svgChartWidth } = getSvgPathData();

  // 5. 환율 분석 차트 SVG 정보 계산
  const getRateSvgPathData = () => {
    const rateHistory = exchangeRateHistories.filter(x => x.currency_code === activeRateTab);
    if (rateHistory.length === 0) return { path: "", points: [], fillPath: "", width: 600 };

    const maxVal = Math.max(...rateHistory.map((h: any) => Number(h.rate_value))) * 1.01;
    const minVal = Math.min(...rateHistory.map((h: any) => Number(h.rate_value))) * 0.99;
    const valRange = maxVal - minVal || 1;

    // 동적 환율 차트 너비 계산: 데이터 1건당 가로폭 32px 할당 (최소 600px 확보)
    const width = Math.max(600, rateHistory.length * 32 + 80);
    const height = 150;
    const paddingLeft = 55;
    const paddingRight = 35;
    const paddingTop = 15;
    const paddingBottom = 20;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const points = rateHistory.map((h: any, idx: number) => {
      const x = paddingLeft + (idx / (rateHistory.length - 1)) * plotWidth;
      const y = paddingTop + plotHeight - ((h.rate_value - minVal) / valRange) * plotHeight;
      return { x, y, val: h.rate_value, date: h.captured_date.slice(5, 10) };
    });

    const path = points.map((p: any, idx: number) => `${idx === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
    
    // 그라데이션 면적용 패스 생성
    let fillPath = "";
    if (points.length > 0) {
      fillPath = `${path} L ${points[points.length - 1].x},${height - paddingBottom} L ${points[0].x},${height - paddingBottom} Z`;
    }

    return { path, points, fillPath, width };
  };

  const { path: rateSvgPath, points: rateSvgPoints, fillPath: rateFillPath, width: rateChartWidth } = getRateSvgPathData();

  // 6. 검색 및 필터링 적용된 품목 리스트
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === "ALL" || 
      item.category === categoryFilter;

    const isWarning = item.current_margin_rate < item.target_margin_rate;
    const matchesStatus = 
      statusFilter === "ALL" ||
      (statusFilter === "WARNING" && isWarning) ||
      (statusFilter === "SAFE" && !isWarning);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const marginWarningCount = items.filter(item => item.current_margin_rate < item.target_margin_rate).length;
  const isDaemonRunning = daemonInfo.status === "RUNNING";

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 text-slate-800">
      
      {/* 1. 상단 타이틀 주변 영역 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            <Cpu className="w-8 h-8 text-pink-600 mr-3" />
            가격 추적 AI
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            onClick={handleSyncExchangeRates}
            disabled={updatingRates}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-white hover:from-slate-800 hover:to-indigo-900 border border-slate-800 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${updatingRates ? "animate-spin" : ""}`} />
            실시간 환율 강제 갱신
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "시세 갱신 중..." : "전광판 즉시 동기화"}
          </button>
        </div>
      </div>

      {/* 2. 🤖 [NEW] SCM 가격 및 환율 수집 자율 데몬 통합 관제 센터 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl border ${
              isDaemonRunning 
                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                : "bg-rose-50 border-rose-100 text-rose-600"
            }`}>
              <Activity className={`w-6 h-6 ${isDaemonRunning ? "animate-pulse" : ""}`} />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Background Daemon</span>
                <span className={`w-2 h-2 rounded-full ${isDaemonRunning ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`}></span>
              </div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                SCM 시황 및 환율 자율 수집 데몬 관제 센터
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  isDaemonRunning ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}>
                  {isDaemonRunning ? "ACTIVE 자율 구동 중" : "STOPPED 대기 상태"}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            {/* 데몬 기동 버튼 */}
            <button
              onClick={handleStartDaemon}
              disabled={startingDaemon}
              className="flex items-center gap-1.5 px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {startingDaemon ? "데몬 실행 중..." : "⚡ 자율 데몬 백그라운드 가동"}
            </button>

            {/* NPM 명령어 복사 단추 */}
            <button
              onClick={() => handleCopyCommand("npm run price:daemon")}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              {copiedText === "npm run price:daemon" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>터미널 수동 기동 복사</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 데몬 가동 상세 정보 패널 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">데몬 가동 프로세스 PID</span>
            <span className="font-mono font-black text-slate-700">{daemonInfo.pid}</span>
          </div>
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">최종 백그라운드 구동 시각</span>
            <span className="font-mono font-black text-slate-700">{daemonInfo.last_run}</span>
          </div>
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">자가 회복 백필(Backfill) 엔진</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              무중단 복원 대기
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">백그라운드 수집 주기</span>
            <span className="font-bold text-slate-700 font-mono">1분 (실시간 시뮬레이션 가동)</span>
          </div>
        </div>

        {/* 과거 환율 지정 기간 자율 소급 패널 */}
        <div className="border-t border-slate-100 pt-4 mt-2 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-pink-650" />
                과거 누락 환율 지정 기간 소급 가져오기
              </h4>
              <p className="text-[9.5px] text-slate-400 font-semibold">데이터베이스에 수집되지 않은 과거 환율 공백을 원하는 기간만큼 일괄 자동 계산하여 복원합니다.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">시작</span>
                  <input
                    type="date"
                    value={backfillStartDate}
                    onChange={(e) => setBackfillStartDate(e.target.value)}
                    className="bg-transparent border-none outline-none font-bold text-slate-700 text-xs"
                  />
                </div>
                <span className="text-slate-400 text-xs font-bold">~</span>
                <div className="flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">종료</span>
                  <input
                    type="date"
                    value={backfillEndDate}
                    onChange={(e) => setBackfillEndDate(e.target.value)}
                    className="bg-transparent border-none outline-none font-bold text-slate-700 text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleBulkBackfill}
                disabled={isBackfilling}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-650 to-pink-550 hover:from-pink-700 hover:to-pink-600 text-white rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isBackfilling ? "animate-spin" : ""}`} />
                {isBackfilling ? "소급 분석 및 적재 중..." : "환율 소급 가져오기 실행"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 🎛️ 최상단 실시간 주식시장 환율 & 원자재 Ticker 전광판 */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white rounded-2xl p-3.5 shadow-md border border-slate-850 overflow-hidden relative">
        <div className="absolute top-0 left-0 bg-pink-650 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-br-lg tracking-wider flex items-center gap-1 z-10 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          Live Exchange Rates
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 px-1 md:px-2.5">
          <div className="flex flex-wrap items-center gap-3">
            {exchangeRates.map((rate: any) => {
              const isUp = rate.change_direction === "UP";
              const isDown = rate.change_direction === "DOWN";
              return (
                <div key={rate.rate_id} className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors">
                  <span className="text-[10px] font-black text-slate-300">{rate.currency_code}/KRW</span>
                  <span className="text-xs font-black font-mono text-white">
                    {rate.current_rate.toLocaleString()} 원
                  </span>
                  <span className={`text-[9px] font-bold font-mono flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                    isUp ? "bg-rose-500/20 text-rose-350" : isDown ? "bg-sky-500/20 text-sky-350" : "bg-slate-500/20 text-slate-350"
                  }`}>
                    {isUp ? "▲" : isDown ? "▼" : "•"} {Math.abs(rate.change_rate)}%
                  </span>
                </div>
              );
            })}
            {exchangeRates.length === 0 && (
              <span className="text-xs font-bold text-slate-500">환율 서버로부터 실시간 변동 테이블을 대기 중입니다.</span>
            )}
          </div>
          
          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 self-end">
            <Calendar className="w-3.5 h-3.5 text-pink-400" />
            최종 동기화 시점: {exchangeRates[0]?.last_updated_at || "N/A"}
          </div>
        </div>
      </div>

      {/* 4. 🌐 [NEW] 글로벌 4대 외환(달러, 유로, 엔, 위안)의 올해 전체 가격 변동 추이 선형 차트 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-2">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-pink-650" />
              글로벌 4대 외환 시세 추이 분석 (올해 전체 누적 이력)
            </h3>
            <p className="text-[9.5px] text-slate-400 font-semibold">서버 중단 기간 동안 누락되었던 공백 시세를 자가 회복하여 연속성 보증</p>
          </div>

          {/* 환율 차트 탭 */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {CURRENCIES.map(code => (
              <button
                key={code}
                type="button"
                onClick={() => setActiveRateTab(code)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer ${
                  activeRateTab === code
                    ? "bg-white text-pink-650 shadow-sm"
                    : "text-slate-450 hover:text-slate-700"
                }`}
              >
                {CURRENCY_NAMES[code as keyof typeof CURRENCY_NAMES].split(' ')[0]} ({code})
              </button>
            ))}
          </div>
        </div>

        {/* 환율 선형 SVG 꺾은선 차트 렌더링 */}
        {rateSvgPoints.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2">
            <Globe className="w-8 h-8 text-slate-300 animate-spin-slow" />
            환율 누적 변동 데이터가 없습니다. 상단 [실시간 환율 강제 갱신]을 눌러주세요.
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
            
            {/* 차트 영역 (가로 스크롤 컨테이너 바인딩) */}
            <div 
              ref={rateScrollRef} 
              className="lg:col-span-3 py-1 overflow-x-auto scrollbar-thin scrollbar-thumb-pink-600 scrollbar-track-slate-100 rounded-2xl w-full min-w-0"
            >
              <svg 
                viewBox={`0 0 ${rateChartWidth} 150`} 
                className="overflow-visible"
                style={{ width: rateChartWidth, minWidth: rateChartWidth, height: 150, display: "block" }}
                onMouseLeave={() => setRateHoverInfo(null)}
              >
                <defs>
                  <linearGradient id="rateAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#db2777" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#db2777" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* 가이드라인 */}
                <line x1="50" y1="15" x2={rateChartWidth - 30} y2="15" stroke="#f8fafc" strokeWidth="1" />
                <line x1="50" y1="75" x2={rateChartWidth - 30} y2="75" stroke="#f1f5f9" strokeWidth="0.8" strokeDasharray="3" />
                <line x1="50" y1="130" x2={rateChartWidth - 30} y2="130" stroke="#f1f5f9" strokeWidth="1" />

                {/* 면적 그라데이션 필 */}
                <path d={rateFillPath} fill="url(#rateAreaGradient)" />

                {/* 꺾은선 */}
                <path d={rateSvgPath} fill="none" stroke="#db2777" strokeWidth="2.5" strokeLinecap="round" />

                {/* 포인트 */}
                {rateSvgPoints.map((pt: any, idx: number) => {
                  const isLast = idx === rateSvgPoints.length - 1;
                  
                  // 데이터가 대량(15개 초과)일 경우 중간 점들은 생략하고 마지막 점만 표현
                  const shouldRenderPoint = rateSvgPoints.length <= 15 || isLast;
                  if (!shouldRenderPoint) return null;

                  return (
                    <g key={idx}>
                      <circle cx={pt.x} cy={pt.y} r={isLast ? 5.5 : 3.5} fill={isLast ? "#db2777" : "#be185d"} stroke="#ffffff" strokeWidth="1.5" />
                      {isLast && (
                        <circle cx={pt.x} cy={pt.y} r="11" fill="none" stroke="#db2777" strokeWidth="1" className="animate-ping" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }} />
                      )}
                    </g>
                  );
                })}

                {/* 날짜 라벨 (겹침 현상 영구 해소 및 한글 친화 캘린더 포맷팅) */}
                {(() => {
                  // 전체 데이터 길이에 기반하여 X축 겹침이 전혀 없도록 균등 6~8개 대표 날짜 선정
                  const labelStep = Math.max(1, Math.ceil(rateSvgPoints.length / 8));
                  
                  return rateSvgPoints.map((pt: any, idx: number) => {
                    const isLast = idx === rateSvgPoints.length - 1;
                    const isFirst = idx === 0;
                    
                    // 첫날, 마지막날 및 계산된 일정 간격일 때만 출력 (마지막날 겹침 방지 보정 결합)
                    const shouldRenderLabel = isFirst || isLast || (idx % labelStep === 0 && idx < rateSvgPoints.length - labelStep * 0.7);
                    if (!shouldRenderLabel) return null;

                    // 날짜 스트링 포맷팅 개편 (예: "01-01" -> "1월 1일")
                    let formattedDate = pt.date;
                    if (pt.date.includes("-")) {
                      const parts = pt.date.split("-");
                      const month = parseInt(parts[0], 10);
                      const day = parseInt(parts[1], 10);
                      formattedDate = `${month}월 ${day}일`;
                    }

                    return (
                      <text key={idx} x={pt.x} y="145" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontWeight="bold">
                        {formattedDate}
                      </text>
                    );
                  });
                })()}

                {/* 럭셔리 마우스 오버 툴팁 가이드선 & 카드 박스 */}
                {rateHoverInfo && (
                  <g>
                    {/* 수직 자석 가이드 점선 */}
                    <line
                      x1={rateHoverInfo.x}
                      y1={15}
                      x2={rateHoverInfo.x}
                      y2={130}
                      stroke="#db2777"
                      strokeWidth="1.2"
                      strokeDasharray="3,3"
                    />
                    
                    {/* 오버 지점 도트 서클 피드백 */}
                    <circle
                      cx={rateHoverInfo.x}
                      cy={rateHoverInfo.y}
                      r="6.5"
                      fill="#db2777"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="shadow-md"
                    />

                    {/* 카드 박스 렌더링 (경계 침범 방지 툴팁 이동 보정 내장) */}
                    {(() => {
                      const tooltipWidth = 110;
                      const tooltipHeight = 42;
                      let tooltipX = rateHoverInfo.x - tooltipWidth / 2;
                      
                      // 좌우 링 실크 테두리 경계 충돌 이탈 보정
                      if (tooltipX < 50) tooltipX = 50;
                      if (tooltipX + tooltipWidth > rateChartWidth - 30) {
                        tooltipX = rateChartWidth - 30 - tooltipWidth;
                      }

                      const tooltipY = Math.max(5, rateHoverInfo.y - 52);

                      return (
                        <g className="select-none pointer-events-none">
                          <rect
                            x={tooltipX}
                            y={tooltipY}
                            width={tooltipWidth}
                            height={tooltipHeight}
                            rx="8"
                            fill="#0f172a"
                            fillOpacity="0.92"
                            stroke="#db2777"
                            strokeWidth="1.5"
                            className="shadow-2xl"
                          />
                          <text
                            x={tooltipX + tooltipWidth / 2}
                            y={tooltipY + 14}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="8.5"
                            fontWeight="bold"
                          >
                            {rateHoverInfo.date}
                          </text>
                          <text
                            x={tooltipX + tooltipWidth / 2}
                            y={tooltipY + 31}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="900"
                            fontFamily="monospace"
                          >
                            {rateHoverInfo.val.toLocaleString()} 원
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* 툴팁 반응용 투명 센서 오버레이 */}
                {rateSvgPoints.map((pt: any, idx: number) => {
                  let formattedDate = pt.date;
                  if (pt.date.includes("-")) {
                    const parts = pt.date.split("-");
                    const month = parseInt(parts[0], 10);
                    const day = parseInt(parts[1], 10);
                    formattedDate = `${month}월 ${day}일`;
                  }

                  const rectWidth = (rateChartWidth - 90) / rateSvgPoints.length;
                  const rectX = pt.x - rectWidth / 2;

                  return (
                    <rect
                      key={`rate-sensor-${idx}`}
                      x={rectX}
                      y={0}
                      width={rectWidth}
                      height={130}
                      fill="transparent"
                      className="cursor-crosshair opacity-0"
                      onMouseEnter={() => setRateHoverInfo({
                        x: pt.x,
                        y: pt.y,
                        val: pt.val,
                        date: formattedDate,
                        index: idx
                      })}
                      onMouseMove={() => setRateHoverInfo({
                        x: pt.x,
                        y: pt.y,
                        val: pt.val,
                        date: formattedDate,
                        index: idx
                      })}
                    />
                  );
                })}
              </svg>
            </div>

            {/* 수치 요약 패널 */}
            <div className="lg:col-span-1 bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col justify-between min-h-[130px]">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                  {CURRENCY_NAMES[activeRateTab as keyof typeof CURRENCY_NAMES]}
                </span>
                <h4 className="text-xl font-black text-slate-850 font-mono">
                  {rateSvgPoints[rateSvgPoints.length - 1]?.val.toLocaleString()} 원
                </h4>
              </div>

              <div className="border-t border-slate-200/80 pt-3 mt-3 space-y-1.5 text-[10.5px]">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">올해 최고가</span>
                  <span className="text-slate-700 font-mono">
                    {Math.max(...exchangeRateHistories.filter(x => x.currency_code === activeRateTab).map(x => x.rate_value)).toLocaleString()} 원
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">올해 최저가</span>
                  <span className="text-slate-700 font-mono">
                    {Math.min(...exchangeRateHistories.filter(x => x.currency_code === activeRateTab).map(x => x.rate_value)).toLocaleString()} 원
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 5. SCM 리스크 미니 위젯 및 검색 필터링 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-3.5 w-full lg:w-auto">
          <div className={`p-3.5 rounded-2xl border ${
            marginWarningCount > 0 
              ? "bg-rose-50 border-rose-100 text-rose-600 animate-pulse" 
              : "bg-emerald-50 border-emerald-100 text-emerald-600"
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold block">SCM 마진 위험 관제</span>
            <h3 className="text-lg font-black text-slate-800">
              추적 {items.length}개 품목 중 <span className={marginWarningCount > 0 ? "text-rose-500" : "text-emerald-600"}>{marginWarningCount}개 위험 등급</span> 감지
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <div className="relative flex-1 md:flex-initial min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="품목명, 코드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-700 placeholder-slate-400"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-pink-500 cursor-pointer"
          >
            <option value="ALL">전체 카테고리</option>
            <option value="RAW_MATERIAL">원자재/부자재</option>
            <option value="COMPETITOR_PRODUCT">경쟁사 완제품</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-pink-500 cursor-pointer"
          >
            <option value="ALL">전체 마진 상태</option>
            <option value="WARNING">🚨 마진 붕괴 경보</option>
            <option value="SAFE">✓ 안정 마진</option>
          </select>
        </div>
      </div>

      {/* 6. 📈 주식거래소 스타일 SCM 실시간 통합 전광 대장 테이블 (Stock Market Broad Board) */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden w-full">
        <div className="p-5 border-b border-slate-155 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-4.5 bg-pink-650 rounded-md"></span>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              📊 실시간 원가 & 마진 스프레드 관제 전광판
            </h3>
            <span className="text-[10px] text-slate-400 font-bold bg-white px-2 py-0.5 border border-slate-200 rounded-md">
              Filtered {filteredItems.length} / {items.length} 품목
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsItemModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-650 hover:bg-pink-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              신규 품목 등록
            </button>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              AI 수집처 추천
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4 font-bold text-[10px]">품목 코드 / 명칭</th>
                <th className="p-4 font-bold text-[10px] text-center">수집 통화</th>
                <th className="p-4 font-bold text-[10px] text-right">자사 기준 원가</th>
                <th className="p-4 font-bold text-[10px] text-right">실시간 수집가 (외화/원화)</th>
                <th className="p-4 font-bold text-[10px] text-center">실시간 연동 환율</th>
                <th className="p-4 font-bold text-[10px] text-right">변동폭 / 변동률</th>
                <th className="p-4 font-bold text-[10px] text-right">실시간 마진율 (목표)</th>
                <th className="p-4 font-bold text-[10px] text-center">수집망 (노드)</th>
                <th className="p-4 font-bold text-[10px] text-center">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredItems.map((item) => {
                const isActive = activeItem?.item_id === item.item_id;
                const isWarning = item.current_margin_rate < item.target_margin_rate;
                const itemCurrency = item.currency_code || 'KRW';
                
                const changeAmount = item.latest_price - item.base_price;
                const changeRate = item.base_price > 0 ? (changeAmount / item.base_price) * 100 : 0;
                
                const isUp = changeAmount > 0;
                const isDown = changeAmount < 0;

                return (
                  <React.Fragment key={item.item_id}>
                    <tr 
                      onClick={() => handleItemSelect(item)}
                      className={`hover:bg-slate-50/70 transition-all cursor-pointer ${
                        isActive ? "bg-pink-50/30 border-l-4 border-l-pink-650" : ""
                      }`}
                    >
                      {/* 품목 명칭 */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              item.category === "RAW_MATERIAL" 
                                ? "bg-slate-900 text-slate-100 border-slate-800" 
                                : "bg-indigo-55 text-indigo-750 border-indigo-100"
                            }`}>
                              {item.category === "RAW_MATERIAL" ? "자재" : "경쟁완제품"}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-450">{item.item_code}</span>
                          </div>
                          <h4 className="text-xs font-black text-slate-850 truncate max-w-[200px]">{item.item_name}</h4>
                        </div>
                      </td>

                      {/* 수집 통화 */}
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-extrabold rounded-md border border-slate-200">
                          {itemCurrency}
                        </span>
                      </td>

                      {/* 기준가 */}
                      <td className="p-4 text-right">
                        <div className="space-y-0.5">
                          <span className="text-xs font-extrabold font-mono text-slate-800 block">
                            {itemCurrency === 'KRW' ? '₩ ' : '$ '}{item.base_price.toLocaleString()}
                          </span>
                          {itemCurrency !== 'KRW' && (
                            <span className="text-[9px] text-slate-400 font-bold block">
                              (₩ {item.base_price_krw.toLocaleString()})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 실시간 수집가 */}
                      <td className="p-4 text-right">
                        {item.latest_price > 0 ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-black font-mono text-slate-850 block">
                              {itemCurrency === 'KRW' ? '₩ ' : '$ '}{item.latest_price.toLocaleString()}
                            </span>
                            {itemCurrency !== 'KRW' && (
                              <span className="text-[9px] text-slate-500 font-extrabold block">
                                (₩ {item.latest_krw_price.toLocaleString()})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-bold">수집 대기 중</span>
                        )}
                      </td>

                      {/* 실시간 연동 환율 */}
                      <td className="p-4 text-center">
                        {itemCurrency !== 'KRW' ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold font-mono text-slate-700 block">
                              {item.exchange_rate.toLocaleString()} 원
                            </span>
                            <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                              item.rate_change_direction === 'UP' 
                                ? 'bg-rose-50 text-rose-500' 
                                : item.rate_change_direction === 'DOWN'
                                ? 'bg-sky-50 text-sky-500'
                                : 'bg-slate-50 text-slate-500'
                            }`}>
                              {item.rate_change_direction === 'UP' ? '▲' : item.rate_change_direction === 'DOWN' ? '▼' : '•'} {item.rate_change_percent}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-semibold text-[10px]">-</span>
                        )}
                      </td>

                      {/* 변동폭 / 변동률 */}
                      <td className="p-4 text-right">
                        {item.latest_price > 0 ? (
                          <div className="space-y-0.5">
                            <span className={`text-xs font-black font-mono flex items-center justify-end gap-0.5 ${
                              isUp ? "text-rose-600" : isDown ? "text-sky-500" : "text-slate-500"
                            }`}>
                              {isUp ? "▲" : isDown ? "▼" : ""} 
                              {itemCurrency === 'KRW' ? '₩ ' : '$ '}{Math.abs(changeAmount).toLocaleString()}
                            </span>
                            <span className={`text-[9px] font-bold font-mono block ${
                              isUp ? "text-rose-500" : isDown ? "text-sky-400" : "text-slate-400"
                            }`}>
                              ({isUp ? "+" : ""}{changeRate.toFixed(2)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-bold">-</span>
                        )}
                      </td>

                      {/* 실시간 마진율 */}
                      <td className="p-4 text-right">
                        <div className="space-y-1 inline-flex flex-col items-end">
                          <span className={`text-xs font-black font-mono block ${
                            isWarning ? "text-rose-600" : "text-emerald-600"
                          }`}>
                            {item.latest_price > 0 ? `${item.current_margin_rate}%` : "N/A"}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {isWarning && item.latest_price > 0 && (
                              <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-1 rounded animate-pulse border border-rose-100">
                                🚨 마진 붕괴
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">
                              (목표 {item.target_margin_rate}%)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 수집망 노드 개수 */}
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-650 font-bold font-mono rounded-lg border border-slate-200">
                          {item.collectors_count} 개 노드
                        </span>
                      </td>

                      {/* 퀵 액션 */}
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              handleItemSelect(item);
                              setIsCollectorModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 text-slate-450 border border-slate-200 bg-white rounded-lg transition-colors cursor-pointer"
                            title="수집 사이트망 관리"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              handleItemSelect(item);
                              setIsAlertModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-450 border border-slate-200 bg-white rounded-lg transition-colors cursor-pointer"
                            title="FreeSMS 경보 설정"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* 활성화된 품목의 상세 분석 꺾은선 차트 Drawer 패널 */}
                    {isActive && (
                      <tr className="bg-slate-50/30">
                        <td colSpan={9} className="p-6 border-b border-slate-200">
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
                          >
                            {/* 와이드 SVG 선형 가격 변동 차트 */}
                            <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between min-h-[260px]">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                                <div className="space-y-0.5">
                                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                    <BarChart3 className="w-4 h-4 text-pink-600" />
                                    시세 변동 선형 추이 분석 ({item.item_name})
                                  </h3>
                                  <p className="text-[9px] text-slate-400 font-semibold">최근 파이프라인 수집 누적 히스토리</p>
                                </div>
                                <span className="text-[9px] font-black text-pink-600 font-mono bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  {item.latest_site_name || '수집기 매핑 없음'}
                                </span>
                              </div>

                              {svgPoints.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-xs text-slate-450 font-bold gap-2">
                                  <Globe className="w-8 h-8 text-slate-300 animate-spin-slow" />
                                  수집 완료된 단가 이력이 없습니다. 수집 로봇 탭에서 크롤링 URL을 먼저 매핑해 주세요!
                                </div>
                              ) : (
                                /* 품목 상세 차트 영역 (가로 스크롤 컨테이너 바인딩) */
                                <div 
                                  ref={itemScrollRef} 
                                  className="w-full py-1 overflow-x-auto scrollbar-thin scrollbar-thumb-pink-600 scrollbar-track-slate-100 rounded-2xl min-w-0"
                                >
                                  <svg 
                                    viewBox={`0 0 ${svgChartWidth} 180`} 
                                    className="overflow-visible"
                                    style={{ width: svgChartWidth, minWidth: svgChartWidth, height: 180, display: "block" }}
                                    onMouseLeave={() => setItemHoverInfo(null)}
                                  >
                                    <line x1="50" y1="20" x2={svgChartWidth - 30} y2="20" stroke="#f1f5f9" strokeWidth="1" />
                                    <line x1="50" y1="90" x2={svgChartWidth - 30} y2="90" stroke="#fecdd3" strokeDasharray="3" strokeWidth="0.8" />
                                    <line x1="50" y1="160" x2={svgChartWidth - 30} y2="160" stroke="#f1f5f9" strokeWidth="1" />

                                    <path d={svgPath} fill="none" stroke="#db2777" strokeWidth="2.5" strokeLinecap="round" />

                                    {svgPoints.map((pt: any, idx: number) => {
                                      const isLast = idx === svgPoints.length - 1;
                                      
                                      // 데이터가 대량(15개 초과)일 경우 중간 점들은 생략하여 차트를 가볍게 합니다.
                                      const shouldRenderPoint = svgPoints.length <= 15 || isLast;
                                      if (!shouldRenderPoint) return null;

                                      return (
                                        <g key={idx}>
                                          <circle cx={pt.x} cy={pt.y} r={isLast ? 6 : 4} fill={isLast ? "#db2777" : "#be185d"} stroke="#ffffff" strokeWidth="1.5" />
                                          {isLast && (
                                            <circle cx={pt.x} cy={pt.y} r="12" fill="none" stroke="#db2777" strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }} />
                                          )}
                                        </g>
                                      );
                                    })}

                                    {(() => {
                                      // X축 날짜가 겹치지 않도록 동적 간격(Step) 계산
                                      const labelStep = Math.max(1, Math.ceil(svgPoints.length / 8));
                                      
                                      return svgPoints.map((pt: any, idx: number) => {
                                        const isLast = idx === svgPoints.length - 1;
                                        const isFirst = idx === 0;
                                        
                                        const shouldRenderLabel = isFirst || isLast || (idx % labelStep === 0 && idx < svgPoints.length - labelStep * 0.7);
                                        if (!shouldRenderLabel) return null;

                                        // 날짜 포맷 개편 (예: "05-27" -> "5월 27일")
                                        let formattedDate = pt.date;
                                        if (pt.date.includes("-")) {
                                          const parts = pt.date.split("-");
                                          const month = parseInt(parts[0], 10);
                                          const day = parseInt(parts[1], 10);
                                          formattedDate = `${month}월 ${day}일`;
                                        }

                                        return (
                                          <text key={idx} x={pt.x} y="176" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontWeight="bold">
                                            {formattedDate}
                                          </text>
                                        );
                                      });
                                    })()}

                                    {/* 품목 상세 마우스 오버 툴팁 카드 */}
                                    {itemHoverInfo && (
                                      <g>
                                        {/* 수직 자석 가이드 점선 */}
                                        <line
                                          x1={itemHoverInfo.x}
                                          y1={20}
                                          x2={itemHoverInfo.x}
                                          y2={160}
                                          stroke="#db2777"
                                          strokeWidth="1.2"
                                          strokeDasharray="3,3"
                                        />
                                        
                                        {/* 포인트 링 강조 */}
                                        <circle
                                          cx={itemHoverInfo.x}
                                          cy={itemHoverInfo.y}
                                          r="7"
                                          fill="#db2777"
                                          stroke="#ffffff"
                                          strokeWidth="2"
                                          className="shadow-md"
                                        />

                                        {/* 이동 보정이 내장된 툴팁 카드 */}
                                        {(() => {
                                          const tooltipWidth = 140;
                                          const tooltipHeight = 54;
                                          let tooltipX = itemHoverInfo.x - tooltipWidth / 2;
                                          
                                          // 경계이탈 방지
                                          if (tooltipX < 50) tooltipX = 50;
                                          if (tooltipX + tooltipWidth > svgChartWidth - 30) {
                                            tooltipX = svgChartWidth - 30 - tooltipWidth;
                                          }

                                          const tooltipY = Math.max(5, itemHoverInfo.y - 64);
                                          const curCode = activeItem?.currency_code || "KRW";

                                          // ₩ 환산 단가 계산 피드백
                                          const krwVal = itemHoverInfo.converted_krw 
                                            ? `(₩${Math.floor(itemHoverInfo.converted_krw).toLocaleString()})`
                                            : "";

                                          return (
                                            <g className="select-none pointer-events-none">
                                              <rect
                                                x={tooltipX}
                                                y={tooltipY}
                                                width={tooltipWidth}
                                                height={tooltipHeight}
                                                rx="8"
                                                fill="#0f172a"
                                                fillOpacity="0.94"
                                                stroke="#db2777"
                                                strokeWidth="1.5"
                                                className="shadow-2xl"
                                              />
                                              {/* 날짜 */}
                                              <text
                                                x={tooltipX + tooltipWidth / 2}
                                                y={tooltipY + 14}
                                                textAnchor="middle"
                                                fill="#94a3b8"
                                                fontSize="8"
                                                fontWeight="bold"
                                              >
                                                {itemHoverInfo.date}
                                              </text>
                                              {/* 수집 가격 (외화) */}
                                              <text
                                                x={tooltipX + tooltipWidth / 2}
                                                y={tooltipY + 30}
                                                textAnchor="middle"
                                                fill="#ffffff"
                                                fontSize="11.5"
                                                fontWeight="955"
                                                fontFamily="monospace"
                                              >
                                                {itemHoverInfo.price.toLocaleString()} {curCode}
                                              </text>
                                              {/* 원화 환산 (있는 경우) */}
                                              {krwVal && (
                                                <text
                                                  x={tooltipX + tooltipWidth / 2}
                                                  y={tooltipY + 44}
                                                  textAnchor="middle"
                                                  fill="#fb7185"
                                                  fontSize="8.5"
                                                  fontWeight="bold"
                                                >
                                                  {krwVal}
                                                </text>
                                              )}
                                            </g>
                                          );
                                        })()}
                                      </g>
                                    )}

                                    {/* 투명 툴팁 센서바 영역 */}
                                    {svgPoints.map((pt: any, idx: number) => {
                                      let formattedDate = pt.date;
                                      if (pt.date.includes("-")) {
                                        const parts = pt.date.split("-");
                                        const month = parseInt(parts[0], 10);
                                        const day = parseInt(parts[1], 10);
                                        formattedDate = `${month}월 ${day}일`;
                                      }

                                      const rectWidth = (svgChartWidth - 90) / svgPoints.length;
                                      const rectX = pt.x - rectWidth / 2;

                                      // converted_krw_price 가져오기 보정 매핑
                                      const matchedHist = urls[0]?.history?.[idx];
                                      const krwPrice = matchedHist?.converted_krw_price || 0;

                                      return (
                                        <rect
                                          key={`item-sensor-${idx}`}
                                          x={rectX}
                                          y={0}
                                          width={rectWidth}
                                          height={160}
                                          fill="transparent"
                                          className="cursor-crosshair opacity-0"
                                          onMouseEnter={() => setItemHoverInfo({
                                            x: pt.x,
                                            y: pt.y,
                                            price: pt.price,
                                            date: formattedDate,
                                            index: idx,
                                            converted_krw: krwPrice
                                          })}
                                          onMouseMove={() => setItemHoverInfo({
                                            x: pt.x,
                                            y: pt.y,
                                            price: pt.price,
                                            date: formattedDate,
                                            index: idx,
                                            converted_krw: krwPrice
                                          })}
                                        />
                                      );
                                    })}
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* 실시간 마진 스프레드 서클 게이지 */}
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between min-h-[260px]">
                              <div>
                                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                  <span className="w-1.5 h-3.5 bg-pink-600 rounded-full animate-pulse"></span>
                                  실시간 마진 진단
                                </h3>
                                <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed font-semibold">자사 원가 대비 마진 보존 수준 계기판</p>
                              </div>

                              <div className="flex flex-col items-center py-2 space-y-3">
                                <div className="relative flex items-center justify-center w-24 h-24">
                                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="9" />
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="42"
                                      fill="none"
                                      stroke={isWarning ? "#ef4444" : "#10b981"}
                                      strokeWidth="9"
                                      strokeDasharray="264"
                                      strokeDashoffset={264 - (264 * Math.max(0, Math.min(100, item.current_margin_rate))) / 100}
                                      strokeLinecap="round"
                                      className="transition-all duration-1000"
                                    />
                                  </svg>
                                  <div className="absolute text-center">
                                    <span className="text-sm font-black font-mono text-slate-850 block">
                                      {item.latest_price > 0 ? `${item.current_margin_rate}%` : "N/A"}
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Margin</span>
                                  </div>
                                </div>

                                <div className="text-center space-y-0.5">
                                  <span className={`text-[10px] font-black tracking-wide ${isWarning ? "text-rose-500 animate-pulse" : "text-emerald-500"}`}>
                                    {item.latest_price > 0 
                                      ? (isWarning ? "⚠️ 마진 경고선 붕괴 위험" : "✓ 적정 마진 안전 보존")
                                      : "시세 대기 중"
                                    }
                                  </span>
                                  {item.latest_price > 0 && (
                                    <span className="text-[8.5px] text-slate-400 block font-semibold leading-relaxed">
                                      목표 {item.target_margin_rate}% 대비 {Math.abs(item.current_margin_rate - item.target_margin_rate).toFixed(2)}%p {isWarning ? "미달" : "초과 달성"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-slate-400 font-bold bg-white font-sans">
                    <ShieldAlert className="w-8 h-8 mx-auto text-slate-350 mb-2 animate-bounce" />
                    조건에 일치하는 SCM 관제 품목이 검색되지 않습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. 🔔 최근 발송 경보 로그 명세서 (주식시장 공시처럼) */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden w-full">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="text-xs font-black text-slate-800">FreeSMS 가격 임계값 돌파 긴급 문자 발송 이력</span>
          </div>
          <span className="text-[9px] font-bold text-slate-450 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
            LOGS ({alertLogs.length}건)
          </span>
        </div>
        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 font-mono">
          {alertLogs.map((log: any) => (
            <div key={log.log_id} className="p-3.5 bg-white hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-[10px]">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-rose-600 font-sans text-xs">{log.rule_name}</span>
                  <span className="text-[9px] text-slate-400 font-normal">{log.sent_at || log.fired_at}</span>
                </div>
                <p className="text-slate-650 font-semibold font-sans leading-relaxed">{log.sent_message || log.message_sent}</p>
              </div>
              <span className="shrink-0 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md font-sans font-bold flex items-center gap-1 self-start md:self-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
                SMS 발송 완료
              </span>
            </div>
          ))}
          {alertLogs.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-white">
              현재까지 긴급 경보로 발송된 FreeSMS 내역이 존재하지 않습니다.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: 신규 관제 품목 등록 모달 */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-[500px] rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-5 h-5 text-pink-650" />
                  신규 시황 관제 품목 등록
                </h3>
                <button onClick={() => setIsItemModalOpen(false)} className="p-1 hover:bg-slate-150 rounded-lg cursor-pointer">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">품목 분류</label>
                    <select
                      value={itemForm.category}
                      onChange={(e) => setItemForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700"
                    >
                      <option value="RAW_MATERIAL">원자재/부자재 (Raw Material)</option>
                      <option value="COMPETITOR_PRODUCT">경쟁사 완제품 (Competitor Product)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">수집 기준 통화</label>
                    <select
                      value={itemForm.currency_code}
                      onChange={(e) => setItemForm(prev => ({ ...prev, currency_code: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700 font-mono"
                    >
                      <option value="KRW">KRW (대한민국 원)</option>
                      <option value="USD">USD (미국 달러)</option>
                      <option value="EUR">EUR (유럽 유로)</option>
                      <option value="JPY">JPY (일본 엔화)</option>
                      <option value="CNY">CNY (중국 위안화)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">품목 고유 코드</label>
                  <input
                    type="text"
                    placeholder="예: RAW-CU-01"
                    value={itemForm.item_code}
                    onChange={(e) => setItemForm(prev => ({ ...prev, item_code: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">품목명 (명칭)</label>
                  <input
                    type="text"
                    placeholder="예: LME 구리 전기동"
                    value={itemForm.item_name}
                    onChange={(e) => setItemForm(prev => ({ ...prev, item_name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      자사 기준 단가 ({itemForm.currency_code})
                    </label>
                    <input
                      type="number"
                      placeholder="8200"
                      value={itemForm.base_price}
                      onChange={(e) => setItemForm(prev => ({ ...prev, base_price: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-bold focus:border-pink-500 outline-none text-slate-750 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">목표 보존 마진율 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="12.5"
                      value={itemForm.target_margin_rate}
                      onChange={(e) => setItemForm(prev => ({ ...prev, target_margin_rate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-bold focus:border-pink-500 outline-none text-slate-750 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-pink-500/10 cursor-pointer transition-all active:scale-[0.99]"
                >
                  ➕ 품목 시황 감시 등록
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL 2: 수집 로봇 매핑 및 검수 모달 */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isCollectorModalOpen && activeItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-[800px] rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-5 h-5 text-pink-600 animate-spin-slow" />
                    [{activeItem.item_name}] 수집 로봇 매핑 센터
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">크롤링 주기 지정 및 HTML CSS 셀렉터 매핑</p>
                </div>
                <button onClick={() => setIsCollectorModalOpen(false)} className="p-1 hover:bg-slate-150 rounded-lg cursor-pointer">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 수집기 리스트 */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500">현재 연결된 감시 URL ({urls.length}개)</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {urls.map(url => (
                      <div key={url.url_id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3">
                        <div className="space-y-1 truncate pr-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-slate-800 truncate">{url.site_name}</span>
                            <span className="text-[8px] font-mono font-bold bg-white text-slate-500 border border-slate-200 px-1.5 py-0.2 rounded shrink-0">
                              {url.cron_interval}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-450 truncate font-mono">{url.target_url}</p>
                          <span className="text-[8px] text-pink-600 font-bold block truncate">Selector: {url.css_selector}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteUrl(url.url_id)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-100 rounded-lg bg-white cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {urls.length === 0 && (
                      <p className="text-xs text-slate-455 text-center py-12 font-bold font-sans">감시 사이트가 존재하지 않습니다.</p>
                    )}
                  </div>
                </div>

                {/* 추가 폼 */}
                <form onSubmit={handleAddUrl} className="space-y-3 bg-slate-50/50 border border-slate-150 p-4 rounded-2xl">
                  <h4 className="text-xs font-black text-pink-600">새로운 크롤링 로봇 바인딩</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">출처 포털명 (사이트명)</label>
                    <input
                      type="text"
                      placeholder="예: LME 동가 시황"
                      value={urlForm.site_name}
                      onChange={(e) => setUrlForm(prev => ({ ...prev, site_name: e.target.value }))}
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">수집 대상 웹주소 (Target URL)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={urlForm.target_url}
                      onChange={(e) => setUrlForm(prev => ({ ...prev, target_url: e.target.value }))}
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">CSS Selector</label>
                      <input
                        type="text"
                        placeholder="span.price_val"
                        value={urlForm.css_selector}
                        onChange={(e) => setUrlForm(prev => ({ ...prev, css_selector: e.target.value }))}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">수집 주기 (Cron)</label>
                      <input
                        type="text"
                        value={urlForm.cron_interval}
                        onChange={(e) => setUrlForm(prev => ({ ...prev, cron_interval: e.target.value }))}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={crawlerTesting}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-pink-500 to-indigo-650 hover:from-pink-600 hover:to-indigo-750 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-55"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {crawlerTesting ? "크롤러 실시간 검수 모의 구동 중..." : "로봇 매핑 및 검수 가동 (Test Run)"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL 3: FreeSMS 경보 조건 설정 모달 */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isAlertModalOpen && activeItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-[600px] rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                    <Bell className="w-5 h-5 text-pink-600 animate-pulse" />
                    [{activeItem.item_name}] FreeSMS 가격선 경보 제어
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">비율(%) 또는 다국어 통화별 금액 기준의 하이브리드 가격선 감지</p>
                </div>
                <button onClick={() => setIsAlertModalOpen(false)} className="p-1 hover:bg-slate-150 rounded-lg cursor-pointer">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleAddAlertRule} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">알림 시나리오명</label>
                    <input
                      type="text"
                      value={alertForm.rule_name}
                      onChange={(e) => setAlertForm(prev => ({ ...prev, rule_name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">긴급 문자 수신 연락처</label>
                    <input
                      type="text"
                      placeholder="010-1234-5678"
                      value={alertForm.phone_number}
                      onChange={(e) => setAlertForm(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                    <span className="text-[10px] font-extrabold text-slate-650">경보 가격선 형식 설정</span>
                    
                    <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-300">
                      <button
                        type="button"
                        onClick={() => setAlertForm(prev => ({ ...prev, threshold_unit: "PERCENT", condition_operator: "MARGIN_BREAKDOWN" }))}
                        className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all cursor-pointer ${
                          alertForm.threshold_unit === "PERCENT"
                            ? "bg-white text-pink-600 shadow-sm"
                            : "text-slate-450 hover:text-slate-750"
                        }`}
                      >
                        비율 (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlertForm(prev => ({ ...prev, threshold_unit: "PRICE", condition_operator: "ABOVE" }))}
                        className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all cursor-pointer ${
                          alertForm.threshold_unit === "PRICE"
                            ? "bg-white text-pink-600 shadow-sm"
                            : "text-slate-450 hover:text-slate-750"
                        }`}
                      >
                        금액 ($ / ₩)
                      </button>
                    </div>
                  </div>

                  {alertForm.threshold_unit === "PERCENT" ? (
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">경보 발생 조건</span>
                        <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                          🛡️ 마진 스프레드 붕괴 시
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">허용 최저 마진 보존선 (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={alertForm.threshold_value}
                            onChange={(e) => setAlertForm(prev => ({ ...prev, threshold_value: e.target.value }))}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700 font-mono pr-8"
                          />
                          <span className="text-slate-400 text-xs font-bold absolute right-3 top-1/2 -translate-y-1/2">% 미만</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1 col-span-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">금액 기준 통화</label>
                          <select
                            value={alertForm.threshold_currency}
                            onChange={(e) => setAlertForm(prev => ({ ...prev, threshold_currency: e.target.value }))}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700 font-mono"
                          >
                            <option value="KRW">₩ 국내 (KRW)</option>
                            <option value="USD">$ 미국 (USD)</option>
                            <option value="EUR">€ 유럽 (EUR)</option>
                            <option value="JPY">¥ 일본 (JPY)</option>
                            <option value="CNY">¥ 중국 (CNY)</option>
                          </select>
                        </div>
                        
                        <div className="space-y-1 col-span-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">동작 연산자</label>
                          <select
                            value={alertForm.condition_operator}
                            onChange={(e) => setAlertForm(prev => ({ ...prev, condition_operator: e.target.value }))}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700"
                          >
                            <option value="ABOVE">▲ 초과 돌파 시</option>
                            <option value="BELOW">▼ 미만 붕괴 시</option>
                          </select>
                        </div>

                        <div className="space-y-1 col-span-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">금액 임계값 설정</label>
                          <input
                            type="number"
                            value={alertForm.threshold_value}
                            onChange={(e) => setAlertForm(prev => ({ ...prev, threshold_value: e.target.value }))}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700 font-mono"
                          />
                        </div>
                      </div>

                      {alertForm.threshold_currency !== "KRW" && Number(alertForm.threshold_value) > 0 && (
                        <div className="text-[9.5px] text-pink-650 bg-pink-50 px-3.5 py-2.5 rounded-xl border border-pink-100 font-semibold leading-relaxed flex items-center gap-1.5">
                          <Info className="w-4 h-4 shrink-0" />
                          <span>
                            금융 관제 연동: <strong>{Number(alertForm.threshold_value).toLocaleString()} {alertForm.threshold_currency}</strong>는 
                            실시간 고시 환율 적용 시 원화 <strong>약 ₩ {(
                              Number(alertForm.threshold_value) * 
                              (alertForm.threshold_currency === 'USD' ? 1380 : alertForm.threshold_currency === 'EUR' ? 1495 : alertForm.threshold_currency === 'JPY' ? 8.8 : 1.0)
                            ).toLocaleString()}원</strong>에 해당합니다.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span>FreeSMS 긴급 경보 통보 SMS LMS 문자 템플릿</span>
                    <span className="text-[8.5px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">변수 치환 가능</span>
                  </label>
                  <textarea
                    rows={4}
                    value={alertForm.sms_template}
                    onChange={(e) => setAlertForm(prev => ({ ...prev, sms_template: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700 font-mono placeholder-slate-450 leading-relaxed"
                  />
                  <p className="text-[8.5px] text-slate-400 leading-normal font-semibold">
                    * 치환 매핑 가능한 중소제조 SCM 전용 단가 변수: <strong>{"{item_name}, {item_code}, {captured_price}, {converted_krw_price}, {threshold_value}, {threshold_unit}"}</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-650 text-white font-extrabold rounded-xl text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  💾 FreeSMS 긴급 경보 자동화 규칙 가동 저장
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL 4: Gemini AI 자율 시세 추적 RAG 추천기 모달 */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-[650px] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-pink-600 animate-pulse" />
                    Gemini AI 원재료/제품 감시대상 사이트 자율 추천
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">인공지능 RAG를 연동한 전세계 최적 시황 포털 및 크롤러 CSS 선택자 발굴</p>
                </div>
                <button onClick={() => setIsAiModalOpen(false)} className="p-1 hover:bg-slate-150 rounded-lg cursor-pointer">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleAiRecommend} className="flex gap-2.5 bg-slate-50 p-2.5 border border-slate-200 rounded-2xl">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="산업군 (예: 철강 제조, 기계 가공)"
                    value={aiForm.industry}
                    onChange={(e) => setAiForm(prev => ({ ...prev, industry: e.target.value }))}
                    className="bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700"
                  />
                  <input
                    type="text"
                    placeholder="자재명 (예: 알루미늄 판재, 구리동)"
                    value={aiForm.keyword}
                    onChange={(e) => setAiForm(prev => ({ ...prev, keyword: e.target.value }))}
                    className="bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold focus:border-pink-500 outline-none text-slate-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={recommendLoading}
                  className="px-5 bg-pink-600 hover:bg-pink-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center shrink-0 cursor-pointer shadow-sm transition-colors"
                >
                  {recommendLoading ? "RAG 추적 중..." : "🚀 AI 추천 구동"}
                </button>
              </form>

              {recommendLoading ? (
                <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
                  <Cpu className="w-10 h-10 text-pink-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-400">Gemini SCM 지식 RAG 서버를 정밀 동적 탐색 중입니다...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col justify-between gap-3 shadow-inner">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{rec.site_name}</span>
                          <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">신뢰도 98%</span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-relaxed font-semibold">{rec.description}</p>
                        <div className="text-[7.5px] font-mono text-slate-450 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                          <div className="truncate">URL: {rec.url}</div>
                          <div>CSS Selector: <span className="text-pink-600 font-extrabold">{rec.recommended_selector}</span></div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => applyRecommendation(rec)}
                        className="w-full py-2 bg-white hover:bg-pink-50 text-[10px] font-bold text-pink-600 rounded-xl transition-all border border-pink-100 shadow-sm cursor-pointer"
                      >
                        📥 이 추천 룰 즉시 수집 로봇에 주입
                      </button>
                    </div>
                  ))}
                  {recommendations.length === 0 && (
                    <p className="text-center py-20 text-xs font-bold text-slate-450 col-span-2 font-sans">
                      산업군 및 원재료명을 기입하고 AI 추천 구동 단추를 누르면, 전세계의 정밀 고시/포털 가격 사이트 수집 룰을 실시간 발굴합니다.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
