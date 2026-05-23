"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Filter, Zap, Gift, Tag, Star, ChevronRight, ChevronLeft, ShoppingBag, ShieldCheck, Crown, ChevronDown, SlidersHorizontal, X, Search, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard, ProductCardSkeleton } from "@/components/product";
import { useMarketplaceFeed } from "@/hooks/useMarketplaceFeed";
import { useDebounce } from "@/hooks/useDebounce";
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
const MARKETPLACE_FILTERS_RAIL_OPEN_KEY = "taja_marketplace_filters_rail_open";
const MARKETPLACE_FILTERS_SIDEBAR_COLLAPSED_KEY = "taja_marketplace_filters_sidebar_collapsed";
/** Standalone /marketplace mobile bottom dock — "1" expanded, default collapsed so product grid is visible */
const MARKETPLACE_MOBILE_FILTER_DOCK_KEY = "taja_marketplace_mobile_filters_expanded";

export interface IntegratedMarketplaceProps {
    isInsideDashboard?: boolean;
    /** @deprecated use hostShell */
    hasHostSidebar?: boolean;
    /** Embedded in buyer or seller app shell — desktop uses fixed dockable filter rail */
    hostShell?: "seller" | "buyer";
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

export function IntegratedMarketplace({
    isInsideDashboard = false,
    hasHostSidebar = false,
    hostShell: hostShellProp,
}: IntegratedMarketplaceProps) {
    const hostShell = hostShellProp ?? (hasHostSidebar ? ("seller" as const) : null);
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
    const [filtersRailExpanded, setFiltersRailExpanded] = useState(true);
    const [hostShellSidebarCollapsed, setHostShellSidebarCollapsed] = useState(false);
    const [hostShellFiltersPortalReady, setHostShellFiltersPortalReady] = useState(false);

    const { user } = useAuth();
    const firstName = user?.fullName?.split(" ")[0] || "Shopper";

    // ── Guest soft sign-up nudge ─────────────────────────────────────────────
    const [guestNudgeDismissed, setGuestNudgeDismissed] = useState(false);
    const [showGuestNudge, setShowGuestNudge] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 400);
    const debouncedShop = useDebounce(shopQuery, 400);
    const debouncedSeller = useDebounce(sellerQuery, 400);
    const debouncedLocation = useDebounce(locationQuery, 400);

    const feed = useMarketplaceFeed({
        category: undefined,
        search: debouncedSearch || undefined,
        shop: debouncedShop || undefined,
        seller: debouncedSeller || undefined,
        location: debouncedLocation || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        verifiedOnly,
    });

    // Fire the guest nudge after 60 seconds or after 8+ products load — only for non-authenticated users.
    useEffect(() => {
        if (user || isInsideDashboard || guestNudgeDismissed) return;
        // Timer-based: 60 seconds
        const timer = setTimeout(() => setShowGuestNudge(true), 60_000);
        return () => clearTimeout(timer);
    }, [user, isInsideDashboard, guestNudgeDismissed]);

    useEffect(() => {
        if (user || isInsideDashboard || guestNudgeDismissed || showGuestNudge) return;
        // Product-count based: 8+ products in view
        if (feed.products && feed.products.length >= 8) {
            setShowGuestNudge(true);
        }
    }, [feed.products?.length, user, isInsideDashboard, guestNudgeDismissed, showGuestNudge]);

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

    const [filtersDocked, setFiltersDocked] = useState(false);
    const [filtersSidebarCollapsed, setFiltersSidebarCollapsed] = useState(false);
    /** Standalone /marketplace mobile: fixed bottom filter dock — collapsed by default */
    const [mobileFilterDockExpanded, setMobileFilterDockExpanded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("taja_marketplace_filters_docked");
        if (saved !== null) setFiltersDocked(saved === "true");
        const savedCollapsed = localStorage.getItem(MARKETPLACE_FILTERS_SIDEBAR_COLLAPSED_KEY);
        if (savedCollapsed !== null) setFiltersSidebarCollapsed(savedCollapsed === "1");
    }, []);

    useEffect(() => {
        if (hostShell || typeof window === "undefined") return;
        const saved = localStorage.getItem(MARKETPLACE_MOBILE_FILTER_DOCK_KEY);
        if (saved !== null) setMobileFilterDockExpanded(saved === "1");
    }, [hostShell]);

    const toggleMobileFilterDock = () => {
        setMobileFilterDockExpanded((prev) => {
            const next = !prev;
            if (typeof window !== "undefined") {
                localStorage.setItem(MARKETPLACE_MOBILE_FILTER_DOCK_KEY, next ? "1" : "0");
            }
            if (!next) setShowAdvancedFilters(false);
            return next;
        });
    };

    const toggleFiltersDocked = () => {
        const next = !filtersDocked;
        setFiltersDocked(next);
        localStorage.setItem("taja_marketplace_filters_docked", String(next));
    };

    const toggleFiltersSidebarCollapsed = () => {
        setFiltersSidebarCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem(MARKETPLACE_FILTERS_SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
            return next;
        });
    };

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

    useEffect(() => {
        if (!hostShell) return;
        const readRail = () => {
            try {
                setFiltersRailExpanded(localStorage.getItem(MARKETPLACE_FILTERS_RAIL_OPEN_KEY) !== "0");
            } catch {
                /* ignore */
            }
        };
        readRail();
        const onStorage = (e: StorageEvent) => {
            if (e.key === MARKETPLACE_FILTERS_RAIL_OPEN_KEY) {
                setFiltersRailExpanded(e.newValue !== "0");
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [hostShell]);

    useEffect(() => {
        if (hostShell !== "seller" && hostShell !== "buyer") {
            setHostShellFiltersPortalReady(false);
            return;
        }
        setHostShellFiltersPortalReady(true);
        const storageKey =
            hostShell === "seller" ? "taja_seller_sidebar_collapsed" : "taja_dashboard_sidebar_collapsed";
        const eventName =
            hostShell === "seller"
                ? "taja:seller-sidebar-collapsed-change"
                : "taja:dashboard-sidebar-collapsed-change";
        const read = () => {
            try {
                setHostShellSidebarCollapsed(localStorage.getItem(storageKey) === "1");
            } catch {
                /* ignore */
            }
        };
        read();
        const onEv = (e: Event) => {
            const detail = (e as CustomEvent<{ collapsed?: boolean }>).detail;
            if (typeof detail?.collapsed === "boolean") {
                setHostShellSidebarCollapsed(detail.collapsed);
            } else {
                read();
            }
        };
        const onStorage = (e: StorageEvent) => {
            if (e.key === storageKey) {
                setHostShellSidebarCollapsed(e.newValue === "1");
            }
        };
        window.addEventListener(eventName, onEv);
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener(eventName, onEv);
            window.removeEventListener("storage", onStorage);
        };
    }, [hostShell]);

    const toggleFiltersRailExpanded = () => {
        setFiltersRailExpanded((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(MARKETPLACE_FILTERS_RAIL_OPEN_KEY, next ? "1" : "0");
            } catch {
                /* ignore */
            }
            return next;
        });
    };

    const railWidthPx = hostShell ? (filtersRailExpanded ? 240 : 56) : 0;

    const hostShellDesktopFilterLeft =
        hostShell === "seller"
            ? hostShellSidebarCollapsed
                ? "calc(5rem + 1.5rem)"
                : "calc(18rem + 1.5rem)"
            : hostShell === "buyer"
              ? hostShellSidebarCollapsed
                  ? "calc(5rem + 1.5rem)"
                  : "calc(260px + 1.5rem)"
              : undefined;

    const hostShellRailInner = (
        <>
            {filtersRailExpanded ? (
                <>
                    <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-3 py-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Search & filters</span>
                        <button
                            type="button"
                            onClick={toggleFiltersRailExpanded}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            title="Dock filter panel"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="space-y-4 p-4">
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
                                                    e.target.checked ? [...prev, category] : prev.filter((c) => c !== category)
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
                </>
            ) : (
                <button
                    type="button"
                    onClick={toggleFiltersRailExpanded}
                    className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 p-2 text-gray-600 hover:bg-gray-50"
                    title="Expand filters"
                >
                    <SlidersHorizontal className="h-5 w-5 shrink-0" />
                    <ChevronRight className="h-4 w-4 shrink-0" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight text-gray-500 px-0.5">
                        Filters
                    </span>
                </button>
            )}
        </>
    );

    return (
        <div
            className={cn(
                "bg-[#F8F9FB] min-h-screen",
                hostShell ? "overflow-x-hidden" : "overflow-hidden",
                isInsideDashboard ? "pb-12" : "pb-24"
            )}
        >
            {/* ═══ Guest Sign-Up Nudge Banner ═══ */}
            <AnimatePresence>
                {showGuestNudge && !guestNudgeDismissed && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.97 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+var(--mobile-bottom-nav-height,4.25rem)+0.75rem)] sm:bottom-6 right-4 sm:right-6 z-[60] max-w-[calc(100vw-2rem)] sm:max-w-xs"
                    >
                        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-[1.75rem] shadow-[0_8px_32px_-6px_rgba(15,23,42,0.18)] p-4 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-taja-light flex items-center justify-center shrink-0 mt-0.5">
                                <Gift className="h-4 w-4 text-taja-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-black text-taja-secondary uppercase tracking-[0.12em] leading-none mb-1">💚 Save your favourites</p>
                                <p className="text-xs font-medium text-gray-500 leading-snug">Sign up free to bookmark deals and get exclusive alerts.</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <a
                                        href="/register"
                                        className="h-8 px-4 rounded-full bg-taja-primary text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity inline-flex items-center"
                                    >
                                        Join Free
                                    </a>
                                    <a
                                        href="/login"
                                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-taja-primary transition-colors"
                                    >
                                        Sign in
                                    </a>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setGuestNudgeDismissed(true); setShowGuestNudge(false); }}
                                className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all shrink-0 -mt-0.5 -mr-0.5"
                                aria-label="Dismiss"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        <section
                            className={cn(
                                "px-4 sm:px-6 pt-0 pb-4 sm:pb-5 md:pb-4",
                                hostShell === "seller" && "lg:hidden"
                            )}
                        >
                            <AnimatePresence initial={false}>
                                {!isInsideDashboard && showLandingSpotlight && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -24, scale: 0.985, filter: "blur(6px)" }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className="relative z-[110] isolate space-y-4"
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
                        </section>

                        {/* ═══ Mobile filters: fixed bottom dock on both standalone /marketplace AND hostShell (seller/buyer) ═══ */}
                        <section
                            className={cn(
                                "px-4 sm:px-6 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 transition-all duration-300 lg:hidden",
                                cn(
                                    "fixed inset-x-0 z-[45] flex flex-col rounded-t-2xl border border-gray-200 border-b-0 max-w-2xl mx-auto w-[calc(100%-1rem)] sm:w-full",
                                    hostShell
                                        ? cn(
                                              // Inside seller/buyer shell: no bottom nav, dock at safe-area bottom
                                              "bottom-[env(safe-area-inset-bottom,0px)]",
                                              mobileFilterDockExpanded
                                                  ? "max-h-[min(85dvh,calc(100dvh-5rem))] shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.12)] pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
                                                  : "max-h-[4.25rem] shadow-[0_-4px_20px_-6px_rgba(15,23,42,0.1)] pt-1.5 pb-1.5"
                                          )
                                        : cn(
                                              "bottom-[calc(env(safe-area-inset-bottom,0px)+var(--mobile-bottom-nav-height,4.25rem))]",
                                              mobileFilterDockExpanded
                                                  ? "max-h-[min(85dvh,calc(100dvh-5rem))] shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.12)] pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
                                                  : "max-h-[4.25rem] shadow-[0_-4px_20px_-6px_rgba(15,23,42,0.1)] pt-1.5 pb-1.5"
                                          )
                                )
                            )}
                        >
                            {/* Dock handle — always visible now that all modes use the fixed bottom dock */}
                            <div className="flex shrink-0 items-center gap-2 border-b border-gray-100/90 px-2 pb-2">
                                    <button
                                        type="button"
                                        aria-expanded={mobileFilterDockExpanded}
                                        aria-controls="marketplace-mobile-filter-panel"
                                        onClick={toggleMobileFilterDock}
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-taja-primary/30 hover:text-taja-primary"
                                        title={mobileFilterDockExpanded ? "Hide filters" : "Show filters"}
                                        aria-label={mobileFilterDockExpanded ? "Collapse filters" : "Expand filters"}
                                    >
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", mobileFilterDockExpanded && "rotate-180")} />
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Active filters</p>
                                        <p className="truncate text-xs font-bold text-gray-700">
                                            {selectedCategories.length > 0
                                                ? `${selectedCategories.length} categor${selectedCategories.length > 1 ? "ies" : "y"}`
                                                : hasAdvancedFilters || searchQuery.trim()
                                                  ? "Refinements on"
                                                  : "None yet"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearAdvancedFilters}
                                        className="shrink-0 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-taja-primary"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMobileFilterDockExpanded(true);
                                            setShowAdvancedFilters((prev) => !prev);
                                        }}
                                        className={cn(
                                            "flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-black uppercase tracking-widest",
                                            showAdvancedFilters || hasAdvancedFilters
                                                ? "border-taja-primary/25 bg-taja-light/40 text-taja-primary"
                                                : "border-gray-200 bg-white text-gray-600"
                                        )}
                                    >
                                        <Filter className="h-3.5 w-3.5" />
                                        <span className="hidden min-[360px]:inline">Filters</span>
                                    </button>
                                </div>
                            <div
                                id="marketplace-mobile-filter-panel"
                                className={cn(
                                    "flex min-h-0 flex-1 flex-col overflow-hidden",
                                    !mobileFilterDockExpanded && "hidden"
                                )}
                            >
                            <div className={cn("space-y-4", "min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-3")}>
                                {!hostShell && (
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="search"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search products…"
                                            enterKeyHint="search"
                                            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:border-taja-primary focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                            autoComplete="off"
                                        />
                                    </div>
                                )}
                                {hostShell ? (
                                <div className="grid grid-cols-2 md:grid-cols-[1fr_auto] gap-3">
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

                                    <button
                                        type="button"
                                        onClick={() => setShowAdvancedFilters((prev) => !prev)}
                                        className={cn(
                                            "col-span-2 md:col-span-1 h-12 px-4 inline-flex items-center justify-center gap-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm",
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
                                ) : null}

                                {/* Pills stay in this sticky strip below lg so they are never covered by the bar while scrolling */}
                                <div className="flex flex-wrap gap-2 border-t border-gray-100/80 pt-3">
                                    {["All", "Promo", "Best Deals"].map((tab) => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setSelectedTab(tab)}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                                selectedTab === tab
                                                    ? "bg-black text-white shadow-xl scale-105"
                                                    : "text-gray-400 hover:text-black"
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                            <AnimatePresence initial={false}>
                                {showAdvancedFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -4 }}
                                        animate={{ opacity: 1, height: "auto", y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -4 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden lg:hidden"
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
                            </div>
                            </div>
                        </section>

                        {/* ═══ Product Feed ═══ */}
                        <section
                            className={cn(
                                "relative space-y-8 px-4 sm:px-6 mt-3 sm:mt-5 pb-20",
                                !hostShell &&
                                    (mobileFilterDockExpanded
                                        ? "max-lg:pb-[calc(6.5rem+var(--mobile-bottom-nav-height,4.25rem)+env(safe-area-inset-bottom,0px))]"
                                        : "max-lg:pb-[calc(5rem+var(--mobile-bottom-nav-height,4.25rem)+env(safe-area-inset-bottom,0px))]")
                            )}
                        >
                            <div
                                className={cn(
                                    "grid grid-cols-1 lg:gap-8",
                                    filtersDocked ? "gap-0" : "gap-6",
                                    hostShell
                                        ? filtersRailExpanded
                                            ? "lg:grid-cols-[240px_1fr]"
                                            : "lg:grid-cols-[56px_1fr]"
                                        : hasHostSidebar
                                          ? "lg:grid-cols-[240px_1fr]"
                                          : filtersSidebarCollapsed
                                            ? "lg:grid-cols-[56px_1fr]"
                                            : "lg:grid-cols-[280px_1fr]"
                                )}
                            >
                                {hostShell === "seller" || hostShell === "buyer" ? (
                                    <>
                                        <div
                                            className="hidden lg:block shrink-0 min-w-0"
                                            style={{ width: railWidthPx, maxWidth: "100%" }}
                                            aria-hidden
                                        />
                                        {hostShellFiltersPortalReady &&
                                            typeof document !== "undefined" &&
                                            createPortal(
                                                <aside
                                                    className="pointer-events-auto fixed z-[90] hidden max-h-[calc(100vh-6rem)] min-w-0 overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-lg lg:block"
                                                    style={{
                                                        left: hostShellDesktopFilterLeft,
                                                        top: "6rem",
                                                        width: railWidthPx,
                                                    }}
                                                    aria-label="Marketplace filters"
                                                >
                                                    {hostShellRailInner}
                                                </aside>,
                                                document.body
                                            )}
                                    </>
                                ) : (
                                    <aside className={cn(
                                        "hidden lg:block shrink-0 transition-all duration-300",
                                        filtersDocked ? "relative" : "relative"
                                    )}>
                                        <div
                                            className={cn(
                                                "transition-all duration-300 overflow-y-auto no-scrollbar",
                                                filtersSidebarCollapsed &&
                                                    cn(
                                                        "rounded-2xl border border-gray-200 bg-white p-2 shadow-sm",
                                                        filtersDocked &&
                                                            "sticky top-[5rem] self-start z-20 h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)]",
                                                        !filtersDocked &&
                                                            (hasHostSidebar
                                                                ? "sticky top-24 z-10 h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)] w-full"
                                                                : "fixed left-4 top-24 z-30 h-[calc(100vh-7rem)] w-14 max-w-[3.5rem] sm:left-6 lg:left-8")
                                                    ),
                                                !filtersSidebarCollapsed &&
                                                    cn(
                                                        filtersDocked &&
                                                            "sticky top-[5rem] h-[calc(100vh-5rem)] border-r border-gray-100 bg-white p-6 space-y-6 rounded-none",
                                                        !filtersDocked &&
                                                            "max-h-[calc(100vh-7rem)] rounded-3xl border border-gray-200 bg-white p-4 shadow-sm space-y-4",
                                                        !filtersDocked &&
                                                            (hasHostSidebar
                                                                ? "sticky top-24 w-full z-10"
                                                                : "fixed left-4 top-24 z-30 w-[280px] max-w-[calc(100vw-2rem)] sm:left-6 lg:left-8")
                                                    )
                                            )}
                                        >
                                        {filtersSidebarCollapsed ? (
                                            <div className="flex h-full w-full flex-col items-center gap-2 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={toggleFiltersSidebarCollapsed}
                                                    className="h-9 w-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-taja-primary hover:border-taja-primary/25 transition-colors flex items-center justify-center"
                                                    title="Expand filters"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={toggleFiltersDocked}
                                                    className="h-9 w-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-taja-primary hover:border-taja-primary/25 transition-colors flex items-center justify-center"
                                                    title={filtersDocked ? "Undock filters" : "Dock filters"}
                                                >
                                                    {filtersDocked ? <Pin className="w-4 h-4 fill-current" /> : <PinOff className="w-4 h-4" />}
                                                </button>
                                                <div className="mt-2 flex-1 flex items-start justify-center">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 [writing-mode:vertical-rl] rotate-180">
                                                        Filters
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                        <>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Refine results</p>
                                                <h4 className="text-sm font-black text-gray-900 italic uppercase tracking-tighter">Marketplace</h4>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={toggleFiltersSidebarCollapsed}
                                                    className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-taja-primary transition-all"
                                                    title="Collapse filters"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={toggleFiltersDocked}
                                                    className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-taja-primary transition-all"
                                                    title={filtersDocked ? "Undock filters" : "Dock filters"}
                                                >
                                                    {filtersDocked ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
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
                                        </>
                                        )}
                                    </div>
                                    </aside>
                                )}

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic">Product Catalog</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">
                                                {displayedProducts.length} result{displayedProducts.length === 1 ? "" : "s"}
                                            </p>
                                        </div>
                                        <div className="hidden lg:flex gap-2">
                                            {["All", "Promo", "Best Deals"].map((tab) => (
                                                <button
                                                    key={tab}
                                                    type="button"
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
                                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-6 px-1">
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                                    <ProductCardSkeleton key={i} />
                                                ))}
                                            </div>
                                        ) : displayedProducts.length > 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-6 px-1"
                                            >
                                                {displayedProducts.map((product, index) => (
                                                    <ProductCard
                                                        key={product._id}
                                                        product={product}
                                                        isInsideDashboard={isInsideDashboard}
                                                        showSellerRow
                                                        priority={index < 8}
                                                    />
                                                ))}
                                            </motion.div>
                                        ) : (
                                            <div className="bg-white/50 backdrop-blur-md rounded-[3rem] p-20 text-center border-dashed border-2 border-gray-200">
                                                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">No products found here yet</p>
                                            </div>
                                        )}
                                    </AnimatePresence>

                                    <div className="pt-6 flex justify-center pb-10">
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

                                    {/* ═══ Curated Brands ═══ */}
                                    <section className="py-4 pt-10 border-t border-gray-100">
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
                                </div>
                            </div>
                        </section>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
