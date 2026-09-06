import { create } from 'zustand';
import { ParsedProduct } from '@kokmart/shared';

interface CartItem {
  product: ParsedProduct;
  quantity: number;
}

interface CartState {
  cart: CartItem[];
  selectedMarts: {
    emart: boolean;
    homeplus: boolean;
    lottemart: boolean;
  };
  addToCart: (product: ParsedProduct) => void;
  removeFromCart: (productId: string) => void;
  toggleMart: (martKey: 'emart' | 'homeplus' | 'lottemart') => void;
  clearCart: () => void;
  calculateSplitSavings: () => { singleMartTotal: number; splitTotal: number; savings: number };
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  selectedMarts: {
    emart: true,
    homeplus: true,
    lottemart: true
  },
  addToCart: (product) => {
    set((state) => {
      const existingIndex = state.cart.findIndex(i => i.product.productName === product.productName);
      if (existingIndex > -1) {
        const updated = [...state.cart];
        updated[existingIndex].quantity += 1;
        return { cart: updated };
      }
      return { cart: [...state.cart, { product, quantity: 1 }] };
    });
  },
  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter(i => (i.product.id || i.product.productName) !== productId)
    }));
  },
  toggleMart: (martKey) => {
    set((state) => ({
      selectedMarts: {
        ...state.selectedMarts,
        [martKey]: !state.selectedMarts[martKey]
      }
    }));
  },
  clearCart: () => set({ cart: [] }),
  calculateSplitSavings: () => {
    const { cart } = get();
    if (cart.length === 0) return { singleMartTotal: 0, splitTotal: 0, savings: 0 };

    let singleMartTotal = 0;
    let splitTotal = 0;

    cart.forEach(item => {
      const price = item.product.salePrice * item.quantity;
      singleMartTotal += price;
      // 최적 분할 시 할인가 추가적용 추정 10% 절감
      splitTotal += Math.round(price * 0.9);
    });

    return {
      singleMartTotal,
      splitTotal,
      savings: singleMartTotal - splitTotal
    };
  }
}));
