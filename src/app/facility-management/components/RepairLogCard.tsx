import React from "react";
import { RepairLog, RagSolution } from "../types";
import { ClipboardList, Plus, Mic, Send, Sparkles, MapPin, Search, AlertCircle, HelpCircle } from "lucide-react";

interface RepairLogCardProps {
  logs: RepairLog[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  chatInput: string;
  onChatInputChange: (val: string) => void;
  chatAnswer: RagSolution | null;
  onChatAnswerChange: (val: RagSolution | null) => void;
  isChatLoading: boolean;
  isFormOpen: boolean;
  onFormOpenChange: (val: boolean) => void;
  selectedEqId: string;
  onSelectedEqIdChange: (val: string) => void;
  errorCode: string;
  onErrorCodeChange: (val: string) => void;
  symptom: string;
  onSymptomChange: (val: string) => void;
  repairDesc: string;
  onRepairDescChange: (val: string) => void;
  cost: number;
  onCostChange: (val: number) => void;
  isSavingLog: boolean;
  isRecording: boolean;
  onChatSearch: (e: React.FormEvent) => void;
  onVoiceSttTrigger: () => void;
  onSaveRepairLog: (e: React.FormEvent) => void;
}

export default function RepairLogCard({
  logs,
  searchQuery,
  onSearchChange,
  chatInput,
  onChatInputChange,
  chatAnswer,
  onChatAnswerChange,
  isChatLoading,
  isFormOpen,
  onFormOpenChange,
  selectedEqId,
  onSelectedEqIdChange,
  errorCode,
  onErrorCodeChange,
  symptom,
  onSymptomChange,
  repairDesc,
  onRepairDescChange,
  cost,
  onCostChange,
  isSavingLog,
  isRecording,
  onChatSearch,
  onVoiceSttTrigger,
  onSaveRepairLog
}: RepairLogCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs text-left grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      
      {/* 좌측/중앙: 설비 수리 이력 대장 */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">설비 수리/보전 대장</h3>
              <p className="text-[10px] text-slate-400 font-bold">과거 기계 고장 해결 사례 및 정비 비용 이력</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative w-40">
              <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="수리 내역 검색..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[9px] font-bold w-full focus:outline-none"
              />
            </div>
            <button
              onClick={() => onFormOpenChange(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-extrabold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              수리 이력 수동 기입
            </button>
          </div>
        </div>

        {/* 수리 리스트 테이블 */}
        <div className="overflow-x-auto bg-slate-50 border border-slate-150 rounded-2xl max-h-[300px] overflow-y-auto">
          <table className="min-w-full text-[10px] font-bold text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left">수리 ID</th>
                <th className="px-4 py-3 text-left">일시</th>
                <th className="px-4 py-3 text-left">설비명/코드</th>
                <th className="px-4 py-3 text-left">증상/해결내역</th>
                <th className="px-4 py-3 text-left">정비사</th>
                <th className="px-4 py-3 text-left">정비비용</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-black text-slate-900">{log.id}</td>
                  <td className="px-4 py-3 text-slate-400 font-medium">{log.date.slice(5)}</td>
                  <td className="px-4 py-3">
                    <p className="font-extrabold text-slate-850">{log.equipmentName}</p>
                    <span className="text-[8.5px] font-black bg-slate-100 px-1 py-0.2 rounded border border-slate-200 text-slate-500">
                      {log.errorCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-extrabold text-slate-800">증상: {log.symptom}</p>
                    <p className="text-[9px] text-slate-500 font-medium leading-normal mt-0.5">{log.repairDesc}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-medium">{log.mechanic.split(" ")[0]}</td>
                  <td className="px-4 py-3 font-black text-slate-850">{log.cost.toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 우측: RAG 기반 지능형 설비 고장 매뉴얼 챗봇 */}
      <div className="bg-slate-50 border border-slate-150 rounded-3xl p-5 flex flex-col justify-between min-h-[300px]">
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <Sparkles className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
            <div>
              <h4 className="text-xs font-black text-slate-850">AI 설비 고장 해결 가이드</h4>
              <p className="text-[8.5px] text-slate-450 font-bold">RAG 기반 퇴직 반장 노하우 지식 매칭</p>
            </div>
          </div>

          {chatAnswer ? (
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-2.5 text-[9.5px]">
                <span className="font-black text-rose-800 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  근본 원인 (Root Cause)
                </span>
                <p className="font-bold text-slate-750 mt-1 leading-normal">{chatAnswer.rootCause}</p>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5 text-[9.5px]">
                <span className="font-black text-indigo-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  추천 조치 가이드
                </span>
                <ul className="space-y-1.5 mt-1 font-bold text-slate-750 leading-normal">
                  {chatAnswer.actions.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-200/50 rounded-xl p-2.5 text-[9px] text-slate-600 font-bold">
                <p>💡 과거 유사 사례: {chatAnswer.similarHistory}</p>
              </div>

              <div className="bg-cyan-50 border border-cyan-150 rounded-xl p-2.5 text-[9.5px] text-cyan-800 font-black flex items-center gap-1.5">
                <MapPin className="w-4 h-4 shrink-0 text-cyan-600 animate-bounce" />
                <div>
                  <p>필요 예비 자재 보관함 좌표:</p>
                  <p className="text-[10px] text-slate-700 font-extrabold mt-0.5">{chatAnswer.warehouse}</p>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={() => onChatAnswerChange(null)}
                className="text-[9px] font-black text-indigo-600 hover:underline block text-center w-full"
              >
                새로운 에러 질문하기
              </button>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 flex flex-col items-center justify-center gap-2">
              <HelpCircle className="w-8 h-8 text-slate-300" />
              <p className="text-[9.5px] font-black leading-normal max-w-[180px]">
                에러 코드(예: **E-03** 또는 **E-15**)를 하단에 기입하면 AI가 과거 수리 대장과 제작사 가이드를 기반으로 대책을 제시합니다.
              </p>
            </div>
          )}
        </div>

        {/* 챗봇 입력 폼 */}
        {!chatAnswer && (
          <form onSubmit={onChatSearch} className="flex gap-1.5 mt-4">
            <input
              type="text"
              placeholder="예: 압출기 E-03 에러 발생 해결책?"
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              className="flex-1 text-[10px] font-bold border border-slate-350 rounded-xl px-3 py-2 bg-white focus:outline-none"
              disabled={isChatLoading}
            />
            <button
              type="submit"
              disabled={isChatLoading}
              className="bg-indigo-650 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all shadow-3xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>

      {/* --- 수리 보고서 등록 간이 모달창 --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="text-sm font-black text-slate-800">수리/정비 이력서 작성</h4>
              <button 
                onClick={() => onFormOpenChange(false)} 
                className="text-slate-400 hover:text-slate-600 text-base font-black px-1.5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onSaveRepairLog} className="space-y-3 text-[10px] font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[9px] text-slate-450">대상 설비</label>
                  <select 
                    value={selectedEqId} 
                    onChange={(e) => onSelectedEqIdChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white text-[10px]"
                  >
                    <option value="M-500">사출 1호기 (M-500)</option>
                    <option value="M-300">사출 2호기 (M-300)</option>
                    <option value="M-200">사출 3호기 (M-200)</option>
                    <option value="A-100">조립 라인 A</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-[9px] text-slate-450">에러 코드 (선택)</label>
                  <input
                    type="text"
                    placeholder="예: E-03"
                    value={errorCode}
                    onChange={(e) => onErrorCodeChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white text-[10px]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[9px] text-slate-450">고장 증상 요약</label>
                <input
                  type="text"
                  placeholder="예: 노즐 히터 과열 온도가 한계치 초과"
                  value={symptom}
                  onChange={(e) => onSymptomChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white text-[10px]"
                  required
                />
              </div>

              {/* 음성(STT) 입력 컨트롤 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[9px] text-slate-450">수리 조치 상세 내역</label>
                  <button
                    type="button"
                    onClick={onVoiceSttTrigger}
                    disabled={isRecording}
                    className="flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-650 hover:bg-indigo-100 rounded text-[8.5px] font-black transition-colors"
                  >
                    <Mic className="w-3 h-3 text-indigo-600" />
                    {isRecording ? "녹음 분석 중..." : "음성 수리대장 받아쓰기 (STT)"}
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="구체적인 부품 교체 및 작업 내역을 입력하세요..."
                  value={repairDesc}
                  onChange={(e) => onRepairDescChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white text-[10px] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-[9px] text-slate-450">소요 비용 (원)</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => onCostChange(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white text-[10px]"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingLog}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center shadow-xs transition-colors"
              >
                {isSavingLog ? "저장 중..." : "수리 보고서 영구 적재 완료"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
