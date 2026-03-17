"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { OffPlatformPaymentWarningModal } from "@/components/security/OffPlatformPaymentWarningModal";

interface ProductPurchaseActionsProps {
  product: any;
  quantity: number;
  setQuantity: (quantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  getWhatsAppUrl: (whatsapp: string, product?: any) => string | null;
}

export function ProductPurchaseActions({
  product,
  quantity,
  setQuantity,
  onAddToCart,
  onBuyNow,
  getWhatsAppUrl,
}: ProductPurchaseActionsProps) {
  const [whatsappWarningOpen, setWhatsappWarningOpen] = useState(false);
  const [pendingWhatsAppUrl, setPendingWhatsAppUrl] = useState<string | null>(null);

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
            disabled={product.stock <= 0}
            variant="outline"
            className={cn(
              "flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] border-emerald-500/20 hover:bg-emerald-50",
              product.stock <= 0 && "opacity-50 cursor-not-allowed border-gray-100"
            )}
          >
            {product.stock > 0 ? "Add to Cart" : "Unavailable"}
          </Button>
        </div>
        <Button
          onClick={onBuyNow}
          disabled={product.stock <= 0}
          className={cn(
            "w-full h-16 rounded-[1.25rem] text-xs font-black uppercase tracking-[0.3em] shadow-premium bg-gradient-to-r from-taja-secondary to-slate-800",
            product.stock <= 0 && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {product.stock > 0 ? "Buy Now" : "Out of Stock"}
        </Button>

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

      <AnimatePresence>
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]"
        >
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <Button
              onClick={onAddToCart}
              disabled={product.stock <= 0}
              variant="outline"
              className={cn(
                "flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] border-gray-200",
                product.stock <= 0 && "opacity-50 cursor-not-allowed border-gray-100"
              )}
            >
              {product.stock > 0 ? "Add to Cart" : "Sold Out"}
            </Button>
            <Button
              onClick={onBuyNow}
              disabled={product.stock <= 0}
              className={cn(
                "flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] shadow-premium bg-gradient-to-r from-taja-primary to-emerald-700",
                product.stock <= 0 && "opacity-50 cursor-not-allowed grayscale"
              )}
            >
              {product.stock > 0 ? "Buy Now" : "Out of Stock"}
            </Button>

            {product.stock <= 0 && product.shop.socialLinks.whatsapp && (
              <Button
                type="button"
                variant="outline"
                className="w-14 h-14 rounded-2xl p-0 flex items-center justify-center border-emerald-500/20 text-emerald-600"
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
                <MessageCircle className="w-6 h-6" />
              </Button>
            )}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </motion.div>
      </AnimatePresence>
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
