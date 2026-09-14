// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSafeAreaInsets } from './useSafeAreaInsets';

describe('useSafeAreaInsets - Safe area insets hook test', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('초기 safe area insets 기본값을 반환하고 이벤트 리스너를 등록해야 한다', () => {
    const { result, unmount } = renderHook(() => useSafeAreaInsets());

    expect(result.current).toEqual({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });

  it('window resize 발생 시 safe area insets 상태가 업데이트되어야 한다', () => {
    const originalGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((elt: Element) => {
      if (elt.tagName === 'DIV') {
        return {
          paddingTop: '20px',
          paddingBottom: '34px',
          paddingLeft: '0px',
          paddingRight: '0px',
        } as unknown as CSSStyleDeclaration;
      }
      return originalGetComputedStyle(elt);
    });

    const { result, unmount } = renderHook(() => useSafeAreaInsets());

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toEqual({
      top: 20,
      bottom: 34,
      left: 0,
      right: 0,
    });

    unmount();
  });
});
