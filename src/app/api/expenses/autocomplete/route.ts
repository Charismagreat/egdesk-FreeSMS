export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable } from '@/../egdesk-helpers';

export async function GET() {
  try {
    // 1. 사내 임직원(운영자) 목록 조회 (crm_operators 테이블)
    let staff: string[] = [];
    try {
      const operatorsRes = await queryTable('crm_operators');
      if (operatorsRes.rows && operatorsRes.rows.length > 0) {
        staff = operatorsRes.rows
          .map((op: any) => String(op.name || '').trim())
          .filter(Boolean);
      }
    } catch (e) {
      console.log('crm_operators table query failed or not found, using defaults.');
    }

    // 직원 목록이 비어있거나 실패한 경우를 대비한 조직도 기본 실무 직원 프리셋 시딩
    if (staff.length === 0) {
      staff = ['김경리', '홍길동', '이철수', '박영희', '최민수', '이영민'];
    }

    // 2. B2B 거래처 명단 조회 (crm_partners 테이블)
    let partners: string[] = [];
    try {
      const partnersRes = await queryTable('crm_partners');
      if (partnersRes.rows && partnersRes.rows.length > 0) {
        partners = partnersRes.rows
          .map((p: any) => String(p.company_name || '').trim())
          .filter(Boolean);
      }
    } catch (e) {
      console.log('crm_partners table query failed or not found, using defaults.');
    }

    // B2B 거래처 기본 명단 백업 시딩
    if (partners.length === 0) {
      partners = ['효성텍스타일', '동우일렉트릭', '대신정기화물', '스타벅스강남점', '알파문구', '쿠팡비즈니스'];
    }

    // 3. 사내 조직도 공식 부서명 리스트
    const departments = [
      '경영지원팀',
      'SCM팀',
      '물류운송부',
      '기술개발부',
      '영업본부',
      '인사총무부',
      '기획디자인팀',
      '마케팅홍보팀'
    ];

    // 4. 회사 주요 수행 프로젝트명 리스트
    const projects = [
      'FreeSMS 서비스 고도화',
      'B2B 유통 플랫폼 개발',
      'SCM 자율 관제 시스템',
      '오프라인 매장 POS 연동',
      '고객 마일리지 부스터 프로젝트'
    ];

    // 중복 제거 및 가나다 정렬
    const uniqueStaff = Array.from(new Set(staff)).sort();
    const uniquePartners = Array.from(new Set(partners)).sort();

    return NextResponse.json({
      success: true,
      data: {
        partners: uniquePartners,
        staff: uniqueStaff,
        departments: departments.sort(),
        projects: projects.sort()
      }
    });
  } catch (error: any) {
    console.error('Error fetching autocomplete B2B/organization entities:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
