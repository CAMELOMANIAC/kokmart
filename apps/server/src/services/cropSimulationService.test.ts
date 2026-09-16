import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { cropBoundingBoxesWithPadding } from './cropSimulationService';
import type { BoundingBox } from '@kokmart/shared';

describe('cropSimulationService', () => {
  const createTestImage = async (width = 200, height = 200): Promise<Buffer> => {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();
  };

  it('BoundingBox 좌표에 맞춰 패딩을 적용하고 크롭된 이미지 버퍼 리스트를 반환해야 한다', async () => {
    const testImage = await createTestImage(200, 200);
    const boxes: BoundingBox[] = [
      {
        id: 'box-1',
        xmin: 250, // 200px의 25% = 50px
        ymin: 250, // 200px의 25% = 50px
        xmax: 750, // 200px의 75% = 150px
        ymax: 750, // 200px의 75% = 150px
        labelHint: '사과 1상자',
      },
    ];

    const results = await cropBoundingBoxesWithPadding(testImage, boxes, { paddingPercent: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].boxId).toBe('box-1');
    expect(results[0].labelHint).toBe('사과 1상자');
    expect(results[0].buffer).toBeInstanceOf(Buffer);

    // 크롭된 버퍼의 메타데이터 검증
    const metadata = await sharp(results[0].buffer).metadata();
    expect(metadata.width).toBeGreaterThan(0);
    expect(metadata.height).toBeGreaterThan(0);
  });

  it('이미지 경계에 도달했을 때 0 미만 또는 원본 크기를 초과하지 않도록 클램핑되어야 한다', async () => {
    const testImage = await createTestImage(100, 100);
    const boxes: BoundingBox[] = [
      {
        id: 'box-edge',
        xmin: 0,
        ymin: 0,
        xmax: 1000,
        ymax: 1000,
        labelHint: '전체 전단',
      },
    ];

    const results = await cropBoundingBoxesWithPadding(testImage, boxes);

    expect(results).toHaveLength(1);
    const metadata = await sharp(results[0].buffer).metadata();
    expect(metadata.width).toBeLessThanOrEqual(100);
    expect(metadata.height).toBeLessThanOrEqual(100);
  });

  it('boxes가 빈 배열일 때 빈 결과를 반환해야 한다', async () => {
    const testImage = await createTestImage(100, 100);
    const results = await cropBoundingBoxesWithPadding(testImage, []);
    expect(results).toEqual([]);
  });
});
