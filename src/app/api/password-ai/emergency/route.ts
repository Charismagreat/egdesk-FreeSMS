import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import Database from 'better-sqlite3';
import os from 'os';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

// 📂 SQLite3 DB 인스턴스 획득 헬퍼
function getDirectDB() {
  const homeDir = os.homedir();
  const appData = process.env.APPDATA || path.join(homeDir, 'AppData/Roaming');
  const paths = [
    path.join(appData, 'EGDesk/database/user_data.db'),
    path.join(appData, 'egdesk/database/user_data.db')
  ];
  
  let targetPath = '';
  for (const p of paths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }
  
  if (!targetPath) {
    targetPath = paths[0];
  }

  const normalizedPath = targetPath.replace(/\\/g, '/');
  return new Database(normalizedPath);
}

// 🔑 세션 및 사용자 권한 획득 헬퍼
async function verifySession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) return { isAuthorized: false, role: 'GUEST', name: 'Unknown', operatorId: null };
    
    const payload = decodeJwt(token);
    const role = (payload.role as string || '').toUpperCase();
    const name = payload.name as string || payload.username as string || 'Unknown';
    const operatorId = Number(payload.id) || null;
    
    return {
      isAuthorized: role === 'SUPER_ADMIN' || role === 'OPERATOR',
      role,
      name,
      operatorId
    };
  } catch (e) {
    return { isAuthorized: false, role: 'GUEST', name: 'Unknown', operatorId: null };
  }
}

// [GET] 비상 복구 요청 리스트 조회
export async function GET(request: Request) {
  let db: any = null;
  try {
    const { isAuthorized, role, operatorId } = await verifySession();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 로그인이 필요합니다.' }, { status: 403 });
    }

    db = getDirectDB();
    
    // 만료된 요청들에 대해 자동으로 EXPIRED 처리 스캔
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    db.prepare(`
      UPDATE crm_credential_emergency_requests 
      SET status = 'EXPIRED' 
      WHERE status = 'APPROVED' AND expires_at < ?
    `).run(nowKst);

    let requests = [];
    if (role === 'SUPER_ADMIN') {
      // 최고관리자는 모든 결재 대기 및 이력 조회 가능
      requests = db.prepare(`
        SELECT er.*, cv.asset_name, cv.category, cv.login_id, op.name as requester_name 
        FROM crm_credential_emergency_requests er
        LEFT JOIN crm_credential_vault cv ON er.credential_id = cv.id
        LEFT JOIN crm_operators op ON er.requester_id = op.id
        ORDER BY er.id DESC
      `).all();
    } else {
      // 일반 운영자는 본인이 요청한 비상 결재 요청 이력만 조회 가능
      requests = db.prepare(`
        SELECT er.*, cv.asset_name, cv.category, cv.login_id, op.name as requester_name 
        FROM crm_credential_emergency_requests er
        LEFT JOIN crm_credential_vault cv ON er.credential_id = cv.id
        LEFT JOIN crm_operators op ON er.requester_id = op.id
        WHERE er.requester_id = ?
        ORDER BY er.id DESC
      `).all(operatorId);
    }

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("GET Emergency Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}

// [POST] 비상 복구 요청 등록 / 승인 / 반려 처리
export async function POST(request: Request) {
  let db: any = null;
  try {
    const { isAuthorized, role, name, operatorId } = await verifySession();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 로그인이 필요합니다.' }, { status: 403 });
    }

    const { action, requestId, credentialId, requestReason } = await request.json();
    db = getDirectDB();

    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

    // 1. 비상 복구 요청 생성 (일반 직원 신청)
    if (action === 'request') {
      if (!credentialId || !requestReason) {
        return NextResponse.json({ success: false, error: '조회할 비밀번호 정보 또는 요청 사유가 누락되었습니다.' }, { status: 400 });
      }

      // 이미 승인된 진행 건이 있는지 검사 (중복 요청 방지)
      const existing = db.prepare(`
        SELECT * FROM crm_credential_emergency_requests 
        WHERE credential_id = ? AND requester_id = ? AND status = 'PENDING'
      `).get(credentialId, operatorId);

      if (existing) {
        return NextResponse.json({ success: false, error: '이미 해당 자산에 대해 승인 대기 중인 비상 요청이 존재합니다.' }, { status: 400 });
      }

      db.prepare(`
        INSERT INTO crm_credential_emergency_requests (credential_id, requester_id, request_reason, status, created_at)
        VALUES (?, ?, ?, 'PENDING', ?)
      `).run(credentialId, operatorId, requestReason, nowKst);

      // 감사 로그에 요청 생성 남기기
      db.prepare(`
        INSERT INTO crm_credential_audit_logs (credential_id, operator_id, operator_name, action_type, access_reason, created_at)
        VALUES (?, ?, ?, 'VIEW_ENCRYPTED', ?, ?)
      `).run(credentialId, operatorId, name, `비상 복구 조회 결재 신청: ${requestReason}`, nowKst);

      return NextResponse.json({ success: true, message: '비상 복구 요청이 등록되었습니다. 최고관리자의 승인을 기다려 주세요.' });
    }

    // 2. 최고관리자 결재 처리 (승인 / 반려)
    if (action === 'approve' || action === 'reject') {
      if (role !== 'SUPER_ADMIN') {
        return NextResponse.json({ success: false, error: '승인/반려 권한은 최고관리자에게만 있습니다.' }, { status: 403 });
      }

      if (!requestId) {
        return NextResponse.json({ success: false, error: '결재할 요청 ID가 누락되었습니다.' }, { status: 400 });
      }

      const req = db.prepare('SELECT * FROM crm_credential_emergency_requests WHERE id = ?').get(requestId);
      if (!req) {
        return NextResponse.json({ success: false, error: '해당 결재 요청 건을 찾을 수 없습니다.' }, { status: 404 });
      }

      if (req.status !== 'PENDING') {
        return NextResponse.json({ success: false, error: '이미 처리 완료된 결재 건입니다.' }, { status: 400 });
      }

      if (action === 'approve') {
        // 승인 시점부터 24시간 동안 유효한 expires_at 계산
        const expiresTime = new Date(Date.now() + (9 + 24) * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

        db.prepare(`
          UPDATE crm_credential_emergency_requests
          SET status = 'APPROVED', approved_by = ?, approved_at = ?, expires_at = ?
          WHERE id = ?
        `).run(name, nowKst, expiresTime, requestId);

        // 감사 로그 기록
        db.prepare(`
          INSERT INTO crm_credential_audit_logs (credential_id, operator_id, operator_name, action_type, access_reason, created_at)
          VALUES (?, ?, ?, 'DECRYPT_APPROVE', ?, ?)
        `).run(req.credential_id, operatorId, name, `비상 복구 요청 승인 완료 (24시간 조회 허가)`, nowKst);

        return NextResponse.json({ success: true, message: '비상 복구 요청이 정상 승인되었습니다. 해당 직원은 24시간 동안 비밀번호를 복호화 열람할 수 있습니다.' });
      }

      if (action === 'reject') {
        db.prepare(`
          UPDATE crm_credential_emergency_requests
          SET status = 'REJECTED'
          WHERE id = ?
        `).run(requestId);

        return NextResponse.json({ success: true, message: '비상 복구 요청이 반려 처리되었습니다.' });
      }
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 액션입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error("POST Emergency Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}
