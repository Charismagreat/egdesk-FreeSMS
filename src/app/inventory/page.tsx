"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Search, 
  Plus, 
  Sliders, 
  MapPin, 
  Building, 
  DollarSign, 
  Calendar, 
  Trash2, 
  Edit, 
  Sparkles, 
  Mic, 
  MicOff, 
  FileText, 
  ArrowRightLeft,
  Loader2,
  CheckCircle,
  X,
  Volume2
} from 'lucide-react';

interface InventoryItem {
  id: number;
  type: 'material' | 'product';
  name: string;
  category: string;
  price: number;
  partner?: string;
  stock: number;
  safeStock: number;
  location?: string;
  description?: string;
  createdAt: string;
}

interface InventoryLog {
  id: number;
  itemId: number;
  itemName: string;
  itemType: 'material' | 'product';
  changeType: 'in' | 'out' | 'adjust';
  quantity: number;
  price: number;
  operator: string;
  note?: string;
  createdAt: string;
}

export default function InventoryPage() {
  // 상태 정의
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [activeTab, setActiveTab] = useState<'material' | 'product'>('material');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 검색어 또는 탭 변경 시 페이지 번호 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // 모달 상태
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // 신규 품목 폼 상태
  const [itemForm, setItemForm] = useState({
    type: 'material' as 'material' | 'product',
    name: '',
    category: '',
    price: '',
    partner: '',
    stock: '',
    safeStock: '',
    location: '',
    description: ''
  });

  // 입출고 거래/조정 폼 상태
  const [txType, setTxType] = useState<'in' | 'out' | 'adjust'>('in');
  const [txForm, setTxForm] = useState({
    itemId: '',
    quantity: '',
    price: '',
    operator: '홍길동 과장',
    note: ''
  });

  // AI 비전 입고 분석 상태
  const [aiVisionLoading, setAiVisionLoading] = useState(false);
  const [aiVisionSuccess, setAiVisionSuccess] = useState(false);
  const [selectedVisionPreset, setSelectedVisionPreset] = useState<number | null>(null);
  const [scanningLine, setScanningLine] = useState(false);

  // AI 음성/자연어 출고 분석 상태
  const [aiVoiceLoading, setAiVoiceLoading] = useState(false);
  const [aiVoiceSuccess, setAiVoiceSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [selectedVoicePreset, setSelectedVoicePreset] = useState<number | null>(null);
  const [highlightFields, setHighlightFields] = useState<Record<string, boolean>>({});

  // 엑셀 일괄 등록용 상태
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [showExcelGuideModal, setShowExcelGuideModal] = useState(false);

  // 타이핑 애니메이션 레프 및 상태
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 시뮬레이션용 가상 영수증 프리셋 목록
  const visionPresets = [
    {
      id: 1,
      title: '한성정밀 자재 매입 명세서',
      filename: 'invoice_hansung_2026.png',
      data: {
        name: '초경량 모터',
        category: '전동부품',
        price: '12500',
        partner: '한성정밀(주)',
        stock: '50',
        safeStock: '15',
        location: 'A홀 3번 선반',
        description: '고효율 초경량 BLDC 모터'
      }
    },
    {
      id: 2,
      title: '글로벌 트레이딩 완제품 인보이스',
      filename: 'invoice_global_trading.jpg',
      data: {
        name: '써모글로우 텀블러',
        category: '리빙웨어',
        price: '8700',
        partner: '글로벌 트레이딩',
        stock: '120',
        safeStock: '30',
        location: 'B홀 12번 적재함',
        description: '보온보냉 고진공 텀블러 500ml'
      }
    },
    {
      id: 3,
      title: '대성부자재 매입 영수증',
      filename: 'receipt_daesung.png',
      data: {
        name: '에어제트 모터',
        category: '전동부품',
        price: '4800',
        partner: '대성부자재상사',
        stock: '80',
        safeStock: '20',
        location: 'A홀 5번 선반',
        description: '소형 고압 에어분사식 모터 세트'
      }
    }
  ];

  // 시뮬레이션용 가상 음성/자연어 프리셋 목록
  const voicePresets = [
    {
      id: 1,
      text: '써모글로우 텀블러 15개 출고하고 VIP 고객 사은품 발송용이라고 메모해줘',
      parsed: {
        itemName: '써모글로우 텀블러',
        quantity: '15',
        price: '8700', // 기존 단가 매핑 예정
        note: 'VIP 고객 사은품 발송용'
      }
    },
    {
      id: 2,
      text: '초경량 모터 5개 출고. 2공장 조립 생산 라인 투입용',
      parsed: {
        itemName: '초경량 모터',
        quantity: '5',
        price: '12500',
        note: '2공장 조립 생산 라인 투입용'
      }
    },
    {
      id: 3,
      text: '에어제트 모터 30개 출고 부탁해요. 긴급 오더건!',
      parsed: {
        itemName: '에어제트 모터',
        quantity: '30',
        price: '4800',
        note: '긴급 오더건!'
      }
    }
  ];

  // 최초 로드 시 데이터 패치
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const itemsRes = await fetch('/api/inventory');
      const itemsData = await itemsRes.json();
      if (itemsData.success) {
        setItems(Array.isArray(itemsData.data) ? itemsData.data : []);
      } else {
        setItems([]);
      }

      const logsRes = await fetch('/api/inventory/logs');
      const logsData = await logsRes.json();
      if (logsData.success) {
        setLogs(Array.isArray(logsData.data) ? logsData.data : []);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setItems([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // 품목 추가/수정 처리
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!selectedItem;
      const url = '/api/inventory';
      const method = isEdit ? 'PUT' : 'POST';
      const payload = isEdit ? { ...itemForm, id: selectedItem.id } : itemForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setIsItemModalOpen(false);
        setSelectedItem(null);
        resetItemForm();
        fetchData();
      } else {
        alert(data.error || '처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('품목 저장 오류:', error);
    }
  };

  // 품목 삭제 처리
  const handleItemDelete = async (id: number) => {
    if (!confirm('정말로 이 품목과 관련 변동 로그를 모두 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/inventory?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
    }
  };

  // 엑셀 일괄 등록 처리
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingExcel(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = event.target?.result;
        if (!data) return;

        try {
          // SheetJS 동적 임포트
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (rawRows.length === 0) {
            alert('엑셀 시트에 데이터가 존재하지 않습니다.');
            setIsUploadingExcel(false);
            return;
          }

          // 지능형 퍼지 매핑
          const mappedItems = rawRows.map((row: any) => {
            const typeVal = row['종류'] || row['구분'] || row['type'] || '자재';
            const nameVal = row['품목명'] || row['이름'] || row['name'] || '';
            const categoryVal = row['카테고리'] || row['분류'] || row['category'] || '';
            const priceVal = row['단가'] || row['공급 단가'] || row['공급단가'] || row['매입가'] || row['판매가'] || row['price'] || 0;
            const partnerVal = row['거래처'] || row['매입처'] || row['주매입거래처'] || row['partner'] || '';
            const locationVal = row['적재 위치'] || row['창고 위치'] || row['적재위치'] || row['location'] || '';
            const specVal = row['규격'] || row['세부 스펙'] || row['spec'] || '';
            const unitTypeVal = row['단위'] || row['단위 구분'] || row['unitType'] || '개수';
            const unitValueVal = row['세부 단위'] || row['unitValue'] || '';
            const boxContainsVal = row['박스당 입수량'] || row['n개입'] || row['boxContains'] || '';
            const safeStockVal = row['안전 재고'] || row['적정 재고'] || row['안전재고량'] || row['safeStock'] || 0;
            const stockVal = row['최초 재고'] || row['현재 재고'] || row['최초기초재고'] || row['stock'] || 0;
            const descriptionVal = row['비고'] || row['상세 설명'] || row['description'] || '';

            return {
              type: typeVal,
              name: nameVal,
              category: categoryVal,
              price: priceVal,
              partner: partnerVal,
              location: locationVal,
              spec: specVal,
              unitType: unitTypeVal,
              unitValue: unitValueVal,
              boxContains: boxContainsVal,
              safeStock: safeStockVal,
              stock: stockVal,
              description: descriptionVal
            };
          }).filter(item => item.name);

          if (mappedItems.length === 0) {
            alert('필수 정보인 [품목명]이 기재된 유효한 행을 찾을 수 없습니다.');
            setIsUploadingExcel(false);
            return;
          }

          const res = await fetch('/api/inventory/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: mappedItems })
          });
          const json = await res.json();

          if (json.success) {
            alert(`🎉 엑셀 일괄 등록 완료!\n수신 데이터: ${json.totalReceived}개 중 ${json.count}개의 신규 품목이 등록되었습니다.\n(중복된 동일 품목명의 데이터는 자동 스킵되었습니다.)`);
            fetchData();
          } else {
            alert('일괄 등록 실패: ' + (json.error || '알 수 없는 오류'));
          }
        } catch (err: any) {
          console.error(err);
          alert('엑셀 파일 파싱 중 오류가 발생했습니다. 서식을 확인해 주세요.');
        } finally {
          setIsUploadingExcel(false);
          e.target.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (e) {
      alert('파일 읽기 오류가 발생했습니다.');
      setIsUploadingExcel(false);
    }
  };

  // 엑셀 양식 서식 다운로드 기능
  const downloadExcelTemplate = async () => {
    try {
      const XLSX = await import('xlsx');

      // 1. 헤더 컬럼 목록 정의
      const headers = [
        '구분',
        '품목명',
        '카테고리',
        '규격',
        '단위',
        '박스당 입수량',
        '단가',
        '거래처',
        '적재 위치',
        '안전 재고',
        '최초 재고',
        '비고'
      ];

      // 2. 가상의 모의 데이터(자재, 제품 예시) 2개 행 정의
      const mockRows = [
        {
          '구분': '자재',
          '품목명': '초경량 BLDC 모터 V2',
          '카테고리': '전동부품',
          '규격': '15mm x 150mm',
          '단위': '박스',
          '박스당 입수량': 10,
          '단가': 12500,
          '거래처': '한성정밀(주)',
          '적재 위치': 'A홀 3번 선반',
          '안전 재고': 15,
          '최초 재고': 50,
          '비고': '고효율 긴수명 모터 브라켓 미포함'
        },
        {
          '구분': '제품',
          '품목명': '써모글로우 텀블러 500ml',
          '카테고리': '리빙웨어',
          '규격': '고진공 스테인리스 이중벽',
          '단위': '개수',
          '박스당 입수량': '',
          '단가': 8700,
          '거래처': '글로벌 트레이딩',
          '적재 위치': 'B홀 12번 적재함',
          '안전 재고': 30,
          '최초 재고': 120,
          '비고': '보온보냉 고진공 텀블러 완제품'
        }
      ];

      // AOA(Array of Arrays) 형태로 워크시트 생성
      const aoaData = [headers];
      mockRows.forEach((row) => {
        const rowData = headers.map((header) => row[header as keyof typeof row] ?? '');
        aoaData.push(rowData);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '재고일괄등록_샘플서식');

      // 브라우저로 엑셀 파일 즉각 다운로드 시키기
      XLSX.writeFile(workbook, '이지데스크_재고일괄등록_샘플양식.xlsx');
    } catch (err) {
      console.error('템플릿 생성 중 에러:', err);
      alert('템플릿 파일을 생성하지 못했습니다. 다시 시도해 주세요.');
    }
  };

  // 입출고 및 조정 등록 처리
  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.itemId) {
      alert('품목을 선택해 주세요.');
      return;
    }
    try {
      const res = await fetch('/api/inventory/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: Number(txForm.itemId),
          changeType: txType,
          quantity: Number(txForm.quantity),
          price: Number(txForm.price),
          operator: txForm.operator,
          note: txForm.note
        })
      });
      const data = await res.json();

      if (data.success) {
        setIsTxModalOpen(false);
        resetTxForm();
        fetchData();
      } else {
        alert(data.error || '등록 실패');
      }
    } catch (error) {
      console.error('거래 등록 오류:', error);
    }
  };

  // 폼 리셋
  const resetItemForm = () => {
    setItemForm({
      type: activeTab,
      name: '',
      category: '',
      price: '',
      partner: '',
      stock: '',
      safeStock: '',
      location: '',
      description: ''
    });
  };

  const resetTxForm = () => {
    setTxForm({
      itemId: '',
      quantity: '',
      price: '',
      operator: '홍길동 과장',
      note: ''
    });
  };

  // 품목 신규 추가 클릭 시 모달 열기
  const openNewItemModal = () => {
    setSelectedItem(null);
    setItemForm({
      type: activeTab,
      name: '',
      category: '',
      price: '',
      partner: '',
      stock: '0',
      safeStock: '10',
      location: '',
      description: ''
    });
    setIsItemModalOpen(true);
  };

  // 품목 수정 클릭 시 모달 열기
  const openEditItemModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setItemForm({
      type: item.type,
      name: item.name,
      category: item.category,
      price: String(item.price),
      partner: item.partner || '',
      stock: String(item.stock),
      safeStock: String(item.safeStock),
      location: item.location || '',
      description: item.description || ''
    });
    setIsItemModalOpen(true);
  };

  // 원클릭 입출고/조정 모달 열기
  const openTxModal = (type: 'in' | 'out' | 'adjust', item?: InventoryItem) => {
    setTxType(type);
    resetTxForm();
    if (item) {
      setTxForm({
        itemId: String(item.id),
        quantity: '',
        price: String(item.price),
        operator: '홍길동 과장',
        note: ''
      });
    }
    setIsTxModalOpen(true);
  };

  // 🔥 [AI 기능 1] AI 비전 영수증/명세서 입고 자동화 실행 시뮬레이터
  const triggerAiVisionScan = (presetId: number) => {
    if (aiVisionLoading) return;
    
    // 타이핑 진행 중인 기존 인터벌 정리
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    const preset = visionPresets.find(p => p.id === presetId);
    if (!preset) return;

    setSelectedVisionPreset(presetId);
    setAiVisionLoading(true);
    setAiVisionSuccess(false);
    setScanningLine(true);

    // 1.5초 스캔 CSS 레이저 효과 가동 후 파싱 시작
    setTimeout(() => {
      setScanningLine(false);
      setAiVisionLoading(false);
      setAiVisionSuccess(true);

      // 타이핑 애니메이션으로 폼 입력 채우기
      const targetData = preset.data;
      
      // 폼을 '자재' 형태로 전환하고 초기화
      setItemForm({
        type: preset.id === 2 ? 'product' : 'material', // 텀블러는 제품, 나머지는 자재
        name: '',
        category: '',
        price: '',
        partner: '',
        stock: '',
        safeStock: '',
        location: '',
        description: ''
      });

      let currentStep = 0;
      const keysToType = ['name', 'category', 'price', 'partner', 'stock', 'safeStock', 'location', 'description'] as const;
      
      const typeNextField = () => {
        if (currentStep >= keysToType.length) {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          return;
        }

        const key = keysToType[currentStep];
        const value = targetData[key];
        let charIndex = 0;

        const charInterval = setInterval(() => {
          setItemForm(prev => ({
            ...prev,
            [key]: value.substring(0, charIndex + 1)
          }));
          charIndex++;

          if (charIndex >= value.length) {
            clearInterval(charInterval);
            currentStep++;
            // 약간의 딜레이 후 다음 필드 타이핑 시작
            setTimeout(typeNextField, 150);
          }
        }, 30); // 한 글자당 30ms 간격 타이핑
      };

      typeNextField();
    }, 1500);
  };

  // 🔥 [AI 기능 2] AI 음성 및 자연어 출고 명령 분석기
  const triggerAiVoiceAnalysis = (textToAnalyze?: string) => {
    const rawText = textToAnalyze || voiceText;
    if (!rawText.trim()) {
      alert('음성 인식 텍스트 또는 자연어 명령을 입력하거나 프리셋을 선택해 주세요.');
      return;
    }

    setAiVoiceLoading(true);
    setAiVoiceSuccess(false);

    // 0.8초 고속 지능형 자연어 구문 분석 NLP 시뮬레이션
    setTimeout(() => {
      // 가장 잘 매칭되는 프리셋 찾기
      const matchedPreset = voicePresets.find(p => rawText.includes(p.parsed.itemName) || p.text === rawText);
      
      let parsedResult = {
        itemName: '써모글로우 텀블러',
        quantity: '5',
        price: '8700',
        note: '자연어 분석 즉시 출고'
      };

      if (matchedPreset) {
        parsedResult = matchedPreset.parsed;
      } else {
        // 프리셋이 아닐 경우 동적 정규식 파싱 시뮬레이션
        const numMatch = rawText.match(/(\d+)개/);
        const qty = numMatch ? numMatch[1] : '1';
        
        // 데이터셋 내에서 품목명 부분 매칭 검색
        const foundItem = items.find(it => rawText.includes(it.name));
        parsedResult = {
          itemName: foundItem ? foundItem.name : (items[0]?.name || '등록된 품목 없음'),
          quantity: qty,
          price: foundItem ? String(foundItem.price) : '0',
          note: rawText
        };
      }

      // 대응하는 품목의 ID 매핑
      const dbItem = items.find(it => it.name.trim() === parsedResult.itemName.trim());
      
      setAiVoiceLoading(false);
      setAiVoiceSuccess(true);

      if (dbItem) {
        // 출고 폼에 자동 바인딩 (Auto-Fill)
        setTxForm({
          itemId: String(dbItem.id),
          quantity: parsedResult.quantity,
          price: parsedResult.price,
          operator: '홍길동 과장 (음성 자동)',
          note: parsedResult.note
        });

        // 입력 필드 강조 깜빡임(Flash Highlighting) 활성화
        setHighlightFields({ itemId: true, quantity: true, note: true });
        setTimeout(() => {
          setHighlightFields({});
        }, 1500);
      } else {
        alert(`분석 완료: '${parsedResult.itemName}' 품목이 현재 재고 시스템에 등록되어 있지 않습니다. 신규 품목 등록 후 출고해 주세요.`);
      }
    }, 800);
  };

  // 모의 마이크 녹음 시뮬레이터
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // 녹음이 끝났을 때 임의의 프리셋 텍스트를 주입
      const randomPreset = voicePresets[Math.floor(Math.random() * voicePresets.length)];
      setVoiceText(randomPreset.text);
      setSelectedVoicePreset(randomPreset.id);
    } else {
      setIsRecording(true);
      setVoiceText('음성을 분석하는 중...');
      setSelectedVoicePreset(null);
      setAiVoiceSuccess(false);
    }
  };

  // 안전한 배열 보장 (방어 코드)
  const safeItems = Array.isArray(items) ? items : [];
  const safeLogs = Array.isArray(logs) ? logs : [];

  // 통계 연산
  const materials = safeItems.filter(it => it.type === 'material');
  const products = safeItems.filter(it => it.type === 'product');
  
  const totalMaterialStock = materials.reduce((acc, cur) => acc + cur.stock, 0);
  const totalProductStock = products.reduce((acc, cur) => acc + cur.stock, 0);

  // 안전재고 경고가 번쩍여야 하는 품목 수
  const outOfStockItems = safeItems.filter(it => it.stock <= it.safeStock);
  const outOfStockCount = outOfStockItems.length;

  // 당월 누적 변동량 계산
  const currentMonthLogs = safeLogs.filter(log => {
    const logDate = new Date(log.createdAt);
    const now = new Date();
    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
  });
  const monthlyTxCount = currentMonthLogs.length;

  // 현재 탭 및 검색 쿼리에 따른 필터링된 아이템 리스트
  const filteredItems = safeItems
    .filter(item => item.type === activeTab)
    .filter(item => {
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.location && item.location.toLowerCase().includes(query)) ||
        (item.partner && item.partner.toLowerCase().includes(query))
      );
    });

  // 페이지네이션 슬라이싱 로직
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen text-slate-800 font-sans pb-16">
      
      {/* 최상단 화려한 그라디언트 배너 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-8 py-10 shadow-lg border-b border-indigo-900/40">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-300 via-indigo-400 to-purple-600"></div>
        <div className="relative z-10 max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Inventory Hub v2.1
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              재고 관리
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base max-w-2xl leading-relaxed">
              자재(원부자재)와 제품(완제품)의 이원화 물리 스키마를 완벽히 통제하며, 영수증 비전 스캔 분석 및 실시간 자연어 음성 출고 명령이 결합된 독창적인 AI 재고 솔루션입니다.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowExcelGuideModal(true)}
              className="bg-slate-800/40 hover:bg-slate-800/60 text-indigo-300 font-semibold text-sm px-3.5 py-3 rounded-xl border border-indigo-500/20 active:scale-95 transition-all flex items-center justify-center"
              title="엑셀 업로드 양식 도움말 가이드"
            >
              <FileText className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={downloadExcelTemplate}
              className="bg-slate-800/40 hover:bg-slate-800/60 text-emerald-400 font-semibold text-sm px-3.5 py-3 rounded-xl border border-emerald-500/20 active:scale-95 transition-all flex items-center justify-center"
              title="표준 엑셀 샘플 서식 (.xlsx) 직접 다운로드"
            >
              <FileText className="w-4.5 h-4.5 text-emerald-300" />
            </button>
            <label className={`bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-lg shadow-indigo-950/20 active:scale-95 transition-all flex items-center space-x-2 border border-indigo-400/20 ${isUploadingExcel ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
              {isUploadingExcel ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>업로드 중...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4.5 h-4.5 text-indigo-200" />
                  <span>엑셀 일괄 등록</span>
                </>
              )}
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                onChange={handleExcelUpload}
                disabled={isUploadingExcel}
              />
            </label>
            <button 
              onClick={openNewItemModal}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-lg shadow-emerald-950/20 active:scale-95 transition-all flex items-center space-x-2 border border-emerald-400/20"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>신규 품목 등록</span>
            </button>
            <button 
              onClick={() => openTxModal('in')}
              className="bg-slate-800 hover:bg-slate-755 text-white font-semibold text-sm px-5 py-3 rounded-xl border border-slate-700 active:scale-95 transition-all flex items-center space-x-2"
            >
              <ArrowRightLeft className="w-4.5 h-4.5 text-indigo-400" />
              <span>입출고 및 실사 조정</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-8 space-y-8">

        {/* 1. 상단 물류 요약 대시보드 카드 4종 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 카드 1: 총 자재 현황 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="space-y-1 z-10">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">총 보유 자재</span>
              <h3 className="text-2xl font-bold text-slate-800">{totalMaterialStock.toLocaleString()} 개</h3>
              <p className="text-xs text-slate-400">{materials.length}종의 원부자재 보관 중</p>
            </div>
            <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
          </div>

          {/* 카드 2: 총 제품 현황 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="space-y-1 z-10">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">총 보유 완제품</span>
              <h3 className="text-2xl font-bold text-slate-800">{totalProductStock.toLocaleString()} 개</h3>
              <p className="text-xs text-slate-400">{products.length}종의 판매 완제품 적재 완료</p>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* 카드 3: 안전재고 부족 알림 (🔥 번쩍이는 스마트 부족 알림 배지 탑재) */}
          <div className={`rounded-2xl p-6 shadow-sm border transition-all flex items-center justify-between relative overflow-hidden group hover:shadow-md ${
            outOfStockCount > 0 
              ? 'bg-rose-50/70 border-rose-100 text-rose-900' 
              : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className="space-y-1 z-10">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">안전재고 부족</span>
              <div className="flex items-center space-x-2">
                <h3 className="text-2xl font-bold">{outOfStockCount} 건</h3>
                {outOfStockCount > 0 && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">즉각 발주 및 입고 보충 권장</p>
            </div>
            <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${
              outOfStockCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          {/* 카드 4: 당월 입출고 건수 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="space-y-1 z-10">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">당월 입출고 활동</span>
              <h3 className="text-2xl font-bold text-slate-800">{monthlyTxCount} 건</h3>
              <p className="text-xs text-slate-400">입고, 출고, 실사조정 총계</p>
            </div>
            <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* 2. 🔥 AI 인공지능 샌드박스 터미널 (비전 & 음성/자연어 2개 기둥) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* 2-A: 🔥 AI 비전 영수증/명세서 입고 자동화 터미널 */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-indigo-50 text-indigo-600 rounded-bl-2xl font-bold text-[10px] uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> Vision OCR AI Engine
            </div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span>AI 비전 명세서 분석 입고</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                매입 영수증이나 인보이스 사진을 드래그해 넣으면 AI가 분석하여 품목, 단가, 거래처 등을 파싱해 입력폼에 채웁니다.
              </p>
            </div>

            {/* 샘플 명세서 프리셋 버튼 목록 */}
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-500 block mb-2">실시간 AI 비전 파싱 시뮬레이션용 프리셋:</span>
              <div className="grid grid-cols-3 gap-2">
                {visionPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => triggerAiVisionScan(preset.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all relative overflow-hidden group ${
                      selectedVisionPreset === preset.id
                        ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 font-semibold'
                        : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="truncate font-semibold">{preset.title}</div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">{preset.filename}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 영수증/인보이스 드롭존 & 스캔 비주얼 효과 레이어 */}
            <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 min-h-[140px] overflow-hidden group">
              {scanningLine && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-bounce z-20"></div>
              )}
              {aiVisionLoading ? (
                <div className="flex flex-col items-center space-y-2 z-10">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-xs text-indigo-600 font-semibold animate-pulse">명세서 이미지 픽셀 스캔 및 분석 중...</span>
                </div>
              ) : selectedVisionPreset ? (
                <div className="flex flex-col items-center text-center space-y-2 z-10">
                  <FileText className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">
                      {visionPresets.find(p => p.id === selectedVisionPreset)?.filename}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-1 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5" /> 스캔 완료! 품목 등록 창에 정보 주입 중...
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-400" />
                  <div className="text-xs text-slate-500">
                    <span className="text-indigo-500 font-bold hover:underline cursor-pointer">이미지 파일 찾아보기</span> 또는 드래그 앤 드롭
                  </div>
                  <div className="text-[10px] text-slate-400">PNG, JPG, PDF (가상 시뮬레이터 지원)</div>
                </div>
              )}
            </div>

            {/* 신규 품목 등록으로 바로 연동하는 원클릭 액션 */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                * 실제 명세서 사진 파싱 후 정보가 등록 폼에 <strong className="text-indigo-500">타이핑 효과</strong>로 자동 매핑됩니다.
              </span>
              <button
                onClick={() => {
                  if (!selectedVisionPreset) {
                    alert('먼저 명세서 샘플을 선택하여 AI 스캔을 수행해 주세요.');
                    return;
                  }
                  setIsItemModalOpen(true);
                }}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs px-4 py-2.5 rounded-xl border border-indigo-100 transition-colors"
              >
                품목 폼에서 확인하기 &rarr;
              </button>
            </div>
          </div>

          {/* 2-B: 🔥 AI 음성/자연어 출고 명령 분석 터미널 */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-red-50 text-red-600 rounded-bl-2xl font-bold text-[10px] uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> Speech NLP AI Engine
            </div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Mic className="w-5 h-5 text-red-500" />
                <span>AI 음성/자연어 출고 명령</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                *"텀블러 5개 출고하고 VIP 발송이라고 메모해줘"* 등의 자연어를 입력하거나 음성으로 말하면 AI가 분석하여 출고 입력폼에 자동 채워줍니다.
              </p>
            </div>

            {/* 음성 프리셋 패널 */}
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-500 block mb-2">실시간 음성/자연어 분석용 프리셋:</span>
              <div className="flex flex-col space-y-1.5">
                {voicePresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setVoiceText(preset.text);
                      setSelectedVoicePreset(preset.id);
                      setAiVoiceSuccess(false);
                    }}
                    className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center space-x-2 ${
                      selectedVoicePreset === preset.id
                        ? 'border-red-500 bg-red-50 text-red-950 font-medium'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="truncate">{preset.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 자연어 텍스트 및 음성 마이크 UI */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={voiceText}
                  onChange={(e) => {
                    setVoiceText(e.target.value);
                    setSelectedVoicePreset(null);
                    setAiVoiceSuccess(false);
                  }}
                  placeholder="예: 초경량 모터 5개 출고. 2공장 생산 투입 건"
                  className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-red-400 focus:border-red-400 outline-none"
                />
                {voiceText && (
                  <button 
                    onClick={() => { setVoiceText(''); setSelectedVoicePreset(null); }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center relative ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white scale-105 animate-pulse' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title={isRecording ? '녹음 정지' : '마이크로 음성 출고 지시 시작'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isRecording && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                )}
              </button>
            </div>

            {/* 음성 인식 웨이브 애니메이션 */}
            {isRecording && (
              <div className="mb-4 bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center space-x-1.5 h-6">
                  <span className="w-1 bg-red-400 animate-[bounce_0.8s_infinite_100ms] h-3 rounded-full"></span>
                  <span className="w-1 bg-red-500 animate-[bounce_0.8s_infinite_200ms] h-5 rounded-full"></span>
                  <span className="w-1 bg-red-600 animate-[bounce_0.8s_infinite_300ms] h-6 rounded-full"></span>
                  <span className="w-1 bg-red-500 animate-[bounce_0.8s_infinite_400ms] h-4 rounded-full"></span>
                  <span className="w-1 bg-red-400 animate-[bounce_0.8s_infinite_500ms] h-2 rounded-full"></span>
                </div>
                <span className="text-[10px] text-red-500 font-semibold">마이크 음성을 인지 중입니다. 말을 마치려면 정지해 주세요...</span>
              </div>
            )}

            {/* AI 파싱 분석 실행 및 성공 표시 */}
            <div className="flex items-center justify-between mt-auto">
              <div>
                {aiVoiceSuccess ? (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> 파싱 성공! 출고 전용 폼에 데이터 바인딩 됨
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">* 자연어 텍스트 입력 후 AI 분석 버튼을 클릭하세요.</span>
                )}
              </div>
              <button
                onClick={() => triggerAiVoiceAnalysis()}
                disabled={aiVoiceLoading}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-4 py-2.5 rounded-xl border border-red-100 flex items-center space-x-1.5 active:scale-95 transition-all"
              >
                {aiVoiceLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>분석 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>NLP AI 분석 실행</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>


        {/* 3. 메인 콘텐츠 영역: 탭 및 재고 품목 목록 테이블 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          
          {/* 검색 및 탭 컨트롤러 헤더 */}
          <div className="flex flex-col md:flex-row md:items-center justify-start pb-6 border-b border-slate-100 gap-4 md:gap-x-12">
            
            {/* 좌측 타이틀 및 상황판 역할 가이드 */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                <span>실시간 재고 자산 대장</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'material' ? '등록된 원부자재 및 매입 거래처 정보를 통합 조회합니다.' : '출하 가능한 완제품 및 판매 단가 정보를 통합 조회합니다.'}
              </p>
            </div>

            {/* 우측 밀착 정렬 (탭 스위치 + 검색 바) */}
            <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-end gap-3 w-full md:w-auto md:flex-none flex-nowrap">
              
              {/* 자재 vs 제품 탭 스위치 */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto flex-shrink-0">
                <button
                  onClick={() => {
                    setActiveTab('material');
                    setSearchQuery('');
                  }}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 min-w-[125px] flex-shrink-0 ${
                    activeTab === 'material'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <span>자재 관리 ({materials.length})</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('product');
                    setSearchQuery('');
                  }}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 min-w-[125px] flex-shrink-0 ${
                    activeTab === 'product'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>제품 관리 ({products.length})</span>
                </button>
              </div>

              {/* 통합 필터 검색 바 */}
              <div className="relative w-full sm:w-[280px] flex-shrink-0" style={{ maxWidth: '280px' }}>
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder={activeTab === 'material' ? '자재명, 거래처, 보관 위치...' : '제품명, 카테고리, 보관 위치...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-2xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                />
              </div>

            </div>

          </div>

          {/* 재고 리스트 테이블 */}
          <div className="overflow-x-auto mt-4">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-500 font-semibold">SQLite 안전 테이블 조회 중...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold">해당 탭에 등록된 품목이 존재하지 않습니다.</p>
                <p className="text-xs">상단의 '신규 품목 등록' 또는 'AI 비전 분석'을 통해 첫 재고를 생성해 주세요.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-4 px-4">품목명</th>
                    <th className="py-4 px-4">카테고리</th>
                    <th className="py-4 px-4">보관 위치</th>
                    <th className="py-4 px-4 text-right">현재고 / 안전재고</th>
                    <th className="py-4 px-4 text-right">
                      {activeTab === 'material' ? '공급단가 (매입가)' : '매출단가 (판매가)'}
                    </th>
                    <th className="py-4 px-4">
                      {activeTab === 'material' ? '주 거래처' : '상세 설명'}
                    </th>
                    <th className="py-4 px-4 text-center">동작 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedItems.map((item) => {
                    const isAlert = item.stock <= item.safeStock;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-semibold text-slate-800">{item.name}</span>
                            {isAlert && (
                              <span className="bg-rose-100 text-rose-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-rose-200 animate-pulse">
                                부족
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-500">{item.category}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.location || '미정 지정'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          <span className={`font-bold ${isAlert ? 'text-rose-600' : 'text-slate-800'}`}>
                            {item.stock.toLocaleString()}
                          </span>
                          <span className="text-slate-400"> / {item.safeStock} 개</span>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-slate-800">
                          ₩ {item.price.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 max-w-[200px] truncate text-slate-500">
                          {activeTab === 'material' ? (
                            <div className="flex items-center space-x-1">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.partner || '-'}</span>
                            </div>
                          ) : (
                            <span>{item.description || '-'}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openTxModal('in', item)}
                              className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg border border-transparent hover:border-blue-100 text-[10px] font-bold"
                              title="입고 처리"
                            >
                              입고
                            </button>
                            <button
                              onClick={() => openTxModal('out', item)}
                              className="text-red-650 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100 text-[10px] font-bold"
                              title="출고 처리"
                            >
                              출고
                            </button>
                            <button
                              onClick={() => openTxModal('adjust', item)}
                              className="text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg border border-transparent hover:border-purple-100 text-[10px] font-bold"
                              title="재고 실사 조정"
                            >
                              실사
                            </button>
                            <button
                              onClick={() => openEditItemModal(item)}
                              className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-lg text-[10px]"
                              title="정보 수정"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleItemDelete(item.id)}
                              className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg text-[10px]"
                              title="품목 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* 페이지네이션 하단 컨트롤바 */}
            {!loading && (
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 rounded-2xl mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">페이지당 표시:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={e => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }} 
                    className={`border rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 transition-all ${
                      activeTab === 'material' ? 'focus:border-indigo-500' : 'focus:border-emerald-550'
                    }`}
                  >
                    <option value={10}>10개씩 보기</option>
                    <option value={20}>20개씩 보기</option>
                    <option value={50}>50개씩 보기</option>
                    <option value={100}>100개씩 보기</option>
                  </select>
                  <span className="text-xs text-slate-400 font-semibold ml-2">
                    {filteredItems.length === 0 
                      ? "전체 0건 표시" 
                      : `전체 ${filteredItems.length}건 중 ${startIndex + 1}-${Math.min(endIndex, filteredItems.length)}건 표시`}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                    disabled={currentPage === 1 || totalPages <= 1} 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-650 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    이전
                  </button>
                  {totalPages <= 1 ? (
                    <button 
                      disabled 
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm disabled:opacity-50 cursor-not-allowed ${
                        activeTab === 'material' ? 'bg-indigo-600' : 'bg-emerald-600'
                      }`}
                    >
                      1
                    </button>
                  ) : (
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentPage === page 
                            ? activeTab === 'material'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-emerald-600 text-white shadow-sm'
                            : 'border bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        {page}
                      </button>
                    ))
                  )}
                  <button 
                    disabled={currentPage === totalPages || totalPages <= 1} 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-650 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>


        {/* 4. 하단 입출고 변동 로그 히스토리 테이블 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
                <span>실시간 시계열 입출고 변동 로그</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                재고 수량 보정, 구매 입고, 주문 출고 등 모든 재고의 흐름이 영구 기록된 데이터 피드입니다.
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
              총 {safeLogs.length}개 로그 기록됨
            </span>
          </div>

          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            {safeLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                현재고 변동 내역이 아직 존재하지 않습니다.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 sticky top-0">
                    <th className="py-3 px-4">일시</th>
                    <th className="py-3 px-4">품목명</th>
                    <th className="py-3 px-4">품목 구분</th>
                    <th className="py-3 px-4 text-center">변동 종류</th>
                    <th className="py-3 px-4 text-right">수량</th>
                    <th className="py-3 px-4 text-right">단가</th>
                    <th className="py-3 px-4">담당자</th>
                    <th className="py-3 px-4">변동 메모 및 AI 분석 사유</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {safeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(log.createdAt).toLocaleString('ko-KR', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{log.itemName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          log.itemType === 'material' 
                            ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {log.itemType === 'material' ? '자재' : '제품'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          log.changeType === 'in'
                            ? 'bg-blue-100 text-blue-700'
                            : log.changeType === 'out'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {log.changeType === 'in' ? '입고' : log.changeType === 'out' ? '출고' : '실사조정'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={
                          log.changeType === 'in' 
                            ? 'text-blue-600' 
                            : log.changeType === 'out' 
                            ? 'text-rose-600' 
                            : 'text-purple-600'
                        }>
                          {log.changeType === 'in' ? '+' : log.changeType === 'out' ? '-' : ''}
                          {Math.abs(log.quantity).toLocaleString()} 개
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        ₩ {log.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{log.operator}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-[250px] truncate" title={log.note}>
                        {log.note || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>


      {/* ========================================================================= */}
      {/* 5. 신규 품목 등록 & 정보 수정 모달 (Vision AI 자동 주입 지원) */}
      {/* ========================================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>{selectedItem ? '품목 수정' : '신규 품목 추가'}</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  AI 비전 명세서 추출 후 값이 자동으로 매핑되어 채워질 수 있습니다.
                </p>
              </div>
              <button 
                onClick={() => { setIsItemModalOpen(false); resetItemForm(); }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 폼 바디 */}
            <form onSubmit={handleItemSubmit}>
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                
                {/* 자재 vs 제품 타입 */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">품목 종류</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!!selectedItem}
                      onClick={() => setItemForm(prev => ({ ...prev, type: 'material' }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        itemForm.type === 'material'
                          ? 'border-blue-500 bg-blue-50 text-blue-950'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      자재 (공급 단가 & 거래처 관리)
                    </button>
                    <button
                      type="button"
                      disabled={!!selectedItem}
                      onClick={() => setItemForm(prev => ({ ...prev, type: 'product' }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        itemForm.type === 'product'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      제품 (매출 단가 관리)
                    </button>
                  </div>
                </div>

                {/* 1. 카테고리 & 품목명 (순서 변경: 카테고리가 선두로 올라옴) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">카테고리</label>
                    <input
                      type="text"
                      required
                      value={itemForm.category}
                      onChange={(e) => setItemForm(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="예: 전동부품"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">품목명</label>
                    <input
                      type="text"
                      required
                      value={itemForm.name}
                      onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="예: 초경량 모터"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* 2. 규격 & 단위 구분 (스펙이 카테고리/품목 바로 밑에 위치) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">규격 (세부 스펙)</label>
                    <input
                      type="text"
                      value={itemForm.spec}
                      onChange={(e) => setItemForm(prev => ({ ...prev, spec: e.target.value }))}
                      placeholder="예: 15mm x 150mm, 250g, 13온스"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">입출고 단위 구분</label>
                    <select
                      value={itemForm.unitType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItemForm(prev => {
                          const newForm = { ...prev, unitType: val };
                          if (val === 'count') {
                            newForm.unitValue = '개';
                            newForm.boxContains = '';
                          } else if (val === 'weight') {
                            newForm.unitValue = 'g';
                            newForm.boxContains = '';
                          } else if (val === 'box') {
                            newForm.unitValue = '박스';
                            newForm.boxContains = '10';
                          }
                          return newForm;
                        });
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white font-semibold cursor-pointer"
                    >
                      <option value="count">개수 (개)</option>
                      <option value="weight">중량/부피 (g, kg, L 등)</option>
                      <option value="box">박스 (BOX)</option>
                    </select>
                  </div>
                </div>

                {/* 단위별 상세 입력 폼 (박스일 때 박스당 입수량(n개입) 동적 추가) */}
                {itemForm.unitType === 'weight' && (
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                    <div>
                      <label className="text-[10px] font-bold text-indigo-600 block mb-1">중량/부피 세부 단위</label>
                      <select
                        value={itemForm.unitValue}
                        onChange={(e) => setItemForm(prev => ({ ...prev, unitValue: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-250 text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-medium cursor-pointer"
                      >
                        <option value="g">g (그램)</option>
                        <option value="kg">kg (킬로그램)</option>
                        <option value="ton">ton (톤)</option>
                        <option value="ml">ml (밀리리터)</option>
                        <option value="L">L (리터)</option>
                        <option value="kL">kL (킬로리터)</option>
                        <option value="m3">m³ (세제곱미터)</option>
                        <option value="km3">km³ (세제곱킬로미터)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-indigo-600 block mb-1">단위 수량 (소수점 지원)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="n.00"
                        className="w-full px-3 py-2 rounded-lg border border-slate-250 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <span className="text-[9px] text-slate-400 mt-1 block">소수점 둘째 자리까지 지원</span>
                    </div>
                  </div>
                )}

                {itemForm.unitType === 'box' && (
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div>
                      <label className="text-[10px] font-bold text-indigo-600 block mb-1">박스당 입수량 (추가 단위 표시)</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          required
                          value={itemForm.boxContains}
                          onChange={(e) => setItemForm(prev => ({ ...prev, boxContains: e.target.value }))}
                          placeholder="10"
                          className="w-full px-3 py-2 rounded-lg border border-slate-250 pr-12 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-bold"
                        />
                        <span className="absolute right-3 text-[10px] text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">n개입</span>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-slate-650 font-semibold block">최종 규격화 단위명:</span>
                      <span className="text-xs font-bold text-indigo-655 mt-0.5 bg-indigo-50/50 border border-indigo-100 rounded-lg px-2 py-1 inline-block w-fit">
                        1박스 ({itemForm.boxContains || '10'}개입)
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. 공급 단가 (매입가) & 주 매입 거래처 (순서 매칭) */}
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {itemForm.type === 'material' ? '공급 단가 (매입가)' : '매출 단가 (판매가)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400">₩</span>
                      <input
                        type="number"
                        required
                        value={itemForm.price}
                        onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none animate-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {itemForm.type === 'material' ? '주 매입 거래처' : '주요 거래처'}
                    </label>
                    <input
                      type="text"
                      value={itemForm.partner || ''}
                      onChange={(e) => setItemForm(prev => ({ ...prev, partner: e.target.value }))}
                      placeholder={itemForm.type === 'material' ? '예: 한성정밀' : '예: 주요 거래처'}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* 4. 창고 적재 위치 & 안전(적정) 재고량 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">창고 적재 위치</label>
                    <input
                      type="text"
                      value={itemForm.location || ''}
                      onChange={(e) => setItemForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="예: A홀 3번 선반"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">안전(적정) 재고량</label>
                    <input
                      type="number"
                      required
                      value={itemForm.safeStock}
                      onChange={(e) => setItemForm(prev => ({ ...prev, safeStock: e.target.value }))}
                      placeholder="10"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* 5. 최초 기초 재고 (수정 시에는 비노출) */}
                {!selectedItem && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">최초 기초 재고</label>
                      <input
                        type="number"
                        required
                        value={itemForm.stock}
                        onChange={(e) => setItemForm(prev => ({ ...prev, stock: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 비고 및 상세 설명 */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">비고 및 상세 설명</label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="품목에 대한 고유 규격이나 품질 체크 포인트 등을 자유롭게 기록하세요."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  ></textarea>
                </div>

              </div>

              {/* 모달 푸터 버튼 */}
              <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsItemModalOpen(false); resetItemForm(); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 flex items-center space-x-1.5"
                >
                  <span>{selectedItem ? '수정 완료' : '품목 등록'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* 6. 입고 / 출고 / 실사 조정 통합 모달 (NLP AI 자동 바인딩 지원) */}
      {/* ========================================================================= */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* 모달 헤더 */}
            <div className={`text-white px-6 py-5 flex items-center justify-between ${
              txType === 'in' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700' 
                : txType === 'out' 
                ? 'bg-gradient-to-r from-rose-600 to-red-700' 
                : 'bg-gradient-to-r from-purple-600 to-indigo-700'
            }`}>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  <span>
                    {txType === 'in' ? '안전재고 매입 입고' : txType === 'out' ? '출고 등록 (AI 자동완성 연동)' : '재고 실사 수량 보정'}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-200 mt-1">
                  {txType === 'out' 
                    ? 'AI 음성/자연어 명령 파싱 실행 시 폼에 내용이 즉시 채워집니다.' 
                    : '정확한 수량을 입력하여 현재고를 안전하게 보존합니다.'}
                </p>
              </div>
              <button 
                onClick={() => { setIsTxModalOpen(false); resetTxForm(); }}
                className="text-slate-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 폼 바디 */}
            <form onSubmit={handleTxSubmit}>
              <div className="p-6 space-y-4">
                
                {/* 대상 품목 선택 */}
                <div className={`transition-all duration-350 ${highlightFields.itemId ? 'ring-2 ring-emerald-500 rounded-xl p-1 bg-emerald-50/50' : ''}`}>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">대상 품목</label>
                  <select
                    required
                    value={txForm.itemId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const matchedItem = items.find(it => String(it.id) === selectedId);
                      setTxForm(prev => ({
                        ...prev,
                        itemId: selectedId,
                        price: matchedItem ? String(matchedItem.price) : ''
                      }));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="">-- 재고 품목을 선택하세요 --</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.type === 'material' ? '자재' : '제품'}] {item.name} (현재고: {item.stock}개)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 변동 수량 & 단가 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`transition-all duration-350 ${highlightFields.quantity ? 'ring-2 ring-emerald-500 rounded-xl p-1 bg-emerald-50/50' : ''}`}>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {txType === 'adjust' ? '실사 최종 수량' : '수량'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={txForm.quantity}
                      onChange={(e) => setTxForm(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">단가</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400">₩</span>
                      <input
                        type="number"
                        required
                        value={txForm.price}
                        onChange={(e) => setTxForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 담당자 */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">담당 실무자</label>
                  <input
                    type="text"
                    required
                    value={txForm.operator}
                    onChange={(e) => setTxForm(prev => ({ ...prev, operator: e.target.value }))}
                    placeholder="홍길동 과장"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* 메모 및 변동 사유 */}
                <div className={`transition-all duration-350 ${highlightFields.note ? 'ring-2 ring-emerald-500 rounded-xl p-1 bg-emerald-50/50' : ''}`}>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">변동 사유 / 메모</label>
                  <textarea
                    value={txForm.note}
                    onChange={(e) => setTxForm(prev => ({ ...prev, note: e.target.value }))}
                    placeholder={
                      txType === 'in' 
                        ? '거래처 납품 건, 정기 조달 등 입고 메모' 
                        : txType === 'out' 
                        ? '고객 발송 건, 생산라인 공급 등 출고 메모' 
                        : '정기 창고 전수 조사 실사 조정 사유'
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  ></textarea>
                </div>

              </div>

              {/* 모달 푸터 버튼 */}
              <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsTxModalOpen(false); resetTxForm(); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center space-x-1.5 ${
                    txType === 'in' 
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' 
                      : txType === 'out' 
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' 
                      : 'bg-purple-600 hover:bg-purple-700 shadow-purple-100'
                  }`}
                >
                  <span>
                    {txType === 'in' ? '입고 승인' : txType === 'out' ? '출고 승인' : '보정 완료'}
                  </span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. 엑셀 업로드 서식 도움말 모달 */}
      {/* ========================================================================= */}
      {showExcelGuideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-300" />
                  <span>엑셀 일괄 등록 서식 가이드</span>
                </h3>
                <p className="text-[10px] text-slate-300 mt-1">
                  점주님의 엑셀 파일 첫 행(헤더) 컬럼을 시스템에 매핑하는 기준입니다.
                </p>
              </div>
              <button 
                onClick={() => setShowExcelGuideModal(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 바디 */}
            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto text-xs text-slate-600">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-indigo-950 font-medium">
                💡 **편리한 한글 분석 지원**: 첫 행(헤더)에 아래 예시의 컬럼명 중 하나가 기입되어 있으면, 단어가 조금 다르더라도 시스템이 자동으로 유추하여 안전하게 등록합니다.
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">매핑 필드</th>
                      <th className="p-2.5">엑셀 추천 명칭 (헤더 예시)</th>
                      <th className="p-2.5">필수 여부</th>
                      <th className="p-2.5">기입 룰 / 예시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-500">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">종류 (Type)</td>
                      <td className="p-2.5 text-indigo-600 font-semibold">종류, 구분, type</td>
                      <td className="p-2.5 text-red-500 font-bold">기본 '자재'</td>
                      <td className="p-2.5">**자재** 또는 **제품** 기입</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">품목명 (Name)</td>
                      <td className="p-2.5 text-indigo-600 font-semibold">품목명, 이름, name</td>
                      <td className="p-2.5 text-red-500 font-bold">필수</td>
                      <td className="p-2.5">예: 초경량 모터 V2 (중복 시 스킵)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">카테고리</td>
                      <td className="p-2.5 text-indigo-600 font-semibold">카테고리, 분류, category</td>
                      <td className="p-2.5 text-red-500 font-bold">필수</td>
                      <td className="p-2.5">예: 전동부품, 리빙웨어</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">규격 (Spec)</td>
                      <td className="p-2.5 text-indigo-600 font-semibold">규격, 세부 스펙, spec</td>
                      <td className="p-2.5 text-slate-400">선택</td>
                      <td className="p-2.5">예: 15mm x 150mm, 250g</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">단위 구분</td>
                      <td className="p-2.5 text-indigo-600 font-semibold">단위, 단위 구분, unitType</td>
                      <td className="p-2.5 text-slate-400">선택</td>
                      <td className="p-2.5">**개수**, **중량**, **박스** 중 기입</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">박스당 수량</td>
                      <td className="p-2.5 text-indigo-600 font-semibold">박스당 입수량, n개입</td>
                      <td className="p-2.5 text-slate-400">선택</td>
                      <td className="p-2.5">단위가 \'박스\'일 때 숫자 기입 (예: 10)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">단가 (Price)</td>
                      <td className="p-2.5 text-indigo-600 font-semibold">단가, 공급 단가, 매입가, 판매가</td>
                      <td className="p-2.5 text-red-500 font-bold">필수</td>
                      <td className="p-2.5">숫자 기입 (예: 12500)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">거래처 (Partner)</td>
                      <td className="p-2.5 text-indigo-600 font-semibold">거래처, 매입처, partner</td>
                      <td className="p-2.5 text-slate-400">선택</td>
                      <td className="p-2.5">예: 한성정밀(주)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">적재 위치</td>
                      <td className="p-2.5 text-indigo-600 font-semibold">적재 위치, 창고 위치, location</td>
                      <td className="p-2.5 text-slate-400">선택</td>
                      <td className="p-2.5">예: A홀 3번 선반</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">안전 재고</td>
                      <td className="p-2.5 text-indigo-600 font-semibold">안전 재고, 적정 재고, safeStock</td>
                      <td className="p-2.5 text-red-500 font-bold">필수</td>
                      <td className="p-2.5">숫자 기입 (예: 15)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">최초 재고</td>
                      <td className="p-2.5 text-indigo-600 font-semibold">최초 재고, 현재 재고, stock</td>
                      <td className="p-2.5 text-red-500 font-bold">필수</td>
                      <td className="p-2.5">숫자 기입 (기초 재고 및 입고 이력 연동)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 푸터 */}
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 flex items-center space-x-1.5"
              >
                <FileText className="w-4 h-4 text-indigo-200" />
                <span>표준 서식 샘플(.xlsx) 다운로드</span>
              </button>
              <button
                type="button"
                onClick={() => setShowExcelGuideModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
              >
                가이드 닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
