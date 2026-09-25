import { Groq } from 'groq-sdk';
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
 * Groq GPT-OSS-20B API + browser_search 도구를 활용한 실시간 가격 비교 및 스마트 팁 생성
 *
 * 1) Groq 내장 웹 브라우징(browser_search)으로 온라인/쿠팡 실시간 단가 교차 검증
 * 2) 신선식품/공산품 불문, 마트 전단가가 비싸면 COUPANG_TIP 추천
 * 3) 진짜 저렴하면 MART_BEST, 대용량 메리트가 크면 COUPANG_BULK 추천
 */
export async function generateSmartTips(
  products: ParsedProduct[],
  batchSize = 28,
  concurrency = 4
): Promise<ParsedProduct[]> {
  if (!products || products.length === 0) {
    return [];
  }

  const apiKey = process.env.GROQ_API_KEY || '';
  if (!apiKey) {
    console.warn('[Smart Tips Grounding] ⚠️ GROQ_API_KEY가 설정되지 않아 기본 팁(Fallback)을 적용합니다.');
    return products.map((p) => ({
      ...p,
      smartTip: p.smartTip || generateDefaultTip(p),
    }));
  }

  const groq = new Groq({ apiKey });
  const model = 'openai/gpt-oss-20b';
  const updatedProducts: ParsedProduct[] = [...products];

  // 1. 청크 분할 (권장 batchSize: 25~30개)
  const chunks: ParsedProduct[][] = [];
  for (let i = 0; i < products.length; i += batchSize) {
    chunks.push(products.slice(i, i + batchSize));
  }

  const startTime = Date.now();
  console.log(
    `[Smart Tips Grounding] 🚀 Starting smart tip generation for ${products.length} products (${chunks.length} chunks, batchSize: ${batchSize}, concurrency: ${concurrency})...`
  );

  // 2. 단일 청크 처리 서브루틴
  async function processChunk(
    chunk: ParsedProduct[],
    chunkNum: number,
    totalChunks: number
  ): Promise<Map<string, SmartTip>> {
    const chunkStartTime = Date.now();
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
      `[Smart Tips Grounding] 🚀 Calling '${model}' for chunk ${chunkNum}/${totalChunks} (${chunk.length} products)...`
    );

    const prompt = `
당신은 대한민국 대형마트와 쿠팡/온라인 쇼핑몰 가격 및 식재료 특성을 꿰뚫고 있는 스마트 장보기 전문 큐레이터입니다.
실시간 웹 브라우징(browser_search)을 활용하여 제공된 각 상품의 실시간 온라인 최저가 및 쿠팡(로켓배송/로켓프레시) 판매가와 단가를 대조하십시오.

[평가 대상 상품 목록]
${JSON.stringify(simplifiedList, null, 2)}

[⚠️ 절대 준수: 기계적 반복 및 템플릿 복붙 금지 규칙]
- "[상품명]은 신선도가 중요/핵심입니다. 현장 구매가 유리/편리합니다." 같은 판에 박힌 문장을 다른 상품에 반복하는 행위를 절대 금지합니다.
- 각 상품의 '구체적인 식재료 특성(당일 섭취 여부, 눈으로 고르는 요령, 유통기한, 조리법, 물러짐 등)'이나 '구체적인 가격/단가 우위'를 반드시 반영하여 살아있는 맞춤 문장으로 작성하십시오.
- 상품마다 문장 구조, 표현, 어휘를 완전히 다양하고 자연스럽게 작성하십시오.

[스마트 팁(smartTip) 4대 분류 규칙]
1. MART_BEST: 마트 행사가격이 온라인/쿠팡 최저가보다 확실히 저렴한 파격 특가인 경우.
   - badgeText: "마트 필구 특가"
   - tipMessage: 온라인 대비 구체적 가격/단가 우위 및 혜택 설명
     * 예시: "온라인 최저가(100g당 2,400원) 대비 20% 이상 저렴한 파격 행사가예요. 고기 육색과 마블링을 직접 보고 고를 수 있어 최적입니다."

2. MART_RECOMMEND: 당일 소비 소량 구매가 유리하거나 마트 가격이 합리적인 신선식품.
   - badgeText: "마트 현장 추천"
   - tipMessage: 식재료별 구체적인 취급 특성, 신선도 확인 요령, 당일 조리 적합성 설명
     * 회/초밥 예시: "회·초밥류는 당일 조리 신선도가 생명이라 배송보다 매장에서 바로 조리된 신선한 상품을 눈으로 보고 즉시 구매하시는 것을 강력 추천해요."
     * 과일 예시: "멜론은 꼭지와 밑동 상태를 직접 확인해 후숙도를 가늠할 수 있어 오프라인 매장 구매가 훨씬 실패가 없어요."
     * 채소/버섯 예시: "샤브샤브용 버섯과 알배기는 온라인 대용량 주문 시 남아서 무르기 쉬우니 오늘 저녁 딱 먹을 만큼만 마트에서 담는 게 훨씬 경제적이에요."

3. COUPANG_TIP: 신선식품이나 가공식품이라도 마트 행사가격이 쿠팡(로켓프레시 등)보다 비싸거나 가격 메리트가 없는 경우.
   - badgeText: "쿠팡 신선 알뜰"
   - tipMessage: 쿠팡 대비 마트 가격이 비싸다는 구체적 대조 및 쿠팡 구매 권장
     * 밀키트 예시: "쿠팡 로켓프레시에서 동일 제품이 10~15% 더 저렴하고 내일 아침 바로 도착하니 쿠팡 주문이 훨씬 알뜰해요."
   - coupangKeyword: 상품명

4. COUPANG_BULK: 유통기한이 넉넉한 공산품/생필품/냉동식품 중 쿠팡 대용량 단가가 압도적으로 저렴하거나 오프라인 운반 부담이 큰 경우.
   - badgeText: "대용량 알뜰 팁"
   - tipMessage: 보관이 용이한 생필품의 쿠팡 대용량 단가 우위와 배송 편의성 설명
     * 예시: "자주 쓰는 생필품은 쿠팡 대용량 묶음 구매 시 개당 단가를 20% 이상 낮출 수 있고 무겁게 들고 올 필요도 없어요."
   - coupangKeyword: "상품명 대용량"

반드시 아래 JSON 배열 형식으로만 응답하십시오. 마크다운 코드블록이나 다른 부연 설명은 일체 포함하지 마십시오.
[
  {
    "id": "상품id",
    "smartTip": {
      "tipType": "MART_BEST" | "MART_RECOMMEND" | "COUPANG_TIP" | "COUPANG_BULK",
      "badgeText": "뱃지 문구",
      "tipMessage": "풍부하고 구체적인 맞춤 팁 메시지",
      "coupangKeyword": "쿠팡검색어 또는 null"
    }
  }
]
`;

    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        tools: [
          {
            type: 'browser_search' as unknown as 'function',
          },
        ],
        temperature: 0.6,
        max_completion_tokens: 8192,
      });

      const responseText = completion.choices[0]?.message?.content || '[]';
      const rawText = stripMarkdownFences(responseText);
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

      const chunkElapsedSec = ((Date.now() - chunkStartTime) / 1000).toFixed(2);
      console.log(
        `[Smart Tips Grounding] ⏱️ Chunk ${chunkNum}/${totalChunks} finished in ${chunkElapsedSec}s (${chunkTipMap.size} tips).`
      );
      return chunkTipMap;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const chunkElapsedSec = ((Date.now() - chunkStartTime) / 1000).toFixed(2);
      console.error(
        `[Smart Tips Grounding Error] Chunk ${chunkNum}/${totalChunks} failed after ${chunkElapsedSec}s:`,
        errorMsg
      );
      const fallbackMap = new Map<string, SmartTip>();
      for (const prod of chunk) {
        if (prod.id) {
          fallbackMap.set(prod.id, generateDefaultTip(prod));
        }
      }
      return fallbackMap;
    }
  }

  // 3. Concurrency 단위 병렬 처리 (기본 동시 4개 청크 실행)
  const tipMap = new Map<string, SmartTip>();
  const totalRounds = Math.ceil(chunks.length / concurrency);

  for (let i = 0; i < chunks.length; i += concurrency) {
    const roundIndex = Math.floor(i / concurrency) + 1;
    const roundStartTime = Date.now();
    const activeChunks = chunks.slice(i, i + concurrency);

    console.log(
      `[Smart Tips Grounding] ⚡ Starting Round ${roundIndex}/${totalRounds} (processing ${activeChunks.length} chunks concurrently)...`
    );

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

    const roundElapsedSec = ((Date.now() - roundStartTime) / 1000).toFixed(2);
    console.log(`[Smart Tips Grounding] ⏱️ Round ${roundIndex}/${totalRounds} completed in ${roundElapsedSec}s.`);
  }

  // 4. 상품 객체에 최종 생성된 스마트 팁 주입
  for (const prod of updatedProducts) {
    if (prod.id && tipMap.has(prod.id)) {
      prod.smartTip = tipMap.get(prod.id);
    } else {
      prod.smartTip = prod.smartTip || generateDefaultTip(prod);
    }
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `[Smart Tips Grounding] 🏁 All ${chunks.length} chunks completed in ${elapsedSec}s for ${updatedProducts.length} products.`
  );

  return updatedProducts;
}
