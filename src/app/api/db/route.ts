import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import Database from 'better-sqlite3';
import os from 'os';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

// 📂 실제 AppData 경로의 이지데스크 가동용 SQLite3 물리 DB 인스턴스 획득 헬퍼
function getDirectDB() {
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
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  return new Database(targetPath, { verbose: console.log });
}

// 감사추적이 필요한 대상이 되는 핵심 비즈니스 테이블 목록 (지출 프로젝트 관리 확장 편입)
const TARGET_TABLES = [
  'crm_expenses',
  'crm_operators',
  'crm_customers',
  'crm_partners',
  'crm_estimates',
  'crm_orders',
  'products',
  'expense_projects'
];

// 🔑 최고관리자 및 작업자 정보 동시 획득용 헬퍼
async function verifySuperAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) return { isAuthorized: false, operatorName: 'Unknown' };
    
    const payload = decodeJwt(token);
    const role = (payload.role as string || '').toUpperCase();
    const name = payload.name as string || payload.username as string || 'Unknown';
    
    return {
      isAuthorized: role === 'SUPER_ADMIN',
      operatorName: name
    };
  } catch (e) {
    return { isAuthorized: false, operatorName: 'Unknown' };
  }
}

// 📂 [GET] 테이블 목록, 특정 테이블 스키마 DDL, 레코드 페이지네이션 조회
export async function GET(request: Request) {
  let db: any = null;
  try {
    const { isAuthorized, operatorName } = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

    db = getDirectDB();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const tableName = searchParams.get('tableName') || '';

    // 1. 모든 물리 테이블 목록 조회
    if (action === 'list') {
      // sqlite_master에서 직접 모든 사용자 정의 테이블 스캔
      const tablesList = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'import_%' AND name NOT LIKE 'sync_%' AND name NOT LIKE 'user_data_%' AND name NOT LIKE 'user_tables'
        ORDER BY name ASC;
      `).all();

      const tablesWithCount = [];
      for (const t of tablesList) {
        const name = t.name;
        
        // 각 테이블 한글명 힌트 매치
        const schemaInfo = db.prepare(`PRAGMA table_info("${name}");`).all();
        const hasDeletedCol = schemaInfo.some((col: any) => col.name === 'deleted_at');
        
        try {
          // 소프트 삭제된 테이블인 경우 일반 감시 카운트는 deleted_at IS NULL인 항목만 계산
          const countQuery = hasDeletedCol 
            ? `SELECT COUNT(*) as cnt FROM "${name}" WHERE "deleted_at" IS NULL`
            : `SELECT COUNT(*) as cnt FROM "${name}"`;
          
          const countRes = db.prepare(countQuery).get();
          
          // 한글 표시명 임시 매핑 바인딩
          let displayName = name;
          if (name === 'crm_expenses') displayName = '지출 장부 관리';
          else if (name === 'crm_operators') displayName = '운영자 권한 관리';
          else if (name === 'crm_customers') displayName = '고객 명단 관리';
          else if (name === 'crm_partners') displayName = '거래처 정보 관리';
          else if (name === 'crm_estimates') displayName = '견적서 관리';
          else if (name === 'crm_orders') displayName = '주문 내역 관리';
          else if (name === 'products') displayName = '광고 상품 관리';
          else if (name === 'expense_projects') displayName = '지출 프로젝트 관리';
          else if (name === 'crm_instagram_posts') displayName = '인스타그램 포스트 관리';
          else if (name === 'crm_naver_blog_posts') displayName = '네이버 블로그 포스트 관리';
          else if (name === 'crm_partner_contacts') displayName = '거래처 담당자 명함첩';
          else if (name === 'crm_payments') displayName = '결제 내역 관리';
          else if (name === 'crm_point_history') displayName = '포인트 이용 내역';
          else if (name === 'crm_purchase_orders') displayName = '구매 발주서 관리';
          else if (name === 'crm_reservations') displayName = '예약 현황 관리';

          tablesWithCount.push({
            name,
            displayName,
            count: countRes.cnt || 0
          });
        } catch (err) {
          tablesWithCount.push({
            name,
            displayName: name,
            count: 'Error'
          });
        }
      }

      return NextResponse.json({ success: true, tables: tablesWithCount });
    }

    // 2. 특정 테이블 컬럼 스키마 및 DDL 조회
    if (action === 'schema') {
      if (!tableName) {
        return NextResponse.json({ success: false, error: '테이블 이름(tableName)이 누락되었습니다.' }, { status: 400 });
      }

      const schema = db.prepare(`PRAGMA table_info("${tableName}");`).all();
      const ddlRes = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`).get();
      const ddl = ddlRes?.sql || '';

      return NextResponse.json({ 
        success: true, 
        tableName, 
        schema: schema || [],
        ddl 
      });
    }

    // 3. 특정 테이블의 원시 레코드 데이터 쿼리 (검색, 소프트 삭제 가드 연동)
    if (action === 'query') {
      if (!tableName) {
        return NextResponse.json({ success: false, error: '테이블 이름(tableName)이 누락되었습니다.' }, { status: 400 });
      }

      const limit = Number(searchParams.get('limit')) || 50;
      const offset = Number(searchParams.get('offset')) || 0;
      const searchKey = searchParams.get('searchKey') || '';
      const searchValue = searchParams.get('searchValue') || '';
      const showDeleted = searchParams.get('showDeleted') === 'true'; // 휴지통 보기 토글 스위치 대응

      const schemaInfo = db.prepare(`PRAGMA table_info("${tableName}");`).all();
      const hasDeletedCol = schemaInfo.some((col: any) => col.name === 'deleted_at');
      const pkCol = schemaInfo.find((col: any) => col.pk === 1 || col.pk === true)?.name || 'id';

      let baseQuery = `SELECT * FROM "${tableName}"`;
      let countQuery = `SELECT COUNT(*) as cnt FROM "${tableName}"`;
      
      // 조건절 조립용 배열
      const conditions: string[] = [];

      // 소프트 삭제 컬럼이 존재할 때의 가드 조건 주입
      if (hasDeletedCol) {
        if (showDeleted) {
          // 휴지통 모드: 삭제된 데이터만 보기 (deleted_at IS NOT NULL)
          conditions.push(`"deleted_at" IS NOT NULL`);
        } else {
          // 일반 모드: 삭제되지 않은 데이터만 보기 (deleted_at IS NULL)
          conditions.push(`"deleted_at" IS NULL`);
        }
      }

      // 검색 조건 주입
      if (searchValue) {
        const escapedVal = searchValue.replace(/'/g, "''");
        if (searchKey) {
          conditions.push(`"${searchKey}" LIKE '%${escapedVal}%'`);
        } else {
          // -- 검색 컬럼 선택 -- 일 때 전체 컬럼 대상 통합 검색 (OR 결합)
          const allColConditions = schemaInfo
            .map((col: any) => `"${col.name}" LIKE '%${escapedVal}%'`)
            .join(' OR ');
          if (allColConditions) {
            conditions.push(`(${allColConditions})`);
          }
        }
      }

      // WHERE 조건 조립
      const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
      
      baseQuery += whereClause + ` ORDER BY "${pkCol}" DESC LIMIT ${limit} OFFSET ${offset}`;
      countQuery += whereClause;

      const rows = db.prepare(baseQuery).all();
      const totalRes = db.prepare(countQuery).get();
      const total = totalRes?.cnt || 0;

      return NextResponse.json({ 
        success: true, 
        tableName, 
        rows: rows || [],
        total,
        limit,
        offset
      });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 요청(action)입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error("GET DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}

// 📥 [POST] 원시 SQL 실행 및 레코드 삽입 (INSERT)
export async function POST(request: Request) {
  let db: any = null;
  try {
    const { isAuthorized, operatorName } = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

    db = getDirectDB();
    const { action, query, tableName, rows } = await request.json();

    // 1. 커스텀 원시 SQL 직접 실행 (플레이그라운드 샌드박스)
    if (action === 'execute') {
      if (!query) {
        return NextResponse.json({ success: false, error: '실행할 SQL 쿼리가 없습니다.' }, { status: 400 });
      }

      // 파괴적인 악성 작업 시도 사전 방지 (Safety Check)
      const normalizedQuery = query.trim().toUpperCase();
      if (normalizedQuery.startsWith('DROP DATABASE')) {
        return NextResponse.json({ success: false, error: '보안 정책상 DATABASE 전체 파괴는 차단됩니다.' }, { status: 400 });
      }

      const stmt = db.prepare(query);
      
      // SELECT 쿼리인 경우 데이터 로우 반환
      if (normalizedQuery.startsWith('SELECT') || normalizedQuery.startsWith('PRAGMA')) {
        const data = stmt.all();
        return NextResponse.json({ success: true, rows: data || [] });
      } else {
        // CUD 쿼리인 경우 영향받은 로우 수 반환
        const info = stmt.run();
        return NextResponse.json({ 
          success: true, 
          rows: [],
          affectedRows: info.changes,
          lastInsertRowid: info.lastInsertRowid
        });
      }
    }

    // 2. 특정 테이블의 레코드 삽입 (INSERT) - 감사용 고유 UUID 및 생성일 자동 부여
    if (action === 'insert') {
      if (!tableName || !rows || !Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ success: false, error: '테이블 이름 또는 삽입 데이터가 유효하지 않습니다.' }, { status: 400 });
      }

      const schemaInfo = db.prepare(`PRAGMA table_info("${tableName}");`).all();
      const hasUuid = schemaInfo.some((col: any) => col.name === 'uuid');
      const hasCreatedAt = schemaInfo.some((col: any) => col.name === 'created_at');

      const now = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      
      const transaction = db.transaction((rowsToInsert) => {
        for (const row of rows) {
          // UUIDv4 동적 자동 주입
          if (hasUuid && (!row.uuid || row.uuid === '')) {
            row.uuid = crypto.randomUUID();
          }
          // created_at 자동 주입
          if (hasCreatedAt && (!row.created_at || row.created_at === '')) {
            row.created_at = now;
          }

          // SQLite 테이블 컬럼 구조 획득
          const columns = Object.keys(row).map(k => `"${k}"`).join(', ');
          const placeholders = Object.keys(row).map(() => '?').join(', ');
          const values = Object.values(row);

          db.prepare(`INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders});`).run(values);
        }
      });

      transaction(rows);
      return NextResponse.json({ success: true, message: `${rows.length}건의 레코드가 감사추적 UUID와 함께 주입되었습니다.` });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 요청(action)입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error("POST DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}

// ✏️ [PUT] 기존 레코드 갱신 (UPDATE) / 소프트 삭제 레코드 복원 (RESTORE)
export async function PUT(request: Request) {
  let db: any = null;
  try {
    const { isAuthorized, operatorName } = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

    db = getDirectDB();
    const { action, tableName, rows, id } = await request.json();

    // 1. 소프트 삭제 레코드 복원 액션 (RESTORE)
    if (action === 'restore') {
      if (!tableName || !id) {
        return NextResponse.json({ success: false, error: '테이블 명칭 혹은 복구할 레코드 고유 ID가 무효합니다.' }, { status: 400 });
      }

      const schemaInfo = db.prepare(`PRAGMA table_info("${tableName}");`).all();
      const hasRestored = schemaInfo.some((col: any) => col.name === 'restored_at');
      const pkCol = schemaInfo.find((col: any) => col.pk === 1 || col.pk === true)?.name || 'id';

      const now = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

      if (hasRestored) {
        db.prepare(`
          UPDATE "${tableName}" 
          SET "deleted_at" = NULL, "deleted_by" = NULL, "restored_at" = ?, "restored_by" = ? 
          WHERE "${pkCol}" = ?;
        `).run(now, operatorName, id);
      } else {
        // 복구 정보 저장 불가 컬럼일 경우 단순 소프트 딜리트 필드만 리셋
        db.prepare(`UPDATE "${tableName}" SET "deleted_at" = NULL WHERE "${pkCol}" = ?;`).run(id);
      }

      return NextResponse.json({ 
        success: true, 
        message: `물리 테이블 [${tableName}]의 레코드(ID ${id})가 최고관리자(${operatorName})에 의해 성공적으로 복구되었습니다.` 
      });
    }

    // 2. 일반 레코드 데이터 수정 (UPDATE) - 수정 이력 및 최종 수정자 낙인 찍기
    if (!tableName || !rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: '갱신 데이터 및 대상 테이블이 불분명합니다.' }, { status: 400 });
    }

    const schemaInfo = db.prepare(`PRAGMA table_info("${tableName}");`).all();
    const hasUpdatedAt = schemaInfo.some((col: any) => col.name === 'updated_at');
    const hasUpdatedBy = schemaInfo.some((col: any) => col.name === 'updated_by');
    const pkCol = schemaInfo.find((col: any) => col.pk === 1 || col.pk === true)?.name || 'id';

    const now = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

    const transaction = db.transaction((rowsToUpdate) => {
      for (const row of rows) {
        const pkVal = row[pkCol];
        if (pkVal === undefined) continue;

        // 감사용 수정 이력 강제 갱신
        if (hasUpdatedAt) row.updated_at = now;
        if (hasUpdatedBy) row.updated_by = operatorName;

        const updateFields: string[] = [];
        const values: any[] = [];

        Object.entries(row).forEach(([key, val]) => {
          if (key === pkCol) return; // PK 컬럼은 UPDATE 대상에서 차단
          updateFields.push(`"${key}" = ?`);
          values.push(val);
        });

        values.push(pkVal); // WHERE 절 바인딩값 추가
        db.prepare(`UPDATE "${tableName}" SET ${updateFields.join(', ')} WHERE "${pkCol}" = ?;`).run(values);
      }
    });

    transaction(rows);
    return NextResponse.json({ success: true, message: `${rows.length}건의 데이터가 성공적으로 갱신되었으며, 작업자(${operatorName}) 감사 이력이 영구 박제되었습니다.` });

  } catch (error: any) {
    console.error("PUT DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}

// ✕ [DELETE] 특정 레코드 삭제 (컬럼 존재 시 소프트 딜리트로 자동 전환!) 및 테이블 완전 삭제 (DROP)
export async function DELETE(request: Request) {
  let db: any = null;
  try {
    const { isAuthorized, operatorName } = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

    db = getDirectDB();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'deleteRows';
    const tableName = searchParams.get('tableName') || '';

    // 1. 특정 데이터 행 삭제 (감사 컬럼 유무 파악 -> Soft Delete / Hard Delete 자동 조율)
    if (action === 'deleteRows') {
      const idsParam = searchParams.get('ids') || '';
      if (!tableName || !idsParam) {
        return NextResponse.json({ success: false, error: '대상 테이블 혹은 삭제할 레코드 ID 목록이 누락되었습니다.' }, { status: 400 });
      }

      const ids = idsParam.split(',').map(s => {
        const num = Number(s);
        return isNaN(num) ? s : num; // 숫자 및 문자열 PK 대응
      });

      if (ids.length === 0) {
        return NextResponse.json({ success: false, error: '삭제할 고유 기본키(ID) 리스트가 무효합니다.' }, { status: 400 });
      }

      const schemaInfo = db.prepare(`PRAGMA table_info("${tableName}");`).all();
      const hasDeletedAt = schemaInfo.some((col: any) => col.name === 'deleted_at');
      const hasDeletedBy = schemaInfo.some((col: any) => col.name === 'deleted_by');
      const pkCol = schemaInfo.find((col: any) => col.pk === 1 || col.pk === true)?.name || 'id';

      const now = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

      if (hasDeletedAt) {
        // [A방안] 소프트 딜리트 (Soft Delete) 모드로 자동 전향 실행! (감사 데이터 영구 낙인)
        const updateStmt = hasDeletedBy
          ? db.prepare(`UPDATE "${tableName}" SET "deleted_at" = ?, "deleted_by" = ? WHERE "${pkCol}" = ?;`)
          : db.prepare(`UPDATE "${tableName}" SET "deleted_at" = ? WHERE "${pkCol}" = ?;`);
        
        const transaction = db.transaction((rowIds) => {
          for (const id of rowIds) {
            if (hasDeletedBy) {
              updateStmt.run(now, operatorName, id);
            } else {
              updateStmt.run(now, id);
            }
          }
        });
        
        transaction(ids);
        return NextResponse.json({ 
          success: true, 
          message: `${ids.length}건의 레코드가 영구 소멸되지 않고, 감사추적(삭제자 ${operatorName})과 함께 안전하게 소프트 삭제(휴지통 보관)로 자동 전환되었습니다.` 
        });
      } else {
        // 일반 시스템 테이블: 예외적으로 Hard Delete 작동 (Fallback)
        const deleteStmt = db.prepare(`DELETE FROM "${tableName}" WHERE "${pkCol}" = ?;`);
        
        const transaction = db.transaction((rowIds) => {
          for (const id of rowIds) {
            deleteStmt.run(id);
          }
        });
        
        transaction(ids);
        return NextResponse.json({ success: true, message: `${ids.length}건의 레코드가 데이터베이스에서 완전 소멸(Hard Delete)되었습니다.` });
      }
    }

    // 2. 테이블 완전 drop 가드
    if (action === 'dropTable') {
      if (!tableName) {
        return NextResponse.json({ success: false, error: '삭제할 대상 테이블 이름이 지정되지 않았습니다.' }, { status: 400 });
      }

      // 중요 마스터 테이블 보호막 (Safety Check)
      const protectedTables = ['crm_operators', 'crm_expenses', 'crm_categories', 'crm_tags'];
      if (protectedTables.includes(tableName)) {
        return NextResponse.json({ 
          success: false, 
          error: '보안 정책 경고: 시스템 마스터 핵심 테이블은 안전을 위해 완전히 DROP할 수 없습니다. 레코드 데이터만 삭제하거나 쿼리를 개별 편집하십시오.' 
        }, { status: 400 });
      }

      db.prepare(`DROP TABLE "${tableName}";`).run();
      return NextResponse.json({ success: true, message: `물리 테이블 [${tableName}]이 데이터베이스에서 완전히 삭제(DROP)되었습니다.` });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 요청(action)입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error("DELETE DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}
