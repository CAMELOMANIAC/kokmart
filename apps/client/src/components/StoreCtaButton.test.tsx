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

vi.mock('./StoreCtaButton.css', () => ({
  ctaButton: 'ctaButton',
  ctaContentLeft: 'ctaContentLeft',
  ctaIcon: 'ctaIcon',
  ctaTextWrapper: 'ctaTextWrapper',
  ctaAnimatedContent: 'ctaAnimatedContent',
  ctaBadgeCount: 'ctaBadgeCount',
}));

import { StoreCtaButton, getCtaButtonInfo } from './StoreCtaButton';
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

describe('StoreCtaButton - Helper & Component Tests', () => {
  describe('getCtaButtonInfo Helper Test', () => {
    it('선택된 마트가 없을 때 null을 반환해야 한다', () => {
      const info = getCtaButtonInfo([]);
      expect(info).toBeNull();
    });

    it('1개의 마트가 선택되었을 때 단일 마트 전단 보기 문구를 반환해야 한다', () => {
      const info = getCtaButtonInfo([mockStoreA]);
      expect(info).not.toBeNull();
      expect(info?.count).toBe(1);
      expect(info?.text).toBe('이마트 역삼점 전단 보기');
    });

    it('2개 이상의 마트가 선택되었을 때 전단 비교하기 문구와 선택 개수를 반환해야 한다', () => {
      const info = getCtaButtonInfo([mockStoreA, mockStoreB]);
      expect(info).not.toBeNull();
      expect(info?.count).toBe(2);
      expect(info?.text).toBe('이마트 역삼점 외 1곳 전단 비교하기');
    });

    it('displayName이 없을 경우 name 필드를 폴백으로 사용해야 한다', () => {
      const storeWithoutDisplayName: MartStore = {
        ...mockStoreA,
        displayName: undefined,
      };
      const info = getCtaButtonInfo([storeWithoutDisplayName]);
      expect(info?.text).toBe('이마트 역삼점 전단 보기');
    });
  });

  describe('StoreCtaButton Component Test', () => {
    it('선택된 마트가 없을 경우 아무것도 렌더링되지 않아야 한다', () => {
      const { container } = render(
        <StoreCtaButton selectedStores={[]} onClick={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('선택된 마트가 있을 경우 문구가 정상 노출되어야 한다', () => {
      render(
        <StoreCtaButton selectedStores={[mockStoreA]} onClick={vi.fn()} />
      );
      expect(screen.getByText('이마트 역삼점 전단 보기')).toBeDefined();
    });

    it('버튼을 클릭하면 onClick 콜백이 호출되어야 한다', () => {
      const handleClick = vi.fn();
      render(
        <StoreCtaButton selectedStores={[mockStoreA, mockStoreB]} onClick={handleClick} />
      );

      const button = screen.getByText('이마트 역삼점 외 1곳 전단 비교하기').closest('button');
      expect(button).not.toBeNull();
      if (button) {
        fireEvent.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });
  });
});
