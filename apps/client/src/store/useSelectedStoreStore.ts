import { create } from 'zustand';
import { MartStore } from '@kokmart/shared';

interface SelectedStoreState {
  selectedStores: MartStore[];
  activeStoreId: string | null;
  setActiveStoreId: (storeId: string | null) => void;
  toggleStoreSelection: (store: MartStore) => void;
  removeStoreSelection: (storeId: string) => void;
  clearStoreSelection: () => void;
  isStoreSelected: (storeId: string) => boolean;
}

export const useSelectedStoreStore = create<SelectedStoreState>((set, get) => ({
  selectedStores: [],
  activeStoreId: null,
  setActiveStoreId: (storeId: string | null) => set({ activeStoreId: storeId }),
  toggleStoreSelection: (store: MartStore) => {
    set((state) => {
      const exists = state.selectedStores.some((s) => s.id === store.id);
      if (exists) {
        const next = state.selectedStores.filter((s) => s.id !== store.id);
        return {
          selectedStores: next,
          activeStoreId: state.activeStoreId === store.id ? (next[next.length - 1]?.id || null) : state.activeStoreId
        };
      } else {
        return {
          selectedStores: [...state.selectedStores, store],
          activeStoreId: store.id
        };
      }
    });
  },
  removeStoreSelection: (storeId: string) => {
    set((state) => {
      const next = state.selectedStores.filter((s) => s.id !== storeId);
      return {
        selectedStores: next,
        activeStoreId: state.activeStoreId === storeId ? (next[next.length - 1]?.id || null) : state.activeStoreId
      };
    });
  },
  clearStoreSelection: () => set({ selectedStores: [], activeStoreId: null }),
  isStoreSelected: (storeId: string) => {
    return get().selectedStores.some((s) => s.id === storeId);
  }
}));
