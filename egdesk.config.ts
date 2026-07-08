/**
 * EGDesk User Data Configuration
 * Generated at: 2026-07-08T02:51:35.295Z
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
    name: 'import_master',
    displayName: '수입 발주 마스터',
    rowCount: 1,
    columnCount: 22,
    columns: []
  } as TableDefinition,
  table2: {
    name: 'import_finance',
    displayName: '수입 정산 관리',
    rowCount: 1,
    columnCount: 18,
    columns: []
  } as TableDefinition,
  table3: {
    name: 'import_items',
    displayName: '수입 품목 상세',
    rowCount: 1,
    columnCount: 21,
    columns: []
  } as TableDefinition,
  table4: {
    name: 'crm_partners',
    displayName: '거래처 관리',
    rowCount: 1,
    columnCount: 25,
    columns: []
  } as TableDefinition,
  table5: {
    name: 'crm_inbound_excel_signatures',
    displayName: '엑셀 입고 자동 매핑',
    rowCount: 0,
    columnCount: 13,
    columns: []
  } as TableDefinition,
  table6: {
    name: 'crm_excel_signatures',
    displayName: '엑셀 헤더 자동 승인',
    rowCount: 1,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table7: {
    name: 'crm_inventory_inbounds',
    displayName: '자율 입고 대장',
    rowCount: 2,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table8: {
    name: 'crm_governance_logs',
    displayName: 'AI 결재 및 데이터 거버넌스 감사록',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table9: {
    name: 'rnd_compliance_alarms',
    displayName: '규제 준수 모니터링 및 알림',
    rowCount: 1,
    columnCount: 17,
    columns: []
  } as TableDefinition,
  table10: {
    name: 'rnd_logs',
    displayName: 'R&D 연구개발 일지 및 AI 생성 데이터',
    rowCount: 2,
    columnCount: 22,
    columns: []
  } as TableDefinition,
  table11: {
    name: 'rnd_spaces',
    displayName: '연구 공간 자가 실사 및 Vision AI 분석 이력',
    rowCount: 1,
    columnCount: 19,
    columns: []
  } as TableDefinition,
  table12: {
    name: 'rnd_staffs',
    displayName: '연구원 정보 및 자격 정보',
    rowCount: 4,
    columnCount: 20,
    columns: []
  } as TableDefinition,
  table13: {
    name: 'rnd_centers',
    displayName: '기업부설연구소 기본 정보',
    rowCount: 1,
    columnCount: 19,
    columns: []
  } as TableDefinition,
  table14: {
    name: 'crm_facility_predictive_part_rul',
    displayName: '설비 부품 수명 RUL',
    rowCount: 3,
    columnCount: 13,
    columns: []
  } as TableDefinition,
  table15: {
    name: 'crm_facility_predictive_fft',
    displayName: '설비 주파수 분석',
    rowCount: 4,
    columnCount: 12,
    columns: []
  } as TableDefinition,
  table16: {
    name: 'crm_facility_predictive_vibration',
    displayName: '설비 진동 센서 이력',
    rowCount: 6,
    columnCount: 11,
    columns: []
  } as TableDefinition,
  table17: {
    name: 'crm_facility_predictive_summary',
    displayName: '설비 건전도 요약',
    rowCount: 1,
    columnCount: 12,
    columns: []
  } as TableDefinition,
  table18: {
    name: 'crm_facility_repair_solutions',
    displayName: '설비 고장 해결 가이드',
    rowCount: 2,
    columnCount: 13,
    columns: []
  } as TableDefinition,
  table19: {
    name: 'crm_facility_repair_logs',
    displayName: '설비 수리 이력 대장',
    rowCount: 1,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table20: {
    name: 'crm_facility_checklists',
    displayName: '설비 예방 점검 이력',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table21: {
    name: 'crm_facilities',
    displayName: '설비 대장 관리',
    rowCount: 2,
    columnCount: 19,
    columns: []
  } as TableDefinition,
  table22: {
    name: 'crm_quality_vision_logs',
    displayName: '품질 비전 판정 이력',
    rowCount: 3,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table23: {
    name: 'crm_quality_vision_model',
    displayName: '품질 비전 AI 모델 상태',
    rowCount: 1,
    columnCount: 12,
    columns: []
  } as TableDefinition,
  table24: {
    name: 'crm_quality_spc_features',
    displayName: 'SPC 요인 중요도',
    rowCount: 4,
    columnCount: 11,
    columns: []
  } as TableDefinition,
  table25: {
    name: 'crm_quality_spc_predictions',
    displayName: 'SPC 계측 예측',
    rowCount: 5,
    columnCount: 13,
    columns: []
  } as TableDefinition,
  table26: {
    name: 'crm_quality_spc_samples',
    displayName: 'SPC 계측 샘플',
    rowCount: 6,
    columnCount: 12,
    columns: []
  } as TableDefinition,
  table27: {
    name: 'crm_quality_spc_config',
    displayName: 'SPC 공정 제어 설정',
    rowCount: 1,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table28: {
    name: 'crm_quality_sensors_timeline',
    displayName: '센서 시계열',
    rowCount: 3,
    columnCount: 13,
    columns: []
  } as TableDefinition,
  table29: {
    name: 'crm_quality_sensors_contribution',
    displayName: '센서 기여도',
    rowCount: 3,
    columnCount: 10,
    columns: []
  } as TableDefinition,
  table30: {
    name: 'crm_quality_sensors_status',
    displayName: '설비 센서 상태',
    rowCount: 1,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table31: {
    name: 'crm_quality_ncr_similar_cases',
    displayName: '유사 NCR 사례',
    rowCount: 2,
    columnCount: 12,
    columns: []
  } as TableDefinition,
  table32: {
    name: 'crm_quality_ncr_items',
    displayName: 'NCR 부적합 내역',
    rowCount: 3,
    columnCount: 17,
    columns: []
  } as TableDefinition,
  table33: {
    name: 'crm_quality_checklist_submissions',
    displayName: '체크리스트 제출 내역',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table34: {
    name: 'crm_grant_company_profile',
    displayName: '지원금 매칭용 기업 프로필',
    rowCount: 5,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table35: {
    name: 'crm_grant_rnd_plans',
    displayName: '지원금 R&D 계획서',
    rowCount: 0,
    columnCount: 10,
    columns: []
  } as TableDefinition,
  table36: {
    name: 'crm_grant_bookmarks',
    displayName: '지원금 북마크',
    rowCount: 0,
    columnCount: 9,
    columns: []
  } as TableDefinition,
  table37: {
    name: 'crm_recruitment_applicants',
    displayName: '채용 지원자 관리',
    rowCount: 0,
    columnCount: 22,
    columns: []
  } as TableDefinition,
  table38: {
    name: 'crm_financial_analysis_logs',
    displayName: 'AI 재무 분석 로그',
    rowCount: 0,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table39: {
    name: 'crm_financial_statement_items',
    displayName: '재무제표 상세 계정과목',
    rowCount: 0,
    columnCount: 13,
    columns: []
  } as TableDefinition,
  table40: {
    name: 'crm_financial_statements',
    displayName: '재무제표 관리',
    rowCount: 0,
    columnCount: 20,
    columns: []
  } as TableDefinition,
  table41: {
    name: 'safety_inspect_logs',
    displayName: '안전점검 감사 대장',
    rowCount: 0,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table42: {
    name: 'safety_near_misses',
    displayName: '아차사고 및 유해요소 제보 대장',
    rowCount: 1,
    columnCount: 18,
    columns: []
  } as TableDefinition,
  table43: {
    name: 'safety_tbm_logs',
    displayName: 'TBM 안전 교육 대장',
    rowCount: 1,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table44: {
    name: 'safety_risk_assessments',
    displayName: 'AI 위험성평가서',
    rowCount: 1,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table45: {
    name: 'safety_policies',
    displayName: '안전보건방침 및 목표',
    rowCount: 1,
    columnCount: 13,
    columns: []
  } as TableDefinition,
  table46: {
    name: 'ai_contextual_help',
    displayName: 'AI 도움말 캐시',
    rowCount: 11,
    columnCount: 12,
    columns: []
  } as TableDefinition,
  table47: {
    name: 'system_mail_logs',
    displayName: '메일 AI 관제 로그',
    rowCount: 0,
    columnCount: 17,
    columns: []
  } as TableDefinition,
  table48: {
    name: 'system_menu_settings',
    displayName: '시스템 메뉴 설정',
    rowCount: 46,
    columnCount: 11,
    columns: []
  } as TableDefinition,
  table49: {
    name: 'shared_dashboards',
    displayName: '공유 대시보드 관리',
    rowCount: 0,
    columnCount: 22,
    columns: []
  } as TableDefinition,
  table50: {
    name: 'expense_employees',
    displayName: '지출 임직원 관리',
    rowCount: 6,
    columnCount: 10,
    columns: []
  } as TableDefinition,
  table51: {
    name: 'expense_departments',
    displayName: '지출 부서 관리',
    rowCount: 8,
    columnCount: 10,
    columns: []
  } as TableDefinition,
  table52: {
    name: 'expense_tags',
    displayName: '통합 공통 태그 관리',
    rowCount: 10,
    columnCount: 11,
    columns: []
  } as TableDefinition,
  table53: {
    name: 'expense_categories',
    displayName: '지출 계정과목 관리',
    rowCount: 65,
    columnCount: 12,
    columns: []
  } as TableDefinition,
  table54: {
    name: 'expense_settings',
    displayName: '지출 예산 설정',
    rowCount: 1,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table55: {
    name: 'inventory_logs',
    displayName: '재고 변동 이력',
    rowCount: 20,
    columnCount: 17,
    columns: []
  } as TableDefinition,
  table56: {
    name: 'alert_logs',
    displayName: '가격 알림 발송 로그',
    rowCount: 0,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table57: {
    name: 'alert_rules',
    displayName: '가격 알림 규칙',
    rowCount: 1,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table58: {
    name: 'price_histories',
    displayName: '수집 가격 이력',
    rowCount: 10,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table59: {
    name: 'target_urls',
    displayName: '가격 감시 URL',
    rowCount: 1,
    columnCount: 17,
    columns: []
  } as TableDefinition,
  table60: {
    name: 'tracked_items',
    displayName: '가격 추적 품목',
    rowCount: 1,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table61: {
    name: 'crm_inventory_inbound_items',
    displayName: '자율 입고 상세 품목',
    rowCount: 20,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table62: {
    name: 'crm_partner_contacts',
    displayName: '거래처 담당자 명함첩',
    rowCount: 8,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table63: {
    name: 'crm_snaptask_actions',
    displayName: '스냅태스크 AI 액션 감사록',
    rowCount: 0,
    columnCount: 12,
    columns: []
  } as TableDefinition,
  table64: {
    name: 'crm_snaptask_items',
    displayName: '스냅태스크 상세 내역',
    rowCount: 0,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table65: {
    name: 'crm_snaptasks',
    displayName: '스냅태스크 관리',
    rowCount: 0,
    columnCount: 12,
    columns: []
  } as TableDefinition,
  table66: {
    name: 'crm_sales_orders',
    displayName: '수주서 관리',
    rowCount: 8,
    columnCount: 18,
    columns: []
  } as TableDefinition,
  table67: {
    name: 'crm_purchase_orders',
    displayName: '발주서 관리',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table68: {
    name: 'crm_point_history',
    displayName: '적립금 내역',
    rowCount: 0,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table69: {
    name: 'crm_coupons_restrictions',
    displayName: '쿠폰 제한 관리',
    rowCount: 0,
    columnCount: 13,
    columns: []
  } as TableDefinition,
  table70: {
    name: 'naver_blog_marketing_settings',
    displayName: '네이버 블로그 마케팅 설정',
    rowCount: 1,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table71: {
    name: 'crm_naver_blog_posts',
    displayName: '네이버 블로그 포스팅 이력 및 예약',
    rowCount: 0,
    columnCount: 20,
    columns: []
  } as TableDefinition,
  table72: {
    name: 'instagram_marketing_settings',
    displayName: '인스타그램 마케팅 설정',
    rowCount: 1,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table73: {
    name: 'crm_instagram_posts',
    displayName: '인스타그램 포스팅 이력 및 예약',
    rowCount: 0,
    columnCount: 17,
    columns: []
  } as TableDefinition,
  table74: {
    name: 'crm_operators',
    displayName: '운영자 권한 관리',
    rowCount: 5,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table75: {
    name: 'system_settings',
    displayName: '시스템 설정',
    rowCount: 16,
    columnCount: 10,
    columns: []
  } as TableDefinition,
  table76: {
    name: 'crm_transactions',
    displayName: '거래 내역',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table77: {
    name: 'ad_templates',
    displayName: '광고 템플릿',
    rowCount: 0,
    columnCount: 12,
    columns: []
  } as TableDefinition,
  table78: {
    name: 'message_logs',
    displayName: '발송 내역',
    rowCount: 5,
    columnCount: 13,
    columns: []
  } as TableDefinition,
  table79: {
    name: 'message_templates',
    displayName: '문자 템플릿',
    rowCount: 0,
    columnCount: 10,
    columns: []
  } as TableDefinition,
  table80: {
    name: 'crm_customers',
    displayName: '고객 명단',
    rowCount: 5,
    columnCount: 19,
    columns: []
  } as TableDefinition,
  table81: {
    name: 'crm_expenses',
    displayName: '지출 내역',
    rowCount: 0,
    columnCount: 24,
    columns: []
  } as TableDefinition,
  table82: {
    name: 'crm_estimate_items',
    displayName: '견적서 품목 상세',
    rowCount: 70,
    columnCount: 18,
    columns: []
  } as TableDefinition,
  table83: {
    name: 'crm_estimates',
    displayName: '견적서 관리',
    rowCount: 12,
    columnCount: 21,
    columns: []
  } as TableDefinition,
  table84: {
    name: 'crm_partner_ai_reports',
    displayName: '거래처 AI 리스크 보고서',
    rowCount: 3,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table85: {
    name: 'crm_grant_announcements',
    displayName: '정부 지원금 추천 공고',
    rowCount: 796,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table86: {
    name: 'system_shared_views',
    displayName: 'system_shared_views',
    description: 'Imported from user_database_export_2026-06-20.sql',
    rowCount: 2,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table87: {
    name: 'user_data_embedding_metadata',
    displayName: 'user_data_embedding_metadata',
    description: 'Imported from user_database_export_2026-06-20.sql',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table88: {
    name: 'user_data_embeddings',
    displayName: 'user_data_embeddings',
    description: 'Imported from user_database_export_2026-06-20.sql',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table89: {
    name: 'sync_activity_log',
    displayName: 'sync_activity_log',
    description: 'Imported from user_database_export_2026-06-20.sql',
    rowCount: 0,
    columnCount: 19,
    columns: []
  } as TableDefinition,
  table90: {
    name: 'sync_configurations',
    displayName: 'sync_configurations',
    description: 'Imported from user_database_export_2026-06-20.sql',
    rowCount: 0,
    columnCount: 30,
    columns: []
  } as TableDefinition,
  table91: {
    name: 'user_data_files',
    displayName: 'user_data_files',
    description: 'Imported from user_database_export_2026-06-20.sql',
    rowCount: 0,
    columnCount: 21,
    columns: []
  } as TableDefinition,
  table92: {
    name: 'crm_interpretation_logs',
    displayName: '실시간 통역 AI 발화 로그',
    rowCount: 0,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table93: {
    name: 'crm_interpretation_sessions',
    displayName: '실시간 통역 AI 세션',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table94: {
    name: 'easybot_rules_history',
    displayName: '이지봇 규칙 변경 이력 대장',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table95: {
    name: 'easybot_rules',
    displayName: '이지봇 자율 감시 규칙 대장',
    rowCount: 2,
    columnCount: 17,
    columns: []
  } as TableDefinition,
  table96: {
    name: 'easybot_action_audit_logs',
    displayName: '이지봇 AI 감사 로그',
    rowCount: 0,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table97: {
    name: 'crm_web_published_sites',
    displayName: '홈페이지 다변화 배포 관리',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table98: {
    name: 'crm_deadstock_proposals',
    displayName: '불용자재 제안 메일 로그',
    rowCount: 0,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table99: {
    name: 'crm_meeting_tasks',
    displayName: '회의 할 일 및 일정',
    rowCount: 0,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table100: {
    name: 'crm_meetings',
    displayName: '회의 대장',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table101: {
    name: 'exchange_rates',
    displayName: '실시간 환율',
    rowCount: 0,
    columnCount: 8,
    columns: []
  } as TableDefinition,
  table102: {
    name: 'tenant_menu_settings',
    displayName: '테넌트 메뉴 설정',
    rowCount: 0,
    columnCount: 5,
    columns: []
  } as TableDefinition,
  table103: {
    name: 'exchange_rate_histories',
    displayName: '환율 변동 이력',
    rowCount: 0,
    columnCount: 5,
    columns: []
  } as TableDefinition,
  table104: {
    name: 'user_feedbacks',
    displayName: '사용자 피드백 및 버그 제보',
    rowCount: 1,
    columnCount: 6,
    columns: []
  } as TableDefinition,
  table105: {
    name: 'crm_attendance',
    displayName: '직원 근태 대장',
    rowCount: 0,
    columnCount: 10,
    columns: []
  } as TableDefinition,
  table106: {
    name: 'crm_operator_leave_balances',
    displayName: '직원별 연차 잔액 관리',
    rowCount: 0,
    columnCount: 6,
    columns: []
  } as TableDefinition,
  table107: {
    name: 'crm_annual_leaves',
    displayName: '직원 연차 신청 결재 대장',
    rowCount: 0,
    columnCount: 12,
    columns: []
  } as TableDefinition,
  table108: {
    name: 'crm_company_events',
    displayName: '전사 회사 일정 공유 대장',
    rowCount: 0,
    columnCount: 8,
    columns: []
  } as TableDefinition,
  table109: {
    name: 'crm_operator_contract_settings',
    displayName: '임직원 근로 계약 조건 대장',
    rowCount: 0,
    columnCount: 8,
    columns: []
  } as TableDefinition,
  table110: {
    name: 'crm_operator_profiles',
    displayName: '임직원 인적사항 상세 대장',
    rowCount: 0,
    columnCount: 8,
    columns: []
  } as TableDefinition,
  table111: {
    name: 'crm_operator_licenses',
    displayName: '임직원 자격면허 대장',
    rowCount: 0,
    columnCount: 7,
    columns: []
  } as TableDefinition,
  table112: {
    name: 'crm_operator_education',
    displayName: '임직원 학력이력 대장',
    rowCount: 0,
    columnCount: 8,
    columns: []
  } as TableDefinition,
  table113: {
    name: 'crm_operator_careers',
    displayName: '임직원 이전경력 대장',
    rowCount: 0,
    columnCount: 9,
    columns: []
  } as TableDefinition,
  table114: {
    name: 'crm_operator_salaries',
    displayName: '임직원 급여상여 이력 대장',
    rowCount: 0,
    columnCount: 12,
    columns: []
  } as TableDefinition,
  table115: {
    name: 'crm_operator_awards',
    displayName: '임직원 상벌 징계 대장',
    rowCount: 0,
    columnCount: 8,
    columns: []
  } as TableDefinition,
  table116: {
    name: 'crm_operator_promotions',
    displayName: '임직원 승진발령 대장',
    rowCount: 0,
    columnCount: 8,
    columns: []
  } as TableDefinition,
  table117: {
    name: 'crm_operator_family_events',
    displayName: '임직원 경조사 지원 대장',
    rowCount: 0,
    columnCount: 7,
    columns: []
  } as TableDefinition,
  table118: {
    name: 'crm_operator_incidents',
    displayName: '임직원 대내외 사건사고 대장',
    rowCount: 0,
    columnCount: 9,
    columns: []
  } as TableDefinition,
  table119: {
    name: 'crm_operator_medical',
    displayName: '임직원 병력 치료 대장',
    rowCount: 0,
    columnCount: 8,
    columns: []
  } as TableDefinition,
  table120: {
    name: 'crm_operator_reputations',
    displayName: '임직원 다차원 평판 대장',
    rowCount: 0,
    columnCount: 9,
    columns: []
  } as TableDefinition,
  table121: {
    name: 'crm_operator_families',
    displayName: '임직원 부양가족 대장',
    rowCount: 0,
    columnCount: 8,
    columns: []
  } as TableDefinition,
  table122: {
    name: 'crm_operator_job_history',
    displayName: '임직원 담당업무 변경이력 대장',
    rowCount: 0,
    columnCount: 6,
    columns: []
  } as TableDefinition,
  table123: {
    name: 'crm_operator_ai_briefing_histories',
    displayName: '임직원 AI 전사 업무 분석 이력 대장',
    rowCount: 1,
    columnCount: 10,
    columns: []
  } as TableDefinition,
  table124: {
    name: 'crm_operator_projects',
    displayName: '임직원 참여 프로젝트 대장',
    rowCount: 0,
    columnCount: 10,
    columns: []
  } as TableDefinition,
  table125: {
    name: 'crm_company_event_types',
    displayName: '회사 일정 유형 마스터 대장',
    rowCount: 0,
    columnCount: 7,
    columns: []
  } as TableDefinition,
  table126: {
    name: 'ecount_sync_schedules',
    displayName: '이카운트 ERP 동기화 스케줄',
    rowCount: 0,
    columnCount: 10,
    columns: []
  } as TableDefinition,
  table127: {
    name: 'pms_projects',
    displayName: 'PMS 프로젝트 대장',
    rowCount: 0,
    columnCount: 13,
    columns: []
  } as TableDefinition,
  table128: {
    name: 'ecount_rpa_lock',
    displayName: '이카운트 RPA 실행 락',
    rowCount: 0,
    columnCount: 5,
    columns: []
  } as TableDefinition,
  table129: {
    name: 'crm_energy_savings',
    displayName: '에너지 절감 스케줄',
    rowCount: 0,
    columnCount: 4,
    columns: []
  } as TableDefinition,
  table130: {
    name: 'crm_safety_alerts',
    displayName: 'CCTV 비상 위험 알림 로그',
    rowCount: 0,
    columnCount: 6,
    columns: []
  } as TableDefinition,
  table131: {
    name: 'crm_energy_equipments',
    displayName: '에너지 소모 설비 대장',
    rowCount: 0,
    columnCount: 5,
    columns: []
  } as TableDefinition,
  table132: {
    name: 'crm_safety_zones',
    displayName: '안전 제어 구역 설정',
    rowCount: 0,
    columnCount: 4,
    columns: []
  } as TableDefinition,
  table133: {
    name: 'crm_scm_shipments',
    displayName: '실시간 수입 조달 화물 리스트',
    rowCount: 0,
    columnCount: 7,
    columns: []
  } as TableDefinition,
  table134: {
    name: 'crm_labor_stats',
    displayName: '임직원 근태 리스크 요약',
    rowCount: 0,
    columnCount: 6,
    columns: []
  } as TableDefinition,
  table135: {
    name: 'crm_scm_suppliers',
    displayName: '협력사 스코어카드',
    rowCount: 0,
    columnCount: 5,
    columns: []
  } as TableDefinition,
  table136: {
    name: 'crm_labor_contracts',
    displayName: '근로계약서 독소조항 스캔 현황',
    rowCount: 0,
    columnCount: 7,
    columns: []
  } as TableDefinition,
  table137: {
    name: 'crm_partner_credit_risks',
    displayName: '거래처 신용 위험 및 연체 지표 대장',
    rowCount: 0,
    columnCount: 8,
    columns: []
  } as TableDefinition,
  table138: {
    name: 'crm_production_gantt_tasks',
    displayName: '생산 간트 차트 작업 목록',
    rowCount: 0,
    columnCount: 9,
    columns: []
  } as TableDefinition,
  table139: {
    name: 'crm_production_bottlenecks',
    displayName: '설비별 누적 로드 및 병목 지수',
    rowCount: 0,
    columnCount: 5,
    columns: []
  } as TableDefinition,
  table140: {
    name: 'crm_production_unscheduled_orders',
    displayName: '미배정 수주 대장',
    rowCount: 0,
    columnCount: 6,
    columns: []
  } as TableDefinition,
  table141: {
    name: 'crm_production_due_risk',
    displayName: '납기 준수 위험 분석',
    rowCount: 0,
    columnCount: 5,
    columns: []
  } as TableDefinition,
  table142: {
    name: 'crm_facility_events',
    displayName: '월간 정비 일정',
    rowCount: 0,
    columnCount: 5,
    columns: []
  } as TableDefinition,
  table143: {
    name: 'crm_facility_parts',
    displayName: '소모성 부품 재고 관리',
    rowCount: 0,
    columnCount: 7,
    columns: []
  } as TableDefinition,
  table144: {
    name: 'crm_facility_oee_downtime',
    displayName: '비가동 원인 통계',
    rowCount: 0,
    columnCount: 4,
    columns: []
  } as TableDefinition,
  table145: {
    name: 'crm_facility_oee_stats',
    displayName: 'OEE 설비 종합 효율 통계',
    rowCount: 0,
    columnCount: 11,
    columns: []
  } as TableDefinition,
  table146: {
    name: 'crm_facility_layout',
    displayName: '공장 설비 평면 배치 및 상태',
    rowCount: 0,
    columnCount: 6,
    columns: []
  } as TableDefinition,
  table147: {
    name: 'crm_finance_products',
    displayName: '제품 원가 기초 데이터',
    rowCount: 0,
    columnCount: 7,
    columns: []
  } as TableDefinition,
  table148: {
    name: 'crm_finance_forecasts',
    displayName: '수금 및 지출 예정 대장',
    rowCount: 0,
    columnCount: 8,
    columns: []
  } as TableDefinition,
  table149: {
    name: 'crm_web_templates',
    displayName: '웹 양식 템플릿 마스터',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table150: {
    name: 'crm_web_form_logs',
    displayName: '웹 양식 발급대장',
    rowCount: 1,
    columnCount: 13,
    columns: []
  } as TableDefinition,
  table151: {
    name: 'products',
    displayName: '광고 상품',
    rowCount: 30,
    columnCount: 19,
    columns: []
  } as TableDefinition,
  table152: {
    name: 'crm_orders',
    displayName: '주문 내역',
    rowCount: 30,
    columnCount: 20,
    columns: []
  } as TableDefinition,
  table153: {
    name: 'crm_reservations',
    displayName: '예약 내역',
    rowCount: 30,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table154: {
    name: 'crm_payments',
    displayName: '결제 내역',
    rowCount: 30,
    columnCount: 14,
    columns: []
  } as TableDefinition,
  table155: {
    name: 'crm_deliveries',
    displayName: '배송 내역',
    rowCount: 30,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table156: {
    name: 'coupons',
    displayName: '쿠폰 관리',
    rowCount: 0,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table157: {
    name: 'inventory_items',
    displayName: '재고 품목',
    rowCount: 10,
    columnCount: 24,
    columns: []
  } as TableDefinition,
  table158: {
    name: 'ai_token_usage_logs',
    displayName: 'AI 토큰 사용량 로그',
    rowCount: 214,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table159: {
    name: 'expense_projects',
    displayName: '지출 프로젝트 관리',
    rowCount: 5,
    columnCount: 10,
    columns: []
  } as TableDefinition,
  table160: {
    name: 'form_templates',
    displayName: '양식 템플릿 마스터',
    rowCount: 0,
    columnCount: 15,
    columns: []
  } as TableDefinition,
  table161: {
    name: 'crm_employment_certificate_logs',
    displayName: '재직증명서 발급대장',
    rowCount: 0,
    columnCount: 19,
    columns: []
  } as TableDefinition,
  table162: {
    name: 'form_mappings',
    displayName: '양식 데이터 필드 매핑',
    rowCount: 0,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table163: {
    name: 'crm_credential_vault',
    displayName: '보안 인증 정보 금고',
    rowCount: 0,
    columnCount: 18,
    columns: []
  } as TableDefinition,
  table164: {
    name: 'crm_credential_emergency_requests',
    displayName: '보안 인증 비상 요청 대장',
    rowCount: 0,
    columnCount: 16,
    columns: []
  } as TableDefinition,
  table165: {
    name: 'crm_credential_audit_logs',
    displayName: '보안 인증 감사록',
    rowCount: 0,
    columnCount: 14,
    columns: []
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
  table1: 'import_master',
  table2: 'import_finance',
  table3: 'import_items',
  table4: 'crm_partners',
  table5: 'crm_inbound_excel_signatures',
  table6: 'crm_excel_signatures',
  table7: 'crm_inventory_inbounds',
  table8: 'crm_governance_logs',
  table9: 'rnd_compliance_alarms',
  table10: 'rnd_logs',
  table11: 'rnd_spaces',
  table12: 'rnd_staffs',
  table13: 'rnd_centers',
  table14: 'crm_facility_predictive_part_rul',
  table15: 'crm_facility_predictive_fft',
  table16: 'crm_facility_predictive_vibration',
  table17: 'crm_facility_predictive_summary',
  table18: 'crm_facility_repair_solutions',
  table19: 'crm_facility_repair_logs',
  table20: 'crm_facility_checklists',
  table21: 'crm_facilities',
  table22: 'crm_quality_vision_logs',
  table23: 'crm_quality_vision_model',
  table24: 'crm_quality_spc_features',
  table25: 'crm_quality_spc_predictions',
  table26: 'crm_quality_spc_samples',
  table27: 'crm_quality_spc_config',
  table28: 'crm_quality_sensors_timeline',
  table29: 'crm_quality_sensors_contribution',
  table30: 'crm_quality_sensors_status',
  table31: 'crm_quality_ncr_similar_cases',
  table32: 'crm_quality_ncr_items',
  table33: 'crm_quality_checklist_submissions',
  table34: 'crm_grant_company_profile',
  table35: 'crm_grant_rnd_plans',
  table36: 'crm_grant_bookmarks',
  table37: 'crm_recruitment_applicants',
  table38: 'crm_financial_analysis_logs',
  table39: 'crm_financial_statement_items',
  table40: 'crm_financial_statements',
  table41: 'safety_inspect_logs',
  table42: 'safety_near_misses',
  table43: 'safety_tbm_logs',
  table44: 'safety_risk_assessments',
  table45: 'safety_policies',
  table46: 'ai_contextual_help',
  table47: 'system_mail_logs',
  table48: 'system_menu_settings',
  table49: 'shared_dashboards',
  table50: 'expense_employees',
  table51: 'expense_departments',
  table52: 'expense_tags',
  table53: 'expense_categories',
  table54: 'expense_settings',
  table55: 'inventory_logs',
  table56: 'alert_logs',
  table57: 'alert_rules',
  table58: 'price_histories',
  table59: 'target_urls',
  table60: 'tracked_items',
  table61: 'crm_inventory_inbound_items',
  table62: 'crm_partner_contacts',
  table63: 'crm_snaptask_actions',
  table64: 'crm_snaptask_items',
  table65: 'crm_snaptasks',
  table66: 'crm_sales_orders',
  table67: 'crm_purchase_orders',
  table68: 'crm_point_history',
  table69: 'crm_coupons_restrictions',
  table70: 'naver_blog_marketing_settings',
  table71: 'crm_naver_blog_posts',
  table72: 'instagram_marketing_settings',
  table73: 'crm_instagram_posts',
  table74: 'crm_operators',
  table75: 'system_settings',
  table76: 'crm_transactions',
  table77: 'ad_templates',
  table78: 'message_logs',
  table79: 'message_templates',
  table80: 'crm_customers',
  table81: 'crm_expenses',
  table82: 'crm_estimate_items',
  table83: 'crm_estimates',
  table84: 'crm_partner_ai_reports',
  table85: 'crm_grant_announcements',
  table86: 'system_shared_views',
  table87: 'user_data_embedding_metadata',
  table88: 'user_data_embeddings',
  table89: 'sync_activity_log',
  table90: 'sync_configurations',
  table91: 'user_data_files',
  table92: 'crm_interpretation_logs',
  table93: 'crm_interpretation_sessions',
  table94: 'easybot_rules_history',
  table95: 'easybot_rules',
  table96: 'easybot_action_audit_logs',
  table97: 'crm_web_published_sites',
  table98: 'crm_deadstock_proposals',
  table99: 'crm_meeting_tasks',
  table100: 'crm_meetings',
  table101: 'exchange_rates',
  table102: 'tenant_menu_settings',
  table103: 'exchange_rate_histories',
  table104: 'user_feedbacks',
  table105: 'crm_attendance',
  table106: 'crm_operator_leave_balances',
  table107: 'crm_annual_leaves',
  table108: 'crm_company_events',
  table109: 'crm_operator_contract_settings',
  table110: 'crm_operator_profiles',
  table111: 'crm_operator_licenses',
  table112: 'crm_operator_education',
  table113: 'crm_operator_careers',
  table114: 'crm_operator_salaries',
  table115: 'crm_operator_awards',
  table116: 'crm_operator_promotions',
  table117: 'crm_operator_family_events',
  table118: 'crm_operator_incidents',
  table119: 'crm_operator_medical',
  table120: 'crm_operator_reputations',
  table121: 'crm_operator_families',
  table122: 'crm_operator_job_history',
  table123: 'crm_operator_ai_briefing_histories',
  table124: 'crm_operator_projects',
  table125: 'crm_company_event_types',
  table126: 'ecount_sync_schedules',
  table127: 'pms_projects',
  table128: 'ecount_rpa_lock',
  table129: 'crm_energy_savings',
  table130: 'crm_safety_alerts',
  table131: 'crm_energy_equipments',
  table132: 'crm_safety_zones',
  table133: 'crm_scm_shipments',
  table134: 'crm_labor_stats',
  table135: 'crm_scm_suppliers',
  table136: 'crm_labor_contracts',
  table137: 'crm_partner_credit_risks',
  table138: 'crm_production_gantt_tasks',
  table139: 'crm_production_bottlenecks',
  table140: 'crm_production_unscheduled_orders',
  table141: 'crm_production_due_risk',
  table142: 'crm_facility_events',
  table143: 'crm_facility_parts',
  table144: 'crm_facility_oee_downtime',
  table145: 'crm_facility_oee_stats',
  table146: 'crm_facility_layout',
  table147: 'crm_finance_products',
  table148: 'crm_finance_forecasts',
  table149: 'crm_web_templates',
  table150: 'crm_web_form_logs',
  table151: 'products',
  table152: 'crm_orders',
  table153: 'crm_reservations',
  table154: 'crm_payments',
  table155: 'crm_deliveries',
  table156: 'coupons',
  table157: 'inventory_items',
  table158: 'ai_token_usage_logs',
  table159: 'expense_projects',
  table160: 'form_templates',
  table161: 'crm_employment_certificate_logs',
  table162: 'form_mappings',
  table163: 'crm_credential_vault',
  table164: 'crm_credential_emergency_requests',
  table165: 'crm_credential_audit_logs'
} as const;
