"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { cartApi, productsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { StructuredData } from "@/components/StructuredData";
import { generateProductStructuredData, generateBreadcrumbs } from "@/lib/seo";
import { AIRecommendations } from "@/components/product/AIRecommendations";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout";
import { ProductReviews } from "@/components/product/ProductReviews";
import { useWishlistStore, type WishlistItem } from "@/components/wishlist";
import {
  ProductDetailGallery,
  ProductDetailMeta,
  ProductDetailTabs,
  ProductPurchaseActions,
  ProductShopSummary,
} from "@/components/product";

const fallbackImage = "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "specifications">("description");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const { addItem, updateQuantity, toggleCart, isOpen } = useCartStore();
  const { items: wishlistItems, toggleWishlistItem } = useWishlistStore();

  const isWishlisted = product
    ? wishlistItems.some((item) => item._id === product.id)
    : false;

  const handleToggleWishlist = async () => {
    if (!product) return;

    const wishlistPayload: WishlistItem = {
      _id: product.id,
      title: product.title,
      price: product.price,
      images: product.images?.length ? product.images : [fallbackImage],
      slug: product.slug,
      shop: {
        shopName: product.shop?.shopName || "Shop",
        shopSlug: product.shop?.shopSlug || product.slug,
      },
      inventory: {
        quantity: product.stock ?? 0,
      },
      status: "active",
    };

    const nowWishlisted = await toggleWishlistItem(wishlistPayload);
    toast.success(nowWishlisted ? "Added to wishlist" : "Removed from wishlist");
  };

  const handleShare = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : `/product/${product?.slug}`;
      const title = product?.title || "Taja product";

      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title,
          text: `Check this out on Taja: ${title}`,
          url,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } else {
        toast.error("Sharing is not supported on this device.");
      }
    } catch (err) {
      console.error("Share failed", err);
      toast.error("Unable to share right now.");
    }
  };

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
            logo: productData.shop?.logo || productData.seller?.avatar || "",
            ownerName: productData.seller?.fullName || productData.shop?.owner?.fullName || "",
            sellerAvatar: productData.seller?.avatar || "",
          },
          reviews: productData.reviews || [],
          relatedProducts: productData.relatedProducts || [],
          variants: productData.variants || [],
        };

        setProduct(transformedProduct);
        if (transformedProduct.variants?.length > 0) {
          setSelectedVariantId(transformedProduct.variants[0]._id || transformedProduct.variants[0].id);
        }
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
      const selectedVariant = product.variants?.find((v: any) => (v._id || v.id) === selectedVariantId);
      const finalPrice = selectedVariant?.price || product.price;
      const variantImage = selectedVariant?.image;
      const cartImages = variantImage ? [variantImage, ...(product.images || [])] : product.images;

      const availableStock = selectedVariant?.stock ?? product.stock;
      if (!availableStock || availableStock <= 0) {
        toast.error("This item is currently out of stock.");
        return;
      }

      // Add to local cart store
      addItem({
        _id: product.id,
        title: product.title,
        price: finalPrice,
        images: cartImages,
        seller: product.shop.shopName,
        shopSlug: product.shop.shopSlug,
        moq: product.moq,
        stock: selectedVariant?.stock ?? product.stock,
        variantId: selectedVariantId || undefined,
        variantName: selectedVariant?.name || undefined,
      });

      // Update quantity if needed
      if (quantity > 1) {
        updateQuantity(product.id, selectedVariantId || undefined, quantity);
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

        <ProductDetailGallery
          product={product}
          discountPercentage={discountPercentage}
          selectedImageIndex={selectedImageIndex}
          setSelectedImageIndex={setSelectedImageIndex}
          showDesktop={false}
        />

        {/* Main Product Showcase */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-6 sm:py-12 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-20">
            <ProductDetailGallery
              product={product}
              discountPercentage={discountPercentage}
              selectedImageIndex={selectedImageIndex}
              setSelectedImageIndex={setSelectedImageIndex}
              showMobile={false}
            />

            {/* Right Column: Details */}
            <div className="lg:col-span-5 space-y-10">
              <ProductDetailMeta
                product={product}
                selectedVariantId={selectedVariantId}
                setSelectedVariantId={setSelectedVariantId}
                isWishlisted={isWishlisted}
                onShare={handleShare}
                onToggleWishlist={handleToggleWishlist}
              />
              <ProductPurchaseActions
                product={product}
                quantity={quantity}
                setQuantity={setQuantity}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                getWhatsAppUrl={getWhatsAppUrl}
              />
              <ProductShopSummary product={product} fallbackImage={fallbackImage} />
              <ProductDetailTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                description={product.description}
                specifications={product.specifications}
              />
            </div>
          </div>

          {/* Reviews Section Implementation */}
          <Container size="lg" className="mt-32 pt-32 border-t border-slate-100">
            <div className="mb-12">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] block mb-4">Client Testimonials</span>
              <h2 className="text-4xl font-black text-taja-secondary tracking-tighter italic">Verified Narratives</h2>
            </div>
            <ProductReviews productId={product.id} shopId={product.shop.shopId} />
          </Container>
        </div>

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
      </div >
    </>
  );
}
