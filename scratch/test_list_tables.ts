import { listTables } from '../egdesk-helpers';

async function main() {
  try {
    console.log("=== 이지데스크 API 서버 물리 테이블 목록 조회 시작 ===");
    const result = await listTables();
    console.log("조회 성공! 결과 데이터:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("조회 실패 에러:", error);
  }
}

main();
