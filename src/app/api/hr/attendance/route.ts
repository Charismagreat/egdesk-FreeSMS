export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { createTable, queryTable, insertRows, updateRows } from '../../../../../egdesk-helpers';

/**
  * 🛡️ HR 데이터베이스 자율 마이그레이션 (Self-Healing Auto-Migration)
  */
async function initHrDatabase() {
  try {
    // 테이블 존재 여부 확인 차원 쿼리 (실패하면 테이블이 없는 것)
    await queryTable('crm_attendance', { limit: 1 }).catch(async () => {
      console.log('HR 근태 관련 테이블이 발견되지 않아 자율 생성을 시작합니다...');
      
      // 1. crm_attendance 테이블 신설
      await createTable('직원 근태 대장', [
        { name: 'id', type: 'TEXT', notNull: true },
        { name: 'operator_id', type: 'TEXT', notNull: true },
        { name: 'work_date', type: 'TEXT', notNull: true },
        { name: 'clock_in', type: 'TEXT' },
        { name: 'clock_out', type: 'TEXT' },
        { name: 'status', type: 'TEXT', notNull: true }, // NORMAL, LATE, EARLY_LEAVE, ABSENT, LEAVE
        { name: 'working_hours', type: 'REAL', defaultValue: 0 },
        { name: 'memo', type: 'TEXT' },
        { name: 'created_at', type: 'TEXT', notNull: true },
        { name: 'updated_at', type: 'TEXT', notNull: true }
      ], {
        tableName: 'crm_attendance',
        uniqueKeyColumns: ['id']
      });

      // 2. crm_annual_leaves 테이블 신설
      await createTable('직원 연차 신청 결재 대장', [
        { name: 'id', type: 'TEXT', notNull: true },
        { name: 'operator_id', type: 'TEXT', notNull: true },
        { name: 'leave_type', type: 'TEXT', notNull: true }, // ANNUAL, HALF, SICK, SPECIAL
        { name: 'start_date', type: 'TEXT', notNull: true },
        { name: 'end_date', type: 'TEXT', notNull: true },
        { name: 'days_spent', type: 'REAL', notNull: true },
        { name: 'status', type: 'TEXT', notNull: true }, // PENDING, APPROVED, REJECTED
        { name: 'reason', type: 'TEXT' },
        { name: 'reject_reason', type: 'TEXT' },
        { name: 'approver_id', type: 'TEXT' },
        { name: 'created_at', type: 'TEXT', notNull: true },
        { name: 'updated_at', type: 'TEXT', notNull: true }
      ], {
        tableName: 'crm_annual_leaves',
        uniqueKeyColumns: ['id']
      });

      // 3. crm_operator_leave_balances 테이블 신설
      await createTable('직원별 연차 잔액 관리', [
        { name: 'operator_id', type: 'TEXT', notNull: true },
        { name: 'total_allowed', type: 'REAL', defaultValue: 15 },
        { name: 'used', type: 'REAL', defaultValue: 0 },
        { name: 'remaining', type: 'REAL', defaultValue: 15 },
        { name: 'updated_at', type: 'TEXT', notNull: true }
      ], {
        tableName: 'crm_operator_leave_balances',
        uniqueKeyColumns: ['operator_id']
      });

      // 4. crm_company_events 테이블 신설
      await createTable('전사 회사 일정 공유 대장', [
        { name: 'id', type: 'TEXT', notNull: true },
        { name: 'title', type: 'TEXT', notNull: true },
        { name: 'start_date', type: 'TEXT', notNull: true },
        { name: 'end_date', type: 'TEXT', notNull: true },
        { name: 'event_type', type: 'TEXT', notNull: true }, // COMPANY_EVENT, HOLIDAY, DEPT_EVENT
        { name: 'description', type: 'TEXT' },
        { name: 'created_by', type: 'TEXT' },
        { name: 'created_at', type: 'TEXT', notNull: true }
      ], {
        tableName: 'crm_company_events',
        uniqueKeyColumns: ['id']
      });

      // 5. 기존 운영자 연차Balances 백필 적재 (Backfill)
      const operatorsRes = await queryTable('crm_operators');
      const ops = operatorsRes.rows || [];
      if (ops.length > 0) {
        const balanceRows = ops.map((op: any) => ({
          operator_id: op.id,
          total_allowed: 15.0,
          used: 0.0,
          remaining: 15.0,
          updated_at: new Date().toISOString()
        }));
        await insertRows('crm_operator_leave_balances', balanceRows).catch(e => console.error(e));
        console.log(`✓ 직원 ${ops.length}명 연차 balances 기본 백필 완료`);
      }

      // 6. 데모용 회사 일정 데이터 2건 적재
      const demoEvents = [
        {
          id: 'demo-event-1',
          title: '전사 정기 워크숍 🚌',
          start_date: '2026-06-12',
          end_date: '2026-06-13',
          event_type: 'COMPANY_EVENT',
          description: '전사 화합을 위한 가평 정기 워크숍입니다.',
          created_by: 'system',
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-event-2',
          title: '주요 프로젝트 납품 마감일 🚨',
          start_date: '2026-06-15',
          end_date: '2026-06-15',
          event_type: 'COMPANY_EVENT',
          description: 'B2B 거래처 최종 납품 기한일입니다.',
          created_by: 'system',
          created_at: new Date().toISOString()
        }
      ];
      await insertRows('crm_company_events', demoEvents).catch(e => console.error(e));
      console.log('✓ 데모 회사 공유 일정 데이터 적재 성공');
    });
  } catch (err) {
    console.error('HR 데이터베이스 자율 마이그레이션 처리 실패:', err);
  }
}

/**
 * 전사 근태 리스트 및 오늘 자의 실시간 근태 현황 조회
 */
export async function GET(req: Request) {
  try {
    // 1. DB 자가 치유 가드 기동
    await initHrDatabase();

    const { searchParams } = new URL(req.url);
    const workDate = searchParams.get('work_date') || new Date().toISOString().split('T')[0];

    // 최고관리자/직원 세션 조회
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    let currentUser: any = null;
    if (token) {
      currentUser = decodeJwt(token);
    }

    // 직원 마스터 목록 스캔
    const operatorsRes = await queryTable('crm_operators', { filters: { is_active: '1' } });
    const employees = operatorsRes.rows || [];

    // 당일 전원 근태 정보 스캔
    const attendanceRes = await queryTable('crm_attendance', { filters: { work_date: workDate } });
    const attendanceList = attendanceRes.rows || [];

    // 직원별 연차 현황 스캔
    const balancesRes = await queryTable('crm_operator_leave_balances');
    const balancesList = balancesRes.rows || [];

    // 전사 공유 일정 스캔
    const eventsRes = await queryTable('crm_company_events');
    const companyEvents = eventsRes.rows || [];

    // 캘린더 종합 조회를 위해 전체 연차 내역(APPROVED 상태인 것) 스캔
    const approvedLeavesRes = await queryTable('crm_annual_leaves', { filters: { status: 'APPROVED' } });
    const approvedLeaves = approvedLeavesRes.rows || [];

    // 전체 근태 내역 스캔 (캘린더 매핑용)
    const allAttendanceRes = await queryTable('crm_attendance');
    const allAttendance = allAttendanceRes.rows || [];

    // 직원 정보와 근태 상태 바인딩
    const mappedEmployees = employees.map((emp: any) => {
      const att = attendanceList.find((a: any) => a.operator_id === emp.id);
      const bal = balancesList.find((b: any) => b.operator_id === emp.id);

      return {
        id: emp.id,
        name: emp.name,
        username: emp.username,
        role: emp.role,
        clock_in: att ? att.clock_in : null,
        clock_out: att ? att.clock_out : null,
        status: att ? att.status : 'ABSENT', // 기록 없으면 결근 또는 휴가 판별 필요
        working_hours: att ? att.working_hours : 0,
        memo: att ? att.memo : '',
        total_allowed: bal ? bal.total_allowed : 15,
        remaining_leaves: bal ? bal.remaining : 15
      };
    });

    return NextResponse.json({
      success: true,
      employees: mappedEmployees,
      companyEvents,
      approvedLeaves,
      allAttendance,
      currentUser: currentUser ? { id: currentUser.id, name: currentUser.name, role: currentUser.role } : null
    });

  } catch (error: any) {
    console.error('Attendance GET API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * 원터치 출퇴근 타임스탬프 (스탬프 찍기)
 */
export async function POST(req: Request) {
  try {
    await initHrDatabase();

    const { action, memo } = await req.json(); // action: 'CLOCK_IN' or 'CLOCK_OUT'

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: '인증 세션이 만료되었습니다. 다시 로그인해주세요.' }, { status: 401 });
    }

    const payload = decodeJwt(token);
    const operatorId = payload.id;
    const operatorName = payload.name || '직원';

    const now = new Date();
    const workDate = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0]; // "HH:MM:SS"

    // 당일 기존 근태 기록이 있는지 스캔
    const existingRes = await queryTable('crm_attendance', { filters: { operator_id: operatorId, work_date: workDate } });
    const records = existingRes.rows || [];

    if (action === 'CLOCK_IN') {
      if (records.length > 0 && records[0].clock_in) {
        return NextResponse.json({ success: false, error: '이미 오늘의 출근 스탬프가 찍혀 있습니다.' }, { status: 400 });
      }

      // 출근 시간 판별 기준 (기본 09:00:00)
      const isLate = timeStr > '09:00:00';
      const status = isLate ? 'LATE' : 'NORMAL';

      const newRecord = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        operator_id: operatorId,
        work_date: workDate,
        clock_in: timeStr,
        clock_out: null,
        status,
        working_hours: 0,
        memo: memo || (isLate ? '지각 출근 기록' : '정상 출근'),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      await insertRows('crm_attendance', [newRecord]);

      return NextResponse.json({
        success: true,
        message: `${operatorName}님, ${isLate ? '⚠️ 지각' : '🟢 정상'} 출근 완료 되었습니다. (${timeStr})`,
        record: newRecord
      });
    }

    if (action === 'CLOCK_OUT') {
      if (records.length === 0) {
        return NextResponse.json({ success: false, error: '출근 스탬프를 먼저 찍어주세요.' }, { status: 400 });
      }

      const attRecord = records[0];
      if (attRecord.clock_out) {
        return NextResponse.json({ success: false, error: '이미 오늘의 퇴근 스탬프가 기록되어 있습니다.' }, { status: 400 });
      }

      // 실제 근무 시간(H) 동적 계산
      let workingHours = 8;
      if (attRecord.clock_in) {
        const [inH, inM, inS] = attRecord.clock_in.split(':').map(Number);
        const [outH, outM, outS] = timeStr.split(':').map(Number);
        const diffMs = (outH * 3600 + outM * 60 + outS) - (inH * 3600 + inM * 60 + inS);
        workingHours = Math.max(0, Math.round((diffMs / 3600) * 10) / 10); // 소수점 첫째자리
      }

      // 조퇴 판별 기준 (기본 18:00:00 이전 퇴근 시)
      let currentStatus = attRecord.status;
      if (timeStr < '18:00:00' && currentStatus === 'NORMAL') {
        currentStatus = 'EARLY_LEAVE';
      }

      const updates = {
        clock_out: timeStr,
        status: currentStatus,
        working_hours: workingHours,
        updated_at: now.toISOString()
      };

      await updateRows('crm_attendance', updates, { filters: { id: attRecord.id } });

      return NextResponse.json({
        success: true,
        message: `${operatorName}님, 퇴근 스탬프가 찍혔습니다. 고생하셨습니다! (${timeStr}, 총 ${workingHours}시간 근무)`,
        record: { ...attRecord, ...updates }
      });
    }

    return NextResponse.json({ success: false, error: '잘못된 액션 명령입니다.' }, { status: 400 });

  } catch (error: any) {
    console.error('Attendance POST API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
