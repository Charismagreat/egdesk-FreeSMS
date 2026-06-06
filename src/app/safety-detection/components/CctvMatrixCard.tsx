import React from "react";
import { CctvInfo } from "../types";
import { Camera, Radio, ShieldAlert } from "lucide-react";

interface CctvMatrixCardProps {
  cctvs: CctvInfo[];
}

/**
 * 실시간 CCTV 비전 스트리밍 매트릭스 및 AI 바운딩 박스 오버레이 카드
 */
export default function CctvMatrixCard({ cctvs }: CctvMatrixCardProps) {
  
  // 가상 CCTV 화면 좌표계 규격 (800x450 비율)
  const viewWidth = 800;
  const viewHeight = 450;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left space-y-4">
      
      {/* 상단 타이틀 */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
            <Camera className="w-4.5 h-4.5 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">작업장 실시간 IP CCTV & AI 비전 분석</h3>
            <p className="text-[9px] text-slate-400 font-bold">실시간 YOLOv8 헬멧/영역 이상 행동 감지 오버레이</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-[8.5px] font-black text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full animate-pulse">
          <Radio className="w-3.5 h-3.5" />
          LIVE FEED ACTIVE
        </div>
      </div>

      {/* CCTV 비디오 매핑 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cctvs.map((cam) => {
          const isWarning = cam.status === "WARNING";
          const isStop = cam.status === "EMERGENCY_STOP";

          return (
            <div 
              key={cam.id}
              className={`rounded-2xl overflow-hidden border bg-slate-950 flex flex-col justify-between relative shadow-sm transition-all ${
                isWarning 
                  ? "border-red-500 ring-2 ring-red-500/20" 
                  : isStop 
                    ? "border-rose-700 opacity-80" 
                    : "border-slate-800"
              }`}
            >
              {/* CCTV 상단 헤더 정보 */}
              <div className="bg-slate-900/90 border-b border-slate-800/80 px-3.5 py-2 flex justify-between items-center z-10">
                <span className="text-[9px] text-slate-300 font-black truncate max-w-[150px]">{cam.name}</span>
                <div className="flex items-center gap-1.5">
                  {isWarning && (
                    <span className="text-[7.5px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1 py-0.2 rounded">
                      위험 감지
                    </span>
                  )}
                  {isStop && (
                    <span className="text-[7.5px] font-black text-rose-400 bg-rose-900/30 border border-rose-800 px-1 py-0.2 rounded">
                      원격 셧다운
                    </span>
                  )}
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isStop ? 'bg-rose-500' : isWarning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                </div>
              </div>

              {/* CCTV 비전 피드 & SVG 오버레이 영역 */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                {/* 배경 격자 및 스페이스 이펙트 */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

                {/* 셧다운 정지 시 적색 배경 표시 */}
                {isStop && (
                  <div className="absolute inset-0 bg-red-950/40 z-20 flex flex-col items-center justify-center gap-1">
                    <ShieldAlert className="w-8 h-8 text-rose-500 animate-bounce" />
                    <span className="text-[10px] text-rose-400 font-black tracking-widest uppercase">
                      SHUTDOWN: 전원 차단됨
                    </span>
                  </div>
                )}

                <svg 
                  viewBox={`0 0 ${viewWidth} ${viewHeight}`} 
                  className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                >
                  {/* AI 비전 바운딩 박스 그리기 */}
                  {cam.boundingBoxes.map((box, bIdx) => {
                    const isArea = box.isArea === true;
                    
                    return (
                      <g key={`bbox-${cam.id}-${bIdx}`}>
                        {/* 박스 드로잉 */}
                        <rect
                          x={box.x}
                          y={box.y}
                          width={box.w}
                          height={box.h}
                          fill={isArea ? box.color : "transparent"}
                          fillOpacity={isArea ? 0.08 : 0}
                          stroke={box.color}
                          strokeWidth={isArea ? 1.5 : 2}
                          strokeDasharray={isArea ? "3,3" : ""}
                        />
                        {/* 라벨 배경 */}
                        <rect
                          x={box.x}
                          y={box.y - 18}
                          width={box.label.length * 7.5 + 8}
                          height={18}
                          fill={box.color}
                          rx="2"
                        />
                        {/* 라벨 텍스트 */}
                        <text
                          x={box.x + 4}
                          y={box.y - 5}
                          fill="white"
                          fontSize="8.5"
                          fontWeight="black"
                        >
                          {box.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* 카메라 스캔라인 애니메이션 이펙트 */}
                  <line 
                    x1="0" 
                    y1="10" 
                    x2={viewWidth} 
                    y2="10" 
                    stroke="#10b981" 
                    strokeWidth="0.5" 
                    strokeOpacity="0.15" 
                    className="animate-scan" 
                  />
                </svg>

                {/* CCTV 가상 노이즈 안내 */}
                <span className="absolute bottom-2 left-2 text-[7px] font-mono text-slate-500 z-10">
                  ISO 800 | 24 FPS | REC: AI_ON
                </span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
