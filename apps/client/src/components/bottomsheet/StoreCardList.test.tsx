/**
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

if (typeof Element !== 'undefined' && Element.prototype.animate) {
  Element.prototype.animate = vi.fn().mockReturnValue({
    cancel: vi.fn(),
    finish: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    reverse: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

import { StoreCardList } from './StoreCardList';
import type { MartStore } from '@kokmart/shared';

// Mock CSS modules
vi.mock('./StoreCardList.css', () => ({
  cardListContainer: 'cardListContainer',
  storeCard: 'storeCard',
  storeCardActive: 'storeCardActive',
  cardHeader: 'cardHeader',
  cardTitleRow: 'cardTitleRow',
  cardTitle: 'cardTitle',
  cardDistanceRow: 'cardDistanceRow',
  cardDistance: 'cardDistance',
  cardInfoSection: 'cardInfoSection',
  cardInfoRow: 'cardInfoRow',
  cardFooter: 'cardFooter',
  cardDealBadge: 'cardDealBadge',
  cardDealButton: 'cardDealButton',
  cardCheckIcon: 'cardCheckIcon',
  emptyMessage: 'emptyMessage',
}));

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

const mockStores: MartStore[] = [
  {
    id: 'store-1',
    name: '이마트 역삼점',
    displayName: '역삼점',
    brand: '이마트',
    storeType: 'hypermarket',
    lat: 37.499,
    lng: 127.047,
    address: '서울시 강남구 역삼동',
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

describe('StoreCardList - Unit Tests', () => {
  it('isLoading이 true이고 목록이 비어있으면 검색 중 메시지를 표시해야 한다', () => {
    render(
      <StoreCardList
        stores={[]}
        isLoading={true}
        isStoreSelected={() => false}
        toggleStoreSelection={vi.fn()}
        onGoToFlyerTab={vi.fn()}
      />
    );

    expect(screen.getByText('마트 정보를 검색 중입니다...')).toBeDefined();
  });

  it('isLoading이 false이고 목록이 비어있으면 검색 결과 없음 메시지를 표시해야 한다', () => {
    render(
      <StoreCardList
        stores={[]}
        isLoading={false}
        isStoreSelected={() => false}
        toggleStoreSelection={vi.fn()}
        onGoToFlyerTab={vi.fn()}
      />
    );

    expect(screen.getByText('조건에 일치하는 마트 지점이 없습니다.')).toBeDefined();
  });

  it('마트 목록이 주어지면 마트 정보와 거리, 영업시간이 정상적으로 렌더링되어야 한다', () => {
    render(
      <StoreCardList
        stores={mockStores}
        isLoading={false}
        isStoreSelected={(id) => id === 'store-1'}
        toggleStoreSelection={vi.fn()}
        onGoToFlyerTab={vi.fn()}
      />
    );

    expect(screen.getByText('역삼점')).toBeDefined();
    expect(screen.getByText('강서점')).toBeDefined();
    expect(screen.getByText('0.5 km')).toBeDefined();
    expect(screen.getByText('1.2 km')).toBeDefined();
    expect(screen.getByText('오늘 영업: 10:00 - 23:00')).toBeDefined();
    expect(screen.getByText('진행 중인 전단 특가 15개')).toBeDefined();
  });

  it('마트 카드를 클릭하면 toggleStoreSelection 콜백이 호출되어야 한다', () => {
    const handleToggle = vi.fn();

    render(
      <StoreCardList
        stores={mockStores}
        isLoading={false}
        isStoreSelected={() => false}
        toggleStoreSelection={handleToggle}
        onGoToFlyerTab={vi.fn()}
      />
    );

    const card = screen.getByText('역삼점').closest('.storeCard');
    expect(card).not.toBeNull();
    if (card) {
      fireEvent.click(card);
      expect(handleToggle).toHaveBeenCalledWith(mockStores[0]);
    }
  });

  it('전단 보기 버튼을 클릭하면 이벤트 상위 전파가 중단되고 onGoToFlyerTab이 호출되어야 한다', () => {
    const handleToggle = vi.fn();
    const handleGoToFlyer = vi.fn();

    render(
      <StoreCardList
        stores={mockStores}
        isLoading={false}
        isStoreSelected={() => false}
        toggleStoreSelection={handleToggle}
        onGoToFlyerTab={handleGoToFlyer}
      />
    );

    const flyerButtons = screen.getAllByText('전단 보기');
    fireEvent.click(flyerButtons[0]);

    expect(handleGoToFlyer).toHaveBeenCalledTimes(1);
    expect(handleToggle).not.toHaveBeenCalled();
  });
});
