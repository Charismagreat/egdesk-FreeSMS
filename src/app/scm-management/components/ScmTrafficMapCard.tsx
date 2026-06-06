import React from "react";
import { ScmShipment } from "../types";
import { Globe, Truck, Anchor } from "lucide-react";

interface ScmTrafficMapCardProps {
  shipments: ScmShipment[];
}

/**
 * 조달 원자재의 이송 루트 및 실시간 운송 전국/해상 맵 시각화 카드
 */
export default function ScmTrafficMapCard({ shipments }: ScmTrafficMapCardProps) {
  
  // SVG 크기 정의
  const width = 800;
  const height = 280;

  const getRiskColor = (risk: string) => {
    if (risk === "CRITICAL") return "#ef4444"; // 빨강
    if (risk === "WARNING") return "#f59e0b"; // 주황
    return "#10b981"; // 초록
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left space-y-4">
      
      {/* 상단 타이틀 */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Globe className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">실시간 원자재 조달 물류 관제 노선도</h3>
            <p className="text-[9px] text-slate-400 font-bold">글로벌 및 국내 해상/육상 조달선 트래킹 및 AI 리스크 진단</p>
          </div>
        </div>
        
        <span className="text-[8.5px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
          💡 화물의 상태에 맞춰 점선 루트 및 실시간 운송 핀이 렌더링됩니다.
        </span>
      </div>

      {/* SVG 지도 뷰포트 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 overflow-x-auto relative">
        {/* 뒷배경 디지털 눈금 효과 */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[700px] h-auto">
          {/* 가상 국경선 뼈대 가이드 (간단한 수평/수직 점선 연출) */}
          <line x1="50" y1="140" x2="750" y2="140" stroke="#1e293b" strokeWidth="1" strokeDasharray="5,5" />
          <line x1="400" y1="20" x2="400" y2="260" stroke="#1e293b" strokeWidth="1" strokeDasharray="5,5" />

          {/* 운송 노선 및 마커 렌더링 */}
          {shipments.map((ship) => {
            const riskColor = getRiskColor(ship.risk);
            const isCritical = ship.risk === "CRITICAL";

            return (
              <g key={ship.id}>
                {/* 1. 출발지 -> 목적지 전체 경로 점선 */}
                <path
                  d={`M ${ship.route.from.x} ${ship.route.from.y} Q ${(ship.route.from.x + ship.route.to.x) / 2} ${(ship.route.from.y + ship.route.to.y) / 2 - 40} ${ship.route.to.x} ${ship.route.to.y}`}
                  fill="none"
                  stroke={riskColor}
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  strokeOpacity="0.5"
                />

                {/* 2. 출발지 노드 */}
                <circle cx={ship.route.from.x} cy={ship.route.from.y} r="4.5" fill="#334155" stroke="#475569" strokeWidth="1.5" />
                <text x={ship.route.from.x - 10} y={ship.route.from.y + 16} fontSize="8.5" fill="#64748b" fontWeight="black" textAnchor="middle">
                  🛫 {ship.route.fromName}
                </text>

                {/* 3. 목적지 노드 (공장) */}
                <circle cx={ship.route.to.x} cy={ship.route.to.y} r="5.5" fill="#2563eb" stroke="#60a5fa" strokeWidth="1.5" />
                <text x={ship.route.to.x + 12} y={ship.route.to.y + 4} fontSize="9" fill="#93c5fd" fontWeight="black">
                  🏭 평택 공장 (도착지)
                </text>

                {/* 4. 현재 실시간 화물 위치 노드 */}
                <g>
                  {/* 피크 위험 깜빡임 핑 */}
                  {isCritical && (
                    <circle 
                      cx={ship.route.current.x} 
                      cy={ship.route.current.y} 
                      r="12" 
                      fill={riskColor} 
                      fillOpacity="0.25" 
                      className="animate-ping" 
                      style={{ transformOrigin: `${ship.route.current.x}px ${ship.route.current.y}px` }} 
                    />
                  )}
                  {/* 메인 핀 */}
                  <circle 
                    cx={ship.route.current.x} 
                    cy={ship.route.current.y} 
                    r="6.5" 
                    fill={riskColor} 
                    stroke="white" 
                    strokeWidth="2" 
                  />
                  {/* 라벨 텍스트 */}
                  <text 
                    x={ship.route.current.x} 
                    y={ship.route.current.y - 14} 
                    fontSize="8.5" 
                    fill={riskColor} 
                    fontWeight="black" 
                    textAnchor="middle"
                  >
                    🚚 {ship.id} ({ship.delayProbability}% 지연)
                  </text>
                  
                  {/* 품목 안내 툴팁 텍스트 */}
                  <text 
                    x={ship.route.current.x} 
                    y={ship.route.current.y + 16} 
                    fontSize="7.5" 
                    fill="#94a3b8" 
                    fontWeight="bold" 
                    textAnchor="middle"
                  >
                    {ship.item.split(" ")[0]}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* 맵 하단 정보 */}
        <span className="absolute bottom-2 left-3 text-[7.5px] font-mono text-slate-550 z-10">
          GLOBAL SUPPLY CHAIN MONITOR | MAP MODEL: MERCATOR_GRID
        </span>
      </div>

    </div>
  );
}
