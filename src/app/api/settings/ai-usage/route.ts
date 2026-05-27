export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { executeSQL } from '@/../egdesk-helpers';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'today'; // 'today', 'week', 'month', 'all'

    // 1. 기간 필터 설정
    let dateFilter = '';
    const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
    
    if (range === 'today') {
      const todayStr = nowKST.toISOString().split('T')[0];
      dateFilter = `WHERE date(created_at) = '${todayStr}'`;
    } else if (range === 'week') {
      const oneWeekAgo = new Date(nowKST.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekStr = oneWeekAgo.toISOString().split('T')[0];
      dateFilter = `WHERE date(created_at) >= '${weekStr}'`;
    } else if (range === 'month') {
      const oneMonthAgo = new Date(nowKST.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthStr = oneMonthAgo.toISOString().split('T')[0];
      dateFilter = `WHERE date(created_at) >= '${monthStr}'`;
    }

    // 2. 누적 소비량 통계 쿼리 실행
    const statsQuery = `
      SELECT 
        COUNT(*) as api_calls,
        COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
        COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens
      FROM ai_token_usage_logs
      ${dateFilter}
    `;
    const statsResult = await executeSQL(statsQuery) as any;
    const summary = (statsResult && statsResult.length > 0) ? statsResult[0] : {
      api_calls: 0,
      total_prompt_tokens: 0,
      total_completion_tokens: 0,
      total_tokens: 0
    };

    // 3. 사용 목적(Purpose)별 통계 쿼리 실행
    const purposeQuery = `
      SELECT 
        purpose,
        COUNT(*) as calls,
        SUM(total_tokens) as tokens
      FROM ai_token_usage_logs
      ${dateFilter}
      GROUP BY purpose
      ORDER BY tokens DESC
    `;
    const purposeResult = await executeSQL(purposeQuery) as any;

    // 4. 모델(Model)별 통계 쿼리 실행
    const modelQuery = `
      SELECT 
        model,
        COUNT(*) as calls,
        SUM(total_tokens) as tokens
      FROM ai_token_usage_logs
      ${dateFilter}
      GROUP BY model
      ORDER BY tokens DESC
    `;
    const modelResult = await executeSQL(modelQuery) as any;

    // 5. 최근 토큰 트랜잭션 30건 조회
    const logsQuery = `
      SELECT id, model, purpose, prompt_tokens, completion_tokens, total_tokens, created_at
      FROM ai_token_usage_logs
      ORDER BY created_at DESC
      LIMIT 30
    `;
    const logsResult = await executeSQL(logsQuery) as any;

    return NextResponse.json({
      success: true,
      summary,
      purposes: purposeResult || [],
      models: modelResult || [],
      recentLogs: logsResult || []
    });

  } catch (error: any) {
    console.error('AI 토큰 통계 API 에러:', error);
    return NextResponse.json(
      { success: false, error: error.message || '토큰 통계를 분석하는 도중 서버 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}
