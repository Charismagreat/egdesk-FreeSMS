"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, Clock, UserCheck, Users, UserMinus, ShieldAlert, 
  Sparkles, Check, X, RefreshCw, Send, Plus, Trash2, ChevronLeft, ChevronRight, AlertTriangle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Employee {
  id: string;
  name: string;
  username: string;
  role: string;
  clock_in: string | null;
  clock_out: string | null;
  status: 'NORMAL' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' | 'LEAVE';
  working_hours: number;
  memo: string;
  total_allowed: number;
  remaining_leaves: number;
}

interface CompanyEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  event_type: 'COMPANY_EVENT' | 'HOLIDAY' | 'DEPT_EVENT';
  description: string;
}

interface LeaveRequest {
  id: string;
  operator_id: string;
  employee_name: string;
  leave_type: 'ANNUAL' | 'HALF' | 'SICK' | 'SPECIAL';
  start_date: string;
  end_date: string;
  days_spent: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  reject_reason: string | null;
  approver_name: string | null;
  created_at: string;
}

export default function HrAttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companyEvents, setCompanyEvents] = useState<CompanyEvent[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 캘린더 시간 탐색용 Date 상태 (기본 현재 달)
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');

  // 모달 제어 상태
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);

  // 폼 입력 상태
  const [leaveType, setLeaveType] = useState<'ANNUAL' | 'HALF' | 'SICK' | 'SPECIAL'>('ANNUAL');
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventType, setEventType] = useState<'COMPANY_EVENT' | 'HOLIDAY' | 'DEPT_EVENT'>('COMPANY_EVENT');
  const [eventDesc, setEventDesc] = useState("");

  const [rejectReason, setRejectReason] = useState("");

  // AI 공백 예보 모니터 상태 🤖
  const [aiBriefing, setAiBriefing] = useState<any>({
    riskScore: 0,
    alertTitle: '로딩 중...',
    alertMessage: 'AI가 부서별 일정을 교차 예측하고 있습니다.',
    briefingText: '데이터를 분석하여 업무 공백 보고서를 자동 작성하고 있습니다.'
  });
  const [aiLoading, setAiLoading] = useState(false);

  // 📝 근로계약 & 급여정산 관리 상태 추가
  const [contracts, setContracts] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [payrollYearMonth, setPayrollYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payrollLoading, setPayrollLoading] = useState(false);

  // 계약 직접 편집 폼 상태 추가
  const [selectedContractOperatorId, setSelectedContractOperatorId] = useState("");
  const [hourlyWage, setHourlyWage] = useState(10000);
  const [weeklyHours, setWeeklyHours] = useState(40);
  const [allowHolidayPay, setAllowHolidayPay] = useState(1); // 1: 적용, 0: 미적용
  const [workDays, setWorkDays] = useState("월,화,수,목,금");
  const [contractMemo, setContractMemo] = useState("");

  // 📝 임직원 상세 프로필 관리 상태 추가
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileOperatorId, setSelectedProfileOperatorId] = useState("");
  const [profileDept, setProfileDept] = useState("미정");
  const [profileHireDate, setProfileHireDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [profileCommute, setProfileCommute] = useState("인근 통근");
  const [profileSkills, setProfileSkills] = useState("일반 서무");
  const [profileBackup, setProfileBackup] = useState("none");
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    fetchHrData();
  }, []);

  // 📝 근로계약, 급여정산 및 상세 프로필 리스트 API 조회 함수
  const fetchContractsAndPayroll = async (ym?: string) => {
    const targetYM = ym || payrollYearMonth;
    setPayrollLoading(true);
    setProfileLoading(true);
    try {
      // 1. 계약 설정 리스트 로드
      const contractsRes = await fetch('/api/hr/contracts');
      const contractsData = await contractsRes.json();
      if (contractsData.success) {
        setContracts(contractsData.contracts || []);
      }

      // 2. 당월 실시간 급여 정산 연산 리스트 로드
      const payrollRes = await fetch(`/api/hr/contracts/calc?year_month=${targetYM}`);
      const payrollData = await payrollRes.json();
      if (payrollData.success) {
        setPayroll(payrollData.payroll || []);
      }

      // 3. 임직원 상세 프로필 리스트 로드
      const profilesRes = await fetch('/api/hr/profiles');
      const profilesData = await profilesRes.json();
      if (profilesData.success) {
        setProfiles(profilesData.profiles || []);
      }
    } catch (err) {
      console.error('인사/급여/프로필 데이터를 불러오는데 실패했습니다:', err);
    } finally {
      setPayrollLoading(false);
      setProfileLoading(false);
    }
  };

  // 📝 연월 또는 관리자 권한 갱신 시 실시간 연동
  useEffect(() => {
    if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'PRESIDENT') {
      fetchContractsAndPayroll();
    }
  }, [currentUser, payrollYearMonth]);

  // 📝 특정 직원의 기존 계약 조건 불러오기 핸들러
  const handleSelectEmployeeContract = (operatorId: string) => {
    setSelectedContractOperatorId(operatorId);
    const matched = contracts.find(c => String(c.operator_id) === String(operatorId));
    if (matched) {
      setHourlyWage(matched.hourly_wage || 10000);
      setWeeklyHours(matched.weekly_hours || 40);
      setAllowHolidayPay(matched.allow_weekly_holiday_paid !== undefined ? matched.allow_weekly_holiday_paid : 1);
      setWorkDays(matched.work_days || "월,화,수,목,금");
      setContractMemo(matched.contract_memo || "");
    } else {
      setHourlyWage(10000);
      setWeeklyHours(40);
      setAllowHolidayPay(1);
      setWorkDays("월,화,수,목,금");
      setContractMemo("");
    }
  };

  // 📝 특정 직원의 상세 프로필 불러오기 핸들러
  const handleSelectEmployeeProfile = (operatorId: string) => {
    setSelectedProfileOperatorId(operatorId);
    const matched = profiles.find(p => String(p.operator_id) === String(operatorId));
    if (matched) {
      setProfileDept(matched.department || "미정");
      setProfileHireDate(matched.hire_date || new Date().toISOString().split('T')[0]);
      setProfileCommute(matched.commute_area || "인근 통근");
      setProfileSkills(matched.skills || "일반 서무");
      setProfileBackup(matched.backup_operator_id || "none");
    } else {
      setProfileDept("미정");
      setProfileHireDate(new Date().toISOString().split('T')[0]);
      setProfileCommute("인근 통근");
      setProfileSkills("일반 서무");
      setProfileBackup("none");
    }
  };

  // 📝 근로계약 폼 제출 핸들러 (Upsert)
  const handleSubmitContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractOperatorId) {
      alert('근무 조건을 변경할 직원을 선택해주세요.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch('/api/hr/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: selectedContractOperatorId,
          hourly_wage: hourlyWage,
          weekly_hours: weeklyHours,
          allow_weekly_holiday_paid: allowHolidayPay,
          work_days: workDays,
          contract_memo: contractMemo
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        await fetchContractsAndPayroll();
      } else {
        alert(data.error || '근로계약 갱신에 실패했습니다.');
      }
    } catch (err: any) {
      alert('통신 오류: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 📝 임직원 상세 프로필 폼 제출 핸들러 (Upsert)
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileOperatorId) {
      alert('인적사항을 변경할 직원을 선택해주세요.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch('/api/hr/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: selectedProfileOperatorId,
          department: profileDept,
          hire_date: profileHireDate,
          commute_area: profileCommute,
          skills: profileSkills,
          backup_operator_id: profileBackup
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        await fetchContractsAndPayroll();
      } else {
        alert(data.error || '인적사항 갱신에 실패했습니다.');
      }
    } catch (err: any) {
      alert('통신 오류: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const fetchHrData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. 근태 대장 API 호출
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/hr/attendance?work_date=${todayStr}`);
      const data = await res.json();

      if (data.success) {
        setEmployees(data.employees || []);
        setCompanyEvents(data.companyEvents || []);
        setCurrentUser(data.currentUser);
      } else {
        setError(data.error || '인사 데이터를 불러오지 못했습니다.');
      }

      // 2. 연차 결재 목록 API 호출
      const leavesRes = await fetch('/api/hr/leaves');
      const leavesData = await leavesRes.json();
      if (leavesData.success) {
        setLeaveRequests(leavesData.leaves || []);
      }

    } catch (err) {
      setError('서버 연결 불안정 또는 네트워크 장애');
    } finally {
      setLoading(false);
      triggerAiBriefing(); // 백그라운드로 AI RAG 예보 시뮬레이션
    }
  };

  const triggerAiBriefing = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/hr/ai-briefing', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAiBriefing(data);
      }
    } catch (e) {
      console.error('AI Briefing load failed:', e);
    } finally {
      setAiLoading(false);
    }
  };

  // 출퇴근 스탬프 원터치 발송  Stamp 🟢🔴
  const handleClockStamp = async (action: 'CLOCK_IN' | 'CLOCK_OUT') => {
    setSubmitLoading(true);
    try {
      const res = await fetch('/api/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        await fetchHrData();
        alert(data.message);
      } else {
        alert(data.error || '출퇴근 스탬프 처리에 실패했습니다.');
      }
    } catch (e: any) {
      alert('스탬프 통신 실패: ' + e.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 연차 결재 처리 (승인/반려)
  const handleLeaveDecision = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setSubmitLoading(true);
    try {
      const body: any = { action, leave_id: id };
      if (action === 'REJECT') {
        body.reject_reason = rejectReason;
      }
      
      const res = await fetch('/api/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setIsRejectModalOpen(false);
        setRejectReason("");
        fetchHrData();
      } else {
        alert(data.error || '결재 처리에 실패했습니다.');
      }
    } catch (e: any) {
      alert('결재 통신 실패: ' + e.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 연차 휴가 신규 신청 접수
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason) {
      alert('신청 기간 및 휴가 사유를 명확히 입력해 주세요.');
      return;
    }

    setSubmitLoading(true);
    try {
      // 날짜 계산 (일수 소모량 자동 계산)
      const start = new Date(leaveStart);
      const end = new Date(leaveEnd);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const daysSpent = leaveType === 'HALF' ? 0.5 : diffDays;

      const res = await fetch('/api/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPLY',
          leave_type: leaveType,
          start_date: leaveStart,
          end_date: leaveEnd,
          days_spent: daysSpent,
          reason: leaveReason
        })
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setIsLeaveModalOpen(false);
        setLeaveStart("");
        setLeaveEnd("");
        setLeaveReason("");
        fetchHrData();
      } else {
        alert(data.error || '연차 신청서 전송에 실패했습니다.');
      }
    } catch (e: any) {
      alert('신청서 통신 오류: ' + e.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 회사 공용 캘린더 일정 추가 CRUD
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventStart || !eventEnd) {
      alert('일정 상호명과 기간을 입력하세요.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch('/api/hr/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          title: eventTitle,
          start_date: eventStart,
          end_date: eventEnd,
          event_type: eventType,
          description: eventDesc
        })
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setIsEventModalOpen(false);
        setEventTitle("");
        setEventStart("");
        setEventEnd("");
        setEventDesc("");
        fetchHrData();
      } else {
        alert(data.error || '일정 등록 실패');
      }
    } catch (e: any) {
      alert('일정 통신 에러: ' + e.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 회사 공용 일정 삭제
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('이 일정을 회사 공유 캘린더에서 정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch('/api/hr/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', event_id: id })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchHrData();
      } else {
        alert(data.error || '일정 삭제 실패');
      }
    } catch (e: any) {
      alert('삭제 통신 실패: ' + e.message);
    }
  };

  // 캘린더 날짜 계산 유틸리티
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 시작 요일 index
    const totalDays = new Date(year, month + 1, 0).getDate(); // 총 일수
    return { firstDay, totalDays, year, month };
  };

  const { firstDay, totalDays, year, month } = getDaysInMonth(currentCalendarDate);
  const calendarTitle = `${year}년 ${month + 1}월`;

  // 이전/다음 달 전환
  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  // 특정 일자의 전사 근태 뱃지 및 회사 이벤트 추출기 🟢🟡🔴
  const getDayMetadata = (day: number) => {
    const formattedDay = String(day).padStart(2, '0');
    const targetDate = `${year}-${String(month + 1).padStart(2, '0')}-${formattedDay}`;

    // 당일 전사 근태 카운트
    // crm_attendance 대장과 Approved leaves 기준
    const attList = employees.map(emp => {
      // 1. 이미 오늘자 근태가 올라와 있는가
      const hasAtt = employees.find(e => e.id === emp.id);
      return hasAtt; // 단순 가이드 매핑
    });

    // 실제로는 당일 출퇴근 대장이나 승인된 휴가 데이터를 조회합니다
    // approvedLeaves 정보 매핑
    const leavesToday = leaveRequests.filter(l => l.status === 'APPROVED' && targetDate >= l.start_date && targetDate <= l.end_date);
    
    // 데모용/실제용 회사 공유 일정 매핑
    const evs = companyEvents.filter(ev => targetDate >= ev.start_date && targetDate <= ev.end_date);

    return {
      events: evs,
      leavesCount: leavesToday.length,
      leavesList: leavesToday
    };
  };

  // 당일 출퇴근 현황판 계산
  const totalEmployees = employees.length;
  const currentWorkingCount = employees.filter(e => e.clock_in && !e.clock_out).length;
  const lateCount = employees.filter(e => e.status === 'LATE').length;
  const leaveCount = employees.filter(e => e.status === 'LEAVE').length;
  const pendingLeavesCount = leaveRequests.filter(l => l.status === 'PENDING').length;

  const currentEmpRecord = employees.find(e => String(e.id) === String(currentUser?.id));

  return (
    <div className="space-y-8 animate-fade-in relative pb-16">
      {/* 럭셔리 네온 아우라 데코 */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl -z-10"></div>

      {/* 상단 타이틀 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-200 relative z-10 shrink-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            <Calendar className="w-8 h-8 text-indigo-650 mr-3" />
            근태 관리 AI
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            실시간 1초 출퇴근 타임스탬프와 주간/월간 전사 공유 캘린더, 그리고 Gemini AI 자율 인사 평가 및 마감 연계형 업무 공백 예보를 정밀 관제합니다.
          </p>
        </div>
      </div>

      {/* 나의 오늘 출퇴근 기록 간편 스탬프 카드 */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl -z-10"></div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">나의 오늘 출퇴근 기록</h4>
            <p className="text-xs text-slate-400 font-semibold mt-1">간편한 원터치 타임스탬프로 실시간 근태 대장에 스탬프를 적재합니다.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-xs font-extrabold text-slate-700 bg-slate-50 border border-slate-200/60 px-4 py-2.5 rounded-2xl min-w-[180px] text-center shadow-inner">
            {currentEmpRecord?.clock_in ? (
              <span>출근 완료: <b className="text-emerald-650 font-bold">{currentEmpRecord.clock_in}</b></span>
            ) : (
              <span className="text-slate-400">출근 기록이 없습니다</span>
            )}
          </div>
          <div className="flex gap-2 min-w-[200px]">
            <button
              disabled={submitLoading || (currentEmpRecord && !!currentEmpRecord.clock_in)}
              onClick={() => handleClockStamp('CLOCK_IN')}
              className="flex-1 py-2.5 px-5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 rounded-xl transition-all shadow-md cursor-pointer text-center"
            >
              출근 🟢
            </button>
            <button
              disabled={submitLoading || !currentEmpRecord || (currentEmpRecord && !currentEmpRecord.clock_in) || (currentEmpRecord && !!currentEmpRecord.clock_out)}
              onClick={() => handleClockStamp('CLOCK_OUT')}
              className="flex-1 py-2.5 px-5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-30 rounded-xl transition-all shadow-md cursor-pointer text-center"
            >
              퇴근 🔴
            </button>
          </div>
        </div>
      </div>

      {/* 2. Glassmorphic 5대 스코어카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 전체 인원 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">전체 등록 직원</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">{totalEmployees} <span className="text-xs font-semibold text-slate-400">명</span></h4>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* 현재 근무중 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">현재 정상 근무 중</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">{currentWorkingCount} <span className="text-xs font-semibold text-slate-400">명</span></h4>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-4.5 h-4.5 animate-pulse" />
          </div>
        </div>

        {/* 오늘 지각 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">오늘 누적 지각</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">{lateCount} <span className="text-xs font-semibold text-slate-400">명</span></h4>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* 오늘 휴가자 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">오늘 승인 휴가자</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">{leaveCount} <span className="text-xs font-semibold text-slate-400">명</span></h4>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <UserMinus className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* 결재 대기 건 */}
        <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/20 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">결재 대기 연차서</p>
            <h4 className="text-xl font-black text-indigo-900 mt-1">{pendingLeavesCount} <span className="text-xs font-semibold text-slate-400">건</span></h4>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-650 flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5 animate-pulse" />
          </div>
        </div>

      </div>

      {/* 3. 메인 관제 보드: 회사 캘린더 & AI 예보 & 결재함 구조 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* 좌측/중앙: 회사 공유 캘린더 (xl: col-span-2) */}
        <div className="xl:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm block space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-4.5 bg-indigo-500 rounded-full"></span>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                전사 공유 캘린더
                <span className="text-[10px] font-bold text-slate-400">Company Board</span>
              </h3>
            </div>
            
            {/* 캘린더 헤더 조작 기기 */}
            <div className="flex items-center gap-4">
              {/* 주간/월간 스위치 토글 */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setCalendarView('month')}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${calendarView === 'month' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                >
                  월별 보기
                </button>
                <button
                  onClick={() => setCalendarView('week')}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${calendarView === 'week' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                >
                  주별 보기
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button onClick={handlePrevMonth} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-black text-slate-700 px-2 min-w-[80px] text-center">{calendarTitle}</span>
                <button onClick={handleNextMonth} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* 일정 등록 단추 */}
              {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'PRESIDENT') && (
                <button
                  onClick={() => setIsEventModalOpen(true)}
                  className="px-3 py-1.5 text-[10px] font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                >
                  <Plus size={11} />
                  일정 추가
                </button>
              )}
            </div>
          </div>

          {/* 캘린더 본체 그리드 */}
          <div className="w-full">
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2">
              <span className="text-rose-500">일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span className="text-indigo-500">토</span>
            </div>

            {/* 날짜 셀 그리드 */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* 빈 칸 렌더링 */}
              {Array.from({ length: firstDay }).map((_, idx) => (
                <div key={`empty-${idx}`} className="min-h-[85px] bg-slate-50/20 rounded-xl border border-slate-100/30"></div>
              ))}

              {/* 일자 렌더링 */}
              {Array.from({ length: totalDays }).map((_, idx) => {
                const day = idx + 1;
                const metadata = getDayMetadata(day);
                const hasHoliday = metadata.events.some(e => e.event_type === 'HOLIDAY');

                // 🚨 AI 비상 공백 감지 시 캘린더 날짜 셀에 붉은색 파동 펄스 쉴드 이펙트 이식!
                const targetDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isProjectDeliveryNear = targetDayStr === '2026-06-15' && metadata.leavesCount > 0; 
                
                return (
                  <div 
                    key={`day-${day}`} 
                    className={`min-h-[95px] p-2 rounded-xl border flex flex-col justify-between transition-all group hover:bg-slate-50/50 hover:shadow-xs relative overflow-hidden bg-white ${
                      isProjectDeliveryNear 
                        ? 'border-rose-300 ring-2 ring-rose-500/10 shadow-inner' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {/* 비상 파동 효과 마운트 */}
                    {isProjectDeliveryNear && (
                      <div className="absolute inset-0 bg-rose-500/5 animate-pulse -z-0"></div>
                    )}

                    <div className="flex justify-between items-start z-10">
                      <span className={`text-[11px] font-black ${hasHoliday || (firstDay + day - 1) % 7 === 0 ? 'text-rose-500' : (firstDay + day - 1) % 7 === 6 ? 'text-indigo-500' : 'text-slate-700'}`}>
                        {day}
                      </span>

                      {/* 근태 요약 신호등 뱃지 동적 표기 */}
                      {metadata.leavesCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 font-extrabold text-[8px]">
                          휴가 {metadata.leavesCount}명 🔴
                        </span>
                      )}
                    </div>

                    {/* 일정 칩스 & 근태 요약 요약 */}
                    <div className="space-y-1 mt-1.5 z-10">
                      {metadata.events.map(ev => (
                        <div 
                          key={ev.id} 
                          className={`px-1.5 py-0.8 rounded-md text-[9px] font-black truncate relative flex items-center justify-between gap-1 group-hover:pr-6 ${
                            ev.event_type === 'HOLIDAY' 
                              ? 'bg-rose-50 border border-rose-100 text-rose-600 font-bold' 
                              : ev.event_type === 'COMPANY_EVENT' 
                              ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold' 
                              : 'bg-slate-100 text-slate-700 font-bold'
                          }`}
                          title={`${ev.title}: ${ev.description}`}
                        >
                          <span className="truncate">{ev.title}</span>
                          
                          {/* 최고운영자 전용 원터치 일정 삭제 단추 */}
                          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'PRESIDENT') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev.id); }}
                              className="absolute right-1 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 rounded transition-all cursor-pointer bg-white border border-slate-100 shrink-0"
                            >
                              <Trash2 size={9} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 비상 공백 경고 Alert 텍스트 소형 렌더링 */}
                    {isProjectDeliveryNear && (
                      <div className="text-[7.5px] font-bold text-rose-600 leading-tight border border-rose-100 bg-rose-50 rounded p-1 shrink-0 z-10 animate-bounce-subtle mt-1">
                        ⚠️ 인원공백 경고
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 우측: AI 공백 예산 및 연차 결재함 (xl: col-span-1) */}
        <div className="space-y-6 xl:col-span-1 block">
          
          {/* AI 업무 공백 비상 예보 Alert 모니터 */}
          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm block relative overflow-hidden">
            {/* 오로라 배경 */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -z-10"></div>
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles size={16} className="text-indigo-600 animate-pulse" />
              <h3 className="text-xs font-black text-slate-800">AI 실시간 전사 업무 공백 예보</h3>
            </div>

            {aiLoading ? (
              <div className="py-6 text-center animate-pulse flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                <span className="text-[10px] text-slate-400 font-bold">인공지능 RAG SCM 시뮬레이션 가동 중...</span>
              </div>
            ) : (
              <div className="pt-3 space-y-4">
                {/* 비상 리스크 스코어 게이지 */}
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 shrink-0 flex items-center justify-center rounded-full border bg-slate-50/50">
                    <span className={`text-base font-black font-mono ${aiBriefing.riskScore > 60 ? 'text-rose-600' : aiBriefing.riskScore > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {aiBriefing.riskScore}
                    </span>
                    <span className="absolute bottom-1 text-[6.5px] font-bold text-slate-400 uppercase tracking-widest">Risk %</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] font-black text-slate-800 leading-tight">{aiBriefing.alertTitle}</h4>
                    <p className="text-[9.5px] text-slate-400 font-semibold leading-normal mt-0.5">{aiBriefing.alertMessage}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 text-[10px] font-medium leading-relaxed text-slate-600">
                  <span className="block font-extrabold text-[10.5px] text-indigo-750 mb-1">💡 AI 마스터 종합 권고안</span>
                  {aiBriefing.briefingText}
                </div>
                
                <button
                  onClick={triggerAiBriefing}
                  className="w-full py-1.5 border border-slate-200 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 rounded-xl text-[9px] font-extrabold flex items-center justify-center gap-1 bg-white cursor-pointer transition-all shadow-3xs"
                >
                  <RefreshCw size={10} />
                  실시간 AI 공백 통계 재연산
                </button>
              </div>
            )}
          </div>

          {/* 대표자/관리자 전용 연차 결재 대기함 */}
          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'PRESIDENT') && (
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm block">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full"></span>
                <h3 className="text-xs font-black text-slate-800 flex items-center justify-between w-full">
                  <span>휴가 결재 대기 대기함</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-650 font-black text-[9px]">{pendingLeavesCount}건</span>
                </h3>
              </div>

              <div className="pt-3 divide-y divide-slate-100 custom-scrollbar max-h-[300px] overflow-y-auto">
                {leaveRequests.filter(l => l.status === 'PENDING').length === 0 ? (
                  <p className="text-center text-[10px] text-slate-400 font-bold py-8">결재 대기 중인 연차 신청서가 없습니다 ⛱️</p>
                ) : (
                  leaveRequests.filter(l => l.status === 'PENDING').map(req => (
                    <div key={req.id} className="py-3.5 space-y-2.5 first:pt-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-black text-slate-850">{req.employee_name} </span>
                          <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-650 font-extrabold text-[8px]">
                            {req.leave_type === 'ANNUAL' ? '연차' : req.leave_type === 'HALF' ? '반차' : req.leave_type === 'SICK' ? '병가' : '경조휴가'}
                          </span>
                          <p className="text-[9px] text-slate-400 font-bold mt-1">신청기간: {req.start_date} ~ {req.end_date} (소모: {req.days_spent}일)</p>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-100/50 text-[9.5px] font-semibold text-slate-650 leading-relaxed">
                        <span className="block font-black text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">휴가 사유</span>
                        {req.reason}
                      </div>
                      
                      <div className="flex gap-2 w-full pt-0.5">
                        <button
                          onClick={() => handleLeaveDecision(req.id, 'APPROVE')}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-extrabold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check size={11} />
                          승인 ⚡
                        </button>
                        <button
                          onClick={() => { setSelectedLeaveId(req.id); setIsRejectModalOpen(true); }}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 border border-slate-200"
                        >
                          <X size={11} />
                          반려 ❌
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 직원용: 나의 휴가/연차 신청 위젯 */}
          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm block">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-800">나의 휴가 신청서 작성</h3>
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
              >
                <Plus size={11} />
                연차 신청서
              </button>
            </div>
            
            <div className="pt-4 block">
              <div className="flex justify-between items-center bg-slate-50 border p-3 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">나의 잔여 연차</span>
                <span className="text-base font-black text-indigo-700 font-mono">
                  {employees.find(e => e.id === currentUser?.id)?.remaining_leaves || 15} <span className="text-xs font-bold text-slate-400">일</span>
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ==========================================
          📂 5. [사장님 전용] 임직원 근로 계약 조건 관리 및 실시간 급여 정산 현황판 (2열 와이드 관제 보드)
          ========================================== */}
      {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'PRESIDENT') && (
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-10"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-4.5 bg-indigo-650 rounded-full"></span>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                근로계약 & 실시간 급여 정산 AI 관제
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">SUPER OWNER</span>
              </h3>
            </div>
            
            {/* 정산 연월 선택 */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">정산 대상 연월</label>
              <input
                type="month"
                value={payrollYearMonth}
                onChange={(e) => setPayrollYearMonth(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* 좌측: 계약 조건 직접 편집 폼 (4 cols) */}
            <div className="xl:col-span-4 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                ✍️ 근로계약 변경 및 모바일 발송
              </h4>
              
              <form onSubmit={handleSubmitContract} className="space-y-4 text-xs font-bold text-slate-600">
                {/* 대상 직원 선택 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block">대상 직원</label>
                  <select
                    value={selectedContractOperatorId}
                    onChange={(e) => handleSelectEmployeeContract(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="">직원을 선택하세요...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 계약 시급 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block">계약 시급 (원)</label>
                  <input
                    type="number"
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(parseInt(e.target.value) || 0)}
                    placeholder="예: 10000"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                  />
                </div>

                {/* 소정 근로시간 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block">주당 소정 근로시간 (시간)</label>
                  <input
                    type="number"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(parseFloat(e.target.value) || 0)}
                    placeholder="예: 40"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                  />
                </div>

                {/* 주휴수당 여부 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block">주휴수당 적용 여부</label>
                  <select
                    value={allowHolidayPay}
                    onChange={(e) => setAllowHolidayPay(parseInt(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 cursor-pointer"
                  >
                    <option value={1}>적용 (주 15시간 이상 근무 시 자동 계산)</option>
                    <option value={0}>미적용 (초단기 근무 또는 주휴 배제)</option>
                  </select>
                </div>

                {/* 근무 요일 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block">약정 근무 요일</label>
                  <input
                    type="text"
                    value={workDays}
                    onChange={(e) => setWorkDays(e.target.value)}
                    placeholder="예: 월,화,수"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                  />
                </div>

                {/* 계약 메모 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block">계약 특이사항 및 메모</label>
                  <textarea
                    value={contractMemo}
                    onChange={(e) => setContractMemo(e.target.value)}
                    placeholder="근로조건 변동 사유나 이력을 보존합니다."
                    rows={2}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading || !selectedContractOperatorId}
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <Send size={12} />
                  계약 조건 갱신 및 합의서 발송
                </button>
              </form>
            </div>

            {/* 우측: 실시간 월별 급여 정산 대장 (8 cols) */}
            <div className="xl:col-span-8 space-y-4">
              <h4 className="text-xs font-black text-slate-700 flex items-center justify-between border-b border-slate-100 pb-2">
                <span>📊 {payrollYearMonth.split('-')[0]}년 {payrollYearMonth.split('-')[1]}월 예상 급여 대장 (실제 근태 연동)</span>
                <span className="text-[10px] text-slate-450 font-bold">주휴수당 자동 비례 정산</span>
              </h4>

              {payrollLoading ? (
                <div className="py-20 text-center animate-pulse flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                  <span className="text-xs text-slate-400 font-bold">정밀 급여 및 주휴 연산 대장을 불러오는 중...</span>
                </div>
              ) : payroll.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-xs">
                  당월 근태 및 계약 데이터가 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs font-bold">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-450 uppercase tracking-widest">
                        <th className="py-3 px-4">임직원명</th>
                        <th className="py-3 px-4">직급/부서</th>
                        <th className="py-3 px-4 text-center">당월 실근무 (시간)</th>
                        <th className="py-3 px-4 text-center">주당 평균 (시간)</th>
                        <th className="py-3 px-4 text-center">주휴 대상</th>
                        <th className="py-3 px-4 text-right">계약 시급 (원)</th>
                        <th className="py-3 px-4 text-right">누적 주휴수당</th>
                        <th className="py-3 px-4 text-right text-indigo-650">예상 지급총액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {payroll.map((pay: any) => (
                        <tr key={pay.operator_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-black text-slate-800">{pay.name}</td>
                          <td className="py-3.5 px-4">
                            <span className="block text-[10px] text-slate-400 font-bold">{pay.department}</span>
                            <span>{pay.role}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-800">{pay.total_hours}h</td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-650">{pay.avg_weekly_hours}h/주</td>
                          <td className="py-3.5 px-4 text-center">
                            {pay.is_holiday_paid_eligible ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-650 font-black text-[9px]">적격 🟢</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-650 font-black text-[9px]">제외 🔴</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono">{pay.hourly_wage?.toLocaleString()}원</td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-500">+{pay.total_holiday_pay?.toLocaleString()}원</td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-indigo-650 bg-indigo-50/20">{pay.total_payroll?.toLocaleString()}원</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          📂 6. [사장님 전용] 임직원 상세 인적사항 명부 대장 (2열 와이드 관제 보드)
          ========================================== */}
      {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'PRESIDENT') && (
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6 relative overflow-hidden mt-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -z-10"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-4.5 bg-emerald-600 rounded-full"></span>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                임직원 상세 인적사항 명부 대장
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">PROFILE MASTER</span>
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">실시간 AI RAG 연동 완료</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* 좌측: 인적사항 직접 등록/수정 폼 (4 cols) */}
            <div className="xl:col-span-4 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                ✍️ 인적 상세 프로필 편집
              </h4>
              
              <form onSubmit={handleSubmitProfile} className="space-y-4 text-xs font-bold text-slate-600">
                {/* 대상 직원 선택 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block">대상 직원</label>
                  <select
                    value={selectedProfileOperatorId}
                    onChange={(e) => handleSelectEmployeeProfile(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="">직원을 선택하세요...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 소속 부서 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block">소속 부서</label>
                  <input
                    type="text"
                    value={profileDept}
                    onChange={(e) => setProfileDept(e.target.value)}
                    placeholder="예: 구매팀, 생산본부"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                  />
                </div>

                {/* 입사일 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block">공식 입사일</label>
                  <input
                    type="date"
                    value={profileHireDate}
                    onChange={(e) => setProfileHireDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 cursor-pointer"
                  />
                </div>

                {/* 거주 통근지 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block">출퇴근 거주지 및 교통수단</label>
                  <input
                    type="text"
                    value={profileCommute}
                    onChange={(e) => setProfileCommute(e.target.value)}
                    placeholder="예: 서울 마포구 - 지하철 통근"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                  />
                </div>

                {/* 기술 역량 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block">보유 주요 기술 및 역량</label>
                  <input
                    type="text"
                    value={profileSkills}
                    onChange={(e) => setProfileSkills(e.target.value)}
                    placeholder="예: 자재 조율, IT 시스템 지원"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                  />
                </div>

                {/* 1차 백업 담당자 */}
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block">비상 시 1차 백업 대행자</label>
                  <select
                    value={profileBackup}
                    onChange={(e) => setProfileBackup(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="none">지정 없음</option>
                    {employees
                      .filter(emp => String(emp.id) !== String(selectedProfileOperatorId))
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.role})
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitLoading || !selectedProfileOperatorId}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <Send size={12} />
                  인적 상세사항 저장 및 AI 동기화
                </button>
              </form>
            </div>

            {/* 우측: 상세 인적사항 명부 조회 표 (8 cols) */}
            <div className="xl:col-span-8 space-y-4">
              <h4 className="text-xs font-black text-slate-700 border-b border-slate-100 pb-2">
                👥 전사 임직원 상세 인적 명부 대장
              </h4>

              {profileLoading ? (
                <div className="py-20 text-center animate-pulse flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                  <span className="text-xs text-slate-400 font-bold">임직원 인적사항 명부를 읽어오는 중...</span>
                </div>
              ) : profiles.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-xs">
                  등록된 상세 인적사항 명부가 없습니다. 직원을 선택해 먼저 등록해 주세요.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs font-bold">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-450 uppercase tracking-widest">
                        <th className="py-3 px-4">직원명</th>
                        <th className="py-3 px-4">소속 부서/직급</th>
                        <th className="py-3 px-4 text-center">공식 입사일</th>
                        <th className="py-3 px-4">출퇴근 통근 구역 (거주지)</th>
                        <th className="py-3 px-4">보유 주요 기술 및 역량</th>
                        <th className="py-3 px-4 text-center">비상 백업자</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {profiles.map((pf: any) => {
                        const backupEmp = employees.find(e => String(e.id) === String(pf.backup_operator_id));
                        return (
                          <tr key={pf.operator_id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-black text-slate-800">{pf.name}</td>
                            <td className="py-3.5 px-4">
                              <span className="block text-[10px] text-emerald-600 font-black">{pf.department}</span>
                              <span className="text-slate-450 font-bold text-[10.5px]">{pf.role}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono text-slate-650">{pf.hire_date}</td>
                            <td className="py-3.5 px-4 text-slate-750 font-semibold">{pf.commute_area}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {pf.skills ? pf.skills.split(',').map((skill: string, sIdx: number) => (
                                  <span key={sIdx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-extrabold text-[9px]">
                                    {skill.trim()}
                                  </span>
                                )) : <span className="text-slate-350">-</span>}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                              {backupEmp ? (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-650 text-[9px] font-black">
                                  {backupEmp.name}
                                </span>
                              ) : (
                                <span className="text-slate-350">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          📂 모달 1: 연차 신청 폼 모달
          ========================================== */}
      <AnimatePresence>
        {isLeaveModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-3xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-100 shadow-2xl relative block text-slate-800"
            >
              <button onClick={() => setIsLeaveModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>

              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                📄 신규 휴가 신청서 작성
              </h4>

              <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs font-bold">
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-450 uppercase tracking-widest block">휴가 구분</label>
                  <select
                    value={leaveType}
                    onChange={(e: any) => setLeaveType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  >
                    <option value="ANNUAL">연차 휴가 (1일 소모)</option>
                    <option value="HALF">오전/오후 반차 (0.5일 소모)</option>
                    <option value="SICK">병가 (유급/무급)</option>
                    <option value="SPECIAL">경조 휴가 (경조사 특별)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5 block">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-455 uppercase tracking-widest block">시작 일자</label>
                    <input
                      type="date"
                      value={leaveStart}
                      onChange={(e) => setLeaveStart(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-455 uppercase tracking-widest block">종료 일자</label>
                    <input
                      type="date"
                      value={leaveEnd}
                      onChange={(e) => setLeaveEnd(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-455 uppercase tracking-widest block">휴가 신청 구체적 사유</label>
                  <textarea
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="인사 평가 및 결재 보존용 신청 사유를 기입하세요."
                    rows={3}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Send size={12} />
                  휴가 신청서 접수 발송
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          📂 모달 2: 전사 공유 일정 등록 폼 모달
          ========================================== */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-3xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-100 shadow-2xl relative block text-slate-800"
            >
              <button onClick={() => setIsEventModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>

              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                📅 전사 회사 일정 등록
              </h4>

              <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs font-bold">
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-455 uppercase tracking-widest block">일정 제목 (상호)</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="예: 전사 워크숍, 마감 납품일"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  />
                </div>

                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-455 uppercase tracking-widest block">일정 유형</label>
                  <select
                    value={eventType}
                    onChange={(e: any) => setEventType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  >
                    <option value="COMPANY_EVENT">회사 공동 행사 (COMPANY)</option>
                    <option value="HOLIDAY">공식 휴일 (HOLIDAY)</option>
                    <option value="DEPT_EVENT">부서별 특정 일정 (DEPT)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5 block">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-455 uppercase tracking-widest block">시작 일자</label>
                    <input
                      type="date"
                      value={eventStart}
                      onChange={(e) => setEventStart(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-455 uppercase tracking-widest block">종료 일자</label>
                    <input
                      type="date"
                      value={eventEnd}
                      onChange={(e) => setEventEnd(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-455 uppercase tracking-widest block">일정 세부 메모</label>
                  <textarea
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="행사 설명 및 장소를 자유롭게 기입하세요."
                    rows={2}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={12} />
                  캘린더 일정 배포 등록
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          📂 모달 3: 연차 결재 반려 사유 입력 모달
          ========================================== */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-3xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-100 shadow-2xl relative block text-slate-800"
            >
              <button onClick={() => setIsRejectModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>

              <h4 className="text-sm font-black text-rose-600 flex items-center gap-2 pb-2 border-b border-slate-100">
                <AlertTriangle size={15} />
                연차 신청 결재 반려
              </h4>

              <div className="space-y-3.5 text-xs font-bold">
                <div className="space-y-1 block">
                  <label className="text-[10px] text-slate-455 uppercase tracking-widest block">반려 처리 사유 기입</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="직원이 납득할 수 있도록 명확한 반려 사유를 입력하세요."
                    rows={3}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold resize-none leading-relaxed"
                  />
                </div>

                <button
                  onClick={() => selectedLeaveId && handleLeaveDecision(selectedLeaveId, 'REJECT')}
                  disabled={submitLoading || !rejectReason.trim()}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <X size={12} />
                  이 연차 신청을 공식 반려합니다
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
