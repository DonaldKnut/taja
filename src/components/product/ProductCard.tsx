"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
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
  /**
   * When true, used inside dashboard marketplace (no PDP navigation on card).
   */
  isInsideDashboard?: boolean;
  /**
   * When true, show seller avatar + name block under category.
   */
  showSellerRow?: boolean;
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
  isInsideDashboard = false,
  showSellerRow = false,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { items: wishlistItems, toggleWishlistItem } = useWishlistStore();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsTriggerRef = useRef<HTMLButtonElement>(null);
  const [optionsPanelPosition, setOptionsPanelPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!optionsOpen || typeof document === "undefined") return;
    const trigger = optionsTriggerRef.current;
    if (!trigger) return;
    const update = () => {
      const rect = trigger.getBoundingClientRect();
      const vw = window.innerWidth;
      const padding = 16;
      const maxW = Math.min(280, vw - padding * 2);
      const width = Math.max(260, maxW);
      // Right-align panel with the Options button so it doesn’t extend too far right
      let left = rect.right - width;
      left = Math.max(padding, Math.min(left, vw - width - padding));
      const gap = 12;
      const top = rect.top - gap;
      setOptionsPanelPosition({ top, left, width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [optionsOpen]);

  if (!product) return null;

  const isWishlisted = wishlistItems.some(item => item._id === product._id);

  const shop = (typeof product.shop === "object" ? product.shop : undefined) as Shop | undefined;
  const shopSlug = shop?.shopSlug || product.shopSlug;
  const shopName = shop?.shopName || "Shop";
  const isVerified = shop?.isVerified;
  const averageRating = shop?.averageRating ?? product.averageRating ?? 4.5;
  const images = product?.images?.length ? product.images : [fallbackImage];

  // Derive seller display for dashboard marketplace
  const sellerUser = (typeof product.seller === "object" ? product.seller : undefined) as any | undefined;
  const shopOwner = (shop && typeof shop.owner === "object" ? (shop.owner as any) : undefined) as any | undefined;
  const sellerName =
    sellerUser?.fullName ||
    shopOwner?.fullName ||
    (product as any)?.shop?.ownerName ||
    "Seller";
  const sellerAvatar =
    sellerUser?.avatar ||
    shopOwner?.avatar ||
    (product as any)?.shop?.sellerAvatar ||
    shop?.logo ||
    fallbackImage;

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

  const handleQuickAdd = (e: React.MouseEvent, variant?: any) => {
    e.preventDefault();
    e.stopPropagation();

    const item = {
      _id: product._id,
      title: product.title,
      price: variant?.price ?? product.price,
      images: (variant as any)?.image ? [(variant as any).image, ...(product.images || [])] : product.images,
      quantity: 1,
      seller: typeof product.seller === 'string' ? product.seller : product.seller?._id,
      shopSlug: shopSlug,
      moq: product.inventory?.moq || product.moq || 1,
      stock: variant?.stock ?? (product.inventory?.quantity ?? product.stock ?? 999),
      variantId: variant?._id,
      variantName: variant?.name
    };

    addItem(item);

    trackEvent({
      name: "quick_add_to_cart",
      properties: {
        productId: product._id,
        title: product.title,
        price: item.price,
        variant: variant?.name
      }
    });

    toast.success(`${product.title}${variant ? ` (${variant.name})` : ''} added`, {
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

  const hasVariants = !!(product.variants && product.variants.length > 0);

  // Derive min/max price from variants when present, fall back to product.price/maxPrice
  let displayMinPrice = product.price;
  let displayMaxPrice = product.maxPrice;

  if (hasVariants) {
    const activeVariants = (product.variants || []).filter((v) => v && (v as any).active !== false);
    const variantPrices = activeVariants
      .map((v) => v.price)
      .filter((p): p is number => typeof p === "number" && !Number.isNaN(p));

    if (variantPrices.length > 0) {
      const min = Math.min(...variantPrices);
      const max = Math.max(...variantPrices);
      displayMinPrice = min;
      displayMaxPrice = max > min ? max : undefined;
    }
  }

  const optionsPanelContent = hasVariants && optionsOpen && optionsPanelPosition && typeof document !== "undefined" && createPortal(
    <>
      <div
        className="fixed inset-0 z-[80]"
        aria-hidden
        onClick={() => setOptionsOpen(false)}
      />
      <div
        className="fixed z-[81] pointer-events-none"
        style={{
          top: Math.max(16, optionsPanelPosition.top - 8),
          left: optionsPanelPosition.left,
          width: optionsPanelPosition.width,
          transform: "translateY(-100%)",
        }}
      >
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] border border-gray-100/80 overflow-hidden">
          <div className="absolute -bottom-2 right-6 left-auto -translate-x-0 w-4 h-4 bg-white border-r border-b border-gray-100/80 rotate-45 rounded-sm shadow-sm" />
          <div className="relative px-3 pt-3 pb-2">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
              Choose variant
            </p>
            <div className="max-h-52 overflow-y-auto no-scrollbar space-y-0.5 pr-0.5">
              {product.variants?.map((v) => {
                const thumb = (v as any).image || images[0];
                const price = v.price ?? product.price;
                const stock = (v as any).stock ?? product.inventory?.quantity ?? product.stock ?? 0;
                const outOfStock = stock <= 0;
                return (
                  <button
                    key={v._id}
                    onClick={(e) => {
                      if (outOfStock) return;
                      handleQuickAdd(e, v);
                      setOptionsOpen(false);
                    }}
                    className={cn(
                      "w-full p-2.5 rounded-xl hover:bg-gray-50/90 transition-colors text-left group/item border border-transparent hover:border-gray-100",
                      outOfStock && "opacity-50 cursor-not-allowed hover:bg-transparent hover:border-transparent"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 ring-1 ring-gray-100/50">
                          <Image
                            src={thumb}
                            alt={v.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-xs font-bold text-gray-900 truncate">
                            {v.name}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {outOfStock ? "Out of stock" : `${stock} in stock`}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-gray-900 tabular-nums shrink-0 sm:ml-0">
                        ₦{price.toLocaleString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn("group/card flex flex-col h-full bg-white rounded-[2rem] border border-gray-100/50 shadow-sm hover:shadow-xl transition-all duration-500", className)}
    >
      {optionsPanelContent}
      <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-t-[2rem]">
        {isInsideDashboard ? (
          <div className="block w-full h-full">
            <ImageSlider
              images={images}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
              fillContainer
              showDots={false}
              showArrows={true}
            />
          </div>
        ) : (
          <Link href={`/product/${product.slug}`} onClick={handleClick} className="block w-full h-full">
            <ImageSlider
              images={images}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
              fillContainer
              showDots={false}
              showArrows={true}
            />
          </Link>
        )}

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
          {isInsideDashboard ? (
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[2.5rem] leading-tight">
              {product.title}
            </h3>
          ) : (
            <Link href={`/product/${product.slug}`} onClick={handleClick} className="block">
              <h3 className="text-sm font-bold text-gray-900 group-hover/card:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem] leading-tight">
                {product.title}
              </h3>
            </Link>
          )}

          <p className="text-[11px] text-gray-400 capitalize">
            {typeof product.category === 'object' ? (product.category as any)?.name : (product.category || "General")}
          </p>

          {showSellerRow && sellerName && (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-7 w-7 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                <Image
                  src={sellerAvatar}
                  alt={sellerName}
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-gray-900 leading-tight line-clamp-1">
                  {sellerName}
                </span>
                {shopName && (
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest leading-none">
                    Shop: <span className="text-gray-600">{shopName}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between relative">
          <div className="flex flex-col">
            <ProductPrice
              price={displayMinPrice}
              maxPrice={displayMaxPrice}
              hasVariants={hasVariants}
              size="md"
              className="leading-tight"
            />
          </div>

          {/* Variations / Quick Add button */}
          <div className="relative flex flex-col items-end">
            {hasVariants ? (
              <button
                ref={optionsTriggerRef}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOptionsOpen((open) => !open);
                }}
                className="px-4 h-10 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-2 relative z-10"
              >
                Options
                <Plus className={cn("h-3 w-3 transition-transform", optionsOpen && "rotate-45")} />
              </button>
            ) : (
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
            )}
          </div>
        </div>

        {/* Absolute corner price optional styling for specific design if needed, but flex items-between is cleaner here */}
      </CardContent>
    </motion.div>
  );
}
