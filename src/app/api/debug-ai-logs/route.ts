import { NextResponse } from 'next/server';
import { callAiCallerTool } from '@/../egdesk-helpers';

export async function GET() {
  try {
    const logs = await callAiCallerTool('ai_caller_get_logs', { limit: 10 });
    return NextResponse.json({ success: true, logs });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
