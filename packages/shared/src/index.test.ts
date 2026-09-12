import { describe, it, expect } from 'vitest';
import { mockMartStores } from './data/mockStores.js';

describe('Shared Package - Mock Stores Test', () => {
  it('mockMartStores 배열이 정의되어 있고 1개 이상의 지점을 포함해야 한다', () => {
    expect(mockMartStores).toBeDefined();
    expect(Array.isArray(mockMartStores)).toBe(true);
    expect(mockMartStores.length).toBeGreaterThan(0);
  });

  it('각 지점은 필수 필드(id, name, brand, storeType, lat, lng)를 올바르게 가지고 있어야 한다', () => {
    for (const store of mockMartStores) {
      expect(store.id).toBeTruthy();
      expect(store.name).toBeTruthy();
      expect(store.brand).toBeTruthy();
      expect(['hypermarket', 'ssm']).toContain(store.storeType);
      
      // 위도/경도 대한민국 영역 유효성 검증
      expect(store.lat).toBeGreaterThan(33);
      expect(store.lat).toBeLessThan(39);
      expect(store.lng).toBeGreaterThan(124);
      expect(store.lng).toBeLessThan(132);
    }
  });

  it('대형마트 3사(이마트, 홈플러스, 롯데마트) 지점이 포함되어 있어야 한다', () => {
    const brands = new Set(mockMartStores.map(s => s.brand));
    expect(brands.has('이마트')).toBe(true);
    expect(brands.has('홈플러스')).toBe(true);
    expect(brands.has('롯데마트')).toBe(true);
  });
});
