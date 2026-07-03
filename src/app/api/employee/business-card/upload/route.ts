export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { callAI } from '@/lib/ai-router';
import { queryTable, insertRows } from '@/../egdesk-helpers';

export async function POST(req: Request) {
  try {
    const { image, partnerId, partnerName } = await req.json();

    if (!image) {
      return NextResponse.json({ success: false, error: '분석할 명함 이미지 데이터(Base64)가 누락되었습니다.' }, { status: 400 });
    }

    // 1. Base64 이미지 분리 및 파일 시스템 저장
    let mimeType = 'image/png';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const parts = image.split(';base64,');
      const meta = parts[0];
      base64Data = parts[1];
      mimeType = meta.split(':')[1];
    }

    const extension = mimeType.split('/')[1] || 'png';
    const filename = `card_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${extension}`;
    
    // public/uploads/cards/ 폴더 생성 보장
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'cards');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    const cardImageUrl = `/uploads/cards/${filename}`;

    // 2. 공통 AI 멀티모달 라우터 가동 (Gemini 활용 OCR 스캔)
    const systemPrompt = `
너는 비즈니스 명함 판독 및 정보 구조화 전문 AI 비서야.
제공된 명함 이미지와 텍스트 컨텍스트를 분석하여, 명함에 나타난 인적 정보를 구조화된 JSON 데이터로 추출해야 해.

반드시 다음 JSON 포맷 구조로만 응답해야 하며, 그 외의 다른 잡담이나 마크다운 백틱(\`\`\`) 등은 절대 반환하지 마.
{
  "name": "성명 (문자열, 필수)",
  "position": "부서 및 직책 (문자열, 예: '영업부 대리')",
  "phone": "휴대전화번호 (문자열, 대시 포함 정규화 예: 010-1234-5678)",
  "email": "이메일 주소 (문자열)",
  "company": "회사명 (문자열, 예: '(주)이지글로벌')"
}
`;

    const prompt = '이 명함 이미지에서 성명, 직책, 휴대전화번호, 이메일 주소, 회사명을 엄격히 판독하여 JSON으로 출력해줘.';
    
    const aiResult = await callAI({
      prompt,
      systemPrompt,
      purpose: 'EASYBOT_OCR_SCAN',
      responseMimeType: 'application/json',
      imageInput: image // Base64 이미지 데이터 실어 보냄
    });

    if (!aiResult.success || !aiResult.text) {
      throw new Error('AI OCR 명함 이미지 분석에 실패했습니다.');
    }

    let parsedData: any = {};
    try {
      parsedData = JSON.parse(aiResult.text.trim());
    } catch (parseErr) {
      // JSON 파싱 실패 대비 안전 추출 처리
      const raw = aiResult.text;
      const nameMatch = raw.match(/"name"\s*:\s*"([^"]+)"/);
      const phoneMatch = raw.match(/"phone"\s*:\s*"([^"]+)"/);
      const emailMatch = raw.match(/"email"\s*:\s*"([^"]+)"/);
      const compMatch = raw.match(/"company"\s*:\s*"([^"]+)"/);
      const posMatch = raw.match(/"position"\s*:\s*"([^"]+)"/);
      
      parsedData = {
        name: nameMatch ? nameMatch[1] : '미확인',
        phone: phoneMatch ? phoneMatch[1] : '',
        email: emailMatch ? emailMatch[1] : '',
        company: compMatch ? compMatch[1] : partnerName || '',
        position: posMatch ? posMatch[1] : ''
      };
    }

    // 3. 거래처(crm_partners) 및 명함첩(crm_partner_contacts) 대장 기록 처리
    const finalCompanyName = parsedData.company || partnerName || '개인_기타';
    let finalPartnerId = partnerId;

    if (!finalPartnerId && finalCompanyName) {
      // 회사명으로 기존 거래처가 존재하는지 조회
      try {
        const partnersRes = await queryTable('crm_partners', { filters: { company_name: finalCompanyName } });
        if (partnersRes.rows && partnersRes.rows.length > 0) {
          finalPartnerId = partnersRes.rows[0].id;
        } else {
          // 존재하지 않을 경우 임시 거래처 신규 등록 (자율 대행 정책)
          const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
          
          // id 컬럼은 SQLite Auto-increment를 위해 비우고 insertRows를 호출합니다.
          await insertRows('crm_partners', [{
            type: 'BUYER', // 기본형 바이어 지정
            company_name: finalCompanyName,
            created_at: nowStr
          }]);

          // 생성된 거래처의 실제 정수 id 획득
          const createdPartnerRes = await queryTable('crm_partners', { filters: { company_name: finalCompanyName } });
          const createdPartner = createdPartnerRes.rows?.[0];
          if (createdPartner) {
            finalPartnerId = String(createdPartner.id);
          } else {
            finalPartnerId = '개인_기타';
          }
          console.log(`[임시 거래처 자동등록 완료] ID: ${finalPartnerId}, 회사명: ${finalCompanyName}`);
        }
      } catch (err: any) {
        console.warn('임시 거래처 생성 중 오류 발생:', err.message);
        finalPartnerId = '개인_기타';
      }
    }

    if (!finalPartnerId) {
      finalPartnerId = '개인_기타';
    }

    // 명함첩에 신규 담당자 데이터 등록
    const contactsRes = await queryTable('crm_partner_contacts', {});
    const contacts = contactsRes.rows || [];
    const nextId = contacts.length > 0 ? Math.max(...contacts.map((c: any) => parseInt(c.id) || 0)) + 1 : 1;
    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

    await insertRows('crm_partner_contacts', [{
      id: nextId,
      partner_id: finalPartnerId,
      name: parsedData.name || '미상',
      position: parsedData.position || '',
      phone: parsedData.phone || '',
      email: parsedData.email || '',
      card_image_url: cardImageUrl,
      is_primary: contacts.filter((c: any) => c.partner_id === finalPartnerId).length === 0 ? 1 : 0,
      is_active: 1,
      created_at: nowStr
    }]);

    return NextResponse.json({
      success: true,
      cardImageUrl,
      parsed: {
        id: nextId,
        partnerId: finalPartnerId,
        name: parsedData.name,
        position: parsedData.position,
        phone: parsedData.phone,
        email: parsedData.email,
        company: finalCompanyName
      }
    });

  } catch (err: any) {
    console.error('명함 OCR 업로드 API 에러:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
