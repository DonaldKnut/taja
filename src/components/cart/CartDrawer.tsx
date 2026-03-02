import { X, ShoppingCart, ArrowRight, Package, AlertCircle } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { CartItem } from "./CartItem";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export interface CartDrawerProps {
  /**
   * Whether the drawer is open
   */
  isOpen: boolean;
  /**
   * Function to close the drawer
   */
  onClose: () => void;
  /**
   * Custom className for the drawer
   */
  className?: string;
  /**
   * Custom className for the overlay
   */
  overlayClassName?: string;
  /**
   * Custom format for price display
   */
  formatPrice?: (price: number) => string;
  /**
   * Custom empty cart message
   */
  emptyMessage?: {
    title?: string;
    subtitle?: string;
  };
  /**
   * Custom checkout button text
   */
  checkoutButtonText?: string;
  /**
   * Custom checkout URL (default: "/checkout")
   */
  checkoutUrl?: string;
  /**
   * Show checkout button (default: true)
   */
  showCheckout?: boolean;
}

export function CartDrawer({
  isOpen,
  onClose,
  className,
  overlayClassName,
  formatPrice = (price) => `₦${price.toLocaleString()}`,
  emptyMessage = {
    title: "Your cart feels light",
    subtitle: "Explore our collection and find something you love",
  },
  checkoutButtonText = "Secure Checkout",
  checkoutUrl = "/checkout",
  showCheckout = true,
}: CartDrawerProps) {
  const { items, getTotalPrice } = useCartStore();
  const totalPrice = getTotalPrice();
  const hasMoqErrors = items.some(item => item.quantity < item.moq);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[99] transition-opacity",
              overlayClassName
            )}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed right-0 top-0 h-full w-full max-w-[450px] bg-white shadow-2xl z-[100] flex flex-col overflow-hidden",
              className
            )}
          >
            {/* Header */}
            <div className="relative pt-8 pb-6 px-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Shopping Bag</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{items.length} {items.length === 1 ? 'Item' : 'Items'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all text-gray-400 hover:text-gray-900"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-8 py-2 space-y-4 custom-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-6"
                  >
                    <Package className="h-10 w-10 text-gray-200" />
                  </motion.div>
                  <p className="text-lg font-bold text-gray-900">{emptyMessage.title}</p>
                  <p className="text-sm text-gray-400 mt-2 max-w-[200px] leading-relaxed">{emptyMessage.subtitle}</p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {items.map((item, index) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <CartItem item={item} formatPrice={formatPrice} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="relative px-8 pt-1.5 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-8 mt-auto border-t border-gray-100 bg-white/95 backdrop-blur-md">
                <div className="space-y-3">
                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-center -mb-1">
                      <div className="px-3 py-0.5 rounded-full bg-emerald-500 text-[8px] font-black text-white uppercase tracking-widest shadow-lg shadow-emerald-500/10">
                        Free Logistics
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Subtotal</span>
                      <span className="text-xs font-bold text-gray-900">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-gray-50/50">
                      <span className="text-xs font-black text-gray-900">Estimate</span>
                      <span className="text-lg font-black text-emerald-600 tracking-tighter">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* MOQ Warning */}
                  {hasMoqErrors && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-tight">Order Requirements</p>
                        <p className="text-[9px] font-medium text-rose-500 mt-0.5">Some items in your cart do not meet the minimum order quantity set by the seller.</p>
                      </div>
                    </div>
                  )}

                  {/* Checkout Button */}
                  {showCheckout && (
                    <motion.div
                      whileHover={hasMoqErrors ? {} : { scale: 1.01 }}
                      whileTap={hasMoqErrors ? {} : { scale: 0.99 }}
                    >
                      <Link
                        href={hasMoqErrors ? "#" : checkoutUrl}
                        onClick={(e) => {
                          if (hasMoqErrors) e.preventDefault();
                          else onClose();
                        }}
                        className={cn(
                          "group flex items-center justify-between w-full h-12 px-6 rounded-lg font-black text-white transition-all shadow-xl overflow-hidden relative",
                          hasMoqErrors
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                            : "bg-gray-900 hover:bg-emerald-600 shadow-gray-200"
                        )}
                      >
                        <div className="flex items-center gap-2 relative z-10 transition-transform group-hover:translate-x-1">
                          <span className="text-xs">{checkoutButtonText}</span>
                          {hasMoqErrors && <span className="text-[8px] font-bold uppercase">(MOQ Not Met)</span>}
                        </div>
                        <ArrowRight className="h-4 w-4 relative z-10" />
                        {!hasMoqErrors && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        )}
                      </Link>
                    </motion.div>
                  )}
                </div>
                {/* Minimal Mobile Spacer */}
                <div className="md:hidden h-12" />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
