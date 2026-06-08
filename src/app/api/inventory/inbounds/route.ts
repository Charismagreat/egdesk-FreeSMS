export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

function getDB() {
  return new Database('crm_data.db');
}

export async function GET(request: Request) {
  let db;
  try {
    db = getDB();
    const { searchParams } = new URL(request.url);
    const inboundId = searchParams.get('inbound_id');

    if (inboundId) {
      // 특정 입고 내역의 상세 품목 조회
      const stmt = db.prepare(`
        SELECT * FROM crm_inventory_inbound_items 
        WHERE inbound_id = ? 
        ORDER BY created_at ASC
      `);
      const rows = stmt.all(inboundId);
      return NextResponse.json({ success: true, data: rows });
    } else {
      // 전체 자율 입고 내역 대장 조회
      const stmt = db.prepare(`
        SELECT * FROM crm_inventory_inbounds 
        ORDER BY inbound_date DESC, created_at DESC 
        LIMIT 100
      `);
      const rows = stmt.all();
      return NextResponse.json({ success: true, data: rows });
    }
  } catch (error: any) {
    console.error('자율 입고 내역 조회 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '입고 내역을 조회하지 못했습니다.' },
      { status: 500 }
    );
  } finally {
    if (db) db.close();
  }
}
