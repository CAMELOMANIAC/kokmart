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
  batchSize = 28,
  concurrency = 2
): Promise<ParsedProduct[]> {
  if (!products || products.length === 0) {
    return [];
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 환경 변수에 설정되어 있지 않습니다.');
  }

  const ai = new GoogleGenAI({ apiKey });
  let model = process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it';
  if (model === 'gemma-4-26b') {
    model = 'gemma-4-26b-a4b-it';
  }
  const updatedProducts: ParsedProduct[] = [...products];

  // 1. 청크 분할 (권장 batchSize: 25~30개)
  const chunks: ParsedProduct[][] = [];
  for (let i = 0; i < products.length; i += batchSize) {
    chunks.push(products.slice(i, i + batchSize));
  }

  // 2. 단일 청크 처리 서브루틴
  async function processChunk(
    chunk: ParsedProduct[],
    chunkNum: number,
    totalChunks: number
  ): Promise<Map<string, SmartTip>> {
    const simplifiedList = chunk.map((p) => ({
      id: p.id,
      productName: p.productName,
      salePrice: p.salePrice,
      effectiveUnitPrice: p.effectiveUnitPrice,
      unitMeasure: p.unitMeasure,
      isPerishable: p.isPerishable,
      martName: p.martName || '마트',
    }));

    console.log(
      `[Smart Tips Grounding] Calling '${model}' for chunk ${chunkNum}/${totalChunks} (${chunk.length} products)...`
    );

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

      const chunkTipMap = new Map<string, SmartTip>();
      for (let idx = 0; idx < parsedTips.length; idx++) {
        const item = parsedTips[idx];
        const targetProduct = chunk[idx];
        if (item && item.smartTip?.tipType) {
          if (item.id) {
            chunkTipMap.set(item.id, item.smartTip);
          }
          if (targetProduct && targetProduct.id && !chunkTipMap.has(targetProduct.id)) {
            chunkTipMap.set(targetProduct.id, item.smartTip);
          }
        }
      }

      console.log(`[Smart Tips Grounding] Chunk ${chunkNum}/${totalChunks} finished (${chunkTipMap.size} tips).`);
      return chunkTipMap;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Smart Tips Grounding Error] Chunk ${chunkNum}/${totalChunks}:`, errorMsg);
      throw new Error(`Gemma 스마트 팁 생성 실패 (청크 ${chunkNum}/${totalChunks}): ${errorMsg}`);
    }
  }

  // 3. Concurrency 단위 병렬 처리 (기본 동시 2개 청크 실행)
  const tipMap = new Map<string, SmartTip>();
  for (let i = 0; i < chunks.length; i += concurrency) {
    const activeChunks = chunks.slice(i, i + concurrency);
    const results = await Promise.all(
      activeChunks.map((chunk, idx) => {
        const chunkNum = i + idx + 1;
        return processChunk(chunk, chunkNum, chunks.length);
      })
    );

    for (const chunkResult of results) {
      for (const [id, tip] of chunkResult.entries()) {
        tipMap.set(id, tip);
      }
    }
  }

  // 4. 상품 객체에 최종 생성된 스마트 팁 주입
  for (const prod of updatedProducts) {
    if (prod.id && tipMap.has(prod.id)) {
      prod.smartTip = tipMap.get(prod.id);
    } else {
      throw new Error(`상품 '${prod.productName}'에 대한 실시간 스마트 팁 분석 응답이 누락되었습니다.`);
    }
  }

  return updatedProducts;
}
