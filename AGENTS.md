<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:egdesk-dev-context -->
## EGDesk Development Context

EGDesk opened this project with the dev server on **port 4000** (http://localhost:4000, coding (dev)).
Do not assume port 3000. Use port 4000 for local preview and dev commands.
EGDesk MCP/API runs at http://localhost:8080.

See `.agents/rules/egdesk-dev-context.md` for full details.
<!-- END:egdesk-dev-context -->

<!-- BEGIN:database-audit-rules -->
## 데이터베이스 테이블 설계 및 소프트 삭제(Soft Delete) 준수 원칙

1. **공통 7종 감사(Audit) 및 소프트 삭제 컬럼 기본 제공**:
   - 이 프로젝트에서 새로 추가되는 모든 테이블은 데이터 변경 이력 관리와 소프트 삭제를 위해 반드시 다음 7종 컬럼을 포함해야 합니다:
     - `uuid` (TEXT) - 예측 불가능한 전역 고유 식별자
     - `updated_at` (TEXT) - 최종 수정 일시 (YYYY-MM-DD HH:MM:SS)
     - `updated_by` (TEXT) - 최종 수정자 정보
     - `deleted_at` (TEXT) - 소프트 삭제 처리 일시 (삭제되지 않은 경우 NULL)
     - `deleted_by` (TEXT) - 삭제 처리 작업자
     - `restored_at` (TEXT) - 복원 일시 (복원되지 않은 경우 NULL)
     - `restored_by` (TEXT) - 복원 처리 작업자
2. **`uuid` 컬럼의 Nullable 설계 원칙**:
   - `uuid` 컬럼은 데이터베이스 스키마에서 **필수 입력 값(`notNull: true`)으로 강제하지 않고 Nullable(선택 입력)로 정의**합니다.
   - 이는 하위 호환성 유지, 무손실 마이그레이션 적용 및 필요한 시점에 지연 생성(Lazy Generation)을 안전하게 지원하기 위함입니다.
3. **스키마 정의 및 마이그레이션 자동화 헬퍼 활용**:
   - `src/lib/setup-db.ts` 내의 `safeCreateTable` 함수는 스키마 선언 시 7종 컬럼이 생략되더라도 자동으로 컬럼을 주입해 줍니다. 신규 테이블 생성 시 이 헬퍼를 무조건 경유해야 합니다.
   - `In-app migration` 블록은 DB 내 모든 테이블을 동적으로 스캔하여 누락된 컬럼에 대해 무손실 `ALTER TABLE`을 가동하므로, 마이그레이션 시 기존 데이터를 드롭하지 않고 안전하게 보정하십시오.
4. **조회 및 통계 쿼리 시 소프트 삭제 필터링 (`deleted_at IS NULL`) 필수 적용**:
   - `executeSQL` 등을 통해 원시 쿼리를 수행하거나 동적 AI 쿼리(EasyBot)를 생성할 때, 소프트 삭제를 지원하는 테이블에 대한 조회는 WHERE 절에 반드시 `deleted_at IS NULL` 조건을 기본 주입하여 삭제된 데이터가 화면 및 계산 지표에 노출되지 않도록 하십시오.
<!-- END:database-audit-rules -->

<!-- BEGIN:mobile-ui-rules -->
## 모바일 UI/UX 렌더링 및 레이아웃 제어 규칙

1. **PC용 사이드바 노출 제한**:
   - 모든 모바일 페이지(예: `/m`, `/m/*`, `/expenses/mobile-approve`, `/employee`, `/interpretation-ai` 등) 및 외부 노출형 특수 페이지에서는 PC용 사이드바(`SidebarWrapper`)를 노출해서는 안 됩니다.
   - 새로운 모바일 관련 라우트가 추가되는 경우, 반드시 `src/components/SidebarWrapper.tsx`에 해당 경로를 예외 등록하여 사이드바가 렌더링되는 것을 방지해야 합니다.
2. **도움말 AI 및 이지봇 버튼 노출 제한**:
   - 모바일 페이지 중 오직 **임직원 통합 모바일 포털 홈 페이지 (`/m`)**에서만 도움말 AI 및 이지봇 버튼이 노출되어야 합니다.
   - 그 외의 서브 모바일 페이지(예: `/m/*`, `/expenses/mobile-approve`, `/employee`, `/interpretation-ai` 등) 및 외부 노출 페이지에서는 해당 플로팅 단추들이 화면을 가려 오작동을 유발하지 않도록 `src/components/EasyBot.tsx` 및 `src/components/AIHelpManager.tsx`에서 렌더링을 제한해야 합니다.
<!-- END:mobile-ui-rules -->
