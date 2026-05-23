"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Smartphone, ScanLine, FileText, CheckCircle, AlertTriangle, X, Bot, Sparkles, Upload, Download, Search } from "lucide-react";
import * as XLSX from "xlsx";

interface Customer {
  id: number;
  name: string;
  phone: string;
  tags: string;
}

interface AdTemplate {
  id: string;
  name: string;
  header: string;
  footer: string;
  optOut: string;
}

interface MessageTemplate {
  id: number;
  title: string;
  content: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  url: string;
}

interface Transaction {
  id: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  amount: string;
  orderDate: string;
  status: string;
}

const SPAM_KEYWORDS = ["무료", "당일특가", "할인", "http://", "https://", "!!", "지금", "마감", "100%"];

export default function SmsPage() {
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // Excel Upload States
  const [targetMode, setTargetMode] = useState<'db' | 'excel'>('db');
  const [excelCustomers, setExcelCustomers] = useState<Customer[]>([]);
  const [selectedExcelIds, setSelectedExcelIds] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Anti-Spam States
  const [isAd, setIsAd] = useState(false);
  const [adHeader, setAdHeader] = useState("(광고) [EGDesk]");
  const [adFooter, setAdFooter] = useState("무료수신거부:");
  const [optOutPhone, setOptOutPhone] = useState("010-0000-0000");
  const [spamRisk, setSpamRisk] = useState<{ score: number, words: string[] }>({ score: 0, words: [] });
  const [adTemplates, setAdTemplates] = useState<AdTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  
  // Product States
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  
  // Transaction States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Message Template States
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  
  // Sending States
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

  // Test Send States
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhone, setTestPhone] = useState("");

  // AI States
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleAiGenerate = async () => {
    if (!aiPrompt) return alert("프롬프트를 입력해주세요.");
    
    setIsAiLoading(true);
    setAiError("");
    try {
      const res = await fetch('/api/ai-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, customers: targetMode === 'db' ? customers : excelCustomers })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      if (data.targetIds && data.targetIds.length > 0) {
        if (targetMode === 'db') setSelectedIds(new Set(data.targetIds));
        else setSelectedExcelIds(new Set(data.targetIds));
      } else {
        alert("AI가 조건에 맞는 고객을 찾지 못했습니다.");
      }
      
      if (data.messageContent) {
        setMessage(data.messageContent);
      }
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // DB 연동 고객 검색 및 페이지네이션 상태
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbCurrentPage, setDbCurrentPage] = useState(1);
  const [dbItemsPerPage, setDbItemsPerPage] = useState(10);

  // 엑셀 업로드 고객 검색 및 페이지네이션 상태
  const [excelSearchQuery, setExcelSearchQuery] = useState('');
  const [excelCurrentPage, setExcelCurrentPage] = useState(1);
  const [excelItemsPerPage, setExcelItemsPerPage] = useState(10);

  // 검색어 입력 시 페이지 번호 초기화
  useEffect(() => {
    setDbCurrentPage(1);
  }, [dbSearchQuery]);

  useEffect(() => {
    setExcelCurrentPage(1);
  }, [excelSearchQuery]);

  // 발송 대상 모드 변경 시 페이지 번호 초기화
  useEffect(() => {
    setDbCurrentPage(1);
    setExcelCurrentPage(1);
  }, [targetMode]);

  // DB 연동 고객 필터링 및 슬라이싱 파생 변수 연산
  const filteredDbCustomers = customers.filter(c => {
    const query = dbSearchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = c.name?.toLowerCase().includes(query) || false;
    const phoneMatch = c.phone?.toLowerCase().includes(query) || false;
    const tagMatch = c.tags?.toLowerCase().includes(query) || false;
    return nameMatch || phoneMatch || tagMatch;
  });

  const totalDbPages = Math.ceil(filteredDbCustomers.length / dbItemsPerPage);
  const startDbIndex = (dbCurrentPage - 1) * dbItemsPerPage;
  const endDbIndex = startDbIndex + dbItemsPerPage;
  const paginatedDbCustomers = filteredDbCustomers.slice(startDbIndex, endDbIndex);

  // 엑셀 업로드 고객 필터링 및 슬라이싱 파생 변수 연산
  const filteredExcelCustomers = excelCustomers.filter(c => {
    const query = excelSearchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = c.name?.toLowerCase().includes(query) || false;
    const phoneMatch = c.phone?.toLowerCase().includes(query) || false;
    const tagMatch = c.tags?.toLowerCase().includes(query) || false;
    return nameMatch || phoneMatch || tagMatch;
  });

  const totalExcelPages = Math.ceil(filteredExcelCustomers.length / excelItemsPerPage);
  const startExcelIndex = (excelCurrentPage - 1) * excelItemsPerPage;
  const endExcelIndex = startExcelIndex + excelItemsPerPage;
  const paginatedExcelCustomers = filteredExcelCustomers.slice(startExcelIndex, endExcelIndex);

  useEffect(() => {
    fetchCustomers();
    checkConnectionStatus();
    fetchAdTemplates();
    fetchProducts();
    fetchTransactions();
    fetchMessageTemplates();
  }, []);

  const fetchMessageTemplates = async () => {
    try {
      const res = await fetch('/api/message-templates');
      const json = await res.json();
      if (json.success) {
        setMessageTemplates(json.templates);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const json = await res.json();
      if (json.success) {
        setTransactions(json.transactions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (json.success) {
        setProducts(json.products);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdTemplates = async () => {
    try {
      const res = await fetch('/api/ad-templates');
      const json = await res.json();
      if (json.success) {
        setAdTemplates(json.templates);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const res = await fetch('/api/sms/status');
      const json = await res.json();
      if (json.success && json.isConnected) {
        setIsConnected(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const foundWords = SPAM_KEYWORDS.filter(word => message.includes(word));
    setSpamRisk({
      score: foundWords.length,
      words: foundWords
    });
  }, [message]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data.rows || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePairing = async () => {
    setIsPairing(true);
    try {
      const res = await fetch('/api/sms/setup');
      const json = await res.json();
      if (json.message === '연동 성공') {
        setIsConnected(true);
        alert("Google 메시지 연동이 완료되었습니다.");
      } else {
        alert("연동 실패: " + (json.error || "알 수 없는 오류"));
      }
    } catch (err) {
      alert("서버 연결에 실패했습니다.");
    } finally {
      setIsPairing(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (targetMode === 'db') {
      const newSet = new Set(selectedIds);
      paginatedDbCustomers.forEach(c => {
        if (e.target.checked) newSet.add(c.id);
        else newSet.delete(c.id);
      });
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedExcelIds);
      paginatedExcelCustomers.forEach(c => {
        if (e.target.checked) newSet.add(c.id);
        else newSet.delete(c.id);
      });
      setSelectedExcelIds(newSet);
    }
  };

  const toggleSelect = (id: number) => {
    if (targetMode === 'db') {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedExcelIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedExcelIds(newSet);
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const parsedCustomers: Customer[] = data.map((row: any, index) => {
          const name = row['이름'] || row['성명'] || row['name'] || row['Name'] || '';
          const phone = row['연락처'] || row['전화번호'] || row['휴대폰'] || row['phone'] || row['Phone'] || '';
          const tags = row['태그'] || row['메모'] || row['tags'] || row['Tags'] || '엑셀업로드';
          
          return {
            id: -(index + 1), // Use negative IDs for excel customers
            name: String(name),
            phone: String(phone),
            tags: String(tags)
          };
        }).filter(c => c.name && c.phone);

        if (parsedCustomers.length === 0) {
          alert("유효한 데이터가 없습니다. '이름', '연락처' 열이 첫 번째 줄(헤더)에 포함되어 있는지 확인해주세요.");
          return;
        }

        setExcelCustomers(parsedCustomers);
        setSelectedExcelIds(new Set(parsedCustomers.map(c => c.id)));
        alert(`${parsedCustomers.length}명의 고객 명단을 성공적으로 불러왔습니다.`);
      } catch (err) {
        alert("엑셀 파일을 읽는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsBinaryString(file);
    if (e.target) e.target.value = '';
  };

  const handleDeleteSelectedExcel = () => {
    if (selectedExcelIds.size === 0) return;
    if (!confirm(`선택한 ${selectedExcelIds.size}명의 명단을 삭제하시겠습니까?`)) return;
    
    setExcelCustomers(prev => prev.filter(c => !selectedExcelIds.has(c.id)));
    setSelectedExcelIds(new Set());
  };

  const downloadSampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 이름: "홍길동", 연락처: "010-1234-5678", 태그: "VIP" },
      { 이름: "김철수", 연락처: "010-9876-5432", 태그: "단골" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "고객명단");
    XLSX.writeFile(wb, "문자발송_엑셀업로드_양식.xlsx");
  };

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + variable);
  };

  const saveAdTemplate = async () => {
    const name = prompt("현재 헤더/푸터 설정을 저장할 템플릿 이름을 입력하세요:");
    if (!name) return;
    
    const newTemplate = {
      id: Date.now().toString(),
      name,
      header: adHeader,
      footer: adFooter,
      optOut: optOutPhone
    };
    
    try {
      const res = await fetch('/api/ad-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });
      const json = await res.json();
      if (json.success) {
        setAdTemplates([...adTemplates, { ...newTemplate, id: json.id }]);
        alert("템플릿이 DB에 저장되었습니다.");
      } else {
        alert("저장 실패: " + json.error);
      }
    } catch (e) {
      alert("템플릿 저장 중 오류가 발생했습니다.");
    }
  };

  const loadAdTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    if (!id) return;
    
    const t = adTemplates.find(x => x.id === id);
    if (t) {
      setAdHeader(t.header);
      setAdFooter(t.footer);
      setOptOutPhone(t.optOut);
    }
  };

  const deleteAdTemplate = async () => {
    if (!selectedTemplateId) return;
    if (!confirm("이 템플릿을 DB에서 완전히 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetch(`/api/ad-templates?id=${selectedTemplateId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setAdTemplates(adTemplates.filter(t => t.id !== selectedTemplateId));
        setSelectedTemplateId("");
      } else {
        alert("삭제 실패: " + json.error);
      }
    } catch (e) {
      alert("템플릿 삭제 중 오류가 발생했습니다.");
    }
  };

  const saveProduct = async () => {
    const name = prompt("광고할 상품명을 입력하세요 (예: 여름 특가 에어컨):");
    if (!name) return;
    const price = prompt("가격을 입력하세요 (선택사항, 예: 1,500,000원):") || "";
    const url = prompt("랜딩 URL을 입력하세요 (선택사항, 예: https://egdesk.com):") || "";
    
    const newProduct = {
      id: Date.now().toString(),
      name,
      price,
      url
    };
    
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      const json = await res.json();
      if (json.success) {
        setProducts([...products, { ...newProduct, id: json.id }]);
        setSelectedProductId(json.id);
        alert("상품이 등록되었습니다.");
      } else {
        alert("상품 등록 실패: " + json.error);
      }
    } catch (e) {
      alert("상품 등록 중 오류가 발생했습니다.");
    }
  };

  const deleteProduct = async () => {
    if (!selectedProductId) return;
    if (!confirm("이 상품을 DB에서 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetch(`/api/products?id=${selectedProductId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setProducts(products.filter(p => p.id !== selectedProductId));
        setSelectedProductId("");
      } else {
        alert("삭제 실패: " + json.error);
      }
    } catch (e) {
      alert("상품 삭제 중 오류가 발생했습니다.");
    }
  };

  const generateFinalMessage = (baseMessage: string, customer: Customer, isAd: boolean, optOut: string, header: string, footer: string, product?: Product, assignedCouponCode?: string) => {
    let finalMsg = baseMessage.replace(/{이름}/g, customer.name).replace(/{연락처}/g, customer.phone);
    
    if (finalMsg.includes("{최근구매내역}")) {
      // 2번 방식: 트랜잭션 DB에서 가장 최근에 구매한 내역 탐색
      const customerTx = transactions.filter(t => t.customerPhone === customer.phone);
      // 최근순으로 정렬되어 있으므로 첫 번째 요소가 최신 구매내역
      const latestTx = customerTx.length > 0 ? customerTx[0].productName : (customer.tags || "상품"); // 1번 방식 병합: 내역이 없으면 tags(메모) 사용
      finalMsg = finalMsg.replace(/{최근구매내역}/g, latestTx);
    }

    if (assignedCouponCode) {
      finalMsg = finalMsg.replace(/{쿠폰코드}/g, assignedCouponCode);
    } else if (finalMsg.includes("{쿠폰코드}")) {
      finalMsg = finalMsg.replace(/{쿠폰코드}/g, "COUPON-XXXX-XXXX");
    }

    if (product) {
      finalMsg = finalMsg
        .replace(/{상품명}/g, product.name)
        .replace(/{금액}/g, product.price)
        .replace(/{URL}/g, product.url);
    }
    if (isAd) {
      finalMsg = `${header}\n${finalMsg}\n${footer} ${optOut}`;
    }
    return finalMsg;
  };

  const handleTestSend = async () => {
    if (!isConnected) {
      alert("구글 메시지 앱과 연동되어 있지 않습니다. 우측 상단의 [QR 코드로 연동하기] 버튼을 눌러 연동을 먼저 진행해주세요.");
      return;
    }
    if (!testPhone) {
      alert("테스트 수신 번호를 입력해주세요.");
      return;
    }
    if (!message) {
      alert("메시지를 입력해주세요.");
      return;
    }

    const dummyCustomer = { id: 0, name: "홍길동", phone: testPhone, tags: "테스트" };
    const selectedProduct = products.find(p => p.id === selectedProductId);
    const testCouponCode = message.includes("{쿠폰코드}") ? "TEST-COUPON-1234" : undefined;
    const finalMsg = generateFinalMessage(message, dummyCustomer, isAd, optOutPhone, adHeader, adFooter, selectedProduct, testCouponCode);
    
    setIsSending(true);
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testPhone,
          message: finalMsg,
          customerId: null
        })
      });
      const json = await res.json();
      if (json.success) {
        alert("테스트 발송이 완료되었습니다.");
        setShowTestModal(false);
      } else {
        alert("발송 실패: " + json.error);
      }
    } catch (e) {
      alert("발송 요청 중 오류가 발생했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    if (!isConnected) {
      alert("구글 메시지 앱과 연동되어 있지 않습니다. 우측 상단의 [QR 코드로 연동하기] 버튼을 눌러 연동을 먼저 진행해주세요.");
      return;
    }
    if (targetMode === 'db' && selectedIds.size === 0) {
      alert("발송 대상을 선택해주세요.");
      return;
    }
    if (targetMode === 'excel' && selectedExcelIds.size === 0) {
      alert("발송 대상을 선택해주세요.");
      return;
    }
    if (!message) {
      alert("메시지를 입력해주세요.");
      return;
    }

    const totalTargets = targetMode === 'db' ? selectedIds.size : selectedExcelIds.size;
    let activeCoupons: any[] = [];

    // 메시지에 {쿠폰코드} 변수가 있을 경우 사전 체크
    if (message.includes("{쿠폰코드}")) {
      try {
        const res = await fetch('/api/coupons');
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "쿠폰 목록을 가져올 수 없습니다.");
        
        activeCoupons = (json.coupons || []).filter((c: any) => c.status === 'active');
        
        if (activeCoupons.length < totalTargets) {
          alert(`사용 가능한 활성 쿠폰이 부족하여 발송을 취소합니다.\n\n필요한 쿠폰: ${totalTargets}장\n남은 활성 쿠폰: ${activeCoupons.length}장\n\n쿠폰 관리 페이지에서 쿠폰을 추가로 발급해 주세요.`);
          return;
        }

        if (!confirm(`사용 가능한 활성 쿠폰이 확인되었습니다. (잔여: ${activeCoupons.length}장)\n발송 시 각 고객별로 쿠폰이 1장씩 자동 매핑되어 발송되며, 사용('used') 상태로 즉시 변경됩니다. 발송하시겠습니까?`)) {
          return;
        }
      } catch (error: any) {
        alert("쿠폰 정보를 확인하는 과정에서 오류가 발생했습니다: " + error.message);
        return;
      }
    }

    setIsSending(true);
    setSendProgress({ current: 0, total: totalTargets });

    const selectedCustomers = targetMode === 'db' 
      ? customers.filter(c => selectedIds.has(c.id))
      : excelCustomers.filter(c => selectedExcelIds.has(c.id));
    const selectedProduct = products.find(p => p.id === selectedProductId);

    for (let i = 0; i < selectedCustomers.length; i++) {
      const customer = selectedCustomers[i];
      
      // 해당 순서의 쿠폰 매핑
      const assignedCoupon = message.includes("{쿠폰코드}") ? activeCoupons[i] : null;
      const assignedCouponCode = assignedCoupon ? assignedCoupon.code : undefined;

      const finalMsg = generateFinalMessage(message, customer, isAd, optOutPhone, adHeader, adFooter, selectedProduct, assignedCouponCode);
      
      try {
        const sendRes = await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: customer.phone,
            message: finalMsg,
            customerId: customer.id
          })
        });
        
        const sendJson = await sendRes.json();
        
        // 발송 성공 후 쿠폰 사용 상태 업데이트
        if (sendJson.success && assignedCoupon) {
          await fetch('/api/coupons', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: assignedCoupon.id,
              status: 'used'
            })
          });
        }
      } catch (e) {
        console.error("Failed to send to", customer.name, e);
      }

      setSendProgress({ current: i + 1, total: selectedCustomers.length });

      if (i < selectedCustomers.length - 1) {
        const delay = Math.floor(Math.random() * 4000) + 3500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setIsSending(false);
    alert("전체 발송이 완료되었습니다.");
  };

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-bold text-slate-800">문자 발송 (Anti-Spam)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Panel */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
            <h2 className="text-lg font-bold text-indigo-900 mb-3 flex items-center">
              <Bot className="w-5 h-5 mr-2 text-indigo-600" />
              AI 비서에게 발송 타겟팅 & 내용 작성 부탁하기
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="예: 단골 고객들에게 이번 주말 50% 세일 문자를 작성해줘."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="flex-1 border border-indigo-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
              />
              <button 
                onClick={handleAiGenerate}
                disabled={isAiLoading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center font-medium disabled:opacity-50 whitespace-nowrap"
              >
                {isAiLoading ? (
                  <span className="flex items-center"><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> 생성 중...</span>
                ) : (
                  <span className="flex items-center"><Sparkles className="w-4 h-4 mr-2" /> 자동 완성</span>
                )}
              </button>
            </div>
            {aiError && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> {aiError}</p>}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                메시지 작성
              </div>
              
              <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="text-sm text-slate-500 ml-1 font-medium">광고 상품:</span>
                <select 
                  className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 bg-white min-w-[120px]"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">선택 안함</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedProductId && (
                  <button onClick={deleteProduct} className="p-1 text-red-500 hover:bg-red-100 rounded" title="상품 삭제">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={saveProduct} className="px-2 py-1 bg-white text-blue-600 rounded border border-blue-200 text-xs hover:bg-blue-50 font-medium">
                  + 새 상품 등록
                </button>
              </div>
            </h2>

            <div className="flex space-x-2 mb-3 bg-slate-100 p-2 rounded-lg">
              <span className="text-xs font-bold text-slate-500 self-center px-1">기본 변수:</span>
              <button onClick={() => insertVariable("{이름}")} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-xs hover:bg-slate-50 shadow-sm">
                + {"{이름}"}
              </button>
              <button onClick={() => insertVariable("{연락처}")} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-xs hover:bg-slate-50 shadow-sm">
                + {"{연락처}"}
              </button>
              <button onClick={() => insertVariable("{최근구매내역}")} className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded text-xs hover:bg-orange-100 shadow-sm">
                + {"{최근구매내역}"}
              </button>
              <button onClick={() => insertVariable("{쿠폰코드}")} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-xs hover:bg-emerald-100 shadow-sm">
                + {"{쿠폰코드}"}
              </button>
              
              <div className="w-px h-6 bg-slate-300 mx-2 self-center"></div>
              
              <span className="text-xs font-bold text-blue-500 self-center px-1">상품 변수:</span>
              <button onClick={() => insertVariable("{상품명}")} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs hover:bg-blue-100 shadow-sm">
                + {"{상품명}"}
              </button>
              <button onClick={() => insertVariable("{금액}")} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs hover:bg-blue-100 shadow-sm">
                + {"{금액}"}
              </button>
              <button onClick={() => insertVariable("{URL}")} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs hover:bg-blue-100 shadow-sm">
                + {"{URL}"}
              </button>
            </div>

            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={isAd} onChange={(e) => setIsAd(e.target.checked)} className="rounded text-blue-600" />
                  <span className="font-medium text-slate-700">광고성 메시지로 발송 (자동 헤더/푸터 추가)</span>
                </label>
                {isAd && (
                  <div className="flex items-center space-x-2">
                    <select 
                      onChange={loadAdTemplate} 
                      className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 bg-white"
                      value={selectedTemplateId}
                    >
                      <option value="">템플릿 선택...</option>
                      {adTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    {selectedTemplateId && (
                      <button 
                        onClick={deleteAdTemplate}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        title="템플릿 삭제"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={saveAdTemplate}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 border border-blue-200"
                    >
                      현재 설정 저장
                    </button>
                  </div>
                )}
              </div>
              {isAd && (
                <div className="flex flex-col space-y-2 pl-6 mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500 w-24">헤더 문구:</span>
                    <input 
                      type="text" 
                      value={adHeader} 
                      onChange={e => setAdHeader(e.target.value)}
                      className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 w-64"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500 w-24">푸터 문구:</span>
                    <input 
                      type="text" 
                      value={adFooter} 
                      onChange={e => setAdFooter(e.target.value)}
                      className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 w-32"
                    />
                    <input 
                      type="text" 
                      value={optOutPhone} 
                      onChange={e => setOptOutPhone(e.target.value)}
                      placeholder="수신거부 번호"
                      className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 w-40"
                    />
                  </div>
                </div>
              )}
            </div>

            <textarea
              className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="여기에 보낼 메시지를 입력하세요... (변수: {이름}, {연락처})"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            {message && (
              <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-sm font-bold text-slate-600 mb-2">실제 발송 미리보기:</p>
                <div className="text-sm text-slate-700 whitespace-pre-wrap bg-white p-3 rounded border border-slate-200">
                  {generateFinalMessage(message, { id: 0, name: "홍길동", phone: "010-1234-5678", tags: "" }, isAd, optOutPhone, adHeader, adFooter, products.find(p => p.id === selectedProductId))}
                </div>
              </div>
            )}

            {spamRisk.score > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start text-red-700 text-sm">
                <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                <div>
                  <p className="font-bold">스팸 필터 주의</p>
                  <p>스팸으로 의심받기 쉬운 키워드가 포함되어 있습니다: <strong>{spamRisk.words.join(", ")}</strong></p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-slate-500">{message.length} / 2000 자</span>
              <div className="flex space-x-2">
                <button 
                  onClick={async () => {
                    const title = prompt("현재 작성된 메시지를 템플릿으로 저장합니다. 템플릿의 제목을 입력하세요:");
                    if (!title) return;
                    try {
                      const res = await fetch('/api/message-templates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, content: message })
                      });
                      const json = await res.json();
                      if (json.success) {
                        setMessageTemplates([...messageTemplates, json.template]);
                        alert("템플릿이 저장되었습니다.");
                      } else {
                        alert("저장 실패: " + json.error);
                      }
                    } catch (e) {
                      alert("템플릿 저장 중 오류가 발생했습니다.");
                    }
                  }}
                  className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  + 템플릿으로 저장
                </button>
                <button 
                  onClick={() => setShowTestModal(true)}
                  disabled={isSending}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  테스트 발송
                </button>
                <button 
                  onClick={handleSend}
                  disabled={isSending}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center text-white ${isSending ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? `발송 중... (${sendProgress.current}/${sendProgress.total})` : '본 발송하기'}
                </button>
              </div>
            </div>

            {isSending && sendProgress.total > 0 && (
              <div className="mt-4">
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}></div>
                </div>
                <p className="text-center text-xs text-slate-500 mt-2">기계적 발송을 피하기 위해 랜덤한 대기 시간을 두고 순차 발송합니다.</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">발송 대상 선택</h2>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setTargetMode('db')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${targetMode === 'db' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  DB 연동
                </button>
                <button 
                  onClick={() => setTargetMode('excel')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${targetMode === 'excel' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  엑셀 직접 업로드
                </button>
              </div>
            </div>
            
            {targetMode === 'db' ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="이름, 연락처, 태그로 검색..."
                      value={dbSearchQuery}
                      onChange={e => setDbSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <button onClick={fetchCustomers} className="text-sm text-blue-600 hover:underline">새로고침</button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden h-64 overflow-y-auto">
                  <table className="w-full text-left text-sm relative">
                    <thead className="bg-slate-50 text-slate-600 sticky top-0 shadow-sm z-10">
                      <tr>
                        <th className="p-4 w-12">
                          <input 
                            type="checkbox" 
                            className="rounded text-blue-600" 
                            checked={paginatedDbCustomers.length > 0 && paginatedDbCustomers.every(c => selectedIds.has(c.id))}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="p-4">이름</th>
                        <th className="p-4">연락처</th>
                        <th className="p-4">태그</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedDbCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500">
                            {dbSearchQuery ? "검색 결과와 일치하는 고객이 없습니다." : "등록된 고객이 없습니다. 고객 관리 메뉴에서 등록해주세요."}
                          </td>
                        </tr>
                      ) : (
                        paginatedDbCustomers.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => toggleSelect(c.id)}>
                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                className="rounded text-blue-600" 
                                checked={selectedIds.has(c.id)}
                                onChange={() => toggleSelect(c.id)}
                              />
                            </td>
                            <td className="p-4 font-medium text-slate-800">{c.name}</td>
                            <td className="p-4 text-slate-500">{c.phone}</td>
                            <td className="p-4">
                              {c.tags && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{c.tags}</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">페이지당 표시:</span>
                    <select 
                      value={dbItemsPerPage} 
                      onChange={e => {
                        setDbItemsPerPage(Number(e.target.value));
                        setDbCurrentPage(1);
                      }} 
                      className="border rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 focus:border-blue-500"
                    >
                      <option value={5}>5명씩 보기</option>
                      <option value={10}>10명씩 보기</option>
                      <option value={20}>20명씩 보기</option>
                      <option value={50}>50명씩 보기</option>
                    </select>
                    <span className="text-xs text-slate-400 font-semibold ml-2">
                      {filteredDbCustomers.length === 0 
                        ? "전체 0명 표시" 
                        : `전체 ${filteredDbCustomers.length}명 중 ${startDbIndex + 1}-${Math.min(endDbIndex, filteredDbCustomers.length)}명 표시`}
                    </span>
                    <span className="text-xs text-blue-600 font-semibold ml-2">
                      ({selectedIds.size}명 선택됨)
                    </span>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button 
                      disabled={dbCurrentPage === 1 || totalDbPages <= 1}
                      onClick={() => setDbCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all animate-none"
                    >
                      이전
                    </button>
                    {totalDbPages <= 1 ? (
                      <button 
                        disabled
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm border border-blue-600 disabled:opacity-50 cursor-not-allowed"
                      >
                        1
                      </button>
                    ) : (
                      Array.from({ length: totalDbPages }, (_, i) => i + 1).map(page => (
                        <button 
                          key={page}
                          onClick={() => setDbCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            dbCurrentPage === page 
                              ? 'bg-blue-600 text-white shadow-sm border border-blue-600' 
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          {page}
                        </button>
                      ))
                    )}
                    <button 
                      disabled={dbCurrentPage === totalDbPages || totalDbPages <= 1}
                      onClick={() => setDbCurrentPage(prev => Math.min(totalDbPages, prev + 1))}
                      className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all animate-none"
                    >
                      다음
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div className="text-sm text-slate-600">
                    첫 줄에 <strong className="text-blue-600">이름, 연락처</strong> 열이 포함된 엑셀 파일을 업로드하세요.
                  </div>
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <button 
                      onClick={downloadSampleExcel}
                      className="px-3 py-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center justify-center flex-1 sm:flex-none"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      양식 다운로드
                    </button>
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      ref={fileInputRef}
                      onChange={handleExcelUpload}
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center flex-1 sm:flex-none shadow-sm"
                    >
                      <Upload className="w-4 h-4 mr-1.5" />
                      엑셀 파일 첨부
                    </button>
                  </div>
                </div>

                {/* 엑셀 검색창 */}
                <div className="flex justify-between items-center gap-3 mb-4">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="이름, 연락처, 태그로 검색..."
                      value={excelSearchQuery}
                      onChange={e => setExcelSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden h-64 overflow-y-auto">
                  <table className="w-full text-left text-sm relative">
                    <thead className="bg-slate-50 text-slate-600 sticky top-0 shadow-sm z-10">
                      <tr>
                        <th className="p-4 w-12">
                          <input 
                            type="checkbox" 
                            className="rounded text-blue-600" 
                            checked={paginatedExcelCustomers.length > 0 && paginatedExcelCustomers.every(c => selectedExcelIds.has(c.id))}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="p-4">이름</th>
                        <th className="p-4">연락처</th>
                        <th className="p-4">태그</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedExcelCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-slate-400" />
                              </div>
                              <p>
                                {excelSearchQuery 
                                  ? "검색 결과와 일치하는 고객이 없습니다." 
                                  : <>업로드된 고객 명단이 없습니다.<br/>우측 상단의 <strong>[엑셀 파일 첨부]</strong> 버튼을 눌러 파일을 등록해주세요.</>}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedExcelCustomers.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => toggleSelect(c.id)}>
                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                className="rounded text-blue-600" 
                                checked={selectedExcelIds.has(c.id)}
                                onChange={() => toggleSelect(c.id)}
                              />
                            </td>
                            <td className="p-4 font-medium text-slate-800">{c.name}</td>
                            <td className="p-4 text-slate-500">{c.phone}</td>
                            <td className="p-4">
                              {c.tags && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{c.tags}</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">페이지당 표시:</span>
                    <select 
                      value={excelItemsPerPage} 
                      onChange={e => {
                        setExcelItemsPerPage(Number(e.target.value));
                        setExcelCurrentPage(1);
                      }} 
                      className="border rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 focus:border-blue-500"
                    >
                      <option value={5}>5명씩 보기</option>
                      <option value={10}>10명씩 보기</option>
                      <option value={20}>20명씩 보기</option>
                      <option value={50}>50명씩 보기</option>
                    </select>
                    <span className="text-xs text-slate-400 font-semibold ml-2">
                      {filteredExcelCustomers.length === 0 
                        ? "전체 0명 표시" 
                        : `전체 ${filteredExcelCustomers.length}명 중 ${startExcelIndex + 1}-${Math.min(endExcelIndex, filteredExcelCustomers.length)}명 표시`}
                    </span>
                    <span className="text-xs text-blue-600 font-semibold ml-2">
                      ({selectedExcelIds.size}명 선택됨)
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedExcelIds.size > 0 && (
                      <button 
                        onClick={handleDeleteSelectedExcel}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 rounded-lg border border-red-100 transition-colors flex items-center shadow-2xs mr-2 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        선택 삭제
                      </button>
                    )}

                    <div className="flex space-x-1">
                      <button 
                        disabled={excelCurrentPage === 1 || totalExcelPages <= 1}
                        onClick={() => setExcelCurrentPage(prev => Math.max(1, prev - 1))}
                        className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all animate-none"
                      >
                        이전
                      </button>
                      {totalExcelPages <= 1 ? (
                        <button 
                          disabled
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm border border-blue-600 disabled:opacity-50 cursor-not-allowed"
                        >
                          1
                        </button>
                      ) : (
                        Array.from({ length: totalExcelPages }, (_, i) => i + 1).map(page => (
                          <button 
                            key={page}
                            onClick={() => setExcelCurrentPage(page)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              excelCurrentPage === page 
                                ? 'bg-blue-600 text-white shadow-sm border border-blue-600' 
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            {page}
                          </button>
                        ))
                      )}
                      <button 
                        disabled={excelCurrentPage === totalExcelPages || totalExcelPages <= 1}
                        onClick={() => setExcelCurrentPage(prev => Math.min(totalExcelPages, prev + 1))}
                        className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all animate-none"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl shadow-md text-white">
            <h2 className="text-lg font-bold mb-2 flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              기기 연동 상태
            </h2>
            {isConnected ? (
              <div className="mt-4 bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                <p className="font-semibold flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                  연동 완료 (정상 작동)
                </p>
                <p className="text-sm text-blue-100 mt-2">이제 웹에서 문자를 보낼 수 있습니다.</p>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-blue-100 mb-4">Google 메시지 웹과 휴대폰을 연동해야 자동 문자가 발송됩니다.</p>
                <button 
                  onClick={handlePairing}
                  disabled={isPairing}
                  className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <ScanLine className="w-5 h-5 mr-2" />
                  {isPairing ? "스마트폰으로 스캔해주세요..." : "QR 코드로 연동하기"}
                </button>
                {isPairing && (
                  <p className="text-xs mt-3 text-center text-blue-100">
                    새 브라우저 창에 나타난 QR코드를 스캔하시면 창이 자동으로 닫힙니다. (최대 2분 대기)
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-h-[500px] flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              내 템플릿 모음
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{messageTemplates.length}개</span>
            </h2>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {messageTemplates.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-8">
                  저장된 템플릿이 없습니다.<br/>문자 작성 창에서 저장해보세요.
                </div>
              ) : (
                messageTemplates.map(t => (
                  <div key={t.id} className="group border border-slate-200 rounded-lg hover:border-blue-500 transition-colors bg-white overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center p-3 pb-2 border-b border-slate-50 bg-slate-50/50">
                      <p className="font-semibold text-slate-800 text-sm truncate pr-2">{t.title}</p>
                      <div className="flex space-x-1 shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplate(t);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="수정"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
                            try {
                              await fetch(`/api/message-templates?id=${t.id}`, { method: 'DELETE' });
                              setMessageTemplates(messageTemplates.filter(x => x.id !== t.id));
                            } catch (e) {
                              alert("삭제 중 오류가 발생했습니다.");
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="삭제"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMessage(t.content)} 
                      className="w-full text-left p-3 pt-2 hover:bg-blue-50 transition-colors"
                    >
                      <p className="text-xs text-slate-600 line-clamp-2">{t.content}</p>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">테스트 발송</h3>
              <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">입력하신 번호로 1건의 문자가 즉시 발송됩니다. (변수는 '홍길동'으로 치환됨)</p>
            <input 
              type="text" 
              placeholder="휴대전화 번호 (예: 01012345678)" 
              value={testPhone}
              onChange={e => setTestPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowTestModal(false)} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">취소</button>
              <button 
                onClick={handleTestSend} 
                disabled={isSending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
              >
                {isSending ? "발송 중..." : "테스트 전송"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[500px] shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">템플릿 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">제목</label>
                <input 
                  type="text" 
                  value={editingTemplate.title}
                  onChange={e => setEditingTemplate({...editingTemplate, title: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">내용</label>
                <textarea 
                  value={editingTemplate.content}
                  onChange={e => setEditingTemplate({...editingTemplate, content: e.target.value})}
                  className="w-full h-32 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm">취소</button>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/message-templates', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(editingTemplate)
                    });
                    const json = await res.json();
                    if (json.success) {
                      setMessageTemplates(messageTemplates.map(t => t.id === editingTemplate.id ? editingTemplate : t));
                      setEditingTemplate(null);
                      alert("수정되었습니다.");
                    } else {
                      alert("수정 실패: " + json.error);
                    }
                  } catch (e) {
                    alert("수정 중 오류가 발생했습니다.");
                  }
                }} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
