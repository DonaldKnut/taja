"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu, X, Zap, ShieldCheck, User, Bell, Heart, Rocket, Layout } from "lucide-react";
import { Container } from "./Container";
import { SiteMegaNav } from "@/components/layout/SiteMegaNav";
import { MobileMegaNavAccordion } from "@/components/layout/MobileMegaNavAccordion";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useCartStore, CartIcon } from "@/components/cart";
import { useWishlistStore } from "@/components/wishlist";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { NotificationsModal } from "@/components/NotificationsModal";

export interface AppHeaderProps {
    transparent?: boolean;
    /** Solid white bar (no glass / no dark slate bar) — classic marketplace header look. */
    solidLightHeader?: boolean;
}

export function AppHeader({ transparent = false, solidLightHeader = false }: AppHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const { isOpen: isCartOpen, toggleCart } = useCartStore();
    const { items: wishlistItems, openDrawer: openWishlist } = useWishlistStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const wishlistCount = wishlistItems.length;

    // Fetch initial notification count
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchInitialCount = async () => {
            try {
                const res = await api('/api/notifications?limit=1');
                if (res.success) {
                    setUnreadCount(res.data.unreadCount || 0);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };

        fetchInitialCount();

        // Setup SSE for live updates
        const eventSource = new EventSource('/api/notifications/stream');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'new_notifications') {
                    setUnreadCount(prev => prev + data.count);
                    toast.success(`You have ${data.count} new notification${data.count > 1 ? 's' : ''}`, {
                        icon: '🔔',
                        duration: 5000,
                    });
                }
            } catch (err) {
                console.error("SSE parse error:", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE connection error:", err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [isAuthenticated]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isTransparent = transparent && !isScrolled;

    return (
        <>
            <header
        className={cn(
                    "sticky top-0 w-full z-[9999] transition-all duration-500 relative overflow-visible",
                    solidLightHeader && !isTransparent
                        ? "bg-white border-b border-gray-200/90 shadow-sm dark:bg-white dark:border-gray-200/90"
                        : isTransparent
                        ? "bg-transparent border-transparent"
                        : "bg-white/80 dark:bg-slate-950/85 backdrop-blur-xl border-b border-white/40 dark:border-slate-800/60 shadow-premium"
                )}
            >
                <Container
                    size="lg"
                    className="h-20 flex min-w-0 items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 overflow-visible"
                >
                    <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3 xl:gap-8 overflow-visible">
                        <Logo
                            size="lg"
                            variant="header"
                            className="shrink-0 hover:opacity-80 transition-opacity"
                            href="/"
                        />

                        {/* Mega menu — desktop (nav is flex-nowrap + scrollbar-hide; Company shows xl+) */}
                        <div className="hidden min-w-0 lg:block">
                            <SiteMegaNav
                                pathname={pathname}
                                variant="app"
                                idPrefix="app-header"
                                lightHeaderChrome={solidLightHeader}
                            />
                        </div>
                    </div>

                    {/* Search — shrinks before mega nav wraps; md+ only */}
                    <div className="mx-1.5 hidden min-w-0 max-w-[min(100%,10.5rem)] flex-1 basis-0 sm:max-w-[13rem] md:mx-2 md:max-w-[15rem] lg:max-w-[17rem] lg:mx-3 xl:mx-8 xl:max-w-md md:block">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search
                                    className={cn(
                                        "h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors",
                                        solidLightHeader && "text-slate-600 dark:text-slate-700"
                                    )}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Search premium products..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        router.push(`/marketplace?search=${(e.target as HTMLInputElement).value}`);
                                    }
                                }}
                                className={cn(
                                    "w-full rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-0 transition-all shadow-sm",
                                    solidLightHeader
                                        ? "border border-gray-200/90 bg-gray-100 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-taja-primary/35 dark:border-gray-200/90 dark:bg-gray-100 dark:text-slate-900 dark:placeholder:text-slate-500 dark:focus:bg-white"
                                        : "border-transparent bg-taja-light/30 dark:bg-slate-800/50 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-taja-primary/20"
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 md:gap-3">
                        {/* Authenticated Actions */}
                        <div className="flex items-center gap-1 md:gap-2">
                            {isAuthenticated ? (
                                <>
                                <button
                                    type="button"
                                    onClick={() => setNotificationsOpen(true)}
                                    className={cn(
                                        "relative p-2 rounded-full transition-colors",
                                        solidLightHeader
                                            ? "text-slate-900 hover:bg-slate-100"
                                            : "text-taja-secondary hover:text-taja-primary hover:bg-taja-light/30"
                                    )}
                                    aria-label="Notifications"
                                >
                                    <Bell className="h-5 w-5 md:h-6 md:w-6" />
                                    <AnimatePresence>
                                        {unreadCount > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className="absolute -top-0.5 -right-0.5 min-h-[1.125rem] min-w-[1.125rem] px-1 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-lg"
                                            >
                                                <span className="text-[8px] font-black text-white leading-none">
                                                    {unreadCount > 99 ? "99+" : unreadCount}
                                                </span>
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>
                                <Link href={user?.role === "admin" ? "/admin/dashboard" : user?.role === "seller" ? "/seller/dashboard" : "/dashboard"} className="relative hidden sm:block">
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "rounded-full px-4 md:px-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest h-10 border-taja-light/60 hover:bg-white transition-all active:scale-95",
                                            solidLightHeader &&
                                                "border-slate-300 text-slate-900 hover:bg-slate-50 dark:border-slate-300 dark:text-slate-900 dark:hover:bg-slate-50"
                                        )}
                                    >
                                        <User className="w-3.5 h-3.5 md:hidden" />
                                        <span className="hidden md:inline">Dashboard</span>
                                    </Button>
                                </Link>
                                </>
                            ) : (
                                <div className="hidden sm:flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        onClick={() => router.push("/login")}
                                        className={cn(
                                            "text-[10px] font-black uppercase tracking-widest hover:bg-taja-light",
                                            solidLightHeader &&
                                                "h-10 rounded-full border border-slate-300/90 bg-white px-4 text-slate-900 shadow-sm hover:bg-slate-50 hover:text-taja-primary dark:border-slate-300/90 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-50"
                                        )}
                                    >
                                        Sign In
                                    </Button>
                                    <Link href="/register">
                                        <Button className="rounded-full px-6 text-[10px] font-black uppercase tracking-widest h-10 shadow-premium">
                                            Start Selling
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            {/* Wishlist Icon - Desktop Only */}
                            <div className="relative hidden md:flex">
                                <button
                                    onClick={() => openWishlist()}
                                    className={cn(
                                        "p-2 text-taja-secondary hover:text-taja-primary transition-colors hover:bg-taja-light/30 rounded-full",
                                        solidLightHeader &&
                                            "text-slate-900 hover:bg-slate-100 dark:text-slate-900"
                                    )}
                                    aria-label="Wishlist"
                                >
                                    <Heart className="h-5 w-5 md:h-6 md:w-6" />
                                    <AnimatePresence>
                                        {wishlistCount > 0 && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className="absolute -top-0.5 -right-0.5 h-4 w-4 md:h-5 md:w-5 bg-rose-500 text-white border-2 border-white rounded-full flex items-center justify-center shadow-lg"
                                            >
                                                <span className="text-[8px] md:text-[10px] font-black">{wishlistCount > 9 ? "9+" : wishlistCount}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>

                            {/* Cart Icon - Responsive: Hidden on Mobile as Bottom Nav has it */}
                            <div className="relative hidden md:flex">
                                <CartIcon
                                    className={cn(
                                        "p-2 text-taja-secondary hover:text-taja-primary transition-colors hover:bg-taja-light/30 rounded-full",
                                        solidLightHeader &&
                                            "text-slate-900 hover:bg-slate-100 dark:text-slate-900"
                                    )}
                                    iconClassName="h-5 w-5 md:h-6 md:w-6"
                                    badgeClassName="!h-4 !w-4 md:!h-5 md:!w-5 !text-[8px] md:!text-[10px] !-top-0.5 !-right-0.5 bg-taja-primary text-white border-2 border-white"
                                />
                            </div>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className={cn(
                                    "lg:hidden p-2 text-taja-secondary hover:text-taja-primary transition-colors",
                                    solidLightHeader && "text-slate-900 dark:text-slate-900"
                                )}
                                aria-label="Toggle mobile menu"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </Container>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 z-[10000] bg-black/20 backdrop-blur-sm lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 h-full w-[85%] max-w-sm bg-white dark:bg-slate-950 z-[10001] shadow-2xl p-8 flex flex-col min-h-0 overflow-hidden lg:hidden"
                        >
                            <div className="flex items-center justify-between mb-12">
                                <Logo size="lg" variant="header" />
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 text-gray-400 hover:text-taja-secondary transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-1 mb-8">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-taja-primary/10 border border-taja-primary/5 w-fit">
                                    <Zap className="w-3 h-3 text-taja-primary fill-taja-primary" />
                                    <span className="text-[8px] font-black text-taja-primary uppercase tracking-widest">Premium Marketplace</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-taja-primary" />
                                    <h3 className="text-xl font-black text-taja-secondary tracking-tight">Navigation</h3>
                                </div>
                            </div>

                            <MobileMegaNavAccordion
                                pathname={pathname}
                                variant="app"
                                onNavigate={() => setMobileMenuOpen(false)}
                                className="overflow-y-auto pr-2 pb-4 scrollbar-hide flex-1 min-h-0 gap-2.5"
                            />

                            <div className="mt-auto pt-10 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-4">
                                {isAuthenticated ? (
                                    <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            setNotificationsOpen(true);
                                        }}
                                        className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs gap-3 relative"
                                    >
                                        <Bell className="w-4 h-4" />
                                        Notifications
                                        {unreadCount > 0 && (
                                            <span className="absolute top-3 right-4 min-h-5 min-w-5 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">
                                                {unreadCount > 99 ? "99+" : unreadCount}
                                            </span>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => { 
                                            setMobileMenuOpen(false); 
                                            router.push(user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'seller' ? '/seller/dashboard' : '/dashboard'); 
                                        }}
                                        className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-premium gap-3"
                                    >
                                        <Layout className="w-4 h-4" />
                                        {user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'seller' ? 'Seller Dashboard' : 'My Dashboard'}
                                    </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
                                            className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs gap-3"
                                        >
                                            <User className="w-4 h-4" />
                                            Sign In
                                        </Button>
                                        <Button
                                            onClick={() => { setMobileMenuOpen(false); router.push('/register'); }}
                                            className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-premium gap-3"
                                        >
                                            <Rocket className="w-4 h-4" />
                                            Sign Up
                                        </Button>
                                    </>
                                )}

                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-gray-300" />
                                    <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Secured Payments</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <NotificationsModal
                open={notificationsOpen}
                onClose={async () => {
                    setNotificationsOpen(false);
                    try {
                        const res = await api("/api/notifications?limit=1");
                        if (res.success) setUnreadCount(res.data.unreadCount || 0);
                    } catch {
                        /* ignore */
                    }
                }}
            />
        </>
    );
}
