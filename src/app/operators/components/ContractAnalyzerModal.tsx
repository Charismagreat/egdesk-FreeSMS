"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { Operator } from "../types";

interface ToxicClause {
  clause_name: string;
  clause_text: string;
  violation_reason: string;
}

interface AnalysisResult {
  hourly_wage: number;
  weekly_hours: number;
  allow_weekly_holiday_paid: number;
  work_days: string;
  contract_memo: string;
  has_law_violation: boolean;
  toxic_clauses: ToxicClause[];
}

interface ContractAnalyzerModalProps {
  operator: Operator | null;
  onClose: () => void;
}

export function ContractAnalyzerModal({ operator, onClose }: ContractAnalyzerModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!operator) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("PDF 문서 또는 이미지 파일(PNG, JPG)만 업로드할 수 있습니다.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(selectedFile);
    setResult(null);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. 파일 Base64 변환
      const base64Promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const resultStr = reader.result as string;
          const base64Data = resultStr.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = (err) => reject(err);
      });

      const fileBase64 = await base64Promise;

      // 2. API 호출
      const response = await fetch("/api/hr/contracts/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator_id: operator.id,
          file_base64: fileBase64,
          file_mime: file.type,
          file_name: file.name
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || "분석 중 오류가 발생했습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setError("서버와 통신하는 중 문제가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              근로계약서 AI 분석 및 자동 등록
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              대상 직원: <span className="font-semibold text-slate-700">{operator.name}</span> ({operator.employee_number || "사번 없음"})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors border-0 bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 드롭존 및 파일 선택 */}
          {!result && !isAnalyzing && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                isDragOver
                  ? "border-indigo-500 bg-indigo-50/50"
                  : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf, image/png, image/jpeg"
                className="hidden"
              />
              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 mb-3">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">
                {file ? file.name : "여기에 근로계약서 파일 드롭하기"}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB • 변경하려면 클릭`
                  : "PDF 문서 또는 이미지 파일(PNG, JPG)을 드래그앤드롭하거나 클릭하여 선택하세요."}
              </p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-red-800">분석 처리 실패</h5>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* 분석 로딩 중 */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-700">Gemini AI 계약서 해독 중</h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  노동법 준수 여부 및 근로 조건을 분석하고 있습니다. 이 작업은 약 5-10초 소요됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 분석 결과 렌더링 */}
          {result && (
            <div className="space-y-6">
              {/* 요약 성공 / 경고 카드 */}
              {result.has_law_violation ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">노동법 저촉 및 독소조항 감지됨</h4>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      분석 결과 계약서 내에 근로기준법 위반 소지가 있는 항목이 발견되었습니다. 아래 세부 노무 제언을 검토해 주세요. (계약 조건은 DB에 자동 임시 저장되었습니다.)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">노동법 준수 계약서 판정</h4>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      근로기준법 위반이 없는 안전한 근로 계약으로 식별되었습니다. 근로 조건이 성공적으로 DB에 적용되었습니다.
                    </p>
                  </div>
                </div>
              )}

              {/* 추출된 주요 근로 조건 */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  추출된 근로 조건 설정
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500">통상 시급</p>
                    <p className="text-lg font-bold text-slate-800 mt-1 font-mono">
                      {result.hourly_wage.toLocaleString()}원
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500">주당 소정근로시간</p>
                    <p className="text-lg font-bold text-slate-800 mt-1 font-mono">
                      {result.weekly_hours}시간
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500">주휴수당 지급 여부</p>
                    <p className="text-base font-bold text-slate-800 mt-1.5">
                      {result.allow_weekly_holiday_paid === 1 ? (
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">지급 (주 15시간 이상)</span>
                      ) : (
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs">미지급 (주 15시간 미만)</span>
                      )}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500">근무 요일</p>
                    <p className="text-base font-bold text-slate-800 mt-1.5 truncate" title={result.work_days}>
                      {result.work_days || "미지정"}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-500">계약서 요약 메모</p>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">{result.contract_memo}</p>
                </div>
              </div>

              {/* 독소조항 상세 목록 */}
              {result.toxic_clauses && result.toxic_clauses.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    독소조항 상세 제언
                  </h4>
                  <div className="space-y-3">
                    {result.toxic_clauses.map((clause, idx) => (
                      <div key={idx} className="border border-amber-100 rounded-2xl p-4 bg-amber-50/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            {clause.clause_name}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-slate-100 italic">
                          "{clause.clause_text}"
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          <strong className="text-amber-900 block mb-0.5 font-medium">💡 노무 권고 의견</strong>
                          {clause.violation_reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-b-3xl">
          <p className="text-xs text-slate-400">
            {result ? "스캔 완료. 내용이 자동으로 반영되었습니다." : "파일을 선택한 뒤 분석을 클릭하세요."}
          </p>
          <div className="flex gap-2">
            {!result ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white border-0 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {isAnalyzing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  분석 시작
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border-0 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                확인 및 닫기
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
