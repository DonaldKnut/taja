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
            items.map((i) => ({ product: i._id, quantity: i.quantity }))
          );
          firstRun.current = false;
        }

        // Pull server cart and hydrate local
        const serverResponse = await cartApi.getCart();
        
        // Handle different response structures
        let serverItems = [];
        if (serverResponse?.data?.items) {
          serverItems = serverResponse.data.items;
        } else if (serverResponse?.items) {
          serverItems = serverResponse.items;
        } else if (serverResponse?.data) {
          serverItems = Array.isArray(serverResponse.data) ? serverResponse.data : [];
        } else if (Array.isArray(serverResponse)) {
          serverItems = serverResponse;
        }

        if (serverItems.length > 0) {
          clearCart();
          for (const it of serverItems) {
            const product = it.product || it;
            addItem({
              _id: product._id || product.id || it.productId,
              title: product.name || product.title || it.title || "Product",
              price: product.price || it.price || 0,
              images: product.images || [it.image] || [],
              seller: product.seller?._id || product.seller || "",
              shopSlug: product.shop?.slug || product.shopSlug || "",
            });
            
            // Set quantity if different from 1
            const quantity = it.quantity || 1;
            if (quantity > 1) {
              const productId = product._id || product.id || it.productId;
              updateQuantity(productId, quantity);
            }
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


















