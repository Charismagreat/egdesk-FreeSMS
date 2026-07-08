const fs = require('fs');
const path = require('path');

const files = [
  'C:\\dev\\egdesk-FreeSMS\\src\\app\\api\\meeting-minutes\\analyze-image\\route.ts',
  'C:\\dev\\egdesk-FreeSMS\\src\\app\\api\\meeting-minutes\\analyze-text\\route.ts',
  'C:\\dev\\egdesk-FreeSMS\\src\\app\\api\\meeting-minutes\\diarize\\route.ts',
  'C:\\dev\\egdesk-FreeSMS\\src\\app\\api\\meeting-minutes\\interim\\route.ts',
  'C:\\dev\\egdesk-FreeSMS\\src\\app\\api\\meeting-minutes\\recommend\\route.ts',
  'C:\\dev\\egdesk-FreeSMS\\src\\app\\api\\meeting-minutes\\route.ts'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log('Skipping (not found):', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. getGeminiApiKey 임포트 추가
  if (content.includes("import { queryTable") && !content.includes("getGeminiApiKey")) {
    content = content.replace("import { queryTable", "import { queryTable, getGeminiApiKey");
  }

  // 2. API 키 획득 블록 및 !apiKey 에러 리턴 블록 치환
  const targetPattern = /\/\/ Google AI API 키 획득[\s\S]*?if \(!apiKey\) \{[\s\S]*?\}\);[\s\S]*?\}/;
  
  const replacement = `// Google AI API 키 획득 및 이지데스크 연동 키 조회
    let apiKey = null;
    try {
      const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
      let googleApiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;

      if (!googleApiKey || !googleApiKey.startsWith('AIzaSy')) {
        try {
          const decryptedKeyRes = await getGeminiApiKey({ name: googleApiKey || '' });
          if (decryptedKeyRes && decryptedKeyRes.success && decryptedKeyRes.apiKey) {
            googleApiKey = decryptedKeyRes.apiKey;
          }
        } catch (keyErr) {
          console.error('⚠️ EGDesk에서 실제 구글 API 키를 해독해오는 데 실패했습니다:', keyErr.message);
        }
      }
      apiKey = googleApiKey || 'wonconduct';
    } catch (dbErr) {
      console.warn('⚠️ system_settings 조회 실패 (API 키 획득 불가능):', dbErr);
      apiKey = 'wonconduct';
    }`;

  if (targetPattern.test(content)) {
    content = content.replace(targetPattern, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Successfully patched:', filePath);
  } else {
    console.log('❌ Pattern mismatch for:', filePath);
  }
});
