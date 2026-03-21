"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Store,
  Star,
  CheckCircle,
  Search,
  Grid,
  Plus,
  Loader2,
  Sparkles,
  TrendingUp,
  Users,
  Package,
  MapPin,
  Heart,
  Menu,
  X,
  Zap,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { shopsApi, api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout";

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
  };
  owner?: {
    fullName: string;
    avatar?: string;
    isVerified: boolean;
  };
  settings?: {
    isActive: boolean;
  };
}

export default function ShopsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchShops();
  }, [page, searchQuery]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await shopsApi.getAll({
        page,
        limit: 20,
        search: searchQuery || undefined,
      });

      if (response.success) {
        const newShops = response.data.shops || [];
        if (page === 1) {
          setShops(newShops);
        } else {
          setShops((prev) => [...prev, ...newShops]);
        }
        setHasMore(response.data.pagination.page < response.data.pagination.pages);

        if (newShops.length === 0 && page === 1 && !searchQuery) {
          generateEmptyStateMessage();
        }
      }
    } catch (error: any) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  const generateEmptyStateMessage = async () => {
    try {
      setGeneratingMessage(true);
      const prompt = `Generate an inspiring and encouraging message for when there are no shops yet on a Nigerian e-commerce marketplace. The message should be friendly, motivational, and encourage users to be the first to create a shop. Keep it cinematic and elite.`;

      const response = await api("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });

      if (response.text) {
        setEmptyStateMessage(response.text);
      }
    } catch (error) {
      console.error("Error generating AI message:", error);
      setEmptyStateMessage(
        "The archive is currently pristine. Be the pioneer merchant to define the new standard of African commerce."
      );
    } finally {
      setGeneratingMessage(false);
    }
  };

  const handleCreateShop = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      toast.error("Authentication required to create a shop");
      router.push("/login?redirect=/shops/new");
      return;
    }
    router.push("/shops/new");
  };

  const ShopCard = ({ shop, index }: { shop: Shop; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/shop/${shop.shopSlug}`} className="group block h-full">
        <div className="relative glass-panel rounded-[2.5rem] overflow-hidden border-white/60 shadow-premium hover:shadow-premium-hover transition-all duration-700 hover:-translate-y-2 h-full flex flex-col">
          {/* Banner */}
          <div className="relative h-40">
            {shop.banner ? (
              <Image
                src={shop.banner}
                alt={shop.shopName}
                fill
                className="object-cover transition-transform duration-[2s] group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-taja-secondary via-slate-800 to-black" />
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

            {/* Verification Badge Float */}
            {shop.verification?.isVerified && (
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-emerald-500/90 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1 shadow-lg ring-1 ring-white/20">
                <CheckCircle className="w-3 h-3" />
                Verified Merchant
              </div>
            )}

            {/* Logo - Centered Overlay Style */}
            <div className="absolute -bottom-10 left-8">
              <div className="w-20 h-20 rounded-3xl border-4 border-white shadow-2xl overflow-hidden bg-white ring-4 ring-black/5">
                {shop.logo ? (
                  <Image src={shop.logo} alt={shop.shopName} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full bg-gradient-taja flex items-center justify-center text-white font-black text-2xl">
                    {shop.shopName.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <CardContent className="pt-14 pb-8 px-8 flex-1 flex flex-col">
            <div className="space-y-4 mb-6">
              <h3 className="text-xl font-black text-taja-secondary tracking-tight group-hover:text-taja-primary transition-colors">
                {shop.shopName}
              </h3>

              {shop.description && (
                <p className="text-sm font-medium text-gray-400 line-clamp-2 leading-relaxed">
                  {shop.description}
                </p>
              )}
            </div>

            <div className="mt-auto space-y-5">
              <div className="flex items-center justify-between border-t border-gray-50 pt-5">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Products</span>
                    <span className="text-sm font-black text-taja-secondary">{shop.stats?.totalProducts || 0}</span>
                  </div>
                  {shop.stats?.averageRating ? (
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-black text-taja-secondary">{shop.stats.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-taja-secondary group-hover:bg-taja-primary group-hover:text-white transition-all duration-500">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              {shop.categories && shop.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {shop.categories.slice(0, 2).map((cat, idx) => (
                    <span key={idx} className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-white border border-gray-100 rounded-full text-gray-400">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Link>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <AppHeader />

      <main className="relative z-10 pt-10">
        <Container size="lg">
          {/* Cinematic Hero */}
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative glass-panel rounded-[3.5rem] p-12 md:p-20 overflow-hidden border-white/60 shadow-premium mb-16"
          >
            {/* Background Motifs */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-taja-primary/5 to-transparent"></div>
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-taja-primary/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-taja-primary/10 rounded-xl">
                  <Crown className="w-5 h-5 text-taja-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-taja-primary">Hub of Excellence</span>
              </div>

              <h1 className="text-4xl md:text-7xl font-black text-taja-secondary tracking-tighter leading-[0.85] mb-8">
                The Elite Standard of <br />
                <span className="text-transparent bg-clip-text bg-gradient-taja">African Commerce.</span>
              </h1>

              <p className="text-gray-400 font-medium text-lg md:text-xl leading-relaxed max-w-2xl mb-12">
                Experience Nigeria&apos;s most refined digital commerce. Verified merchants. Escrow security. Cinematic performance.
              </p>

              <div className="flex flex-wrap items-center gap-6">
                <Button
                  onClick={handleCreateShop}
                  className="rounded-full px-12 h-16 shadow-premium bg-gradient-to-r from-taja-primary to-emerald-700 group border-none"
                >
                  <span className="font-black uppercase tracking-widest text-xs">Establish Your Guild</span>
                  <Plus className="w-4 h-4 ml-3 group-hover:rotate-90 transition-transform" />
                </Button>

                <div className="relative group flex items-center lg:w-96">
                  <Search className="absolute left-6 h-5 w-5 text-gray-300 group-focus-within:text-taja-primary transition-colors" />
                  <Input
                    type="text"
                    placeholder="Locate verified shops..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-full h-16 pl-14 pr-8 bg-white border-transparent focus:border-taja-primary/20 shadow-sm text-sm font-bold placeholder:text-gray-300 transition-all font-inter"
                  />
                </div>
              </div>
            </div>

            {/* Stats Decoration */}
            <div className="absolute bottom-12 right-12 hidden lg:flex items-center gap-12 border-t border-gray-100 pt-8 mt-auto">
              <div className="text-center">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-300 mb-2">Verified Hubs</p>
                <p className="text-2xl font-black text-taja-secondary">1.2k+</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-300 mb-2">Active Trade</p>
                <p className="text-2xl font-black text-taja-secondary">₦240M+</p>
              </div>
            </div>
          </motion.section>

          {/* Feed Header */}
          <div className="flex items-center justify-between mb-10 px-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-taja-secondary uppercase tracking-[0.2em]">Curated Guild Registry</span>
              <div className="h-px w-20 bg-gray-100"></div>
            </div>
            {loading && shops.length > 0 && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-taja-primary" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanning Registry...</span>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {loading && shops.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 px-4"
              >
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="glass-panel animate-pulse rounded-[2.5rem] p-8 h-96 border-white/60 space-y-4">
                    <div className="h-32 bg-gray-50 rounded-2xl"></div>
                    <div className="h-6 bg-gray-50 w-2/3 rounded-full mt-10"></div>
                    <div className="h-10 bg-gray-50 w-full rounded-2xl"></div>
                  </div>
                ))}
              </motion.div>
            ) : shops.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto py-20 px-4"
              >
                <div className="glass-panel p-16 rounded-[3.5rem] border-white/60 shadow-premium text-center relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="h-24 w-24 rounded-3xl bg-taja-light flex items-center justify-center mx-auto mb-10 ring-8 ring-taja-primary/5">
                      <Store className="h-10 w-10 text-taja-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-taja-secondary tracking-tighter mb-6">
                      Registry Pristine.
                    </h2>

                    {generatingMessage ? (
                      <div className="flex flex-col items-center gap-4 mb-10">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-taja-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-taja-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-taja-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Curating Visionary Copy...</p>
                      </div>
                    ) : (
                      <p className="text-gray-400 font-medium text-lg mb-12 leading-relaxed italic">
                        &quot;{emptyStateMessage || "No ventures have been established here yet. Be the first to define this space."}&quot;
                      </p>
                    )}

                    <Button
                      onClick={handleCreateShop}
                      size="lg"
                      className="rounded-full px-12 h-16 shadow-premium font-black uppercase tracking-widest text-[10px]"
                    >
                      <Plus className="h-5 w-5 mr-3" />
                      Establish Your Hub
                    </Button>
                  </div>

                  <div className="absolute inset-0 bg-gradient-radial from-taja-primary/5 to-transparent pointer-events-none" />
                </div>
              </motion.div>
            ) : (
              <div className="space-y-16 pb-32">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 px-4">
                  {shops.map((shop, i) => (
                    <ShopCard key={shop._id} shop={shop} index={i} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex flex-col items-center gap-6">
                    <div className="h-1 w-20 bg-gray-50 rounded-full"></div>
                    <Button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={loading}
                      variant="outline"
                      className="rounded-full px-12 h-14 font-black uppercase tracking-widest text-[10px] border-gray-100 hover:border-taja-primary transition-all bg-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-3 animate-spin" />
                          Indexing...
                        </>
                      ) : (
                        "Reveal More Partners"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </Container>
      </main>
    </div>
  );
}
