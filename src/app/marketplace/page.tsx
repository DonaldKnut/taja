"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, Grid, List, Menu, X, Sparkles, ArrowRight, Zap, TrendingUp, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product";
import { Container } from "@/components/layout";
import { useMarketplaceFeed } from "@/hooks/useMarketplaceFeed";
import { useAuth } from "@/contexts/AuthContext";
import { AuthEntryModal } from "@/components/auth/AuthEntryModal";
import { trackPageView, trackEvent } from "@/lib/analytics";
import { motion, AnimatePresence } from "framer-motion";

import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants/categories";

type ViewMode = "grid" | "list";

type Shop = {
  _id: string;
  shopSlug: string;
  shopName: string;
  logo?: string;
  categories?: string[];
  isVerified?: boolean;
};

const fallbackImage = "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png";

const RecommendedShopCard = ({ shop }: { shop: Shop }) => {
  const logo = shop.logo || fallbackImage;
  return (
    <Link
      href={`/shop/${shop.shopSlug}`}
      className="glass-card group flex items-center gap-4 p-4 rounded-2xl border-white/60 shadow-premium hover:shadow-premium-hover hover:-translate-y-1 transition-all"
      onClick={() => trackEvent({ name: "recommended_shop_click", properties: { shopId: shop._id, shopSlug: shop.shopSlug } })}
    >
      <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-taja-light bg-white shadow-sm shrink-0">
        <Image src={logo} alt={shop.shopName} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="56px" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-black text-taja-secondary tracking-tight truncate group-hover:text-taja-primary transition-colors">{shop.shopName}</p>
          {shop.isVerified && <Sparkles className="h-3 w-3 text-taja-primary shrink-0" />}
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
          {shop.categories?.slice(0, 1).join(" • ") || "Elite Partner"}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-taja-primary group-hover:translate-x-1 transition-all shrink-0" />
    </Link>
  );
};

function MarketplaceContent() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const feed = useMarketplaceFeed({
    category: selectedCategory || undefined,
  });

  const displayedProducts = useMemo(() => {
    if (!selectedCondition) return feed.products;
    return feed.products.filter((product) => product.condition === selectedCondition);
  }, [feed.products, selectedCondition]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard/marketplace");
      return;
    }
    trackPageView("marketplace_page", { isAuthenticated });
  }, [isAuthenticated, router]);

  const headline = isAuthenticated
    ? `Curated for ${user?.fullName?.split(" ")[0] ?? "you"}.`
    : "The Elite Standard of African Commerce.";

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 motif-blanc opacity-[0.3]"></div>
        <div className="absolute top-0 left-1/4 w-[60%] h-[40%] bg-taja-primary/5 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[50%] h-[50%] bg-taja-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="sticky top-0 z-50 glass-panel border-b border-white/40 backdrop-blur-xl">
        <Container size="lg" className="h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <Logo size="lg" variant="header" className="hover:opacity-80 transition-opacity" href="/" />
            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/marketplace" className="text-[10px] font-black text-taja-primary uppercase tracking-[0.25em]">Shopper Hub</Link>
              <Link href="/shops" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] hover:text-taja-secondary transition-colors">Elite Partners</Link>
              <Link href="/how-it-works" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] hover:text-taja-secondary transition-colors">Logistics Portal</Link>
            </nav>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search premium products..."
                className="w-full bg-taja-light/30 border-transparent rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:bg-white focus:border-taja-primary/20 focus:ring-0 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href={user?.role === "seller" ? "/seller/dashboard" : "/dashboard"}>
                <Button variant="outline" className="rounded-full px-6 text-[10px] font-black uppercase tracking-widest h-10">Terminal</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-1">
                <Button variant="ghost" onClick={() => setAuthModalOpen(true)} className="text-[10px] font-black uppercase tracking-widest hover:bg-taja-light">Sign In</Button>
                <Link href="/register">
                  <Button className="rounded-full px-6 text-[10px] font-black uppercase tracking-widest h-10 shadow-premium">Start Selling</Button>
                </Link>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-taja-secondary hover:text-taja-primary transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </Container>
      </header>

      <main className="relative z-10 pt-10 pb-20">
        <Container size="lg" className="px-4 sm:px-6 lg:px-8">
          {/* Enhanced Hero Banner */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative glass-panel rounded-[3rem] p-10 sm:p-14 overflow-hidden border-white/60 shadow-premium mb-12"
          >
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-50/50 to-transparent pointer-events-none hidden lg:block" />
            <div className="relative z-10 max-w-2xl space-y-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-taja-primary/10 border border-taja-primary/5 w-fit">
                <Zap className="w-3.5 h-3.5 text-taja-primary fill-taja-primary" />
                <span className="text-[10px] font-black text-taja-primary uppercase tracking-widest">Premium Shopper Hub</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-taja-secondary tracking-tighter leading-[0.9]">
                {headline}
              </h1>
              <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-xl">
                Experience Nigeria's most refined digital commerce. Verified merchants. Escrow security. Cinematic performance.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button className="rounded-full px-10 h-14 shadow-premium group">
                  <span className="font-black uppercase tracking-widest text-xs">Explore Curated</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <div className="flex items-center gap-6 px-4">
                  <div className="flex -space-x-3">
                    {[
                      "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/dele_mup0gl.png",
                      "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/LYNNPINNEDIT___mv5yne.jpg",
                      "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/Portrait____Cooperate_headshot_qfzmsr.jpg",
                      "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/sola_jbdewv.jpg"
                    ].map((src, i) => (
                      <div key={i} className="h-9 w-9 rounded-full border-4 border-white bg-gray-100 shadow-sm overflow-hidden">
                        <img src={src} alt="User" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-tight">
                    Join our <br /> Verified Buyers
                  </div>
                </div>
              </div>
            </div>

            {/* Visual element for hero */}
            <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-taja-light/30 rounded-full blur-[80px] pointer-events-none"></div>
          </motion.section>

          {/* Filters & View Toggle */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Browse by Category</h2>
              <div className="h-px flex-1 bg-gray-100 mx-6"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory("")}
                className={`text-[10px] font-black uppercase tracking-widest ${!selectedCategory ? "text-taja-primary" : "text-gray-400"}`}
              >
                All items
              </Button>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.label;
                return (
                  <button
                    key={cat.label}
                    onClick={() => setSelectedCategory(isSelected ? "" : cat.label)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl whitespace-nowrap border-2 transition-all duration-300 ${isSelected
                      ? "bg-taja-primary border-taja-primary text-white shadow-premium scale-105"
                      : "bg-white border-white shadow-premium hover:border-taja-primary/40 hover:-translate-y-1"
                      }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? "text-white" : "text-taja-primary"}`} />
                    <span className="text-xs font-black uppercase tracking-widest">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Filters & View Toggle */}
          <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
            <div className="flex flex-wrap items-center gap-4">
              <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-1 border-white/60 shadow-sm">
                <Button variant="ghost" size="sm" className="rounded-xl px-4 h-9 flex items-center gap-2 hover:bg-white transition-all">
                  <Filter className="w-3.5 h-3.5 text-taja-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Refine</span>
                </Button>
                <div className="w-px h-4 bg-gray-100 mx-1"></div>

                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-taja-secondary focus:ring-0 cursor-pointer pr-8 sm:block hidden"
                >
                  <option value="">Any Condition</option>
                  <option value="new">Pristine</option>
                  <option value="like-new">Near Mint</option>
                  <option value="good">Good</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mr-2">
                Displaying {displayedProducts.length} Premium items
              </div>
              <div className="glass-panel p-1 rounded-xl flex items-center gap-1 border-white/60 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-taja-primary text-white shadow-premium" : "text-gray-400 hover:text-taja-secondary"}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-taja-primary text-white shadow-premium" : "text-gray-400 hover:text-taja-secondary"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Product Feed Grid */}
          <section className="relative min-h-[400px]">
            <AnimatePresence mode="popLayout">
              {feed.loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="glass-card animate-pulse rounded-3xl p-4 border-white/60 space-y-4">
                      <div className="aspect-square bg-gray-50 rounded-2xl"></div>
                      <div className="h-4 bg-gray-50 w-2/3 rounded-full"></div>
                      <div className="h-3 bg-gray-50 w-1/3 rounded-full"></div>
                    </div>
                  ))}
                </motion.div>
              ) : displayedProducts.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`grid gap-8 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 max-w-4xl mx-auto"}`}
                >
                  {displayedProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-panel rounded-[3rem] p-20 text-center border-white/60"
                >
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="h-20 w-20 rounded-full bg-taja-light flex items-center justify-center mx-auto mb-6">
                      <Search className="w-8 h-8 text-taja-primary opacity-20" />
                    </div>
                    <h3 className="text-2xl font-black text-taja-secondary tracking-tight">No products found for this query</h3>
                    <p className="text-gray-400 font-medium text-sm">Our elite merchants are constantly uploading new inventory. Try adjusting your filters or check back later.</p>
                    <Button variant="outline" onClick={() => { setSelectedCategory(""); setSelectedCondition(""); }} className="rounded-full px-8">Reset Standards</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Shop Recommendations Sidebar Style */}
          {!feed.loading && feed.recommendedShops && feed.recommendedShops.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-28 space-y-8"
            >
              <div className="flex items-center justify-between px-2">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-taja-secondary tracking-tight flex items-center gap-2">
                    Elite Partners
                    <ShieldCheck className="w-5 h-5 text-taja-primary" />
                  </h2>
                  <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Top Nigerian Merchants performing with excellence.</p>
                </div>
                <Link href="/shops" className="text-[10px] font-black text-taja-primary uppercase tracking-[0.2em] border-b-2 border-taja-primary/10 hover:border-taja-primary transition-all pb-1">View All Guild Members</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {feed.recommendedShops.slice(0, 3).map((shop) => (
                  <RecommendedShopCard key={shop._id} shop={shop} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Final CTA / Pagination Replacement */}
          <div className="mt-32 text-center space-y-10">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-panel border-white/60 shadow-premium">
              <TrendingUp className="w-4 h-4 text-taja-primary" />
              <span className="text-[10px] font-black text-taja-secondary uppercase tracking-[0.25em]">Scaling Your Vision</span>
            </div>
            <h3 className="text-4xl font-black text-taja-secondary tracking-tighter max-w-2xl mx-auto leading-none">
              Found something incredible? <br />
              <span className="text-transparent bg-clip-text bg-gradient-taja">Seal the deal securely.</span>
            </h3>
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-12 h-16 shadow-premium hover:shadow-premium-hover transition-all"
                onClick={() => feed.refetch()}
              >
                {feed.loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-taja-primary border-t-transparent"></div>
                ) : (
                  <span className="font-black uppercase tracking-widest text-xs">Load More Arrivals</span>
                )}
              </Button>
            </div>
          </div>
        </Container>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/10 backdrop-blur-2xl lg:hidden"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl p-10 flex flex-col pt-16"
            >
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-8 right-8 p-2 text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-12">
                <Logo size="lg" variant="header" />
              </div>

              <span className="text-[10px] font-black text-taja-primary uppercase tracking-widest">Explore Products Feed</span>

              <nav className="flex flex-col gap-8">
                {[
                  { label: "Shopper Hub", href: "/marketplace", active: true },
                  { label: "Elite Partners", href: "/shops" },
                  { label: "Logistics Portal", href: "/how-it-works" },
                  { label: "Secure Payments", href: "/support" }
                ].map((link, i) => (
                  <Link key={i} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                    <span className={`text-xl font-black tracking-tight ${link.active ? 'text-taja-primary' : 'text-taja-secondary'}`}>
                      {link.label}
                    </span>
                  </Link>
                ))}
              </nav>

              <div className="mt-auto pt-10 border-t border-gray-100 flex flex-col gap-4">
                {isAuthenticated ? (
                  <Button onClick={() => { setMobileMenuOpen(false); router.push(user?.role === 'seller' ? '/seller/dashboard' : '/dashboard'); }} className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs">Seller Terminal</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => { setMobileMenuOpen(false); setAuthModalOpen(true); }} className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs">Sign In</Button>
                    <Button onClick={() => { setMobileMenuOpen(false); router.push('/register'); }} className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs">Join Hub</Button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthEntryModal open={authModalOpen && !isAuthenticated} onClose={() => setAuthModalOpen(false)} source="marketplace" />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-taja-primary"></div></div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
