"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ShopLinkProps {
  /**
   * Shop slug for the URL
   */
  shopSlug: string;
  /**
   * Shop name to display
   */
  shopName: string;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Show as text or styled link
   */
  variant?: "text" | "link";
}

/**
 * Reusable Shop Link Component
 * 
 * Creates a link to a shop page with consistent styling.
 * 
 * @example
 * ```tsx
 * <ShopLink shopSlug="my-shop" shopName="My Shop" />
 * ```
 */
export function ShopLink({
  shopSlug,
  shopName,
  className,
  variant = "link",
}: ShopLinkProps) {
  const baseStyles = variant === "link"
    ? "text-sm text-gray-600 transition-colors hover:text-taja-primary"
    : "text-sm text-gray-900";

  return (
    <Link
      href={`/shop/${shopSlug}`}
      className={cn(baseStyles, className)}
      onClick={(e) => e.stopPropagation()}
    >
      {shopName}
    </Link>
  );
}









