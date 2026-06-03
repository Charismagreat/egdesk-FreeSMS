import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';

export const dynamic = 'force-dynamic';

/**
 * PUT: 최고 관리자가 국세청 홈택스 자료(세금계산서, 면세계산서, 현금영수증)의 태그(memo)를 직접 수정합니다.
 */
export async function PUT(request: NextRequest) {
  try {
    // 🔑 1. 최고 관리자(SUPER_ADMIN 또는 PRESIDENT) 권한 검증
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "인증 토큰이 없습니다. 로그인 후 사용해 주세요." },
        { status: 401 }
      );
    }

    const payload = decodeJwt(token);
    const role = (payload.role as string || '').toUpperCase();
    
    if (role !== 'SUPER_ADMIN' && role !== 'PRESIDENT') {
      return NextResponse.json(
        { success: false, error: "최고 관리자(SUPER_ADMIN / PRESIDENT)만 수정할 권한이 있습니다." },
        { status: 403 }
      );
    }

    // 🔑 2. 파라미터 추출 및 유효성 검사
    const body = await request.json();
    const { id, type, memo } = body;

    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: "수정 대상 홈택스 거래 ID(id)와 유형(type)은 필수 값입니다." },
        { status: 400 }
      );
    }

    if (type !== 'invoice' && type !== 'exempt' && type !== 'cash') {
      return NextResponse.json(
        { success: false, error: "올바르지 않은 홈택스 유형(type)입니다. ('invoice', 'exempt', 'cash' 중 하나여야 합니다.)" },
        { status: 400 }
      );
    }

    // 🔑 3. 로컬 SQLite DB (financehub.db)에서 홈택스 거래 내역 업데이트
    const Database = require("better-sqlite3");
    const os = require("os");
    const path = require("path");
    const fs = require("fs");

    const homeDir = os.homedir();
    const appData = process.env.APPDATA || path.join(homeDir, "AppData/Roaming");
    const paths = [
      path.join(appData, "EGDesk/database/financehub.db"),
      path.join(appData, "egdesk/database/financehub.db")
    ];
    
    let targetPath = "";
    for (const p of paths) {
      if (fs.existsSync(p)) {
        targetPath = p;
        break;
      }
    }

    if (!targetPath) {
      return NextResponse.json(
        { success: false, error: "로컬 금융 DB(financehub.db)를 찾을 수 없습니다." },
        { status: 500 }
      );
    }

    console.log(`[Hometax Update API] Target DB found: ${targetPath}`);
    const db = new Database(targetPath);

    // 💡 [트리거 예외 안전망] better-sqlite3로 DB 업데이트 시 SQLite 내부 트리거가 호출하는 
    // 사용자 정의 동기화 함수가 에러를 발생시키지 않도록 더미 함수를 강제 주입해 줍니다.
    try {
      db.function('notify_change_financehub_changed', { varargs: true }, (...args: any[]) => {
        console.log('[SQLite Trigger Bypass] notify_change_financehub_changed dummy executed.');
        return null;
      });
    } catch (triggerErr: any) {
      console.log('Bypass trigger function register skipped:', triggerErr.message);
    }
    
    // 대상 테이블 결정
    const tableName = type === 'invoice' ? 'tax_invoices' :
                      type === 'exempt' ? 'tax_exempt_invoices' : 'cash_receipts';

    // memo를 해당 테이블에 저장합니다.
    const stmt = db.prepare(`
      UPDATE ${tableName} 
      SET memo = ? 
      WHERE id = ?
    `);
    
    const info = stmt.run(memo || "", id);
    db.close();

    if (info.changes === 0) {
      return NextResponse.json(
        { success: false, error: "지정된 ID의 국세청 거래 내역이 존재하지 않거나 변경사항이 없습니다." },
        { status: 404 }
      );
    }

    console.log(`[Hometax Update API] ${tableName} 업데이트 성공. ID: ${id}`);

    return NextResponse.json({
      success: true,
      message: "국세청 거래 내역 태그 수정이 성공적으로 완료되었습니다."
    });

  } catch (error: any) {
    console.error("Hometax transaction PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "국세청 거래 내역 수정 중 예외가 발생했습니다." },
      { status: 500 }
    );
  }
}
