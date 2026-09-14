/**
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StorePillList } from './StorePillList';
import type { MartStore } from '@kokmart/shared';

// Mock css modules
vi.mock('./storeBadge.css', () => ({
  brandBadgeEmart: 'badge-emart',
  brandBadgeEveryday: 'badge-everyday',
  brandBadgeTraders: 'badge-traders',
  brandBadgeHomeplus: 'badge-homeplus',
  brandBadgeExpress: 'badge-express',
  brandBadgeLottemart: 'badge-lottemart',
  brandBadgeLottesuper: 'badge-lottesuper',
  brandBadgeGsTheFresh: 'badge-gsthefresh',
  brandBadgeKimsClub: 'badge-kimsclub',
  brandBadgeDefault: 'badge-default',
  brandDotEmart: 'dot-emart',
  brandDotEveryday: 'dot-everyday',
  brandDotTraders: 'dot-traders',
  brandDotHomeplus: 'dot-homeplus',
  brandDotExpress: 'dot-express',
  brandDotLottemart: 'dot-lottemart',
  brandDotLottesuper: 'dot-lottesuper',
  brandDotGsTheFresh: 'dot-gsthefresh',
  brandDotKimsClub: 'dot-kimsclub',
  brandDotDefault: 'dot-default',
}));

vi.mock('./StorePillList.css', () => ({
  pillListContainer: 'pillListContainer',
  storePill: 'storePill',
  storePillActive: 'storePillActive',
  storePillCheck: 'storePillCheck',
  storePillName: 'storePillName',
  storePillDistance: 'storePillDistance',
  emptyMessage: 'emptyMessage',
}));

const mockStores: MartStore[] = [
  {
    id: 'store-1',
    name: '이마트 역삼점',
    displayName: '역삼점',
    brand: '이마트',
    storeType: 'hypermarket',
    lat: 37.499,
    lng: 127.047,
    address: '서울시 강남구',
    phone: '02-1234-5678',
    businessHours: '10:00 - 23:00',
    isHolidayToday: false,
    activeDealCount: 15,
    distanceKm: 0.5,
  },
  {
    id: 'store-2',
    name: '홈플러스 강서점',
    displayName: '강서점',
    brand: '홈플러스',
    storeType: 'hypermarket',
    lat: 37.558,
    lng: 126.861,
    address: '서울시 강서구',
    phone: '02-8765-4321',
    businessHours: '10:00 - 24:00',
    isHolidayToday: false,
    activeDealCount: 8,
    distanceKm: 1.2,
  },
];

describe('StorePillList', () => {
  it('stores 목록이 비어있고 loading중이 아니면 안내 메시지를 표시해야 한다', () => {
    render(
      <StorePillList
        stores={[]}
        isLoading={false}
        isStoreSelected={() => false}
        toggleStoreSelection={() => {}}
      />
    );

    expect(screen.getByText('조건에 일치하는 마트가 없습니다.')).toBeDefined();
  });

  it('stores 목록이 비어있고 loading중이면 로딩 메시지를 표시해야 한다', () => {
    render(
      <StorePillList
        stores={[]}
        isLoading={true}
        isStoreSelected={() => false}
        toggleStoreSelection={() => {}}
      />
    );

    expect(screen.getByText('마트 정보를 검색 중입니다...')).toBeDefined();
  });

  it('stores 목록의 브랜드, 지점명, 거리가 올바르게 렌더링되어야 한다', () => {
    render(
      <StorePillList
        stores={mockStores}
        isLoading={false}
        isStoreSelected={() => false}
        toggleStoreSelection={() => {}}
      />
    );

    expect(screen.getByText('이마트')).toBeDefined();
    expect(screen.getByText('역삼점')).toBeDefined();
    expect(screen.getByText('0.5km')).toBeDefined();

    expect(screen.getByText('홈플러스')).toBeDefined();
    expect(screen.getByText('강서점')).toBeDefined();
    expect(screen.getByText('1.2km')).toBeDefined();
  });

  it('선택된 마트 클릭 시 toggleStoreSelection 콜백을 호출해야 한다', () => {
    const handleToggle = vi.fn();

    render(
      <StorePillList
        stores={mockStores}
        isLoading={false}
        isStoreSelected={(id) => id === 'store-1'}
        toggleStoreSelection={handleToggle}
      />
    );

    const firstPill = screen.getByText('역삼점').closest('div');
    expect(firstPill).not.toBeNull();
    if (firstPill) {
      fireEvent.click(firstPill);
    }

    expect(handleToggle).toHaveBeenCalledWith(mockStores[0]);
  });

  it('pointerDown 이벤트 시 stopPropagation을 호출하여 부모 바텀시트 터치 간섭을 방지해야 한다', () => {
    const { container } = render(
      <StorePillList
        stores={mockStores}
        isLoading={false}
        isStoreSelected={() => false}
        toggleStoreSelection={() => {}}
      />
    );

    const listContainer = container.firstChild as HTMLElement;
    const pointerDownEvent = new Event('pointerdown', { bubbles: true, cancelable: true });
    const stopPropagationSpy = vi.spyOn(pointerDownEvent, 'stopPropagation');

    listContainer.dispatchEvent(pointerDownEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
