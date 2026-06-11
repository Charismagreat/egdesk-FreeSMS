'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  RefreshCw,
  Copy
} from 'lucide-react';

// (참고) 고정 매핑 필드 대신, 사용자가 데이터 소스 선택 시 해당 테이블의 스키마 및 SQL 분석을 통해 매핑 필드를 동적으로 자동 구성합니다.


// SQL 쿼리문으로부터 컬럼명들을 추출하는 유틸리티
const parseColumnsFromQuery = (sql: string): string[] => {
  if (!sql) return [];
  const selectMatch = sql.match(/select\s+(.+?)\s+from/i);
  if (!selectMatch) return [];
  const selectClause = selectMatch[1];
  if (selectClause.trim() === '*') {
    return [];
  }
  return selectClause
    .split(',')
    .map(col => {
      const parts = col.trim().split(/\s+as\s+/i);
      const colName = parts[parts.length - 1].trim().split('.').pop() || '';
      return colName.replace(/[`"']/g, '');
    })
    .filter(name => name && !/^[0-9]+$/.test(name));
};

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
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [templateName, setTemplateName] = useState('');
  const [documentType, setDocumentType] = useState('');
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

  // 동적 SQL 및 파라미터 정의 상태
  const [querySql, setQuerySql] = useState('');
  const [queryParams, setQueryParams] = useState('[]');
  const [bindingFields, setBindingFields] = useState<any[]>([]);

  // AI 추천 테이블 및 백그라운드 판독용 상태 추가
  const [aiRecommendedTable, setAiRecommendedTable] = useState<{ name: string; displayName: string; confidence: number } | null>(null);
  const [aiRecommendedTables, setAiRecommendedTables] = useState<{ name: string; displayName: string; confidence: number; count?: any; reason?: string }[]>([]);
  const [aiRecommendedData, setAiRecommendedData] = useState<any>(null);
  const [isRecommending, setIsRecommending] = useState(false);

  // A4 양식 이미지 업로드 감지 시 백그라운드로 AI 테이블 추천 및 좌표 매핑 분석 작동
  useEffect(() => {
    if (!filePath) {
      setAiRecommendedTable(null);
      setAiRecommendedTables([]);
      setAiRecommendedData(null);
      return;
    }
    
    // 기존 템플릿 수정 중일 때는 백그라운드 추천 스킵
    if (templateId) return;

    const runBackgroundRecommendation = async () => {
      setIsRecommending(true);
      try {
        let base64Data = rawFileBase64;
        if (!base64Data) {
          try {
            base64Data = await urlToBase64(filePath);
          } catch (err) {
            console.error('URL Base64 변환 실패:', err);
          }
        }

        if (!base64Data) return;

        // 전체 가용 테이블 목록을 기반으로 AI 추천 파싱 구동
        const res = await fetch('/api/templates/auto-map', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            filename: uploadFilename || filePath.split('/').pop(),
            selectedTables: availableTables.map(t => t.name)
          })
        });

        const data = await res.json();
        if (data.success) {
          // 추천된 테이블 후보군에 count 레코드 개수 정보 매핑
          const suggestedList = (data.suggested_tables || []).map((t: any) => {
            const matchedAv = availableTables.find(av => av.name === t.name);
            return {
              name: t.name,
              displayName: t.displayName || matchedAv?.displayName || t.name,
              confidence: t.confidence || 0.9,
              count: matchedAv?.count,
              reason: t.reason
            };
          });

          setAiRecommendedTables(suggestedList);
          // 기본 선택값: AI가 추천한 테이블 목록만 선택되도록 설정
          setSelectedTables(suggestedList.map((t: any) => t.name));

          // 추천된 테이블 이름에 매칭되는 한글 이름 획득 (최적 추천 대상 1순위)
          const matchedTable = availableTables.find(t => t.name === data.suggested_document_type) || {
            name: data.suggested_document_type,
            displayName: data.suggested_document_type === 'rnd_staffs' ? '연구원 대장' : 
                         data.suggested_document_type === 'crm_estimates' ? '견적서 대장' : 
                         data.suggested_document_type === 'crm_customers' ? '고객 명단' : '미지정 테이블',
            count: 0
          };

          setAiRecommendedTable({
            name: data.suggested_document_type,
            displayName: matchedTable.displayName,
            confidence: data.confidence_score || 0.95
          });

          setAiRecommendedData(data);
        }
      } catch (err) {
        console.error('백그라운드 AI 테이블 추천 실패:', err);
      } finally {
        setIsRecommending(false);
      }
    };

    if (availableTables.length > 0) {
      runBackgroundRecommendation();
    }
  }, [filePath, rawFileBase64, availableTables, templateId]);

  // 공통 매핑 데이터 적용 도우미 함수
  const applyMappingData = (data: any) => {
    setDocumentType(data.suggested_document_type);
    setQuerySql(data.suggested_query || '');
    setQueryParams(JSON.stringify(data.suggested_params || [], null, 2));
    
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
    
    const matchedTable = availableTables.find(t => t.name === data.suggested_document_type);
  };

  // AI 1초 자동 매핑 실행 핸들러 (사용자가 선택한 selectedTables 조합에 맞게 작동)
  const handleApplyAiMapping = async (customTables?: string[]) => {
    if (!filePath) return;

    if (isRecommending) {
      alert('AI가 양식 이미지를 정밀 분석하고 있습니다. 분석 완료 후 다시 시도해 주세요.');
      return;
    }

    const tablesToQuery = customTables || selectedTables;

    // 만약 사용자가 선택한 selectedTables가 현재 캐시된 aiRecommendedData의 suggested_document_type을 포함하고 있고 변경이 없는 경우 캐시 활용
    if (aiRecommendedData && tablesToQuery.includes(aiRecommendedData.suggested_document_type) && !customTables) {
      applyMappingData(aiRecommendedData);
      return;
    }

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
          selectedTables: tablesToQuery
        })
      });

      const data = await res.json();
      if (data.success) {
        applyMappingData(data);
      } else {
        alert(`AI 자동 매핑 분석 실패: ${data.error}`);
      }
    } catch (err) {
      console.error('AI 자율 매핑 재실행 에러:', err);
      alert('AI 분석 서버 통신 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 사용자가 상단바에서 수동으로 AI 추천 매핑을 가동할 때의 트리거
  const handleRunAiMappingManual = async () => {
    if (!filePath) {
      alert('A4 양식 이미지 파일을 먼저 업로드해 주세요.');
      return;
    }
    
    setIsRecommending(true);
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
        setIsRecommending(false);
        setIsAnalyzing(false);
        return;
      }

      // 전체 가용 테이블을 기준으로 1차 이미지 파싱 분석 구동
      const res = await fetch('/api/templates/auto-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          filename: uploadFilename || filePath.split('/').pop(),
          selectedTables: availableTables.map(t => t.name)
        })
      });

      const data = await res.json();
      if (data.success) {
        // 1. 추천 테이블 리스트 파싱 및 설정
        const suggestedList = (data.suggested_tables || []).map((t: any) => {
          const matchedAv = availableTables.find(av => av.name === t.name);
          return {
            name: t.name,
            displayName: t.displayName || matchedAv?.displayName || t.name,
            confidence: t.confidence || 0.9,
            count: matchedAv?.count,
            reason: t.reason
          };
        });
        setAiRecommendedTables(suggestedList);
        setSelectedTables(suggestedList.map((t: any) => t.name));

        const matchedTable = availableTables.find(t => t.name === data.suggested_document_type);
        setAiRecommendedTable({
          name: data.suggested_document_type,
          displayName: matchedTable?.displayName || data.suggested_document_type,
          confidence: data.confidence_score || 0.95
        });

        // 2. 분석 완료 데이터를 캔버스 좌표 매핑에 바로 자동 반영 및 캐시 저장
        setAiRecommendedData(data);
        applyMappingData(data);
      } else {
        alert(`AI 분석 실패: ${data.error}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`AI 분석 도중 에러가 발생했습니다: ${e.message}`);
    } finally {
      setIsRecommending(false);
      setIsAnalyzing(false);
    }
  };

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

  // 동적 필드 빌드 useEffect
  useEffect(() => {
    const commonFields = [
      { key: 'common_date', label: '일자 (달력 선택)', category: '공통 양식 요소' },
      { key: 'common_input', label: '입력 박스 (텍스트 기입)', category: '공통 양식 요소' },
      { key: 'common_stamp', label: '도장 (회사 직인 오버레이)', category: '공통 양식 요소' },
      { key: 'common_tag', label: '태그 (보관용/제출용 선택)', category: '공통 양식 요소' },
    ];

    const parsedCols = parseColumnsFromQuery(querySql);

    if (parsedCols.length > 0) {
      const dbFields = parsedCols.map(col => ({
        key: col,
        label: `${col} (SQL 추출)`,
        category: '동적 SQL 필드'
      }));
      setBindingFields([...commonFields, ...dbFields]);
    } else if (documentType) {
      fetch(`/api/db?action=schema&tableName=${documentType}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.schema) {
            const dbFields = data.schema
              .filter((c: any) => {
                const skipCols = ['uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by', 'password_hash'];
                return !skipCols.includes(c.name);
              })
              .map((c: any) => ({
                key: c.name,
                label: `${c.name} (${c.type})`,
                category: `테이블: ${documentType}`
              }));
            setBindingFields([...commonFields, ...dbFields]);
          } else {
            setBindingFields(commonFields);
          }
        })
        .catch(err => {
          console.error('동적 필드 로드 실패:', err);
          setBindingFields(commonFields);
        });
    } else {
      setBindingFields(commonFields);
    }
  }, [documentType, querySql]);
  
  // 드래그 상태 관리
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<{ index: number; startX: number; startY: number; startLeft: number; startTop: number } | null>(null);

  // 2) 수동 임시 저장 처리 (제거됨)

  // 4) 페이지 이탈 / 새로고침 경고 처리 (beforeunload 및 클라이언트 사이드 이동 차단)
  useEffect(() => {
    const hasUnsavedChanges = filePath || templateName || mappings.length > 0;
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '작성 중인 양식 설정 내역이 있습니다. 정말 나가시겠습니까?';
      return '작성 중인 양식 설정 내역이 있습니다. 정말 나가시겠습니까?';
    };

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor) {
        const href = anchor.getAttribute('href');
        // 내부 앵커가 아닌 실제 라우팅 링크일 때만 경고 처리
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          if (!confirm('작성 중인 양식 설정 내역이 있습니다. 저장하지 않고 다른 페이지로 이동하시면 작업 내용이 사라집니다. 정말 이동하시겠습니까?')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleAnchorClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleAnchorClick, true);
    };
  }, [filePath, templateName, mappings]);

  const handleBackWithWarning = () => {
    const hasUnsavedChanges = filePath || templateName || mappings.length > 0;
    if (hasUnsavedChanges) {
      if (!confirm('작성 중인 양식 설정 내역이 있습니다. 저장하지 않고 뒤로 가시면 작업 내용이 사라집니다. 정말 나가시겠습니까?')) {
        return;
      }
    }
    onBack();
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

  const handleToggleTable = async (tableKey: string) => {
    const nextSelected = selectedTables.includes(tableKey) 
      ? selectedTables.filter(t => t !== tableKey) 
      : [...selectedTables, tableKey];
    
    setSelectedTables(nextSelected);
    
    // 배지 클릭 시 즉시 실시간으로 해당 테이블들에 최적화된 매핑 정보를 API 재실행하여 적용
    await handleApplyAiMapping(nextSelected);
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
        setQuerySql(template.query_sql || '');
        setQueryParams(template.query_params || '[]');
        
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

  // 캔버스에 맵핑 항목 추가 (복수 등록을 허용하기 위해 중복 제한 해제)
  const handleAddField = (fieldKey: string) => {
    const fieldDef = bindingFields.find(f => f.key === fieldKey);
    if (!fieldDef) return;

    // 수기 입력 필드는 개별적으로 구분될 수 있도록 고유한 key 생성
    const uniqueFieldKey = fieldKey === 'common_input'
      ? `common_input_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      : fieldKey;

    const newItem: MappingItem = {
      id: Date.now(), // 고유 식별자
      field_key: uniqueFieldKey,
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

  // 선택한 매핑 복사 (동일 필드를 캔버스 내 여러 위치에 배치할 수 있도록 복제 지원)
  const handleDuplicateField = (id: number) => {
    const target = mappings.find(m => m.id === id);
    if (!target) return;

    const newItem: MappingItem = {
      ...target,
      id: Date.now(), // 고유 식별자 새로 할당
      pos_x: Math.min(98, target.pos_x + 3), // 시각적 구분을 위해 우하단으로 3% 오프셋 이동
      pos_y: Math.min(98, target.pos_y + 3)
    };

    setMappings([...mappings, newItem]);
    setSelectedMappingId(newItem.id!);
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
        query_sql: querySql,
        query_params: queryParams,
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

  // 상단 헤더 액션 버튼 포탈 렌더링
  const renderHeaderActions = () => {
    return (
      <div className="flex items-center gap-2 no-print animate-fade-in">
        <button 
          onClick={handleBackWithWarning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로가기
        </button>
        {filePath && (
          <>
            <button
              onClick={handleRunAiMappingManual}
              disabled={isRecommending || isAnalyzing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition border border-indigo-200 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
              {isRecommending || isAnalyzing ? 'AI 매핑 분석 중...' : 'AI 추천 매핑'}
            </button>
            <button
              onClick={() => setFilePath('')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition border border-slate-200 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              양식 교체
            </button>
          </>
        )}
        <button
          onClick={handleSaveTemplate}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? '저장 중...' : '양식 저장'}
        </button>
      </div>
    );
  };

  const portalTarget = typeof window !== 'undefined' ? document.getElementById('form-editor-actions-portal') : null;

  return (
    <>
      {isMounted && portalTarget ? createPortal(renderHeaderActions(), portalTarget) : null}
      
      <div className="w-full flex flex-col bg-white text-slate-800 border border-slate-100 rounded-3xl shadow-sm overflow-hidden min-h-[85vh]">



      {/* 2. 메인 워크스페이스 (좌우 분할) */}
      <div className="flex flex-1 flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* 좌측 컨트롤 패널 */}
        <div className="w-full md:w-[380px] p-6 border-r border-slate-100 bg-slate-50/50 overflow-y-auto flex flex-col gap-6">
          
          {/* 기본 양식 메타 정보 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-800 border-l-4 border-indigo-600 pl-2">양식 기본 정보</h3>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500">양식 템플릿명</label>
                
                {/* 사용 여부 (활성화) 를 템플릿명 라벨 우측으로 콤팩트하게 배치 */}
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700">
                  <input 
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold">사용 여부 (활성화)</span>
                </label>
              </div>
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
                  <option value="">(데이터 소스 선택 안함)</option>
                  {availableTables.map(table => (
                    <option key={table.name} value={table.name}>
                      {table.displayName} ({table.name})
                    </option>
                  ))}
                </select>

                {/* AI 추천 테이블 배지 목록 (데이터 소스 바로 아래에 컴팩트하게 밀착) */}
                {(aiRecommendedTables.length > 0 || isRecommending) && (
                  <div className="flex flex-wrap gap-1 mt-1 text-left">
                    {isRecommending ? (
                      <div className="flex items-center gap-1 py-1 text-slate-400">
                        <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                        <span className="text-[9px] font-semibold text-slate-550">추천 중...</span>
                      </div>
                    ) : (
                      aiRecommendedTables.map(table => {
                        const isChecked = selectedTables.includes(table.name);
                        return (
                          <button
                            key={table.name}
                            type="button"
                            onClick={() => handleToggleTable(table.name)}
                            title={`${table.displayName} (${table.name})${table.reason ? '\n사유: ' + table.reason : ''}`}
                            className={`flex items-center gap-0.5 px-2 py-1 rounded-lg border text-[9px] font-extrabold transition-all cursor-pointer ${
                              isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                            }`}
                          >
                            <span>{table.displayName}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
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


          </div>

          {/* 배경 이미지 업로드 (양식이 등록되지 않았을 때만 표시) */}
          {!filePath && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black text-slate-800 border-l-4 border-indigo-600 pl-2">배경 양식 파일</h3>
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
            </div>
          )}

          {/* AI 자동 매핑 추천 테이블은 A4 용지 좌측의 세로 목록으로 이관되어 렌더링됩니다. */}

          {/* 동적 SQL 쿼리 설정 콘솔 */}
          {filePath && (
            <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 flex flex-col gap-4 shadow-lg text-left relative overflow-hidden">
              <div className="absolute top-[-50px] right-[-50px] w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <h3 className="text-xs font-black text-slate-200">동적 SQL 쿼리 콘솔</h3>
                </div>
                <span className="text-[9px] bg-indigo-900/50 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">SELECT 전용</span>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400">데이터 조회 SELECT 쿼리</label>
                <textarea
                  value={querySql}
                  onChange={e => setQuerySql(e.target.value)}
                  placeholder="예: SELECT * FROM rnd_staffs WHERE name = :name"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-[11px] font-mono leading-relaxed text-indigo-200 transition scrollbar-thin"
                />
                <span className="text-[9px] text-slate-500 leading-tight">
                  * 쿼리 파라미터는 <code className="text-indigo-400">:name</code>, <code className="text-indigo-400">:id</code> 형태로 바인딩할 수 있습니다.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400">조건 파라미터 정의 (JSON)</label>
                <textarea
                  value={queryParams}
                  onChange={e => setQueryParams(e.target.value)}
                  placeholder={`[\n  { "name": "name", "label": "성명", "type": "text" }\n]`}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-[11px] font-mono leading-relaxed text-slate-300 transition scrollbar-thin"
                />
                <span className="text-[9px] text-slate-500 leading-tight">
                  * 조건 폼 필드 생성을 위한 메타데이터 배열입니다.
                </span>
              </div>
            </div>
          )}

          {/* 오버레이 필드 선택기 */}
          {filePath && (
            <div className="flex flex-col gap-4 flex-1">
              <h3 className="text-xs font-black text-slate-800 border-l-4 border-indigo-600 pl-2">오버레이 필드 삽입</h3>
              
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {Array.from(new Set(bindingFields.map(f => f.category))).map(cat => {
                  const items = bindingFields.filter(f => f.category === cat);
                  return (
                    <div key={cat} className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{cat}</span>
                      <div className="grid grid-cols-1 gap-1">
                        {items.map(field => {
                          const addedCount = mappings.filter(m => m.field_key === field.key).length;
                          return (
                            <button
                              key={field.key}
                              onClick={() => handleAddField(field.key)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition cursor-pointer ${
                                addedCount > 0 
                                ? 'bg-indigo-50/40 border-indigo-200/60 text-indigo-950 border shadow-sm'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
                              }`}
                            >
                              <span className="font-bold">{field.label}</span>
                              <div className="flex items-center gap-1.5">
                                {addedCount > 0 && (
                                  <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-full leading-none">
                                    {addedCount}
                                  </span>
                                )}
                                <Plus className={`w-3.5 h-3.5 ${addedCount > 0 ? 'text-indigo-600' : 'text-indigo-650'}`} />
                              </div>
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
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleDuplicateField(selectedMapping.id!)}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                    title="필드 복사"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleRemoveField(selectedMapping.id!)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="필드 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 필드 표시 이름 (라벨) 편집 */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-500">필드 표시 이름 (라벨)</label>
                <input 
                  type="text"
                  value={selectedMapping.field_label}
                  onChange={e => updateSelectedProperty('field_label', e.target.value)}
                  placeholder="예: 주민등록번호, 소속 등"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:outline-none text-xs font-bold transition"
                />
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
                    value={selectedMapping.pos_x === undefined || selectedMapping.pos_x === null || isNaN(selectedMapping.pos_x) ? '' : selectedMapping.pos_x}
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
                    value={selectedMapping.pos_y === undefined || selectedMapping.pos_y === null || isNaN(selectedMapping.pos_y) ? '' : selectedMapping.pos_y}
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
            /* A4 실비율(가로세로 1:1.414) 도화지 컨테이너 (이전 flex-row 및 AI 세로 추천 배지 영역 완전 제거) */
            <div className="flex flex-col items-center gap-4 flex-1 mt-4">
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
                      className={`px-2 py-1 rounded transition text-slate-900 border flex items-center gap-1.5 ${
                        isSelected 
                        ? 'bg-indigo-50/95 border-indigo-500 ring-2 ring-indigo-500 shadow-md z-30'
                        : 'bg-white/95 border-slate-300 hover:border-slate-400 shadow-sm z-20'
                      }`}
                    >
                      {isTable ? (
                        <div className="w-full flex flex-col text-[10px] text-slate-700 relative">
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateField(mapping.id!);
                            }}
                            className="absolute top-1 right-8 p-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition cursor-pointer"
                            title="필드 복사"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveField(mapping.id!);
                            }}
                            className="absolute top-1 right-1 p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                            title="필드 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="bg-slate-100 py-1 font-bold text-center border-b border-slate-200 block mb-1 text-slate-800 pr-16">
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
                        <>
                          <span className="pointer-events-none flex items-center gap-1.5 font-bold text-slate-800">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                            {mapping.field_label}
                          </span>
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateField(mapping.id!);
                            }}
                            className="p-0.5 rounded-full hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            title="필드 복사"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveField(mapping.id!);
                            }}
                            className="p-0.5 rounded-full hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="필드 삭제"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
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
    </>
  );
}
