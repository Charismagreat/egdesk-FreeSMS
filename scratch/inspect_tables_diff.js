const Database = require('better-sqlite3');
const dbPath = 'C:\\Users\\CHARISMA\\AppData\\Roaming\\egdesk\\database\\user_data.db';
const db = new Database(dbPath);

try {
  console.log('=== [Forensic] Querying user_tables ===');
  const userTables = db.prepare('SELECT * FROM user_tables;').all();
  console.log(JSON.stringify(userTables));

  console.log('\n=== [Forensic] Querying user_columns for expense_projects ===');
  const userColumns = db.prepare('SELECT * FROM user_columns WHERE table_name = "expense_projects";').all();
  console.log(JSON.stringify(userColumns));
} catch (e) {
  console.error('Forensic failed:', e.message);
}

db.close();
