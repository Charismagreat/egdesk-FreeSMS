export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import crypto from 'crypto';
import fs from 'fs';

const dbPaths = [
  'C:/Users/CHARISMA/AppData/Roaming/EGDesk/user-data/development/projects/49a59fa4-40b6-40f4-8c3d-0231be79c7f9/user_data.db',
  'C:/Users/CHARISMA/AppData/Roaming/egdesk/user-data/development/projects/49a59fa4-40b6-40f4-8c3d-0231be79c7f9/user_data.db'
];

function getActiveDb() {
  for (const dbPath of dbPaths) {
    if (fs.existsSync(dbPath)) {
      return new Database(dbPath, { fileMustExist: true });
    }
  }
  throw new Error('데이터베이스 파일을 찾을 수 없습니다.');
}

function getKoreanTimestamp() {
  const date = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

async function verifyUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return { isAuthorized: false, username: 'admin' };
    const payload = decodeJwt(token);
    return {
      isAuthorized: true,
      username: (payload.username || 'admin') as string
    };
  } catch {
    return { isAuthorized: false, username: 'admin' };
  }
}

/**
 * GET: 등록되어 있고 활성화된 자동 승인(Auto-bypass)용 엑셀 헤더 시그니처 목록 조회
 * (소프트 삭제 필터링 규칙 준수)
 */
export async function GET() {
  let db;
  try {
    db = getActiveDb();
    
    // 테이블 존재 여부 확인 가드 (마이그레이션 전일 경우 빈 리스트 반환)
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='crm_excel_signatures'").get();
    if (!tableExists) {
      return NextResponse.json({ success: true, signatures: [] });
    }

    const rows = db.prepare(`
      SELECT header_signature, mapping_info, partner_name, transaction_type 
      FROM crm_excel_signatures 
      WHERE is_auto_approve = 1 AND deleted_at IS NULL
    `).all() as any[];
    
    const signatures = rows.map(r => r.header_signature);
    return NextResponse.json({ success: true, signatures, configs: rows });
  } catch (error: any) {
    console.error("GET /api/estimates/excel-signatures error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}

/**
 * POST: 엑셀 헤더 시그니처 신규 학습 등록 및 갱신(Upsert)
 */
export async function POST(req: Request) {
  const { username } = await verifyUser();
  let db;
  try {
    const body = await req.json();
    const { header_signature, partner_name, transaction_type, mapping_info } = body;

    if (!header_signature) {
      return NextResponse.json({ success: false, error: 'header_signature가 누락되었습니다.' }, { status: 400 });
    }

    db = getActiveDb();
    const timestamp = getKoreanTimestamp();

    // 테이블 존재 여부 가드 및 동적 생성 (안전을 위해 PRAGMA 검사)
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='crm_excel_signatures'").get();
    if (!tableExists) {
      return NextResponse.json({ success: false, error: 'crm_excel_signatures 테이블이 준비되지 않았습니다.' }, { status: 500 });
    }

    // 1. 이미 존재하는 시그니처인지 확인
    const existing = db.prepare(`
      SELECT id FROM crm_excel_signatures WHERE header_signature = ?
    `).get(header_signature) as any;

    if (existing) {
      // 2. 존재하면 복원 및 정보 업데이트
      db.prepare(`
        UPDATE crm_excel_signatures 
        SET is_auto_approve = 1,
            deleted_at = NULL,
            deleted_by = NULL,
            partner_name = ?,
            transaction_type = ?,
            mapping_info = ?,
            updated_at = ?,
            updated_by = ?
        WHERE id = ?
      `).run(partner_name || null, transaction_type || null, mapping_info || null, timestamp, username, existing.id);
      console.log(`[Excel Signature Auto-Approve] Updated and restored existing signature ID: ${existing.id}`);
    } else {
      // 3. 존재하지 않으면 감사 컬럼들과 함께 새로 등록
      const uuid = crypto.randomUUID();
      db.prepare(`
        INSERT INTO crm_excel_signatures (
          header_signature, partner_name, transaction_type, is_auto_approve, mapping_info, created_at, uuid, updated_at, updated_by
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)
      `).run(header_signature, partner_name || null, transaction_type || null, mapping_info || null, timestamp, uuid, timestamp, username);
      console.log(`[Excel Signature Auto-Approve] Created new signature for: ${header_signature}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/estimates/excel-signatures error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}
