export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { querySql, queryParams = {} } = await req.json();

    if (!querySql) {
      return NextResponse.json({ success: false, error: '실행할 SQL 쿼리가 제공되지 않았습니다.' }, { status: 400 });
    }

    const cleanSql = querySql.trim().replace(/\s+/g, ' ');

    // 1. SELECT 쿼리 여부 검증 (보안 가드)
    if (!/^select\s/i.test(cleanSql)) {
      return NextResponse.json({ success: false, error: '보안 정책상 SELECT 조회 쿼리만 실행할 수 있습니다.' }, { status: 400 });
    }

    // 2. 파괴적인 명령어 탐지 차단 (단어 경계 \b를 지정하여 deleted_at, created_at 등의 컬럼명이 무고하게 필터링되는 문제 해결)
    const forbiddenKeywords = [/\binsert\b/i, /\bupdate\b/i, /\bdelete\b/i, /\bdrop\b/i, /\balter\b/i, /\bcreate\b/i, /\breplace\b/i, /\btruncate\b/i];
    if (forbiddenKeywords.some(kw => kw.test(cleanSql))) {
      return NextResponse.json({ success: false, error: '데이터 변경 또는 데이터베이스 구조를 변경하는 쿼리는 실행할 수 없습니다.' }, { status: 400 });
    }

    // 3. SQLite 연결 준비
    const Database = require('better-sqlite3');
    const os = require('os');
    const path = require('path');
    const fs = require('fs');

    const homeDir = os.homedir();
    const appData = process.env.APPDATA || path.join(homeDir, 'AppData/Roaming');
    const dbPaths = [
      path.join(appData, 'EGDesk/database/user_data.db'),
      path.join(appData, 'egdesk/database/user_data.db')
    ];
    let dbPath = '';
    for (const p of dbPaths) {
      if (fs.existsSync(p)) {
        dbPath = p;
        break;
      }
    }
    if (!dbPath) dbPath = dbPaths[0];

    const db = new Database(dbPath);

    // 4. 지능형 소프트 삭제(deleted_at IS NULL) 보정기 탑재
    let finalSql = cleanSql;
    try {
      const tableMatch = cleanSql.match(/from\s+([a-zA-Z0-9_]+)/i);
      if (tableMatch && tableMatch[1]) {
        const tableName = tableMatch[1];
        const cols = db.prepare(`PRAGMA table_info(${tableName});`).all().map((c: any) => c.name);
        
        // 해당 테이블에 deleted_at이 있고, 쿼리에 deleted_at 관련 구문이 없을 때 동적 추가
        if (cols.includes('deleted_at') && !/deleted_at/i.test(cleanSql)) {
          const boundaryMatch = finalSql.match(/(group\s+by|order\s+by|limit)/i);
          const boundaryIndex = boundaryMatch ? boundaryMatch.index : finalSql.length;
          const preBoundary = finalSql.substring(0, boundaryIndex);
          const postBoundary = finalSql.substring(boundaryIndex);

          if (/where/i.test(preBoundary)) {
            finalSql = preBoundary.replace(/where\s+/i, `WHERE ${tableName}.deleted_at IS NULL AND `) + postBoundary;
          } else {
            finalSql = preBoundary + ` WHERE ${tableName}.deleted_at IS NULL ` + postBoundary;
          }
        }
      }
    } catch (e: any) {
      console.warn('Query Rectifier warning:', e.message);
    }

    // 5. 쿼리 파라미터 매핑 보정 (sqlite3는 ':id' 또는 '@id' 형식을 지원함)
    // AI나 사용자가 입력한 파라미터 맵 (예: { name: '홍길동' })을 SQLite가 바인딩할 수 있도록 변환
    // SQLite의 경우 쿼리 내부의 ':param'을 매칭할 때 파라미터 객체의 키 그대로 바인딩할 수 있음.
    // 예: db.prepare("SELECT * FROM users WHERE name = :name").get({ name: '홍길동' })
    const bindingParams: Record<string, any> = {};
    Object.keys(queryParams).forEach(key => {
      // 키 값에 콜론(:)이 안 붙어 있는 경우 그대로 얹음
      const cleanKey = key.startsWith(':') ? key.substring(1) : key;
      bindingParams[cleanKey] = queryParams[key];
    });

    // 6. 실행 및 결과 반환
    const row = db.prepare(finalSql).get(bindingParams);
    db.close();

    return NextResponse.json({
      success: true,
      data: row || null,
      executedSql: finalSql
    });

  } catch (error: any) {
    console.error('run-query API error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
