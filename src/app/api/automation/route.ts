import { NextResponse } from 'next/server';
import { queryTable } from '../../../../egdesk-helpers';

// Helper to interact with MCP for saving settings
async function saveSetting(key: string, value: string) {
  const url = 'http://localhost:8080/user-data/tools/call';
  const apiKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_EGDESK_API_KEY) || '';
  const headers: any = { 'Content-Type': 'application/json' };
  if (apiKey) headers['X-Api-Key'] = apiKey;

  // We delete the old key first to simulate an upsert, then insert the new one
  await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tool: 'user_data_sql_query',
      arguments: {
        query: `DELETE FROM system_settings WHERE key = '${key}'`
      }
    })
  });

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tool: 'user_data_insert_rows',
      arguments: {
        tableName: 'system_settings',
        rows: [{ key, value, created_at: new Date().toISOString() }]
      }
    })
  });

  if (!response.ok) throw new Error('MCP Tool Error saving setting');
}

export async function GET() {
  try {
    const settings = await queryTable('system_settings', {});
    const ruleRow = settings.rows?.find((r: any) => r.key === 'automation_rules');
    const rules = ruleRow ? JSON.parse(ruleRow.value) : {};
    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { rules } = await req.json();
    if (!rules) {
      return NextResponse.json({ success: false, error: 'Rules object is required' }, { status: 400 });
    }

    await saveSetting('automation_rules', JSON.stringify(rules));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving automation rules:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
