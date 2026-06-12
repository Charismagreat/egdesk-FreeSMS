'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Sparkles, 
  Play, 
  Save, 
  Copy, 
  Check, 
  RefreshCw, 
  HelpCircle,
  Database,
  FileCode,
  Laptop,
  Search
} from 'lucide-react';

interface WebTemplateEditorProps {
  templateId?: number;
  onBack: () => void;
  onSaved: () => void;
}

interface TableHint {
  label: string;
  fields: { key: string; name: string; type: string }[];
}

export default function WebTemplateEditor({ templateId, onBack, onSaved }: WebTemplateEditorProps) {
  const [templateName, setTemplateName] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // 파일 업로드 및 변환 상태
  const [isUploading, setIsUploading] = useState(false);
  const [detectedFields, setDetectedFields] = useState<string[]>([]);
  
  // AI 피드백 튜닝 상태
  const [feedback, setFeedback] = useState('');
  const [isTuning, setIsTuning] = useState(false);
  
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // iframe 참조
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // 컨테이너 크기에 비례한 scale 계산 헬퍼
  useEffect(() => {
    if (!htmlContent) return;

    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        // 상하좌우 안전 여백 적용
        const padding = 32;
        const targetWidth = Math.max(containerWidth - padding, 200);
        const targetHeight = Math.max(containerHeight - padding, 200);
        
        // A4 표준 해상도 794 x 1123 기준
        const scaleX = targetWidth / 794;
        const scaleY = targetHeight / 1123;
        
        // 가로와 세로 비율 중 더 작게 축소되어야 하는 값을 취해 화면 밖으로 이탈을 방지
        const scaleVal = Math.min(scaleX, scaleY);
        
        // 과도한 확대 방지 및 정밀 오차 보정 적용 (최대 1.0배)
        setPreviewScale(Math.min(scaleVal, 1.0));
      }
    };

    // 최초 1회 즉시 실행
    handleResize();

    // ResizeObserver를 사용하여 컨테이너 크기 변화 정밀 감지
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

  // 1. htmlContent 변경 시 {{ Mustaches }} 필드들을 자동으로 수집하여 detectedFields 상태 갱신
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
      // Mustache 분기 헬퍼 키(#, /, ^, >, !) 등은 제외하고 순수 데이터 바인딩 변수명만 추출
      if (fieldName && !fieldName.startsWith('#') && !fieldName.startsWith('/') && !fieldName.startsWith('^') && !fieldName.startsWith('>') && !fieldName.startsWith('!')) {
        fieldsSet.add(fieldName);
      }
    }

    setDetectedFields(Array.from(fieldsSet));
  }, [htmlContent]);

  // 3. 컴포넌트 마운트 시 수정 모드인 경우 기존 템플릿 로드
  useEffect(() => {
    if (templateId) {
      const loadTemplate = async () => {
        try {
          const res = await fetch(`/api/templates-new?action=detail&id=${templateId}`);
          const data = await res.json();
          if (data.success && data.template) {
            setTemplateName(data.template.template_name);
            setHtmlContent(data.template.html_content);
            setIsActive(data.template.is_active === 1);
          }
        } catch (err) {
          console.error('템플릿 상세 로드 실패:', err);
        }
      };
      loadTemplate();
    }
  }, [templateId]);

  // htmlContent 변경 시 iframe 프리뷰 동기화
  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        // iframe 내부에서 텍스트 선택이 가능하도록 하고, A4 규격을 강제하여 오버플로우와 스크롤바를 절대 억제
        // 추가로 템플릿의 page 컨테이너가 794x1123px의 iframe 영역에 빈틈없이 100% 밀착하도록 강제
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

  // 파일 업로드 처리 및 AI HTML 변환 호출
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. 파일을 Base64로 인코딩
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        // 2. Gemini 업로드 변환 API 호출
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
          setHtmlContent(data.html);
          setDetectedFields(data.detectedFields || []);
          if (!templateName) {
            // 파일명에서 확장자를 제외한 기본 이름으로 템플릿명 추천 설정
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

  // 자연어 피드백 AI 튜닝 호출
  const handleApplyTuning = async () => {
    if (!feedback.trim()) {
      alert('수정이나 디자인 보완을 원하는 요구사항을 입력해 주세요.');
      return;
    }
    if (!htmlContent) {
      alert('분석된 양식 HTML 코드가 존재해야 튜닝이 가능합니다. 먼저 양식 이미지/PDF 파일을 등록해 주세요.');
      return;
    }

    setIsTuning(true);
    try {
      const res = await fetch('/api/templates-new/tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: htmlContent,
          feedback: feedback
        })
      });

      const data = await res.json();
      if (data.success) {
        setHtmlContent(data.html);
        if (data.detectedFields && data.detectedFields.length > 0) {
          setDetectedFields(data.detectedFields);
        }
        setFeedback(''); // 피드백 창 비우기
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



  // 클립보드에 필드명 복사 헬퍼
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
          document_type: '', // 더 이상 템플릿 정보에 수동 매핑 필요 없음 (AI 동적 자동 처리)
          html_content: htmlContent,
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
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              {templateId ? '뉴 양식관리 AI - 양식 수정' : '뉴 양식관리 AI - 신규 웹 양식 제작'}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
              이미지/PDF를 기반으로 AI가 반응형 A4 문서를 빌드하고 자연어로 완성도를 높입니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 text-xs font-black text-slate-400 mr-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-violet-600 focus:ring-violet-500"
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

      {/* 메인 3단 워크스페이스 분할 레이아웃 */}
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
                  <p className="text-[10px] font-extrabold text-slate-300">Gemini Flash 분석 및 HTML 변환 중...</p>
                  <p className="text-[8px] font-semibold text-slate-500">A4 레이아웃 구축 및 필드 감지 중</p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-slate-950 rounded-full text-slate-400 group-hover:text-violet-400 transition shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-normal">
                    <p className="text-[11px] font-extrabold text-slate-300">이미지 또는 PDF 드래그</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-0.5">A4 비율의 증명서, 명세서 등</p>
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
                아래 키들을 클릭하여 복사한 뒤 양식 HTML 내에 붙여넣어 활용하세요. (인쇄 시 AI가 이 변수들을 탐색해 DB와 자동 연동합니다.)
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

        {/* 2단: 중앙 / 우측 - 실시간 샌드박스 프리뷰 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-900 relative">
          
          {/* 에디터 프리뷰 탭 표시 */}
          <div className="px-5 py-2 bg-slate-900 border-b border-slate-850 flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5 font-bold">
              <Laptop className="w-3.5 h-3.5" />
              반응형 A4 프리뷰 샌드박스
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
              A4 비율 (A4 Portrait)
            </span>
          </div>

          {/* 프리뷰 본체 */}
          <div 
            ref={containerRef} 
            className="flex-1 bg-slate-950/40 p-4 flex items-center justify-center overflow-auto select-none"
            style={{ minHeight: 0 }}
          >
            {htmlContent ? (
              /* 격리형 스케일드 프리뷰 박스 (래퍼): 스케일된 크기만큼의 물리적 크기를 점유하여 정중앙 정렬 보장 */
              <div 
                className="relative shrink-0 shadow-2xl transition-all duration-200 ease-out bg-white border border-slate-200 overflow-hidden"
                style={{
                  width: `${794 * previewScale}px`,
                  height: `${1123 * previewScale}px`
                }}
              >
                {/* A4 용지 캔버스: 794x1123 고정 비율 유지 및 절대좌표 scale 변환 */}
                <div 
                  className="absolute left-0 top-0 overflow-hidden flex flex-col origin-top-left"
                  style={{
                    width: '794px',
                    height: '1123px',
                    transform: `scale(${previewScale})`,
                  }}
                >
                  <iframe 
                    ref={iframeRef}
                    title="A4 양식 프리뷰"
                    scrolling="no"
                    className="w-full h-full border-none pointer-events-none"
                    style={{ overflow: 'hidden', pointerEvents: 'none' }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 text-slate-500 text-center space-y-4">
                <FileCode className="w-16 h-16 text-slate-700" />
                <div>
                  <h4 className="text-sm font-black text-slate-400">프리뷰할 양식이 존재하지 않습니다</h4>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                    왼쪽 패널에서 기존 양식 이미지나 PDF 파일을 업로드하면 AI가 구조화된 HTML A4 웹 양식으로 변환하여 여기에 렌더링합니다.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 하단 자연어 디자인 튜닝 컨트롤 */}
          {htmlContent && (
            <div className="p-4 bg-slate-950 border-t border-slate-850 flex items-center gap-3 shrink-0">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="예: '하단에 서명인 대표이사 홍길동 칸을 만들어줘', '글자 폰트를 전체적으로 더 부드럽게 해줘', '표의 테두리를 연하게 해줘'"
                  className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-900 border border-slate-800 focus:border-violet-600 focus:outline-none text-xs text-white placeholder-slate-500 font-bold transition shadow-inner"
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
                    디자인 다듬는 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    자연어 수정 요청
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
