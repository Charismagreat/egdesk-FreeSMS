const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = 'C:\\dev\\egdesk-FreeSMS\\user_data.db';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  db.all('SELECT * FROM ai_token_usage_logs ORDER BY created_at DESC LIMIT 10', [], (err, rows) => {
    if (err) {
      console.error('Error executing query:', err.message);
      return;
    }
    console.log('📌 [RECENT AI TOKEN LOGS]:');
    console.log(JSON.stringify(rows, null, 2));
    db.close();
  });
});
