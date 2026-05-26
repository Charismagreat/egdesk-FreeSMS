export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable, updateRows, insertRows } from '../../../../../egdesk-helpers';

export async function POST(request: Request) {
  try {
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

    // 1. 바코드로 품목 조회
    const result = await queryTable('inventory_items', {
      filters: { barcode: barcode.trim() }
    });

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'NOT_FOUND',
        message: '해당 바코드로 등록된 품목이 존재하지 않습니다.',
        barcode: barcode.trim()
      }, { status: 404 });
    }

    const item = result.rows[0];
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
    await updateRows('inventory_items', { stock: newStock }, {
      ids: [Number(item.id)]
    });

    // 4. 재고 변동 이력 로그 추가
    const scanLog = {
      itemId: Number(item.id),
      itemName: item.name,
      itemType: item.type,
      changeType: scanMode === 'adjust' ? 'adjust' : scanMode,
      quantity: changeQty,
      price: Number(item.price),
      operator: opName,
      note: scanMode === 'in' 
        ? '바코드 고속 입고' 
        : scanMode === 'out' 
          ? '바코드 고속 출고' 
          : `바코드 고속 실사 조정 (조정후: ${newStock}개)`,
      createdAt: new Date().toISOString()
    };

    const logResult = await insertRows('inventory_logs', [scanLog]);

    return NextResponse.json({
      success: true,
      item: { ...item, stock: newStock },
      log: logResult ? logResult[0] : null
    });

  } catch (error: any) {
    console.error('바코드 스캔 입출고 처리 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '스캔 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}
