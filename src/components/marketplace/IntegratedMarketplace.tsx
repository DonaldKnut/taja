"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, Zap, Gift, Tag, Star, Sparkles, ChevronRight, ShoppingBag, ShieldCheck, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product";
import { useMarketplaceFeed } from "@/hooks/useMarketplaceFeed";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/stores/cartStore";
import { CartIcon } from "@/components/cart/CartIcon";

// Sliding background images for the header
const HEADER_IMAGES = [
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788747/taja_slider_two_xairfb.png",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788744/fresh-fish-lying-on-ice-displayed-at-market-stall-photo_z9hesn.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788740/jewellery-market-display-expensive-gold-W4Y9X5_njruyv.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788743/taja_slider_one_uejcaa.png",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788739/5b9b40227abe24427953fd15_1536901154609_hltbyr.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788740/close-up-japanese-street-food_23-2149287841_vlqufi.avif",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788741/cj-best-deal-nigeria_mh1xhd.webp",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788740/images_3_dwjrfw.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788739/images_2_ayogjf.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788740/Ankara-Fabric.-Photo-Jiji_drf9hb.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788741/Central_Car_Auctions_Glasgow_620-620x330_xgvcuw.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788740/1742419884817_v7haqx.jpg"
];

export interface IntegratedMarketplaceProps {
    isInsideDashboard?: boolean;
}

export function IntegratedMarketplace({ isInsideDashboard = false }: IntegratedMarketplaceProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedTab, setSelectedTab] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [showVerifiedIntro, setShowVerifiedIntro] = useState(() => {
        if (typeof window !== "undefined" && !isInsideDashboard) {
            return !sessionStorage.getItem("taja_intro_played");
        }
        return false;
    });
    const [headerIndex, setHeaderIndex] = useState(0);

    const { user } = useAuth();
    const firstName = user?.fullName?.split(" ")[0] || "Shopper";
    const { items, toggleCart, getTotalItems } = useCartStore();
    const cartCount = getTotalItems();

    const feed = useMarketplaceFeed({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
    });

    // Derived Brands from Product Feed
    const brands = useMemo(() => {
        const uniqueBrands = new Set<string>();
        feed.products.forEach(p => {
            // Check specifications for brand
            if (p.specifications?.brand) {
                uniqueBrands.add(p.specifications.brand);
            } else if (p.specifications?.Brand) {
                uniqueBrands.add(p.specifications.Brand);
            }
        });

        // Fallback if no brands found in feed, or to supplement
        const list = Array.from(uniqueBrands).map(b => ({
            name: b,
            logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(b)}&background=f8fafc&color=0f172a&bold=true`
        }));

        if (list.length === 0) {
            return [
                { name: "Nike", logo: "https://www.nike.com/favicon.ico" },
                { name: "Apple", logo: "https://www.apple.com/favicon.ico" },
                { name: "Sony", logo: "https://www.sony.net/favicon.ico" },
            ];
        }
        return list;
    }, [feed.products]);

    const displayedProducts = useMemo(() => {
        let prods = feed.products;
        if (selectedTab === "Promo") return prods.filter(p => (p.compareAtPrice ?? 0) > p.price);
        if (selectedTab === "Best Deals") return prods.slice(0, 4);
        return prods;
    }, [feed.products, selectedTab]);

    // Intro timer
    useEffect(() => {
        if (showVerifiedIntro) {
            const timer = setTimeout(() => {
                setShowVerifiedIntro(false);
                sessionStorage.setItem("taja_intro_played", "true");
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [showVerifiedIntro]);

    // Header image slider timer
    useEffect(() => {
        const timer = setInterval(() => {
            setHeaderIndex((prev) => (prev + 1) % HEADER_IMAGES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={cn(
            "bg-[#F8F9FB] min-h-screen overflow-hidden",
            isInsideDashboard ? "pb-12" : "pb-24"
        )}>
            <AnimatePresence mode="wait">
                {showVerifiedIntro && !isInsideDashboard ? (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        transition={{ duration: 0.8 }}
                        className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mx-auto w-24 h-24 rounded-[2rem] bg-taja-light flex items-center justify-center mb-8 ring-8 ring-taja-primary/5 shadow-premium"
                        >
                            <ShieldCheck className="w-12 h-12 text-taja-primary" />
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                        >
                            <h2 className="text-sm font-black text-taja-primary uppercase tracking-[0.4em]">Establish Trust</h2>
                            <h1 className="text-4xl md:text-6xl font-black text-taja-secondary tracking-tighter leading-none">
                                Refining <br /> <span className="text-transparent bg-clip-text bg-gradient-taja">The Market.</span>
                            </h1>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center justify-center gap-8 pt-12"
                        >
                            <div className="flex -space-x-4">
                                {[
                                    "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/dele_mup0gl.png",
                                    "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/LYNNPINNEDIT___mv5yne.jpg",
                                    "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/Portrait____Cooperate_headshot_qfzmsr.jpg",
                                    "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/sola_jbdewv.jpg"
                                ].map((src, i) => (
                                    <div key={i} className="h-12 w-12 rounded-full border-4 border-white bg-gray-100 shadow-xl overflow-hidden">
                                        <img src={src} alt="Verified User" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-left">
                                <p className="text-xl font-black text-taja-secondary tracking-tight">150k+</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Buyers</p>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="main"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full"
                    >
                        {/* ═══ Sliding Media Header ═══ */}
                        {/* ═══ Header Registry Search ═══ */}
                        {!isInsideDashboard && (
                            <section className="px-6 pt-12 pb-6 bg-white border-b border-gray-100">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="space-y-1">
                                        <p className="text-gray-400 text-xs font-medium uppercase tracking-widest leading-none">Premium Collection</p>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none italic">Hello, {firstName} 👋</h2>
                                    </div>

                                    {/* Mobile Cart Action */}
                                    <div className="md:hidden">
                                        <CartIcon
                                            className="w-14 h-14 bg-taja-light/30 backdrop-blur-2xl border border-taja-primary/10 rounded-[1.5rem] text-taja-primary shadow-premium active:scale-95 transition-all"
                                            iconSize="h-6 w-6"
                                            badgeClassName="bg-taja-primary text-white border-2 border-white !h-5 !w-5 !text-[10px] !-top-1 !-right-1"
                                        />
                                    </div>
                                </div>

                                {/* Search Bar - Functional at the top */}
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-taja-primary transition-colors">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search for something special..."
                                        className="w-full h-16 bg-white border border-gray-200 rounded-2xl pl-12 pr-14 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20 transition-all shadow-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black transition-colors bg-gray-50 rounded-xl">
                                        <Filter className="w-4 h-4" />
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* ═══ Stats View ═══ */}
                        <section className="px-6 py-8 grid grid-cols-2 gap-4 -mt-6 relative z-20">
                            <div className="bg-white/70 backdrop-blur-xl p-5 rounded-[2rem] shadow-premium flex items-center gap-4 border border-white/60">
                                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white">
                                    <Star className="w-4 h-4 fill-white" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Balance</p>
                                    <p className="text-sm font-black text-gray-900 tracking-tight">₦150k+</p>
                                </div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-xl p-5 rounded-[2rem] shadow-premium flex items-center gap-4 border border-white/60">
                                <div className="w-10 h-10 rounded-xl bg-taja-primary flex items-center justify-center text-white">
                                    <Zap className="w-4 h-4 fill-white" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Points</p>
                                    <p className="text-sm font-black text-gray-900 tracking-tight">12.4k</p>
                                </div>
                            </div>
                        </section>


                        {/* ═══ Product Feed ═══ */}
                        <section className="px-6 space-y-8 mt-4 pb-20">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic">Product Catalog</h3>
                                <div className="flex gap-2">
                                    {["All", "Promo", "Best Deals"].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setSelectedTab(tab)}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                                selectedTab === tab ? "bg-black text-white shadow-xl scale-105" : "text-gray-400 hover:text-black"
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Grid Layout - 2 columns on mobile */}
                            <AnimatePresence mode="popLayout">
                                {feed.loading ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="bg-white animate-pulse rounded-[2.5rem] h-72 border border-gray-100 shadow-sm" />
                                        ))}
                                    </div>
                                ) : displayedProducts.length > 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-1"
                                    >
                                        {displayedProducts.map((product) => (
                                            <ProductCard
                                                key={product._id}
                                                product={product}
                                                isInsideDashboard={isInsideDashboard}
                                                showSellerRow
                                            />
                                        ))}
                                    </motion.div>
                                ) : (
                                    <div className="bg-white/50 backdrop-blur-md rounded-[3rem] p-20 text-center border-dashed border-2 border-gray-200">
                                        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">No products found here yet</p>
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* Load More Action */}
                            <div className="pt-10 flex justify-center pb-20">
                                <button
                                    onClick={() => feed.refetch()}
                                    className="px-12 h-18 bg-white border border-gray-100 rounded-full shadow-premium flex items-center justify-center gap-4 group hover:shadow-xl transition-all active:scale-95"
                                >
                                    {feed.loading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                                    ) : (
                                        <>
                                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-900">Load More Products</span>
                                            <ChevronRight className="w-5 h-5 text-taja-primary group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </section>

                        {/* ═══ Curated Brands ═══ */}
                        <section className="px-6 py-4 pt-10 border-t border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <Crown className="w-5 h-5 text-taja-primary" />
                                <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase italic">Featured Shops</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 px-1 pb-6">
                                {(feed.recommendedShops && feed.recommendedShops.length > 0 ? feed.recommendedShops : []).map((shop) => (
                                    <Link
                                        key={shop._id}
                                        href={`/shop/${shop.shopSlug}`}
                                        className="flex flex-col items-center gap-3 group"
                                    >
                                        <div className="w-full aspect-square bg-white rounded-[1.5rem] flex items-center justify-center shadow-premium border border-gray-50 transition-all group-hover:shadow-xl group-hover:-translate-y-1 overflow-hidden relative p-4">
                                            {shop.logo ? (
                                                <img
                                                    src={shop.logo}
                                                    alt={shop.shopName}
                                                    className="w-full h-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
                                                    <ShoppingBag className="w-6 h-6 text-gray-200" />
                                                </div>
                                            )}
                                            {shop.isVerified && (
                                                <div className="absolute top-2 right-2 w-5 h-5 bg-taja-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                                    <ShieldCheck className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-[10px] font-black text-gray-900 uppercase tracking-widest group-hover:text-taja-primary transition-colors truncate w-full px-2">
                                                {shop.shopName}
                                            </span>
                                            <div className="flex items-center justify-center gap-1 mt-0.5">
                                                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                                <span className="text-[8px] font-black text-gray-400">{shop.averageRating || "5.0"}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* ═══ Promotional Experience Section (Moved Below Products) ═══ */}
                        {!isInsideDashboard && (
                            <section className="relative px-6 py-20 bg-black mt-20">
                                {/* Sliding Background Images */}
                                <div className="absolute inset-0 z-0">
                                    <AnimatePresence mode="popLayout">
                                        <motion.div
                                            key={headerIndex}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.4 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 2 }}
                                            className="absolute inset-0"
                                        >
                                            <Image
                                                src={HEADER_IMAGES[headerIndex]}
                                                alt="Promo Background"
                                                fill
                                                className="object-cover saturate-0"
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                                    <div className="absolute inset-0 motif-blanc opacity-[0.03]" />
                                </div>

                                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-taja-primary uppercase tracking-[0.4em]">The Taja Experience</h3>
                                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight italic">
                                            Curated Collections <br /> & Premium Finds.
                                        </h2>
                                    </div>

                                    {/* Quick Icon Links - In a more prominent promotional grid */}
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-8">
                                        {[
                                            { label: "GreatBuy", icon: ShoppingBag, color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
                                            { label: "Flash", icon: Zap, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
                                            { label: "Gift", icon: Gift, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
                                            { label: "Coupon", icon: Tag, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
                                            { label: "VIPArea", icon: Star, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
                                        ].map((item) => (
                                            <div key={item.label} className="flex flex-col items-center gap-4 group cursor-pointer">
                                                <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 border backdrop-blur-xl shadow-2xl", item.color)}>
                                                    <item.icon className="w-8 h-8" />
                                                </div>
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-taja-primary transition-colors">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-8">
                                        <Button
                                            variant="outline"
                                            className="rounded-full px-10 border-white/20 text-white hover:bg-white hover:text-black transition-all"
                                        >
                                            Explore Curated Collections
                                        </Button>
                                    </div>
                                </div>
                            </section>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
