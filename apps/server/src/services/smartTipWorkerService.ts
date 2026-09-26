import { generateSmartTipBatchStrict } from './smartTipService.js';
import {
  claimPendingTipProducts,
  completeTipProducts,
  retryTipProducts,
} from './supabaseService.js';
import { parse429Error } from '../utils/rateLimiter.js';

export interface SmartTipWorkerResult {
  claimed: number;
  completed: number;
  retried: number;
  failed: number;
  model?: string;
  remainingTokens?: number;
  resetTokens?: string;
  error?: string;
}

function readPositiveInt(rawValue: string | undefined, fallback: number, max: number): number {
  const value = Number.parseInt(rawValue || '', 10);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(value, max);
}

/**
 * DB 큐에서 한 배치만 처리합니다. Cron 호출 안에서는 sleep이나 자체 재시도를 하지 않습니다.
 */
export async function runSmartTipWorker(): Promise<SmartTipWorkerResult> {
  // 상품별 검색 근거와 결과를 독립적으로 검증하기 위해 한 번에 한 상품만 처리합니다.
  const batchSize = readPositiveInt(process.env.TIP_WORKER_BATCH_SIZE, 1, 1);
  const maxAttempts = readPositiveInt(process.env.TIP_WORKER_MAX_ATTEMPTS, 5, 20);
  const claimed = await claimPendingTipProducts(batchSize);

  if (claimed.length === 0) {
    return { claimed: 0, completed: 0, retried: 0, failed: 0 };
  }

  try {
    const generation = await generateSmartTipBatchStrict(claimed.map((item) => item.product));
    await completeTipProducts(generation.products, generation.model);
    return {
      claimed: claimed.length,
      completed: generation.products.length,
      retried: 0,
      failed: 0,
      model: generation.model,
      remainingTokens: generation.remainingTokens,
      resetTokens: generation.resetTokens,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const { is429, retryAfterMs } = parse429Error(error);
    const highestAttempt = Math.max(...claimed.map((item) => item.attempts));
    const exponentialDelayMs = Math.min(15 * 60_000, Math.pow(2, Math.max(0, highestAttempt - 1)) * 60_000);
    const delayMs = is429 && retryAfterMs ? retryAfterMs + 1_000 : exponentialDelayMs;

    await retryTipProducts(claimed, errorMessage, delayMs, maxAttempts);

    const failed = claimed.filter((item) => item.attempts >= maxAttempts).length;
    return {
      claimed: claimed.length,
      completed: 0,
      retried: claimed.length - failed,
      failed,
      error: errorMessage,
    };
  }
}
