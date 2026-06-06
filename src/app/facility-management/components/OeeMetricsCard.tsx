import React from "react";
import { OeeData } from "../types";
import { LayoutDashboard, Award, Landmark, TrendingUp, AlertTriangle } from "lucide-react";

interface OeeMetricsCardProps {
  data: OeeData | null;
}

export default function OeeMetricsCard({ data }: OeeMetricsCardProps) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. OEE 3대 핵심 효율 지표 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Award className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">설비종합효율 (OEE) 지표</h4>
            <p className="text-[9px] text-slate-400 font-bold">생산성 극대화를 위한 3대 요소 측정</p>
          </div>
        </div>

        {/* 종합 효율 서클 게이지 모킹 */}
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-slate-400">설비종합효율 (Overall OEE)</span>
            <h5 className="text-2xl font-black text-slate-850 mt-1">{data.overallOee.toFixed(1)}%</h5>
            <span className="text-[8.5px] font-black text-amber-600 block mt-1.5">목표 효율 대비 6.6% 미달</span>
          </div>
          
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* SVG 서클 프로그레스 */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="4.5" fill="transparent" />
              <circle cx="32" cy="32" r="28" stroke="#4f46e5" strokeWidth="4.5" fill="transparent" 
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - data.overallOee / 100)} 
              />
            </svg>
            <span className="absolute text-[10px] font-black text-slate-800">OEE</span>
          </div>
        </div>

        {/* 3대 효율 지표 리스트 */}
        <div className="space-y-2.5">
          <div className="text-[9.5px] font-bold text-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span>시간가동률 (Availability)</span>
              <span className="font-black">{data.availability.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.availability}%` }} />
            </div>
          </div>

          <div className="text-[9.5px] font-bold text-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span>성능효율 (Performance)</span>
              <span className="font-black">{data.performance.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.performance}%` }} />
            </div>
          </div>

          <div className="text-[9.5px] font-bold text-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span>양품률 (Quality)</span>
              <span className="font-black">{data.quality.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.quality}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. 비가동 손실 및 금액 분석 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Landmark className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">비가동 원인 및 손실 금액 분석</h4>
            <p className="text-[9px] text-slate-400 font-bold">돌발 정지로 인한 현금 흐름 손실 추정</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3">
            <span className="text-[8.5px] font-black text-rose-800">금월 기회 손실 비용</span>
            <p className="text-sm font-black text-rose-700 mt-1">
              {data.financialLoss.opportunityLossKrw.toLocaleString()}원
            </p>
            <span className="text-[8px] text-slate-400 block mt-1">돌발정지 25분 손실</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
            <span className="text-[8.5px] font-black text-emerald-800">AI 예방 손실 절감액</span>
            <p className="text-sm font-black text-emerald-700 mt-1">
              {data.financialLoss.preventedLossKrw.toLocaleString()}원
            </p>
            <span className="text-[8px] text-slate-450 block mt-1">ROI 투자 입증 🟢</span>
          </div>
        </div>

        {/* 손실 원인 분석 가로 막대 리스트 */}
        <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
          {data.downtimeReasons.slice(0, 3).map((dr, idx) => (
            <div key={idx} className="text-[9.5px] font-bold text-slate-700">
              <div className="flex justify-between items-center mb-0.5">
                <span className="truncate pr-2">{dr.reason}</span>
                <span className="shrink-0">{dr.minutes}분 ({dr.rate}%)</span>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${dr.rate}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 실시간 공장 설비 배치 맵 (Factory Layout) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <LayoutDashboard className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">실시간 공장 레이아웃 뷰어</h4>
            <p className="text-[9px] text-slate-400 font-bold">공장 설비 상태 실시간 매핑</p>
          </div>
        </div>

        {/* SVG 평면 배치도 */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-2 relative h-[165px]">
          <svg viewBox="0 0 200 120" className="w-full h-full">
            {/* 공장 구획 선 */}
            <rect x="5" y="5" width="190" height="110" rx="10" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
            
            {/* 설비 노드 렌더링 */}
            {data.factoryLayout.map((item) => {
              const color = item.status === "RUNNING" ? "#10b981" : item.status === "WARNING" ? "#f59e0b" : "#ef4444";
              return (
                <g key={item.id} className="cursor-pointer" title={`${item.name} | OEE: ${item.oee}%`}>
                  <rect 
                    x={item.x - 12} 
                    y={item.y - 12} 
                    width="24" 
                    height="24" 
                    rx="5" 
                    fill="#1e293b" 
                    stroke={color} 
                    strokeWidth="1.5" 
                  />
                  <circle cx={item.x} cy={item.y} r="3.5" fill={color} />
                  <text x={item.x} y={item.y + 20} fill="#94a3b8" fontSize="6.5" fontWeight="black" textAnchor="middle">
                    {item.name}
                  </text>
                  <text x={item.x} y={item.y - 16} fill="#38bdf8" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                    {item.oee > 0 ? `${item.oee.toFixed(0)}%` : 'OFF'}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* 범례 */}
          <div className="absolute bottom-2 left-3 flex gap-2 text-[7.5px] font-black text-slate-500">
            <div className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>가동</span>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>주의</span>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>정지</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
