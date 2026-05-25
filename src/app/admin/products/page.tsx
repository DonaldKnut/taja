"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
    Search,
    Package,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Store,
    Pause,
    Play,
    Trash2,
    Pencil,
    X,
    ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { cn } from "@/lib/utils";

interface Product {
    _id: string;
    title: string;
    price: number;
    category: string;
    status: string;
    inventory: {
        quantity: number;
        trackQuantity: boolean;
    };
    seller: {
        fullName: string;
    };
    shop?: {
        _id: string;
        shopName: string;
    };
    images: string[];
    createdAt: string;
}

interface ShopOption {
    _id: string;
    shopName: string;
    shopSlug: string;
    owner?: { fullName?: string; email?: string };
}

const STATUS_CONFIG = {
    active: { label: "Live", color: "bg-emerald-400/10 text-emerald-600 border border-emerald-400/20", icon: CheckCircle },
    pending: { label: "Audit", color: "bg-amber-400/10 text-amber-600 border border-amber-400/20", icon: Clock },
    out_of_stock: { label: "Depleted", color: "bg-rose-400/10 text-rose-600 border border-rose-400/20", icon: AlertTriangle },
    draft: { label: "Manifest", color: "bg-slate-100 text-slate-400 border border-slate-200/20", icon: Package },
    suspended: { label: "Locked", color: "bg-slate-400/10 text-slate-600 border border-slate-300", icon: XCircle },
    deleted: { label: "Removed", color: "bg-rose-400/10 text-rose-600 border border-rose-400/20", icon: Trash2 },
};

export default function AdminProductsPage() {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actingId, setActingId] = useState<string | null>(null);
    const [stats, setStats] = useState<{ totalProducts: number; activeProducts: number; pendingProducts: number; totalValue: number } | null>(null);
    const [confirmState, setConfirmState] = useState<{ productId: string | null; action: "suspend" | "activate" | "delete" | null }>({
        productId: null,
        action: null,
    });

    // Shop filter state
    const [shops, setShops] = useState<ShopOption[]>([]);
    const [shopSearch, setShopSearch] = useState("");
    const [selectedShop, setSelectedShop] = useState<ShopOption | null>(null);
    const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
    const shopDropdownRef = useRef<HTMLDivElement>(null);

    // Track admin sidebar collapsed state so the bottom filter bar offsets correctly
    const [adminSidebarCollapsed, setAdminSidebarCollapsed] = useState(false);

    // Close shop dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (shopDropdownRef.current && !shopDropdownRef.current.contains(e.target as Node)) {
                setShopDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        try {
            setAdminSidebarCollapsed(localStorage.getItem("taja_admin_sidebar_collapsed") === "1");
        } catch { /* ignore */ }
        const onStorage = (e: StorageEvent) => {
            if (e.key === "taja_admin_sidebar_collapsed") {
                setAdminSidebarCollapsed(e.newValue === "1");
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Fetch shops for the shop picker
    useEffect(() => {
        const fetchShops = async () => {
            try {
                const res = await api("/api/admin/shops?limit=500");
                if (res?.success && Array.isArray(res?.data)) {
                    setShops(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch shops", err);
            }
        };
        fetchShops();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [page, statusFilter, categoryFilter, selectedShop]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api('/api/admin/products/stats');
                if (res?.success) {
                    setStats(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch product stats", error);
            }
        };
        fetchStats();
    }, []);

    const handleProductAction = async (productId: string, action: "suspend" | "activate" | "delete") => {
        try {
            setActingId(productId);
            const res = await api(`/api/admin/products/${productId}`, {
                method: "PUT",
                body: JSON.stringify({ action }),
            });
            if (res?.success) {
                toast.success(action === "delete" ? "Product deleted" : action === "suspend" ? "Product suspended" : "Product activated");
                await fetchProducts();
            } else {
                toast.error(res?.message || "Failed to update product");
            }
        } catch (e: any) {
            toast.error(e?.message || "Failed to update product");
        } finally {
            setActingId(null);
        }
    };

    const openDeleteConfirm = (productId: string) => {
        setConfirmState({ productId, action: "delete" });
    };

    const handleConfirmDelete = async () => {
        if (!confirmState.productId || !confirmState.action) return;
        await handleProductAction(confirmState.productId, confirmState.action);
        setConfirmState({ productId: null, action: null });
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "15",
            });

            if (search.trim()) params.append("search", search.trim());
            if (statusFilter) params.append("status", statusFilter);
            if (categoryFilter) params.append("category", categoryFilter);
            // If a specific shop is selected, search by that shop's name (exact)
            if (selectedShop) params.append("shopId", selectedShop._id);

            const response = await api(`/api/admin/products?${params.toString()}`);
            if (response?.success) {
                setProducts(response.data.products);
                setTotalPages(response.data.pagination.totalPages);
            } else {
                toast.error(response?.message || "Failed to fetch products");
            }
        } catch (error) {
            toast.error("Error loading products");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    const filteredShops = shops.filter((shop) => {
        const q = shopSearch.trim().toLowerCase();
        if (!q) return true;
        return (
            shop.shopName.toLowerCase().includes(q) ||
            (shop.owner?.fullName ?? "").toLowerCase().includes(q) ||
            (shop.owner?.email ?? "").toLowerCase().includes(q)
        );
    });

    const clearShopFilter = () => {
        setSelectedShop(null);
        setShopSearch("");
        setShopDropdownOpen(false);
        setPage(1);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 pb-28">
            <ConfirmModal
                isOpen={!!confirmState.productId && confirmState.action === "delete"}
                title="Remove this product from the catalogue?"
                description="It will be marked as deleted and hidden from the marketplace, but kept in the audit trail."
                confirmLabel="Yes, mark as deleted"
                cancelLabel="Cancel"
                variant="danger"
                loading={!!actingId}
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmState({ productId: null, action: null })}
            />

            <div className="mb-10 p-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-[1.2rem] bg-slate-950 shadow-huge flex items-center justify-center">
                        <Package className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Stock Management</p>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Inventory Catalogue</h1>
                    </div>
                </div>
                <Link href="/admin/products/new">
                    <Button className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] bg-slate-950 hover:bg-emerald-600 text-white flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Add Product
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <Card className="rounded-[1.5rem] border-slate-100 shadow-sm hover:shadow-huge transition-all duration-500">
                    <CardContent className="pt-6 pb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Supply</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                                    {stats ? stats.totalProducts.toLocaleString() : <span className="animate-pulse bg-slate-200 text-transparent rounded">000</span>}
                                </h3>
                            </div>
                            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-900">
                                <Package className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[1.5rem] border-slate-100 shadow-sm hover:shadow-huge transition-all duration-500">
                    <CardContent className="pt-6 pb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Inventory</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                                    {stats ? stats.activeProducts.toLocaleString() : <span className="animate-pulse bg-slate-200 text-transparent rounded">000</span>}
                                </h3>
                            </div>
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[1.5rem] border-slate-100 shadow-sm hover:shadow-huge transition-all duration-500">
                    <CardContent className="pt-6 pb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Queue</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                                    {stats ? stats.pendingProducts.toLocaleString() : <span className="animate-pulse bg-slate-200 text-transparent rounded">000</span>}
                                </h3>
                            </div>
                            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600">
                                <Clock className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[1.5rem] border-slate-100 shadow-sm hover:shadow-huge transition-all duration-500">
                    <CardContent className="pt-6 pb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                                    {stats ? `₦${(stats.totalValue).toLocaleString()}` : <span className="animate-pulse bg-slate-200 text-transparent rounded">000000</span>}
                                </h3>
                            </div>
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active shop filter banner */}
            {selectedShop && (
                <div className="mb-6 flex items-center gap-3 px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl w-fit">
                    <Store className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-sm font-black text-emerald-900">
                        Showing products for: <span className="text-emerald-600">{selectedShop.shopName}</span>
                        {selectedShop.owner?.fullName && (
                            <span className="text-emerald-400 font-bold"> · {selectedShop.owner.fullName}</span>
                        )}
                    </span>
                    <button
                        onClick={clearShopFilter}
                        className="ml-2 p-1 rounded-full hover:bg-emerald-100 text-emerald-500 hover:text-emerald-700 transition-colors"
                        title="Clear shop filter"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* ── Fixed bottom filter bar ──────────────────────────────────────────── */}
            <div
                className={cn(
                    "fixed bottom-0 right-0 z-50 transition-all duration-300",
                    "left-0 lg:left-72",
                    adminSidebarCollapsed && "lg:left-20"
                )}
            >
                <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_30px_-6px_rgba(0,0,0,0.08)] rounded-t-2xl">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-0 px-4 md:px-6 py-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <input
                                placeholder="Search by title, shop, or category..."
                                className="w-full h-12 pl-11 pr-4 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-300"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-0 border-t md:border-t-0 md:border-l border-slate-100 overflow-x-auto">
                            {/* Shop picker */}
                            <div className="relative h-12 shrink-0" ref={shopDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setShopDropdownOpen((o) => !o)}
                                    className={cn(
                                        "h-12 px-5 flex items-center gap-2 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors border-r border-slate-100",
                                        selectedShop ? "text-emerald-600" : "text-slate-500 hover:text-emerald-600"
                                    )}
                                >
                                    <Store className="h-3.5 w-3.5 shrink-0" />
                                    <span className="max-w-[120px] truncate">
                                        {selectedShop ? selectedShop.shopName : "All Shops"}
                                    </span>
                                    {selectedShop ? (
                                        <X
                                            className="h-3 w-3 shrink-0 hover:text-rose-500"
                                            onClick={(e) => { e.stopPropagation(); clearShopFilter(); }}
                                        />
                                    ) : (
                                        <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", shopDropdownOpen && "rotate-180")} />
                                    )}
                                </button>

                                {shopDropdownOpen && (
                                    <div className="absolute bottom-14 left-0 z-50 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                                        <div className="p-3 border-b border-slate-100">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <input
                                                    autoFocus
                                                    placeholder="Search shops..."
                                                    className="w-full h-9 pl-9 pr-3 text-sm font-bold text-slate-900 bg-slate-50 rounded-xl border border-slate-100 focus:outline-none focus:border-emerald-400 placeholder:text-slate-300"
                                                    value={shopSearch}
                                                    onChange={(e) => setShopSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            <button
                                                type="button"
                                                onClick={clearShopFilter}
                                                className={cn(
                                                    "w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-slate-50",
                                                    !selectedShop ? "text-emerald-600 bg-emerald-50/50" : "text-slate-500"
                                                )}
                                            >
                                                All Shops
                                            </button>
                                            {filteredShops.length === 0 ? (
                                                <p className="px-4 py-6 text-center text-xs text-slate-400 font-bold">No shops found</p>
                                            ) : (
                                                filteredShops.map((shop) => (
                                                    <button
                                                        key={shop._id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedShop(shop);
                                                            setShopDropdownOpen(false);
                                                            setPage(1);
                                                        }}
                                                        className={cn(
                                                            "w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 border-t border-slate-50",
                                                            selectedShop?._id === shop._id && "bg-emerald-50/60"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                                                <Store className="h-3.5 w-3.5 text-emerald-600" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-black text-slate-900 truncate">{shop.shopName}</p>
                                                                {shop.owner?.fullName && (
                                                                    <p className="text-[10px] font-bold text-slate-400 truncate">{shop.owner.fullName}</p>
                                                                )}
                                                            </div>
                                                            {selectedShop?._id === shop._id && (
                                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 ml-auto shrink-0" />
                                                            )}
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="h-12 px-5 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-emerald-600 transition-colors shrink-0"
                            >
                                <option value="">All Categories</option>
                                <option value="electronics">Electronics</option>
                                <option value="fashion">Fashion</option>
                                <option value="home">Home &amp; Kitchen</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-12 px-5 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-emerald-600 transition-colors border-l border-slate-100 shrink-0"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="pending">Awaiting Audit</option>
                                <option value="out_of_stock">Depleted</option>
                                <option value="suspended">Locked</option>
                            </select>
                            <button type="submit" className="h-12 px-8 bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shrink-0 rounded-tr-2xl">
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Card className="border-slate-100 rounded-[2.5rem] shadow-huge overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/30">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Merchant</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Price</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Inventory Level</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Market State</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">Loading inventory catalogue...</td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                                    {selectedShop ? `No products found for ${selectedShop.shopName}` : "No products found"}
                                                </p>
                                                {selectedShop && (
                                                    <button
                                                        onClick={clearShopFilter}
                                                        className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                                                    >
                                                        Clear shop filter
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-10 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
                                                        {product.images?.[0] ? (
                                                            <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                                                                <Package className="h-5 w-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-base font-black text-slate-900 tracking-tight truncate">{product.title}</p>
                                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">{product.category}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <button
                                                        type="button"
                                                        title="Filter by this shop"
                                                        onClick={() => {
                                                            if (product.shop) {
                                                                const shopData = shops.find(s => s._id === product.shop!._id);
                                                                if (shopData) {
                                                                    setSelectedShop(shopData);
                                                                    setPage(1);
                                                                }
                                                            }
                                                        }}
                                                        className={cn(
                                                            "text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 group/shop",
                                                            product.shop && "hover:text-emerald-600 transition-colors cursor-pointer"
                                                        )}
                                                    >
                                                        <Store className="h-3 w-3 text-emerald-500 group-hover/shop:scale-110 transition-transform" />
                                                        {product.shop?.shopName || 'External Merchant'}
                                                    </button>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{product.seller.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-lg font-black text-slate-900 tracking-tighter">₦{product.price.toLocaleString()}</span>
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Base Price</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {!product.inventory.trackQuantity ? (
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Unlimited Supply</span>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className={`text-base font-black ${product.inventory.quantity <= 5 ? 'text-rose-600' : 'text-slate-900'}`}>
                                                            {product.inventory.quantity} <span className="text-[10px] font-bold text-slate-400 uppercase">Units</span>
                                                        </span>
                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${product.inventory.quantity <= 5 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                                style={{ width: `${Math.min(100, (product.inventory.quantity / 20) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_CONFIG[product.status as keyof typeof STATUS_CONFIG]?.color || 'bg-slate-100 text-slate-400'}`}>
                                                    <div className="h-1.5 w-1.5 rounded-full bg-current stroke-current" />
                                                    {STATUS_CONFIG[product.status as keyof typeof STATUS_CONFIG]?.label || product.status.replace('_', ' ')}
                                                </div>
                                            </td>
                                            <td className="px-10 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/admin/products/${product._id}/edit`}>
                                                        <button
                                                            className="h-9 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[9px] uppercase flex items-center gap-1.5"
                                                        >
                                                            <Pencil className="h-3 w-3" /> Edit
                                                        </button>
                                                    </Link>
                                                    {product.status === "active" ? (
                                                        <button
                                                            onClick={() => handleProductAction(product._id, "suspend")}
                                                            disabled={actingId === product._id}
                                                            className="h-9 px-3 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-[9px] uppercase disabled:opacity-50"
                                                        >
                                                            <Pause className="h-3 w-3 inline mr-1" /> Suspend
                                                        </button>
                                                    ) : product.status === "suspended" ? (
                                                        <button
                                                            onClick={() => handleProductAction(product._id, "activate")}
                                                            disabled={actingId === product._id}
                                                            className="h-9 px-3 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-[9px] uppercase disabled:opacity-50"
                                                        >
                                                            <Play className="h-3 w-3 inline mr-1" /> Activate
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        onClick={() => openDeleteConfirm(product._id)}
                                                        disabled={actingId === product._id}
                                                        className="h-9 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[9px] uppercase disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-3 w-3 inline mr-1" /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/20 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catalogue Index {page} <span className="text-slate-200 mx-2">/</span> {totalPages}</span>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-11 px-8 rounded-2xl border border-slate-200 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] disabled:opacity-30 transition-all hover:bg-slate-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="h-11 px-8 rounded-2xl border border-slate-200 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] disabled:opacity-30 transition-all hover:bg-slate-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
