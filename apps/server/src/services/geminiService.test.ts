import { describe, it, expect, vi } from 'vitest';
import sharp from 'sharp';

vi.hoisted(() => {
  process.env.GEMINI_API_KEY = 'mock_gemini_api_key';
});

import {
  cropFlyerGrid,
  parseTileWithGemini,
  detectBoundingBoxesWithGemini,
  parseSingleCroppedProductWithGemini,
} from './geminiService';

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
    });
  });
});
