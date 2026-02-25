"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  CheckCircle,
  Package,
  MessageCircle,
  Heart,
  Grid,
  List,
  Shield,
  Clock,
  Instagram,
  Phone,
  ArrowRight,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ProductCard } from "@/components/product";
import { Container } from "@/components/layout";
import { shopsApi, api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Shop {
  _id: string;
  shopName: string;
  shopSlug: string;
  description?: string;
  logo?: string;
  banner?: string;
  categories?: string[];
  verification?: {
    isVerified: boolean;
  };
  stats?: {
    averageRating: number;
    totalReviews: number;
    totalProducts: number;
    followerCount?: number;
  };
  owner?: {
    fullName: string;
    avatar?: string;
    isVerified: boolean;
    createdAt?: string;
  };
  settings?: {
    returnPolicy?: string;
    responseTime?: string;
  };
  socialLinks?: {
    instagram?: string;
    whatsapp?: string;
    twitter?: string;
    facebook?: string;
  };
  products?: any[];
  createdAt?: string;
}

export default function ShopPage() {
  const params = useParams();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("recent");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"products" | "about" | "reviews">("products");

  // Format WhatsApp URL
  const getWhatsAppUrl = (whatsapp: string, message?: string) => {
    if (!whatsapp) return null;
    const cleanNumber = whatsapp.replace(/[\s\+\-]/g, "");
    if (whatsapp.startsWith("http")) return whatsapp;
    const baseUrl = `https://wa.me/${cleanNumber}`;
    if (message) {
      const encodedMessage = encodeURIComponent(message);
      return `${baseUrl}?text=${encodedMessage}`;
    }
    return baseUrl;
  };

  // Format Instagram URL
  const getInstagramUrl = (instagram: string) => {
    if (!instagram) return null;
    const username = instagram.replace(/^@/, "");
    if (instagram.startsWith("http")) return instagram;
    return `https://instagram.com/${username}`;
  };

  useEffect(() => {
    const fetchShop = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await shopsApi.getBySlug(params.slug as string);

        if (response.success && response.data) {
          const shopData = response.data as Shop;
          setShop(shopData);
          setFollowers(shopData.stats?.followerCount || 0);
          if (shopData.products && Array.isArray(shopData.products)) {
            setProducts(shopData.products);
          }
        } else {
          setError("Shop not found");
        }
      } catch (error: any) {
        console.error("Error fetching shop:", error);
        setError(error.message || "Failed to load shop");
        toast.error("Failed to load shop");
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      fetchShop();
    }
  }, [params.slug]);

  // Load follow status when shop is loaded
  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!shop?._id) return;
      try {
        const res = await api(`/api/shops/${shop._id}/follow`);
        if (res.success && res.data) {
          setIsFollowing(!!res.data.isFollowing);
        }
      } catch {
        // Silently ignore
      }
    };

    fetchFollowStatus();
  }, [shop?._id]);

  const toggleFollow = async () => {
    if (!shop?._id) return;
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await api(`/api/shops/${shop._id}/follow`, { method });
      if (res.success) {
        const delta = isFollowing ? -1 : 1;
        setIsFollowing(!isFollowing);
        setFollowers((prev) => Math.max(0, prev + delta));
        toast.success(isFollowing ? "Unfollowed shop" : "Now following this shop");
      } else {
        toast.error(res.message || "Unable to update follow status");
      }
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error("Please log in to follow shops");
      } else {
        toast.error(error.message || "Failed to update follow status");
      }
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return (a.price || 0) - (b.price || 0);
      case "price-high":
        return (b.price || 0) - (a.price || 0);
      case "recent":
      default:
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="absolute inset-0 motif-blanc opacity-40" />
        <div className="relative text-center space-y-4">
          <div className="h-12 w-12 border-4 border-taja-primary/20 border-t-taja-primary rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Synchronizing Shop Hub...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="absolute inset-0 motif-blanc opacity-20" />
        <div className="relative text-center max-w-md space-y-8 glass-card p-12 border-gray-100">
          <div className="h-20 w-20 rounded-3xl bg-taja-light flex items-center justify-center mx-auto">
            <Package className="h-10 w-10 text-taja-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">Shop Offline</h2>
            <p className="text-sm font-medium text-gray-500">{error || "The requested commerce portal is currently unavailable."}</p>
          </div>
          <Button onClick={() => router.push("/shops")} className="w-full rounded-full">
            Return to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-taja-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-emerald-100/10 blur-[100px] rounded-full" />
        <div className="absolute inset-0 motif-blanc opacity-30" />
      </div>

      <div className="relative z-10">
        {/* Cinematic Header Section */}
        <section className="relative h-[400px] md:h-[500px] overflow-hidden">
          {/* Banner Image with Parallax-like effect */}
          <div className="absolute inset-0">
            {shop.banner ? (
              <Image
                src={shop.banner}
                alt={shop.shopName}
                fill
                className="object-cover scale-105"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-taja-secondary to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-80" />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <Container size="lg" className="h-full flex flex-col justify-end pb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card p-8 md:p-10 rounded-[2.5rem] border-white/60 bg-white/60 backdrop-blur-2xl shadow-premium relative -mb-20 md:-mb-24 z-20 flex flex-col md:flex-row gap-8 items-start md:items-center"
            >
              {/* Profile Logo Card */}
              <div className="relative group">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2rem] border-4 border-white shadow-premium overflow-hidden bg-white ring-4 ring-taja-primary/5 group-hover:scale-105 transition-transform duration-500">
                  {shop.logo ? (
                    <Image
                      src={shop.logo}
                      alt={shop.shopName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 112px, 144px"
                    />
                  ) : (
                    <div className="w-full h-full bg-taja-light flex items-center justify-center text-taja-primary font-black text-4xl">
                      {shop.shopName.charAt(0)}
                    </div>
                  )}
                </div>
                {shop.verification?.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-taja-primary text-white p-2 rounded-xl shadow-emerald border-2 border-white">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <h1 className="text-3xl md:text-5xl font-black text-taja-secondary tracking-tighter leading-none">
                    {shop.shopName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {shop.stats?.averageRating && shop.stats.averageRating > 0 && (
                      <div className="flex items-center gap-1.5 text-taja-primary bg-taja-primary/5 px-3 py-1 rounded-full border border-taja-primary/10">
                        <Star className="h-3 w-3 fill-taja-primary" />
                        <span>{shop.stats.averageRating.toFixed(1)} Intel</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                      <Clock className="h-3 w-3" />
                      <span>Since {formatDate(shop.owner?.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                      <Heart className="h-3 w-3" />
                      <span>{followers.toLocaleString()} Loyalists</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-2xl line-clamp-2">
                  {shop.description || "Architecting a premium commerce experience in the heart of Nigeria."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2 md:pt-0">
                <Button
                  onClick={toggleFollow}
                  className={cn(
                    "rounded-full px-8 h-12 shadow-premium transition-all font-black uppercase tracking-widest text-[10px]",
                    isFollowing ? "bg-white text-taja-secondary border border-gray-100 placeholder:hover:bg-gray-50" : "bg-taja-primary text-white hover:shadow-emerald-hover"
                  )}
                >
                  <Heart className={cn("h-4 w-4 mr-2", isFollowing ? "fill-current" : "")} />
                  {isFollowing ? "Connected" : "Connect"}
                </Button>

                {shop.socialLinks?.whatsapp && (
                  <Button
                    variant="outline"
                    className="rounded-full px-8 h-12 glass-card border-gray-100 text-taja-primary font-black uppercase tracking-widest text-[10px] hover:bg-green-50/50"
                    onClick={() => {
                      const url = getWhatsAppUrl(shop.socialLinks!.whatsapp!);
                      if (url) window.open(url, "_blank");
                    }}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Secure Line
                  </Button>
                )}
              </div>
            </motion.div>
          </Container>
        </section>

        {/* Navigation & Content Area */}
        <div className="pt-32 md:pt-40">
          <Container size="lg">
            {/* Action Tabs Bar - Premium Glass Sticky */}
            <div className="sticky top-24 z-30 mb-12">
              <div className="glass-card p-2 rounded-full border-white/60 bg-white/40 backdrop-blur-xl shadow-premium flex items-center justify-between">
                <div className="flex gap-2">
                  {[
                    { id: "products", label: "Inventory", icon: Package },
                    { id: "about", label: "Brand Story", icon: Shield },
                    { id: "reviews", label: "Intel", icon: MessageCircle },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                        activeTab === tab.id
                          ? "bg-taja-primary text-white shadow-emerald"
                          : "text-gray-400 hover:text-taja-secondary hover:bg-white/40"
                      )}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 pr-4">
                  <div className="h-8 w-px bg-gray-100 hidden sm:block" />
                  <div className="flex border border-gray-100 rounded-full overflow-hidden p-1 bg-white/40">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        viewMode === "grid" ? "bg-taja-secondary text-white shadow-sm" : "text-gray-400 hover:bg-white/50"
                      )}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        viewMode === "list" ? "bg-taja-secondary text-white shadow-sm" : "text-gray-400 hover:bg-white/50"
                      )}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-12">
              {/* Sidebar: Intelligence Panel */}
              <aside className="lg:col-span-1 space-y-10">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-10"
                >
                  {/* Shop Protocol Details */}
                  <div className="glass-card p-10 rounded-[2.5rem] border-white/80 bg-white/20 space-y-8">
                    <div className="space-y-1">
                      <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Operational Metrics</h3>
                      <div className="h-1 w-12 bg-taja-primary rounded-full"></div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-gray-500 font-bold text-xs">
                          <Package className="h-4 w-4 text-taja-primary/60" />
                          <span>SKUs</span>
                        </div>
                        <span className="font-black text-taja-secondary">{products.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-gray-500 font-bold text-xs">
                          <CheckCircle className="h-4 w-4 text-taja-primary/60" />
                          <span>Trust Score</span>
                        </div>
                        <span className="font-black text-taja-secondary">A+ Elite</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-gray-500 font-bold text-xs">
                          <Shield className="h-4 w-4 text-taja-primary/60" />
                          <span>Status</span>
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-emerald-50 text-taja-primary font-black text-[9px] uppercase tracking-widest border border-taja-primary/10">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Policies / Protocols */}
                  {shop.settings?.returnPolicy && (
                    <div className="glass-card p-10 rounded-[2.5rem] border-white/80 bg-white/20 space-y-8">
                      <div className="space-y-1">
                        <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Brand Protocols</h3>
                        <div className="h-1 w-12 bg-taja-primary rounded-full"></div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-taja-secondary">
                            <Shield className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Return Policy</span>
                          </div>
                          <p className="text-xs font-medium text-gray-500 leading-relaxed border-l-2 border-emerald-100 pl-4 py-1">
                            {shop.settings.returnPolicy}
                          </p>
                        </div>

                        {shop.settings.responseTime && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-taja-secondary">
                              <Star className="h-4 w-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Response Time</span>
                            </div>
                            <p className="text-xs font-black text-taja-primary uppercase tracking-widest bg-taja-primary/5 px-4 py-2 rounded-xl border border-taja-primary/10">
                              {shop.settings.responseTime.replace(/-/g, " ")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Social Integration */}
                  {(shop.socialLinks?.instagram || shop.socialLinks?.whatsapp) && (
                    <div className="glass-card p-10 rounded-[2.5rem] border-white/80 bg-white/20 space-y-8">
                      <div className="space-y-1">
                        <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Neural Links</h3>
                        <div className="h-1 w-12 bg-taja-primary rounded-full"></div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {shop.socialLinks?.instagram && (
                          <a
                            href={getInstagramUrl(shop.socialLinks.instagram!)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between group p-4 rounded-2xl border border-gray-100 bg-white/40 hover:bg-taja-primary hover:text-white transition-all duration-500"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 group-hover:bg-white/20 group-hover:text-white transition-colors">
                                <Instagram className="h-4 w-4" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">Instagram</span>
                            </div>
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                          </a>
                        )}
                        {shop.socialLinks?.whatsapp && (
                          <a
                            href={getWhatsAppUrl(shop.socialLinks.whatsapp!)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between group p-4 rounded-2xl border border-gray-100 bg-white/40 hover:bg-green-500 hover:text-white transition-all duration-500"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-xl bg-green-50 flex items-center justify-center text-green-500 group-hover:bg-white/20 group-hover:text-white transition-colors">
                                <Phone className="h-4 w-4" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
                            </div>
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </aside>

              {/* Main Display: Intelligence Feed */}
              <main className="lg:col-span-3 pb-24">
                <AnimatePresence mode="wait">
                  {activeTab === "products" && (
                    <motion.div
                      key="products"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-12"
                    >
                      <div className="flex items-end justify-between border-b border-gray-100 pb-8">
                        <div className="space-y-1">
                          <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">Current Inventory</h2>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Architecture: Total {products.length} Units</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort Protocol:</span>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-taja-primary focus:outline-none cursor-pointer"
                          >
                            <option value="recent">Recent Sync</option>
                            <option value="price-low">Value Ascending</option>
                            <option value="price-high">Value Descending</option>
                          </select>
                        </div>
                      </div>

                      {sortedProducts.length > 0 ? (
                        <div
                          className={cn(
                            viewMode === "grid"
                              ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8"
                              : "space-y-6"
                          )}
                        >
                          {sortedProducts.map((product, idx) => (
                            <motion.div
                              key={product._id}
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                              <ProductCard product={product} />
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="glass-card p-32 rounded-[3rem] border-white/80 bg-white/20 text-center space-y-8">
                          <div className="h-24 w-24 rounded-full bg-gray-50 flex items-center justify-center mx-auto opacity-50">
                            <Package className="h-10 w-10 text-gray-300" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-taja-secondary tracking-tighter">Inventory Depleted</h3>
                            <p className="text-sm font-medium text-gray-400">The intelligence hub has no current items to display.</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "about" && (
                    <motion.div
                      key="about"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-12"
                    >
                      <div className="space-y-1 border-b border-gray-100 pb-8">
                        <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">Brand Story</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Architecture: Founders Intent</p>
                      </div>

                      <div className="glass-card p-12 md:p-16 rounded-[3rem] border-white/80 bg-white/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-taja-primary/5 blur-3xl -z-10 group-hover:scale-110 transition-transform duration-1000" />

                        <div className="relative z-10 space-y-10">
                          <div className="flex items-center gap-6">
                            <div className="h-1 w-20 bg-taja-primary rounded-full"></div>
                            <span className="text-[10px] font-black text-taja-primary uppercase tracking-[0.4em]">The Vision</span>
                          </div>

                          <div className="space-y-12 max-w-3xl">
                            {shop.description ? (
                              <p className="text-2xl font-black text-taja-secondary tracking-tight leading-relaxed italic border-l-4 border-taja-primary/20 pl-10">
                                "{shop.description}"
                              </p>
                            ) : (
                              <p className="text-xl font-medium text-gray-500 leading-relaxed italic border-l-4 border-taja-primary/20 pl-10">
                                This elite brand is currently crafting its narrative. Stay synchronized for incoming data.
                              </p>
                            )}

                            <div className="grid md:grid-cols-2 gap-8">
                              <div className="p-8 rounded-3xl bg-white/40 border border-white/60 space-y-4">
                                <Shield className="h-8 w-8 text-taja-primary" />
                                <h4 className="text-lg font-black text-taja-secondary">Security Protocol</h4>
                                <p className="text-sm font-medium text-gray-500">Every transaction within this shop is governed by Taja's elite escrow infrastructure.</p>
                              </div>
                              <div className="p-8 rounded-3xl bg-white/40 border border-white/60 space-y-4">
                                <Zap className="h-8 w-8 text-taja-primary" />
                                <h4 className="text-lg font-black text-taja-secondary">Rapid Dispatch</h4>
                                <p className="text-sm font-medium text-gray-500">Logistics are unified across all major Nigerian hubs for world-class delivery speeds.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "reviews" && (
                    <motion.div
                      key="reviews"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-12"
                    >
                      <div className="space-y-1 border-b border-gray-100 pb-8">
                        <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">Verified Feedback</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intelligence: Global Network Intel</p>
                      </div>

                      <div className="glass-card p-32 rounded-[3rem] border-white/80 bg-white/20 text-center space-y-10 relative overflow-hidden">
                        <div className="absolute inset-0 motif-blanc opacity-20" />
                        <div className="relative z-10 space-y-8">
                          <div className="h-24 w-24 rounded-[2rem] bg-taja-light/30 flex items-center justify-center mx-auto ring-4 ring-taja-primary/5">
                            <Star className="h-10 w-10 text-taja-primary" />
                          </div>
                          <div className="space-y-4 max-w-md mx-auto">
                            <h3 className="text-3xl font-black text-taja-secondary tracking-tighter leading-none">Intelligence Gathering in Progress</h3>
                            <p className="text-sm font-medium text-gray-400 leading-relaxed">Wait for more verified transactions to populate this field. Current trust rating is based on owner credentials.</p>
                          </div>
                          <Button
                            className="rounded-full px-10 h-14 font-black uppercase tracking-widest text-[10px] shadow-premium"
                            onClick={() => setActiveTab("products")}
                          >
                            Explore Inventory First
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </main>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}
