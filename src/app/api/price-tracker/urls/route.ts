export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable, insertRows, deleteRows } from '@/../egdesk-helpers';

// GET /api/price-tracker/urls : 특정 품목에 등록된 감시 URL 및 수집 이력 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('item_id');

    const options: any = { orderBy: 'url_id', orderDirection: 'DESC' };
    if (itemId) {
      options.filters = { item_id: itemId };
    }

    const urlsRes = await queryTable('target_urls', options);
    const urls = urlsRes.rows || [];

    const enrichedUrls = await Promise.all(urls.map(async (url: any) => {
      // 해당 URL의 전체 가격 변동 이력 조회 (최신가 및 역대 최저가 추출용)
      const historyRes = await queryTable('price_histories', {
        filters: { url_id: String(url.url_id), status: 'SUCCESS' },
        orderBy: 'captured_at',
        orderDirection: 'ASC', // 오름차순 정렬
        limit: 1000
      });
      const histories = historyRes.rows || [];

      let latestPrice = null;
      let minPrice = null;

      if (histories.length > 0) {
        latestPrice = histories[histories.length - 1].captured_price;
        minPrice = Math.min(...histories.map((h: any) => Number(h.captured_price || 0)));
      }

      // 차트 렌더링 호환성을 위해 최근 15건만 쪼개어 전달
      const chartHistory = histories.slice(-15);

      return {
        ...url,
        latest_price: latestPrice,
        min_price: minPrice,
        history: chartHistory
      };
    }));

    return NextResponse.json({ success: true, urls: enrichedUrls });
  } catch (error: any) {
    console.error('Failed to fetch target URLs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/price-tracker/urls : 감시 URL 및 규칙 등록 및 테스트
export async function POST(req: Request) {
  try {
    const { item_id, site_name, target_url, css_selector, xpath, cron_interval, run_test, test_price } = await req.json();

    if (!item_id || !site_name || !target_url || !css_selector) {
      return NextResponse.json({ success: false, error: '필수 입력 정보가 누락되었습니다.' }, { status: 400 });
    }

    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    const newUrlId = Date.now();

    // 1. 감시 URL 등록
    await insertRows('target_urls', [{
      url_id: newUrlId,
      item_id: Number(item_id),
      site_name,
      target_url,
      css_selector,
      xpath: xpath || '',
      cron_interval: cron_interval || '0 9 * * *',
      is_active: 1,
      created_at: nowStr
    }]);

    // 2. 즉시 크롤링 시뮬레이션 모의 실행 옵션 작동
    let testPrice = 0;
    let testPriceKrw = 0;
    let currencyCode = 'KRW';

    if (run_test) {
      // 2.1. 해당 품목의 통화코드 및 기본 공급가 조회
      const items = await queryTable('tracked_items', { filters: { item_id: String(item_id) } });
      if (items.rows && items.rows.length > 0) {
        currencyCode = items.rows[0].currency_code || 'KRW';
      }

      // 만약 외부(예: AI 추천 자율 스캔)에서 실제 수집되어 넘어온 가격(test_price)이 있다면 이를 최우선 매핑!
      if (test_price !== undefined && test_price !== null) {
        testPrice = Number(test_price);
      } else {
        // 기존 난수 생성 Fallback 작동하되, 품목 고유의 실제 기준 단가(base_price)에 매칭하여 보정 생성!
        const baseNum = items.rows && items.rows.length > 0 
          ? Number(items.rows[0].base_price || 8000) 
          : (currencyCode === 'USD' ? 8 : currencyCode === 'EUR' ? 7 : currencyCode === 'CNY' ? 55 : 8000);
        testPrice = Math.floor(baseNum * (0.95 + Math.random() * 0.1));
      }
      
      // 실시간 환율 연동 및 원화(KRW) 환산 연산
      let rate = 1.0;
      if (currencyCode !== 'KRW') {
        const ratesRes = await queryTable('exchange_rates', { filters: { currency_code: currencyCode } });
        if (ratesRes.rows && ratesRes.rows.length > 0) {
          const rawRate = ratesRes.rows[0].current_rate || 1.0;
          rate = currencyCode === 'JPY' ? rawRate / 100 : rawRate;
        }
      }
      testPriceKrw = Math.floor(testPrice * rate);

      // 모의 수집된 가격 이력 즉각 적재
      await insertRows('price_histories', [{
        history_id: Date.now() + 1,
        url_id: newUrlId,
        captured_price: testPrice,
        captured_at: nowStr,
        status: 'SUCCESS',
        currency_code: currencyCode,
        exchange_rate: rate,
        converted_krw_price: testPriceKrw
      }]);
    }

    return NextResponse.json({ 
      success: true, 
      url_id: newUrlId, 
      test_price: testPrice > 0 ? testPrice : null,
      test_price_krw: testPriceKrw > 0 ? testPriceKrw : null,
      currency: currencyCode,
      message: '감시 URL 및 수집 엔진 룰이 안전하게 등록되었습니다.'
    });


  } catch (error: any) {
    console.error('Failed to create target URL:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/price-tracker/urls : 감시 URL 삭제
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const urlId = searchParams.get('url_id');

    if (!urlId) {
      return NextResponse.json({ success: false, error: 'URL ID가 누락되었습니다.' }, { status: 400 });
    }

    await deleteRows('target_urls', { filters: { url_id: urlId } });
    return NextResponse.json({ success: true, message: '감시 URL이 성공적으로 삭제되었습니다.' });
  } catch (error: any) {
    console.error('Failed to delete target URL:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
