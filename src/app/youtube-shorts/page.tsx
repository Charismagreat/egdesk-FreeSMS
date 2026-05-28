'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Settings, Calendar, Play, Pause, Download, Upload, Clock, 
  TrendingUp, Layers, Link2, FileText, Check, CheckCircle, RefreshCw, 
  AlertCircle, Trash2, Eye, Share2, FileDown, Music, Heart, MessageSquare, 
  Smile, Plus, Info, Volume2, ShieldAlert, Search, ChevronLeft, ChevronsLeft,
  ChevronRight, ChevronsRight
} from 'lucide-react';

// 커스텀 유튜브 아이콘 SVG 컴포넌트
function YoutubeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.51a3.003 3.003 0 0 0-2.11 2.108C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.871.51 9.387.51 9.387.51s7.517 0 9.387-.51a3.003 3.003 0 0 0 2.11-2.108C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

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

// 샘플 블로그 글 데이터 정의
const SAMPLE_BLOG_POSTS = [
  {
    url: "https://blog.naver.com/charismagreat/223456789",
    title: "[공식 출시] 초경량 무선 청소기 '에어제트 X10' 솔직 사용 후기",
    content: "안녕하세요! 오늘은 드디어 고대하던 초경량 무선 청소기 에어제트 X10 언박싱 및 실사용 후기를 가져왔습니다. 무게가 무려 890g밖에 되지 않아 손목 부담이 전혀 없어요. 게다가 흡입력은 25000Pa로 미세먼지까지 완벽 흡입! 배터리 수명도 최대 50분이라 온 집안 청소에 끄떡없습니다. 브러시 헤드가 180도 회전해서 소파 밑 구석진 곳도 아주 부드럽게 잘 들어갑니다. 디자인도 감각적인 파스텔 톤이라 인테리어 오브제로도 손색없네요. 강력 추천합니다!"
  },
  {
    url: "https://blog.naver.com/charismagreat/223987654",
    title: "직장인 필수템, 스마트 온도조절 텀블러 '써모글로우' 3주 써본 소감",
    content: "커피가 식는 걸 제일 싫어하는 직장인 1인으로서 혁명적인 텀블러를 만났습니다. 바로 스마트 터치 디스플레이가 장착된 써모글로우 텀블러인데요. 손가락 터치 한 번으로 음료 온도를 45도에서 80도까지 1도 단위로 정밀 설정할 수 있습니다! 내부는 프리미엄 SUS316 의료용 스테인리스 재질이라 위생적이고 세척도 초간편. 한 번 충전으로 온종일 따뜻함을 유지해 줍니다. 이제 사무실에서 차갑게 식은 아메리카노 마실 일은 없을 것 같아요."
  }
];

// 쇼츠 자막 및 타임라인 싱크 인터페이스
interface ScriptLine {
  time: string; // 00:01
  seconds: number; // 재생 초 (비교용)
  text: string; // 자막 텍스트
  audioStatus: string; // 오디오 멘트 효과
}

// 쇼츠 히스토리 아이템 인터페이스
interface ShortsHistory {
  id: string;
  title: string;
  sourceType: 'text' | 'blog';
  outputType: 'A' | 'B';
  status: 'COMPLETED' | 'PROCESSING' | 'SCHEDULED' | 'FAILED';
  views: number;
  likes: number;
  comments: number;
  scheduledAt: string;
  thumbnail: string;
}

export default function YoutubeShortsAiLab() {
  // --- 상태 관리 ---
  const [activeInputTab, setActiveInputTab] = useState<'text' | 'blog'>('text');
  const [activeOutputTab, setActiveOutputTab] = useState<'A' | 'B'>('A');
  
  // 입력 폼 상태
  const [productName, setProductName] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [blogUrl, setBlogUrl] = useState('');
  const [selectedBlogSample, setSelectedBlogSample] = useState<number | null>(null);
  
  // 생성 옵션 설정
  const [videoTone, setVideoTone] = useState<'humor' | 'review' | 'story' | 'information'>('review');
  const [targetAge, setTargetAge] = useState<'all' | '2030' | '4050'>('2030');
  
  // AI 생성 결과 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [shortsTitle, setShortsTitle] = useState('');
  const [generatedScript, setGeneratedScript] = useState<ScriptLine[]>([]);
  const [bgMusic, setBgMusic] = useState('신나는 비트 테크노 Hiphop');
  const [bgVisualTheme, setBgVisualTheme] = useState('미니멀리즘 테크 디자인');

  // 유튜브 API 연동 설정 상태
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);
  const [youtubeChannelName, setYoutubeChannelName] = useState('EGDESK AI LAB 공식 채널');
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [apiClientId, setApiClientId] = useState('');
  const [apiClientSecret, setApiClientSecret] = useState('');

  // 시뮬레이터 실시간 재생 관련 상태
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 예약 날짜/시간
  const [scheduleDate, setScheduleDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [scheduleTime, setScheduleTime] = useState('18:00');

  // 토스트 메시지
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 쇼츠 예약 발행 히스토리 검색 및 페이지네이션 상태
  const [shortsSearchQuery, setShortsSearchQuery] = useState('');
  const [shortsCurrentPage, setShortsCurrentPage] = useState(1);
  const [shortsItemsPerPage, setShortsItemsPerPage] = useState(10);

  // 검색어 변경 시 페이지 번호 초기화
  useEffect(() => {
    setShortsCurrentPage(1);
  }, [shortsSearchQuery]);

  // 쇼츠 생성 이력 샘플 데이터
  const [shortsHistoryList, setShortsHistoryList] = useState<ShortsHistory[]>([
    {
      id: "SH-001",
      title: "에어제트 X10: 손가락으로 드는 청소기가 있다?! 😲",
      sourceType: "blog",
      outputType: "B",
      status: "COMPLETED",
      views: 12450,
      likes: 852,
      comments: 48,
      scheduledAt: "2026-05-20 18:30 (완료)",
      thumbnail: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&auto=format&fit=crop&q=60"
    },
    {
      id: "SH-002",
      title: "사무실 인싸 등극하는 스마트 텀블러 실물 영접 ☕",
      sourceType: "text",
      outputType: "A",
      status: "SCHEDULED",
      views: 0,
      likes: 0,
      comments: 0,
      scheduledAt: "2026-05-22 14:00 (예약)",
      thumbnail: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=60"
    },
    {
      id: "SH-003",
      title: "10초만에 끝내는 여름 휴가철 초경량 텐트 고르기 🏕️",
      sourceType: "text",
      outputType: "B",
      status: "COMPLETED",
      views: 8960,
      likes: 423,
      comments: 29,
      scheduledAt: "2026-05-19 12:00 (완료)",
      thumbnail: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&auto=format&fit=crop&q=60"
    }
  ]);

  // 쇼츠 히스토리 실시간 필터링
  const filteredShorts = shortsHistoryList.filter(item => {
    const query = shortsSearchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const titleMatch = item.title?.toLowerCase().includes(query) || false;
    const idMatch = item.id?.toLowerCase().includes(query) || false;
    const sourceTypeMatch = item.sourceType?.toLowerCase().includes(query) || false;
    
    return titleMatch || idMatch || sourceTypeMatch;
  });

  // 쇼츠 히스토리 페이지네이션 슬라이싱
  const totalPages = Math.ceil(filteredShorts.length / shortsItemsPerPage);
  const startIndex = (shortsCurrentPage - 1) * shortsItemsPerPage;
  const endIndex = startIndex + shortsItemsPerPage;
  const paginatedShorts = filteredShorts.slice(startIndex, endIndex);

  // --- 토스트 노출 유틸 ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // --- 샘플 블로그 포스트 로드 ---
  const handleSelectBlogSample = (index: number) => {
    setSelectedBlogSample(index);
    setBlogUrl(SAMPLE_BLOG_POSTS[index].url);
    showToast(`샘플 블로그 포스트가 연동되었습니다: "${SAMPLE_BLOG_POSTS[index].title.substring(0, 15)}..."`, "info");
  };

  // --- 블로그 주소 임의 변경 시 샘플 해제 ---
  useEffect(() => {
    if (selectedBlogSample !== null && blogUrl !== SAMPLE_BLOG_POSTS[selectedBlogSample].url) {
      setSelectedBlogSample(null);
    }
  }, [blogUrl]);

  // --- AI 쇼츠 자동 생성 ---
  const handleGenerateShorts = () => {
    if (activeInputTab === 'text' && (!productName || !productDetails)) {
      showToast("상품명과 상품 상세 정보를 입력해 주세요.", "error");
      return;
    }
    if (activeInputTab === 'blog' && !blogUrl) {
      showToast("연동할 네이버 블로그 URL을 입력하거나 샘플을 선택해 주세요.", "error");
      return;
    }

    setIsGenerating(true);
    setIsGenerated(false);
    setIsPlaying(false);
    setCurrentLineIndex(0);
    setPlaybackTime(0);

    // AI 생성 중 시뮬레이션 지연 (1.8초)
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
      
      let baseTitle = "";
      let scriptLines: ScriptLine[] = [];

      if (activeInputTab === 'text') {
        baseTitle = productName ? `[단독공개] 대박예감 ${productName} 솔직 리뷰 😱` : "[화제] SNS 대란템 직접 써보고 기절초풍한 후기!";
        scriptLines = [
          { time: "00:00", seconds: 0, text: "요즘 SNS에서 난리 난 이 아이템, 알고 계셨나요? 🔥", audioStatus: "[신나고 명쾌한 목소리]" },
          { time: "00:03", seconds: 3, text: `바로 혁신적인 성능을 자랑하는 '${productName}' 입니다! ✨`, audioStatus: "[임팩트 있는 보이스]" },
          { time: "00:06", seconds: 6, text: `직접 사용해 보니 ${productDetails.substring(0, 30)}... 라는 점이 정말 놀라웠어요! 👍`, audioStatus: "[진솔하고 감탄하는 톤]" },
          { time: "00:10", seconds: 10, text: "특히 이 가격에 이런 고급스러운 퀄리티라니 믿기지 않습니다. 💸", audioStatus: "[강조하는 리드미컬 톤]" },
          { time: "00:13", seconds: 13, text: "지금 구매하면 평생 무료 혜택까지 진행 중이라고 하네요! 🚀", audioStatus: "[소개팅처럼 속삭이듯]" },
          { time: "00:16", seconds: 16, text: "더 자세한 정보와 특별 구매 혜택은 프로필 링크를 확인하세요! ❤️", audioStatus: "[친절하고 경쾌하게 마무리]" },
        ];
      } else {
        // 블로그 연동 모드
        const post = selectedBlogSample !== null ? SAMPLE_BLOG_POSTS[selectedBlogSample] : { title: "네이버 블로그 화제글", content: "최고의 성능을 자랑하는 추천 솔루션 후기입니다." };
        baseTitle = `[1분요약] 블로그 대란 글! "${post.title.replace(/\[.*\]\s*/g, '')}" 요점만 콕 짚어줌!`;
        scriptLines = [
          { time: "00:00", seconds: 0, text: "네이버 블로그 실시간 1위 화제의 글, 핵심만 30초 요약! 📢", audioStatus: "[아나운서 톤으로 시선집중]" },
          { time: "00:03", seconds: 3, text: `주제는 바로: ${post.title.substring(0, 30)}... 🌟`, audioStatus: "[기대에 찬 밝은 톤]" },
          { time: "00:06", seconds: 6, text: `이 글의 본문 핵심은 "${post.content.substring(0, 45)}..." 입니다! 💡`, audioStatus: "[중요 포인트 설명 톤]" },
          { time: "00:10", seconds: 10, text: "수많은 리얼 후기가 증명하는 바로 이 역대급 솔루션, 팩트 체크 완료! ✔️", audioStatus: "[신뢰감이 차오르는 목소리]" },
          { time: "00:13", seconds: 13, text: "블로그 이웃 한정으로 극비 프로모션까지 공유 중이랍니다. 🤫", audioStatus: "[속닥거리는 서스펜스 효과음]" },
          { time: "00:16", seconds: 16, text: "지금 바로 아래 하단 관련 링크를 통해 전체 본문을 확인해 보세요! 🔗", audioStatus: "[부드러운 미소 톤]" }
        ];
      }

      setShortsTitle(baseTitle);
      setGeneratedScript(scriptLines);
      showToast("AI가 기가 막힌 1분 숏폼 최적화 스크립트 및 큐시트를 자동 생성 완료했습니다!", "success");
    }, 1800);
  };

  // --- 시뮬레이터 재생/일시정지 기능 ---
  const handlePlayToggle = () => {
    if (!isGenerated) {
      showToast("먼저 AI 스크립트를 생성해 주세요.", "info");
      return;
    }
    
    if (isPlaying) {
      // 일시정지
      setIsPlaying(false);
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    } else {
      // 재생 시작
      setIsPlaying(true);
      
      // 타이머 시작 (1초 단위로 재생 시간 흘러감)
      playTimerRef.current = setInterval(() => {
        setPlaybackTime((prev) => {
          const nextTime = prev >= 18 ? 0 : prev + 1; // 18초 루프
          
          // 현재 재생 시간(초)에 부합하는 자막 인덱스 찾기
          const matchedIndex = generatedScript.findIndex((line, idx) => {
            const currentSec = line.seconds;
            const nextSec = generatedScript[idx + 1] ? generatedScript[idx + 1].seconds : 999;
            return nextTime >= currentSec && nextTime < nextSec;
          });
          
          if (matchedIndex !== -1) {
            setCurrentLineIndex(matchedIndex);
          }
          
          return nextTime;
        });
      }, 1000);
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  // --- 유튜브 채널 공식 API 세팅 토글 ---
  const handleConnectYoutube = () => {
    if (!apiClientId || !apiClientSecret) {
      showToast("OAuth 2.0 Client ID와 Client Secret을 모두 입력해 주세요.", "error");
      return;
    }
    setIsYoutubeConnected(true);
    setIsConnectionModalOpen(false);
    showToast(`유튜브 계정이 성공적으로 연동되었습니다! 채널: ${youtubeChannelName}`, "success");
  };

  const handleDisconnectYoutube = () => {
    setIsYoutubeConnected(false);
    setApiClientId('');
    setApiClientSecret('');
    showToast("유튜브 채널 연동이 해제되었습니다.", "info");
  };

  // --- 발행 및 예약 저장 (A안 / B안 통합 처리) ---
  const handlePublishShorts = () => {
    if (!isGenerated) {
      showToast("먼저 AI 쇼츠를 생성해야 발행이 가능합니다.", "error");
      return;
    }

    if (activeOutputTab === 'B' && !isYoutubeConnected) {
      showToast("유튜브 채널 공식 API가 연동되어 있지 않습니다. 가상 샌드박스 연동 또는 계정 연동 후 이용해 주세요.", "error");
      return;
    }

    // 새로운 히스토리 아이템 추가
    const newShorts: ShortsHistory = {
      id: `SH-${Math.floor(100 + Math.random() * 900)}`,
      title: shortsTitle,
      sourceType: activeInputTab,
      outputType: activeOutputTab,
      status: activeOutputTab === 'A' ? 'COMPLETED' : 'SCHEDULED',
      views: 0,
      likes: 0,
      comments: 0,
      scheduledAt: `${scheduleDate} ${scheduleTime} (${activeOutputTab === 'A' ? '즉시 다운로드 완료' : '자동 업로드 예정'})`,
      thumbnail: activeInputTab === 'text' 
        ? "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&auto=format&fit=crop&q=60"
        : "https://images.unsplash.com/photo-1542435503-956c469947f6?w=200&auto=format&fit=crop&q=60"
    };

    setShortsHistoryList([newShorts, ...shortsHistoryList]);

    if (activeOutputTab === 'A') {
      showToast("🎉 대본 + 자막 싱크(SRT) + 고품질 AI 오디오(MP3) 압축 패키지가 브라우저 다운로드 큐에 추가되었습니다!", "success");
    } else {
      showToast(`🚀 [B안 오토파일럿] 지정된 예약 시간(${scheduleDate} ${scheduleTime})에 맞춰 렌더링 후 자동 업로드가 등록되었습니다!`, "success");
    }
  };

  // --- 히스토리 개별 항목 삭제 ---
  const handleDeleteHistory = (id: string) => {
    setShortsHistoryList(shortsHistoryList.filter(item => item.id !== id));
    showToast("해당 예약/발행 히스토리 항목을 삭제하였습니다.", "info");
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans relative overflow-hidden w-full min-w-0">
      {/* 백그라운드 레드 & 블랙 그라데이션 오로라 광채 효과 */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-100/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-200/45 blur-[150px] pointer-events-none" />

      {/* 알림 토스트 (framer-motion 애니메이션) */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl text-white font-medium ${
              toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
              toast.type === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600' :
              'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 대헤더 배너 영역 (인스타그램 스타일 & 레드/블랙 테마 슬림형 리뉴얼) --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-4">
            {/* 럭셔리 레드 그라디언트 엠블럼 */}
            <div className="p-3 bg-gradient-to-tr from-slate-950 via-slate-900 to-red-600 rounded-2xl shadow-[0_8px_30px_rgba(220,38,38,0.15)] animate-pulse shrink-0 self-start sm:self-auto">
              <YoutubeIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="bg-red-50 text-red-600 text-[10.5px] font-extrabold px-3 py-0.5 rounded-full border border-red-200/60 shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-red-500 animate-spin" style={{ animationDuration: "4s" }} /> YOUTUBE SHORTS ENGINE
                </span>
                <span className="text-slate-600 border border-slate-200/80 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100/80">v2.0 PRO</span>
                <span className="text-red-600 border border-red-200 bg-red-50/80 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">YouTube Shorts AI Lab</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-950 via-slate-900 to-red-600 bg-clip-text text-transparent">
                YOUTUBE 쇼츠 AI
              </h1>
            </div>
          </div>
          <p className="text-slate-500 mt-2.5 text-sm md:text-base font-medium">
            텍스트 한 줄 또는 블로그 글 주소로 AI 대본을 만들고, 목업 시뮬레이터와 자동 렌더링 예약 업로드까지 원스톱으로 지원합니다.
          </p>
        </div>

        {/* 연동 버튼 및 연동 상태 */}
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {isYoutubeConnected ? (
            <div className="flex items-center gap-3 bg-white border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-sm">
              <span className="flex items-center gap-1.5 text-red-600 text-sm font-bold">
                <Check className="w-4 h-4" />
                <span>공식 API 연동 완료</span>
              </span>
              <span className="h-4 w-px bg-slate-200" />
              <span className="text-sm text-slate-600 font-semibold">{youtubeChannelName}</span>
              <button 
                onClick={handleDisconnectYoutube}
                className="text-xs text-slate-400 hover:text-red-500 underline transition-all ml-1"
              >
                해제
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsConnectionModalOpen(true)}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all hover:border-slate-300"
            >
              <Settings className="w-4 h-4 text-red-500 animate-spin" style={{ animationDuration: '6s' }} />
              <span>유튜브 공식 API 연동</span>
            </button>
          )}
        </div>
      </div>

      {/* --- 메인 하이브리드 대시보드 그리드 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- LEFT: 제어판 및 폼 (7컬럼) --- */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. 입력 소스 채널 탭 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 flex gap-1.5">
            <button
              onClick={() => setActiveInputTab('text')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all ${
                activeInputTab === 'text'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4.5 h-4.5" />
              <span>📝 상품 정보 직접 입력</span>
            </button>
            <button
              onClick={() => setActiveInputTab('blog')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all ${
                activeInputTab === 'blog'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <NaverIcon className="w-4 h-4" />
              <span>🔗 블로그 포스트 연동 요약</span>
            </button>
          </div>

          {/* 2. 입력 폼 세션 */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
            
            {activeInputTab === 'text' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">상품 및 타겟 브랜드 명칭</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="예: 에어제트 초경량 청소기, 써모글로우 텀블러"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">핵심 강점 및 판매 포인트 명세</label>
                  <textarea
                    value={productDetails}
                    onChange={(e) => setProductDetails(e.target.value)}
                    rows={4}
                    placeholder="쇼츠 영상에 들어갈 장점, 기능, 혜택을 3줄 이상 적어주세요. AI가 리드미컬하고 재치있게 대본을 짜드립니다."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">네이버 블로그 포스트 URL 주소</label>
                    <span className="text-[11px] text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full">실시간 자동파싱 지원</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="url"
                        value={blogUrl}
                        onChange={(e) => setBlogUrl(e.target.value)}
                        placeholder="https://blog.naver.com/아이디/글번호"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 샘플 블로그 링크 빠른 선택 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-xs font-bold text-slate-500 mb-2.5">💡 빠른 테스트를 위한 샘플 블로그 포스트 선택</span>
                  <div className="flex flex-col gap-2">
                    {SAMPLE_BLOG_POSTS.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectBlogSample(idx)}
                        className={`text-left p-2.5 rounded-xl text-xs transition-all border ${
                          selectedBlogSample === idx
                            ? 'bg-white border-red-500 text-red-600 font-semibold shadow-sm'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="font-bold text-slate-700 block mb-0.5">{sample.title}</span>
                        <span className="text-slate-400 block truncate">{sample.content}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI 파라미터 세부 튜너 */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">비디오 톤앤매너</label>
                <select
                  value={videoTone}
                  onChange={(e: any) => setVideoTone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-medium text-sm text-slate-700"
                >
                  <option value="review">🤩 실사용 리얼 퀵리뷰</option>
                  <option value="humor">😂 유머 가미 병맛 후기</option>
                  <option value="story">📖 흥미진진한 스토리텔링</option>
                  <option value="information">💡 꿀팁 대방출 정보형</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">타겟 독자층 연령</label>
                <select
                  value={targetAge}
                  onChange={(e: any) => setTargetAge(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-medium text-sm text-slate-700"
                >
                  <option value="all">🌐 전연령 남녀노소</option>
                  <option value="2030">⚡ 트렌디한 2030 MZ</option>
                  <option value="4050">🔥 여유 넘치는 4050 엑스</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateShorts}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-base shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>AI 쇼츠 최적화 대본 생성 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>AI 1분 쇼츠 최적화 스크립트 생성</span>
                </>
              )}
            </button>
          </div>

          {/* 3. 제작 및 업로드 옵션 설정 탭 */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-red-500" />
                <span>아웃풋 채널 및 빌드 방식 결정</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                빌드된 쇼츠 대본을 가상으로 시뮬레이션 한 뒤, 파일로 다운로드 하거나 유튜브 채널로 완벽하게 자동 예약 발행할 수 있습니다.
              </p>
            </div>

            {/* A안 vs B안 탭 토글 */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl">
              <button
                onClick={() => setActiveOutputTab('A')}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeOutputTab === 'A'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-sm">💾 A안 리소스 다운로드</span>
                  <span className="text-[10px] opacity-75 font-normal">대본 + SRT자막 + MP3오디오 압축팩</span>
                </div>
              </button>
              <button
                onClick={() => setActiveOutputTab('B')}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeOutputTab === 'B'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-sm">🚀 B안 오토파일럿</span>
                  <span className="text-[10px] opacity-75 font-normal">AI MP4 완전 빌드 + 유튜브 자동업로드</span>
                </div>
              </button>
            </div>

            {/* 예약 설정 및 실행 패널 */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              
              {activeOutputTab === 'B' && !isYoutubeConnected && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-800 block">유튜브 API 미설정 상태</span>
                    <span className="text-[11px] text-amber-600 block leading-relaxed">
                      현재 유튜브 채널 연동을 완료하지 않으셨습니다. 상단 우측의 &apos;유튜브 공식 API 연동&apos;을 완료하시거나, 샌드박스 가상 계정 모드를 가동해 주셔야 자동 예약 업로드를 수행할 수 있습니다.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">예약 발행일자</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-slate-700 font-medium"
                      />
                    </div>
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">예약 발행시간</label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-slate-700 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePublishShorts}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {activeOutputTab === 'A' ? "대본 리소스 다운로드하기" : "자동 업로드 예약 등록하기"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT: 9:16 모바일 쇼츠 플레이어 프레임 (5컬럼) --- */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-6 w-full max-w-[340px] space-y-4">
            
            {/* 자막 번쩍임 제어 및 미디어 재생 표시 배너 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-3.5 h-3.5 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-slate-300'}`} />
                <span className="text-xs font-bold text-slate-700">쇼츠 자막 실시간 시뮬레이터</span>
              </div>
              {isGenerated && (
                <button
                  onClick={handlePlayToggle}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-all"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3 h-3 text-red-500" />
                      <span>일시정지</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                      <span>대본재생</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 9:16 스마트폰 프레임 (실버-화이트 베젤 디자인) */}
            <div className="relative w-full aspect-[9/18.5] bg-slate-950 rounded-[40px] p-3 shadow-2xl border-4 border-slate-200 overflow-hidden">
              {/* 스피커 & 카메라 노치 데코 */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-full z-30 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-800 rounded-full mb-1" />
                <div className="w-2.5 h-2.5 bg-blue-950 rounded-full ml-3 mb-1 border border-slate-900" />
              </div>

              {/* 디스플레이 화면 */}
              <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-slate-900 flex flex-col justify-between p-4 pt-10 pb-6">
                
                {/* 숏폼 배경 비주얼 플레이스홀더 (CSS 소프트 웨이브 그래디언트) */}
                <div className="absolute inset-0 z-0 bg-gradient-to-tr from-slate-900 via-rose-950 to-slate-950 flex items-center justify-center">
                  <div className="absolute w-64 h-64 bg-red-600/10 rounded-full filter blur-2xl animate-pulse" />
                  <div className="absolute -bottom-10 w-72 h-72 bg-rose-600/15 rounded-full filter blur-3xl" />
                  
                  {/* 가상 영상 촬영 테두리 */}
                  <div className="border border-white/5 w-[90%] h-[92%] rounded-2xl flex items-center justify-center">
                    {!isGenerated && (
                      <div className="text-center p-6 text-slate-500">
                        <YoutubeIcon className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                        <span className="text-xs block font-medium">대본을 생성하시면</span>
                        <span className="text-[11px] block mt-1 opacity-70">여기에 실시간 유튜브 자막과 숏폼 비주얼이 시뮬레이션 됩니다.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- 폰 화면 상단 헤더 --- */}
                <div className="relative z-10 flex justify-between items-center text-white/80">
                  <span className="text-[10px] font-bold tracking-widest bg-black/30 px-2 py-0.5 rounded-full">LIVE PREVIEW</span>
                  <div className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[9px] font-bold">AI Voice ON</span>
                  </div>
                </div>

                {/* --- 폰 화면 중앙: 자막 싱크 실시간 재생 모션 영역 --- */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
                  {isGenerated && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentLineIndex}
                        initial={{ scale: 0.8, opacity: 0, y: 10 }}
                        animate={{ scale: 1.1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 18 }}
                        className="space-y-4"
                      >
                        {/* 화려한 숏폼 전용 굵은 외곽선 자막 연출 */}
                        <div className="bg-yellow-400 text-black px-4 py-2 rounded-xl text-sm font-extrabold shadow-lg border border-black uppercase tracking-tight">
                          {generatedScript[currentLineIndex]?.text}
                        </div>
                        
                        <div className="inline-block bg-black/50 text-[10px] text-white/90 px-2.5 py-1 rounded-full font-light backdrop-blur-sm">
                          🎤 {generatedScript[currentLineIndex]?.audioStatus}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>

                {/* --- 폰 화면 하단 정보 영역 --- */}
                <div className="relative z-10 space-y-3">
                  {/* 쇼츠 메타정보 */}
                  {isGenerated && (
                    <div className="bg-black/40 p-3 rounded-2xl backdrop-blur-md border border-white/10 text-white space-y-1">
                      <span className="text-[11px] font-bold text-red-400 block truncate">🎥 {shortsTitle}</span>
                      <div className="flex justify-between items-center text-[9px] text-slate-300">
                        <span>🎵 {bgMusic}</span>
                        <span>🎨 {bgVisualTheme}</span>
                      </div>
                    </div>
                  )}

                  {/* 미디어 플레이 바 및 재생 시간 표시 */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] text-white/60">
                      <span>00:{playbackTime < 10 ? `0${playbackTime}` : playbackTime}</span>
                      <span>00:18 (총 길이)</span>
                    </div>
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-600 transition-all duration-1000 ease-linear"
                        style={{ width: `${(playbackTime / 18) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 유튜브 쇼츠 하단 제어 및 소셜 카운트 데코 */}
                  <div className="flex justify-between items-center pt-2 text-white/90">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center font-extrabold text-[10px]">
                        N
                      </div>
                      <span className="text-[10px] font-bold">N-BLOG LAB</span>
                    </div>
                    <div className="flex gap-3 text-[10px] opacity-80">
                      <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-red-500 fill-red-500" /> 1.2K</span>
                      <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3 text-white" /> 230</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 시뮬레이터 아래 설명문구 */}
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              * 상단의 대본재생 버튼을 누르면, 가상의 오디오 멘트 진행 및 자막 싱크 모션 연출이 즉시 작동합니다. (18초 가상 루프 진행)
            </p>

          </div>
        </div>

      </div>

      {/* --- 하단: 예약 및 발행 완료 쇼츠 타임라인 히스토리 리스트 --- */}
      <div className="mt-12 bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex flex-wrap items-center gap-2">
              <YoutubeIcon className="w-5 h-5 text-red-600" />
              <span>쇼츠 예약 발행 및 성과 모니터링 히스토리</span>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full ml-1">
                ⚙️ 시스템 데모용 가상 샘플 데이터
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              제작이 완료된 A안 리소스 다운로드 이력 및 B안 유튜브 자동 예약 업로드의 실시간 성과 통계 데이터입니다.{" "}
              <span className="text-red-500 font-medium">(※ 본 대시보드 리스트의 모든 데이터와 수치는 원활한 시뮬레이션 체험을 위한 가상의 데모용 샘플입니다.)</span>
            </p>
          </div>
          
          <div className="text-xs text-slate-400 font-medium self-end md:self-auto">
            총 <span className="text-red-500 font-bold">{filteredShorts.length}</span>개 비디오 관리 중
          </div>
        </div>

        {/* 실시간 필터 및 검색 컨트롤러 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-150/80 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="쇼츠 비디오 제목, ID, 혹은 생성 모드로 실시간 검색..."
              value={shortsSearchQuery}
              onChange={(e) => setShortsSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-white placeholder-slate-400 font-bold transition-all text-slate-800"
            />
            {shortsSearchQuery && (
              <button
                onClick={() => setShortsSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-[10px] font-black transition-all"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 히스토리 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4.5 px-4">비디오 정보</th>
                <th className="py-4.5 px-4">생성 모드 / 빌드 방식</th>
                <th className="py-4.5 px-4">발행 상태</th>
                <th className="py-4.5 px-4">예약 및 업로드 시간</th>
                <th className="py-4.5 px-4 text-center">성과 지표 (조회수 / 하트 / 댓글)</th>
                <th className="py-4.5 px-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedShorts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-405 font-bold">
                    검색 결과와 일치하는 쇼츠 예약 발행 내역이 없습니다. 🔍
                  </td>
                </tr>
              ) : (
                paginatedShorts.map((history) => (
                <tr key={history.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={history.thumbnail} 
                        alt="썸네일" 
                        className="w-16 aspect-[9/16] object-cover rounded-lg border border-slate-200 shadow-sm"
                      />
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-slate-800 line-clamp-1">{history.title}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">ID: {history.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full ${
                        history.sourceType === 'blog' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {history.sourceType === 'blog' ? <NaverIcon className="w-3 h-3" /> : '📝'}
                        <span>{history.sourceType === 'blog' ? '블로그 요약' : '상품명 입력'}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {history.outputType === 'A' ? '💾 A안 다운로드' : '🚀 B안 오토파일럿'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold ${
                      history.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                      history.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600 animate-pulse' :
                      history.status === 'SCHEDULED' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        history.status === 'COMPLETED' ? 'bg-emerald-500' :
                        history.status === 'PROCESSING' ? 'bg-blue-500' :
                        history.status === 'SCHEDULED' ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`} />
                      <span>
                        {history.status === 'COMPLETED' ? '발행완료' :
                         history.status === 'PROCESSING' ? '빌드 및 전송 중' :
                         history.status === 'SCHEDULED' ? '예약대기' :
                         '연동 실패'}
                      </span>
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs font-medium text-slate-500">
                    {history.scheduledAt}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-4 text-xs">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-800">{history.views.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-400">조회수</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-rose-500">{history.likes.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-400">좋아요</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-800">{history.comments}</span>
                        <span className="text-[9px] text-slate-400">댓글</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleDeleteHistory(history.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="내역에서 삭제"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 하단 컨트롤바 */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 rounded-2xl mt-4 text-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">페이지당 표시:</span>
            <select 
              value={shortsItemsPerPage} 
              onChange={e => {
                setShortsItemsPerPage(Number(e.target.value));
                setShortsCurrentPage(1);
              }} 
              className="border rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 focus:border-red-500"
            >
              <option value={10}>10개씩 보기</option>
              <option value={20}>20개씩 보기</option>
              <option value={50}>50개씩 보기</option>
              <option value={100}>100개씩 보기</option>
            </select>
            <span className="text-xs text-slate-400 font-semibold ml-2">
              {filteredShorts.length === 0 
                ? "전체 0개 표시" 
                : `전체 ${filteredShorts.length}개 중 ${startIndex + 1}-${Math.min(endIndex, filteredShorts.length)}개 표시`}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShortsCurrentPage(1)}
              disabled={shortsCurrentPage === 1 || totalPages <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-3xs cursor-pointer"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setShortsCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={shortsCurrentPage === 1 || totalPages <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-3xs cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            {totalPages <= 1 ? (
              <button 
                disabled 
                className="w-8 h-8 rounded-xl text-xs font-bold bg-red-600 border border-red-650 text-white font-extrabold shadow-sm disabled:opacity-50 cursor-not-allowed"
              >
                1
              </button>
            ) : (
              Array.from({ length: totalPages }, (_, idx) => idx + 1)
                .filter(p => p >= shortsCurrentPage - 2 && p <= shortsCurrentPage + 2)
                .map(p => (
                  <button 
                    key={p}
                    onClick={() => setShortsCurrentPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer ${
                      shortsCurrentPage === p 
                        ? 'bg-red-600 border border-red-650 text-white font-extrabold shadow-sm' 
                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                ))
            )}

            <button 
              onClick={() => setShortsCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={shortsCurrentPage === totalPages || totalPages <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-3xs cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setShortsCurrentPage(totalPages)}
              disabled={shortsCurrentPage === totalPages || totalPages <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-3xs cursor-pointer"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* --- MODAL: 유튜브 채널 공식 API 세팅창 --- */}
      <AnimatePresence>
        {isConnectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConnectionModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* 모달 본체 */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 z-10 m-4 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-red-600 font-extrabold text-lg">
                    <YoutubeIcon className="w-6 h-6" />
                    <span>EGDESK AI LAB 유튜브 연동 센터</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    유튜브 공식 API(OAuth 2.0)를 안전하게 연동하여 백엔드 비디오 자동 업로드 채널을 등록합니다.
                  </p>
                </div>
                <button
                  onClick={() => setIsConnectionModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-all"
                >
                  <Plus className="w-6 h-6 transform rotate-45" />
                </button>
              </div>

              {/* 연동 방법 4대 핵심 설명 */}
              <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-100 space-y-2 text-xs">
                <span className="block font-bold text-slate-800">💡 유튜브 공식 채널 연동 핵심 프로세스</span>
                <ul className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed font-light">
                  <li>구글 클라우드 콘솔(GCP)에서 새로운 프로젝트를 생성합니다.</li>
                  <li>YouTube Data API v3를 활성화한 뒤 OAuth 동의 화면을 설정합니다.</li>
                  <li>사용자 인증 정보에서 <span className="font-semibold text-red-500">OAuth 2.0 클라이언트 ID</span>를 생성합니다.</li>
                  <li>발급된 Client ID와 Secret Key를 아래에 안전하게 세팅해 주세요.</li>
                </ul>
              </div>

              {/* 입력 인풋 영역 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">유튜브 공식 채널 명칭</label>
                  <input
                    type="text"
                    value={youtubeChannelName}
                    onChange={(e) => setYoutubeChannelName(e.target.value)}
                    placeholder="예: EGDESK AI LAB 공식 채널"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">OAuth 2.0 Client ID</label>
                    <input
                      type="text"
                      value={apiClientId}
                      onChange={(e) => setApiClientId(e.target.value)}
                      placeholder="구글 클라우드 발급 ID 입력"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-xs transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">OAuth 2.0 Client Secret</label>
                    <input
                      type="password"
                      value={apiClientSecret}
                      onChange={(e) => setApiClientSecret(e.target.value)}
                      placeholder="구글 클라우드 발급 Secret 입력"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-xs transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 하단 제어 액션 */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsConnectionModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleConnectYoutube}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all shadow-md"
                >
                  안전하게 공식 채널 연동
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
