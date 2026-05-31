export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { queryTable } from '../../../../../egdesk-helpers';

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
    throw new Error('사업자등록증 분석 권한이 없습니다. 최고관리자 계정으로 로그인해주세요.');
  }
}

/**
 * 사업자등록번호 포맷 정제 헬퍼 ("000-00-00000")
 */
function normalizeBusinessNumber(num: string): string {
  if (!num) return '';
  const digits = num.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return num; // 포맷이 다르면 원본 반환
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
  return phone;
}

export async function POST(req: Request) {
  try {
    // 1. 최고관리자 세션 권한 검증
    await verifySuperAdmin();

    const { file, mimeType } = await req.json();

    if (!file || !mimeType) {
      return NextResponse.json({
        success: false,
        error: '분석할 사업자등록증 파일 데이터(Base64) 및 mimeType이 누락되었습니다.'
      }, { status: 400 });
    }

    // Base64 순수 데이터 정제
    let base64Data = file;
    if (file.startsWith('data:')) {
      const parts = file.split(';base64,');
      base64Data = parts[1];
    }

    // 2. DB에서 구글 AI 설정 정보 로드
    const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    const apiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: '구글 AI API 키가 시스템에 등록되지 않았습니다. [시스템 설정 > AI 설정]에서 API 키를 먼저 등록해 주세요.'
      }, { status: 400 });
    }

    const modelRes = await queryTable('system_settings', { filters: { key: 'google_ai_model' } });
    const selectedModel = modelRes.rows && modelRes.rows.length > 0 && modelRes.rows[0].value
      ? modelRes.rows[0].value
      : 'gemini-3.5-flash';

    // 3. Gemini API 사업자등록증 구조화 분석 프롬프트 설계
    const geminiPrompt = `제공된 사업자등록증(이미지 사진 또는 PDF 문서)에서 다음 정보를 정밀하게 판독하여 추출해 주세요:
- 등록번호 (businessNumber): "000-00-00000" 형식으로 정제해서 반환
- 상호/회사명 (companyName)
- 대표자 성명 (representative)
- 사업장 주소/소재지 (address)
- 대표 연락처/전화번호 (phone): 등록증에 명시된 연락처나 팩스번호 중 전화번호를 정제해서 "010-0000-0000" 또는 "02-000-0000" 형식으로 반환, 없으면 빈칸
- 실무 담당자명 (managerName): 공동대표나 인쇄된 유의미한 이름이 있을 시 기재, 없으면 빈칸
- 개업연월일 (openingDate): "YYYY-MM-DD" 형식으로 정제해서 반환, 없으면 빈칸
- 업태 (businessType)
- 종목 (businessItem)

반드시 아래 JSON 스키마 규격을 충실히 준수하여 순수 JSON 문자열로만 응답해 주세요. 다른 마크다운 백틱(\`\`\`) 기호나 텍스트, 설명은 절대 포함하지 마세요.

응답 JSON 규격 예시:
{
  "businessNumber": "123-45-67890",
  "companyName": "주식회사 이지텍",
  "representative": "홍길동",
  "address": "서울특별시 영등포구 양평로 123",
  "phone": "02-1234-5678",
  "managerName": "",
  "openingDate": "2020-05-15",
  "businessType": "제조업",
  "businessItem": "소프트웨어 개발 및 서비스"
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
      throw new Error(`Gemini OCR API 통신 실패: HTTP ${response.status}`);
    }

    const aiData = await response.json();
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini AI로부터 분석 응답을 수신하지 못했습니다.');
    }

    // AI 결과 JSON 파싱
    let parsedData;
    try {
      parsedData = JSON.parse(rawText.trim());
    } catch (err) {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0].trim());
      } else {
        throw new Error('AI 분석 결과의 JSON 포맷이 올바르지 않습니다.');
      }
    }

    // 4. 데이터 정형화/정밀화 처리
    const cleanedNumber = normalizeBusinessNumber(parsedData.businessNumber || '');
    const cleanedPhone = normalizePhone(parsedData.phone || '');

    const ocrInfo = {
      businessNumber: cleanedNumber,
      companyName: parsedData.companyName ? parsedData.companyName.trim() : '',
      representative: parsedData.representative ? parsedData.representative.trim() : '',
      address: parsedData.address ? parsedData.address.trim() : '',
      phone: cleanedPhone,
      managerName: parsedData.managerName ? parsedData.managerName.trim() : '',
      openingDate: parsedData.openingDate || '',
      businessType: parsedData.businessType || '',
      businessItem: parsedData.businessItem || ''
    };

    // 5. DB 중복 대조 및 변경 변동 감지 스마트 매칭 로직
    // crm_partners 테이블에서 동일 사업자번호가 존재하는지 검색
    const existingPartnersRes = await queryTable('crm_partners', {
      filters: { business_number: ocrInfo.businessNumber }
    });

    const rows = existingPartnersRes.rows || [];

    if (rows.length === 0) {
      // 케이스 A: 신규 등록 대상
      return NextResponse.json({
        success: true,
        status: 'NEW_PARTNER',
        data: ocrInfo,
        message: '등록되지 않은 신규 사업자입니다. 안전하게 신규 거래처로 등록할 수 있습니다.'
      });
    }

    // 케이스 B & C: 사업자등록번호가 이미 존재함
    const existingPartner = rows[0];

    // 주요 3대 핵심 정보 변동 여부 판단
    const dbCompanyName = (existingPartner.company_name || '').trim();
    const dbRepresentative = (existingPartner.representative || '').trim();
    const dbAddress = (existingPartner.address || '').trim();

    const isCompanyNameChanged = ocrInfo.companyName !== '' && dbCompanyName !== ocrInfo.companyName;
    const isRepresentativeChanged = ocrInfo.representative !== '' && dbRepresentative !== ocrInfo.representative;
    const isAddressChanged = ocrInfo.address !== '' && dbAddress !== ocrInfo.address;

    const isChanged = isCompanyNameChanged || isRepresentativeChanged || isAddressChanged;

    if (isChanged) {
      // 케이스 B: 대표자/주소/상호명 변동 감지 및 기존 레코드 업데이트 권장
      const diff = {
        companyName: { old: dbCompanyName, new: ocrInfo.companyName, changed: isCompanyNameChanged },
        representative: { old: dbRepresentative, new: ocrInfo.representative, changed: isRepresentativeChanged },
        address: { old: dbAddress, new: ocrInfo.address, changed: isAddressChanged }
      };

      return NextResponse.json({
        success: true,
        status: 'UPDATE_PARTNER',
        data: ocrInfo,
        existingId: existingPartner.id,
        existingType: existingPartner.type,
        diff,
        message: '기존에 이미 가입된 사업자등록번호이나 상호/대표명/주소지 정보의 변동이 감지되었습니다. 기존 이력 유실 없이 갱신 등록하는 것을 권장합니다.'
      });
    }

    // 케이스 C: 기등록 및 100% 동일함
    return NextResponse.json({
      success: true,
      status: 'ALREADY_REGISTERED',
      data: ocrInfo,
      existingId: existingPartner.id,
      existingType: existingPartner.type,
      message: '이미 완전히 동일한 정보로 등록이 완료되어 가동 중인 거래처입니다.'
    });

  } catch (error: any) {
    console.error('Partners License OCR Route Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '서버 내부 에러로 사업자등록증을 스캔하지 못했습니다.'
    }, { status: 500 });
  }
}
