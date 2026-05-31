"use client";

import { useState } from "react";
import { 
  HelpCircle, Search, ChevronDown, MessageSquare, 
  Bot, Sparkles, BookOpen, Ticket, Coins, Zap, TrendingUp
} from "lucide-react";

// FAQ 데이터 아이템 구조 정의
interface FAQItem {
  id: string;
  category: "sms" | "rpa" | "point" | "coupon" | "order" | "price";
  question: string;
  answer: string;
}

// 5대 핵심 카테고리 정의
const CATEGORIES = [
  { id: "all", label: "전체 가이드 📖", icon: BookOpen, color: "text-slate-400" },
  { id: "sms", label: "무료문자 & 자동화 💬", icon: MessageSquare, color: "text-indigo-400" },
  { id: "rpa", label: "AI 자율 마케팅 & RPA 🤖", icon: Bot, color: "text-purple-400" },
  { id: "point", label: "단골적립 & 지출관리 AI 🪙", icon: Coins, color: "text-amber-400" },
  { id: "coupon", label: "쿠폰 & 주문/예약 📦", icon: Ticket, color: "text-rose-400" },
  { id: "order", label: "전사 협업 & 견적/수주 AI 🪐", icon: Zap, color: "text-cyan-400" },
  { id: "price", label: "가격 & 마진 추적 AI 📈", icon: TrendingUp, color: "text-pink-400" }
];

// FAQ 데이터베이스 (AI 자율 경영 파트너 Q&A 완전 실장)
const FAQ_DATABASE: FAQItem[] = [
  // 1. 문자발송 & 자동화
  {
    id: "sms-1",
    category: "sms",
    question: "Google 메시지 앱 연동은 어떻게 작동하며 전송 비용이 진짜 0원인가요?",
    answer: "네, 맞습니다! 관리자님의 개인 스마트폰과 로컬 브라우저가 Playwright 브라우저 커넥터(RPA 기술)를 통해 안전하게 연동됩니다. 관리자님이 가입하신 모바일 요금제의 '기본 무료 문자 한도'를 시스템이 직접 호출하여 대리 발송하기 때문에, 통신사 추가 과금 없이 영구적으로 0원(무료)에 문자를 전송하실 수 있습니다."
  },
  {
    id: "sms-2",
    category: "sms",
    question: "단체 문자를 발송할 때 여러 페이지에 걸쳐 체크한 고객들이 누락되지 않나요?",
    answer: "이지데스크만의 '다중 페이지 선택 상태 보존(캐싱) 기술'이 적용되어 있습니다. 페이지를 이동하거나 한 화면에 표시되는 고객 개수(5명, 10명, 50명 등)를 변경하더라도 이전에 체크해 둔 고객들의 선택 상태가 그대로 유지됩니다. 이를 통해 수백 명의 고객 중 누락이나 실수 없이 한 번에 다량의 단체 문자를 안심하고 발송하실 수 있습니다."
  },
  {
    id: "sms-3",
    category: "sms",
    question: "특정 행동이 발생했을 때 문자가 자동 발송되게 하려면 어떻게 설정하나요?",
    answer: "[자동 발송 설정] 메뉴에서 원하시는 상황(예: 신규 고객 등록, 예약 완료, 결제 완료, 포인트 적립 등)을 'On'으로 켠 뒤, 사전에 작성해 두신 메시지 '템플릿'을 매핑해 두시면 됩니다. 이벤트가 발생할 때 시스템이 실시간으로 고객 연락처를 자동 추출하여 즉시 백그라운드에서 안내 문자를 발송합니다."
  },
  {
    id: "sms-4",
    category: "sms",
    question: "여러 대의 휴대폰(전화기)을 연결하여 멀티 채널 발송이 가능한가요?",
    answer: "네! 완벽히 지원됩니다. 무료 문자 발송 AI 화면 우측에 탑재된 [발송 기기 멀티 허브]를 통해 원하는 개수만큼 기기를 추가하고 각각 구글 메시지 QR 코드를 스캔하여 페어링하실 수 있습니다. 각 기기는 데이터 세션이 완전히 물리 독립 격리되어 세션 꼬임이나 충돌 없이 매우 안전하게 동시 구동됩니다."
  },
  {
    id: "sms-5",
    category: "sms",
    question: "기기별 문자 발송 한도 설정 및 지능형 자동 기기 전환(로드밸런싱)은 무엇인가요?",
    answer: "매장 내 등록된 여러 대의 스마트폰 요금제 한도(예: 150건 무료 요금제 폰, 450건 요금제 폰 등)에 발맞춰 각 기기별 일일 안전 발송 한도를 1건~450건 범위 내에서 자유롭게 슬라이더로 조절하여 저장하실 수 있습니다. 단체 발송 시 특정 기기가 당일 한도를 모두 채웠을 때, 시스템이 백그라운드에서 실시간으로 한도가 남은 다음 연결 기기로 동적 우회 전환(로드밸런싱 및 Failover)하여 비용 0원에 멈춤 없는 마케팅 단체 발송을 완벽히 대행합니다."
  },
  {
    id: "sms-6",
    category: "sms",
    question: "사이드바 메뉴에서 우리 매장이 사용하지 않는 기능을 숨기거나 노출 순서를 정할 수 있나요?",
    answer: "네, 아주 간편하게 지원됩니다! 최고관리자(`SUPER_ADMIN`) 계정으로 로그인하신 후 [시스템 설정] 페이지의 가장 맨 하단에 탑재된 [사이드바 동적 메뉴 활성 및 순서 설정] 카드 패널을 사용하시면 됩니다. 사용하지 않는 메뉴 아이템 우측의 On/Off 토글 단추를 클릭해 실시간으로 켜거나 끌 수 있으며, 아이템을 마우스로 드래그 앤 드롭하거나 우측의 위/아래 방향 이동 화살표를 눌러 자유롭게 순서를 재정렬하실 수 있습니다. 편집 후 우측 상단의 [메뉴 설정 저장]을 클릭하시면 새로고침 없이 즉각 사이드바에 실시간으로 순서와 노출 상태가 완벽히 반영됩니다."
  },
  {
    id: "sms-7",
    category: "sms",
    question: "부운영자 계정으로 로그인했을 때도 사이드바 메뉴 구성을 변경할 수 있나요?",
    answer: "아니요, 메뉴 구성 및 순서 편집 기능은 시스템 데이터베이스 무결성과 어드민 권한 체계 수호를 위해 오직 최고관리자(`SUPER_ADMIN`) 계정에만 권한이 부여됩니다. 부운영자(`SUB_OPERATOR`) 권한의 계정으로 로그인하여 시스템 설정에 진입하면 메뉴 설정 카드 패널이 잠금 보호 화면(가드 화면)으로 전환되어 편집할 수 없으며, 백엔드 서버의 API 단에서도 무단 권한 침입에 대해 안전하게 차단 방어막이 가동됩니다."
  },
  // 2. 마케팅 & RPA (AI 자율 마케팅 파트너 사용 가이드)
  {
    id: "rpa-1",
    category: "rpa",
    question: "인스타그램 AI 자동 마케팅 및 네이버 블로그 글 발행 주기는 어떻게 조절하나요?",
    answer: "[인스타그램 마케팅 AI] 또는 [N-BLOG 포스팅 AI] 메뉴 상단 설정 패널에서 '자동 파일럿(Autopilot)' 스위치를 켠 뒤, 간격(매일 또는 매주)과 발송 희망 시간을 지정해 주시면 됩니다. AI 비서가 매장의 광고 상품 데이터를 바탕으로 트렌디한 이미지와 블로그 글을 생성하여 약속된 스케줄에 맞춰 백그라운드에서 자동으로 예약 업로드를 수행합니다."
  },
  {
    id: "rpa-2",
    category: "rpa",
    question: "네이버 블로그나 인스타 포스팅 도중 로그인 세션이 끊기면 어떻게 해야 하나요?",
    answer: "포스팅 연동 세션이 만료되거나 꼬인 경우, 블로그 설정 탭 하단에 있는 [네이버 계정 세션 초기화] 버튼을 클릭해 초기 상태로 되돌릴 수 있으며, `http://localhost:3000/api/naver-blog/settings?action=trigger_session` API를 다이렉트로 호출하여 간편하게 일시적인 세션 동기화를 즉시 재복구하실 수 있습니다."
  },
  {
    id: "rpa-3",
    category: "rpa",
    question: "이지데스크의 AI 자율 마케팅 파트너(Autonomous Copilot)는 어떻게 사용하나요?",
    answer: "대시보드 최상단에 마운트된 Glassmorphism 카드를 통해 즉시 만나보실 수 있습니다. AI가 매일 아침 매장의 실시간 CRM 데이터를 분석하여 이탈 우려 단골, VIP 고객, 신규 가입 고객 통계를 냅니다. 여기에 오늘의 날씨를 클릭 시뮬레이션하시면, 날씨와 매장의 인기 메뉴 정보를 조합하여 초개인화된 맞춤 감성 문자 시나리오와 3대 옴니채널(블로그, 인스타, 유튜브 쇼츠) 마케팅 원고를 즉석에서 자동 설계해 냅니다."
  },
  {
    id: "rpa-4",
    category: "rpa",
    question: "원클릭 승인 시 고객 발송 및 SNS 예약은 실제로 연동되어 처리되나요?",
    answer: "네, 완벽히 오토파일럿 처리됩니다! AI가 제안한 오늘의 성장 플랜 카드를 확인하신 후 [AI 성장 플랜 승인 및 가동] 버튼을 누르시면, 타겟 고객군에 맞춘 초개인화된 문자가 이지데스크의 0원 문자 발송 엔진(message_logs 적재)을 통해 즉시 발송되며, 동시에 네이버 블로그 원고 및 인스타그램 포스팅 예약 데이터가 SCHEDULED 상태로 실시간 자동 연동 적재되어 즉각 퍼블리싱 스케줄러에 등록됩니다."
  },
  {
    id: "rpa-5",
    category: "rpa",
    question: "AI 자율 마케팅 카드와 옴니채널 광고 원고 기능의 AI API 호출을 활성/비활성화할 수 있나요?",
    answer: "네, [시스템 설정 > AI 설정]에서 두 가지 On/Off 토글 스위치로 쉽게 제어할 수 있습니다. (1) '옴니채널 AI 광고 원고 생성 기능'을 비활성화하면 원고 생성 시 실제 구글 AI API 호출을 완전히 차단하고 요금이 소모되지 않는 0원짜리 로컬 폴백 템플릿 원고만 쾌적하게 즉시 노출해 줍니다. (2) '대시보드 AI 자율 마케팅 파트너 위젯'을 비활성화하면 대시보드 최상단의 AI 분석 성장 카드를 화면에서 완벽하게 숨겨 심플한 메인 대시보드로 활용하실 수 있습니다."
  },
  // 3. 단골적립 & 보안
  {
    id: "point-1",
    category: "point",
    question: "가입하지 않은 신규 고객도 즉석에서 포인트 적립이 가능한가요?",
    answer: "네, 아주 간편합니다! 오프라인 매장의 태블릿(테이블오더)이나 쇼핑몰 주문창에서 복잡한 가입 양식 없이 오직 '휴대전화번호'만 입력하면 단 1초 만에 임시 단골 회원으로 자동 등록(Soft Sign-up)되어 즉시 첫 적립을 누릴 수 있습니다. 복잡한 가입에 따른 단골 이탈률을 제로로 만들어 줍니다."
  },
  {
    id: "point-2",
    category: "point",
    question: "포인트 결제 시 전송되는 2차 SMS OTP(인증번호)의 비용과 보안성은 어떤가요?",
    answer: "포인트 소모(최소 1,000p 이상) 결제 시, 도용 및 어뷰징 방지를 위해 고객의 폰으로 3분간만 유효한 일회용 4자리 보안 인증번호(OTP)가 전송됩니다. 이 발송 작업도 이지데스크의 평생 무료 문자 발송 커넥터로 처리되므로 매장에서 부담하는 비용은 단 0원이며, 타인의 무단 포인트 사용을 원천 차단해 안전합니다."
  },
  {
    id: "point-3",
    category: "point",
    question: "기본 포인트 적립 비율인 1%를 변경하거나 고객의 포인트를 강제로 증감할 수 있나요?",
    answer: "네! [시스템 설정 > 단골 고객 포인트 적립 설정]에서 0%(적립 중단)부터 최대 20%까지 실시간으로 조절해 즉각 소비자 화면에 동기화할 수 있습니다. 또한 [고객 관리] 대장에서 특정 고객의 상세 보기 -> [적립금 내역] 탭을 신설하여, 관리자님이 보너스 수동 적립 또는 소급 차감(양수/음수 입력)을 수행하고 모든 변동 내역을 타임라인으로 투명하게 보관할 수 있습니다."
  },
  // 3-1. 지출관리 AI & MY DB 실시간 관제 (신규 추가 🪙)
  {
    id: "point-4",
    category: "point",
    question: "지출 관리 AI 페이지에서 실제 지출일, 공제액, 송금수수료를 임의로 다 고칠 수 있나요? 아니면 입력 제한 규칙이 존재하나요?",
    answer: "지출 정합성과 회계 오차를 원천적으로 방지하기 위해 엄격한 조건부 가드 룰이 가동됩니다. `결제 상태`가 대표자에 의해 **'🟢 승인 완료(APPROVED)'** 상태이고, 동시에 `결제 수단`이 **'계좌송금, 계좌이체, 현금'** 중 하나인 지출 건에 대해서만 실제 지출일, 공제액, 송금수수료 필드가 활성화되어 직접 편집할 수 있습니다. 미승인 상태이거나 신용카드 등 다른 결제 수단인 경우에는 오입력을 차단하기 위해 입력 필드가 자동으로 비활성화되며, 실제 지출일은 품의일, 공제액은 0원, 송금수수료는 0원으로 강제 무력화/초기화 보정 처리되어 데이터의 무결성을 완벽하게 수호합니다."
  },
  {
    id: "point-5",
    category: "point",
    question: "지출 금액에서 공제액과 송금수수료가 가감되는 최종 실지출액(지급액) 산출 수식은 어떻게 되나요?",
    answer: "회사의 실제 현금 흐름을 정확히 산정하기 위해 다음과 같은 수식이 적용됩니다: **`최종 실지출액` = `승인 금액` - `공제액(승인금액에서 차감되는 금액)` + `송금수수료(송금 시 가산되는 비용)`**. PC 지출 대장 테이블의 금액 열에는 '승인 금액'과 함께 괄호 및 붉은색 글씨로 이 수식이 연산된 **최종 실지출액**이 병렬 표기되어 원화 콤마 포맷으로 즉시 대조 분석할 수 있습니다."
  },
  {
    id: "point-6",
    category: "point",
    question: "PC 화면에서 수정한 지출 정보가 모바일 관제 화면과도 연계되나요? 수정 가능한 사용자 권한은 어떻게 되나요?",
    answer: "네, 완벽하게 실시간 무선 동기화됩니다! 대표자나 최고관리자가 현장 모바일 ERP 화면(`mobile-approve`)에서 승인 금액이나 적요를 즉석 수정 및 심사하는 순간, PC 지출 대장에 즉시 동시 연동됩니다. 수정 권한은 보안상 **최고관리자(`SUPER_ADMIN`)** 또는 결재 주체인 **대표자(`PRESIDENT`)** 권한의 유저 계정으로 로그인한 경우에만 ✏️ 수정 및 삭제 버튼이 활성화되어 안전하게 구동됩니다. 권한이 없는 일반 부운영자(`SUB_OPERATOR`)가 시도할 시에는 안전하게 경고창과 함께 동작이 차단됩니다."
  },
  {
    id: "point-7",
    category: "point",
    question: "최고관리자 메뉴에 새로 추가된 'MY DB'는 무엇이며 무엇을 할 수 있는 기능인가요?",
    answer: "'MY DB'는 이지데스크 서버에 가동 중인 로컬 SQLite 물리 데이터베이스(`crm_data.db`)를 어드민 화면에서 실시간으로 감시하고 관리하는 최고관리자 전용 시스템 센터입니다. 모든 물리 테이블 목록과 실시간 데이터 행 개수를 스캔하고, 원시 SQL 쿼리를 기입해 즉시 실행해볼 수 있는 'SQL 플레이그라운드 콘솔'이 마운트되어 있습니다. 또한, 위험한 파괴적 쿼리 작동 시 실수를 막아주는 '이중 안전장치 자물쇠'가 탑재되어 있으며, 개별 행 데이터 삽입/갱신/삭제 및 Excel 연동용 CSV 백업 다운로드 기능까지 막강하게 제공합니다."
  },
  {
    id: "point-8",
    category: "point",
    question: "MY DB SQL 플레이그라운드 콘솔과 실행 결과, AI 시각화 차트를 한 번에 최초 대기 상태로 리셋할 수 있나요?",
    answer: "네, 매우 간편합니다! 최고관리자 전용 'MY DB' 페이지 우측 상단의 [전체 작업 초기화] (장미색) 버튼을 클릭하시면 됩니다. 클릭 시 대화형 SQL 입력창, 예측된 SQL 쿼리, 쿼리 실행 결과 레코드 데이터, AI 지능형 시각화 차트와 브리핑 리포트, 그리고 AI 챗봇과의 튜닝 대화 히스토리 및 브라우저의 로컬스토리지(LocalStorage) 캐시까지 모든 이전 상태가 클릭 단 한 번으로 완벽하게 초기 대기 상태로 일괄 소거 리셋되어, 깨끗한 화면에서 새로운 분석 작업을 즉시 가동하실 수 있습니다."
  },
  {
    id: "point-9",
    category: "point",
    question: "보안이 가동되는 '데이터 공유 뷰'는 무엇이며 어떻게 개설하고 일괄 관리하나요?",
    answer: "'데이터 공유 뷰'는 원본 데이터베이스 테이블의 모든 정보를 노출하지 않고, 최고관리자가 지정한 한글 친화형 컬럼만 선별하여 외부/임직원용 조회 페이지로 실시간 안전 노출하는 링크 서비스입니다. MY DB 대시보드에서 '데이터 공유 뷰 생성'을 클릭하시면 Gemini AI가 비밀번호, 소프트 삭제시점(deleted_at) 등 민감 정보를 자동 필터 마스킹 처리해 줍니다. 개설된 공유 뷰들은 MY DB 페이지 내의 [🌐 공유 뷰 관리] 탭에서 일괄 관리되며, 원클릭 주소 복사, 실제 공유 페이지 바로가기(보러가기), 그리고 외부 접근 권한을 실시간 즉시 영구 박탈할 수 있는 링크 폐쇄(삭제) 제어까지 콤팩트한 아이콘 단추 형태로 안전하고 손쉽게 수행하실 수 있습니다."
  },
  {
    id: "point-10",
    category: "point",
    question: "AI API 토큰 실시간 모니터링 대시보드와 감사록은 어떻게 구성되어 있나요?",
    answer: "구글 Gemini AI의 실시간 호출 빈도와 소모되는 토큰 용량을 최고관리자가 완벽하게 정밀 실시간 감사 분석할 수 있도록 제공하는 모니터링 관제 시스템입니다. [시스템 설정 > AI 설정] 탭 아래에 탑재되어 있으며, 오늘/최근7일/최근30일/누적 기준의 총 소모 토큰량, API 호출 횟수, 입력(질문) 및 출력(답변) 토큰 소모량 메트릭 스코어카드를 제공합니다. 특히 하단의 [실시간 AI 호출 토큰 감사록 (최근 30건)] 테이블을 통해 호출일시, 사용 모델, 구체적인 수행 업무 목적(이지봇 SQL 변환, 시각화 융합 응답, 광고 문자 패키지 생성 등) 및 정확한 토큰 수치 이력을 실시간으로 투명하게 추적 및 대조 분석할 수 있어 자원 관리가 매우 편리합니다."
  },
  {
    id: "point-11",
    category: "point",
    question: "AI 지능형 시각화 & 브리핑서에서 복잡한 수치 데이터를 표(테이블) 형태로 정리해 보여줄 수 있나요?",
    answer: "네, 완벽하게 지원됩니다! AI 비즈니스 브리핑서 본문은 풍부한 포맷팅을 위한 마크다운(Markdown) 표 문법을 지원합니다. 시각화 탭 하단의 AI 피드백 챗봇 창을 통해 \"방금 분석한 결과를 비교 표(테이블) 형식으로 보고서에 추가해 줘\" 또는 \"가장 비중이 높은 지표 5개를 요약표로 작성해 줘\"라고 요청하시면, AI 엔진이 쿼리 결과 셋을 분석하여 정돈된 표를 즉시 브리핑 본문에 교차 삽입해 줍니다. 이 상태로 [🌐 웹에 게시 및 자동 갱신]을 진행하시면 퍼블릭 공유 대시보드 웹상에도 고급스러운 표 분석 리포트가 깔끔하게 노출됩니다."
  },
  // 4. 쿠폰 & 주문/예약
  {
    id: "coupon-1",
    category: "coupon",
    question: "쿠폰의 무단 사용을 막고 마진율을 확실히 지키는 제한 조건은 어떻게 설정하나요?",
    answer: "[쿠폰 관리] 화면 하단에서 유효기간(만료일)을 설정해 만료 시 취소선 비활성화 및 실시간 결제 승인 차단을 보장할 수 있습니다. 또한, 적용 종류에서 블랙리스트(제외할 품목) 혹은 화이트리스트(허용할 품목) 방식을 택하여 특정 상품 ID 또는 카테고리명을 지정함으로써 마진을 정교하게 방어할 수 있습니다."
  },
  {
    id: "coupon-2",
    category: "coupon",
    question: "상품별로 쿠폰 할인을 전면 금지하거나 허용하는 가장 빠른 방법은 무엇인가요?",
    answer: "[상품 DB 관리] 화면에 추가된 '쿠폰 허용' 토글 스위치(원클릭 On/Off)를 사용해 실시간 제어할 수 있습니다. Next.js 서버의 메모리(RAM)를 백방 활용하는 초고속 인메모리 캐시 엔진이 걸려 있어, 주문 폭주 시에도 데이터베이스 병목 전혀 없이 마이크로초(μs) 대의 무마찰 쿠폰 유효성 필터링을 완벽 처리합니다."
  },
  {
    id: "coupon-3",
    category: "coupon",
    question: "테이블오더 주문이나 예약 등록 시 배송 대장 또는 금융과 자동으로 묶이나요?",
    answer: "네, 완벽히 오프라인 연동됩니다. 테이블오더 주문 시 배송 방식을 '택배배송'으로 기입하면 즉시 [배송 관리 AI] 대장에 상품 준비중 정보가 자동 신설되며, 카드/포인트 결제 완수 시 즉각 [결제내역] 및 [거래내역] 대장에 매출이 동기화 기록되어 종합 매출과 잔고가 실시간 정산됩니다."
  },
  // 5. 견적/발주/수주 AI 가이드 (신규 추가 🔄)
  {
    id: "order-1",
    category: "order",
    question: "받은 견적 이미지 파일의 AI OCR 분석 기능은 어떻게 작동하나요?",
    answer: "관리자님이 거래처 등 공급사로부터 전달받은 종이/사진 견적서 이미지를 대시보드에 업로드하시면, 내장된 고정밀 Gemini Vision AI가 이미지 속 단가, 수량, 품목명, 공급사 상호명, 연락처를 단 3초 만에 해독 및 파싱하여 관리자 등록 폼에 타이핑 효과로 쏙 채워넣어 줍니다. 수동 입력의 고단함을 덜어주는 최고의 AI 비서 기능입니다."
  },
  {
    id: "order-2",
    category: "order",
    question: "실물확인 뒤 최종 승인 후 재고 반영(SCM) 절차는 어떻게 수행되나요?",
    answer: "등록된 받은 견적서를 '발주서 전환' 하시면 정식 발주서 생성과 동시에 입고 대기(PENDING_INBOUND) 플래그 상태가 됩니다. 이후 물류 창고에 자재 실물이 도착했을 때, 관리자님이 직접 실물을 체크해보고 최종 확인된 실검수 수량(checkedQty)을 입력한 뒤 승인 처리를 합니다. 승인 즉시 실제 재고 대장(inventory_items)에 검수 수량만큼 가산되고 재고 연동 이력(inventory_logs)에 변동 이력이 투명하게 완벽 실시간 기록됩니다."
  },
  {
    id: "order-3",
    category: "order",
    question: "상품 DB 연동을 통한 AI 동적 견적 가격 책정 및 수주 알림톡은 무엇인가요?",
    answer: "상품 DB 중 '견적가 전용' 플래그를 켠 품목들에 대해, 바이어의 거래처 등급(VIP 단골)과 대량 구매 요청 수량(Volume)을 복합적으로 인지해 최적의 볼륨 할인 단가를 AI가 자동으로 추천 계산해 줍니다. 이 제안가와 함께 격식 있고 정중하게 품격 있는 비즈니스 제안 편지글(AI Proposal Letter)을 바이어 맞춤형으로 작성해주며, 견적 수락 후 수주 최종 승인 시 바이어에게 정중한 수주 확인서가 카카오톡 알림톡 문자로 즉각 자동 전송됩니다."
  },
  {
    id: "order-4",
    category: "order",
    question: "일반 소비자(고객)와 B2B 거래처는 어떻게 구분하여 관리하나요?",
    answer: "이지데스크는 B2C 개인 고객과 B2B 유통 거래처를 철저히 이원화하여 관리합니다. 일반 소비자는 [고객 관리] 대장에서 적립금 및 개인 프로필을 통제하고, 수/발주와 견적 영업의 주체인 기업 고객은 [거래처 관리 AI] 대장에서 사업자번호, 세금계산서 발행용 이메일, 담당자 명세, 여신 한도액(외상 거래 통제)을 독립적으로 분리하여 영구히 체계적으로 관리합니다."
  },
  {
    id: "order-5",
    category: "order",
    question: "첫 견적 요청 모바일 페이지에서 사업자등록증 첨부와 B2B 스마트 온보딩은 어떻게 진행되나요?",
    answer: "신규 거래처(바이어)가 스마트폰으로 첫 견적을 요청할 때, 사업자등록증(이미지/PDF) 파일을 첨부하면 내장된 Gemini Vision AI가 상호명, 대표자 성함, 사업장 주소, 연락처 등을 단 3초 만에 완벽하게 OCR 해독하여 입력 필드에 자동으로 입력(Auto-fill)해 줍니다. 이후 견적을 즉시 발송하면 견적 접수와 동시에 이지데스크 [거래처 관리 AI] 대장에 B2B 바이어(BUYER)로 원스톱 자동 신규 가입 처리가 완수됩니다."
  },
  {
    id: "order-6",
    category: "order",
    question: "사업자등록번호 중복 가입 체크 기능은 무엇인가요?",
    answer: "B2B 유통 거래처가 동명으로 중복 가입되어 데이터베이스나 누적 실적 타임라인이 오염되는 것을 차단하기 위한 시스템입니다. 모바일 견적 페이지에서 사업자번호 기입 후 [중복 조회]를 탭하면 백엔드 DB를 검사하여: (1) 기존 가입된 파트너일 경우 기존 B2B 프로필 명세를 원클릭 즉시 연결하여 상세 수동 입력 단계를 완전 면제해 줍니다. (2) 가입되지 않은 신규 파트너일 경우에만 사업자등록증 첨부란 및 상세 폼 직접 입력란을 활성화해 유기적인 작성을 도우며 무결성을 유지합니다."
  },
  {
    id: "order-7",
    category: "order",
    question: "스냅태스크 AI는 무엇이며 어떤 종류의 비정형 데이터를 전송할 수 있나요?",
    answer: "스냅태스크 AI는 연구개발(R&D), 마케팅, 품질관리, 생산 및 영업 등 전사적 현장의 실무자가 스마트폰으로 텍스트, 주소 링크, 사진(명함, 견적서, 합의서), 음성 녹취(M4A, MP3, WAV), 문서 PDF 등을 스냅(전송)하면, 인공지능이 문맥을 분석하여 정형 ERP 데이터베이스에 자동으로 적재하고 자율 조치하는 차세대 협업 플랫폼입니다."
  },
  {
    id: "order-8",
    category: "order",
    question: "명함 사진이나 상담 오디오를 스냅했을 때 AI의 이중 분기 트랜잭션은 어떻게 작동하나요?",
    answer: "명함이 스냅되었을 때 AI는 상호명을 DB에서 조회합니다. (1) 동일 상호명이 없을 경우: crm_partners에 신규 B2B 거래처 마스터 정보를 등록하고, 동시에 명함의 인물을 대표 담당자(is_primary=1)로 자동 지정하여 명함첩에 저장합니다. (2) 동일 상호명이 이미 존재할 경우: 기존 B2B 거래처 프로필의 주소 등을 최신 정보로 동적 업데이트하고, 인물을 일반 실무 담당자(is_primary=0)로 명함첩(crm_partner_contacts)에 신규 추가 적재하여 다중 인맥을 체계적으로 1:N 누적 보관합니다."
  },
  {
    id: "order-9",
    category: "order",
    question: "스냅태스크 AI 기능을 PC 어드민 관제 탑에서도 직접 사용할 수 있나요?",
    answer: "네, 완벽히 이식되었습니다! PC 관제 대시보드에서 특정 태스크를 탭하여 상세 팝업을 열면, 우측 타임라인 피드 영역 바로 하단에 [PC 즉석 AI 스냅 입력 위젯]이 마운트되어 있습니다. 관리자님이 모니터를 보면서 텍스트 기입은 물론 컴퓨터 속 이미지, 회의 오디오, 도면 PDF 파일을 즉시 드래그 앤 드롭 또는 선택 첨부하여 AI 자율 조치 스냅을 수행할 수 있으며, 단축키 Ctrl + Enter 로 즉석 전송 편리 기능까지 지원합니다."
  },
  {
    id: "order-10",
    category: "order",
    question: "B2B 신규 거래처 등록이나 수주 확정 시 바이어에게 안내 문자를 자동으로 보낼 수 있나요?",
    answer: "네, 완벽히 지원됩니다! [자동 발송 설정] 메뉴에서 새로 추가된 B2B & SCM 자동 발송 이벤트 3종(B2B 신규 거래처 온보딩 시, B2B 견적 요청 접수 시, B2B 수주 확정 시)을 켜고 전송할 템플릿을 연결해 두시면 됩니다. 템플릿 작성 시 B2B 특화 변수인 {상호명}, {담당자명}, {금액}, {수주번호} 등을 활용하시면, 각 이벤트 발생 순간에 바이어의 실시간 거래 정보가 자동으로 매핑되어 세련되고 품격 있는 안내 문자가 즉시 백그라운드에서 발송됩니다."
  },
  // 6. 가격 & 마진 추적 AI FAQ
  {
    id: "price-1",
    category: "price",
    question: "가격 추적 AI의 실시간 마진율은 어떻게 계산되며 원리와 템플릿 치환은 어떻게 작동하나요?",
    answer: "수집된 시장 시세와 관리자님이 설정하신 품목의 [기준 가격(원가)]을 바탕으로 백엔드에서 실시간으로 마진율을 자동 연동 산출합니다. (원자재 품목의 마진 수식: (기준원가 - 수집가격) / 기준원가 * 100). 마진율이 미리 약정한 임계값 이하로 추락하면 이벤트 엔진이 점화되어 SMS 템플릿의 변수들({item_name}, {item_code}, {captured_price}, {margin_rate})을 파싱 가격으로 동적 치환 매핑하여 무료 전송망을 타고 알림 문자가 즉각 안전하게 전달됩니다."
  },
  {
    id: "price-2",
    category: "price",
    question: "수집 사이트 AI 추천(Gemini RAG)은 어떠한 원리로 추천 및 CSS Selector를 추출하나요?",
    answer: "이지데스크에 공식 탑재된 Google Gemini API의 딥러닝 지식과 실시간 공급망 지식을 결합하는 RAG(검색 증강 생성) 아키텍처를 기반으로 동작합니다. 관리자님이 영위하시는 비즈니스 도메인 산업군과 추적하고 싶은 자재 품목 키워드를 입력하시면, 인공지능이 즉시 전 세계 공공 가격망 및 자원정보시스템의 소스 데이터 구조를 해독해 크롤러가 직접 접근할 수 있는 물리 고유 HTML CSS Selector 정보와 추천 주소를 정확하게 제안합니다. [즉시 수집 등록] 시 폼에 해당 정보가 원클릭 오토필(Auto-fill) 연동됩니다."
  },
  {
    id: "price-3",
    category: "price",
    question: "가격 변동 발생 시 FreeSMS 알림 문자가 중복 폭주하여 발송 비용이나 한도가 초과되지 않나요?",
    answer: "전혀 염려하실 필요가 없습니다! 시세 급변기나 잦은 크롤링에 따른 문자 폭탄 및 요금제 한도 유실을 원천적으로 차단하기 위해, 백엔드 발송 모듈 내부에 **'3시간의 발송 쿨다운(Cooldown) 유예 방어막'** 로직이 적용되어 있습니다. 알림 조건이 최초 감지되어 1회 경보 문자를 발송한 뒤에는, 동일한 규칙에 대해 최소 3시간 동안은 추가 발송을 유예하도록 설계되어 있어 관리자님의 휴대폰 발송 안전 한도를 완벽하게 수호합니다."
  },
  {
    id: "price-4",
    category: "price",
    question: "이지봇(EasyBot)에게 가격 추적기나 마진 상태 데이터를 직접 물어봐도 답변을 해주나요?",
    answer: "네! 가격 추적 AI 대장의 데이터 구조(`tracked_items`, `price_histories` 등)가 백엔드 이지봇 인공지능 스키마와 완벽하게 통합 설계되어 있습니다. 대시보드 챗봇 이지봇 창을 열어 마이크를 켜시거나 채팅으로 \"구리 시세 마진 상태 알려줘\", \"최근 3일간 알루미늄 파싱 가격 이력 표로 보여줘\"라고 말씀하시면, 이지봇이 실시간으로 DB를 분석해 즉석에서 고급스러운 표와 마크다운으로 인사이트 답변을 드립니다."
  },
  {
    id: "price-5",
    category: "price",
    question: "AI 경쟁 품목 자율 탐색 및 수집 노드 일괄 자동 배포/적재 기능은 어떻게 작동하나요?",
    answer: "관리자님이 F12 개발자 도구의 복잡한 CSS Selector나 특정 링크를 주입할 필요 없이, 경쟁사 품목명과 용량/수량 명세(예: '신라면', '120g 40개입')를 분리하여 자연어로만 기입하면 작동하는 최고급 편의 기능입니다. AI가 실시간 웹 검색망을 가동하여 가장 정합성이 높은 쿠팡, 네이버, 아마존/알리의 상품 후보 링크 3개를 추출하고, Playwright Stealth 브라우저로 봇 차단을 정밀 우회 접속하여 시세를 스캔합니다. 특히 사용자가 설정한 '규격/용량/수량'과 일치 여부를 Gemini AI가 2차 교차 매칭(Cross-Matching)하여 규격 오류 가격을 원천 차단하며, '감시 로봇 일괄 기동' 클릭 단 한번으로 DB에 즉각 등록 및 첫 수집 백필까지 완벽하게 완수 처리해 줍니다."
  },
  {
    id: "price-6",
    category: "price",
    question: "AI 자율 마이닝 시 탐색할 쇼핑몰이나 도메인을 직접 추가하거나 제어할 수 있나요?",
    answer: "네, 완벽하게 가능합니다! AI 자율 검색 입력창 바로 위에 마운트된 [탐색 대상 채널 제어] 제어판을 활용하면 됩니다. 기본 제공되는 4대 쇼핑몰(쿠팡, 네이버, 아마존, 알리)을 배지 칩 클릭만으로 On/Off 토글하여 제어할 수 있으며, 하단의 '채널 추가' 필드에 '지마켓', '11번가', '다나와' 등 관리자님이 탐색하고 싶은 특정 포털 도메인을 즉석에서 추가 및 삭제하여 맞춤형으로 관리하실 수 있습니다. 추가된 커스텀 채널은 AI RAG 엔진에 동기화되어 맞춤형 크롤링 경로와 표준 Selector를 지능적으로 생성해 시세 수집 로봇으로 동시 배포하게 됩니다."
  },
  {
    id: "sms-8",
    category: "sms",
    question: "접수된 고객 피드백들을 한 번에 여러 채널(슬랙, 디스코드, 이메일)로 공유하거나 발송할 수 있나요?",
    answer: "네! [피드백 관리] 메뉴에서 피드백 목록 좌측의 체크박스를 통해 여러 건을 다중 선택한 뒤, 하단에 나타나는 '실시간 피드백 옴니채널 발송 툴바'를 활용하시면 됩니다. '슬랙(Slack) 전송' 및 '디스코드(Discord) 전송' 체크박스를 켜고 발송 버튼을 누르면 연동된 웹훅(Webhook) 채널로 정갈한 카드 형태로 즉시 동시 배포됩니다. 또한 'AI 비즈니스 이메일 작성' 버튼을 클릭하면 Gemini 3.5 AI 비서가 선택된 피드백들의 골자를 분석하여 아주 격식 있고 품격 있는 문의 메일 제목과 본문을 초안으로 작성해 주며, 이를 검토 및 수정한 후 원터치로 지정 수신처(CHACHOGREAT@GMAIL.COM)로 즉각 안전하게 이메일을 전송하거나 시뮬레이션할 수 있습니다."
  },
  {
    id: "rpa-6",
    category: "rpa",
    question: "이지봇(EasyBot)을 이용해 명함 사진에서 연락처를 자동 추출하고 이직 여부까지 감지하는 파이프라인은 어떻게 동작하나요?",
    answer: "이지봇 대화창 입력란 좌측에 추가된 카메라/업로드 아이콘을 통해 명함 사진을 즉석에서 찍거나 업로드할 수 있습니다. 이미지가 전송되면 Gemini Vision AI가 명함 이미지 내의 텍스트(이름, 연락처, 회사, 부서, 직급 등)를 고도로 정밀하게 스캔해 구조화된 JSON 데이터로 파싱합니다. 파싱 완료 후 기존 연락처 DB를 대조하여 지능형 알고리즘이 2가지 처리를 수행합니다: (1) 정보 변경(update_info): 이름과 연락처는 같지만 부서나 직급, 유선전화번호 등이 바뀐 경우 기존 정보를 새 정보로 업데이트합니다. (2) 이직 감지(career_transition): 동일인이 다른 회사로 이직한 경우, 과거 거래 이력 데이터의 무결성을 깨뜨리지 않고 보존하기 위해 기존 거래처 소속 레코드는 '퇴사(is_active=0)' 처리하고, 새 회사 소속의 연락처를 신규 인서트(Insert)하여 과거 이력 유실 없이 완벽하게 이직 이력을 연동·보존합니다."
  },
  {
    id: "point-8",
    category: "point",
    question: "MY DB 관리 센터에서 관리할 테이블이 너무 많은데, 원하는 테이블을 빠르게 찾거나 검색할 수 있는 기능이 있나요?",
    answer: "네, 최고관리자 전용 'MY DB' 패널 좌측의 물리 테이블 리스트 영역에 실시간 '테이블명 및 한글 표시명 통합 검색바'를 구현해 두었습니다. 검색창에 영어 테이블명(예: contacts)이나 한글 별칭(예: 명함첩)을 입력하는 즉시 리스트가 반응형으로 필터링되어 빠르게 원하는 테이블을 포커싱할 수 있습니다. 또한, 기존에 영문으로만 표기되던 신규 시스템 및 비즈니스 테이블(crm_partner_contacts -> 거래처 담당자 명함첩, crm_instagram_posts -> 인스타그램 포스트 관리 등) 전체에 대해 꼼꼼하게 한글 표시명(displayName) 매핑을 적용하여 visual의 일관성과 사용성을 획득했습니다. 검색창 우측의 'X' 단추를 누르면 언제든지 검색 필터를 즉시 초기화할 수 있습니다."
  }
];

export default function FAQHelpCenterPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["sms-1"])); // 첫 질문 기본 오픈

  // 아코디언 토글
  const toggleAccordion = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 실시간 검색어 및 초성 보정 검색 엔진 필터링
  const getFilteredFAQ = () => {
    return FAQ_DATABASE.filter(faq => {
      if (activeCategory !== "all" && faq.category !== activeCategory) {
        return false;
      }
      
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase().trim();
      const question = faq.question.toLowerCase();
      const answer = faq.answer.toLowerCase();

      const matchesConsonants = (str: string, q: string) => {
        if (q === "ㅇㅌㅍ" && str.includes("otp")) return true;
        if (q === "ㅁㅈ" && (str.includes("문자") || str.includes("메시지"))) return true;
        if (q === "ㅂㄹㄱ" && str.includes("블로그")) return true;
        if (q === "ㅈㄹ" && str.includes("적립")) return true;
        if (q === "ㅋㅍ" && str.includes("쿠폰")) return true;
        return false;
      };

      return (
        question.includes(query) || 
        answer.includes(query) || 
        matchesConsonants(question, query) ||
        matchesConsonants(answer, query)
      );
    });
  };

  const triggerEasyBot = () => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("open-easybot");
      window.dispatchEvent(event);
    }
  };

  const filteredFaqs = getFilteredFAQ();

  return (
    // 💡 레이아웃 붕괴 원천 봉쇄: 복잡한 Flex/Grid를 걷어내고, 무조건 가로폭 100%를 보장하는 심플 견고한 수직 탑다운 구조 선언!
    <div className="w-full min-h-screen bg-slate-50 p-6 md:p-8 space-y-8 animate-fade-in block relative overflow-x-hidden">
      
      {/* 럭셔리 네온 광원 데코레이션 */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>

      {/* 1. 헤더 가이드 패널 (수직 정렬 탑다운 구조) */}
      <div className="w-full bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm block">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <HelpCircle className="w-6 h-6 shrink-0" />
            </div>
            <span className="text-[10px] md:text-[11px] font-black tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full uppercase">Help Center</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight block">
            Q&A 헬프센터
          </h1>
          
          <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-3xl block">
            이지데스크의 AI 자율 마케터(Autonomous Copilot), 무료 문자 발송, 단골 포인트 적립 등 핵심 20대 기능의 명쾌한 사용 요령을 한눈에 알아보세요.
          </p>
        </div>
      </div>

      {/* 2. 가로형 검색 및 필터 패널 (수평 칩 배치로 가로 찌그러짐을 물리적으로 원천 봉쇄!) */}
      <div className="w-full bg-white border border-slate-100 p-6 rounded-3xl shadow-sm block space-y-6">
        
        {/* 실시간 통합 검색창 */}
        <div className="w-full space-y-2 block">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">실시간 통합 지식 검색</label>
          <div className="relative w-full shadow-sm rounded-2xl overflow-hidden border border-slate-200 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all block">
            <Search className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="궁금하신 기능이나 키워드를 검색창에 적어보세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-white border-0 outline-none text-sm md:text-base text-slate-700 font-semibold"
            />
          </div>
        </div>

        {/* 수평 칩 구조의 카테고리 필터 (좌우 찌그러질 가능성 0%) */}
        <div className="w-full space-y-3 block">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">주제별 카테고리 필터</span>
          <div className="flex flex-wrap gap-2.5 w-full">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-xs md:text-sm font-extrabold transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.02] border-slate-900" 
                      : "bg-white text-slate-600 hover:bg-slate-50 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? "text-amber-400" : cat.color}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. 대용량 FAQ 아코디언 카드 리스트 (풀 와이드 수직 나열) */}
      <div className="w-full space-y-4 block">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs md:text-sm font-bold text-slate-400">
            총 <b>{filteredFaqs.length}개</b>의 가이드 매뉴얼 검색됨
          </span>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center py-24 shadow-sm w-full block">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
            <h3 className="text-base font-black text-slate-800 mb-1">일치하는 가이드를 찾을 수 없습니다.</h3>
            <p className="text-xs text-slate-400">검색어를 지우거나 카테고리를 다시 클릭해 주세요.</p>
          </div>
        ) : (
          <div className="space-y-4 w-full block">
            {filteredFaqs.map(faq => {
              const isOpen = openIds.has(faq.id);
              
              return (
                <div 
                  key={faq.id} 
                  className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm w-full block ${
                    isOpen ? "border-amber-400/80 ring-2 ring-amber-400/5" : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                  }`}
                >
                  {/* 질문 영역 */}
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full flex items-center justify-between p-5 text-left font-black text-slate-800 text-sm md:text-base gap-4 transition-colors cursor-pointer select-none bg-slate-50/10 hover:bg-slate-50/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform ${isOpen ? "bg-amber-400 scale-125 shadow-lg shadow-amber-400/40" : "bg-slate-300"}`}></span>
                      <span>{faq.question}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-amber-500" : ""}`} />
                  </button>

                  {/* 답변 오픈 영역 */}
                  {isOpen && (
                    <div className="p-5 border-t border-slate-50 bg-slate-50/20 text-xs md:text-sm text-slate-600 leading-relaxed font-medium animate-scale-up block">
                      <div className="bg-white p-5 rounded-2xl border border-slate-100/50 text-slate-700 shadow-inner leading-relaxed block">
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. 이지봇 AI 헬프 배너 브릿지 (완벽한 수직 Stacked 구조로 찌그러짐 원천 봉쇄!) */}
      <div className="bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-indigo-500/5 border border-slate-100 p-6 md:p-8 rounded-3xl mt-8 shadow-sm w-full block">
        <div className="space-y-6 block">
          
          {/* 상단 텍스트 존 */}
          <div className="flex items-start space-x-4 w-full block">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-900 shadow-xl shadow-orange-500/10 shrink-0 animate-bounce">
              <Bot className="w-7 h-7 text-slate-900" />
            </div>
            
            <div className="space-y-1 block">
              <h4 className="text-sm md:text-base font-black text-slate-800 flex items-center gap-2">
                원하는 답변을 찾기 어려우신가요?
                <span className="bg-amber-400 text-slate-900 font-extrabold text-[9px] px-2 py-0.5 rounded flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5"/>AI</span>
              </h4>
              <p className="text-xs md:text-sm text-slate-500 font-semibold leading-relaxed">
                이지봇 인공지능 매장 비서에게 음성이나 채팅으로 직접 대화하여 필요한 기능 질문에 대한 정답을 즉석에서 추천받아보세요!
              </p>
            </div>
          </div>

          {/* 하단 버튼 존 (Full-width 버튼 형태로 절대 찌그러지지 않음) */}
          <div className="w-full block">
            <button
              onClick={triggerEasyBot}
              className="w-full py-4 bg-slate-950 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs md:text-sm transition-all border-0 shadow-lg shadow-slate-950/10 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Bot className="w-4 h-4 text-amber-400 animate-pulse" />
              이지봇 AI 비서 호출하기
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
