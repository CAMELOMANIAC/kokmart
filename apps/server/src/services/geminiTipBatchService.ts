import { GoogleGenAI } from '@google/genai';
import { ParsedProduct, SmartTip } from '@kokmart/shared';

type ShoppingInsightType =
  | 'PRICE'
  | 'PREMIUM'
  | 'SMALL_PACK'
  | 'FRESHNESS'
  | 'BULK_ONLINE'
  | 'STANDARD';

export interface OnlinePriceEvidence {
  id: string;
  onlinePrice: number;
  onlineUnitPrice: number;
  retailer: string;
  matchedProduct: string;
  insightType: ShoppingInsightType;
  reason: string;
  sourceUrl: string;
}

export interface RejectedGeminiTipProduct {
  product: ParsedProduct;
  error: string;
}

export interface GeminiTipBatchResult {
  products: ParsedProduct[];
  rejected: RejectedGeminiTipProduct[];
  model: string;
  groundingSources: number;
}

function stripMarkdownFences(text: string): string {
  return text
    .trim()
    .replace(/^```[a-zA-Z]*\r?\n/, '')
    .replace(/\r?\n```$/, '')
    .trim();
}

function parsePositivePrice(raw: string): number | null {
  const parsed = Number(raw.replaceAll(',', '').trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function parseEvidenceTsv(rawText: string): Map<string, OnlinePriceEvidence> {
  const result = new Map<string, OnlinePriceEvidence>();
  const lines = stripMarkdownFences(rawText).split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const columns = line.split('\t').map((column) => column.trim());
    if (columns[0]?.toLowerCase() === 'id') continue;
    if (columns.length < 8) continue;

    const [
      id,
      rawOnlinePrice,
      rawOnlineUnitPrice,
      retailer,
      matchedProduct,
      rawInsightType,
      rawReason,
      sourceUrl,
    ] = columns;
    if (!id || !retailer || !matchedProduct || !rawReason || !sourceUrl) continue;

    const onlinePrice = parsePositivePrice(rawOnlinePrice || '');
    const onlineUnitPrice = parsePositivePrice(rawOnlineUnitPrice || '');
    if (!onlinePrice || !onlineUnitPrice) continue;
    if (!/^https?:\/\//i.test(sourceUrl)) continue;

    const allowedInsightTypes: ShoppingInsightType[] = [
      'PRICE',
      'PREMIUM',
      'SMALL_PACK',
      'FRESHNESS',
      'BULK_ONLINE',
      'STANDARD',
    ];
    const insightType = allowedInsightTypes.includes(rawInsightType as ShoppingInsightType)
      ? rawInsightType as ShoppingInsightType
      : 'STANDARD';
    const reason = rawReason.replace(/[\t\r\n]+/g, ' ').slice(0, 80);

    result.set(id, {
      id,
      onlinePrice,
      onlineUnitPrice,
      retailer,
      matchedProduct,
      insightType,
      reason,
      sourceUrl,
    });
  }

  return result;
}

/**
 * 모델 문장을 신뢰하지 않고 검색 가격과 DB 가격으로 추천 방향/차액/할인율을 계산합니다.
 */
export function buildGroundedSmartTip(
  product: ParsedProduct,
  evidence: OnlinePriceEvidence
): SmartTip {
  const martUnitPrice = Math.round(Number(product.effectiveUnitPrice));
  const onlineUnitPrice = Math.round(evidence.onlineUnitPrice);
  if (!Number.isFinite(martUnitPrice) || martUnitPrice <= 0) {
    throw new Error(`'${product.productName}'의 마트 단위 가격이 올바르지 않습니다.`);
  }

  const ratio = onlineUnitPrice / martUnitPrice;
  if (ratio < 0.02 || ratio > 50) {
    throw new Error(`'${product.productName}'의 온라인 단위 가격이 비정상 범위입니다.`);
  }

  const lower = Math.min(martUnitPrice, onlineUnitPrice);
  const higher = Math.max(martUnitPrice, onlineUnitPrice);
  const percent = higher === 0 ? 0 : ((higher - lower) / higher) * 100;
  const similar = percent < 5;
  const onlineMuchCheaper = onlineUnitPrice < martUnitPrice && percent >= 10;
  const unit = product.unitMeasure || '동일 단위';
  const percentage = percent.toFixed(1);

  // 가격이 실제 장점일 때만 할인율을 사용자에게 보여 줍니다.
  if (!similar && martUnitPrice < onlineUnitPrice) {
    return {
      tipType: percent >= 20 ? 'MART_BEST' : 'MART_RECOMMEND',
      badgeText: percent >= 20 ? '마트 필구 특가' : '마트 가격 메리트',
      tipMessage: `${product.productName}: 마트가 ${evidence.retailer}보다 ${unit}당 ${percentage}% 저렴해 가격 메리트가 있어요.`,
      coupangKeyword: null,
    };
  }

  if (product.isPerishable || evidence.insightType === 'FRESHNESS') {
    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '신선 장보기',
      tipMessage: `${product.productName}: ${evidence.reason}. 신선도와 상태를 직접 확인하고 바로 구매하기 좋아요.`,
      coupangKeyword: null,
    };
  }

  if (evidence.insightType === 'PREMIUM') {
    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '프리미엄 선택',
      tipMessage: `${product.productName}: ${evidence.reason}. 단가가 높더라도 품질이나 제품 특색을 중시한다면 살 만해요.`,
      coupangKeyword: null,
    };
  }

  // 소용량 편의는 가격 차이가 작을 때만 마트 구매의 근거가 됩니다.
  // 온라인이 10% 이상 저렴하면 소용량이어도 온라인 가격 메리트를 우선합니다.
  if (onlineMuchCheaper) {
    return {
      tipType: 'COUPANG_TIP',
      badgeText: '온라인 가격 메리트',
      tipMessage: evidence.insightType === 'SMALL_PACK'
        ? `${product.productName}: ${evidence.retailer} 쪽이 단가 기준 ${percentage}% 더 저렴해요. 오늘 바로 먹을 소용량이 필요할 때만 마트 구매가 편리합니다.`
        : `${product.productName}: 같은 규격을 단가로 비교하면 ${evidence.retailer} 쪽이 ${percentage}% 더 저렴해요. 배송비와 구매 수량을 함께 확인해 보세요.`,
      coupangKeyword: product.productName,
    };
  }

  if (evidence.insightType === 'SMALL_PACK') {
    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '소용량 간편 선택',
      tipMessage: `${product.productName}: ${evidence.reason}. 단가가 조금 높더라도 보관 부담이 적고 바로 먹기 좋아요.`,
      coupangKeyword: null,
    };
  }

  if (evidence.insightType === 'BULK_ONLINE' && onlineUnitPrice < martUnitPrice) {
    return {
      tipType: 'COUPANG_BULK',
      badgeText: '온라인 대용량 유리',
      tipMessage: `${product.productName}: ${evidence.reason}. 많이 사용한다면 ${evidence.retailer} 대용량 구성이 단가 면에서 유리해요.`,
      coupangKeyword: `${product.productName} 대용량`,
    };
  }

  if (similar) {
    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '마트 현장 추천',
      tipMessage: `${product.productName}: 온라인과 단가 차이가 크지 않아 배송을 기다리지 않고 마트에서 바로 구매하기 좋아요.`,
      coupangKeyword: null,
    };
  }

  return {
    tipType: 'COUPANG_TIP',
    badgeText: '온라인 가격 메리트',
    tipMessage: `${product.productName}: 같은 규격을 단가로 비교하면 ${evidence.retailer} 쪽이 더 저렴해요. 배송비와 구매 수량을 함께 확인해 보세요.`,
    coupangKeyword: product.productName,
  };
}

function buildPrompt(products: ParsedProduct[]): string {
  const rows = products.map((product) =>
    [
      product.id,
      product.martName || '마트',
      product.productName,
      Math.round(product.salePrice),
      Math.round(product.effectiveUnitPrice),
      product.unitMeasure,
    ].join('\t')
  ).join('\n');

  return `아래 한국 마트 전단 상품 각각에 대해 Google Search를 실제로 수행하여 현재 구매 가능한 온라인 가격을 찾으십시오.
상품의 용량/수량/규격이 다르면 반드시 마트의 단위 기준으로 환산하십시오. 검색 결과가 없거나 규격을 확실히 맞출 수 없으면 그 상품은 출력하지 마십시오.

[입력]
id\t마트\t상품명\t마트총가격\t마트단위가격\t마트단위
${rows}

[출력]
오직 다음 TSV만 출력하십시오. 설명, 마크다운, 탭이 포함된 문장을 추가하지 마십시오.
id\t온라인총가격\t마트단위로환산한온라인단위가격\t판매처\t검색결과상품명\t구매특성\t근거요약\t출처URL

[검증 규칙]
- 입력의 모든 상품을 개별 검색하고, 입력 id를 한 글자도 바꾸지 마십시오.
- 쿠팡 검색 결과를 우선하되 찾을 수 없으면 신뢰할 수 있는 국내 온라인 판매처를 사용하십시오.
- 품절, 중고, 해외배송, 회원 전용 쿠폰가는 제외하십시오.
- 배송비는 가격에 포함하십시오.
- 온라인총가격과 온라인단위가격은 쉼표나 원 기호 없는 양의 정수로 쓰십시오.
- 구매특성은 PRICE, PREMIUM, SMALL_PACK, FRESHNESS, BULK_ONLINE, STANDARD 중 하나만 쓰십시오.
- PREMIUM은 원재료, 품종, 제조법 등 확인 가능한 프리미엄 특성이 있을 때만 사용하십시오.
- SMALL_PACK은 온라인 비교 상품보다 실제 포장량이 작아 보관·즉시 섭취에 유리할 때만 사용하십시오.
- BULK_ONLINE은 온라인 상품이 더 큰 묶음이고 동일 단위 가격도 더 저렴할 때만 사용하십시오.
- 근거요약은 검색이나 상품명에서 확인한 객관적 특성 하나만 40자 이내로 작성하십시오. 막연한 품질 칭찬은 금지합니다.
- 출처URL은 실제 검색 결과의 http 또는 https URL이어야 합니다.`;
}

/** Gemini 2.5 Flash + Google Search로 한 페이지 분량의 마스터 팁을 생성합니다. */
export async function generateGeminiTipBatch(
  products: ParsedProduct[]
): Promise<GeminiTipBatchResult> {
  if (products.length === 0) {
    return {
      products: [],
      rejected: [],
      model: process.env.GEMINI_TIP_MODEL || 'gemini-2.5-flash',
      groundingSources: 0,
    };
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');

  const missingId = products.find((product) => !product.id);
  if (missingId) throw new Error(`'${missingId.productName}' 상품 ID가 없습니다.`);

  const model = process.env.GEMINI_TIP_MODEL || 'gemini-2.5-flash';
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: buildPrompt(products),
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  });

  const groundingSources = response.candidates?.reduce(
    (total, candidate) => total + (candidate.groundingMetadata?.groundingChunks?.length || 0),
    0
  ) || 0;
  if (groundingSources === 0) {
    throw new Error('Gemini Google Search가 검증 가능한 grounding source를 반환하지 않았습니다.');
  }

  const evidenceById = parseEvidenceTsv(response.text || '');
  const completed: ParsedProduct[] = [];
  const rejected: RejectedGeminiTipProduct[] = [];

  for (const product of products) {
    const evidence = evidenceById.get(product.id || '');
    if (!evidence) {
      rejected.push({ product, error: `Gemini 검색 결과에서 '${product.productName}' 가격 근거가 누락되었습니다.` });
      continue;
    }

    try {
      completed.push({
        ...product,
        smartTip: buildGroundedSmartTip(product, evidence),
        tipStatus: 'complete',
        tipSource: 'gemini_grounded',
        tipProcessor: 'gemini_batch',
      });
    } catch (error: unknown) {
      rejected.push({
        product,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { products: completed, rejected, model, groundingSources };
}
