export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable, insertRows, deleteRows } from '@/../egdesk-helpers';
import { setupDatabase } from '@/lib/setup-db';

export async function GET() {
  try {
    let res;
    try {
      res = await queryTable('expense_categories', { orderBy: 'created_at', orderDirection: 'ASC' });
    } catch (dbErr: any) {
      console.log('expense_categories table not found. Attempting setupDatabase...');
      await setupDatabase();
      res = await queryTable('expense_categories', { orderBy: 'created_at', orderDirection: 'ASC' });
    }
    
    return NextResponse.json({ success: true, categories: res.rows || [] });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { main_category, mid_category, sub_category } = body;

    if (!main_category || !mid_category || !sub_category) {
      return NextResponse.json({ success: false, error: '대분류, 중분류, 소분류 항목이 모두 필요합니다.' }, { status: 400 });
    }

    // 중복 체크
    const dupCheck = await queryTable('expense_categories', {
      filters: {
        main_category,
        mid_category,
        sub_category
      }
    });

    if (dupCheck.rows && dupCheck.rows.length > 0) {
      return NextResponse.json({ success: false, error: '이미 존재하는 계정 과목입니다.' }, { status: 400 });
    }

    const id = `cat-${Date.now()}`;
    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

    await insertRows('expense_categories', [{
      id,
      main_category,
      mid_category,
      sub_category,
      created_at: nowStr
    }]);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error adding category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '삭제할 계정 과목 ID가 필요합니다.' }, { status: 400 });
    }

    await deleteRows('expense_categories', { ids: [id] });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
