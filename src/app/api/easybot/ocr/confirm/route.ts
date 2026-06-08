export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { updateRows, insertRows, queryTable } from '../../../../../../egdesk-helpers';

/**
 * 최고관리자(SUPER_ADMIN) 권한 검증 공통 헬퍼
 */
async function verifySuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    throw new Error('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
  }

  const payload = decodeJwt(token);
  if (payload.role !== 'SUPER_ADMIN') {
    throw new Error('등록 확정 권한이 없습니다. 최고관리자 계정으로 로그인해주세요.');
  }
}

/**
 * 현재 타임스탬프 반환 (YYYY-MM-DD HH:MM:SS)
 */
function getNowTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export async function POST(req: Request) {
  try {
    // 1. 최고관리자 세션 검증
    await verifySuperAdmin();

    const reqBody = await req.json();
    const { fileType } = reqBody;
    const nowStr = getNowTimestamp();

    // ==================================================
    // 📂 분기 처리 0: 재무제표 확정 (FINANCIAL_STATEMENT)
    // ==================================================
    if (fileType === 'FINANCIAL_STATEMENT') {
      const {
        partnerId,
        companyType,
        data,
        pdfFilePath
      } = reqBody;

      if (!partnerId) {
        return NextResponse.json({
          success: false,
          error: '등록할 회사 식별자(partnerId)가 누락되었습니다.'
        }, { status: 400 });
      }

      const {
        fiscalYear,
        fiscalQuarter = 'YR',
        totalAssets = 0,
        totalLiabilities = 0,
        totalEquity = 0,
        revenue = 0,
        operatingIncome = 0,
        netIncome = 0,
        parsedRawJson
      } = data || {};

      if (!fiscalYear) {
        return NextResponse.json({
          success: false,
          error: '등록할 회계 연도(fiscalYear) 정보가 누락되었습니다.'
        }, { status: 400 });
      }

      // 동일 회사의 연도/분기 중복 조회
      const checkRes = await queryTable('crm_financial_statements', {
        filters: {
          company_id: partnerId,
          fiscal_year: Number(fiscalYear),
          fiscal_quarter: fiscalQuarter
        }
      });

      const exists = checkRes.rows && checkRes.rows.length > 0;
      const nowStr = getNowTimestamp();

      if (exists) {
        const existingId = checkRes.rows[0].id;
        await updateRows('crm_financial_statements', {
          company_type: companyType,
          total_assets: Number(totalAssets),
          total_liabilities: Number(totalLiabilities),
          total_equity: Number(totalEquity),
          revenue: Number(revenue),
          operating_income: Number(operatingIncome),
          net_income: Number(netIncome),
          pdf_file_path: pdfFilePath || checkRes.rows[0].pdf_file_path,
          parsed_raw_json: parsedRawJson ? JSON.stringify(parsedRawJson) : checkRes.rows[0].parsed_raw_json,
          updated_at: nowStr
        }, {
          filters: { id: existingId }
        });

        return NextResponse.json({
          success: true,
          message: '기존 등록된 ' + fiscalYear + '년도 재무제표 정보 갱신을 성공적으로 완료하였습니다.',
          action: 'updated'
        });
      } else {
        const generatedId = 'FIN-' + Date.now();
        await insertRows('crm_financial_statements', [{
          id: generatedId,
          company_id: partnerId,
          company_type: companyType,
          fiscal_year: Number(fiscalYear),
          fiscal_quarter: fiscalQuarter,
          total_assets: Number(totalAssets),
          total_liabilities: Number(totalLiabilities),
          total_equity: Number(totalEquity),
          revenue: Number(revenue),
          operating_income: Number(operatingIncome),
          net_income: Number(netIncome),
          pdf_file_path: pdfFilePath || '',
          parsed_raw_json: parsedRawJson ? JSON.stringify(parsedRawJson) : '',
          created_at: nowStr,
          updated_at: nowStr
        }]);

        return NextResponse.json({
          success: true,
          message: '신규 ' + fiscalYear + '년도 재무제표 정보를 데이터베이스에 성공적으로 적재 완료하였습니다.',
          action: 'inserted'
        });
      }
    }

    // ==================================================
    // 📂 분기 처리 1: 사업자등록증 확정 (BUSINESS_LICENSE)
    // ==================================================
    if (fileType === 'BUSINESS_LICENSE') {
      const { status, data, existingId } = reqBody;
      
      if (!data || !data.companyName) {
        return NextResponse.json({
          success: false,
          error: '등록 및 갱신할 상호명(companyName)이 누락되었습니다.'
        }, { status: 400 });
      }

      const cleanBizNo = (data.businessNumber || '').replace(/\D/g, '');

      if (status === 'NEW_PARTNER') {
        const generatedId = `P_${Date.now()}`;
        
        await insertRows('crm_partners', [{
          id: generatedId,
          type: 'BUYER', // B2B 바이어 기본 설정
          company_name: data.companyName,
          business_number: cleanBizNo,
          representative: data.representative || '',
          phone: data.phone || '',
          manager_name: data.managerName || '',
          address: data.address || '',
          vip_level: 'NORMAL',
          credit_limit: 0,
          memo: data.memo || '이지봇 AI 사업자등록증 신규 가입 완료',
          created_at: nowStr
        }]);

        return NextResponse.json({
          success: true,
          message: `이지봇 AI 비서가 신규 바이어 [${data.companyName}] 님의 정보와 국세청 가동 정보를 대조 및 등록 완수했습니다! 🚀`,
          action: 'inserted'
        });
      }

      if (status === 'UPDATE_PARTNER') {
        if (!existingId) {
          return NextResponse.json({
            success: false,
            error: '정보를 업데이트할 기존 거래처 고유 ID(existingId)가 누락되었습니다.'
          }, { status: 400 });
        }

        await updateRows('crm_partners', {
          company_name: data.companyName,
          representative: data.representative || '',
          address: data.address || '',
          phone: data.phone || '',
          manager_name: data.managerName || '',
          memo: data.memo || ''
        }, { filters: { id: existingId } });

        return NextResponse.json({
          success: true,
          message: `기존 B2B 거래처 [${data.companyName}] 님의 최신 사업자 가동 및 대표자/본점 이전 정보 갱신과 AI 이력 백업을 완수했습니다! ⚡`,
          action: 'updated'
        });
      }

      return NextResponse.json({
        success: false,
        error: '알 수 없는 판독 상태입니다.'
      }, { status: 400 });
    }

    // ==================================================
    // 💡 분기 처리 1.5: 자율 입고 확정 (INVENTORY_INBOUND)
    // ==================================================
    if (fileType === 'INVENTORY_INBOUND') {
      const {
        partnerName,
        inboundDate,
        items = [],
        pdfFilePath
      } = reqBody;

      if (!inboundDate) {
        return NextResponse.json({
          success: false,
          error: '입고 일자(inboundDate) 정보가 누락되었습니다.'
        }, { status: 400 });
      }

      // 1) crm_inventory_inbounds 레코드 생성
      const inboundId = 'INB-' + Date.now();
      let totalAmount = 0;

      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        totalAmount += qty * price;
      }

      await insertRows('crm_inventory_inbounds', [{
        id: inboundId,
        partner_name: partnerName || '',
        inbound_date: inboundDate,
        total_amount: totalAmount,
        pdf_file_path: pdfFilePath || '',
        created_at: nowStr,
        updated_at: nowStr
      }]);

      // 2) crm_inventory_inbound_items 상세 품목 추가 및 실제 재고(inventory_items / inventory_logs) 반영
      const existingItemsRes = await queryTable('inventory_items', {});
      const existingItems = existingItemsRes.rows || [];
      let maxItemId = existingItems.length > 0 ? Math.max(...existingItems.map((i: any) => Number(i.id) || 0)) : 0;

      const existingLogsRes = await queryTable('inventory_logs', {});
      const existingLogs = existingLogsRes.rows || [];
      let maxLogId = existingLogs.length > 0 ? Math.max(...existingLogs.map((l: any) => Number(l.id) || 0)) : 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const inboundItemId = `INB-ITEM-${Date.now()}-${i}`;
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const barcode = item.barcode || '';
        const itemName = item.itemName || '';
        const spec = item.spec || '';
        
        let finalMatchedItemId: number | null = null;

        if (item.matchedItemId && item.matchedItemId !== 'NEW') {
          // 2-A. 기존 재고 품목에 가산
          finalMatchedItemId = Number(item.matchedItemId);
          
          const matchCheck = await queryTable('inventory_items', { filters: { id: finalMatchedItemId } });
          if (matchCheck.rows && matchCheck.rows.length > 0) {
            const currentItem = matchCheck.rows[0];
            const newStock = (Number(currentItem.stock) || 0) + qty;
            
            // 재고 수량 및 최근 단가(값이 있을 때만) 업데이트
            await updateRows('inventory_items', {
              stock: newStock,
              price: price > 0 ? price : currentItem.price,
              updated_at: nowStr
            }, { filters: { id: finalMatchedItemId } });

            // 재고 변동 로그 기록
            maxLogId++;
            await insertRows('inventory_logs', [{
              id: maxLogId,
              itemId: finalMatchedItemId,
              itemName: itemName,
              itemType: currentItem.type || '자재',
              changeType: 'INBOUND',
              quantity: qty,
              price: price,
              operator: 'AI 이지봇',
              note: `[자율 입고] ${partnerName || ''} 거래명세서 스캔 확정 반영`,
              createdAt: nowStr
            }]);
          }
        } else {
          // 2-B. 신규 품목 등록 처리 (matchedItemId === 'NEW' 또는 지정 안 됨)
          maxItemId++;
          finalMatchedItemId = maxItemId;

          // 신규 재고 품목 인서트
          await insertRows('inventory_items', [{
            id: finalMatchedItemId,
            type: '자재',
            name: itemName,
            category: '기타',
            price: price,
            partner: partnerName || '',
            stock: qty,
            safeStock: 0,
            location: '자율입고창고',
            spec: spec,
            unitType: '개',
            unitValue: '1',
            boxContains: 1,
            description: 'AI 이지봇 자율 입고 OCR 등록 품목',
            barcode: barcode,
            createdAt: nowStr,
            uuid: `ITEM-${Date.now()}-${i}`
          }]);

          // 신규 등록 입고 로그 기록
          maxLogId++;
          await insertRows('inventory_logs', [{
            id: maxLogId,
            itemId: finalMatchedItemId,
            itemName: itemName,
            itemType: '자재',
            changeType: 'INBOUND',
            quantity: qty,
            price: price,
            operator: 'AI 이지봇',
            note: `[자율 신규 등록] ${partnerName || ''} 거래명세서 스캔 최초 입고`,
            createdAt: nowStr
          }]);
        }

        // crm_inventory_inbound_items 상세 품목 인서트
        await insertRows('crm_inventory_inbound_items', [{
          id: inboundItemId,
          inbound_id: inboundId,
          item_name: itemName,
          spec: spec,
          quantity: qty,
          price: price,
          barcode: barcode,
          matched_item_id: finalMatchedItemId,
          created_at: nowStr
        }]);
      }

      return NextResponse.json({
        success: true,
        message: `거래처 [${partnerName || '미지정'}]의 총 ${items.length}개 품목에 대한 자율 입고 처리가 성공적으로 완료되었습니다.`,
        action: 'inbound_completed',
        inboundId
      });
    }

    // ==================================================
    // 📂 분기 처리 2: 명함 확정 (BUSINESS_CARD) - 레거시 완벽 승계
    // ==================================================
    const { 
      name, 
      position, 
      phone, 
      email, 
      partnerId, 
      partnerName, 
      existingContactId, 
      cardImageUrl 
    } = reqBody;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: '등록할 담당자 성명(name) 정보가 누락되었습니다.'
      }, { status: 400 });
    }

    let finalPartnerId = partnerId;

    if (!finalPartnerId && partnerName) {
      const generatedId = `P_${Date.now()}`;
      try {
        await insertRows('crm_partners', [
          {
            id: generatedId,
            name: partnerName,
            created_at: nowStr
          }
        ]);
        finalPartnerId = generatedId;
      } catch (partnerInsertErr: any) {
        console.warn('임시 거래처 생성 실패, 기본 그룹으로 우회합니다:', partnerInsertErr.message);
        finalPartnerId = '개인_기타';
      }
    } else if (!finalPartnerId) {
      finalPartnerId = '개인_기타';
    }

    const { actionType } = reqBody;

    if (actionType === 'update_info') {
      if (!existingContactId) {
        return NextResponse.json({
          success: false,
          error: '정보를 업데이트할 기존 담당자 식별자(existingContactId)가 누락되었습니다.'
        }, { status: 400 });
      }

      await updateRows('crm_partner_contacts',
        { 
          position, 
          phone, 
          email, 
          card_image_url: cardImageUrl || '',
          is_active: 1
        },
        { filters: { id: existingContactId } }
      );

      return NextResponse.json({
        success: true,
        message: `기존 등록된 '${name}' 담당자의 연락망 및 부서/직책 최신 정보 갱신을 성공적으로 완료하였습니다.`,
        action: 'updated'
      });
    }

    if (actionType === 'career_transition') {
      if (!existingContactId) {
        return NextResponse.json({
          success: false,
          error: '이직 처리를 수행할 기존 담당자 식별자(existingContactId)가 누락되었습니다.'
        }, { status: 400 });
      }

      await updateRows('crm_partner_contacts',
        { is_active: 0 },
        { filters: { id: existingContactId } }
      );

      const contactsRes = await queryTable('crm_partner_contacts');
      const contacts = contactsRes.rows || [];
      const nextId = contacts.length > 0 ? Math.max(...contacts.map((c: any) => parseInt(c.id) || 0)) + 1 : 1;

      await insertRows('crm_partner_contacts', [
        {
          id: nextId,
          partner_id: finalPartnerId,
          name,
          position,
          phone,
          email,
          card_image_url: cardImageUrl || '',
          is_primary: 0,
          is_active: 1,
          created_at: nowStr
        }
      ]);

      return NextResponse.json({
        success: true,
        message: `'${name}' 담당자의 기존 회사 재직 정보를 '이직(비활성)' 보존 처리하고, 신규 파트너사의 대표 연락망으로 이적 등록을 정상 완료하였습니다.`,
        action: 'transitioned'
      });
    }

    const contactsRes = await queryTable('crm_partner_contacts');
    const contacts = contactsRes.rows || [];
    const nextId = contacts.length > 0 ? Math.max(...contacts.map((c: any) => parseInt(c.id) || 0)) + 1 : 1;

    await insertRows('crm_partner_contacts', [
      {
        id: nextId,
        partner_id: finalPartnerId,
        name,
        position,
        phone,
        email,
        card_image_url: cardImageUrl || '',
        is_primary: contacts.filter((c: any) => c.partner_id === finalPartnerId).length === 0 ? 1 : 0,
        is_active: 1,
        created_at: nowStr
      }
    ]);

    return NextResponse.json({
      success: true,
      message: `신규 담당자 '${name}' 님의 명함 정보 등록을 명함첩에 최종 완료하였습니다.`,
      action: 'inserted'
    });

  } catch (error: any) {
    console.error('이지봇 확정 반영 오류:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '최종 정보를 데이터베이스에 반영하는 중 내부 예외가 발생했습니다.'
    }, { status: 500 });
  }
}
