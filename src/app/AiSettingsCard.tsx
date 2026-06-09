"use client";
import { useState, useEffect } from "react";
import { Bot, Save, Check, KeyRound, Cpu } from "lucide-react";

export default function AiSettingsCard() {
  const [apiKey, setApiKey] = useState("");
  const [aiModel, setAiModel] = useState("gemini-3.5-flash");
  const [omnichannelEnabled, setOmnichannelEnabled] = useState(true);
  const [copilotWidgetEnabled, setCopilotWidgetEnabled] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // DB에서 API 키 불러오기
    fetch('/api/settings?key=google_ai_api_key')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.value) {
          setApiKey(data.value);
        }
      })
      .catch(e => console.error(e));

    // DB에서 AI 모델명 불러오기
    fetch('/api/settings?key=google_ai_model')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.value) {
          setAiModel(data.value);
        }
      })
      .catch(e => console.error(e));

    // DB에서 옴니채널 AI 활성화 여부 불러오기
    fetch('/api/settings?key=omnichannel_ai_enabled')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.value !== null) {
          setOmnichannelEnabled(data.value !== 'false');
        }
      })
      .catch(e => console.error(e));

    // DB에서 자율 마케팅 파트너 활성화 여부 불러오기
    fetch('/api/settings?key=copilot_widget_enabled')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.value !== null) {
          setCopilotWidgetEnabled(data.value !== 'false');
        }
      })
      .catch(e => console.error(e));
  }, []);

  const handleSave = async () => {
    try {
      // 1. API Key 저장
      const resKey = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'google_ai_api_key', value: apiKey })
      });
      const dataKey = await resKey.json();

      // 2. AI 모델명 저장
      const resModel = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'google_ai_model', value: aiModel })
      });
      const dataModel = await resModel.json();

      // 3. 옴니채널 AI 활성화 여부 저장
      const resOmni = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'omnichannel_ai_enabled', value: omnichannelEnabled ? 'true' : 'false' })
      });
      const dataOmni = await resOmni.json();

      // 4. 자율 마케팅 파트너 활성화 여부 저장
      const resCopilot = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'copilot_widget_enabled', value: copilotWidgetEnabled ? 'true' : 'false' })
      });
      const dataCopilot = await resCopilot.json();

      if (dataKey.success && dataModel.success && dataOmni.success && dataCopilot.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        alert("저장 실패: " + (dataKey.error || dataModel.error || dataOmni.error || dataCopilot.error || "알 수 없는 에러"));
      }
    } catch (e: any) {
      alert("서버 연결 오류: " + e.message);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50/80 p-6 md:p-8 rounded-2xl shadow-sm border border-indigo-100 mt-6 relative overflow-hidden">
      <div className="relative z-10 flex flex-col gap-6">
        {/* 1단: 헤더 영역 */}
        <div className="border-b border-indigo-100/60 pb-4">
          <h2 className="text-lg font-extrabold text-indigo-950 flex items-center gap-2">
            <Bot className="w-5.5 h-5.5 text-indigo-600 animate-pulse" /> 
            AI 비서 및 이지봇 모델 설정
          </h2>
          <p className="text-xs text-indigo-750/90 mt-1.5 leading-relaxed">
            구글 AI API Key와 사용할 Gemini 모델을 선택하면 AI 분석 비서가 활성화되어 고객 자동 분석 및 문자 작성, 이지봇(EasyBot) 통계 대화가 연동 작동합니다.
          </p>
        </div>
        
        {/* 2단: 설정 입력 폼 영역 */}
        <div className="flex flex-col gap-6 w-full">
          {/* Row 1: API Key & Model Select */}
          <div className="flex flex-col md:flex-row items-end gap-4 w-full">
            {/* API Key 입력 (비율 5) */}
            <div className="flex-[5] min-w-0 w-full">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold text-indigo-800 tracking-wider uppercase whitespace-nowrap">
                  Google AI API Key
                </label>
                {!apiKey && (
                  <span className="text-[9.5px] font-black text-rose-600 animate-pulse">
                    ⚠️ 필수 입력 필요
                  </span>
                )}
              </div>
              <div className={`flex items-center border rounded-xl overflow-hidden shadow-sm transition-all w-full focus-within:ring-2 ${
                !apiKey 
                  ? "border-rose-300 bg-rose-50/15 focus-within:ring-rose-500 focus-within:border-rose-500" 
                  : "border-indigo-200 bg-white/90 focus-within:ring-indigo-500 focus-within:border-indigo-500"
              }`}>
                <div className="pl-4 pr-3 flex items-center justify-center shrink-0">
                  <KeyRound className={`h-4 w-4 ${!apiKey ? "text-rose-500" : "text-indigo-400"}`} />
                </div>
                <input
                  type="password"
                  placeholder="구글 API Key 입력 (AIzaSy...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full py-2.5 outline-none text-xs font-medium placeholder-indigo-300 bg-transparent text-indigo-950 font-bold"
                  title="Google AI API Key"
                />
              </div>
              {!apiKey && (
                <p className="text-[10px] font-black text-rose-600 mt-1.5 leading-normal flex items-start gap-1">
                  <span>💡</span>
                  <span>API 키가 등록되지 않았습니다. 입력란에 키를 등록하고 저장해야 AI 견적 OCR, 계약 분석 및 이지봇 등 주요 AI 기능이 정상(실시간 API 연결) 작동합니다.</span>
                </p>
              )}
            </div>

            {/* 모델 선택 select (비율 4) */}
            <div className="flex-[4] min-w-0 w-full">
              <label className="block text-[11px] font-bold text-indigo-800 mb-1.5 tracking-wider uppercase whitespace-nowrap">Active Gemini Model</label>
              <div className="flex items-center border border-indigo-200 rounded-xl bg-white/90 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 shadow-sm transition-all w-full">
                <div className="pl-4 pr-3 flex items-center justify-center shrink-0 pointer-events-none">
                  <Cpu className="h-4 w-4 text-indigo-400" />
                </div>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="flex-1 w-full py-2.5 outline-none text-xs font-bold text-indigo-950 cursor-pointer appearance-none bg-transparent text-ellipsis"
                  title="Gemini AI 모델 선택"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
                <div className="pr-4 pl-3 flex items-center justify-center shrink-0 pointer-events-none">
                  <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: AI Toggles & Save Button */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 w-full border-t border-indigo-100/60 pt-5 mt-1">
            {/* 토글 스위치 영역 */}
            <div className="flex flex-col gap-4">
              {/* 토글 1: 옴니채널 AI 원고 생성 */}
              <div className="flex items-center gap-3.5">
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={omnichannelEnabled}
                    onChange={(e) => setOmnichannelEnabled(e.target.checked)}
                    className="sr-only peer"
                    id="omnichannel-toggle"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
                <div className="flex flex-col">
                  <label htmlFor="omnichannel-toggle" className="text-xs font-extrabold text-indigo-950 cursor-pointer select-none">
                    옴니채널 AI 광고 원고 생성 기능 활성화
                  </label>
                  <p className="text-[10px] text-indigo-700/80 mt-0.5 leading-normal">
                    비활성화(중지) 시 구글 AI API 호출을 완전히 차단하고 비용이 소모되지 않는 로컬 폴백 템플릿만 사용합니다.
                  </p>
                </div>
              </div>

              {/* 토글 2: AI 자율 마케팅 파트너 대시보드 위젯 */}
              <div className="flex items-center gap-3.5">
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={copilotWidgetEnabled}
                    onChange={(e) => setCopilotWidgetEnabled(e.target.checked)}
                    className="sr-only peer"
                    id="copilot-toggle"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
                <div className="flex flex-col">
                  <label htmlFor="copilot-toggle" className="text-xs font-extrabold text-indigo-950 cursor-pointer select-none">
                    대시보드 AI 자율 마케팅 파트너(어시스턴트) 위젯 활성화
                  </label>
                  <p className="text-[10px] text-indigo-700/80 mt-0.5 leading-normal">
                    비활성화 시 대시보드 최상단의 AI 자율 마케팅 카드(날씨 시뮬레이션, 성장 플랜 등)를 완전히 감춥니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="shrink-0 w-full lg:w-auto flex items-end lg:self-center">
              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all w-full shadow-md hover:shadow-lg active:scale-95 duration-150 transform whitespace-nowrap"
              >
                {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {isSaved ? "저장완료" : "설정 저장하기"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
