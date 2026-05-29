"use client";

import React, { useRef } from "react";
import { 
  Coins, TrendingDown, Image, FileText, Bot, Sparkles, Upload, 
  Trash2, AlertTriangle, Save, Filter, Search, Calendar, 
  CreditCard, Info, AlertCircle, RefreshCw
} from "lucide-react";

// 커스텀 훅 임포트
import { useExpenses, ExpenseSettings } from "@/hooks/useExpenses";

export default function ExpenseManagementAiPage() {
  const {
    expenses,
    stats,
    settings,
    isLoading,
    isSavingSettings,
    isSubmittingExpense,
    isAnalyzingReceipt,
    activeCategoryFilter,
    setActiveCategoryFilter,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    newExpense,
    setNewExpense,
    handleSaveSettings,
    handleRegisterExpense,
    handleDeleteExpense,
    handleFileUpload,
    resetExpenseForm,
    totalPages,
    startIndex,
    endIndex,
    paginatedExpenses
  } = useExpenses();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 임시 경보 설정 수정을 위한 상태 분리 (설정 저장 버튼 클릭 전까지 임시 보관)
  const [tempSettings, setTempSettings] = React.useState<ExpenseSettings | null>(null);

  React.useEffect(() => {
    if (settings) {
      setTempSettings(settings);
    }
  }, [settings]);

  const handleTempSettingChange = (key: keyof ExpenseSettings, value: any) => {
    if (tempSettings) {
      setTempSettings({
        ...tempSettings,
        [key]: value
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 비목 목록
  const CATEGORIES = ["복리후생비", "여비교통비", "소모품비", "접대비", "임차료", "세금공과금", "기타"];

  // 결제 수단 목록
  const PAYMENT_METHODS = ["법인카드", "현금영수증", "계좌이체", "개인카드", "기타"];

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 font-sans text-slate-800 animate-fade-in">
      
      {/* 타이틀 및 헤더 영역 (PC용 1행 통일 스타일) */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center tracking-tight">
          <Coins className="w-8 h-8 text-rose-500 mr-3 animate-pulse" />
          지출 관리 AI
        </h1>
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-xs font-black flex items-center shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-rose-500 animate-bounce" />
          AI 경리 자율 자동화 구동 중
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-rose-500 animate-spin" />
          <p className="font-extrabold text-slate-500 text-sm">지출 대장 및 AI 통계 정보를 계산하는 중입니다...</p>
        </div>
      ) : (
        /* PC 전용 2열 고정 그리드 배치 */
        <div className="grid grid-cols-2 gap-6 items-start">
          
          {/* ================= 좌측 열 (AI 영수증 분석 & 예산 소모율) ================= */}
          <div className="space-y-6">
            
            {/* 1. 월간 예산 소모 현황 전광판 */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingDown className="w-32 h-32 text-white" />
              </div>
              
              <div className="relative z-10 flex justify-between items-center mb-4">
                <div>
                  <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">이달의 누적 지출 현황 ({stats?.currentMonth}월)</p>
                  <h3 className="text-3xl font-black mt-1 font-mono tracking-tight text-white">
                    {stats?.currentMonthTotal.toLocaleString()} <span className="text-sm font-bold text-slate-350">원</span>
                  </h3>
                </div>
                
                {/* 동적 예산 달성 백분율 배지 */}
                <div className={`px-3.5 py-1.5 rounded-full font-black text-xs shadow-md ${
                  (stats?.budgetConsumptionRate || 0) >= 90 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                    : (stats?.budgetConsumptionRate || 0) >= 70
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  소모율 {stats?.budgetConsumptionRate}%
                </div>
              </div>

              {/* 예산 프로그래스 바 (상태별 동적 컬러 적용) */}
              <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner mb-3">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    (stats?.budgetConsumptionRate || 0) >= 90
                      ? 'bg-gradient-to-r from-rose-500 to-orange-500'
                      : (stats?.budgetConsumptionRate || 0) >= 70
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  }`}
                  style={{ width: `${Math.min(stats?.budgetConsumptionRate || 0, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
                <span>예산 한도: {stats?.monthlyBudget.toLocaleString()}원</span>
                <span>잔여 가능 예산: {Math.max((stats?.monthlyBudget || 0) - (stats?.currentMonthTotal || 0), 0).toLocaleString()}원</span>
              </div>
            </div>

            {/* 2. 📷 AI 영수증 자율 스캔 드롭존 & 검수 폼 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center justify-between border-b pb-3 mb-2">
                <div className="flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-rose-500 animate-bounce" />
                  AI 영수증 자율 스캔 및 검수
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">PDF / 이미지 지원</span>
              </h2>

              {/* 드롭존 영역 */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center group ${
                  isAnalyzingReceipt 
                    ? 'border-rose-400 bg-rose-50/20' 
                    : 'border-slate-200 hover:border-rose-300 hover:bg-slate-50/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                
                {isAnalyzingReceipt ? (
                  <div className="space-y-3">
                    <RefreshCw className="w-10 h-10 text-rose-500 animate-spin mx-auto" />
                    <p className="font-extrabold text-xs text-rose-500">Gemini AI가 영수증 글자와 금액을 해독하고 있습니다...</p>
                    <p className="text-[10px] text-slate-400 font-semibold">비목(카테고리) 자율 분류 분석 연산 작동 중</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-slate-350 mx-auto group-hover:text-rose-455 transition-colors" />
                    <p className="font-extrabold text-xs text-slate-700">여기에 영수증 이미지 또는 전자영수증 PDF를 드래그 앤 드롭하세요</p>
                    <p className="text-[10px] text-slate-450 font-semibold">또는 이 영역을 클릭하여 PC 내부 파일을 선택하세요</p>
                  </div>
                )}
              </div>

              {/* AI 인식 결과 검수 & 등록 폼 */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between border-b pb-2 mb-2">
                  <span>📝 지출 항목 검수 피드백</span>
                  <button 
                    onClick={resetExpenseForm}
                    className="text-[10px] font-bold text-slate-450 hover:text-slate-700 cursor-pointer transition-colors"
                  >
                    초기화
                  </button>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">지출 명칭 / 상호명 *</label>
                    <input 
                      type="text"
                      placeholder="예: 홈플러스 - 탕비실 다과 다식 구매"
                      value={newExpense.title}
                      onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">지출 비목 (카테고리) *</label>
                    <select 
                      value={newExpense.category}
                      onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-700 cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">지출 금액 (원화 ₩) *</label>
                    <input 
                      type="number"
                      placeholder="금액을 입력하세요"
                      value={newExpense.amount}
                      onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-black text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">지출 일자 *</label>
                    <input 
                      type="date"
                      value={newExpense.expense_date}
                      onChange={e => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2 outline-none font-bold text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">결제 수단 *</label>
                    <select 
                      value={newExpense.payment_method}
                      onChange={e => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-700 cursor-pointer"
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">비고 / 메모 (구매처 요약 등)</label>
                    <input 
                      type="text"
                      placeholder="상세 내용이나 비고사항을 기록하세요"
                      value={newExpense.memo}
                      onChange={e => setNewExpense({ ...newExpense, memo: e.target.value })}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-semibold text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={handleRegisterExpense}
                    disabled={isSubmittingExpense || !newExpense.title || !newExpense.amount}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-black text-xs shadow-md shadow-rose-500/10 hover:opacity-95 disabled:bg-slate-350 disabled:shadow-none transition-all cursor-pointer border-none flex items-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2 animate-pulse" />
                    {isSubmittingExpense ? "장부 등록 중..." : "지출 등록하기"}
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* ================= 우측 열 (SMS 알림 설정 & 지출 장부) ================= */}
          <div className="space-y-6">
            
            {/* 3. 🚨 예산 초과 방지 커스텀 SMS 알림 설정 제어판 */}
            {tempSettings && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <h2 className="text-lg font-black text-slate-800 flex items-center justify-between border-b pb-3 mb-2">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-rose-500 animate-bounce" />
                    예산 경보 자동화 비서
                  </div>
                  
                  {/* 알림 활성 토글 */}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={tempSettings.is_alert_enabled === 1}
                      onChange={() => handleTempSettingChange('is_alert_enabled', tempSettings.is_alert_enabled === 1 ? 0 : 1)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">월별 지출 제한 한도 (원화 ₩) *</label>
                    <input 
                      type="number"
                      value={tempSettings.monthly_budget}
                      onChange={e => handleTempSettingChange('monthly_budget', Number(e.target.value))}
                      disabled={tempSettings.is_alert_enabled === 0}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-black text-xs bg-white disabled:bg-slate-100 disabled:text-slate-450 focus:ring-2 focus:ring-rose-500 transition-all text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">경보 수신 연락처 (점주 번호) *</label>
                    <input 
                      type="text"
                      placeholder="예: 010-1234-5678"
                      value={tempSettings.alert_phone}
                      onChange={e => handleTempSettingChange('alert_phone', e.target.value)}
                      disabled={tempSettings.is_alert_enabled === 0}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs bg-white disabled:bg-slate-100 disabled:text-slate-450 focus:ring-2 focus:ring-rose-500 transition-all text-slate-800 font-mono"
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-extrabold text-slate-500">지출 소모율 경보 임계 기준치 (%) *</label>
                      <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded">{tempSettings.alert_threshold_percent}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        value={tempSettings.alert_threshold_percent}
                        onChange={e => handleTempSettingChange('alert_threshold_percent', Number(e.target.value))}
                        disabled={tempSettings.is_alert_enabled === 0}
                        className="flex-1 accent-rose-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </div>
                  </div>

                  {/* 커스텀 SMS 경보 문자 템플릿 필드 (Q2 반영) */}
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-extrabold text-slate-500">🚨 경보 문자 템플릿 문구 *</label>
                      <span className="text-[9px] text-slate-450 font-bold">지원 변수: {"{경보임계율}"}, {"{경보금액}"}, {"{누적지출}"}, {"{월예산}"}</span>
                    </div>
                    <textarea 
                      value={tempSettings.alert_sms_template}
                      onChange={e => handleTempSettingChange('alert_sms_template', e.target.value)}
                      disabled={tempSettings.is_alert_enabled === 0}
                      rows={4}
                      className="w-full border border-slate-250 rounded-xl p-3 outline-none font-semibold text-xs bg-white disabled:bg-slate-100 disabled:text-slate-450 focus:ring-2 focus:ring-rose-500 transition-all text-slate-700 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => handleSaveSettings(tempSettings)}
                    disabled={isSavingSettings || tempSettings.is_alert_enabled === 0}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-805 text-white rounded-xl font-bold text-xs shadow-md hover:opacity-95 disabled:bg-slate-350 disabled:shadow-none transition-all cursor-pointer border-none flex items-center"
                  >
                    <Save className="w-3.5 h-3.5 mr-2" />
                    {isSavingSettings ? "설정 저장 중..." : "경보 설정 적용하기"}
                  </button>
                </div>
              </div>
            )}

            {/* 4. 📋 지출 장부 관리 대장 테이블 (PC 대화면 visible 구조) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex justify-between items-center border-b pb-3 mb-2">
                <h2 className="text-lg font-black text-slate-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-slate-500" />
                  지출 장부 대장
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-slate-500 whitespace-nowrap">비목 필터:</span>
                  <select 
                    value={activeCategoryFilter}
                    onChange={e => setActiveCategoryFilter(e.target.value)}
                    className="border border-slate-250 rounded-lg px-2 py-1 text-xs outline-none bg-white font-bold text-slate-700 cursor-pointer focus:border-rose-500"
                  >
                    <option value="ALL">전체 보기</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 검색창 */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="품명 또는 메모로 대장 검색..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-xs font-semibold text-slate-805 bg-slate-50/50"
                />
              </div>

              {/* 테이블 본문 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-250">
                    <tr>
                      <th className="p-3">지출 품명</th>
                      <th className="p-3">비목</th>
                      <th className="p-3 text-right">금액</th>
                      <th className="p-3">결제일</th>
                      <th className="p-3 text-center">제외</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-[11px]">
                    {paginatedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-450 font-bold">
                          조건에 부합하는 지출 내역이 대장에 존재하지 않습니다.
                        </td>
                      </tr>
                    ) : (
                      paginatedExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-bold text-slate-800 max-w-[150px] truncate" title={exp.title}>
                            {exp.title}
                            {exp.memo && <span className="block text-[9px] text-slate-400 font-semibold mt-0.5 truncate">{exp.memo}</span>}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black border ${
                              exp.category === '복리후생비' 
                                ? 'bg-blue-50 border-blue-100 text-blue-700' 
                                : exp.category === '여비교통비'
                                ? 'bg-cyan-50 border-cyan-100 text-cyan-700'
                                : exp.category === '소모품비'
                                ? 'bg-amber-50 border-amber-100 text-amber-700'
                                : exp.category === '접대비'
                                ? 'bg-orange-50 border-orange-100 text-orange-700'
                                : exp.category === '임차료'
                                ? 'bg-purple-50 border-purple-100 text-purple-700'
                                : exp.category === '세금공과금'
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}>
                              {exp.category}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-slate-850 font-mono">
                            {exp.amount.toLocaleString()}원
                            <span className="block text-[8px] text-slate-400 font-bold mt-0.5">{exp.payment_method}</span>
                          </td>
                          <td className="p-3 text-slate-500 font-semibold font-mono">{exp.expense_date}</td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1.5 text-slate-350 hover:text-rose-600 rounded hover:bg-rose-50 transition-all cursor-pointer border-none"
                              title="지출 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-3 pt-2 bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-[10px]">
                  <span className="font-semibold text-slate-500">
                    전체 {filteredExpenses.length}건 중 {startIndex + 1}-{Math.min(endIndex, filteredExpenses.length)}건 표시
                  </span>
                  
                  <div className="flex space-x-1">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-[10px] font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all"
                    >
                      이전
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 py-1 rounded transition-all font-bold ${
                          currentPage === page 
                            ? 'bg-rose-500 text-white shadow-2xs border border-rose-500' 
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-[10px] font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all"
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}
      
      {/* 하단 시스템 도움 배너 */}
      <div className="bg-slate-100/80 border border-slate-200 p-4 rounded-2xl flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-655 leading-relaxed space-y-1">
          <p className="font-extrabold text-slate-800">💡 [지출 관리 AI] 프리미엄 자동화 안내</p>
          <p>• 영수증 드롭존에 모바일 결제 스크린샷 이미지 또는 전자영수증 **PDF 파일**을 그냥 드래그 앤 드롭하시면, AI가 눈 깜짝할 사이에 정보를 완벽 파싱해 줍니다.</p>
          <p>• 월간 누적 지출이 한도의 지정 임계값에 도달할 때 자동 발송되는 **SMS 경고 문구 템플릿**을 사장님이 원하는 형태로 언제든지 자유롭게 기입하여 커스터마이징할 수 있습니다.</p>
        </div>
      </div>

    </div>
  );
}
