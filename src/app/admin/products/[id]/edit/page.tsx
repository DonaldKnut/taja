"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Upload,
    X,
    Plus,
    Camera,
    Tag,
    Package,
    Truck,
    ArrowLeft,
    Save,
    Eye,
    Star,
    GripVertical,
    ChevronRight,
    Zap,
    ShieldCheck,
    TrendingUp,
    LayoutGrid,
    Settings,
    AlertCircle,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { api, sellerApi, uploadProductImage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/layout";

export default function AdminEditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params?.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        subcategory: "",
        condition: "new" as "new" | "like-new" | "good" | "fair" | "poor",
        price: "",
        maxPrice: "",
        isRange: false,
        compareAtPrice: "",
        currency: "NGN",
        images: [] as string[],
        specifications: {} as Record<string, any>,
        inventory: {
            quantity: 1,
            sku: "",
            trackQuantity: true,
            moq: 1,
        },
        shipping: {
            weight: "",
            dimensions: {
                length: 0,
                width: 0,
                height: 0,
            },
            freeShipping: false,
            shippingCost: "",
            processingTime: "1-2-days" as "1-2-days" | "3-5-days" | "1-week" | "2-weeks",
        },
        seo: {
            tags: [] as string[],
            metaTitle: "",
            metaDescription: "",
        },
        status: "active" as "active" | "draft" | "suspended",
        variants: [] as any[],
    });

    const [productOwner, setProductOwner] = useState<any>(null);

    // Fetch categories and product data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setFetching(true);

                // Fetch Categories
                const categoriesRes = await api("/api/categories");
                if (categoriesRes?.data) {
                    setCategories(categoriesRes.data);
                }

                if (!productId) return;

                // Fetch Product (Using admin-specific fetch if available, or general api)
                const response = await api(`/api/products/${productId}`);

                let productData;
                if (response?.data?.product) {
                    productData = response.data.product;
                } else if (response?.data) {
                    productData = response.data;
                } else if (response?.product) {
                    productData = response.product;
                } else {
                    productData = response;
                }

                if (productData.shop) {
                    setProductOwner(productData.shop);
                } else if (productData.seller) {
                    setProductOwner(productData.seller);
                }

                // Transform API response to match our form structure
                setFormData({
                    title: productData.name || productData.title || "",
                    description: productData.description || "",
                    category: typeof productData.category === 'object' ? productData.category._id : productData.category || "",
                    subcategory: productData.subcategory || "",
                    condition: productData.condition || "new",
                    price: String(productData.price || ""),
                    maxPrice: String(productData.maxPrice || ""),
                    isRange: !!productData.maxPrice,
                    compareAtPrice: productData.compareAtPrice || productData.originalPrice ? String(productData.compareAtPrice || productData.originalPrice) : "",
                    currency: productData.currency || "NGN",
                    images: productData.images || [],
                    specifications: productData.specifications || {},
                    inventory: {
                        quantity: productData.inventory?.quantity ?? productData.stock ?? 1,
                        sku: productData.inventory?.sku || productData.sku || "",
                        trackQuantity: productData.inventory?.trackQuantity !== false,
                        moq: productData.inventory?.moq || productData.moq || 1,
                    },
                    shipping: {
                        weight: productData.shipping?.weight ? String(productData.shipping.weight) : "",
                        dimensions: productData.shipping?.dimensions || { length: 0, width: 0, height: 0 },
                        freeShipping: productData.shipping?.freeShipping || false,
                        shippingCost: productData.shipping?.shippingCost ? String(productData.shipping.shippingCost) : "",
                        processingTime: productData.shipping?.processingTime || "1-2-days",
                    },
                    seo: {
                        tags: productData.seo?.tags || productData.tags || [],
                        metaTitle: productData.seo?.metaTitle || productData.metaTitle || "",
                        metaDescription: productData.seo?.metaDescription || productData.metaDescription || "",
                    },
                    status: productData.status || "active",
                    variants: (productData.variants || []).map((v: any) => ({
                        ...v,
                        price: String(v.price || ""),
                        stock: String(v.stock || ""),
                        weight: String(v.weight || ""),
                    })),
                });
            } catch (error: any) {
                console.error("Failed to fetch data:", error);
                toast.error(error?.message || "Failed to load product information");
            } finally {
                setFetching(false);
            }
        };

        fetchInitialData();
    }, [productId]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value, type } = e.target;

        if (name.includes(".")) {
            const parts = name.split(".");
            if (parts.length === 2) {
                const [parent, child] = parts;
                setFormData((prev) => ({
                    ...prev,
                    [parent]: {
                        ...(prev as any)[parent],
                        [child]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
                    },
                }));
            } else if (parts.length === 3) {
                const [parent, mid, child] = parts;
                setFormData((prev) => ({
                    ...prev,
                    [parent]: {
                        ...(prev as any)[parent],
                        [mid]: {
                            ...(prev as any)[parent][mid],
                            [child]: value
                        }
                    }
                }));
            }
        } else if (type === "checkbox") {
            setFormData((prev) => ({
                ...prev,
                [name]: (e.target as HTMLInputElement).checked,
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleImageUpload = async (files: FileList) => {
        if (files.length === 0) return;

        setUploadingImages(true);
        try {
            const uploadPromises = Array.from(files).slice(0, 8 - formData.images.length).map(async (file) => {
                const url = await uploadProductImage(file);
                return url;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            setFormData((prev) => ({
                ...prev,
                images: [...prev.images, ...uploadedUrls].slice(0, 8),
            }));
            toast.success(`${uploadedUrls.length} image(s) uploaded`);
        } catch (error: any) {
            console.error("Image upload error:", error);
            toast.error(error?.message || "Failed to upload images");
        } finally {
            setUploadingImages(false);
        }
    };

    const removeImage = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const setMainImage = (index: number) => {
        if (index === 0) return;
        setFormData((prev) => {
            const newImages = [...prev.images];
            const [removed] = newImages.splice(index, 1);
            newImages.unshift(removed);
            return { ...prev, images: newImages };
        });
        toast.success("Main image updated");
    };

    const addVariant = () => {
        setFormData((prev) => ({
            ...prev,
            variants: [
                ...prev.variants,
                {
                    name: "",
                    price: prev.price || "0",
                    stock: prev.inventory.quantity || "1",
                    sku: "",
                    weight: prev.shipping.weight || "0",
                },
            ],
        }));
    };

    const updateVariant = (index: number, field: string, value: string) => {
        setFormData((prev) => {
            const newVariants = [...prev.variants];
            newVariants[index] = { ...newVariants[index], [field]: value };
            return { ...prev, variants: newVariants };
        });
    };

    const removeVariant = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.category || !formData.price || formData.images.length === 0) {
            toast.error("Please fill in title, category, price and at least one image");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                subcategory: formData.subcategory || undefined,
                condition: formData.condition,
                price: parseFloat(formData.price),
                maxPrice: formData.isRange && formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
                compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
                currency: formData.currency,
                images: formData.images,
                specifications: formData.specifications,
                inventory: {
                    quantity: Number(formData.inventory.quantity),
                    sku: formData.inventory.sku || undefined,
                    trackQuantity: formData.inventory.trackQuantity,
                    moq: Number(formData.inventory.moq) || 1,
                },
                shipping: {
                    weight: formData.shipping.weight ? parseFloat(formData.shipping.weight) : 0,
                    dimensions: {
                        length: Number(formData.shipping.dimensions?.length) || 0,
                        width: Number(formData.shipping.dimensions?.width) || 0,
                        height: Number(formData.shipping.dimensions?.height) || 0,
                    },
                    freeShipping: formData.shipping.freeShipping,
                    shippingCost: formData.shipping.shippingCost ? parseFloat(formData.shipping.shippingCost) : 0,
                    processingTime: formData.shipping.processingTime,
                },
                seo: {
                    tags: formData.seo.tags,
                    metaTitle: formData.seo.metaTitle || undefined,
                    metaDescription: formData.seo.metaDescription || undefined,
                },
                status: formData.status,
                variants: formData.variants.map((v) => ({
                    ...v,
                    price: parseFloat(String(v.price)),
                    stock: parseInt(String(v.stock)) || 0,
                    weight: parseFloat(String(v.weight)) || 0,
                })),
            };

            const response = await api(`/api/products/${productId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });

            if (response?.success) {
                toast.success(`Product updated successfully!`);
                router.push("/admin/products");
            } else {
                toast.error(response?.message || "Failed to update product");
            }
        } catch (error: any) {
            console.error("Product update error:", error);
            toast.error(error?.message || "An error occurred while updating");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="h-12 w-12 border-4 border-slate-900 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading product...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* ── Fixed Action Bar (aligned with Add Product page) ── */}
            <nav className="fixed top-[72px] left-0 right-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link
                            href="/admin/products"
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 transition-all group"
                        >
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Catalogue
                        </Link>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 h-9 rounded-xl bg-slate-900 text-white hover:bg-emerald-600 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm disabled:opacity-50"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {loading ? "Saving…" : "Publish Product"}
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-24">
                <Container size="lg">
                    {/* Admin Header */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 mb-12 shadow-huge relative overflow-hidden text-white border border-slate-800">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <Link href="/admin/products" className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/20 rounded-full">
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400">Admin edit</span>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none mb-4">
                                        Edit: {formData.title || "Product"}
                                    </h1>
                                    <p className="text-slate-400 font-bold text-sm max-w-2xl">
                                        You are editing this product for <span className="text-emerald-400">{productOwner?.shopName || productOwner?.fullName || "the seller"}</span>.
                                        Changes are saved to the live listing when you click Save.
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-[10px] shadow-premium bg-emerald-500 hover:bg-emerald-600 text-white transition-all transform hover:scale-[1.02]"
                                    >
                                        {loading ? "Saving…" : "Save changes"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Left Column */}
                        <div className="lg:col-span-8 space-y-10">
                            {/* Media Section */}
                            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-slate-900 rounded-2xl">
                                        <Camera className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Product photos</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add, remove, or reorder images</p>
                                    </div>
                                </div>
                                {formData.images.length > 0 && (
                                    <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-xs font-bold text-slate-600 mb-3">
                                            Current images on this listing — this is what buyers see. First image is the main one.
                                        </p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                    {formData.images.map((image, index) => (
                                        <motion.div
                                            layout
                                            key={index}
                                            className={cn(
                                                "group relative aspect-square rounded-3xl overflow-hidden border-2 transition-all duration-500",
                                                index === 0 ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-slate-50"
                                            )}
                                        >
                                            <Image src={image} alt={`Preview ${index}`} fill className="object-cover" />

                                            {index === 0 && (
                                                <div className="absolute top-3 left-3 px-2 py-1 bg-emerald-500 rounded-full flex items-center gap-1 shadow-lg">
                                                    <Star className="w-2.5 h-2.5 text-white fill-white" />
                                                    <span className="text-[8px] font-black text-white uppercase tracking-tighter">Main</span>
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                {index !== 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setMainImage(index)}
                                                        className="p-2 bg-white rounded-xl text-slate-900 hover:text-emerald-500 transition-colors"
                                                    >
                                                        <Star className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="p-2 bg-rose-500 rounded-xl text-white hover:bg-rose-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {formData.images.length < 8 && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingImages}
                                            className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-emerald-200 transition-colors group"
                                        >
                                            {uploadingImages ? (
                                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
                                            ) : (
                                                <>
                                                    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors">
                                                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3">Add photo</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                                    className="hidden"
                                />
                            </section>

                            {/* Content Section */}
                            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="p-3 bg-slate-900 rounded-2xl">
                                        <LayoutGrid className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Title & description</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">What buyers see in the listing</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Title</label>
                                        <Input
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="Enter a descriptive title..."
                                            className="rounded-2xl h-16 text-xl font-black border-slate-100 focus:border-emerald-500 bg-slate-50/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={8}
                                            className="w-full px-6 py-5 bg-slate-50/50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-700 text-base"
                                            placeholder="Describe the product clearly for buyers..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Category</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                className="w-full h-16 px-6 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 font-black text-slate-900 appearance-none"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Condition</label>
                                            <div className="flex gap-2">
                                                {["new", "like-new", "good", "fair"].map((cond) => (
                                                    <button
                                                        key={cond}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, condition: cond as any }))}
                                                        className={cn(
                                                            "flex-1 h-12 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                                            formData.condition === cond
                                                                ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                                        )}
                                                    >
                                                        {cond.replace('-', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Pricing Section */}
                            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-slate-900 rounded-2xl">
                                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Price</h2>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selling price in ₦</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Price range</span>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, isRange: !prev.isRange }))}
                                            className={cn(
                                                "relative h-6 w-12 rounded-full transition-colors",
                                                formData.isRange ? "bg-emerald-500" : "bg-slate-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform",
                                                formData.isRange ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="relative">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">
                                                {formData.isRange ? "Min price (₦)" : "Price (₦)"}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">₦</span>
                                                <Input
                                                    name="price"
                                                    type="number"
                                                    value={formData.price}
                                                    onChange={handleChange}
                                                    className="rounded-2xl h-16 pl-12 text-2xl font-black border-slate-100 bg-slate-50/50"
                                                />
                                            </div>
                                        </div>

                                        {formData.isRange && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Max price (₦)</label>
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">₦</span>
                                                    <Input
                                                        name="maxPrice"
                                                        type="number"
                                                        value={formData.maxPrice}
                                                        onChange={handleChange}
                                                        className="rounded-2xl h-16 pl-12 text-2xl font-black border-slate-100 bg-slate-50/50 text-emerald-600"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Compare at / Was (₦)</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-300">NGN</span>
                                            <Input
                                                name="compareAtPrice"
                                                type="number"
                                                value={formData.compareAtPrice}
                                                onChange={handleChange}
                                                className="rounded-2xl h-16 pl-16 text-lg font-bold text-slate-400 border-slate-100 bg-slate-50/50 line-through"
                                            />
                                        </div>
                                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                                            <ShieldAlert className="w-5 h-5 text-emerald-500 shrink-0" />
                                            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest leading-relaxed">
                                                A higher "compare at" price can make the current price look like a better deal to buyers.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Logistics Protocol */}
                            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full -z-10" />
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="p-3 bg-slate-900 rounded-2xl">
                                        <Truck className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Shipping</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight and delivery fee</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="group space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                            Product Weight (kg)
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            name="shipping.weight"
                                            value={formData.shipping.weight}
                                            onChange={handleChange}
                                            className="rounded-2xl h-14 font-black border-slate-100 bg-slate-50/50"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="group space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                            Delivery Fee (₦)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">₦</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                name="shipping.shippingCost"
                                                value={formData.shipping.shippingCost}
                                                onChange={handleChange}
                                                className="rounded-2xl h-14 pl-12 font-black border-slate-100 bg-slate-50/50"
                                                placeholder="Flat rate"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <input
                                            type="checkbox"
                                            id="freeShipping"
                                            name="shipping.freeShipping"
                                            checked={formData.shipping.freeShipping}
                                            onChange={handleChange}
                                            className="h-5 w-5 rounded border-slate-200 text-slate-900 focus:ring-slate-900"
                                        />
                                        <label htmlFor="freeShipping" className="text-[10px] font-black uppercase tracking-widest text-slate-900 cursor-pointer">
                                            Enable Free Shipping
                                        </label>
                                    </div>
                                </div>
                            </section>

                            {/* Product Variations */}
                            <section className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full -z-10" />
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-slate-900 rounded-2xl hidden sm:block">
                                            <Zap className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Sizes / options</h2>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">e.g. Red, XL, 1kg</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addVariant}
                                        className="flex items-center justify-center gap-2 px-6 h-12 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all font-sans w-full sm:w-auto"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add option
                                    </button>
                                </div>

                                {formData.variants.length > 0 ? (
                                    <div className="space-y-6">
                                        {/* Desktop Headers - Hidden on Mobile */}
                                        <div className="hidden sm:grid grid-cols-12 gap-4 px-4 mb-2">
                                            <div className="col-span-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Option Name (e.g. Red / XL)</div>
                                            <div className="col-span-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Price (₦)</div>
                                            <div className="col-span-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Stock</div>
                                            <div className="col-span-3 text-[8px] font-black uppercase tracking-widest text-slate-400">Weight (kg)</div>
                                            <div className="col-span-1"></div>
                                        </div>

                                        <AnimatePresence>
                                            {formData.variants.map((v, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="relative p-6 sm:p-4 bg-slate-50 border border-slate-100 rounded-[2rem] sm:rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group"
                                                >
                                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-4 items-end sm:items-center">
                                                        {/* Option Name Input */}
                                                        <div className="sm:col-span-4 space-y-2 sm:space-y-0">
                                                            <label className="sm:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Option Name</label>
                                                            <input
                                                                type="text"
                                                                value={v.name}
                                                                onChange={(e) => updateVariant(i, "name", e.target.value)}
                                                                placeholder="e.g. Red / XL"
                                                                className="w-full h-12 sm:h-12 px-4 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-xs font-bold transition-all outline-none"
                                                            />
                                                        </div>

                                                        {/* Price Input */}
                                                        <div className="sm:col-span-2 space-y-2 sm:space-y-0">
                                                            <label className="sm:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₦)</label>
                                                            <input
                                                                type="number"
                                                                value={v.price}
                                                                onChange={(e) => updateVariant(i, "price", e.target.value)}
                                                                placeholder="Base price"
                                                                className="w-full h-12 sm:h-12 px-4 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-xs font-black text-emerald-600 transition-all outline-none"
                                                            />
                                                        </div>

                                                        {/* Stock Input */}
                                                        <div className="sm:col-span-2 space-y-2 sm:space-y-0">
                                                            <label className="sm:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock</label>
                                                            <input
                                                                type="number"
                                                                value={v.stock}
                                                                onChange={(e) => updateVariant(i, "stock", e.target.value)}
                                                                className="w-full h-12 sm:h-12 px-4 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-xs font-bold transition-all outline-none"
                                                            />
                                                        </div>

                                                        {/* Weight Input */}
                                                        <div className="sm:col-span-3 space-y-2 sm:space-y-0">
                                                            <label className="sm:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Weight (kg)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={v.weight}
                                                                onChange={(e) => updateVariant(i, "weight", e.target.value)}
                                                                placeholder="Weight"
                                                                className="w-full h-12 sm:h-12 px-4 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-xs font-medium text-slate-500 transition-all outline-none"
                                                            />
                                                        </div>

                                                        {/* Remove Button */}
                                                        <div className="sm:col-span-1 flex justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeVariant(i)}
                                                                className="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-colors shadow-sm bg-white border border-slate-200 hover:border-transparent"
                                                            >
                                                                <X className="h-4 w-4 sm:h-4 sm:w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] sm:rounded-[2.5rem] bg-slate-50/50">
                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                                            <Zap className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">No sizes or options yet</p>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-4 space-y-10">
                            {/* Inventory Management */}
                            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2.5 bg-slate-900 rounded-2xl">
                                        <Package className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Stock</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">In stock</label>
                                        <Input
                                            name="inventory.quantity"
                                            type="number"
                                            value={formData.inventory.quantity}
                                            onChange={handleChange}
                                            className="rounded-xl h-14 font-black border-slate-100 bg-slate-50/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Min order (MOQ)</label>
                                        <Input
                                            name="inventory.moq"
                                            type="number"
                                            value={formData.inventory.moq}
                                            onChange={handleChange}
                                            className="rounded-xl h-14 font-black border-slate-100 bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Market Status */}
                            <section className="bg-slate-900 rounded-[2.5rem] p-8 shadow-huge text-white border border-slate-800">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8">Who can see this</h3>

                                <div className="space-y-4">
                                    {[
                                        { id: 'active', label: 'Live', color: 'bg-emerald-500', sub: 'Visible to buyers' },
                                        { id: 'draft', label: 'Draft', color: 'bg-amber-500', sub: 'Saved but hidden' },
                                        { id: 'suspended', label: 'Paused', color: 'bg-rose-500', sub: 'Needs review' }
                                    ].map((stat) => (
                                        <button
                                            key={stat.id}
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, status: stat.id as any }))}
                                            className={cn(
                                                "w-full h-18 rounded-2xl flex items-center justify-between px-6 border-2 transition-all",
                                                formData.status === stat.id
                                                    ? "border-emerald-500 bg-emerald-500/5"
                                                    : "border-slate-800 hover:border-slate-700"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("h-3 w-3 rounded-full", formData.status === stat.id ? stat.color + " ring-4 ring-" + stat.color + "/20" : "bg-slate-700")}></div>
                                                <div className="text-left">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white">{stat.label}</p>
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{stat.sub}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className={cn("w-4 h-4", formData.status === stat.id ? "text-emerald-500" : "text-slate-700")} />
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Owner Info Sidebar */}
                            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Sold by</h3>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 font-black">
                                        {(productOwner?.shopName || productOwner?.fullName || "S")[0]}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 truncate max-w-[150px]">
                                            {productOwner?.shopName || productOwner?.fullName || "Seller"}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Shop</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </Container>
            </main>
        </div>
    );
}
