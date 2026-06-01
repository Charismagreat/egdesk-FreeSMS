import { NextResponse } from 'next/server';
import { 
  updateRows,
  insertRows
} from '../../../../../egdesk-helpers';

/**
 * POST 핸들러: 수동 결재 승인 / 반려 처리 (수동 승인 시에도 A등급 최고 기밀 기본 유지)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { document_id, approver_id, status, comments } = body;

    if (!document_id || !approver_id || !status) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. approvals 테이블 결재 승인/반려 갱신
    await updateRows(
      'document_approvals',
      {
        status: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        comments: comments || (status === 'APPROVED' ? '수동 승인 완료.' : '결재가 반려되었습니다.'),
        processed_at: now
      },
      {
        filters: {
          document_id,
          approver_id
        }
      }
    );

    // 2. documents 테이블 문서 상태 갱신 (수동 승인은 APPROVED_MANUAL, 반려는 REJECTED)
    // [보안 고지 🔒] 수동 승인이 완료되어도 최초의 A등급(최고기밀) 보안 설정은 그대로 안전 유지!
    await updateRows(
      'knowledge_documents',
      {
        status: status === 'APPROVED' ? 'APPROVED_MANUAL' : 'REJECTED',
        updated_at: now
      },
      {
        filters: {
          document_id
        }
      }
    );

    // 추가 감사 로그 인서트
    await insertRows('document_approvals', [{
      document_id,
      approver_id: 'SYSTEM_AUDITOR',
      step_number: 50,
      step_type: 'REFERRER',
      status: 'APPROVED',
      comments: `인적 결재자 [${approver_id}]에 의해 기안서 최종 심사가 처리되었습니다. 상태: ${status === 'APPROVED' ? '승인' : '반려'}. 제로 트러스트 기조에 따라 A등급 최고기밀 자물쇠 락 상태가 안전 유지됩니다.`,
      processed_at: now
    }]);

    return NextResponse.json({ 
      success: true, 
      message: `성공적으로 결재가 ${status === 'APPROVED' ? '승인' : '반려'}되었습니다. 보안 락은 A등급(최고기밀)으로 엄격히 유지됩니다.`,
      document_id,
      status: status === 'APPROVED' ? 'APPROVED_MANUAL' : 'REJECTED'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
