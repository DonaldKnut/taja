"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingCart,
  Star,
  Shield,
  Truck,
  ChevronLeft,
  Share2,
  MapPin,
  CheckCircle,
  ShieldCheck,
  Minus,
  Plus,
  Phone,
  Instagram,
  Sparkles,
  Zap,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ImageSlider } from "@/components/ui/ImageSlider";
import { useCartStore } from "@/stores/cartStore";
import { cartApi, productsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { StructuredData } from "@/components/StructuredData";
import { generateProductStructuredData, generateBreadcrumbs } from "@/lib/seo";
import { AIRecommendations } from "@/components/product/AIRecommendations";
import { AppHeader } from "@/components/layout/AppHeader";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout";

const fallbackImage = "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png";

// Initial loading state or empty product
const emptyProduct = {
  id: "",
  slug: "",
  title: "Loading...",
  description: "",
  longDescription: "",
  price: 0,
  compareAtPrice: 0,
  maxPrice: 0,
  stock: 0,
  images: [],
  condition: "good",
  category: "",
  location: "",
  createdAt: new Date().toISOString(),
  views: 0,
  shop: {
    shopName: "Loading...",
    shopSlug: "",
    isVerified: false,
    averageRating: 0,
    totalProducts: 0,
    followers: 0,
    since: "",
    socialLinks: {
      instagram: "",
      whatsapp: "",
    },
  },
  reviews: [],
  relatedProducts: [],
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addItem, updateQuantity, toggleCart, isOpen } = useCartStore();

  // Format WhatsApp URL with optional product context message
  const getWhatsAppUrl = (whatsapp: string, product?: any) => {
    if (!whatsapp) return null;
    const cleanNumber = whatsapp.replace(/[\s\+\-]/g, "");
    if (whatsapp.startsWith("http")) return whatsapp;

    let message = "";
    if (product) {
      message = `Hi! I'm interested in "${product.title
        }" (₦${product.price.toLocaleString()}). Can you tell me more about this product?`;
    }

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

  // Fetch product data based on slug
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productsApi.getBySlug(params.slug as string);

        // Handle different response structures
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

        // Transform API response to match our product structure
        const transformedProduct = {
          id: productData._id || productData.id,
          slug: productData.slug || params.slug,
          sellerId: productData.seller?._id || productData.seller?.id,
          title: productData.name || productData.title || "Product",
          description: productData.description || "",
          longDescription: productData.longDescription || productData.description || "",
          price: productData.price || 0,
          maxPrice: productData.maxPrice || 0,
          compareAtPrice: productData.compareAtPrice || productData.originalPrice,
          stock: productData.inventory?.quantity ?? productData.stock ?? 0,
          moq: productData.inventory?.moq ?? 1,
          images: productData.images || [],
          condition: productData.condition || "good",
          category: productData.category?.name || productData.category || "",
          specifications: productData.specifications || {},
          location: productData.location || "",
          createdAt: productData.createdAt || new Date().toISOString(),
          views: productData.views || 0,
          shop: {
            shopName: productData.shop?.shopName || productData.shop?.name || "Shop",
            shopSlug: productData.shop?.shopSlug || productData.shop?.slug || productData.shopSlug || "",
            shopId: productData.shop?._id || productData.shop?.id,
            averageRating: productData.shop?.averageRating || 0,
            verified: productData.shop?.verified || false,
            isVerified: productData.shop?.verified || productData.shop?.isVerified || false,
            totalProducts: productData.shop?.totalProducts || 0,
            followers: productData.shop?.followers || productData.shop?.followerCount || 0,
            since: productData.shop?.since || productData.shop?.createdAt || new Date().toISOString(),
            socialLinks: productData.shop?.socialLinks || {
              instagram: "",
              whatsapp: "",
            },
          },
          reviews: productData.reviews || [],
          relatedProducts: productData.relatedProducts || [],
        };

        setProduct(transformedProduct);
      } catch (error: any) {
        console.error("Error fetching product:", error);
        toast.error(error?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      fetchProduct();
    }
  }, [params.slug]);

  const handleAddToCart = async () => {
    try {
      // Add to local cart store
      addItem({
        _id: product.id,
        title: product.title,
        price: product.price,
        images: product.images,
        seller: product.shop.shopName,
        shopSlug: product.shop.shopSlug,
        moq: product.moq,
        stock: product.stock,
      });

      // Update quantity if needed
      if (quantity > 1) {
        updateQuantity(product.id, quantity);
      }

      // Sync with server if authenticated
      try {
        await cartApi.addToCart(product.id, quantity);
      } catch (apiError) {
        // If API call fails, item is still in local cart
        console.error("Failed to sync cart with server:", apiError);
      }

      toast.success("Added to cart!");

      // Ensure drawer is open to show the item
      if (!isOpen) {
        toggleCart();
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error(error?.message || "Failed to add to cart");
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };


  const discountPercentage = (product && product.compareAtPrice)
    ? Math.round(
      ((product.compareAtPrice - product.price) / product.compareAtPrice) *
      100
    )
    : 0;

  if (loading || !product) {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-r-2 border-taja-primary rounded-full animate-spin-reverse"></div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Initializing Luxury...</p>
          </div>
        </div>
      </>
    );
  }

  // Generate structured data
  const productStructuredData = generateProductStructuredData({
    name: product.title,
    description: product.description,
    image: product.images,
    price: product.price,
    currency: "NGN",
    availability: product.stock > 0 ? "in stock" : "out of stock",
    condition: product.condition,
    url: `/product/${product.slug}`,
    rating: product.shop.averageRating
      ? {
        value: product.shop.averageRating,
        count: product.reviews.length,
      }
      : undefined,
  });

  const breadcrumbs = generateBreadcrumbs([
    { name: "Home", url: "/" },
    { name: "Marketplace", url: "/marketplace" },
    { name: product.category || "Products", url: "/marketplace" },
    { name: product.title, url: `/product/${product.slug}` },
  ]);

  return (
    <>
      <StructuredData data={productStructuredData} />
      <StructuredData data={breadcrumbs} />
      <div className="min-h-screen bg-white text-taja-secondary selection:bg-taja-primary/30 selection:text-taja-secondary">
        <AppHeader />

        {/* Product Carousel / Full-Bleed Gallery for Mobile */}
        <div className="lg:hidden w-full relative aspect-square bg-slate-50 overflow-hidden">
          <ImageSlider
            images={product.images}
            className="w-full h-full"
            showDots
          />
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {discountPercentage > 0 && (
              <div className="bg-emerald-500 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-white fill-white" />
                <span className="text-[9px] font-black tracking-widest text-white uppercase">{discountPercentage}% OFF</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Product Showcase */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-6 sm:py-12 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-20">

            {/* Left Column: Desktop Visuals */}
            <div className="hidden lg:block lg:col-span-7 space-y-8">
              <div className="sticky top-32">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative aspect-[4/5] bg-slate-50 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-900/5"
                >
                  <Image
                    src={product.images[selectedImageIndex]}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />

                  {/* Gallery Overlays */}
                  <div className="absolute top-8 left-8 flex flex-col gap-3">
                    {discountPercentage > 0 && (
                      <div className="bg-emerald-500 px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
                        <Zap className="h-4 w-4 text-white fill-white animate-pulse" />
                        <span className="text-[10px] font-black tracking-widest text-white uppercase">{discountPercentage}% OFF</span>
                      </div>
                    )}
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 text-[10px] font-black tracking-widest text-taja-secondary uppercase shadow-lg">
                      {product.condition}
                    </div>
                  </div>
                </motion.div>

                {/* Thumbnails Mosaic */}
                {product.images.length > 1 && (
                  <div className="flex gap-4 mt-8 overflow-x-auto no-scrollbar pb-2">
                    {product.images.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={cn(
                          "relative flex-shrink-0 w-24 h-24 rounded-3xl overflow-hidden border-2 transition-all duration-500",
                          selectedImageIndex === index
                            ? "border-emerald-500 scale-105 shadow-xl rotate-0"
                            : "border-transparent opacity-60 hover:opacity-100 -rotate-2"
                        )}
                      >
                        <Image src={image} alt="" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="lg:col-span-5 space-y-10">
              <div className="space-y-6">
                {/* Meta Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 text-emerald-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-3 w-3 fill-emerald-500")} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Verified Elite Choice
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <Share2 className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <Heart className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-taja-secondary tracking-tighter leading-tight italic">
                    {product.title}
                  </h1>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-emerald-100 to-transparent"></div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Authentic Quality</span>
                  </div>
                </div>

                {/* Pricing & Offer */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-4">
                    <span className="text-4xl sm:text-5xl font-black text-taja-primary tracking-tighter">
                      ₦{product.price.toLocaleString()}
                      {product.maxPrice > product.price && (
                        <span className="text-3xl font-bold ml-1"> - ₦{product.maxPrice.toLocaleString()}</span>
                      )}
                    </span>
                    {product.compareAtPrice > product.price && (
                      <span className="text-xl text-gray-300 line-through decoration-emerald-500/30 decoration-2">
                        ₦{product.compareAtPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <Truck className="w-3 h-3" />
                    {product.shipping?.freeShipping ? "Complementary Elite Shipping" : "Priority Dispatch in 24h"}
                  </p>
                </div>
              </div>

              {/* Action Stack - Only visible on Desktop */}
              <div className="hidden lg:flex flex-col gap-4">
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-3xl border border-slate-100">
                  <div className="flex items-center bg-white rounded-2xl border border-slate-100 p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-taja-primary transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-sm font-black text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-taja-primary transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    variant="outline"
                    className={cn(
                      "flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border-emerald-500/20 hover:bg-emerald-50",
                      product.stock <= 0 && "opacity-50 cursor-not-allowed border-gray-100"
                    )}
                  >
                    {product.stock > 0 ? "Reserving Space" : "Unavailable"}
                  </Button>
                </div>
                <Button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className={cn(
                    "w-full h-16 rounded-[1.25rem] text-xs font-black uppercase tracking-[0.3em] shadow-premium bg-gradient-to-r from-taja-secondary to-slate-800",
                    product.stock <= 0 && "opacity-50 cursor-not-allowed grayscale"
                  )}
                >
                  {product.stock > 0 ? "Acquire Now" : "Out of Stock"}
                </Button>

                {product.stock <= 0 && product.shop.socialLinks.whatsapp && (
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <a
                      href={getWhatsAppUrl(product.shop.socialLinks.whatsapp, {
                        title: `Restock Inquiry: ${product.title}`,
                        price: product.price
                      }) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Inquire about Restock
                    </a>
                  </Button>
                )}
              </div>

              {/* Shop Profile Mini */}
              <Link
                href={`/shop/${product.shop.shopSlug}`}
                className="group flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white transition-all hover:shadow-xl hover:shadow-emerald-900/5"
              >
                <div className="flex items-center gap-5">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                    <Image
                      src={fallbackImage}
                      alt={product.shop.shopName}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-black text-taja-secondary group-hover:text-taja-primary transition-colors">{product.shop.shopName}</h4>
                      {product.shop.isVerified && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {product.shop.followers.toLocaleString()} Collectors • Level 5 Partner
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Trust Features */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3 p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100/50">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest leading-relaxed">
                    Escrow Protected<br />Secure Payment
                  </p>
                </div>
                <div className="flex flex-col gap-3 p-5 rounded-3xl bg-taja-primary/5 border border-taja-primary/10">
                  <Truck className="w-6 h-6 text-taja-primary" />
                  <p className="text-[10px] font-black text-taja-primary uppercase tracking-widest leading-relaxed">
                    Doorstep Delivery<br />Tracking Included
                  </p>
                </div>
              </div>

              <div className="space-y-6 pt-6">
                <div className="flex gap-4 border-b border-gray-100">
                  <button className="pb-4 text-[10px] font-black uppercase tracking-widest text-taja-secondary border-b-2 border-taja-primary">The Narrative</button>
                  <button className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Specifications</button>
                </div>
                <p className="text-gray-500 leading-relaxed text-sm lg:text-base italic">
                  "{product.description}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Global sticky bar for actions on Mobile */}
        <AnimatePresence>
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]"
          >
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                variant="outline"
                className={cn(
                  "flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] border-gray-200",
                  product.stock <= 0 && "opacity-50 cursor-not-allowed border-gray-100"
                )}
              >
                {product.stock > 0 ? "Reserve" : "Sold Out"}
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className={cn(
                  "flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] shadow-premium bg-gradient-to-r from-taja-primary to-emerald-700",
                  product.stock <= 0 && "opacity-50 cursor-not-allowed grayscale"
                )}
              >
                {product.stock > 0 ? "Acquire Now" : "Out of Stock"}
              </Button>

              {product.stock <= 0 && product.shop.socialLinks.whatsapp && (
                <Button
                  asChild
                  variant="outline"
                  className="w-14 h-14 rounded-2xl p-0 flex items-center justify-center border-emerald-500/20 text-emerald-600"
                >
                  <a
                    href={getWhatsAppUrl(product.shop.socialLinks.whatsapp, {
                      title: `Availability Inquiry: ${product.title}`,
                      price: product.price
                    }) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </a>
                </Button>
              )}
            </div>
            {/* Safe Area Spacer for iOS */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </AnimatePresence>

        {/* Recommendations Section */}
        <div className="bg-slate-50 border-t border-slate-200">
          <Container size="lg" className="py-24">
            <div className="mb-12">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] block mb-4">Curated Intelligence</span>
              <h2 className="text-4xl font-black text-taja-secondary tracking-tighter">You Might Also Prefer</h2>
            </div>
            {product.id && <AIRecommendations productId={product.id} limit={4} />}
          </Container>
        </div>
      </div>
    </>
  );
}
