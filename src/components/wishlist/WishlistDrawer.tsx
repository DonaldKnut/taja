"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Heart, ArrowRight, PackageX, ShoppingBag, Loader2 } from "lucide-react";
import { useWishlistStore } from ".";
import { useCartStore } from "@/components/cart";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export function WishlistDrawer() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    // Wishlist state
    const isOpen = useWishlistStore((state) => state.isOpen);
    const items = useWishlistStore((state) => state.items);
    const closeDrawer = useWishlistStore((state) => state.closeDrawer);
    const removeItem = useWishlistStore((state) => state.removeItem);
    const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
    const hasLoaded = useWishlistStore((state) => state.hasLoaded);

    // Cart state
    const addItemToCart = useCartStore((state) => state.addItem);
    const openCart = useCartStore((state) => state.openDrawer);

    const [movingToCart, setMovingToCart] = useState<string | null>(null);

    // Sync wishlist when drawer opens if we haven't already
    useEffect(() => {
        if (isOpen && isAuthenticated && !hasLoaded) {
            fetchWishlist();
        }
    }, [isOpen, isAuthenticated, hasLoaded, fetchWishlist]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    const handleMoveToCart = async (item: any) => {
        setMovingToCart(item._id);

        // Add to cart
        addItemToCart({
            _id: item._id,
            title: item.title,
            price: item.price,
            images: item.images || ["/placeholder.jpg"],
            seller: item.shop?.shopName || "Taja Store",
            shopSlug: item.shop?.shopSlug,
            moq: 1,
            stock: item.inventory?.quantity ?? 999
        });

        // Remove from wishlist
        await removeItem(item._id);

        setMovingToCart(null);
        closeDrawer();
        openCart();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10052] flex justify-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeDrawer}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-md h-full bg-white shadow-huge flex flex-col"
                    >
                        {/* Header: Focused on clarity and branding */}
                        <div className="flex items-center justify-between p-4 sm:p-6 pt-[max(1rem,env(safe-area-inset-top,0px))] border-b border-gray-100 bg-white z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500 hidden min-[400px]:block">
                                    <Heart className="h-5 w-5 fill-current" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Your Wishlist</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {items.length} {items.length === 1 ? "Item" : "Items"} Saved
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeDrawer}
                                className="p-2 hover:bg-slate-50 rounded-full transition-colors group"
                            >
                                <X className="h-5 w-5 text-slate-400 group-hover:text-slate-600 group-hover:rotate-90 transition-all duration-300" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">
                            {!isAuthenticated ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-rose-50 flex items-center justify-center">
                                        <Heart className="h-10 w-10 text-rose-200 fill-current" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Save Your Favorites</h3>
                                        <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">
                                            Sign in to save items you love and keep track of them anywhere you go.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => { closeDrawer(); router.push('/login'); }}
                                        className="h-12 px-8 rounded-2xl bg-slate-950 text-white font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Sign In to Save
                                    </Button>
                                </div>
                            ) : items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-slate-100 flex items-center justify-center">
                                        <PackageX className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Your Wishlist is Empty</h3>
                                        <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">
                                            Browse the marketplace and tap the heart icon to save products here for later.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => { closeDrawer(); router.push('/marketplace'); }}
                                        className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-slate-950 text-white font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Explore Marketplace
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <AnimatePresence initial={false}>
                                        {items.map((item) => (
                                            <motion.div
                                                key={item._id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                                                className="bg-white p-3 sm:p-4 rounded-[1.5rem] sm:rounded-3xl border border-gray-100 shadow-premium-subtle flex gap-3 sm:gap-4 group hover:shadow-premium transition-all"
                                            >
                                                {/* Image: Compact for small screens */}
                                                <Link
                                                    href={`/product/${item.slug}`}
                                                    onClick={closeDrawer}
                                                    className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-slate-50 overflow-hidden flex-shrink-0 border border-gray-50"
                                                >
                                                    <Image
                                                        src={item.images?.[0] || "/placeholder.jpg"}
                                                        alt={item.title}
                                                        fill
                                                        className="object-cover transition-transform group-hover:scale-105"
                                                    />
                                                </Link>
                                                
                                                {/* Details: Optimized for readability */}
                                                <div className="flex flex-1 flex-col min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <Link href={`/product/${item.slug}`} onClick={closeDrawer} className="min-w-0">
                                                            <h4 className="text-[13px] sm:text-sm font-black text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors tracking-tight">
                                                                {item.title}
                                                            </h4>
                                                            {/* Secondary Title / Category Line */}
                                                            <p className="text-[11px] font-bold text-slate-400 line-clamp-1">
                                                                {item.title}
                                                            </p>
                                                        </Link>
                                                        <button
                                                            onClick={() => removeItem(item._id)}
                                                            className="p-1.5 -mr-1.5 -mt-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 mb-auto">
                                                        By {item.shop?.shopName || "Taja Store"}
                                                    </p>
                                                    
                                                    <div className="flex items-center justify-between mt-2 gap-2">
                                                        <span className="text-[15px] sm:text-base font-black text-slate-900 tracking-tighter">
                                                            ₦{(item.price || 0).toLocaleString()}
                                                        </span>
                                                        
                                                        <button
                                                            onClick={() => handleMoveToCart(item)}
                                                            disabled={movingToCart === item._id || (item.inventory?.quantity === 0)}
                                                            className="flex items-center justify-center p-2 rounded-xl bg-slate-950 text-white hover:bg-emerald-600 transition-all font-black uppercase text-[8px] tracking-widest shadow-premium active:scale-95 disabled:opacity-50"
                                                        >
                                                            {movingToCart === item._id ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : item.inventory?.quantity === 0 ? (
                                                                "Sold"
                                                            ) : (
                                                                "Add"
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                            )}
                        </div>

                        {/* Footer Action */}
                        {items.length > 0 && isAuthenticated && (
                            <div className="p-6 bg-white border-t border-gray-100 space-y-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                                <Button
                                    onClick={() => { closeDrawer(); router.push('/dashboard/wishlist'); }}
                                    variant="outline"
                                    className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px]"
                                >
                                    Manage Full Wishlist
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
