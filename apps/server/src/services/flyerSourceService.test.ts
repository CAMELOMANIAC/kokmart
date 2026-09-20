import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getLatestFlyerSource } from './flyerSourceService.js';

describe('flyerSourceService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('이마트 브랜드 검색 시 이마트 전단 정보를 반환해야 한다', async () => {
    const mockDate = new Date('2025-02-14T10:00:00Z'); // 금요일 (2025-02-14)
    vi.setSystemTime(mockDate);

    const flyer = await getLatestFlyerSource('emart');

    expect(flyer.martName).toBe('이마트');
    expect(flyer.branchName).toBe('이마트 역삼점');
    expect(flyer.flyerTitle).toContain('이마트 2025-02-13 목요 e-전단 특가대전');
    expect(flyer.validPeriod).toEqual({
      startDate: '2025-02-13',
      endDate: '2025-02-19',
    });
    expect(flyer.imageUrls.length).toBeGreaterThan(0);
  });

  it('홈플러스 브랜드 검색 시 홈플러스 전단 정보를 반환해야 한다', async () => {
    const mockDate = new Date('2025-02-12T10:00:00Z'); // 수요일 (2025-02-12)
    vi.setSystemTime(mockDate);

    const flyer = await getLatestFlyerSource('홈플러스');

    expect(flyer.martName).toBe('홈플러스');
    expect(flyer.branchName).toBe('홈플러스 스페셜 강남점');
    // 수요일인 경우 직전 목요일은 2025-02-06
    expect(flyer.validPeriod).toEqual({
      startDate: '2025-02-06',
      endDate: '2025-02-12',
    });
  });

  it('롯데마트 브랜드 검색 시 롯데마트 전단 정보를 반환해야 한다', async () => {
    const mockDate = new Date('2025-02-13T10:00:00Z'); // 목요일 (2025-02-13)
    vi.setSystemTime(mockDate);

    const flyer = await getLatestFlyerSource('lotte');

    expect(flyer.martName).toBe('롯데마트');
    expect(flyer.branchName).toBe('롯데마트 서초점');
    expect(flyer.validPeriod).toEqual({
      startDate: '2025-02-13',
      endDate: '2025-02-19',
    });
  });

  it('알 수 없는 매장명인 경우 기본 fallback 전단 정보를 반환해야 한다', async () => {
    const flyer = await getLatestFlyerSource('unknown-mart');

    expect(flyer.martId).toBe('unknown-mart');
    expect(flyer.martName).toBe('이마트');
    expect(flyer.branchName).toBe('이마트 대표지점');
  });
});
