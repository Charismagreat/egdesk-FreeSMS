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

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('google_ai_api_key')) return;

  console.log(`v2 Analyzing: ${filePath}`);

  // 1. getGeminiApiKey 임포트 추가
  if (content.includes('queryTable') && !content.includes('getGeminiApiKey')) {
    content = content.replace(/import\s*\{([^}]*queryTable[^}]*)\}\s*from\s*['"]([^'"]+)['"]/g, (match, p1, p2) => {
      if (!p1.includes('getGeminiApiKey')) {
        return `import { ${p1.trim()}, getGeminiApiKey } from '${p2}'`;
      }
      return match;
    });
  }

  // 2. 2차 강제 디코더/폴백 인젝션
  const targetCheck = /const\s+apiKey\s*=\s*settingsRes\.rows\s*&&\s*settingsRes\.rows\.length\s*>\s*0\s*\?\s*settingsRes\.rows\[0\]\.value\s*:\s*null;/;
  const targetCheckLet = /let\s+apiKey\s*=\s*settingsRes\.rows\s*&&\s*settingsRes\.rows\.length\s*>\s*0\s*\?\s*settingsRes\.rows\[0\]\.value\s*:\s*null;/;
  
  const replacement = `let googleApiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;
    if (!googleApiKey || !googleApiKey.startsWith('AIzaSy')) {
      try {
        const decryptedKeyRes = await getGeminiApiKey({ name: googleApiKey || '' });
        if (decryptedKeyRes && decryptedKeyRes.success && decryptedKeyRes.apiKey) {
          googleApiKey = decryptedKeyRes.apiKey;
        }
      } catch (err) {}
    }
    const apiKey = googleApiKey || 'wonconduct';`;

  const replacementLet = `let googleApiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;
    if (!googleApiKey || !googleApiKey.startsWith('AIzaSy')) {
      try {
        const decryptedKeyRes = await getGeminiApiKey({ name: googleApiKey || '' });
        if (decryptedKeyRes && decryptedKeyRes.success && decryptedKeyRes.apiKey) {
          googleApiKey = decryptedKeyRes.apiKey;
        }
      } catch (err) {}
    }
    apiKey = googleApiKey || 'wonconduct';`;

  let original = content;

  if (targetCheck.test(content)) {
    content = content.replace(targetCheck, replacement);
  } else if (targetCheckLet.test(content)) {
    content = content.replace(targetCheckLet, replacementLet);
  }

  // 3. 에러 차단 가드레일 제거
  const errorGuardPattern = /if\s*\(!apiKey\)\s*\{\s*return\s+NextResponse\.json\(\s*\{\s*success:\s*false,\s*error:\s*['"]구글\s+AI\s+API\s+키가[\s\S]*?\}\s*,\s*\{\s*status:\s*400\s*\}\s*\);\s*\}/g;
  if (errorGuardPattern.test(content)) {
    content = content.replace(errorGuardPattern, '');
  }

  const errorGuardPattern2 = /if\s*\(!apiKey\)\s*\{\s*return\s+NextResponse\.json\(\s*\{\s*success:\s*false,\s*error:\s*['"]Google\s+AI\s+API[\s\S]*?\}\s*,\s*\{\s*status:\s*400\s*\}\s*\);\s*\}/g;
  if (errorGuardPattern2.test(content)) {
    content = content.replace(errorGuardPattern2, '');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   ➡️ v2 Patched successfully.`);
  }
});
console.log('v2 Batch patching complete.');
