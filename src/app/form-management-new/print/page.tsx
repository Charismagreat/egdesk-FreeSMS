'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw, AlertCircle, Printer, X, Laptop, Globe } from 'lucide-react';

function PrintViewContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 인쇄 출력 모드 분기 상태: 'print' (클래식 A4) vs 'web' (세련된 모던 웹)
  const [printMode, setPrintMode] = useState<'print' | 'web'>('print');
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  
  // 발급 완료 상태 기록 완료 여부
  const [isLogged, setIsLogged] = useState(false);

  // 동적 화면 맞춤용 스케일 상태 및 iframe 참조
  const [scale, setScale] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // DB 및 localStorage에서 읽어온 상태 보존용
  const [rawData, setRawData] = useState<any>(null);
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [webTemplateHtml, setWebTemplateHtml] = useState<string>(''); // 웹 전용 HTML 템플릿
  const [companyProfileData, setCompanyProfileData] = useState<any>(null);

  // 수동 입력 값들 상태 관리 (Mustache 바인딩 상태 유지용)
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

  // 브라우저 윈도우 크기 변화 감지하여 용지 축소 스케일 계산 (794x1123 A4 또는 모던 웹 기준)
  const handleResize = () => {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    // 모드별 가로/세로 기준 설정 (A4는 794x1123, 웹 프리뷰는 800x1200 기준)
    const targetWidth = printMode === 'print' ? 794 : 800;
    const targetHeight = printMode === 'print' ? 1123 : 1200;
    
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
  }, [printMode]);

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
        setWebTemplateHtml(template.web_html_content || ''); // 웹 전용 HTML 보존
        setCompanyProfileData(companyProfile);

        // 만약 웹 양식이 메인으로 설정되어 있거나 웹 전용 인쇄가 주 목적일 경우 웹 탭 활성화 지원을 위해 상태 동기화
        if (!template.html_content && template.web_html_content) {
          setPrintMode('web');
        }

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
    if (!loading && !error && rawData) {
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
        issue_email: manualData.issue_phone,
        issue_fax: manualData.issue_fax,
        
        issue_year,
        issue_month,
        issue_day
      };

      // 현재 선택된 출력 모드에 맞는 소스 템플릿 선택
      const activeTemplateSource = printMode === 'print' ? templateHtml : (webTemplateHtml || templateHtml);
      const compiled = compileMustache(activeTemplateSource, finalBindingData);
      setRenderedHtml(compiled);
    }
  }, [manualData, loading, error, rawData, templateHtml, webTemplateHtml, companyProfileData, printMode]);

  // Mustache 치환 엔진
  const compileMustache = (html: string, data: Record<string, any>) => {
    if (!html) return '';
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
      if (printMode === 'web') {
        try {
          const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
          const body = doc.body;
          const html = doc.documentElement;
          
          // 콘텐츠의 전체 높이를 구함
          const height = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight
          );
          
          // iframe 높이를 임시로 가득 채워서 잘림 방지
          iframeRef.current.style.height = `${height}px`;
        } catch (e) {
          console.warn('iframe 높이 동적 계산 실패:', e);
        }
      }

      // 비동기 렌더링 페인팅 대기용 지연 시간 추가 (150ms)
      setTimeout(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.focus();
          iframeRef.current.contentWindow.print();
        }
        
        if (printMode === 'web') {
          // 인쇄창 호출 후 원래 높이로 복구
          setTimeout(() => {
            if (iframeRef.current) {
              iframeRef.current.style.height = '100%';
            }
          }, 1000);
        }
      }, 150);
    } else {
      window.print();
    }
  };

  const handleClose = () => {
    window.close();
  };

  const buildIframeContent = () => {
    const hasHtmlTag = renderedHtml.includes('<html') || renderedHtml.includes('<HTML');
    
    // 모드별 여백 및 컨테이너 스타일 차별화
    const inlineStyles = printMode === 'print' ? `
      <style>
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 794px !important;
          height: 1123px !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          background-color: #ffffff !important;
          font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          padding: 0 !important; /* 기존 패딩 덮어쓰기 해제하여 템플릿의 원래 여백 보존 */
          position: relative !important;
          box-sizing: border-box !important;
        }
        .page, [class*="page"], .A4, .a4 {
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
          @page {
            size: A4;
            margin: 0 !important; /* 브라우저 기본 헤더/푸터 강제 감춤 */
          }
          html, body {
            overflow: visible !important;
            height: auto !important;
          }
          body {
            padding: 0 !important; /* 인쇄용 표준 A4 여백은 템플릿 내 container 스타일 사용 */
            margin: 0 !important;
          }
        }
      </style>
    ` : `
      <style>
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          box-sizing: border-box !important;
          background-color: #f4f7fa !important; /* 모던 웹용 연한 배경색 노출 */
          font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          padding: 40px 20px !important; /* 상하 여백을 확보해 렌더링 영역 확장 */
          overflow: hidden !important; /* 스크롤바 원천 제거 */
          display: flex !important;
          justify-content: center !important;
          align-items: flex-start !important; /* 세로 정렬 시 위쪽이 잘리지 않도록 상단 정렬 */
        }
        /* 화면 프리뷰 상태에서도 아래 직인 영역이 잘리지 않도록 간격을 조율 */
        .card, .web-card {
          box-sizing: border-box !important;
        }
        .header {
          margin-bottom: 25px !important;
          padding-bottom: 20px !important;
        }
        .grid {
          gap: 15px !important;
          margin-bottom: 25px !important;
        }
        .field-value {
          padding: 12px 14px !important;
        }
        .statement-box {
          padding: 24px !important;
          margin: 30px 0 !important;
        }
        .issuer-card {
          padding: 20px !important;
          margin-top: 20px !important;
        }
        .footer-brand {
          margin-top: 35px !important;
        }
        /* 인쇄 시 브라우저 머리글/바닥글 숨김 및 배경/여백 보정 */
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 0 !important; /* 브라우저 기본 헤더/푸터 강제 감춤 */
          }
          html, body {
            overflow: visible !important;
            height: auto !important;
            background-color: #ffffff !important; /* 인쇄 시 배경을 흰색으로 변경 */
            display: block !important; /* flex 정렬 해제 */
          }
          body {
            padding: 15mm 20mm !important; /* A4 맞춤 표준 안쪽 여백 */
            margin: 0 !important;
          }
          .card, .web-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: transparent !important;
          }
          /* 인쇄 시 모던 웹 템플릿의 전체적인 여백 및 마진 축소로 A4 1페이지 맞춤 대응 */
          .header {
            margin-bottom: 20px !important;
            padding-bottom: 15px !important;
          }
          .header h1 {
            font-size: 26px !important;
          }
          .section-title {
            font-size: 13px !important;
            margin-bottom: 12px !important;
            margin-top: 20px !important;
          }
          .grid {
            gap: 12px !important;
            margin-bottom: 20px !important;
          }
          .field-value {
            padding: 10px 12px !important;
            font-size: 13px !important;
            border: 1px solid #cbd5e1 !important; /* 배경 그래픽 해제 대비 테두리선 강화 */
          }
          .statement-box {
            padding: 20px !important;
            font-size: 15px !important;
            margin: 25px 0 !important;
            border: 1px solid #bfdbfe !important; /* 배경 그래픽 해제 대비 파란 테두리 추가 */
          }
          .meta-info {
            margin-top: 20px !important;
            padding-top: 15px !important;
          }
          .issuer-card {
            padding: 16px !important;
            margin-top: 15px !important;
            border: 1px solid #cbd5e1 !important; /* 배경 그래픽 해제 대비 테두리선 강화 */
          }
          .issuer-grid {
            gap: 12px !important;
          }
          .footer-brand {
            margin-top: 30px !important;
            padding-top: 15px !important;
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
      <div className="w-full bg-slate-900 px-6 py-3 border-b border-slate-880 flex items-center justify-between no-print shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-black text-white mr-2">
              양식 출력 프리뷰
            </span>
          </div>

          {/* 출력용 포맷 탭 스위치 */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl shrink-0 gap-1.5 border border-slate-850">
            <button
              onClick={() => setPrintMode('print')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                printMode === 'print' 
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-650/30' 
                  : 'text-slate-400 hover:text-white bg-slate-900/40'
              }`}
            >
              <Laptop className="w-3 h-3" />
              인쇄용 A4 형식
            </button>
            <button
              onClick={() => {
                if (!webTemplateHtml) {
                  alert('변환된 모던 웹페이지 템플릿이 존재하지 않습니다. 먼저 에디터에서 양식을 AI 분석해 주세요.');
                  return;
                }
                setPrintMode('web');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                printMode === 'web' 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-650/30' 
                  : 'text-slate-400 hover:text-white bg-slate-900/40'
              }`}
            >
              <Globe className="w-3 h-3" />
              모던 웹페이지 형식
            </button>
          </div>

          {isLogged && (
            <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded font-extrabold">
              대장 기록 보존 완료
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-white font-extrabold text-xs transition cursor-pointer shadow-md ${
              printMode === 'print' ? 'bg-violet-600 hover:bg-violet-755' : 'bg-emerald-600 hover:bg-emerald-750'
            }`}
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
            width: printMode === 'print' ? '794px' : '800px',
            height: printMode === 'print' ? '1123px' : '1200px',
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className={`overflow-hidden a4-print-box text-left shrink-0 flex flex-col transition-colors duration-200 ${
            printMode === 'print' 
              ? 'bg-white shadow-2xl border border-slate-300' 
              : 'bg-transparent border-none shadow-none'
          }`}
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
