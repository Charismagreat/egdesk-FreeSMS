export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/setup-db';

export async function GET() {
  try {
    await setupDatabase();
    return NextResponse.json({ success: true, message: 'DB setup complete' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
