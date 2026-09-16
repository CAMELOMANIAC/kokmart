import sharp from 'sharp';
import { BoundingBox } from '@kokmart/shared';

export interface CropOptions {
  paddingPercent?: number; // 기본값 5%
}

/**
 * 사용자 기기 Web Worker에서 OffscreenCanvas를 이용해 수행하는 크롭 로직의 서버 시뮬레이션
 * Gemini에서 받은 0~1000 정규화 좌표에 충분한 여백(padding)을 주고 경계를 넘지 않도록 크롭
 */
export async function cropBoundingBoxesWithPadding(
  imageBuffer: Buffer,
  boxes: BoundingBox[],
  options: CropOptions = {}
): Promise<Array<{ boxId: string; labelHint?: string; buffer: Buffer }>> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1000;
  const height = metadata.height || 1500;
  const paddingPercent = options.paddingPercent ?? 5; // 상하좌우 5% 여백

  const results: Array<{ boxId: string; labelHint?: string; buffer: Buffer }> = [];

  for (const box of boxes) {
    // 0~1000 정규화 좌표를 픽셀로 변환
    let left = Math.round((box.xmin / 1000) * width);
    let top = Math.round((box.ymin / 1000) * height);
    let right = Math.round((box.xmax / 1000) * width);
    let bottom = Math.round((box.ymax / 1000) * height);

    const boxW = right - left;
    const boxH = bottom - top;

    // 충분한 여백(Padding) 추가
    const padX = Math.round(boxW * (paddingPercent / 100));
    const padY = Math.round(boxH * (paddingPercent / 100));

    left = Math.max(0, left - padX);
    top = Math.max(0, top - padY);
    right = Math.min(width, right + padX);
    bottom = Math.min(height, bottom + padY);

    const extractWidth = Math.max(1, right - left);
    const extractHeight = Math.max(1, bottom - top);

    const croppedBuffer = await sharp(imageBuffer)
      .extract({
        left,
        top,
        width: extractWidth,
        height: extractHeight
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    results.push({
      boxId: box.id,
      labelHint: box.labelHint,
      buffer: croppedBuffer
    });
  }

  return results;
}
