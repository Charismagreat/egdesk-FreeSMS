'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MessageSquare, Sparkles, X, Send, RotateCcw, Bot, Terminal, ShieldAlert, Maximize2, Minimize2, Mic, MicOff, Volume2, VolumeX, Camera, Mail, CheckCircle2, User, Phone, Briefcase, RefreshCw, Calendar, DollarSign, Check, FileText, Plus, Layers, MousePointerClick, Video, VideoOff, Scale, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  sql?: string | null;
  sqlSuccess?: boolean | null;
  sqlError?: string | null;
  isCardPhoto?: boolean; // 명함 이미지 썸네일 노출 여부
  cardPhotoBase64?: string; // 명함 이미지 Base64 데이터
  isPdfFile?: boolean; // PDF 파일 노출 여부
  pdfFileName?: string; // PDF 파일명
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
    const linkClass = isUserMessage
      ? "text-white underline font-bold hover:opacity-80 transition-opacity"
      : "text-violet-600 underline font-bold hover:text-violet-850 transition-colors";

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      const codeMatch = remaining.match(/`(.*?)`/);
      const linkMatch = remaining.match(/\[(.*?)\]\((.*?)\)/);

      if (!boldMatch && !codeMatch && !linkMatch) {
        parts.push(<span key={`txt-${keyIndex}`}>{remaining}</span>);
        break;
      }

      const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;
      const codeIndex = codeMatch ? remaining.indexOf(codeMatch[0]) : Infinity;
      const linkIndex = linkMatch ? remaining.indexOf(linkMatch[0]) : Infinity;

      const minIndex = Math.min(boldIndex, codeIndex, linkIndex);

      if (minIndex === boldIndex) {
        if (boldIndex > 0) {
          parts.push(<span key={`txt-${keyIndex}`}>{remaining.substring(0, boldIndex)}</span>);
          keyIndex++;
        }
        parts.push(<strong key={`bold-${keyIndex}`} className={boldClass}>{boldMatch![1]}</strong>);
        keyIndex++;
        remaining = remaining.substring(boldIndex + boldMatch![0].length);
      } else if (minIndex === codeIndex) {
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
      } else {
        if (linkIndex > 0) {
          parts.push(<span key={`txt-${keyIndex}`}>{remaining.substring(0, linkIndex)}</span>);
          keyIndex++;
        }
        const linkText = linkMatch![1];
        const linkUrl = linkMatch![2];
        parts.push(
          <a key={`link-${keyIndex}`} href={linkUrl} className={linkClass}>
            {linkText}
          </a>
        );
        keyIndex++;
        remaining = remaining.substring(linkIndex + linkMatch![0].length);
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
 * AI 이력서 OCR 구조화 데이터를 파싱하여 인라인 수동 보정 및 채용 인재 DB 확정 등록을 수행하는 프리미엄 카드 컴포넌트
 */
function ResumePreviewCard({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [resume, setResume] = useState<any>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('');
  const [motivation, setMotivation] = useState('');
  const [techStacks, setTechStacks] = useState('');
  const [matchingScore, setMatchingScore] = useState(0);
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      setResume(parsed);
      setName(parsed.name || '');
      setAge(parsed.age || '');
      setPhone(parsed.phone || '');
      setExperience(parsed.experience || '');
      setMotivation(parsed.motivation || '');
      setTechStacks(parsed.tech_stacks || '');
      setMatchingScore(Number(parsed.matching_score) || 0);
    } catch (err) {
      console.error('이력서 태그 파싱 실패:', err);
    }
  }, [tagContent]);

  if (!resume) return <div className="text-rose-500 font-bold p-2 text-xs">이력서 데이터를 파싱하지 못했습니다.</div>;

  const handleConfirmSubmit = async () => {
    if (!name) {
      alert('성명은 필수 입력 항목입니다.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'RESUME',
          data: {
            name,
            age,
            phone,
            experience,
            motivation,
            tech_stacks: techStacks,
            matching_score: matchingScore,
            resume_file_path: resume.resume_file_path || ''
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setSaved(true);
        onConfirmSuccess(data.message);

        // 채용 관리 대시보드 동기화 브로드캐스트 이벤트 발생
        if (typeof window !== 'undefined' && data.applicant) {
          localStorage.setItem(
            'egdesk_recruitment_sync',
            JSON.stringify({
              action: 'applied',
              applicant: data.applicant,
              timestamp: Date.now()
            })
          );
        }
      } else {
        alert(data.error || '이력서 인재 DB 등록 처리에 실패했습니다.');
      }
    } catch (err: any) {
      alert('서버 등록 통신 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-pink-100 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      {/* 카드 헤더 */}
      <div className="bg-gradient-to-r from-pink-50/50 to-rose-50/30 px-4 py-3 border-b border-pink-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#f91f7f] animate-pulse" />
          <span className="text-xs font-black text-slate-800">이지봇 AI 이력서 분석 리포트</span>
        </div>
        {matchingScore > 0 && (
          <div className="bg-pink-50 border border-pink-100 text-[#f91f7f] px-2 py-0.5 rounded-full text-[9px] font-black">
            AI 적합도 {matchingScore}%
          </div>
        )}
      </div>

      {/* 정보 입력 및 보정 양식 */}
      <div className="p-4 space-y-3 text-[11px]">
        {/* 성명 및 나이 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><User size={10} />성명</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              disabled={saving || saved}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50/20 font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1">🎂 나이/출생</label>
            <input 
              type="text" 
              value={age} 
              onChange={e => setAge(e.target.value)}
              disabled={saving || saved}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50/20 font-bold"
            />
          </div>
        </div>

        {/* 연락망 */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><Phone size={10} />연락처</label>
          <input 
            type="text" 
            value={phone} 
            onChange={e => setPhone(e.target.value)}
            disabled={saving || saved}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50/20 font-bold font-mono text-xs"
          />
        </div>

        {/* 보유 스택 */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><Layers size={10} />기술 스택</label>
          <input 
            type="text" 
            value={techStacks} 
            onChange={e => setTechStacks(e.target.value)}
            disabled={saving || saved}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50/20 font-bold text-xs"
            placeholder="React, TypeScript, Node.js 등"
          />
        </div>

        {/* 경력 사항 */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><Briefcase size={10} />주요 경력 요약</label>
          <textarea 
            rows={2}
            value={experience} 
            onChange={e => setExperience(e.target.value)}
            disabled={saving || saved}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50/20 font-bold text-xs resize-none"
          />
        </div>

        {/* 지원 동기 */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1">📝 지원 동기 요약</label>
          <textarea 
            rows={2}
            value={motivation} 
            onChange={e => setMotivation(e.target.value)}
            disabled={saving || saved}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50/20 font-bold text-xs resize-none"
          />
        </div>

        {/* 실물 파일 연결 표시 */}
        {resume.resume_file_path && (
          <div className="mt-2 text-[9px] text-slate-400 flex items-center gap-1">
            <span>📄 첨부 이력서 파일:</span>
            <a href={resume.resume_file_path} target="_blank" rel="noreferrer" className="text-pink-600 underline font-bold hover:text-pink-850">
              [실물 파일 열기]
            </a>
          </div>
        )}
      </div>

      {/* 최종 확정 액션 버튼 */}
      <div className="px-4 py-3 bg-slate-50 border-t border-pink-50 flex items-center justify-end">
        {saved ? (
          <div className="text-emerald-600 font-extrabold text-xs flex items-center gap-1.5 py-1.5 w-full justify-center">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            인재풀 DB 적재 완료!
          </div>
        ) : (
          <button
            onClick={handleConfirmSubmit}
            disabled={saving || !name}
            className="w-full py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer border-none"
            style={{ backgroundColor: '#f91f7f' }}
          >
            {saving ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                DB에 반영하는 중...
              </>
            ) : (
              <>
                <Send size={12} />
                채용 인재 DB(인재풀)에 등록 확정 🎯
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * R&D 연구소 공간 진단 프리뷰 카드
 */
function RndSpacePreviewCard({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      setData(JSON.parse(tagContent));
    } catch (e) {
      console.error(e);
    }
  }, [tagContent]);

  if (!data) return <div className="text-rose-500 font-bold p-2">공간 분석 데이터를 읽을 수 없습니다.</div>;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/rnd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'space_add',
          data: {
            check_date: new Date().toISOString().slice(0, 10),
            image_url_entrance: data.image_url_entrance || '/images/rnd/entrance.jpg',
            image_url_layout: data.image_url_layout || '/images/rnd/layout.jpg',
            ai_analysis_result: data.ai_analysis_result,
            signage_status: data.signage_status || 'PASS',
            partition_status: data.partition_status || 'FAIL',
            overall_status: data.overall_status || '보완필요',
            inspector_notes: data.inspector_notes || ''
          }
        })
      }).then(r => r.json());

      if (res.success) {
        setSaved(true);
        onConfirmSuccess('연구소 공간 자가진단 내역이 성공적으로 데이터베이스에 등재되었습니다.');
      } else {
        alert(res.error || '저장 실패');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-amber-100 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/30 px-4 py-3 border-b border-amber-50 flex items-center gap-2">
        <Camera size={14} className="text-amber-600" />
        <span className="text-xs font-black text-slate-800">이지봇 공간 적격성 AI 판독</span>
      </div>
      <div className="p-4 space-y-2.5 text-[11px]">
        <p className="font-bold text-slate-800 text-xs">진단 결과: <span className={data.overall_status === '합격' ? 'text-green-600' : 'text-amber-600 font-extrabold'}>{data.overall_status}</span></p>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 space-y-1">
          <p>• 현판 부착: {data.signage_status === 'PASS' ? '합격(확인)' : '부적격(미부착)'}</p>
          <p>• 파티션 높이: {data.partition_status === 'PASS' ? '합격(1.2m 이상)' : '주의(1.2m 미달 추정)'}</p>
          <p className="text-[10px] text-slate-500 italic border-t pt-1.5 mt-1.5 leading-relaxed">
            "{data.inspector_notes}"
          </p>
        </div>
      </div>
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-end">
        {saved ? (
          <span className="text-green-600 text-xs font-bold flex items-center gap-1"><Check size={12} /> 진단 기록 등재 완료</span>
        ) : (
          <button 
            onClick={handleConfirm}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
          >
            {saving ? '기록 중...' : '자가진단 대장 등록'}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * R&D 연구일지 AI 결재선 프리뷰 카드
 */
function RndLogPreviewCard({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      setData(JSON.parse(tagContent));
    } catch (e) {
      console.error(e);
    }
  }, [tagContent]);

  if (!data) return <div className="text-rose-500 font-bold p-2">일지 초안 데이터를 읽을 수 없습니다.</div>;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/rnd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'log_add',
          data: {
            author_id: data.author_id || 3, // 박영희
            work_date: data.work_date || new Date().toISOString().slice(0, 10),
            raw_source: data.raw_source || 'VOICE',
            raw_content: data.raw_content || '',
            ai_generated_title: data.ai_generated_title,
            ai_generated_content: data.ai_generated_content,
            approval_status: 'PENDING'
          }
        })
      }).then(r => r.json());

      if (res.success) {
        setSaved(true);
        onConfirmSuccess('연구일지가 성공적으로 작성되어 소장 결재 승인 대기열에 상신되었습니다.');
      } else {
        alert(res.error || '상신 실패');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-indigo-100 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50/30 px-4 py-3 border-b border-indigo-50 flex items-center gap-2">
        <Sparkles size={14} className="text-indigo-600" />
        <span className="text-xs font-black text-slate-800">이지봇 AI 연구일지 상신</span>
      </div>
      <div className="p-4 space-y-2 text-[11px]">
        <p className="font-bold text-slate-800 text-xs">과제: {data.ai_generated_title}</p>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] text-slate-500 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto font-medium">
          {data.ai_generated_content}
        </div>
      </div>
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-end">
        {saved ? (
          <span className="text-green-600 text-xs font-bold flex items-center gap-1"><Check size={12} /> 결재 상신 완료</span>
        ) : (
          <button 
            onClick={handleConfirm}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
          >
            {saving ? '상신 중...' : '소장 결재 요청'}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * AI 병가 진단서 OCR 구조화 데이터를 파싱하여 인라인 수동 보정 및 근태 관리 병가 자동 상신을 수행하는 프리미엄 카드 컴포넌트
 */
function MedicalPreviewCard({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [medical, setMedical] = useState<any>(null);
  const [patientName, setPatientName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysSpent, setDaysSpent] = useState(0);
  const [operatorId, setOperatorId] = useState('');
  const [operatorsList, setOperatorsList] = useState<any[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      setMedical(parsed);
      setPatientName(parsed.patientName || '');
      setDiagnosis(parsed.diagnosis || '');
      setStartDate(parsed.startDate || '');
      setEndDate(parsed.endDate || '');
      setDaysSpent(Number(parsed.daysSpent) || 0);
      setOperatorsList(parsed.operatorsList || []);
      
      if (parsed.matchedOperatorId) {
        setOperatorId(String(parsed.matchedOperatorId));
      }
    } catch (err) {
      console.error('진단서 태그 파싱 실패:', err);
    }
  }, [tagContent]);

  // 시작일 및 종료일 변경 시 사용 일수(daysSpent) 자동 계산 기능
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 당일 포함
      if (!isNaN(diffDays) && diffDays > 0) {
        setDaysSpent(diffDays);
      }
    }
  }, [startDate, endDate]);

  if (!medical) return <div className="text-rose-500 font-bold p-2 text-xs">진단서 데이터를 파싱하지 못했습니다.</div>;

  const handleConfirmSubmit = async () => {
    if (!operatorId) {
      alert('병가를 신청할 직원을 목록에서 선택해 주세요.');
      return;
    }
    if (!startDate || !endDate) {
      alert('병가 기간을 올바르게 선택해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'MEDICAL_CERTIFICATE',
          operatorId,
          data: {
            diagnosis,
            startDate,
            endDate,
            daysSpent,
            medical_certificate_path: medical.medical_certificate_path || ''
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setSaved(true);
        onConfirmSuccess(data.message);
      } else {
        alert(data.error || '병가 신청 상신 처리에 실패했습니다.');
      }
    } catch (err: any) {
      alert('서버 등록 통신 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-violet-100 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      {/* 카드 헤더 */}
      <div className="bg-gradient-to-r from-violet-50/50 to-fuchsia-50/30 px-4 py-3 border-b border-violet-50 flex items-center gap-2">
        <Sparkles size={14} className="text-violet-600 animate-pulse" />
        <span className="text-xs font-black text-slate-800">이지봇 AI 진단서 분석 리포트</span>
      </div>

      {/* 정보 입력 및 보정 양식 */}
      <div className="p-4 space-y-3 text-[11px]">
        {/* 환자명 (OCR 상의 이름) */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><User size={10} />환자 성명 (진단서 기재)</label>
          <input 
            type="text" 
            value={patientName} 
            readOnly
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-100 font-bold"
          />
        </div>

        {/* 🏢 직원 수동 매칭 드롭다운 */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1">🏢 병가 상신 대상 직원 매칭</label>
          <div className="flex gap-1.5 items-center">
            <select
              value={operatorId}
              onChange={e => setOperatorId(e.target.value)}
              disabled={saving || saved}
              className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-50/20 font-bold text-xs cursor-pointer"
            >
              <option value="">-- 직원을 선택해 주세요 --</option>
              {operatorsList.map((op: any) => (
                <option key={op.id} value={op.id}>{op.name} (ID: {op.id})</option>
              ))}
            </select>
            {operatorId ? (
              <span className="shrink-0 bg-violet-50 border border-violet-100 text-violet-600 px-2 py-0.5 rounded-full text-[9px] font-black">매칭완료</span>
            ) : (
              <span className="shrink-0 bg-amber-50 border border-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[9px] font-black">미매칭</span>
            )}
          </div>
        </div>

        {/* 진단명 */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold">🩺 진단명 / 병명</label>
          <input 
            type="text" 
            value={diagnosis} 
            onChange={e => setDiagnosis(e.target.value)}
            disabled={saving || saved}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-50/20 font-bold text-xs"
          />
        </div>

        {/* 병가 기간 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><Calendar size={10} />병가 시작일</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              disabled={saving || saved}
              className="w-full px-1.5 py-1 border border-slate-200 rounded-lg focus:outline-none bg-slate-50/20 font-bold text-[10px] cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><Calendar size={10} />병가 종료일</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              disabled={saving || saved}
              className="w-full px-1.5 py-1 border border-slate-200 rounded-lg focus:outline-none bg-slate-50/20 font-bold text-[10px] cursor-pointer"
            />
          </div>
        </div>

        {/* 사용 일수 */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold">📊 총 신청 일수 (일)</label>
          <input 
            type="number" 
            value={daysSpent} 
            onChange={e => setDaysSpent(Number(e.target.value))}
            disabled={saving || saved}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-50/20 font-bold font-mono text-xs"
          />
        </div>

        {/* 실물 파일 연결 표시 */}
        {medical.medical_certificate_path && (
          <div className="mt-2 text-[9px] text-slate-400 flex items-center gap-1">
            <span>📄 진단서 실물 증빙 파일:</span>
            <a href={medical.medical_certificate_path} target="_blank" rel="noreferrer" className="text-violet-600 underline font-bold hover:text-violet-850">
              [실물 파일 열기]
            </a>
          </div>
        )}
      </div>

      {/* 최종 확정 액션 버튼 */}
      <div className="px-4 py-3 bg-slate-50 border-t border-violet-50 flex items-center justify-end">
        {saved ? (
          <div className="text-emerald-600 font-extrabold text-xs flex items-center gap-1.5 py-1.5 w-full justify-center">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            병가 자동 결재 상신 완료!
          </div>
        ) : (
          <button
            onClick={handleConfirmSubmit}
            disabled={saving}
            className="w-full py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer border-none"
            style={{ backgroundColor: '#7c3aed' }}
          >
            {saving ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                결재 상신 중...
              </>
            ) : (
              <>
                <Send size={12} />
                병가 신청서 결재 자동 상신 📄
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
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

/**
 * AI 영수증 OCR 데이터를 파싱하여 인라인 수동 보정 및 확정 등록을 수행하는 영수증 프리뷰 카드 컴포넌트
 */
function ReceiptPreviewMessage({ tagContent }: { tagContent: string }) {
  const [receipt, setReceipt] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('법인카드');
  const [memo, setMemo] = useState('');
  const [payee, setPayee] = useState('');
  
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedMainCat, setSelectedMainCat] = useState('판매비와관리비');
  const [selectedMidCat, setSelectedMidCat] = useState('복리후생비');
  const [selectedSubCat, setSelectedSubCat] = useState('직원식대');
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 1. 카테고리 정보 로드
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch('/api/expenses/categories');
        const json = await res.json();
        if (json.success) {
          setDbCategories(json.categories);
        }
      } catch (err) {
        console.error('이지봇 영수증 카테고리 로드 실패:', err);
      }
    };
    fetchCats();
  }, []);

  // 2. 3단계 카테고리 구조 동적 빌딩
  const ACCOUNT_CATEGORIES = useMemo(() => {
    const structure: Record<string, Record<string, string[]>> = {};
    if (!dbCategories || dbCategories.length === 0) {
      return {
        "판매비와관리비": {
          "복리후생비": ["직원식대", "직원야근식대", "음료및간식비"]
        }
      };
    }
    dbCategories.forEach(cat => {
      const main = cat.main_category;
      const mid = cat.mid_category;
      const sub = cat.sub_category;
      if (!structure[main]) structure[main] = {};
      if (!structure[main][mid]) structure[main][mid] = [];
      if (!structure[main][mid].includes(sub)) structure[main][mid].push(sub);
    });
    return structure;
  }, [dbCategories]);

  // 3. 수신한 OCR 데이터 파싱 및 초기화
  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      setReceipt(parsed);
      setTitle(parsed.title || '');
      setAmount(parsed.amount ? String(parsed.amount) : '');
      setExpenseDate(parsed.expense_date || new Date().toISOString().slice(0, 10));
      setPaymentMethod(parsed.payment_method || '법인카드');
      setMemo(parsed.memo || '');
      setPayee(parsed.payee || parsed.merchant || '');

      // OCR 카테고리(중분류 수준)의 지능형 소분류 맵핑
      if (parsed.category && dbCategories.length > 0) {
        const OCR_MID_CAT_MAP: Record<string, string> = {
          "복리후생비": "복리후생비",
          "여비교통비": "여비교통비",
          "소모품비": "소모품비",
          "접대비": "접대비(기업업무추진비)",
          "임차료": "지급임차료",
          "세금공과금": "세금과공과",
          "기타": "지급수수료"
        };
        const targetMidCat = OCR_MID_CAT_MAP[parsed.category] || parsed.category;
        const matchedCats = dbCategories.filter(cat => cat.mid_category === targetMidCat);

        if (matchedCats.length > 0) {
          const titleLower = (parsed.title || '').toLowerCase();
          let subCat = matchedCats[0].sub_category;
          
          if (targetMidCat === "복리후생비") {
            if (titleLower.includes("음료") || titleLower.includes("커피") || titleLower.includes("간식") || titleLower.includes("라떼")) {
              const found = matchedCats.find(c => c.sub_category === "음료및간식비");
              if (found) subCat = found.sub_category;
            } else if (titleLower.includes("야식") || titleLower.includes("야근")) {
              const found = matchedCats.find(c => c.sub_category === "직원야근식대");
              if (found) subCat = found.sub_category;
            } else if (titleLower.includes("식대") || titleLower.includes("식사")) {
              const found = matchedCats.find(c => c.sub_category === "직원식대");
              if (found) subCat = found.sub_category;
            }
          } else if (targetMidCat === "여비교통비" && titleLower.includes("택시")) {
            const found = matchedCats.find(c => c.sub_category === "택시비");
            if (found) subCat = found.sub_category;
          }
          
          setSelectedSubCat(subCat);
          
          // 역으로 대/중분류 매핑
          for (const mainCat of Object.keys(ACCOUNT_CATEGORIES)) {
            for (const midCat of Object.keys(ACCOUNT_CATEGORIES[mainCat])) {
              if (ACCOUNT_CATEGORIES[mainCat][midCat].includes(subCat)) {
                setSelectedMainCat(mainCat);
                setSelectedMidCat(midCat);
                break;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('영수증 파싱 실패:', err);
    }
  }, [tagContent, dbCategories, ACCOUNT_CATEGORIES]);

  const handleMainCatChange = (mainCat: string) => {
    setSelectedMainCat(mainCat);
    const midCats = Object.keys(ACCOUNT_CATEGORIES[mainCat] || {});
    if (midCats.length > 0) {
      const firstMid = midCats[0];
      setSelectedMidCat(firstMid);
      const subCats = ACCOUNT_CATEGORIES[mainCat][firstMid] || [];
      if (subCats.length > 0) setSelectedSubCat(subCats[0]);
    }
  };

  const handleMidCatChange = (midCat: string) => {
    setSelectedMidCat(midCat);
    const subCats = ACCOUNT_CATEGORIES[selectedMainCat][midCat] || [];
    if (subCats.length > 0) setSelectedSubCat(subCats[0]);
  };

  const handleConfirmSubmit = async () => {
    if (!title || !amount) {
      alert('적요와 금액은 필수 입력 항목입니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category: selectedSubCat,
          amount: Number(amount),
          expense_date: expenseDate,
          payment_method: paymentMethod,
          memo,
          payee,
          requisition_date: expenseDate,
          ai_analysis: JSON.stringify({ ocrParsed: true, source: 'EASYBOT_OCR' })
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
      } else {
        alert(data.error || '지출 내역 등록 처리에 실패했습니다.');
      }
    } catch (err: any) {
      alert('지출 등록 통신 에러: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!receipt) return <div className="text-rose-500 font-bold p-2 text-xs">영수증 데이터를 파싱하지 못했습니다.</div>;

  return (
    <div className="my-3 border border-rose-100 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-r from-rose-50/50 to-pink-50/30 px-4 py-3 border-b border-rose-50 flex items-center gap-2">
        <Sparkles size={14} className="text-rose-500 animate-pulse" />
        <span className="text-xs font-black text-slate-800">이지봇 AI 영수증 분석 리포트</span>
      </div>

      <div className="p-4 space-y-3 text-[11px]">
        {/* 적요 */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><FileText size={10} />적요 (지출 용도)</label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            disabled={saving || saved}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50/20 font-bold text-xs"
          />
        </div>

        {/* 3단 계정과목 */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="space-y-1">
            <label className="text-[9px] text-slate-450 font-extrabold">대분류</label>
            <select
              value={selectedMainCat}
              onChange={e => handleMainCatChange(e.target.value)}
              disabled={saving || saved}
              className="w-full px-1 py-1.5 border border-slate-200 rounded-lg bg-slate-50/20 font-bold text-[10px] cursor-pointer"
            >
              {Object.keys(ACCOUNT_CATEGORIES).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-slate-450 font-extrabold">중분류</label>
            <select
              value={selectedMidCat}
              onChange={e => handleMidCatChange(e.target.value)}
              disabled={saving || saved}
              className="w-full px-1 py-1.5 border border-slate-200 rounded-lg bg-slate-50/20 font-bold text-[10px] cursor-pointer"
            >
              {Object.keys(ACCOUNT_CATEGORIES[selectedMainCat] || {}).map(mid => (
                <option key={mid} value={mid}>{mid}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-slate-450 font-extrabold">소분류</label>
            <select
              value={selectedSubCat}
              onChange={e => setSelectedSubCat(e.target.value)}
              disabled={saving || saved}
              className="w-full px-1 py-1.5 border border-slate-200 rounded-lg bg-slate-50/20 font-bold text-[10px] cursor-pointer"
            >
              {(ACCOUNT_CATEGORIES[selectedMainCat]?.[selectedMidCat] || []).map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 금액 및 날짜 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><DollarSign size={10} />지출 금액 (원)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              disabled={saving || saved}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50/20 font-bold font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><Calendar size={10} />품의 일자</label>
            <input 
              type="date" 
              value={expenseDate} 
              onChange={e => setExpenseDate(e.target.value)}
              disabled={saving || saved}
              className="w-full px-1 py-1 border border-slate-200 rounded-lg focus:outline-none bg-slate-50/20 font-bold text-[10px] cursor-pointer"
            />
          </div>
        </div>

        {/* 결제 수단 및 가맹점 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><Phone size={10} />결제 수단</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              disabled={saving || saved}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50/20 font-bold text-[10px] cursor-pointer"
            >
              {["법인카드", "개인신용카드", "계좌송금", "현금", "기타"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1">🏢 가맹점/상호명</label>
            <input 
              type="text" 
              value={payee} 
              onChange={e => setPayee(e.target.value)}
              disabled={saving || saved}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50/20 font-bold text-xs"
            />
          </div>
        </div>

        {/* 비고(태그) */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><Plus size={10} />비고 (지출 태그)</label>
          <input 
            type="text" 
            value={memo} 
            onChange={e => setMemo(e.target.value)}
            disabled={saving || saved}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50/20 font-bold text-xs"
          />
        </div>

        {/* 등록 버튼 */}
        <div className="pt-1.5">
          {saved ? (
            <div className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-center border border-emerald-100 flex items-center justify-center gap-1 text-xs">
              <Check size={14} className="shrink-0" /> 지출결의서 등록이 완료되었습니다!
            </div>
          ) : (
            <button
              onClick={handleConfirmSubmit}
              disabled={saving}
              className="w-full py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-black shadow-md shadow-rose-500/10 cursor-pointer border-none flex items-center justify-center gap-1 transition-all text-xs"
            >
              {saving ? '장부 적재 중...' : '지출결의서 장부 즉시 등록'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * AI 사업자등록증 OCR 구조화 데이터를 파싱하여 인라인 수동 보정 및 국세청 2중 검증 확정 등록을 수행하는 프리미엄 카드 컴포넌트
 */
function InboundPreviewMessage({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [inboundData, setInboundData] = useState<any>(null);
  const [partnerName, setPartnerName] = useState('');
  const [inboundDate, setInboundDate] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [pdfFilePath, setPdfFilePath] = useState('');
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 컴포넌트 마운트 시 기존 재고 리스트 로드
  useEffect(() => {
    async function fetchInventory() {
      try {
        const response = await fetch('/api/inventory');
        const resJson = await response.json();
        if (resJson.success && resJson.data) {
          setInventoryList(resJson.data);
        }
      } catch (err) {
        console.error('기존 재고 목록 로드 에러:', err);
      }
    }
    fetchInventory();
  }, []);

  // 태그 컨텐츠 파싱 및 초기화
  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      setInboundData(parsed);
      const ocrData = parsed.data || {};
      setPartnerName(ocrData.partnerName || '');
      setInboundDate(ocrData.inboundDate || new Date().toISOString().slice(0, 10));
      setPdfFilePath(parsed.pdfFilePath || '');
      
      const parsedItems = (ocrData.items || []).map((item: any) => {
        let matchedId = 'NEW';
        if (item.barcode) {
          const matchedByBarcode = inventoryList.find(i => i.barcode === item.barcode);
          if (matchedByBarcode) {
            matchedId = String(matchedByBarcode.id);
          }
        }
        if (matchedId === 'NEW' && item.itemName) {
          const matchedByName = inventoryList.find(i => i.name === item.itemName);
          if (matchedByName) {
            matchedId = String(matchedByName.id);
          }
        }
        return {
          ...item,
          matchedItemId: matchedId
        };
      });
      setItems(parsedItems);
    } catch (err: any) {
      console.error('거래명세서 태그 파싱 실패:', err);
    }
  }, [tagContent, inventoryList]);

  // 실시간으로 인벤토리 리스트가 불러와졌을 때, 기존 아이템에 매칭 업데이트
  useEffect(() => {
    if (inventoryList.length > 0 && items.length > 0 && items.every(item => item.matchedItemId === 'NEW')) {
      const updated = items.map((item: any) => {
        let matchedId = 'NEW';
        if (item.barcode) {
          const matchedByBarcode = inventoryList.find(i => i.barcode === item.barcode);
          if (matchedByBarcode) {
            matchedId = String(matchedByBarcode.id);
          }
        }
        if (matchedId === 'NEW' && item.itemName) {
          const matchedByName = inventoryList.find(i => i.name === item.itemName);
          if (matchedByName) {
            matchedId = String(matchedByName.id);
          }
        }
        return { ...item, matchedItemId: matchedId };
      });
      setItems(updated);
    }
  }, [inventoryList]);

  if (!inboundData) return <div className="text-rose-500 font-bold p-2 text-xs">거래명세서 데이터를 파싱하지 못했습니다.</div>;

  const handleItemFieldChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setItems(newItems);
  };

  const handleConfirmSubmit = async () => {
    if (items.length === 0) {
      alert('입고할 품목이 존재하지 않습니다.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'INVENTORY_INBOUND',
          partnerName,
          inboundDate,
          items,
          pdfFilePath
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setSaved(true);
        onConfirmSuccess(resData.message);
      } else {
        alert(resData.error || '자율 입고 처리에 실패했습니다.');
      }
    } catch (err: any) {
      alert('서버 등록 통신 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-blue-100 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-r from-blue-50/50 to-cyan-50/30 px-4 py-3 border-b border-blue-50 flex items-center gap-2">
        <span className="p-1 rounded bg-blue-100 text-blue-600">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </span>
        <span className="text-xs font-black text-slate-800">지능형 자율 입고 OCR 파이프라인</span>
      </div>

      <div className="p-4 space-y-3 text-[11px]">
        {/* 공급처 및 날짜 설정 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">공급처(거래처)</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-blue-500"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              disabled={saved || saving}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">입고 일자</label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-blue-500"
              value={inboundDate}
              onChange={(e) => setInboundDate(e.target.value)}
              disabled={saved || saving}
            />
          </div>
        </div>

        {/* 품목 리스트 테이블 */}
        <div className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
          <div className="bg-slate-100/60 px-2 py-1 font-bold text-slate-600 border-b border-slate-100 flex justify-between">
            <span>스캔 품목 목록</span>
            <span>총 {items.length}건</span>
          </div>
          <div className="max-h-[160px] overflow-y-auto divide-y divide-slate-100">
            {items.map((item, idx) => (
              <div key={idx} className="p-2 space-y-1.5 bg-white">
                <div className="flex justify-between items-center gap-1.5">
                  <span className="font-bold text-slate-700 truncate w-1/2">{item.itemName}</span>
                  <span className="text-slate-400 truncate text-[9px]">{item.spec || '규격 없음'}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="text-[9px] text-slate-400">수량</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-center text-slate-800"
                      value={item.quantity || 0}
                      onChange={(e) => handleItemFieldChange(idx, 'quantity', Number(e.target.value))}
                      disabled={saved || saving}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">단가</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-center text-slate-800"
                      value={item.price || 0}
                      onChange={(e) => handleItemFieldChange(idx, 'price', Number(e.target.value))}
                      disabled={saved || saving}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">바코드</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-center text-slate-800 truncate"
                      value={item.barcode || ''}
                      onChange={(e) => handleItemFieldChange(idx, 'barcode', e.target.value)}
                      disabled={saved || saving}
                    />
                  </div>
                </div>

                {/* 매칭 대상 드롭다운 */}
                <div className="pt-1.5 border-t border-slate-50">
                  <label className="block text-[9px] text-slate-400 mb-0.5">매칭할 재고 품목</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none focus:border-blue-500"
                    value={item.matchedItemId}
                    onChange={(e) => handleItemFieldChange(idx, 'matchedItemId', e.target.value)}
                    disabled={saved || saving}
                  >
                    <option value="NEW">➕ 신규 품목으로 자동 등록</option>
                    {inventoryList.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} ({inv.spec || '스펙없음'}) [재고: {inv.stock}개]
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {pdfFilePath && (
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">첨부 증빙 파일:</span>
            <a
              href={pdfFilePath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-bold hover:underline truncate max-w-[180px]"
            >
              📄 {pdfFilePath.split('/').pop()}
            </a>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="pt-2 border-t border-slate-50 flex gap-2">
          {saved ? (
            <div className="w-full text-center py-2 px-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 font-black flex items-center justify-center gap-1.5 animate-in fade-in duration-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              자율 재고 입고 확정 완료!
            </div>
          ) : (
            <button
              onClick={handleConfirmSubmit}
              disabled={saving}
              className="w-full py-2 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50 text-xs shadow-md shadow-blue-200/50 cursor-pointer"
            >
              {saving ? '⚡ 재고 적재 중...' : '📥 원터치 자율 재고 입고 확정'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FinancialStatementPreviewMessage({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [finData, setFinData] = useState(null);
  const [partnerId, setPartnerId] = useState('');
  const [companyType, setCompanyType] = useState('PARTNER');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear() - 1);
  const [fiscalQuarter, setFiscalQuarter] = useState('YR');
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [totalEquity, setTotalEquity] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [operatingIncome, setOperatingIncome] = useState(0);
  const [netIncome, setNetIncome] = useState(0);
  const [pdfFilePath, setPdfFilePath] = useState('');
  const [parsedRawJson, setParsedRawJson] = useState(null);
  const [partnersList, setPartnersList] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      setFinData(parsed);
      const ocrData = parsed.data || {};
      setPartnerId(parsed.partnerId || '');
      setCompanyType(parsed.companyType || 'PARTNER');
      setFiscalYear(ocrData.fiscalYear || new Date().getFullYear() - 1);
      setFiscalQuarter(ocrData.fiscalQuarter || 'YR');
      setTotalAssets(ocrData.totalAssets || 0);
      setTotalLiabilities(ocrData.totalLiabilities || 0);
      setTotalEquity(ocrData.totalEquity || 0);
      setRevenue(ocrData.revenue || 0);
      setOperatingIncome(ocrData.operatingIncome || 0);
      setNetIncome(ocrData.netIncome || 0);
      setPdfFilePath(parsed.pdfFilePath || '');
      setParsedRawJson(ocrData.parsedRawJson || null);
      setPartnersList(parsed.partnersList || []);
    } catch (err: any) {
      console.error('재무제표 태그 파싱 실패:', err);
    }
  }, [tagContent]);

  if (!finData) return <div className="text-rose-500 font-bold p-2 text-xs">재무제표 데이터를 파싱하지 못했습니다.</div>;

  const handlePartnerChange = (selectedId: string) => {
    setPartnerId(selectedId);
    const matched = partnersList.find(p => p.id === selectedId);
    if (matched) {
      setCompanyType(matched.type);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!partnerId) {
      alert('대상 회사(본사 또는 거래처)를 선택해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'FINANCIAL_STATEMENT',
          partnerId,
          companyType,
          pdfFilePath,
          data: {
            fiscalYear: Number(fiscalYear),
            fiscalQuarter,
            totalAssets: Number(totalAssets),
            totalLiabilities: Number(totalLiabilities),
            totalEquity: Number(totalEquity),
            revenue: Number(revenue),
            operatingIncome: Number(operatingIncome),
            netIncome: Number(netIncome),
            parsedRawJson
          }
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setSaved(true);
        onConfirmSuccess(resData.message);
      } else {
        alert(resData.error || '재무제표 적재 처리에 실패했습니다.');
      }
    } catch (err: any) {
      alert('서버 등록 통신 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-purple-100 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/30 px-4 py-3 border-b border-purple-50 flex items-center gap-2">
        <Sparkles size={14} className="text-purple-600 animate-pulse" />
        <span className="text-xs font-black text-slate-800">이지봇 AI 재무제표 스캔 리포트</span>
      </div>

      <div className="p-4 space-y-3 text-[11px]">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1">🏢 대상 기업 매칭</label>
          <select
            value={partnerId}
            onChange={e => handlePartnerChange(e.target.value)}
            disabled={saving || saved}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50/20 font-bold text-xs cursor-pointer focus:ring-1 focus:ring-purple-500 focus:outline-none"
          >
            <option value="">-- 회사를 선택하세요 --</option>
            {partnersList.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.companyName} {p.type === 'MY_COMPANY' ? '(본사)' : '(거래처)'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold">📅 회계 연도</label>
            <input 
              type="number" 
              value={fiscalYear} 
              onChange={e => setFiscalYear(Number(e.target.value))}
              disabled={saving || saved}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-slate-50/20 font-bold font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold">📊 구분</label>
            <select
              value={fiscalQuarter}
              onChange={e => setFiscalQuarter(e.target.value)}
              disabled={saving || saved}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50/20 font-bold text-xs cursor-pointer focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              <option value="YR">결산 (YR)</option>
              <option value="Q1">1분기 (Q1)</option>
              <option value="Q2">2분기 (Q2)</option>
              <option value="Q3">3분기 (Q3)</option>
              <option value="Q4">4분기 (Q4)</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 my-2 pt-2">
          <p className="font-extrabold text-[10px] text-purple-700 mb-2">💰 AI 파싱 핵심 6대 지표 수치 (보정 가능)</p>
          
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500 w-16 font-bold">자산총계</span>
              <input
                type="number"
                value={totalAssets}
                onChange={e => setTotalAssets(Number(e.target.value))}
                disabled={saving || saved}
                className="flex-1 px-2 py-1 border border-slate-200 rounded font-mono font-bold text-right text-[10px] focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500 w-16 font-bold">부채총계</span>
              <input
                type="number"
                value={totalLiabilities}
                onChange={e => setTotalLiabilities(Number(e.target.value))}
                disabled={saving || saved}
                className="flex-1 px-2 py-1 border border-slate-200 rounded font-mono font-bold text-right text-[10px] focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500 w-16 font-bold">자본총계</span>
              <input
                type="number"
                value={totalEquity}
                onChange={e => setTotalEquity(Number(e.target.value))}
                disabled={saving || saved}
                className="flex-1 px-2 py-1 border border-slate-200 rounded font-mono font-bold text-right text-[10px] focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500 w-16 font-bold">매출액</span>
              <input
                type="number"
                value={revenue}
                onChange={e => setRevenue(Number(e.target.value))}
                disabled={saving || saved}
                className="flex-1 px-2 py-1 border border-slate-200 rounded font-mono font-bold text-right text-[10px] focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500 w-16 font-bold">영업이익</span>
              <input
                type="number"
                value={operatingIncome}
                onChange={e => setOperatingIncome(Number(e.target.value))}
                disabled={saving || saved}
                className="flex-1 px-2 py-1 border border-slate-200 rounded font-mono font-bold text-right text-[10px] focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500 w-16 font-bold">당기순이익</span>
              <input
                type="number"
                value={netIncome}
                onChange={e => setNetIncome(Number(e.target.value))}
                disabled={saving || saved}
                className="flex-1 px-2 py-1 border border-slate-200 rounded font-mono font-bold text-right text-[10px] focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {parsedRawJson && (
          <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-2.5 text-[9px] text-purple-800 leading-relaxed font-bold">
            <span className="block font-black text-[10px] text-purple-700">✓ 세부 계정과목 트리 백업 완료</span>
            <span className="block text-slate-400 mt-1">대차대조표/손익계산서 세부 항목들이 백업되어, 이지봇 대화방 RAG RDB 자연어 분석 시 백그라운드 지식으로 탑재됩니다.</span>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 border-t border-slate-100 pt-3 flex gap-2">
        {saved ? (
          <div className="w-full py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-bold text-center text-[11px] flex items-center justify-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            재무제표 DB 최종 적재 완료!
          </div>
        ) : (
          <button
            type="button"
            disabled={saving || !partnerId || !fiscalYear}
            onClick={handleConfirmSubmit}
            className={`w-full py-2.5 rounded-xl text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-3xs cursor-pointer ${
              !partnerId || !fiscalYear
                ? 'bg-slate-200 text-slate-400 border-none cursor-not-allowed shadow-none'
                : 'bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/10'
            }`}
          >
            {saving ? (
              <>
                <RefreshCw size={11} className="animate-spin" />
                <span>데이터 적재 처리 중...</span>
              </>
            ) : (
              <span>재무제표 원터치 DB 적재 🚀</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}


function LicensePreviewMessage({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [license, setLicense] = useState<any>(null);
  const [companyName, setCompanyName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [representative, setRepresentative] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [memo, setMemo] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      setLicense(parsed);
      const ocrData = parsed.data || {};
      setCompanyName(ocrData.companyName || '');
      setBusinessNumber(ocrData.businessNumber || '');
      setRepresentative(ocrData.representative || '');
      setAddress(ocrData.address || '');
      setPhone(ocrData.phone || '');
      setManagerName(ocrData.managerName || '');
      setMemo(ocrData.memo || '');
    } catch (err) {
      console.error('사업자등록증 태그 파싱 실패:', err);
    }
  }, [tagContent]);

  if (!license) return <div className="text-rose-500 font-bold p-2 text-xs">사업자등록증 데이터를 파싱하지 못했습니다.</div>;

  const status = license.status;
  const checksum = license.checksum || { isValid: true, message: '' };
  const nts = license.nts || { isValidated: false, status: 'UNKNOWN', statusText: '' };
  const existingId = license.existingId;

  const handleConfirmSubmit = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'BUSINESS_LICENSE',
          status,
          existingId,
          data: {
            companyName,
            businessNumber,
            representative,
            address,
            phone,
            managerName,
            memo
          }
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setSaved(true);
        onConfirmSuccess(resData.message);
      } else {
        alert(resData.error || '사업자등록증 DB 저장 처리에 실패했습니다.');
      }
    } catch (err: any) {
      alert('서버 등록 통신 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const isBlocked = !checksum.isValid || nts.status === 'CLOSED' || nts.status === 'NOT_FOUND';

  return (
    <div className="my-3 border border-indigo-100 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      {/* 카드 헤더 */}
      <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/30 px-4 py-3 border-b border-indigo-50 flex items-center gap-2">
        <Sparkles size={14} className="text-emerald-600 animate-pulse" />
        <span className="text-xs font-black text-slate-800">이지봇 AI 사업자등록증 리포트</span>
      </div>

      {/* 2중 국세청 검증 가이드 바 */}
      <div className="px-4 pt-3 shrink-0">
        <div className={`p-2.5 rounded-xl border text-[10px] font-bold space-y-1 ${
          isBlocked
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : nts.status === 'SUSPENDED'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : nts.status === 'ACTIVE'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center justify-between pb-1 border-b border-slate-100/50 font-black">
            <span className="flex items-center gap-1">🛡️ 국세청 실시간 진위 검증</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase ${
              isBlocked
                ? 'bg-rose-500 text-white'
                : nts.status === 'SUSPENDED'
                ? 'bg-amber-500 text-white'
                : nts.status === 'ACTIVE'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-200 text-slate-500'
            }`}>
              {!checksum.isValid
                ? '체크섬 오류'
                : nts.status === 'CLOSED'
                ? '폐업'
                : nts.status === 'SUSPENDED'
                ? '휴업'
                : nts.status === 'ACTIVE'
                ? '정상가동'
                : '미확인'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[9px] text-slate-450">
            <span>1차 체계 검증 (Checksum)</span>
            <span className={checksum.isValid ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>{checksum.message}</span>
          </div>
          <div className="flex justify-between items-start text-[9px] text-slate-450 gap-2">
            <span>2차 국세청 실시간 가동 상태</span>
            <span className={`text-right ${nts.status === 'ACTIVE' ? 'text-emerald-600 font-extrabold' : isBlocked ? 'text-rose-600 font-extrabold' : 'text-slate-650'}`}>{nts.statusText}</span>
          </div>
        </div>
      </div>

      {/* 정보 입력 및 보정 양식 */}
      <div className="p-4 space-y-3 text-[11px]">
        {/* 상호 및 등록번호 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1">🏢 상호 (회사명)</label>
            <input 
              type="text" 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)}
              disabled={saving || saved || isBlocked}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/20 font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1">🔢 사업자번호</label>
            <input 
              type="text" 
              value={businessNumber} 
              onChange={e => setBusinessNumber(e.target.value)}
              disabled={saving || saved || isBlocked}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/20 font-bold font-mono"
            />
          </div>
        </div>

        {/* 대표자 및 주소 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><User size={10} />대표자 성함</label>
            <input 
              type="text" 
              value={representative} 
              onChange={e => setRepresentative(e.target.value)}
              disabled={saving || saved || isBlocked}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/20 font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1"><Phone size={10} />대표 연락처</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              disabled={saving || saved || isBlocked}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/20 font-bold"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1">📍 본점 소재 주소</label>
          <input 
            type="text" 
            value={address} 
            onChange={e => setAddress(e.target.value)}
            disabled={saving || saved || isBlocked}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/20 font-bold text-xs"
          />
        </div>

        {/* B2B 매칭 플래그 가이드 */}
        {status === 'UPDATE_PARTNER' && license.diff && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 space-y-1.5 text-[9px] text-amber-800 leading-relaxed font-bold">
            <span className="block font-black text-[10px]">⚠️ 대표자/주소 변동 사항 감지</span>
            <div className="divide-y divide-amber-100/50">
              {license.diff.companyName.changed && <div>• 상호명: {license.diff.companyName.old} ➡️ {companyName}</div>}
              {license.diff.representative.changed && <div>• 대표자: {license.diff.representative.old} ➡️ {representative}</div>}
              {license.diff.address.changed && <div>• 주소: {license.diff.address.old} ➡️ {address}</div>}
            </div>
            <span className="block text-slate-400 mt-1">※ 기존 누적 거래 실적은 100% 보존되며, 메모 열에 옛 정보가 누적 보관됩니다.</span>
          </div>
        )}

        {status === 'ALREADY_REGISTERED' && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 text-[9px] text-blue-700 font-extrabold">
            🟢 이미 동일 정보로 등록이 완료된 중복 거래처입니다.
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="px-4 pb-4 border-t border-slate-100 pt-3 flex gap-2">
        {saved ? (
          <div className="w-full py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-bold text-center text-[11px]">
            B2B 거래처 등록 및 2중 검증 완료!
          </div>
        ) : (
          <button
            type="button"
            disabled={saving || isBlocked}
            onClick={handleConfirmSubmit}
            className={`w-full py-2.5 rounded-xl text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-3xs cursor-pointer ${
              isBlocked
                ? 'bg-slate-200 text-slate-400 border-none cursor-not-allowed shadow-none'
                : status === 'UPDATE_PARTNER'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/10'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {saving ? (
              <>
                <RefreshCw size={11} className="animate-spin" />
                <span>B2B 원터치 가동 중...</span>
              </>
            ) : isBlocked ? (
              <span>부적격 사업자 (등록 불가)</span>
            ) : status === 'UPDATE_PARTNER' ? (
              <span>기존 바이어 변동 갱신 승인 ⚡</span>
            ) : (
              <span>B2B 신규 바이어 등록 승인 🚀</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function PurchaseInvoicePreviewMessage({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [partnerId, setPartnerId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [pdfFilePath, setPdfFilePath] = useState('');
  const [trackedItemsList, setTrackedItemsList] = useState<any[]>([]);
  const [partnersList, setPartnersList] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      setInvoiceData(parsed);
      const ocrData = parsed.data || {};
      setPartnerId(parsed.partnerId || '');
      setCompanyName(ocrData.companyName || '');
      setInvoiceDate(ocrData.invoiceDate || new Date().toISOString().slice(0, 10));
      setPdfFilePath(ocrData.pdfFilePath || '');
      setTrackedItemsList(parsed.trackedItemsList || []);
      setPartnersList(parsed.partnersList || []);
      
      const parsedItems = (ocrData.items || []).map((item: any) => ({
        itemName: item.itemName || '',
        spec: item.spec || '',
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        amount: Number(item.amount) || 0,
        matched_item_id: item.matched_item_id ? String(item.matched_item_id) : ''
      }));
      setItems(parsedItems);
    } catch (err: any) {
      console.error('매입 명세서 태그 파싱 실패:', err);
    }
  }, [tagContent]);

  if (!invoiceData) return <div className="text-rose-500 font-bold p-2 text-xs">매입 명세서 데이터를 파싱하지 못했습니다.</div>;

  const handlePartnerChange = (selectedId: string) => {
    setPartnerId(selectedId);
    const matched = partnersList.find(p => p.id === selectedId);
    if (matched) {
      setCompanyName(matched.companyName);
    }
  };

  const handleItemFieldChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? Number(value) : Number(newItems[index].quantity);
      const price = field === 'unitPrice' ? Number(value) : Number(newItems[index].unitPrice);
      newItems[index].amount = qty * price;
    }
    setItems(newItems);
  };

  const handleConfirmSubmit = async () => {
    if (items.length === 0) {
      alert('등록할 매입 품목이 존재하지 않습니다.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'PURCHASE_INVOICE',
          items: items.map(it => ({
            ...it,
            matched_item_id: it.matched_item_id ? Number(it.matched_item_id) : null
          }))
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setSaved(true);
        onConfirmSuccess(resData.message);
      } else {
        alert(resData.error || '매입 원가 업데이트 처리에 실패했습니다.');
      }
    } catch (err: any) {
      alert('서버 등록 통신 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-pink-100 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-r from-pink-50/50 to-orange-50/30 px-4 py-3 border-b border-pink-50 flex items-center gap-2">
        <Sparkles size={14} className="text-pink-600 animate-pulse" />
        <span className="text-xs font-black text-slate-800">매입 명세서 OCR 원가 분석 리포트</span>
      </div>

      <div className="p-4 space-y-3 text-[11px]">
        {/* 거래처 및 날짜 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">매입처(거래처)</label>
            <select
              value={partnerId}
              onChange={e => handlePartnerChange(e.target.value)}
              disabled={saving || saved}
              className="w-full px-2 py-1 border border-slate-200 rounded bg-slate-50 text-slate-800 focus:outline-none focus:border-pink-500 font-bold cursor-pointer"
            >
              <option value="">-- 거래처 선택 --</option>
              {partnersList.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.companyName} {p.type === 'MY_COMPANY' ? '(본사)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">매입 일자</label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-pink-500"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              disabled={saved || saving}
            />
          </div>
        </div>

        {/* 품목 목록 */}
        <div className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
          <div className="bg-slate-100/60 px-2 py-1 font-bold text-slate-600 border-b border-slate-100 flex justify-between">
            <span>스캔 품목 목록</span>
            <span>총 {items.length}건</span>
          </div>
          <div className="max-h-[160px] overflow-y-auto divide-y divide-slate-100">
            {items.map((item, idx) => (
              <div key={idx} className="p-2 space-y-1.5 bg-white">
                <div className="flex justify-between items-center gap-1.5">
                  <input
                    type="text"
                    className="font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-pink-500 focus:outline-none w-1/2 text-[11px]"
                    value={item.itemName}
                    onChange={e => handleItemFieldChange(idx, 'itemName', e.target.value)}
                    disabled={saved || saving}
                  />
                  <input
                    type="text"
                    className="text-slate-400 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-pink-500 focus:outline-none text-[9px] w-1/3"
                    value={item.spec}
                    placeholder="규격"
                    onChange={e => handleItemFieldChange(idx, 'spec', e.target.value)}
                    disabled={saved || saving}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="text-[9px] text-slate-400">매입 수량</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-center text-slate-800 font-bold"
                      value={item.quantity || 0}
                      onChange={(e) => handleItemFieldChange(idx, 'quantity', Number(e.target.value))}
                      disabled={saved || saving}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">매입 단가</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-center text-slate-800 font-bold font-mono"
                      value={item.unitPrice || 0}
                      onChange={(e) => handleItemFieldChange(idx, 'unitPrice', Number(e.target.value))}
                      disabled={saved || saving}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">공급 총액</label>
                    <div className="w-full bg-slate-100 rounded px-1.5 py-0.5 text-center text-slate-500 truncate font-mono text-[9px]">
                      {(item.amount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 자사 매핑 대상 드롭다운 */}
                <div className="pt-1.5 border-t border-slate-50">
                  <label className="block text-[9px] text-slate-400 mb-0.5">매핑할 자사 품목</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-750 focus:outline-none focus:border-pink-500 cursor-pointer font-bold"
                    value={item.matched_item_id}
                    onChange={(e) => handleItemFieldChange(idx, 'matched_item_id', e.target.value)}
                    disabled={saved || saving}
                  >
                    <option value="">-- 신규 품목으로 자율 등록 --</option>
                    {trackedItemsList.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {pdfFilePath && (
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">매입 명세서 PDF:</span>
            <a
              href={pdfFilePath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-600 font-bold hover:underline truncate max-w-[180px]"
            >
              📄 {pdfFilePath.split('/').pop()}
            </a>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="pt-2 border-t border-slate-50 flex gap-2">
          {saved ? (
            <div className="w-full text-center py-2 px-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 font-black flex items-center justify-center gap-1.5 animate-in fade-in duration-300">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              매입 원가 동기화 반영 완료!
            </div>
          ) : (
            <button
              onClick={handleConfirmSubmit}
              disabled={saving}
              className="w-full py-2 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold transition disabled:opacity-50 text-xs shadow-md shadow-pink-200/50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {saving ? '⚡ 원가 동기화 반영 중...' : '📥 매입 원가 동기화 승인'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InboundEstimatePreviewMessage({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const router = useRouter();
  const [estimateData, setEstimateData] = useState<any>(null);
  const [partnerId, setPartnerId] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [estimateDate, setEstimateDate] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [pdfFilePath, setPdfFilePath] = useState('');
  const [trackedItemsList, setTrackedItemsList] = useState<any[]>([]);
  const [partnersList, setPartnersList] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [createdEstimateId, setCreatedEstimateId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      setEstimateData(parsed);
      const ocrData = parsed.data || {};
      setPartnerName(ocrData.partnerName || '');
      setPartnerPhone(ocrData.partnerPhone || '');
      setEstimateDate(ocrData.estimateDate || new Date().toISOString().slice(0, 10));
      setPdfFilePath(ocrData.pdfFilePath || '');
      setTrackedItemsList(parsed.trackedItemsList || []);
      setPartnersList(parsed.partnersList || []);
      setPartnerId(parsed.partnerId || '');
      
      const parsedItems = (ocrData.items || []).map((item: any) => ({
        productName: item.productName || item.product_name || item.itemName || '',
        spec: item.spec || '',
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice || item.unit_price) || 0,
        amount: Number(item.amount) || 0,
        matched_item_id: item.matched_item_id ? String(item.matched_item_id) : ''
      }));
      setItems(parsedItems);

      // 총 금액 계산
      const total = parsedItems.reduce((sum: number, it: any) => sum + (it.quantity * it.unitPrice), 0);
      setTotalAmount(total);
    } catch (err: any) {
      console.error('받은 견적서 태그 파싱 실패:', err);
    }
  }, [tagContent]);

  if (!estimateData) return <div className="text-rose-500 font-bold p-2 text-xs">견적서 데이터를 파싱하지 못했습니다.</div>;

  const handleGoToDetail = async () => {
    // 이미 연동 처리되어 estimateId가 발급된 경우 API 호출 없이 바로 모달 팝업/페이지 이동
    if (createdEstimateId) {
      if (typeof window !== "undefined" && window.location.pathname === '/estimates') {
        window.history.replaceState({}, "", `/estimates?detail_id=${createdEstimateId}`);
        window.dispatchEvent(new CustomEvent('open-estimate-detail', { detail: { estimateId: createdEstimateId } }));
      } else {
        router.push(`/estimates?detail_id=${createdEstimateId}`);
      }
      return;
    }

    if (items.length === 0) {
      alert('등록할 견적 품목이 존재하지 않습니다.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'INBOUND_ESTIMATE',
          partnerName,
          partnerPhone,
          estimateDate,
          pdfFilePath,
          items: items.map(it => ({
            ...it,
            matched_item_id: it.matched_item_id ? Number(it.matched_item_id) : null
          }))
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setSaved(true);
        setCreatedEstimateId(resData.estimateId || null);
        onConfirmSuccess(resData.message);
        
        const estId = resData.estimateId;
        if (estId) {
          // 현재 위치가 이미 견적 대장 페이지인 경우 새로고침 없이 즉각 모달 오픈 이벤트 전송
          if (typeof window !== "undefined" && window.location.pathname === '/estimates') {
            window.history.replaceState({}, "", `/estimates?detail_id=${estId}`);
            window.dispatchEvent(new CustomEvent('open-estimate-detail', { detail: { estimateId: estId } }));
          } else {
            // 다른 페이지에 있다면 쿼리 스트링과 함께 라우팅 이동 (마운트 시 자동 감지됨)
            router.push(`/estimates?detail_id=${estId}`);
          }
        } else {
          router.push('/estimates');
        }
      } else {
        alert(resData.error || '견적서 저장 처리에 실패했습니다.');
      }
    } catch (err: any) {
      alert('서버 등록 통신 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-sky-100 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      {/* 카드 헤더 */}
      <div className="bg-gradient-to-r from-sky-50/50 to-blue-50/30 px-4 py-3 border-b border-sky-50 flex items-center gap-2">
        <Sparkles size={14} className="text-sky-600 animate-pulse" />
        <span className="text-xs font-black text-slate-800">받은 견적서 AI OCR 요약 리포트</span>
      </div>

      <div className="p-4 space-y-3.5 text-[11px]">
        {/* 요약 상세 표 */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold">공급처(거래처)</span>
            <span className="text-slate-800 font-black text-right">{partnerName || '미지정'}</span>
          </div>
          {partnerPhone && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold">연락처</span>
              <span className="text-slate-700 font-medium font-mono text-right">{partnerPhone}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold">견적 일자</span>
            <span className="text-slate-700 font-medium text-right">{estimateDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold">총 품목 수</span>
            <span className="text-slate-800 font-bold text-right">{items.length}건</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
            <span className="text-slate-500 font-black">총 견적 금액</span>
            <span className="text-indigo-600 font-extrabold text-xs">{totalAmount.toLocaleString()}원</span>
          </div>
        </div>

        {/* 파일명 표시 */}
        {pdfFilePath && (
          <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100 text-[10px]">
            <span className="text-slate-400 font-bold">견적 파일명:</span>
            <span className="text-slate-600 font-medium truncate max-w-[200px]" title={pdfFilePath.split('/').pop()}>
              📄 {pdfFilePath.split('/').pop()}
            </span>
          </div>
        )}

        {/* 자세히 보기 및 연동 버튼 */}
        <button
          onClick={handleGoToDetail}
          disabled={saving}
          className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black transition text-xs shadow-md shadow-sky-200/50 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {saving ? '⚡ 견적서 연동 처리 중...' : '🔍 자세히 보기 및 견적 연동 ➡️'}
        </button>
      </div>
    </div>
  );
}

function FacilityPlatePreviewMessage({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [plateData, setPlateData] = useState<any>(null);
  const [manufacturer, setManufacturer] = useState('');
  const [modelName, setModelName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufactureYear, setManufactureYear] = useState<number | ''>('');
  const [specifications, setSpecifications] = useState('');
  const [pdfFilePath, setPdfFilePath] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      setPlateData(parsed);
      const ocrData = parsed.data || {};
      setManufacturer(ocrData.manufacturer || '');
      setModelName(ocrData.modelName || '');
      setSerialNumber(ocrData.serialNumber || '');
      setManufactureYear(ocrData.manufactureYear ? Number(ocrData.manufactureYear) : '');
      setSpecifications(ocrData.specifications || '');
      setPdfFilePath(ocrData.pdfFilePath || '');
    } catch (err: any) {
      console.error('설비 명판 태그 파싱 실패:', err);
    }
  }, [tagContent]);

  if (!plateData) return <div className="text-rose-500 font-bold p-2 text-xs">설비 명판 데이터를 파싱하지 못했습니다.</div>;

  const handleConfirmSubmit = async () => {
    if (!modelName) {
      alert('설비 모델명을 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'FACILITY_PLATE',
          data: {
            manufacturer,
            modelName,
            serialNumber,
            manufactureYear: manufactureYear ? Number(manufactureYear) : null,
            specifications
          }
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setSaved(true);
        onConfirmSuccess(resData.message);
      } else {
        alert(resData.error || '설비 마운트 등록에 실패했습니다.');
      }
    } catch (err: any) {
      alert('서버 등록 통신 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-amber-200 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 px-4 py-3 border-b border-amber-200 flex items-center gap-2">
        <Sparkles size={14} className="text-amber-600 animate-pulse" />
        <span className="text-xs font-black text-slate-800">설비 제조 명판 OCR 분석 결과</span>
      </div>

      <div className="p-4 space-y-3 text-[11px]">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">제조사 (Manufacturer)</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-amber-500 font-bold"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              disabled={saved || saving}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">모델명 (Model Name)</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-amber-500 font-bold"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              disabled={saved || saving}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">일련번호 (Serial No.)</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-amber-500 font-mono font-bold"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              disabled={saved || saving}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">제조년도 (Year)</label>
            <input
              type="number"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-amber-500 font-bold"
              value={manufactureYear}
              onChange={(e) => setManufactureYear(e.target.value !== '' ? Number(e.target.value) : '')}
              disabled={saved || saving}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">제조 사양 (Specifications)</label>
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-amber-500 h-16 resize-none"
            value={specifications}
            onChange={(e) => setSpecifications(e.target.value)}
            disabled={saved || saving}
          />
        </div>

        {pdfFilePath && (
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">명판 이미지:</span>
            <a
              href={pdfFilePath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 font-bold hover:underline truncate max-w-[180px]"
            >
              📷 {pdfFilePath.split('/').pop()}
            </a>
          </div>
        )}

        <div className="pt-2 border-t border-slate-50 flex gap-2">
          {saved ? (
            <div className="w-full text-center py-2 px-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 font-black flex items-center justify-center gap-1.5 animate-in fade-in duration-300">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              설비 대장 마운트 등록 완료!
            </div>
          ) : (
            <button
              onClick={handleConfirmSubmit}
              disabled={saving || !modelName}
              className={`w-full py-2 px-4 rounded-xl font-bold transition disabled:opacity-50 text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
                !modelName
                  ? 'bg-slate-200 text-slate-400 border-none cursor-not-allowed shadow-none'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200/50'
              }`}
            >
              {saving ? '⚡ 마운트 등록 중...' : '📥 설비 마운트 승인 ⚡'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FacilityChecklistPreviewMessage({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [checklistData, setChecklistData] = useState<any>(null);
  const [equipmentId, setEquipmentId] = useState('');
  const [inspector, setInspector] = useState('');
  const [checkDate, setCheckDate] = useState('');
  const [checks, setChecks] = useState<any[]>([]);
  const [facilitiesList, setFacilitiesList] = useState<any[]>([]);
  const [pdfFilePath, setPdfFilePath] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      setChecklistData(parsed);
      const ocrData = parsed.data || {};
      setEquipmentId(parsed.matchedEquipmentId ? String(parsed.matchedEquipmentId) : '');
      setInspector(ocrData.inspector || '');
      setCheckDate(ocrData.checkDate || '');
      setChecks(ocrData.checks || []);
      setFacilitiesList(parsed.facilitiesList || []);
      setPdfFilePath(ocrData.pdfFilePath || '');
    } catch (err: any) {
      console.error('수기 점검표 태그 파싱 실패:', err);
    }
  }, [tagContent]);

  if (!checklistData) return <div className="text-rose-500 font-bold p-2 text-xs">수기 점검표 데이터를 파싱하지 못했습니다.</div>;

  const handleToggleStatus = (index: number) => {
    if (saved || saving) return;
    setChecks(prev => prev.map((c, i) => i === index ? { ...c, status: c.status === 'PASS' ? 'FAIL' : 'PASS' } : c));
  };

  const handleCommentChange = (index: number, val: string) => {
    if (saved || saving) return;
    setChecks(prev => prev.map((c, i) => i === index ? { ...c, comment: val } : c));
  };

  const handleConfirmSubmit = async () => {
    if (!equipmentId) {
      alert('대상 설비를 지정해 주세요.');
      return;
    }
    if (!inspector) {
      alert('점검자를 기입해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'FACILITY_CHECKLIST',
          data: {
            equipmentId,
            inspector,
            checkDate,
            checks,
            pdfFilePath
          }
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setSaved(true);
        onConfirmSuccess(resData.message);
      } else {
        alert(resData.error || '수기 점검 등록에 실패했습니다.');
      }
    } catch (err: any) {
      alert('서버 등록 통신 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-amber-200 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 px-4 py-3 border-b border-amber-200 flex items-center gap-2">
        <Sparkles size={14} className="text-amber-600 animate-pulse" />
        <span className="text-xs font-black text-slate-800">수기 점검표 OCR 분석 결과</span>
      </div>

      <div className="p-4 space-y-3 text-[11px]">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">대상 설비</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              disabled={saved || saving}
            >
              <option value="">-- 설비 선택 --</option>
              {facilitiesList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">점검자</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-amber-500 font-bold"
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
              disabled={saved || saving}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">점검 일시</label>
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
            value={checkDate}
            onChange={(e) => setCheckDate(e.target.value)}
            disabled={saved || saving}
          />
        </div>

        {/* 개별 점검 문항 리스트 */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <label className="block text-[10px] font-bold text-slate-500">점검 세부 항목 및 상태</label>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {checks.map((item, idx) => {
              const isFail = item.status === 'FAIL';
              return (
                <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-150 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">{item.checkItem}</span>
                    <button
                      onClick={() => handleToggleStatus(idx)}
                      disabled={saved || saving}
                      className={`px-2 py-0.5 rounded text-[9px] font-black border transition cursor-pointer select-none ${
                        isFail
                          ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {isFail ? '❌ 조치필요' : '🟢 양호'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="특이사항 없음"
                    className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-600 focus:outline-none focus:border-amber-500"
                    value={item.comment || ''}
                    onChange={(e) => handleCommentChange(idx, e.target.value)}
                    disabled={saved || saving}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {pdfFilePath && (
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">수기점검표 파일:</span>
            <a
              href={pdfFilePath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 font-bold hover:underline truncate max-w-[180px]"
            >
              📄 {pdfFilePath.split('/').pop()}
            </a>
          </div>
        )}

        <div className="pt-2 border-t border-slate-50 flex gap-2">
          {saved ? (
            <div className="w-full text-center py-2 px-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 font-black flex items-center justify-center gap-1.5 animate-in fade-in duration-300">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              점검 대장 적재 동기화 완료!
            </div>
          ) : (
            <button
              onClick={handleConfirmSubmit}
              disabled={saving || !equipmentId || !inspector}
              className={`w-full py-2 px-4 rounded-xl font-bold transition disabled:opacity-50 text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
                !equipmentId || !inspector
                  ? 'bg-slate-200 text-slate-400 border-none cursor-not-allowed shadow-none'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200/50'
              }`}
            >
              {saving ? '⚡ 점검표 등록 중...' : '📥 점검 이력 동기화 승인 🛠️'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LegalPreviewCard({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [legalData, setLegalData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      const ocrData = parsed.data || parsed || {};
      setLegalData(ocrData);
    } catch (err: any) {
      console.error('소송 문서 데이터 파싱 실패:', err);
    }
  }, [tagContent]);

  if (!legalData) {
    return <div className="text-rose-500 font-bold p-2 text-xs">소송 문서 데이터를 파싱하지 못했습니다.</div>;
  }

  const handleConfirmSubmit = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'LEGAL_DOCUMENT',
          data: {
            documentType: legalData.documentType,
            caseNumber: legalData.caseNumber,
            summary: legalData.summary,
            deadline: legalData.deadline,
            actions: legalData.actions,
            pdfFilePath: legalData.pdfFilePath
          }
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setSaved(true);
        onConfirmSuccess(resData.message);
      } else {
        alert(resData.error || '일정 및 조치 등록에 실패했습니다.');
      }
    } catch (err: any) {
      alert('일정 등록 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-amber-200 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200 text-left">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 px-4 py-3 border-b border-amber-200 flex items-center gap-2">
        <Scale size={14} className="text-amber-600 animate-pulse" />
        <span className="text-xs font-black text-slate-800">변호사 AI 법률 리스크 분석 결과</span>
      </div>

      <div className="p-4 space-y-3.5 text-[11px]">
        {/* 문서 기본 요약 */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold text-[9px]">문서 구분</span>
            <span className="text-slate-800 font-extrabold text-[10px]">{legalData.documentType || '미식별'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold text-[9px]">사건 번호</span>
            <span className="text-slate-800 font-mono font-black text-[10px]">{legalData.caseNumber || '사건번호 미상'}</span>
          </div>
          {legalData.deadline && (
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
              <span className="text-rose-500 font-black text-[9px] flex items-center gap-0.5">⚠️ 법적 기한</span>
              <span className="text-rose-600 font-black text-[10.5px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 font-mono">{legalData.deadline}</span>
            </div>
          )}
        </div>

        {/* 핵심 요약 */}
        <div className="space-y-1">
          <span className="block text-[10px] font-black text-slate-400">🔍 분쟁 사건 요약</span>
          <p className="text-[10.5px] text-slate-700 leading-relaxed font-semibold bg-slate-50/40 p-2.5 rounded-xl border border-slate-100/70">
            {legalData.summary || '사건에 대한 상세 내용이 문서상 식별되지 않았습니다.'}
          </p>
        </div>

        {/* CEO 행동 지침 */}
        {legalData.actions && legalData.actions.length > 0 && (
          <div className="space-y-1">
            <span className="block text-[10px] font-black text-slate-400">💡 권장 즉시 조치</span>
            <ul className="space-y-1.5 pl-1.5">
              {legalData.actions.map((act: string, idx: number) => (
                <li key={idx} className="text-[10px] text-slate-650 leading-relaxed flex items-start gap-1 font-semibold">
                  <span className="text-amber-500 font-black shrink-0">•</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {saved ? (
            <div className="py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-[10.5px] text-emerald-700 font-black flex items-center justify-center gap-1.5">
              <CheckCircle2 size={13} /> 회사 일정 및 대응 지시 연동 완료
            </div>
          ) : (
            <button
              onClick={handleConfirmSubmit}
              disabled={saving}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              {saving ? '⚡ 캘린더 등록 중...' : '📥 캘린더 기한 등록 및 작업 지시'}
            </button>
          )}

          <a
            href="/lawyer-ai"
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-650 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1"
          >
            변호사 AI 본 화면에서 정밀 진단받기 <ArrowRight size={11} className="text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
}

function CompetitorPricePreviewMessage({ tagContent, onConfirmSuccess }: { tagContent: string; onConfirmSuccess: (msg: string) => void }) {
  const [competitorData, setCompetitorData] = useState<any>(null);
  const [matchedItemId, setMatchedItemId] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [itemName, setItemName] = useState('');
  const [capturedPrice, setCapturedPrice] = useState(0);
  const [captureUrl, setCaptureUrl] = useState('');
  const [trackedItemsList, setTrackedItemsList] = useState<any[]>([]);
  const [pdfFilePath, setPdfFilePath] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(tagContent);
      setCompetitorData(parsed);
      const ocrData = parsed.data || {};
      setMatchedItemId(parsed.matchedItemId ? String(parsed.matchedItemId) : '');
      setCompetitorName(ocrData.competitorName || '');
      setItemName(ocrData.itemName || '');
      setCapturedPrice(Number(ocrData.capturedPrice) || 0);
      setCaptureUrl(ocrData.captureUrl || '');
      setTrackedItemsList(parsed.trackedItemsList || []);
      setPdfFilePath(ocrData.pdfFilePath || '');
    } catch (err: any) {
      console.error('경쟁사 가격 캡처 태그 파싱 실패:', err);
    }
  }, [tagContent]);

  if (!competitorData) return <div className="text-rose-500 font-bold p-2 text-xs">경쟁사 가격 캡처 데이터를 파싱하지 못했습니다.</div>;

  const handleConfirmSubmit = async () => {
    if (!matchedItemId) {
      alert('매핑할 자사 가격 추적 품목을 선택해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/easybot/ocr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'COMPETITOR_PRICE_CAPTURE',
          matchedItemId: Number(matchedItemId),
          data: {
            competitorName,
            itemName,
            capturedPrice: Number(capturedPrice),
            captureUrl
          }
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setSaved(true);
        const combinedMsg = resData.marginReport 
          ? `${resData.message}\n\n📊 [실시간 마진 리포트]\n${resData.marginReport}`
          : resData.message;
        onConfirmSuccess(combinedMsg);
      } else {
        alert(resData.error || '경쟁 가격 매핑 등록에 실패했습니다.');
      }
    } catch (err: any) {
      alert('서버 등록 통신 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-3 border border-pink-200 rounded-2xl bg-white shadow-md overflow-hidden text-slate-800 max-w-sm animate-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-r from-pink-100 to-rose-50 px-4 py-3 border-b border-pink-200 flex items-center gap-2">
        <Sparkles size={14} className="text-rose-600 animate-pulse" />
        <span className="text-xs font-black text-slate-800">경쟁사 가격 캡처 분석 리포스</span>
      </div>

      <div className="p-4 space-y-3 text-[11px]">
        {/* 경쟁사명 및 품목명 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">경쟁사 / 플랫폼</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-rose-500 font-bold"
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              disabled={saved || saving}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">경쟁 품목명</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-rose-500 font-bold"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              disabled={saved || saving}
            />
          </div>
        </div>

        {/* 캡처 가격 및 출처 URL */}
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">수집된 판매 가격 (원)</label>
            <input
              type="number"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-rose-500 font-mono font-bold"
              value={capturedPrice}
              onChange={(e) => setCapturedPrice(Number(e.target.value))}
              disabled={saved || saving}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">원본 URL (출처)</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-rose-500 text-[10px] truncate"
              value={captureUrl}
              onChange={(e) => setCaptureUrl(e.target.value)}
              disabled={saved || saving}
            />
          </div>
        </div>

        {/* 자사 매핑 대상 드롭다운 */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-[10px] font-bold text-slate-500 mb-1">매핑할 자사 가격 추적 품목</label>
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-rose-500 font-bold cursor-pointer"
            value={matchedItemId}
            onChange={(e) => setMatchedItemId(e.target.value)}
            disabled={saved || saving}
          >
            <option value="">-- 가격 추적 품목 선택 --</option>
            {trackedItemsList.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </select>
        </div>

        {pdfFilePath && (
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">원본 캡처 파일:</span>
            <a
              href={pdfFilePath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-600 font-bold hover:underline truncate max-w-[180px]"
            >
              📷 {pdfFilePath.split('/').pop()}
            </a>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="pt-2 border-t border-slate-50 flex gap-2">
          {saved ? (
            <div className="w-full text-center py-2 px-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 font-black flex items-center justify-center gap-1.5 animate-in fade-in duration-300">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              경쟁 가격 매핑 등록 완료!
            </div>
          ) : (
            <button
              onClick={handleConfirmSubmit}
              disabled={saving || !matchedItemId}
              className={`w-full py-2 px-4 rounded-xl font-bold transition disabled:opacity-50 text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
                !matchedItemId 
                  ? 'bg-slate-200 text-slate-400 border-none cursor-not-allowed shadow-none'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200/50'
              }`}
            >
              {saving ? '⚡ 경쟁 가격 매핑 중...' : '📥 경쟁 가격 매핑 승인'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EasyBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [widgetOpacity, setWidgetOpacity] = useState(1.0); // 대화창 투명도 상태 (1.0, 0.8, 0.6, 0.4 순환)
  const [autoGuideEnabled, setAutoGuideEnabled] = useState(true); // 마우스 호버 시 2.5초 후 자동 가이드 설명 모드


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
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // 💬 개발사 피드백 실시간 연동 상태 변수
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackContact, setFeedbackContact] = useState("");
  const [feedbackType, setFeedbackType] = useState<"suggest" | "bug" | "other">("suggest");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  // 📸 스크린샷 & 화면 녹화 기능 상태 변수 추가
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenRecordBlob, setScreenRecordBlob] = useState<Blob | null>(null);
  const [screenRecordPreview, setScreenRecordPreview] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isEditingScreenshot, setIsEditingScreenshot] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'none' | 'pen' | 'blur'>('none');
  const [canvasImage, setCanvasImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);

  const pathname = usePathname();
  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const ttsSynthesisRef = useRef<any>(null);
  const currentUtteranceRef = useRef<any>(null);

  // 명함 파일 업로드 수입용 Ref 추가
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 클로저 고립 문제를 차단하기 위한 최신 상태 동기화 Ref 그룹
  const messagesRef = useRef<Message[]>([]);
  const pathnameRef = useRef<string>('');
  const voiceEnabledRef = useRef<boolean>(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

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

  // 🧭 마우스 호버 및 입력 포커스 시 data-easybot-hint를 실시간 수집하는 전역 리스너
  useEffect(() => {
    const handleInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // 이지봇 위젯 내부(트리거 버튼 또는 대화창 본체)에서 발생한 이벤트는 힌트 갱신을 건너뜁니다.
      if (target.closest("[data-easybot-widget]")) {
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
        return;
      }
      
      const hintElement = target.closest("[data-easybot-hint]");
      if (hintElement) {
        const hintText = hintElement.getAttribute("data-easybot-hint");
        if (hintText) {
          (window as any).currentEasyBotHint = hintText;

          // 자동 가이드 모드가 활성화되어 있고 마우스가 호버한 상태라면 2.5초 후 자동 질문 트리거 시동
          // 단, 지출관리(/expenses) 페이지에서는 이지봇 대신 자체 팝업 도움말이 동작하므로 이지봇 자동 작동을 건너뜁니다.
          if (autoGuideEnabled && e.type === "mouseover" && pathnameRef.current !== "/expenses") {
            if (hoverTimerRef.current) {
              clearTimeout(hoverTimerRef.current);
            }
            hoverTimerRef.current = setTimeout(() => {
              triggerAutoQuery(hintText);
            }, 2500);
          }
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      // 마우스가 힌트 요소 영역을 벗어나 이동하면 예방 차원에서 타이머를 클리어합니다.
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };

    window.addEventListener("mouseover", handleInteraction, { passive: true });
    window.addEventListener("focusin", handleInteraction, { passive: true });
    window.addEventListener("mouseout", handleMouseOut, { passive: true });

    return () => {
      window.removeEventListener("mouseover", handleInteraction);
      window.removeEventListener("focusin", handleInteraction);
      window.removeEventListener("mouseout", handleMouseOut);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, [autoGuideEnabled]);

  const getQueryFromHint = (hint: string): string => {
    const parts = hint.split(":");
    if (parts.length > 0 && parts[0].trim().length < 30) {
      return `이 부분(${parts[0].trim()})은 어떻게 사용해?`;
    }
    return "이 부분은 어떻게 사용해?";
  };

  const triggerAutoQuery = async (hintText: string) => {
    if (typeof window !== 'undefined') {
      (window as any).currentEasyBotHint = hintText;
    }
    setIsOpen(true);
    const autoQuery = getQueryFromHint(hintText);
    await sendUserMessage(autoQuery);
  };

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
    if (!text || typeof text !== 'string') return;
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

  // 📸 화면 스크린샷 캡처
  const handleCaptureScreenshot = async () => {
    // 1. window.getComputedStyle를 일시적으로 몽키 패칭(Monkey Patching)하여
    // html2canvas가 DOM 요소를 분석하며 읽어가는 모든 스타일의 lab/oklch 색상을 transparent로 강제 치환 반환합니다.
    // 이 방식을 사용하면 스타일시트를 비활성화할 필요가 없으므로 레이아웃이 절대 붕괴하지 않습니다.
    const originalGetComputedStyle = window.getComputedStyle;
    
    window.getComputedStyle = function (el, pseudoElt) {
      const style = originalGetComputedStyle.call(window, el, pseudoElt);
      
      return new Proxy(style, {
        get(target, prop) {
          const val = target[prop as any];
          if (typeof val === 'string') {
            const valLower = val.toLowerCase();
            if (
              valLower.includes('lab(') || 
              valLower.includes('oklch(') || 
              valLower.includes('oklab(') || 
              valLower.includes('lch(')
            ) {
              return 'transparent';
            }
          }
          if (typeof val === 'function') {
            return function (...args: any[]) {
              const res = (val as Function).apply(target, args);
              if (typeof res === 'string') {
                const resLower = res.toLowerCase();
                if (
                  resLower.includes('lab(') || 
                  resLower.includes('oklch(') || 
                  resLower.includes('oklab(') || 
                  resLower.includes('lch(')
                ) {
                  return 'transparent';
                }
              }
              return res;
            };
          }
          return val;
        }
      });
    };

    // 혹시 모를 파싱 에러 방지를 위해 인라인 <style> 태그 내의 텍스트도 transparent로 임시 치환
    const backupStyleElements: { el: HTMLStyleElement; originalText: string }[] = [];
    try {
      const styleElements = Array.from(document.querySelectorAll('style')) as HTMLStyleElement[];
      styleElements.forEach((el) => {
        if (el.textContent) {
          const text = el.textContent;
          if (
            text.includes('lab(') || 
            text.includes('oklch(') || 
            text.includes('oklab(') || 
            text.includes('lch(')
          ) {
            backupStyleElements.push({ el, originalText: text });
            const cleanText = text
              .replace(/lab\([^)]*\)/gi, 'transparent')
              .replace(/oklch\([^)]*\)/gi, 'transparent')
              .replace(/oklab\([^)]*\)/gi, 'transparent')
              .replace(/lch\([^)]*\)/gi, 'transparent');
            el.textContent = cleanText;
          }
        }
      });
    } catch (styleErr) {
      console.warn('style 태그 사전 필터링 스킵:', styleErr);
    }

    try {
      const element = document.body;
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false, // allowTaint가 true이면 외부 이미지 렌더링 후 toDataURL()에서 보안 위반 에러(SecurityError)가 유발됩니다.
        backgroundColor: '#ffffff', // 캡처본 배경 불투명 처리
        logging: false,
        ignoreElements: (el) => {
          return el.classList.contains('ignore-capture') || el.id === 'easybot-widget-root' || el.getAttribute('data-easybot-widget') !== null;
        }
      });

      const dataUrl = canvas.toDataURL('image/png');
      setCanvasImage(dataUrl);
      setDrawingMode('pen'); // 기본 드로잉 모드를 펜 모드로 설정
      setIsEditingScreenshot(true);
    } catch (error: any) {
      console.error('스크린샷 캡처 실패:', error);
      alert(`화면 캡처에 실패했습니다. 상세 요인: ${error.message || error}`);
    } finally {
      // 2. 몽키 패칭 및 스타일 치환 즉각 원상 복구
      window.getComputedStyle = originalGetComputedStyle;
      
      backupStyleElements.forEach((item) => {
        try {
          item.el.textContent = item.originalText;
        } catch (e) {}
      });
    }
  };

  // 캔버스 드로잉 관련 핸들러
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (drawingMode === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    lastXRef.current = x;
    lastYRef.current = y;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || drawingMode === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (drawingMode === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
    } else if (drawingMode === 'blur') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 20;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    
    lastXRef.current = x;
    lastYRef.current = y;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleSaveEditedScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        setScreenshotBlob(blob);
        const previewUrl = URL.createObjectURL(blob);
        setScreenshotPreview(previewUrl);
      }
      setIsEditingScreenshot(false);
    }, 'image/png');
  };

  // 🎥 화면 녹화 시작
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor"
        },
        audio: false
      });

      recordStreamRef.current = stream;
      setIsRecording(true);
      setRecordingSeconds(0);

      const options = { mimeType: 'video/webm; codecs=vp9' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setScreenRecordBlob(blob);
        const previewUrl = URL.createObjectURL(blob);
        setScreenRecordPreview(previewUrl);
        setIsRecording(false);
        
        stream.getTracks().forEach(track => track.stop());
        
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      stream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      recorder.start();

      const timer = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 29) {
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
            clearInterval(timer);
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

      recordingTimerRef.current = timer;

    } catch (error) {
      console.error('화면 녹화 실패:', error);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // 언마운트 시 녹화 해제
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (recordStreamRef.current) {
        recordStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 캔버스 이미지 그리기 용 훅
  useEffect(() => {
    if (isEditingScreenshot && canvasImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        const maxWidth = Math.min(window.innerWidth * 0.94, 1800);
        const maxHeight = window.innerHeight * 0.8;
        
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = canvasImage;
    }
  }, [isEditingScreenshot, canvasImage]);

  // 드로잉 모드에 맞춰 캔버스 커서 강제 지정 (!important 우회 및 커스텀 SVG 포인터 탑재)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const redPencilCursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M12 20h9'/><path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'/></svg>") 3 21, crosshair`;
      const blurBrushCursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21Z'/><path d='M22 21H7'/><path d='m5 11 9 9'/></svg>") 3 21, crosshair`;

      let cursorValue = 'default';
      if (drawingMode === 'pen') {
        cursorValue = redPencilCursor;
      } else if (drawingMode === 'blur') {
        cursorValue = blurBrushCursor;
      }
      canvas.style.setProperty('cursor', cursorValue, 'important');
    }
  }, [drawingMode, isEditingScreenshot]);

  // 💬 개발사 피드백 전송 API 호출 핸들러
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      alert("피드백 내용을 입력해 주세요.");
      return;
    }

    setIsSendingFeedback(true);
    try {
      const formData = new FormData();
      formData.append("companyName", "이지데스크 B2B 회원사"); // 챗봇이 탑재되는 고객사 정보 대리 매핑
      formData.append("senderName", "운영자 사장님");
      formData.append("contact", feedbackContact || "미기입");
      formData.append("feedbackType", feedbackType === "bug" ? "버그 제보" : feedbackType === "suggest" ? "기능 제안" : "기타 문의");
      formData.append("feedbackText", feedbackText);
      formData.append("currentUrl", pathname || window.location.pathname);

      if (screenshotBlob) {
        formData.append("screenshot", screenshotBlob, "screenshot.png");
      }
      if (screenRecordBlob) {
        formData.append("recording", screenRecordBlob, "recording.webm");
      }

      const res = await fetch("/api/support/feedback", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        alert("개발사로 피드백이 실시간으로 전송 완료되었습니다! 🚀\n신속하게 확인하여 카카오톡 채널로 대응해 드리겠습니다.");
        setFeedbackText("");
        setFeedbackContact("");
        setScreenshotBlob(null);
        setScreenshotPreview(null);
        setScreenRecordBlob(null);
        setScreenRecordPreview(null);
        setIsFeedbackOpen(false);
      } else {
        alert(data.error || "피드백 전송에 실패했습니다. 대행사 설정을 확인하세요.");
      }
    } catch (err: any) {
      console.error(err);
      alert("통신 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSendingFeedback(false);
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
   * 명함 및 사업자등록증 파일(이미지/PDF) 업로드 및 Base64 스캔 API 파이프라인
   */
  const handleCardPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    stopSpeaking();

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    // 파일 로드 및 Base64 변환
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;
      const timeStr = formatTimestamp();

      if (isPdf) {
        // 사용자 대화창에 PDF 업로드 정보 노출
        setMessages(prev => [
          ...prev,
          {
            role: 'user',
            content: `📁 PDF 문서를 검증하여 등록해 주세요. (${file.name})`,
            timestamp: timeStr,
            isCardPhoto: false,
            isPdfFile: true,
            pdfFileName: file.name,
            cardPhotoBase64: base64Str
          }
        ]);
      } else {
        // 사용자 대화창에 명함 이미지 썸네일 노출
        setMessages(prev => [
          ...prev,
          {
            role: 'user',
            content: '',
            timestamp: timeStr,
            isCardPhoto: true,
            isPdfFile: false,
            cardPhotoBase64: base64Str
          }
        ]);
      }

      // 봇의 분석 중 대기 상태 추가
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: '🔄 업로드하신 문서를 AI가 정밀 분석 및 국세청 검증을 수행하고 있습니다. 잠시만 기다려 주세요... ⚡',
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

        if (data.success && data.detectedItems && data.detectedItems.length > 0) {
          setMessages(prev => {
            const updated = [...prev];
            // 로딩 상태 대화 제거
            updated.pop();

            // 검출된 문서 수만큼 대화창에 차례대로 카드 뿌리기
            data.detectedItems.forEach((item: any) => {
              if (item.itemType === 'BUSINESS_LICENSE') {
                const licensePayload = {
                  status: item.status,
                  existingId: item.existingId,
                  existingType: item.existingType,
                  diff: item.diff,
                  checksum: item.checksum,
                  nts: item.nts,
                  data: item.data
                };
                updated.push({
                  role: 'bot',
                  content: `[LICENSE_PREVIEW:${JSON.stringify(licensePayload)}]`,
                  timestamp: formatTimestamp()
                });
              } else if (item.itemType === 'BUSINESS_CARD') {
                const cardPayload = {
                  ...item.data,
                  actionType: item.actionType,
                  partnerId: item.partnerId,
                  partnerName: item.partnerName,
                  existingContact: item.existingContact,
                  cardImageUrl: base64Str
                };
                updated.push({
                  role: 'bot',
                  content: `[CARD_PREVIEW:${JSON.stringify(cardPayload)}]`,
                  timestamp: formatTimestamp()
                });
              } else if (item.itemType === 'RECEIPT') {
                const receiptPayload = {
                  ...item.data
                };
                updated.push({
                  role: 'bot',
                  content: `[RECEIPT_PREVIEW:${JSON.stringify(receiptPayload)}]`,
                  timestamp: formatTimestamp()
                });
              } else if (item.itemType === 'FINANCIAL_STATEMENT') {
                const financialPayload = {
                  status: item.status,
                  partnerId: item.partnerId,
                  companyType: item.companyType,
                  matchedCompanyName: item.matchedCompanyName,
                  pdfFilePath: item.pdfFilePath,
                  data: item.data,
                  partnersList: data.partnersList
                };
                updated.push({
                  role: 'bot',
                  content: `[FINANCIAL_PREVIEW:${JSON.stringify(financialPayload)}]`,
                  timestamp: formatTimestamp()
                });
              } else if (item.itemType === 'RESUME') {
                const resumePayload = {
                  ...item.data
                };
                updated.push({
                  role: 'bot',
                  content: `[RESUME_PREVIEW:${JSON.stringify(resumePayload)}]`,
                  timestamp: formatTimestamp()
                });
              } else if (item.itemType === 'PURCHASE_INVOICE') {
                const purchasePayload = {
                  partnerId: item.partnerId,
                  data: item.data,
                  trackedItemsList: item.trackedItemsList,
                  partnersList: data.partnersList
                };
                updated.push({
                  role: 'bot',
                  content: `[PURCHASE_INVOICE_PREVIEW:${JSON.stringify(purchasePayload)}]`,
                  timestamp: formatTimestamp()
                });
              } else if (item.itemType === 'COMPETITOR_PRICE_CAPTURE') {
                const competitorPayload = {
                  matchedItemId: item.matchedItemId,
                  matchedItemName: item.matchedItemName,
                  data: item.data,
                  trackedItemsList: item.trackedItemsList
                };
                updated.push({
                  role: 'bot',
                  content: `[COMPETITOR_PRICE_PREVIEW:${JSON.stringify(competitorPayload)}]`,
                  timestamp: formatTimestamp()
                });
              } else if (item.itemType === 'MEDICAL_CERTIFICATE') {
                const medicalPayload = {
                  ...item.data,
                  matchedOperatorId: item.matchedOperatorId,
                  matchedOperatorName: item.matchedOperatorName,
                  operatorsList: item.operatorsList
                };
                updated.push({
                  role: 'bot',
                  content: `[MEDICAL_PREVIEW:${JSON.stringify(medicalPayload)}]`,
                  timestamp: formatTimestamp()
                });
              } else if (item.itemType === 'FACILITY_PLATE') {
                const platePayload = {
                  data: item.data
                };
                updated.push({
                  role: 'bot',
                  content: `[FACILITY_PLATE_PREVIEW:${JSON.stringify(platePayload)}]`,
                  timestamp: formatTimestamp()
                });
              } else if (item.itemType === 'FACILITY_CHECKLIST') {
                const checklistPayload = {
                  matchedEquipmentId: item.matchedEquipmentId,
                  matchedEquipmentName: item.matchedEquipmentName,
                  facilitiesList: item.facilitiesList,
                  data: item.data
                };
                updated.push({
                  role: 'bot',
                  content: `[FACILITY_CHECKLIST_PREVIEW:${JSON.stringify(checklistPayload)}]`,
                  timestamp: formatTimestamp()
                });
              } else if (item.itemType === 'INBOUND_ESTIMATE') {
                const estimatePayload = {
                  partnerId: item.partnerId,
                  data: item.data,
                  trackedItemsList: item.trackedItemsList,
                  partnersList: item.partnersList || data.partnersList
                };
                updated.push({
                  role: 'bot',
                  content: `[INBOUND_ESTIMATE_PREVIEW:${JSON.stringify(estimatePayload)}]`,
                  timestamp: formatTimestamp()
                });
              } else if (item.itemType === 'LEGAL_DOCUMENT') {
                const legalPayload = {
                  ...item.data
                };
                updated.push({
                  role: 'bot',
                  content: `[LEGAL_PREVIEW:${JSON.stringify(legalPayload)}]`,
                  timestamp: formatTimestamp()
                });
              } else if (item.itemType === 'INVENTORY_INBOUND') {
                const inboundPayload = {
                  data: item.data,
                  inventoryItemsList: data.inventoryItemsList || []
                };
                updated.push({
                  role: 'bot',
                  content: `[INBOUND_PREVIEW:${JSON.stringify(inboundPayload)}]`,
                  timestamp: formatTimestamp()
                });
              }
            });
            return updated;
          });
        } else {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'bot',
              content: `❌ 문서 판독 실패: ${data.error || '알 수 없는 판독 오류'}`,
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
            content: `❌ 문서 스캔 중 통신 오류가 발생했습니다: ${err.message}`,
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

  const sendUserMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setIsLoading(true);
    stopSpeaking();

    const timeStr = formatTimestamp();

    // 1. 유저 메시지 적재 (stale closure 방지를 위해 messagesRef.current 참조)
    const updatedMessages = [
      ...messagesRef.current,
      {
        role: 'user' as const,
        content: textToSend,
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
          prompt: textToSend,
          chatHistory: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          localStorageContext: typeof window !== 'undefined' ? { ...window.localStorage } : {},
          currentUrl: pathnameRef.current,
          focusedUiHint: typeof window !== 'undefined' ? (window as any).currentEasyBotHint || null : null
        })
      });

      const data = await response.json();

      if (data.success) {
        // 3. 봇의 지능형 응답 적재
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: data.reply || data.answer,
            timestamp: formatTimestamp(),
            sql: data.sql || null,
            sqlSuccess: data.sqlSuccess !== undefined ? data.sqlSuccess : null,
            sqlError: data.sqlError || null
          }
        ]);

        // 4. 주의/경고사항 감지 및 요약 오디오 재생
        if (voiceEnabledRef.current) {
          speakImportantNotesOnly(data.reply || data.answer);
        }

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userText = inputVal;
    setInputVal('');
    await sendUserMessage(userText);
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
        data-easybot-widget="trigger"
        onClick={() => {
          setIsOpen(!isOpen);
          stopSpeaking();
        }}
        className="ignore-capture fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
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
            data-easybot-widget="panel"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: widgetOpacity, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`ignore-capture fixed bottom-24 right-6 z-40 bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
              isMaximized ? 'w-[94vw] h-[92vh] sm:w-[68vw] sm:h-[88vh]' : 'w-[92vw] h-[72vh] sm:w-[400px] sm:h-[550px]'
            }`}
            style={{ opacity: widgetOpacity }}
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
                {isMaximized && (
                  <div className="animate-fade-in">
                    <h4 className="text-xs font-black text-slate-800 tracking-wide flex items-center gap-1.5">
                      이지봇 AI 비서
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </h4>
                    <p className="text-[9.5px] text-slate-400 font-bold mt-0.5">EGDesk 지능형 비서 연동</p>
                  </div>
                )}
              </div>

              {/* 헤더 액션 단추 그룹 */}
              <div className="flex items-center gap-1">
                {/* 호버 자동 가이드 토글 버튼 */}
                <button
                  type="button"
                  onClick={() => setAutoGuideEnabled(!autoGuideEnabled)}
                  className={`p-2 rounded-xl transition-colors flex items-center gap-1 border-none bg-transparent cursor-pointer ${
                    autoGuideEnabled ? 'text-violet-650 bg-violet-50 hover:bg-violet-100' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                  title={autoGuideEnabled ? "마우스 호버 자동 가이드 활성화 (2.5초 호버 시 자동 설명)" : "마우스 호버 자동 가이드 꺼짐"}
                >
                  <MousePointerClick size={15} />
                  <span className="text-[9.5px] font-black">{autoGuideEnabled ? "ON" : "OFF"}</span>
                </button>
                {/* 투명도 조절 순환 토글 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    const nextMap: Record<number, number> = { 1.0: 0.8, 0.8: 0.6, 0.6: 0.4, 0.4: 1.0 };
                    setWidgetOpacity(nextMap[widgetOpacity] || 1.0);
                  }}
                  className="p-2 rounded-xl text-slate-450 hover:bg-slate-105 hover:text-slate-700 transition-colors flex items-center gap-1 border-none bg-transparent cursor-pointer"
                  title={`대화창 투명도 조절 (현재: ${Math.round(widgetOpacity * 100)}%)`}
                >
                  <Layers size={15} />
                  <span className="text-[9.5px] font-black text-slate-550">{Math.round(widgetOpacity * 100)}%</span>
                </button>

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
                const hasContent = typeof msg.content === 'string';
                const isCardPreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[CARD_PREVIEW:');
                const isLicensePreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[LICENSE_PREVIEW:');
                const isFinancialPreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[FINANCIAL_PREVIEW:');
                const isReceiptPreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[RECEIPT_PREVIEW:');
                const isInboundPreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[INBOUND_PREVIEW:');
                const isResumePreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[RESUME_PREVIEW:');
                const isMedicalPreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[MEDICAL_PREVIEW:');
                const isPurchaseInvoicePreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[PURCHASE_INVOICE_PREVIEW:');
                const isCompetitorPricePreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[COMPETITOR_PRICE_PREVIEW:');
                const isFacilityPlatePreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[FACILITY_PLATE_PREVIEW:');
                const isFacilityChecklistPreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[FACILITY_CHECKLIST_PREVIEW:');
                const isLegalPreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[LEGAL_PREVIEW:');
                const isRndSpacePreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[RND_SPACE_PREVIEW:');
                const isRndLogPreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[RND_LOG_PREVIEW:');
                const isInboundEstimatePreview = msg.role === 'bot' && hasContent && msg.content.startsWith('[INBOUND_ESTIMATE_PREVIEW:');
                
                const tagContent = isCardPreview && hasContent
                  ? msg.content.substring(14, msg.content.length - 1) 
                  : isLicensePreview && hasContent
                  ? msg.content.substring(17, msg.content.length - 1)
                  : isReceiptPreview && hasContent
                  ? msg.content.substring(17, msg.content.length - 1) 
                  : isFinancialPreview && hasContent
                  ? msg.content.substring(19, msg.content.length - 1)
                  : isInboundPreview && hasContent
                  ? msg.content.substring(17, msg.content.length - 1)
                  : isResumePreview && hasContent
                  ? msg.content.substring(16, msg.content.length - 1)
                  : isMedicalPreview && hasContent
                  ? msg.content.substring(17, msg.content.length - 1)
                  : isPurchaseInvoicePreview && hasContent
                  ? msg.content.substring(26, msg.content.length - 1)
                  : isCompetitorPricePreview && hasContent
                  ? msg.content.substring(26, msg.content.length - 1)
                  : isFacilityPlatePreview && hasContent
                  ? msg.content.substring(24, msg.content.length - 1)
                  : isFacilityChecklistPreview && hasContent
                  ? msg.content.substring(28, msg.content.length - 1)
                  : isLegalPreview && hasContent
                  ? msg.content.substring(15, msg.content.length - 1)
                  : isRndSpacePreview && hasContent
                  ? msg.content.substring(19, msg.content.length - 1)
                  : isRndLogPreview && hasContent
                  ? msg.content.substring(17, msg.content.length - 1)
                  : isInboundEstimatePreview && hasContent
                  ? msg.content.substring(26, msg.content.length - 1)
                  : '';
                const isCustomPreview = isCardPreview || isLicensePreview || isReceiptPreview || isFinancialPreview || isInboundPreview || isResumePreview || isMedicalPreview || isPurchaseInvoicePreview || isCompetitorPricePreview || isFacilityPlatePreview || isFacilityChecklistPreview || isLegalPreview || isRndSpacePreview || isRndLogPreview || isInboundEstimatePreview;

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
                            : isCustomPreview
                            ? 'p-0 bg-transparent shadow-none border-none rounded-none' // 명함 및 사업자등록증 카드는 말풍선 제거
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

                        {/* PDF 업로드 정보 렌더링 지원 (유저 메시지용) */}
                        {msg.isPdfFile && (
                          <div className="mb-2 p-3 max-w-[220px] rounded-xl border border-white/20 bg-white/10 text-white flex items-center gap-2 font-bold select-none">
                            <span className="text-lg">📁</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] truncate leading-tight">{msg.pdfFileName}</p>
                              <p className="text-[8px] opacity-70">PDF 문서</p>
                            </div>
                          </div>
                        )}

                        {/* 2. 일반 텍스트 렌더링 분기 */}
                        {msg.role === 'user' ? (
                          <UserMarkdown content={msg.content} />
                        ) : isCardPreview ? (
                          <CardPreviewMessage tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isLicensePreview ? (
                          <LicensePreviewMessage tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isReceiptPreview ? (
                          <ReceiptPreviewMessage tagContent={tagContent} />
                        ) : isResumePreview ? (
                          <ResumePreviewCard tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isMedicalPreview ? (
                          <MedicalPreviewCard tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isFinancialPreview ? (
                          <FinancialStatementPreviewMessage tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isInboundPreview ? (
                          <InboundPreviewMessage tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isInboundEstimatePreview ? (
                          <InboundEstimatePreviewMessage tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isPurchaseInvoicePreview ? (
                          <PurchaseInvoicePreviewMessage tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isCompetitorPricePreview ? (
                          <CompetitorPricePreviewMessage tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isFacilityPlatePreview ? (
                          <FacilityPlatePreviewMessage tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isFacilityChecklistPreview ? (
                          <FacilityChecklistPreviewMessage tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isLegalPreview ? (
                          <LegalPreviewCard tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isRndSpacePreview ? (
                          <RndSpacePreviewCard tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
                        ) : isRndLogPreview ? (
                          <RndLogPreviewCard tagContent={tagContent} onConfirmSuccess={handleCardConfirmSuccess} />
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
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                {/* 💬 개발사 실시간 피드백 전송 단추 */}
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(true)}
                  disabled={isLoading}
                  className="shrink-0 mr-1 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                  title="개발사에 건의/피드백 보내기"
                >
                  <MessageSquare size={17} />
                </button>

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

      {/* 💬 개발사 피드백 실시간 접수 모달 (Vibrant Glassmorphism & Micro-animations) */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <div className="ignore-capture fixed inset-0 bg-black/45 backdrop-blur-3xs flex items-center justify-center z-[100] p-4 text-slate-800">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-100 shadow-2xl relative block"
            >
              <button 
                onClick={() => {
                  setIsFeedbackOpen(false);
                  setFeedbackText("");
                  setFeedbackContact("");
                  setScreenshotBlob(null);
                  setScreenshotPreview(null);
                  setScreenRecordBlob(null);
                  setScreenRecordPreview(null);
                }} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-1 block">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  💬 개발사 실시간 피드백 전송
                </h4>
                <p className="text-[10px] text-slate-400 font-bold">
                  프로그램 사용 중 발생하는 에러/기능 제안을 즉시 개발사 카카오톡 채널로 제보합니다.
                </p>
              </div>

              {/* 입력 양식 block */}
              <div className="space-y-3 text-xs font-bold block">
                {/* 유형 선택 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-455 uppercase tracking-widest block font-extrabold">문의/제보 유형</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'suggest', label: '💡 기능 제안' },
                      { key: 'bug', label: '⚠️ 버그 제보' },
                      { key: 'other', label: '❓ 기타 문의' }
                    ].map((type) => (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => setFeedbackType(type.key as any)}
                        className={`py-2 rounded-xl border text-[10px] font-black transition-all cursor-pointer ${
                          feedbackType === type.key
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-3xs'
                            : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 연락처 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-455 uppercase tracking-widest block font-extrabold">회신받으실 연락처 (선택)</label>
                  <input
                    type="text"
                    value={feedbackContact}
                    onChange={(e) => setFeedbackContact(e.target.value)}
                    placeholder="예: 010-1234-5678 또는 이메일 주소"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs"
                  />
                </div>

                {/* 내용 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-455 uppercase tracking-widest block font-extrabold">건의 및 버그 설명 (필수)</label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="접수 즉시 개발사 카카오톡 채널로 실시간 알림 전송되며, 상세 접수 후 신속히 패치해 드리겠습니다."
                    rows={4}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold resize-none leading-relaxed text-xs"
                  />
                </div>

                {/* 자료 첨부 */}
                <div className="space-y-1 block border-t border-slate-100 pt-3">
                  <label className="text-[10px] text-slate-455 uppercase tracking-widest block font-extrabold mb-1">자료 첨부 (선택)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCaptureScreenshot}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 text-slate-700 hover:text-indigo-700 transition-all font-bold text-[10px] cursor-pointer"
                    >
                      <Camera size={13} className="text-slate-500" />
                      화면 스크린샷 캡처
                    </button>
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      disabled={isRecording}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border transition-all font-bold text-[10px] cursor-pointer ${
                        isRecording 
                          ? 'bg-rose-50 border-rose-200 text-rose-650'
                          : 'border-slate-200 hover:border-rose-450 bg-white hover:bg-rose-50/20 text-slate-700 hover:text-rose-650'
                      }`}
                    >
                      <Video size={13} className={isRecording ? "text-rose-500 animate-pulse" : "text-slate-500"} />
                      {isRecording ? "녹화 진행 중..." : "화면 녹화 (동영상)"}
                    </button>
                  </div>

                  {/* 첨부된 미디어 미리보기 */}
                  {(screenshotPreview || screenRecordPreview) && (
                    <div className="flex gap-2.5 mt-2 p-2 bg-slate-50/80 rounded-2xl border border-slate-100">
                      {screenshotPreview && (
                        <div className="relative group w-[75px] h-[75px] rounded-xl border border-slate-200 overflow-hidden bg-white shrink-0 shadow-2xs">
                          <img src={screenshotPreview} alt="Screenshot preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshotBlob(null);
                              setScreenshotPreview(null);
                            }}
                            className="absolute -top-1 -right-1 bg-slate-900/80 text-white rounded-full p-1 hover:bg-rose-600 transition-colors shadow-sm"
                          >
                            <X size={10} />
                          </button>
                          <div 
                            onClick={() => {
                              setCanvasImage(screenshotPreview);
                              setIsEditingScreenshot(true);
                            }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black cursor-pointer transition-opacity"
                          >
                            편집
                          </div>
                        </div>
                      )}
                      {screenRecordPreview && (
                        <div className="relative w-[120px] h-[75px] rounded-xl border border-slate-200 overflow-hidden bg-black shrink-0 shadow-2xs">
                          <video src={screenRecordPreview} className="w-full h-full object-cover" controls={false} muted autoPlay loop playsInline />
                          <button
                            type="button"
                            onClick={() => {
                              setScreenRecordBlob(null);
                              setScreenRecordPreview(null);
                            }}
                            className="absolute -top-1 -right-1 bg-slate-900/80 text-white rounded-full p-1 hover:bg-rose-600 transition-colors shadow-sm z-10"
                          >
                            <X size={10} />
                          </button>
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white px-1 py-0.5 rounded text-[8px] font-extrabold tracking-wide">
                            VIDEO
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 전송 버튼 */}
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={isSendingFeedback || !feedbackText.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSendingFeedback ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    피드백 실시간 전송 중...
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    개발사 카카오톡으로 전송하기
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔴 화면 녹화 중 플로팅 제어기 */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="ignore-capture fixed bottom-6 left-6 z-[999] bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3.5 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-black tracking-wide">화면 녹화 중</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="text-xs font-mono font-bold text-slate-300">
              {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
              {String(recordingSeconds % 60).padStart(2, '0')} / 00:30
            </div>
            <button
              type="button"
              onClick={handleStopRecording}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide transition-all shadow-md shadow-rose-600/20 cursor-pointer border-none"
            >
              녹화 완료
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📸 스크린샷 캔버스 편집 모달 */}
      <AnimatePresence>
        {isEditingScreenshot && (
          <div className="ignore-capture fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center z-[110] p-4 text-slate-800 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-[96vw] w-full h-[92vh] max-h-[92vh] p-6 border border-slate-100 shadow-2xl relative flex flex-col justify-between select-none"
              style={{ height: '92vh', maxHeight: '92vh' }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    ✂️ 스크린샷 마스킹 편집기
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">
                    개인정보나 중요 재무 정보는 블러 펜(투명 흑색 마스킹)으로 지워주시고, 강조할 부분은 빨간 펜을 쓰세요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingScreenshot(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 my-2">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="max-w-full max-h-full block bg-slate-950"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDrawingMode('pen')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      drawingMode === 'pen'
                        ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-3xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    빨간 펜
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawingMode('blur')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      drawingMode === 'blur'
                        ? 'bg-slate-950 border-slate-850 text-white shadow-3xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                    블러(마스킹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawingMode('none')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      drawingMode === 'none'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-750 shadow-3xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MousePointerClick size={12} />
                    이동/선택 모드
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (canvasImage && canvasRef.current) {
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        const img = new Image();
                        img.onload = () => {
                          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        };
                        img.src = canvasImage;
                      }
                    }}
                    className="flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    title="초기화"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditedScreenshot}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all border-none"
                  >
                    첨부 완료
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
