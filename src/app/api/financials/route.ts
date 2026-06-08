import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { queryTable, insertRows, updateRows, deleteRows } from '../../../../egdesk-helpers';

export const dynamic = 'force-dynamic';

// 세션 검증 헬퍼
async function verifySession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return { isAuthorized: false, role: 'GUEST', name: 'Unknown', operatorId: null };
    
    const payload = decodeJwt(token);
    const role = (payload.role as string || '').toUpperCase();
    const name = payload.name as string || payload.username as string || 'Unknown';
    const operatorId = Number(payload.id) || null;
    
    return {
      isAuthorized: role === 'SUPER_ADMIN' || role === 'OPERATOR',
      role,
      name,
      operatorId
    };
  } catch (e) {
    return { isAuthorized: false, role: 'GUEST', name: 'Unknown', operatorId: null };
  }
}

// [GET] 특정 회사(company_id)의 재무제표 이력 조회
export async function GET(request: Request) {
  try {
    const { isAuthorized } = await verifySession();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 로그인이 필요합니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ success: false, error: '조회할 회사 ID(company_id)가 지정되지 않았습니다.' }, { status: 400 });
    }

    // DB에서 재무제표 내역 조회
    const res = await queryTable('crm_financial_statements', {
      filters: { company_id: companyId }
    });

    const list = res.rows || [];
    // 연도 및 분기 기준 내림차순 정렬 (최신순)
    list.sort((a: any, b: any) => {
      if (b.fiscal_year !== a.fiscal_year) {
        return b.fiscal_year - a.fiscal_year;
      }
      return b.fiscal_quarter.localeCompare(a.fiscal_quarter);
    });

    return NextResponse.json({ success: true, list });
  } catch (error: any) {
    console.error('GET Financials Error:', error);
    return NextResponse.json({ success: false, error: error.message || '서버 내부 에러가 발생했습니다.' }, { status: 500 });
  }
}

// [POST] 재무제표 폼 최종 등록/수정 (Upsert)
export async function POST(request: Request) {
  try {
    const { isAuthorized } = await verifySession();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 로그인이 필요합니다.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      company_id,
      company_type,
      fiscal_year,
      fiscal_quarter = 'YR',
      total_assets = 0,
      total_liabilities = 0,
      total_equity = 0,
      revenue = 0,
      operating_income = 0,
      net_income = 0,
      pdf_file_path = '',
      parsed_raw_json = ''
    } = body;

    if (!company_id || !fiscal_year) {
      return NextResponse.json({ success: false, error: '필수 항목(회사 식별자, 회계 연도)이 누락되었습니다.' }, { status: 400 });
    }

    // 복합 유니크 조건으로 기존 레코드 조회 (동일 회사의 연도/분기 중복 방지)
    const checkRes = await queryTable('crm_financial_statements', {
      filters: {
        company_id,
        fiscal_year: Number(fiscal_year),
        fiscal_quarter
      }
    });

    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    const exists = checkRes.rows && checkRes.rows.length > 0;

    if (exists) {
      // 기존 레코드가 있으면 UPDATE 진행
      const existingId = checkRes.rows[0].id;
      await updateRows('crm_financial_statements', {
        company_type,
        total_assets: Number(total_assets),
        total_liabilities: Number(total_liabilities),
        total_equity: Number(total_equity),
        revenue: Number(revenue),
        operating_income: Number(operating_income),
        net_income: Number(net_income),
        pdf_file_path: pdf_file_path || checkRes.rows[0].pdf_file_path,
        parsed_raw_json: parsed_raw_json ? JSON.stringify(parsed_raw_json) : checkRes.rows[0].parsed_raw_json,
        updated_at: nowStr
      }, {
        filters: { id: existingId }
      });
      return NextResponse.json({ success: true, message: `${fiscal_year}년도 재무제표 정보가 성공적으로 갱신되었습니다.` });
    } else {
      // 레코드가 없으면 INSERT 진행
      const targetId = id || `FIN-${Date.now()}`;
      await insertRows('crm_financial_statements', [{
        id: targetId,
        company_id,
        company_type,
        fiscal_year: Number(fiscal_year),
        fiscal_quarter,
        total_assets: Number(total_assets),
        total_liabilities: Number(total_liabilities),
        total_equity: Number(total_equity),
        revenue: Number(revenue),
        operating_income: Number(operating_income),
        net_income: Number(net_income),
        pdf_file_path,
        parsed_raw_json: parsed_raw_json ? JSON.stringify(parsed_raw_json) : '',
        created_at: nowStr,
        updated_at: nowStr
      }]);
      return NextResponse.json({ success: true, message: `${fiscal_year}년도 재무제표 정보가 안전하게 적재되었습니다.` });
    }

  } catch (error: any) {
    console.error('POST Financials Error:', error);
    return NextResponse.json({ success: false, error: error.message || '서버 내부 에러가 발생했습니다.' }, { status: 500 });
  }
}

// [DELETE] 특정 재무제표 삭제
export async function DELETE(request: Request) {
  try {
    const { isAuthorized } = await verifySession();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 로그인이 필요합니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '삭제할 재무제표 식별자(id)가 누락되었습니다.' }, { status: 400 });
    }

    // 해당 재무제표 조회 (파일 삭제 연계를 위해)
    const checkRes = await queryTable('crm_financial_statements', { filters: { id } });
    if (checkRes.rows && checkRes.rows.length > 0) {
      const pdfPath = checkRes.rows[0].pdf_file_path;
      if (pdfPath) {
        try {
          const absolutePath = path.join(process.cwd(), 'public', pdfPath);
          const fs = require('fs');
          if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            console.log('재무제표 첨부 PDF 파일이 디스크에서 영구 삭제되었습니다.');
          }
        } catch (fileErr) {
          console.warn('첨부 파일 삭제 오류 (계속 진행):', fileErr);
        }
      }
    }

    // DB 레코드 삭제
    await deleteRows('crm_financial_statements', { filters: { id } });

    return NextResponse.json({ success: true, message: '재무제표가 성공적으로 영구 삭제되었습니다.' });
  } catch (error: any) {
    console.error('DELETE Financials Error:', error);
    return NextResponse.json({ success: false, error: error.message || '서버 내부 에러가 발생했습니다.' }, { status: 500 });
  }
}
