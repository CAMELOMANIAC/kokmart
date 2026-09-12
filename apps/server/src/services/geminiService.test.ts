import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { cropFlyerGrid, parseTileWithGemini } from './geminiService.js';

describe('Gemini Service - Grid Crop & Parsing Unit Tests', () => {
  it('cropFlyerGrid - 이미지를 지정된 행열 크기로 정확히 분할해야 한다', async () => {
    // 200x200 크기의 테스트 이미지 생성
    const testImageBuffer = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 0, g: 255, b: 0 }
      }
    })
      .png()
      .toBuffer();

    // 2x2 분할 (총 4개 타일)
    const tiles = await cropFlyerGrid(testImageBuffer, 2, 2);
    expect(tiles).toHaveLength(4);

    // 첫 번째 타일 메타데이터 검증 (100x100)
    const firstTileMeta = await sharp(tiles[0]).metadata();
    expect(firstTileMeta.width).toBe(100);
    expect(firstTileMeta.height).toBe(100);
  });

  it('cropFlyerGrid - 3x2 그리드 (6개 타일) 분할 테스트', async () => {
    const testImageBuffer = await sharp({
      create: {
        width: 300,
        height: 200,
        channels: 3,
        background: { r: 0, g: 0, b: 255 }
      }
    })
      .png()
      .toBuffer();

    const tiles = await cropFlyerGrid(testImageBuffer, 3, 2);
    expect(tiles).toHaveLength(6);
  });

  it('parseTileWithGemini - GEMINI_API_KEY 미설정 시 mock 파싱 결과를 반환해야 한다', async () => {
    const dummyBuffer = Buffer.from('test-image-data');
    const products = await parseTileWithGemini(dummyBuffer);

    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);

    const firstProduct = products[0];
    expect(firstProduct.productName).toBeDefined();
    expect(typeof firstProduct.salePrice).toBe('number');
    expect(firstProduct.smartTip).toBeDefined();
    expect(['MART_BEST', 'MART_RECOMMEND', 'COUPANG_BULK']).toContain(firstProduct.smartTip.tipType);
  });
});
