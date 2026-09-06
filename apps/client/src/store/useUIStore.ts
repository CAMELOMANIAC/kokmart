import { create } from 'zustand';

interface UIState {
  isBottomSheetFullscreen: boolean;
  setBottomSheetFullscreen: (isFullscreen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isBottomSheetFullscreen: false,
  setBottomSheetFullscreen: (isBottomSheetFullscreen) => set({ isBottomSheetFullscreen })
}));
