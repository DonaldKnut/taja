"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Lucide icon component
   */
  icon: LucideIcon;
  /**
   * Icon size class (default: "h-5 w-5")
   */
  iconSize?: "h-4 w-4" | "h-5 w-5" | "h-6 w-6" | "h-8 w-8";
  /**
   * Custom icon className
   */
  iconClassName?: string;
  /**
   * Button variant
   */
  variant?: "default" | "ghost" | "outline" | "primary" | "danger";
  /**
   * Button size
   */
  size?: "sm" | "md" | "lg";
  /**
   * Show loading state
   */
  loading?: boolean;
  /**
   * Aria label for accessibility
   */
  ariaLabel?: string;
}

/**
 * Reusable Icon Button Component
 * 
 * A button that displays only an icon. Perfect for actions like wishlist, share, etc.
 * 
 * @example
 * ```tsx
 * <IconButton icon={Heart} onClick={handleWishlist} ariaLabel="Add to wishlist" />
 * ```
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      iconSize = "h-5 w-5",
      iconClassName,
      variant = "default",
      size = "md",
      loading = false,
      className,
      disabled,
      ariaLabel,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: "bg-white/90 hover:bg-white",
      ghost: "hover:bg-gray-100",
      outline: "border border-gray-300 hover:bg-gray-50",
      primary: "bg-taja-primary text-white hover:bg-emerald-600",
      danger: "bg-red-500 text-white hover:bg-red-600",
    };

    const sizeStyles = {
      sm: "p-1",
      md: "p-2",
      lg: "p-3",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-taja-primary",
          variantStyles[variant],
          sizeStyles[size],
          (disabled || loading) && "opacity-50 cursor-not-allowed",
          className
        )}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        {...props}
      >
        {loading ? (
          <div className="animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Icon className={cn(iconSize, iconClassName)} />
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";









