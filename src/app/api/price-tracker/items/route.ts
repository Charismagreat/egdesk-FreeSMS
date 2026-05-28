export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable, insertRows, updateRows, deleteRows } from '@/../egdesk-helpers';

// GET /api/price-tracker/items : 가격 추적 품목 리스트 조회 및 실시간 마진율 연동 계산
export async function GET() {
  try {
    const itemsRes = await queryTable('tracked_items', { orderBy: 'item_id', orderDirection: 'DESC' });
    const items = itemsRes.rows || [];

    // 각 품목별 최신 가격을 이력에서 조회하여 마진율 실시간 동적 매핑
    const enrichedItems = await Promise.all(items.map(async (item: any) => {
      // url_id 추출을 위해 target_urls 조회
      const urlsRes = await queryTable('target_urls', { filters: { item_id: String(item.item_id) } });
      const urls = urlsRes.rows || [];
      
      let latestPrice = 0;
      let latestTime = '-';

      if (urls.length > 0) {
        // 최신 가격 이력 단건 조회
        const historyRes = await queryTable('price_histories', {
          filters: { url_id: String(urls[0].url_id), status: 'SUCCESS' },
          orderBy: 'captured_at',
          orderDirection: 'DESC',
          limit: 1
        });
        
        const histories = historyRes.rows || [];
        if (histories.length > 0) {
          latestPrice = Number(histories[0].captured_price || 0);
          latestTime = histories[0].captured_at || '-';
        }
      }

      // 실시간 마진 계산: (기준가 - 수집된가격) / 기준가 * 100
      let currentMarginRate = 0;
      if (item.base_price > 0 && latestPrice > 0) {
        // 원자재의 경우 (자사기준가 - 원자재시장가) / 자사기준가
        // 완제품 경쟁가의 경우 (경쟁사시장가 - 자사기준원가) / 경쟁사시장가
        if (item.category === 'RAW_MATERIAL') {
          currentMarginRate = ((item.base_price - latestPrice) / item.base_price) * 100;
        } else {
          currentMarginRate = ((latestPrice - item.base_price) / latestPrice) * 100;
        }
      }

      return {
        ...item,
        latest_price: latestPrice,
        latest_captured_at: latestTime,
        current_margin_rate: Number(currentMarginRate.toFixed(2)),
        collectors_count: urls.length
      };
    }));

    return NextResponse.json({ success: true, items: enrichedItems });
  } catch (error: any) {
    console.error('Failed to fetch tracked items:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/price-tracker/items : 신규 가격 추적 품목 등록
export async function POST(req: Request) {
  try {
    const { item_code, item_name, category, base_price, target_margin_rate, currency_code } = await req.json();

    if (!item_code || !item_name || !base_price) {
      return NextResponse.json({ success: false, error: '필수 정보가 누락되었습니다. (품목코드, 품목명, 기준가)' }, { status: 400 });
    }

    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    const newId = Date.now();

    await insertRows('tracked_items', [{
      item_id: newId,
      item_code,
      item_name,
      category: category || 'RAW_MATERIAL',
      base_price: Number(base_price),
      target_margin_rate: Number(target_margin_rate || 10),
      currency_code: currency_code || 'KRW',
      created_at: nowStr
    }]);

    return NextResponse.json({ success: true, item_id: newId });
  } catch (error: any) {
    console.error('Failed to create tracked item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/price-tracker/items : 추적 품목 수정
export async function PUT(req: Request) {
  try {
    const { item_id, item_code, item_name, category, base_price, target_margin_rate, currency_code } = await req.json();

    if (!item_id) {
      return NextResponse.json({ success: false, error: '품목 ID가 누락되었습니다.' }, { status: 400 });
    }

    await updateRows('tracked_items', {
      item_code,
      item_name,
      category,
      base_price: Number(base_price),
      target_margin_rate: Number(target_margin_rate || 10),
      currency_code: currency_code || 'KRW'
    }, { filters: { item_id: String(item_id) } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update tracked item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/price-tracker/items : 추적 품목 삭제 (및 연관 감시 URL들 동반 삭제)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('item_id');

    if (!itemId) {
      return NextResponse.json({ success: false, error: '품목 ID가 누락되었습니다.' }, { status: 400 });
    }

    // 1. 해당 품목에 연결된 target_urls 조회
    const urlsRes = await queryTable('target_urls', { filters: { item_id: itemId } });
    const urls = urlsRes.rows || [];

    // 2. 각 URL에 종속된 price_histories 및 alert_rules 삭제
    for (const url of urls) {
      try {
        await deleteRows('price_histories', { filters: { url_id: String(url.url_id) } });
        await deleteRows('alert_rules', { filters: { url_id: String(url.url_id) } });
      } catch (subErr) {
        console.warn(`⚠️ url_id ${url.url_id} 관련 이력/알림룰 삭제 실패:`, subErr);
      }
    }

    // 3. target_urls 에서 해당 품목 관련 URL 데이터 전체 삭제
    await deleteRows('target_urls', { filters: { item_id: itemId } });

    // 4. tracked_items 테이블에서 품목 자체 삭제
    await deleteRows('tracked_items', { filters: { item_id: itemId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete tracked item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

