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
      
      // 🚀 [RPA 지능형 파이프라인] 지출관리AI 페이지(crm_expenses 테이블)와 실시간 연동
      const tx = db.prepare("SELECT * FROM card_transactions WHERE id = ?").get(txId);
      if (tx) {
        const expId = `exp-card-${txId}`;
        const rawDate = tx.approved_date || tx.created_at || new Date().toISOString();
        const expenseDate = rawDate.slice(0, 10);
        
        const aiAnalysisObj = {
          payee: tx.merchant_name || "",
          approval_number: tx.approval_number || "",
          card_transaction_id: txId
        };
        const aiAnalysisStr = JSON.stringify(aiAnalysisObj);
        const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
        
        db.prepare(`
          INSERT OR REPLACE INTO crm_expenses (
            id, title, category, amount, expense_date, payment_method, 
            attachment_url, ai_analysis, memo, actual_expense_date, 
            deduction_amount, transfer_fee, approval_status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          expId,
          tx.merchant_name || "법인카드 거래", 
          tx.category || "직원식대", 
          Number(tx.amount || 0), 
          expenseDate, 
          `법인카드(${tx.card_company_name || '신용카드'})`, 
          receiptUrl, 
          aiAnalysisStr, 
          tx.memo || "", 
          expenseDate, 
          0, 
          0, 
          'APPROVED', 
          nowStr
        );
        console.log(`[RPA Sync] 지출관리AI 장부(crm_expenses)에 거래 ${expId} 자동 인서트/갱신 완료!`);
      }
      
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
