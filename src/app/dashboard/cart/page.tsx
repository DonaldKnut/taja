"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useCartStore } from "@/stores/cartStore";
import { CartItem as CartItemRow } from "@/components/cart/CartItem";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function CartPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const total = getTotalPrice();
  const hasStockIssue = items.some((item) => item.stock <= 0 || item.quantity > item.stock);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-emerald-600" />
              Cart
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {items.length === 0 ? "You have no items in your cart." : `${items.length} item(s) in your cart.`}
            </p>
            {items.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                Tip: you can click the quantity and type the exact number you want instead of tapping the plus button repeatedly.
              </p>
            )}
          </div>
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearCart()}
            >
              Clear Cart
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">Your cart is empty.</p>
            <Link href="/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 divide-y">
              {items.map((item) => (
                <div key={item._id} className="p-4">
                  <CartItemRow item={item} formatPrice={(p) => `₦${p.toLocaleString()}`} />
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">₦{total.toLocaleString()}</p>
                {hasStockIssue && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    Adjust quantities or remove out-of-stock items before checking out.
                  </p>
                )}
              </div>
              <Link href={hasStockIssue ? "#" : "/checkout"} aria-disabled={hasStockIssue}>
                <Button
                  size="lg"
                  disabled={hasStockIssue}
                  className={hasStockIssue ? "opacity-60 cursor-not-allowed" : ""}
                >
                  {hasStockIssue ? "Fix Stock Issues to Checkout" : "Proceed to Checkout"}
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

