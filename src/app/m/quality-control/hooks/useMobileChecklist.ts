import { useState, useCallback } from "react";

export interface MobileCheckItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_CHECK_ITEMS: MobileCheckItem[] = [
  { id: "chk-1", label: "원자재 Lot 바코드 및 입고 수량 매칭 확인", checked: false },
  { id: "chk-2", label: "제품 외관 수축, 함몰, 웰드라인 육안 결함 여부", checked: false },
  { id: "chk-3", label: "버니어 캘리퍼스 측정 치수 합격 기준선 만족 여부", checked: false },
  { id: "chk-4", label: "가열 압력 및 사출 가공 조건 마스터 조건 매칭 여부", checked: false },
  { id: "chk-5", label: "제품 이물 혼입 및 표면 오염 상태 확인", checked: false },
];

export function useMobileChecklist() {
  const [lotNo, setLotNo] = useState("");
  const [inspector, setInspector] = useState("");
  const [checkItems, setCheckItems] = useState<MobileCheckItem[]>(DEFAULT_CHECK_ITEMS);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [status, setStatus] = useState<"PASS" | "FAIL">("PASS");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 바코드 스캔 시뮬레이션
  const handleBarcodeScan = () => {
    const randomLot = `LOT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setLotNo(randomLot);
    showToast(`바코드가 스캔되었습니다: ${randomLot}`, "success");
  };

  // 사진 첨부 시뮬레이션 (Vision AI 조언 포함)
  const handleAttachPhoto = () => {
    // 플레이스홀더 결함 이미지와 모의 결함 판단 제공
    const dummyPhoto = "https://api.placeholder.com/400/300";
    setPhotoUrl(dummyPhoto);
    setStatus("FAIL"); // 모의 이상 검출 시뮬레이션을 위해 FAIL로 임시 유도
    showToast("📸 Vision AI 분석 결과: 표면 수축 함몰 의심 (합격 여부가 FAIL로 자동 지정됨)", "warn");
  };

  // 체크 리스트 토글
  const handleToggleItem = (id: string) => {
    const updated = checkItems.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setCheckItems(updated);
  };

  // 체크리스트 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotNo.trim() || !inspector.trim()) {
      showToast("Lot 번호와 검사원명을 입력해 주세요.", "warn");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quality/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotNo,
          inspector,
          checkItems,
          signatureData: signature,
          photoUrl,
          status,
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, data.alertTriggered ? "warn" : "success");
        // 입력 초기화
        setLotNo("");
        setCheckItems(DEFAULT_CHECK_ITEMS.map(i => ({ ...i, checked: false })));
        setPhotoUrl(null);
        setSignature(null);
        setStatus("PASS");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(`제출 오류: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    lotNo,
    setLotNo,
    inspector,
    setInspector,
    checkItems,
    photoUrl,
    setPhotoUrl,
    signature,
    setSignature,
    status,
    setStatus,
    isSubmitting,
    toast,
    handleBarcodeScan,
    handleAttachPhoto,
    handleToggleItem,
    handleSubmit,
  };
}
