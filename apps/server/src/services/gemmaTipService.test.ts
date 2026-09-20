import { describe, it, expect } from 'vitest';
import { generateDefaultTip, generateSmartTipsWithGemma } from './gemmaTipService.js';
import type { ParsedProduct } from '@kokmart/shared';

describe('gemmaTipService', () => {
  const mockPerishableProduct: ParsedProduct = {
    id: 'prod-1',
    productName: '국내산 삼겹살 100g',
    salePrice: 1980,
    effectiveUnitPrice: 1980,
    unitMeasure: '100g',
    isPerishable: true,
  };

  const mockNonPerishableProduct: ParsedProduct = {
    id: 'prod-2',
    productName: '다우니 섬유유연제 1L',
    salePrice: 7900,
    effectiveUnitPrice: 790,
    unitMeasure: '100ml',
    isPerishable: false,
  };

  describe('generateDefaultTip', () => {
    it('신선식품은 MART_RECOMMEND 기본 팁을 반환해야 한다', () => {
      const tip = generateDefaultTip(mockPerishableProduct);
      expect(tip.tipType).toBe('MART_RECOMMEND');
      expect(tip.badgeText).toBe('마트 현장 추천');
      expect(tip.coupangKeyword).toBeNull();
    });

    it('공산품/생필품은 COUPANG_BULK 기본 팁을 반환해야 한다', () => {
      const tip = generateDefaultTip(mockNonPerishableProduct);
      expect(tip.tipType).toBe('COUPANG_BULK');
      expect(tip.badgeText).toBe('대용량 알뜰 팁');
      expect(tip.coupangKeyword).toBe('다우니 섬유유연제 1L 대용량');
    });
  });

  describe('generateSmartTipsWithGemma', () => {
    it('빈 상품 목록 전달 시 빈 배열을 즉시 반환해야 한다', async () => {
      const results = await generateSmartTipsWithGemma([]);
      expect(results).toEqual([]);
    });

    it('상품 목록에 대해 smartTip이 채워진 결과를 반환해야 한다', async () => {
      const products = [mockPerishableProduct, mockNonPerishableProduct];
      const results = await generateSmartTipsWithGemma(products);

      expect(results).toHaveLength(2);
      expect(results[0]?.smartTip).toBeDefined();
      expect(results[1]?.smartTip).toBeDefined();
      expect(results[0]?.smartTip?.tipType).toBeDefined();
      expect(results[1]?.smartTip?.tipType).toBeDefined();
    });
  });
});
