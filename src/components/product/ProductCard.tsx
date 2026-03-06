"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Star, ShoppingBag, Plus, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ImageSlider } from "@/components/ui/ImageSlider";
import { ProductPrice } from "./ProductPrice";
import { ShopLink } from "../shop/ShopLink";
import { formatCurrency } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import type { Product, Shop } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore, WishlistItem } from "@/components/wishlist";
import { toast } from "react-hot-toast";

export interface ProductCardProps {
  product: Product;
  variant?: "default" | "minimal" | "emphasis_modal";
  className?: string;
  showWishlist?: boolean;
  showDiscount?: boolean;
  showCondition?: boolean;
  showShop?: boolean;
  showRating?: boolean;
  fallbackImage?: string;
  imageHeight?: string;
  formatPrice?: (price: number) => string;
  onClick?: (product: Product) => void;
}

export function ProductCard({
  product,
  variant = "default",
  className,
  showWishlist = true,
  showDiscount = true,
  showShop = true,
  showRating = true,
  fallbackImage = "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png",
  formatPrice = (price) => formatCurrency(price),
  onClick,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { items: wishlistItems, toggleWishlistItem } = useWishlistStore();

  if (!product) return null;

  const isWishlisted = wishlistItems.some(item => item._id === product._id);

  const shop = (typeof product.shop === "object" ? product.shop : undefined) as Shop | undefined;
  const shopSlug = shop?.shopSlug || product.shopSlug;
  const shopName = shop?.shopName || "Shop";
  const isVerified = shop?.isVerified;
  const averageRating = shop?.averageRating ?? product.averageRating ?? 4.5;
  const images = product?.images?.length ? product.images : [fallbackImage];

  const handleClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Transform to WishlistItem format
    const itemToSave: WishlistItem = {
      _id: product._id,
      title: product.title,
      price: product.price,
      images: images,
      slug: product.slug,
      shop: {
        shopName: shopName,
        shopSlug: shopSlug || product.slug // fallback to product slug if undefined, though rare
      },
      inventory: {
        quantity: product.inventory?.quantity ?? product.stock ?? 999
      },
      status: (product as any).status || "active"
    };

    const nowWishlisted = await toggleWishlistItem(itemToSave);

    trackEvent({
      name: "wishlist_click",
      properties: { productId: product._id, slug: product.slug, location: "product_card", action: nowWishlisted ? "add" : "remove" },
    });

    if (nowWishlisted) {
      toast.success("Added to wishlist", { icon: "❤️" });
    } else {
      toast("Removed from wishlist", { icon: "💔" });
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const item = {
      _id: product._id,
      title: product.title,
      price: product.price,
      images: product.images,
      quantity: 1,
      seller: typeof product.seller === 'string' ? product.seller : product.seller?._id,
      shopSlug: shopSlug,
      moq: product.inventory?.moq || product.moq || 1,
      stock: product.inventory?.quantity ?? product.stock ?? 999
    };

    addItem(item);

    trackEvent({
      name: "quick_add_to_cart",
      properties: {
        productId: product._id,
        title: product.title,
        price: product.price
      }
    });

    toast.success(`${product.title} added`, {
      icon: <ShoppingBag className="w-4 h-4" />,
      style: {
        borderRadius: '1rem',
        background: '#000',
        color: '#fff',
        fontSize: '12px',
        fontWeight: '600'
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn("group/card flex flex-col h-full bg-white rounded-[2rem] overflow-hidden border border-gray-100/50 shadow-sm hover:shadow-xl transition-all duration-500", className)}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Link href={`/product/${product.slug}`} onClick={handleClick} className="block w-full h-full">
          <ImageSlider
            images={images}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
            fillContainer
            showDots={false}
            showArrows={false}
          />
        </Link>

        {/* Wishlist Button Overlay */}
        {showWishlist && (
          <button
            onClick={handleWishlistClick}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-900 shadow-sm border border-white/40 active:scale-90 transition-all z-10"
          >
            <Heart className={cn("h-4.5 w-4.5 transition-colors", isWishlisted && "fill-rose-500 text-rose-500")} />
          </button>
        )}

        {/* Condition/New Badge */}
        {product.condition === 'new' && (
          <div className="absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full z-10">
            NEW
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col flex-1 relative">
        <div className="space-y-1 pr-12">
          {/* Shop Name Small */}
          {showShop && shopName && (
            <p className="text-[10px] font-medium text-gray-400 truncate uppercase tracking-widest leading-none">
              {shopName}
            </p>
          )}

          <Link href={`/product/${product.slug}`} onClick={handleClick} className="block">
            <h3 className="text-sm font-bold text-gray-900 group-hover/card:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem] leading-tight">
              {product.title}
            </h3>
          </Link>

          <p className="text-[11px] text-gray-400 capitalize">
            {typeof product.category === 'object' ? (product.category as any)?.name : (product.category || "General")}
          </p>
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-black text-gray-900 leading-none">
              ₦{product.price.toLocaleString()}
            </span>
          </div>

          {/* Circular Add Button */}
          <button
            onClick={handleQuickAdd}
            disabled={product.stock <= 0}
            className={cn(
              "w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-all active:scale-90",
              product.stock <= 0 && "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
            aria-label={product.stock > 0 ? "Add to cart" : "Out of stock"}
          >
            {product.stock > 0 ? <Plus className="h-5 w-5" /> : <Plus className="h-5 w-5 opacity-20" />}
          </button>
        </div>

        {/* Absolute corner price optional styling for specific design if needed, but flex items-between is cleaner here */}
      </CardContent>
    </motion.div>
  );
}
