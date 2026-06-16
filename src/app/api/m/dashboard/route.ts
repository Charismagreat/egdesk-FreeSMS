export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { queryTable } from '@/../egdesk-helpers';

/**
 * 직원용 모바일 대시보드 통계 및 요약 정보 제공 API
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    let username = '';
    let name = '';
    let role = 'SUB_OPERATOR';

    if (token) {
      try {
        const payload = decodeJwt(token);
        username = payload.username as string || '';
        role = (payload.role as string || 'SUB_OPERATOR').toUpperCase();
        const opRes = await queryTable('crm_operators', { filters: { username } });
        if (opRes.rows && opRes.rows.length > 0) {
          name = opRes.rows[0].name;
          if (opRes.rows[0].role) {
            role = opRes.rows[0].role.toUpperCase();
          }
        }
      } catch (tokenErr) {
        console.warn('JWT Decode fail in mobile dashboard:', tokenErr);
      }
    }

    // 만약 세션이 없으면 데모 환경 지원을 위해 첫 번째 직원 계정으로 매핑
    if (!username) {
      const allOps = await queryTable('crm_operators', { limit: 1 });
      if (allOps.rows && allOps.rows.length > 0) {
        username = allOps.rows[0].username;
        name = allOps.rows[0].name;
        role = (allOps.rows[0].role || 'SUPER_ADMIN').toUpperCase();
      } else {
        username = 'admin@egdesk.com';
        name = '최고관리자';
        role = 'SUPER_ADMIN';
      }
    }

    // 금일 날짜 구하기 (YYYY-MM-DD)
    const today = new Date().toISOString().slice(0, 10);

    // 1. 미완료 스냅태스크 건수 (status = 'ACTIVE', deleted_at IS NULL)
    let pendingTasksCount = 0;
    try {
      const taskRes = await queryTable('crm_snaptasks', {
        filters: { status: 'ACTIVE' }
      });
      const tasks = (taskRes.rows || []).filter((t: any) => !t.deleted_at);
      pendingTasksCount = tasks.length;
    } catch (e) {
      console.warn('Failed to query crm_snaptasks:', e);
    }

    // 2. 결재 대기 중인 지출 품의 건수 (최고관리자는 전체 지출 건수, 일반 직원은 본인 작성 건수만 노출)
    let pendingExpensesCount = 0;
    try {
      const expenseRes = await queryTable('crm_expenses', {
        filters: { approval_status: 'PENDING' }
      });
      const expenses = (expenseRes.rows || []).filter((exp: any) => {
        if (exp.deleted_at) return false;
        // 최고관리자(SUPER_ADMIN)면 전체 조회 가능, 일반 직원은 본인 것만 노출
        if (role === 'SUPER_ADMIN') return true;
        return exp.updated_by === username;
      });
      pendingExpensesCount = expenses.length;
    } catch (e) {
      console.warn('Failed to query crm_expenses:', e);
    }

    // 3. 금일 수립된 안전 TBM 건수 (deleted_at IS NULL 및 금일 날짜)
    let todaySafetyTbmCount = 0;
    try {
      const tbmRes = await queryTable('safety_tbm_logs', {});
      const tbmLogs = (tbmRes.rows || []).filter((log: any) => 
        !log.deleted_at && log.created_at && log.created_at.startsWith(today)
      );
      todaySafetyTbmCount = tbmLogs.length;
    } catch (e) {
      console.warn('Failed to query safety_tbm_logs:', e);
    }

    // 4. 금일 발생한 품질 문제 NCR 건수 (deleted_at IS NULL 및 금일 날짜)
    let todayQualityNcrCount = 0;
    try {
      const ncrRes = await queryTable('crm_quality_ncr_similar_cases', {});
      const ncrLogs = (ncrRes.rows || []).filter((log: any) => 
        !log.deleted_at && log.created_at && log.created_at.startsWith(today)
      );
      todayQualityNcrCount = ncrLogs.length;
    } catch (e) {
      console.warn('Failed to query crm_quality_ncr_similar_cases:', e);
    }

    // 5. 최근 이지봇 파일 처리 감사 건수 (최고관리자는 전체 감사 로그, 일반 직원은 본인 감사 로그만)
    let myEasybotActionCount = 0;
    try {
      let queryOptions: any = {};
      if (role !== 'SUPER_ADMIN') {
        queryOptions.filters = { operator_username: username };
      }
      const auditRes = await queryTable('easybot_action_audit_logs', queryOptions);
      const audits = (auditRes.rows || []).filter((a: any) => !a.deleted_at);
      myEasybotActionCount = audits.length;
    } catch (e) {
      console.warn('Failed to query easybot_action_audit_logs:', e);
    }

    return NextResponse.json({
      success: true,
      currentUser: {
        username,
        name,
        role
      },
      stats: {
        pendingTasksCount,
        pendingExpensesCount,
        todaySafetyTbmCount,
        todayQualityNcrCount,
        myEasybotActionCount
      }
    });

  } catch (err: any) {
    console.error('Mobile dashboard API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
