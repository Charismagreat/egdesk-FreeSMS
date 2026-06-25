import { NextResponse } from 'next/server';
import { fetchGeminiWithFallback } from '../../../../lib/gemini-fallback';
import { executeSQL, insertRows, queryTable, listBusinessIdentitySnapshots, listKnowledgeDocuments, getKnowledgeDocument } from '../../../../../egdesk-helpers';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';

// 최고 관리자(SUPER_ADMIN/PRESIDENT) 권한 검증 헬퍼
async function verifyAdminRole() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return { isAuthorized: false, role: 'SUB_OPERATOR', username: '' };
  try {
    const payload = decodeJwt(token);
    const role = (payload.role as string || '').toUpperCase();
    const username = payload.username as string || '';
    const isAuthorized = role === 'SUPER_ADMIN' || role === 'PRESIDENT';
    return { isAuthorized, role, username };
  } catch {
    return { isAuthorized: false, role: 'SUB_OPERATOR', username: '' };
  }
}

export const maxDuration = 60; // 60초 타임아웃
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'analyze';

    if (action === 'save') {
      const body = await req.json();
      const { 
        partner_name, partner_phone, partner_manager, items = [], file_url, 
        business_number, representative, address, document_number, document_date, 
        delivery_date, document_memo, approvers = [],
        force_bypass = false, bypass_reason = ''
      } = body;

      const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

      let bypassApprovedBy = '';
      if (force_bypass) {
        const auth = await verifyAdminRole();
        if (!auth.isAuthorized) {
          return NextResponse.json({ success: false, error: '🔒 권한 차단: 수신인 불일치 문서의 강제 등록 승인은 최고관리자(SUPER_ADMIN)만 가능합니다.' }, { status: 403 });
        }
        bypassApprovedBy = auth.username || auth.role;
      }

      const soId = `SO-${Date.now()}`;
      const nowObj = new Date();
      const yy = String(nowObj.getFullYear()).slice(-2);
      const mm = String(nowObj.getMonth() + 1).padStart(2, '0');
      const dd = String(nowObj.getDate()).padStart(2, '0');
      const hh = String(nowObj.getHours()).padStart(2, '0');
      const min = String(nowObj.getMinutes()).padStart(2, '0');
      const ss = String(nowObj.getSeconds()).padStart(2, '0');
      const estimateId = `ORD-${yy}${mm}${dd}-${hh}${min}${ss}`;
      const uuid = `ORD-UUID-${yy}${mm}${dd}-${hh}${min}${ss}-${Math.random().toString(36).substring(2, 9)}`;

      const tagsObj: any = {
        business_number: business_number || '',
        representative: representative || '',
        address: address || '',
        document_number: document_number || '',
        document_date: document_date || '',
        document_memo: document_memo || '',
        delivery_date: delivery_date || '',
        approvers: approvers || []
      };

      if (force_bypass) {
        tagsObj.bypass_matching = true;
        tagsObj.bypass_approved_by = bypassApprovedBy;
        tagsObj.bypass_reason = bypass_reason;
      }

      const resEst = await insertRows('crm_estimates', [{
        id: estimateId,
        type: 'OUTBOUND',
        direction_status: 'RECEIVED',
        partner_name,
        partner_phone: partner_phone || '',
        partner_manager: partner_manager || '',
        total_amount: items.reduce((acc: number, curr: any) => acc + (curr.quantity * curr.unit_price), 0),
        file_url: file_url || '',
        ai_parsed: 1,
        uuid,
        tags: JSON.stringify(tagsObj),
        sales_order_number: document_number || soId,
        created_at: nowStr
      }]);

      if (!resEst.success) {
        throw new Error('견적서 섀도우 적재에 실패했습니다.');
      }

      const insertedEstRes = await queryTable('crm_estimates', { filters: { uuid }, limit: 1 });
      const insertedEst = insertedEstRes.rows && insertedEstRes.rows.length > 0 ? insertedEstRes.rows[0] : null;
      const realEstimateId = insertedEst ? String(insertedEst.id) : estimateId;

      const detailRows = items.map((row: any, idx: number) => ({
        id: Date.now() + idx,
        estimate_id: realEstimateId,
        product_id: '',
        item_code: row.item_code || '',
        product_name: row.product_name,
        spec: row.spec || '',
        quantity: row.quantity,
        unit_price: row.unit_price,
        amount: row.quantity * row.unit_price,
        delivery_date: row.delivery_date || '',
        valid_item_code: row.valid_item_code || ''
      }));
      await insertRows('crm_estimate_items', detailRows);

      await insertRows('crm_sales_orders', [{
        id: soId,
        estimate_id: realEstimateId,
        client_order_no: document_number || '',
        customer_name: partner_name,
        customer_phone: partner_phone || '',
        customer_manager: partner_manager || '',
        status: 'REGISTERED',
        total_amount: items.reduce((acc: number, curr: any) => acc + (curr.quantity * curr.unit_price), 0),
        delivery_date: delivery_date || '',
        order_date: document_date 
          ? (document_date.trim().replace(/[\.\/]/g, '-').length === 10 
              ? `${document_date.trim().replace(/[\.\/]/g, '-')} ${nowStr.substring(11)}` 
              : document_date.trim().replace(/[\.\/]/g, '-'))
          : nowStr,
        created_at: nowStr
      }]);

      return NextResponse.json({
        success: true,
        message: '발주서 스캔 및 수주 등록이 완료되었습니다.',
        estimateId: realEstimateId,
        soId
      });
    }

    const data = await req.formData();
    const file = data.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, error: '파일이 없습니다.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const fileDataUri = `data:${mimeType};base64,${base64Image}`;

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

    // RAG 지식 규정 마이닝
    let rlsRulesText = '';
    try {
      let snapshotId = 'default_snapshot';
      const snapshotListRes = await listBusinessIdentitySnapshots();
      const snapshots = snapshotListRes?.snapshots || snapshotListRes || [];
      if (snapshots && snapshots.length > 0) {
        snapshotId = snapshots[0].id || snapshots[0].uuid || snapshotId;
      }
      
      const docsRes = await listKnowledgeDocuments(snapshotId);
      const rawDocs = docsRes?.documents || docsRes || [];
      
      const fullDocs = await Promise.all(
        rawDocs.map(async (d: any) => {
          const docId = d.id || d.document_id || d.uuid;
          if (!d.content && docId) {
            try {
              const detail = await getKnowledgeDocument(docId);
              return { ...d, ...detail };
            } catch (e) {
              return d;
            }
          }
          return d;
        })
      );

      // 승인된 문서 중 '품목코드' 또는 '유효' 등의 키워드가 포함된 문서를 RAG 컨텍스트로 취합
      const approvedRules = fullDocs.filter((d: any) => {
        const contentStr = d.content || '';
        const isApproved = contentStr.includes('**결재상태**: APPROVED') || contentStr.includes('**결재상태**: APPROVED_AUTO') || d.status === 'APPROVED' || d.status === 'APPROVED_AUTO';
        const hasKeyword = contentStr.includes('품목코드') || contentStr.includes('유효') || contentStr.includes('추출') || d.title.includes('품목') || d.title.includes('코드');
        return isApproved && hasKeyword;
      });

      if (approvedRules.length > 0) {
        rlsRulesText = approvedRules.map((d: any, idx: number) => {
          const content = d.content || '';
          const dividerIndex = content.lastIndexOf('\n\n--- \n*   **작성자**:');
          const cleanBody = dividerIndex !== -1 ? content.substring(0, dividerIndex).trim() : content;
          return `[지식규칙 #${idx + 1}] ${d.title}\n${cleanBody}`;
        }).join('\n\n');
      }
    } catch (e) {
      console.error('RAG 지식 마이닝 실패:', e);
    }

    const prompt = `
당신은 B2B 전문 AI 수발주 오퍼레이터입니다.
다음 이미지는 바이어가 보내온 발주서(수주서) 문서입니다.
이미지 내용을 꼼꼼하게 판독하여 아래 항목들을 정확히 추출한 뒤 JSON 형식으로만 응답해 주세요. (Markdown 코드 블록 없이 순수 JSON만 반환)

### 📌 데이터 추출 및 정제 지침:
1. **품목코드 (itemCode)**:
   - 발주서 표에서 품목코드, 자재코드, 도번, 형번, 모델번호(Model No.), 파트번호(Part No.) 등이 기재되어 있는 열을 찾아 그 값을 추출하십시오.
   - 아예 존재하지 않는 경우에만 빈 문자열("")로 둡니다.

2. **품명 (itemName)**:
   - 발주서 상에서 품목의 명칭이나 이름을 추출하십시오.
   - **[중요 - 표 헤더 레이블 혼입 금지]**: 품명을 추출하거나 구성할 때, 문서의 표 헤더 명칭(예: '품목코드', '코드', '도번', '품명', '품목명', 'No', 'Model' 등) 자체가 품명 텍스트에 접두사나 접미사로 섞여 들어가지 않도록 철저히 배제해 주십시오. (예: '품목코드 049/X560014' 형태로 추출하지 말고, '품목코드' 문구를 제거한 '049/X560014' 형태로 추출하십시오.)
   - 만약 품명(itemName)과 코드(예: SUS-304-T10, A100-B200 등)가 한 셀에 병합되어 적혀 있다면, 규칙성 있는 모델코드 부분을 분리하여 itemCode에 기재하고, 명칭은 itemName으로 분리하십시오.
   - 품명 컬럼이 아예 존재하지 않아 코드값만 기재된 경우에는 '품목코드' 등의 헤더 텍스트 없이 해당 품목코드의 텍스트 자체(예: "049/X560014")만을 itemName에 기재하십시오.

3. **규격 (spec)**:
   - 품목의 사이즈, 규격, 사양, 두께, 재질, 용량, 외경(예: 150A, 10T, 300*400*20, SUS304 등)이 명시된 텍스트를 정확하게 추출하십시오.
   - 품명(itemName)이나 품목코드에 규격 정보가 섞여 있는 경우가 많습니다. (예: "아세탈 판재 10T 500*500" -> 품명: "아세탈 판재", 규격: "10T 500*500"으로 분리하여 추출)

4. **납기일 (deliveryDate) 및 수주일 (orderDate)**:
   - 문서 상단부나 비고란 혹은 품목별 행(row)에 표기된 날짜를 추출하십시오.
   - 행별 납기일이 공란이거나 명시되지 않은 경우, 문서 전체의 기준 납기일(마스터 납기일, 예: "납기: 2026.06.30", "납기일자: 2026/06/30")을 모든 품목의 deliveryDate에 복사하여 채워 넣으십시오.
   - 날짜는 "26년 6월 30일", "26.06.30", "2026/06/30" 등 다양한 표기 형식을 감지하여 반드시 표준 ISO 형식인 "YYYY-MM-DD" 형태로 정규화하여 출력하십시오. (예: 2026-06-30)
   - **[중요 - 필기체 획 판독 주의 지침]**:
     * 이미지 표에 손글씨(필기체)로 작성된 날짜(예: '11/05')에서 슬래시(/) 앞뒤 숫자를 판독할 때, 획의 기울기와 형태를 고도로 세밀히 분석하여 '11'을 '01'로, 또는 '01'을 '11'로 오독하지 않도록 철저히 주의하십시오. 특히 획이 두 번 그어진 11월('11/05')은 절대 1월('01/05')로 오독해서는 안 됩니다.
   - **[중요 - 지능형 연도 추론 지침]**:
     * 연도 표기가 생략되어 월/일만 표기된 경우(예: '11/05'), 문서 작성일(수주일, orderDate)의 연도를 기준으로 연도를 매핑해야 합니다.
     * 문서 작성일(예: 2025-10-29) 기준으로 납기가 당해 연도 내에 도래하는 경우(예: 11월 5일은 작성일인 10월 29일과 비교해 당해 연도 내인 11월이므로), 연도를 가산하지 말고 당해 연도(2025-11-05)를 그대로 부여하십시오.
     * 작성일보다 납기 월이 이전 달(예: 작성일은 10월인데 납기가 1월인 경우)이어서 해를 넘어가야 하는 경우에만 연도에 +1년을 하십시오. (예: 작성일 2025-10-29, 납기일 01/05 -> 2026-01-05)
     * 당해 연도 내에 있는 납기(예: 10월 작성, 11월 납기)를 임의로 다음 해로 넘겨 판독(예: 2026-11-05)하지 마십시오.

5. **수량/단가/금액 (quantity, unitPrice, amount)**:
   - 쉼표(,), 원화 기호(₩), 통화 기호 등은 모두 제외하고 순수 숫자 정수형태로만 추출하십시오.

6. **유효품목코드 (validItemCode)**:
${rlsRulesText ? `
   - 다음은 승인된 사내 지식에 근거한 품목코드 변환 규정입니다. 아래 규칙을 엄격히 적용하여 유효품목코드를 판단 및 추출해 주십시오.
${rlsRulesText}
   - 규칙에 부합하는 코드가 식별될 경우 'validItemCode' 필드에 기재하고, 발견되지 않으면 빈 문자열("")로 기재하십시오.
` : `
   - 각 품목의 품명(itemName), 규격(spec), 비고란 등을 탐색하여 "X로 시작하고 뒤에 6자리 숫자로 구성된 패턴" (예: X123456)을 지닌 사내 실제 품목코드가 발견될 경우, 이를 validItemCode 필드에 기재해 주십시오. 발견되지 않으면 빈 문자열("")을 반환하십시오.
`}

6. **주체 판별 용어 대응 및 담당자 구획 독립 추출 (supplier / buyer)**:
   - 문서상에서 공급인 측을 지칭하는 다양한 용어("공급인", "공급자", "공급사", "판매자", "매도인", "수탁자" 등) 및 **"수주처"**(주문을 받아 납품하는 자)는 모두 'supplier' 객체에 담으십시오. (예: 표에 '수주처'로 기재된 상호는 supplier에 매핑되어야 합니다)
   - 문서상에서 공급받는자 측을 지칭하는 다양한 용어("공급받는자", "발주사", "발주처", "바이어", "구매처", "매수인", "위탁자" 등) 및 **"발주처"**(주문을 넣어 발주하는 자, 바이어)는 모두 'buyer' 객체에 담으십시오. (예: 표에 '발주처'로 기재된 상호는 buyer에 매핑되어야 합니다)
   - **이 둘(수주처/발주처)을 절대 혼동하여 거꾸로 대입하지 마십시오.**
   - **담당자 텍스트 단독 기재 대응**: 각 업체의 '담당자' 또는 '담당' 열이나 영역에 이름만 단독으로 기재되어 있고 연락처가 기재되어 있지 않더라도(예: "홍길동" 단독 기재), 절대 누락하지 말고 각 소속 업체의 'manager_name' 필드에 정확히 담아 반환하십시오.
   - **공급인/구매인 담당자 교차 오인 방지**: 눈에 띄는 특정 업체의 담당자 정보(예: 연락처가 있는 "이영희")를 연락처가 없는 다른 쪽 업체의 담당자 정보 자리에 교차 대입하거나 덮어써서는 안 됩니다. 수주처(supplier)와 발주처(buyer)의 담당자 정보는 상호 간에 철저하게 독립된 소속 구획(표 상의 열/행 구획) 내에서만 분리하여 매핑하십시오.

7. **비고 및 결재선 정보 상세 추출**:
   - **비고 (memo)**:
     * 이미지 하단의 "NOTE." 구역이나 비고/특이사항 구역에 번호(예: 1~6번)로 기술된 지불조건, 납품/입고 절차, 소재사급 손실변제처리, 도면 접수일자 확인 등의 모든 비고 본문 텍스트를 추출하십시오.
     * **[중요 - 임의 요약, 문장 보정 및 타 영역 문구 혼입 절대 금지]**: 
       - 이미지 속의 비고 문구를 절대 요약하거나, 임의로 단어를 누락/수정하거나, 문맥을 가다듬어 다르게 표현하지 마십시오.
       - 이미지의 특정 번호 항목을 판독할 때, 다른 번호 항목의 단어나 구절이 섞여 들어가 합성(환각)되는 일이 절대 없어야 합니다. 오직 해당 번호 줄에 기재되어 있는 글자들만 순수하게 판독하십시오.
       - 문서에 인쇄된 글자 그대로, 띄어쓰기 및 줄바꿈(\n)을 100% 정확하게 일치시켜 원본 텍스트 그대로 받아쓰기(Transcription) 하여 'memo' 필드에 담아 주십시오.
       - 실제 문서에 적혀 있지 않은 일반적인 규정이나 예시 텍스트의 규정을 마음대로 임의 작성(환각)하여 갈음해서는 절대 안 됩니다.
   - **결재자 목록 (approvers)**: 이미지 하단 우측이나 상단 우측 등의 결재선 구역(검토, 검사, 결재 등의 도장이 찍혀 있거나 서명 칸이 있는 곳)에 기재된 결재자들의 성명(예: "홍종현", "이영희")을 모두 판독하여 'approvers' 배열에 문자열 목록으로 담아 반환하십시오. 결재선에 이름이 없거나 발견되지 않을 경우에만 빈 배열([])을 입력하십시오.

8. **일반 전화번호와 팩스(FAX) 번호의 엄격한 분리 및 팩스 제외 지침**:
   - 각 주체(supplier / buyer)의 구획이나 담당자 연락처 영역에 **회사 대표 전화번호와 팩스(FAX) 번호가 동시에 존재하거나 둘 다 기재된 경우, 팩스 번호는 절대 추출하지 마십시오.**
   - 팩스 번호가 전화번호 필드('phone', 'manager_phone', 'picPhone')에 잘못 매핑되지 않도록, 주변 텍스트에 "FAX", "팩스", "F.", "F" 등의 접두사가 붙은 번호는 철저히 배제하고, "TEL", "전화", "T.", "HP", "휴대폰" 또는 접두사 없이 일반적인 유선/무선 번호 형식으로 된 **회사 일반 대표전화 및 담당자 휴대폰 번호만을 선택하여 매핑**하십시오.

### 📝 판독 예시 (Few-shot Guide):
1. **담당자 및 주체 판별 매핑 예시 (실제 회사명 편향을 차단하기 위한 가상 정보 예시)**:
   - 공급사(수주처) 구획: 상호: (주)에이비씨상사, 대표자: 김철수, 담당자: 이영희(010-9999-8888)
   - 바이어(발주처) 구획: 상호: (주)엑스와이젯바이어, 대표자: 박영수, 담당자: 홍길동, 대표전화번호: 02-123-4567
   ➔ 이 경우 결과 매핑은 반드시 다음과 같아야 합니다:
     * 'supplier' 객체:
       "company_name": "(주)에이비씨상사" (수주처이므로 supplier에 해당)
       "representative": "김철수"
       "manager_name": "이영희"
       "manager_phone": "010-9999-8888"
     * 'buyer' 객체:
       "company_name": "(주)엑스와이젯바이어" (발주처/바이어이므로 buyer에 해당)
       "representative": "박영수"
       "phone": "02-123-4567"
       "manager_name": "홍길동" (연락처 없이 이름만 단독 기재되어 있어도 절대 누락하지 않고 추출함)
       "manager_phone": "02-123-4567" (개인 연락처가 비어 있으므로 회사 대표전화로 매핑 또는 공란)
     * "picName": "홍길동" (문서 전체의 대표 바이어측 실무 담당자)
     * "picPhone": "02-123-4567"

2. **비고(memo) 줄바꿈 및 원본 무결성 전사 예시**:
   - 문서 내에 아래와 같이 NOTE가 적혀 있는 경우:
     "특기사항
     1. 납기 준수 요망.
     2. 불량 발생 시 신속히 유선 연락 바랍니다."
   - ➔ 결과 JSON의 'memo' 필드는 임의로 수식어를 생략하거나 줄을 섞지 않고 줄바꿈('\n')을 포함해 다음과 같아야 합니다:
     "1. 납기 준수 요망.\n2. 불량 발생 시 신속히 유선 연락 바랍니다."
   - **[경고 - 예시 복제 및 RAG 환각 절대 금지]**: 본 예시에 적혀 있는 '납기 준수 요망', '불량 발생 시...' 및 사내 RAG 문서 속의 '소재사급', '마감처리', '도면상의 당사 접수 도장' 등 **실제 분석 대상 이미지에 기재되어 있지 않은 임의의 문구를 실제 결과의 'memo' 필드에 합성(환각)하여 섞어 넣는 일을 엄격히 금지합니다.** 반드시 실제 입력 이미지에 존재하는 텍스트만 100% 원본 그대로 받아쓰기(Transcription) 하십시오.

JSON 응답 포맷:
{
  "supplier": {
    "company_name": "공급 주체 상호명 (공급인/공급사/공급자/판매자 등)",
    "business_number": "공급 주체 사업자번호 (XXX-XX-XXXXX 형식)",
    "representative": "공급 주체 대표자 성명 (없으면 \"\")",
    "address": "공급 주체 주소 (없으면 \"\")",
    "phone": "공급 주체 회사 대표 전화번호 (팩스 번호 제외, 없으면 \"\")",
    "manager_name": "공급 주체 담당자명 (없으면 \"\")",
    "manager_phone": "공급 주체 담당자 연락처 (팩스 번호 제외, 일반 전화/휴대폰 우선, 없으면 \"\")"
  },
  "buyer": {
    "company_name": "구매/발주 주체 상호명 (공급받는자/발주사/발주처/바이어 등)",
    "business_number": "구매/발주 주체 사업자번호 (XXX-XX-XXXXX 형식)",
    "representative": "구매/발주 주체 대표자 성명 (없으면 \"\")",
    "address": "구매/발주 주체 주소 (없으면 \"\")",
    "phone": "구매/발주 주체 회사 대표 전화번호 (팩스 번호 제외, 없으면 \"\")",
    "manager_name": "구매/발주 주체 담당자명 (없으면 \"\")",
    "manager_phone": "구매/발주 주체 담당자 연락처 (팩스 번호 제외, 일반 전화/휴대폰 우선, 없으면 \"\")"
  },
  "picName": "문서 전체 대표 담당자명",
  "picPhone": "문서 전체 대표 담당자 연락처 (전화번호, 팩스 번호 제외, 없으면 \"\")",
  "orderNo": "수주번호 또는 발주번호",
  "orderDate": "수주일 (YYYY-MM-DD 형식)",
  "deliveryDate": "납기일 (YYYY-MM-DD 형식)",
  "memo": "발주서 비고 및 특이사항 (NOTE. 구역의 1~6번 본문 전체 텍스트)",
  "approvers": ["결재선 또는 도장 내 성명 목록 (예: 홍종현, 이주용) (없으면 [])"],
  "items": [
    {
      "itemCode": "품목코드",
      "itemName": "품명",
      "spec": "규격",
      "quantity": 100,
      "unitPrice": 15000,
      "amount": 1500000,
      "deliveryDate": "품목별 납기일 (YYYY-MM-DD 형식)"
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

    // 회사명에서 법인 유형(주식회사, (주) 등) 및 특수문자를 제거하여 순수 상호명만 추출하는 헬퍼 함수
    const cleanCompanyName = (name: string): string => {
      if (!name) return '';
      return name
        .replace(/\(주\)/g, '')
        .replace(/주식회사/g, '')
        .replace(/\(유\)/g, '')
        .replace(/유한회사/g, '')
        .replace(/\(합\)/g, '')
        .replace(/합자회사/g, '')
        .replace(/[^가-힣a-zA-Z0-9]/g, '');
    };

    const myBizNum = myCompanyProfile.businessNumber.replace(/\D/g, '');
    const myCompName = cleanCompanyName(myCompanyProfile.companyName);

    const supBiz = (parsedData.supplier?.business_number || '').replace(/\D/g, '');
    const supName = cleanCompanyName(parsedData.supplier?.company_name || '');

    const buyBiz = (parsedData.buyer?.business_number || '').replace(/\D/g, '');
    const buyName = cleanCompanyName(parsedData.buyer?.company_name || '');

    // 1단계: 자사 매칭 판별
    const isSupplierMyCompany = (supBiz && supBiz === myBizNum) ||
                                (supName && (supName.includes(myCompName) || myCompName.includes(supName)));
    const isBuyerMyCompany = (buyBiz && buyBiz === myBizNum) ||
                             (buyName && (buyName.includes(myCompName) || myCompName.includes(buyName)));

    let partnerName = '';
    let partnerBizNo = '';
    let partnerRepresentative = '';
    let partnerAddress = '';
    let partnerManager = '';
    let partnerPhone = '';
    
    // 2단계: 자사 역할 비교를 통한 상대방 바이어 정보 추출
    if (isSupplierMyCompany) {
      partnerName = parsedData.buyer?.company_name || '';
      partnerBizNo = parsedData.buyer?.business_number || '';
      partnerRepresentative = parsedData.buyer?.representative || '';
      partnerAddress = parsedData.buyer?.address || '';
      
      // 공급사(자사) 담당자 정보가 picName/picPhone과 겹치면 상대방 정보로 차용하지 않음 (교차 오염 방지)
      const isPicBelongsToSupplier = 
        (parsedData.supplier?.manager_name && parsedData.supplier?.manager_name === picName) ||
        (parsedData.supplier?.manager_phone && parsedData.supplier?.manager_phone === picPhone);

      partnerManager = parsedData.buyer?.manager_name || (isPicBelongsToSupplier ? '' : picName) || '';
      partnerPhone = parsedData.buyer?.manager_phone || parsedData.buyer?.phone || (isPicBelongsToSupplier ? '' : picPhone) || '';
    } else if (isBuyerMyCompany) {
      partnerName = parsedData.supplier?.company_name || '';
      partnerBizNo = parsedData.supplier?.business_number || '';
      partnerRepresentative = parsedData.supplier?.representative || '';
      partnerAddress = parsedData.supplier?.address || '';

      // 바이어(자사) 담당자 정보가 picName/picPhone과 겹치면 상대방 정보로 차용하지 않음
      const isPicBelongsToBuyer = 
        (parsedData.buyer?.manager_name && parsedData.buyer?.manager_name === picName) ||
        (parsedData.buyer?.manager_phone && parsedData.buyer?.manager_phone === picPhone);

      partnerManager = parsedData.supplier?.manager_name || (isPicBelongsToBuyer ? '' : picName) || '';
      partnerPhone = parsedData.supplier?.manager_phone || parsedData.supplier?.phone || (isPicBelongsToBuyer ? '' : picPhone) || '';
    } else {
      // 자사 정보가 둘 다 불일치하는 경우 (폴백)
      const hasSupBiz = !!supBiz;
      const hasBuyBiz = !!buyBiz;

      // 수주등록용 API이므로 기본 상대방(바이어)은 발주처(buyer)입니다.
      if (hasSupBiz && !hasBuyBiz) {
        partnerName = parsedData.supplier?.company_name || '';
        partnerBizNo = parsedData.supplier?.business_number || '';
        partnerRepresentative = parsedData.supplier?.representative || '';
        partnerAddress = parsedData.supplier?.address || '';

        // 상대방이 공급사이므로, 발주사(buyer) 담당자 정보가 picName/picPhone과 겹치면 차용하지 않음
        const isPicBelongsToBuyer = 
          (parsedData.buyer?.manager_name && parsedData.buyer?.manager_name === picName) ||
          (parsedData.buyer?.manager_phone && parsedData.buyer?.manager_phone === picPhone);

        partnerManager = parsedData.supplier?.manager_name || (isPicBelongsToBuyer ? '' : picName) || '';
        partnerPhone = parsedData.supplier?.manager_phone || parsedData.supplier?.phone || (isPicBelongsToBuyer ? '' : picPhone) || '';
      } else {
        partnerName = parsedData.buyer?.company_name || '';
        partnerBizNo = parsedData.buyer?.business_number || '';
        partnerRepresentative = parsedData.buyer?.representative || '';
        partnerAddress = parsedData.buyer?.address || '';

        // 상대방이 발주사(buyer)이므로, 공급사(supplier) 담당자 정보가 picName/picPhone과 겹치면 차용하지 않음
        const isPicBelongsToSupplier = 
          (parsedData.supplier?.manager_name && parsedData.supplier?.manager_name === picName) ||
          (parsedData.supplier?.manager_phone && parsedData.supplier?.manager_phone === picPhone);

        partnerManager = parsedData.buyer?.manager_name || (isPicBelongsToSupplier ? '' : picName) || '';
        partnerPhone = parsedData.buyer?.manager_phone || parsedData.buyer?.phone || (isPicBelongsToSupplier ? '' : picPhone) || '';
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
        amount: amount,
        delivery_date: item.deliveryDate || deliveryDate || '', // 품목별 개별 납기일이 파싱되면 쓰고, 없으면 마스터 납기일 폴백
        valid_item_code: item.validItemCode || ''
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
    try {
      await executeSQL('ALTER TABLE crm_estimate_items ADD COLUMN delivery_date TEXT');
    } catch(e) {}

    const bypassCheckRes = await queryTable('system_settings', { filters: { key: 'bypass_ocr_receiver_check' } });
    const bypassCheck = bypassCheckRes.rows && bypassCheckRes.rows.length > 0 ? bypassCheckRes.rows[0].value : '0';
    const receiverMatched = (bypassCheck === '1') ? true : (isSupplierMyCompany || isBuyerMyCompany);
    return NextResponse.json({
      success: true,
      receiver_matched: receiverMatched,
      my_company_name: myCompanyProfile.companyName,
      partner_name: partnerName,
      partner_phone: partnerPhone || '',
      partner_manager: partnerManager || '',
      business_number: partnerBizNo,
      representative: partnerRepresentative,
      address: partnerAddress,
      document_number: orderNo || '',
      document_date: orderDate || '',
      delivery_date: deliveryDate || '',
      document_memo: parsedData.memo || '',
      approvers: parsedData.approvers || [],
      items: itemRows,
      file_url: fileDataUri
    });

  } catch (error: any) {

    console.error('OCR Sales Order error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
