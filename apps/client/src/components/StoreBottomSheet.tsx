import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion';
import { MartStore, MartBrand } from '@kokmart/shared';
import { useUIStore } from '../store/useUIStore';
import { useSelectedStoreStore } from '../store/useSelectedStoreStore';
import { useScrollDirection } from '../hooks/useScrollDirection';
import {
  sheetContainer,
  dragHandleArea,
  dragHandleBar,
  sheetHeader,
  headerTopRow,
  searchBarWrapper,
  searchInput,
  searchClearButton,
  filterButton,
  filterButtonActive,
  filterPanel,
  filterPanelWrapper,
  filterChip,
  filterChipActive,
  filterChipBrandActive,
  brandDotEmart,
  brandDotHomeplus,
  brandDotLottemart,
  brandBadgeEmart,
  brandBadgeHomeplus,
  brandBadgeLottemart,
  pillListContainer,
  storePill,
  storePillActive,
  storePillCheck,
  storePillName,
  storePillDistance,
  emptyMessage,
  cardListContainer,
  storeCard,
  storeCardActive,
  cardHeader,
  cardTitleRow,
  cardTitle,
  cardDistanceRow,
  cardDistance,
  cardInfoSection,
  cardInfoRow,
  cardFooter,
  cardDealBadge,
  cardDealButton
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
  // 전체화면 시 카드리스트 내부 스크롤 감지용 ref
  const cardListRef = useRef<HTMLDivElement>(null);
  const [windowH, setWindowH] = useState<number>(window.innerHeight);
  const { setBottomSheetFullscreen } = useUIStore();
  const { toggleStoreSelection, isStoreSelected } = useSelectedStoreStore();

  // 전체화면 카드리스트 스크롤 방향 감지 → isScrollingDown 업데이트
  useScrollDirection({ ref: cardListRef });
  
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

  const getBrandBadgeClass = (brand: string) => {
    if (brand === '이마트') return brandBadgeEmart;
    if (brand === '홈플러스') return brandBadgeHomeplus;
    return brandBadgeLottemart;
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
                className={searchClearButton}
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
              className={filterPanelWrapper}
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
                  <span className={brandDotEmart} />
                  <span>이마트</span>
                  {selectedBrands['이마트'] && <Check size={12} color="#EA580C" />}
                </div>

                <div
                  className={`${filterChip} ${selectedBrands['홈플러스'] ? filterChipBrandActive : ''}`}
                  onClick={() => toggleBrand('홈플러스')}
                >
                  <span className={brandDotHomeplus} />
                  <span>홈플러스</span>
                  {selectedBrands['홈플러스'] && <Check size={12} color="#EA580C" />}
                </div>

                <div
                  className={`${filterChip} ${selectedBrands['롯데마트'] ? filterChipBrandActive : ''}`}
                  onClick={() => toggleBrand('롯데마트')}
                >
                  <span className={brandDotLottemart} />
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
              <div className={emptyMessage}>
                조건에 일치하는 마트가 없습니다.
              </div>
            ) : (
              filteredStores.map((store) => {
                const isSelected = isStoreSelected(store.id);

                return (
                  <motion.div
                    key={store.id}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => toggleStoreSelection(store)}
                    className={`${storePill} ${isSelected ? storePillActive : ''}`}
                  >
                    <span className={getBrandBadgeClass(store.brand)}>
                      {store.brand}
                    </span>
                    <span className={storePillName}>
                      {store.name.replace(store.brand, '').trim()}
                    </span>
                    {store.distanceKm && (
                      <span className={storePillDistance}>
                        {store.distanceKm}km
                      </span>
                    )}
                    {isSelected && (
                      <Check size={14} className={storePillCheck} strokeWidth={2.5} />
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        ) : (
          /* 2. 확장 상태: 상세 카드 리스트 뷰 */
          <motion.div
            ref={cardListRef}
            key="card-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className={cardListContainer}
          >
            {filteredStores.length === 0 ? (
              <div className={emptyMessage}>
                조건에 일치하는 마트 지점이 없습니다.
              </div>
            ) : (
              filteredStores.map((store) => {
                const isSelected = isStoreSelected(store.id);

                return (
                  <motion.div
                    key={store.id}
                    layout
                    className={`${storeCard} ${isSelected ? storeCardActive : ''}`}
                    onClick={() => toggleStoreSelection(store)}
                  >
                    <div className={cardHeader}>
                      <div className={cardTitleRow}>
                        <span className={getBrandBadgeClass(store.brand)}>
                          {store.brand}
                        </span>
                        <h4 className={cardTitle}>
                          {store.name}
                        </h4>
                      </div>

                      <div className={cardDistanceRow}>
                        {store.distanceKm && (
                          <span className={cardDistance}>
                            {store.distanceKm} km
                          </span>
                        )}
                        {isSelected ? (
                          <CheckCircle2 size={20} className={storePillCheck} />
                        ) : (
                          <Circle size={20} color="#D1D5DB" />
                        )}
                      </div>
                    </div>

                    <div className={cardInfoSection}>
                      <div className={cardInfoRow}>
                        <Clock size={13} color="#9CA3AF" />
                        <span>오늘 영업: {store.businessHours}</span>
                      </div>
                      <div className={cardInfoRow}>
                        <MapPin size={13} color="#9CA3AF" />
                        <span>{store.address}</span>
                      </div>
                    </div>

                    {/* 하단 특가 정보 요약 및 전단 핫딜 연동 버튼 */}
                    <div className={cardFooter}>
                      <div className={cardDealBadge}>
                        <Zap size={14} color="#10B981" />
                        <span>진행 중인 전단 특가 {store.activeDealCount}개</span>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onGoToFlyerTab();
                        }}
                        className={cardDealButton}
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
