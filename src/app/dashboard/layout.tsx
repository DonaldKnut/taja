"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  User,
  ShoppingBag,
  Heart,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Home,
  Package,
  CreditCard,
  Wallet,
  MapPin,
  Search,
  Upload,
  Sparkles,
  ChevronRight,
  Users,
  ChevronDown,
  Zap,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationsModal } from "@/components/NotificationsModal";
import { SearchModal } from "@/components/SearchModal";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { CartIcon, CartDrawer, useCartStore } from "@/components/cart";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Main",
    items: [
      { name: "Overview", href: "/dashboard", icon: Home },
      { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
      { name: "Orders", href: "/dashboard/orders", icon: Package },
    ],
  },
  {
    label: "Discover",
    items: [
      { name: "Marketplace", href: "/dashboard/marketplace", icon: ShoppingBag },
      { name: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Profile", href: "/dashboard/profile", icon: User },
      { name: "Addresses", href: "/dashboard/addresses", icon: MapPin },
      { name: "Referrals", href: "/dashboard/referrals", icon: Users },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

// Flat list for mobile
const allNavItems = navGroups.flatMap((g) => g.items);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { isOpen, toggleCart } = useCartStore();
  const { unreadCount } = useNotifications();
  const role = user?.role;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2 || trimmed.length > 100) return;
    router.push(`/marketplace?search=${encodeURIComponent(trimmed)}`);
  };

  const handleLogout = () => logout();

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  /* ── Sidebar Content (shared between desktop & mobile) ── */
  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="h-full flex flex-col">
      {/* User Avatar Card */}
      <div className="p-5 mb-2">
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-br from-taja-secondary/5 to-taja-primary/5 border border-white/60">
          <div className="relative h-11 w-11 shrink-0 rounded-full border-2 border-taja-primary/30 bg-white shadow-sm flex items-center justify-center text-sm font-black text-taja-primary overflow-hidden">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user.fullName || "User"}
                fill
                className="object-cover"
                unoptimized={user.avatar.startsWith("http")}
              />
            ) : (
              <span>{getUserInitials()}</span>
            )}
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-taja-primary border-2 border-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-taja-secondary truncate leading-none mb-1">
              {user?.fullName || "User"}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Admin Quick Switch (Conditional) */}
      {user?.role === "admin" && (
        <div className="px-5 mb-6">
          <Link
            href="/admin/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-500/20 shadow-lg hover:shadow-emerald/20 transition-all group"
          >
            <Zap className="h-[18px] w-[18px] animate-pulse" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">Command Hub</p>
              <p className="text-[9px] text-emerald-500/60 font-medium">Switch to Operator Mode</p>
            </div>
          </Link>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-6 scrollbar-hide pb-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.25em] px-3 mb-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative ${active
                      ? "bg-taja-primary/10 text-taja-primary"
                      : "text-gray-500 hover:text-taja-secondary hover:bg-gray-50"
                      }`}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-taja-primary"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon
                      className={`h-[18px] w-[18px] shrink-0 ${active
                        ? "text-taja-primary"
                        : "text-gray-400 group-hover:text-taja-primary transition-colors"
                        }`}
                    />
                    <span className="truncate">{item.name}</span>
                    {active && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-taja-primary animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-100 space-y-3">
        <Link
          href="/dashboard/marketplace"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 w-full py-3 bg-taja-primary text-white rounded-xl text-xs font-bold shadow-emerald hover:shadow-emerald-hover active:scale-[0.98] transition-all"
        >
          <ShoppingBag className="h-4 w-4" />
          Explore Marketplace
        </Link>
        <button
          onClick={() => {
            onNavigate?.();
            handleLogout();
          }}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </div >
  );

  return (
    <ProtectedRoute requiredRole={["buyer", "admin"]}>
      <NotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        initialQuery={searchQuery}
      />
      <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans selection:bg-taja-primary/30">
        {/* ═══ Top Header Bar ═══ */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-taja-primary transition-colors rounded-lg hover:bg-gray-50"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Logo size="lg" href="/" variant="header" />
            </div>

            {/* Center: Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative w-full group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 h-4 w-4 group-focus-within:text-taja-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Search products, shops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10 w-full bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-100 focus:border-taja-primary/30 rounded-xl text-sm placeholder:text-gray-300 transition-all focus:ring-2 focus:ring-taja-primary/10"
                  maxLength={100}
                />
              </form>
            </div>

            {/* Right: Notifications + User */}
            <div className="flex items-center gap-2">
              {/* Mobile search */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="md:hidden p-2 text-gray-400 hover:text-taja-primary transition-colors rounded-lg hover:bg-gray-50"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              <button
                onClick={() => setNotificationsOpen(true)}
                className="relative p-2 text-gray-400 hover:text-taja-primary transition-colors rounded-lg hover:bg-gray-50"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-taja-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <div className="hidden md:flex relative">
                <CartIcon
                  className="p-2 text-gray-400 hover:text-taja-primary transition-colors hover:bg-gray-50 rounded-lg"
                  iconSize="h-5 w-5"
                  badgeClassName="!h-4 !w-4 !text-[8px] !-top-0.5 !-right-0.5 bg-taja-primary text-white border-2 border-white"
                />
              </div>

              <div className="h-6 w-px bg-gray-100 mx-1 hidden sm:block" />

              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="relative h-8 w-8 shrink-0 rounded-full border border-gray-200 bg-white flex items-center justify-center text-xs font-bold text-taja-primary overflow-hidden">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.fullName || "User"}
                        fill
                        className="object-cover"
                        unoptimized={user.avatar.startsWith("http")}
                      />
                    ) : (
                      <span>{getUserInitials()}</span>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-taja-secondary leading-none">
                      {user?.fullName?.split(" ")[0] || "User"}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-300 hidden sm:block" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        aria-hidden="true"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden"
                      >
                        <div className="px-3.5 py-3 border-b border-gray-50">
                          <p className="text-sm font-semibold text-taja-secondary truncate">
                            {user?.fullName || "User"}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {user?.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/dashboard/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-taja-primary transition-colors"
                          >
                            <User className="h-4 w-4" />
                            Profile
                          </Link>
                          <Link
                            href="/dashboard/settings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-taja-primary transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            Settings
                          </Link>
                        </div>
                        <div className="border-t border-gray-50 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              handleLogout();
                            }}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign out
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

        <div className="flex flex-1 overflow-hidden relative">
          {/* ═══ Mobile Sidebar Drawer ═══ */}
          <AnimatePresence>
            {sidebarOpen && (
              <div className="fixed inset-0 lg:hidden z-50">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 280 }}
                  className="fixed left-0 top-0 h-screen w-full max-w-[280px] bg-white border-r border-gray-100 shadow-2xl"
                >
                  <div className="flex items-center justify-between px-5 h-16 border-b border-gray-50">
                    <Logo size="sm" href="/" variant="header" />
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="h-[calc(100vh-64px)] overflow-y-auto">
                    <SidebarContent onNavigate={() => setSidebarOpen(false)} />
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ═══ Desktop Sidebar ═══ */}
          <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 lg:top-16 z-30">
            <div className="flex-1 flex flex-col bg-white border-r border-gray-100 overflow-hidden">
              <SidebarContent />
            </div>
          </aside>

          {/* ═══ Main Content Area ═══ */}
          <main className="flex-1 lg:pl-[260px] overflow-y-auto relative scrollbar-hide">
            <div className={cn(
              "min-h-full px-4 sm:px-8 py-8 max-w-6xl mx-auto",
              pathname.includes("/dashboard/marketplace") && "px-0 sm:px-0 py-0 max-w-none"
            )}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
