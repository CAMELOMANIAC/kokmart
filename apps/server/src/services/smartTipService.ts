import { Groq } from 'groq-sdk';
import { ParsedProduct, SmartTip, TipType } from '@kokmart/shared';
import { GroqRateLimiter, parse429Error } from '../utils/rateLimiter.js';

/** 모듈 레벨 싱글턴 — 모든 청크가 하나의 예산 풀을 공유 */
const rateLimiter = new GroqRateLimiter();

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
 * 상품명 기반 식품 카테고리 판별
 * isPerishable만으로는 인스턴트/냉동식품을 구분 못하므로 상품명 키워드로 보완
 */
type FoodCategory = 'FRESH' | 'INSTANT_FOOD' | 'BULK_HOUSEHOLD' | 'GENERAL';

const INSTANT_FOOD_KEYWORDS = [
  '피자', '짬뽕', '라면', '라멘', '우동', '만두', '볶음밥', '냉동', '즉석',
  '컵밥', '컵면', '핫도그', '너겟', '치킨', '탕', '찌개', '국', '스프',
  '카레', '떡볶이', '어묵', '소시지', '햄', '베이컨', '동그랑땡', '돈까스',
  '돈카츠', '튀김', '교자', '딤섬', '팬케이크', '와플', '토스트', '샌드위치',
  '도시락', '덮밥', '비빔밥', '죽', '누들', '파스타', '스파게티',
];

const BULK_HOUSEHOLD_KEYWORDS = [
  '세제', '섬유유연제', '샴푸', '린스', '바디워시', '치약', '칫솔',
  '화장지', '휴지', '키친타올', '물티슈', '기저귀', '생리대',
  '세탁', '주방세제', '락스', '방향제', '탈취제',
];

function detectFoodCategory(product: ParsedProduct): FoodCategory {
  if (product.isPerishable) return 'FRESH';

  const name = product.productName;
  if (INSTANT_FOOD_KEYWORDS.some((kw) => name.includes(kw))) return 'INSTANT_FOOD';
  if (BULK_HOUSEHOLD_KEYWORDS.some((kw) => name.includes(kw))) return 'BULK_HOUSEHOLD';
  return 'GENERAL';
}

/**
 * 기본 스마트 팁 Fallback 생성 함수
 * 상품명 키워드 기반 4단계 카테고리로 세분화
 */
export function generateDefaultTip(product: ParsedProduct): SmartTip {
  const category = detectFoodCategory(product);

  switch (category) {
    case 'FRESH':
      return {
        tipType: 'MART_RECOMMEND',
        badgeText: '마트 현장 추천',
        tipMessage: `${product.productName}은(는) 신선도가 중요한 상품이에요. 직접 보고 골라 담는 마트 구매를 추천합니다.`,
        coupangKeyword: null,
      };

    case 'INSTANT_FOOD':
      return {
        tipType: 'MART_RECOMMEND',
        badgeText: '마트 행사 추천',
        tipMessage: `${product.productName} — 마트 행사가 ${product.salePrice.toLocaleString()}원을 쿠팡 가격과 비교해 보세요.`,
        coupangKeyword: product.productName,
      };

    case 'BULK_HOUSEHOLD':
      return {
        tipType: 'COUPANG_BULK',
        badgeText: '대용량 알뜰 팁',
        tipMessage: `${product.productName}은(는) 쿠팡 대용량 묶음이 단가 기준 더 저렴할 수 있어요. 비교해 보세요.`,
        coupangKeyword: `${product.productName} 대용량`,
      };

    default:
      return {
        tipType: 'MART_RECOMMEND',
        badgeText: '마트 추천',
        tipMessage: `${product.productName} 행사가 ${product.salePrice.toLocaleString()}원 — 온라인 최저가와 비교해 보세요.`,
        coupangKeyword: product.productName,
      };
  }
}

/**
 * Groq GPT-OSS-20B API + browser_search 도구를 활용한 실시간 가격 비교 및 스마트 팁 생성
 *
 * 1) Groq 내장 웹 브라우징(browser_search)으로 온라인/쿠팡 실시간 단가 교차 검증
 * 2) 신선식품/공산품 불문, 마트 전단가가 비싸면 COUPANG_TIP 추천
 * 3) 진짜 저렴하면 MART_BEST, 대용량 메리트가 크면 COUPANG_BULK 추천
 */
/**
 * TSV 텍스트를 SmartTip 맵으로 파싱
 * 헤더: id\ttipType\tbadgeText\ttipMessage\tcoupangKeyword
 */
function parseTipTsv(rawText: string): Map<string, SmartTip> {
  const result = new Map<string, SmartTip>();
  if (!rawText || !rawText.trim()) return result;

  const cleaned = stripMarkdownFences(rawText);
  const lines = cleaned.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line || line.startsWith('#')) continue;

    // 헤더 행 건너뛰기
    if (i === 0 && (line.includes('id') || line.includes('tipType') || line.includes('badgeText'))) {
      continue;
    }

    const cols = line.split('\t').map((c) => c.trim());
    if (cols.length < 4) continue;

    const id = cols[0];
    const rawTipType = cols[1];
    const badgeText = cols[2];
    const tipMessage = cols[3];
    const coupangKeyword = cols[4] || null;

    if (
      rawTipType !== 'MART_BEST' &&
      rawTipType !== 'MART_RECOMMEND' &&
      rawTipType !== 'COUPANG_TIP' &&
      rawTipType !== 'COUPANG_BULK'
    ) continue;
    const tipType: TipType = rawTipType;

    if (id && badgeText && tipMessage) {
      result.set(id, {
        tipType,
        badgeText,
        tipMessage,
        coupangKeyword:
          coupangKeyword && coupangKeyword !== 'null' && coupangKeyword !== '-' ? coupangKeyword : null,
      });
    }
  }

  return result;
}

const FALLBACK_MESSAGE_FRAGMENTS = [
  '신선도가 중요한 상품이에요',
  '직접 보고 골라 담는 마트 구매를 추천합니다',
  '쿠팡 가격과 비교해 보세요',
  '쿠팡 대용량 묶음이 단가 기준 더 저렴할 수 있어요',
  '온라인 최저가와 비교해 보세요',
];

/** Groq 검색 결과가 실제 가격 비교 결과인지 저장 전에 검증합니다. */
export function validateGroundedTip(product: ParsedProduct, tip: SmartTip): void {
  if (FALLBACK_MESSAGE_FRAGMENTS.some((fragment) => tip.tipMessage.includes(fragment))) {
    throw new Error(`Groq가 '${product.productName}'에 폴백 문구를 반환했습니다.`);
  }

  const wonAmounts = Array.from(tip.tipMessage.matchAll(/([0-9][0-9,]*)\s*원/g), (match) =>
    Number(match[1]?.replaceAll(',', ''))
  ).filter(Number.isFinite);

  if (wonAmounts.length < 2) {
    throw new Error(`Groq의 '${product.productName}' 팁에 비교 가격이 2개 이상 포함되지 않았습니다.`);
  }

  const salePrice = Math.round(Number(product.salePrice));
  if (!wonAmounts.includes(salePrice)) {
    throw new Error(`Groq의 '${product.productName}' 팁에 마트 행사가 ${salePrice}원이 포함되지 않았습니다.`);
  }
  if (wonAmounts.every((amount) => amount === salePrice)) {
    throw new Error(`Groq가 '${product.productName}'의 온라인 가격을 마트 행사가와 동일하게 복사했습니다.`);
  }
}

/**
 * 압축된 시스템 프롬프트 (~200 토큰)
 * 캐싱 극대화를 위해 모듈 상수로 추출 — 모든 청크에서 동일 문자열 재사용
 * (Groq은 동일 시스템 프롬프트의 캐시된 토큰을 TPM에서 제외)
 */
const SYSTEM_PROMPT = `당신은 마트 vs 쿠팡/온라인 실시간 최저가 비교 분석관입니다.
신선식품, 가공식품(라면/피자/냉동식품 등), 공산품/생필품(세제/샴푸/화장지 등) 구분 없이 모든 상품에 대해 browser_search로 쿠팡/온라인 가격을 검색하고 마트 행사가격과 단가를 정밀 대조하십시오.

[출력 절대 규칙]
1. 어떠한 자연어 생각/독백도 금지합니다. 오직 순수 TSV 텍스트만 출력하십시오.
2. 팁 메시지(tipMessage) 안에 탭(\\t)이나 줄바꿈 문자를 절대 넣지 마십시오.
3. [tipMessage 필수 포맷] 신선/공산/가공식품 불문, 반드시 구체적 수치(원, %)를 포함해 아래 둘 중 하나로 작성하십시오:
   - 마트가 쌀 때: "마트 가격 {마트가}원은 쿠팡 최저가 {쿠팡가}원보다 {차액}원({할인율}%) 저렴합니다."
   - 쿠팡이 쌀 때: "쿠팡 가격 {쿠팡가}원이 마트 행사가 {마트가}원보다 {차액}원({할인율}%) 더 저렴합니다."
   - 가격이 비슷할 때: "마트 가격 {마트가}원은 온라인 최저가({온라인가}원)와 유사한 수준입니다."
   절대 "오래 쓰는 공산품은...", "소량 신선 구매는..." 같은 추상적 멘트를 쓰지 마십시오!
[TSV 헤더]
id\ttipType\tbadgeText\ttipMessage\tcoupangKeyword

[tipType 4대 분류 기준]
- MART_BEST: 마트 가격이 온라인/쿠팡보다 20% 이상 확실히 저렴한 파격 특가 (badgeText: "마트 필구 특가", coupangKeyword: null)
- MART_RECOMMEND: 마트 가격이 쿠팡과 비슷하거나 조금 더 저렴하여 마트 구매가 합리적인 경우 (badgeText: "마트 현장 추천", coupangKeyword: null)
- COUPANG_TIP: 쿠팡이 마트보다 확실히 더 저렴한 경우 (badgeText: "쿠팡 최저가 알뜰", coupangKeyword: "상품명")
- COUPANG_BULK: 대용량 묶음 구매 시 쿠팡 단가가 훨씬 유리한 공산품/생필품 (badgeText: "쿠팡 대용량 특가", coupangKeyword: "상품명 대용량")`;

function buildProductPrompt(products: ParsedProduct[]): string {
  const productLines = products
    .map((p) => {
      const cat = detectFoodCategory(p);
      const catLabel =
        cat === 'FRESH'
          ? '신선'
          : cat === 'INSTANT_FOOD'
            ? '가공식품'
            : cat === 'BULK_HOUSEHOLD'
              ? '생필품'
              : '일반';
      return `${p.id || 'p'}\t${p.martName || '마트'}\t${p.productName}\t${p.salePrice}\t${p.effectiveUnitPrice}원/${p.unitMeasure}\t${catLabel}`;
    })
    .join('\n');

  return `id\t마트\t상품명\t행사가\t단가\t구분\n${productLines}`;
}

function mapStrictTips(products: ParsedProduct[], responseText: string): ParsedProduct[] {
  const tipMap = parseTipTsv(responseText);

  return products.map((product) => {
    if (!product.id) {
      throw new Error(`'${product.productName}' 상품 ID가 없어 Groq 응답을 안전하게 매핑할 수 없습니다.`);
    }
    const tip = tipMap.get(product.id);
    if (!tip) {
      throw new Error(`Groq 응답에서 '${product.productName}' 팁이 누락되었습니다.`);
    }
    validateGroundedTip(product, tip);
    return {
      ...product,
      smartTip: tip,
      tipStatus: 'complete' as const,
      tipSource: 'groq_grounded' as const,
    };
  });
}

/**
 * 비동기 worker용 단일 Groq 호출입니다.
 * 대기/재시도/fallback을 수행하지 않고 실패를 호출자에게 전달합니다.
 */
export async function generateSmartTipBatchStrict(products: ParsedProduct[]): Promise<{
  products: ParsedProduct[];
  model: string;
  remainingTokens?: number;
  resetTokens?: string;
}> {
  if (products.length === 0) {
    return { products: [], model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b' };
  }

  const apiKey = process.env.GROQ_API_KEY || '';
  if (!apiKey) throw new Error('GROQ_API_KEY가 설정되지 않았습니다.');

  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
  const groq = new Groq({ apiKey });
  const request = groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildProductPrompt(products) },
    ],
    tools: [{ type: 'browser_search' as unknown as 'function' }],
    tool_choice: 'required',
    temperature: 0.2,
    reasoning_effort: 'low',
    reasoning_format: 'hidden',
    max_completion_tokens: 1024,
  });

  const { data: completion, response } = await request.withResponse();
  const choice = completion.choices[0];
  if (!choice) throw new Error('Groq가 응답 choice를 반환하지 않았습니다.');
  if (choice.finish_reason === 'length') {
    throw new Error('Groq 응답이 max_completion_tokens 제한으로 잘렸습니다.');
  }

  const responseText = choice.message?.content || '';
  if (!responseText.trim()) throw new Error('Groq가 빈 팁 응답을 반환했습니다.');

  const executedTools = choice.message?.executed_tools || [];
  const searchEvidenceCount = executedTools.reduce(
    (count, tool) =>
      count + (tool.browser_results?.length || 0) + (tool.search_results?.results?.length || 0),
    0
  );
  if (searchEvidenceCount === 0) {
    throw new Error('Groq browser_search가 검증 가능한 검색 결과를 반환하지 않았습니다.');
  }

  const usage = completion.usage;
  const cachedTokens = usage?.prompt_tokens_details?.cached_tokens || 0;
  const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens || 0;
  const remainingHeader = response.headers.get('x-ratelimit-remaining-tokens');
  const remainingTokens = remainingHeader === null ? undefined : Number(remainingHeader);
  const resetTokens = response.headers.get('x-ratelimit-reset-tokens') || undefined;

  console.log(
    `[Smart Tip Worker] model=${model} products=${products.length} searchEvidence=${searchEvidenceCount} total=${usage?.total_tokens ?? 'unknown'} reasoning=${reasoningTokens} cached=${cachedTokens} remaining=${remainingTokens ?? 'unknown'} reset=${resetTokens ?? 'unknown'}`
  );

  return {
    products: mapStrictTips(products, responseText),
    model,
    remainingTokens: Number.isFinite(remainingTokens) ? remainingTokens : undefined,
    resetTokens,
  };
}

/**
 * Groq API + browser_search 도구를 활용한 실시간 온라인 최저가 비교 및 스마트 팁 생성
 *
 * 1) Groq 내장 웹 브라우징(browser_search)으로 온라인/쿠팡 실시간 단가 교차 검증
 * 2) batchSize: 8, concurrency: 1 (직렬) + 레이트 리미터로 TPM 초과 방지
 * 3) TSV 포맷 입출력으로 토큰 소비 최소화
 */
export async function generateSmartTips(
  products: ParsedProduct[],
  batchSize = 8,
  concurrency = 1
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
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
  const updatedProducts: ParsedProduct[] = [...products];

  // 1. 청크 분할 (8개 단위 배치로 API 호출 횟수 최소화)
  const chunks: ParsedProduct[][] = [];
  for (let i = 0; i < products.length; i += batchSize) {
    chunks.push(products.slice(i, i + batchSize));
  }

  const startTime = Date.now();
  console.log(
    `[Smart Tips Grounding] 🌐 Starting real-time search grounding for ${products.length} products (${chunks.length} chunks, concurrency: ${concurrency}, model: ${model})...`
  );

  // 2. 단일 청크 처리 서브루틴 (레이트 리미터 + 429 재시도 포함)
  async function processChunk(
    chunk: ParsedProduct[],
    chunkNum: number,
    totalChunks: number
  ): Promise<Map<string, SmartTip>> {
    const chunkStartTime = Date.now();

    console.log(
      `[Smart Tips Grounding] 🔍 Searching real-time prices for chunk ${chunkNum}/${totalChunks} (${chunk.length} products)...`
    );

    // 초축약 TSV 입력 포맷 (~25 토큰/상품, 세분화 카테고리 적용)
    const userPrompt = buildProductPrompt(chunk);

    // 예상 토큰 추정 (시스템+유저+browser_search 결과+응답)
    const estimatedTotalTokens = 200 + chunk.length * 30 + 500 + chunk.length * 50;

    // 429 자동 재시도 루프
    for (let attempt = 0; attempt <= rateLimiter.maxRetries; attempt++) {
      try {
        // 레이트 리미터: 예산 확인 및 필요 시 대기
        await rateLimiter.waitForBudget(estimatedTotalTokens);

        const completion = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          tools: [
            {
              type: 'browser_search' as unknown as 'function',
            },
          ],
          temperature: 0.2,
          reasoning_effort: 'low',
          max_completion_tokens: 1024,
        });

        // 사용량 기록 (TPM 예산 차감)
        const totalUsed = completion.usage?.total_tokens ?? estimatedTotalTokens;
        rateLimiter.recordUsage(totalUsed);

        const responseText = completion.choices[0]?.message?.content || '';
        const chunkTipMap = parseTipTsv(responseText);

        // 누락된 상품이 있을 경우 순서 매핑 또는 기본 팁으로 보완
        for (let idx = 0; idx < chunk.length; idx++) {
          const prod = chunk[idx];
          if (prod && prod.id && !chunkTipMap.has(prod.id)) {
            // TSV id가 약간 달라졌거나 누락된 경우 순서 매핑 시도
            const keys = Array.from(chunkTipMap.keys());
            if (keys[idx] && chunkTipMap.has(keys[idx])) {
              chunkTipMap.set(prod.id, chunkTipMap.get(keys[idx])!);
            } else {
              chunkTipMap.set(prod.id, generateDefaultTip(prod));
            }
          }
        }

        const chunkElapsedSec = ((Date.now() - chunkStartTime) / 1000).toFixed(2);
        console.log(
          `[Smart Tips Grounding] ⏱️ Chunk ${chunkNum}/${totalChunks} finished in ${chunkElapsedSec}s (${chunkTipMap.size} tips, ${totalUsed} tokens used).`
        );
        return chunkTipMap;
      } catch (error: unknown) {
        const { is429, retryAfterMs } = parse429Error(error);

        if (is429 && attempt < rateLimiter.maxRetries) {
          const backoffMs = rateLimiter.calculateBackoff(attempt, retryAfterMs);
          console.warn(
            `[Smart Tips Grounding] ⚠️ 429 Rate Limit on chunk ${chunkNum}/${totalChunks} (attempt ${attempt + 1}/${rateLimiter.maxRetries}). Waiting ${(backoffMs / 1000).toFixed(1)}s...`
          );
          await new Promise<void>((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        // 429가 아니거나 재시도 횟수 초과 → fallback
        const errorMsg = error instanceof Error ? error.message : String(error);
        const chunkElapsedSec = ((Date.now() - chunkStartTime) / 1000).toFixed(2);
        console.error(
          `[Smart Tips Grounding Error] Chunk ${chunkNum}/${totalChunks} failed after ${chunkElapsedSec}s (attempt ${attempt + 1}):`,
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

    // 이론적으로 도달 불가하지만 타입 안정성을 위한 fallback
    const fallbackMap = new Map<string, SmartTip>();
    for (const prod of chunk) {
      if (prod.id) {
        fallbackMap.set(prod.id, generateDefaultTip(prod));
      }
    }
    return fallbackMap;
  }

  // 3. Concurrency 단위 처리 (기본 직렬, TPM 초과 방지)
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
