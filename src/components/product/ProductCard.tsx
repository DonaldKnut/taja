"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Star, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ImageSlider } from "@/components/ui/ImageSlider";
import { ProductPrice } from "./ProductPrice";
import { ProductBadge } from "./ProductBadge";
import { ShopLink } from "../shop/ShopLink";
import { IconButton } from "../common/IconButton";
import { formatCurrency } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import type { Product, Shop } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface ProductCardProps {
  /**
   * Product data
   */
  product: Product;
  /**
   * Card variant/style
   */
  variant?: "default" | "minimal" | "emphasis_modal";
  /**
   * Custom className
   */
  className?: string;
  /**
   * Show wishlist button (default: true)
   */
  showWishlist?: boolean;
  /**
   * Show discount badge (default: true)
   */
  showDiscount?: boolean;
  /**
   * Show condition badge (default: true)
   */
  showCondition?: boolean;
  /**
   * Show shop link (default: true)
   */
  showShop?: boolean;
  /**
   * Show rating (default: true)
   */
  showRating?: boolean;
  /**
   * Fallback image URL
   */
  fallbackImage?: string;
  /**
   * Custom image height
   */
  imageHeight?: string;
  /**
   * Custom price formatter
   */
  formatPrice?: (price: number) => string;
  /**
   * Custom onClick handler
   */
  onClick?: (product: Product) => void;
}

/**
 * Reusable Product Card Component
 * 
 * Displays a product in a card format with image, title, price, shop info, and actions.
 */
export function ProductCard({
  product,
  variant = "default",
  className,
  showWishlist = true,
  showDiscount = true,
  showCondition = true,
  showShop = true,
  showRating = true,
  fallbackImage = "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png",
  imageHeight = "h-full",
  formatPrice = (price) => formatCurrency(price),
  onClick,
}: ProductCardProps) {
  const shop = (typeof product.shop === "object" ? product.shop : undefined) as Shop | undefined;
  const shopSlug = shop?.shopSlug || product.shopSlug;
  const shopName = shop?.shopName || "Shop";
  const isVerified = shop?.isVerified;
  const averageRating = shop?.averageRating ?? product.averageRating ?? 4.5;
  const images = product?.images?.length ? product.images : [fallbackImage];
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const handleClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackEvent({
      name: "wishlist_click",
      properties: { productId: product._id, slug: product.slug, location: "product_card" },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -12 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="h-full group/card perspective-1000"
    >
      <Card className={cn(
        "relative rounded-[2.5rem] overflow-hidden border border-white/40 bg-white/20 backdrop-blur-3xl hover:bg-white/40 hover:border-taja-primary/40 shadow-premium hover:shadow-[0_40px_80px_-20px_rgba(16,185,129,0.15)] transition-all duration-1000 flex flex-col h-full ring-1 ring-inset ring-white/20 group-hover/card:ring-taja-primary/10",
        className
      )}>
        {/* Cinematic Underglow - Dynamic Gradient */}
        <div className="absolute inset-x-0 -bottom-20 h-64 bg-gradient-to-t from-taja-primary/10 via-emerald-500/5 to-transparent blur-[80px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000 -z-10" />

        <div className="relative flex-shrink-0 p-0">
          <Link href={`/product/${product.slug}`} onClick={handleClick} className="block w-full h-full">
            <div className="overflow-hidden relative aspect-[4/5] rounded-t-[2.5rem] w-full">
              {/* Full-bleed: no gaps, image fills entire container */}
              <div className="absolute inset-0 w-full h-full bg-slate-50">
                <ImageSlider
                  images={images}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-[2.5s] ease-out-expo group-hover/card:scale-105"
                  fillContainer
                  showDots={false}
                  showArrows={false}
                  autoPlay={variant === "emphasis_modal"}
                />

                {/* High-End Sheen Sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/card:animate-shimmer pointer-events-none" />
              </div>

              {/* Sophisticated Dark Overlay for lower portion readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 transition-opacity duration-700 pointer-events-none" />
            </div>
          </Link>

          {/* Floaters - High Contrast Glass */}
          <div className="absolute inset-x-4 top-4 flex items-start justify-between z-10 pointer-events-none">
            <div className="flex flex-col gap-2 pointer-events-auto">
              {showDiscount && discount && (
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg ring-1 ring-white/20"
                >
                  <Zap className="h-2.5 w-2.5 text-white fill-white" />
                  <span className="text-[9px] font-black tracking-[0.15em] text-white uppercase">{discount}% OFF</span>
                </motion.div>
              )}
              {showCondition && product.condition && (
                <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[8px] font-black tracking-[0.2em] text-cyan-400 uppercase shadow-lg">
                  {product.condition}
                </div>
              )}
            </div>

            {showWishlist && (
              <button
                onClick={handleWishlistClick}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-slate-900 hover:bg-white hover:text-rose-500 border border-white/40 transition-all duration-500 pointer-events-auto active:scale-90 group/wish"
                aria-label="Add to wishlist"
              >
                <Heart className="h-4.5 w-4.5 transition-transform duration-500 group-hover/wish:scale-110" />
              </button>
            )}
          </div>
        </div>

        <CardContent className="px-6 py-6 flex-1 flex flex-col relative z-1">
          <div className="space-y-3">
            {showShop && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm transition-all duration-500 overflow-hidden">
                      <span className="text-[9px] font-black text-slate-900 uppercase">{shopName.charAt(0)}</span>
                    </div>
                  </div>
                  {shopSlug ? (
                    <ShopLink shopSlug={shopSlug} shopName={shopName} className="text-[8px] font-bold text-slate-400 hover:text-emerald-600 transition-all tracking-widest uppercase" />
                  ) : (
                    <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">{shopName}</span>
                  )}
                </div>
              </div>
            )}

            <Link href={`/product/${product.slug}`} onClick={handleClick} className="block group/title">
              <h3 className="text-lg font-bold text-slate-900 leading-tight tracking-tight line-clamp-2 min-h-[2.5rem] group-hover/card:text-emerald-600 transition-all duration-500">
                {product.title}
              </h3>
            </Link>
          </div>

          <div className="mt-auto pt-4 flex items-end justify-between border-t border-slate-50">
            <div className="space-y-0.5">
              <ProductPrice
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                formatPrice={formatPrice}
                className="text-xl font-black text-slate-900 tracking-tight"
              />
            </div>

            {showRating && (
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-bold text-slate-900">{averageRating?.toFixed?.(1)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}









