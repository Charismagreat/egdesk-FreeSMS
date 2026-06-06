export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color: string;
  isArea?: boolean;
}

export interface CctvInfo {
  id: string;
  name: string;
  status: "NORMAL" | "WARNING" | "EMERGENCY_STOP";
  boundingBoxes: BoundingBox[];
}

export interface DangerLog {
  id: string;
  time: string;
  location: string;
  title: string;
  level: "WARNING" | "CRITICAL";
  status: "DETECTED" | "SIREN_PLAYED" | "RESOLVED";
  operator: string;
}

export interface HotspotInfo {
  zoneId: string;
  zoneName: string;
  dangerScore: number;
}

export interface SafetyDetectionData {
  cctvs: CctvInfo[];
  dangerLogs: DangerLog[];
  hotspots: HotspotInfo[];
}
