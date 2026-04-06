"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cartStore";
import { cartApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useServerCartSync() {
  const { user, isAuthenticated } = useAuth();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const firstRun = useRef(true);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const doSync = async () => {
      try {
        // Merge local items to server on first run
        if (firstRun.current && items.length > 0) {
          await cartApi.mergeCart(
            items.map((i) => ({
              product: i._id,
              quantity: i.quantity,
              variantId: i.variantId,
              variantName: i.variantName,
            }))
          );
          firstRun.current = false;
        }

        // Pull server cart and hydrate local
        const serverResponse = await cartApi.getCart();

        // Canonical shape from backend contract: { success, data: { items, totals } }
        const serverItems = Array.isArray(serverResponse?.data?.items)
          ? serverResponse.data.items
          : Array.isArray(serverResponse?.items)
            ? serverResponse.items
            : [];

        // Always clear then rehydrate from server source of truth
        clearCart();
        for (const it of serverItems) {
          const productId = String(it.productId || it.product?._id || it.product || "");
          if (!productId) continue;
          const variantId = it.variantId ? String(it.variantId) : undefined;
          const initialQty = Number(it.quantity || 1);
          addItem({
            _id: productId,
            title: it.title || "Product",
            price: Number(it.unitPrice ?? it.price ?? 0),
            images: Array.isArray(it.images) ? it.images : [],
            seller: it.seller || "",
            shopSlug: it.shopSlug || "",
            moq: Number(it.moq ?? 1),
            stock: Number(it.stock ?? 999999),
            variantId,
            variantName: it.variantName || undefined,
          });

          // addItem initializes at MOQ; then pin to server quantity
          if (initialQty > 0) {
            updateQuantity(productId, variantId, initialQty);
          }
        }
      } catch (error) {
        console.error("Cart sync error:", error);
      }
    };

    doSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);
}


















