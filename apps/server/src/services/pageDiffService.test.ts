import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { compareFlyerPages } from './pageDiffService.js';

describe('pageDiffService', () => {
  const createBaseImage = async (color = { r: 255, g: 255, b: 255 }): Promise<Buffer> => {
    return sharp({
      create: {
        width: 400,
        height: 600,
        channels: 3,
        background: color,
      },
    })
      .jpeg()
      .toBuffer();
  };

  const createModifiedImage = async (): Promise<Buffer> => {
    // 400x600 흰색 배경에 가로 100x100 검은색 박스 합성 (가격/상품 변경 시뮬레이션)
    const overlay = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    return sharp({
      create: {
        width: 400,
        height: 600,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([{ input: overlay, top: 100, left: 100 }])
      .jpeg()
      .toBuffer();
  };

  it('동일한 이미지인 경우 100% 일치(isIdentical: true)로 판정해야 한다', async () => {
    const imgA = await createBaseImage();
    const imgB = await createBaseImage();

    const result = await compareFlyerPages(imgA, imgB);

    expect(result.isIdentical).toBe(true);
    expect(result.similarityScore).toBe(1.0);
    expect(result.diffPixelCount).toBe(0);
    expect(result.totalPixelCount).toBe(240000);
  });

  it('일부 영역(상품/가격 변경)에 차이가 있는 경우 isIdentical: false로 감지해야 한다', async () => {
    const masterImg = await createBaseImage();
    const branchImgWithDiff = await createModifiedImage();

    const result = await compareFlyerPages(masterImg, branchImgWithDiff);

    expect(result.isIdentical).toBe(false);
    expect(result.similarityScore).toBeLessThan(0.99);
    expect(result.diffPixelCount).toBeGreaterThan(0);
  });

  it('완전히 다른 이미지인 경우 일치율이 크게 낮아야 한다', async () => {
    const whiteImg = await createBaseImage({ r: 255, g: 255, b: 255 });
    const blackImg = await createBaseImage({ r: 0, g: 0, b: 0 });

    const result = await compareFlyerPages(whiteImg, blackImg);

    expect(result.isIdentical).toBe(false);
    expect(result.similarityScore).toBe(0);
    expect(result.diffPixelCount).toBe(result.totalPixelCount);
  });

  it('빈 버퍼 전달 시 예외를 던져야 한다', async () => {
    const validImg = await createBaseImage();
    const emptyBuf = Buffer.from('');

    await expect(compareFlyerPages(emptyBuf, validImg)).rejects.toThrow(
      '마스터 전단 페이지 이미지 버퍼가 비어 있습니다.'
    );

    await expect(compareFlyerPages(validImg, emptyBuf)).rejects.toThrow(
      '비교할 지점 전단 페이지 이미지 버퍼가 비어 있습니다.'
    );
  });
});
