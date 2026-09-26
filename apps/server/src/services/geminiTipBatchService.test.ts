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
    expect(tip.tipMessage).toContain('마트가 동일 상품 판매가(쿠팡)보다');
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
    expect(tip.tipMessage).toContain('동일 상품 판매가(쿠팡)가 마트보다 20.0% 저렴');
    expect(tip.coupangKeyword).toBe('피자 파티세트');
  });

  it('단위 가격 차이가 10% 미만이면 비슷한 가격과 즉시 구매 장점을 안내한다', () => {
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
    expect(tip.tipMessage).toContain('2.9% 차이로 비슷');
    expect(tip.tipMessage).toContain('바로 구매');
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
    expect(tip.tipMessage).toContain('온라인 최저가가 25.0% 저렴하지만');
    expect(tip.tipMessage).toContain('가격보다 제품 특색');
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
    expect(tip.badgeText).toBe('온라인 최저가 유리');
    expect(tip.tipMessage).toContain('오늘 바로 필요한 소용량이 아니라면');
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
    expect(tip.tipMessage).toContain('필요한 만큼 바로 구매');
  });

  it('냉동식품의 온라인 최저가가 10% 이상 싸면 보관 장점과 함께 온라인을 추천한다', () => {
    const tip = buildGroundedSmartTip(product({
      productName: '하림 냉동 닭가슴살 찹스테이크 600g',
      effectiveUnitPrice: 8_990,
      unitMeasure: '1',
    }), {
      id: 'product-1',
      onlinePrice: 6_280,
      onlineUnitPrice: 6_280,
      retailer: '온라인 행사몰',
      matchedProduct: '하림 닭가슴살 찹스테이크 600g',
      insightType: 'STANDARD',
      reason: '현재 공개 프로모션 가격',
      sourceUrl: 'https://example.com/product',
    });

    expect(tip.tipType).toBe('COUPANG_TIP');
    expect(tip.tipMessage).toContain('동일 상품 판매가(온라인 행사몰)');
    expect(tip.tipMessage).toContain('냉동 보관 가능한 상품');
    expect(tip.tipMessage).not.toContain('1당');
  });

  it('검증된 Gemini 구매 조언을 서버가 계산한 가격 문장 뒤에 붙인다', () => {
    const tip = buildGroundedSmartTip(product({ effectiveUnitPrice: 10_000 }), {
      id: 'product-1',
      onlinePrice: 8_000,
      onlineUnitPrice: 8_000,
      retailer: '행사몰',
      matchedProduct: '피자 파티세트 1세트',
      insightType: 'STANDARD',
      reason: '동일 규격 상품',
      sourceUrl: 'https://example.com/product',
      tipCopy: '여럿이 나눠 먹는 간편한 식사로 활용하기 좋아요.',
    });

    expect(tip.tipMessage).toContain('행사몰');
    expect(tip.tipMessage).toContain('20.0% 저렴');
    expect(tip.tipMessage).toContain('여럿이 나눠 먹는 간편한 식사로 활용하기 좋아요.');
  });

  it('동급 냉동 상품이 더 저렴하면 보관 장점과 함께 온라인을 추천한다', () => {
    const tip = buildGroundedSmartTip(product({
      productName: '냉동 닭가슴살 찹스테이크',
      effectiveUnitPrice: 1_500,
      unitMeasure: '100g',
    }), {
      id: 'product-1',
      comparisonLevel: 'CLOSE',
      onlinePrice: 6_000,
      onlineUnitPrice: 1_000,
      retailer: '온라인몰',
      matchedProduct: '동급 냉동 닭가슴살 600g',
      insightType: 'STANDARD',
      productTrait: 'FROZEN',
      reason: '같은 용도의 냉동 닭가슴살 제품',
      sourceUrl: 'https://example.com/product',
      tipCopy: '냉동실에 두고 필요한 만큼 조리하기 편해요.',
    });

    expect(tip.tipType).toBe('COUPANG_TIP');
    expect(tip.tipMessage).toContain('동급 비교상품(온라인몰)');
    expect(tip.tipMessage).toContain('33.3% 저렴');
    expect(tip.tipMessage).toContain('냉동실에 두고 필요한 만큼 조리하기 편해요.');
  });

  it('CATEGORY 비교는 정밀 할인율을 노출하지 않는다', () => {
    const tip = buildGroundedSmartTip(product({
      productName: '국산콩 양조간장',
      effectiveUnitPrice: 900,
      unitMeasure: '100ml',
    }), {
      id: 'product-1',
      comparisonLevel: 'CATEGORY',
      onlinePrice: 7_000,
      onlineUnitPrice: 700,
      retailer: '온라인몰',
      matchedProduct: '프리미엄 양조간장',
      insightType: 'STANDARD',
      productTrait: 'LONG_KEEPING',
      reason: '같은 용도의 프리미엄 양조간장',
      sourceUrl: 'https://example.com/product',
    });

    expect(tip.tipType).toBe('COUPANG_TIP');
    expect(tip.tipMessage).toContain('동급 비교상품');
    expect(tip.tipMessage).not.toContain('%');
    expect(tip.tipMessage).toContain('보관이 쉬운 상품');
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
