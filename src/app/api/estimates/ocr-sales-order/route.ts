import { NextResponse } from 'next/server';
import { fetchGeminiWithFallback } from '../../../../lib/gemini-fallback';
import { executeSQL, insertRows, queryTable } from '../../../../../egdesk-helpers';

export const maxDuration = 60; // 60초 타임아웃
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, error: '파일이 없습니다.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    // 1. DB에서 구글 AI 설정 정보 로드 및 Gemini Vision AI로 파싱
    const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    const apiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: '구글 AI API 키가 시스템에 등록되지 않았습니다. [시스템 설정 > AI 설정]에서 API 키를 먼저 등록해 주세요.'
      }, { status: 400 });
    }

    const modelRes = await queryTable('system_settings', { filters: { key: 'google_ai_model' } });
    const selectedModel = modelRes.rows && modelRes.rows.length > 0 && modelRes.rows[0].value
      ? modelRes.rows[0].value
      : 'gemini-3.5-flash';

    const prompt = `
당신은 B2B 전문 AI 수발주 오퍼레이터입니다.
다음 이미지는 바이어가 보내온 발주서(수주서)입니다.
이미지 내용을 바탕으로 아래 항목들을 정확히 추출하여 JSON 형식으로만 응답해 주세요. (Markdown 코드 블록 없이 순수 JSON만 반환)

{
  "supplier": {
    "company_name": "공급사 상호명(공급인)",
    "business_number": "공급사 사업자번호 (XXX-XX-XXXXX 형식)",
    "representative": "공급자 대표자 성명 (없으면 \"\")",
    "address": "공급자 주소 (없으면 \"\")"
  },
  "buyer": {
    "company_name": "공급받는자 상호명(발주처)",
    "business_number": "공급받는자 사업자번호 (XXX-XX-XXXXX 형식)",
    "representative": "공급받는자 대표자 성명 (없으면 \"\")",
    "address": "공급받는자 주소 (없으면 \"\")"
  },
  "picName": "담당자명",
  "picPhone": "담당자 연락처 (전화번호, 없으면 \"\")",
  "orderNo": "수주번호 또는 발주번호",
  "orderDate": "수주일 (YYYY-MM-DD 형식)",
  "deliveryDate": "납기일 (YYYY-MM-DD 형식)",
  "memo": "발주서 비고 및 특이사항 (없으면 \"\")",
  "items": [
    {
      "itemCode": "품목코드",
      "itemName": "품명",
      "spec": "규격",
      "quantity": 100, // 숫자만
      "unitPrice": 15000, // 숫자만
      "amount": 1500000 // 숫자만
    }
  ]
}
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    const response = await fetchGeminiWithFallback(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini OCR API 통신 실패: HTTP ${response.status}`);
    }

    const aiData = await response.json();
    const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    // AI 토큰 사용량 로깅
    try {
      const prompt_tokens = aiData.usageMetadata?.promptTokenCount || 0;
      const completion_tokens = aiData.usageMetadata?.candidatesTokenCount || 0;
      const total_tokens = aiData.usageMetadata?.totalTokenCount || (prompt_tokens + completion_tokens);
      const logId = `TKC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const logTime = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      await insertRows('ai_token_usage_logs', [{
        id: logId,
        model: selectedModel || 'gemini-3.5-flash',
        purpose: 'DIRECT_SO_OCR',
        prompt_tokens,
        completion_tokens,
        total_tokens,
        created_at: logTime
      }]);
    } catch (e: any) {
      console.error('AI 토큰 로깅 실패:', e.message);
    }

    let parsedData;
    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse Gemini response:', responseText);
      throw new Error('AI 분석 결과를 JSON으로 변환하는 데 실패했습니다.');
    }

    // 본사 프로필 로드 (기본값 차민수/(주)쿠스/731-81-02023)
    let myCompanyProfile = { companyName: '(주)쿠스', businessNumber: '731-81-02023' };
    try {
      const myCompanySetting = await queryTable('system_settings', { filters: { key: 'my_company_profile' } });
      if (myCompanySetting.rows && myCompanySetting.rows.length > 0) {
        const parsed = JSON.parse(myCompanySetting.rows[0].value);
        if (parsed.companyName) myCompanyProfile.companyName = parsed.companyName;
        if (parsed.businessNumber) myCompanyProfile.businessNumber = parsed.businessNumber;
      }
    } catch (e) {
      console.error('본사 정보 설정 조회 실패:', e);
    }

    const { orderNo, orderDate, deliveryDate, items, picName, picPhone } = parsedData;
    if (!items || items.length === 0) {
      throw new Error('품목을 인식하지 못했습니다.');
    }

    const myBizNum = myCompanyProfile.businessNumber.replace(/\D/g, '');
    const myCompName = myCompanyProfile.companyName.replace(/[^가-힣a-zA-Z0-9]/g, '');

    const supBiz = (parsedData.supplier?.business_number || '').replace(/\D/g, '');
    const supName = (parsedData.supplier?.company_name || '').replace(/[^가-힣a-zA-Z0-9]/g, '');

    const buyBiz = (parsedData.buyer?.business_number || '').replace(/\D/g, '');
    const buyName = (parsedData.buyer?.company_name || '').replace(/[^가-힣a-zA-Z0-9]/g, '');

    // 1단계: 자사 매칭 판별
    const isSupplierMyCompany = (supBiz && supBiz === myBizNum) ||
                                (supName && (supName.includes(myCompName) || myCompName.includes(supName)));
    const isBuyerMyCompany = (buyBiz && buyBiz === myBizNum) ||
                             (buyName && (buyName.includes(myCompName) || myCompName.includes(buyName)));

    let partnerName = '';
    let partnerBizNo = '';
    let partnerRepresentative = '';
    let partnerAddress = '';
    
    // 2단계: 자사 역할 비교를 통한 상대방 바이어 정보 추출
    if (isSupplierMyCompany) {
      partnerName = parsedData.buyer?.company_name || '';
      partnerBizNo = parsedData.buyer?.business_number || '';
      partnerRepresentative = parsedData.buyer?.representative || '';
      partnerAddress = parsedData.buyer?.address || '';
    } else if (isBuyerMyCompany) {
      partnerName = parsedData.supplier?.company_name || '';
      partnerBizNo = parsedData.supplier?.business_number || '';
      partnerRepresentative = parsedData.supplier?.representative || '';
      partnerAddress = parsedData.supplier?.address || '';
    } else {
      // 자사 정보가 둘 다 불일치하는 경우 (폴백)
      // 사용자 공식: "수주등록용 발주서일 경우 사업자번호가 있는 업체가 상대방 정보이다"
      const hasSupBiz = !!supBiz;
      const hasBuyBiz = !!buyBiz;

      if (hasBuyBiz && !hasSupBiz) {
        partnerName = parsedData.buyer?.company_name || '';
        partnerBizNo = parsedData.buyer?.business_number || '';
        partnerRepresentative = parsedData.buyer?.representative || '';
        partnerAddress = parsedData.buyer?.address || '';
      } else {
        partnerName = parsedData.supplier?.company_name || '';
        partnerBizNo = parsedData.supplier?.business_number || '';
        partnerRepresentative = parsedData.supplier?.representative || '';
        partnerAddress = parsedData.supplier?.address || '';
      }
    }

    if (!partnerName) {
      partnerName = parsedData.partnerName || '미확인 바이어';
    }

    // 총 금액 계산
    let total_amount = 0;
    const itemRows = items.map((item: any) => {
      const qty = parseInt(item.quantity) || 0;
      const price = parseInt(item.unitPrice) || 0;
      const amount = qty * price;
      total_amount += amount;

      return {
        item_code: item.itemCode || '',
        product_name: item.itemName || '',
        spec: item.spec || '',
        quantity: qty,
        unit_price: price,
        amount: amount
      };
    });

    // 2. 스키마 자동 마이그레이션 (필요한 컬럼이 없을 경우 대비)
    try {
      await executeSQL('ALTER TABLE crm_sales_orders ADD COLUMN client_order_no TEXT');
    } catch(e) {}
    try {
      await executeSQL('ALTER TABLE crm_sales_orders ADD COLUMN delivery_date TEXT');
    } catch(e) {}
    try {
      await executeSQL('ALTER TABLE crm_sales_orders ADD COLUMN customer_manager TEXT');
    } catch(e) {}
    try {
      await executeSQL('ALTER TABLE crm_estimates ADD COLUMN partner_manager TEXT');
    } catch(e) {}
    try {
      await executeSQL('ALTER TABLE crm_estimate_items ADD COLUMN item_code TEXT');
    } catch(e) {}
    try {
      await executeSQL('ALTER TABLE crm_estimate_items ADD COLUMN spec TEXT');
    } catch(e) {}

    const soId = `SO-${Date.now()}`;
    const tagsObj = {
      business_number: partnerBizNo || '',
      representative: partnerRepresentative || '',
      address: partnerAddress || '',
      document_number: orderNo || '',
      document_date: orderDate || '',
      document_memo: parsedData.memo || ''
    };

    // 3. 견적서 섀도우 생성 (crm_estimates)
    const estimateId = `EST-${Date.now()}`;
    const uuid = `EST-UUID-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    await insertRows('crm_estimates', [{
      type: 'OUTBOUND',
      direction_status: 'RECEIVED', // 보낸 견적서이나, 이미 수락된 상태로 처리
      partner_name: partnerName,
      partner_phone: picPhone || '',
      partner_manager: picName || '',
      total_amount,
      file_url: 'AI 발주서 다이렉트 자동 스캔',
      ai_parsed: 1,
      uuid,
      tags: JSON.stringify(tagsObj),
      sales_order_number: orderNo || soId,
      created_at: nowStr
    }]);

    // 실제 정수 id 가져오기
    const insertedEstRes = await queryTable('crm_estimates', { filters: { uuid }, limit: 1 });
    const insertedEst = insertedEstRes.rows && insertedEstRes.rows.length > 0 ? insertedEstRes.rows[0] : null;
    const realEstimateId = insertedEst ? String(insertedEst.id) : estimateId;

    // 4. 견적 품목 생성 (crm_estimate_items)
    const detailRows = itemRows.map((row: any, idx: number) => ({
      id: Date.now() + idx,
      estimate_id: realEstimateId,
      product_id: '',
      item_code: row.item_code,
      product_name: row.product_name,
      spec: row.spec,
      quantity: row.quantity,
      unit_price: row.unit_price,
      amount: row.amount
    }));
    await insertRows('crm_estimate_items', detailRows);

    // 5. 수주 마스터 생성 (crm_sales_orders)
    await insertRows('crm_sales_orders', [{
      id: soId,
      estimate_id: realEstimateId,
      client_order_no: orderNo || '',
      customer_name: partnerName,
      customer_phone: picPhone || '',
      customer_manager: picName || '',
      status: 'REGISTERED',
      total_amount: total_amount,
      delivery_date: deliveryDate || '',
      created_at: orderDate || nowStr
    }]);

    return NextResponse.json({
      success: true,
      message: '발주서 스캔 및 수주 등록이 완료되었습니다.',
      parsedData,
      estimateId,
      soId
    });

  } catch (error: any) {
    console.error('OCR Sales Order error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
