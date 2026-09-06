import React, { useMemo } from 'react';
import { mockMartStores, calculateDistanceKm, MartStore } from '@kokmart/shared';
import { FullMapViewer } from '../components/FullMapViewer';
import { StoreBottomSheet } from '../components/StoreBottomSheet';
import { useSelectedStoreStore } from '../store/useSelectedStoreStore';
import { pageWrapper } from './KokHome.css';
import { FloatingTopBar } from '../components/FloatingTopBar';

interface KokHomeProps {
  onNavigateTab?: (tab: string) => void;
}

export const KokHome: React.FC<KokHomeProps> = ({ onNavigateTab }) => {
  // 내 현재 위치 (기본값: 강남구 역삼)
  const myLocation = { lat: 37.5006, lng: 127.0364 };

  const { selectedStores, toggleStoreSelection } = useSelectedStoreStore();

  // 내 위치로부터 거리 계산 및 정렬
  const nearbyStores = useMemo(() => {
    return mockMartStores
      .map((store: MartStore) => ({
        ...store,
        distanceKm: calculateDistanceKm(myLocation.lat, myLocation.lng, store.lat, store.lng)
      }))
      .sort((a, b) => ((a.distanceKm ?? 0) - (b.distanceKm ?? 0)));
  }, [myLocation.lat, myLocation.lng]);

  const handleSelectStore = (store: MartStore) => {
    toggleStoreSelection(store);
  };

  return (
    <div className={pageWrapper}>
      {/* 1. 상단 플로팅 바 (공통 컴포넌트) */}
      <FloatingTopBar isHome />

      {/* 2. 전체화면 인터랙티브 맵 뷰어 */}
      <FullMapViewer
        stores={nearbyStores}
        selectedStoreId={selectedStores[0]?.id || null}
        onSelectStore={handleSelectStore}
        myLat={myLocation.lat}
        myLng={myLocation.lng}
      />

      {/* 3. 드래그 제스처 바텀시트 */}
      <StoreBottomSheet
        stores={nearbyStores}
        onGoToFlyerTab={() => onNavigateTab && onNavigateTab('dding')}
      />
    </div>
  );
};
