'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw, AlertCircle, Printer, X } from 'lucide-react';

function PrintViewContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  
  // 발급 완료 상태 기록 완료 여부
  const [isLogged, setIsLogged] = useState(false);

  // 동적 화면 맞춤용 스케일 상태 및 iframe 참조
  const [scale, setScale] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // DB 및 localStorage에서 읽어온 상태 보존용
  const [rawData, setRawData] = useState<any>(null);
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [companyProfileData, setCompanyProfileData] = useState<any>(null);

  // 수동 입력 값들 상태 관리 (UI는 안보이지만 Mustache 바인딩 상태 유지용)
  const [manualData, setManualData] = useState({
    resident_id: '',
    usage: '',
    address: '',
    position: '',
    department: '',
    issue_dept: '',
    issue_phone: '',
    issue_email: '',
    issue_fax: ''
  });

  // 재직기간 자동 계산 헬퍼 함수
  const calculateEmploymentPeriod = (joinedDateStr?: string, resignedDateStr?: string) => {
    if (!joinedDateStr) return '';
    
    const cleanDate = (dateStr: string) => {
      return dateStr.replace(/[^0-9-]/g, '');
    };
    
    const start = new Date(cleanDate(joinedDateStr));
    const end = resignedDateStr ? new Date(cleanDate(resignedDateStr)) : new Date();
    
    if (isNaN(start.getTime())) return joinedDateStr;
    
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    
    if (days < 0) {
      months -= 1;
    }
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

  // 브라우저 윈도우 크기 변화 감지하여 용지 축소 스케일 계산
  const handleResize = () => {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    const targetWidth = 794;
    const targetHeight = 1123;
    
    const availableWidth = containerWidth - 64;
    const availableHeight = containerHeight - 52 - 64;
    
    const scaleX = availableWidth / targetWidth;
    const scaleY = availableHeight / targetHeight;
    const computedScale = Math.min(scaleX, scaleY);
    
    setScale(Math.max(0.1, Math.min(computedScale, 1.0)));
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!templateId) {
      setError('필수 출력 파라미터(templateId)가 누락되었습니다.');
      setLoading(false);
      return;
    }

    const loadAndRender = async () => {
      try {
        // 1. 로컬스토리지에서 사전에 전송한 최종 데이터셋 복구
        const storedJson = localStorage.getItem('web_form_print_data');
        if (!storedJson) {
          throw new Error('인쇄용 데이터(localStorage)가 존재하지 않습니다. 메인 화면에서 양식 출력을 다시 실행하십시오.');
        }

        let printData: any;
        try {
          printData = JSON.parse(storedJson);
        } catch (e) {
          throw new Error('인쇄용 데이터 포맷이 유효하지 않습니다.');
        }

        // 2. 템플릿 정보 로드
        const tempRes = await fetch(`/api/templates-new?action=detail&id=${templateId}`);
        const tempData = await tempRes.json();
        if (!tempData.success || !tempData.template) {
          throw new Error(tempData.error || '템플릿 정보를 불러오는 데 실패했습니다.');
        }
        const template = tempData.template;
        const companyProfile = tempData.companyProfile || {};

        // 3. 바인딩용 최종 데이터셋 조립
        const bindingData: Record<string, any> = {
          ...companyProfile,
          ...printData
        };

        // [비즈니스 가드] 재직증명서 발급 목적 검증: 현재 재직 중인 직원만 발급 허용
        const isEmploymentCert = template.template_name.includes('재직');
        if (isEmploymentCert && bindingData.employment_status) {
          const status = String(bindingData.employment_status).trim();
          const isEmployed = 
            status.includes('재직') || 
            status.includes('근무') || 
            status.toLowerCase() === 'employed' || 
            status.toLowerCase() === 'active';
          if (!isEmployed) {
            throw new Error(`[출력 제한] 선택된 사원(${bindingData.staff_name || bindingData.name})은 현재 재직 상태가 아닙니다 (현재 상태: ${status}). 재직증명서는 재직 중인 직원만 발급이 가능합니다. 퇴직한 사원은 [경력증명서] 양식을 활용해 주십시오.`);
          }
        }

        // 원본 및 회사 프로필 상태 보존
        setRawData(bindingData);
        setTemplateHtml(template.html_content);
        setCompanyProfileData(companyProfile);

        // 덮어쓸 수동 필드 상태 동기화
        setManualData({
          resident_id: bindingData.resident_id || '',
          usage: bindingData.usage || '',
          address: bindingData.address || '',
          position: bindingData.position || '',
          department: bindingData.department || '',
          issue_dept: bindingData.issue_dept || '',
          issue_phone: bindingData.issue_phone || companyProfile.phone || '',
          issue_email: bindingData.issue_email || companyProfile.email || '',
          issue_fax: bindingData.issue_fax || ''
        });

        setLoading(false);

        // 4. 발급대장에 안전하게 로그 적재
        const recordIdVal = bindingData.record_id || 'MANUAL';
        const recordNameVal = bindingData.staff_name || bindingData.name || '알수없음';
        await logPrintHistory(template.id, recordIdVal, recordNameVal, bindingData);

      } catch (err: any) {
        console.error(err);
        setError(err.message || '인쇄 양식 렌더링 중 알 수 없는 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    loadAndRender();
  }, [templateId]);

  // 실시간 Mustache 치환 및 데이터 업데이트
  useEffect(() => {
    if (!loading && !error && rawData && templateHtml) {
      const now = new Date();
      const issue_year = String(now.getFullYear());
      const issue_month = String(now.getMonth() + 1);
      const issue_day = String(now.getDate());

      const finalBindingData = {
        ...companyProfileData,
        ...rawData,
        
        employment_period: rawData.employment_period || calculateEmploymentPeriod(rawData.joined_date, rawData.resigned_date),
        
        resident_id: manualData.resident_id,
        usage: manualData.usage,
        address: manualData.address || rawData.address || '',
        position: manualData.position,
        department: manualData.department,
        issue_dept: manualData.issue_dept,
        issue_phone: manualData.issue_phone,
        issue_email: manualData.issue_email,
        issue_fax: manualData.issue_fax,
        
        issue_year,
        issue_month,
        issue_day
      };

      const compiled = compileMustache(templateHtml, finalBindingData);
      setRenderedHtml(compiled);
    }
  }, [manualData, loading, error, rawData, templateHtml, companyProfileData]);

  // Mustache 치환 엔진
  const compileMustache = (html: string, data: Record<string, any>) => {
    return html.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const cleanKey = key.trim();
      return data[cleanKey] !== undefined ? String(data[cleanKey]) : '';
    });
  };

  // 발급 대장 이력 적재
  const logPrintHistory = async (tempId: number, recId: string, recName: string, printData: any) => {
    try {
      const res = await fetch('/api/templates-new/print-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: tempId,
          record_id: recId,
          record_name: recName || '',
          print_data: printData
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsLogged(true);
        console.log('✅ 발급 대장에 기록이 성공적으로 보존되었습니다.');
      } else {
        console.warn('발급 대장 기록 실패:', data.error);
      }
    } catch (err) {
      console.error('발급 대장 기록 통신 오류:', err);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  const handleClose = () => {
    window.close();
  };

  const buildIframeContent = () => {
    const hasHtmlTag = renderedHtml.includes('<html') || renderedHtml.includes('<HTML');
    
    const inlineStyles = `
      <style>
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          background-color: #ffffff !important;
          font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        body {
          padding: 0 !important;
          position: relative !important;
        }

        body > div,
        div,
        table,
        thead,
        tbody,
        tr {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 100% !important;
        }

        .page,
        [class*="page"],
        .A4,
        .a4 {
          width: 100% !important;
          height: 100% !important;
          padding: 15mm 10mm !important;
          box-shadow: none !important;
          margin: 0 !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }

        table {
          border-collapse: collapse !important;
          margin-top: 10px;
          margin-bottom: 10px;
        }
        
        td, th {
          border-collapse: collapse !important;
          vertical-align: middle;
        }

        img {
          max-width: 100% !important;
          height: auto !important;
        }

        @media print {
          html, body {
            overflow: visible !important;
            height: auto !important;
          }
        }
      </style>
    `;

    if (hasHtmlTag) {
      const headCloseIndex = renderedHtml.toLowerCase().indexOf('</head>');
      if (headCloseIndex !== -1) {
        return renderedHtml.substring(0, headCloseIndex) + inlineStyles + renderedHtml.substring(headCloseIndex);
      }
      return inlineStyles + renderedHtml;
    } else {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Print Document</title>
            ${inlineStyles}
          </head>
          <body>
            ${renderedHtml}
          </body>
        </html>
      `;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-500">
        <RefreshCw className="w-10 h-10 animate-spin text-violet-600 mb-3" />
        <p className="text-sm font-extrabold">양식에 데이터를 매핑하고 렌더링하는 중...</p>
        <p className="text-[10px] text-slate-400 mt-1">발급 대장 이력을 등록하는 중입니다.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center max-w-md mx-auto">
        <div className="p-4 bg-rose-50 rounded-full text-rose-500 mb-4 border border-rose-100">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-black text-slate-800">양식 출력 에러</h3>
        <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">{error}</p>
        <button 
          onClick={handleClose}
          className="mt-6 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition rounded-xl cursor-pointer"
        >
          창 닫기
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 h-screen overflow-hidden flex flex-col justify-start items-center">
      {/* 화면 상단에만 노출되는 인쇄 제어 툴바 (인쇄 시 숨김 처리) */}
      <div className="w-full bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between no-print shrink-0 shadow-md">
        <div className="flex items-center gap-2.5">
          <Printer className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-black text-white">
            A4 인쇄 출력 프리뷰
          </span>
          {isLogged && (
            <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded font-extrabold">
              대장 기록 보존 완료
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition cursor-pointer shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            인쇄 (Print)
          </button>
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white text-xs font-extrabold transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            닫기
          </button>
        </div>
      </div>

      {/* 인쇄 대상 A4 컨테이너 (화면 크기에 따른 반응형 scale-down 적용) */}
      <div className="flex-1 w-full pt-0 pb-4 px-4 flex justify-center items-start overflow-hidden print-container">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background-color: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .print-container {
              padding: 0 !important;
              margin: 0 !important;
              overflow: visible !important;
              display: block !important;
            }
            .a4-print-box {
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              transform: none !important;
              transform-origin: none !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}} />
        <div 
          style={{
            width: '794px',
            height: '1123px',
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="bg-white shadow-2xl border border-slate-300 overflow-hidden a4-print-box text-left shrink-0 flex flex-col"
        >
          <iframe
            ref={iframeRef}
            srcDoc={buildIframeContent()}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              overflow: 'hidden'
            }}
            scrolling="no"
          />
        </div>
      </div>
    </div>
  );
}

export default function WebTemplatePrintPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-500">
        <RefreshCw className="w-10 h-10 animate-spin text-violet-600 mb-3" />
        <p className="text-sm font-extrabold">프린트 페이지 초기화 중...</p>
      </div>
    }>
      <PrintViewContent />
    </Suspense>
  );
}
