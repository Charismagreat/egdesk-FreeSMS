import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import Database from 'better-sqlite3';
import os from 'os';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const ENCRYPTION_KEY = Buffer.from('egdesk_secret_password_ai_key_32', 'utf8'); // 32바이트 대칭 암호키

// 🔒 AES-256-GCM 복호화 함수
function decrypt(encryptedText: string, ivHex: string, authTagHex: string): string {
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return '복호화 실패';
  }
}

// 🔒 AES-256-GCM 암호화 함수
function encrypt(text: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    encryptedPassword: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag
  };
}

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

// [GET] 비밀번호 자산 목록 조회 및 특정 항목 열람 (복호화)
export async function GET(request: Request) {
  let db: any = null;
  try {
    const { isAuthorized, role, name, operatorId } = await verifySession();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 로그인이 필요합니다.' }, { status: 403 });
    }

    db = getDirectDB();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const assetId = searchParams.get('id') || '';
    const reason = searchParams.get('reason') || '';

    // 1. 단일 자산의 비밀번호 평문 조회 (복호화 및 감사 추적 기록)
    if (action === 'reveal') {
      if (!assetId) {
        return NextResponse.json({ success: false, error: '조회할 자산 ID가 없습니다.' }, { status: 400 });
      }

      // 대상 자산 조회
      const asset = db.prepare('SELECT * FROM crm_credential_vault WHERE id = ?').get(assetId);
      if (!asset) {
        return NextResponse.json({ success: false, error: '자산을 찾을 수 없습니다.' }, { status: 404 });
      }

      let isAllowed = false;
      
      // 권한 검증:
      // A. 본인이 소유자이거나 최고관리자인 경우 바로 열람 가능
      if (asset.owner_operator_id === operatorId || role === 'SUPER_ADMIN') {
        isAllowed = true;
      } else {
        // B. 동료 직원의 경우, 승인된 비상 복구 요청이 활성화되어 있는지 확인
        const now = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
        const activeRequest = db.prepare(`
          SELECT * FROM crm_credential_emergency_requests 
          WHERE credential_id = ? AND requester_id = ? AND status = 'APPROVED' AND expires_at > ?
        `).get(assetId, operatorId, now);

        if (activeRequest) {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        return NextResponse.json({ success: false, error: '열람 권한이 없습니다. 비상 복구 요청을 먼저 진행해 주세요.' }, { status: 403 });
      }

      // 복호화 수행
      const decryptedPassword = decrypt(asset.encrypted_password, asset.iv, asset.auth_tag);
      
      // 감사 로그 남기기
      const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      db.prepare(`
        INSERT INTO crm_credential_audit_logs (credential_id, operator_id, operator_name, action_type, access_reason, created_at)
        VALUES (?, ?, ?, 'DECRYPT_VIEW', ?, ?)
      `).run(assetId, operatorId, name, reason || '비밀번호 직접 조회', nowKst);

      return NextResponse.json({ success: true, password: decryptedPassword });
    }

    // 2. 비밀번호 자산 대장 목록 조회 (비밀번호는 마스킹 처리하여 보냄)
    // crm_operators와 JOIN하여 담당자명 획득
    const list = db.prepare(`
      SELECT cv.*, op.name as owner_name 
      FROM crm_credential_vault cv
      LEFT JOIN crm_operators op ON cv.owner_operator_id = op.id
      ORDER BY cv.id DESC
    `).all();

    // 동료 직원이 신청한 비상 요청 내역 조회하여 만료 여부 매핑
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    const activeRequests = db.prepare(`
      SELECT credential_id, expires_at 
      FROM crm_credential_emergency_requests 
      WHERE requester_id = ? AND status = 'APPROVED' AND expires_at > ?
    `).all(operatorId, nowKst);

    const activeRequestIds = new Set(activeRequests.map((r: any) => r.credential_id));

    // 민감 정보 가공 (평문 비밀번호 제거)
    const formattedList = list.map((item: any) => {
      const isOwner = item.owner_operator_id === operatorId;
      const isAdmin = role === 'SUPER_ADMIN';
      const hasApprovedEmergency = activeRequestIds.has(item.id);

      return {
        id: item.id,
        category: item.category,
        asset_name: item.asset_name,
        login_id: item.login_id,
        remarks: item.remarks,
        owner_operator_id: item.owner_operator_id,
        owner_name: item.owner_name || '미지정',
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        canRevealDirectly: isOwner || isAdmin,
        hasEmergencyAccess: hasApprovedEmergency
      };
    });

    // 감사 로그 조회 (최고관리자용)
    let auditLogs = [];
    if (role === 'SUPER_ADMIN') {
      auditLogs = db.prepare(`
        SELECT al.*, cv.asset_name 
        FROM crm_credential_audit_logs al
        LEFT JOIN crm_credential_vault cv ON al.credential_id = cv.id
        ORDER BY al.id DESC LIMIT 100
      `).all();
    }

    return NextResponse.json({ success: true, list: formattedList, auditLogs });
  } catch (error: any) {
    console.error("GET Password-AI Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}

// [POST] 신규 비밀번호 자산 등록
export async function POST(request: Request) {
  let db: any = null;
  try {
    const { isAuthorized, name, operatorId } = await verifySession();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 로그인이 필요합니다.' }, { status: 403 });
    }

    const { category, asset_name, login_id, password, remarks, owner_operator_id } = await request.json();
    if (!category || !asset_name || !password) {
      return NextResponse.json({ success: false, error: '필수 입력 항목이 누락되었습니다.' }, { status: 400 });
    }

    db = getDirectDB();

    // 비밀번호 AES-256-GCM 암호화
    const cryptoResult = encrypt(password);
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

    // 자산 추가
    const result = db.prepare(`
      INSERT INTO crm_credential_vault 
      (category, asset_name, login_id, encrypted_password, iv, auth_tag, remarks, owner_operator_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(
      category,
      asset_name,
      login_id || null,
      cryptoResult.encryptedPassword,
      cryptoResult.iv,
      cryptoResult.authTag,
      remarks || null,
      owner_operator_id || operatorId,
      nowKst,
      nowKst
    );

    // 감사 로그 남기기
    db.prepare(`
      INSERT INTO crm_credential_audit_logs (credential_id, operator_id, operator_name, action_type, access_reason, created_at)
      VALUES (?, ?, ?, 'CREATE', '신규 기밀 자산 등록', ?)
    `).run(result.lastInsertRowid, operatorId, name, nowKst);

    return NextResponse.json({ success: true, message: '신규 비밀번호 자산이 안전하게 암호화되어 등록되었습니다.' });
  } catch (error: any) {
    console.error("POST Password-AI Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}

// [PUT] 비밀번호 자산 수정 (인수인계 이전 포함)
export async function PUT(request: Request) {
  let db: any = null;
  try {
    const { isAuthorized, role, name, operatorId } = await verifySession();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 로그인이 필요합니다.' }, { status: 403 });
    }

    const { id, category, asset_name, login_id, password, remarks, owner_operator_id, status } = await request.json();
    if (!id || !category || !asset_name) {
      return NextResponse.json({ success: false, error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    db = getDirectDB();
    
    // 대상 자산 조회
    const asset = db.prepare('SELECT * FROM crm_credential_vault WHERE id = ?').get(id);
    if (!asset) {
      return NextResponse.json({ success: false, error: '수정할 자산을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 일반 직원은 자신이 소유한 비밀번호만 수정 가능, 최고관리자는 모든 자산 수정 가능
    if (asset.owner_operator_id !== operatorId && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: '자산 수정 권한이 없습니다.' }, { status: 403 });
    }

    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    
    let encrypted_password = asset.encrypted_password;
    let iv = asset.iv;
    let auth_tag = asset.auth_tag;

    // 만약 새 비밀번호가 입력된 경우 다시 암호화
    if (password && password.trim() !== '') {
      const cryptoResult = encrypt(password);
      encrypted_password = cryptoResult.encryptedPassword;
      iv = cryptoResult.iv;
      auth_tag = cryptoResult.authTag;
    }

    // 소유자 또는 인계 상태 보정
    let newStatus = status || asset.status;
    // 만약 소유주가 변경되었고 기존에 인수인계 대기 상태였다면 ACTIVE로 자동 원상 복구
    if (owner_operator_id && owner_operator_id !== asset.owner_operator_id && asset.status === 'INHERIT_PENDING') {
      newStatus = 'TRANSFERRED';
    }

    db.prepare(`
      UPDATE crm_credential_vault
      SET category = ?, asset_name = ?, login_id = ?, encrypted_password = ?, iv = ?, auth_tag = ?, remarks = ?, owner_operator_id = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      category,
      asset_name,
      login_id || null,
      encrypted_password,
      iv,
      auth_tag,
      remarks || null,
      owner_operator_id || asset.owner_operator_id,
      newStatus,
      nowKst,
      id
    );

    // 감사 로그 남기기
    db.prepare(`
      INSERT INTO crm_credential_audit_logs (credential_id, operator_id, operator_name, action_type, access_reason, created_at)
      VALUES (?, ?, ?, 'EDIT', '기밀 자산 정보 및 비밀번호 수정', ?)
    `).run(id, operatorId, name, nowKst);

    return NextResponse.json({ success: true, message: '자산 정보가 영구 수정 및 업데이트되었습니다.' });
  } catch (error: any) {
    console.error("PUT Password-AI Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}

// [DELETE] 비밀번호 자산 삭제
export async function DELETE(request: Request) {
  let db: any = null;
  try {
    const { isAuthorized, role, name, operatorId } = await verifySession();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: '권한이 없습니다. 로그인이 필요합니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: '삭제할 자산 ID가 지정되지 않았습니다.' }, { status: 400 });
    }

    db = getDirectDB();

    // 대상 자산 조회
    const asset = db.prepare('SELECT * FROM crm_credential_vault WHERE id = ?').get(id);
    if (!asset) {
      return NextResponse.json({ success: false, error: '삭제할 자산을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 소유자 혹은 최고관리자만 삭제 가능
    if (asset.owner_operator_id !== operatorId && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

    // 연동된 비상 복구 요청 및 감사 로그 삭제 처리 없이 자산만 삭제 (감사 로그는 참조를 위해 보존하거나, id 삭제 시 null 처리되므로 쿼리상 안전)
    db.prepare('DELETE FROM crm_credential_vault WHERE id = ?').run(id);
    
    // 감사 로그 남기기
    db.prepare(`
      INSERT INTO crm_credential_audit_logs (credential_id, operator_id, operator_name, action_type, access_reason, created_at)
      VALUES (NULL, ?, ?, 'DELETE', ?, ?)
    `).run(operatorId, name, `기밀 자산명 '${asset.asset_name}' 완전 제거`, nowKst);

    return NextResponse.json({ success: true, message: '비밀번호 자산이 영구 삭제되었습니다.' });
  } catch (error: any) {
    console.error("DELETE Password-AI Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}
