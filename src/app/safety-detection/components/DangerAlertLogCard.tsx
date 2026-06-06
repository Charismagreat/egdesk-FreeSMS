import React from "react";
import { DangerLog } from "../types";
import { ClipboardList, Volume2, ShieldAlert, Check } from "lucide-react";

interface DangerAlertLogCardProps {
  logs: DangerLog[];
  onTriggerSiren: (logId: string) => void;
  onEmergencyStop: (zoneId: string) => void;
}

/**
 * 실시간 위험 행동/사고 발생 감지 로그 타임라인 및 제어 카드
 */
export default function DangerAlertLogCard({
  logs,
  onTriggerSiren,
  onEmergencyStop,
}: DangerAlertLogCardProps) {
  
  // 구역 한글명에 따라 비상 정지용 ZONE-ID 매핑 도우미
  const getZoneId = (location: string) => {
    if (location.includes("프레스")) return "ZONE-A";
    if (location.includes("사출")) return "ZONE-B";
    if (location.includes("로딩독")) return "ZONE-C";
    return "ZONE-D";
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left space-y-4">
      
      {/* 헤더 */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-50 text-red-650">
            <ClipboardList className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">실시간 위험 감지 및 조치 이력 대장</h3>
            <p className="text-[9px] text-slate-400 font-bold">감지된 비정형 안전 위협 요인 일지 및 원격 비상 방송 제어</p>
          </div>
        </div>
      </div>

      {/* 로그 리스트 */}
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {logs.map((log) => {
          const isCritical = log.level === "CRITICAL";
          const isSiren = log.status === "SIREN_PLAYED";
          const isResolved = log.status === "RESOLVED";
          const isDetected = log.status === "DETECTED";

          return (
            <div 
              key={log.id}
              className={`rounded-2xl border p-4.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left transition-all ${
                isDetected 
                  ? "bg-rose-50/50 border-rose-200" 
                  : isSiren 
                    ? "bg-amber-50/50 border-amber-200" 
                    : "bg-slate-50 border-slate-150"
              }`}
            >
              {/* 좌측 정보 영역 */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[8px] font-mono text-slate-400">{log.time}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
                    isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isCritical ? "심각 (CRITICAL)" : "주의 (WARNING)"}
                  </span>
                  <span className="text-[9px] font-black text-slate-550 truncate">
                    📍 {log.location}
                  </span>
                </div>
                <h4 className="text-[10px] font-extrabold text-slate-850 leading-tight">
                  {log.title}
                </h4>
                <p className="text-[8.5px] text-slate-400 font-bold">
                  대상자: {log.operator} | 상태: {" "}
                  <span className={`font-black ${
                    isResolved ? 'text-emerald-600' : isSiren ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {isResolved ? '조치 완료' : isSiren ? '경고 방송 송출 중' : '미조치(위험 감지)'}
                  </span>
                </p>
              </div>

              {/* 우측 조치 제어부 */}
              <div className="flex gap-2 w-full md:w-auto shrink-0">
                {isResolved ? (
                  <div className="w-full md:w-auto px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black flex items-center justify-center gap-0.5 border border-emerald-100 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    안전조치 완료
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onTriggerSiren(log.id)}
                      disabled={isSiren}
                      className={`flex-1 md:flex-initial px-3 py-2 rounded-xl text-[9px] font-black flex items-center justify-center gap-1 transition-all border ${
                        isSiren 
                          ? "bg-slate-150 text-slate-400 border-slate-200" 
                          : "bg-white hover:bg-amber-50 text-amber-600 border-amber-300"
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-current" />
                      {isSiren ? "사이렌 송출 중" : "경고 방송 송출"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => onEmergencyStop(getZoneId(log.location))}
                      className="flex-1 md:flex-initial px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black flex items-center justify-center gap-1 shadow-2xs transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-white" />
                      비상 정지 (STOP)
                    </button>
                  </>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
