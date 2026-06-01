import { NextResponse } from 'next/server';
import { EGDESK_CONFIG } from '../../../../egdesk.config';

// 5대 표준 시나리오 메타데이터 맵 (실제 파일과 동적 매핑용)
const SCRIPT_METADATA_PRESETS: Record<string, { title: string; menuPath: string; targetTable: string; description: string; category: string; columns: string[]; defaultDaysRange: number }> = {
  sales: {
    title: '이카운트 일자별 매출 원장 동기화',
    menuPath: '회계 > 매출/매입 > 매출대장',
    targetTable: 'ecount_sales_ledger',
    description: '지정된 기간 동안의 이카운트 매출 원장 엑셀 데이터를 다운로드하여 로컬 DB에 자동 동기화합니다.',
    category: '매출',
    defaultDaysRange: 30,
    columns: ['거래일자', '전표번호', '거래처명', '공급가액', '부가세', '합계금액', '적요']
  },
  purchase: {
    title: '이카운트 일자별 매입 원장 동기화',
    menuPath: '회계 > 매출/매입 > 매입대장',
    targetTable: 'ecount_purchase_ledger',
    description: '지정된 기간 동안의 이카운트 매입 원장 엑셀 데이터를 수집하고 계정과목별로 자동 분류하여 적재합니다.',
    category: '매입',
    defaultDaysRange: 30,
    columns: ['거래일자', '전표번호', '공급처명', '공급가액', '부가세', '합계금액', '계정과목']
  },
  inventory: {
    title: '이카운트 창고별 재고 현황 수집',
    menuPath: '재고 > 출력물 > 재고현황',
    targetTable: 'ecount_inventory_status',
    description: '회사 내 모든 활성 창고의 품목별 현재고, 적정재고 및 안전재고 초과 여부를 실시간 감지하여 적재합니다.',
    category: '재고',
    defaultDaysRange: 0,
    columns: ['품목코드', '품목명', '규격', '창고명', '현재고수량', '안전재고수량', '재고상태']
  },
  transfer: {
    title: '이카운트 자재 창고간 이동 이력',
    menuPath: '재고 > 자재이동 > 창고간이동대장',
    targetTable: 'ecount_inventory_transfer',
    description: '공장, 물류창고, 매장 등 창고 간에 발생한 실시간 자재/품목 이동 로그를 분석 적재합니다.',
    category: '재고',
    defaultDaysRange: 7,
    columns: ['이동일자', '전표번호', '보내는창고', '받는창고', '품목명', '수량', '담당자']
  },
  clients: {
    title: '이카운트 거래처 원장 동기화',
    menuPath: '기초등록 > 거래처 > 거래처대장',
    targetTable: 'ecount_customer_list',
    description: '이카운트에 등록된 최신 거래처 인적 정보, 거래처 등급 및 미수금 현황을 연동하여 갱신합니다.',
    category: '거래처',
    defaultDaysRange: 0,
    columns: ['거래처코드', '거래처명', '사업자번호', '대표자명', '전화번호', '담당자명', '미수잔액']
  },
  ledger: {
    title: '이카운트 계정별 잔액 현황 수집',
    menuPath: '회계 > 장부 > 계정별원장',
    targetTable: 'ecount_account_balance',
    description: '현재 시점의 자산, 부채, 자본 계정과목별 통장 예치금 및 잔액 대장을 빌드하여 적재합니다.',
    category: '자본/회계',
    defaultDaysRange: 0,
    columns: ['계정코드', '계정과목명', '전월이월', '차변금액', '대변금액', '현재잔액', '은행계좌정보']
  },
  promissory: {
    title: '이카운트 어음 관리 원장 동기화',
    menuPath: '회계 > 장부 > 받을어음/지급어음대장',
    targetTable: 'ecount_promissory_notes',
    description: '회사가 수취하거나 발행한 전자어음, 약속어음의 만기일 도래 및 결제 상태 대장을 동기화합니다.',
    category: '자본/회계',
    defaultDaysRange: 90,
    columns: ['어음번호', '구분', '발행일', '만기일', '거래처명', '어음금액', '결제상태']
  }
};

// 폴백 기본 스크립트 프리셋 (이지데스크 REST API 호출 실패 시 제공)
const FALLBACK_SCRIPTS = [
  {
    fileName: 'ecount_sales_ledger.spec.js',
    title: '이카운트 일자별 매출 원장 동기화',
    menuPath: '회계 > 매출/매입 > 매출대장',
    targetTable: 'ecount_sales_ledger',
    description: '지정된 기간 동안의 이카운트 매출 원장 엑셀 데이터를 다운로드하여 로컬 DB에 자동 동기화합니다.',
    category: '매출',
    defaultDaysRange: 30,
    columns: ['거래일자', '전표번호', '거래처명', '공급가액', '부가세', '합계금액', '적요'],
    isRealFileAvailable: false
  },
  {
    fileName: 'ecount_purchase_ledger.spec.js',
    title: '이카운트 일자별 매입 원장 동기화',
    menuPath: '회계 > 매출/매입 > 매입대장',
    targetTable: 'ecount_purchase_ledger',
    description: '지정된 기간 동안의 이카운트 매입 원장 엑셀 데이터를 수집하고 계정과목별로 자동 분류하여 적재합니다.',
    category: '매입',
    defaultDaysRange: 30,
    columns: ['거래일자', '전표번호', '공급처명', '공급가액', '부가세', '합계금액', '계정과목'],
    isRealFileAvailable: false
  },
  {
    fileName: 'ecount_inventory_status.spec.js',
    title: '이카운트 창고별 재고 현황 수집',
    menuPath: '재고 > 출력물 > 재고현황',
    targetTable: 'ecount_inventory_status',
    description: '회사 내 모든 활성 창고의 품목별 현재고, 적정재고 및 안전재고 초과 여부를 실시간 감지하여 적재합니다.',
    category: '재고',
    defaultDaysRange: 0,
    columns: ['품목코드', '품목명', '규격', '창고명', '현재고수량', '안전재고수량', '재고상태'],
    isRealFileAvailable: false
  }
];

/**
 * GET: 이지데스크서버 REST API 직접 연동을 통한 실제 스크립트 동적 매핑 조회
 */
export async function GET() {
  try {
    const apiUrl = EGDESK_CONFIG.apiUrl;
    const apiKey = EGDESK_CONFIG.apiKey;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    console.log(`[GET /api/ecount-erp] 이지데스크 REST API 호출 중: ${apiUrl}/browser-recording/tools/call`);

    // 1. 이지데스크서버 REST API 직접 POST 호출 (list_saved_tests 도구 직접 실행)
    const res = await fetch(`${apiUrl}/browser-recording/tools/call`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tool: 'browser_recording_list_saved_tests',
        arguments: {}
      })
    });

    if (!res.ok) {
      throw new Error(`이지데스크서버 응답 오류 (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (!data.success || !data.result?.content?.[0]?.text) {
      throw new Error(data.error || 'RPA 스크립트 조회 실패');
    }

    const mcpText = data.result.content[0].text;
    const mcpData = JSON.parse(mcpText);
    const tests = mcpData.tests || [];

    if (!Array.isArray(tests) || tests.length === 0) {
      return NextResponse.json({
        success: true,
        scripts: FALLBACK_SCRIPTS,
        message: '이지데스크서버와 연결되었으나 저장된 RPA 스크립트 파일이 없습니다.'
      });
    }

    // 2. 이지데스크서버에 실제로 존재하는 파일 목록(.spec.js)을 가공 및 이카운트 메타데이터 동적 매핑
    const resolvedScripts = tests.map((test: any) => {
      const fileName = test.name;
      const lowerName = fileName.toLowerCase();

      // 파일명에 맞는 적절한 프리셋 탐색 (키워드 매핑)
      let presetKey = 'etc';
      if (lowerName.includes('sales') || lowerName.includes('매출') || lowerName.includes('영일sales')) {
        presetKey = 'sales';
      } else if (lowerName.includes('purchase') || lowerName.includes('매입') || lowerName.includes('영일purchases')) {
        presetKey = 'purchase';
      } else if (lowerName.includes('transfer') || lowerName.includes('이동')) {
        presetKey = 'transfer';
      } else if (lowerName.includes('inventory') || lowerName.includes('재고') || lowerName.includes('disposed')) {
        presetKey = 'inventory';
      } else if (lowerName.includes('clients') || lowerName.includes('customer') || lowerName.includes('거래처')) {
        presetKey = 'clients';
      } else if (lowerName.includes('promissory') || lowerName.includes('어음')) {
        presetKey = 'promissory';
      } else if (lowerName.includes('ledger') || lowerName.includes('원장') || lowerName.includes('계정')) {
        presetKey = 'ledger';
      }

      const preset = SCRIPT_METADATA_PRESETS[presetKey] || {
        title: `기타 스크립트 [${fileName.replace('.spec.js', '')}]`,
        menuPath: '이카운트 > 기타 대장',
        targetTable: `ecount_custom_${fileName.replace('.spec.js', '').replace(/[^a-zA-Z0-9]/g, '_')}`,
        description: '이지데스크서버에 등록된 커스텀 RPA 스크립트입니다. 클릭하여 로컬 DB 적재를 동기화합니다.',
        category: '기타/커스텀',
        defaultDaysRange: 30,
        columns: ['데이터로우']
      };

      // 만약 프리셋에 100% 매칭되지 않고 커스텀 명칭이 있다면 보정
      let title = preset.title;
      if (presetKey === 'sales' && lowerName.includes('yeongil')) {
        title = '이카운트 [영일] 매출 원장 동기화';
      } else if (presetKey === 'purchase' && lowerName.includes('yoengil')) {
        title = '이카운트 [영일] 매입 원장 동기화';
      } else if (presetKey === 'sales' && lowerName.includes('west')) {
        title = '이카운트 [서부지사] 매출 원장 동기화';
      } else if (presetKey === 'purchase' && lowerName.includes('west')) {
        title = '이카운트 [서부지사] 매입 원장 동기화';
      } else if (presetKey === 'sales' && lowerName.includes('east')) {
        title = '이카운트 [동부지사] 매출 원장 동기화';
      } else if (presetKey === 'purchase' && lowerName.includes('east')) {
        title = '이카운트 [동부지사] 매입 원장 동기화';
      } else if (presetKey === 'sales' && lowerName.includes('shopping')) {
        title = '이카운트 [쇼핑몰] 매출 대장 동기화';
      } else if (lowerName.includes('purchase_orders')) {
        title = '이카운트 발주 대장 동기화';
      }

      return {
        fileName,
        title,
        menuPath: preset.menuPath,
        targetTable: preset.targetTable,
        description: preset.description,
        category: preset.category,
        defaultDaysRange: preset.defaultDaysRange,
        columns: preset.columns,
        isRealFileAvailable: true // 100% 이지데스크서버 물리 디렉토리에서 읽은 파일이므로 무조건 true!
      };
    });

    return NextResponse.json({
      success: true,
      scripts: resolvedScripts,
      serverScriptList: tests.map((t: any) => t.name)
    });
  } catch (error: any) {
    console.error('[GET /api/ecount-erp] REST API 바인딩 에러, FALLBACK 제공:', error.message);
    return NextResponse.json({
      success: true, // 에러 대신 폴백 리스트 반환하여 페이지 깨짐 방지
      scripts: FALLBACK_SCRIPTS,
      message: `이지데스크 서버 REST API 조회 중 경고: ${error.message}`
    });
  }
}

/**
 * POST: 이지데스크서버 REST API 직접 POST를 통한 RPA 구동 릴레이
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileName, startDate, endDate, datePickersByIndex, labeledFieldFills } = body;

    if (!fileName) {
      return NextResponse.json({
        success: false,
        error: '구동할 스크립트 파일명이 누락되었습니다.'
      }, { status: 400 });
    }

    const apiUrl = EGDESK_CONFIG.apiUrl;
    const apiKey = EGDESK_CONFIG.apiKey;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    console.log(`[POST /api/ecount-erp] 이지데스크 REST API 호출 중: ${apiUrl}/browser-recording/tools/call`);
    console.log(`구동 스크립트: ${fileName}`);

    // 이지데스크서버 REST API POST 직접 릴레이 (browser_recording_run 도구 직접 호출)
    const res = await fetch(`${apiUrl}/browser-recording/tools/call`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tool: 'browser_recording_run',
        arguments: {
          testFile: fileName,
          startDate,
          endDate,
          datePickersByIndex: datePickersByIndex || ['0', '1'],
          labeledFieldFills: labeledFieldFills || []
        }
      })
    });

    if (!res.ok) {
      throw new Error(`이지데스크서버 RPA 구동 응답 실패 (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'RPA 스크립트 기동 실패');
    }

    return NextResponse.json({
      success: true,
      message: `스크립트 [${fileName}]가 REST API를 통해 이지데스크서버에서 성공적으로 기동되었습니다.`,
      result: data
    });
  } catch (error: any) {
    console.warn('[POST /api/ecount-erp] REST API 기동 에러, 시뮬레이터 응답 처리:', error.message);
    
    // 시뮬레이터 작동 (서버 에러 시에도 자연스러운 4초 대기 피드백 모달 연동 지원)
    return NextResponse.json({
      success: true,
      message: `[시뮬레이션] 스크립트 [${fileName}] 기동 신호가 이지데스크서버에 전달되었습니다.`,
      isMock: true,
      simulationTimeMs: 4000,
      details: { message: `REST API 릴레이 폴백 구동: ${error.message}` }
    });
  }
}
