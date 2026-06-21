import { NextResponse } from 'next/server';
import { EGDESK_CONFIG } from '../../../../egdesk.config';
import { listTables, createTable, executeSQL } from '../../../../egdesk-helpers';

// 5대 표준 시나리오 메타데이터 맵 (실제 파일과 동적 매핑용)
const SCRIPT_METADATA_PRESETS: Record<string, { title: string; menuPath: string; targetTable: string; description: string; category: string; columns: string[]; defaultDaysRange: number }> = {
  sales: {
    title: '이카운트 일자별 매출 원장 동기화',
    menuPath: '회계 > 매출/매입 > 매출대장',
    targetTable: 'ecount_sales_ledger',
    description: '지정된 기간 동안의 이카운트 매출 원장 엑셀 데이터를 다운로드하여 로컬 DB에 자동 동기화합니다.',
    category: '매출',
    defaultDaysRange: 30,
    columns: ['거래일자', '전표번호', '거래처명', '공급가액', '부가세', '합계금액', '적요']
  },
  purchase: {
    title: '이카운트 일자별 매입 원장 동기화',
    menuPath: '회계 > 매출/매입 > 매입대장',
    targetTable: 'ecount_purchase_ledger',
    description: '지정된 기간 동안의 이카운트 매입 원장 엑셀 데이터를 수집하고 계정과목별로 자동 분류하여 적재합니다.',
    category: '매입',
    defaultDaysRange: 30,
    columns: ['거래일자', '전표번호', '공급처명', '공급가액', '부가세', '합계금액', '계정과목']
  },
  inventory: {
    title: '이카운트 창고별 재고 현황 수집',
    menuPath: '재고 > 출력물 > 재고현황',
    targetTable: 'ecount_inventory_status',
    description: '회사 내 모든 활성 창고의 품목별 현재고, 적정재고 및 안전재고 초과 여부를 실시간 감지하여 적재합니다.',
    category: '재고',
    defaultDaysRange: 0,
    columns: ['품목코드', '품목명', '규격', '창고명', '현재고수량', '안전재고수량', '재고상태']
  },
  transfer: {
    title: '이카운트 자재 창고간 이동 이력',
    menuPath: '재고 > 자재이동 > 창고간이동대장',
    targetTable: 'ecount_inventory_transfer',
    description: '공장, 물류창고, 매장 등 창고 간에 발생한 실시간 자재/품목 이동 로그를 분석 적재합니다.',
    category: '재고',
    defaultDaysRange: 7,
    columns: ['이동일자', '전표번호', '보내는창고', '받는창고', '품목명', '수량', '담당자']
  },
  clients: {
    title: '이카운트 거래처 원장 동기화',
    menuPath: '기초등록 > 거래처 > 거래처대장',
    targetTable: 'ecount_customer_list',
    description: '이카운트에 등록된 최신 거래처 인적 정보, 거래처 등급 및 미수금 현황을 연동하여 갱신합니다.',
    category: '거래처',
    defaultDaysRange: 0,
    columns: ['거래처코드', '거래처명', '사업자번호', '대표자명', '전화번호', '담당자명', '미수잔액']
  },
  ledger: {
    title: '이카운트 계정별 잔액 현황 수집',
    menuPath: '회계 > 장부 > 계정별원장',
    targetTable: 'ecount_account_balance',
    description: '현재 시점의 자산, 부채, 자본 계정과목별 통장 예치금 및 잔액 대장을 빌드하여 적재합니다.',
    category: '자본/회계',
    defaultDaysRange: 0,
    columns: ['계정코드', '계정과목명', '전월이월', '차변금액', '대변금액', '현재잔액', '은행계좌정보']
  },
  promissory: {
    title: '이카운트 어음 관리 원장 동기화',
    menuPath: '회계 > 장부 > 받을어음/지급어음대장',
    targetTable: 'ecount_promissory_notes',
    description: '회사가 수취하거나 발행한 전자어음, 약속어음의 만기일 도래 및 결제 상태 대장을 동기화합니다.',
    category: '자본/회계',
    defaultDaysRange: 90,
    columns: ['어음번호', '구분', '발행일', '만기일', '거래처명', '어음금액', '결제상태']
  }
};

// 더미 폴백 스크립트 프리셋 제거 완료


/**
 * GET: 이지데스크서버 REST API 직접 연동을 통한 실제 스크립트 동적 매핑 및 SQLite 물리 테이블 존재 진단
 */
export async function GET() {
  try {
    const apiUrl = EGDESK_CONFIG.apiUrl;
    const apiKey = EGDESK_CONFIG.apiKey;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    console.log(`[GET /api/ecount-erp] 이지데스크 REST API 호출 중: ${apiUrl}/browser-recording/tools/call`);

    // 1. SQLite 데이터베이스에 생성되어 존재하는 물리 테이블 목록 조회 🔒
    let dbTables: string[] = [];
    try {
      const tablesRes = await listTables();
      const rows = tablesRes.rows || tablesRes || [];
      if (Array.isArray(rows)) {
        dbTables = rows.map((t: any) => t.tableName || t.name || '').filter(Boolean);
      }
      console.log('SQLite 실제 감지된 테이블 목록:', dbTables);
    } catch (err: any) {
      console.warn('이지데스크 DB 테이블 목록 조회 실패폴백 적용:', err.message);
    }

    // 2. 이지데스크서버 REST API 직접 POST 호출 (list_saved_tests 도구 직접 실행)
    const res = await fetch(`${apiUrl}/browser-recording/tools/call`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tool: 'browser_recording_list_saved_tests',
        arguments: {}
      })
    });

    if (!res.ok) {
      throw new Error(`이지데스크서버 응답 오류 (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (!data.success || !data.result?.content?.[0]?.text) {
      throw new Error(data.error || 'RPA 스크립트 조회 실패');
    }

    const mcpText = data.result.content[0].text;
    const mcpData = JSON.parse(mcpText);
    const tests = mcpData.tests || [];

    if (!Array.isArray(tests) || tests.length === 0) {
      return NextResponse.json({
        success: true,
        scripts: [],
        message: '이지데스크서버와 연결되었으나 저장된 RPA 스크립트 파일이 없습니다.'
      });
    }

    // 3. 이지데스크서버에 실제로 존재하는 파일 목록(.spec.js)을 가공 및 이카운트 메타데이터 동적 매핑
    const resolvedScripts = tests.map((test: any) => {
      const fileName = test.name;
      const lowerName = fileName.toLowerCase();

      // 파일명에 맞는 적절한 프리셋 탐색 (키워드 매핑)
      let presetKey = 'etc';
      if (lowerName.includes('sales') || lowerName.includes('매출') || lowerName.includes('영일sales')) {
        presetKey = 'sales';
      } else if (lowerName.includes('purchase') || lowerName.includes('매입') || lowerName.includes('영일purchases')) {
        presetKey = 'purchase';
      } else if (lowerName.includes('transfer') || lowerName.includes('이동')) {
        presetKey = 'transfer';
      } else if (lowerName.includes('inventory') || lowerName.includes('재고') || lowerName.includes('disposed')) {
        presetKey = 'inventory';
      } else if (lowerName.includes('clients') || lowerName.includes('customer') || lowerName.includes('거래처')) {
        presetKey = 'clients';
      } else if (lowerName.includes('promissory') || lowerName.includes('어음')) {
        presetKey = 'promissory';
      } else if (lowerName.includes('ledger') || lowerName.includes('원장') || lowerName.includes('계정')) {
        presetKey = 'ledger';
      }

      const preset = SCRIPT_METADATA_PRESETS[presetKey] || {
        title: `기타 스크립트 [${fileName.replace('.spec.js', '')}]`,
        menuPath: '이카운트 > 기타 대장',
        targetTable: `ecount_custom_${fileName.replace('.spec.js', '').replace(/[^a-zA-Z0-9]/g, '_')}`,
        description: '이지데스크서버에 등록된 커스텀 RPA 스크립트입니다. 클릭하여 로컬 DB 적재를 동기화합니다.',
        category: '기타/커스텀',
        defaultDaysRange: 30,
        columns: ['데이터로우']
      };

      // 만약 프리셋에 100% 매칭되지 않고 커스텀 명칭이 있다면 보정
      let title = preset.title;
      if (presetKey === 'sales' && lowerName.includes('yeongil')) {
        title = '이카운트 [영일] 매출 원장 동기화';
      } else if (presetKey === 'purchase' && lowerName.includes('yoengil')) {
        title = '이카운트 [영일] 매입 원장 동기화';
      } else if (presetKey === 'sales' && lowerName.includes('west')) {
        title = '이카운트 [서부지사] 매출 원장 동기화';
      } else if (presetKey === 'purchase' && lowerName.includes('west')) {
        title = '이카운트 [서부지사] 매입 원장 동기화';
      } else if (presetKey === 'sales' && lowerName.includes('east')) {
        title = '이카운트 [동부지사] 매출 원장 동기화';
      } else if (presetKey === 'purchase' && lowerName.includes('east')) {
        title = '이카운트 [동부지사] 매입 원장 동기화';
      } else if (presetKey === 'sales' && lowerName.includes('shopping')) {
        title = '이카운트 [쇼핑몰] 매출 대장 동기화';
      } else if (lowerName.includes('purchase_orders')) {
        title = '이카운트 발주 대장 동기화';
      }

      // SQLite DB에 실제로 해당 물리 테이블이 생성되어 있는지 유효성 진단
      const isTableCreated = dbTables.includes(preset.targetTable);

      return {
        fileName,
        title,
        menuPath: preset.menuPath,
        targetTable: preset.targetTable,
        description: preset.description,
        category: preset.category,
        defaultDaysRange: preset.defaultDaysRange,
        columns: preset.columns,
        isRealFileAvailable: true,
        isTableCreated // 테이블 생성 여부 플래그
      };
    });

    return NextResponse.json({
      success: true,
      scripts: resolvedScripts,
      serverScriptList: tests.map((t: any) => t.name)
    });
  } catch (error: any) {
    console.error('[GET /api/ecount-erp] REST API 바인딩 에러:', error.message);
    return NextResponse.json({
      success: false,
      scripts: [],
      message: `이지데스크 서버 REST API 조회 중 에러: ${error.message}`
    });
  }
}

/**
 * POST: 이지데스크서버 REST API 직접 POST를 통한 RPA 구동 릴레이
 */
// SQLite 기반 RPA 실행 락 시스템 초기화 (동시 다발 실행 방지 및 Cooldown 강제)
async function initializeLockDatabase() {
  try {
    const tableRes = await listTables();
    const rows = tableRes.rows || tableRes || [];
    let hasTable = false;
    if (Array.isArray(rows)) {
      hasTable = rows.some((t: any) => (t.tableName || t.name) === 'ecount_rpa_lock');
    }
    if (!hasTable) {
      const lockSchema = [
        { name: 'id', type: 'INTEGER' as const, notNull: true },
        { name: 'is_locked', type: 'INTEGER' as const, notNull: true },
        { name: 'locked_by', type: 'TEXT' as const },
        { name: 'locked_at', type: 'TEXT' as const },
        { name: 'cooldown_until', type: 'TEXT' as const }
      ];
      await createTable('이카운트 RPA 실행 락', lockSchema, {
        tableName: 'ecount_rpa_lock',
        uniqueKeyColumns: ['id']
      });
      // 초기 레코드 삽입
      await executeSQL("INSERT INTO ecount_rpa_lock (id, is_locked, locked_by, locked_at, cooldown_until) VALUES (1, 0, '', '', '');");
      console.log('[Lock System] ecount_rpa_lock 테이블 초기값 적재 완료.');
    }
  } catch (e: any) {
    console.warn('[Lock System] 락 데이터베이스 초기화 시도 중 경고:', e.message);
  }
}

async function checkAndAcquireLock(scriptFile: string): Promise<{ success: boolean; reason?: string }> {
  try {
    await initializeLockDatabase();
    const lockRes = await executeSQL("SELECT * FROM ecount_rpa_lock WHERE id = 1;");
    const rows = lockRes.rows || lockRes || [];
    const lock = rows[0];
    
    if (!lock) return { success: true };

    const now = new Date();

    // 1. 현재 다른 스크립트 실행 중인지 검증 (동시 실행 완전 방어)
    if (lock.is_locked === 1 || lock.is_locked === '1') {
      const lockedAt = new Date(lock.locked_at);
      // 좀비 락 방지 (15분 초과 시 강제 해제)
      if (now.getTime() - lockedAt.getTime() > 15 * 60 * 1000) {
        console.log('[Lock System] 좀비 락 자동 만료 해제 처리.');
        await executeSQL("UPDATE ecount_rpa_lock SET is_locked = 0, locked_by = '' WHERE id = 1;");
      } else {
        return {
          success: false,
          reason: `현재 다른 RPA 동기화 작업 [${lock.locked_by}]이 실행 중입니다. 동시 기동은 안전을 위해 완전히 차단됩니다.`
        };
      }
    }

    // 2. 5분간의 강제 쿨타임 검증
    if (lock.cooldown_until) {
      const cooldownTime = new Date(lock.cooldown_until);
      if (now.getTime() < cooldownTime.getTime()) {
        const remainingSec = Math.ceil((cooldownTime.getTime() - now.getTime()) / 1000);
        const min = Math.floor(remainingSec / 60);
        const sec = remainingSec % 60;
        return {
          success: false,
          reason: `이전 RPA 실행 후 안정적인 대기를 위해 5분간의 쿨타임이 적용 중입니다. 기동 가능까지 ${min}분 ${sec}초 남았습니다.`
        };
      }
    }

    // 3. 락 선점
    await executeSQL(`UPDATE ecount_rpa_lock SET is_locked = 1, locked_by = '${scriptFile}', locked_at = '${now.toISOString()}', cooldown_until = '' WHERE id = 1;`);
    return { success: true };
  } catch (error: any) {
    console.error('락 획득 중 오류 발생 (폴백 허용):', error.message);
    return { success: true }; // DB 에러 시 동기화 기동 우선 허용
  }
}

async function releaseLockAndCooldown(scriptFile: string) {
  try {
    const now = new Date();
    const cooldownTime = new Date(now.getTime() + 5 * 60 * 1000); // 5분 후
    await executeSQL(`UPDATE ecount_rpa_lock SET is_locked = 0, locked_by = '', cooldown_until = '${cooldownTime.toISOString()}' WHERE id = 1;`);
    console.log(`[Lock Engine] 스크립트 ${scriptFile} 락 해제 완료. 5분 Cooldown 돌입 (~${cooldownTime.toLocaleTimeString()})`);
  } catch (e: any) {
    console.error('락 해제 중 오류:', e.message);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, fileName, targetTable, columns } = body;

    // 1. 물리 테이블 강제 신설 액션 처리 (CREATE_TABLE)
    if (action === 'CREATE_TABLE') {
      if (!targetTable || !columns || !Array.isArray(columns)) {
        return NextResponse.json({
          success: false,
          error: '테이블 생성을 위한 targetTable 또는 columns 정보가 부족합니다.'
        }, { status: 400 });
      }

      // SCRIPT_METADATA_PRESETS에서 적절한 한글 타이틀 탐색하여 displayName 지정
      let displayName = '이카운트 자동화 테이블';
      for (const key in SCRIPT_METADATA_PRESETS) {
        if (SCRIPT_METADATA_PRESETS[key].targetTable === targetTable) {
          displayName = SCRIPT_METADATA_PRESETS[key].title;
          break;
        }
      }

      // SQLite용 스키마 구조 빌드 (id는 기본 PK로 자동 부여)
      const schema = [
        { name: 'id', type: 'INTEGER' as const, notNull: true },
        ...columns.map((col: string) => ({
          name: col,
          type: 'TEXT' as const,
          notNull: false
        }))
      ];

      console.log(`[CREATE_TABLE] ${displayName} (물리명: ${targetTable}) 생성 요청`);
      
      const createRes = await createTable(
        displayName,
        schema,
        {
          tableName: targetTable,
          uniqueKeyColumns: ['id'],
          duplicateAction: 'update',
          description: `${displayName} RPA 연동용 자동 생성 테이블`
        }
      );

      return NextResponse.json({
        success: true,
        message: `물리 테이블 [${targetTable}]이 SQLite 데이터베이스에 성공적으로 생성되었습니다.`,
        result: createRes
      });
    }

    // 2. 기본 동작: 이지데스크서버 REST API를 통한 RPA 구동 릴레이
    const { startDate, endDate, datePickersByIndex, labeledFieldFills } = body;

    if (!fileName) {
      return NextResponse.json({
        success: false,
        error: '구동할 스크립트 파일명이 누락되었습니다.'
      }, { status: 400 });
    }

    // 🔒 RPA 실행 락 선점 검증 (동시 실행 제한 및 5분 Cooldown 강제)
    const lockStatus = await checkAndAcquireLock(fileName);
    if (!lockStatus.success) {
      return NextResponse.json({
        success: false,
        error: lockStatus.reason
      }, { status: 423 }); // Locked
    }

    const apiUrl = EGDESK_CONFIG.apiUrl;
    const apiKey = EGDESK_CONFIG.apiKey;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    console.log(`[POST /api/ecount-erp] 이지데스크 REST API 호출 중: ${apiUrl}/browser-recording/tools/call`);
    console.log(`구동 스크립트: ${fileName}`);

    try {
      // 이지데스크서버 REST API POST 직접 릴레이 (browser_recording_run 도구 직접 호출)
      const res = await fetch(`${apiUrl}/browser-recording/tools/call`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'browser_recording_run',
          arguments: {
            testFile: fileName,
            startDate,
            endDate,
            datePickersByIndex: datePickersByIndex || ['0', '1'],
            labeledFieldFills: labeledFieldFills || []
          }
        })
      });

      // 락 쿨타임 해제 주입
      await releaseLockAndCooldown(fileName);

      if (!res.ok) {
        throw new Error(`이지데스크서버 RPA 구동 응답 실패 (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'RPA 스크립트 기동 실패');
      }

      return NextResponse.json({
        success: true,
        message: `스크립트 [${fileName}]가 REST API를 통해 이지데스크서버에서 성공적으로 기동되었습니다.`,
        result: data
      });
    } catch (err: any) {
      // API 실패 시에도 락 쿨타임 주입하며 해제
      await releaseLockAndCooldown(fileName);
      throw err;
    }
  } catch (error: any) {
    console.error('[POST /api/ecount-erp] REST API 처리 중 에러:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || '이지데스크 서버 RPA 구동 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
