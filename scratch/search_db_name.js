const { executeSQL, queryTable } = require('../egdesk-helpers');

async function searchDb() {
  console.log('--- 데이터베이스(user_data.db) 내 "성공파트너스" 및 "테크솔루션" 탐색 시작 ---');
  
  // 1. system_settings 검색
  try {
    const res = await queryTable('system_settings', {});
    console.log(`\n1. system_settings 레코드 수: ${res.rows?.length || 0}`);
    res.rows?.forEach(r => {
      const valStr = JSON.stringify(r);
      if (valStr.includes('성공') || valStr.includes('테크') || valStr.includes('파트너스') || valStr.includes('솔루션')) {
        console.log(`   [발견!] system_settings -> key: ${r.key}, value: ${r.value}`);
      }
    });
  } catch (err) {
    console.error('system_settings 조회 실패:', err.message);
  }

  // 2. partners 검색
  try {
    const res = await queryTable('partners', {});
    console.log(`\n2. partners 레코드 수: ${res.rows?.length || 0}`);
    res.rows?.forEach(r => {
      const valStr = JSON.stringify(r);
      if (valStr.includes('성공') || valStr.includes('테크') || valStr.includes('파트너스') || valStr.includes('솔루션')) {
        console.log(`   [발견!] partners -> ID: ${r.id}, Name: ${r.name || r.company_name}`);
      }
    });
  } catch (err) {
    console.error('partners 조회 실패:', err.message);
  }

  // 3. 지식 규칙(RAG) 테이블 또는 기타 주요 테이블 검색
  try {
    const tablesRes = await executeSQL("SELECT name FROM sqlite_master WHERE type='table';", []);
    console.log('\n3. 전체 SQLite 테이블 목록:', tablesRes.map(t => t.name).join(', '));

    for (const table of tablesRes) {
      const tableName = table.name;
      // 너무 큰 로그 테이블 등은 제외
      if (tableName === 'ai_token_usage_logs' || tableName === 'inventory_logs') continue;
      
      try {
        const rows = await executeSQL(`SELECT * FROM ${tableName} LIMIT 100;`, []);
        rows.forEach(r => {
          const valStr = JSON.stringify(r);
          if (valStr.includes('성공') || valStr.includes('테크') || valStr.includes('파트너스') || valStr.includes('솔루션')) {
            console.log(`   [발견!] 테이블 [${tableName}] -> 데이터:`, r);
          }
        });
      } catch (e) {
        // 테이블 조회 무시
      }
    }
  } catch (err) {
    console.error('전체 테이블 검색 실패:', err.message);
  }

  console.log('\n--- 탐색 종료 ---');
}

searchDb();
