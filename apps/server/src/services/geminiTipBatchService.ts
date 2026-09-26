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
  const parsed = Number(raw.replaceAll(',', '').trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function parseSourceUrl(raw: string): string | null {
  const markdownUrl = raw.match(/\]\((https?:\/\/[^)\s]+)\)/i)?.[1];
  const plainUrl = raw.match(/https?:\/\/[^\s)\]]+/i)?.[0];
  return (markdownUrl || plainUrl || '').replace(/[.,;]+$/, '') || null;
}

function parseSafeTipCopy(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  const normalized = raw
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/^['"“”]+|['"“”]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (normalized.length < 8 || normalized.length > 120) return undefined;

  // 가격과 구매 방향은 서버만 결정합니다. 모델 문장에 관련 표현이 섞이면 기존 문구로 폴백합니다.
  if (/[0-9%₩$]|https?:\/\//i.test(normalized)) return undefined;
  if (/가격|최저가|할인|저렴|비싸|마트|온라인|쿠팡|판매처|배송비|구매처|추천/i.test(normalized)) {
    return undefined;
  }

  return /[.!?요다]$/.test(normalized) ? normalized : `${normalized}.`;
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
      onlinePrice,
      onlineUnitPrice,
      retailer,
      matchedProduct,
      insightType,
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
  const similar = percent < 10;
  const martCheaper = martUnitPrice < onlineUnitPrice && !similar;
  const onlineCheaper = onlineUnitPrice < martUnitPrice && !similar;
  const rawUnit = (product.unitMeasure || '').trim();
  const priceBasis = !rawUnit || /^(1|개|1개)$/.test(rawUnit)
    ? '동일 규격 기준'
    : rawUnit.endsWith('당')
      ? `${rawUnit} 기준`
      : `${rawUnit}당`;
  const percentage = percent.toFixed(1);
  const isFrozen = /냉동|아이스크림|냉동실/i.test(product.productName);
  const safeTipCopy = parseSafeTipCopy(evidence.tipCopy);
  const advice = (fallback: string): string => safeTipCopy || fallback;

  // 여러 현재 판매가 중 가장 낮은 비교 가격보다 마트가 쌀 때만 전단 가격 우위를 주장합니다.
  if (martCheaper) {
    return {
      tipType: percent >= 20 ? 'MART_BEST' : 'MART_RECOMMEND',
      badgeText: percent >= 20 ? '마트 필구 특가' : '마트 가격 메리트',
      tipMessage: `${product.productName}: ${priceBasis} 마트가 확인된 비교 최저가(${evidence.retailer})보다 ${percentage}% 저렴해 전단 행사 메리트가 확실해요.${safeTipCopy ? ` ${safeTipCopy}` : ''}`,
      coupangKeyword: null,
    };
  }

  if (similar) {
    if (product.isPerishable || evidence.insightType === 'FRESHNESS') {
      return {
        tipType: 'MART_RECOMMEND',
        badgeText: '가격 비슷·신선 확인',
        tipMessage: `${product.productName}: 확인된 비교 최저가(${evidence.retailer})와 ${percentage}% 차이로 비슷해요. ${advice('신선도를 직접 확인하고 바로 구매하기 좋습니다.')}`,
        coupangKeyword: null,
      };
    }

    if (isFrozen) {
      return {
        tipType: 'MART_RECOMMEND',
        badgeText: '가격 비슷·바로 구매',
        tipMessage: `${product.productName}: 확인된 비교 최저가(${evidence.retailer})와 ${percentage}% 차이로 비슷해요. ${advice('마트에서 바로 사고 냉동 보관해 두기 좋습니다.')}`,
        coupangKeyword: null,
      };
    }

    if (evidence.insightType === 'SMALL_PACK') {
      return {
        tipType: 'MART_RECOMMEND',
        badgeText: '소용량 간편 선택',
        tipMessage: `${product.productName}: 확인된 최저가와 가격 차이가 크지 않고 ${evidence.reason}. ${advice('필요한 만큼 바로 구매하기 좋아요.')}`,
        coupangKeyword: null,
      };
    }

    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '가격 비슷·바로 구매',
      tipMessage: `${product.productName}: 확인된 비교 최저가(${evidence.retailer})와 ${percentage}% 차이로 비슷해요. ${advice('배송을 기다리지 않고 바로 구매할 수 있습니다.')}`,
      coupangKeyword: null,
    };
  }

  if (onlineCheaper && isFrozen) {
    return {
      tipType: 'COUPANG_TIP',
      badgeText: '온라인 최저가 유리',
      tipMessage: `${product.productName}: ${priceBasis} 확인된 최저가(${evidence.retailer})가 마트보다 ${percentage}% 저렴해 온라인 주문이 유리해요. ${advice('냉동 보관 가능한 상품이라 온라인으로 여유 있게 주문하기 좋습니다.')}`,
      coupangKeyword: product.productName,
    };
  }

  if (onlineCheaper && (product.isPerishable || evidence.insightType === 'FRESHNESS')) {
    return {
      tipType: 'COUPANG_TIP',
      badgeText: '가격과 신선도 비교',
      tipMessage: `${product.productName}: 확인된 최저가(${evidence.retailer})가 ${percentage}% 저렴해요. 가격을 우선하면 온라인, 상태 확인과 당일 구매가 중요하면 마트가 적합합니다.${safeTipCopy ? ` ${safeTipCopy}` : ''}`,
      coupangKeyword: product.productName,
    };
  }

  if (onlineCheaper && evidence.insightType === 'PREMIUM') {
    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '프리미엄 선택',
      tipMessage: `${product.productName}: 온라인 최저가가 ${percentage}% 저렴하지만 ${evidence.reason}. ${advice('가격보다 제품 특색을 중시할 때 선택할 만해요.')}`,
      coupangKeyword: null,
    };
  }

  if (onlineCheaper) {
    return {
      tipType: evidence.insightType === 'BULK_ONLINE' ? 'COUPANG_BULK' : 'COUPANG_TIP',
      badgeText: evidence.insightType === 'BULK_ONLINE' ? '온라인 대용량 유리' : '온라인 최저가 유리',
      tipMessage: evidence.insightType === 'SMALL_PACK'
        ? `${product.productName}: ${priceBasis} 확인된 최저가(${evidence.retailer})가 ${percentage}% 저렴해 온라인 주문이 유리해요. ${advice('오늘 바로 필요한 소용량이 아니라면 온라인 구매가 경제적입니다.')}`
        : `${product.productName}: ${priceBasis} 확인된 최저가(${evidence.retailer})가 마트보다 ${percentage}% 저렴해 온라인 주문이 유리해요. ${advice('보관 공간과 필요한 수량을 확인한 뒤 주문하세요.')}`,
      coupangKeyword: evidence.insightType === 'BULK_ONLINE'
        ? `${product.productName} 대용량`
        : product.productName,
    };
  }

  throw new Error(`'${product.productName}'의 가격 비교 방향을 결정할 수 없습니다.`);
}

/** 온라인 동일 규격이 없는 상품에 가격을 꾸며내지 않고 비가격 구매 팁을 만듭니다. */
export function buildVisionOnlySmartTip(product: ParsedProduct, reason: string): SmartTip {
  const safeReason = reason.replace(/[\t\r\n]+/g, ' ').trim().slice(0, 80)
    || '온라인에서 동일한 구성과 규격을 확인하기 어려운 상품';

  if (product.isPerishable) {
    return {
      tipType: 'MART_RECOMMEND',
      badgeText: '신선 장보기',
      tipMessage: `${product.productName}: ${safeReason}. 매장에서 신선도와 실제 구성을 확인하고 구매하기 좋아요.`,
      coupangKeyword: null,
    };
  }

  return {
    tipType: 'MART_RECOMMEND',
    badgeText: '마트 구성 상품',
    tipMessage: `${product.productName}: ${safeReason}. 온라인 가격을 억지로 비교하기보다 전단의 구성과 필요한 수량을 확인해 보세요.`,
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

  return `아래 한국 마트 전단 상품 각각에 대해 Google Search를 실제로 수행하여 현재 누구나 구매 가능한 최저 판매가를 찾으십시오.
온라인몰뿐 아니라 쿠팡, 네이버쇼핑에 노출된 판매처, 이마트몰/롯데마트몰/홈플러스몰 등 다른 대형마트의 현재 공개 행사가도 비교하십시오.
상품의 용량/수량/규격이 다르면 반드시 마트의 단위 기준으로 환산하십시오. 검색 결과가 없거나 규격을 확실히 맞출 수 없으면 그 상품은 출력하지 마십시오.

[입력]
id\t마트\t상품명\t포장규격\t마트총가격\t마트환산단가\t환산기준
${rows}

[출력]
오직 다음 TSV만 출력하십시오. 설명, 마크다운, 탭이 포함된 문장을 추가하지 마십시오.
id\t온라인총가격\t마트단위로환산한온라인단위가격\t판매처\t검색결과상품명\t구매특성\t근거요약\t출처URL\t구매조언

[검증 규칙]
- 입력의 모든 상품을 개별 검색하고, 입력 id를 한 글자도 바꾸지 마십시오.
- 마트환산단가가 비어 있으면 판매가를 환산단가로 간주하지 말고 가격 할인율도 만들지 마십시오.
- 상품 하나당 Google Search 쿼리는 최대 3회만 수행하십시오. '상품명 용량 최저가', '상품명 용량 행사', '상품명 용량 마트몰'처럼 현재 행사 가격을 우선 탐색하십시오.
- 검색 결과와 판매 페이지에서 확인한 가격들을 비교한 뒤, 현재 누구나 적용받을 수 있는 공개 판매가 중 단위 가격이 가장 낮은 결과 하나만 출력하십시오.
- 정상가와 공개 행사가가 함께 보이면 반드시 현재 적용 중인 공개 행사가를 사용하고 정상가는 출력하지 마십시오.
- 별도 로그인이 없어도 누구나 받을 수 있는 즉시 할인·공개 프로모션은 포함하십시오.
- 특정 카드, 멤버십, 앱 전용, 정기구독, 첫 구매, 회원 전용 쿠폰가는 제외하십시오.
- 품절, 중고, 해외배송 상품은 제외하고 배송비는 총가격에 포함하십시오.
- 검색 요약에 과거 행사가만 보이고 판매 페이지에서 현재 가격을 확인할 수 없으면 제외하십시오.
- 입력 상품명이 '2종/3종/택1' 또는 슬래시로 묶인 행사라면, 실제 구성 중 하나와 브랜드·맛·용량이 정확히 일치하는 후보만 출력하고 근거요약에 비교한 종류를 명시하십시오.
- 현재 최저가를 확정할 근거가 부족하면 정상가나 추정 가격으로 대신하지 말고 해당 상품을 출력하지 마십시오.
- 온라인총가격과 온라인단위가격은 쉼표나 원 기호 없는 양의 정수로 쓰십시오.
- 구매특성은 PRICE, PREMIUM, SMALL_PACK, FRESHNESS, BULK_ONLINE, STANDARD 중 하나만 쓰십시오.
- PREMIUM은 원재료, 품종, 제조법 등 확인 가능한 프리미엄 특성이 있을 때만 사용하십시오.
- SMALL_PACK은 온라인 비교 상품보다 실제 포장량이 작아 보관·즉시 섭취에 유리할 때만 사용하십시오.
- BULK_ONLINE은 온라인 상품이 더 큰 묶음이고 동일 단위 가격도 더 저렴할 때만 사용하십시오.
- 근거요약은 검색이나 상품명에서 확인한 객관적 특성 하나만 40자 이내로 작성하십시오. 막연한 품질 칭찬은 금지합니다.
- 출처URL은 실제 검색 결과의 http 또는 https URL이어야 합니다.
- 구매조언은 검색 결과, 상품명, 구매특성을 바탕으로 해당 상품에 어울리게 자연스러운 한국어 한 문장으로 작성하십시오.
- 구매조언에는 상품명, 가격, 숫자, 할인율, 판매처, 마트/온라인 중 어디가 유리한지에 대한 판단을 절대 넣지 마십시오. 가격 비교와 구매 방향은 서버가 계산합니다.
- 구매조언은 보관성, 신선도 확인, 소용량 편의, 대용량 활용, 조리·섭취 상황처럼 소비자가 실제로 활용할 수 있는 내용만 60자 이내로 쓰십시오. 모든 상품에 통용되는 막연한 칭찬은 금지합니다.`;
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
      thinking_level: 'low',
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
  if (evidenceById.size === 0) {
    console.warn(
      `[Gemini Batch] 유효한 출처 URL이 없습니다: searchQueries=${searchQueries}, citations=${citations}, response=${responseText.slice(0, 500)}`
    );
  }
  if (citations === 0 && evidenceById.size > 0) {
    console.warn(
      `[Gemini Batch] URL citation annotation은 없지만 검색 실행과 TSV 출처 URL을 확인했습니다: searchQueries=${searchQueries}, urls=${evidenceById.size}`
    );
  }

  const groundingSources = citations || evidenceById.size;
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
