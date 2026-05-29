"use client";

import React, { useRef } from "react";
import { 
  Coins, TrendingDown, Image, FileText, Bot, Sparkles, Upload, 
  Trash2, AlertTriangle, Save, Filter, Search, Calendar, 
  CreditCard, Info, AlertCircle, RefreshCw
} from "lucide-react";
import * as XLSX from "xlsx";

// 커스텀 훅 임포트
import { useExpenses, ExpenseSettings } from "@/hooks/useExpenses";

export default function ExpenseManagementAiPage() {
  const {
    expenses,
    stats,
    settings,
    isLoading,
    isSavingSettings,
    isSubmittingExpense,
    isAnalyzingReceipt,
    activeCategoryFilter,
    setActiveCategoryFilter,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    newExpense,
    setNewExpense,
    handleSaveSettings,
    handleRegisterExpense,
    handleDeleteExpense,
    handleFileUpload,
    resetExpenseForm,
    totalPages,
    startIndex,
    endIndex,
    paginatedExpenses,
    filteredExpenses,
    selectedIds,
    toggleSelectAll,
    toggleSelect,
    handleDeleteSelectedExpenses,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    setQuickRange,
    dbCategories,
    dbTags,
    handleAddCategory,
    handleBulkAddCategories,
    handleDeleteCategory,
    handleAddTag,
    handleDeleteTag,
    autocompleteData,
    dbDepartments,
    dbEmployees,
    dbProjects,
    handleAddDepartment,
    handleDeleteDepartment,
    handleAddEmployee,
    handleDeleteEmployee,
    handleAddProject,
    handleDeleteProject
  } = useExpenses();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 실시간 DB 데이터 기반으로 3단 계정과목구조 동적 useMemo 빌딩 (하드코딩 0% 제거)
  const ACCOUNT_CATEGORIES = React.useMemo(() => {
    const structure: Record<string, Record<string, string[]>> = {};
    if (!dbCategories || dbCategories.length === 0) {
      return {
        "판매비와관리비": {
          "복리후생비": ["직원야근식대"]
        }
      };
    }
    dbCategories.forEach(cat => {
      const main = cat.main_category;
      const mid = cat.mid_category;
      const sub = cat.sub_category;
      if (!structure[main]) {
        structure[main] = {};
      }
      if (!structure[main][mid]) {
        structure[main][mid] = [];
      }
      if (!structure[main][mid].includes(sub)) {
        structure[main][mid].push(sub);
      }
    });
    return structure;
  }, [dbCategories]);

  // 2. 실시간 DB 데이터 기반으로 지출 태그 명칭 배열 동적 useMemo 빌딩
  const PRESET_TAGS = React.useMemo(() => {
    if (!dbTags || dbTags.length === 0) {
      return ["SCM팀", "정기지출", "긴급비용"];
    }
    return dbTags.map(t => t.name);
  }, [dbTags]);

  // 3단계 계정과목 동적 연동을 위한 상태 선언
  const [selectedMainCat, setSelectedMainCat] = React.useState<string>("판매비와관리비");
  const [selectedMidCat, setSelectedMidCat] = React.useState<string>("복리후생비");

  // 지출 환경 설정 센터 탭 제어용 로컬 상태
  const [activeConfigTab, setActiveConfigTab] = React.useState<'budget' | 'category' | 'tag' | 'org'>('budget');
  const [newMainCat, setNewMainCat] = React.useState<string>("판매비와관리비");
  const [newMidCat, setNewMidCat] = React.useState<string>("");
  const [newSubCat, setNewSubCat] = React.useState<string>("");
  const [newTagName, setNewTagName] = React.useState<string>("");
  const [isSubmittingCat, setIsSubmittingCat] = React.useState(false);
  const [isSubmittingTag, setIsSubmittingTag] = React.useState(false);
  const [isExcelUploading, setIsExcelUploading] = React.useState(false);

  // 🏢 조직 및 사업 전용 추가 폼 상태
  const [newDeptName, setNewDeptName] = React.useState<string>("");
  const [newEmpName, setNewEmpName] = React.useState<string>("");
  const [newProjName, setNewProjName] = React.useState<string>("");
  const [isSubmittingDept, setIsSubmittingDept] = React.useState(false);
  const [isSubmittingEmp, setIsSubmittingEmp] = React.useState(false);
  const [isSubmittingProj, setIsSubmittingProj] = React.useState(false);

  // 🏷️ 적요란 '@' 지능형 자동완성 제어용 상태
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [searchWord, setSearchWord] = React.useState("");
  const [atIndex, setAtIndex] = React.useState(-1);
  const [activeSuggestIndex, setActiveSuggestIndex] = React.useState(0);

  // 🏷️ 적요란 '@' 태그 개별 신속 교체(Quick-Switch)용 상태
  const [activeSwitchTag, setActiveSwitchTag] = React.useState<{
    label: string;
    start: number;
    end: number;
    type: 'partner' | 'staff' | 'department' | 'project';
  } | null>(null);
  const [showSwitchOptions, setShowSwitchOptions] = React.useState(false);

  // 전체 자동완성 후보군 취합
  const allSuggestItems = React.useMemo(() => {
    if (!autocompleteData) return [];
    const items: Array<{ label: string; value: string; type: 'partner' | 'staff' | 'department' | 'project' }> = [];
    
    if (autocompleteData.staff) {
      autocompleteData.staff.forEach(name => {
        items.push({ label: name, value: name, type: 'staff' });
      });
    }
    if (autocompleteData.departments) {
      autocompleteData.departments.forEach(name => {
        items.push({ label: name, value: name, type: 'department' });
      });
    }
    if (autocompleteData.partners) {
      autocompleteData.partners.forEach(name => {
        items.push({ label: name, value: name, type: 'partner' });
      });
    }
    if (autocompleteData.projects) {
      autocompleteData.projects.forEach(name => {
        items.push({ label: name, value: name, type: 'project' });
      });
    }
    return items;
  }, [autocompleteData]);

  // 필터링된 추천 항목 목록 연산
  const filteredSuggestions = React.useMemo(() => {
    if (!showSuggestions) return [];
    const cleanWord = searchWord.toLowerCase().trim();
    if (!cleanWord) {
      // 검색어가 비어있을 땐 각 분야별 대표 항목들만 추려서 균형있게 노출
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

  // newExpense.category (소분류) 변경 시 대분류/중분류 역동기화 추적
  React.useEffect(() => {
    if (!newExpense.category) return;
    
    let found = false;
    for (const mainCat of Object.keys(ACCOUNT_CATEGORIES)) {
      for (const midCat of Object.keys(ACCOUNT_CATEGORIES[mainCat])) {
        if (ACCOUNT_CATEGORIES[mainCat][midCat].includes(newExpense.category)) {
          setSelectedMainCat(mainCat);
          setSelectedMidCat(midCat);
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }, [newExpense.category, ACCOUNT_CATEGORIES]);

  // DB 카테고리 로드 완료 후, 초깃값 세팅이 하드코딩값과 불일치할 수 있으므로 강제 보정
  React.useEffect(() => {
    if (dbCategories.length > 0) {
      const mainCats = Object.keys(ACCOUNT_CATEGORIES);
      if (mainCats.length > 0) {
        const firstMain = mainCats[0];
        const midCats = Object.keys(ACCOUNT_CATEGORIES[firstMain] || {});
        if (midCats.length > 0) {
          const firstMid = midCats[0];
          const subCats = ACCOUNT_CATEGORIES[firstMain][firstMid] || [];
          if (subCats.length > 0 && !subCats.includes(newExpense.category)) {
            setNewExpense(prev => ({ ...prev, category: subCats[0] }));
            setSelectedMainCat(firstMain);
            setSelectedMidCat(firstMid);
          }
        }
      }
    }
  }, [dbCategories]);

  const handleMainCatChange = (mainCat: string) => {
    setSelectedMainCat(mainCat);
    const midCats = Object.keys(ACCOUNT_CATEGORIES[mainCat] || {});
    if (midCats.length > 0) {
      const firstMid = midCats[0];
      setSelectedMidCat(firstMid);
      const subCats = ACCOUNT_CATEGORIES[mainCat][firstMid] || [];
      if (subCats.length > 0) {
        setNewExpense(prev => ({ ...prev, category: subCats[0] }));
      }
    }
  };

  const handleMidCatChange = (midCat: string) => {
    setSelectedMidCat(midCat);
    const subCats = ACCOUNT_CATEGORIES[selectedMainCat][midCat];
    if (subCats.length > 0) {
      setNewExpense(prev => ({ ...prev, category: subCats[0] }));
    }
  };

  // 비고 란 쉼표 구분 태그 토글 헬퍼 함수
  const toggleTag = (tag: string) => {
    const currentMemo = newExpense.memo || "";
    let tags = currentMemo
      .split(",")
      .map(t => t.trim())
      .filter(t => t !== "");

    if (tags.includes(tag)) {
      tags = tags.filter(t => t !== tag);
    } else {
      tags.push(tag);
    }
    
    setNewExpense(prev => ({
      ...prev,
      memo: tags.join(", ")
    }));
  };

  // 🏷️ 적요 하이라이트 렌더러 함수
  const renderHighlightedText = (text: string) => {
    if (!text) return <span className="text-slate-350 select-none">예: 대신정기화물 택배발송비&#10;1) 효성 1공장 1 BOX&#10;2) 동우일렉트릭 1 BOX</span>;
    
    // 정규식을 동원하여 '@단어' 들을 안전하게 토큰화하여 스플릿 렌더링
    const regex = /@([^\s@]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const fullMatch = match[0];
      const name = match[1];
      
      // 매칭 앞부분 일반 텍스트 푸시
      if (matchIndex > lastIndex) {
        parts.push(text.slice(lastIndex, matchIndex));
      }
      
      // 단어의 종류 판별
      let type: 'staff' | 'department' | 'partner' | 'project' = 'partner'; // 기본값
      if (autocompleteData?.staff?.includes(name)) {
        type = 'staff';
      } else if (autocompleteData?.departments?.includes(name)) {
        type = 'department';
      } else if (autocompleteData?.projects?.includes(name)) {
        type = 'project';
      } else if (autocompleteData?.partners?.includes(name)) {
        type = 'partner';
      }
      
      // 태그별 전용 클래스 매핑
      const badgeClass = {
        staff: "text-blue-600 underline decoration-2 decoration-blue-300 font-black cursor-pointer bg-blue-50/30 px-1 py-0.5 rounded",
        department: "text-emerald-600 underline decoration-2 decoration-emerald-300 font-black cursor-pointer bg-emerald-50/30 px-1 py-0.5 rounded",
        partner: "text-rose-600 underline decoration-2 decoration-rose-300 font-black cursor-pointer bg-rose-50/30 px-1 py-0.5 rounded",
        project: "text-indigo-600 underline decoration-2 decoration-indigo-300 font-black cursor-pointer bg-indigo-50/30 px-1 py-0.5 rounded"
      }[type];
      
      parts.push(
        <span key={`hl-${matchIndex}`} className={`${badgeClass} pointer-events-auto`}>
          {fullMatch}
        </span>
      );
      
      lastIndex = regex.lastIndex;
    }
    
    // 매칭 뒷부분 남은 텍스트 푸시
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts;
  };

  // textarea 클릭 시 태그 클릭 여부 역산 탐지 리스너
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    const cursorPos = e.currentTarget.selectionStart;
    
    // 정규식으로 모든 '@단어' 패턴의 범위 탐색
    const regex = /@([^\s@]+)/g;
    let match;
    
    while ((match = regex.exec(value)) !== null) {
      const start = match.index;
      const end = regex.lastIndex;
      const fullMatch = match[0];
      const name = match[1];
      
      // 클릭한 커서의 위치가 이 태그 범위 안에 있다면 퀵 스위치 트리거!
      if (cursorPos >= start && cursorPos <= end) {
        // 단어 종류 판별
        let type: 'staff' | 'department' | 'partner' | 'project' = 'partner';
        if (autocompleteData?.staff?.includes(name)) {
          type = 'staff';
        } else if (autocompleteData?.departments?.includes(name)) {
          type = 'department';
        } else if (autocompleteData?.projects?.includes(name)) {
          type = 'project';
        } else if (autocompleteData?.partners?.includes(name)) {
          type = 'partner';
        }
        
        setActiveSwitchTag({
          label: name,
          start,
          end,
          type
        });
        setShowSwitchOptions(true);
        setShowSuggestions(false); // 일반 자동완성 드롭다운은 닫음
        return;
      }
    }
    
    // 일반 글자를 클릭하면 퀵 스위치창을 닫음
    setShowSwitchOptions(false);
  };

  // 퀵 스위치를 통한 태그 치환 실행 핸들러
  const executeQuickSwitch = (newLabel: string) => {
    if (!activeSwitchTag) return;
    
    const value = newExpense.title;
    const { start, end } = activeSwitchTag;
    
    const textBefore = value.slice(0, start);
    const textAfter = value.slice(end);
    
    const replacement = `@${newLabel} `;
    const newValue = textBefore + replacement + textAfter;
    
    setNewExpense(prev => ({ ...prev, title: newValue }));
    setShowSwitchOptions(false);
    setActiveSwitchTag(null);
    
    // 치환 완료 후 즉시 커서 포커스를 치환된 문자 바로 뒤로 포커싱
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = start + replacement.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  // 🏷️ 적요란 textarea 제어용 레퍼런스
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // 자동완성 항목 선택 적용 핸들러
  const selectSuggestion = (item: { label: string; value: string; type: string }) => {
    const value = newExpense.title;
    const cursorPos = textareaRef.current?.selectionStart || 0;
    
    const textBefore = value.slice(0, atIndex);
    const textAfter = value.slice(cursorPos);
    
    // 치환용 문자열: @명칭 + 공백 한 칸 추가 (타이핑 연속성 보장)
    const replacement = `@${item.label} `;
    const newValue = textBefore + replacement + textAfter;
    
    setNewExpense(prev => ({ ...prev, title: newValue }));
    setShowSuggestions(false);
    
    // 치환 완료 후 즉시 커서 포커스를 치환된 문자 뒤로 정밀 회복시킴
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = atIndex + replacement.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  // textarea 실시간 @ 입력 감지 리스너
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNewExpense({ ...newExpense, title: value });
    
    // 커서 앞쪽 텍스트 슬라이싱
    const beforeCursor = value.slice(0, cursorPos);
    const lastAtIdx = beforeCursor.lastIndexOf("@");
    
    if (lastAtIdx !== -1) {
      // '@' 기호부터 커서 사이의 문자열을 확인
      const wordAfterAt = beforeCursor.slice(lastAtIdx + 1);
      // 공백 문자가 중간에 섞여있는지 확인
      const hasSpace = /\s/.test(wordAfterAt);
      
      if (!hasSpace) {
        // 자동완성 기동 활성화!
        setShowSuggestions(true);
        setSearchWord(wordAfterAt);
        setAtIndex(lastAtIdx);
        setActiveSuggestIndex(0);
        return;
      }
    }
    
    setShowSuggestions(false);
  };

  // textarea 내 키보드 조작 인터셉트 리스너
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  // 계정과목 추가 핸들러
  const onAddCategoryClick = async () => {
    if (!newMidCat.trim() || !newSubCat.trim()) {
      alert("중분류와 소분류 명칭을 모두 입력해 주세요.");
      return;
    }
    setIsSubmittingCat(true);
    const result = await handleAddCategory(newMainCat, newMidCat.trim(), newSubCat.trim());
    setIsSubmittingCat(false);
    if (result.success) {
      alert("신규 계정 과목이 안전하게 추가되었습니다.");
      setNewMidCat("");
      setNewSubCat("");
    } else {
      alert("등록 실패: " + result.error);
    }
  };

  // 📥 엑셀 샘플 다운로드 핸들러
  const downloadExcelSample = () => {
    try {
      const sampleData = [
        { "대분류": "판매비와관리비", "중분류": "복리후생비", "소분류": "직원야근식대" },
        { "대분류": "판매비와관리비", "중분류": "여비교통비", "소분류": "시내교통비" },
        { "대분류": "제조/물류원가", "중분류": "소모품비", "소분류": "물류부박스구매" }
      ];
      
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "계정과목_양식");
      
      // 컬럼 폭 지정
      ws["!cols"] = [
        { wch: 20 }, // 대분류
        { wch: 20 }, // 중분류
        { wch: 20 }  // 소분류
      ];
      
      XLSX.writeFile(wb, "계정과목_일괄등록_양식.xlsx");
    } catch (e) {
      console.error("샘플 다운로드 오류:", e);
      alert("엑셀 샘플 파일을 생성하는 과정에서 오류가 발생했습니다.");
    }
  };

  // 📤 엑셀 업로드 및 파싱 핸들러
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    setIsExcelUploading(true);
    
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // 시트 데이터를 JSON 객체 배열로 변환
        const data = XLSX.utils.sheet_to_json<any>(ws);
        
        if (!data || data.length === 0) {
          alert("업로드된 엑셀 파일 내에 등록할 데이터 행이 존재하지 않습니다.");
          setIsExcelUploading(false);
          return;
        }
        
        // 컬럼 검증
        const firstRow = data[0];
        if (!("대분류" in firstRow) || !("중분류" in firstRow) || !("소분류" in firstRow)) {
          alert("엑셀 양식이 올바르지 않습니다. 헤더 컬럼 이름이 '대분류', '중분류', '소분류' 인지 확인해주세요.");
          setIsExcelUploading(false);
          return;
        }
        
        // 백엔드 적재용 객체 매핑
        const mappedCategories = data.map((row: any) => ({
          main_category: String(row["대분류"] || "").trim(),
          mid_category: String(row["중분류"] || "").trim(),
          sub_category: String(row["소분류"] || "").trim()
        })).filter(
          cat => cat.main_category && cat.mid_category && cat.sub_category
        );
        
        if (mappedCategories.length === 0) {
          alert("엑셀 파일 내에 누락이 없는 유효한 계정과목 데이터가 존재하지 않습니다.");
          setIsExcelUploading(false);
          return;
        }
        
        // 훅 메소드 호출하여 백엔드 일괄 등록
        const result = await handleBulkAddCategories(mappedCategories);
        if (result.success) {
          alert(`🎉 엑셀 일괄 추가 성공!\n총 ${result.addedCount}건의 신규 계정과목이 등록되었습니다.${result.message ? `\n(${result.message})` : ""}`);
        } else {
          alert("엑셀 일괄 등록 실패: " + result.error);
        }
      } catch (err: any) {
        console.error("엑셀 파일 파싱 오류:", err);
        alert("엑셀 파일을 분석하는 중 에러가 발생했습니다. 올바른 파일 규격인지 점검해주세요.");
      } finally {
        setIsExcelUploading(false);
        // input 엘리먼트 값 리셋 (동일 파일 재선택 가능 조치)
        if (e.target) {
          e.target.value = "";
        }
      }
    };
    
    reader.onerror = () => {
      alert("파일을 로드하는 중 오류가 발생했습니다.");
      setIsExcelUploading(false);
    };
    
    reader.readAsBinaryString(file);
  };

  // 태그 추가 핸들러
  const onAddTagClick = async () => {
    if (!newTagName.trim()) {
      alert("추가할 태그 명칭을 입력해 주세요.");
      return;
    }
    setIsSubmittingTag(true);
    const result = await handleAddTag(newTagName.trim());
    setIsSubmittingTag(false);
    if (result.success) {
      alert("지출 태그가 프리셋에 정식 추가되었습니다.");
      setNewTagName("");
    } else {
      alert("등록 실패: " + result.error);
    }
  };

  // 1. 임시 경보 설정 수정을 위한 상태 분리 (설정 저장 버튼 클릭 전까지 임시 보관)
  const [tempSettings, setTempSettings] = React.useState<ExpenseSettings | null>(null);

  React.useEffect(() => {
    if (settings) {
      setTempSettings(settings);
    }
  }, [settings]);

  const handleTempSettingChange = (key: keyof ExpenseSettings, value: any) => {
    if (tempSettings) {
      setTempSettings({
        ...tempSettings,
        [key]: value
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // ⚡ 실시간 문자 바이트 계산 유틸리티 (SMS 80바이트 한글 40자 제한 지원)
  const getByteLength = (str: string) => {
    let byteLength = 0;
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      if (charCode <= 127) {
        byteLength += 1;
      } else {
        byteLength += 2;
      }
    }
    return byteLength;
  };

  // 💰 원화 금액 실시간 한글 번역기 (지출결의서 서식 감성)
  const convertToKoreanNumber = (num: number) => {
    if (!num || isNaN(num) || num <= 0) return "";
    const units = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
    const smallUnits = ["", "십", "백", "천"];
    const bigUnits = ["", "만", "억", "조"];
    
    let result = "";
    let numStr = Math.floor(num).toString();
    
    const chunks: string[] = [];
    while (numStr.length > 0) {
      chunks.push(numStr.slice(Math.max(0, numStr.length - 4), numStr.length));
      numStr = numStr.slice(0, Math.max(0, numStr.length - 4));
    }
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let chunkResult = "";
      for (let j = 0; j < chunk.length; j++) {
        const digit = Number(chunk[chunk.length - 1 - j]);
        if (digit > 0) {
          chunkResult = units[digit] + smallUnits[j] + chunkResult;
        }
      }
      chunkResult = chunkResult.replace("일십", "십").replace("일백", "백").replace("일천", "천");
      if (chunkResult) {
        result = chunkResult + bigUnits[i] + result;
      }
    }
    
    return result ? `일금 ${result}원 정` : "";
  };

  // 대장 필터용 고유 카테고리 목록 동적 계산 (기존 데이터와 소분류 혼합 대응)
  const uniqueCategories = React.useMemo(() => {
    return Array.from(new Set(expenses.map(exp => exp.category))).filter(Boolean);
  }, [expenses]);

  // 결제 수단 목록 (처리 사항 -> 결제 수단 명칭 변경 대응)
  const PAYMENT_METHODS = ["법인카드", "개인신용카드", "계좌송금", "현금", "기타"];

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 font-sans text-slate-800 animate-fade-in">
      
      {/* 타이틀 및 헤더 영역 (PC용 1행 통일 스타일) */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center tracking-tight">
          <Coins className="w-8 h-8 text-rose-500 mr-3 animate-pulse" />
          지출 관리 AI
        </h1>
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-xs font-black flex items-center shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-rose-500 animate-bounce" />
          AI 경리 자율 자동화 구동 중
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-rose-500 animate-spin" />
          <p className="font-extrabold text-slate-500 text-sm">지출 대장 및 AI 통계 정보를 계산하는 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 상단 2열 배치 (설정 및 AI 스캔 영역) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* ================= 좌측 열 (AI 영수증 스캔 & 검수 집중) ================= */}
            <div className="space-y-6">

            {/* 2. 📷 AI 영수증 자율 스캔 드롭존 & 검수 폼 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center justify-between border-b pb-3 mb-2">
                <div className="flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-rose-500 animate-bounce" />
                  AI 영수증 자율 스캔 및 검수
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">PDF / 이미지 지원</span>
              </h2>

              {/* 드롭존 영역 */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center group ${
                  isAnalyzingReceipt 
                    ? 'border-rose-400 bg-rose-50/20' 
                    : 'border-slate-200 hover:border-rose-300 hover:bg-slate-50/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                
                {isAnalyzingReceipt ? (
                  <div className="space-y-3">
                    <RefreshCw className="w-10 h-10 text-rose-500 animate-spin mx-auto" />
                    <p className="font-extrabold text-xs text-rose-500">Gemini AI가 영수증 글자와 금액을 해독하고 있습니다...</p>
                    <p className="text-[10px] text-slate-400 font-semibold">비목(카테고리) 자율 분류 분석 연산 작동 중</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-slate-350 mx-auto group-hover:text-rose-455 transition-colors" />
                    <p className="font-extrabold text-xs text-slate-700">여기에 영수증 이미지 또는 전자영수증 PDF를 드래그 앤 드롭하세요</p>
                    <p className="text-[10px] text-slate-450 font-semibold">또는 이 영역을 클릭하여 PC 내부 파일을 선택하세요</p>
                  </div>
                )}
              </div>

              {/* AI 인식 결과 검수 & 등록 폼 (사장님의 지출결의서 실물 서식 완벽 이식) */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between border-b pb-2 mb-2">
                  <span className="flex items-center text-rose-500 font-extrabold text-[11px]">
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    📝 지출결의서 규격 실물 검수 및 자동 기입
                  </span>
                  <button 
                    onClick={resetExpenseForm}
                    className="text-[10px] font-bold text-slate-450 hover:text-slate-700 cursor-pointer transition-colors"
                  >
                    초기화
                  </button>
                </h3>

                <div className="grid grid-cols-3 gap-3.5">
                  {/* 적요 (지출 용도 및 상세 내역) */}
                  <div className="col-span-3 relative">
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">적요 (지출 용도 및 상세 내역) *</label>
                    
                    <div className="relative w-full h-[84px] rounded-xl overflow-hidden border border-slate-250 bg-white focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-transparent transition-all shadow-2xs">
                      {/* 1. 뒤 레이어: 하이라이트 비주얼 오버레이 Div */}
                      <div className="absolute inset-0 px-3.5 py-2.5 font-bold text-xs leading-relaxed text-slate-800 pointer-events-none select-none whitespace-pre-wrap break-all overflow-y-auto max-h-[84px] text-left">
                        {renderHighlightedText(newExpense.title)}
                      </div>

                      {/* 2. 앞 레이어: 실제 타이핑 투명 textarea */}
                      <textarea 
                        ref={textareaRef}
                        rows={3}
                        placeholder="예: 대신정기화물 택배발송비&#10;1) 효성 1공장 1 BOX&#10;2) 동우일렉트릭 1 BOX"
                        value={newExpense.title}
                        onChange={handleTextareaChange}
                        onKeyDown={handleTextareaKeyDown}
                        onClick={handleTextareaClick}
                        className="w-full h-full bg-transparent text-transparent caret-rose-500 outline-none border-none font-bold text-xs leading-relaxed px-3.5 py-2.5 resize-none absolute inset-0 z-10 text-left"
                      />
                    </div>

                    {/* 🏷️ 지능형 자동완성 플로팅 보드 가동 */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg max-h-[160px] overflow-y-auto z-50 divide-y divide-slate-100/50 text-left">
                        {filteredSuggestions.map((item, index) => {
                          const typeBadge = {
                            staff: { label: "임직원", class: "bg-blue-50 text-blue-600 border-blue-100" },
                            department: { label: "사내부서", class: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                            partner: { label: "거래처", class: "bg-rose-50 text-rose-600 border-rose-100" },
                            project: { label: "프로젝트", class: "bg-indigo-50 text-indigo-600 border-indigo-100" }
                          }[item.type];

                          return (
                            <div
                              key={`${item.type}-${item.value}-${index}`}
                              onClick={() => selectSuggestion(item)}
                              className={`flex items-center justify-between p-2.5 cursor-pointer text-[10.5px] font-extrabold transition-all ${
                                index === activeSuggestIndex 
                                  ? 'bg-rose-50/70 text-rose-600' 
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className="truncate">{item.label}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-wide shrink-0 ${typeBadge.class}`}>
                                {typeBadge.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 🏷️ 퀵 스위치(Quick-Switch) 태그 교체 미니 팝업 가동 */}
                    {showSwitchOptions && activeSwitchTag && (
                      <div className="absolute left-0 right-0 mt-1 bg-white/95 backdrop-blur-md border border-rose-100 rounded-2xl shadow-xl p-3 z-50 animate-fade-in space-y-2 text-left">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <span className="text-[10px] font-black text-rose-500 flex items-center">
                            🔄 태그 신속 변경 ({
                              { staff: "임직원", department: "사내부서", partner: "거래처", project: "프로젝트" }[activeSwitchTag.type]
                            })
                          </span>
                          <button
                            onClick={() => setShowSwitchOptions(false)}
                            className="text-[9px] font-bold text-slate-450 hover:text-slate-750 border-none bg-transparent cursor-pointer"
                          >
                            ✕ 닫기
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto py-0.5 pr-1">
                          {autocompleteData[activeSwitchTag.type === 'staff' ? 'staff' : 
                                            activeSwitchTag.type === 'department' ? 'departments' : 
                                            activeSwitchTag.type === 'partner' ? 'partners' : 'projects']
                            ?.filter(val => val !== activeSwitchTag.label) // 현재 선택된 값은 후보에서 필터링
                            .map((val, idx) => {
                              const badgeStyle = {
                                staff: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100",
                                department: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100",
                                partner: "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100",
                                project: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100"
                              }[activeSwitchTag.type];

                              return (
                                <button
                                  key={`sw-${idx}`}
                                  onClick={() => executeQuickSwitch(val)}
                                  className={`px-2 py-1 rounded-lg text-[9.5px] font-extrabold border transition-all cursor-pointer shadow-3xs ${badgeStyle}`}
                                >
                                  {val}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 계정과목 대/중/소 3단계 동적 연동 셀렉터 */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">계정 대분류 *</label>
                    <select 
                      value={selectedMainCat}
                      onChange={e => handleMainCatChange(e.target.value)}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-700 cursor-pointer"
                    >
                      {Object.keys(ACCOUNT_CATEGORIES).map(mainCat => (
                        <option key={mainCat} value={mainCat}>{mainCat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">계정 중분류 *</label>
                    <select 
                      value={selectedMidCat}
                      onChange={e => handleMidCatChange(e.target.value)}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-700 cursor-pointer"
                    >
                      {Object.keys(ACCOUNT_CATEGORIES[selectedMainCat] || {}).map(midCat => (
                        <option key={midCat} value={midCat}>{midCat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">계정 소분류 *</label>
                    <select 
                      value={newExpense.category}
                      onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-700 cursor-pointer"
                    >
                      {(ACCOUNT_CATEGORIES[selectedMainCat]?.[selectedMidCat] || []).map(subCat => (
                        <option key={subCat} value={subCat}>{subCat}</option>
                      ))}
                    </select>
                  </div>

                  {/* 결제 수단 (명칭 변경) */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">결제 수단 *</label>
                    <select 
                      value={newExpense.payment_method}
                      onChange={e => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-700 cursor-pointer"
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  {/* 영수인/가맹점명/거래처명 (명칭 변경) */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">영수인/가맹점명/거래처명 *</label>
                    <input 
                      type="text"
                      placeholder="예: 최창숙 또는 삼송베이커리"
                      value={(newExpense as any).payee || ""}
                      onChange={e => setNewExpense({ ...newExpense, payee: e.target.value })}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-800"
                    />
                  </div>

                  {/* 품의 일자 (발의 일자 -> 명칭 변경, 결재/지출일자 삭제 일원화) */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">품의 일자 *</label>
                    <input 
                      type="date"
                      value={(newExpense as any).requisition_date || ""}
                      onChange={e => setNewExpense({ ...newExpense, requisition_date: e.target.value })}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2 outline-none font-bold text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-700 cursor-pointer"
                    />
                  </div>

                  {/* 지출 금액 & 실시간 한글 표기 프리뷰 */}
                  <div className="col-span-3">
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">지출 금액 (원화 ₩) *</label>
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="금액을 입력하세요"
                        value={newExpense.amount}
                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                        className="w-full border border-slate-250 rounded-xl pl-3.5 pr-10 py-2.5 outline-none font-black text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-800"
                      />
                      <span className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 font-extrabold text-[10px]">원</span>
                    </div>
                    {/* 실시간 한글 표기 (지출결의서 서식 감성) */}
                    {newExpense.amount && Number(newExpense.amount) > 0 && (
                      <div className="mt-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-50 to-slate-50 border border-rose-100 rounded-xl flex items-center justify-between animate-fade-in shadow-3xs">
                        <span className="text-[10px] font-black text-rose-600 font-sans tracking-tight">
                          {convertToKoreanNumber(Number(newExpense.amount))}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 font-mono">
                          (₩{Number(newExpense.amount).toLocaleString()}원)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 비고 및 지출 태그 시스템 */}
                  <div className="col-span-3">
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1">비고 (지출 태그 입력)</label>
                    <input 
                      type="text"
                      placeholder="태그를 쉼표(,)로 구분하여 입력하거나 아래 추천 태그를 클릭해 보세요"
                      value={newExpense.memo}
                      onChange={e => setNewExpense({ ...newExpense, memo: e.target.value })}
                      className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-semibold text-xs bg-white focus:ring-2 focus:ring-rose-500 transition-all text-slate-800"
                    />
                    
                    {/* 전문가 추천 태그 프리셋 칩 배지 */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {PRESET_TAGS.map(tag => {
                        const isSelected = (newExpense.memo || "")
                          .split(",")
                          .map(t => t.trim())
                          .includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-2.5 py-1.5 rounded-full text-[9px] font-bold border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-rose-500 text-white border-rose-500 shadow-3xs border-none' 
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            #{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={handleRegisterExpense}
                    disabled={isSubmittingExpense || !newExpense.title || !newExpense.amount}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-black text-xs shadow-md shadow-rose-500/10 hover:opacity-95 disabled:bg-slate-350 disabled:shadow-none transition-all cursor-pointer border-none flex items-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2 animate-pulse" />
                    {isSubmittingExpense ? "결의서 장부 등록 중..." : "결의서 장부 등록하기"}
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* ================= 우측 열 (예산 현황 & SMS 경보 비서 통합) ================= */}
          <div className="space-y-6">

            {/* 1. 월간 예산 소모 현황 전광판 (우측 열 상단 대이동) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingDown className="w-32 h-32 text-white" />
              </div>
              
              <div className="relative z-10 flex justify-between items-center mb-4">
                <div>
                  <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">이달의 누적 지출 현황 ({stats?.currentMonth}월)</p>
                  <h3 className="text-3xl font-black mt-1 font-mono tracking-tight text-white">
                    {stats?.currentMonthTotal.toLocaleString()} <span className="text-sm font-bold text-slate-350">원</span>
                  </h3>
                </div>
                
                {/* 동적 예산 달성 백분율 배지 */}
                <div className={`px-3.5 py-1.5 rounded-full font-black text-xs shadow-md ${
                  (stats?.budgetConsumptionRate || 0) >= 90 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                    : (stats?.budgetConsumptionRate || 0) >= 70
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  소모율 {stats?.budgetConsumptionRate}%
                </div>
              </div>

              {/* 예산 프로그래스 바 (상태별 동적 컬러 적용) */}
              <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner mb-3">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    (stats?.budgetConsumptionRate || 0) >= 90
                      ? 'bg-gradient-to-r from-rose-500 to-orange-500'
                      : (stats?.budgetConsumptionRate || 0) >= 70
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  }`}
                  style={{ width: `${Math.min(stats?.budgetConsumptionRate || 0, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
                <span>예산 한도: {stats?.monthlyBudget.toLocaleString()}원</span>
                <span>잔여 가능 예산: {Math.max((stats?.monthlyBudget || 0) - (stats?.currentMonthTotal || 0), 0).toLocaleString()}원</span>
              </div>
            </div>

            {/* 3. 🛡️ 지출 환경 설정 센터 탭 패널 (예산/계정/태그 원스톱 관리) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-lg font-black text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-2 gap-2">
                <div className="flex items-center text-slate-850">
                  <AlertTriangle className="w-5 h-5 mr-2 text-rose-500 animate-bounce" />
                  지출 환경 설정
                </div>
                
                {/* 탭 헤더 */}
                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 self-end">
                  <button
                    type="button"
                    onClick={() => setActiveConfigTab('budget')}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all cursor-pointer border-none ${
                      activeConfigTab === 'budget' ? 'bg-white text-rose-600 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    🚨 예산 알림
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConfigTab('category')}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all cursor-pointer border-none ${
                      activeConfigTab === 'category' ? 'bg-white text-rose-600 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    📂 계정 과목
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConfigTab('tag')}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all cursor-pointer border-none ${
                      activeConfigTab === 'tag' ? 'bg-white text-rose-600 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    🏷️ 지출 태그
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConfigTab('org')}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all cursor-pointer border-none ${
                      activeConfigTab === 'org' ? 'bg-white text-rose-600 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    🏢 조직 및 사업
                  </button>
                </div>
              </h2>

              {/* 🚨 1. 예산 알림 탭 가동 */}
              {activeConfigTab === 'budget' && tempSettings && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <span className="text-xs font-black text-slate-700">예산 한도액 알림 가동</span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={tempSettings.is_alert_enabled === 1}
                        onChange={() => handleTempSettingChange('is_alert_enabled', tempSettings.is_alert_enabled === 1 ? 0 : 1)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 mb-1">월별 지출 제한 한도 (원화 ₩) *</label>
                      <input 
                        type="number"
                        value={tempSettings.monthly_budget}
                        onChange={e => handleTempSettingChange('monthly_budget', Number(e.target.value))}
                        disabled={tempSettings.is_alert_enabled === 0}
                        className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-black text-xs bg-white disabled:bg-slate-100 disabled:text-slate-450 focus:ring-2 focus:ring-rose-500 transition-all text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 mb-1">경보 수신 연락처 (점주 번호) *</label>
                      <input 
                        type="text"
                        placeholder="예: 010-1234-5678"
                        value={tempSettings.alert_phone}
                        onChange={e => handleTempSettingChange('alert_phone', e.target.value)}
                        disabled={tempSettings.is_alert_enabled === 0}
                        className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs bg-white disabled:bg-slate-100 disabled:text-slate-450 focus:ring-2 focus:ring-rose-500 transition-all text-slate-800 font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-extrabold text-slate-500">지출 소모율 경보 임계 기준치 (%) *</label>
                        <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded">{tempSettings.alert_threshold_percent}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range"
                          min="50"
                          max="100"
                          step="5"
                          value={tempSettings.alert_threshold_percent}
                          onChange={e => handleTempSettingChange('alert_threshold_percent', Number(e.target.value))}
                          disabled={tempSettings.is_alert_enabled === 0}
                          className="flex-1 accent-rose-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-extrabold text-slate-500">🚨 경보 문자 템플릿 문구 *</label>
                        <span className="text-[9px] text-slate-450 font-bold">지원 변수: {"{경보임계율}"}, {"{경보금액}"}, {"{누적지출}"}, {"{월예산}"}</span>
                      </div>
                      <textarea 
                        value={tempSettings.alert_sms_template}
                        onChange={e => handleTempSettingChange('alert_sms_template', e.target.value)}
                        disabled={tempSettings.is_alert_enabled === 0}
                        rows={4}
                        className="w-full border border-slate-250 rounded-xl p-3 outline-none font-semibold text-xs bg-white disabled:bg-slate-100 disabled:text-slate-450 focus:ring-2 focus:ring-rose-500 transition-all text-slate-700 resize-none leading-relaxed"
                      />
                      
                      {tempSettings.is_alert_enabled === 1 && (
                        <div className="flex justify-between items-center mt-1.5 px-1 animate-fade-in">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all border ${
                              getByteLength(tempSettings.alert_sms_template) <= 80 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                            }`}>
                              {getByteLength(tempSettings.alert_sms_template) <= 80 ? '단문 SMS' : '장문 LMS'}
                            </span>
                            <span className="text-[10px] font-extrabold text-slate-500">
                              {getByteLength(tempSettings.alert_sms_template)} / 80 Byte
                            </span>
                          </div>
                          {getByteLength(tempSettings.alert_sms_template) > 80 && (
                            <span className="text-[9px] text-amber-600 font-extrabold flex items-center animate-shake">
                              <AlertCircle className="w-3 h-3 mr-0.5 shrink-0 text-amber-500" />
                              80Byte 초과 시 장문(LMS) 발송 및 요금 추가
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button 
                      onClick={() => handleSaveSettings(tempSettings)}
                      disabled={isSavingSettings || tempSettings.is_alert_enabled === 0}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-805 text-white rounded-xl font-bold text-xs shadow-md hover:opacity-95 disabled:bg-slate-350 disabled:shadow-none transition-all cursor-pointer border-none flex items-center"
                    >
                      <Save className="w-3.5 h-3.5 mr-2" />
                      {isSavingSettings ? "설정 저장 중..." : "경보 설정 적용하기"}
                    </button>
                  </div>
                </div>
              )}

              {/* 📂 2. 계정 과목 관리 탭 가동 */}
              {activeConfigTab === 'category' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  {/* 추가 폼 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h3 className="font-extrabold text-slate-800 text-[11px] flex items-center">
                      <Sparkles className="w-3 h-3 text-rose-500 mr-1.5 animate-pulse" />
                      ➕ 신규 계정 과목 3단계 추가
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-450 mb-0.5">대분류</label>
                        <select
                          value={newMainCat}
                          onChange={e => setNewMainCat(e.target.value)}
                          className="w-full border border-slate-250 rounded-lg px-2 py-1.5 outline-none font-bold text-[11px] bg-white text-slate-700 cursor-pointer"
                        >
                          <option value="판매비와관리비">판매비와관리비</option>
                          <option value="제조/물류원가">제조/물류원가</option>
                          <option value="영업외비용">영업외비용</option>
                          <option value="기타">기타</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-450 mb-0.5">중분류</label>
                        <input
                          type="text"
                          placeholder="예: 복리후생비"
                          value={newMidCat}
                          onChange={e => setNewMidCat(e.target.value)}
                          className="w-full border border-slate-250 rounded-lg px-2.5 py-1.5 outline-none font-bold text-[11px] bg-white text-slate-850"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-450 mb-0.5">소분류 (최종 비목)</label>
                        <input
                          type="text"
                          placeholder="예: 직원식대"
                          value={newSubCat}
                          onChange={e => setNewSubCat(e.target.value)}
                          className="w-full border border-slate-250 rounded-lg px-2.5 py-1.5 outline-none font-bold text-[11px] bg-white text-slate-850"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={onAddCategoryClick}
                        disabled={isSubmittingCat || !newMidCat.trim() || !newSubCat.trim()}
                        className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-black text-[10px] shadow-sm cursor-pointer disabled:bg-slate-300 border-none transition-all"
                      >
                        {isSubmittingCat ? "추가 중..." : "➕ 계정 추가"}
                      </button>
                    </div>
                  </div>

                  {/* 엑셀 일괄 등록 및 양식 다운로드 카드 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-800 text-[11px] flex items-center">
                        <Upload className="w-3.5 h-3.5 text-rose-500 mr-1.5" />
                        📤 엑셀 계정 과목 일괄 등록
                      </h3>
                      <button
                        onClick={downloadExcelSample}
                        className="text-[9px] font-black text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1.5 rounded-lg cursor-pointer transition-all flex items-center shadow-2xs border-none"
                      >
                        <FileText className="w-2.5 h-2.5 mr-1" />
                        📥 양식 다운로드
                      </button>
                    </div>

                    <div className="border border-dashed border-slate-250 hover:border-rose-300 rounded-xl p-4 bg-white flex flex-col items-center justify-center space-y-2 transition-colors relative cursor-pointer group shadow-2xs min-h-[90px]">
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleExcelUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isExcelUploading}
                      />
                      {isExcelUploading ? (
                        <div className="flex flex-col items-center space-y-2">
                          <RefreshCw className="w-6 h-6 text-rose-500 animate-spin" />
                          <span className="text-[10px] font-bold text-slate-500">엑셀 파일을 처리하고 있습니다...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors">
                            엑셀 파일을 드래그하거나 클릭하여 업로드
                          </span>
                          <span className="text-[8.5px] text-slate-400 font-medium">
                            * 대분류, 중분류, 소분류 헤더와 데이터가 들어있는 엑셀 파일만 지원합니다.
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 목록 대장 */}
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-slate-500 text-[10px] pl-1">현재 등록된 계정 과목 목록 ({dbCategories.length}건)</h3>
                    <div className="max-h-[220px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
                      {dbCategories.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 font-bold">등록된 계정과목이 없습니다.</div>
                      ) : (
                        dbCategories.map(cat => (
                          <div key={cat.id} className="flex justify-between items-center p-2.5 hover:bg-slate-50/50 transition-colors">
                            <div className="space-y-0.5 min-w-0 pr-2">
                              <span className="inline-flex px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[8px] font-bold border border-slate-200 mr-1.5">
                                {cat.main_category}
                              </span>
                              <span className="text-slate-400 font-bold text-[9px] mr-1">{cat.mid_category} 〉</span>
                              <span className="text-slate-850 font-black text-[10px]">{cat.sub_category}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-slate-350 hover:text-rose-500 font-black hover:bg-rose-50 p-1.5 rounded transition-colors cursor-pointer border-none bg-transparent"
                              title="계정과목 삭제"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 🏷️ 3. 지출 태그 관리 탭 가동 */}
              {activeConfigTab === 'tag' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  {/* 추가 폼 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h3 className="font-extrabold text-slate-800 text-[11px] flex items-center">
                      <Sparkles className="w-3 h-3 text-rose-500 mr-1.5 animate-pulse" />
                      ➕ 신규 지출 퀵 태그 추가
                    </h3>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="예: 마케팅비용"
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        className="flex-1 border border-slate-250 rounded-lg px-3 py-2 outline-none font-bold text-xs bg-white text-slate-850 focus:ring-2 focus:ring-rose-500 transition-all"
                      />
                      <button
                        onClick={onAddTagClick}
                        disabled={isSubmittingTag || !newTagName.trim()}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-black text-[11px] shadow-sm cursor-pointer disabled:bg-slate-300 border-none transition-all"
                      >
                        {isSubmittingTag ? "추가 중..." : "➕ 태그 추가"}
                      </button>
                    </div>
                  </div>

                  {/* 목록 대장 (원클릭 삭제 지원 칩 모임) */}
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-slate-500 text-[10px] pl-1">현재 등록된 퀵 태그 프리셋 ({dbTags.length}개)</h3>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl max-h-[220px] overflow-y-auto">
                      {dbTags.length === 0 ? (
                        <div className="w-full text-center py-6 text-slate-400 font-bold">등록된 지출 태그가 없습니다.</div>
                      ) : (
                        dbTags.map(tag => (
                          <div 
                            key={tag.id} 
                            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-white text-slate-700 text-[10px] font-black border border-slate-200 shadow-3xs"
                          >
                            <span>#{tag.name}</span>
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              className="w-4 h-4 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white flex items-center justify-center font-bold text-[8px] border-none cursor-pointer transition-colors"
                              title="태그 삭제"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 🏢 4. 조직 및 사업 관리 탭 가동 */}
              {activeConfigTab === 'org' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1열: 부서 관리 */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3 min-h-[320px]">
                      <div className="space-y-3">
                        <h3 className="font-extrabold text-slate-800 text-[11px] flex items-center">
                          <Sparkles className="w-3 h-3 text-rose-500 mr-1.5 animate-pulse" />
                          🏢 사내 부서 관리
                        </h3>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            placeholder="예: 개발본부"
                            value={newDeptName}
                            onChange={e => setNewDeptName(e.target.value)}
                            className="flex-1 border border-slate-250 rounded-lg px-2.5 py-1.5 outline-none font-bold text-[11px] bg-white text-slate-850 focus:ring-2 focus:ring-rose-500 transition-all text-slate-800"
                            onKeyDown={async (e) => {
                              if (e.key === "Enter" && newDeptName.trim()) {
                                e.preventDefault();
                                setIsSubmittingDept(true);
                                const res = await handleAddDepartment(newDeptName.trim());
                                setIsSubmittingDept(false);
                                if (res.success) setNewDeptName("");
                                else alert("부서 추가 실패: " + res.error);
                              }
                            }}
                          />
                          <button
                            onClick={async () => {
                              if (!newDeptName.trim()) return;
                              setIsSubmittingDept(true);
                              const res = await handleAddDepartment(newDeptName.trim());
                              setIsSubmittingDept(false);
                              if (res.success) {
                                setNewDeptName("");
                              } else {
                                alert("부서 추가 실패: " + res.error);
                              }
                            }}
                            disabled={isSubmittingDept || !newDeptName.trim()}
                            className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-black text-[10px] shadow-sm cursor-pointer disabled:bg-slate-300 border-none transition-all whitespace-nowrap"
                          >
                            {isSubmittingDept ? "..." : "추가"}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col min-h-0 pt-2 space-y-1.5">
                        <h4 className="font-extrabold text-slate-550 text-[9px]">부서 목록 ({dbDepartments.length}개)</h4>
                        <div className="flex-1 overflow-y-auto max-h-[200px] flex flex-wrap gap-1.5 items-start content-start bg-white p-2.5 border border-slate-150 rounded-xl min-h-[140px]">
                          {dbDepartments.length === 0 ? (
                            <div className="w-full text-center py-10 text-slate-400 font-bold">등록된 부서가 없습니다.</div>
                          ) : (
                            dbDepartments.map(dept => (
                              <div
                                key={dept.id}
                                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-blue-50/50 text-blue-700 text-[10px] font-black border border-blue-100 shadow-3xs"
                              >
                                <span>{dept.name}</span>
                                <button
                                  onClick={() => handleDeleteDepartment(dept.id)}
                                  className="w-4 h-4 rounded-full bg-blue-100/60 text-blue-550 hover:bg-rose-500 hover:text-white flex items-center justify-center font-bold text-[8px] border-none cursor-pointer transition-colors"
                                  title="부서 삭제"
                                >
                                  ✕
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2열: 임직원 관리 */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3 min-h-[320px]">
                      <div className="space-y-3">
                        <h3 className="font-extrabold text-slate-800 text-[11px] flex items-center">
                          <Sparkles className="w-3 h-3 text-rose-500 mr-1.5 animate-pulse" />
                          👥 사내 임직원 관리
                        </h3>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            placeholder="예: 홍길동"
                            value={newEmpName}
                            onChange={e => setNewEmpName(e.target.value)}
                            className="flex-1 border border-slate-250 rounded-lg px-2.5 py-1.5 outline-none font-bold text-[11px] bg-white text-slate-850 focus:ring-2 focus:ring-rose-500 transition-all text-slate-800"
                            onKeyDown={async (e) => {
                              if (e.key === "Enter" && newEmpName.trim()) {
                                e.preventDefault();
                                setIsSubmittingEmp(true);
                                const res = await handleAddEmployee(newEmpName.trim());
                                setIsSubmittingEmp(false);
                                if (res.success) setNewEmpName("");
                                else alert("임직원 추가 실패: " + res.error);
                              }
                            }}
                          />
                          <button
                            onClick={async () => {
                              if (!newEmpName.trim()) return;
                              setIsSubmittingEmp(true);
                              const res = await handleAddEmployee(newEmpName.trim());
                              setIsSubmittingEmp(false);
                              if (res.success) {
                                setNewEmpName("");
                              } else {
                                alert("임직원 추가 실패: " + res.error);
                              }
                            }}
                            disabled={isSubmittingEmp || !newEmpName.trim()}
                            className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-black text-[10px] shadow-sm cursor-pointer disabled:bg-slate-300 border-none transition-all whitespace-nowrap"
                          >
                            {isSubmittingEmp ? "..." : "추가"}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col min-h-0 pt-2 space-y-1.5">
                        <h4 className="font-extrabold text-slate-550 text-[9px]">임직원 목록 ({dbEmployees.length}명)</h4>
                        <div className="flex-1 overflow-y-auto max-h-[200px] flex flex-wrap gap-1.5 items-start content-start bg-white p-2.5 border border-slate-150 rounded-xl min-h-[140px]">
                          {dbEmployees.length === 0 ? (
                            <div className="w-full text-center py-10 text-slate-400 font-bold">등록된 임직원이 없습니다.</div>
                          ) : (
                            dbEmployees.map(emp => (
                              <div
                                key={emp.id}
                                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-emerald-50/50 text-emerald-700 text-[10px] font-black border border-emerald-100 shadow-3xs"
                              >
                                <span>{emp.name}</span>
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className="w-4 h-4 rounded-full bg-emerald-100/60 text-emerald-550 hover:bg-rose-500 hover:text-white flex items-center justify-center font-bold text-[8px] border-none cursor-pointer transition-colors"
                                  title="임직원 삭제"
                                >
                                  ✕
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3열: 프로젝트 관리 */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3 min-h-[320px]">
                      <div className="space-y-3">
                        <h3 className="font-extrabold text-slate-800 text-[11px] flex items-center">
                          <Sparkles className="w-3 h-3 text-rose-500 mr-1.5 animate-pulse" />
                          🚀 수행 프로젝트 관리
                        </h3>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            placeholder="예: 클라우드 이관"
                            value={newProjName}
                            onChange={e => setNewProjName(e.target.value)}
                            className="flex-1 border border-slate-250 rounded-lg px-2.5 py-1.5 outline-none font-bold text-[11px] bg-white text-slate-850 focus:ring-2 focus:ring-rose-500 transition-all text-slate-800"
                            onKeyDown={async (e) => {
                              if (e.key === "Enter" && newProjName.trim()) {
                                e.preventDefault();
                                setIsSubmittingProj(true);
                                const res = await handleAddProject(newProjName.trim());
                                setIsSubmittingProj(false);
                                if (res.success) setNewProjName("");
                                else alert("프로젝트 추가 실패: " + res.error);
                              }
                            }}
                          />
                          <button
                            onClick={async () => {
                              if (!newProjName.trim()) return;
                              setIsSubmittingProj(true);
                              const res = await handleAddProject(newProjName.trim());
                              setIsSubmittingProj(false);
                              if (res.success) {
                                setNewProjName("");
                              } else {
                                alert("프로젝트 추가 실패: " + res.error);
                              }
                            }}
                            disabled={isSubmittingProj || !newProjName.trim()}
                            className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-black text-[10px] shadow-sm cursor-pointer disabled:bg-slate-300 border-none transition-all whitespace-nowrap"
                          >
                            {isSubmittingProj ? "..." : "추가"}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col min-h-0 pt-2 space-y-1.5">
                        <h4 className="font-extrabold text-slate-550 text-[9px]">프로젝트 목록 ({dbProjects.length}개)</h4>
                        <div className="flex-1 overflow-y-auto max-h-[200px] flex flex-wrap gap-1.5 items-start content-start bg-white p-2.5 border border-slate-150 rounded-xl min-h-[140px]">
                          {dbProjects.length === 0 ? (
                            <div className="w-full text-center py-10 text-slate-400 font-bold">등록된 프로젝트가 없습니다.</div>
                          ) : (
                            dbProjects.map(proj => (
                              <div
                                key={proj.id}
                                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-indigo-50/50 text-indigo-700 text-[10px] font-black border border-indigo-100 shadow-3xs"
                              >
                                <span>{proj.name}</span>
                                <button
                                  onClick={() => handleDeleteProject(proj.id)}
                                  className="w-4 h-4 rounded-full bg-indigo-100/60 text-indigo-550 hover:bg-rose-500 hover:text-white flex items-center justify-center font-bold text-[8px] border-none cursor-pointer transition-colors"
                                  title="프로젝트 삭제"
                                >
                                  ✕
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div> {/* 지출 환경 설정 센터 탭 패널 닫기 */}

          </div> {/* 우측 열 닫기 */}

        </div> {/* 상단 2열 그리드 닫기 */}

        {/* ================= 하단 1열 가로 전체 폭 배치 (지출 장부 대장) ================= */}
        {/* 4. 📋 지출 장부 관리 대장 테이블 (거래 관리 AI 정밀 조회 및 일괄 연동 패킹) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden space-y-0 w-full">
              
              {/* 상단 통합 대장 컨트롤 바 */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-2 shrink-0">
                  <FileText className="w-5 h-5 text-rose-500" />
                  <h2 className="font-black text-slate-800 text-sm">지출 목록 ({filteredExpenses.length}건)</h2>
                  {selectedIds.size > 0 && (
                    <span className="text-[10px] text-rose-650 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full font-black animate-bounce shadow-3xs">
                      {selectedIds.size}개 선택됨
                    </span>
                  )}
                </div>

                <div className="flex flex-col xl:flex-row items-center gap-3 w-full md:w-auto">
                  
                  {/* 📅 지출결의 일자 기간 조회 피커 (Calendar Icon + Input Date) */}
                  <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full w-full sm:w-auto shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input 
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="text-xs outline-none bg-transparent font-bold text-slate-700 border-none w-28 cursor-pointer focus:text-rose-500 transition-colors"
                      title="조회 시작일자"
                    />
                    <span className="text-[10px] text-slate-400 font-extrabold whitespace-nowrap">~</span>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="text-xs outline-none bg-transparent font-bold text-slate-700 border-none w-28 cursor-pointer focus:text-rose-500 transition-colors"
                      title="조회 종료일자"
                    />
                    
                    {/* 기간 초기화 단추 */}
                    {(startDate || endDate) && (
                      <button 
                        onClick={() => setQuickRange('clear')}
                        className="text-[10px] font-black text-rose-500 hover:text-rose-700 cursor-pointer ml-1 transition-colors border-none bg-transparent p-0 flex items-center justify-center w-4 h-4 rounded-full hover:bg-rose-50"
                        title="기간 검색 초기화"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* ⚡ 퀵 기간 조회 템플릿 프리셋 칩 단추들 */}
                  <div className="flex items-center gap-1.5 bg-slate-100/60 p-1 rounded-full w-full sm:w-auto justify-start shrink-0 border border-slate-200/50">
                    <button 
                      onClick={() => setQuickRange('today')}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black border transition-all cursor-pointer ${
                        startDate === new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10) && endDate === new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
                          ? 'bg-rose-500 text-white border-rose-500 shadow-3xs'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      오늘
                    </button>
                    <button 
                      onClick={() => setQuickRange('week')}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black border transition-all cursor-pointer ${
                        startDate === new Date(Date.now() + 9 * 60 * 60 * 1000 - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
                          ? 'bg-rose-500 text-white border-rose-500 shadow-3xs'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      1주일
                    </button>
                    <button 
                      onClick={() => setQuickRange('month')}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black border transition-all cursor-pointer ${
                        startDate === (() => {
                          const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
                          d.setMonth(d.getMonth() - 1);
                          return d.toISOString().slice(0, 10);
                        })()
                          ? 'bg-rose-500 text-white border-rose-500 shadow-3xs'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      1개월
                    </button>
                    <button 
                      onClick={() => setQuickRange('3month')}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black border transition-all cursor-pointer ${
                        startDate === (() => {
                          const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
                          d.setMonth(d.getMonth() - 3);
                          return d.toISOString().slice(0, 10);
                        })()
                          ? 'bg-rose-500 text-white border-rose-500 shadow-3xs'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      3개월
                    </button>
                  </div>

                  {/* 비목 필터 */}
                  <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-full w-full sm:w-auto shrink-0">
                    <span className="text-[9px] font-extrabold text-slate-500 whitespace-nowrap">비목:</span>
                    <select 
                      value={activeCategoryFilter}
                      onChange={e => setActiveCategoryFilter(e.target.value)}
                      className="text-xs outline-none bg-transparent font-black text-slate-700 cursor-pointer border-none pr-4"
                    >
                      <option value="ALL">전체 보기</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* 둥근 검색바 (거래 관리 AI 스타일) */}
                  <div className="relative w-full sm:w-40 shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="품명/메모 검색..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-full focus:ring-2 focus:ring-rose-500 outline-none text-xs bg-white font-bold text-slate-800"
                    />
                  </div>

                  {/* 일괄 삭제 액션 단추 */}
                  {selectedIds.size > 0 && (
                    <button 
                      onClick={handleDeleteSelectedExpenses}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-black shadow-md flex items-center justify-center shrink-0 border-none transition-all active:scale-95 cursor-pointer w-full sm:w-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      선택 일괄 삭제
                    </button>
                  )}
                </div>
              </div>

              {/* 테이블 본문 (거래 관리 AI 콤팩트 규격 이식) */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <input 
                          type="checkbox" 
                          onChange={toggleSelectAll} 
                          checked={paginatedExpenses.length > 0 && selectedIds.size === filteredExpenses.length} 
                          className="rounded text-rose-500 focus:ring-0 cursor-pointer" 
                        />
                      </th>
                      <th className="p-4 font-bold text-[10px]">품의일자</th>
                      <th className="p-4 font-bold text-[10px]">영수증</th>
                      <th className="p-4 font-bold text-[10px]">적요 (지출 품명/내역)</th>
                      <th className="p-4 font-bold text-[10px]">계정 과목</th>
                      <th className="p-4 font-bold text-[10px] text-right">지출 금액</th>
                      <th className="p-4 font-bold text-[10px] text-center">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {paginatedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 font-bold">
                          {expenses.length === 0 ? "등록된 지출 내역이 대장에 없습니다." : "검색 결과와 부합하는 지출 내역이 없습니다."}
                        </td>
                      </tr>
                    ) : (
                      paginatedExpenses.map((exp) => (
                        <tr 
                          key={exp.id} 
                          className={`border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors ${
                            selectedIds.has(exp.id) ? 'bg-rose-50/20' : ''
                          }`}
                          onClick={() => toggleSelect(exp.id)}
                        >
                          <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={selectedIds.has(exp.id)} 
                              onChange={() => toggleSelect(exp.id)} 
                              className="rounded text-rose-500 focus:ring-0 cursor-pointer" 
                            />
                          </td>
                          <td className="p-4 text-slate-500 font-semibold font-mono text-[10px]">
                            {exp.expense_date}
                          </td>
                          <td className="p-4" onClick={e => e.stopPropagation()}>
                            {exp.attachment_url ? (
                              <button
                                onClick={() => {
                                  const win = window.open();
                                  if (win) {
                                    win.document.write(`<iframe src="${exp.attachment_url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                  }
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold transition-all shadow-3xs active:scale-95 cursor-pointer"
                              >
                                📄 보기
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-light pl-2">-</span>
                            )}
                          </td>
                          <td className="p-4 font-bold text-slate-800 max-w-[180px]" title={exp.title}>
                            <span className="whitespace-pre-line leading-relaxed block">{exp.title}</span>
                            
                            {/* 지출 태그들을 예쁜 해시태그 칩으로 렌더링 */}
                            {exp.memo && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {exp.memo.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                                  <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[8px] font-bold border border-slate-200 shadow-3xs">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {(() => {
                              try {
                                const parsed = JSON.parse(exp.ai_analysis || "{}");
                                if (parsed.payee) {
                                  return (
                                    <span className="inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[8px] font-black border border-rose-100 shadow-3xs">
                                      🏢 거래처/영수인: {parsed.payee}
                                    </span>
                                  );
                                }
                              } catch (e) {}
                              return null;
                            })()}
                          </td>
                          <td className="p-4">
                            {(() => {
                              // 소분류가 어떤 대분류, 중분류에 속하는지 동적으로 역산
                              let mainCat = "기타";
                              let midCat = "일반공통";
                              for (const main of Object.keys(ACCOUNT_CATEGORIES)) {
                                for (const mid of Object.keys(ACCOUNT_CATEGORIES[main])) {
                                  if (ACCOUNT_CATEGORIES[main][mid].includes(exp.category)) {
                                    mainCat = main;
                                    midCat = mid;
                                    break;
                                  }
                                }
                                if (mainCat !== "기타") break;
                              }
                              
                              const colorClass = {
                                "판매비와관리비": "bg-blue-50 border-blue-100 text-blue-700",
                                "제조/물류원가": "bg-amber-50 border-amber-100 text-amber-700",
                                "영업외비용": "bg-purple-50 border-purple-100 text-purple-700",
                                "기타": "bg-slate-100 border-slate-200 text-slate-700"
                              }[mainCat] || "bg-slate-100 border-slate-200 text-slate-700";

                              return (
                                <div className="flex flex-col space-y-1.5 items-start">
                                  <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[8px] font-black border ${colorClass}`}>
                                    {mainCat}
                                  </span>
                                  <div className="text-[10px] font-bold text-slate-450 flex items-center gap-0.5 leading-none">
                                    <span>{midCat}</span>
                                    <span className="text-slate-300 font-bold text-[8px] mx-0.5">〉</span>
                                    <span className="text-slate-800 font-black">{exp.category}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-4 text-right font-black text-slate-850 font-mono">
                            {exp.amount.toLocaleString()}원
                            <span className="block text-[8px] text-slate-400 font-bold mt-0.5">{exp.payment_method}</span>
                          </td>
                          <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1.5 text-slate-350 hover:text-rose-600 rounded hover:bg-rose-50 transition-all cursor-pointer border-none"
                              title="지출 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 하단 컨트롤 바 (거래 관리 AI 정밀 조율 이식) */}
              <div className="bg-slate-50/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">페이지당 표시:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={e => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }} 
                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 focus:border-rose-500"
                  >
                    <option value={5}>5개씩 보기</option>
                    <option value={10}>10개씩 보기</option>
                    <option value={20}>20개씩 보기</option>
                    <option value={50}>50개씩 보기</option>
                  </select>
                  <span className="text-xs text-slate-400 font-semibold ml-2">
                    {filteredExpenses.length === 0 
                      ? "전체 0건 표시" 
                      : `전체 ${filteredExpenses.length}건 중 ${startIndex + 1}-${Math.min(endIndex, filteredExpenses.length)}건 표시`}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button 
                    disabled={currentPage === 1 || totalPages <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 text-[11px] font-bold text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    이전
                  </button>
                  {totalPages <= 1 ? (
                    <button 
                      disabled
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-500 text-white shadow-sm border border-rose-500 cursor-not-allowed"
                    >
                      1
                    </button>
                  ) : (
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          currentPage === page 
                            ? 'bg-rose-500 text-white shadow-sm border border-rose-500' 
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        {page}
                      </button>
                    ))
                  )}
                  <button 
                    disabled={currentPage === totalPages || totalPages <= 1}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 text-[11px] font-bold text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    다음
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}
      
      {/* 하단 시스템 도움 배너 */}
      <div className="bg-slate-100/80 border border-slate-200 p-4 rounded-2xl flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-655 leading-relaxed space-y-1">
          <p className="font-extrabold text-slate-800">💡 [지출 관리 AI] 프리미엄 자동화 안내</p>
          <p>• 영수증 드롭존에 모바일 결제 스크린샷 이미지 또는 전자영수증 **PDF 파일**을 그냥 드래그 앤 드롭하시면, AI가 눈 깜짝할 사이에 정보를 완벽 파싱해 줍니다.</p>
          <p>• 월간 누적 지출이 한도의 지정 임계값에 도달할 때 자동 발송되는 **SMS 경고 문구 템플릿**을 사장님이 원하는 형태로 언제든지 자유롭게 기입하여 커스터마이징할 수 있습니다.</p>
        </div>
      </div>

    </div>
  );
}
