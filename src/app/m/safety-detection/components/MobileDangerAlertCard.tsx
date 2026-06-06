import React from "react";
import { DangerLog, CctvInfo } from "../../../safety-detection/types";
import { ShieldAlert, Volume2, AlertOctagon, PhoneCall, CheckCircle2, Check } from "lucide-react";

interface MobileDangerAlertCardProps {
  cctvs: CctvInfo[];
  dangerLogs: DangerLog[];
  activeDanger: DangerLog | undefined;
  isEmergency: boolean;
  onTriggerSiren: (logId: string) => void;
  onEmergencyStop: (zoneId: string) => void;
}

/**
 * 모바일용 위험 경보 및 비상 셧다운 제어 핫키 패널
 */
export default function MobileDangerAlertCard({
  cctvs,
  dangerLogs,
  activeDanger,
  isEmergency,
  onTriggerSiren,
  onEmergencyStop,
}: MobileDangerAlertCardProps) {
  
  // 위험 구역 매핑 도우미
  const getZoneId = (location: string) => {
    if (location.includes("프레스")) return "ZONE-A";
    if (location.includes("사출")) return "ZONE-B";
    if (location.includes("로딩독")) return "ZONE-C";
    return "ZONE-D";
  };

  return (
    <div className="space-y-4">
      
      {/* 🚨 1. 초비상 풀스크린 경보 모달 (CRITICAL 미조치 발생 시 노출) */}
      {isEmergency && activeDanger && (
        <div className="bg-red-950/90 border border-red-800 rounded-3xl p-5 text-left space-y-4 shadow-xl animate-pulse text-red-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-rose-500 font-extrabold text-xs">
              <AlertOctagon className="w-5 h-5 shrink-0 text-rose-500 animate-bounce" />
              <span>[초비상] 공장 안전 재해 감지</span>
            </div>
            <span className="text-[8px] font-black bg-rose-600 text-white px-2 py-0.5 rounded">
              CRITICAL LEVEL
            </span>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-sm font-black leading-snug text-white">
              {activeDanger.title}
            </h4>
            <p className="text-[9px] text-red-400 font-bold leading-normal">
              발생 구역: {activeDanger.location} | 감지시간: {activeDanger.time} | 대상자: {activeDanger.operator}
            </p>
          </div>

          {/* 모바일 비상 대응 핫키 세트 */}
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-red-800">
            <button
              type="button"
              onClick={() => onEmergencyStop(getZoneId(activeDanger.location))}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10.5px] font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <ShieldAlert className="w-4.5 h-4.5 text-white" />
              해당 구역 비상 셧다운 (원격 STOP)
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onTriggerSiren(activeDanger.id)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-amber-500 rounded-2xl text-[9.5px] font-black flex items-center justify-center gap-1 border border-slate-700"
              >
                <Volume2 className="w-4 h-4 text-amber-500" />
                경고 사이렌 방송
              </button>

              <a
                href="tel:119"
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-white rounded-2xl text-[9.5px] font-black flex items-center justify-center gap-1 border border-slate-700 text-center"
              >
                <PhoneCall className="w-4 h-4 text-rose-500" />
                119 긴급 신고
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 2. 정상 가동 상태 요약 */}
      {!isEmergency && (
        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 text-left flex items-center gap-3.5 text-slate-350 shadow-sm">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-6 h-6 fill-emerald-500/10" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">현장 작업 안전지수 양호</h4>
            <p className="text-[8.5px] text-slate-500 font-bold mt-0.5 leading-normal">
              실시간 AI 비전 CCTV 해독 결과, 작업장 내 심각한 위험 행동 및 인명 상해 사고가 포착되지 않았습니다.
            </p>
          </div>
        </div>
      )}

      {/* 📹 3. 모바일 CCTV 피드 상태 목록 */}
      <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 text-left space-y-4 shadow-sm">
        <span className="text-[10px] font-black text-slate-400 block border-b border-slate-800 pb-2">
          연동 CCTV 채널 모니터링
        </span>

        <div className="grid grid-cols-1 gap-3">
          {cctvs.map((cam) => {
            const isWarn = cam.status === "WARNING";
            const isStop = cam.status === "EMERGENCY_STOP";

            return (
              <div 
                key={cam.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex justify-between items-center"
              >
                <div>
                  <span className="text-[9.5px] font-extrabold text-white block">{cam.name}</span>
                  <span className="text-[7.5px] text-slate-500 font-bold mt-0.5 block">
                    상태: {isStop ? "🛑 비상정지" : isWarn ? "⚠️ 위험 감지" : "🟢 정상 수신"}
                  </span>
                </div>

                {/* 제어 핫키 */}
                {!isStop && (
                  <button
                    type="button"
                    onClick={() => onEmergencyStop(cam.id === "CCTV-01" ? "ZONE-A" : cam.id === "CCTV-02" ? "ZONE-B" : "ZONE-C")}
                    className="py-1.5 px-3 bg-rose-650/20 hover:bg-rose-650/30 text-rose-400 border border-rose-500/30 rounded-xl text-[8.5px] font-black transition-colors"
                  >
                    긴급 정지
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 📋 4. 위험 감지 최근 이력 리스트 */}
      <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 text-left space-y-4 shadow-sm">
        <span className="text-[10px] font-black text-slate-400 block border-b border-slate-800 pb-2">
          실시간 위험 로그 이력 (최근 3건)
        </span>

        <div className="space-y-3">
          {dangerLogs.slice(0, 3).map((log) => {
            const isResolved = log.status === "RESOLVED";
            
            return (
              <div 
                key={log.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-1 text-left"
              >
                <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-500">
                  <span>{log.time} | {log.location}</span>
                  <span className={`font-black ${isResolved ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`}>
                    {isResolved ? "조치완료" : "미조치"}
                  </span>
                </div>
                <h5 className="text-[9px] font-extrabold text-slate-300 leading-tight">
                  {log.title}
                </h5>
                <p className="text-[8px] text-slate-500 font-bold">대상자: {log.operator}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
