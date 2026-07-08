const fs = require('fs');
const path = require('path');

// 1. SidebarMenu.tsx 패치
const sidebarPath = 'C:\\dev\\egdesk-PublicSMS\\src\\components\\SidebarMenu.tsx';
if (fs.existsSync(sidebarPath)) {
  let content = fs.readFileSync(sidebarPath, 'utf8');
  // Bot 임포트 추가
  if (!content.includes('Bot')) {
    content = content.replace('GripVertical, Activity, Smartphone, Mic', 'GripVertical, Activity, Smartphone, Mic, Bot');
  }
  // MENU_STATIC_MAP 에 /ai-settings 추가
  if (!content.includes('/ai-settings')) {
    const target = '"/meeting-minutes": { label: "회의 기록 AI", icon: Mic, color: "text-purple-400" }';
    const replacement = target + ',\n  "/ai-settings": { label: "AI 비서 설정", icon: Bot, color: "text-indigo-400" }';
    content = content.replace(target, replacement);
  }
  fs.writeFileSync(sidebarPath, content, 'utf8');
  console.log('✅ SidebarMenu.tsx patched successfully.');
}

// 2. DynamicTitle.tsx 패치
const titlePath = 'C:\\dev\\egdesk-PublicSMS\\src\\components\\DynamicTitle.tsx';
if (fs.existsSync(titlePath)) {
  let content = fs.readFileSync(titlePath, 'utf8');
  if (!content.includes('/ai-settings')) {
    const target = '"/settings": "시스템 설정",';
    const replacement = target + '\n      "/ai-settings": "AI 비서 및 하이브리드 라우팅 설정",';
    content = content.replace(target, replacement);
  }
  fs.writeFileSync(titlePath, content, 'utf8');
  console.log('✅ DynamicTitle.tsx patched successfully.');
}

// 3. MainContentWrapper.tsx 패치
const wrapperPath = 'C:\\dev\\egdesk-PublicSMS\\src\\components\\MainContentWrapper.tsx';
if (fs.existsSync(wrapperPath)) {
  let content = fs.readFileSync(wrapperPath, 'utf8');
  if (!content.includes('/ai-settings')) {
    const target = "pathname.startsWith('/estimates/statement-write') ||";
    const replacement = target + "\n    pathname.startsWith('/ai-settings') ||";
    content = content.replace(target, replacement);
  }
  fs.writeFileSync(wrapperPath, content, 'utf8');
  console.log('✅ MainContentWrapper.tsx patched successfully.');
}
