import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

export const dynamic = 'force-dynamic';

function getDB() {
  return new Database('crm_data.db');
}

export async function POST(request: Request) {
  let db;
  try {
    db = getDB();
    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: '유효한 품목 데이터 배열이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 1. 기존 DB 내 등록된 모든 품목명(name) 가져와서 중복 방지 캐싱
    const existingNames = new Set<string>();
    try {
      const rows = db.prepare('SELECT name FROM inventory_items').all() as any[];
      rows.forEach((row) => {
        if (row.name) {
          existingNames.add(row.name.trim());
        }
      });
    } catch (e) {
      console.warn('기존 재고 품목 목록 조회 실패 (첫 생성 가능성):', e);
    }

    let insertedCount = 0;
    const createdAtStr = new Date().toISOString();

    const insertTx = db.transaction(() => {
      const insertItemStmt = db.prepare(`
        INSERT INTO inventory_items (
          type, name, category, price, partner, stock, safeStock, location, spec, unitType, unitValue, boxContains, description, tags, barcode, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertLogStmt = db.prepare(`
        INSERT INTO inventory_logs (
          itemId, itemName, itemType, changeType, quantity, price, operator, note, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const name = item.name?.trim();
        const type = item.type === 'product' ? 'product' : 'material';
        const category = item.category?.trim();

        // 필수값 부재 시 패스
        if (!name || !category) continue;

        // 이미 동일한 이름의 품목이 있는 경우 스킵
        if (existingNames.has(name)) continue;

        const price = Number(item.price) || 0;
        const safeStock = Number(item.safeStock) || 0;
        const stock = Number(item.stock) || 0;
        const partner = item.partner?.trim() || '';
        const location = item.location?.trim() || '';
        const spec = item.spec?.trim() || '';
        const description = item.description?.trim() || '';

        // 단위 구분 파싱
        let unitType = 'count';
        let unitValue = '개';
        let boxContains: number | null = null;

        if (item.unitType === 'weight') {
          unitType = 'weight';
          unitValue = item.unitValue?.trim() || 'g';
        } else if (item.unitType === 'box') {
          unitType = 'box';
          unitValue = '박스';
          boxContains = Number(item.boxContains) || 10;
        }

        // 품목 삽입 실행
        const info = insertItemStmt.run(
          type,
          name,
          category,
          price,
          partner,
          stock,
          safeStock,
          location,
          spec,
          unitType,
          unitValue,
          boxContains,
          description,
          item.tags?.trim() || (type === 'product' ? '판매중' : '사용중'),
          item.barcode?.trim() || '',
          createdAtStr
        );

        insertedCount++;

        // 최초 재고가 0보다 큰 경우, 변동 로그 함께 생성
        if (stock > 0) {
          const insertedId = info.lastInsertRowid;
          insertLogStmt.run(
            insertedId,
            name,
            type,
            'in',
            stock,
            price,
            '시스템 (일괄 등록)',
            '최초 기초 재고 등록',
            createdAtStr
          );
        }
      }
    });

    insertTx();

    return NextResponse.json({
      success: true,
      count: insertedCount,
      totalReceived: items.length
    });

  } catch (error: any) {
    console.error('재고 엑셀 일괄 등록 API 에러:', error);
    return NextResponse.json(
      { success: false, error: error.message || '재고를 등록하는 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    if (db) db.close();
  }
}
