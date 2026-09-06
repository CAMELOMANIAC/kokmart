import { create } from 'zustand';
import { MartStore } from '@kokmart/shared';

interface SelectedStoreState {
  selectedStores: MartStore[];
  toggleStoreSelection: (store: MartStore) => void;
  removeStoreSelection: (storeId: string) => void;
  clearStoreSelection: () => void;
  isStoreSelected: (storeId: string) => boolean;
}

export const useSelectedStoreStore = create<SelectedStoreState>((set, get) => ({
  selectedStores: [],
  toggleStoreSelection: (store: MartStore) => {
    set((state) => {
      const exists = state.selectedStores.some((s) => s.id === store.id);
      if (exists) {
        return { selectedStores: state.selectedStores.filter((s) => s.id !== store.id) };
      } else {
        return { selectedStores: [...state.selectedStores, store] };
      }
    });
  },
  removeStoreSelection: (storeId: string) => {
    set((state) => ({
      selectedStores: state.selectedStores.filter((s) => s.id !== storeId)
    }));
  },
  clearStoreSelection: () => set({ selectedStores: [] }),
  isStoreSelected: (storeId: string) => {
    return get().selectedStores.some((s) => s.id === storeId);
  }
}));
