"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { Database, BarChart, FileText, Calendar, RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import DBChartRenderer from '@/components/DBChartRenderer';

export default function PublicShareViewerPage() {
  const params = useParams();
  const shareId = params?.shareId as string;

  const [dashboard, setDashboard] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    if (!shareId) return;

    const fetchDashboard = async () => {
      try {
        const res = await fetch(`/api/db/ai-visualize/share?shareId=${shareId}`);
        const data = await res.json();
        if (data.success && data.dashboard) {
          setDashboard(data.dashboard);
        } else {
          setError(data.error || "대시보드를 로드할 수 없습니다.");
        }
      } catch (err: any) {
        setError("서버와 통신하는 중 치명적인 네트워크 에러가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center animate-pulse">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-black text-slate-350">공개 지능형 대시보드 불러오는 중</h2>
          <p className="text-[10px] text-slate-500">실시간 데이터 동기화 및 보안 채널 확인 완료 중...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-950/30 border border-rose-900/50 flex items-center justify-center text-rose-500">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-sm font-black text-rose-500">웹 게시 대시보드 로드 실패</h2>
          <p className="text-[10px] text-slate-400">{error || "존재하지 않거나 비활성화된 공유 대시보드입니다. 링크 소유자에게 문의해 주세요."}</p>
        </div>
      </div>
    );
  }

  // 데이터 스펙 및 브리핑 파싱
  let specObj: any = null;
  let sampleRows: any[] = [];
  try {
    specObj = typeof dashboard.chart_spec_json === 'string'
      ? JSON.parse(dashboard.chart_spec_json)
      : dashboard.chart_spec_json;
    
    if (specObj && specObj.sampleRows) {
      sampleRows = specObj.sampleRows;
    }
  } catch (e) {
    console.error("차트 스펙 JSON 파싱 에러:", e);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col leading-normal select-none">
      
      {/* 🚀 퍼블릭 탑 바 헤더 */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-xs font-black tracking-wider text-slate-200">EGDESK SHARED BI</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${
            dashboard.refresh_interval === 'NONE' ? 'bg-slate-900 text-slate-450 border-slate-800' :
            dashboard.refresh_interval === 'HOURLY' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            dashboard.refresh_interval === 'DAILY' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            'bg-purple-500/10 text-purple-400 border-purple-500/20'
          }`}>
            {dashboard.refresh_interval === 'NONE' ? '정적 데이터' :
             dashboard.refresh_interval === 'HOURLY' ? '매시간 자동 갱신됨' :
             dashboard.refresh_interval === 'DAILY' ? '매일 자동 갱신됨' :
             '매주 자동 갱신됨'}
          </span>
          
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-semibold font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            마지막 갱신: {dashboard.last_refreshed_at || '-'}
          </div>
        </div>
      </header>

      {/* 🎯 몰입형 단독 뷰 콘텐트 바디 */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* 대시보드 타이틀 정보 */}
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{dashboard.title}</h1>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-2xl">
            본 보고서는 최고관리자 자연어 분석 질의에 기반하여 Gemini AI 비즈니스 지능형 엔진과 4단계 보안 비식별화 가드레일을 통과해 실시간 생성 및 퍼블릭 공유된 안전 보고서입니다.
          </p>
        </div>

        {/* 웅장한 다크 테마 일체형 통합 대시보드 카드 */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">
          
          {/* 📊 1. 지능형 SVG 차트 렌더러 영역 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <BarChart className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-black text-slate-350 tracking-wider">1. AI 지능형 시각화 차트 분석</h2>
            </div>
            
            <div className="bg-slate-950/50 rounded-2xl p-4 overflow-hidden border border-slate-900/40">
              {specObj ? (
                <DBChartRenderer spec={specObj} rows={sampleRows} />
              ) : (
                <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
                  <Activity className="w-8 h-8 text-slate-650" />
                  <span className="text-xs font-bold">차트 구성 스펙이 올바르지 않습니다.</span>
                </div>
              )}
            </div>
          </div>

          {/* 일체형 대시보드 다크 구분 경계선 */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-850 to-transparent my-8" />

          {/* 📝 2. AI 비즈니스 통찰 브리핑 요약 영역 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-black text-slate-350 tracking-wider">2. AI 데이터 비즈니스 통찰 및 브리핑 요약</h2>
            </div>
            
            {dashboard.briefing_markdown ? (
              <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-2xl p-6 shadow-inner animate-fade-in">
                <div className="text-xs md:text-sm font-semibold leading-relaxed text-slate-300 whitespace-pre-line font-sans">
                  {dashboard.briefing_markdown}
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-950/30 border border-slate-900 border-dashed rounded-2xl flex flex-col items-center justify-center text-center text-slate-500">
                <Activity className="w-6 h-6 text-slate-650 mb-1.5" />
                <p className="text-xs font-bold">비즈니스 브리핑 리포트를 불러오지 못했습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* ⏰ 모바일용 갱신 시각 피드 */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 text-[10px] text-slate-600 font-bold font-mono py-2">
          <Calendar className="w-3.5 h-3.5 text-slate-600" />
          최종 갱신 시각: {dashboard.last_refreshed_at || '-'}
        </div>
      </main>

      {/* 💳 퍼블릭 푸터 */}
      <footer className="border-t border-slate-900 py-6 text-center text-[10px] text-slate-500 font-semibold select-none">
        © 2026 EGDESK FreeSMS. Powered by Gemini Generative AI Platform.
      </footer>
    </div>
  );
}
