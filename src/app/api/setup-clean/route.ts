export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const Database = require('better-sqlite3');
    const os = require('os');
    const path = require('path');
    const fs = require('fs');

    const homeDir = os.homedir();
    const appData = process.env.APPDATA || path.join(homeDir, 'AppData/Roaming');
    const paths = [
      path.join(appData, 'EGDesk/database/user_data.db'),
      path.join(appData, 'egdesk/database/user_data.db')
    ];
    
    let targetPath = '';
    for (const p of paths) {
      if (fs.existsSync(p)) {
        targetPath = p;
        break;
      }
    }
    
    if (!targetPath) {
      targetPath = paths[0];
    }

    const normalizedPath = targetPath.replace(/\\/g, '/');
    const dir = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const db = new Database(normalizedPath);

    // 안전한 처리를 위한 트랜잭션 가동
    db.exec('BEGIN TRANSACTION;');

    try {
      // 1. 비즈니스 샘플 데이터가 적재되는 테이블 명단 정의
      const tablesToClean = [
        'crm_customers',
        'message_templates',
        'message_logs',
        'ad_templates',
        'products',
        'crm_transactions',
        'crm_orders',
        'crm_payments',
        'crm_reservations',
        'crm_deliveries',
        'crm_instagram_posts',
        'crm_naver_blog_posts',
        'coupons',
        'crm_coupons_restrictions',
        'crm_point_history',
        'crm_estimates',
        'crm_estimate_items',
        'crm_purchase_orders',
        'crm_sales_orders',
        'crm_partners',
        'crm_partner_contacts',
        'crm_snaptasks',
        'crm_snaptask_items',
        'crm_snaptask_actions',
        'inventory_items',
        'crm_inventory_inbounds',
        'crm_inventory_inbound_items',
        'ai_token_usage_logs',
        'tracked_items',
        'target_urls',
        'price_histories',
        'alert_rules',
        'alert_logs',
        'inventory_logs',
        'crm_expenses',
        'expense_departments',
        'expense_employees',
        'expense_projects',
        'shared_dashboards',
        'system_mail_logs',
        'crm_employment_certificate_logs',
        'crm_web_form_logs',
        'easybot_action_audit_logs',
        'safety_policies',
        'safety_risk_assessments',
        'safety_tbm_logs',
        'safety_near_misses',
        'safety_inspect_logs',
        'crm_financial_statements',
        'crm_recruitment_applicants',
        'crm_grant_announcements',
        'crm_grant_bookmarks',
        'crm_grant_rnd_plans',
        'crm_grant_company_profile',
        'crm_quality_checklist_submissions',
        'crm_quality_ncr_items',
        'crm_quality_ncr_similar_cases',
        'crm_quality_sensors_status',
        'crm_quality_sensors_contribution',
        'crm_quality_sensors_timeline',
        'crm_quality_spc_config',
        'crm_quality_spc_predictions',
        'crm_quality_spc_features',
        'crm_quality_spc_samples',
        'crm_quality_vision_model',
        'crm_quality_vision_logs',
        'crm_facilities',
        'crm_facility_checklists',
        'crm_facility_repair_logs',
        'crm_facility_repair_solutions',
        'crm_facility_predictive_summary',
        'crm_facility_predictive_vibration',
        'crm_facility_predictive_fft',
        'crm_facility_predictive_part_rul',
        'rnd_centers',
        'rnd_staffs',
        'rnd_spaces',
        'rnd_logs',
        'rnd_compliance_alarms',
        'crm_credential_vault',
        'crm_credential_emergency_requests',
        'crm_credential_audit_logs'
      ];

      // 2. 각 테이블의 모든 데이터 삭제 및 AUTOINCREMENT 시퀀스 초기화
      for (const table of tablesToClean) {
        const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
        if (tableCheck) {
          db.prepare(`DELETE FROM ${table}`).run();
          db.prepare(`DELETE FROM sqlite_sequence WHERE name=?`).run(table);
          console.log(`Cleared and reset index for table: ${table}`);
        }
      }

      // 3. crm_operators 테이블에서 최고관리자(admin) 계정 제외한 나머지 일괄 삭제
      const operatorsCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='crm_operators'").get();
      if (operatorsCheck) {
        db.prepare("DELETE FROM crm_operators WHERE username != 'admin'").run();
        console.log("Cleared non-admin accounts from crm_operators.");
      }

      // 4. 마케팅/포인트 필수 설정(ID=1)을 제외한 환경설정 레코드 정리
      const settingsTables = ['instagram_marketing_settings', 'naver_blog_marketing_settings', 'expense_settings'];
      for (const st of settingsTables) {
        const check = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(st);
        if (check) {
          db.prepare(`DELETE FROM ${st} WHERE id != 1`).run();
          console.log(`Cleared ID!=1 rows from ${st}.`);
        }
      }

      db.exec('COMMIT;');
      db.close();

      return NextResponse.json({
        success: true,
        message: '클린 데이터베이스 초기화가 완료되었습니다. 최고관리자(admin) 및 시스템 필수 설정을 제외한 모든 비즈니스 샘플 데이터가 성공적으로 소멸되었습니다. ✨'
      });
    } catch (e: any) {
      db.exec('ROLLBACK;');
      db.close();
      throw e;
    }
  } catch (error: any) {
    console.error('Clean Database Initialization Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
