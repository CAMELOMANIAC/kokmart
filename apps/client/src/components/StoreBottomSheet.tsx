import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { MartStore } from '@kokmart/shared';
import { useUIStore } from '../store/useUIStore';
import {
  sheetContainer,
  dragHandleArea,
  dragHandleBar,
  sheetHeader,
  sheetContent,
  storeCard,
  storeCardActive
} from './StoreBottomSheet.css';
import { Clock, MapPin, ChevronRight, Zap, ChevronDown } from 'lucide-react';

interface StoreBottomSheetProps {
  stores: MartStore[];
  selectedStoreId: string | null;
  onSelectStore: (store: MartStore) => void;
  onGoToFlyerTab: () => void;
}

type SnapMode = 'default' | 'fullscreen';

export const StoreBottomSheet: React.FC<StoreBottomSheetProps> = ({
  stores,
  selectedStoreId,
  onSelectStore,
  onGoToFlyerTab
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowH, setWindowH] = useState<number>(window.innerHeight);
  const { setBottomSheetFullscreen } = useUIStore();

  // 기본 스냅 오프셋: 화면 하단 약 46vh 높이 유지 (GNB를 절대 가리지 않음)
  const defaultOffset = windowH * 0.54;
  const y = useMotionValue(defaultOffset);
  const [currentMode, setCurrentMode] = useState<SnapMode>('default');

  useEffect(() => {
    const onResize = () => setWindowH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const snapTo = (mode: SnapMode) => {
    const targetY = mode === 'fullscreen' ? 0 : defaultOffset;
    setCurrentMode(mode);
    // GNB 축소/확장 전역 상태 즉시 동기화
    setBottomSheetFullscreen(mode === 'fullscreen');

    animate(y, targetY, {
      type: 'spring',
      stiffness: 380,
      damping: 32
    });
  };

  const handleDragEnd = (_: any, info: any) => {
    const currentY = y.get();
    const velocityY = info.velocity.y;

    // 플릭 속도에 따른 즉시 전환
    if (velocityY < -300) {
      snapTo('fullscreen');
      return;
    } else if (velocityY > 300) {
      snapTo('default');
      return;
    }

    // 드래그 거리 기반 스냅 판단 (중간 지점 기준)
    if (currentY < defaultOffset / 2) {
      snapTo('fullscreen');
    } else {
      snapTo('default');
    }
  };

  const getBrandBadge = (brand: string) => {
    if (brand === '이마트') return { bg: '#FEF3C7', color: '#B45309' };
    if (brand === '홈플러스') return { bg: '#FEE2E2', color: '#B91C1C' };
    return { bg: '#FEE2E2', color: '#991B1B' };
  };

  const isFullscreen = currentMode === 'fullscreen';

  return (
    <motion.div
      ref={containerRef}
      className={sheetContainer}
      style={{ y }}
      drag="y"
      dragConstraints={{ top: 0, bottom: defaultOffset }}
      dragElastic={0.08}
      onDragEnd={handleDragEnd}
    >
      {/* 바텀시트 드래그 핸들 */}
      <div
        className={dragHandleArea}
        onClick={() => snapTo(isFullscreen ? 'default' : 'fullscreen')}
      >
        <div className={dragHandleBar} />
      </div>

      {/* 바텀시트 상단 타이틀 & 내리기 버튼 */}
      <div className={sheetHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>
            내 주변 마트 3사 지점
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#FF5E00',
              backgroundColor: '#FFF7ED',
              padding: '2px 8px',
              borderRadius: '12px'
            }}
          >
            {stores.length}곳 탐색
          </span>
        </div>

        {isFullscreen ? (
          <button
            onClick={() => snapTo('default')}
            style={{
              border: 'none',
              backgroundColor: '#F3F4F6',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronDown size={18} color="#4B5563" />
          </button>
        ) : (
          <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>
            위로 올려 전체보기
          </span>
        )}
      </div>

      {/* 바텀시트 내부 지점 카드 리스트 */}
      <div className={sheetContent}>
        {stores.map((store) => {
          const isSelected = selectedStoreId === store.id;
          const badge = getBrandBadge(store.brand);

          return (
            <div
              key={store.id}
              className={`${storeCard} ${isSelected ? storeCardActive : ''}`}
              onClick={() => onSelectStore(store)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800
                    }}
                  >
                    {store.brand}
                  </span>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#111827' }}>
                    {store.name}
                  </h4>
                </div>

                {store.distanceKm && (
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#FF5E00' }}>
                    {store.distanceKm} km
                  </span>
                )}
              </div>

              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#6B7280'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} color="#9CA3AF" />
                  <span>오늘 영업: {store.businessHours}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} color="#9CA3AF" />
                  <span>{store.address}</span>
                </div>
              </div>

              {/* 하단 특가 정보 요약 및 전단 핫딜 연동 버튼 */}
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid #F3F4F6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#059669'
                  }}
                >
                  <Zap size={14} color="#10B981" />
                  <span>진행 중인 전단 특가 {store.activeDealCount}개</span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoToFlyerTab();
                  }}
                  style={{
                    border: 'none',
                    backgroundColor: '#111827',
                    color: '#FFF',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span>전단 보기</span>
                  <ChevronRight size={13} />
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
