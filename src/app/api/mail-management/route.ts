export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

// 로컬 user_data.db 연결 헬퍼 함수
function getDbConnection() {
  const homeDir = os.homedir();
  const appData = process.env.APPDATA || path.join(homeDir, 'AppData/Roaming');
  const dbPath = path.join(appData, 'EGDesk/database/user_data.db');
  return new Database(dbPath);
}

// GET: 관제 히스토리 조회 및 대시보드 통계 정보 생성
export async function GET(req: Request) {
  let db;
  try {
    db = getDbConnection();

    // 1. 수집 설정 키 가져오기
    let mailInterval = '5';
    let mailEnabled = '1';
    try {
      const rowInterval = db.prepare("SELECT value FROM system_settings WHERE key = ?").get('mail_collection_interval');
      if (rowInterval) mailInterval = rowInterval.value;

      const rowEnabled = db.prepare("SELECT value FROM system_settings WHERE key = ?").get('mail_collection_enabled');
      if (rowEnabled) mailEnabled = rowEnabled.value;
    } catch (e) {}

    // 2. 메일 관제 로그 전체 가져오기
    const logs = db.prepare("SELECT * FROM system_mail_logs ORDER BY created_at DESC").all();

    // 3. 통계 분석
    const totalCalls = logs.length;
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    const purposeMap: Record<string, { calls: number; tokens: number }> = {};
    const intentCounts: Record<string, number> = {
      ORDER_REQUEST: 0,
      ESTIMATE_REQUEST: 0,
      COMPLAINT: 0,
      REPORT: 0,
      SPAM: 0
    };

    logs.forEach((log: any) => {
      // 리스크 수준 집계
      if (log.risk_level === 'HIGH') highRiskCount++;
      else if (log.risk_level === 'MEDIUM') mediumRiskCount++;
      else lowRiskCount++;

      // 의도 분류 집계
      const intent = log.intent || 'REPORT';
      if (intentCounts[intent] !== undefined) {
        intentCounts[intent]++;
      } else {
        intentCounts[intent] = 1;
      }
    });

    const purposes = Object.entries(intentCounts).map(([purpose, count]) => ({
      purpose,
      calls: count,
      tokens: count * 500 // 시각적인 차트를 위한 가중치 환산값
    })).sort((a, b) => b.calls - a.calls);

    const summary = {
      api_calls: totalCalls,
      high_risk: highRiskCount,
      medium_risk: mediumRiskCount,
      low_risk: lowRiskCount
    };

    return NextResponse.json({
      success: true,
      settings: {
        interval: mailInterval,
        enabled: mailEnabled === '1'
      },
      summary,
      purposes,
      recentLogs: logs
    });
  } catch (error: any) {
    console.error('메일 관제 AI API GET 에러:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}

// POST: 관제 설정 갱신 및 가상 메일 강제 수집 (자율 에이전트 구동)
export async function POST(req: Request) {
  let db;
  try {
    const { action, interval, enabled } = await req.json();
    db = getDbConnection();

    // [Action 1] 설정 업데이트 처리
    if (action === 'save_settings') {
      const stmt = db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)");
      db.transaction(() => {
        stmt.run('mail_collection_interval', String(interval || '5'));
        stmt.run('mail_collection_enabled', enabled ? '1' : '0');
      })();

      return NextResponse.json({ success: true, message: '관제 설정이 성공적으로 저장되었습니다.' });
    }

    // [Action 2] 가상 메일 실시간 자율 수집 및 AI 관제 연동 구동
    if (action === 'trigger_collection') {
      const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      
      // 시나리오용 가상 수신 메일 풀
      const demoMails = [
        {
          id: `MAIL-${Date.now()}-1`,
          sender: 'sales@gaskhem.co.kr (한국가스켐 김대리)',
          subject: '[긴급 발주] R-134a 에어컨 냉매 벌크 10파레트 납품 요청의 건',
          intent: 'ORDER_REQUEST',
          risk_level: 'HIGH',
          ai_summary: '동탄 물류창고 수급을 위한 R-134a 에어컨 냉매 벌크 10파레트 긴급 주문. 희망 납기 6월 18일.',
          action_type: 'CREATE_ESTIMATE',
          action_result: '한국가스켐 10파레트 발주서 자동 생성 등록 완료',
          // estimates 테이블 데이터 자동 생성을 위한 추가 정보
          orderData: {
            estimateId: `EST-AUTO-${Date.now().toString().slice(-6)}`,
            partnerName: '한국가스켐(주)',
            partnerPhone: '02-888-9999',
            totalAmount: 12000000,
            productId: 'PROD-WS-01',
            productName: 'R-134a 에어컨 냉매 벌크',
            quantity: 10,
            unitPrice: 1200000
          }
        },
        {
          id: `MAIL-${Date.now()}-2`,
          sender: 'bongdam@bluehands.co.kr (현대블루핸즈 봉담점 박공장장)',
          subject: '[품질 컴플레인] 지난주 입고된 콤프레샤 어셈블리 일부 크랙 발생 건',
          intent: 'COMPLAINT',
          risk_level: 'HIGH',
          ai_summary: '아반떼 CN7용 콤프레샤 어셈블리 35대 중 3대에서 하우징 크랙 및 오유 누유 발견. 긴급 원인분석 요청.',
          action_type: 'CREATE_TASK',
          action_result: '홍길동 팀장에게 콤프레샤 크랙 NCR 원인분석 스냅태스크 자동 발행 완료',
          // snaptasks 테이블 데이터 자동 생성을 위한 추가 정보
          taskData: {
            taskId: `TSK-AUTO-${Date.now().toString().slice(-6)}`,
            title: '[긴급] 현대블루핸즈 콤프레샤 크랙 품질 NCR 조치 건',
            partnerId: 'B-BLUE-01',
            contentText: '현대블루핸즈 봉담점 납품분 콤프레샤 3대 하우징 크랙 하자 접수. 신속한 사후 교환 및 기술팀 원인 분석 결재 자동 상신 요망.',
            assignedWorker: '홍길동'
          }
        },
        {
          id: `MAIL-${Date.now()}-3`,
          sender: 'supply@daejinscm.co.kr (대진에스씨엠 최대진 대표)',
          subject: '알루미늄 6061-T6 방열재 시험 성적서 전달의 건',
          intent: 'REPORT',
          risk_level: 'LOW',
          ai_summary: '알루미늄 방열 판재 2.0T 규격의 시험 성적서 공식 첨부 전송.',
          action_type: 'NONE',
          action_result: 'R&D 공유용 단순 수신 확인'
        }
      ];

      let addedCount = 0;
      let aiTokenUsage = 0;

      // 트랜잭션 내에서 메일 수집 적재 및 비즈니스 연동 처리 실행
      db.transaction(() => {
        for (const mail of demoMails) {
          // 중복 수집 방지
          const exists = db.prepare("SELECT 1 FROM system_mail_logs WHERE subject = ?").get(mail.subject);
          if (exists) continue;

          // 1. 관제 로그 테이블에 저장
          db.prepare(`
            INSERT INTO system_mail_logs (id, sender, subject, received_at, ai_summary, intent, risk_level, action_type, action_result, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            mail.id,
            mail.sender,
            mail.subject,
            nowStr,
            mail.ai_summary,
            mail.intent,
            mail.risk_level,
            mail.action_type,
            mail.action_result,
            nowStr
          );

          // 2. 비즈니스 자동 연동 액션 수행
          if (mail.action_type === 'CREATE_ESTIMATE' && mail.orderData) {
            const od = mail.orderData;
            // crm_estimates 추가
            db.prepare(`
              INSERT INTO crm_estimates (id, type, direction_status, partner_name, partner_phone, total_amount, file_url, ai_parsed, created_at, uuid)
              VALUES (?, 'INBOUND', 'RECEIVED', ?, ?, ?, NULL, 1, ?, ?)
            `).run(
              od.estimateId,
              od.partnerName,
              od.partnerPhone,
              od.totalAmount,
              nowStr,
              `est-uuid-${od.estimateId}`
            );

            // crm_estimate_items 추가
            db.prepare(`
              INSERT INTO crm_estimate_items (estimate_id, product_id, product_name, quantity, unit_price, amount)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              od.estimateId,
              od.productId,
              od.productName,
              od.quantity,
              od.unitPrice,
              od.totalAmount
            );
          } else if (mail.action_type === 'CREATE_TASK' && mail.taskData) {
            const td = mail.taskData;
            // crm_snaptasks 추가
            db.prepare(`
              INSERT INTO crm_snaptasks (id, title, status, partner_id, created_at, updated_at)
              VALUES (?, ?, 'ACTIVE', ?, ?, ?)
            `).run(
              td.taskId,
              td.title,
              td.partnerId,
              nowStr,
              nowStr
            );

            // crm_snaptask_items 추가
            db.prepare(`
              INSERT INTO crm_snaptask_items (task_id, content_text, file_url, file_type, ai_analysis, created_at)
              VALUES (?, ?, NULL, 'TEXT', ?, ?)
            `).run(
              td.taskId,
              td.contentText,
              JSON.stringify({ risk: "HIGH", alert: "품질 NCR 크랙 클레임" }),
              nowStr
            );
          }

          // 3. 자율 관제 중 Gemini API 사용 가상 토큰 로그 적재 (감사 대시보드 연동용)
          aiTokenUsage += 1650; // 메일당 평균 1,650 토큰 소모
          db.prepare(`
            INSERT INTO ai_token_usage_logs (id, model, purpose, prompt_tokens, completion_tokens, total_tokens, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            `TKM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            'gemini-3.5-flash',
            'mail-ai-agent',
            1200,
            450,
            1650,
            nowStr
          );

          addedCount++;
        }
      })();

      return NextResponse.json({
        success: true,
        addedCount,
        message: addedCount > 0 
          ? `신규 메일 ${addedCount}건을 실시간 수집하여 AI 의도 분석 및 비즈니스 연동 처리를 성공적으로 수행하였습니다.`
          : '최신 메일이 이미 동기화되어 있습니다. 신규 수신된 메일이 없습니다.'
      });
    }

    return NextResponse.json({ success: false, error: '잘못된 액션 요청입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error('메일 관제 AI API POST 에러:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}
