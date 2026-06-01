export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import * as xlsx from "xlsx";
import Database from "better-sqlite3";
import os from "os";
import path from "path";
import fs from "fs";

// 금액 및 정수 파싱 헬퍼
function parseAmount(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/,/g, "").trim();
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

// 공백 제거 헬퍼
function cleanStr(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

// 로컬 financehub.db 연결 객체 획득 헬퍼
function getFinanceHubDb() {
  const homeDir = os.homedir();
  const appData = process.env.APPDATA || path.join(homeDir, "AppData/Roaming");
  
  // 대소문자 방어적 폴더 검사 (EGDesk 및 egdesk)
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

  // fallback (폴더가 없으면 첫 번째 경로에 생성될 수 있게 함)
  if (!targetPath) {
    targetPath = paths[0];
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
  }

  return new Database(targetPath);
}

export async function POST(request: NextRequest) {
  let db: Database.Database | null = null;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const kind = formData.get("kind") as string; // 'sales', 'purchase', 'tax-exempt-sales', 'tax-exempt-purchase', 'cash-receipt'
    let businessNumber = formData.get("businessNumber") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "업로드된 세무 엑셀 파일이 없습니다." },
        { status: 400 }
      );
    }

    if (!kind) {
      return NextResponse.json(
        { success: false, error: "증빙 분류 코드가 지정되지 않았습니다." },
        { status: 400 }
      );
    }

    // 1. 엑셀 로딩 및 버퍼 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      return NextResponse.json(
        { success: false, error: "엑셀 시트 데이터를 읽을 수 없습니다." },
        { status: 400 }
      );
    }

    const rawRows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false });
    if (rawRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "엑셀 시트가 비어 있습니다." },
        { status: 400 }
      );
    }

    db = getFinanceHubDb();

    let tableName = "";
    let insertedCount = 0;
    let duplicateCount = 0;
    let queryPeriodStart = "";
    let queryPeriodEnd = "";

    // ==========================================
    // A. 전자세금계산서 (과세 매출/매입)
    // ==========================================
    if (kind === "sales" || kind === "purchase") {
      tableName = "tax_invoices";
      
      // 메타데이터 행(1행 index 0)에서 사업자등록번호 백필용 추출
      const metaRow = rawRows[0];
      let extractedBN = "";
      if (metaRow && Array.isArray(metaRow) && metaRow[1]) {
        extractedBN = String(metaRow[1]).replace(/\D/g, "");
      }
      if (!businessNumber && extractedBN) {
        businessNumber = extractedBN;
      }
      if (!businessNumber) {
        businessNumber = "MANUAL-IMPORT";
      }

      // 헤더: 6행 (index 5), 데이터: 7행 (index 6+)
      const headerRowIndex = 5;
      const dataRows = rawRows.slice(headerRowIndex + 1);

      // 준비된 INSERT OR IGNORE 구문
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO tax_invoices (
          business_number, invoice_type, 작성일자, 승인번호, 발급일자, 전송일자,
          공급자사업자등록번호, 공급자종사업장번호, 공급자상호, 공급자대표자명, 공급자주소,
          공급받는자사업자등록번호, 공급받는자종사업장번호, 공급받는자상호, 공급받는자대표자명, 공급받는자주소,
          합계금액, 공급가액, 세액, 전자세금계산서분류, 전자세금계산서종류, 발급유형, 비고, 영수청구구분,
          공급자이메일, 공급받는자이메일1, 공급받는자이메일2,
          품목일자, 품목명, 품목규격, 품목수량, 품목단가, 품목공급가액, 품목세액, 품목비고,
          excel_file_path
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?
        )
      `);

      const dates: string[] = [];

      // 트랜잭션 구동
      const transaction = db.transaction((rows) => {
        for (const row of rows) {
          if (!row || !Array.isArray(row) || row.length < 2) continue;
          
          const writingDate = cleanStr(row[0]); // 작성일자 (YYYYMMDD)
          const approvalNo = cleanStr(row[1]);  // 승인번호
          if (!writingDate || !approvalNo) continue;

          // 작성일자 포맷 정규화 (YYYYMMDD -> YYYY-MM-DD)
          let formattedDate = writingDate;
          if (writingDate.replace(/\D/g, "").length === 8) {
            const d = writingDate.replace(/\D/g, "");
            formattedDate = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
          }
          dates.push(formattedDate);

          const result = stmt.run(
            businessNumber,
            kind, // 'sales' | 'purchase'
            formattedDate,
            approvalNo,
            cleanStr(row[2]), // 발급일자
            cleanStr(row[3]), // 전송일자
            cleanStr(row[4]), // 공급자사업자등록번호
            cleanStr(row[5]),
            cleanStr(row[6]), // 공급자상호
            cleanStr(row[7]),
            cleanStr(row[8]),
            cleanStr(row[9]), // 공급받는자사업자등록번호
            cleanStr(row[10]),
            cleanStr(row[11]), // 공급받는자상호
            cleanStr(row[12]),
            cleanStr(row[13]),
            parseAmount(row[14]), // 합계금액
            parseAmount(row[15]), // 공급가액
            parseAmount(row[16]), // 세액
            cleanStr(row[17]),
            cleanStr(row[18]),
            cleanStr(row[19]),
            cleanStr(row[20]),
            cleanStr(row[21]),
            cleanStr(row[22]),
            cleanStr(row[23]),
            cleanStr(row[24]),
            cleanStr(row[25]), // 품목일자
            cleanStr(row[26]), // 품목명
            cleanStr(row[27]),
            cleanStr(row[28]),
            cleanStr(row[29]),
            parseAmount(row[30]), // 품목공급가액
            parseAmount(row[31]), // 품목세액
            cleanStr(row[32]),
            file.name
          );

          if (result.changes > 0) {
            insertedCount++;
          } else {
            duplicateCount++;
          }
        }
      });

      transaction(dataRows);

      if (dates.length > 0) {
        dates.sort();
        queryPeriodStart = dates[0];
        queryPeriodEnd = dates[dates.length - 1];
      }
    }
    // ==========================================
    // B. 면세 전자계산서 (면세 매출/매입)
    // ==========================================
    else if (kind === "tax-exempt-sales" || kind === "tax-exempt-purchase") {
      tableName = "tax_exempt_invoices";

      // 메타데이터 행(1행 index 0)에서 사업자등록번호 백필용 추출
      const metaRow = rawRows[0];
      let extractedBN = "";
      if (metaRow && Array.isArray(metaRow) && metaRow[1]) {
        extractedBN = String(metaRow[1]).replace(/\D/g, "");
      }
      if (!businessNumber && extractedBN) {
        businessNumber = extractedBN;
      }
      if (!businessNumber) {
        businessNumber = "MANUAL-IMPORT";
      }

      // 헤더 자동 감지 (작성일자가 첫 번째 열인 행 검색, fallback index 5)
      let headerRowIndex = 5;
      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const rRow = rawRows[r];
        if (rRow && rRow[0] === "작성일자" && rRow[1] === "승인번호") {
          headerRowIndex = r;
          break;
        }
      }

      const dataRows = rawRows.slice(headerRowIndex + 1);

      // 준비된 INSERT OR IGNORE 구문
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO tax_exempt_invoices (
          business_number, invoice_type, 작성일자, 승인번호, 발급일자, 전송일자,
          공급자사업자등록번호, 공급자종사업장번호, 공급자상호, 공급자대표자명, 공급자주소,
          공급받는자사업자등록번호, 공급받는자종사업장번호, 공급받는자상호, 공급받는자대표자명, 공급받는자주소,
          합계금액, 공급가액, 세액, 전자세금계산서분류, 전자세금계산서종류, 발급유형, 비고, 영수청구구분,
          공급자이메일, 공급받는자이메일1, 공급받는자이메일2,
          품목일자, 품목명, 품목규격, 품목수량, 품목단가, 품목공급가액, 품목세액, 품목비고,
          excel_file_path
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?
        )
      `);

      const dates: string[] = [];
      const invoiceType = kind === "tax-exempt-sales" ? "sales" : "purchase";

      const transaction = db.transaction((rows) => {
        for (const row of rows) {
          if (!row || !Array.isArray(row) || row.length < 2) continue;
          
          const writingDate = cleanStr(row[0]);
          const approvalNo = cleanStr(row[1]);
          if (!writingDate || !approvalNo) continue;

          let formattedDate = writingDate;
          if (writingDate.replace(/\D/g, "").length === 8) {
            const d = writingDate.replace(/\D/g, "");
            formattedDate = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
          }
          dates.push(formattedDate);

          const result = stmt.run(
            businessNumber,
            invoiceType,
            formattedDate,
            approvalNo,
            cleanStr(row[2]), // 발급일자
            cleanStr(row[3]), // 전송일자
            cleanStr(row[4]), // 공급자사업자등록번호
            cleanStr(row[5]),
            cleanStr(row[6]), // 공급자상호
            cleanStr(row[7]),
            cleanStr(row[8]),
            cleanStr(row[9]), // 공급받는자사업자등록번호
            cleanStr(row[10]),
            cleanStr(row[11]), // 공급받는자상호
            cleanStr(row[12]),
            cleanStr(row[13]),
            parseAmount(row[14]), // 합계금액
            parseAmount(row[15]), // 공급가액
            0, // 세액 (면세 강제 0)
            cleanStr(row[16]), // 전자세금계산서분류
            cleanStr(row[17]),
            cleanStr(row[18]),
            cleanStr(row[19]),
            cleanStr(row[20]),
            cleanStr(row[21]),
            cleanStr(row[22]),
            cleanStr(row[23]),
            cleanStr(row[24]), // 품목일자
            cleanStr(row[25]), // 품목명
            cleanStr(row[26]),
            cleanStr(row[27]),
            cleanStr(row[28]),
            parseAmount(row[29]), // 품목공급가액
            0, // 품목세액 (면세 강제 0)
            cleanStr(row[30]), // 품목비고
            file.name
          );

          if (result.changes > 0) {
            insertedCount++;
          } else {
            duplicateCount++;
          }
        }
      });

      transaction(dataRows);

      if (dates.length > 0) {
        dates.sort();
        queryPeriodStart = dates[0];
        queryPeriodEnd = dates[dates.length - 1];
      }
    }
    // ==========================================
    // C. 현금영수증 (매출내역)
    // ==========================================
    else if (kind === "cash-receipt") {
      tableName = "cash_receipts";
      
      if (!businessNumber) {
        return NextResponse.json(
          { success: false, error: "현금영수증 임포트 시 사업자등록번호(businessNumber)는 필수입니다." },
          { status: 400 }
        );
      }
      businessNumber = businessNumber.replace(/\D/g, "");

      // 헤더: 1행 (index 0), 데이터: 2행 (index 1+)
      const dataRows = rawRows.slice(1);

      // 준비된 INSERT OR IGNORE 구문
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO cash_receipts (
          business_number, 발행구분, 매출일시, 공급가액, 부가세, 봉사료, 총금액,
          승인번호, 신분확인뒷4자리, 거래구분, 용도구분, 비고,
          excel_file_path
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?
        )
      `);

      const dates: string[] = [];

      const transaction = db.transaction((rows) => {
        for (const row of rows) {
          if (!row || !Array.isArray(row) || row.length < 7) continue;

          const approvalNo = cleanStr(row[6]); // 승인번호
          const receiptDateTime = cleanStr(row[1]); // 매출일시 (YYYY-MM-DD HH:MM:SS)
          if (!approvalNo || !receiptDateTime) continue;

          const datePart = receiptDateTime.split(" ")[0] || "";
          if (datePart) dates.push(datePart);

          const result = stmt.run(
            businessNumber,
            cleanStr(row[0]), // 발행구분
            receiptDateTime,
            parseAmount(row[2]), // 공급가액
            parseAmount(row[3]), // 부가세
            parseAmount(row[4]), // 봉사료
            parseAmount(row[5]), // 총금액
            approvalNo,
            cleanStr(row[7]), // 신분확인뒷4자리
            cleanStr(row[8]), // 거래구분
            cleanStr(row[9]), // 용도구분
            cleanStr(row[10]), // 비고
            file.name
          );

          if (result.changes > 0) {
            insertedCount++;
          } else {
            duplicateCount++;
          }
        }
      });

      transaction(dataRows);

      if (dates.length > 0) {
        dates.sort();
        queryPeriodStart = dates[0];
        queryPeriodEnd = dates[dates.length - 1];
      }
    }

    // ==========================================
    // D. 홈택스 동기화 역사 테이블 기록 (hometax_sync_operations)
    // ==========================================
    try {
      const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
      const logStmt = db.prepare(`
        INSERT INTO hometax_sync_operations (
          business_number, status, start_date, end_date,
          sales_count, sales_new, sales_duplicate,
          purchase_count, purchase_new, purchase_duplicate,
          sales_excel_path, started_at, completed_at, duration
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?
        )
      `);
      
      const isSalesType = kind.includes("sales") || kind === "cash-receipt";
      logStmt.run(
        businessNumber,
        "success",
        queryPeriodStart || nowStr.substring(0, 10),
        queryPeriodEnd || nowStr.substring(0, 10),
        isSalesType ? (insertedCount + duplicateCount) : 0, // sales_count
        isSalesType ? insertedCount : 0,                     // sales_new
        isSalesType ? duplicateCount : 0,                    // sales_duplicate
        !isSalesType ? (insertedCount + duplicateCount) : 0,// purchase_count
        !isSalesType ? insertedCount : 0,                   // purchase_new
        !isSalesType ? duplicateCount : 0,                  // purchase_duplicate
        file.name,
        nowStr,
        nowStr,
        0
      );
    } catch (e) {
      console.warn("Could not log hometax sync operation:", e.message);
      // 로그 기록 실패는 무시하고 핵심 적재 성공 리턴
    }

    return NextResponse.json({
      success: true,
      message: "성공적으로 홈택스 엑셀 파일을 세무 데이터베이스에 병합 적재하였습니다.",
      data: {
        tableName,
        kind,
        businessNumber,
        queryPeriodStart,
        queryPeriodEnd,
        totalCount: insertedCount + duplicateCount,
        insertedCount,
        duplicateCount
      }
    });
  } catch (error: any) {
    console.error("Hometax Excel Import API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "홈택스 파일 파싱 및 이지데스크 서버 저장 중 시스템 에러가 발생했습니다."
      },
      { status: 500 }
    );
  } finally {
    if (db) {
      try {
        db.close();
      } catch (e) {}
    }
  }
}
