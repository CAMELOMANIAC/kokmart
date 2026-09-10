import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal, Clock, Check, Loader2 } from 'lucide-react';
import type { MartBrand } from '@kokmart/shared';
import {
  sheetHeader,
  headerTopRow,
  searchBarWrapper,
  searchInput,
  searchClearButton,
  loadingSpinner,
  filterButton,
  filterButtonActive,
  filterPanelWrapper,
  filterPanel,
  filterCategoryRow,
  filterBrandRowScrollable,
  filterChip,
  filterChipActive,
  filterChipBrandActive,
} from './StoreSearchFilterHeader.css';
import { ALL_FILTER_BRANDS, getBrandDotClass } from './storeBadgeUtils';

export type CategoryFilter = 'all' | 'hypermarket' | 'ssm';

interface StoreSearchFilterHeaderProps {
  searchQuery: string;
  isLoading?: boolean;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  isAnyFilterActive: boolean;
  selectedCategory: CategoryFilter;
  onSelectCategory: (category: CategoryFilter) => void;
  onlyOpen: boolean;
  onToggleOnlyOpen: () => void;
  selectedBrands: Record<string, boolean>;
  onToggleBrand: (brand: MartBrand) => void;
}

export const StoreSearchFilterHeader: React.FC<StoreSearchFilterHeaderProps> = ({
  searchQuery,
  isLoading,
  onSearchChange,
  onClearSearch,
  onKeyDown,
  onFocus,
  isFilterOpen,
  onToggleFilter,
  isAnyFilterActive,
  selectedCategory,
  onSelectCategory,
  onlyOpen,
  onToggleOnlyOpen,
  selectedBrands,
  onToggleBrand,
}) => {
  return (
    <div className={sheetHeader}>
      <div className={headerTopRow}>
        <div className={searchBarWrapper}>
          <Search size={16} color="#9CA3AF" />
          <input
            type="text"
            className={searchInput}
            placeholder="마트 지점명 또는 동네 검색"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
          />
          {isLoading ? (
            <Loader2 size={16} color="#FF5E00" className={loadingSpinner} />
          ) : searchQuery ? (
            <button
              onClick={onClearSearch}
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
          onClick={onToggleFilter}
          className={`${filterButton} ${isFilterOpen || isAnyFilterActive ? filterButtonActive : ''}`}
        >
          <SlidersHorizontal
            size={17}
            color={isFilterOpen || isAnyFilterActive ? '#FFFFFF' : '#4B5563'}
          />
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
                  onClick={() => onSelectCategory('all')}
                >
                  <span>전체</span>
                </div>

                <div
                  className={`${filterChip} ${selectedCategory === 'hypermarket' ? filterChipActive : ''}`}
                  onClick={() =>
                    onSelectCategory(selectedCategory === 'hypermarket' ? 'all' : 'hypermarket')
                  }
                >
                  <span>대형마트</span>
                </div>

                <div
                  className={`${filterChip} ${selectedCategory === 'ssm' ? filterChipActive : ''}`}
                  onClick={() =>
                    onSelectCategory(selectedCategory === 'ssm' ? 'all' : 'ssm')
                  }
                >
                  <span>SSM·슈퍼</span>
                </div>

                <div
                  className={`${filterChip} ${onlyOpen ? filterChipActive : ''}`}
                  onClick={onToggleOnlyOpen}
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
                      onClick={() => onToggleBrand(brand)}
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
  );
};
