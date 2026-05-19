/**
 * EGDesk User Data Configuration
 * Generated at: 2026-05-19T15:38:26.436Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: 'a67ddc0f-7e2b-4997-9a0b-9667a74c89d0',
} as const;

export interface TableDefinition {
  name: string;
  displayName: string;
  description?: string;
  /** Omitted or unknown until synced / counted */
  rowCount?: number;
  columnCount: number;
  columns: string[];
}

export const TABLES = {
  table1: {
    name: 'crm_operators',
    displayName: '운영자 권한 관리',
    rowCount: 1,
    columnCount: 6,
    columns: ['id', 'username', 'password_hash', 'name', 'role', 'created_at']
  } as TableDefinition,
  table2: {
    name: 'system_settings',
    displayName: '시스템 설정',
    rowCount: 1,
    columnCount: 3,
    columns: ['id', 'key', 'value']
  } as TableDefinition,
  table3: {
    name: 'crm_deliveries',
    displayName: '배송 내역',
    rowCount: 5,
    columnCount: 7,
    columns: ['id', 'customer_name', 'customer_phone', 'address', 'courier', 'tracking_number', 'status']
  } as TableDefinition,
  table4: {
    name: 'crm_reservations',
    displayName: '예약 내역',
    rowCount: 5,
    columnCount: 7,
    columns: ['id', 'customer_name', 'customer_phone', 'service_name', 'reservation_date', 'reservation_time', 'status']
  } as TableDefinition,
  table5: {
    name: 'crm_payments',
    displayName: '결제 내역',
    rowCount: 5,
    columnCount: 6,
    columns: ['id', 'customer_name', 'payment_method', 'amount', 'payment_date', 'status']
  } as TableDefinition,
  table6: {
    name: 'crm_orders',
    displayName: '주문 내역',
    rowCount: 5,
    columnCount: 7,
    columns: ['id', 'customer_name', 'customer_phone', 'product_name', 'quantity', 'order_date', 'status']
  } as TableDefinition,
  table7: {
    name: 'crm_transactions',
    displayName: '거래 내역',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'customer_name', 'customer_phone', 'product_name', 'amount', 'order_date', 'status']
  } as TableDefinition,
  table8: {
    name: 'products',
    displayName: '광고 상품',
    rowCount: 5,
    columnCount: 7,
    columns: ['id', 'name', 'price', 'url', 'description', 'main_image_url', 'detail_image_url']
  } as TableDefinition,
  table9: {
    name: 'ad_templates',
    displayName: '광고 템플릿',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'name', 'header', 'footer', 'opt_out']
  } as TableDefinition,
  table10: {
    name: 'message_logs',
    displayName: '발송 내역',
    rowCount: 5,
    columnCount: 6,
    columns: ['id', 'customer_id', 'phone', 'message', 'status', 'created_at']
  } as TableDefinition,
  table11: {
    name: 'message_templates',
    displayName: '문자 템플릿',
    rowCount: 2,
    columnCount: 3,
    columns: ['id', 'title', 'content']
  } as TableDefinition,
  table12: {
    name: 'crm_customers',
    displayName: '고객 명단',
    rowCount: 5,
    columnCount: 10,
    columns: ['id', 'name', 'phone', 'tags', 'memo', 'address', 'shipping_address', 'recipient_name', 'recipient_phone', 'created_at']
  } as TableDefinition
} as const;


// Main table (first table by default)
export const MAIN_TABLE = TABLES.table1;


// Helper to get table by name
export function getTableByName(tableName: string): TableDefinition | undefined {
  return Object.values(TABLES).find(t => t.name === tableName);
}

// Export table names for easy access
export const TABLE_NAMES = {
  table1: 'crm_operators',
  table2: 'system_settings',
  table3: 'crm_deliveries',
  table4: 'crm_reservations',
  table5: 'crm_payments',
  table6: 'crm_orders',
  table7: 'crm_transactions',
  table8: 'products',
  table9: 'ad_templates',
  table10: 'message_logs',
  table11: 'message_templates',
  table12: 'crm_customers'
} as const;
