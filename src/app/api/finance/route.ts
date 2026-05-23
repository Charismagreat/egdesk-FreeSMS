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
  listHometaxConnections
} from "../../../../egdesk-helpers";

// 이중 안전 장치: 배열이 아닐 경우 빈 배열로 방어 처리
function safeArray<T>(data: any): T[] {
  return Array.isArray(data) ? data : [];
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
      const [accounts, stats] = await Promise.all([
        listAccounts().catch(() => []),
        getOverallStats().catch(() => null)
      ]);
      return NextResponse.json({
        success: true,
        data: {
          accounts: safeArray(accounts),
          stats: stats || { totalBalance: 0, activeAccounts: 0 }
        }
      });
    }

    // 2. 은행 거래 내역 조회
    if (tab === "transactions") {
      const transactions = await queryBankTransactions({
        startDate,
        endDate,
        searchText,
        limit,
        offset,
        orderBy: "date",
        orderDir: "desc"
      }).catch(() => ({ transactions: [], total: 0 }));

      return NextResponse.json({
        success: true,
        data: {
          list: safeArray(transactions?.transactions || transactions),
          total: transactions?.total || safeArray(transactions?.transactions || transactions).length
        }
      });
    }

    // 3. 신용 카드 거래 내역 조회
    if (tab === "cards") {
      const cardTx = await queryCardTransactions({
        startDate,
        endDate,
        merchantName: searchText,
        limit,
        offset,
        orderBy: "date",
        orderDir: "desc"
      }).catch(() => ({ transactions: [], total: 0 }));

      return NextResponse.json({
        success: true,
        data: {
          list: safeArray(cardTx?.transactions || cardTx),
          total: cardTx?.total || safeArray(cardTx?.transactions || cardTx).length
        }
      });
    }

    // 4. 국세청 홈택스 전자세금계산서 조회
    if (tab === "hometax-invoice") {
      const taxInvoices = await queryTaxInvoices({
        invoiceType,
        startDate,
        endDate,
        limit,
        offset
      }).catch(() => ({ invoices: [], total: 0 }));

      const list = safeArray(taxInvoices?.invoices || taxInvoices);
      // 검색어가 있다면 클라이언트 단 혹은 간단히 서버 단 필터링 제공
      const filteredList = searchText
        ? list.filter((inv: any) =>
            (inv.supplierName || "").includes(searchText) ||
            (inv.buyerName || "").includes(searchText) ||
            (inv.itemName || "").includes(searchText)
          )
        : list;

      return NextResponse.json({
        success: true,
        data: {
          list: filteredList,
          total: taxInvoices?.total || filteredList.length
        }
      });
    }

    // 5. 국세청 홈택스 전자계산서(면세) 조회
    if (tab === "hometax-exempt") {
      const exemptInvoices = await queryTaxExemptInvoices({
        invoiceType,
        startDate,
        endDate,
        limit,
        offset
      }).catch(() => ({ invoices: [], total: 0 }));

      const list = safeArray(exemptInvoices?.invoices || exemptInvoices);
      const filteredList = searchText
        ? list.filter((inv: any) =>
            (inv.supplierName || "").includes(searchText) ||
            (inv.buyerName || "").includes(searchText) ||
            (inv.itemName || "").includes(searchText)
          )
        : list;

      return NextResponse.json({
        success: true,
        data: {
          list: filteredList,
          total: exemptInvoices?.total || filteredList.length
        }
      });
    }

    // 6. 국세청 홈택스 현금영수증 조회
    if (tab === "hometax-cash") {
      const cashReceipts = await queryCashReceipts({
        startDate,
        endDate,
        limit,
        offset
      }).catch(() => ({ receipts: [], total: 0 }));

      const list = safeArray(cashReceipts?.receipts || cashReceipts);
      const filteredList = searchText
        ? list.filter((rcpt: any) =>
            (rcpt.franchiseName || "").includes(searchText) ||
            (rcpt.approvalNumber || "").includes(searchText)
          )
        : list;

      return NextResponse.json({
        success: true,
        data: {
          list: filteredList,
          total: cashReceipts?.total || filteredList.length
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
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed (4 = 5월)

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

      const cardTxList = safeArray<any>(cardTxRes?.transactions || cardTxRes);
      const taxInvoiceList = safeArray<any>(taxInvoiceRes?.invoices || taxInvoiceRes);
      const taxExemptList = safeArray<any>(taxExemptRes?.invoices || taxExemptRes);
      const cashReceiptList = safeArray<any>(cashReceiptRes?.receipts || cashReceiptRes);

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

        const amount = Number(tx.amount) || 0;
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
