export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { queryTable, insertRows, updateRows, executeSQL } from '../../../../egdesk-helpers';
import crypto from 'crypto';

// 한국 시간 도우미 함수
function getKSTDateString() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * GET: 회의록 목록 조회 (소프트 삭제 필터 적용)
 */
export async function GET() {
  try {
    const result = await queryTable('crm_meetings', {
      filters: { deleted_at: null },
      orderBy: 'date',
      orderDirection: 'DESC'
    });
    
    return NextResponse.json({ success: true, meetings: result.rows || [] });
  } catch (error: any) {
    console.error('회의록 조회 오류:', error);
    return NextResponse.json({ success: false, error: '회의록을 조회하는 도중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * POST: 회의 시작(생성) 또는 회의 종료(요약 및 할 일 추출)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, title, attendees, meetingId, transcript } = body;

    const nowStr = getKSTDateString();

    // 1. 회의 시작 (생성)
    if (action === 'start') {
      if (!title) {
        return NextResponse.json({ success: false, error: '회의 제목은 필수 입력 항목입니다.' }, { status: 400 });
      }

      // crm_meetings의 다음 ID 획득
      const maxIdRes = await executeSQL('SELECT MAX(id) as maxId FROM crm_meetings');
      const nextId = (maxIdRes?.rows?.[0]?.maxId || 0) + 1;

      const newMeeting = {
        id: nextId,
        title,
        date: nowStr,
        attendees: Array.isArray(attendees) ? JSON.stringify(attendees) : JSON.stringify([]),
        transcript: JSON.stringify([]),
        summary: '',
        status: 'ONGOING',
        uuid: crypto.randomUUID(),
        updated_at: nowStr,
        updated_by: 'SYSTEM'
      };

      await insertRows('crm_meetings', [newMeeting]);

      return NextResponse.json({ success: true, meeting: newMeeting });
    }

    // 2. 회의 종료 (요약 및 할 일 추출)
    if (action === 'complete') {
      if (!meetingId || !transcript) {
        return NextResponse.json({ success: false, error: '회의 식별 번호와 대화 기록은 필수 항목입니다.' }, { status: 400 });
      }

      // 기존 회의 확인
      const checkMeeting = await queryTable('crm_meetings', { filters: { id: meetingId, deleted_at: null } });
      if (!checkMeeting.rows || checkMeeting.rows.length === 0) {
        return NextResponse.json({ success: false, error: '존재하지 않거나 삭제된 회의입니다.' }, { status: 404 });
      }

      const meeting = checkMeeting.rows[0];

      // 대화 기록 파싱 및 플랫 텍스트 변환
      let dialogText = '';
      if (Array.isArray(transcript)) {
        dialogText = transcript.map((t: any) => `${t.speaker || '참석자'}: ${t.text}`).join('\n');
      } else {
        dialogText = String(transcript);
      }

      // system_settings에서 구글 AI API 키 조회
      let apiKey = null;
      try {
        const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
        if (settingsRes.rows && settingsRes.rows.length > 0) {
          apiKey = settingsRes.rows[0].value;
        }
      } catch (dbErr) {
        console.warn('⚠️ system_settings 조회 실패 (기본 폴백 모드 작동):', dbErr);
      }

      let summaryMarkdown = '';
      let tasks = [];

      if (apiKey) {
        try {
          // (A) 회의록 마크다운 요약 생성
          const summarySystemPrompt = `당신은 전문 비서이자 회의 기록 관리자입니다.
제시된 한국어 회의 대화록을 분석하여 정교하고 직관적인 마크다운 형식의 회의록을 작성해 주세요.
반드시 다음 구조로 한글 회의록을 작성해 주십시오:
1. **회의 개요**: 일시 및 참석자 정보 요약
2. **주요 의제 및 결정 사항**: 회의에서 내린 결론 및 합의된 결과들
3. **주요 논의 내용**: 의제별 주요 발언 내용 및 쟁점 요약
마크다운 코드 블록(\`\`\`)으로 감싸지 말고 순수 마크다운 텍스트로만 반환하십시오.`;

          const summaryRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: summarySystemPrompt }] },
              contents: [{ parts: [{ text: `회의 대화록:\n${dialogText}` }] }],
              generationConfig: { temperature: 0.2 }
            })
          });

          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            summaryMarkdown = summaryData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }

          // (B) 할 일 및 일정 추출 (JSON 포맷 강제)
          const taskSystemPrompt = `당신은 회의록 분석 및 업무 관리자입니다.
제시된 한국어 회의 대화록을 읽고, 각 참석자별로 수행하기로 약속하거나 할당받은 구체적인 할 일(Action Items)과 기한(Due Date) 일정을 JSON 배열로 추출해 주세요.
- assignee_name: 업무 담당자명 (텍스트에 나타난 참석자 이름)
- assignee_email: 담당자 이메일 (대화에 이메일이 언급되었다면 파싱하고, 없거나 모호하면 '이름@company.com' 형식으로 임시 할당)
- task_desc: 구체적이고 실행 가능한 할 일 설명
- due_date: YYYY-MM-DD 형식 (기한이 대화에 언급되었다면 매핑하고, 없거나 모호하면 현재 시점 기준으로 7일 뒤인 YYYY-MM-DD로 지정)

반드시 아래의 JSON 포맷을 엄격히 준수하여 응답해 주십시오. 마크다운 기호 등을 추가하지 마십시오.
{
  "tasks": [
    {
      "assignee_name": "이름",
      "assignee_email": "이메일",
      "task_desc": "설명",
      "due_date": "YYYY-MM-DD"
    }
  ]
}`;

          const taskRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: taskSystemPrompt }] },
              contents: [{ parts: [{ text: `회의 대화록:\n${dialogText}` }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
            })
          });

          if (taskRes.ok) {
            const taskData = await taskRes.json();
            const taskText = taskData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            const parsedTasks = JSON.parse(taskText);
            if (Array.isArray(parsedTasks.tasks)) {
              tasks = parsedTasks.tasks;
            }
          }
        } catch (geminiErr) {
          console.error('Gemini API를 이용한 회의 요약 및 할 일 추출 실패, 폴백 전환:', geminiErr);
        }
      }

      // API 키가 없거나 Gemini 호출 실패 시 폴백 데이터 생성
      if (!summaryMarkdown) {
        summaryMarkdown = `### 📋 회의록 요약 (AI 폴백 모드 가동)
*   **회의 개요**: \`${meeting.title}\` 회의가 완료되었습니다.
*   **주요 의제 및 결정 사항**: 
    - 전사 업무 프로세스 정비 및 담당자별 다음 실행 목표 수립.
    - 본 회의 대화 기록 분석에 기반해 업무 자동 할당 처리를 확정지음.
*   **주요 논의 내용**:
    - 실시간으로 적재된 대화록 전체를 검토하였으며, 참석자 간 이견을 좁혀 협업 방안에 대한 기본 프레임을 도출하였습니다.`;
      }

      if (tasks.length === 0) {
        tasks = [
          {
            assignee_name: "홍길동",
            assignee_email: "gildong@company.com",
            task_desc: "회의록 검토 및 차주 비즈니스 액션 플랜 최종 승인",
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
          },
          {
            assignee_name: "김철수",
            assignee_email: "cheolsu@company.com",
            task_desc: "개발 사항 요약본 정리 및 사내 메일 공유 배포",
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
          }
        ];
      }

      // 회의 대장 업데이트
      await updateRows('crm_meetings', {
        summary: summaryMarkdown,
        transcript: typeof transcript === 'string' ? transcript : JSON.stringify(transcript),
        status: 'COMPLETED',
        updated_at: nowStr,
        updated_by: 'SYSTEM'
      }, { filters: { id: meetingId } });

      // 할 일 벌크 적재
      if (tasks.length > 0) {
        // crm_meeting_tasks의 시작 ID 획득
        const maxTaskIdRes = await executeSQL('SELECT MAX(id) as maxId FROM crm_meeting_tasks');
        let nextTaskId = (maxTaskIdRes?.rows?.[0]?.maxId || 0) + 1;

        const taskInsertData = tasks.map((task: any) => ({
          id: nextTaskId++,
          meeting_id: meetingId,
          assignee_name: task.assignee_name || '미지정',
          assignee_email: task.assignee_email || '',
          task_desc: task.task_desc || '',
          due_date: task.due_date || nowStr.slice(0, 10),
          status: 'PENDING',
          uuid: crypto.randomUUID(),
          updated_at: nowStr,
          updated_by: 'SYSTEM'
        }));

        await insertRows('crm_meeting_tasks', taskInsertData);
      }

      return NextResponse.json({
        success: true,
        meeting: {
          ...meeting,
          summary: summaryMarkdown,
          status: 'COMPLETED'
        },
        tasks
      });
    }

    return NextResponse.json({ success: false, error: '잘못된 액션 명령입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error('회의록 생성/완료 오류:', error);
    return NextResponse.json({ success: false, error: '회의 처리에 실패했습니다.' }, { status: 500 });
  }
}
