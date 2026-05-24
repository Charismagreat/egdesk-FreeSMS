"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Camera, Mic, FileText, Link2, Plus, 
  Send, Compass, CheckCircle2, AlertCircle, Volume2, 
  MapPin, Clock, ArrowRight, X, Building2, User
} from "lucide-react";

interface SnapTask {
  id: string;
  title: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  partner_id: string | null;
  partner_company_name?: string | null;
  created_at: string;
  updated_at: string;
}

interface TimelineItem {
  id: number;
  task_id: string;
  content_text: string;
  file_url: string | null;
  file_type: 'IMAGE' | 'PDF' | 'AUDIO' | 'LINK' | 'TEXT';
  ai_analysis: string;
  created_at: string;
}

interface ActionLog {
  id: number;
  task_id: string;
  action_type: string;
  description: string;
  created_at: string;
}

export default function MobileSnapTasksPage() {
  const [tasks, setTasks] = useState<SnapTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<SnapTask | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [actions, setActions] = useState<ActionLog[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [snapping, setSnapping] = useState(false);

  // 신규 태스크 개설 상태
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // 스냅 입력 폼 상태
  const [contentText, setContentText] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFileType, setAttachedFileType] = useState<'IMAGE' | 'PDF' | 'AUDIO' | 'LINK' | 'TEXT'>('TEXT');
  const [attachedFileBase64, setAttachedFileBase64] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (selectedTask) {
      fetchTimeline(selectedTask.id);
    }
  }, [selectedTask]);

  // 스냅 등록 후 스크롤 하단 동기화
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/snaptasks");
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
        if (data.tasks.length > 0 && !selectedTask) {
          setSelectedTask(data.tasks[0]);
        }
      }
    } catch (e) {
      console.error("태스크 로드 에러:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async (taskId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/snaptasks?action=timeline&task_id=${taskId}`);
      const data = await res.json();
      if (data.success) {
        setTimeline(data.timeline || []);
        setActions(data.actions || []);
      }
    } catch (e) {
      console.error("타임라인 로드 에러:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  // 신규 스냅 태스크 생성
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch("/api/snaptasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle })
      });
      const data = await res.json();
      if (data.success) {
        setNewTaskTitle("");
        setIsNewTaskOpen(false);
        alert("자율주행 스냅태스크가 생성되었습니다!");
        fetchTasks();
      }
    } catch (err) {
      alert("태스크 생성 오류가 발생했습니다.");
    }
  };

  // 모바일 파일 첨부 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'PDF' | 'AUDIO') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("최대 20MB 이하의 미디어 파일만 수령 가능합니다.");
      return;
    }

    setAttachedFile(file);
    setAttachedFileType(type);

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 현장 데이터 융합 자율주행 스냅 전송 기동!
  const handleSnapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!contentText.trim() && !attachedFile) {
      alert("전송할 상담 메모 텍스트나 사진/파일을 첨부해 주세요.");
      return;
    }

    setSnapping(true);

    try {
      const body = {
        taskId: selectedTask.id,
        content_text: contentText,
        fileBase64: attachedFileBase64,
        filename: attachedFile ? attachedFile.name : "",
        fileType: attachedFile ? attachedFileType : "TEXT",
        mimeType: attachedFile ? attachedFile.type : "text/plain"
      };

      const res = await fetch("/api/snaptasks/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        // 성공 시 폼 초기화 및 타임라인 재정비
        setContentText("");
        setAttachedFile(null);
        setAttachedFileBase64("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        fetchTimeline(selectedTask.id);
        if (data.action_logged) {
          alert(`스냅 완료!\n[AI 자율 조치]: ${data.action_logged}`);
        }
      } else {
        alert("AI 스냅 실패: " + data.error);
      }
    } catch (err) {
      alert("네트워크 스냅 통신 중 에러가 발생했습니다.");
    } finally {
      setSnapping(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'IMAGE': return Camera;
      case 'PDF': return FileText;
      case 'AUDIO': return Mic;
      default: return Link2;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden relative pb-4">
      {/* 럭셔리 네온 아우라 그라데이션 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 모바일 헤더 */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h1 className="text-md font-black tracking-wider uppercase bg-clip-text bg-gradient-to-r from-white to-slate-400">
            SnapTask AI 🪐
          </h1>
        </div>
        
        <button
          onClick={() => setIsNewTaskOpen(true)}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-indigo-400 transition-colors flex items-center gap-1 border border-slate-700/60 text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          새 태스크
        </button>
      </div>

      {/* 1. 부서별 활성 스냅 태스크 수평 스크롤바 */}
      <div className="bg-slate-900/30 border-b border-slate-900 py-3.5 px-4 overflow-x-auto flex gap-3 scrollbar-none shrink-0 z-10">
        {loading ? (
          <span className="text-xs text-slate-500 font-bold py-1">스냅 태스크 동기화 중...</span>
        ) : tasks.length === 0 ? (
          <span className="text-xs text-slate-400 font-bold py-1">생성된 태스크가 없습니다. 새 태스크를 열어주세요.</span>
        ) : (
          tasks.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTask(t)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 transition-all border flex items-center gap-1.5 ${
                selectedTask?.id === t.id 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg shadow-indigo-600/20 scale-105' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              {t.title}
              {t.partner_company_name && (
                <span className="text-[9px] bg-white/20 text-white px-1 py-0.2 rounded font-medium">
                  {t.partner_company_name}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* 2. 메인 바디: 카톡 스타일 타임라인 피드 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 z-10">
        {selectedTask ? (
          <>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4.5 text-center text-xs font-medium space-y-1.5 shadow-sm max-w-sm mx-auto">
              <span className="text-indigo-400 font-extrabold uppercase text-[10px] tracking-widest block">Active Pipeline</span>
              <h2 className="text-sm font-black text-white">{selectedTask.title}</h2>
              <p className="text-slate-500 text-[10px] font-mono">태스크 코드: {selectedTask.id}</p>
            </div>

            {/* 타임라인 피드 카드들 */}
            {detailLoading && timeline.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-500 font-bold">과거 미팅 기록 마이닝 중...</p>
            ) : timeline.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-500 font-bold">등록된 스냅 자료가 없습니다. 아래 컨트롤러로 현장/업무 기록을 스냅해 주세요.</p>
            ) : (
              <div className="space-y-6">
                {timeline.map((item) => {
                  const FileIcon = item.file_type !== 'TEXT' ? getFileIcon(item.file_type) : null;
                  
                  let aiAnalysisObj: any = null;
                  try {
                    if (item.ai_analysis) aiAnalysisObj = JSON.parse(item.ai_analysis);
                  } catch (e) {}

                  return (
                    <div key={item.id} className="flex flex-col space-y-2.5 max-w-lg mx-auto">
                      
                      {/* 타임스탬프 */}
                      <span className="text-[9px] font-bold font-mono text-slate-600 block pl-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(item.created_at).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                      </span>

                      {/* 스냅 카드 몸체 */}
                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4.5 shadow-xl space-y-4">
                        
                        {/* 첨부 파일 렌더링 */}
                        {item.file_url && (
                          <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-850 p-2.5 flex items-center gap-3">
                            {item.file_type === 'IMAGE' ? (
                              <img 
                                src={item.file_url} 
                                alt="Snap Attached File" 
                                className="w-14 h-14 object-cover rounded-xl border border-slate-800 shrink-0" 
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                                {FileIcon && <FileIcon className="w-6 h-6" />}
                              </div>
                            )}
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest block w-max">
                                {item.file_type} File
                              </span>
                              <a 
                                href={item.file_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs text-slate-300 font-bold block truncate hover:underline"
                              >
                                {item.file_url.split('/').pop()}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* 오디오 녹취 HTML5 플레이어 마운트 (STT 소리 확인용 프리미엄 가치) */}
                        {item.file_type === 'AUDIO' && item.file_url && (
                          <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-3 flex items-center gap-3">
                            <Volume2 className="w-5 h-5 text-indigo-400 animate-pulse shrink-0" />
                            <audio src={item.file_url} controls className="w-full h-8 scale-95 outline-none custom-audio-player" />
                          </div>
                        )}

                        {/* 본문 텍스트 */}
                        <p className="text-slate-200 text-xs font-semibold leading-relaxed whitespace-pre-wrap pl-1">
                          {item.content_text}
                        </p>

                        {/* AI 자율 의사결정 감사로그 표시 (프리미엄 네온뱃지 레이아웃) */}
                        {aiAnalysisObj && (
                          <div className="bg-indigo-950/20 border border-indigo-500/15 rounded-2xl p-3.5 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-indigo-400 font-black text-[10px] uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                                <span>AI Autonomous CRM Action</span>
                              </div>
                              <span className={`text-[8px] font-black px-1.5 py-0.3 rounded border uppercase tracking-wider ${
                                aiAnalysisObj.action_taken !== 'NO_ACTION' 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-slate-800/50 border-slate-700 text-slate-400'
                              }`}>
                                {aiAnalysisObj.action_taken}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-350 leading-relaxed font-bold pl-0.5">
                              {aiAnalysisObj.analysis_summary}
                            </p>
                            {aiAnalysisObj.extracted_data?.contact && (
                              <div className="mt-2.5 pt-2 border-t border-indigo-500/10 flex items-center gap-2 text-[10px] text-indigo-300 font-bold animate-fade-in">
                                <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>[담당자 등록 완수] {aiAnalysisObj.extracted_data.contact.name} {aiAnalysisObj.extracted_data.contact.position ? `(${aiAnalysisObj.extracted_data.contact.position})` : ''}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={timelineEndRef} />
              </div>
            )}
          </>
        ) : (
          <p className="text-center py-20 text-xs text-slate-500 font-bold">오른쪽 상단 [새 태스크] 버튼을 눌러 첫 태스크를 열어주세요.</p>
        )}
      </div>

      {/* 3. 모바일 하단 플로팅 스냅 컨트롤러 위젯 (파일, 사진, 녹취 원스톱 캡처 인풋) */}
      {selectedTask && (
        <div className="bg-slate-900/90 border-t border-slate-800 p-4 sticky bottom-0 z-40 backdrop-blur-md shrink-0">
          <form onSubmit={handleSnapSubmit} className="max-w-lg mx-auto space-y-3.5">
            
            {/* 파일 첨부 프레임 */}
            {attachedFile && (
              <div className="bg-slate-950 border border-indigo-500/20 p-2.5 rounded-2xl flex items-center justify-between text-xs font-semibold animate-scale-up">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase">
                    {attachedFileType}
                  </span>
                  <span className="text-slate-300 truncate max-w-xs">{attachedFile.name}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setAttachedFile(null);
                    setAttachedFileBase64("");
                  }} 
                  className="p-1 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 입력란 + 액션 버튼 트레이 */}
            <div className="flex items-end gap-2.5 relative">
              
              {/* 수기 텍스트 인풋 */}
              <div className="flex-1 bg-slate-950 border border-slate-850 rounded-2xl px-3.5 py-2.5 flex flex-col focus-within:border-indigo-500 transition-colors">
                <textarea 
                  value={contentText}
                  onChange={e => setContentText(e.target.value)}
                  placeholder={attachedFile ? "이 파일에 대한 핵심 미팅 상담 요약 메모를 적어주세요..." : "상담 수기 메모 기입 또는 지도 위치 공유 링크 붙여넣기..."}
                  className="w-full bg-transparent outline-none resize-none text-xs font-semibold text-slate-200 placeholder-slate-650 h-10 scrollbar-none"
                />
                
                {/* 퀵 미디어 첨부 단추들 */}
                <div className="flex gap-3 pt-2.5 border-t border-slate-900 mt-2 text-slate-500">
                  <input 
                    type="file" 
                    id="snapImage" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={e => handleFileChange(e, 'IMAGE')}
                    className="hidden" 
                  />
                  <label htmlFor="snapImage" className="hover:text-indigo-400 cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-wider shrink-0 transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <span>카메라</span>
                  </label>

                  <input 
                    type="file" 
                    id="snapAudio" 
                    accept="audio/*" 
                    onChange={e => handleFileChange(e, 'AUDIO')}
                    className="hidden" 
                  />
                  <label htmlFor="snapAudio" className="hover:text-indigo-400 cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-wider shrink-0 transition-colors">
                    <Mic className="w-3.5 h-3.5" />
                    <span>녹취음성</span>
                  </label>

                  <input 
                    type="file" 
                    id="snapPdf" 
                    accept="application/pdf" 
                    onChange={e => handleFileChange(e, 'PDF')}
                    className="hidden" 
                  />
                  <label htmlFor="snapPdf" className="hover:text-indigo-400 cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-wider shrink-0 transition-colors">
                    <FileText className="w-3.5 h-3.5" />
                    <span>문서 PDF</span>
                  </label>
                </div>
              </div>

              {/* 전송 단추 */}
              <button
                type="submit"
                disabled={snapping || (!contentText.trim() && !attachedFile)}
                className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-xs shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all shrink-0 disabled:opacity-40 animate-pulse"
              >
                {snapping ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>

            </div>
          </form>
        </div>
      )}

      {/* 모달: 신규 태스크 개설 팝업 */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateTask}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl relative animate-scale-up"
          >
            <button 
              type="button" 
              onClick={() => setIsNewTaskOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>새로운 비즈니스 협업 태스크 생성</span>
            </h3>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block pl-0.5">태스크 제목 *</label>
              <input 
                type="text"
                placeholder="예: 미래푸드 유통 원두 제안 건"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-2xl outline-none text-xs font-bold"
                required
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsNewTaskOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl text-xs font-bold"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/10"
              >
                생성 완료
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
