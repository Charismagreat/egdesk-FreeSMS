export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { updateRows, insertRows, queryTable } from '../../../../../../egdesk-helpers';

/**
 * 최고관리자(SUPER_ADMIN) 권한 검증 공통 헬퍼
 */
async function verifySuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    throw new Error('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
  }

  const payload = decodeJwt(token);
  if (payload.role !== 'SUPER_ADMIN') {
    throw new Error('명함 등록 확정 권한이 없습니다. 최고관리자 계정으로 로그인해주세요.');
  }
}

/**
 * 현재 타임스탬프 반환 (YYYY-MM-DD HH:MM:SS)
 */
function getNowTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export async function POST(req: Request) {
  try {
    // 1. 최고관리자 세션 검증
    await verifySuperAdmin();

    const { 
      actionType, 
      name, 
      position, 
      phone, 
      email, 
      partnerId, 
      partnerName, 
      existingContactId, 
      cardImageUrl 
    } = await req.json();

    if (!name) {
      return NextResponse.json({
        success: false,
        error: '등록할 담당자 성명(name) 정보가 누락되었습니다.'
      }, { status: 400 });
    }

    const nowStr = getNowTimestamp();
    let finalPartnerId = partnerId;

    // 2. 만약 매치된 거래처(partnerId)가 없고 거래처 이름(partnerName)만 존재한다면 거래처 임시 신규 생성
    if (!finalPartnerId && partnerName) {
      const generatedId = `P_${Date.now()}`;
      try {
        await insertRows('crm_partners', [
          {
            id: generatedId,
            name: partnerName,
            created_at: nowStr
          }
        ]);
        finalPartnerId = generatedId;
      } catch (partnerInsertErr: any) {
        console.warn('임시 거래처 생성 실패, 기본 그룹으로 우회합니다:', partnerInsertErr.message);
        finalPartnerId = '개인_기타';
      }
    } else if (!finalPartnerId) {
      finalPartnerId = '개인_기타'; // 완전 무소속 처리
    }

    // 3. 판정된 상황별 DB 조치 분기 처리
    if (actionType === 'update_info') {
      if (!existingContactId) {
        return NextResponse.json({
          success: false,
          error: '정보를 업데이트할 기존 담당자 고유식별자(existingContactId)가 제공되지 않았습니다.'
        }, { status: 400 });
      }

      // 기존 연락처의 직책, 연락처, 이메일, 명함 이미지 정보 일괄 갱신
      await updateRows('crm_partner_contacts',
        { 
          position, 
          phone, 
          email, 
          card_image_url: cardImageUrl || '',
          is_active: 1
        },
        { filters: { id: existingContactId } }
      );

      return NextResponse.json({
        success: true,
        message: `기존 등록된 '${name}' 담당자의 연락망 및 부서/직책 최신 정보 갱신을 성공적으로 완료하였습니다.`,
        action: 'updated'
      });
    }

    if (actionType === 'career_transition') {
      if (!existingContactId) {
        return NextResponse.json({
          success: false,
          error: '이직 처리를 수행할 기존 담당자 식별자(existingContactId)가 누락되었습니다.'
        }, { status: 400 });
      }

      // 1) 기존 소속회사 정보 비활성(퇴사/이직) 처리 (is_active = 0)
      await updateRows('crm_partner_contacts',
        { is_active: 0 },
        { filters: { id: existingContactId } }
      );

      // 2) 이직한 신규 회사 소속으로 신규 담당자 레코드 인서트 (Insert)
      // SQLite 데이터베이스의 crm_partner_contacts에 새로운 고유 정수 ID 획득을 위해 데이터 조회
      const contactsRes = await queryTable('crm_partner_contacts');
      const contacts = contactsRes.rows || [];
      const nextId = contacts.length > 0 ? Math.max(...contacts.map((c: any) => parseInt(c.id) || 0)) + 1 : 1;

      await insertRows('crm_partner_contacts', [
        {
          id: nextId,
          partner_id: finalPartnerId,
          name,
          position,
          phone,
          email,
          card_image_url: cardImageUrl || '',
          is_primary: 0,
          is_active: 1,
          created_at: nowStr
        }
      ]);

      return NextResponse.json({
        success: true,
        message: `'${name}' 담당자의 기존 회사 재직 정보를 '이직(비활성)' 보존 처리하고, 신규 파트너사의 대표 연락망으로 이적 등록을 정상 완료하였습니다.`,
        action: 'transitioned'
      });
    }

    // 기본 시나리오: crm_partner_contacts에 신규 담당자 추가 (actionType === 'new_contact')
    const contactsRes = await queryTable('crm_partner_contacts');
    const contacts = contactsRes.rows || [];
    const nextId = contacts.length > 0 ? Math.max(...contacts.map((c: any) => parseInt(c.id) || 0)) + 1 : 1;

    await insertRows('crm_partner_contacts', [
      {
        id: nextId,
        partner_id: finalPartnerId,
        name,
        position,
        phone,
        email,
        card_image_url: cardImageUrl || '',
        is_primary: contacts.filter((c: any) => c.partner_id === finalPartnerId).length === 0 ? 1 : 0, // 해당 회사 최초 등록자면 주 담당자 지정
        is_active: 1,
        created_at: nowStr
      }
    ]);

    return NextResponse.json({
      success: true,
      message: `신규 담당자 '${name}' 님의 명함 정보 등록을 명함첩에 최종 완료하였습니다.`,
      action: 'inserted'
    });

  } catch (error: any) {
    console.error('명함 데이터 반영 오류:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '최종 명함 정보를 데이터베이스에 반영하는 중 내부 예외가 발생했습니다.'
    }, { status: 500 });
  }
}
