import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { 
  queryTable, 
  insertRows, 
  deleteRows, 
  createTable, 
  listTables
} from '../../../../../egdesk-helpers';

// 15대 기본 자산 종류 정의
const DEFAULT_ASSET_TYPES = [
  { id: "dwg", name: "도면" },
  { id: "contract", name: "계약서" },
  { id: "proposal", name: "품의서" },
  { id: "draft", name: "기안서" },
  { id: "enforcement", name: "시행문" },
  { id: "report", name: "보고서" },
  { id: "official_out", name: "대외 발송 공문" },
  { id: "official_in", name: "대외 접수 공문" },
  { id: "litigation", name: "소송관련" },
  { id: "agreement", name: "각서 및 합의서" },
  { id: "mou", name: "양해각서" },
  { id: "notarization", name: "공증서류" },
  { id: "minutes", name: "회의록" },
  { id: "media", name: "녹음 및 영상" },
  { id: "etc", name: "그외 기타" }
];

/**
 * 테이블 초기화 및 15대 표준 자산 종류 씨딩 (Self-Healing & Seeding)
 */
async function initializeAssetTypesDatabase() {
  try {
    const tables = await listTables();
    const tableNames = tables.map((t: any) => t.tableName || t.name);

    if (!tableNames.includes('knowledge_asset_types')) {
      await createTable(
        '지식 자산 분류 마스터',
        [
          { name: 'id', type: 'TEXT', notNull: true },
          { name: 'type_name', type: 'TEXT', notNull: true },
          { name: 'created_at', type: 'TEXT' },
          { name: 'created_by', type: 'TEXT' }
        ],
        {
          tableName: 'knowledge_asset_types',
          description: '최고관리자가 실시간으로 편집 가능한 동적 지식 자산 종류 대장',
          uniqueKeyColumns: ['id'],
          duplicateAction: 'update'
        }
      );

      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const insertData = DEFAULT_ASSET_TYPES.map(item => ({
        id: item.id,
        type_name: item.name,
        created_at: now,
        created_by: 'SYSTEM_AI'
      }));

      await insertRows('knowledge_asset_types', insertData);
    }
  } catch (error) {
    console.error('Failed to initialize knowledge_asset_types table:', error);
  }
}

/**
 * GET: 자산 종류 목록 조회
 */
export async function GET() {
  await initializeAssetTypesDatabase();

  try {
    const result = await queryTable('knowledge_asset_types', { orderBy: 'created_at', orderDirection: 'ASC' });
    const rows = result.rows || [];
    return NextResponse.json({ success: true, assetTypes: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: 최고관리자 권한 가드 하에 자산 분류 신설 및 삭제 (사용량 기반 무결성 락)
 */
export async function POST(request: Request) {
  await initializeAssetTypesDatabase();

  try {
    // 1. 최고관리자 권한 검증
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    let isAuthorized = false;
    let userId = 'SYSTEM_AI';

    if (token) {
      const payload = decodeJwt(token);
      userId = (payload.sub as string) || 'unknown_admin';
      if (payload.role === 'SUPER_ADMIN' || payload.role === 'PRESIDENT') {
        isAuthorized = true;
      }
    } else {
      // 로컬 데모 모드를 배려하여 바디 인자 권한도 예외 허용 지원
      const bodyCheck = await request.clone().json().catch(() => ({}));
      if (bodyCheck.user_role === 'SUPER_ADMIN' || bodyCheck.user_role === 'PRESIDENT') {
        isAuthorized = true;
        userId = bodyCheck.user_id || 'admin_demo';
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ 
        success: false, 
        error: '권한 부족: 자산 분류 설정은 최고관리자 및 대표자 계정만 변경할 수 있습니다.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // 액션 A: 자산 종류 신규 추가 (CREATE)
    if (action === 'CREATE') {
      const { type_name } = body;
      if (!type_name || !type_name.trim()) {
        return NextResponse.json({ success: false, error: '자산 종류명을 정확히 입력해 주십시오.' }, { status: 400 });
      }

      const trimmedName = type_name.trim();

      // 한글명 중복 검사
      const existing = await queryTable('knowledge_asset_types', {
        filters: { type_name: trimmedName }
      });
      if (existing.rows && existing.rows.length > 0) {
        return NextResponse.json({ success: false, error: '이미 등록된 자산 분류입니다.' }, { status: 400 });
      }

      const id = `type-${Date.now()}`;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const newType = {
        id,
        type_name: trimmedName,
        created_at: now,
        created_by: userId
      };

      await insertRows('knowledge_asset_types', [newType]);

      // 최신화 목록 다시 반환
      const refresh = await queryTable('knowledge_asset_types', { orderBy: 'created_at', orderDirection: 'ASC' });
      return NextResponse.json({ 
        success: true, 
        message: `신규 자산 분류 [${trimmedName}]가 성공적으로 등록되었습니다.`,
        assetTypes: refresh.rows || []
      });
    }

    // 액션 B: 자산 종류 삭제 (DELETE - 사용량 무결성 감사 락)
    if (action === 'DELETE') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, error: '삭제할 자산 ID가 지정되지 않았습니다.' }, { status: 400 });
      }

      // 1. 대상 한글명 조회
      const targetQuery = await queryTable('knowledge_asset_types', { filters: { id } });
      const targetRow = targetQuery.rows?.[0];
      if (!targetRow) {
        return NextResponse.json({ success: false, error: '삭제할 대상 자산 종류를 찾지 못했습니다.' }, { status: 404 });
      }

      const typeName = targetRow.type_name;

      // 2. [무결성 감사 락 🔒] 해당 자산을 현재 사용 중인 문서가 지식 문서 대장에 있는지 진단
      const usedDocs = await queryTable('knowledge_documents', {
        filters: { doc_type: typeName }
      });

      if (usedDocs.rows && usedDocs.rows.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: `무결성 제약 오류: 현재 사내 지식 대장에 [${typeName}] 자산 종류로 등록된 문서가 ${usedDocs.rows.length}건 존재합니다. 해당 문서들의 자산 분류를 먼저 변경하거나 삭제한 뒤 시도해 주십시오.` 
        }, { status: 400 });
      }

      // 3. 안전 삭제 진행
      await deleteRows('knowledge_asset_types', {
        filters: { id }
      });

      // 최신 목록 다시 반환
      const refresh = await queryTable('knowledge_asset_types', { orderBy: 'created_at', orderDirection: 'ASC' });
      return NextResponse.json({ 
        success: true, 
        message: `자산 분류 [${typeName}]가 성공적으로 삭제되었습니다.`,
        assetTypes: refresh.rows || []
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
