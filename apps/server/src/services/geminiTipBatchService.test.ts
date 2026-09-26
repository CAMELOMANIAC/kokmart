import { describe, expect, it } from 'vitest';
import { ParsedProduct } from '@kokmart/shared';
import { buildGroundedSmartTip, buildVisionOnlySmartTip } from './geminiTipBatchService.js';

function product(overrides: Partial<ParsedProduct> = {}): ParsedProduct {
  return {
    id: 'product-1',
    productName: '피자 파티세트',
    salePrice: 7_980,
    effectiveUnitPrice: 7_980,
    unitMeasure: '1세트',
    isPerishable: false,
    martName: '이마트',
    ...overrides,
  };
}

describe('buildGroundedSmartTip', () => {
  it('온라인 총가격이 더 비싸면 마트가 저렴하다고 계산한다', () => {
    const tip = buildGroundedSmartTip(product(), {
      id: 'product-1',
      onlinePrice: 26_900,
      onlineUnitPrice: 26_900,
      retailer: '쿠팡',
      matchedProduct: '피자 파티세트 1세트',
      insightType: 'PRICE',
      reason: '동일 규격 온라인 가격 확인',
      sourceUrl: 'https://example.com/product',
    });

    expect(tip.tipType).toBe('MART_BEST');
    expect(tip.tipMessage).toContain('마트가 쿠팡보다');
    expect(tip.tipMessage).toContain('70.3% 저렴');
    expect(tip.coupangKeyword).toBeNull();
  });

  it('동일 단위 온라인 가격이 더 싸면 온라인 구매 팁을 만든다', () => {
    const tip = buildGroundedSmartTip(product({ effectiveUnitPrice: 10_000 }), {
      id: 'product-1',
      onlinePrice: 8_000,
      onlineUnitPrice: 8_000,
      retailer: '쿠팡',
      matchedProduct: '피자 파티세트 1세트',
      insightType: 'STANDARD',
      reason: '동일 규격 상품',
      sourceUrl: 'https://example.com/product',
    });

    expect(tip.tipType).toBe('COUPANG_TIP');
    expect(tip.tipMessage).toContain('쿠팡 쪽이 20.0% 더 저렴');
    expect(tip.coupangKeyword).toBe('피자 파티세트');
  });

  it('단위 가격 차이가 5% 미만이면 비슷한 가격으로 처리한다', () => {
    const tip = buildGroundedSmartTip(product({ effectiveUnitPrice: 10_000 }), {
      id: 'product-1',
      onlinePrice: 10_300,
      onlineUnitPrice: 10_300,
      retailer: '온라인몰',
      matchedProduct: '피자 파티세트',
      insightType: 'STANDARD',
      reason: '동일 규격 상품',
      sourceUrl: 'https://example.com/product',
    });

    expect(tip.tipType).toBe('MART_RECOMMEND');
    expect(tip.tipMessage).toContain('단가 차이가 크지 않아');
  });

  it('프리미엄 근거가 있으면 가격 대신 제품 가치를 설명한다', () => {
    const tip = buildGroundedSmartTip(product({ effectiveUnitPrice: 12_000 }), {
      id: 'product-1',
      onlinePrice: 9_000,
      onlineUnitPrice: 9_000,
      retailer: '쿠팡',
      matchedProduct: '일반 피자 세트',
      insightType: 'PREMIUM',
      reason: '고급 치즈와 숙성 도우 사용',
      sourceUrl: 'https://example.com/product',
    });

    expect(tip.tipType).toBe('MART_RECOMMEND');
    expect(tip.badgeText).toBe('프리미엄 선택');
    expect(tip.tipMessage).toContain('단가가 높더라도');
    expect(tip.tipMessage).toContain('고급 치즈와 숙성 도우 사용');
  });

  it('소용량이어도 온라인이 10% 이상 저렴하면 온라인 구매를 추천한다', () => {
    const tip = buildGroundedSmartTip(product({ effectiveUnitPrice: 12_000 }), {
      id: 'product-1',
      onlinePrice: 9_000,
      onlineUnitPrice: 9_000,
      retailer: '쿠팡',
      matchedProduct: '피자 파티세트 대용량',
      insightType: 'SMALL_PACK',
      reason: '1회 섭취 분량의 소포장',
      sourceUrl: 'https://example.com/product',
    });

    expect(tip.tipType).toBe('COUPANG_TIP');
    expect(tip.badgeText).toBe('온라인 가격 메리트');
    expect(tip.tipMessage).toContain('오늘 바로 먹을 소용량이 필요할 때만');
  });

  it('소용량이고 온라인 가격 차이가 10% 미만이면 마트 편의를 추천한다', () => {
    const tip = buildGroundedSmartTip(product({ effectiveUnitPrice: 10_000 }), {
      id: 'product-1',
      onlinePrice: 9_300,
      onlineUnitPrice: 9_300,
      retailer: '쿠팡',
      matchedProduct: '피자 파티세트 대용량',
      insightType: 'SMALL_PACK',
      reason: '1회 섭취 분량의 소포장',
      sourceUrl: 'https://example.com/product',
    });

    expect(tip.tipType).toBe('MART_RECOMMEND');
    expect(tip.badgeText).toBe('소용량 간편 선택');
    expect(tip.tipMessage).toContain('바로 먹기 좋아요');
  });
});

describe('buildVisionOnlySmartTip', () => {
  it('온라인 동일 상품이 없는 신선식품에 가격 없는 현장 팁을 만든다', () => {
    const tip = buildVisionOnlySmartTip(
      product({ productName: '특선 홈파티 모둠회', isPerishable: true }),
      '마트에서 당일 구성한 모둠회'
    );

    expect(tip.tipType).toBe('MART_RECOMMEND');
    expect(tip.badgeText).toBe('신선 장보기');
    expect(tip.tipMessage).toContain('마트에서 당일 구성한 모둠회');
    expect(tip.tipMessage).not.toContain('%');
    expect(tip.coupangKeyword).toBeNull();
  });
});
