import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion';
import type { MartStore, MartBrand } from '@kokmart/shared';
import { useUIStore } from '../store/useUIStore';
import { useSelectedStoreStore } from '../store/useSelectedStoreStore';
import { useSafeAreaInsets } from '../hooks/useSafeAreaInsets';
import {
  sheetContainer,
  dragHandleArea,
  dragHandleBar,
  pillViewWrapper,
  collapsedCtaWrapper,
  fullscreenCtaWrapper,
} from './StoreBottomSheet.css';
import { StoreCtaButton } from './StoreCtaButton';
import {
  StoreSearchFilterHeader,
  type CategoryFilter,
} from './bottomsheet/StoreSearchFilterHeader';
import { ALL_FILTER_BRANDS } from './bottomsheet/storeBadgeUtils';
import { StorePillList } from './bottomsheet/StorePillList';
import { StoreCardList } from './bottomsheet/StoreCardList';

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
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowH, setWindowH] = useState<number>(window.innerHeight);
  const { setBottomSheetFullscreen } = useUIStore();
  const { toggleStoreSelection, isStoreSelected, selectedStores } = useSelectedStoreStore();

  // 1. 검색어 상태 & 디바운스
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

  // 2. 필터 상태 (대분류, 영업중, 개별 브랜드)
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

  const toggleBrand = (brand: MartBrand) => {
    setSelectedBrands((prev) => ({
      ...prev,
      [brand]: prev[brand] === false ? true : false,
    }));
  };

  const isAnyFilterActive =
    onlyOpen ||
    selectedCategory !== 'all' ||
    ALL_FILTER_BRANDS.some((b) => selectedBrands[b] === false);

  // 3. 필터링된 매장 리스트 (메모이제이션)
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      // 1) 카테고리 필터
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

      // 2) 개별 브랜드 필터
      if (selectedBrands[s.brand] === false) return false;

      // 3) 영업중 필터
      if (onlyOpen && s.isHolidayToday) return false;

      return true;
    });
  }, [stores, selectedCategory, selectedBrands, onlyOpen]);

  // 4. 바텀시트 높이 & 모션 제어 (모바일 홈 인디케이터 안전영역 연동)
  const insets = useSafeAreaInsets();
  const hasSelected = selectedStores.length > 0;
  const baseVisibleHeight = 268;
  const defaultVisibleHeight =
    Math.min(
      hasSelected ? baseVisibleHeight + 56 : baseVisibleHeight,
      windowH * 0.48
    ) + insets.bottom;
  const defaultOffset = windowH - defaultVisibleHeight;
  const y = useMotionValue(defaultOffset);
  const [currentMode, setCurrentMode] = useState<SnapMode>('default');
  const isFullscreen = currentMode === 'fullscreen';

  useEffect(() => {
    if (currentMode === 'default') {
      animate(y, defaultOffset, {
        type: 'spring',
        stiffness: 380,
        damping: 32,
      });
    }
  }, [defaultOffset, currentMode, y]);

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
      damping: 32,
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

  return (
    <>
      <motion.div
        ref={containerRef}
        className={sheetContainer}
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: defaultOffset }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
      >
        {/* 드래그 핸들 */}
        <div
          className={dragHandleArea}
          onClick={() => {
            const currentY = y.get();
            snapTo(currentY > defaultOffset / 2 ? 'fullscreen' : 'default');
          }}
        >
          <div className={dragHandleBar} />
        </div>

        {/* 검색 및 필터 헤더 */}
        <StoreSearchFilterHeader
          searchQuery={searchQuery}
          isLoading={isLoading}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          onKeyDown={handleKeyDown}
          onFocus={() => snapTo('fullscreen')}
          isFilterOpen={isFilterOpen}
          onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
          isAnyFilterActive={isAnyFilterActive}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onlyOpen={onlyOpen}
          onToggleOnlyOpen={() => setOnlyOpen(!onlyOpen)}
          selectedBrands={selectedBrands}
          onToggleBrand={toggleBrand}
        />

        {/* 본문: 축소 모드 (알약 뷰) vs 확장 모드 (카드 리스트 뷰) */}
        <AnimatePresence mode="wait">
          {!isFullscreen ? (
            <motion.div
              key="pill-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={pillViewWrapper}
            >
              <StorePillList
                stores={filteredStores}
                isLoading={isLoading}
                isStoreSelected={isStoreSelected}
                toggleStoreSelection={toggleStoreSelection}
              />

              {/* 축소 상태 인라인 CTA 버튼 */}
              <AnimatePresence>
                {hasSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 8, height: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    className={collapsedCtaWrapper}
                  >
                    <StoreCtaButton
                      selectedStores={selectedStores}
                      onClick={onGoToFlyerTab}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <StoreCardList
              stores={filteredStores}
              isLoading={isLoading}
              isStoreSelected={isStoreSelected}
              toggleStoreSelection={toggleStoreSelection}
              onGoToFlyerTab={onGoToFlyerTab}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* 전체화면 확장 상태 하단 고정 CTA 버튼 */}
      <AnimatePresence>
        {isFullscreen && hasSelected && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 28,
            }}
            className={fullscreenCtaWrapper}
          >
            <StoreCtaButton
              selectedStores={selectedStores}
              onClick={onGoToFlyerTab}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
