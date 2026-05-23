"use client";

import { useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";

export interface CartIconProps {
  /**
   * Click handler for the cart icon
   */
  onClick?: () => void;
  /**
   * Custom className for the button
   */
  className?: string;
  /**
   * Icon size class (default: "h-6 w-6")
   */
  iconSize?: "h-4 w-4" | "h-5 w-5" | "h-6 w-6" | "h-8 w-8";
  /**
   * Show badge with item count (default: true)
   */
  showBadge?: boolean;
  /**
   * Badge position (default: "top-right")
   */
  badgePosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  /**
   * Custom badge className
   */
  badgeClassName?: string;
  /**
   * Custom icon className
   */
  iconClassName?: string;
  /**
   * Disable the button
   */
  disabled?: boolean;
  /**
   * Aria label for accessibility
   */
  ariaLabel?: string;
}

/**
 * Reusable Cart Icon Component
 * 
 * Displays a shopping cart icon with an optional badge showing the number of items.
 * Can be used anywhere in the app where you need a cart icon.
 * 
 * @example
 * ```tsx
 * <CartIcon onClick={() => toggleCart()} />
 * ```
 */
export function CartIcon({
  onClick,
  className,
  iconSize = "h-6 w-6",
  showBadge = true,
  badgePosition = "top-right",
  badgeClassName,
  iconClassName,
  disabled = false,
  ariaLabel = "Shopping cart",
}: CartIconProps) {
  const mounted = useMounted();
  const { getTotalItems, toggleCart, _hasHydrated } = useCartStore();
  const totalItems = getTotalItems();
  const handleClick = onClick || toggleCart;

  // Ensure cart store is hydrated before showing badge
  useEffect(() => {
    if (mounted && !_hasHydrated && typeof window !== "undefined") {
      useCartStore.persist.rehydrate();
    }
  }, [mounted, _hasHydrated]);

  // Badge position classes
  const badgePositionClasses = {
    "top-right": "-top-2 -right-2",
    "top-left": "-top-2 -left-2",
    "bottom-right": "-bottom-2 -right-2",
    "bottom-left": "-bottom-2 -left-2",
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn("relative inline-flex items-center justify-center", className)}
      aria-label={ariaLabel}
    >
      <ShoppingCart
        className={cn(iconSize, iconClassName)}
      />
      {showBadge && mounted && _hasHydrated && totalItems > 0 && (
        <span
          className={cn(
            "absolute bg-taja-secondary text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center",
            badgePositionClasses[badgePosition],
            badgeClassName
          )}
          aria-label={`${totalItems} items in cart`}
        >
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}
