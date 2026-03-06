import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface WishlistItem {
    _id: string; // Product ID
    title: string;
    price: number;
    images: string[];
    slug: string;
    shop: {
        shopName: string;
        shopSlug: string;
    };
    inventory?: {
        quantity: number;
    };
    status?: string;
}

interface WishlistState {
    items: WishlistItem[];
    isOpen: boolean;
    isLoading: boolean;
    hasLoaded: boolean;

    // Actions
    toggleDrawer: () => void;
    openDrawer: () => void;
    closeDrawer: () => void;

    // API Actions
    fetchWishlist: () => Promise<void>;
    toggleWishlistItem: (product: WishlistItem) => Promise<boolean>;
    removeItem: (productId: string) => Promise<void>;

    // Sync helper
    setItems: (items: WishlistItem[]) => void;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            isLoading: false,
            hasLoaded: false,

            toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
            openDrawer: () => set({ isOpen: true }),
            closeDrawer: () => set({ isOpen: false }),

            setItems: (items) => set({ items }),

            fetchWishlist: async () => {
                // Don't fetch if already fetching
                if (get().isLoading) return;

                try {
                    set({ isLoading: true });
                    const res = await api('/api/wishlist');
                    if (res?.success && Array.isArray(res.data)) {
                        set({ items: res.data, hasLoaded: true });
                    }
                } catch (error) {
                    console.error('Failed to fetch wishlist', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            toggleWishlistItem: async (product) => {
                const currentItems = get().items;
                const exists = currentItems.some(i => i._id === product._id);

                // Optimistic UI update
                if (exists) {
                    set({ items: currentItems.filter(i => i._id !== product._id) });
                } else {
                    set({ items: [...currentItems, product] });
                }

                try {
                    const res = await api('/api/wishlist', {
                        method: 'POST',
                        body: JSON.stringify({ productId: product._id })
                    });

                    if (res?.success) {
                        return res.isWishlisted;
                    } else {
                        // Revert optimistic update on failure
                        set({ items: currentItems });
                        return exists;
                    }
                } catch (error) {
                    console.error('Failed to toggle wishlist item', error);
                    // Revert optimistic update on failure
                    set({ items: currentItems });
                    return exists;
                }
            },

            removeItem: async (productId) => {
                const currentItems = get().items;
                // Optimistic remove
                set({ items: currentItems.filter(i => i._id !== productId) });

                try {
                    await api('/api/wishlist', {
                        method: 'POST', // The toggle API handles removal if it exists
                        body: JSON.stringify({ productId })
                    });
                } catch (error) {
                    console.error('Failed to remove wishlist item', error);
                    // Revert on failure
                    set({ items: currentItems });
                }
            }
        }),
        {
            name: 'taja-wishlist-storage',
            partialize: (state) => ({ items: state.items }), // Only persist items, not UI state
        }
    )
);
