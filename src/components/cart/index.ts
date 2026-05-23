/**
 * Cart Components
 * 
 * Modular, reusable cart components following DRY principles.
 * 
 * @module CartComponents
 */

export { CartIcon } from "./CartIcon";
export { CartItem } from "./CartItem";
export { CartDrawer } from "./CartDrawer";
export type { CartIconProps } from "./CartIcon";
export type { CartItemProps } from "./CartItem";
export type { CartDrawerProps } from "./CartDrawer";

// Re-export cart store for convenience
export { useCartStore } from "@/stores/cartStore";
export type { CartItem as CartItemType } from "@/stores/cartStore";

