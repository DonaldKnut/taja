"use client";

import { MessageCircle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { getEffectivePrice, getProductDisplayPriceRange } from "@/lib/productPricing";
import { OffPlatformPaymentWarningModal } from "@/components/security/OffPlatformPaymentWarningModal";

interface ProductPurchaseActionsProps {
  product: any;
  /** Used to show the live price in the mobile action bar */
  selectedVariantId?: string | "standard" | null;
  quantity: number;
  setQuantity: (quantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  getWhatsAppUrl: (whatsapp: string, product?: any) => string | null;
  requiresVariantSelection?: boolean;
  isVariantSelected?: boolean;
}

export function ProductPurchaseActions({
  product,
  selectedVariantId = "standard",
  quantity,
  setQuantity,
  onAddToCart,
  onBuyNow,
  getWhatsAppUrl,
  requiresVariantSelection = false,
  isVariantSelected = true,
}: ProductPurchaseActionsProps) {
  const [whatsappWarningOpen, setWhatsappWarningOpen] = useState(false);
  const [pendingWhatsAppUrl, setPendingWhatsAppUrl] = useState<string | null>(null);

  const mustSelectVariant = requiresVariantSelection && !isVariantSelected;
  const canPurchase = product.stock > 0 && !mustSelectVariant;

  const selectedVariant = product.variants?.find(
    (v: any) => String(v._id || v.id || v.name) === String(selectedVariantId)
  );
  const currentPrice = getEffectivePrice(product.price, selectedVariant?.price);
  const currentCompareAtPrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const { minPrice, maxPrice } = getProductDisplayPriceRange(product);
  const showRange = !selectedVariantId && !!maxPrice;
  const mobilePriceLabel = mustSelectVariant
    ? "Select an option"
    : showRange
      ? `From ₦${minPrice.toLocaleString()} – ₦${maxPrice.toLocaleString()}`
      : `₦${currentPrice.toLocaleString()}`;

  return (
    <>
      <div className="hidden lg:flex flex-col gap-4">
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-3xl border border-slate-100">
          <div className="flex items-center bg-white rounded-2xl border border-slate-100 p-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-taja-primary transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-sm font-black text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-taja-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <Button
          onClick={onAddToCart}
          disabled={!canPurchase}
            variant="outline"
            className={cn(
              "flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] border-emerald-500/20 hover:bg-emerald-50",
              (!canPurchase) && "opacity-50 cursor-not-allowed border-gray-100"
            )}
          >
          {product.stock <= 0
            ? "Unavailable"
            : mustSelectVariant
              ? "Select an Option"
              : "Add to Cart"}
          </Button>
        </div>
        <Button
          onClick={onBuyNow}
        disabled={!canPurchase}
          className={cn(
            "w-full h-16 rounded-[1.25rem] text-xs font-black uppercase tracking-[0.3em] shadow-premium bg-gradient-to-r from-taja-secondary to-slate-800",
            (!canPurchase) && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {product.stock <= 0
            ? "Out of Stock"
            : mustSelectVariant
              ? "Select an Option"
              : "Buy Now"}
        </Button>

        {mustSelectVariant && (
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
            Please select an option before adding to cart.
          </p>
        )}

        {product.stock <= 0 && product.shop.socialLinks.whatsapp && (
          <Button
            type="button"
            variant="ghost"
            className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={() => {
              const url =
                getWhatsAppUrl(product.shop.socialLinks.whatsapp, {
                  title: `Restock Inquiry: ${product.title}`,
                  price: product.price,
                }) || null;
              if (url) {
                setPendingWhatsAppUrl(url);
                setWhatsappWarningOpen(true);
              }
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <MessageCircle className="w-3.5 h-3.5" />
              Inquire about Restock
            </span>
          </Button>
        )}
      </div>

      {/* Mobile: flush on top of bottom nav; --mobile-bottom-nav-height is set by MobileBottomNav (measured) */}
      <div
        className="fixed inset-x-0 z-[60] md:hidden border-t border-gray-100 bg-white/95 px-4 pt-2 pb-3 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.12)] backdrop-blur-xl"
        style={{
          bottom: "var(--mobile-bottom-nav-height, calc(env(safe-area-inset-bottom, 0px) + 3rem))",
        }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <p className="text-lg font-black tracking-tight text-taja-primary">{mobilePriceLabel}</p>
            {currentCompareAtPrice > currentPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₦{Number(currentCompareAtPrice).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Button
            onClick={onAddToCart}
            disabled={!canPurchase}
            variant="outline"
            className={cn(
              "h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] border-gray-200",
              !canPurchase && "cursor-not-allowed border-gray-100 opacity-50"
            )}
          >
            {product.stock <= 0
              ? "Sold Out"
              : mustSelectVariant
                ? "Select Option"
                : "Add to Cart"}
          </Button>
          <Button
            onClick={onBuyNow}
            disabled={!canPurchase}
            className={cn(
              "h-14 flex-[2] rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-premium bg-gradient-to-r from-taja-primary to-emerald-700",
              !canPurchase && "cursor-not-allowed grayscale opacity-50"
            )}
          >
            {product.stock <= 0
              ? "Out of Stock"
              : mustSelectVariant
                ? "Select Option"
                : "Buy Now"}
          </Button>
          {product.stock <= 0 && product.shop.socialLinks.whatsapp && (
            <Button
              type="button"
              variant="outline"
              className="h-14 w-14 shrink-0 rounded-2xl border-emerald-500/20 p-0 text-emerald-600"
              onClick={() => {
                const url =
                  getWhatsAppUrl(product.shop.socialLinks.whatsapp, {
                    title: `Availability Inquiry: ${product.title}`,
                    price: product.price,
                  }) || null;
                if (url) {
                  setPendingWhatsAppUrl(url);
                  setWhatsappWarningOpen(true);
                }
              }}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          )}
        </div>
        {mustSelectVariant && (
          <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Select an option before purchasing.
          </p>
        )}
      </div>

      <OffPlatformPaymentWarningModal
        open={whatsappWarningOpen}
        onCancel={() => {
          setWhatsappWarningOpen(false);
          setPendingWhatsAppUrl(null);
        }}
        onContinue={() => {
          if (pendingWhatsAppUrl) {
            window.open(pendingWhatsAppUrl, "_blank");
          }
          setWhatsappWarningOpen(false);
          setPendingWhatsAppUrl(null);
        }}
      />
    </>
  );
}
