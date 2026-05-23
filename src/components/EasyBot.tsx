'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, X, Send, RotateCcw, Bot, Terminal, ShieldAlert, Maximize2, Minimize2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  sql?: string | null;
  sqlSuccess?: boolean | null;
  sqlError?: string | null;
}

// React 19 무의존성 안전 마크다운 렌더러 컴포넌트 (밝은 색 테마 버전 - 넉넉한 여백 설계)
function SafeMarkdown({ content }: { content: string }) {
  if (!content) return null;

  // 줄바꿈 기준으로 단락/요소 분석
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentTable: { headers: string[]; rows: string[][] } | null = null;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';

  const parseInlineStyles = (text: string, isUserMessage: boolean = false): React.ReactNode[] => {
    // 볼드(**text**), 인라인 백틱(`code`) 매칭 및 파싱
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    // 사용자 메시지(그라데이션 핑크 배경)일 때는 화이트 컬러 기반, 봇 메시지(회색 배경)일 때는 컬러풀한 디자인 적용
    const boldClass = isUserMessage ? "font-extrabold text-white underline decoration-pink-300 underline-offset-2" : "font-bold text-violet-750";
    const codeClass = isUserMessage 
      ? "px-2 py-0.5 rounded bg-white/20 text-white font-mono text-xs border border-white/30" 
      : "px-2 py-0.5 rounded bg-rose-50 text-rose-650 font-mono text-xs border border-rose-100";

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      const codeMatch = remaining.match(/`(.*?)`/);

      // 둘 다 매칭되지 않은 경우 남은 텍스트 추가하고 종료
      if (!boldMatch && !codeMatch) {
        parts.push(<span key={`txt-${keyIndex}`}>{remaining}</span>);
        break;
      }

      // 더 먼저 매칭된 스타일 찾기
      const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;
      const codeIndex = codeMatch ? remaining.indexOf(codeMatch[0]) : Infinity;

      if (boldIndex < codeIndex) {
        // 볼드가 더 앞에 있는 경우
        if (boldIndex > 0) {
          parts.push(<span key={`txt-${keyIndex}`}>{remaining.substring(0, boldIndex)}</span>);
          keyIndex++;
        }
        parts.push(<strong key={`bold-${keyIndex}`} className={boldClass}>{boldMatch![1]}</strong>);
        keyIndex++;
        remaining = remaining.substring(boldIndex + boldMatch![0].length);
      } else {
        // 인라인 코드가 더 앞에 있는 경우
        if (codeIndex > 0) {
          parts.push(<span key={`txt-${keyIndex}`}>{remaining.substring(0, codeIndex)}</span>);
          keyIndex++;
        }
        parts.push(
          <code key={`code-${keyIndex}`} className={codeClass}>
            {codeMatch![1]}
          </code>
        );
        keyIndex++;
        remaining = remaining.substring(codeIndex + codeMatch![0].length);
      }
    }

    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 1. 코드 블록 검사 (넉넉한 내부 패딩 부여)
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // 코드 블록 종료
        inCodeBlock = false;
        const codeText = codeBlockContent.join('\n');
        elements.push(
          <div key={`code-block-${i}`} className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 font-mono text-xs text-emerald-450 shadow-sm">
            <div className="flex items-center justify-between bg-slate-900/90 px-4 py-2.5 text-[10px] text-slate-400 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-350 font-semibold">
                <Terminal size={12} className="text-violet-400" />
                {codeBlockLang || 'code'}
              </span>
              <span className="text-slate-500 uppercase tracking-wider font-bold">SQLite Engine</span>
            </div>
            <pre className="p-4 overflow-x-auto leading-relaxed text-slate-250">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        codeBlockContent = [];
        codeBlockLang = '';
      } else {
        // 코드 블록 시작
        inCodeBlock = true;
        codeBlockLang = line.substring(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(lines[i]); // 공백 보존
      continue;
    }

    // 2. 표(Table) 검사 (셀 내부 패딩 시원하게 넓힘)
    if (line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // 구분선인 경우 (예: |---|---|)
      if (cells.every(c => c.startsWith('-'))) {
        continue;
      }

      if (!currentTable) {
        // 첫 번째 라인은 헤더로 취급
        currentTable = { headers: cells, rows: [] };
      } else {
        // 이후 라인은 데이터 로우로 취급
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      // 표 영역이 끝난 경우 렌더링 후 초기화
      if (currentTable) {
        const tableObj = currentTable;
        currentTable = null;
        elements.push(
          <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-xl border border-slate-150 shadow-sm bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150">
                  {tableObj.headers.map((h, idx) => (
                    <th key={`th-${idx}`} className="p-3 font-bold text-slate-700 tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableObj.rows.map((row, rIdx) => (
                  <tr key={`tr-${rIdx}`} className="border-b border-slate-100/80 hover:bg-slate-50/50 last:border-b-0">
                    {row.map((cell, cIdx) => (
                      <td key={`td-${cIdx}`} className="p-3 text-slate-650 font-normal leading-relaxed">
                        {parseInlineStyles(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    // 3. 비어있는 줄 처리
    if (line === '') {
      elements.push(<div key={`empty-${i}`} className="h-3" />);
      continue;
    }

    // 4. 리스트 아이템 처리 (* 또는 -)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const itemText = line.substring(2);
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-6 my-1.5 text-xs text-slate-650 leading-loose">
          <li>{parseInlineStyles(itemText)}</li>
        </ul>
      );
      continue;
    }

    // 5. 번호가 매겨진 리스트 (1. 2. 등)
    const numListMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numListMatch) {
      const num = numListMatch[1];
      const itemText = numListMatch[2];
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-6 my-1.5 text-xs text-slate-650 leading-loose" start={parseInt(num)}>
          <li>{parseInlineStyles(itemText)}</li>
        </ol>
      );
      continue;
    }

    // 6. 제목 처리 (#, ##, ###)
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-base font-bold text-slate-900 mt-5 mb-2.5 border-b border-slate-100 pb-2">
          {parseInlineStyles(line.substring(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-sm font-bold text-violet-750 mt-4 mb-2">
          {parseInlineStyles(line.substring(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-xs font-bold text-slate-800 mt-3 mb-1.5">
          {parseInlineStyles(line.substring(4))}
        </h3>
      );
      continue;
    }

    // 7. 일반 텍스트 라인
    elements.push(
      <p key={`p-${i}`} className="text-xs text-slate-650 leading-relaxed my-1.5">
        {parseInlineStyles(lines[i].trim())}
      </p>
    );
  }

  // 루프 종료 후 남은 표 렌더링
  if (currentTable) {
    const tableObj = currentTable;
    elements.push(
      <div key={`table-final`} className="my-4 overflow-x-auto rounded-xl border border-slate-150 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150">
              {tableObj.headers.map((h, idx) => (
                <th key={`th-${idx}`} className="p-3 font-bold text-slate-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableObj.rows.map((row, rIdx) => (
              <tr key={`tr-${rIdx}`} className="border-b border-slate-100 hover:bg-slate-50/50 last:border-b-0">
                {row.map((cell, cIdx) => (
                  <td key={`td-${cIdx}`} className="p-3 text-slate-650 leading-relaxed">
                    {parseInlineStyles(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="space-y-1.5">{elements}</div>;
}

// 사용자 버블 전용 인라인 스타일 파서 래퍼 (텍스트를 흰색으로 유지하며 줄간격 확보)
function UserMarkdown({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  const parseUserInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      const codeMatch = remaining.match(/`(.*?)`/);

      if (!boldMatch && !codeMatch) {
        parts.push(<span key={`txt-${keyIndex}`}>{remaining}</span>);
        break;
      }

      const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;
      const codeIndex = codeMatch ? remaining.indexOf(codeMatch[0]) : Infinity;

      if (boldIndex < codeIndex) {
        if (boldIndex > 0) {
          parts.push(<span key={`txt-${keyIndex}`}>{remaining.substring(0, boldIndex)}</span>);
          keyIndex++;
        }
        parts.push(<strong key={`bold-${keyIndex}`} className="font-extrabold text-white underline decoration-white/50 decoration-2 underline-offset-2">{boldMatch![1]}</strong>);
        keyIndex++;
        remaining = remaining.substring(boldIndex + boldMatch![0].length);
      } else {
        if (codeIndex > 0) {
          parts.push(<span key={`txt-${keyIndex}`}>{remaining.substring(0, codeIndex)}</span>);
          keyIndex++;
        }
        parts.push(
          <code key={`code-${keyIndex}`} className="px-2 py-0.5 rounded bg-white/20 text-white border border-white/25 font-mono text-xs">
            {codeMatch![1]}
          </code>
        );
        keyIndex++;
        remaining = remaining.substring(codeIndex + codeMatch![0].length);
      }
    }
    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    elements.push(
      <p key={`p-${i}`} className="text-xs text-white leading-relaxed my-1 font-semibold">
        {parseUserInline(lines[i].trim())}
      </p>
    );
  }

  return <div className="space-y-1">{elements}</div>;
}

export default function EasyBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // 음성 대화 관련 상태
  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const STORAGE_KEY = 'egdesk_easybot_chat_history';

  // 최초 로드 시 대화 이력 가져오기 및 화면 크기 감지
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('이지봇 대화 이력 불러오기 실패:', e);
        initializeWelcomeMessage();
      }
    } else {
      initializeWelcomeMessage();
    }

    // 화면 너비 동적 체크 (Tailwind v4 미디어쿼리 빌드 누락 이슈 우회)
    const handleResize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile) {
        setIsWide(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 메시지가 추가될 때마다 로컬저장소에 저장 및 하단 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages]);

  const initializeWelcomeMessage = () => {
    const welcome: Message = {
      role: 'bot',
      content: `안녕하세요! 이지데스크의 스마트 관리자 비서 **이지봇(EasyBot)**입니다. 🤖✨

저는 이지데스크 시스템의 **SQLite 데이터베이스**와 현재 브라우저의 **로컬 저장소(LocalStorage)** 정보를 완벽하게 통합 분석할 수 있는 권한을 가지고 있습니다. 

저에게 다음과 같은 것들을 편하게 질문해 보세요:
* **비즈니스 데이터 조회**: *"현재 우리 시스템에 등록된 총 고객 수는 몇 명인가요?"*, *"최근 발송한 문자 로그 3개만 표로 보여줘."*
* **로컬 상태 물어보기**: *"지금 내 로컬 저장소에 저장된 최근 설정값이나 상태가 어떻게 돼?"*
* **종합 질의**: *"오늘 발송한 내역 중에서 발송 실패한 건수가 있는지 확인해 줘."*

편안하게 대화를 시작해 보세요! 🚀`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcome]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReset = () => {
    if (window.confirm('대화 이력을 모두 삭제하고 처음부터 다시 대화를 시작하시겠습니까?')) {
      localStorage.removeItem(STORAGE_KEY);
      initializeWelcomeMessage();
    }
  };

  // textarea 높이 동적 자동 조절 (Auto-growing)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, [inputVal]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputVal.trim() && !isLoading) {
        handleSend(e);
      }
    }
  };

  // 마크다운 특수문자 및 코드를 음성 출력에 맞게 정제하는 필터
  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/```[\s\S]*?```/g, " 코드 조각이 생략되었습니다. ") // 코드 블록 제거
      .replace(/\|.*\|/g, " 표 데이터가 표기되었습니다. ") // 테이블 제거
      .replace(/[*_#`~>]/g, "") // 마크다운 제거
      .replace(/\n/g, " ") // 줄바꿈을 공백으로
      .trim();
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !isTtsEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text));
    utterance.lang = 'ko-KR';
    utterance.rate = 1.1; // 살짝 빠르게 설정
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("현재 브라우저는 음성 인식을 지원하지 않습니다. 크롬 또는 엣지를 사용해 주세요.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      window.speechSynthesis.cancel(); // 내 말을 시작하면 봇의 말하기 중단
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputVal(transcript);
      // 사장님 요청: 음성 인식 종료 시 자동으로 질문을 전송
      handleSend(undefined, transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("음성 인식 에러:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSend = async (e?: React.FormEvent | React.KeyboardEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    
    const textToSend = overrideText || inputVal;
    if (!textToSend.trim() || isLoading) return;

    if (!overrideText) setInputVal('');
    setIsLoading(true);

    const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    // 1. 사용자 메시지 즉시 화면에 주입
    const userMessage: Message = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: timeString
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // 2. 현재 브라우저의 LocalStorage 스냅샷 캡처
    const localStorageData: Record<string, string> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== STORAGE_KEY) { // 챗봇 대화 기록 자체는 캡처에서 제외
          const val = localStorage.getItem(key);
          localStorageData[key] = val || '';
        }
      }
    } catch (e) {
      console.warn('LocalStorage 캡처 실패:', e);
    }

    try {
      // 3. 백엔드 EasyBot API 호출
      const response = await fetch('/api/easybot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          chatHistory: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          localStorageContext: localStorageData
        })
      });

      const data = await response.json();

      if (data.success) {
        const botMessage: Message = {
          role: 'bot',
          content: data.answer,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          sql: data.sql,
          sqlSuccess: data.sqlSuccess,
          sqlError: data.sqlError
        };
        setMessages(prev => [...prev, botMessage]);
        speakText(data.answer); // TTS 재생
      } else {
        const botErrorMessage: Message = {
          role: 'bot',
          content: `죄송합니다. 오류가 발생했습니다: \n\n\`\`\`text\n${data.error || '알 수 없는 서버 에러'}\n\`\`\``,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botErrorMessage]);
        speakText(`오류가 발생했습니다. ${data.error}`);
      }
    } catch (error: any) {
      console.error('이지봇 응답 에러:', error);
      const botErrorMessage: Message = {
        role: 'bot',
        content: `서버 연결에 실패했습니다. 구글 AI API 키 설정 또는 네트워크 상태를 확인해 주세요. \n\n\`\`\`text\n${error.message || String(error)}\n\`\`\``,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botErrorMessage]);
      speakText('서버 연결에 실패했습니다. 네트워크 상태를 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 플로팅 FAB 버튼 (인스타그램 감성 피드 그라데이션 광채 적용) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_30px_rgba(224,50,145,0.35)] focus:outline-none shrink-0"
        style={{
          background: 'linear-gradient(45deg, #f91f7f 0%, #e03291 30%, #b137a4 65%, #7000ff 100%)',
        }}
        aria-label="이지봇 열기"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center justify-center"
            >
              <MessageSquare size={24} />
              <motion.div
                className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-emerald-450 border-2 border-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 대화 위젯 창 (자바스크립트 화면크기 감지 기반의 안전한 100% 반응형 레이아웃) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed z-50 flex flex-col overflow-hidden bg-white/95 border border-slate-200/90 shadow-[0_25px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300"
            style={
              isMobile
                ? { 
                    bottom: 0, 
                    right: 0, 
                    width: '100%', 
                    height: '100%',
                    borderRadius: '0px'
                  }
                : {
                    bottom: '96px', 
                    right: '24px',  
                    width: isWide ? '800px' : '400px',
                    minWidth: '360px',
                    maxWidth: 'calc(100vw - 280px)', // 왼쪽 사이드바 침범 절대 금지
                    height: isWide ? 'calc(100vh - 120px)' : '580px',
                    maxHeight: isWide ? '900px' : '70vh',
                    borderRadius: '28px'
                  }
            }
          >
            {/* 위젯 헤더 (패딩을 px-6 py-5로 크게 늘려 넉넉한 여백 확보) */}
            <div className="flex items-center justify-between border-b border-slate-100/80 bg-white/90 px-6 py-5 shrink-0">
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm text-white shrink-0"
                  style={{ background: 'linear-gradient(45deg, #f91f7f 0%, #7000ff 100%)' }}
                >
                  <Bot size={20} className="animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span 
                      style={{
                        background: 'linear-gradient(90deg, #f91f7f 0%, #bc2a8d 50%, #7000ff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                      className="font-extrabold text-[15px]"
                    >
                      이지봇
                    </span>
                    <span className="text-[9px] bg-pink-500/10 text-pink-600 border border-pink-500/20 px-2 py-0.5 rounded-full font-bold">
                      Core Agent
                    </span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <span className="text-[10px] text-slate-400 font-semibold tracking-wide">DB & LocalStorage Sync</span>
                  </div>
                </div>
              </div>

              {/* 우측 아이콘 버튼 영역 여백 확보 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsTtsEnabled(!isTtsEnabled);
                    if (isTtsEnabled) window.speechSynthesis.cancel();
                  }}
                  className={`p-2.5 rounded-xl transition-colors flex items-center justify-center ${
                    isTtsEnabled ? 'bg-violet-100 text-violet-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                  title={isTtsEnabled ? "음성 안내 끄기" : "음성 안내 켜기"}
                >
                  {isTtsEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
                </button>
                {!isMobile && (
                  <button
                    onClick={() => setIsWide(!isWide)}
                    className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center"
                    title={isWide ? "기본 모드로 축소" : "와이드 모드로 확장"}
                  >
                    {isWide ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                  title="대화 초기화"
                >
                  <RotateCcw size={17} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors flex"
                  title="닫기"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 메시지 보드 영역 (패딩 p-5 및 space-y-6으로 메시지 간격 시원하게 배치) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 pb-6 space-y-6 bg-[#fafafb] custom-scrollbar pt-6">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'bot' && (
                    <div 
                      className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm mt-0.5 animate-bounce-subtle"
                      style={{ background: 'linear-gradient(135deg, #7000ff 0%, #b137a4 100%)' }}
                    >
                      <Bot size={15} />
                    </div>
                  )}
                  <div className="flex flex-col max-w-[76%] space-y-1.5">
                    {/* 메시지 말풍선 (패딩 px-4.5 py-3.5로 텍스트 호흡 여백 증대) */}
                    <div
                      className={`px-4.5 py-3.5 rounded-2xl shadow-[0_3px_6px_rgba(0,0,0,0.015)] text-xs border-0 ${
                        msg.role === 'user'
                          ? 'text-white rounded-tr-none'
                          : 'bg-[#efefef] text-[#1c1e21] rounded-tl-none'
                      }`}
                      style={
                        msg.role === 'user'
                          ? { 
                              background: 'linear-gradient(135deg, #7000ff 0%, #bc2a8d 60%, #f91f7f 100%)',
                              boxShadow: '0 5px 15px rgba(112, 0, 255, 0.12)'
                            }
                          : undefined
                      }
                    >
                      {msg.role === 'user' ? (
                        <UserMarkdown content={msg.content} />
                      ) : (
                        <SafeMarkdown content={msg.content} />
                      )}

                      {/* AI가 수행한 동적 SQL 정보 디버깅 박스 (라이트 모드 Spacing 튜닝) */}
                      {msg.role === 'bot' && msg.sql && (
                        <div className="mt-4 pt-3.5 border-t border-slate-200/70">
                          <details className="group cursor-pointer">
                            <summary className="text-[10px] text-violet-650 font-bold hover:text-violet-850 flex items-center gap-1.5 select-none">
                              <span>⚙️ AI가 실행한 SQLite 분석 쿼리 보기</span>
                            </summary>
                            <div className="mt-2.5 text-[10px] font-mono rounded-xl bg-white p-3.5 border border-slate-150 shadow-inner space-y-2 overflow-x-auto text-slate-600">
                              <div className="leading-normal">
                                <span className="text-violet-600 font-bold">QUERY:</span> {msg.sql}
                              </div>
                              {msg.sqlSuccess === false ? (
                                <div className="text-rose-600 flex items-center gap-1.5 bg-rose-50 p-2 rounded-lg border border-rose-100">
                                  <ShieldAlert size={10} className="shrink-0" />
                                  <span>ERROR: {msg.sqlError}</span>
                                </div>
                              ) : (
                                <div className="text-emerald-600 font-bold">STATUS: 정상 실행 성공 (100% Correct)</div>
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                    {/* 전송 시각 */}
                    <span className={`text-[9px] text-slate-400 font-medium ${msg.role === 'user' ? 'text-right pr-1' : 'pl-1'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {/* AI 타이핑/로딩 로더 (라이트 모드) */}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div 
                    className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-2xl text-white animate-spin mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #7000ff 0%, #b137a4 100%)' }}
                  >
                    <Bot size={15} />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <div className="bg-[#efefef] px-4 py-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                      <span className="h-1.5 w-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-[10px] text-slate-500 ml-1.5 font-bold animate-pulse">DB 및 로컬 데이터를 뒤적이는 중...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력 폼 하단 영역 (CSS 빌드 캐시 버그 차단을 위해 100% 안전한 인라인 스타일 Flex 레이아웃 적용) */}
            <form 
              onSubmit={(e) => handleSend(e)} 
              className="shrink-0 border-t border-slate-100/70"
              style={{
                background: '#fafafb',
                padding: '12px 20px 24px 20px', 
                display: 'flex',
                alignItems: 'flex-end',
                gap: '12px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div 
                className={`bg-white border rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all ${
                  isListening ? 'border-pink-500 ring-2 ring-pink-200' : 'border-slate-200 focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400'
                }`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  flex: 1,
                  padding: '10px 16px', 
                  boxSizing: 'border-box'
                }}
              >
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`shrink-0 mr-2 p-1.5 rounded-full transition-colors flex items-center justify-center ${
                    isListening ? 'text-pink-500 bg-pink-50 animate-pulse' : 'text-slate-400 hover:bg-slate-100'
                  }`}
                  title={isListening ? "음성 인식 중지" : "마이크 켜고 말하기"}
                >
                  {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <textarea
                  ref={textareaRef}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="이지봇에게 질문해 주세요 (Shift+Enter 줄바꿈)"
                  rows={1}
                  className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs text-slate-800 placeholder-slate-400 resize-none font-semibold tracking-wide max-h-[100px] py-0.5 custom-scrollbar min-h-[20px] leading-relaxed"
                  style={{
                    width: '100%',
                    height: 'auto',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    margin: 0,
                    padding: 0
                  }}
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={!inputVal.trim() || isLoading}
                className="rounded-full text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  height: '36px', // h-9에 매칭
                  width: '36px',  // w-9에 매칭
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(45deg, #f91f7f 0%, #7000ff 100%)',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  marginBottom: '2px' // mb-0.5에 매칭
                }}
              >
                <Send size={14} style={{ color: '#ffffff' }} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
