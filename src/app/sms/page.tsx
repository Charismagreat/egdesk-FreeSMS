"use client";

import { useState, useEffect } from "react";
import { Send, Smartphone, ScanLine, FileText, CheckCircle, AlertTriangle, X, Bot, Sparkles } from "lucide-react";

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
        body: JSON.stringify({ prompt: aiPrompt, customers })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      if (data.targetIds && data.targetIds.length > 0) {
        setSelectedIds(new Set(data.targetIds));
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
    if (e.target.checked) {
      setSelectedIds(new Set(customers.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
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

  const generateFinalMessage = (baseMessage: string, customer: Customer, isAd: boolean, optOut: string, header: string, footer: string, product?: Product) => {
    let finalMsg = baseMessage.replace(/{이름}/g, customer.name).replace(/{연락처}/g, customer.phone);
    
    if (finalMsg.includes("{최근구매내역}")) {
      // 2번 방식: 트랜잭션 DB에서 가장 최근에 구매한 내역 탐색
      const customerTx = transactions.filter(t => t.customerPhone === customer.phone);
      // 최근순으로 정렬되어 있으므로 첫 번째 요소가 최신 구매내역
      const latestTx = customerTx.length > 0 ? customerTx[0].productName : (customer.tags || "상품"); // 1번 방식 병합: 내역이 없으면 tags(메모) 사용
      finalMsg = finalMsg.replace(/{최근구매내역}/g, latestTx);
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
    const finalMsg = generateFinalMessage(message, dummyCustomer, isAd, optOutPhone, adHeader, adFooter, selectedProduct);
    
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
    if (selectedIds.size === 0) {
      alert("발송 대상을 선택해주세요.");
      return;
    }
    if (!message) {
      alert("메시지를 입력해주세요.");
      return;
    }

    setIsSending(true);
    setSendProgress({ current: 0, total: selectedIds.size });

    const selectedCustomers = customers.filter(c => selectedIds.has(c.id));
    const selectedProduct = products.find(p => p.id === selectedProductId);

    for (let i = 0; i < selectedCustomers.length; i++) {
      const customer = selectedCustomers[i];
      const finalMsg = generateFinalMessage(message, customer, isAd, optOutPhone, adHeader, adFooter, selectedProduct);
      
      try {
        await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: customer.phone,
            message: finalMsg,
            customerId: customer.id
          })
        });
      } catch (e) {
        console.error("Failed to send to", customer.name);
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

            {isAd && (
              <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-sm font-bold text-slate-600 mb-2">실제 발송 미리보기:</p>
                <div className="text-sm text-slate-700 whitespace-pre-wrap bg-white p-3 rounded border border-slate-200">
                  {generateFinalMessage(message || '내용', { id: 0, name: "홍길동", phone: "010-1234-5678", tags: "" }, isAd, optOutPhone, adHeader, adFooter, products.find(p => p.id === selectedProductId))}
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
              <h2 className="text-lg font-bold text-slate-800">발송 대상 선택 (DB 연동)</h2>
              <button onClick={fetchCustomers} className="text-sm text-blue-600 hover:underline">새로고침</button>
            </div>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden h-64 overflow-y-auto">
              <table className="w-full text-left text-sm relative">
                <thead className="bg-slate-50 text-slate-600 sticky top-0 shadow-sm">
                  <tr>
                    <th className="p-4 w-12">
                      <input 
                        type="checkbox" 
                        className="rounded text-blue-600" 
                        checked={customers.length > 0 && selectedIds.size === customers.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-4">이름</th>
                    <th className="p-4">연락처</th>
                    <th className="p-4">태그</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        등록된 고객이 없습니다. 고객 관리 메뉴에서 등록해주세요.
                      </td>
                    </tr>
                  ) : (
                    customers.map(c => (
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
            <div className="mt-3 text-sm text-slate-500">
              총 {customers.length}명 중 {selectedIds.size}명 선택됨
            </div>
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
