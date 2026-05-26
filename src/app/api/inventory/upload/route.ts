import { NextResponse } from 'next/server';
import { queryTable, insertRows } from '@/../egdesk-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: '유효한 품목 데이터 배열이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 1. 기존 DB 내 등록된 모든 품목명(name) 가져와서 중복 방지 캐싱
    const existingItems = new Map<string, any>();
    try {
      const dbItems = await queryTable('inventory_items');
      if (dbItems && Array.isArray(dbItems.rows)) {
        dbItems.rows.forEach((row: any) => {
          existingItems.set(row.name?.trim(), row);
        });
      }
    } catch (e) {
      console.warn('기존 재고 품목 목록 조회 실패:', e);
    }

    let insertedCount = 0;
    const createdAtStr = new Date().toISOString();

    for (const item of items) {
      const name = item.name?.trim();
      const type = item.type === '제품' ? 'product' : 'material'; // 한글 종류를 DB 스키마 값으로 매핑
      const category = item.category?.trim();

      // 필수값 부재 시 패스
      if (!name || !category) continue;

      // 이미 동일한 이름의 품목이 있는 경우 스킵
      if (existingItems.has(name)) continue;

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

      if (item.unitType === '중량' || item.unitType === '중량/부피' || item.unitType === 'weight') {
        unitType = 'weight';
        unitValue = item.unitValue?.trim() || 'g';
      } else if (item.unitType === '박스' || item.unitType === 'box') {
        unitType = 'box';
        unitValue = '박스';
        boxContains = Number(item.boxContains) || 10;
      }

      // 2. 신규 품목 등록
      const itemRow = {
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
        tags: item.tags?.trim() || (type === 'product' ? '판매중' : '사용중'), // 엑셀 태그 파싱 및 종류별 기본값 보장
        createdAt: createdAtStr
      };

      try {
        const insertRes = await insertRows('inventory_items', [itemRow]);
        insertedCount++;

        // 3. 최초 재고가 0보다 큰 경우, 재고 변동 이력(inventory_logs)도 유기적으로 함께 생성
        if (stock > 0 && insertRes) {
          // 방금 삽입한 아이템의 ID를 가져오기 위해 즉시 쿼리
          let newlyInsertedId: number | null = null;
          try {
            const freshItem = await queryTable('inventory_items', {
              filters: { name: name }
            });
            if (freshItem && freshItem.rows && freshItem.rows.length > 0) {
              newlyInsertedId = freshItem.rows[0].id;
            }
          } catch (queryErr) {
            console.error('방금 등록된 품목의 ID 조회 실패:', queryErr);
          }

          if (newlyInsertedId) {
            const logRow = {
              itemId: newlyInsertedId,
              itemName: name,
              itemType: type,
              changeType: 'in', // 'in' (기초 입고)
              quantity: stock,
              price: price,
              operator: '시스템 (일괄 등록)',
              note: '최초 기초 재고 등록',
              createdAt: createdAtStr
            };
            await insertRows('inventory_logs', [logRow]);
          }
        }
      } catch (insertErr) {
        console.error(`품목 [${name}] 등록 에러:`, insertErr);
      }
    }

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
  }
}
