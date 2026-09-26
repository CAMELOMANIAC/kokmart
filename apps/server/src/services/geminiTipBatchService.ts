import { GoogleGenAI } from '@google/genai';
import { ParsedProduct, SmartTip } from '@kokmart/shared';

type ShoppingInsightType =
  | 'PRICE'
  | 'PREMIUM'
  | 'SMALL_PACK'
  | 'FRESHNESS'
  | 'BULK_ONLINE'
  | 'STANDARD';

type ComparisonLevel = 'EXACT' | 'CLOSE' | 'CATEGORY' | 'NONE';
type ApproximatePriceVerdict = 'MART_GOOD' | 'SIMILAR' | 'ONLINE_GOOD' | 'UNKNOWN';
type ProductTrait =
  | 'FROZEN'
  | 'LONG_KEEPING'
  | 'FRESH'
  | 'SMALL_PACK'
  | 'BULK'
  | 'READY_TO_EAT'
  | 'STANDARD';

export interface OnlinePriceEvidence {
  id: string;
  comparisonLevel?: ComparisonLevel;
  onlinePrice: number;
  onlineUnitPrice: number;
  retailer: string;
  matchedProduct: string;
  insightType: ShoppingInsightType;
  productTrait?: ProductTrait;
  priceCondition?: string;
  reason: string;
  sourceUrl: string;
  approximatePriceVerdict?: ApproximatePriceVerdict;
  /** 가격 판단을 제외하고 Gemini가 작성한 상품별 구매 조언 한 문장 */
  tipCopy?: string;
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

const DEFAULT_TIP_MODEL = 'gemini-3.8-flash';

function stripMarkdownFences(text: string): string {
  return text
    .trim()
    .replace(/^```[a-zA-Z]*\r?\n/, '')
    .replace(/\r?\n```$/, '')
    .trim();
}

function parsePositivePrice(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function parseSourceUrl(raw: string): string | null {
  const markdownUrl = raw.match(/\]\((https?:\/\/[^)\s]+)\)/i)?.[1];
  const plainUrl = raw.match(/https?:\/\/[^\s)\]]+/i)?.[0];
  return (markdownUrl || plainUrl || '').replace(/[.,;]+$/, '') || null;
}

function parseSafeTipCopy(raw: string | undefined): string | undefined {
  if (!raw || raw === '-') return undefined;

  const normalized = raw
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/^['"“”]+|['"“”]+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/할 수 있습니다(?=[.!?]?($|\s))/g, '할 수 있어요')
    .replace(/좋습니다(?=[.!?]?($|\s))/g, '좋아요')
    .replace(/적합합니다(?=[.!?]?($|\s))/g, '적합해요')
    .replace(/유리합니다(?=[.!?]?($|\s))/g, '유리해요')
    .replace(/필요합니다(?=[.!?]?($|\s))/g, '필요해요')
    .replace(/하십시오|하세요|보세요|드세요|두세요|마세요|습니다|십시오|하시오|시오/g, '해요') // Relaxed rule: convert to 해요 instead of dropping
    .trim();
    
  if (normalized.length < 5) return undefined;

  const withoutPunctuation = normalized.replace(/[.!?]+$/, '');
  return `${withoutPunctuation}.`;
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

    const normalizedComparisonLevel = (columns[1] || '').toUpperCase();
    const isRelaxedFormat = ['EXACT', 'CLOSE', 'CATEGORY', 'NONE'].includes(normalizedComparisonLevel);
    if (isRelaxedFormat) {
      const [
        id,
        rawComparisonLevel,
        rawOnlinePrice,
        rawOnlineUnitPrice,
        retailer,
        matchedProduct,
        rawProductTrait,
        rawPriceCondition,
        rawReason,
        sourceUrl,
        rawTipCopy,
        rawApproximatePriceVerdict,
      ] = columns;
      if (!id || !rawReason) continue;

      const comparisonLevel = rawComparisonLevel.toUpperCase() as ComparisonLevel;
      const allowedTraits: ProductTrait[] = [
        'FROZEN',
        'LONG_KEEPING',
        'FRESH',
        'SMALL_PACK',
        'BULK',
        'READY_TO_EAT',
        'STANDARD',
      ];
      const normalizedProductTrait = (rawProductTrait || '').toUpperCase() as ProductTrait;
      const productTrait = allowedTraits.includes(normalizedProductTrait)
        ? normalizedProductTrait
        : 'STANDARD';
      const reason = rawReason.replace(/[\t\r\n]+/g, ' ').slice(0, 80);
      const tipCopy = parseSafeTipCopy(rawTipCopy);
      const normalizedVerdict = (rawApproximatePriceVerdict || '').toUpperCase() as ApproximatePriceVerdict;
      const approximatePriceVerdict: ApproximatePriceVerdict = [
        'MART_GOOD',
        'SIMILAR',
        'ONLINE_GOOD',
        'UNKNOWN',
      ].includes(normalizedVerdict)
        ? normalizedVerdict
        : 'UNKNOWN';

      if (comparisonLevel === 'NONE') {
        result.set(id, {
          id,
          comparisonLevel,
          onlinePrice: 0,
          onlineUnitPrice: 0,
          retailer: '',
          matchedProduct: '',
          insightType: 'STANDARD',
          productTrait,
          priceCondition: '',
          reason,
          sourceUrl: '',
          tipCopy,
          approximatePriceVerdict,
        });
        continue;
      }

      const onlinePrice = parsePositivePrice(rawOnlinePrice || '');
      const onlineUnitPrice = parsePositivePrice(rawOnlineUnitPrice || '');
      const normalizedSourceUrl = parseSourceUrl(sourceUrl || '');
      // 검색은 됐지만 판매처명·URL·환산단가가 빠진 행도 대략 가격대 판단으로 보존합니다.
      // 정확한 할인율은 아래 빌더에서 URL과 비교 가능한 가격이 모두 있을 때만 계산합니다.
      if (!onlinePrice && approximatePriceVerdict === 'UNKNOWN') continue;

      const evidence: OnlinePriceEvidence = {
        id,
        comparisonLevel,
        onlinePrice: onlinePrice || 0,
        onlineUnitPrice: onlineUnitPrice || 0,
        retailer: retailer && retailer !== '-' ? retailer : '온라인 판매처',
        matchedProduct: matchedProduct && matchedProduct !== '-' ? matchedProduct : '동급 상품',
        insightType: productTrait === 'SMALL_PACK'
          ? 'SMALL_PACK'
          : productTrait === 'BULK'
            ? 'BULK_ONLINE'
            : productTrait === 'FRESH'
              ? 'FRESHNESS'
              : 'STANDARD',
        productTrait,
        priceCondition: (rawPriceCondition || '').replace(/[\t\r\n]+/g, ' ').slice(0, 80),
        reason,
        sourceUrl: normalizedSourceUrl || '',
        tipCopy,
        approximatePriceVerdict,
      };
      const existing = result.get(id);
      const evidencePrice = evidence.onlineUnitPrice || evidence.onlinePrice || Number.POSITIVE_INFINITY;
      const existingPrice = existing?.onlineUnitPrice || existing?.onlinePrice || Number.POSITIVE_INFINITY;
      const evidenceQuality = (evidence.sourceUrl ? 2 : 0) + (evidence.onlineUnitPrice > 0 ? 1 : 0);
      const existingQuality = existing
        ? (existing.sourceUrl ? 2 : 0) + (existing.onlineUnitPrice > 0 ? 1 : 0)
        : -1;
      if (
        !existing
        || evidenceQuality > existingQuality
        || (evidenceQuality === existingQuality && evidencePrice < existingPrice)
      ) {
        result.set(id, evidence);
      }
      continue;
    }

    const [
      id,
      rawOnlinePrice,
      rawOnlineUnitPrice,
      retailer,
      matchedProduct,
      rawInsightType,
      rawReason,
      sourceUrl,
      rawTipCopy,
    ] = columns;
    if (!id || !retailer || !matchedProduct || !rawReason || !sourceUrl) continue;

    const onlinePrice = parsePositivePrice(rawOnlinePrice || '');
    const onlineUnitPrice = parsePositivePrice(rawOnlineUnitPrice || '');
    const normalizedSourceUrl = parseSourceUrl(sourceUrl);
    if (!onlinePrice || !onlineUnitPrice) continue;
    if (!normalizedSourceUrl) continue;

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

    const evidence: OnlinePriceEvidence = {
      id,
      comparisonLevel: 'EXACT',
      onlinePrice,
      onlineUnitPrice,
      retailer,
      matchedProduct,
      insightType,
      productTrait: insightType === 'FRESHNESS'
        ? 'FRESH'
        : insightType === 'SMALL_PACK'
          ? 'SMALL_PACK'
          : insightType === 'BULK_ONLINE'
            ? 'BULK'
            : 'STANDARD',
      reason,
      sourceUrl: normalizedSourceUrl,
      tipCopy: parseSafeTipCopy(rawTipCopy),
    };
    const existing = result.get(id);
    // 모델이 같은 상품의 여러 판매처/행사가를 반환하면 단위 가격이 가장 낮은 현재 판매가를 사용합니다.
    if (!existing || evidence.onlineUnitPrice < existing.onlineUnitPrice) {
      result.set(id, evidence);
    }
  }

  return result;
}

function countInteractionGrounding(steps: Array<{ type: string; [key: string]: unknown }> | undefined): {
  searchQueries: number;
  citations: number;
} {
  let searchQueries = 0;
  let citations = 0;

  for (const step of steps || []) {
    if (step.type === 'google_search_call') {
      const queries = (step.arguments as { queries?: unknown } | undefined)?.queries;
      searchQueries += Array.isArray(queries) && queries.length > 0 ? queries.length : 1;
      continue;
    }

    if (step.type !== 'model_output') continue;
    const content = (step as { content?: Array<{ type?: string; annotations?: Array<{ type?: string; url?: string }> }> }).content;
    for (const block of content || []) {
      if (block.type !== 'text') continue;
      citations += (block.annotations || []).filter(
        (annotation) => annotation.type === 'url_citation' && /^https?:\/\//i.test(annotation.url || '')
      ).length;
    }
  }

  return { searchQueries, citations };
}

/**
 * 모델 문장을 신뢰하지 않고 검색 가격과 DB 가격으로 추천 방향/차액/할인율을 계산합니다.
 */
function buildUnpricedAiTip(product: ParsedProduct, evidence: OnlinePriceEvidence): SmartTip {
  const safeTipCopy = parseSafeTipCopy(evidence.tipCopy);
  const trait = evidence.productTrait || 'STANDARD';
  const fallback = trait === 'FROZEN'
    ? '자주 먹는 상품이라면 필요한 수량을 따져 온라인 묶음과 마트 낱개를 비교하기 좋아요.'
    : trait === 'LONG_KEEPING'
      ? '오래 두고 쓰는 상품이라 사용량이 많다면 온라인 묶음 구성도 비교할 만해요.'
      : trait === 'FRESH' || product.isPerishable
        ? '필요한 만큼 사고 상태와 신선도를 직접 확인할 수 있는 마트 구매가 좋아요.'
        : trait === 'SMALL_PACK'
          ? '많이 필요하지 않다면 필요한 양만 마트에서 바로 사기 좋아요.'
          : trait === 'READY_TO_EAT'
            ? '바로 먹을 양만 필요하면 마트에서 구성을 보고 사기 좋아요.'
            : '필요한 수량과 묶음 구성을 비교해서 구매하는 게 좋아요.';
  return {
    tipType: 'MART_RECOMMEND',
    badgeText: trait === 'FRESH' || product.isPerishable ? '신선 장보기' : '상품별 구매 팁',
    tipMessage: safeTipCopy || fallback,
    coupangKeyword: null,
  };
}

/** 출처나 환산단가가 부족한 검색 결과는 수치 없이 평균 프로모션 가격대만 안내합니다. */
function buildApproximatePromotionTip(product: ParsedProduct, evidence: OnlinePriceEvidence): SmartTip {
  if (evidence.approximatePriceVerdict === 'MART_GOOD') {
    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '프로모션 가격대 적정',
      tipMessage: '평균적인 프로모션 가격대와 비교해 구매하기 적합한 가격이에요.',
      coupangKeyword: null,
    };
  }

  if (evidence.approximatePriceVerdict === 'SIMILAR') {
    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '프로모션 가격대 비슷',
      tipMessage: '평균적인 프로모션 가격대와 비슷해 필요한 시점에 마트에서 구매하기 좋아요.',
      coupangKeyword: null,
    };
  }

  if (evidence.approximatePriceVerdict === 'ONLINE_GOOD') {
    return {
      tipType: evidence.sourceUrl ? 'COUPANG_TIP' : 'MART_RECOMMEND',
      badgeText: '온라인 가격대 참고',
      tipMessage: evidence.sourceUrl
        ? '평균적인 온라인 프로모션 가격대가 더 낮은 편이라 필요한 용량을 확인한 뒤 온라인 구매를 비교하기 좋아요.'
        : '온라인 프로모션 가격대가 더 낮은 편이지만 판매처를 특정할 수 없어 구매 전 실제 판매가를 확인하는 게 좋아요.',
      coupangKeyword: evidence.sourceUrl ? product.productName : null,
    };
  }

  return buildUnpricedAiTip(product, evidence);
}

export function buildGroundedSmartTip(
  product: ParsedProduct,
  evidence: OnlinePriceEvidence
): SmartTip {
  const comparisonLevel = evidence.comparisonLevel || 'EXACT';
  if (comparisonLevel === 'NONE') return buildUnpricedAiTip(product, evidence);

  const hasNormalizedPrices = product.effectiveUnitPrice > 0 && evidence.onlineUnitPrice > 0;
  const canCompareTotalPrice = product.salePrice > 0 && evidence.onlinePrice > 0;
  const hasVerifiableSource = Boolean(evidence.sourceUrl);
  
  if (!hasNormalizedPrices && !canCompareTotalPrice) {
    return buildApproximatePromotionTip(product, evidence);
  }

  const martUnitPrice = Math.round(hasNormalizedPrices ? product.effectiveUnitPrice : product.salePrice);
  const onlineUnitPrice = Math.round(hasNormalizedPrices ? evidence.onlineUnitPrice : evidence.onlinePrice);

  const ratio = onlineUnitPrice / martUnitPrice;
  if (ratio < 0.02 || ratio > 50) {
    throw new Error(`'${product.productName}'의 온라인 단위 가격이 비정상 범위입니다.`);
  }

  const lower = Math.min(martUnitPrice, onlineUnitPrice);
  const higher = Math.max(martUnitPrice, onlineUnitPrice);
  const percent = higher === 0 ? 0 : ((higher - lower) / higher) * 100;
  const similar = percent < 10;
  const martCheaper = martUnitPrice < onlineUnitPrice && !similar;
  const onlineCheaper = onlineUnitPrice < martUnitPrice && !similar;
  const rawUnit = (product.unitMeasure || '').trim();
  const priceBasis = !hasNormalizedPrices
    ? '동일 상품·규격 기준'
    : !rawUnit || /^(1|개|1개)$/.test(rawUnit)
      ? '1개당'
    : rawUnit.endsWith('당')
      ? `${rawUnit} 기준`
      : `${rawUnit}당`;
  const percentage = percent.toFixed(1);
  const trait = evidence.productTrait || 'STANDARD';
  const isFrozen = trait === 'FROZEN' || /냉동|아이스크림|냉동실/i.test(product.productName);
  const longKeeping = trait === 'LONG_KEEPING' || trait === 'BULK';
  const isFresh = trait === 'FRESH' || product.isPerishable || evidence.insightType === 'FRESHNESS';
  const safeTipCopy = parseSafeTipCopy(evidence.tipCopy);
  const advice = (fallback: string): string => safeTipCopy || fallback;
  const referenceLabel = comparisonLevel === 'EXACT'
    ? `동일 상품 판매가(${evidence.retailer})`
    : `동급 비교상품(${evidence.retailer})`;

  // CATEGORY는 대략적인 동급 비교이므로 정밀 할인율을 주장하지 않습니다.
  if (comparisonLevel === 'CATEGORY') {
    if (onlineCheaper && (isFrozen || longKeeping)) {
      return {
        tipType: trait === 'BULK' ? 'COUPANG_BULK' : 'COUPANG_TIP',
        badgeText: trait === 'BULK' ? '온라인 대용량 참고' : '온라인 가격대 참고',
        tipMessage: `${priceBasis} ${referenceLabel}의 환산단가가 더 낮게 확인됐어요. ${advice(isFrozen ? '자주 먹는 상품이라면 온라인 묶음 구매도 고려할 만해요.' : '사용량이 많다면 온라인 묶음 구성도 비교할 만해요.')}`,
        coupangKeyword: trait === 'BULK' ? `${product.productName} 대용량` : product.productName,
      };
    }
    if (onlineCheaper && isFresh) {
      return {
        tipType: 'MART_RECOMMEND',
        badgeText: '가격대·신선도 비교',
        tipMessage: `${referenceLabel}의 환산단가가 더 낮게 확인됐어요. ${advice('동급 가격대를 참고하되 상태와 신선도를 직접 확인할 수 있는 마트 구매가 좋아요.')}`,
        coupangKeyword: null,
      };
    }
    if (onlineCheaper) {
      return {
        tipType: 'COUPANG_TIP',
        badgeText: '온라인 가격대 참고',
        tipMessage: `${priceBasis} ${referenceLabel}의 환산단가가 더 낮게 확인됐어요. ${advice('용량과 구성이 필요한 조건에 맞는지 따져보는 게 좋아요.')}`,
        coupangKeyword: product.productName,
      };
    }
    return {
      tipType: 'MART_RECOMMEND',
      badgeText: martCheaper ? '마트 가격대 우위' : '동급 가격대 비슷',
      tipMessage: martCheaper
        ? `${priceBasis} 마트 전단가가 ${referenceLabel}보다 낮게 확인됐어요. ${advice('상품 특성과 구성이 마음에 든다면 전단 행사를 활용하기 좋아요.')}`
        : `${referenceLabel}와 환산단가 차이가 크지 않아요. ${advice('필요한 시점과 구매 편의를 기준으로 선택하는 게 좋아요.')}`,
      coupangKeyword: null,
    };
  }

  // 여러 현재 판매가 중 가장 낮은 비교 가격보다 마트가 쌀 때만 전단 가격 우위를 주장합니다.
  if (martCheaper) {
    return {
      tipType: percent >= 20 ? 'MART_BEST' : 'MART_RECOMMEND',
      badgeText: percent >= 20 ? '마트 필구 특가' : '마트 가격 메리트',
      tipMessage: `${priceBasis} 마트가 ${referenceLabel}보다 ${percentage}% 저렴해 전단 행사 메리트가 확실해요.${safeTipCopy ? ` ${safeTipCopy}` : ''}`,
      coupangKeyword: null,
    };
  }

  if (similar) {
    if (isFresh) {
      return {
        tipType: 'MART_RECOMMEND',
        badgeText: '가격 비슷·신선 확인',
        tipMessage: `${referenceLabel}와 ${percentage}% 차이로 비슷해요. ${advice('필요한 만큼 사고 신선도를 직접 확인할 수 있는 마트 구매가 좋아요.')}`,
        coupangKeyword: null,
      };
    }

    if (isFrozen) {
      return {
        tipType: 'MART_RECOMMEND',
        badgeText: '가격 비슷·바로 구매',
        tipMessage: `${referenceLabel}와 ${percentage}% 차이로 비슷해요. ${advice('가격 차이가 작다면 필요한 수량만 마트에서 바로 사기 좋아요.')}`,
        coupangKeyword: null,
      };
    }

    if (evidence.insightType === 'SMALL_PACK') {
      return {
        tipType: 'MART_RECOMMEND',
        badgeText: '소용량 간편 선택',
        tipMessage: `확인된 최저가와 가격 차이가 크지 않아요. ${advice('필요한 만큼 바로 구매하기 좋아요.')}`,
        coupangKeyword: null,
      };
    }

    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '가격 비슷·바로 구매',
      tipMessage: `${referenceLabel}와 ${percentage}% 차이로 비슷해요. ${advice('배송을 기다리지 않고 마트에서 바로 사기 좋아요.')}`,
      coupangKeyword: null,
    };
  }

  if (onlineCheaper && (isFrozen || longKeeping)) {
    return {
      tipType: 'COUPANG_TIP',
      badgeText: '온라인 최저가 유리',
      tipMessage: `${priceBasis} ${referenceLabel}가 마트보다 ${percentage}% 저렴해 온라인 주문이 유리해요. ${advice(isFrozen ? '자주 먹는 상품이라면 온라인 묶음 구매가 더 실용적이에요.' : '오래 두고 쓰는 상품이라 온라인으로 여유 있게 주문하기 좋아요.')}`,
      coupangKeyword: product.productName,
    };
  }

  if (onlineCheaper && isFresh) {
    return {
      tipType: 'COUPANG_TIP',
      badgeText: '가격과 신선도 비교',
      tipMessage: `${referenceLabel}가 ${percentage}% 저렴해요. 가격을 우선하면 온라인이 유리하고, 상태 확인과 당일 구매가 중요하면 마트가 좋아요.${safeTipCopy ? ` ${safeTipCopy}` : ''}`,
      coupangKeyword: product.productName,
    };
  }

  if (onlineCheaper && evidence.insightType === 'PREMIUM') {
    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '프리미엄 선택',
      tipMessage: `온라인 최저가가 ${percentage}% 저렴하지만 동급 비교상품과 제품 특성이 달라요. ${advice('가격보다 제품 특색을 중시할 때 선택할 만해요.')}`,
      coupangKeyword: null,
    };
  }

  if (onlineCheaper) {
    return {
      tipType: evidence.insightType === 'BULK_ONLINE' ? 'COUPANG_BULK' : 'COUPANG_TIP',
      badgeText: evidence.insightType === 'BULK_ONLINE' ? '온라인 대용량 유리' : '온라인 최저가 유리',
      tipMessage: evidence.insightType === 'SMALL_PACK'
        ? `${priceBasis} ${referenceLabel}가 ${percentage}% 저렴해 온라인 주문이 유리해요. ${advice('오늘 바로 필요한 소용량이 아니라면 온라인 구매가 경제적이에요.')}`
        : `${priceBasis} ${referenceLabel}가 마트보다 ${percentage}% 저렴해 온라인 주문이 유리해요. ${advice('주문 전에 필요한 수량과 묶음 구성을 따져보는 게 좋아요.')}`,
      coupangKeyword: evidence.insightType === 'BULK_ONLINE'
        ? `${product.productName} 대용량`
        : product.productName,
    };
  }

  throw new Error(`'${product.productName}'의 가격 비교 방향을 결정할 수 없습니다.`);
}

/** 온라인 동일 규격이 없는 상품에 가격을 꾸며내지 않고 비가격 구매 팁을 만듭니다. */
export function buildVisionOnlySmartTip(product: ParsedProduct, _reason: string): SmartTip {
  if (product.isPerishable) {
    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '신선 장보기',
      tipMessage: '필요한 만큼 사고 상태와 신선도를 직접 확인할 수 있는 마트 구매가 좋아요.',
      coupangKeyword: null,
    };
  }

  return {
    tipType: 'MART_RECOMMEND',
    badgeText: '마트 구성 상품',
    tipMessage: '온라인에서 같은 구성을 찾기 어려워 전단 구성과 필요한 수량을 기준으로 구매하는 게 좋아요.',
    coupangKeyword: null,
  };
}

function buildPrompt(products: ParsedProduct[]): string {
  const rows = products.map((product) =>
    [
      product.id,
      product.martName || '마트',
      product.productName,
      product.packageSpec || '',
      Math.round(product.salePrice),
      product.effectiveUnitPrice > 0 ? Math.round(product.effectiveUnitPrice) : '',
      product.unitMeasure || '',
    ].join('\t')
  ).join('\n');

  return `아래 마트 전단 상품마다 Google Search를 수행해 소비자가 실제 대안으로 살 만한 현재 판매 상품 하나를 찾으십시오.
정확히 같은 상품을 우선하되, 없으면 같은 용도와 품질대의 타 브랜드 상품까지 비교 범위를 넓히십시오.
가격이 비슷하다는 이유로 비교 상품을 고르지 말고, 상품 특성이 유사한 대안을 먼저 고른 뒤 가격을 비교하십시오.

[입력]
id\t마트\t상품명\t포장규격\t마트총가격\t마트환산단가\t환산기준
${rows}

[출력]
입력 상품마다 반드시 한 행씩, 입력 순서대로 반환하십시오. 상품을 생략하지 마십시오.
오직 다음 TSV만 출력하고 설명이나 마크다운을 추가하지 마십시오.
id\t비교등급\t비교상품총가격\t마트기준환산단가\t판매처\t비교상품명\t상품특성\t가격조건\t비교근거\t출처URL\t구매조언\t대략가격판정

[비교등급]
- EXACT: 같은 브랜드와 같은 상품. 용량만 달라도 같은 제품군이면 EXACT
- CLOSE: 브랜드가 달라도 원재료, 등급, 용도와 품질대가 거의 같은 대안
- CATEGORY: 정확한 대체품은 아니지만 소비자가 같은 용도로 고를 만한 동급 상품
- NONE: 검색해도 합리적인 비교 상품이나 현재 판매 가격을 찾지 못함

[상품특성]
FROZEN, LONG_KEEPING, FRESH, SMALL_PACK, BULK, READY_TO_EAT, STANDARD 중 하나만 사용하십시오.

[규칙]
- 동일 상품이 없다고 바로 NONE으로 만들지 말고 CLOSE, 그다음 CATEGORY 순서로 끝까지 대안을 찾으십시오. 가급적 NONE 출력은 피하십시오.
- 예: '100% 국산콩 양조간장'이 없으면 다른 브랜드의 국산콩 양조간장, 그다음 동급 프리미엄 양조간장을 찾으십시오. 진간장이나 업소용 간장은 제외하십시오.
- 용량이 다르면 입력의 환산기준과 같은 기준으로 계산하십시오. 계산할 수 없으면 환산단가는 0으로 쓰십시오.
- 마트환산단가가 비어 있더라도 EXACT 상품의 총가격은 찾을 수 있습니다.
- 현재 판매 페이지나 검색 결과에서 확인한 가격만 사용하고 추정하지 마십시오.
- 공개 행사·회원가·카드가 등 조건이 있으면 배제하지 말고 가격조건에 짧게 적으십시오.
- 품절·중고·해외배송은 제외하고, 확인되는 배송비는 총가격에 포함하십시오.
- EXACT/CLOSE/CATEGORY는 가능하면 실제 http 또는 https 출처URL을 넣으십시오.
- 검색은 했지만 판매처명이나 URL을 특정하기 어려워도 행을 생략하지 말고 하이픈(-)을 넣으십시오.
- 환산단가를 계산하지 못해도 평균적인 현재 프로모션 가격대를 바탕으로 대략가격판정을 작성하십시오.
- 대략가격판정은 MART_GOOD, SIMILAR, ONLINE_GOOD, UNKNOWN 중 하나만 사용하십시오. 마트 전단가가 평균적인 프로모션 가격대보다 좋거나 구매하기 적합하면 MART_GOOD를 사용하십시오.
- NONE은 가격 두 칸에 0, 판매처·비교상품명·가격조건·출처URL에 하이픈(-)을 넣고 대략가격판정은 UNKNOWN으로 작성하십시오.
- 비교근거에는 왜 동일하거나 동급인지 50자 이내로 작성하십시오.
- 구매조언은 어디서 살지, 필요한 수량만 살지, 묶음 구매가 나은지, 매장에서 상태를 확인할지 같은 구매 결정만 다루십시오.
- 세척, 손질, 조리, 보관 방법, 냉장·냉동 방법, 해동, 섭취기한이나 섭취 방법은 절대 작성하지 마십시오.
- FROZEN과 LONG_KEEPING은 보관 방법을 설명하지 말고, 오래 두고 사용할 수 있어 온라인 묶음 구매가 가능한지 판단하는 근거로만 사용하십시오.
- 상품명을 반복하거나 '상품명:' 접두어를 붙이지 마십시오.
- 구매조언은 명령형(~하세요, ~하십시오)이나 합쇼체(~습니다)를 쓰지 말고 한 문장의 자연스러운 해요체(~해요, ~좋아요, ~유리해요)로 작성하십시오.
- 구매조언에는 가격, 숫자, 할인율, 판매처 또는 마트/온라인 중 어디가 유리한지에 대한 판단을 넣지 마십시오. 구매 방향과 할인율은 서버가 계산합니다.`;
}

/** Gemini 3.8 Flash + Google Search로 한 페이지 분량의 마스터 팁을 생성합니다. */
export async function generateGeminiTipBatch(
  products: ParsedProduct[]
): Promise<GeminiTipBatchResult> {
  if (products.length === 0) {
    return {
      products: [],
      rejected: [],
      model: process.env.GEMINI_TIP_MODEL || DEFAULT_TIP_MODEL,
      groundingSources: 0,
    };
  }

  const apiKey = (process.env.GEMINI_TIP_API_KEY || '').trim();
  if (!apiKey) throw new Error('GEMINI_TIP_API_KEY가 설정되지 않았습니다.');

  const missingId = products.find((product) => !product.id);
  if (missingId) throw new Error(`'${missingId.productName}' 상품 ID가 없습니다.`);

  const model = (process.env.GEMINI_TIP_MODEL || DEFAULT_TIP_MODEL).trim();
  const ai = new GoogleGenAI({ apiKey });
  const interaction = await ai.interactions.create({
    model,
    input: buildPrompt(products),
    tools: [{ type: 'google_search' }],
    generation_config: {
      thinking_level: 'medium',
      max_output_tokens: 4096,
    },
    stream: false,
    store: false,
  });

  const responseText = interaction.output_text || '';
  const { searchQueries, citations } = countInteractionGrounding(
    interaction.steps as Array<{ type: string; [key: string]: unknown }> | undefined
  );
  if (searchQueries === 0) {
    console.warn(
      `[Gemini Batch] Grounding 검증 실패: searchQueries=${searchQueries}, citations=${citations}, response=${responseText.slice(0, 500)}`
    );
    throw new Error('Gemini가 Google Search를 실행하지 않았습니다.');
  }

  const evidenceById = parseEvidenceTsv(responseText);
  const pricedEvidenceCount = [...evidenceById.values()].filter(
    (evidence) => evidence.comparisonLevel !== 'NONE' && Boolean(evidence.sourceUrl)
  ).length;
  if (evidenceById.size === 0) {
    console.warn(
      `[Gemini Batch] 유효한 출처 URL이 없습니다: searchQueries=${searchQueries}, citations=${citations}, response=${responseText.slice(0, 500)}`
    );
  }
  if (citations === 0 && pricedEvidenceCount > 0) {
    console.warn(
      `[Gemini Batch] URL citation annotation은 없지만 검색 실행과 TSV 출처 URL을 확인했습니다: searchQueries=${searchQueries}, urls=${pricedEvidenceCount}`
    );
  }

  const comparisonCounts = [...evidenceById.values()].reduce<Record<ComparisonLevel, number>>(
    (counts, evidence) => {
      counts[evidence.comparisonLevel || 'EXACT'] += 1;
      return counts;
    },
    { EXACT: 0, CLOSE: 0, CATEGORY: 0, NONE: 0 }
  );
  console.log(
    `[Gemini Batch] 비교 결과: EXACT=${comparisonCounts.EXACT}, CLOSE=${comparisonCounts.CLOSE}, CATEGORY=${comparisonCounts.CATEGORY}, NONE=${comparisonCounts.NONE}`
  );

  const groundingSources = citations || pricedEvidenceCount;
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
        tipSource: evidence.comparisonLevel === 'NONE' || !evidence.sourceUrl
          ? 'gemini_advice'
          : 'gemini_grounded',
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
