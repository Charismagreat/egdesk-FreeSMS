export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { executeSQL, queryTable } from '../../../../../egdesk-helpers';
import { sendMail } from '@/lib/email';
import crypto from 'crypto';

function escapeSqlString(val: string): string {
  if (val === null || val === undefined) return '';
  return val.replace(/'/g, "''");
}

// GET: 불용/장기재고 분석 추출 및 제안 이력 조회
export async function GET(req: Request) {
  try {
    // 90일 전 날짜 계산
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().replace('T', ' ').substring(0, 19);

    // 최근 90일간 출고('out')된 품목 ID 조회
    const logsQuery = `SELECT DISTINCT itemId FROM inventory_logs WHERE changeType = 'out' AND createdAt >= '${ninetyDaysAgoStr}'`;
    const logsResult = await executeSQL(logsQuery);
    const recentOutIds = new Set((logsResult?.rows || []).map((r: any) => Number(r.itemId)));

    // 삭제되지 않은 전체 재고 품목 조회
    const itemsQuery = `SELECT * FROM inventory_items WHERE deleted_at IS NULL`;
    const itemsResult = await executeSQL(itemsQuery);
    const items = itemsResult?.rows || [];

    // 불용/장기재고 필터링: (안전재고 2배 이상 초과) OR (최근 90일간 출고 없음)
    const deadstockItems = items.filter((item: any) => {
      if (item.stock <= 0) return false;
      
      const isOverStock = item.safeStock > 0 && item.stock >= item.safeStock * 2;
      const isLongTermStock = !recentOutIds.has(item.id);
      
      return isOverStock || isLongTermStock;
    });

    // API Key 조회
    const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    const apiKey = settingsRes.rows?.[0]?.value || null;

    let insightsMap: Record<number, string> = {};

    if (apiKey && deadstockItems.length > 0) {
      try {
        const itemInfoText = deadstockItems.map((item: any) => 
          `ID: ${item.id}, 품목명: ${item.name}, 현재고: ${item.stock}, 안전재고: ${item.safeStock}, 90일내출고여부: ${recentOutIds.has(item.id) ? '있음' : '없음'}`
        ).join('\n');

        const systemPrompt = `당신은 중소기업의 재고 관리 및 B2B 유통 전문가입니다.
제시된 불용/장기재고 품목 리스트를 분석하고, 각 품목별로 왜 불용/장기재고로 진단되었는지 분석 소견(reason)을 한국어로 작성해 주세요.
각 품목당 1~2문장으로 간결하고 전문적이게 작성해야 합니다.

출력 포맷은 반드시 아래의 JSON 구조를 정확히 지켜야 합니다:
{
  "insights": [
    {
      "id": 품목ID(숫자),
      "reason": "분석 소견"
    }
  ]
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: `아래 리스트를 분석해 주세요:\n${itemInfoText}` }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          // 토큰 기록 저장
          if (data.usageMetadata) {
            try {
              const u = data.usageMetadata;
              const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
              const tokenId = `TKC-DEAD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              await executeSQL(`
                INSERT INTO ai_token_usage_logs (id, model, purpose, prompt_tokens, completion_tokens, total_tokens, created_at, uuid, updated_at)
                VALUES ('${tokenId}', 'gemini-3.5-flash', 'deadstock-analysis', ${u.promptTokenCount || 0}, ${u.candidatesTokenCount || 0}, ${u.totalTokenCount || 0}, '${nowStr}', '${crypto.randomUUID()}', '${nowStr}')
              `);
            } catch (tokenErr) {
              console.error('AI 토큰 로그 기록 실패:', tokenErr);
            }
          }

          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const resJson = JSON.parse(text);
          if (Array.isArray(resJson.insights)) {
            resJson.insights.forEach((ins: any) => {
              insightsMap[Number(ins.id)] = ins.reason;
            });
          }
        }
      } catch (geminiErr) {
        console.error('Gemini API 분석 소견 생성 실패, 폴백 사용:', geminiErr);
      }
    }

    // 분석 소견 매핑 (Gemini 실패 혹은 API 키 부재 시 폴백 처리)
    const deadstockWithInsights = deadstockItems.map((item: any) => {
      const isOverStock = item.safeStock > 0 && item.stock >= item.safeStock * 2;
      const isLongTermStock = !recentOutIds.has(item.id);
      
      let fallbackReason = '';
      if (isOverStock && isLongTermStock) {
        fallbackReason = `안전재고(${item.safeStock}개)를 ${Math.round(item.stock / item.safeStock * 100)}% 초과하여 적재 중이며, 최근 90일간 출고가 중단된 장기 정체성 자재입니다.`;
      } else if (isOverStock) {
        fallbackReason = `현재고 ${item.stock}개로 안전재고(${item.safeStock}개) 대비 약 ${Math.round(item.stock / item.safeStock * 100)}% 과잉 적재 상태입니다.`;
      } else {
        fallbackReason = `최근 90일 동안 출고 내역이 확인되지 않아 창고 공간을 불필요하게 점유하고 있는 장기 체화 재고입니다.`;
      }

      return {
        ...item,
        aiInsight: insightsMap[item.id] || fallbackReason,
        isOverStock,
        isLongTermStock
      };
    });

    // 제안 메일 발송 로그 조회 (소프트 삭제 필터링)
    const proposalsQuery = `SELECT * FROM crm_deadstock_proposals WHERE deleted_at IS NULL ORDER BY id DESC`;
    const proposalsResult = await executeSQL(proposalsQuery);
    const proposals = proposalsResult?.rows || [];

    return NextResponse.json({
      success: true,
      items: deadstockWithInsights,
      proposals
    });

  } catch (error: any) {
    console.error('API deadstock GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: 특정 업체로 B2B 제안 이메일 발송 및 로그 저장
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { itemId, targetCompany, targetEmail, subject, content } = body;

    if (!itemId || !targetCompany || !targetEmail || !subject || !content) {
      return NextResponse.json({ success: false, error: '필수 요청 파라미터가 누락되었습니다.' }, { status: 400 });
    }

    // 1. sendMail 호출 (SMTP 설정 연동)
    try {
      await sendMail({
        to: targetEmail,
        subject: subject,
        html: content,
        fromName: '이지데스크 재고관리 AI'
      });
    } catch (mailErr: any) {
      console.error('메일 발송 실패:', mailErr);
      return NextResponse.json({ 
        success: false, 
        error: mailErr.message || '이메일 발송 중 오류가 발생했습니다. 시스템 설정의 SMTP 연동을 확인해 주세요.' 
      }, { status: 500 });
    }

    // 2. 발송 성공 시 DB 로그 적재 (7종 감사 컬럼 포함)
    const uuid = crypto.randomUUID();
    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    const insertQuery = `
      INSERT INTO crm_deadstock_proposals 
      (item_id, target_company, target_email, subject, content, status, created_at, uuid, updated_at)
      VALUES 
      (${Number(itemId)}, '${escapeSqlString(targetCompany)}', '${escapeSqlString(targetEmail)}', '${escapeSqlString(subject)}', '${escapeSqlString(content)}', 'SENT', '${nowStr}', '${uuid}', '${nowStr}')
    `;

    await executeSQL(insertQuery);

    return NextResponse.json({
      success: true,
      message: 'B2B 제안 메일이 정상적으로 발송되었으며 이력이 저장되었습니다.'
    });

  } catch (error: any) {
    console.error('API deadstock POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
