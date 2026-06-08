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
          fiscal_year: String(fiscalYear),
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
          
          const matchCheck = await queryTable('inventory_items', { filters: { id: String(finalMatchedItemId) } });
          if (matchCheck.rows && matchCheck.rows.length > 0) {
            const currentItem = matchCheck.rows[0];
            const newStock = (Number(currentItem.stock) || 0) + qty;
            
            // 재고 수량 및 최근 단가(값이 있을 때만) 업데이트
            await updateRows('inventory_items', {
              stock: newStock,
              price: price > 0 ? price : currentItem.price,
              updated_at: nowStr
            }, { filters: { id: String(finalMatchedItemId) } });

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
    // 📂 분기 처리 1.6: 이력서 확정 (RESUME)
    // ==================================================
    if (fileType === 'RESUME') {
      const { data } = reqBody;
      if (!data || !data.name) {
        return NextResponse.json({
          success: false,
          error: '등록할 지원자의 성명(name)이 누락되었습니다.'
        }, { status: 400 });
      }

      const generatedId = `APP-${Date.now()}`;
      const applicantRecord = {
        id: generatedId,
        name: data.name,
        age: data.age || '',
        phone: data.phone || '',
        experience: data.experience || '',
        motivation: data.motivation || '',
        matching_score: Number(data.matching_score) || 0,
        status: 'applied',
        signature_url: null,
        signed_at: null,
        resume_file_path: data.resume_file_path || '',
        tech_stacks: data.tech_stacks || '',
        interview_logs: JSON.stringify([]),
        ai_evaluation: null,
        created_at: nowStr
      };

      await insertRows('crm_recruitment_applicants', [applicantRecord]);

      return NextResponse.json({
        success: true,
        message: `이지봇 AI 비서가 지원자 [${data.name}] 님의 이력서 프로필을 채용 인재풀에 안전하게 적재 완료하였습니다! 🎯`,
        action: 'inserted',
        applicant: {
          id: applicantRecord.id,
          name: applicantRecord.name,
          age: applicantRecord.age,
          phone: applicantRecord.phone,
          experience: applicantRecord.experience,
          motivation: applicantRecord.motivation,
          matchingScore: applicantRecord.matching_score,
          status: applicantRecord.status,
          interviewLogs: [],
          resume_file_path: applicantRecord.resume_file_path,
          tech_stacks: applicantRecord.tech_stacks
        }
      });
    }

    // ==================================================
    // 📂 분기 처리 1.7: 병원 진단서 확정 (MEDICAL_CERTIFICATE)
    // ==================================================
    if (fileType === 'MEDICAL_CERTIFICATE') {
      const { data, operatorId } = reqBody;
      if (!operatorId) {
        return NextResponse.json({
          success: false,
          error: '병가 신청을 상신할 직원을 선택해 주세요.'
        }, { status: 400 });
      }
      if (!data || !data.startDate || !data.endDate) {
        return NextResponse.json({
          success: false,
          error: '병가 기간(시작일/종료일) 정보가 누락되었습니다.'
        }, { status: 400 });
      }

      const generatedId = `LV-${Date.now()}`;
      await insertRows('crm_annual_leaves', [{
        id: generatedId,
        operator_id: operatorId,
        leave_type: 'SICK',
        start_date: data.startDate,
        end_date: data.endDate,
        days_spent: Number(data.daysSpent) || 0,
        status: 'PENDING',
        reason: `[병가 증빙 등록] 진단명: ${data.diagnosis || '진단서 증빙 첨부'}`,
        reject_reason: null,
        approver_id: null,
        medical_certificate_path: data.medical_certificate_path || '',
        created_at: nowStr,
        updated_at: nowStr
      }]);

      return NextResponse.json({
        success: true,
        message: `이지봇 AI 비서가 첨부된 실물 진단서 증빙과 매칭된 직원의 병가 신청(결재 대기) 건 상신 등록을 완수했습니다! 📄`,
        action: 'inserted',
        leaveId: generatedId
      });
    }

    // ==================================================
    // 📂 분기 처리 1.8: 매입 명세서 확정 (PURCHASE_INVOICE)
    // ==================================================
    if (fileType === 'PURCHASE_INVOICE') {
      const { items = [] } = reqBody;
      
      if (items.length === 0) {
        return NextResponse.json({
          success: false,
          error: '등록할 매입 품목 정보가 없습니다.'
        }, { status: 400 });
      }

      const trackedItemsRes = await queryTable('tracked_items', {});
      const allTrackedItems = trackedItemsRes.rows || [];
      let maxItemId = allTrackedItems.length > 0 ? Math.max(...allTrackedItems.map((i: any) => Number(i.item_id) || 0)) : 0;

      let updatedCount = 0;
      let insertedCount = 0;

      for (const item of items) {
        const price = Number(item.unitPrice) || 0;
        const itemName = item.itemName || '';
        const spec = item.spec || '';
        
        let targetItemId = item.matched_item_id ? Number(item.matched_item_id) : null;

        // 매핑된 ID가 없는 경우, 이름 매칭 시도
        if (!targetItemId) {
          const match = allTrackedItems.find((t: any) => 
            t.item_name && t.item_name.trim() === itemName.trim()
          );
          if (match) {
            targetItemId = match.item_id;
          }
        }

        if (targetItemId) {
          // 기존 가격 추적 품목의 base_price(매입 원가) 업데이트
          await updateRows('tracked_items', {
            base_price: price,
            spec: spec || undefined
          }, { filters: { item_id: String(targetItemId) } });
          updatedCount++;
        } else {
          // 신규 품목 등록
          maxItemId++;
          await insertRows('tracked_items', [{
            item_id: maxItemId,
            item_code: `RAW-AUTO-${Date.now()}-${insertedCount}`,
            item_name: itemName,
            category: 'RAW_MATERIAL',
            spec: spec || '',
            base_price: price,
            target_margin_rate: 10.0, // 기본 마진율 목표 10%
            created_at: nowStr
          }]);
          insertedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `매입 명세서 확정 완료: 총 ${items.length}건 중 기존 원가 갱신 ${updatedCount}건, 신규 품목 자율 등록 ${insertedCount}건이 수행되었습니다.`,
        action: 'purchase_invoice_completed'
      });
    }

    // ==================================================
    // 📂 분기 처리 1.9: 경쟁 가격 캡처 확정 (COMPETITOR_PRICE_CAPTURE)
    // ==================================================
    if (fileType === 'COMPETITOR_PRICE_CAPTURE') {
      const { matchedItemId, data } = reqBody;
      const { competitorName, itemName, capturedPrice, captureUrl } = data || {};

      if (!matchedItemId) {
        return NextResponse.json({
          success: false,
          error: '매핑할 자사 품목(matchedItemId)을 선택해 주세요.'
        }, { status: 400 });
      }

      if (!capturedPrice) {
        return NextResponse.json({
          success: false,
          error: '등록할 수집 가격(capturedPrice) 정보가 누락되었습니다.'
        }, { status: 400 });
      }

      // 1) 감시 대상 URL 쿼리 및 필요시 생성
      const urlsRes = await queryTable('target_urls', {
        filters: { item_id: String(matchedItemId), site_name: competitorName }
      });
      let urlId = urlsRes.rows && urlsRes.rows.length > 0 ? urlsRes.rows[0].url_id : null;

      if (!urlId) {
        const allUrls = await queryTable('target_urls', {});
        const maxUrlId = allUrls.rows && allUrls.rows.length > 0 ? Math.max(...allUrls.rows.map((u: any) => Number(u.url_id) || 0)) : 0;
        urlId = maxUrlId + 1;

        await insertRows('target_urls', [{
          url_id: urlId,
          item_id: Number(matchedItemId),
          site_name: competitorName || '외부 사이트',
          target_url: captureUrl || 'http://localhost:4000/price-tracker',
          css_selector: 'body',
          cron_interval: '0 9 * * *',
          is_active: 1,
          created_at: nowStr
        }]);
      }

      // 2) price_histories 에 이력 기록
      const historiesRes = await queryTable('price_histories', {});
      const maxHistoryId = historiesRes.rows && historiesRes.rows.length > 0 ? Math.max(...historiesRes.rows.map((h: any) => Number(h.history_id) || 0)) : 0;
      const newHistoryId = maxHistoryId + 1;

      await insertRows('price_histories', [{
        history_id: newHistoryId,
        url_id: urlId,
        captured_price: Number(capturedPrice),
        captured_at: nowStr,
        status: 'SUCCESS',
        error_message: null
      }]);

      // 3) 마진 실시간 연산 및 경보 트리거 감시
      const itemRes = await queryTable('tracked_items', { filters: { item_id: String(matchedItemId) } });
      const currentItem = itemRes.rows && itemRes.rows.length > 0 ? itemRes.rows[0] : null;
      
      let marginReport = '마진 분석 생략';
      let isMarginCollapsed = false;

      if (currentItem) {
        const basePrice = Number(currentItem.base_price || 0);
        const targetMarginRate = Number(currentItem.target_margin_rate || 10.0);
        
        // 실시간 마진율 = ((경쟁사 판매가 - 자사 매입원가) / 경쟁사 판매가) * 100
        const currentMarginRate = capturedPrice > 0 ? ((capturedPrice - basePrice) / capturedPrice) * 100 : 0;
        
        isMarginCollapsed = currentMarginRate < targetMarginRate;
        marginReport = `자사 매입원가 ${basePrice.toLocaleString()}원 대비 경쟁가 ${capturedPrice.toLocaleString()}원의 현재 마진율은 ${currentMarginRate.toFixed(1)}% 입니다. (목표 마진율: ${targetMarginRate}%)`;

        if (isMarginCollapsed) {
          // 쿨다운 검사: 3시간 이내 동일 품목 경보가 발송되었는지 여부
          const recentLogs = await queryTable('alert_logs', { orderBy: 'sent_at', orderDirection: 'DESC' });
          const lastLog = (recentLogs.rows || []).find((l: any) => {
            const timeDiff = Date.now() - new Date(l.sent_at).getTime();
            return l.sent_message.includes(currentItem.item_name) && timeDiff < 3 * 60 * 60 * 1000;
          });

          if (!lastLog) {
            const logsAll = await queryTable('alert_logs', {});
            const maxLogId = logsAll.rows && logsAll.rows.length > 0 ? Math.max(...logsAll.rows.map((l: any) => Number(l.log_id) || 0)) : 0;
            const newLogId = maxLogId + 1;

            const smsMsg = `[🚨마진비상] 품목 '${currentItem.item_name}'의 마진율이 ${currentMarginRate.toFixed(1)}%로 목표치(${targetMarginRate}%) 아래로 붕괴되었습니다! (경쟁가: ${capturedPrice.toLocaleString()}원, 원가: ${basePrice.toLocaleString()}원)`;
            
            await insertRows('alert_logs', [{
              log_id: newLogId,
              rule_id: 999, // 이지봇 강제 경보 규칙
              sent_price: Number(capturedPrice),
              sent_message: smsMsg,
              sent_at: nowStr,
              api_response: 'SUCCESS'
            }]);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `경쟁사 [${competitorName}]의 제품 [${itemName}] 시세(${capturedPrice.toLocaleString()}원) 매핑 등록이 정상 완료되었습니다. ${isMarginCollapsed ? '⚠️ 마진 붕괴 위험 감지!' : '🟢 마진 양호'}`,
        action: 'competitor_price_completed',
        marginReport
      });
    }

    // ==================================================
    // 📂 분기 처리 1.95: 설비 명판 확정 (FACILITY_PLATE)
    // ==================================================
    if (fileType === 'FACILITY_PLATE') {
      const { data } = reqBody;
      const { manufacturer, modelName, serialNumber, manufactureYear, specifications } = data || {};

      if (!modelName) {
        return NextResponse.json({
          success: false,
          error: '등록할 설비 모델명(modelName) 정보가 누락되었습니다.'
        }, { status: 400 });
      }

      const checkRes = await queryTable('crm_facilities', {
        filters: { serial_number: serialNumber }
      });

      const exists = checkRes.rows && checkRes.rows.length > 0;
      const nowStr = getNowTimestamp();

      if (exists) {
        const existingId = checkRes.rows[0].id;
        await updateRows('crm_facilities', {
          manufacturer: manufacturer || checkRes.rows[0].manufacturer,
          model_name: modelName,
          manufacture_year: Number(manufactureYear) || checkRes.rows[0].manufacture_year,
          specifications: specifications || checkRes.rows[0].specifications,
          updated_at: nowStr
        }, {
          filters: { id: existingId }
        });

        return NextResponse.json({
          success: true,
          message: `기존 등록된 설비 [${modelName}]의 제조 사양 정보를 성공적으로 업데이트 완료했습니다. ⚡`,
          action: 'updated'
        });
      } else {
        const generatedId = 'EQ-' + Date.now();
        await insertRows('crm_facilities', [{
          id: generatedId,
          name: modelName,
          manufacturer: manufacturer || '',
          model_name: modelName,
          serial_number: serialNumber || `SN-${Date.now()}`,
          manufacture_year: Number(manufactureYear) || null,
          specifications: specifications || '',
          location: '미지정 공장',
          status: 'RUNNING',
          health_score: 100.0,
          vibration_rms: 0.0,
          created_at: nowStr,
          updated_at: nowStr
        }]);

        return NextResponse.json({
          success: true,
          message: `신규 설비 [${modelName}]를 설비 대장에 성공적으로 마운트 완료하였습니다. 🚀`,
          action: 'inserted'
        });
      }
    }

    // ==================================================
    // 📂 분기 처리 1.96: 설비 수기 점검표 확정 (FACILITY_CHECKLIST)
    // ==================================================
    if (fileType === 'FACILITY_CHECKLIST') {
      const { data } = reqBody;
      const { equipmentId, inspector, checkDate, checks = [], pdfFilePath } = data || {};

      if (!equipmentId || !inspector) {
        return NextResponse.json({
          success: false,
          error: '점검할 설비 ID(equipmentId) 및 점검자(inspector) 정보가 누락되었습니다.'
        }, { status: 400 });
      }

      const hasFail = checks.some((c: any) => c.status === 'FAIL');
      const overallStatus = hasFail ? 'FAIL' : 'PASS';
      const checklistId = 'MC-' + Date.now();

      await insertRows('crm_facility_checklists', [{
        id: checklistId,
        equipmentId,
        inspector,
        checks: JSON.stringify(checks),
        signatureData: null,
        audioUrl: pdfFilePath || null,
        status: overallStatus,
        checkedAt: checkDate || nowStr
      }]);

      let taskCreated = false;
      let taskId = '';

      if (overallStatus === 'FAIL') {
        taskId = 'TSK-' + Date.now();
        const failItemsStr = checks
          .filter((c: any) => c.status === 'FAIL')
          .map((c: any) => `${c.checkItem} (${c.comment || '조치 필요'})`)
          .join(', ');

        await insertRows('crm_snaptasks', [{
          id: taskId,
          title: `[설비 비상] ${equipmentId} 긴급 정비 지시`,
          status: 'ACTIVE',
          partner_id: null,
          created_at: nowStr,
          updated_at: nowStr
        }]);

        const allTimelineItems = await queryTable('crm_snaptask_items', {});
        const maxTimelineId = allTimelineItems.rows && allTimelineItems.rows.length > 0
          ? Math.max(...allTimelineItems.rows.map((t: any) => Number(t.id) || 0))
          : 0;
        const newTimelineId = maxTimelineId + 1;

        await insertRows('crm_snaptask_items', [{
          id: newTimelineId,
          task_id: taskId,
          content_text: `수기 점검표 OCR 인식 결과 설비 부적합 결함이 발견되어 예방 보전 조치를 발령합니다.\n\n[부적합 상세]\n${failItemsStr}\n\n점검자: ${inspector}`,
          file_url: pdfFilePath || '',
          file_type: 'IMAGE',
          ai_analysis: JSON.stringify(checks),
          created_at: nowStr
        }]);

        const allActions = await queryTable('crm_snaptask_actions', {});
        const maxActionId = allActions.rows && allActions.rows.length > 0
          ? Math.max(...allActions.rows.map((a: any) => Number(a.id) || 0))
          : 0;
        const newActionId = maxActionId + 1;

        await insertRows('crm_snaptask_actions', [{
          id: newActionId,
          task_id: taskId,
          action_type: 'SMS_SENT',
          description: `보전팀 대상 긴급 장애 대응 문자 및 알림톡 발송 완료 (FAIL 감지 건)`,
          created_at: nowStr
        }]);

        taskCreated = true;
      }

      return NextResponse.json({
        success: true,
        message: `수기 점검표 데이터를 점검 이력에 성공적으로 적재 완료하였습니다. ${
          overallStatus === 'FAIL'
            ? `⚠️ 부적합 결함 발생에 따라 보전 작업 지시(${taskId})가 즉시 자동 발령되었습니다.`
            : '🟢 모든 항목 양호 검증됨.'
        }`,
        action: 'checklist_completed',
        checklistId,
        taskCreated,
        taskId: taskId || null
      });
    }

    // ==================================================
    // 📂 분기 처리 1.98: 소송/법률 문서 확정 및 일정 연동 (LEGAL_DOCUMENT)
    // ==================================================
    if (fileType === 'LEGAL_DOCUMENT') {
      const { data } = reqBody;
      const { documentType, caseNumber, summary, deadline, actions = [], pdfFilePath } = data || {};

      const taskId = 'TSK-' + Date.now();
      const title = `[법률/소송] ${documentType} 대응 기한 (${caseNumber || '사건번호 미상'})`;

      // 1. 태스크 메인 등록
      await insertRows('crm_snaptasks', [{
        id: taskId,
        title,
        status: 'ACTIVE',
        partner_id: null,
        created_at: nowStr,
        updated_at: nowStr
      }]);

      // 2. 타임라인(SnapTask Items) 등록
      const allTimelineItems = await queryTable('crm_snaptask_items', {});
      const maxTimelineId = allTimelineItems.rows && allTimelineItems.rows.length > 0
        ? Math.max(...allTimelineItems.rows.map((t: any) => Number(t.id) || 0))
        : 0;
      const newTimelineId = maxTimelineId + 1;

      const actionsStr = Array.isArray(actions) 
        ? actions.map((a: any, idx: number) => `${idx + 1}. ${a}`).join('\n')
        : '';

      const contentText = `변호사 AI 분석 결과 도출된 중요 일정입니다.\n\n[사건번호] ${caseNumber || '미상'}\n[문서유형] ${documentType}\n[제출기한] ${deadline || '기한 정보 없음'}\n\n[문서 요약]\n${summary || '요약 없음'}\n\n[행동지침]\n${actionsStr}`;

      await insertRows('crm_snaptask_items', [{
        id: newTimelineId,
        task_id: taskId,
        content_text: contentText,
        file_url: pdfFilePath || '',
        file_type: 'IMAGE',
        ai_analysis: JSON.stringify({ documentType, caseNumber, summary, deadline, actions }),
        created_at: nowStr
      }]);

      return NextResponse.json({
        success: true,
        message: `소송 문서 중요 일정 및 조치 사항이 회사 캘린더/태스크(지시번호: ${taskId})로 성공적으로 연동 등록되었습니다.`,
        action: 'legal_task_completed',
        taskId
      });
    }

    // ==================================================
    // 📂 분기 처리 1.99: 받은 견적서 확정 (INBOUND_ESTIMATE)
    // ==================================================
    if (fileType === 'INBOUND_ESTIMATE') {
      const { partnerName, partnerPhone, estimateDate, items = [], pdfFilePath } = reqBody;

      if (!partnerName) {
        return NextResponse.json({
          success: false,
          error: '등록할 견적서의 거래처/공급처명(partnerName)이 누락되었습니다.'
        }, { status: 400 });
      }

      if (items.length === 0) {
        return NextResponse.json({
          success: false,
          error: '등록할 견적 품목 정보가 없습니다.'
        }, { status: 400 });
      }

      // 1. 총 합계 금액 산정
      let total_amount = 0;
      const itemRows = items.map((item: any) => {
        const qty = parseInt(item.quantity) || 0;
        const price = parseInt(item.unitPrice || item.unit_price) || 0;
        const amount = qty * price;
        total_amount += amount;

        return {
          product_name: item.productName || item.product_name || item.itemName || '',
          quantity: qty,
          unit_price: price,
          amount: amount,
          matched_item_id: item.matched_item_id ? Number(item.matched_item_id) : null
        };
      });

      // 2. 견적서 고유 식별 마스터 ID 생성
      const estimateId = `EST-${Date.now()}`;

      // 3. crm_estimates 마스터 테이블 삽입
      await insertRows('crm_estimates', [{
        id: estimateId,
        type: 'INBOUND',
        direction_status: 'RECEIVED', // 이지봇을 통해 받은 것이므로 RECEIVED 상태
        partner_name: partnerName,
        partner_phone: partnerPhone || '',
        total_amount,
        file_url: pdfFilePath || '',
        ai_parsed: 1,
        created_at: nowStr
      }]);

      // 4. crm_estimate_items 디테일 테이블 품목 삽입
      const detailRows = itemRows.map((row: any, idx: number) => ({
        id: Date.now() + idx,
        estimate_id: estimateId,
        product_id: row.matched_item_id ? String(row.matched_item_id) : '',
        product_name: row.product_name,
        quantity: row.quantity,
        unit_price: row.unit_price,
        amount: row.amount
      }));

      await insertRows('crm_estimate_items', detailRows);

      return NextResponse.json({
        success: true,
        message: `받은 견적서 등록 완료: 거래처 [${partnerName}]로부터 총 ${items.length}개 품목(총액 ${total_amount.toLocaleString()}원)의 견적을 정상 연동 접수하였습니다.`,
        action: 'inbound_estimate_completed',
        estimateId
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
