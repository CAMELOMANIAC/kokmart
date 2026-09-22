/** @vitest-environment happy-dom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

if (typeof Element !== 'undefined' && Element.prototype.animate) {
  Element.prototype.animate = vi.fn().mockReturnValue({
    cancel: vi.fn(),
    finish: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    reverse: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

import { DdingFlyers } from './DdingFlyers';

vi.mock('./DdingFlyers.css', () => ({
  container: 'container',
  noticeCard: 'noticeCard',
  noticeTitle: 'noticeTitle',
  noticeDesc: 'noticeDesc',
  controlCard: 'controlCard',
  controlTitle: 'controlTitle',
  modelBadge: 'modelBadge',
  brandSelectorRow: 'brandSelectorRow',
  brandBadge: {
    emart: 'emart',
    homeplus: 'homeplus',
    lotte: 'lotte',
    default: 'default',
  },
  brandChip: {
    unselected: 'unselected',
    selectedEmart: 'selectedEmart',
    selectedHomeplus: 'selectedHomeplus',
    selectedLotte: 'selectedLotte',
  },
  inputField: 'inputField',
  sampleButtonRow: 'sampleButtonRow',
  sampleTextButton: 'sampleTextButton',
  actionButtonGroup: 'actionButtonGroup',
  submitButton: 'submitButton',
  statusBannerLoading: 'statusBannerLoading',
  statusBannerSuccess: 'statusBannerSuccess',
  statusBannerError: 'statusBannerError',
  filterRow: 'filterRow',
  filterChip: {
    active: 'active',
    inactive: 'inactive',
  },
  productList: 'productList',
  emptyState: 'emptyState',
  emptyTitle: 'emptyTitle',
  emptyDesc: 'emptyDesc',
  productCard: 'productCard',
  cardTopRow: 'cardTopRow',
  badgeGroup: 'badgeGroup',
  pageNumberBadge: 'pageNumberBadge',
  tipBadge: {
    MART_BEST: 'MART_BEST',
    MART_RECOMMEND: 'MART_RECOMMEND',
    COUPANG_TIP: 'COUPANG_TIP',
    COUPANG_BULK: 'COUPANG_BULK',
  },
  productTitleRow: 'productTitleRow',
  productName: 'productName',
  priceContainer: 'priceContainer',
  unitPriceText: 'unitPriceText',
  salePriceText: 'salePriceText',
  smartTipBox: {
    MART_BEST: 'MART_BEST',
    MART_RECOMMEND: 'MART_RECOMMEND',
    COUPANG_TIP: 'COUPANG_TIP',
    COUPANG_BULK: 'COUPANG_BULK',
  },
  cardActionRow: 'cardActionRow',
  coupangSearchButton: 'coupangSearchButton',
  cartAddButton: 'cartAddButton',
}));
import { useCartStore } from '../store/useCartStore';

interface MockButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

interface MockDivProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className, disabled, type }: MockButtonProps) => (
      <button onClick={onClick} className={className} disabled={disabled} type={type}>
        {children}
      </button>
    ),
    div: ({ children, className }: MockDivProps) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../hooks/useScrollDirection', () => ({
  useScrollDirection: vi.fn(),
}));

vi.mock('../components/FloatingTopBar', () => ({
  FloatingTopBar: ({ title }: { title: string }) => <div data-testid="floating-topbar">{title}</div>,
}));

describe('DdingFlyers Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ cart: [] });
    global.fetch = vi.fn();
    window.open = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('페이지 기본 요소를 렌더링하고 초기 상태가 올바르게 표시되어야 한다', () => {
    render(<DdingFlyers />);

    expect(screen.getByTestId('floating-topbar')).toBeDefined();
    expect(screen.getByText('이마트')).toBeDefined();
    expect(screen.getByText('홈플러스')).toBeDefined();
    expect(screen.getByText('롯데마트')).toBeDefined();

    const input = screen.getByPlaceholderText('전단지 이미지 고해상도 웹 URL을 입력하세요') as HTMLInputElement;
    expect(input.value).toContain('unsplash.com');

    expect(screen.getByText('분석된 전단지 상품이 없습니다')).toBeDefined();
  });

  it('샘플 전단지 이미지 링크 자동 채우기 버튼 클릭 시 입력값과 안내 상태가 변경되어야 한다', () => {
    render(<DdingFlyers />);

    const sampleBtn = screen.getByText('샘플 전단지 이미지 링크 자동 채우기');
    fireEvent.click(sampleBtn);

    expect(screen.getByText('샘플 전단지 이미지 링크가 입력되었습니다.')).toBeDefined();
  });

  it('브랜드 선택 버튼 클릭 시 브랜드 상태가 변경되고 파싱 요청에 반영되어야 한다', async () => {
    const mockProducts = [
      {
        id: 'prod-homeplus-1',
        productName: '홈플러스 한우 100g',
        salePrice: 5000,
        effectiveUnitPrice: 5000,
        unitMeasure: '100g',
        isPerishable: true,
        martName: '홈플러스',
        smartTip: {
          tipType: 'MART_BEST',
          badgeText: '마트 필구 특가',
          tipMessage: '홈플러스 한우 최저가!',
          coupangKeyword: null,
        },
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, products: mockProducts }),
    });

    render(<DdingFlyers />);

    const homeplusChip = screen.getByRole('button', { name: '홈플러스' });
    fireEvent.click(homeplusChip);

    const parseBtn = screen.getByRole('button', { name: /홈플러스 전단 AI 실시간 분석 실행/i });
    fireEvent.click(parseBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/flyers/parse-master', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
    });

    expect(await screen.findByText('홈플러스 한우 100g')).toBeDefined();
    expect(screen.getByText(/전단지 분석 완료!/i)).toBeDefined();
  });

  it('전단지 파싱 API 실패 시 에러 상태 메시지가 출력되어야 한다', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: '서버 파싱 실패 원인' }),
    });

    render(<DdingFlyers />);

    const parseBtn = screen.getByRole('button', { name: /이마트 전단 AI 실시간 분석 실행/i });
    fireEvent.click(parseBtn);

    expect(await screen.findByText(/❌ 서버 파싱 실패 원인/i)).toBeDefined();
  });

  it('상품 필터(전체, 마트 필구/추천, 쿠팡 알뜰팁) 동작이 정상 작동해야 한다', async () => {
    const mockProducts = [
      {
        id: 'prod-1',
        productName: '삼겹살',
        salePrice: 2000,
        effectiveUnitPrice: 2000,
        unitMeasure: '100g',
        isPerishable: true,
        smartTip: {
          tipType: 'MART_RECOMMEND',
          badgeText: '마트 현장 추천',
          tipMessage: '마트 추천 메시지',
          coupangKeyword: null,
        },
      },
      {
        id: 'prod-2',
        productName: '화장지 대용량',
        salePrice: 15000,
        effectiveUnitPrice: 1500,
        unitMeasure: '100g',
        isPerishable: false,
        smartTip: {
          tipType: 'COUPANG_BULK',
          badgeText: '대용량 알뜰 팁',
          tipMessage: '쿠팡 대용량이 싸요',
          coupangKeyword: '화장지 대용량',
        },
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, products: mockProducts }),
    });

    render(<DdingFlyers />);

    fireEvent.click(screen.getByRole('button', { name: /이마트 전단 AI 실시간 분석 실행/i }));

    expect(await screen.findByText('삼겹살')).toBeDefined();
    expect(screen.getByText('화장지 대용량')).toBeDefined();

    // 마트 필터 적용
    fireEvent.click(screen.getByText('마트 필구/추천'));
    expect(screen.getByText('삼겹살')).toBeDefined();
    expect(screen.queryByText('화장지 대용량')).toBeNull();

    // 쿠팡 필터 적용
    fireEvent.click(screen.getByText('쿠팡 알뜰팁'));
    expect(screen.queryByText('삼겹살')).toBeNull();
    expect(screen.getByText('화장지 대용량')).toBeDefined();

    // 전체 필터 적용
    fireEvent.click(screen.getByText(/전체 상품/i));
    expect(screen.getByText('삼겹살')).toBeDefined();
    expect(screen.getByText('화장지 대용량')).toBeDefined();
  });

  it('담기 버튼 클릭 시 장바구니 스토어(useCartStore)에 추가되어야 한다', async () => {
    const mockProducts = [
      {
        id: 'prod-cart-1',
        productName: '딸기 1팩',
        salePrice: 9900,
        effectiveUnitPrice: 9900,
        unitMeasure: '1팩',
        isPerishable: true,
        smartTip: {
          tipType: 'MART_BEST',
          badgeText: '마트 필구 특가',
          tipMessage: '초특가',
          coupangKeyword: null,
        },
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, products: mockProducts }),
    });

    render(<DdingFlyers />);

    fireEvent.click(screen.getByRole('button', { name: /이마트 전단 AI 실시간 분석 실행/i }));

    expect(await screen.findByText('딸기 1팩')).toBeDefined();

    const cartBtn = screen.getByRole('button', { name: '담기' });
    fireEvent.click(cartBtn);

    expect(screen.getByText('담김!')).toBeDefined();
    expect(useCartStore.getState().cart).toHaveLength(1);
    expect(useCartStore.getState().cart[0]?.product.productName).toBe('딸기 1팩');
  });

  it('쿠팡 최저가 검색 버튼 클릭 시 window.open이 관련 URL로 호출되어야 한다', async () => {
    const mockProducts = [
      {
        id: 'prod-coupang-1',
        productName: '크리넥스 휴지',
        salePrice: 20000,
        effectiveUnitPrice: 2000,
        unitMeasure: '1롤',
        isPerishable: false,
        smartTip: {
          tipType: 'COUPANG_BULK',
          badgeText: '대용량 알뜰 팁',
          tipMessage: '쿠팡 로켓배송 이용',
          coupangKeyword: '크리넥스 휴지 대용량',
        },
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, products: mockProducts }),
    });

    render(<DdingFlyers />);

    fireEvent.click(screen.getByRole('button', { name: /이마트 전단 AI 실시간 분석 실행/i }));

    expect(await screen.findByText('크리넥스 휴지')).toBeDefined();

    const coupangSearchBtn = screen.getByRole('button', { name: /쿠팡 최저가 검색/i });
    fireEvent.click(coupangSearchBtn);

    expect(window.open).toHaveBeenCalledWith(
      'https://www.coupang.com/np/search?component=&q=%ED%81%AC%EB%A6%AC%EB%84%A5%EC%8A%A4%20%ED%9C%B4%EC%A7%80%20%EB%8C%80%EC%9A%A9%EB%9F%89',
      '_blank',
      'noopener,noreferrer'
    );
  });
});
