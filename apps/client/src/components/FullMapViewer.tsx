import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MartStore } from '@kokmart/shared';
import {
  mapContainer,
  mapCanvas,
  myLocationPin,
  storeMarker,
  emartMarker,
  homeplusMarker,
  lottemartMarker,
  markerSelected,
  kakaoMapContainer,
  recenterContainer,
  recenterButton,
  pulseWave,
  fallbackSvg
} from './FullMapViewer.css';
import { MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import type { KakaoMap, KakaoCustomOverlay } from '../types/kakao';

interface FullMapViewerProps {
  stores: MartStore[];
  selectedStoreIds?: string[];
  selectedStoreId?: string | null;
  activeStoreId?: string | null;
  onSelectStore: (store: MartStore) => void;
  myLat: number;
  myLng: number;
}

const getMarkerStyle = (brand: string) => {
  if (brand === '이마트') return emartMarker;
  if (brand === '홈플러스') return homeplusMarker;
  return lottemartMarker;
};

export const FullMapViewer: React.FC<FullMapViewerProps> = ({
  stores,
  selectedStoreIds,
  selectedStoreId,
  activeStoreId,
  onSelectStore,
  myLat,
  myLng
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<KakaoMap | null>(null);
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);

  const selectedIds = useMemo(
    () => selectedStoreIds ?? (selectedStoreId ? [selectedStoreId] : []),
    [selectedStoreIds, selectedStoreId]
  );
  const currentActiveId = activeStoreId ?? (selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null);

  // 1. 카카오맵 SDK 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        if (!mapContainerRef.current) return;

        const options = {
          center: new window.kakao!.maps.LatLng(myLat, myLng),
          level: 4
        };

        const map = new window.kakao!.maps.Map(mapContainerRef.current, options);
        mapInstanceRef.current = map;
        setIsKakaoLoaded(true);
      });
    }
  }, [myLat, myLng]);

  // 2. 마트 마커 및 내 위치 핀 CustomOverlay 렌더링
  useEffect(() => {
    const kakao = window.kakao;
    const map = mapInstanceRef.current;
    if (!map || !kakao?.maps) return;
    const kakaoMaps = kakao.maps;

    // 기존 오버레이 정리
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    // 내 위치 펄스 핀
    const myLocationEl = document.createElement('div');
    myLocationEl.className = myLocationPin;
    const pulseEl = document.createElement('div');
    pulseEl.className = pulseWave;
    myLocationEl.appendChild(pulseEl);

    const myOverlay = new kakaoMaps.CustomOverlay({
      position: new kakaoMaps.LatLng(myLat, myLng),
      content: myLocationEl,
      yAnchor: 0.5,
      xAnchor: 0.5,
      zIndex: 10
    });
    myOverlay.setMap(map);
    overlaysRef.current.push(myOverlay);

    // 대형마트 3사 마커
    stores.forEach((store) => {
      const isSelected = selectedIds.includes(store.id);
      const isFocused = currentActiveId === store.id;
      const brandClass = getMarkerStyle(store.brand);

      const markerEl = document.createElement('div');
      markerEl.className = `${storeMarker} ${brandClass} ${isSelected ? markerSelected : ''}`;

      const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('width', '13');
      iconSvg.setAttribute('height', '13');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('fill', 'none');
      iconSvg.setAttribute('stroke', 'currentColor');
      iconSvg.setAttribute('stroke-width', '2.5');
      iconSvg.setAttribute('stroke-linecap', 'round');
      iconSvg.setAttribute('stroke-linejoin', 'round');
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0');
      const circleEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleEl.setAttribute('cx', '12');
      circleEl.setAttribute('cy', '10');
      circleEl.setAttribute('r', '3');
      iconSvg.appendChild(pathEl);
      iconSvg.appendChild(circleEl);
      markerEl.appendChild(iconSvg);

      const textSpan = document.createElement('span');
      textSpan.textContent = store.name;
      markerEl.appendChild(textSpan);

      markerEl.addEventListener('click', () => {
        onSelectStore(store);
      });

      const storeOverlay = new kakaoMaps.CustomOverlay({
        position: new kakaoMaps.LatLng(store.lat, store.lng),
        content: markerEl,
        yAnchor: 1.0,
        xAnchor: 0.5,
        zIndex: isFocused ? 30 : isSelected ? 20 : 12
      });

      storeOverlay.setMap(map);
      overlaysRef.current.push(storeOverlay);
    });
  }, [stores, selectedIds, currentActiveId, myLat, myLng, onSelectStore, isKakaoLoaded]);

  // 3. 최근 활성화된 마트 변경 시 해당 좌표로 부드럽게 이동
  useEffect(() => {
    const kakao = window.kakao;
    const map = mapInstanceRef.current;
    if (!map || !kakao?.maps || !currentActiveId) return;

    const targetStore = stores.find((s) => s.id === currentActiveId);
    if (targetStore) {
      map.panTo(new kakao.maps.LatLng(targetStore.lat, targetStore.lng));
    }
  }, [currentActiveId, stores]);

  // 4. 내 위치로 이동 버튼 핸들러
  const handleRecenter = () => {
    const kakao = window.kakao;
    const map = mapInstanceRef.current;
    if (map && kakao?.maps) {
      map.panTo(new kakao.maps.LatLng(myLat, myLng));
    }
  };

  // 모의 지도용 좌표 계산기 (카카오 SDK 미로딩 시 Fallback 전용)
  const centerLat = 37.495;
  const centerLng = 127.035;
  const getPixelCoord = (lat: number, lng: number) => {
    const scale = 14000;
    const x = (lng - centerLng) * scale;
    const y = (centerLat - lat) * scale;
    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`
    };
  };

  return (
    <div className={mapContainer}>
      {/* 실제 카카오 지도 캔버스 컨테이너 */}
      <div ref={mapContainerRef} className={kakaoMapContainer} />

      {/* 카카오 SDK 로딩 전 또는 실패 시 노출되는 가상 지도 Fallback */}
      {!isKakaoLoaded && (
        <>
          <svg className={fallbackSvg} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
                <rect x="15" y="15" width="50" height="50" rx="8" fill="#CBD5E1" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <path d="M -100 280 Q 240 320 600 300" fill="none" stroke="#FFFFFF" strokeWidth="16" />
            <path d="M 240 -100 Q 250 400 240 900" fill="none" stroke="#FFFFFF" strokeWidth="20" />
          </svg>

          <div className={mapCanvas}>
            <div style={getPixelCoord(myLat, myLng)} className={myLocationPin}>
              <motion.div
                animate={{ scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                className={pulseWave}
              />
            </div>

            {stores.map((store) => {
              const isSelected = selectedIds.includes(store.id);
              const pos = getPixelCoord(store.lat, store.lng);

              return (
                <motion.div
                  key={store.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectStore(store)}
                  className={`${storeMarker} ${getMarkerStyle(store.brand)} ${
                    isSelected ? markerSelected : ''
                  }`}
                  style={pos}
                >
                  <MapPin size={14} />
                  <span>{store.name}</span>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* 우측 상단 내 위치 센터 복귀 플로팅 버튼 */}
      <div className={recenterContainer}>
        <button
          onClick={handleRecenter}
          className={recenterButton}
          title="내 위치로 이동"
        >
          <Navigation size={18} color="#FF5E00" />
        </button>
      </div>
    </div>
  );
};
