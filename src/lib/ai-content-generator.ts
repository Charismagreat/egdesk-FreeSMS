import { queryTable, insertRows } from '../../egdesk-helpers';

export interface BlogContent {
  title: string;
  body: string;
  tags: string[];
  imagePrompt: string; // 이미지 생성 인공지능용 팁
}

export interface InstagramContent {
  caption: string;
  hashtags: string[];
  visualDirection: string; // 사진 구도 가이드
}

export interface YoutubeShortsContent {
  sceneList: Array<{
    sceneNum: number;
    visualDescription: string; // 화면 지시
    voiceScript: string; // 성우 나레이션 대본
    duration: string; // 추천 초 (e.g. "3초")
  }>;
  audioTrack: string; // 배경 음악 무드 추천
}

export interface OmniChannelPack {
  blog: BlogContent;
  instagram: InstagramContent;
  shorts: YoutubeShortsContent;
}

/**
 * AI 기반으로 네이버 블로그, 인스타그램, 유튜브 쇼츠용 프리미엄 마케팅 콘텐츠를 자동 생성합니다.
 */
export async function generateOmniChannelContent(
  strategyTitle: string,
  description: string,
  popularProducts: string[]
): Promise<OmniChannelPack> {
  let apiKey: string | null = null;
  let isEnabled = true;
  try {
    const settingsRes = await queryTable('system_settings', { filters: { key: 'google_ai_api_key' } });
    apiKey = settingsRes.rows && settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;

    const enabledRes = await queryTable('system_settings', { filters: { key: 'omnichannel_ai_enabled' } });
    if (enabledRes.rows && enabledRes.rows.length > 0) {
      isEnabled = enabledRes.rows[0].value !== 'false';
    }
  } catch (e) {
    console.error('Failed to get settings, fallback to local content generator', e);
  }

  const menu = popularProducts[0] || '시그니처 메뉴';

  if (apiKey && isEnabled) {
    try {
      const systemPrompt = `
You are an expert copywriter, digital marketer, and content creator specializing in Naver Blog SEO, Instagram influencer feed creation, and high-retention TikTok/YouTube Shorts scripts.
Your task is to generate a comprehensive content package for three channels based on the provided strategy title, description, and primary menu item.

Strategy: ${strategyTitle}
Concept: ${description}
Primary Menu: ${menu}

Output must be in valid Korean, in strict JSON format using this EXACT structure:
{
  "blog": {
    "title": "String (SEO optimized blog title)",
    "body": "String (Long-form blog post, min 3 paragraphs with highly engaging, friendly Korean tone)",
    "tags": ["String", "String"],
    "imagePrompt": "String (English prompt for image generation)"
  },
  "instagram": {
    "caption": "String (Short, trendy Instagram caption with emojis)",
    "hashtags": ["String", "String"],
    "visualDirection": "String (Instructions on how to take the photo)"
  },
  "shorts": {
    "sceneList": [
      {
        "sceneNum": 1,
        "visualDescription": "String (Visual cues)",
        "voiceScript": "String (Spoken voiceover)",
        "duration": "String"
      }
    ],
    "audioTrack": "String (BGM style suggestion)"
  }
}
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: `Generate a premium marketing content pack for ${strategyTitle}.` }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // 🕒 토큰 소모량 측정 기록 추가
        if (data.usageMetadata) {
          try {
            const u = data.usageMetadata;
            const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
            await insertRows('ai_token_usage_logs', [{
              id: `TKC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              model: 'gemini-3.5-flash',
              purpose: 'marketing-content-pack',
              prompt_tokens: u.promptTokenCount || 0,
              completion_tokens: u.candidatesTokenCount || 0,
              total_tokens: u.totalTokenCount || 0,
              created_at: nowStr
            }]);
          } catch (logErr) {
            console.error('마케팅 AI 토큰 사용량 기록 실패:', logErr);
          }
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const resJson = JSON.parse(text);
        if (resJson.blog && resJson.instagram && resJson.shorts) {
          return resJson as OmniChannelPack;
        }
      }
    } catch (e) {
      console.error('Gemini API Error for content generation, using fallback pack:', e);
    }
  }

  // 고품격 프리미엄 콘텐츠 폴백 팩 (API 미설정 또는 오류 시에도 압도적인 결과 제공)
  return {
    blog: {
      title: `[일상/맛집] 비 오는 화요일에 어울리는 감성 아지트와 바삭한 빗소리 레시피`,
      body: `안녕하세요! 빗소리가 기분 좋게 귓가를 스치는 촉촉한 화요일이네요. ☔️

비가 오는 날이면 유난히 마음이 차분해지고, 따뜻하고 포근한 골목길 아지트가 생각나곤 합니다. 문득 창밖을 보다가, 이런 날에 완벽하게 어울리는 우리 매장만의 단골 시그니처 메뉴인 **${menu}** 이야기를 전해드리고 싶어 찾아왔어요.

저희 매장의 **${menu}**는 겉은 빗소리처럼 경쾌하게 바삭하고, 속은 놀랍도록 촉촉하고 고소한 육즙으로 꽉 차 있어 비 오는 날의 우울함을 단번에 씻어주는 시그니처 요리랍니다. 잔잔하게 흐르는 로파이(Lo-Fi) 음악과 노란 조명 아래에서, 갓 조리되어 김이 모락모락 피어오르는 플레이트를 앞에 두고 소중한 분과 도란도란 이야기를 나누다 보면, 궂은 날씨마저 아주 특별한 낭만으로 변하게 됩니다.

오늘 하루, 이 낭만적인 무드에 동참해 주시는 분들을 위해 특별한 온기가 담긴 서비스까지 마련해 두고 기다리고 있으니, 언제든 편하게 발걸음해 주셔요. 지친 하루 끝의 따스한 안식처가 되어드릴게요.`,
      tags: ['동네맛집', '감성카페', '비오는날데이트', `${menu}맛집`, '동네아지트', '단골추천'],
      imagePrompt: 'Cozy restaurant interior on a rainy day, warm soft yellow lights, a beautifully plated gourmet meal on a wooden table, steam rising from the plate, rain drops on the window in the background, cinematic photography style.'
    },
    instagram: {
      caption: `비 내리는 화요일 감성 가득 채우기 완성...☕️☔️

차분하게 떨어지는 빗소리를 들으며 즐기는 겉바속촉 ${menu}의 맛이란! 한 입 베어 무는 순간 기분이 사르르 녹아내려요.

오늘 하루, 비를 뚫고 찾아와주시는 소중한 분들만을 위해 깜짝 미니 사이드 메뉴 서비스도 대기 중이랍니다. 빗길 조심해서 감성 충전하러 오세요! 

📌 위치: 프로필 링크 클릭!
📌 혜택: 이 게시물을 보여주시면 단골 서비스 증정! ✨`,
      hashtags: ['맛스타그램', '비오는날감성', '동네카페', `${menu}`, '인스타핫플', '단골아지트', '소통'],
      visualDirection: '창가에 맺힌 빗방울을 아웃포커싱하고, 따뜻한 김이 피어오르는 메뉴를 노란 조명 아래 클로즈업하여 촬영하세요.'
    },
    shorts: {
      sceneList: [
        {
          sceneNum: 1,
          visualDescription: '클로즈업: 투명한 유리창에 토닥토닥 내리는 빗방울과 그 뒤로 따스하게 빛나는 은은한 노란색 매장 조명 비추기.',
          voiceScript: '비 내리는 화요일, 유난히 따뜻하고 아늑한 공간이 그리워지지 않나요?',
          duration: '3초'
        },
        {
          sceneNum: 2,
          visualDescription: '지글지글 요리 장면: 뜨거운 팬 위에서 바삭하게 튀겨지듯 조리되며 모락모락 김이 나는 시그니처 메뉴 클로즈업.',
          voiceScript: '빗소리보다 더 바삭하고 소리까지 맛있는, 오늘의 숨겨진 힐링 레시피.',
          duration: '4초'
        },
        {
          sceneNum: 3,
          visualDescription: '한 입 먹는 연출: 바삭하게 포크로 찌르는 순간의 ASMR 극대화 및 소스가 사르르 흘러내리는 샷.',
          voiceScript: '오직 오늘만 맛볼 수 있는 입안 가득 찬 행복, 겉바속촉 시그니처!',
          duration: '4초'
        },
        {
          sceneNum: 4,
          visualDescription: '사장님이 웃으며 빗길 조심하라는 인사 카드 또는 매장 주소 자막이 감각적으로 나타나는 화면.',
          voiceScript: '지금 프로필을 누르고 비 오는 날 단골 한정 혜택을 챙겨보세요. 따뜻하게 기다릴게요!',
          duration: '4초'
        }
      ],
      audioTrack: '차분하면서도 리드미컬한 어쿠스틱 로파이(Acoustic Lo-Fi) 재즈 비트 BGM'
    }
  };
}
