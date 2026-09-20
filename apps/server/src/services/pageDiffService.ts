import sharp from 'sharp';

export interface PageDiffOptions {
  /**
   * 비교 해상도 가로 너비 (기본값: 400px)
   */
  sampleWidth?: number;
  /**
   * 비교 해상도 세로 높이 (기본값: 600px)
   */
  sampleHeight?: number;
  /**
   * JPEG 압축 노이즈 무시를 위한 픽셀 밝기 허용 오차 (0~255, 기본값: 15)
   */
  pixelTolerance?: number;
  /**
   * 동일 페이지로 판정할 일치율 임계치 (0~1, 기본값: 0.99 = 99%)
   */
  similarityThreshold?: number;
}

export interface PageDiffResult {
  /**
   * 동일 페이지 여부 (similarityScore >= similarityThreshold)
   */
  isIdentical: boolean;
  /**
   * 시각적 일치율 (0.0 ~ 1.0)
   */
  similarityScore: number;
  /**
   * 달라진 픽셀 수
   */
  diffPixelCount: number;
  /**
   * 비교된 전체 픽셀 수
   */
  totalPixelCount: number;
}

/**
 * 두 전단지 페이지 이미지(마스터 vs 지점)를 픽셀 단위로 비교하여 일치율 및 변경 여부를 고속 판별 (비용 0원)
 */
export async function compareFlyerPages(
  masterPageBuffer: Buffer,
  branchPageBuffer: Buffer,
  options: PageDiffOptions = {}
): Promise<PageDiffResult> {
  if (!masterPageBuffer || masterPageBuffer.length === 0) {
    throw new Error('마스터 전단 페이지 이미지 버퍼가 비어 있습니다.');
  }

  if (!branchPageBuffer || branchPageBuffer.length === 0) {
    throw new Error('비교할 지점 전단 페이지 이미지 버퍼가 비어 있습니다.');
  }

  const {
    sampleWidth = 400,
    sampleHeight = 600,
    pixelTolerance = 15,
    similarityThreshold = 0.99,
  } = options;

  // 정규화: 동일 크기 리사이즈, 흑백(greyscale) 변환, raw 픽셀 바이트 추출
  const [masterRaw, branchRaw] = await Promise.all([
    sharp(masterPageBuffer)
      .resize(sampleWidth, sampleHeight, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer(),
    sharp(branchPageBuffer)
      .resize(sampleWidth, sampleHeight, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer(),
  ]);

  const totalPixelCount = sampleWidth * sampleHeight;
  let diffPixelCount = 0;

  for (let i = 0; i < totalPixelCount; i++) {
    const diff = Math.abs((masterRaw[i] ?? 0) - (branchRaw[i] ?? 0));
    if (diff > pixelTolerance) {
      diffPixelCount++;
    }
  }

  const similarityScore = Math.max(0, 1 - diffPixelCount / totalPixelCount);
  const isIdentical = similarityScore >= similarityThreshold;

  return {
    isIdentical,
    similarityScore,
    diffPixelCount,
    totalPixelCount,
  };
}
