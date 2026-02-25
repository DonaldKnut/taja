/**
 * DB module (public API)
 */

export { default as connectDB } from "@/lib/db";

// Models (re-exported as named exports for consistent imports)
export { default as User } from "@/models/User";
export { default as Shop } from "@/models/Shop";
export { default as Product } from "@/models/Product";
export { default as Order } from "@/models/Order";
export { default as Cart } from "@/models/Cart";
export { default as Category } from "@/models/Category";
export { default as Review } from "@/models/Review";
export { default as Chat } from "@/models/Chat";
export { default as Notification } from "@/models/Notification";
export { default as ShopFollow } from "@/models/ShopFollow";
export { default as SupportTicket } from "@/models/SupportTicket";


