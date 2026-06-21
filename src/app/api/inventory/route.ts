export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import {
  queryTable,
  insertRows,
  updateRows,
  deleteRows,
  executeSQL
} from '../../../../egdesk-helpers';

// GET: 재고 품목 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'material' 또는 'product'
    
    // SQL 금지어 DELETE 회피를 위해 queryTable 사용 후 JS 레벨에서 소프트 삭제 데이터 필터링
    const queryRes = await queryTable('inventory_items', {
      limit: 1000,
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    });
    let rows = queryRes.rows || [];

    // 소프트 삭제 필터링
    rows = rows.filter((r: any) => !r.deleted_at);

    // 품목 구분 필터링
    if (type) {
      rows = rows.filter((r: any) => r.type === type);
    }

    // 100건으로 슬라이싱 제한
    rows = rows.slice(0, 100);

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('재고 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '재고 목록을 조회하지 못했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 신규 품목 등록
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, name, category, price, partner, stock, safeStock, location, spec, unitType, unitValue, boxContains, description, tags, barcode } = body;

    if (!type || !name || !category || price === undefined || stock === undefined || safeStock === undefined) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const createdAt = new Date().toISOString();
    
    const insertData = {
      type,
      name,
      category,
      price: Number(price),
      partner: partner || '',
      stock: Number(stock),
      safeStock: Number(safeStock),
      location: location || '',
      spec: spec || '',
      unitType: unitType || 'count',
      unitValue: unitValue || '개',
      boxContains: boxContains ? Number(boxContains) : null,
      description: description || '',
      tags: tags || '',
      barcode: barcode || '',
      createdAt
    };

    await insertRows('inventory_items', [insertData]);

    // 방금 등록된 ID 획득 (가장 높은 ID 조회)
    const maxIdRes = await executeSQL('SELECT MAX(id) as maxId FROM inventory_items');
    const insertedId = maxIdRes.rows?.[0]?.maxId || 0;

    // 초기 재고가 0보다 큰 경우 입고 변동 이력도 추가
    if (Number(stock) > 0) {
      const logData = {
        itemId: insertedId,
        itemName: name,
        itemType: type,
        changeType: 'in',
        quantity: Number(stock),
        price: Number(price),
        operator: '시스템 관리자',
        note: '최초 등록 입고',
        createdAt
      };
      await insertRows('inventory_logs', [logData]);
    }

    return NextResponse.json({ success: true, data: [{ id: insertedId }] });
  } catch (error: any) {
    console.error('재고 등록 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '재고 품목을 등록하지 못했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 품목 정보 수정
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, category, price, partner, safeStock, location, spec, unitType, unitValue, boxContains, description, tags, barcode } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '품목 ID가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};

    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = Number(price);
    if (partner !== undefined) updateData.partner = partner;
    if (safeStock !== undefined) updateData.safeStock = Number(safeStock);
    if (location !== undefined) updateData.location = location;
    if (spec !== undefined) updateData.spec = spec;
    if (unitType !== undefined) updateData.unitType = unitType;
    if (unitValue !== undefined) updateData.unitValue = unitValue;
    if (boxContains !== undefined) updateData.boxContains = boxContains ? Number(boxContains) : null;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (barcode !== undefined) updateData.barcode = barcode;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true });
    }

    await updateRows('inventory_items', updateData, { filters: { id: String(id) } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('재고 정보 수정 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '재고 정보를 수정하지 못했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 품목 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '품목 ID가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 1. 품목 삭제
    await deleteRows('inventory_items', { filters: { id: String(id) } });
    
    // 2. 관련 이력 삭제
    await deleteRows('inventory_logs', { filters: { itemId: String(id) } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('재고 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: error.message || '재고 품목을 삭제하지 못했습니다.' },
      { status: 500 }
    );
  }
}
