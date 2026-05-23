"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, CloudRain, Sun, Cloud, Zap, ArrowRight, Check, Send, 
  BookOpen, Phone, CheckCircle2, MessageSquare, AlertCircle
} from "lucide-react";

interface CustomerInsight {
  totalCustomers: number;
  churnRiskCount: number;
  vipCount: number;
  newCount: number;
  popularProducts: string[];
}

interface Strategy {
  strategyTitle: string;
  strategyDescription: string;
  targetGroup: string;
  targetIds: number[];
  smsContent: string;
  estimatedRevenue: string;
  estimatedConversionRate: string;
}

interface ContentPack {
  blog: {
    title: string;
    body: string;
    tags: string[];
    imagePrompt: string;
  };
  instagram: {
    caption: string;
    hashtags: string[];
    visualDirection: string;
  };
  shorts: {
    sceneList: Array<{
      sceneNum: number;
      visualDescription: string;
      voiceScript: string;
      duration: string;
    }>;
    audioTrack: string;
  };
}

export default function AiCopilotWidget() {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState("비");
  const [insights, setInsights] = useState<CustomerInsight | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [contentPack, setContentPack] = useState<ContentPack | null>(null);
  const [mobileText, setMobileText] = useState("");
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"strategy" | "sms" | "omni">("strategy");
  const [omniChannel, setOmniChannel] = useState<"blog" | "instagram" | "shorts">("blog");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executedResult, setExecutedResult] = useState<any>(null);
  
  // 모바일 폰 모의(Simulation) 모달 제어
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);
  const [mobileAlertReceived, setMobileAlertReceived] = useState(false);

  useEffect(() => {
    fetchBriefingData(weather);
  }, []);

  const fetchBriefingData = async (selectedWeather: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai-briefing?weather=${encodeURIComponent(selectedWeather)}`);
      const data = await res.json();
      if (data.success) {
        setInsights(data.insights);
        setStrategy(data.strategy);
        setContentPack(data.contentPack);
        setMobileText(data.mobileBriefingText);
      }
    } catch (e) {
      console.error("Failed to load AI briefing:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleWeatherChange = (newWeather: string) => {
    setWeather(newWeather);
    fetchBriefingData(newWeather);
  };

  const handleLaunchCampaign = async () => {
    if (!strategy || !contentPack) return;
    setIsExecuting(true);
    try {
      const res = await fetch("/api/ai-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy, contentPack })
      });
      const data = await res.json();
      if (data.success) {
        setExecutedResult(data.details);
      } else {
        alert("가동 실패: " + data.error);
      }
    } catch (e) {
      alert("캠페인 실행 중 에러가 발생했습니다.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSendMobileBriefing = () => {
    setMobileAlertReceived(false);
    setShowMobileSimulator(true);
    setTimeout(() => {
      setMobileAlertReceived(true);
    }, 1500);
  };

  if (loading && !insights) {
    return (
      <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center animate-pulse">
        <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-4 animate-spin" />
        <h3 className="text-white font-bold text-lg">이지데스크 AI 1인 마케터 분석 중...</h3>
        <p className="text-slate-400 text-sm mt-1">매장 CRM 및 환경 지표를 융합하여 오늘 최고의 마케팅 기획을 생성하고 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* 럭셔리 네온 데코레이션 배경 광원 */}
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl -z-10"></div>

      {/* 메인 Glassmorphism 카드 */}
      <div className="w-full bg-gradient-to-r from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {/* 상단 띠 효과 */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        {/* 뱃지 및 로고 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center animate-bounce">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full uppercase">Autonomous AI</span>
                <span className="text-[11px] font-extrabold tracking-wider bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full uppercase">Beta</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mt-1">EZDesk AI 자율 마케팅 파트너</h2>
            </div>
          </div>

          {/* 날씨 변경 시뮬레이터 */}
          <div className="flex items-center bg-slate-800/80 border border-white/5 rounded-2xl p-1.5 self-start md:self-auto shadow-inner">
            <span className="text-xs font-bold text-slate-400 px-2">날씨 연동 시뮬레이터:</span>
            <button 
              onClick={() => handleWeatherChange("비")} 
              className={`p-2 rounded-xl text-sm flex items-center transition-all ${weather === "비" ? "bg-indigo-600 text-white font-extrabold shadow" : "text-slate-400 hover:text-white"}`}
            >
              <CloudRain className="w-4 h-4 mr-1" />
              비
            </button>
            <button 
              onClick={() => handleWeatherChange("맑음")} 
              className={`p-2 rounded-xl text-sm flex items-center transition-all ${weather === "맑음" ? "bg-amber-600 text-white font-extrabold shadow" : "text-slate-400 hover:text-white"}`}
            >
              <Sun className="w-4 h-4 mr-1" />
              맑음
            </button>
            <button 
              onClick={() => handleWeatherChange("흐림")} 
              className={`p-2 rounded-xl text-sm flex items-center transition-all ${weather === "흐림" ? "bg-slate-700 text-white font-extrabold shadow" : "text-slate-400 hover:text-white"}`}
            >
              <Cloud className="w-4 h-4 mr-1" />
              흐림
            </button>
          </div>
        </div>

        {/* 첫화면 서머리 브리핑 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 relative">
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                🌦️ 오늘 같이 <b>차분하게 {weather === "비" ? "비가 내리는" : weather === "맑음" ? "화창하고 맑은" : "구름이 가득하고 흐린"} 날</b>에는 날씨성 고객 이탈이 많이 발생합니다. 
                이지데스크 AI가 매장 CRM을 분석한 결과, 
                {weather === "비" ? (
                  <span>최근 30일간 소식이 뜸해진 <b>이탈 우려 단골고객 {insights?.churnRiskCount}명</b>이 감지되었습니다. </span>
                ) : weather === "맑음" ? (
                  <span>매장의 든든한 버팀목인 <b>최고 VIP 고객 {insights?.vipCount}명</b>의 로열티를 강화할 특별한 혜택을 쏘아보세요. </span>
                ) : (
                  <span>매장 웰컴백 효과를 극대화할 **신규 가입 고객 {insights?.newCount}명**을 락인(Lock-in)하기에 가장 완벽한 날씨입니다. </span>
                )}
                오늘의 시그니처 <b>{insights?.popularProducts[0]}</b> 메뉴를 결합한 초일류 성장 플랜을 바로 승인해 보세요!
              </p>
            </div>

            {/* 주요 지표 뱃지 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/30 border border-white/5 rounded-xl p-3 text-center transition-all hover:scale-105">
                <span className="text-[11px] font-bold text-slate-400 block mb-0.5">이탈 우려</span>
                <span className="text-lg font-black text-rose-400">{insights?.churnRiskCount}명</span>
              </div>
              <div className="bg-slate-800/30 border border-white/5 rounded-xl p-3 text-center transition-all hover:scale-105">
                <span className="text-[11px] font-bold text-slate-400 block mb-0.5">단골 VIP</span>
                <span className="text-lg font-black text-indigo-400">{insights?.vipCount}명</span>
              </div>
              <div className="bg-slate-800/30 border border-white/5 rounded-xl p-3 text-center transition-all hover:scale-105">
                <span className="text-[11px] font-bold text-slate-400 block mb-0.5">신규 가입</span>
                <span className="text-lg font-black text-emerald-400">{insights?.newCount}명</span>
              </div>
            </div>
          </div>

          {/* 메인 버튼 존 */}
          <div className="flex flex-col gap-3 h-full justify-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center transition-all duration-300 transform active:scale-95"
            >
              <Zap className="w-5 h-5 mr-2 animate-pulse" />
              {isOpen ? "오늘의 성장 플랜 접기" : "오늘의 AI 성장 플랜 열기"}
              <ArrowRight className={`w-4 h-4 ml-2 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
            </button>
            
            <button
              onClick={handleSendMobileBriefing}
              className="w-full py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 font-extrabold rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95"
            >
              <Phone className="w-4 h-4 mr-2" />
              스마트폰으로 브리핑 받기
            </button>
          </div>
        </div>

        {/* 상세 아코디언 영역 */}
        {isOpen && (
          <div className="mt-8 border-t border-white/10 pt-6 space-y-6 animate-fade-in">
            {/* 탭 헤더 */}
            <div className="flex border-b border-white/5 pb-2">
              <button 
                onClick={() => setActiveTab("strategy")}
                className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === "strategy" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-white"}`}
              >
                1. 성장 전략 분석 리포트
              </button>
              <button 
                onClick={() => setActiveTab("sms")}
                className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === "sms" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-white"}`}
              >
                2. 초개인화 문자 미리보기
              </button>
              <button 
                onClick={() => setActiveTab("omni")}
                className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === "omni" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-white"}`}
              >
                3. 옴니채널 마케팅 스튜디오
              </button>
            </div>

            {/* 탭 콘텐츠 1: 전략 리포트 */}
            {activeTab === "strategy" && strategy && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-black text-white flex items-center">
                    <Sparkles className="w-5 h-5 text-indigo-400 mr-2" />
                    {strategy.strategyTitle}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-4 rounded-xl border border-white/5">
                    {strategy.strategyDescription}
                  </p>
                </div>
                {/* 우측 기대 성과 지표 */}
                <div className="bg-gradient-to-b from-indigo-950/40 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                  <span className="text-xs font-black text-indigo-300 uppercase tracking-wider block">AI 예상 퍼포먼스</span>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block">예상 신규 추가 매출</span>
                      <span className="text-xl font-black text-indigo-400">{strategy.estimatedRevenue}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block">타겟 캠페인 전환율</span>
                      <span className="text-xl font-black text-emerald-400">{strategy.estimatedConversionRate}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block">도달 예상 고객 규모</span>
                      <span className="text-base font-bold text-white">{strategy.targetIds.length}명</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 탭 콘텐츠 2: 초개인화 문자 */}
            {activeTab === "sms" && strategy && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300 leading-relaxed font-semibold">
                      이 문자는 대형 일괄 스팸 문자와 다릅니다. 이지데스크 AI가 날씨와 고객 성명 변수(<code>{"{이름}"}</code>)를 자동 치환하여 각 고객의 성함과 매장 단골 매칭 데이터를 결합해 1:1 개인화 감성으로 발송됩니다.
                    </p>
                  </div>
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 font-mono text-xs text-emerald-400 h-40 overflow-y-auto whitespace-pre-wrap">
                    {strategy.smsContent}
                  </div>
                </div>
                
                {/* 폰 모양 시각적 미리보기 */}
                <div className="mx-auto w-[240px] h-[360px] bg-slate-950 rounded-[40px] border-4 border-slate-700 shadow-2xl relative overflow-hidden flex flex-col p-4">
                  <div className="w-16 h-3.5 bg-slate-700 rounded-full mx-auto mb-3 shrink-0"></div>
                  <div className="flex-1 bg-slate-900 rounded-2xl p-3 overflow-y-auto text-[10px] space-y-3">
                    <div className="bg-indigo-600 text-white rounded-2xl p-2.5 max-w-[85%] self-start shadow leading-relaxed whitespace-pre-wrap">
                      {strategy.smsContent.replace(/\{이름\}/g, "김태희")}
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-500 text-center mt-1 font-extrabold">📞 010-1234-5678 (태희님 문자 뷰 예시)</div>
                </div>
              </div>
            )}

            {/* 탭 콘텐츠 3: 옴니채널 크리에이티브 */}
            {activeTab === "omni" && contentPack && (
              <div className="space-y-6">
                {/* 3채널 이너 탭 */}
                <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-white/5 max-w-sm">
                  <button 
                    onClick={() => setOmniChannel("blog")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${omniChannel === "blog" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                    네이버 블로그
                  </button>
                  <button 
                    onClick={() => setOmniChannel("instagram")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${omniChannel === "instagram" ? "bg-pink-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    인스타그램
                  </button>
                  <button 
                    onClick={() => setOmniChannel("shorts")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${omniChannel === "shorts" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1.5"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                    유튜브 쇼츠
                  </button>
                </div>

                {/* 채널 1: 네이버 블로그 */}
                {omniChannel === "blog" && (
                  <div className="bg-slate-800/30 p-5 rounded-2xl border border-white/5 space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">AI Blog Creator</span>
                      <h4 className="text-base font-extrabold text-white bg-slate-900/60 px-3 py-2 rounded-lg border border-white/5">
                        {contentPack.blog.title}
                      </h4>
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/40 p-4 rounded-xl max-h-60 overflow-y-auto">
                      {contentPack.blog.body}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {contentPack.blog.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400 bg-slate-900/20 p-2.5 rounded-lg border border-white/5">
                      <b>🖼️ AI 비주얼 지시문(Midjourney/DALL-E 등) 추천:</b> {contentPack.blog.imagePrompt}
                    </div>
                  </div>
                )}

                {/* 채널 2: 인스타그램 */}
                {omniChannel === "instagram" && (
                  <div className="bg-slate-800/30 p-5 rounded-2xl border border-white/5 space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest block mb-1">AI Instagram Stylist</span>
                      <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/40 p-4 rounded-xl max-h-48 overflow-y-auto">
                        {contentPack.instagram.caption}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {contentPack.instagram.hashtags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] font-semibold bg-pink-500/10 text-pink-300 border border-pink-500/20 px-2 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400 bg-slate-900/20 p-2.5 rounded-lg border border-white/5">
                      <b>📸 이미지 구도 및 감성 촬영 가이드:</b> {contentPack.instagram.visualDirection}
                    </div>
                  </div>
                )}

                {/* 채널 3: 유튜브 쇼츠 대본 */}
                {omniChannel === "shorts" && (
                  <div className="bg-slate-800/30 p-5 rounded-2xl border border-white/5 space-y-4">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">AI Shorts Scriptwriter</span>
                    <div className="space-y-3">
                      {contentPack.shorts.sceneList.map((scene, idx) => (
                        <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-2">
                          <div className="text-xs font-black text-rose-300 flex items-center">
                            씬 {scene.sceneNum} ({scene.duration})
                          </div>
                          <div className="md:col-span-2 text-xs text-slate-300">
                            <b>🎬 화면 지시:</b> {scene.visualDescription}
                          </div>
                          <div className="text-xs text-white italic font-medium bg-slate-950 p-2.5 rounded border border-white/5 leading-relaxed">
                            🎙️ "{scene.voiceScript}"
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400 bg-slate-900/20 p-2.5 rounded-lg border border-white/5">
                      <b>🎵 BGM 톤앤매너 추천:</b> {contentPack.shorts.audioTrack}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 마케팅 실행 버튼 구역 */}
            <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 font-medium">
                * 아래 승인 버튼을 누르시면 {strategy.targetIds.length}명의 고객에게 초개인화 문자가 발송되며, 네이버 블로그/인스타 예약 포스팅이 즉시 스케줄링됩니다.
              </div>
              
              {!executedResult ? (
                <button
                  onClick={handleLaunchCampaign}
                  disabled={isExecuting}
                  className="py-3.5 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center transition-all duration-300 disabled:opacity-50 min-w-[200px]"
                >
                  {isExecuting ? (
                    <>
                      <Zap className="w-5 h-5 mr-2 animate-spin text-yellow-300" />
                      자율 마케팅 기동 중...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2 text-white" />
                      AI 성장 플랜 승인 및 가동
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 px-6 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div className="text-xs text-emerald-300">
                    <span className="font-black text-white block">🚀 캠페인 기동 완료!</span>
                    초개인화 문자 {executedResult.smsSent}건 발송 완료 및 옴니채널 SNS 자동 스케줄링 완료.
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* 스마트폰 아침 브리핑 모의 시뮬레이터 (모달) */}
      {showMobileSimulator && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-[50px] border-[6px] border-slate-700 max-w-[340px] w-full h-[620px] shadow-2xl relative overflow-hidden flex flex-col p-4 animate-scale-up">
            
            {/* 상단 핀 홀 */}
            <div className="w-20 h-4 bg-slate-700 rounded-full mx-auto mb-3 shrink-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-full mr-2"></div>
              <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
            </div>

            {/* 시뮬레이터 내부 본문 */}
            <div className="flex-1 bg-slate-950 rounded-[35px] p-4 flex flex-col justify-between relative overflow-hidden">
              
              {/* 푸쉬 알림 메시지 도착 효과 */}
              {mobileAlertReceived ? (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 shadow-xl animate-bounce-short">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 bg-indigo-500 rounded-lg">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-white">EZDesk AI 알림</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-extrabold">방금 전</span>
                    </div>
                    <h4 className="text-xs font-black text-white">✨ 아침 비즈니스 브리핑 도착!</h4>
                    <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                      오늘 비 내리는 {new Date().toLocaleDateString("ko-KR", { weekday: "long" })}을 위한 AI 매출 전략이 준비되었습니다. 터치하여 성장 카드를 확인하세요.
                    </p>
                  </div>

                  {/* 상세 챗봇/카카오톡 뷰 */}
                  <div className="bg-slate-900 rounded-2xl p-3 text-[10px] text-slate-300 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap border border-white/5 shadow-inner">
                    {mobileText}
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        setShowMobileSimulator(false);
                        setIsOpen(true);
                      }}
                      className="py-2.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow w-full"
                    >
                      상세 대시보드로 이동
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                  <h4 className="text-sm font-bold text-slate-200">사장님 스마트폰으로 브리핑 전송 중...</h4>
                  <p className="text-xs text-slate-400">카카오톡/문자 채널 연동 모듈을 통해 시뮬레이션 데이터를 전송하고 있습니다.</p>
                </div>
              )}

              {/* 닫기 버튼 */}
              <button 
                onClick={() => setShowMobileSimulator(false)}
                className="mt-3 py-2 text-slate-400 hover:text-white font-bold text-[11px] shrink-0 text-center"
              >
                시뮬레이터 닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
