"use client";

import { Heart, Share2, Star, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductDetailMetaProps {
  product: any;
  selectedVariantId: string | null;
  setSelectedVariantId: (id: string) => void;
  isWishlisted: boolean;
  onShare: () => void;
  onToggleWishlist: () => void;
}

export function ProductDetailMeta({
  product,
  selectedVariantId,
  setSelectedVariantId,
  isWishlisted,
  onShare,
  onToggleWishlist,
}: ProductDetailMetaProps) {
  const selectedVariant = product.variants?.find((v: any) => (v._id || v.id) === selectedVariantId);
  const currentPrice = selectedVariant?.price || product.price;
  const currentCompareAtPrice = selectedVariant?.compareAtPrice || product.compareAtPrice;

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

      <div className="space-y-2">
        <div className="flex items-baseline gap-4">
          <span className="text-4xl sm:text-5xl font-black text-taja-primary tracking-tighter">
            ₦{currentPrice.toLocaleString()}
            {!selectedVariantId && product.variants?.length > 0 && product.maxPrice > product.price && (
              <span className="text-3xl font-bold ml-1"> - ₦{product.maxPrice.toLocaleString()}</span>
            )}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {product.variants.map((variant: any) => {
              const variantId = variant._id || variant.id;
              const isSelected = selectedVariantId === variantId;
              return (
                <button
                  key={variantId}
                  onClick={() => setSelectedVariantId(variantId)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-1",
                    isSelected
                      ? "border-taja-primary bg-taja-primary/5 shadow-premium"
                      : "border-gray-50 bg-gray-50/30 hover:border-gray-100"
                  )}
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
                    ₦{(variant.price || product.price).toLocaleString()}
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
