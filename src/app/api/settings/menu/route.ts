export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { queryTable, insertRows, deleteRows } from '../../../../../egdesk-helpers';

// 기본 25개 메뉴 정의 (24개 기본 메뉴 + 1개 AI 브리핑)
const DEFAULT_MENU_ITEMS = [
  { href: "/", label: "대시보드" },
  { href: "/sms", label: "무료 문자 발송 AI" },
  { href: "/message-logs", label: "발송 내역 조회" },
  { href: "/automation", label: "자동 발송 설정" },
  { href: "/customers", label: "고객 관리 AI" },
  { href: "/partners", label: "거래처 관리 AI" },
  { href: "/transactions", label: "거래 관리 AI" },
  { href: "/orders", label: "주문 관리 AI" },
  { href: "/payments", label: "결제 관리 AI" },
  { href: "/finance", label: "금융 정보 AI" },
  { href: "/coupons", label: "쿠폰 관리 AI" },
  { href: "/reservations", label: "예약 관리 AI" },
  { href: "/deliveries", label: "배송 관리 AI" },
  { href: "/products", label: "상품 관리 AI" },
  { href: "/estimates", label: "견적/발주/수주 AI" },
  { href: "/snaptasks", label: "AI 스냅태스크" },
  { href: "/inventory", label: "재고 관리 AI" },
  { href: "/expenses", label: "지출 관리 AI" },
  { href: "/price-tracker", label: "가격 추적 AI" },
  { href: "/website", label: "홈페이지 빌더 AI" },
  { href: "/recruitment", label: "채용 매니저 AI" },
  { href: "/instagram", label: "인스타그램 마케팅 AI" },
  { href: "/naver-blog", label: "N-BLOG 포스팅 AI" },
  { href: "/youtube-shorts", label: "YOUTUBE 쇼츠 AI" },
  { href: "/ai-briefing", label: "AI 브리핑" }
];

/**
 * GET: 시스템 메뉴 설정 목록 조회 및 자동 백필
 */
export async function GET() {
  try {
    // 1. DB에서 저장된 메뉴 설정 조회
    const result = await queryTable('system_menu_settings', { orderBy: 'sort_order', orderDirection: 'ASC' });
    let rows = result.rows || [];

    // 2. 만약 DB가 비어있는 초기 온보딩 상태라면 기본값으로 백필(자동 적재) 수행
    if (rows.length === 0) {
      console.log('메뉴 설정이 비어있어 기본값으로 초기 온보딩 백필을 수행합니다.');
      
      const insertData = DEFAULT_MENU_ITEMS.map((item, index) => ({
        menu_href: item.href,
        is_enabled: 1, // 최초에는 모두 활성화 상태
        sort_order: (index + 1) * 10 // 10, 20, 30... 정렬 가중치 할당
      }));

      await insertRows('system_menu_settings', insertData);

      // 백필 완료 후 다시 조회
      const freshResult = await queryTable('system_menu_settings', { orderBy: 'sort_order', orderDirection: 'ASC' });
      rows = freshResult.rows || [];
    } else {
      // 3. 혹시나 새로운 개발로 인해 기본 메뉴(DEFAULT_MENU_ITEMS)에 누락된 메뉴가 DB에 없는지 체크하여 보완
      const dbHrefs = new Set(rows.map((r: any) => r.menu_href));
      const missingItems = DEFAULT_MENU_ITEMS.filter(item => !dbHrefs.has(item.href));

      if (missingItems.length > 0) {
        console.log(`새로 추가된 메뉴 ${missingItems.length}건을 발견하여 추가 백필합니다.`);
        
        // 현재 DB 내 최대 sort_order 획득
        let maxOrder = Math.max(...rows.map((r: any) => r.sort_order || 0), 0);
        
        const insertMissingData = missingItems.map((item, index) => {
          maxOrder += 10;
          return {
            menu_href: item.href,
            is_enabled: 1,
            sort_order: maxOrder
          };
        });

        await insertRows('system_menu_settings', insertMissingData);

        // 전체 다시 갱신
        const refreshedResult = await queryTable('system_menu_settings', { orderBy: 'sort_order', orderDirection: 'ASC' });
        rows = refreshedResult.rows || [];
      }
    }

    return NextResponse.json({ success: true, menuSettings: rows });
  } catch (error: any) {
    console.error('메뉴 설정 조회 오류:', error);
    return NextResponse.json({ success: false, error: '메뉴 설정을 조회하는 도중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * POST: 최고관리자(SUPER_ADMIN) 권한 검증 후 메뉴 설정 일괄 업데이트
 */
export async function POST(req: Request) {
  try {
    // 1. 최고관리자 권한 가드
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: '인증 세션이 만료되었습니다. 다시 로그인해주세요.' }, { status: 401 });
    }

    const payload = decodeJwt(token);
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: '메뉴 편집 권한이 없습니다. 최고관리자 계정으로 로그인해주세요.' }, { status: 403 });
    }

    // 2. 요청 바디 추출
    const { settings } = await req.json();
    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ success: false, error: '올바른 메뉴 설정 데이터 포맷이 아닙니다.' }, { status: 400 });
    }

    // 3. 멱등성 있는 벌크 업데이트: uniqueKeyColumns인 menu_href에 근거하여 Upsert 형태로 일괄 갱신
    console.log('최고관리자 요청에 의해 시스템 메뉴 설정을 일괄 갱신합니다.');
    
    const insertData = settings.map((item: any) => ({
      menu_href: item.menu_href,
      is_enabled: item.is_enabled ? 1 : 0,
      sort_order: item.sort_order
    }));

    await insertRows('system_menu_settings', insertData);

    return NextResponse.json({ success: true, message: '사이드바 메뉴 설정이 성공적으로 저장되었습니다.' });
  } catch (error: any) {
    console.error('메뉴 설정 저장 오류:', error);
    return NextResponse.json({ success: false, error: '메뉴 설정을 저장하는 도중 오류가 발생했습니다.' }, { status: 500 });
  }
}
