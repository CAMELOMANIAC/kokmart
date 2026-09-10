import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateDistanceKm, MartStore, mockMartStores } from '@kokmart/shared';
import { FullMapViewer } from '../components/FullMapViewer';
import { StoreBottomSheet } from '../components/StoreBottomSheet';
import { useSelectedStoreStore } from '../store/useSelectedStoreStore';
import { pageWrapper, topStatusVignette } from './KokHome.css';
import { FloatingTopBar } from '../components/FloatingTopBar';
import { useNavigate } from '@tanstack/react-router';
import { setViewTransitionDirection } from '../utils/transition';
import { searchNearbyMarts, searchMartsByKeyword } from '../services/kakaoPlaces';

interface KokHomeProps {
  onNavigateTab?: (tab: string) => void;
}

export const KokHome: React.FC<KokHomeProps> = ({ onNavigateTab }) => {
  const navigate = useNavigate();
  // 내 현재 위치 (기본값: 강남구 역삼)
  const myLocation = useMemo(() => ({ lat: 37.5006, lng: 127.0364 }), []);

  // 초기 상태는 Mock 데이터로 안전하게 렌더링하고, 카카오맵 API 로드 시 실시간 데이터로 교체
  const [stores, setStores] = useState<MartStore[]>(() =>
    mockMartStores
      .map((store: MartStore) => ({
        ...store,
        distanceKm: calculateDistanceKm(myLocation.lat, myLocation.lng, store.lat, store.lng)
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
  );
  const [isLoading, setIsLoading] = useState(false);

  const { selectedStores, activeStoreId, toggleStoreSelection, setActiveStoreId } = useSelectedStoreStore();

  // 1. 카카오맵 SDK 로드 후 내 위치 주변 대형마트(카테고리 MT1) 실시간 검색
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    searchNearbyMarts(myLocation, 6000)
      .then((results) => {
        if (isMounted && results.length > 0) {
          setStores(results);
        }
      })
      .catch((err) => {
        console.warn('[KokHome] 카카오맵 주변 마트 검색 실패 (기본값 유지):', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [myLocation]);

  // 2. 바텀시트 검색창 키워드 검색 핸들러
  const handleSearch = useCallback(
    (keyword: string) => {
      setIsLoading(true);
      searchMartsByKeyword(keyword, myLocation)
        .then((results) => {
          setStores(results);
          // 검색 결과가 존재하고 키워드가 입력되었으면 첫 번째 매장으로 지도 중심 포커스
          if (results.length > 0 && keyword.trim()) {
            setActiveStoreId(results[0].id);
          }
        })
        .catch((err) => {
          console.warn('[KokHome] 키워드 마트 검색 실패:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [myLocation, setActiveStoreId]
  );

  const handleSelectStore = (store: MartStore) => {
    setActiveStoreId(store.id);
    toggleStoreSelection(store);
  };

  return (
    <div className={pageWrapper}>
      {/* iOS black-translucent 상태표시줄 가독성을 위한 상단 소프트 비네팅 (지도는 그대로 투명하게 비침) */}
      <div className={topStatusVignette} />

      {/* 1. 상단 플로팅 바 (공통 컴포넌트) */}
      <FloatingTopBar isHome />

      {/* 2. 전체화면 인터랙티브 맵 뷰어 */}
      <FullMapViewer
        stores={stores}
        selectedStoreIds={selectedStores.map((s) => s.id)}
        activeStoreId={activeStoreId}
        onSelectStore={handleSelectStore}
        myLat={myLocation.lat}
        myLng={myLocation.lng}
      />

      {/* 3. 드래그 제스처 바텀시트 */}
      <StoreBottomSheet
        stores={stores}
        onSearch={handleSearch}
        isLoading={isLoading}
        onGoToFlyerTab={() => {
          if (onNavigateTab) {
            onNavigateTab('dding');
          }
          setViewTransitionDirection('forward');
          navigate({ to: '/dding', viewTransition: true });
        }}
      />
    </div>
  );
};
