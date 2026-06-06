import React from "react";
import { HotspotInfo } from "../types";
import { ShieldAlert, TrendingUp } from "lucide-react";

interface FactoryHotspotCardProps {
  hotspots: HotspotInfo[];
  onEmergencyStop: (zoneId: string) => void;
}

/**
 * 공장 레이아웃 평면도 및 사고 위험 핫스팟 히트맵 시각화 카드
 */
export default function FactoryHotspotCard({
  hotspots,
  onEmergencyStop,
}: FactoryHotspotCardProps) {
  
  // 위험 점수별 색상 코드 도출 함수
  const getZoneColor = (score: number) => {
    if (score >= 80) return "rgba(239, 68, 68, 0.25)"; // 빨강 (위험)
    if (score >= 50) return "rgba(245, 158, 11, 0.2)"; // 주황 (경고)
    return "rgba(59, 130, 246, 0.1)"; // 파랑 (안정)
  };

  const getZoneStrokeColor = (score: number) => {
    if (score >= 80) return "#ef4444";
    if (score >= 50) return "#f59e0b";
    return "#3b82f6";
  };

  // SVG 좌표 및 차원
  const width = 800;
  const height = 240;

  // 구역별 레이아웃 좌표 매핑 정보
  const ZONES_LAYOUT: Record<string, { x: number; y: number; w: number; h: number }> = {
    "ZONE-A": { x: 30, y: 30, w: 200, h: 180 },  // 프레스실
    "ZONE-B": { x: 250, y: 30, w: 280, h: 80 },  // 사출 작업동
    "ZONE-C": { x: 250, y: 130, w: 280, h: 80 }, // B2 자재 로딩 야드
    "ZONE-D": { x: 550, y: 30, w: 220, h: 180 }  // 조립 포장 라인
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left space-y-4">
      
      {/* 상단 타이틀 */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-50 text-red-650">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">공장 구역별 실시간 사고 위험 핫스팟 히트맵</h3>
            <p className="text-[9px] text-slate-400 font-bold">비정형 이벤트 누적에 따른 구역별 리스크 등급 시각화</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* 공장 도면 SVG */}
        <div className="lg:col-span-3 bg-slate-50 border border-slate-150 rounded-2xl p-2.5 overflow-x-auto relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[650px] h-auto">
            {/* 공장 외곽 가이드선 */}
            <rect x="10" y="10" width={width - 20} height={height - 20} fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5,5" />
            <text x="20" y="25" fontSize="7" fill="#94a3b8" fontWeight="bold">FACTORY EXTERNAL BOUNDARY</text>

            {/* 각 핫스팟 구역 그리기 */}
            {hotspots.map((zone) => {
              const layout = ZONES_LAYOUT[zone.zoneId] || { x: 0, y: 0, w: 100, h: 100 };
              const color = getZoneColor(zone.dangerScore);
              const stroke = getZoneStrokeColor(zone.dangerScore);

              return (
                <g key={zone.zoneId} className="group cursor-pointer">
                  {/* 구역 배경 */}
                  <rect
                    x={layout.x}
                    y={layout.y}
                    width={layout.w}
                    height={layout.h}
                    fill={color}
                    stroke={stroke}
                    strokeWidth="2"
                    rx="12"
                    className="transition-all group-hover:fill-opacity-40"
                  />
                  {/* 구역 텍스트 */}
                  <text x={layout.x + 15} y={layout.y + 30} fontSize="10.5" fontWeight="black" fill="#1e293b">
                    {zone.zoneName}
                  </text>
                  <text x={layout.x + 15} y={layout.y + 46} fontSize="8.5" fontWeight="bold" fill="#64748b">
                    누적 위험지수: {zone.dangerScore}%
                  </text>
                  
                  {/* 비상 상태 알림 뱃지 */}
                  {zone.dangerScore >= 80 && (
                    <g>
                      <circle cx={layout.x + layout.w - 25} cy={layout.y + 25} r="6" fill="#ef4444" className="animate-ping" style={{ transformOrigin: `${layout.x + layout.w - 25}px ${layout.y + 25}px` }} />
                      <circle cx={layout.x + layout.w - 25} cy={layout.y + 25} r="4.5" fill="#ef4444" />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* 구역별 긴급 셧다운 제어 패널 */}
        <div className="lg:col-span-1 bg-slate-50 border border-slate-150 rounded-2xl p-4.5 flex flex-col justify-between text-left space-y-4">
          <div className="space-y-3">
            <span className="text-[8.5px] font-black text-rose-500 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
              구역 안전 제동 제어판
            </span>
            <p className="text-[9px] text-slate-400 font-bold leading-normal">
              CCTV 비전 감지로 긴급 인명 재해 상황이 식별되면, 즉시 아래의 버튼을 통해 해당 구역의 동력 전원을 원격 셧다운 차단 조치하십시오.
            </p>
          </div>

          <div className="space-y-2">
            {hotspots.map((zone) => {
              const isHighDanger = zone.dangerScore >= 70;
              return (
                <button
                  key={`stop-btn-${zone.zoneId}`}
                  type="button"
                  onClick={() => onEmergencyStop(zone.zoneId)}
                  className={`w-full py-2 px-3 rounded-xl text-[9px] font-black flex items-center justify-between transition-colors border ${
                    isHighDanger
                      ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200"
                      : "bg-white hover:bg-slate-100 text-slate-700 border-slate-355"
                  }`}
                >
                  <span>{zone.zoneName.split(" ")[0]} 셧다운</span>
                  <ShieldAlert className={`w-3.5 h-3.5 ${isHighDanger ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
