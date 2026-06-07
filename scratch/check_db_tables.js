const Database = require('better-sqlite3');
const os = require('os');
const path = require('path');
const fs = require('fs');

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
  console.log("❌ DB 파일을 찾을 수 없습니다.");
  process.exit(1);
}

const db = new Database(targetPath);
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'import_%' AND name NOT LIKE 'sync_%' AND name NOT LIKE 'user_data_%' AND name NOT LIKE 'user_tables'
  ORDER BY name ASC;
`).all();

console.log("📋 DB 테이블 목록:");
tables.forEach(t => console.log(`- ${t.name}`));
db.close();
