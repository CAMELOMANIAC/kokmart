import React, { useRef, useState } from 'react';
import { MartStore } from '@kokmart/shared';
import {
  mapContainer,
  mapCanvas,
  myLocationPin,
  storeMarker,
  emartMarker,
  homeplusMarker,
  lottemartMarker,
  markerSelected
} from './FullMapViewer.css';
import { MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

interface FullMapViewerProps {
  stores: MartStore[];
  selectedStoreId: string | null;
  onSelectStore: (store: MartStore) => void;
  myLat: number;
  myLng: number;
}

export const FullMapViewer: React.FC<FullMapViewerProps> = ({
  stores,
  selectedStoreId,
  onSelectStore,
  myLat,
  myLng
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom] = useState(1);

  // 화면 중심 좌표를 기준으로 위경도를 픽셀 오프셋으로 변환 (카카오 SDK 미설정 시에도 인터랙티브 구동)
  const centerLat = 37.495;
  const centerLng = 127.035;

  const getPixelCoord = (lat: number, lng: number) => {
    const scale = 14000 * zoom;
    const x = (lng - centerLng) * scale;
    const y = (centerLat - lat) * scale;
    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`
    };
  };

  const getMarkerStyle = (brand: string) => {
    if (brand === '이마트') return emartMarker;
    if (brand === '홈플러스') return homeplusMarker;
    return lottemartMarker;
  };

  return (
    <div className={mapContainer} ref={containerRef}>
      {/* 지도 도로/블록 배경 그래픽 패턴 */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.28 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
            <rect x="15" y="15" width="50" height="50" rx="8" fill="#CBD5E1" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {/* 주요 도로 라인 표현 */}
        <path d="M -100 280 Q 240 320 600 300" fill="none" stroke="#FFFFFF" strokeWidth="16" />
        <path d="M 240 -100 Q 250 400 240 900" fill="none" stroke="#FFFFFF" strokeWidth="20" />
      </svg>

      <div className={mapCanvas}>
        {/* 내 현재 위치 펄스 핀 */}
        <div style={getPixelCoord(myLat, myLng)} className={myLocationPin}>
          <motion.div
            animate={{ scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: '50%',
              backgroundColor: '#3B82F6',
              opacity: 0.4
            }}
          />
        </div>

        {/* 대형마트 3사 핀 마커 */}
        {stores.map((store) => {
          const isSelected = selectedStoreId === store.id;
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

      {/* 우측 상단 내 위치 센터 복귀 플로팅 버튼 */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 30 }}>
        <button
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            boxSizing: 'border-box'
          }}
          title="내 위치로 이동"
        >
          <Navigation size={18} color="#FF5E00" />
        </button>
      </div>
    </div>
  );
};
