import {
  ClaimedTipProduct,
  claimPendingGeminiTipBatch,
  completeGeminiTipProducts,
  getFlyerPageImageUrl,
  retryGeminiTipProducts,
  updateClaimedGeminiProductDetails,
} from '../src/services/supabaseService.js';
import {
  buildVisionOnlySmartTip,
  generateGeminiTipBatch,
  RejectedGeminiTipProduct,
} from '../src/services/geminiTipBatchService.js';
import { refineProductsFromFlyerWithGemini } from '../src/services/geminiService.js';

function readPositiveInt(name: string, fallback: number, max: number): number {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const status = (error as { status?: number } | null)?.status;
  return status === 429 || /429|rate.?limit|resource_exhausted|quota/i.test(message);
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`전단 원본 이미지 다운로드 실패: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

interface RepairRejectedResult {
  completed: number;
  rejected: number;
  apiCalls: number;
}

/** 검색 누락 상품을 무료 비전 모델로 교정하고, 비교 가능한 상품만 유료 검색을 한 번 더 수행합니다. */
async function repairRejectedProducts(
  rejectedProducts: RejectedGeminiTipProduct[],
  claimedById: Map<string | undefined, ClaimedTipProduct>,
  maxAttempts: number
): Promise<RepairRejectedResult> {
  const rejectedClaims = rejectedProducts
    .map((item) => claimedById.get(item.product.id))
    .filter((item): item is ClaimedTipProduct => Boolean(item));
  if (rejectedClaims.length === 0) return { completed: 0, rejected: 0, apiCalls: 0 };

  const first = rejectedClaims[0];
  const samePageClaims = rejectedClaims.filter(
    (item) => item.flyerId === first.flyerId
      && (item.product.pageIndex || 1) === (first.product.pageIndex || 1)
  );
  const pageIndex = first.product.pageIndex || 1;
  const imageUrl = await getFlyerPageImageUrl(first.flyerId, pageIndex);
  if (!imageUrl) throw new Error(`마스터 전단 ${pageIndex}페이지 원본 이미지 URL이 없습니다.`);

  console.log(`[Gemini Batch] 검색 누락 ${samePageClaims.length}개 상품 비전 재검증 시작`);
  const pageBuffer = await downloadImage(imageUrl);
  const refinements = await refineProductsFromFlyerWithGemini(
    pageBuffer,
    samePageClaims.map((item) => item.product)
  );
  const refinedById = new Map(refinements.map((item) => [item.product.id, item]));
  await updateClaimedGeminiProductDetails(refinements.map((item) => item.product));

  let completed = 0;
  let rejected = 0;
  let apiCalls = 0;

  const nonComparable = refinements.filter((item) => !item.onlineComparable);
  if (nonComparable.length > 0) {
    const visionCompleted = nonComparable.map(({ product, reason }) => ({
      ...product,
      smartTip: buildVisionOnlySmartTip(product, reason),
      tipStatus: 'complete' as const,
      tipSource: 'gemini_vision' as const,
      tipProcessor: 'gemini_batch' as const,
    }));
    await completeGeminiTipProducts(
      visionCompleted,
      process.env.GEMINI_VISION_MODEL || 'gemini-3.5-flash-lite'
    );
    completed += visionCompleted.length;
    console.log(`[Gemini Batch] 온라인 비교 불가 ${visionCompleted.length}개 상품을 비가격 팁으로 완료`);
  }

  const comparable = refinements.filter((item) => item.onlineComparable).map((item) => item.product);
  if (comparable.length > 0) {
    apiCalls += 1;
    console.log(`[Gemini Batch] 비전 교정된 ${comparable.length}개 상품 검색 재시도`);
    const retryResult = await generateGeminiTipBatch(comparable);
    if (retryResult.products.length > 0) {
      await completeGeminiTipProducts(retryResult.products, retryResult.model);
      completed += retryResult.products.length;
    }

    const retryClaimsById = new Map(samePageClaims.map((item) => [item.product.id, item]));
    for (const item of retryResult.rejected) {
      const claim = retryClaimsById.get(item.product.id);
      if (!claim) continue;
      await retryGeminiTipProducts([claim], item.error, 60_000, maxAttempts);
      rejected += 1;
      console.warn(`[Gemini Batch] 비전 교정 후에도 검색 근거 없음: ${item.product.productName}`);
    }
  }

  const missingRefinements = samePageClaims.filter((item) => !refinedById.has(item.product.id));
  for (const claim of missingRefinements) {
    const message = `Gemini Vision이 '${claim.product.productName}' 재검증 결과를 반환하지 않았습니다.`;
    await retryGeminiTipProducts([claim], message, 60_000, maxAttempts);
    rejected += 1;
    console.warn(`[Gemini Batch] 비전 재검증 누락: ${claim.product.productName}`);
  }

  return { completed, rejected, apiCalls };
}

async function main(): Promise<void> {
  const batchSize = readPositiveInt('GEMINI_TIP_BATCH_SIZE', 12, 15);
  const maxBatches = readPositiveInt('GEMINI_TIP_MAX_BATCHES', 16, 20);
  const maxAttempts = readPositiveInt('GEMINI_TIP_MAX_ATTEMPTS', 2, 5);
  let completed = 0;
  let rejected = 0;
  let apiCalls = 0;

  console.log(`[Gemini Batch] 시작: batchSize=${batchSize}, maxBatches=${maxBatches}, maxAttempts=${maxAttempts}`);

  for (let batchIndex = 0; batchIndex < maxBatches; batchIndex += 1) {
    const claimed = await claimPendingGeminiTipBatch(batchSize);
    if (claimed.length === 0) {
      console.log('[Gemini Batch] 지금 처리할 마스터 팁이 없습니다.');
      break;
    }

    const products = claimed.map((item) => item.product);
    const pageIndex = products[0]?.pageIndex || 1;
    console.log(`[Gemini Batch] ${batchIndex + 1}/${maxBatches}: page=${pageIndex}, products=${products.length}`);

    try {
      apiCalls += 1;
      const result = await generateGeminiTipBatch(products);
      let batchCompleted = result.products.length;
      let batchRejected = 0;

      if (result.products.length > 0) {
        await completeGeminiTipProducts(result.products, result.model);
        completed += result.products.length;
      }

      if (result.rejected.length > 0) {
        const claimedById = new Map(claimed.map((item) => [item.product.id, item]));
        try {
          const repaired = await repairRejectedProducts(result.rejected, claimedById, maxAttempts);
          completed += repaired.completed;
          rejected += repaired.rejected;
          apiCalls += repaired.apiCalls;
          batchCompleted += repaired.completed;
          batchRejected += repaired.rejected;
        } catch (repairError: unknown) {
          const repairMessage = repairError instanceof Error ? repairError.message : String(repairError);
          const rejectedClaims = result.rejected
            .map((item) => claimedById.get(item.product.id))
            .filter((item): item is ClaimedTipProduct => Boolean(item));
          await retryGeminiTipProducts(rejectedClaims, repairMessage, 60_000, maxAttempts);
          rejected += rejectedClaims.length;
          batchRejected += rejectedClaims.length;
          console.error(`[Gemini Batch] 비전 재검증 실패: ${repairMessage}`);
        }
      }

      console.log(
        `[Gemini Batch] 저장 완료: completed=${batchCompleted}, unresolved=${batchRejected}, initiallyMissing=${result.rejected.length}, groundingSources=${result.groundingSources}`
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const rateLimited = isRateLimitError(error);
      await retryGeminiTipProducts(
        claimed,
        message,
        rateLimited ? 12 * 60 * 60_000 : 1_000,
        maxAttempts
      );
      console.error(`[Gemini Batch] 호출 실패: ${message}`);

      if (rateLimited) {
        throw new Error('Gemini 일일/분당 할당량에 도달해 남은 배치를 중단했습니다. DB 작업은 retry로 보존했습니다.');
      }
    }
  }

  console.log(`[Gemini Batch] 종료: apiCalls=${apiCalls}, completed=${completed}, rejected=${rejected}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
