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

vi.mock('./FloatingTopBar.css', () => ({
  topBarHome: 'topBarHome',
  topBarFull: 'topBarFull',
  topBarExpanded: 'topBarExpanded',
  topBarHeaderRow: 'topBarHeaderRow',
  topBarHeaderRowExpanded: 'topBarHeaderRowExpanded',
  brandTitleHome: 'brandTitleHome',
  pageTitle: 'pageTitle',
  locationTag: 'locationTag',
  chipsWrapper: 'chipsWrapper',
  selectedChipsScroll: 'selectedChipsScroll',
  topBarPill: 'topBarPill',
  removePillButton: 'removePillButton',
  expandToggleButton: 'expandToggleButton',
  expandToggleButtonActive: 'expandToggleButtonActive',
  expandedHeaderActions: 'expandedHeaderActions',
  storeCountBadge: 'storeCountBadge',
  clearAllButton: 'clearAllButton',
  expandedChipsGrid: 'expandedChipsGrid',
}));

import { FloatingTopBar } from './FloatingTopBar';
import { useSelectedStoreStore } from '../store/useSelectedStoreStore';
import type { MartStore } from '@kokmart/shared';

const mockStoreA: MartStore = {
  id: 'store-1',
  name: '이마트 역삼점',
  displayName: '이마트 역삼점',
  brand: '이마트',
  storeType: 'hypermarket',
  lat: 37.499,
  lng: 127.047,
  address: '서울시 강남구',
  phone: '02-1234-5678',
  businessHours: '10:00 - 23:00',
  isHolidayToday: false,
  activeDealCount: 15,
};

const mockStoreB: MartStore = {
  id: 'store-2',
  name: '홈플러스 강서점',
  displayName: '홈플러스 강서점',
  brand: '홈플러스',
  storeType: 'hypermarket',
  lat: 37.558,
  lng: 126.861,
  address: '서울시 강서구',
  phone: '02-8765-4321',
  businessHours: '10:00 - 24:00',
  isHolidayToday: false,
  activeDealCount: 8,
};

describe('FloatingTopBar Component', () => {
  beforeEach(() => {
    useSelectedStoreStore.setState({ selectedStores: [] });
  });

  it('isHome이 true일 때 브랜드 로고/타이틀이 노출되어야 한다', () => {
    render(<FloatingTopBar isHome={true} title="MartKok 🎯" />);
    expect(screen.getByText('MartKok 🎯')).toBeDefined();
  });

  it('isHome이 false일 때 페이지 타이틀이 노출되어야 한다', () => {
    render(<FloatingTopBar isHome={false} title="전단 띵" icon={<span data-testid="test-icon" />} />);
    expect(screen.getByText('전단 띵')).toBeDefined();
    expect(screen.getByTestId('test-icon')).toBeDefined();
  });

  it('선택된 마트가 없을 때 위치 태그가 노출되어야 한다', () => {
    render(<FloatingTopBar isHome={true} />);
    expect(screen.getByText('역삼동 주변 마트')).toBeDefined();
  });

  it('선택된 마트가 있을 때 브랜드명이 정제된 지점 칩이 노출되어야 한다', () => {
    useSelectedStoreStore.setState({ selectedStores: [mockStoreA] });

    render(<FloatingTopBar isHome={true} />);
    expect(screen.getByText('역삼점')).toBeDefined();
  });

  it('개별 칩의 삭제 버튼 클릭 시 removeStoreSelection 스토어 액션이 호출되어야 한다', () => {
    useSelectedStoreStore.setState({ selectedStores: [mockStoreA] });

    render(<FloatingTopBar isHome={true} />);
    const removeBtn = screen.getByTitle('선택 해제');
    fireEvent.click(removeBtn);

    expect(useSelectedStoreStore.getState().selectedStores).toHaveLength(0);
  });
});
