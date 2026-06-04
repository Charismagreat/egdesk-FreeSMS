export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

function getDB() {
  return new Database('crm_data.db');
}

// GET: 재고 변동 로그 목록 조회
export async function GET() {
  let db;
  try {
    db = getDB();
    const rows = db.prepare('SELECT * FROM inventory_logs ORDER BY createdAt DESC LIMIT 100').all();
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('재고 로그 조회 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '재고 로그를 조회하지 못했습니다.' },
      { status: 500 }
    );
  } finally {
    if (db) db.close();
  }
}

// POST: 재고 입출고 및 실사 조정 처리
export async function POST(request: Request) {
  let db;
  try {
    db = getDB();
    const body = await request.json();
    const { itemId, changeType, quantity, price, operator, note } = body;

    if (!itemId || !changeType || quantity === undefined || price === undefined || !operator) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const tx = db.transaction(() => {
      // 1. 기존 품목 정보 조회
      const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(Number(itemId)) as any;
      if (!item) {
        throw new Error('존재하지 않는 품목입니다.');
      }

      const currentStock = Number(item.stock);
      const qty = Number(quantity);
      let newStock = currentStock;
      let logQuantity = qty;

      // 2. 변동 유형에 따른 재고 수량 계산
      if (changeType === 'in') {
        newStock = currentStock + qty;
        logQuantity = qty;
      } else if (changeType === 'out') {
        newStock = currentStock - qty;
        logQuantity = qty;
      } else if (changeType === 'adjust') {
        newStock = qty;
        logQuantity = qty - currentStock;
      } else {
        throw new Error('잘못된 변동 유형입니다.');
      }

      // 3. 품목 현재고 업데이트
      db.prepare('UPDATE inventory_items SET stock = ? WHERE id = ?').run(newStock, Number(itemId));

      // 4. 변동 로그 삽입
      const noteText = changeType === 'adjust'
        ? `${note || ''} (실사 조정: ${currentStock}개 -> ${newStock}개)`.trim()
        : note || '';
      
      const createdAt = new Date().toISOString();
      db.prepare(`
        INSERT INTO inventory_logs (
          itemId, itemName, itemType, changeType, quantity, price, operator, note, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        Number(itemId),
        item.name,
        item.type,
        changeType,
        logQuantity,
        Number(price),
        operator,
        noteText,
        createdAt
      );

      return {
        itemId: Number(itemId),
        itemName: item.name,
        previousStock: currentStock,
        newStock: newStock,
        changeType,
        logQuantity
      };
    });

    const result = tx();

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('재고 변동 처리 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '재고 변동 처리에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (db) db.close();
  }
}
