"use client";
import toast from "react-hot-toast";

import { Heart, Share2, Star, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEffectivePrice, getProductDisplayPriceRange } from "@/lib/productPricing";
import { ProductDetailTabs } from "./ProductDetailTabs";

interface ProductDetailMetaProps {
  product: any;
  selectedVariantId: string | "standard" | null;
  setSelectedVariantId: (id: string | "standard" | null) => void;
  isWishlisted: boolean;
  onShare: () => void;
  onToggleWishlist: () => void;
  activeTab: "description" | "specifications";
  setActiveTab: (tab: "description" | "specifications") => void;
}

export function ProductDetailMeta({
  product,
  selectedVariantId,
  setSelectedVariantId,
  isWishlisted,
  onShare,
  onToggleWishlist,
  activeTab,
  setActiveTab,
}: ProductDetailMetaProps) {
  const selectedVariant = product.variants?.find((v: any) => String(v._id || v.id || v.name) === String(selectedVariantId));
  const currentPrice = getEffectivePrice(product.price, selectedVariant?.price);
  const currentCompareAtPrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const { minPrice, maxPrice } = getProductDisplayPriceRange(product);
  const showRange = !selectedVariantId && !!maxPrice;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1 text-emerald-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-emerald-500" />
            ))}
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Verified Elite Choice
          </span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onShare} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Share2 className="w-5 h-5 text-gray-400" />
          </button>
          <button
            type="button"
            onClick={onToggleWishlist}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors",
                isWishlisted ? "text-rose-500 fill-rose-500" : "text-gray-400"
              )}
            />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-taja-secondary tracking-tighter leading-tight italic">
          {product.title}
        </h1>
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-emerald-100 to-transparent"></div>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
            Authentic Quality
          </span>
        </div>
      </div>

      <ProductDetailTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        description={product.description}
        specifications={product.specifications}
        compact
      />

      {/* Desktop: headline price under details; mobile uses fixed purchase bar */}
      <div className="hidden lg:block space-y-2">
        <div className="flex items-baseline gap-4">
          <span className="text-4xl sm:text-5xl font-black text-taja-primary tracking-tighter">
            {showRange
              ? `From ₦${minPrice.toLocaleString()} - ₦${maxPrice.toLocaleString()}`
              : `₦${currentPrice.toLocaleString()}`}
          </span>
          {currentCompareAtPrice > currentPrice && (
            <span className="text-xl text-gray-300 line-through decoration-emerald-500/30 decoration-2">
              ₦{currentCompareAtPrice.toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
          <Truck className="w-3 h-3" />
          {product.shipping?.freeShipping ? "Complementary Elite Shipping" : "Priority Dispatch in 24h"}
        </p>
      </div>

      {product.variants?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Select Option
            </label>
            <span className="text-[10px] font-bold text-taja-primary uppercase tracking-widest bg-taja-primary/5 px-2 py-0.5 rounded-full">
              {product.variants.length} Available
            </span>
          </div>

          {selectedVariant && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">
                  Selected: {selectedVariant.name}
                </span>
              </div>
              <span className="text-[11px] font-black text-taja-secondary">
                ₦{getEffectivePrice(product.price, selectedVariant.price).toLocaleString()}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-[30] isolate">
            {/* Standard Option */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedVariantId("standard");
                toast.success("Standard option selected!", {
                  id: "v-select-std",
                  duration: 2000,
                });
              }}
              className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-1 cursor-pointer active:scale-95 touch-manipulation z-[40]",
                selectedVariantId === "standard"
                  ? "border-emerald-500 bg-emerald-50/80 shadow-premium ring-2 ring-emerald-500/20"
                  : "border-slate-100 bg-white hover:border-emerald-200 hover:bg-slate-50"
              )}
              style={{ pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }}
            >
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-tight text-center leading-tight",
                  selectedVariantId === "standard" ? "text-taja-secondary" : "text-gray-400"
                )}
              >
                Standard
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold",
                  selectedVariantId === "standard" ? "text-taja-primary" : "text-gray-300"
                )}
              >
                ₦{product.price.toLocaleString()}
              </span>
            </button>

            {product.variants.map((variant: any) => {
              const variantId = String(variant._id || variant.id || variant.name);
              const isSelected = String(selectedVariantId) === variantId;
              return (
                <button
                  key={variantId}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Selected variant ID:", variantId);
                    setSelectedVariantId(variantId);
                    toast.success(`${variant.name} selected!`, {
                      id: "v-select",
                      duration: 2000,
                    });
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-1 cursor-pointer active:scale-95 touch-manipulation z-[40]",
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/80 shadow-premium ring-2 ring-emerald-500/20"
                      : "border-slate-100 bg-white hover:border-emerald-200 hover:bg-slate-50"
                  )}
                  style={{ pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }}
                >
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-tight text-center leading-tight",
                      isSelected ? "text-taja-secondary" : "text-gray-400"
                    )}
                  >
                    {variant.name}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      isSelected ? "text-taja-primary" : "text-gray-300"
                    )}
                  >
                    ₦{getEffectivePrice(product.price, variant.price).toLocaleString()}
                  </span>
                </button>
                );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
