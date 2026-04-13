"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Store,
  ShoppingBag,
  ShieldCheck,
  Menu,
  X,
  Plus,
  LogOut,
  Bell,
  Search,
  Truck,
  Sparkles,
  AlertCircle,
  Compass,
  ChevronDown,
  User,
  Wallet,
  CreditCard,
  MapPin,
  Users,
  Heart,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { NotificationsModal } from "@/components/NotificationsModal";
import { SearchModal } from "@/components/SearchModal";
import { api } from "@/lib/api";
import { CartIcon, CartDrawer, useCartStore } from "@/components/cart";
import { cn } from "@/lib/utils";

const KYC_BANNER_SKIP_KEY = "taja_seller_kyc_banner_skipped";
const SELLER_SIDEBAR_COLLAPSED_KEY = "taja_seller_sidebar_collapsed";

const sellerNavigation = [
  { name: "Overview", href: "/seller/dashboard", icon: LayoutDashboard },
  { name: "Marketplace", href: "/seller/marketplace", icon: ShoppingBag },
  { name: "Products", href: "/seller/products", icon: Package },
  { name: "Categories", href: "/seller/categories", icon: Compass },
  { name: "Orders", href: "/seller/orders", icon: ShoppingCart },
  { name: "Logistics", href: "/seller/logistics", icon: Truck },
  { name: "Analytics", href: "/seller/analytics", icon: TrendingUp },
];

const buyerNavigation = [
  { name: "Wallet", href: "/seller/wallet", icon: Wallet },
  { name: "Orders", href: "/seller/purchases", icon: Package },
  { name: "Addresses", href: "/seller/addresses", icon: MapPin },
  // { name: "Virtual Try-On", href: "/seller/try-on", icon: Sparkles }, // Temporarily disabled - manual overlay not AI-powered
  { name: "Referrals", href: "/seller/referrals", icon: Users },
  { name: "Wishlist", href: "/seller/wishlist", icon: Heart },
];

const managementNavigation = [
  { name: "Setup", href: "/seller/setup", icon: Store },
  { name: "Shop profile", href: "/seller/shop/edit", icon: Store },
  { name: "Verification", href: "/seller/verification", icon: ShieldCheck },
  { name: "Profile", href: "/seller/profile", icon: User },
  { name: "Settings", href: "/seller/settings", icon: Settings },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { isOpen, toggleCart } = useCartStore();
  const [hasShop, setHasShop] = useState(false);
  const [checkingShop, setCheckingShop] = useState(true);
  const { unreadCount } = useNotifications();
  const pathname = usePathname();

  const isUnderReview = user?.accountStatus === "under_review";
  const kycStatus = user?.kyc?.status;
  const isVerifiedSeller = kycStatus === "approved";
  const kycPending = kycStatus === "not_started" || kycStatus === "rejected" || !kycStatus || kycStatus === "pending";

  // Effective verification status: If KYC is approved, you are verified.
  const isFullyVerified = isVerifiedSeller;

  useEffect(() => {
    try {
      if (localStorage.getItem(SELLER_SIDEBAR_COLLAPSED_KEY) === "1") {
        setSidebarCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SELLER_SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  useEffect(() => {
    const checkShopStatus = async () => {
      if (!user) return;
      try {
        const response = await api("/api/shops/my");
        setHasShop(!!(response?.data || response?.shop));
      } catch (error) {
        setHasShop(false);
      } finally {
        setCheckingShop(false);
      }
    };
    checkShopStatus();
  }, [user]);

  // Products can be added if the user is verified (KYC approved)
  const canAddProducts = isFullyVerified;

  const filteredSellerNav = isUnderReview
    ? sellerNavigation.filter((i) => i.href !== "/seller/verification")
    : sellerNavigation;

  const filteredManagementNav = isUnderReview
    ? managementNavigation.filter((i) => i.href !== "/seller/verification")
    : managementNavigation;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2 || trimmed.length > 100) return;
    router.push(`/marketplace?search=${encodeURIComponent(trimmed)}`);
  };

  const handleLogout = () => { logout(); };

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "S";
  };

  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(KYC_BANNER_SKIP_KEY) === "1";
  });

  const dismissKycBanner = () => {
    sessionStorage.setItem(KYC_BANNER_SKIP_KEY, "1");
    setBannerDismissed(true);
  };

  if (pathname === "/seller" || pathname === "/onboarding" || pathname === "/onboarding/kyc") {
    return <>{children}</>;
  }

  const SidebarContent = ({ mobile = false, collapsed = false }: { mobile?: boolean; collapsed?: boolean }) => {
    const narrow = collapsed && !mobile;
    return (
    <div className={cn("flex flex-col min-h-full pt-2 pb-6", narrow ? "px-2" : "px-4")}>
      {/* Branding for Mobile */}
      {mobile && (
        <div className="flex items-center justify-between mb-10 px-2">
          <Logo size="sm" href="/seller/dashboard" variant="header" />
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-white/70 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* User profile section */}
      <div className={cn("mb-8", narrow && "mb-4")}>
        <div
          className={cn(
            "rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md",
            narrow ? "flex justify-center p-3" : "flex items-center gap-4 p-4"
          )}
        >
          <div className="relative h-12 w-12 rounded-2xl bg-gradient-taja p-0.5 flex-shrink-0">
            <div className="h-full w-full rounded-[14px] bg-taja-secondary flex items-center justify-center text-sm font-black text-white overflow-hidden relative">
              {user?.avatar ? (
                <Image src={user.avatar} alt={user?.fullName || "Seller"} fill className="object-cover" unoptimized={user.avatar.startsWith("http")} />
              ) : (
                <span>{getUserInitials()}</span>
              )}
            </div>
          </div>
          {!narrow && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white tracking-tight truncate">{user?.fullName || "Seller"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                  Active Seller
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create product CTA */}
      <div className={cn("mb-8", narrow && "mb-4")}>
        {checkingShop ? (
          <div className="h-14 w-full bg-white/5 animate-pulse rounded-2xl" />
        ) : isUnderReview || !canAddProducts ? (
          narrow ? (
            <div className="flex flex-col gap-2">
              {kycPending && (
                <Link
                  href="/onboarding/kyc"
                  title="Start verification"
                  onClick={() => mobile && setSidebarOpen(false)}
                  className="flex items-center justify-center p-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-400 transition-colors shadow-emerald"
                >
                  <ShieldCheck className="h-5 w-5" />
                </Link>
              )}
              {!kycPending && !hasShop && (
                <Link
                  href="/seller/setup"
                  title="Shop setup"
                  onClick={() => mobile && setSidebarOpen(false)}
                  className="flex items-center justify-center p-3 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-colors"
                >
                  <Store className="h-5 w-5" />
                </Link>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.1em]">Restricted Access</span>
              </div>
              <p className="text-[11px] font-medium leading-relaxed opacity-80">
                {kycPending
                  ? "Complete your identity verification to start selling."
                  : !hasShop
                    ? "Set up your shop to start adding products."
                    : "Your account credentials are valid. You can now publish assets."}
              </p>
              <div className="flex gap-2">
                {kycPending && (
                  <Link
                    href="/onboarding/kyc"
                    onClick={() => mobile && setSidebarOpen(false)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
                  >
                    Start Verification
                  </Link>
                )}
                {!kycPending && !hasShop && (
                  <Link
                    href="/seller/setup"
                    onClick={() => mobile && setSidebarOpen(false)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] bg-white text-taja-secondary hover:bg-taja-light transition-colors"
                  >
                    Open Shop Setup
                  </Link>
                )}
              </div>
            </div>
          )
        ) : (
          <Link
            href="/seller/products/new"
            title={narrow ? "New Product" : undefined}
            onClick={() => mobile && setSidebarOpen(false)}
            className={cn(
              "group flex items-center justify-center bg-white text-taja-secondary rounded-2xl font-black uppercase tracking-[0.15em] shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all",
              narrow ? "w-full px-3 py-3.5" : "gap-3 w-full px-6 py-4 text-[11px]"
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!narrow && (
              <>
                New Product
                <Sparkles className="h-4 w-4 text-taja-primary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </Link>
        )}
      </div>

      {/* Navigation - min-h-0 lets flex child shrink so overflow-y-auto works */}
      <nav className="flex-1 min-h-0 space-y-8 overflow-y-auto pb-10 custom-scrollbar pr-1">
        {/* Seller Section */}
        <div>
          {!narrow && (
            <p className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Seller Dashboard</p>
          )}
          <div className="space-y-1">
            {filteredSellerNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={narrow ? item.name : undefined}
                  onClick={() => mobile && setSidebarOpen(false)}
                  className={cn(
                    "group flex rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                    narrow ? "items-center justify-center px-2 py-3.5" : "items-center justify-between px-5 py-3",
                    isActive
                      ? "bg-taja-primary text-white shadow-emerald"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className={cn("flex items-center", !narrow && "w-full min-w-0")}>
                    <item.icon className={cn("h-4 w-4 shrink-0", narrow ? "" : "mr-4", isActive ? "text-white" : "text-white/20 group-hover:text-taja-primary transition-colors")} />
                    {!narrow && item.name}
                  </div>
                  {isActive && !narrow && (
                    <motion.div layoutId={`activeNav${mobile ? "Mob" : "Desk"}`} className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Buyer Section */}
        <div>
          {!narrow && (
            <p className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Account</p>
          )}
          <div className="space-y-1">
            {buyerNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={narrow ? item.name : undefined}
                  onClick={() => mobile && setSidebarOpen(false)}
                  className={cn(
                    "group flex rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                    narrow ? "items-center justify-center px-2 py-3.5" : "items-center justify-between px-5 py-3",
                    isActive
                      ? "bg-taja-primary text-white shadow-emerald"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className={cn("flex items-center", !narrow && "w-full min-w-0")}>
                    <item.icon className={cn("h-4 w-4 shrink-0", narrow ? "" : "mr-4", isActive ? "text-white" : "text-white/20 group-hover:text-taja-primary transition-colors")} />
                    {!narrow && item.name}
                  </div>
                  {isActive && !narrow && (
                    <motion.div layoutId={`activeNav${mobile ? "Mob" : "Desk"}`} className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Management Section */}
        <div>
          {!narrow && (
            <p className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Management</p>
          )}
          <div className="space-y-1">
            {filteredManagementNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={narrow ? item.name : undefined}
                  onClick={() => mobile && setSidebarOpen(false)}
                  className={cn(
                    "group flex rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                    narrow ? "items-center justify-center px-2 py-3.5" : "items-center justify-between px-5 py-3",
                    isActive
                      ? "bg-taja-primary text-white shadow-emerald"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className={cn("flex items-center", !narrow && "w-full min-w-0")}>
                    <item.icon className={cn("h-4 w-4 shrink-0", narrow ? "" : "mr-4", isActive ? "text-white" : "text-white/20 group-hover:text-taja-primary transition-colors")} />
                    {!narrow && item.name}
                  </div>
                  {isActive && !narrow && (
                    <motion.div layoutId={`activeNav${mobile ? "Mob" : "Desk"}`} className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

    </div>
    );
  };

  return (
    <ProtectedRoute requiredRole="seller">
      <NotificationsModal open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <SearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} initialQuery={searchQuery} />

      <div className="min-h-screen bg-motif-blanc flex flex-col font-sans selection:bg-taja-primary/30">
        {/* Top Header Bar */}
        <header className="fixed top-0 left-0 right-0 z-[110] w-full glass-panel border-b border-white/60 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 sm:px-10 h-20">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-taja-primary transition-colors bg-white/40 rounded-xl border border-white/60"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Logo size="lg" href="/seller/dashboard" variant="header" />

              <div className="hidden lg:flex h-8 w-px bg-white/40 mx-2" />

              <nav className="hidden xl:flex items-center gap-6 mr-4">
                {filteredSellerNav.slice(0, 3).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 ${isActive ? "text-taja-primary" : "text-gray-500 hover:text-taja-secondary"
                        }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

            </div>

            {/* Center */}
            <div className="hidden md:flex flex-1 max-w-xl mx-12">
              <form onSubmit={handleSearch} className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-taja-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Search Marketplace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 h-12 w-full glass-card border-white/40 focus:border-taja-primary/40 focus:ring-0 transition-all text-sm font-medium tracking-wide"
                  maxLength={100}
                />
              </form>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setNotificationsOpen(true)}
                className="p-3 text-gray-400 hover:text-taja-primary glass-card border-white/40 hover:border-taja-primary/20 transition-all rounded-full relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 bg-taja-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <div className="hidden md:flex relative">
                <CartIcon
                  className="p-3 text-gray-400 hover:text-taja-primary glass-card border-white/40 hover:border-taja-primary/20 transition-all rounded-full"
                  iconSize="h-5 w-5"
                  badgeClassName="!h-5 !w-5 !text-[10px] !top-0 !right-0 bg-taja-primary text-white border-2 border-white"
                />
              </div>

              <div className="h-8 w-px bg-white/40 mx-2 hidden sm:block" />

              <div className="relative">
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="flex items-center gap-3 pl-2 py-1.5 pr-1.5 rounded-2xl hover:bg-white/40 transition-all group"
                >
                  <div className="hidden sm:block text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <p className="text-sm font-bold text-taja-secondary leading-none">{user?.fullName?.split(" ")[0] || "User"}</p>
                      <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform duration-300 ${accountDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  <div className="relative h-11 w-11 rounded-2xl border-2 border-white bg-gradient-taja shadow-premium-hover flex items-center justify-center text-sm font-black text-white overflow-hidden p-0.5 group-hover:scale-105 transition-transform">
                    <div className="h-full w-full rounded-[14px] bg-taja-secondary/40 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
                      {user?.avatar ? (
                        <Image src={user.avatar} alt={user.fullName || "User"} fill className="object-cover" unoptimized={user.avatar.startsWith('http')} />
                      ) : (
                        <span>{getUserInitials()}</span>
                      )}
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {accountDropdownOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setAccountDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                        className="absolute right-0 mt-3 w-72 bg-white border border-gray-100 shadow-huge z-50 overflow-hidden rounded-[2.5rem]"
                      >
                        <div className="p-7 border-b border-gray-50">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-taja p-0.5 flex-shrink-0">
                              <div className="h-full w-full rounded-[14px] bg-taja-secondary flex items-center justify-center text-sm font-black text-white overflow-hidden relative">
                                {user?.avatar ? (
                                  <Image
                                    src={user.avatar}
                                    alt={user?.fullName ? `${user.fullName} profile photo` : "Profile photo"}
                                    fill
                                    className="object-cover"
                                    unoptimized={user.avatar.startsWith("http")}
                                  />
                                ) : (
                                  <span>{getUserInitials()}</span>
                                )}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-taja-secondary truncate">{user?.fullName || "User"}</p>
                              <p className="text-[10px] font-medium text-gray-400 truncate">{user?.email || ""}</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                              <span>Verification Status</span>
                              <span className="text-emerald-500">
                                100% SECURE
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100/50 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                className="h-full bg-emerald-500 shadow-emerald"
                              />
                            </div>
                            <p className="text-[10px] font-medium text-gray-500 italic">
                              Your merchant identity is fully verified.
                            </p>
                          </div>
                        </div>

                        <div className="p-2">
                          <Link
                            href="/seller/profile"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-gray-600 hover:text-taja-primary hover:bg-taja-primary/5 transition-all group"
                          >
                            <User className="h-4 w-4 text-gray-400 group-hover:text-taja-primary" />
                            Profile Settings
                          </Link>
                          {kycPending && (
                            <Link
                              href="/onboarding/kyc"
                              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-amber-600 hover:bg-amber-50 transition-all group"
                            >
                              <ShieldCheck className="h-4 w-4 text-amber-500" />
                              Complete Verification
                            </Link>
                          )}
                          <div className="h-px bg-white/40 my-2" />
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all group"
                          >
                            <LogOut className="h-4 w-4 text-red-400 group-hover:-translate-x-1 transition-transform" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative pt-20">
          {/* Mobile sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <div className="fixed inset-0 lg:hidden z-[120]">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-taja-secondary/40 backdrop-blur-xl"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed left-0 top-0 h-screen w-full max-w-[300px] bg-taja-secondary border-r border-white/10 shadow-2xl overflow-y-auto"
                >
                  <SidebarContent mobile collapsed={false} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Desktop Sidebar - collapsible rail */}
          <aside
            className={cn(
              "hidden lg:flex lg:flex-col lg:fixed lg:top-20 lg:bottom-0 lg:left-0 lg:z-[100] lg:pb-0 transition-[width] duration-300 ease-out",
              sidebarCollapsed ? "lg:w-20" : "lg:w-80"
            )}
          >
            <div
              className={cn(
                "flex-1 flex flex-col min-h-0 bg-taja-secondary/95 backdrop-blur-3xl border-r border-white/10 shadow-2xl relative z-10 overflow-hidden",
                sidebarCollapsed ? "m-2 rounded-3xl" : "m-4 rounded-[40px]"
              )}
            >
              <div className="hidden lg:flex items-center justify-end px-2 pt-2 pb-1 shrink-0 border-b border-white/5">
                <button
                  type="button"
                  onClick={toggleSidebarCollapsed}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  aria-expanded={!sidebarCollapsed}
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <SidebarContent collapsed={sidebarCollapsed} />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main
            className={cn(
              "flex-1 overflow-y-auto relative scrollbar-hide transition-[padding] duration-300 ease-out",
              sidebarCollapsed ? "lg:pl-20" : "lg:pl-80"
            )}
          >
            {/* Subtle Ambient Background Decorative Element */}
            <div className="fixed top-1/4 right-1/4 w-[600px] h-[600px] bg-taja-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="fixed bottom-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

            {/* Identity Shield - Fixed Verification Awareness Widget */}
            <AnimatePresence>
              {kycPending && !bannerDismissed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed bottom-8 right-8 z-50 max-w-sm"
                >
                  <div className="glass-panel p-6 border-white/40 shadow-premium-hover relative overflow-hidden group rounded-[2rem]">
                    {/* Animated Background Glow */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full group-hover:bg-emerald-500/20 transition-colors duration-500" />

                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-6 w-6 text-emerald-400 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-taja-secondary tracking-tight uppercase">Verification Status</h4>
                        <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                          Your verification is pending. Complete it to unlock advanced selling features and list products.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-2 relative z-10">
                      <Button asChild variant="gradient" className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-emerald">
                        <Link href="/onboarding/kyc">Secure Account Now</Link>
                      </Button>
                      <button
                        onClick={dismissKycBanner}
                        className="w-full h-11 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                      >
                        <Compass className="h-4 w-4" />
                        Explore Dashboard First
                      </button>
                    </div>

                    {/* Corner close button */}
                    <button
                      onClick={dismissKycBanner}
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
