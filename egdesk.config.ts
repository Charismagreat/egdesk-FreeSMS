/**
 * EGDesk User Data Configuration
 * Generated at: 2026-06-06T03:36:16.751Z
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
    name: 'ecount_rpa_lock',
    displayName: '이카운트 RPA 실행 락',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'is_locked', 'locked_by', 'locked_at', 'cooldown_until']
  } as TableDefinition,
  table2: {
    name: 'shared_dashboards',
    displayName: '공유 대시보드 관리',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'share_id', 'title', 'sql_query', 'table_name', 'display_name', 'chart_spec_json', 'briefing_markdown', 'refresh_interval', 'last_refreshed_at', 'created_at', 'is_active', 'sort_order', 'is_pinned', 'custom_title']
  } as TableDefinition,
  table3: {
    name: 'expense_projects',
    displayName: '지출 프로젝트 관리',
    rowCount: 5,
    columnCount: 10,
    columns: ['id', 'name', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table4: {
    name: 'expense_employees',
    displayName: '지출 임직원 관리',
    rowCount: 6,
    columnCount: 3,
    columns: ['id', 'name', 'created_at']
  } as TableDefinition,
  table5: {
    name: 'expense_departments',
    displayName: '지출 부서 관리',
    rowCount: 8,
    columnCount: 3,
    columns: ['id', 'name', 'created_at']
  } as TableDefinition,
  table6: {
    name: 'expense_tags',
    displayName: '지출 태그 관리',
    rowCount: 10,
    columnCount: 3,
    columns: ['id', 'name', 'created_at']
  } as TableDefinition,
  table7: {
    name: 'expense_categories',
    displayName: '지출 계정과목 관리',
    rowCount: 65,
    columnCount: 5,
    columns: ['id', 'main_category', 'mid_category', 'sub_category', 'created_at']
  } as TableDefinition,
  table8: {
    name: 'expense_settings',
    displayName: '지출 예산 설정',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'monthly_budget', 'is_alert_enabled', 'alert_threshold_percent', 'alert_sms_template', 'alert_phone', 'created_at']
  } as TableDefinition,
  table9: {
    name: 'crm_expenses',
    displayName: '지출 내역',
    rowCount: 3,
    columnCount: 23,
    columns: ['id', 'title', 'category', 'amount', 'expense_date', 'payment_method', 'attachment_url', 'ai_analysis', 'memo', 'approval_status', 'approval_memo', 'approved_at', 'actual_expense_date', 'deduction_amount', 'transfer_fee', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table10: {
    name: 'inventory_logs',
    displayName: '재고 변동 이력',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'itemId', 'itemName', 'itemType', 'changeType', 'quantity', 'price', 'operator', 'note', 'createdAt']
  } as TableDefinition,
  table11: {
    name: 'alert_logs',
    displayName: '가격 알림 발송 로그',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'log_id', 'rule_id', 'sent_price', 'sent_message', 'sent_at', 'api_response']
  } as TableDefinition,
  table12: {
    name: 'alert_rules',
    displayName: '가격 알림 규칙',
    rowCount: 1,
    columnCount: 9,
    columns: ['id', 'rule_id', 'item_id', 'rule_name', 'condition_type', 'threshold_value', 'phone_number', 'sms_template', 'is_enabled']
  } as TableDefinition,
  table13: {
    name: 'price_histories',
    displayName: '수집 가격 이력',
    rowCount: 10,
    columnCount: 7,
    columns: ['id', 'history_id', 'url_id', 'captured_price', 'captured_at', 'status', 'error_message']
  } as TableDefinition,
  table14: {
    name: 'target_urls',
    displayName: '가격 감시 URL',
    rowCount: 1,
    columnCount: 10,
    columns: ['id', 'url_id', 'item_id', 'site_name', 'target_url', 'css_selector', 'xpath', 'cron_interval', 'is_active', 'created_at']
  } as TableDefinition,
  table15: {
    name: 'tracked_items',
    displayName: '가격 추적 품목',
    rowCount: 1,
    columnCount: 9,
    columns: ['id', 'item_id', 'item_code', 'item_name', 'category', 'spec', 'base_price', 'target_margin_rate', 'created_at']
  } as TableDefinition,
  table16: {
    name: 'ai_token_usage_logs',
    displayName: 'AI 토큰 사용량 로그',
    rowCount: 26,
    columnCount: 7,
    columns: ['id', 'model', 'purpose', 'prompt_tokens', 'completion_tokens', 'total_tokens', 'created_at']
  } as TableDefinition,
  table17: {
    name: 'inventory_items',
    displayName: '재고 품목',
    rowCount: 0,
    columnCount: 24,
    columns: ['id', 'type', 'name', 'category', 'price', 'partner', 'stock', 'safeStock', 'location', 'spec', 'unitType', 'unitValue', 'boxContains', 'description', 'tags', 'barcode', 'createdAt', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table18: {
    name: 'crm_partner_contacts',
    displayName: '거래처 담당자 명함첩',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'partner_id', 'name', 'position', 'phone', 'email', 'card_image_url', 'is_primary', 'created_at']
  } as TableDefinition,
  table19: {
    name: 'crm_snaptask_actions',
    displayName: '스냅태스크 AI 액션 감사록',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'task_id', 'action_type', 'description', 'created_at']
  } as TableDefinition,
  table20: {
    name: 'crm_snaptask_items',
    displayName: '스냅태스크 상세 내역',
    rowCount: 49,
    columnCount: 7,
    columns: ['id', 'task_id', 'content_text', 'file_url', 'file_type', 'ai_analysis', 'created_at']
  } as TableDefinition,
  table21: {
    name: 'crm_snaptasks',
    displayName: '스냅태스크 관리',
    rowCount: 49,
    columnCount: 6,
    columns: ['id', 'title', 'status', 'partner_id', 'created_at', 'updated_at']
  } as TableDefinition,
  table22: {
    name: 'crm_partners',
    displayName: '거래처 관리',
    rowCount: 0,
    columnCount: 22,
    columns: ['id', 'type', 'company_name', 'business_number', 'representative', 'phone', 'manager_name', 'manager_phone', 'email', 'address', 'vip_level', 'credit_limit', 'business_license_url', 'memo', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table23: {
    name: 'crm_sales_orders',
    displayName: '수주서 관리',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'estimate_id', 'customer_name', 'customer_phone', 'status', 'total_amount', 'created_at']
  } as TableDefinition,
  table24: {
    name: 'crm_purchase_orders',
    displayName: '발주서 관리',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'estimate_id', 'vendor_name', 'vendor_phone', 'status', 'total_amount', 'created_at', 'completed_at']
  } as TableDefinition,
  table25: {
    name: 'crm_estimate_items',
    displayName: '견적서 품목 상세',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'estimate_id', 'product_id', 'product_name', 'quantity', 'unit_price', 'amount']
  } as TableDefinition,
  table26: {
    name: 'crm_estimates',
    displayName: '견적서 관리',
    rowCount: 0,
    columnCount: 17,
    columns: ['id', 'type', 'direction_status', 'partner_name', 'partner_phone', 'total_amount', 'file_url', 'business_license_url', 'ai_parsed', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table27: {
    name: 'crm_point_history',
    displayName: '적립금 내역',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'customer_id', 'transaction_type', 'amount', 'balance_after', 'description', 'related_entity_type', 'related_entity_id', 'created_at']
  } as TableDefinition,
  table28: {
    name: 'crm_coupons_restrictions',
    displayName: '쿠폰 제한 관리',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'coupon_id', 'restriction_type', 'target_type', 'target_value', 'created_at']
  } as TableDefinition,
  table29: {
    name: 'coupons',
    displayName: '쿠폰 관리',
    rowCount: 1,
    columnCount: 16,
    columns: ['id', 'code', 'name', 'discount_type', 'discount_value', 'min_order_amount', 'status', 'expires_at', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table30: {
    name: 'naver_blog_marketing_settings',
    displayName: '네이버 블로그 마케팅 설정',
    rowCount: 1,
    columnCount: 8,
    columns: ['id', 'is_autopilot', 'autopilot_interval', 'autopilot_time', 'tone_style', 'naver_blog_id', 'api_client_id', 'api_client_secret']
  } as TableDefinition,
  table31: {
    name: 'crm_naver_blog_posts',
    displayName: '네이버 블로그 포스팅 이력 및 예약',
    rowCount: 0,
    columnCount: 13,
    columns: ['id', 'product_id', 'status', 'title', 'content', 'target_keywords', 'image_url', 'sub_image_url', 'scheduled_at', 'posted_at', 'error_message', 'views_count', 'likes_count']
  } as TableDefinition,
  table32: {
    name: 'instagram_marketing_settings',
    displayName: '인스타그램 마케팅 설정',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'is_autopilot', 'autopilot_interval', 'autopilot_time', 'tone_style', 'instagram_username', 'access_token']
  } as TableDefinition,
  table33: {
    name: 'crm_instagram_posts',
    displayName: '인스타그램 포스팅 이력 및 예약',
    rowCount: 1,
    columnCount: 10,
    columns: ['id', 'product_id', 'status', 'content', 'image_url', 'scheduled_at', 'posted_at', 'error_message', 'likes_count', 'comments_count']
  } as TableDefinition,
  table34: {
    name: 'crm_operators',
    displayName: '운영자 권한 관리',
    rowCount: 5,
    columnCount: 13,
    columns: ['id', 'username', 'password_hash', 'name', 'role', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table35: {
    name: 'system_settings',
    displayName: '시스템 설정',
    rowCount: 7,
    columnCount: 3,
    columns: ['id', 'key', 'value']
  } as TableDefinition,
  table36: {
    name: 'crm_deliveries',
    displayName: '배송 내역',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'customer_name', 'customer_phone', 'address', 'courier', 'tracking_number', 'status', 'order_id', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table37: {
    name: 'crm_reservations',
    displayName: '예약 내역',
    rowCount: 3,
    columnCount: 14,
    columns: ['id', 'customer_name', 'customer_phone', 'service_name', 'reservation_date', 'reservation_time', 'status', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table38: {
    name: 'crm_payments',
    displayName: '결제 내역',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'customer_name', 'payment_method', 'amount', 'payment_date', 'status', 'order_id', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table39: {
    name: 'crm_orders',
    displayName: '주문 내역',
    rowCount: 1,
    columnCount: 20,
    columns: ['id', 'customer_name', 'customer_phone', 'product_name', 'quantity', 'total_price', 'delivery_method', 'shipping_address', 'tracking_number', 'attachment_url', 'customer_memo', 'order_date', 'status', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table40: {
    name: 'crm_transactions',
    displayName: '거래 내역',
    rowCount: 7,
    columnCount: 8,
    columns: ['id', 'customer_name', 'customer_phone', 'product_name', 'amount', 'order_date', 'status', 'order_id']
  } as TableDefinition,
  table41: {
    name: 'products',
    displayName: '광고 상품',
    rowCount: 2,
    columnCount: 19,
    columns: ['id', 'name', 'price', 'url', 'description', 'main_image_url', 'detail_image_url', 'available_methods', 'category', 'menu_category', 'is_coupon_excludable', 'is_estimate_price', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table42: {
    name: 'ad_templates',
    displayName: '광고 템플릿',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'name', 'header', 'footer', 'opt_out']
  } as TableDefinition,
  table43: {
    name: 'message_logs',
    displayName: '발송 내역',
    rowCount: 1,
    columnCount: 6,
    columns: ['id', 'customer_id', 'phone', 'message', 'status', 'created_at']
  } as TableDefinition,
  table44: {
    name: 'message_templates',
    displayName: '문자 템플릿',
    rowCount: 0,
    columnCount: 3,
    columns: ['id', 'title', 'content']
  } as TableDefinition,
  table45: {
    name: 'crm_customers',
    displayName: '고객 명단',
    rowCount: 3,
    columnCount: 18,
    columns: ['id', 'name', 'phone', 'tags', 'memo', 'address', 'shipping_address', 'recipient_name', 'recipient_phone', 'point_balance', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table46: {
    name: 'ecount_sync_schedules',
    displayName: '이카운트 ERP 동기화 스케줄',
    description: '이카운트 RPA 스크립트 백그라운드 자동 동기화 일정 저장소',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'script_file', 'script_title', 'target_table', 'period_preset', 'run_time', 'is_active', 'last_run_at', 'next_run_at', 'created_at']
  } as TableDefinition,
  table47: {
    name: 'crm_company_event_types',
    displayName: '회사 일정 유형 마스터 대장',
    rowCount: 6,
    columnCount: 7,
    columns: ['id', 'type_key', 'type_name', 'color_theme', 'is_system', 'created_at', 'updated_at']
  } as TableDefinition,
  table48: {
    name: 'crm_operator_ai_briefing_histories',
    displayName: '임직원 AI 전사 업무 분석 이력 대장',
    rowCount: 3,
    columnCount: 10,
    columns: ['id', 'target_year_month', 'risk_score', 'alert_title', 'alert_message', 'briefing_text', 'created_at', 'created_by', 'token_usage_input', 'token_usage_output']
  } as TableDefinition,
  table49: {
    name: 'crm_operator_projects',
    displayName: '임직원 참여 프로젝트 대장',
    rowCount: 4,
    columnCount: 10,
    columns: ['id', 'operator_id', 'project_name', 'role_in_project', 'start_date', 'end_date', 'contribution_rate', 'performance_score', 'performance_evaluation', 'outcome_link']
  } as TableDefinition,
  table50: {
    name: 'crm_operator_job_history',
    displayName: '임직원 담당업무 변경이력 대장',
    rowCount: 4,
    columnCount: 6,
    columns: ['id', 'operator_id', 'assignment_date', 'job_description', 'prev_job_description', 'is_current']
  } as TableDefinition,
  table51: {
    name: 'crm_operator_families',
    displayName: '임직원 부양가족 대장',
    rowCount: 4,
    columnCount: 8,
    columns: ['id', 'operator_id', 'relation_type', 'name', 'birth_date', 'phone_number', 'is_dependent', 'remarks']
  } as TableDefinition,
  table52: {
    name: 'crm_operator_reputations',
    displayName: '임직원 다차원 평판 대장',
    rowCount: 5,
    columnCount: 9,
    columns: ['id', 'operator_id', 'evaluation_date', 'evaluator_id', 'source_type', 'score', 'positive_feedback', 'constructive_feedback', 'updated_at']
  } as TableDefinition,
  table53: {
    name: 'crm_operator_incidents',
    displayName: '임직원 대내외 사건사고 대장',
    rowCount: 2,
    columnCount: 9,
    columns: ['id', 'operator_id', 'occurred_date', 'severity', 'title', 'description', 'status', 'outcome', 'updated_at']
  } as TableDefinition,
  table54: {
    name: 'crm_operator_medical',
    displayName: '임직원 병력 치료 대장',
    rowCount: 1,
    columnCount: 8,
    columns: ['id', 'operator_id', 'diagnosis_name', 'treatment_start_date', 'treatment_end_date', 'hospital_name', 'sick_leave_days', 'work_limitations']
  } as TableDefinition,
  table55: {
    name: 'crm_operator_family_events',
    displayName: '임직원 경조사 지원 대장',
    rowCount: 2,
    columnCount: 7,
    columns: ['id', 'operator_id', 'event_date', 'relation', 'type', 'congratulation_money', 'wreath_provided']
  } as TableDefinition,
  table56: {
    name: 'crm_operator_awards',
    displayName: '임직원 상벌 징계 대장',
    rowCount: 2,
    columnCount: 8,
    columns: ['id', 'operator_id', 'record_date', 'type', 'title', 'content', 'authority', 'remarks']
  } as TableDefinition,
  table57: {
    name: 'crm_operator_promotions',
    displayName: '임직원 승진발령 대장',
    rowCount: 2,
    columnCount: 8,
    columns: ['id', 'operator_id', 'change_date', 'prev_dept', 'next_dept', 'prev_role', 'next_role', 'promotion_reason']
  } as TableDefinition,
  table58: {
    name: 'crm_operator_salaries',
    displayName: '임직원 급여상여 이력 대장',
    rowCount: 6,
    columnCount: 12,
    columns: ['id', 'operator_id', 'payment_year_month', 'base_salary', 'bonus_amount', 'weekly_holiday_allowance', 'overtime_allowance', 'meal_allowance', 'deduction_amount', 'net_salary', 'payment_date', 'status']
  } as TableDefinition,
  table59: {
    name: 'crm_operator_careers',
    displayName: '임직원 이전경력 대장',
    rowCount: 3,
    columnCount: 9,
    columns: ['id', 'operator_id', 'company_name', 'department', 'job_title', 'join_date', 'retire_date', 'assigned_task', 'leaving_reason']
  } as TableDefinition,
  table60: {
    name: 'crm_operator_licenses',
    displayName: '임직원 자격면허 대장',
    rowCount: 6,
    columnCount: 7,
    columns: ['id', 'operator_id', 'license_name', 'issuer', 'license_no', 'acquisition_date', 'expiry_date']
  } as TableDefinition,
  table61: {
    name: 'crm_operator_education',
    displayName: '임직원 학력이력 대장',
    rowCount: 1,
    columnCount: 8,
    columns: ['id', 'operator_id', 'school_name', 'major', 'degree', 'entrance_date', 'graduation_date', 'status']
  } as TableDefinition,
  table62: {
    name: 'crm_operator_profiles',
    displayName: '임직원 인적사항 상세 대장',
    rowCount: 4,
    columnCount: 8,
    columns: ['id', 'operator_id', 'department', 'hire_date', 'commute_area', 'skills', 'backup_operator_id', 'updated_at']
  } as TableDefinition,
  table63: {
    name: 'crm_operator_contract_settings',
    displayName: '임직원 근로 계약 조건 대장',
    rowCount: 4,
    columnCount: 8,
    columns: ['id', 'operator_id', 'hourly_wage', 'weekly_hours', 'allow_weekly_holiday_paid', 'work_days', 'contract_memo', 'updated_at']
  } as TableDefinition,
  table64: {
    name: 'crm_company_events',
    displayName: '전사 회사 일정 공유 대장',
    rowCount: 3,
    columnCount: 8,
    columns: ['id', 'title', 'start_date', 'end_date', 'event_type', 'description', 'created_by', 'created_at']
  } as TableDefinition,
  table65: {
    name: 'crm_operator_leave_balances',
    displayName: '직원별 연차 잔액 관리',
    rowCount: 4,
    columnCount: 6,
    columns: ['id', 'operator_id', 'total_allowed', 'used', 'remaining', 'updated_at']
  } as TableDefinition,
  table66: {
    name: 'crm_annual_leaves',
    displayName: '직원 연차 신청 결재 대장',
    rowCount: 0,
    columnCount: 12,
    columns: ['id', 'operator_id', 'leave_type', 'start_date', 'end_date', 'days_spent', 'status', 'reason', 'reject_reason', 'approver_id', 'created_at', 'updated_at']
  } as TableDefinition,
  table67: {
    name: 'crm_attendance',
    displayName: '직원 근태 대장',
    rowCount: 4,
    columnCount: 10,
    columns: ['id', 'operator_id', 'work_date', 'clock_in', 'clock_out', 'status', 'working_hours', 'memo', 'created_at', 'updated_at']
  } as TableDefinition,
  table68: {
    name: 'user_feedbacks',
    displayName: '사용자 피드백 및 버그 제보',
    rowCount: 13,
    columnCount: 6,
    columns: ['id', 'user_prompt', 'detected_type', 'current_url', 'resolved_status', 'created_at']
  } as TableDefinition,
  table69: {
    name: 'system_menu_settings',
    displayName: '시스템 메뉴 설정',
    rowCount: 28,
    columnCount: 4,
    columns: ['id', 'menu_href', 'is_enabled', 'sort_order']
  } as TableDefinition,
  table70: {
    name: 'tenant_menu_settings',
    displayName: '테넌트 메뉴 설정',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'tenant_id', 'menu_href', 'is_enabled', 'sort_order']
  } as TableDefinition,
  table71: {
    name: 'exchange_rate_histories',
    displayName: '환율 변동 이력',
    rowCount: 416,
    columnCount: 5,
    columns: ['id', 'history_id', 'currency_code', 'rate_value', 'captured_date']
  } as TableDefinition,
  table72: {
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
  table1: 'ecount_rpa_lock',
  table2: 'shared_dashboards',
  table3: 'expense_projects',
  table4: 'expense_employees',
  table5: 'expense_departments',
  table6: 'expense_tags',
  table7: 'expense_categories',
  table8: 'expense_settings',
  table9: 'crm_expenses',
  table10: 'inventory_logs',
  table11: 'alert_logs',
  table12: 'alert_rules',
  table13: 'price_histories',
  table14: 'target_urls',
  table15: 'tracked_items',
  table16: 'ai_token_usage_logs',
  table17: 'inventory_items',
  table18: 'crm_partner_contacts',
  table19: 'crm_snaptask_actions',
  table20: 'crm_snaptask_items',
  table21: 'crm_snaptasks',
  table22: 'crm_partners',
  table23: 'crm_sales_orders',
  table24: 'crm_purchase_orders',
  table25: 'crm_estimate_items',
  table26: 'crm_estimates',
  table27: 'crm_point_history',
  table28: 'crm_coupons_restrictions',
  table29: 'coupons',
  table30: 'naver_blog_marketing_settings',
  table31: 'crm_naver_blog_posts',
  table32: 'instagram_marketing_settings',
  table33: 'crm_instagram_posts',
  table34: 'crm_operators',
  table35: 'system_settings',
  table36: 'crm_deliveries',
  table37: 'crm_reservations',
  table38: 'crm_payments',
  table39: 'crm_orders',
  table40: 'crm_transactions',
  table41: 'products',
  table42: 'ad_templates',
  table43: 'message_logs',
  table44: 'message_templates',
  table45: 'crm_customers',
  table46: 'ecount_sync_schedules',
  table47: 'crm_company_event_types',
  table48: 'crm_operator_ai_briefing_histories',
  table49: 'crm_operator_projects',
  table50: 'crm_operator_job_history',
  table51: 'crm_operator_families',
  table52: 'crm_operator_reputations',
  table53: 'crm_operator_incidents',
  table54: 'crm_operator_medical',
  table55: 'crm_operator_family_events',
  table56: 'crm_operator_awards',
  table57: 'crm_operator_promotions',
  table58: 'crm_operator_salaries',
  table59: 'crm_operator_careers',
  table60: 'crm_operator_licenses',
  table61: 'crm_operator_education',
  table62: 'crm_operator_profiles',
  table63: 'crm_operator_contract_settings',
  table64: 'crm_company_events',
  table65: 'crm_operator_leave_balances',
  table66: 'crm_annual_leaves',
  table67: 'crm_attendance',
  table68: 'user_feedbacks',
  table69: 'system_menu_settings',
  table70: 'tenant_menu_settings',
  table71: 'exchange_rate_histories',
  table72: 'exchange_rates'
} as const;
