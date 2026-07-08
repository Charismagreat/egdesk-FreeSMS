const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\dev\\egdesk-FreeSMS\\src\\app\\api';

function getAllTsFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTsFiles(fullPath));
    } else if (file.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getAllTsFiles(targetDir);
console.log(`Found ${files.length} TS files to analyze...`);

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('google_ai_api_key')) return;

  console.log(`Analyzing file: ${filePath}`);

  // 1. getGeminiApiKey 임포트 추가
  if (content.includes('queryTable') && !content.includes('getGeminiApiKey')) {
    // 중괄호 { ... queryTable ... } 안에 getGeminiApiKey 추가
    content = content.replace(/import\s*\{([^}]*queryTable[^}]*)\}\s*from\s*['"]([^'"]+)['"]/g, (match, p1, p2) => {
      if (!p1.includes('getGeminiApiKey')) {
        return `import { ${p1.trim()}, getGeminiApiKey } from '${p2}'`;
      }
      return match;
    });
  }

  // 2. 키 획득 패턴 치환
  // 패턴 A: 400 에러 차단형 가드레일 (주로 settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null 형태)
  const patternA = /const\s+settingsRes\s*=\s*await\s*queryTable\('system_settings',\s*\{\s*filters:\s*\{\s*key:\s*'google_ai_api_key'\s*\}\s*\}\);\s*const\s+apiKey\s*=\s*settingsRes\.rows\s*&&\s*settingsRes\.rows\.length\s*>\s*0\s*\?\s*settingsRes\.rows\[0\]\.value\s*:\s*null;\s*if\s*\(!apiKey\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?\}\s*;?\s*\}/;

  const repA = `const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
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
    const apiKey = googleApiKey || 'wonconduct';`;

  // 패턴 B: try-catch 형태의 조회 블록 후 if (!apiKey) 차단형 가드레일
  const patternB = /let\s+apiKey\s*:\s*string\s*\|\s*null\s*=\s*null;\s*try\s*\{[\s\S]*?google_ai_api_key[\s\S]*?\}\s*catch[\s\S]*?\}\s*if\s*\(!apiKey\)\s*\{[\s\S]*?\}/;
  
  const repB = `let apiKey = null;
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
    } catch (e) {
      console.error('Failed to get api key, using wonconduct fallback');
      apiKey = 'wonconduct';
    }`;

  // 패턴 C: try-catch 형태의 조회 블록 (단순 에러 리깅 용도)
  const patternC = /let\s+apiKey\s*=\s*null;\s*try\s*\{[\s\S]*?google_ai_api_key[\s\S]*?\}\s*catch[\s\S]*?\}\s*if\s*\(!apiKey\)\s*\{[\s\S]*?\}/;

  // 단순 400 에러를 유발하지 않는 try-catch 형태의 apiKey 획득 블록 (예: diarize 등)
  const patternD = /let\s+apiKey\s*=\s*null;\s*try\s*\{[\s\S]*?google_ai_api_key[\s\S]*?\}\s*catch[\s\S]*?\}/;
  
  const repD = `let apiKey = null;
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
      console.warn('⚠️ system_settings 조회 실패:', dbErr);
      apiKey = 'wonconduct';
    }`;

  let original = content;
  
  if (patternA.test(content)) {
    content = content.replace(patternA, repA);
  }
  if (patternB.test(content)) {
    content = content.replace(patternB, repB);
  }
  if (patternC.test(content)) {
    content = content.replace(patternC, repD);
  }
  if (patternD.test(content)) {
    content = content.replace(patternD, repD);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   ➡️ Patched successfully.`);
  } else {
    // 수동 정합성을 위해 2차 간단 대체 시도
    // settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null 형태의 2차 단순 대체
    const simpleTarget = `const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    const apiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;`;
    
    const simpleReplacement = `const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
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
    const apiKey = googleApiKey || 'wonconduct';`;

    if (content.includes(simpleTarget)) {
      content = content.replace(simpleTarget, simpleReplacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   ➡️ Simply patched successfully.`);
    } else {
      console.log(`   ⚠️ Manual review recommended (no pattern match).`);
    }
  }
});
console.log('Batch patching complete.');
