// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollDirection } from './useScrollDirection';
import { useUIStore } from '../store/useUIStore';

describe('useScrollDirection - iOS Style GNB Scroll Hook Test', () => {
  beforeEach(() => {
    useUIStore.setState({ isScrollingDown: false });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('기본 상태에서는 isScrollingDown이 false여야 한다', () => {
    const { unmount } = renderHook(() => useScrollDirection());
    expect(useUIStore.getState().isScrollingDown).toBe(false);
    unmount();
  });

  it('window 아래로 스크롤(threshold 이상) 시 isScrollingDown이 true가 되어야 한다', () => {
    const { unmount } = renderHook(() =>
      useScrollDirection({ threshold: 8, topThreshold: 30 })
    );

    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(useUIStore.getState().isScrollingDown).toBe(true);
    unmount();
  });

  it('window 위로 스크롤 시 isScrollingDown이 false가 되어야 한다', () => {
    const { unmount } = renderHook(() =>
      useScrollDirection({ threshold: 8, topThreshold: 30 })
    );

    // Scroll Down
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(useUIStore.getState().isScrollingDown).toBe(true);

    // Scroll Up
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(useUIStore.getState().isScrollingDown).toBe(false);

    unmount();
  });

  it('topThreshold 이하 영역으로 스크롤 시 isScrollingDown이 false가 되어야 한다', () => {
    const { unmount } = renderHook(() =>
      useScrollDirection({ threshold: 8, topThreshold: 30 })
    );

    // Scroll Down
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(useUIStore.getState().isScrollingDown).toBe(true);

    // Scroll back to top threshold
    Object.defineProperty(window, 'scrollY', { value: 15, writable: true, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(useUIStore.getState().isScrollingDown).toBe(false);

    unmount();
  });

  it('unmount 시 setScrollingDown(false)로 상태가 리셋되어야 한다', () => {
    const { unmount } = renderHook(() => useScrollDirection());

    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(useUIStore.getState().isScrollingDown).toBe(true);

    unmount();

    expect(useUIStore.getState().isScrollingDown).toBe(false);
  });

  it('custom element ref 전달 시 해당 DOM 요소를 기준으로 scroll 감지를 수행해야 한다', () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollTop', { value: 0, writable: true, configurable: true });

    const ref = { current: el };
    const { unmount } = renderHook(() =>
      useScrollDirection({ ref, threshold: 8, topThreshold: 30 })
    );

    Object.defineProperty(el, 'scrollTop', { value: 50, writable: true, configurable: true });
    act(() => {
      el.dispatchEvent(new Event('scroll'));
    });

    expect(useUIStore.getState().isScrollingDown).toBe(true);
    unmount();
  });
});
