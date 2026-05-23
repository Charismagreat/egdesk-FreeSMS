export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { gmAutomation } from '@/lib/google-messages';

export async function GET() {
  try {
    const isConnected = await gmAutomation.checkAuthStatus();
    return NextResponse.json({ success: true, isConnected });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
