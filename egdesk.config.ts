/**
 * EGDesk User Data Configuration
 * Generated at: 2026-05-30T04:46:45.744Z
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
    name: 'shared_dashboards',
    displayName: '공유 대시보드 관리',
    rowCount: 2,
    columnCount: 11,
    columns: ['share_id', 'title', 'sql_query', 'table_name', 'display_name', 'chart_spec_json', 'briefing_markdown', 'refresh_interval', 'last_refreshed_at', 'created_at', 'is_active']
  } as TableDefinition,
  table2: {
    name: 'expense_projects',
    displayName: '지출 프로젝트 관리',
    rowCount: 5,
    columnCount: 10,
    columns: ['id', 'name', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table3: {
    name: 'expense_employees',
    displayName: '지출 임직원 관리',
    rowCount: 6,
    columnCount: 3,
    columns: ['id', 'name', 'created_at']
  } as TableDefinition,
  table4: {
    name: 'expense_departments',
    displayName: '지출 부서 관리',
    rowCount: 8,
    columnCount: 3,
    columns: ['id', 'name', 'created_at']
  } as TableDefinition,
  table5: {
    name: 'expense_tags',
    displayName: '지출 태그 관리',
    rowCount: 10,
    columnCount: 3,
    columns: ['id', 'name', 'created_at']
  } as TableDefinition,
  table6: {
    name: 'expense_categories',
    displayName: '지출 계정과목 관리',
    rowCount: 23,
    columnCount: 5,
    columns: ['id', 'main_category', 'mid_category', 'sub_category', 'created_at']
  } as TableDefinition,
  table7: {
    name: 'expense_settings',
    displayName: '지출 예산 설정',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'monthly_budget', 'is_alert_enabled', 'alert_threshold_percent', 'alert_sms_template', 'alert_phone', 'created_at']
  } as TableDefinition,
  table8: {
    name: 'crm_expenses',
    displayName: '지출 내역',
    rowCount: 5,
    columnCount: 23,
    columns: ['id', 'title', 'category', 'amount', 'expense_date', 'payment_method', 'attachment_url', 'ai_analysis', 'memo', 'approval_status', 'approval_memo', 'approved_at', 'actual_expense_date', 'deduction_amount', 'transfer_fee', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table9: {
    name: 'inventory_logs',
    displayName: '재고 변동 이력',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'itemId', 'itemName', 'itemType', 'changeType', 'quantity', 'price', 'operator', 'note', 'createdAt']
  } as TableDefinition,
  table10: {
    name: 'alert_logs',
    displayName: '가격 알림 발송 로그',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'log_id', 'rule_id', 'sent_price', 'sent_message', 'sent_at', 'api_response']
  } as TableDefinition,
  table11: {
    name: 'alert_rules',
    displayName: '가격 알림 규칙',
    rowCount: 1,
    columnCount: 9,
    columns: ['id', 'rule_id', 'item_id', 'rule_name', 'condition_type', 'threshold_value', 'phone_number', 'sms_template', 'is_enabled']
  } as TableDefinition,
  table12: {
    name: 'price_histories',
    displayName: '수집 가격 이력',
    rowCount: 10,
    columnCount: 7,
    columns: ['id', 'history_id', 'url_id', 'captured_price', 'captured_at', 'status', 'error_message']
  } as TableDefinition,
  table13: {
    name: 'target_urls',
    displayName: '가격 감시 URL',
    rowCount: 1,
    columnCount: 10,
    columns: ['id', 'url_id', 'item_id', 'site_name', 'target_url', 'css_selector', 'xpath', 'cron_interval', 'is_active', 'created_at']
  } as TableDefinition,
  table14: {
    name: 'tracked_items',
    displayName: '가격 추적 품목',
    rowCount: 1,
    columnCount: 9,
    columns: ['id', 'item_id', 'item_code', 'item_name', 'category', 'spec', 'base_price', 'target_margin_rate', 'created_at']
  } as TableDefinition,
  table15: {
    name: 'ai_token_usage_logs',
    displayName: 'AI 토큰 사용량 로그',
    rowCount: 4,
    columnCount: 7,
    columns: ['id', 'model', 'purpose', 'prompt_tokens', 'completion_tokens', 'total_tokens', 'created_at']
  } as TableDefinition,
  table16: {
    name: 'inventory_items',
    displayName: '재고 품목',
    rowCount: 0,
    columnCount: 24,
    columns: ['id', 'type', 'name', 'category', 'price', 'partner', 'stock', 'safeStock', 'location', 'spec', 'unitType', 'unitValue', 'boxContains', 'description', 'tags', 'barcode', 'createdAt', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table17: {
    name: 'crm_partner_contacts',
    displayName: '거래처 담당자 명함첩',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'partner_id', 'name', 'position', 'phone', 'email', 'card_image_url', 'is_primary', 'created_at']
  } as TableDefinition,
  table18: {
    name: 'crm_snaptask_actions',
    displayName: '스냅태스크 AI 액션 감사록',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'task_id', 'action_type', 'description', 'created_at']
  } as TableDefinition,
  table19: {
    name: 'crm_snaptask_items',
    displayName: '스냅태스크 상세 내역',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'task_id', 'content_text', 'file_url', 'file_type', 'ai_analysis', 'created_at']
  } as TableDefinition,
  table20: {
    name: 'crm_snaptasks',
    displayName: '스냅태스크 관리',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'title', 'status', 'partner_id', 'created_at', 'updated_at']
  } as TableDefinition,
  table21: {
    name: 'crm_partners',
    displayName: '거래처 관리',
    rowCount: 0,
    columnCount: 22,
    columns: ['id', 'type', 'company_name', 'business_number', 'representative', 'phone', 'manager_name', 'manager_phone', 'email', 'address', 'vip_level', 'credit_limit', 'business_license_url', 'memo', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table22: {
    name: 'crm_sales_orders',
    displayName: '수주서 관리',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'estimate_id', 'customer_name', 'customer_phone', 'status', 'total_amount', 'created_at']
  } as TableDefinition,
  table23: {
    name: 'crm_purchase_orders',
    displayName: '발주서 관리',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'estimate_id', 'vendor_name', 'vendor_phone', 'status', 'total_amount', 'created_at', 'completed_at']
  } as TableDefinition,
  table24: {
    name: 'crm_estimate_items',
    displayName: '견적서 품목 상세',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'estimate_id', 'product_id', 'product_name', 'quantity', 'unit_price', 'amount']
  } as TableDefinition,
  table25: {
    name: 'crm_estimates',
    displayName: '견적서 관리',
    rowCount: 0,
    columnCount: 17,
    columns: ['id', 'type', 'direction_status', 'partner_name', 'partner_phone', 'total_amount', 'file_url', 'business_license_url', 'ai_parsed', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table26: {
    name: 'crm_point_history',
    displayName: '적립금 내역',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'customer_id', 'transaction_type', 'amount', 'balance_after', 'description', 'related_entity_type', 'related_entity_id', 'created_at']
  } as TableDefinition,
  table27: {
    name: 'crm_coupons_restrictions',
    displayName: '쿠폰 제한 관리',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'coupon_id', 'restriction_type', 'target_type', 'target_value', 'created_at']
  } as TableDefinition,
  table28: {
    name: 'coupons',
    displayName: '쿠폰 관리',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'code', 'name', 'discount_type', 'discount_value', 'min_order_amount', 'status', 'expires_at', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table29: {
    name: 'naver_blog_marketing_settings',
    displayName: '네이버 블로그 마케팅 설정',
    rowCount: 1,
    columnCount: 8,
    columns: ['id', 'is_autopilot', 'autopilot_interval', 'autopilot_time', 'tone_style', 'naver_blog_id', 'api_client_id', 'api_client_secret']
  } as TableDefinition,
  table30: {
    name: 'crm_naver_blog_posts',
    displayName: '네이버 블로그 포스팅 이력 및 예약',
    rowCount: 0,
    columnCount: 13,
    columns: ['id', 'product_id', 'status', 'title', 'content', 'target_keywords', 'image_url', 'sub_image_url', 'scheduled_at', 'posted_at', 'error_message', 'views_count', 'likes_count']
  } as TableDefinition,
  table31: {
    name: 'instagram_marketing_settings',
    displayName: '인스타그램 마케팅 설정',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'is_autopilot', 'autopilot_interval', 'autopilot_time', 'tone_style', 'instagram_username', 'access_token']
  } as TableDefinition,
  table32: {
    name: 'crm_instagram_posts',
    displayName: '인스타그램 포스팅 이력 및 예약',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'product_id', 'status', 'content', 'image_url', 'scheduled_at', 'posted_at', 'error_message', 'likes_count', 'comments_count']
  } as TableDefinition,
  table33: {
    name: 'crm_operators',
    displayName: '운영자 권한 관리',
    rowCount: 0,
    columnCount: 13,
    columns: ['id', 'username', 'password_hash', 'name', 'role', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table34: {
    name: 'system_settings',
    displayName: '시스템 설정',
    rowCount: 3,
    columnCount: 3,
    columns: ['id', 'key', 'value']
  } as TableDefinition,
  table35: {
    name: 'crm_deliveries',
    displayName: '배송 내역',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'customer_name', 'customer_phone', 'address', 'courier', 'tracking_number', 'status', 'order_id', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table36: {
    name: 'crm_reservations',
    displayName: '예약 내역',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'customer_name', 'customer_phone', 'service_name', 'reservation_date', 'reservation_time', 'status', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table37: {
    name: 'crm_payments',
    displayName: '결제 내역',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'customer_name', 'payment_method', 'amount', 'payment_date', 'status', 'order_id', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table38: {
    name: 'crm_orders',
    displayName: '주문 내역',
    rowCount: 0,
    columnCount: 20,
    columns: ['id', 'customer_name', 'customer_phone', 'product_name', 'quantity', 'total_price', 'delivery_method', 'shipping_address', 'tracking_number', 'attachment_url', 'customer_memo', 'order_date', 'status', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table39: {
    name: 'crm_transactions',
    displayName: '거래 내역',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'customer_name', 'customer_phone', 'product_name', 'amount', 'order_date', 'status', 'order_id']
  } as TableDefinition,
  table40: {
    name: 'products',
    displayName: '광고 상품',
    rowCount: 0,
    columnCount: 19,
    columns: ['id', 'name', 'price', 'url', 'description', 'main_image_url', 'detail_image_url', 'available_methods', 'category', 'menu_category', 'is_coupon_excludable', 'is_estimate_price', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table41: {
    name: 'ad_templates',
    displayName: '광고 템플릿',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'name', 'header', 'footer', 'opt_out']
  } as TableDefinition,
  table42: {
    name: 'message_logs',
    displayName: '발송 내역',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'customer_id', 'phone', 'message', 'status', 'created_at']
  } as TableDefinition,
  table43: {
    name: 'message_templates',
    displayName: '문자 템플릿',
    rowCount: 0,
    columnCount: 3,
    columns: ['id', 'title', 'content']
  } as TableDefinition,
  table44: {
    name: 'crm_customers',
    displayName: '고객 명단',
    rowCount: 0,
    columnCount: 18,
    columns: ['id', 'name', 'phone', 'tags', 'memo', 'address', 'shipping_address', 'recipient_name', 'recipient_phone', 'point_balance', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table45: {
    name: 'exchange_rate_histories',
    displayName: '환율 변동 이력',
    rowCount: 412,
    columnCount: 5,
    columns: ['id', 'history_id', 'currency_code', 'rate_value', 'captured_date']
  } as TableDefinition,
  table46: {
    name: 'exchange_rates',
    displayName: '실시간 환율',
    rowCount: 4,
    columnCount: 8,
    columns: ['id', 'rate_id', 'currency_code', 'currency_name', 'current_rate', 'change_rate', 'change_direction', 'last_updated_at']
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
  table1: 'shared_dashboards',
  table2: 'expense_projects',
  table3: 'expense_employees',
  table4: 'expense_departments',
  table5: 'expense_tags',
  table6: 'expense_categories',
  table7: 'expense_settings',
  table8: 'crm_expenses',
  table9: 'inventory_logs',
  table10: 'alert_logs',
  table11: 'alert_rules',
  table12: 'price_histories',
  table13: 'target_urls',
  table14: 'tracked_items',
  table15: 'ai_token_usage_logs',
  table16: 'inventory_items',
  table17: 'crm_partner_contacts',
  table18: 'crm_snaptask_actions',
  table19: 'crm_snaptask_items',
  table20: 'crm_snaptasks',
  table21: 'crm_partners',
  table22: 'crm_sales_orders',
  table23: 'crm_purchase_orders',
  table24: 'crm_estimate_items',
  table25: 'crm_estimates',
  table26: 'crm_point_history',
  table27: 'crm_coupons_restrictions',
  table28: 'coupons',
  table29: 'naver_blog_marketing_settings',
  table30: 'crm_naver_blog_posts',
  table31: 'instagram_marketing_settings',
  table32: 'crm_instagram_posts',
  table33: 'crm_operators',
  table34: 'system_settings',
  table35: 'crm_deliveries',
  table36: 'crm_reservations',
  table37: 'crm_payments',
  table38: 'crm_orders',
  table39: 'crm_transactions',
  table40: 'products',
  table41: 'ad_templates',
  table42: 'message_logs',
  table43: 'message_templates',
  table44: 'crm_customers',
  table45: 'exchange_rate_histories',
  table46: 'exchange_rates'
} as const;
