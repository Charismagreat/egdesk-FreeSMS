'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Plus, 
  Trash2, 
  Save, 
  Maximize2, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

// 바인딩 가능한 필드 리스트 정의
export const FIELD_DEFINITIONS = [
  // 공통 양식 요소
  { key: 'common_date', label: '일자 (달력 선택)', category: '공통 양식 요소' },
  { key: 'common_input', label: '입력 박스 (텍스트 기입)', category: '공통 양식 요소' },
  { key: 'common_stamp', label: '도장 (회사 직인 오버레이)', category: '공통 양식 요소' },
  { key: 'common_tag', label: '태그 (보관용/제출용 선택)', category: '공통 양식 요소' },

  // 기존 DB 필드
  { key: 'estimate_id', label: '견적번호', category: '견적 마스터' },
  { key: 'partner_name', label: '수신처(거래처 상호)', category: '견적 마스터' },
  { key: 'partner_phone', label: '수신처 연락처', category: '견적 마스터' },
  { key: 'total_amount', label: '총 견적합계 금액 (원)', category: '견적 마스터' },
  { key: 'total_amount_krw', label: '총 견적합계 한글 표기', category: '견적 마스터' },
  { key: 'created_at_date', label: '견적일자 (YYYY-MM-DD)', category: '견적 마스터' },
  { key: 'created_at_year', label: '견적일자 (년)', category: '견적 마스터' },
  { key: 'created_at_month', label: '견적일자 (월)', category: '견적 마스터' },
  { key: 'created_at_day', label: '견적일자 (일)', category: '견적 마스터' },
  { key: 'company_name', label: '공급자(자사 상호)', category: '자사 정보' },
  { key: 'company_biz_num', label: '공급자 사업자번호', category: '자사 정보' },
  { key: 'company_owner', label: '공급자 대표자명', category: '자사 정보' },
  { key: 'company_address', label: '공급자 주소', category: '자사 정보' },
  { key: 'company_phone', label: '공급자 연락처', category: '자사 정보' },
  { key: 'estimate_items_table', label: '품목 상세 내역 테이블 (표)', category: '품목 상세(특수)' }
];

interface MappingItem {
  id?: number;
  field_key: string;
  field_label: string;
  pos_x: number; // 퍼센트 좌표 (0 ~ 100)
  pos_y: number; // 퍼센트 좌표 (0 ~ 100)
  font_size: number;
  font_weight: string; // 'normal' | 'bold'
  text_align: string; // 'left' | 'center' | 'right'
}

interface FormTemplateEditorProps {
  templateId?: number; // 수정 시 전달받는 ID
  onBack: () => void;
  onSaved: () => void;
}

export default function FormTemplateEditor({ templateId, onBack, onSaved }: FormTemplateEditorProps) {
  const [templateName, setTemplateName] = useState('');
  const [documentType, setDocumentType] = useState('crm_estimates');
  const [filePath, setFilePath] = useState('');
  const [orientation, setOrientation] = useState('portrait');
  const [isActive, setIsActive] = useState(true);
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [selectedMappingId, setSelectedMappingId] = useState<number | null>(null);
  
  // 업로드 진행상태 & 로딩
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // AI 자동 매핑용 상태 및 DB 물리 테이블 동적 수집 훅
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [availableTables, setAvailableTables] = useState<{ name: string; displayName: string; count: any }[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawFileBase64, setRawFileBase64] = useState<string>('');
  const [uploadFilename, setUploadFilename] = useState<string>('');

  // 물리 테이블 목록 동적 API 연동
  useEffect(() => {
    async function fetchDBTables() {
      setTablesLoading(true);
      try {
        const res = await fetch('/api/db?action=list');
        const data = await res.json();
        if (data.success && data.tables) {
          setAvailableTables(data.tables);
          // 기본값: 전체 테이블 자동 선택
          setSelectedTables(data.tables.map((t: any) => t.name));
        } else {
          // 폴백 데이터
          const fallback = [
            { name: 'crm_estimates', displayName: '견적서 대장', count: 0 },
            { name: 'rnd_staffs', displayName: '연구원 대장', count: 0 },
            { name: 'crm_customers', displayName: '고객 명단', count: 0 },
            { name: 'crm_orders', displayName: '주문 내역', count: 0 }
          ];
          setAvailableTables(fallback);
          setSelectedTables(fallback.map(t => t.name));
        }
      } catch (err) {
        console.error('테이블 목록 조회 실패:', err);
        const fallback = [
          { name: 'crm_estimates', displayName: '견적서 대장', count: 0 },
          { name: 'rnd_staffs', displayName: '연구원 대장', count: 0 },
          { name: 'crm_customers', displayName: '고객 명단', count: 0 },
          { name: 'crm_orders', displayName: '주문 내역', count: 0 }
        ];
        setAvailableTables(fallback);
        setSelectedTables(fallback.map(t => t.name));
      } finally {
        setTablesLoading(false);
      }
    }
    fetchDBTables();
  }, []);
  
  // 드래그 상태 관리
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<{ index: number; startX: number; startY: number; startLeft: number; startTop: number } | null>(null);

  // 임시 세션 드래프트 복원 관련 상태
  const [draftData, setDraftData] = useState<any>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const isInitialLoadRef = useRef(true);

  // 1) 마운트 완료 시 임시 저장본(Draft) 확인
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('egdesk_form_editor_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        // 현재 열려있는 templateId와 일치하는 드래프트가 있거나, 둘 다 신규인 경우
        if (parsed.templateId === templateId) {
          setDraftData(parsed);
          setShowDraftBanner(true);
        }
      }
    } catch (e) {
      console.error('드래프트 확인 실패:', e);
    }
  }, [templateId]);

  // 2) 실시간 자동 저장 (로딩 완료 후에만 동작)
  useEffect(() => {
    if (loading) return; // 로딩 중에는 저장 차단

    // 최초 마운트 후 첫 변경 전까지는 자동 저장 스킵하여 덮어쓰기 방지
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    try {
      const draft = {
        templateId,
        templateName,
        documentType,
        filePath,
        orientation,
        isActive,
        mappings
      };
      // 최소한의 의미 있는 값이 입력되었을 때만 세션 임시 보관
      if (filePath || templateName || mappings.length > 0) {
        localStorage.setItem('egdesk_form_editor_draft', JSON.stringify(draft));
      }
    } catch (e) {
      console.error('드래프트 자동 저장 실패:', e);
    }
  }, [loading, templateId, templateName, documentType, filePath, orientation, isActive, mappings]);

  // 3) 드래프트 복원 및 무시(삭제) 핸들러
  const handleRestoreDraft = () => {
    if (!draftData) return;
    setTemplateName(draftData.templateName || '');
    setDocumentType(draftData.documentType || 'crm_estimates');
    setFilePath(draftData.filePath || '');
    setOrientation(draftData.orientation || 'portrait');
    setIsActive(draftData.isActive !== false);
    setMappings(draftData.mappings || []);
    if (draftData.mappings && draftData.mappings.length > 0) {
      setSelectedMappingId(draftData.mappings[0].id || null);
    }
    setShowDraftBanner(false);
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem('egdesk_form_editor_draft');
    } catch (e) {
      console.error('드래프트 삭제 실패:', e);
    }
    setShowDraftBanner(false);
    setDraftData(null);
  };

  // URL -> Base64 헬퍼 함수
  const urlToBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleToggleTable = (tableKey: string) => {
    setSelectedTables(prev => 
      prev.includes(tableKey) 
        ? prev.filter(t => t !== tableKey) 
        : [...prev, tableKey]
    );
  };

  const handleAutoMappingByAI = async () => {
    if (!filePath) return;
    setIsAnalyzing(true);

    try {
      let base64Data = rawFileBase64;
      if (!base64Data) {
        try {
          base64Data = await urlToBase64(filePath);
        } catch (err) {
          console.error('URL Base64 변환 실패:', err);
        }
      }

      if (!base64Data) {
        alert('양식 이미지의 Base64 데이터를 추출할 수 없습니다. 파일을 다시 업로드해 주세요.');
        setIsAnalyzing(false);
        return;
      }

      const res = await fetch('/api/templates/auto-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          filename: uploadFilename || filePath.split('/').pop(),
          selectedTables
        })
      });

      const data = await res.json();
      if (data.success) {
        setDocumentType(data.suggested_document_type);
        
        const generatedMappings = data.mappings.map((m: any, idx: number) => ({
          id: Date.now() + idx,
          field_key: m.field_key,
          field_label: m.field_label,
          pos_x: m.pos_x,
          pos_y: m.pos_y,
          font_size: m.field_key === 'estimate_items_table' ? 11 : 13,
          font_weight: 'bold',
          text_align: m.field_key === 'estimate_items_table' || m.field_key === 'company_address' ? 'left' : 'center'
        }));
        
        setMappings(generatedMappings);
        if (generatedMappings.length > 0) {
          setSelectedMappingId(generatedMappings[0].id);
        }
        
        alert(`AI 분석 완료! 신뢰도(${(data.confidence_score * 100).toFixed(0)}%)\n배경 서식을 분석하여 '${data.suggested_document_type}' 데이터 소스에 맞춘 ${generatedMappings.length}개 필드를 자동 배치하였습니다.`);
      } else {
        alert(`AI 자동 매핑 분석 실패: ${data.error}`);
      }
    } catch (e: any) {
      console.error(e);
      alert('AI 분석 통신 중 에러가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 템플릿 수정 시 기존 정보 로드
  useEffect(() => {
    if (templateId) {
      loadTemplateData(templateId);
    }
  }, [templateId]);

  const loadTemplateData = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates?action=detail&id=${id}`);
      const data = await res.json();
      if (data.success) {
        const { template, mappings: loadedMappings } = data;
        setTemplateName(template.template_name);
        setDocumentType(template.document_type);
        setFilePath(template.file_path);
        setOrientation(template.orientation || 'portrait');
        setIsActive(template.is_active === 1);
        
        // mappings에 클라이언트 식별용 고유 임시 ID(idx) 부여
        const formattedMappings = loadedMappings.map((m: any, idx: number) => ({
          ...m,
          id: idx // 드래그 앤 드롭 및 선택 처리를 위한 임시 key
        }));
        setMappings(formattedMappings);
      } else {
        alert(`템플릿 조회 실패: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('템플릿 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 이미지 파일 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFilename(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setRawFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch('/api/templates/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setFilePath(data.url);
        // 파일 이름을 템플릿명 디폴트로 설정 (비어있을 때만)
        if (!templateName) {
          setTemplateName(data.filename.split('.')[0] + ' 양식');
        }
      } else {
        alert(`업로드 실패: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('이미지 업로드 처리 도중 서버 통신 에러가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 캔버스에 맵핑 항목 추가
  const handleAddField = (fieldKey: string) => {
    const fieldDef = FIELD_DEFINITIONS.find(f => f.key === fieldKey);
    if (!fieldDef) return;

    // 중복 추가 방지
    if (mappings.some(m => m.field_key === fieldKey)) {
      alert('이미 추가된 필드입니다.');
      return;
    }

    const newItem: MappingItem = {
      id: Date.now(), // 고유 식별자
      field_key: fieldKey,
      field_label: fieldDef.label,
      pos_x: 50, // 초기 퍼센트 좌표 (A4 중앙)
      pos_y: 50,
      font_size: fieldKey === 'estimate_items_table' ? 11 : 13,
      font_weight: 'normal',
      text_align: 'left'
    };

    setMappings([...mappings, newItem]);
    setSelectedMappingId(newItem.id!);
  };

  // 선택한 매핑 삭제
  const handleRemoveField = (id: number) => {
    setMappings(mappings.filter(m => m.id !== id));
    if (selectedMappingId === id) {
      setSelectedMappingId(null);
    }
  };

  // 드래그 시작 이벤트
  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const mapping = mappings[index];
    setSelectedMappingId(mapping.id!);

    const rect = canvasRef.current.getBoundingClientRect();
    
    // 현재 픽셀 위치 구하기
    const leftPx = (mapping.pos_x / 100) * rect.width;
    const topPx = (mapping.pos_y / 100) * rect.height;

    dragItemRef.current = {
      index,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: leftPx,
      startTop: topPx
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 드래그 이동 중 이벤트
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragItemRef.current || !canvasRef.current) return;

    const { index, startX, startY, startLeft, startTop } = dragItemRef.current;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // 마우스 이동 거리 계산
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // 새로운 픽셀 위치 (캔버스 내 바운더리 체크)
    let newLeftPx = startLeft + deltaX;
    let newTopPx = startTop + deltaY;

    // 0 ~ 캔버스 가로/세로 제한
    newLeftPx = Math.max(0, Math.min(newLeftPx, canvasRect.width));
    newTopPx = Math.max(0, Math.min(newTopPx, canvasRect.height));

    // 퍼센트 좌표로 재환산 및 안전 캔버스 경계 마진(2% ~ 98%) 가드 적용
    const newPosX = Math.max(2, Math.min(parseFloat(((newLeftPx / canvasRect.width) * 100).toFixed(2)), 98));
    const newPosY = Math.max(2, Math.min(parseFloat(((newTopPx / canvasRect.height) * 100).toFixed(2)), 98));

    setMappings(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        pos_x: newPosX,
        pos_y: newPosY
      };
      return updated;
    });
  };

  // 드래그 끝 이벤트
  const handleMouseUp = () => {
    dragItemRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // 특정 맵핑 아이템의 상세 속성 변경
  const updateSelectedProperty = (key: keyof MappingItem, value: any) => {
    if (selectedMappingId === null) return;
    setMappings(prev => 
      prev.map(m => m.id === selectedMappingId ? { ...m, [key]: value } : m)
    );
  };

  // 템플릿 최종 보관/서버 전송
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('템플릿 이름을 입력해주세요.');
      return;
    }
    if (!filePath) {
      alert('A4 양식 이미지 파일을 먼저 업로드해주세요.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: templateId, // 수정 시 존재
        template_name: templateName,
        document_type: documentType,
        file_path: filePath,
        orientation,
        is_active: isActive ? 1 : 0,
        mappings: mappings.map(m => ({
          field_key: m.field_key,
          field_label: m.field_label,
          pos_x: m.pos_x,
          pos_y: m.pos_y,
          font_size: m.font_size,
          font_weight: m.font_weight,
          text_align: m.text_align
        }))
      };

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        alert(templateId ? '템플릿이 성공적으로 수정되었습니다!' : '새 양식 템플릿이 안전하게 등록되었습니다!');
        try {
          localStorage.removeItem('egdesk_form_editor_draft'); // 최종 저장 성공 시 임시 드래프트 파기
        } catch (e) {
          console.error(e);
        }
        onSaved();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('템플릿을 저장하는 도중 네트워크 통신 에러가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const selectedMapping = mappings.find(m => m.id === selectedMappingId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <RefreshCw className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
        <p className="text-base font-bold text-slate-700">템플릿 설정 정보를 로드하고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-white text-slate-800 border border-slate-100 rounded-3xl shadow-sm overflow-hidden min-h-[85vh]">
      
      {/* 1. 상단 바 */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-slate-600 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2 text-slate-800">
              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
              {templateId ? 'A4 양식 좌표 매핑 에디터' : '신규 A4 양식 등록 및 매핑'}
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">양식 배경 이미지 위로 데이터 필드를 마우스 드래그하여 좌표를 매핑하십시오.</p>
          </div>
        </div>

        <button
          onClick={handleSaveTemplate}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? '저장 중...' : '매핑 설정 저장'}
        </button>
      </div>

      {/* 임시 드래프트 복원 배너 */}
      {showDraftBanner && draftData && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-3.5 flex items-center justify-between gap-4 animate-fade-in no-print">
          <div className="flex items-center gap-2.5 text-left">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-black text-indigo-900">이전에 작성 중이던 임시 저장된 양식 매핑 내역이 있습니다.</p>
              <p className="text-[10px] text-indigo-700/80 font-bold mt-0.5">
                (보관 유형: {templateId ? '기존 템플릿 수정 중' : '신규 양식 등록 중'} | 매핑 필드 {draftData.mappings?.length || 0}개)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreDraft}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black shadow-sm transition cursor-pointer"
            >
              임시본 복원하기
            </button>
            <button
              onClick={handleDiscardDraft}
              className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold transition cursor-pointer"
            >
              새로 시작 (삭제)
            </button>
          </div>
        </div>
      )}

      {/* 2. 메인 워크스페이스 (좌우 분할) */}
      <div className="flex flex-1 flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* 좌측 컨트롤 패널 */}
        <div className="w-full md:w-[380px] p-6 border-r border-slate-100 bg-slate-50/50 overflow-y-auto flex flex-col gap-6">
          
          {/* 기본 양식 메타 정보 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-800 border-l-4 border-indigo-600 pl-2">양식 기본 정보</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500">양식 템플릿명</label>
              <input 
                type="text" 
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="예: (주)쿠스 공식 견적서 양식"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-600 focus:outline-none text-xs font-semibold transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500">데이터 소스</label>
                <select 
                  value={documentType}
                  onChange={e => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                >
                  {availableTables.length === 0 ? (
                    <option value="crm_estimates">견적서 (crm_estimates)</option>
                  ) : (
                    availableTables.map(table => (
                      <option key={table.name} value={table.name}>
                        {table.displayName} ({table.name})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500">인쇄 방향</label>
                <select 
                  value={orientation}
                  onChange={e => setOrientation(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                >
                  <option value="portrait">세로형 (Portrait)</option>
                  <option value="landscape" disabled>가로형 (준비중)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-250 border-slate-200">
              <span className="text-xs font-bold text-slate-700">사용 여부 (활성화)</span>
              <input 
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300"
              />
            </div>
          </div>

          {/* 배경 이미지 업로드 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-800 border-l-4 border-indigo-600 pl-2">배경 양식 파일</h3>
            
            {!filePath ? (
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-600/50 rounded-2xl p-6 transition flex flex-col items-center justify-center bg-white text-center shadow-sm">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">A4 원본 이미지 양식 업로드</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1">PNG, JPG 이미지 권장 (최대 10MB)</span>
                {uploading && (
                  <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                    <span className="text-xs font-bold text-slate-600">업로드 중...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 max-h-[140px] shadow-sm">
                  <img 
                    src={filePath} 
                    alt="양식 템플릿" 
                    className="w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button 
                      onClick={() => setFilePath('')}
                      className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 양식 교체
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{filePath}</p>
              </div>
            )}
          </div>

          {/* AI 자동 매핑 관제 */}
          {filePath && (
            <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/50 flex flex-col gap-4 shadow-sm text-left relative overflow-hidden">
              <div className="absolute top-[-50px] right-[-50px] w-24 h-24 rounded-full bg-indigo-200/20 blur-xl pointer-events-none"></div>
              
              <div className="flex items-center gap-2 border-b border-indigo-100/50 pb-2">
                <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                <h3 className="text-xs font-black text-indigo-955">AI 자율 매핑 파일럿</h3>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-indigo-900/85">분석 대상 DB 테이블 (멀티 선택)</label>
                <div className="max-h-[160px] overflow-y-auto pr-1 bg-white/60 p-2 rounded-xl border border-indigo-100/30 flex flex-col gap-1.5 scrollbar-thin">
                  {tablesLoading ? (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-650 mb-1" />
                      <span className="text-[9px] font-semibold">테이블 목록 로딩 중...</span>
                    </div>
                  ) : availableTables.length === 0 ? (
                    <span className="text-[10px] text-slate-400 text-center py-4 font-bold">조회된 테이블이 없습니다.</span>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {availableTables.map(table => {
                        const isChecked = selectedTables.includes(table.name);
                        return (
                          <label 
                            key={table.name} 
                            title={`${table.displayName} (${table.name})`}
                            className={`flex items-center justify-between gap-1.5 p-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition-all min-w-0 ${
                              isChecked 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleTable(table.name)}
                              className="hidden"
                            />
                            <div className="flex flex-col min-w-0 text-left">
                              <span className="truncate block leading-tight">{table.displayName}</span>
                              <span className={`text-[8px] font-mono truncate block leading-none mt-0.5 ${isChecked ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {table.name}
                              </span>
                            </div>
                            {table.count !== undefined && table.count !== 'Error' && table.count > 0 && (
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full shrink-0 font-bold leading-none ${
                                isChecked ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {table.count}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAutoMappingByAI}
                disabled={isAnalyzing || selectedTables.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-2 disabled:opacity-50 hover:scale-102 active:scale-98 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI가 서식 파싱 및 매핑 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI 1초 자동 매핑 실행</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 오버레이 필드 선택기 */}
          {filePath && (
            <div className="flex flex-col gap-4 flex-1">
              <h3 className="text-xs font-black text-slate-800 border-l-4 border-indigo-600 pl-2">오버레이 필드 삽입</h3>
              
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {['공통 양식 요소', '견적 마스터', '자사 정보', '품목 상세(특수)'].map(cat => {
                  const items = FIELD_DEFINITIONS.filter(f => f.category === cat);
                  return (
                    <div key={cat} className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{cat}</span>
                      <div className="grid grid-cols-1 gap-1">
                        {items.map(field => {
                          const isAdded = mappings.some(m => m.field_key === field.key);
                          return (
                            <button
                              key={field.key}
                              onClick={() => handleAddField(field.key)}
                              disabled={isAdded}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition cursor-pointer ${
                                isAdded 
                                ? 'bg-slate-100 text-slate-350 text-slate-400 cursor-not-allowed border border-transparent'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
                              }`}
                            >
                              <span className="font-bold">{field.label}</span>
                              <Plus className={`w-3.5 h-3.5 ${isAdded ? 'text-slate-300' : 'text-indigo-650'}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 특정 필드 포맷 제어 패널 */}
          {selectedMapping && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-indigo-600 flex items-center gap-1.5">
                  <Type className="w-4 h-4" />
                  {selectedMapping.field_label} 설정
                </span>
                <button 
                  onClick={() => handleRemoveField(selectedMapping.id!)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="필드 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 폰트 사이즈 조절 */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">글자 크기</span>
                <div className="flex items-center gap-1.5">
                  <input 
                    type="number"
                    value={selectedMapping.font_size}
                    onChange={e => updateSelectedProperty('font_size', parseInt(e.target.value) || 11)}
                    className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-400">px</span>
                </div>
              </div>

              {/* 글꼴 굵기 */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">글자 두께</span>
                <button
                  onClick={() => updateSelectedProperty('font_weight', selectedMapping.font_weight === 'bold' ? 'normal' : 'bold')}
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                    selectedMapping.font_weight === 'bold'
                    ? 'bg-indigo-55 bg-indigo-50 border-indigo-200 text-indigo-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <Bold className="w-3.5 h-3.5 inline mr-1" /> Bold
                </button>
              </div>

              {/* 정렬 방향 */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-600">글자 정렬</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-200">
                  {[
                    { val: 'left', icon: AlignLeft },
                    { val: 'center', icon: AlignCenter },
                    { val: 'right', icon: AlignRight }
                  ].map(align => (
                    <button
                      key={align.val}
                      onClick={() => updateSelectedProperty('text_align', align.val)}
                      className={`py-1.5 rounded-lg text-xs flex justify-center items-center transition cursor-pointer ${
                        selectedMapping.text_align === align.val
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <align.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 좌표 직접 수치 입력 패널 (겹쳤을 때 구출용) */}
              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[10px] font-extrabold text-slate-500">X 좌표 (%)</span>
                  <input 
                    type="number"
                    min={2}
                    max={98}
                    step={0.5}
                    value={selectedMapping.pos_x ?? ''}
                    onChange={e => updateSelectedProperty('pos_x', Math.max(2, Math.min(parseFloat(e.target.value) || 2, 98)))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[10px] font-extrabold text-slate-500">Y 좌표 (%)</span>
                  <input 
                    type="number"
                    min={2}
                    max={98}
                    step={0.5}
                    value={selectedMapping.pos_y ?? ''}
                    onChange={e => updateSelectedProperty('pos_y', Math.max(2, Math.min(parseFloat(e.target.value) || 2, 98)))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="text-[10px] font-bold text-slate-400 text-right">
                좌표: X({selectedMapping.pos_x}%), Y({selectedMapping.pos_y}%)
              </div>
            </div>
          )}

          {/* 배치 완료된 필드 목록 (중첩 및 쏠림 구출 선택기) */}
          {filePath && mappings.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-l-4 border-indigo-600 pl-2">
                <h3 className="text-xs font-black text-slate-800">배치 완료 필드 ({mappings.length})</h3>
                {selectedMappingId && (
                  <button 
                    onClick={() => setSelectedMappingId(null)}
                    className="text-[9px] font-bold text-slate-400 hover:text-indigo-600 transition"
                  >
                    선택 해제
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                {mappings.map(mapping => {
                  const isSelected = mapping.id === selectedMappingId;
                  return (
                    <button
                      key={mapping.id}
                      onClick={() => setSelectedMappingId(mapping.id!)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                        isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{mapping.field_label}</span>
                      <span className={`text-[9px] font-mono shrink-0 px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-indigo-500 text-indigo-100' : 'bg-slate-100 text-slate-400'
                      }`}>
                        X:{mapping.pos_x}% | Y:{mapping.pos_y}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* 우측 도화지(A4 캔버스) 영역 */}
        <div className="flex-1 p-8 bg-slate-100/50 overflow-y-auto flex justify-center items-start min-w-0 shadow-inner">
          {!filePath ? (
            <div className="flex flex-col items-center justify-center max-w-md mt-24 text-center">
              <Upload className="w-16 h-16 text-slate-300 animate-bounce mb-4" />
              <h3 className="text-lg font-black text-slate-800 mb-1">A4 양식 이미지 없음</h3>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                왼쪽 메뉴에서 사내에서 사용하는 공식 A4 인쇄용 배경 이미지 파일(JPG, PNG)을 먼저 업로드해 주십시오. 
                그 후 각 텍스트 데이터의 위치를 설정할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                배치된 필드를 마우스로 드래그하여 원하는 위치에 고정시키십시오.
              </span>
              
              {/* A4 실비율(가로세로 1:1.414) 도화지 컨테이너 */}
              <div 
                ref={canvasRef}
                id="template-canvas"
                style={{ 
                  backgroundImage: `url(${filePath})`,
                  backgroundSize: '100% 100%'
                }}
                className="relative bg-white shadow-2xl rounded-sm border border-slate-300 aspect-[1/1.414] w-[540px] md:w-[600px] select-none overflow-hidden"
              >
                
                {/* 매핑 리스트 오버레이 */}
                {mappings.map((mapping, idx) => {
                  const isSelected = mapping.id === selectedMappingId;
                  const isTable = mapping.field_key === 'estimate_items_table';
                  
                  return (
                    <div
                      key={mapping.id}
                      onMouseDown={(e) => handleMouseDown(e, idx)}
                      style={{
                        position: 'absolute',
                        left: `${mapping.pos_x}%`,
                        top: `${mapping.pos_y}%`,
                        transform: 'translate(-50%, -50%)', // 센터 중심 정렬
                        fontSize: `${mapping.font_size}px`,
                        fontWeight: mapping.font_weight as any,
                        textAlign: mapping.text_align as any,
                        cursor: 'move',
                        whiteSpace: isTable ? 'normal' : 'nowrap',
                        width: isTable ? '450px' : 'auto'
                      }}
                      className={`px-2 py-1 rounded transition text-slate-900 border ${
                        isSelected 
                        ? 'bg-indigo-50/95 border-indigo-500 ring-2 ring-indigo-500 shadow-md z-30'
                        : 'bg-white/95 border-slate-300 hover:border-slate-400 shadow-sm z-20'
                      }`}
                    >
                      {isTable ? (
                        <div className="w-full flex flex-col pointer-events-none text-[10px] text-slate-700">
                          <span className="bg-slate-100 py-1 font-bold text-center border-b border-slate-200 block mb-1 text-slate-800">
                            📊 [특수] 품목 상세 리스트 출력 영역 (예시)
                          </span>
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                                <th className="p-0.5 border-r border-slate-200">순번</th>
                                <th className="p-0.5 border-r border-slate-200">품목명</th>
                                <th className="p-0.5 border-r border-slate-200">수량</th>
                                <th className="p-0.5 border-r border-slate-200">단가</th>
                                <th className="p-0.5">금액</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="p-0.5 border-r border-slate-200 text-center">1</td>
                                <td className="p-0.5 border-r border-slate-200">A4용지 백상지 75g</td>
                                <td className="p-0.5 border-r border-slate-200 text-center">10</td>
                                <td className="p-0.5 border-r border-slate-200 text-right">3,500</td>
                                <td className="p-0.5 text-right font-bold">35,000</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <span className="pointer-events-none flex items-center gap-1.5 font-bold text-slate-800">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                          {mapping.field_label}
                        </span>
                      )}
                    </div>
                  );
                })}

              </div>
            </div>
          )}
        </div>

      </div>
      
    </div>
  );
}
