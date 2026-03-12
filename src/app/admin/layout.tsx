"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Ban,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  HelpCircle,
  Package,
  ShoppingCart,
  BarChart3,
  Activity,
  Zap,
  Globe,
  Database,
  ShieldAlert,
  Plus,
  Sparkles,
  Store,
  Mail,
  Tag,
  ChevronDown,
  MessageCircle,
  LayoutGrid,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationsModal } from "@/components/NotificationsModal";
import { SearchModal } from "@/components/SearchModal";
import { motion, AnimatePresence } from "framer-motion";
import { CartIcon, useCartStore } from "@/components/cart";

const adminNavGroups = [
  {
    label: "Operations",
    items: [
      { name: "Dashboard Overview", href: "/admin/dashboard", icon: Activity },
      { name: "Business Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Safety & Security",
    items: [
      { name: "User Management", href: "/admin/users", icon: Users },
      { name: "Identity Verification", href: "/admin/kyc", icon: ShieldCheck },
      { name: "Message Audit Logs", href: "/admin/chats", icon: MessageCircle },
    ],
  },
  {
    label: "Marketplace Oversight",
    items: [
      { name: "Global Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Shops", href: "/admin/shops", icon: Store },
      { name: "Categories", href: "/admin/categories", icon: Tag },
      { name: "Product Catalog", href: "/admin/products", icon: Package },
    ],
  },
  {
    label: "Communications",
    items: [
      { name: "Broadcast message", href: "/admin/broadcast", icon: Mail },
    ],
  },
  {
    label: "System Configuration",
    items: [
      { name: "Platform Settings", href: "/admin/settings", icon: Settings },
      { name: "System Maintenance", href: "/admin/maintenance", icon: Database },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { toggleCart } = useCartStore();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2 || trimmed.length > 100) return;
    router.push(`/marketplace?search=${encodeURIComponent(trimmed)}`);
  };

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "A";
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col min-h-full pt-4 pb-6 px-4">
      {/* Branding for Mobile */}
      {mobile && (
        <div className="flex items-center justify-between mb-10 px-2 text-white">
          <Logo size="sm" href="/admin/dashboard" variant="header" />
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-white/70 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Admin profile section - Collapsible */}
      <div className="mb-6">
        <button
          onClick={() => setProfileExpanded(!profileExpanded)}
          className="w-full flex items-center justify-between p-4 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-huge hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="relative h-12 w-12 rounded-2xl bg-emerald-500 p-0.5 flex-shrink-0">
              <div className="h-full w-full rounded-[14px] bg-slate-950 flex items-center justify-center text-sm font-black text-white overflow-hidden relative">
                {user?.avatar ? (
                  <Image src={user.avatar} alt={user?.fullName || "Admin"} fill className="object-cover" unoptimized={user.avatar.startsWith("http")} />
                ) : (
                  <span>{getUserInitials()}</span>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white tracking-tight truncate leading-none mb-1">
                {user?.fullName || "System Manager"}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/80">
                  System Administrator
                </p>
              </div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: profileExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-white/40" />
          </motion.div>
        </button>

        <AnimatePresence>
          {profileExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 px-2 space-y-2">
                <div className="mb-4 px-2">
                  <p className="text-[10px] text-white/40 truncate text-center">
                    {user?.email}
                  </p>
                </div>
                <Link
                  href="/admin/shops/new"
                  className="group flex items-center justify-center gap-3 w-full px-6 py-3.5 bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase tracking-[0.15em] hover:bg-white/20 transition-all text-[10px]"
                >
                  <Store className="h-4 w-4" />
                  New shop
                </Link>
                <Link
                  href="/admin/products/new"
                  className="group flex items-center justify-center gap-3 w-full px-6 py-4 bg-white text-emerald-950 rounded-2xl font-black uppercase tracking-[0.15em] shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all text-[11px]"
                >
                  <Plus className="h-4 w-4" />
                  New Product
                  <Sparkles className="h-4 w-4 text-emerald-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Buyer dashboard - prominent on mobile */}
      {mobile && (
        <div className="px-2 mb-6">
          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center gap-3 w-full px-6 py-3.5 bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase tracking-[0.15em] hover:bg-white/20 transition-all text-[10px]"
          >
            <LayoutGrid className="h-4 w-4" />
            Buyer dashboard
          </Link>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-8 overflow-y-auto custom-scrollbar-visible pb-10">
        {adminNavGroups.map((group) => (
          <div key={group.label}>
            <p className="px-4 mb-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/30">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => mobile && setSidebarOpen(false)}
                    className={`group flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${isActive
                      ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <div className="flex items-center">
                      <item.icon className={`mr-4 h-4 w-4 ${isActive ? "text-white" : "text-white/20 group-hover:text-emerald-400 transition-colors"}`} />
                      {item.name}
                    </div>
                    {isActive && <motion.div layoutId={`activeNav${mobile ? 'Mob' : 'Desk'}`} className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-auto px-2">
        <button
          onClick={() => { logout(); mobile && setSidebarOpen(false); }}
          className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all group"
        >
          <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <ProtectedRoute requiredRole="admin">
      <NotificationsModal open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <SearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} initialQuery={searchQuery} />

      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-emerald-500/30">
        {/* Top Header Bar */}
        <header className="fixed top-0 left-0 right-0 z-[110] w-full bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
          <div className="flex items-center justify-between px-4 sm:px-10 h-20">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-emerald-500 transition-colors bg-white rounded-xl shadow-sm border border-gray-100"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Logo size="lg" href="/admin/dashboard" variant="header" />
              <div className="hidden lg:flex h-8 w-px bg-gray-100 mx-2" />
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                Admin Panel
              </span>
              <Link
                href="/dashboard"
                aria-label="Buyer dashboard"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-600 px-2 sm:px-3 py-1.5 rounded-lg border border-gray-100 hover:border-emerald-100 bg-white hover:bg-emerald-50/50 transition-all shrink-0"
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Buyer dashboard</span>
              </Link>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex flex-1 max-w-xl mx-12">
              <form onSubmit={handleSearch} className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 h-5 w-5 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Admin Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 h-12 w-full bg-slate-50 border border-gray-100 focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all rounded-[1.2rem] text-sm font-medium tracking-wide placeholder:text-gray-300"
                  maxLength={100}
                />
              </form>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setNotificationsOpen(true)}
                className="p-3 text-gray-400 hover:text-emerald-500 bg-white border border-gray-100 hover:border-emerald-100 transition-all rounded-2xl relative shadow-sm"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <div className="flex relative">
                <CartIcon
                  className="p-3 text-gray-400 hover:text-emerald-500 bg-white border border-gray-100 hover:border-emerald-100 transition-all rounded-2xl shadow-sm"
                  iconSize="h-5 w-5"
                  badgeClassName="!h-5 !w-5 !text-[10px] !-top-1 !-right-1 bg-emerald-500 text-white border-2 border-white shadow-sm"
                />
              </div>

              <div className="h-8 w-px bg-gray-100 mx-2 hidden sm:block" />

              <div className="flex items-center gap-3 pl-2 py-1.5 pr-1.5 rounded-2xl hover:bg-gray-50 transition-all group">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-black text-slate-900 leading-none mb-1">{user?.fullName?.split(" ")[0] || "Admin"}</p>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Admin</p>
                </div>
                <div className="relative h-11 w-11 rounded-2xl bg-slate-950 flex items-center justify-center text-sm font-black text-white overflow-hidden p-0.5 shadow-sm group-hover:scale-105 transition-transform border border-slate-900">
                  {user?.avatar ? (
                    <Image src={user.avatar} alt={user.fullName || "Admin"} fill className="object-cover" unoptimized={user.avatar.startsWith('http')} />
                  ) : (
                    <span>{getUserInitials()}</span>
                  )}
                </div>
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
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed left-0 top-0 h-screen w-full max-w-[300px] bg-emerald-950 border-r border-white/10 shadow-huge overflow-y-auto"
                >
                  <SidebarContent mobile />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:top-20 lg:bottom-0 lg:left-0 lg:z-[100] lg:pb-0">
            <div className="flex-1 flex flex-col m-4 rounded-[2.5rem] bg-emerald-950/95 backdrop-blur-3xl border border-white/5 overflow-hidden shadow-huge">
              <SidebarContent />
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 lg:pl-80 overflow-y-auto relative scrollbar-hide">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}







