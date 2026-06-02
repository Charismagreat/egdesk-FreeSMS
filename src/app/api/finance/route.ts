export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import {
  listAccounts,
  queryBankTransactions,
  queryCardTransactions,
  queryTaxInvoices,
  queryTaxExemptInvoices,
  queryCashReceipts,
  getOverallStats,
  getSyncHistory,
  getHometaxSyncHistory,
  listHometaxConnections,
  upsertFinanceHubAccount
} from "../../../../egdesk-helpers";

// 이중 안전 장치: 배열이 아닐 경우 빈 배열로 방어 처리
function safeArray<T>(data: any): T[] {
  return Array.isArray(data) ? data : [];
}

// 은행 식별별 한글명 매핑 딕셔너리
const bankNames: Record<string, string> = {
  shinhan: "신한은행",
  hana: "하나은행",
  kookmin: "KB국민은행",
  ibk: "IBK기업은행",
  woori: "우리은행",
  nh: "NH농협은행",
  "shinhan-card": "신한카드",
  "kb-card": "KB국민카드",
  "nh-card": "NH농협카드",
  "bc-card": "BC카드",
  "hana-card": "하나카드",
  "lotte-card": "롯데카드",
  "samsung-card": "삼성카드",
  "hyundai-card": "현대카드",
  "shinhan_card": "신한카드",
  "kb_card": "KB국민카드",
  "nh_card": "NH농협카드",
  "bc_card": "BC카드",
  "hana_card": "하나카드"
};

// 계좌 데이터를 프론트엔드 규격 포맷으로 변환하는 매퍼 함수
function mapAccountToFrontend(acc: any): any {
  if (!acc) return null;
  const bankId = acc.bank_id || acc.bankId || "";
  return {
    id: String(acc.id || ""),
    bankId: bankId,
    bankName: acc.bank_name || acc.bankName || bankNames[bankId] || "기타은행",
    accountNumber: acc.account_number || acc.accountNumber || "",
    accountName: acc.account_name || acc.accountName || "입출식 예금",
    balance: Math.floor(Number(acc.balance || 0)),
    currency: acc.currency || "KRW",
    updatedAt: acc.updated_at || acc.updatedAt || ""
  };
}

// 거래 데이터를 프론트엔드 규격 포맷으로 변환하는 매퍼 함수
function mapTransactionToFrontend(tx: any): any {
  if (!tx) return null;
  const deposit = Number(tx.deposit || 0);
  const withdrawal = Number(tx.withdrawal || 0);
  const isDeposit = deposit > 0;
  
  return {
    id: String(tx.id || ""),
    date: tx.transaction_date || tx.transactionDate || tx.date || "",
    time: tx.transaction_time || tx.transactionTime || tx.time || "",
    description: tx.description || "",
    category: tx.category || "",
    type: isDeposit ? "deposit" : "withdrawal",
    amount: Math.floor(isDeposit ? deposit : withdrawal),
    balance: Math.floor(Number(tx.balance || 0)),
    bankId: tx.bank_id || tx.bankId || "",
    accountId: tx.account_id || tx.accountId || "",
    accountNumber: tx.account_number || tx.accountNumber || ""
  };
}

// 카드 거래 데이터를 프론트엔드 규격 포맷으로 변환하는 매퍼 함수
function mapCardTransactionToFrontend(tx: any): any {
  if (!tx) return null;
  const companyId = tx.card_company_id || tx.cardCompanyId || "";
  
  return {
    id: String(tx.id || ""),
    accountId: tx.account_id || tx.accountId || "",
    cardCompanyId: companyId,
    cardCompanyName: tx.card_company_name || tx.cardCompanyName || 
                     (companyId === "shinhan-card" ? "신한카드" :
                      companyId === "kb-card" ? "KB국민카드" :
                      companyId === "nh-card" ? "NH농협카드" :
                      companyId === "bc-card" ? "BC카드" :
                      companyId === "hana-card" ? "하나카드" : "기타카드"),
    cardNumber: tx.card_number || tx.cardNumber || "",
    cardholderName: tx.cardholder_name || tx.cardholderName || "",
    usageType: tx.usage_type || tx.usageType || "일시불",
    salesType: tx.sales_type || tx.salesType || "일반매출",
    date: tx.approval_date || tx.approvalDate || tx.date || "",
    time: tx.time || tx.approvalTime || (tx.approval_datetime ? tx.approval_datetime.split(" ")[1] || "" : "") || (tx.approvalDatetime ? tx.approvalDatetime.split(" ")[1] || "" : "") || "00:00:00",
    approvalNumber: tx.approval_number || tx.approvalNumber || "",
    merchantName: tx.merchant_name || tx.merchantName || "",
    amount: Math.floor(Number(tx.amount || 0)),
    status: tx.status || (tx.is_cancelled ? "취소" : "승인"),
    memo: tx.memo || "",
    category: tx.category || "",
    receiptUrl: tx.receipt_url || tx.receiptUrl || ""
  };
}

// 국세청 세금계산서 데이터를 프론트엔드 영문 규격 포맷으로 변환하는 매퍼 함수
function mapTaxInvoiceToFrontend(inv: any): any {
  if (!inv) return null;
  const isSales = inv.invoice_type === "sales" || inv.invoiceType === "sales" || inv.invoiceType === "매출" || inv.invoice_type === "매출";
  
  // 매입의 경우 공급자가 거래처, 매출의 경우 공급받는자가 거래처
  const partnerBusinessNo = isSales 
    ? (inv.공급받는자사업자등록번호 || inv.buyerBusinessNumber || "") 
    : (inv.공급자사업자등록번호 || inv.supplierBusinessNumber || "");

  return {
    id: String(inv.id || ""),
    issueDate: inv.작성일자 || inv.issueDate || "",
    supplierName: inv.공급자상호 || inv.supplierName || "",
    buyerName: inv.공급받는자상호 || inv.buyerName || "",
    supplyAmount: Math.floor(Number(inv.공급가액 || inv.supplyAmount || 0)),
    taxAmount: Math.floor(Number(inv.세액 || inv.taxAmount || 0)),
    totalAmount: Math.floor(Number(inv.합계금액 || inv.totalAmount || 0)),
    itemName: inv.품목명 || inv.itemName || "",
    invoiceType: inv.invoice_type || inv.invoiceType || (isSales ? "sales" : "purchase"),
    partnerBusinessNumber: partnerBusinessNo
  };
}

// 국세청 현금영수증 데이터를 프론트엔드 영문 규격 포맷으로 변환하는 매퍼 함수
function mapCashReceiptToFrontend(rcpt: any): any {
  if (!rcpt) return null;
  return {
    id: String(rcpt.id || ""),
    transactionDate: rcpt.매출일시 || rcpt.transactionDate || "",
    franchiseName: rcpt.비고 || rcpt.franchiseName || "국세청 현금영수증",
    approvalNumber: rcpt.승인번호 || rcpt.approvalNumber || "",
    supplyAmount: Math.floor(Number(rcpt.공급가액 || rcpt.supplyAmount || 0)),
    taxAmount: Math.floor(Number(rcpt.부가세 || rcpt.taxAmount || 0)),
    totalAmount: Math.floor(Number(rcpt.총금액 || rcpt.totalAmount || 0)),
    purpose: rcpt.용도구분 || rcpt.purpose || ""
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tab = searchParams.get("tab") || "accounts";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const searchText = searchParams.get("searchText") || undefined;
    const invoiceType = (searchParams.get("invoiceType") as "sales" | "purchase") || undefined;
    const limit = Number(searchParams.get("limit")) || 30;
    const offset = Number(searchParams.get("offset")) || 0;

    // 1. 계좌 목록 및 종합 통계 조회
    if (tab === "accounts") {
      const [accountsRes, stats] = await Promise.all([
        listAccounts().catch(() => ({ accounts: [] })),
        getOverallStats().catch(() => null)
      ]);
      const accountsRaw = safeArray<any>(accountsRes?.accounts || accountsRes);
      let accounts = accountsRaw.map(mapAccountToFrontend).filter(Boolean);
      
      // [로컬 DB 실시간 실잔액 머지] 로컬 SQLite DB에 수동으로 직접 적재된 계좌가 있다면 그 최신 잔액으로 덮어씌워 줍니다.
      try {
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
        
        if (targetPath) {
          const db = new Database(targetPath);
          const localAccounts = db.prepare("SELECT id, balance FROM accounts").all();
          
          const localBalanceMap: Record<string, number> = {};
          localAccounts.forEach((la: any) => {
            localBalanceMap[la.id] = la.balance;
          });
          
          accounts = accounts.map((acc: any) => {
            if (localBalanceMap[acc.id] !== undefined) {
              console.log(`[Local DB accounts merge] 계좌 잔액 동기화 반영: ${acc.id} -> ₩${localBalanceMap[acc.id]}`);
              return {
                ...acc,
                balance: localBalanceMap[acc.id]
              };
            }
            return acc;
          });
          
          db.close();
        }
      } catch (dbErr: any) {
        console.warn("⚠️ Local DB accounts merge warning:", dbErr.message);
      }
      
      // stats의 totalBalance 계산에 오류가 있을 수 있으므로 직접 합산하여 폴백 처리
      const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

      return NextResponse.json({
        success: true,
        data: {
          accounts: accounts,
          stats: {
            totalBalance: totalBalance,
            activeAccounts: accounts.length
          }
        }
      });
    }

    // 2. 은행 거래 내역 조회
    if (tab === "transactions") {
      const bankId = searchParams.get("bankId") || undefined;
      const accountId = searchParams.get("accountId") || undefined;

      const transactions = await queryBankTransactions({
        bankId: bankId === "all" ? undefined : bankId,
        accountId: accountId === "all" ? undefined : accountId,
        startDate,
        endDate,
        searchText,
        limit,
        offset,
        orderBy: "date",
        orderDir: "desc"
      }).catch(() => ({ transactions: [], total: 0 }));

      const rawList = safeArray(transactions?.transactions || transactions);
      let list = rawList.map(mapTransactionToFrontend).filter(Boolean);
      let total = transactions?.total || list.length;

      // [로컬 DB 실시간 실데이터 폴백] 원격 API 조회 결과가 없거나 부족한 경우 로컬 SQLite DB의 실데이터를 조회하여 대체 및 병합합니다.
      if (list.length === 0) {
        try {
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
          
          if (targetPath) {
            const db = new Database(targetPath);
            
            // 쿼리 파라미터 바인딩 준비
            let query = `SELECT * FROM bank_transactions WHERE 1=1`;
            const params: any[] = [];
            
            if (startDate) {
              const normalizedStart = startDate.replace(/-/g, ".");
              query += ` AND (transaction_date >= ? OR transaction_date >= ?)`;
              params.push(startDate, normalizedStart);
            }
            if (endDate) {
              const normalizedEnd = endDate.replace(/-/g, ".");
              query += ` AND (transaction_date <= ? OR transaction_date <= ?)`;
              params.push(endDate, normalizedEnd);
            }
            if (searchText) {
              query += ` AND description LIKE ?`;
              params.push(`%${searchText}%`);
            }
            if (bankId && bankId !== "all") {
              query += ` AND bank_id = ?`;
              params.push(bankId);
            }
            if (accountId && accountId !== "all") {
              query += ` AND account_id = ?`;
              params.push(accountId);
            }
            
            // 전체 카운트 구하기
            const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as cnt");
            const totalCount = db.prepare(countQuery).get(...params).cnt;
            total = totalCount;

            // 페이징 및 최신순 정렬 적용
            query += ` ORDER BY transaction_date DESC, transaction_time DESC, id DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);
            
            const localTxs = db.prepare(query).all(...params);
            
            // 프론트엔드가 요구하는 포맷으로 표준 매핑 가공
            list = localTxs.map(mapTransactionToFrontend).filter(Boolean);
            
            db.close();
          }
        } catch (dbErr: any) {
          console.warn("⚠️ Local DB bank transactions fallback query failed:", dbErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          list: list,
          total: total
        }
      });
    }

    // 3. 신용 카드 거래 내역 조회
    if (tab === "cards") {
      let cardTxList: any[] = [];
      let total = 0;
      const cardCompanyId = searchParams.get("cardCompanyId") || undefined;
      const cardNumber = searchParams.get("cardNumber") || undefined;

      try {
        const cardTx = await queryCardTransactions({
          startDate,
          endDate,
          merchantName: searchText,
          limit,
          offset,
          orderBy: "date",
          orderDir: "desc"
        }).catch(() => null);

        if (cardTx) {
          const rawList = safeArray(cardTx.transactions || cardTx);
          cardTxList = rawList.map(mapCardTransactionToFrontend).filter(Boolean);
          
          if (cardCompanyId && cardCompanyId !== "all") {
            cardTxList = cardTxList.filter((tx: any) => tx.cardCompanyId === cardCompanyId);
          }
          if (cardNumber && cardNumber !== "all") {
            cardTxList = cardTxList.filter((tx: any) => tx.cardNumber === cardNumber);
          }
          total = cardTxList.length;
        }
      } catch (e) {}

      // [로컬 DB 실시간 실데이터 폴백] 원격 API 조회 결과가 없거나 부족한 경우 로컬 SQLite DB의 실데이터를 조회하여 대체 및 병합합니다.
      if (cardTxList.length === 0) {
        try {
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
          
          if (targetPath) {
            const db = new Database(targetPath);
            
            // 쿼리 파라미터 바인딩 준비
            let query = `SELECT * FROM card_transactions WHERE 1=1`;
            const params: any[] = [];
            
            if (startDate) {
              const normalizedStart = startDate.replace(/-/g, ".");
              query += ` AND (approval_date >= ? OR approval_date >= ?)`;
              params.push(startDate, normalizedStart);
            }
            if (endDate) {
              const normalizedEnd = endDate.replace(/-/g, ".");
              query += ` AND (approval_date <= ? OR approval_date <= ?)`;
              params.push(endDate, normalizedEnd);
            }
            if (searchText) {
              query += ` AND merchant_name LIKE ?`;
              params.push(`%${searchText}%`);
            }
            if (cardCompanyId && cardCompanyId !== "all") {
              query += ` AND card_company_id = ?`;
              params.push(cardCompanyId);
            }
            if (cardNumber && cardNumber !== "all") {
              query += ` AND card_number = ?`;
              params.push(cardNumber);
            }
            
            // 전체 카운트 구하기
            const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as cnt");
            const totalCount = db.prepare(countQuery).get(...params).cnt;
            total = totalCount;

            // 페이징 및 최신순 정렬 적용
            query += ` ORDER BY approval_date DESC, approval_datetime DESC, id DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);
            
            const localCardTxs = db.prepare(query).all(...params);
            
            // 프론트엔드가 요구하는 포맷으로 표준 매핑 가공
            cardTxList = localCardTxs.map(mapCardTransactionToFrontend).filter(Boolean);
            
            db.close();
          }
        } catch (dbErr: any) {
          console.warn("⚠️ Local DB card fallback query failed:", dbErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          list: cardTxList,
          total: total
        }
      });
    }

    // 4. 국세청 홈택스 전자세금계산서 조회
    // 4. 국세청 홈택스 전자세금계산서 조회
    if (tab === "hometax-invoice") {
      let filteredList: any[] = [];
      let total = 0;

      try {
        const taxInvoices = await queryTaxInvoices({
          invoiceType,
          startDate,
          endDate,
          limit,
          offset
        }).catch(() => ({ invoices: [], total: 0 }));

        const rawList = safeArray(taxInvoices?.invoices || taxInvoices);
        const list = rawList.map(mapTaxInvoiceToFrontend).filter(Boolean);
        
        filteredList = searchText
          ? list.filter((inv: any) =>
              (inv.supplierName || "").includes(searchText) ||
              (inv.buyerName || "").includes(searchText) ||
              (inv.itemName || "").includes(searchText)
            )
          : list;
          
        total = taxInvoices?.total || filteredList.length;
      } catch (e) {}

      // [로컬 DB 실시간 실데이터 폴백] 원격 API 조회 결과가 없거나 부족한 경우 로컬 SQLite DB의 실데이터를 조회하여 대체 및 병합합니다.
      if (filteredList.length === 0) {
        try {
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
          
          if (targetPath) {
            const db = new Database(targetPath);
            
            // 쿼리 파라미터 바인딩 준비
            let query = `SELECT * FROM tax_invoices WHERE 1=1`;
            const params: any[] = [];
            
            if (startDate) {
              query += ` AND 작성일자 >= ?`;
              params.push(startDate);
            }
            if (endDate) {
              query += ` AND 작성일자 <= ?`;
              params.push(endDate);
            }
            if (invoiceType && invoiceType !== "all") {
              query += ` AND invoice_type = ?`;
              params.push(invoiceType);
            }
            
            // 전체 카운트 구하기
            const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as cnt");
            const totalCount = db.prepare(countQuery).get(...params).cnt;
            
            // 정렬 및 페이징 적용
            query += ` ORDER BY 작성일자 DESC, id DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);
            
            const localInvoices = db.prepare(query).all(...params);
            const mappedList = localInvoices.map(mapTaxInvoiceToFrontend).filter(Boolean);
            
            filteredList = searchText
              ? mappedList.filter((inv: any) =>
                  (inv.supplierName || "").includes(searchText) ||
                  (inv.buyerName || "").includes(searchText) ||
                  (inv.itemName || "").includes(searchText)
                )
              : mappedList;
              
            total = searchText ? filteredList.length : totalCount;
            db.close();
          }
        } catch (dbErr: any) {
          console.warn("⚠️ Local DB hometax-invoice fallback failed:", dbErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          list: filteredList,
          total: total
        }
      });
    }

    // 5. 국세청 홈택스 전자계산서(면세) 조회
    if (tab === "hometax-exempt") {
      let filteredList: any[] = [];
      let total = 0;

      try {
        const exemptInvoices = await queryTaxExemptInvoices({
          invoiceType,
          startDate,
          endDate,
          limit,
          offset
        }).catch(() => ({ invoices: [], total: 0 }));

        const rawList = safeArray(exemptInvoices?.invoices || exemptInvoices);
        const list = rawList.map(mapTaxInvoiceToFrontend).filter(Boolean);
        
        filteredList = searchText
          ? list.filter((inv: any) =>
              (inv.supplierName || "").includes(searchText) ||
              (inv.buyerName || "").includes(searchText) ||
              (inv.itemName || "").includes(searchText)
            )
          : list;
          
        total = exemptInvoices?.total || filteredList.length;
      } catch (e) {}

      // [로컬 DB 실시간 실데이터 폴백] 원격 API 조회 결과가 없거나 부족한 경우 로컬 SQLite DB의 실데이터를 조회하여 대체 및 병합합니다.
      if (filteredList.length === 0) {
        try {
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
          
          if (targetPath) {
            const db = new Database(targetPath);
            
            // 쿼리 파라미터 바인딩 준비
            let query = `SELECT * FROM tax_exempt_invoices WHERE 1=1`;
            const params: any[] = [];
            
            if (startDate) {
              query += ` AND 작성일자 >= ?`;
              params.push(startDate);
            }
            if (endDate) {
              query += ` AND 작성일자 <= ?`;
              params.push(endDate);
            }
            if (invoiceType && invoiceType !== "all") {
              query += ` AND invoice_type = ?`;
              params.push(invoiceType);
            }
            
            // 전체 카운트 구하기
            const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as cnt");
            const totalCount = db.prepare(countQuery).get(...params).cnt;
            
            // 정렬 및 페이징 적용
            query += ` ORDER BY 작성일자 DESC, id DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);
            
            const localExempts = db.prepare(query).all(...params);
            const mappedList = localExempts.map(mapTaxInvoiceToFrontend).filter(Boolean);
            
            filteredList = searchText
              ? mappedList.filter((inv: any) =>
                  (inv.supplierName || "").includes(searchText) ||
                  (inv.buyerName || "").includes(searchText) ||
                  (inv.itemName || "").includes(searchText)
                )
              : mappedList;
              
            total = searchText ? filteredList.length : totalCount;
            db.close();
          }
        } catch (dbErr: any) {
          console.warn("⚠️ Local DB hometax-exempt fallback failed:", dbErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          list: filteredList,
          total: total
        }
      });
    }

    // 6. 국세청 홈택스 현금영수증 조회
    if (tab === "hometax-cash") {
      const cashPurpose = searchParams.get("cashPurpose") || undefined;
      let filteredList: any[] = [];
      let total = 0;

      try {
        const cashReceipts = await queryCashReceipts({
          startDate,
          endDate,
          limit,
          offset
        }).catch(() => ({ receipts: [], total: 0 }));

        const rawList = safeArray(cashReceipts?.receipts || cashReceipts);
        const list = rawList.map(mapCashReceiptToFrontend).filter(Boolean);
        
        filteredList = list;
        if (cashPurpose && cashPurpose !== "all") {
          filteredList = filteredList.filter((rcpt: any) => rcpt.purpose === cashPurpose);
        }

        if (searchText) {
          filteredList = filteredList.filter((rcpt: any) =>
            (rcpt.franchiseName || "").includes(searchText) ||
            (rcpt.approvalNumber || "").includes(searchText)
          );
        }
        
        total = cashReceipts?.total || filteredList.length;
      } catch (e) {}

      // [로컬 DB 실시간 실데이터 폴백] 원격 API 조회 결과가 없거나 부족한 경우 로컬 SQLite DB의 실데이터를 조회하여 대체 및 병합합니다.
      if (filteredList.length === 0) {
        try {
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
          
          if (targetPath) {
            const db = new Database(targetPath);
            
            // 쿼리 파라미터 바인딩 준비
            let query = `SELECT * FROM cash_receipts WHERE 1=1`;
            const params: any[] = [];
            
            if (startDate) {
              query += ` AND (매출일시 >= ? OR transaction_date >= ?)`;
              params.push(startDate, startDate);
            }
            if (endDate) {
              query += ` AND (매출일시 <= ? OR transaction_date <= ?)`;
              params.push(endDate, endDate);
            }
            if (cashPurpose && cashPurpose !== "all") {
              query += ` AND (용도구분 = ? OR purpose = ?)`;
              params.push(cashPurpose, cashPurpose);
            }
            
            // 전체 카운트 구하기
            const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as cnt");
            const totalCount = db.prepare(countQuery).get(...params).cnt;
            
            // 정렬 및 페이징 적용
            query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);
            
            const localCashReceipts = db.prepare(query).all(...params);
            const mappedList = localCashReceipts.map(mapCashReceiptToFrontend).filter(Boolean);
            
            filteredList = searchText
              ? mappedList.filter((rcpt: any) =>
                  (rcpt.franchiseName || "").includes(searchText) ||
                  (rcpt.approvalNumber || "").includes(searchText)
                )
              : mappedList;
              
            total = searchText ? filteredList.length : totalCount;
            db.close();
          }
        } catch (dbErr: any) {
          console.warn("⚠️ Local DB hometax-cash fallback failed:", dbErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          list: filteredList,
          total: total
        }
      });
    }

    // 7. 동기화 역사 & 홈택스 연결 정보 조회
    if (tab === "sync") {
      const [syncHistory, hometaxSync, hometaxConnections] = await Promise.all([
        getSyncHistory(50).catch(() => []),
        getHometaxSyncHistory(50).catch(() => []),
        listHometaxConnections().catch(() => [])
      ]);

      return NextResponse.json({
        success: true,
        data: {
          syncHistory: safeArray(syncHistory),
          hometaxSync: safeArray(hometaxSync),
          hometaxConnections: safeArray(hometaxConnections)
        }
      });
    }

    // 8. 금융 종합 수치 통계
    if (tab === "stats") {
      const stats = await getOverallStats().catch(() => null);
      return NextResponse.json({
        success: true,
        data: stats || { totalBalance: 0, activeAccounts: 0, bankCount: 0, transactionCount: 0 }
      });
    }

    // 9. 금월/전월/전전월/금년도 카드 및 홈택스 입출 통합 통계
    if (tab === "summary") {
      const now = new Date();
      let currentYear = now.getFullYear();
      let currentMonth = now.getMonth(); // 0-indexed (5 = 6월)

      // [스마트 집계 기준일 자동 감지] 로컬 DB 내 신용카드 최신 거래일자를 감지하여 통계 집계의 연도/월로 유동적 동기화합니다.
      try {
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
        
        if (targetPath) {
          const db = new Database(targetPath);
          const latestCardTx = db.prepare("SELECT approval_date FROM card_transactions ORDER BY approval_date DESC LIMIT 1").get();
          if (latestCardTx && latestCardTx.approval_date) {
            const dateParts = latestCardTx.approval_date.replace(/\./g, "-").split("-");
            if (dateParts.length >= 2) {
              const latestYear = parseInt(dateParts[0], 10);
              const latestMonth = parseInt(dateParts[1], 10) - 1; // 0-indexed
              console.log(`[Smart Summary Date Detect] 최신 카드 승인일(${latestCardTx.approval_date}) 기준으로 통계 기준일을 유동적 갱신합니다: ${latestYear}년 ${latestMonth + 1}월`);
              currentYear = latestYear;
              currentMonth = latestMonth;
            }
          }
          db.close();
        }
      } catch (e) {
        console.warn("⚠️ Smart summary date detection failed:", e.message);
      }

      const getYearMonthStr = (y: number, m: number) => {
        return `${y}-${String(m + 1).padStart(2, '0')}`;
      };

      const m0Str = getYearMonthStr(currentYear, currentMonth); // 이번 달

      const m1Date = new Date(currentYear, currentMonth - 1, 1);
      const m1Str = getYearMonthStr(m1Date.getFullYear(), m1Date.getMonth()); // 지난달

      const m2Date = new Date(currentYear, currentMonth - 2, 1);
      const m2Str = getYearMonthStr(m2Date.getFullYear(), m2Date.getMonth()); // 지지난달

      // 통계 집계를 위한 시작일 계산 (올해 1월 1일과 지지난달 1일 중 더 이른 날짜)
      const yearStart = `${currentYear}-01-01`;
      const m2Start = `${m2Date.getFullYear()}-${String(m2Date.getMonth() + 1).padStart(2, '0')}-01`;
      const startDate = m2Start < yearStart ? m2Start : yearStart;

      // egdesk-helpers 함수들을 사용하여 금융 자료 병렬 조회
      const [cardTxRes, taxInvoiceRes, taxExemptRes, cashReceiptRes] = await Promise.all([
        queryCardTransactions({ startDate, limit: 10000 }).catch(() => ({ transactions: [], total: 0 })),
        queryTaxInvoices({ startDate, limit: 10000 }).catch(() => ({ invoices: [], total: 0 })),
        queryTaxExemptInvoices({ startDate, limit: 10000 }).catch(() => ({ invoices: [], total: 0 })),
        queryCashReceipts({ startDate, limit: 10000 }).catch(() => ({ receipts: [], total: 0 }))
      ]);

      let cardTxList: any[] = [];

      // [로컬 DB 실시간 카드 통계 우선 결합] 로컬 SQLite DB에 카드 거래 내역이 존재하면 원격 데이터 대신 무조건 로컬 실거래 데이터를 기반으로 요약 통계를 집계합니다.
      try {
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
        
        if (targetPath) {
          const db = new Database(targetPath);
          const localCardTxs = db.prepare("SELECT * FROM card_transactions").all();
          
          if (localCardTxs.length > 0) {
            console.log(`[Summary API Fallback] 로컬 DB 카드 거래 ${localCardTxs.length}건을 기반으로 요약 집계를 수행합니다.`);
            cardTxList = localCardTxs.map((tx: any) => ({
              id: String(tx.id || ""),
              cardCompanyName: tx.card_company_id === "shinhan-card" ? "신한카드" :
                               tx.card_company_id === "kb-card" ? "KB국민카드" :
                               tx.card_company_id === "nh-card" ? "NH농협카드" :
                               tx.card_company_id === "bc-card" ? "BC카드" :
                               tx.card_company_id === "hana-card" ? "하나카드" : "기타카드",
              cardNumber: tx.card_number || "",
              amount: Number(tx.amount || 0),
              date: (tx.approval_date || "").replace(/\./g, "-"),
              status: tx.is_cancelled ? "취소" : "승인"
            }));
          }
          db.close();
        }
      } catch (dbErr: any) {
        console.warn("⚠️ Local DB summary fallback error:", dbErr.message);
      }

      // 만약 로컬 DB에 카드가 없는 클린 상태인 경우에만 원격 데이터를 백업 폴백으로 사용
      if (cardTxList.length === 0) {
        cardTxList = safeArray<any>(cardTxRes?.transactions || cardTxRes).map(tx => ({
          id: String(tx.id || ""),
          cardCompanyName: tx.cardCompanyName || "기타카드",
          cardNumber: tx.cardNumber || "",
          amount: Number(tx.amount || 0),
          date: tx.date || "",
          status: tx.status || "승인"
        }));
      }
      const taxInvoiceListRaw = safeArray<any>(taxInvoiceRes?.invoices || taxInvoiceRes);
      const taxExemptListRaw = safeArray<any>(taxExemptRes?.invoices || taxExemptRes);
      const cashReceiptListRaw = safeArray<any>(cashReceiptRes?.receipts || cashReceiptRes);

      const taxInvoiceList = taxInvoiceListRaw.map(mapTaxInvoiceToFrontend).filter(Boolean);
      const taxExemptList = taxExemptListRaw.map(mapTaxInvoiceToFrontend).filter(Boolean);
      const cashReceiptList = cashReceiptListRaw.map(mapCashReceiptToFrontend).filter(Boolean);

      // (1) 카드사별/월별 집계
      const cardMap: Record<string, { cardCompanyName: string; cardNumber: string; m0: number; m1: number; m2: number; yTotal: number }> = {};

      cardTxList.forEach((tx) => {
        if (tx.status === "취소") return;
        const company = tx.cardCompanyName || "기타카드";
        const num = tx.cardNumber || "0000";
        const key = `${company}_${num}`;

        if (!cardMap[key]) {
          cardMap[key] = {
            cardCompanyName: company,
            cardNumber: num,
            m0: 0,
            m1: 0,
            m2: 0,
            yTotal: 0
          };
        }

        const amount = Math.floor(Number(tx.amount) || 0);
        const txDateStr = tx.date || ""; // YYYY-MM-DD
        const txYM = txDateStr.substring(0, 7);

        // 월별 배분
        if (txYM === m0Str) cardMap[key].m0 += amount;
        else if (txYM === m1Str) cardMap[key].m1 += amount;
        else if (txYM === m2Str) cardMap[key].m2 += amount;

        // 금년도 누계 가산 (KST 기준 날짜가 올해에 속할 때)
        if (txDateStr.startsWith(String(currentYear))) {
          cardMap[key].yTotal += amount;
        }
      });

      // (2) 홈택스 매출액/매입액 집계
      const hometaxSummary = {
        sales: { m0: 0, m1: 0, m2: 0, yTotal: 0 },
        purchase: { m0: 0, m1: 0, m2: 0, yTotal: 0 }
      };

      // 세금계산서 집계
      taxInvoiceList.forEach((inv) => {
        const isSales = inv.invoiceType === "sales" || inv.invoiceType === "매출";
        const target = isSales ? hometaxSummary.sales : hometaxSummary.purchase;
        const amount = Number(inv.totalAmount) || 0;
        const dateStr = inv.issueDate || "";
        const ym = dateStr.substring(0, 7);

        if (ym === m0Str) target.m0 += amount;
        else if (ym === m1Str) target.m1 += amount;
        else if (ym === m2Str) target.m2 += amount;

        if (dateStr.startsWith(String(currentYear))) {
          target.yTotal += amount;
        }
      });

      // 면세계산서 집계
      taxExemptList.forEach((inv) => {
        const isSales = inv.invoiceType === "sales" || inv.invoiceType === "매출";
        const target = isSales ? hometaxSummary.sales : hometaxSummary.purchase;
        const amount = Number(inv.totalAmount) || 0;
        const dateStr = inv.issueDate || "";
        const ym = dateStr.substring(0, 7);

        if (ym === m0Str) target.m0 += amount;
        else if (ym === m1Str) target.m1 += amount;
        else if (ym === m2Str) target.m2 += amount;

        if (dateStr.startsWith(String(currentYear))) {
          target.yTotal += amount;
        }
      });

      // 현금영수증 집계 (현금영수증은 전액 발행(매출)로 취급)
      cashReceiptList.forEach((rcpt) => {
        const target = hometaxSummary.sales;
        const amount = Number(rcpt.totalAmount) || 0;
        const dateStr = rcpt.transactionDate || "";
        const ym = dateStr.substring(0, 7);

        if (ym === m0Str) target.m0 += amount;
        else if (ym === m1Str) target.m1 += amount;
        else if (ym === m2Str) target.m2 += amount;

        if (dateStr.startsWith(String(currentYear))) {
          target.yTotal += amount;
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          months: [m0Str, m1Str, m2Str],
          cardSummary: Object.values(cardMap),
          hometaxSummary
        }
      });
    }

    return NextResponse.json(
      { success: false, error: "알려지지 않은 금융 탭 정보입니다." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Finance API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "금융 데이터 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bankId, accountNumber, accountName, balance } = body;

    if (!bankId || !accountNumber) {
      return NextResponse.json(
        { success: false, error: "은행 코드와 계좌번호는 필수입니다." },
        { status: 400 }
      );
    }

    const result = await upsertFinanceHubAccount({
      bankId,
      accountNumber,
      accountName: accountName || "수동 등록 계좌",
      balance: Number(balance) || 0
    });

    return NextResponse.json({
      success: true,
      message: "성공적으로 계좌를 등록하였습니다.",
      data: result
    });
  } catch (error: any) {
    console.error("Account Creation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "계좌 등록 중 시스템 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

