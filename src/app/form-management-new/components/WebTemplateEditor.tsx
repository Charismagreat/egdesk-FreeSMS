'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Sparkles, 
  Save, 
  Copy, 
  Check, 
  RefreshCw, 
  FileCode,
  Laptop,
  Globe
} from 'lucide-react';

interface WebTemplateEditorProps {
  templateId?: number;
  onBack: () => void;
  onSaved: () => void;
}

export default function WebTemplateEditor({ templateId, onBack, onSaved }: WebTemplateEditorProps) {
  const [templateName, setTemplateName] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [webHtmlContent, setWebHtmlContent] = useState(''); // 웹 전용 HTML 소스 코드
  const [isActive, setIsActive] = useState(true);
  
  // 파일 업로드 및 변환 상태
  const [isUploading, setIsUploading] = useState(false);
  const [detectedFields, setDetectedFields] = useState<string[]>([]);
  
  // AI 피드백 튜닝 상태
  const [feedback, setFeedback] = useState('');
  const [targetPrint, setTargetPrint] = useState(true); // 인쇄용 양식 수정 활성화 여부
  const [targetWeb, setTargetWeb] = useState(true);   // 웹용 양식 수정 활성화 여부
  const [isTuning, setIsTuning] = useState(false);
  
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 모바일/소형 화면 탭 전환 상태
  const [activeTab, setActiveTab] = useState<'print' | 'web'>('print');

  // iframe 참조
  const printIframeRef = useRef<HTMLIFrameElement>(null);
  const webIframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // 컨테이너 크기에 비례한 scale 계산 헬퍼 (A4 종이 축소 비율용)
  useEffect(() => {
    if (!htmlContent) return;

    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        // 안전 마진
        const padding = 24;
        const targetWidth = Math.max(containerWidth - padding, 200);
        const targetHeight = Math.max(containerHeight - padding, 200);
        
        // A4 표준 해상도 794 x 1123 기준
        const scaleX = targetWidth / 794;
        const scaleY = targetHeight / 1123;
        
        const scaleVal = Math.min(scaleX, scaleY);
        setPreviewScale(Math.min(scaleVal, 1.0));
      }
    };

    handleResize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof window !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [htmlContent]);

  // 1. htmlContent 변경 시 {{ Mustaches }} 필드 수집 및 detectedFields 상태 동기화
  useEffect(() => {
    if (!htmlContent) {
      setDetectedFields([]);
      return;
    }

    const regex = /\{\{([^}]+)\}\}/g;
    const fieldsSet = new Set<string>();
    let match;

    while ((match = regex.exec(htmlContent)) !== null) {
      const fieldName = match[1].trim();
      if (fieldName && !fieldName.startsWith('#') && !fieldName.startsWith('/') && !fieldName.startsWith('^') && !fieldName.startsWith('>') && !fieldName.startsWith('!')) {
        fieldsSet.add(fieldName);
      }
    }

    setDetectedFields(Array.from(fieldsSet));
  }, [htmlContent]);

  // 2. 수정 모드일 때 기존 템플릿 로드
  useEffect(() => {
    if (templateId) {
      const loadTemplate = async () => {
        try {
          const res = await fetch(`/api/templates-new?action=detail&id=${templateId}`);
          const data = await res.json();
          if (data.success && data.template) {
            setTemplateName(data.template.template_name);
            setHtmlContent(data.template.html_content);
            setWebHtmlContent(data.template.web_html_content || '');
            setIsActive(data.template.is_active === 1);
          }
        } catch (err) {
          console.error('템플릿 상세 로드 실패:', err);
        }
      };
      loadTemplate();
    }
  }, [templateId]);

  // 3. 인쇄용 iframe 프리뷰 연동
  useEffect(() => {
    if (printIframeRef.current && htmlContent) {
      const doc = printIframeRef.current.contentDocument || printIframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        const styleTag = `<style>
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 794px !important; 
            height: 1123px !important; 
            overflow: hidden !important; 
            box-sizing: border-box !important;
            background-color: #ffffff !important;
          }
          .page, .sheet, [class*="page"], [class*="sheet"] {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }
          @media print {
            html, body { 
              margin: 0 !important; 
              padding: 0 !important; 
              overflow: visible !important; 
              height: auto !important; 
            }
          }
        </style>`;
        
        let styledHtml = htmlContent;
        if (htmlContent.includes('</head>')) {
          styledHtml = htmlContent.replace('</head>', `${styleTag}</head>`);
        } else if (htmlContent.includes('</HEAD>')) {
          styledHtml = htmlContent.replace('</HEAD>', `${styleTag}</HEAD>`);
        } else {
          styledHtml = htmlContent + styleTag;
        }
        doc.write(styledHtml);
        doc.close();
      }
    }
  }, [htmlContent]);

  // 4. 웹페이지용 iframe 프리뷰 연동
  useEffect(() => {
    if (webIframeRef.current && webHtmlContent) {
      const doc = webIframeRef.current.contentDocument || webIframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        const styleTag = `<style>
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 100% !important; 
            height: 100% !important; 
            box-sizing: border-box !important;
            background-color: #f8fafc !important; /* 깔끔한 Slate 50 배경색 */
          }
        </style>`;
        
        let styledHtml = webHtmlContent;
        if (webHtmlContent.includes('</head>')) {
          styledHtml = webHtmlContent.replace('</head>', `${styleTag}</head>`);
        } else if (webHtmlContent.includes('</HEAD>')) {
          styledHtml = webHtmlContent.replace('</HEAD>', `${styleTag}</HEAD>`);
        } else {
          styledHtml = webHtmlContent + styleTag;
        }
        doc.write(styledHtml);
        doc.close();
      }
    }
  }, [webHtmlContent]);

  // 파일 업로드 처리 및 AI HTML 동시 변환 호출
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        const res = await fetch('/api/templates-new/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            filename: file.name,
            mimeType: file.type
          })
        });

        const data = await res.json();
        if (data.success) {
          setHtmlContent(data.html); // 인쇄용 HTML
          setWebHtmlContent(data.webHtml || ''); // 웹용 HTML
          setDetectedFields(data.detectedFields || []);
          if (!templateName) {
            const defaultName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            setTemplateName(`${defaultName} - AI 변환 양식`);
          }
        } else {
          alert(`양식 분석 및 HTML 변환에 실패했습니다:\n${data.error}`);
        }
        setIsUploading(false);
      };
    } catch (err: any) {
      console.error(err);
      alert(`파일 변환 오류: ${err.message}`);
      setIsUploading(false);
    }
  };

  // 디자인 수정 타겟 토글 제어 헬퍼 (최소 1개 선택 강제)
  const handleToggleTarget = (type: 'print' | 'web') => {
    if (type === 'print') {
      if (targetPrint && !targetWeb) {
        alert('디자인 수정 대상은 최소 하나 이상 선택되어야 합니다.');
        return;
      }
      setTargetPrint(!targetPrint);
    } else {
      if (!targetPrint && targetWeb) {
        alert('디자인 수정 대상은 최소 하나 이상 선택되어야 합니다.');
        return;
      }
      setTargetWeb(!targetWeb);
    }
  };

  // 자연어 피드백 기반 디자인 튜닝 적용
  const handleApplyTuning = async () => {
    if (!feedback.trim()) {
      alert('수정이나 디자인 보완을 원하는 요구사항을 입력해 주세요.');
      return;
    }
    if (!htmlContent) {
      alert('분석된 양식 HTML 코드가 존재해야 튜닝이 가능합니다. 먼저 양식 파일을 등록해 주세요.');
      return;
    }

    // 전송할 타겟 값 연산
    let targetVal: 'all' | 'print' | 'web' = 'all';
    if (targetPrint && !targetWeb) targetVal = 'print';
    else if (!targetPrint && targetWeb) targetVal = 'web';

    setIsTuning(true);
    try {
      const res = await fetch('/api/templates-new/tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: htmlContent,
          webHtml: webHtmlContent,
          feedback: feedback,
          target: targetVal
        })
      });

      const data = await res.json();
      if (data.success) {
        setHtmlContent(data.html);
        setWebHtmlContent(data.webHtml || '');
        if (data.detectedFields && data.detectedFields.length > 0) {
          setDetectedFields(data.detectedFields);
        }
        setFeedback(''); // 피드백 필드 초기화
      } else {
        alert(`디자인 튜닝 적용 실패:\n${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`AI 튜닝 통신 에러: ${err.message}`);
    } finally {
      setIsTuning(false);
    }
  };

  // 클립보드 복사 헬퍼
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(text);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // 최종 저장 제출
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('템플릿 명칭을 입력해 주세요.');
      return;
    }
    if (!htmlContent.trim()) {
      alert('등록할 HTML 양식 내용이 비어있습니다. 양식 업로드 혹은 코드를 완성해 주세요.');
      return;
    }

    try {
      const res = await fetch('/api/templates-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: templateId,
          template_name: templateName,
          document_type: '',
          html_content: htmlContent,
          web_html_content: webHtmlContent,
          is_active: isActive ? 1 : 0
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(templateId ? '양식이 성공적으로 수정되었습니다.' : '신규 AI 반응형 양식이 성공적으로 등록되었습니다.');
        onSaved();
      } else {
        alert(`양식 저장 실패: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`서버 저장 오류: ${err.message}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* 탑 네비게이션 헤더 */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3 flex-row text-left">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-left">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              {templateId ? '뉴 양식관리 AI - 양식 수정' : '뉴 양식관리 AI - 2열 듀얼 양식 제작'}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
              각 미리보기 화면 창을 직접 클릭하여 디자인 수정 대상(타겟)을 시각적으로 지정할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 text-xs font-black text-slate-400 mr-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-violet-650 focus:ring-violet-500"
            />
            양식 활성화
          </label>
          <button
            onClick={handleSaveTemplate}
            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs transition shadow-lg shadow-violet-600/10 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            최종 승인 및 저장
          </button>
        </div>
      </div>

      {/* 메인 분할 워크스페이스 */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-900">
        
        {/* 1단: 좌측 설정 및 매핑 패널 */}
        <div className="w-[340px] border-r border-slate-850 flex flex-col bg-slate-950 p-5 overflow-y-auto shrink-0 gap-6">
          
          {/* 양식 기본 설정 */}
          <div className="space-y-2 text-left">
            <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-violet-400" />
              양식명
            </h3>
            <div className="pt-1">
              <input 
                type="text"
                placeholder="예: 재직 증명서"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-violet-650 focus:outline-none text-xs text-white font-bold placeholder-slate-600 shadow-sm transition"
              />
            </div>
          </div>

          {/* AI 이미지/PDF 분석 변환 업로드 존 */}
          <div className="space-y-3.5 text-left">
            <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-violet-400" />
              양식 파일 업로드
            </h3>
            
            <div className="relative border-2 border-dashed border-slate-800 hover:border-violet-600/50 rounded-2xl p-4.5 text-center transition bg-slate-900/30 flex flex-col items-center justify-center min-h-[85px] group">
              <input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              {isUploading ? (
                <div className="space-y-1">
                  <RefreshCw className="w-5 h-5 animate-spin text-violet-500 mx-auto" />
                  <p className="text-[10px] font-extrabold text-slate-300">Gemini JSON 듀얼 변환 중...</p>
                  <p className="text-[8px] font-semibold text-slate-500">인쇄용 A4 & 모던 웹페이지 코딩 중</p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-slate-950 rounded-full text-slate-400 group-hover:text-violet-400 transition shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-normal">
                    <p className="text-[11px] font-extrabold text-slate-300">이미지 또는 PDF 드래그</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-0.5">A4 비율의 원본 양식 이미지</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI로 추출된 감지 필드 */}
          {detectedFields.length > 0 && (
            <div className="space-y-2 text-left">
              <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                감지된 바인딩 필드
              </h3>
              <p className="text-[9px] text-slate-500 font-bold leading-normal mb-1">
                아래 필드를 복사해 양식 내에 붙여넣어 활용하세요. (출력 시 AI가 매핑 테이블에서 해당 데이터들을 자동 로드합니다.)
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {detectedFields.map(f => (
                  <button
                    key={f}
                    onClick={() => copyToClipboard(`{{${f}}}`)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 hover:text-white hover:border-violet-500/30 transition cursor-pointer"
                  >
                    <span>{`{{${f}}}`}</span>
                    {copiedField === `{{${f}}}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* 2단: 중앙 / 우측 - 2열 듀얼 샌드박스 프리뷰 컨테이너 */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-900 relative">
          
          {/* 소형 화면용 모바일 탭 바 (대화면 lg 이상에서는 자동 숨김) */}
          <div className="lg:hidden flex bg-slate-950 p-1.5 border-b border-slate-850 justify-center gap-1.5 shrink-0">
            <button 
              onClick={() => setActiveTab('print')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${activeTab === 'print' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900/40'}`}
            >
              인쇄용 A4 미리보기
            </button>
            <button 
              onClick={() => setActiveTab('web')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${activeTab === 'web' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900/40'}`}
            >
              모던 웹페이지 미리보기
            </button>
          </div>

          {/* 좌우 2열 그리드 본체 */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden min-h-0">
            
            {/* 좌열: 인쇄용 A4 프리뷰 */}
            <div 
              onClick={() => handleToggleTarget('print')}
              className={`flex-1 flex flex-col min-h-0 border-r border-slate-850 cursor-pointer select-none transition-all duration-200 border-2 ${
                targetPrint 
                  ? 'border-violet-650/40 bg-violet-950/5' 
                  : 'border-transparent bg-transparent'
              } ${activeTab === 'print' ? 'flex' : 'hidden lg:flex'}`}
            >
              <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-850/60 flex items-center justify-between text-[11px] font-bold text-slate-400 shrink-0">
                <span className="flex items-center gap-1.5">
                  <Laptop className={`w-3.5 h-3.5 transition-colors ${targetPrint ? 'text-violet-400' : 'text-slate-500'}`} />
                  인쇄용 A4 미리보기 샌드박스
                </span>
                
                {/* 체크 박스 서클 */}
                <div className="flex items-center gap-2">
                  {targetPrint && (
                    <span className="text-[9px] text-violet-400 font-extrabold uppercase tracking-wider bg-violet-950/50 px-2 py-0.5 rounded border border-violet-800/30">
                      수정 대상
                    </span>
                  )}
                  <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                    targetPrint 
                      ? 'bg-violet-600 border-violet-500 text-white shadow-sm shadow-violet-600/30 scale-105' 
                      : 'border-slate-700 bg-slate-900/60 text-transparent'
                  }`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>
              
              <div 
                ref={containerRef} 
                className={`flex-1 p-4 flex items-center justify-center overflow-auto transition-opacity duration-200 ${
                  targetPrint ? 'bg-slate-950/40' : 'bg-slate-950/70 opacity-40 grayscale-[20%]'
                }`}
                style={{ minHeight: 0 }}
              >
                {htmlContent ? (
                  <div 
                    className="relative shrink-0 shadow-2xl transition-all duration-200 ease-out bg-white border border-slate-200 overflow-hidden"
                    style={{
                      width: `${794 * previewScale}px`,
                      height: `${1123 * previewScale}px`
                    }}
                  >
                    <div 
                      className="absolute left-0 top-0 overflow-hidden flex flex-col origin-top-left"
                      style={{
                        width: '794px',
                        height: '1123px',
                        transform: `scale(${previewScale})`,
                      }}
                    >
                      <iframe 
                        ref={printIframeRef}
                        title="A4 인쇄용 양식 프리뷰"
                        scrolling="no"
                        className="w-full h-full border-none pointer-events-none"
                        style={{ overflow: 'hidden', pointerEvents: 'none' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 text-slate-600 text-center space-y-3">
                    <FileCode className="w-12 h-12 text-slate-800" />
                    <div>
                      <h4 className="text-xs font-black text-slate-550">인쇄용 A4 서식이 비어 있습니다</h4>
                      <p className="text-[10px] text-slate-600 mt-1 max-w-xs leading-relaxed">
                        왼쪽 드롭존에 원본 양식을 업로드해 주세요.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 우열: 모던 웹페이지 프리뷰 */}
            <div 
              onClick={() => handleToggleTarget('web')}
              className={`flex-1 flex flex-col min-h-0 cursor-pointer select-none transition-all duration-200 border-2 ${
                targetWeb 
                  ? 'border-emerald-650/40 bg-emerald-950/5' 
                  : 'border-transparent bg-transparent'
              } ${activeTab === 'web' ? 'flex' : 'hidden lg:flex'}`}
            >
              <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-850/60 flex items-center justify-between text-[11px] font-bold text-slate-400 shrink-0">
                <span className="flex items-center gap-1.5">
                  <Globe className={`w-3.5 h-3.5 transition-colors ${targetWeb ? 'text-emerald-400' : 'text-slate-500'}`} />
                  모던 웹페이지 미리보기 샌드박스
                </span>
                
                {/* 체크 박스 서클 */}
                <div className="flex items-center gap-2">
                  {targetWeb && (
                    <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/30">
                      수정 대상
                    </span>
                  )}
                  <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                    targetWeb 
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-600/30 scale-105' 
                      : 'border-slate-700 bg-slate-900/60 text-transparent'
                  }`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>
              
              <div 
                className={`flex-1 p-4 flex items-stretch justify-stretch overflow-hidden transition-opacity duration-200 ${
                  targetWeb ? 'bg-slate-950/20' : 'bg-slate-950/70 opacity-40 grayscale-[20%]'
                }`}
                style={{ minHeight: 0 }}
              >
                {webHtmlContent ? (
                  <div className="flex-1 shadow-2xl rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex flex-col">
                    <iframe 
                      ref={webIframeRef}
                      title="모던 웹페이지 프리뷰"
                      className="w-full h-full border-none pointer-events-none"
                      style={{ pointerEvents: 'none' }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-40 text-slate-650 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-900/50">
                    <Globe className="w-12 h-12 text-slate-800" />
                    <div>
                      <h4 className="text-xs font-black text-slate-550">웹페이지 서식이 존재하지 않습니다</h4>
                      <p className="text-[10px] text-slate-600 mt-1 max-w-xs leading-relaxed">
                        AI 양식 분석 완료 시 웹디자인 관점의 HTML 코드가 이곳에 함께 서빙됩니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 하단 자연어 디자인 튜닝 컨트롤 */}
          {htmlContent && (
            <div className="p-4 bg-slate-950 border-t border-slate-850 flex flex-col gap-2.5 shrink-0 z-15">
              
              {/* 텍스트 입력창 영역 */}
              <div className="flex items-center gap-3 w-full">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder={
                      targetPrint && !targetWeb
                        ? "예: '인쇄 시 직인 영역을 5mm 아래로 이동해줘', '표의 테두리를 얇게 해줘' (인쇄용만 수정)"
                        : !targetPrint && targetWeb
                        ? "예: '카드의 그림자 크기를 줄이고, 둥글게 만들어줘', '웹 배경색을 민트톤으로 바꿀래' (웹용만 수정)"
                        : "예: '폰트를 전체적으로 Outfit으로 맞춰줘', '이름 항목에 강조색 추가해줘' (인쇄용 & 웹용 동시 수정)"
                    }
                    className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-900 border border-slate-800 focus:border-violet-650 focus:outline-none text-xs text-white placeholder-slate-550 font-bold transition shadow-inner"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleApplyTuning();
                    }}
                    disabled={isTuning}
                  />
                  <button
                    onClick={handleApplyTuning}
                    disabled={isTuning}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition cursor-pointer disabled:bg-slate-800 disabled:text-slate-600"
                    title="튜닝 적용"
                  >
                    {isTuning ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <button
                  onClick={handleApplyTuning}
                  disabled={isTuning}
                  className="flex items-center gap-1 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-violet-400 font-extrabold text-xs transition cursor-pointer disabled:bg-slate-950 disabled:text-slate-800 shrink-0"
                >
                  {isTuning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                      디자인 튜닝 적용 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      자연어 수정 요청
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
