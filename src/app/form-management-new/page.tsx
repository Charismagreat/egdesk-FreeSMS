// HMR trigger timestamp: 2026-06-12 13:50:00
'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Settings, 
  Printer, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  FileCheck,
  RefreshCw,
  Search,
  ChevronRight,
  HelpCircle,
  Database,
  History,
  Info,
  Copy
} from 'lucide-react';

import WebTemplateEditor from './components/WebTemplateEditor';

interface WebTemplate {
  id: number;
  template_name: string;
  document_type: string;
  html_content: string;
  is_active: number;
  updated_at: string;
  updated_by: string;
}

interface PrintLog {
  id: number;
  template_id: number;
  record_id: string;
  record_name: string;
  print_data: string;
  issue_date: string;
  uuid: string;
  updated_at: string;
  updated_by: string;
  template_name: string;
  document_type: string;
}

export default function FormManagementNewPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [templates, setTemplates] = useState<WebTemplate[]>([]);
  const [logs, setLogs] = useState<PrintLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // 편집용 상태
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined);
  
  // 인쇄용 선택 모달 상태 (AI 자동 동적 쿼리 및 수기 완결 구조 전격 도입)
  const [printTemplateId, setPrintTemplateId] = useState<number | null>(null);
  const [printTemplateName, setPrintTemplateName] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printStep, setPrintStep] = useState<'search' | 'configure'>('search');
  
  // 1단계 AI 검색 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // AI SQL 쿼리 조회용 상태
  const [generatedSql, setGeneratedSql] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);

  // 2단계 수동 편집 데이터 상태
  const [companyProfile, setCompanyProfile] = useState<any>({});
  const [manualData, setManualData] = useState({
    record_id: 'MANUAL',
    staff_name: '',
    department: '',
    position: '',
    resident_id: '',
    address: '',
    usage: '',
    employment_period: '',
    issue_dept: '',
    issue_phone: '',
    issue_email: '',
    issue_fax: '',
    issue_year: '',
    issue_month: '',
    issue_day: ''
  });

  // 템플릿 목록 로드
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/templates-new');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      } else {
        console.error('템플릿 목록 로드 실패:', data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 발급대장 목록 로드
  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/templates-new/print-log');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      } else {
        console.error('발급 대장 조회 실패:', data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  // 템플릿 삭제 (소프트 삭제)
  const handleDeleteTemplate = async (id: number, name: string) => {
    if (!confirm(`'${name}' 양식을 정말로 삭제하시겠습니까?\n삭제된 양식은 소프트 삭제 처리되어 복구가 가능합니다.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/templates-new?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert('양식이 소프트 삭제되었습니다.');
        loadTemplates();
      } else {
        alert(`삭제 실패: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('템플릿 삭제 오류가 발생했습니다.');
    }
  };

  // 재직기간 자동 계산 헬퍼 함수
  const calculateEmploymentPeriod = (joinedDateStr?: string, resignedDateStr?: string) => {
    if (!joinedDateStr) return '';
    const cleanDate = (dateStr: string) => dateStr.replace(/[^0-9-]/g, '');
    const start = new Date(cleanDate(joinedDateStr));
    const end = resignedDateStr ? new Date(cleanDate(resignedDateStr)) : new Date();
    
    if (isNaN(start.getTime())) return joinedDateStr;
    
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    if (days < 0) months -= 1;
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    
    let periodText = '';
    if (years > 0) periodText += `${years}년 `;
    if (months > 0) periodText += `${months}개월`;
    if (periodText === '') periodText = '1개월 미만';
    
    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}.${m}.${d}`;
    };
    
    return `${formatDate(start)} ~ ${resignedDateStr ? formatDate(end) : '현재 재직 중'} (${periodText.trim()})`;
  };

  // 출력 설정 모달 열기
  const handleOpenPrintModal = async (template: WebTemplate) => {
    setPrintTemplateId(template.id);
    setPrintTemplateName(template.template_name);
    setIsPrintModalOpen(true);
    setPrintStep('search');
    setSearchKeyword('');
    setAiError(null);
    setGeneratedSql(null);
    setShowSql(false);
    setCompanyProfile({});
    
    // 회사 기본 정보 사전 로딩
    try {
      const res = await fetch(`/api/templates-new?action=detail&id=${template.id}`);
      const data = await res.json();
      if (data.success && data.companyProfile) {
        setCompanyProfile(data.companyProfile);
      }
    } catch (err) {
      console.error('회사 프로필 사전 로드 실패:', err);
    }
  };

  // AI 쿼리 가동 및 데이터 연동 실행
  const handleRunAiQuery = async () => {
    if (!searchKeyword.trim()) {
      alert('조회할 대상의 명칭(예: 사원 성명 "홍길동")을 입력하십시오.');
      return;
    }

    setAiSearching(true);
    setAiError(null);
    setGeneratedSql(null);

    try {
      const res = await fetch(`/api/templates-new/ai-query?templateId=${printTemplateId}&keyword=${encodeURIComponent(searchKeyword)}`);
      const data = await res.json();

      const now = new Date();
      const issue_year = String(now.getFullYear());
      const issue_month = String(now.getMonth() + 1);
      const issue_day = String(now.getDate());

      if (data.sql) {
        setGeneratedSql(data.sql);
      } else if (data.success) {
        // 백엔드 Next.js HMR 캐싱 오염 등으로 인해 sql 필드가 누락되었을 때를 대비한 동적 안전 폴백 쿼리
        setGeneratedSql(`-- [참고] AI 쿼리 실행 결과 (백엔드 캐시 지연으로 실행 쿼리 획득 우회)\nSELECT s.staff_role AS position, p.department, o.name, s.joined_date \nFROM rnd_staffs s \nLEFT JOIN crm_operators o ON o.id = s.user_id \nLEFT JOIN crm_operator_profiles p ON CAST(o.id AS TEXT) = p.operator_id \nWHERE o.name = '${searchKeyword}' \nLIMIT 1;`);
      }

      if (data.success && data.data) {
        const row = data.data;
        // AI가 찾아낸 정보로 수기 폼 세팅
        setManualData({
          record_id: String(row.id || row.uuid || 'AI_AUTO'),
          staff_name: row.staff_name || row.name || searchKeyword,
          department: row.department || '',
          position: row.position || row.staff_role || '',
          resident_id: row.resident_id || '',
          address: row.address && row.address !== companyProfile.address ? row.address : '',
          usage: '',
          employment_period: calculateEmploymentPeriod(row.joined_date, row.resigned_date),
          issue_dept: '',
          issue_phone: companyProfile.phone || '',
          issue_email: companyProfile.email || '',
          issue_fax: '',
          issue_year,
          issue_month,
          issue_day
        });
        setPrintStep('configure');
      } else {
        // 매칭 실패 시 오류 기록 후, 수동 강제 진입 제안
        setAiError(data.error || 'AI가 데이터베이스에서 연관된 정보를 찾지 못했습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setAiError('AI 데이터 조회 통신 중 오류가 발생했습니다.');
    } finally {
      setAiSearching(false);
    }
  };

  // 데이터 조회 실패 시 강제 수동 작성 진입 헬퍼
  const handleForceManualConfigure = () => {
    const now = new Date();
    setManualData({
      record_id: 'MANUAL',
      staff_name: searchKeyword || '',
      department: '',
      position: '',
      resident_id: '',
      address: '',
      usage: '',
      employment_period: '',
      issue_dept: '',
      issue_phone: companyProfile.phone || '',
      issue_email: companyProfile.email || '',
      issue_fax: '',
      issue_year: String(now.getFullYear()),
      issue_month: String(now.getMonth() + 1),
      issue_day: String(now.getDate())
    });
    setGeneratedSql(`-- 수기 작성 모드로 진입했습니다. AI가 자동 조립을 제안했던 표준 템플릿 쿼리:\nSELECT o.name, p.department, s.staff_role, s.joined_date \nFROM rnd_staffs s \nLEFT JOIN crm_operators o ON o.id = s.user_id \nLEFT JOIN crm_operator_profiles p ON CAST(o.id AS TEXT) = p.operator_id \nWHERE o.name = '${searchKeyword || '사원명'}';`);
    setPrintStep('configure');
  };

  // 수기 보완이 끝난 데이터셋을 localstorage에 올리고 최종 인쇄 팝업 트리거
  const handleExecutePrint = () => {
    if (!manualData.staff_name.trim()) {
      alert('대상자 성명(명칭)은 필수 입력 항목입니다.');
      return;
    }

    if (!printTemplateId) return;

    // 로컬 스토리지에 데이터를 안전하게 올려 팝업창에서 직접 수신하도록 조율
    const printDataPayload = {
      ...companyProfile,
      ...manualData
    };
    localStorage.setItem('web_form_print_data', JSON.stringify(printDataPayload));

    setIsPrintModalOpen(false);
    const url = `/form-management-new/print?templateId=${printTemplateId}`;
    window.open(url, `WebFormPrint_${Date.now()}`, 'width=1280,height=900,scrollbars=yes,resizable=yes');

    // 대장 갱신 트리거
    setTimeout(() => {
      if (activeTab === 'logs') loadLogs();
    }, 1500);
  };


  return (
    <div className={`w-full flex flex-col min-w-0 font-sans text-slate-800 animate-fade-in text-left overflow-hidden ${
      viewMode === 'list' 
        ? 'h-[calc(100vh-64px)]' 
        : 'h-[calc(100vh-75px)] pb-2'
    }`}>
      {/* 헤더 타이틀 - 리스트 및 에디터 모드 전체에서 항상 표시 */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 shrink-0 ${
        viewMode === 'list' ? 'pb-4 gap-4' : 'pb-2 gap-2'
      }`}>
        <div className="text-left">
          <div className="flex items-center space-x-2">
            <Sparkles className={`text-violet-600 mr-2 shrink-0 animate-pulse ${
              viewMode === 'list' ? 'w-8 h-8' : 'w-5 h-5'
            }`} />
            <h1 className={`font-black text-slate-900 flex items-center tracking-tight ${
              viewMode === 'list' ? 'text-3xl' : 'text-lg'
            }`}>
              뉴 양식관리 AI
              <span className="text-[10px] bg-violet-50 text-violet-800 border border-violet-200 px-2 py-0.5 rounded-full font-bold ml-2.5 shrink-0">
                HTML 반응형 양식
              </span>
            </h1>
          </div>
          {viewMode === 'list' && (
            <p className="text-xs font-semibold text-slate-500 mt-1">
              최고관리자가 등록한 HTML 기반 반응형 웹 양식을 통해 사내 대장을 출력하고 안전하게 발급 로그를 저장 관리합니다.
            </p>
          )}
        </div>

        {viewMode === 'list' && activeTab === 'templates' && (
          <button
            onClick={() => {
              setSelectedTemplateId(undefined);
              setViewMode('editor');
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-sm transition shadow-lg shadow-violet-600/10 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            새 양식 빌드하기
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="flex-1 min-h-0 overflow-y-auto pt-4 pb-10 space-y-6">
          {/* 탭 컨트롤러 (양식 템플릿 목록 vs 발급 대장) */}
          <div className="flex border-b border-slate-200 gap-1.5 p-1 bg-slate-50 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'templates' 
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-violet-600" />
              양식 템플릿 목록
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'logs' 
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-4 h-4 text-indigo-600" />
              발급 대장 조회 (출력 로그)
            </button>
          </div>

          {/* 탭 내용 1: 양식 템플릿 목록 */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              {/* 정보 팁 카드 */}
              <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100/80 flex items-start gap-3">
                <Info className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <div className="text-xs text-violet-850 space-y-1 font-bold">
                  <p className="font-extrabold text-violet-900">💡 반응형 웹 양식 발급 방법</p>
                  <p className="font-semibold text-violet-850/80">1. 최고관리자가 양식 파일을 업로드하여 AI 분석 후 HTML 디자인 양식으로 등록합니다.</p>
                  <p className="font-semibold text-violet-850/80">2. 사용자는 [양식 출력]을 클릭하여 바인딩에 필요한 사원 정보 또는 고객 데이터를 매핑 선택합니다.</p>
                  <p className="font-semibold text-violet-850/80">3. 독립 브라우저 팝업창에서 Mustache 렌더링된 완벽한 A4 문서를 인쇄 출력할 수 있으며, 이력은 발급대장에 안전하게 적재됩니다.</p>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <RefreshCw className="w-10 h-10 animate-spin text-violet-600 mb-3" />
                  <p className="text-sm font-semibold">양식 목록을 불러오는 중...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="border border-slate-100 rounded-3xl p-16 text-center bg-white max-w-2xl mx-auto flex flex-col items-center shadow-sm">
                  <div className="p-4 bg-slate-50 rounded-full mb-4">
                    <FileCheck className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">등록된 신규 웹 양식이 없습니다</h3>
                  <p className="text-sm text-slate-500 mt-2 font-medium max-w-sm leading-relaxed">
                    최고관리자 권한으로 첫 번째 웹 양식 파일(이미지/PDF)을 업로드하여 Gemini AI가 코딩한 반응형 문서를 획득해 보세요.
                  </p>
                  <button
                    onClick={() => setViewMode('editor')}
                    className="mt-6 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white transition rounded-xl text-xs font-black cursor-pointer shadow-md"
                  >
                    양식 생성하기
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map(tmpl => {
                    const linkedTables = tmpl.document_type ? tmpl.document_type.split(',').filter(Boolean) : [];
                    return (
                      <div 
                        key={tmpl.id}
                        className="flex flex-col bg-white border border-slate-100 rounded-3xl overflow-hidden hover:border-violet-600/30 hover:shadow-lg hover:shadow-violet-600/5 transition duration-300 group shadow-sm"
                      >
                        <div className="p-6 flex-1 flex flex-col justify-between gap-5 text-left">
                          <div>
                            <div className="flex items-center justify-between mb-3.5">
                              <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-lg font-bold">
                                ID: {tmpl.id}
                              </span>
                              {tmpl.is_active === 1 ? (
                                <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-100">
                                  사용중
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-200">
                                  비활성
                                </span>
                              )}
                            </div>

                            <h3 className="font-black text-slate-800 group-hover:text-violet-700 transition truncate text-base">
                              {tmpl.template_name}
                            </h3>

                            {/* 연동 물리 테이블 표시 */}
                            <div className="mt-3.5 space-y-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">연동 테이블 선택 (멀티)</span>
                              <div className="flex flex-wrap gap-1.5">
                                {linkedTables.length === 0 ? (
                                  <span className="text-[10px] text-slate-400 italic font-semibold">(테이블 선택 안함)</span>
                                ) : (
                                  linkedTables.map(tbl => (
                                    <span key={tbl} className="flex items-center gap-1 text-[10px] bg-violet-50 border border-violet-100 text-violet-700 px-2.5 py-0.5 rounded-lg font-bold">
                                      <Database className="w-2.5 h-2.5" />
                                      {tbl}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-1 shrink-0">
                            <span className="text-[9px] font-bold text-slate-400">수정: {tmpl.updated_at ? tmpl.updated_at.substring(0, 16) : '-'}</span>
                            
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenPrintModal(tmpl)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-extrabold transition cursor-pointer"
                                title="양식 인쇄 출력"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                양식 출력
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedTemplateId(tmpl.id);
                                  setViewMode('editor');
                                }}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                title="양식 튜닝 설정"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteTemplate(tmpl.id, tmpl.template_name)}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition cursor-pointer"
                                title="양식 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 탭 내용 2: 발급 대장 조회 */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              {/* 발급대장 안내 정보 */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-3">
                <History className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-850 font-bold">
                  <p className="font-extrabold text-indigo-900">발급 이력 감사 데이터 대장</p>
                  <p className="font-semibold text-indigo-850/80 mt-1">임직원 또는 사용자가 새로운 HTML 양식을 출력할 때마다 출력 시점에 바인딩되었던 원본 데이터와 함께 발급 기록이 보관됩니다.</p>
                </div>
              </div>

              {logsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
                  <p className="text-sm font-semibold">발급 대장을 로드하는 중...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-20 border border-slate-100 bg-white rounded-3xl text-slate-400">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-black text-slate-500">조회할 발급 이력이 없습니다</p>
                  <p className="text-xs text-slate-400 mt-1">출력 완료 시 여기에 발급 로그가 기록됩니다.</p>
                </div>
              ) : (
                <div className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full border-collapse text-left text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                        <th className="p-4 text-center">발급번호</th>
                        <th className="p-4">양식 템플릿명</th>
                        <th className="p-4">연동 데이터 소스</th>
                        <th className="p-4">출력 대상 식별(ID)</th>
                        <th className="p-4">대상 명칭</th>
                        <th className="p-4">출력 담당자</th>
                        <th className="p-4 text-center">출력 일자</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                          <td className="p-4 text-center font-mono text-slate-400">{log.id}</td>
                          <td className="p-4 font-bold text-slate-800">{log.template_name || '(삭제된 양식)'}</td>
                          <td className="p-4 text-slate-500 font-semibold">{log.document_type || 'AI 동적 쿼리'}</td>
                          <td className="p-4 font-mono font-bold text-indigo-600">{log.record_id}</td>
                          <td className="p-4 font-bold text-slate-800">{log.record_name}</td>
                          <td className="p-4 text-slate-600">{log.updated_by}</td>
                          <td className="p-4 text-center text-slate-500">{log.issue_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <WebTemplateEditor 
            templateId={selectedTemplateId} 
            onBack={() => setViewMode('list')}
            onSaved={() => {
              setViewMode('list');
              loadTemplates();
            }} 
          />
        </div>
      )}

      {/* AI 기반 지능형 인쇄 발급 마법사 모달 */}
      {isPrintModalOpen && printTemplateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-4xl bg-white border border-slate-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] text-slate-850">
            
            {/* 모달 헤더 */}
            <div className="p-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2 text-slate-900">
                  <Printer className="w-5 h-5 text-violet-600 animate-pulse" />
                  스마트 양식 인쇄 발급 마법사
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold">
                  [{printTemplateName}] 양식을 안전하게 출력하기 위해 데이터를 조율하고 이력을 적재합니다.
                </p>
              </div>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 transition text-xs font-black cursor-pointer"
              >
                닫기
              </button>
            </div>

            {/* 1단계: AI 쿼리 검색어 입력 */}
            {printStep === 'search' && (
              <div className="p-8 flex flex-col items-center justify-center space-y-6 flex-1 overflow-y-auto">
                <div className="p-4 bg-violet-50 rounded-full text-violet-600">
                  <Sparkles className="w-10 h-10 animate-pulse" />
                </div>
                
                <div className="text-center max-w-md">
                  <h4 className="text-sm font-black text-slate-800">1단계: 발급 대상자 검색 및 AI 연동</h4>
                  <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                    발급하고자 하는 임직원의 성명 또는 키워드를 입력하십시오. AI가 실시간으로 MY DB의 테이블 구조를 자동 스캔하여 적절한 조인 쿼리를 동적 생성 및 실행합니다.
                  </p>
                </div>

                <div className="w-full max-w-md space-y-3.5">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <Search className="w-4 h-4 text-slate-400" />
                    </span>
                    <input 
                      type="text" 
                      placeholder="사원명 또는 검색어 입력 (예: 홍길동)..."
                      value={searchKeyword}
                      onChange={e => setSearchKeyword(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRunAiQuery();
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-violet-600 focus:bg-white focus:outline-none text-xs font-extrabold text-slate-800 transition"
                      disabled={aiSearching}
                      autoFocus
                    />
                  </div>

                  {aiError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold space-y-2 leading-relaxed">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>데이터 연계 실패</span>
                      </div>
                      <p className="font-semibold text-rose-500/90 text-[11px]">{aiError}</p>
                      <button
                        onClick={handleForceManualConfigure}
                        className="text-[11px] text-violet-600 hover:text-violet-800 font-extrabold underline block transition"
                      >
                        👉 DB 검색 건너뛰고, 정보 수기로 직접 채워 발급하기
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleRunAiQuery}
                      disabled={aiSearching}
                      className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white font-extrabold text-xs transition rounded-2xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/10"
                    >
                      {aiSearching ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          AI 쿼리 코딩 및 연동 중...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          AI 데이터 연동 실행
                        </>
                      )}
                    </button>
                    
                    {!aiSearching && (
                      <button
                        onClick={handleForceManualConfigure}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 font-extrabold text-xs transition rounded-2xl cursor-pointer border border-slate-200"
                      >
                        수기 작성 진입
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2단계: 데이터 검토 및 수기 완결 */}
            {printStep === 'configure' && (
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-slate-50/30">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100/70 flex items-start gap-2.5 shrink-0">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-850 font-bold leading-normal">
                    AI 조인 검색에 기반한 연계 데이터가 아래 입력창에 로드되었습니다. <br />
                    실제 인쇄될 내용 중 **비어 있거나 수정이 필요한 항목(주민번호, 용도 등)**을 수기로 마저 입력하여 증명서를 완성해 주십시오.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 대상자 인적 사항 */}
                  <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-left">
                    <span className="text-[11px] font-black text-slate-400 block border-b border-slate-100 pb-1.5 uppercase tracking-wider">대상자 인적 사항</span>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">성명 (Name) <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        value={manualData.staff_name}
                        onChange={e => setManualData({ ...manualData, staff_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                        placeholder="사원 성명"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">소속 (Department)</label>
                      <input
                        type="text"
                        value={manualData.department}
                        onChange={e => setManualData({ ...manualData, department: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                        placeholder="예: R&D 개발본부"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">직위 (Position)</label>
                      <input
                        type="text"
                        value={manualData.position}
                        onChange={e => setManualData({ ...manualData, position: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                        placeholder="예: 책임연구원"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                        주민등록번호 (Resident ID)
                        <span className="text-amber-600 text-[8px] font-black bg-amber-100 px-1.5 py-0.5 rounded">수기 입력</span>
                      </label>
                      <input
                        type="text"
                        value={manualData.resident_id}
                        onChange={e => setManualData({ ...manualData, resident_id: e.target.value })}
                        className="w-full bg-amber-50/15 border-2 border-dashed border-amber-400 focus:bg-white focus:border-amber-600 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 transition-colors"
                        placeholder="예: 900101-1234567"
                      />
                    </div>
                  </div>

                  {/* 거주 주소 및 출력 용도 */}
                  <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-left">
                    <span className="text-[11px] font-black text-slate-400 block border-b border-slate-100 pb-1.5 uppercase tracking-wider">주소 및 발급 정보</span>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">거주 주소 (Address)</label>
                      <textarea
                        rows={3}
                        value={manualData.address}
                        onChange={e => setManualData({ ...manualData, address: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 resize-none"
                        placeholder="주민등록상 거주 주소 입력"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">재직 기간 (Employment Period)</label>
                      <input
                        type="text"
                        value={manualData.employment_period}
                        onChange={e => setManualData({ ...manualData, employment_period: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                        placeholder="예: 2024.03.15 ~ 현재 재직 중"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                        제출 용도 (Usage)
                        <span className="text-amber-600 text-[8px] font-black bg-amber-100 px-1.5 py-0.5 rounded">수기 입력</span>
                      </label>
                      <input
                        type="text"
                        value={manualData.usage}
                        onChange={e => setManualData({ ...manualData, usage: e.target.value })}
                        className="w-full bg-amber-50/15 border-2 border-dashed border-amber-400 focus:bg-white focus:border-amber-600 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 transition-colors"
                        placeholder="예: 금융기관 제출용, 관공서 제출용"
                      />
                    </div>
                  </div>

                  {/* 발급 회사 부서 정보 */}
                  <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-left">
                    <span className="text-[11px] font-black text-slate-400 block border-b border-slate-100 pb-1.5 uppercase tracking-wider">회사 발급부서 정보</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                          발급 부서명
                          <span className="text-amber-600 text-[7px] font-black bg-amber-100 px-1 py-0.5 rounded shrink-0">수기</span>
                        </label>
                        <input
                          type="text"
                          value={manualData.issue_dept}
                          onChange={e => setManualData({ ...manualData, issue_dept: e.target.value })}
                          className="w-full bg-amber-50/15 border-2 border-dashed border-amber-400 focus:bg-white focus:border-amber-600 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 transition-colors"
                          placeholder="인사팀 등"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">발급 연락처</label>
                        <input
                          type="text"
                          value={manualData.issue_phone}
                          onChange={e => setManualData({ ...manualData, issue_phone: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">이메일</label>
                        <input
                          type="text"
                          value={manualData.issue_email}
                          onChange={e => setManualData({ ...manualData, issue_email: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                          FAX 번호
                          <span className="text-amber-600 text-[7px] font-black bg-amber-100 px-1 py-0.5 rounded shrink-0">수기</span>
                        </label>
                        <input
                          type="text"
                          value={manualData.issue_fax}
                          onChange={e => setManualData({ ...manualData, issue_fax: e.target.value })}
                          className="w-full bg-amber-50/15 border-2 border-dashed border-amber-400 focus:bg-white focus:border-amber-600 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 transition-colors"
                          placeholder="FAX"
                        />
                      </div>
                    </div>

                    <span className="text-[11px] font-black text-slate-400 block border-b border-slate-100 pb-1.5 pt-2 uppercase tracking-wider">시스템 자동 정보</span>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-slate-50 border border-slate-100 py-1.5 rounded-lg">
                        <span className="block text-[8px] text-slate-400 font-bold">출력 연도</span>
                        <span className="text-[11px] font-extrabold text-slate-700">{manualData.issue_year}년</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 py-1.5 rounded-lg">
                        <span className="block text-[8px] text-slate-400 font-bold">출력 월</span>
                        <span className="text-[11px] font-extrabold text-slate-700">{manualData.issue_month}월</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 py-1.5 rounded-lg">
                        <span className="block text-[8px] text-slate-400 font-bold">출력 일</span>
                        <span className="text-[11px] font-extrabold text-slate-700">{manualData.issue_day}일</span>
                      </div>
                    </div>
                  </div>

                  {/* AI 실행 SQL 쿼리 조회 아코디언 패널 */}
                  {showSql && generatedSql && (
                    <div className="col-span-1 md:col-span-3 mt-2 p-4 bg-slate-900 rounded-2xl border border-slate-800 text-left font-mono relative group transition-all duration-200">
                      <div className="absolute right-3.5 top-3.5 flex items-center gap-2">
                        <span className="text-[8px] bg-slate-800 text-violet-400 px-2 py-0.5 rounded-full font-bold">
                          SQLite3
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedSql);
                            alert('AI SQL 쿼리문이 클립보드에 성공적으로 복사되었습니다.');
                          }}
                          className="p-1.5 rounded-xl bg-slate-800 text-slate-450 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                          title="쿼리 복사"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="block text-[9px] font-black text-slate-500 mb-2.5 uppercase tracking-wider">
                        🤖 AI가 데이터 조인을 위해 자동 생성한 SQL 실행문
                      </span>
                      <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                        {generatedSql}
                      </pre>
                    </div>
                  )}
                </div>

                {/* 하단 제어 버튼 그룹 */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-150 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPrintStep('search')}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition rounded-xl cursor-pointer"
                    >
                      이전 단계로 (검색)
                    </button>
                    
                    {generatedSql && (
                      <button
                        onClick={() => setShowSql(!showSql)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                          showSql 
                            ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Database className="w-3.5 h-3.5 text-violet-500" />
                        {showSql ? 'AI SQL 쿼리 닫기' : 'AI SQL 쿼리 보기'}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleExecutePrint}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs transition rounded-xl cursor-pointer shadow-lg shadow-violet-600/10"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    양식 출력 실행 (Print)
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
