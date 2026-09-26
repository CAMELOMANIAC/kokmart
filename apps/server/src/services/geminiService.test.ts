import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
    Type: {
      ARRAY: 'ARRAY',
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      BOOLEAN: 'BOOLEAN',
      INTEGER: 'INTEGER',
    },
  };
});

vi.hoisted(() => {
  process.env.GEMINI_VISION_API_KEY = 'mock_gemini_vision_api_key';
  process.env.GEMINI_VISION_MODEL = 'gemini-3.5-flash-lite';
});

import {
  cropFlyerGrid,
  parseTileWithGemini,
  detectBoundingBoxesWithGemini,
  parseSingleCroppedProductWithGemini,
  parseMasterFlyerWithGemini,
  parseSinglePageWithGemini,
  refineProductsFromFlyerWithGemini,
} from './geminiService.js';

describe('geminiService', () => {
  const createTestImage = async (width = 400, height = 400): Promise<Buffer> => {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cropFlyerGrid', () => {
    it('전단 이미지를 지정된 타일 그리드(2x2)로 올바르게 분할해야 한다', async () => {
      const testImage = await createTestImage(400, 400);
      const tiles = await cropFlyerGrid(testImage, 2, 2);

      expect(tiles).toHaveLength(4);

      for (const tile of tiles) {
        expect(tile).toBeInstanceOf(Buffer);
        const meta = await sharp(tile).metadata();
        expect(meta.width).toBe(200);
        expect(meta.height).toBe(200);
      }
    });
  });

  describe('parseTileWithGemini', () => {
    it('타일 이미지를 파싱하여 상품 목록을 반환해야 한다', async () => {
      const testImage = await createTestImage(100, 100);
      const mockProduct = {
        productName: '국내산 삼겹살',
        salePrice: 1980,
        effectiveUnitPrice: 1980,
        unitMeasure: '100g',
        isPerishable: true,
        smartTip: {
          tipType: 'MART_RECOMMEND',
          badgeText: '마트 현장 추천',
          tipMessage: '신선 식품 현장 추천',
          coupangKeyword: null,
        },
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([mockProduct]),
      });

      const result = await parseTileWithGemini(testImage);
      expect(result).toEqual([mockProduct]);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-3.5-flash-lite' })
      );
    });
  });

  describe('detectBoundingBoxesWithGemini', () => {
    it('Bounding Box 좌표를 검출하고 0~1000 범위로 정규화 클램핑해야 한다', async () => {
      const testImage = await createTestImage(100, 100);
      const mockBoxes = [
        { ymin: -50, xmin: 100, ymax: 1200, xmax: 500, labelHint: '한우 등심' },
      ];

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(mockBoxes),
      });

      const result = await detectBoundingBoxesWithGemini(testImage, '이마트');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'box-1',
        ymin: 0,
        xmin: 100,
        ymax: 1000,
        xmax: 500,
        labelHint: '한우 등심',
      });
    });
  });

  describe('parseSingleCroppedProductWithGemini', () => {
    it('크롭된 상품 이미지를 파싱하여 ParsedProduct 객체를 반환하고 id/martName을 설정해야 한다', async () => {
      const testImage = await createTestImage(100, 100);
      const mockProduct = {
        productName: '신라면 5개입',
        salePrice: 3980,
        effectiveUnitPrice: 796,
        unitMeasure: '1개',
        isPerishable: false,
        smartTip: {
          tipType: 'COUPANG_BULK',
          badgeText: '대용량 알뜰 팁',
          tipMessage: '생필품 알뜰 팁',
          coupangKeyword: '신라면 대용량',
        },
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(mockProduct),
      });

      const result = await parseSingleCroppedProductWithGemini(testImage, '홈플러스');

      expect(result.productName).toBe('신라면 5개입');
      expect(result.martName).toBe('홈플러스');
      expect(result.id).toMatch(/^prod-/);
    });

    it('파싱 실패 시 예외를 던져야 한다', async () => {
      const testImage = await createTestImage(100, 100);

      mockGenerateContent.mockRejectedValueOnce(new Error('API 에러'));

      await expect(
        parseSingleCroppedProductWithGemini(testImage, '이마트')
      ).rejects.toThrow('Gemini 크롭 상품 파싱 실패: API 에러');
    });
  });

  describe('parseMasterFlyerWithGemini', () => {
    it('마스터 전단 이미지 목록을 TSV 포맷으로 파싱해야 한다', async () => {
      const page1 = await createTestImage(100, 100);
      const page2 = await createTestImage(100, 100);

      const mockTsv = `페이지번호\t상품명\t할인가\t단위당가격\t단위\t신선식품여부
1\t국내산 삼겹살 100g\t1,980원\t1,980원\t100g\tY
2\t제주 감귤 1.5kg\t12,900원\t860원\t100g\tY`;

      mockGenerateContent.mockResolvedValueOnce({
        text: mockTsv,
      });

      const products = await parseMasterFlyerWithGemini([page1, page2], '롯데마트');

      expect(products).toHaveLength(2);
      expect(products[0]?.productName).toBe('국내산 삼겹살 100g');
      expect(products[0]?.martName).toBe('롯데마트');
      expect(products[0]?.id).toMatch(/^master-p1-/);
      expect(products[1]?.productName).toBe('제주 감귤 1.5kg');
      expect(products[1]?.martName).toBe('롯데마트');
      expect(products[1]?.id).toMatch(/^master-p2-/);
    });

    it('API 오류 발생 시 커스텀 예외 메시지를 반환해야 한다', async () => {
      const page = await createTestImage(100, 100);

      mockGenerateContent.mockRejectedValueOnce(new Error('네트워크 오류'));

      await expect(
        parseMasterFlyerWithGemini([page], '이마트')
      ).rejects.toThrow('Gemini 마스터 전단 파싱 실패: 네트워크 오류');
    });
  });

  describe('parseSinglePageWithGemini', () => {
    it('단일 전단 페이지를 TSV 포맷으로 파싱해야 한다', async () => {
      const page = await createTestImage(100, 100);
      const mockTsv = `1\t딸기 500g\t8,900원\t1,780원\t100g\tY`;

      mockGenerateContent.mockResolvedValueOnce({
        text: mockTsv,
      });

      const products = await parseSinglePageWithGemini(page, 2, '이마트');

      expect(products).toHaveLength(1);
      expect(products[0]?.productName).toBe('딸기 500g');
      expect(products[0]?.id).toMatch(/^page2-/);
    });

    it('API 오류 발생 시 커스텀 예외 메시지를 반환해야 한다', async () => {
      const page = await createTestImage(100, 100);

      mockGenerateContent.mockRejectedValueOnce(new Error('인증 오류'));

      await expect(
        parseSinglePageWithGemini(page, 1, '이마트')
      ).rejects.toThrow('Gemini 단일 페이지 재파싱 실패: 인증 오류');
    });
  });

  describe('refineProductsFromFlyerWithGemini', () => {
    it('검색 실패 상품을 원본 페이지와 좌표로 재검증해야 한다', async () => {
      const page = await createTestImage(100, 100);
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([
          {
            id: 'product-1',
            productName: '샤브용 모둠버섯 300g',
            salePrice: 4980,
            effectiveUnitPrice: 1660,
            unitMeasure: '100g',
            isPerishable: true,
            onlineComparable: false,
            reason: '여러 버섯이 섞인 마트 행사 구성',
          },
        ]),
      });

      const result = await refineProductsFromFlyerWithGemini(page, [{
        id: 'product-1',
        productName: '사브용 모듬버섯',
        salePrice: 4980,
        effectiveUnitPrice: 4980,
        unitMeasure: '1팩',
        isPerishable: true,
        boundingBox: { id: 'box-1', ymin: 100, xmin: 100, ymax: 400, xmax: 400 },
      }]);

      expect(result).toHaveLength(1);
      expect(result[0]?.product.productName).toBe('샤브용 모둠버섯 300g');
      expect(result[0]?.onlineComparable).toBe(false);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3.5-flash-lite',
      }));
    });
  });

  describe('입력 인자 예외 검증', () => {
    it('빈 타일 버퍼를 전달할 경우 예외를 던져야 한다', async () => {
      const emptyBuffer = Buffer.from('');

      await expect(parseTileWithGemini(emptyBuffer)).rejects.toThrow(
        '파싱할 타일 이미지 버퍼가 비어 있습니다.'
      );

      await expect(detectBoundingBoxesWithGemini(emptyBuffer)).rejects.toThrow(
        'Bounding Box를 검출할 전단 이미지 데이터가 없습니다.'
      );

      await expect(parseSingleCroppedProductWithGemini(emptyBuffer)).rejects.toThrow(
        '파싱할 크롭 상품 이미지 버퍼가 비어 있습니다.'
      );

      await expect(parseMasterFlyerWithGemini([])).rejects.toThrow(
        '파싱할 전단지 이미지 목록이 비어 있습니다.'
      );

      await expect(parseMasterFlyerWithGemini([emptyBuffer])).rejects.toThrow(
        '페이지 1의 이미지 버퍼가 비어 있습니다.'
      );

      await expect(parseSinglePageWithGemini(emptyBuffer, 1)).rejects.toThrow(
        '파싱할 페이지 이미지 데이터가 비어 있습니다.'
      );
    });
  });
});
