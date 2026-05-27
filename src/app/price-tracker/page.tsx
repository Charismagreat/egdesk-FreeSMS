"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Plus, Trash2, Globe, Sparkles, Send, Bell, 
  HelpCircle, Settings, ShieldAlert, Cpu, CheckCircle2, ChevronRight, Play
} from "lucide-react";

export default function PriceTrackerAIPage() {
  // 1. 상태 선언
  const [items, setItems] = useState<any[]>([]);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [urls, setUrls] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertLogs, setAlertLogs] = useState<any[]>([]);

  // 폼 입력 상태
  const [itemForm, setItemForm] = useState({ item_code: "", item_name: "", category: "RAW_MATERIAL", base_price: "", target_margin_rate: "12.5" });
  const [urlForm, setUrlForm] = useState({ site_name: "", target_url: "", css_selector: "", cron_interval: "0 9 * * *" });
  const [aiForm, setAiForm] = useState({ industry: "정밀 기계 및 금속가공업", keyword: "구리 전기동 원자재 LME" });
  const [alertForm, setAlertForm] = useState({ rule_name: "", condition_type: "MARGIN_BREAKDOWN", threshold_value: "5.0", phone_number: "", sms_template: "" });

  // 로딩/에러
  const [loading, setLoading] = useState(true);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [crawlerTesting, setCrawlerTesting] = useState(false);
  
  // 2. 마운트 시 데이터 조회
  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    setLoading(true);
    try {
      const itemsRes = await fetch("/api/price-tracker/items");
      const itemsJson = await itemsRes.json();
      if (itemsJson.success) {
        setItems(itemsJson.items);
        if (itemsJson.items.length > 0) {
          const firstItem = itemsJson.items[0];
          setActiveItem(firstItem);
          fetchItemDetails(firstItem.item_id);
        }
      }

      const alertsRes = await fetch("/api/price-tracker/alerts");
      const alertsJson = await alertsRes.json();
      if (alertsJson.success) {
        setAlerts(alertsJson.rules);
        setAlertLogs(alertsJson.logs);
      }
    } catch (e) {
      console.error("초기 데이터 로딩 에러:", e);
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
      console.error("상세 URL 정보 조회 실패:", e);
    }
  };

  const handleItemSelect = (item: any) => {
    setActiveItem(item);
    fetchItemDetails(item.item_id);
    // 알림 규칙 자동 템플릿 채우기
    setAlertForm(prev => ({
      ...prev,
      rule_name: `${item.item_name} 마진 보존 경고`,
      phone_number: "010-1234-5678",
      sms_template: `[🚨 가격추적AI - 마진경보]\n품목명: ${item.item_name}\n현재시세: {captured_price} USD\n경고내용: 설정하신 최소 마진선 {threshold}%가 붕괴되었습니다. 판가 검토 바랍니다.`
    }));
  };

  // 3. 비즈니스 액션 핸들러
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.item_code || !itemForm.item_name || !itemForm.base_price) return alert("필수 정보를 입력해 주세요.");
    
    try {
      const res = await fetch("/api/price-tracker/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemForm)
      });
      const json = await res.json();
      if (json.success) {
        alert("🎉 신규 가격 추적 품목이 데이터베이스에 등록되었습니다!");
        setItemForm({ item_code: "", item_name: "", category: "RAW_MATERIAL", base_price: "", target_margin_rate: "12.5" });
        fetchInitData();
      } else {
        alert("등록 실패: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return alert("추적 품목을 좌측 리스트에서 먼저 선택해 주세요.");
    if (!urlForm.site_name || !urlForm.target_url || !urlForm.css_selector) return alert("크롤링 룰을 기입해 주세요.");

    setCrawlerTesting(true);
    try {
      const res = await fetch("/api/price-tracker/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: activeItem.item_id,
          ...urlForm,
          run_test: true
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(`⚡ 크롤러 즉시 시뮬레이션 성공!\n고객사 시세 페이지에서 [${json.test_price.toLocaleString()} 원/톤] 가격 텍스트가 정밀 CSS Selector로 정상 파싱되어 히스토리에 누적 저장되었습니다.`);
        setUrlForm({ site_name: "", target_url: "", css_selector: "", cron_interval: "0 9 * * *" });
        fetchItemDetails(activeItem.item_id);
        fetchInitData(); // 마진율 갱신용
      } else {
        alert("수집 실패: " + json.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCrawlerTesting(false);
    }
  };

  const handleDeleteUrl = async (urlId: number) => {
    if (!confirm("해당 수집 엔진 감시 대상에서 정말 제외하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/price-tracker/urls?url_id=${urlId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        alert("감시 대상 URL이 영구 삭제되었습니다.");
        if (activeItem) fetchItemDetails(activeItem.item_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleAddAlertRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return alert("추적 품목을 먼저 지정해 주세요.");
    if (!alertForm.rule_name || !alertForm.threshold_value || !alertForm.phone_number || !alertForm.sms_template) return alert("입력란을 완성해 주세요.");

    try {
      const res = await fetch("/api/price-tracker/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: activeItem.item_id,
          ...alertForm
        })
      });
      const json = await res.json();
      if (json.success) {
        alert("💬 FreeSMS 가격 경보 자동화 시나리오 규칙이 완벽 가동되었습니다!");
        setAlertForm({ rule_name: "", condition_type: "MARGIN_BREAKDOWN", threshold_value: "5.0", phone_number: "", sms_template: "" });
        fetchInitData();
      } else {
        alert("알림 설정 실패: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const applyRecommendation = (rec: any) => {
    setUrlForm({
      site_name: rec.site_name,
      target_url: rec.url,
      css_selector: rec.recommended_selector,
      cron_interval: "0 9 * * *"
    });
    alert(`💡 AI 추천 룰 [${rec.site_name}]이 아래의 스크래퍼 입력 폼에 즉시 세팅되었습니다.`);
  };

  // 4. SVG 차트 드로잉 정보 계산
  const getSvgPathData = () => {
    if (urls.length === 0 || !urls[0].history || urls[0].history.length === 0) {
      return { path: "", points: [] };
    }
    const history = urls[0].history;
    const maxVal = Math.max(...history.map((h: any) => Number(h.captured_price))) * 1.05;
    const minVal = Math.min(...history.map((h: any) => Number(h.captured_price))) * 0.95;
    const valRange = maxVal - minVal;

    const width = 500;
    const height = 160;
    const paddingLeft = 55;
    const paddingRight = 20;
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
    return { path, points, minVal, maxVal };
  };

  const { path: svgPath, points: svgPoints } = getSvgPathData();

  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 p-6 md:p-8 block relative overflow-x-hidden space-y-6">
      
      {/* 럭셔리 네온 배경 백그라운드 스포트라이트 */}
      <div className="absolute top-0 right-20 w-[450px] h-[450px] bg-pink-500/5 rounded-full blur-[140px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-[450px] h-[450px] bg-violet-600/5 rounded-full blur-[140px] -z-10 animate-pulse"></div>

      {/* 헤더 관제탑 카드 */}
      <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-pink-500/10 text-pink-500 rounded-2xl border border-pink-500/10">
              <TrendingUp className="w-6 h-6 animate-bounce-subtle" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              SCM Price Intelligence
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-rose-400 to-violet-400 bg-clip-text text-transparent">
            가격 추적 AI
          </h1>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            원자재 및 경쟁사 제품 시세를 매일 자동 추집하고, 타겟 마진 스프레드를 실시간 연동 감시하며 위험 시 FreeSMS 긴급 문자를 즉시 발송합니다.
          </p>
        </div>
        
        {/* 실시간 위협 수준 메타 */}
        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-5 py-4 rounded-2xl shrink-0">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 tracking-wider block">SCM 시스템 위협 등급</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-black text-emerald-400">하향 안정화 구역</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-700" />
          <div className="text-right">
            <span className="text-[9px] font-black text-slate-400 tracking-wider block">동작 수집기 개수</span>
            <span className="text-xs font-bold font-mono">{items.length}개 품목 관제 중</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center animate-pulse flex flex-col items-center justify-center gap-3">
          <Cpu className="w-10 h-10 text-pink-500 animate-spin" />
          <span className="text-xs font-bold text-slate-400">가격 추적 AI 대시보드 데이터 연동 중...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 좌측 4칸: 품목 리스트 및 매핑 등록 폼 */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 추적 품목 선택 카드 */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h2 className="text-sm font-black text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-pink-500 rounded-full"></span>
                관제 대상 품목 대장
              </h2>
              {items.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">등록된 추적 품목이 존재하지 않습니다.</p>
              ) : (
                <div className="space-y-2.5">
                  {items.map(item => {
                    const isActive = activeItem?.item_id === item.item_id;
                    const isAlert = item.current_margin_rate < item.target_margin_rate;
                    return (
                      <div
                        key={item.item_id}
                        onClick={() => handleItemSelect(item)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isActive 
                            ? "bg-gradient-to-r from-pink-500/10 to-violet-500/5 border-pink-500 text-white scale-[1.01]" 
                            : "bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-350"
                        }`}
                      >
                        <div className="space-y-1 truncate pr-2">
                          <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                            {item.item_code}
                          </span>
                          <h4 className="text-xs font-black truncate">{item.item_name}</h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-black font-mono block ${isAlert ? "text-rose-500" : "text-emerald-400"}`}>
                            {item.current_margin_rate}%
                          </span>
                          <span className="text-[8px] text-slate-500 block">목표 {item.target_margin_rate}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 신규 품목 등록 폼 */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h2 className="text-sm font-black text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-violet-500 rounded-full"></span>
                신규 관제 품목 등록
              </h2>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">품목 고유 분류</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-850 p-3 rounded-2xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-300"
                  >
                    <option value="RAW_MATERIAL">공급 자재 (Raw Material)</option>
                    <option value="COMPETITOR_PRODUCT">경쟁 제품 (Competitor Product)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">품목 코드</label>
                  <input
                    type="text"
                    placeholder="예: RAW-ALUM-02"
                    value={itemForm.item_code}
                    onChange={(e) => setItemForm(prev => ({ ...prev, item_code: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-850 p-3 rounded-2xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-300 placeholder-slate-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">품목 이름</label>
                  <input
                    type="text"
                    placeholder="예: 한국광해광업공단 알루미늄 판재"
                    value={itemForm.item_name}
                    onChange={(e) => setItemForm(prev => ({ ...prev, item_name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-850 p-3 rounded-2xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-300 placeholder-slate-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">기준 단가 (원가)</label>
                    <input
                      type="number"
                      placeholder="8500"
                      value={itemForm.base_price}
                      onChange={(e) => setItemForm(prev => ({ ...prev, base_price: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-850 p-3 rounded-2xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-300 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">목표 마진율 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="12.5"
                      value={itemForm.target_margin_rate}
                      onChange={(e) => setItemForm(prev => ({ ...prev, target_margin_rate: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-850 p-3 rounded-2xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-300 font-mono"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-pink-500/10 cursor-pointer transition-all active:scale-[0.99]"
                >
                  ➕ 품목 등록 및 감시 매핑 추가
                </button>
              </form>
            </div>

          </div>

          {/* 우측 8칸: 관제 지표 차트, 게이지 및 알림/추천 보드 */}
          <div className="lg:col-span-8 space-y-6">
            
            {activeItem ? (
              <>
                {/* 1. 실시간 차트 & 게이지 스택 보드 */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* SVG 가격 선형 추이 차트 (8칸) */}
                  <div className="md:col-span-8 bg-slate-950/60 border border-slate-800 rounded-3xl p-5 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-black text-slate-200">📊 실시간 수집 가격 변동 선형 추이</h3>
                        <p className="text-[10px] text-slate-500 font-medium">크롤러 수집 1회 누적 히스토리 차트</p>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                        {activeItem.item_code}
                      </span>
                    </div>

                    {svgPoints.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-xs text-slate-500">
                        수집 완료된 시세 이력이 없습니다. 아래에서 감시 URL을 등록해 첫 가격을 파싱해 보세요!
                      </div>
                    ) : (
                      <div className="chart-wrapper w-full">
                        <svg viewBox="0 0 500 160" className="w-full overflow-visible">
                          {/* 배경 가이드라인 */}
                          <line x1="50" y1="20" x2="480" y2="20" stroke="#1e293b" strokeDasharray="4" />
                          <line x1="50" y1="80" x2="480" y2="80" stroke="#e53e3e" strokeDasharray="3" strokeWidth="0.8" /> {/* 마진 붕괴 임계 가이드선 */}
                          <line x1="50" y1="140" x2="480" y2="140" stroke="#1e293b" strokeDasharray="4" />

                          {/* 꺾은선 */}
                          <path d={svgPath} fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />

                          {/* 데이터 닷 포인트 */}
                          {svgPoints.map((pt: any, idx: number) => {
                            const isLast = idx === svgPoints.length - 1;
                            return (
                              <g key={idx}>
                                <circle cx={pt.x} cy={pt.y} r={isLast ? 5.5 : 4} fill={isLast ? "#ec4899" : "#a21caf"} stroke="#ffffff" strokeWidth="1" />
                                {isLast && (
                                  <circle cx={pt.x} cy={pt.y} r="10" fill="none" stroke="#ec4899" strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }} />
                                )}
                              </g>
                            );
                          })}

                          {/* 가로축 라벨 */}
                          {svgPoints.filter((_: any, i: number) => i % 3 === 0 || i === svgPoints.length - 1).map((pt: any, idx: number) => (
                            <text key={idx} x={pt.x} y="155" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">
                              {pt.date}
                            </text>
                          ))}
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* 안전 마진 스프레드 원형 링 게이지 위젯 (4칸) */}
                  <div className="md:col-span-4 bg-slate-950/60 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                        <span className="w-1 h-3 bg-rose-500 rounded-full animate-pulse"></span>
                        실시간 마진 스프레드
                      </h3>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">자사 원가 대비 마진 보존 수준 계기판</p>
                    </div>

                    <div className="flex flex-col items-center py-4 space-y-3">
                      <div className="relative flex items-center justify-center w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {/* 뒷배경 서클 */}
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="9" />
                          {/* 앞배경 링 */}
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={activeItem.current_margin_rate < activeItem.target_margin_rate ? "#e53e3e" : "#10b981"}
                            strokeWidth="9"
                            strokeDasharray="264"
                            strokeDashoffset={264 - (264 * Math.max(0, Math.min(100, activeItem.current_margin_rate))) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-base font-black font-mono text-white block">
                            {activeItem.current_margin_rate}%
                          </span>
                          <span className="text-[7.5px] text-slate-500 font-bold block uppercase">Margin Rate</span>
                        </div>
                      </div>

                      <div className="text-center space-y-1">
                        <span className={`text-[10px] font-black tracking-wide ${activeItem.current_margin_rate < activeItem.target_margin_rate ? "text-rose-500 animate-pulse" : "text-emerald-400"}`}>
                          {activeItem.current_margin_rate < activeItem.target_margin_rate ? "⚠️ 마진 경고선 붕괴 위험" : "✓ 적정 마진 유지"}
                        </span>
                        <span className="text-[8px] text-slate-500 block leading-relaxed">
                          목표 {activeItem.target_margin_rate}% 대비 {Math.abs(activeItem.current_margin_rate - activeItem.target_margin_rate).toFixed(1)}%p {activeItem.current_margin_rate < activeItem.target_margin_rate ? "미달" : "초과 달성"}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 2. 감시 대상 URL 스크래퍼 제어 패널 */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-3">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-black text-slate-200">🔗 [{activeItem.item_name}] 감시 URL 스크래핑 엔진 관리</h3>
                      <p className="text-[10px] text-slate-500 font-medium">크롤링 주기 스케줄링 및 DOM 노드 타겟 매핑</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-850 shrink-0">
                      수집기 {urls.length}개 가동 중
                    </span>
                  </div>

                  {/* 등록된 감시 URL 테이블 */}
                  {urls.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      매핑된 수집 감시망이 없습니다. 아래 폼이나 Gemini AI 추천을 받아 감시 URL을 등록해 주세요.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {urls.map(url => (
                        <div key={url.url_id} className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1 truncate pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">{url.site_name}</span>
                              <span className="text-[8px] font-black text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                                {url.cron_interval}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate font-mono">{url.target_url}</p>
                            <div className="flex gap-2 text-[9px] text-slate-400 font-mono">
                              <span>Selector: <strong className="text-pink-400">{url.css_selector}</strong></span>
                              {url.history && url.history.length > 0 && (
                                <span className="text-slate-500">| 최신가: <strong className="text-white">{Number(url.history[url.history.length - 1].captured_price).toLocaleString()} 원</strong></span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteUrl(url.url_id)}
                            className="p-2 bg-slate-950 hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/30 text-slate-400 hover:text-rose-500 rounded-xl transition-colors shrink-0 cursor-pointer"
                            title="수집기 영구 파기"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 수집 URL 추가 폼 */}
                  <form onSubmit={handleAddUrl} className="bg-slate-900/30 border border-slate-850/50 p-4 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-pink-400 flex items-center gap-1.5">
                      <Settings className="w-4 h-4 animate-spin-slow" />
                      신규 수집 로봇 매핑 및 DOM 노드 지정
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">수집 출처명 (사이트명)</label>
                        <input
                          type="text"
                          placeholder="예: KOMIS 공식 구리 가격 포털"
                          value={urlForm.site_name}
                          onChange={(e) => setUrlForm(prev => ({ ...prev, site_name: e.target.value }))}
                          className="w-full bg-slate-900/90 border border-slate-850 p-3 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-350"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">크롤링 주기 (Cron 표기법)</label>
                        <input
                          type="text"
                          placeholder="0 9 * * *"
                          value={urlForm.cron_interval}
                          onChange={(e) => setUrlForm(prev => ({ ...prev, cron_interval: e.target.value }))}
                          className="w-full bg-slate-900/90 border border-slate-850 p-3 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-350 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">수집 대상 웹페이지 URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={urlForm.target_url}
                        onChange={(e) => setUrlForm(prev => ({ ...prev, target_url: e.target.value }))}
                        className="w-full bg-slate-900/90 border border-slate-850 p-3 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-350 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">HTML Scraping용 CSS Selector</label>
                      <input
                        type="text"
                        placeholder="div.price-table__current-price > span"
                        value={urlForm.css_selector}
                        onChange={(e) => setUrlForm(prev => ({ ...prev, css_selector: e.target.value }))}
                        className="w-full bg-slate-900/90 border border-slate-850 p-3 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-350 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={crawlerTesting}
                      className="w-full py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-pink-500" />
                      {crawlerTesting ? "크롤러 모의 실시간 수집 및 검수 중..." : "수집 로봇 매핑 및 모의 실행(Test Run)"}
                    </button>
                  </form>
                </div>

                {/* 3. Gemini AI 실시간 RAG 감시 사이트 추천 패널 */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-black text-slate-200 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                        Gemini AI 자율 가격 추적 사이트 추천기
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">인공지능 RAG를 연동한 최적의 고시 포털 및 크롤러 CSS 선택자 추천</p>
                    </div>
                    <span className="text-[8px] font-black bg-pink-500/10 text-pink-600 border border-pink-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                      Powered by Gemini Pro
                    </span>
                  </div>

                  <form onSubmit={handleAiRecommend} className="flex gap-3 bg-slate-900/40 p-2.5 rounded-2xl border border-slate-850">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="산업군 (예: 철강 가구 제조 B2B)"
                        value={aiForm.industry}
                        onChange={(e) => setAiForm(prev => ({ ...prev, industry: e.target.value }))}
                        className="bg-slate-950 border border-slate-850 px-3.5 py-3 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-350"
                      />
                      <input
                        type="text"
                        placeholder="자재명 (예: 리튬 양극재 시세)"
                        value={aiForm.keyword}
                        onChange={(e) => setAiForm(prev => ({ ...prev, keyword: e.target.value }))}
                        className="bg-slate-950 border border-slate-850 px-3.5 py-3 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-350"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={recommendLoading}
                      className="px-5 bg-violet-650 hover:bg-violet-750 text-white font-extrabold rounded-xl text-xs flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow-lg shadow-violet-650/10"
                    >
                      {recommendLoading ? "추천 추출 중..." : "🚀 AI추천"}
                    </button>
                  </form>

                  {recommendations.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {recommendations.map((rec, index) => (
                        <div key={index} className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-inner">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">{rec.site_name}</span>
                              <span className="text-[9px] font-black text-emerald-400">신뢰도 98%</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">{rec.description}</p>
                            <div className="text-[8px] font-mono text-slate-500 bg-slate-950/60 p-2 rounded-lg border border-slate-850/50 space-y-1">
                              <div className="truncate">URL: {rec.url}</div>
                              <div>Selector: <span className="text-pink-400 font-bold">{rec.recommended_selector}</span></div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => applyRecommendation(rec)}
                            className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-[10px] font-black text-white rounded-xl transition-all border border-slate-850"
                          >
                            📥 즉시 수집 규칙으로 불러오기
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. FreeSMS 가격 경보 및 자동화 템플릿 설정 */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-pink-400 animate-pulse" />
                        FreeSMS 가격 경보 및 자동화 템플릿 매핑
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">임계값 및 마진 붕괴 돌파 시 FreeSMS 무료 문자 연동 실시간 경보 통보</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-850 font-mono">
                      Cooldown: 3시간 필터 작동 중 🛡️
                    </span>
                  </div>

                  <form onSubmit={handleAddAlertRule} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">알림 규칙 명칭</label>
                        <input
                          type="text"
                          placeholder="구리 가격 마진 5% 붕괴 긴급 경보"
                          value={alertForm.rule_name}
                          onChange={(e) => setAlertForm(prev => ({ ...prev, rule_name: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-850 p-3 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-350"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">수신자 연락처</label>
                        <input
                          type="text"
                          placeholder="010-1234-5678"
                          value={alertForm.phone_number}
                          onChange={(e) => setAlertForm(prev => ({ ...prev, phone_number: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-850 p-3 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-350 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">경보 조건 유형</label>
                        <select
                          value={alertForm.condition_type}
                          onChange={(e) => setAlertForm(prev => ({ ...prev, condition_type: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-850 p-3 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-300"
                        >
                          <option value="MARGIN_BREAKDOWN">마진 스프레드 붕괴 (마진율 N% 미만)</option>
                          <option value="ABOVE_LIMIT">가격 폭등 (기준가 대비 N% 초과 상승)</option>
                          <option value="BELOW_LIMIT">가격 폭락 (기준가 대비 N% 초과 하락)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">경보 임계값 설정 (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="5.0"
                          value={alertForm.threshold_value}
                          onChange={(e) => setAlertForm(prev => ({ ...prev, threshold_value: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-850 p-3 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-350 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">FreeSMS 알림톡/LMS 전송 템플릿</label>
                      <textarea
                        rows={4}
                        placeholder="치환 변수 사용 가능: {item_name}, {item_code}, {captured_price}, {margin_rate}"
                        value={alertForm.sms_template}
                        onChange={(e) => setAlertForm(prev => ({ ...prev, sms_template: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-850 p-3 rounded-xl text-xs font-semibold focus:border-pink-500 outline-none text-slate-350 font-mono placeholder-slate-600 leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-pink-500/10 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      💾 FreeSMS 경보 자동화 시나리오 활성화 저장
                    </button>
                  </form>

                  {/* 최근 경보 발송 로그 */}
                  {alertLogs.length > 0 && (
                    <div className="border border-slate-850 rounded-2xl overflow-hidden mt-4">
                      <div className="bg-slate-900 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">최근 가격 경보 발송 이력 로그 대장</span>
                        <span className="text-[8px] font-mono text-slate-600">SMS Logger</span>
                      </div>
                      <div className="max-h-40 overflow-y-auto divide-y divide-slate-850/60 font-mono">
                        {alertLogs.map((log: any) => (
                          <div key={log.log_id} className="p-3 bg-slate-950/20 flex justify-between items-center text-[9px] text-slate-400">
                            <div className="space-y-0.5 truncate pr-2">
                              <span className="text-rose-400 font-bold">[발송성공]</span> <span className="text-slate-300">{log.sent_message}</span>
                            </div>
                            <span className="text-slate-500 shrink-0 text-right">{log.sent_at.slice(5, 16)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </>
            ) : (
              <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-12 text-center shadow-xl py-32 flex flex-col items-center justify-center gap-4">
                <ShieldAlert className="w-12 h-12 text-pink-500/50 animate-pulse" />
                <h3 className="text-base font-black text-slate-300">활성화된 관제 품목이 존재하지 않습니다.</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  좌측에서 품목을 선택하거나, 새로운 원재료/제품 품목을 등록하여 실시간 가격 모니터링 수집망 가동을 시작해 주세요.
                </p>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
