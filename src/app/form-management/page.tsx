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
  HelpCircle
} from 'lucide-react';

import FormTemplateEditor from './components/FormTemplateEditor';
import DocumentPrintView from './components/DocumentPrintView';

interface FormTemplate {
  id: number;
  template_name: string;
  document_type: string;
  file_path: string;
  orientation: string;
  is_active: number;
  mapping_count: number;
  updated_at: string;
}

export default function FormManagementPage() {
  const [viewMode, setViewMode] = useState<'list' | 'editor' | 'print'>('list');
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 편집용 상태
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined);
  
  // 인쇄 및 테스트용 상태
  const [printTemplateId, setPrintTemplateId] = useState<number | null>(null);
  const [printEstimateId, setPrintEstimateId] = useState<string | null>(null);
  
  // 견적서 선택 모달 상태
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [estimatesLoading, setEstimatesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 현재 모달 출력 대상 템플릿 정보 계산
  const activeTemplate = templates.find(t => t.id === printTemplateId);
  const activeDocType = activeTemplate ? activeTemplate.document_type : '';
  const activeTemplateName = activeTemplate ? activeTemplate.template_name : '양식';

  // 1) 마운트 완료 후 로컬 스토리지에서 세션 복원
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('egdesk_form_page_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.viewMode) {
          setViewMode(parsed.viewMode);
        }
        if (parsed.selectedTemplateId !== undefined) {
          setSelectedTemplateId(parsed.selectedTemplateId);
        }
        if (parsed.printTemplateId !== undefined) {
          setPrintTemplateId(parsed.printTemplateId);
        }
        if (parsed.printEstimateId !== undefined) {
          setPrintEstimateId(parsed.printEstimateId);
        }
      }
    } catch (e) {
      console.error('세션 복원 실패:', e);
    }
  }, []);

  // 2) 상태 변경 시마다 로컬 스토리지 동기화
  useEffect(() => {
    try {
      const stateToSave = {
        viewMode,
        selectedTemplateId,
        printTemplateId,
        printEstimateId
      };
      localStorage.setItem('egdesk_form_page_state', JSON.stringify(stateToSave));
    } catch (e) {
      console.error('세션 저장 실패:', e);
    }
  }, [viewMode, selectedTemplateId, printTemplateId, printEstimateId]);

  // 템플릿 목록 로드
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/templates');
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

  useEffect(() => {
    loadTemplates();
  }, []);

  // 템플릿 소프트 삭제 처리
  const handleDeleteTemplate = async (id: number, name: string) => {
    if (!confirm(`'${name}' 양식을 정말로 삭제하시겠습니까?\n삭제된 양식은 소프트 삭제 처리되어 안전하게 이력이 보관됩니다.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/templates?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert('양식이 성공적으로 삭제되었습니다.');
        loadTemplates();
      } else {
        alert(`삭제 실패: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('템플릿 삭제 중 네트워크 오류가 발생했습니다.');
    }
  };

  // 테스트 출력 버튼 클릭 시 연동 데이터 소스 테이블에 맞추어 목록 가져오기 및 모달 열기
  const handleOpenPrintModal = async (templateId: number) => {
    setPrintTemplateId(templateId);
    
    // 현재 선택된 템플릿의 연동 데이터 소스(document_type) 알아내기
    const template = templates.find(t => t.id === templateId);
    const docType = template ? template.document_type : 'crm_estimates';
    
    setIsEstimateModalOpen(true);
    setEstimatesLoading(true);
    setSearchTerm(''); // 검색 초기화
    
    try {
      let dataList: any[] = [];
      
      // 만약 docType이 'crm_estimates'이면 기존과 마찬가지로 /api/estimates?action=list 를 우선 부르고
      // 그 외의 동적 테이블인 경우 범용 DB 조회 API(/api/db?action=query)를 활용
      if (docType === 'crm_estimates' || !docType) {
        const res = await fetch('/api/estimates?action=list');
        const data = await res.json();
        if (data.success) {
          dataList = data.estimates || [];
        } else {
          throw new Error(data.error || '견적서 조회 실패');
        }
      } else {
        // 범용 DB 레코드 쿼리 API 호출
        const res = await fetch(`/api/db?action=query&tableName=${docType}&limit=100`);
        const data = await res.json();
        if (data.success) {
          // 각 테이블 레코드를 견적서 양식과 유사한 포맷으로 매핑
          dataList = (data.rows || []).map((row: any) => {
            const idVal = row.id || row.key || row.item_id || row.staff_id || row.uuid || '';
            const partnerVal = row.partner_name || row.name || row.title || row.company_name || row.username || '-';
            const firstItemVal = row.service_name || row.product_name || row.category || row.remarks || row.content || row.action_type || '-';
            const totalAmountVal = row.total_amount || row.amount || row.price || 0;
            const dateVal = row.created_at || row.order_date || row.reservation_date || row.captured_at || '-';
            
            return {
              id: String(idVal),
              partner_name: partnerVal,
              first_item_name: firstItemVal,
              total_amount: Number(totalAmountVal),
              created_at: dateVal,
              item_count: 1,
              originalRow: row
            };
          });
        } else {
          throw new Error(data.error || '테이블 데이터 조회 실패');
        }
      }
      
      setEstimates(dataList);
    } catch (e: any) {
      console.error(e);
      alert(`데이터 목록 로딩 중 에러가 발생했습니다:\n${e.message}`);
      setEstimates([]);
    } finally {
      setEstimatesLoading(false);
    }
  };

  // 견적서 선택 완료 -> 프리뷰 화면으로 전환
  const handleSelectEstimate = (estimateId: string) => {
    setPrintEstimateId(estimateId);
    setIsEstimateModalOpen(false);
    setViewMode('print');
  };

  // 검색어에 따른 견적 필터링
  const filteredEstimates = estimates.filter(est => {
    const term = searchTerm.toLowerCase();
    return (
      (est.id && est.id.toLowerCase().includes(term)) ||
      (est.partner_name && est.partner_name.toLowerCase().includes(term)) ||
      (est.first_item_name && est.first_item_name.toLowerCase().includes(term))
    );
  });

  return (
    <div 
      data-easybot-hint="양식 관리 AI: 사내 고유 A4 문서 양식 이미지(JPG/PNG)를 등록하고 DB의 견적서 데이터를 원하는 X/Y 좌표에 오버레이 매핑하여 실시간 조작 출력 및 PDF 다운로드를 지원합니다."
      className="w-full space-y-6 pb-20 min-w-0 font-sans text-slate-800 animate-fade-in text-left"
    >
      
      {/* 타이틀 헤더 (항상 노출되어 일관된 상단 여백 유지) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="text-left">
          <div className="flex items-center space-x-2">
            <FileText className="w-8 h-8 text-indigo-600 mr-2 shrink-0" />
            <h1 className="text-3xl font-black text-slate-900 flex items-center tracking-tight">
              사내 양식 관리 AI
              <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full font-bold ml-2.5 shrink-0">
                A4 오버레이
              </span>
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            사내 고유 A4 문서 양식(이미지)을 등록하고 데이터베이스 내 견적서 데이터를 오버레이 매핑하여 다이렉트 인쇄 및 고화질 PDF를 제공합니다.
          </p>
        </div>
        
        {viewMode === 'list' && (
          <button
            onClick={() => {
              setSelectedTemplateId(undefined);
              setViewMode('editor');
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm transition shadow-lg shadow-indigo-600/10 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            새 문서 양식 등록
          </button>
        )}

        {viewMode === 'editor' && (
          <div id="form-editor-actions-portal" className="flex items-center gap-2 shrink-0"></div>
        )}
      </div>

      {/* 1. 리스트 모드 */}
      {viewMode === 'list' && (
        <div className="space-y-6 animate-scale-up">
          {/* 정보 팁 카드 (견적서 페이지와 유사한 화사한 블루톤 가이드) */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-800/95 space-y-1.5 font-bold">
              <p className="font-extrabold text-indigo-900">💡 양식 매핑 자율 가이드라인</p>
              <p className="font-semibold text-indigo-800/80">1. 사내 양식이 PDF일 경우, 캡처 프로그램을 사용하여 깔끔하게 A4 비율의 JPG/PNG 이미지 파일로 변환하여 업로드합니다.</p>
              <p className="font-semibold text-indigo-800/80">2. [매핑 설정] 에디터에서 필요한 필드들을 마우스로 드래그하여 정확한 위치(%)에 배치할 수 있습니다.</p>
              <p className="font-semibold text-indigo-800/80">3. [테스트 출력]을 누르면 실제 작성된 견적서를 선택하여 오버레이 인쇄(`window.print()`) 하거나 고화질 PDF로 저장할 수 있습니다.</p>
            </div>
          </div>

          {/* 로딩 인디케이터 */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm font-semibold">등록된 양식 템플릿 목록을 불러오는 중...</p>
            </div>
          ) : templates.length === 0 ? (
            /* 빈 리스트 상태 */
            <div className="border border-slate-100 rounded-3xl p-16 text-center bg-white max-w-2xl mx-auto flex flex-col items-center shadow-sm">
              <div className="p-4 bg-slate-50 rounded-full mb-4">
                <FileCheck className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-800">등록된 문서 양식이 없습니다</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium max-w-sm leading-relaxed">
                첫 번째 A4 양식 이미지 파일을 등록하고, 데이터베이스에서 실시간으로 쿼리해 올 데이터를 매핑해보세요.
              </p>
              <button
                onClick={() => {
                  setSelectedTemplateId(undefined);
                  setViewMode('editor');
                }}
                className="mt-6 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white transition rounded-xl text-xs font-black cursor-pointer shadow-md"
              >
                새 양식 등록하기
              </button>
            </div>
          ) : (
            /* 템플릿 카드 그리드 */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(tmpl => (
                <div 
                  key={tmpl.id}
                  className="flex flex-col bg-white border border-slate-100 rounded-3xl overflow-hidden hover:border-indigo-600/30 transition duration-300 hover:shadow-lg hover:shadow-indigo-600/5 group shadow-sm"
                >
                  {/* 양식 썸네일 영역 */}
                  <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden border-b border-slate-100 flex items-center justify-center">
                    <img 
                      src={tmpl.file_path} 
                      alt={tmpl.template_name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase bg-slate-900/90 text-indigo-400 border border-slate-800/20">
                      {tmpl.orientation === 'portrait' ? 'A4 세로' : 'A4 가로'}
                    </div>

                    <div className="absolute top-3 right-3">
                      {tmpl.is_active === 1 ? (
                        <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 사용중
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-black bg-slate-100 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-200">
                          <XCircle className="w-3.5 h-3.5" /> 비활성
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 카드 디테일 정보 */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-black text-slate-800 group-hover:text-indigo-650 transition truncate text-base" title={tmpl.template_name}>
                        {tmpl.template_name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mt-2">
                        <span>대상 테이블: <strong className="text-slate-600 font-bold">{tmpl.document_type}</strong></span>
                        <span>•</span>
                        <span>매핑 필드: <strong className="text-indigo-600 font-black">{tmpl.mapping_count}개</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-1">
                      <span className="text-[10px] font-bold text-slate-400">수정: {tmpl.updated_at ? tmpl.updated_at.substring(0, 16) : '-'}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenPrintModal(tmpl.id)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition cursor-pointer"
                          title="테스트 출력"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedTemplateId(tmpl.id);
                            setViewMode('editor');
                          }}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                          title="좌표 설정 수정"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteTemplate(tmpl.id, tmpl.template_name)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition cursor-pointer"
                          title="양식 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. 편집 모드 (FormTemplateEditor) */}
      {viewMode === 'editor' && (
        <FormTemplateEditor 
          templateId={selectedTemplateId}
          onBack={() => {
            setSelectedTemplateId(undefined);
            setPrintTemplateId(null);
            setPrintEstimateId(null);
            setViewMode('list');
          }}
          onSaved={() => {
            setSelectedTemplateId(undefined);
            setPrintTemplateId(null);
            setPrintEstimateId(null);
            setViewMode('list');
            loadTemplates();
          }}
        />
      )}

      {/* 3. 출력 모드 (DocumentPrintView) */}
      {viewMode === 'print' && printTemplateId && printEstimateId && (
        <DocumentPrintView 
          templateId={printTemplateId}
          estimateId={printEstimateId}
          onBack={() => {
            setSelectedTemplateId(undefined);
            setPrintTemplateId(null);
            setPrintEstimateId(null);
            setViewMode('list');
          }}
        />
      )}

      {/* 4. 견적서 리스트 선택 모달 */}
      {isEstimateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="w-full max-w-3xl bg-white border border-slate-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] text-slate-800">
            
            {/* 모달 헤더 */}
            <div className="p-5 border-b border-slate-100 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2 text-slate-800">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  [{activeTemplateName}] 연동 데이터 선택
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold">양식의 지정된 좌표에 기입하여 렌더링할 [{activeDocType || '지정 테이블'}] 레코드를 선택하십시오.</p>
              </div>
              <button 
                onClick={() => setIsEstimateModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 transition text-xs font-black cursor-pointer"
              >
                닫기
              </button>
            </div>

            {/* 검색바 */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="식별값, 명칭, 혹은 분류/항목으로 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder-slate-400 font-bold"
              />
            </div>

            {/* 모달 컨텐트 */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/20">
              {estimatesLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                  <span className="text-xs font-bold">최근 데이터를 조회하는 중...</span>
                </div>
              ) : filteredEstimates.length === 0 ? (
                <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-black text-slate-500">조회된 데이터가 없습니다</p>
                  <p className="text-xs text-slate-400 mt-1">[{activeDocType || '지정 테이블'}] 테이블에 연동 데이터가 존재하는지 확인해 주세요.</p>
                </div>
              ) : (
                <div className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full border-collapse text-left text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                        <th className="p-4">식별 번호/ID</th>
                        <th className="p-4">대표자/명칭</th>
                        <th className="p-4">분류/항목</th>
                        <th className="p-4 text-right">금액/수치</th>
                        <th className="p-4 text-center">생성/일시</th>
                        <th className="p-4 text-center">선택</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEstimates.map(est => (
                        <tr 
                          key={est.id}
                          onClick={() => handleSelectEstimate(est.id)}
                          className="border-b border-slate-100 hover:bg-slate-50/70 transition cursor-pointer group"
                        >
                          <td className="p-4 font-mono font-black text-indigo-600 group-hover:underline">{est.id}</td>
                          <td className="p-4 font-bold text-slate-800">{est.partner_name || '-'}</td>
                          <td className="p-4 text-slate-500 max-w-[160px] truncate">
                            {est.first_item_name || '-'}
                            {est.item_count > 1 && ` 외 ${est.item_count - 1}건`}
                          </td>
                          <td className="p-4 text-right font-black text-slate-800">
                            {(est.total_amount || 0).toLocaleString()}{activeDocType === 'crm_estimates' ? '원' : ''}
                          </td>
                          <td className="p-4 text-center text-slate-400">
                            {est.created_at ? est.created_at.substring(0, 10) : '-'}
                          </td>
                          <td className="p-4 text-center">
                            <button className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition cursor-pointer">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
