export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import {
  importFinanceHubTransactions,
  listAccounts
} from "../../../../egdesk-helpers";
import * as xlsx from "xlsx";

// 헤더 텍스트 정규화 헬퍼 (공백 및 특수 점 문자 제거)
function normalizeHeader(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str).replace(/\s+/g, "").replace(/·/g, "");
}

// 금액 및 수치 텍스트 파싱 헬퍼
function parseAmount(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/,/g, "").trim();
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

// 날짜 및 시간 파싱 헬퍼
function parseDateTime(
  style: string,
  value: string,
  fallbackTime = "00:00:00"
): { date: string; time: string } {
  if (!value) return { date: "", time: fallbackTime };
  const cleaned = String(value).trim();

  // 1. 신한 포맷 (YYYYMMDDHHMMSS)
  if (style === "shinhan14") {
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length >= 8) {
      const date = `${digits.substring(0, 4)}-${digits.substring(4, 6)}-${digits.substring(6, 8)}`;
      let time = fallbackTime;
      if (digits.length >= 14) {
        time = `${digits.substring(8, 10)}:${digits.substring(10, 12)}:${digits.substring(12, 14)}`;
      } else if (digits.length >= 12) {
        time = `${digits.substring(8, 10)}:${digits.substring(10, 12)}:00`;
      }
      return { date, time };
    }
  }

  // 2. 하나, 국민, 우리 및 공백으로 구분되는 포맷 (YYYY-MM-DD HH:MM:SS 등)
  if (style === "hanaSpace" || style === "kbSpace" || style === "wooriSpace") {
    const parts = cleaned.split(/\s+/);
    let dateStr = parts[0] || "";
    let timeStr = parts[1] || fallbackTime;

    dateStr = dateStr.replace(/\./g, "-");
    if (dateStr.endsWith("-")) {
      dateStr = dateStr.slice(0, -1);
    }

    const timeParts = timeStr.split(":");
    if (timeParts.length === 2) {
      timeStr = `${timeParts[0]}:${timeParts[1]}:00`;
    }
    return { date: dateStr, time: timeStr };
  }

  // 기본 (단일 날짜만 있는 경우)
  let dateStr = cleaned.replace(/\./g, "-");
  if (dateStr.endsWith("-")) {
    dateStr = dateStr.slice(0, -1);
  }
  return { date: dateStr, time: fallbackTime };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bankId = formData.get("bankId") as string;
    const accountId = formData.get("accountId") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "업로드된 엑셀 파일이 존재하지 않습니다." },
        { status: 400 }
      );
    }

    if (!bankId) {
      return NextResponse.json(
        { success: false, error: "은행 코드가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // 1. 계좌 정보 확인 및 데이터 획득
    const accounts = await listAccounts().catch(() => []);
    const targetAccount = accounts.find((acc: any) => acc.id === accountId);

    if (!targetAccount && bankId !== "serp") {
      return NextResponse.json(
        { success: false, error: "유효한 계좌 정보가 지정되지 않았습니다." },
        { status: 400 }
      );
    }

    const accountData = {
      accountNumber: targetAccount?.accountNumber || "MANUAL-IMPORT",
      accountName: targetAccount?.accountName || "수동 임포트 계좌",
      customerName: targetAccount?.customerName || "본사",
      balance: targetAccount?.balance || 0
    };

    // 2. 엑셀 파일 로드 및 버퍼 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return NextResponse.json(
        { success: false, error: "엑셀 시트 데이터를 읽을 수 없습니다." },
        { status: 400 }
      );
    }

    // 2차원 배열 형태로 시트 파싱 (헤더 위 여백 및 빈 행 처리를 용이하게 하기 위함)
    const rawRows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false });

    // 3. 은행별 파싱 메타 규칙 바인딩
    // BANK_EXCEL_HEADER_ROW_1BASED 기준
    let headerRowIndex = 0; // 0-based
    let datetimeStyle = "";

    switch (bankId) {
      case "shinhan":
        headerRowIndex = 1 - 1;
        datetimeStyle = "shinhan14";
        break;
      case "hana":
        headerRowIndex = 7 - 1;
        datetimeStyle = "hanaSpace";
        break;
      case "kookmin":
        headerRowIndex = 7 - 1;
        datetimeStyle = "kbSpace";
        break;
      case "ibk":
        headerRowIndex = 3 - 1;
        datetimeStyle = "hanaSpace"; // IBK와 하나는 공백형 포맷 공유
        break;
      case "woori":
        headerRowIndex = 4 - 1;
        datetimeStyle = "wooriSpace";
        break;
      case "nh":
        headerRowIndex = 10 - 1;
        datetimeStyle = "none";
        break;
      case "serp":
        headerRowIndex = 6 - 1;
        datetimeStyle = "none";
        break;
      default:
        return NextResponse.json(
          { success: false, error: "지원하지 않는 은행 코드입니다." },
          { status: 400 }
        );
    }

    if (rawRows.length <= headerRowIndex) {
      return NextResponse.json(
        {
          success: false,
          error: `엑셀 행 수(${rawRows.length})가 지정된 헤더 위치(행 ${headerRowIndex + 1})보다 적습니다.`
        },
        { status: 400 }
      );
    }

    // 헤더 정보 파싱 및 표준화
    const headerRow = rawRows[headerRowIndex];
    if (!headerRow || !Array.isArray(headerRow)) {
      return NextResponse.json(
        { success: false, error: "엑셀 헤더 행을 읽을 수 없습니다." },
        { status: 400 }
      );
    }

    const headersNormalized = headerRow.map((h: any) => normalizeHeader(h));
    const headerIndices: Record<string, number> = {};
    headersNormalized.forEach((header, index) => {
      if (header) {
        headerIndices[header] = index;
      }
    });

    // 4. 데이터 행 순회 파싱
    const transactions: any[] = [];
    const dataRows = rawRows.slice(headerRowIndex + 1);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      // 행의 첫 번째 컬럼이 비어있거나, 완전히 빈 줄인 경우 스킵 방지
      const rowHasData = row.some((val) => val !== null && val !== undefined && String(val).trim() !== "");
      if (!rowHasData) continue;

      // 컬럼 값 추출기
      const getVal = (colName: string): string => {
        const idx = headerIndices[colName];
        if (idx === undefined || idx >= row.length) return "";
        const v = row[idx];
        return v === null || v === undefined ? "" : String(v).trim();
      };

      let txDate = "";
      let txTime = "00:00:00";
      let description = "";
      let deposit = 0;
      let withdrawal = 0;
      let balance = 0;
      let branch = "";
      let counterpartyAccount = "";
      let counterparty = "";
      const extra: Record<string, string> = {};

      // 5. 은행별 열 매핑 가이드 적용
      if (bankId === "shinhan") {
        const dtVal = getVal("거래일시");
        if (!dtVal) continue;
        const dt = parseDateTime(datetimeStyle, dtVal);
        txDate = dt.date;
        txTime = dt.time;

        description = getVal("적요");
        deposit = parseAmount(getVal("입금액"));
        withdrawal = parseAmount(getVal("출금액"));
        balance = parseAmount(getVal("잔액"));
        branch = getVal("거래점명");
        extra["내용"] = getVal("내용");
      } 
      else if (bankId === "hana") {
        const dtVal = getVal("거래일시");
        if (!dtVal) continue;
        const dt = parseDateTime(datetimeStyle, dtVal);
        txDate = dt.date;
        txTime = dt.time;

        description = getVal("적요");
        deposit = parseAmount(getVal("입금"));
        withdrawal = parseAmount(getVal("출금"));
        balance = parseAmount(getVal("거래후잔액"));
        branch = getVal("거래점");
        counterparty = getVal("의뢰인/수취인") || getVal("의뢰인수취인");
        
        extra["거래특이사항"] = getVal("거래특이사항");
        extra["추가메모"] = getVal("추가메모");
        extra["구분"] = getVal("구분");
      } 
      else if (bankId === "kookmin") {
        const dtVal = getVal("거래일시");
        if (!dtVal) continue;
        const dt = parseDateTime(datetimeStyle, dtVal);
        txDate = dt.date;
        txTime = dt.time;

        counterparty = getVal("보낸분/받는분") || getVal("보낸분받는분");
        description = getVal("적요");
        deposit = parseAmount(getVal("입금액(원)"));
        withdrawal = parseAmount(getVal("출금액(원)"));
        balance = parseAmount(getVal("잔액(원)"));
        branch = getVal("처리점");

        extra["내통장표시"] = getVal("내통장표시") || getVal("내통장표시");
        extra["구분"] = getVal("구분");
      } 
      else if (bankId === "nh") {
        txDate = parseDateTime("none", getVal("거래일자")).date;
        txTime = getVal("거래시간") || "00:00:00";
        if (txTime.split(":").length === 2) {
          txTime = `${txTime}:00`;
        }

        description = getVal("거래기록사항");
        deposit = parseAmount(getVal("입금금액(원)"));
        withdrawal = parseAmount(getVal("출금금액(원)"));
        balance = parseAmount(getVal("거래후잔액(원)") || getVal("거래후잔액(원)"));
        branch = getVal("거래점");

        extra["거래내용"] = getVal("거래내용");
        extra["이체메모"] = getVal("이체메모");
      } 
      else if (bankId === "ibk") {
        const dtVal = getVal("거래일시") || getVal("납입일자");
        if (!dtVal) continue;
        const dt = parseDateTime(datetimeStyle, dtVal);
        txDate = dt.date;
        txTime = dt.time;

        description = getVal("거래내용") || getVal("비고");
        deposit = parseAmount(getVal("입금") || getVal("납입금액"));
        withdrawal = parseAmount(getVal("출금"));
        balance = parseAmount(getVal("거래후잔액") || getVal("잔액"));
        counterpartyAccount = getVal("상대계좌번호") || getVal("상대계좌");
        counterparty = getVal("상대계좌예금주명");

        extra["거래구분"] = getVal("거래구분");
        extra["수표어음금액"] = getVal("수표어음금액");
        extra["CMS코드"] = getVal("CMS코드");
        extra["상대은행"] = getVal("상대은행");
      } 
      else if (bankId === "woori") {
        const dtVal = getVal("거래일시");
        if (!dtVal) continue;
        const dt = parseDateTime(datetimeStyle, dtVal);
        txDate = dt.date;
        txTime = dt.time;

        description = getVal("적요");
        deposit = parseAmount(getVal("입금(원)"));
        withdrawal = parseAmount(getVal("지급(원)"));
        balance = parseAmount(getVal("거래후잔액(원)") || getVal("거래후잔액(원)"));
        branch = getVal("취급점");

        extra["기재내용"] = getVal("기재내용");
        extra["표어음증권금액(원)"] = getVal("표어음증권금액(원)") || getVal("표어음증권금액(원)");
      } 
      else if (bankId === "serp") {
        txDate = parseDateTime("none", getVal("거래일자")).date;
        txTime = getVal("거래시간") || "00:00:00";
        if (txTime.split(":").length === 2) {
          txTime = `${txTime}:00`;
        }

        description = getVal("적요1");
        deposit = parseAmount(getVal("입금"));
        withdrawal = parseAmount(getVal("출금"));
        balance = parseAmount(getVal("잔액"));
        branch = getVal("취급지점");
        counterpartyAccount = getVal("상대계좌");
        counterparty = getVal("상대계좌예금주명");

        extra["은행"] = getVal("은행");
        extra["계좌번호"] = getVal("계좌번호");
        extra["계좌별칭"] = getVal("계좌별칭");
        extra["비고"] = getVal("비고");
        extra["수기"] = getVal("수기");
        extra["적요2"] = getVal("적요2");
      }

      // 비어 있는 적요 항목 방어 코드
      if (!description) description = "인터넷뱅킹 입출금";

      // 적요2 번들링 규칙 적용
      // 비어있지 않은 extra 필드들만 수집하여 description2로 JSON 직렬화
      const description2Obj: Record<string, string> = {};
      Object.entries(extra).forEach(([key, val]) => {
        if (val) description2Obj[key] = val;
      });
      const description2 = JSON.stringify(description2Obj);

      // 데이터 정규화 객체 생성 (데이터베이스/API 형태 동시 대응)
      const txObj = {
        date: txDate,
        transaction_date: txDate,
        time: txTime,
        transaction_time: txTime,
        description,
        description2,
        deposit,
        withdrawal,
        amount: deposit > 0 ? deposit : withdrawal,
        balance,
        branch,
        counterpartyAccount,
        counterparty_account: counterpartyAccount,
        counterparty,
        counterparty_name: counterparty,
        type: deposit > 0 ? "deposit" : "withdrawal"
      };

      transactions.push(txObj);
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { success: false, error: "엑셀 시트에서 유효한 거래 내역 행을 찾을 수 없습니다." },
        { status: 400 }
      );
    }

    // 6. 조회 기간 메타데이터 계산
    const dates = transactions.map((t) => t.date).filter(Boolean);
    const sortedDates = [...dates].sort();
    const queryPeriodStart = sortedDates[0] || new Date().toISOString().split("T")[0];
    const queryPeriodEnd = sortedDates[sortedDates.length - 1] || new Date().toISOString().split("T")[0];

    // 7. 이지데스크 금융 데이터베이스로 매핑된 내역 최종 전송
    const importResult = await importFinanceHubTransactions({
      bankId,
      accountData,
      transactions,
      syncMetadata: {
        queryPeriodStart,
        queryPeriodEnd,
        filePath: file.name
      }
    });

    return NextResponse.json({
      success: true,
      message: "성공적으로 인터넷뱅킹 엑셀 파일을 가져왔습니다.",
      data: {
        parsedCount: transactions.length,
        queryPeriodStart,
        queryPeriodEnd,
        accountNumber: accountData.accountNumber,
        accountName: accountData.accountName,
        importResult
      }
    });
  } catch (error: any) {
    console.error("Banking Excel Import Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "엑셀 파일 처리 및 전송 중 시스템 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}
