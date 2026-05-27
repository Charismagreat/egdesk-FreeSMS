export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable, insertRows } from '@/../egdesk-helpers';

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
        current_margin_rate: Number(currentMarginRate.toFixed(2))
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
    const { item_code, item_name, category, base_price, target_margin_rate } = await req.json();

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
      created_at: nowStr
    }]);

    return NextResponse.json({ success: true, item_id: newId });
  } catch (error: any) {
    console.error('Failed to create tracked item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
