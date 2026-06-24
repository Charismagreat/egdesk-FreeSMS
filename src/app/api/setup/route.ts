export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/setup-db';
import { deleteTable } from '../../../../egdesk-helpers';

export async function GET() {
  try {
    // 메타데이터 및 물리 테이블 스키마 칼각 동기화를 위해 레거시 crm_expenses 강제 소멸 후 재생성
    try {
      await deleteTable('crm_expenses');
      console.log('Successfully dropped legacy crm_expenses table for schema/metadata synchronization.');
    } catch (e) {
      console.log('crm_expenses table may not exist yet or skip dropping:', e);
    }
    try {
      await deleteTable('crm_estimate_items');
      console.log('Successfully dropped crm_estimate_items table for schema/metadata synchronization.');
    } catch (e) {
      console.log('crm_estimate_items table may not exist yet or skip dropping:', e);
    }

    await setupDatabase();
    return NextResponse.json({ success: true, message: 'DB setup complete and crm_expenses table has been successfully recreated with latest schemas.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
