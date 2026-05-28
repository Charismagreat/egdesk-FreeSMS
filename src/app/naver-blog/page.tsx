'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Settings, Calendar, Heart, MessageCircle, 
  Layers, Image as ImageIcon, Send, Sliders, ToggleLeft, ToggleRight,
  TrendingUp, Users, CheckCircle, RefreshCw, Upload, Eye, FileText,
  AlertTriangle, Check, BookOpen, AlertCircle, ShoppingBag, Search, Plus, Trash2, Globe,
  X, Copy, Terminal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Info
} from 'lucide-react';

// 커스텀 네이버 아이콘 SVG 컴포넌트
function NaverIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
    >
      <path d="M16.273 2.25h5.477V21.75h-5.477l-8.545-12.3v12.3H2.25V2.25h5.477l8.546 12.3V2.25z"/>
    </svg>
  );
}

interface Product {
  id: string;
  name: string;
  price: string;
  main_image_url: string;
  url: string;
  description?: string;
  brand?: string;
  specs?: string;
}

interface NaverPost {
  id: number;
  product_id: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'POSTED' | 'FAILED';
  title: string;
  content: string;
  target_keywords: string;
  image_url: string;
  sub_image_url: string;
  scheduled_at: string;
  posted_at: string | null;
  error_message: string | null;
  views_count: number;
  likes_count: number;
  product?: Product | null;
}

interface AutopilotSettings {
  id: number;
  is_autopilot: number;
  autopilot_interval: string;
  autopilot_time: string;
  tone_style: string;
  naver_blog_id: string;
  api_client_id: string;
  api_client_secret: string;
}

// 페르소나별 키워드 정보 인터페이스
interface KeywordItem {
  keyword: string;
  competition: 'LOW' | 'MEDIUM' | 'HIGH'; // 🟢, 🟡, 🔴
  volume: string;
  reason: string;
}

export default function NaverBlogMarketingPortal() {
  // 상태 변수
  const [settings, setSettings] = useState<AutopilotSettings>({
    id: 1,
    is_autopilot: 0,
    autopilot_interval: 'DAILY',
    autopilot_time: '10:00',
    tone_style: '정보제공형',
    naver_blog_id: '',
    api_client_id: '',
    api_client_secret: ''
  });

  const [posts, setPosts] = useState<NaverPost[]>([]);
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [blogCurrentPage, setBlogCurrentPage] = useState(1);
  const [blogItemsPerPage, setBlogItemsPerPage] = useState(10);

  // 검색어 입력 시 페이지 번호 초기화
  useEffect(() => {
    setBlogCurrentPage(1);
  }, [blogSearchQuery]);

  // 네이버 블로그 포스팅 실시간 필터링 (제목, 키워드, 상품명)
  const filteredPosts = posts.filter(post => {
    const query = blogSearchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const titleMatch = post.title?.toLowerCase().includes(query) || false;
    const keywordMatch = post.target_keywords?.toLowerCase().includes(query) || false;
    const productNameMatch = post.product?.name?.toLowerCase().includes(query) || false;
    
    return titleMatch || keywordMatch || productNameMatch;
  });

  // 네이버 블로그 포스팅 페이지네이션 슬라이싱
  const totalBlogPages = Math.ceil(filteredPosts.length / blogItemsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (blogCurrentPage - 1) * blogItemsPerPage,
    blogCurrentPage * blogItemsPerPage
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // AI 생성 폼 상태
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [targetKeywords, setTargetKeywords] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('정보제공형');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [generatedSubImageUrl, setGeneratedSubImageUrl] = useState('');

  // 2-Way 이미지 셀렉터 탭 (대표 이미지 + 서브 본문 이미지)
  const [imageTab, setImageTab] = useState<'product' | 'ai'>('product');

  // 예약 설정
  const [scheduleDate, setScheduleDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [scheduleTime, setScheduleTime] = useState('10:00');

  // 계정 연결 상태 및 하이브리드 연동 관련 상태 변수
  const [naverBlogIdInput, setNaverBlogIdInput] = useState('');
  const [apiClientIdInput, setApiClientIdInput] = useState('');
  const [apiClientSecretInput, setApiClientSecretInput] = useState('');
  const [isAccountConnected, setIsAccountConnected] = useState(false);
  const [hasSession, setHasSession] = useState(false); // RPA 로그인 세션 보유 여부
  const [activeModeTab, setActiveModeTab] = useState<'rpa' | 'api'>('rpa'); // RPA vs API 탭 모드
  const [isRpaLaunching, setIsRpaLaunching] = useState(false); // RPA 로그인 창 로딩 상태
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false); // RPA 설치 가이드 모달 상태
  const [isDaemonInfoOpen, setIsDaemonInfoOpen] = useState(false); // 데몬 상세 정보 모달 상태
  const [copiedText, setCopiedText] = useState<string | null>(null); // 복사된 텍스트 상태 추적용

  // 예약/발행 목록 중 선택된 미리보기 포스트 상태
  const [selectedPostForPreview, setSelectedPostForPreview] = useState<NaverPost | null>(null);

  // 상품 검색 필터링 상태
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // 알림/피드백 메시지
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // AI Keyword Lab 상태
  const [activePersona, setActivePersona] = useState<'family' | 'single' | 'pet' | 'office'>('family');
  const [generatedKeywords, setGeneratedKeywords] = useState<{
    specKeywords: KeywordItem[];
    familyKeywords: KeywordItem[];
    singleKeywords: KeywordItem[];
    petKeywords: KeywordItem[];
    officeKeywords: KeywordItem[];
  }>({
    specKeywords: [],
    familyKeywords: [],
    singleKeywords: [],
    petKeywords: [],
    officeKeywords: []
  });

  // 애니메이션용 마그네틱 이펙트 상태
  const [flyingKeyword, setFlyingKeyword] = useState<{ text: string; x: number; y: number } | null>(null);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const keywordInputRef = useRef<HTMLInputElement>(null);

  // 실시간 시스템 시간 상태
  const [systemTime, setSystemTime] = useState('');

  // 초기 로딩
  useEffect(() => {
    fetchSettings();
    fetchPosts();
    fetchProducts();
    
    // 실시간 시스템 시간 설정
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) + ' ' + 
                     now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
      setSystemTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // 선택된 상품이 변경될 때마다 자동 속성 매핑 키워드 AI 가동
  useEffect(() => {
    if (selectedProduct) {
      generateKeywordsWithAI(selectedProduct);
    }
  }, [selectedProduct]);

  // 토스트 팝업 띄우기
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 통계 연동 변수 선언
  const isConnected = isAccountConnected;
  const displayAccountStatus = isConnected ? '연동 완료 🟢' : '미연동 🔴';
  const accountSubtext = isConnected 
    ? `${activeModeTab === 'api' ? '공식 API' : 'RPA 자동화'}로 안전하게 연동 중`
    : '네이버 계정을 연결하고 오토파일럿을 활성화하세요';

  const totalCount = posts.length;
  const uploadedCount = posts.filter(p => p.status === 'POSTED').length;
  const uploadSubtext = totalCount > 0
    ? `전체 예약 및 발행 목록 ${totalCount}개 중 ${uploadedCount}개 발행 완료`
    : '예약된 포스팅이 없습니다';

  const postedPosts = posts.filter(p => p.status === 'POSTED');
  const avgViews = postedPosts.length > 0
    ? Math.round(postedPosts.reduce((acc, p) => acc + (p.views_count || 0), 0) / postedPosts.length)
    : 0;
  const viewsSubtext = postedPosts.length > 0
    ? `최근 발행된 포스팅 ${postedPosts.length}개 기준 실시간 조회 분석`
    : '발행된 글이 없어 조회수 집계 전입니다';

  const failedCount = posts.filter(p => p.status === 'FAILED').length;
  const totalProcessed = uploadedCount + failedCount;
  const successRate = totalProcessed > 0
    ? Math.round((uploadedCount / totalProcessed) * 100)
    : 100;
  const successSubtext = failedCount > 0
    ? `발행 실패 ${failedCount}건 감지 - RPA 세션 동기화 상태를 점검해주세요`
    : '시스템 무결성 100% 정상 작동 중';

  // 실시간 뷰어 목업에 표시할 정보 큐레이팅
  const viewTitle = selectedPostForPreview ? selectedPostForPreview.title : (postTitle || '여기에 포스트 제목이 노출됩니다.');
  const viewContent = selectedPostForPreview ? selectedPostForPreview.content : (postContent || '좌측 상품을 클릭하고 AI 원고 빌더를 실행하거나 수동으로 매력적인 SEO 포스팅 본문을 집필해 주세요. 실시간 네이버 모바일 블로그 뷰어 스킨에 맞춰 마크다운과 이모지가 완벽 렌더링됩니다.');
  const viewKeywords = selectedPostForPreview ? selectedPostForPreview.target_keywords : targetKeywords;
  
  let viewMainImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
  let viewSubImage = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80';

  if (selectedPostForPreview) {
    viewMainImage = selectedPostForPreview.image_url;
    viewSubImage = selectedPostForPreview.sub_image_url || viewSubImage;
  } else {
    if (imageTab === 'product' && selectedProduct?.main_image_url) {
      viewMainImage = selectedProduct.main_image_url;
    } else if (imageTab === 'ai' && generatedImageUrl) {
      viewMainImage = generatedImageUrl;
      viewSubImage = generatedSubImageUrl || viewSubImage;
    }
  }

  // 본문 문단 분할 렌더링 헬퍼
  const renderFormattedContent = (txt: string) => {
    return txt.split('\n').map((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return <div key={index} className="h-4" />;
      
      // 소제목 스타일링 (★이나 📌, ■ 등으로 시작할 때)
      if (trimmed.startsWith('★') || trimmed.startsWith('■') || trimmed.startsWith('📌')) {
        return (
          <h4 key={index} className="text-base font-bold text-gray-800 dark:text-gray-100 mt-5 mb-2.5 border-l-[3px] border-[#03C75A] pl-2">
            {trimmed}
          </h4>
        );
      }
      
      return (
        <p key={index} className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-3 break-all whitespace-pre-wrap">
          {trimmed}
        </p>
      );
    });
  };


  // API 데이터 페칭
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/naver-blog/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setHasSession(data.has_session === 1);
        
        if (data.settings.naver_blog_id) {
          setNaverBlogIdInput(data.settings.naver_blog_id);
          
          // 기존에 API Key가 이미 설정되어 있는 계정인 경우 스마트하게 API 모드 탭을 먼저 띄워줍니다.
          if (data.settings.api_client_id && data.settings.api_client_secret) {
            setActiveModeTab('api');
            setIsAccountConnected(true);
          } else {
            setActiveModeTab('rpa');
            // RPA의 경우 세션 파일이 감지되었을 때 연결 완료 상태로 매칭합니다.
            setIsAccountConnected(data.has_session === 1);
          }
          
          setApiClientIdInput(data.settings.api_client_id || '');
          setApiClientSecretInput(data.settings.api_client_secret || '');
        } else {
          // 등록된 계정이 없는 경우 기본적으로 RPA 모드로 세팅합니다.
          setActiveModeTab('rpa');
          setIsAccountConnected(false);
        }
      }
    } catch (err) {
      console.error('네이버 블로그 설정 로딩 에러:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/naver-blog/posts');
      const data = await res.json();
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('게시물 목록 로딩 에러:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
        if (data.products.length > 0) {
          setSelectedProduct(data.products[0]);
        }
      }
    } catch (err) {
      console.error('상품 로딩 에러:', err);
    }
  };

  // 상품 기반 AI 키워드 실시간 자동 생성 (실제 AI 연동 및 로컬 폴백 지원)
  const generateKeywordsWithAI = async (product: Product) => {
    setIsGeneratingKeywords(true);
    try {
      const res = await fetch('/api/naver-blog/generate-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          brand: product.brand,
          description: product.description
        })
      });
      const data = await res.json();
      if (data.success && data.keywords) {
        setGeneratedKeywords(data.keywords);
      } else {
        throw new Error(data.error || '키워드 생성에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('AI 키워드 추출 에러:', err);
      showToast(`AI 키워드 추출 실패: ${err.message || '서버 오류'}`, 'error');
    } finally {
      setIsGeneratingKeywords(false);
    }
  };

  // 4. 마그네틱 원클릭 주입 시스템 (One-Click Injection - 마이크로 모션 이펙트 구현)
  const handleKeywordInject = (keyword: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    
    // 날아가는 애니메이션 좌표 생성
    setFlyingKeyword({
      text: keyword,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });

    // 일정 시간 후 좌측 인풋으로 쏙 흡수 및 상태 업데이트
    setTimeout(() => {
      setFlyingKeyword(null);
      
      // 중복 체크 및 쉼표 구분 추가
      const existing = targetKeywords.split(',').map(k => k.trim()).filter(Boolean);
      if (!existing.includes(keyword)) {
        const updated = [...existing, keyword].join(', ');
        setTargetKeywords(updated);
        showToast(`'${keyword}' 키워드가 타겟 필드에 자석처럼 쏙 주입되었습니다! 🟢`, 'success');
      } else {
        showToast(`'${keyword}'는 이미 타겟 키워드에 주입되어 있습니다.`, 'info');
      }
    }, 700); // 0.7초 후 주입 (framer motion 시간 매칭)
  };

  // 설정 저장
  const saveSettings = async (updatedSettings: Partial<AutopilotSettings>) => {
    try {
      const newSettings = { ...settings, ...updatedSettings };
      const res = await fetch('/api/naver-blog/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setHasSession(data.has_session === 1);
        return data;
      } else {
        showToast('설정 저장 실패: ' + data.error, 'error');
        return null;
      }
    } catch (err: any) {
      showToast('설정 저장 중 오류: ' + err.message, 'error');
      return null;
    }
  };

  // RPA 관련 제어 함수 추가
  const handleTriggerRpaLogin = async () => {
    setIsRpaLaunching(true);
    showToast('로컬 PC에 네이버 로그인 인증 브라우저를 기동합니다. 최초 1회 로그인을 마쳐주세요...', 'info');
    try {
      const res = await fetch('/api/naver-blog/settings?action=trigger_session');
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast('RPA 브라우저 기동 실패: ' + data.error, 'error');
      }
    } catch (err: any) {
      showToast('RPA 브라우저 구동 중 오류: ' + err.message, 'error');
    } finally {
      setIsRpaLaunching(false);
    }
  };

  const handleSyncRpaSession = async () => {
    showToast('RPA 자동화 로그인 세션 유효성을 체크하는 중입니다...', 'info');
    try {
      const res = await fetch('/api/naver-blog/settings');
      const data = await res.json();
      if (data.success) {
        setHasSession(data.has_session === 1);
        if (data.has_session === 1) {
          setIsAccountConnected(true);
          showToast('RPA 인증 세션(naver_session.json)이 성공적으로 동기화되어 연결되었습니다! 🟢', 'success');
        } else {
          showToast('아직 생성된 로그인 세션(쿠키)이 감지되지 않았습니다. 최초 로그인을 완료한 후 동기화해주세요. 🔴', 'error');
        }
      }
    } catch (err: any) {
      showToast('세션 동기화 중 오류: ' + err.message, 'error');
    }
  };

  const handleClearRpaSession = async () => {
    if (!confirm('RPA 자동화 세션을 정말로 파기하시겠습니까? 파기 후에는 포스팅 자동 발행이 불가합니다.')) return;
    try {
      const res = await fetch('/api/naver-blog/settings?action=clear_session');
      const data = await res.json();
      if (data.success) {
        setHasSession(false);
        setIsAccountConnected(false);
        showToast('RPA 인증 세션(쿠키)이 안전하게 폐기되었습니다. 🔴', 'info');
      }
    } catch (err: any) {
      showToast('세션 파기 중 오류: ' + err.message, 'error');
    }
  };

  // 클립보드 복사 헬퍼 함수
  const handleCopyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedText(text);
          showToast(`'${label}' 명령어가 클립보드에 성공적으로 복사되었습니다! 📋`, 'success');
          setTimeout(() => setCopiedText(null), 2000);
        })
        .catch((err) => {
          showToast('복사 실패: ' + err.message, 'error');
        });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopiedText(text);
        showToast(`'${label}' 명령어가 클립보드에 성공적으로 복사되었습니다! 📋`, 'success');
        setTimeout(() => setCopiedText(null), 2000);
      } catch (err: any) {
        showToast('복사 실패: ' + err.message, 'error');
      }
      document.body.removeChild(textarea);
    }
  };

  // 계정 연동 제출 (API 전용 또는 블로그 ID 저장)
  const handleConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naverBlogIdInput) {
      showToast('네이버 블로그 ID를 입력해주세요.', 'error');
      return;
    }
    
    if (activeModeTab === 'api') {
      if (!apiClientIdInput || !apiClientSecretInput) {
        showToast('공식 API 연동을 위해 Client ID와 Secret을 모두 입력해 주세요.', 'error');
        return;
      }
      const data = await saveSettings({
        naver_blog_id: naverBlogIdInput,
        api_client_id: apiClientIdInput,
        api_client_secret: apiClientSecretInput
      });
      if (data && data.success) {
        setIsAccountConnected(true);
        showToast(`N블로그 @${naverBlogIdInput} 공식 API 연동이 안전하게 완료되었습니다! 🟢`, 'success');
      }
    } else {
      // RPA 모드인 경우 ID 정보만 저장하고 세션 유효성을 함께 검사
      const data = await saveSettings({
        naver_blog_id: naverBlogIdInput,
        api_client_id: '',
        api_client_secret: ''
      });
      if (data && data.success) {
        setIsAccountConnected(data.has_session === 1);
        showToast(`RPA 블로그 아이디(@${naverBlogIdInput}) 설정이 저장되었습니다.`, 'success');
      }
    }
  };

  const handleDisconnectAccount = async () => {
    if (activeModeTab === 'rpa') {
      await handleClearRpaSession();
      await saveSettings({
        naver_blog_id: '',
        api_client_id: '',
        api_client_secret: ''
      });
      setNaverBlogIdInput('');
    } else {
      await saveSettings({
        naver_blog_id: '',
        api_client_id: '',
        api_client_secret: ''
      });
      setIsAccountConnected(false);
      setNaverBlogIdInput('');
      setApiClientIdInput('');
      setApiClientSecretInput('');
      showToast('공식 API 연동 계정이 정상적으로 해제되었습니다.', 'info');
    }
  };

  // AI 블로그 장문 원고 빌더 API 구동
  const handleGenerateAI = async () => {
    setSelectedPostForPreview(null); // 신규 포스팅 작성 모드로 강제 리셋
    setIsGenerating(true);
    showToast('AI가 고품질 블로그 장문 원고를 집필 중입니다. 잠시만 기다려주세요...', 'info');
    try {
      const res = await fetch('/api/naver-blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct?.id || null,
          prompt: aiPrompt,
          tone_style: aiTone,
          target_keywords: targetKeywords,
          generate_image: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setPostTitle(data.title);
        setPostContent(data.content);
        setGeneratedImageUrl(data.image_url);
        setGeneratedSubImageUrl(data.sub_image_url);
        showToast('네이버 블로그 맞춤 SEO 제목과 800자 이상 본문 원고가 완성되었습니다! ✨', 'success');
        
        // AI 탭으로 전환
        setImageTab('ai');
      } else {
        showToast('AI 생성 실패: ' + data.error, 'error');
      }
    } catch (err: any) {
      showToast('AI 생성 중 오류: ' + err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 오토파일럿 데몬 즉시 실행 트리거
  const handleTriggerAutopilot = async () => {
    showToast('네이버 블로그 오토파일럿 AI 마케터를 즉시 기동합니다...', 'info');
    try {
      const res = await fetch('/api/naver-blog/scheduler');
      const data = await res.json();
      if (data.success) {
        if (data.triggered) {
          showToast(data.message, 'success');
          fetchPosts(); // 예약 목록 갱신
        } else {
          showToast(data.message, 'info');
        }
      } else {
        showToast('오토파일럿 구동 실패: ' + data.error, 'error');
      }
    } catch (err: any) {
      showToast('오토파일럿 구동 중 오류: ' + err.message, 'error');
    }
  };

  // 포스팅 등록 (예약 또는 즉시 발행)
  const handleSavePost = async (isImmediate = false) => {
    let finalImageUrl = '';
    let finalSubImageUrl = '';

    if (imageTab === 'product') {
      if (!selectedProduct?.main_image_url) {
        showToast('선택된 상품에 메인 이미지가 없습니다.', 'error');
        return;
      }
      finalImageUrl = selectedProduct.main_image_url;
      finalSubImageUrl = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80';
    } else {
      if (!generatedImageUrl) {
        showToast('생성된 AI 본문 이미지가 없습니다.', 'error');
        return;
      }
      finalImageUrl = generatedImageUrl;
      finalSubImageUrl = generatedSubImageUrl;
    }

    if (!postTitle || !postContent) {
      showToast('블로그 제목과 본문 내용을 먼저 완성해주세요.', 'error');
      return;
    }

    const targetStatus = isImmediate ? 'POSTED' : 'SCHEDULED';
    const targetScheduledAt = isImmediate 
      ? new Date().toISOString() 
      : new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();

    try {
      const res = await fetch('/api/naver-blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct?.id || null,
          status: targetStatus,
          title: postTitle,
          content: postContent,
          target_keywords: targetKeywords,
          image_url: finalImageUrl,
          sub_image_url: finalSubImageUrl,
          scheduled_at: targetScheduledAt
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          isImmediate 
            ? '포스팅이 네이버 블로그에 가상 발행되었습니다! 🎉' 
            : '포스팅이 스케줄 타임라인에 안전하게 예약 등록되었습니다.', 
          'success'
        );
        
        // 폼 리셋
        setPostTitle('');
        setPostContent('');
        setTargetKeywords('');
        setAiPrompt('');
        
        // 이력 다시 불러오기
        fetchPosts();
      } else {
        showToast('등록 실패: ' + data.error, 'error');
      }
    } catch (err: any) {
      showToast('등록 중 오류: ' + err.message, 'error');
    }
  };

  // 예약글 승인(즉시 발행)
  const handleApproveImmediate = async (postId: number) => {
    try {
      const res = await fetch('/api/naver-blog/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          updates: { status: 'POSTED' }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('블로그 예약 초안이 즉시 발행 승인되었습니다! 🎉', 'success');
        fetchPosts();
      } else {
        showToast('발행 승인 실패: ' + data.error, 'error');
      }
    } catch (err: any) {
      showToast('승인 오류: ' + err.message, 'error');
    }
  };

  // 포스트 삭제
  const handleDeletePost = async (postId: number) => {
    if (!confirm('해당 블로그 포스트를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/naver-blog/posts?id=${postId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('포스팅이 이력에서 정상적으로 삭제되었습니다.', 'info');
        if (selectedPostForPreview?.id === postId) {
          setSelectedPostForPreview(null);
        }
        fetchPosts();
      } else {
        showToast('삭제 실패: ' + data.error, 'error');
      }
    } catch (err: any) {
      showToast('삭제 오류: ' + err.message, 'error');
    }
  };

  // 필터링된 상품 리스트
  const filteredProducts = products.filter(prod => 
    prod.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    (prod.brand && prod.brand.toLowerCase().includes(productSearchQuery.toLowerCase()))
  );

  // 경쟁 강도 배지 시각화 도우미
  const getCompetitionBadge = (comp: 'LOW' | 'MEDIUM' | 'HIGH') => {
    if (comp === 'LOW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 group relative cursor-pointer">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          🟢 초강추 (경쟁률 낮음)
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-gray-300 leading-relaxed font-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
            대형 블로그 침투율이 낮아 초보 블로거도 1페이지 첫 화면 노출 확률 92% 이상 보장되는 극강 꿀 키워드!
          </span>
        </span>
      );
    } else if (comp === 'MEDIUM') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 group relative cursor-pointer">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          🟡 경쟁 보통
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-gray-300 leading-relaxed font-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
            어느 정도 검색량을 유지하면서 중소형 에디터들이 고르게 경쟁해 노출을 노릴 수 있는 실속 키워드!
          </span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20 group relative cursor-pointer">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          🔴 경쟁 치열
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-gray-300 leading-relaxed font-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
            일 방문자 수만 명 이상의 메가 인플루언서들이 장악하여 초기에 상위 노출은 난도가 매우 높은 키워드!
          </span>
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 w-full min-w-0 font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* 백그라운드 네온 초록색/에메랄드/스카이블루 3중 오로라 그라데이션 광채 효과 */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-200/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-teal-200/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-[35%] left-[25%] w-[45%] h-[45%] rounded-full bg-sky-200/10 blur-[150px] pointer-events-none" />

      {/* 4. 마그네틱 원클릭 주입용 비행 플라잉 키워드 노출 */}
      <AnimatePresence>
        {flyingKeyword && (
          <motion.div
            initial={{ 
              position: 'fixed', 
              left: flyingKeyword.x, 
              top: flyingKeyword.y, 
              scale: 1, 
              opacity: 0.95,
              zIndex: 9999
            }}
            animate={{ 
              left: keywordInputRef.current ? keywordInputRef.current.getBoundingClientRect().left + 15 : 100, 
              top: keywordInputRef.current ? keywordInputRef.current.getBoundingClientRect().top + 15 : 200, 
              scale: 0.6, 
              opacity: 0.1,
              rotate: 360
             }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="px-3.5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-[0_10px_25px_rgba(16,185,129,0.3)] border border-emerald-300 pointer-events-none flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            {flyingKeyword.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 헤더 영역 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-6 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-4">
            {/* 럭셔리 네이버 그린 그라디언트 엠블럼 */}
            <div className="p-3 bg-gradient-to-tr from-[#03C75A] via-emerald-500 to-[#1fd66a] rounded-2xl shadow-[0_8px_30px_rgba(3,199,90,0.15)] animate-pulse shrink-0 self-start sm:self-auto">
              <NaverIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="bg-emerald-50 text-emerald-600 text-[10.5px] font-extrabold px-3 py-0.5 rounded-full border border-emerald-200/60 shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-500 animate-spin" style={{ animationDuration: "4s" }} /> NAVER BLOG AI ENGINE
                </span>
                <span className="text-slate-600 border border-slate-200/80 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100/80">v2.0 PRO</span>
                <span className="text-emerald-600 border border-emerald-200 bg-emerald-50/80 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Premium Autopilot</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-600 bg-clip-text text-transparent">
                N-BLOG 포스팅 AI
              </h1>
            </div>
          </div>
          <p className="text-slate-500 mt-3 text-sm md:text-base font-medium">
            AI 모델을 활용해 상품 분석 키워드 도출부터 장문 SEO 원고 집필, 100% 무인 자동 발행(RPA/API)까지 완벽하게 스튜디오에서 핸들링합니다.
          </p>
        </div>

        {/* 시스템 시간 표시 */}
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <span className="text-xs text-slate-600 font-semibold bg-white/80 backdrop-blur-xl border border-slate-200/50 px-3 py-2 rounded-xl shadow-xs">
            현재 시스템 시간: {systemTime || '12:00 PM'}
          </span>
        </div>
      </div>

      {/* 1. 상단 통계 영역 (실데이터 동적 연동 카드) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
        <motion.div 
          whileHover={{ y: -5 }}
          className="p-6 rounded-3xl border border-slate-200/50 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/20 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">계정 연동 상태</p>
              <h3 className={`text-2xl font-black mt-2 transition-colors ${isConnected ? 'text-emerald-650' : 'text-slate-450'}`}>
                {displayAccountStatus}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50/80 text-emerald-600 rounded-2xl border border-emerald-100 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-450 mt-4 truncate font-medium">{accountSubtext}</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="p-6 rounded-3xl border border-slate-200/50 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50/20 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">평균 블로그 조회수</p>
              <h3 className="text-2xl font-black mt-2 text-slate-800">
                {avgViews.toLocaleString()} <span className="text-xs text-slate-400 font-semibold ml-0.5">회/글</span>
              </h3>
            </div>
            <div className="p-3 bg-teal-50/80 text-teal-600 rounded-2xl border border-teal-100 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-450 mt-4 font-medium">{viewsSubtext}</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="p-6 rounded-3xl border border-slate-200/50 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50/20 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">누적 발행 완료</p>
              <h3 className="text-2xl font-black mt-2 text-slate-800">
                {uploadedCount}개 <span className="text-xs text-slate-400 font-bold ml-1.5">총 {totalCount}개</span>
              </h3>
            </div>
            <div className="p-3 bg-sky-50/80 text-sky-600 rounded-2xl border border-sky-100 shadow-xs">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-450 mt-4 font-medium">{uploadSubtext}</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="p-6 rounded-3xl border border-slate-200/50 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/20 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">자동 발행 정합성</p>
              <h3 className="text-2xl font-black mt-2 text-slate-800">
                {successRate}%
              </h3>
            </div>
            <div className="p-3 bg-amber-50/80 text-amber-600 rounded-2xl border border-amber-100 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-450 mt-4 font-medium">{successSubtext}</p>
        </motion.div>
      </div>

      {/* 메인 레이아웃: 대시보드 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 items-start">
        
        {/* 왼쪽 & 중간 영역: 연동 설정 & AI 포스팅 빌더 */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 가상 컨텐츠 연동 알림창 */}
          {!isConnected && (
            <div className="p-5 rounded-2xl bg-amber-50/80 backdrop-blur-md border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">
                    {activeModeTab === 'api' 
                      ? '네이버 블로그 공식 API 미설정' 
                      : '네이버 RPA 자동 발행 세션(쿠키) 인증 필요'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {activeModeTab === 'api' 
                      ? '현재 네이버 공식 API Client ID와 Secret이 등록되지 않아 가상 모드로 작동 중입니다. 실제 발행을 위해 아래 설정 카드에서 API 키를 등록해주세요.' 
                      : 'RPA 자동 발행용 로그인 쿠키 세션이 존재하지 않습니다. 아래 계정 관리자에서 [최초 1회 로그인 브라우저 기동]을 실행하여 인증을 완료해주세요.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activeModeTab === 'rpa' && (
                  <button 
                    onClick={handleTriggerRpaLogin}
                    disabled={isRpaLaunching}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
                  >
                    {isRpaLaunching ? '인증 브라우저 기동 중...' : 'RPA 로그인 기동 🚀'}
                  </button>
                )}
                <button 
                  onClick={() => {
                    const el = document.getElementById('account-connection-card');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  계정 설정으로 이동
                </button>
              </div>
            </div>
          )}

          {/* N-BLOG AI Keyword Lab 4대 독점 기술 쇼케이스 배너 */}
          <div className="p-6 lg:p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-200/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-50/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
              <div>
                <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  N-BLOG AI Keyword Lab 4대 독점 특장점
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. 상품 자동 속성 매핑 추천 */}
              <div 
                onClick={() => {
                  const el = document.getElementById('ai-keyword-lab-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                  showToast("1. 상품 자동 속성 매핑 추천 영역으로 이동했습니다! 📊", "info");
                }}
                className="p-5 rounded-2xl bg-white/95 border border-slate-200/60 hover:border-emerald-500/50 transition-all hover:bg-emerald-50/10 cursor-pointer group flex flex-col justify-between h-full relative hover:shadow-md hover:-translate-y-0.5 duration-300"
              >
                <div className="space-y-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                    📊
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 flex flex-col gap-0.5">
                      <span>1. 자동 속성 매핑</span>
                      <span className="text-[9px] w-fit px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">Spec-to-Keyword</span>
                    </h4>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">
                      상품 클릭 즉시 브랜드, 스펙 명세, 가격대 속성을 스스로 분석해 대표 연관 키워드를 자동 도출합니다.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 mt-4 flex items-center justify-between font-semibold">
                  <span>LG 에어컨 ➔ #여름가전</span>
                  <span className="text-emerald-600 group-hover:translate-x-1 transition-transform">이동 ➔</span>
                </div>
              </div>

              {/* 2. 신호등 경쟁 강도 시뮬레이션 */}
              <div 
                onClick={() => {
                  const el = document.getElementById('ai-keyword-lab-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                  showToast("2. 경쟁 강도 시뮬레이션 영역으로 이동했습니다! 🚦", "info");
                }}
                className="p-5 rounded-2xl bg-white/95 border border-slate-200/60 hover:border-emerald-500/50 transition-all hover:bg-emerald-50/10 cursor-pointer group flex flex-col justify-between h-full hover:shadow-md hover:-translate-y-0.5 duration-300"
              >
                <div className="space-y-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                    🚦
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 flex flex-col gap-0.5">
                      <span>2. 경쟁 강도 매칭</span>
                      <span className="text-[9px] w-fit px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold">Traffic Lights</span>
                    </h4>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">
                      추천 키워드마다 🔴치열, 🟡보통, 🟢초강추 신호등 배지를 부여하여 노출 유력 키워드를 직관적으로 선별합니다.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 mt-4 flex items-center justify-between font-semibold">
                  <span>초록색 배지(🟢) 공략!</span>
                  <span className="text-amber-600 group-hover:translate-x-1 transition-transform">이동 ➔</span>
                </div>
              </div>

              {/* 3. 핵심 구매 페르소나별 분할 제안 */}
              <div 
                onClick={() => {
                  const el = document.getElementById('ai-keyword-lab-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                  showToast("3. 핵심 구매 페르소나별 키워드 분할 제안 영역으로 이동했습니다! 👥", "info");
                }}
                className="p-5 rounded-2xl bg-white/95 border border-slate-200/60 hover:border-emerald-500/50 transition-all hover:bg-emerald-50/10 cursor-pointer group flex flex-col justify-between h-full hover:shadow-md hover:-translate-y-0.5 duration-300"
              >
                <div className="space-y-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                    👥
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 flex flex-col gap-0.5">
                      <span>3. 페르소나 분할 제안</span>
                      <span className="text-[9px] w-fit px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-semibold">Persona-Splitting</span>
                    </h4>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">
                      독자층을 🤱가정, 🧑‍💻1인, 🧹반려동물 등 라이프스타일별로 세분화하여 맞춤형 세부 공감 키워드를 제공합니다.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 mt-4 flex items-center justify-between font-semibold">
                  <span>맞춤형 세부 필터링 제공</span>
                  <span className="text-purple-600 group-hover:translate-x-1 transition-transform">이동 ➔</span>
                </div>
              </div>

              {/* 4. 마그네틱 원클릭 주입 시스템 */}
              <div 
                onClick={() => {
                  const el = document.getElementById('ai-keyword-lab-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                  showToast("4. 마그네틱 원클릭 주입 시스템 영역으로 이동했습니다! ⚡", "info");
                }}
                className="p-5 rounded-2xl bg-white/95 border border-slate-200/60 hover:border-emerald-500/50 transition-all hover:bg-emerald-50/10 cursor-pointer group flex flex-col justify-between h-full hover:shadow-md hover:-translate-y-0.5 duration-300"
              >
                <div className="space-y-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 flex flex-col gap-0.5">
                      <span>4. 마그네틱 원클릭 주입</span>
                      <span className="text-[9px] w-fit px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 font-semibold">One-Click Inject</span>
                    </h4>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">
                      AI 키워드 카드를 클릭만 하면 좌측 타겟 키워드 인풋으로 자석처럼 쏙 날아가는 마이크로 모션을 제공합니다.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 mt-4 flex items-center justify-between font-semibold">
                  <span>원클릭 콤마 자동 구분</span>
                  <span className="text-sky-600 group-hover:translate-x-1 transition-transform">이동 ➔</span>
                </div>
              </div>

            </div>
          </div>

          {/* 계정 연동 세팅 관리 카드 (RPA & API 하이브리드형) */}
          <div id="account-connection-card" className="p-6 lg:p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-[#03C75A]" />
                <h4 className="text-base font-bold text-slate-800">네이버 블로그 계정 관리자</h4>
              </div>
              {/* 현재 가동 모드 표시 배지 */}
              <span className={`text-[10px] px-3 py-1 rounded-full font-extrabold tracking-wider ${
                activeModeTab === 'api' 
                  ? 'bg-sky-50 text-sky-600 border border-sky-200' 
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
                {activeModeTab === 'api' ? '공식 API 모드' : 'RPA 간편 모드'}
              </span>
            </div>

            {/* 하이브리드 연동 방식 선택 탭 */}
            <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveModeTab('rpa');
                  setIsAccountConnected(hasSession && !!settings.naver_blog_id);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeModeTab === 'rpa'
                    ? 'bg-white text-emerald-600 border border-slate-200 shadow-sm scale-102 font-extrabold'
                    : 'text-slate-400 hover:text-slate-700 border border-transparent'
                }`}
              >
                <Globe className="w-4 h-4" />
                RPA 간편 로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModeTab('api');
                  setIsAccountConnected(!!settings.api_client_id && !!settings.naver_blog_id);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeModeTab === 'api'
                    ? 'bg-white text-sky-600 border border-slate-200 shadow-sm scale-102 font-extrabold'
                    : 'text-slate-400 hover:text-slate-700 border border-transparent'
                }`}
              >
                <Sliders className="w-4 h-4" />
                공식 API 연동
              </button>
            </div>

            {/* [1] RPA 간편 로그인 모드 전용 뷰 */}
            {activeModeTab === 'rpa' && (
              <div className="space-y-5">
                {/* RPA 세션 상태 표시 패널 */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  hasSession && settings.naver_blog_id
                    ? 'bg-emerald-50/40 border-emerald-250'
                    : 'bg-rose-50/40 border-rose-250'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${
                      hasSession && settings.naver_blog_id ? 'bg-[#03C75A] text-white' : 'bg-rose-500 text-white'
                    }`}>
                      N
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                        <span>
                          {hasSession && settings.naver_blog_id 
                            ? `RPA 연동 완료: @${settings.naver_blog_id}` 
                            : 'RPA 연동이 필요합니다'}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          hasSession && settings.naver_blog_id ? 'bg-emerald-550 animate-pulse' : 'bg-rose-500'
                        }`}></span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        {hasSession && settings.naver_blog_id
                          ? '🟢 무인 자동화 쿠키 인증이 확보되어 정상 동작 중입니다.'
                          : '🔴 로컬 로그인 세션(naver_session.json)이 존재하지 않습니다. 최초 1회 로그인이 진행되어야 합니다.'}
                      </p>
                    </div>
                  </div>

                  {/* RPA 세션이 존재할 때 해제(파기) 버튼 */}
                  {hasSession && settings.naver_blog_id && (
                    <div className="flex justify-end gap-2 border-t border-slate-200/50 pt-3 mt-4">
                      <button
                        type="button"
                        onClick={handleDisconnectAccount}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all font-bold cursor-pointer shadow-2xs active:scale-95"
                      >
                        RPA 인증 세션 파기 ⚠️
                      </button>
                    </div>
                  )}
                </div>

                {/* RPA 로그인 트리거 및 동기화 버튼 블록 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleTriggerRpaLogin}
                    disabled={isRpaLaunching}
                    className="py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all text-xs font-bold active:scale-98 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.2)] cursor-pointer"
                  >
                    <Globe className="w-4 h-4 animate-spin-slow" />
                    {isRpaLaunching ? 'RPA 브라우저 팝업 기동 중...' : 'RPA 최초 로그인 브라우저 기동 🚀'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSyncRpaSession}
                    className="py-3 rounded-2xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-250 transition-all text-xs font-bold active:scale-98 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-550" />
                    세션 동기화 실시간 갱신 🔄
                  </button>
                </div>

                {/* 블로그 아이디 설정 폼 */}
                <form onSubmit={handleConnectAccount} className="space-y-2.5 border-t border-slate-100 pt-4 mt-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">연동할 네이버 블로그 ID</label>
                    <div className="flex gap-2.5 mt-1.5">
                      <input
                        type="text"
                        placeholder="예: naver_username"
                        value={naverBlogIdInput}
                        onChange={(e) => setNaverBlogIdInput(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-white/50 backdrop-blur-xs border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all text-xs font-bold shrink-0 cursor-pointer active:scale-95 shadow-xs"
                      >
                        저장 💾
                      </button>
                    </div>
                  </div>
                </form>

                {/* RPA 최초 설치 및 문제해결 가이드 모달 트리거 */}
                <div className="border-t border-slate-100 pt-4 mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setIsGuideModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-all group focus:outline-none cursor-pointer"
                  >
                    <span>RPA 최초 설치/기동이 안 되시나요? 💡</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* [2] 공식 API 연동 모드 전용 뷰 */}
            {activeModeTab === 'api' && (
              <div className="space-y-5">
                {/* API 연동 상태 표시 패널 */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  isAccountConnected && settings.api_client_id
                    ? 'bg-sky-50/40 border-sky-250'
                    : 'bg-rose-50/40 border-rose-250'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${
                      isAccountConnected && settings.api_client_id ? 'bg-sky-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      API
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                        <span>
                          {isAccountConnected && settings.api_client_id 
                            ? `API 연동 완료: @${settings.naver_blog_id}` 
                            : 'API 인증 정보 필요'}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isAccountConnected && settings.api_client_id ? 'bg-sky-400 animate-pulse' : 'bg-rose-500'
                        }`}></span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        {isAccountConnected && settings.api_client_id
                          ? '🟢 공식 API 키 인증이 활성화되어 안전하게 연결되었습니다.'
                          : '🔴 네이버 개발자 센터에서 발급한 API 키 정보를 아래 입력란에 입력해 주세요.'}
                      </p>
                    </div>
                  </div>

                  {/* API 연동 해제 버튼 */}
                  {isAccountConnected && settings.api_client_id && (
                    <div className="flex justify-end gap-2 border-t border-slate-200/50 pt-3 mt-4">
                      <button
                        type="button"
                        onClick={handleDisconnectAccount}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] text-rose-600 hover:bg-rose-50 transition-all font-bold cursor-pointer shadow-2xs active:scale-95"
                      >
                        API 연동 해제
                      </button>
                    </div>
                  )}
                </div>

                {/* API 연동 폼 */}
                <form onSubmit={handleConnectAccount} className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">네이버 블로그 ID</label>
                    <input
                      type="text"
                      placeholder="예: naver_username"
                      value={naverBlogIdInput}
                      onChange={(e) => setNaverBlogIdInput(e.target.value)}
                      className="w-full mt-1.5 px-4 py-2.5 bg-white/50 backdrop-blur-xs border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Client ID</label>
                    <input
                      type="password"
                      placeholder="네이버 개발자 센터 Client ID"
                      value={apiClientIdInput}
                      onChange={(e) => setApiClientIdInput(e.target.value)}
                      className="w-full mt-1.5 px-4 py-2.5 bg-white/50 backdrop-blur-xs border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Client Secret</label>
                    <input
                      type="password"
                      placeholder="네이버 개발자 센터 Client Secret"
                      value={apiClientSecretInput}
                      onChange={(e) => setApiClientSecretInput(e.target.value)}
                      className="w-full mt-1.5 px-4 py-2.5 bg-white/50 backdrop-blur-xs border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-slate-900 text-white hover:bg-sky-550 transition-all text-xs font-bold active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                  >
                    <Sliders className="w-4 h-4" />
                    API 안전 정보 저장 및 연동 💾
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* 100% 무인 오토파일럿 스위치 카드 */}
          <div className="p-6 lg:p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Globe className="w-4.5 h-4.5" />
                  </span>
                  <h3 className="text-base font-bold text-slate-800">
                    100% 무인 AI 오토파일럿 마케팅
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  활성화 시 매일 예약된 시간에 AI가 등록된 상품을 분석해 자동으로 블로그 포스트를 생성 및 발행 대기합니다.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button 
                  onClick={handleTriggerAutopilot}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-emerald-550 text-white hover:bg-emerald-600 hover:shadow-md transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  오토파일럿 AI 즉시 구동
                </button>
                <div className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs text-slate-550 font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#03C75A] animate-pulse"></span>
                  <span>데몬 대기 중</span>
                  <button 
                    onClick={() => setIsDaemonInfoOpen(true)}
                    className="p-0.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-0.5 cursor-pointer"
                    title="로컬 PC 데몬 확인 방법 가이드"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => saveSettings({ is_autopilot: settings.is_autopilot === 1 ? 0 : 1 })}
                  className="transition-transform active:scale-95 shrink-0 cursor-pointer focus:outline-none"
                >
                  {settings.is_autopilot === 1 ? (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-600 font-extrabold text-xs cursor-pointer shadow-2xs">
                      <ToggleRight className="w-5 h-5 text-emerald-550" /> ON (자동화 작동)
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-100 border border-slate-250 text-slate-400 font-bold text-xs cursor-pointer shadow-2xs">
                      <ToggleLeft className="w-5 h-5" /> OFF (수동 검토)
                    </div>
                  )}
                </button>
              </div>
            </div>

            {settings.is_autopilot === 1 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 pt-5 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-5"
              >
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">발행 주기</label>
                  <select
                    value={settings.autopilot_interval}
                    onChange={(e) => saveSettings({ autopilot_interval: e.target.value })}
                    className="w-full mt-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold cursor-pointer shadow-2xs"
                  >
                    <option value="DAILY">매일 (Daily)</option>
                    <option value="WEEKLY">매주 (Weekly)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">발행 시각</label>
                  <input 
                    type="time" 
                    value={settings.autopilot_time}
                    onChange={(e) => saveSettings({ autopilot_time: e.target.value })}
                    className="w-full mt-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">원고 집필 톤앤매너</label>
                  <select
                    value={settings.tone_style}
                    onChange={(e) => saveSettings({ tone_style: e.target.value })}
                    className="w-full mt-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold cursor-pointer shadow-2xs"
                  >
                    <option value="정보제공형">🎓 정보제공형 스펙리뷰</option>
                    <option value="솔직리뷰형">💬 리얼 솔직리뷰형</option>
                    <option value="전문칼럼형">📊 전문칼럼 분석형</option>
                    <option value="親近일상형">🏠 친근한 일상공유형</option>
                  </select>
                </div>
              </motion.div>
            )}
          </div>

          {/* 1단계: 상품선택 카드 */}
          <div className="p-6 lg:p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ShoppingBag className="w-4.5 h-4.5" />
                </span>
                <h3 className="text-base font-bold text-slate-800">
                  1단계: 마케팅 대상 상품 선택
                </h3>
              </div>
              <div className="text-xs text-slate-500 font-bold">
                선택 시 AI 자동 매핑 키워드가 즉시 갱신됩니다
              </div>
            </div>

            {/* 검색어 입력창 */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="등록 상품명, 브랜드, 가격대 검색..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-xs border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold shadow-2xs"
              />
            </div>

            {/* 상품 콤팩트 가로/세로 리스트 */}
            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
              {filteredProducts.map((prod) => {
                const isSelected = selectedProduct?.id === prod.id;
                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setSelectedProduct(prod);
                      setSelectedPostForPreview(null);
                    }}
                    className={`p-3.5 rounded-2xl flex items-center justify-between border cursor-pointer transition-all duration-350 ${
                      isSelected 
                        ? 'bg-emerald-50/40 border-emerald-500/50 shadow-sm scale-100.5' 
                        : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={prod.main_image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'} 
                        alt={prod.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-slate-100 border border-slate-200 text-slate-500">
                            {prod.brand || '브랜드 분석 중'}
                          </span>
                          <span className="text-xs font-black text-slate-800 line-clamp-1">{prod.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-450 mt-1.5 flex items-center gap-2">
                          <span className="font-extrabold text-emerald-600">
                            {Number(prod.price).toLocaleString()}원
                          </span>
                          <span className="text-slate-200">|</span>
                          <span className="line-clamp-1 max-w-[200px] text-slate-500 font-semibold">{prod.specs || '스펙 정보 분석 중'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-[#03C75A] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(3,199,90,0.3)] shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-slate-250 bg-slate-50 shrink-0"></div>
                    )}
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 font-bold bg-white rounded-2xl border border-slate-100">
                  검색 결과에 부합하는 연동 상품이 없습니다. 🛍️
                </div>
              )}
            </div>
          </div>

          {/* AI Keyword Lab 독점 기능 1, 2, 3, 4 실시간 통합 데쉬보드 */}
          <div id="ai-keyword-lab-section" className="p-6 lg:p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-4 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">
                  <Sparkles className="w-4.5 h-4.5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    N-BLOG AI Keyword Lab
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-0.5 font-bold">상위 노출 확정 및 라이프스타일 페르소나 매핑 키워드</p>
                </div>
              </div>
              
              {selectedProduct && (
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-xl shadow-3xs align-self-start sm:align-self-auto">
                  {isGeneratingKeywords ? "⚡ AI 분석 진행 중..." : `⚡ '${selectedProduct.name.substring(0, 10)}...' 기반 AI 로드 완료`}
                </span>
              )}
            </div>

            {/* 📊 1. 상품 자동 속성 매핑 추천 (Spec-to-Keyword) */}
            {isGeneratingKeywords ? (
              <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-slate-150 shadow-xs space-y-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-500">AI가 상품의 속성을 정밀 분석 중입니다...</p>
              </div>
            ) : selectedProduct ? (
              <div className="space-y-3.5 bg-slate-50/50 p-5 rounded-2xl border border-slate-150 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-505 text-white font-extrabold shadow-sm bg-emerald-500">
                    속성 자동 매핑 분석
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">AI가 상품의 사양과 브랜드를 분석해 대표 키워드를 추출했습니다.</span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {generatedKeywords.specKeywords && generatedKeywords.specKeywords.length > 0 ? (
                    generatedKeywords.specKeywords.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => handleKeywordInject(item.keyword, e)}
                        className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500/50 hover:bg-emerald-50/20 hover:shadow-sm transition-all text-left active:scale-95 cursor-pointer shadow-3xs"
                      >
                        <div>
                          <div className="text-[11px] font-black text-slate-800 group-hover:text-emerald-700 transition-colors">#{item.keyword}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5 font-bold">조회수: {item.volume}</div>
                        </div>
                        {getCompetitionBadge(item.competition)}
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-slate-450 font-bold py-2">생성된 메인 속성 키워드가 없습니다.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 font-bold bg-slate-50/50 border border-slate-100 rounded-2xl shadow-3xs">
                상품을 선택하면 실시간 속성 매핑 키워드가 가동됩니다. 🚦
              </div>
            )}

            {/* 👥 3. 핵심 구매 페르소나별 분할 제안 & ⚡ 4. 마그네틱 원클릭 주입 */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">
                  타겟 구매 페르소나별 공감 키워드 카드 세트
                </label>
                <span className="text-[10px] text-emerald-650 font-extrabold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg animate-pulse">
                  💡 카드를 클릭 시 타겟 키워드 필드에 자석처럼 날아가 주입됩니다!
                </span>
              </div>

              {/* 페르소나 탭 메뉴 (인스타 스토리 하이라이트 스타일 원형) */}
              <div className="flex justify-around p-3.5 rounded-3xl bg-slate-100 border border-slate-200/50 shadow-inner gap-2 overflow-x-auto">
                <button
                  onClick={() => setActivePersona('family')}
                  className={`py-2 px-4 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activePersona === 'family' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md scale-105 ring-2 ring-emerald-400 ring-offset-2' 
                      : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 shadow-3xs'
                  }`}
                >
                  <span className="text-sm">🤱</span>
                  <span>육아/가정</span>
                </button>
                <button
                  onClick={() => setActivePersona('single')}
                  className={`py-2 px-4 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activePersona === 'single' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md scale-105 ring-2 ring-emerald-400 ring-offset-2' 
                      : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 shadow-3xs'
                  }`}
                >
                  <span className="text-sm">🧑‍💻</span>
                  <span>자취/1인</span>
                </button>
                <button
                  onClick={() => setActivePersona('pet')}
                  className={`py-2 px-4 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activePersona === 'pet' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md scale-105 ring-2 ring-emerald-400 ring-offset-2' 
                      : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 shadow-3xs'
                  }`}
                >
                  <span className="text-sm">🧹</span>
                  <span>반려동물</span>
                </button>
                <button
                  onClick={() => setActivePersona('office')}
                  className={`py-2 px-4 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activePersona === 'office' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md scale-105 ring-2 ring-emerald-400 ring-offset-2' 
                      : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 shadow-3xs'
                  }`}
                >
                  <span className="text-sm">🏢</span>
                  <span>오피스</span>
                </button>
              </div>

              {/* 페르소나별 키워드 리스트 드로잉 */}
              <div className="p-5 bg-slate-50/50 border border-slate-150 rounded-2xl min-h-36 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    if (isGeneratingKeywords) {
                      return (
                        <div className="col-span-2 flex flex-col items-center justify-center py-8 space-y-3">
                          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-xs font-bold text-slate-500">AI가 타겟 구매 페르소나별 최적 키워드를 정밀하게 도출하는 중입니다...</p>
                        </div>
                      );
                    }

                    let targetList = generatedKeywords.familyKeywords || [];
                    if (activePersona === 'single') targetList = generatedKeywords.singleKeywords || [];
                    if (activePersona === 'pet') targetList = generatedKeywords.petKeywords || [];
                    if (activePersona === 'office') targetList = generatedKeywords.officeKeywords || [];

                    if (!selectedProduct) {
                      return (
                        <div className="col-span-2 text-center py-8 text-xs text-slate-400 font-bold">
                          상품을 먼저 1단계에서 선택하셔야 페르소나별 정밀 키워드가 추출됩니다. 👥
                        </div>
                      );
                    }

                    if (targetList.length === 0) {
                      return (
                        <div className="col-span-2 text-center py-8 text-xs text-slate-400 font-bold">
                          분석된 페르소나 키워드가 없습니다.
                        </div>
                      );
                    }

                    return targetList.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => handleKeywordInject(item.keyword, e)}
                        className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500/50 hover:shadow-md hover:bg-emerald-50/10 transition-all text-left active:scale-[0.99] flex flex-col justify-between gap-3 cursor-pointer shadow-3xs group/card duration-300"
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="text-xs font-black text-slate-800 line-clamp-1 group-hover/card:text-emerald-700 transition-colors">#{item.keyword}</span>
                          <span className="shrink-0">{getCompetitionBadge(item.competition)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{item.reason}</p>
                        <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between w-full text-[9px] text-slate-400 font-bold">
                          <span>월 검색량: <strong className="text-slate-650 font-extrabold">{item.volume}</strong>건</span>
                          <span className="text-emerald-600 font-extrabold group-hover/card:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            ⚡ 주입하기 +
                          </span>
                        </div>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* 2단계: 네이버 블로그 포스팅 원고 빌더 */}
          <div className="p-6 lg:p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-sm space-y-6">
            
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <FileText className="w-4.5 h-4.5" />
              </span>
              <h3 className="text-base font-bold text-slate-800">
                2단계: 네이버 블로그 포스팅 원고 빌더
              </h3>
            </div>

            {/* AI 장문 생성기 세팅창 */}
            <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-200 space-y-4 shadow-3xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-[#03C75A] animate-pulse" />
                <span className="text-xs font-black text-slate-800">AI 장문 SEO 원고 자동 집필 엔진</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">집필 톤앤매너</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold cursor-pointer shadow-3xs"
                  >
                    <option value="정보제공형">🎓 정보제공형 스펙리뷰</option>
                    <option value="솔직리뷰형">💬 리얼 솔직리뷰형</option>
                    <option value="전문칼럼형">📊 전문칼럼 분석형</option>
                    <option value="친근한일상형">🏠 친근한 일상공유형</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">이미지 모드</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <button
                      type="button"
                      disabled={!selectedProduct}
                      onClick={() => setImageTab('product')}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer shadow-3xs active:scale-95 ${
                        !selectedProduct
                          ? 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed opacity-40'
                          : imageTab === 'product'
                          ? 'bg-emerald-500 border-emerald-500 text-white font-extrabold'
                          : 'bg-white border-slate-250 text-slate-550 hover:text-slate-700'
                      }`}
                    >
                      상품 대표이미지
                    </button>
                    <button
                      type="button"
                      disabled={!selectedProduct}
                      onClick={() => setImageTab('ai')}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer shadow-3xs active:scale-95 ${
                        !selectedProduct
                          ? 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed opacity-40'
                          : imageTab === 'ai'
                          ? 'bg-emerald-500 border-emerald-500 text-white font-extrabold'
                          : 'bg-white border-slate-250 text-slate-550 hover:text-slate-700'
                      }`}
                    >
                      AI 다중 감성샷
                    </button>
                  </div>
                  {!selectedProduct && (
                    <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-2.5 animate-pulse">
                      ⚠️ 상품을 먼저 선택하시면 이미지 모드가 활성화됩니다.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">AI 추가 요구 프롬프트 (선택)</label>
                <textarea
                  placeholder="예: '단점도 아주 살짝 솔직하게 녹여줘', '해당 제품 사용 후 삶의 질이 어떻게 변했는지를 중점적으로 강조해줘'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={2}
                  className="w-full mt-1.5 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-semibold resize-none shadow-3xs"
                />
              </div>

              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || !selectedProduct}
                className="w-full py-3.5 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:via-teal-650 hover:to-emerald-700 text-white shadow-[0_4px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                    AI가 네이버 SEO에 맞는 800자 이상 원고 집필 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                    네이버 블로그 맞춤형 AI 원고 즉시 빌드
                  </>
                )}
              </button>
            </div>

            {/* 에디터 필드 */}
            <div className="space-y-5">
              
              {/* ⚡ 마그네틱 원클릭 주입 수집 필드 */}
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  타겟 키워드 (쉼표 구분)
                </label>
                <input
                  ref={keywordInputRef}
                  type="text"
                  placeholder="우측 AI Keyword Lab의 뱃지를 클릭하면 이곳으로 자동 마그네틱 주입됩니다."
                  value={targetKeywords}
                  onChange={(e) => setTargetKeywords(e.target.value)}
                  className="w-full mt-1.5 px-4.5 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-emerald-650 placeholder:text-slate-450 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold shadow-3xs transition-all"
                />
                {targetKeywords && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {targetKeywords.split(',').map((k) => k.trim()).filter(Boolean).map((k, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-250 text-[#03C75A] text-[10px] font-black shadow-3xs">
                        #{k}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">포스팅 제목 (Title)</label>
                <input
                  type="text"
                  placeholder="블로그 포스팅 제목을 입력하거나 AI 생성을 실행하세요."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full mt-1.5 px-4.5 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-black shadow-3xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">포스팅 본문 원고 (Content)</label>
                <textarea
                  placeholder="네이버 블로그에 최적화된 고품질 장문 본문 원고를 작성하세요. 제목과 본문에 타겟 키워드들이 자연스럽게 녹아들어야 상위 노출에 유리합니다."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={12}
                  className="w-full mt-1.5 p-4.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-semibold leading-relaxed resize-y shadow-3xs"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-bold">
                  <span>공백 포함 총: <strong className="text-slate-700 font-black">{postContent.length}</strong>자</span>
                  <span className={postContent.length >= 800 ? "text-[#03C75A] font-black" : "text-amber-600 font-bold"}>
                    {postContent.length >= 800 ? "🟢 권장 SEO 분량 달성 (800자 이상)" : "⚠️ 장문 보강 권장 (800자 이하)"}
                  </span>
                </div>
              </div>

            </div>

            {/* 예약 시간 설정 및 등록 액션 */}
            <div className="pt-5 border-t border-slate-200/85">
              <div className="flex flex-col md:flex-row items-end gap-3.5 w-full pb-1">
                
                {/* 1. 예약 발행 일시 설정 */}
                <div className="flex flex-col gap-1.5 w-full md:w-[320px] shrink-0">
                  <label className="text-[10px] text-slate-450 font-extrabold block uppercase tracking-wider">예약 발행 일시</label>
                  <div className="flex items-center gap-2.5 w-full">
                    <input 
                      type="date" 
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="flex-1 min-w-0 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold shadow-3xs h-[45px]"
                    />
                    <input 
                      type="time" 
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-[120px] shrink-0 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold shadow-3xs h-[45px]"
                    />
                  </div>
                </div>

                {/* 2. 지정 시간 예약 등록 버튼 */}
                <div className="w-full md:flex-1">
                  <button
                    type="button"
                    onClick={() => handleSavePost(false)}
                    disabled={!postTitle || !postContent}
                    className={`w-full py-3 rounded-2xl text-xs font-black active:scale-95 transition-all duration-300 border flex items-center justify-center gap-2 h-[45px] cursor-pointer shadow-3xs ${
                      (!postTitle || !postContent)
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-250 shadow-xs'
                    }`}
                  >
                    <Calendar className="w-4 h-4 shrink-0 text-slate-500" />
                    <span className="truncate">지정 시간 예약 등록</span>
                  </button>
                </div>

                {/* 3. 네이버 블로그 즉시 발행 버튼 */}
                <div className="w-full md:flex-1">
                  <button
                    type="button"
                    onClick={() => handleSavePost(true)}
                    disabled={!postTitle || !postContent}
                    className={`w-full py-3 rounded-2xl text-xs font-black active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 h-[45px] cursor-pointer shadow-[0_4px_15px_rgba(3,199,90,0.2)] ${
                      (!postTitle || !postContent)
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
                    }`}
                  >
                    <Send className="w-4 h-4 shrink-0" />
                    <span className="truncate">네이버 블로그 즉시 발행</span>
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* 우측 네이버 모바일 블로그 뷰어 목업 영역 (1컬럼) */}
        <div className="lg:col-span-1 sticky top-8 space-y-6 pb-16 w-full flex justify-center">
          
          {/* 네이버 블로그 전용 초록 테마 스마트폰 프레임 (3D 섀도우) */}
          <div className="relative w-full max-w-[340px] aspect-[9/19] rounded-[48px] border-[12px] border-slate-900 bg-slate-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden ring-8 ring-slate-100/50 mb-12">
            
            {/* 스피커 & 카메라 노치 데코 */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-50 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
            </div>

            {/* 모바일 화면 내부 실질 컨텐츠 */}
            <div className="w-full h-full bg-[#F4F4F4] text-slate-800 flex flex-col overflow-y-auto select-none pt-8 relative custom-scrollbar">
              
              {/* 상단 네이버 블로그 로고 & 글로벌 헤더 스킨 */}
              <div className="bg-[#03C75A] text-white px-4 py-3 shrink-0 flex items-center justify-between sticky top-0 z-40 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <NaverIcon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold tracking-tight">블로그</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-white/90" />
                  <Sliders className="w-4 h-4 text-white/90" />
                </div>
              </div>

              {/* 포스트 커버 이미지 / 블로그 스킨 헤더 */}
              <div className="bg-white px-4 py-4.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-150 flex items-center justify-center text-[#03C75A] text-xs font-black shadow-3xs">
                    {naverBlogIdInput ? naverBlogIdInput.substring(0,2).toUpperCase() : 'N'}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      {naverBlogIdInput ? `@${naverBlogIdInput}` : '@naver_official'}
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-[#03C75A] text-[8px] font-black border border-emerald-100">이웃추가</span>
                    </div>
                    <div className="text-[9px] text-slate-400 flex items-center gap-2 mt-1 font-semibold">
                      <span>방문자: 42,910명</span>
                      <span>•</span>
                      <span>오늘: 215명</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 포스팅 본문 컨텐츠 디테일 */}
              <div className="bg-white px-4 py-5.5 flex-1 space-y-4.5">
                
                {/* 포스팅 카테고리 정보 */}
                <div className="text-[9px] text-[#03C75A] font-black tracking-wider uppercase">
                  🛠️ IT · 가전 · 일상 솔직리뷰
                </div>

                {/* 포스팅 제목 */}
                <h2 className="text-[13px] font-black text-slate-950 leading-snug tracking-tight">
                  {viewTitle}
                </h2>

                {/* 포스팅 작성 정보 */}
                <div className="flex items-center justify-between text-[9px] text-slate-400 border-b border-slate-100 pb-3 mt-1.5 font-bold">
                  <span>작성: {systemTime.split(' ')[1] || '오늘'}</span>
                  <span>주소복사 • 통계</span>
                </div>

                {/* 1. 대표 이미지 렌더링 */}
                {viewMainImage && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-video shadow-xs">
                    <img 
                      src={viewMainImage} 
                      alt="대표 이미지"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[8px] font-bold tracking-wider uppercase">
                      대표 이미지
                    </div>
                  </div>
                )}

                {/* 본문 텍스트 렌더러 */}
                <div className="py-2.5">
                  {renderFormattedContent(viewContent)}
                </div>

                {/* 2. 서브 서브이미지 본문 중간 삽입 렌더링 */}
                {viewSubImage && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-video my-4.5 shadow-xs">
                    <img 
                      src={viewSubImage} 
                      alt="본문 중간 삽입 이미지"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[8px] font-bold tracking-wider">
                      본문 삽입 이미지
                    </div>
                  </div>
                )}

                {/* 하단 태그 정보 */}
                {viewKeywords && (
                  <div className="flex flex-wrap gap-1.5 pt-4.5 border-t border-slate-100 font-bold">
                    {viewKeywords.split(',').map((k, i) => (
                      <span key={i} className="text-[10px] text-sky-650 hover:underline">
                        #{k.trim()}
                      </span>
                    ))}
                  </div>
                )}

              </div>

              {/* 네이버 블로그 하단 리액션 바 */}
              <div className="bg-white/90 backdrop-blur-md px-4 py-4 border-t border-slate-100 sticky bottom-0 z-30 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-slate-500 text-[10px] font-extrabold hover:text-red-500 transition-colors">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    <span>공감 {selectedPostForPreview?.likes_count || 12}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-500 text-[10px] font-extrabold">
                    <MessageCircle className="w-4 h-4 text-slate-400" />
                    <span>댓글 {Math.floor((selectedPostForPreview?.likes_count || 12) / 3)}</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400 font-bold">모바일 스킨 프리뷰</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* [5] 하단: 예약 및 예약 발행 완료된 타임라인 이력 관리 리스트 */}
      <div className="mt-12 p-6 lg:p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-sm space-y-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-150 pb-4 gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-3xs">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                3단계: 네이버 블로그 예약 및 발행 타임라인 이력 관리
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 font-bold">
                AI 오토파일럿 데몬 또는 관리자가 등록한 블로그 콘텐츠 일체 조회 및 양방향 실시간 라이브 프리뷰 바인딩
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button 
              onClick={fetchPosts}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all active:scale-95 cursor-pointer shadow-3xs"
              title="새로고침"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* 실시간 필터 및 표시 설정 컨트롤러 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-150/80">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="포스팅 제목, 타겟 키워드, 혹은 대상 상품명으로 실시간 검색..."
              value={blogSearchQuery}
              onChange={(e) => setBlogSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white placeholder-slate-400 font-bold transition-all text-slate-800"
            />
            {blogSearchQuery && (
              <button
                onClick={() => setBlogSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-[10px] font-black transition-all"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-500 font-bold">표시 개수:</span>
            <select
              value={blogItemsPerPage}
              onChange={(e) => {
                setBlogItemsPerPage(Number(e.target.value));
                setBlogCurrentPage(1);
              }}
              className="p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-bold text-slate-700 cursor-pointer shadow-3xs"
            >
              <option value={5}>5개씩 보기</option>
              <option value={10}>10개씩 보기</option>
              <option value={20}>20개씩 보기</option>
              <option value={50}>50개씩 보기</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/60 shadow-inner">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-extrabold bg-slate-50/70">
                <th className="py-3.5 px-4 rounded-l-xl">대상 상품</th>
                <th className="py-3.5 px-4">블로그 포스팅 제목</th>
                <th className="py-3.5 px-4">타겟 키워드</th>
                <th className="py-3.5 px-4">예약 예정 일시</th>
                <th className="py-3.5 px-4">발행 상태</th>
                <th className="py-3.5 px-4">방문수/공감</th>
                <th className="py-3.5 px-4 text-center rounded-r-xl">액션 및 제어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-750 bg-white/95">
              {paginatedPosts.map((post) => (
                <tr 
                  key={post.id}
                  onClick={() => setSelectedPostForPreview(post)}
                  className={`hover:bg-slate-50/80 transition-all cursor-pointer ${
                    selectedPostForPreview?.id === post.id ? 'bg-emerald-50/20 font-semibold' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    {post.product ? (
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={post.product.main_image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=50&auto=format&fit=crop&q=80'} 
                          alt={post.product.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-100 shrink-0"
                        />
                        <span className="font-extrabold text-slate-800 max-w-[120px] line-clamp-1">
                          {post.product.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-bold">공통 프로모션</span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-black text-slate-900 max-w-[220px] truncate">
                    {post.title}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {post.target_keywords ? (
                        post.target_keywords.split(',').map((k, i) => (
                          <span key={i} className="px-2.5 py-0.5 rounded-xl bg-slate-50 border border-slate-150 text-sky-650 text-[9px] font-black shadow-3xs">
                            #{k.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 font-bold">지정 없음</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-black text-slate-550">
                    {new Date(post.scheduled_at).toLocaleString('ko-KR', { hour12: false })}
                  </td>
                  <td className="py-4 px-4">
                    {post.status === 'POSTED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-150 shadow-3xs">
                        <CheckCircle className="w-3.5 h-3.5" /> 즉시 발행 완료
                      </span>
                    )}
                    {post.status === 'SCHEDULED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-250 shadow-3xs animate-pulse">
                        <Calendar className="w-3.5 h-3.5" /> 예약 자동 대기
                      </span>
                    )}
                    {post.status === 'DRAFT' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-50 text-slate-550 border border-slate-200 shadow-3xs">
                        임시 보관 초안
                      </span>
                    )}
                    {post.status === 'FAILED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-650 border border-rose-200 shadow-3xs">
                        발행 실패
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {post.status === 'POSTED' ? (
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-extrabold">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.views_count}
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <Heart className="w-3.5 h-3.5 fill-red-500/10 text-red-500" />
                          {post.likes_count}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-bold">대기 중</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      {post.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleApproveImmediate(post.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#03C75A] text-emerald-600 hover:text-white border border-emerald-100 hover:border-[#03C75A] text-[10px] font-black transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-3xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          발행 승인
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedPostForPreview(post)}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 text-[10px] font-extrabold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-3xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        미리보기
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-650 border border-slate-200 hover:border-rose-250 transition-all active:scale-95 cursor-pointer shadow-3xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {posts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-black">
                    타임라인 이력이 비어 있습니다. AI 원고 생성기를 실행하거나 오토파일럿 데몬을 기동하여 첫 예약을 빌드해 보세요! ⏰
                  </td>
                </tr>
              )}

              {posts.length > 0 && filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-450 font-extrabold bg-slate-50/20">
                    검색 결과와 매칭되는 네이버 블로그 예약 포스팅 내역이 없습니다. 🔍
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 에메랄드 테마의 페이지네이션 네비게이터 */}
        <div className="flex items-center justify-between border-t border-slate-150 pt-5 mt-2">
          <div className="text-[10px] text-slate-450 font-bold">
            {filteredPosts.length === 0 
              ? "전체 0건 표시" 
              : `총 ${filteredPosts.length}개 중 ${(blogCurrentPage - 1) * blogItemsPerPage + 1}-${Math.min(blogCurrentPage * blogItemsPerPage, filteredPosts.length)}개 표시 중`}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setBlogCurrentPage(1)}
              disabled={blogCurrentPage === 1 || totalBlogPages <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-3xs cursor-pointer"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setBlogCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={blogCurrentPage === 1 || totalBlogPages <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-3xs cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            {totalBlogPages <= 1 ? (
              <button
                disabled
                className="w-8 h-8 rounded-xl text-xs font-bold transition-all shadow-3xs bg-emerald-500 border border-emerald-500 text-white font-extrabold shadow-sm disabled:opacity-50 cursor-not-allowed"
              >
                1
              </button>
            ) : (
              Array.from({ length: totalBlogPages }, (_, idx) => idx + 1)
                .filter(p => p >= blogCurrentPage - 2 && p <= blogCurrentPage + 2)
                .map(p => (
                  <button
                    key={p}
                    onClick={() => setBlogCurrentPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer ${
                      blogCurrentPage === p
                        ? 'bg-emerald-500 border border-emerald-500 text-white font-extrabold shadow-sm'
                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                ))
            )}

            <button
              onClick={() => setBlogCurrentPage(prev => Math.min(prev + 1, totalBlogPages))}
              disabled={blogCurrentPage === totalBlogPages || totalBlogPages <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-3xs cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setBlogCurrentPage(totalBlogPages)}
              disabled={blogCurrentPage === totalBlogPages || totalBlogPages <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-3xs cursor-pointer"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 실시간 플로팅 토스트 */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, top: -80 }}
            animate={{ opacity: 1, top: 24 }}
            exit={{ opacity: 0, top: -80 }}
            className={`fixed left-1/2 -translate-x-1/2 px-5 py-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border text-xs font-black flex items-center gap-3.5 z-[99999] min-w-[340px] justify-between ${
              toastType === 'success'
                ? 'bg-emerald-50 border-emerald-250 text-emerald-650'
                : toastType === 'error'
                ? 'bg-rose-50 border-rose-250 text-rose-650'
                : 'bg-blue-50 border-blue-250 text-blue-650'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toastType === 'success' && <CheckCircle className="w-5 h-5 shrink-0 text-emerald-550" />}
              {toastType === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-rose-550" />}
              {toastType === 'info' && <AlertCircle className="w-5 h-5 shrink-0 text-blue-550" />}
              <span className="leading-snug">{toastMessage}</span>
            </div>
            
            <button 
              onClick={() => setToastMessage(null)}
              className="text-[9px] hover:underline uppercase shrink-0 tracking-wider text-slate-400 hover:text-slate-650 cursor-pointer font-black border border-slate-200 rounded-lg px-2 py-0.5 bg-white shadow-3xs"
            >
              닫기
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RPA 최초 기동 문제해결 가이드 모달 */}
      <AnimatePresence>
        {isGuideModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGuideModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* 모달 박스 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
              style={{ maxHeight: '85vh' }}
            >
              {/* 상단 헤더 */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white via-emerald-50/20 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#03C75A] shadow-3xs">
                    <NaverIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      RPA 최초 기동 사전 준비 가이드
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      RPA 최초 자동화 기동 및 로그인 실패 시 아래 4단계를 완료해 주세요.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGuideModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-all focus:outline-none cursor-pointer border border-slate-150 shadow-3xs"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 스크롤 가능한 본문 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left min-h-0" style={{ overflowY: 'auto' }}>
                
                {/* 인트로 알림 */}
                <div className="p-4.5 bg-emerald-50/60 border border-emerald-150 rounded-2xl flex items-start gap-3 shadow-3xs">
                  <Info className="w-5 h-5 text-[#03C75A] shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-xs text-slate-700 leading-relaxed font-bold">
                    네이버 블로그 무인 자동화(RPA) 기동은 일반 크롬 브라우저가 아닌, Playwright 전용 보안 브라우저 환경을 로컬 PC에 필수로 요구합니다. 아래 안내에 따라 터미널 명령어를 실행하시면 100% 해결됩니다.
                  </p>
                </div>

                {/* 4단계 가이드 리스트 */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-450 uppercase tracking-wider">🛠️ RPA 최초 로그인 준비 4단계</h4>
                  
                  {/* 1단계 */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-3xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 text-xs font-black flex items-center justify-center border border-emerald-100">1</span>
                        <h5 className="text-xs font-black text-slate-800">Playwright 전용 Chromium 브라우저 설치 (가장 중요 🌟)</h5>
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">필수 수행</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      프로젝트 루트 디렉토리(<code className="px-1.5 py-0.5 bg-slate-100 border border-slate-250 rounded font-mono text-slate-700">c:\dev\egdesk-FreeSMS</code>)에서 터미널(CMD 또는 PowerShell)을 열고 아래 설치 명령어를 입력해 주세요. (설치 소요 시간 약 1~2분)
                    </p>
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono text-xs text-emerald-450 shadow-inner">
                      <span>npx playwright install chromium</span>
                      <button
                        onClick={() => handleCopyToClipboard('npx playwright install chromium', 'Playwright 크로미움 설치')}
                        className="p-1.5 rounded-xl bg-slate-800 hover:!bg-[#03C75A] hover:!text-white transition-all flex items-center gap-1 text-[10px] font-black border border-slate-700 cursor-pointer text-slate-300"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedText === 'npx playwright install chromium' ? '복사됨!' : '복사'}
                      </button>
                    </div>
                  </div>

                  {/* 2단계 */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 shadow-3xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 text-xs font-black flex items-center justify-center border border-emerald-100">2</span>
                      <h5 className="text-xs font-black text-slate-800">GUI 지원 로컬 터미널 환경 확인 (실물 화면 필수)</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      네이버 자동 로그인 창을 화면상에 띄우기 위해서는 백그라운드가 아닌 실제 데스크톱 화면이 지원되는 CMD 터미널에서 구동해야 합니다. 원격 SSH 터미널 단독 기동 시 브라우저 GUI 생성 불가로 실패할 수 있습니다.
                    </p>
                  </div>

                  {/* 3단계 */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-3xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 text-xs font-black flex items-center justify-center border border-emerald-100">3</span>
                      <h5 className="text-xs font-black text-slate-800">로컬 패키지 환경 꼬임 리셋</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      종종 구버전 패키지 및 라이브러리 간섭 시, 아래 패키지 최적화 설치 명령어를 실행하시면 아주 원활하게 클린 설치가 마무리됩니다.
                    </p>
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono text-xs text-emerald-450 shadow-inner">
                      <span>npm install</span>
                      <button
                        onClick={() => handleCopyToClipboard('npm install', 'npm 패키지 복구')}
                        className="p-1.5 rounded-xl bg-slate-800 hover:!bg-[#03C75A] hover:!text-white transition-all flex items-center gap-1 text-[10px] font-black border border-slate-700 cursor-pointer text-slate-300"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedText === 'npm install' ? '복사됨!' : '복사'}
                      </button>
                    </div>
                  </div>

                  {/* 4단계 */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-3xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 text-xs font-black flex items-center justify-center border border-emerald-100">4</span>
                      <h5 className="text-xs font-black text-slate-800">네이버 로그인 및 세션 동기화</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      모든 준비가 끝났다면 계정 카드 하단의 <strong>[RPA 최초 로그인 브라우저 기동 🚀]</strong>을 클릭하여 크로미움 브라우저 팝업을 띄우고, 네이버 로그인을 손수 완료해 주세요. 로그인 성공 확인 후 바로 아래의 <strong>[세션 동기화 실시간 갱신 🔄]</strong>을 클릭하면 연결 표시등이 🟢 초록빛으로 점등됩니다.
                    </p>
                  </div>
                </div>

                {/* 1초 원인 분석 셀프 진단 */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-3xs">
                  <div className="flex items-center gap-2.5 text-amber-600">
                    <Terminal className="w-4.5 h-4.5" />
                    <h5 className="text-xs font-black uppercase tracking-wider">🔍 1초 만에 원인 파악하는 셀프 진단 명령어</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    웹 화면 상의 비동기 흐름 대신, 터미널에서 RPA 데몬을 직접 실행해 보면 구체적으로 어떤 에러 코드(예: 브라우저 누락 등)로 인해 기동이 실패했는지 한 눈에 파악할 수 있어 강력 추천합니다.
                  </p>
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono text-xs text-emerald-450 shadow-inner">
                    <span>npm run naver:daemon</span>
                    <button
                      onClick={() => handleCopyToClipboard('npm run naver:daemon', 'RPA 데몬 강제 실행')}
                      className="p-1.5 rounded-xl bg-slate-800 hover:!bg-[#03C75A] hover:!text-white transition-all flex items-center gap-1 text-[10px] font-black border border-slate-700 cursor-pointer text-slate-300"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedText === 'npm run naver:daemon' ? '복사됨!' : '복사'}
                    </button>
                  </div>
                  
                  {/* 자가 조치 표 */}
                  <div className="border-t border-slate-200 pt-3 mt-2.5 space-y-1.5 text-slate-500 font-semibold">
                    <div className="flex items-start gap-2 text-[10.5px]">
                      <span className="text-amber-600 font-bold shrink-0">1.</span>
                      <span>
                        <code className="text-rose-600 font-bold">Executable doesn't exist...</code> 에러 검출 시 <strong>1단계 브라우저 설치</strong> 명령어를 실행하시면 100% 해결됩니다.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-[10.5px]">
                      <span className="text-amber-600 font-bold shrink-0">2.</span>
                      <span>
                        <code className="text-rose-600 font-bold">Cannot find module...</code> 에러 검출 시 <strong>3단계 패키지 재설치</strong> 명령어를 수행하시면 해결됩니다.
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* 하단 푸터 */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  onClick={() => setIsGuideModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#03C75A] text-white hover:bg-emerald-600 transition-all text-xs font-bold active:scale-95 shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  확인 완료 및 닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 로컬 PC 데몬 및 백그라운드 구동 정보 모달 */}
      <AnimatePresence>
        {isDaemonInfoOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDaemonInfoOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* 모달 박스 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
              style={{ maxHeight: '85vh' }}
            >
              {/* 상단 헤더 */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white via-emerald-50/20 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#03C75A]">
                    <NaverIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      오토파일럿 로컬 백그라운드 구동 방법 가이드
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      로컬 컴퓨터 전원이 켜져 있을 때 오토파일럿 데몬이 작동하는 구체적인 실무 매뉴얼입니다.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDaemonInfoOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-all focus:outline-none cursor-pointer border border-slate-150"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 스크롤 가능한 본문 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left min-h-0" style={{ overflowY: 'auto' }}>
                
                {/* 현재 로컬 세션 상태 체크 */}
                <div className={`p-4 rounded-2xl flex items-start gap-3 border ${hasSession ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <Info className={`w-5 h-5 shrink-0 mt-0.5 ${hasSession ? 'text-[#03C75A]' : 'text-amber-500'}`} />
                  <div>
                    <h4 className={`text-xs font-bold ${hasSession ? 'text-emerald-700' : 'text-amber-800'}`}>
                      현재 로컬 인증 상태: {hasSession ? '인증 완료 (즉시 구동 가능)' : '최초 1회 로그인 대기 중'}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {hasSession 
                        ? '네이버 로그인 세션 쿠키가 저장되어 있습니다. 예약 글 발행 시 크롬 브라우저 로그인 창 없이 백그라운드에서 바로 자동 포스팅이 작동합니다.' 
                        : '아직 로그인 세션(naver_session.json)이 저장되지 않았습니다. 예약 발행을 시작하기 전에 최초 1회 로그인 창을 열어 인증을 진행해 주셔야 오토파일럿이 활성화됩니다.'}
                    </p>
                  </div>
                </div>

                {/* 1. 터미널에서 직접 실행 및 진단하기 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#03C75A]"></span>
                    방법 1. 터미널에서 직접 실행하여 실시간 로그 검증
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    로컬 PC에서 <strong>PowerShell</strong> 또는 <strong>명령 프롬프트(CMD)</strong>를 열고 아래 명령어를 순서대로 실행해 보세요.
                  </p>
                  
                  <div className="space-y-3">
                    {/* 1단계 명령어 */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>① 프로젝트 루트 경로로 이동</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("cd c:\\dev\\egdesk-FreeSMS");
                            showToast("이동 명령어가 클립보드에 복사되었습니다.", "success");
                          }}
                          className="px-2 py-0.5 rounded bg-white hover:bg-slate-50 text-slate-650 active:scale-95 transition-all flex items-center gap-1 cursor-pointer border border-slate-200 shadow-2xs"
                        >
                          <Copy className="w-3 h-3" />
                          <span>복사</span>
                        </button>
                      </div>
                      <code className="block text-xs font-mono text-emerald-600 bg-white p-2.5 rounded-xl border border-slate-200">
                        cd c:\dev\egdesk-FreeSMS
                      </code>
                    </div>

                    {/* 2단계 명령어 */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>② 자동화 데몬 수동 구동</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("npm run naver:daemon");
                            showToast("데몬 실행 명령어가 클립보드에 복사되었습니다.", "success");
                          }}
                          className="px-2 py-0.5 rounded bg-white hover:bg-slate-50 text-slate-650 active:scale-95 transition-all flex items-center gap-1 cursor-pointer border border-slate-200 shadow-2xs"
                        >
                          <Copy className="w-3 h-3" />
                          <span>복사</span>
                        </button>
                      </div>
                      <code className="block text-xs font-mono text-emerald-600 bg-white p-2.5 rounded-xl border border-slate-200">
                        npm run naver:daemon
                      </code>
                    </div>
                  </div>

                  {/* 실행 로그 가이드 */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">📋 정상 동작 시 터미널 로그 결과</span>
                    <div className="space-y-2.5 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-mono text-[10px] shrink-0 mt-0.5">대기 모드</span>
                        <span className="text-slate-500">
                          예약글이 없으면 <code className="text-slate-700 font-mono font-semibold">"💤 현재 기준 실행해야 할 발행 예정 예약글이 없습니다..."</code> 로그와 함께 안전 종료되며 대기 모드로 들어갑니다.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-mono text-[10px] shrink-0 mt-0.5">최초 구동</span>
                        <span className="text-slate-500">
                          로그인 쿠키 세션이 없을 경우 크롬 브라우저가 자동으로 화면에 팝업됩니다. <strong>3분 이내</strong>에 로그인 및 스마트폰 2단계 인증을 마치면 인증이 완착 등록됩니다.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. 웹 UI에서 원격으로 로그인 브라우저 팝업시키기 */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#03C75A]"></span>
                    방법 2. 웹 브라우저에서 원격으로 로그인 창 실행
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    터미널 실행이 어려우시다면, 인터넷 브라우저 주소창에 아래 주소를 입력하고 엔터를 눌러도 로컬 PC 화면에 즉시 로그인 창이 실행됩니다.
                  </p>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>인증 브라우저 기동 API</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("http://localhost:3000/api/naver-blog/settings?action=trigger_session");
                          showToast("API 주소가 복사되었습니다.", "success");
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-slate-50 text-slate-650 active:scale-95 transition-all flex items-center gap-1 cursor-pointer border border-slate-200 shadow-2xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>복사</span>
                      </button>
                    </div>
                    <code className="block text-xs font-mono text-emerald-600 bg-white p-2.5 rounded-xl border border-slate-200 break-all">
                      http://localhost:3000/api/naver-blog/settings?action=trigger_session
                    </code>
                  </div>
                </div>

                {/* 3. 로그인 완료 후 검증 파일 체크 */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#03C75A]"></span>
                    방법 3. 파일 존재 여부를 통한 완벽 검증
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    로그인 세션이 안전하게 저장되면, 프로젝트 루트의 <code className="text-slate-650 font-mono font-semibold">scripts/</code> 폴더 내에 <strong>`naver_session.json`</strong> 파일이 생성되어 있는 것을 볼 수 있습니다. 이 파일이 존재한다면 정상적으로 대기 및 작동이 준비된 상태입니다.
                  </p>
                </div>

              </div>

              {/* 하단 푸터 */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  onClick={() => setIsDaemonInfoOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#03C75A] text-white hover:bg-emerald-600 transition-all text-xs font-bold active:scale-95 shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  확인 완료 및 닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
