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

    // 💡 하이브리드 프로필 스키마 맵 (부서, 백업대행, 역량스펙, 통근거리)
    const OPERATOR_DETAIL_MAP: Record<string, {
      department: string;
      backup_operator_id: string;
      skills: string;
      commute_area: string;
    }> = {
      "1": {
        department: "대표이사실",
        backup_operator_id: "2",
        skills: "경영지원, SCM 총괄, ERP 시스템 관리",
        commute_area: "경기도 성남시 분당구 - 자차 통근"
      },
      "2": {
        department: "구매팀",
        backup_operator_id: "3",
        skills: "자재 관리, 발주 및 수주 조율, SCM 실무",
        commute_area: "서울 마포구 - 지하철 통근 (대중교통의존)"
      },
      "3": {
        department: "생산공장",
        backup_operator_id: "2",
        skills: "조립 라인 총괄, 자재 조달 조율, 기계 오퍼레이팅",
        commute_area: "인천 부평구 - 지하철 통근 (원거리대중교통)"
      },
      "4": {
        department: "개발본부",
        backup_operator_id: "1",
        skills: "IT 시스템 지원, 재고 전산 관리, 데이터 엔지니어링",
        commute_area: "경기도 수원시 - 광역버스 통근 (원거리교통)"
      }
    };

    // JSON RAG 데이터 취합
    const ragContext = {
      total_employees_count: employees.length,
      employees: employees.map((e: any) => {
        const detail = OPERATOR_DETAIL_MAP[String(e.id)] || {
          department: "미정",
          backup_operator_id: "none",
          skills: "일반 서무",
          commute_area: "인근 통근"
        };
        return {
          id: e.id,
          name: e.name,
          role: e.role,
          department: detail.department,
          backup_operator_id: detail.backup_operator_id,
          skills: detail.skills,
          commute_area: detail.commute_area
        };
      }),
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
    const aiPrompt = `당신은 전사 기업 인사(HR) 및 공급망 관리(SCM) 전문 최고 분석관입니다.
제공된 임직원 상세 프로필(부서, 백업 대행자, 기술 역량, 거주 통근지)과 회사 전사 일정 대장(company_events), 휴가 신청(leaves), 출퇴근 감사 데이터(attendance_summary)를 RAG 컨텍스트로 복합 학습하여 고밀도 인사 공백 경보를 시뮬레이션해 주세요.

[주요 분석 요구사항]:
1. **부서 가동률 임계 체크**: 특정 부서원 과반이 동일 기간에 휴가를 신청했는지 판정해 리스크를 계산하세요. 특히, 1명만 있는 단독 부서(예: 구매팀 홍길동 과장)가 휴가일 때 비상 공백 리스크를 매우 높게 산정하세요.
2. **대체 가능 역량 분석**: 휴가 예정자가 발생했을 때, 조직 내 다른 인원 중 동일 기술 역량(skills)을 가진 대체 지원 가능 임직원 명단을 권고안(briefingText)에 직접 매핑 추천하세요.
3. **1차 백업 대행자 대조**: 휴가 신청자의 백업 담당자(backup_operator_id)가 해당 일자에 정상 근무 중인지, 혹은 중복 휴가 중인지 대조하여 리스크 가중치를 보정하세요.
4. **기후-교통 연계 지각 시뮬레이션**: 회사 공통 일정 중 '폭설', '태풍', '집중호우' 등 악천후와 관련된 일정이나 마감 기한이 존재하고 해당 일에 통근 거리(commute_area)가 멀거나 광역버스/대중교통을 타는 직원이 있으면 지각 우려 리스크를 가산하고, 대체 유연 근무(재택 전환 등)를 능동 권고하세요.

반드시 아래 JSON 스키마만을 철저히 준수하여 순수 JSON 문자열로만 응답해 주세요. 다른 마크다운 백틱(\`\`\`) 기호나 텍스트는 절대 포함하지 마세요.

응답 JSON 규격 스펙 예시:
{
  "riskScore": 65, // 0~100 사이의 정수 (리스크가 크면 높은 점수)
  "alertTitle": "6월 둘째 주 업무 공백 관심 단계 🟡", // 또는 "정상 🟢", "비상 경고 🔴" 등
  "alertMessage": "6월 15일 납품일 전날인 14일에 구매팀 홍길동 과장이 휴가를 신청했습니다. 구매 부서에 1인만 소속되어 있어 자재 수급 지연 위험이 있습니다.",
  "briefingText": "구매팀 홍길동 과장의 휴가 기간 중 1차 백업자인 김철수 과장은 정상 가용 상태입니다. 다만 원활한 조율을 위해 'IT 및 전산 지원' 역량을 갖춘 개발본부 이영희 사원을 임시 전산 대체 자원으로 배치하는 것을 검토하세요. 또한 기상 악화 시 광역버스로 통근하는 이영희 사원의 지각 위험을 완화하기 위해 선제적 재택근무 전환을 자율 권장합니다."
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
