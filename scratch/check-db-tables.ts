import { executeSQL } from '../egdesk-helpers';

async function listAllTables() {
  console.log('=== [DB 검증] 현재 존재하는 실제 물리 테이블 목록 ===\n');
  try {
    const res = await executeSQL("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('- 실제 테이블 목록:');
    if (res.rows) {
      res.rows.forEach((r: any) => {
        console.log(`  * ${r.name}`);
      });
    } else {
      console.log('  * 없음');
    }
  } catch (err: any) {
    console.error('에러 발생:', err.message);
  }
}

listAllTables();
