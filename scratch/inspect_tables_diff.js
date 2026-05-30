const Database = require('better-sqlite3');
const dbPath = 'C:\\Users\\CHARISMA\\AppData\\Roaming\\egdesk\\database\\user_data.db';
const db = new Database(dbPath);

try {
  console.log('=== [Forensic] user_tables DDL ===');
  const ddl = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_tables';").get();
  console.log(ddl.sql);

  console.log('\n=== [Forensic] SELECT * FROM user_tables ===');
  const rows = db.prepare('SELECT * FROM user_tables;').all();
  console.log(JSON.stringify(rows));
} catch (e) {
  console.error('Forensic failed:', e.message);
}

db.close();
