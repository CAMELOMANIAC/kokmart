import { describe, it, expect } from 'vitest';
import { useUIStore } from './useUIStore';

describe('useUIStore - Zustand UI 상태 스토어', () => {
  it('isBottomSheetFullscreen 상태 변경이 올바르게 작동해야 한다', () => {
    expect(useUIStore.getState().isBottomSheetFullscreen).toBe(false);

    useUIStore.getState().setBottomSheetFullscreen(true);
    expect(useUIStore.getState().isBottomSheetFullscreen).toBe(true);

    useUIStore.getState().setBottomSheetFullscreen(false);
    expect(useUIStore.getState().isBottomSheetFullscreen).toBe(false);
  });

  it('isScrollingDown 상태 변경이 올바르게 작동해야 한다', () => {
    expect(useUIStore.getState().isScrollingDown).toBe(false);

    useUIStore.getState().setScrollingDown(true);
    expect(useUIStore.getState().isScrollingDown).toBe(true);

    useUIStore.getState().setScrollingDown(false);
    expect(useUIStore.getState().isScrollingDown).toBe(false);
  });
});
