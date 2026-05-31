export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { queryTable, updateRows } from '../../../../../egdesk-helpers';

/**
 * 최고관리자(SUPER_ADMIN) 권한 검증 공통 헬퍼
 */
async function verifySuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    throw new Error('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
  }

  const payload = decodeJwt(token);
  if (payload.role !== 'SUPER_ADMIN') {
    throw new Error('피드백 관리 권한이 없습니다. 최고관리자 계정으로 로그인해주세요.');
  }
}

/**
 * GET: 접수된 사용자 피드백 목록 전체 조회 (최신순 정렬)
 */
export async function GET() {
  try {
    await verifySuperAdmin();

    const result = await queryTable('user_feedbacks', {
      orderBy: 'created_at',
      orderDirection: 'DESC'
    });

    return NextResponse.json({
      success: true,
      feedbacks: result.rows || []
    });
  } catch (error: any) {
    console.error('피드백 목록 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '피드백 목록을 조회하는 도중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

/**
 * PATCH: 피드백 처리 상태 업데이트
 */
export async function PATCH(req: Request) {
  try {
    await verifySuperAdmin();

    const { id, resolved_status } = await req.json();

    if (!id || !resolved_status) {
      return NextResponse.json({
        success: false,
        error: '피드백 고유 식별자(id) 또는 업데이트할 상태값(resolved_status)이 누락되었습니다.'
      }, { status: 400 });
    }

    const allowedStatuses = ['pending', 'in_progress', 'resolved', 'ignored'];
    if (!allowedStatuses.includes(resolved_status)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 처리 상태값입니다.'
      }, { status: 400 });
    }

    // SQLite 데이터베이스의 user_feedbacks 행 업데이트
    await updateRows('user_feedbacks', 
      { resolved_status }, 
      { filters: { id } }
    );

    return NextResponse.json({
      success: true,
      message: '피드백 상태가 변경되었습니다.'
    });
  } catch (error: any) {
    console.error('피드백 상태 업데이트 오류:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '피드백 상태를 업데이트하는 도중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
