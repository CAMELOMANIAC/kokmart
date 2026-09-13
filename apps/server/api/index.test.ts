import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './index.js';

describe('Server API Endpoints', () => {
  it('GET /api/health - 서버 상태가 정상적으로 반환되어야 한다', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('Kokmart API Server');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/products/compare - 최저가 비교 상품 목록을 정상 반환해야 한다', async () => {
    const res = await request(app).get('/api/products/compare');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);

    const firstProduct = res.body.products[0];
    expect(firstProduct.productName).toBeDefined();
    expect(firstProduct.salePrice).toBeGreaterThan(0);
    expect(firstProduct.smartTip).toBeDefined();
    expect(['MART_BEST', 'MART_RECOMMEND', 'COUPANG_BULK']).toContain(firstProduct.smartTip.tipType);
  });

  it('POST /api/flyers/parse - 이미지 첨부 없이 요청시 샘플 파싱 결과를 반환해야 한다', async () => {
    const res = await request(app).post('/api/flyers/parse');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.gridCount).toBe(1);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.parsedAt).toBeDefined();
  });

  it('POST /api/flyers/parse - 이미지 파일 업로드시 그리드 파싱 결과를 반환해야 한다', async () => {
    // 100x100 픽셀 크기의 테스트용 이미지 버퍼 생성
    const { default: sharp } = await import('sharp');
    const imageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .jpeg()
      .toBuffer();

    const res = await request(app)
      .post('/api/flyers/parse')
      .attach('flyer', imageBuffer, { filename: 'test-flyer.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.gridCount).toBe(4); // default 2x2 grid
    expect(Array.isArray(res.body.products)).toBe(true);
  });
});
