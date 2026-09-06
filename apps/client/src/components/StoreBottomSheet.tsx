import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion';
import { MartStore, MartBrand } from '@kokmart/shared';
import { useUIStore } from '../store/useUIStore';
import { useSelectedStoreStore } from '../store/useSelectedStoreStore';
import {
  sheetContainer,
  dragHandleArea,
  dragHandleBar,
  sheetHeader,
  headerTopRow,
  searchBarWrapper,
  searchInput,
  filterButton,
  filterButtonActive,
  filterPanel,
  filterChip,
  filterChipActive,
  filterChipBrandActive,
  pillListContainer,
  storePill,
  storePillActive,
  cardListContainer,
  storeCard,
  storeCardActive
} from './StoreBottomSheet.css';
import { Clock, MapPin, ChevronRight, Zap, Search, X, SlidersHorizontal, Check, CheckCircle2, Circle } from 'lucide-react';

interface StoreBottomSheetProps {
  stores: MartStore[];
  onGoToFlyerTab: () => void;
}

type SnapMode = 'default' | 'fullscreen';

export const StoreBottomSheet: React.FC<StoreBottomSheetProps> = ({
  stores,
  onGoToFlyerTab
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowH, setWindowH] = useState<number>(window.innerHeight);
  const { setBottomSheetFullscreen } = useUIStore();
  const { toggleStoreSelection, isStoreSelected } = useSelectedStoreStore();
  
  // 검색어 & 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<Record<MartBrand, boolean>>({
    이마트: true,
    홈플러스: true,
    롯데마트: true
  });

  // 축소 상태 높이: 검색창 + 알약 2줄 + GNB 하단 여백을 편안히 담는 약 300px 노출 (상단 지도는 시원하게 확보)
  const defaultVisibleHeight = Math.min(320, windowH * 0.45);
  const defaultOffset = windowH - defaultVisibleHeight;
  const y = useMotionValue(defaultOffset);
  const [currentMode, setCurrentMode] = useState<SnapMode>('default');

  const isFullscreen = currentMode === 'fullscreen';

  useEffect(() => {
    const onResize = () => setWindowH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      setBottomSheetFullscreen(false);
    };
  }, [setBottomSheetFullscreen]);

  const snapTo = (mode: SnapMode) => {
    const targetY = mode === 'fullscreen' ? 0 : defaultOffset;
    setCurrentMode(mode);
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

    if (velocityY < -300) {
      snapTo('fullscreen');
      return;
    } else if (velocityY > 300) {
      snapTo('default');
      return;
    }

    if (currentY < defaultOffset / 2) {
      snapTo('fullscreen');
    } else {
      snapTo('default');
    }
  };

  const toggleBrand = (brand: MartBrand) => {
    setSelectedBrands((prev) => ({
      ...prev,
      [brand]: !prev[brand]
    }));
  };

  // 검색어 및 필터 복합 필터링
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      if (!selectedBrands[s.brand]) return false;
      if (onlyOpen && s.isHolidayToday) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(query);
        const matchBrand = s.brand.toLowerCase().includes(query);
        const matchAddress = s.address.toLowerCase().includes(query);
        if (!matchName && !matchBrand && !matchAddress) return false;
      }
      return true;
    });
  }, [stores, searchQuery, selectedBrands, onlyOpen]);

  const getBrandBadge = (brand: string) => {
    if (brand === '이마트') return { bg: '#FEF3C7', color: '#B45309' };
    if (brand === '홈플러스') return { bg: '#FEE2E2', color: '#B91C1C' };
    return { bg: '#FEE2E2', color: '#991B1B' };
  };

  const isAnyFilterActive = onlyOpen || !selectedBrands['이마트'] || !selectedBrands['홈플러스'] || !selectedBrands['롯데마트'];

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
        onClick={() => {
          const currentY = y.get();
          snapTo(currentY > defaultOffset / 2 ? 'fullscreen' : 'default');
        }}
      >
        <div className={dragHandleBar} />
      </div>

      {/* 바텀시트 헤더: 검색바 + 우측 필터 버튼 */}
      <div className={sheetHeader}>
        <div className={headerTopRow}>
          <div className={searchBarWrapper}>
            <Search size={16} color="#9CA3AF" />
            <input
              type="text"
              className={searchInput}
              placeholder="마트 지점명 또는 동네 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => snapTo('fullscreen')}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={15} color="#9CA3AF" />
              </button>
            )}
          </div>

          {/* 우측 필터 버튼 */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`${filterButton} ${isFilterOpen || isAnyFilterActive ? filterButtonActive : ''}`}
          >
            <SlidersHorizontal size={17} color={isFilterOpen || isAnyFilterActive ? '#FFFFFF' : '#4B5563'} />
          </motion.button>
        </div>

        {/* 필터 패널 */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className={filterPanel}>
                <div
                  className={`${filterChip} ${onlyOpen ? filterChipActive : ''}`}
                  onClick={() => setOnlyOpen(!onlyOpen)}
                >
                  <Clock size={13} color={onlyOpen ? '#FFFFFF' : '#6B7280'} />
                  <span>영업중만 보기</span>
                  {onlyOpen && <Check size={12} />}
                </div>

                <div
                  className={`${filterChip} ${selectedBrands['이마트'] ? filterChipBrandActive : ''}`}
                  onClick={() => toggleBrand('이마트')}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <span>이마트</span>
                  {selectedBrands['이마트'] && <Check size={12} color="#EA580C" />}
                </div>

                <div
                  className={`${filterChip} ${selectedBrands['홈플러스'] ? filterChipBrandActive : ''}`}
                  onClick={() => toggleBrand('홈플러스')}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  <span>홈플러스</span>
                  {selectedBrands['홈플러스'] && <Check size={12} color="#EA580C" />}
                </div>

                <div
                  className={`${filterChip} ${selectedBrands['롯데마트'] ? filterChipBrandActive : ''}`}
                  onClick={() => toggleBrand('롯데마트')}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
                  <span>롯데마트</span>
                  {selectedBrands['롯데마트'] && <Check size={12} color="#EA580C" />}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 바텀시트 본문: 축소 상태(알약 2줄 + Y스크롤 + 96px GNB 여백) vs 확장 상태(상세 카드 리스트) */}
      <AnimatePresence mode="wait">
        {!isFullscreen ? (
          /* 1. 축소 상태: 알약 2줄만 보이고 Y축 스크롤 */
          <motion.div
            key="pill-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={pillListContainer}
          >
            {filteredStores.length === 0 ? (
              <div style={{ textAlign: 'center', width: '100%', padding: '20px 0', color: '#9CA3AF', fontSize: '12px' }}>
                조건에 일치하는 마트가 없습니다.
              </div>
            ) : (
              filteredStores.map((store) => {
                const isSelected = isStoreSelected(store.id);
                const badge = getBrandBadge(store.brand);

                return (
                  <motion.div
                    key={store.id}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => toggleStoreSelection(store)}
                    className={`${storePill} ${isSelected ? storePillActive : ''}`}
                  >
                    <span
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800
                      }}
                    >
                      {store.brand}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>
                      {store.name.replace(store.brand, '').trim()}
                    </span>
                    {store.distanceKm && (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF5E00' }}>
                        {store.distanceKm}km
                      </span>
                    )}
                    {isSelected && <Check size={14} color="#FF5E00" strokeWidth={2.5} />}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        ) : (
          /* 2. 확장 상태: 상세 카드 리스트 뷰 */
          <motion.div
            key="card-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className={cardListContainer}
          >
            {filteredStores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: '13px' }}>
                조건에 일치하는 마트 지점이 없습니다.
              </div>
            ) : (
              filteredStores.map((store) => {
                const isSelected = isStoreSelected(store.id);
                const badge = getBrandBadge(store.brand);

                return (
                  <motion.div
                    key={store.id}
                    layout
                    className={`${storeCard} ${isSelected ? storeCardActive : ''}`}
                    onClick={() => toggleStoreSelection(store)}
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {store.distanceKm && (
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#FF5E00' }}>
                            {store.distanceKm} km
                          </span>
                        )}
                        {isSelected ? (
                          <CheckCircle2 size={20} color="#FF5E00" />
                        ) : (
                          <Circle size={20} color="#D1D5DB" />
                        )}
                      </div>
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
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
