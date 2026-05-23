// @ts-nocheck
"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  Grid,
  List,
  Heart,
  ShoppingBag,
  Star,
  ChevronDown,
  X,
  SlidersHorizontal,
  SortAsc,
  SortDesc,
  MapPin,
  Clock,
  Eye,
  Share2,
  MoreHorizontal,
  CheckCircle,
  Shield,
  Truck,
  CreditCard,
  Headphones,
  Zap,
  Target,
  TrendingUp,
  Award,
  Crown,
  Diamond,
  Gem,
  Trophy,
  Sparkles,
  Wand2,
  Rocket,
  BarChart3,
  PieChart,
  Activity,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Download,
  MessageCircle,
  Flag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Menu,
  Calendar,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  Phone,
  Mail,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Github,
  ExternalLink,
  Check,
  X as XIcon,
  Minus,
  Plus,
  Edit3,
  Copy,
  Bookmark,
  Settings,
  HelpCircle,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  InfoIcon,
  Lightbulb,
  LightbulbOff,

  Calendar as CalendarIcon,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarSearch,
  CalendarHeart,
  CalendarStar,
  CalendarClock,
  CalendarUser,
  CalendarEdit,
  CalendarTrash,
  CalendarSettings,
  CalendarDownload,
  CalendarUpload,
  CalendarShare,
  CalendarCopy,
  CalendarMove,
  CalendarArchive,
  CalendarUnarchive,
  CalendarLock,
  CalendarUnlock,
  CalendarEye,
  CalendarEyeOff,
  CalendarPlus2,
  CalendarMinus2,
  CalendarX2,
  CalendarCheck2,
  CalendarHeart2,
  CalendarStar2,
  CalendarClock2,
  CalendarUser2,
  CalendarEdit2,
  CalendarTrash2,
  CalendarSettings2,
  CalendarDownload2,
  CalendarUpload2,
  CalendarShare2,
  CalendarCopy2,
  CalendarMove2,
  CalendarArchive2,
  CalendarUnarchive2,
  CalendarLock2,
  CalendarUnlock2,
  CalendarEye2,
  CalendarEyeOff2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { Slider } from "@/components/ui/Slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Separator } from "@/components/ui/Separator";
import { MediaSlider } from "@/components/ui/MediaSlider";
import { CATEGORIES } from "@/lib/constants/categories";

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  videos?: {
    url: string;
    thumbnail?: string;
    duration?: number;
    type: "video";
  }[];
  condition: "new" | "like-new" | "good" | "fair" | "poor";
  category: string;
  subcategory?: string;
  shop: {
    shopName: string;
    shopSlug: string;
    isVerified: boolean;
    averageRating: number;
  };
  location: string;
  createdAt: Date;
  stats: {
    views: number;
    likes: number;
    shares: number;
  };
  specifications: {
    brand?: string;
    size?: string;
    color?: string;
    material?: string;
    gender?: "men" | "women" | "unisex" | "kids";
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: any; // Changed from string to any for Lucide components
  subcategories: Category[];
}

const categories = CATEGORIES.map((cat, index) => ({
  _id: (index + 1).toString(),
  name: cat.label,
  slug: cat.slug,
  icon: cat.icon,
  subcategories: [], // Standard categories are currently flat
}));

const mockProducts: Product[] = [
  {
    id: "1",
    slug: "vintage-denim-jacket",
    title: "Vintage Denim Jacket",
    price: 15000,
    compareAtPrice: 25000,
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
      "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400",
      "https://images.unsplash.com/photo-1525450824786-227cbef70703?w=400",
    ],
    videos: [
      {
        url: "https://example.com/video1.mp4",
        thumbnail:
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
        duration: 30,
        type: "video",
      },
    ],
    condition: "like-new",
    category: "1",
    subcategory: "1-1",
    shop: {
      shopName: "Amina Thrift",
      shopSlug: "amina-thrift",
      isVerified: true,
      averageRating: 4.8,
    },
    location: "Lagos",
    createdAt: new Date(),
    stats: {
      views: 150,
      likes: 23,
      shares: 5,
    },
    specifications: {
      brand: "Levi's",
      size: "M",
      color: "Blue",
      material: "Denim",
      gender: "women",
    },
  },
  // Add more mock products...
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
];

const conditionOptions = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export default function EnhancedMarketplacePage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] =
    useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const selectedCategoryData = categories.find(
    (cat) => cat._id === selectedCategory
  );
  const subcategories = selectedCategoryData?.subcategories || [];

  useEffect(() => {
    filterProducts();
  }, [
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    selectedCondition,
    priceRange,
    sortBy,
    products,
  ]);

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.shop.shopName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          product.specifications.brand
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Subcategory filter
    if (selectedSubcategory) {
      filtered = filtered.filter(
        (product) => product.subcategory === selectedSubcategory
      );
    }

    // Condition filter
    if (selectedCondition.length > 0) {
      filtered = filtered.filter((product) =>
        selectedCondition.includes(product.condition)
      );
    }

    // Price range filter
    filtered = filtered.filter(
      (product) =>
        product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        filtered.sort((a, b) => b.stats.views - a.stats.views);
        break;
      case "rating":
        filtered.sort((a, b) => b.shop.averageRating - a.shop.averageRating);
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleConditionChange = (condition: string, checked: boolean) => {
    if (checked) {
      setSelectedCondition([...selectedCondition, condition]);
    } else {
      setSelectedCondition(selectedCondition.filter((c) => c !== condition));
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedCondition([]);
    setPriceRange([0, 1000000]);
    setSortBy("newest");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getDiscountPercentage = (price: number, compareAtPrice: number) => {
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const mediaItems = [
      ...product.images.map((img) => ({
        id: img,
        url: img,
        type: "image" as const,
      })),
      ...(product.videos || []).map((video) => ({
        id: video.url,
        url: video.url,
        type: "video" as const,
        thumbnail: video.thumbnail,
        duration: video.duration,
      })),
    ];

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="relative">
          <MediaSlider
            media={mediaItems}
            className="aspect-square"
            showControls={true}
            showThumbnails={false}
            autoPlay={false}
            loop={true}
            showFullscreen={true}
            showDownload={false}
            showShare={true}
            showLike={true}
            showComment={true}
            onLike={(mediaId) => console.log("Like:", mediaId)}
            onComment={(mediaId) => console.log("Comment:", mediaId)}
            onShare={(mediaId) => console.log("Share:", mediaId)}
          />

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className="h-4 w-4" />
          </Button>

          {/* Discount Badge */}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
              -{getDiscountPercentage(product.price, product.compareAtPrice)}%
            </Badge>
          )}

          {/* Condition Badge */}
          <Badge
            variant="secondary"
            className="absolute bottom-2 left-2 capitalize"
          >
            {product.condition.replace("-", " ")}
          </Badge>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-taja-primary transition-colors">
              {product.title}
            </h3>

            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-taja-primary">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice &&
                product.compareAtPrice > product.price && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {product.shop.shopName}
                </span>
                {product.shop.isVerified && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">
                  {product.shop.averageRating}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{product.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{product.stats.views}</span>
              </div>
            </div>

            {product.specifications.brand && (
              <div className="text-sm text-gray-600">
                Brand: {product.specifications.brand}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {filteredProducts.length} products
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search products, brands, or shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div
            className={`lg:w-80 ${showFilters ? "block" : "hidden lg:block"}`}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Filters</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-sm"
                  >
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Categories */}
                <div>
                  <h4 className="font-medium mb-3">Categories</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category._id}>
                        <button
                          onClick={() => {
                            setSelectedCategory(
                              selectedCategory === category._id
                                ? ""
                                : category._id
                            );
                            setSelectedSubcategory("");
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-gray-50 ${selectedCategory === category._id
                            ? "bg-taja-primary/10 text-taja-primary"
                            : ""
                            }`}
                        >
                          <div className="flex items-center space-x-2">
                            <category.icon className="h-4 w-4" />
                            <span>{category.name}</span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${selectedCategory === category._id
                              ? "rotate-180"
                              : ""
                              }`}
                          />
                        </button>

                        {selectedCategory === category._id && (
                          <div className="ml-6 mt-2 space-y-1">
                            {category.subcategories.map((subcategory) => (
                              <button
                                key={subcategory._id}
                                onClick={() =>
                                  setSelectedSubcategory(
                                    selectedSubcategory === subcategory._id
                                      ? ""
                                      : subcategory._id
                                  )
                                }
                                className={`w-full flex items-center space-x-2 p-2 rounded-lg text-left hover:bg-gray-50 ${selectedSubcategory === subcategory._id
                                  ? "bg-taja-primary/10 text-taja-primary"
                                  : ""
                                  }`}
                              >
                                <subcategory.icon className="h-3 w-3" />
                                <span className="text-sm">
                                  {subcategory.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Price Range */}
                <div>
                  <h4 className="font-medium mb-3">Price Range</h4>
                  <div className="space-y-4">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000000}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{formatPrice(priceRange[0])}</span>
                      <span>{formatPrice(priceRange[1])}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Condition */}
                <div>
                  <h4 className="font-medium mb-3">Condition</h4>
                  <div className="space-y-2">
                    {conditionOptions.map((condition) => (
                      <div
                        key={condition.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={condition.value}
                          checked={selectedCondition.includes(condition.value)}
                          onCheckedChange={(checked) =>
                            handleConditionChange(
                              condition.value,
                              checked as boolean
                            )
                          }
                        />
                        <label
                          htmlFor={condition.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {condition.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Sort */}
                <div>
                  <h4 className="font-medium mb-3">Sort By</h4>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-taja-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <div
                className={`grid gap-6 ${viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
                  }`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Load More */}
            {filteredProducts.length > 0 && (
              <div className="mt-12 text-center">
                <Button variant="outline" size="lg">
                  Load More Products
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


