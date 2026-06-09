"use client";

import React, { useState, useEffect } from 'react';
import { 
  Award, Shield, Calendar, CheckCircle, AlertTriangle, XCircle, 
  UserPlus, FileText, Camera, ShieldAlert, Cpu, Sparkles, 
  ArrowRight, Check, RefreshCw, Upload, Mic, Trash2, Key,
  Activity, Users, LayoutDashboard, Home, X, Info
} from 'lucide-react';

export default function RndManagementPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'space' | 'log'>('dashboard');
  const [centerInfo, setCenterInfo] = useState<any>(null);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [alarms, setAlarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKoitaInfo, setShowKoitaInfo] = useState(false);

  // AI 연구일지 생성 관련 상태
  const [logInputSource, setLogInputSource] = useState<'VOICE' | 'GITHUB' | 'JIRA'>('GITHUB');
  const [logRawContent, setLogRawContent] = useState('');
  const [aiGeneratedLog, setAiGeneratedLog] = useState<any>(null);
  const [isGeneratingLog, setIsGeneratingLog] = useState(false);

  // OCR 자격증명 검증 관련 상태
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [isVerifyingOcr, setIsVerifyingOcr] = useState(false);

  // 신규 연구원 추가 폼 상태
  const [newStaffUser, setNewStaffUser] = useState({
    user_id: '5',
    name: '김테크',
    staff_role: 'RESEARCHER',
    degree_level: 'BACHELOR',
    major_name: '컴퓨터공학과',
    major_category: 'ENGINEERING',
    joined_date: ''
  });

  // 공간 비전 AI 상세 모달 상태
  const [selectedSpaceCheck, setSelectedSpaceCheck] = useState<any>(null);

  // 데이터 로딩
  const fetchData = async () => {
    setLoading(true);
    try {
      const centerRes = await fetch('/api/rnd?type=center').then(r => r.json());
      const staffsRes = await fetch('/api/rnd?type=staffs').then(r => r.json());
      const spacesRes = await fetch('/api/rnd?type=spaces').then(r => r.json());
      const logsRes = await fetch('/api/rnd?type=logs').then(r => r.json());
      const alarmsRes = await fetch('/api/rnd?type=alarms').then(r => r.json());

      if (centerRes.success) setCenterInfo(centerRes.center);
      if (staffsRes.success) setStaffs(staffsRes.staffs);
      if (spacesRes.success) setSpaces(spacesRes.spaces);
      if (logsRes.success) setLogs(logsRes.logs);
      if (alarmsRes.success) setAlarms(alarmsRes.alarms);
    } catch (e) {
      console.error('R&D 데이터 로드 실패', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // AI 연구일지 초안 생성 요청
  const handleGenerateLog = async () => {
    if (!logRawContent.trim()) {
      alert('AI 분석을 위한 음성 텍스트나 Git/Jira 작업 로그를 입력해 주세요.');
      return;
    }
    setIsGeneratingLog(true);
    setAiGeneratedLog(null);
    try {
      const res = await fetch('/api/rnd/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: logInputSource, content: logRawContent })
      }).then(r => r.json());

      if (res.success) {
        setAiGeneratedLog(res.ai_draft);
      } else {
        alert(res.error || 'AI 초안 생성 실패');
      }
    } catch (e) {
      console.error(e);
      alert('서버 통신 실패');
    } finally {
      setIsGeneratingLog(false);
    }
  };

  // AI 일지 저장 및 결재 요청
  const handleSaveAndSubmitLog = async () => {
    if (!aiGeneratedLog) return;
    try {
      const res = await fetch('/api/rnd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'log_add',
          data: {
            author_id: 3, // 임시 지정 (이철수)
            work_date: new Date().toISOString().slice(0, 10),
            raw_source: logInputSource,
            raw_content: logRawContent,
            ai_generated_title: aiGeneratedLog.title,
            ai_generated_content: aiGeneratedLog.content,
            approval_status: 'PENDING'
          }
        })
      }).then(r => r.json());

      if (res.success) {
        alert('연구일지가 성공적으로 생성되어 결재 대기 목록에 추가되었습니다.');
        setLogRawContent('');
        setAiGeneratedLog(null);
        fetchData();
      } else {
        alert(res.error || '저장 실패');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 연구일지 결재 승인
  const handleApproveLog = async (logId: number) => {
    try {
      const res = await fetch('/api/rnd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'log_approve',
          data: { log_id: logId, approver_id: 1 } // 홍길동 소장 승인
        })
      }).then(r => r.json());

      if (res.success) {
        alert('연구일지가 최종 결재 승인되었으며 블록체인 해시가 각인되었습니다.');
        fetchData();
      } else {
        alert(res.error || '결재 승인 오류');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 연구원 퇴사 처리
  const handleResignStaff = async (staffId: number) => {
    if (!confirm('해당 연구원을 부설연구소 제외(퇴사) 처리하시겠습니까? 퇴사일 기준 14일 이내 변경신고가 의무화됩니다.')) return;
    try {
      const res = await fetch('/api/rnd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'staff_update',
          data: { staff_id: staffId, employment_status: 'RESIGNED' }
        })
      }).then(r => r.json());

      if (res.success) {
        alert('퇴사 처리가 성공적으로 완료되었습니다. KOITA 변경신고 알림이 활성화되었습니다.');
        fetchData();
      } else {
        alert(res.error || '처리 실패');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 졸업증명서 OCR 검증 시뮬레이션
  const handleOcrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOcrFile(file);
      setOcrPreviewUrl(URL.createObjectURL(file));
      setOcrResult(null);
    }
  };

  const handleVerifyOcr = async () => {
    if (!ocrFile) {
      alert('검증할 학위증명서(졸업증명서) 이미지를 선택해 주세요.');
      return;
    }
    setIsVerifyingOcr(true);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // 분석 대기 연출

    // 가짜 OCR 자격 판정 데이터
    setOcrResult({
      university: "한국과학기술대학교",
      degree: "학사 (Bachelor of Engineering)",
      major: "컴퓨터공학과 (전자계열)",
      major_category: "ENGINEERING",
      koita_eligible: true,
      reason: "이공계열 학사 학위 취득자로, 중소기업 기준 무경력 신입 전담연구원 등록 요건을 완벽히 충족합니다."
    });
    setIsVerifyingOcr(false);
  };

  // OCR 검증 완료 후 연구원 추가 실행
  const handleAddStaffFromOcr = async () => {
    if (!ocrResult) return;
    try {
      const res = await fetch('/api/rnd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'staff_add',
          data: {
            user_id: 5, // 더미 사용자 ID
            name: "김테크",
            staff_role: "RESEARCHER",
            degree_level: "BACHELOR",
            major_name: ocrResult.major.split(' ')[0],
            major_category: ocrResult.major_category,
            qualification_status: "QUALIFIED",
            graduation_cert_ocr_json: ocrResult
          }
        })
      }).then(r => r.json());

      if (res.success) {
        alert('학위증명서 OCR 결과를 기반으로 연구원이 정상 등록되었습니다. 14일 이내 변경신고를 잊지 마세요!');
        setOcrFile(null);
        setOcrPreviewUrl('');
        setOcrResult(null);
        fetchData();
      } else {
        alert(res.error || '연구원 등록 실패');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 알림 상태 해결 처리
  const handleResolveAlarm = async (alarmId: number) => {
    try {
      const res = await fetch('/api/rnd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'alarm_resolve',
          data: { alarm_id: alarmId }
        })
      }).then(r => r.json());

      if (res.success) {
        alert('알림 경보 해결 처리가 완료되었습니다.');
        fetchData();
      } else {
        alert(res.error || '처리 실패');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-medium">부설연구소 사후관리 AI 엔진을 로딩하고 있습니다...</p>
      </div>
    );
  }

  // 컴플라이언스 헬스 체크 산출 데이터
  const activeAlarmsCount = alarms.filter(a => a.is_resolved === 0).length;
  const staffCount = staffs.filter(s => s.employment_status === 'ACTIVE').length;
  const pendingLogsCount = logs.filter(l => l.approval_status === 'PENDING').length;
  const lastSpaceCheck = spaces[0];

  const getComplianceStatus = () => {
    let staff = { status: '적격', color: 'text-green-500 bg-green-50' };
    let space = { status: '적격', color: 'text-green-500 bg-green-50' };
    let log = { status: '적격', color: 'text-green-500 bg-green-50' };

    // 인적 요건 체크
    const staffAlarms = alarms.filter(a => a.category === 'STAFF_CHANGE' && a.is_resolved === 0);
    if (staffAlarms.length > 0) {
      staff = { status: '변경신고 대기', color: 'text-red-500 bg-red-50 border-red-100' };
    } else if (staffCount < 3) {
      staff = { status: '전담원 부족', color: 'text-red-500 bg-red-50 border-red-100' };
    }

    // 물적 요건 체크
    if (lastSpaceCheck) {
      if (lastSpaceCheck.overall_status === '보완필요') {
        space = { status: '보완 필요', color: 'text-amber-500 bg-amber-50 border-amber-100' };
      } else if (lastSpaceCheck.overall_status === '부적격') {
        space = { status: '부적격', color: 'text-red-500 bg-red-50 border-red-100' };
      }
    }

    // 실적 증빙 체크
    if (pendingLogsCount > 0) {
      log = { status: `결재대기 ${pendingLogsCount}건`, color: 'text-amber-500 bg-amber-50 border-amber-100' };
    }

    return { staff, space, log };
  };

  const status = getComplianceStatus();

  return (
    <div className="w-full space-y-6 pb-20 min-w-0 font-sans text-slate-800 animate-fade-in text-left">
      {/* 상단 타이틀 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="text-left">
          <div className="flex items-center space-x-2">
            <Award className="w-8 h-8 text-amber-600 mr-2 shrink-0" />
            <h1 className="text-3xl font-black text-slate-900 flex items-center tracking-tight">
              연구소 관리 AI
              <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold ml-2.5 shrink-0">
                AI 사후관리 관제
              </span>
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            기업부설연구소 사후 행정 요건(인적·물적·R&D 실적)을 자동 검증하고 법적 준수 리스크를 차단합니다.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {centerInfo && (
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3 text-left">
              <div className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-1.5 rounded-lg font-black text-[10px] shrink-0 uppercase">
                {centerInfo.center_type === 'RESEARCH_CENTER' ? '부설연구소' : '연구개발실'}
              </div>
              <div>
                <p className="font-bold text-xs text-slate-700 leading-tight">{centerInfo.center_name}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">KOITA 등록번호: {centerInfo.koita_reg_number}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-[10px] bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="text-slate-400 font-extrabold">KOITA 연동망:</span>
            <span className="text-emerald-600 font-black">실시간 감시 중</span>
            <button
              onClick={() => setShowKoitaInfo(true)}
              className="text-slate-400 hover:text-slate-600 transition-colors ml-1 p-0.5 rounded-full hover:bg-slate-100/80"
              title="상세 안내 보기"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 탭 내비게이션 */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 pb-3">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'dashboard'
              ? "bg-amber-500 text-white shadow-sm scale-102"
              : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          대시보드 홈
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'staff'
              ? "bg-amber-500 text-white shadow-sm scale-102"
              : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          인적 요건 (전담연구원)
        </button>
        <button
          onClick={() => setActiveTab('space')}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'space'
              ? "bg-amber-500 text-white shadow-sm scale-102"
              : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          물적 요건 (공간 진단)
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'log'
              ? "bg-amber-500 text-white shadow-sm scale-102"
              : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          R&D 연구일지 대장
        </button>
      </div>

      {/* 탭 본문 */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {/* 은은한 디자인 효과 블러 */}
          <div className="absolute top-[-150px] left-[-150px] w-[450px] h-[450px] rounded-full bg-amber-50/20 blur-[110px] pointer-events-none"></div>
          <div className="absolute bottom-[-150px] right-[-150px] w-[350px] h-[350px] rounded-full bg-indigo-50/15 blur-[90px] pointer-events-none"></div>

          {/* 좌측 메인 2개 영역 */}
          <div className="lg:col-span-2 space-y-6 relative z-10">
            
            {/* 1. 컴플라이언스 신호등 */}
            <div className="bg-white p-6 md:p-8 border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
              <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center space-x-2.5">
                <Shield className="w-5 h-5 text-amber-600" />
                <span>실시간 컴플라이언스 지표 (Compliance Health Check)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 인적 */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between hover:scale-102 hover:shadow-md transition-all ${status.staff.color.includes('red') ? 'bg-rose-50/50 border-rose-150 text-rose-950' : 'bg-green-50/40 border-green-150 text-green-950'}`}>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">인적 요건 (Staff)</span>
                    <span className="text-lg font-black mt-2 block">{status.staff.status}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-4 font-semibold leading-relaxed border-t border-slate-100/50 pt-3">
                    • 재직 연구원: <span className="font-extrabold">{staffCount}명</span> (학사 이상)<br />
                    • 변경 신고 대기 및 리스크 없음
                  </div>
                </div>
                {/* 물적 */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between hover:scale-102 hover:shadow-md transition-all ${status.space.color.includes('red') ? 'bg-rose-50/50 border-rose-150 text-rose-950' : status.space.color.includes('amber') ? 'bg-amber-50/40 border-amber-150 text-amber-950' : 'bg-green-50/40 border-green-150 text-green-950'}`}>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">물적 요건 (Space)</span>
                    <span className="text-lg font-black mt-2 block">{status.space.status}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-4 font-semibold leading-relaxed border-t border-slate-100/50 pt-3">
                    {lastSpaceCheck ? (
                      <>
                        • 최종 진단: <span className="font-extrabold">{lastSpaceCheck.check_date}</span><br />
                        • 판정: <span className="font-extrabold">{lastSpaceCheck.overall_status}</span>
                      </>
                    ) : (
                      "• 공간 진단 이력 없음"
                    )}
                  </div>
                </div>
                {/* 실적 */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between hover:scale-102 hover:shadow-md transition-all ${status.log.color.includes('red') ? 'bg-rose-50/50 border-rose-150 text-rose-950' : status.log.color.includes('amber') ? 'bg-amber-50/40 border-amber-150 text-amber-950' : 'bg-green-50/40 border-green-150 text-green-950'}`}>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">실적 증빙 (R&D Log)</span>
                    <span className="text-lg font-black mt-2 block">{status.log.status}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-4 font-semibold leading-relaxed border-t border-slate-100/50 pt-3">
                    • 미결재 대기건: <span className="font-extrabold text-amber-600">{pendingLogsCount}건</span><br />
                    • 금주 일지 작성 현황 양호
                  </div>
                </div>
              </div>
            </div> 
 
            {/* 2. AI 연구일지 퀵 편찰기 */}
            <div className="bg-white p-6 md:p-8 border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 border-b border-slate-50 pb-4">
                <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                  <span>AI 연구일지 1초 자동 편찬기</span>
                </h2>
                <div className="flex space-x-1.5 bg-slate-50 p-1.5 rounded-xl text-xs border border-slate-150 shrink-0 self-start">
                  <button 
                    onClick={() => setLogInputSource('GITHUB')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${logInputSource === 'GITHUB' ? 'bg-white text-slate-800 shadow-sm scale-102' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    GitHub 커밋 연동
                  </button>
                  <button 
                    onClick={() => setLogInputSource('JIRA')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${logInputSource === 'JIRA' ? 'bg-white text-slate-800 shadow-sm scale-102' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    Jira 태스크
                  </button>
                  <button 
                    onClick={() => setLogInputSource('VOICE')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${logInputSource === 'VOICE' ? 'bg-white text-slate-800 shadow-sm scale-102' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    구두 녹음(STT)
                  </button>
                </div>
              </div>
 
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2">
                    {logInputSource === 'GITHUB' && 'Github 커밋 메시지 또는 PR 제목을 입력해 주세요.'}
                    {logInputSource === 'JIRA' && 'Jira 완료 태스크 내용 또는 스프린트 티켓 정보를 넣어주세요.'}
                    {logInputSource === 'VOICE' && '모바일 이지봇에서 전송된 STT 음성 내용 또는 직접 받아쓰기할 구어체 내용을 적어주세요.'}
                  </label>
                  <textarea 
                    value={logRawContent}
                    onChange={(e) => setLogRawContent(e.target.value)}
                    placeholder={
                      logInputSource === 'GITHUB' ? "예: Commit: feat(auth): OAuth2.0 소셜 로그인 연동 모듈 최적화 및 카카오 로그인 예외처리 보정" :
                      logInputSource === 'JIRA' ? "예: Jira #102: Webpack 번들링 다이나믹 임포트 전환 및 청크 사이즈 최적화" :
                      "예: 오늘 파티션 높이 적격 여부 식별하는 딥러닝 모델 임계값을 0.5에서 0.6으로 바꾸면서 테스트하고 정밀도 높였어."
                    }
                    className="w-full h-24 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 leading-relaxed"
                  />
                </div>
 
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerateLog}
                    disabled={isGeneratingLog}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4.5 py-2.5 rounded-xl flex items-center space-x-2 transition-all hover:scale-102 active:scale-98 disabled:opacity-60 shadow-md shadow-indigo-500/10"
                  >
                    <Cpu className={`w-4 h-4 ${isGeneratingLog ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingLog ? 'AI가 표준 양식으로 작문하는 중...' : 'AI 연구일지 초안 편찬'}</span>
                  </button>
                </div>
 
                {/* AI 편찬 결과 프리뷰 */}
                {aiGeneratedLog && (
                  <div className="border border-indigo-100 bg-indigo-50/30 p-5 rounded-2xl space-y-4 shadow-inner">
                    <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2">
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 rounded-md">AI 초안 편찬 완료</span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center"><Key className="w-3.5 h-3.5 mr-1" /> 위변조방지 체인 대기</span>
                    </div>
                    <div className="space-y-2">
                      <p className="font-extrabold text-slate-900 text-sm">과제명: {aiGeneratedLog.title}</p>
                      <div className="bg-white border border-slate-100 p-4 rounded-xl text-xs text-slate-650 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto font-mono">
                        {aiGeneratedLog.content}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-1">
                      <button 
                        onClick={() => setAiGeneratedLog(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold px-3 py-2 rounded-lg transition-colors border border-slate-200"
                      >
                        초기화
                      </button>
                      <button 
                        onClick={handleSaveAndSubmitLog}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold px-4 py-2 rounded-lg transition-all flex items-center space-x-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>소장 결재 요청</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
 
          {/* 우측 사이드바 1개 영역 */}
          <div className="space-y-6 relative z-10">
            {/* 3. 모바일 비전 진단 QR */}
            <div className="bg-white p-6 md:p-8 border border-slate-100 rounded-3xl shadow-sm text-center flex flex-col justify-between h-72 hover:scale-101 hover:shadow-md transition-all">
              <div>
                <h2 className="text-sm font-black text-slate-900 mb-2.5 flex items-center justify-center space-x-2">
                  <Camera className="w-4.5 h-4.5 text-amber-600" />
                  <span>공간 적격성 비전 AI 자가진단</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  현장실사 취소 리스크 1순위인 파티션 높이(1.2m) 및 독립성을 자가 진단하려면 모바일로 접속해 사진을 촬영해 주세요.
                </p>
              </div>
              <div className="flex justify-center my-2.5">
                {/* SVG 기반 간이 모의 QR코드 */}
                <svg className="w-20 h-20 text-slate-800 border border-slate-100 p-1.5 bg-white rounded-lg shadow-sm" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="#ffffff" rx="8" />
                  <rect x="10" y="10" width="25" height="25" fill="currentColor" />
                  <rect x="15" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="10" y="65" width="25" height="25" fill="currentColor" />
                  <rect x="15" y="70" width="15" height="15" fill="#ffffff" />
                  <rect x="65" y="10" width="25" height="25" fill="currentColor" />
                  <rect x="70" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="45" y="45" width="10" height="10" fill="currentColor" />
                  <rect x="65" y="65" width="10" height="15" fill="currentColor" />
                  <rect x="80" y="80" width="10" height="10" fill="currentColor" />
                  <rect x="45" y="75" width="15" height="10" fill="currentColor" />
                </svg>
              </div>
              <div className="text-[9px] text-slate-400 font-black bg-slate-50 py-1.5 rounded-xl border border-slate-100 tracking-tight">
                스마트폰 카메라 촬영 전용
              </div>
            </div>
 
            {/* 4. D-Day 일정 및 컴플라이언스 경보 */}
            <div className="bg-white p-6 md:p-8 border border-slate-100 rounded-3xl shadow-sm flex flex-col min-h-[300px] flex-1">
              <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-red-500" />
                <span>법적 D-Day 및 알림 ({activeAlarmsCount}건)</span>
              </h2>
              
              <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar">
                {alarms.filter(a => a.is_resolved === 0).length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-60" />
                    규제 준수 상태가 매우 우수합니다.
                    <br />
                    활성화된 리스크 알림이 없습니다.
                  </div>
                ) : (
                  alarms.filter(a => a.is_resolved === 0).map(a => {
                    const isCritical = a.severity === 'CRITICAL';
                    return (
                      <div
                        key={a.alarm_id}
                        className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                          isCritical
                            ? 'bg-red-50/50 border-red-100 text-red-950'
                            : 'bg-amber-50/50 border-amber-100 text-amber-950'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              isCritical ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                            }`}
                          >
                            {isCritical ? 'D-Day 위험' : '점검 경고'}
                          </span>
                          {a.due_date && (
                            <span className="font-bold text-slate-500">기한: {a.due_date}</span>
                          )}
                        </div>
                        <p className="font-medium text-slate-700 leading-relaxed">{a.message}</p>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleResolveAlarm(a.alarm_id)}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold px-2 py-1 rounded text-[10px] shadow-sm transition-colors"
                          >
                            조치완료 처리
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 인적 요건 탭 */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {/* 은은한 디자인 효과 블러 */}
          <div className="absolute top-[-150px] left-[-150px] w-[450px] h-[450px] rounded-full bg-amber-50/20 blur-[110px] pointer-events-none"></div>

          {/* 좌측 연구원 리스트 (2칸) */}
          <div className="lg:col-span-2 space-y-6 relative z-10">
            <div className="bg-white p-6 md:p-8 border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5">
                <h2 className="text-lg font-black text-slate-900">등록 전담 연구원 명단 (법정 인력 기준 충족)</h2>
                <div className="text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 font-bold shrink-0 self-start sm:self-auto">
                  연구소 전담 인원: <span className="text-amber-600 font-black">{staffCount}명</span> (설립유지기준: 3명 이상 필요)
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-xs text-left text-slate-500">
                  <thead className="text-[11px] text-slate-700 uppercase bg-slate-50/80 border-b border-slate-100 font-black">
                    <tr>
                      <th className="px-4 py-3.5 font-black">이름</th>
                      <th className="px-4 py-3.5 font-black">역할</th>
                      <th className="px-4 py-3.5 font-black">학위</th>
                      <th className="px-4 py-3.5 font-black">전공 (계열)</th>
                      <th className="px-4 py-3.5 font-black">지정일</th>
                      <th className="px-4 py-3.5 font-black">상태</th>
                      <th className="px-4 py-3.5 text-right font-black">조치</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffs.map((staff) => {
                      const isResigned = staff.employment_status === 'RESIGNED';
                      // UI에 출력하기 위한 한글 매핑
                      const roleMap: any = { DIRECTOR: '연구소장', RESEARCHER: '전담연구원', ASSISTANT: '연구보조원' };
                      const degreeMap: any = { DOCTOR: '박사', MASTER: '석사', BACHELOR: '학사', ASSOCIATE: '전문학사' };
                      
                      return (
                        <tr key={staff.staff_id} className={`hover:bg-slate-50/50 transition-colors ${isResigned ? 'opacity-40 bg-slate-50/30' : ''}`}>
                          <td className="px-4 py-3.5 font-extrabold text-slate-800">
                            {staff.user_id === 2 ? '홍길동' : staff.user_id === 3 ? '이철수' : staff.user_id === 4 ? '박영희' : staff.user_id === 6 ? '최민수' : '김테크'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 font-semibold">{roleMap[staff.staff_role] || staff.staff_role}</td>
                          <td className="px-4 py-3.5 text-slate-600 font-semibold">{degreeMap[staff.degree_level] || staff.degree_level}</td>
                          <td className="px-4 py-3.5 text-slate-600 font-semibold">
                            {staff.major_name} <span className="text-[10px] text-slate-400 font-bold">({staff.major_category === 'ENGINEERING' ? '공학' : '자연'})</span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 font-bold">{staff.joined_date}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isResigned ? 'bg-rose-100 text-rose-800' : 'bg-green-100 text-green-800'}`}>
                              {isResigned ? '제외(퇴사)' : '연구원'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {!isResigned && (
                              <button 
                                onClick={() => handleResignStaff(staff.staff_id)}
                                className="text-rose-600 hover:text-rose-800 text-xs font-bold hover:underline transition-colors"
                              >
                                제외/퇴사
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 우측 신규 연구원 자격 서류 OCR 스캐너 (1칸) */}
          <div className="space-y-6 relative z-10">
            <div className="bg-white p-6 md:p-8 border border-slate-100 rounded-3xl shadow-sm hover:scale-101 hover:shadow-md transition-all">
              <h2 className="text-sm font-black text-slate-900 mb-2 flex items-center space-x-2">
                <FileText className="w-4.5 h-4.5 text-indigo-500" />
                <span>연구원 서류 OCR 자동 자격 판정</span>
              </h2>
              <p className="text-[11px] text-slate-400 mb-4 leading-relaxed font-semibold">
                신규 연구원 졸업증명서나 학위증을 올리면 AI OCR이 대조하여 전공 계열 적격 여부를 사전에 자동 진단해 줍니다.
              </p>

              <div className="space-y-4">
                {/* 파일 드래그앤드롭 영역 */}
                <div className="border-2 border-dashed border-slate-200 hover:border-amber-500/50 hover:bg-slate-50/40 rounded-2xl p-6 text-center transition-all relative cursor-pointer shadow-inner bg-slate-50/20">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleOcrFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {ocrPreviewUrl ? (
                    <div className="space-y-2">
                      <div className="w-full h-28 relative bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ocrPreviewUrl} alt="학위증명서 미리보기" className="max-h-full object-contain" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold truncate">{ocrFile?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 py-2">
                      <Upload className="w-8 h-8 text-slate-350 mx-auto stroke-1" />
                      <p className="text-xs text-slate-500 font-extrabold">학위/졸업증명서 이미지 업로드</p>
                      <p className="text-[9px] text-slate-400 font-bold">지원파일: PNG, JPG, PDF 등</p>
                    </div>
                  )}
                </div>

                {ocrPreviewUrl && !ocrResult && (
                  <button 
                    onClick={handleVerifyOcr}
                    disabled={isVerifyingOcr}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center space-x-2 disabled:opacity-60 hover:scale-102 active:scale-98"
                  >
                    <Cpu className={`w-3.5 h-3.5 ${isVerifyingOcr ? 'animate-spin' : ''}`} />
                    <span>{isVerifyingOcr ? 'AI OCR 스캔 및 자격 판정 중...' : '증명서 진위 및 자격 스캔'}</span>
                  </button>
                )}

                {/* OCR 분석 결과 */}
                {ocrResult && (
                  <div className="border border-green-150 bg-green-50/40 p-4 rounded-xl space-y-3.5 shadow-inner">
                    <div className="flex items-center space-x-1.5 text-xs text-green-700 font-black">
                      <CheckCircle className="w-4 h-4" />
                      <span>자격 요건 분석 결과: 적격(PASS)</span>
                    </div>

                    <div className="text-[11px] text-slate-650 space-y-1.5 font-semibold leading-relaxed">
                      <p><span className="text-slate-400 font-bold">발급기관:</span> {ocrResult.university}</p>
                      <p><span className="text-slate-400 font-bold">학위종류:</span> {ocrResult.degree}</p>
                      <p><span className="text-slate-400 font-bold">전공분야:</span> {ocrResult.major}</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2 mt-2 italic font-mono bg-white/50 p-2 rounded-lg">
                        {ocrResult.reason}
                      </p>
                    </div>

                    <button 
                      onClick={handleAddStaffFromOcr}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1 shadow-md shadow-green-500/10 hover:scale-102 active:scale-98"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>전담 연구원으로 임명</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 물적 요건 탭 */}
      {activeTab === 'space' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">물적 독립 공간 자가 진단 및 Vision AI 이력</h2>
                <p className="text-xs text-slate-500 mt-1">연구실의 사방 격벽 분리 또는 1.2m 이상 파티션 및 현판 확인 실사 대비 분석 데이터</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">점검일</th>
                    <th className="px-4 py-3">입구 현판 상태</th>
                    <th className="px-4 py-3">파티션 감지 높이</th>
                    <th className="px-4 py-3">종합 적격성</th>
                    <th className="px-4 py-3">보완 요구사항</th>
                    <th className="px-4 py-3 text-right">상세 분석 리포트</th>
                  </tr>
                </thead>
                <tbody>
                  {spaces.map((space) => {
                    const isPass = space.overall_status === '합격' || space.overall_status === '合格';
                    const detail = space.ai_analysis_result ? JSON.parse(space.ai_analysis_result) : null;
                    return (
                      <tr key={space.space_check_id} className="border-b hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-800">{space.check_date}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${space.signage_status === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {space.signage_status === 'PASS' ? '부착 확인' : '미부착'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {detail?.estimated_partition_height_m ? `${detail.estimated_partition_height_m}m` : '점검불가'}{' '}
                          <span className={`text-xs ${space.partition_status === 'PASS' ? 'text-green-600' : 'text-red-600 font-bold'}`}>
                            ({space.partition_status === 'PASS' ? '기준충족' : '기준미달'})
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${isPass ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {space.overall_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{space.inspector_notes}</td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => setSelectedSpaceCheck(space)}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                          >
                            비전 리포트 보기
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 비전 모의 오버레이 팝업 모달 */}
          {selectedSpaceCheck && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">Space Vision AI 개체 탐지 결과 리포트</h3>
                    <p className="text-xs text-slate-400 mt-1">실사 일자: {selectedSpaceCheck.check_date}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedSpaceCheck(null)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 이미지 영역 시뮬레이션 */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400">연구실 내부 실측 스냅샷 (YOLOv8 Detection)</p>
                      <div className="relative aspect-video bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-700">
                        {/* 더미 가상의 오버레이 프레임 렌더링 */}
                        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80')" }}></div>
                        
                        {/* 오버레이 박스 1 (파티션) */}
                        <div className={`absolute border-2 ${selectedSpaceCheck.partition_status === 'PASS' ? 'border-green-500' : 'border-red-500'} bg-transparent p-1`} style={{ top: '30%', left: '10%', right: '10%', bottom: '25%' }}>
                          <span className={`absolute -top-6 left-0 px-2 py-0.5 text-[9px] font-bold text-white rounded ${selectedSpaceCheck.partition_status === 'PASS' ? 'bg-green-600' : 'bg-red-600'}`}>
                            Partition (높이: {JSON.parse(selectedSpaceCheck.ai_analysis_result)?.estimated_partition_height_m}m - {selectedSpaceCheck.partition_status === 'PASS' ? 'PASS' : 'FAIL'})
                          </span>
                        </div>
                        {/* 오버레이 박스 2 (연구 좌석) */}
                        <div className="absolute border border-blue-500 bg-transparent p-1" style={{ top: '45%', left: '20%', right: '25%', bottom: '10%' }}>
                          <span className="absolute -top-5 left-0 bg-blue-600 px-1.5 py-0.5 text-[8px] font-bold text-white rounded">
                            R&D Workspace (PASS)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 검증 요약 정보 */}
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-slate-400">비전 진단 종합 로그</p>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-3">
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-semibold text-slate-400">현판 감지 (Signage)</span>
                          <span className={`font-bold ${selectedSpaceCheck.signage_status === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedSpaceCheck.signage_status === 'PASS' ? '검출완료 (PASS)' : '미검출 (FAIL)'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-semibold text-slate-400">파티션 규격 (Partition)</span>
                          <span className={`font-bold ${selectedSpaceCheck.partition_status === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
                            {JSON.parse(selectedSpaceCheck.ai_analysis_result)?.estimated_partition_height_m}m ({selectedSpaceCheck.partition_status === 'PASS' ? 'PASS' : 'FAIL'})
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-semibold text-slate-400">전용공간 분리 (Exclusivity)</span>
                          <span className="font-bold text-green-600">독립 (PASS)</span>
                        </div>
                        <div className="pt-2">
                          <span className="font-semibold text-slate-400 block mb-1">인스펙터 분석 소견</span>
                          <p className="text-slate-700 font-medium leading-relaxed bg-white border p-2.5 rounded-lg italic">
                            "{selectedSpaceCheck.inspector_notes}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => setSelectedSpaceCheck(null)}
                    className="bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors hover:bg-slate-800"
                  >
                    확인 및 닫기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 연구일지 탭 */}
      {activeTab === 'log' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4 border-b pb-4 border-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-800">R&D 연구일지 전자결재 및 감사 추적 (Audit Trail)</h2>
                <p className="text-xs text-slate-500 mt-1">블록체인 타임스탬프 해시 각인으로 국세청 소명 신뢰성을 100% 방어합니다.</p>
              </div>
            </div>

            <div className="space-y-4">
              {logs.map((log) => {
                const isApproved = log.approval_status === 'APPROVED';
                const authorMap: any = { 2: '이철수 연구원', 3: '박영희 연구원', 1: '홍길동 소장' };
                return (
                  <div key={log.log_id} className={`border rounded-2xl p-5 space-y-4 transition-all ${isApproved ? 'bg-white border-slate-200' : 'bg-amber-50/20 border-amber-200'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-50 pb-3">
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 text-base">{log.ai_generated_title}</h3>
                        <p className="text-xs text-slate-400">
                          수행일: {log.work_date} • 작성자: {authorMap[log.author_id] || '연구원'} • 소스: {log.raw_source}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isApproved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800 animate-pulse'}`}>
                          {isApproved ? '결재 승인완료' : '연구소장 승인대기'}
                        </span>
                        {!isApproved && (
                          <button 
                            onClick={() => handleApproveLog(log.log_id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>승인 및 체인각인</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      {log.ai_generated_content}
                    </div>

                    {isApproved && log.blockchain_hash && (
                      <div className="flex items-center space-x-2 bg-green-50/40 p-2.5 rounded-xl border border-green-100 text-[10px] text-green-700 font-mono">
                        <Key className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="font-bold text-green-800 uppercase shrink-0">BLOCKCHAIN PROOF HASH:</span>
                        <span className="truncate">{log.blockchain_hash}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* KOITA 연동망 상세 안내 모달 팝업 */}
      {showKoitaInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col relative animate-scale-in text-left">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold">KOITA 연동망 실시간 감시 역할</h3>
              </div>
              <button 
                onClick={() => setShowKoitaInfo(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed font-medium">
              <p className="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-100 font-semibold">
                이지데스크 컴플라이언스 엔진이 한국산업기술진흥협회(KOITA)의 법적 기준을 백그라운드에서 상시 모니터링하는 감시 상태 신호입니다.
              </p>
              
              <div className="space-y-3">
                <div className="border-l-2 border-amber-500 pl-3">
                  <h4 className="font-bold text-slate-800 text-xs mb-0.5">1. 법정 설립 요건 상시 모니터링</h4>
                  <p className="text-slate-500">연구원 필수 인원수 충족 여부, 물적 공간 분리 상태 및 분기 1회 공간 자가진단 주기를 상시 감시합니다.</p>
                </div>
                
                <div className="border-l-2 border-amber-500 pl-3">
                  <h4 className="font-bold text-slate-800 text-xs mb-0.5">2. 14일 이내 의무 변경신고 방어</h4>
                  <p className="text-slate-500">인력 퇴사나 공간 변동 발생 시 14일 내 신고 기한을 추적하여 마감 위험이 다가올 때 D-Day 적색 알림을 발행합니다.</p>
                </div>
                
                <div className="border-l-2 border-amber-500 pl-3">
                  <h4 className="font-bold text-slate-800 text-xs mb-0.5">3. R&D 실적 무결성 증적</h4>
                  <p className="text-slate-500">작성 완료된 연구일지의 소장 결재 시점 블록체인 해시 각인 및 위변조 방지 감사 이력(Audit Trail)의 가동을 검증합니다.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowKoitaInfo(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
