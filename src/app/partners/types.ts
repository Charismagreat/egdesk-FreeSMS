export interface Partner {
  id: string;
  type: 'VENDOR' | 'BUYER' | 'AFFILIATE';
  company_name: string;
  business_number: string;
  representative: string;
  phone: string;
  manager_name: string;
  manager_phone: string;
  email: string;
  address: string;
  vip_level: 'NORMAL' | 'VIP';
  credit_limit: number;
  memo: string;
  created_at: string;
  total_performance?: number;
  pending_count?: number;
}

export interface PartnerForm {
  type: 'VENDOR' | 'BUYER' | 'AFFILIATE';
  company_name: string;
  business_number: string;
  representative: string;
  phone: string;
  manager_name: string;
  manager_phone: string;
  email: string;
  address: string;
  vip_level: 'NORMAL' | 'VIP';
  credit_limit: number;
  memo: string;
}

export interface OcrResult {
  success: boolean;
  status: 'NEW_PARTNER' | 'ALREADY_REGISTERED' | 'UPDATE_PARTNER';
  existingId?: string;
  data: {
    businessNumber?: string;
    companyName?: string;
    representative?: string;
    address?: string;
    phone?: string;
    managerName?: string;
  };
  checksum: {
    isValid: boolean;
    message: string;
  };
  nts: {
    status: 'ACTIVE' | 'CLOSED' | 'SUSPENDED' | 'NOT_FOUND' | 'ERROR';
    statusText: string;
    taxType?: string;
  };
  diff?: {
    companyName: { old: string; new: string; changed: boolean };
    representative: { old: string; new: string; changed: boolean };
    address: { old: string; new: string; changed: boolean };
  };
}

export interface DetailHistory {
  purchaseOrders: any[];
  salesOrders: any[];
}
