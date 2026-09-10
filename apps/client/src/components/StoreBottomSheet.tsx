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
  filterCategoryRow,
  filterBrandRowScrollable,
  filterPanelWrapper,
  filterChip,
  filterChipActive,
  filterChipBrandActive,
  brandDotEmart,
  brandDotEveryday,
  brandDotTraders,
  brandDotHomeplus,
  brandDotExpress,
  brandDotLottemart,
  brandDotLottesuper,
  brandDotGsTheFresh,
  brandDotKimsClub,
  brandDotDefault,
  brandBadgeEmart,
  brandBadgeEveryday,
  brandBadgeTraders,
  brandBadgeHomeplus,
  brandBadgeExpress,
  brandBadgeLottemart,
  brandBadgeLottesuper,
  brandBadgeGsTheFresh,
  brandBadgeKimsClub,
  brandBadgeDefault,
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
  cardDealButton,
  loadingSpinner
} from './StoreBottomSheet.css';
import { Clock, MapPin, ChevronRight, Zap, Search, X, SlidersHorizontal, Check, CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface StoreBottomSheetProps {
  stores: MartStore[];
  onGoToFlyerTab: () => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
}

type SnapMode = 'default' | 'fullscreen';

export const StoreBottomSheet: React.FC<StoreBottomSheetProps> = ({
  stores,
  onGoToFlyerTab,
  onSearch,
  isLoading
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
  const searchDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    searchDebounceTimer.current = setTimeout(() => {
      onSearch?.(val);
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    onSearch?.('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
      onSearch?.(searchQuery);
    }
  };

  useEffect(() => {
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, []);

  type CategoryFilter = 'all' | 'hypermarket' | 'ssm';

  const ALL_FILTER_BRANDS: MartBrand[] = [
    '이마트',
    '홈플러스',
    '롯데마트',
    '에브리데이',
    '익스프레스',
    '롯데슈퍼',
    'GS더프레시',
    '킴스클럽',
    '트레이더스'
  ];

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedBrands, setSelectedBrands] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ALL_FILTER_BRANDS.forEach((b) => {
      initial[b] = true;
    });
    return initial;
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
      [brand]: prev[brand] === false ? true : false
    }));
  };

  const getBranchName = (store: MartStore): string => {
    let name = store.name;
    name = name.replace(/이마트\s*에브리데이|이마트에브리데이/g, '');
    name = name.replace(/홈플러스\s*익스프레스|홈플러스익스프레스/g, '');
    name = name.replace(/트레이더스\s*홀세일\s*클럽|이마트\s*트레이더스/g, '');
    name = name.replace(/롯데슈퍼|롯데프레시|롯데마켓999/g, '');
    name = name.replace(/GS더프레시|GS더프레쉬|GS수퍼마켓|GS슈퍼마켓|GS슈퍼/gi, '');
    name = name.replace(/이마트|홈플러스|롯데마트|킴스클럽|노브랜드|하나로마트/g, '');
    const trimmed = name.trim();
    return trimmed || store.name;
  };

  const getBrandBadgeClass = (brand: MartBrand | string) => {
    switch (brand) {
      case '이마트':
        return brandBadgeEmart;
      case '에브리데이':
        return brandBadgeEveryday;
      case '트레이더스':
        return brandBadgeTraders;
      case '홈플러스':
        return brandBadgeHomeplus;
      case '익스프레스':
        return brandBadgeExpress;
      case '롯데마트':
        return brandBadgeLottemart;
      case '롯데슈퍼':
        return brandBadgeLottesuper;
      case 'GS더프레시':
        return brandBadgeGsTheFresh;
      case '킴스클럽':
        return brandBadgeKimsClub;
      default:
        return brandBadgeDefault;
    }
  };

  const getBrandDotClass = (brand: MartBrand | string) => {
    switch (brand) {
      case '이마트':
        return brandDotEmart;
      case '에브리데이':
        return brandDotEveryday;
      case '트레이더스':
        return brandDotTraders;
      case '홈플러스':
        return brandDotHomeplus;
      case '익스프레스':
        return brandDotExpress;
      case '롯데마트':
        return brandDotLottemart;
      case '롯데슈퍼':
        return brandDotLottesuper;
      case 'GS더프레시':
        return brandDotGsTheFresh;
      case '킴스클럽':
        return brandDotKimsClub;
      default:
        return brandDotDefault;
    }
  };

  // 대분류, 개별 브랜드 및 영업 여부 복합 필터링
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      // 1. 카테고리 필터
      if (selectedCategory === 'hypermarket') {
        const isHyper =
          s.storeType === 'hypermarket' ||
          s.storeType === 'warehouse' ||
          ['이마트', '홈플러스', '롯데마트', '트레이더스'].includes(s.brand);
        if (!isHyper) return false;
      } else if (selectedCategory === 'ssm') {
        const isSsm =
          s.storeType === 'ssm' ||
          ['에브리데이', '익스프레스', '롯데슈퍼', 'GS더프레시', '킴스클럽', '노브랜드'].includes(s.brand);
        if (!isSsm) return false;
      }

      // 2. 개별 브랜드 필터
      if (selectedBrands[s.brand] === false) return false;

      // 3. 영업중 필터
      if (onlyOpen && s.isHolidayToday) return false;

      return true;
    });
  }, [stores, selectedCategory, selectedBrands, onlyOpen]);

  const isAnyFilterActive =
    onlyOpen ||
    selectedCategory !== 'all' ||
    ALL_FILTER_BRANDS.some((b) => selectedBrands[b] === false);

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
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => snapTo('fullscreen')}
            />
            {isLoading ? (
              <Loader2 size={16} color="#FF5E00" className={loadingSpinner} />
            ) : searchQuery ? (
              <button
                onClick={handleClearSearch}
                className={searchClearButton}
                title="검색어 지우기"
              >
                <X size={15} color="#9CA3AF" />
              </button>
            ) : null}
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
                {/* 1행: 대분류 카테고리 탭 & 영업중 토글 */}
                <div className={filterCategoryRow}>
                  <div
                    className={`${filterChip} ${selectedCategory === 'all' ? filterChipActive : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    <span>전체</span>
                  </div>

                  <div
                    className={`${filterChip} ${selectedCategory === 'hypermarket' ? filterChipActive : ''}`}
                    onClick={() => setSelectedCategory((prev) => (prev === 'hypermarket' ? 'all' : 'hypermarket'))}
                  >
                    <span>대형마트</span>
                  </div>

                  <div
                    className={`${filterChip} ${selectedCategory === 'ssm' ? filterChipActive : ''}`}
                    onClick={() => setSelectedCategory((prev) => (prev === 'ssm' ? 'all' : 'ssm'))}
                  >
                    <span>SSM·슈퍼</span>
                  </div>

                  <div
                    className={`${filterChip} ${onlyOpen ? filterChipActive : ''}`}
                    onClick={() => setOnlyOpen(!onlyOpen)}
                  >
                    <Clock size={13} color={onlyOpen ? '#FFFFFF' : '#6B7280'} />
                    <span>영업중만</span>
                    {onlyOpen && <Check size={12} />}
                  </div>
                </div>

                {/* 2행: 가로 스크롤 개별 브랜드 칩 */}
                <div className={filterBrandRowScrollable}>
                  {ALL_FILTER_BRANDS.map((brand) => {
                    const isChecked = selectedBrands[brand] !== false;
                    return (
                      <div
                        key={brand}
                        className={`${filterChip} ${isChecked ? filterChipBrandActive : ''}`}
                        onClick={() => toggleBrand(brand)}
                      >
                        <span className={getBrandDotClass(brand)} />
                        <span>{brand}</span>
                        {isChecked && <Check size={12} color="#EA580C" />}
                      </div>
                    );
                  })}
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
                {isLoading ? '마트 정보를 검색 중입니다...' : '조건에 일치하는 마트가 없습니다.'}
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
                      {getBranchName(store)}
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
                {isLoading ? '마트 정보를 검색 중입니다...' : '조건에 일치하는 마트 지점이 없습니다.'}
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
                          {store.displayName || store.name}
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
