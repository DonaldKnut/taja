"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu, X, Zap, ShoppingBag, ShieldCheck, User } from "lucide-react";
import { Container } from "@/components/layout";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { CartIcon, CartDrawer, useCartStore } from "@/components/cart";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AppHeaderProps {
    transparent?: boolean;
}

export function AppHeader({ transparent = false }: AppHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const { isOpen, toggleCart } = useCartStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isTransparent = transparent && !isScrolled;

    return (
        <>
            <header
                className={cn(
                    "sticky top-0 w-full z-[100] transition-all duration-500",
                    isTransparent
                        ? "bg-transparent border-transparent"
                        : "bg-white/80 backdrop-blur-xl border-b border-white/40 shadow-premium"
                )}
            >
                <Container size="lg" className="h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-10">
                        <Logo size="lg" variant="header" className="hover:opacity-80 transition-opacity" href="/" />

                        {/* Nav - Hidden on Mobile */}
                        <nav className="hidden lg:flex items-center gap-8">
                            {[
                                { label: "Marketplace", href: "/marketplace" },
                                { label: "Shops", href: "/shops" },
                                { label: "How it Works", href: "/how-it-works" },
                            ].map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.25em] transition-colors",
                                        pathname.startsWith(link.href)
                                            ? "text-taja-primary"
                                            : "text-gray-400 hover:text-taja-secondary"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Search - Desktop Only */}
                    <div className="flex-1 max-w-md mx-8 hidden md:block">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search premium products..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        router.push(`/marketplace?search=${(e.target as HTMLInputElement).value}`);
                                    }
                                }}
                                className="w-full bg-taja-light/30 border-transparent rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:bg-white focus:border-taja-primary/20 focus:ring-0 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Authenticated Actions */}
                        <div className="flex items-center gap-1 md:gap-2">
                            {isAuthenticated ? (
                                <Link href={user?.role === "seller" ? "/seller/dashboard" : "/dashboard"}>
                                    <Button variant="outline" className="rounded-full px-4 md:px-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest h-10 border-taja-light/60 hover:bg-white">
                                        <User className="w-3.5 h-3.5 md:hidden" />
                                        <span className="hidden md:inline">Dashboard</span>
                                    </Button>
                                </Link>
                            ) : (
                                <div className="hidden sm:flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        onClick={() => router.push("/login")}
                                        className="text-[10px] font-black uppercase tracking-widest hover:bg-taja-light"
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

                            {/* Cart Icon - Responsive: Hidden on Mobile as Bottom Nav has it */}
                            <div className="relative hidden md:flex">
                                <CartIcon
                                    className="p-2 text-taja-secondary hover:text-taja-primary transition-colors hover:bg-taja-light/30 rounded-full"
                                    iconClassName="h-5 w-5 md:h-6 md:w-6"
                                    badgeClassName="!h-4 !w-4 md:!h-5 md:!w-5 !text-[8px] md:!text-[10px] !-top-0.5 !-right-0.5 bg-taja-primary text-white border-2 border-white"
                                />
                            </div>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="lg:hidden p-2 text-taja-secondary hover:text-taja-primary transition-colors"
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
                            className="fixed inset-0 z-[150] bg-black/20 backdrop-blur-sm lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 h-full w-[85%] max-w-sm bg-white z-[151] shadow-2xl p-8 flex flex-col lg:hidden"
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
                                <h3 className="text-xl font-black text-taja-secondary tracking-tight">Navigation</h3>
                            </div>

                            <nav className="flex flex-col gap-6">
                                {[
                                    { label: "Marketplace", href: "/marketplace" },
                                    { label: "Shops", href: "/shops" },
                                    { label: "How it Works", href: "/how-it-works" },
                                    { label: "Shipping Policy", href: "/shipping" },
                                ].map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "text-2xl font-black tracking-tight transition-colors",
                                            pathname === link.href ? "text-taja-primary" : "text-taja-secondary hover:text-taja-primary"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>

                            <div className="mt-auto pt-10 border-t border-gray-100 flex flex-col gap-4">
                                {isAuthenticated ? (
                                    <Button
                                        onClick={() => { setMobileMenuOpen(false); router.push(user?.role === 'seller' ? '/seller/dashboard' : '/dashboard'); }}
                                        className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-premium"
                                    >
                                        {user?.role === 'seller' ? 'Seller Terminal' : 'Member Portal'}
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
                                            className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs"
                                        >
                                            Sign In
                                        </Button>
                                        <Button
                                            onClick={() => { setMobileMenuOpen(false); router.push('/register'); }}
                                            className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-premium"
                                        >
                                            Join Hub
                                        </Button>
                                    </>
                                )}

                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-gray-300" />
                                    <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Escrow Secured Commerce</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
