import { NextResponse } from 'next/server';
import { 
  listTables, 
  createTable, 
  queryTable, 
  insertRows, 
  updateRows, 
  deleteRows,
  executeSQL
} from '../../../../../egdesk-helpers';

// 스케줄러 설정용 SQLite 테이블 자동 생성 (자가 치유 및 컬럼 자동 마이그레이션)
async function initializeScheduleDatabase() {
  try {
    const tableRes = await listTables();
    const rows = tableRes.rows || tableRes || [];
    let hasTable = false;
    if (Array.isArray(rows)) {
      hasTable = rows.some((t: any) => (t.tableName || t.name) === 'ecount_sync_schedules');
    }

    if (!hasTable) {
      console.log('[Scheduler] ecount_sync_schedules 테이블이 존재하지 않아 신설합니다.');
      const scheduleSchema = [
        { name: 'id', type: 'TEXT' as const, notNull: true },
        { name: 'script_file', type: 'TEXT' as const, notNull: true },
        { name: 'script_title', type: 'TEXT' as const, notNull: true },
        { name: 'target_table', type: 'TEXT' as const, notNull: true },
        { name: 'period_preset', type: 'TEXT' as const, notNull: true }, // 'hour' | 'daily' | 'weekly' | 'monthly'
        { name: 'run_time', type: 'TEXT' as const, notNull: true },     // '00:00' 등
        { name: 'week_days', type: 'TEXT' as const },                   // 매주일 때 특정 요일 목록 (예: "1,3,5" - 월,수,금)
        { name: 'month_day', type: 'INTEGER' as const },                 // 매월일 때 특정 일자 (1~31)
        { name: 'sync_days_range', type: 'INTEGER' as const },           // 동기화 수집 기간 지정 (최근 N일간 데이터)
        { name: 'is_active', type: 'INTEGER' as const, notNull: true },  // 1 (Active) | 0 (Inactive)
        { name: 'last_run_at', type: 'TEXT' as const },
        { name: 'next_run_at', type: 'TEXT' as const },
        { name: 'created_at', type: 'TEXT' as const, notNull: true }
      ];

      await createTable(
        '이카운트 ERP 동기화 스케줄',
        scheduleSchema,
        {
          tableName: 'ecount_sync_schedules',
          uniqueKeyColumns: ['id'],
          duplicateAction: 'update',
          description: '이카운트 RPA 스크립트 백그라운드 자동 동기화 일정 저장소'
        }
      );
      console.log('[Scheduler] ecount_sync_schedules 테이블 생성 완료.');
    } else {
      // 점진적 자가 치유 컬럼 마이그레이션 🔒
      try {
        await executeSQL("ALTER TABLE ecount_sync_schedules ADD COLUMN week_days TEXT;");
      } catch (e) {}
      try {
        await executeSQL("ALTER TABLE ecount_sync_schedules ADD COLUMN month_day INTEGER;");
      } catch (e) {}
      try {
        await executeSQL("ALTER TABLE ecount_sync_schedules ADD COLUMN sync_days_range INTEGER;");
      } catch (e) {}
    }
  } catch (err: any) {
    console.error('[Scheduler] DB 초기화 중 오류 발생:', err.message);
  }
}

// GET: 등록된 모든 스케줄 조회
export async function GET() {
  try {
    await initializeScheduleDatabase();
    
    // SQLite queryTable 호출
    const result = await queryTable('ecount_sync_schedules', {
      orderBy: 'created_at',
      orderDirection: 'DESC'
    });

    const schedules = result.rows || result || [];
    return NextResponse.json({
      success: true,
      schedules: Array.isArray(schedules) ? schedules : []
    });
  } catch (error: any) {
    console.error('[GET /api/ecount-erp/schedule] 스케줄 조회 에러:', error.message);
    return NextResponse.json({
      success: false,
      error: `스케줄 조회에 실패했습니다: ${error.message}`
    }, { status: 500 });
  }
}

// POST: 스케줄 추가, 수정, 토글, 삭제 (action 분기)
export async function POST(request: Request) {
  try {
    await initializeScheduleDatabase();
    
    const body = await request.json();
    const { 
      action, 
      id, 
      scriptFile, 
      scriptTitle, 
      targetTable, 
      periodPreset, 
      runTime, 
      isActive,
      weekDays,       // 신규 파싱: 특정 요일
      monthDay,       // 신규 파싱: 특정 날짜
      syncDaysRange   // 신규 파싱: 동기화 범위
    } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'action 파라미터가 필요합니다. (CREATE, UPDATE, TOGGLE, DELETE)'
      }, { status: 400 });
    }

    const nowStr = new Date().toISOString();

    if (action === 'CREATE') {
      if (!scriptFile || !scriptTitle || !targetTable || !periodPreset || !runTime) {
        return NextResponse.json({
          success: false,
          error: '스케줄 생성 필수 값이 누락되었습니다.'
        }, { status: 400 });
      }

      // ID 생성 (랜덤 UUID 스타일)
      const scheduleId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 다음 실행 시각 정밀 계산
      const nextRunAt = calculateNextRun(periodPreset, runTime, weekDays, monthDay ? parseInt(monthDay, 10) : undefined);

      const newRow = {
        id: scheduleId,
        script_file: scriptFile,
        script_title: scriptTitle,
        target_table: targetTable,
        period_preset: periodPreset,
        run_time: runTime,
        week_days: weekDays || '',
        month_day: monthDay ? parseInt(monthDay, 10) : null,
        sync_days_range: syncDaysRange ? parseInt(syncDaysRange, 10) : 30, // 기본값 최근 30일 데이터
        is_active: 1,
        last_run_at: '',
        next_run_at: nextRunAt,
        created_at: nowStr
      };

      await insertRows('ecount_sync_schedules', [newRow]);

      return NextResponse.json({
        success: true,
        message: '새로운 동기화 스케줄이 성공적으로 등록되었습니다.',
        schedule: newRow
      });
    }

    if (action === 'TOGGLE') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'id가 필요합니다.' }, { status: 400 });
      }

      // is_active 값 토글 (isActive는 프론트엔드에서 변경하고자 하는 값: 1 또는 0)
      const nextActive = isActive === 1 ? 1 : 0;
      
      await updateRows('ecount_sync_schedules', 
        { is_active: nextActive },
        { filters: { id } }
      );

      return NextResponse.json({
        success: true,
        message: `스케줄 활성화 상태가 ${nextActive === 1 ? '켬' : '끎'}으로 변경되었습니다.`
      });
    }

    if (action === 'UPDATE') {
      if (!id || !periodPreset || !runTime) {
        return NextResponse.json({ success: false, error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
      }

      const nextRunAt = calculateNextRun(periodPreset, runTime, weekDays, monthDay ? parseInt(monthDay, 10) : undefined);

      await updateRows('ecount_sync_schedules',
        { 
          period_preset: periodPreset, 
          run_time: runTime,
          week_days: weekDays || '',
          month_day: monthDay ? parseInt(monthDay, 10) : null,
          sync_days_range: syncDaysRange ? parseInt(syncDaysRange, 10) : 30,
          next_run_at: nextRunAt
        },
        { filters: { id } }
      );

      return NextResponse.json({
        success: true,
        message: '스케줄 설정이 업데이트되었습니다.'
      });
    }

    if (action === 'DELETE') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'id가 필요합니다.' }, { status: 400 });
      }

      await deleteRows('ecount_sync_schedules', { filters: { id } });

      return NextResponse.json({
        success: true,
        message: '스케줄이 성공적으로 삭제되었습니다.'
      });
    }

    return NextResponse.json({
      success: false,
      error: '지원하지 않는 action 타입입니다.'
    }, { status: 400 });

  } catch (error: any) {
    console.error('[POST /api/ecount-erp/schedule] 스케줄 작업 에러:', error.message);
    return NextResponse.json({
      success: false,
      error: `스케줄 요청 처리에 실패했습니다: ${error.message}`
    }, { status: 500 });
  }
}

// 다음 실행 주기 정교한 계산 도우미 함수
function calculateNextRun(preset: string, time: string, weekDays?: string, monthDay?: number): string {
  const now = new Date();
  const [hour, min] = time.split(':').map(Number);
  
  const targetTime = new Date();
  targetTime.setHours(hour || 0, min || 0, 0, 0);

  if (preset === 'hour') {
    // 1시간 후
    const result = new Date(now.getTime() + 60 * 60 * 1000);
    return result.toISOString();
  }

  if (preset === 'daily') {
    if (targetTime.getTime() <= now.getTime()) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    return targetTime.toISOString();
  }

  if (preset === 'weekly') {
    // 매주일 때 특정 요일 목록이 있다면 가장 빠른 요일을 계산
    // weekDays는 "1,3,5" 형식 (1=월, 2=화, ..., 7=일)
    const allowedDays = weekDays ? weekDays.split(',').map(Number) : [1, 2, 3, 4, 5]; // 기본 평일
    let nextRun = new Date(targetTime);
    
    // 최대 14일 앞까지 순회하며 적합한 요일 탐색
    for (let i = 0; i < 14; i++) {
      const dayOfWeek = nextRun.getDay(); // 0=일, 1=월, ..., 6=토
      const mappedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // 1=월, ..., 7=일 변환
      
      if (allowedDays.includes(mappedDay) && nextRun.getTime() > now.getTime()) {
        return nextRun.toISOString();
      }
      nextRun.setDate(nextRun.getDate() + 1);
    }
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  if (preset === 'monthly') {
    // 매월 특정 일(monthDay)에 실행
    const targetDay = monthDay || 1;
    targetTime.setDate(targetDay);
    
    if (targetTime.getTime() <= now.getTime()) {
      targetTime.setMonth(targetTime.getMonth() + 1);
    }
    return targetTime.toISOString();
  }

  return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
}
