export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable, insertRows, updateRows, deleteRows, executeSQL } from '../../../../egdesk-helpers';

/**
 * GET: 거래처 목록 조회 및 상세 누적 수/발주 실적 연산
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const business_number = searchParams.get('business_number');

    // ────────────────────────────────────────────────────────
    // 0. 사업자등록번호로 기존 파트너가 있는지 실시간 조회 (중복 가입 방지)
    // ────────────────────────────────────────────────────────
    if (action === 'check-biz' && business_number) {
      // 1. system_settings에 저장된 우리 회사 사업자등록번호(company_business_number) 확인
      const cleanBizNo = business_number.replace(/[^0-9]/g, '');
      const ourBizRes = await queryTable('system_settings', { filters: { key: 'company_business_number' } });
      const ourBizVal = ourBizRes.rows?.[0]?.value || '';
      const cleanOurBizVal = ourBizVal.replace(/[^0-9]/g, '');

      if (cleanOurBizVal && cleanBizNo === cleanOurBizVal) {
        // 본사 회사명도 조회
        const ourNameRes = await queryTable('system_settings', { filters: { key: 'company_name' } });
        const ourNameVal = ourNameRes.rows?.[0]?.value || '우리 회사 (본사)';
        return NextResponse.json({ 
          success: true, 
          exists: true, 
          is_our_company: true,
          partner: {
            company_name: ourNameVal,
            business_number: ourBizVal,
            type: 'HEAD_QUARTERS',
            memo: '시스템에 등록된 본사(우리 회사) 정보입니다.'
          } 
        });
      }

      const bizQuery = `SELECT * FROM crm_partners WHERE business_number = '${business_number}' LIMIT 1`;
      const result = await executeSQL(bizQuery) || [];
      const partners = (result && (result as any).rows) ? (result as any).rows : (Array.isArray(result) ? result : []);
      
      if (partners.length > 0) {
        return NextResponse.json({ success: true, exists: true, partner: partners[0] });
      } else {
        return NextResponse.json({ success: true, exists: false });
      }
    }

    // ────────────────────────────────────────────────────────
    // 1. 거래처 상세 보기 및 수/발주 타임라인 이력 조인 마이닝
    // ────────────────────────────────────────────────────────
    if (action === 'detail' && id) {
      const partnerRes = await queryTable('crm_partners', { filters: { id } });
      if (!partnerRes.rows || partnerRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: '존재하지 않는 거래처입니다.' }, { status: 404 });
      }
      const partner = partnerRes.rows[0];

      // 해당 거래처 상호명으로 연동된 발주 내역 마이닝
      let purchaseOrders = [];
      try {
        const poQuery = `SELECT * FROM crm_purchase_orders WHERE vendor_name = '${partner.company_name}' ORDER BY created_at DESC`;
        purchaseOrders = await executeSQL(poQuery) || [];
        if (purchaseOrders && (purchaseOrders as any).rows) {
          purchaseOrders = (purchaseOrders as any).rows;
        }
      } catch (err) {
        console.error('PO 마이닝 실패:', err);
      }

      // 해당 거래처 상호명으로 연동된 수주 내역 마이닝
      let salesOrders = [];
      try {
        const soQuery = `SELECT * FROM crm_sales_orders WHERE customer_name = '${partner.company_name}' ORDER BY created_at DESC`;
        salesOrders = await executeSQL(soQuery) || [];
        if (salesOrders && (salesOrders as any).rows) {
          salesOrders = (salesOrders as any).rows;
        }
      } catch (err) {
        console.error('SO 마이닝 실패:', err);
      }

      return NextResponse.json({
        success: true,
        partner,
        purchaseOrders,
        salesOrders
      });
    }

    // ────────────────────────────────────────────────────────
    // 2. 전체 거래처 리스트 조회 및 실시간 거래 지표 합계 산출
    // ────────────────────────────────────────────────────────
    const partnersRes = await queryTable('crm_partners', {});
    const partners = partnersRes.rows || [];

    // 각 거래처별 수/발주 총 거래액을 집계하기 위해 전체 발주/수주 테이블 마이닝
    let allPos: any[] = [];
    let allSos: any[] = [];
    try {
      const poRes = await executeSQL('SELECT vendor_name, status, total_amount FROM crm_purchase_orders');
      allPos = (poRes && (poRes as any).rows) ? (poRes as any).rows : (Array.isArray(poRes) ? poRes : []);
      
      const soRes = await executeSQL('SELECT customer_name, status, total_amount FROM crm_sales_orders');
      allSos = (soRes && (soRes as any).rows) ? (soRes as any).rows : (Array.isArray(soRes) ? soRes : []);
    } catch (e) {
      console.error('SCM 집계용 베이스 마이닝 지연:', e);
    }

    // 실시간 분석 지표 융합
    const enrichedPartners = partners.map((pt: any) => {
      const companyName = pt.company_name;

      if (pt.type === 'VENDOR') {
        // 공급사: 총 발주(매입) 실적 연산
        const filteredPos = allPos.filter(po => po.vendor_name === companyName);
        const totalPurchased = filteredPos.reduce((sum, po) => sum + (parseInt(po.total_amount) || 0), 0);
        const pendingInboundCount = filteredPos.filter(po => po.status === 'PENDING_INBOUND').length;
        
        return {
          ...pt,
          total_performance: totalPurchased,
          pending_count: pendingInboundCount
        };
      } else {
        // 바이어: 총 수주(매출) 실적 연산
        const filteredSos = allSos.filter(so => so.customer_name === companyName);
        const totalSales = filteredSos.reduce((sum, so) => sum + (parseInt(so.total_amount) || 0), 0);
        const registeredCount = filteredSos.filter(so => so.status === 'REGISTERED').length;

        return {
          ...pt,
          total_performance: totalSales,
          pending_count: registeredCount
        };
      }
    });

    return NextResponse.json({
      success: true,
      partners: enrichedPartners
    });

  } catch (error: any) {
    console.error('API partners GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: 신규 거래처 등록
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      type, 
      company_name, 
      business_number = '', 
      representative = '', 
      phone = '', 
      manager_name = '', 
      manager_phone = '', 
      email = '', 
      address = '', 
      vip_level = 'NORMAL', 
      credit_limit = 0, 
      business_license_url = '', 
      memo = '' 
    } = body;

    if (!type || !company_name) {
      return NextResponse.json({ success: false, error: '거래처 구분과 상호명은 필수 입력 항목입니다.' }, { status: 400 });
    }

    const partnerId = `PT-${Date.now()}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await insertRows('crm_partners', [{
      id: partnerId,
      type,
      company_name,
      business_number,
      representative,
      phone,
      manager_name,
      manager_phone,
      email,
      address,
      vip_level,
      credit_limit: parseInt(credit_limit as any) || 0,
      business_license_url,
      memo,
      created_at: nowStr
    }]);

    return NextResponse.json({
      success: true,
      message: '새로운 B2B 거래처가 정상 등록되었습니다.',
      partnerId
    });

  } catch (error: any) {
    console.error('API partners POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT: 거래처 정보 수정
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { 
      id,
      company_name, 
      business_number, 
      representative, 
      phone, 
      manager_name, 
      manager_phone, 
      email, 
      address, 
      vip_level, 
      credit_limit, 
      memo 
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '수정할 거래처 식별 코드(id)가 누락되었습니다.' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (company_name !== undefined) updates.company_name = company_name;
    if (business_number !== undefined) updates.business_number = business_number;
    if (representative !== undefined) updates.representative = representative;
    if (phone !== undefined) updates.phone = phone;
    if (manager_name !== undefined) updates.manager_name = manager_name;
    if (manager_phone !== undefined) updates.manager_phone = manager_phone;
    if (email !== undefined) updates.email = email;
    if (address !== undefined) updates.address = address;
    if (vip_level !== undefined) updates.vip_level = vip_level;
    if (credit_limit !== undefined) updates.credit_limit = parseInt(credit_limit as any) || 0;
    if (memo !== undefined) updates.memo = memo;

    await updateRows('crm_partners', updates, { filters: { id } });

    return NextResponse.json({
      success: true,
      message: '거래처 회원 정보가 실시간으로 성공적으로 갱신되었습니다.'
    });

  } catch (error: any) {
    console.error('API partners PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE: 거래처 삭제
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '삭제할 거래처 식별 코드(id)가 누락되었습니다.' }, { status: 400 });
    }

    await deleteRows('crm_partners', { filters: { id } });

    return NextResponse.json({
      success: true,
      message: '해당 B2B 거래처 정보가 안전하게 영구 삭제되었습니다.'
    });

  } catch (error: any) {
    console.error('API partners DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
