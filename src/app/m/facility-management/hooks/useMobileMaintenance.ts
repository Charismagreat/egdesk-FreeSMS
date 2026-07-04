import { apiFetch } from '@/lib/api';
import { useState, useCallback, useEffect } from "react";

export interface MobileCheckItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_CHECK_ITEMS: MobileCheckItem[] = [
  { id: "chk-1", label: "설비 윤활유/작동유 레벨 적정 여부 및 누유 확인", checked: false },
  { id: "chk-2", label: "구동부 구동 벨트 마모 상태 및 정렬/텐션 적정성", checked: false },
  { id: "chk-3", label: "모터 구동 시 이상 소음 및 이상 고발열 여부", checked: false },
  { id: "chk-4", label: "제어반 전기 배선 접촉 상태 및 계기판 정상 출력", checked: false },
  { id: "chk-5", label: "안전 펜스 센서 및 비상 정지(E-Stop) 연동 테스트", checked: false },
];

export function useMobileMaintenance() {
  const [equipmentId, setEquipmentId] = useState("M-500");
  const [inspector, setInspector] = useState("");
  const [checkItems, setCheckItems] = useState<MobileCheckItem[]>(DEFAULT_CHECK_ITEMS);
  const [signature, setSignature] = useState<string | null>(null);
  const [audioNote, setAudioNote] = useState("");
  const [status, setStatus] = useState<"PASS" | "FAIL">("PASS");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);
  
  // 제출 이력 목록
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 점검 기록 역사 로드
  const fetchHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await apiFetch("/api/facility/checklist");
      const data = await res.json();
      if (data.success) {
        setHistory(data.checks);
      }
    } catch (e) {
      console.error("이력 로드 실패:", e);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 체크 리스트 토글
  const handleToggleItem = (id: string) => {
    const updated = checkItems.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setCheckItems(updated);

    // 문항 중 하나라도 X(false) 상태면 판정을 검토하도록 유도하거나,
    // 점검원이 최종 상태를 변경하도록 지원. (일반적으로 사용자가 수동 조절)
  };

  // 음성 메모(STT) 받아쓰기 시뮬레이터
  const handleVoiceSttTrigger = () => {
    setIsRecording(true);
    showToast("🎙️ 현장 작업자 음성 메모 녹음 중...", "warn");

    setTimeout(async () => {
      setIsRecording(false);
      try {
        const res = await apiFetch("/api/facility/repair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "voice_stt",
            rawSpeechText: "500번 사출기 실린더 주위 온도 미세 상승으로 예비 모니터링 요망"
          })
        });
        const data = await res.json();
        if (data.success) {
          setAudioNote(data.correctedText);
          showToast("🎙️ AI STT 변환 및 문맥 정제 성공!", "success");
        }
      } catch (err: any) {
        showToast("음성 인식에 실패했습니다.", "error");
      }
    }, 2500);
  };

  // 체크리스트 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspector.trim()) {
      showToast("정비원(점검자) 이름을 입력해 주세요.", "warn");
      return;
    }
    if (!signature) {
      showToast("점검을 완료하기 위해 수기 서명이 필요합니다.", "warn");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/facility/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId,
          inspector,
          checks: checkItems.reduce((acc, curr) => {
            acc[curr.id] = curr.checked;
            return acc;
          }, {} as Record<string, boolean>),
          signatureData: signature,
          audioUrl: audioNote || null,
          status,
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, status === "FAIL" ? "warn" : "success");
        
        // 제출 후 폼 초기화
        setCheckItems(DEFAULT_CHECK_ITEMS.map(i => ({ ...i, checked: false })));
        setAudioNote("");
        setSignature(null);
        setStatus("PASS");
        fetchHistory(); // 목록 갱신
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(`제출 중 오류: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    equipmentId,
    setEquipmentId,
    inspector,
    setInspector,
    checkItems,
    signature,
    setSignature,
    audioNote,
    setAudioNote,
    status,
    setStatus,
    isSubmitting,
    isRecording,
    toast,
    history,
    isHistoryLoading,
    handleToggleItem,
    handleVoiceSttTrigger,
    handleSubmit,
    fetchHistory,
  };
}
