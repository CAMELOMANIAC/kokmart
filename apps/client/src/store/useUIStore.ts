import { create } from 'zustand';

interface UIState {
  isBottomSheetFullscreen: boolean;
  setBottomSheetFullscreen: (isFullscreen: boolean) => void;

  isScrollingDown: boolean;
  setScrollingDown: (isScrollingDown: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isBottomSheetFullscreen: false,
  setBottomSheetFullscreen: (isBottomSheetFullscreen) => set({ isBottomSheetFullscreen }),

  isScrollingDown: false,
  setScrollingDown: (isScrollingDown) => set({ isScrollingDown }),
}));
