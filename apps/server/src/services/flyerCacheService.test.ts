import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setCachedFlyer, getMemoryCachedFlyer, checkIdenticalFlyer } from './flyerCacheService.js';
import { ParsedProduct } from '@kokmart/shared';

vi.mock('./pageDiffService.js', () => ({
  compareFlyerPages: vi.fn(),
}));

import { compareFlyerPages } from './pageDiffService.js';

describe('flyerCacheService', () => {
  const sampleProducts: ParsedProduct[] = [
    {
      id: 'prod-1',
      pageIndex: 1,
      productName: '사과 1봉',
      salePrice: 8900,
      effectiveUnitPrice: 8900,
      unitMeasure: '1봉',
      isPerishable: true,
      martName: '이마트',
    },
  ];

  const dummyBuffer1 = Buffer.from('image-page-1');
  const dummyBuffer2 = Buffer.from('image-page-2');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setCachedFlyer & getMemoryCachedFlyer', () => {
    it('전단지 캐시를 저장하고 조회할 수 있어야 한다', () => {
      setCachedFlyer('이마트', '공통', [dummyBuffer1], ['https://example.com/emart1.jpg'], sampleProducts, 'flyer-100');

      const cached = getMemoryCachedFlyer('이마트', '공통');
      expect(cached).not.toBeNull();
      expect(cached?.flyerId).toBe('flyer-100');
      expect(cached?.products).toEqual(sampleProducts);
      expect(cached?.parsedAt).toBeDefined();
    });

    it('지점 캐시가 없으면 공통(마스터) 캐시로 Fallback 조회되어야 한다', () => {
      setCachedFlyer('롯데마트', '공통', [dummyBuffer1], ['https://example.com/lotte1.jpg'], sampleProducts, 'flyer-lotte-master');

      const cached = getMemoryCachedFlyer('롯데마트', '잠실점');
      expect(cached).not.toBeNull();
      expect(cached?.flyerId).toBe('flyer-lotte-master');
    });

    it('캐시에 없는 브랜드 조회 시 null을 반환해야 한다', () => {
      const cached = getMemoryCachedFlyer('존재하지않는마트', '공통');
      expect(cached).toBeNull();
    });
  });

  describe('checkIdenticalFlyer', () => {
    it('인입 버퍼가 없거나 빈 배열인 경우 null을 반환해야 한다', async () => {
      const resNull = await checkIdenticalFlyer('이마트', '공통', []);
      expect(resNull).toBeNull();
    });

    it('캐시가 존재하지 않는 경우 null을 반환해야 한다', async () => {
      const res = await checkIdenticalFlyer('신규마트', '공통', [dummyBuffer1]);
      expect(res).toBeNull();
    });

    it('페이지 수(버퍼 개수)가 다르면 null을 반환해야 한다', async () => {
      setCachedFlyer('홈플러스', '공통', [dummyBuffer1], ['https://example.com/hp1.jpg'], sampleProducts, 'flyer-hp');

      const res = await checkIdenticalFlyer('홈플러스', '공통', [dummyBuffer1, dummyBuffer2]);
      expect(res).toBeNull();
    });

    it('모든 페이지의 픽셀 유사도가 98% 이상(동일)이면 캐시된 데이터를 반환해야 한다', async () => {
      setCachedFlyer('홈플러스', '공통', [dummyBuffer1], ['https://example.com/hp1.jpg'], sampleProducts, 'flyer-hp-1');

      (compareFlyerPages as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        isIdentical: true,
        similarityScore: 0.99,
      });

      const res = await checkIdenticalFlyer('홈플러스', '공통', [dummyBuffer1]);

      expect(res).not.toBeNull();
      expect(res?.isIdentical).toBe(true);
      expect(res?.flyerId).toBe('flyer-hp-1');
      expect(res?.products).toEqual(sampleProducts);
      expect(compareFlyerPages).toHaveBeenCalledWith(dummyBuffer1, dummyBuffer1, { similarityThreshold: 0.98 });
    });

    it('페이지 픽셀 비교 중 차이가 발생하면 null을 반환해야 한다', async () => {
      setCachedFlyer('홈플러스', '공통', [dummyBuffer1], ['https://example.com/hp1.jpg'], sampleProducts, 'flyer-hp-1');

      (compareFlyerPages as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        isIdentical: false,
        similarityScore: 0.85,
      });

      const res = await checkIdenticalFlyer('홈플러스', '공통', [dummyBuffer1]);

      expect(res).toBeNull();
    });

    it('비교 처리 중 에러가 발생하면 null을 반환하고 로그를 출력해야 한다', async () => {
      setCachedFlyer('홈플러스', '공통', [dummyBuffer1], ['https://example.com/hp1.jpg'], sampleProducts, 'flyer-hp-1');

      (compareFlyerPages as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Sharp processing error'));

      const res = await checkIdenticalFlyer('홈플러스', '공통', [dummyBuffer1]);

      expect(res).toBeNull();
    });
  });
});
