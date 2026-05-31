import { NextResponse } from 'next/server';
import { queryTable, executeSQL, listTables, insertRows, createTable } from '../../../../egdesk-helpers';
import fs from 'fs';
import path from 'path';

let isFeedbackTableInitialized = false;

// user_feedbacks 테이블이 존재하지 않을 시 멱등적으로 자동 신설하는 헬퍼
async function ensureFeedbackTableExists() {
  if (isFeedbackTableInitialized) return;
  try {
    const tableListResult = await listTables();
    let tables: string[] = [];
    if (tableListResult && tableListResult.tables) {
      tables = tableListResult.tables.map((t: any) => t.tableName || t);
    } else if (Array.isArray(tableListResult)) {
      tables = tableListResult.map((t: any) => t.tableName || t);
    } else if (typeof tableListResult === 'object') {
      tables = Object.keys(tableListResult);
    }
    
    const exists = tables.some((t: string) => t === 'user_feedbacks');
    if (!exists) {
      console.log('user_feedbacks 테이블이 존재하지 않아 신규 생성합니다.');
      await createTable(
        '사용자 피드백 및 버그 제보',
        [
          { name: 'id', type: 'TEXT', notNull: true },
          { name: 'user_prompt', type: 'TEXT', notNull: true },
          { name: 'detected_type', type: 'TEXT' }, // 'bug', 'feature_request', 'complaint', 'other'
          { name: 'current_url', type: 'TEXT' },
          { name: 'resolved_status', type: 'TEXT', defaultValue: 'pending' }, // 'pending', 'resolved', 'ignored'
          { name: 'created_at', type: 'TEXT' }
        ],
        {
          tableName: 'user_feedbacks',
          uniqueKeyColumns: ['id'],
          duplicateAction: 'skip'
        }
      );
    }
    isFeedbackTableInitialized = true;
  } catch (err) {
    console.error('user_feedbacks 테이블 초기화 실패:', err);
  }
}

// SELECT 쿼리만 통과시키고 데이터 파괴적인 쿼리는 원천 차단하는 유효성 검사 함수
function isSafeSelectQuery(sql: string): boolean {
  const normalized = sql.trim().toUpperCase();
  // 오직 SELECT 쿼리만 허용
  if (!normalized.startsWith('SELECT')) {
    return false;
  }
  // 위험 키워드가 SQL 내에 포함되어 있는지 검사
  const dangerousKeywords = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 
    'REPLACE', 'TRUNCATE', 'RENAME', 'GRANT', 'REVOKE'
  ];
  return !dangerousKeywords.some(keyword => {
    // 단어 경계(\b)를 기준으로 위험 키워드가 들어있는지 정규식 검사
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(normalized);
  });
}

export async function POST(req: Request) {
  try {
    await ensureFeedbackTableExists();
    const { prompt, chatHistory = [], localStorageContext = {}, currentUrl = '/' } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: '질문(prompt)이 누락되었습니다.' }, { status: 400 });
    }

    // 1. DB에서 구글 AI API 키 및 선택된 모델 조회
    const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    const apiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: '구글 AI API 키가 시스템에 등록되지 않았습니다. [설정 > AI 설정] 또는 DB의 system_settings 테이블에서 google_ai_api_key 값을 먼저 입력해 주세요.' 
      }, { status: 400 });
    }

    // 1-2. DB에서 구글 AI 모델명 조회 (없다면 3.5 기본값 적용)
    const modelRes = await queryTable('system_settings', { filters: { key: 'google_ai_model' } });
    const selectedModel = modelRes.rows && modelRes.rows.length > 0 && modelRes.rows[0].value
      ? modelRes.rows[0].value
      : 'gemini-3.5-flash';

    // 2. 현재 DB에 어떤 테이블들이 존재하는지 동적으로 리스트업
    let dbTablesInfo = '알 수 없음';
    try {
      const tablesResult = await listTables();
      if (tablesResult && tablesResult.tables) {
        dbTablesInfo = JSON.stringify(tablesResult.tables);
      } else if (Array.isArray(tablesResult)) {
        dbTablesInfo = JSON.stringify(tablesResult);
      } else {
        dbTablesInfo = JSON.stringify(tablesResult);
      }
    } catch (e) {
      console.warn('테이블 목록 조회 실패 (에이전트에 스키마 가이드 제한됨):', e);
    }

    // 3. STEP 1: 사용자의 질문을 분석하여 DB 조회가 필요한지 확인하고 SELECT 쿼리 생성
    const step1SystemPrompt = `
You are the database analysis engine of "EasyBot" (이지봇), a premium management assistant.
Your task is to analyze the user's inquiry and determine if it requires querying the SQLite database.

If it requires database queries:
- Write a valid SQLite SELECT query.
- You can query ANY table (including system_settings, customers, orders, transactions, message_logs, coupons, etc.).
- Ensure that the query is strictly a SELECT statement. Never suggest UPDATE, INSERT, or DELETE.
- Use explicit column names or '*' where appropriate.
- ALWAYS output in JSON format only.

Available Database Tables Info:
${dbTablesInfo}

Your response must be in valid JSON format ONLY:
{
  "requiresQuery": true,
  "sql": "SELECT COUNT(*) as total_customers FROM customers",
  "reason": "To count the number of registered customers in the database.",
  "requiresManual": false
}

If no database query is needed (e.g. general greeting, chit-chat, explaining browser state):
{
  "requiresQuery": false,
  "sql": null,
  "reason": "General conversation or browser context only.",
  "requiresManual": false
}

If the user is asking about how to use the system, menus, manuals, guides, or troubleshooting (such as resetting Naver blog session, setting point earning rates, coupon restrictions, multi-page checking, or point OTP security):
{
  "requiresQuery": false,
  "sql": null,
  "reason": "User is asking for system usage instructions or troubleshooting guides.",
  "requiresManual": true
}
`;

    const step1Response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: step1SystemPrompt }] },
        contents: [
          ...chatHistory.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1 // SQL 생성의 정확성을 극대화하기 위해 낮은 온도로 설정
        }
      })
    });

    if (!step1Response.ok) {
      const err = await step1Response.json();
      throw new Error(err.error?.message || 'Gemini Step-1 API 호출 중 오류가 발생했습니다.');
    }

    const step1Data = await step1Response.json();
    const step1Text = step1Data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // 🕒 Step 1 토큰 사용량 로깅
    if (step1Data.usageMetadata) {
      try {
        const u = step1Data.usageMetadata;
        const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
        await insertRows('ai_token_usage_logs', [{
          id: `TK1-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          model: selectedModel,
          purpose: 'easybot-sql-generation',
          prompt_tokens: u.promptTokenCount || 0,
          completion_tokens: u.candidatesTokenCount || 0,
          total_tokens: u.totalTokenCount || 0,
          created_at: nowStr
        }]);
      } catch (logErr) {
        console.error('Step 1 토큰 로깅 실패:', logErr);
      }
    }
    
    let sqlPlan = { requiresQuery: false, sql: null as string | null, reason: "", requiresManual: false };
    try {
      sqlPlan = JSON.parse(step1Text);
    } catch (e) {
      console.error('SQL Plan JSON 파싱 실패:', step1Text);
    }

    // 4. SQL 실행 (필요한 경우)
    let sqlQueryResult: any = null;
    let sqlError: string | null = null;

    if (sqlPlan.requiresQuery && sqlPlan.sql) {
      const sqlToExecute = sqlPlan.sql;
      
      // 보안 안전성 검증
      if (!isSafeSelectQuery(sqlToExecute)) {
        sqlError = `보안 제한: 오직 데이터 조회(SELECT) 쿼리만 안전하게 실행할 수 있습니다. 생성된 쿼리는 실행이 거부되었습니다: "${sqlToExecute}"`;
      } else {
        try {
          // SQLite DB raw 쿼리 실행
          const queryRes = await executeSQL(sqlToExecute);
          sqlQueryResult = queryRes;
        } catch (err: any) {
          console.error('SQL 실행 오류:', err);
          sqlError = err.message || String(err);
        }
      }
    }

    // 매뉴얼 지식 베이스 읽기 (RAG)
    let manualContext = "";
    if (sqlPlan.requiresManual) {
      try {
        const manualPath = path.join(process.cwd(), 'src', 'docs', 'egdesk-manual.md');
        manualContext = fs.readFileSync(manualPath, 'utf8');
      } catch (err) {
        console.error('매뉴얼 파일 읽기 실패:', err);
      }
    }

    // 5. STEP 2: 최종 대답 합성 (질문 + 로컬저장소 컨텍스트 + SQL 결과)
    const step2SystemPrompt = `
당신은 이지데스크(EGDESK) 프로젝트의 지능형 관리자 비서 "이지봇"(EasyBot)입니다.
사용자에게 친근하면서도 매우 전문적인 한글 어투로 대답해 주세요.

당신은 다음 리소스를 모두 활용하여 질문에 답할 수 있습니다:
1. 사용자 브라우저의 로컬 저장소(LocalStorage) 상태 스냅샷: 사용자의 현재 UI 상태, 토큰, 발송 대기 메시지 등이 들어있습니다.
2. 서버 SQLite 데이터베이스 조회 결과: 테이블 스키마나 쿼리를 직접 수행해 추출해 낸 최신 비즈니스 데이터입니다.
3. 시스템 공식 매뉴얼: 사용법 및 가이드 안내가 필요할 때 지식 베이스로 사용합니다.

답변 작성 규칙:
- 반드시 한국어로 대답해 주세요. (gemini_added_memories 규칙 필수 준수)
- 코드나 SQL 쿼리를 설명해야 할 때는 백틱(\`\`)을 활용해 가시성 높은 마크다운 코드로 표기해 주세요.
- 표(Table), 리스트, 볼드체 등을 활용하여 프리미엄 SaaS의 위젯 안에서 읽기 편한 완벽한 텍스트 구조로 만들어 주세요.
- 만약 SQL 쿼리가 실패했거나 오류가 있었다면, 관리자가 원인을 파악할 수 있도록 SQL 오류 메시지를 보여주며 원인 진단을 도와주세요.
- 챗봇 자체에서 데이터를 임의로 수정/삭제(UPDATE/DELETE)할 수 없음을 인지하되, SELECT를 통한 깊이 있는 데이터 분석 및 인사이트 제공에 집중해 주세요.
- [중요 💡] 만약 사용자가 특정 메뉴나 페이지로 직접 이동하기를 희망한다는 의도가 명백히 감지되면(예: "금융 정보 페이지로 가줘", "지출 관리 열어줘", "홈페이지 빌더 가자"), 최종 답변의 가장 마지막 줄에 정확하게 \`[REDIRECT:이동할_경로]\` (예: \`[REDIRECT:/finance]\`, \`[REDIRECT:/expenses]\`, \`[REDIRECT:/sms]\`, \`[REDIRECT:/settings]\`, \`[REDIRECT:/my-db]\`) 태그를 단독 라인으로 기입해 주세요. 시스템이 이를 감지하여 관리자에게 확인 창을 띄워 페이지를 실시간 자동 이동시킵니다.
- [중요 ⚠️] 만약 사용자가 시스템의 버그, 불편함, 건의사항, 개선 필요, 불만 사항, 또는 신규 기능 추가 요청 등을 명확하게 제기하는 의도가 감지되면(예: "재고 관리가 이상해요", "버그 있어요", "이 부분 추가해 줘", "너무 느려요", "이메일 알림 연동해줘"), 최종 답변의 가장 마지막 줄에 정확하게 \`[FEEDBACK:유형:핵심제보요약]\` (예: \`[FEEDBACK:bug:재고 바코드 리더 오작동]\`, \`[FEEDBACK:feature_request:이메일 알림 연동 희망]\`, \`[FEEDBACK:complaint:발송 속도가 너무 느림]\`) 태그를 단독 라인으로 기입해 주세요. (유형 후보: 'bug', 'feature_request', 'complaint', 'other'). 그리고 답변 내용에는 "제보해 주신 소중한 버그/의견은 관리자 피드백 보드에 정식으로 즉시 접수되었습니다. 개발팀과 함께 신속하게 검토하여 개선하겠습니다!"와 같이 상냥하고 신뢰감을 주는 접수 완료 멘트를 포함해 주세요.

${manualContext ? `\n============================\n[공식 시스템 매뉴얼 지식 베이스 (RAG)]\n${manualContext}\n\n-> 지시사항: 사용자가 시스템 사용법, 메뉴 구조, 가이드라인 등을 묻고 있습니다. 지어내지 말고, 위 매뉴얼 내용에 기반하여 가장 정확하고 친절하게 대답해 주세요.\n============================\n` : ''}
[LocalStorage 상태 스냅샷]:
${JSON.stringify(localStorageContext, null, 2)}

[SQLite DB 실행된 쿼리 및 결과]:
- 쿼리 실행 요구 여부: ${sqlPlan.requiresQuery ? '예' : '아니오'}
- 시도한 SQL 쿼리: ${sqlPlan.sql || '없음'}
- 쿼리 실행 결과: ${sqlQueryResult ? JSON.stringify(sqlQueryResult, null, 2) : '결과 없음'}
- 쿼리 에러 내용: ${sqlError || '에러 없음'}
`;

    const step2Response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: step2SystemPrompt }] },
        contents: [
          ...chatHistory.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.5
        }
      })
    });

    if (!step2Response.ok) {
      const err = await step2Response.json();
      throw new Error(err.error?.message || 'Gemini Step-2 API 호출 중 오류가 발생했습니다.');
    }

    const step2Data = await step2Response.json();
    let finalAnswer = step2Data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성하는 데 실패했습니다.";

    // [FEEDBACK:유형:내용] 태그 감지 시 user_feedbacks 테이블에 안전하게 접수 및 적재
    const feedbackMatch = finalAnswer.match(/\[FEEDBACK:(.*?):(.*?)\]/);
    if (feedbackMatch) {
      const detectedType = feedbackMatch[1].trim();
      const feedbackContent = feedbackMatch[2].trim();
      
      try {
        const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
        await insertRows('user_feedbacks', [{
          id: `FB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          user_prompt: feedbackContent,
          detected_type: detectedType,
          current_url: currentUrl,
          resolved_status: 'pending',
          created_at: nowStr
        }]);
        console.log(`[피드백 접수 처리 완료] 유형: ${detectedType}, 내용: ${feedbackContent}, 위치: ${currentUrl}`);
      } catch (dbErr) {
        console.error('피드백 접수 DB 저장 실패:', dbErr);
      }

      // 최종 답변 본문에서 개발용 트리거 태그 깔끔히 소거
      finalAnswer = finalAnswer.replace(/\[FEEDBACK:.*?\]/g, '').trim();
    }

    // 🕒 Step 2 토큰 사용량 로깅
    if (step2Data.usageMetadata) {
      try {
        const u = step2Data.usageMetadata;
        const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
        await insertRows('ai_token_usage_logs', [{
          id: `TK2-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          model: selectedModel,
          purpose: 'easybot-response',
          prompt_tokens: u.promptTokenCount || 0,
          completion_tokens: u.candidatesTokenCount || 0,
          total_tokens: u.totalTokenCount || 0,
          created_at: nowStr
        }]);
      } catch (logErr) {
        console.error('Step 2 토큰 로깅 실패:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      answer: finalAnswer,
      sql: sqlPlan.sql,
      sqlSuccess: sqlPlan.requiresQuery ? !sqlError : null,
      sqlError
    });

  } catch (error: any) {
    console.error('EasyBot API Error:', error);
    return NextResponse.json({ success: false, error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
