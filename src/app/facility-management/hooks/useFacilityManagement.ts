import { useState, useEffect, useCallback } from "react";
import {
  PredictiveStatus,
  OeeData,
  MaintenanceEvent,
  PartInventory,
  RepairLog,
  RagSolution
} from "../types";

export function useFacilityManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  // --- 1. 예지보전(Predictive) 상태 ---
  const [predictiveStatus, setPredictiveStatus] = useState<PredictiveStatus | null>(null);

  // --- 2. OEE 가동률 상태 ---
  const [oeeData, setOeeData] = useState<OeeData | null>(null);

  // --- 3. 캘린더 및 자재 수명 상태 ---
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [partInventories, setPartInventories] = useState<PartInventory[]>([]);

  // --- 4. 수리 대장 및 RAG 챗봇 상태 ---
  const [repairLogs, setRepairLogs] = useState<RepairLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatAnswer, setChatAnswer] = useState<RagSolution | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // 수리 대장 신규 등록 폼 상태
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState("M-500");
  const [errorCode, setErrorCode] = useState("");
  const [symptom, setSymptom] = useState("");
  const [repairDesc, setRepairDesc] = useState("");
  const [cost, setCost] = useState(0);
  const [isSavingLog, setIsSavingLog] = useState(false);

  // 음성 STT용 모의 상태
  const [isRecording, setIsRecording] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // --- 데이터 패칭 함수 ---
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Predictive
      const predRes = await fetch("/api/facility/predictive");
      const predData = await predRes.json();
      if (predData.success) setPredictiveStatus(predData.predictiveStatus);

      // 2. OEE
      const oeeRes = await fetch("/api/facility/oee");
      const oeeData = await oeeRes.json();
      if (oeeData.success) setOeeData(oeeData.oeeData);

      // 3. Calendar & Inventory
      const calRes = await fetch("/api/facility/calendar");
      const calData = await calRes.json();
      if (calData.success) {
        setEvents(calData.events);
        setPartInventories(calData.partInventories);
      }

      // 4. Repair Logs
      const repRes = await fetch(`/api/facility/repair?query=${searchQuery}`);
      const repData = await repRes.json();
      if (repData.success) setRepairLogs(repData.logs);

    } catch (e) {
      console.error("설비관리 데이터 로딩 중 오류 발생:", e);
      showToast("데이터 로드 실패", "error");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, showToast]);

  useEffect(() => {
    fetchAllData();
  }, [searchQuery]);

  // --- RAG 챗봇 질의 핸들러 ---
  const handleChatSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setIsChatLoading(true);
    setChatAnswer(null);
    try {
      // 에러 코드 형태를 추출하여 전달 (예: E-03, E-15 등)
      let code = chatInput.toUpperCase();
      // 만약 질문 텍스트에서 에러코드 패턴이 감지되면 매핑
      if (chatInput.includes("E-03") || chatInput.includes("3번")) {
        code = "E-03";
      } else if (chatInput.includes("E-15") || chatInput.includes("과부하")) {
        code = "E-15";
      }

      const res = await fetch(`/api/facility/repair?errorCode=${code}`);
      const data = await res.json();
      if (data.success) {
        setChatAnswer(data.solution);
        showToast("AI 고장 진단 및 추천 대책 분석 완료!", "success");
      }
    } catch (err: any) {
      showToast(`질문 실패: ${err.message}`, "error");
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- 수리 보고서 음성 입력 시뮬레이터 (STT 모킹) ---
  const handleVoiceSttTrigger = async () => {
    setIsRecording(true);
    showToast("🎙️ 음성 인식 중... (말씀하세요)", "warn");

    // 2.5초 대기 후 모의 분석 호출
    setTimeout(async () => {
      setIsRecording(false);
      try {
        const res = await fetch("/api/facility/repair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "voice_stt",
            rawSpeechText: "3번 사출기 모터 베어링 마모 심해서 구리스 주입하고 볼트 조임 완료"
          })
        });
        const data = await res.json();
        if (data.success) {
          setRepairDesc(data.correctedText);
          setSymptom("구동축 이상 소음 및 떨림");
          setErrorCode("정기점검");
          showToast("🎙️ AI 정제 처리 완료: 문맥에 맞게 한글 수리 대장으로 자동 정밀 갱신되었습니다.", "success");
        }
      } catch (err: any) {
        showToast("음성 변환 오류", "error");
      }
    }, 2500);
  };

  // --- 수리 보고서 수동 등록 ---
  const handleSaveRepairLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairDesc.trim() || !symptom.trim()) return;

    setIsSavingLog(true);
    try {
      const res = await fetch("/api/facility/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: selectedEqId,
          errorCode: errorCode || "보전작업",
          symptom,
          repairDesc,
          cost,
          mechanic: "김철수 (설비정비원)"
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setIsFormOpen(false);
        // 입력 폼 클리어
        setErrorCode("");
        setSymptom("");
        setRepairDesc("");
        setCost(0);
        fetchAllData(); // 갱신
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(`수리 이력 저장 실패: ${err.message}`, "error");
    } finally {
      setIsSavingLog(false);
    }
  };

  return {
    isLoading,
    toast,
    predictiveStatus,
    oeeData,
    events,
    partInventories,
    repairLogs,
    searchQuery,
    setSearchQuery,
    chatInput,
    setChatInput,
    chatAnswer,
    setChatAnswer,
    isChatLoading,
    isFormOpen,
    setIsFormOpen,
    selectedEqId,
    setSelectedEqId,
    errorCode,
    setErrorCode,
    symptom,
    setSymptom,
    repairDesc,
    setRepairDesc,
    cost,
    setCost,
    isSavingLog,
    isRecording,
    handleChatSearch,
    handleVoiceSttTrigger,
    handleSaveRepairLog,
    fetchAllData,
  };
}
