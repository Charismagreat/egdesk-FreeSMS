'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, X, Send, RotateCcw, Bot, Terminal, ShieldAlert, Maximize2, Minimize2, Mic, MicOff, Volume2, VolumeX, Camera, Mail, CheckCircle2, User, Phone, Briefcase, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  sql?: string | null;
  sqlSuccess?: boolean | null;
  sqlError?: string | null;
  isCardPhoto?: boolean; // 명함 이미지 썸네일 노출 여부
  cardPhotoBase64?: string; // 명함 이미지 Base64 데이터
}

// React 19 무의존성 안전 마크다운 렌더러 컴포넌트 (밝은 색 테마 버전)
function SafeMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentTable: { headers: string[]; rows: string[][] } | null = null;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';

  const parseInlineStyles = (text: string, isUserMessage: boolean = false): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    const boldClass = isUserMessage ? "font-extrabold text-white underline decoration-pink-300 underline-offset-2" : "font-bold text-violet-750";
    const codeClass = isUserMessage 
      ? "px-2 py-0.5 rounded bg-white/20 text-white font-mono text-xs border border-white/30" 
      : "px-2 py-0.5 rounded bg-rose-50 text-rose-650 font-mono text-xs border border-rose-100";

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
        parts.push(<strong key={`bold-${keyIndex}`} className={boldClass}>{boldMatch![1]}</strong>);
        keyIndex++;
        remaining = remaining.substring(boldIndex + boldMatch![0].length);
      } else {
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

    if (line.startsWith('```')) {
      if (inCodeBlock) {
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
        inCodeBlock = true;
        codeBlockLang = line.substring(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(lines[i]);
      continue;
    }

    if (line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      if (cells.every(c => c.startsWith('-'))) {
        continue;
      }

      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
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
              <tbody className="divide-y divide-slate-100/80">
                {tableObj.rows.map((row, rIdx) => (
                  <tr key={`tr-${rIdx}`} className="hover:bg-slate-50/50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={`td-${cIdx}`} className="p-3 text-slate-650 leading-relaxed font-medium">
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

    if (line.startsWith('#')) {
      const depth = line.match(/^#+/)?.[0].length || 1;
      const titleText = line.replace(/^#+\s*/, '');
      const headingClass = depth === 1 
        ? "text-[15px] font-black text-slate-800 mt-5 mb-2 pb-1 border-b border-slate-150" 
        : depth === 2 
        ? "text-sm font-bold text-violet-750 mt-4 mb-1.5" 
        : "text-xs font-bold text-slate-700 mt-3 mb-1";
      
      elements.push(
        <div key={`h-${i}`} className={headingClass}>
          {parseInlineStyles(titleText)}
        </div>
      );
      continue;
    }

    if (line.startsWith('-') || line.startsWith('*')) {
      const listText = line.replace(/^[-*]\s*/, '');
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
          <span className="text-slate-650 leading-relaxed font-medium">{parseInlineStyles(listText)}</span>
        </div>
      );
      continue;
    }

    if (line) {
      elements.push(
        <p key={`p-${i}`} className="my-2 leading-relaxed text-slate-650 font-medium">
          {parseInlineStyles(lines[i])}
        </p>
      );
    }
  }

  // 아직 렌더링되지 않은 잔여 테이블 배출
  if (currentTable) {
    const tableObj = currentTable;
    elements.push(
      <div key="table-final" className="my-4 overflow-x-auto rounded-xl border border-slate-150 shadow-sm bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150">
              {tableObj.headers.map((h, idx) => (
                <th key={`th-${idx}`} className="p-3 font-bold text-slate-700 tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {tableObj.rows.map((row, rIdx) => (
              <tr key={`tr-${rIdx}`} className="hover:bg-slate-50/50 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={`td-${cIdx}`} className="p-3 text-slate-650 leading-relaxed font-medium">
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

  return <div className="space-y-1">{elements}</div>;
}

function UserMarkdown({ content }: { content: string }) {
  if (!content) return null;
  return <p className="leading-relaxed font-bold tracking-wide break-words text-white">{content}</p>;
}

/**
 * AI 명함 OCR 구조화 데이터를 파싱하여 인라인 수동 보정 및 확정 등록을 수행하는 명품 프리뷰 카드 컴포넌트
 */
function CardPreviewMessage({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [card, setCard] = useState<any>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      setCard(parsed);
      setName(parsed.name || '');
      setPosition(parsed.position || '');
      setPhone(parsed.phone || '');
      setEmail(parsed.email || '');
      setCompanyName(parsed.companyName || parsed.partnerName || '');
    } catch (err) {
      console.error('명함 태그 파싱 실패:', err);
    }
  }, [tagContent]);

  if (!card) return <div className="text-rose-500 font-bold p-2">명함 데이터를 파싱하지 못했습니다.</div>;

  const actionType = card.actionType;
  const partnerId = card.partnerId;
  const existingContact = card.existingContact;

  const handleConfirmSubmit = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType,
          name,
          position,
          phone,
          email,
          partnerId,
          partnerName: companyName,
          existingContactId: existingContact?.id,
          cardImageUrl: card.cardImageUrl || ''
        })
      });

      const data = await response.json();
      if (data.success) {
        setSaved(true);
        onConfirmSuccess(data.message);
      } else {
        alert(data.error || '명함 DB 등록 처리에 실패했습니다.');
      }
    } catch (err: any) {
      alert('서버 등록 통신 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-indigo-100 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      {/* 카드 헤더 */}
      <div className="bg-gradient-to-r from-indigo-50/50 to-violet-50/30 px-4 py-3 border-b border-indigo-50 flex items-center gap-2">
        <Sparkles size={14} className="text-indigo-600 animate-pulse" />
        <span className="text-xs font-black text-slate-800">이지봇 AI 명함 분석 리포트</span>
      </div>

      {/* 정보 입력 및 보정 양식 */}
      <div className="p-4 space-y-3 text-[11px]">
        {/* 성명 및 직급 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><User size={10} />성명</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              disabled={saving || saved}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/20 font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><Briefcase size={10} />직책/직급</label>
            <input 
              type="text" 
              value={position} 
              onChange={e => setPosition(e.target.value)}
              disabled={saving || saved}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/20 font-bold"
            />
          </div>
        </div>

        {/* 회사명 */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold">🏢 소속 회사명</label>
          <div className="flex gap-1.5 items-center">
            <input 
              type="text" 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)}
              disabled={saving || saved}
              className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/20 font-bold text-xs"
            />
            {partnerId ? (
              <span className="shrink-0 bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] font-black">매칭완료</span>
            ) : (
              <span className="shrink-0 bg-amber-50 border border-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[9px] font-black">신규회사</span>
            )}
          </div>
        </div>

        {/* 연락망 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><Phone size={10} />전화번호</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              disabled={saving || saved}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/20 font-bold font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><Mail size={10} />이메일</label>
            <input 
              type="text" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              disabled={saving || saved}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/20 font-bold"
            />
          </div>
        </div>

        {/* AI 지능형 판정 결과 라벨 */}
        <div className="p-3 rounded-xl border leading-normal mt-2.5">
          {actionType === 'update_info' ? (
            <div className="border-indigo-50 bg-indigo-50/20 text-indigo-750 text-[10px] font-medium space-y-1">
              <p className="font-extrabold text-indigo-700 flex items-center gap-1">⚡ 동일 소속 연락망 변동 감지</p>
              <p>기존 명함 데이터와 소속명이 일치하여, 본 레코드의 승진 직급 및 변경 정보를 최신으로 **덮어쓰기 업데이트**합니다.</p>
            </div>
          ) : actionType === 'career_transition' ? (
            <div className="border-amber-50 bg-amber-50/20 text-amber-750 text-[10px] font-medium space-y-1">
              <p className="font-extrabold text-amber-700 flex items-center gap-1">🚀 스마트 이직(소속 회사 이동) 감지</p>
              <p>이전 <strong>{existingContact?.position || '담당자'}</strong> 소속회사 이력을 보관 비활성(퇴사) 처리하고, <strong>새로운 회사 소속의 명함첩 연락망</strong>으로 분리 신설합니다.</p>
            </div>
          ) : (
            <div className="border-slate-100 bg-slate-50/40 text-slate-600 text-[10px] font-medium space-y-1">
              <p className="font-extrabold text-slate-700">🆕 신규 명함 연락망 접수</p>
              <p>일치하는 기존 담당자가 발견되지 않아, 명함첩의 신규 거래처 담당자로 안전하게 추가 등록을 수행합니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 최종 확정 액션 버튼 */}
      <div className="px-4 py-3 bg-slate-50 border-t border-indigo-50 flex items-center justify-end">
        {saved ? (
          <div className="text-emerald-600 font-extrabold text-xs flex items-center gap-1.5 py-1.5">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            명함첩 등록 성공 완료!
          </div>
        ) : (
          <button
            onClick={handleConfirmSubmit}
            disabled={saving || !name}
            className="w-full py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: '#4f46e5' }}
          >
            {saving ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                DB에 반영하는 중...
              </>
            ) : actionType === 'update_info' ? (
              <>
                <Send size={12} />
                최신 정보로 갱신 적용 ⚡
              </>
            ) : actionType === 'career_transition' ? (
              <>
                <Send size={12} />
                기존 이력 보존 & 이직 등록 🚀
              </>
            ) : (
              <>
                <Send size={12} />
                명함첩 신규 등록 완료
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function EasyBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: '반갑습니다! 무엇을 도와드릴까요?\n- **"AI 브리핑 분석해줘"** 라고 하시면 시각 통계를 분석합니다.\n- 📷 하단의 **카메라 아이콘**을 클릭해 명함 사진을 전송하시면 자동으로 명함첩에 똑똑하게 등록해 드립니다!',
      timestamp: '방금 전'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const ttsSynthesisRef = useRef<any>(null);
  const currentUtteranceRef = useRef<any>(null);

  // 명함 파일 업로드 수입용 Ref 추가
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'ko-KR';

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputVal(transcript);
        };

        rec.onerror = (event: any) => {
          console.error('음성 인식 오류:', event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
      ttsSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('음성 인식 구동 오류:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const stopSpeaking = () => {
    if (ttsSynthesisRef.current) {
      ttsSynthesisRef.current.cancel();
    }
  };

  /**
   * 진성 주의/경고사항 감지 및 5문장 제한 요약 낭독 TTS 유틸리티
   */
  const speakImportantNotesOnly = (text: string) => {
    if (!voiceEnabled || !ttsSynthesisRef.current) return;
    
    stopSpeaking();

    // 1. 텍스트를 문장 단위로 세분화 분할
    const sentences = text.split(/[.?!]\s+/);
    
    // 2. 오직 진성 주의/경고형 키워드가 발견되는 핵심 문장만 필터링
    const genuineWarningKeywords = ['주의', '경고', '금지', '제한', '위험', '차단', '잠금', '⚠️', '🚨'];
    const filteredSentences = sentences.filter(sentence => 
      genuineWarningKeywords.some(keyword => sentence.includes(keyword))
    );

    if (filteredSentences.length === 0) {
      // 명시적인 주의사항이 없으면 낭독하지 않고 스킵
      return;
    }

    // 3. 문장이 너무 많아 낭독이 지나치게 길어지는 것을 방지하기 위해 최대 5문장 하드 리밋(Hard Limit) 제한
    const limitedSentences = filteredSentences.slice(0, 5);
    const speechText = `관리자님, 주요 주의 사항입니다. ${limitedSentences.join('. ')}`;

    try {
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      
      utterance.onstart = () => {
        currentUtteranceRef.current = utterance;
      };
      
      utterance.onend = () => {
        currentUtteranceRef.current = null;
      };

      ttsSynthesisRef.current.speak(utterance);
    } catch (speechErr) {
      console.error('TTS 구동 에러:', speechErr);
    }
  };

  const formatTimestamp = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    const formattedHours = hours % 12 || 12;
    return `${ampm} ${formattedHours}:${minutes}`;
  };

  /**
   * 명함 카메라 전송 및 Base64 스캔 API 파이프라인
   */
  const handleCardPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    stopSpeaking();

    // 사용자의 명함 이미지 썸네일 버블 추가
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;
      const timeStr = formatTimestamp();

      // 사용자 대화창에 명함 썸네일 노출
      setMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: '📷 이 명함을 명함첩에 등록해 주세요.',
          timestamp: timeStr,
          isCardPhoto: true,
          cardPhotoBase64: base64Str
        }
      ]);

      // 봇의 분석 중 대기 상태 추가
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: '🔄 명함 사진을 지능적으로 스캔하고 있습니다. 잠시만 기다려 주세요... ⚡',
          timestamp: timeStr
        }
      ]);

      try {
        const response = await fetch('/api/easybot/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Str })
        });

        const data = await response.json();

        if (data.success) {
          // 명함 이미지 저장 URL이나 가상 URL 매핑
          const cardPayload = {
            ...data.parsedData,
            actionType: data.actionType,
            partnerId: data.partnerId,
            partnerName: data.partnerName,
            existingContact: data.existingContact,
            cardImageUrl: base64Str // 프리뷰용 base64 보존
          };

          // 봇의 로딩 대화를 특수 [CARD_PREVIEW:...] 카드로 치환
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'bot',
              content: `[CARD_PREVIEW:${JSON.stringify(cardPayload)}]`,
              timestamp: formatTimestamp()
            };
            return updated;
          });
        } else {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'bot',
              content: `❌ 명함 판독 실패: ${data.error || '알 수 없는 판독 오류'}`,
              timestamp: formatTimestamp()
            };
            return updated;
          });
        }
      } catch (err: any) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'bot',
            content: `❌ 명함 스캔 중 통신 오류가 발생했습니다: ${err.message}`,
            timestamp: formatTimestamp()
          };
          return updated;
        });
      } finally {
        setIsLoading(false);
        // 파일 업로드 인풋 초기화
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * 명함 최종 등록 성공 시 호출되는 콜백 함수
   */
  const handleCardConfirmSuccess = (successMsg: string) => {
    setMessages(prev => [
      ...prev,
      {
        role: 'bot',
        content: `✅ ${successMsg}`,
        timestamp: formatTimestamp()
      }
    ]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userText = inputVal;
    setInputVal('');
    setIsLoading(true);
    stopSpeaking();

    const timeStr = formatTimestamp();

    // 1. 유저 메시지 적재
    const updatedMessages = [
      ...messages,
      {
        role: 'user' as const,
        content: userText,
        timestamp: timeStr
      }
    ];
    setMessages(updatedMessages);

    try {
      // 2. 이지봇 백엔드 통신 호출
      const response = await fetch('/api/easybot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userText,
          chatHistory: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          localStorageContext: typeof window !== 'undefined' ? { ...window.localStorage } : {},
          currentUrl: pathname
        })
      });

      const data = await response.json();

      if (data.success) {
        // 3. 봇의 지능형 응답 적재
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: data.reply,
            timestamp: formatTimestamp(),
            sql: data.sql || null,
            sqlSuccess: data.sqlSuccess !== undefined ? data.sqlSuccess : null,
            sqlError: data.sqlError || null
          }
        ]);

        // 4. 주의/경고사항 감지 및 요약 오디오 재생
        speakImportantNotesOnly(data.reply);

        // 5. 서버 측에서 화면 새로고침(redirect) 요령이 있으면 반응 처리
        if (data.redirectUrl) {
          setTimeout(() => {
            router.push(data.redirectUrl);
          }, 1800);
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: `죄송합니다. 오류가 발생했습니다.\n- *상세 사유:* ${data.error || '서버 응답 규격이 올바르지 않습니다.'}`,
            timestamp: formatTimestamp()
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: `네트워크 연결에 실패했습니다.\n- *에러 내용:* ${err.message || '인터넷 통신 장애'}`,
          timestamp: formatTimestamp()
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
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
      handleSendMessage(e);
    }
  };

  return (
    <>
      {/* 1. 이지봇 플로팅 트리거 단추 (Harmonic Indigo 그라데이션) */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          stopSpeaking();
        }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
        style={{
          background: 'linear-gradient(135deg, #7000ff 0%, #bc2a8d 50%, #f91f7f 100%)',
          boxShadow: '0 8px 24px rgba(112, 0, 255, 0.25)'
        }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* 2. 대화창 본체 레이아웃 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`fixed bottom-24 right-6 z-40 bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
              isMaximized ? 'w-[85vw] h-[85vh] sm:w-[60vw] sm:h-[80vh]' : 'w-[92vw] h-[72vh] sm:w-[400px] sm:h-[550px]'
            }`}
          >
            {/* 헤더 바 */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/20">
              <div className="flex items-center gap-2.5">
                <div 
                  className="flex h-8.5 w-8.5 items-center justify-center rounded-2xl text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #7000ff 0%, #f91f7f 100%)' }}
                >
                  <Bot size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 tracking-wide flex items-center gap-1.5">
                    이지봇 AI 비서
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </h4>
                  <p className="text-[9.5px] text-slate-400 font-bold mt-0.5">EGDesk 지능형 비서 연동</p>
                </div>
              </div>

              {/* 헤더 액션 단추 그룹 */}
              <div className="flex items-center gap-1">
                {/* 오디오 소리 조절 버튼 */}
                <button
                  onClick={() => {
                    setVoiceEnabled(!voiceEnabled);
                    stopSpeaking();
                  }}
                  className={`p-2 rounded-xl transition-colors ${
                    voiceEnabled ? 'text-violet-600 bg-violet-50 hover:bg-violet-100' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                  title={voiceEnabled ? "음성 안내 켜짐" : "음성 안내 꺼짐"}
                >
                  {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>

                {/* 창 크기 전환 */}
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors flex"
                  title={isMaximized ? "축소하기" : "넓게보기"}
                >
                  {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>

                {/* 대화 초기화 */}
                <button
                  onClick={() => {
                    setMessages([
                      {
                        role: 'bot',
                        content: '반갑습니다! 무엇을 도와드릴까요?\n- **"AI 브리핑 분석해줘"** 라고 하시면 시각 통계를 분석합니다.\n- 📷 하단의 **카메라 아이콘**을 클릭해 명함 사진을 전송하시면 자동으로 명함첩에 똑똑하게 등록해 드립니다!',
                        timestamp: '방금 전'
                      }
                    ]);
                    stopSpeaking();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-755 transition-colors flex"
                  title="대화 내역 초기화"
                >
                  <RotateCcw size={15} />
                </button>
                
                {/* 닫기 */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    stopSpeaking();
                  }}
                  className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors flex"
                  title="닫기"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* 메시지 보드 영역 */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 pb-6 space-y-6 bg-[#fafafb] custom-scrollbar pt-6">
              {messages.map((msg, index) => {
                const isCardPreview = msg.role === 'bot' && msg.content.startsWith('[CARD_PREVIEW:');
                const tagContent = isCardPreview ? msg.content.substring(14, msg.content.length - 1) : '';

                return (
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
                      {/* 메시지 말풍선 */}
                      <div
                        className={`px-4.5 py-3.5 rounded-2xl shadow-[0_3px_6px_rgba(0,0,0,0.015)] text-xs border-0 ${
                          msg.role === 'user'
                            ? 'text-white rounded-tr-none'
                            : isCardPreview
                            ? 'p-0 bg-transparent shadow-none border-none rounded-none' // 명함 카드는 말풍선 제거
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
                        {/* 1. 명함 실물 썸네일 렌더링 지원 (유저 메시지용) */}
                        {msg.isCardPhoto && msg.cardPhotoBase64 && (
                          <div className="mb-2 max-w-[180px] overflow-hidden rounded-xl border border-white/20 shadow-inner bg-black/5">
                            <img src={msg.cardPhotoBase64} alt="명함 업로드 원본" className="w-full h-auto object-contain max-h-[110px]" />
                          </div>
                        )}

                        {/* 2. 일반 텍스트 렌더링 분기 */}
                        {msg.role === 'user' ? (
                          <UserMarkdown content={msg.content} />
                        ) : isCardPreview ? (
                          <CardPreviewMessage tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : (
                          <SafeMarkdown content={msg.content} />
                        )}

                        {/* AI가 수행한 동적 SQL 정보 디버깅 박스 */}
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
                                    <span>{msg.sqlError || '쿼리 실행 도중 문법 혹은 참조 에러가 발생했습니다.'}</span>
                                  </div>
                                ) : (
                                  <div className="text-emerald-600 font-bold">✓ 쿼리가 SQLite DB상에서 100% 안전하게 실행 완료되었습니다.</div>
                                )}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>

                      {/* 시간 타임스탬프 */}
                      <span className={`text-[8.5px] text-slate-400 font-bold px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div 
                    className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm mt-0.5 bg-slate-200 animate-pulse"
                  >
                    <Bot size={15} />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className="bg-[#efefef] text-slate-450 px-4.5 py-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 font-semibold">
                      <RefreshCw size={12} className="animate-spin text-indigo-500 shrink-0" />
                      이지봇이 스마트하게 데이터를 분석 중입니다...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력 폼 영역 */}
            <form 
              onSubmit={handleSendMessage}
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #f1f2f4',
                background: '#ffffff',
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
                {/* 1. 명함 카메라 사진 전송 버튼 신규 탑재 */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="shrink-0 mr-1 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                  title="명함 사진 촬영 및 이미지 분석 업로드"
                >
                  <Camera size={18} />
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCardPhotoUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* 2. 기존 마이크 버튼 */}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={!speechSupported || isLoading}
                  className={`shrink-0 mr-2 p-1.5 rounded-full transition-colors flex items-center justify-center disabled:opacity-30 ${
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
                className="rounded-full text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  height: '36px',
                  width: '36px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(45deg, #f91f7f 0%, #7000ff 100%)',
                  border: 'none',
                  outline: 'none',
                  marginBottom: '2px'
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
