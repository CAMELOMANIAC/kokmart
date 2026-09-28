import { create } from 'zustand';

interface ToastState {
  message: string | null;
  timerId: ReturnType<typeof setTimeout> | null;
  showToast: (message: string, durationMs?: number) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  message: null,
  timerId: null,
  showToast: (message: string, durationMs = 2500) => {
    const prevTimer = get().timerId;
    if (prevTimer) {
      clearTimeout(prevTimer);
    }

    const timerId = setTimeout(() => {
      set({ message: null, timerId: null });
    }, durationMs);

    set({ message, timerId });
  },
  hideToast: () => {
    const prevTimer = get().timerId;
    if (prevTimer) {
      clearTimeout(prevTimer);
    }
    set({ message: null, timerId: null });
  },
}));
