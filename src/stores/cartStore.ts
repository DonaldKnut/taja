import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  _id: string;
  title: string;
  price: number;
  quantity: number;
  images: string[];
  seller: string;
  shopSlug?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

// Create a safe storage that handles SSR
const createSafeStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      addItem: (item) => {
        const existingItem = get().items.find((i) => i._id === item._id);

        if (existingItem) {
          set({
            items: get().items.map((i) =>
              i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            items: [...get().items, { ...item, quantity: 1 }],
          });
        }
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((i) => i._id !== id),
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((i) =>
            i._id === id ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "taja-cart-storage",
      storage: createJSONStorage(() => createSafeStorage()),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      skipHydration: true, // Skip automatic hydration to prevent mismatches
    }
  )
);

// Hydrate the store on client-side only
// This will be called automatically, but we ensure it happens after mount
if (typeof window !== "undefined") {
  // Use requestIdleCallback or setTimeout to ensure it happens after initial render
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(() => {
      useCartStore.persist.rehydrate();
    });
  } else {
    setTimeout(() => {
      useCartStore.persist.rehydrate();
    }, 0);
  }
}
