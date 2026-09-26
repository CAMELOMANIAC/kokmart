import { describe, expect, it } from 'vitest';
import { validateGroundedTip } from './smartTipService.js';

const product = {
  id: 'product-1',
  productName: '테스트 상품',
  salePrice: 1000,
  effectiveUnitPrice: 1000,
  unitMeasure: '1개',
  isPerishable: false,
};

describe('validateGroundedTip', () => {
  it('마트 행사가와 비교 가격이 들어간 팁을 허용한다', () => {
    expect(() =>
      validateGroundedTip(product, {
        tipType: 'MART_BEST',
        badgeText: '마트 필구 특가',
        tipMessage: '마트 가격 1,000원은 쿠팡 최저가 1,400원보다 400원(28%) 저렴합니다.',
        coupangKeyword: null,
      })
    ).not.toThrow();
  });

  it('기본 폴백 문구를 거부한다', () => {
    expect(() =>
      validateGroundedTip(product, {
        tipType: 'MART_RECOMMEND',
        badgeText: '마트 추천',
        tipMessage: '테스트 상품 행사가 1,000원 — 온라인 최저가와 비교해 보세요.',
        coupangKeyword: '테스트 상품',
      })
    ).toThrow('폴백 문구');
  });

  it('비교 가격이 부족한 일반 문구를 거부한다', () => {
    expect(() =>
      validateGroundedTip(product, {
        tipType: 'MART_RECOMMEND',
        badgeText: '마트 추천',
        tipMessage: '마트 가격은 1,000원입니다.',
        coupangKeyword: null,
      })
    ).toThrow('비교 가격이 2개 이상');
  });

  it('실제 마트 행사가가 없는 비교 문구를 거부한다', () => {
    expect(() =>
      validateGroundedTip(product, {
        tipType: 'COUPANG_TIP',
        badgeText: '쿠팡 최저가 알뜰',
        tipMessage: '쿠팡 가격 800원이 마트 행사가 900원보다 100원 더 저렴합니다.',
        coupangKeyword: '테스트 상품',
      })
    ).toThrow('마트 행사가 1000원');
  });

  it('온라인 가격을 마트 행사가와 똑같이 복사한 응답을 거부한다', () => {
    expect(() =>
      validateGroundedTip(product, {
        tipType: 'MART_RECOMMEND',
        badgeText: '마트 현장 추천',
        tipMessage: '마트 가격 1,000원은 온라인 최저가(1,000원)와 유사한 수준입니다.',
        coupangKeyword: null,
      })
    ).toThrow('동일하게 복사');
  });

});
