import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { queryTable, insertRows, deleteRows, executeSQL, getTableSchema } from '../../../../../../egdesk-helpers';

export const dynamic = 'force-dynamic';

// 🔑 최고관리자 권한 검증 헬퍼
async function verifySuperAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return false;
    
    const payload = decodeJwt(token);
    const role = (payload.role as string || '').toUpperCase();
    return role === 'SUPER_ADMIN';
  } catch (e) {
    return false;
  }
}

// 🎲 12자리 무작위 보안 고유 토큰 생성기 (NanoID Fallback)
function generateSecureShareId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 4단계 로컬 보안 비식별화 가드레일 엔진 (PII Masking & Obfuscation) - 차트용 12개 샘플 획득 목적
function anonymizeData(rows: any[], schema: any[]) {
  if (!rows || rows.length === 0) return { stats: {}, sampleRows: [] };

  const blacklist = [
    'password', 'password_hash', 'address', 'shipping_address', 'memo', 
    'attachment_url', 'business_license_url', 'email', 'phone', 'recipient_phone', 
    'manager_phone', 'partner_phone', 'customer_phone', 'ai_analysis', 'error_message'
  ];

  const safeCols = schema
    .map(col => col.name)
    .filter(name => !blacklist.includes(name.toLowerCase()));

  const numericCols = schema.filter(col => 
    ['integer', 'real', 'number'].includes(col.type?.toLowerCase()) || 
    col.name.toLowerCase().includes('amount') || 
    col.name.toLowerCase().includes('price') || 
    col.name.toLowerCase().includes('balance') || 
    col.name.toLowerCase().includes('stock') ||
    col.name.toLowerCase().includes('quantity')
  ).map(col => col.name);

  const stats: any = {
    totalRows: rows.length,
    numericColumns: {}
  };

  for (const colName of numericCols) {
    let sum = 0;
    let max = -Infinity;
    let min = Infinity;
    let count = 0;

    for (const r of rows) {
      const val = parseFloat(r[colName]);
      if (!isNaN(val)) {
        sum += val;
        if (val > max) max = val;
        if (val < min) min = val;
        count++;
      }
    }

    if (count > 0) {
      stats.numericColumns[colName] = {
        sum,
        avg: Math.round(sum / count),
        max,
        min
      };
    }
  }

  const samples = rows.slice(0, 12);
  const sampleRows = samples.map((row, index) => {
    const cleanRow: any = {};
    for (const col of safeCols) {
      let val = row[col];

      if (typeof val === 'string') {
        const colLower = col.toLowerCase();
        if (colLower.includes('name') || colLower.includes('customer') || colLower.includes('partner') || colLower.includes('operator')) {
          val = `고객_${String.fromCharCode(65 + (index % 26))}`;
        }
      }

      if (numericCols.includes(col) && typeof val === 'number') {
        const colSum = stats.numericColumns[col]?.sum || 1;
        val = parseFloat(((val / colSum) * 100).toFixed(2));
      }

      cleanRow[col] = val;
    }
    return cleanRow;
  });

  return { stats, sampleRows };
}

// 📂 [GET] 최고관리자 공유 목록 전체 조회 또는 단건 공개 조회 (shareId 제공 시 무인증 오픈)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get('shareId');

    // 특정 shareId가 전달되었다면, 무인증 공개 조회 기능 가동
    if (shareId) {
      const res = await queryTable('shared_dashboards', { filters: { share_id: shareId, is_active: '1' } });
      if (res.rows && res.rows.length > 0) {
        return NextResponse.json({ success: true, dashboard: res.rows[0] });
      }
      return NextResponse.json({ success: false, error: '존재하지 않거나 공개 비활성화된 대시보드입니다.' }, { status: 404 });
    }

    // shareId가 전달되지 않았다면 최고관리자 권한 필수 가드 작동
    const isAuthorized = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

    const res = await queryTable('shared_dashboards', { orderBy: 'created_at', orderDirection: 'DESC' });
    return NextResponse.json({ success: true, list: res.rows || [] });
  } catch (err: any) {
    console.error('공유 목록 조회 오류:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 📂 [POST] 신규 퍼블릭 공유 대시보드 등록 (4단계 로컬 보안 가드레일 & sampleRows 머징 아키텍처)
export async function POST(req: Request) {
  try {
    const isAuthorized = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, sqlQuery, tableName, displayName, chartSpecJson, briefingMarkdown, refreshInterval } = body;

    if (!title || !sqlQuery || !chartSpecJson || !briefingMarkdown) {
      return NextResponse.json({ success: false, error: '필수 등록 정보가 누락되었습니다.' }, { status: 400 });
    }

    // A. 4단계 로컬 비식별 가드레일을 직접 태워 안전한 sampleRows 추출
    let sampleRows: any[] = [];
    try {
      const queryRes = await executeSQL(sqlQuery);
      const rows = queryRes.rows || [];
      
      let schema: any[] = [];
      if (tableName) {
        try {
          const schemaRes = await getTableSchema(tableName);
          schema = schemaRes.columns || schemaRes.schema || [];
        } catch (schemaErr) {
          console.warn('스키마 획득 실패:', schemaErr);
        }
      }

      const guardRes = anonymizeData(rows, schema);
      sampleRows = guardRes.sampleRows || [];
    } catch (dbErr: any) {
      console.warn('비식별화 데이터 선추출 경고:', dbErr.message);
    }

    // B. chartSpecJson 객체 내부에 sampleRows 병합 수록
    const rawSpec = typeof chartSpecJson === 'string' ? JSON.parse(chartSpecJson) : chartSpecJson;
    const enrichedSpec = {
      ...rawSpec,
      sampleRows
    };

    const shareId = generateSecureShareId();
    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

    await insertRows('shared_dashboards', [{
      share_id: shareId,
      title: title.trim(),
      sql_query: sqlQuery,
      table_name: tableName || '',
      display_name: displayName || '',
      chart_spec_json: JSON.stringify(enrichedSpec),
      briefing_markdown: briefingMarkdown,
      refresh_interval: refreshInterval || 'NONE',
      last_refreshed_at: nowStr,
      created_at: nowStr,
      is_active: 1
    }]);

    return NextResponse.json({
      success: true,
      shareId,
      message: '성공적으로 웹 게시판에 공유 대시보드가 등록되었습니다.'
    });

  } catch (err: any) {
    console.error('공유 등록 오류:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 📂 [DELETE] 공유 대시보드 해제 (공개 철회)
export async function DELETE(req: Request) {
  try {
    const isAuthorized = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 최고관리자 전용 기능입니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json({ success: false, error: '삭제할 shareId 정보가 누락되었습니다.' }, { status: 400 });
    }

    await deleteRows('shared_dashboards', { filters: { share_id: shareId } });

    return NextResponse.json({
      success: true,
      message: '공유 대시보드 웹 게시가 안전하게 철회 및 삭제되었습니다.'
    });

  } catch (err: any) {
    console.error('공유 삭제 오류:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
