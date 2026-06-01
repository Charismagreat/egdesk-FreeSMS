export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { insertRows } from '../../../../../egdesk-helpers';

/**
 * 💬 고객사 이지봇(웹 화면)에서 전송한 실시간 피드백을 로컬 SQLite DB에 안전하게 적재하는 API
 * 
 * - 대행사 솔라피, 알리고 등 유료 알림 업체를 거치지 않는 무상 보존 방식입니다.
 * - 수집된 피드백 데이터는 `user_feedbacks` 테이블에 저장되어 관리자가 조회하고, 
 *   카카오 오픈빌더 스킬(스킬 웹훅)을 통해 개발자 카톡으로 안전하게 무료 조회할 수 있게 연동됩니다.
 */
export async function POST(req: Request) {
  try {
    const { companyName, senderName, contact, feedbackType, feedbackText } = await req.json();

    if (!feedbackText) {
      return NextResponse.json({ success: false, error: '피드백 내용이 누락되었습니다.' }, { status: 400 });
    }

    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    
    // user_feedbacks 테이블 스펙에 맞추어 컬럼 데이터 가공 매핑
    const feedbackId = `FB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullUserPrompt = `[고객사: ${companyName} / 제보자: ${senderName} (${contact}) / 유형: ${feedbackType}]
${feedbackText}`;

    // SQLite DB에 피드백 데이터 직접 인서트 실행
    await insertRows('user_feedbacks', [{
      id: feedbackId,
      user_prompt: fullUserPrompt,
      detected_type: feedbackType === '버그 제보' ? 'bug' : feedbackType === '기능 제안' ? 'feature_request' : 'other',
      current_url: '/hr/attendance', // 피드백이 발생한 도메인 경로 대입
      resolved_status: 'pending',
      created_at: nowStr
    }]);

    console.log(`[피드백 DB 저장 완료] ID: ${feedbackId}, 유형: ${feedbackType}`);

    return NextResponse.json({
      success: true,
      message: '피드백이 데이터베이스에 안전하게 기록되었습니다. 🟢'
    });

  } catch (error: any) {
    console.error('Feedback DB Store API Support Error:', error);
    return NextResponse.json({ success: false, error: error.message || '서버 오류로 인해 피드백 저장에 실패했습니다.' }, { status: 500 });
  }
}

