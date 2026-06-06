"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Sparkles, RefreshCw, CheckCircle, AlertTriangle, PenTool, User, CloudSun } from "lucide-react";

// useSearchParams()를 안전하게 감싸기 위한 서브 컴포넌트
function TbmSignatureContent() {
  const searchParams = useSearchParams();
  const tbmId = searchParams.get("id");

  // --- 📂 상태 관리 ---
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tbmLog, setTbmLog] = useState<any | null>(null);
  const [workerName, setWorkerName] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- 🛎️ 토스트 알림 ---
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- ✍️ 캔버스 서명 패드 참조 및 그리기 상태 ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  useEffect(() => {
    if (!tbmId) return;

    const fetchTbmDetail = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/safety/tbm");
        const data = await res.json();
        if (data.success && data.tbmLogs) {
          const log = data.tbmLogs.find((t: any) => t.id === tbmId);
          if (log) {
            setTbmLog(log);
          } else {
            showToast("해당 TBM 정보를 찾을 수 없습니다.", "error");
          }
        } else {
          showToast("데이터 로드 실패", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("네트워크 오류가 발생했습니다.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTbmDetail();
  }, [tbmId]);

  // --- 🎨 캔버스 그리기 함수 모음 ---
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // 모바일 터치 이벤트 대응
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b"; // slate-800
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // --- 🚀 서명 업로드 제출 ---
  const handleSubmitSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim()) {
      showToast("이름을 입력해 주세요.", "error");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL("image/png");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/safety/tbm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tbmId,
          worker_name: workerName,
          signature_data: signatureData
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
        showToast("안전 서명이 성공적으로 접수되었습니다.", "success");
      } else {
        showToast(data.error || "서명 등록 실패", "error");
      }
    } catch (err: any) {
      showToast(`네트워크 오류: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tbmId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans text-slate-800">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-sm w-full space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
          <h3 className="text-lg font-black">잘못된 접근입니다</h3>
          <p className="text-xs text-slate-500 font-bold">QR 코드를 카메라로 다시 정식 스캔해 주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4">
      {/* 🛎️ 알림 토스트 */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in w-11/12 max-w-sm ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* 모바일 안전 헤더 */}
      <div className="w-full max-w-md bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-3xl p-5 shadow-md mb-4 flex items-center gap-3">
        <Shield className="w-8 h-8 text-white animate-pulse" />
        <div>
          <h2 className="text-base font-black">현장 작업 전 TBM 안전 서명</h2>
          <p className="text-[10px] text-amber-100 font-extrabold uppercase">Serious Accident Punishment Act (SAPA)</p>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full max-w-md bg-white rounded-3xl p-12 border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-black text-slate-500">TBM 교육 내용을 불러오는 중...</p>
        </div>
      ) : !tbmLog ? (
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-xs font-black text-slate-500">TBM 개설 정보를 찾지 못했습니다.</p>
        </div>
      ) : isSubmitted ? (
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center space-y-6 animate-scale-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">안전 서명 완료</h3>
            <p className="text-xs text-slate-500 font-extrabold mt-1.5">{workerName}님의 소중한 서명이 완료되었습니다.</p>
          </div>
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-150 text-xs font-extrabold text-emerald-800 space-y-1">
            <p>오늘도 안전이 최우선입니다.</p>
            <p>보호구 착용 상태를 다시 한번 확인하고 작업해 주세요!</p>
          </div>
          <p className="text-[10px] text-slate-400 font-bold">본 모바일 창을 닫으셔도 좋습니다.</p>
        </div>
      ) : (
        <>
          {/* 오늘의 TBM 핵심 멘트 교육판 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
              <span>TBM 진행일: {tbmLog.tbm_date}</span>
              <span>작업 리더: {tbmLog.work_leader} 주임</span>
            </div>
            
            <div className="bg-amber-50/40 rounded-2xl p-4 border border-amber-150 text-xs font-bold text-slate-750 whitespace-pre-wrap leading-relaxed">
              <p className="font-extrabold text-amber-800 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
                오늘의 중요 안전 지침:
              </p>
              {tbmLog.tbm_script}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
              <CloudSun className="w-4 h-4 text-slate-500" />
              <span>현장 기상상황: {tbmLog.weather_info}</span>
            </div>
          </div>

          {/* 서명 입력 폼 */}
          <form onSubmit={handleSubmitSignature} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-amber-500" />
              참석 확인 및 서명 패드
            </h4>

            <div>
              <label className="text-xs font-black text-slate-500 block mb-1">근로자 성명</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="text-xs font-bold w-full border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="본인의 실명을 입력해 주세요"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-black text-slate-500">안전 준수 서명 (터치 또는 마우스 드래그)</label>
                <button 
                  type="button" 
                  onClick={clearCanvas}
                  className="text-[10px] font-black text-rose-500 hover:underline"
                >
                  지우기
                </button>
              </div>
              
              {/* 서명 패드 캔버스 */}
              <div className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-50 shadow-inner">
                <canvas 
                  ref={canvasRef}
                  width={380}
                  height={150}
                  className="w-full h-[150px] cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-extrabold text-sm py-3 px-4 rounded-xl w-full flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  서명 전송 중...
                </>
              ) : (
                "안전 교육 이수 서명 완료"
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

// 메인 모바일 TBM 서명 페이지 컴포넌트 (Suspense Boundary로 감싸기)
export default function MobileTbmSignaturePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 font-sans text-slate-800 text-left">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-3xl p-12 border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-black text-slate-500">페이지 초기화 중...</p>
        </div>
      }>
        <TbmSignatureContent />
      </Suspense>
    </div>
  );
}
