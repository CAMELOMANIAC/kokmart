/**
 * Groq API 토큰 레이트 리미터
 *
 * - 분당 토큰 예산(TPM) 추적 + 적응적 대기
 * - 429 에러 자동 재시도 (지수 백오프 + jitter)
 * - Groq 응답 헤더 기반 잔여 토큰 동기화
 */

interface RateLimiterConfig {
  /** 분당 토큰 한도 (기본: 8000) */
  tpmLimit: number;
  /** 최대 재시도 횟수 (기본: 3) */
  maxRetries: number;
  /** 기본 백오프 대기 ms (기본: 15000) */
  baseBackoffMs: number;
}

interface TokenBudgetState {
  remainingTokens: number;
  resetAtMs: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Groq API 분당 토큰 예산을 추적하고 429 에러를 자동 재시도하는 레이트 리미터
 */
export class GroqRateLimiter {
  private readonly config: RateLimiterConfig;
  private budget: TokenBudgetState;

  constructor(config?: Partial<RateLimiterConfig>) {
    const tpmEnv = process.env.GROQ_TPM_LIMIT;
    this.config = {
      tpmLimit: config?.tpmLimit ?? (tpmEnv ? parseInt(tpmEnv, 10) : 8000),
      maxRetries: config?.maxRetries ?? 3,
      baseBackoffMs: config?.baseBackoffMs ?? 15_000,
    };
    this.budget = {
      remainingTokens: this.config.tpmLimit,
      resetAtMs: Date.now() + 60_000,
    };
  }

  /**
   * API 호출 전 남은 토큰 예산을 확인하고, 부족하면 리셋 시점까지 자동 대기
   *
   * @param estimatedTokens - 이번 요청에서 소비할 것으로 예상되는 토큰 수
   */
  async waitForBudget(estimatedTokens: number): Promise<void> {
    const now = Date.now();

    // 리셋 시점이 지났으면 예산 갱신
    if (now >= this.budget.resetAtMs) {
      this.budget.remainingTokens = this.config.tpmLimit;
      this.budget.resetAtMs = now + 60_000;
    }

    // 예산이 부족하면 리셋까지 대기
    if (this.budget.remainingTokens < estimatedTokens) {
      const waitMs = Math.max(this.budget.resetAtMs - now, 1_000);
      console.log(
        `[RateLimiter] ⏳ 토큰 예산 부족 (남은: ${this.budget.remainingTokens}, 필요: ${estimatedTokens}). ${(waitMs / 1000).toFixed(1)}s 대기...`
      );
      await sleep(waitMs + 500); // 500ms 여유 버퍼
      this.budget.remainingTokens = this.config.tpmLimit;
      this.budget.resetAtMs = Date.now() + 60_000;
    }
  }

  /**
   * API 호출 완료 후 소비된 토큰을 예산에서 차감
   *
   * @param usedTokens - 실제 소비된 토큰 수 (usage.total_tokens)
   * @param headerRemaining - Groq 응답 헤더 x-ratelimit-remaining-tokens (선택)
   * @param headerResetMs - Groq 응답 헤더 x-ratelimit-reset-tokens 파싱값 (선택)
   */
  recordUsage(usedTokens: number, headerRemaining?: number, headerResetMs?: number): void {
    if (headerRemaining !== undefined) {
      // Groq 헤더가 있으면 서버 측 잔여량으로 동기화 (가장 정확)
      this.budget.remainingTokens = headerRemaining;
    } else {
      this.budget.remainingTokens = Math.max(0, this.budget.remainingTokens - usedTokens);
    }

    if (headerResetMs !== undefined && headerResetMs > 0) {
      this.budget.resetAtMs = Date.now() + headerResetMs;
    }

    console.log(
      `[RateLimiter] 📊 토큰 사용: ${usedTokens} | 남은 예산: ${this.budget.remainingTokens}/${this.config.tpmLimit}`
    );
  }

  /**
   * 429 에러 시 적절한 대기 시간을 계산
   *
   * @param retryCount - 현재까지의 재시도 횟수 (0-based)
   * @param retryAfterMs - Retry-After 헤더에서 파싱한 대기 시간 (선택)
   * @returns 대기해야 할 ms 값
   */
  calculateBackoff(retryCount: number, retryAfterMs?: number): number {
    if (retryAfterMs && retryAfterMs > 0) {
      // 서버가 알려준 대기 시간 사용 + 소량 jitter
      return retryAfterMs + Math.random() * 2_000;
    }

    // 지수 백오프 + jitter: 15s, 30s, 60s (+ random 0~3s)
    const exponentialMs = this.config.baseBackoffMs * Math.pow(2, retryCount);
    const jitter = Math.random() * 3_000;
    return Math.min(exponentialMs + jitter, 120_000); // 최대 2분
  }

  /** 최대 재시도 횟수를 반환 */
  get maxRetries(): number {
    return this.config.maxRetries;
  }
}

/**
 * Groq API 에러에서 429 여부와 Retry-After 정보를 추출
 */
export function parse429Error(error: unknown): { is429: boolean; retryAfterMs?: number } {
  if (!(error instanceof Error)) {
    return { is429: false };
  }

  const msg = error.message || '';
  const is429 = msg.includes('429') || msg.includes('rate_limit') || msg.includes('Rate limit');

  if (!is429) {
    return { is429: false };
  }

  const errorWithHeaders = error as Error & { headers?: Headers };
  const retryAfterHeader = errorWithHeaders.headers?.get?.('retry-after');
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return { is429: true, retryAfterMs: seconds * 1000 };
    }
  }

  // Retry-After 헤더가 없을 때 에러 메시지에서 대기 시간을 추출
  const retryMatch = msg.match(/try again in (\d+(?:\.\d+)?)(m?s)/i);
  let retryAfterMs: number | undefined;
  if (retryMatch) {
    const value = parseFloat(retryMatch[1]);
    const unit = retryMatch[2];
    retryAfterMs = unit === 'ms' ? value : value * 1000;
  }

  return { is429: true, retryAfterMs };
}
