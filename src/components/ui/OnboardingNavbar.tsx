"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import {
    Menu,
    X,
    LayoutDashboard,
    LogOut,
    User,
    ShoppingBag,
    Megaphone,
} from "lucide-react";

interface NavbarProps {
    /** Optional ad content. If provided, a banner strip renders below the nav bar */
    adContent?: React.ReactNode;
    /** User context: show/hide auth links or user info */
    user?: {
        fullName?: string;
        email?: string;
        role?: string;
    } | null;
    onLogout?: () => void;
    currentPageLabel?: string;
    /** If true, hide public links like Marketplace, Shops, and auth buttons */
    minimal?: boolean;
}

/**
 * OnboardingNavbar — premium sticky navbar used on all
 * shop-creation, KYC, and seller-setup pages.
 *
 * It occupies real vertical space (so the sticky element
 * doesn't overlap page content) and includes an optional
 * ad banner strip below the nav row — ready for future ads.
 */
export function OnboardingNavbar({
    adContent,
    user,
    onLogout,
    currentPageLabel,
    minimal = false,
}: NavbarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* ── Sticky nav shell ── */}
            <header className="sticky top-0 z-50">
                {/* Main nav bar */}
                <div className="bg-white/80 backdrop-blur-xl border-b border-white/60 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo */}
                            {!minimal && <Logo size="lg" variant="header" href="/" />}

                            {/* Centre label (desktop) */}
                            {currentPageLabel && !minimal && (
                                <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-taja-light border border-taja-primary/20">
                                    <span className="text-xs font-semibold text-taja-primary uppercase tracking-wider">
                                        {currentPageLabel}
                                    </span>
                                </div>
                            )}

                            {/* Desktop nav links */}
                            <div className="hidden md:flex items-center gap-4">
                                {!minimal && (
                                    <>
                                        <Link
                                            href="/marketplace"
                                            className="text-sm font-medium text-gray-600 hover:text-taja-primary transition-colors"
                                        >
                                            Marketplace
                                        </Link>
                                        <Link
                                            href="/shops"
                                            className="text-sm font-medium text-gray-600 hover:text-taja-primary transition-colors"
                                        >
                                            Shops
                                        </Link>
                                    </>
                                )}
                                {user ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-taja-light">
                                            <div className="w-7 h-7 rounded-full bg-gradient-taja flex items-center justify-center flex-shrink-0">
                                                <User className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <span className="text-sm font-semibold text-taja-secondary">
                                                {user.fullName?.split(" ")[0]}
                                            </span>
                                        </div>
                                        <Link
                                            href={user.role === "seller" ? "/seller/dashboard" : "/dashboard"}
                                        >
                                            <Button size="sm" variant="ghost">
                                                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                                                Dashboard
                                            </Button>
                                        </Link>
                                        {onLogout && (
                                            <button
                                                onClick={onLogout}
                                                className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
                                            >
                                                <LogOut className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    !minimal && (
                                        <div className="flex items-center gap-2">
                                            <Link href="/login">
                                                <Button size="sm" variant="ghost">Sign In</Button>
                                            </Link>
                                            <Link href="/register">
                                                <Button size="sm" variant="gradient">Sign Up</Button>
                                            </Link>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Mobile hamburger */}
                            <button
                                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 hover:text-taja-primary hover:bg-taja-light transition-colors"
                                aria-label="Open menu"
                                onClick={() => setMobileOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Ad banner strip ── */}
                {adContent && (
                    <div className="bg-gradient-to-r from-taja-secondary via-taja-primary to-taja-secondary/80 text-white">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="py-2 text-center text-sm font-medium">{adContent}</div>
                        </div>
                    </div>
                )}
            </header>

            {/* ── Mobile drawer ── */}
            <div
                className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"
                        }`}
                    onClick={() => setMobileOpen(false)}
                />

                {/* Drawer panel */}
                <div
                    className={`absolute top-0 right-0 h-full w-80 bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                >
                    {/* Drawer header */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        {!minimal && <Logo size="md" variant="header" href="/" />}
                        <button
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                            aria-label="Close menu"
                            onClick={() => setMobileOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Drawer nav */}
                    <nav className="flex flex-col flex-1 p-5 space-y-1 overflow-y-auto">
                        {!minimal && [
                            { href: "/", label: "Home" },
                            { href: "/marketplace", label: "Marketplace" },
                            { href: "/shops", label: "Shops" },
                            { href: "/how-it-works", label: "How It Works" },
                        ].map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:text-taja-primary hover:bg-taja-light font-medium transition-colors"
                            >
                                {label}
                            </Link>
                        ))}

                        <div className={`pt-4 ${!minimal ? 'border-t border-gray-100' : ''}`}>
                            {user ? (
                                <div className="space-y-3">
                                    {/* User chip */}
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-taja-light">
                                        <div className="w-10 h-10 rounded-full bg-gradient-taja flex items-center justify-center">
                                            <User className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-taja-secondary text-sm truncate">
                                                {user.fullName}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    <Link
                                        href={user.role === "seller" ? "/seller/dashboard" : "/dashboard"}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-taja-primary hover:bg-taja-light font-medium transition-colors"
                                    >
                                        <LayoutDashboard className="h-4 w-4" />
                                        Dashboard
                                    </Link>

                                    <Link
                                        href="/shops/new"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-taja-primary hover:bg-taja-light font-medium transition-colors"
                                    >
                                        <ShoppingBag className="h-4 w-4" />
                                        Create a Shop
                                    </Link>

                                    {onLogout && (
                                        <button
                                            onClick={() => { onLogout(); setMobileOpen(false); }}
                                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors text-left"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign Out
                                        </button>
                                    )}
                                </div>
                            ) : (
                                !minimal && (
                                    <div className="space-y-2">
                                        <Link href="/login" onClick={() => setMobileOpen(false)} className="block">
                                            <Button variant="outline" className="w-full">Sign In</Button>
                                        </Link>
                                        <Link href="/register" onClick={() => setMobileOpen(false)} className="block">
                                            <Button variant="gradient" className="w-full">Sign Up Free</Button>
                                        </Link>
                                    </div>
                                )
                            )}
                        </div>
                    </nav>
                </div>
            </div>
        </>
    );
}
