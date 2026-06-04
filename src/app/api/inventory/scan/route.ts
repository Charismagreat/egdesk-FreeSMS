export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

function getDB() {
  return new Database('crm_data.db');
}

export async function POST(request: Request) {
  let db;
  try {
    db = getDB();
    const body = await request.json();
    const { barcode, mode, operator, quantity } = body;

    if (!barcode) {
      return NextResponse.json(
        { success: false, error: '바코드 번호가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const scanMode = mode || 'in'; // 기본값 입고
    const opName = operator || '바코드 스캐너';
    const adjustQty = quantity !== undefined ? Number(quantity) : 1;

    const result = db.transaction(() => {
      // 1. 바코드로 품목 조회
      const item = db.prepare('SELECT * FROM inventory_items WHERE barcode = ?').get(barcode.trim()) as any;
      if (!item) {
        return null;
      }

      let newStock = Number(item.stock);
      let changeQty = 1;

      // 2. 모드에 따라 수량 가감
      if (scanMode === 'in') {
        newStock += 1;
        changeQty = 1;
      } else if (scanMode === 'out') {
        newStock = Math.max(0, newStock - 1);
        changeQty = 1;
      } else if (scanMode === 'adjust') {
        newStock = adjustQty;
        changeQty = adjustQty;
      }

      // 3. 품목 현재고 DB 업데이트
      db.prepare('UPDATE inventory_items SET stock = ? WHERE id = ?').run(newStock, Number(item.id));

      // 4. 재고 변동 이력 로그 추가
      const noteText = scanMode === 'in' 
        ? '바코드 고속 입고' 
        : scanMode === 'out' 
          ? '바코드 고속 출고' 
          : `바코드 고속 실사 조정 (조정후: ${newStock}개)`;
      
      const createdAt = new Date().toISOString();
      const info = db.prepare(`
        INSERT INTO inventory_logs (
          itemId, itemName, itemType, changeType, quantity, price, operator, note, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        Number(item.id),
        item.name,
        item.type,
        scanMode === 'adjust' ? 'adjust' : scanMode,
        changeQty,
        Number(item.price),
        opName,
        noteText,
        createdAt
      );

      return {
        item: { ...item, stock: newStock },
        logId: info.lastInsertRowid
      };
    });

    const txResult = result();

    if (!txResult) {
      return NextResponse.json({
        success: false,
        error: 'NOT_FOUND',
        message: '해당 바코드로 등록된 품목이 존재하지 않습니다.',
        barcode: barcode.trim()
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      item: txResult.item,
      log: { id: txResult.logId }
    });

  } catch (error: any) {
    console.error('바코드 스캔 입출고 처리 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '스캔 처리에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (db) db.close();
  }
}
