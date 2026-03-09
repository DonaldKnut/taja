"use client";

import { cn } from "@/lib/utils";

export interface ProductPriceProps {
  /**
   * Product price
   */
  price: number;
  /**
   * Maximum price for ranges
   */
  maxPrice?: number;
  /**
   * Compare at price (original price for discounts)
   */
  compareAtPrice?: number;
  /**
   * Whether the product has variations
   */
  hasVariants?: boolean;
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
 */
export function ProductPrice({
  price,
  maxPrice,
  compareAtPrice,
  hasVariants = false,
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

  const hasRange = hasVariants && maxPrice && maxPrice > price;

  return (
    <div className={cn("flex flex-col", className)}>
      <span className={cn("font-bold text-gray-900", sizeClasses[size])}>
        {hasRange ? `${formatPrice(price)} - ${formatPrice(maxPrice)}` : formatPrice(price)}
      </span>
      {showCompare && compareAtPrice && compareAtPrice > price && (
        <span className="text-sm text-gray-500 line-through">
          {formatPrice(compareAtPrice)}
        </span>
      )}
    </div>
  );
}
