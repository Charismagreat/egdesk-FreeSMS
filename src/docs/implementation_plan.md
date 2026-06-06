# 안전 관리 AI 페이지 사이드바 추가 및 타이틀 변경 구현 계획

이 계획은 `safety-management` 페이지를 좌측 사이드바에 추가하고, 관련 타이틀과 시스템 설정의 메뉴 관리 영역 표시명을 '안전 관리 AI'로 변경하며, 추가적으로 스마트 모바일 채널 대시보드 영역에 'AI 안전 TBM 서명' 모바일 페이지 주소를 추가하기 위한 것입니다.

## 제안된 변경 사항

### 1. 사이드바 컴포넌트

#### [MODIFY] [SidebarMenu.tsx](file:///C:/dev/egdesk-FreeSMS/src/components/SidebarMenu.tsx)
- `lucide-react`에서 `Shield` 아이콘을 가져오도록 추가합니다.
- `MENU_STATIC_MAP` 객체에 `"/safety-management": { label: "안전 관리 AI", icon: Shield, color: "text-red-400" }` 항목을 추가하여 좌측 사이드바에 노출되도록 설정합니다.

### 2. 시스템 설정 컴포넌트

#### [MODIFY] [MenuSettingsCard.tsx](file:///C:/dev/egdesk-FreeSMS/src/app/settings/MenuSettingsCard.tsx)
- `lucide-react`에서 `Shield` 아이콘을 가져오도록 추가합니다.
- `MENU_METADATA_MAP` 객체에 `"/safety-management": { label: "안전 관리 AI", icon: Shield, color: "text-red-650" }` 항목을 추가하여 시스템 설정의 "사이드바 동적 메뉴 활성 및 순서 설정" 영역에 올바른 이름과 아이콘이 표시되도록 합니다.

### 3. 안전 관리 AI 페이지

#### [MODIFY] [page.tsx](file:///C:/dev/egdesk-FreeSMS/src/app/safety-management/page.tsx)
- 496번 라인의 대시보드 내부 메인 타이틀을 `"안전 관리 AI 관제 센터"`에서 `"안전 관리 AI"`로 수정합니다.

### 4. 대시보드 스마트 모바일 채널 영역

#### [MODIFY] [MobileHubWidget.tsx](file:///C:/dev/egdesk-FreeSMS/src/components/MobileHubWidget.tsx)
- `lucide-react`에서 `Shield` 아이콘을 가져오도록 추가합니다.
- `channels` 배열에 `"/m/safety/tbm"` 경로로 바로가기 가능한 `"AI 안전 TBM 서명"` 항목을 추가하여 대시보드 모바일 허브 위젯에서 즉시 확인하고 배포할 수 있도록 설정합니다.

---

## 검증 계획

### 수동 검증
1. 로컬 개발 서버(포트 4000)를 구동하여 웹 브라우저로 접속합니다.
2. 좌측 사이드바에 '안전 관리 AI' 메뉴가 생성되었는지 확인합니다.
3. 해당 메뉴를 클릭하여 `safety-management` 페이지로 이동한 뒤, 내부 타이틀이 '안전 관리 AI'로 노출되는지 확인합니다.
4. '시스템 설정' 페이지로 이동하여 '사이드바 동적 메뉴 활성 및 순서 설정' 영역의 리스트에 '안전 관리 AI'가 아이콘과 함께 정상적으로 나타나는지 확인합니다.
5. 대시보드로 이동하여 '스마트 모바일 채널' 위젯에 'AI 안전 TBM 서명' 카드가 추가되었는지 확인하고, 링크 복사 및 QR코드 생성이 정상 동작하는지 검증합니다.
