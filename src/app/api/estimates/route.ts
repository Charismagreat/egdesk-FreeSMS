export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable, insertRows, updateRows, deleteRows, executeSQL } from '../../../../egdesk-helpers';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { sendMail } from '../../../lib/email';

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
 * B2B 견적서 접수(INBOUND) 또는 발송(OUTBOUND)용 메일 템플릿 빌드 및 발송
 */
async function sendEstimateEmail(
  estimateId: string,
  type: string,
  direction_status: string,
  partner_name: string,
  emailAddress: string,
  total_amount: number,
  itemRows: any[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    // 1. 공급자 정보(우리 회사 프로필) 로드
    let providerHtml = '';
    try {
      const companySetting = await queryTable('system_settings', { filters: { key: 'my_company_profile' } });
      if (companySetting.rows?.[0]?.value) {
        const p = JSON.parse(companySetting.rows[0].value);
        providerHtml = `
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 11px; line-height: 1.6; color: #475569; background-color: #fafafa; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold; color: #1e293b; margin-bottom: 6px; font-size: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">공급자 (Supplier)</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="width: 90px; font-weight: bold; color: #64748b;">상호 (회사명)</td><td>: <b>${p.companyName || ''}</b></td></tr>
              <tr><td style="font-weight: bold; color: #64748b;">사업자등록번호</td><td>: ${p.businessNumber || ''}</td></tr>
              <tr><td style="font-weight: bold; color: #64748b;">대표자 성명</td><td>: ${p.representative || ''}</td></tr>
              <tr><td style="font-weight: bold; color: #64748b;">소재지 주소</td><td>: ${p.address || ''}</td></tr>
              <tr><td style="font-weight: bold; color: #64748b;">대표전화</td><td>: ${p.phone || ''}</td></tr>
            </table>
          </div>
        `;
      }
    } catch (e) {
      console.warn('공급자 정보 로드 실패:', e);
    }

    const itemsHtml = itemRows.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: left; font-size: 13px;">${item.product_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: center; font-size: 13px;">${item.quantity.toLocaleString()}개</td>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px;">${item.unit_price.toLocaleString()}원</td>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; font-weight: bold; color: #4f46e5;">${item.amount.toLocaleString()}원</td>
      </tr>
    `).join('');

    // A. 바이어 접수 확인 메일 (INBOUND)
    if (type === 'INBOUND') {
      const emailBodyHtml = `
        <div style="font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; color: #334155;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="background-color: #e0e7ff; color: #4f46e5; font-size: 10px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; border: 1px solid #c7d2fe;">B2B 실시간 견적 접수</span>
            <h2 style="color: #1e293b; margin-top: 10px; margin-bottom: 5px;">견적 요청이 정상 접수되었습니다.</h2>
            <p style="font-size: 12px; color: #64748b; margin-top: 0;">요청 주신 견적 상세 내역을 안내해 드립니다.</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          
          <table style="width: 100%; font-size: 13px; color: #475569; margin-bottom: 20px;">
            <tr><td style="width: 100px; font-weight: bold; color: #64748b;">견적 번호</td><td style="font-weight: bold; color: #1e293b;">: ${estimateId}</td></tr>
            <tr><td style="font-weight: bold; color: #64748b;">요청 업체명</td><td style="color: #1e293b;">: ${partner_name}</td></tr>
            <tr><td style="font-weight: bold; color: #64748b;">접수 일시</td><td style="color: #1e293b;">: ${nowStr}</td></tr>
          </table>

          <div style="border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8fafc;">
                  <th style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: left; font-size: 11px; color: #64748b; font-weight: bold;">품목명</th>
                  <th style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: center; font-size: 11px; color: #64748b; font-weight: bold;">수량</th>
                  <th style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right; font-size: 11px; color: #64748b; font-weight: bold;">단가</th>
                  <th style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right; font-size: 11px; color: #64748b; font-weight: bold;">합계</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div style="background-color: #f8fafc; padding: 15px; border-top: 1px solid #edf2f7; text-align: right;">
              <span style="font-size: 12px; color: #64748b; font-weight: bold; margin-right: 10px;">총 견적 합계액 :</span>
              <span style="font-size: 16px; font-weight: 900; color: #4f46e5;">${total_amount.toLocaleString()}원</span>
            </div>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 15px; font-size: 12px; color: #64748b; line-height: 1.6;">
            <p style="margin: 0; font-weight: bold; color: #475569; margin-bottom: 5px;">💡 향후 진행 가이드</p>
            <p style="margin: 0;">본 견적 요청은 담당자가 상세 단가를 실시간 검수 및 조정 중입니다. 검수가 완료되는 즉시 카카오 알림톡/문자 및 본 이메일을 통해 최종 확정 견적서를 추가 발송해 드릴 예정입니다.</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0; text-align: center;">※ 본 이메일은 이지데스크 B2B 스마트 온보딩 채널을 통해 발송된 시스템 자동 메일입니다.</p>
        </div>
      `;

      await sendMail({
        to: emailAddress,
        subject: `[이지데스크] B2B 견적 요청이 정상 접수되었습니다. (번호: ${estimateId})`,
        html: emailBodyHtml,
        fromName: '이지데스크 견적시스템'
      });
    }
    // B. 관리자가 확정하여 거래처로 메일을 보낼 때 (OUTBOUND & SENT)
    else if (type === 'OUTBOUND' && direction_status === 'SENT') {
      const emailBodyHtml = `
        <div style="font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; color: #334155;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="background-color: #fef3c7; color: #d97706; font-size: 10px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; border: 1px solid #fde68a;">B2B 정식 견적서 송부</span>
            <h2 style="color: #1e293b; margin-top: 10px; margin-bottom: 5px;">견적서가 도착했습니다.</h2>
            <p style="font-size: 12px; color: #64748b; margin-top: 0;">요청하신 품목의 공식 견적 내역서입니다. 확인 후 발주 결정을 부탁드립니다.</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="font-size: 13px; color: #475569;">
              <p style="margin: 0; font-weight: bold; color: #1e293b; margin-bottom: 6px; font-size: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">수신자 (Customer)</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="width: 70px; font-weight: bold; color: #64748b;">견적 번호</td><td style="font-weight: bold; color: #1e293b;">: ${estimateId}</td></tr>
                <tr><td style="font-weight: bold; color: #64748b;">수신처</td><td style="color: #1e293b;">: <b>${partner_name}</b> 귀하</td></tr>
                <tr><td style="font-weight: bold; color: #64748b;">발행 일시</td><td style="color: #1e293b;">: ${nowStr}</td></tr>
              </table>
            </div>
            ${providerHtml}
          </div>

          <div style="border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden; margin-bottom: 20px; clear: both;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8fafc;">
                  <th style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: left; font-size: 11px; color: #64748b; font-weight: bold;">품목명</th>
                  <th style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: center; font-size: 11px; color: #64748b; font-weight: bold;">수량</th>
                  <th style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right; font-size: 11px; color: #64748b; font-weight: bold;">단가</th>
                  <th style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right; font-size: 11px; color: #64748b; font-weight: bold;">합계</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div style="background-color: #f8fafc; padding: 15px; border-top: 1px solid #edf2f7; text-align: right;">
              <span style="font-size: 12px; color: #64748b; font-weight: bold; margin-right: 10px;">총 견적 합계액 :</span>
              <span style="font-size: 16px; font-weight: 900; color: #4f46e5;">${total_amount.toLocaleString()}원</span>
            </div>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 15px; font-size: 12px; color: #64748b; line-height: 1.6;">
            <p style="margin: 0; font-weight: bold; color: #475569; margin-bottom: 5px;">📜 안내 사항</p>
            <ul style="margin: 0; padding-left: 15px;">
              <li>견적 유효기간은 발행일로부터 15일간입니다.</li>
              <li>본 내역을 바탕으로 발주 결정을 내리시려면 이지데스크 시스템의 [발주하기] 또는 본사 대표전화로 연락 주시기 바랍니다.</li>
            </ul>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0; text-align: center;">※ 본 이메일은 이지데스크 전사 관리 플랫폼을 통해 자동 발송된 공식 견적서입니다.</p>
        </div>
      `;

      await sendMail({
        to: emailAddress,
        subject: `[견적서] ${partner_name} 귀하 - 견적서가 도착했습니다. (번호: ${estimateId})`,
        html: emailBodyHtml,
        fromName: '이지데스크 견적시스템'
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('견적 메일 발송 중 오류:', err.message);
    return { success: false, error: err.message };
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
      // 1. 견적서 마스터 목록 조회 (deleted_at IS NULL은 queryTable 내부에서 자체 처리됨)
      const estRes = await queryTable('crm_estimates', {
        orderBy: 'id',
        orderDirection: 'DESC',
        limit: 500
      });
      const rawEstimates = (estRes.rows || []).filter((e: any) => !e.deleted_at);

      // 2. 견적서 상세 아이템 목록 조회
      const itemsRes = await queryTable('crm_estimate_items', {
        limit: 5000
      });
      const rawItems = itemsRes.rows || [];

      // 3. estimate_id 별로 아이템 그룹화
      const itemsMap: Record<string, any[]> = {};
      for (const item of rawItems) {
        const estId = item.estimate_id;
        if (!itemsMap[estId]) {
          itemsMap[estId] = [];
        }
        itemsMap[estId].push(item);
      }

      // 4. 결과 병합 조인
      const estimates = rawEstimates.map((e: any) => {
        const estItems = itemsMap[e.id] || [];
        return {
          ...e,
          first_item_name: estItems.length > 0 ? estItems[0].product_name : null,
          item_count: estItems.length
        };
      });

      return NextResponse.json({ success: true, estimates });
    }

    // 특정 견적서 상세 조회 (마스터 정보 및 세부 품목 일괄 조회)
    if (action === 'detail') {
      const estimateId = searchParams.get('estimateId');
      if (!estimateId) {
        return NextResponse.json({ success: false, error: '견적 번호가 누락되었습니다.' }, { status: 400 });
      }

      const estRes = await queryTable('crm_estimates', { filters: { id: estimateId } });
      const estimate = estRes.rows && estRes.rows.length > 0 && !estRes.rows[0].deleted_at ? estRes.rows[0] : null;

      if (!estimate) {
        return NextResponse.json({ success: false, error: '해당 견적 내역을 찾을 수 없습니다.' }, { status: 404 });
      }

      const itemsRes = await queryTable('crm_estimate_items', { filters: { estimate_id: estimateId } });
      const items = itemsRes.rows || [];

      // 💡 안전 가드: 발주서(crm_purchase_orders) 또는 수주서(crm_sales_orders)로의 전환 여부 검사 (queryTable 우회)
      const poRes = await queryTable('crm_purchase_orders', { filters: { estimate_id: estimateId }, limit: 1 });
      const poRows = poRes.rows || [];
      const soRes = await queryTable('crm_sales_orders', { filters: { estimate_id: estimateId }, limit: 1 });
      const soRows = soRes.rows || [];
      
      const isLinked = poRows.length > 0 || soRows.length > 0;

      return NextResponse.json({ success: true, estimate, items, isLinked });
    }

    // 기본값: 모바일용 견적 상품 목록 조회
    // 💡 SQL Query 헬퍼를 활용하여 견적가 플래그가 켜진 상품만 확실히 색출 (queryTable 우회)
    const prodRes = await queryTable('products', {
      filters: { is_estimate_price: '1' },
      limit: 1000
    });
    const estimateProducts = (prodRes.rows || []).filter((p: any) => !p.deleted_at);

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
        const partnerRes = await queryTable('crm_partners', { filters: { business_number }, limit: 1 });
        const rows = partnerRes.rows || [];
        if (rows.length > 0) {
          existingPartner = rows[0];
        }
      }

      if (!existingPartner) {
        const partnerId = `PT-${Date.now()}`;
        const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
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

    // 2. 견적서 고유 식별 마스터 ID 생성 및 UUID 부여
    const estimateId = `EST-${Date.now()}`;
    const uuid = `EST-UUID-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    // 3. crm_estimates 마스터 테이블 삽입
    await insertRows('crm_estimates', [{
      type,
      direction_status,
      partner_name,
      partner_phone,
      total_amount,
      file_url,
      business_license_url, // 첨부된 사업자등록증 URL 매핑
      ai_parsed,
      tags,
      uuid,
      created_at: nowStr
    }]);

    // 방금 삽입된 실제 정수 id 가져오기
    const insertedEstRes = await queryTable('crm_estimates', { filters: { uuid }, limit: 1 });
    const insertedEst = insertedEstRes.rows && insertedEstRes.rows.length > 0 ? insertedEstRes.rows[0] : null;
    const realEstimateId = insertedEst ? String(insertedEst.id) : estimateId;

    // 4. crm_estimate_items 디테일 테이블 품목 삽입
    const detailRows = itemRows.map((row: any, idx: number) => ({
      id: Date.now() + idx,
      estimate_id: realEstimateId,
      product_id: row.product_id,
      product_name: row.product_name,
      quantity: row.quantity,
      unit_price: row.unit_price,
      amount: row.amount
    }));

    await insertRows('crm_estimate_items', detailRows);

    // B2B 견적 자동 이메일 연동
    let targetEmail = email;
    if (!targetEmail && partner_name) {
      const partnerRes = await queryTable('crm_partners', { filters: { company_name: partner_name }, limit: 1 });
      if (partnerRes.rows && partnerRes.rows.length > 0) {
        targetEmail = partnerRes.rows[0].email || '';
      }
    }

    if (targetEmail) {
      if (type === 'INBOUND') {
        // 모바일 접수 확인 메일: 사용자 대기 최소화를 위해 백그라운드 비동기 발송
        sendEstimateEmail(realEstimateId, type, direction_status, partner_name, targetEmail, total_amount, itemRows)
          .catch((e) => console.warn('B2B 견적 접수 메일 백그라운드 발송 실패:', e.message));
      } else if (type === 'OUTBOUND' && direction_status === 'SENT') {
        // 관리자 정식 발송: 메일 발송 실패 시 에러를 반환
        const mailRes = await sendEstimateEmail(realEstimateId, type, direction_status, partner_name, targetEmail, total_amount, itemRows);
        if (!mailRes.success) {
          return NextResponse.json({
            success: false,
            error: `견적서는 작성되었으나 이메일 전송에 실패했습니다: ${mailRes.error}. [시스템 설정]에서 발송용 SMTP 계정이 올바르게 기입되었는지 확인해주세요.`
          }, { status: 400 });
        }
      }
    }

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
      direction_status,
      tags,
      items
    } = body;

    if (!estimateId) {
      return NextResponse.json({ success: false, error: '견적 번호가 누락되었습니다.' }, { status: 400 });
    }

    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
    const masterUpdates: any = {
      updated_at: nowStr
    };
    if (partner_name !== undefined) masterUpdates.partner_name = partner_name;
    if (partner_phone !== undefined) masterUpdates.partner_phone = partner_phone;
    if (direction_status !== undefined) masterUpdates.direction_status = direction_status;
    if (tags !== undefined) masterUpdates.tags = tags;

    let totalAmountVal = 0;

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
      totalAmountVal = total_amount;

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
    } else {
      await updateRows('crm_estimates', masterUpdates, { filters: { id: estimateId } });
    }

    // 💡 정식 견적서 이메일 발송 연동 (최종 상태가 SENT 인 경우)
    const estInfo = await queryTable('crm_estimates', { filters: { id: estimateId }, limit: 1 });
    const currentEst = estInfo.rows?.[0];
    const finalStatus = currentEst?.direction_status || '';
    const finalPartnerName = currentEst?.partner_name || '';
    const finalTotalAmount = currentEst?.total_amount || totalAmountVal || 0;

    // 상세 품목 목록 다시 로드
    const finalItemsRes = await queryTable('crm_estimate_items', { filters: { estimate_id: estimateId } });
    const finalItems = finalItemsRes.rows || [];

    if (finalStatus === 'SENT') {
      let targetEmail = body.email;
      if (!targetEmail && finalPartnerName) {
        const partnerRes = await queryTable('crm_partners', { filters: { company_name: finalPartnerName }, limit: 1 });
        if (partnerRes.rows && partnerRes.rows.length > 0) {
          targetEmail = partnerRes.rows[0].email || '';
        }
      }

      if (targetEmail) {
        const mailRes = await sendEstimateEmail(estimateId, 'OUTBOUND', finalStatus, finalPartnerName, targetEmail, finalTotalAmount, finalItems);
        if (!mailRes.success) {
          return NextResponse.json({
            success: false,
            error: `견적서는 수정(저장)되었으나 이메일 전송에 실패했습니다: ${mailRes.error}. [시스템 설정]에서 발송용 SMTP 계정이 올바르게 기입되었는지 확인해주세요.`
          }, { status: 400 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '견적서가 성공적으로 수정(저장) 및 처리되었습니다.',
      totalAmount: finalTotalAmount
    });

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

    // 💡 안전 가드: 발주서(crm_purchase_orders) 또는 수주서(crm_sales_orders)로의 전환 여부 검사 및 삭제 차단 (queryTable 우회)
    const poRes = await queryTable('crm_purchase_orders', { filters: { estimate_id: estimateId }, limit: 1 });
    const poRows = poRes.rows || [];
    const soRes = await queryTable('crm_sales_orders', { filters: { estimate_id: estimateId }, limit: 1 });
    const soRows = soRes.rows || [];

    if (poRows.length > 0 || soRows.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: '🔒 삭제 불가: 이 견적서는 이미 발주 또는 수주로 전환(연동)된 상태입니다. 연동된 발주/수주 내역을 먼저 삭제해 주세요.' 
      }, { status: 400 });
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
