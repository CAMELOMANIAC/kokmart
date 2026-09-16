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

// Router mocks
const mockNavigate = vi.fn();
let mockPathname = '/';

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: mockPathname }),
  useNavigate: () => mockNavigate,
}));

vi.mock('./Navigation.css', () => ({
  navContainer: 'navContainer',
  navItem: 'navItem',
  navItemActive: 'navItemActive',
  activeIndicator: 'activeIndicator',
  iconWrapper: 'iconWrapper',
  iconInnerContainer: 'iconInnerContainer',
  tabBadge: 'tabBadge',
  labelSpan: 'labelSpan',
}));

import { Navigation } from './Navigation';
import { useUIStore } from '../store/useUIStore';
import { useSelectedStoreStore } from '../store/useSelectedStoreStore';
import type { MartStore } from '@kokmart/shared';

const mockStore: MartStore = {
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

describe('Navigation Component', () => {
  beforeEach(() => {
    mockPathname = '/';
    mockNavigate.mockClear();
    useUIStore.setState({ isBottomSheetFullscreen: false, isScrollingDown: false });
    useSelectedStoreStore.setState({ selectedStores: [] });
  });

  it('4개 GNB 탭 버튼(지도 콕, 전단 띵, 카트 띱, 반반 뿜)이 노출되어야 한다', () => {
    render(<Navigation />);
    expect(screen.getByText('지도 콕')).toBeDefined();
    expect(screen.getByText('전단 띵')).toBeDefined();
    expect(screen.getByText('카트 띱')).toBeDefined();
    expect(screen.getByText('반반 뿜')).toBeDefined();
  });

  it('선택된 마트가 존재할 경우 전단 띵 탭에 선택 개수 뱃지가 표시되어야 한다', () => {
    useSelectedStoreStore.setState({ selectedStores: [mockStore] });
    render(<Navigation />);
    expect(screen.getByText('1')).toBeDefined();
  });

  it('다른 탭 클릭 시 onTabChange 콜백과 navigate 함수가 호출되어야 한다', () => {
    const handleTabChange = vi.fn();
    render(<Navigation onTabChange={handleTabChange} />);

    const ddingTab = screen.getByText('전단 띵').closest('button');
    expect(ddingTab).not.toBeNull();
    if (ddingTab) {
      fireEvent.click(ddingTab);
      expect(handleTabChange).toHaveBeenCalledWith('dding');
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/dding', viewTransition: true });
    }
  });

  it('현재 위치와 동일한 탭을 클릭하면 navigate 함수는 호출되지 않아야 한다', () => {
    mockPathname = '/dding';
    render(<Navigation currentTab="dding" />);

    const ddingTab = screen.getByText('전단 띵').closest('button');
    if (ddingTab) {
      fireEvent.click(ddingTab);
      expect(mockNavigate).not.toHaveBeenCalled();
    }
  });
});
