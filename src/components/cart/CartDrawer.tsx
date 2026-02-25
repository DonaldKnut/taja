"use client";

import { X, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { CartItem } from "./CartItem";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface CartDrawerProps {
  /**
   * Whether the drawer is open
   */
  isOpen: boolean;
  /**
   * Function to close the drawer
   */
  onClose: () => void;
  /**
   * Custom className for the drawer
   */
  className?: string;
  /**
   * Custom className for the overlay
   */
  overlayClassName?: string;
  /**
   * Custom format for price display
   */
  formatPrice?: (price: number) => string;
  /**
   * Custom empty cart message
   */
  emptyMessage?: {
    title?: string;
    subtitle?: string;
  };
  /**
   * Custom checkout button text
   */
  checkoutButtonText?: string;
  /**
   * Custom checkout URL (default: "/checkout")
   */
  checkoutUrl?: string;
  /**
   * Show checkout button (default: true)
   */
  showCheckout?: boolean;
}

/**
 * Reusable Cart Drawer Component
 * 
 * Displays a slide-out cart drawer with cart items, total, and checkout button.
 * 
 * @example
 * ```tsx
 * <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
 * ```
 */
export function CartDrawer({
  isOpen,
  onClose,
  className,
  overlayClassName,
  formatPrice = (price) => `₦${price.toLocaleString()}`,
  emptyMessage = {
    title: "Your cart is empty",
    subtitle: "Start shopping to add items",
  },
  checkoutButtonText = "Proceed to Checkout",
  checkoutUrl = "/checkout",
  showCheckout = true,
}: CartDrawerProps) {
  const { items, getTotalPrice } = useCartStore();
  const totalPrice = getTotalPrice();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity",
          overlayClassName
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Cart Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingCart className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">{emptyMessage.title}</p>
              <p className="text-sm mt-2">{emptyMessage.subtitle}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem key={item._id} item={item} formatPrice={formatPrice} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span className="text-taja-primary">
                {formatPrice(totalPrice)}
              </span>
            </div>

            {/* Checkout Button */}
            {showCheckout && (
              <Link
                href={checkoutUrl}
                onClick={onClose}
                className="block w-full bg-taja-primary text-white text-center py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors btn-hover"
              >
                {checkoutButtonText}
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
