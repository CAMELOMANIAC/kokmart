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
  });
});
