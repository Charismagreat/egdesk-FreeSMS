export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable, insertRows, deleteRows } from '../../../../egdesk-helpers';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    const result = await queryTable('system_settings', { filters: { key } });
    if (result.rows && result.rows.length > 0) {
      return NextResponse.json({ success: true, value: result.rows[0].value });
    } else {
      return NextResponse.json({ success: true, value: null });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { key, value } = await req.json();

    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    await deleteRows('system_settings', { filters: { key } });
    // 신규 설치 환경의 system_settings 테이블 id 컬럼(NOT NULL 제약조건) 누락 에러 방지를 위해 id 값에 key 주입
    await insertRows('system_settings', [{ id: key, key, value }]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Settings save error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
