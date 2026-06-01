import { NextResponse } from 'next/server';
import { 
  queryTable, 
  insertRows, 
  updateRows, 
  createTable, 
  listTables,
  executeSQL
} from '../../../../egdesk-helpers';

/**
 * 데이터베이스 초기화 및 샘플 데이터 씨딩 (Self-Healing & Seeding)
 */
async function initializeDatabase() {
  try {
    const tables = await listTables();
    const tableNames = tables.map((t: any) => t.tableName || t.name);

    // 1. knowledge_documents 테이블 생성 (부재 시)
    if (!tableNames.includes('knowledge_documents')) {
      await createTable(
        '사내 지식 문서 마스터',
        [
          { name: 'document_id', type: 'TEXT', notNull: true },
          { name: 'title', type: 'TEXT', notNull: true },
          { name: 'doc_type', type: 'TEXT', notNull: true },
          { name: 'file_path', type: 'TEXT' },
          { name: 'thumbnail_path', type: 'TEXT' },
          { name: 'creator_id', type: 'TEXT', notNull: true },
          { name: 'dept_code', type: 'TEXT', notNull: true },
          { name: 'security_level', type: 'TEXT', defaultValue: 'A' }, // 기본값 A (최고 기밀) 강제 지정!
          { name: 'content', type: 'TEXT', notNull: true },
          { name: 'metadata_json', type: 'TEXT' },
          { name: 'status', type: 'TEXT', defaultValue: 'DRAFT' },
          { name: 'autopilot_score', type: 'REAL', defaultValue: 0.0 },
          { name: 'created_at', type: 'TEXT' },
          { name: 'updated_at', type: 'TEXT' }
        ],
        {
          tableName: 'knowledge_documents',
          description: '사내 승인/전결 문서 및 미디어 지식 자산 대장',
          uniqueKeyColumns: ['document_id'],
          duplicateAction: 'update'
        }
      );

      // 5대 Zero-Trust 샘플 데이터 백필 씨딩
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await insertRows('knowledge_documents', [
        {
          document_id: 'doc-cad-001',
          title: '차세대 초경량 배터리팩 3D 외관 설계도 및 BOM',
          doc_type: 'CAD_BLUEPRINT',
          file_path: '/files/cad/battery_pack_3d.dwg',
          thumbnail_path: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60',
          creator_id: 'designer_lee',
          dept_code: 'RND',
          security_level: 'A', // 미심사 최초 격리 상태
          content: '### 차세대 초경량 배터리팩 설계 기술 명세서\n\n본 설계는 에너지 밀도를 기존 대비 18% 향상시키고 총 중량을 12kg 절감하기 위한 알루미늄 다이캐스팅 압착 구조를 채택함. 양극재 냉각을 위한 액체 수냉 통로 배치 설계가 핵심 설계 자산임.',
          metadata_json: JSON.stringify({
            designer: '이정민 책임연구원',
            project: 'NEXT_GEN_BATTERY',
            bom_list: [
              { item: '알루미늄 프레임 AL-6061', qty: 4 },
              { item: '전력 동박 버스바 (Copper)', qty: 2 },
              { item: '수랭식 냉각 플레이트 V2', qty: 1 }
            ],
            keywords: ['배터리팩', 'CAD도면', '알루미늄', 'BOM', '냉각설계']
          }),
          status: 'PENDING',
          autopilot_score: 85.0,
          created_at: now,
          updated_at: now
        },
        {
          document_id: 'doc-audio-001',
          title: '2026 하반기 글로벌 M&A 및 신제품 출시 전략 회의록',
          doc_type: 'AUDIO_RECORDING',
          file_path: '/files/audio/mna_strategy_2026.mp3',
          thumbnail_path: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&auto=format&fit=crop&q=60',
          creator_id: 'ceo_park',
          dept_code: 'STRATEGY',
          security_level: 'A', // 미심사 최초 격리 상태
          content: '### 글로벌 M&A 및 신제품 출시 전략 회의록\n\n*   **일시**: 2026년 5월 28일 10:00 ~ 12:30\n*   **참석자**: 박현우 대표, 최윤석 부사장, 강수진 전략본부장\n*   **녹음 요약**: 북미 시장 교두보 확보를 위한 현지 벤처기업 인수 타당성 검증 완료. 인수 제안 가격은 최대 45억원 한도로 설정함. 신제품 베타 버전 출시는 8월 초로 동적 확정.',
          metadata_json: JSON.stringify({
            meeting_title: '글로벌 M&A 타당성 검토',
            duration: '02:30:15',
            action_items: [
              { owner: '최윤석 부사장', task: '북미 투자사 LOI(의향서) 검토 및 법률 자문', deadline: '2026-07-15' },
              { owner: '강수진 전략본부장', task: '베타 서비스 인프라 RAG 관제 구축 및 PV 테스트', deadline: '2026-08-01' }
            ],
            keywords: ['M&A', '회의녹취', '인수합병', '글로벌전략', '신제품베타']
          }),
          status: 'PENDING',
          autopilot_score: 70.0,
          created_at: now,
          updated_at: now
        },
        {
          document_id: 'doc-report-001',
          title: '2026년 2분기 영업본부 실적 및 마진 추이 보고서',
          doc_type: 'REPORT',
          file_path: '/files/docs/q2_sales_margin_report.docx',
          thumbnail_path: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500&auto=format&fit=crop&q=60',
          creator_id: 'sales_manager',
          dept_code: 'SALES',
          security_level: 'B', // 심사 완료하여 부서 대외비로 하향 조정됨
          content: '### 2026년 2분기 영업실적 마진 분석\n\n본 보고서는 2분기 영업본부의 영업 매출 및 품목별 공헌 이익, 최종 마진 스프레드를 정리함. 주력 B2B 거래처 납품 물량이 15% 증가하며 영업 이익이 전분기 대비 8.5% 개선됨.',
          metadata_json: JSON.stringify({
            quarter: '2026 Q2',
            revenue: '4억 8천만원',
            operating_profit: '5,200만원',
            margin_rate: '10.8%',
            keywords: ['분기보고서', '영업실적', '마진분석', 'B2B매출', '스프레드']
          }),
          status: 'APPROVED_MANUAL',
          autopilot_score: 91.0,
          created_at: now,
          updated_at: now
        },
        {
          document_id: 'doc-draft-001',
          title: '영업본부 외근용 차량 주유비 지급 청구서 (6월)',
          doc_type: 'PROPOSAL',
          file_path: '/files/docs/gas_bill_june.xlsx',
          thumbnail_path: 'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=500&auto=format&fit=crop&q=60',
          creator_id: 'sales_staff',
          dept_code: 'SALES',
          security_level: 'C', // 심사 완료하여 사내 공개로 하향 조정됨
          content: '### 6월 외근용 업무 차량 주유비 지급 청구서\n\n*   **청구 부서**: 영업본부\n*   **청구자**: 김도현 주임\n*   **상세 내역**: 지방 B2B 바이어 정기 미팅 지원을 위한 렌터카 유류 주입 영수증 청구.\n*   **금액**: 78,000원 (VAT 포함)',
          metadata_json: JSON.stringify({
            amount: 78000,
            vehicle: '카니발 52호',
            reason: '바이어 대면 미팅 유류비 지원',
            keywords: ['주유비', '청구서', '업무비용', '지출품의', '소액결재']
          }),
          status: 'APPROVED_AUTO', // 10만원 이하 정형 건으로 자동 전결 처리 완료
          autopilot_score: 97.8,
          created_at: now,
          updated_at: now
        },
        {
          document_id: 'doc-card-001',
          title: 'B2B 파트너 신규 바이어 명함 정보 연동',
          doc_type: 'B_CARD',
          file_path: '/files/cards/buyer_namecard.png',
          thumbnail_path: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=500&auto=format&fit=crop&q=60',
          creator_id: 'sales_staff',
          dept_code: 'SALES',
          security_level: 'C', // 심사 완료하여 사내 공개로 하향 조정됨
          content: '### 한울테크 신규 바이어 명함 정보\n\n*   **회사명**: 한울테크 (Hanul Tech)\n*   **성명/직급**: 김진수 상무 (Jin-Su Kim, Managing Director)\n*   **휴대전화**: 010-3456-7890\n*   **이메일**: jskim@hanultech.com\n*   **주소**: 경기도 성남시 분당구 판교역로 231',
          metadata_json: JSON.stringify({
            company: '한울테크',
            name: '김진수',
            position: '상무',
            phone: '010-3456-7890',
            email: 'jskim@hanultech.com',
            keywords: ['명함OCR', '바이어명함', '인맥적재', '한울테크', '신규연락처']
          }),
          status: 'APPROVED_AUTO',
          autopilot_score: 99.2,
          created_at: now,
          updated_at: now
        }
      ]);
    }

    // 2. document_approvals 테이블 생성 (부재 시)
    if (!tableNames.includes('document_approvals')) {
      await createTable(
        '지식 문서 결재 이력',
        [
          { name: 'document_id', type: 'TEXT', notNull: true },
          { name: 'approver_id', type: 'TEXT', notNull: true },
          { name: 'step_number', type: 'INTEGER', notNull: true },
          { name: 'step_type', type: 'TEXT', notNull: true },
          { name: 'status', type: 'TEXT', defaultValue: 'WAITING' },
          { name: 'comments', type: 'TEXT' },
          { name: 'processed_at', type: 'TEXT' }
        ],
        {
          tableName: 'document_approvals',
          description: '사내 지식 기안서에 대한 AI 자동 및 인적 결재 이력 보관 테이블',
          uniqueKeyColumns: ['document_id', 'approver_id', 'step_number'],
          duplicateAction: 'update'
        }
      );

      // 자동 전결(Autopilot) 승인 및 수동 대기 샘플 데이터 백필 씨딩
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await insertRows('document_approvals', [
        {
          document_id: 'doc-cad-001',
          approver_id: 'rnd_director',
          step_number: 1,
          step_type: 'APPROVER',
          status: 'WAITING',
          comments: '연구개발본부장 최종 기술 설계 심사 대기 중.',
          processed_at: null
        },
        {
          document_id: 'doc-audio-001',
          approver_id: 'ceo_park',
          step_number: 1,
          step_type: 'APPROVER',
          status: 'WAITING',
          comments: '대표이사 기밀 회의 의결 사항 최종 확인 대기.',
          processed_at: null
        },
        {
          document_id: 'doc-report-001',
          approver_id: 'president_kang',
          step_number: 1,
          step_type: 'APPROVER',
          status: 'APPROVED',
          comments: '분기 영업 이익 및 마진 개선 추세 승인 완료. 영업 부서 격려금 청구 품의 상신을 지시함.',
          processed_at: now
        },
        {
          document_id: 'doc-draft-001',
          approver_id: 'SYSTEM_AI',
          step_number: 1,
          step_type: 'AUTOPILOT',
          status: 'APPROVED',
          comments: 'AI 파일럿 자동 전결 완료 (점수: 97.8). 근거: 주유비 청구 금액(78,000원)이 전결 기준선(100,000원) 이하이며, 주유 일시 및 목적 정합성 100% 일치 확인.',
          processed_at: now
        },
        {
          document_id: 'doc-card-001',
          approver_id: 'SYSTEM_AI',
          step_number: 1,
          step_type: 'AUTOPILOT',
          status: 'APPROVED',
          comments: 'AI 파일럿 자동 연동 완료 (점수: 99.2). 근거: 업로드된 명함 이미지의 Multi-modal OCR 판독 결과, 누락 정보 없음 및 1차 바이어 번호 유효성 검사 패스.',
          processed_at: now
        }
      ]);
    }
  } catch (error) {
    console.error('Failed to initialize and seed database:', error);
  }
}

/**
 * GET 핸들러: 보안 및 소속 권한을 결합한 지식 문서 리스트 조회 (Zero-Trust Row-Level Security)
 */
export async function GET(request: Request) {
  await initializeDatabase();

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'sales_staff';
    const userRole = searchParams.get('role') || 'SUB_OPERATOR'; // SUPER_ADMIN, PRESIDENT, SUB_OPERATOR
    const userDept = searchParams.get('dept') || 'SALES';

    // 모든 문서 조회 후 백엔드 필터링 적용 (SQLite Row-Level 격리 모사)
    const allDocs = await queryTable('knowledge_documents', { orderBy: 'created_at', orderDirection: 'DESC' });
    const allApprovals = await queryTable('document_approvals');

    const filteredDocs = allDocs.filter((doc: any) => {
      // 1. 최고관리자(SUPER_ADMIN) 또는 대표자(PRESIDENT)는 제한 없이 모든 보안 등급 문서 조회 가능
      if (userRole === 'SUPER_ADMIN' || userRole === 'PRESIDENT') {
        return true;
      }

      // 2. C 등급 (사내 공개)은 모든 사원이 조회 가능
      if (doc.security_level === 'C') {
        return true;
      }

      // 3. B 등급 (부서 대외비)은 동일 부서 소속 사원만 조회 가능
      if (doc.security_level === 'B') {
        return doc.dept_code === userDept;
      }

      // 4. A 등급 (최고 기밀)은 일반 부서원은 원천 접근 차단 (본인이 작성한 기안서인 경우는 조회 허용)
      if (doc.security_level === 'A') {
        return doc.creator_id === userId;
      }

      return false;
    });

    // 각 문서에 연관된 결재선 결합
    const docsWithApprovals = filteredDocs.map((doc: any) => {
      const docApprovals = allApprovals.filter((app: any) => app.document_id === doc.document_id);
      return {
        ...doc,
        approvals: docApprovals,
        // JSON 문자열 파싱 안전장치
        metadata: doc.metadata_json ? JSON.parse(doc.metadata_json) : {}
      };
    });

    return NextResponse.json({ success: true, documents: docsWithApprovals });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST 핸들러: 신규 문서 업로드 & Autopilot 채점 & 최고관리자 보안 등급 하향 심사
 */
export async function POST(request: Request) {
  await initializeDatabase();

  try {
    const body = await request.json();
    const { action } = body;

    // 액션 1: 신규 문서 업로드 및 AI 파싱 (최초 A등급 강제 격리 지정!)
    if (action === 'UPLOAD') {
      const { title, doc_type, creator_id, dept_code, file_name, file_size } = body;

      if (!title || !doc_type || !creator_id || !dept_code) {
        return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
      }

      const docId = `doc-${Date.now()}`;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // 1. 비정형 유형별 파싱 시뮬레이터 구동
      let parsedContent = '';
      let metadata: Record<string, any> = {};
      let thumbnailPath = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&auto=format&fit=crop&q=60';
      let autoScore = 0.0;
      let status = 'PENDING';

      if (doc_type === 'CAD_BLUEPRINT') {
        parsedContent = `### AI 해독 CAD 설계 도면: ${file_name}\n\n*   **도면 유형**: CAD 2D/3D 벡터 설계도\n*   **스캔 결과**: 실물 타이틀 블록 감지 완료. 차세대 소형 모빌리티 본체 프레임 구조 설계 장묘 수록.\n*   **BOM 파싱**: 탄소섬유 지지대 x2, 강화 볼트 v3 x16, 고장력 서스펜션 브래킷 x4 감지. 특이 형상 비정상 굴곡 부위 없음.`;
        metadata = {
          file_name,
          file_size,
          engineer: '기안연구원',
          bom_list: [
            { item: '탄소섬유 지지대 C-Frame', qty: 2 },
            { item: '강화 체결 볼트 V3', qty: 16 },
            { item: '고장력 서스펜션 브래킷', qty: 4 }
          ],
          keywords: ['CAD도면', '모빌리티', 'BOM파싱', '신형도면', '설계자산']
        };
        thumbnailPath = 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60';
        autoScore = 86.4; // 수동 결재 심사 대상
      } 
      else if (doc_type === 'B_CARD') {
        parsedContent = `### AI 명함 OCR 추출 리포트: ${file_name}\n\n*   **상호**: (주)미래이노베이션 (Mirae Innovation)\n*   **이름/직급**: 박태준 본부장 (Tae-Jun Park, Head of Business)\n*   **전화번호**: 010-9876-5432\n*   **이메일**: tjpark@mirae-inno.co.kr\n*   **주소**: 서울시 마포구 독막로 320, 8층`;
        metadata = {
          company: '미래이노베이션',
          name: '박태준',
          position: '본부장',
          phone: '010-9876-5432',
          email: 'tjpark@mirae-inno.co.kr',
          keywords: ['명함OCR', '신규연락처', '미래이노베이션', '본부장', 'B2B파트너']
        };
        thumbnailPath = 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=500&auto=format&fit=crop&q=60';
        autoScore = 98.7; // 자동 파일럿 승인 적격
      } 
      else if (doc_type === 'AUDIO_RECORDING') {
        parsedContent = `### AI 회의 음성 녹취 STT 해독 리포트: ${file_name}\n\n*   **대화 해독 요약**: B2B 부품 단가 조정 협상 내용 수록. 주요 고객사인 한울테크 상무와의 3차 화상 통화 오디오 기록.\n*   **주요 의사결정**: 물량 20% 확대 조건으로 개당 시급/단가 3.2% 인하 제안 수락 동의.`;
        metadata = {
          file_name,
          duration: '00:08:45',
          action_items: [
            { owner: '영업본부장', task: '한울테크 단가 인하 3.2% 반영된 정식 견적서 갱신 발송', deadline: '2026-06-10' }
          ],
          keywords: ['회의녹취', '단가협상', '오디오해독', '한울테크', '액션아이템']
        };
        thumbnailPath = 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&auto=format&fit=crop&q=60';
        autoScore = 82.1;
      } 
      else {
        // 일반 문서 (기안/품의서 등)
        parsedContent = `### 전사 일반 품의서 문서 파싱 본문: ${title}\n\n*   **청구 목적**: 부서 내 전산 비품 및 소모품 노후 교체 청구 건.\n*   **품의 금액**: 45,000원 (키보드, 마우스 세트 구매)`;
        metadata = {
          amount: 45000,
          reason: '노후 소모품 교체',
          keywords: ['일반품의', '소모품교체', '사무용품', '소액청구']
        };
        autoScore = 96.5; // 소액 건으로 자동 전결 처리
      }

      // 2. AI Autopilot 의사결정 분기
      // 95점 이상이고 10만원 이하(금액 메타데이터 존재 시) 또는 명함/일반소액인 경우
      const isAutopilotEligible = autoScore >= 95.0 && (!metadata.amount || metadata.amount <= 100000);

      if (isAutopilotEligible) {
        status = 'APPROVED_AUTO';
      }

      // [핵심 요구사항 🔒] Zero-Trust 정책: 모든 신규 문서는 최초 저장 시 security_level = 'A' (최고 기밀)로 무조건 강제 지정!
      const newDoc = {
        document_id: docId,
        title,
        doc_type,
        file_path: file_name ? `/files/${doc_type.toLowerCase()}/${file_name}` : null,
        thumbnail_path: thumbnailPath,
        creator_id,
        dept_code,
        security_level: 'A', // 무조건 A등급 지정! Zero-Trust!
        content: parsedContent,
        metadata_json: JSON.stringify(metadata),
        status,
        autopilot_score: autoScore,
        created_at: now,
        updated_at: now
      };

      await insertRows('knowledge_documents', [newDoc]);

      // 결재 이력 생성
      if (status === 'APPROVED_AUTO') {
        // 자동 전결 감사 로그 아카이빙
        await insertRows('document_approvals', [{
          document_id: docId,
          approver_id: 'SYSTEM_AI',
          step_number: 1,
          step_type: 'AUTOPILOT',
          status: 'APPROVED',
          comments: `AI 파일럿 자동 전결 완료 (채점 스코어: ${autoScore}점). 판단 사유: 업로드된 파일이 전사 표준 정형화 서식 요구 조건에 95% 이상 부합하며, 금액 및 기안 목적에서 이상 징후가 발견되지 않음. [보안 고지] 제로 트러스트 규정에 따라 최초 A등급(최고 기밀)으로 적재되었으니 최고관리자 심사를 거치십시오.`,
          processed_at: now
        }]);
      } else {
        // 수동 대기선 할당 (부서장 추천)
        await insertRows('document_approvals', [{
          document_id: docId,
          approver_id: `${dept_code.toLowerCase()}_director`,
          step_number: 1,
          step_type: 'APPROVER',
          status: 'WAITING',
          comments: `AI 추천 부서 결재 심사 대기. (채점 스코어: ${autoScore}점. 규격 대외비 또는 고액 품의로 분류되어 수동 결재선으로 인계됨.)`,
          processed_at: null
        }]);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Zero-Trust A등급 최고 기밀 강제 격리 상태로 안전 적재되었습니다.', 
        document: {
          ...newDoc,
          metadata,
          approvals: [{
            document_id: docId,
            approver_id: status === 'APPROVED_AUTO' ? 'SYSTEM_AI' : `${dept_code.toLowerCase()}_director`,
            step_type: status === 'APPROVED_AUTO' ? 'AUTOPILOT' : 'APPROVER',
            status: status === 'APPROVED_AUTO' ? 'APPROVED' : 'WAITING',
            comments: status === 'APPROVED_AUTO' ? 'AI 파일럿 자동 전결 완료' : '수동 결재 대기'
          }]
        } 
      });
    }

    // 액션 2: 최고관리자용 보안 등급 심사 하향 (Zero-Trust A -> B 또는 C 하향 조정)
    if (action === 'DOWNGRADE') {
      const { document_id, new_level, user_role } = body;

      if (!document_id || !new_level || !user_role) {
        return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
      }

      // 권한 검증: 오직 최고관리자(SUPER_ADMIN) 또는 대표자(PRESIDENT)만 등급 하향 가용
      if (user_role !== 'SUPER_ADMIN' && user_role !== 'PRESIDENT') {
        return NextResponse.json({ 
          success: false, 
          error: '보안 권한 부족: 등급 하향 조정 심사는 최고관리자 및 대표이사 계정만 권한이 부여됩니다.' 
        }, { status: 403 });
      }

      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // DB 업데이트 진행
      await updateRows(
        'knowledge_documents',
        { 
          security_level: new_level,
          updated_at: now
        },
        {
          filters: { document_id }
        }
      );

      // 변경 이력을 감사 코멘트에 가산
      await insertRows('document_approvals', [{
        document_id,
        approver_id: 'SYSTEM_AUDITOR',
        step_number: 99, // 감사 단계
        step_type: 'REFERRER',
        status: 'APPROVED',
        comments: `최고관리자 권한으로 지식 보안 등급이 A등급(최고기밀)에서 ${new_level}등급으로 공식 하향 심사 승인 완료. 전사 검색 가용망 방출됨.`,
        processed_at: now
      }]);

      return NextResponse.json({ 
        success: true, 
        message: `문서 보안 등급이 ${new_level}등급으로 성공적으로 하향 조정되어 RAG 지식이 방출되었습니다.`,
        document_id,
        new_level
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
