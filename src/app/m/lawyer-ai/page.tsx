"use client";

import React, { useState } from "react";
import {
  Scale,
  ShieldAlert,
  Search,
  FileText,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  Briefcase,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import {
  searchKoreanLaw,
  getKoreanLawText,
  getKoreanLawDecision
} from "../../../../egdesk-helpers";

// 모바일용 판례/법률 매핑
interface MobileLawItem {
  id: string;
  title: string;
  subTitle?: string;
  source?: string;
}

export default function MobileLawyerAiPage() {
  const [loading, setLoading] = useState(false);
  
  // 아코디언 상태 관리 (모바일 최적화)
  const [expandedSection, setExpandedSection] = useState<"labor" | "safety" | "litigation" | "search" | "litigation_analyze" | null>("labor");

  // 진단 및 검색 결과
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MobileLawItem[]>([]);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // 1분 간이 진단기 상태
  const [laborHours, setLaborHours] = useState(40);
  const [laborOvertime, setLaborOvertime] = useState(15);
  const [hasHolidayPay, setHasHolidayPay] = useState(false);
  const [laborReport, setLaborReport] = useState<string | null>(null);

  // 안전 진단 상태
  const [hasSafetyManager, setHasSafetyManager] = useState(false);
  const [hasRiskAssessment, setHasRiskAssessment] = useState(false);
  const [safetyReport, setSafetyReport] = useState<string | null>(null);

  // 소송 문서 모바일 스냅 분석 상태
  const [litigationFile, setLitigationFile] = useState<File | null>(null);
  const [litigationFileBase64, setLitigationFileBase64] = useState<string | null>(null);
  const [litigationAnalyzing, setLitigationAnalyzing] = useState(false);
  const [litigationReport, setLitigationReport] = useState<string | null>(null);
  const [litigationCalendarSaved, setLitigationCalendarSaved] = useState(false);

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLitigationFile(file);
    setLitigationReport(null);
    setLitigationCalendarSaved(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setLitigationFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeMobileLitigation = async () => {
    if (!litigationFileBase64) {
      alert("분석할 소송 문서 이미지를 업로드해 주세요.");
      return;
    }

    setLitigationAnalyzing(true);
    setLitigationReport(null);
    try {
      const response = await fetch("/api/lawyer-ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: litigationFileBase64,
          mimeType: litigationFile?.type || "image/png"
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setLitigationReport(resData.report);
      } else {
        alert(resData.error || "소송 문서 분석에 실패했습니다.");
      }
    } catch (err: any) {
      alert("분석 서버 통신 오류: " + err.message);
    } finally {
      setLitigationAnalyzing(false);
    }
  };

  const handleSaveMobileLitigationToCalendar = async () => {
    if (!litigationReport) return;

    const metaMatch = litigationReport.match(/\[METADATA:CALENDAR_EVENT:([^:]*):([^:]*):([^\]]*)\]/);
    if (!metaMatch) {
      alert("일정 등록용 메타데이터가 식별되지 않았습니다.");
      return;
    }

    const deadlineVal = metaMatch[1] === "null" ? null : metaMatch[1].trim();
    const caseNumber = metaMatch[2].trim();
    const documentType = metaMatch[3].trim();

    setLoading(true);
    try {
      const response = await fetch("/api/easybot/ocr/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileType: "LEGAL_DOCUMENT",
          data: {
            documentType,
            caseNumber,
            summary: litigationReport.split("## 3. ")[0] || litigationReport.slice(0, 400),
            deadline: deadlineVal,
            actions: [
              "법률 상담 AI 모바일 채널을 통한 법적 기한 관리",
              "주요 입증자료 실시간 취합"
            ],
            pdfFilePath: ""
          }
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setLitigationCalendarSaved(true);
        alert(resData.message || "회사 캘린더에 기한 일정이 정상 등록되었습니다.");
      } else {
        alert(resData.error || "일정 등록에 실패했습니다.");
      }
    } catch (err: any) {
      alert("일정 등록 통신 오류: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 1. 1분 간이 노무 진단 ───────────────────────────────────────────────
  const runQuickLaborAudit = () => {
    const total = Number(laborHours) + Number(laborOvertime);
    let msg = "";
    if (total > 52) {
      msg += "⚠️ 주 근로시간이 52시간을 초과하여 근로기준법 제53조 위반 위험이 있습니다. 지체 없이 근무 조율이 필요합니다. \n";
    }
    if (!hasHolidayPay) {
      msg += "💡 주 15시간 이상 상시 근로자에게 주휴수당 미지급 시 근로기준법 제55조 위반(임금체불) 요건이 성립됩니다. \n";
    }
    if (msg === "") {
      msg = "✅ 기입 조건 상 노무 준수 상태가 매우 안전합니다.";
    }
    setLaborReport(msg);
  };

  // ── 2. 1분 간이 안전 진단 ───────────────────────────────────────────────
  const runQuickSafetyAudit = () => {
    let msg = "";
    if (!hasSafetyManager) {
      msg += "⚠️ 안전보건관리 선임 의무 대상 여부를 체크하시기 바랍니다. 50인 이상 시 의무화됩니다. \n";
    }
    if (!hasRiskAssessment) {
      msg += "💡 산업안전보건법 제36조에 근거한 연 1회 정기 위험성 평가를 시행하지 않은 경우, 중대사고 발생 시 면책 요건 확보가 매우 어렵습니다. 즉각 평가 준비를 권장합니다. \n";
    }
    if (msg === "") {
      msg = "✅ 기본적인 위험성 평가 및 안전관리체계 구축이 양호합니다.";
    }
    setSafetyReport(msg);
  };

  // ── 3. 원클릭 퀵 판례 검색 ──────────────────────────────────────────────
  const runQuickSearch = async (keyword: string) => {
    setLoading(true);
    setSearchResults([]);
    setSearchQuery(keyword);
    try {
      const res = await searchKoreanLaw(keyword, { target: "prec", display: 15 });
      if (res && Array.isArray(res)) {
        setSearchResults(
          res.map((item: any) => ({
            id: item.id || item.serial || item.mst || "",
            title: item.title || item.name || item.evtNm || "판례 정보",
            subTitle: item.courtName || item.evtNo || "",
            source: "판례"
          }))
        );
      }
    } catch (e) {
      console.error(e);
      alert("판례 API 호출 실패. 이지데스크 서버 구동 상태를 점검해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  // ── 4. 전문 가져오기 ──────────────────────────────────────────────────
  const fetchDecisionDetail = async (id: string, title: string) => {
    setLoading(true);
    setSelectedTitle(title);
    setSelectedText(null);
    try {
      const decision = await getKoreanLawDecision(id);
      if (decision) {
        setSelectedText(decision.content || decision.summary || JSON.stringify(decision, null, 2));
      } else {
        setSelectedText("판례 전문 로드에 실패했습니다.");
      }
      setModalOpen(true);
    } catch (e) {
      console.error(e);
      alert("판례 전문을 불러오는 도중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-10 font-sans text-left">
      {/* 모바일 상단 바 */}
      <div className="bg-white border-b border-slate-150 p-4 sticky top-0 z-40 flex items-center gap-3 backdrop-blur-md bg-opacity-95">
        <Link href="/m" className="text-slate-400 hover:text-slate-800 p-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-amber-600" />
          <h1 className="text-base font-extrabold text-slate-900">법률 상담 AI</h1>
          <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-250 px-1.5 py-0.5 rounded-full font-bold">
            CEO 모바일
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 설명 카드 */}
        <div className="bg-white border border-slate-150 p-4 rounded-2xl relative overflow-hidden shadow-sm">
          <div className="absolute top-[-100px] right-[-100px] w-[200px] h-[200px] rounded-full bg-amber-500/5 blur-[50px] pointer-events-none"></div>
          <p className="text-xs text-slate-500 leading-normal font-medium">
            바쁜 현장이나 외부 이동 중에도 스마트폰으로 간편하게 노무 위반을 스캔하고 법제처 최신 판결문을 퀵 검색합니다.
          </p>
        </div>

        {/* 아코디언 아코디언식 섹션 구성 */}
        
        {/* ── 섹션 1: 간이 노무 스캔 ─────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setExpandedSection(expandedSection === "labor" ? null : "labor")}
            className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">1분 간이 노무 진단</span>
            </div>
            {expandedSection === "labor" ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
          </button>

          {expandedSection === "labor" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">주 기본 근로시간</label>
                  <input
                    type="number"
                    value={laborHours}
                    onChange={(e) => setLaborHours(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">주 연장 근로시간</label>
                  <input
                    type="number"
                    value={laborOvertime}
                    onChange={(e) => setLaborOvertime(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-1 text-xs">
                <span className="text-slate-500 font-bold">주휴수당 정상 보장</span>
                <input
                  type="checkbox"
                  checked={hasHolidayPay}
                  onChange={(e) => setHasHolidayPay(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-350 text-amber-500 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={runQuickLaborAudit}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg text-xs transition-colors shadow-sm"
              >
                진단 결과 연산
              </button>

              {laborReport && (
                <div className="bg-white border border-slate-150 p-3 rounded-lg text-[10px] leading-relaxed text-slate-700 whitespace-pre-wrap font-medium shadow-inner">
                  {laborReport}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 섹션 2: 간이 안전 진단 ─────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setExpandedSection(expandedSection === "safety" ? null : "safety")}
            className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">1분 간이 산업안전 진단</span>
            </div>
            {expandedSection === "safety" ? <ChevronUp className="w-4 h-4 text-slate-455" /> : <ChevronDown className="w-4 h-4 text-slate-455" />}
          </button>

          {expandedSection === "safety" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between py-1 text-xs">
                <span className="text-slate-500 font-bold">안전보건 책임담당자 지정</span>
                <input
                  type="checkbox"
                  checked={hasSafetyManager}
                  onChange={(e) => setHasSafetyManager(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-350 text-amber-500 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-between py-1 text-xs">
                <span className="text-slate-500 font-bold">연 1회 위험성 평가 이행</span>
                <input
                  type="checkbox"
                  checked={hasRiskAssessment}
                  onChange={(e) => setHasRiskAssessment(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-350 text-amber-500 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={runQuickSafetyAudit}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg text-xs transition-colors shadow-sm"
              >
                진단 결과 연산
              </button>

              {safetyReport && (
                <div className="bg-white border border-slate-150 p-3 rounded-lg text-[10px] leading-relaxed text-slate-700 whitespace-pre-wrap font-medium shadow-inner">
                  {safetyReport}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 섹션 2.5: 소송 문서 AI 실시간 스냅 분석 (신규 추가) ─────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm text-left">
          <button
            onClick={() => setExpandedSection(expandedSection === "litigation_analyze" ? null : "litigation_analyze")}
            className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <Scale className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">소송 문서 AI 실시간 스냅 분석</span>
            </div>
            {expandedSection === "litigation_analyze" ? <ChevronUp className="w-4 h-4 text-slate-455" /> : <ChevronDown className="w-4 h-4 text-slate-455" />}
          </button>

          {expandedSection === "litigation_analyze" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4 text-[10px] text-left">
              <div>
                <p className="text-slate-500 leading-normal font-semibold">
                  모바일 카메라로 소장, 송달장, 판결문을 직접 촬영하거나 이미지를 등록하여 쟁점 분석 및 기한 일정을 자동 등록합니다.
                </p>
              </div>

              <div className="space-y-3">
                {!litigationReport ? (
                  <div className="border-2 border-dashed border-slate-200 hover:border-amber-500/50 rounded-xl p-4 bg-white text-center cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleMobileFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={litigationAnalyzing}
                    />
                    <div className="space-y-1">
                      <span className="text-xl block">📸</span>
                      {litigationFile ? (
                        <p className="text-[11px] font-black text-slate-800 truncate">{litigationFile.name}</p>
                      ) : (
                        <>
                          <p className="text-[11px] font-extrabold text-slate-650">카메라 촬영 / 이미지 업로드</p>
                          <p className="text-[9px] text-slate-400 font-semibold">터치하여 스냅샷 촬영</p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white border border-slate-150 p-3 rounded-xl text-left text-[9.5px] text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto font-medium shadow-inner">
                      {litigationReport.replace(/\[METADATA:CALENDAR_EVENT:[^\]]*\]/g, "")}
                    </div>
                    
                    {litigationCalendarSaved ? (
                      <div className="py-2.5 bg-emerald-50 border border-emerald-150 rounded-xl text-center text-[10px] text-emerald-800 font-bold flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> 모바일 일정 동기화 승인 완료
                      </div>
                    ) : (
                      <button
                        onClick={handleSaveMobileLitigationToCalendar}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-white font-extrabold rounded-xl text-[10px] transition-all flex items-center justify-center gap-1 shadow-sm"
                      >
                        📥 모바일 캘린더에 대응 기한 등록
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setLitigationFile(null);
                        setLitigationFileBase64(null);
                        setLitigationReport(null);
                        setLitigationCalendarSaved(false);
                      }}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-[9px] transition-all"
                    >
                      다른 문서 새로 분석하기
                    </button>
                  </div>
                )}

                {!litigationReport && litigationFile && (
                  <button
                    onClick={handleAnalyzeMobileLitigation}
                    disabled={litigationAnalyzing}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:scale-98 disabled:opacity-50 text-white font-extrabold rounded-xl text-[11px] transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    {litigationAnalyzing ? "⚡ 소송 문서 분석 중..." : "⚖️ 소송 문서 AI 분석 개시"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 섹션 3: 소송 단계 로드맵 ────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setExpandedSection(expandedSection === "litigation" ? null : "litigation")}
            className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">소송 간편 로드맵 가이드</span>
            </div>
            {expandedSection === "litigation" ? <ChevronUp className="w-4 h-4 text-slate-455" /> : <ChevronDown className="w-4 h-4 text-slate-455" />}
          </button>

          {expandedSection === "litigation" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4 text-[10px] text-left">
              <div className="relative pl-4 border-l border-amber-500/60 space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-800">1. 증거 수집 및 최고</h4>
                  <p className="text-slate-500 mt-0.5">이메일, 송금증, 문자 확보 후 내용증명 발송.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800">2. 지급명령 신청</h4>
                  <p className="text-slate-500 mt-0.5">법정 분쟁 기피 시 법원에 간이독촉신청 진행.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800">3. 본안 정식 소장 접수</h4>
                  <p className="text-slate-500 mt-0.5">답변서 제출 기한 30일, 입증 서면 지속 준비.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800">4. 집행권원 자산 채권 압류</h4>
                  <p className="text-slate-500 mt-0.5">판결 확보 후 예금 및 지상 채권 최종 압류 집행.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 섹션 4: 원클릭 판례 검색 ────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setExpandedSection(expandedSection === "search" ? null : "search")}
            className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">원클릭 퀵 판례 검색</span>
            </div>
            {expandedSection === "search" ? <ChevronUp className="w-4 h-4 text-slate-455" /> : <ChevronDown className="w-4 h-4 text-slate-455" />}
          </button>

          {expandedSection === "search" && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
              {/* 퀵 핫키 패널 */}
              <div className="space-y-1 text-left">
                <span className="text-[9px] text-slate-450 font-bold block mb-1">자주 찾는 판례 검색어:</span>
                <div className="flex flex-wrap gap-1.5">
                  {["용역대금", "업무상 횡령", "하자보수", "소유권이전", "주휴수당"].map((word) => (
                    <button
                      key={word}
                      onClick={() => runQuickSearch(word)}
                      className="bg-white border border-slate-200 text-[10px] text-slate-600 px-2.5 py-1 rounded-lg hover:bg-slate-50 shadow-sm"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>

              {/* 검색 컨트롤 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="직접 검색어 입력"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runQuickSearch(searchQuery)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => runQuickSearch(searchQuery)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-4 rounded-lg text-xs shrink-0 shadow-sm"
                >
                  검색
                </button>
              </div>

              {/* 결과 리스트 */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {loading && searchResults.length === 0 ? (
                  <div className="text-center py-6 text-[10px] text-slate-400 font-bold">법제처 연동 데이터 검색 중...</div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-6 text-[10px] text-slate-450 font-semibold">검색된 결과가 존재하지 않습니다.</div>
                ) : (
                  searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => fetchDecisionDetail(item.id, item.title)}
                      className="bg-white hover:bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-left cursor-pointer transition-colors shadow-sm"
                    >
                      <h4 className="text-[10px] font-bold text-slate-800 line-clamp-1">{item.title}</h4>
                      <div className="flex items-center justify-between text-[8px] text-slate-450 mt-1 font-mono">
                        <span>{item.subTitle}</span>
                        <span className="text-amber-600 font-black uppercase tracking-wider">전문 읽기</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 모바일 판례 전문 모달 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
          <div className="bg-white border border-slate-150 rounded-2xl w-full max-w-sm max-h-[80vh] shadow-2xl relative z-10 overflow-hidden flex flex-col">
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-1.5 min-w-0 text-left">
                <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                <h3 className="text-xs font-extrabold text-slate-800 truncate pr-2">
                  {selectedTitle}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto text-slate-700 font-mono text-[10px] leading-relaxed max-h-[50vh] whitespace-pre-wrap bg-slate-50/30 text-left">
              {selectedText ? selectedText : "불러오는 중..."}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={() => setModalOpen(false)}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg text-xs"
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
