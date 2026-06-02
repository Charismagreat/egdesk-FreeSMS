import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];
    const txId = formData.get("id") as string;

    if (!files || files.length === 0 || !txId) {
      return NextResponse.json(
        { success: false, error: "최소 한 장 이상의 영수증 사진 파일과 거래 ID는 필수입니다." },
        { status: 400 }
      );
    }

    // public/uploads/receipts 폴더가 없으면 자동 생성
    const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const savedUrls: string[] = [];

    // 복수 파일 순차 저장 처리
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split(".").pop() || "jpg";
      const filename = `receipt_${Date.now()}_${txId}_${i}.${fileExtension}`;
      const filePath = path.join(uploadDir, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      savedUrls.push(`/uploads/receipts/${filename}`);
    }

    const receiptUrl = savedUrls.join(",");

    // 로컬 SQLite DB 업데이트
    const Database = require("better-sqlite3");
    const os = require("os");
    
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

    if (targetPath) {
      const db = new Database(targetPath);
      const stmt = db.prepare("UPDATE card_transactions SET receipt_url = ?, updated_at = datetime('now') WHERE id = ?");
      stmt.run(receiptUrl, txId);
      db.close();
      
      console.log(`[Receipt Upload] 거래 ${txId}에 영수증 등록 완료: ${receiptUrl}`);
    } else {
      throw new Error("로컬 DB 파일을 찾을 수 없습니다.");
    }

    return NextResponse.json({
      success: true,
      data: { receiptUrl }
    });
  } catch (error: any) {
    console.error("Receipt Upload Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "영수증 업로드 중 시스템 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
