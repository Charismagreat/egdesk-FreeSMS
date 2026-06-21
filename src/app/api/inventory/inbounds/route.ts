export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { executeSQL } from '../../../../../egdesk-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inboundId = searchParams.get('inbound_id');

    if (inboundId) {
      // 특정 입고 내역의 상세 품목 조회
      const res = await executeSQL(`
        SELECT * FROM crm_inventory_inbound_items 
        WHERE inbound_id = '${inboundId.replace(/'/g, "''")}' 
        ORDER BY created_at ASC
      `);
      return NextResponse.json({ success: true, data: res.rows || [] });
    } else {
      // 전체 자율 입고 내역 대장 조회
      const res = await executeSQL(`
        SELECT * FROM crm_inventory_inbounds 
        ORDER BY inbound_date DESC, created_at DESC 
        LIMIT 100
      `);
      return NextResponse.json({ success: true, data: res.rows || [] });
    }
  } catch (error: any) {
    console.error('자율 입고 내역 조회 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '입고 내역을 조회하지 못했습니다.' },
      { status: 500 }
    );
  }
}
