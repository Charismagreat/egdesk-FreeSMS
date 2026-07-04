import { apiFetch } from '@/lib/api';
import { useState, useEffect, useCallback } from "react";
import {
  VisionLog,
  VisionModelStatus,
  SpcSample,
  SpcPrediction,
  SpcConfig,
  FeatureImportance,
  SensorStatus,
  SensorContribution,
  SensorTimelineItem,
  NcrItem,
  SimilarCase,
} from "../types";

export function useQualityControl() {
  // --- 공통 상태 ---
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  // --- 1. Vision AI 상태 ---
  const [visionModel, setVisionModel] = useState<VisionModelStatus | null>(null);
  const [visionLogs, setVisionLogs] = useState<VisionLog[]>([]);
  const [isRetraining, setIsRetraining] = useState(false);

  // --- 2. SPC & Cpk 상태 ---
  const [spcConfig, setSpcConfig] = useState<SpcConfig | null>(null);
  const [spcSamples, setSpcSamples] = useState<SpcSample[]>([]);
  const [spcPredictions, setSpcPredictions] = useState<SpcPrediction[]>([]);
  const [currentCpk, setCurrentCpk] = useState(1.15);
  const [cpkStatus, setCpkStatus] = useState("WARNING");
  const [futureRisk, setFutureRisk] = useState(0);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);

  // --- 3. 설비 센서 상태 ---
  const [sensorStatus, setSensorStatus] = useState<SensorStatus | null>(null);
  const [sensorContributions, setSensorContributions] = useState<SensorContribution[]>([]);
  const [sensorTimeline, setSensorTimeline] = useState<SensorTimelineItem[]>([]);

  // --- 4. NCR & CAPA 상태 ---
  const [ncrList, setNcrList] = useState<NcrItem[]>([]);
  const [similarCases, setSimilarCases] = useState<SimilarCase[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNcr, setSelectedNcr] = useState<NcrItem | null>(null);
  const [actionDescription, setActionDescription] = useState("");
  const [isNcrSaving, setIsNcrSaving] = useState(false);

  // 토스트 도우미
  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // --- 데이터 불러오기 함수 ---
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Vision API
      const visionRes = await apiFetch("/api/quality/vision");
      const visionData = await visionRes.json();
      if (visionData.success) {
        setVisionModel(visionData.modelStatus);
        setVisionLogs(visionData.logs);
      }

      // 2. SPC API
      const spcRes = await apiFetch("/api/quality/spc");
      const spcData = await spcRes.json();
      if (spcData.success) {
        setSpcConfig(spcData.spcConfig);
        setSpcSamples(spcData.samples);
        setSpcPredictions(spcData.predictions);
        setCurrentCpk(spcData.currentCpk);
        setCpkStatus(spcData.cpkStatus);
        setFutureRisk(spcData.futureRiskProbability);
        setFeatureImportance(spcData.featureImportance);
      }

      // 3. Sensors API
      const sensorRes = await apiFetch("/api/quality/sensors");
      const sensorData = await sensorRes.json();
      if (sensorData.success) {
        setSensorStatus(sensorData.sensorStatus);
        setSensorContributions(sensorData.sensorContributions);
        setSensorTimeline(sensorData.timeline);
      }

      // 4. NCR API
      const ncrRes = await apiFetch(`/api/quality/ncr?query=${searchQuery}`);
      const ncrData = await ncrRes.json();
      if (ncrData.success) {
        setNcrList(ncrData.ncrList);
        setSimilarCases(ncrData.similarCases);
      }
    } catch (e) {
      console.error("품질관리 데이터를 로드하는 도중 오류가 발생했습니다.", e);
      showToast("데이터 로딩 실패", "error");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, showToast]);

  useEffect(() => {
    fetchAllData();
  }, [searchQuery]);

  // --- 비전 모델 노코드 재학습 트리거 ---
  const handleRetrainModel = async (newSamplesCount: number) => {
    setIsRetraining(true);
    try {
      const res = await apiFetch("/api/quality/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retrain", newGoldenSamples: newSamplesCount })
      });
      const data = await res.json();
      if (data.success) {
        setVisionModel(data.modelStatus);
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(`재학습 실패: ${err.message}`, "error");
    } finally {
      setIsRetraining(false);
    }
  };

  // --- 비전 이상 점수 임계값 업데이트 ---
  const handleUpdateThreshold = async (threshold: number) => {
    try {
      const res = await apiFetch("/api/quality/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_threshold", threshold })
      });
      const data = await res.json();
      if (data.success) {
        if (visionModel) {
          setVisionModel({ ...visionModel, anomalyThreshold: threshold });
        }
        showToast(data.message, "success");
      }
    } catch (err: any) {
      showToast(`설정 변경 실패: ${err.message}`, "error");
    }
  };

  // --- NCR CAPA 조치 기록 저장 ---
  const handleSaveCapaAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNcr || !actionDescription.trim()) return;

    setIsNcrSaving(true);
    try {
      const res = await apiFetch("/api/quality/ncr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedNcr.id,
          status: "COMPLETED",
          actionPlan: actionDescription
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setSelectedNcr(null);
        setActionDescription("");
        fetchAllData(); // 갱신
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(`저장 실패: ${err.message}`, "error");
    } finally {
      setIsNcrSaving(false);
    }
  };

  return {
    isLoading,
    toast,
    visionModel,
    visionLogs,
    isRetraining,
    spcConfig,
    spcSamples,
    spcPredictions,
    currentCpk,
    cpkStatus,
    futureRisk,
    featureImportance,
    sensorStatus,
    sensorContributions,
    sensorTimeline,
    ncrList,
    similarCases,
    searchQuery,
    setSearchQuery,
    selectedNcr,
    setSelectedNcr,
    actionDescription,
    setActionDescription,
    isNcrSaving,
    handleRetrainModel,
    handleUpdateThreshold,
    handleSaveCapaAction,
    fetchAllData,
  };
}
