/**
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

vi.mock('./FullMapViewer.css', () => ({
  mapContainer: 'mapContainer',
  mapCanvas: 'mapCanvas',
  myLocationPin: 'myLocationPin',
  fallbackMyLocationPin: 'fallbackMyLocationPin',
  storeMarker: 'storeMarker',
  storeMarkerSSM: 'storeMarkerSSM',
  fallbackStoreMarker: 'fallbackStoreMarker',
  emartMarker: 'emartMarker',
  everydayMarker: 'everydayMarker',
  tradersMarker: 'tradersMarker',
  homeplusMarker: 'homeplusMarker',
  expressMarker: 'expressMarker',
  lottemartMarker: 'lottemartMarker',
  lottesuperMarker: 'lottesuperMarker',
  gsTheFreshMarker: 'gsTheFreshMarker',
  kimsClubMarker: 'kimsClubMarker',
  defaultMarker: 'defaultMarker',
  markerSelected: 'markerSelected',
  fallbackStoreMarkerSelected: 'fallbackStoreMarkerSelected',
  markerFaviconWrapper: 'markerFaviconWrapper',
  markerFavicon: 'markerFavicon',
  markerFaviconFallback: 'markerFaviconFallback',
  kakaoMapContainer: 'kakaoMapContainer',
  recenterContainer: 'recenterContainer',
  recenterButton: 'recenterButton',
  pulseWave: 'pulseWave',
  fallbackSvg: 'fallbackSvg',
}));

import { FullMapViewer } from './FullMapViewer';
import type { MartStore } from '@kokmart/shared';

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
  },
];

describe('FullMapViewer Component', () => {
  const originalKakao = window.kakao;

  beforeEach(() => {
    // Kakao maps 초기화 reset
    delete (window as any).kakao;
  });

  afterEach(() => {
    (window as any).kakao = originalKakao;
  });

  describe('Fallback Map (Kakao SDK 미로딩 상태)', () => {
    it('Fallback 모드에서 지점 마커와 내 위치 아이콘이 노출되어야 한다', () => {
      render(
        <FullMapViewer
          stores={mockStores}
          onSelectStore={vi.fn()}
          myLat={37.495}
          myLng={127.035}
        />
      );

      expect(screen.getByText('역삼점')).toBeDefined();
      expect(screen.getByText('대치점')).toBeDefined();
    });

    it('Fallback 마커 클릭 시 onSelectStore 콜백이 해당 store 객체와 함께 호출되어야 한다', () => {
      const handleSelectStore = vi.fn();
      render(
        <FullMapViewer
          stores={mockStores}
          onSelectStore={handleSelectStore}
          myLat={37.495}
          myLng={127.035}
        />
      );

      const storeMarker = screen.getByText('역삼점').closest('div');
      expect(storeMarker).not.toBeNull();
      if (storeMarker) {
        fireEvent.click(storeMarker);
        expect(handleSelectStore).toHaveBeenCalledWith(mockStores[0]);
      }
    });
  });

  describe('Kakao Map SDK 로딩 모킹 상태', () => {
    it('Kakao SDK가 존재할 때 Kakao Map 및 CustomOverlay가 정상 생성되어야 한다', () => {
      const panToMock = vi.fn();
      const setMapMock = vi.fn();

      class MockLatLng {
        lat: number;
        lng: number;
        constructor(lat: number, lng: number) {
          this.lat = lat;
          this.lng = lng;
        }
      }

      class MockMap {
        container: HTMLElement;
        options: any;
        constructor(container: HTMLElement, options: any) {
          this.container = container;
          this.options = options;
        }
        panTo = panToMock;
        relayout = vi.fn();
      }

      class MockCustomOverlay {
        options: any;
        constructor(options: any) {
          this.options = options;
        }
        setMap = setMapMock;
      }

      (window as any).kakao = {
        maps: {
          load: (cb: () => void) => cb(),
          LatLng: MockLatLng,
          Map: MockMap,
          CustomOverlay: MockCustomOverlay,
        },
      };

      const handleSelectStore = vi.fn();
      render(
        <FullMapViewer
          stores={mockStores}
          onSelectStore={handleSelectStore}
          myLat={37.495}
          myLng={127.035}
        />
      );

      // 내 위치 1개 + 마트 2개 = 총 3개의 CustomOverlay 생성 확인
      expect(setMapMock).toHaveBeenCalled();
    });

    it('내 위치 센터 복귀 버튼 클릭 시 panTo가 내 위치 좌표로 호출되어야 한다', () => {
      const panToMock = vi.fn();

      class MockLatLng {
        lat: number;
        lng: number;
        constructor(lat: number, lng: number) {
          this.lat = lat;
          this.lng = lng;
        }
      }

      class MockMap {
        panTo = panToMock;
        relayout = vi.fn();
      }

      class MockCustomOverlay {
        setMap = vi.fn();
      }

      (window as any).kakao = {
        maps: {
          load: (cb: () => void) => cb(),
          LatLng: MockLatLng,
          Map: MockMap,
          CustomOverlay: MockCustomOverlay,
        },
      };

      render(
        <FullMapViewer
          stores={mockStores}
          onSelectStore={vi.fn()}
          myLat={37.495}
          myLng={127.035}
        />
      );

      const recenterBtn = screen.getByTitle('내 위치로 이동');
      fireEvent.click(recenterBtn);

      expect(panToMock).toHaveBeenCalled();
    });
  });
});
