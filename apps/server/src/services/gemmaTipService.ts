import { GoogleGenAI } from '@google/genai';
import { ParsedProduct, SmartTip, TipType } from '@kokmart/shared';

interface TipResponseItem {
  id: string;
  smartTip: {
    tipType: TipType;
    badgeText: string;
    tipMessage: string;
    coupangKeyword: string | null;
  };
}

/**
 * 마크다운 코드 블록 제거
 */
function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\r?\n/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\r?\n```$/, '');
  }
  return cleaned.trim();
}

/**
 * 기본 스마트 팁 Fallback 생성 함수
 */
export function generateDefaultTip(product: ParsedProduct): SmartTip {
  if (product.isPerishable) {
    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '마트 현장 추천',
      tipMessage: '오늘 저녁 소량 신선 구매는 오프라인 마트가 최적이에요.',
      coupangKeyword: null,
    };
  }

  return {
    tipType: 'COUPANG_BULK',
    badgeText: '대용량 알뜰 팁',
    tipMessage: '오래 쓰는 공산품/생필품은 쿠팡 대용량과 단가를 비교해 보세요.',
    coupangKeyword: `${product.productName} 대용량`,
  };
}

/**
 * Gemma 4 26B API + Google Search Grounding을 활용한 실시간 가격 비교 및 스마트 팁 생성
 *
 * 1) 구글 검색 그라운딩으로 온라인/쿠팡 실시간 단가 교차 검증
 * 2) 신선식품/공산품 불문, 마트 전단가가 비싸면 COUPANG_TIP 추천
 * 3) 진짜 저렴하면 MART_BEST, 대용량 메리트가 크면 COUPANG_BULK 추천
 */
export async function generateSmartTipsWithGemma(
  products: ParsedProduct[],
  batchSize = 15
): Promise<ParsedProduct[]> {
  if (!products || products.length === 0) {
    return [];
  }

  const apiKey = process.env.GEMINI_API_KEY || '';

  // API 키가 없거나 테스트 환경인 경우 기본 룰 팁 적용
  if (!apiKey) {
    return products.map((p) => ({
      ...p,
      smartTip: p.smartTip || generateDefaultTip(p),
    }));
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMMA_MODEL || 'gemma-4-26b';
  const updatedProducts: ParsedProduct[] = [...products];

  // 배치 단위 분할 처리 (Rate Limit 및 컨텍스트 길이 최적화)
  for (let i = 0; i < products.length; i += batchSize) {
    const chunk = products.slice(i, i + batchSize);
    const simplifiedList = chunk.map((p) => ({
      id: p.id,
      productName: p.productName,
      salePrice: p.salePrice,
      effectiveUnitPrice: p.effectiveUnitPrice,
      unitMeasure: p.unitMeasure,
      isPerishable: p.isPerishable,
      martName: p.martName || '마트',
    }));

    const prompt = `
당신은 대한민국 대형마트와 쿠팡/온라인 쇼핑몰 가격을 실시간으로 비교하여 소비자에게 최적의 구매처를 알려주는 스마트 장보기 전문 AI입니다.
구글 검색(Google Search)을 활용하여 제공된 각 상품의 실시간 온라인 최저가 및 쿠팡(로켓배송/로켓프레시) 판매가와 100g/개당 단가를 검색·대조하십시오.

[평가 대상 상품 목록]
${JSON.stringify(simplifiedList, null, 2)}

[스마트 팁(smartTip) 4대 분류 규칙]
1. MART_BEST: 마트 전단가가 실시간 온라인/쿠팡 최저가보다 확실히 저렴한 파격 특가인 경우.
   - badgeText: "마트 필구 특가"
   - tipMessage: 온라인/쿠팡 대비 구체적 절약액 또는 단가 우위 설명 (예: "온라인 대비 100g당 300원 저렴해요.")
   - coupangKeyword: null

2. MART_RECOMMEND: 당일 소비 소량 구매가 유리하거나 마트 가격이 충분히 합리적인 신선식품.
   - badgeText: "마트 현장 추천"
   - tipMessage: 오늘 저녁 소량 조리 즉시성 및 신선도 이점 안내
   - coupangKeyword: null

3. COUPANG_TIP: 신선식품 또는 소량 상품이라도 마트 행사가격이 온라인/쿠팡(로켓프레시 등)보다 비싸거나 가격 메리트가 없는 경우.
   - badgeText: "쿠팡 신선 알뜰"
   - tipMessage: 마트 특가보다 쿠팡 로켓프레시가 더 저렴하다는 구체적 비교 (예: "쿠팡 로켓프레시가 100g당 15% 더 저렴해요.")
   - coupangKeyword: 상품명

4. COUPANG_BULK: 보관이 용이한 공산품/생필품 중 쿠팡 대용량 단가가 압도적으로 저렴하거나 오프라인 운반 부담이 큰 경우.
   - badgeText: "대용량 알뜰 팁"
   - tipMessage: 오래 쓰는 생필품의 쿠팡 대용량 단가 우위 설명
   - coupangKeyword: "상품명 대용량"

반드시 아래 JSON 배열 형식으로만 응답하십시오. 마크다운 코드블록이나 다른 텍스트는 포함하지 마십시오.
[
  {
    "id": "상품id",
    "smartTip": {
      "tipType": "MART_BEST" | "MART_RECOMMEND" | "COUPANG_TIP" | "COUPANG_BULK",
      "badgeText": "뱃지 문구",
      "tipMessage": "팁 상세 메시지",
      "coupangKeyword": "쿠팡검색어 또는 null"
    }
  }
]
`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ text: prompt }],
        config: {
          tools: [{ googleSearch: {} }],
          maxOutputTokens: 8192,
          temperature: 0.2,
        },
      });

      const rawText = stripMarkdownFences(response.text || '[]');
      const parsedTips = JSON.parse(rawText) as TipResponseItem[];

      const tipMap = new Map<string, SmartTip>();
      for (const item of parsedTips) {
        if (item.id && item.smartTip?.tipType) {
          tipMap.set(item.id, item.smartTip);
        }
      }

      for (let j = i; j < i + chunk.length; j++) {
        const prod = updatedProducts[j];
        if (prod && prod.id && tipMap.has(prod.id)) {
          prod.smartTip = tipMap.get(prod.id);
        } else if (prod && !prod.smartTip) {
          prod.smartTip = generateDefaultTip(prod);
        }
      }
    } catch {
      // 오류 발생 시 해당 청크는 기본 룰 기반 팁으로 안전하게 폴백
      for (let j = i; j < i + chunk.length; j++) {
        const prod = updatedProducts[j];
        if (prod && !prod.smartTip) {
          prod.smartTip = generateDefaultTip(prod);
        }
      }
    }
  }

  return updatedProducts;
}
