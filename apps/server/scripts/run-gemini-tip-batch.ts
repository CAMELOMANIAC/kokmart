import {
  claimPendingGeminiTipBatch,
  completeGeminiTipProducts,
  retryGeminiTipProducts,
} from '../src/services/supabaseService.js';
import { generateGeminiTipBatch } from '../src/services/geminiTipBatchService.js';

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

      if (result.products.length > 0) {
        await completeGeminiTipProducts(result.products, result.model);
        completed += result.products.length;
      }

      if (result.rejected.length > 0) {
        const claimedById = new Map(claimed.map((item) => [item.product.id, item]));
        for (const item of result.rejected) {
          const claimedItem = claimedById.get(item.product.id);
          if (!claimedItem) continue;
          await retryGeminiTipProducts([claimedItem], item.error, 1_000, maxAttempts);
          console.warn(`[Gemini Batch] 재시도 예약: ${item.product.productName} - ${item.error}`);
        }
        rejected += result.rejected.length;
      }

      console.log(
        `[Gemini Batch] 저장 완료: completed=${result.products.length}, rejected=${result.rejected.length}, groundingSources=${result.groundingSources}`
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
