export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable, insertRows } from '../../../../egdesk-helpers';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // 1. Check if any admin exists
    const result = await queryTable('crm_operators', { limit: 1 });
    
    if (result.rows && result.rows.length > 0) {
      return NextResponse.json({ success: true, message: 'Admin already exists. Setup skipped.' });
    }

    // 2. If no admin exists, create the default SUPER_ADMIN
    const password_hash = await bcrypt.hash('admin123', 10);
    const dateStr = new Date().toISOString();

    await insertRows('crm_operators', [{
      id: 1,
      username: 'admin',
      password_hash: password_hash,
      name: '최고관리자',
      role: 'SUPER_ADMIN',
      created_at: dateStr
    }]);

    return NextResponse.json({ success: true, message: 'Default SUPER_ADMIN created (admin / admin123)' });
  } catch (error: any) {
    console.error('Setup Admin Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
