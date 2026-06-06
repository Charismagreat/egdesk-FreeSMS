export interface Coordinate {
  x: number;
  y: number;
}

export interface ShipmentRoute {
  fromName: string;
  toName: string;
  from: Coordinate;
  current: Coordinate;
  to: Coordinate;
}

export interface ScmShipment {
  id: string;
  supplierId: string;
  supplierName: string;
  item: string;
  status: "SHIPPED" | "CUSTOMS" | "DOMESTIC" | "ARRIVED";
  eta: string;
  delayProbability: number;
  risk: "SAFE" | "WARNING" | "CRITICAL";
  route: ShipmentRoute;
}

export interface ScmSupplier {
  id: string;
  name: string;
  rating: number;
  deliveryRate: number;
  defectRate: number;
  priceDiff: number;
}

export interface ScmAlternative {
  id: string;
  name: string;
  price: number;
  leadTime: number;
  rating: number;
  reason: string;
}

export interface ScmData {
  shipments: ScmShipment[];
  suppliers: ScmSupplier[];
  alternatives: Record<string, ScmAlternative[]>;
}
