export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { queryTable } from '../../../../../../egdesk-helpers';

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
    throw new Error('명함 분석 권한이 없습니다. 최고관리자 계정으로 로그인해주세요.');
  }
}

/**
 * 전화번호 포맷 정규화 헬퍼 (대시 포함)
 */
function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    if (digits.startsWith('02')) {
      return `02-${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
  } else if (digits.length === 9 && digits.startsWith('02')) {
    return `02-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return phone; // 정형화가 안 되면 원본 반환
}

export async function POST(req: Request) {
  try {
    // 1. 최고관리자 세션 검증
    await verifySuperAdmin();

    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({
        success: false,
        error: '분석할 명함 이미지 데이터(Base64)가 누락되었습니다.'
      }, { status: 400 });
    }

    // Base64 데이터에서 mimeType과 순수 데이터 분리
    let mimeType = 'image/png';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const parts = image.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      base64Data = parts[1];
    }

    // 2. DB에서 AI 설정 정보 로드
    const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    const apiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: '구글 AI API 키가 시스템에 등록되지 않았습니다. [시스템 설정 > AI 설정]에서 API 키를 먼저 입력해 주세요.'
      }, { status: 400 });
    }

    const modelRes = await queryTable('system_settings', { filters: { key: 'google_ai_model' } });
    const selectedModel = modelRes.rows && modelRes.rows.length > 0 && modelRes.rows[0].value
      ? modelRes.rows[0].value
      : 'gemini-3.5-flash';

    // 3. Gemini Vision API로 명함 파싱 요청
    const geminiPrompt = `제공된 명함 이미지에서 다음 정보들을 정확히 추출해 주세요:
- 성명 (name)
- 직급/직책 (position)
- 전화번호/휴대폰 (phone)
- 이메일 주소 (email)
- 회사명/소속기관 (companyName)

추출한 값들은 반드시 아래 JSON 스키마 규격을 준수하여 순수 JSON 문자열로만 응답해 주세요. 다른 마크다운 백틱(\`\`\`) 기호나 텍스트는 절대 포함하지 마세요.

JSON 규격 예시:
{
  "name": "홍길동",
  "position": "수석 연구원",
  "phone": "010-1234-5678",
  "email": "gildong@company.com",
  "companyName": "주식회사 이지텍"
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: geminiPrompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Vision OCR API 통신 실패: HTTP ${response.status}`);
    }

    const aiData = await response.json();
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini Vision으로부터 명함 분석 응답을 수신하지 못했습니다.');
    }

    // AI 추출 데이터 JSON 파싱
    let parsedCard;
    try {
      parsedCard = JSON.parse(rawText.trim());
    } catch (err) {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedCard = JSON.parse(jsonMatch[0].trim());
      } else {
        throw new Error('AI 명함 분석 응답 포맷이 올바르지 않습니다.');
      }
    }

    // 전화번호 정형화 보정
    if (parsedCard.phone) {
      parsedCard.phone = normalizePhone(parsedCard.phone);
    }

    const cardName = parsedCard.name || '';
    const cardCompanyName = parsedCard.companyName || '';
    const cardPhone = parsedCard.phone || '';
    const cardEmail = parsedCard.email || '';

    // 4. 기존 거래처(crm_partners) 테이블 매칭
    const partnersResult = await queryTable('crm_partners');
    const partners = partnersResult.rows || [];
    let matchedPartner = null;

    if (cardCompanyName) {
      const cleanCompany = cardCompanyName.replace(/\s/g, '').toLowerCase();
      // 완전 일치 또는 회사명이 DB 거래처 이름에 포함되는 경우 매칭
      matchedPartner = partners.find((p: any) => {
        const cleanName = (p.name || '').replace(/\s/g, '').toLowerCase();
        return cleanName.includes(cleanCompany) || cleanCompany.includes(cleanName);
      });
    }

    const partnerId = matchedPartner ? matchedPartner.id : null;
    const partnerName = matchedPartner ? matchedPartner.name : cardCompanyName;

    // 5. 기존 명함첩(crm_partner_contacts) 대조 및 이직/정보 변경 자동 인지 판정
    const contactsResult = await queryTable('crm_partner_contacts');
    const contacts = contactsResult.rows || [];
    
    let actionType: 'new_contact' | 'update_info' | 'career_transition' = 'new_contact';
    let existingContact: any = null;

    if (cardName) {
      // 1순위: 동일 이름이면서 현재 활성화(is_active=1)된 담당자 찾기
      const sameNameContacts = contacts.filter((c: any) => c.name === cardName && (c.is_active === 1 || c.is_active === undefined));
      
      if (sameNameContacts.length > 0) {
        // 이 중에서 회사 매칭 결과가 같은지 대조
        const sameCompanyContact = sameNameContacts.find((c: any) => c.partner_id === partnerId && partnerId !== null);
        
        if (sameCompanyContact) {
          // 회사도 같고 이름도 같은데 직책이나 연락처가 변동된 경우 ➡️ 정보 갱신(update_info) 판정
          if (
            sameCompanyContact.position !== parsedCard.position ||
            sameCompanyContact.phone !== cardPhone ||
            sameCompanyContact.email !== cardEmail
          ) {
            actionType = 'update_info';
            existingContact = sameCompanyContact;
          } else {
            // 모든 정보가 완전 일치하면 신규 등록 불필요하지만 업데이트로 안내 처리
            actionType = 'update_info';
            existingContact = sameCompanyContact;
          }
        } else {
          // 이름은 같은데 회사가 다른 경우 ➡️ 이직 감지(career_transition) 또는 동명이인 체크
          // 기존 담당자의 연락처/이메일이 현재 명함 정보와 하나라도 유사하면 이직으로 강력 판정
          const transitionMatch = sameNameContacts.find((c: any) => {
            const cleanOldPhone = (c.phone || '').replace(/\D/g, '');
            const cleanNewPhone = cardPhone.replace(/\D/g, '');
            return (
              (cleanOldPhone && cleanNewPhone && cleanOldPhone === cleanNewPhone) ||
              (c.email && cardEmail && c.email.toLowerCase() === cardEmail.toLowerCase())
            );
          });

          if (transitionMatch) {
            actionType = 'career_transition';
            existingContact = transitionMatch;
          } else {
            // 연락처마저 다르면 동명이인일 확률이 높으므로 신규 생성으로 취급
            actionType = 'new_contact';
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      parsedData: {
        name: cardName,
        position: parsedCard.position || '',
        phone: cardPhone,
        email: cardEmail,
        companyName: cardCompanyName
      },
      actionType,
      partnerId,
      partnerName,
      existingContact
    });

  } catch (error: any) {
    console.error('명함 OCR 판독 에러:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '명함을 판독하는 도중 내부 예외 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
