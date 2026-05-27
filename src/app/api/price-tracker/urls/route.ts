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
      // 해당 URL의 최근 10건 가격 변동 이력 조회 (차트 렌더링 리소스)
      const historyRes = await queryTable('price_histories', {
        filters: { url_id: String(url.url_id), status: 'SUCCESS' },
        orderBy: 'captured_at',
        orderDirection: 'ASC', // 오름차순으로 정렬하여 차트 선 그리기 용이화
        limit: 15
      });
      return {
        ...url,
        history: historyRes.rows || []
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
    const { item_id, site_name, target_url, css_selector, xpath, cron_interval, run_test } = await req.json();

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
    if (run_test) {
      // 실시간 가상 크롤러 작동: 8000~9000 범위에서 난수 가격 생성
      testPrice = Math.floor(8000 + Math.random() * 1000);
      
      // 모의 수집된 가격 이력 즉각 적재
      await insertRows('price_histories', [{
        history_id: Date.now() + 1,
        url_id: newUrlId,
        captured_price: testPrice,
        captured_at: nowStr,
        status: 'SUCCESS'
      }]);
    }

    return NextResponse.json({ 
      success: true, 
      url_id: newUrlId, 
      test_price: testPrice > 0 ? testPrice : null,
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
