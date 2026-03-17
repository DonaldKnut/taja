"use client";

import { useState, useEffect, useMemo } from "react";
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
  ChevronRight,
  User,
  DollarSign,
  ShoppingBag,
  ExternalLink,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ProductCard } from "@/components/product";
import { Container } from "@/components/layout";
import { shopsApi, api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { StructuredData } from "@/components/StructuredData";
import { generateShopStructuredData } from "@/lib/seo";
import { CartIcon } from "@/components/cart";

interface Shop {
  _id: string;
  shopName: string;
  shopSlug: string;
  description?: string;
  about?: string;
  logo?: string;
  banner?: string;
  categories?: string[];
  verification?: {
    isVerified: boolean;
    status?: string;
  };
  stats?: {
    averageRating: number;
    totalReviews?: number;
    reviewCount?: number;
    totalProducts: number;
    totalOrders?: number;
    totalRevenue?: number;
    followerCount?: number;
  };
  owner?: {
    _id?: string;
    fullName: string;
    avatar?: string;
    email?: string;
    isVerified?: boolean;
    createdAt?: string;
  };
  settings?: {
    returnPolicy?: string;
    responseTime?: string;
  };
  socialLinks?: {
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
    youtube?: string;
    linkedin?: string;
  };
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
  youtube?: string;
  linkedin?: string;
  products?: any[];
  createdAt?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

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
    const username = instagram.replace(/^@/, "").split("/").pop()?.split("?")[0] || "";
    if (instagram.startsWith("http")) return instagram;
    return `https://instagram.com/${username}`;
  };

  // Format TikTok URL
  const getTikTokUrl = (tiktok: string) => {
    if (!tiktok) return null;
    const username = tiktok.replace(/^@/, "").split("/").pop()?.split("?")[0] || "";
    if (tiktok.startsWith("http")) return tiktok;
    return `https://tiktok.com/@${username}`;
  };

  const tenureBadge = useMemo(() => {
    if (!shop) return { label: "Merchant", isNew: true };
    const createdAt = shop.createdAt ? new Date(shop.createdAt).getTime() : 0;
    const monthsActive = (Date.now() - createdAt) / (30 * 24 * 60 * 60 * 1000);
    const orders = shop.stats?.totalOrders ?? 0;
    const isNew = monthsActive < 3 || orders < 10;
    return { label: isNew ? "New Seller" : "Trusted Seller", isNew };
  }, [shop]);

  const shopStructuredData = useMemo(() => {
    if (!shop) return null;
    return generateShopStructuredData({
      name: shop.shopName,
      description: shop.description || shop.about || "",
      logo: shop.logo,
      url: `/shop/${shop.shopSlug}`,
      image: shop.banner || shop.logo,
      rating: shop.stats?.averageRating ? {
        value: shop.stats.averageRating,
        count: shop.stats.totalReviews || shop.stats.reviewCount || 0
      } : undefined,
    });
  }, [shop]);

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

  // Compute a simple catalog value as the sum of product base prices.
  const catalogValue = useMemo(
    () => products.reduce((sum, p: any) => sum + (p.price || 0), 0),
    [products]
  );

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="absolute inset-0 motif-blanc opacity-40" />
        <div className="relative text-center space-y-4">
          <div className="h-12 w-12 border-4 border-taja-primary/20 border-t-taja-primary rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Loading shop…</p>
        </div>
      </div>
    );
  }

  // ─── Error / Not Found ───
  if (error || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="absolute inset-0 motif-blanc opacity-20" />
        <div className="relative text-center max-w-md space-y-8 glass-card p-12 border-gray-100">
          <div className="h-20 w-20 rounded-3xl bg-taja-light flex items-center justify-center mx-auto">
            <Package className="h-10 w-10 text-taja-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">Shop Not Found</h2>
            <p className="text-sm font-medium text-gray-500">{error || "This shop doesn't seem to exist or may have been removed."}</p>
          </div>
          <Button onClick={() => router.push("/shops")} className="w-full rounded-full">
            Browse Other Shops
          </Button>
        </div>
      </div>
    );
  }

  // ─── Social links helper ───
  const socialLinks = [
    { key: "instagram", label: "Instagram", url: shop.socialLinks?.instagram ? getInstagramUrl(shop.socialLinks.instagram) : null, icon: Instagram },
    { key: "tiktok", label: "TikTok", url: shop.socialLinks?.tiktok ? getTikTokUrl(shop.socialLinks.tiktok) : null, icon: ExternalLink },
    { key: "whatsapp", label: "WhatsApp", url: shop.socialLinks?.whatsapp ? getWhatsAppUrl(shop.socialLinks.whatsapp) : null, icon: Phone },
    { key: "twitter", label: "Twitter / X", url: shop.socialLinks?.twitter?.startsWith("http") ? shop.socialLinks.twitter : (shop.socialLinks?.twitter ? `https://twitter.com/${shop.socialLinks.twitter.replace(/^@/, "")}` : null), icon: ExternalLink },
    { key: "facebook", label: "Facebook", url: shop.socialLinks?.facebook || null, icon: ExternalLink },
    { key: "website", label: "Website", url: shop.socialLinks?.website || null, icon: ExternalLink },
    { key: "youtube", label: "YouTube", url: shop.socialLinks?.youtube || null, icon: ExternalLink },
    { key: "linkedin", label: "LinkedIn", url: shop.socialLinks?.linkedin || null, icon: ExternalLink },
  ].filter((x) => x.url);

  const hasSocialLinks = socialLinks.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {shopStructuredData && <StructuredData data={shopStructuredData} />}
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-taja-primary/[0.04] via-emerald-500/[0.03] to-transparent blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-gradient-to-tr from-blue-500/[0.02] via-taja-primary/[0.02] to-transparent blur-[100px] rounded-full" />
        <div className="absolute inset-0 motif-blanc opacity-30" />
      </div>

      <div className="relative z-10">

        {/* ═══════════════════════════════════════════════
            HERO BANNER — Full-bleed cinematic header
        ═══════════════════════════════════════════════ */}
        <section className="relative h-[280px] sm:h-[340px] md:h-[400px]">
          {/* Sticky Back Button — Always available */}
          <div className="fixed top-6 left-6 z-[100]">
            <Link href="/marketplace">
              <Button
                variant="ghost"
                className="bg-taja-secondary/40 hover:bg-taja-secondary/60 backdrop-blur-xl text-white border-white/20 px-5 h-11 rounded-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group shadow-huge"
              >
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-sm">Back to Marketplace</span>
              </Button>
            </Link>
          </div>

          {/* Banner Image */}
          <div className="absolute inset-0">
            {shop.banner ? (
              <Image
                src={shop.banner}
                alt={shop.shopName}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-taja-secondary to-black" />
            )}
            {/* Dark cinematic overlay — keeps banner vivid, no white wash */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/10" />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            SHOP IDENTITY — Clean section below banner
        ═══════════════════════════════════════════════ */}
        <section className="relative z-20 bg-white border-b border-gray-100">
          <Container size="lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="py-8 md:py-10"
            >
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
                {/* Logo — pulls up into the banner */}
                <div className="relative -mt-20 md:-mt-24 group shrink-0">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-[1.8rem] border-4 border-white shadow-[0_8px_30px_-6px_rgba(0,0,0,0.15)] overflow-hidden bg-white group-hover:scale-[1.03] transition-transform duration-500">
                    {shop.logo ? (
                      <Image
                        src={shop.logo}
                        alt={shop.shopName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 112px, 128px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-taja-primary/10 to-emerald-500/10 flex items-center justify-center text-taja-primary font-black text-4xl italic">
                        {shop.shopName.charAt(0)}
                      </div>
                    )}
                  </div>
                  {shop.verification?.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-taja-primary text-white p-2 rounded-lg shadow-lg border-2 border-white">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                {/* Shop Info */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black text-taja-secondary tracking-tighter leading-none">
                      {shop.shopName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border",
                        tenureBadge.isNew ? "bg-amber-50 border-amber-200/60 text-amber-700" : "bg-emerald-50 border-emerald-200/60 text-emerald-700"
                      )}>
                        <Sparkles className="h-3 w-3" />
                        <span>{tenureBadge.label}</span>
                      </div>
                      {shop.stats?.averageRating != null && shop.stats.averageRating > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{Number(shop.stats.averageRating).toFixed(1)} rating</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Since {formatDate(shop.owner?.createdAt || shop.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500">
                        <Heart className="h-3 w-3" />
                        <span>{followers.toLocaleString()} {followers === 1 ? "follower" : "followers"}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-2xl line-clamp-2">
                    {shop.description || "Welcome to our shop — explore quality products and enjoy a trusted shopping experience."}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 shrink-0 items-center">
                  <Button
                    onClick={toggleFollow}
                    className={cn(
                      "rounded-full px-8 h-12 shadow-sm transition-all font-black uppercase tracking-widest text-[10px]",
                      isFollowing
                        ? "bg-white text-taja-secondary border border-gray-200 hover:bg-gray-50"
                        : "bg-taja-primary text-white hover:bg-emerald-600 hover:shadow-lg"
                    )}
                  >
                    <Heart className={cn("h-4 w-4 mr-2", isFollowing ? "fill-current text-red-500" : "")} />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>

                  {(shop.owner as any)?._id && (
                    <Link href={`/chat?seller=${(shop.owner as any)._id}&shopId=${shop._id}`}>
                      <Button
                        variant="outline"
                        className="rounded-full px-8 h-12 border-gray-200 text-taja-secondary font-black uppercase tracking-widest text-[10px] hover:bg-taja-primary/10 hover:border-taja-primary/30 hover:text-taja-primary"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message shop
                      </Button>
                    </Link>
                  )}

                  {shop.socialLinks?.whatsapp && (
                    <Button
                      variant="outline"
                      className="rounded-full px-8 h-12 border-gray-200 text-taja-secondary font-black uppercase tracking-widest text-[10px] hover:bg-green-50"
                      onClick={() => {
                        const url = getWhatsAppUrl(shop.socialLinks!.whatsapp!);
                        if (url) window.open(url, "_blank");
                      }}
                    >
                      <Phone className="h-4 w-4 mr-2 text-green-600" />
                      WhatsApp
                    </Button>
                  )}

                  {/* Cart access from shop page */}
                  <div className="hidden sm:flex">
                    <CartIcon
                      className="p-2 rounded-full border border-gray-200 bg-white text-taja-secondary hover:text-taja-primary hover:border-taja-primary/20 shadow-sm transition-colors"
                      iconClassName="h-5 w-5"
                      badgeClassName="!h-4 !w-4 !text-[9px] !-top-0.5 !-right-0.5 bg-taja-primary text-white border-2 border-white"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </Container>
        </section>

        {/* ═══════════════════════════════════════════════
            CONTENT AREA — Tabs + Products + Sidebar
        ═══════════════════════════════════════════════ */}
        <div className="pt-0">
          <Container size="lg">

            {/* Tab Navigation Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="sticky top-24 z-30 mb-12"
            >
              <div className="glass-card p-2 rounded-full border-white/60 bg-white/50 backdrop-blur-xl shadow-[0_4px_30px_-4px_rgba(0,0,0,0.06)] flex items-center justify-between">
                <div className="flex gap-1.5">
                  {[
                    { id: "products", label: "Products", icon: Package },
                    { id: "about", label: "About", icon: Shield },
                    { id: "reviews", label: "Reviews", icon: MessageCircle },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-5 sm:px-7 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                        activeTab === tab.id
                          ? "bg-taja-secondary text-white shadow-lg"
                          : "text-gray-400 hover:text-taja-secondary hover:bg-white/60"
                      )}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pr-3">
                  <div className="h-7 w-px bg-gray-200/60 hidden sm:block" />
                  <div className="flex border border-gray-100 rounded-full overflow-hidden p-0.5 bg-white/60">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        viewMode === "grid" ? "bg-taja-secondary text-white" : "text-gray-400 hover:bg-gray-50"
                      )}
                    >
                      <Grid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        viewMode === "list" ? "bg-taja-secondary text-white" : "text-gray-400 hover:bg-gray-50"
                      )}
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col gap-12">

              {/* ─── Shop Details Header row ─── */}
              <aside className="w-full space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid lg:grid-cols-2 gap-6"
                >
                  {/* Seller Card & Shop Stats Combined */}
                  <div className="glass-card p-6 md:p-8 rounded-[2rem] border-white/80 bg-white/30 flex flex-col md:flex-row gap-8 justify-between">
                    {/* Left: Seller info */}
                    <div className="space-y-6 flex-1">
                      <div className="space-y-1">
                        <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em] flex items-center gap-2">
                          <User className="h-3.5 w-3.5" /> Seller
                        </h3>
                        <div className="h-0.5 w-10 bg-taja-primary/30 rounded-full" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-taja-primary/10 to-emerald-500/10 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                          {shop.owner?.avatar ? (
                            <Image src={shop.owner.avatar} alt={shop.owner.fullName} width={56} height={56} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-black text-taja-primary">
                              {shop.owner?.fullName?.charAt(0) || shop.shopName?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-taja-secondary truncate">{shop.owner?.fullName || "Shop Owner"}</p>
                          <p className="text-[10px] font-bold text-gray-400 truncate">{shop.shopName}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {(shop.owner as any)?._id && (
                          <Link href={`/chat?seller=${(shop.owner as any)._id}&shopId=${shop._id}`}>
                            <Button className="rounded-xl h-10 font-black uppercase tracking-widest text-[10px] gap-2 px-5">
                              <MessageCircle className="h-4 w-4" />
                              Message seller
                            </Button>
                          </Link>
                        )}
                        {/* Social Links Mini-Grid */}
                        {hasSocialLinks && (
                          <div className="flex flex-wrap items-center gap-2">
                            {socialLinks.map(({ label, url, icon: Icon }) => (
                              <a
                                key={label}
                                href={url!}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={label}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200/60 bg-white/80 hover:bg-taja-primary hover:text-white hover:border-taja-primary/20 transition-all duration-300"
                              >
                                <Icon className="h-4 w-4" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Shop Stats */}
                    <div className="flex-1 space-y-4 md:border-l md:border-gray-100 md:pl-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-500 font-bold text-[10px] uppercase">
                            <Package className="h-3 w-3 text-taja-primary/50" />
                            <span>Products</span>
                          </div>
                          <span className="text-xl font-black text-taja-secondary block">{products.length}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-500 font-bold text-[10px] uppercase">
                            <ShoppingBag className="h-3 w-3 text-taja-primary/50" />
                            <span>Orders</span>
                          </div>
                          <span className="text-xl font-black text-taja-secondary block">{shop.stats?.totalOrders ?? 0}</span>
                          <p className="text-[9px] text-gray-400 font-medium">
                            Includes all orders placed; revenue only counts confirmed ones.
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-500 font-bold text-[10px] uppercase">
                            <CheckCircle className="h-3 w-3 text-taja-primary/50" />
                            <span>Status</span>
                          </div>
                          <span
                            className={cn(
                              "px-3 py-1 mt-1 inline-block rounded-lg font-black text-[9px] uppercase tracking-widest border",
                              shop.verification?.isVerified
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                : "bg-gray-50 text-gray-500 border-gray-200/60"
                            )}
                          >
                            {shop.verification?.isVerified ? "Verified" : "Pending"}
                          </span>
                        </div>
                        {(shop.stats?.totalRevenue ?? 0) > 0 || catalogValue > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-500 font-bold text-[10px] uppercase">
                              <TrendingUp className="h-3 w-3 text-taja-primary/50" />
                              <span>
                                {(shop.stats?.totalRevenue ?? 0) > 0 ? "Revenue" : "Catalog value"}
                              </span>
                            </div>
                            <span className="text-xl font-black text-taja-secondary block">
                              ₦
                              {(
                                ((shop.stats?.totalRevenue ?? 0) > 0
                                  ? shop.stats!.totalRevenue!
                                  : catalogValue) / 1000
                              ).toFixed(0)}
                              k+
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Policies */}
                  {shop.settings?.returnPolicy && (
                    <div className="glass-card p-6 md:p-8 rounded-[2rem] border-white/80 bg-white/30 space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Shop Policies</h3>
                        <div className="h-0.5 w-10 bg-taja-primary/30 rounded-full" />
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-taja-secondary">
                            <Shield className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Return Policy</span>
                          </div>
                          <p className="text-xs font-medium text-gray-500 leading-relaxed border-l-2 border-emerald-200 pl-4 py-1">
                            {shop.settings.returnPolicy}
                          </p>
                        </div>

                        {shop.settings.responseTime && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-taja-secondary">
                              <Clock className="h-4 w-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Response Time</span>
                            </div>
                            <p className="text-xs font-black text-taja-primary uppercase tracking-widest bg-taja-primary/5 px-4 py-2 rounded-xl border border-taja-primary/10 inline-block">
                              {shop.settings.responseTime.replace(/-/g, " ")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </aside>

              {/* ─── Main Content ─── */}
              <main className="w-full pb-24">
                <AnimatePresence mode="wait">

                  {/* Products Tab */}
                  {activeTab === "products" && (
                    <motion.div
                      key="products"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-10"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-100 pb-8">
                        <div className="space-y-1">
                          <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">Products</h2>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{products.length} {products.length === 1 ? "item" : "items"} available</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:inline">Sort by:</span>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-taja-secondary focus:outline-none focus:ring-2 focus:ring-taja-primary/20 cursor-pointer"
                          >
                            <option value="recent">Newest first</option>
                            <option value="price-low">Price: low to high</option>
                            <option value="price-high">Price: high to low</option>
                          </select>
                        </div>
                      </div>

                      {sortedProducts.length > 0 ? (
                        <div
                          className={cn(
                            viewMode === "grid"
                              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6"
                              : "space-y-6"
                          )}
                        >
                          {sortedProducts.map((product, idx) => (
                            <motion.div
                              key={product._id}
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.04, duration: 0.5 }}
                            >
                              <ProductCard product={product} />
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="glass-card p-20 sm:p-28 rounded-[2.5rem] border-white/80 bg-white/30 text-center space-y-6">
                          <div className="h-20 w-20 rounded-[1.5rem] bg-gray-50 flex items-center justify-center mx-auto">
                            <Package className="h-9 w-9 text-gray-300" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-taja-secondary tracking-tighter">No Products Yet</h3>
                            <p className="text-sm font-medium text-gray-400 max-w-sm mx-auto">This shop hasn't added any products yet. Check back soon!</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* About Tab */}
                  {activeTab === "about" && (
                    <motion.div
                      key="about"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-10"
                    >
                      <div className="space-y-1 border-b border-gray-100 pb-8">
                        <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">About This Shop</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">The story behind {shop.shopName}</p>
                      </div>

                      <div className="glass-card p-10 md:p-14 rounded-[2.5rem] border-white/80 bg-white/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-taja-primary/[0.03] blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-1000" />

                        <div className="relative z-10 space-y-10">
                          <div className="flex items-center gap-5">
                            <div className="h-0.5 w-16 bg-taja-primary/30 rounded-full" />
                            <span className="text-[10px] font-black text-taja-primary uppercase tracking-[0.4em]">Our Story</span>
                          </div>

                          <div className="space-y-10 max-w-3xl">
                            {(shop.about || shop.description) ? (
                              <>
                                {shop.about && (
                                  <div className="prose prose-lg max-w-none">
                                    <p className="text-base font-medium text-gray-600 leading-[1.8] whitespace-pre-line border-l-[3px] border-taja-primary/20 pl-8">
                                      {shop.about}
                                    </p>
                                  </div>
                                )}
                                {shop.description && (
                                  <p className="text-xl md:text-2xl font-black text-taja-secondary tracking-tight leading-relaxed italic border-l-[3px] border-taja-primary/20 pl-8">
                                    "{shop.description}"
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-lg font-medium text-gray-400 leading-relaxed italic border-l-[3px] border-gray-200 pl-8">
                                This shop hasn't shared their story yet. Browse their products to discover what makes them special.
                              </p>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="p-7 rounded-2xl bg-white/50 border border-white/70 space-y-3 hover:shadow-sm transition-shadow">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                  <Shield className="h-5 w-5 text-emerald-600" />
                                </div>
                                <h4 className="text-sm font-black text-taja-secondary">Secure Transactions</h4>
                                <p className="text-xs font-medium text-gray-500 leading-relaxed">Every purchase is protected by Taja's escrow system — your money is safe until you confirm delivery.</p>
                              </div>
                              <div className="p-7 rounded-2xl bg-white/50 border border-white/70 space-y-3 hover:shadow-sm transition-shadow">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                  <Zap className="h-5 w-5 text-blue-600" />
                                </div>
                                <h4 className="text-sm font-black text-taja-secondary">Fast Delivery</h4>
                                <p className="text-xs font-medium text-gray-500 leading-relaxed">Reliable shipping across major cities in Nigeria with real-time tracking on every order.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Reviews Tab */}
                  {activeTab === "reviews" && (
                    <motion.div
                      key="reviews"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-10"
                    >
                      <div className="space-y-1 border-b border-gray-100 pb-8">
                        <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">Customer Reviews</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">What buyers are saying</p>
                      </div>

                      <div className="glass-card p-16 sm:p-24 rounded-[2.5rem] border-white/80 bg-white/30 text-center space-y-8 relative overflow-hidden">
                        <div className="absolute inset-0 motif-blanc opacity-10" />
                        <div className="relative z-10 space-y-8">
                          <div className="h-20 w-20 rounded-[1.5rem] bg-amber-50 flex items-center justify-center mx-auto ring-4 ring-amber-100/50">
                            <Star className="h-9 w-9 text-amber-400" />
                          </div>
                          <div className="space-y-3 max-w-md mx-auto">
                            <h3 className="text-2xl font-black text-taja-secondary tracking-tighter">No Reviews Yet</h3>
                            <p className="text-sm font-medium text-gray-400 leading-relaxed">Reviews will appear here once customers start sharing their experience. Be the first to buy and leave a review!</p>
                          </div>
                          <Button
                            className="rounded-full px-10 h-13 font-black uppercase tracking-widest text-[10px] shadow-lg"
                            onClick={() => setActiveTab("products")}
                          >
                            Browse Products
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
