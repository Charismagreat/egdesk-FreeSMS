export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable, insertRows, updateRows, deleteRows, executeSQL } from '../../../../egdesk-helpers';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';

// 최고 관리자(SUPER_ADMIN) 권한 검증 헬퍼
async function verifySuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return false;
  try {
    const payload = decodeJwt(token);
    return payload.role === 'SUPER_ADMIN';
  } catch {
    return false;
  }
}

/**
 * GET: 견적 전용 상품 목록 조회
 * products 테이블에서 is_estimate_price = 1 인 품목만 필터링하여 반환합니다.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // 만약 견적서 목록을 조회하고 싶다면 (관리자용)
    if (action === 'list') {
      const query = `
        SELECT e.*, 
               (SELECT product_name FROM crm_estimate_items WHERE estimate_id = e.id LIMIT 1) AS first_item_name,
               (SELECT COUNT(*) FROM crm_estimate_items WHERE estimate_id = e.id) AS item_count
        FROM crm_estimates e
        ORDER BY e.id DESC
      `;
      const result = await executeSQL(query);
      const estimates = (result && result.rows) ? result.rows : (Array.isArray(result) ? result : []);
      return NextResponse.json({ success: true, estimates });
    }

    // 특정 견적서 상세 조회 (마스터 정보 및 세부 품목 일괄 조회)
    if (action === 'detail') {
      const estimateId = searchParams.get('estimateId');
      if (!estimateId) {
        return NextResponse.json({ success: false, error: '견적 번호가 누락되었습니다.' }, { status: 400 });
      }

      const estRes = await queryTable('crm_estimates', { filters: { id: estimateId } });
      const estimate = estRes.rows && estRes.rows.length > 0 ? estRes.rows[0] : null;

      if (!estimate) {
        return NextResponse.json({ success: false, error: '해당 견적 내역을 찾을 수 없습니다.' }, { status: 404 });
      }

      const itemsRes = await queryTable('crm_estimate_items', { filters: { estimate_id: estimateId } });
      const items = itemsRes.rows || [];

      return NextResponse.json({ success: true, estimate, items });
    }

    // 기본값: 모바일용 견적 상품 목록 조회
    // 💡 SQL Query 헬퍼를 활용하여 견적가 플래그가 켜진 상품만 확실히 색출!
    const query = `SELECT * FROM products WHERE is_estimate_price = 1`;
    const result = await executeSQL(query);
    const estimateProducts = (result && result.rows) ? result.rows : (Array.isArray(result) ? result : []);

    return NextResponse.json({ success: true, products: estimateProducts });
  } catch (error: any) {
    console.error('API estimates GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: 모바일 고객 견적 요청 자동 접수 또는 관리자 견적 수동 작성
 * crm_estimates 및 crm_estimate_items 테이블에 이중 트랜잭션 형태로 데이터 적재
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      type = 'INBOUND',           // INBOUND(받은 것/모바일요청), OUTBOUND(보낼 것)
      direction_status = 'REQUESTED', // REQUESTED(견적요청), DRAFT(초안), SENT(발송)
      partner_name, 
      partner_phone, 
      items = [],                 // [{ product_id, product_name, quantity, unit_price }]
      file_url = '',
      ai_parsed = 0,
      business_license_url = '',  // 신규 첫 견적 시 첨부된 사업자등록증 URL
      tags = '',

      // B2B 신규 거래처 자동 가입용 추가 필드
      is_new_partner = false,
      business_number = '',
      representative = '',
      email = '',
      address = ''
    } = body;

    if (!partner_name) {
      return NextResponse.json({ success: false, error: '거래처/고객명은 필수 입력 항목입니다.' }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ success: false, error: '최소 1개 이상의 견적 품목이 필요합니다.' }, { status: 400 });
    }

    // 💡 모바일 신규 B2B 거래처 자동 스마트 온보딩 가입 처리
    if (type === 'INBOUND' && is_new_partner) {
      let existingPartner = null;
      if (business_number) {
        const checkQuery = `SELECT * FROM crm_partners WHERE business_number = '${business_number}' LIMIT 1`;
        const checkRes = await executeSQL(checkQuery) || [];
        const rows = (checkRes && (checkRes as any).rows) ? (checkRes as any).rows : (Array.isArray(checkRes) ? checkRes : []);
        if (rows.length > 0) {
          existingPartner = rows[0];
        }
      }

      if (!existingPartner) {
        const partnerId = `PT-${Date.now()}`;
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        await insertRows('crm_partners', [{
          id: partnerId,
          type: 'BUYER', // 모바일에서 견적을 요청해온 구매처는 B2B 바이어(BUYER)로 등록
          company_name: partner_name,
          business_number: business_number,
          representative: representative,
          phone: partner_phone,
          manager_name: partner_name + ' 담당자',
          manager_phone: partner_phone,
          email: email,
          address: address,
          vip_level: 'NORMAL',
          credit_limit: 0,
          business_license_url: business_license_url,
          memo: '모바일 스마트 온보딩 채널을 통해 첫 견적 요청과 함께 자동 신규 가입되었습니다.',
          created_at: nowStr
        }]);
        console.log(`B2B Partner auto-onboarded: ${partner_name} (${partnerId})`);
      }
    }

    // 1. 총 합계 금액 산정
    let total_amount = 0;
    const itemRows = items.map((item: any) => {
      const qty = parseInt(item.quantity) || 0;
      const price = parseInt(item.unit_price) || 0;
      const amount = qty * price;
      total_amount += amount;

      return {
        product_id: item.product_id || '',
        product_name: item.product_name,
        quantity: qty,
        unit_price: price,
        amount: amount
      };
    });

    // 2. 견적서 고유 식별 마스터 ID 생성
    const estimateId = `EST-${Date.now()}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 3. crm_estimates 마스터 테이블 삽입
    await insertRows('crm_estimates', [{
      id: estimateId,
      type,
      direction_status,
      partner_name,
      partner_phone,
      total_amount,
      file_url,
      business_license_url, // 첨부된 사업자등록증 URL 매핑
      ai_parsed,
      tags,
      created_at: nowStr
    }]);

    // 4. crm_estimate_items 디테일 테이블 품목 삽입
    const detailRows = itemRows.map((row: any, idx: number) => ({
      id: Date.now() + idx,
      estimate_id: estimateId,
      product_id: row.product_id,
      product_name: row.product_name,
      quantity: row.quantity,
      unit_price: row.unit_price,
      amount: row.amount
    }));

    await insertRows('crm_estimate_items', detailRows);

    return NextResponse.json({
      success: true,
      message: type === 'INBOUND' ? '고객님의 견적 요청이 실시간으로 정상 접수되었습니다.' : '견적서가 정상적으로 작성되었습니다.',
      estimateId,
      totalAmount: total_amount
    });

  } catch (error: any) {
    console.error('API estimates POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT: 견적서 마스터 정보 및 품목 리스트 수정 (최고관리자 전용)
 */
export async function PUT(req: Request) {
  try {
    const isAuthorized = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '🔒 권한 차단: 견적서 수정은 최고관리자(SUPER_ADMIN) 권한으로만 가능합니다.' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      estimateId, 
      partner_name, 
      partner_phone, 
      tags,
      items
    } = body;

    if (!estimateId) {
      return NextResponse.json({ success: false, error: '견적 번호가 누락되었습니다.' }, { status: 400 });
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const masterUpdates: any = {
      updated_at: nowStr
    };
    if (partner_name !== undefined) masterUpdates.partner_name = partner_name;
    if (partner_phone !== undefined) masterUpdates.partner_phone = partner_phone;
    if (tags !== undefined) masterUpdates.tags = tags;

    if (items !== undefined && Array.isArray(items)) {
      if (!partner_name) {
        return NextResponse.json({ success: false, error: '품목 수정 시 거래처/고객명은 필수 입력 항목입니다.' }, { status: 400 });
      }

      let total_amount = 0;
      const itemRows = items.map((item: any) => {
        const qty = parseInt(item.quantity) || 0;
        const price = parseInt(item.unit_price) || 0;
        const amount = qty * price;
        total_amount += amount;

        return {
          product_id: item.product_id || '',
          product_name: item.product_name,
          quantity: qty,
          unit_price: price,
          amount: amount
        };
      });
      masterUpdates.total_amount = total_amount;

      await updateRows('crm_estimates', masterUpdates, { filters: { id: estimateId } });
      await deleteRows('crm_estimate_items', { filters: { estimate_id: estimateId } });

      const detailRows = itemRows.map((row: any, idx: number) => ({
        id: Date.now() + idx,
        estimate_id: estimateId,
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: row.quantity,
        unit_price: row.unit_price,
        amount: row.amount
      }));

      if (detailRows.length > 0) {
        await insertRows('crm_estimate_items', detailRows);
      }

      return NextResponse.json({
        success: true,
        message: '견적서가 성공적으로 수정되었습니다.',
        totalAmount: total_amount
      });
    } else {
      await updateRows('crm_estimates', masterUpdates, { filters: { id: estimateId } });
      return NextResponse.json({
        success: true,
        message: '견적서 정보가 성공적으로 수정되었습니다.'
      });
    }

  } catch (error: any) {
    console.error('API estimates PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE: 견적서 및 세부 품목 삭제 (최고관리자 전용)
 */
export async function DELETE(req: Request) {
  try {
    const isAuthorized = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '🔒 권한 차단: 견적서 삭제는 최고관리자(SUPER_ADMIN) 권한으로만 가능합니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const estimateId = searchParams.get('estimateId');

    if (!estimateId) {
      return NextResponse.json({ success: false, error: '삭제할 견적 번호가 누락되었습니다.' }, { status: 400 });
    }

    // 1. crm_estimates 테이블에서 마스터 삭제
    await deleteRows('crm_estimates', { filters: { id: estimateId } });

    // 2. crm_estimate_items 테이블에서 상세 품목 일괄 삭제
    await deleteRows('crm_estimate_items', { filters: { estimate_id: estimateId } });

    return NextResponse.json({
      success: true,
      message: '견적서 및 세부 품목이 성공적으로 삭제되었습니다.'
    });

  } catch (error: any) {
    console.error('API estimates DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
