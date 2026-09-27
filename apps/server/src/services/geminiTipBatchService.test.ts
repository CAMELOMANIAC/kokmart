import { describe, expect, it } from 'vitest';
import { ParsedProduct } from '@kokmart/shared';
import {
  buildGroundedSmartTip,
  buildVisionOnlySmartTip,
  generateGeminiTipBatch,
} from './geminiTipBatchService.js';

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
    expect(tip.tipMessage).toContain('70.3% 더 저렴');
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
    expect(tip.tipMessage).toContain('마트에서 바로 사기 좋아요');
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
    expect(tip.tipMessage).toContain('온라인 최저가가 25.0% 더 저렴하지만');
    expect(tip.tipMessage).toContain('가격보다 제품 특색');
    expect(tip.tipMessage).not.toContain('고급 치즈와 숙성 도우 사용');
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

  it('냉동식품의 온라인 최저가가 10% 이상 싸면 묶음 구매 판단과 함께 온라인을 추천한다', () => {
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
    expect(tip.tipMessage).toContain('온라인 묶음 구매');
    expect(tip.tipMessage).not.toMatch(/냉동 보관|보관하세요|조리/);
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
      tipCopy: '여럿이 먹을 양이라면 묶음 구성을 비교해 구매하기 좋아요.',
    });

    expect(tip.tipMessage).toContain('행사몰');
    expect(tip.tipMessage).toContain('20.0% 저렴');
    expect(tip.tipMessage).toContain('여럿이 먹을 양이라면 묶음 구성을 비교해 구매하기 좋아요.');
    expect(tip.tipMessage).not.toContain('피자 파티세트:');
  });

  it('세척·조리·보관 조언이 포함되어 있어도 문구를 폐기하지 않고 그대로 사용한다 (너무 엄격한 필터링 완화)', () => {
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
    expect(tip.tipMessage).toContain('33.3% 더 저렴');
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
    expect(tip.tipMessage).toContain('온라인 묶음 구성');
  });

  it('URL과 단위 가격이 없어도 평균 프로모션 가격 판정으로 완료한다', () => {
    const tip = buildGroundedSmartTip(product({ effectiveUnitPrice: 0, unitMeasure: '' }), {
      id: 'product-1',
      comparisonLevel: 'CATEGORY',
      onlinePrice: 0,
      onlineUnitPrice: 0,
      retailer: '온라인 판매처',
      matchedProduct: '동급 파티세트',
      insightType: 'STANDARD',
      productTrait: 'READY_TO_EAT',
      reason: '유사 구성의 행사 가격대를 검색함',
      sourceUrl: '',
      approximatePriceVerdict: 'MART_GOOD',
    });

    expect(tip.tipType).toBe('MART_RECOMMEND');
    expect(tip.badgeText).toBe('프로모션 가격대 적정');
    expect(tip.tipMessage).toBe('평균적인 프로모션 가격대와 비교해 구매하기 적합한 가격이에요.');
    expect(tip.tipMessage).not.toContain('%');
  });

  it('온라인/마트 가격 비율이 비정상 범위(<0.02 또는 >50)이면 에러를 던진다', () => {
    expect(() =>
      buildGroundedSmartTip(product({ effectiveUnitPrice: 10_000 }), {
        id: 'product-1',
        onlinePrice: 100,
        onlineUnitPrice: 100, // ratio 100 / 10000 = 0.01 < 0.02
        retailer: '쿠팡',
        matchedProduct: '파티세트',
        insightType: 'STANDARD',
        reason: '비정상 가격',
        sourceUrl: 'https://example.com/product',
      })
    ).toThrow('비정상 범위입니다.');

    expect(() =>
      buildGroundedSmartTip(product({ effectiveUnitPrice: 100 }), {
        id: 'product-1',
        onlinePrice: 10_000,
        onlineUnitPrice: 10_000, // ratio 10000 / 100 = 100 > 50
        retailer: '쿠팡',
        matchedProduct: '파티세트',
        insightType: 'STANDARD',
        reason: '비정상 가격',
        sourceUrl: 'https://example.com/product',
      })
    ).toThrow('비정상 범위입니다.');
  });

  it('approximatePriceVerdict가 SIMILAR인 경우 적절한 팁을 생성한다', () => {
    const tip = buildGroundedSmartTip(product({ effectiveUnitPrice: 0 }), {
      id: 'product-1',
      comparisonLevel: 'CATEGORY',
      onlinePrice: 0,
      onlineUnitPrice: 0,
      retailer: '온라인몰',
      matchedProduct: '동급 파티세트',
      insightType: 'STANDARD',
      reason: '유사 가격대 검색',
      sourceUrl: '',
      approximatePriceVerdict: 'SIMILAR',
    });

    expect(tip.tipType).toBe('MART_RECOMMEND');
    expect(tip.badgeText).toBe('프로모션 가격대 비슷');
    expect(tip.tipMessage).toContain('평균적인 프로모션 가격대와 비슷해');
  });

  it('approximatePriceVerdict가 ONLINE_GOOD이고 출처 URL 유무에 따라 팁 타입이 전환된다', () => {
    const tipWithUrl = buildGroundedSmartTip(product({ effectiveUnitPrice: 0, productName: '신선 딸기' }), {
      id: 'product-1',
      comparisonLevel: 'CATEGORY',
      onlinePrice: 0,
      onlineUnitPrice: 0,
      retailer: '쿠팡',
      matchedProduct: '동급 딸기',
      insightType: 'STANDARD',
      reason: '온라인이 더 쌈',
      sourceUrl: 'https://example.com/strawberry',
      approximatePriceVerdict: 'ONLINE_GOOD',
    });

    expect(tipWithUrl.tipType).toBe('COUPANG_TIP');
    expect(tipWithUrl.badgeText).toBe('온라인 가격대 참고');
    expect(tipWithUrl.coupangKeyword).toBe('신선 딸기');

    const tipWithoutUrl = buildGroundedSmartTip(product({ effectiveUnitPrice: 0, productName: '신선 딸기' }), {
      id: 'product-1',
      comparisonLevel: 'CATEGORY',
      onlinePrice: 0,
      onlineUnitPrice: 0,
      retailer: '온라인몰',
      matchedProduct: '동급 딸기',
      insightType: 'STANDARD',
      reason: '온라인이 더 쌈',
      sourceUrl: '',
      approximatePriceVerdict: 'ONLINE_GOOD',
    });

    expect(tipWithoutUrl.tipType).toBe('MART_RECOMMEND');
    expect(tipWithoutUrl.badgeText).toBe('온라인 가격대 참고');
    expect(tipWithoutUrl.coupangKeyword).toBeNull();
  });

  it('comparisonLevel이 CATEGORY이고 신선식품일 때 마트 구매를 권장한다', () => {
    const tip = buildGroundedSmartTip(
      product({ effectiveUnitPrice: 10_000, productName: '한돈 삼겹살', isPerishable: true }),
      {
        id: 'product-1',
        comparisonLevel: 'CATEGORY',
        onlinePrice: 8_000,
        onlineUnitPrice: 8_000,
        retailer: '온라인몰',
        matchedProduct: '수입 삼겹살',
        insightType: 'STANDARD',
        productTrait: 'FRESH',
        reason: '동급 신선육',
        sourceUrl: 'https://example.com/meat',
      }
    );

    expect(tip.tipType).toBe('MART_RECOMMEND');
    expect(tip.badgeText).toBe('가격대·신선도 비교');
    expect(tip.tipMessage).toContain('상태와 신선도를 직접 확인할 수 있는 마트 구매가 좋아요.');
  });

  it('martCheaper일 때 할인율 20% 이상이면 MART_BEST, 20% 미만이면 MART_RECOMMEND를 반환한다', () => {
    const tipBest = buildGroundedSmartTip(product({ effectiveUnitPrice: 7_000 }), {
      id: 'product-1',
      onlinePrice: 10_000,
      onlineUnitPrice: 10_000,
      retailer: '쿠팡',
      matchedProduct: '피자 파티세트',
      insightType: 'STANDARD',
      reason: '온라인이 30% 더 비쌈',
      sourceUrl: 'https://example.com/product',
    });

    expect(tipBest.tipType).toBe('MART_BEST');
    expect(tipBest.badgeText).toBe('마트 필구 특가');

    const tipRecommend = buildGroundedSmartTip(product({ effectiveUnitPrice: 8_500 }), {
      id: 'product-1',
      onlinePrice: 10_000,
      onlineUnitPrice: 10_000,
      retailer: '쿠팡',
      matchedProduct: '피자 파티세트',
      insightType: 'STANDARD',
      reason: '온라인이 15% 더 비쌈',
      sourceUrl: 'https://example.com/product',
    });

    expect(tipRecommend.tipType).toBe('MART_RECOMMEND');
    expect(tipRecommend.badgeText).toBe('마트 가격 메리트');
  });

  it('onlineCheaper이고 BULK_ONLINE 인사이트 타입이면 COUPANG_BULK 배지와 대용량 키워드를 반환한다', () => {
    const tip = buildGroundedSmartTip(product({ effectiveUnitPrice: 10_000, productName: '신라면' }), {
      id: 'product-1',
      onlinePrice: 7_000,
      onlineUnitPrice: 7_000,
      retailer: '쿠팡',
      matchedProduct: '신라면 30봉 묶음',
      insightType: 'BULK_ONLINE',
      reason: '온라인 대용량 할인',
      sourceUrl: 'https://example.com/ramen',
    });

    expect(tip.tipType).toBe('COUPANG_BULK');
    expect(tip.badgeText).toBe('온라인 대용량 유리');
    expect(tip.coupangKeyword).toBe('신라면 대용량');
  });
});

describe('generateGeminiTipBatch 예외 처리', () => {
  it('상품 목록이 빈 배열이면 빈 결과를 반환한다', async () => {
    const result = await generateGeminiTipBatch([]);
    expect(result.products).toEqual([]);
    expect(result.rejected).toEqual([]);
    expect(result.groundingSources).toBe(0);
  });

  it('GEMINI_TIP_API_KEY가 없으면 에러를 던진다', async () => {
    const originalApiKey = process.env.GEMINI_TIP_API_KEY;
    delete process.env.GEMINI_TIP_API_KEY;

    try {
      await expect(generateGeminiTipBatch([product()])).rejects.toThrow(
        'GEMINI_TIP_API_KEY가 설정되지 않았습니다.'
      );
    } finally {
      process.env.GEMINI_TIP_API_KEY = originalApiKey;
    }
  });

  it('상품 ID가 누락된 경우 에러를 던진다', async () => {
    const invalidProduct = product({ id: '' });
    await expect(generateGeminiTipBatch([invalidProduct])).rejects.toThrow('상품 ID가 없습니다.');
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
    expect(tip.tipMessage).toBe('필요한 만큼 사고 상태와 신선도를 직접 확인할 수 있는 마트 구매가 좋아요.');
    expect(tip.tipMessage).not.toContain('특선 홈파티 모둠회:');
    expect(tip.tipMessage).not.toContain('%');
    expect(tip.coupangKeyword).toBeNull();
  });

  it('비가격 팁도 상품명 접두어 없이 구매 조언만 제공한다', () => {
    const tip = buildVisionOnlySmartTip(product(), '냉장 보관하고 데워 드십시오');

    expect(tip.tipMessage).toBe('온라인에서 같은 구성을 찾기 어려워 전단 구성과 필요한 수량을 기준으로 구매하는 게 좋아요.');
    expect(tip.tipMessage).not.toMatch(/피자 파티세트:|냉장|보관|데워|드십시오/);
  });
});
