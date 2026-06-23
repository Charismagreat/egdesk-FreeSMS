export const dynamic = 'force-dynamic';
import { fetchGeminiWithFallback } from '../../../../lib/gemini-fallback';
import { NextResponse } from 'next/server';
import { queryTable, insertRows } from '../../../../../egdesk-helpers';

/**
 * POST: AI 동적 견적 제안 단가 연산 및 제안 편지글 생성
 * 바이어 명칭, 수량 등을 분석해 볼륨 디스카운트 가격을 도출하고 품격 있는 바이어 전용 레터 초안을 수립합니다.
 */
export async function POST(req: Request) {
  try {
    const { partner_name, partner_id, items = [] } = await req.json();

    if (!partner_name) {
      return NextResponse.json({ success: false, error: '고객/바이어 정보는 필수입니다.' }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ success: false, error: '견적 산정을 위한 품목이 지정되지 않았습니다.' }, { status: 400 });
    }

    // 본사 프로필 로드 (기본값 차민수/(주)쿠스/010-7216-5884)
    let myCompanyProfile = { companyName: '(주)쿠스', representative: '차민수', phone: '010-7216-5884' };
    try {
      const myCompanySetting = await queryTable('system_settings', { filters: { key: 'my_company_profile' } });
      if (myCompanySetting.rows && myCompanySetting.rows.length > 0) {
        const parsed = JSON.parse(myCompanySetting.rows[0].value);
        if (parsed.companyName) myCompanyProfile.companyName = parsed.companyName;
        if (parsed.representative) myCompanyProfile.representative = parsed.representative;
      }
    } catch (e) {
      console.error('본사 정보 설정 조회 실패:', e);
    }

    // 1. DB에서 API 키 조회
    let apiKey: string | null = null;
    try {
      const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
      apiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;
    } catch (e) {
      console.error('Failed to get api key, using high-fidelity dynamic pricing fallback');
    }

    // 2. B2B 거래처 등급 실시간 DB 마이닝 (SCM 등급 연동 ⭐️)
    let isVip = false;
    if (partner_id) {
      try {
        const ptRes = await queryTable('crm_partners', { filters: { id: partner_id } });
        if (ptRes.rows && ptRes.rows.length > 0) {
          isVip = ptRes.rows[0].vip_level === 'VIP';
        }
      } catch (e) {
        console.error('B2B 거래처 등급 조회 실패 폴백 가동:', e);
      }
    }
    // 수동 VIP 키워드 매칭 폴백 유지
    if (!isVip && partner_name) {
      isVip = partner_name.includes('VIP') || partner_name.includes('유재석') || partner_name.includes('이순신');
    }
    const calculatedItems = items.map((item: any) => {
      const qty = parseInt(item.quantity) || 0;
      const basePrice = parseFloat(item.unit_price) || 10000;
      
      let discountRate = 0;
      if (qty >= 100) discountRate = 0.15;
      else if (qty >= 50) discountRate = 0.10;
      else if (qty >= 10) discountRate = 0.05;

      if (isVip) discountRate += 0.05; // VIP 추가 우대

      const finalUnitPrice = Math.round(basePrice * (1 - discountRate));
      const finalAmount = finalUnitPrice * qty;

      return {
        product_id: item.product_id || '',
        item_code: item.item_code || '',
        product_name: item.product_name,
        spec: item.spec || '',
        quantity: qty,
        unit_price: finalUnitPrice,
        amount: finalAmount,
        discount_applied: discountRate > 0 ? `${Math.round(discountRate * 100)}%` : '없음'
      };
    });

    const totalProposedAmount = calculatedItems.reduce((acc: number, item: any) => acc + item.amount, 0);

    // API 키 존재 시 Gemini를 이용해 고품격 맞춤형 비즈니스 편지 작성
    if (apiKey) {
      try {
        const systemInstruction = `
You are an elite, world-class business growth expert and professional copywriter specializing in luxury business correspondence and sales pitches.
Your goal is to write a highly polite, respectful, and compelling business letter (proposal cover letter) in Korean.
The letter is from the user's company "${myCompanyProfile.companyName}" (represented by representative director "${myCompanyProfile.representative}", phone: "${myCompanyProfile.phone}") to the buyer/partner (${partner_name}).
The letter should thank them for the request, mention the premium value of the items, explain that we applied a special custom discount due to their requested volume or loyalty, and welcome further discussion.
The letter must strictly end with a formal closing signature line:
"- ${myCompanyProfile.companyName} 대표 ${myCompanyProfile.representative} 올림 (대표전화: ${myCompanyProfile.phone}) -"

Format example:
귀하의 성원에 감사드리며, 이번 특별 견적을 제안합니다...

Keep the tone extremely professional, friendly, and convincing.
Do NOT output anything else. Just the plain text of the letter.
`;

        const prompt = `
Buyer: ${partner_name}
Proposed Items: ${calculatedItems.map((c: any) => `${c.product_name} (${c.quantity}개, 단가 ${c.unit_price}원)`).join(', ')}
Total Proposed Amount: ${totalProposedAmount.toLocaleString()}원
`;

        const response = await fetchGeminiWithFallback(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const letterText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // AI 토큰 사용량 로깅
          try {
            const prompt_tokens = data.usageMetadata?.promptTokenCount || 0;
            const completion_tokens = data.usageMetadata?.candidatesTokenCount || 0;
            const total_tokens = data.usageMetadata?.totalTokenCount || (prompt_tokens + completion_tokens);
            const logId = `TKC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const logTime = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
            await insertRows('ai_token_usage_logs', [{
              id: logId,
              model: 'gemini-3.5-flash',
              purpose: 'ESTIMATE_PRICING',
              prompt_tokens,
              completion_tokens,
              total_tokens,
              created_at: logTime
            }]);
          } catch (e: any) {
            console.error('AI 토큰 로깅 실패:', e.message);
          }

          if (letterText.trim()) {
            return NextResponse.json({
              success: true,
              calculatedItems,
              totalProposedAmount,
              aiLetter: letterText.trim(),
              isVip
            });
          }
        }
      } catch (geminiErr) {
        console.error('Gemini Letter Generator API fail, using fallback:', geminiErr);
      }
    }

    // 정교한 비즈니스 웰컴 제안 레터 폴백
    const fallbackLetter = `안녕하십니까, ${partner_name} 귀하.
이지데스크를 신뢰해 주시고 당사의 프리미엄 제품군에 대한 견적을 의뢰해 주셔서 진심으로 머리 숙여 감사드립니다.

이번에 요청해 주신 소중한 견적 품목들을 바탕으로, 당사의 우수한 제품 품질과 사장님의 비즈니스 성장을 돕기 위한 **볼륨 최적화 맞춤 특별 단가**를 연산하여 제안을 올립니다.
${isVip ? `특히, 당사와의 돈독한 파트너십을 기억하며 우수 거래처 맞춤형 추가 특별 로열티 혜택(5% 특별 추가 우대)을 단가에 전격 반영해 드렸습니다.\n` : ''}
제안드린 품목들은 엄격한 품질 관리를 거쳐 최상의 상태로 안전하게 출고 및 인도할 것을 약속드립니다. 본 견적 제안에 대해 추가적인 조율이나 상세 일정 협의가 필요하신 경우 언제든 주저하지 마시고 편하게 연락해 주십시오. 

항상 바이어님의 비즈니스에 행운과 큰 번창이 깃들기를 진심으로 기원합니다. 감사합니다.

- ${myCompanyProfile.companyName} 대표 ${myCompanyProfile.representative} 올림 (대표전화: ${myCompanyProfile.phone}) -`;

    return NextResponse.json({
      success: true,
      calculatedItems,
      totalProposedAmount,
      aiLetter: fallbackLetter,
      isVip
    });

  } catch (error: any) {
    console.error('API estimates pricing error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
