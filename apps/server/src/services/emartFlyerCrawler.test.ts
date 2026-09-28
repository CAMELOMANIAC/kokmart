import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractEmartFlyerImageUrls,
  fetchLatestEmartFlyer,
  downloadEmartFlyerImages,
} from './emartFlyerCrawler.js';

describe('emartFlyerCrawler', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('extractEmartFlyerImageUrls', () => {
    it('유효한 이마트 전단 이미지 URL과 면수(alt) 정보를 추출하고 순서대로 정렬해야 한다', () => {
      const sampleHtml = `
        <html>
          <body>
            <img src="https://stimg.emart.com/upload/news_leaflet/20260305_02.jpg" alt="전단지 2면" />
            <img data-src="https://stimg.emart.com/upload/news_leaflet/20260305_01.jpg" alt="전단지 1면" />
            <img src="https://invalid-domain.com/upload/news_leaflet/test.jpg" alt="1면" />
            <img src="https://stimg.emart.com/upload/news_leaflet/20260305_02.jpg" alt="중복 URL" />
          </body>
        </html>
      `;

      const urls = extractEmartFlyerImageUrls(sampleHtml);

      expect(urls).toHaveLength(2);
      expect(urls[0]).toBe('https://stimg.emart.com/upload/news_leaflet/20260305_01.jpg');
      expect(urls[1]).toBe('https://stimg.emart.com/upload/news_leaflet/20260305_02.jpg');
    });

    it('허용되지 않은 도메인, 프로토콜, 확장자의 이미지는 제외해야 한다', () => {
      const invalidHtml = `
        <img src="http://stimg.emart.com/upload/news_leaflet/test.jpg" />
        <img src="https://stimg.emart.com/other_path/test.jpg" />
        <img src="https://stimg.emart.com/upload/news_leaflet/test.gif" />
      `;

      const urls = extractEmartFlyerImageUrls(invalidHtml);
      expect(urls).toHaveLength(0);
    });

    it('HTML 엔티티가 포함된 URL 속성을 정상적으로 디코딩하여 추출해야 한다', () => {
      const htmlWithEntities = `
        <img src="https://stimg.emart.com/upload/news_leaflet/20260305_01.jpg?a=1&amp;b=2" alt="1면" />
      `;

      const urls = extractEmartFlyerImageUrls(htmlWithEntities);
      expect(urls).toHaveLength(1);
      expect(urls[0]).toBe('https://stimg.emart.com/upload/news_leaflet/20260305_01.jpg?a=1&b=2');
    });
  });

  describe('fetchLatestEmartFlyer', () => {
    it('이마트 전단 페이지를 성공적으로 파싱하여 FlyerSourceInfo를 반환해야 한다', async () => {
      const mockHtml = `
        <html>
          <body>
            <div>행사기간 : 3.5 - 3.11</div>
            <img src="https://stimg.emart.com/upload/news_leaflet/20260305_01.jpg" alt="1면" />
          </body>
        </html>
      `;

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      } as Response);

      const fixedNow = new Date('2026-03-05T00:00:00Z');
      const result = await fetchLatestEmartFlyer(fixedNow);

      expect(result.martId).toBe('emart-master');
      expect(result.martName).toBe('이마트');
      expect(result.branchName).toBe('공통');
      expect(result.imageUrls).toEqual(['https://stimg.emart.com/upload/news_leaflet/20260305_01.jpg']);
      expect(result.validPeriod.startDate).toBe('2026-03-05');
      expect(result.validPeriod.endDate).toBe('2026-03-11');
      expect(result.flyerTitle).toBe('이마트 2026-03-05 주간 전단');
    });

    it('HTTP 응답이 ok가 아닐 경우 에러를 던져야 한다', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(fetchLatestEmartFlyer()).rejects.toThrow('이마트 전단 뷰어 요청 실패: 500 Internal Server Error');
    });

    it('HTML에서 전단 이미지를 찾지 못할 경우 에러를 던져야 한다', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html><body>전단지 이미지 없음</body></html>',
      } as Response);

      await expect(fetchLatestEmartFlyer()).rejects.toThrow('이마트 전단 HTML에서 공식 전단 이미지 URL을 찾지 못했습니다.');
    });
  });

  describe('downloadEmartFlyerImages', () => {
    it('유효한 전단 이미지를 성공적으로 다운로드하여 Buffer 배열로 반환해야 한다', async () => {
      const mockImageBuffer = new Uint8Array([1, 2, 3, 4]).buffer;

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: async () => mockImageBuffer,
      } as Response);

      const urls = ['https://stimg.emart.com/upload/news_leaflet/20260305_01.jpg'];
      const buffers = await downloadEmartFlyerImages(urls);

      expect(buffers).toHaveLength(1);
      expect(buffers[0]).toBeInstanceOf(Buffer);
      expect(buffers[0]?.length).toBe(4);
    });

    it('허용되지 않은 이미지 URL이 입력되면 에러를 던져야 한다', async () => {
      const invalidUrls = ['https://malicious-site.com/image.jpg'];
      await expect(downloadEmartFlyerImages(invalidUrls)).rejects.toThrow('허용되지 않은 이마트 전단 이미지 URL입니다');
    });

    it('다운로드 응답의 content-type이 이미지가 아니면 에러를 던져야 한다', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      } as Response);

      const urls = ['https://stimg.emart.com/upload/news_leaflet/20260305_01.jpg'];
      await expect(downloadEmartFlyerImages(urls)).rejects.toThrow('응답이 이미지가 아닙니다');
    });
  });
});
