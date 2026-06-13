/**
 * EGDesk User Data Configuration
 * Generated at: 2026-06-12T23:34:40.919Z
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
    name: 'crm_credential_audit_logs',
    displayName: '보안 인증 감사록',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'credential_id', 'operator_id', 'operator_name', 'action_type', 'access_reason', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table2: {
    name: 'crm_credential_emergency_requests',
    displayName: '보안 인증 비상 요청 대장',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'credential_id', 'requester_id', 'request_reason', 'status', 'approved_by', 'approved_at', 'expires_at', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table3: {
    name: 'crm_credential_vault',
    displayName: '보안 인증 정보 금고',
    rowCount: 0,
    columnCount: 18,
    columns: ['id', 'category', 'asset_name', 'login_id', 'encrypted_password', 'iv', 'auth_tag', 'remarks', 'owner_operator_id', 'status', 'created_at', 'updated_at', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table4: {
    name: 'rnd_compliance_alarms',
    displayName: '규제 준수 모니터링 및 알림',
    rowCount: 1,
    columnCount: 10,
    columns: ['id', 'alarm_id', 'center_id', 'category', 'severity', 'message', 'due_date', 'is_resolved', 'resolved_at', 'created_at']
  } as TableDefinition,
  table5: {
    name: 'rnd_logs',
    displayName: 'R&D 연구개발 일지 및 AI 생성 데이터',
    rowCount: 2,
    columnCount: 16,
    columns: ['id', 'log_id', 'center_id', 'author_id', 'work_date', 'raw_source', 'raw_content', 'audio_file_url', 'ai_generated_title', 'ai_generated_content', 'approval_status', 'approver_id', 'approved_at', 'blockchain_hash', 'created_at', 'updated_at']
  } as TableDefinition,
  table6: {
    name: 'rnd_spaces',
    displayName: '연구 공간 자가 실사 및 Vision AI 분석 이력',
    rowCount: 1,
    columnCount: 12,
    columns: ['id', 'space_check_id', 'center_id', 'check_date', 'image_url_entrance', 'image_url_layout', 'ai_analysis_result', 'signage_status', 'partition_status', 'overall_status', 'inspector_notes', 'created_at']
  } as TableDefinition,
  table7: {
    name: 'rnd_staffs',
    displayName: '연구원 정보 및 자격 정보',
    rowCount: 4,
    columnCount: 13,
    columns: ['id', 'staff_id', 'center_id', 'user_id', 'staff_role', 'employment_status', 'degree_level', 'major_name', 'major_category', 'graduation_cert_ocr_json', 'qualification_status', 'joined_date', 'resigned_date']
  } as TableDefinition,
  table8: {
    name: 'rnd_centers',
    displayName: '기업부설연구소 기본 정보',
    rowCount: 1,
    columnCount: 12,
    columns: ['id', 'center_id', 'company_id', 'center_name', 'center_type', 'established_date', 'koita_reg_number', 'postal_code', 'address_road', 'address_detail', 'total_area_sqm', 'is_active']
  } as TableDefinition,
  table9: {
    name: 'crm_facility_predictive_part_rul',
    displayName: '설비 부품 수명 RUL',
    rowCount: 3,
    columnCount: 6,
    columns: ['id', 'equipmentId', 'partName', 'rulDays', 'status', 'percent']
  } as TableDefinition,
  table10: {
    name: 'crm_facility_predictive_fft',
    displayName: '설비 주파수 분석',
    rowCount: 4,
    columnCount: 5,
    columns: ['id', 'equipmentId', 'frequency', 'amplitude', 'label']
  } as TableDefinition,
  table11: {
    name: 'crm_facility_predictive_vibration',
    displayName: '설비 진동 센서 이력',
    rowCount: 6,
    columnCount: 4,
    columns: ['id', 'equipmentId', 'time', 'value']
  } as TableDefinition,
  table12: {
    name: 'crm_facility_predictive_summary',
    displayName: '설비 건전도 요약',
    rowCount: 1,
    columnCount: 5,
    columns: ['id', 'equipmentId', 'equipmentName', 'healthScore', 'vibrationRms']
  } as TableDefinition,
  table13: {
    name: 'crm_facility_repair_solutions',
    displayName: '설비 고장 해결 가이드',
    rowCount: 2,
    columnCount: 6,
    columns: ['id', 'errorCode', 'rootCause', 'actions', 'similarHistory', 'warehouse']
  } as TableDefinition,
  table14: {
    name: 'crm_facility_repair_logs',
    displayName: '설비 수리 이력 대장',
    rowCount: 1,
    columnCount: 9,
    columns: ['id', 'date', 'equipmentId', 'equipmentName', 'errorCode', 'symptom', 'repairDesc', 'mechanic', 'cost']
  } as TableDefinition,
  table15: {
    name: 'crm_facility_checklists',
    displayName: '설비 예방 점검 이력',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'equipmentId', 'inspector', 'checks', 'signatureData', 'audioUrl', 'status', 'checkedAt']
  } as TableDefinition,
  table16: {
    name: 'crm_facilities',
    displayName: '설비 대장 관리',
    rowCount: 2,
    columnCount: 13,
    columns: ['id', 'name', 'manufacturer', 'model_name', 'serial_number', 'manufacture_year', 'specifications', 'location', 'status', 'health_score', 'vibration_rms', 'created_at', 'updated_at']
  } as TableDefinition,
  table17: {
    name: 'crm_quality_vision_logs',
    displayName: '품질 비전 판정 이력',
    rowCount: 3,
    columnCount: 8,
    columns: ['id', 'timestamp', 'itemName', 'anomalyScore', 'status', 'defectType', 'imageUrl', 'isReviewed']
  } as TableDefinition,
  table18: {
    name: 'crm_quality_vision_model',
    displayName: '품질 비전 AI 모델 상태',
    rowCount: 1,
    columnCount: 5,
    columns: ['id', 'activeModel', 'goldenSamplesCount', 'lastTrainedAt', 'anomalyThreshold']
  } as TableDefinition,
  table19: {
    name: 'crm_quality_spc_features',
    displayName: 'SPC 요인 중요도',
    rowCount: 4,
    columnCount: 4,
    columns: ['id', 'name', 'value', 'color']
  } as TableDefinition,
  table20: {
    name: 'crm_quality_spc_predictions',
    displayName: 'SPC 계측 예측',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'batch', 'value', 'cpk', 'timestamp', 'risk']
  } as TableDefinition,
  table21: {
    name: 'crm_quality_spc_samples',
    displayName: 'SPC 계측 샘플',
    rowCount: 6,
    columnCount: 5,
    columns: ['id', 'batch', 'value', 'cpk', 'timestamp']
  } as TableDefinition,
  table22: {
    name: 'crm_quality_spc_config',
    displayName: 'SPC 공정 제어 설정',
    rowCount: 1,
    columnCount: 9,
    columns: ['id', 'targetValue', 'ucl', 'lcl', 'usl', 'lsl', 'currentCpk', 'cpkStatus', 'futureRiskProbability']
  } as TableDefinition,
  table23: {
    name: 'crm_quality_sensors_timeline',
    displayName: '센서 시계열',
    rowCount: 3,
    columnCount: 6,
    columns: ['id', 'time', 'vibration', 'current', 'temperature', 'anomalyScore']
  } as TableDefinition,
  table24: {
    name: 'crm_quality_sensors_contribution',
    displayName: '센서 기여도',
    rowCount: 3,
    columnCount: 3,
    columns: ['id', 'name', 'rate']
  } as TableDefinition,
  table25: {
    name: 'crm_quality_sensors_status',
    displayName: '설비 센서 상태',
    rowCount: 1,
    columnCount: 8,
    columns: ['id', 'equipmentName', 'operationalStatus', 'vibrationRms', 'motorCurrent', 'bearingTemp', 'anomalyScore', 'threshold']
  } as TableDefinition,
  table26: {
    name: 'crm_quality_ncr_similar_cases',
    displayName: '유사 NCR 사례',
    rowCount: 2,
    columnCount: 5,
    columns: ['id', 'title', 'similarity', 'rootCause', 'actionTaken']
  } as TableDefinition,
  table27: {
    name: 'crm_quality_ncr_items',
    displayName: 'NCR 부적합 내역',
    rowCount: 3,
    columnCount: 10,
    columns: ['id', 'date', 'itemName', 'defectCode', 'defectType', 'quantity', 'reporter', 'status', 'description', 'actionPlan']
  } as TableDefinition,
  table28: {
    name: 'crm_quality_checklist_submissions',
    displayName: '체크리스트 제출 내역',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'lotNo', 'inspector', 'checkItems', 'signatureData', 'photoUrl', 'status', 'submittedAt']
  } as TableDefinition,
  table29: {
    name: 'crm_grant_company_profile',
    displayName: '지원금 매칭용 기업 프로필',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'establishmentYear', 'employeeCount', 'patentsCount', 'femaleEmployeeRatio', 'youthEmployeeRatio', 'sector']
  } as TableDefinition,
  table30: {
    name: 'crm_grant_rnd_plans',
    displayName: '지원금 R&D 계획서',
    rowCount: 0,
    columnCount: 3,
    columns: ['id', 'announcement_id', 'plan_data']
  } as TableDefinition,
  table31: {
    name: 'crm_grant_bookmarks',
    displayName: '지원금 북마크',
    rowCount: 0,
    columnCount: 2,
    columns: ['id', 'announcement_id']
  } as TableDefinition,
  table32: {
    name: 'crm_grant_announcements',
    displayName: '정부 지원금 추천 공고',
    rowCount: 3,
    columnCount: 6,
    columns: ['id', 'title', 'agency', 'match_score', 'budget', 'end_date']
  } as TableDefinition,
  table33: {
    name: 'crm_recruitment_applicants',
    displayName: '채용 지원자 관리',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'name', 'age', 'phone', 'experience', 'motivation', 'matching_score', 'status', 'signature_url', 'signed_at', 'resume_file_path', 'tech_stacks', 'interview_logs', 'ai_evaluation', 'created_at']
  } as TableDefinition,
  table34: {
    name: 'crm_financial_statements',
    displayName: '재무제표 관리',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'company_id', 'company_type', 'fiscal_year', 'fiscal_quarter', 'total_assets', 'total_liabilities', 'total_equity', 'revenue', 'operating_income', 'net_income', 'pdf_file_path', 'parsed_raw_json', 'created_at', 'updated_at']
  } as TableDefinition,
  table35: {
    name: 'safety_inspect_logs',
    displayName: '안전점검 감사 대장',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'inspect_title', 'inspect_date', 'inspector_name', 'checklist_json', 'fail_actions_json', 'created_at']
  } as TableDefinition,
  table36: {
    name: 'safety_near_misses',
    displayName: '아차사고 및 유해요소 제보 대장',
    rowCount: 1,
    columnCount: 11,
    columns: ['id', 'reporter_name', 'hazard_location', 'description', 'photo_url', 'risk_grade', 'action_status', 'action_description', 'action_photo_url', 'action_completed_at', 'created_at']
  } as TableDefinition,
  table37: {
    name: 'safety_tbm_logs',
    displayName: 'TBM 안전 교육 대장',
    rowCount: 1,
    columnCount: 8,
    columns: ['id', 'tbm_date', 'work_leader', 'weather_info', 'tbm_script', 'attendees_count', 'attendee_signatures', 'created_at']
  } as TableDefinition,
  table38: {
    name: 'safety_risk_assessments',
    displayName: 'AI 위험성평가서',
    rowCount: 1,
    columnCount: 8,
    columns: ['id', 'work_name', 'work_date', 'hazards_json', 'risk_level', 'evaluated_by', 'approved_at', 'status']
  } as TableDefinition,
  table39: {
    name: 'safety_policies',
    displayName: '안전보건방침 및 목표',
    rowCount: 1,
    columnCount: 6,
    columns: ['id', 'year', 'policy_title', 'targets_json', 'established_at', 'established_by']
  } as TableDefinition,
  table40: {
    name: 'crm_employment_certificate_logs',
    displayName: '재직증명서 발급대장',
    rowCount: 0,
    columnCount: 19,
    columns: ['id', 'staff_id', 'staff_name', 'joined_date', 'degree_level', 'major_name', 'address', 'usage', 'issue_date', 'issue_dept', 'issue_by', 'extra_data', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table41: {
    name: 'form_mappings',
    displayName: '양식 데이터 필드 매핑',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'template_id', 'field_key', 'field_label', 'pos_x', 'pos_y', 'font_size', 'font_weight', 'text_align', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table42: {
    name: 'form_templates',
    displayName: '양식 템플릿 마스터',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'template_name', 'document_type', 'file_path', 'orientation', 'is_active', 'query_sql', 'query_params', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table43: {
    name: 'ai_contextual_help',
    displayName: 'AI 도움말 캐시',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'hint_key', 'hint_text', 'ai_explanation', 'created_at']
  } as TableDefinition,
  table44: {
    name: 'system_mail_logs',
    displayName: '메일 AI 관제 로그',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'sender', 'subject', 'received_at', 'ai_summary', 'intent', 'risk_level', 'action_type', 'action_result', 'created_at']
  } as TableDefinition,
  table45: {
    name: 'system_menu_settings',
    displayName: '시스템 메뉴 설정',
    rowCount: 43,
    columnCount: 4,
    columns: ['id', 'menu_href', 'is_enabled', 'sort_order']
  } as TableDefinition,
  table46: {
    name: 'shared_dashboards',
    displayName: '공유 대시보드 관리',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'share_id', 'title', 'sql_query', 'table_name', 'display_name', 'chart_spec_json', 'briefing_markdown', 'refresh_interval', 'last_refreshed_at', 'created_at', 'is_active', 'sort_order', 'is_pinned', 'custom_title']
  } as TableDefinition,
  table47: {
    name: 'expense_projects',
    displayName: '지출 프로젝트 관리',
    rowCount: 5,
    columnCount: 10,
    columns: ['id', 'name', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table48: {
    name: 'expense_employees',
    displayName: '지출 임직원 관리',
    rowCount: 6,
    columnCount: 3,
    columns: ['id', 'name', 'created_at']
  } as TableDefinition,
  table49: {
    name: 'expense_departments',
    displayName: '지출 부서 관리',
    rowCount: 8,
    columnCount: 3,
    columns: ['id', 'name', 'created_at']
  } as TableDefinition,
  table50: {
    name: 'expense_tags',
    displayName: '통합 공통 태그 관리',
    rowCount: 10,
    columnCount: 4,
    columns: ['id', 'name', 'scope', 'created_at']
  } as TableDefinition,
  table51: {
    name: 'expense_categories',
    displayName: '지출 계정과목 관리',
    rowCount: 65,
    columnCount: 5,
    columns: ['id', 'main_category', 'mid_category', 'sub_category', 'created_at']
  } as TableDefinition,
  table52: {
    name: 'expense_settings',
    displayName: '지출 예산 설정',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'monthly_budget', 'is_alert_enabled', 'alert_threshold_percent', 'alert_sms_template', 'alert_phone', 'created_at']
  } as TableDefinition,
  table53: {
    name: 'crm_expenses',
    displayName: '지출 내역',
    rowCount: 5,
    columnCount: 23,
    columns: ['id', 'title', 'category', 'amount', 'expense_date', 'payment_method', 'attachment_url', 'ai_analysis', 'memo', 'approval_status', 'approval_memo', 'approved_at', 'actual_expense_date', 'deduction_amount', 'transfer_fee', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table54: {
    name: 'inventory_logs',
    displayName: '재고 변동 이력',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'itemId', 'itemName', 'itemType', 'changeType', 'quantity', 'price', 'operator', 'note', 'createdAt']
  } as TableDefinition,
  table55: {
    name: 'alert_logs',
    displayName: '가격 알림 발송 로그',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'log_id', 'rule_id', 'sent_price', 'sent_message', 'sent_at', 'api_response']
  } as TableDefinition,
  table56: {
    name: 'alert_rules',
    displayName: '가격 알림 규칙',
    rowCount: 1,
    columnCount: 9,
    columns: ['id', 'rule_id', 'item_id', 'rule_name', 'condition_type', 'threshold_value', 'phone_number', 'sms_template', 'is_enabled']
  } as TableDefinition,
  table57: {
    name: 'price_histories',
    displayName: '수집 가격 이력',
    rowCount: 10,
    columnCount: 7,
    columns: ['id', 'history_id', 'url_id', 'captured_price', 'captured_at', 'status', 'error_message']
  } as TableDefinition,
  table58: {
    name: 'target_urls',
    displayName: '가격 감시 URL',
    rowCount: 1,
    columnCount: 10,
    columns: ['id', 'url_id', 'item_id', 'site_name', 'target_url', 'css_selector', 'xpath', 'cron_interval', 'is_active', 'created_at']
  } as TableDefinition,
  table59: {
    name: 'tracked_items',
    displayName: '가격 추적 품목',
    rowCount: 1,
    columnCount: 9,
    columns: ['id', 'item_id', 'item_code', 'item_name', 'category', 'spec', 'base_price', 'target_margin_rate', 'created_at']
  } as TableDefinition,
  table60: {
    name: 'ai_token_usage_logs',
    displayName: 'AI 토큰 사용량 로그',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'model', 'purpose', 'prompt_tokens', 'completion_tokens', 'total_tokens', 'user_name', 'menu_path', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table61: {
    name: 'crm_inventory_inbound_items',
    displayName: '자율 입고 상세 품목',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'inbound_id', 'item_name', 'spec', 'quantity', 'price', 'barcode', 'matched_item_id', 'created_at']
  } as TableDefinition,
  table62: {
    name: 'crm_inventory_inbounds',
    displayName: '자율 입고 대장',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'partner_name', 'inbound_date', 'total_amount', 'pdf_file_path', 'created_at', 'updated_at']
  } as TableDefinition,
  table63: {
    name: 'inventory_items',
    displayName: '재고 품목',
    rowCount: 0,
    columnCount: 24,
    columns: ['id', 'type', 'name', 'category', 'price', 'partner', 'stock', 'safeStock', 'location', 'spec', 'unitType', 'unitValue', 'boxContains', 'description', 'tags', 'barcode', 'createdAt', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table64: {
    name: 'crm_partner_contacts',
    displayName: '거래처 담당자 명함첩',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'partner_id', 'name', 'position', 'phone', 'email', 'card_image_url', 'is_primary', 'created_at']
  } as TableDefinition,
  table65: {
    name: 'crm_snaptask_actions',
    displayName: '스냅태스크 AI 액션 감사록',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'task_id', 'action_type', 'description', 'created_at']
  } as TableDefinition,
  table66: {
    name: 'crm_snaptask_items',
    displayName: '스냅태스크 상세 내역',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'task_id', 'content_text', 'file_url', 'file_type', 'ai_analysis', 'created_at']
  } as TableDefinition,
  table67: {
    name: 'crm_snaptasks',
    displayName: '스냅태스크 관리',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'title', 'status', 'partner_id', 'created_at', 'updated_at']
  } as TableDefinition,
  table68: {
    name: 'crm_partners',
    displayName: '거래처 관리',
    rowCount: 0,
    columnCount: 22,
    columns: ['id', 'type', 'company_name', 'business_number', 'representative', 'phone', 'manager_name', 'manager_phone', 'email', 'address', 'vip_level', 'credit_limit', 'business_license_url', 'memo', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table69: {
    name: 'crm_sales_orders',
    displayName: '수주서 관리',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'estimate_id', 'customer_name', 'customer_phone', 'status', 'total_amount', 'created_at']
  } as TableDefinition,
  table70: {
    name: 'crm_purchase_orders',
    displayName: '발주서 관리',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'estimate_id', 'vendor_name', 'vendor_phone', 'status', 'total_amount', 'created_at', 'completed_at']
  } as TableDefinition,
  table71: {
    name: 'crm_estimate_items',
    displayName: '견적서 품목 상세',
    rowCount: 0,
    columnCount: 7,
    columns: ['id', 'estimate_id', 'product_id', 'product_name', 'quantity', 'unit_price', 'amount']
  } as TableDefinition,
  table72: {
    name: 'crm_estimates',
    displayName: '견적서 관리',
    rowCount: 0,
    columnCount: 17,
    columns: ['id', 'type', 'direction_status', 'partner_name', 'partner_phone', 'total_amount', 'file_url', 'business_license_url', 'ai_parsed', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table73: {
    name: 'crm_point_history',
    displayName: '적립금 내역',
    rowCount: 0,
    columnCount: 9,
    columns: ['id', 'customer_id', 'transaction_type', 'amount', 'balance_after', 'description', 'related_entity_type', 'related_entity_id', 'created_at']
  } as TableDefinition,
  table74: {
    name: 'crm_coupons_restrictions',
    displayName: '쿠폰 제한 관리',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'coupon_id', 'restriction_type', 'target_type', 'target_value', 'created_at']
  } as TableDefinition,
  table75: {
    name: 'coupons',
    displayName: '쿠폰 관리',
    rowCount: 0,
    columnCount: 16,
    columns: ['id', 'code', 'name', 'discount_type', 'discount_value', 'min_order_amount', 'status', 'expires_at', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table76: {
    name: 'naver_blog_marketing_settings',
    displayName: '네이버 블로그 마케팅 설정',
    rowCount: 1,
    columnCount: 8,
    columns: ['id', 'is_autopilot', 'autopilot_interval', 'autopilot_time', 'tone_style', 'naver_blog_id', 'api_client_id', 'api_client_secret']
  } as TableDefinition,
  table77: {
    name: 'crm_naver_blog_posts',
    displayName: '네이버 블로그 포스팅 이력 및 예약',
    rowCount: 0,
    columnCount: 13,
    columns: ['id', 'product_id', 'status', 'title', 'content', 'target_keywords', 'image_url', 'sub_image_url', 'scheduled_at', 'posted_at', 'error_message', 'views_count', 'likes_count']
  } as TableDefinition,
  table78: {
    name: 'instagram_marketing_settings',
    displayName: '인스타그램 마케팅 설정',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'is_autopilot', 'autopilot_interval', 'autopilot_time', 'tone_style', 'instagram_username', 'access_token']
  } as TableDefinition,
  table79: {
    name: 'crm_instagram_posts',
    displayName: '인스타그램 포스팅 이력 및 예약',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'product_id', 'status', 'content', 'image_url', 'scheduled_at', 'posted_at', 'error_message', 'likes_count', 'comments_count']
  } as TableDefinition,
  table80: {
    name: 'crm_operators',
    displayName: '운영자 권한 관리',
    rowCount: 5,
    columnCount: 13,
    columns: ['id', 'username', 'password_hash', 'name', 'role', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table81: {
    name: 'crm_deliveries',
    displayName: '배송 내역',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', 'customer_name', 'customer_phone', 'address', 'courier', 'tracking_number', 'status', 'order_id', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table82: {
    name: 'crm_reservations',
    displayName: '예약 내역',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'customer_name', 'customer_phone', 'service_name', 'reservation_date', 'reservation_time', 'status', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table83: {
    name: 'crm_payments',
    displayName: '결제 내역',
    rowCount: 0,
    columnCount: 14,
    columns: ['id', 'customer_name', 'payment_method', 'amount', 'payment_date', 'status', 'order_id', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table84: {
    name: 'crm_orders',
    displayName: '주문 내역',
    rowCount: 0,
    columnCount: 20,
    columns: ['id', 'customer_name', 'customer_phone', 'product_name', 'quantity', 'total_price', 'delivery_method', 'shipping_address', 'tracking_number', 'attachment_url', 'customer_memo', 'order_date', 'status', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table85: {
    name: 'crm_transactions',
    displayName: '거래 내역',
    rowCount: 0,
    columnCount: 8,
    columns: ['id', 'customer_name', 'customer_phone', 'product_name', 'amount', 'order_date', 'status', 'order_id']
  } as TableDefinition,
  table86: {
    name: 'products',
    displayName: '광고 상품',
    rowCount: 0,
    columnCount: 19,
    columns: ['id', 'name', 'price', 'url', 'description', 'main_image_url', 'detail_image_url', 'available_methods', 'category', 'menu_category', 'is_coupon_excludable', 'is_estimate_price', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table87: {
    name: 'ad_templates',
    displayName: '광고 템플릿',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'name', 'header', 'footer', 'opt_out']
  } as TableDefinition,
  table88: {
    name: 'message_logs',
    displayName: '발송 내역',
    rowCount: 0,
    columnCount: 6,
    columns: ['id', 'customer_id', 'phone', 'message', 'status', 'created_at']
  } as TableDefinition,
  table89: {
    name: 'message_templates',
    displayName: '문자 템플릿',
    rowCount: 0,
    columnCount: 3,
    columns: ['id', 'title', 'content']
  } as TableDefinition,
  table90: {
    name: 'crm_web_form_logs',
    displayName: '웹 양식 발급대장',
    rowCount: 23,
    columnCount: 13,
    columns: ['id', 'template_id', 'record_id', 'record_name', 'print_data', 'issue_date', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table91: {
    name: 'crm_web_templates',
    displayName: '웹 양식 템플릿 마스터',
    rowCount: 5,
    columnCount: 12,
    columns: ['id', 'template_name', 'html_content', 'document_type', 'is_active', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table92: {
    name: 'system_settings',
    displayName: '시스템 설정',
    rowCount: 1,
    columnCount: 3,
    columns: ['id', 'key', 'value']
  } as TableDefinition,
  table93: {
    name: 'crm_customers',
    displayName: '고객 명단',
    rowCount: 0,
    columnCount: 18,
    columns: ['id', 'name', 'phone', 'tags', 'memo', 'address', 'shipping_address', 'recipient_name', 'recipient_phone', 'point_balance', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table94: {
    name: 'crm_finance_forecasts',
    displayName: '수금 및 지출 예정 대장',
    rowCount: 10,
    columnCount: 8,
    columns: ['id', 'date', 'type', 'title', 'partnerName', 'amount', 'isOverdue', 'contact']
  } as TableDefinition,
  table95: {
    name: 'crm_finance_products',
    displayName: '제품 원가 기초 데이터',
    rowCount: 4,
    columnCount: 7,
    columns: ['id', 'productId', 'productName', 'rawMaterialCost', 'laborCost', 'expenseCost', 'sellingPrice']
  } as TableDefinition,
  table96: {
    name: 'crm_facility_layout',
    displayName: '공장 설비 평면 배치 및 상태',
    rowCount: 5,
    columnCount: 6,
    columns: ['id', 'name', 'status', 'oee', 'x', 'y']
  } as TableDefinition,
  table97: {
    name: 'crm_facility_oee_downtime',
    displayName: '비가동 원인 통계',
    rowCount: 5,
    columnCount: 4,
    columns: ['id', 'reason', 'minutes', 'rate']
  } as TableDefinition,
  table98: {
    name: 'crm_facility_oee_stats',
    displayName: 'OEE 설비 종합 효율 통계',
    rowCount: 1,
    columnCount: 11,
    columns: ['id', 'overallOee', 'availability', 'performance', 'quality', 'totalLoaded', 'actualRun', 'plannedStop', 'breakdownStop', 'opportunityLossKrw', 'preventedLossKrw']
  } as TableDefinition,
  table99: {
    name: 'crm_facility_parts',
    displayName: '소모성 부품 재고 관리',
    rowCount: 3,
    columnCount: 7,
    columns: ['id', 'name', 'safetyStock', 'currentStock', 'unit', 'leadTimeDays', 'risk']
  } as TableDefinition,
  table100: {
    name: 'crm_facility_events',
    displayName: '월간 정비 일정',
    rowCount: 5,
    columnCount: 5,
    columns: ['id', 'date', 'title', 'type', 'assignee']
  } as TableDefinition,
  table101: {
    name: 'crm_production_due_risk',
    displayName: '납기 준수 위험 분석',
    rowCount: 3,
    columnCount: 5,
    columns: ['id', 'orderId', 'productName', 'probability', 'status']
  } as TableDefinition,
  table102: {
    name: 'crm_production_bottlenecks',
    displayName: '설비별 누적 로드 및 병목 지수',
    rowCount: 4,
    columnCount: 5,
    columns: ['id', 'name', 'loadRate', 'status', 'queueTasks']
  } as TableDefinition,
  table103: {
    name: 'crm_production_unscheduled_orders',
    displayName: '미배정 수주 대장',
    rowCount: 3,
    columnCount: 6,
    columns: ['id', 'orderId', 'productName', 'qty', 'dueDate', 'status']
  } as TableDefinition,
  table104: {
    name: 'crm_production_gantt_tasks',
    displayName: '생산 간트 차트 작업 목록',
    rowCount: 5,
    columnCount: 9,
    columns: ['id', 'title', 'equipmentId', 'equipmentName', 'operatorName', 'startHour', 'endHour', 'progress', 'status']
  } as TableDefinition,
  table105: {
    name: 'crm_partner_credit_risks',
    displayName: '거래처 신용 위험 및 연체 지표 대장',
    rowCount: 4,
    columnCount: 8,
    columns: ['id', 'overdue_amount', 'overdue_days', 'credit_rating', 'default_probability', 'risk_level', 'last_action', 'action_date']
  } as TableDefinition,
  table106: {
    name: 'crm_labor_contracts',
    displayName: '근로계약서 독소조항 스캔 현황',
    rowCount: 2,
    columnCount: 7,
    columns: ['id', 'clause_id', 'title', 'is_illegal', 'current_text', 'recommended_text', 'reason']
  } as TableDefinition,
  table107: {
    name: 'crm_labor_stats',
    displayName: '임직원 근태 리스크 요약',
    rowCount: 4,
    columnCount: 6,
    columns: ['id', 'weekly_hours', 'overtime_hours', 'lateness_count', 'early_leave_count', 'risk_level']
  } as TableDefinition,
  table108: {
    name: 'crm_scm_suppliers',
    displayName: '협력사 스코어카드',
    rowCount: 3,
    columnCount: 5,
    columns: ['id', 'supplier_name', 'delivery_rate', 'defect_rate', 'score']
  } as TableDefinition,
  table109: {
    name: 'crm_scm_shipments',
    displayName: '실시간 수입 조달 화물 리스트',
    rowCount: 3,
    columnCount: 7,
    columns: ['id', 'item_name', 'supplier_name', 'status', 'eta', 'delay_probability', 'current_step']
  } as TableDefinition,
  table110: {
    name: 'crm_safety_zones',
    displayName: '안전 제어 구역 설정',
    rowCount: 3,
    columnCount: 4,
    columns: ['id', 'zone_name', 'risk_score', 'status']
  } as TableDefinition,
  table111: {
    name: 'crm_safety_alerts',
    displayName: 'CCTV 비상 위험 알림 로그',
    rowCount: 2,
    columnCount: 6,
    columns: ['id', 'zone_name', 'alert_level', 'detector_type', 'created_at', 'is_resolved']
  } as TableDefinition,
  table112: {
    name: 'crm_energy_equipments',
    displayName: '에너지 소모 설비 대장',
    rowCount: 4,
    columnCount: 5,
    columns: ['id', 'equipment_name', 'status', 'current_load', 'monthly_bill']
  } as TableDefinition,
  table113: {
    name: 'crm_energy_savings',
    displayName: '에너지 절감 스케줄',
    rowCount: 1,
    columnCount: 4,
    columns: ['id', 'apply_date', 'saving_amount', 'is_active']
  } as TableDefinition,
  table114: {
    name: 'pms_projects',
    displayName: 'PMS 프로젝트 대장',
    rowCount: 1,
    columnCount: 13,
    columns: ['id', 'client', 'bizNo', 'name', 'type', 'dueDate', 'folderUrl', 'estimateUrl', 'status', 'createdAt', 'details', 'processStep', 'inboundChannel']
  } as TableDefinition,
  table115: {
    name: 'ecount_rpa_lock',
    displayName: '이카운트 RPA 실행 락',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'is_locked', 'locked_by', 'locked_at', 'cooldown_until']
  } as TableDefinition,
  table116: {
    name: 'ecount_sync_schedules',
    displayName: '이카운트 ERP 동기화 스케줄',
    description: '이카운트 RPA 스크립트 백그라운드 자동 동기화 일정 저장소',
    rowCount: 0,
    columnCount: 10,
    columns: ['id', 'script_file', 'script_title', 'target_table', 'period_preset', 'run_time', 'is_active', 'last_run_at', 'next_run_at', 'created_at']
  } as TableDefinition,
  table117: {
    name: 'crm_company_event_types',
    displayName: '회사 일정 유형 마스터 대장',
    rowCount: 6,
    columnCount: 7,
    columns: ['id', 'type_key', 'type_name', 'color_theme', 'is_system', 'created_at', 'updated_at']
  } as TableDefinition,
  table118: {
    name: 'crm_operator_ai_briefing_histories',
    displayName: '임직원 AI 전사 업무 분석 이력 대장',
    rowCount: 3,
    columnCount: 10,
    columns: ['id', 'target_year_month', 'risk_score', 'alert_title', 'alert_message', 'briefing_text', 'created_at', 'created_by', 'token_usage_input', 'token_usage_output']
  } as TableDefinition,
  table119: {
    name: 'crm_operator_projects',
    displayName: '임직원 참여 프로젝트 대장',
    rowCount: 4,
    columnCount: 10,
    columns: ['id', 'operator_id', 'project_name', 'role_in_project', 'start_date', 'end_date', 'contribution_rate', 'performance_score', 'performance_evaluation', 'outcome_link']
  } as TableDefinition,
  table120: {
    name: 'crm_operator_job_history',
    displayName: '임직원 담당업무 변경이력 대장',
    rowCount: 4,
    columnCount: 6,
    columns: ['id', 'operator_id', 'assignment_date', 'job_description', 'prev_job_description', 'is_current']
  } as TableDefinition,
  table121: {
    name: 'crm_operator_families',
    displayName: '임직원 부양가족 대장',
    rowCount: 4,
    columnCount: 8,
    columns: ['id', 'operator_id', 'relation_type', 'name', 'birth_date', 'phone_number', 'is_dependent', 'remarks']
  } as TableDefinition,
  table122: {
    name: 'crm_operator_reputations',
    displayName: '임직원 다차원 평판 대장',
    rowCount: 5,
    columnCount: 9,
    columns: ['id', 'operator_id', 'evaluation_date', 'evaluator_id', 'source_type', 'score', 'positive_feedback', 'constructive_feedback', 'updated_at']
  } as TableDefinition,
  table123: {
    name: 'crm_operator_incidents',
    displayName: '임직원 대내외 사건사고 대장',
    rowCount: 2,
    columnCount: 9,
    columns: ['id', 'operator_id', 'occurred_date', 'severity', 'title', 'description', 'status', 'outcome', 'updated_at']
  } as TableDefinition,
  table124: {
    name: 'crm_operator_medical',
    displayName: '임직원 병력 치료 대장',
    rowCount: 1,
    columnCount: 8,
    columns: ['id', 'operator_id', 'diagnosis_name', 'treatment_start_date', 'treatment_end_date', 'hospital_name', 'sick_leave_days', 'work_limitations']
  } as TableDefinition,
  table125: {
    name: 'crm_operator_family_events',
    displayName: '임직원 경조사 지원 대장',
    rowCount: 2,
    columnCount: 7,
    columns: ['id', 'operator_id', 'event_date', 'relation', 'type', 'congratulation_money', 'wreath_provided']
  } as TableDefinition,
  table126: {
    name: 'crm_operator_awards',
    displayName: '임직원 상벌 징계 대장',
    rowCount: 2,
    columnCount: 8,
    columns: ['id', 'operator_id', 'record_date', 'type', 'title', 'content', 'authority', 'remarks']
  } as TableDefinition,
  table127: {
    name: 'crm_operator_promotions',
    displayName: '임직원 승진발령 대장',
    rowCount: 2,
    columnCount: 8,
    columns: ['id', 'operator_id', 'change_date', 'prev_dept', 'next_dept', 'prev_role', 'next_role', 'promotion_reason']
  } as TableDefinition,
  table128: {
    name: 'crm_operator_salaries',
    displayName: '임직원 급여상여 이력 대장',
    rowCount: 6,
    columnCount: 12,
    columns: ['id', 'operator_id', 'payment_year_month', 'base_salary', 'bonus_amount', 'weekly_holiday_allowance', 'overtime_allowance', 'meal_allowance', 'deduction_amount', 'net_salary', 'payment_date', 'status']
  } as TableDefinition,
  table129: {
    name: 'crm_operator_careers',
    displayName: '임직원 이전경력 대장',
    rowCount: 3,
    columnCount: 9,
    columns: ['id', 'operator_id', 'company_name', 'department', 'job_title', 'join_date', 'retire_date', 'assigned_task', 'leaving_reason']
  } as TableDefinition,
  table130: {
    name: 'crm_operator_licenses',
    displayName: '임직원 자격면허 대장',
    rowCount: 6,
    columnCount: 7,
    columns: ['id', 'operator_id', 'license_name', 'issuer', 'license_no', 'acquisition_date', 'expiry_date']
  } as TableDefinition,
  table131: {
    name: 'crm_operator_education',
    displayName: '임직원 학력이력 대장',
    rowCount: 1,
    columnCount: 8,
    columns: ['id', 'operator_id', 'school_name', 'major', 'degree', 'entrance_date', 'graduation_date', 'status']
  } as TableDefinition,
  table132: {
    name: 'crm_operator_profiles',
    displayName: '임직원 인적사항 상세 대장',
    rowCount: 4,
    columnCount: 8,
    columns: ['id', 'operator_id', 'department', 'hire_date', 'commute_area', 'skills', 'backup_operator_id', 'updated_at']
  } as TableDefinition,
  table133: {
    name: 'crm_operator_contract_settings',
    displayName: '임직원 근로 계약 조건 대장',
    rowCount: 4,
    columnCount: 8,
    columns: ['id', 'operator_id', 'hourly_wage', 'weekly_hours', 'allow_weekly_holiday_paid', 'work_days', 'contract_memo', 'updated_at']
  } as TableDefinition,
  table134: {
    name: 'crm_company_events',
    displayName: '전사 회사 일정 공유 대장',
    rowCount: 3,
    columnCount: 8,
    columns: ['id', 'title', 'start_date', 'end_date', 'event_type', 'description', 'created_by', 'created_at']
  } as TableDefinition,
  table135: {
    name: 'crm_operator_leave_balances',
    displayName: '직원별 연차 잔액 관리',
    rowCount: 4,
    columnCount: 6,
    columns: ['id', 'operator_id', 'total_allowed', 'used', 'remaining', 'updated_at']
  } as TableDefinition,
  table136: {
    name: 'crm_annual_leaves',
    displayName: '직원 연차 신청 결재 대장',
    rowCount: 2,
    columnCount: 12,
    columns: ['id', 'operator_id', 'leave_type', 'start_date', 'end_date', 'days_spent', 'status', 'reason', 'reject_reason', 'approver_id', 'created_at', 'updated_at']
  } as TableDefinition,
  table137: {
    name: 'crm_attendance',
    displayName: '직원 근태 대장',
    rowCount: 7,
    columnCount: 10,
    columns: ['id', 'operator_id', 'work_date', 'clock_in', 'clock_out', 'status', 'working_hours', 'memo', 'created_at', 'updated_at']
  } as TableDefinition,
  table138: {
    name: 'user_feedbacks',
    displayName: '사용자 피드백 및 버그 제보',
    rowCount: 11,
    columnCount: 6,
    columns: ['id', 'user_prompt', 'detected_type', 'current_url', 'resolved_status', 'created_at']
  } as TableDefinition,
  table139: {
    name: 'tenant_menu_settings',
    displayName: '테넌트 메뉴 설정',
    rowCount: 0,
    columnCount: 5,
    columns: ['id', 'tenant_id', 'menu_href', 'is_enabled', 'sort_order']
  } as TableDefinition,
  table140: {
    name: 'exchange_rate_histories',
    displayName: '환율 변동 이력',
    rowCount: 440,
    columnCount: 5,
    columns: ['id', 'history_id', 'currency_code', 'rate_value', 'captured_date']
  } as TableDefinition,
  table141: {
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
  table1: 'crm_credential_audit_logs',
  table2: 'crm_credential_emergency_requests',
  table3: 'crm_credential_vault',
  table4: 'rnd_compliance_alarms',
  table5: 'rnd_logs',
  table6: 'rnd_spaces',
  table7: 'rnd_staffs',
  table8: 'rnd_centers',
  table9: 'crm_facility_predictive_part_rul',
  table10: 'crm_facility_predictive_fft',
  table11: 'crm_facility_predictive_vibration',
  table12: 'crm_facility_predictive_summary',
  table13: 'crm_facility_repair_solutions',
  table14: 'crm_facility_repair_logs',
  table15: 'crm_facility_checklists',
  table16: 'crm_facilities',
  table17: 'crm_quality_vision_logs',
  table18: 'crm_quality_vision_model',
  table19: 'crm_quality_spc_features',
  table20: 'crm_quality_spc_predictions',
  table21: 'crm_quality_spc_samples',
  table22: 'crm_quality_spc_config',
  table23: 'crm_quality_sensors_timeline',
  table24: 'crm_quality_sensors_contribution',
  table25: 'crm_quality_sensors_status',
  table26: 'crm_quality_ncr_similar_cases',
  table27: 'crm_quality_ncr_items',
  table28: 'crm_quality_checklist_submissions',
  table29: 'crm_grant_company_profile',
  table30: 'crm_grant_rnd_plans',
  table31: 'crm_grant_bookmarks',
  table32: 'crm_grant_announcements',
  table33: 'crm_recruitment_applicants',
  table34: 'crm_financial_statements',
  table35: 'safety_inspect_logs',
  table36: 'safety_near_misses',
  table37: 'safety_tbm_logs',
  table38: 'safety_risk_assessments',
  table39: 'safety_policies',
  table40: 'crm_employment_certificate_logs',
  table41: 'form_mappings',
  table42: 'form_templates',
  table43: 'ai_contextual_help',
  table44: 'system_mail_logs',
  table45: 'system_menu_settings',
  table46: 'shared_dashboards',
  table47: 'expense_projects',
  table48: 'expense_employees',
  table49: 'expense_departments',
  table50: 'expense_tags',
  table51: 'expense_categories',
  table52: 'expense_settings',
  table53: 'crm_expenses',
  table54: 'inventory_logs',
  table55: 'alert_logs',
  table56: 'alert_rules',
  table57: 'price_histories',
  table58: 'target_urls',
  table59: 'tracked_items',
  table60: 'ai_token_usage_logs',
  table61: 'crm_inventory_inbound_items',
  table62: 'crm_inventory_inbounds',
  table63: 'inventory_items',
  table64: 'crm_partner_contacts',
  table65: 'crm_snaptask_actions',
  table66: 'crm_snaptask_items',
  table67: 'crm_snaptasks',
  table68: 'crm_partners',
  table69: 'crm_sales_orders',
  table70: 'crm_purchase_orders',
  table71: 'crm_estimate_items',
  table72: 'crm_estimates',
  table73: 'crm_point_history',
  table74: 'crm_coupons_restrictions',
  table75: 'coupons',
  table76: 'naver_blog_marketing_settings',
  table77: 'crm_naver_blog_posts',
  table78: 'instagram_marketing_settings',
  table79: 'crm_instagram_posts',
  table80: 'crm_operators',
  table81: 'crm_deliveries',
  table82: 'crm_reservations',
  table83: 'crm_payments',
  table84: 'crm_orders',
  table85: 'crm_transactions',
  table86: 'products',
  table87: 'ad_templates',
  table88: 'message_logs',
  table89: 'message_templates',
  table90: 'crm_web_form_logs',
  table91: 'crm_web_templates',
  table92: 'system_settings',
  table93: 'crm_customers',
  table94: 'crm_finance_forecasts',
  table95: 'crm_finance_products',
  table96: 'crm_facility_layout',
  table97: 'crm_facility_oee_downtime',
  table98: 'crm_facility_oee_stats',
  table99: 'crm_facility_parts',
  table100: 'crm_facility_events',
  table101: 'crm_production_due_risk',
  table102: 'crm_production_bottlenecks',
  table103: 'crm_production_unscheduled_orders',
  table104: 'crm_production_gantt_tasks',
  table105: 'crm_partner_credit_risks',
  table106: 'crm_labor_contracts',
  table107: 'crm_labor_stats',
  table108: 'crm_scm_suppliers',
  table109: 'crm_scm_shipments',
  table110: 'crm_safety_zones',
  table111: 'crm_safety_alerts',
  table112: 'crm_energy_equipments',
  table113: 'crm_energy_savings',
  table114: 'pms_projects',
  table115: 'ecount_rpa_lock',
  table116: 'ecount_sync_schedules',
  table117: 'crm_company_event_types',
  table118: 'crm_operator_ai_briefing_histories',
  table119: 'crm_operator_projects',
  table120: 'crm_operator_job_history',
  table121: 'crm_operator_families',
  table122: 'crm_operator_reputations',
  table123: 'crm_operator_incidents',
  table124: 'crm_operator_medical',
  table125: 'crm_operator_family_events',
  table126: 'crm_operator_awards',
  table127: 'crm_operator_promotions',
  table128: 'crm_operator_salaries',
  table129: 'crm_operator_careers',
  table130: 'crm_operator_licenses',
  table131: 'crm_operator_education',
  table132: 'crm_operator_profiles',
  table133: 'crm_operator_contract_settings',
  table134: 'crm_company_events',
  table135: 'crm_operator_leave_balances',
  table136: 'crm_annual_leaves',
  table137: 'crm_attendance',
  table138: 'user_feedbacks',
  table139: 'tenant_menu_settings',
  table140: 'exchange_rate_histories',
  table141: 'exchange_rates'
} as const;
