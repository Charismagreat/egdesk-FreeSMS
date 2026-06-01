'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Play, 
  Database, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  Search, 
  Info, 
  ChevronRight, 
  Sparkles, 
  RefreshCw, 
  AlertCircle,
  FileText,
  Lock,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

interface EcountScript {
  fileName: string;
  title: string;
  menuPath: string;
  targetTable: string;
  description: string;
  category: string;
  defaultDaysRange: number;
  columns: string[];
  isRealFileAvailable?: boolean;
}

export default function EcountErpAiPage() {
  const [scripts, setScripts] = useState<EcountScript[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedScript, setSelectedScript] = useState<EcountScript | null>(null);
  
  // 날짜 설정 상태
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [quickRange, setQuickRange] = useState<string>('30'); // 기본 30일
  
  // 검색 및 필터링 상태
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // RPA 실행 모니터링 상태
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionStep, setExecutionStep] = useState<number>(0);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [executionSuccess, setExecutionSuccess] = useState<boolean>(false);
  const [isSimulation, setIsSimulation] = useState<boolean>(false);

  // 1. API 데이터 패치 (이카운트 스크립트 목록 조회)
  const fetchScripts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ecount-erp');
      const data = await res.json();
      if (data.success && Array.isArray(data.scripts)) {
        setScripts(data.scripts);
        // 기본값으로 첫 번째 스크립트 선택
        if (data.scripts.length > 0) {
          setSelectedScript(data.scripts[0]);
          applyQuickRange(data.scripts[0].defaultDaysRange.toString());
        }
      }
    } catch (error) {
      console.error('이카운트 스크립트 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  // 2. 빠른 날짜 선택기 적용
  const applyQuickRange = (daysStr: string) => {
    setQuickRange(daysStr);
    const end = new Date();
    const start = new Date();
    
    const days = parseInt(daysStr, 10);
    if (days > 0) {
      start.setDate(end.getDate() - days);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else {
      // 당일 실시간
      setStartDate(end.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  // 스크립트 카드 선택 핸들러
  const handleSelectScript = (script: EcountScript) => {
    setSelectedScript(script);
    applyQuickRange(script.defaultDaysRange.toString());
  };

  // 3. ⚡ RPA 실행 신호 트리거 (POST 전송)
  const handleExecuteRpa = async () => {
    if (!selectedScript) return;

    setIsExecuting(true);
    setExecutionSuccess(false);
    setExecutionStep(1);
    setExecutionLog(['[시스템] 이지데스크 RPA 연동 에이전트 구동 신호를 활성화합니다.']);

    // 단계별 진행 시뮬레이션 타이머
    const steps = [
      { step: 1, text: 'RPA 에이전트 기동 중... ⚙️ (로컬 PC 포트 바인딩 완료)', delay: 800 },
      { step: 2, text: '이카운트 ERP 시큐리티 로그인 관문 진입 중... 🔑', delay: 1000 },
      { step: 3, text: `이카운트 데이터 원장 메뉴 탐색 중... 🧭 (${selectedScript.menuPath})`, delay: 1200 },
      { step: 4, text: '필터링 날짜 파라미터 주입 및 원장 엑셀 무결성 다운로드 중... 📁', delay: 1500 },
      { step: 5, text: `다운로드 완료. SQLite 물리 테이블 [${selectedScript.targetTable}] 생성 및 파싱 적재 중... 💾`, delay: 1000 },
    ];

    let currentLog = [...executionLog];
    
    // 비동기 API 실제 요청
    try {
      const res = await fetch('/api/ecount-erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedScript.fileName,
          startDate,
          endDate
        })
      });
      const data = await res.json();
      setIsSimulation(!!data.isMock);

      // 시뮬레이션 또는 실제 실행 스텝 단계 애니메이션 시작
      for (const item of steps) {
        setExecutionStep(item.step);
        currentLog = [...currentLog, `[RPA] ${item.text}`];
        setExecutionLog(currentLog);
        await new Promise(resolve => setTimeout(resolve, item.delay));
      }

      if (data.success) {
        setExecutionStep(6);
        setExecutionSuccess(true);
        setExecutionLog(prev => [
          ...prev, 
          `[성공] 이카운트 동기화 완수! 물리 테이블 [${selectedScript.targetTable}]에 데이터가 안전하게 빌드되었습니다. 🎉`
        ]);
        // DB 테이블 변경 이벤트를 대시보드 및 메뉴에 갱신 알림
        window.dispatchEvent(new CustomEvent('menu-settings-updated'));
      } else {
        throw new Error(data.error || 'RPA 스크립트 실행 중 에러가 반환되었습니다.');
      }
    } catch (err: any) {
      setExecutionStep(-1);
      setExecutionLog(prev => [
        ...prev, 
        `[오류] 동기화 중단: ${err.message || '이지데스크서버와의 세션 연결 상태를 다시 점검해 주십시오.'} ❌`
      ]);
    }
  };

  // 카테고리 추출
  const categories = ['전체', ...Array.from(new Set(scripts.map(s => s.category)))];

  // 필터링 적용된 스크립트
  const filteredScripts = scripts.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.targetTable.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-800">
      
      {/* 1. 상단 헤더 영역 (밝은 테마 30px 타이틀 여백 통일) */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">EGDESK ERP CONNECTOR</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1 flex items-center">
            이카운트 ERP AI <Sparkles className="w-6 h-6 ml-2 text-sky-500 animate-bounce" />
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            이지데스크서버의 로컬 RPA 스크립트를 동적으로 원격 기동하여 이카운트 엑셀 원장을 SQLite DB 물리 테이블에 안전하게 자동 이식합니다.
          </p>
        </div>
        
        {/* 우측 퀵 액션 */}
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button 
            onClick={fetchScripts}
            className="flex items-center space-x-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>새로고침</span>
          </button>
          <Link 
            href="/my-db"
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 rounded-lg text-sm text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10"
          >
            <Database className="w-4 h-4" />
            <span>MY DB 바로가기</span>
          </Link>
        </div>
      </div>

      {/* 2. 대시보드 본문 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 좌측 2개 컬럼: 스크립트 라이브러리 및 필터 */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 검색 및 필터 바 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="RPA 스크립트명, 기능설명, 적재 테이블 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 스크립트 리스트 카드 그리드 */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-slate-500 text-sm mt-4">이지데스크서버로부터 내장 RPA 스크립트를 동적으로 수집하고 있습니다...</p>
            </div>
          ) : filteredScripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm text-center px-6">
              <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">해당하는 RPA 스크립트가 없습니다</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-md">검색어나 카테고리 필터를 변경하여 다시 시도해 주십시오.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredScripts.map((script) => {
                const isSelected = selectedScript?.fileName === script.fileName;
                return (
                  <div
                    key={script.fileName}
                    onClick={() => handleSelectScript(script)}
                    className={`group cursor-pointer rounded-2xl border transition-all duration-200 p-4.5 flex flex-col justify-between relative overflow-hidden ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/20 shadow-md shadow-blue-500/5 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:border-slate-350 hover:shadow-md'
                    }`}
                  >
                    {/* 카테고리 뱃지 및 상태 LED */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold tracking-wider uppercase ${
                        script.category === '매출' ? 'bg-emerald-100 text-emerald-700' :
                        script.category === '매입' ? 'bg-rose-100 text-rose-700' :
                        script.category === '재고' ? 'bg-cyan-100 text-cyan-700' :
                        script.category === '거래처' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {script.category}
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${script.isRealFileAvailable ? 'bg-green-500 animate-pulse' : 'bg-blue-400'}`}></span>
                        <span className="text-[9px] font-semibold text-slate-500">
                          {script.isRealFileAvailable ? '연동됨' : '시뮬'}
                        </span>
                      </div>
                    </div>

                    {/* 카드 텍스트 정보 */}
                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors text-sm leading-snug">
                        {script.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                        {script.description}
                      </p>
                    </div>

                    {/* ERP 메뉴 주소 및 적재 테이블 */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>ERP 경로:</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[100px] text-right" title={script.menuPath}>{script.menuPath.split(' > ').pop()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">DB 테이블:</span>
                        <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-[9px] font-semibold border border-slate-200 truncate max-w-[100px]" title={script.targetTable}>
                          {script.targetTable}
                        </code>
                      </div>
                    </div>

                    {/* 선택 표시 우측 상단 선명 아이콘 */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white p-1 rounded-bl-xl">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* 우측 1개 컬럼: Autopilot Play Console & Parameter Panel */}
        <div className="space-y-6">
          
          {selectedScript ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-8">
              
              {/* 타이틀 및 메타 */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 mb-1">
                  <Play className="w-3.5 h-3.5 fill-blue-600" />
                  <span>AUTOPILOT CONTROLLER</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">{selectedScript.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{selectedScript.fileName}</p>
              </div>

              {/* 매핑 구조 정보 아코디언 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <div className="flex items-center text-xs font-bold text-slate-700">
                  <Info className="w-4 h-4 mr-1.5 text-blue-500" />
                  <span>DB 테이블 적재 스키마 매핑 정보</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedScript.columns.map((col) => (
                    <span 
                      key={col}
                      className="px-2 py-1 bg-white rounded-lg text-[10px] border border-slate-200 text-slate-600 font-semibold"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* 📅 날짜 파라미터 조작기 */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">RPA 동기화 기간 선택</label>
                
                {/* 빠른 조회 기간 프리셋 */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '실시간', value: '0' },
                    { label: '7일간', value: '7' },
                    { label: '30일간', value: '30' },
                    { label: '90일간', value: '90' }
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => applyQuickRange(preset.value)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        quickRange === preset.value
                          ? 'bg-blue-50 text-blue-600 border-blue-200 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* 수동 Date Input */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setQuickRange('custom');
                      }}
                      className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setQuickRange('custom');
                      }}
                      className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ⚡ 기동 버튼 */}
              <button
                onClick={handleExecuteRpa}
                disabled={isExecuting}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none transition-all"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>RPA 기동 명령 처리 중...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    <span>이카운트 동기화 실행 (Run RPA)</span>
                  </>
                )}
              </button>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">좌측 라이브러리에서<br/>실행할 RPA 스크립트를 선택해 주십시오.</p>
            </div>
          )}

        </div>

      </div>

      {/* 3. 🚨 Glassmorphic Execution Monitor (실시간 구동 상태 모달) */}
      {isExecuting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-fadeIn">
          <div className="bg-white/95 rounded-3xl border border-slate-200 max-w-lg w-full p-8 shadow-2xl space-y-6 relative overflow-hidden">
            
            {/* 네온 효과 탑 배너 */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500"></div>

            {/* 타이틀 및 닫기 락 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center justify-center p-2 rounded-xl bg-blue-50 text-blue-600 animate-spin">
                  <Loader2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center">
                    이카운트 ERP Autopilot 구동 중 
                  </h3>
                  <p className="text-xs text-slate-400">이지데스크서버 로컬 RPA 에이전트와 교신하고 있습니다.</p>
                </div>
              </div>
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>화면 잠금</span>
              </span>
            </div>

            {/* 단계별 무브먼트 타임라인 */}
            <div className="space-y-4">
              {[
                { step: 1, label: '로컬 RPA 에이전트 Wakeup 구동' },
                { step: 2, label: '이카운트 보안 게이트웨이 로그인 인증' },
                { step: 3, label: '목표 보고서 원장 데이터 탐색 및 진입' },
                { step: 4, label: '필터링 기간 엑셀 원본 파일 무결성 다운로드' },
                { step: 5, label: `SQLite DB 물리 테이블 [${selectedScript?.targetTable}] 생성 및 백필` },
              ].map((item) => {
                const isDone = executionStep > item.step;
                const isActive = executionStep === item.step;
                const isFailed = executionStep === -1;
                return (
                  <div 
                    key={item.step}
                    className={`flex items-start space-x-3.5 p-3 rounded-xl border transition-all ${
                      isActive ? 'bg-blue-50/50 border-blue-200' :
                      isDone ? 'bg-slate-50/60 border-slate-100' : 'border-transparent opacity-50'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" />
                      ) : isActive ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                      ) : isFailed && isActive ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {item.step}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${
                        isActive ? 'text-blue-700' : 
                        isDone ? 'text-slate-500 line-through' : 'text-slate-400'
                      }`}>
                        {item.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 실시간 쉘 감사 로그 피드 */}
            <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[10px] text-slate-350 space-y-1 h-36 overflow-y-auto border border-slate-800 scrollbar-thin">
              {executionLog.map((log, index) => (
                <div 
                  key={index}
                  className={
                    log.includes('[성공]') ? 'text-green-400 font-bold' :
                    log.includes('[오류]') ? 'text-red-400 font-bold' :
                    log.includes('[시스템]') ? 'text-sky-400' : 'text-slate-300'
                  }
                >
                  {log}
                </div>
              ))}
            </div>

            {/* 하단 제어 및 종료/MY DB 링크 */}
            <div className="flex justify-end space-x-3 pt-2">
              {executionStep === -1 && (
                <button
                  onClick={() => setIsExecuting(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
                >
                  콘솔 닫기
                </button>
              )}
              {executionSuccess && (
                <div className="flex items-center space-x-3 w-full">
                  {isSimulation && (
                    <div className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex-1 flex items-center">
                      <Info className="w-4 h-4 mr-1 text-amber-500 shrink-0" />
                      <span>[데모 모드] DB 가상 테이블로 파싱 적재되었습니다.</span>
                    </div>
                  )}
                  <button
                    onClick={() => setIsExecuting(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all"
                  >
                    대시보드로 복귀
                  </button>
                  <Link
                    href="/my-db"
                    className="flex items-center space-x-1.5 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-500/15"
                  >
                    <span>MY DB에서 확인</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
