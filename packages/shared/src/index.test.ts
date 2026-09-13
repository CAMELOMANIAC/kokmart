import { describe, it, expect } from 'vitest';
import { mockMartStores } from './data/mockStores.js';
import { calculateDistanceKm } from './types/store.js';

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
    const brands = new Set(mockMartStores.map((s) => s.brand));
    expect(brands.has('이마트')).toBe(true);
    expect(brands.has('홈플러스')).toBe(true);
    expect(brands.has('롯데마트')).toBe(true);
  });
});

describe('Shared Package - Distance Calculator Test', () => {
  it('동일한 좌표 간 거리는 0km이어야 한다', () => {
    const dist = calculateDistanceKm(37.498, 127.027, 37.498, 127.027);
    expect(dist).toBe(0);
  });

  it('서울 강남역에서 광화문역까지의 거리를 올바르게 계산해야 한다 (약 9.5~10km)', () => {
    // 강남역: 37.4979, 127.0276 / 광화문역: 37.5710, 126.9769
    const dist = calculateDistanceKm(37.4979, 127.0276, 37.571, 126.9769);
    expect(dist).toBeGreaterThan(8);
    expect(dist).toBeLessThan(12);
  });

  it('소수점 둘째 자리에서 반올림된 결과(소수점 한 자리)를 반환해야 한다', () => {
    const dist = calculateDistanceKm(37.5, 127.0, 37.51, 127.01);
    expect(typeof dist).toBe('number');
    expect(Number.isFinite(dist)).toBe(true);
    // 소수점 1자리 확인
    const decimalPlaces = (dist.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(1);
  });
});
