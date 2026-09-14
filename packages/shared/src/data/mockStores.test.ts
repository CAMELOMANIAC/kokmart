import { describe, it, expect } from 'vitest';
import { mockMartStores } from './mockStores.js';
import type { MartStore } from '../types/store.js';

describe('packages/shared/src/data/mockStores - Mock Stores Data Integrity & Utilities', () => {
  it('모든 마트 매장의 필수 정보가 유효해야 한다', () => {
    expect(mockMartStores.length).toBeGreaterThan(0);

    mockMartStores.forEach((store: MartStore) => {
      expect(store.id).toBeDefined();
      expect(store.name).toBeTruthy();
      expect(store.brand).toBeTruthy();
      expect(store.address).toBeTruthy();
      expect(store.phone).toBeTruthy();
      expect(typeof store.isHolidayToday).toBe('boolean');
      expect(typeof store.activeDealCount).toBe('number');
      expect(store.activeDealCount).toBeGreaterThanOrEqual(0);
    });
  });

  it('대형마트 3사(이마트, 홈플러스, 롯데마트) 및 SSM 매장들이 올바르게 분류되어 있어야 한다', () => {
    const hypermarkets = mockMartStores.filter((s: MartStore) => s.storeType === 'hypermarket');
    const ssmStores = mockMartStores.filter((s: MartStore) => s.storeType === 'ssm');

    expect(hypermarkets.length).toBeGreaterThan(0);
    expect(ssmStores.length).toBeGreaterThan(0);

    const brands = new Set(mockMartStores.map((s: MartStore) => s.brand));
    expect(brands.has('이마트')).toBe(true);
    expect(brands.has('홈플러스')).toBe(true);
    expect(brands.has('롯데마트')).toBe(true);
  });

  it('브랜드별 필터링 기능이 정확해야 한다', () => {
    const emartStores = mockMartStores.filter((s: MartStore) => s.brand === '이마트');
    expect(emartStores.length).toBeGreaterThan(0);
    emartStores.forEach((s: MartStore) => {
      expect(s.brand).toBe('이마트');
    });

    const homeplusStores = mockMartStores.filter((s: MartStore) => s.brand === '홈플러스');
    expect(homeplusStores.length).toBeGreaterThan(0);
    homeplusStores.forEach((s: MartStore) => {
      expect(s.brand).toBe('홈플러스');
    });
  });
});
