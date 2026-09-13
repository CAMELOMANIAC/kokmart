import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './useCartStore';
import type { ParsedProduct } from '@kokmart/shared';

const mockProductA: ParsedProduct = {
  id: 'p1',
  productName: '신선한 삼겹살 100g',
  salePrice: 2000,
  effectiveUnitPrice: 2000,
  unitMeasure: '100g',
  isPerishable: true,
  martName: '이마트',
  smartTip: {
    tipType: 'MART_BEST',
    badgeText: '마트 최저가',
    tipMessage: '특가',
    coupangKeyword: null
  }
};

const mockProductB: ParsedProduct = {
  id: 'p2',
  productName: '크리넥스 휴지',
  salePrice: 10000,
  effectiveUnitPrice: 333,
  unitMeasure: '롤',
  isPerishable: false,
  martName: '홈플러스',
  smartTip: {
    tipType: 'COUPANG_BULK',
    badgeText: '대용량 알뜰 팁',
    tipMessage: '쿠팡 추천',
    coupangKeyword: '크리넥스'
  }
};

describe('useCartStore - Zustand 장바구니 스토어', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('초기 장바구니 상태는 비어있어야 한다', () => {
    const { cart } = useCartStore.getState();
    expect(cart).toEqual([]);
  });

  it('addToCart - 새 상품 추가시 수량 1로 cart에 추가되어야 한다', () => {
    useCartStore.getState().addToCart(mockProductA);
    const { cart } = useCartStore.getState();

    expect(cart).toHaveLength(1);
    expect(cart[0].product.productName).toBe('신선한 삼겹살 100g');
    expect(cart[0].quantity).toBe(1);
  });

  it('addToCart - 동일 상품 추가시 수량이 증가해야 한다', () => {
    useCartStore.getState().addToCart(mockProductA);
    useCartStore.getState().addToCart(mockProductA);
    const { cart } = useCartStore.getState();

    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it('removeFromCart - id 또는 productName으로 장바구니에서 제거되어야 한다', () => {
    useCartStore.getState().addToCart(mockProductA);
    useCartStore.getState().addToCart(mockProductB);

    expect(useCartStore.getState().cart).toHaveLength(2);

    useCartStore.getState().removeFromCart('p1');
    expect(useCartStore.getState().cart).toHaveLength(1);
    expect(useCartStore.getState().cart[0].product.id).toBe('p2');
  });

  it('toggleMart - 마트 선택 여부 토글', () => {
    expect(useCartStore.getState().selectedMarts.emart).toBe(true);

    useCartStore.getState().toggleMart('emart');
    expect(useCartStore.getState().selectedMarts.emart).toBe(false);

    useCartStore.getState().toggleMart('emart');
    expect(useCartStore.getState().selectedMarts.emart).toBe(true);
  });

  it('calculateSplitSavings - 장바구니 상품의 최적 분할 절약액을 올바르게 계산해야 한다', () => {
    // 상품 A (2000원 x 2개 = 4000원)
    useCartStore.getState().addToCart(mockProductA);
    useCartStore.getState().addToCart(mockProductA);

    // 상품 B (10000원 x 1개 = 10000원)
    useCartStore.getState().addToCart(mockProductB);

    // 총 단일마트 금액 = 14000원
    // 분할 금액 (각 10% 절감 추정) = 3600원 + 9000원 = 12600원
    // 절약액 = 1400원
    const result = useCartStore.getState().calculateSplitSavings();
    expect(result.singleMartTotal).toBe(14000);
    expect(result.splitTotal).toBe(12600);
    expect(result.savings).toBe(1400);
  });

  it('calculateSplitSavings - 장바구니가 비어있는 경우 0을 반환해야 한다', () => {
    const result = useCartStore.getState().calculateSplitSavings();
    expect(result).toEqual({ singleMartTotal: 0, splitTotal: 0, savings: 0 });
  });
});
