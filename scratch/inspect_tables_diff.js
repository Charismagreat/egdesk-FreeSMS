const { executeSQL, listTables } = require('../egdesk-helpers');

async function diffTables() {
  try {
    // 1. listTables()가 반환하는 45개의 스캔 대상 테이블 목록
    const mcpTablesResult = await listTables();
    const mcpTableNames = Array.isArray(mcpTablesResult.tables) 
      ? mcpTablesResult.tables.map(t => t.tableName) 
      : [];

    // 2. sqlite_master에서 직접 긁어오는 52개의 실제 물리 테이블 목록
    const rawTablesRes = await executeSQL("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC;");
    const rawTableNames = rawTablesRes.rows ? rawTablesRes.rows.map(r => r.name) : [];

    console.log(`MCP 감시 관리 대상 테이블 수: ${mcpTableNames.length}`);
    console.log(`실제 SQLite3 내부 물리 테이블 수: ${rawTableNames.length}`);

    // 차이나는 테이블 (sqlite_master에는 있으나 listTables()에는 누락된 7개의 테이블)
    const diff = rawTableNames.filter(name => !mcpTableNames.includes(name));

    console.log('\n--- 누락된 7개의 테이블 목록 ---');
    console.log(JSON.stringify(diff, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

diffTables();
