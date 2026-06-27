import { queryTable, insertRows, updateRows } from '../../../../../../../egdesk-helpers';

export async function handleInventoryInbound(reqBody: any, nowStr: string) {
  const {
    partnerName,
    inboundDate,
    items = [],
    pdfFilePath,
    operator
  } = reqBody;

  if (!inboundDate) {
    throw new Error('입고 일자(inboundDate) 정보가 누락되었습니다.');
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

  // 2) crm_inventory_inbound_items 상세 품목 추가 및 실제 재고 반영
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
        
        await updateRows('inventory_items', {
          stock: newStock,
          price: price > 0 ? price : currentItem.price,
          updated_at: nowStr
        }, { filters: { id: String(finalMatchedItemId) } });


      }
    } else {
      // 2-B. 신규 품목 등록 처리
      maxItemId++;
      finalMatchedItemId = maxItemId;

      await insertRows('inventory_items', [{
        id: finalMatchedItemId,
        type: item.itemType || '자재',
        name: itemName,
        category: item.category || '기타',
        price: price,
        partner: partnerName || '',
        stock: qty,
        safeStock: 0,
        location: item.location || '자율입고창고',
        spec: spec,
        unitType: item.unitType || '개',
        unitValue: '1',
        boxContains: Number(item.boxContains) || 1,
        description: 'AI 이지봇 자율 입고 OCR 등록 품목',
        barcode: barcode,
        createdAt: nowStr,
        uuid: `ITEM-${Date.now()}-${i}`
      }]);


    }

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

  // 3) inventory_logs에 입고 등록 절차 건별 단 1행의 요약 로그만 적재
  if (items.length > 0) {
    const totalQty = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
    const representativeName = items[0].itemName || "";
    const representativeType = items[0].itemType || "자재";
    const logItemName = items.length > 1 ? `${representativeName} 외 ${items.length - 1}건` : representativeName;
    const logNote = `[자율 입고 요약] ${partnerName || ''} | 총 ${items.length}개 품목 입고 완료 (inboundId: ${inboundId})` + (pdfFilePath ? ` (증빙: ${pdfFilePath})` : '');

    maxLogId++;
    await insertRows('inventory_logs', [{
      id: maxLogId,
      itemId: -1,
      itemName: logItemName,
      itemType: representativeType,
      changeType: 'in',
      quantity: totalQty,
      price: 0,
      operator: operator || '최고관리자',
      note: logNote,
      createdAt: nowStr
    }]);
  }

  return {
    action: 'inbound_completed',
    inboundId,
    message: `거래처 [${partnerName || '미지정'}]의 총 ${items.length}개 품목에 대한 자율 입고 처리가 성공적으로 완료되었습니다.`,
    auditPrompt: `[이지봇 AI 이미지 OCR 자율 대행] 거래처 [${partnerName || '미지정'}]의 총 ${items.length}개 품목에 대한 자율 입고 처리를 대행하였습니다.`
  };
}
