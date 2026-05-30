import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { 
  listTables, getTableSchema, executeSQL, 
  insertRows, updateRows, deleteRows, deleteTable 
} from '../../../../egdesk-helpers';

export const dynamic = 'force-dynamic';

// 🔑 최고관리자 권한 체크용 내부 헬퍼 함수
async function verifySuperAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) return false;
    
    const payload = decodeJwt(token);
    const role = (payload.role as string || '').toUpperCase();
    
    // 최고관리자(SUPER_ADMIN) 권한이 확인된 경우에만 통과
    return role === 'SUPER_ADMIN';
  } catch (e) {
    console.error("verifySuperAdmin failed in DB route:", e);
    return false;
  }
}

// 📂 [GET] 테이블 목록, 특정 테이블 스키마 DDL, 레코드 페이지네이션 조회
export async function GET(request: Request) {
  try {
    const isAuthorized = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const tableName = searchParams.get('tableName') || '';

    // 1. 모든 물리 테이블 목록 조회
    if (action === 'list') {
      const tablesResult = await listTables();
      
      // 각 테이블의 실시간 데이터 행(Row) 개수 조회를 동적으로 수행
      const list = tablesResult.rows || [];
      const tablesWithCount = [];
      
      for (const t of list) {
        const name = t.name || t.tbl_name;
        if (!name || name === 'sqlite_sequence') continue;
        
        try {
          const countRes = await executeSQL(`SELECT COUNT(*) as cnt FROM "${name}"`);
          const count = countRes.rows?.[0]?.cnt || 0;
          tablesWithCount.push({
            name,
            count
          });
        } catch (err) {
          tablesWithCount.push({
            name,
            count: 'Error'
          });
        }
      }

      return NextResponse.json({ success: true, tables: tablesWithCount });
    }

    // 2. 특정 테이블 컬럼 스키마 및 생성 DDL 쿼리 조회
    if (action === 'schema') {
      if (!tableName) {
        return NextResponse.json({ success: false, error: '테이블 이름(tableName)이 누락되었습니다.' }, { status: 400 });
      }

      // 테이블 구조 조회
      const schemaResult = await getTableSchema(tableName);
      
      // 테이블 생성 DDL 쿼리 조회
      const ddlRes = await executeSQL(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
      const ddl = ddlRes.rows?.[0]?.sql || '';

      return NextResponse.json({ 
        success: true, 
        tableName, 
        schema: schemaResult.rows || [],
        ddl 
      });
    }

    // 3. 특정 테이블의 원시 레코드 데이터 쿼리
    if (action === 'query') {
      if (!tableName) {
        return NextResponse.json({ success: false, error: '테이블 이름(tableName)이 누락되었습니다.' }, { status: 400 });
      }

      const limit = Number(searchParams.get('limit')) || 100;
      const offset = Number(searchParams.get('offset')) || 0;
      const searchKey = searchParams.get('searchKey') || '';
      const searchValue = searchParams.get('searchValue') || '';

      let query = `SELECT * FROM "${tableName}"`;
      let countQuery = `SELECT COUNT(*) as cnt FROM "${tableName}"`;

      // 컬럼명 기반 간단 필터링 기능 지원
      if (searchKey && searchValue) {
        const escapedVal = searchValue.replace(/'/g, "''");
        const whereClause = ` WHERE "${searchKey}" LIKE '%${escapedVal}%'`;
        query += whereClause;
        countQuery += whereClause;
      }

      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const dataResult = await executeSQL(query);
      const totalCountRes = await executeSQL(countQuery);
      
      const total = totalCountRes.rows?.[0]?.cnt || 0;

      return NextResponse.json({ 
        success: true, 
        tableName, 
        rows: dataResult.rows || [],
        total,
        limit,
        offset
      });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 요청(action)입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error("GET DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 📥 [POST] 커스텀 SQL 실행 및 신규 레코드 대량 삽입
export async function POST(request: Request) {
  try {
    const isAuthorized = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

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

      const result = await executeSQL(query);
      return NextResponse.json({ 
        success: true, 
        rows: result.rows || [],
        affectedRows: result.changes !== undefined ? result.changes : null,
        lastInsertRowid: result.lastInsertRowid !== undefined ? result.lastInsertRowid : null
      });
    }

    // 2. 특정 테이블의 레코드 삽입 (INSERT)
    if (action === 'insert') {
      if (!tableName || !rows || !Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ success: false, error: '테이블 이름 또는 삽입 데이터가 유효하지 않습니다.' }, { status: 400 });
      }

      await insertRows(tableName, rows);
      return NextResponse.json({ success: true, message: `${rows.length}건의 레코드가 정상 주입되었습니다.` });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 요청(action)입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error("POST DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ✏️ [PUT] 기존 레코드 갱신 (UPDATE)
export async function PUT(request: Request) {
  try {
    const isAuthorized = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

    const { tableName, rows } = await request.json();

    if (!tableName || !rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: '갱신 데이터 및 대상 테이블이 불분명합니다.' }, { status: 400 });
    }

    await updateRows(tableName, rows);
    return NextResponse.json({ success: true, message: `${rows.length}건의 데이터가 성공적으로 갱신되었습니다.` });
  } catch (error: any) {
    console.error("PUT DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ✕ [DELETE] 특정 레코드 삭제 및 테이블 완전 삭제 (DELETE / DROP)
export async function DELETE(request: Request) {
  try {
    const isAuthorized = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'deleteRows';
    const tableName = searchParams.get('tableName') || '';

    // 1. 테이블 내 특정 로우 삭제 (DELETE FROM table WHERE id IN (...))
    if (action === 'deleteRows') {
      const idsParam = searchParams.get('ids') || '';
      if (!tableName || !idsParam) {
        return NextResponse.json({ success: false, error: '대상 테이블 혹은 삭제할 레코드 ID 목록이 누락되었습니다.' }, { status: 400 });
      }

      const ids = idsParam.split(',').map(Number).filter(n => !isNaN(n));
      if (ids.length === 0) {
        return NextResponse.json({ success: false, error: '삭제할 숫자형 고유 번호(ID) 리스트가 무효합니다.' }, { status: 400 });
      }

      await deleteRows(tableName, { ids });
      return NextResponse.json({ success: true, message: `${ids.length}건의 데이터 행이 데이터베이스에서 완전 소멸되었습니다.` });
    }

    // 2. 테이블 완전 훼손/소멸 (DROP TABLE) - 이중 잠금 가드 필요
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

      await deleteTable(tableName);
      return NextResponse.json({ success: true, message: `물리 테이블 [${tableName}]이 데이터베이스에서 완전히 삭제(DROP)되었습니다.` });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 요청(action)입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error("DELETE DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
