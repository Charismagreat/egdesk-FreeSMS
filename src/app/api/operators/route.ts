export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable, insertRows, deleteRows, updateRows } from '../../../../egdesk-helpers';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';

async function getRoleFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return 'SUB_OPERATOR';
  try {
    const payload = decodeJwt(token);
    return payload.role as string || 'SUB_OPERATOR';
  } catch (e) {
    return 'SUB_OPERATOR';
  }
}

export async function GET(req: Request) {
  try {
    const role = await getRoleFromToken();
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 });
    }

    const result = await queryTable('crm_operators');
    return NextResponse.json({ success: true, operators: result.rows || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const role = await getRoleFromToken();
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 });
    }

    const { username, password, name, newRole, employee_number } = await req.json();

    if (!username || !password || !name) {
      return NextResponse.json({ success: false, error: '모든 필드를 입력해주세요.' }, { status: 400 });
    }

    // Check if user exists
    const existing = await queryTable('crm_operators', { filters: { username } });
    if (existing.rows && existing.rows.length > 0) {
      return NextResponse.json({ success: false, error: '이미 존재하는 아이디입니다.' }, { status: 400 });
    }

    // 사원번호 검증 및 자동 생성 체계 [입사년도(2자리)]-[일련번호(3자리)]
    let finalEmpNumber = (employee_number || '').trim();

    if (finalEmpNumber) {
      // 수동 입력 시 중복 체크
      const existingEmpNum = await queryTable('crm_operators', { filters: { employee_number: finalEmpNumber } });
      if (existingEmpNum.rows && existingEmpNum.rows.length > 0) {
        return NextResponse.json({ success: false, error: '이미 존재하는 사원번호입니다.' }, { status: 400 });
      }
    } else {
      // 미입력 시 26-001 형식 자동 사번 생성
      const yy = new Date().getFullYear().toString().slice(-2);
      const prefix = `${yy}-`;

      const allOpsRes = await queryTable('crm_operators', {});
      const allOps = allOpsRes.rows || [];

      // 현재 연도로 시작하는 사번 필터링 및 일련번호 추출
      const seqList = allOps
        .filter((op: any) => op.employee_number && op.employee_number.startsWith(prefix))
        .map((op: any) => {
          const numPart = op.employee_number.replace(prefix, '');
          return Number(numPart) || 0;
        });

      const maxSeq = seqList.length > 0 ? Math.max(...seqList) : 0;
      const nextSeq = maxSeq + 1;
      finalEmpNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const dateStr = new Date().toISOString();

    await insertRows('crm_operators', [{
      id: Date.now(), // Generate a numeric ID
      username,
      password_hash,
      name,
      role: newRole || 'SUB_OPERATOR',
      employee_number: finalEmpNumber,
      created_at: dateStr
    }]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const role = await getRoleFromToken();
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is missing' }, { status: 400 });
    }

    // prevent deleting admin
    const op = await queryTable('crm_operators', { filters: { id } });
    if (op.rows && op.rows.length > 0 && op.rows[0].username === 'admin') {
       return NextResponse.json({ success: false, error: '기본 관리자 계정은 삭제할 수 없습니다.' }, { status: 400 });
    }

    await deleteRows('crm_operators', { filters: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const role = await getRoleFromToken();
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 });
    }

    const { id, password, name, newRole, employee_number } = await req.json();

    if (!id || !name) {
      return NextResponse.json({ success: false, error: '필수 항목(id, 이름)이 누락되었습니다.' }, { status: 400 });
    }

    // 기존 정보 조회
    const existing = await queryTable('crm_operators', { filters: { id } });
    if (!existing.rows || existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: '존재하지 않는 직원입니다.' }, { status: 404 });
    }
    const currentOp = existing.rows[0];

    // admin 기본 관리자 권한 변경 제한
    if (currentOp.username === 'admin' && newRole && newRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: '기본 관리자 계정의 권한 등급은 변경할 수 없습니다.' }, { status: 400 });
    }

    // 사원번호 검증 및 중복 가드
    let finalEmpNumber = (employee_number || '').trim();
    if (finalEmpNumber) {
      // 본인 제외 타인과 겹치는지 체크
      const allOpsRes = await queryTable('crm_operators', {});
      const allOps = allOpsRes.rows || [];
      const duplicate = allOps.some((op: any) => op.id !== Number(id) && op.employee_number === finalEmpNumber);
      if (duplicate) {
        return NextResponse.json({ success: false, error: '이미 존재하는 사원번호입니다.' }, { status: 400 });
      }
    } else {
      // 사번 미입력 시 기존 사번이 있으면 그대로 유지, 없으면 신규 자동 생성
      if (currentOp.employee_number) {
        finalEmpNumber = currentOp.employee_number;
      } else {
        const yy = new Date().getFullYear().toString().slice(-2);
        const prefix = `${yy}-`;

        const allOpsRes = await queryTable('crm_operators', {});
        const allOps = allOpsRes.rows || [];

        const seqList = allOps
          .filter((op: any) => op.employee_number && op.employee_number.startsWith(prefix))
          .map((op: any) => {
            const numPart = op.employee_number.replace(prefix, '');
            return Number(numPart) || 0;
          });

        const maxSeq = seqList.length > 0 ? Math.max(...seqList) : 0;
        const nextSeq = maxSeq + 1;
        finalEmpNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;
      }
    }

    const updates: any = {
      name,
      role: newRole || currentOp.role,
      employee_number: finalEmpNumber
    };

    // 비밀번호 변경 시 해싱
    if (password && password.trim() !== '') {
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    await updateRows('crm_operators', updates, { filters: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
