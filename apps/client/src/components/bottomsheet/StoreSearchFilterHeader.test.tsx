/**
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoreSearchFilterHeader } from './StoreSearchFilterHeader';

// Mock css modules & dependencies
vi.mock('./storeBadge.css', () => ({
  brandDotEmart: 'dot-emart',
  brandDotEveryday: 'dot-everyday',
  brandDotTraders: 'dot-traders',
  brandDotHomeplus: 'dot-homeplus',
  brandDotExpress: 'dot-express',
  brandDotLottemart: 'dot-lottemart',
  brandDotLottesuper: 'dot-lottesuper',
  brandDotGsTheFresh: 'dot-gsthefresh',
  brandDotKimsClub: 'dot-kimsclub',
  brandDotDefault: 'dot-default',
}));

vi.mock('./StoreSearchFilterHeader.css', () => ({
  sheetHeader: 'sheetHeader',
  headerTopRow: 'headerTopRow',
  searchBarWrapper: 'searchBarWrapper',
  searchInput: 'searchInput',
  searchClearButton: 'searchClearButton',
  loadingSpinner: 'loadingSpinner',
  filterButton: 'filterButton',
  filterButtonActive: 'filterButtonActive',
  filterPanelWrapper: 'filterPanelWrapper',
  filterPanel: 'filterPanel',
  filterCategoryRow: 'filterCategoryRow',
  filterBrandRowScrollable: 'filterBrandRowScrollable',
  filterChip: 'filterChip',
  filterChipActive: 'filterChipActive',
  filterChipBrandActive: 'filterChipBrandActive',
}));

describe('StoreSearchFilterHeader', () => {
  const defaultProps = {
    searchQuery: '',
    isLoading: false,
    onSearchChange: vi.fn(),
    onClearSearch: vi.fn(),
    onKeyDown: vi.fn(),
    onFocus: vi.fn(),
    isFilterOpen: false,
    onToggleFilter: vi.fn(),
    isAnyFilterActive: false,
    selectedCategory: 'all' as const,
    onSelectCategory: vi.fn(),
    onlyOpen: false,
    onToggleOnlyOpen: vi.fn(),
    selectedBrands: {
      이마트: true,
      홈플러스: true,
      롯데마트: true,
    },
    onToggleBrand: vi.fn(),
  };

  it('검색어 입력창과 필터 버튼이 정상 렌더링되어야 한다', () => {
    render(<StoreSearchFilterHeader {...defaultProps} />);

    const input = screen.getByPlaceholderText('마트 지점명 또는 동네 검색');
    expect(input).toBeDefined();
  });

  it('검색어가 있을 때 clear 버튼이 노출되고 클릭 시 onClearSearch가 호출되어야 한다', () => {
    const onClearSearch = vi.fn();
    render(
      <StoreSearchFilterHeader
        {...defaultProps}
        searchQuery="강남"
        onClearSearch={onClearSearch}
      />
    );

    const clearButton = screen.getByTitle('검색어 지우기');
    expect(clearButton).toBeDefined();

    fireEvent.click(clearButton);
    expect(onClearSearch).toHaveBeenCalled();
  });

  it('필터 버튼 클릭 시 onToggleFilter가 호출되어야 한다', () => {
    const onToggleFilter = vi.fn();
    render(
      <StoreSearchFilterHeader
        {...defaultProps}
        onToggleFilter={onToggleFilter}
      />
    );

    const buttons = screen.getAllByRole('button');
    const filterBtn = buttons[buttons.length - 1];
    fireEvent.click(filterBtn);

    expect(onToggleFilter).toHaveBeenCalled();
  });

  it('isFilterOpen이 true일 때 카테고리 칩 및 브랜드 칩 필터 패널이 노출되어야 한다', () => {
    render(<StoreSearchFilterHeader {...defaultProps} isFilterOpen={true} />);

    expect(screen.getByText('전체')).toBeDefined();
    expect(screen.getByText('대형마트')).toBeDefined();
    expect(screen.getByText('SSM·슈퍼')).toBeDefined();
    expect(screen.getByText('영업중만')).toBeDefined();
  });

  it('카테고리 칩 클릭 시 onSelectCategory가 올바르게 호출되어야 한다', () => {
    const onSelectCategory = vi.fn();
    render(
      <StoreSearchFilterHeader
        {...defaultProps}
        isFilterOpen={true}
        onSelectCategory={onSelectCategory}
      />
    );

    fireEvent.click(screen.getByText('대형마트'));
    expect(onSelectCategory).toHaveBeenCalledWith('hypermarket');
  });

  it('영업중만 칩 클릭 시 onToggleOnlyOpen이 호출되어야 한다', () => {
    const onToggleOnlyOpen = vi.fn();
    render(
      <StoreSearchFilterHeader
        {...defaultProps}
        isFilterOpen={true}
        onToggleOnlyOpen={onToggleOnlyOpen}
      />
    );

    fireEvent.click(screen.getByText('영업중만'));
    expect(onToggleOnlyOpen).toHaveBeenCalled();
  });
});
