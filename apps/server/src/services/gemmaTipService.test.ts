import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
  };
});

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    it('GEMINI_API_KEY가 없을 경우 기본 룰 팁을 적용해야 한다', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const products = [{ ...mockPerishableProduct }, { ...mockNonPerishableProduct }];
      const results = await generateSmartTipsWithGemma(products);

      expect(results).toHaveLength(2);
      expect(results[0]?.smartTip?.tipType).toBe('MART_RECOMMEND');
      expect(results[1]?.smartTip?.tipType).toBe('COUPANG_BULK');

      process.env.GEMINI_API_KEY = originalKey;
    });

    it('GEMINI_API_KEY가 있고 API 정상 응답 시 Gemma 분석 결과를 반환해야 한다', async () => {
      process.env.GEMINI_API_KEY = 'test_key';

      const mockGemmaResponse = [
        {
          id: 'prod-1',
          smartTip: {
            tipType: 'MART_BEST',
            badgeText: '마트 필구 특가',
            tipMessage: '온라인 대비 100g당 300원 저렴해요.',
            coupangKeyword: null,
          },
        },
      ];

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(mockGemmaResponse),
      });

      const products = [{ ...mockPerishableProduct }];
      const results = await generateSmartTipsWithGemma(products);

      expect(results[0]?.smartTip).toEqual({
        tipType: 'MART_BEST',
        badgeText: '마트 필구 특가',
        tipMessage: '온라인 대비 100g당 300원 저렴해요.',
        coupangKeyword: null,
      });
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('Gemma API 호출 중 예외 또는 파싱 실패 발생 시 기본 팁으로 안전하게 폴백해야 한다', async () => {
      process.env.GEMINI_API_KEY = 'test_key';

      mockGenerateContent.mockRejectedValueOnce(new Error('API quota exceeded'));

      const products = [{ ...mockPerishableProduct }, { ...mockNonPerishableProduct }];
      const results = await generateSmartTipsWithGemma(products);

      expect(results).toHaveLength(2);
      expect(results[0]?.smartTip?.tipType).toBe('MART_RECOMMEND');
      expect(results[1]?.smartTip?.tipType).toBe('COUPANG_BULK');
    });
  });
});
