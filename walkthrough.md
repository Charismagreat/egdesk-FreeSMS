# 근로계약 기안 및 모바일 전자서명 워크플로우 구현 보고서

이전 온보딩 자동화 단계의 후속 조치로서, 최고관리자가 시스템 상에서 직접 근로 계약 세부 조건을 작성하여 예약 문자로 서명을 요청하고, 신입 사원이 모바일 화면에서 노동법 11개 표준 조항을 확인 후 손가락/마우스 터치로 서명을 완료하여 체결을 완결하는 **모바일 전자 서명 E2E 파이프라인** 구현을 최종 완료했습니다.

---

## 1. 데이터베이스 스키마 자율 마이그레이션 (완료)

- **수정 파일**: [route.ts (계약 조회/수정)](file:///C:/dev/egdesk-FreeSMS/src/app/api/hr/contracts/route.ts)
- **내용**:
  - `crm_operator_contract_settings` 테이블 정의 및 신설 시점에 근로계약 11대 필수 조항 렌더링에 필요한 메타데이터 컬럼(`start_date`, `end_date`, `work_place`, `job_description`)과 서명 상태 관리 컬럼(`status` [기본값: `'SIGNED'`], `signature_image`, `signed_at`) 및 7종 감사 컬럼들을 신설 주입했습니다.
  - 테이블이 이미 존재하는 경우, 동적으로 `PRAGMA table_info`를 검사하여 누락된 컬럼에 대해 무손실 `ALTER TABLE`을 자율적으로 구동하는 마이그레이션 코드를 탑재했습니다.

---

## 2. 근로계약 기안 및 체결 백엔드 API 신설 (완료)

### ① POST: 근로계약 서명 요청 API 
- **신규 파일**: [route.ts (서명 요청)](file:///C:/dev/egdesk-FreeSMS/src/app/api/hr/contracts/request-sign/route.ts)
- **내용**: 
  - 최고관리자 권한을 검증(SUPER_ADMIN)한 뒤 입력된 근무 조건을 `status = 'PENDING'`으로 데이터베이스에 Upsert합니다.
  - 해당 직원의 연락처(`phone`)로 고유 서명 페이지 링크(`http://localhost:4000/m/contract-sign?id=사원ID`)가 포함된 예약 문자 발송 레코드를 `message_logs` 대기열에 `PENDING` 상태로 자동 적재합니다.

### ② POST: 사원 서명 완료 제출 API
- **신규 파일**: [route.ts (서명 제출)](file:///C:/dev/egdesk-FreeSMS/src/app/api/hr/contracts/submit-sign/route.ts)
- **내용**: 
  - 모바일 서명 화면에서 전달받은 `operator_id`와 Canvas의 서명 데이터(Base64 이미지 스트링)를 수신합니다.
  - `crm_operator_contract_settings` 테이블의 상태를 `status = 'SIGNED'`, `signature_image = Base64`, `signed_at = 현재일시`로 갱신하여 근로 조건을 시스템에 공식 정착시킵니다.
  - 동시에 `crm_labor_contracts` 대장에도 `모바일_전자서명_계약서` 명칭으로 법적 합의 체결 완료 이력을 동기화 기록합니다.

---

## 3. 관리자 기안 및 서명 발송 UI 연동 (완료)

### ① 임직원 관리 테이블 및 기안 모달 연동
- **수정 파일**:
  - [OperatorTable.tsx](file:///C:/dev/egdesk-FreeSMS/src/app/operators/components/OperatorTable.tsx)
  - [page.tsx (직원 관리)](file:///C:/dev/egdesk-FreeSMS/src/app/operators/page.tsx)
- **내용**: 
  - 직원 목록 행 도구 영역에 펜 모양의 **"근로계약 모바일 서명 요청 발송"** 버튼을 신설하고 콜백을 바인딩했습니다.
  - 직원 관리 페이지 상에서 특정 직원을 대상으로 계약 기안 상태를 제어합니다.

### ② 근로계약 기안용 수동 입력 폼 개발
- **신규 파일**: [ContractRequestModal.tsx](file:///C:/dev/egdesk-FreeSMS/src/app/operators/components/ContractRequestModal.tsx)
- **내용**: 
  - 계약 기간(시작/종료일), 근무 장소, 담당 직무, 지정 시급, 소정근로시간, 근무 요일 등을 입력받는 modern, clean 폼을 설계했습니다.
  - 최저시급(2026년 기준 10,030원) 이상 검증, 주 소정시간 15시간 이상 설정 시 주휴수당 지급 의무 경고 뱃지, 실시간 소정/주휴시간 기반의 월 예상 환산급여 모던 자동 계산 안내 기능 등을 포함하여 관리자의 계약 작성을 효과적으로 보조합니다.

---

## 4. 반응형 모바일 계약 조회 및 서명 캔버스 구현 (완료)

- **신규 파일**: [page.tsx (모바일 서명)](file:///C:/dev/egdesk-FreeSMS/src/app/m/contract-sign/page.tsx)
- **레이아웃 & 비주얼 디자인 (Aesthetics)**:
  - 짙은 인디고(Indigo)와 파스텔 톤 뱃지를 활용한 SaaS 스타일 카드 뷰 디자인을 이식하여 기존의 경직된 종이 표 서식을 모던 웹 레이아웃으로 전면 시각화했습니다.
  - 사회보험(고용, 산재, 국민연금, 건강보험) 적용 상태를 우아한 배너 스타일 뱃지로 노출했습니다.
- **표준근로계약서 11가지 핵심 조항 전수 수록**:
  - 제공해주신 고용노동부 표준 양식 내의 **모든 내용(제1조 근로기간 ~ 제11조 기타, 교부 의무 및 갑/을 신의 성실 조항 등)을 누락 없이 순서대로 완전하게 배열**했습니다.
- **HTML5 Canvas Signature Pad**:
  - 모바일 터치 드래그 및 마우스 드로잉을 매끄럽게 처리하는 Signature Canvas를 장착했습니다.
  - 그리기 도중 화면 스크롤이 흔들리지 않도록 `touch-action: none` 및 `preventDefault` 제어를 완비했습니다.
  - "다시 그리기" 초기화 및 "계약서 서명 및 제출" E2E E-Sign 완료 API 처리를 포함하고, 최종 체결 성공 시 체결 내역 영수증을 담은 성공 전환 화면을 모던하게 이식했습니다.
- **사외 모바일 예외 규칙**:
  - 사내 UI/UX 규칙에 의거하여, `/m/contract-sign` 경로 진입 시 PC용 사이드바(`SidebarWrapper`)와 플로팅 이지봇(`EasyBot`), 도움말 버튼(`AIHelpManager`)을 전면 숨김 처리하여 모바일 사용성을 해치지 않도록 조치했습니다.

---

## 5. 빌드 안정성 및 배포 검증

- **정적 빌드 검사**: `npx tsc --noEmit` 정밀 컴파일을 수행하여, 형상 간 타입 모순이 완전히 해소된 **빌드 무결성(Zero Errors)**을 최종 달성했습니다.
- **형상 배포**: 수동 기안, SMS 예약, 모바일 체결 E2E 시스템 코드를 원격 저장소(`master`)로 무사히 **`git push` 전송** 완료했습니다.

---

## 6. 견적/발주/수주 AI 엑셀 대장 내보내기 컬럼 대폭 확장 (추가 완료)

- **수정 파일**: [page.tsx (대시보드)](file:///C:/dev/egdesk-FreeSMS/src/app/estimates/page.tsx)
- **내용**:
  - 기존의 마스터 정보 및 품목 컬럼에 더해, 각 모듈(받은견적, 발주, 보낸견적, 수주)에 적재된 모든 비즈니스 정보와 **품목별 납기일(delivery_date)** 컬럼을 대대적으로 추가 매핑했습니다.
  - **받은 견적 (`inbound_est`)**: `첨부파일(file_url)`, `사업자등록증(business_license_url)`, `연계발주번호(purchase_order_number)`, `품목납기일(delivery_date)` 추가 (총 19개 컬럼)
  - **발주 대장 (`inbound_po`)**: `입고완료일시(completed_at)`, `품목납기일(delivery_date)` 추가 (총 16개 컬럼)
  - **보낸 견적 (`outbound_est`)**: `첨부파일(file_url)`, `연계수주번호(sales_order_number)`, `품목납기일(delivery_date)` 추가 (총 17개 컬럼)
  - **수주 대장 (`outbound_so`)**: `고객발주번호(client_order_no)`, `바이어담당자(customer_manager)`, `마스터납기일(delivery_date)`, `품목납기일(delivery_date)` 추가 (총 18개 컬럼)
  - 데이터의 누락 및 컬럼 밀림 현상이 발생하지 않도록 컬럼 수와 매핑 값 개수를 엄격히 일치시켰으며, 한글 깨짐 방지용 UTF-8 BOM 헤더를 적용하여 Excel 호환성을 보장했습니다.
  - `npx tsc --noEmit` 검사 결과 완벽한 무결성을 보장합니다.

---

## 7. 평탄화 데이터 실시간 웹 뷰어 (Web View) 및 컴포넌트 연동 (완료)

- **신규 파일**: [page.tsx (웹뷰)](file:///C:/dev/egdesk-FreeSMS/src/app/estimates/web-view/page.tsx)
- **수정 파일**:
  - [page.tsx (대시보드)](file:///C:/dev/egdesk-FreeSMS/src/app/estimates/page.tsx)
  - [InboundHub.tsx](file:///C:/dev/egdesk-FreeSMS/src/app/estimates/components/InboundHub.tsx)
  - [OutboundHub.tsx](file:///C:/dev/egdesk-FreeSMS/src/app/estimates/components/OutboundHub.tsx)
- **내용**:
  - 엑셀 다운로드 버튼 바로 옆에 **"🖥️ 웹에서 보기"** 버튼을 배치하고, 대용량 데이터 전달을 위해 브라우저 `sessionStorage`를 데이터 매개체로 활용하여 새 탭(`_blank`)에서 전용 뷰어 웹페이지를 실행하도록 워크플로우를 설계했습니다.
  - 새 탭에서 열리는 웹 뷰어에는 다음 핵심 기능들이 완전히 독립적으로 구동됩니다:
    - **실시간 전체 텍스트 검색**: 검색어 입력 즉시 바이어명, 견적번호, 품목명 등 모든 텍스트에 대한 인라인 매칭 필터링이 즉각 수행됩니다.
    - **헤더 클릭 기반 컬럼 정렬**: 텍스트 알파벳 정렬뿐 아니라 수량, 금액, 단가 등 숫자성 데이터 역시 쉼표/한글을 정제하여 크기순으로 오름차순/내림차순 정렬할 수 있는 동적 헬퍼를 이식했습니다.
    - **유연한 페이지네이션**: 페이지당 개수 선택(10, 15, 30, 50개 보기) 및 이전/다음 및 개별 번호 뱃지 이동 제어가 완비되었습니다.
    - **럭셔리 HSL 글래스모피즘 디자인**: 심야 블루 톤의 우아한 네온 광원 배경과 은은한 반투명 카드를 조화시킨 프리미엄 테마를 이식하여 사용성 극대화 및 고품격 비주얼을 제공합니다.


