"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { Heart, Star, ShoppingBag, Plus, ShieldCheck, X, ArrowRight, Users, Clock, MapPin, MessageCircle, Link2, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ImageSlider } from "@/components/ui/ImageSlider";
import { ProductPrice } from "./ProductPrice";
import { ShopLink } from "../shop/ShopLink";
import { formatCurrency } from "@/lib/utils";
import { getEffectivePrice, getProductDisplayPriceRange } from "@/lib/productPricing";
import { trackEvent } from "@/lib/analytics";
import type { Product, Shop } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore, WishlistItem } from "@/components/wishlist";
import { toast } from "react-hot-toast";
import { getAbsoluteProductUrl, getProductPath } from "@/lib/productLinks";

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
  const [liveLikesCount, setLiveLikesCount] = useState(Number((product as any)?.likes ?? 0));
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsTriggerRef = useRef<HTMLButtonElement>(null);
  const [optionsPanelPosition, setOptionsPanelPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [sellerPanelOpen, setSellerPanelOpen] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useLayoutEffect(() => {
    if (!optionsOpen || typeof document === "undefined") return;
    const trigger = optionsTriggerRef.current;
    if (!trigger) return;
    const update = () => {
      const rect = trigger.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const padding = 16;
      const maxW = Math.min(280, vw - padding * 2);
      const width = Math.max(260, maxW);
      
      // Horizontal positioning
      let left = rect.right - width;
      left = Math.max(padding, Math.min(left, vw - width - padding));

      // Vertical positioning logic:
      // If there is enough room above, show it above. 
      // Otherwise, show it below.
      const thresholdAbove = 240; // Approx height of portal
      const roomAbove = rect.top;
      const showBelow = roomAbove < thresholdAbove;
      
      const gap = 8;
      const top = showBelow ? rect.bottom + gap : rect.top - gap;
      
      setOptionsPanelPosition({ 
        top, 
        left, 
        width,
        placement: showBelow ? "bottom" : "top"
      } as any);
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
  const shopStats = (shop as any)?.stats as
    | { averageRating?: number; reviewCount?: number; followerCount?: number }
    | undefined;
  const ratingValue = shopStats?.averageRating ?? (averageRating as any);
  const reviewCount =
    shopStats?.reviewCount ??
    (shop as any)?.reviewCount ??
    (product as any)?.reviewCount;
  const likesCount = liveLikesCount;
  const followerCount = shopStats?.followerCount ?? (shop as any)?.followerCount;
  const responseTime = (shop as any)?.settings?.responseTime as string | undefined;
  const locationParts = [
    (shop as any)?.address?.city,
    (shop as any)?.address?.state,
  ].filter(Boolean);
  const images = product?.images?.length ? product.images : [fallbackImage];
  const productPath = getProductPath(product as any);
  const previewVideoUrl = (() => {
    const raw = (product as any)?.videos;
    if (!Array.isArray(raw) || raw.length === 0) return "";
    const first = raw[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && typeof first.url === "string") return first.url;
    return "";
  })();

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

  const handleCopyProductLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const url = getAbsoluteProductUrl(product as any);
      await navigator.clipboard.writeText(url);
      toast.success("Product link copied");
    } catch {
      toast.error("Could not copy product link");
    }
  };

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasWishlisted = isWishlisted;

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
    setLiveLikesCount((prev) => Math.max(0, prev + (nowWishlisted && !wasWishlisted ? 1 : !nowWishlisted && wasWishlisted ? -1 : 0)));

    trackEvent({
      name: "wishlist_click",
      properties: { productId: product._id, slug: product.slug, location: "product_card", action: nowWishlisted ? "add" : "remove" },
    });

    if (nowWishlisted) {
      setShowBubbles(true);
      setTimeout(() => setShowBubbles(false), 1000);
      toast.success("Added to wishlist", { icon: "❤️" });
    } else {
      toast("Removed from wishlist", { icon: "💔" });
    }
  };

  useEffect(() => {
    setLiveLikesCount(Number((product as any)?.likes ?? 0));
  }, [product?._id, (product as any)?.likes]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !previewVideoUrl) return;
    if (isHovered) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isHovered, previewVideoUrl]);

  const handleQuickAdd = (e: React.MouseEvent, variant?: any) => {
    e.preventDefault();
    e.stopPropagation();

    const item = {
      _id: product._id,
      title: product.title,
      price: getEffectivePrice(product.price, variant?.price),
      images: (variant as any)?.image ? [(variant as any).image, ...(product.images || [])] : product.images,
      quantity: 1,
      seller: shopName,
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
  const { minPrice: displayMinPrice, maxPrice: displayMaxPrice } = getProductDisplayPriceRange(product);
  const baseOptionStock = Number(product.inventory?.quantity ?? (product as any).stock ?? 0);
  const baseOptionOutOfStock = baseOptionStock <= 0;

  const optionsPanelContent = hasVariants && optionsOpen && optionsPanelPosition && typeof document !== "undefined" && createPortal(
    <>
      <div
        className="fixed inset-0 z-[40]"
        aria-hidden
        onClick={() => setOptionsOpen(false)}
      />
      <div
        className="fixed z-[41] pointer-events-none"
        style={{
          top: optionsPanelPosition.top,
          left: optionsPanelPosition.left,
          width: optionsPanelPosition.width,
          transform: (optionsPanelPosition as any).placement === "bottom" ? "none" : "translateY(-100%)",
        }}
      >
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] border border-gray-100/80 overflow-hidden">
          <div className={cn(
            "absolute w-4 h-4 bg-white border-gray-100/80 rotate-45 rounded-sm shadow-sm",
            (optionsPanelPosition as any).placement === "bottom" 
              ? "-top-2 right-6 border-l border-t" 
              : "-bottom-2 right-6 border-r border-b"
          )} />
          <div className="relative px-3 pt-3 pb-2">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
              Choose option
            </p>
            <div className="max-h-52 overflow-y-auto no-scrollbar space-y-0.5 pr-0.5">
              <button
                type="button"
                onClick={(e) => {
                  if (baseOptionOutOfStock) return;
                  handleQuickAdd(e, undefined);
                  setOptionsOpen(false);
                }}
                className={cn(
                  "w-full p-2.5 rounded-xl hover:bg-gray-50/90 transition-colors text-left group/item border border-transparent hover:border-gray-100",
                  baseOptionOutOfStock &&
                    "opacity-50 cursor-not-allowed hover:bg-transparent hover:border-transparent"
                )}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mt-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 ring-1 ring-gray-100/50">
                      <Image
                        src={images[0]}
                        alt=""
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-gray-900 truncate">Standard</span>
                      <span className="text-[10px] text-gray-500">
                        {baseOptionOutOfStock ? "Out of stock" : `${baseOptionStock} in stock`}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-gray-900 tabular-nums shrink-0 sm:ml-0">
                    ₦{Number(product.price ?? 0).toLocaleString()}
                  </span>
                </div>
              </button>
              {product.variants?.map((v) => {
                const thumb = (v as any).image || images[0];
                const price = getEffectivePrice(product.price, (v as any).price);
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mt-2">
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

  const sellerPanelContent = sellerPanelOpen && shopSlug && typeof document !== "undefined" && createPortal(
    <>
      <div
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
        onClick={() => setSellerPanelOpen(false)}
        aria-hidden
      />
      {/* Above MobileBottomNav (z-50); below cart drawer (z-[100]) */}
      <div className="fixed inset-x-0 bottom-0 z-[91] flex justify-center px-2 pb-[env(safe-area-inset-bottom,0px)] pointer-events-none">
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 24, stiffness: 220 }}
          className="pointer-events-auto mx-auto max-h-[min(560px,82dvh)] max-w-md w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-white shadow-[0_-16px_40px_rgba(15,23,42,0.25)] border-t border-slate-100"
        >
          <div className="px-5 pt-4 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                  <Image
                    src={sellerAvatar}
                    alt={sellerName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">
                    {sellerName}
                  </p>
                  {shopName && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] truncate">
                      {shopName}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSellerPanelOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close seller preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Discover more pieces curated by this seller in their dedicated shop. Tap below to view their full catalog, policies, and story.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <ShieldCheck className={`h-4 w-4 ${isVerified ? "text-emerald-600" : "text-slate-300"}`} />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Status</p>
                  <p className="text-[11px] font-bold text-slate-900 truncate">
                    {isVerified ? "Verified seller" : "Seller"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Rating</p>
                  <p className="text-[11px] font-bold text-slate-900 truncate">
                    {typeof ratingValue === "number" ? ratingValue.toFixed(1) : "—"}
                    {reviewCount ? <span className="text-slate-400"> · {reviewCount} reviews</span> : null}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <Users className="h-4 w-4 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Followers</p>
                  <p className="text-[11px] font-bold text-slate-900 truncate">
                    {typeof followerCount === "number" ? followerCount.toLocaleString() : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Response</p>
                  <p className="text-[11px] font-bold text-slate-900 truncate">
                    {responseTime || "—"}
                  </p>
                </div>
              </div>
            </div>

            {locationParts.length > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-700">Location:</span>
                <span className="truncate">{locationParts.join(", ")}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Link
                href={`/chat?seller=${(product.seller as any)?._id || product.seller}&product=${product._id}&shopId=${shop?._id}`}
                className="inline-flex items-center justify-center w-full h-11 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.22em] gap-2 hover:bg-emerald-700 transition-colors"
                onClick={() => setSellerPanelOpen(false)}
              >
                <MessageCircle className="h-4 w-4" />
                Message Seller
              </Link>
              <Link
                href={`/shop/${shopSlug}`}
                className="inline-flex items-center justify-center w-full h-11 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.22em] gap-2 hover:bg-slate-800 transition-colors"
                onClick={() => setSellerPanelOpen(false)}
              >
                Visit Seller Shop
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>,
    document.body
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("group/card flex flex-col h-full bg-white rounded-[2rem] border border-gray-100/50 shadow-sm hover:shadow-xl transition-all duration-500", className)}
    >
      {optionsPanelContent}
      {sellerPanelContent}
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
          <Link href={productPath} onClick={handleClick} className="block w-full h-full">
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
        {previewVideoUrl && (
          <>
            <video
              ref={videoRef}
              src={previewVideoUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className={cn(
                "absolute inset-0 h-full w-full object-cover pointer-events-none transition-opacity duration-300",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            />
            <div className="absolute left-4 bottom-4 z-10 px-2.5 py-1.5 rounded-full bg-black/60 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 pointer-events-none">
              <PlayCircle className="h-3.5 w-3.5" />
              Video Preview
            </div>
          </>
        )}

        {/* Wishlist Button Overlay */}
        {showWishlist && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleWishlistClick}
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-900 shadow-sm border border-white/40 active:scale-90 transition-all relative"
            >
              <Heart className={cn("h-4.5 w-4.5 transition-colors relative z-10", isWishlisted && "fill-rose-500 text-rose-500")} />
              
              {/* Love Bubbling Animation */}
              {showBubbles && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 1, y: 0, x: 0 }}
                      animate={{ 
                        scale: [0, 1.5, 1, 0],
                        opacity: [1, 1, 0.8, 0],
                        y: -40 - Math.random() * 50,
                        x: (Math.random() - 0.5) * 80
                      }}
                      transition={{ 
                        duration: 1,
                        ease: "easeOut",
                        delay: Math.random() * 0.2
                      }}
                      className="absolute text-rose-500 pointer-events-none"
                    >
                      <Heart className="h-3 w-3 fill-current" />
                    </motion.div>
                  ))}
                </>
              )}
            </button>
          </div>
        )}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={handleCopyProductLink}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-900 shadow-sm border border-white/40 active:scale-90 transition-all"
            title="Copy product link"
          >
            <Link2 className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Condition/New Badge */}
        {product.condition === 'new' && (
          <div className="absolute top-4 left-[3.25rem] px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full z-10">
            NEW
          </div>
        )}
      </div>

      <CardContent className="p-2 sm:p-4 flex flex-col justify-between flex-grow">
        <div className="space-y-1 pr-3 sm:pr-12">
          {isInsideDashboard ? (
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[2.5rem] leading-tight">
              {product.title}
            </h3>
          ) : (
            <Link href={productPath} onClick={handleClick} className="block">
              <h3 className="text-sm font-bold text-gray-900 group-hover/card:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem] leading-tight">
                {product.title}
              </h3>
            </Link>
          )}

          <p className="inline-flex px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-100/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
            {typeof product.category === 'object' ? (product.category as any)?.name : (product.category || "General")}
          </p>
          <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
            <Heart className="h-3 w-3" />
            <span>{likesCount.toLocaleString()} likes</span>
          </p>

          {showSellerRow && sellerName && (
            <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-gray-100/80 bg-gradient-to-b from-gray-50/50 to-gray-50/20 p-2.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-1.5 sm:from-transparent sm:to-transparent sm:shadow-none sm:border-gray-50 sm:bg-gray-50/30 group/seller-row">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSellerPanelOpen(true);
                }}
                className="flex w-full min-w-0 items-center gap-2.5 text-left sm:w-auto sm:flex-1 sm:gap-2"
              >
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100 sm:h-7 sm:w-7">
                  <Image
                    src={sellerAvatar}
                    alt={sellerName}
                    fill
                    sizes="(max-width: 640px) 36px, 28px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold leading-snug text-gray-900 line-clamp-2 sm:text-[11px] sm:leading-tight sm:line-clamp-1 group-hover/seller-row:text-emerald-700 transition-colors">
                    {sellerName}
                  </span>
                  {shopName && (
                    <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-widest text-gray-400 line-clamp-1">
                      {shopName}
                    </span>
                  )}
                </div>
              </button>
              <Link
                href={`/chat?seller=${(product.seller as any)?._id || product.seller}&product=${product._id}&shopId=${shop?._id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200/90 bg-white text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[0.98] sm:h-7 sm:w-7 sm:gap-0 sm:rounded-full sm:p-0 sm:text-gray-400 sm:hover:text-emerald-600"
                title="Message seller"
              >
                <MessageCircle className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="sm:sr-only">Message</span>
              </Link>
            </div>
          )}
        </div>

        <div className="mt-auto pt-2 flex flex-col gap-3 relative">
          <div className="min-w-0">
            <ProductPrice
              price={displayMinPrice}
              maxPrice={displayMaxPrice}
              hasVariants={hasVariants}
              size="md"
              className="leading-tight"
            />
          </div>

          {/* Variations / Quick Add button - now on its own row for more space */}
          <div className="relative flex items-center justify-between w-full">
            <div className="flex-1" />
            {hasVariants ? (
              <button
                ref={optionsTriggerRef}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOptionsOpen(!optionsOpen);
                }}
                className={cn(
                  "h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2",
                  optionsOpen ? "bg-taja-secondary text-white" : "bg-taja-light/50 text-taja-secondary hover:bg-taja-light"
                )}
              >
                Options
                <Plus className={cn("h-3.5 w-3.5 transition-transform", optionsOpen && "rotate-45")} />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  if (baseOptionOutOfStock) return;
                  handleQuickAdd(e, undefined);
                }}
                disabled={baseOptionOutOfStock}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all bg-taja-primary text-white hover:bg-emerald-600 active:scale-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </motion.div>
  );
}
