import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  claimPendingTipProducts: vi.fn(),
  completeTipProducts: vi.fn(),
  retryTipProducts: vi.fn(),
  generateSmartTipBatchStrict: vi.fn(),
}));

vi.mock('./supabaseService.js', () => ({
  claimPendingTipProducts: mocks.claimPendingTipProducts,
  completeTipProducts: mocks.completeTipProducts,
  retryTipProducts: mocks.retryTipProducts,
}));

vi.mock('./smartTipService.js', () => ({
  generateSmartTipBatchStrict: mocks.generateSmartTipBatchStrict,
}));

import { runSmartTipWorker } from './smartTipWorkerService.js';

const product = {
  id: 'product-1',
  productName: '테스트 상품',
  salePrice: 1000,
  effectiveUnitPrice: 1000,
  unitMeasure: '1개',
  isPerishable: false,
};

describe('smartTipWorkerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TIP_WORKER_BATCH_SIZE;
    delete process.env.TIP_WORKER_MAX_ATTEMPTS;
  });

  it('대기 작업이 없으면 Groq를 호출하지 않는다', async () => {
    mocks.claimPendingTipProducts.mockResolvedValue([]);

    await expect(runSmartTipWorker()).resolves.toEqual({
      claimed: 0,
      completed: 0,
      retried: 0,
      failed: 0,
    });
    expect(mocks.generateSmartTipBatchStrict).not.toHaveBeenCalled();
  });

  it('생성된 팁을 완료 상태로 저장한다', async () => {
    const completedProduct = {
      ...product,
      tipSource: 'groq_grounded',
      smartTip: {
        tipType: 'MART_BEST',
        badgeText: '마트 필구 특가',
        tipMessage: '마트가 더 저렴합니다.',
        coupangKeyword: null,
      },
    };
    mocks.claimPendingTipProducts.mockResolvedValue([{ product, attempts: 1 }]);
    mocks.generateSmartTipBatchStrict.mockResolvedValue({
      products: [completedProduct],
      model: 'openai/gpt-oss-20b',
      remainingTokens: 7000,
    });
    mocks.completeTipProducts.mockResolvedValue(undefined);

    const result = await runSmartTipWorker();

    expect(mocks.completeTipProducts).toHaveBeenCalledWith(
      [completedProduct],
      'openai/gpt-oss-20b'
    );
    expect(result.completed).toBe(1);
    expect(result.remainingTokens).toBe(7000);
  });

  it('폴백 출처 상품은 완료 저장 단계에서 거부된 오류를 재시도 상태로 돌린다', async () => {
    mocks.claimPendingTipProducts.mockResolvedValue([{ product, attempts: 1 }]);
    mocks.generateSmartTipBatchStrict.mockResolvedValue({
      products: [{ ...product, tipSource: 'fallback', smartTip: { tipType: 'MART_RECOMMEND' } }],
      model: 'openai/gpt-oss-20b',
    });
    mocks.completeTipProducts.mockRejectedValue(new Error('Groq 검증 실패'));
    mocks.retryTipProducts.mockResolvedValue(undefined);

    const result = await runSmartTipWorker();

    expect(mocks.retryTipProducts).toHaveBeenCalled();
    expect(result.completed).toBe(0);
    expect(result.retried).toBe(1);
  });

  it('429 응답은 sleep 없이 DB 재시도 상태로 돌린다', async () => {
    const rateLimitError = Object.assign(new Error('429 rate_limit'), {
      headers: new Headers({ 'retry-after': '2' }),
    });
    mocks.claimPendingTipProducts.mockResolvedValue([{ product, attempts: 1 }]);
    mocks.generateSmartTipBatchStrict.mockRejectedValue(rateLimitError);
    mocks.retryTipProducts.mockResolvedValue(undefined);

    const result = await runSmartTipWorker();

    expect(mocks.retryTipProducts).toHaveBeenCalledWith(
      [{ product, attempts: 1 }],
      '429 rate_limit',
      3000,
      5
    );
    expect(result.retried).toBe(1);
    expect(result.completed).toBe(0);
  });
});
