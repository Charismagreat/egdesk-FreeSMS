export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable } from '../../../../../../egdesk-helpers';
import { handleInventoryInbound } from '../../../easybot/ocr/confirm/services/inventory';

function getKoreanTimestamp() {
  const date = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * POST: 파싱 가공된 엑셀 입고 데이터를 받아 자율 입고 및 재고 반영 실행
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { partner_name, inbound_date, items = [], file_url } = body;

    if (!inbound_date) {
      return NextResponse.json({ success: false, error: '입고 일자(inbound_date) 정보가 누락되었습니다.' }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: '입고할 품목 목록(items)이 비어있습니다.' }, { status: 400 });
    }

    const timestamp = getKoreanTimestamp();

    // 1. 기존 재고 목록을 가져와서 엑셀 항목들과 지능형 품목 매칭 (바코드 또는 품명 기준)
    const existingItemsRes = await queryTable('inventory_items', {});
    const existingItems = existingItemsRes.rows || [];

    const mappedItems = items.map((item: any) => {
      const barcodeOrName = String(item.barcode_or_name || "").trim();
      const spec = String(item.spec || "").trim();
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;

      // 바코드 또는 품명으로 기존 아이템 검색
      const matched = existingItems.find((ei: any) => {
        const eiBarcode = String(ei.barcode || "").trim();
        const eiName = String(ei.name || "").trim();
        return (eiBarcode && eiBarcode === barcodeOrName) || (eiName && eiName === barcodeOrName);
      });

      return {
        barcode: matched ? matched.barcode : (barcodeOrName.match(/^\d+$/) ? barcodeOrName : ""),
        itemName: matched ? matched.name : barcodeOrName,
        spec: spec || (matched ? matched.spec : ""),
        quantity,
        price,
        matchedItemId: matched ? String(matched.id) : "NEW"
      };
    });

    // 2. 이지봇 OCR 승인용 공용 서비스를 호출하여 자율 입고 최종 반영
    const inboundResult = await handleInventoryInbound({
      partnerName: partner_name,
      inboundDate: inbound_date,
      pdfFilePath: file_url,
      items: mappedItems
    }, timestamp);

    return NextResponse.json({
      success: true,
      message: inboundResult.message || '엑셀 자율 입고 처리가 성공적으로 완료되었습니다.',
      inboundId: inboundResult.inboundId
    });

  } catch (error: any) {
    console.error("POST /api/inventory/inbounds/excel-upload error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
