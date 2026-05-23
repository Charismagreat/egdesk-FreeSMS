"use client";
import { useState, useEffect } from "react";
import { Bot, Save, Check, KeyRound, Cpu } from "lucide-react";

export default function AiSettingsCard() {
  const [apiKey, setApiKey] = useState("");
  const [aiModel, setAiModel] = useState("gemini-3.5-flash");
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

      if (dataKey.success && dataModel.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        alert("저장 실패: " + (dataKey.error || dataModel.error || "알 수 없는 에러"));
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
        
        {/* 2단: 설정 입력 폼 영역 (절대 깨지지 않는 Flex 래퍼 그룹화 방식) */}
        <div className="flex flex-col md:flex-row items-end gap-4 w-full">
          {/* API Key 입력 (비율 5) */}
          <div className="flex-[5] min-w-0 w-full">
            <label className="block text-[11px] font-bold text-indigo-800 mb-1.5 tracking-wider uppercase whitespace-nowrap">Google AI API Key</label>
            <div className="flex items-center border border-indigo-200 rounded-xl bg-white/90 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 shadow-sm transition-all w-full">
              <div className="pl-4 pr-3 flex items-center justify-center shrink-0">
                <KeyRound className="h-4 w-4 text-indigo-400" />
              </div>
              <input
                type="password"
                placeholder="구글 API Key 입력 (AIzaSy...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full py-2.5 outline-none text-xs font-medium placeholder-indigo-300 bg-transparent"
                title="Google AI API Key"
              />
            </div>
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

          {/* 저장 버튼 (비율 2) */}
          <div className="flex-[2] shrink-0 w-full md:w-auto">
            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all w-full shadow-md hover:shadow-lg active:scale-95 duration-150 transform whitespace-nowrap"
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isSaved ? "저장완료" : "설정 저장하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
