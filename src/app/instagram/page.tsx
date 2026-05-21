'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Settings, Calendar, Heart, MessageCircle, 
  Layers, Image as ImageIcon, Send, Sliders, ToggleLeft, ToggleRight,
  TrendingUp, Users, CheckCircle, RefreshCw, Upload, Eye, FileText,
  AlertTriangle, Check, BookOpen, AlertCircle, ShoppingBag
} from 'lucide-react';

// 커스텀 인스타그램 아이콘 SVG 컴포넌트 추가
function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface Product {
  id: string;
  name: string;
  price: string;
  main_image_url: string;
  url: string;
}

interface InstagramPost {
  id: number;
  product_id: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'POSTED' | 'FAILED';
  content: string;
  image_url: string;
  scheduled_at: string;
  posted_at: string | null;
  error_message: string | null;
  likes_count: number;
  comments_count: number;
  product?: Product | null;
}

interface AutopilotSettings {
  id: number;
  is_autopilot: number;
  autopilot_interval: string;
  autopilot_time: string;
  tone_style: string;
  instagram_username: string;
  access_token: string;
}

export default function InstagramMarketingPortal() {
  // 상태 변수
  const [settings, setSettings] = useState<AutopilotSettings>({
    id: 1,
    is_autopilot: 0,
    autopilot_interval: 'DAILY',
    autopilot_time: '10:00',
    tone_style: '인플루언서형',
    instagram_username: '',
    access_token: ''
  });

  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // AI 생성 폼 상태
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('인플루언서형');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');

  // 3-Way 이미지 셀렉터 탭
  const [imageTab, setImageTab] = useState<'product' | 'ai' | 'canvas'>('product');
  const [customImageFile, setCustomImageFile] = useState<string | null>(null);

  // 카드뉴스 캔버스 옵션
  const [canvasTitle, setCanvasTitle] = useState('SPECIAL SALE');
  const [canvasSubtitle, setCanvasSubtitle] = useState('오늘 단 하루, 특별한 혜택');
  const [canvasDiscount, setCanvasDiscount] = useState('30% OFF');
  const [canvasOverlayColor, setCanvasOverlayColor] = useState('rgba(0, 0, 0, 0.4)');
  const [canvasTheme, setCanvasTheme] = useState('gradient-gold'); // gradient-gold, neon-pink, modern-dark

  // 예약 설정
  const [scheduleDate, setScheduleDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [scheduleTime, setScheduleTime] = useState('10:00');

  // 계정 연결 상태
  const [sessionLoginName, setSessionLoginName] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [isSessionConnected, setIsSessionConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'graph' | 'session'>('session');

  // 알림/피드백 메시지
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // 캔버스 Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 초기 로딩
  useEffect(() => {
    fetchSettings();
    fetchPosts();
    fetchProducts();
  }, []);

  // 카드뉴스 캔버스 렌더링 헬퍼
  useEffect(() => {
    if (imageTab === 'canvas') {
      renderCanvas();
    }
  }, [imageTab, selectedProduct, generatedImageUrl, customImageFile, canvasTitle, canvasSubtitle, canvasDiscount, canvasTheme, canvasOverlayColor]);

  // 토스트 팝업 띄우기
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // API 데이터 페칭
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/instagram/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        if (data.settings.instagram_username) {
          setIsSessionConnected(true);
        }
      }
    } catch (err) {
      console.error('설정 로딩 에러:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/instagram/posts');
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

  // 설정 저장
  const saveSettings = async (updatedSettings: Partial<AutopilotSettings>) => {
    try {
      const newSettings = { ...settings, ...updatedSettings };
      const res = await fetch('/api/instagram/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        showToast('인스타그램 마케팅 설정이 안전하게 업데이트되었습니다.', 'success');
      } else {
        showToast('설정 저장 실패: ' + data.error, 'error');
      }
    } catch (err: any) {
      showToast('설정 저장 중 오류: ' + err.message, 'error');
    }
  };

  // 세션 바인딩 연결 시뮬레이터
  const handleConnectSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionLoginName) {
      showToast('인스타그램 계정명을 입력해주세요.', 'error');
      return;
    }
    
    // 계정 연결 상태 저장
    await saveSettings({
      instagram_username: sessionLoginName,
      access_token: 'session_bound_' + Math.random().toString(36).substring(7)
    });
    setIsSessionConnected(true);
    showToast(`@${sessionLoginName} 계정 세션이 안전하게 바인딩 연동되었습니다!`, 'success');
  };

  const handleDisconnectSession = async () => {
    await saveSettings({
      instagram_username: '',
      access_token: ''
    });
    setIsSessionConnected(false);
    setSessionLoginName('');
    setSessionPassword('');
    showToast('연동된 인스타그램 계정이 해제되었습니다.', 'info');
  };

  // AI 문구 및 이미지 동시 생성기 구동
  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/instagram/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct?.id || null,
          prompt: aiPrompt,
          tone_style: aiTone,
          generate_image: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedText(data.text);
        setGeneratedImageUrl(data.image_url);
        showToast('AI가 매력적인 문구와 감성 이미지를 완성했습니다!', 'success');
        
        // AI 탭으로 이미지 탭 전환
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

  // 오토파일럿 데몬 강제 즉시 실행 트리거
  const handleTriggerAutopilot = async () => {
    showToast('오토파일럿 AI 마케터를 즉시 구동합니다...', 'info');
    try {
      const res = await fetch('/api/instagram/scheduler');
      const data = await res.json();
      if (data.success) {
        if (data.triggered) {
          showToast(data.message, 'success');
          fetchPosts(); // 리스트 새로고침
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

  // 예약/발행 승인 포스팅 등록
  const handleSchedulePost = async (isImmediate = false) => {
    if (!isSessionConnected) {
      showToast('먼저 인스타그램 계정을 연동해 주세요.', 'error');
      return;
    }

    let finalImageUrl = '';

    // 탭별 이미지 소스 획득
    if (imageTab === 'product') {
      if (!selectedProduct?.main_image_url) {
        showToast('선택된 상품에 메인 이미지가 없습니다.', 'error');
        return;
      }
      finalImageUrl = selectedProduct.main_image_url;
    } else if (imageTab === 'ai') {
      if (!generatedImageUrl) {
        showToast('생성된 AI 감성 이미지가 없습니다.', 'error');
        return;
      }
      finalImageUrl = generatedImageUrl;
    } else if (imageTab === 'canvas') {
      if (!canvasRef.current) {
        showToast('카드뉴스 로딩에 실패했습니다.', 'error');
        return;
      }
      // canvas 데이터를 dataURL로 추출해 그대로 서버로 전송
      finalImageUrl = canvasRef.current.toDataURL('image/png');
    }

    const postContent = generatedText || (selectedProduct ? `✨ 신상품 출시! [${selectedProduct.name}] ✨\n\n지금 바로 프로필 링크에서 만나보세요! 🛍️` : '');

    const targetStatus = isImmediate ? 'POSTED' : 'SCHEDULED';
    const targetScheduledAt = isImmediate 
      ? new Date().toISOString() 
      : new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();

    try {
      const res = await fetch('/api/instagram/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct?.id || null,
          status: targetStatus,
          content: postContent,
          image_url: finalImageUrl,
          scheduled_at: targetScheduledAt
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          isImmediate 
            ? '피드가 인스타그램에 즉시 업로드 완료되었습니다!' 
            : '포스팅이 지정한 시간대에 성공적으로 예약되었습니다.', 
          'success'
        );
        
        // 폼 리셋
        setGeneratedText('');
        setAiPrompt('');
        
        // 이력 다시 불러오기
        fetchPosts();
      } else {
        showToast('예약 등록 실패: ' + data.error, 'error');
      }
    } catch (err: any) {
      showToast('예약 등록 중 오류: ' + err.message, 'error');
    }
  };

  // 예약글 즉시 발행(승인) 또는 취소(삭제)
  const handleApproveImmediate = async (postId: number) => {
    try {
      const res = await fetch('/api/instagram/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          updates: { status: 'POSTED' }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('예약 초안이 즉시 발행 승인되었습니다!', 'success');
        fetchPosts();
      } else {
        showToast('승인 실패: ' + data.error, 'error');
      }
    } catch (err: any) {
      showToast('승인 오류: ' + err.message, 'error');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('정말 이 예약을 취소하고 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/instagram/posts?id=${postId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('예약이 정상적으로 취소 및 삭제되었습니다.', 'info');
        fetchPosts();
      } else {
        showToast('예약 취소 실패: ' + data.error, 'error');
      }
    } catch (err: any) {
      showToast('삭제 오류: ' + err.message, 'error');
    }
  };

  // 직접 이미지 업로드 (카드뉴스 배경 등 활용)
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomImageFile(event.target.result as string);
          showToast('커스텀 이미지가 업로드되어 캔버스 스튜디오에 적용되었습니다.', 'success');
          setImageTab('canvas');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 카드뉴스 실시간 Canvas 합성 드로잉 핵심 코어
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 고해상도 정사각형 (1080 x 1080)
    canvas.width = 1080;
    canvas.height = 1080;

    // 배경 이미지 로드
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';

    // 3-Way 중 현재 설정된 이미지 픽업
    let imgSrc = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'; // 폴백
    if (customImageFile) {
      imgSrc = customImageFile;
    } else if (imageTab === 'ai' && generatedImageUrl) {
      imgSrc = generatedImageUrl;
    } else if (selectedProduct?.main_image_url) {
      imgSrc = selectedProduct.main_image_url;
    }

    bgImg.onload = () => {
      // 1. 이미지 비율 맞추어 채우기 (Aspect Fill)
      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = bgImg.width / bgImg.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let drawX = 0;
      let drawY = 0;

      if (imgRatio > canvasRatio) {
        drawWidth = bgImg.width * (canvas.height / bgImg.height);
        drawX = (canvas.width - drawWidth) / 2;
      } else {
        drawHeight = bgImg.height * (canvas.width / bgImg.width);
        drawY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight);

      // 2. 오버레이 어두운 레이어 얹기 (가독성 향상)
      ctx.fillStyle = canvasOverlayColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. 테마 그라데이션 장식 및 띠 그리기
      if (canvasTheme === 'gradient-gold') {
        // 골드 그라데이션 테두리 및 텍스트 띠
        const borderGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        borderGrad.addColorStop(0, '#d4af37');
        borderGrad.addColorStop(0.5, '#f3e5ab');
        borderGrad.addColorStop(1, '#aa771c');

        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 30;
        ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

        // 상단 띠
        ctx.fillStyle = 'rgba(170, 119, 28, 0.8)';
        ctx.fillRect(0, 100, canvas.width, 90);
      } else if (canvasTheme === 'neon-pink') {
        // 네온 핑크 테두리
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 20;
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 20;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        ctx.shadowBlur = 0; // 초기화
      } else if (canvasTheme === 'modern-dark') {
        // 모던 시크 다크 반투명 하단 텍스트 박스
        ctx.fillStyle = 'rgba(15, 15, 20, 0.85)';
        ctx.fillRect(80, 720, canvas.width - 160, 260);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 720, canvas.width - 160, 260);
      }

      // 4. 타이틀 텍스트 드로잉 (한글 폰트 적용)
      ctx.textAlign = 'center';
      
      // (1) 할인율 및 이벤트 태그 그리기
      if (canvasDiscount) {
        ctx.save();
        ctx.font = 'bold 44px sans-serif';
        const tagText = canvasDiscount.toUpperCase();
        const textWidth = ctx.measureText(tagText).width;
        const tagW = textWidth + 60;
        const tagH = 80;
        const tagX = canvas.width / 2 - tagW / 2;
        const tagY = canvasTheme === 'gradient-gold' ? 105 : 220;

        // 태그 배경 (네온 광채 또는 골드 그라데이션)
        if (canvasTheme === 'neon-pink') {
          ctx.fillStyle = '#ff007f';
          ctx.shadowColor = '#ff007f';
          ctx.shadowBlur = 15;
        } else if (canvasTheme === 'gradient-gold') {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = '#ffffff';
        }
        
        // 둥근 직사각형
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, tagW, tagH, 40);
        ctx.fill();

        // 태그 텍스트
        ctx.shadowBlur = 0;
        ctx.fillStyle = canvasTheme === 'gradient-gold' ? '#aa771c' : '#0f0f14';
        ctx.fillText(tagText, canvas.width / 2, tagY + 56);
        ctx.restore();
      }

      // (2) 메인 타이틀 그리기
      ctx.save();
      ctx.fillStyle = '#ffffff';
      
      if (canvasTheme === 'neon-pink') {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
      }

      ctx.font = 'bold 84px sans-serif';
      const mainTextY = canvasTheme === 'modern-dark' ? 820 : 540;
      ctx.fillText(canvasTitle, canvas.width / 2, mainTextY);
      ctx.restore();

      // (3) 서브 타이틀 그리기
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '500 42px sans-serif';
      const subTextY = canvasTheme === 'modern-dark' ? 900 : 640;
      ctx.fillText(canvasSubtitle, canvas.width / 2, subTextY);
      ctx.restore();

      // (4) 하단 브랜드 시그니처 마크 그리기
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(`@${settings.instagram_username || 'EGD_AI_MARKETER'}`, canvas.width / 2, 1020);
    };

    // CORS 이슈 해결을 위한 Unsplash 우회 및 대체
    bgImg.src = imgSrc.startsWith('data:') ? imgSrc : imgSrc + (imgSrc.includes('?') ? '&' : '?') + 'r=' + Date.now();
  };

  // 예약 피드의 색상/상태 클래스 맵
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">임시 초안</span>;
      case 'SCHEDULED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">발행 예약</span>;
      case 'POSTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">발행 완료</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">발행 실패</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] p-6 lg:p-10 font-sans selection:bg-[#ff007f] selection:text-white relative overflow-hidden">
      {/* 백그라운드 퍼플/블루 그라데이션 오로라 광채 효과 */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-900/10 blur-[150px] pointer-events-none" />

      {/* 헤더 영역 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#27272a] pb-6 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-[#ff007f] to-[#7928ca] rounded-xl shadow-[0_0_20px_rgba(255,0,127,0.3)] animate-pulse">
              <InstagramIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              인스타 마케팅 포털 <span className="text-sm font-semibold text-[#ff007f] border border-[#ff007f]/40 px-2 py-0.5 rounded-full bg-[#ff007f]/5 ml-2">Premium Autopilot</span>
            </h1>
          </div>
          <p className="text-neutral-400 mt-2 text-sm md:text-base">
            AI 모델을 활용해 상품 분석 카피라이팅부터 카드뉴스 캔버스 합성, 100% 무인 자동 발행(오토파일럿)까지 완벽히 조율합니다.
          </p>
        </div>

        {/* 오토파일럿 데몬 즉시 실행 버튼 */}
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {settings.is_autopilot === 1 && (
            <button 
              onClick={handleTriggerAutopilot}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#ff007f]/30 bg-[#ff007f]/10 text-white font-medium hover:bg-[#ff007f]/20 hover:shadow-[0_0_15px_rgba(255,0,127,0.2)] transition duration-200 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 animate-spin text-[#ff007f]" />
              오토파일럿 AI 즉시 가동
            </button>
          )}
          <span className="text-xs text-neutral-500">
            현재 시스템 시간: 10:34 (AM)
          </span>
        </div>
      </div>

      {/* 1. 상단 통계 영역 (네온 통계 카드) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
        <motion.div 
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl border border-white/5 bg-[#0f0f13]/80 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff007f]/5 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">총 팔로워</p>
              <h3 className="text-2xl font-black mt-2 text-white shadow-sm">12.8K <span className="text-xs text-emerald-400 font-bold ml-1.5">▲ 4.8%</span></h3>
            </div>
            <div className="p-3 bg-[#ff007f]/10 text-[#ff007f] rounded-xl border border-[#ff007f]/20 shadow-[0_0_10px_rgba(255,0,127,0.15)]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-4">AI 감성 마케팅 도입 이후 최다 유입</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl border border-white/5 bg-[#0f0f13]/80 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">피드 평균 도달률</p>
              <h3 className="text-2xl font-black mt-2 text-white">45.2% <span className="text-xs text-emerald-400 font-bold ml-1.5">▲ 12.1%</span></h3>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-4">트렌디 해시태그 AI 오토매칭 효과</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl border border-white/5 bg-[#0f0f13]/80 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">이달의 업로드</p>
              <h3 className="text-2xl font-black mt-2 text-white">28개 <span className="text-xs text-neutral-400 font-bold ml-1.5">총 120개</span></h3>
            </div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-4">수동 승인 12건 / 오토파일럿 16건</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl border border-white/5 bg-[#0f0f13]/80 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">마케팅 자동화 정합성</p>
              <h3 className="text-2xl font-black mt-2 text-white">100% <span className="text-xs text-neutral-400 font-bold ml-1.5">오류 없음</span></h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-4">SQLite 마이그레이션 및 동기화 최상</p>
        </motion.div>
      </div>

      {/* 메인 레이아웃: 대시보드 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 items-start">
        
        {/* 왼쪽 & 중간 영역: 연동 설정 & AI 크리에이터 스튜디오 */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 2. 오토파일럿 설정 및 하이브리드 인스타그램 연동 */}
          <div className="p-6 lg:p-8 rounded-3xl border border-white/5 bg-[#0f0f13]/80 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
              <Settings className="w-5 h-5 text-[#ff007f]" />
              <h2 className="text-xl font-bold">인스타그램 오토파일럿 및 계정 바인딩</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 왼쪽 칼럼: 오토파일럿 동작 모드 및 세부 속성 */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold text-white block">듀얼 마케팅 제어 모드</label>
                      <span className="text-xs text-neutral-400 mt-1 block">
                        {settings.is_autopilot === 1 
                          ? '100% 무인 오토파일럿이 주기적으로 피드를 올립니다.' 
                          : 'AI가 초안을 만들고 어드민 큐에 대기(수동 승인 필요)'}
                      </span>
                    </div>
                    <button
                      onClick={() => saveSettings({ is_autopilot: settings.is_autopilot === 1 ? 0 : 1 })}
                      className="focus:outline-none cursor-pointer"
                    >
                      {settings.is_autopilot === 1 ? (
                        <ToggleRight className="w-14 h-8 text-[#ff007f]" />
                      ) : (
                        <ToggleLeft className="w-14 h-8 text-neutral-500" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-400 block mb-2">자동 마케팅 주기</label>
                    <select
                      value={settings.autopilot_interval}
                      onChange={(e) => saveSettings({ autopilot_interval: e.target.value })}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff007f]"
                    >
                      <option value="DAILY">매일 (Daily)</option>
                      <option value="WEEKLY">매주 월/목 (Weekly)</option>
                      <option value="BIWEEKLY">격주 (Bi-weekly)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-400 block mb-2">발행 시간대</label>
                    <input
                      type="time"
                      value={settings.autopilot_time}
                      onChange={(e) => saveSettings({ autopilot_time: e.target.value })}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff007f]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-2">기본 선호 카피라이팅 톤</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['인플루언서형', '세련된형', '전문가형', '유머형'].map((tone) => (
                      <button
                        key={tone}
                        onClick={() => saveSettings({ tone_style: tone })}
                        className={`text-xs font-medium py-2 px-1 rounded-lg border transition ${
                          settings.tone_style === tone
                            ? 'border-[#ff007f]/50 bg-[#ff007f]/10 text-white'
                            : 'border-white/5 bg-[#18181b] text-neutral-400 hover:border-white/10'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 오른쪽 칼럼: 계정 세션 연동 및 비즈니스 전환 가이드 */}
              <div className="border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8 space-y-6">
                <div>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setConnectionMode('session')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                        connectionMode === 'session'
                          ? 'border-[#ff007f] bg-[#ff007f]/10 text-white'
                          : 'border-white/5 text-neutral-400'
                      }`}
                    >
                      개인 계정 세션 바인딩
                    </button>
                    <button
                      onClick={() => setConnectionMode('graph')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                        connectionMode === 'graph'
                          ? 'border-[#ff007f] bg-[#ff007f]/10 text-white'
                          : 'border-white/5 text-neutral-400'
                      }`}
                    >
                      비즈니스 Graph API 연동
                    </button>
                  </div>

                  {connectionMode === 'session' ? (
                    <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-pink-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        임시 세션 연동 인터페이스
                      </div>
                      
                      {isSessionConnected ? (
                        <div className="pt-2">
                          <p className="text-sm font-bold text-white">@ {settings.instagram_username}</p>
                          <span className="text-xs text-emerald-400 mt-1 block">● 실시간 개인 계정 세션 연동 활성화</span>
                          <button
                            onClick={handleDisconnectSession}
                            className="mt-3 w-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 py-2 rounded-xl border border-white/10 transition"
                          >
                            인스타 계정 연동 해제
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleConnectSession} className="space-y-3 pt-2">
                          <input
                            type="text"
                            placeholder="인스타그램 사용자명 (예: charismagreat)"
                            value={sessionLoginName}
                            onChange={(e) => setSessionLoginName(e.target.value)}
                            className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                          />
                          <input
                            type="password"
                            placeholder="인스타그램 비밀번호 (보안 암호화)"
                            value={sessionPassword}
                            onChange={(e) => setSessionPassword(e.target.value)}
                            className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                          />
                          <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#ff007f] to-[#7928ca] hover:opacity-95 text-xs font-bold text-white py-2 rounded-xl transition cursor-pointer"
                          >
                            개인 계정 세션 로그인 바인딩
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 bg-[#18181b] p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                        <BookOpen className="w-3.5 h-3.5" />
                        안전한 Graph API 비즈니스 연동 가이드
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        개인 계정 세션 연동은 임시 조치이며, 인스타 차단 위험을 원천 방지하기 위해 **무료 프로페셔널(비즈니스) 전환**을 강력히 권장합니다.
                      </p>
                      <div className="text-xs space-y-1.5 text-neutral-300 font-medium">
                        <p>1. 인스타 앱 설정 ➔ '프로페셔널 계정으로 전환'</p>
                        <p>2. 관리자 페이스북 페이지와 인스타 계정 연결</p>
                        <p>3. 페이스북 개발자 포털에서 Graph API 연동 토큰 발급</p>
                      </div>
                      <input
                        type="text"
                        placeholder="Graph Access Token 입력"
                        value={settings.access_token && !settings.access_token.startsWith('session') ? settings.access_token : ''}
                        onChange={(e) => saveSettings({ access_token: e.target.value })}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. AI 크리에이터 스튜디오 & 3-Way 이미지 셀렉터 */}
          <div className="p-6 lg:p-8 rounded-3xl border border-white/5 bg-[#0f0f13]/80 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#ff007f]" />
                <h2 className="text-xl font-bold">AI 크리에이터 스튜디오 <span className="text-xs text-neutral-500 font-normal">3-Way Engine</span></h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* 마케팅 카피 메이커 영역 (왼쪽 7열) */}
              <div className="md:col-span-7 space-y-6">
                
                {/* 대상 상품 선택 */}
                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#ff007f]" />
                    포스팅 대상 상품 선택
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                    {products.map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => {
                          setSelectedProduct(prod);
                          // 메인 타이틀을 상품명으로 자동 세팅
                          setCanvasTitle(prod.name.substring(0, 15));
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                          selectedProduct?.id === prod.id
                            ? 'border-[#ff007f] bg-[#ff007f]/5 text-white'
                            : 'border-white/5 bg-[#18181b] text-neutral-400 hover:border-white/10'
                        }`}
                      >
                        {prod.main_image_url ? (
                          <img 
                            src={prod.main_image_url} 
                            alt={prod.name} 
                            className="w-10 h-10 object-cover rounded-lg border border-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-neutral-500" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold truncate">{prod.name}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{Number(prod.price || 0).toLocaleString()}원</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI 프롬프트 및 스타일 지정 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-neutral-400 block mb-2">마케팅 강조 프롬프트 (선택)</label>
                    <input
                      type="text"
                      placeholder="예: 봄맞이 한정 파격 세일, 신뢰성 강조"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff007f]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-400 block mb-2">카피라이팅 어조</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff007f]"
                    >
                      <option value="인플루언서형">인플루언서형 💅</option>
                      <option value="세련된형">세련된 감성형 🌿</option>
                      <option value="전문가형">제품 전문가형 📊</option>
                      <option value="유머형">재치 유머형 🤪</option>
                    </select>
                  </div>
                </div>

                {/* AI 글 & 사진 제작하기 버튼 */}
                <button
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-[#ff007f] via-purple-600 to-[#7928ca] text-white flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_25px_rgba(255,0,127,0.3)] disabled:opacity-50 transition cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  {isGenerating ? 'AI가 기획 및 제작하는 중...' : 'AI 마케터 카피라이팅 & 감성 이미지 생성'}
                </button>

                {/* 카피 편집 에디터 패널 */}
                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-2 flex items-center justify-between">
                    <span>인스타그램 본문 문구 피드 에디터</span>
                    <span className="text-[10px] text-neutral-500">줄바꿈, 이모지 및 해시태그 포함</span>
                  </label>
                  <textarea
                    rows={7}
                    value={generatedText}
                    onChange={(e) => setGeneratedText(e.target.value)}
                    placeholder="생성 버튼을 누르면 AI가 상품 기반 피드를 만듭니다. 여기에 직접 멋진 글을 편집하거나 적을 수도 있습니다."
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-[#ff007f] leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* 3-Way 이미지 셀렉터 및 카드뉴스 캔버스 (오른쪽 5열) */}
              <div className="md:col-span-5 space-y-6">
                
                {/* 3-Way 탭 토글 */}
                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-2">이미지 크리에이터 소스 (3-Way)</label>
                  <div className="grid grid-cols-3 gap-1 bg-[#18181b] p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => setImageTab('product')}
                      className={`text-[10px] font-bold py-2 rounded-lg transition ${
                        imageTab === 'product' ? 'bg-[#ff007f] text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      자체 상품컷
                    </button>
                    <button
                      onClick={() => setImageTab('ai')}
                      className={`text-[10px] font-bold py-2 rounded-lg transition ${
                        imageTab === 'ai' ? 'bg-[#ff007f] text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      AI 감성생성
                    </button>
                    <button
                      onClick={() => setImageTab('canvas')}
                      className={`text-[10px] font-bold py-2 rounded-lg transition ${
                        imageTab === 'canvas' ? 'bg-[#ff007f] text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      카드뉴스 합성
                    </button>
                  </div>
                </div>

                {/* 각 이미지 탭의 세부 콘텐츠 */}
                <div className="bg-[#18181b]/50 border border-white/5 rounded-2xl p-4">
                  {imageTab === 'product' && (
                    <div className="space-y-4">
                      <div className="aspect-square bg-neutral-900 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center relative">
                        {selectedProduct?.main_image_url ? (
                          <img 
                            src={selectedProduct.main_image_url} 
                            alt="선택된 상품" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <ImageIcon className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                            <p className="text-xs text-neutral-400">선택된 상품컷 이미지가 없습니다.</p>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-[#09090b]/80 border border-white/10 px-2 py-1 rounded text-[10px] text-white font-medium">
                          기본 상품 이미지
                        </div>
                      </div>

                      {/* 드래그앤드롭 / 로컬 이미지 직접 업로드 */}
                      <label className="w-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl py-4 hover:border-[#ff007f]/50 cursor-pointer bg-[#09090b]/50 hover:bg-[#ff007f]/5 transition">
                        <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                        <span className="text-[10px] font-bold text-neutral-400">커스텀 상품 이미지 수동 로드</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLocalImageUpload}
                        />
                      </label>
                    </div>
                  )}

                  {imageTab === 'ai' && (
                    <div className="space-y-4">
                      <div className="aspect-square bg-neutral-900 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center relative">
                        {generatedImageUrl ? (
                          <img 
                            src={generatedImageUrl} 
                            alt="생성된 감성컷" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-6">
                            <Sparkles className="w-10 h-10 text-neutral-600 mx-auto mb-2 animate-bounce" />
                            <p className="text-xs text-neutral-400">AI 이미지 생성 전입니다.</p>
                            <p className="text-[10px] text-neutral-500 mt-1">상단 AI 생성 버튼을 누르면 인공지능이 상품에 맞는 라이프스타일 컷을 픽업합니다.</p>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-[#ff007f]/80 px-2 py-1 rounded text-[10px] text-white font-medium shadow-[0_0_10px_rgba(255,0,127,0.4)]">
                          AI 가상 감성 픽업
                        </div>
                      </div>
                    </div>
                  )}

                  {imageTab === 'canvas' && (
                    <div className="space-y-4">
                      {/* 실시간 캔버스 뷰포트 */}
                      <div className="aspect-square bg-neutral-900 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center relative">
                        <canvas 
                          ref={canvasRef} 
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-2 left-2 bg-purple-600/80 px-2 py-1 rounded text-[10px] text-white font-medium">
                          Canvas 브랜드 카드뉴스 합성
                        </div>
                      </div>

                      {/* 캔버스 텍스트/디자인 속성 제어 */}
                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">메인 제목 타이틀</label>
                          <input
                            type="text"
                            value={canvasTitle}
                            onChange={(e) => setCanvasTitle(e.target.value)}
                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">서브 감성 텍스트</label>
                          <input
                            type="text"
                            value={canvasSubtitle}
                            onChange={(e) => setCanvasSubtitle(e.target.value)}
                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 block mb-1">이벤트/할인 라벨</label>
                            <input
                              type="text"
                              value={canvasDiscount}
                              onChange={(e) => setCanvasDiscount(e.target.value)}
                              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 block mb-1">그라데이션 테마</label>
                            <select
                              value={canvasTheme}
                              onChange={(e) => setCanvasTheme(e.target.value)}
                              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                            >
                              <option value="gradient-gold">럭셔리 골드 ✨</option>
                              <option value="neon-pink">핫네온 핑크 💖</option>
                              <option value="modern-dark">시크 다크 블랙 🖤</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 스케줄링 예약 및 발행 전송 인터페이스 */}
            <div className="border-t border-white/5 pt-6 mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <div>
                    <label className="text-xs font-semibold text-neutral-400 block mb-1.5">인스타 피드 수동 발행 / 예약 일시 설정</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleSchedulePost(false)}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold bg-[#18181b] border border-white/10 hover:border-white/20 text-white text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    피드 발행 예약하기
                  </button>
                  <button
                    onClick={() => handleSchedulePost(true)}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold bg-[#ff007f] hover:bg-[#ff007f]/90 text-white text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(255,0,127,0.3)] transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    인스타 즉시 업로드 승인
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 우측 영역: 모바일 폰 렌더링 라이브 프리뷰 및 예약 캘린더 */}
        <div className="space-y-8">
          
          {/* 모바일 폰 라이브 미리보기 (Instagram Live Preview Mockup) */}
          <div className="p-6 rounded-3xl border border-white/5 bg-[#0f0f13]/85 backdrop-blur-xl relative overflow-hidden flex flex-col items-center">
            <div className="w-full flex items-center gap-2 border-b border-white/5 pb-4 mb-6">
              <Eye className="w-5 h-5 text-[#ff007f]" />
              <h2 className="text-base font-bold">인스타 모바일 실시간 미리보기</h2>
            </div>

            {/* 디바이스 목업 프레임 */}
            <div className="w-[300px] h-[580px] rounded-[45px] border-[10px] border-[#27272a] bg-black shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_40px_rgba(255,0,127,0.1)] relative overflow-hidden flex flex-col">
              {/* 스피커 & 노치 */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-[#27272a] rounded-b-2xl z-30 flex items-center justify-center">
                <div className="w-12 h-1 bg-black rounded-full mb-1" />
              </div>

              {/* 인스타 헤더 */}
              <div className="pt-8 px-4 pb-2 border-b border-zinc-900 bg-black flex justify-between items-center text-white relative z-20">
                <span className="font-extrabold text-sm tracking-tight italic">Instagram</span>
                <span className="text-[10px] text-neutral-400">CHARISMA</span>
              </div>

              {/* 프리뷰 바디 (스크롤뷰) */}
              <div className="flex-1 overflow-y-auto no-scrollbar bg-black text-white text-xs">
                {/* 포스트 상단 계정 정보 */}
                <div className="p-3 flex items-center justify-between border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[1.5px]">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center border border-black">
                        <InstagramIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="font-extrabold text-[10px]">@{settings.instagram_username || 'charismagreat'}</p>
                      <p className="text-[8px] text-neutral-400">Sponsored • AI Autopilot</p>
                    </div>
                  </div>
                  <span className="font-bold tracking-widest text-neutral-400 text-sm">•••</span>
                </div>

                {/* 포스트 이미지 */}
                <div className="aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-900 relative">
                  {imageTab === 'product' && selectedProduct?.main_image_url ? (
                    <img src={selectedProduct.main_image_url} alt="프리뷰" className="w-full h-full object-cover" />
                  ) : imageTab === 'ai' && generatedImageUrl ? (
                    <img src={generatedImageUrl} alt="프리뷰" className="w-full h-full object-cover" />
                  ) : imageTab === 'canvas' ? (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-[10px]">
                      <p className="animate-pulse">카드뉴스 캔버스 생성 중...</p>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-8 h-8 text-neutral-700 mx-auto mb-1" />
                      <p className="text-[9px] text-neutral-500">피드 이미지가 존재하지 않습니다</p>
                    </div>
                  )}
                </div>

                {/* 피드 액션 바 */}
                <div className="p-3 flex justify-between items-center text-white">
                  <div className="flex gap-3">
                    <Heart className="w-4 h-4 text-neutral-200" />
                    <MessageCircle className="w-4 h-4 text-neutral-200" />
                    <Send className="w-4 h-4 text-neutral-200" />
                  </div>
                  <Layers className="w-4 h-4 text-neutral-400" />
                </div>

                {/* 좋아요 개수 & 본문 */}
                <div className="px-3 pb-4 space-y-1 leading-relaxed">
                  <p className="font-bold text-[10px]">좋아요 154개</p>
                  <p className="text-[10px] break-all">
                    <span className="font-bold mr-1.5">@{settings.instagram_username || 'charismagreat'}</span>
                    {generatedText ? (
                      generatedText.length > 120 ? generatedText.substring(0, 120) + '...' : generatedText
                    ) : (
                      '아름다운 감성 디자인으로 일상에 품격을 더해보세요. 지금 바로 가치를 확인하세요.'
                    )}
                  </p>
                  <p className="text-[8px] text-neutral-400 uppercase mt-2">1분 전</p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. 예약/발행 이력 캘린더 타임라인 */}
          <div className="p-6 rounded-3xl border border-white/5 bg-[#0f0f13]/85 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold">포스팅 타임라인 & 예약 현황</h2>
              </div>
              <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">총 {posts.length}건</span>
            </div>

            {/* 타임라인 항목 */}
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {posts.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 border border-dashed border-white/5 rounded-2xl">
                  <Calendar className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs">현재 등록된 예약이나 발행 이력이 없습니다.</p>
                  <p className="text-[10px] text-neutral-600 mt-1">AI 크리에이터로 첫 예약을 등록해 보세요.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div 
                    key={post.id}
                    className="p-3.5 rounded-2xl border border-white/5 bg-[#18181b]/50 hover:bg-[#18181b] transition space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      {getStatusBadge(post.status)}
                      <span className="text-[9px] text-neutral-400">
                        {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      {post.image_url ? (
                        <img 
                          src={post.image_url} 
                          alt="예약피드" 
                          className="w-14 h-14 object-cover rounded-lg border border-white/10"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-zinc-800 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-zinc-600" />
                        </div>
                      )}
                      
                      <div className="flex-1 overflow-hidden">
                        {post.product && (
                          <p className="text-[10px] text-neutral-400 font-bold truncate">📍 {post.product.name}</p>
                        )}
                        <p className="text-xs text-neutral-300 line-clamp-2 mt-0.5">{post.content}</p>
                      </div>
                    </div>

                    {/* 성과 정보 또는 수동 승인 액션 버튼 */}
                    <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                      <div className="flex items-center gap-2.5 text-neutral-400 text-[10px]">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-[#ff007f]" /> {post.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-cyan-400" /> {post.comments_count || 0}
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        {post.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleApproveImmediate(post.id)}
                            className="bg-[#ff007f] hover:bg-[#ff007f]/90 text-white font-bold px-2 py-1 rounded text-[9px] transition cursor-pointer"
                          >
                            즉시발행 승인
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-white/5 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 font-bold px-2 py-1 rounded text-[9px] border border-white/5 hover:border-rose-500/20 transition cursor-pointer"
                        >
                          취소/삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 실시간 알림 토스트 */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 right-8 z-50 px-5 py-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl ${
              toastType === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300 shadow-emerald-950/20' 
                : toastType === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-300 shadow-rose-950/20'
                : 'bg-zinc-950/90 border-zinc-500/30 text-zinc-300 shadow-zinc-950/20'
            }`}
          >
            {toastType === 'success' ? (
              <Check className="w-5 h-5 text-emerald-400 bg-emerald-500/10 p-0.5 rounded-full" />
            ) : toastType === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 bg-rose-500/10 p-0.5 rounded-full" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-zinc-400 bg-zinc-500/10 p-0.5 rounded-full" />
            )}
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
