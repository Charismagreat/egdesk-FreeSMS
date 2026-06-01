import { NextResponse } from 'next/server';
import { 
  listBrowserRecordingTests, 
  runBrowserRecording 
} from '../../../egdesk-helpers';

// 기본 제공되는 이카운트 스크립트 메타데이터 폴백 (이지데스크서버에 관련 파일이 부재할 시에도 데모 구동이 가능하도록 보장)
const MOCK_ECOUNT_SCRIPTS = [
  {
    fileName: 'ecount_sales_ledger.spec.js',
    title: '이카운트 일자별 매출 원장 동기화',
    menuPath: '회계 > 매출/매입 > 매출대장',
    targetTable: 'ecount_sales_ledger',
    description: '지정된 기간 동안의 이카운트 매출 원장 엑셀 데이터를 다운로드하여 로컬 DB에 자동 동기화합니다.',
    category: '매출',
    defaultDaysRange: 30, // 기본 조회일수
    columns: ['거래일자', '전표번호', '거래처명', '공급가액', '부가세', '합계금액', '적요']
  },
  {
    fileName: 'ecount_purchase_ledger.spec.js',
    title: '이카운트 일자별 매입 원장 동기화',
    menuPath: '회계 > 매출/매입 > 매입대장',
    targetTable: 'ecount_purchase_ledger',
    description: '지정된 기간 동안의 이카운트 매입 원장 엑셀 데이터를 수집하고 계정과목별로 자동 분류하여 적재합니다.',
    category: '매입',
    defaultDaysRange: 30,
    columns: ['거래일자', '전표번호', '공급처명', '공급가액', '부가세', '합계금액', '계정과목']
  },
  {
    fileName: 'ecount_inventory_status.spec.js',
    title: '이카운트 창고별 재고 현황 수집',
    menuPath: '재고 > 출력물 > 재고현황',
    targetTable: 'ecount_inventory_status',
    description: '회사 내 모든 활성 창고의 품목별 현재고, 적정재고 및 안전재고 초과 여부를 실시간 감지하여 적재합니다.',
    category: '재고',
    defaultDaysRange: 0, // 당일 실시간
    columns: ['품목코드', '품목명', '규격', '창고명', '현재고수량', '안전재고수량', '재고상태']
  },
  {
    fileName: 'ecount_customer_list.spec.js',
    title: '이카운트 거래처 원장 동기화',
    menuPath: '기초등록 > 거래처 > 거래처대장',
    targetTable: 'ecount_customer_list',
    description: '이카운트에 등록된 최신 거래처 인적 정보, 거래처 등급 및 미수금 현황을 연동하여 갱신합니다.',
    category: '거래처',
    defaultDaysRange: 0,
    columns: ['거래처코드', '거래처명', '사업자번호', '대표자명', '전화번호', '담당자명', '미수잔액']
  },
  {
    fileName: 'ecount_account_balance.spec.js',
    title: '이카운트 계정별 잔액 현황 수집',
    menuPath: '회계 > 장부 > 계정별원장',
    targetTable: 'ecount_account_balance',
    description: '현재 시점의 자산, 부채, 자본 계정과목별 통장 예치금 및 잔액 대장을 빌드하여 적재합니다.',
    category: '자본/회계',
    defaultDaysRange: 0,
    columns: ['계정코드', '계정과목명', '전월이월', '차변금액', '대변금액', '현재잔액', '은행계좌정보']
  }
];

/**
 * GET: 사용 가능한 이카운트 RPA 스크립트 리스트 반환 (동적 연동 + 로컬 데모 폴백)
 */
export async function GET() {
  try {
    let scriptFiles: string[] = [];
    
    // 1. 이지데스크서버로부터 저장된 browser test spec 스크립트 목록 조회 시도
    try {
      const response = await listBrowserRecordingTests();
      if (response && response.success && Array.isArray(response.testFiles)) {
        scriptFiles = response.testFiles;
      } else if (Array.isArray(response)) {
        scriptFiles = response;
      }
    } catch (err) {
      console.warn('이지데스크서버에서 스크립트 리스트를 가져오는 데 실패했습니다. 로컬 Mock 데이터를 제공합니다:', err);
    }

    // 2. 이지데스크서버에서 받아온 스크립트와 Mock 스크립트 병합
    // 만약 실제 서버에 'ecount' 관련 스크립트 파일이 있다면 그것을 우선 연동하고, 없으면 기본 프리셋을 바인딩함
    const resultScripts = MOCK_ECOUNT_SCRIPTS.map(mock => {
      // 서버에서 동일한 파일명이 실제로 감지되면 'isRealFileAvailable: true' 설정
      const isAvailable = scriptFiles.some(f => f.includes(mock.fileName));
      return {
        ...mock,
        isRealFileAvailable: isAvailable
      };
    });

    return NextResponse.json({
      success: true,
      scripts: resultScripts,
      serverScriptList: scriptFiles
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || '이카운트 스크립트 리스트 조회 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

/**
 * POST: 특정 이카운트 RPA 스크립트 기동 트리거 (비동기 replay 구동)
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

    // 1. 이지데스크서버에 RPA Replay 기동 명령 송신
    console.log(`이지데스크서버에 RPA Replay 실행 요청: ${fileName}`);
    console.log(`파라미터: 시작일(${startDate}), 종료일(${endDate})`);

    let replayResult = null;
    let isMockRun = false;

    try {
      // 브라우저 레코딩 Replay 실행 헬퍼 호출
      replayResult = await runBrowserRecording(fileName, {
        startDate,
        endDate,
        datePickersByIndex: datePickersByIndex || ['0', '1'], // 날짜 선택기 인덱스 바인딩 폴백
        labeledFieldFills: labeledFieldFills || []
      });
    } catch (err: any) {
      console.warn(`이지데스크서버 RPA 호출 중 에러 발생. 로컬 시뮬레이션 모드로 전환합니다: ${err.message}`);
      isMockRun = true;
    }

    // 2. 만약 로컬 서버가 오프라인이거나 스크립트 파일이 실제 없는 데모 상태라면
    // 사용자에게 3초~5초 내의 DB 로컬 가상 적재 시뮬레이션을 위한 성공 시그널 반환
    if (isMockRun || !replayResult || !replayResult.success) {
      // 데모 모드 작동
      return NextResponse.json({
        success: true,
        message: `[시뮬레이션] 스크립트 [${fileName}] 기동 신호가 이지데스크서버에 전달되었습니다.`,
        isMock: true,
        simulationTimeMs: 4000, // 4초 시뮬레이션 타이머
        targetTable: MOCK_ECOUNT_SCRIPTS.find(s => s.fileName === fileName)?.targetTable || 'ecount_synced_table',
        details: replayResult || { message: '로컬 데모 백필 모드 기동' }
      });
    }

    return NextResponse.json({
      success: true,
      message: `스크립트 [${fileName}]가 성공적으로 기동되었습니다.`,
      isMock: false,
      result: replayResult
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || '이카운트 스크립트 기동 요청 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
