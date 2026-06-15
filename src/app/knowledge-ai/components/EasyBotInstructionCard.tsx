"use client";

import React, { useState, useEffect } from "react";
import { Bot, Save, Sparkles, AlertCircle, CheckCircle } from "lucide-react";

interface EasyBotInstructionCardProps {
  currentRole: string;
}

export function EasyBotInstructionCard({ currentRole }: EasyBotInstructionCardProps) {
  const [companyContext, setCompanyContext] = useState("");
  const [agentInstructions, setAgentInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // 권한 검증: 최고관리자(SUPER_ADMIN) 또는 대표자(PRESIDENT)만 엑세스 허용
  const hasAccess = currentRole === "SUPER_ADMIN" || currentRole === "PRESIDENT";

  useEffect(() => {
    if (!hasAccess) return;

    // 초기 데이터 조회
    const fetchInstructions = async () => {
      try {
        const resCtx = await fetch("/api/settings?key=easybot_company_context");
        const dataCtx = await resCtx.json();
        if (dataCtx.success && dataCtx.value) {
          setCompanyContext(dataCtx.value);
        }

        const resInst = await fetch("/api/settings?key=easybot_agent_instructions");
        const dataInst = await resInst.json();
        if (dataInst.success && dataInst.value) {
          setAgentInstructions(dataInst.value);
        }
      } catch (err) {
        console.error("이지봇 설정 데이터 로드 실패:", err);
      }
    };

    fetchInstructions();
  }, [hasAccess]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // 1. 사내 지식 기반 지침 자율 생성 (Gemini RAG 연동)
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/knowledge-ai/easybot-setup", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setCompanyContext(data.companyContext);
        setAgentInstructions(data.agentInstructions);
        showToast("지식 문서 RAG 분석을 바탕으로 맞춤 지침 초안을 생성했습니다! ✨");
      } else {
        showToast(data.error || "지침 자율 생성에 실패했습니다.", "error");
      }
    } catch (err: any) {
      showToast("서버 연결 실패: " + err.message, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. 동적 지침 DB 저장
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const resCtx = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "easybot_company_context", value: companyContext }),
      });
      const dataCtx = await resCtx.json();

      const resInst = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "easybot_agent_instructions", value: agentInstructions }),
      });
      const dataInst = await resInst.json();

      if (dataCtx.success && dataInst.success) {
        showToast("이지봇 자율 대행 지침이 데이터베이스에 저장되었습니다. 💾");
      } else {
        showToast("지침 저장에 실패했습니다. API 설정을 확인해 주세요.", "error");
      }
    } catch (err: any) {
      showToast("서버 연결 실패: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasAccess) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
      {/* 장식용 보라색 그라데이션 광원 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* 헤더 세션 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-indigo-500/20 pb-4 gap-4">
          <div>
            <h3 className="text-sm font-black text-indigo-200 tracking-wider flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400 animate-pulse" />
              이지봇(EasyBot) 에이전트 자율 대행 지침 제어
            </h3>
            <p className="text-[10px] text-slate-350 mt-1 leading-normal">
              이지봇이 데이터베이스 변경 사항을 분석할 때 활용할 회사 소개와 리스크 감시 작동 규칙을 설정합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-3.5 py-1.5 bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-450 text-white text-[10.5px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "지식 RAG 분석 중..." : "지식 데이터 기반 지침 생성"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-none text-[10.5px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "저장 중..." : "설정 저장하기"}
            </button>
          </div>
        </div>

        {/* 안내 얼럿 */}
        {(!companyContext.trim() || !agentInstructions.trim()) && (
          <div className="flex items-start gap-2.5 bg-rose-500/15 border border-rose-500/35 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10.5px] font-extrabold text-rose-300">경고: 작동 지침이 구성되어 있지 않습니다!</span>
              <p className="text-[9.5px] text-rose-200/90 leading-relaxed">
                현재 지침이 등록되어 있지 않아 이지봇이 실시간 DB 이벤트를 대행 처리하지 못하고 매번 경고 스냅태스크를 생성하게 됩니다. 
                아래 입력 필드를 직접 기재하거나 <strong>[지식 데이터 기반 지침 생성]</strong> 버튼을 통해 승인 완료된 지식 기반의 맞춤 지침 초안을 추출하여 저장해 주십시오.
              </p>
            </div>
          </div>
        )}

        {/* 폼 입력 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 회사 컨텍스트 입력란 */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[10.5px] font-bold text-slate-300">🏢 회사 소개 및 비즈니스 맥락 (Company Context)</label>
            <textarea
              rows={8}
              value={companyContext}
              onChange={(e) => setCompanyContext(e.target.value)}
              placeholder="예시:
(주)쿠스는 전국의 프랜차이즈 가맹점을 대상으로 패키징 물류 공급망 및 부가 서비스를 원스톱 제공하는 유통 솔루션 전문 기업입니다.
- 주요 리스크: 가맹점 결제 지연 및 미수금 누적, 특정 패키징 상품의 안전재고 부족, 심야 시간대의 비정상 법인카드 지출 등"
              className="w-full p-3 bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-200 font-bold placeholder-slate-600 outline-none transition-all leading-relaxed"
            />
          </div>

          {/* 작동 수칙 입력란 */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[10.5px] font-bold text-slate-300">⚡ AI 자율 감시 룰 및 행동 지침 (Agent Instructions)</label>
            <textarea
              rows={8}
              value={agentInstructions}
              onChange={(e) => setAgentInstructions(e.target.value)}
              placeholder="예시:
1. crm_expenses 테이블에 결제 금액이 30만원 이상이거나 심야(23시~06시) 결제가 발생하면, 김서준 대리(ID: 4)에게 소명 검토 지시를 할당하고 우선순위를 critical로 지정할 것.
2. crm_orders 테이블에 신규 수주 발생 시 SCM 공급망 리스크 예방을 위해 박민주 MD(ID: 3)에게 리드타임 대사 및 재고 점검 지시를 할당할 것."
              className="w-full p-3 bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-200 font-bold placeholder-slate-600 outline-none transition-all leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* 토스트 피드백 알림 */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border transition-all text-xs font-bold ${
          toast.type === "success" 
            ? "bg-slate-900 border-indigo-550 text-indigo-400" 
            : "bg-rose-950 border-rose-500/40 text-rose-400"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
