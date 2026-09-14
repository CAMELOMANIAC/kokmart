/**
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
import { StoreBottomSheet } from './StoreBottomSheet';
import { useUIStore } from '../store/useUIStore';
import { useSelectedStoreStore } from '../store/useSelectedStoreStore';
import type { MartStore } from '@kokmart/shared';

// Mock CSS files
vi.mock('./StoreBottomSheet.css', () => ({
  sheetContainer: 'sheetContainer',
  dragHandleArea: 'dragHandleArea',
  dragHandleBar: 'dragHandleBar',
  pillViewWrapper: 'pillViewWrapper',
  collapsedCtaWrapper: 'collapsedCtaWrapper',
  fullscreenCtaWrapper: 'fullscreenCtaWrapper',
}));

vi.mock('./StoreCtaButton.css', () => ({
  ctaButton: 'ctaButton',
  ctaContentLeft: 'ctaContentLeft',
  ctaIcon: 'ctaIcon',
  ctaTextWrapper: 'ctaTextWrapper',
  ctaAnimatedContent: 'ctaAnimatedContent',
  ctaBadgeCount: 'ctaBadgeCount',
}));

vi.mock('./bottomsheet/storeBadge.css', () => ({
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

vi.mock('./bottomsheet/StorePillList.css', () => ({
  pillListContainer: 'pillListContainer',
  storePill: 'storePill',
  storePillActive: 'storePillActive',
  storePillCheck: 'storePillCheck',
  storePillName: 'storePillName',
  storePillDistance: 'storePillDistance',
  emptyMessage: 'emptyMessage',
}));

vi.mock('./bottomsheet/StoreCardList.css', () => ({
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

vi.mock('./bottomsheet/StoreSearchFilterHeader.css', () => ({
  sheetHeader: 'sheetHeader',
  headerTopRow: 'headerTopRow',
  searchBarWrapper: 'searchBarWrapper',
  searchInput: 'searchInput',
  searchClearButton: 'searchClearButton',
  loadingSpinner: 'loadingSpinner',
  filterButton: 'filterButton',
  filterButtonActive: 'filterButtonActive',
  filterPanelWrapper: 'filterPanelWrapper',
  filterPanel: 'filterPanel',
  filterCategoryRow: 'filterCategoryRow',
  filterBrandRowScrollable: 'filterBrandRowScrollable',
  filterChip: 'filterChip',
  filterChipActive: 'filterChipActive',
  filterChipBrandActive: 'filterChipBrandActive',
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
    name: 'GS더프레시 대치점',
    displayName: '대치점',
    brand: 'GS더프레시',
    storeType: 'ssm',
    lat: 37.493,
    lng: 127.058,
    address: '서울시 강남구 대치동',
    phone: '02-555-1234',
    businessHours: '09:00 - 22:00',
    isHolidayToday: true,
    activeDealCount: 5,
    distanceKm: 0.9,
  },
];

describe('StoreBottomSheet - Integration Tests', () => {
  beforeEach(() => {
    useUIStore.setState({ isBottomSheetFullscreen: false });
    useSelectedStoreStore.setState({ selectedStores: [] });
  });

  it('기본 상태에서 Pill 뷰가 렌더링되고 마트 지점이 노출되어야 한다', () => {
    render(
      <StoreBottomSheet
        stores={mockStores}
        onGoToFlyerTab={vi.fn()}
      />
    );

    expect(screen.getByText('역삼점')).toBeDefined();
    expect(screen.getByText('대치점')).toBeDefined();
  });

  it('선택된 마트가 존재할 경우 하단 CTA 버튼이 렌더링되어야 한다', () => {
    useSelectedStoreStore.setState({ selectedStores: [mockStores[0]] });

    render(
      <StoreBottomSheet
        stores={mockStores}
        onGoToFlyerTab={vi.fn()}
      />
    );

    expect(screen.getByText('역삼점 전단 보기')).toBeDefined();
  });

  it('필터 버튼을 눌러 SSM 카테고리를 선택하면 SSM 마트만 필터링되어 노출되어야 한다', () => {
    const { container } = render(
      <StoreBottomSheet
        stores={mockStores}
        onGoToFlyerTab={vi.fn()}
      />
    );

    // 필터 버튼 클릭
    const buttons = container.querySelectorAll('button');
    const filterBtn = buttons[buttons.length - 1];
    fireEvent.click(filterBtn);

    // SSM/슈퍼 카테고리 필터 클릭
    const ssmChip = screen.getByText('SSM·슈퍼');
    fireEvent.click(ssmChip);

    // GS더프레시 대치점만 노출되고 이마트 역삼점은 노출되지 않아야 함
    expect(screen.queryByText('역삼점')).toBeNull();
    expect(screen.getByText('대치점')).toBeDefined();
  });

  it('영업중만 필터를 적용하면 휴무일인 마트(GS더프레시 대치점)는 목록에서 제외되어야 한다', () => {
    const { container } = render(
      <StoreBottomSheet
        stores={mockStores}
        onGoToFlyerTab={vi.fn()}
      />
    );

    // 필터 버튼 클릭
    const buttons = container.querySelectorAll('button');
    const filterBtn = buttons[buttons.length - 1];
    fireEvent.click(filterBtn);

    // 영업중만 클릭
    const onlyOpenChip = screen.getByText('영업중만');
    fireEvent.click(onlyOpenChip);

    expect(screen.getByText('역삼점')).toBeDefined();
    expect(screen.queryByText('대치점')).toBeNull();
  });
});
