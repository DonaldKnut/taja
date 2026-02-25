"use client";

import { cn } from "@/lib/utils";

export interface ProductBadgeProps {
  /**
   * Badge variant
   */
  variant: "discount" | "condition" | "verified" | "new" | "sale" | "custom";
  /**
   * Badge value/text
   */
  value: string;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Custom background color (for custom variant)
   */
  bgColor?: string;
  /**
   * Custom text color (for custom variant)
   */
  textColor?: string;
}

/**
 * Reusable Product Badge Component
 * 
 * Displays badges for products (discount, condition, verified, etc.).
 * 
 * @example
 * ```tsx
 * <ProductBadge variant="discount" value="20% OFF" />
 * <ProductBadge variant="condition" value="new" />
 * ```
 */
export function ProductBadge({
  variant,
  value,
  className,
  bgColor,
  textColor,
}: ProductBadgeProps) {
  const variantStyles = {
    discount: "bg-red-500 text-white",
    condition: "bg-black/70 text-white capitalize",
    verified: "bg-taja-primary/10 text-taja-primary",
    new: "bg-green-500 text-white",
    sale: "bg-orange-500 text-white",
    custom: "",
  };

  const style = variant === "custom" && (bgColor || textColor)
    ? { backgroundColor: bgColor, color: textColor }
    : undefined;

  return (
    <div
      className={cn(
        "rounded px-2 py-1 text-xs font-semibold",
        variantStyles[variant],
        className
      )}
      style={style}
    >
      {value}
    </div>
  );
}









