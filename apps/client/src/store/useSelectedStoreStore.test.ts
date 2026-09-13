import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectedStoreStore } from './useSelectedStoreStore';
import type { MartStore } from '@kokmart/shared';

const sampleStore1: MartStore = {
  id: 'store-1',
  name: '이마트 역삼점',
  brand: '이마트',
  lat: 37.498,
  lng: 127.027,
  address: '서울 강남구 역삼동',
  phone: '02-123-4567',
  businessHours: '10:00~23:00',
  isHolidayToday: false,
  activeDealCount: 10
};

const sampleStore2: MartStore = {
  id: 'store-2',
  name: '홈플러스 강남점',
  brand: '홈플러스',
  lat: 37.5,
  lng: 127.05,
  address: '서울 강남구 대치동',
  phone: '02-987-6543',
  businessHours: '10:00~24:00',
  isHolidayToday: false,
  activeDealCount: 8
};

describe('useSelectedStoreStore - Zustand 선택 매장 스토어', () => {
  beforeEach(() => {
    useSelectedStoreStore.getState().clearStoreSelection();
  });

  it('초기 선택 상태는 비어있어야 한다', () => {
    const { selectedStores, activeStoreId } = useSelectedStoreStore.getState();
    expect(selectedStores).toEqual([]);
    expect(activeStoreId).toBeNull();
  });

  it('toggleStoreSelection - 매장을 추가 및 토글 해제할 수 있어야 한다', () => {
    // 1회 추가
    useSelectedStoreStore.getState().toggleStoreSelection(sampleStore1);
    expect(useSelectedStoreStore.getState().selectedStores).toHaveLength(1);
    expect(useSelectedStoreStore.getState().activeStoreId).toBe('store-1');
    expect(useSelectedStoreStore.getState().isStoreSelected('store-1')).toBe(true);

    // 2번째 매장 추가
    useSelectedStoreStore.getState().toggleStoreSelection(sampleStore2);
    expect(useSelectedStoreStore.getState().selectedStores).toHaveLength(2);
    expect(useSelectedStoreStore.getState().activeStoreId).toBe('store-2');

    // 1번째 매장 토글 해제
    useSelectedStoreStore.getState().toggleStoreSelection(sampleStore1);
    expect(useSelectedStoreStore.getState().selectedStores).toHaveLength(1);
    expect(useSelectedStoreStore.getState().isStoreSelected('store-1')).toBe(false);
  });

  it('removeStoreSelection - id로 특정 매장을 선택 해제할 수 있어야 한다', () => {
    useSelectedStoreStore.getState().toggleStoreSelection(sampleStore1);
    useSelectedStoreStore.getState().toggleStoreSelection(sampleStore2);

    useSelectedStoreStore.getState().removeStoreSelection('store-2');
    expect(useSelectedStoreStore.getState().selectedStores).toHaveLength(1);
    expect(useSelectedStoreStore.getState().isStoreSelected('store-2')).toBe(false);
  });

  it('clearStoreSelection - 모든 선택 매장을 초기화해야 한다', () => {
    useSelectedStoreStore.getState().toggleStoreSelection(sampleStore1);
    useSelectedStoreStore.getState().clearStoreSelection();

    expect(useSelectedStoreStore.getState().selectedStores).toEqual([]);
    expect(useSelectedStoreStore.getState().activeStoreId).toBeNull();
  });
});
