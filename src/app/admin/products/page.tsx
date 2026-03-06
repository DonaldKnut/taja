"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    Package,
    Filter,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Store,
    Tag,
    BarChart2,
    Pause,
    Play,
    Trash2,
    Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";

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
        shopName: string;
    };
    images: string[];
    createdAt: string;
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

    useEffect(() => {
        fetchProducts();
    }, [page, statusFilter, categoryFilter]);

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
        if (action === "delete" && !confirm("Remove this product from the catalogue? It will be marked as deleted.")) return;
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

    return (
        <div className="p-4 sm:p-6 lg:p-8">
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

            <Card className="mb-10 rounded-[2rem] border-slate-100 shadow-sm overflow-hidden">
                <CardContent className="p-1">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-0">
                        <div className="flex-1 relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                            <input
                                placeholder="Search by title, shop, or category..."
                                className="w-full h-16 pl-14 pr-6 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-300"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-0 border-t md:border-t-0 md:border-l border-slate-100">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="h-16 px-8 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-emerald-600 transition-colors"
                            >
                                <option value="">All Categories</option>
                                <option value="electronics">Electronics</option>
                                <option value="fashion">Fashion</option>
                                <option value="home">Home & Kitchen</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-16 px-8 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-emerald-600 transition-colors border-l border-slate-100"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="pending">Awaiting Audit</option>
                                <option value="out_of_stock">Depleted</option>
                                <option value="suspended">Locked</option>
                            </select>
                            <button type="submit" className="h-16 px-10 bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all">
                                Search
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>

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
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">No products found</td>
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
                                                    <span className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                                                        <Store className="h-3 w-3 text-emerald-500" />
                                                        {product.shop?.shopName || 'External Merchant'}
                                                    </span>
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
                                                        onClick={() => handleProductAction(product._id, "delete")}
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
