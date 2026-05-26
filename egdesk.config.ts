/**
 * EGDesk User Data Configuration
 * Generated at: 2026-05-26T00:28:55.790Z
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
    name: 'inventory_logs',
    displayName: '재고 변동 이력',
    rowCount: 1,
    columnCount: 10,
    columns: ['id', 'itemId', 'itemName', 'itemType', 'changeType', 'quantity', 'price', 'operator', 'note', 'createdAt']
  } as TableDefinition,
  table2: {
    name: 'inventory_items',
    displayName: '재고 품목',
    rowCount: 0,
    columnCount: 11,
    columns: ['id', 'type', 'name', 'category', 'price', 'partner', 'stock', 'safeStock', 'location', 'description', 'createdAt']
  } as TableDefinition,
  table3: {
    name: 'crm_partner_contacts',
    displayName: '거래처 담당자 명함첩',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'partner_id', 'name', 'position', 'phone', 'email', 'card_image_url', 'is_primary', 'created_at']
  } as TableDefinition,
  table4: {
    name: 'crm_snaptask_actions',
    displayName: '스냅태스크 AI 액션 감사록',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'task_id', 'action_type', 'description', 'created_at']
  } as TableDefinition,
  table5: {
    name: 'crm_snaptask_items',
    displayName: '스냅태스크 상세 내역',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'task_id', 'content_text', 'file_url', 'file_type', 'ai_analysis', 'created_at']
  } as TableDefinition,
  table6: {
    name: 'crm_snaptasks',
    displayName: '스냅태스크 관리',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'title', 'status', 'partner_id', 'created_at', 'updated_at']
  } as TableDefinition,
  table7: {
    name: 'crm_partners',
    displayName: '거래처 관리',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'type', 'company_name', 'business_number', 'representative', 'phone', 'manager_name', 'manager_phone', 'email', 'address', 'vip_level', 'credit_limit', 'business_license_url', 'memo', 'created_at']
  } as TableDefinition,
  table8: {
    name: 'crm_sales_orders',
    displayName: '수주서 관리',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'estimate_id', 'customer_name', 'customer_phone', 'status', 'total_amount', 'created_at']
  } as TableDefinition,
  table9: {
    name: 'crm_purchase_orders',
    displayName: '발주서 관리',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'estimate_id', 'vendor_name', 'vendor_phone', 'status', 'total_amount', 'created_at', 'completed_at']
  } as TableDefinition,
  table10: {
    name: 'crm_estimate_items',
    displayName: '견적서 품목 상세',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'estimate_id', 'product_id', 'product_name', 'quantity', 'unit_price', 'amount']
  } as TableDefinition,
  table11: {
    name: 'crm_estimates',
    displayName: '견적서 관리',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'type', 'direction_status', 'partner_name', 'partner_phone', 'total_amount', 'file_url', 'business_license_url', 'ai_parsed', 'created_at']
  } as TableDefinition,
  table12: {
    name: 'crm_point_history',
    displayName: '적립금 내역',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'customer_id', 'transaction_type', 'amount', 'balance_after', 'description', 'related_entity_type', 'related_entity_id', 'created_at']
  } as TableDefinition,
  table13: {
    name: 'crm_coupons_restrictions',
    displayName: '쿠폰 제한 관리',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'coupon_id', 'restriction_type', 'target_type', 'target_value', 'created_at']
  } as TableDefinition,
  table14: {
    name: 'coupons',
    displayName: '쿠폰 관리',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'code', 'name', 'discount_type', 'discount_value', 'min_order_amount', 'status', 'expires_at', 'created_at']
  } as TableDefinition,
  table15: {
    name: 'naver_blog_marketing_settings',
    displayName: '네이버 블로그 마케팅 설정',
    rowCount: 1,
    columnCount: 8,
    columns: ['id', 'is_autopilot', 'autopilot_interval', 'autopilot_time', 'tone_style', 'naver_blog_id', 'api_client_id', 'api_client_secret']
  } as TableDefinition,
  table16: {
    name: 'crm_naver_blog_posts',
    displayName: '네이버 블로그 포스팅 이력 및 예약',
    rowCount: 0,
    columnCount: 13,
    columns: ['id', 'product_id', 'status', 'title', 'content', 'target_keywords', 'image_url', 'sub_image_url', 'scheduled_at', 'posted_at', 'error_message', 'views_count', 'likes_count']
  } as TableDefinition,
  table17: {
    name: 'instagram_marketing_settings',
    displayName: '인스타그램 마케팅 설정',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'is_autopilot', 'autopilot_interval', 'autopilot_time', 'tone_style', 'instagram_username', 'access_token']
  } as TableDefinition,
  table18: {
    name: 'crm_instagram_posts',
    displayName: '인스타그램 포스팅 이력 및 예약',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'product_id', 'status', 'content', 'image_url', 'scheduled_at', 'posted_at', 'error_message', 'likes_count', 'comments_count']
  } as TableDefinition,
  table19: {
    name: 'crm_operators',
    displayName: '운영자 권한 관리',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'username', 'password_hash', 'name', 'role', 'created_at']
  } as TableDefinition,
  table20: {
    name: 'system_settings',
    displayName: '시스템 설정',
    rowCount: 1,
    columnCount: 3,
    columns: ['id', 'key', 'value']
  } as TableDefinition,
  table21: {
    name: 'crm_deliveries',
    displayName: '배송 내역',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'customer_name', 'customer_phone', 'address', 'courier', 'tracking_number', 'status', 'order_id']
  } as TableDefinition,
  table22: {
    name: 'crm_reservations',
    displayName: '예약 내역',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'customer_name', 'customer_phone', 'service_name', 'reservation_date', 'reservation_time', 'status']
  } as TableDefinition,
  table23: {
    name: 'crm_payments',
    displayName: '결제 내역',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'customer_name', 'payment_method', 'amount', 'payment_date', 'status', 'order_id']
  } as TableDefinition,
  table24: {
    name: 'crm_orders',
    displayName: '주문 내역',
    rowCount: 0,
    columnCount: 13,
    columns: ['id', 'customer_name', 'customer_phone', 'product_name', 'quantity', 'total_price', 'delivery_method', 'shipping_address', 'tracking_number', 'attachment_url', 'customer_memo', 'order_date', 'status']
  } as TableDefinition,
  table25: {
    name: 'crm_transactions',
    displayName: '거래 내역',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'customer_name', 'customer_phone', 'product_name', 'amount', 'order_date', 'status', 'order_id']
  } as TableDefinition,
  table26: {
    name: 'products',
    displayName: '광고 상품',
    rowCount: 0,
    columnCount: 12,
    columns: ['id', 'name', 'price', 'url', 'description', 'main_image_url', 'detail_image_url', 'available_methods', 'category', 'menu_category', 'is_coupon_excludable', 'is_estimate_price']
  } as TableDefinition,
  table27: {
    name: 'ad_templates',
    displayName: '광고 템플릿',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'name', 'header', 'footer', 'opt_out']
  } as TableDefinition,
  table28: {
    name: 'message_logs',
    displayName: '발송 내역',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'customer_id', 'phone', 'message', 'status', 'created_at']
  } as TableDefinition,
  table29: {
    name: 'message_templates',
    displayName: '문자 템플릿',
    rowCount: 0,
    columnCount: 3,
    columns: ['id', 'title', 'content']
  } as TableDefinition,
  table30: {
    name: 'crm_customers',
    displayName: '고객 명단',
    rowCount: 0,
    columnCount: 11,
    columns: ['id', 'name', 'phone', 'tags', 'memo', 'address', 'shipping_address', 'recipient_name', 'recipient_phone', 'point_balance', 'created_at']
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
  table1: 'inventory_logs',
  table2: 'inventory_items',
  table3: 'crm_partner_contacts',
  table4: 'crm_snaptask_actions',
  table5: 'crm_snaptask_items',
  table6: 'crm_snaptasks',
  table7: 'crm_partners',
  table8: 'crm_sales_orders',
  table9: 'crm_purchase_orders',
  table10: 'crm_estimate_items',
  table11: 'crm_estimates',
  table12: 'crm_point_history',
  table13: 'crm_coupons_restrictions',
  table14: 'coupons',
  table15: 'naver_blog_marketing_settings',
  table16: 'crm_naver_blog_posts',
  table17: 'instagram_marketing_settings',
  table18: 'crm_instagram_posts',
  table19: 'crm_operators',
  table20: 'system_settings',
  table21: 'crm_deliveries',
  table22: 'crm_reservations',
  table23: 'crm_payments',
  table24: 'crm_orders',
  table25: 'crm_transactions',
  table26: 'products',
  table27: 'ad_templates',
  table28: 'message_logs',
  table29: 'message_templates',
  table30: 'crm_customers'
} as const;
