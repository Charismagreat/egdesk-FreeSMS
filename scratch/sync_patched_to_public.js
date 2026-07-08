const fs = require('fs');
const path = require('path');

const modifiedFiles = [
  'src/app/api/ai/contextual-help/route.ts',
  'src/app/api/easybot/event-handler/route.ts',
  'src/app/api/easybot/ocr/route.ts',
  'src/app/api/easybot/route.ts',
  'src/app/api/estimates/ocr-sales-order/route.ts',
  'src/app/api/estimates/ocr/route.ts',
  'src/app/api/expenses/ocr/route.ts',
  'src/app/api/financials/route.ts',
  'src/app/api/financials/upload/route.ts',
  'src/app/api/hr/ai-briefing/route.ts',
  'src/app/api/hr/contracts/analyze/route.ts',
  'src/app/api/instagram/generate/route.ts',
  'src/app/api/inventory/deadstock/search/route.ts',
  'src/app/api/inventory/inbounds/ocr/route.ts',
  'src/app/api/lawyer-ai/analyze/route.ts',
  'src/app/api/meeting-minutes/analyze-audio/route.ts',
  'src/app/api/meeting-minutes/analyze-image/route.ts',
  'src/app/api/meeting-minutes/analyze-text/route.ts',
  'src/app/api/meeting-minutes/diarize/route.ts',
  'src/app/api/meeting-minutes/interim/route.ts',
  'src/app/api/meeting-minutes/recommend/route.ts',
  'src/app/api/meeting-minutes/route.ts',
  'src/app/api/naver-blog/generate-keywords/route.ts',
  'src/app/api/naver-blog/generate/route.ts',
  'src/app/api/partners/analyze/route.ts',
  'src/app/api/partners/ocr/route.ts',
  'src/app/api/price-tracker/ai-recommend/route.ts',
  'src/app/api/price-tracker/ai-search-miner/route.ts',
  'src/app/api/price-tracker/ai-selector/route.ts',
  'src/app/api/quality/ncr/route.ts',
  'src/app/api/quality/spc/route.ts',
  'src/app/api/safety/near-miss/route.ts',
  'src/app/api/safety/risk-assessment/route.ts',
  'src/app/api/safety/tbm/route.ts',
  'src/app/api/settings/estimate-ai/route.ts',
  'src/app/api/settings/feedback/email/draft/route.ts',
  'src/app/api/shared-views/recommend/route.ts',
  'src/app/api/templates-new/ai-query/route.ts'
];

const sourceBase = 'C:\\dev\\egdesk-FreeSMS';
const destBase = 'C:\\dev\\egdesk-PublicSMS';

modifiedFiles.forEach(relPath => {
  const srcPath = path.join(sourceBase, relPath);
  const destPath = path.join(destBase, relPath);

  // 대상 폴더가 실존하는지 확인 (파일 상위 폴더)
  const destDir = path.dirname(destPath);

  if (fs.existsSync(destDir)) {
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Synced to PublicSMS: ${relPath}`);
    } catch (err) {
      console.error(`❌ Failed to copy ${relPath}:`, err.message);
    }
  } else {
    // 트리밍된 폴더인 경우 스킵
    console.log(`ℹ️ Skipped (trimmed in PublicSMS): ${relPath}`);
  }
});
console.log('Sync process complete.');
