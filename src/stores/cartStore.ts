import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "react-hot-toast";
import { cartVariantKey, sameCartLine } from "@/lib/cartLineIdentity";

export interface CartItem {
  _id: string;
  title: string;
  price: number;
  quantity: number;
  images: string[];
  seller: string;
  shopSlug?: string;
  moq: number;
  stock: number;
  variantId?: string;
  variantName?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

// Create a safe storage that handles SSR
const createSafeStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => { },
      removeItem: () => { },
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
        const itemStock = item.stock ?? 999;
        const vk = cartVariantKey(item.variantId);
        const storedVariantId = vk === "" ? undefined : String(item.variantId).trim();
        const existingItem = get().items.find((i) =>
          sameCartLine(i._id, i.variantId, item._id, item.variantId)
        );

        if (existingItem) {
          if (existingItem.quantity >= itemStock) {
            toast.error("Maximum stock reached");
            return;
          }
          const newQuantity = Math.min(existingItem.quantity + 1, itemStock);
          set({
            items: get().items.map((i) =>
              sameCartLine(i._id, i.variantId, item._id, item.variantId)
                ? { ...i, quantity: newQuantity, variantId: storedVariantId ?? i.variantId }
                : i
            ),
          });
        } else {
          // New item starts at MOQ
          const initialQuantity = Math.min(item.moq || 1, itemStock);
          if (initialQuantity > 0 && itemStock > 0) {
            set({
              items: [
                ...get().items,
                { ...item, variantId: storedVariantId, stock: itemStock, quantity: initialQuantity },
              ],
            });
            // Open cart when adding first item
            set({ isOpen: true });
          } else {
            toast.error("Item out of stock");
          }
        }
      },

      removeItem: (id: string, variantId?: string) => {
        set({
          items: get().items.filter((i) => !sameCartLine(i._id, i.variantId, id, variantId)),
        });
      },

      updateQuantity: (id: string, variantId: string | undefined, quantity: number) => {
        const item = get().items.find((i) => sameCartLine(i._id, i.variantId, id, variantId));
        if (!item) return;

        if (quantity < item.moq) {
          // We'll handle warnings in the UI, but store-wise we allow it 
          // to let the user type, but we might cap it at stock.
          // However, if quantity is 0, we remove.
          if (quantity <= 0) {
            get().removeItem(id, variantId);
            return;
          }
        }

        // Always cap at stock
        const finalQuantity = Math.min(quantity, item.stock);

        set({
          items: get().items.map((i) =>
            sameCartLine(i._id, i.variantId, id, variantId) ? { ...i, quantity: finalQuantity } : i
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),

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
