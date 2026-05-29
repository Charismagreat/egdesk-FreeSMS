'use client';

import React from 'react';
import { 
  FileText, Search, Calendar, Filter, Sparkles, Check, X, AlertCircle, 
  RefreshCw, ChevronLeft, Undo, Coins, TrendingDown, Layers, Tag
} from 'lucide-react';
import { useExpenses, Expense } from '@/hooks/useExpenses';
import Link from 'next/link';

export default function MobileApprovePage() {
  const {
    expenses,
    fetchExpenses,
    handleApproveExpense,
    dbCategories,
    dbTags,
    dbDepartments,
    dbEmployees,
    dbProjects,
    autocompleteData
  } = useExpenses();

  // 1. 모바일 탭 관리 상태 (대기, 전체, 반려/보류)
  const [activeTab, setActiveTab] = React.useState<'pending' | 'all' | 'rejected_hold'>('pending');

  // 1-2. 모바일 결재 상세 내 첨부파일 원본 보기 아코디언 토글 상태
  const [showAttachment, setShowAttachment] = React.useState(false);

  // 1-3. 대표자 모바일 즉석 수정(금액 포함) 폼 상태 변수
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState('');
  const [editAmount, setEditAmount] = React.useState<number>(0);
  const [editCategory, setEditCategory] = React.useState('');
  const [editPaymentMethod, setEditPaymentMethod] = React.useState('');
  const [editExpenseDate, setEditExpenseDate] = React.useState('');
  const [editMemo, setEditMemo] = React.useState('');
  const [editActualExpenseDate, setEditActualExpenseDate] = React.useState('');
  const [editDeductionAmount, setEditDeductionAmount] = React.useState<number>(0);
  const [editTransferFee, setEditTransferFee] = React.useState<number>(0);

  // 1-4. 반려/보류 음성 인식(Speech-to-Text) 보조 상태 변수
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  // 1-5. 대표자 모바일 수정 화면 내 '@' 태그 자동완성 보조 상태 변수
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [searchWord, setSearchWord] = React.useState('');
  const [atIndex, setAtIndex] = React.useState(-1);
  const [activeSuggestIndex, setActiveSuggestIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // 전체 자동완성 후보군 취합 (모바일)
  const allSuggestItems = React.useMemo(() => {
    const items: Array<{ label: string; value: string; type: 'partner' | 'staff' | 'department' | 'project' }> = [];
    
    if (dbEmployees) {
      dbEmployees.forEach(emp => {
        items.push({ label: emp.name, value: emp.name, type: 'staff' });
      });
    }
    if (dbDepartments) {
      dbDepartments.forEach(dept => {
        items.push({ label: dept.name, value: dept.name, type: 'department' });
      });
    }
    if (dbProjects) {
      dbProjects.forEach(proj => {
        items.push({ label: proj.name, value: proj.name, type: 'project' });
      });
    }
    if (autocompleteData?.partners) {
      autocompleteData.partners.forEach(name => {
        items.push({ label: name, value: name, type: 'partner' });
      });
    }
    return items;
  }, [dbEmployees, dbDepartments, dbProjects, autocompleteData]);

  // 필터링된 추천 항목 목록 연산 (모바일)
  const filteredSuggestions = React.useMemo(() => {
    if (!showSuggestions) return [];
    const cleanWord = searchWord.toLowerCase().trim();
    if (!cleanWord) {
      // 검색어가 비어있을 때는 타입별로 앞의 몇 개만 취함
      const staffGroup = allSuggestItems.filter(i => i.type === 'staff').slice(0, 3);
      const deptGroup = allSuggestItems.filter(i => i.type === 'department').slice(0, 3);
      const partnerGroup = allSuggestItems.filter(i => i.type === 'partner').slice(0, 3);
      const projGroup = allSuggestItems.filter(i => i.type === 'project').slice(0, 3);
      return [...staffGroup, ...deptGroup, ...partnerGroup, ...projGroup];
    }
    return allSuggestItems.filter(item => 
      item.label.toLowerCase().includes(cleanWord)
    );
  }, [allSuggestItems, showSuggestions, searchWord]);

  // 자동완성 항목 선택 적용 핸들러 (모바일)
  const selectSuggestion = (item: { label: string; value: string; type: string }) => {
    const value = editTitle;
    const cursorPos = inputRef.current?.selectionStart || 0;
    
    const textBefore = value.slice(0, atIndex);
    const textAfter = value.slice(cursorPos);
    
    const replacement = `@${item.label} `;
    const newValue = textBefore + replacement + textAfter;
    
    setEditTitle(newValue);
    setShowSuggestions(false);
    
    // 포커스 회복
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = atIndex + replacement.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  // 인풋 실시간 @ 입력 감지 리스너 (모바일)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    setEditTitle(value);
    
    const beforeCursor = value.slice(0, cursorPos);
    const lastAtIdx = beforeCursor.lastIndexOf("@");
    
    if (lastAtIdx !== -1) {
      const wordAfterAt = beforeCursor.slice(lastAtIdx + 1);
      const hasSpace = /\s/.test(wordAfterAt);
      
      if (!hasSpace) {
        setShowSuggestions(true);
        setSearchWord(wordAfterAt);
        setAtIndex(lastAtIdx);
        setActiveSuggestIndex(0);
        return;
      }
    }
    
    setShowSuggestions(false);
  };

  // 인풋 키보드 조작 인터셉트 리스너 (모바일)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestIndex(prev => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      selectSuggestion(filteredSuggestions[activeSuggestIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowSuggestions(false);
    }
  };

  // 지출 태그 쉼표 구분 토글 헬퍼 (모바일)
  const toggleEditTag = (tag: string) => {
    const currentMemo = editMemo || "";
    let tags = currentMemo
      .split(",")
      .map(t => t.trim())
      .filter(t => t !== "");

    if (tags.includes(tag)) {
      tags = tags.filter(t => t !== tag);
    } else {
      tags.push(tag);
    }
    
    setEditMemo(tags.join(", "));
  };

  // 2. 실시간 다차원 지출 분석 필터 상태
  const [statsRange, setStatsRange] = React.useState<'all' | 'today' | 'week' | 'month' | '3month'>('all');
  const [statsCategory, setStatsCategory] = React.useState<string>('ALL');
  const [statsTag, setStatsTag] = React.useState<string>('ALL');

  // 3. 모바일 대장 검색어 상태
  const [searchQuery, setSearchQuery] = React.useState('');

  // 4. 결재 의견 입력 및 상세 보기 모달 제어용 상태
  const [selectedExpense, setSelectedExpense] = React.useState<Expense | null>(null);
  const [approvalOpinion, setApprovalOpinion] = React.useState('');
  const [opinionModalType, setOpinionModalType] = React.useState<'REJECTED' | 'HOLD' | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 🔄 selectedExpense가 바뀔 때 수정 폼 데이터 자동 바인딩 및 동기화
  React.useEffect(() => {
    if (selectedExpense) {
      setEditTitle(selectedExpense.title);
      setEditAmount(selectedExpense.amount);
      setEditCategory(selectedExpense.category);
      setEditPaymentMethod(selectedExpense.payment_method);
      setEditExpenseDate(selectedExpense.expense_date);
      setEditMemo(selectedExpense.memo || '');
      setEditActualExpenseDate(selectedExpense.actual_expense_date || '');
      setEditDeductionAmount(selectedExpense.deduction_amount || 0);
      setEditTransferFee(selectedExpense.transfer_fee || 0);
      setIsEditing(false); // 새로운 창이 열릴 때는 뷰 모드로 시작
    }
  }, [selectedExpense]);

  // 📂 계정과목 대/중/소 동적 역산 매핑 헬퍼
  const getCategoryDetails = React.useCallback((subCat: string) => {
    if (!subCat) return { main: "기타", mid: "기타", sub: "-" };

    // 1. DB 연동 데이터에서 소분류가 일치하는지 먼저 실시간 역탐색
    const dbMatch = dbCategories?.find(c => c.sub_category === subCat);
    if (dbMatch) {
      return {
        main: dbMatch.main_category,
        mid: dbMatch.mid_category,
        sub: dbMatch.sub_category
      };
    }

    // 2. Fallback: 하드코딩 맵 기반 매핑 역탐색
    const ACCOUNT_CATEGORIES_MAP: Record<string, string[]> = {
      "판매비와관리비": ["복리후생비", "소모품비", "여비교통비", "임차료", "통신비", "세금과공과", "도서인쇄비", "회의비", "광고선전비", "교육훈련비", "차량유지비"],
      "제조/물류원가": ["외주가공비", "운반비", "포장비", "원재료비", "부재료비", "전력비", "가스수도비", "수선비", "임금", "잡급"],
      "영업외비용": ["이자비용", "기부금", "기타영업외비용"],
      "기타": ["잡손실", "기타소분류"]
    };

    for (const main of Object.keys(ACCOUNT_CATEGORIES_MAP)) {
      if (ACCOUNT_CATEGORIES_MAP[main].includes(subCat)) {
        return {
          main,
          mid: subCat, // 중분류명이 없는 전통적 맵일 땐 소분류명을 임시로 중분류로 활용
          sub: subCat
        };
      }
    }

    return {
      main: "기타",
      mid: "기타",
      sub: subCat
    };
  }, [dbCategories]);

  // 호환성용 getMainCategory
  const getMainCategory = React.useCallback((subCat: string): string => {
    return getCategoryDetails(subCat).main;
  }, [getCategoryDetails]);

  // 🏷️ 적요란 '@' 태그 파싱 헬퍼 함수
  const getTaggedInfo = React.useCallback((title: string) => {
    if (!title) return { department: "-", staff: "-", project: "-" };
    const regex = /@([^\s@]+)/g;
    let match;
    let department = "-";
    let staff = "-";
    let project = "-";
    
    while ((match = regex.exec(title)) !== null) {
      const name = match[1];
      if (dbEmployees?.some(e => e.name === name)) {
        staff = name;
      } else if (dbDepartments?.some(d => d.name === name)) {
        department = name;
      } else if (dbProjects?.some(p => p.name === name)) {
        project = name;
      }
    }
    return { department, staff, project };
  }, [dbEmployees, dbDepartments, dbProjects]);

  // 📅 기간 계산 헬퍼
  const getStartDateLimit = (range: typeof statsRange) => {
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    now.setHours(0,0,0,0);
    if (range === 'today') return now.toISOString().slice(0, 10);
    if (range === 'week') {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 10);
    }
    if (range === 'month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().slice(0, 10);
    }
    if (range === '3month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return d.toISOString().slice(0, 10);
    }
    return '';
  };

  // 📊 1. 다차원 필터링에 기반한 실시간 지출 집계 연산 (Aggregation)
  const filteredForStats = React.useMemo(() => {
    return expenses.filter(exp => {
      // 1-1. 기간 필터
      const startLimit = getStartDateLimit(statsRange);
      if (startLimit && exp.expense_date < startLimit) return false;
      
      // 1-2. 계정과목 대분류 필터
      if (statsCategory !== 'ALL') {
        const mainCat = getMainCategory(exp.category);
        if (mainCat !== statsCategory) return false;
      }

      // 1-3. 태그 필터
      if (statsTag !== 'ALL') {
        if (!exp.memo || !exp.memo.split(',').map(t => t.trim()).includes(statsTag)) return false;
      }

      return true;
    });
  }, [expenses, statsRange, statsCategory, statsTag]);

  // 실시간 합계 금액 계산 (최종 실지출액 기준)
  const totalStatsAmount = React.useMemo(() => {
    return filteredForStats.reduce((sum, exp) => sum + ((Number(exp.amount) || 0) - (Number(exp.deduction_amount) || 0) + (Number(exp.transfer_fee) || 0)), 0);
  }, [filteredForStats]);

  // 🏷️ 고유 태그 목록 계산 (필터링 드롭다운용)
  const allUniqueTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    expenses.forEach(exp => {
      if (exp.memo) {
        exp.memo.split(',').map(t => t.trim()).filter(Boolean).forEach(t => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet);
  }, [expenses]);

  // 📋 2. 모바일 메인 결재/검색 리스트 필터링 연산
  const mainFilteredExpenses = React.useMemo(() => {
    return expenses.filter(exp => {
      // 2-1. 탭별 분기
      const status = exp.approval_status || 'PENDING';
      if (activeTab === 'pending') {
        if (status !== 'PENDING') return false;
      } else if (activeTab === 'rejected_hold') {
        if (status !== 'REJECTED' && status !== 'HOLD') return false;
      }

      // 2-2. 검색어 필터 (전체 탭 등에서 가동)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = exp.title.toLowerCase().includes(query);
        const matchesMemo = exp.memo ? exp.memo.toLowerCase().includes(query) : false;
        const matchesCategory = exp.category.toLowerCase().includes(query);
        const matchesPayee = (() => {
          try {
            const parsed = JSON.parse(exp.ai_analysis || '{}');
            return parsed.payee ? parsed.payee.toLowerCase().includes(query) : false;
          } catch(e) { return false; }
        })();

        if (!matchesTitle && !matchesMemo && !matchesCategory && !matchesPayee) return false;
      }

      return true;
    });
  }, [expenses, activeTab, searchQuery]);

  // 🟢 승인 즉시 처리 핸들러
  const handleDirectApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("🟢 이 지출 건을 즉시 결재 승인하시겠습니까?")) return;
    
    setIsSubmitting(true);
    const res = await handleApproveExpense(id, 'APPROVED', '대표자 모바일 원클릭 승인 완료');
    setIsSubmitting(false);

    if (res.success) {
      alert("✅ 승인 처리가 정상적으로 완료되었습니다.");
      setSelectedExpense(null);
    } else {
      alert("❌ 승인 실패: " + res.error);
    }
  };

  // 🔄 보류/반려 재심사 처리 핸들러
  const handleReconsiderApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("🔄 이 보류/반려 건에 대해 재심사 후 즉시 승인 처리하시겠습니까?")) return;
    
    setIsSubmitting(true);
    const res = await handleApproveExpense(id, 'APPROVED', '재심사 및 즉시 승인 완료');
    setIsSubmitting(false);

    if (res.success) {
      alert("✅ 재심사 승인이 완료되었습니다.");
    } else {
      alert("❌ 처리 실패: " + res.error);
    }
  };

  // 🔴/🟡 반려/보류 최종 전산 처리 제출 핸들러
  const handleOpinionSubmit = async () => {
    if (!selectedExpense || !opinionModalType) return;
    if (!approvalOpinion.trim()) {
      alert("⚠️ 반려 또는 보류 사유를 반드시 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    const res = await handleApproveExpense(selectedExpense.id, opinionModalType, approvalOpinion.trim());
    setIsSubmitting(false);

    if (res.success) {
      alert(`✅ 정상적으로 [${opinionModalType === 'REJECTED' ? '반려' : '보류'}] 처리되었습니다.`);
      setApprovalOpinion('');
      setOpinionModalType(null);
      setSelectedExpense(null);
    } else {
      alert("❌ 처리 실패: " + res.error);
    }
  };

  // 🗑️ 대표자 지출 즉시 영구 삭제 핸들러 (모바일 전산 삭제)
  const handleDeleteDirect = async (id: string) => {
    if (!confirm("🚨 이 지출 건을 대장에서 완전히 영구 삭제하시겠습니까?\n삭제된 건은 절대 복구할 수 없습니다.")) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      setIsSubmitting(false);

      if (json.success) {
        alert("✅ 지출 내역이 대장에서 성공적으로 완전히 소거되었습니다.");
        setSelectedExpense(null);
        fetchExpenses(); // 목록 동기화
      } else {
        alert("❌ 삭제 처리 실패: " + json.error);
      }
    } catch (e: any) {
      setIsSubmitting(false);
      alert("❌ 통신 오류: " + e.message);
    }
  };

  // 💾 대표자 지출 기입 정보 즉시 갱신 핸들러 (모바일 금액 포함 수정)
  const handleUpdateDirect = async () => {
    if (!selectedExpense) return;
    if (!editTitle.trim()) {
      alert("⚠️ 지출 명세(적요)를 반드시 기입해 주세요.");
      return;
    }
    if (Number(editAmount) <= 0) {
      alert("⚠️ 올바른 지출 금액을 지정해 주세요.");
      return;
    }
    if (!editCategory) {
      alert("⚠️ 계정과목 소분류를 지정해 주세요.");
      return;
    }
    if (!editExpenseDate) {
      alert("⚠️ 품의일자를 입력해 주세요.");
      return;
    }
    if (!editPaymentMethod) {
      alert("⚠️ 결제 수단을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedExpense.id,
          title: editTitle.trim(),
          category: editCategory,
          amount: Number(editAmount),
          expense_date: editExpenseDate,
          payment_method: editPaymentMethod,
          attachment_url: selectedExpense.attachment_url || '',
          ai_analysis: selectedExpense.ai_analysis || '',
          memo: editMemo.trim(),
          actual_expense_date: editActualExpenseDate || null,
          deduction_amount: editDeductionAmount,
          transfer_fee: editTransferFee
        })
      });
      const json = await res.json();
      setIsSubmitting(false);

      if (json.success) {
        alert("✅ 지출 명세가 성공적으로 갱신 적용되었습니다.");
        setIsEditing(false);
        // 상세 결재 뷰어도 즉시 업데이트 반영
        setSelectedExpense({
          ...selectedExpense,
          title: editTitle.trim(),
          category: editCategory,
          amount: Number(editAmount),
          expense_date: editExpenseDate,
          payment_method: editPaymentMethod,
          memo: editMemo.trim(),
          actual_expense_date: editActualExpenseDate || null,
          deduction_amount: editDeductionAmount,
          transfer_fee: editTransferFee
        });
        fetchExpenses(); // 목록 동기화
      } else {
        alert("❌ 정보 수정 실패: " + json.error);
      }
    } catch (e: any) {
      setIsSubmitting(false);
      alert("❌ 통신 오류: " + e.message);
    }
  };

  // 🎙️ Web Speech API 기반 음성 받아쓰기(STT) 비서 토글러
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("⚠️ 이 기기 또는 브라우저는 음성 인식을 지원하지 않습니다. 구글 크롬 또는 모바일 순정 브라우저를 이용해주세요.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'ko-KR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setApprovalOpinion(prev => {
            const base = prev.trim();
            return base ? `${base} ${transcript}` : transcript;
          });
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        alert("🎙️ 음성 인식 중 마이크 신호를 잃었거나 권한이 차단되었습니다.");
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error("Speech recognition start error:", e);
      setIsListening(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-20 shadow-2xl relative border-x border-slate-200">
      
      {/* 📱 최상단 내비게이션 바 */}
      <div className="bg-white border-b border-slate-100 p-4 sticky top-0 z-40 flex items-center justify-between shadow-3xs">
        <div className="flex items-center gap-2">
          <Link href="/expenses" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-1.5">
            <Coins className="w-5 h-5 text-rose-500" />
            <h1 className="text-sm font-black text-slate-800 tracking-tight">대표자 모바일 ERP 관제</h1>
          </div>
        </div>
        <span className="text-[9px] bg-rose-50 text-rose-700 font-extrabold px-2 py-0.5 rounded-full border border-rose-100 animate-pulse flex items-center gap-1">
          👑 대표자 세션
        </span>
      </div>

      <div className="p-4 space-y-4">
        
        {/* 📊 1. 실시간 다차원 지출 분석 전광판 */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-5 rounded-2xl shadow-md relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <TrendingDown className="w-20 h-20 text-white" />
          </div>
          
          <div className="flex items-center space-x-1.5 mb-3">
            <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
            <h2 className="text-[11px] font-black text-rose-300 tracking-tight uppercase">📊 실시간 지출 분석 전광판</h2>
          </div>
          
          {/* 다차원 집계 필터 컨트롤 영역 */}
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {/* 기간 필터 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-1">
              <span className="block text-[8px] text-slate-400 font-extrabold pl-1 mb-0.5">조회 기간</span>
              <select 
                value={statsRange} 
                onChange={e => setStatsRange(e.target.value as any)}
                className="w-full bg-transparent text-[10px] font-black text-white border-none outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">전체 기간</option>
                <option value="today" className="bg-slate-900">오늘</option>
                <option value="week" className="bg-slate-900">1주일</option>
                <option value="month" className="bg-slate-900">1개월</option>
                <option value="3month" className="bg-slate-900">3개월</option>
              </select>
            </div>
            
            {/* 계정과목 필터 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-1">
              <span className="block text-[8px] text-slate-400 font-extrabold pl-1 mb-0.5">계정 대분류</span>
              <select 
                value={statsCategory} 
                onChange={e => setStatsCategory(e.target.value)}
                className="w-full bg-transparent text-[10px] font-black text-white border-none outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">전체 비목</option>
                <option value="판매비와관리비" className="bg-slate-900">판관비</option>
                <option value="제조/물류원가" className="bg-slate-900">제조/물류</option>
                <option value="영업외비용" className="bg-slate-900">영업외비</option>
                <option value="기타" className="bg-slate-900">기타</option>
              </select>
            </div>

            {/* 태그 필터 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-1">
              <span className="block text-[8px] text-slate-400 font-extrabold pl-1 mb-0.5">태그 검색</span>
              <select 
                value={statsTag} 
                onChange={e => setStatsTag(e.target.value)}
                className="w-full bg-transparent text-[10px] font-black text-white border-none outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">전체 태그</option>
                {allUniqueTags.map(tag => (
                  <option key={tag} value={tag} className="bg-slate-900">#{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 집계 총합 표시 */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold leading-none">선택 조건 내 누적 지출액</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-xl font-extrabold text-white tracking-tight leading-none font-mono">
                {totalStatsAmount.toLocaleString()}
              </span>
              <span className="text-xs font-black text-slate-350">원</span>
            </div>
            <span className="text-[8px] text-rose-350 font-bold mt-1.5 pl-0.5 block">
              💡 실시간 필터 조합 결과 ({filteredForStats.length}건 집계됨)
            </span>
          </div>
        </div>

        {/* 📱 3단 탭 인터페이스 헤더 */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/50">
          <button 
            onClick={() => { setActiveTab('pending'); }}
            className={`flex-1 py-2 text-center rounded-lg font-black text-[10px] transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white text-slate-850 shadow-3xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ⏳ 결재 대기 ({expenses.filter(e => e.approval_status === 'PENDING' || !e.approval_status).length})
          </button>
          
          <button 
            onClick={() => { setActiveTab('all'); }}
            className={`flex-1 py-2 text-center rounded-lg font-black text-[10px] transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-slate-850 shadow-3xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📋 전체 대장
          </button>
          
          <button 
            onClick={() => { setActiveTab('rejected_hold'); }}
            className={`flex-1 py-2 text-center rounded-lg font-black text-[10px] transition-all cursor-pointer ${
              activeTab === 'rejected_hold'
                ? 'bg-white text-slate-850 shadow-3xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🚫 반려/보류 ({expenses.filter(e => e.approval_status === 'REJECTED' || e.approval_status === 'HOLD').length})
          </button>
        </div>

        {/* 🔍 실시간 상시 검색창 */}
        <div className="relative w-full shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input 
            type="text"
            placeholder="품명, 메모, 거래처, 계정 과목 실시간 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-[11px] bg-white font-bold text-slate-800"
          />
        </div>

        {/* 📋 모바일 카드 피드 리스트 */}
        <div className="space-y-3.5">
          {mainFilteredExpenses.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-[11px] font-black">
                {searchQuery.trim() ? "검색 조건에 매칭되는 지출 내역이 없습니다." : (
                  <>
                    {activeTab === 'pending' && "결재 심사를 대기 중인 지출 내역이 없습니다."}
                    {activeTab === 'all' && "등록된 지출 대장 내역이 없습니다."}
                    {activeTab === 'rejected_hold' && "반려 혹은 보류된 지출 건이 없습니다."}
                  </>
                )}
              </p>
            </div>
          ) : (
            mainFilteredExpenses.map((exp) => {
              const mainCat = getMainCategory(exp.category);
              const isPending = (exp.approval_status || 'PENDING') === 'PENDING';
              const isRejected = exp.approval_status === 'REJECTED';
              const isHold = exp.approval_status === 'HOLD';
              
              return (
                <div 
                  key={exp.id}
                  onClick={() => { setSelectedExpense(exp); setShowAttachment(false); }}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-3xs hover:border-rose-200 transition-all cursor-pointer relative"
                >
                  
                  {/* 카드 헤더 (날짜 및 상태 뱃지) */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] text-slate-450 font-bold font-mono">{exp.expense_date}</span>
                    
                    {/* HSL 결재 상태 배지 */}
                    {(() => {
                      if (isPending) return <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[8px] font-black">⏳ 결재 대기</span>;
                      if (isRejected) return <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[8px] font-black">🔴 반려됨</span>;
                      if (isHold) return <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[8px] font-black">🟡 결재 보류</span>;
                      return <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-black">🟢 승인 완료</span>;
                    })()}
                  </div>

                  {/* 카드 내용 */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-slate-800 whitespace-pre-line leading-relaxed">{exp.title}</h3>
                    
                    {/* 계정과목 & 금액 */}
                    <div className="flex items-center justify-between pt-1.5">
                      <span className="inline-flex px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[8px] font-extrabold text-slate-500">
                        {mainCat} 〉 {exp.category}
                      </span>
                      <span className="text-xs font-black text-slate-850 font-mono">
                        {exp.amount.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* 지출 태그들 */}
                  {exp.memo && (
                    <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t border-slate-50">
                      {exp.memo.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <span key={tag} className="inline-flex items-center text-[7.5px] font-bold text-slate-450">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 반려/보류 사유 명시 */}
                  {(isRejected || isHold) && exp.approval_memo && (
                    <div className="mt-2.5 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-bold text-slate-500 whitespace-pre-line">
                      💬 {isRejected ? '반려' : '보류'} 의견: {exp.approval_memo}
                    </div>
                  )}

                  {/* 🔄 보류/반려 탭일 때의 "재심사 및 즉시 승인" 버튼 */}
                  {activeTab === 'rejected_hold' && (
                    <div className="mt-3 flex justify-end" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleReconsiderApprove(exp.id, e)}
                        disabled={isSubmitting}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[9px] font-black flex items-center gap-1 shadow-3xs transition-all active:scale-95 cursor-pointer"
                      >
                        <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
                        재심사 및 즉시 승인
                      </button>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ================= 상세 기안 검수 모달 ================= */}
      {selectedExpense && (() => {
        const catDetails = getCategoryDetails(selectedExpense.category);
        const taggedInfo = getTaggedInfo(selectedExpense.title);
        const hasTags = taggedInfo.department !== "-" || taggedInfo.staff !== "-" || taggedInfo.project !== "-";
        
        const aiPayee = (() => {
          try {
            const parsed = JSON.parse(selectedExpense.ai_analysis || '{}');
            return parsed.payee || '';
          } catch(e) { return ''; }
        })();
        
        const isPdf = selectedExpense.attachment_url?.toLowerCase().endsWith('.pdf');

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end justify-center p-0">
            <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl border-t border-slate-100 animate-slide-up">
              
              {/* 모달 헤더 */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <h4 className="text-xs font-black text-slate-800">
                    {isEditing ? "✏️ 지출 명세 즉석 수정" : "🔍 기안서 정밀 상세 검수"}
                  </h4>
                </div>
                <button 
                  onClick={() => { setSelectedExpense(null); setIsEditing(false); }}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 모달 본문 - 스크롤 가능 영역 */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 text-slate-700">
                
                {isEditing ? (
                  /* ✏️ 수정 모드 폼 */
                  <div className="space-y-3.5">
                    {/* 적요(품명) */}
                    <div className="relative">
                      <label className="block text-[9px] font-extrabold text-slate-450 mb-1">지출 명세(적요)</label>
                      <input 
                        ref={inputRef}
                        type="text"
                        value={editTitle}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        placeholder="예: 사무용 A4용지 구입 @개발부 @홍길동"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-[11px] bg-slate-50 focus:ring-2 focus:ring-rose-500 text-slate-800"
                      />
                      <span className="block text-[8px] text-slate-400 mt-1 pl-1">
                        💡 적요에 @부서명, @담당자명, @프로젝트명을 넣으면 자동 매핑됩니다.
                      </span>

                      {/* 🔮 플로팅 자동완성 드롭다운 (모바일 수정 화면 전용) */}
                      {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-60 animate-scale-up p-1">
                          {filteredSuggestions.map((item, index) => {
                            const isSelected = index === activeSuggestIndex;
                            return (
                              <div
                                key={`${item.type}-${item.value}`}
                                onClick={() => selectSuggestion(item)}
                                className={`flex items-center justify-between p-2 rounded-lg text-[10px] font-black cursor-pointer transition-colors ${
                                  isSelected ? "bg-rose-50 text-rose-700" : "hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {item.type === 'staff' && '👤'}
                                  {item.type === 'department' && '🏢'}
                                  {item.type === 'project' && '🚀'}
                                  {item.type === 'partner' && '🤝'}
                                  {item.label}
                                </span>
                                <span className="text-[7.5px] font-extrabold px-1 py-0.5 rounded bg-slate-100 text-slate-400">
                                  {item.type === 'staff' && '임직원'}
                                  {item.type === 'department' && '부서'}
                                  {item.type === 'project' && '프로젝트'}
                                  {item.type === 'partner' && '거래처'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 금액 */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 mb-1">품의 금액 (원)</label>
                      <input 
                        type="number"
                        value={editAmount}
                        onChange={e => setEditAmount(Number(e.target.value))}
                        placeholder="금액을 입력하세요"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-[11px] bg-slate-50 focus:ring-2 focus:ring-rose-500 text-slate-800"
                      />
                    </div>

                    {/* 계정과목 */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 mb-1">계정과목 소분류 지정</label>
                      <select 
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-[11px] bg-slate-50 focus:ring-2 focus:ring-rose-500 text-slate-855"
                      >
                        <option value="">계정과목 선택</option>
                        {dbCategories?.map(c => (
                          <option key={c.id} value={c.sub_category}>
                            [{c.main_category}] {c.sub_category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 실제 지출일, 공제액, 송금수수료 즉석 수정란 */}
                    {(() => {
                      const isApproved = selectedExpense.approval_status === 'APPROVED';
                      const isTransferOrCash = ['계좌송금', '계좌이체', '현금'].includes(editPaymentMethod);
                      const isEditable = isApproved && isTransferOrCash;

                      return (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/70 space-y-3">
                          <span className="block font-black text-slate-750 text-[9.5px]">💰 실제 지출 집행 상세 기입</span>
                          <div>
                            <label className={`block text-[8px] font-bold mb-0.5 ${!isEditable ? 'text-slate-400' : 'text-slate-450'}`}>실제 지출일</label>
                            <input 
                              type="date"
                              disabled={!isEditable}
                              value={editActualExpenseDate}
                              onChange={e => setEditActualExpenseDate(e.target.value)}
                              className={`w-full border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none font-bold text-[10.5px] transition-all ${
                                !isEditable 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-150' 
                                  : 'bg-white focus:ring-2 focus:ring-rose-500 text-slate-800'
                              }`}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className={`block text-[8px] font-bold mb-0.5 ${!isEditable ? 'text-slate-400' : 'text-slate-450'}`}>공제액 (₩)</label>
                              <input 
                                type="number"
                                disabled={!isEditable}
                                value={editDeductionAmount || ""}
                                onChange={e => setEditDeductionAmount(Number(e.target.value) || 0)}
                                placeholder="공제액"
                                className={`w-full border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none font-bold text-[10.5px] transition-all ${
                                  !isEditable 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-150' 
                                    : 'bg-white focus:ring-2 focus:ring-rose-500 text-slate-850'
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block text-[8px] font-bold mb-0.5 ${!isEditable ? 'text-slate-400' : 'text-slate-450'}`}>송금수수료 (₩)</label>
                              <input 
                                type="number"
                                disabled={!isEditable}
                                value={editTransferFee || ""}
                                onChange={e => setEditTransferFee(Number(e.target.value) || 0)}
                                placeholder="송금수수료"
                                className={`w-full border border-slate-250 rounded-xl px-2.5 py-1.5 outline-none font-bold text-[10.5px] transition-all ${
                                  !isEditable 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-150' 
                                    : 'bg-white focus:ring-2 focus:ring-rose-500 text-slate-855'
                                }`}
                              />
                            </div>
                          </div>

                          {/* 비활성화 시 모바일 룰 설명 추가 */}
                          {!isEditable && (
                            <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-[8px] font-bold text-amber-700 leading-normal">
                              ⚠️ 안내: 실제 지출일/공제액/수수료는 결제승인이 완료되고 결제수단이 '계좌송금' 또는 '현금'인 지출 건만 사후 수정 기입할 수 있습니다.
                            </div>
                          )}

                          {/* 실시간 최종 실지출액 프리뷰 */}
                          <div className="p-2 bg-slate-900 text-white rounded-lg flex items-center justify-between text-[9px] font-black border border-slate-850">
                            <span className="text-rose-350">💸 예상 실지급액:</span>
                            <span className="font-mono">
                              {((Number(editAmount) || 0) - (Number(editDeductionAmount) || 0) + (Number(editTransferFee) || 0)).toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 품의일자 및 결제 수단 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-450 mb-1">품의일자</label>
                        <input 
                          type="date"
                          value={editExpenseDate}
                          onChange={e => setEditExpenseDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-[11px] bg-slate-50 focus:ring-2 focus:ring-rose-500 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-450 mb-1">결제 수단</label>
                        <select
                          value={editPaymentMethod}
                          onChange={e => setEditPaymentMethod(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-[11px] bg-slate-50 focus:ring-2 focus:ring-rose-500 text-slate-850"
                        >
                          <option value="">결제 수단 선택</option>
                          <option value="법인카드">법인카드</option>
                          <option value="개인카드">개인카드</option>
                          <option value="현금">현금</option>
                          <option value="계좌이체">계좌이체</option>
                        </select>
                      </div>
                    </div>

                    {/* 메모/태그 */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 mb-1">지출 태그 목록 (쉼표 구분)</label>
                      <input 
                        type="text"
                        value={editMemo}
                        onChange={e => setEditMemo(e.target.value)}
                        placeholder="예: 비품, 소모품, 상반기"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-[11px] bg-slate-50 focus:ring-2 focus:ring-rose-500 text-slate-800"
                      />

                      {/* 프리셋 태그 추천 칩 목록 (모바일 전용 원클릭 토글 칩) */}
                      {dbTags && dbTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 max-h-24 overflow-y-auto p-0.5">
                          {dbTags.map(tag => {
                            const isSelected = (editMemo || "")
                              .split(",")
                              .map(t => t.trim())
                              .includes(tag.name);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleEditTag(tag.name)}
                                className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold border transition-all cursor-pointer ${
                                  isSelected 
                                    ? "bg-rose-500 border-rose-500 text-white shadow-3xs" 
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                #{tag.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 저장 / 취소 버튼 */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleUpdateDirect}
                        disabled={isSubmitting}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[10px] shadow-sm border-none cursor-pointer active:scale-95 transition-all"
                      >
                        💾 즉시 수정 완료
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-black text-[10px] border-none cursor-pointer"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 🔍 일반 뷰 모드 */
                  <div className="space-y-4">
                    {/* 1. 기안 제목/적요 */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="block text-[8px] text-slate-400 font-extrabold mb-1">지출 적요 (품명)</span>
                      <h2 className="text-sm font-black text-slate-850 leading-snug whitespace-pre-line">
                        {selectedExpense.title}
                      </h2>
                    </div>

                    {/* 2. 결제 수단 및 금액 정보 */}
                    <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white p-3.5 rounded-xl shadow-xs flex justify-between items-center">
                      <div>
                        <span className="block text-[8.5px] text-rose-100 font-extrabold">결제 수단</span>
                        <span className="text-[10px] font-black">{selectedExpense.payment_method}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8.5px] text-rose-100 font-extrabold">최종 품의액</span>
                        <span className="text-base font-black font-mono">{selectedExpense.amount.toLocaleString()}원</span>
                      </div>
                    </div>

                    {/* 2-2. 최종 실지출액 요약 (모바일 상세 뷰) */}
                    <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xs flex justify-between items-center border border-slate-800">
                      <div className="space-y-1">
                        <span className="block text-[8.5px] text-rose-350 font-extrabold leading-none">💸 최종 지급액</span>
                        <div className="text-[9.5px] font-bold text-slate-400">
                          (공제: -{(selectedExpense.deduction_amount || 0).toLocaleString()}원 / 수수료: +{(selectedExpense.transfer_fee || 0).toLocaleString()}원)
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8.5px] text-slate-400 font-extrabold">실제 지출일</span>
                        <span className="text-[10px] font-black font-mono">
                          {selectedExpense.actual_expense_date || "미집행"}
                        </span>
                        <span className="block text-sm font-black font-mono text-rose-450 mt-0.5">
                          {((Number(selectedExpense.amount) || 0) - (Number(selectedExpense.deduction_amount) || 0) + (Number(selectedExpense.transfer_fee) || 0)).toLocaleString()}원
                        </span>
                      </div>
                    </div>

                    {/* 3. 계정과목 상세 계층 구조 */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[8px] text-slate-400 font-extrabold mb-0.5">계정과목 대분류</span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[8.5px] font-black ${
                          catDetails.main === "판매비와관리비" ? "bg-blue-50 border border-blue-100 text-blue-700" :
                          catDetails.main === "제조/물류원가" ? "bg-amber-50 border border-amber-100 text-amber-700" :
                          catDetails.main === "영업외비용" ? "bg-purple-50 border border-purple-100 text-purple-700" :
                          "bg-slate-100 border border-slate-200 text-slate-700"
                        }`}>
                          {catDetails.main}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 font-extrabold mb-0.5">중분류 〉 소분류</span>
                        <span className="font-black text-slate-850 text-[10px] block mt-0.5">
                          {catDetails.mid} 〉 <span className="underline decoration-indigo-300 font-extrabold">{catDetails.sub}</span>
                        </span>
                      </div>
                    </div>

                    {/* 4. 품의일자 및 부서/담당자/프로젝트 병합 그리드 */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[8px] text-slate-400 font-extrabold mb-0.5">품의일자 (기안일)</span>
                        <span className="font-extrabold text-slate-800 text-[10px] font-mono block mt-1">{selectedExpense.expense_date}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 font-extrabold mb-0.5">부서/담당자/프로젝트</span>
                        {hasTags ? (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {taggedInfo.department !== "-" && (
                              <span className="inline-flex px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700 text-[8px] font-bold">
                                🏢 {taggedInfo.department}
                              </span>
                            )}
                            {taggedInfo.staff !== "-" && (
                              <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-bold">
                                👤 {taggedInfo.staff}
                              </span>
                            )}
                            {taggedInfo.project !== "-" && (
                              <span className="inline-flex px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 text-[8px] font-bold">
                                🚀 {taggedInfo.project}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-bold text-slate-400 text-[10px] block mt-1">-</span>
                        )}
                      </div>
                    </div>

                    {/* 6. AI 분석 혹은 일반 가맹점/거래처명 */}
                    {aiPayee && (
                      <div className="bg-rose-50/40 p-2.5 rounded-xl border border-rose-100/70">
                        <span className="block text-[8px] text-rose-500 font-extrabold mb-0.5">🏢 영수인 / 가맹점 / 거래처</span>
                        <span className="font-black text-rose-700 text-[10px]">{aiPayee}</span>
                      </div>
                    )}

                    {/* 7. 지출 태그들 */}
                    {selectedExpense.memo && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="block text-[8px] text-slate-400 font-extrabold mb-0.5">🏷️ 지출 태그 목록</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedExpense.memo.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                            <span key={tag} className="inline-flex px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 text-[8.5px] font-extrabold">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 8. 첨부 영수증 실물 - 상시 노출 영역 */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2">
                      <span className="block text-[8px] text-slate-400 font-extrabold mb-0.5">📄 첨부 영수증 실물</span>
                      
                      {selectedExpense.attachment_url ? (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => setShowAttachment(!showAttachment)}
                            className={`w-full py-1.5 rounded-lg text-[9px] font-black flex items-center justify-center gap-1.5 transition-all shadow-3xs cursor-pointer ${
                              showAttachment 
                                ? 'bg-slate-800 hover:bg-slate-900 text-white' 
                                : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                            }`}
                          >
                            {showAttachment ? '🙈 영수증 실물 접기' : '📄 영수증 실물 원본 보기'}
                          </button>

                          {/* 아코디언 활성화 시 인라인 뷰어 기동 */}
                          {showAttachment && (
                            <div className="w-full mt-1.5 p-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-inner space-y-1.5 animate-scale-up">
                              {isPdf ? (
                                <iframe 
                                  src={selectedExpense.attachment_url} 
                                  className="w-full h-80 rounded-lg border-none"
                                  title="PDF 영수증 미리보기"
                                />
                              ) : (
                                <img 
                                  src={selectedExpense.attachment_url} 
                                  alt="영수증 실물" 
                                  className="w-full max-h-80 object-contain rounded-lg border bg-slate-50"
                                />
                              )}
                              <div className="p-1 text-center border-t border-slate-100">
                                <a 
                                  href={selectedExpense.attachment_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="inline-flex items-center text-blue-600 font-extrabold hover:underline gap-0.5 text-[8.5px]"
                                >
                                  🔍 원본 파일 새 창에서 크게 보기
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-2.5 px-3 bg-slate-100/70 border border-slate-200/50 rounded-lg text-[9.5px] text-slate-450 font-bold text-center flex items-center justify-center gap-1">
                          ⚠️ 첨부된 영수증 실물 파일이 없는 지출 건입니다.
                        </div>
                      )}
                    </div>

                    {/* 9. 대표자 전용 즉석 수정 및 삭제 트리거 버튼 바 */}
                    <div className="bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/50 flex gap-2 justify-end">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[9px] font-black flex items-center gap-1 shadow-3xs transition-all active:scale-95 cursor-pointer"
                      >
                        ✏️ 지출 수정
                      </button>
                      <button
                        onClick={() => handleDeleteDirect(selectedExpense.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[9px] font-black flex items-center gap-1 shadow-3xs transition-all active:scale-95 cursor-pointer"
                      >
                        🗑️ 지출 삭제
                      </button>
                    </div>

                    {/* 결재 상태 피드백 히스토리 */}
                    {selectedExpense.approval_status && selectedExpense.approval_status !== 'PENDING' && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="block text-[8px] text-slate-400 font-extrabold mb-0.5">상태 히스토리</span>
                        <span className="font-extrabold text-slate-850 text-[10px]">
                          현재 {selectedExpense.approval_status === 'APPROVED' ? '🟢 승인 완료' : selectedExpense.approval_status === 'REJECTED' ? '🔴 반려됨' : '🟡 보류중'} 상태입니다.
                        </span>
                        {selectedExpense.approval_memo && (
                          <p className="text-[9px] text-slate-450 mt-1 pl-1 border-l border-slate-200">💬 사유: {selectedExpense.approval_memo}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 모달 하단 - 대표자 의사 결정 액션 바 */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
                {/* 대기 상태일 때만 의사결정 단추 활성화 */}
                {(selectedExpense.approval_status || 'PENDING') === 'PENDING' ? (
                  <>
                    <button 
                      onClick={(e) => handleDirectApprove(selectedExpense.id, e)}
                      disabled={isSubmitting}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] shadow-sm flex items-center justify-center gap-1 border-none cursor-pointer active:scale-95 transition-all"
                    >
                      <Check className="w-3 h-3" />
                      승인
                    </button>
                    <button 
                      onClick={() => setOpinionModalType('REJECTED')}
                      disabled={isSubmitting}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[10px] shadow-sm flex items-center justify-center gap-1 border-none cursor-pointer active:scale-95 transition-all"
                    >
                      <X className="w-3 h-3" />
                      반려
                    </button>
                    <button 
                      onClick={() => setOpinionModalType('HOLD')}
                      disabled={isSubmitting}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-[10px] shadow-sm flex items-center justify-center gap-1 border-none cursor-pointer active:scale-95 transition-all"
                    >
                      <AlertCircle className="w-3 h-3" />
                      보류
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { setSelectedExpense(null); setIsEditing(false); }}
                    className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-black text-[10px] border-none cursor-pointer active:scale-95 transition-all text-center"
                  >
                    닫기
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* ================= 반려 / 보류 사유 기입 모달 ================= */}
      {opinionModalType && selectedExpense && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl border border-slate-100 animate-scale-up">
            
            <div className="p-4 border-b border-slate-50">
              <h5 className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                대표 결재 {opinionModalType === 'REJECTED' ? '반려' : '보류'} 의견 작성
              </h5>
            </div>

            <div className="p-4 space-y-2">
              <label className="block text-[9px] font-extrabold text-slate-450 mb-0.5">
                {opinionModalType === 'REJECTED' ? '반려' : '보류'} 처리 사유를 작성해주세요.
              </label>
              <div className="relative">
                <textarea
                  value={approvalOpinion}
                  onChange={e => setApprovalOpinion(e.target.value)}
                  placeholder="예: 예산 한도 초과로 하반기에 다시 상신 바람."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-2.5 pr-10 outline-none font-bold text-[10px] bg-slate-50 text-slate-800 focus:ring-2 focus:ring-rose-500"
                />
                
                {/* 🎙️ 음성 인식 마이크 버튼 이식 */}
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  className={`absolute right-2 bottom-3 p-1.5 rounded-lg border-none cursor-pointer transition-all ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'bg-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                  title="음성으로 의견 받아쓰기"
                >
                  🎙️
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={handleOpinionSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black text-white border-none cursor-pointer ${
                  opinionModalType === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                의견 제출 및 결재 완료
              </button>
              <button
                onClick={() => { setOpinionModalType(null); setApprovalOpinion(''); }}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-black text-[10px] border-none cursor-pointer"
              >
                취소
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
