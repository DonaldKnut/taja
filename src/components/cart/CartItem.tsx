"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useCartStore, type CartItem as CartItemType } from "@/stores/cartStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface CartItemProps {
  /**
   * Cart item data
   */
  item: CartItemType;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Show product link (default: true)
   */
  showLink?: boolean;
  /**
   * Custom format for price display
   */
  formatPrice?: (price: number) => string;
  /**
   * Custom image size
   */
  imageSize?: number;
}

/**
 * Reusable Cart Item Component
 * 
 * Displays a single cart item with image, title, price, quantity controls, and remove button.
 * 
 * @example
 * ```tsx
 * <CartItem item={cartItem} />
 * ```
 */
export function CartItem({
  item,
  className,
  showLink = true,
  formatPrice = (price) => `₦${price.toLocaleString()}`,
  imageSize = 80,
}: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  const content = (
    <div
      className={cn(
        "flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors",
        className
      )}
    >
      {/* Image */}
      <div
        className="relative flex-shrink-0 rounded overflow-hidden bg-gray-100"
        style={{ width: imageSize, height: imageSize }}
      >
        {item.images && item.images[0] ? (
          <Image
            src={item.images[0]}
            alt={item.title}
            fill
            className="object-cover"
            sizes={`${imageSize}px`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingCart className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{item.title}</h3>
        <p className="text-taja-primary font-semibold mt-1">
          {formatPrice(item.price)}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => updateQuantity(item._id, item.quantity - 1)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium w-8 text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item._id, item.quantity + 1)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => removeItem(item._id)}
            className="ml-auto p-1 hover:bg-red-100 rounded transition-colors text-red-600"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (showLink && item.shopSlug) {
    return (
      <Link href={`/product/${item._id}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
