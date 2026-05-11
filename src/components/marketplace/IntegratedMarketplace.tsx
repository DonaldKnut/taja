"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, Zap, Gift, Tag, Star, ChevronRight, ShoppingBag, ShieldCheck, Crown, ChevronDown, SlidersHorizontal, X, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product";
import { useMarketplaceFeed } from "@/hooks/useMarketplaceFeed";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
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
const MARKETPLACE_SLIDE_MS = 5000;
const SPOTLIGHT_SLIDES_BEFORE_DISMISS = 3;

export interface IntegratedMarketplaceProps {
    isInsideDashboard?: boolean;
    hasHostSidebar?: boolean;
}

interface MarketplaceFilterPreset {
    id: string;
    name: string;
    selectedCategories: string[];
    shopQuery: string;
    sellerQuery: string;
    locationQuery: string;
    minPrice: string;
    maxPrice: string;
    verifiedOnly: boolean;
}

export function IntegratedMarketplace({ isInsideDashboard = false, hasHostSidebar = false }: IntegratedMarketplaceProps) {
    const searchParams = useSearchParams();
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [categorySearchTerm, setCategorySearchTerm] = useState("");
    const [selectedTab, setSelectedTab] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [shopQuery, setShopQuery] = useState("");
    const [sellerQuery, setSellerQuery] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showVerifiedIntro, setShowVerifiedIntro] = useState(false);
    const [showLandingSpotlight, setShowLandingSpotlight] = useState(false);
    const [savedPresets, setSavedPresets] = useState<MarketplaceFilterPreset[]>([]);
    const [presetName, setPresetName] = useState("");
    const [headerIndex, setHeaderIndex] = useState(0);

    const { user } = useAuth();
    const firstName = user?.fullName?.split(" ")[0] || "Shopper";

    const feed = useMarketplaceFeed({
        category: undefined,
        search: searchQuery || undefined,
        shop: shopQuery || undefined,
        seller: sellerQuery || undefined,
        location: locationQuery || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        verifiedOnly,
    });

    const availableShops = useMemo(() => {
        const seen = new Set<string>();
        const shops: string[] = [];
        feed.products.forEach((product) => {
            const shopName = typeof product.shop === "object" ? product.shop?.shopName : "";
            if (shopName && !seen.has(shopName.toLowerCase())) {
                seen.add(shopName.toLowerCase());
                shops.push(shopName);
            }
        });
        return shops.sort((a, b) => a.localeCompare(b));
    }, [feed.products]);

    const availableSellers = useMemo(() => {
        const seen = new Set<string>();
        const sellers: string[] = [];
        feed.products.forEach((product) => {
            const sellerName = typeof product.seller === "object" ? product.seller?.fullName : "";
            if (sellerName && !seen.has(sellerName.toLowerCase())) {
                seen.add(sellerName.toLowerCase());
                sellers.push(sellerName);
            }
        });
        return sellers.sort((a, b) => a.localeCompare(b));
    }, [feed.products]);

    const hasAdvancedFilters = Boolean(
        selectedCategories.length || shopQuery || sellerQuery || locationQuery || minPrice || maxPrice || verifiedOnly
    );

    const availableLocations = useMemo(() => {
        const seen = new Set<string>();
        const locations: string[] = [];
        feed.products.forEach((product) => {
            const raw = product.location?.trim();
            if (!raw) return;
            const key = raw.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                locations.push(raw);
            }
        });
        return locations.sort((a, b) => a.localeCompare(b));
    }, [feed.products]);

    const filteredCategories = useMemo(() => {
        const list = feed.categories || [];
        const q = categorySearchTerm.trim().toLowerCase();
        if (!q) return list;
        return list.filter((c) => c.toLowerCase().includes(q));
    }, [feed.categories, categorySearchTerm]);

    const displayedProducts = useMemo(() => {
        let prods = feed.products;
        if (selectedCategories.length > 0) {
            const wanted = new Set(selectedCategories.map((c) => c.toLowerCase()));
            prods = prods.filter((p) => {
                const cat = String((p as any).category || "").toLowerCase();
                return wanted.has(cat);
            });
        }
        if (selectedTab === "Promo") return prods.filter(p => (p.compareAtPrice ?? 0) > p.price);
        if (selectedTab === "Best Deals") return prods.slice(0, 4);
        return prods;
    }, [feed.products, selectedCategories, selectedTab]);

    const activeFilterChips = useMemo(() => {
        const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
        selectedCategories.forEach((c) =>
            chips.push({
                key: `cat:${c}`,
                label: c,
                onRemove: () => setSelectedCategories((prev) => prev.filter((x) => x !== c)),
            })
        );
        if (shopQuery.trim()) chips.push({ key: "shop", label: `Shop: ${shopQuery}`, onRemove: () => setShopQuery("") });
        if (sellerQuery.trim()) chips.push({ key: "seller", label: `Seller: ${sellerQuery}`, onRemove: () => setSellerQuery("") });
        if (locationQuery.trim()) chips.push({ key: "loc", label: `Location: ${locationQuery}`, onRemove: () => setLocationQuery("") });
        if (minPrice.trim()) chips.push({ key: "min", label: `Min ₦${minPrice}`, onRemove: () => setMinPrice("") });
        if (maxPrice.trim()) chips.push({ key: "max", label: `Max ₦${maxPrice}`, onRemove: () => setMaxPrice("") });
        if (verifiedOnly) chips.push({ key: "verified", label: "Verified only", onRemove: () => setVerifiedOnly(false) });
        return chips;
    }, [selectedCategories, shopQuery, sellerQuery, locationQuery, minPrice, maxPrice, verifiedOnly]);

    const clearAdvancedFilters = () => {
        setSelectedCategories([]);
        setCategorySearchTerm("");
        setShopQuery("");
        setSellerQuery("");
        setLocationQuery("");
        setMinPrice("");
        setMaxPrice("");
        setVerifiedOnly(false);
    };

    const applyFilters = () => {
        setShowAdvancedFilters(false);
        feed.refetch();
    };

    const applyPreset = (preset: MarketplaceFilterPreset) => {
        setSelectedCategories(preset.selectedCategories);
        setShopQuery(preset.shopQuery);
        setSellerQuery(preset.sellerQuery);
        setLocationQuery(preset.locationQuery);
        setMinPrice(preset.minPrice);
        setMaxPrice(preset.maxPrice);
        setVerifiedOnly(preset.verifiedOnly);
    };

    const saveCurrentPreset = () => {
        const name = presetName.trim();
        if (!name) return;
        const preset: MarketplaceFilterPreset = {
            id: `${Date.now()}`,
            name: name.slice(0, 40),
            selectedCategories,
            shopQuery,
            sellerQuery,
            locationQuery,
            minPrice,
            maxPrice,
            verifiedOnly,
        };
        setSavedPresets((prev) => [preset, ...prev].slice(0, 6));
        setPresetName("");
    };

    // Decide intro visibility only after mount to avoid SSR/client mismatch.
    useEffect(() => {
        if (isInsideDashboard || typeof window === "undefined") {
            setShowVerifiedIntro(false);
            return;
        }
        setShowVerifiedIntro(!sessionStorage.getItem("taja_intro_played"));
    }, [isInsideDashboard]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem("taja_marketplace_filter_presets");
            if (!raw) return;
            const parsed = JSON.parse(raw) as MarketplaceFilterPreset[];
            if (Array.isArray(parsed)) setSavedPresets(parsed.slice(0, 6));
        } catch {
            // ignore invalid local cache
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem("taja_marketplace_filter_presets", JSON.stringify(savedPresets));
    }, [savedPresets]);

    useEffect(() => {
        if (isInsideDashboard || typeof window === "undefined") {
            setShowLandingSpotlight(false);
            return;
        }
        const seen = localStorage.getItem("taja_marketplace_spotlight_seen");
        if (seen) {
            setShowLandingSpotlight(false);
            return;
        }
        setShowLandingSpotlight(true);
        const dismissSpotlight = () => {
            setShowLandingSpotlight(false);
            localStorage.setItem("taja_marketplace_spotlight_seen", "1");
        };
        const timer = setTimeout(() => {
            dismissSpotlight();
        }, SPOTLIGHT_SLIDES_BEFORE_DISMISS * MARKETPLACE_SLIDE_MS + 400);
        const onScroll = () => {
            if (window.scrollY > 24) dismissSpotlight();
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            clearTimeout(timer);
            window.removeEventListener("scroll", onScroll);
        };
    }, [isInsideDashboard]);

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
        }, MARKETPLACE_SLIDE_MS);
        return () => clearInterval(timer);
    }, []);

    const urlSearch = searchParams.get("search");
    useEffect(() => {
        if (urlSearch == null) return;
        setSearchQuery(urlSearch);
    }, [urlSearch]);

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
                                Redefining <br /> <span className="text-transparent bg-clip-text bg-gradient-taja">Trust.</span>
                            </h1>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-col items-center justify-center gap-3 pt-12 px-4 text-center max-w-md mx-auto"
                        >
                            <p className="text-xl font-black text-taja-secondary tracking-tight leading-tight">
                                Shop with confidence
                            </p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                                Secure checkout · Real sellers · Buyer protection
                            </p>
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
                        <section
                            className={cn(
                                "px-4 sm:px-6 border-b border-gray-100 shadow-sm",
                                "bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80",
                                "pt-0 pb-4 sm:pb-5 md:pb-4"
                            )}
                        >
                            <div className="space-y-4">
                                <AnimatePresence initial={false}>
                                    {!isInsideDashboard && showLandingSpotlight && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -18 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -24, scale: 0.985, filter: "blur(6px)" }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1.5">
                                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.22em] leading-none">
                                                        Curated marketplace
                                                    </p>
                                                    <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">
                                                        Welcome back, {firstName} 👋
                                                    </h2>
                                                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500">
                                                        Discover verified Nigerian sellers, premium picks, and smarter daily deals.
                                                    </p>
                                                </div>
                                                <div className="md:hidden">
                                                    <CartIcon
                                                        className="w-12 h-12 bg-taja-light/30 backdrop-blur-2xl border border-taja-primary/10 rounded-[1.2rem] text-taja-primary shadow-sm active:scale-95 transition-all"
                                                        iconSize="h-5 w-5"
                                                        badgeClassName="bg-taja-primary text-white border-2 border-white !h-4 !w-4 !text-[9px] !-top-1 !-right-1"
                                                    />
                                                </div>
                                            </div>

                                            <div className="relative overflow-hidden rounded-3xl border border-emerald-900/15 bg-emerald-950 min-h-[150px] sm:min-h-[185px] shadow-[0_18px_45px_-22px_rgba(16,185,129,0.45)]">
                                                <AnimatePresence mode="wait">
                                                    <motion.div
                                                        key={HEADER_IMAGES[headerIndex]}
                                                        initial={{ opacity: 0, x: 24, scale: 1.04 }}
                                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                                        exit={{ opacity: 0, x: -24, scale: 1.02 }}
                                                        transition={{ duration: 0.55, ease: "easeOut" }}
                                                        className="absolute inset-0"
                                                    >
                                                        <Image
                                                            src={HEADER_IMAGES[headerIndex]}
                                                            alt="Marketplace premium spotlight"
                                                            fill
                                                            className="object-cover opacity-70"
                                                        />
                                                    </motion.div>
                                                </AnimatePresence>
                                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900/88 to-emerald-900/50" />
                                                <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-emerald-400/15 to-transparent blur-xl" />
                                                <div className="relative z-10 p-5 sm:p-7 text-white max-w-md">
                                                    <div className="inline-flex items-center gap-2 mb-3 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em]">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse" />
                                                        Premium marketplace spotlight
                                                    </div>
                                                    <p className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                                                        Trusted sellers, seamless checkout, and smarter shopping all in one place.
                                                    </p>
                                                    <p className="mt-2 text-[11px] sm:text-xs text-emerald-100/90 font-medium leading-relaxed">
                                                        Compare top products, discover verified stores, and shop with confidence across Nigeria.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className="mt-5 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-white text-emerald-900 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:translate-x-0.5 transition-transform"
                                                    >
                                                        Explore marketplace
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid grid-cols-2 md:grid-cols-[1fr_auto_auto] gap-3">
                                    <div className="h-12 rounded-2xl border border-gray-200 bg-white px-4 flex items-center justify-between col-span-2 md:col-span-1">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Active filters</p>
                                            <p className="text-xs font-bold text-gray-700 truncate">
                                                {selectedCategories.length > 0
                                                    ? `${selectedCategories.length} category${selectedCategories.length > 1 ? "ies" : "y"} selected`
                                                    : "No category selected"}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearAdvancedFilters}
                                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-taja-primary transition-colors"
                                        >
                                            Reset
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={selectedTab}
                                            onChange={(e) => setSelectedTab(e.target.value)}
                                            className="w-full md:w-[140px] h-12 rounded-2xl border border-gray-200 bg-white px-4 pr-10 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-taja-primary/20 appearance-none"
                                        >
                                            <option value="All">Sort: All</option>
                                            <option value="Promo">Sort: Promo</option>
                                            <option value="Best Deals">Sort: Best Deals</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowAdvancedFilters((prev) => !prev)}
                                        className={cn(
                                            "h-12 px-4 inline-flex items-center justify-center gap-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm",
                                            showAdvancedFilters || hasAdvancedFilters
                                                ? "text-taja-primary bg-taja-light/40 border-taja-primary/25"
                                                : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        <Filter className="w-4 h-4" />
                                        Filters
                                        <ChevronDown className={cn("w-3 h-3 transition-transform", showAdvancedFilters && "rotate-180")} />
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence initial={false}>
                                {showAdvancedFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -4 }}
                                        animate={{ opacity: 1, height: "auto", y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -4 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-4 rounded-3xl border border-gray-200 bg-gray-50/70 p-4 md:p-5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <SlidersHorizontal className="w-4 h-4 text-taja-primary" />
                                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-700">Advanced Filters</h4>
                                                </div>
                                                {hasAdvancedFilters && (
                                                    <button
                                                        type="button"
                                                        onClick={clearAdvancedFilters}
                                                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-800"
                                                    >
                                                        <X className="w-3 h-3" />
                                                        Clear
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                                                <div className="rounded-xl border border-gray-200 bg-white p-2 space-y-2 md:col-span-2">
                                                    <div className="relative">
                                                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                                        <input
                                                            type="text"
                                                            value={categorySearchTerm}
                                                            onChange={(e) => setCategorySearchTerm(e.target.value)}
                                                            placeholder="Search categories"
                                                            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                        />
                                                    </div>
                                                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                                        {filteredCategories.length > 0 ? (
                                                            filteredCategories.map((category) => {
                                                                const checked = selectedCategories.includes(category);
                                                                return (
                                                                    <label
                                                                        key={category}
                                                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-gray-50"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={checked}
                                                                            onChange={(e) =>
                                                                                setSelectedCategories((prev) =>
                                                                                    e.target.checked
                                                                                        ? [...prev, category]
                                                                                        : prev.filter((c) => c !== category)
                                                                                )
                                                                            }
                                                                            className="h-3.5 w-3.5 rounded border-gray-300 text-taja-primary focus:ring-taja-primary/30"
                                                                        />
                                                                        <span className="text-xs font-semibold text-gray-700 truncate">{category}</span>
                                                                    </label>
                                                                );
                                                            })
                                                        ) : (
                                                            <p className="text-[11px] text-gray-400 px-2 py-1">No matching categories.</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <input
                                                    type="text"
                                                    list="marketplace-shops-list"
                                                    value={shopQuery}
                                                    onChange={(e) => setShopQuery(e.target.value)}
                                                    placeholder="Filter by shop"
                                                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                />
                                                <datalist id="marketplace-shops-list">
                                                    {availableShops.map((shop) => (
                                                        <option key={shop} value={shop} />
                                                    ))}
                                                </datalist>

                                                <input
                                                    type="text"
                                                    list="marketplace-sellers-list"
                                                    value={sellerQuery}
                                                    onChange={(e) => setSellerQuery(e.target.value)}
                                                    placeholder="Filter by seller"
                                                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                />
                                                <datalist id="marketplace-sellers-list">
                                                    {availableSellers.map((sellerName) => (
                                                        <option key={sellerName} value={sellerName} />
                                                    ))}
                                                </datalist>

                                                <input
                                                    type="text"
                                                    list="marketplace-locations-list"
                                                    value={locationQuery}
                                                    onChange={(e) => setLocationQuery(e.target.value)}
                                                    placeholder="Filter by location"
                                                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                />
                                                <datalist id="marketplace-locations-list">
                                                    {availableLocations.map((location) => (
                                                        <option key={location} value={location} />
                                                    ))}
                                                </datalist>

                                                <label className="h-11 rounded-xl border border-gray-200 bg-white px-3 flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={verifiedOnly}
                                                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                                                        className="h-4 w-4 rounded border-gray-300 text-taja-primary focus:ring-taja-primary/30"
                                                    />
                                                    <span className="text-sm font-semibold text-gray-700">Verified shops only</span>
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={minPrice}
                                                    onChange={(e) => setMinPrice(e.target.value)}
                                                    placeholder="Minimum price (₦)"
                                                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                />
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={maxPrice}
                                                    onChange={(e) => setMaxPrice(e.target.value)}
                                                    placeholder="Maximum price (₦)"
                                                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                />
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {savedPresets.map((preset) => (
                                                        <button
                                                            key={preset.id}
                                                            type="button"
                                                            onClick={() => applyPreset(preset)}
                                                            className="px-2.5 h-7 rounded-full border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-taja-primary hover:border-taja-primary/25 transition-colors"
                                                        >
                                                            {preset.name}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={applyFilters}
                                                    className="h-9 px-4 rounded-xl bg-taja-primary text-white text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Apply filters
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                        {/* ═══ Product Feed ═══ */}
                        <section className="px-4 sm:px-6 space-y-8 mt-3 sm:mt-5 pb-20">
                            <div className={cn("grid grid-cols-1 gap-6 lg:gap-8", hasHostSidebar ? "lg:grid-cols-[240px_1fr]" : "lg:grid-cols-[280px_1fr]")}>
                                <aside className="hidden lg:block relative">
                                    <div
                                        className={cn(
                                            "max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-4 shadow-sm space-y-4",
                                            hasHostSidebar ? "sticky top-24 w-full" : "fixed top-24 w-[280px]"
                                        )}
                                    >
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Refine results</p>
                                            <h4 className="text-sm font-black text-gray-900">Marketplace filters</h4>
                                        </div>
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={categorySearchTerm}
                                                onChange={(e) => setCategorySearchTerm(e.target.value)}
                                                placeholder="Search categories..."
                                                className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                            />
                                        </div>
                                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                                            {filteredCategories.map((category) => {
                                                const checked = selectedCategories.includes(category);
                                                return (
                                                    <label key={category} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={(e) =>
                                                                setSelectedCategories((prev) =>
                                                                    e.target.checked
                                                                        ? [...prev, category]
                                                                        : prev.filter((c) => c !== category)
                                                                )
                                                            }
                                                            className="h-4 w-4 rounded border-gray-300 text-taja-primary focus:ring-taja-primary/30"
                                                        />
                                                        <span className="text-xs font-semibold text-gray-700 truncate">{category}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                min={0}
                                                value={minPrice}
                                                onChange={(e) => setMinPrice(e.target.value)}
                                                placeholder="Min ₦"
                                                className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                            />
                                            <input
                                                type="number"
                                                min={0}
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(e.target.value)}
                                                placeholder="Max ₦"
                                                className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                                            <input
                                                type="checkbox"
                                                checked={verifiedOnly}
                                                onChange={(e) => setVerifiedOnly(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-taja-primary focus:ring-taja-primary/30"
                                            />
                                            <span className="text-xs font-semibold text-gray-700">Verified shops only</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={applyFilters}
                                            className="w-full h-10 rounded-xl bg-taja-primary text-white text-[10px] font-black uppercase tracking-widest hover:opacity-95 transition-opacity"
                                        >
                                            Apply filters
                                        </button>
                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 space-y-2">
                                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400 px-1">Saved filters</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={presetName}
                                                    onChange={(e) => setPresetName(e.target.value)}
                                                    placeholder="Name this preset"
                                                    className="flex-1 h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={saveCurrentPreset}
                                                    disabled={!presetName.trim()}
                                                    className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-gray-600 disabled:opacity-50"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                            {savedPresets.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {savedPresets.map((preset) => (
                                                        <button
                                                            key={preset.id}
                                                            type="button"
                                                            onClick={() => applyPreset(preset)}
                                                            className="px-2.5 h-7 rounded-full border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-taja-primary hover:border-taja-primary/25 transition-colors"
                                                        >
                                                            {preset.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearAdvancedFilters}
                                            className="w-full h-10 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-taja-primary hover:border-taja-primary/25 transition-colors"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                </aside>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic">Product Catalog</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">
                                                {displayedProducts.length} result{displayedProducts.length === 1 ? "" : "s"}
                                            </p>
                                        </div>
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

                                    {activeFilterChips.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {activeFilterChips.map((chip) => (
                                                <button
                                                    key={chip.key}
                                                    type="button"
                                                    onClick={chip.onRemove}
                                                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-taja-primary hover:border-taja-primary/25 transition-colors"
                                                >
                                                    {chip.label}
                                                    <X className="w-3 h-3" />
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={clearAdvancedFilters}
                                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-dashed border-gray-300 bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-taja-primary hover:border-taja-primary/25 transition-colors"
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                    )}

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
                                                className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-6 px-1"
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

                                    <div className="pt-6 flex justify-center pb-20">
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
                                </div>
                            </div>
                        </section>

                        {/* ═══ Curated Brands ═══ */}
                        <section className="px-4 sm:px-6 py-4 pt-10 border-t border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <Crown className="w-5 h-5 text-taja-primary" />
                                <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase italic">Featured Shops</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-6 px-1 pb-6">
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
