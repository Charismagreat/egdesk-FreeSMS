export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

// 데이터베이스 인스턴스 헬퍼
function getDB() {
  return new Database('crm_data.db');
}

// 테이블 초기화 헬퍼 (없을 경우 자동 생성)
function initTables(db: Database.Database) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      partner TEXT,
      stock INTEGER NOT NULL,
      safeStock INTEGER NOT NULL,
      location TEXT,
      spec TEXT,
      unitType TEXT,
      unitValue TEXT,
      boxContains INTEGER,
      description TEXT,
      tags TEXT,
      barcode TEXT,
      createdAt TEXT NOT NULL
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL,
      itemName TEXT NOT NULL,
      itemType TEXT NOT NULL,
      changeType TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      operator TEXT NOT NULL,
      note TEXT,
      createdAt TEXT NOT NULL
    )
  `).run();
}

// GET: 재고 품목 목록 조회
export async function GET(request: Request) {
  let db;
  try {
    db = getDB();
    initTables(db);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'material' 또는 'product'
    
    let query = 'SELECT * FROM inventory_items WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY createdAt DESC LIMIT 100';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('재고 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '재고 목록을 조회하지 못했습니다.' },
      { status: 500 }
    );
  } finally {
    if (db) db.close();
  }
}

// POST: 신규 품목 등록
export async function POST(request: Request) {
  let db;
  try {
    db = getDB();
    initTables(db);
    const body = await request.json();
    
    const { type, name, category, price, partner, stock, safeStock, location, spec, unitType, unitValue, boxContains, description, tags, barcode } = body;

    if (!type || !name || !category || price === undefined || stock === undefined || safeStock === undefined) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션 처리
    const insertItem = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO inventory_items (
          type, name, category, price, partner, stock, safeStock, location, spec, unitType, unitValue, boxContains, description, tags, barcode, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const createdAt = new Date().toISOString();
      const info = stmt.run(
        type,
        name,
        category,
        Number(price),
        partner || '',
        Number(stock),
        Number(safeStock),
        location || '',
        spec || '',
        unitType || 'count',
        unitValue || '개',
        boxContains ? Number(boxContains) : null,
        description || '',
        tags || '',
        barcode || '',
        createdAt
      );

      const insertedId = info.lastInsertRowid;

      // 초기 재고가 0보다 큰 경우 입고 변동 이력도 추가
      if (Number(stock) > 0) {
        const logStmt = db.prepare(`
          INSERT INTO inventory_logs (
            itemId, itemName, itemType, changeType, quantity, price, operator, note, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        logStmt.run(
          insertedId,
          name,
          type,
          'in',
          Number(stock),
          Number(price),
          '시스템 관리자',
          '최초 등록 입고',
          createdAt
        );
      }

      return { id: insertedId };
    });

    const result = insertItem();

    return NextResponse.json({ success: true, data: [result] });
  } catch (error: any) {
    console.error('재고 등록 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '재고 품목을 등록하지 못했습니다.' },
      { status: 500 }
    );
  } finally {
    if (db) db.close();
  }
}

// PUT: 품목 정보 수정
export async function PUT(request: Request) {
  let db;
  try {
    db = getDB();
    initTables(db);
    const body = await request.json();
    const { id, name, category, price, partner, safeStock, location, spec, unitType, unitValue, boxContains, description, tags, barcode } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '품목 ID가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const sets: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { sets.push('name = ?'); params.push(name); }
    if (category !== undefined) { sets.push('category = ?'); params.push(category); }
    if (price !== undefined) { sets.push('price = ?'); params.push(Number(price)); }
    if (partner !== undefined) { sets.push('partner = ?'); params.push(partner); }
    if (safeStock !== undefined) { sets.push('safeStock = ?'); params.push(Number(safeStock)); }
    if (location !== undefined) { sets.push('location = ?'); params.push(location); }
    if (spec !== undefined) { sets.push('spec = ?'); params.push(spec); }
    if (unitType !== undefined) { sets.push('unitType = ?'); params.push(unitType); }
    if (unitValue !== undefined) { sets.push('unitValue = ?'); params.push(unitValue); }
    if (boxContains !== undefined) { sets.push('boxContains = ?'); params.push(boxContains ? Number(boxContains) : null); }
    if (description !== undefined) { sets.push('description = ?'); params.push(description); }
    if (tags !== undefined) { sets.push('tags = ?'); params.push(tags); }
    if (barcode !== undefined) { sets.push('barcode = ?'); params.push(barcode); }

    if (sets.length === 0) {
      return NextResponse.json({ success: true });
    }

    params.push(Number(id));
    const query = `UPDATE inventory_items SET ${sets.join(', ')} WHERE id = ?`;
    
    db.prepare(query).run(...params);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('재고 정보 수정 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '재고 정보를 수정하지 못했습니다.' },
      { status: 500 }
    );
  } finally {
    if (db) db.close();
  }
}

// DELETE: 품목 삭제
export async function DELETE(request: Request) {
  let db;
  try {
    db = getDB();
    initTables(db);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '품목 ID가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const deleteTx = db.transaction(() => {
      // 1. 품목 삭제
      db.prepare('DELETE FROM inventory_items WHERE id = ?').run(Number(id));
      // 2. 관련 이력 삭제
      db.prepare('DELETE FROM inventory_logs WHERE itemId = ?').run(Number(id));
    });

    deleteTx();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('재고 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '재고 품목을 삭제하지 못했습니다.' },
      { status: 500 }
    );
  } finally {
    if (db) db.close();
  }
}
