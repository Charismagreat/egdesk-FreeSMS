import { NextResponse } from 'next/server';
import { queryTable, insertRows, executeSQL } from '../../../../../egdesk-helpers';

// 시스템 설정에서 Google API Key 및 모델 조회
async function getAiConfig() {
  try {
    const keyRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    const apiKey = keyRes.rows && keyRes.rows.length > 0 ? keyRes.rows[0].value : null;

    const modelRes = await queryTable('system_settings', { filters: { key: 'google_ai_model' } });
    const model = modelRes.rows && modelRes.rows.length > 0 && modelRes.rows[0].value
      ? modelRes.rows[0].value
      : 'gemini-3.5-flash';

    return { apiKey, model };
  } catch (err) {
    console.error('[EasyBot Event Handler] AI 설정 로드 실패:', err);
    return { apiKey: null, model: 'gemini-3.5-flash' };
  }
}

// 룰 기반 Fallback 분석 엔진 (API 키 만료/오류 시 동작)
function useFallbackRuleAnalysis(table: string, action: string, data: any) {
  console.warn(`[EasyBot Event Handler] AI 분석 중 오류가 발생하여 룰 기반 Fallback 엔진을 작동합니다.`);
  
  if (table === 'crm_expenses') {
    const title = data.title || '';
    const memo = data.memo || '';
    const amount = Number(data.amount) || 0;
    const category = data.category || '';
    
    // 심야 시간대 결제 여부 (23시 ~ 04시)
    const isLateNight = memo.includes('23:') || memo.includes('00:') || memo.includes('01:') || memo.includes('02:') || memo.includes('03:') || memo.includes('심야') || memo.includes('밤');
    
    // 비정상 지출 감지 조건 (고액 결제, 가요주점 키워드 포함, 혹은 심야 시간 접대비)
    const isSuspicious = 
      title.includes('가요주점') || memo.includes('가요주점') || 
      title.includes('주점') || memo.includes('주점') || 
      amount >= 300000 || 
      (category === '접대비' && isLateNight);
      
    if (isSuspicious) {
      const dueStr = new Date(Date.now() + 9 * 60 * 60 * 1000 + 3 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 10);
      return {
        requiresAction: true,
        reason: "[Fallback Rule Engine] 심야 시간대 가요주점 및 접대비 고액(30만원 이상) 지출이 감지되어 소명 요청 스냅태스크를 자동으로 발급하였습니다.",
        task: {
          title: `[지출 경고] 비정상 접대비 지출 소명 요청 (${data.payment_method || '법인카드'})`,
          content: `금액: ${amount.toLocaleString()}원\n날짜: ${data.expense_date || '미지정'}\n사용목적: ${title}\n상세내용: ${memo}\n\n위 지출 건은 비정상 지출 유형으로 의심되오니, 규정에 따른 지출 증빙 검토 및 소명을 제출해주시기 바랍니다.`,
          operator_id: "1", // Admin/CEO
          priority: "high",
          due_date: dueStr
        }
      };
    }
  }
  
  return {
    requiresAction: false,
    reason: "[Fallback Rule Engine] 분석 결과 추가 후속 조치가 필요하지 않은 정상 이벤트로 확인되었습니다.",
    task: null
  };
}

export async function POST(req: Request) {
  try {
    const event = await req.json();
    const { table, action, timestamp, data, previousData } = event;

    if (!table || !action || !data) {
      return NextResponse.json({ success: false, error: '유효하지 않은 이벤트 스키마입니다.' }, { status: 400 });
    }

    const { apiKey, model } = await getAiConfig();
    let decision = { requiresAction: false, reason: "", task: null as any };

    if (!apiKey) {
      console.warn('[EasyBot Event Handler] Google AI API Key가 등록되지 않아 Fallback 분석을 실행합니다.');
      decision = useFallbackRuleAnalysis(table, action, data);
    } else {
      try {
        // AI에게 제공할 테이블별 상황 분석 프롬프트 설계
        const analysisPrompt = `
You are the Event-Driven Intelligent Agent of "EasyBot" (이지봇) for "(주)원컨덕터" (One Conductor Co., Ltd.).
Your role is to analyze a database change event (INSERT/UPDATE/DELETE) and decide if it poses a business risk or requires a follow-up action (task).

[Company Context]:
(주)원컨덕터 produces power transmission conductors and connectors in a high-mix low-volume system, supplying to conglomerates like Iljin Electric and Hyosung Electric.
Critical Pain Points: Repeats of product defects, late delivery risks, high raw material LME price fluctuations (Copper/Aluminum), and manual administrative duplication.

[Database Change Event]:
- Table Name: ${table}
- Operation Type: ${action}
- Timestamp (KST): ${timestamp}
- Changed Data (JSON):
${JSON.stringify(data, null, 2)}
${previousData ? `- Previous Data (JSON):\n${JSON.stringify(previousData, null, 2)}` : ''}

[Your Task]:
Analyze this event based on the business rules of the company:
1. If "crm_expenses": Check for unauthorized use (holiday, late night, suspicious business category) or over budget.
2. If "crm_orders": Check if new order creates a risk of material shortage or delivery delay based on high-mix low-volume spec.
3. If "crm_deliveries" or "products": Check for sudden defects, scrap increase, or quality control alerts.
4. If "crm_snaptasks": Check if high-priority tasks are delayed.

If you determine that a follow-up action/task (SnapTask) is required to fix, inspect, or alert a human worker:
- Output a JSON instruction to insert a new row in "crm_snaptasks" table.
- Set a reasonable assignee (operator_id: e.g., '1' for Admin/CEO, '2' for Sales, '3' for Quality/Factory Manager).
- Write a clear, professional Korean title and content.

Your response must be in valid JSON format ONLY:
{
  "requiresAction": true,
  "reason": "Explain why this action is required in Korean.",
  "task": {
    "title": "Korean Title (e.g. [지출 경고] 심야 법인카드 소명 요청)",
    "content": "Korean Description (e.g. 공휴일 가동 중단 시점에 청구된 주유비 12만원의 지출 증빙 검토 및 소명을 요청합니다.)",
    "operator_id": "1", // Target Operator ID ('1'=CEO/Admin, '2'=Sales Team, '3'=Quality/Factory)
    "priority": "high", // 'low', 'medium', 'high', 'critical'
    "due_date": "YYYY-MM-DD" // (KST) Usually 2-3 days from event timestamp
  }
}

If NO action is required (e.g. normal expense, expected order, routine delivery without defects):
{
  "requiresAction": false,
  "reason": "Normal transaction/event without risks.",
  "task": null
}
`;

        // Gemini API 호출
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: "당신은 원컨덕터의 위험을 감지하고 자율적으로 스냅태스크를 생성하는 지능형 관제 비서입니다." }] },
            contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1
            }
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error?.message || 'Gemini API 호출 중 오류 발생');
        }

        const resData = await response.json();
        const resultText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        // 토큰 로그 기록
        if (resData.usageMetadata) {
          try {
            const u = resData.usageMetadata;
            const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
            await insertRows('ai_token_usage_logs', [{
              id: `TKE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              model: model,
              purpose: 'easybot-event-analysis',
              prompt_tokens: u.promptTokenCount || 0,
              completion_tokens: u.candidatesTokenCount || 0,
              total_tokens: u.totalTokenCount || 0,
              created_at: nowStr
            }]);
          } catch (logErr) {
            console.error('Event Handler 토큰 로깅 실패:', logErr);
          }
        }

        decision = JSON.parse(resultText);
      } catch (apiErr: any) {
        console.error('[EasyBot Event Handler] AI API 호출 실패로 Fallback 룰을 적용합니다:', apiErr.message);
        decision = useFallbackRuleAnalysis(table, action, data);
      }
    }

    // 만약 AI가 후속 조치가 필요하다고 결정했다면, 자율 스냅태스크 발급
    if (decision.requiresAction && decision.task) {
      const t = decision.task;
      const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      const taskId = `ST-${Date.now()}`;

      // 1. 마스터 테이블 crm_snaptasks 삽입
      await insertRows('crm_snaptasks', [{
        id: taskId,
        title: t.title,
        status: 'ACTIVE', // 대문자 'ACTIVE' 규격 준수
        partner_id: null,
        created_at: nowStr,
        updated_at: nowStr
      }]);

      console.log(`[EasyBot Event Handler] 자율 스냅태스크 발급 완료. ID: ${taskId}, 제목: ${t.title}`);
      
      // 2. 상세 지시 내용을 crm_snaptask_items에 삽입 (우선순위, 마감일, 담당자 정보 포함)
      const detailText = `[AI 자율 작업 지시]\n- 담당: ${t.operator_id === '3' ? '생산품질팀' : t.operator_id === '2' ? '영업팀' : '관리자'}\n- 우선순위: ${t.priority || 'medium'}\n- 마감기한: ${t.due_date || '미지정'}\n\n[상세 내용]\n${t.content}`;
      
      await insertRows('crm_snaptask_items', [{
        id: Date.now(),
        task_id: taskId,
        content_text: detailText,
        file_url: null,
        file_type: 'TEXT',
        ai_analysis: JSON.stringify({ reason: decision.reason, priority: t.priority, due_date: t.due_date }),
        created_at: nowStr
      }]);
    }

    return NextResponse.json({
      success: true,
      requiresAction: decision.requiresAction,
      reason: decision.reason,
      task: decision.task
    });

  } catch (error: any) {
    console.error('EasyBot Event Handler Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || '서버 오류가 발생했습니다.',
      stack: error.stack
    }, { status: 500 });
  }
}
