const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs');

const DEFAULT_MENU_ITEMS = [
  { href: "/", label: "모바일 채널" },
  { href: "/sms", label: "무료 문자 발송 AI" },
  { href: "/message-logs", label: "발송 내역 조회" },
  { href: "/automation", label: "자동 발송 설정" },
  { href: "/customers", label: "고객 관리 AI" },
  { href: "/partners", label: "거래처 관리 AI" },
  { href: "/transactions", label: "거래 관리 AI" },
  { href: "/orders", label: "주문 관리 AI" },
  { href: "/payments", label: "결제 관리 AI" },
  { href: "/finance", label: "금융 정보 AI" },
  { href: "/finance-management", label: "금융 관리 AI" },
  { href: "/financials", label: "재무 정보 AI" },
  { href: "/coupons", label: "쿠폰 관리 AI" },
  { href: "/reservations", label: "예약 관리 AI" },
  { href: "/deliveries", label: "배송 관리 AI" },
  { href: "/products", label: "상품 관리 AI" },
  { href: "/estimates", label: "견적/발주/수주 AI" },
  { href: "/snaptasks", label: "AI 스냅태스크" },
  { href: "/inventory", label: "재고 관리 AI" },
  { href: "/expenses", label: "지출 관리 AI" },
  { href: "/safety-management", label: "안전 관리 AI" },
  { href: "/quality-control", label: "품질 관리 AI" },
  { href: "/facility-management", label: "설비 관리 AI" },
  { href: "/finance-cashflow", label: "자금/원가 AI" },
  { href: "/production-plan", label: "생산 계획 AI" },
  { href: "/energy-management", label: "에너지 관리 AI" },
  { href: "/safety-detection", label: "위험 감지 AI" },
  { href: "/scm-management", label: "공급망 관리 AI" },
  { href: "/grant-management", label: "지원금 신청 AI" },
  { href: "/labor-management", label: "노무 관리 AI" },
  { href: "/lawyer-ai", label: "법률 상담 AI" },
  { href: "/credit-risk", label: "채권 관리 AI" },
  { href: "/password-ai", label: "비밀번호관리 AI" },
  { href: "/hr/attendance", label: "근태 관리 AI" },
  { href: "/price-tracker", label: "가격 추적 AI" },
  { href: "/website", label: "홈페이지 빌더 AI" },
  { href: "/recruitment", label: "채용 매니저 AI" },
  { href: "/instagram", label: "인스타그램 마케팅 AI" },
  { href: "/naver-blog", label: "N-BLOG 포스팅 AI" },
  { href: "/youtube-shorts", label: "YOUTUBE 쇼츠 AI" },
  { href: "/knowledge-ai", label: "지식 관리 AI" },
  { href: "/ecount-erp-ai", label: "이카운트 ERP AI" },
  { href: "/rnd-management", label: "연구소 관리 AI" },
  { href: "/form-management-new", label: "양식 관리 AI" },
  { href: "/meeting-minutes", label: "회의 기록 AI" },
  { href: "/import-customs", label: "수입 통관 AI" },
  { href: "/ai-briefing", label: "AI 브리핑" }
];

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
  return new Database(targetPath.replace(/\\/g, '/'));
}

function main() {
  try {
    const db = getDirectDB();
    console.log("Backfilling system_menu_settings table for FreeSMS...");
    
    // 현재 들어있는 메뉴 조회
    const rows = db.prepare("SELECT menu_href FROM system_menu_settings").all();
    const existing = new Set(rows.map(r => r.menu_href));
    
    db.exec("BEGIN TRANSACTION;");
    
    // 누락된 메뉴 추가
    const insertStmt = db.prepare(`
      INSERT INTO system_menu_settings (menu_href, is_enabled, sort_order) 
      VALUES (?, 1, ?)
    `);
    
    let maxOrder = rows.length > 0 ? Math.max(...db.prepare("SELECT sort_order FROM system_menu_settings").all().map(r => r.sort_order || 0)) : 0;
    
    DEFAULT_MENU_ITEMS.forEach((item) => {
      if (!existing.has(item.href)) {
        maxOrder += 10;
        insertStmt.run(item.href, maxOrder);
        console.log(`Added missing menu: ${item.href}`);
      }
    });
    
    db.exec("COMMIT;");
    console.log("Backfill completed!");
    db.close();
  } catch (err) {
    console.error("Backfill failed:", err);
  }
}

main();
