export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { queryTable, insertRows } from '../../../../../egdesk-helpers';

export async function POST(req: Request) {
  try {
    // 1. DB에서 AI 설정 정보 로드
    const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    const apiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: '구글 AI API 키가 시스템에 등록되지 않았습니다. [시스템 설정 > AI 설정]에서 API 키를 먼저 등록해 주세요.'
      }, { status: 400 });
    }

    const modelRes = await queryTable('system_settings', { filters: { key: 'google_ai_model' } });
    const selectedModel = modelRes.rows && modelRes.rows.length > 0 && modelRes.rows[0].value
      ? modelRes.rows[0].value
      : 'gemini-3.5-flash';

    // 2. 근태, 연차 신청, 회사 일정 전사 마스터 데이터 수입 (RAG 재료)
    const employeesRes = await queryTable('crm_operators', { filters: { is_active: '1' } });
    const employees = employeesRes.rows || [];

    const leavesRes = await queryTable('crm_annual_leaves');
    const leaves = leavesRes.rows || [];

    const eventsRes = await queryTable('crm_company_events');
    const events = eventsRes.rows || [];

    const attendanceRes = await queryTable('crm_attendance');
    const attendance = attendanceRes.rows || [];

    // JSON RAG 데이터 취합
    const ragContext = {
      total_employees_count: employees.length,
      employees: employees.map((e: any) => ({ id: e.id, name: e.name, role: e.role })),
      leaves: leaves.map((l: any) => ({
        operator_id: l.operator_id,
        leave_type: l.leave_type,
        start_date: l.start_date,
        end_date: l.end_date,
        days_spent: l.days_spent,
        status: l.status,
        reason: l.reason
      })),
      company_events: events.map((ev: any) => ({
        title: ev.title,
        start_date: ev.start_date,
        end_date: ev.end_date,
        event_type: ev.event_type,
        description: ev.description
      })),
      attendance_summary: attendance.slice(-100).map((a: any) => ({
        operator_id: a.operator_id,
        work_date: a.work_date,
        status: a.status,
        working_hours: a.working_hours
      }))
    };

    // 3. RAG 프롬프트 설계
    const aiPrompt = `당신은 전사 기업 인사(HR) 및 조직 관리 전문 AI 분석가입니다.
제공된 회사 전사 일정 대장(company_events) 및 직원들의 휴가 신청(leaves), 근태 요약 정보(attendance_summary)를 RAG 컨텍스트로 학습하여:
1. 회사 중요 행사/납품 마감일 전후로 직원들의 연차 및 휴가 신청이 특정 주간/월간에 극단적으로 쏠려 있는지 정밀 스캔하여 업무 공백 리스크(0 ~ 100 사이의 숫자)를 진단해 주세요.
2. 만약 특정 마감 일정 부근에 부서 인원 과반의 연차 쏠림이 발견되면 경고성 공백 경보 메시지를 생성해 주세요.
3. 한 달간 전반적인 전사 근태 종합 평가 리포트를 품격 있고 조리 있는 한국어로 약 4문장 내외로 요약 제안해 주세요.

반드시 아래 JSON 스키마만을 철저히 준수하여 순수 JSON 문자열로만 응답해 주세요. 다른 마크다운 백틱(\`\`\`) 기호나 텍스트는 절대 포함하지 마세요.

응답 JSON 규격 스펙 예시:
{
  "riskScore": 45, // 0~100 사이의 정수
  "alertTitle": "6월 둘째 주 업무 공백 관심 단계 🟡", // 또는 "정상 🟢", "경고 🔴" 등
  "alertMessage": "6월 15일 주요 프로젝트 납품일 전후로 전체 부서 인원 중 40%가 반차를 신청했습니다. 대체 리소스 편성을 검토하세요.",
  "briefingText": "이번 달 전사 근태 지각율은 3% 대로 우수하게 유지되고 있으나, 특정 부서의 연차 쏠림 현상이 일부 포착되었습니다. 업무 연속성을 위해 부서별 순차 연차 사용을 자율 권장해 주시면 더욱 안정적인 매장/회사 관리가 가능해집니다."
}

[학습용 실시간 전사 HR 컨텍스트]:
${JSON.stringify(ragContext, null, 2)}`;

    // 4. Gemini AI 호출 가동
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: aiPrompt }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini AI API 통신 실패: HTTP ${response.status}`);
    }

    const aiData = await response.json();
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini AI로부터 공백 예보 분석 응답을 수신하지 못했습니다.');
    }

    // 🛡️ [철저 이행] AI API 사용량 통계 감사 로그 누락 없이 안전하게 실시간 적재 💾
    try {
      const u = aiData.usageMetadata || {};
      const promptTokens = u.promptTokenCount || 0;
      const completionTokens = u.candidatesTokenCount || 0;
      const totalTokens = u.totalTokenCount || 0;

      if (totalTokens > 0) {
        await insertRows('ai_token_usage_logs', [{
          model_name: selectedModel,
          task_purpose: 'HR_AI_BRIEFING',
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          timestamp: new Date().toISOString()
        }]);
        console.log('✓ HR AI 공백 분석 API 토큰 감사로그 누락 없이 적재 완료 💰');
      }
    } catch (logErr) {
      console.error('HR AI 토큰 사용량 감사 로그 적재 실패:', logErr);
    }

    // AI 응답 JSON 파싱
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawText.trim());
    } catch (err) {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0].trim());
      } else {
        throw new Error('AI 분석 결과 응답 포맷이 올바르지 않습니다.');
      }
    }

    return NextResponse.json({
      success: true,
      riskScore: parsedResult.riskScore || 0,
      alertTitle: parsedResult.alertTitle || '정상 가동중 🟢',
      alertMessage: parsedResult.alertMessage || '회사 일정 대비 연차 쏠림 현상이 발견되지 않아 전사 업무 공백 리스크가 극히 낮습니다.',
      briefingText: parsedResult.briefingText || '안정적인 전사 인사 근태 환경이 유지되고 있습니다.'
    });

  } catch (error: any) {
    console.error('AI Briefing POST API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
