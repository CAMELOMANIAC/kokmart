import { describe, it, expect, vi } from 'vitest';
import { TAB_ORDER, getTabDirection, setViewTransitionDirection } from './transition';

describe('transition - View Transition Utility', () => {
  it('TAB_ORDER가 각 탭의 인덱스를 바르게 정의하고 있어야 한다', () => {
    expect(TAB_ORDER['/']).toBe(0);
    expect(TAB_ORDER['/dding']).toBe(1);
    expect(TAB_ORDER['/ddib']).toBe(2);
    expect(TAB_ORDER['/bbum']).toBe(3);
  });

  it('getTabDirection - 오른쪽 탭 이동 시 forward, 왼쪽 탭 이동 시 back을 반환해야 한다', () => {
    // 콕('/') -> 띵('/dding') => forward
    expect(getTabDirection('/', '/dding')).toBe('forward');

    // 뿜('/bbum') -> 띱('/ddib') => back
    expect(getTabDirection('/bbum', '/ddib')).toBe('back');

    // 동일 탭 => forward
    expect(getTabDirection('/dding', '/dding')).toBe('forward');

    // 미정의 경로 fallback => index 0 처리
    expect(getTabDirection('/unknown', '/dding')).toBe('forward');
    expect(getTabDirection('/dding', '/unknown')).toBe('back');
  });

  it('setViewTransitionDirection - document dataset transition 속성을 설정해야 한다', () => {
    const mockDataset: Record<string, string | undefined> = {};
    const mockDocument = {
      documentElement: {
        dataset: mockDataset
      }
    };

    vi.stubGlobal('document', mockDocument);

    setViewTransitionDirection('forward');
    expect(mockDataset.transition).toBe('forward');

    setViewTransitionDirection('back');
    expect(mockDataset.transition).toBe('back');

    vi.unstubAllGlobals();
  });
});
