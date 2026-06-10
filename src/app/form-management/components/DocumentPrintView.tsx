'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  FileText, 
  RefreshCw, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface MappingItem {
  field_key: string;
  field_label: string;
  pos_x: number;
  pos_y: number;
  font_size: number;
  font_weight: string;
  text_align: string;
}

interface DocumentPrintViewProps {
  templateId: number;
  estimateId?: string; // Optional로 완화하여 범용 연동 지원
  onBack: () => void;
}

// 금액 한글 변환 함수
function convertToKoreanNumber(num: number): string {
  if (num === 0) return '영';
  const units = ['', '십', '백', '천'];
  const bigUnits = ['', '만', '억', '조'];
  const numbers = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  
  let result = '';
  let bigUnitIndex = 0;
  
  while (num > 0) {
    const chunk = num % 10000;
    num = Math.floor(num / 10000);
    
    if (chunk > 0) {
      let chunkStr = '';
      let temp = chunk;
      let unitIndex = 0;
      
      while (temp > 0) {
        const digit = temp % 10;
        temp = Math.floor(temp / 10);
        
        if (digit > 0) {
          const digitStr = numbers[digit];
          const unitStr = units[unitIndex];
          chunkStr = digitStr + unitStr + chunkStr;
        }
        unitIndex++;
      }
      result = chunkStr + bigUnits[bigUnitIndex] + result;
    }
    bigUnitIndex++;
  }
  return result;
}

export default function DocumentPrintView({ templateId, estimateId, onBack }: DocumentPrintViewProps) {
  const [template, setTemplate] = useState<any>(null);
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>({});
  
  // 범용 동적 쿼리 및 데이터 바인딩 상태
  const [querySql, setQuerySql] = useState<string>('');
  const [queryParamsList, setQueryParamsList] = useState<any[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [paramOptions, setParamOptions] = useState<Record<string, string[]>>({});
  const [queriedData, setQueriedData] = useState<any>(null);
  const [estimateItems, setEstimateItems] = useState<any[]>([]); // 기존 품목 상세 테이블 하위 호환성 유지

  const [loading, setLoading] = useState(true);
  const [queryRunning, setQueryRunning] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // 공통 양식 요소 실시간 값 관리용 상태
  const [commonDate, setCommonDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [commonInput, setCommonInput] = useState<string>('대외 제출용');
  const [commonTag, setCommonTag] = useState<string>('[제출용]');
  const [showStamp, setShowStamp] = useState<boolean>(true);

  // 1) 인쇄 설정 세션 복원
  useEffect(() => {
    if (loading || !templateId) return;
    try {
      const savedConfig = localStorage.getItem(`egdesk_form_print_config_${templateId}`);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.commonDate) setCommonDate(parsed.commonDate);
        if (parsed.commonInput !== undefined) setCommonInput(parsed.commonInput);
        if (parsed.commonTag) setCommonTag(parsed.commonTag);
        if (parsed.showStamp !== undefined) setShowStamp(parsed.showStamp);
      }
    } catch (e) {
      console.error('인쇄 설정 세션 복원 실패:', e);
    }
  }, [loading, templateId]);

  // 2) 인쇄 설정 자동 세션 영속화
  useEffect(() => {
    if (loading || !templateId) return;
    try {
      const config = {
        commonDate,
        commonInput,
        commonTag,
        showStamp
      };
      localStorage.setItem(`egdesk_form_print_config_${templateId}`, JSON.stringify(config));
    } catch (e) {
      console.error('인쇄 설정 세션 저장 실패:', e);
    }
  }, [loading, templateId, commonDate, commonInput, commonTag, showStamp]);

  // 3) 초기 마스터 데이터 로드 (템플릿 및 자사 프로필)
  useEffect(() => {
    async function loadMasterData() {
      setLoading(true);
      try {
        // A. 템플릿 로드
        const tempRes = await fetch(`/api/templates?action=detail&id=${templateId}`);
        const tempData = await tempRes.json();
        
        // B. 자사 프로필 로드
        const compRes = await fetch('/api/settings?key=my_company_profile');
        const compData = await compRes.json();

        if (tempData.success) {
          const temp = tempData.template;
          setTemplate(temp);
          setMappings(tempData.mappings);
          setQuerySql(temp.query_sql || '');
          
          let parsedParams = [];
          try {
            parsedParams = JSON.parse(temp.query_params || '[]');
          } catch (pe) {
            console.error('파라미터 파싱 에러:', pe);
          }
          setQueryParamsList(parsedParams);

          if (compData.success && compData.value) {
            setCompanyProfile(JSON.parse(compData.value));
          } else {
            setCompanyProfile({
              companyName: '(주)쿠스',
              representative: '차민수',
              address: '서울특별시 금천구 가산디지털2로 123',
              phone: '02-1234-5678'
            });
          }

          // C. 조건 파라미터 드롭다운 옵션 로드
          if (temp.document_type) {
            const listRes = await fetch(`/api/db?action=query&tableName=${temp.document_type}&limit=300`);
            const listData = await listRes.json();
            
            if (listData.success && listData.rows) {
              const optionsMap: Record<string, string[]> = {};
              
              parsedParams.forEach((param: any) => {
                const uniqueVals = Array.from(
                  new Set(
                    listData.rows
                      .map((row: any) => {
                        return row[param.name] || row[param.name.toUpperCase()] || row['id'] || '';
                      })
                      .filter(Boolean)
                  )
                ) as string[];
                optionsMap[param.name] = uniqueVals;
              });
              setParamOptions(optionsMap);

              // D. 초기 파라미터 값 결정
              const initialVals: Record<string, any> = {};
              parsedParams.forEach((param: any) => {
                if (estimateId && (param.name.toLowerCase().includes('id') || param.name.toLowerCase().includes('estimate'))) {
                  initialVals[param.name] = estimateId;
                } else if (optionsMap[param.name] && optionsMap[param.name].length > 0) {
                  initialVals[param.name] = optionsMap[param.name][0];
                } else {
                  initialVals[param.name] = '';
                }
              });
              setParamValues(initialVals);
            }
          }
        } else {
          alert('양식 템플릿 설정 정보를 조회하지 못했습니다.');
        }
      } catch (e) {
        console.error(e);
        alert('데이터 로드 중 네트워크 통신 에러가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (templateId) {
      loadMasterData();
    }
  }, [templateId, estimateId]);

  // 4) paramValues 상태가 설정되거나 변경될 때마다 실시간 쿼리 실행
  useEffect(() => {
    if (loading || !querySql || Object.keys(paramValues).length === 0) return;

    async function runLiveQuery() {
      setQueryRunning(true);
      try {
        const res = await fetch('/api/templates/run-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            querySql,
            queryParams: paramValues
          })
        });
        const data = await res.json();
        if (data.success && data.data) {
          setQueriedData(data.data);

          // crm_estimates (견적서) 이고 테이블 상세 품목 바인딩이 필요한 경우 품목 로드 트리거 (하위호환 보장)
          const recordId = data.data.id || data.data.estimate_id;
          if (template?.document_type === 'crm_estimates' && recordId) {
            const estRes = await fetch(`/api/estimates?action=detail&estimateId=${recordId}`);
            const estData = await estRes.json();
            if (estData.success) {
              setEstimateItems(estData.items || []);
            }
          } else {
            setEstimateItems([]);
          }
        } else {
          setQueriedData(null);
          setEstimateItems([]);
        }
      } catch (e) {
        console.error('Live SQL Query execution error:', e);
      } finally {
        setQueryRunning(false);
      }
    }

    runLiveQuery();
  }, [loading, querySql, paramValues, template?.document_type]);

  // 바인딩 데이터 값 매핑 변환기
  const getBindingValue = (fieldKey: string) => {
    if (fieldKey === 'common_date') return commonDate;
    if (fieldKey === 'common_input') return commonInput;
    if (fieldKey === 'common_tag') return commonTag;
    if (fieldKey === 'common_stamp') return '';

    // 자사 프로필 정보 매핑 연동
    if (fieldKey === 'company_name') return companyProfile.companyName || '';
    if (fieldKey === 'company_biz_num') return companyProfile.businessNumber || '';
    if (fieldKey === 'company_owner') return companyProfile.representative || '';
    if (fieldKey === 'company_address') return companyProfile.address || '';
    if (fieldKey === 'company_phone') return companyProfile.phone || '';

    if (!queriedData) return '';

    const val = queriedData[fieldKey];
    if (val === undefined || val === null) {
      if (fieldKey.includes('_year') || fieldKey.includes('_month') || fieldKey.includes('_day')) {
        const dateVal = queriedData['created_at'] || queriedData['joined_date'] || queriedData['order_date'] || '';
        if (dateVal) {
          const d = new Date(dateVal.toString().replace(' ', 'T'));
          if (!isNaN(d.getTime())) {
            if (fieldKey.includes('_year')) return d.getFullYear().toString();
            if (fieldKey.includes('_month')) return (d.getMonth() + 1).toString().padStart(2, '0');
            if (fieldKey.includes('_day')) return d.getDate().toString().padStart(2, '0');
          }
        }
      }
      return '';
    }

    if (fieldKey === 'total_amount_krw') {
      const numVal = Number(queriedData['total_amount'] || queriedData['amount'] || 0);
      return `일금 ${convertToKoreanNumber(numVal)}원정 (\\${numVal.toLocaleString()})`;
    }

    if (typeof val === 'number') {
      if (fieldKey.toLowerCase().includes('id') || fieldKey.toLowerCase().includes('phone') || fieldKey.toLowerCase().includes('number')) {
        return val.toString();
      }
      return val.toLocaleString() + ' 원';
    }

    return val.toString();
  };

  // 브라우저 윈도우 인쇄
  const handlePrint = () => {
    window.print();
  };

  // jsPDF와 html2canvas를 활용한 PDF 고화질 캡처 다운로드
  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setPdfGenerating(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = printAreaRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const documentName = queriedData ? (queriedData.partner_name || queriedData.name || '문서') : '양식출력';
      const fileName = `${template.template_name || '양식'}_${documentName}_${Date.now()}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF 다운로드 실패:', error);
      alert('PDF 파일을 생성하는 중 문제가 발생했습니다.');
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <RefreshCw className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
        <p className="text-base font-bold text-slate-700">인쇄할 데이터를 정제하는 중입니다...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-black text-slate-800 mb-2">데이터 로드 실패</h3>
        <p className="text-xs font-semibold text-slate-500 mb-5">인쇄 양식 설정 데이터를 찾을 수 없습니다.</p>
        <button onClick={onBack} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 transition rounded-xl text-xs font-black text-white cursor-pointer shadow-md">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-white text-slate-800 border border-slate-100 rounded-3xl shadow-sm overflow-hidden min-h-[85vh]">
      
      {/* 글로벌 인쇄 전용 CSS 주입 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area-wrapper, #print-area-wrapper * {
            visibility: visible !important;
          }
          #print-area-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}} />

      {/* 1. 컨트롤 탑 바 */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-5 border-b border-slate-100 bg-white/95 backdrop-blur-md gap-4 no-print">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-slate-600 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-lg font-black flex items-center gap-2 text-slate-800">
              <FileText className="w-5 h-5 text-indigo-600" />
              양식 오버레이 출력 미리보기
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">선택한 조건 정보를 기반으로 실시간 DB 쿼리를 수행하여 출력합니다.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer border border-slate-200/50 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            인쇄하기 (window.print)
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={pdfGenerating}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
          >
            {pdfGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                PDF 생성 중...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                PDF 다운로드
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. 메인 워크스페이스 (좌우 분할) */}
      <div className="flex flex-1 flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* 좌측 인터랙티브 조작 패널 (인쇄 대상 제외) */}
        <div className="w-full md:w-[380px] p-6 border-r border-slate-100 bg-slate-50/50 overflow-y-auto flex flex-col gap-6 no-print">
          
          {/* A. 동적 데이터베이스 조건 선택 패널 */}
          {queryParamsList.length > 0 && (
            <div className="flex flex-col gap-4 p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100">
              <div className="flex items-center gap-2 border-b border-indigo-100 pb-2 mb-1">
                <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                <h3 className="text-xs font-black text-indigo-900">데이터 조회 조건</h3>
              </div>
              
              <div className="flex flex-col gap-3">
                {queryParamsList.map((param: any) => {
                  const options = paramOptions[param.name] || [];
                  const value = paramValues[param.name] || '';
                  
                  return (
                    <div key={param.name} className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-bold text-indigo-900/80">
                        {param.label} ({param.name})
                      </label>
                      
                      {options.length > 0 ? (
                        <select
                          value={value}
                          onChange={e => setParamValues(prev => ({ ...prev, [param.name]: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:border-indigo-600 focus:outline-none shadow-sm"
                        >
                          {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={param.type === 'number' ? 'number' : 'text'}
                          value={value}
                          onChange={e => setParamValues(prev => ({ ...prev, [param.name]: e.target.value }))}
                          placeholder={`${param.label} 직접 입력`}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-600 focus:outline-none text-xs font-semibold shadow-sm transition"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {queryRunning && (
                <div className="flex items-center justify-center gap-2 py-1 text-slate-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span className="text-[10px] font-bold">DB 실시간 조회 중...</span>
                </div>
              )}
            </div>
          )}

          {/* B. 수기 조작 영역 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-800 border-l-4 border-indigo-600 pl-2">실시간 양식 항목 조작</h3>
            
            {/* 1. 인쇄 일자 */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-500">인쇄 일자 (common_date)</label>
              <input 
                type="date" 
                value={commonDate}
                onChange={e => setCommonDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-600 focus:outline-none text-xs font-semibold transition shadow-sm"
              />
            </div>

            {/* 2. 추가 입력 사항 */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-500">수기 추가 내용 (common_input)</label>
              <input 
                type="text" 
                value={commonInput}
                onChange={e => setCommonInput(e.target.value)}
                placeholder="예: 대외 제출용, 담당자 코멘트 등"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-600 focus:outline-none text-xs font-semibold transition shadow-sm"
              />
            </div>

            {/* 3. 양식 태그 */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-500">용도 태그 (common_tag)</label>
              <select 
                value={commonTag}
                onChange={e => setCommonTag(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:border-indigo-600 focus:outline-none shadow-sm"
              >
                {['[제출용]', '[보관용]', '[결재용]', '[원청 전달용]'].map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            {/* 4. 도장 날인 여부 */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm mt-2">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-700">회사 대표 직인 오버레이</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">common_stamp 위치에 날인</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  checked={showStamp}
                  onChange={e => setShowStamp(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 animate-transition"></div>
              </label>
            </div>

          </div>

          {/* 안내 메시지 */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 text-[11px] text-indigo-800 leading-relaxed font-medium text-left">
            <p className="font-bold mb-1">💡 실시간 조작 팁</p>
            좌측 조건 선택 옵션에서 대상을 고르면 DB에서 실시간 쿼리하여 우측 서식 캔버스 위로 바인딩 처리합니다. 수기 추가 요소도 즉시 얹어집니다.
          </div>

        </div>

        {/* 우측 실물 미리보기 영역 */}
        <div className="flex-1 bg-slate-100/50 p-8 overflow-y-auto flex justify-center items-start shadow-inner min-w-0">
          
          {/* 인쇄 및 캡처 전용 A4 사이즈 래퍼 */}
          <div 
            ref={printAreaRef}
            id="print-area-wrapper"
            style={{ 
              backgroundImage: `url(${template.file_path})`,
              backgroundSize: '100% 100%'
            }}
            className="relative bg-white shadow-2xl border border-slate-300 aspect-[1/1.414] w-[700px] md:w-[750px] overflow-hidden select-none shrink-0"
          >
            
            {/* 데이터가 없을 때의 경고 안내 */}
            {!queriedData && (
              <div className="absolute inset-0 bg-slate-50/70 z-40 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-12 h-12 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-600">조건에 부합하는 데이터가 존재하지 않습니다.</span>
                <span className="text-[10px] text-slate-400 mt-1">좌측 조회 조건을 다시 설정해주십시오.</span>
              </div>
            )}

            {/* 매핑된 데이터들 오버레이 */}
            {queriedData && mappings.map((mapping, idx) => {
              const isTable = mapping.field_key === 'estimate_items_table';
              const value = getBindingValue(mapping.field_key);

              // 1. 도장(common_stamp) 전용 SVG 렌더링
              if (mapping.field_key === 'common_stamp') {
                if (!showStamp) return null;
                const representativeName = companyProfile.representative || '차민수';
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${mapping.pos_x}%`,
                      top: `${mapping.pos_y}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 15
                    }}
                    className="pointer-events-none"
                  >
                    <svg width="65" height="65" viewBox="0 0 100 100" className="text-red-600/80 fill-none stroke-current" style={{ transform: 'rotate(-5deg)', opacity: 0.85 }}>
                      <circle cx="50" cy="50" r="46" strokeWidth="4" />
                      <circle cx="50" cy="50" r="41" strokeWidth="1.5" strokeDasharray="3 3" />
                      <text x="50" y="32" textAnchor="middle" fontSize="11" fontWeight="black" fill="currentColor">주식회사</text>
                      <text x="50" y="49" textAnchor="middle" fontSize="13" fontWeight="black" fill="currentColor">쿠 스</text>
                      <text x="50" y="66" textAnchor="middle" fontSize="12" fontWeight="black" fill="currentColor">대표이사</text>
                      <text x="50" y="82" textAnchor="middle" fontSize="11" fontWeight="black" fill="currentColor">{representativeName} (인)</text>
                    </svg>
                  </div>
                );
              }

              // 2. 품목표일 경우 별도 표 마크업 렌더링
              if (isTable) {
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${mapping.pos_x}%`,
                      top: `${mapping.pos_y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: '90%',
                      fontSize: `${mapping.font_size}px`,
                      textAlign: mapping.text_align as any
                    }}
                    className="z-10 px-2 py-1 text-slate-800 font-medium"
                  >
                    <table className="w-full border-collapse border border-slate-400 text-slate-900 bg-white/70">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400 text-center text-[10px] md:text-xs">
                          <th className="p-1 border-r border-slate-400 w-12">순번</th>
                          <th className="p-1 border-r border-slate-400">품목명</th>
                          <th className="p-1 border-r border-slate-400 w-16">수량</th>
                          <th className="p-1 border-r border-slate-400 w-24">단가</th>
                          <th className="p-1 w-28">금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimateItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-3 text-center text-slate-400 text-[10px] md:text-xs">상세 품목 내역이 없습니다.</td>
                          </tr>
                        ) : (
                          estimateItems.map((item, index) => (
                            <tr key={item.id || index} className="border-b border-slate-300 text-[10px] md:text-xs">
                              <td className="p-1 border-r border-slate-400 text-center">{index + 1}</td>
                              <td className="p-1 border-r border-slate-400 text-left pl-2 truncate max-w-[200px]" title={item.product_name}>{item.product_name}</td>
                              <td className="p-1 border-r border-slate-400 text-center font-bold">{(item.quantity || 0).toLocaleString()}</td>
                              <td className="p-1 border-r border-slate-400 text-right pr-2">{(item.unit_price || 0).toLocaleString()}</td>
                              <td className="p-1 text-right pr-2 font-bold">{(item.amount || 0).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                        
                        {/* 합계행 */}
                        {estimateItems.length > 0 && (
                          <tr className="bg-indigo-50/30 font-bold border-t border-slate-400 text-[10px] md:text-xs text-slate-900">
                            <td colSpan={2} className="p-1.5 border-r border-slate-400 text-center">합 계</td>
                            <td className="p-1.5 border-r border-slate-400 text-center">
                              {estimateItems.reduce((acc, cur) => acc + (parseInt(cur.quantity) || 0), 0).toLocaleString()}
                            </td>
                            <td className="p-1.5 border-r border-slate-400 text-right"></td>
                            <td className="p-1.5 text-right pr-2 text-indigo-700">
                              {Number(queriedData['total_amount'] || queriedData['amount'] || 0).toLocaleString()}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              }

              // 3. 일반 텍스트 필드 렌더링
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${mapping.pos_x}%`,
                    top: `${mapping.pos_y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${mapping.font_size}px`,
                    fontWeight: mapping.font_weight as any,
                    textAlign: mapping.text_align as any,
                    color: '#1e293b',
                    whiteSpace: 'nowrap'
                  }}
                  className="z-10 px-1 py-0.5 rounded font-medium"
                >
                  {value}
                </div>
              );
            })}

          </div>

        </div>

      </div>
      
    </div>
  );
}
