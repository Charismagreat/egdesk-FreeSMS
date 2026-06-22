# 옴니채널 마케팅 및 RPA 업무 자동화(RPA) 메일 연동 시나리오 작업 목록

- [x] 데이터베이스 스키마 보완 및 고객 API 수정
  - [x] `src/lib/setup-db.ts` 내 `crm_customers`에 `email` 컬럼 추가
  - [x] `src/app/api/customers/route.ts`에 고객 등록 시 `email` 컬럼 처리 추가
- [x] 아이디어 3: 초개인화 HTML 마케팅 뉴스레터 발송 연동
  - [x] `src/lib/ai-content-generator.ts` 내 뉴스레터 HTML 콘텐츠 생성 로직 추가 (Gemini Prompt 확장 & 로컬 폴백 HTML 구현)
  - [x] `src/app/api/ai-briefing/route.ts`의 `POST` 핸들러에 타겟 고객 이메일 발송 연동 (`sendMail` 활용)
  - [x] `src/components/AiCopilotWidget.tsx` 내 옴니채널 마케팅 탭에 "이메일 뉴스레터" 뷰 추가 및 미리보기 iframe 연동
- [x] 아이디어 4: 안전 TBM 및 품질/설비 일일 보고서 아카이빙 개발
  - [x] `src/app/api/automation/daily-archive/route.ts` API 신설 (당일 안전 TBM, 품질 체크리스트, 설비 점검 수집 및 종합 HTML 생성)
  - [x] 메일 발송 파이프라인 연동 (`archive_email` 또는 폴백 본사 이메일 전송)
- [x] 아이디어 5: 임직원 서류 자가 발급 메일 전송 개발
  - [x] `src/app/api/templates-new/send-email/route.ts` API 신설 (Mustache 템플릿 변수 치환, 메일 전송 및 발급 대장 `crm_employment_certificate_logs` 이력 적재)
  - [x] `src/app/m/form-management-new/hooks/useMobileForm.ts` 내 이메일 발송 훅 함수 연동
  - [x] `src/app/m/form-management-new/components/MobileFormIssuer.tsx` 내 [이메일로 발송] 버튼 및 이메일 입력 모달 추가
- [/] 타입 검증 및 동작 확인
  - [ ] `npx tsc --noEmit` 정적 타입 검증
  - [x] UI를 통한 업로드 및 빌드 테스트 확인진행
- [ ] Walkthrough 보고서 작성 및 최종 커밋
