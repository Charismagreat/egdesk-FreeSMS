/**
 * EGDesk User Data Configuration
 * Generated at: 2026-06-24T13:13:59.983Z
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
    name: 'rnd_compliance_alarms',
    displayName: '규제 준수 모니터링 및 알림',
    rowCount: 1,
    columnCount: 17,
    columns: ['id', 'alarm_id', 'center_id', 'category', 'severity', 'message', 'due_date', 'is_resolved', 'resolved_at', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table2: {
    name: 'rnd_logs',
    displayName: 'R&D 연구개발 일지 및 AI 생성 데이터',
    rowCount: 2,
    columnCount: 22,
    columns: ['id', 'log_id', 'center_id', 'author_id', 'work_date', 'raw_source', 'raw_content', 'audio_file_url', 'ai_generated_title', 'ai_generated_content', 'approval_status', 'approver_id', 'approved_at', 'blockchain_hash', 'created_at', 'updated_at', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table3: {
    name: 'rnd_spaces',
    displayName: '연구 공간 자가 실사 및 Vision AI 분석 이력',
    rowCount: 1,
    columnCount: 19,
    columns: ['id', 'space_check_id', 'center_id', 'check_date', 'image_url_entrance', 'image_url_layout', 'ai_analysis_result', 'signage_status', 'partition_status', 'overall_status', 'inspector_notes', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table4: {
    name: 'rnd_staffs',
    displayName: '연구원 정보 및 자격 정보',
    rowCount: 4,
    columnCount: 20,
    columns: ['id', 'staff_id', 'center_id', 'user_id', 'staff_role', 'employment_status', 'degree_level', 'major_name', 'major_category', 'graduation_cert_ocr_json', 'qualification_status', 'joined_date', 'resigned_date', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table5: {
    name: 'rnd_centers',
    displayName: '기업부설연구소 기본 정보',
    rowCount: 1,
    columnCount: 19,
    columns: ['id', 'center_id', 'company_id', 'center_name', 'center_type', 'established_date', 'koita_reg_number', 'postal_code', 'address_road', 'address_detail', 'total_area_sqm', 'is_active', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table6: {
    name: 'crm_facility_predictive_part_rul',
    displayName: '설비 부품 수명 RUL',
    rowCount: 3,
    columnCount: 13,
    columns: ['id', 'equipmentId', 'partName', 'rulDays', 'status', 'percent', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table7: {
    name: 'crm_facility_predictive_fft',
    displayName: '설비 주파수 분석',
    rowCount: 4,
    columnCount: 12,
    columns: ['id', 'equipmentId', 'frequency', 'amplitude', 'label', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table8: {
    name: 'crm_facility_predictive_vibration',
    displayName: '설비 진동 센서 이력',
    rowCount: 6,
    columnCount: 11,
    columns: ['id', 'equipmentId', 'time', 'value', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table9: {
    name: 'crm_facility_predictive_summary',
    displayName: '설비 건전도 요약',
    rowCount: 1,
    columnCount: 12,
    columns: ['id', 'equipmentId', 'equipmentName', 'healthScore', 'vibrationRms', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table10: {
    name: 'crm_facility_repair_solutions',
    displayName: '설비 고장 해결 가이드',
    rowCount: 2,
    columnCount: 13,
    columns: ['id', 'errorCode', 'rootCause', 'actions', 'similarHistory', 'warehouse', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table11: {
    name: 'crm_facility_repair_logs',
    displayName: '설비 수리 이력 대장',
    rowCount: 1,
    columnCount: 16,
    columns: ['id', 'date', 'equipmentId', 'equipmentName', 'errorCode', 'symptom', 'repairDesc', 'mechanic', 'cost', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table12: {
    name: 'crm_facility_checklists',
    displayName: '설비 예방 점검 이력',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'equipmentId', 'inspector', 'checks', 'signatureData', 'audioUrl', 'status', 'checkedAt', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table13: {
    name: 'crm_facilities',
    displayName: '설비 대장 관리',
    rowCount: 2,
    columnCount: 19,
    columns: ['id', 'name', 'manufacturer', 'model_name', 'serial_number', 'manufacture_year', 'specifications', 'location', 'status', 'health_score', 'vibration_rms', 'created_at', 'updated_at', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table14: {
    name: 'crm_quality_vision_logs',
    displayName: '품질 비전 판정 이력',
    rowCount: 3,
    columnCount: 15,
    columns: ['id', 'timestamp', 'itemName', 'anomalyScore', 'status', 'defectType', 'imageUrl', 'isReviewed', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table15: {
    name: 'crm_quality_vision_model',
    displayName: '품질 비전 AI 모델 상태',
    rowCount: 1,
    columnCount: 12,
    columns: ['id', 'activeModel', 'goldenSamplesCount', 'lastTrainedAt', 'anomalyThreshold', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table16: {
    name: 'crm_quality_spc_features',
    displayName: 'SPC 요인 중요도',
    rowCount: 4,
    columnCount: 11,
    columns: ['id', 'name', 'value', 'color', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table17: {
    name: 'crm_quality_spc_predictions',
    displayName: 'SPC 계측 예측',
    rowCount: 0,
    columnCount: 13,
    columns: ['id', 'batch', 'value', 'cpk', 'timestamp', 'risk', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table18: {
    name: 'crm_quality_spc_samples',
    displayName: 'SPC 계측 샘플',
    rowCount: 6,
    columnCount: 12,
    columns: ['id', 'batch', 'value', 'cpk', 'timestamp', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table19: {
    name: 'crm_quality_spc_config',
    displayName: 'SPC 공정 제어 설정',
    rowCount: 1,
    columnCount: 16,
    columns: ['id', 'targetValue', 'ucl', 'lcl', 'usl', 'lsl', 'currentCpk', 'cpkStatus', 'futureRiskProbability', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table20: {
    name: 'crm_quality_sensors_timeline',
    displayName: '센서 시계열',
    rowCount: 3,
    columnCount: 13,
    columns: ['id', 'time', 'vibration', 'current', 'temperature', 'anomalyScore', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table21: {
    name: 'crm_quality_sensors_contribution',
    displayName: '센서 기여도',
    rowCount: 3,
    columnCount: 10,
    columns: ['id', 'name', 'rate', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table22: {
    name: 'crm_quality_sensors_status',
    displayName: '설비 센서 상태',
    rowCount: 1,
    columnCount: 15,
    columns: ['id', 'equipmentName', 'operationalStatus', 'vibrationRms', 'motorCurrent', 'bearingTemp', 'anomalyScore', 'threshold', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table23: {
    name: 'crm_quality_ncr_similar_cases',
    displayName: '유사 NCR 사례',
    rowCount: 2,
    columnCount: 12,
    columns: ['id', 'title', 'similarity', 'rootCause', 'actionTaken', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table24: {
    name: 'crm_quality_ncr_items',
    displayName: 'NCR 부적합 내역',
    rowCount: 3,
    columnCount: 17,
    columns: ['id', 'date', 'itemName', 'defectCode', 'defectType', 'quantity', 'reporter', 'status', 'description', 'actionPlan', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table25: {
    name: 'crm_quality_checklist_submissions',
    displayName: '체크리스트 제출 내역',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'lotNo', 'inspector', 'checkItems', 'signatureData', 'photoUrl', 'status', 'submittedAt', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table26: {
    name: 'crm_grant_company_profile',
    displayName: '지원금 매칭용 기업 프로필',
    rowCount: 4,
    columnCount: 14,
    columns: ['id', 'establishmentYear', 'employeeCount', 'patentsCount', 'femaleEmployeeRatio', 'youthEmployeeRatio', 'sector', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table27: {
    name: 'crm_grant_rnd_plans',
    displayName: '지원금 R&D 계획서',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'announcement_id', 'plan_data', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table28: {
    name: 'crm_grant_bookmarks',
    displayName: '지원금 북마크',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'announcement_id', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table29: {
    name: 'crm_recruitment_applicants',
    displayName: '채용 지원자 관리',
    rowCount: 0,
    columnCount: 22,
    columns: ['id', 'name', 'age', 'phone', 'experience', 'motivation', 'matching_score', 'status', 'signature_url', 'signed_at', 'resume_file_path', 'tech_stacks', 'interview_logs', 'ai_evaluation', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table30: {
    name: 'crm_financial_analysis_logs',
    displayName: 'AI 재무 분석 로그',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'statement_id', 'z_score', 'risk_grade', 'forecast_text', 'consulting_text', 'created_at', 'updated_at', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table31: {
    name: 'crm_financial_statement_items',
    displayName: '재무제표 상세 계정과목',
    rowCount: 0,
    columnCount: 13,
    columns: ['id', 'statement_id', 'category', 'account_name', 'amount', 'created_at', 'updated_at', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table32: {
    name: 'crm_financial_statements',
    displayName: '재무제표 관리',
    rowCount: 0,
    columnCount: 20,
    columns: ['id', 'company_id', 'company_type', 'fiscal_year', 'fiscal_quarter', 'total_assets', 'total_liabilities', 'total_equity', 'revenue', 'operating_income', 'net_income', 'pdf_file_path', 'parsed_raw_json', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table33: {
    name: 'safety_inspect_logs',
    displayName: '안전점검 감사 대장',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'inspect_title', 'inspect_date', 'inspector_name', 'checklist_json', 'fail_actions_json', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table34: {
    name: 'safety_near_misses',
    displayName: '아차사고 및 유해요소 제보 대장',
    rowCount: 1,
    columnCount: 18,
    columns: ['id', 'reporter_name', 'hazard_location', 'description', 'photo_url', 'risk_grade', 'action_status', 'action_description', 'action_photo_url', 'action_completed_at', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table35: {
    name: 'safety_tbm_logs',
    displayName: 'TBM 안전 교육 대장',
    rowCount: 1,
    columnCount: 15,
    columns: ['id', 'tbm_date', 'work_leader', 'weather_info', 'tbm_script', 'attendees_count', 'attendee_signatures', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table36: {
    name: 'safety_risk_assessments',
    displayName: 'AI 위험성평가서',
    rowCount: 1,
    columnCount: 15,
    columns: ['id', 'work_name', 'work_date', 'hazards_json', 'risk_level', 'evaluated_by', 'approved_at', 'status', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table37: {
    name: 'safety_policies',
    displayName: '안전보건방침 및 목표',
    rowCount: 1,
    columnCount: 13,
    columns: ['id', 'year', 'policy_title', 'targets_json', 'established_at', 'established_by', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table38: {
    name: 'ai_contextual_help',
    displayName: 'AI 도움말 캐시',
    rowCount: 6,
    columnCount: 12,
    columns: ['id', 'hint_key', 'hint_text', 'ai_explanation', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table39: {
    name: 'system_mail_logs',
    displayName: '메일 AI 관제 로그',
    rowCount: 0,
    columnCount: 17,
    columns: ['id', 'sender', 'subject', 'received_at', 'ai_summary', 'intent', 'risk_level', 'action_type', 'action_result', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table40: {
    name: 'system_menu_settings',
    displayName: '시스템 메뉴 설정',
    rowCount: 45,
    columnCount: 11,
    columns: ['id', 'menu_href', 'is_enabled', 'sort_order', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table41: {
    name: 'shared_dashboards',
    displayName: '공유 대시보드 관리',
    rowCount: 0,
    columnCount: 22,
    columns: ['id', 'share_id', 'title', 'sql_query', 'table_name', 'display_name', 'chart_spec_json', 'briefing_markdown', 'refresh_interval', 'last_refreshed_at', 'created_at', 'is_active', 'sort_order', 'is_pinned', 'custom_title', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table42: {
    name: 'expense_employees',
    displayName: '지출 임직원 관리',
    rowCount: 6,
    columnCount: 10,
    columns: ['id', 'name', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table43: {
    name: 'expense_departments',
    displayName: '지출 부서 관리',
    rowCount: 8,
    columnCount: 10,
    columns: ['id', 'name', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table44: {
    name: 'expense_tags',
    displayName: '통합 공통 태그 관리',
    rowCount: 10,
    columnCount: 11,
    columns: ['id', 'name', 'scope', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table45: {
    name: 'expense_categories',
    displayName: '지출 계정과목 관리',
    rowCount: 65,
    columnCount: 12,
    columns: ['id', 'main_category', 'mid_category', 'sub_category', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table46: {
    name: 'expense_settings',
    displayName: '지출 예산 설정',
    rowCount: 1,
    columnCount: 14,
    columns: ['id', 'monthly_budget', 'is_alert_enabled', 'alert_threshold_percent', 'alert_sms_template', 'alert_phone', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table47: {
    name: 'inventory_logs',
    displayName: '재고 변동 이력',
    rowCount: 0,
    columnCount: 17,
    columns: ['id', 'itemId', 'itemName', 'itemType', 'changeType', 'quantity', 'price', 'operator', 'note', 'createdAt', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table48: {
    name: 'alert_logs',
    displayName: '가격 알림 발송 로그',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'log_id', 'rule_id', 'sent_price', 'sent_message', 'sent_at', 'api_response', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table49: {
    name: 'alert_rules',
    displayName: '가격 알림 규칙',
    rowCount: 1,
    columnCount: 16,
    columns: ['id', 'rule_id', 'item_id', 'rule_name', 'condition_type', 'threshold_value', 'phone_number', 'sms_template', 'is_enabled', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table50: {
    name: 'price_histories',
    displayName: '수집 가격 이력',
    rowCount: 10,
    columnCount: 14,
    columns: ['id', 'history_id', 'url_id', 'captured_price', 'captured_at', 'status', 'error_message', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table51: {
    name: 'target_urls',
    displayName: '가격 감시 URL',
    rowCount: 1,
    columnCount: 17,
    columns: ['id', 'url_id', 'item_id', 'site_name', 'target_url', 'css_selector', 'xpath', 'cron_interval', 'is_active', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table52: {
    name: 'tracked_items',
    displayName: '가격 추적 품목',
    rowCount: 1,
    columnCount: 16,
    columns: ['id', 'item_id', 'item_code', 'item_name', 'category', 'spec', 'base_price', 'target_margin_rate', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table53: {
    name: 'crm_inventory_inbound_items',
    displayName: '자율 입고 상세 품목',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'inbound_id', 'item_name', 'spec', 'quantity', 'price', 'barcode', 'matched_item_id', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table54: {
    name: 'crm_inventory_inbounds',
    displayName: '자율 입고 대장',
    rowCount: 0,
    columnCount: 13,
    columns: ['id', 'partner_name', 'inbound_date', 'total_amount', 'pdf_file_path', 'created_at', 'updated_at', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table55: {
    name: 'crm_partner_contacts',
    displayName: '거래처 담당자 명함첩',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'partner_id', 'name', 'position', 'phone', 'email', 'card_image_url', 'is_primary', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table56: {
    name: 'crm_snaptask_actions',
    displayName: '스냅태스크 AI 액션 감사록',
    rowCount: 0,
    columnCount: 12,
    columns: ['id', 'task_id', 'action_type', 'description', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table57: {
    name: 'crm_snaptask_items',
    displayName: '스냅태스크 상세 내역',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'task_id', 'content_text', 'file_url', 'file_type', 'ai_analysis', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table58: {
    name: 'crm_snaptasks',
    displayName: '스냅태스크 관리',
    rowCount: 0,
    columnCount: 12,
    columns: ['id', 'title', 'status', 'partner_id', 'created_at', 'updated_at', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table59: {
    name: 'crm_sales_orders',
    displayName: '수주서 관리',
    rowCount: 2,
    columnCount: 18,
    columns: ['id', 'estimate_id', 'client_order_no', 'customer_name', 'customer_phone', 'customer_manager', 'status', 'total_amount', 'delivery_date', 'order_date', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table60: {
    name: 'crm_purchase_orders',
    displayName: '발주서 관리',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'estimate_id', 'vendor_name', 'vendor_phone', 'status', 'total_amount', 'created_at', 'completed_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table61: {
    name: 'crm_point_history',
    displayName: '적립금 내역',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'customer_id', 'transaction_type', 'amount', 'balance_after', 'description', 'related_entity_type', 'related_entity_id', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table62: {
    name: 'crm_coupons_restrictions',
    displayName: '쿠폰 제한 관리',
    rowCount: 0,
    columnCount: 13,
    columns: ['id', 'coupon_id', 'restriction_type', 'target_type', 'target_value', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table63: {
    name: 'naver_blog_marketing_settings',
    displayName: '네이버 블로그 마케팅 설정',
    rowCount: 1,
    columnCount: 15,
    columns: ['id', 'is_autopilot', 'autopilot_interval', 'autopilot_time', 'tone_style', 'naver_blog_id', 'api_client_id', 'api_client_secret', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table64: {
    name: 'crm_naver_blog_posts',
    displayName: '네이버 블로그 포스팅 이력 및 예약',
    rowCount: 0,
    columnCount: 20,
    columns: ['id', 'product_id', 'status', 'title', 'content', 'target_keywords', 'image_url', 'sub_image_url', 'scheduled_at', 'posted_at', 'error_message', 'views_count', 'likes_count', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table65: {
    name: 'instagram_marketing_settings',
    displayName: '인스타그램 마케팅 설정',
    rowCount: 1,
    columnCount: 14,
    columns: ['id', 'is_autopilot', 'autopilot_interval', 'autopilot_time', 'tone_style', 'instagram_username', 'access_token', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table66: {
    name: 'crm_instagram_posts',
    displayName: '인스타그램 포스팅 이력 및 예약',
    rowCount: 0,
    columnCount: 17,
    columns: ['id', 'product_id', 'status', 'content', 'image_url', 'scheduled_at', 'posted_at', 'error_message', 'likes_count', 'comments_count', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table67: {
    name: 'crm_operators',
    displayName: '운영자 권한 관리',
    rowCount: 5,
    columnCount: 16,
    columns: ['id', 'username', 'password_hash', 'name', 'role', 'employee_number', 'phone', 'my_card_image_url', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table68: {
    name: 'system_settings',
    displayName: '시스템 설정',
    rowCount: 15,
    columnCount: 10,
    columns: ['id', 'key', 'value', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table69: {
    name: 'crm_transactions',
    displayName: '거래 내역',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'customer_name', 'customer_phone', 'product_name', 'amount', 'order_date', 'status', 'order_id', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table70: {
    name: 'ad_templates',
    displayName: '광고 템플릿',
    rowCount: 0,
    columnCount: 12,
    columns: ['id', 'name', 'header', 'footer', 'opt_out', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table71: {
    name: 'message_logs',
    displayName: '발송 내역',
    rowCount: 0,
    columnCount: 13,
    columns: ['id', 'customer_id', 'phone', 'message', 'status', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table72: {
    name: 'message_templates',
    displayName: '문자 템플릿',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'title', 'content', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table73: {
    name: 'crm_customers',
    displayName: '고객 명단',
    rowCount: 0,
    columnCount: 19,
    columns: ['id', 'name', 'phone', 'email', 'tags', 'memo', 'address', 'shipping_address', 'recipient_name', 'recipient_phone', 'point_balance', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table74: {
    name: 'crm_expenses',
    displayName: '지출 내역',
    rowCount: 0,
    columnCount: 24,
    columns: ['id', 'title', 'category', 'amount', 'expense_date', 'payment_method', 'attachment_url', 'ai_analysis', 'memo', 'approval_status', 'approval_memo', 'approved_at', 'actual_expense_date', 'deduction_amount', 'transfer_fee', 'card_approval_no', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table75: {
    name: 'crm_estimate_items',
    displayName: '견적서 품목 상세',
    rowCount: 1,
    columnCount: 18,
    columns: ['id', 'estimate_id', 'product_id', 'item_code', 'product_name', 'spec', 'quantity', 'unit_price', 'amount', 'delivery_date', 'valid_item_code', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table76: {
    name: 'crm_estimates',
    displayName: '견적서 관리',
    rowCount: 2,
    columnCount: 21,
    columns: ['id', 'type', 'direction_status', 'partner_name', 'partner_phone', 'partner_manager', 'total_amount', 'file_url', 'business_license_url', 'ai_parsed', 'tags', 'created_at', 'uuid', 'sales_order_number', 'purchase_order_number', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table77: {
    name: 'crm_partner_ai_reports',
    displayName: '거래처 AI 리스크 보고서',
    rowCount: 3,
    columnCount: 15,
    columns: ['id', 'partner_id', 'company_name', 'report_type', 'risk_grade', 'summary', 'result_json', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table78: {
    name: 'crm_grant_announcements',
    displayName: '정부 지원금 추천 공고',
    rowCount: 225,
    columnCount: 14,
    columns: ['id', 'title', 'agency', 'match_score', 'match_guide', 'budget', 'end_date', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table79: {
    name: 'system_shared_views',
    displayName: 'system_shared_views',
    description: 'Imported from user_database_export_2026-06-20.sql',
    rowCount: 2,
    columnCount: 16,
    columns: ['view_id', 'share_hash', 'source_table', 'friendly_table_name', 'column_mappings', 'default_sort_column', 'default_sort_direction', 'allow_csv_download', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table80: {
    name: 'user_data_embedding_metadata',
    displayName: 'user_data_embedding_metadata',
    description: 'Imported from user_database_export_2026-06-20.sql',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'table_id', 'column_name', 'total_embeddings', 'embedding_model', 'embedding_dimensions', 'last_updated', 'estimated_cost_usd', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table81: {
    name: 'user_data_embeddings',
    displayName: 'user_data_embeddings',
    description: 'Imported from user_database_export_2026-06-20.sql',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'table_id', 'row_id', 'column_name', 'embedding_model', 'embedding_dimensions', 'embedding', 'created_at', 'updated_at', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table82: {
    name: 'sync_activity_log',
    displayName: 'sync_activity_log',
    description: 'Imported from user_database_export_2026-06-20.sql',
    rowCount: 0,
    columnCount: 19,
    columns: ['id', 'config_id', 'file_name', 'file_path', 'status', 'rows_imported', 'rows_skipped', 'duplicates_skipped', 'error_message', 'started_at', 'completed_at', 'duration_ms', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table83: {
    name: 'sync_configurations',
    displayName: 'sync_configurations',
    description: 'Imported from user_database_export_2026-06-20.sql',
    rowCount: 0,
    columnCount: 30,
    columns: ['id', 'script_folder_path', 'script_name', 'folder_name', 'target_table_id', 'header_row', 'skip_bottom_rows', 'sheet_index', 'column_mappings', 'applied_splits', 'file_action', 'enabled', 'auto_sync_enabled', 'unique_key_columns', 'duplicate_action', 'last_sync_at', 'last_sync_status', 'last_sync_rows_imported', 'last_sync_rows_skipped', 'last_sync_duplicates', 'last_sync_error', 'created_at', 'updated_at', 'source', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table84: {
    name: 'user_data_files',
    displayName: 'user_data_files',
    description: 'Imported from user_database_export_2026-06-20.sql',
    rowCount: 0,
    columnCount: 21,
    columns: ['id', 'table_id', 'row_id', 'column_name', 'filename', 'mime_type', 'size_bytes', 'storage_type', 'file_data', 'file_path', 'is_compressed', 'compression_type', 'original_size', 'created_at', 'updated_at', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table85: {
    name: 'crm_interpretation_logs',
    displayName: '실시간 통역 AI 발화 로그',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'uuid', 'session_uuid', 'speaker_role', 'original_text', 'translated_text', 'audio_url', 'created_at', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table86: {
    name: 'crm_interpretation_sessions',
    displayName: '실시간 통역 AI 세션',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'uuid', 'user_id', 'source_lang', 'target_lang', 'tone_manner', 'file_path', 'audio_file_path', 'created_at', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table87: {
    name: 'easybot_rules_history',
    displayName: '이지봇 규칙 변경 이력 대장',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'rule_id', 'action_type', 'previous_value_json', 'new_value_json', 'change_reason', 'operator_id', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table88: {
    name: 'easybot_rules',
    displayName: '이지봇 자율 감시 규칙 대장',
    rowCount: 2,
    columnCount: 17,
    columns: ['id', 'title', 'target_table', 'conditions_sql', 'assignee_id', 'task_priority', 'task_title_template', 'task_content_template', 'is_active', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table89: {
    name: 'easybot_action_audit_logs',
    displayName: '이지봇 AI 감사 로그',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'operator_username', 'original_prompt', 'action_name', 'arguments_json', 'status', 'execution_result', 'error_message', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table90: {
    name: 'crm_web_published_sites',
    displayName: '홈페이지 다변화 배포 관리',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'domain_type', 'domain_url', 'html_content', 'config_json', 'title', 'description', 'is_active', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table91: {
    name: 'crm_deadstock_proposals',
    displayName: '불용자재 제안 메일 로그',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'item_id', 'target_company', 'target_email', 'subject', 'content', 'status', 'replied_content', 'replied_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table92: {
    name: 'crm_meeting_tasks',
    displayName: '회의 할 일 및 일정',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'meeting_id', 'assignee_name', 'assignee_email', 'task_desc', 'due_date', 'status', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table93: {
    name: 'crm_meetings',
    displayName: '회의 대장',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'title', 'date', 'attendees', 'transcript', 'summary', 'status', 'audio_url', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table94: {
    name: 'exchange_rates',
    displayName: '실시간 환율',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'rate_id', 'currency_code', 'currency_name', 'current_rate', 'change_rate', 'change_direction', 'last_updated_at']
  } as TableDefinition,
  table95: {
    name: 'tenant_menu_settings',
    displayName: '테넌트 메뉴 설정',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'tenant_id', 'menu_href', 'is_enabled', 'sort_order']
  } as TableDefinition,
  table96: {
    name: 'exchange_rate_histories',
    displayName: '환율 변동 이력',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'history_id', 'currency_code', 'rate_value', 'captured_date']
  } as TableDefinition,
  table97: {
    name: 'user_feedbacks',
    displayName: '사용자 피드백 및 버그 제보',
    rowCount: 1,
    columnCount: 6,
    columns: ['id', 'user_prompt', 'detected_type', 'current_url', 'resolved_status', 'created_at']
  } as TableDefinition,
  table98: {
    name: 'crm_attendance',
    displayName: '직원 근태 대장',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'operator_id', 'work_date', 'clock_in', 'clock_out', 'status', 'working_hours', 'memo', 'created_at', 'updated_at']
  } as TableDefinition,
  table99: {
    name: 'crm_operator_leave_balances',
    displayName: '직원별 연차 잔액 관리',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'operator_id', 'total_allowed', 'used', 'remaining', 'updated_at']
  } as TableDefinition,
  table100: {
    name: 'crm_annual_leaves',
    displayName: '직원 연차 신청 결재 대장',
    rowCount: 0,
    columnCount: 12,
    columns: ['id', 'operator_id', 'leave_type', 'start_date', 'end_date', 'days_spent', 'status', 'reason', 'reject_reason', 'approver_id', 'created_at', 'updated_at']
  } as TableDefinition,
  table101: {
    name: 'crm_company_events',
    displayName: '전사 회사 일정 공유 대장',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'title', 'start_date', 'end_date', 'event_type', 'description', 'created_by', 'created_at']
  } as TableDefinition,
  table102: {
    name: 'crm_operator_contract_settings',
    displayName: '임직원 근로 계약 조건 대장',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'operator_id', 'hourly_wage', 'weekly_hours', 'allow_weekly_holiday_paid', 'work_days', 'contract_memo', 'updated_at']
  } as TableDefinition,
  table103: {
    name: 'crm_operator_profiles',
    displayName: '임직원 인적사항 상세 대장',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'operator_id', 'department', 'hire_date', 'commute_area', 'skills', 'backup_operator_id', 'updated_at']
  } as TableDefinition,
  table104: {
    name: 'crm_operator_licenses',
    displayName: '임직원 자격면허 대장',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'operator_id', 'license_name', 'issuer', 'license_no', 'acquisition_date', 'expiry_date']
  } as TableDefinition,
  table105: {
    name: 'crm_operator_education',
    displayName: '임직원 학력이력 대장',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'operator_id', 'school_name', 'major', 'degree', 'entrance_date', 'graduation_date', 'status']
  } as TableDefinition,
  table106: {
    name: 'crm_operator_careers',
    displayName: '임직원 이전경력 대장',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'operator_id', 'company_name', 'department', 'job_title', 'join_date', 'retire_date', 'assigned_task', 'leaving_reason']
  } as TableDefinition,
  table107: {
    name: 'crm_operator_salaries',
    displayName: '임직원 급여상여 이력 대장',
    rowCount: 0,
    columnCount: 12,
    columns: ['id', 'operator_id', 'payment_year_month', 'base_salary', 'bonus_amount', 'weekly_holiday_allowance', 'overtime_allowance', 'meal_allowance', 'deduction_amount', 'net_salary', 'payment_date', 'status']
  } as TableDefinition,
  table108: {
    name: 'crm_operator_awards',
    displayName: '임직원 상벌 징계 대장',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'operator_id', 'record_date', 'type', 'title', 'content', 'authority', 'remarks']
  } as TableDefinition,
  table109: {
    name: 'crm_operator_promotions',
    displayName: '임직원 승진발령 대장',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'operator_id', 'change_date', 'prev_dept', 'next_dept', 'prev_role', 'next_role', 'promotion_reason']
  } as TableDefinition,
  table110: {
    name: 'crm_operator_family_events',
    displayName: '임직원 경조사 지원 대장',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'operator_id', 'event_date', 'relation', 'type', 'congratulation_money', 'wreath_provided']
  } as TableDefinition,
  table111: {
    name: 'crm_operator_incidents',
    displayName: '임직원 대내외 사건사고 대장',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'operator_id', 'occurred_date', 'severity', 'title', 'description', 'status', 'outcome', 'updated_at']
  } as TableDefinition,
  table112: {
    name: 'crm_operator_medical',
    displayName: '임직원 병력 치료 대장',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'operator_id', 'diagnosis_name', 'treatment_start_date', 'treatment_end_date', 'hospital_name', 'sick_leave_days', 'work_limitations']
  } as TableDefinition,
  table113: {
    name: 'crm_operator_reputations',
    displayName: '임직원 다차원 평판 대장',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'operator_id', 'evaluation_date', 'evaluator_id', 'source_type', 'score', 'positive_feedback', 'constructive_feedback', 'updated_at']
  } as TableDefinition,
  table114: {
    name: 'crm_operator_families',
    displayName: '임직원 부양가족 대장',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'operator_id', 'relation_type', 'name', 'birth_date', 'phone_number', 'is_dependent', 'remarks']
  } as TableDefinition,
  table115: {
    name: 'crm_operator_job_history',
    displayName: '임직원 담당업무 변경이력 대장',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'operator_id', 'assignment_date', 'job_description', 'prev_job_description', 'is_current']
  } as TableDefinition,
  table116: {
    name: 'crm_operator_ai_briefing_histories',
    displayName: '임직원 AI 전사 업무 분석 이력 대장',
    rowCount: 1,
    columnCount: 10,
    columns: ['id', 'target_year_month', 'risk_score', 'alert_title', 'alert_message', 'briefing_text', 'created_at', 'created_by', 'token_usage_input', 'token_usage_output']
  } as TableDefinition,
  table117: {
    name: 'crm_operator_projects',
    displayName: '임직원 참여 프로젝트 대장',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'operator_id', 'project_name', 'role_in_project', 'start_date', 'end_date', 'contribution_rate', 'performance_score', 'performance_evaluation', 'outcome_link']
  } as TableDefinition,
  table118: {
    name: 'crm_company_event_types',
    displayName: '회사 일정 유형 마스터 대장',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'type_key', 'type_name', 'color_theme', 'is_system', 'created_at', 'updated_at']
  } as TableDefinition,
  table119: {
    name: 'ecount_sync_schedules',
    displayName: '이카운트 ERP 동기화 스케줄',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'script_file', 'script_title', 'target_table', 'period_preset', 'run_time', 'is_active', 'last_run_at', 'next_run_at', 'created_at']
  } as TableDefinition,
  table120: {
    name: 'pms_projects',
    displayName: 'PMS 프로젝트 대장',
    rowCount: 0,
    columnCount: 13,
    columns: ['id', 'client', 'bizNo', 'name', 'type', 'dueDate', 'folderUrl', 'estimateUrl', 'status', 'createdAt', 'details', 'processStep', 'inboundChannel']
  } as TableDefinition,
  table121: {
    name: 'ecount_rpa_lock',
    displayName: '이카운트 RPA 실행 락',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'is_locked', 'locked_by', 'locked_at', 'cooldown_until']
  } as TableDefinition,
  table122: {
    name: 'crm_energy_savings',
    displayName: '에너지 절감 스케줄',
    rowCount: 0,
    columnCount: 4,
    columns: ['id', 'apply_date', 'saving_amount', 'is_active']
  } as TableDefinition,
  table123: {
    name: 'crm_safety_alerts',
    displayName: 'CCTV 비상 위험 알림 로그',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'zone_name', 'alert_level', 'detector_type', 'created_at', 'is_resolved']
  } as TableDefinition,
  table124: {
    name: 'crm_energy_equipments',
    displayName: '에너지 소모 설비 대장',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'equipment_name', 'status', 'current_load', 'monthly_bill']
  } as TableDefinition,
  table125: {
    name: 'crm_safety_zones',
    displayName: '안전 제어 구역 설정',
    rowCount: 0,
    columnCount: 4,
    columns: ['id', 'zone_name', 'risk_score', 'status']
  } as TableDefinition,
  table126: {
    name: 'crm_scm_shipments',
    displayName: '실시간 수입 조달 화물 리스트',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'item_name', 'supplier_name', 'status', 'eta', 'delay_probability', 'current_step']
  } as TableDefinition,
  table127: {
    name: 'crm_labor_stats',
    displayName: '임직원 근태 리스크 요약',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'weekly_hours', 'overtime_hours', 'lateness_count', 'early_leave_count', 'risk_level']
  } as TableDefinition,
  table128: {
    name: 'crm_scm_suppliers',
    displayName: '협력사 스코어카드',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'supplier_name', 'delivery_rate', 'defect_rate', 'score']
  } as TableDefinition,
  table129: {
    name: 'crm_labor_contracts',
    displayName: '근로계약서 독소조항 스캔 현황',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'clause_id', 'title', 'is_illegal', 'current_text', 'recommended_text', 'reason']
  } as TableDefinition,
  table130: {
    name: 'crm_partner_credit_risks',
    displayName: '거래처 신용 위험 및 연체 지표 대장',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'overdue_amount', 'overdue_days', 'credit_rating', 'default_probability', 'risk_level', 'last_action', 'action_date']
  } as TableDefinition,
  table131: {
    name: 'crm_production_gantt_tasks',
    displayName: '생산 간트 차트 작업 목록',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'title', 'equipmentId', 'equipmentName', 'operatorName', 'startHour', 'endHour', 'progress', 'status']
  } as TableDefinition,
  table132: {
    name: 'crm_production_bottlenecks',
    displayName: '설비별 누적 로드 및 병목 지수',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'name', 'loadRate', 'status', 'queueTasks']
  } as TableDefinition,
  table133: {
    name: 'crm_production_unscheduled_orders',
    displayName: '미배정 수주 대장',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'orderId', 'productName', 'qty', 'dueDate', 'status']
  } as TableDefinition,
  table134: {
    name: 'crm_production_due_risk',
    displayName: '납기 준수 위험 분석',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'orderId', 'productName', 'probability', 'status']
  } as TableDefinition,
  table135: {
    name: 'crm_facility_events',
    displayName: '월간 정비 일정',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'date', 'title', 'type', 'assignee']
  } as TableDefinition,
  table136: {
    name: 'crm_facility_parts',
    displayName: '소모성 부품 재고 관리',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'name', 'safetyStock', 'currentStock', 'unit', 'leadTimeDays', 'risk']
  } as TableDefinition,
  table137: {
    name: 'crm_facility_oee_downtime',
    displayName: '비가동 원인 통계',
    rowCount: 0,
    columnCount: 4,
    columns: ['id', 'reason', 'minutes', 'rate']
  } as TableDefinition,
  table138: {
    name: 'crm_facility_oee_stats',
    displayName: 'OEE 설비 종합 효율 통계',
    rowCount: 0,
    columnCount: 11,
    columns: ['id', 'overallOee', 'availability', 'performance', 'quality', 'totalLoaded', 'actualRun', 'plannedStop', 'breakdownStop', 'opportunityLossKrw', 'preventedLossKrw']
  } as TableDefinition,
  table139: {
    name: 'crm_facility_layout',
    displayName: '공장 설비 평면 배치 및 상태',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'name', 'status', 'oee', 'x', 'y']
  } as TableDefinition,
  table140: {
    name: 'crm_finance_products',
    displayName: '제품 원가 기초 데이터',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'productId', 'productName', 'rawMaterialCost', 'laborCost', 'expenseCost', 'sellingPrice']
  } as TableDefinition,
  table141: {
    name: 'crm_finance_forecasts',
    displayName: '수금 및 지출 예정 대장',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'date', 'type', 'title', 'partnerName', 'amount', 'isOverdue', 'contact']
  } as TableDefinition,
  table142: {
    name: 'crm_web_templates',
    displayName: '웹 양식 템플릿 마스터',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'template_name', 'html_content', 'web_html_content', 'document_type', 'is_active', 'is_print_active', 'is_web_active', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table143: {
    name: 'crm_web_form_logs',
    displayName: '웹 양식 발급대장',
    rowCount: 1,
    columnCount: 13,
    columns: ['id', 'template_id', 'record_id', 'record_name', 'print_data', 'issue_date', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table144: {
    name: 'products',
    displayName: '광고 상품',
    rowCount: 0,
    columnCount: 19,
    columns: ['id', 'name', 'price', 'url', 'description', 'main_image_url', 'detail_image_url', 'available_methods', 'category', 'menu_category', 'is_coupon_excludable', 'is_estimate_price', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table145: {
    name: 'crm_orders',
    displayName: '주문 내역',
    rowCount: 0,
    columnCount: 20,
    columns: ['id', 'customer_name', 'customer_phone', 'product_name', 'quantity', 'total_price', 'delivery_method', 'shipping_address', 'tracking_number', 'attachment_url', 'customer_memo', 'order_date', 'status', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table146: {
    name: 'crm_reservations',
    displayName: '예약 내역',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'customer_name', 'customer_phone', 'service_name', 'reservation_date', 'reservation_time', 'status', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table147: {
    name: 'crm_payments',
    displayName: '결제 내역',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'customer_name', 'payment_method', 'amount', 'payment_date', 'status', 'order_id', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table148: {
    name: 'crm_deliveries',
    displayName: '배송 내역',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'customer_name', 'customer_phone', 'address', 'courier', 'tracking_number', 'status', 'order_id', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table149: {
    name: 'coupons',
    displayName: '쿠폰 관리',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'code', 'name', 'discount_type', 'discount_value', 'min_order_amount', 'status', 'expires_at', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table150: {
    name: 'crm_partners',
    displayName: '거래처 관리',
    rowCount: 1,
    columnCount: 22,
    columns: ['id', 'type', 'company_name', 'business_number', 'representative', 'phone', 'manager_name', 'manager_phone', 'email', 'address', 'vip_level', 'credit_limit', 'business_license_url', 'memo', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table151: {
    name: 'inventory_items',
    displayName: '재고 품목',
    rowCount: 0,
    columnCount: 24,
    columns: ['id', 'type', 'name', 'category', 'price', 'partner', 'stock', 'safeStock', 'location', 'spec', 'unitType', 'unitValue', 'boxContains', 'description', 'tags', 'barcode', 'createdAt', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table152: {
    name: 'ai_token_usage_logs',
    displayName: 'AI 토큰 사용량 로그',
    rowCount: 75,
    columnCount: 16,
    columns: ['id', 'model', 'purpose', 'prompt_tokens', 'completion_tokens', 'total_tokens', 'user_name', 'menu_path', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table153: {
    name: 'expense_projects',
    displayName: '지출 프로젝트 관리',
    rowCount: 5,
    columnCount: 10,
    columns: ['id', 'name', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table154: {
    name: 'form_templates',
    displayName: '양식 템플릿 마스터',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'template_name', 'document_type', 'file_path', 'orientation', 'is_active', 'query_sql', 'query_params', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table155: {
    name: 'crm_employment_certificate_logs',
    displayName: '재직증명서 발급대장',
    rowCount: 0,
    columnCount: 19,
    columns: ['id', 'staff_id', 'staff_name', 'joined_date', 'degree_level', 'major_name', 'address', 'usage', 'issue_date', 'issue_dept', 'issue_by', 'extra_data', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table156: {
    name: 'form_mappings',
    displayName: '양식 데이터 필드 매핑',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'template_id', 'field_key', 'field_label', 'pos_x', 'pos_y', 'font_size', 'font_weight', 'text_align', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table157: {
    name: 'crm_credential_vault',
    displayName: '보안 인증 정보 금고',
    rowCount: 0,
    columnCount: 18,
    columns: ['id', 'category', 'asset_name', 'login_id', 'encrypted_password', 'iv', 'auth_tag', 'remarks', 'owner_operator_id', 'status', 'created_at', 'updated_at', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table158: {
    name: 'crm_credential_emergency_requests',
    displayName: '보안 인증 비상 요청 대장',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'credential_id', 'requester_id', 'request_reason', 'status', 'approved_by', 'approved_at', 'expires_at', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table159: {
    name: 'crm_credential_audit_logs',
    displayName: '보안 인증 감사록',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'credential_id', 'operator_id', 'operator_name', 'action_type', 'access_reason', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
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
  table1: 'rnd_compliance_alarms',
  table2: 'rnd_logs',
  table3: 'rnd_spaces',
  table4: 'rnd_staffs',
  table5: 'rnd_centers',
  table6: 'crm_facility_predictive_part_rul',
  table7: 'crm_facility_predictive_fft',
  table8: 'crm_facility_predictive_vibration',
  table9: 'crm_facility_predictive_summary',
  table10: 'crm_facility_repair_solutions',
  table11: 'crm_facility_repair_logs',
  table12: 'crm_facility_checklists',
  table13: 'crm_facilities',
  table14: 'crm_quality_vision_logs',
  table15: 'crm_quality_vision_model',
  table16: 'crm_quality_spc_features',
  table17: 'crm_quality_spc_predictions',
  table18: 'crm_quality_spc_samples',
  table19: 'crm_quality_spc_config',
  table20: 'crm_quality_sensors_timeline',
  table21: 'crm_quality_sensors_contribution',
  table22: 'crm_quality_sensors_status',
  table23: 'crm_quality_ncr_similar_cases',
  table24: 'crm_quality_ncr_items',
  table25: 'crm_quality_checklist_submissions',
  table26: 'crm_grant_company_profile',
  table27: 'crm_grant_rnd_plans',
  table28: 'crm_grant_bookmarks',
  table29: 'crm_recruitment_applicants',
  table30: 'crm_financial_analysis_logs',
  table31: 'crm_financial_statement_items',
  table32: 'crm_financial_statements',
  table33: 'safety_inspect_logs',
  table34: 'safety_near_misses',
  table35: 'safety_tbm_logs',
  table36: 'safety_risk_assessments',
  table37: 'safety_policies',
  table38: 'ai_contextual_help',
  table39: 'system_mail_logs',
  table40: 'system_menu_settings',
  table41: 'shared_dashboards',
  table42: 'expense_employees',
  table43: 'expense_departments',
  table44: 'expense_tags',
  table45: 'expense_categories',
  table46: 'expense_settings',
  table47: 'inventory_logs',
  table48: 'alert_logs',
  table49: 'alert_rules',
  table50: 'price_histories',
  table51: 'target_urls',
  table52: 'tracked_items',
  table53: 'crm_inventory_inbound_items',
  table54: 'crm_inventory_inbounds',
  table55: 'crm_partner_contacts',
  table56: 'crm_snaptask_actions',
  table57: 'crm_snaptask_items',
  table58: 'crm_snaptasks',
  table59: 'crm_sales_orders',
  table60: 'crm_purchase_orders',
  table61: 'crm_point_history',
  table62: 'crm_coupons_restrictions',
  table63: 'naver_blog_marketing_settings',
  table64: 'crm_naver_blog_posts',
  table65: 'instagram_marketing_settings',
  table66: 'crm_instagram_posts',
  table67: 'crm_operators',
  table68: 'system_settings',
  table69: 'crm_transactions',
  table70: 'ad_templates',
  table71: 'message_logs',
  table72: 'message_templates',
  table73: 'crm_customers',
  table74: 'crm_expenses',
  table75: 'crm_estimate_items',
  table76: 'crm_estimates',
  table77: 'crm_partner_ai_reports',
  table78: 'crm_grant_announcements',
  table79: 'system_shared_views',
  table80: 'user_data_embedding_metadata',
  table81: 'user_data_embeddings',
  table82: 'sync_activity_log',
  table83: 'sync_configurations',
  table84: 'user_data_files',
  table85: 'crm_interpretation_logs',
  table86: 'crm_interpretation_sessions',
  table87: 'easybot_rules_history',
  table88: 'easybot_rules',
  table89: 'easybot_action_audit_logs',
  table90: 'crm_web_published_sites',
  table91: 'crm_deadstock_proposals',
  table92: 'crm_meeting_tasks',
  table93: 'crm_meetings',
  table94: 'exchange_rates',
  table95: 'tenant_menu_settings',
  table96: 'exchange_rate_histories',
  table97: 'user_feedbacks',
  table98: 'crm_attendance',
  table99: 'crm_operator_leave_balances',
  table100: 'crm_annual_leaves',
  table101: 'crm_company_events',
  table102: 'crm_operator_contract_settings',
  table103: 'crm_operator_profiles',
  table104: 'crm_operator_licenses',
  table105: 'crm_operator_education',
  table106: 'crm_operator_careers',
  table107: 'crm_operator_salaries',
  table108: 'crm_operator_awards',
  table109: 'crm_operator_promotions',
  table110: 'crm_operator_family_events',
  table111: 'crm_operator_incidents',
  table112: 'crm_operator_medical',
  table113: 'crm_operator_reputations',
  table114: 'crm_operator_families',
  table115: 'crm_operator_job_history',
  table116: 'crm_operator_ai_briefing_histories',
  table117: 'crm_operator_projects',
  table118: 'crm_company_event_types',
  table119: 'ecount_sync_schedules',
  table120: 'pms_projects',
  table121: 'ecount_rpa_lock',
  table122: 'crm_energy_savings',
  table123: 'crm_safety_alerts',
  table124: 'crm_energy_equipments',
  table125: 'crm_safety_zones',
  table126: 'crm_scm_shipments',
  table127: 'crm_labor_stats',
  table128: 'crm_scm_suppliers',
  table129: 'crm_labor_contracts',
  table130: 'crm_partner_credit_risks',
  table131: 'crm_production_gantt_tasks',
  table132: 'crm_production_bottlenecks',
  table133: 'crm_production_unscheduled_orders',
  table134: 'crm_production_due_risk',
  table135: 'crm_facility_events',
  table136: 'crm_facility_parts',
  table137: 'crm_facility_oee_downtime',
  table138: 'crm_facility_oee_stats',
  table139: 'crm_facility_layout',
  table140: 'crm_finance_products',
  table141: 'crm_finance_forecasts',
  table142: 'crm_web_templates',
  table143: 'crm_web_form_logs',
  table144: 'products',
  table145: 'crm_orders',
  table146: 'crm_reservations',
  table147: 'crm_payments',
  table148: 'crm_deliveries',
  table149: 'coupons',
  table150: 'crm_partners',
  table151: 'inventory_items',
  table152: 'ai_token_usage_logs',
  table153: 'expense_projects',
  table154: 'form_templates',
  table155: 'crm_employment_certificate_logs',
  table156: 'form_mappings',
  table157: 'crm_credential_vault',
  table158: 'crm_credential_emergency_requests',
  table159: 'crm_credential_audit_logs'
} as const;
