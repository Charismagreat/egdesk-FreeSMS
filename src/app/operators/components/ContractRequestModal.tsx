"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Calendar, MapPin, Briefcase, DollarSign, Clock, HelpCircle, Loader2, Upload, FileText } from "lucide-react";
import { Operator } from "../types";

interface ContractRequestModalProps {
  operator: Operator | null;
  onClose: () => void;
}

export function ContractRequestModal({ operator, onClose }: ContractRequestModalProps) {
  // 계약 기본 정보 상태
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    nextYear.setDate(nextYear.getDate() - 1);
    return nextYear.toISOString().split("T")[0];
  });
  const [workPlace, setWorkPlace] = useState("본사 사무실 (서울 강남구)");
  const [jobDescription, setJobDescription] = useState("사무직 및 서비스 운영 업무");
  const [contractType, setContractType] = useState("STANDARD_LIMITED");
  
  // 근무 조건 상태
  const [hourlyWage, setHourlyWage] = useState(10030); // 2026년 최저시급 기준 기본값 세팅
  const [weeklyHours, setWeeklyHours] = useState(40);
  const [allowWeeklyHolidayPaid, setAllowWeeklyHolidayPaid] = useState(1);
  const [workDays, setWorkDays] = useState("월,화,수,목,금");
  const [contractMemo, setContractMemo] = useState("2026년도 연봉 계약 기준 전자 합의서 발행");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 서면 계약서 파일 관련 상태
  const [paperContractFile, setPaperContractFile] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("PNG 또는 JPG 이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setError(null);
    setUploadFileName(file.name);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setPaperContractFile(reader.result as string);
    };
  };

  // 주당 소정근로시간 변경에 따른 주휴수당 자동 추천 로직
  useEffect(() => {
    if (weeklyHours < 15) {
      setAllowWeeklyHolidayPaid(0);
    } else {
      setAllowWeeklyHolidayPaid(1);
    }
  }, [weeklyHours]);

  if (!operator) return null;

  // 월 환산급여 추정치 계산 (주 4.345주 기준)
  // 주휴시간: 주 15시간 이상 시 (주근로시간 / 40) * 8시간
  const holidayHours = allowWeeklyHolidayPaid === 1 ? (weeklyHours / 40) * 8 : 0;
  const monthlyHours = (weeklyHours + holidayHours) * 4.3455;
  const estimatedMonthlyWage = Math.round(monthlyHours * hourlyWage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    // 검증
    const isLimited = contractType === "STANDARD_LIMITED";
    const isPaperSignOnly = contractType === "PAPER_SIGN_ONLY";

    if (isPaperSignOnly) {
      if (!paperContractFile) {
        setError("서면 계약서 원본 파일을 업로드해 주세요.");
        setIsSubmitting(false);
        return;
      }
    } else {
      if (!startDate || (isLimited && !endDate)) {
        setError(isLimited ? "근로 계약 기간을 설정해 주세요." : "근로 개시일을 입력해 주세요.");
        setIsSubmitting(false);
        return;
      }
      if (!workPlace.trim() || !jobDescription.trim()) {
        setError("근무 장소 및 업무 내용을 입력해 주세요.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/hr/contracts/request-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator_id: operator.id,
          hourly_wage: isPaperSignOnly ? 0 : hourlyWage,
          weekly_hours: isPaperSignOnly ? 0 : weeklyHours,
          allow_weekly_holiday_paid: isPaperSignOnly ? 0 : allowWeeklyHolidayPaid,
          work_days: isPaperSignOnly ? "" : workDays,
          contract_memo: contractMemo,
          start_date: startDate,
          end_date: isPaperSignOnly ? "" : (isLimited ? endDate : ""),
          work_place: isPaperSignOnly ? "" : workPlace,
          job_description: isPaperSignOnly ? "" : jobDescription,
          contract_type: contractType,
          paper_contract_file: isPaperSignOnly ? paperContractFile : null
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMessage(data.message || "서명 요청 문자가 대기열에 등록되었습니다!");
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setError(data.error || "서명 요청 발송 중 문제가 발생했습니다.");
      }
    } catch (err: any) {
      setError("서버와 통신하는 중 에러가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              근로계약 모바일 서명 요청 발송
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              대상 직원: <span className="font-semibold text-slate-700">{operator.name}</span> ({operator.phone || "연락처 미등록"})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors border-0 bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 바디 - 스크롤 지원 */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 text-left">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl">
              ⚠️ {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl font-bold">
              ✓ {successMessage}
            </div>
          )}

          {/* 계약서 유형 선택 셀렉트 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">근로계약서 양식 유형</label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
            >
              <option value="STANDARD_LIMITED">표준근로계약서 (기간의 정함이 있는 경우)</option>
              <option value="STANDARD_UNLIMITED">표준근로계약서 (기간의 정함이 없는 경우)</option>
              <option value="PAPER_SIGN_ONLY">서면 작성 완료본 (모바일 서명만 받기)</option>
            </select>
          </div>

          {/* 서면 근로계약 파일 업로드 영역 */}
          {contractType === "PAPER_SIGN_ONLY" && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 text-left">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-400" /> 서면 계약서 원본 파일 업로드
              </h4>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 hover:border-indigo-400 bg-white"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="p-2 bg-slate-50 text-slate-400 rounded-full">
                    <Upload className="w-5 h-5" />
                  </div>
                  {uploadFileName ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 break-all">{uploadFileName}</p>
                      <p className="text-[10px] text-indigo-600">클릭하거나 파일을 다시 드래그앤드롭하여 변경</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-600">클릭하거나 파일을 이 영역으로 드래그앤드롭</p>
                      <p className="text-[10px] text-slate-400">PNG, JPG 이미지 파일 (최대 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {paperContractFile && (
                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[220px] bg-slate-100 flex items-center justify-center relative group">
                  <img
                    src={paperContractFile}
                    alt="업로드된 계약서 미리보기"
                    className="max-h-[220px] max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold bg-slate-900/60 px-3 py-1.5 rounded-full">업로드 완료</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 1. 계약 기본 조항 카드 */}
          {contractType !== "PAPER_SIGN_ONLY" && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> 1. 근로 계약 기본 정보
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {contractType === "STANDARD_LIMITED" ? "근로 시작일" : "근로 개시일"}
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              {contractType === "STANDARD_LIMITED" ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">근로 종료일</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">근로 종료일</label>
                  <div className="px-2 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] text-slate-400 font-bold leading-none h-[30px] flex items-center">
                    기간의 정함 없음 (정규직)
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">근무 장소</label>
                <input
                  type="text"
                  required
                  value={workPlace}
                  onChange={(e) => setWorkPlace(e.target.value)}
                  placeholder="예: 서울 강남구 본사"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">담당 업무</label>
                <input
                  type="text"
                  required
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="예: 고객 상담 및 데이터 관리"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
          )}

          {/* 2. 근무 시간 및 주휴수당 조건 */}
          {contractType !== "PAPER_SIGN_ONLY" && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> 2. 소정근로시간 및 일수
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">주 소정근로시간</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="52"
                    required
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                  />
                  <span className="absolute right-3 top-1.5 text-xs text-slate-400">시간</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">근무 요일</label>
                <input
                  type="text"
                  required
                  value={workDays}
                  onChange={(e) => setWorkDays(e.target.value)}
                  placeholder="예: 월,화,수,목,금"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* 주휴수당 제어 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">주휴수당 적용 여부</label>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="allow_weekly_holiday_paid"
                    checked={allowWeeklyHolidayPaid === 1}
                    onChange={() => setAllowWeeklyHolidayPaid(1)}
                    className="accent-indigo-600"
                  />
                  주휴수당 지급 (주 15시간 이상 권장)
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="allow_weekly_holiday_paid"
                    checked={allowWeeklyHolidayPaid === 0}
                    onChange={() => setAllowWeeklyHolidayPaid(0)}
                    className="accent-indigo-600"
                  />
                  주휴수당 미지급 (주 15시간 미만)
                </label>
              </div>
              {weeklyHours >= 15 && allowWeeklyHolidayPaid === 0 && (
                <p className="text-[10px] text-amber-600 mt-1 font-sans">
                  ⚠️ 주 소정시간이 15시간 이상인 직원은 근로기준법상 주휴수당 지급 의무가 있습니다.
                </p>
              )}
            </div>
          </div>
          )}

          {/* 3. 급여 조건 카드 */}
          {contractType !== "PAPER_SIGN_ONLY" && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> 3. 임금 설정 및 자동 계산
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">지정 시급</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(Number(e.target.value))}
                    className="w-full pl-6 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                  />
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">₩</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">예상 월 기본급 (추정)</label>
                <div className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold font-mono text-indigo-700">
                  {estimatedMonthlyWage.toLocaleString()}원
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              ※ 주 소정 {weeklyHours}시간 + 주휴 {holidayHours.toFixed(1)}시간 적용 시, 월평균 근로 {Math.round(monthlyHours)}시간 기준 시급을 적용한 예상 환산 급여입니다.
            </p>
          </div>
          )}

          {/* 4. 메모 */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">계약서 발송 메모 및 참조 사항</label>
            <textarea
              value={contractMemo}
              onChange={(e) => setContractMemo(e.target.value)}
              placeholder="예: 수습 기간 3개월 적용, 식대 포함 등 세부 안내"
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* 모달 푸터 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !operator.phone}
              className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer border-0 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  요청 발송 중...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  계약서 서명 요청 발송
                </>
              )}
            </button>
          </div>
          {!operator.phone && (
            <p className="text-[10px] text-red-500 text-center">
              ※ 연락처가 등록되지 않은 직원에게는 서명 SMS를 보낼 수 없습니다. 사원 수정을 통해 연락처를 먼저 입력해 주세요.
            </p>
          )}
        </form>

      </div>
    </div>
  );
}
