export interface PowerPoint {
  time: string;
  actual: number | null;
  forecast: number;
}

export interface EquipmentEnergy {
  id: string;
  name: string;
  currentPower: number;
  accumulatedEnergy: number;
  estimatedCost: number;
  isOnline: boolean;
}

export interface SavingRecommendation {
  id: string;
  title: string;
  effect: number;
  reason: string;
  targetEqId: string;
  shiftHours: number;
  applied: boolean;
}

export interface EnergyData {
  powerPoints: PowerPoint[];
  equipments: EquipmentEnergy[];
  recommendations: SavingRecommendation[];
  contractPower: number;
  currentPeak: number;
}
