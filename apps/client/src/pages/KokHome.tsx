import React, { useState, useMemo } from 'react';
import { mockMartStores, calculateDistanceKm, MartStore } from '@kokmart/shared';
import { FullMapViewer } from '../components/FullMapViewer';
import { StoreBottomSheet } from '../components/StoreBottomSheet';
import { pageWrapper, floatingTopBar, brandTitle, locationTag } from './KokHome.css';
import { MapPin } from 'lucide-react';

interface KokHomeProps {
  onNavigateTab?: (tab: string) => void;
}

export const KokHome: React.FC<KokHomeProps> = ({ onNavigateTab }) => {
  // 내 현재 위치 (기본값: 강남구 역삼)
  const myLocation = { lat: 37.5006, lng: 127.0364 };

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(mockMartStores[0].id);

  // 내 위치로부터 거리 계산 및 정렬
  const nearbyStores = useMemo(() => {
    return mockMartStores
      .map((store) => ({
        ...store,
        distanceKm: calculateDistanceKm(myLocation.lat, myLocation.lng, store.lat, store.lng)
      }))
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }, [myLocation.lat, myLocation.lng]);

  const handleSelectStore = (store: MartStore) => {
    setSelectedStoreId(store.id);
  };

  return (
    <div className={pageWrapper}>
      {/* 1. 상단 플로팅 미니멀 바 */}
      <div className={floatingTopBar}>
        <div className={brandTitle}>Kokmart 🎯</div>
        <div className={locationTag}>
          <MapPin size={13} color="#FF5E00" />
          <span>역삼동 주변 마트</span>
        </div>
      </div>

      {/* 2. 전체화면 인터랙티브 맵 뷰어 */}
      <FullMapViewer
        stores={nearbyStores}
        selectedStoreId={selectedStoreId}
        onSelectStore={handleSelectStore}
        myLat={myLocation.lat}
        myLng={myLocation.lng}
      />

      {/* 3. 드래그 제스처 바텀시트 (가까운 지점 현황) */}
      <StoreBottomSheet
        stores={nearbyStores}
        selectedStoreId={selectedStoreId}
        onSelectStore={handleSelectStore}
        onGoToFlyerTab={() => onNavigateTab && onNavigateTab('dding')}
      />
    </div>
  );
};
