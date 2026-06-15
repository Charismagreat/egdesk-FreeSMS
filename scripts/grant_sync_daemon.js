const fs = require('fs');
const path = require('path');
const os = require('os');
const Database = require('better-sqlite3');
const { chromium } = require('playwright');

console.log("🪙 [Grant Sync Daemon] 정부 지원금 실시간 크롤링 & RAG 적재 데몬 기동 시작...");

// 1. SQLite user_data.db 경로 획득
function getDbPath() {
  const homeDir = os.homedir();
  const appData = process.env.APPDATA || path.join(homeDir, 'AppData/Roaming');
  const paths = [
    path.join(appData, 'EGDesk/database/user_data.db'),
    path.join(appData, 'egdesk/database/user_data.db')
  ];
  
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return '';
}

// 2. 날짜 파싱 헬퍼
function parseEndDate(periodStr) {
  if (!periodStr) return '2099-12-31';
  if (periodStr.includes('~')) {
    const parts = periodStr.split('~');
    return parts[1].trim();
  }
  return '2099-12-31';
}

// 3. 예산 파싱 헬퍼
function parseBudget(title) {
  const billionMatch = title.match(/(\d+(?:\.\d+)?)\s*억/);
  if (billionMatch) {
    return parseFloat(billionMatch[1]) * 100000000;
  }
  const millionMatch = title.match(/(\d+)\s*만/);
  if (millionMatch) {
    return parseInt(millionMatch[1]) * 10000;
  }
  return 100000000; // 디폴트 1억
}

// 4. 동기화 핵심 작업 함수
async function performSync() {
  const dbPath = getDbPath();
  if (!dbPath) {
    console.error("❌ [Grant Sync Daemon] user_data.db 경로를 찾지 못했습니다. DB가 아직 생성되지 않았을 수 있습니다.");
    return;
  }

  let db;
  let browser;
  try {
    db = new Database(dbPath);
    console.log(`[Grant Sync Daemon] SQLite DB 연결 완료: ${dbPath}`);

    // crm_grant_announcements 테이블 생성 여부 확인 가드
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='crm_grant_announcements'").get();
    if (!tableCheck) {
      console.warn("⚠️ [Grant Sync Daemon] crm_grant_announcements 테이블이 아직 생성되지 않았습니다. 동기화를 다음 주기로 유예합니다.");
      db.close();
      return;
    }

    // 기존 등록된 공고 ID 조회
    const existingRows = db.prepare("SELECT id FROM crm_grant_announcements").all();
    const existingIds = new Set(existingRows.map(r => r.id));

    // Playwright 브라우저 기동
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const scrapedAnnouncements = [];
    let cpage = 1;
    const maxPages = 300; // 건수 제한 없음 요구사항 대응 (최대 300페이지, 약 4500건 탐색 가능)

    while (cpage <= maxPages) {
      const targetUrl = `https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do?cpage=${cpage}`;
      console.log(`[Grant Sync Daemon] 크롤링 중.. Page ${cpage}/${maxPages}`);
      
      try {
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 35000 });
      } catch (gotoErr) {
        console.error(`[Grant Sync Daemon] Page ${cpage} 로딩 실패 (타임아웃 등):`, gotoErr.message);
        break;
      }
      
      const rows = await page.$$('table tbody tr');
      if (rows.length === 0) {
        console.log(`[Grant Sync Daemon] No more rows found on page ${cpage}. Stopping.`);
        break;
      }

      let validRowsCount = 0;
      let newRowsCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const tr = rows[i];
        const isHeader = await tr.$('th');
        if (isHeader) continue;

        const tds = await tr.$$('td');
        if (tds.length < 5) continue;

        validRowsCount++;

        const title = await tds[2].innerText().then(t => t.trim());
        const linkEl = await tds[2].$('a');
        const href = linkEl ? await linkEl.getAttribute('href') : '';
        const periodStr = await tds[3].innerText().then(t => t.trim());
        const agency = await tds[4].innerText().then(t => t.trim());

        const pblancIdMatch = href ? href.match(/pblancId=([^&]+)/) : null;
        const pblancId = pblancIdMatch ? pblancIdMatch[1] : `TEMP-${Math.random().toString(36).substr(2, 9)}`;
        const grantId = `GR-${pblancId}`;

        // 중복 적재 방지
        if (existingIds.has(grantId)) continue;

        newRowsCount++;

        const endDate = parseEndDate(periodStr);
        const budget = parseBudget(title);

        scrapedAnnouncements.push({
          id: grantId,
          title,
          agency,
          match_score: 70, // 기본 적합도 세팅
          budget,
          end_date: endDate
        });
      }

      // 해당 페이지에 정상 공고가 존재하는데 새로운 공고가 0건이면, 수집 완료 시점 도달로 간주하고 중단
      if (validRowsCount > 0 && newRowsCount === 0) {
        console.log(`[Grant Sync Daemon] All announcements on page ${cpage} already exist in DB. Stopping pagination.`);
        break;
      }

      cpage++;
    }

    let insertedCount = 0;
    if (scrapedAnnouncements.length > 0) {
      // safeCreateTable 의 자동 감사 7종 컬럼 반영을 감안하여 raw SQL 인서트
      const stmt = db.prepare(`
        INSERT INTO crm_grant_announcements (id, title, agency, match_score, budget, end_date) 
        VALUES (@id, @title, @agency, @match_score, @budget, @end_date)
      `);
      
      const insertMany = db.transaction((annList) => {
        for (const ann of annList) {
          stmt.run(ann);
        }
      });

      insertMany(scrapedAnnouncements);
      insertedCount = scrapedAnnouncements.length;
    }

    console.log(`✅ [Grant Sync Daemon] 동기화 작업 완료! 신규 공고 ${insertedCount}건 DB 적재 완료.`);

  } catch (error) {
    console.error("❌ [Grant Sync Daemon] 동기화 예외 오류 발생:", error.message);
  } finally {
    if (db) {
      try { db.close(); } catch(e) {}
    }
    if (browser) {
      try { await browser.close(); } catch(e) {}
    }
  }
}

// 5. 스케줄 동적 체크 및 반복 실행 엔진
async function checkAndSync() {
  const dbPath = getDbPath();
  if (!dbPath) return;

  let db;
  try {
    db = new Database(dbPath);
    
    // system_settings 테이블 존재 확인 가드
    const settingsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='system_settings'").get();
    if (!settingsTable) {
      db.close();
      return;
    }

    // 1. 설정된 동기화 주기(시간 단위) 조회 (기본값: 12시간)
    let intervalHours = 12;
    const intervalRow = db.prepare("SELECT value FROM system_settings WHERE key = 'grant_sync_interval'").get();
    if (intervalRow) {
      intervalHours = parseInt(intervalRow.value, 10) || 12;
    }

    // 2. 마지막 동기화 일시 조회
    let lastSyncStr = '';
    const lastSyncRow = db.prepare("SELECT value FROM system_settings WHERE key = 'grant_last_sync_time'").get();
    if (lastSyncRow) {
      lastSyncStr = lastSyncRow.value;
    }

    const now = new Date();
    const nowEpoch = now.getTime();
    
    let shouldSync = false;
    if (!lastSyncStr) {
      // 마지막 동기화 기록이 없으면 최초 실행
      shouldSync = true;
    } else {
      const lastSyncEpoch = new Date(lastSyncStr).getTime();
      const elapsedHours = (nowEpoch - lastSyncEpoch) / (1000 * 60 * 60);
      if (elapsedHours >= intervalHours) {
        shouldSync = true;
      }
    }

    db.close();

    if (shouldSync) {
      console.log(`⏰ [Grant Sync Daemon] 스케줄 기준 충족 (주기: ${intervalHours}시간, 경과: ${lastSyncStr ? (nowEpoch - new Date(lastSyncStr).getTime()) / (1000 * 60 * 60) : '최초'}시간). 동기화를 시작합니다.`);
      await performSync();
      
      // 동기화 완료 후 DB에 마지막 동기화 시간 기록
      db = new Database(dbPath);
      const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('grant_last_sync_time', ?)").run(nowStr);
      db.close();
    } else {
      console.log(`💤 [Grant Sync Daemon] 스케줄 대기 중.. (주기: ${intervalHours}시간, 마지막 갱신: ${lastSyncStr || '기록 없음'})`);
    }

  } catch (err) {
    console.error("❌ [Grant Sync Daemon] 스케줄 체크 중 오류:", err.message);
    if (db) {
      try { db.close(); } catch(e) {}
    }
  }
}

// 최초 3초 후 체크 가동, 이후 매 30분(1800000ms)마다 주기적으로 체크
setTimeout(checkAndSync, 3000);
const checkInterval = 30 * 60 * 1000; // 30분 간격
setInterval(checkAndSync, checkInterval);
