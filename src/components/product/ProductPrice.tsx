"use client";

import { cn } from "@/lib/utils";

export interface ProductPriceProps {
  /**
   * Product price
   */
  price: number;
  /**
   * Compare at price (original price for discounts)
   */
  compareAtPrice?: number;
  /**
   * Custom price formatter
   */
  formatPrice?: (price: number) => string;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Price size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Show compare price (default: true)
   */
  showCompare?: boolean;
}

/**
 * Reusable Product Price Component
 * 
 * Displays product price with optional compare-at price (for discounts).
 * 
 * @example
 * ```tsx
 * <ProductPrice price={10000} compareAtPrice={15000} />
 * ```
 */
export function ProductPrice({
  price,
  compareAtPrice,
  formatPrice = (p) => `₦${(p ?? 0).toLocaleString()}`,
  className,
  size = "md",
  showCompare = true,
}: ProductPriceProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <span className={cn("font-bold text-gray-900", sizeClasses[size])}>
        {formatPrice(price)}
      </span>
      {showCompare && compareAtPrice && compareAtPrice > price && (
        <span className="text-sm text-gray-500 line-through">
          {formatPrice(compareAtPrice)}
        </span>
      )}
    </div>
  );
}









