"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Package,
  Edit,
  Trash2,
  Eye,
  Tag,
  ChevronDown,
  MoreVertical,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  Box,
  LayoutGrid,
  List,
  ChevronRight,
  AlertCircle,
  Clock,
  BoxSelect,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { api, sellerApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { ConfirmModal } from "@/components/modal/ConfirmModal";

interface SellerProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "out_of_stock" | "hidden";
  category: string;
  updatedAt: string;
  image: string;
  views: number;
  sales: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function SellerProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [filtered, setFiltered] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isUnderReview = user?.accountStatus === "under_review";
  const kycStatus = user?.kyc?.status;
  const kycPending =
    kycStatus === "not_started" ||
    kycStatus === "rejected" ||
    !kycStatus ||
    kycStatus === "pending";

  const [checkingShop, setCheckingShop] = useState(true);
  const [hasShop, setHasShop] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await api("/api/shops/my");
        if (cancelled) return;
        setHasShop(!!(response?.data || (response as any)?.shop));
      } catch {
        if (!cancelled) {
          setHasShop(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingShop(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const canAddProducts = !isUnderReview && !kycPending && hasShop;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await sellerApi.getProducts({ limit: 100 });

        if (response?.success && response?.data) {
          const productsArray = Array.isArray(response.data) ? response.data : response.data.products || [];
          const transformedProducts = productsArray.map((product: any) => ({
            id: product._id || product.id,
            title: product.title || product.name || "Unknown Product",
            price: product.price || 0,
            stock: product.inventory?.quantity || product.stock || 0,
            status: product.status || "draft",
            category: typeof product.category === 'object' ? product.category?.name : product.category || "Uncategorized",
            updatedAt: product.updatedAt || new Date().toISOString(),
            image: product.images?.[0] || product.image || "/placeholder-product.jpg",
            views: product.views || 0,
            sales: product.sales || 0,
          }));
          setProducts(transformedProducts);
        }
      } catch (error: any) {
        console.error("Failed to fetch products:", error);
        if (error?.status !== 401) toast.error("Connection Error: We're having trouble reaching your products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let list = products;
    if (search) {
      list = list.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
    }
    if (status !== "all") list = list.filter((p) => p.status === status);
    if (category !== "all") list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    setFiltered(list);
  }, [products, search, status, category]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await sellerApi.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Product removed successfully");
    } catch (error: any) {
      toast.error("Action failed: " + (error?.message || "Please try again later"));
    }
  };

  const getStatusDisplay = (s: SellerProduct["status"]) => {
    switch (s) {
      case "active":
        return { text: "Operational", class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
      case "draft":
        return { text: "Staging", class: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
      case "out_of_stock":
        return { text: "Depleted", class: "bg-red-500/10 text-red-500 border-red-500/20" };
      default:
        return { text: "Offline", class: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-taja-primary/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-taja-primary rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-[10px] font-black text-taja-primary uppercase tracking-[0.4em] animate-pulse">Loading your products...</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Remove this product from your catalogue?"
        description="It will be marked as deleted in your seller dashboard and hidden from buyers."
        confirmLabel="Yes, remove product"
        cancelLabel="Keep product"
        variant="danger"
        onConfirm={async () => {
          if (!confirmDeleteId) return;
          await handleDeleteProduct(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-10 pb-20 px-4 sm:px-10 py-10"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col lg:flex-row justify-between items-end gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black text-taja-secondary tracking-tighter uppercase italic">
              Your <span className="text-taja-primary">Products</span>
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 tracking-wide flex items-center gap-2">
            Managing <span className="text-taja-secondary font-black uppercase tracking-widest text-[10px]">{products.length} Products</span> • Live Inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-card flex p-1 border-white/60">
            <button onClick={() => setViewMode("list")} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-taja-primary text-white shadow-emerald' : 'text-gray-400 hover:text-gray-600'}`}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-taja-primary text-white shadow-emerald' : 'text-gray-400 hover:text-gray-600'}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <div className="h-8 w-px bg-white/40 mx-2" />

          {checkingShop ? (
            <div className="w-32 h-12 rounded-2xl bg-white/40 animate-pulse" />
          ) : !canAddProducts ? (
            <div className="glass-card px-6 py-3 border-amber-500/20 bg-amber-500/5 flex items-center gap-3 max-w-xs">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                {kycPending
                  ? "Complete verification to add products."
                  : !hasShop
                    ? "Set up your shop to add products."
                    : "Product creation is disabled while your account is under review."}
              </span>
            </div>
          ) : (
            <Link href="/seller/products/new">
              <Button className="rounded-2xl px-8 h-12 text-[11px] font-black uppercase tracking-[0.2em] shadow-premium hover:shadow-premium-hover transition-all group">
                <Plus className="mr-3 h-4 w-4 group-hover:rotate-90 transition-transform" />
                New Product
                <Sparkles className="ml-3 h-4 w-4 text-white/50" />
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Control Filters */}
      <motion.div variants={item} className="glass-panel p-6 border-white/60 rounded-[32px] grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-taja-primary transition-colors" />
          <Input
            placeholder="Search Products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-14 h-14 w-full glass-card border-white/60 focus:border-taja-primary/40 focus:ring-0 transition-all text-sm font-medium tracking-wide"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="pl-12 w-full h-14 glass-card border-white/60 text-[10px] font-black uppercase tracking-widest focus:ring-0 appearance-none cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="active">Operational</option>
              <option value="draft">Staging</option>
              <option value="out_of_stock">Depleted</option>
            </select>
          </div>
          <div className="relative">
            <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="pl-12 w-full h-14 glass-card border-white/60 text-[10px] font-black uppercase tracking-widest focus:ring-0 appearance-none cursor-pointer"
            >
              <option value="all">Categories</option>
              <option value="fashion">Fashion</option>
              <option value="electronics">Electronics</option>
              <option value="beauty">Beauty</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className={`h-14 flex-1 rounded-[20px] border-white/60 text-[10px] font-black uppercase tracking-widest ${selected.size > 0 ? 'bg-taja-primary text-white border-taja-primary shadow-emerald' : ''}`}>
            <Tag className="mr-2 h-4 w-4" /> Bulk Actions ({selected.size})
          </Button>
          {selected.size > 0 && (
            <Button variant="outline" onClick={() => setSelected(new Set())} className="h-14 w-14 rounded-[20px] border-white/60 text-red-500 hover:bg-red-500/5">
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-24 border-white/60 text-center border-dashed rounded-[40px]"
          >
            <Box className="h-20 w-20 text-taja-light/30 mx-auto mb-8 animate-pulse" />
            <h3 className="text-3xl font-black text-taja-secondary tracking-tight mb-4">No Products Found</h3>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">Your catalog is currently empty. Add your first product to get started.</p>
            {!isUnderReview && (
              <Link href="/seller/products/new">
                <Button className="rounded-full px-10 h-14 text-[11px] font-black uppercase tracking-[0.2em] shadow-premium">
                  Add your first product
                </Button>
              </Link>
            )}
          </motion.div>
        ) : viewMode === 'list' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Table Header Row */}
            <div className="hidden lg:flex items-center px-10 py-4 text-[10px] font-black text-taja-primary uppercase tracking-[0.3em] opacity-40">
              <div className="w-12">
                <input type="checkbox" checked={selected.size === filtered.length} onChange={toggleSelectAll} className="h-4 w-4 rounded-md border-white/60 bg-white/20" />
              </div>
              <div className="flex-1">Product Information</div>
              <div className="w-40">Price</div>
              <div className="w-32">Stock</div>
              <div className="w-40">Status</div>
              <div className="w-48 text-right">Actions</div>
            </div>

            {filtered.map((product) => {
              const statusDisplay = getStatusDisplay(product.status);
              return (
                <motion.div
                  key={product.id}
                  variants={item}
                  className="glass-card p-4 lg:px-10 lg:py-6 border-white/60 hover:shadow-premium group transition-all duration-300 flex flex-col lg:flex-row lg:items-center gap-6 rounded-[32px] relative overflow-hidden"
                >
                  {/* Background Shine */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-8 shrink-0">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="h-5 w-5 rounded-lg border-white/60 bg-white/20 text-taja-primary focus:ring-offset-0 focus:ring-0"
                      />
                    </div>
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-motif-blanc border border-white/40 shrink-0 shadow-lg group-hover:scale-105 transition-all duration-500">
                      <Image src={product.image} alt={product.title} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-taja-primary uppercase tracking-widest">{product.category}</span>
                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                        <span className="text-[9px] font-bold text-gray-400 font-mono italic">ID: {product.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <h4 className="text-lg font-black text-taja-secondary truncate mb-1 group-hover:text-taja-primary transition-colors">{product.title}</h4>
                      <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Eye className="h-3 w-3" /> {product.views.toLocaleString()}</span>
                        <span className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> {product.sales.toLocaleString()}</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Updated {new Date(product.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-10 mt-4 lg:mt-0">
                    <div className="w-auto lg:w-32 text-left lg:text-left">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Yield</p>
                      <p className="text-lg font-black text-taja-secondary tracking-tight">₦{product.price.toLocaleString()}</p>
                    </div>

                    <div className="w-auto lg:w-24">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Reserve</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${product.stock < 10 ? 'text-red-500' : 'text-taja-secondary'}`}>{product.stock}</span>
                        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${product.stock < 10 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="w-auto lg:w-40">
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border shadow-sm ${statusDisplay.class}`}>
                        {statusDisplay.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/product/${product.id}`} target="_blank" className="p-3 text-gray-400 hover:text-taja-primary glass-card border-white/60 hover:bg-white transition-all rounded-2xl">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link href={`/seller/products/${product.id}/edit`} className="p-3 text-gray-400 hover:text-taja-primary glass-card border-white/60 hover:bg-white transition-all rounded-2xl">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button onClick={() => setConfirmDeleteId(product.id)} className="p-3 text-gray-400 hover:text-red-500 glass-card border-white/60 hover:bg-white transition-all rounded-2xl">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {filtered.map((product) => {
              const statusDisplay = getStatusDisplay(product.status);
              return (
                <motion.div
                  key={product.id}
                  variants={item}
                  className="glass-card border-white/60 hover:shadow-premium group transition-all duration-500 rounded-[32px] overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-square overflow-hidden bg-motif-blanc">
                    <Image src={product.image} alt={product.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 group">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="h-6 w-6 rounded-xl border-white/40 bg-white/20 backdrop-blur-md text-taja-primary focus:ring-0 cursor-pointer shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border backdrop-blur-md ${statusDisplay.class}`}>
                        {statusDisplay.text}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-taja-primary uppercase tracking-widest">{product.category}</span>
                      <p className="text-sm font-black text-taja-secondary">₦{product.price.toLocaleString()}</p>
                    </div>
                    <h4 className="text-sm font-black text-taja-secondary line-clamp-2 mb-4 group-hover:text-taja-primary transition-colors">{product.title}</h4>
                    <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1"><Eye className="h-3 w-3" /> {product.views}</span>
                        <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {product.sales}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/seller/products/${product.id}/edit`} className="p-2 text-gray-400 hover:text-taja-primary glass-card border-white/60 hover:bg-white transition-all rounded-xl">
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        <button onClick={() => setConfirmDeleteId(product.id)} className="p-2 text-gray-400 hover:text-red-500 glass-card border-white/60 hover:bg-white transition-all rounded-xl">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}
