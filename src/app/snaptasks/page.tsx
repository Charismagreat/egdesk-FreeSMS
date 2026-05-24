"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Compass, CheckCircle2, Archive, Trash2, 
  Eye, Building2, Clock, Calendar, Volume2, FileText, 
  MapPin, X, ArrowRight, Activity, Play, Plus
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

export default function SnapTasksDashboard() {
  const [tasks, setTasks] = useState<SnapTask[]>([]);
  const [loading, setLoading] = useState(true);

  // 상세 팝업 상태
  const [selectedTask, setSelectedTask] = useState<SnapTask | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [partner, setPartner] = useState<any | null>(null);
  const [partnerContacts, setPartnerContacts] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // PC 즉석 스냅 전송용 상태
  const [contentText, setContentText] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFileType, setAttachedFileType] = useState<'IMAGE' | 'PDF' | 'AUDIO' | 'LINK' | 'TEXT'>('TEXT');
  const [attachedFileBase64, setAttachedFileBase64] = useState("");
  const [snapping, setSnapping] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetSnapForm = () => {
    setContentText("");
    setAttachedFile(null);
    setAttachedFileType('TEXT');
    setAttachedFileBase64("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

  // PC 대시보드 즉석 AI 자율주행 스냅 전송 기동!
  const handleSnapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!contentText.trim() && !attachedFile) {
      alert("전송할 업무 메모 텍스트나 사진/파일을 첨부해 주세요.");
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
        resetSnapForm();
        
        // 상세 정보 실시간 리로드
        const timelineRes = await fetch(`/api/snaptasks?action=timeline&task_id=${selectedTask.id}`);
        const timelineData = await timelineRes.json();
        if (timelineData.success) {
          setTimeline(timelineData.timeline || []);
          setActions(timelineData.actions || []);
          setPartner(timelineData.partner || null);
          setPartnerContacts(timelineData.partnerContacts || []);
        }

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

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/snaptasks");
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error("스냅태스크 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  // 상세 타임라인 정보 로드
  const openDetailPopup = async (task: SnapTask) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
    setDetailLoading(true);
    setPartner(null);
    setPartnerContacts([]);
    resetSnapForm();
    try {
      const res = await fetch(`/api/snaptasks?action=timeline&task_id=${task.id}`);
      const data = await res.json();
      if (data.success) {
        setTimeline(data.timeline || []);
        setActions(data.actions || []);
        setPartner(data.partner || null);
        setPartnerContacts(data.partnerContacts || []);
      }
    } catch (e) {
      console.error("상세 타임라인 로드 실패:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  // 상태 변경 (수주완료 / 보관 등)
  const handleUpdateStatus = async (task: SnapTask, nextStatus: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED') => {
    try {
      const res = await fetch("/api/snaptasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
        if (isDetailOpen && selectedTask?.id === task.id) {
          setSelectedTask(prev => prev ? { ...prev, status: nextStatus } : null);
        }
        alert(`태스크가 정상적으로 '${nextStatus}' 상태로 전이되었습니다.`);
      }
    } catch (err) {
      alert("상태 수정 중 오류가 발생했습니다.");
    }
  };

  // 태스크 영구 삭제
  const handleDeleteTask = async (task: SnapTask, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`[경고] 스냅태스크 '${task.title}'과 관련된 모든 파일 스냅, 오디오, AI 자율 감사로그를 영구히 파괴 삭제하시겠습니까?\n이 작업은 물리 DB에서 복구 불가능합니다.`)) return;

    try {
      const res = await fetch(`/api/snaptasks?id=${task.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
        setIsDetailOpen(false);
        alert("태스크 및 연동 이력이 안전하게 영구 소멸되었습니다.");
      }
    } catch (err) {
      alert("삭제 중 에러가 발생했습니다.");
    }
  };

  // 칸반 카드 분류
  const activeTasks = tasks.filter(t => t.status === 'ACTIVE');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const archivedTasks = tasks.filter(t => t.status === 'ARCHIVED');

  return (
    <div className="space-y-8 animate-fade-in relative pb-16">
      
      {/* 어드민 퍼플 광채 */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl -z-10 animate-pulse"></div>

      {/* 헤더 패널 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-8 h-8 text-indigo-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span>AI 스냅태스크 관제 센터 🪐</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            R&D, 마케팅, 품질관리, 영업 등 전사적 현장에서 스냅한 비정형 데이터를 바탕으로 AI가 자율적으로 ERP 및 업무 연동을 처리하는 통합 관제 대시보드입니다.
          </p>
        </div>

        {/* 퀵 링크 단추 */}
        <a 
          href="/m/snaptasks" 
          target="_blank"
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
        >
          <Activity className="w-4 h-4 text-cyan-300 animate-pulse" />
          현장 실무자 모바일 웹뷰 열기
        </a>
      </div>

      {/* 실시간 전사적 협업 태스크 지표 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">관리 중인 총 협업 태스크</span>
          <span className="text-2xl font-black text-slate-800 block">{tasks.length}개</span>
          <span className="text-[10px] text-indigo-500 block mt-1">활성 진행: {activeTasks.length} / 완료: {completedTasks.length}</span>
        </div>

        <div className="bg-gradient-to-br from-indigo-50/40 to-indigo-100/10 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-indigo-500 uppercase block">AI 자율주행 진행 건수</span>
          <span className="text-2xl font-black text-indigo-600 block">{activeTasks.length}건</span>
          <span className="text-[10px] text-indigo-400 block mt-1">현장 비정형 실시간 수집 및 추론 중</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/40 to-emerald-100/10 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase block">최종 목표 달성 / 태스크 완료</span>
          <span className="text-2xl font-black text-emerald-600 block">{completedTasks.length}건</span>
          <span className="text-[10px] text-emerald-400 block mt-1">업무 목표 달성 및 최종 완료 처리 완수</span>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">아카이브 완료 보관 이력</span>
          <span className="text-2xl font-black text-slate-700 block">{archivedTasks.length}건</span>
          <span className="text-[10px] text-slate-400 block mt-1">감사 완료된 과거 태스크 대장</span>
        </div>
      </div>

      {/* 3대 칸반보드 보드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 칼럼 1: 진행 중 (ACTIVE) */}
        <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 space-y-4 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <span className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
              <Play className="w-4 h-4 text-indigo-500 fill-indigo-500" />
              진행 중인 협업 태스크
            </span>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
              {activeTasks.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {activeTasks.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-400 font-bold">진행 중인 활성 태스크가 없습니다.</p>
            ) : (
              activeTasks.map(t => renderKanbanCard(t))
            )}
          </div>
        </div>

        {/* 칼럼 2: 계약/수주 성사 (COMPLETED) */}
        <div className="bg-emerald-50/20 rounded-3xl p-5 border border-emerald-500/5 space-y-4 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              최종 목표 달성 건
            </span>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
              {completedTasks.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {completedTasks.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-400 font-bold">완료된 수주 계약이 없습니다.</p>
            ) : (
              completedTasks.map(t => renderKanbanCard(t))
            )}
          </div>
        </div>

        {/* 칼럼 3: 완료 보관 (ARCHIVED) */}
        <div className="bg-slate-100/50 rounded-3xl p-5 border border-slate-200/20 space-y-4 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Archive className="w-4 h-4 text-slate-400 fill-slate-400" />
              과거 태스크 이력 보관함
            </span>
            <span className="bg-slate-200 text-slate-650 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
              {archivedTasks.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {archivedTasks.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-400 font-bold">보관함이 비어 있습니다.</p>
            ) : (
              archivedTasks.map(t => renderKanbanCard(t))
            )}
          </div>
        </div>

      </div>

      {/* 팝업 모달: 특정 태스크의 전체 타임라인 & AI 액션로그 피드 조망 */}
      {isDetailOpen && selectedTask && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-4xl w-full p-6 md:p-8 shadow-2xl relative flex flex-col max-h-[85vh] animate-scale-up">
            
            <button 
              onClick={() => setIsDetailOpen(false)} 
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 헤더 */}
            <div className="space-y-1 mb-5">
              <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded font-black tracking-wider uppercase inline-block">
                SnapTask Deep-Mining Analysis
              </span>
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <span>{selectedTask.title}</span>
                {selectedTask.partner_company_name && (
                  <span className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-extrabold">
                    파트너: {selectedTask.partner_company_name}
                  </span>
                )}
              </h3>
            </div>

            {/* 본체: 2단 분할 레이아웃 (좌: AI 자율 감사 감사록, 우: 스냅 타임라인 피드) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 overflow-hidden">
              
              {/* 좌측 2열: B2B 파트너/명함첩 및 AI 감사기록 피드 */}
              <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
                
                {/* 1. B2B 파트너 & 소속 담당자 명함첩 */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col overflow-hidden max-h-[45%]">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    B2B 파트너 및 소속 담당자 명함첩
                  </h4>

                  {detailLoading ? (
                    <p className="text-center py-6 text-xs text-slate-400">파트너 마이닝 중...</p>
                  ) : !partner ? (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-[11px] text-slate-450 font-bold leading-normal">
                        아직 연동된 B2B 거래처 정보가 없습니다.<br />
                        명함 스냅 시 AI가 거래처를 실시간 자동 개설합니다.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col overflow-hidden space-y-3 font-semibold text-xs text-slate-700">
                      {/* 파트너 회사 마스터 정보 */}
                      <div className="bg-white p-3 border border-slate-100 rounded-xl space-y-1.5 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-sm text-indigo-600 truncate">{partner.company_name}</span>
                          <span className="text-[9px] font-bold text-slate-400 font-mono">{partner.business_number}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 space-y-0.5 leading-tight">
                          <p>📍 {partner.address || '주소 등록 안 됨'}</p>
                          <p>📞 {partner.phone || '대표 연락처 없음'}</p>
                        </div>
                      </div>

                      {/* 다중 담당자 리스트 */}
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          소속 담당자 명함첩 ({partnerContacts.length}명)
                        </span>
                        
                        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                          {partnerContacts.length === 0 ? (
                            <p className="text-center py-4 text-[10px] text-slate-400 font-bold">등록된 담당자가 없습니다.</p>
                          ) : (
                            partnerContacts.map(contact => (
                              <div key={contact.id} className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all shadow-sm ${
                                contact.is_primary === 1 
                                  ? 'bg-gradient-to-r from-indigo-50/50 to-indigo-100/10 border-indigo-500/20' 
                                  : 'bg-white border-slate-100'
                              }`}>
                                {/* 담당자 명함 또는 기본 아바타 아이콘 */}
                                {contact.card_image_url ? (
                                  <a href={contact.card_image_url} target="_blank" rel="noreferrer" className="block shrink-0">
                                    <img src={contact.card_image_url} className="w-9 h-9 object-cover rounded-lg border border-slate-200" alt="Card" />
                                  </a>
                                ) : (
                                  <div className="w-9 h-9 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center text-slate-450 border">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0 space-y-0.5 text-[10px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-slate-800 truncate">{contact.name}</span>
                                    {contact.position && (
                                      <span className="text-[9px] text-slate-500 font-medium truncate">{contact.position}</span>
                                    )}
                                    {contact.is_primary === 1 && (
                                      <span className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.2 rounded font-black shrink-0">대표</span>
                                    )}
                                  </div>
                                  <div className="text-slate-500 font-mono space-y-0.2">
                                    {contact.phone && <p>📞 {contact.phone}</p>}
                                    {contact.email && <p>📧 {contact.email}</p>}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. AI 자율 액션 감사기록 피드 */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col overflow-hidden flex-1 max-h-[55%]">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider block mb-3 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                    AI 자율 ERP 실행 감사록
                  </h4>
                  
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                    {detailLoading ? (
                      <p className="text-center py-10 text-xs text-slate-400">자율 액션 마이닝 중...</p>
                    ) : actions.length === 0 ? (
                      <p className="text-center py-10 text-xs text-slate-450 font-bold leading-relaxed">
                        아직 AI 자율 실행 내역이 존재하지 않습니다.<br />
                        현장 모바일 웹에서 미팅록, 명함, 서명을 스냅하여 연동해 주세요.
                      </p>
                    ) : (
                      actions.map(act => (
                        <div key={act.id} className="p-3 bg-white border border-indigo-500/10 rounded-xl flex flex-col space-y-1 font-semibold text-xs animate-scale-up shadow-sm">
                          <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded w-max">
                            {act.action_type}
                          </span>
                          <p className="text-slate-800 leading-normal pl-0.5">
                            {act.description}
                          </p>
                          <span className="text-[8px] text-slate-400 font-mono block pl-0.5">
                            {act.created_at}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* 우측 3열: 타임라인 데이터 피드 리스트 */}
              <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-4.5 flex flex-col overflow-hidden">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider block mb-3">
                  스냅 타임라인 피드 히스토리
                </h4>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  {detailLoading ? (
                    <p className="text-center py-10 text-xs text-slate-400">스냅 데이터 디코딩 중...</p>
                  ) : timeline.length === 0 ? (
                    <p className="text-center py-10 text-xs text-slate-400">등록된 스냅 기록이 없습니다.</p>
                  ) : (
                    timeline.map(item => {
                      let aiObj: any = null;
                      try {
                        if (item.ai_analysis) aiObj = JSON.parse(item.ai_analysis);
                      } catch (e) {}

                      return (
                        <div key={item.id} className="border-b border-slate-50 pb-4 space-y-2 font-semibold text-xs">
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                              {item.file_type} 스냅
                            </span>
                            <span className="font-mono">{item.created_at}</span>
                          </div>

                          {/* 첨부 파일 썸네일 */}
                          {item.file_url && (
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 max-w-sm">
                              {item.file_type === 'IMAGE' ? (
                                <img src={item.file_url} className="w-10 h-10 object-cover rounded-lg border" alt="Thumb" />
                              ) : (
                                <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                                  <FileText className="w-5 h-5" />
                                </div>
                              )}
                              <a href={item.file_url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline truncate flex-1 block">
                                {item.file_url.split('/').pop()}
                              </a>
                            </div>
                          )}

                          {item.file_type === 'AUDIO' && item.file_url && (
                            <audio src={item.file_url} controls className="w-full h-8 outline-none scale-95 origin-left" />
                          )}

                          <p className="text-slate-800 whitespace-pre-wrap leading-relaxed pl-0.5">{item.content_text}</p>
                          
                          {aiObj && (
                            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 leading-normal">
                              🎯 <span className="text-indigo-600">[AI 해독]</span> {aiObj.analysis_summary}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* PC 즉석 AI 스냅 입력 위젯 */}
                {selectedTask && (
                  <div className="mt-4 border-t border-slate-100 pt-4 bg-white shrink-0">
                    <form onSubmit={handleSnapSubmit} className="space-y-3">
                      
                      {/* 파일 첨부 미리보기 */}
                      {attachedFile && (
                        <div className="bg-slate-50 border border-indigo-500/10 p-2 rounded-xl flex items-center justify-between text-xs font-semibold animate-scale-up">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                              {attachedFileType}
                            </span>
                            <span className="text-slate-700 truncate text-[11px] font-bold">{attachedFile.name}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => {
                              setAttachedFile(null);
                              setAttachedFileBase64("");
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }} 
                            className="p-1 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-505 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-end gap-2.5">
                        
                        {/* 텍스트 입력창 & 첨부 버튼 트레이 */}
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-3 focus-within:border-indigo-500 focus-within:bg-white transition-all flex flex-col">
                          <textarea 
                            value={contentText}
                            onChange={e => setContentText(e.target.value)}
                            placeholder={attachedFile ? "이 첨부파일에 대한 AI 자율 분석 및 조치 지시 요약 메모를 입력하세요..." : "현장 업무 상담 메모 기입, 주소 링크 입력 또는 AI에게 자율 지시를 내려보세요..."}
                            className="w-full bg-transparent outline-none resize-none text-xs font-semibold text-slate-750 placeholder-slate-400 h-12 scrollbar-none"
                            onKeyDown={(e) => {
                              // Ctrl+Enter 시 즉석 전송 편리 기능
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                handleSnapSubmit(e);
                              }
                            }}
                          />
                          
                          {/* 파일 첨부 퀵 버튼 */}
                          <div className="flex gap-4 pt-2 border-t border-slate-100 mt-2 text-slate-500 select-none">
                            <input 
                              type="file" 
                              id="pcSnapImage" 
                              ref={fileInputRef} 
                              accept="image/*" 
                              onChange={e => handleFileChange(e, 'IMAGE')}
                              className="hidden" 
                            />
                            <label htmlFor="pcSnapImage" className="hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider shrink-0 transition-colors">
                              <Camera className="w-3.5 h-3.5" />
                              <span>이미지 첨부</span>
                            </label>

                            <input 
                              type="file" 
                              id="pcSnapAudio" 
                              accept="audio/*" 
                              onChange={e => handleFileChange(e, 'AUDIO')}
                              className="hidden" 
                            />
                            <label htmlFor="pcSnapAudio" className="hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider shrink-0 transition-colors">
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>음성/녹취</span>
                            </label>

                            <input 
                              type="file" 
                              id="pcSnapPdf" 
                              accept="application/pdf" 
                              onChange={e => handleFileChange(e, 'PDF')}
                              className="hidden" 
                            />
                            <label htmlFor="pcSnapPdf" className="hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider shrink-0 transition-colors">
                              <FileText className="w-3.5 h-3.5" />
                              <span>문서 PDF</span>
                            </label>

                            <span className="text-[9px] text-slate-400 font-medium ml-auto self-center select-none font-mono">
                              Ctrl + Enter 로 즉석 전송
                            </span>
                          </div>
                        </div>

                        {/* 전송 단추 */}
                        <button
                          type="submit"
                          disabled={snapping || (!contentText.trim() && !attachedFile)}
                          className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-xs shadow-md hover:from-indigo-500 hover:to-purple-550 transition-all shrink-0 disabled:opacity-40"
                        >
                          {snapping ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Plus className="w-4 h-4 text-white" />
                          )}
                        </button>

                      </div>

                    </form>
                  </div>
                )}
              </div>

            </div>

            {/* 하단 트랜지션 액션바 */}
            <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setIsDetailOpen(false)} 
                className="flex-1 py-3 bg-slate-150 hover:bg-slate-200 text-slate-750 font-bold text-xs rounded-xl transition-colors"
              >
                관제 탑으로 복귀
              </button>
              
              {selectedTask.status === 'ACTIVE' && (
                <button 
                  onClick={() => handleUpdateStatus(selectedTask, 'COMPLETED')}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
                >
                  목표 달성 및 태스크 완료 승인 (COMPLETED)
                </button>
              )}

              {selectedTask.status === 'COMPLETED' && (
                <button 
                  onClick={() => handleUpdateStatus(selectedTask, 'ARCHIVED')}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition-colors"
                >
                  과거 이력함 보관 이관 (ARCHIVED)
                </button>
              )}

              {selectedTask.status === 'ARCHIVED' && (
                <button 
                  onClick={() => handleUpdateStatus(selectedTask, 'ACTIVE')}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-colors"
                >
                  활성 진행 태스크 복구 (ACTIVE)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // 칸반 카드 렌더러
  function renderKanbanCard(task: SnapTask) {
    return (
      <div 
        key={task.id}
        onClick={() => openDetailPopup(task)}
        className="bg-white border border-slate-100 hover:border-indigo-500/30 p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 group space-y-3.5 animate-scale-up"
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold font-mono text-slate-400">{task.id}</span>
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
            task.status === 'ACTIVE' ? 'bg-indigo-50 border-indigo-100 text-indigo-500' :
            task.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
            'bg-slate-100 border-slate-200 text-slate-500'
          }`}>
            {task.status}
          </span>
        </div>

        <h3 className="text-sm font-extrabold text-slate-800 tracking-tight leading-snug group-hover:text-indigo-600 transition-colors">
          {task.title}
        </h3>

        {task.partner_company_name && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="truncate">거래처: {task.partner_company_name}</span>
          </div>
        )}

        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>생성일: {task.created_at.substring(0, 10)}</span>
          </div>

          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => openDetailPopup(task)}
              className="p-1 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-all"
              title="상세 관제 피드 보기"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => handleDeleteTask(task, e)}
              className="p-1 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-all"
              title="영구 삭제 파괴"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}
